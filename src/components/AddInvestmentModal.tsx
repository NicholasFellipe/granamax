// ➕ MODAL DE ADICIONAR INVESTIMENTO

import { useState, FormEvent } from 'react';
import { X, DollarSign } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import useInvestments from '../hooks/useInvestments';
import useAuth from '../hooks/useAuth';
import type { Investment } from '../types';

interface AddInvestmentModalProps {
  onClose: () => void;
}

const investmentTypes: Array<{ value: Investment['type']; label: string }> = [
  { value: 'stocks', label: 'Ações' },
  { value: 'crypto', label: 'Criptomoedas' },
  { value: 'funds', label: 'Fundos de Investimento' },
  { value: 'savings', label: 'Poupança/CDB' },
];

export function AddInvestmentModal({ onClose }: AddInvestmentModalProps) {
  const { user } = useAuth();
  const { addInvestment } = useInvestments(user?.uid, user?.isPro || false);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<Investment['type']>('stocks');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!name || !amount) {
      alert('Preencha todos os campos');
      return;
    }

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Digite um valor válido');
      return;
    }

    setLoading(true);
    try {
      await addInvestment(name, numericAmount, type);
      onClose();
    } catch (err) {
      alert('Erro ao adicionar investimento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Novo Investimento</h3>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <Input
              label="Nome do Investimento"
              placeholder="Ex: PETR4, Bitcoin, Tesouro Selic..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Valor Investido"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              icon={<DollarSign size={20} />}
              helperText="Valor total que você investiu"
              required
            />

            <div className="input-group">
              <label className="input-label">Tipo de Investimento</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Investment['type'])}
                className="select-input"
                required
              >
                {investmentTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="investment-tip">
              <strong>💡 Dica:</strong> Você poderá atualizar o valor atual do investimento depois para acompanhar lucros e perdas
            </div>
          </div>

          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
