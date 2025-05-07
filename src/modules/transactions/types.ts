import { Transaction as DBTransaction } from '@/lib/supabase';

export interface Transaction extends DBTransaction {
  category?: string;
  categoryColor?: string;
}

export interface TransactionFormData {
  amount: string;
  description: string;
  category_id: string;
  date: string;
  type: 'income' | 'expense';
}

export interface TransactionFilterOptions {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  type?: 'income' | 'expense' | 'all';
  searchTerm?: string;
}

export interface TransactionStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
}
