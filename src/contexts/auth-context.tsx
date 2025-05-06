'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { userService } from '@/services/user-service';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    data: any | null;
  }>;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: any | null;
  }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get session from Supabase
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      // If signup was successful, setup the new user
      if (data?.user && !error) {
        try {
          await userService.setupNewUser(data.user.id, email);
        } catch (setupError) {
          console.error('Error setting up new user:', setupError);
          // We don't want to block the signup process if setup fails
          // The user can still sign in and we can try to setup again later
        }
      }

      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  // Generate a CSRF token
  const generateCSRFToken = () => {
    // Generate a random string for CSRF protection
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  };

  // Store CSRF token in localStorage
  const storeCSRFToken = (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('csrf_token', token);
    }
  };

  // Get CSRF token from localStorage
  const getCSRFToken = (): string => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('csrf_token') || '';
    }
    return '';
  };

  // Initialize CSRF token on mount
  useEffect(() => {
    if (!getCSRFToken()) {
      storeCSRFToken(generateCSRFToken());
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Generate and store a new CSRF token on login
      const csrfToken = generateCSRFToken();
      storeCSRFToken(csrfToken);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If login was successful, check if user is setup
      if (data?.user && !error) {
        try {
          // Check if user exists in our users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.user.id)
            .single();

          // If there's an error but it's not a "not found" error, log it
          if (userError && userError.code !== 'PGRST116') {
            console.error('Error checking for user:', userError);
          }

          // If user doesn't exist in our table, set them up
          if (!userData) {
            console.log('User not found in users table, setting up new user...');
            await userService.setupNewUser(data.user.id, email);
            console.log('User setup completed successfully');
          } else {
            console.log('User already exists in users table');
          }
        } catch (setupError) {
          console.error('Error checking/setting up user:', setupError);
          // We don't want to block the signin process if setup fails
        }
      }

      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
