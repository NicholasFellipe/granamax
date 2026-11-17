// ➕ MODAL DE ADICIONAR TRANSAÇÃO

import { useState } from 'react';
import type { FormEvent } from 'react';
import { X, DollarSign } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import type { CategoryType } from '../types';

interface AddTransactionModalProps {
  onClose: () => void;
  onAdd: (description: string, amount: number, type: 'income' | 'expense', category: string) => Promise<void>;
}

const categories: CategoryType[] = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Lazer',
  'Educação',
  'Outros',
];

export function AddTransactionModal({ onClose, onAdd }: AddTransactionModalProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('Outros');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!description || !amount) {
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
      await onAdd(description, numericAmount, type, category);
      onClose();
    } catch (err) {
      alert('Erro ao adicionar transação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Nova Transação</h3>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="transaction-type-toggle">
              <button
                type="button"
                className={`type-btn type-btn-expense ${type === 'expense' ? 'active' : ''}`}
                onClick={() => setType('expense')}
              >
                Despesa
              </button>
              <button
                type="button"
                className={`type-btn type-btn-income ${type === 'income' ? 'active' : ''}`}
                onClick={() => setType('income')}
              >
                Receita
              </button>
            </div>

            <Input
              label="Descrição"
              placeholder="Ex: Supermercado, Salário, Uber..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <Input
              label="Valor"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              icon={<DollarSign size={20} />}
              required
            />

            <div className="input-group">
              <label className="input-label">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="select-input"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
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
