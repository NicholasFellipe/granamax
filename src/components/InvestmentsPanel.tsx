// 📈 PAINEL DE CONTROLE COMPLETO DE CARTEIRA E SIMULADOR AVANÇADO (PRO)

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Plus,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Calculator,
  LineChart,
  Briefcase,
  Layers,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { InvestmentList } from './InvestmentList';
import { AddInvestmentModal, INVESTMENT_CLASSES } from './AddInvestmentModal';
import { InvestmentSimulator } from './InvestmentSimulator';
import { WealthEvolutionChart } from './WealthEvolutionChart';
import type { Investment, InvestmentType } from '../types';
import type { AddInvestmentInput, UpdateInvestmentInput } from '../hooks/useInvestments';
import type { WealthPoint } from '../hooks/useWealthHistory';

interface InvestmentsPanelProps {
  investments: Investment[];
  loading: boolean;
  totalInvested: number;
  totalValue: number;
  totalProfit: number;
  profitPercentage: number;
  onAddInvestment: (input: AddInvestmentInput) => Promise<void>;
  onUpdateInvestmentValue: (id: string, value: number) => Promise<void>;
  onUpdateInvestment: (id: string, input: UpdateInvestmentInput) => Promise<void>;
  onDeleteInvestment: (id: string) => Promise<void>;
  wealthSeries: WealthPoint[];
  wealthLoading: boolean;
  currentCashBalance: number;
  onSaveWealthSnapshot: (
    month: string,
    cashBalance: number,
    investmentsValue: number
  ) => Promise<void>;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function InvestmentsPanel({
  investments,
  loading,
  totalInvested,
  totalValue,
  totalProfit,
  profitPercentage,
  onAddInvestment,
  onUpdateInvestmentValue,
  onUpdateInvestment,
  onDeleteInvestment,
  wealthSeries,
  wealthLoading,
  currentCashBalance,
  onSaveWealthSnapshot,
}: InvestmentsPanelProps) {
  const [subTab, setSubTab] = useState<'portfolio' | 'simulator' | 'wealth'>('portfolio');
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Investment | null>(null);
  const [selectedClass, setSelectedClass] = useState<'all' | InvestmentType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvestments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return investments.filter((inv) => {
      const matchesClass = selectedClass === 'all' || inv.type === selectedClass;
      const matchesQuery =
        !query ||
        inv.name.toLowerCase().includes(query) ||
        (inv.institution || '').toLowerCase().includes(query) ||
        (inv.notes || '').toLowerCase().includes(query);
      return matchesClass && matchesQuery;
    });
  }, [investments, selectedClass, searchTerm]);

  const allocationData = useMemo(() => {
    const totals = new Map<InvestmentType, number>();
    for (const inv of investments) {
      totals.set(inv.type, (totals.get(inv.type) ?? 0) + inv.currentValue);
    }
    return INVESTMENT_CLASSES.map((cls) => ({
      type: cls.value,
      name: cls.shortLabel,
      color: cls.color,
      value: Number((totals.get(cls.value) ?? 0).toFixed(2)),
    }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [investments]);

  const distinctClassesCount = allocationData.length;

  const openAddModal = () => {
    setEditingAsset(null);
    setShowAssetModal(true);
  };

  const openEditModal = (inv: Investment) => {
    setEditingAsset(inv);
    setShowAssetModal(true);
  };

  return (
    <div className="investments-panel">
      {/* Sub-navegação interna do hub de investimentos PRO */}
      <div className="pro-subnav" role="tablist" aria-label="Ferramentas de Investimentos PRO">
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'portfolio'}
          className={`pro-subnav-btn ${subTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setSubTab('portfolio')}
        >
          <Briefcase size={16} />
          <span>Carteira Completa</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'simulator'}
          className={`pro-subnav-btn ${subTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setSubTab('simulator')}
        >
          <Calculator size={16} />
          <span>Simulador Avançado</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'wealth'}
          className={`pro-subnav-btn ${subTab === 'wealth' ? 'active' : ''}`}
          onClick={() => setSubTab('wealth')}
        >
          <LineChart size={16} />
          <span>Evolução Patrimonial</span>
        </button>
      </div>

      {subTab === 'portfolio' && (
        <>
          {/* KPIs */}
          <div className="investment-stats-grid">
            <Card>
              <div className="investment-stat">
                <div className="investment-stat-icon investment-stat-icon-primary">
                  <DollarSign size={22} />
                </div>
                <div>
                  <div className="stat-label">Total Aportado</div>
                  <div className="stat-value">R$ {formatBRL(totalInvested)}</div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="investment-stat">
                <div className="investment-stat-icon investment-stat-icon-success">
                  <TrendingUp size={22} />
                </div>
                <div>
                  <div className="stat-label">Valor Atual da Carteira</div>
                  <div className="stat-value text-primary">R$ {formatBRL(totalValue)}</div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="investment-stat">
                <div
                  className={`investment-stat-icon ${
                    totalProfit >= 0
                      ? 'investment-stat-icon-success'
                      : 'investment-stat-icon-danger'
                  }`}
                >
                  {totalProfit >= 0 ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
                </div>
                <div>
                  <div className="stat-label">Resultado Acumulado</div>
                  <div
                    className={`stat-value ${
                      totalProfit >= 0 ? 'text-primary' : 'text-danger'
                    }`}
                  >
                    {totalProfit >= 0 ? '+' : '-'}R$ {formatBRL(Math.abs(totalProfit))}
                  </div>
                  <div
                    className={`investment-percentage ${
                      totalProfit >= 0 ? 'text-primary' : 'text-danger'
                    }`}
                  >
                    {totalProfit >= 0 ? '+' : ''}
                    {profitPercentage.toFixed(2).replace('.', ',')}%
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="investment-stat">
                <div className="investment-stat-icon investment-stat-icon-neutral">
                  <Layers size={22} />
                </div>
                <div>
                  <div className="stat-label">Diversificação</div>
                  <div className="stat-value">
                    {distinctClassesCount} {distinctClassesCount === 1 ? 'classe' : 'classes'}
                  </div>
                  <div className="investment-percentage text-muted">
                    {investments.length} {investments.length === 1 ? 'ativo' : 'ativos'}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Alocação por classe */}
          {allocationData.length > 0 && (
            <div className="investment-grid">
              <Card>
                <CardHeader
                  title="Alocação por Classe de Ativo"
                  subtitle="Distribuição proporcional do patrimônio investido"
                />
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={allocationData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="46%"
                        innerRadius={52}
                        outerRadius={92}
                        paddingAngle={2}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      >
                        {allocationData.map((entry) => (
                          <Cell key={entry.type} fill={entry.color} />
                        ))}
                      </Pie>
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
                        height={36}
                        iconType="circle"
                        iconSize={9}
                        wrapperStyle={{ fontSize: '0.82rem' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader
                  title="Resumo por Classe"
                  subtitle="Clique em uma classe para filtrar os ativos abaixo"
                />
                <CardContent>
                  <div className="allocation-rows">
                    {allocationData.map((item) => {
                      const pct = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                      const isSelected = selectedClass === item.type;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          className={`allocation-row-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() =>
                            setSelectedClass((prev) =>
                              prev === item.type ? 'all' : item.type
                            )
                          }
                        >
                          <div className="allocation-row-top">
                            <span className="allocation-name">
                              <span
                                className="allocation-swatch"
                                style={{ backgroundColor: item.color }}
                              />
                              {item.name}
                            </span>
                            <span className="allocation-nums">
                              <strong>R$ {formatBRL(item.value)}</strong>
                              <span>{pct.toFixed(1).replace('.', ',')}%</span>
                            </span>
                          </div>
                          <div className="allocation-bar-track">
                            <div
                              className="allocation-bar-fill"
                              style={{ width: `${pct}%`, backgroundColor: item.color }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Lista completa de ativos com busca e filtro */}
          <Card>
            <CardHeader
              title="Meus Ativos"
              subtitle={`${filteredInvestments.length} de ${investments.length} ${
                investments.length === 1 ? 'ativo' : 'ativos'
              }`}
              action={
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={openAddModal}
                  icon={<Plus size={16} />}
                >
                  Novo Ativo
                </Button>
              }
            />
            <CardContent className="p-0">
              {investments.length > 0 && (
                <div className="portfolio-toolbar">
                  <div className="portfolio-search-wrap">
                    <Search size={16} className="portfolio-search-icon" />
                    <input
                      type="text"
                      className="portfolio-search-input"
                      placeholder="Buscar por ativo, ticker ou corretora..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="portfolio-class-filters" role="group" aria-label="Filtrar por classe">
                    <button
                      type="button"
                      className={`portfolio-filter-btn ${selectedClass === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedClass('all')}
                    >
                      Todos
                    </button>
                    {INVESTMENT_CLASSES.map((cls) => (
                      <button
                        key={cls.value}
                        type="button"
                        className={`portfolio-filter-btn ${
                          selectedClass === cls.value ? 'active' : ''
                        }`}
                        onClick={() => setSelectedClass(cls.value)}
                      >
                        {cls.shortLabel}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading ? (
                <div className="spinner-container">
                  <div className="spinner" />
                </div>
              ) : investments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <TrendingUp size={44} />
                  </div>
                  <h3 className="empty-title">Monte sua carteira completa</h3>
                  <p className="empty-description">
                    Cadastre Renda Fixa, Ações, FIIs, Fundos, Cripto ou Reserva de Emergência para acompanhar alocação, rentabilidade e evolução patrimonial.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={openAddModal}
                    icon={<Plus size={18} />}
                  >
                    Cadastrar Primeiro Ativo
                  </Button>
                </div>
              ) : filteredInvestments.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-description">
                    Nenhum ativo encontrado com os filtros atuais.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedClass('all');
                      setSearchTerm('');
                    }}
                  >
                    Limpar filtros
                  </Button>
                </div>
              ) : (
                <InvestmentList
                  investments={filteredInvestments}
                  totalPortfolioValue={totalValue}
                  onQuickUpdateValue={onUpdateInvestmentValue}
                  onEdit={openEditModal}
                  onDelete={onDeleteInvestment}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      {subTab === 'simulator' && (
        <Card>
          <CardHeader
            title="Simulador de Investimentos Avançado"
            subtitle="Projete juros compostos descontando inflação (IPCA), imposto de renda regressivo e comparando cenários"
          />
          <CardContent>
            <InvestmentSimulator inline initialPortfolioValue={totalValue} />
          </CardContent>
        </Card>
      )}

      {subTab === 'wealth' && (
        <WealthEvolutionChart
          series={wealthSeries}
          loading={wealthLoading}
          currentCashBalance={currentCashBalance}
          currentInvestmentsValue={totalValue}
          onSaveSnapshot={onSaveWealthSnapshot}
        />
      )}

      {showAssetModal && (
        <AddInvestmentModal
          onClose={() => {
            setShowAssetModal(false);
            setEditingAsset(null);
          }}
          onAdd={onAddInvestment}
          onUpdate={onUpdateInvestment}
          editingInvestment={editingAsset}
        />
      )}
    </div>
  );
}
