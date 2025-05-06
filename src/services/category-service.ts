import { supabase, Category } from '@/lib/supabase';
import { z } from 'zod';

// Validation schema for category
export const categorySchema = z.object({
  name: z.string().min(1, { message: 'Category name is required' }).max(50),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Invalid color format' }),
  icon: z.string().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

// Default categories for new users
export const DEFAULT_CATEGORIES = [
  // Income categories
  { name: 'Salary', color: '#4CAF50', icon: 'briefcase' },
  { name: 'Freelance', color: '#8BC34A', icon: 'code' },
  { name: 'Investments', color: '#009688', icon: 'trending-up' },
  { name: 'Gifts', color: '#E91E63', icon: 'gift' },
  { name: 'Other Income', color: '#9C27B0', icon: 'plus-circle' },

  // Expense categories
  { name: 'Housing', color: '#F44336', icon: 'home' },
  { name: 'Food', color: '#FF9800', icon: 'shopping-cart' },
  { name: 'Transportation', color: '#795548', icon: 'car' },
  { name: 'Utilities', color: '#607D8B', icon: 'zap' },
  { name: 'Healthcare', color: '#00BCD4', icon: 'activity' },
  { name: 'Entertainment', color: '#673AB7', icon: 'film' },
  { name: 'Shopping', color: '#3F51B5', icon: 'shopping-bag' },
  { name: 'Education', color: '#2196F3', icon: 'book' },
  { name: 'Personal Care', color: '#FF5722', icon: 'user' },
  { name: 'Debt', color: '#F44336', icon: 'credit-card' },
  { name: 'Savings', color: '#4CAF50', icon: 'save' },
  { name: 'Other Expenses', color: '#9E9E9E', icon: 'more-horizontal' },
];

export const categoryService = {
  /**
   * Get all categories for a user
   */
  async getCategories(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get a category by ID
   */
  async getCategoryById(id: string, userId: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching category:', error);
      throw error;
    }

    return data;
  },

  /**
   * Create a new category
   */
  async createCategory(category: CategoryInput, userId: string): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: category.name,
        color: category.color,
        icon: category.icon,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw error;
    }

    return data;
  },

  /**
   * Update a category
   */
  async updateCategory(id: string, category: Partial<CategoryInput>, userId: string): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      throw error;
    }

    return data;
  },

  /**
   * Delete a category
   */
  async deleteCategory(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  /**
   * Create default categories for a new user
   */
  async createDefaultCategories(userId: string, userEmail?: string): Promise<void> {
    try {
      console.log(`Creating default categories for user ${userId}`);

      // Get the current session token
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        console.error('No authentication token available');
        throw new Error('Authentication error. Please log out and log back in.');
      }

      // Call our user setup API which will also create default categories
      const response = await fetch('/api/users/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error setting up user and categories:', errorData);
        throw new Error('Failed to create default categories');
      }

      const result = await response.json();
      console.log('User and categories setup result:', result);
    } catch (error) {
      console.error('Error in createDefaultCategories:', error);
      throw error;
    }
  },

  /**
   * Get categories by type (income or expense)
   */
  async getCategoriesByType(userId: string, type: 'income' | 'expense'): Promise<Category[]> {
    // In our implementation, we'll determine category type by name
    // This is a simplification - in a real app, you might want to add a 'type' field to the categories table
    const incomeCategories = ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'];

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching categories by type:', error);
      throw error;
    }

    if (type === 'income') {
      return (data || []).filter(category => incomeCategories.includes(category.name));
    } else {
      return (data || []).filter(category => !incomeCategories.includes(category.name));
    }
  }
};
