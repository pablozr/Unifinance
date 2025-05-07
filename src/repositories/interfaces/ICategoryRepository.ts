import { Category } from '@/lib/supabase';

export interface ICategoryRepository {
  getCategories(userId: string): Promise<Category[]>;
  getCategoryById(id: string, userId: string): Promise<Category | null>;
  createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category>;
  updateCategory(id: string, category: Partial<Category>, userId: string): Promise<Category>;
  deleteCategory(id: string, userId: string): Promise<boolean>;
  
  // Additional methods
  getCategoryUsage(categoryId: string, userId: string): Promise<number>;
}
