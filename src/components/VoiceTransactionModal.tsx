import { useEffect, useRef, useState } from 'react';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Button } from './ui/Button';

interface VoiceTransactionModalProps {
  onClose: () => void;
  onAdd: (
    description: string,
    amount: number,
    type: 'income' | 'expense',
    category: string
  ) => Promise<string>;
  onDelete: (id: string) => Promise<void>;
}

interface VoiceSavedEntry {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
}

type VoiceStatus = 'connecting' | 'listening' | 'speaking' | 'muted' | 'error';

const EXAMPLE_PHRASES = [
  'Gastei 42 reais no almoço de hoje',
  'Paguei 120 reais de internet em Moradia',
  'Recebi 850 reais de freelance',
];

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function downsampleTo16k(input: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === 16000) return input;
  const ratio = inputSampleRate / 16000;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const result = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      sum += input[j];
      count++;
    }
    result[i] = count > 0 ? sum / count : input[Math.min(start, input.length - 1)];
  }
  return result;
}

function float32ToPcmBase64(samples: Float32Array): string {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function pcm24kBase64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const byteLength = binary.length;
  const bytes = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  const sampleCount = Math.floor(byteLength / 2);
  const float32 = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    float32[i] = view.getInt16(i * 2, true) / 32768;
  }
  return float32;
}

