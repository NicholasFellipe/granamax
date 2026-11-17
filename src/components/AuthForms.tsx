// 🔐 FORMULÁRIOS DE AUTENTICAÇÃO

import { useState, FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff, Calendar } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface AuthFormsProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, birthDate?: string) => Promise<void>;
}

export function AuthForms({ onSignIn, onSignUp }: AuthFormsProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    } catch (err: any) {
      setError(err.message || 'Erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
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
