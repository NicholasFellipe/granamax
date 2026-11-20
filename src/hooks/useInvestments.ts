import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Investment } from '../types';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';

function useInvestments(userId: string | undefined, isPro: boolean) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !isPro) {
      setInvestments([]);
      setLoading(false);
      return;
    }

    const path = 'investments';
    const q = query(
      collection(db, path),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => {
          const inv = docSnap.data();
          return {
            id: docSnap.id,
            userId: inv.userId as string,
            name: inv.name as string,
            amount: Number(inv.amount),
            currentValue: Number(inv.currentValue),
            type: inv.type as Investment['type'],
            boughtAt: inv.boughtAt?.toDate ? inv.boughtAt.toDate() : new Date(),
            updatedAt: inv.updatedAt?.toDate ? inv.updatedAt.toDate() : new Date(),
          } satisfies Investment;
        });
        setInvestments(data);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [userId, isPro]);

  const addInvestment = async (
    name: string,
    amount: number,
    type: Investment['type']
  ) => {
    if (!userId) throw new Error('User not authenticated');
    if (!isPro) throw new Error('PRO subscription required');

    const safeName = name.trim().slice(0, 100);
    if (!safeName) throw new Error('Nome do investimento é obrigatório');
    if (!(amount > 0 && amount <= 1000000000)) {
      throw new Error('Valor inválido');
    }

    const path = 'investments';
    try {
      await addDoc(collection(db, path), {
        userId,
        name: safeName,
        amount,
        currentValue: amount,
        type,
        boughtAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateInvestmentValue = async (id: string, newValue: number) => {
    if (!(newValue >= 0 && newValue <= 1000000000)) {
      throw new Error('Valor inválido');
    }
    const path = `investments/${id}`;
    try {
      await updateDoc(doc(db, 'investments', id), {
        currentValue: newValue,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteInvestment = async (id: string) => {
    const path = `investments/${id}`;
    try {
      await deleteDoc(doc(db, 'investments', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const totalInvested = investments.reduce((acc, inv) => acc + inv.amount, 0);
  const totalValue = investments.reduce((acc, inv) => acc + inv.currentValue, 0);
  const totalProfit = totalValue - totalInvested;
  const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  return {
    investments,
    loading,
    addInvestment,
    updateInvestmentValue,
    deleteInvestment,
    totalInvested,
    totalValue,
    totalProfit,
    profitPercentage,
  };
}

export default useInvestments;
