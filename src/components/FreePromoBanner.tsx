// 📢 BANNER PROMOCIONAL EXIBIDO APENAS NO PLANO GRÁTIS (REMOVIDO NO PRO)

import { Crown, Sparkles, ArrowRight } from 'lucide-react';
import { FREE_EXPENSE_LIMIT, FREE_INCOME_LIMIT } from '../constants/planLimits';

interface FreePromoBannerProps {
  onUpgrade: () => void;
  expenseCount?: number;
  incomeCount?: number;
}

export function FreePromoBanner({
  onUpgrade,
  expenseCount,
  incomeCount,
}: FreePromoBannerProps) {
  const showQuota = expenseCount !== undefined && incomeCount !== undefined;
  const expPct = showQuota
    ? Math.min(100, Math.round((expenseCount / FREE_EXPENSE_LIMIT) * 100))
    : 0;
  const incPct = showQuota
    ? Math.min(100, Math.round((incomeCount / FREE_INCOME_LIMIT) * 100))
    : 0;

  return (
    <aside className="free-promo-banner" aria-label="Oferta GranaMax PRO">
      <div className="free-promo-left">
        <div className="free-promo-icon">
          <Sparkles size={18} />
        </div>
        <div className="free-promo-copy">
          <div className="free-promo-eyebrow">
            <span>Anúncio · Plano Grátis</span>
          </div>
          <p className="free-promo-text">
            <strong>Libere o GranaMax completo sem anúncios:</strong> despesas e receitas ilimitadas, lançamento por voz com IA, previsões, carteira de investimentos e suporte prioritário no PRO.
          </p>
          {showQuota && (
            <div className="free-quota-strip" aria-label="Uso do plano Grátis">
              <div className="free-quota-item">
                <div
                  className={`free-quota-meta ${
                    expenseCount >= FREE_EXPENSE_LIMIT ? 'free-quota-meta-full' : ''
                  }`}
                >
                  <span>Despesas</span>
                  <span>
                    {expenseCount}/{FREE_EXPENSE_LIMIT}
                  </span>
                </div>
                <div className="free-quota-track">
                  <div
                    className={`free-quota-fill ${
                      expenseCount >= FREE_EXPENSE_LIMIT
                        ? 'free-quota-fill-full'
                        : expPct >= 80
                          ? 'free-quota-fill-warn'
                          : ''
                    }`}
                    style={{ width: `${expPct}%` }}
                  />
                </div>
              </div>

              <div className="free-quota-item">
                <div
                  className={`free-quota-meta ${
                    incomeCount >= FREE_INCOME_LIMIT ? 'free-quota-meta-full' : ''
                  }`}
                >
                  <span>Receitas</span>
                  <span>
                    {incomeCount}/{FREE_INCOME_LIMIT}
                  </span>
                </div>
                <div className="free-quota-track">
                  <div
                    className={`free-quota-fill ${
                      incomeCount >= FREE_INCOME_LIMIT
                        ? 'free-quota-fill-full'
                        : incPct >= 80
                          ? 'free-quota-fill-warn'
                          : ''
                    }`}
                    style={{ width: `${incPct}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <button type="button" className="free-promo-cta" onClick={onUpgrade}>
        <Crown size={15} />
        <span>Conhecer PRO</span>
        <ArrowRight size={15} />
      </button>
    </aside>
  );
}
