'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { transactionService, categoryService } from '@/services';
import { Transaction as DBTransaction, Category as DBCategory } from '@/lib/supabase';
import { CategoryPieChart } from '@/components/dashboard/category-pie-chart';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReportsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<DBTransaction[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  
  // Chart data states
  const [monthlyData, setMonthlyData] = useState<{name: string; income: number; expense: number}[]>([]);
  const [categoryData, setCategoryData] = useState<{name: string; value: number; color: string}[]>([]);
  const [yearlyData, setYearlyData] = useState<{name: string; income: number; expense: number}[]>([]);
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedTab, setSelectedTab] = useState('monthly');
  
  // Load user data
  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load categories
      const userCategories = await categoryService.getUserCategories(user.id);
      setCategories(userCategories);
      
      // Load all transactions for the selected year
      const { data: transactionsData } = await transactionService.getUserTransactions(
        user.id, 
        { year: selectedYear, limit: 1000 }
      );
      
      setTransactions(transactionsData);
      
      // Process data for charts
      processChartData(transactionsData, userCategories);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Process data for charts
  const processChartData = (transactions: DBTransaction[], categories: DBCategory[]) => {
    // Process monthly data
    const monthlyDataMap = new Map<string, { income: number; expense: number }>();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months with zero values
    months.forEach((month, index) => {
      monthlyDataMap.set(month, { income: 0, expense: 0 });
    });
    
    // Process yearly data
    const yearlyDataMap = new Map<string, { income: number; expense: number }>();
    const currentYear = new Date().getFullYear();
    
    // Initialize last 5 years with zero values
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      yearlyDataMap.set(year.toString(), { income: 0, expense: 0 });
    }
    
    // Process category data for the selected month
    const categoryDataMap = new Map<string, { value: number; color: string }>();
    
    // Initialize all categories with zero values
    categories.forEach(category => {
      categoryDataMap.set(category.name, { value: 0, color: category.color });
    });
    
    // Process transactions
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const month = months[date.getMonth()];
      const year = date.getFullYear().toString();
      const category = categories.find(c => c.id === transaction.category_id);
      
      // Update monthly data
      if (monthlyDataMap.has(month)) {
        const monthData = monthlyDataMap.get(month)!;
        if (transaction.type === 'income') {
          monthData.income += transaction.amount;
        } else {
          monthData.expense += transaction.amount;
        }
        monthlyDataMap.set(month, monthData);
      }
      
      // Update yearly data
      if (yearlyDataMap.has(year)) {
        const yearData = yearlyDataMap.get(year)!;
        if (transaction.type === 'income') {
          yearData.income += transaction.amount;
        } else {
          yearData.expense += transaction.amount;
        }
        yearlyDataMap.set(year, yearData);
      }
      
      // Update category data for the selected month
      if (date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear) {
        if (category && transaction.type === 'expense') {
          const categoryData = categoryDataMap.get(category.name) || { value: 0, color: category.color };
          categoryData.value += transaction.amount;
          categoryDataMap.set(category.name, categoryData);
        }
      }
    });
    
    // Convert maps to arrays for charts
    const monthlyDataArray = Array.from(monthlyDataMap.entries()).map(([name, data]) => ({
      name,
      income: data.income,
      expense: data.expense
    }));
    
    const yearlyDataArray = Array.from(yearlyDataMap.entries())
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([name, data]) => ({
        name,
        income: data.income,
        expense: data.expense
      }));
    
    const categoryDataArray = Array.from(categoryDataMap.entries())
      .filter(([_, data]) => data.value > 0)
      .map(([name, data]) => ({
        name,
        value: data.value,
        color: data.color
      }))
      .sort((a, b) => b.value - a.value);
    
    setMonthlyData(monthlyDataArray);
    setYearlyData(yearlyDataArray);
    setCategoryData(categoryDataArray);
  };
  
  // Load data when user or filters change
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, selectedYear, selectedMonth]);
  
  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  // Generate month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Financial Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyze your financial data with detailed reports and charts
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[120px] border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-[140px] border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
              {monthOptions.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <TabsTrigger value="monthly" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100">
            Monthly Analysis
          </TabsTrigger>
          <TabsTrigger value="yearly" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100">
            Yearly Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly" className="mt-4 space-y-6">
          {/* Income vs Expenses Chart */}
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800 dark:text-gray-200">Monthly Income vs Expenses</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Compare your monthly income and expenses for {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                </div>
              ) : (
                <IncomeExpenseChart data={monthlyData} />
              )}
            </CardContent>
          </Card>
          
          {/* Expense Categories Chart */}
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800 dark:text-gray-200">Expense Categories</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Breakdown of expenses by category for {monthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                </div>
              ) : categoryData.length > 0 ? (
                <CategoryPieChart data={categoryData} />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
                  No expense data available for this period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="yearly" className="mt-4 space-y-6">
          {/* Yearly Income vs Expenses Chart */}
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800 dark:text-gray-200">Yearly Income vs Expenses</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Compare your yearly income and expenses for the past 5 years
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                </div>
              ) : (
                <IncomeExpenseChart data={yearlyData} />
              )}
            </CardContent>
          </Card>
          
          {/* Annual Summary */}
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800 dark:text-gray-200">Annual Summary</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Financial summary for {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Income</div>
                    <div className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                      ${yearlyData.find(d => d.name === selectedYear.toString())?.income.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</div>
                    <div className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                      ${yearlyData.find(d => d.name === selectedYear.toString())?.expense.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Savings</div>
                    <div className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ${(
                        (yearlyData.find(d => d.name === selectedYear.toString())?.income || 0) -
                        (yearlyData.find(d => d.name === selectedYear.toString())?.expense || 0)
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
