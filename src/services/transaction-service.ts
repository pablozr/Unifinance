import { supabase, Transaction } from '@/lib/supabase';
import { transactionSchema } from '@/lib/validations';
import { z } from 'zod';

export type TransactionInput = z.infer<typeof transactionSchema>;
export type TransactionType = 'income' | 'expense';

interface TransactionFilters {
  page?: number;
  limit?: number;
  searchTerm?: string;
  categoryId?: string;
  type?: TransactionType;
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
}

export const transactionService = {
  /**
   * Get transactions for a user with pagination and filtering
   * @param userId User ID
   * @param filters Optional filters and pagination options
   * @returns Object containing transactions data and total count
   */
  async getTransactions(
    userId: string,
    filters?: TransactionFilters
  ): Promise<{ data: Transaction[], count: number }> {
    // Set default values
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build count query first (without range)
    let countQuery = supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Build data query
    let dataQuery = supabase
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

    // Apply filters to both queries
    // Filter by search term
    if (filters?.searchTerm) {
      const searchPattern = `%${filters.searchTerm}%`;
      countQuery = countQuery.ilike('description', searchPattern);
      dataQuery = dataQuery.ilike('description', searchPattern);
    }

    // Filter by category
    if (filters?.categoryId) {
      countQuery = countQuery.eq('category_id', filters.categoryId);
      dataQuery = dataQuery.eq('category_id', filters.categoryId);
    }

    // Filter by transaction type
    if (filters?.type) {
      countQuery = countQuery.eq('type', filters.type);
      dataQuery = dataQuery.eq('type', filters.type);
    }

    // Filter by year and month
    if (filters?.year && filters?.month) {
      // Create date range for the specified month
      const startDate = new Date(filters.year, filters.month - 1, 1).toISOString();
      const endDate = new Date(filters.year, filters.month, 0).toISOString();

      countQuery = countQuery.gte('date', startDate).lte('date', endDate);
      dataQuery = dataQuery.gte('date', startDate).lte('date', endDate);
    } else if (filters?.year) {
      // Create date range for the specified year
      const startDate = new Date(filters.year, 0, 1).toISOString();
      const endDate = new Date(filters.year, 11, 31).toISOString();

      countQuery = countQuery.gte('date', startDate).lte('date', endDate);
      dataQuery = dataQuery.gte('date', startDate).lte('date', endDate);
    }

    // Execute both queries
    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery
    ]);

    // Handle errors
    if (countResult.error) {
      console.error('Error counting transactions:', countResult.error);
      throw countResult.error;
    }

    if (dataResult.error) {
      console.error('Error fetching transactions:', dataResult.error);
      throw dataResult.error;
    }

    return {
      data: dataResult.data || [],
      count: countResult.count || 0
    };
  },

  /**
   * Get all transactions for a user (legacy method)
   * @param userId User ID
   * @param year Optional year to filter by
   * @param month Optional month to filter by (1-12)
   */
  async getAllTransactions(userId: string, year?: number, month?: number): Promise<Transaction[]> {
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
      .eq('user_id', userId);

    // Filter by year and month if provided
    if (year && month) {
      // Create date range for the specified month
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();
      query = query.gte('date', startDate).lte('date', endDate);
    } else if (year) {
      // Create date range for the specified year
      const startDate = new Date(year, 0, 1).toISOString();
      const endDate = new Date(year, 11, 31).toISOString();
      query = query.gte('date', startDate).lte('date', endDate);
    }

    // Order by date (newest first)
    query = query.order('date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get a transaction by ID
   */
  async getTransactionById(id: string, userId: string): Promise<Transaction | null> {
    const { data, error } = await supabase
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
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }

    return data;
  },

  /**
   * Create a new transaction
   */
  async createTransaction(transaction: TransactionInput, userId: string): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: transaction.amount,
        description: transaction.description,
        category_id: transaction.category_id,
        date: transaction.date.toISOString(),
        type: transaction.type,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }

    return data;
  },

  /**
   * Update a transaction
   */
  async updateTransaction(id: string, transaction: Partial<TransactionInput>, userId: string): Promise<Transaction> {
    const updates: any = { ...transaction };

    // Convert date to ISO string if it exists
    if (updates.date instanceof Date) {
      updates.date = updates.date.toISOString();
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }

    return data;
  },

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },

  /**
   * Get transactions summary (total income, total expenses, balance)
   * @param userId User ID
   * @param year Optional year to filter by
   * @param month Optional month to filter by (1-12)
   * @param startDate Optional start date (alternative to year/month)
   * @param endDate Optional end date (alternative to year/month)
   */
  async getTransactionsSummary(
    userId: string,
    year?: number,
    month?: number,
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    savingsRate: number;
  }> {
    let query = supabase
      .from('transactions')
      .select(`
        id,
        amount,
        type
      `)
      .eq('user_id', userId);

    // Filter by year and month if provided
    if (year && month) {
      // Create date range for the specified month
      const monthStartDate = new Date(year, month - 1, 1).toISOString();
      const monthEndDate = new Date(year, month, 0).toISOString();
      query = query.gte('date', monthStartDate).lte('date', monthEndDate);
    } else if (year) {
      // Create date range for the specified year
      const yearStartDate = new Date(year, 0, 1).toISOString();
      const yearEndDate = new Date(year, 11, 31).toISOString();
      query = query.gte('date', yearStartDate).lte('date', yearEndDate);
    } else {
      // Use explicit date range if provided
      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions summary:', error);
      throw error;
    }

    const totalIncome = data
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = data
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      balance,
      savingsRate,
    };
  },

  /**
   * Get spending by category
   * @param userId User ID
   * @param year Optional year to filter by
   * @param month Optional month to filter by (1-12)
   * @param startDate Optional start date (alternative to year/month)
   * @param endDate Optional end date (alternative to year/month)
   */
  async getSpendingByCategory(
    userId: string,
    year?: number,
    month?: number,
    startDate?: string,
    endDate?: string
  ): Promise<{
    category_id: string;
    amount: number;
    percentage: number;
  }[]> {
    let query = supabase
      .from('transactions')
      .select(`
        amount,
        category_id,
        type
      `)
      .eq('user_id', userId)
      .eq('type', 'expense');

    // Filter by year and month if provided
    if (year && month) {
      // Create date range for the specified month
      const monthStartDate = new Date(year, month - 1, 1).toISOString();
      const monthEndDate = new Date(year, month, 0).toISOString();
      query = query.gte('date', monthStartDate).lte('date', monthEndDate);
    } else if (year) {
      // Create date range for the specified year
      const yearStartDate = new Date(year, 0, 1).toISOString();
      const yearEndDate = new Date(year, 11, 31).toISOString();
      query = query.gte('date', yearStartDate).lte('date', yearEndDate);
    } else {
      // Use explicit date range if provided
      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching spending by category:', error);
      throw error;
    }

    // Group by category and calculate totals
    const spendingByCategory: Record<string, number> = {};
    let totalExpenses = 0;

    data.forEach(transaction => {
      const { category_id, amount } = transaction;
      if (!spendingByCategory[category_id]) {
        spendingByCategory[category_id] = 0;
      }
      spendingByCategory[category_id] += amount;
      totalExpenses += amount;
    });

    // Convert to array and calculate percentages
    return Object.entries(spendingByCategory).map(([category_id, amount]) => ({
      category_id,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);
  },

  /**
   * Get monthly income and expense data for charts
   * @param userId User ID
   * @param year Year to get data for
   */
  async getMonthlyIncomeExpense(userId: string, year: number): Promise<{
    name: string;
    income: number;
    expense: number;
  }[]> {
    // Create date range for the specified year
    const yearStartDate = new Date(year, 0, 1).toISOString();
    const yearEndDate = new Date(year, 11, 31).toISOString();

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        date,
        type
      `)
      .eq('user_id', userId)
      .gte('date', yearStartDate)
      .lte('date', yearEndDate);

    if (error) {
      console.error('Error fetching monthly income/expense data:', error);
      throw error;
    }

    // Initialize monthly data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = monthNames.map(name => ({
      name,
      income: 0,
      expense: 0
    }));

    // Group transactions by month and type
    data.forEach(transaction => {
      const date = new Date(transaction.date);
      const month = date.getMonth();
      const amount = Math.abs(transaction.amount);

      if (transaction.type === 'income') {
        monthlyData[month].income += amount;
      } else {
        monthlyData[month].expense += amount;
      }
    });

    return monthlyData;
  }
};
