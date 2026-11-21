// 🧮 SIMULADOR DE INVESTIMENTOS AVANÇADO (PRO)

import { useState, useMemo } from 'react';
import { X, Calculator, TrendingUp, GitCompare } from 'lucide-react';
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
import { Input } from './ui/Input';

interface InvestmentSimulatorProps {
  onClose?: () => void;
  inline?: boolean;
  initialPortfolioValue?: number;
}

interface PresetItem {
  id: string;
  label: string;
  rate: number;
  taxExempt: boolean;
}

const PRESETS: PresetItem[] = [
  { id: 'poupanca', label: 'Poupança (6,2%)', rate: 6.2, taxExempt: true },
  { id: 'selic', label: 'Tesouro Selic (10,75%)', rate: 10.75, taxExempt: false },
  { id: 'cdb', label: 'CDB 110% CDI (11,8%)', rate: 11.8, taxExempt: false },
  { id: 'fiis', label: 'Carteira FIIs (12,5%)', rate: 12.5, taxExempt: true },
  { id: 'acoes', label: 'Ações Longo Prazo (14%)', rate: 14.0, taxExempt: false },
];

interface ProjectionYear {
  yearLabel: string;
  year: number;
  invested: number;
  nominalNet: number;
  realPurchasingPower: number;
  scenarioBNet?: number;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getRegressiveTaxRate(years: number): number {
  const days = years * 365;
  if (days <= 180) return 0.225;
  if (days <= 360) return 0.2;
  if (days <= 720) return 0.175;
  return 0.15;
}

function simulateCompound(
  initial: number,
  monthly: number,
  annualRatePct: number,
  years: number,
  inflationPct: number,
  applyTax: boolean
) {
  const monthlyRate = Math.pow(1 + annualRatePct / 100, 1 / 12) - 1;
  const taxRate = applyTax ? getRegressiveTaxRate(years) : 0;

  let balance = initial;
  let invested = initial;
  const yearlyPoints: Array<{
    year: number;
    invested: number;
    gross: number;
    net: number;
    realNet: number;
  }> = [
    {
      year: 0,
      invested: initial,
      gross: initial,
      net: initial,
      realNet: initial,
    },
  ];

  for (let y = 1; y <= years; y += 1) {
    for (let m = 0; m < 12; m += 1) {
      balance = balance * (1 + monthlyRate) + monthly;
      invested += monthly;
    }
    const profit = Math.max(0, balance - invested);
    const currentTaxRate = applyTax ? getRegressiveTaxRate(y) : 0;
    const net = invested + profit * (1 - currentTaxRate);
    const inflationFactor = Math.pow(1 + inflationPct / 100, y);
    const realNet = inflationFactor > 0 ? net / inflationFactor : net;

    yearlyPoints.push({
      year: y,
      invested: Number(invested.toFixed(2)),
      gross: Number(balance.toFixed(2)),
      net: Number(net.toFixed(2)),
      realNet: Number(realNet.toFixed(2)),
    });
  }

  const finalPoint = yearlyPoints[yearlyPoints.length - 1];
  const grossProfit = Math.max(0, finalPoint.gross - finalPoint.invested);
  const taxAmount = grossProfit * taxRate;
  const netProfit = Math.max(0, finalPoint.net - finalPoint.invested);
  const passiveMonthlyIncome = finalPoint.net * (Math.pow(1 + annualRatePct / 100, 1 / 12) - 1);

  return {
    yearlyPoints,
    totalInvested: finalPoint.invested,
    grossTotal: finalPoint.gross,
    netTotal: finalPoint.net,
    realTotal: finalPoint.realNet,
    taxAmount,
    netProfit,
    taxRatePct: taxRate * 100,
    passiveMonthlyIncome,
  };
}

export function InvestmentSimulator({
  onClose,
  inline = false,
  initialPortfolioValue = 1000,
}: InvestmentSimulatorProps) {
  const [initialAmount, setInitialAmount] = useState(
    initialPortfolioValue > 0 ? String(Math.round(initialPortfolioValue)) : '1000'
  );
  const [monthlyAmount, setMonthlyAmount] = useState('500');
  const [annualRate, setAnnualRate] = useState('11.8');
  const [years, setYears] = useState('10');
  const [inflationRate, setInflationRate] = useState('4.5');
  const [applyIR, setApplyIR] = useState(true);

  const [compareEnabled, setCompareEnabled] = useState(false);
  const [scenarioBRate, setScenarioBRate] = useState('14.0');
  const [scenarioBMonthly, setScenarioBMonthly] = useState('700');

  const safeInitial = Math.max(0, Number(initialAmount) || 0);
  const safeMonthly = Math.max(0, Number(monthlyAmount) || 0);
  const safeRate = Math.max(0, Math.min(100, Number(annualRate) || 0));
  const safeYears = Math.max(1, Math.min(40, Math.round(Number(years) || 1)));
  const safeInflation = Math.max(0, Math.min(30, Number(inflationRate) || 0));
  const safeBRate = Math.max(0, Math.min(100, Number(scenarioBRate) || 0));
  const safeBMonthly = Math.max(0, Number(scenarioBMonthly) || 0);

  const resultA = useMemo(
    () =>
      simulateCompound(
        safeInitial,
        safeMonthly,
        safeRate,
        safeYears,
        safeInflation,
        applyIR
      ),
    [safeInitial, safeMonthly, safeRate, safeYears, safeInflation, applyIR]
  );

  const resultB = useMemo(
    () =>
      compareEnabled
        ? simulateCompound(
            safeInitial,
            safeBMonthly,
            safeBRate,
            safeYears,
            safeInflation,
            applyIR
          )
        : null,
    [
      compareEnabled,
      safeInitial,
      safeBMonthly,
      safeBRate,
      safeYears,
      safeInflation,
      applyIR,
    ]
  );

  const chartData = useMemo<ProjectionYear[]>(() => {
    return resultA.yearlyPoints.map((pt, idx) => ({
      yearLabel: pt.year === 0 ? 'Hoje' : `Ano ${pt.year}`,
      year: pt.year,
      invested: pt.invested,
      nominalNet: pt.net,
      realPurchasingPower: pt.realNet,
      ...(resultB ? { scenarioBNet: resultB.yearlyPoints[idx]?.net ?? 0 } : {}),
    }));
  }, [resultA, resultB]);

  const applyPreset = (preset: PresetItem) => {
    setAnnualRate(String(preset.rate));
    setApplyIR(!preset.taxExempt);
  };

  const content = (
    <div className="simulator-advanced">
      {/* Presets rápidos */}
      <div className="simulator-presets">
        <span className="simulator-presets-label">Referências de mercado:</span>
        <div className="simulator-presets-row">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`simulator-preset-btn ${
                Number(annualRate) === preset.rate ? 'active' : ''
              }`}
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs principais */}
      <div className="simulator-inputs-grid">
        <Input
          label="Aporte inicial (R$)"
          type="number"
          min="0"
          step="100"
          value={initialAmount}
          onChange={(e) => setInitialAmount(e.target.value)}
        />
        <Input
          label="Aporte mensal (R$)"
          type="number"
          min="0"
          step="50"
          value={monthlyAmount}
          onChange={(e) => setMonthlyAmount(e.target.value)}
        />
        <Input
          label="Rentabilidade anual (%)"
          type="number"
          min="0"
          max="100"
          step="0.25"
          value={annualRate}
          onChange={(e) => setAnnualRate(e.target.value)}
        />
        <Input
          label="Prazo (anos)"
          type="number"
          min="1"
          max="40"
          value={years}
          onChange={(e) => setYears(e.target.value)}
        />
        <Input
          label="Inflação anual IPCA (%)"
          type="number"
          min="0"
          max="30"
          step="0.25"
          value={inflationRate}
          onChange={(e) => setInflationRate(e.target.value)}
        />

