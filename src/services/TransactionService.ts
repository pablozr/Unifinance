import { Transaction } from '@/lib/supabase';
import { 
  ITransactionRepository, 
  TransactionFilter, 
  TransactionSummary,
  MonthlyData,
  CategorySpending,
  RepositoryFactory,
  RepositoryType
} from '@/repositories';

export class TransactionService {
  private transactionRepository: ITransactionRepository;

  constructor() {
    this.transactionRepository = RepositoryFactory.getRepository(RepositoryType.TRANSACTION);
  }

  async getAllTransactions(
    userId: string, 
    year?: number, 
    month?: number, 
    filters?: Partial<TransactionFilter>
  ): Promise<Transaction[]> {
    const transactionFilters: TransactionFilter = {
      ...filters,
      year,
      month
    };

    return this.transactionRepository.getTransactions(userId, transactionFilters);
  }

  async getTransactionById(id: string, userId: string): Promise<Transaction | null> {
    return this.transactionRepository.getTransactionById(id, userId);
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
    return this.transactionRepository.createTransaction(transaction);
  }

  async updateTransaction(id: string, transaction: Partial<Transaction>, userId: string): Promise<Transaction> {
    return this.transactionRepository.updateTransaction(id, transaction, userId);
  }

  async deleteTransaction(id: string, userId: string): Promise<boolean> {
    return this.transactionRepository.deleteTransaction(id, userId);
  }

  async getTransactionsSummary(
    userId: string, 
    year?: number, 
    month?: number
  ): Promise<TransactionSummary> {
    const filters: TransactionFilter = { year, month };
    return this.transactionRepository.getTransactionsSummary(userId, filters);
  }

  async getMonthlyIncomeExpense(userId: string, year: number): Promise<MonthlyData[]> {
    return this.transactionRepository.getMonthlyIncomeExpense(userId, year);
  }

  async getSpendingByCategory(
    userId: string, 
    year?: number, 
    month?: number
  ): Promise<CategorySpending[]> {
    const filters: TransactionFilter = { year, month };
    return this.transactionRepository.getSpendingByCategory(userId, filters);
  }

  async getPaginatedTransactions(
    userId: string, 
    page: number, 
    pageSize: number, 
    filters?: Partial<TransactionFilter>
  ): Promise<{
    transactions: Transaction[];
    totalCount: number;
    totalPages: number;
  }> {
    return this.transactionRepository.getPaginatedTransactions(
      userId, 
      page, 
      pageSize, 
      filters as TransactionFilter
    );
  }
}
