// 📢 BANNER PROMOCIONAL EXIBIDO APENAS NO PLANO GRÁTIS (REMOVIDO NO PRO)

import { Crown, Sparkles, ArrowRight } from 'lucide-react';

interface FreePromoBannerProps {
  onUpgrade: () => void;
}

export function FreePromoBanner({ onUpgrade }: FreePromoBannerProps) {
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
            <strong>Remova anúncios e acelere seu patrimônio:</strong> libere previsões com IA, carteira completa, simulador avançado e suporte prioritário no GranaMax PRO.
          </p>
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
