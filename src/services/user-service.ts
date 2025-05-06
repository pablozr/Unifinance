import { supabase, User } from '@/lib/supabase';
import { categoryService } from './category-service';

export const userService = {
  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }

    return data;
  },

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }

    return data;
  },

  /**
   * Setup a new user (create profile, default categories, etc.)
   */
  async setupNewUser(userId: string, email: string): Promise<void> {
    try {
      // Get the current session token
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        console.error('No authentication token available');
        throw new Error('Authentication error. Please log out and log back in.');
      }

      // Call our user setup API
      const response = await fetch('/api/users/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error setting up user:', errorData);
        throw new Error('Failed to set up user account');
      }

      const result = await response.json();
      console.log('User setup result:', result);
    } catch (error) {
      console.error('Error in setupNewUser:', error);
      throw error;
    }
  }
};
