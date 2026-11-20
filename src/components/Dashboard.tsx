// 📊 DASHBOARD PRINCIPAL

import { useState, useMemo } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, Plus, LogOut, Crown, PieChart, Briefcase, Filter, Repeat, CheckCircle2, X, Mic
} from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { TransactionList } from './TransactionList';
import { AddTransactionModal } from './AddTransactionModal';
import { VoiceTransactionModal } from './VoiceTransactionModal';
import { ExpenseChart } from './ExpenseChart';
import { CategoryBreakdown } from './CategoryBreakdown';
import { InvestmentsPanel } from './InvestmentsPanel';
import { RecurringTransactionsPanel } from './RecurringTransactionsPanel';
import { AlertsPanel } from './AlertsPanel';
import { DailyBudgetCard } from './DailyBudgetCard';
import { MonthlyBudgetCard } from './MonthlyBudgetCard';
import { AchievementsPanel } from './AchievementsPanel';
import { InsightsCard } from './InsightsCard';
import { useRetention } from '../hooks/useRetention';
import useTransactions from '../hooks/useTransactions';
import useMonthlyBudget from '../hooks/useMonthlyBudget';
import useRecurringTransactions from '../hooks/useRecurringTransactions';
import type { User } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CATEGORIES = ['Todas', 'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Educação', 'Outros'];

interface DashboardProps {
  user: User;
  onSignOut: () => void;
  onUpgradeToPro: () => void;
}

