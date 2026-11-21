import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';
import type { User } from '../types';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';

function formatAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Login com Google cancelado.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou o pop-up do Google. Permita pop-ups e tente novamente.';
    case 'auth/cancelled-popup-request':
      return 'Outra tentativa de login está em andamento.';
    case 'auth/account-exists-with-different-credential':
      return 'Já existe uma conta cadastrada com este e-mail usando outro método de login.';
    case 'auth/operation-not-allowed':
      return 'Login por e-mail e senha não está ativado no Firebase Console. Use "Continuar com Google" ou ative o provedor no console.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    default:
      return err instanceof Error ? err.message : 'Erro ao autenticar. Tente novamente.';
  }
}

async function ensureUserProfile(
  firebaseUser: FirebaseUser,
  birthDate?: string
): Promise<User> {
  const userPath = `users/${firebaseUser.uid}`;
  const userRef = doc(db, 'users', firebaseUser.uid);

  const rawDisplayName =
    firebaseUser.displayName ||
    firebaseUser.providerData?.find((p) => p.displayName)?.displayName ||
    '';
  const rawPhotoURL =
    firebaseUser.photoURL ||
    firebaseUser.providerData?.find((p) => p.photoURL)?.photoURL ||
    '';

  const safeEmail = (firebaseUser.email || '').slice(0, 254);
  const safeDisplayName = rawDisplayName.trim().slice(0, 120);
  const safePhotoURL = rawPhotoURL.trim().slice(0, 512);
  const safeBirthDate = birthDate ? birthDate.slice(0, 20) : null;

  let userDoc;
  try {
    userDoc = await getDoc(userRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, userPath);
  }

  if (userDoc.exists()) {
    const data = userDoc.data();
    const storedName = typeof data.displayName === 'string' ? data.displayName : '';
    const storedPhoto = typeof data.photoURL === 'string' ? data.photoURL : '';
    const nextDisplayName = safeDisplayName || storedName;
    const nextPhotoURL = safePhotoURL || storedPhoto;

    if (
      firebaseUser.emailVerified &&
      ((safeDisplayName && safeDisplayName !== storedName) ||
        (safePhotoURL && safePhotoURL !== storedPhoto))
    ) {
      try {
        await updateDoc(userRef, {
          displayName: nextDisplayName,
          photoURL: nextPhotoURL,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, userPath);
      }
    }

    const rawProPlan = data.proPlan;
    const proPlan: User['proPlan'] =
      rawProPlan === 'monthly' || rawProPlan === 'yearly' || rawProPlan === 'free'
        ? rawProPlan
        : data.isPro
          ? 'monthly'
          : 'free';

    return {
      uid: firebaseUser.uid,
      email: (data.email as string) || safeEmail,
      displayName: nextDisplayName || undefined,
      photoURL: nextPhotoURL || undefined,
      isPro: Boolean(data.isPro),
      proPlan,
      proActivatedAt: data.proActivatedAt?.toDate ? data.proActivatedAt.toDate() : null,
      birthDate: (data.birthDate as string | null) ?? null,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    };
  }

  if (firebaseUser.emailVerified) {
    try {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: safeEmail,
        displayName: safeDisplayName,
        photoURL: safePhotoURL,
        birthDate: safeBirthDate,
        isPro: false,
        proPlan: 'free',
        proActivatedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, userPath);
    }
  }

  return {
    uid: firebaseUser.uid,
    email: safeEmail,
    displayName: safeDisplayName || undefined,
    photoURL: safePhotoURL || undefined,
    isPro: false,
    proPlan: 'free',
    proActivatedAt: null,
    birthDate: safeBirthDate,
    createdAt: new Date(),
  };
}

function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await ensureUserProfile(firebaseUser);
          setUser(profile);
        } catch (err) {
          console.error('Erro ao carregar perfil do usuário:', err);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || undefined,
            photoURL: firebaseUser.photoURL || undefined,
            isPro: false,
            proPlan: 'free',
            proActivatedAt: null,
            createdAt: new Date(),
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const { user: firebaseUser } = await signInWithPopup(auth, googleProvider);
      const profile = await ensureUserProfile(firebaseUser);
      setUser(profile);
    } catch (err) {
      const message = formatAuthError(err);
      setError(message);
      throw new Error(message);
    }
  };

  const signUp = async (email: string, password: string, birthDate?: string) => {
    setError(null);
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      const profile = await ensureUserProfile(firebaseUser, birthDate);
      setUser(profile);
    } catch (err) {
      const message = formatAuthError(err);
      setError(message);
      throw new Error(message);
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      const profile = await ensureUserProfile(firebaseUser);
      setUser(profile);
    } catch (err) {
      const message = formatAuthError(err);
      setError(message);
      throw new Error(message);
    }
  };

  const activateProPlan = async (plan: 'monthly' | 'yearly') => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !user) {
      throw new Error('Usuário não autenticado.');
    }
    const userPath = `users/${firebaseUser.uid}`;
    const userRef = doc(db, 'users', firebaseUser.uid);

    if (firebaseUser.emailVerified) {
      try {
        await updateDoc(userRef, {
          isPro: true,
          proPlan: plan,
          proActivatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, userPath);
      }
    }

    setUser((prev) =>
      prev
        ? {
            ...prev,
            isPro: true,
            proPlan: plan,
            proActivatedAt: new Date(),
          }
        : prev
    );
  };

  const downgradeToFree = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !user) {
      throw new Error('Usuário não autenticado.');
    }
    const userPath = `users/${firebaseUser.uid}`;
    const userRef = doc(db, 'users', firebaseUser.uid);

    if (firebaseUser.emailVerified) {
      try {
        await updateDoc(userRef, {
          isPro: false,
          proPlan: 'free',
          proActivatedAt: null,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, userPath);
      }
    }

    setUser((prev) =>
      prev
        ? {
            ...prev,
            isPro: false,
            proPlan: 'free',
            proActivatedAt: null,
          }
        : prev
    );
  };

  const signOut = async () => {
    setError(null);
    await firebaseSignOut(auth);
    setUser(null);
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signUp,
    signIn,
    signOut,
    activateProPlan,
    downgradeToFree,
  };
}

export default useAuth;
