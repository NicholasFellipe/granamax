// 📊 BREAKDOWN POR CATEGORIA

import type { Transaction, CategoryType } from '../types';

interface CategoryBreakdownProps {
  transactions: Transaction[];
  detailed?: boolean;
}

const categoryColors: Record<CategoryType, string> = {
  'Alimentação': '#EF4444',
  'Transporte': '#F59E0B',
  'Moradia': '#3B82F6',
  'Saúde': '#EC4899',
  'Lazer': '#8B5CF6',
  'Educação': '#10B981',
  'Outros': '#6B7280',
};

export function CategoryBreakdown({ transactions, detailed = false }: CategoryBreakdownProps) {
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Agrupar por categoria
  const categoryTotals = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.category as CategoryType;
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {} as Record<CategoryType, number>);

  // Ordenar por valor
  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, detailed ? 10 : 5);

  if (sortedCategories.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-description">Nenhuma despesa por categoria ainda</p>
      </div>
    );
  }

  return (
    <div className="category-breakdown">
      {sortedCategories.map(([category, amount]) => {
        const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
        const color = categoryColors[category as CategoryType];

        return (
          <div key={category} className="category-item">
            <div className="category-info">
              <div 
                className="category-indicator" 
                style={{ backgroundColor: color }}
              />
              <span className="category-name">{category}</span>
            </div>

            <div className="category-stats">
              <span className="category-amount">
                R$ {amount.toFixed(2).replace('.', ',')}
              </span>
              <span className="category-percentage">
                {percentage.toFixed(1)}%
              </span>
            </div>

            <div className="category-bar-wrapper">
              <div 
                className="category-bar"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: color
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
