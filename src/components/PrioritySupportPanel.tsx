// 🎧 CENTRAL DE SUPORTE PRIORITÁRIO (PRO)

import { useState, type FormEvent } from 'react';
import {
  Headphones,
  Send,
  CheckCircle2,
  Clock,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type {
  SupportPriority,
  SupportTicket,
  SupportTopic,
} from '../types';
import type { CreateSupportTicketInput } from '../hooks/useSupportTickets';

interface PrioritySupportPanelProps {
  tickets: SupportTicket[];
  loading: boolean;
  userEmail: string;
  onCreateTicket: (input: CreateSupportTicketInput) => Promise<void>;
  onResolveTicket: (id: string) => Promise<void>;
  onDeleteTicket: (id: string) => Promise<void>;
}

const TOPIC_LABELS: Record<SupportTopic, string> = {
  carteira: 'Carteira e Investimentos',
  previsoes: 'Previsões com IA e Análises',
  assinatura: 'Assinatura GranaMax PRO',
  bug: 'Relatar Problema Técnico',
  outro: 'Dúvida Geral ou Sugestão',
};

const STATUS_META = {
  open: { label: 'Na fila prioritária', className: 'ticket-status-open' },
  in_progress: { label: 'Em análise', className: 'ticket-status-progress' },
  resolved: { label: 'Resolvido', className: 'ticket-status-resolved' },
};

export function PrioritySupportPanel({
  tickets,
  loading,
  userEmail,
  onCreateTicket,
  onResolveTicket,
  onDeleteTicket,
}: PrioritySupportPanelProps) {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState<SupportTopic>('carteira');
  const [priority, setPriority] = useState<SupportPriority>('high');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!subject.trim()) {
      setError('Informe o assunto do chamado.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Descreva sua dúvida ou solicitação com pelo menos 10 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      await onCreateTicket({ subject, topic, priority, message });
      setSubject('');
      setMessage('');
      setSuccessMsg(
        'Chamado aberto na fila prioritária PRO! Você pode acompanhar o andamento abaixo.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar chamado.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pro-analytics-stack">
      <Card>
        <CardHeader
          title="Suporte Prioritário PRO"
          subtitle={`Atendimento dedicado para ${userEmail} com SLA prioritário em até 2 horas úteis`}
        />
        <CardContent>
          <div className="support-sla-strip">
            <div className="support-sla-item">
              <ShieldCheck size={17} className="text-primary" />
              <span>Fila exclusiva de assinantes PRO</span>
            </div>
            <div className="support-sla-item">
              <Clock size={17} className="text-amber" />
              <span>Tempo médio de primeira resposta: &lt; 2h</span>
            </div>
          </div>

          {error && (
            <div className="pro-inline-error" role="alert">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="pro-inline-success" role="status">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="support-form">
            <div className="support-form-row">
              <Input
                label="Assunto"
                type="text"
                placeholder="Ex: Dúvida sobre rentabilidade de FIIs na carteira"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={120}
                required
              />

              <div className="input-wrapper">
                <label className="input-label">Tema</label>
                <select
                  className="input"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as SupportTopic)}
                >
                  {(Object.keys(TOPIC_LABELS) as SupportTopic[]).map((key) => (
                    <option key={key} value={key}>
                      {TOPIC_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-wrapper">
                <label className="input-label">Urgência</label>
                <select
                  className="input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as SupportPriority)}
                >
                  <option value="high">Alta (Prioridade Máxima PRO)</option>
                  <option value="normal">Normal (Fila PRO)</option>
                </select>
              </div>
            </div>

            <div className="input-wrapper">
              <label className="input-label">Descrição detalhada</label>
              <textarea
                className="input pro-textarea"
                rows={4}
                maxLength={1500}
                placeholder="Conte como podemos ajudar com sua conta, carteira, previsões ou relatórios..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <div className="support-form-footer">
              <span className="text-muted">
                {message.length}/1500 caracteres
              </span>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                icon={<Send size={16} />}
              >
                Abrir Chamado Prioritário
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Meus Chamados"
          subtitle={`${tickets.length} ${tickets.length === 1 ? 'chamado registrado' : 'chamados registrados'}`}
        />
        <CardContent className="p-0">
          {loading ? (
            <div className="spinner-container">
              <div className="spinner" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Headphones size={40} />
              </div>
              <h3 className="empty-title">Nenhum chamado aberto</h3>
              <p className="empty-description">
                Precisa de ajuda ou quer sugerir uma melhoria? Envie sua solicitação no formulário acima com atendimento prioritário PRO.
              </p>
            </div>
          ) : (
            <div className="support-tickets-list">
              {tickets.map((ticket) => {
                const statusInfo = STATUS_META[ticket.status];
                const protocol = `GM-${ticket.id.slice(0, 6).toUpperCase()}`;
                const isConfirming = confirmDeleteId === ticket.id;

                return (
                  <div key={ticket.id} className="support-ticket-item">
                    <div className="support-ticket-top">
                      <div className="support-ticket-heading">
                        <span className="support-protocol">#{protocol}</span>
                        <strong>{ticket.subject}</strong>
                      </div>
                      <span className={`ticket-status-tag ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="support-ticket-meta">
                      <span>{TOPIC_LABELS[ticket.topic]}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {ticket.priority === 'high' ? 'Prioridade Alta' : 'Prioridade Normal'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Aberto em{' '}
                        {format(ticket.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>

                    <p className="support-ticket-message">{ticket.message}</p>

                    <div className="support-ticket-actions">
                      {ticket.status !== 'resolved' && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onResolveTicket(ticket.id)}
                          icon={<CheckCircle2 size={15} />}
                        >
                          Marcar como resolvido
                        </Button>
                      )}

                      {isConfirming ? (
                        <div className="investment-delete-confirm">
                          <button
                            type="button"
                            className="investment-confirm-yes"
                            onClick={async () => {
                              await onDeleteTicket(ticket.id);
                              setConfirmDeleteId(null);
                            }}
                          >
                            Confirmar exclusão
                          </button>
                          <button
                            type="button"
                            className="investment-confirm-no"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="investment-action-btn investment-action-delete"
                          title="Excluir chamado"
                          onClick={() => setConfirmDeleteId(ticket.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