        <div className="simulator-toggles-cell">
          <label className="simulator-checkbox">
            <input
              type="checkbox"
              checked={applyIR}
              onChange={(e) => setApplyIR(e.target.checked)}
            />
            <span>Descontar IR regressivo ({resultA.taxRatePct.toFixed(1).replace('.', ',')}%)</span>
          </label>

          <label className="simulator-checkbox">
            <input
              type="checkbox"
              checked={compareEnabled}
              onChange={(e) => setCompareEnabled(e.target.checked)}
            />
            <span>
              <GitCompare size={14} className="inline-icon" /> Comparar com Cenário B
            </span>
          </label>
        </div>
      </div>

      {/* Cenário B opcional */}
      {compareEnabled && (
        <div className="simulator-scenario-b">
          <div className="simulator-scenario-b-title">Parâmetros do Cenário B (Comparativo)</div>
          <div className="simulator-scenario-b-grid">
            <Input
              label="Aporte mensal Cenário B (R$)"
              type="number"
              min="0"
              step="50"
              value={scenarioBMonthly}
              onChange={(e) => setScenarioBMonthly(e.target.value)}
            />
            <Input
              label="Rentabilidade anual Cenário B (%)"
              type="number"
              min="0"
              max="100"
              step="0.25"
              value={scenarioBRate}
              onChange={(e) => setScenarioBRate(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Resultados KPIs */}
      <div className="simulator-kpi-grid">
        <div className="simulator-kpi-card simulator-kpi-highlight">
          <div className="simulator-kpi-label">
            <TrendingUp size={15} /> Patrimônio Líquido Final
          </div>
          <div className="simulator-kpi-value">R$ {formatBRL(resultA.netTotal)}</div>
          <div className="simulator-kpi-sub">
            Renda passiva estimada: R$ {formatBRL(resultA.passiveMonthlyIncome)}/mês
          </div>
        </div>

        <div className="simulator-kpi-card">
          <div className="simulator-kpi-label">Total Aportado</div>
          <div className="simulator-kpi-value">R$ {formatBRL(resultA.totalInvested)}</div>
          <div className="simulator-kpi-sub">
            Em {safeYears} {safeYears === 1 ? 'ano' : 'anos'} ({safeYears * 12} meses)
          </div>
        </div>

        <div className="simulator-kpi-card">
          <div className="simulator-kpi-label">Juros Líquidos Acumulados</div>
          <div className="simulator-kpi-value text-primary">
            +R$ {formatBRL(resultA.netProfit)}
          </div>
          <div className="simulator-kpi-sub">
            {applyIR
              ? `IR estimado: R$ ${formatBRL(resultA.taxAmount)}`
              : 'Isento de IR nesta simulação'}
          </div>
        </div>

        <div className="simulator-kpi-card">
          <div className="simulator-kpi-label">Poder de Compra Real (IPCA)</div>
          <div className="simulator-kpi-value">R$ {formatBRL(resultA.realTotal)}</div>
          <div className="simulator-kpi-sub">
            Valores trazidos a poder de compra de hoje ({safeInflation.toFixed(1).replace('.', ',')}% a.a.)
          </div>
        </div>
      </div>

      {compareEnabled && resultB && (
        <div className="simulator-compare-banner">
          <span>
            <strong>Diferença Cenário B vs. Cenário A:</strong>{' '}
            <span className={resultB.netTotal >= resultA.netTotal ? 'text-primary' : 'text-danger'}>
              {resultB.netTotal >= resultA.netTotal ? '+' : '-'}R${' '}
              {formatBRL(Math.abs(resultB.netTotal - resultA.netTotal))}
            </span>{' '}
            (Cenário B alcança R$ {formatBRL(resultB.netTotal)})
          </span>
        </div>
      )}

      {/* Gráfico Recharts */}
      <div className="simulator-chart-box">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id="simNetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16A34A" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#16A34A" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="simRealGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="yearLabel" stroke="#6B7280" style={{ fontSize: '0.78rem' }} />
            <YAxis
              stroke="#6B7280"
              tickFormatter={(v) =>
                Number(v) >= 1000000
                  ? `R$${(Number(v) / 1000000).toFixed(1)}M`
                  : Number(v) >= 1000
                    ? `R$${(Number(v) / 1000).toFixed(0)}k`
                    : `R$${Number(v).toFixed(0)}`
              }
              style={{ fontSize: '0.78rem' }}
            />
            <Tooltip
              formatter={(value) => `R$ ${formatBRL(Number(value))}`}
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                fontVariantNumeric: 'tabular-nums',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={32}
              iconType="circle"
              iconSize={9}
              wrapperStyle={{ fontSize: '0.82rem' }}
            />
            <Area
              type="monotone"
              dataKey="nominalNet"
              name="Patrimônio Líquido (Cenário A)"
              stroke="#16A34A"
              strokeWidth={2.5}
              fill="url(#simNetGrad)"
            />
            <Area
              type="monotone"
              dataKey="realPurchasingPower"
              name="Valor Real (ajustado IPCA)"
              stroke="#2563EB"
              strokeWidth={2}
              fill="url(#simRealGrad)"
            />
            <Area
              type="monotone"
              dataKey="invested"
              name="Total Investido"
              stroke="#64748B"
              strokeWidth={1.75}
              strokeDasharray="4 4"
              fill="none"
            />
            {compareEnabled && (
              <Area
                type="monotone"
                dataKey="scenarioBNet"
                name="Cenário B (Comparativo)"
                stroke="#D97706"
                strokeWidth={2.25}
                fill="none"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-large"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="simulator-header">
            <Calculator size={24} className="text-primary" />
            <div>
              <h3 className="modal-title">Simulador de Investimentos Avançado</h3>
              <p className="modal-subtitle">
                Juros compostos com inflação (IPCA), IR regressivo e comparativo de cenários
              </p>
            </div>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} className="modal-close" aria-label="Fechar">
              <X size={24} />
            </button>
          )}
        </div>
        <div className="modal-body">{content}</div>
      </div>
    </div>
  );
}
