import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Plus } from 'lucide-react';
import { Button } from './ui/Button';
import type { Transaction } from '../types';

interface CategoryBreakdownProps {
  transactions: Transaction[];
  detailed?: boolean;
  loading?: boolean;
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
  onAddExpense?: () => void;
}

interface CategoryDatum {
  name: string;
  value: number;
  count: number;
  percentage: number;
  color: string;
  isGrouped?: boolean;
}

interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: CategoryDatum }>;
}

const KNOWN_CATEGORY_COLORS: Record<string, string> = {
  'Moradia': '#2563EB',
  'Alimentação': '#EF4444',
  'Lazer': '#8B5CF6',
  'Transporte': '#F59E0B',
  'Saúde': '#EC4899',
  'Educação': '#10B981',
  'Outros': '#64748B',
};

const FALLBACK_PALETTE = [
  '#06B6D4',
  '#F97316',
  '#14B8A6',
  '#6366F1',
  '#84CC16',
  '#E11D48',
];

const RADIAN = Math.PI / 180;

function getCategoryColor(category: string, index: number): string {
  return (
    KNOWN_CATEGORY_COLORS[category] ||
    FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]
  );
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function renderSliceLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0,
}: PieLabelProps) {
  if (percent < 0.07) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * (innerRadius > 0 ? 0.5 : 0.62);
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#FFFFFF"
      textAnchor="middle"
      dominantBaseline="central"
      className="category-pie-slice-label"
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

function CategoryTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="category-tooltip">
      <div className="category-tooltip-header">
        <span
          className="category-tooltip-swatch"
          style={{ backgroundColor: item.color }}
        />
        <span className="category-tooltip-name">{item.name}</span>
      </div>
      <div className="category-tooltip-value">R$ {formatBRL(item.value)}</div>
      <div className="category-tooltip-meta">
        <span>{item.percentage.toFixed(1).replace('.', ',')}% do total</span>
        <span aria-hidden="true">·</span>
        <span>
          {item.count} {item.count === 1 ? 'despesa' : 'despesas'}
        </span>
      </div>
    </div>
  );
}

