// 📈 GRÁFICO DE EVOLUÇÃO PATRIMONIAL (PRO)

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BookmarkCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import type { WealthPoint } from '../hooks/useWealthHistory';

interface WealthEvolutionChartProps {
  series: WealthPoint[];
  loading: boolean;
  currentCashBalance: number;
  currentInvestmentsValue: number;
  onSaveSnapshot: (month: string, cashBalance: number, investmentsValue: number) => Promise<void>;
}

interface WealthTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: WealthPoint }>;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function WealthTooltip({ active, payload }: WealthTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="pro-chart-tooltip">
      <div className="pro-chart-tooltip-title">
        <span>{point.label}</span>
        {point.isRecorded && <span className="pro-tooltip-saved">Marco salvo</span>}
      </div>
      <div className="pro-chart-tooltip-row">
        <span className="dot-net" />
        <span>Patrimônio Total</span>
        <strong>R$ {formatBRL(point.netWorth)}</strong>
      </div>
      <div className="pro-chart-tooltip-row">
        <span className="dot-inv" />
        <span>Investimentos</span>
        <strong>R$ {formatBRL(point.investmentsValue)}</strong>
      </div>
      <div className="pro-chart-tooltip-row">
        <span className="dot-cash" />
        <span>Saldo em Conta</span>
        <strong>R$ {formatBRL(point.cashBalance)}</strong>
      </div>
    </div>
  );
}

export function WealthEvolutionChart({
  series,
  loading,
  currentCashBalance,
  currentInvestmentsValue,
  onSaveSnapshot,
}: WealthEvolutionChartProps) {
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentNetWorth = currentCashBalance + currentInvestmentsValue;
  const firstPoint = series[0];
  const lastPoint = series[series.length - 1];
  const deltaPeriod =
    firstPoint && lastPoint ? lastPoint.netWorth - firstPoint.netWorth : 0;
  const recordedCount = series.filter((p) => p.isRecorded).length;

  const handleSaveCurrentMonth = async () => {
    setError(null);
    setFeedback(null);
    setSaving(true);
    try {
      const monthKey = format(new Date(), 'yyyy-MM');
      await onSaveSnapshot(monthKey, currentCashBalance, currentInvestmentsValue);
      setFeedback('Marco patrimonial deste mês registrado com sucesso.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível salvar o marco patrimonial.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Evolução Patrimonial"
        subtitle="Acompanhamento dos últimos 6 meses combinando saldo acumulado e carteira de investimentos"
        action={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSaveCurrentMonth}
            loading={saving}
            icon={<BookmarkCheck size={16} />}
          >
            Registrar marco do mês
          </Button>
        }
      />
      <CardContent>
        {feedback && (
          <div className="pro-inline-success" role="status">
            {feedback}
          </div>
        )}
        {error && (
          <div className="pro-inline-error" role="alert">
            {error}
          </div>
        )}

        <div className="wealth-kpis-row">
          <div className="wealth-kpi-box">
            <span className="wealth-kpi-label">Patrimônio Líquido Atual</span>
            <strong className={`wealth-kpi-value ${currentNetWorth >= 0 ? 'text-primary' : 'text-danger'}`}>
              R$ {formatBRL(currentNetWorth)}
            </strong>
          </div>

          <div className="wealth-kpi-box">
            <span className="wealth-kpi-label">Variação em 6 meses</span>
            <strong className={`wealth-kpi-value wealth-delta ${deltaPeriod >= 0 ? 'text-primary' : 'text-danger'}`}>
              {deltaPeriod >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              {deltaPeriod >= 0 ? '+' : ''}R$ {formatBRL(deltaPeriod)}
            </strong>
          </div>

          <div className="wealth-kpi-box">
            <span className="wealth-kpi-label">Parcela Investida</span>
            <strong className="wealth-kpi-value">
              R$ {formatBRL(currentInvestmentsValue)}
            </strong>
            <span className="wealth-kpi-sub">
              {recordedCount} {recordedCount === 1 ? 'marco salvo' : 'marcos salvos'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner" />
          </div>
        ) : (
          <div className="wealth-chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={series} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#6B7280"
                  style={{ fontSize: '0.8rem' }}
                />
                <YAxis
                  stroke="#6B7280"
                  tickFormatter={(v) =>
                    Math.abs(Number(v)) >= 1000
                      ? `R$${(Number(v) / 1000).toFixed(1)}k`
                      : `R$${Number(v).toFixed(0)}`
                  }
                  style={{ fontSize: '0.78rem' }}
                />
                <Tooltip content={<WealthTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  iconType="circle"
                  iconSize={9}
                  wrapperStyle={{ fontSize: '0.82rem' }}
                />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  name="Patrimônio Total"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fill="url(#netWorthGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="investmentsValue"
                  name="Investimentos"
                  stroke="#16A34A"
                  strokeWidth={2}
                  fill="url(#invGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="cashBalance"
                  name="Saldo em Conta"
                  stroke="#94A3B8"
                  strokeWidth={1.75}
                  strokeDasharray="4 4"
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
