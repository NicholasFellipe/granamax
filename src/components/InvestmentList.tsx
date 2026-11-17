// 📋 LISTA DE INVESTIMENTOS

import { useState } from 'react';
import { TrendingUp, TrendingDown, Edit2, Trash2 } from 'lucide-react';
import type { Investment } from '../types';
import useInvestments from '../hooks/useInvestments';
import useAuth from '../hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from './ui/Badge';

interface InvestmentListProps {
  investments: Investment[];
}

const investmentTypeLabels = {
  stocks: 'Ações',
  crypto: 'Cripto',
  funds: 'Fundos',
  savings: 'Poupança',
};

export function InvestmentList({ investments }: InvestmentListProps) {
  const { user } = useAuth();
  const { deleteInvestment, updateInvestmentValue } = useInvestments(user?.uid, user?.isPro || false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este investimento?')) {
      await deleteInvestment(id);
    }
  };

  const handleEdit = (inv: Investment) => {
    setEditingId(inv.id);
    setEditValue(inv.currentValue.toString());
  };

  const handleSaveEdit = async (id: string) => {
    const newValue = parseFloat(editValue);
    if (!isNaN(newValue) && newValue > 0) {
      await updateInvestmentValue(id, newValue);
      setEditingId(null);
    } else {
      alert('Digite um valor válido');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  return (
    <div className="investment-list">
      {investments.map((inv) => {
        const profit = inv.currentValue - inv.amount;
        const profitPercent = (profit / inv.amount) * 100;
        const isEditing = editingId === inv.id;

        return (
          <div key={inv.id} className="investment-item">
            <div className="investment-item-header">
              <div className="investment-item-info">
                <div className="investment-item-name">{inv.name}</div>
                <Badge variant="default" size="sm">
                  {investmentTypeLabels[inv.type]}
                </Badge>
              </div>
              <div className="investment-item-actions">
                {!isEditing && (
                  <>
                    <button
                      onClick={() => handleEdit(inv)}
                      className="investment-action-btn"
                      title="Atualizar valor"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="investment-action-btn investment-action-btn-danger"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="investment-item-values">
              <div className="investment-value-group">
                <span className="investment-value-label">Investido</span>
                <span className="investment-value-amount">
                  R$ {inv.amount.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="investment-value-group">
                <span className="investment-value-label">Valor Atual</span>
                {isEditing ? (
                  <div className="investment-edit-group">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="investment-edit-input"
                      placeholder="0.00"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(inv.id)}
                      className="investment-edit-btn investment-edit-btn-save"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="investment-edit-btn investment-edit-btn-cancel"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <span className={`investment-value-amount ${profit >= 0 ? 'text-primary' : 'text-danger'}`}>
                    R$ {inv.currentValue.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>

              {!isEditing && (
                <div className="investment-value-group">
                  <span className="investment-value-label">Resultado</span>
                  <div className="investment-profit">
                    <span className={`investment-profit-amount ${profit >= 0 ? 'text-primary' : 'text-danger'}`}>
                      {profit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {profit >= 0 ? '+' : ''}R$ {Math.abs(profit).toFixed(2).replace('.', ',')}
                    </span>
                    <span className={`investment-profit-percent ${profit >= 0 ? 'text-primary' : 'text-danger'}`}>
                      ({profit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="investment-item-footer">
              <span className="investment-date">
                Comprado em {format(inv.boughtAt, "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
