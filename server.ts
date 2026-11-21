import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  GoogleGenAI,
  Modality,
  Type,
  type FunctionDeclaration,
  type LiveServerMessage,
  type Session,
} from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

const SYSTEM_INSTRUCTION = [
  'Você é o assistente financeiro por voz do GranaMax, falando sempre em português do Brasil de forma natural, simpática e objetiva.',
  'Sua função principal é ajudar o usuário a registrar despesas e receitas por voz.',
  'Quando o usuário informar uma despesa ou receita com descrição e valor (por exemplo: "Gastei 45 reais no almoço" ou "Recebi 1200 de freelance"), chame imediatamente a função register_transaction.',
  'Infira automaticamente o tipo ("expense" para gastos, compras, contas ou pagamentos; "income" para salário, ganhos, vendas ou recebimentos) e escolha a melhor categoria entre: "Alimentação", "Moradia", "Transporte", "Saúde", "Lazer", "Educação", "Salário" ou "Outros".',
  'Se faltar o valor ou se não estiver claro o que registrar, faça uma pergunta curta antes de chamar a função.',
  'Após receber o resultado da ferramenta register_transaction, confirme em uma frase curta o valor, a descrição e a categoria, e pergunte se deseja lançar mais alguma transação.',
].join(' ');

const registerTransactionDeclaration: FunctionDeclaration = {
  name: 'register_transaction',
  description:
    'Registra uma transação financeira (receita ou despesa) no GranaMax a partir da fala do usuário.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      description: {
        type: Type.STRING,
        description:
          'Descrição curta da transação (ex: "Almoço", "Supermercado", "Uber", "Salário"). Máximo de 120 caracteres.',
      },
      amount: {
        type: Type.NUMBER,
        description: 'Valor numérico positivo em reais (ex: 45.9). Deve ser maior que zero.',
      },
      type: {
        type: Type.STRING,
        description:
          'Tipo da transação: "expense" para despesa ou "income" para receita.',
        enum: ['expense', 'income'],
      },
      category: {
        type: Type.STRING,
        description:
          'Categoria em português: "Alimentação", "Moradia", "Transporte", "Saúde", "Lazer", "Educação", "Salário" ou "Outros".',
      },
    },
    required: ['description', 'amount', 'type', 'category'],
  },
};

function createAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no servidor.');
  }

  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      apiVersion: 'v1beta',
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface ForecastCategoryInput {
  name: string;
  currentMonth: number;
  lastMonth: number;
  count: number;
}

interface ForecastRequestBody {
  monthLabel?: string;
  daysElapsed?: number;
  daysRemaining?: number;
  currentMonthExpenses?: number;
  lastMonthExpenses?: number;
  totalIncome?: number;
  currentBalance?: number;
  monthlyBudgetLimit?: number | null;
  pendingRecurringExpenses?: number;
  investmentTotal?: number;
  projectedMathTotal?: number;
  categoryBreakdown?: ForecastCategoryInput[];
}

