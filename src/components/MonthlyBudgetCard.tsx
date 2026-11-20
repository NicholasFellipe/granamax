import { useState, type FormEvent } from 'react';
import { CalendarRange, Edit2, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface MonthlyBudgetCardProps {
  month: string;
  monthLabel: string;
  spent: number;
  limit: number | null;
  loading: boolean;
  onSaveLimit: (month: string, limit: number) => Promise<void>;
  onRemoveLimit: (month: string) => Promise<void>;
}

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
  return Number(normalized);
}

export function MonthlyBudgetCard({
  month,
  monthLabel,
  spent,
  limit,
  loading,
  onSaveLimit,
  onRemoveLimit,
}: MonthlyBudgetCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const hasBudget = limit !== null && limit > 0;
  const percentage = hasBudget ? (spent / limit) * 100 : 0;
  const remaining = hasBudget ? limit - spent : 0;
  const isOverBudget = hasBudget && spent > limit;
  const isNearLimit = hasBudget && percentage > 80 && percentage <= 100;

  const startEditing = () => {
    setError('');
    setInputValue(hasBudget ? limit.toFixed(2).replace('.', ',') : '');
    setIsEditing(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = parseCurrencyInput(inputValue);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 1000000000) {
      setError('Informe um valor válido maior que zero.');
      return;
    }

    setSaving(true);
    try {
      await onSaveLimit(month, parsed);
      setIsEditing(false);
      setInputValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a meta.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setError('');
    setSaving(true);
    try {
      await onRemoveLimit(month);
      setIsEditing(false);
      setInputValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover a meta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="monthly-budget-card">
      <CardHeader
        title="Orçamento Mensal"
        subtitle={`Meta de gastos — ${monthLabel}`}
        action={
          hasBudget && !isEditing ? (
            <div className="monthly-budget-header-actions">
              <Badge
                variant={isOverBudget ? 'danger' : isNearLimit ? 'warning' : 'success'}
                size="sm"
              >
                {percentage.toFixed(0)}%
              </Badge>
              <button
                type="button"
                className="monthly-budget-edit-btn"
                onClick={startEditing}
                title="Editar meta mensal"
                aria-label="Editar meta mensal"
              >
                <Edit2 size={16} />
              </button>
            </div>
          ) : undefined
        }
      />

      <CardContent>
        {loading ? (
          <div className="spinner-container">
            <div className="spinner" />
          </div>
        ) : !hasBudget || isEditing ? (
          <form onSubmit={handleSubmit} className="monthly-budget-form">
            <p className="monthly-budget-helper">
              {hasBudget
                ? 'Atualize o limite máximo de despesas para este mês:'
                : 'Defina quanto deseja gastar no máximo neste mês para acompanhar seu progresso.'}
            </p>
            <div className="monthly-budget-input-row">
              <div className="monthly-budget-field">
                <span className="monthly-budget-prefix" aria-hidden="true">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="monthly-budget-input"
                  placeholder="Ex: 2500,00"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  aria-label="Valor da meta mensal"
                  disabled={saving}
                />
              </div>
              <Button type="submit" variant="primary" size="md" disabled={saving}>
                {saving ? 'Salvando...' : hasBudget ? 'Salvar' : 'Definir meta'}
              </Button>
              {isEditing && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    disabled={saving}
                    onClick={() => {
                      setIsEditing(false);
                      setError('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <button
                    type="button"
                    className="monthly-budget-remove-btn"
                    onClick={handleRemove}
                    disabled={saving}
                    title="Remover meta mensal"
                    aria-label="Remover meta mensal"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
            {error && <p className="monthly-budget-error">{error}</p>}
          </form>
        ) : (
          <>
            <div className="budget-display">
              <div className="budget-icon-wrapper">
                <div
                  className={`budget-icon ${
                    isOverBudget
                      ? 'budget-icon-danger'
                      : isNearLimit
                      ? 'budget-icon-warning'
                      : 'budget-icon-success'
                  }`}
                >
                  <CalendarRange size={30} />
                </div>
              </div>

              <div className="budget-values">
                <div className="budget-main">
                  <span className="budget-label">Meta definida para o mês:</span>
                  <span className="budget-amount">R$ {formatBRL(limit)}</span>
                </div>

                <div className="budget-secondary">
                  <div className="budget-stat">
                    <span className="budget-stat-label">Gasto no mês</span>
                    <span className={`budget-stat-value ${isOverBudget ? 'text-danger' : ''}`}>
                      R$ {formatBRL(spent)}
                    </span>
                  </div>

                  <div className="budget-stat">
                    <span className="budget-stat-label">
                      {isOverBudget ? 'Excedeu' : 'Disponível'}
                    </span>
                    <span
                      className={`budget-stat-value ${
                        isOverBudget ? 'text-danger' : 'text-primary'
                      }`}
                    >
                      {isOverBudget ? (
                        <>
                          <TrendingUp size={16} />
                          R$ {formatBRL(Math.abs(remaining))}
                        </>
                      ) : (
                        <>
                          <TrendingDown size={16} />
                          R$ {formatBRL(remaining)}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="budget-progress-wrapper">
              <div
                className="budget-progress-bar"
                role="progressbar"
                aria-label="Progresso do orçamento mensal"
                aria-valuenow={Math.min(100, Math.round(percentage))}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`budget-progress-fill ${
                    isOverBudget
                      ? 'budget-progress-danger'
                      : isNearLimit
                      ? 'budget-progress-warning'
                      : 'budget-progress-success'
                  }`}
                  style={{ width: `${Math.min(100, percentage)}%` }}
                />
              </div>
            </div>

            {isOverBudget ? (
              <div className="budget-message budget-message-danger">
                Você ultrapassou sua meta mensal em R$ {formatBRL(Math.abs(remaining))}.
              </div>
            ) : isNearLimit ? (
              <div className="budget-message budget-message-warning">
                Atenção: você já utilizou {percentage.toFixed(0)}% do seu orçamento mensal.
              </div>
            ) : (
              <div className="budget-message budget-message-success">
                Você está dentro do orçamento, com R$ {formatBRL(remaining)} disponíveis neste mês.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
