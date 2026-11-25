// 👑 MODAL DE ASSINATURA E GERENCIAMENTO GRANAMAX PRO

import { useState } from 'react';
import {
  X,
  Crown,
  Check,
  Minus,
  ShieldCheck,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Button } from './ui/Button';
import type { User } from '../types';

interface UpgradeModalProps {
  user: User;
  onClose: () => void;
  onActivatePro: (plan: 'monthly' | 'yearly') => Promise<void>;
  onDowngradeToFree: () => Promise<void>;
}

const COMPARISON_ROWS: Array<{
  feature: string;
  free: string | boolean;
  pro: string | boolean;
}> = [
  { feature: 'Registro de despesas e receitas', free: '50 despesas / 10 receitas', pro: 'Ilimitados' },
  { feature: 'Orçamento diário, mensal e recorrências', free: true, pro: true },
  { feature: 'Lançamento por voz com IA', free: false, pro: true },
  { feature: 'Simulador de investimentos avançado (IPCA + IR + cenários)', free: false, pro: true },
  { feature: 'Controle completo de carteira (6 classes de ativos)', free: false, pro: true },
  { feature: 'Análises detalhadas por categoria (comparativo mensal)', free: false, pro: true },
  { feature: 'Previsões inteligentes de gastos com IA', free: false, pro: true },
  { feature: 'Gráficos de evolução patrimonial e marcos mensais', free: false, pro: true },
  { feature: 'Alertas personalizados', free: 'Até 2 regras', pro: 'Ilimitados' },
  { feature: 'Suporte prioritário no app', free: false, pro: true },
  { feature: 'Experiência sem anúncios', free: false, pro: true },
];

export function UpgradeModal({
  user,
  onClose,
  onActivatePro,
  onDowngradeToFree,
}: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>(
    user.proPlan === 'monthly' ? 'monthly' : 'yearly'
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onActivatePro(selectedPlan);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar a assinatura.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDowngrade = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onDowngradeToFree();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível retornar ao plano Grátis.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-large upgrade-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="upgrade-header">
            <div className="upgrade-icon">
              <Crown size={28} />
            </div>
            <div>
              <h3 id="upgrade-modal-title" className="modal-title">
                {user.isPro ? 'Gerenciar GranaMax PRO' : 'Desbloqueie o GranaMax PRO'}
              </h3>
              <p className="modal-subtitle">
                {user.isPro
                  ? `Plano ativo: ${user.proPlan === 'yearly' ? 'Anual (R$ 89,90/ano)' : 'Mensal (R$ 9,90/mês)'}`
                  : 'Inteligência patrimonial, previsões com IA e controle total sem anúncios'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close"
            aria-label="Fechar modal"
          >
            <X size={22} />
          </button>
        </div>

        <div className="modal-body upgrade-modal-body">
          {error && (
            <div className="pro-inline-error" role="alert">
              {error}
            </div>
          )}

          {/* Seletor de planos */}
          <div className="plan-selector-grid">
            <button
              type="button"
              className={`plan-option-card ${selectedPlan === 'monthly' ? 'plan-option-selected' : ''}`}
              onClick={() => setSelectedPlan('monthly')}
            >
              <div className="plan-option-top">
                <span className="plan-option-name">Plano Mensal</span>
                {user.isPro && user.proPlan === 'monthly' && (
                  <span className="plan-current-tag">Atual</span>
                )}
              </div>
              <div className="plan-option-price">
                <strong>R$ 9,90</strong>
                <span>/mês</span>
              </div>
              <p className="plan-option-desc">Flexibilidade total, cancele quando quiser.</p>
            </button>

            <button
              type="button"
              className={`plan-option-card plan-option-recommended ${selectedPlan === 'yearly' ? 'plan-option-selected' : ''}`}
              onClick={() => setSelectedPlan('yearly')}
            >
              <div className="plan-option-top">
                <span className="plan-option-name">Plano Anual</span>
                <span className="plan-discount-tag">Economize 24%</span>
              </div>
              <div className="plan-option-price">
                <strong>R$ 89,90</strong>
                <span>/ano</span>
              </div>
              <p className="plan-option-desc">
                Equivalente a R$ 7,49/mês com acesso completo a todas as ferramentas PRO.
              </p>
            </button>
          </div>

          {/* Matriz comparativa Grátis vs PRO */}
          <div className="plan-comparison-section">
            <h4 className="pro-features-title">Comparativo Grátis vs. PRO</h4>
            <div className="plan-comparison-table-wrap">
              <table className="plan-comparison-table">
                <thead>
                  <tr>
                    <th>Recurso</th>
                    <th className="col-center">Grátis</th>
                    <th className="col-center col-pro-head">PRO</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.feature}>
                      <td>{row.feature}</td>
                      <td className="col-center">
                        {typeof row.free === 'string' ? (
                          <span className="plan-cell-text">{row.free}</span>
                        ) : row.free ? (
                          <Check size={16} className="plan-icon-ok" aria-label="Incluído" />
                        ) : (
                          <Minus size={16} className="plan-icon-no" aria-label="Não incluído" />
                        )}
                      </td>
                      <td className="col-center col-pro-cell">
                        {typeof row.pro === 'string' ? (
                          <span className="plan-cell-pro-text">{row.pro}</span>
                        ) : (
                          <Check size={16} className="plan-icon-pro" aria-label="Incluído no PRO" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ações */}
          <div className="upgrade-cta-box">
            <div className="upgrade-cta-info">
              <ShieldCheck size={18} className="upgrade-shield-icon" />
              <span>
                Modo de ativação imediata: seu status PRO é salvo no seu perfil para você testar todos os recursos agora.
              </span>
            </div>

            <div className="upgrade-cta-actions">
              {user.isPro && (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={handleDowngrade}
                  disabled={submitting}
                  icon={<RotateCcw size={16} />}
                >
                  Voltar ao plano Grátis
                </Button>
              )}

              <Button
                type="button"
                variant="pro"
                size="lg"
                onClick={handleActivate}
                loading={submitting}
                disabled={submitting || (user.isPro && user.proPlan === selectedPlan)}
                icon={<Sparkles size={18} />}
              >
                {user.isPro
                  ? user.proPlan === selectedPlan
                    ? 'Plano atual ativo'
                    : selectedPlan === 'yearly'
                      ? 'Mudar para Anual (R$ 89,90/ano)'
                      : 'Mudar para Mensal (R$ 9,90/mês)'
                  : selectedPlan === 'yearly'
                    ? 'Ativar PRO Anual — R$ 89,90/ano'
                    : 'Ativar PRO Mensal — R$ 9,90/mês'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
