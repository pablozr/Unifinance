import { supabase, Category } from '@/lib/supabase';
import { ICategoryRepository } from '../interfaces/ICategoryRepository';

export class SupabaseCategoryRepository implements ICategoryRepository {
  async getCategories(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  }

  async getCategoryById(id: string, userId: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching category:', error);
      throw new Error(`Failed to fetch category: ${error.message}`);
    }

    return data;
  }

  async createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw new Error(`Failed to create category: ${error.message}`);
    }

    return data;
  }

  async updateCategory(id: string, category: Partial<Category>, userId: string): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      throw new Error(`Failed to update category: ${error.message}`);
    }

    return data;
  }

  async deleteCategory(id: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting category:', error);
      throw new Error(`Failed to delete category: ${error.message}`);
    }

    return true;
  }

  async getCategoryUsage(categoryId: string, userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error counting category usage:', error);
      throw new Error(`Failed to count category usage: ${error.message}`);
    }

    return count || 0;
  }
}
