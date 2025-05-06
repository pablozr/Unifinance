import { supabase, Budget } from '@/lib/supabase';
import { z } from 'zod';

// Validation schema for budget
export const budgetSchema = z.object({
  category_id: z.string().min(1, { message: 'Category is required' }),
  amount: z.coerce.number().positive({ message: 'Amount must be a positive number' }),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly'], {
    errorMap: () => ({ message: 'Invalid period' }),
  }),
});

export type BudgetInput = z.infer<typeof budgetSchema>;

export const budgetService = {
  /**
   * Get all budgets for a user
   */
  async getBudgets(userId: string): Promise<Budget[]> {
    const { data, error } = await supabase
      .from('budgets')
      .select(`
        id,
        user_id,
        category_id,
        amount,
        period,
        created_at
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching budgets:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get a budget by ID
   */
  async getBudgetById(id: string, userId: string): Promise<Budget | null> {
    const { data, error } = await supabase
      .from('budgets')
      .select(`
        id,
        user_id,
        category_id,
        amount,
        period,
        created_at
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching budget:', error);
      throw error;
    }

    return data;
  },

  /**
   * Create a new budget
   */
  async createBudget(budget: BudgetInput, userId: string): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .insert({
        user_id: userId,
        category_id: budget.category_id,
        amount: budget.amount,
        period: budget.period,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating budget:', error);
      throw error;
    }

    return data;
  },

  /**
   * Update a budget
   */
  async updateBudget(id: string, budget: Partial<BudgetInput>, userId: string): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .update(budget)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating budget:', error);
      throw error;
    }

    return data;
  },

  /**
   * Delete a budget
   */
  async deleteBudget(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  },

  /**
   * Get budget progress (how much has been spent vs budget)
   */
  async getBudgetProgress(userId: string, startDate?: string, endDate?: string): Promise<{
    category_id: string;
    budgeted: number;
    spent: number;
    remaining: number;
    percentage: number;
  }[]> {
    // Get all budgets for the user
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select(`
        id,
        category_id,
        amount,
        period
      `)
      .eq('user_id', userId);

    if (budgetsError) {
      console.error('Error fetching budgets for progress:', budgetsError);
      throw budgetsError;
    }

    // Get all transactions for the user within the date range
    let query = supabase
      .from('transactions')
      .select(`
        amount,
        category_id,
        date
      `)
      .eq('user_id', userId)
      .eq('type', 'expense');

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data: transactions, error: transactionsError } = await query;

    if (transactionsError) {
      console.error('Error fetching transactions for budget progress:', transactionsError);
      throw transactionsError;
    }

    // Calculate spending by category
    const spendingByCategory: Record<string, number> = {};
    transactions.forEach(transaction => {
      const { category_id, amount } = transaction;
      if (!spendingByCategory[category_id]) {
        spendingByCategory[category_id] = 0;
      }
      spendingByCategory[category_id] += amount;
    });

    // Calculate budget progress
    return (budgets || []).map(budget => {
      const spent = spendingByCategory[budget.category_id] || 0;
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        category_id: budget.category_id,
        budgeted: budget.amount,
        spent,
        remaining,
        percentage,
      };
    });
  }
};
