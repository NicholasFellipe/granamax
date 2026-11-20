import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Transaction } from '../types';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';

function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const path = 'transactions';
    const q = query(
      collection(db, path),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => {
          const t = docSnap.data();
          return {
            id: docSnap.id,
            userId: t.userId as string,
            description: t.description as string,
            amount: Number(t.amount),
            type: t.type as 'income' | 'expense',
            category: t.category as string,
            date: t.date?.toDate ? t.date.toDate() : new Date(),
            createdAt: t.createdAt?.toDate ? t.createdAt.toDate() : new Date(),
          } satisfies Transaction;
        });
        data.sort((a, b) => b.date.getTime() - a.date.getTime());
        setTransactions(data);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addTransaction = async (
    description: string,
    amount: number,
    type: 'income' | 'expense',
    category: string
  ) => {
    if (!userId) throw new Error('Usuário não autenticado');

    const safeDescription = description.trim().slice(0, 120);
    const safeCategory = category.trim().slice(0, 40) || 'Outros';
    if (!safeDescription) throw new Error('Descrição é obrigatória');
    if (!(amount > 0 && amount <= 1000000000)) {
      throw new Error('Valor inválido');
    }

    const path = 'transactions';
    try {
      const docRef = await addDoc(collection(db, path), {
        userId,
        description: safeDescription,
        amount,
        type,
        category: safeCategory,
        date: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return '';
    }
  };

  const updateTransactionCategory = async (id: string, category: string) => {
    const safeCategory = category.trim().slice(0, 40);
    if (!safeCategory) throw new Error('Categoria inválida');

    const path = `transactions/${id}`;
    try {
      await updateDoc(doc(db, 'transactions', id), {
        category: safeCategory,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteTransaction = async (id: string) => {
    const path = `transactions/${id}`;
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const balance = transactions.reduce(
    (acc, t) => (t.type === 'income' ? acc + t.amount : acc - t.amount),
    0
  );

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  return {
    transactions,
    loading,
    addTransaction,
    updateTransactionCategory,
    deleteTransaction,
    balance,
    totalIncome,
    totalExpenses,
  };
}

export default useTransactions;
