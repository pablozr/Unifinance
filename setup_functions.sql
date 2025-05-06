-- Run this script in the Supabase SQL Editor to create the necessary functions

-- Function to create a user (bypassing RLS)
CREATE OR REPLACE FUNCTION public.create_user(user_id UUID, user_email TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (user_id, user_email, NOW())
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default categories for a user
CREATE OR REPLACE FUNCTION public.create_default_categories(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Income categories
  INSERT INTO public.categories (user_id, name, color, icon)
  VALUES
    (user_id, 'Salary', '#4CAF50', 'briefcase'),
    (user_id, 'Freelance', '#8BC34A', 'code'),
    (user_id, 'Investments', '#009688', 'trending-up'),
    (user_id, 'Gifts', '#E91E63', 'gift'),
    (user_id, 'Other Income', '#9C27B0', 'plus-circle');
  
  -- Expense categories
  INSERT INTO public.categories (user_id, name, color, icon)
  VALUES
    (user_id, 'Housing', '#F44336', 'home'),
    (user_id, 'Food', '#FF9800', 'shopping-cart'),
    (user_id, 'Transportation', '#795548', 'car'),
    (user_id, 'Utilities', '#607D8B', 'zap'),
    (user_id, 'Healthcare', '#00BCD4', 'activity'),
    (user_id, 'Entertainment', '#673AB7', 'film'),
    (user_id, 'Shopping', '#3F51B5', 'shopping-bag'),
    (user_id, 'Education', '#2196F3', 'book'),
    (user_id, 'Personal Care', '#FF5722', 'user'),
    (user_id, 'Debt', '#F44336', 'credit-card'),
    (user_id, 'Savings', '#4CAF50', 'save'),
    (user_id, 'Other Expenses', '#9E9E9E', 'more-horizontal');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.create_user TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_default_categories TO anon, authenticated, service_role;
