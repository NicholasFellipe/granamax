// 💰 HOOK DE TRANSAÇÕES

import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Transaction } from '../types';

export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const transaction = doc.data();
        return {
          id: doc.id,
          ...transaction,
          date: transaction.date?.toDate() || new Date(),
          createdAt: transaction.createdAt?.toDate() || new Date(),
        } as Transaction;
      });
      setTransactions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addTransaction = async (
    description: string,
    amount: number,
    type: 'income' | 'expense',
    category: string
  ) => {
    if (!userId) throw new Error('User not authenticated');

    await addDoc(collection(db, 'transactions'), {
      userId,
      description,
      amount,
      type,
      category,
      date: Timestamp.now(),
      createdAt: Timestamp.now(),
    });
  };

  const deleteTransaction = async (id: string) => {
    await deleteDoc(doc(db, 'transactions', id));
  };

  // Cálculos
  const balance = transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount;
  }, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  return {
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
    balance,
    totalIncome,
    totalExpenses,
  };
}
