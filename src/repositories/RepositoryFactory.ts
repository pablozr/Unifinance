import { 
  ITransactionRepository, 
  ICategoryRepository,
  IUserRepository
} from './interfaces';

import {
  SupabaseTransactionRepository,
  SupabaseCategoryRepository,
  SupabaseUserRepository
} from './implementations';

// Repository types for factory
export enum RepositoryType {
  TRANSACTION = 'transaction',
  CATEGORY = 'category',
  USER = 'user'
}

// Repository factory
export class RepositoryFactory {
  private static transactionRepository: ITransactionRepository;
  private static categoryRepository: ICategoryRepository;
  private static userRepository: IUserRepository;

  static getRepository<T>(type: RepositoryType): T {
    switch (type) {
      case RepositoryType.TRANSACTION:
        if (!this.transactionRepository) {
          this.transactionRepository = new SupabaseTransactionRepository();
        }
        return this.transactionRepository as unknown as T;
      
      case RepositoryType.CATEGORY:
        if (!this.categoryRepository) {
          this.categoryRepository = new SupabaseCategoryRepository();
        }
        return this.categoryRepository as unknown as T;
      
      case RepositoryType.USER:
        if (!this.userRepository) {
          this.userRepository = new SupabaseUserRepository();
        }
        return this.userRepository as unknown as T;
      
      default:
        throw new Error(`Repository type ${type} not supported`);
    }
  }
}
