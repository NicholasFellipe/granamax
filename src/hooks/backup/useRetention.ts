// 🎯 HOOK DE RETENÇÃO - ALERTAS E INSIGHTS

import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { startOfMonth, endOfMonth, subMonths, differenceInDays, addDays, format } from 'date-fns';

export function useRetention(userId: string | undefined) {
  const { transactions, totalExpenses, balance } = useTransactions(userId);

  // 📊 ANÁLISE DE GASTOS
  const insights = useMemo(() => {
    const now = new Date();
    const currentMonth = {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
    const lastMonth = {
      start: startOfMonth(subMonths(now, 1)),
      end: endOfMonth(subMonths(now, 1)),
    };

    // Gastos do mês atual
    const currentMonthExpenses = transactions
      .filter(t => 
        t.type === 'expense' && 
        t.date >= currentMonth.start && 
        t.date <= currentMonth.end
      )
      .reduce((sum, t) => sum + t.amount, 0);

    // Gastos do mês passado
    const lastMonthExpenses = transactions
      .filter(t => 
        t.type === 'expense' && 
        t.date >= lastMonth.start && 
        t.date <= lastMonth.end
      )
      .reduce((sum, t) => sum + t.amount, 0);

    // Gastos hoje
    const today = startOfMonth(now);
    const todayExpenses = transactions
      .filter(t => 
        t.type === 'expense' && 
        format(t.date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
      )
      .reduce((sum, t) => sum + t.amount, 0);

    // Gastos ontem
    const yesterday = subMonths(now, 1);
    const yesterdayExpenses = transactions
      .filter(t => 
        t.type === 'expense' && 
        format(t.date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')
      )
      .reduce((sum, t) => sum + t.amount, 0);

    // Média diária de gastos
    const daysInMonth = differenceInDays(now, currentMonth.start) + 1;
    const dailyAverage = currentMonthExpenses / daysInMonth;

    // Projeção fim do mês
    const daysRemaining = differenceInDays(currentMonth.end, now);
    const projectedExpenses = currentMonthExpenses + (dailyAverage * daysRemaining);

    // Comparação com mês anterior
    const monthComparison = lastMonthExpenses > 0 
      ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
      : 0;

    return {
      todayExpenses,
      yesterdayExpenses,
      currentMonthExpenses,
      lastMonthExpenses,
      dailyAverage,
      projectedExpenses,
      monthComparison,
      daysRemaining,
    };
  }, [transactions]);

  // 🚨 ALERTAS INTELIGENTES
  const alerts = useMemo(() => {
    const alertList: Array<{
      id: string;
      type: 'warning' | 'danger' | 'info';
      title: string;
      message: string;
      icon: string;
    }> = [];

    // Alerta: Gastou mais hoje que ontem
    if (insights.todayExpenses > insights.yesterdayExpenses && insights.yesterdayExpenses > 0) {
      alertList.push({
        id: 'spent-more-today',
        type: 'warning',
        title: 'Atenção aos gastos!',
        message: `Você gastou R$ ${(insights.todayExpenses - insights.yesterdayExpenses).toFixed(2)} a mais hoje que ontem`,
        icon: '⚠️',
      });
    }

    // Alerta: Gastando mais que o mês passado
    if (insights.monthComparison > 10) {
      alertList.push({
        id: 'spending-increase',
        type: 'danger',
        title: 'Gastos aumentaram!',
        message: `Você está gastando ${insights.monthComparison.toFixed(0)}% a mais que o mês passado`,
        icon: '📈',
      });
    }

    // Alerta: Projeção de gastos alta
    if (insights.projectedExpenses > insights.lastMonthExpenses * 1.2) {
      const dayToRunOut = addDays(new Date(), Math.floor((balance / insights.dailyAverage)));
      alertList.push({
        id: 'high-projection',
        type: 'danger',
        title: 'Previsão de desastre!',
        message: `Se continuar assim, seu dinheiro acaba dia ${format(dayToRunOut, 'dd/MM')}`,
        icon: '🚨',
      });
    }

    // Alerta: Gastou muito hoje
    if (insights.todayExpenses > insights.dailyAverage * 2) {
      alertList.push({
        id: 'high-spending-today',
        type: 'warning',
        title: 'Dia de gastos altos',
        message: `Você gastou ${((insights.todayExpenses / insights.dailyAverage) * 100).toFixed(0)}% acima da média hoje`,
        icon: '💸',
      });
    }

    // Alerta positivo: Economizando
    if (insights.monthComparison < -10) {
      alertList.push({
        id: 'saving-well',
        type: 'info',
        title: 'Parabéns! 🎉',
        message: `Você está economizando ${Math.abs(insights.monthComparison).toFixed(0)}% comparado ao mês passado`,
        icon: '✅',
      });
    }

    // Alerta: Saldo baixo
    if (balance > 0 && balance < insights.dailyAverage * 5) {
      alertList.push({
        id: 'low-balance',
        type: 'danger',
        title: 'Saldo crítico!',
        message: `Seu saldo só dura mais ${Math.floor(balance / insights.dailyAverage)} dias no ritmo atual`,
        icon: '⚠️',
      });
    }

    return alertList;
  }, [insights, balance]);

  // 🎯 META DIÁRIA
  const dailyBudget = useMemo(() => {
    const daysRemaining = insights.daysRemaining;
    const safeAmount = balance * 0.7; // 70% do saldo disponível para gastar
    const dailyLimit = daysRemaining > 0 ? safeAmount / daysRemaining : 0;

    return {
      limit: dailyLimit,
      spent: insights.todayExpenses,
      remaining: Math.max(0, dailyLimit - insights.todayExpenses),
      percentage: dailyLimit > 0 ? (insights.todayExpenses / dailyLimit) * 100 : 0,
    };
  }, [insights, balance]);

  // 🏆 CONQUISTAS
  const achievements = useMemo(() => {
    const achievementList: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      unlocked: boolean;
      progress?: number;
    }> = [
      {
        id: 'first-transaction',
        title: 'Primeiro Passo',
        description: 'Registre sua primeira transação',
        icon: '🎯',
        unlocked: transactions.length > 0,
      },
      {
        id: 'week-streak',
        title: 'Consistente',
        description: 'Use o app por 7 dias seguidos',
        icon: '🔥',
        unlocked: false, // Implementar lógica de streak
      },
      {
        id: 'save-money',
        title: 'Poupador',
        description: 'Economize 10% do mês passado',
        icon: '💰',
        unlocked: insights.monthComparison < -10,
      },
      {
        id: 'ten-transactions',
        title: 'Ativo',
        description: 'Registre 10 transações',
        icon: '📊',
        unlocked: transactions.length >= 10,
        progress: Math.min(100, (transactions.length / 10) * 100),
      },
      {
        id: 'positive-balance',
        title: 'No Azul',
        description: 'Mantenha saldo positivo',
        icon: '✅',
        unlocked: balance > 0,
      },
      {
        id: 'budget-master',
        title: 'Mestre do Orçamento',
        description: 'Fique abaixo da meta diária por 5 dias',
        icon: '👑',
        unlocked: false, // Implementar lógica de streak de orçamento
      },
    ];

    return achievementList;
  }, [transactions, insights, balance]);

  return {
    insights,
    alerts,
    dailyBudget,
    achievements,
  };
}
