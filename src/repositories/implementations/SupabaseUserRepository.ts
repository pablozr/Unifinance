import { supabase, User } from '@/lib/supabase';
import { IUserRepository, UserPreferences } from '../interfaces/IUserRepository';

export class SupabaseUserRepository implements IUserRepository {
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  }

  async getUserPreferences(userId: string): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no preferences exist, create default ones
      if (error.code === 'PGRST116') {
        const defaultPreferences: UserPreferences = {
          theme: 'system',
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          defaultView: 'dashboard'
        };

        await this.updateUserPreferences(userId, defaultPreferences);
        return defaultPreferences;
      }

      console.error('Error fetching user preferences:', error);
      throw new Error(`Failed to fetch user preferences: ${error.message}`);
    }

    return {
      theme: data.theme || 'system',
      currency: data.currency || 'USD',
      dateFormat: data.date_format || 'MM/DD/YYYY',
      defaultView: data.default_view || 'dashboard'
    };
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    // Convert from camelCase to snake_case for database
    const dbPreferences: any = {};
    if (preferences.theme) dbPreferences.theme = preferences.theme;
    if (preferences.currency) dbPreferences.currency = preferences.currency;
    if (preferences.dateFormat) dbPreferences.date_format = preferences.dateFormat;
    if (preferences.defaultView) dbPreferences.default_view = preferences.defaultView;
    
    // Check if preferences already exist
    const { data: existingData } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    let result;
    
    if (existingData) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .update(dbPreferences)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user preferences:', error);
        throw new Error(`Failed to update user preferences: ${error.message}`);
      }

      result = data;
    } else {
      // Insert new preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({ user_id: userId, ...dbPreferences })
        .select()
        .single();

      if (error) {
        console.error('Error creating user preferences:', error);
        throw new Error(`Failed to create user preferences: ${error.message}`);
      }

      result = data;
    }

    // Convert back to camelCase for application use
    return {
      theme: result.theme || 'system',
      currency: result.currency || 'USD',
      dateFormat: result.date_format || 'MM/DD/YYYY',
      defaultView: result.default_view || 'dashboard'
    };
  }
}
