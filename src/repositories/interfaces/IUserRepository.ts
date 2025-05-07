import { User } from '@/lib/supabase';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  dateFormat: string;
  defaultView: string;
}

export interface IUserRepository {
  getUserById(id: string): Promise<User | null>;
  updateUser(id: string, userData: Partial<User>): Promise<User>;
  getUserPreferences(userId: string): Promise<UserPreferences>;
  updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences>;
}
