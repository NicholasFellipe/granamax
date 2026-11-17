// 👑 MODAL DE UPGRADE PARA PRO

import { X, Crown, Check } from 'lucide-react';

interface UpgradeModalProps {
  onClose: () => void;
}

const proFeatures = [
  'Simulador de investimentos avançado',
  'Controle completo de carteira',
  'Análises detalhadas por categoria',
  'Previsões inteligentes de gastos',
  'Gráficos de evolução patrimonial',
  'Alertas personalizados ilimitados',
  'Suporte prioritário',
  'Sem anúncios',
];

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="upgrade-header">
            <div className="upgrade-icon">
              <Crown size={32} />
            </div>
            <div>
              <h3 className="modal-title">GranaMax PRO</h3>
              <p className="modal-subtitle">Em breve disponível!</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="pro-features-list">
            <h4 className="pro-features-title">O que você vai ganhar com PRO:</h4>
            <div className="pro-features-grid">
              {proFeatures.map((feature, index) => (
                <div key={index} className="pro-feature-item">
                  <div className="pro-feature-check">
                    <Check size={16} />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              A partir de R$ 9,90/mês
            </p>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>
              Lançamento em breve. Continue usando a versão gratuita!
            </p>
            <button
              onClick={onClose}
              style={{
                background: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '12px 32px',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Entendido!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