export function VoiceTransactionModal({
  onClose,
  onAdd,
  onDelete,
}: VoiceTransactionModalProps) {
  const [status, setStatus] = useState<VoiceStatus>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [userTranscript, setUserTranscript] = useState('');
  const [assistantTranscript, setAssistantTranscript] = useState('');
  const [savedEntries, setSavedEntries] = useState<VoiceSavedEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionSeed, setSessionSeed] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isMutedRef = useRef(false);
  const onAddRef = useRef(onAdd);
  const turnCompletedRef = useRef(false);
  const closedByUserRef = useRef(false);

  useEffect(() => {
    onAddRef.current = onAdd;
  }, [onAdd]);

  const stopQueuedPlayback = () => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Already stopped
      }
    });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  useEffect(() => {
    closedByUserRef.current = false;
    let mounted = true;

    const cleanup = () => {
      stopQueuedPlayback();
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
        processorRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (inputCtxRef.current) {
        void inputCtxRef.current.close().catch(() => {});
        inputCtxRef.current = null;
      }
      if (outputCtxRef.current) {
        void outputCtxRef.current.close().catch(() => {});
        outputCtxRef.current = null;
      }
      if (wsRef.current) {
        if (
          wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING
        ) {
          wsRef.current.close();
        }
        wsRef.current = null;
      }
    };

    const startSession = async () => {
      setStatus('connecting');
      setErrorMessage('');

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('error');
        setErrorMessage('Seu navegador não suporta captura de áudio pelo microfone.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const inputCtx = new AudioContext({ sampleRate: 16000 });
        const outputCtx = new AudioContext({ sampleRate: 24000 });
        inputCtxRef.current = inputCtx;
        outputCtxRef.current = outputCtx;

        if (inputCtx.state === 'suspended') await inputCtx.resume();
        if (outputCtx.state === 'suspended') await outputCtx.resume();

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${wsProtocol}//${window.location.host}/live`);
        wsRef.current = ws;

        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(inputCtx.destination);

        processor.onaudioprocess = (event) => {
          const channelData = event.inputBuffer.getChannelData(0);

          if (isMutedRef.current) {
            setAudioLevel(0);
            return;
          }

          let sumSquares = 0;
          for (let i = 0; i < channelData.length; i++) {
            sumSquares += channelData[i] * channelData[i];
          }
          const rms = Math.sqrt(sumSquares / channelData.length);
          setAudioLevel(Math.min(1, rms * 8));

          if (ws.readyState === WebSocket.OPEN) {
            const downsampled = downsampleTo16k(channelData, inputCtx.sampleRate);
            const base64Audio = float32ToPcmBase64(downsampled);
            ws.send(JSON.stringify({ audio: base64Audio }));
          }
        };

        ws.onmessage = async (event) => {
          if (!mounted) return;
          try {
            const msg = JSON.parse(event.data as string) as {
              ready?: boolean;
              audio?: string;
              interrupted?: boolean;
              turnComplete?: boolean;
              inputTranscript?: string;
              outputTranscript?: string;
              toolCall?: {
                id: string;
                name: string;
                args: Record<string, unknown>;
              };
              error?: string;
              closed?: boolean;
            };

            if (msg.ready) {
              setStatus(isMutedRef.current ? 'muted' : 'listening');
              return;
            }

            if (msg.error) {
              setStatus('error');
              setErrorMessage(msg.error);
              return;
            }

            if (msg.closed) {
              if (!closedByUserRef.current) {
                setStatus('error');
                setErrorMessage('A sessão de voz foi encerrada. Clique em reconectar para continuar.');
              }
              return;
            }

            if (msg.inputTranscript) {
              if (turnCompletedRef.current) {
                setUserTranscript(msg.inputTranscript);
                setAssistantTranscript('');
                turnCompletedRef.current = false;
              } else {
                setUserTranscript((prev) => `${prev}${msg.inputTranscript}`);
              }
            }

            if (msg.outputTranscript) {
              setAssistantTranscript((prev) => `${prev}${msg.outputTranscript}`);
            }

            if (msg.interrupted) {
              stopQueuedPlayback();
              setStatus(isMutedRef.current ? 'muted' : 'listening');
            }

            if (msg.audio && outputCtxRef.current) {
              setStatus('speaking');
              const ctx = outputCtxRef.current;
              if (ctx.state === 'suspended') {
                await ctx.resume();
              }
              const samples = pcm24kBase64ToFloat32(msg.audio);
              const audioBuffer = ctx.createBuffer(1, samples.length, 24000);
              audioBuffer.getChannelData(0).set(samples);

              const bufferSource = ctx.createBufferSource();
              bufferSource.buffer = audioBuffer;
              bufferSource.connect(ctx.destination);

              const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current);
              bufferSource.start(startTime);
              nextStartTimeRef.current = startTime + audioBuffer.duration;

              activeSourcesRef.current.add(bufferSource);
              bufferSource.onended = () => {
                activeSourcesRef.current.delete(bufferSource);
                if (activeSourcesRef.current.size === 0 && mounted) {
                  setStatus(isMutedRef.current ? 'muted' : 'listening');
                }
              };
            }

            if (msg.turnComplete) {
              turnCompletedRef.current = true;
              if (activeSourcesRef.current.size === 0) {
                setStatus(isMutedRef.current ? 'muted' : 'listening');
              }
            }

            if (msg.toolCall && msg.toolCall.name === 'register_transaction') {
              const args = msg.toolCall.args;
              const rawDescription = String(args.description ?? '').trim().slice(0, 120);
              const rawAmount = Number(args.amount);
              const rawType = args.type === 'income' ? 'income' : 'expense';
              const rawCategory = String(args.category ?? 'Outros').trim().slice(0, 40) || 'Outros';

              if (
                !rawDescription ||
                !Number.isFinite(rawAmount) ||
                rawAmount <= 0 ||
                rawAmount > 1000000000
              ) {
                ws.send(
                  JSON.stringify({
                    toolResponse: {
                      id: msg.toolCall.id,
                      name: msg.toolCall.name,
                      response: {
                        success: false,
                        error: 'Dados da transação inválidos ou incompletos.',
                      },
                    },
                  })
                );
                return;
              }

              try {
                const createdId = await onAddRef.current(
                  rawDescription,
                  rawAmount,
                  rawType,
                  rawCategory
                );

                if (mounted) {
                  setSavedEntries((prev) => [
                    {
                      id: createdId || `${Date.now()}`,
                      description: rawDescription,
                      amount: rawAmount,
                      type: rawType,
                      category: rawCategory,
                    },
                    ...prev,
                  ]);
                }

                ws.send(
                  JSON.stringify({
                    toolResponse: {
                      id: msg.toolCall.id,
                      name: msg.toolCall.name,
                      response: {
                        success: true,
                        transaction: {
                          description: rawDescription,
                          amount: rawAmount,
                          type: rawType,
                          category: rawCategory,
                        },
                      },
                    },
                  })
                );
              } catch (saveErr) {
                const errMsg =
                  saveErr instanceof Error
                    ? saveErr.message
                    : 'Erro ao salvar transação no banco de dados.';
                setErrorMessage(errMsg);
                ws.send(
                  JSON.stringify({
                    toolResponse: {
                      id: msg.toolCall.id,
                      name: msg.toolCall.name,
                      response: { success: false, error: errMsg },
                    },
                  })
                );
              }
            }
          } catch (parseErr) {
            console.error('Erro ao processar resposta de voz:', parseErr);
          }
        };

        ws.onerror = () => {
          if (!mounted || closedByUserRef.current) return;
          setStatus('error');
          setErrorMessage('Falha na conexão em tempo real com o servidor de voz.');
        };

        ws.onclose = () => {
          if (!mounted || closedByUserRef.current) return;
          setStatus((current) => (current === 'error' ? current : 'error'));
        };
      } catch (err) {
        if (!mounted) return;
        setStatus('error');
        setErrorMessage(
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Permissão de microfone negada. Autorize o microfone no navegador para adicionar transações por voz.'
            : err instanceof Error
            ? err.message
            : 'Não foi possível acessar o microfone.'
        );
      }
    };

    void startSession();

    return () => {
      mounted = false;
      closedByUserRef.current = true;
      cleanup();
    };
  }, [sessionSeed]);

  const toggleMute = () => {
    const next = !isMuted;
    isMutedRef.current = next;
    setIsMuted(next);
    if (status !== 'error' && status !== 'connecting') {
      setStatus(next ? 'muted' : 'listening');
    }
  };

  const handleSendExample = (phrase: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    setUserTranscript(phrase);
    setAssistantTranscript('');
    wsRef.current.send(JSON.stringify({ text: phrase }));
  };

  const handleUndoSaved = async (id: string) => {
    await onDelete(id);
    setSavedEntries((prev) => prev.filter((item) => item.id !== id));
  };

  const statusLabel =
    status === 'connecting'
      ? 'Conectando assistente de voz...'
      : status === 'speaking'
      ? 'Assistente falando...'
      : status === 'muted'
      ? 'Microfone silenciado'
      : status === 'error'
      ? 'Sessão desconectada'
      : 'Ouvindo... pode falar sua transação';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal voice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="voice-modal-title-group">
            <h3 className="modal-title">Adicionar Transação por Voz</h3>
            <span className={`voice-status-badge voice-status-${status}`}>
              {status === 'speaking' ? <Volume2 size={14} /> : <Mic size={14} />}
              {statusLabel}
            </span>
          </div>
          <button type="button" onClick={onClose} className="modal-close" aria-label="Fechar">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body voice-modal-body">
          <div className="voice-orb-section">
            <button
              type="button"
              onClick={toggleMute}
              disabled={status === 'connecting' || status === 'error'}
              className={`voice-mic-button ${
                status === 'listening'
                  ? 'voice-mic-listening'
                  : status === 'speaking'
                  ? 'voice-mic-speaking'
                  : ''
              }`}
              style={{
                boxShadow:
                  status === 'listening'
                    ? `0 0 0 ${Math.round(6 + audioLevel * 18)}px rgba(34, 197, 94, 0.22)`
                    : undefined,
              }}
              aria-label={isMuted ? 'Ativar microfone' : 'Silenciar microfone'}
            >
              {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
            <p className="voice-hint-text">
              Fale naturalmente algo como: <strong>&ldquo;Gastei 38 reais no almoço&rdquo;</strong> ou{' '}
              <strong>&ldquo;Recebi 1500 de salário&rdquo;</strong>.
            </p>
          </div>

          {(userTranscript || assistantTranscript) && (
            <div className="voice-transcript-box">
              {userTranscript && (
                <div className="voice-transcript-line">
                  <span className="voice-transcript-role">Você:</span>
                  <span>{userTranscript}</span>
                </div>
              )}
              {assistantTranscript && (
                <div className="voice-transcript-line voice-transcript-assistant">
                  <span className="voice-transcript-role">Assistente:</span>
                  <span>{assistantTranscript}</span>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="voice-error-box">
              <span>{errorMessage}</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={14} />}
                onClick={() => setSessionSeed((s) => s + 1)}
              >
                Reconectar
              </Button>
            </div>
          )}

          <div className="voice-examples-section">
            <span className="voice-examples-label">Exemplos rápidos (ou clique para testar):</span>
            <div className="voice-examples-list">
              {EXAMPLE_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  className="voice-example-chip"
                  disabled={status === 'connecting' || status === 'error'}
                  onClick={() => handleSendExample(phrase)}
                >
                  &ldquo;{phrase}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {savedEntries.length > 0 && (
            <div className="voice-saved-section">
              <div className="voice-saved-header">
                <CheckCircle2 size={16} className="text-primary" />
                <span>Registradas nesta conversa ({savedEntries.length})</span>
              </div>
              <div className="voice-saved-list">
                {savedEntries.map((entry) => (
                  <div key={entry.id} className="voice-saved-item">
                    <div className="voice-saved-left">
                      <span
                        className={`voice-saved-icon ${
                          entry.type === 'income' ? 'income' : 'expense'
                        }`}
                      >
                        {entry.type === 'income' ? (
                          <TrendingUp size={15} />
                        ) : (
                          <TrendingDown size={15} />
                        )}
                      </span>
                      <div>
                        <div className="voice-saved-desc">{entry.description}</div>
                        <div className="voice-saved-cat">{entry.category}</div>
                      </div>
                    </div>
                    <div className="voice-saved-right">
                      <span
                        className={
                          entry.type === 'income'
                            ? 'transaction-amount-income'
                            : 'transaction-amount-expense'
                        }
                      >
                        {entry.type === 'income' ? '+' : '-'}R$ {formatBRL(entry.amount)}
                      </span>
                      {entry.id && (
                        <button
                          type="button"
                          className="transaction-delete"
                          onClick={() => void handleUndoSaved(entry.id)}
                          title="Desfazer lançamento"
                          aria-label="Desfazer lançamento"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <Button
            type="button"
            variant="secondary"
            onClick={toggleMute}
            disabled={status === 'connecting' || status === 'error'}
            icon={isMuted ? <Mic size={16} /> : <MicOff size={16} />}
          >
            {isMuted ? 'Ativar Microfone' : 'Silenciar'}
          </Button>
          <Button type="button" variant="primary" onClick={onClose}>
            Concluir
          </Button>
        </div>
      </div>
    </div>
  );
}
