// 🎯 TIPOS DO GRANAMAX

export interface User {
  uid: string;
  email: string;
  isPro: boolean;
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

export interface Investment {
  id: string;
  userId: string;
  name: string;
  amount: number;
  currentValue: number;
  type: 'stocks' | 'crypto' | 'funds' | 'savings';
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
