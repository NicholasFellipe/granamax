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
import type { Investment, InvestmentType } from '../types';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';

export interface AddInvestmentInput {
  name: string;
  amount: number;
  currentValue?: number;
  type: InvestmentType;
  institution?: string;
  notes?: string;
}

export interface UpdateInvestmentInput {
  name: string;
  amount: number;
  currentValue: number;
  type: InvestmentType;
  institution?: string;
  notes?: string;
}

interface InvestmentsState {
  scopeKey: string;
  items: Investment[];
  loaded: boolean;
}

function useInvestments(userId: string | undefined, isPro: boolean) {
  const scopeKey = userId && isPro ? userId : '';
  const [state, setState] = useState<InvestmentsState>({
    scopeKey: '',
    items: [],
    loaded: false,
  });

  useEffect(() => {
    if (!scopeKey) {
      return;
    }

    const path = 'investments';
    const q = query(collection(db, path), where('userId', '==', scopeKey));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((docSnap) => {
            const inv = docSnap.data();
            return {
              id: docSnap.id,
              userId: inv.userId as string,
              name: inv.name as string,
              amount: Number(inv.amount),
              currentValue: Number(inv.currentValue),
              type: inv.type as InvestmentType,
              institution: typeof inv.institution === 'string' ? inv.institution : '',
              notes: typeof inv.notes === 'string' ? inv.notes : '',
              boughtAt: inv.boughtAt?.toDate ? inv.boughtAt.toDate() : new Date(),
              updatedAt: inv.updatedAt?.toDate ? inv.updatedAt.toDate() : new Date(),
            } satisfies Investment;
          })
          .sort((a, b) => b.currentValue - a.currentValue);

        setState({ scopeKey, items: data, loaded: true });
      },
      (err) => {
        setState({ scopeKey, items: [], loaded: true });
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [scopeKey]);

  const investments = scopeKey && state.scopeKey === scopeKey ? state.items : [];
  const loading = Boolean(scopeKey) && (!state.loaded || state.scopeKey !== scopeKey);

  const addInvestment = async (input: AddInvestmentInput) => {
    if (!userId) throw new Error('Usuário não autenticado.');
    if (!isPro) throw new Error('Recurso exclusivo do GranaMax PRO.');

    const safeName = input.name.trim().slice(0, 100);
    if (!safeName) throw new Error('Informe o nome ou ticker do ativo.');
    if (!(input.amount > 0 && input.amount <= 1000000000)) {
      throw new Error('Informe um valor investido válido.');
    }

    const safeCurrentValue =
      input.currentValue !== undefined ? input.currentValue : input.amount;
    if (!(safeCurrentValue >= 0 && safeCurrentValue <= 1000000000)) {
      throw new Error('Informe um valor atual válido.');
    }

    const safeInstitution = (input.institution || '').trim().slice(0, 80);
    const safeNotes = (input.notes || '').trim().slice(0, 240);

    const path = 'investments';
    try {
      await addDoc(collection(db, path), {
        userId,
        name: safeName,
        amount: input.amount,
        currentValue: safeCurrentValue,
        type: input.type,
        institution: safeInstitution,
        notes: safeNotes,
        boughtAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateInvestmentValue = async (id: string, newValue: number) => {
    if (!(newValue >= 0 && newValue <= 1000000000)) {
      throw new Error('Valor inválido.');
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

  const updateInvestment = async (id: string, input: UpdateInvestmentInput) => {
    const safeName = input.name.trim().slice(0, 100);
    if (!safeName) throw new Error('Informe o nome do ativo.');
    if (!(input.amount > 0 && input.amount <= 1000000000)) {
      throw new Error('Valor investido inválido.');
    }
    if (!(input.currentValue >= 0 && input.currentValue <= 1000000000)) {
      throw new Error('Valor atual inválido.');
    }

    const path = `investments/${id}`;
    try {
      await updateDoc(doc(db, 'investments', id), {
        name: safeName,
        amount: input.amount,
        currentValue: input.currentValue,
        type: input.type,
        institution: (input.institution || '').trim().slice(0, 80),
        notes: (input.notes || '').trim().slice(0, 240),
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
    updateInvestment,
    deleteInvestment,
    totalInvested,
    totalValue,
    totalProfit,
    profitPercentage,
  };
}

export default useInvestments;
