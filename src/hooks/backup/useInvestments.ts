// 📈 HOOK DE INVESTIMENTOS (PRO)

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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Investment } from '../types';

export function useInvestments(userId: string | undefined, isPro: boolean) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !isPro) {
      setInvestments([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'investments'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const investment = doc.data();
        return {
          id: doc.id,
          ...investment,
          boughtAt: investment.boughtAt?.toDate() || new Date(),
          updatedAt: investment.updatedAt?.toDate() || new Date(),
        } as Investment;
      });
      setInvestments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, isPro]);

  const addInvestment = async (
    name: string,
    amount: number,
    type: Investment['type']
  ) => {
    if (!userId) throw new Error('User not authenticated');
    if (!isPro) throw new Error('PRO subscription required');

    await addDoc(collection(db, 'investments'), {
      userId,
      name,
      amount,
      currentValue: amount, // Valor inicial = valor investido
      type,
      boughtAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  };

  const updateInvestmentValue = async (id: string, newValue: number) => {
    await updateDoc(doc(db, 'investments', id), {
      currentValue: newValue,
      updatedAt: Timestamp.now(),
    });
  };

  const deleteInvestment = async (id: string) => {
    await deleteDoc(doc(db, 'investments', id));
  };

  // Cálculos
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
