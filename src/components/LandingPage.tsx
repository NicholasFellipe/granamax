import { useState } from 'react';
import { ArrowRight, Check, ChevronDown, ShieldCheck } from 'lucide-react';
import heroImage from '../assets/images/granamax_hero_friendly_1794877001822.jpg';
import calmPlanningImage from '../assets/images/granamax_calm_planning_1794877000888.jpg';

interface LandingPageProps {
  onGetStarted: () => void;
}

const faqs = [
  {
    question: 'O GranaMax é realmente gratuito para começar?',
    answer:
      'Sim. Você pode registrar suas receitas e despesas, acompanhar gráficos semanais, definir sua meta diária e receber alertas inteligentes sem pagar nada e sem cadastrar cartão de crédito.',
  },
  {
    question: 'Consigo entrar rapidamente com minha conta Google?',
    answer:
      'Sim. Em um clique com sua conta Google você já acessa seu painel financeiro, com seus registros salvos com segurança na nuvem para consultar de qualquer lugar.',
  },
  {
    question: 'Como funciona o GranaMax PRO?',
    answer:
      'O plano PRO reúne recursos avançados para quem quer acompanhar investimentos e análises detalhadas por R$ 9,90 por mês. Enquanto finalizamos a assinatura oficial nas lojas, você já pode usar toda a base gratuita normalmente.',
  },
];

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [showProModal, setShowProModal] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [calmImgFailed, setCalmImgFailed] = useState(false);

  return (
    <div className="landing-page">
      {/* TOP BAR (3-Zone Contract) */}
      <header className="landing-header">
        <div className="container landing-header-inner">
          <a href="#topo" className="landing-wordmark">
            GranaMax
          </a>

          <nav className="landing-nav" aria-label="Navegação principal">
            <a href="#como-funciona" className="landing-nav-link">
              Como funciona
            </a>
            <a href="#recursos" className="landing-nav-link">
              Recursos
            </a>
            <a href="#plano-pro" className="landing-nav-link">
              Plano PRO
            </a>
            <a href="#duvidas" className="landing-nav-link">
              Dúvidas
            </a>
          </nav>

          <div className="landing-header-action">
            <button type="button" onClick={onGetStarted} className="btn-header">
              Entrar
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="topo" className="hero-section">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <p className="hero-kicker">
                Controle financeiro pessoal · Simples e no seu ritmo
              </p>
              <h1 className="hero-title">
                Cuide do seu dinheiro com leveza e faça sobrar todo mês.
              </h1>
              <p className="hero-subtitle">
                Acompanhe seus gastos do dia a dia sem planilhas complicadas, veja
                quanto pode gastar hoje com tranquilidade e comece a construir sua
                reserva.
              </p>
              <div className="hero-actions">
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="btn-primary btn-large"
                >
                  <span>Começar gratuitamente</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
              <p className="hero-note">
                Entre com sua conta Google · Sem cartão de crédito · Acesso imediato
              </p>
            </div>

            <div className="hero-media">
              {!heroImgFailed ? (
                <img
                  src={heroImage}
                  alt="Pessoa sorrindo em uma mesa iluminada organizando suas finanças no notebook com uma xícara de café"
                  className="hero-photo"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                />
              ) : (
                <div className="media-fallback" role="img" aria-label="Planejamento financeiro tranquilo">
                  <ShieldCheck size={36} aria-hidden="true" />
                  <span>Planejamento financeiro leve e organizado</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA (BENTO GRID) */}
      <section id="como-funciona" className="steps-section">
        <div className="container">
          <div className="section-intro">
            <p className="section-kicker">Sem sustos no fim do mês</p>
            <h2 className="section-title">
              Um jeito calmo e claro de organizar sua rotina financeira
            </h2>
          </div>

          <div className="bento-grid">
            <article className="bento-card bento-span-2">
              <span className="bento-number">01.</span>
              <h3>Anote seus gastos em poucos segundos</h3>
              <p>
                Registre o que entrou e o que saiu por categoria — alimentação,
                transporte, moradia ou lazer — direto do navegador, sem termos
                complicados.
              </p>
            </article>

            <article className="bento-card">
              <span className="bento-number">02.</span>
              <h3>Saiba quanto pode gastar hoje</h3>
              <p>
                Calculamos uma meta diária realista com base no seu saldo para você
                atravessar o mês com tranquilidade.
              </p>
            </article>

            <article className="bento-card">
              <span className="bento-number">03.</span>
              <h3>Enxergue para onde vai cada real</h3>
              <p>
                Gráficos simples dos últimos 7 dias e comparação com o mês anterior
                mostram pequenos hábitos que fazem diferença.
              </p>
            </article>

            <article className="bento-card bento-span-2 bento-media-card">
              <div className="bento-media-copy">
                <span className="bento-number">04.</span>
                <h3>Dê os primeiros passos para investir</h3>
                <p>
                  Quando começar a sobrar no fim do mês, simule cenários de
                  rendimento e acompanhe sua evolução sem precisar entender tudo de
                  mercado financeiro.
                </p>
              </div>
              <div className="bento-media-thumb">
                {!calmImgFailed ? (
                  <img
                    src={calmPlanningImage}
                    alt="Caderno de planejamento financeiro, xícara de café e planta verde sobre mesa clara"
                    className="bento-photo"
                    referrerPolicy="no-referrer"
                    onError={() => setCalmImgFailed(true)}
                  />
                ) : (
                  <div className="media-fallback" role="img" aria-label="Organização diária">
                    <span>Rotina organizada</span>
                  </div>
                )}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* RECURSOS + PLANOS */}
      <section id="recursos" className="plans-section">
        <div className="container">
          <div className="section-intro">
            <p className="section-kicker">Comece grátis, evolua quando quiser</p>
            <h2 className="section-title">
              Tudo o que você precisa para retomar o controle hoje
            </h2>
          </div>

          <div id="plano-pro" className="plans-grid">
            <div className="plan-card">
              <div className="plan-header">
                <h3 className="plan-name">Plano Gratuito</h3>
                <p className="plan-desc">
                  Ideal para organizar o orçamento do dia a dia e fazer o salário
                  render até o fim do mês.
                </p>
              </div>

              <div className="plan-price">
                <span className="plan-amount">R$ 0</span>
                <span className="plan-period">/para sempre</span>
              </div>

              <ul className="plan-features">
                <li>
                  <Check size={18} className="plan-check" aria-hidden="true" />
                  <span>Registro ilimitado de receitas e despesas</span>
                </li>
                <li>
                  <Check size={18} className="plan-check" aria-hidden="true" />
                  <span>Meta diária de gastos calculada automaticamente</span>
                </li>
                <li>
                  <Check size={18} className="plan-check" aria-hidden="true" />
                  <span>Resumo por categorias e últimos 7 dias</span>
                </li>
                <li>
                  <Check size={18} className="plan-check" aria-hidden="true" />
                  <span>Alertas gentis de consumo e conquistas</span>
                </li>
              </ul>

              <button
                type="button"
                onClick={onGetStarted}
                className="btn-primary plan-cta"
              >
                Criar conta grátis
              </button>
            </div>

            <div className="plan-card plan-card-featured">
              <div className="plan-header">
                <p className="plan-meta">Opcional · Em breve</p>
                <h3 className="plan-name">GranaMax PRO</h3>
                <p className="plan-desc">
                  Para quem já organizou o mês e quer simular investimentos e
                  acompanhar a evolução do patrimônio.
                </p>
              </div>

              <div className="plan-price">
                <span className="plan-amount">R$ 9,90</span>
                <span className="plan-period">/mês · menos de R$ 0,33/dia</span>
              </div>

              <ul className="plan-features">
                <li>
                  <Check size={18} className="plan-check" aria-hidden="true" />
                  <span>Tudo do plano gratuito incluso</span>
                </li>
                <li>
                  <Check size={18} className="plan-check" aria-hidden="true" />
                  <span>Simulador interativo de investimentos</span>
                </li>
                <li>
                  <Check size={18} className="plan-check" aria-hidden="true" />
                  <span>Controle completo de carteira e lucros</span>
                </li>
                <li>
                  <Check size={18} className="plan-check" aria-hidden="true" />
                  <span>Análises avançadas e projeção mensal</span>
                </li>
              </ul>

              <button
                type="button"
                onClick={() => setShowProModal(true)}
                className="btn-outline plan-cta"
              >
                Saber mais sobre o PRO
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* DÚVIDAS FREQUENTES */}
      <section id="duvidas" className="faq-section">
        <div className="container">
          <div className="faq-layout">
            <div className="faq-intro">
              <p className="section-kicker">Tire suas dúvidas</p>
              <h2 className="faq-title">Perguntas frequentes</h2>
              <p className="faq-subtitle">
                Sem letras miúdas: entenda como o GranaMax funciona antes mesmo de
                fazer seu login.
              </p>
            </div>

            <div className="faq-list">
              {faqs.map((item, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div key={item.question} className="faq-item">
                    <button
                      type="button"
                      className="faq-trigger"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        size={18}
                        className={`faq-chevron ${isOpen ? 'faq-chevron-open' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen && <p className="faq-answer">{item.answer}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <h2 className="cta-title">
              Pronto para ter mais tranquilidade com suas finanças?
            </h2>
            <p className="cta-subtitle">
              Comece hoje em menos de um minuto usando sua conta Google.
            </p>
            <button
              type="button"
              onClick={onGetStarted}
              className="btn-primary btn-large"
            >
              <span>Entrar e começar agora</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="container landing-footer-inner">
          <div className="footer-brand-block">
            <span className="footer-wordmark">GranaMax</span>
            <span className="footer-copy">
              © 2026 GranaMax · Controle financeiro simples e acessível
            </span>
          </div>

          <div className="footer-links">
            <a href="#como-funciona">Como funciona</a>
            <a href="#recursos">Recursos</a>
            <a href="#duvidas">Dúvidas</a>
            <button type="button" onClick={onGetStarted} className="footer-action">
              Entrar
            </button>
          </div>
        </div>
      </footer>

      {showProModal && (
        <div className="modal-overlay" onClick={() => setShowProModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>GranaMax PRO em breve</h3>
            <p>
              Estamos preparando a integração de assinatura. Enquanto isso, você já
              pode criar sua conta gratuita e organizar todas as suas finanças sem
              custo.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => {
                  setShowProModal(false);
                  onGetStarted();
                }}
                className="btn-primary"
              >
                Começar grátis agora
              </button>
              <button
                type="button"
                onClick={() => setShowProModal(false)}
                className="btn-secondary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
