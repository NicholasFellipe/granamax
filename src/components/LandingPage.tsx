// 🚀 LANDING PAGE - TELA DE VENDAS

import { useState } from 'react';
import { TrendingUp, Target, Shield, Zap, Lock, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [showProModal, setShowProModal] = useState(false);

  return (
    <div className="landing-page">
      {/* 🎯 HERO SECTION - IMPACTO IMEDIATO */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Pare de viver <span className="text-danger">sem dinheiro</span> no fim do mês
            </h1>
            <p className="hero-subtitle">
              Descubra para onde seu dinheiro está indo e comece a investir todo mês — mesmo ganhando pouco
            </p>
            <button onClick={onGetStarted} className="btn-primary btn-large">
              Começar Agora (Grátis)
            </button>
            <p className="hero-note">✓ Sem cartão de crédito • Cancele quando quiser</p>
          </div>
        </div>
      </section>

      {/* 💥 SEÇÃO DE DOR - IDENTIFICAÇÃO */}
      <section className="pain-section">
        <div className="container">
          <h2 className="section-title">Você está vivendo isso?</h2>
          <div className="pain-grid">
            <div className="pain-card">
              <div className="pain-icon">😰</div>
              <p>Você <strong>não sabe</strong> pra onde seu dinheiro vai</p>
            </div>
            <div className="pain-card">
              <div className="pain-icon">😞</div>
              <p>Sempre falta <strong>antes do mês acabar</strong></p>
            </div>
            <div className="pain-card">
              <div className="pain-icon">😣</div>
              <p>Quer investir, mas <strong>nunca sobra</strong></p>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 SOLUÇÃO */}
      <section className="solution-section">
        <div className="container">
          <div className="solution-badge">A SOLUÇÃO</div>
          <h2 className="section-title">
            O GranaMax te mostra <span className="text-primary">exatamente</span>:
          </h2>
          <div className="solution-grid">
            <div className="solution-card">
              <div className="solution-icon">
                <TrendingUp size={32} />
              </div>
              <h3>Onde você está perdendo dinheiro</h3>
              <p>Visualize todos os seus gastos de forma clara e automática</p>
            </div>
            <div className="solution-card">
              <div className="solution-icon">
                <Target size={32} />
              </div>
              <h3>Quanto pode economizar</h3>
              <p>Defina metas realistas e acompanhe seu progresso</p>
            </div>
            <div className="solution-card">
              <div className="solution-icon">
                <Zap size={32} />
              </div>
              <h3>Quanto precisa investir</h3>
              <p>Simule investimentos e veja seu dinheiro crescer</p>
            </div>
          </div>
        </div>
      </section>

      {/* 📊 BENEFÍCIOS */}
      <section className="benefits-section">
        <div className="container">
          <h2 className="section-title">O que você consegue fazer</h2>
          <div className="benefits-list">
            <div className="benefit-item">
              <CheckCircle2 className="benefit-check" size={24} />
              <div>
                <h4>Corte gastos invisíveis</h4>
                <p>Aqueles pequenos gastos que somam centenas todo mês</p>
              </div>
            </div>
            <div className="benefit-item">
              <CheckCircle2 className="benefit-check" size={24} />
              <div>
                <h4>Comece a investir com pouco</h4>
                <p>Não precisa de milhares. Comece com o que você tem</p>
              </div>
            </div>
            <div className="benefit-item">
              <CheckCircle2 className="benefit-check" size={24} />
              <div>
                <h4>Tenha dinheiro sobrando todo mês</h4>
                <p>Pare de viver apertado. Tenha controle total</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔒 PRO SECTION - GATILHO DE VALOR */}
      <section className="pro-section">
        <div className="container">
          <div className="pro-card">
            <div className="pro-badge">
              <Lock size={16} />
              <span>GRANAMAX PRO</span>
            </div>
            <h2 className="pro-title">Desbloqueie o controle completo</h2>
            <p className="pro-description">
              Acesse recursos avançados que vão <strong>multiplicar seu dinheiro</strong>
            </p>
            
            <div className="pro-features">
              <div className="pro-feature">
                <Shield className="pro-feature-icon" size={20} />
                <span>Simulador de investimentos</span>
              </div>
              <div className="pro-feature">
                <Zap className="pro-feature-icon" size={20} />
                <span>Alertas inteligentes</span>
              </div>
              <div className="pro-feature">
                <TrendingUp className="pro-feature-icon" size={20} />
                <span>Controle de evolução patrimonial</span>
              </div>
            </div>

            <div className="pro-pricing">
              <div className="pro-price">
                <span className="price-currency">R$</span>
                <span className="price-value">9</span>
                <span className="price-period">,90/mês</span>
              </div>
              <p className="price-note">Menos de R$ 0,33 por dia</p>
            </div>

            <button onClick={() => setShowProModal(true)} className="btn-pro">
              Desbloquear PRO
            </button>
          </div>
        </div>
      </section>

      {/* 🟢 CTA FINAL */}
      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">Comece agora. É grátis.</h2>
          <p className="cta-subtitle">
            Junte-se a milhares de pessoas que já tomaram controle do seu dinheiro
          </p>
          <button onClick={onGetStarted} className="btn-primary btn-large">
            Criar Conta Grátis
          </button>
          <p className="cta-note">✓ Sem compromisso • ✓ Cancele quando quiser</p>
        </div>
      </section>

      {/* 📱 FOOTER */}
      <footer className="landing-footer">
        <div className="container">
          <p className="footer-text">
            © 2026 GranaMax • O app que faz você sobrar dinheiro e investir todo mês
          </p>
        </div>
      </footer>

      {/* Modal PRO (placeholder) */}
      {showProModal && (
        <div className="modal-overlay" onClick={() => setShowProModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Assinar GranaMax PRO</h3>
            <p>A integração com Google Play será ativada em breve!</p>
            <button onClick={() => setShowProModal(false)} className="btn-secondary">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
