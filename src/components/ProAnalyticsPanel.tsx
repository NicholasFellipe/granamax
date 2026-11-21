// 🧠 PAINEL DE ANÁLISE AVANÇADA E PREVISÕES INTELIGENTES (PRO)

import { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, getDaysInMonth } from 'date-fns';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { CategoryBreakdown } from './CategoryBreakdown';
import { WealthEvolutionChart } from './WealthEvolutionChart';
import type {
  RecurringTransaction,
  SmartForecastResult,
  Transaction,
} from '../types';
import type { WealthPoint } from '../hooks/useWealthHistory';

interface ProAnalyticsPanelProps {
  selectedMonth: string; // YYYY-MM
  selectedMonthLabel: string;
  allTransactions: Transaction[];
  recurringItems: RecurringTransaction[];
  monthlyBudgetLimit: number | null;
  investmentTotal: number;
  currentCashBalance: number;
  wealthSeries: WealthPoint[];
  wealthLoading: boolean;
  onSaveWealthSnapshot: (
    month: string,
    cashBalance: number,
    investmentsValue: number
  ) => Promise<void>;
  onAddExpense: () => void;
}

interface CategoryComparisonRow {
  category: string;
  currentMonth: number;
  lastMonth: number;
  deltaPct: number | null;
  count: number;
  avgTicket: number;
  maxExpense: number;
  sharePct: number;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ProAnalyticsPanel({
  selectedMonth,
  selectedMonthLabel,
  allTransactions,
  recurringItems,
  monthlyBudgetLimit,
  investmentTotal,
  currentCashBalance,
  wealthSeries,
  wealthLoading,
  onSaveWealthSnapshot,
  onAddExpense,
}: ProAnalyticsPanelProps) {
  const [forecast, setForecast] = useState<SmartForecastResult | null>(null);
  const [forecastMonthKey, setForecastMonthKey] = useState<string>('');
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const refDate = new Date(year, month - 1, 1);
    const prevRefDate = subMonths(refDate, 1);

    const curStart = startOfMonth(refDate);
    const curEnd = endOfMonth(refDate);
    const prevStart = startOfMonth(prevRefDate);
    const prevEnd = endOfMonth(prevRefDate);

    const curTx = allTransactions.filter((t) => t.date >= curStart && t.date <= curEnd);
    const prevTx = allTransactions.filter((t) => t.date >= prevStart && t.date <= prevEnd);

    const curExpensesTx = curTx.filter((t) => t.type === 'expense');
    const prevExpensesTx = prevTx.filter((t) => t.type === 'expense');

    const currentMonthExpenses = curExpensesTx.reduce((s, t) => s + t.amount, 0);
    const lastMonthExpenses = prevExpensesTx.reduce((s, t) => s + t.amount, 0);
    const totalIncome = curTx
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const monthBalance = totalIncome - currentMonthExpenses;

    const now = new Date();
    const isCurrentCalendarMonth =
      now.getFullYear() === year && now.getMonth() === month - 1;
    const totalDays = getDaysInMonth(refDate);
    const daysElapsed = isCurrentCalendarMonth ? Math.max(1, now.getDate()) : totalDays;
    const daysRemaining = isCurrentCalendarMonth ? Math.max(0, totalDays - now.getDate()) : 0;

    // Recorrentes de despesa ativas ainda não lançadas neste mês
    const pendingRecurringExpenses = recurringItems
      .filter(
        (r) =>
          r.active &&
          r.type === 'expense' &&
          r.lastGeneratedMonth !== selectedMonth
      )
      .reduce((s, r) => s + r.amount, 0);

    const dailyBurnRate = currentMonthExpenses / daysElapsed;
    const projectedMathTotal = isCurrentCalendarMonth
      ? currentMonthExpenses + dailyBurnRate * daysRemaining + pendingRecurringExpenses
      : currentMonthExpenses;

    // Comparativo detalhado por categoria (mês atual vs mês anterior)
    const curByCat = new Map<
      string,
      { total: number; count: number; max: number }
    >();
    for (const tx of curExpensesTx) {
      const cat = tx.category?.trim() || 'Outros';
      const entry = curByCat.get(cat) ?? { total: 0, count: 0, max: 0 };
      entry.total += tx.amount;
      entry.count += 1;
      entry.max = Math.max(entry.max, tx.amount);
      curByCat.set(cat, entry);
    }

    const prevByCat = new Map<string, number>();
    for (const tx of prevExpensesTx) {
      const cat = tx.category?.trim() || 'Outros';
      prevByCat.set(cat, (prevByCat.get(cat) ?? 0) + tx.amount);
    }

    const allCats = new Set<string>([...curByCat.keys(), ...prevByCat.keys()]);
    const categoryRows: CategoryComparisonRow[] = Array.from(allCats)
      .map((category) => {
        const cur = curByCat.get(category) ?? { total: 0, count: 0, max: 0 };
        const prev = prevByCat.get(category) ?? 0;
        const deltaPct =
          prev > 0 ? ((cur.total - prev) / prev) * 100 : cur.total > 0 ? 100 : null;
        return {
          category,
          currentMonth: cur.total,
          lastMonth: prev,
          deltaPct,
          count: cur.count,
          avgTicket: cur.count > 0 ? cur.total / cur.count : 0,
          maxExpense: cur.max,
          sharePct:
            currentMonthExpenses > 0 ? (cur.total / currentMonthExpenses) * 100 : 0,
        };
      })
      .sort((a, b) => b.currentMonth - a.currentMonth || b.lastMonth - a.lastMonth);

    return {
      curTx,
      currentMonthExpenses,
      lastMonthExpenses,
      totalIncome,
      monthBalance,
      daysElapsed,
      daysRemaining,
      dailyBurnRate,
      pendingRecurringExpenses,
      projectedMathTotal,
      categoryRows,
    };
  }, [selectedMonth, allTransactions, recurringItems]);

  const activeForecast = forecastMonthKey === selectedMonth ? forecast : null;

  const handleGenerateAiForecast = async () => {
    setForecastError(null);
    setForecastLoading(true);

    try {
      const response = await fetch('/api/pro/spending-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthLabel: selectedMonthLabel,
          daysElapsed: metrics.daysElapsed,
          daysRemaining: metrics.daysRemaining,
          currentMonthExpenses: metrics.currentMonthExpenses,
          lastMonthExpenses: metrics.lastMonthExpenses,
          totalIncome: metrics.totalIncome,
          currentBalance: metrics.monthBalance,
          monthlyBudgetLimit,
          pendingRecurringExpenses: metrics.pendingRecurringExpenses,
          investmentTotal,
          projectedMathTotal: metrics.projectedMathTotal,
          categoryBreakdown: metrics.categoryRows.slice(0, 10).map((row) => ({
            name: row.category,
            currentMonth: row.currentMonth,
            lastMonth: row.lastMonth,
            count: row.count,
          })),
        }),
      });

      const data = (await response.json()) as SmartForecastResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao consultar a previsão inteligente.');
      }

      setForecast(data);
      setForecastMonthKey(selectedMonth);
    } catch (err) {
      setForecastError(
        err instanceof Error
          ? err.message
          : 'Não foi possível gerar a análise inteligente agora.'
      );
    } finally {
      setForecastLoading(false);
    }
  };

  const budgetDiff =
    monthlyBudgetLimit !== null
      ? monthlyBudgetLimit - metrics.projectedMathTotal
      : null;

  const riskBadgeInfo = activeForecast
    ? activeForecast.riskLevel === 'high'
      ? { label: 'Risco Crítico', className: 'risk-high', Icon: ShieldAlert }
      : activeForecast.riskLevel === 'medium'
        ? { label: 'Atenção no Orçamento', className: 'risk-medium', Icon: AlertTriangle }
        : { label: 'Orçamento Controlado', className: 'risk-low', Icon: CheckCircle2 }
    : null;

  return (
    <div className="pro-analytics-stack">
      {/* 1. PREVISÕES INTELIGENTES DE GASTOS */}
      <Card>
        <CardHeader
          title="Previsões Inteligentes de Gastos"
          subtitle={`Projeção em tempo real de ${selectedMonthLabel} com diagnóstico por IA`}
          action={
            <Button
              type="button"
              variant="pro"
              size="sm"
              onClick={handleGenerateAiForecast}
              loading={forecastLoading}
              icon={activeForecast ? <RefreshCw size={15} /> : <Sparkles size={15} />}
            >
              {activeForecast ? 'Atualizar Diagnóstico IA' : 'Gerar Diagnóstico com IA'}
            </Button>
          }
        />
        <CardContent>
          <div className="forecast-kpi-grid">
            <div className="forecast-kpi-card">
              <span className="forecast-kpi-label">Ritmo Diário Atual</span>
              <strong className="forecast-kpi-value">
                R$ {formatBRL(metrics.dailyBurnRate)}/dia
              </strong>
              <span className="forecast-kpi-sub">
                Baseado em {metrics.daysElapsed} {metrics.daysElapsed === 1 ? 'dia' : 'dias'}
              </span>
            </div>

            <div className="forecast-kpi-card">
              <span className="forecast-kpi-label">Recorrentes Pendentes</span>
              <strong className="forecast-kpi-value">
                R$ {formatBRL(metrics.pendingRecurringExpenses)}
              </strong>
              <span className="forecast-kpi-sub">Contas ativas previstas no mês</span>
            </div>

            <div className="forecast-kpi-card forecast-kpi-accent">
              <span className="forecast-kpi-label">Projeção de Fechamento</span>
              <strong className="forecast-kpi-value">
                R$ {formatBRL(metrics.projectedMathTotal)}
              </strong>
              <span className="forecast-kpi-sub">
                {metrics.daysRemaining > 0
                  ? `Faltam ${metrics.daysRemaining} dias no mês`
                  : 'Mês encerrado'}
              </span>
            </div>

            <div className="forecast-kpi-card">
              <span className="forecast-kpi-label">Margem frente à Meta</span>
              <strong
                className={`forecast-kpi-value ${
                  budgetDiff === null
                    ? ''
                    : budgetDiff >= 0
                      ? 'text-primary'
                      : 'text-danger'
                }`}
              >
                {budgetDiff === null
                  ? 'Sem meta'
                  : `${budgetDiff >= 0 ? '+' : '-'}R$ ${formatBRL(Math.abs(budgetDiff))}`}
              </strong>
              <span className="forecast-kpi-sub">
                {monthlyBudgetLimit !== null
                  ? `Meta mensal: R$ ${formatBRL(monthlyBudgetLimit)}`
                  : 'Defina uma meta na Visão Geral'}
              </span>
            </div>
          </div>

          {forecastError && (
            <div className="pro-inline-error" role="alert">
              {forecastError}
            </div>
          )}

          {activeForecast ? (
            <div className="ai-forecast-panel">
              <div className="ai-forecast-header">
                <div className="ai-forecast-title-row">
                  <Sparkles size={18} className="text-amber" />
                  <h4>Diagnóstico Inteligente GranaMax PRO</h4>
                </div>
                {riskBadgeInfo && (
                  <span className={`forecast-risk-badge ${riskBadgeInfo.className}`}>
                    <riskBadgeInfo.Icon size={14} />
                    {riskBadgeInfo.label}
                  </span>
                )}
              </div>

              <p className="ai-forecast-summary">{activeForecast.summary}</p>

              <div className="ai-forecast-highlights">
                <div className="ai-highlight-metric">
                  <span>Projeção estimada pela IA</span>
                  <strong>R$ {formatBRL(activeForecast.projectedMonthTotal)}</strong>
                </div>
                <div className="ai-highlight-metric ai-highlight-savings">
                  <span>Economia mensal potencial</span>
                  <strong>+R$ {formatBRL(activeForecast.potentialMonthlySavings)}</strong>
                </div>
              </div>

              {activeForecast.pressureCategories.length > 0 && (
                <div className="ai-forecast-subsection">
                  <h5>Categorias de maior atenção</h5>
                  <div className="ai-pressure-grid">
                    {activeForecast.pressureCategories.map((item) => (
                      <div key={item.category} className="ai-pressure-item">
                        <div className="ai-pressure-top">
                          <strong>{item.category}</strong>
                          <span>Teto sugerido: R$ {formatBRL(item.suggestedLimit)}</span>
                        </div>
                        <p>{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeForecast.actionableTips.length > 0 && (
                <div className="ai-forecast-subsection">
                  <h5>Plano de ação recomendado</h5>
                  <ul className="ai-tips-list">
                    {activeForecast.actionableTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="ai-forecast-cta-strip">
              <p>
                Clique em <strong>Gerar Diagnóstico com IA</strong> para identificar anomalias por categoria, teto sugerido e potencial de economia para {selectedMonthLabel}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. ANÁLISES DETALHADAS POR CATEGORIA (COMPARATIVO MÊS A MÊS) */}
      <Card>
        <CardHeader
          title="Análise Detalhada por Categoria (Comparativo Mensal)"
          subtitle={`Comparação entre ${selectedMonthLabel} e o mês anterior com ticket médio e maior lançamento`}
        />
        <CardContent>
          {metrics.categoryRows.length === 0 ? (
            <div className="empty-state">
              <p className="empty-description">
                Ainda não há despesas suficientes neste mês ou no mês anterior para montar o comparativo detalhado.
              </p>
              <Button type="button" variant="primary" size="sm" onClick={onAddExpense}>
                Registrar primeira despesa
              </Button>
            </div>
          ) : (
            <>
              <div className="category-mom-table-wrap">
                <table className="category-mom-table">
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th className="col-num">Mês Atual</th>
                      <th className="col-num">Mês Anterior</th>
                      <th className="col-num">Variação</th>
                      <th className="col-num">Lançamentos</th>
                      <th className="col-num">Ticket Médio</th>
                      <th className="col-num">Maior Gasto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.categoryRows.map((row) => {
                      const isUp = row.deltaPct !== null && row.deltaPct > 0;
                      const isDown = row.deltaPct !== null && row.deltaPct < 0;
                      return (
                        <tr key={row.category}>
                          <td className="cat-col-name">
                            <strong>{row.category}</strong>
                            <span className="cat-col-share">
                              {row.sharePct.toFixed(1).replace('.', ',')}% do mês
                            </span>
                          </td>
                          <td className="col-num">
                            <strong>R$ {formatBRL(row.currentMonth)}</strong>
                          </td>
                          <td className="col-num text-muted">
                            R$ {formatBRL(row.lastMonth)}
                          </td>
                          <td className="col-num">
                            {row.deltaPct === null ? (
                              <span className="text-muted">—</span>
                            ) : (
                              <span
                                className={`mom-delta ${
                                  isUp
                                    ? 'mom-delta-up'
                                    : isDown
                                      ? 'mom-delta-down'
                                      : 'text-muted'
                                }`}
                              >
                                {isUp ? (
                                  <TrendingUp size={13} />
                                ) : isDown ? (
                                  <TrendingDown size={13} />
                                ) : null}
                                {isUp ? '+' : ''}
                                {row.deltaPct.toFixed(1).replace('.', ',')}%
                              </span>
                            )}
                          </td>
                          <td className="col-num">{row.count}</td>
                          <td className="col-num">R$ {formatBRL(row.avgTicket)}</td>
                          <td className="col-num">R$ {formatBRL(row.maxExpense)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pro-section-divider" />

              <CategoryBreakdown
                transactions={metrics.curTx}
                detailed
                onAddExpense={onAddExpense}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* 3. EVOLUÇÃO PATRIMONIAL */}
      <WealthEvolutionChart
        series={wealthSeries}
        loading={wealthLoading}
        currentCashBalance={currentCashBalance}
        currentInvestmentsValue={investmentTotal}
        onSaveSnapshot={onSaveWealthSnapshot}
      />
    </div>
  );
}
