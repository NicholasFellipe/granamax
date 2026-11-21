// 🎯 TIPOS DO GRANAMAX

export type ProPlan = 'free' | 'monthly' | 'yearly';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isPro: boolean;
  proPlan?: ProPlan;
  proActivatedAt?: Date | null;
  birthDate?: string | null;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date;
  createdAt: Date;
}

export type InvestmentType =
  | 'stocks'
  | 'reits'
  | 'fixed_income'
  | 'funds'
  | 'crypto'
  | 'savings';

export interface Investment {
  id: string;
  userId: string;
  name: string;
  amount: number;
  currentValue: number;
  type: InvestmentType;
  institution?: string;
  notes?: string;
  boughtAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  spent: number;
  month: string; // 'YYYY-MM'
}

export interface MonthlyBudget {
  id: string;
  userId: string;
  month: string; // 'YYYY-MM'
  limit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringTransaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  dayOfMonth: number; // 1..31
  active: boolean;
  lastGeneratedMonth: string; // 'YYYY-MM' or ''
  createdAt: Date;
  updatedAt: Date;
}

export interface WealthSnapshot {
  id: string;
  userId: string;
  month: string; // 'YYYY-MM'
  cashBalance: number;
  investmentsValue: number;
  netWorth: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CustomAlertMetric =
  | 'category_monthly'
  | 'min_balance'
  | 'single_expense'
  | 'portfolio_goal';

export interface CustomAlert {
  id: string;
  userId: string;
  name: string;
  metric: CustomAlertMetric;
  category: string;
  threshold: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvaluatedAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  icon: string;
}

export type SupportTopic = 'carteira' | 'previsoes' | 'assinatura' | 'bug' | 'outro';
export type SupportPriority = 'normal' | 'high';
export type SupportStatus = 'open' | 'in_progress' | 'resolved';

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  topic: SupportTopic;
  priority: SupportPriority;
  message: string;
  status: SupportStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SmartForecastPressureCategory {
  category: string;
  reason: string;
  suggestedLimit: number;
}

export interface SmartForecastResult {
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  projectedMonthTotal: number;
  potentialMonthlySavings: number;
  pressureCategories: SmartForecastPressureCategory[];
  actionableTips: string[];
  generatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  completed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export type CategoryType =
  | 'Alimentação'
  | 'Transporte'
  | 'Moradia'
  | 'Saúde'
  | 'Lazer'
  | 'Educação'
  | 'Outros';
