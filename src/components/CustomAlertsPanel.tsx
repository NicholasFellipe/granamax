// 🔔 GERENCIADOR DE ALERTAS PERSONALIZADOS ILIMITADOS (PRO)

import { useState, type FormEvent } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  Pause,
  Play,
  Crown,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { CustomAlertMetric } from '../types';
import {
  FREE_ALERT_LIMIT,
  type CreateCustomAlertInput,
  type EvaluatedCustomAlertStatus,
} from '../hooks/useCustomAlerts';

interface CustomAlertsPanelProps {
  isPro: boolean;
  evaluations: EvaluatedCustomAlertStatus[];
  loading: boolean;
  availableCategories: string[];
  onCreateAlert: (input: CreateCustomAlertInput) => Promise<void>;
  onToggleAlert: (id: string, nextActive: boolean) => Promise<void>;
  onDeleteAlert: (id: string) => Promise<void>;
  onUpgradeToPro: () => void;
}

const METRIC_OPTIONS: Array<{
  value: CustomAlertMetric;
  label: string;
  helper: string;
}> = [
  {
    value: 'category_monthly',
    label: 'Limite mensal por categoria',
    helper: 'Dispara quando os gastos do mês na categoria atingirem o teto.',
  },
  {
    value: 'min_balance',
    label: 'Saldo mínimo mensal',
    helper: 'Dispara quando o saldo do mês ficar abaixo do valor definido.',
  },
  {
    value: 'single_expense',
    label: 'Gasto único elevado',
    helper: 'Dispara quando qualquer despesa única atingir ou superar o valor.',
  },
  {
    value: 'portfolio_goal',
    label: 'Meta de valor na carteira',
    helper: 'Notifica quando seus investimentos atingirem o marco patrimonial.',
  },
];

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CustomAlertsPanel({
  isPro,
  evaluations,
  loading,
  availableCategories,
  onCreateAlert,
  onToggleAlert,
  onDeleteAlert,
  onUpgradeToPro,
}: CustomAlertsPanelProps) {
  const [name, setName] = useState('');
  const [metric, setMetric] = useState<CustomAlertMetric>('category_monthly');
  const [category, setCategory] = useState(availableCategories[0] || 'Alimentação');
  const [threshold, setThreshold] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const reachedFreeLimit = !isPro && evaluations.length >= FREE_ALERT_LIMIT;
  const activeMetricInfo = METRIC_OPTIONS.find((m) => m.value === metric);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (reachedFreeLimit) {
      onUpgradeToPro();
      return;
    }

    const parsedThreshold = Number(threshold.replace(',', '.'));
    if (!name.trim()) {
      setError('Dê um nome claro para o alerta.');
      return;
    }
    if (!Number.isFinite(parsedThreshold) || parsedThreshold <= 0) {
      setError('Informe um valor de gatilho maior que zero.');
      return;
    }

    setSubmitting(true);
    try {
      await onCreateAlert({
        name,
        metric,
        category: metric === 'category_monthly' ? category : '',
        threshold: parsedThreshold,
      });
      setName('');
      setThreshold('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar regra de alerta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pro-analytics-stack">
      <Card>
        <CardHeader
          title="Alertas Personalizados"
          subtitle={
            isPro
              ? 'Crie regras ilimitadas monitoradas em tempo real contra seus lançamentos e carteira'
              : `Plano Grátis: até ${FREE_ALERT_LIMIT} alertas ativos (${evaluations.length}/${FREE_ALERT_LIMIT}). No PRO são ilimitados.`
          }
          action={
            !isPro ? (
              <Button
                type="button"
                variant="pro"
                size="sm"
                onClick={onUpgradeToPro}
                icon={<Crown size={15} />}
              >
                Liberar Ilimitados
              </Button>
            ) : undefined
          }
        />
        <CardContent>
          {error && (
            <div className="pro-inline-error" role="alert">
              {error}
            </div>
          )}

          {reachedFreeLimit ? (
            <div className="alerts-limit-upsell">
              <div className="alerts-limit-copy">
                <strong>Limite do plano Grátis atingido ({FREE_ALERT_LIMIT}/{FREE_ALERT_LIMIT})</strong>
                <p>
                  Ative o GranaMax PRO para criar alertas personalizados ilimitados por categoria, saldo mínimo, gastos fora do padrão e metas de carteira.
                </p>
              </div>
              <Button
                type="button"
                variant="pro"
                size="md"
                onClick={onUpgradeToPro}
                icon={<Crown size={16} />}
              >
                Ativar Alertas Ilimitados
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="custom-alert-form">
              <div className="custom-alert-form-grid">
                <Input
                  label="Nome da Regra"
                  type="text"
                  placeholder="Ex: Teto de delivery no mês"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  required
                />

                <div className="input-wrapper">
                  <label className="input-label">Condição Monitorada</label>
                  <select
                    className="input"
                    value={metric}
                    onChange={(e) => setMetric(e.target.value as CustomAlertMetric)}
                  >
                    {METRIC_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {metric === 'category_monthly' && (
                  <div className="input-wrapper">
                    <label className="input-label">Categoria</label>
                    <select
                      className="input"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Input
                  label="Valor Gatilho (R$)"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ex: 600,00"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  required
                />
              </div>

              <div className="custom-alert-form-footer">
                <span className="custom-alert-helper">{activeMetricInfo?.helper}</span>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submitting}
                  icon={<Plus size={16} />}
                >
                  Criar Regra de Alerta
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Regras Configuradas"
          subtitle={`${evaluations.length} ${evaluations.length === 1 ? 'regra criada' : 'regras criadas'}`}
        />
        <CardContent className="p-0">
          {loading ? (
            <div className="spinner-container">
              <div className="spinner" />
            </div>
          ) : evaluations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Bell size={40} />
              </div>
              <h3 className="empty-title">Nenhum alerta personalizado ainda</h3>
              <p className="empty-description">
                Configure tetos por categoria, saldo mínimo ou metas de carteira acima para receber avisos automáticos no topo do Dashboard.
              </p>
            </div>
          ) : (
            <div className="custom-alerts-list">
              {evaluations.map(({ rule, triggered, summaryText }) => {
                const metricLabel =
                  METRIC_OPTIONS.find((m) => m.value === rule.metric)?.label || rule.metric;
                const isConfirming = confirmDeleteId === rule.id;

                return (
                  <div
                    key={rule.id}
                    className={`custom-alert-row ${
                      !rule.active
                        ? 'custom-alert-paused'
                        : triggered
                          ? 'custom-alert-triggered'
                          : ''
                    }`}
                  >
                    <div className="custom-alert-row-main">
                      <div className="custom-alert-row-title">
                        <strong>{rule.name}</strong>
                        <span
                          className={`custom-alert-status ${
                            !rule.active
                              ? 'status-paused'
                              : triggered
                                ? 'status-triggered'
                                : 'status-ok'
                          }`}
                        >
                          {!rule.active ? (
                            'Pausado'
                          ) : triggered ? (
                            <>
                              <AlertTriangle size={13} /> Disparado
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={13} /> Monitorando
                            </>
                          )}
                        </span>
                      </div>
                      <div className="custom-alert-row-meta">
                        <span>{metricLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>Gatilho: R$ {formatBRL(rule.threshold)}</span>
                      </div>
                      <p className="custom-alert-row-summary">{summaryText}</p>
                    </div>

                    <div className="custom-alert-row-actions">
                      <button
                        type="button"
                        className="investment-action-btn"
                        title={rule.active ? 'Pausar regra' : 'Ativar regra'}
                        onClick={() => onToggleAlert(rule.id, !rule.active)}
                      >
                        {rule.active ? <Pause size={15} /> : <Play size={15} />}
                      </button>

                      {isConfirming ? (
                        <div className="investment-delete-confirm">
                          <button
                            type="button"
                            className="investment-confirm-yes"
                            onClick={async () => {
                              await onDeleteAlert(rule.id);
                              setConfirmDeleteId(null);
                            }}
                          >
                            Excluir
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
                          title="Excluir regra"
                          onClick={() => setConfirmDeleteId(rule.id)}
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
