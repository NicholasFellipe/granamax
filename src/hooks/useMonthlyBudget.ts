import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { MonthlyBudget } from '../types';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';

function useMonthlyBudget(userId: string | undefined) {
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    const path = 'monthlyBudgets';
    const q = query(collection(db, path), where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => {
          const b = docSnap.data();
          return {
            id: docSnap.id,
            userId: b.userId as string,
            month: b.month as string,
            limit: Number(b.limit),
            createdAt: b.createdAt?.toDate ? b.createdAt.toDate() : new Date(),
            updatedAt: b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(),
          } satisfies MonthlyBudget;
        });
        setBudgets(data);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const getBudgetForMonth = (month: string): MonthlyBudget | undefined =>
    budgets.find((b) => b.month === month);

  const setMonthlyBudget = async (month: string, limit: number) => {
    if (!userId) throw new Error('Usuário não autenticado');
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('Mês inválido');
    }
    if (!Number.isFinite(limit) || limit <= 0 || limit > 1000000000) {
      throw new Error('Informe um valor válido maior que zero');
    }

    const budgetId = `${userId}_${month}`;
    const path = `monthlyBudgets/${budgetId}`;
    const existing = getBudgetForMonth(month);

    if (existing) {
      try {
        await updateDoc(doc(db, 'monthlyBudgets', budgetId), {
          limit,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    } else {
      try {
        await setDoc(doc(db, 'monthlyBudgets', budgetId), {
          userId,
          month,
          limit,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
  };

  const deleteMonthlyBudget = async (month: string) => {
    if (!userId) throw new Error('Usuário não autenticado');
    const budgetId = `${userId}_${month}`;
    const path = `monthlyBudgets/${budgetId}`;
    try {
      await deleteDoc(doc(db, 'monthlyBudgets', budgetId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return {
    budgets,
    loading,
    getBudgetForMonth,
    setMonthlyBudget,
    deleteMonthlyBudget,
  };
}

export default useMonthlyBudget;
