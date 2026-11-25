import { useState, type FormEvent } from 'react';
import { X, DollarSign, Crown, Lock } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import type { CategoryType } from '../types';
import { FREE_EXPENSE_LIMIT, FREE_INCOME_LIMIT } from '../constants/planLimits';

interface AddTransactionModalProps {
  onClose: () => void;
  onAdd: (description: string, amount: number, type: 'income' | 'expense', category: string) => Promise<unknown>;
  isPro?: boolean;
  expenseCount?: number;
  incomeCount?: number;
  onUpgradeToPro?: () => void;
}

const DEFAULT_CATEGORIES: CategoryType[] = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Outros',
];

export function AddTransactionModal({
  onClose,
  onAdd,
  isPro = false,
  expenseCount = 0,
  incomeCount = 0,
  onUpgradeToPro,
}: AddTransactionModalProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('Alimentação');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeCount = type === 'expense' ? expenseCount : incomeCount;
  const activeLimit = type === 'expense' ? FREE_EXPENSE_LIMIT : FREE_INCOME_LIMIT;
  const activeRatio = Math.min(100, Math.round((activeCount / activeLimit) * 100));
  const limitReached = !isPro && activeCount >= activeLimit;
  const nearLimit = !isPro && !limitReached && activeRatio >= 80;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (limitReached) {
      setError(
        type === 'expense'
          ? `Limite de ${FREE_EXPENSE_LIMIT} despesas do plano Grátis atingido.`
          : `Limite de ${FREE_INCOME_LIMIT} receitas do plano Grátis atingido.`
      );
      return;
    }

    const finalCategory = (useCustomCategory ? customCategory : category).trim().slice(0, 40);

    if (!description.trim() || !amount.trim()) {
      setError('Preencha descrição e valor.');
      return;
    }

    if (!finalCategory) {
      setError('Selecione ou digite uma categoria.');
      return;
    }

    const cleaned = amount.replace(/R\$|\s/g, '');
    const normalized =
      cleaned.includes(',') && cleaned.includes('.')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(',', '.');
    const numericAmount = parseFloat(normalized);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Digite um valor válido maior que zero.');
      return;
    }

    setLoading(true);
    try {
      await onAdd(description.trim(), numericAmount, type, finalCategory);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar transação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Nova Transação</h3>
          <button type="button" onClick={onClose} className="modal-close" aria-label="Fechar">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="transaction-type-toggle">
              <button
                type="button"
                className={`type-btn type-btn-expense ${type === 'expense' ? 'active' : ''}`}
                onClick={() => {
                  setType('expense');
                  setError('');
                }}
              >
                Despesa
              </button>
              <button
                type="button"
                className={`type-btn type-btn-income ${type === 'income' ? 'active' : ''}`}
                onClick={() => {
                  setType('income');
                  setError('');
                }}
              >
                Receita
              </button>
            </div>

            {!isPro && (
              <div className="modal-quota-box">
                <div
                  className={`modal-quota-row ${limitReached ? 'modal-quota-row-full' : ''}`}
                >
                  <span>
                    {type === 'expense'
                      ? 'Despesas no plano Grátis'
                      : 'Receitas no plano Grátis'}
                  </span>
                  <strong>
                    {activeCount} / {activeLimit}
                  </strong>
                </div>
                <div className="free-quota-track">
                  <div
                    className={`free-quota-fill ${
                      limitReached
                        ? 'free-quota-fill-full'
                        : nearLimit
                          ? 'free-quota-fill-warn'
                          : ''
                    }`}
                    style={{ width: `${activeRatio}%` }}
                  />
                </div>
              </div>
            )}

            {limitReached ? (
              <div className="modal-limit-upsell" role="alert">
                <div className="modal-limit-upsell-copy">
                  <Lock size={16} />
                  <span>
                    Você atingiu o limite de{' '}
                    <strong>
                      {type === 'expense'
                        ? `${FREE_EXPENSE_LIMIT} despesas`
                        : `${FREE_INCOME_LIMIT} receitas`}
                    </strong>{' '}
                    do plano Grátis. Exclua um lançamento antigo ou ative o GranaMax PRO para registros ilimitados e lançamento por voz com IA.
                  </span>
                </div>
                {onUpgradeToPro && (
                  <Button
                    type="button"
                    variant="pro"
                    size="sm"
                    onClick={onUpgradeToPro}
                    icon={<Crown size={15} />}
                  >
                    Liberar lançamentos ilimitados no PRO
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Input
                  label="Descrição"
                  placeholder="Ex: Supermercado, Aluguel, Cinema..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={120}
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
                  <div className="category-chip-grid" role="group" aria-label="Categorias">
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`category-chip ${!useCustomCategory && category === cat ? 'active' : ''}`}
                        onClick={() => {
                          setUseCustomCategory(false);
                          setCategory(cat);
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`category-chip ${useCustomCategory ? 'active' : ''}`}
                      onClick={() => setUseCustomCategory(true)}
                    >
                      + Personalizada
                    </button>
                  </div>

                  {useCustomCategory && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <Input
                        placeholder="Ex: Assinaturas, Pets, Viagem..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        maxLength={40}
                        required
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {error && <p className="modal-error-text">{error}</p>}
          </div>

          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading || limitReached}>
              {loading ? 'Salvando...' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
