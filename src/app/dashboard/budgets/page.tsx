'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { transactionService, categoryService } from '@/services';
import { Transaction as DBTransaction, Category as DBCategory, supabase } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

// Budget interface
interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: 'monthly' | 'yearly';
  created_at: string;
  updated_at: string;
}

export default function BudgetsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [budgets, setBudgets] = useState<(Budget & { category_name: string; category_color: string; spent: number; percentage: number })[]>([]);
  const [transactions, setTransactions] = useState<DBTransaction[]>([]);
  
  // New budget state
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category_id: '',
    amount: '',
    period: 'monthly' as 'monthly' | 'yearly',
  });
  
  // Load user data
  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load categories
      const userCategories = await categoryService.getUserCategories(user.id);
      setCategories(userCategories);
      
      // Load budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);
      
      if (budgetsError) {
        throw budgetsError;
      }
      
      // Load transactions for the current month
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      const { data: transactionsData } = await transactionService.getUserTransactions(
        user.id, 
        { 
          year: currentYear, 
          month: currentMonth,
          type: 'expense'
        }
      );
      
      setTransactions(transactionsData);
      
      // Calculate spent amount for each budget
      const enhancedBudgets = (budgetsData || []).map(budget => {
        const category = userCategories.find(c => c.id === budget.category_id);
        const categoryTransactions = transactionsData.filter(t => t.category_id === budget.category_id);
        const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
        const percentage = Math.min(100, Math.round((spent / budget.amount) * 100));
        
        return {
          ...budget,
          category_name: category?.name || 'Unknown Category',
          category_color: category?.color || '#888888',
          spent,
          percentage
        };
      });
      
      setBudgets(enhancedBudgets);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);
  
  // Handle adding a new budget
  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      // Validate the form
      if (!newBudget.category_id || !newBudget.amount) {
        toast.error('Please fill in all fields');
        return;
      }
      
      // Convert amount to number
      const amount = parseFloat(newBudget.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
      
      // Check if budget already exists for this category
      const existingBudget = budgets.find(b => b.category_id === newBudget.category_id);
      
      if (existingBudget) {
        // Update existing budget
        const { data, error } = await supabase
          .from('budgets')
          .update({
            amount,
            period: newBudget.period,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBudget.id)
          .select();
        
        if (error) {
          throw error;
        }
        
        toast.success('Budget updated successfully');
      } else {
        // Create new budget
        const { data, error } = await supabase
          .from('budgets')
          .insert([
            {
              user_id: user.id,
              category_id: newBudget.category_id,
              amount,
              period: newBudget.period,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
          .select();
        
        if (error) {
          throw error;
        }
        
        toast.success('Budget added successfully');
      }
      
      // Close the modal and reset the form
      setIsAddingBudget(false);
      setNewBudget({
        category_id: '',
        amount: '',
        period: 'monthly',
      });
      
      // Reload the data
      loadUserData();
      
    } catch (error) {
      console.error('Error adding budget:', error);
      toast.error('Failed to add budget');
    }
  };
  
  // Handle deleting a budget
  const handleDeleteBudget = async (budgetId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);
      
      if (error) {
        throw error;
      }
      
      toast.success('Budget deleted successfully');
      
      // Reload the data
      loadUserData();
      
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Add Budget Dialog */}
      <Dialog open={isAddingBudget} onOpenChange={setIsAddingBudget}>
        <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Add Budget</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Set a budget for a specific category to track your spending
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddBudget}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="category" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <Select
                  value={newBudget.category_id}
                  onValueChange={(value) => setNewBudget({ ...newBudget, category_id: value })}
                >
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                    {categories
                      .filter(c => {
                        // Filter out income categories
                        const incomeCategories = ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'];
                        return !incomeCategories.includes(c.name);
                      })
                      .map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Budget Amount
                </label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                  className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="period" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Period
                </label>
                <Select
                  value={newBudget.period}
                  onValueChange={(value: 'monthly' | 'yearly') => setNewBudget({ ...newBudget, period: value })}
                >
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                    <SelectValue placeholder="Select a period" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddingBudget(false)}
                className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white border-0 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Save Budget
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Budgets</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Set and track your spending limits for different categories
          </p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white border-0 dark:bg-blue-500 dark:hover:bg-blue-600"
          onClick={() => setIsAddingBudget(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-4 w-4"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Add Budget
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : budgets.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <Card key={budget.id} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: budget.category_color }}
                    />
                    <CardTitle className="text-lg text-gray-800 dark:text-gray-200">{budget.category_name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    onClick={() => handleDeleteBudget(budget.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  {budget.period === 'monthly' ? 'Monthly' : 'Yearly'} Budget
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Spent: ${budget.spent.toFixed(2)}
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Budget: ${budget.amount.toFixed(2)}
                    </div>
                  </div>
                  <Progress 
                    value={budget.percentage} 
                    className="h-2 bg-gray-200 dark:bg-gray-700"
                    indicatorClassName={
                      budget.percentage >= 100
                        ? "bg-red-600 dark:bg-red-500"
                        : budget.percentage >= 75
                        ? "bg-yellow-600 dark:bg-yellow-500"
                        : "bg-green-600 dark:bg-green-500"
                    }
                  />
                  <div className="text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                    {budget.percentage}% used
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-blue-600 dark:text-blue-400"
              >
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Budgets Set</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
              You haven't set any budgets yet. Create a budget to track your spending and stay on top of your finances.
            </p>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white border-0 dark:bg-blue-500 dark:hover:bg-blue-600"
              onClick={() => setIsAddingBudget(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Create Your First Budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
