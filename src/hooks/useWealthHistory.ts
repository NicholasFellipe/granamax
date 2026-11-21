import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { format, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '../config/firebase';
import type { Investment, Transaction, WealthSnapshot } from '../types';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';

export interface WealthPoint {
  month: string; // YYYY-MM
  label: string; // e.g. "nov/26"
  cashBalance: number;
  investmentsValue: number;
  netWorth: number;
  isRecorded: boolean;
}

interface SnapshotsState {
  scopeKey: string;
  items: WealthSnapshot[];
  loaded: boolean;
}

function useWealthHistory(
  userId: string | undefined,
  isPro: boolean,
  transactions: Transaction[],
  investments: Investment[]
) {
  const scopeKey = userId && isPro ? userId : '';
  const [state, setState] = useState<SnapshotsState>({
    scopeKey: '',
    items: [],
    loaded: false,
  });

  useEffect(() => {
    if (!scopeKey) return;

    const path = 'wealthSnapshots';
    const q = query(collection(db, path), where('userId', '==', scopeKey));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs
          .map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              userId: d.userId as string,
              month: d.month as string,
              cashBalance: Number(d.cashBalance) || 0,
              investmentsValue: Number(d.investmentsValue) || 0,
              netWorth: Number(d.netWorth) || 0,
              createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
              updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : new Date(),
            } satisfies WealthSnapshot;
          })
          .sort((a, b) => a.month.localeCompare(b.month));

        setState({ scopeKey, items, loaded: true });
      },
      (err) => {
        setState({ scopeKey, items: [], loaded: true });
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [scopeKey]);

  const snapshots = useMemo(
    () => (scopeKey && state.scopeKey === scopeKey ? state.items : []),
    [scopeKey, state]
  );
  const loading = Boolean(scopeKey) && (!state.loaded || state.scopeKey !== scopeKey);

  const series = useMemo<WealthPoint[]>(() => {
    const now = new Date();
    const currentMonthKey = format(now, 'yyyy-MM');
    const snapshotMap = new Map(snapshots.map((s) => [s.month, s]));
    const currentInvestmentsTotal = investments.reduce((acc, inv) => acc + inv.currentValue, 0);

    const months: Date[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
    }

    return months.map((monthDate) => {
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthEnd = endOfMonth(monthDate);
      const label = format(monthDate, 'MMM/yy', { locale: ptBR });
      const recorded = snapshotMap.get(monthKey);

      if (recorded) {
        return {
          month: monthKey,
          label,
          cashBalance: recorded.cashBalance,
          investmentsValue: recorded.investmentsValue,
          netWorth: recorded.netWorth,
          isRecorded: true,
        };
      }

      const cumulativeCash = transactions
        .filter((t) => t.date <= monthEnd)
        .reduce((acc, t) => (t.type === 'income' ? acc + t.amount : acc - t.amount), 0);

      const estimatedInvestments =
        monthKey === currentMonthKey
          ? currentInvestmentsTotal
          : investments
              .filter((inv) => inv.boughtAt <= monthEnd)
              .reduce((acc, inv) => acc + inv.amount, 0);

      return {
        month: monthKey,
        label,
        cashBalance: Number(cumulativeCash.toFixed(2)),
        investmentsValue: Number(estimatedInvestments.toFixed(2)),
        netWorth: Number((cumulativeCash + estimatedInvestments).toFixed(2)),
        isRecorded: false,
      };
    });
  }, [snapshots, transactions, investments]);

  const saveMonthSnapshot = async (
    month: string,
    cashBalance: number,
    investmentsValue: number
  ) => {
    if (!userId) throw new Error('Usuário não autenticado.');
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('Mês de referência inválido.');
    }

    const safeCash = Math.max(-1000000000, Math.min(1000000000, Number(cashBalance.toFixed(2))));
    const safeInv = Math.max(0, Math.min(1000000000, Number(investmentsValue.toFixed(2))));
    const safeNet = Number((safeCash + safeInv).toFixed(2));

    const snapshotId = `${userId}_${month}`;
    const path = `wealthSnapshots/${snapshotId}`;
    const existing = snapshots.find((s) => s.month === month);

    try {
      if (existing) {
        await updateDoc(doc(db, 'wealthSnapshots', snapshotId), {
          cashBalance: safeCash,
          investmentsValue: safeInv,
          netWorth: safeNet,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'wealthSnapshots', snapshotId), {
          userId,
          month,
          cashBalance: safeCash,
          investmentsValue: safeInv,
          netWorth: safeNet,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(
        err,
        existing ? OperationType.UPDATE : OperationType.CREATE,
        path
      );
    }
  };

  return {
    snapshots,
    series,
    loading,
    saveMonthSnapshot,
  };
}

export default useWealthHistory;
