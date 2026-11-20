import { useState, type FormEvent } from 'react';
import {
  Repeat,
  Plus,
  TrendingUp,
  TrendingDown,
  CalendarClock,
  Pause,
  Play,
  Trash2,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import type { RecurringTransaction } from '../types';
import type { CreateRecurringInput } from '../hooks/useRecurringTransactions';

interface RecurringTransactionsPanelProps {
  items: RecurringTransaction[];
  loading: boolean;
  onAdd: (input: CreateRecurringInput) => Promise<void>;
  onToggleActive: (id: string, active: boolean) => Promise<void>;
  onTriggerNow: (item: RecurringTransaction, month?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const EXPENSE_PRESETS = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Outros',
];

const INCOME_PRESETS = ['Salário', 'Freelance', 'Aluguel Recebido', 'Rendimentos', 'Outros'];

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrencyInput(raw: string): number {
  const cleaned = raw.replace(/R\$|\s/g, '');
  if (!cleaned) return NaN;
  const normalized =
    cleaned.includes(',') && cleaned.includes('.')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned.replace(',', '.');
  return parseFloat(normalized);
}

export function RecurringTransactionsPanel({
  items,
  loading,
  onAdd,
  onToggleActive,
  onTriggerNow,
  onDelete,
}: RecurringTransactionsPanelProps) {
  const now = new Date();
  const currentMonth = format(now, 'yyyy-MM');
  const currentMonthLabel = format(now, "MMMM 'de' yyyy", { locale: ptBR });
  const todayDay = now.getDate();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState<number>(Math.min(todayDay, 28));
  const [category, setCategory] = useState<string>('Moradia');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [populateCurrentMonth, setPopulateCurrentMonth] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const presets = type === 'income' ? INCOME_PRESETS : EXPENSE_PRESETS;

  const activeIncomes = items
    .filter((i) => i.active && i.type === 'income')
    .reduce((acc, i) => acc + i.amount, 0);

  const activeExpenses = items
    .filter((i) => i.active && i.type === 'expense')
    .reduce((acc, i) => acc + i.amount, 0);

  const projectedNet = activeIncomes - activeExpenses;

  const handleTypeChange = (nextType: 'income' | 'expense') => {
    setType(nextType);
    setUseCustomCategory(false);
    setCategory(nextType === 'income' ? 'Salário' : 'Moradia');
  };

  const handleDayChange = (nextDay: number) => {
    setDayOfMonth(nextDay);
    setPopulateCurrentMonth(nextDay <= todayDay);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const finalCategory = (useCustomCategory ? customCategory : category).trim().slice(0, 40);
    if (!description.trim()) {
      setError('Informe uma descrição para a conta ou receita fixa.');
      return;
    }

    const numericAmount = parseCurrencyInput(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 1000000000) {
      setError('Digite um valor válido maior que zero.');
      return;
    }

    if (!finalCategory) {
      setError('Selecione ou digite uma categoria.');
      return;
    }

    setSubmitting(true);
    try {
      await onAdd({
        description: description.trim(),
        amount: numericAmount,
        type,
        category: finalCategory,
        dayOfMonth,
        populateCurrentMonth,
      });
      setDescription('');
      setAmount('');
      setCustomCategory('');
      setUseCustomCategory(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar recorrência.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    try {
      await action();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="recurring-panel">
      <div className="recurring-summary-grid">
        <Card className="recurring-summary-card">
          <div className="recurring-summary-label">Receitas Fixas (Mês)</div>
          <div className="recurring-summary-value text-primary">
            +R$ {formatBRL(activeIncomes)}
          </div>
          <div className="recurring-summary-hint">
            {items.filter((i) => i.active && i.type === 'income').length} fonte(s) ativa(s)
          </div>
        </Card>

        <Card className="recurring-summary-card">
          <div className="recurring-summary-label">Contas Fixas (Mês)</div>
          <div className="recurring-summary-value text-danger">
            -R$ {formatBRL(activeExpenses)}
          </div>
          <div className="recurring-summary-hint">
            {items.filter((i) => i.active && i.type === 'expense').length} conta(s) ativa(s)
          </div>
        </Card>

        <Card className="recurring-summary-card">
          <div className="recurring-summary-label">Saldo Fixo Previsto</div>
          <div
            className={`recurring-summary-value ${
              projectedNet >= 0 ? 'text-primary' : 'text-danger'
            }`}
          >
            {projectedNet >= 0 ? 'R$ ' : '-R$ '}
            {formatBRL(Math.abs(projectedNet))}
          </div>
          <div className="recurring-summary-hint">Diferença mensal recorrente</div>
        </Card>
      </div>

      <div className="recurring-main-grid">
        <Card>
          <CardHeader
            title="Nova Transação Recorrente"
            subtitle="Configure contas mensais ou receitas fixas para lançamento automático"
          />
          <CardContent>
            <form onSubmit={handleSubmit} className="recurring-form">
              <div className="transaction-type-toggle">
                <button
                  type="button"
                  className={`type-btn type-btn-expense ${type === 'expense' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('expense')}
                >
                  Conta / Despesa Fixa
                </button>
                <button
                  type="button"
                  className={`type-btn type-btn-income ${type === 'income' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('income')}
                >
                  Receita Mensal
                </button>
              </div>

              <Input
                label="Descrição"
                placeholder={
                  type === 'income'
                    ? 'Ex: Salário, Pensão, Aluguel recebido...'
                    : 'Ex: Aluguel, Internet, Academia, Energia...'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={120}
                required
              />

              <div className="recurring-form-row">
                <Input
                  label="Valor Mensal (R$)"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  icon={<DollarSign size={18} />}
                  required
                />

                <div className="input-group">
                  <label htmlFor="recurring-day-select" className="input-label">
                    Dia do vencimento / recebimento
                  </label>
                  <select
                    id="recurring-day-select"
                    className="select-input"
                    value={dayOfMonth}
                    onChange={(e) => handleDayChange(Number(e.target.value))}
                  >
                    {Array.from({ length: 31 }, (_, idx) => idx + 1).map((day) => (
                      <option key={day} value={day}>
                        Todo dia {day}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Categoria</label>
                <div className="category-chip-grid" role="group" aria-label="Categorias recorrentes">
                  {presets.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`category-chip ${
                        !useCustomCategory && category === cat ? 'active' : ''
                      }`}
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
                      placeholder="Ex: Streaming, Condomínio, Pró-labore..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      maxLength={40}
                      required
                    />
                  </div>
                )}
              </div>

              <label className="recurring-checkbox-row">
                <input
                  type="checkbox"
                  checked={populateCurrentMonth}
                  onChange={(e) => setPopulateCurrentMonth(e.target.checked)}
                />
                <span>
                  Lançar automaticamente no mês atual (<strong>{currentMonthLabel}</strong>) agora
                </span>
              </label>

              {error && <p className="modal-error-text">{error}</p>}

              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                icon={<Plus size={18} />}
              >
                {submitting ? 'Salvando...' : 'Adicionar Recorrência'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Contas e Receitas Configuradas"
            subtitle="Ao abrir o painel no dia previsto de cada mês, as pendências ativas entram automaticamente"
          />
          <CardContent className="p-0">
            {loading ? (
              <div className="spinner-container">
                <div className="spinner" />
              </div>
            ) : items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Repeat size={44} />
                </div>
                <h3 className="empty-title">Nenhuma recorrência cadastrada</h3>
                <p className="empty-description">
                  Cadastre salário, aluguel, assinaturas ou contas fixas para automatizar seus lançamentos mensais.
                </p>
              </div>
            ) : (
              <div className="recurring-list">
                {items.map((item) => {
                  const isBusy = busyId === item.id;
                  const alreadyGeneratedThisMonth = item.lastGeneratedMonth === currentMonth;

                  return (
                    <div
                      key={item.id}
                      className={`recurring-item ${!item.active ? 'recurring-item-paused' : ''}`}
                    >
                      <div className="recurring-item-left">
                        <div
                          className={`transaction-icon ${
                            item.type === 'income'
                              ? 'transaction-icon-income'
                              : 'transaction-icon-expense'
                          }`}
                        >
                          {item.type === 'income' ? (
                            <TrendingUp size={20} />
                          ) : (
                            <TrendingDown size={20} />
                          )}
                        </div>

                        <div className="recurring-item-info">
                          <div className="recurring-item-title-row">
                            <span className="recurring-item-title">{item.description}</span>
                            {!item.active ? (
                              <Badge variant="default" size="sm">
                                Pausada
                              </Badge>
                            ) : alreadyGeneratedThisMonth ? (
                              <Badge variant="success" size="sm">
                                <CheckCircle2 size={12} />
                                Lançada neste mês
                              </Badge>
                            ) : (
                              <Badge variant="warning" size="sm">
                                <CalendarClock size={12} />
                                Aguardando dia {item.dayOfMonth}
                              </Badge>
                            )}
                          </div>

                          <div className="recurring-item-meta">
                            <span className="recurring-category-pill">{item.category}</span>
                            <span>Todo dia {item.dayOfMonth}</span>
                          </div>
                        </div>
                      </div>

                      <div className="recurring-item-right">
                        <span
                          className={`transaction-amount ${
                            item.type === 'income'
                              ? 'transaction-amount-income'
                              : 'transaction-amount-expense'
                          }`}
                        >
                          {item.type === 'income' ? '+' : '-'}R$ {formatBRL(item.amount)}
                        </span>

                        <div className="recurring-item-actions">
                          {item.active && !alreadyGeneratedThisMonth && (
                            <button
                              type="button"
                              className="recurring-action-btn recurring-action-trigger"
                              disabled={isBusy}
                              onClick={() =>
                                handleAction(item.id, () => onTriggerNow(item, currentMonth))
                              }
                              title="Lançar neste mês agora"
                            >
                              Lançar agora
                            </button>
                          )}

                          <button
                            type="button"
                            className="recurring-action-icon"
                            disabled={isBusy}
                            onClick={() =>
                              handleAction(item.id, () => onToggleActive(item.id, !item.active))
                            }
                            title={item.active ? 'Pausar recorrência' : 'Reativar recorrência'}
                            aria-label={item.active ? 'Pausar recorrência' : 'Reativar recorrência'}
                          >
                            {item.active ? <Pause size={16} /> : <Play size={16} />}
                          </button>

                          <button
                            type="button"
                            className="transaction-delete"
                            disabled={isBusy}
                            onClick={() => handleAction(item.id, () => onDelete(item.id))}
                            title="Excluir recorrência"
                            aria-label="Excluir recorrência"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
