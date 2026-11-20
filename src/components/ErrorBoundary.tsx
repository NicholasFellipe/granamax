import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Ocorreu um erro inesperado.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: '#F9FAFB',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
              textAlign: 'center',
            }}
          >
            <h2 style={{ fontFamily: 'Poppins, sans-serif', marginBottom: '0.75rem', color: '#111827' }}>
              Algo deu errado
            </h2>
            <p style={{ color: '#6B7280', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Não foi possível concluir a operação. Tente recarregar a página.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: '#22C55E',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
