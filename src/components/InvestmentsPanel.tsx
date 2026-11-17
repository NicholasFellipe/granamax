// 📈 PAINEL DE INVESTIMENTOS (PRO)

import { useState } from 'react';
import { TrendingUp, Plus, DollarSign, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import useInvestments from '../hooks/useInvestments';
import useAuth from '../hooks/useAuth';
import { InvestmentList } from './InvestmentList';
import { AddInvestmentModal } from './AddInvestmentModal';
import { InvestmentSimulator } from './InvestmentSimulator';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export function InvestmentsPanel() {
  const { user } = useAuth();
  const { 
    investments, 
    loading, 
    totalInvested, 
    totalValue, 
    totalProfit, 
    profitPercentage 
  } = useInvestments(user?.uid, user?.isPro || false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  if (!user?.isPro) {
    return null;
  }

  // Dados para gráfico de pizza
  const investmentsByType = investments.reduce((acc, inv) => {
    const existing = acc.find(item => item.name === inv.type);
    if (existing) {
      existing.value += inv.currentValue;
    } else {
      acc.push({
        name: inv.type === 'stocks' ? 'Ações' :
              inv.type === 'crypto' ? 'Cripto' :
              inv.type === 'funds' ? 'Fundos' : 'Poupança',
        value: inv.currentValue,
      });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  const COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6'];

  return (
    <div className="investments-panel">
      {/* 📊 STATS GRID */}
      <div className="investment-stats-grid">
        <Card>
          <div className="investment-stat">
            <div className="investment-stat-icon investment-stat-icon-primary">
              <DollarSign size={24} />
            </div>
            <div>
              <div className="stat-label">Total Investido</div>
              <div className="stat-value">
                R$ {totalInvested.toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="investment-stat">
            <div className="investment-stat-icon investment-stat-icon-success">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="stat-label">Valor Atual</div>
              <div className="stat-value text-primary">
                R$ {totalValue.toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="investment-stat">
            <div className={`investment-stat-icon ${totalProfit >= 0 ? 'investment-stat-icon-success' : 'investment-stat-icon-danger'}`}>
              {totalProfit >= 0 ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
            </div>
            <div>
              <div className="stat-label">Lucro/Prejuízo</div>
              <div className={`stat-value ${totalProfit >= 0 ? 'text-primary' : 'text-danger'}`}>
                {totalProfit >= 0 ? '+' : ''}R$ {totalProfit.toFixed(2).replace('.', ',')}
              </div>
              <div className={`investment-percentage ${totalProfit >= 0 ? 'text-primary' : 'text-danger'}`}>
                {totalProfit >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 📈 GRÁFICO + AÇÕES */}
      <div className="investment-grid">
        {/* Distribuição */}
        {investments.length > 0 ? (
          <Card>
            <CardHeader title="Distribuição" subtitle="Seus investimentos por tipo" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={investmentsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {investmentsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {/* Ações Rápidas */}
        <Card>
          <CardHeader title="Ações Rápidas" />
          <CardContent>
            <div className="quick-actions">
              <button 
                onClick={() => setShowAddModal(true)}
                className="quick-action-btn"
              >
                <div className="quick-action-icon quick-action-icon-primary">
                  <Plus size={24} />
                </div>
                <div className="quick-action-content">
                  <div className="quick-action-title">Novo Investimento</div>
                  <div className="quick-action-desc">Registre um novo ativo</div>
                </div>
              </button>

              <button 
                onClick={() => setShowSimulator(true)}
                className="quick-action-btn"
              >
                <div className="quick-action-icon quick-action-icon-warning">
                  <PieChartIcon size={24} />
                </div>
                <div className="quick-action-content">
                  <div className="quick-action-title">Simulador</div>
                  <div className="quick-action-desc">Calcule seus rendimentos</div>
                </div>
              </button>
            </div>

            <div className="pro-tip">
              <Badge variant="pro" size="sm">DICA PRO</Badge>
              <p>Diversifique seus investimentos para reduzir riscos e maximizar retornos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 📋 LISTA DE INVESTIMENTOS */}
      <Card>
        <CardHeader 
          title="Meus Investimentos" 
          subtitle={`${investments.length} ${investments.length === 1 ? 'ativo' : 'ativos'} na carteira`}
          action={
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => setShowAddModal(true)}
              icon={<Plus size={16} />}
            >
              Adicionar
            </Button>
          }
        />
        <CardContent className="p-0">
          {loading ? (
            <div className="spinner-container">
              <div className="spinner" />
            </div>
          ) : investments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <TrendingUp size={48} />
              </div>
              <h3 className="empty-title">Nenhum investimento ainda</h3>
              <p className="empty-description">
                Comece registrando seus investimentos para acompanhar sua evolução patrimonial
              </p>
              <Button 
                variant="primary"
                onClick={() => setShowAddModal(true)}
                icon={<Plus size={20} />}
              >
                Adicionar Primeiro Investimento
              </Button>
            </div>
          ) : (
            <InvestmentList investments={investments} />
          )}
        </CardContent>
      </Card>

      {/* MODALS */}
      {showAddModal && (
        <AddInvestmentModal onClose={() => setShowAddModal(false)} />
      )}

      {showSimulator && (
        <InvestmentSimulator onClose={() => setShowSimulator(false)} />
      )}
    </div>
  );
}
