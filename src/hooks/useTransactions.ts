import { useState, useEffect } from 'react';
import type { Transaction } from '../types';

const API = 'http://localhost:3001';
const TOKEN_KEY = 'granamax_token';

function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    fetch(`${API}/transactions`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTransactions(data.map(t => ({
            ...t,
            date: new Date(t.date),
            createdAt: new Date(t.createdAt),
          })));
        }
      })
      .catch(err => console.error('Erro ao carregar transações:', err))
      .finally(() => setLoading(false));
  }, [userId]);

  const addTransaction = async (
    description: string,
    amount: number,
    type: 'income' | 'expense',
    category: string
  ) => {
    const res = await fetch(`${API}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ description, amount, type, category }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao adicionar transação');

    const newTransaction: Transaction = {
      ...data,
      date: new Date(data.date),
      createdAt: new Date(data.createdAt),
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const deleteTransaction = async (id: string) => {
    await fetch(`${API}/transactions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const balance = transactions.reduce((acc, t) =>
    t.type === 'income' ? acc + t.amount : acc - t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  return { transactions, loading, addTransaction, deleteTransaction, balance, totalIncome, totalExpenses };
}

export default useTransactions;
