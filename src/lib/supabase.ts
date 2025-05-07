'use client';

import { createBrowserClient } from '@supabase/ssr';
import { z } from 'zod';

// Environment variables validation
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// Ensure environment variables are available
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Supabase environment variables are not set. Please check your .env file.');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client for browser with cookie support
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// Database types
export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category_id: string;
  date: string;
  type: 'income' | 'expense';
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon?: string;
  created_at: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  created_at: string;
};
