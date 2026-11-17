// 🧮 SIMULADOR DE INVESTIMENTOS

import { useState, FormEvent } from 'react';
import { X, Calculator, TrendingUp } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface InvestmentSimulatorProps {
  onClose: () => void;
}

export function InvestmentSimulator({ onClose }: InvestmentSimulatorProps) {
  const [initialAmount, setInitialAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [years, setYears] = useState('');
  const [result, setResult] = useState<{
    totalInvested: number;
    totalInterest: number;
    finalAmount: number;
  } | null>(null);

  const handleSimulate = (e: FormEvent) => {
    e.preventDefault();

    const initial = parseFloat(initialAmount.replace(',', '.')) || 0;
    const monthly = parseFloat(monthlyContribution.replace(',', '.')) || 0;
    const rate = parseFloat(annualRate.replace(',', '.')) || 0;
    const period = parseFloat(years) || 0;

    if (rate <= 0 || period <= 0) {
      alert('Digite valores válidos');
      return;
    }

    // Cálculo de juros compostos com aportes mensais
    const monthlyRate = rate / 100 / 12;
    const months = period * 12;

    // Valor futuro do aporte inicial
    const futureInitial = initial * Math.pow(1 + monthlyRate, months);

    // Valor futuro dos aportes mensais (série de pagamentos)
    const futureMonthly = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

    const finalAmount = futureInitial + futureMonthly;
    const totalInvested = initial + (monthly * months);
    const totalInterest = finalAmount - totalInvested;

    setResult({
      totalInvested,
      totalInterest,
      finalAmount,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Simulador de Investimentos</h3>
            <p className="modal-subtitle">Calcule quanto seu dinheiro pode render</p>
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSimulate}>
          <div className="modal-body">
            <div className="simulator-grid">
              <Input
                label="Valor Inicial (R$)"
                placeholder="0,00"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                helperText="Quanto você tem para investir agora"
              />

              <Input
                label="Aporte Mensal (R$)"
                placeholder="0,00"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                helperText="Quanto você vai investir por mês"
              />

              <Input
                label="Taxa de Retorno Anual (%)"
                placeholder="10,00"
                value={annualRate}
                onChange={(e) => setAnnualRate(e.target.value)}
                helperText="Rendimento esperado por ano"
              />

              <Input
                label="Período (anos)"
                placeholder="5"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                helperText="Por quanto tempo vai investir"
              />
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              fullWidth 
              icon={<Calculator size={20} />}
            >
              Simular
            </Button>

            {result && (
              <Card className="simulator-result">
                <div className="simulator-result-header">
                  <TrendingUp size={32} className="text-primary" />
                  <h4>Resultado da Simulação</h4>
                </div>

                <div className="simulator-result-grid">
                  <div className="simulator-result-item">
                    <span className="simulator-result-label">Total Investido</span>
                    <span className="simulator-result-value">
                      R$ {result.totalInvested.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="simulator-result-item">
                    <span className="simulator-result-label">Rendimento</span>
                    <span className="simulator-result-value text-primary">
                      + R$ {result.totalInterest.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="simulator-result-item simulator-result-highlight">
                    <span className="simulator-result-label">Valor Final</span>
                    <span className="simulator-result-value-large text-primary">
                      R$ {result.finalAmount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div className="simulator-tip">
                  <strong>💡 Poder dos Juros Compostos:</strong>
                  <p>
                    Seu dinheiro rendeu <strong className="text-primary">
                      R$ {result.totalInterest.toFixed(2).replace('.', ',')}
                    </strong> trabalhando para você! 
                    Quanto mais tempo investir, maior será o crescimento exponencial.
                  </p>
                </div>
              </Card>
            )}

            <div className="simulator-examples">
              <h4>Exemplos de Taxas Médias:</h4>
              <div className="simulator-examples-grid">
                <div className="simulator-example">
                  <strong>Poupança:</strong> 6-7% ao ano
                </div>
                <div className="simulator-example">
                  <strong>Tesouro Selic:</strong> 10-13% ao ano
                </div>
                <div className="simulator-example">
                  <strong>Fundos DI:</strong> 9-12% ao ano
                </div>
                <div className="simulator-example">
                  <strong>Ações:</strong> 10-15% ao ano (variável)
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
