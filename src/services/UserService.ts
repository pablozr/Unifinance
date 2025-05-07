import { User } from '@/lib/supabase';
import { 
  IUserRepository, 
  UserPreferences,
  RepositoryFactory, 
  RepositoryType 
} from '@/repositories';

export class UserService {
  private userRepository: IUserRepository;

  constructor() {
    this.userRepository = RepositoryFactory.getRepository(RepositoryType.USER);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.getUserById(id);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    return this.userRepository.updateUser(id, userData);
  }

  async getUserPreferences(userId: string): Promise<UserPreferences> {
    return this.userRepository.getUserPreferences(userId);
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    return this.userRepository.updateUserPreferences(userId, preferences);
  }
}
