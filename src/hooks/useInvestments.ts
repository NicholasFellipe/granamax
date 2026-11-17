import { useState, useEffect } from 'react';
import type { Investment } from '../types';

const STORAGE_KEY = 'granamax_investments';

function useInvestments(userId: string | undefined, isPro: boolean) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !isPro) {
      setInvestments([]);
      setLoading(false);
      return;
    }

    const loadInvestments = () => {
      const data = localStorage.getItem(STORAGE_KEY);
      const allInvestments: Investment[] = data ? JSON.parse(data) : [];
      
      const userInvestments = allInvestments
        .filter(inv => inv.userId === userId)
        .map(inv => ({
          ...inv,
          boughtAt: new Date(inv.boughtAt),
          updatedAt: new Date(inv.updatedAt),
        }));

      setInvestments(userInvestments);
      setLoading(false);
    };

    loadInvestments();
  }, [userId, isPro]);

  const saveToStorage = (newInvestments: Investment[]) => {
    const data = localStorage.getItem(STORAGE_KEY);
    const allInvestments: Investment[] = data ? JSON.parse(data) : [];
    
    const otherUsersInvestments = allInvestments.filter(inv => inv.userId !== userId);
    const updated = [...otherUsersInvestments, ...newInvestments];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addInvestment = async (
    name: string,
    amount: number,
    type: Investment['type']
  ) => {
    if (!userId) throw new Error('User not authenticated');
    if (!isPro) throw new Error('PRO subscription required');

    const newInvestment: Investment = {
      id: crypto.randomUUID(),
      userId,
      name,
      amount,
      currentValue: amount,
      type,
      boughtAt: new Date(),
      updatedAt: new Date(),
    };

    const updated = [...investments, newInvestment];
    setInvestments(updated);
    saveToStorage(updated);
  };

  const updateInvestmentValue = async (id: string, newValue: number) => {
    const updated = investments.map(inv =>
      inv.id === id
        ? { ...inv, currentValue: newValue, updatedAt: new Date() }
        : inv
    );
    setInvestments(updated);
    saveToStorage(updated);
  };

  const deleteInvestment = async (id: string) => {
    const updated = investments.filter(inv => inv.id !== id);
    setInvestments(updated);
    saveToStorage(updated);
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