export function CategoryBreakdown({
  transactions,
  detailed = false,
  loading = false,
  activeCategory,
  onSelectCategory,
  onAddExpense,
}: CategoryBreakdownProps) {
  const [chartType, setChartType] = useState<'pie' | 'donut' | 'bar'>('pie');

  if (loading) {
    return (
      <div className="category-skeleton" aria-busy="true" aria-label="Carregando gráfico de categorias">
        <div className="category-skeleton-circle" />
        <div className="category-skeleton-rows">
          <div className="category-skeleton-line" />
          <div className="category-skeleton-line" />
          <div className="category-skeleton-line" />
          <div className="category-skeleton-line" />
        </div>
      </div>
    );
  }

  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  const aggregated = expenseTransactions.reduce((acc, t) => {
    const category = t.category?.trim() || 'Outros';
    const current = acc[category] || { value: 0, count: 0 };
    acc[category] = {
      value: current.value + t.amount,
      count: current.count + 1,
    };
    return acc;
  }, {} as Record<string, { value: number; count: number }>);

  const sortedEntries = Object.entries(aggregated).sort(
    ([, a], [, b]) => b.value - a.value
  );

  if (sortedEntries.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-description">
          Nenhuma despesa registrada neste período para exibir a distribuição por categoria.
        </p>
        {onAddExpense && (
          <div className="category-empty-action">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onAddExpense}
              icon={<Plus size={16} />}
            >
              Registrar primeira despesa
            </Button>
          </div>
        )}
      </div>
    );
  }

  const maxSlices = detailed ? 10 : 6;
  const visibleEntries = sortedEntries.slice(0, maxSlices);
  const overflowEntries = sortedEntries.slice(maxSlices);

  const chartData: CategoryDatum[] = visibleEntries.map(([name, info], index) => ({
    name,
    value: info.value,
    count: info.count,
    percentage: totalExpenses > 0 ? (info.value / totalExpenses) * 100 : 0,
    color: getCategoryColor(name, index),
  }));

  if (overflowEntries.length > 0) {
    const overflowValue = overflowEntries.reduce((sum, [, info]) => sum + info.value, 0);
    const overflowCount = overflowEntries.reduce((sum, [, info]) => sum + info.count, 0);
    chartData.push({
      name: 'Outras categorias',
      value: overflowValue,
      count: overflowCount,
      percentage: totalExpenses > 0 ? (overflowValue / totalExpenses) * 100 : 0,
      color: '#94A3B8',
      isGrouped: true,
    });
  }

  const handleCategoryPick = (datum: CategoryDatum | undefined) => {
    if (!onSelectCategory || !datum || datum.isGrouped) return;
    onSelectCategory(datum.name);
  };

  return (
    <div className="category-breakdown-container">
      <div className="category-chart-toolbar">
        <div className="category-total-summary">
          <span>
            Total em despesas: <strong>R$ {formatBRL(totalExpenses)}</strong>
          </span>
          <span className="category-meta-sep" aria-hidden="true">·</span>
          <span>
            {sortedEntries.length}{' '}
            {sortedEntries.length === 1 ? 'categoria' : 'categorias'}
          </span>
          <span className="category-meta-sep" aria-hidden="true">·</span>
          <span>
            {expenseTransactions.length}{' '}
            {expenseTransactions.length === 1 ? 'lançamento' : 'lançamentos'}
          </span>
        </div>

        <div className="category-chart-toggle" role="group" aria-label="Tipo de gráfico">
          <button
            type="button"
            className={`chart-toggle-btn ${chartType === 'pie' ? 'active' : ''}`}
            onClick={() => setChartType('pie')}
          >
            Pizza
          </button>
          <button
            type="button"
            className={`chart-toggle-btn ${chartType === 'donut' ? 'active' : ''}`}
            onClick={() => setChartType('donut')}
          >
            Rosca
          </button>
          <button
            type="button"
            className={`chart-toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
          >
            Barras
          </button>
        </div>
      </div>

      <div className="category-breakdown-grid">
        <div className="category-chart-panel">
          <ResponsiveContainer width="100%" height={290}>
            {chartType === 'bar' ? (
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#6B7280"
                  tickFormatter={(v) => `R$${Number(v).toFixed(0)}`}
                  style={{ fontSize: '0.8rem' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  stroke="#374151"
                  style={{ fontSize: '0.8rem' }}
                />
                <Tooltip content={<CategoryTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      opacity={
                        activeCategory &&
                        activeCategory !== 'Todas' &&
                        activeCategory !== entry.name
                          ? 0.35
                          : 1
                      }
                      onClick={() => handleCategoryPick(entry)}
                      style={{
                        cursor: onSelectCategory && !entry.isGrouped ? 'pointer' : 'default',
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={chartType === 'donut' ? 56 : 0}
                  outerRadius={98}
                  paddingAngle={chartType === 'donut' ? 2 : 1}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  labelLine={false}
                  label={renderSliceLabel}
                  isAnimationActive
                  animationDuration={350}
                  onClick={(_, index) => handleCategoryPick(chartData[index])}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      opacity={
                        activeCategory &&
                        activeCategory !== 'Todas' &&
                        activeCategory !== entry.name
                          ? 0.35
                          : 1
                      }
                      style={{
                        cursor: onSelectCategory && !entry.isGrouped ? 'pointer' : 'default',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CategoryTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={40}
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ fontSize: '0.82rem', paddingTop: '8px' }}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="category-breakdown">
          {chartData.map((item) => {
            const isSelected = activeCategory === item.name;
            const clickable = Boolean(onSelectCategory && !item.isGrouped);

            return (
              <button
                key={item.name}
                type="button"
                className={`category-item category-item-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => handleCategoryPick(item)}
                disabled={!clickable}
                title={
                  clickable
                    ? isSelected
                      ? 'Clique para limpar filtro'
                      : `Filtrar por ${item.name}`
                    : undefined
                }
              >
                <div className="category-row-top">
                  <div className="category-info">
                    <div
                      className="category-indicator"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="category-name">{item.name}</span>
                    <span className="category-count">
                      {item.count} {item.count === 1 ? 'item' : 'itens'}
                    </span>
                  </div>

                  <div className="category-stats">
                    <span className="category-amount">R$ {formatBRL(item.value)}</span>
                    <span className="category-percentage">
                      {item.percentage.toFixed(1).replace('.', ',')}%
                    </span>
                  </div>
                </div>

                <div className="category-bar-wrapper">
                  <div
                    className="category-bar"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
