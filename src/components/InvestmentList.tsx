// 📋 LISTA DE ATIVOS DA CARTEIRA COMPLETA (PRO)

import { useState } from 'react';
import {
  Edit2,
  Trash2,
  Check,
  X,
  SlidersHorizontal,
  Building2,
} from 'lucide-react';
import type { Investment, InvestmentType } from '../types';
import { INVESTMENT_CLASSES } from './AddInvestmentModal';

interface InvestmentListProps {
  investments: Investment[];
  totalPortfolioValue: number;
  onQuickUpdateValue: (id: string, newValue: number) => Promise<void>;
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => Promise<void>;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getClassMeta(type: InvestmentType) {
  return (
    INVESTMENT_CLASSES.find((c) => c.value === type) || {
      value: type,
      label: 'Outros',
      shortLabel: 'Outros',
      color: '#64748B',
    }
  );
}

export function InvestmentList({
  investments,
  totalPortfolioValue,
  onQuickUpdateValue,
  onEdit,
  onDelete,
}: InvestmentListProps) {
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditValue, setQuickEditValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const startQuickEdit = (inv: Investment) => {
    setRowError(null);
    setConfirmDeleteId(null);
    setQuickEditId(inv.id);
    setQuickEditValue(inv.currentValue.toFixed(2));
  };

  const handleSaveQuickValue = async (id: string) => {
    const parsed = Number(quickEditValue.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setRowError('Digite um valor atual válido (maior ou igual a zero).');
      return;
    }
    setRowError(null);
    setBusyId(id);
    try {
      await onQuickUpdateValue(id, parsed);
      setQuickEditId(null);
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'Erro ao atualizar valor.');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async (id: string) => {
    setRowError(null);
    setBusyId(id);
    try {
      await onDelete(id);
      setConfirmDeleteId(null);
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'Erro ao remover ativo.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="investment-list">
      {rowError && (
        <div className="pro-inline-error pro-inline-error-inset" role="alert">
          {rowError}
        </div>
      )}

      {investments.map((inv) => {
        const profit = inv.currentValue - inv.amount;
        const profitPercent = inv.amount > 0 ? (profit / inv.amount) * 100 : 0;
        const sharePercent =
          totalPortfolioValue > 0 ? (inv.currentValue / totalPortfolioValue) * 100 : 0;
        const classMeta = getClassMeta(inv.type);
        const isQuickEditing = quickEditId === inv.id;
        const isConfirmingDelete = confirmDeleteId === inv.id;
        const isBusy = busyId === inv.id;

        return (
          <div key={inv.id} className="investment-item">
            <div className="investment-item-left">
              <span
                className="investment-class-dot"
                style={{ backgroundColor: classMeta.color }}
                aria-hidden="true"
              />
              <div className="investment-info">
                <div className="investment-name-row">
                  <span className="investment-name">{inv.name}</span>
                  <span className="investment-share-text">
                    {sharePercent.toFixed(1).replace('.', ',')}% da carteira
                  </span>
                </div>
                <div className="investment-meta">
                  <span>{classMeta.shortLabel}</span>
                  {inv.institution && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="investment-inst">
                        <Building2 size={12} /> {inv.institution}
                      </span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>Aportado: R$ {formatBRL(inv.amount)}</span>
                </div>
                {inv.notes && <p className="investment-notes">{inv.notes}</p>}
              </div>
            </div>

            <div className="investment-item-right">
              {isQuickEditing ? (
                <div className="investment-edit-group">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quickEditValue}
                    onChange={(e) => setQuickEditValue(e.target.value)}
                    className="investment-edit-input"
                    aria-label="Novo valor atual"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveQuickValue(inv.id)}
                    className="investment-action-btn investment-action-save"
                    title="Salvar valor"
                    disabled={isBusy}
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickEditId(null)}
                    className="investment-action-btn investment-action-cancel"
                    title="Cancelar"
                    disabled={isBusy}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="investment-values">
                    <div className="investment-current-value">
                      R$ {formatBRL(inv.currentValue)}
                    </div>
                    <div
                      className={`investment-profit ${
                        profit >= 0 ? 'text-primary' : 'text-danger'
                      }`}
                    >
                      {profit >= 0 ? '+' : '-'}R$ {formatBRL(Math.abs(profit))} (
                      {profit >= 0 ? '+' : ''}
                      {profitPercent.toFixed(1).replace('.', ',')}%)
                    </div>
                  </div>

                  {isConfirmingDelete ? (
                    <div className="investment-delete-confirm">
                      <span>Remover?</span>
                      <button
                        type="button"
                        className="investment-confirm-yes"
                        onClick={() => handleConfirmDelete(inv.id)}
                        disabled={isBusy}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        className="investment-confirm-no"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isBusy}
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <div className="investment-actions">
                      <button
                        type="button"
                        onClick={() => startQuickEdit(inv)}
                        className="investment-action-btn"
                        title="Atualizar cotação / valor atual"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(inv)}
                        className="investment-action-btn"
                        title="Editar todos os dados do ativo"
                      >
                        <SlidersHorizontal size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(inv.id)}
                        className="investment-action-btn investment-action-delete"
                        title="Remover ativo"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
