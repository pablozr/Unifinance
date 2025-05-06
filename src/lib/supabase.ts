import { createBrowserClient } from '@supabase/ssr';
import { z } from 'zod';

// Environment variables validation
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// For development, we'll use the hardcoded values if environment variables are not available
// In production, these should be set in the environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hmouezjjjnwfpacxgjuu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtb3Vlempqam53ZnBhY3hnanV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NTkxOTEsImV4cCI6MjA2MjAzNTE5MX0.WTtlGGYci8VLwxKroczFSymb8hZQ1mYiaOsGHVleZoU';

// Create Supabase client for browser with cookie support
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

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
