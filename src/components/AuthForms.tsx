// 🔐 FORMULÁRIOS DE AUTENTICAÇÃO

import { useState, type FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff, Calendar } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface AuthFormsProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, birthDate?: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
}

export function AuthForms({ onSignIn, onSignUp, onGoogleSignIn }: AuthFormsProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await onGoogleSignIn();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao entrar com Google.';
      setError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp && password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await onSignUp(email, password, birthDate || undefined);
      } else {
        await onSignIn(email, password);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao processar. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const isBusy = loading || googleLoading;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">{isSignUp ? 'Criar conta' : 'Entrar'}</h2>
          <p className="auth-subtitle">
            {isSignUp
              ? 'Comece a controlar suas finanças gratuitamente'
              : 'Bem-vindo de volta ao GranaMax'}
          </p>
        </div>

        <button
          type="button"
          className="btn-google"
          onClick={handleGoogleLogin}
          disabled={isBusy}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
            />
          </svg>
          <span>{googleLoading ? 'Conectando...' : 'Continuar com Google'}</span>
        </button>

        <div className="auth-divider">
          <span>ou</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            type="email"
            label="Email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={20} />}
            required
          />

          <div className="password-input-group">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Senha"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={20} />}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {isSignUp && (
            <>
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Confirmar senha"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock size={20} />}
                required
              />
              <Input
                type="date"
                label="Data de nascimento (opcional)"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                icon={<Calendar size={20} />}
              />
            </>
          )}

          {error && <div className="auth-error">{error}</div>}

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={isBusy}>
            {loading ? 'Processando...' : isSignUp ? 'Criar conta' : 'Entrar'}
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
            <button
              type="button"
              className="auth-switch"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setBirthDate(''); }}
            >
              {isSignUp ? 'Entrar' : 'Criar conta grátis'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
