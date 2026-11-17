import { useState, useEffect } from 'react';
import type { User } from '../types';

const API = 'http://localhost:3001';
const TOKEN_KEY = 'granamax_token';

function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.uid) setUser({ ...data, createdAt: new Date(data.createdAt) });
        else localStorage.removeItem(TOKEN_KEY);
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const signUp = async (email: string, password: string, birthDate?: string) => {
    setError(null);
    const res = await fetch(`${API}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, birthDate }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao criar conta');
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser({ ...data.user, createdAt: new Date(data.user.createdAt) });
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    const res = await fetch(`${API}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Email ou senha incorretos');
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser({ ...data.user, createdAt: new Date(data.user.createdAt) });
  };

  const signOut = async () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return { user, loading, error, signUp, signIn, signOut };
}

export default useAuth;
