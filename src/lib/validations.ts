import { z } from 'zod';

// User authentication schemas
export const signUpSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const signInSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Please enter your password' }),
});

// Transaction schema
export const transactionSchema = z.object({
  amount: z.coerce
    .number()
    .positive({ message: 'Amount must be a positive number' }),
  description: z
    .string()
    .min(1, { message: 'Description is required' })
    .max(500, { message: 'Description must be less than 500 characters' }),
  category_id: z.string().min(1, { message: 'Category is required' }),
  date: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}/, { message: 'Date must be in YYYY-MM-DD format' }),
    z.date()
  ]),
  type: z.enum(['income', 'expense']),
});

// Category schema
export const categorySchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Category name is required' })
    .max(50, { message: 'Category name must be less than 50 characters' }),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Invalid color format' }),
  icon: z.string().optional(),
});

// Budget schema
export const budgetSchema = z.object({
  category_id: z.string().min(1, { message: 'Category is required' }),
  amount: z.coerce
    .number()
    .positive({ message: 'Amount must be a positive number' }),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
});
