// ➕ MODAL DE ADICIONAR / EDITAR ATIVO DA CARTEIRA (PRO)

import { useState, type FormEvent } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { Investment, InvestmentType } from '../types';
import type { AddInvestmentInput, UpdateInvestmentInput } from '../hooks/useInvestments';

interface AddInvestmentModalProps {
  onClose: () => void;
  onAdd: (input: AddInvestmentInput) => Promise<void>;
  onUpdate?: (id: string, input: UpdateInvestmentInput) => Promise<void>;
  editingInvestment?: Investment | null;
}

export const INVESTMENT_CLASSES: Array<{
  value: InvestmentType;
  label: string;
  shortLabel: string;
  color: string;
}> = [
  { value: 'fixed_income', label: 'Renda Fixa (Tesouro / CDB / LCI)', shortLabel: 'Renda Fixa', color: '#2563EB' },
  { value: 'stocks', label: 'Ações & ETFs', shortLabel: 'Ações', color: '#16A34A' },
  { value: 'reits', label: 'Fundos Imobiliários (FIIs)', shortLabel: 'FIIs', color: '#0891B2' },
  { value: 'funds', label: 'Fundos de Investimento', shortLabel: 'Fundos', color: '#7C3AED' },
  { value: 'crypto', label: 'Criptomoedas', shortLabel: 'Cripto', color: '#D97706' },
  { value: 'savings', label: 'Reserva / Poupança', shortLabel: 'Reserva', color: '#64748B' },
];

export function AddInvestmentModal({
  onClose,
  onAdd,
  onUpdate,
  editingInvestment = null,
}: AddInvestmentModalProps) {
  const isEditing = Boolean(editingInvestment);

  const [name, setName] = useState(editingInvestment?.name ?? '');
  const [amount, setAmount] = useState(
    editingInvestment ? String(editingInvestment.amount) : ''
  );
  const [currentValue, setCurrentValue] = useState(
    editingInvestment ? String(editingInvestment.currentValue) : ''
  );
  const [type, setType] = useState<InvestmentType>(
    editingInvestment?.type ?? 'fixed_income'
  );
  const [institution, setInstitution] = useState(editingInvestment?.institution ?? '');
  const [notes, setNotes] = useState(editingInvestment?.notes ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount.replace(',', '.'));
    const parsedCurrent =
      currentValue.trim() === ''
        ? parsedAmount
        : Number(currentValue.replace(',', '.'));

    if (!name.trim()) {
      setError('Informe o nome ou ticker do ativo.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor investido maior que zero.');
      return;
    }
    if (!Number.isFinite(parsedCurrent) || parsedCurrent < 0) {
      setError('Informe um valor atual válido.');
      return;
    }

    setLoading(true);
    try {
      if (editingInvestment && onUpdate) {
        await onUpdate(editingInvestment.id, {
          name,
          amount: parsedAmount,
          currentValue: parsedCurrent,
          type,
          institution,
          notes,
        });
      } else {
        await onAdd({
          name,
          amount: parsedAmount,
          currentValue: parsedCurrent,
          type,
          institution,
          notes,
        });
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao salvar ativo na carteira.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <TrendingUp size={20} className="text-primary" />
            <h3 className="modal-title">
              {isEditing ? 'Editar Ativo' : 'Novo Ativo na Carteira'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close"
            aria-label="Fechar"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="pro-inline-error" role="alert">
              {error}
            </div>
          )}

          <Input
            label="Nome ou Ticker do Ativo"
            type="text"
            placeholder="Ex: Tesouro Selic 2029, PETR4, HGLG11, Bitcoin..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
          />

          <div className="input-wrapper">
            <label className="input-label">Classe do Ativo</label>
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value as InvestmentType)}
            >
              {INVESTMENT_CLASSES.map((cls) => (
                <option key={cls.value} value={cls.value}>
                  {cls.label}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-two-col">
            <Input
              label="Valor Investido (R$)"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <Input
              label="Valor Atual (R$)"
              type="number"
              step="0.01"
              min="0"
              placeholder="Igual ao investido"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
            />
          </div>

          <Input
            label="Corretora ou Banco (opcional)"
            type="text"
            placeholder="Ex: XP, NuInvest, BTG, Rico, Binance..."
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            maxLength={80}
          />

          <div className="input-wrapper">
            <label className="input-label">Observações (opcional)</label>
            <textarea
              className="input pro-textarea"
              rows={2}
              maxLength={240}
              placeholder="Taxa contratada, vencimento, objetivo do ativo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              {isEditing ? 'Salvar alterações' : 'Adicionar ativo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
