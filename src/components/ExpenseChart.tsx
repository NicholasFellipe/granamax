// 📈 GRÁFICO DE DESPESAS

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction } from '../types';

interface ExpenseChartProps {
  transactions: Transaction[];
  showComparison?: boolean;
}

export function ExpenseChart({ transactions }: ExpenseChartProps) {
  // Gerar dados dos últimos 7 dias
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 6 - i));
    const dayTransactions = transactions.filter(t => 
      startOfDay(t.date).getTime() === date.getTime() && t.type === 'expense'
    );
    const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      date: format(date, 'EEE', { locale: ptBR }),
      valor: total,
    };
  });

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={last7Days}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            stroke="#6B7280"
            style={{ fontSize: '0.875rem' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '0.875rem' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            }}
            formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Despesa']}
          />
          <Bar dataKey="valor" fill="#22C55E" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {last7Days.every(d => d.valor === 0) && (
        <div className="chart-empty">
          <p>Nenhuma despesa registrada nos últimos 7 dias</p>
        </div>
      )}
    </div>
  );
}
