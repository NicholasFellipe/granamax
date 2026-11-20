import { useState } from 'react';
import {
  TrendingUp,
  Trash2,
  ShoppingBag,
  Car,
  Home,
  Heart,
  GraduationCap,
  Coffee,
  Tag,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction, CategoryType } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  onDelete: (id: string) => Promise<void>;
  onUpdateCategory?: (id: string, category: string) => Promise<void>;
  availableCategories?: string[];
  limit?: number;
}

const DEFAULT_CATEGORIES: CategoryType[] = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Lazer',
  'Educação',
  'Outros',
];

const categoryIcons: Record<string, typeof ShoppingBag> = {
  'Alimentação': Coffee,
  'Transporte': Car,
  'Moradia': Home,
  'Saúde': Heart,
  'Lazer': ShoppingBag,
  'Educação': GraduationCap,
  'Outros': Tag,
};

export function TransactionList({
  transactions,
  loading,
  onDelete,
  onUpdateCategory,
  availableCategories,
  limit,
}: TransactionListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

  const categoryOptions = Array.from(
    new Set([...(availableCategories || DEFAULT_CATEGORIES), ...transactions.map((t) => t.category)])
  );

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );
  }

  if (displayTransactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <TrendingUp size={48} />
        </div>
        <h3 className="empty-title">Nenhuma transação ainda</h3>
        <p className="empty-description">
          Comece adicionando suas receitas e despesas para ter controle total
        </p>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      await onDelete(id);
    }
  };

  const handleCategoryChange = async (id: string, nextCategory: string) => {
    if (!onUpdateCategory) return;
    setUpdatingId(id);
    try {
      await onUpdateCategory(id, nextCategory);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="transaction-list">
      {displayTransactions.map((transaction) => {
        const Icon = categoryIcons[transaction.category] || Tag;

        return (
          <div key={transaction.id} className="transaction-item">
            <div className="transaction-icon-wrapper">
              <div className={`transaction-icon transaction-icon-${transaction.type}`}>
                <Icon size={20} />
              </div>
            </div>

            <div className="transaction-details">
              <div className="transaction-description">{transaction.description}</div>
              <div className="transaction-meta">
                {onUpdateCategory ? (
                  <select
                    className="transaction-category-select"
                    value={transaction.category}
                    disabled={updatingId === transaction.id}
                    aria-label={`Categoria de ${transaction.description}`}
                    onChange={(e) => handleCategoryChange(transaction.id, e.target.value)}
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="transaction-category">{transaction.category}</span>
                )}
                <span className="transaction-date">
                  {format(transaction.date, "dd 'de' MMM", { locale: ptBR })}
                </span>
              </div>
            </div>

            <div className="transaction-amount-wrapper">
              <div className={`transaction-amount transaction-amount-${transaction.type}`}>
                {transaction.type === 'income' ? '+' : '-'}R${' '}
                {transaction.amount.toFixed(2).replace('.', ',')}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(transaction.id)}
                className="transaction-delete"
                title="Excluir"
                aria-label={`Excluir ${transaction.description}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
