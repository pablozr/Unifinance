import { Category } from '@/lib/supabase';
import { 
  ICategoryRepository, 
  RepositoryFactory, 
  RepositoryType 
} from '@/repositories';

export class CategoryService {
  private categoryRepository: ICategoryRepository;

  constructor() {
    this.categoryRepository = RepositoryFactory.getRepository(RepositoryType.CATEGORY);
  }

  async getCategories(userId: string): Promise<Category[]> {
    return this.categoryRepository.getCategories(userId);
  }

  async getCategoryById(id: string, userId: string): Promise<Category | null> {
    return this.categoryRepository.getCategoryById(id, userId);
  }

  async createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    return this.categoryRepository.createCategory(category);
  }

  async updateCategory(id: string, category: Partial<Category>, userId: string): Promise<Category> {
    return this.categoryRepository.updateCategory(id, category, userId);
  }

  async deleteCategory(id: string, userId: string): Promise<boolean> {
    // Check if category is in use
    const usageCount = await this.categoryRepository.getCategoryUsage(id, userId);
    
    if (usageCount > 0) {
      throw new Error(`Cannot delete category that is used by ${usageCount} transactions`);
    }
    
    return this.categoryRepository.deleteCategory(id, userId);
  }

  async getCategoryUsage(categoryId: string, userId: string): Promise<number> {
    return this.categoryRepository.getCategoryUsage(categoryId, userId);
  }
}
