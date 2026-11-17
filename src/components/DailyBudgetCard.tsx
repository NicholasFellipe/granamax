// 🎯 CARD DE META DIÁRIA

import { Target, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';

interface DailyBudget {
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
}

interface DailyBudgetCardProps {
  budget: DailyBudget;
}

export function DailyBudgetCard({ budget }: DailyBudgetCardProps) {
  const isOverBudget = budget.spent > budget.limit;
  const isNearLimit = budget.percentage > 80 && budget.percentage <= 100;

  return (
    <Card className="daily-budget-card">
      <CardHeader 
        title="Meta Diária"
        subtitle="Quanto você pode gastar hoje"
        action={
          <Badge 
            variant={isOverBudget ? 'danger' : isNearLimit ? 'warning' : 'success'}
            size="sm"
          >
            {budget.percentage.toFixed(0)}%
          </Badge>
        }
      />
      <CardContent>
        <div className="budget-display">
          <div className="budget-icon-wrapper">
            <div className={`budget-icon ${isOverBudget ? 'budget-icon-danger' : 'budget-icon-success'}`}>
              <Target size={32} />
            </div>
          </div>

          <div className="budget-values">
            <div className="budget-main">
              <span className="budget-label">Você pode gastar hoje:</span>
              <span className="budget-amount">
                R$ {budget.limit.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div className="budget-secondary">
              <div className="budget-stat">
                <span className="budget-stat-label">Gasto</span>
                <span className={`budget-stat-value ${isOverBudget ? 'text-danger' : ''}`}>
                  R$ {budget.spent.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="budget-stat">
                <span className="budget-stat-label">
                  {isOverBudget ? 'Excedeu' : 'Resta'}
                </span>
                <span className={`budget-stat-value ${isOverBudget ? 'text-danger' : 'text-primary'}`}>
                  {isOverBudget ? (
                    <>
                      <TrendingUp size={16} />
                      R$ {Math.abs(budget.remaining).toFixed(2).replace('.', ',')}
                    </>
                  ) : (
                    <>
                      <TrendingDown size={16} />
                      R$ {budget.remaining.toFixed(2).replace('.', ',')}
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="budget-progress-wrapper">
          <div className="budget-progress-bar">
            <div 
              className={`budget-progress-fill ${
                isOverBudget ? 'budget-progress-danger' : 
                isNearLimit ? 'budget-progress-warning' : 
                'budget-progress-success'
              }`}
              style={{ width: `${Math.min(100, budget.percentage)}%` }}
            />
          </div>
        </div>

        {/* Mensagem */}
        {isOverBudget ? (
          <div className="budget-message budget-message-danger">
            ⚠️ Você ultrapassou a meta de hoje! Tente economizar amanhã.
          </div>
        ) : isNearLimit ? (
          <div className="budget-message budget-message-warning">
            🔔 Cuidado! Você está perto do limite de hoje.
          </div>
        ) : budget.percentage < 50 ? (
          <div className="budget-message budget-message-success">
            🎉 Ótimo! Você está economizando hoje.
          </div>
        ) : (
          <div className="budget-message budget-message-info">
            👍 Você está dentro da meta!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
