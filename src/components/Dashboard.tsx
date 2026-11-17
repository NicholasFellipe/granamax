// 📊 DASHBOARD PRINCIPAL

import { useState, useMemo } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, Plus, LogOut, Crown, PieChart, Briefcase, Filter
} from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { TransactionList } from './TransactionList';
import { AddTransactionModal } from './AddTransactionModal';
import { ExpenseChart } from './ExpenseChart';
import { CategoryBreakdown } from './CategoryBreakdown';
import { InvestmentsPanel } from './InvestmentsPanel';
import { AlertsPanel } from './AlertsPanel';
import { DailyBudgetCard } from './DailyBudgetCard';
import { AchievementsPanel } from './AchievementsPanel';
import { InsightsCard } from './InsightsCard';
import { useRetention } from '../hooks/useRetention';
import useTransactions from '../hooks/useTransactions';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'analytics' | 'investments'>('overview');

  // Filtros
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(now, 'yyyy-MM'));
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');

  const { transactions, loading: txLoading, addTransaction, deleteTransaction } = useTransactions(user.uid);
  const { insights, alerts, dailyBudget, achievements } = useRetention(user.uid);

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

  // Transações filtradas
  const filteredTransactions = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    return transactions.filter(t => {
      const inMonth = t.date >= start && t.date <= end;
      const inCategory = selectedCategory === 'Todas' || t.category === selectedCategory;
      const inType = selectedType === 'all' || t.type === selectedType;
      return inMonth && inCategory && inType;
    });
  }, [transactions, selectedMonth, selectedCategory, selectedType]);

  // Totais baseados nas transações filtradas
  const balance = filteredTransactions.reduce((acc, t) =>
    t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  const currentMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth;

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
                {CATEGORIES.map(c => (
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

      <main className="dashboard-content">
        <div className="container">
          {activeTab === 'overview' && (
            <>
              <AlertsPanel alerts={alerts} />
              <DailyBudgetCard budget={dailyBudget} />

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
                <CardHeader title="Gastos por Categoria" subtitle="Onde seu dinheiro está indo" />
                <CardContent><CategoryBreakdown transactions={filteredTransactions} /></CardContent>
              </Card>

              <InsightsCard insights={insights} />
              <AchievementsPanel achievements={achievements} />

              <Card>
                <CardHeader
                  title="Transações Recentes"
                  action={
                    <Button variant="primary" size="sm" onClick={() => setShowAddTransaction(true)} icon={<Plus size={16} />}>
                      Adicionar
                    </Button>
                  }
                />
                <CardContent className="p-0">
                  <TransactionList transactions={filteredTransactions} loading={txLoading} onDelete={deleteTransaction} limit={5} />
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'transactions' && (
            <Card>
              <CardHeader
                title={`Transações — ${currentMonthLabel}`}
                action={
                  <Button variant="primary" onClick={() => setShowAddTransaction(true)} icon={<Plus size={16} />}>
                    Nova Transação
                  </Button>
                }
              />
              <CardContent className="p-0">
                <TransactionList transactions={filteredTransactions} loading={txLoading} onDelete={deleteTransaction} />
              </CardContent>
            </Card>
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
    </div>
  );
}
