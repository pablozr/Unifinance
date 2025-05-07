import { supabase, Transaction } from '@/lib/supabase';
import { 
  ITransactionRepository, 
  TransactionFilter, 
  TransactionSummary,
  MonthlyData,
  CategorySpending
} from '../interfaces/ITransactionRepository';

export class SupabaseTransactionRepository implements ITransactionRepository {
  async getTransactions(userId: string, filters?: TransactionFilter): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select(`
        id,
        user_id,
        amount,
        description,
        category_id,
        date,
        type,
        created_at
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // Apply filters
    if (filters) {
      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.searchTerm) {
        query = query.ilike('description', `%${filters.searchTerm}%`);
      }
      if (filters.year && filters.month) {
        const startDate = new Date(filters.year, filters.month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(filters.year, filters.month, 0).toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
      } else if (filters.year) {
        const startDate = new Date(filters.year, 0, 1).toISOString().split('T')[0];
        const endDate = new Date(filters.year, 11, 31).toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    return data || [];
  }

  async getTransactionById(id: string, userId: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching transaction:', error);
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }

    return data;
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    return data;
  }

  async updateTransaction(id: string, transaction: Partial<Transaction>, userId: string): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update(transaction)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      throw new Error(`Failed to update transaction: ${error.message}`);
    }

    return data;
  }

  async deleteTransaction(id: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting transaction:', error);
      throw new Error(`Failed to delete transaction: ${error.message}`);
    }

    return true;
  }

  async getTransactionsSummary(userId: string, filters?: TransactionFilter): Promise<TransactionSummary> {
    const transactions = await this.getTransactions(userId, filters);
    
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
    
    return {
      totalIncome,
      totalExpenses,
      balance,
      savingsRate
    };
  }

  async getMonthlyIncomeExpense(userId: string, year: number): Promise<MonthlyData[]> {
    const startDate = new Date(year, 0, 1).toISOString().split('T')[0];
    const endDate = new Date(year, 11, 31).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, date, type')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (error) {
      console.error('Error fetching monthly data:', error);
      throw new Error(`Failed to fetch monthly data: ${error.message}`);
    }
    
    // Initialize monthly data
    const monthlyData: MonthlyData[] = Array.from({ length: 12 }, (_, i) => ({
      name: new Date(year, i, 1).toLocaleString('default', { month: 'short' }),
      income: 0,
      expense: 0
    }));
    
    // Aggregate data by month
    data?.forEach(transaction => {
      const month = new Date(transaction.date).getMonth();
      if (transaction.type === 'income') {
        monthlyData[month].income += transaction.amount;
      } else {
        monthlyData[month].expense += transaction.amount;
      }
    });
    
    return monthlyData;
  }

  async getSpendingByCategory(userId: string, filters?: TransactionFilter): Promise<CategorySpending[]> {
    // First, get all transactions with their category information
    let query = supabase
      .from('transactions')
      .select(`
        amount,
        category_id,
        type,
        categories(name, color)
      `)
      .eq('user_id', userId)
      .eq('type', 'expense');
    
    // Apply filters
    if (filters) {
      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters.year && filters.month) {
        const startDate = new Date(filters.year, filters.month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(filters.year, filters.month, 0).toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
      } else if (filters.year) {
        const startDate = new Date(filters.year, 0, 1).toISOString().split('T')[0];
        const endDate = new Date(filters.year, 11, 31).toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching spending by category:', error);
      throw new Error(`Failed to fetch spending by category: ${error.message}`);
    }
    
    // Aggregate spending by category
    const categoryMap = new Map<string, CategorySpending>();
    
    data?.forEach(transaction => {
      const categoryId = transaction.category_id;
      const categoryName = transaction.categories?.name || 'Uncategorized';
      const categoryColor = transaction.categories?.color || '#cccccc';
      const amount = transaction.amount;
      
      if (categoryMap.has(categoryId)) {
        const category = categoryMap.get(categoryId)!;
        category.amount += amount;
      } else {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          categoryColor,
          amount
        });
      }
    });
    
    return Array.from(categoryMap.values());
  }

  async getTransactionCount(userId: string, filters?: TransactionFilter): Promise<number> {
    let query = supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    // Apply filters
    if (filters) {
      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.searchTerm) {
        query = query.ilike('description', `%${filters.searchTerm}%`);
      }
    }
    
    const { count, error } = await query;
    
    if (error) {
      console.error('Error counting transactions:', error);
      throw new Error(`Failed to count transactions: ${error.message}`);
    }
    
    return count || 0;
  }

  async getPaginatedTransactions(
    userId: string, 
    page: number, 
    pageSize: number, 
    filters?: TransactionFilter
  ): Promise<{
    transactions: Transaction[];
    totalCount: number;
    totalPages: number;
  }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from('transactions')
      .select(`
        id,
        user_id,
        amount,
        description,
        category_id,
        date,
        type,
        created_at
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(from, to);
    
    // Apply filters
    if (filters) {
      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.searchTerm) {
        query = query.ilike('description', `%${filters.searchTerm}%`);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching paginated transactions:', error);
      throw new Error(`Failed to fetch paginated transactions: ${error.message}`);
    }
    
    const totalCount = await this.getTransactionCount(userId, filters);
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return {
      transactions: data || [],
      totalCount,
      totalPages
    };
  }
}
