import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/setup-db - Setup database tables
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('No authenticated user found. Please sign up or log in first.');
    } else {
      console.log('Authenticated user found:', session.user.email);
    }

    // Check if users table exists
    const { data: usersTable, error: usersTableError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersTableError) {
      console.log('Users table does not exist or error accessing it:', usersTableError.message);
    } else {
      console.log('Users table exists with data:', usersTable);
    }

    // Check if categories table exists
    const { data: categoriesTable, error: categoriesTableError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    if (categoriesTableError) {
      console.log('Categories table does not exist or error accessing it:', categoriesTableError.message);
    } else {
      console.log('Categories table exists with data:', categoriesTable);
    }

    // Check if transactions table exists
    const { data: transactionsTable, error: transactionsTableError } = await supabase
      .from('transactions')
      .select('id')
      .limit(1);

    if (transactionsTableError) {
      console.log('Transactions table does not exist or error accessing it:', transactionsTableError.message);
    } else {
      console.log('Transactions table exists with data:', transactionsTable);
    }

    // Instead of creating tables directly (which requires admin privileges),
    // we'll provide instructions on how to set up the database
    return NextResponse.json({
      success: true,
      message: 'Database check completed. Please run the SQL migrations in the Supabase dashboard.',
      instructions: `
        To set up the database tables, please run the following SQL in the Supabase SQL Editor:

        -- Create users table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID REFERENCES auth.users(id) PRIMARY KEY,
          email TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Create categories table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES public.users(id) NOT NULL,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          icon TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Create transactions table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.transactions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES public.users(id) NOT NULL,
          amount DECIMAL(12, 2) NOT NULL,
          description TEXT NOT NULL,
          category_id UUID REFERENCES public.categories(id) NOT NULL,
          date TIMESTAMP WITH TIME ZONE NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Enable Row Level Security
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view their own data" ON public.users
          FOR SELECT USING (auth.uid() = id);

        CREATE POLICY "Users can view their own categories" ON public.categories
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own categories" ON public.categories
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can view their own transactions" ON public.transactions
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own transactions" ON public.transactions
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own transactions" ON public.transactions
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own transactions" ON public.transactions
          FOR DELETE USING (auth.uid() = user_id);
      `
    });
  } catch (error) {
    console.error('Error checking database:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
