import { useState, useEffect, useMemo } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { startOfMonth, endOfMonth } from 'date-fns';
import { db } from '../config/firebase';
import type {
  CustomAlert,
  CustomAlertMetric,
  EvaluatedAlert,
  Transaction,
} from '../types';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';

export interface CreateCustomAlertInput {
  name: string;
  metric: CustomAlertMetric;
  category?: string;
  threshold: number;
}

export interface EvaluatedCustomAlertStatus {
  rule: CustomAlert;
  triggered: boolean;
  currentValue: number;
  summaryText: string;
}

interface AlertsState {
  scopeKey: string;
  items: CustomAlert[];
  loaded: boolean;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const FREE_ALERT_LIMIT = 2;

function useCustomAlerts(
  userId: string | undefined,
  isPro: boolean,
  transactions: Transaction[],
  portfolioValue: number
) {
  const scopeKey = userId || '';
  const [state, setState] = useState<AlertsState>({
    scopeKey: '',
    items: [],
    loaded: false,
  });

  useEffect(() => {
    if (!scopeKey) return;

    const path = 'customAlerts';
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
              name: d.name as string,
              metric: d.metric as CustomAlertMetric,
              category: typeof d.category === 'string' ? d.category : '',
              threshold: Number(d.threshold) || 0,
              active: Boolean(d.active),
              createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
              updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : new Date(),
            } satisfies CustomAlert;
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setState({ scopeKey, items, loaded: true });
      },
      (err) => {
        setState({ scopeKey, items: [], loaded: true });
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [scopeKey]);

  const rules = useMemo(
    () => (scopeKey && state.scopeKey === scopeKey ? state.items : []),
    [scopeKey, state]
  );
  const loading = Boolean(scopeKey) && (!state.loaded || state.scopeKey !== scopeKey);

  const evaluations = useMemo<EvaluatedCustomAlertStatus[]>(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthTx = transactions.filter((t) => t.date >= monthStart && t.date <= monthEnd);
    const monthBalance = monthTx.reduce(
      (acc, t) => (t.type === 'income' ? acc + t.amount : acc - t.amount),
      0
    );
    const maxSingleExpense = monthTx
      .filter((t) => t.type === 'expense')
      .reduce((max, t) => Math.max(max, t.amount), 0);

    return rules.map((rule) => {
      if (rule.metric === 'category_monthly') {
        const spent = monthTx
          .filter((t) => t.type === 'expense' && t.category === rule.category)
          .reduce((acc, t) => acc + t.amount, 0);
        const triggered = rule.active && spent >= rule.threshold;
        return {
          rule,
          triggered,
          currentValue: spent,
          summaryText: `Gasto atual em ${rule.category || 'Categoria'}: R$ ${formatBRL(spent)} / R$ ${formatBRL(rule.threshold)}`,
        };
      }

      if (rule.metric === 'min_balance') {
        const triggered = rule.active && monthTx.length > 0 && monthBalance < rule.threshold;
        return {
          rule,
          triggered,
          currentValue: monthBalance,
          summaryText: `Saldo mensal atual: R$ ${formatBRL(monthBalance)} (mínimo: R$ ${formatBRL(rule.threshold)})`,
        };
      }

      if (rule.metric === 'single_expense') {
        const triggered = rule.active && maxSingleExpense >= rule.threshold;
        return {
          rule,
          triggered,
          currentValue: maxSingleExpense,
          summaryText: `Maior despesa única no mês: R$ ${formatBRL(maxSingleExpense)} (limite: R$ ${formatBRL(rule.threshold)})`,
        };
      }

      // portfolio_goal
      const triggered = rule.active && portfolioValue >= rule.threshold;
      return {
        rule,
        triggered,
        currentValue: portfolioValue,
        summaryText: `Carteira atual: R$ ${formatBRL(portfolioValue)} / meta R$ ${formatBRL(rule.threshold)}`,
      };
    });
  }, [rules, transactions, portfolioValue]);

  const triggeredDashboardAlerts = useMemo<EvaluatedAlert[]>(() => {
    return evaluations
      .filter((ev) => ev.triggered)
      .map((ev) => {
        if (ev.rule.metric === 'portfolio_goal') {
          return {
            id: `custom-${ev.rule.id}`,
            type: 'info',
            title: `Meta atingida: ${ev.rule.name}`,
            message: ev.summaryText,
            icon: '🎯',
          };
        }
        return {
          id: `custom-${ev.rule.id}`,
          type: ev.rule.metric === 'min_balance' ? 'danger' : 'warning',
          title: `Alerta personalizado: ${ev.rule.name}`,
          message: ev.summaryText,
          icon: ev.rule.metric === 'min_balance' ? '🚨' : '🔔',
        };
      });
  }, [evaluations]);

  const addCustomAlert = async (input: CreateCustomAlertInput) => {
    if (!userId) throw new Error('Usuário não autenticado.');
    if (!isPro && rules.length >= FREE_ALERT_LIMIT) {
      throw new Error(
        `No plano Grátis você pode criar até ${FREE_ALERT_LIMIT} alertas personalizados. Assine o GranaMax PRO para alertas ilimitados.`
      );
    }

    const safeName = input.name.trim().slice(0, 80);
    if (!safeName) throw new Error('Informe um nome para o alerta.');
    if (!(input.threshold > 0 && input.threshold <= 1000000000)) {
      throw new Error('Informe um valor de referência maior que zero.');
    }

    const safeCategory =
      input.metric === 'category_monthly'
        ? (input.category || 'Alimentação').trim().slice(0, 40)
        : '';

    const path = 'customAlerts';
    try {
      await addDoc(collection(db, path), {
        userId,
        name: safeName,
        metric: input.metric,
        category: safeCategory,
        threshold: input.threshold,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const toggleCustomAlert = async (id: string, nextActive: boolean) => {
    const path = `customAlerts/${id}`;
    try {
      await updateDoc(doc(db, 'customAlerts', id), {
        active: nextActive,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteCustomAlert = async (id: string) => {
    const path = `customAlerts/${id}`;
    try {
      await deleteDoc(doc(db, 'customAlerts', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return {
    rules,
    evaluations,
    triggeredDashboardAlerts,
    loading,
    addCustomAlert,
    toggleCustomAlert,
    deleteCustomAlert,
  };
}

export default useCustomAlerts;
