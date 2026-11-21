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
import { db } from '../config/firebase';
import type {
  SupportPriority,
  SupportStatus,
  SupportTicket,
  SupportTopic,
} from '../types';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';

export interface CreateSupportTicketInput {
  subject: string;
  topic: SupportTopic;
  priority: SupportPriority;
  message: string;
}

interface TicketsState {
  scopeKey: string;
  items: SupportTicket[];
  loaded: boolean;
}

function useSupportTickets(userId: string | undefined, isPro: boolean) {
  const scopeKey = userId && isPro ? userId : '';
  const [state, setState] = useState<TicketsState>({
    scopeKey: '',
    items: [],
    loaded: false,
  });

  useEffect(() => {
    if (!scopeKey) return;

    const path = 'supportTickets';
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
              subject: d.subject as string,
              topic: d.topic as SupportTopic,
              priority: d.priority as SupportPriority,
              message: d.message as string,
              status: d.status as SupportStatus,
              createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
              updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : new Date(),
            } satisfies SupportTicket;
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

  const tickets = useMemo(
    () => (scopeKey && state.scopeKey === scopeKey ? state.items : []),
    [scopeKey, state]
  );
  const loading = Boolean(scopeKey) && (!state.loaded || state.scopeKey !== scopeKey);

  const createTicket = async (input: CreateSupportTicketInput) => {
    if (!userId) throw new Error('Usuário não autenticado.');
    if (!isPro) throw new Error('Suporte prioritário exclusivo para assinantes PRO.');

    const safeSubject = input.subject.trim().slice(0, 120);
    const safeMessage = input.message.trim().slice(0, 1500);

    if (!safeSubject) throw new Error('Informe o assunto do chamado.');
    if (safeMessage.length < 10) {
      throw new Error('Descreva sua solicitação com pelo menos 10 caracteres.');
    }

    const path = 'supportTickets';
    try {
      await addDoc(collection(db, path), {
        userId,
        subject: safeSubject,
        topic: input.topic,
        priority: input.priority,
        message: safeMessage,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const resolveTicket = async (id: string) => {
    const path = `supportTickets/${id}`;
    try {
      await updateDoc(doc(db, 'supportTickets', id), {
        status: 'resolved',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteTicket = async (id: string) => {
    const path = `supportTickets/${id}`;
    try {
      await deleteDoc(doc(db, 'supportTickets', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return {
    tickets,
    loading,
    createTicket,
    resolveTicket,
    deleteTicket,
  };
}

export default useSupportTickets;
