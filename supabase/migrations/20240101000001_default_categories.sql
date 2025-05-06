-- Function to create default categories for a new user
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

-- Update the handle_new_user function to create default categories
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the user
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at);
  
  -- Create default categories
  PERFORM public.create_default_categories(NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
