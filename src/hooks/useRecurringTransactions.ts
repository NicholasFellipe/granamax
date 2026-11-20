import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { format, getDaysInMonth } from 'date-fns';
import { db } from '../config/firebase';
import type { RecurringTransaction } from '../types';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';

export interface CreateRecurringInput {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  dayOfMonth: number;
  populateCurrentMonth?: boolean;
}

const EMPTY_RECURRING_ITEMS: RecurringTransaction[] = [];

function useRecurringTransactions(userId: string | undefined) {
  const [recurringState, setRecurringState] = useState<{
    userId: string | undefined;
    items: RecurringTransaction[];
    loading: boolean;
  }>({ userId, items: [], loading: Boolean(userId) });

  const [autoPopulatedState, setAutoPopulatedState] = useState<{
    userId: string | undefined;
    items: string[];
  }>({ userId, items: [] });

  const processedKeysRef = useRef<Set<string>>(new Set());

  const recurringItems =
    recurringState.userId === userId ? recurringState.items : EMPTY_RECURRING_ITEMS;
  const loading = userId ? (recurringState.userId === userId ? recurringState.loading : true) : false;
  const autoPopulatedItems =
    autoPopulatedState.userId === userId ? autoPopulatedState.items : [];

  useEffect(() => {
    processedKeysRef.current.clear();

    if (!userId) {
      return;
    }

    const path = 'recurringTransactions';
    const q = query(collection(db, path), where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => {
          const r = docSnap.data();
          return {
            id: docSnap.id,
            userId: r.userId as string,
            description: r.description as string,
            amount: Number(r.amount),
            type: r.type as 'income' | 'expense',
            category: r.category as string,
            dayOfMonth: Number(r.dayOfMonth),
            active: Boolean(r.active),
            lastGeneratedMonth: (r.lastGeneratedMonth as string) || '',
            createdAt: r.createdAt?.toDate ? r.createdAt.toDate() : new Date(),
            updatedAt: r.updatedAt?.toDate ? r.updatedAt.toDate() : new Date(),
          } satisfies RecurringTransaction;
        });

        data.sort((a, b) => {
          if (a.active !== b.active) return a.active ? -1 : 1;
          return a.dayOfMonth - b.dayOfMonth;
        });

        setRecurringState({ userId, items: data, loading: false });
      },
      (err) => {
        setRecurringState({ userId, items: [], loading: false });
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Auto-populate due recurring transactions for the current month idempotently
  useEffect(() => {
    if (!userId || loading || recurringItems.length === 0) return;

    const now = new Date();
    const currentMonth = format(now, 'yyyy-MM');
    const todayDay = now.getDate();
    const daysInCurrentMonth = getDaysInMonth(now);

    const dueItems = recurringItems.filter((item) => {
      if (!item.active) return false;
      if (item.lastGeneratedMonth === currentMonth) return false;
      const effectiveDueDay = Math.min(item.dayOfMonth, daysInCurrentMonth);
      if (todayDay < effectiveDueDay) return false;
      const key = `${item.id}_${currentMonth}`;
      return !processedKeysRef.current.has(key);
    });

    if (dueItems.length === 0) return;

    dueItems.forEach((item) => {
      processedKeysRef.current.add(`${item.id}_${currentMonth}`);
    });

    let cancelled = false;

    const populateDueItems = async () => {
      const createdDescriptions: string[] = [];

      for (const item of dueItems) {
        if (cancelled) break;
        const txId = `rec_${item.id}_${currentMonth}`;
        const txRef = doc(db, 'transactions', txId);
        const recurringRef = doc(db, 'recurringTransactions', item.id);

        try {
          const txSnap = await getDoc(txRef);
          const batch = writeBatch(db);

          if (!txSnap.exists()) {
            batch.set(txRef, {
              userId,
              description: item.description.trim().slice(0, 120),
              amount: item.amount,
              type: item.type,
              category: item.category.trim().slice(0, 40) || 'Outros',
              date: serverTimestamp(),
              createdAt: serverTimestamp(),
            });
            createdDescriptions.push(item.description);
          }

          batch.update(recurringRef, {
            lastGeneratedMonth: currentMonth,
            updatedAt: serverTimestamp(),
          });

          await batch.commit();
        } catch (err) {
          processedKeysRef.current.delete(`${item.id}_${currentMonth}`);
          handleFirestoreError(err, OperationType.WRITE, `recurringTransactions/${item.id}`);
        }
      }

      if (!cancelled && createdDescriptions.length > 0) {
        setAutoPopulatedState((prev) => ({
          userId,
          items: Array.from(
            new Set([
              ...(prev.userId === userId ? prev.items : []),
              ...createdDescriptions,
            ])
          ),
        }));
      }
    };

    void populateDueItems();

    return () => {
      cancelled = true;
    };
  }, [userId, loading, recurringItems]);

  const addRecurringTransaction = useCallback(
    async (input: CreateRecurringInput) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const safeDescription = input.description.trim().slice(0, 120);
      const safeCategory = input.category.trim().slice(0, 40) || 'Outros';
      const safeDay = Math.trunc(input.dayOfMonth);

      if (!safeDescription) {
        throw new Error('Descrição é obrigatória');
      }
      if (!(input.amount > 0 && input.amount <= 1000000000)) {
        throw new Error('Valor inválido');
      }
      if (!Number.isInteger(safeDay) || safeDay < 1 || safeDay > 31) {
        throw new Error('Dia do mês inválido (use entre 1 e 31)');
      }

      const now = new Date();
      const currentMonth = format(now, 'yyyy-MM');
      const todayDay = now.getDate();
      const daysInCurrentMonth = getDaysInMonth(now);
      const shouldPopulate =
        input.populateCurrentMonth ?? todayDay >= Math.min(safeDay, daysInCurrentMonth);

      const recurringRef = doc(collection(db, 'recurringTransactions'));
      const batch = writeBatch(db);

      if (shouldPopulate) {
        processedKeysRef.current.add(`${recurringRef.id}_${currentMonth}`);
        const txRef = doc(db, 'transactions', `rec_${recurringRef.id}_${currentMonth}`);
        batch.set(txRef, {
          userId,
          description: safeDescription,
          amount: input.amount,
          type: input.type,
          category: safeCategory,
          date: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }

      batch.set(recurringRef, {
        userId,
        description: safeDescription,
        amount: input.amount,
        type: input.type,
        category: safeCategory,
        dayOfMonth: safeDay,
        active: true,
        lastGeneratedMonth: shouldPopulate ? currentMonth : '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      try {
        await batch.commit();
      } catch (err) {
        processedKeysRef.current.delete(`${recurringRef.id}_${currentMonth}`);
        handleFirestoreError(err, OperationType.CREATE, 'recurringTransactions');
      }
    },
    [userId]
  );

  const triggerRecurringForMonth = useCallback(
    async (item: RecurringTransaction, targetMonth?: string) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const month = targetMonth || format(new Date(), 'yyyy-MM');
      const txId = `rec_${item.id}_${month}`;
      const txRef = doc(db, 'transactions', txId);
      const recurringRef = doc(db, 'recurringTransactions', item.id);

      processedKeysRef.current.add(`${item.id}_${month}`);

      try {
        const txSnap = await getDoc(txRef);
        const batch = writeBatch(db);

        if (!txSnap.exists()) {
          batch.set(txRef, {
            userId,
            description: item.description.trim().slice(0, 120),
            amount: item.amount,
            type: item.type,
            category: item.category.trim().slice(0, 40) || 'Outros',
            date: serverTimestamp(),
            createdAt: serverTimestamp(),
          });
        }

        batch.update(recurringRef, {
          lastGeneratedMonth: month,
          updatedAt: serverTimestamp(),
        });

        await batch.commit();
      } catch (err) {
        processedKeysRef.current.delete(`${item.id}_${month}`);
        handleFirestoreError(err, OperationType.WRITE, `recurringTransactions/${item.id}`);
      }
    },
    [userId]
  );

  const toggleRecurringActive = useCallback(async (id: string, active: boolean) => {
    const path = `recurringTransactions/${id}`;
    try {
      await updateDoc(doc(db, 'recurringTransactions', id), {
        active,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }, []);

  const deleteRecurringTransaction = useCallback(async (id: string) => {
    const path = `recurringTransactions/${id}`;
    try {
      await deleteDoc(doc(db, 'recurringTransactions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }, []);

  const dismissAutoPopulatedBanner = useCallback(() => {
    setAutoPopulatedState({ userId, items: [] });
  }, [userId]);

  return {
    recurringItems,
    loading,
    autoPopulatedItems,
    addRecurringTransaction,
    triggerRecurringForMonth,
    toggleRecurringActive,
    deleteRecurringTransaction,
    dismissAutoPopulatedBanner,
  };
}

export default useRecurringTransactions;