function sendJson(ws: WebSocket, payload: Record<string, unknown>) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/pro/spending-forecast', async (req, res) => {
    try {
      const body = (req.body ?? {}) as ForecastRequestBody;
      const monthLabel = String(body.monthLabel || 'Mês atual').slice(0, 60);
      const daysElapsed = Math.max(1, Math.min(31, Number(body.daysElapsed) || 1));
      const daysRemaining = Math.max(0, Math.min(31, Number(body.daysRemaining) || 0));
      const currentMonthExpenses = Math.max(0, Number(body.currentMonthExpenses) || 0);
      const lastMonthExpenses = Math.max(0, Number(body.lastMonthExpenses) || 0);
      const totalIncome = Math.max(0, Number(body.totalIncome) || 0);
      const currentBalance = Number(body.currentBalance) || 0;
      const monthlyBudgetLimit =
        body.monthlyBudgetLimit !== null && body.monthlyBudgetLimit !== undefined
          ? Math.max(0, Number(body.monthlyBudgetLimit) || 0)
          : null;
      const pendingRecurringExpenses = Math.max(0, Number(body.pendingRecurringExpenses) || 0);
      const investmentTotal = Math.max(0, Number(body.investmentTotal) || 0);
      const projectedMathTotal = Math.max(
        currentMonthExpenses,
        Number(body.projectedMathTotal) || currentMonthExpenses + pendingRecurringExpenses
      );
      const categories = Array.isArray(body.categoryBreakdown)
        ? body.categoryBreakdown.slice(0, 12).map((c) => ({
            name: String(c?.name || 'Outros').slice(0, 40),
            currentMonth: Math.max(0, Number(c?.currentMonth) || 0),
            lastMonth: Math.max(0, Number(c?.lastMonth) || 0),
            count: Math.max(0, Math.round(Number(c?.count) || 0)),
          }))
        : [];

      const ai = createAiClient();

      const prompt = [
        `Analise os dados financeiros mensais do usuário do GranaMax PRO referentes a "${monthLabel}" e gere uma previsão inteligente de gastos em português do Brasil.`,
        '',
        'DADOS FINANCEIROS (em Reais - BRL):',
        `- Dias decorridos no mês: ${daysElapsed} | Dias restantes: ${daysRemaining}`,
        `- Despesas acumuladas no mês atual: R$ ${currentMonthExpenses.toFixed(2)}`,
        `- Projeção matemática base (ritmo diário + contas recorrentes pendentes): R$ ${projectedMathTotal.toFixed(2)}`,
        `- Contas recorrentes ainda pendentes neste mês: R$ ${pendingRecurringExpenses.toFixed(2)}`,
        `- Total de despesas no mês anterior: R$ ${lastMonthExpenses.toFixed(2)}`,
        `- Receitas no mês atual: R$ ${totalIncome.toFixed(2)}`,
        `- Saldo atual no mês: R$ ${currentBalance.toFixed(2)}`,
        `- Meta de orçamento mensal definida: ${monthlyBudgetLimit !== null ? `R$ ${monthlyBudgetLimit.toFixed(2)}` : 'Não definida'}`,
        `- Patrimônio total na carteira de investimentos: R$ ${investmentTotal.toFixed(2)}`,
        `- Detalhamento por categoria: ${JSON.stringify(categories)}`,
        '',
        'INSTRUÇÕES:',
        '- Classifique riskLevel como "low" (controlado), "medium" (atenção) ou "high" (crítico).',
        '- Escreva summary claro e direto em 2 a 3 frases (sem jargões excessivos).',
        '- Estime projectedMonthTotal coerente com o ritmo atual e contas pendentes.',
        '- Estime potentialMonthlySavings (economia realista possível no restante do mês ou no próximo mês).',
        '- Liste até 3 pressureCategories com nome da categoria, motivo curto e teto sugerido em reais.',
        '- Liste de 3 a 4 actionableTips práticas, específicas aos números informados.',
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          abortSignal: AbortSignal.timeout(25000),
          systemInstruction:
            'Você é um planejador financeiro pessoal sênior do GranaMax PRO. Responda exclusivamente em português do Brasil, de forma objetiva, precisa e orientada a números reais.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskLevel: {
                type: Type.STRING,
                enum: ['low', 'medium', 'high'],
                description: 'Nível de risco do orçamento mensal',
              },
              summary: {
                type: Type.STRING,
                description: 'Resumo executivo da previsão de gastos em 2 a 3 frases',
              },
              projectedMonthTotal: {
                type: Type.NUMBER,
                description: 'Valor total estimado de despesas até o final do mês em reais',
              },
              potentialMonthlySavings: {
                type: Type.NUMBER,
                description: 'Economia mensal potencial realista em reais',
              },
              pressureCategories: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    suggestedLimit: { type: Type.NUMBER },
                  },
                  required: ['category', 'reason', 'suggestedLimit'],
                },
                description: 'Categorias que mais pressionam o orçamento',
              },
              actionableTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Lista de 3 a 4 recomendações práticas e acionáveis',
              },
            },
            required: [
              'riskLevel',
              'summary',
              'projectedMonthTotal',
              'potentialMonthlySavings',
              'pressureCategories',
              'actionableTips',
            ],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'A IA retornou uma resposta vazia. Tente novamente.' });
        return;
      }

      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      res.json({
        ...parsed,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível gerar a previsão inteligente de gastos.';
      console.error('Erro em /api/pro/spending-forecast:', err);
      res.status(500).json({ error: message });
    }
  });

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const host = request.headers.host || 'localhost';
    const url = new URL(request.url || '/', `http://${host}`);
    if (url.pathname === '/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs) => {
    let session: Session | null = null;
    let isClosing = false;

    const pendingMessages: Array<{
      audio?: string;
      text?: string;
      toolResponse?: {
        id: string;
        name: string;
        response: Record<string, unknown>;
      };
    }> = [];

    clientWs.on('message', (rawData) => {
      try {
        const parsed = JSON.parse(rawData.toString()) as {
          audio?: string;
          text?: string;
          toolResponse?: {
            id: string;
            name: string;
            response: Record<string, unknown>;
          };
        };

        if (!session) {
          if (pendingMessages.length < 30) {
            pendingMessages.push(parsed);
          }
          return;
        }

        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: {
              data: parsed.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (parsed.text) {
          session.sendRealtimeInput({ text: parsed.text });
        } else if (parsed.toolResponse) {
          session.sendToolResponse({
            functionResponses: [
              {
                id: parsed.toolResponse.id,
                name: parsed.toolResponse.name,
                response: parsed.toolResponse.response,
              },
            ],
          });
        }
      } catch (err) {
        console.error('Erro ao processar mensagem WebSocket:', err);
      }
    });

    clientWs.on('close', () => {
      isClosing = true;
      if (session) {
        try {
          session.close();
        } catch {
          // Ignore close errors on already closed sessions
        }
        session = null;
      }
    });

    try {
      const ai = createAiClient();
      const connectedSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{ functionDeclarations: [registerTransactionDeclaration] }],
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const content = message.serverContent;

            if (content?.inputTranscription?.text) {
              sendJson(clientWs, { inputTranscript: content.inputTranscription.text });
            }

            if (content?.outputTranscription?.text) {
              sendJson(clientWs, { outputTranscript: content.outputTranscription.text });
            }

            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                sendJson(clientWs, { audio: part.inlineData.data });
              }
            }

            if (content?.interrupted) {
              sendJson(clientWs, { interrupted: true });
            }

            if (content?.turnComplete) {
              sendJson(clientWs, { turnComplete: true });
            }

            for (const call of message.toolCall?.functionCalls ?? []) {
              sendJson(clientWs, {
                toolCall: {
                  id: call.id || '',
                  name: call.name || '',
                  args: (call.args as Record<string, unknown>) || {},
                },
              });
            }
          },
          onerror: (event) => {
            const message =
              event instanceof Error
                ? event.message
                : 'Erro na sessão de voz em tempo real.';
            sendJson(clientWs, { error: message });
          },
          onclose: () => {
            if (!isClosing) {
              sendJson(clientWs, { closed: true });
            }
          },
        },
      });

      if (isClosing || clientWs.readyState !== WebSocket.OPEN) {
        connectedSession.close();
        return;
      }

      session = connectedSession;
      sendJson(clientWs, { ready: true });

      for (const pending of pendingMessages) {
        if (pending.audio) {
          session.sendRealtimeInput({
            audio: {
              data: pending.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (pending.text) {
          session.sendRealtimeInput({ text: pending.text });
        }
      }
      pendingMessages.length = 0;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Não foi possível iniciar a conversa por voz.';
      sendJson(clientWs, { error: errorMessage });
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close();
      }
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, HOST, () => {
    console.log(`GranaMax server listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start GranaMax server:', err);
  process.exit(1);
});