export function Dashboard({ user, onSignOut, onUpgradeToPro }: DashboardProps) {
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showVoiceTransaction, setShowVoiceTransaction] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'transactions' | 'recurring' | 'analytics' | 'investments'
  >('overview');

  // Filtros
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(now, 'yyyy-MM'));
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');

  const {
    transactions,
    loading: txLoading,
    addTransaction,
    updateTransactionCategory,
    deleteTransaction,
  } = useTransactions(user.uid);
  const { insights, alerts, dailyBudget, achievements } = useRetention(user.uid);
  const {
    loading: monthlyBudgetLoading,
    getBudgetForMonth,
    setMonthlyBudget,
    deleteMonthlyBudget,
  } = useMonthlyBudget(user.uid);
  const {
    recurringItems,
    loading: recurringLoading,
    autoPopulatedItems,
    addRecurringTransaction,
    triggerRecurringForMonth,
    toggleRecurringActive,
    deleteRecurringTransaction,
    dismissAutoPopulatedBanner,
  } = useRecurringTransactions(user.uid);

  // Gerar lista dos últimos 12 meses para o seletor
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return {
        value: format(d, 'yyyy-MM'),
        label: format(d, "MMMM 'de' yyyy", { locale: ptBR }),
      };
    });
  }, []);

  const availableCategories = useMemo(() => {
    const base = CATEGORIES.filter(c => c !== 'Todas');
    const custom = transactions.map(t => t.category).filter(Boolean);
    return Array.from(new Set([...base, ...custom]));
  }, [transactions]);

  const monthTransactions = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    return transactions.filter(t => {
      const inMonth = t.date >= start && t.date <= end;
      const inType = selectedType === 'all' || t.type === selectedType;
      return inMonth && inType;
    });
  }, [transactions, selectedMonth, selectedType]);

  // Transações filtradas
  const filteredTransactions = useMemo(() => {
    return monthTransactions.filter(t => {
      return selectedCategory === 'Todas' || t.category === selectedCategory;
    });
  }, [monthTransactions, selectedCategory]);

  // Totais baseados nas transações filtradas
  const balance = filteredTransactions.reduce((acc, t) =>
    t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  const currentMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth;

  const monthlyExpenses = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    return transactions
      .filter(t => t.type === 'expense' && t.date >= start && t.date <= end)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions, selectedMonth]);

  const activeMonthlyBudget = getBudgetForMonth(selectedMonth);

  const fullName = user.displayName?.trim() || user.email.split('@')[0];
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : fullName.slice(0, 2).toUpperCase();
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const showPhoto = Boolean(user.photoURL && failedPhotoUrl !== user.photoURL);

  return (
    <div className="dashboard">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="container">
          <div className="dashboard-nav">
            <div className="dashboard-brand">
              <Wallet size={28} className="brand-icon" />
              <h1 className="brand-title">GranaMax</h1>
            </div>
            <div className="dashboard-user">
              <div className="dashboard-profile" title={user.email}>
                {showPhoto ? (
                  <img
                    src={user.photoURL}
                    alt={fullName}
                    className="dashboard-avatar"
                    referrerPolicy="no-referrer"
                    onError={() => setFailedPhotoUrl(user.photoURL || null)}
                  />
                ) : (
                  <span className="dashboard-avatar-fallback" aria-hidden="true">
                    {initials}
                  </span>
                )}
                <div className="dashboard-profile-text">
                  <span className="dashboard-profile-name">{fullName}</span>
                </div>
              </div>
              {user.isPro ? (
                <Badge variant="pro" size="sm"><Crown size={14} />PRO</Badge>
              ) : (
                <Button variant="pro" size="sm" onClick={onUpgradeToPro} icon={<Crown size={16} />}>
                  Upgrade PRO
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onSignOut} icon={<LogOut size={16} />}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* TABS */}
      <div className="dashboard-tabs">
        <div className="container">
          <div className="tabs">
            <button className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`} onClick={() => setActiveTab('overview')}>
              Visão Geral
            </button>
            <button className={`tab ${activeTab === 'transactions' ? 'tab-active' : ''}`} onClick={() => setActiveTab('transactions')}>
              Transações
            </button>
            <button className={`tab ${activeTab === 'recurring' ? 'tab-active' : ''}`} onClick={() => setActiveTab('recurring')}>
              <Repeat size={16} />Recorrentes
            </button>
            <button className={`tab ${activeTab === 'analytics' ? 'tab-active' : ''}`} onClick={() => setActiveTab('analytics')}>
              <PieChart size={16} />Análise
              {!user.isPro && <Badge variant="pro" size="sm">PRO</Badge>}
            </button>
            {user.isPro && (
              <button className={`tab ${activeTab === 'investments' ? 'tab-active' : ''}`} onClick={() => setActiveTab('investments')}>
                <Briefcase size={16} />Investimentos
                <Badge variant="pro" size="sm">PRO</Badge>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FILTROS */}
      {activeTab !== 'recurring' && activeTab !== 'investments' && (
      <div className="filters-bar">
        <div className="container">
          <div className="filters-row">
            <div className="filter-group">
              <Filter size={16} className="filter-icon" />
              <select
                className="filter-select"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
              >
                {monthOptions.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select
                className="filter-select"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                <option value="Todas">Todas</option>
                {availableCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <select
                className="filter-select"
                value={selectedType}
                onChange={e => setSelectedType(e.target.value as 'all' | 'income' | 'expense')}
              >
                <option value="all">Receitas e Despesas</option>
                <option value="income">Só Receitas</option>
                <option value="expense">Só Despesas</option>
              </select>
            </div>

            {(selectedCategory !== 'Todas' || selectedType !== 'all') && (
              <button
                className="filter-clear"
                onClick={() => { setSelectedCategory('Todas'); setSelectedType('all'); }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      <main className="dashboard-content">
        <div className="container">
          {autoPopulatedItems.length > 0 && (
            <div className="recurring-autopop-banner" role="status">
              <div className="recurring-autopop-content">
                <CheckCircle2 size={18} className="recurring-autopop-icon" />
                <span>
                  <strong>
                    {autoPopulatedItems.length === 1
                      ? '1 lançamento recorrente lançado automaticamente:'
                      : `${autoPopulatedItems.length} lançamentos recorrentes lançados automaticamente:`}
                  </strong>{' '}
                  {autoPopulatedItems.join(', ')}.
                </span>
              </div>
              <button
                type="button"
                className="recurring-autopop-close"
                onClick={dismissAutoPopulatedBanner}
                aria-label="Dispensar aviso"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {activeTab === 'overview' && (
            <>
              <AlertsPanel alerts={alerts} />
              <div className="budgets-grid">
                <DailyBudgetCard budget={dailyBudget} />
                <MonthlyBudgetCard
                  month={selectedMonth}
                  monthLabel={currentMonthLabel}
                  spent={monthlyExpenses}
                  limit={activeMonthlyBudget ? activeMonthlyBudget.limit : null}
                  loading={monthlyBudgetLoading}
                  onSaveLimit={setMonthlyBudget}
                  onRemoveLimit={deleteMonthlyBudget}
                />
              </div>

              <div className="stats-grid">
                <Card className="stat-card-primary">
                  <div className="stat-label">Saldo</div>
                  <div className="stat-value stat-value-large">
                    {balance >= 0 ? (
                      <span className="text-primary">R$ {balance.toFixed(2).replace('.', ',')}</span>
                    ) : (
                      <span className="text-danger">-R$ {Math.abs(balance).toFixed(2).replace('.', ',')}</span>
                    )}
                  </div>
                  <div className="stat-period">{currentMonthLabel}</div>
                </Card>
                <Card className="stat-card-income">
                  <div className="stat-icon stat-icon-income"><TrendingUp size={24} /></div>
                  <div className="stat-label">Receitas</div>
                  <div className="stat-value">R$ {totalIncome.toFixed(2).replace('.', ',')}</div>
                </Card>
                <Card className="stat-card-expense">
                  <div className="stat-icon stat-icon-expense"><TrendingDown size={24} /></div>
                  <div className="stat-label">Despesas</div>
                  <div className="stat-value">R$ {totalExpenses.toFixed(2).replace('.', ',')}</div>
                </Card>
              </div>

              <Card>
                <CardHeader title="Últimos 7 dias" subtitle="Acompanhe seus gastos diários" />
                <CardContent><ExpenseChart transactions={filteredTransactions} /></CardContent>
              </Card>

              <Card>
                <CardHeader
                  title="Distribuição de Despesas por Categoria"
                  subtitle="Proporção dos seus gastos em Moradia, Alimentação, Lazer e outras categorias"
                  action={
                    selectedCategory !== 'Todas' ? (
                      <button
                        type="button"
                        className="filter-clear"
                        onClick={() => setSelectedCategory('Todas')}
                      >
                        Filtro: {selectedCategory} ×
                      </button>
                    ) : undefined
                  }
                />
                <CardContent>
                  <CategoryBreakdown
                    transactions={monthTransactions}
                    loading={txLoading}
                    activeCategory={selectedCategory}
                    onSelectCategory={(cat) =>
                      setSelectedCategory(prev => (prev === cat ? 'Todas' : cat))
                    }
                    onAddExpense={() => setShowAddTransaction(true)}
                  />
                </CardContent>
              </Card>

              <InsightsCard insights={insights} />
              <AchievementsPanel achievements={achievements} />

              <Card>
                <CardHeader
                  title="Transações Recentes"
                  action={
                    <div className="dashboard-card-actions">
                      <Button variant="secondary" size="sm" onClick={() => setShowVoiceTransaction(true)} icon={<Mic size={16} />}>
                        Por Voz
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setShowAddTransaction(true)} icon={<Plus size={16} />}>
                        Adicionar
                      </Button>
                    </div>
                  }
                />
                <CardContent className="p-0">
                  <TransactionList
                    transactions={filteredTransactions}
                    loading={txLoading}
                    onDelete={deleteTransaction}
                    onUpdateCategory={updateTransactionCategory}
                    availableCategories={availableCategories}
                    limit={5}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'transactions' && (
            <Card>
              <CardHeader
                title={`Transações — ${currentMonthLabel}`}
                action={
                  <div className="dashboard-card-actions">
                    <Button variant="secondary" onClick={() => setShowVoiceTransaction(true)} icon={<Mic size={16} />}>
                      Adicionar por Voz
                    </Button>
                    <Button variant="primary" onClick={() => setShowAddTransaction(true)} icon={<Plus size={16} />}>
                      Nova Transação
                    </Button>
                  </div>
                }
              />
              <CardContent className="p-0">
                <TransactionList
                  transactions={filteredTransactions}
                  loading={txLoading}
                  onDelete={deleteTransaction}
                  onUpdateCategory={updateTransactionCategory}
                  availableCategories={availableCategories}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'recurring' && (
            <RecurringTransactionsPanel
              items={recurringItems}
              loading={recurringLoading}
              onAdd={addRecurringTransaction}
              onToggleActive={toggleRecurringActive}
              onTriggerNow={triggerRecurringForMonth}
              onDelete={deleteRecurringTransaction}
            />
          )}

          {activeTab === 'analytics' && (
            <>
              {user.isPro ? (
                <div className="analytics-grid">
                  <Card>
                    <CardHeader title="Evolução Mensal" />
                    <CardContent><ExpenseChart transactions={filteredTransactions} showComparison /></CardContent>
                  </Card>
                  <Card>
                    <CardHeader title="Categorias Detalhadas" />
                    <CardContent><CategoryBreakdown transactions={filteredTransactions} detailed /></CardContent>
                  </Card>
                  <Card>
                    <CardHeader title="Previsão de Gastos" subtitle="Baseado no seu histórico" />
                    <CardContent>
                      <div className="prediction-info">
                        <div className="prediction-item">
                          <span className="prediction-label">Previsão para o mês:</span>
                          <span className="prediction-value text-warning">
                            R$ {(totalExpenses * 1.15).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <p className="prediction-note">
                          ⚠️ Você está gastando mais que o normal. Considere reduzir despesas não essenciais.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="pro-upsell-card">
                  <div className="empty-state">
                    <div className="empty-icon"><Crown size={64} /></div>
                    <h3 className="empty-title">Análise Avançada - PRO</h3>
                    <p className="empty-description">
                      Desbloqueie análises detalhadas, previsões inteligentes e insights para maximizar suas economias
                    </p>
                    <Button variant="pro" size="lg" onClick={onUpgradeToPro} icon={<Crown size={20} />}>
                      Assinar GranaMax PRO - R$ 9,90/mês
                    </Button>
                  </div>
                </Card>
              )}
            </>
          )}

          {activeTab === 'investments' && user.isPro && <InvestmentsPanel />}
        </div>
      </main>

      {showAddTransaction && (
        <AddTransactionModal onClose={() => setShowAddTransaction(false)} onAdd={addTransaction} />
      )}

      {showVoiceTransaction && (
        <VoiceTransactionModal
          onClose={() => setShowVoiceTransaction(false)}
          onAdd={addTransaction}
          onDelete={deleteTransaction}
        />
      )}
    </div>
  );
}
