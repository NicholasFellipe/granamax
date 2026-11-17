// 📋 LISTA DE TRANSAÇÕES

import { TrendingUp, Trash2, ShoppingBag, Car, Home, Heart, GraduationCap, Coffee } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction, CategoryType } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  onDelete: (id: string) => Promise<void>;
  limit?: number;
}

const categoryIcons: Record<CategoryType, any> = {
  'Alimentação': Coffee,
  'Transporte': Car,
  'Moradia': Home,
  'Saúde': Heart,
  'Lazer': ShoppingBag,
  'Educação': GraduationCap,
  'Outros': ShoppingBag,
};

export function TransactionList({ transactions, loading, onDelete, limit }: TransactionListProps) {
  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

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

  return (
    <div className="transaction-list">
      {displayTransactions.map((transaction) => {
        const Icon = categoryIcons[transaction.category as CategoryType] || ShoppingBag;
        
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
                <span className="transaction-category">{transaction.category}</span>
                <span className="transaction-date">
                  {format(transaction.date, "dd 'de' MMM", { locale: ptBR })}
                </span>
              </div>
            </div>

            <div className="transaction-amount-wrapper">
              <div className={`transaction-amount transaction-amount-${transaction.type}`}>
                {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2).replace('.', ',')}
              </div>
              <button
                onClick={() => handleDelete(transaction.id)}
                className="transaction-delete"
                title="Excluir"
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
