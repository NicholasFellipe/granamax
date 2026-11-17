// 💡 CARD DE INSIGHTS

import { Lightbulb, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/Card';

interface Insights {
  todayExpenses: number;
  yesterdayExpenses: number;
  currentMonthExpenses: number;
  lastMonthExpenses: number;
  dailyAverage: number;
  projectedExpenses: number;
  monthComparison: number;
  daysRemaining: number;
}

interface InsightsCardProps {
  insights: Insights;
}

export function InsightsCard({ insights }: InsightsCardProps) {
  return (
    <Card>
      <CardHeader 
        title="Insights Inteligentes"
        subtitle="Análise do seu comportamento financeiro"
      />
      <CardContent>
        <div className="insights-grid">
          {/* Média Diária */}
          <div className="insight-item">
            <div className="insight-icon insight-icon-primary">
              <Calendar size={20} />
            </div>
            <div className="insight-content">
              <span className="insight-label">Média diária de gastos</span>
              <span className="insight-value">
                R$ {insights.dailyAverage.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Comparação Mensal */}
          <div className="insight-item">
            <div className={`insight-icon ${insights.monthComparison > 0 ? 'insight-icon-danger' : 'insight-icon-success'}`}>
              {insights.monthComparison > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
            <div className="insight-content">
              <span className="insight-label">
                {insights.monthComparison > 0 ? 'Aumento' : 'Economia'} vs mês passado
              </span>
              <span className={`insight-value ${insights.monthComparison > 0 ? 'text-danger' : 'text-primary'}`}>
                {insights.monthComparison > 0 ? '+' : ''}{insights.monthComparison.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Projeção */}
          <div className="insight-item">
            <div className="insight-icon insight-icon-warning">
              <Lightbulb size={20} />
            </div>
            <div className="insight-content">
              <span className="insight-label">Projeção fim do mês</span>
              <span className="insight-value">
                R$ {insights.projectedExpenses.toFixed(2).replace('.', ',')}
              </span>
              <span className="insight-note">
                Faltam {insights.daysRemaining} dias
              </span>
            </div>
          </div>
        </div>

        {/* Dica Personalizada */}
        <div className="insight-tip">
          <strong>💡 Dica Personalizada:</strong>
          {insights.monthComparison > 10 ? (
            <p>Seus gastos aumentaram muito. Revise despesas não essenciais e tente reduzir compras por impulso.</p>
          ) : insights.monthComparison < -10 ? (
            <p>Parabéns! Você está economizando. Continue assim e considere investir o que sobrar.</p>
          ) : insights.dailyAverage > 100 ? (
            <p>Sua média diária é alta. Tente definir um limite de gastos por dia para controlar melhor.</p>
          ) : (
            <p>Você está no caminho certo! Mantenha o controle diário e acompanhe seus gastos regularmente.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
