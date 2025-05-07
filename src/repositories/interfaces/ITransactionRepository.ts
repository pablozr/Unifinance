import { Transaction } from '@/lib/supabase';

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  type?: 'income' | 'expense';
  searchTerm?: string;
  year?: number;
  month?: number;
  page?: number;
  pageSize?: number;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
}

export interface MonthlyData {
  name: string;
  income: number;
  expense: number;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
}

export interface ITransactionRepository {
  // CRUD operations
  getTransactions(userId: string, filters?: TransactionFilter): Promise<Transaction[]>;
  getTransactionById(id: string, userId: string): Promise<Transaction | null>;
  createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<Transaction>, userId: string): Promise<Transaction>;
  deleteTransaction(id: string, userId: string): Promise<boolean>;
  
  // Aggregation operations
  getTransactionsSummary(userId: string, filters?: TransactionFilter): Promise<TransactionSummary>;
  getMonthlyIncomeExpense(userId: string, year: number): Promise<MonthlyData[]>;
  getSpendingByCategory(userId: string, filters?: TransactionFilter): Promise<CategorySpending[]>;
  
  // Pagination
  getTransactionCount(userId: string, filters?: TransactionFilter): Promise<number>;
  getPaginatedTransactions(
    userId: string, 
    page: number, 
    pageSize: number, 
    filters?: TransactionFilter
  ): Promise<{
    transactions: Transaction[];
    totalCount: number;
    totalPages: number;
  }>;
}
