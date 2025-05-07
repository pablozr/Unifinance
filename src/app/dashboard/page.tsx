'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { transactionService, categoryService } from '@/services';
import { Transaction as DBTransaction, Category as DBCategory, supabase } from '@/lib/supabase';
import { CategoryPieChart } from '@/components/dashboard/category-pie-chart';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { useTransactionModal } from '@/contexts/transaction-modal-context';
import { EnhancedCharts } from '@/components/dashboard/enhanced-charts';
import { SpendingPatternsCard } from '@/components/dashboard/spending-patterns-card';
import { FinancialHealthCard } from '@/components/dashboard/financial-health-card';
import { calculateFinancialHealth, identifyRecurringExpenses, identifyUnusualSpending } from '@/lib/financial-analysis';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/contexts/language-context';

// Tipos para as transações na UI
type TransactionType = 'income' | 'expense';
type Transaction = {
  id: string;
  amount: number;
  description: string;
  category: string;
  categoryId: string;
  categoryColor: string;
  date: Date;
  type: TransactionType;
};

// Categorias de exemplo
const EXPENSE_CATEGORIES = [
  'Groceries', 'Rent', 'Utilities', 'Transportation',
  'Entertainment', 'Dining Out', 'Shopping', 'Healthcare',
  'Education', 'Travel', 'Subscriptions', 'Other'
];

const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investments', 'Gifts',
  'Refunds', 'Side Hustle', 'Other'
];

const CopilotChatbot = dynamic(() => import('@/components/dashboard/copilotChatbot'), { ssr: false })

export default function DashboardPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    savingsRate: 0,
  });
  const { t, language } = useLanguage();

  // Date filter states
  const currentDate = new Date();

  // Get year and month from URL query parameters or use current date
  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');

  const [selectedYear, setSelectedYear] = useState<number>(
    yearParam ? parseInt(yearParam) : currentDate.getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    monthParam ? parseInt(monthParam) : currentDate.getMonth() + 1
  );

  // Chart data states
  const [monthlyData, setMonthlyData] = useState<{name: string; income: number; expense: number}[]>([]);
  const [categoryData, setCategoryData] = useState<{name: string; value: number; color: string}[]>([]);

  // Financial analysis states
  const [financialHealth, setFinancialHealth] = useState({
    score: 0,
    savingsRate: 0,
    budgetAdherence: 100,
    expenseToIncomeRatio: 0,
    recommendations: ['Loading financial health data...']
  });
  const [spendingPatterns, setSpendingPatterns] = useState({
    recurring: [],
    unusual: []
  });

  // Use the transaction modal context
  const {
    isAddingTransaction,
    setIsAddingTransaction,
    newTransaction,
    setNewTransaction,
    openAddTransactionModal
  } = useTransactionModal();

  // State for clear transactions confirmation dialog
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();

  // Function to load user data
  const loadUserData = async () => {
    if (!user) return;

    console.log(`Loading dashboard data for ${selectedYear}/${selectedMonth}...`);
    setIsLoading(true);
    try {
      // Load categories
      console.log('Fetching categories...');
      const categoriesData = await categoryService.getCategories(user.id);
      setCategories(categoriesData);
      console.log(`Loaded ${categoriesData.length} categories`);

      // Load transactions for the selected month/year
      console.log(`Fetching transactions for ${selectedYear}/${selectedMonth}...`);
      const transactionsData = await transactionService.getAllTransactions(
        user.id,
        selectedYear,
        selectedMonth
      );
      console.log(`Loaded ${transactionsData.length} transactions for ${selectedYear}/${selectedMonth}`);

      // Map transactions from database to UI format
      const mappedTransactions: Transaction[] = transactionsData.map(t => {
        const category = categoriesData.find(c => c.id === t.category_id) || { name: 'Uncategorized', color: '#9E9E9E' };
        return {
          id: t.id,
          amount: t.amount,
          description: t.description,
          category: category.name,
          categoryId: t.category_id,
          categoryColor: category.color,
          date: new Date(t.date),
          type: t.type,
        };
      });

      setTransactions(mappedTransactions);

      // Load summary for the selected month/year
      console.log(`Calculating transaction summary for ${selectedYear}/${selectedMonth}...`);
      const summaryData = await transactionService.getTransactionsSummary(
        user.id,
        selectedYear,
        selectedMonth
      );
      setSummary(summaryData);

      // Load monthly income/expense data for charts
      console.log('Loading monthly income/expense data for charts...');
      const monthlyChartData = await transactionService.getMonthlyIncomeExpense(
        user.id,
        selectedYear
      );
      setMonthlyData(monthlyChartData);

      // Prepare category data for pie chart
      console.log('Preparing category data for pie chart...');
      const spendingByCategory = await transactionService.getSpendingByCategory(
        user.id,
        selectedYear,
        selectedMonth
      );

      // Map category IDs to names and colors
      const categoryChartData = spendingByCategory.map(item => {
        const category = categoriesData.find(c => c.id === item.category_id) ||
          { name: 'Uncategorized', color: '#9E9E9E' };

        return {
          name: category.name,
          value: item.amount,
          color: category.color
        };
      });

      setCategoryData(categoryChartData);

      // Calculate financial health metrics
      console.log('Calculating financial health metrics...');
      const healthMetrics = calculateFinancialHealth(transactionsData);
      setFinancialHealth(healthMetrics);

      // Identify spending patterns
      console.log('Analyzing spending patterns...');
      const recurringExpenses = identifyRecurringExpenses(transactionsData);
      const unusualSpending = identifyUnusualSpending(transactionsData);

      setSpendingPatterns({
        recurring: recurringExpenses,
        unusual: unusualSpending
      });

      console.log('Dashboard data loaded successfully');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error(language === 'pt' ? 'Falha ao carregar dados do painel' : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when user, year, or month changes
  useEffect(() => {
    loadUserData();
  }, [user, selectedYear, selectedMonth]);

  // Add a refresh function that can be called manually
  useEffect(() => {
    // Create a function to handle route change complete
    const handleRouteChangeComplete = (url: string) => {
      if (url === '/dashboard' && user) {
        console.log('Route changed to dashboard, refreshing data...');
        loadUserData();
      }
    };

    // Add event listener for route change
    window.addEventListener('focus', () => {
      if (document.location.pathname === '/dashboard' && user) {
        console.log('Window focused on dashboard, refreshing data...');
        loadUserData();
      }
    });

    return () => {
      // Clean up event listener
      window.removeEventListener('focus', () => {});
    };
  }, [user]);

  // Valores derivados do estado
  const { totalIncome, totalExpenses, balance, savingsRate } = summary;

  // Manipuladores de eventos
  // Function to clear all transactions
  const handleClearTransactions = async () => {
    if (!user) {
      toast.error(language === 'pt' ? 'Você precisa estar logado para limpar transações' : 'You must be logged in to clear transactions');
      return;
    }

    setIsClearing(true);

    try {
      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error(language === 'pt' ? 'Erro de autenticação. Por favor, faça login novamente.' : 'Authentication error. Please log in again.');
        return;
      }

      // Get CSRF token from localStorage safely (handling SSR case)
      let csrfToken = '';
      if (typeof window !== 'undefined') {
        csrfToken = localStorage.getItem('csrf_token') || '';

        // If no CSRF token exists, generate one
        if (!csrfToken) {
          csrfToken = Math.random().toString(36).substring(2, 15) +
                     Math.random().toString(36).substring(2, 15);
          localStorage.setItem('csrf_token', csrfToken);
        }
      }

      // Call the API to clear all transactions
      const response = await fetch('/api/transactions/clear', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-CSRF-Token': csrfToken
        },
        // Include credentials to ensure cookies are sent
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to clear transactions');
      }

      // Close the dialog
      setIsClearDialogOpen(false);

      // Reload the data
      loadUserData();

      // Show success message
      toast.success(language === 'pt'
        ? `${result.count} transações removidas com sucesso`
        : `Successfully cleared ${result.count} transactions`);

    } catch (error) {
      console.error('Error clearing transactions:', error);
      toast.error(language === 'pt' ? 'Falha ao remover transações' : 'Failed to clear transactions');
    } finally {
      setIsClearing(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!user) {
      toast.error(language === 'pt' ? 'Você precisa estar logado para adicionar transações' : 'You must be logged in to add transactions');
      return;
    }

    if (!newTransaction.amount || !newTransaction.description || !newTransaction.category_id) {
      toast.error(language === 'pt' ? 'Por favor, preencha todos os campos' : 'Please fill in all fields');
      return;
    }

    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(language === 'pt' ? 'Por favor, insira um valor válido' : 'Please enter a valid amount');
      return;
    }

    try {
      // Salvar transação no banco de dados
      const savedTransaction = await transactionService.createTransaction({
        amount,
        description: newTransaction.description,
        category_id: newTransaction.category_id,
        date: new Date(),
        type: newTransaction.type,
      }, user.id);

      // Encontrar a categoria
      const category = categories.find(c => c.id === savedTransaction.category_id) ||
        { name: 'Uncategorized', color: '#9E9E9E' };

      // Adicionar a nova transação à lista
      const newTransactionForUI: Transaction = {
        id: savedTransaction.id,
        amount: savedTransaction.amount,
        description: savedTransaction.description,
        category: category.name,
        categoryId: savedTransaction.category_id,
        categoryColor: category.color,
        date: new Date(savedTransaction.date),
        type: savedTransaction.type,
      };

      setTransactions([newTransactionForUI, ...transactions]);

      // Atualizar o resumo
      const newSummary = {
        totalIncome: newTransaction.type === 'income' ? summary.totalIncome + amount : summary.totalIncome,
        totalExpenses: newTransaction.type === 'expense' ? summary.totalExpenses + amount : summary.totalExpenses,
        balance: 0,
        savingsRate: 0,
      };

      newSummary.balance = newSummary.totalIncome - newSummary.totalExpenses;
      newSummary.savingsRate = newSummary.totalIncome > 0
        ? (newSummary.balance / newSummary.totalIncome) * 100
        : 0;

      setSummary(newSummary);

      // Resetar o formulário
      setNewTransaction({
        amount: '',
        description: '',
        category_id: '',
        type: 'expense',
      });

      setIsAddingTransaction(false);
      toast.success(newTransaction.type === 'income'
        ? (language === 'pt' ? 'Receita adicionada com sucesso' : 'Income added successfully')
        : (language === 'pt' ? 'Despesa adicionada com sucesso' : 'Expense added successfully'));
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error(language === 'pt' ? 'Falha ao adicionar transação' : 'Failed to add transaction');
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Dialog for Clear Transactions Confirmation */}
        <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
          <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">
                {language === 'pt' ? 'Limpar Todas as Transações' : 'Clear All Transactions'}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                {language === 'pt'
                  ? 'Isso excluirá permanentemente todas as suas transações. Esta ação não pode ser desfeita.'
                  : 'This will permanently delete all your transactions. This action cannot be undone.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setIsClearDialogOpen(false)}
                className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleClearTransactions}
                className="bg-red-600 hover:bg-red-700 text-white border-0 dark:bg-red-700 dark:hover:bg-red-800"
                disabled={isClearing}
              >
                {isClearing
                  ? (language === 'pt' ? 'Limpando...' : 'Clearing...')
                  : (language === 'pt' ? 'Sim, Limpar Tudo' : 'Yes, Clear All')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">{t('common.dashboard')}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {new Date(selectedYear, selectedMonth - 1).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { month: 'long', year: 'numeric' })} • {t('dashboard.welcome').replace('{{name}}', user?.email?.split('@')[0] || 'User')}
            </p>
          </div>

          {/* Month/Year Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 shadow-sm">
            <select
              value={selectedMonth}
              onChange={(e) => {
                const newMonth = parseInt(e.target.value);
                setSelectedMonth(newMonth);

                // Update URL with new month
                const url = new URL(window.location.href);
                url.searchParams.set('month', newMonth.toString());
                url.searchParams.set('year', selectedYear.toString());
                window.history.pushState({}, '', url);
              }}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-800 dark:text-gray-300 text-sm p-1"
            >
              <option value="1">{language === 'pt' ? 'Janeiro' : 'January'}</option>
              <option value="2">{language === 'pt' ? 'Fevereiro' : 'February'}</option>
              <option value="3">{language === 'pt' ? 'Março' : 'March'}</option>
              <option value="4">{language === 'pt' ? 'Abril' : 'April'}</option>
              <option value="5">{language === 'pt' ? 'Maio' : 'May'}</option>
              <option value="6">{language === 'pt' ? 'Junho' : 'June'}</option>
              <option value="7">{language === 'pt' ? 'Julho' : 'July'}</option>
              <option value="8">{language === 'pt' ? 'Agosto' : 'August'}</option>
              <option value="9">{language === 'pt' ? 'Setembro' : 'September'}</option>
              <option value="10">{language === 'pt' ? 'Outubro' : 'October'}</option>
              <option value="11">{language === 'pt' ? 'Novembro' : 'November'}</option>
              <option value="12">{language === 'pt' ? 'Dezembro' : 'December'}</option>
            </select>

            <select
              value={selectedYear}
              onChange={(e) => {
                const newYear = parseInt(e.target.value);
                setSelectedYear(newYear);

                // Update URL with new year
                const url = new URL(window.location.href);
                url.searchParams.set('year', newYear.toString());
                url.searchParams.set('month', selectedMonth.toString());
                window.history.pushState({}, '', url);
              }}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-800 dark:text-gray-300 text-sm p-1"
            >
              {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <Dialog open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all">
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
                {t('dashboard.addTransaction')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white backdrop-blur-md border border-gray-200 text-gray-800 shadow-lg">
              <DialogHeader>
                <DialogTitle className="text-gray-900">{t('transactions.addTransaction')}</DialogTitle>
                <DialogDescription className="text-gray-500">
                  {language === 'pt' ? 'Insira os detalhes da sua transação abaixo.' : 'Enter the details of your transaction below.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={newTransaction.type === 'expense' ? 'default' : 'outline'}
                    className={newTransaction.type === 'expense' ? 'bg-blue-600 text-white border-0' : 'border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800'}
                    onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                  >
                    {t('transactions.expense')}
                  </Button>
                  <Button
                    type="button"
                    variant={newTransaction.type === 'income' ? 'default' : 'outline'}
                    className={newTransaction.type === 'income' ? 'bg-blue-600 text-white border-0' : 'border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800'}
                    onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                  >
                    {t('transactions.income')}
                  </Button>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="amount" className="text-sm font-medium text-gray-700">
                    {t('transactions.amount')}
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    className="border-gray-300 bg-white text-gray-800 placeholder:text-gray-400 focus-visible:ring-gray-400"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="description" className="text-sm font-medium text-gray-700">
                    {t('transactions.description')}
                  </label>
                  <Input
                    id="description"
                    placeholder={language === 'pt' ? "Para que foi isso?" : "What was this for?"}
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    className="border-gray-300 bg-white text-gray-800 placeholder:text-gray-400 focus-visible:ring-gray-400"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="category" className="text-sm font-medium text-gray-700">
                    {t('transactions.category')}
                  </label>
                  <select
                    id="category"
                    value={newTransaction.category_id}
                    onChange={(e) => setNewTransaction({ ...newTransaction, category_id: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white text-gray-800 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">{language === 'pt' ? 'Selecione uma categoria' : 'Select a category'}</option>
                    {isLoading ? (
                      <option value="" disabled>{language === 'pt' ? 'Carregando categorias...' : 'Loading categories...'}</option>
                    ) : (
                      categories
                        .filter(category => {
                          // Filtrar categorias por tipo (income/expense)
                          const incomeCategories = ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'];
                          if (newTransaction.type === 'income') {
                            return incomeCategories.includes(category.name);
                          } else {
                            return !incomeCategories.includes(category.name);
                          }
                        })
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {t(`categories.${category.name}`) || category.name}
                          </option>
                        ))
                    )}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddingTransaction(false)} className="border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800">
                  {t('common.cancel')}
                </Button>
                <Button type="button" onClick={handleAddTransaction} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                  {t('dashboard.addTransaction')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-600 dark:text-gray-400">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">{t('dashboard.overview')}</TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">{t('common.transactions')}</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">{t('reports.analytics')}</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-gray-100 dark:border-gray-700">
                  <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('dashboard.balance')}</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-black dark:text-white"
                    >
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">${balance.toFixed(2)}</div>
                  <div className="mt-1 flex items-center text-xs">
                    <span className={balance >= 0 ? "text-gray-600 dark:text-gray-400" : "text-gray-600 dark:text-gray-400"}>
                      {balance >= 0
                        ? (language === 'pt' ? "Saldo positivo" : "Positive balance")
                        : (language === 'pt' ? "Saldo negativo" : "Negative balance")}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-gray-100 dark:border-gray-700">
                  <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('dashboard.income')}</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-800/30 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="green"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 dark:stroke-green-400"
                    >
                      <path d="m17 7-10 10" />
                      <path d="M7 7h10v10" />
                    </svg>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">${totalIncome.toFixed(2)}</div>
                  <div className="mt-1 flex items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      {transactions.filter(t => t.type === 'income').length} {language === 'pt' ? 'transações de receita' : 'income transactions'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-gray-100 dark:border-gray-700">
                  <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('dashboard.expenses')}</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-800/30 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="red"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 dark:stroke-red-400"
                    >
                      <path d="m7 7 10 10" />
                      <path d="M17 7v10H7" />
                    </svg>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">${totalExpenses.toFixed(2)}</div>
                  <div className="mt-1 flex items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      {transactions.filter(t => t.type === 'expense').length} {language === 'pt' ? 'transações de despesa' : 'expense transactions'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-gray-100 dark:border-gray-700">
                  <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('dashboard.savingsRate')}</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="blue"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{savingsRate.toFixed(1)}%</div>
                  <div className="mt-1 flex items-center text-xs">
                    <span className={savingsRate >= 20 ? "text-gray-800 dark:text-gray-300" : "text-gray-600 dark:text-gray-400"}>
                      {savingsRate >= 20
                        ? (language === 'pt' ? "Boa taxa de economia" : "Good savings rate")
                        : (language === 'pt' ? "Tente economizar mais" : "Try to save more")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-800 dark:text-gray-200">{t('dashboard.recentTransactions')}</CardTitle>
                      <CardDescription className="text-gray-500 dark:text-gray-400">
                        {language === 'pt' ? 'Suas atividades financeiras mais recentes' : 'Your most recent financial activities'}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200">
                      {t('dashboard.viewAll')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              transaction.type === 'income' ? 'bg-green-100 dark:bg-green-800/30' : 'bg-red-100 dark:bg-red-800/30'
                            }`}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={transaction.type === 'income' ? 'green' : 'red'}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`h-5 w-5 ${transaction.type === 'income' ? 'dark:stroke-green-400' : 'dark:stroke-red-400'}`}
                              >
                                {transaction.type === 'income' ? (
                                  <>
                                    <path d="m17 7-10 10" />
                                    <path d="M7 7h10v10" />
                                  </>
                                ) : (
                                  <>
                                    <path d="m7 7 10 10" />
                                    <path d="M17 7v10H7" />
                                  </>
                                )}
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{transaction.description}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{transaction.category}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {transaction.date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${
                          transaction.type === 'income' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 py-3 px-4">
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 dark:bg-blue-500 dark:hover:bg-blue-600"
                    onClick={() => openAddTransactionModal()}
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
                    {t('transactions.addTransaction')}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="col-span-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-800 dark:text-gray-200">{t('dashboard.spendingByCategory')}</CardTitle>
                      <CardDescription className="text-gray-500 dark:text-gray-400">
                        {language === 'pt' ? 'Detalhamento de despesas para ' : 'Your expense breakdown for '}
                        {new Date(selectedYear, selectedMonth - 1).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { month: 'long', year: 'numeric' })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-5">
                    {/* Spending by category */}
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-blue-300/80 dark:text-blue-400/80">{language === 'pt' ? 'Carregando dados de gastos...' : 'Loading spending data...'}</div>
                      </div>
                    ) : (
                      <div>
                        {/* Pie chart visualization */}
                        <CategoryPieChart
                          data={categoryData}
                          totalAmount={summary.totalExpenses}
                        />

                        {/* Top categories list */}
                        <div className="mt-6 space-y-3">
                          {categoryData.slice(0, 5).map(({ name, value, color }) => (
                            <div key={name}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-black dark:text-white">{t(`categories.${name}`) || name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-black dark:text-white">
                                    {summary.totalExpenses > 0 ? ((value / summary.totalExpenses) * 100).toFixed(0) : 0}%
                                  </span>
                                  <span className="text-xs text-gray-700 dark:text-gray-300">${value.toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="h-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${summary.totalExpenses > 0 ? (value / summary.totalExpenses) * 100 : 0}%`,
                                    backgroundColor: color
                                  }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* If no expenses yet */}
                    {transactions.filter(t => t.type === 'expense').length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="h-12 w-12 mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="gray"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-6 w-6 text-gray-500 dark:text-gray-400"
                          >
                            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                          {language === 'pt' ? 'Nenhuma despesa ainda' : 'No expenses yet'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">
                          {language === 'pt' ? 'Adicione sua primeira despesa para ver o detalhamento de gastos' : 'Add your first expense to see your spending breakdown'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 py-3 px-4">
                  <Button variant="outline" size="sm" className="w-full border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-gray-200">
                    {language === 'pt' ? 'Gerenciar Orçamento' : 'Manage Budget'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="transactions" className="space-y-4">
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-gray-800 dark:text-gray-200">All Transactions</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">
                      Manage and filter all your financial transactions
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
                      onClick={() => setIsClearDialogOpen(true)}
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
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" x2="10" y1="11" y2="17" />
                        <line x1="14" x2="14" y1="11" y2="17" />
                      </svg>
                      Clear All
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200">
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
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                      </svg>
                      Export
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0 dark:bg-blue-500 dark:hover:bg-blue-600" onClick={() => setIsAddingTransaction(true)}>
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
                      Add Transaction
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <label htmlFor="search" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        Search
                      </label>
                      <Input
                        id="search"
                        placeholder="Search transactions..."
                        className="border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                      />
                    </div>
                    <div className="w-[150px]">
                      <label htmlFor="type" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        Type
                      </label>
                      <select
                        id="type"
                        className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-200 px-3 py-2 text-sm ring-offset-white dark:ring-offset-gray-800 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                      </select>
                    </div>
                    <div className="w-[200px]">
                      <label htmlFor="category" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        Category
                      </label>
                      <select
                        id="category"
                        className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-200 px-3 py-2 text-sm ring-offset-white dark:ring-offset-gray-800 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">All Categories</option>
                        <optgroup label="Expense Categories">
                          {EXPENSE_CATEGORIES.map(category => (
                            <option key={`expense-${category}`} value={category}>{category}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Income Categories">
                          {INCOME_CATEGORIES.map(category => (
                            <option key={`income-${category}`} value={category}>{category}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'income' ? 'bg-green-100 dark:bg-green-800/30' : 'bg-red-100 dark:bg-red-800/30'
                          }`}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke={transaction.type === 'income' ? 'green' : 'red'}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`h-5 w-5 ${transaction.type === 'income' ? 'dark:stroke-green-400' : 'dark:stroke-red-400'}`}
                            >
                              {transaction.type === 'income' ? (
                                <>
                                  <path d="m17 7-10 10" />
                                  <path d="M7 7h10v10" />
                                </>
                              ) : (
                                <>
                                  <path d="m7 7 10 10" />
                                  <path d="M17 7v10H7" />
                                </>
                              )}
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{transaction.description}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{transaction.category}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {transaction.date.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`text-sm font-medium ${
                            transaction.type === 'income' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-800 dark:text-gray-200'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
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
                              <path d="M12 12h.01" />
                              <path d="M19 12h.01" />
                              <path d="M5 12h.01" />
                            </svg>
                            <span className="sr-only">More</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="gray"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-8 w-8 text-gray-500 dark:text-gray-400"
                        >
                          <path d="M16 2v5h5" />
                          <path d="M21 6v6.5c0 .8-.7 1.5-1.5 1.5h-7c-.8 0-1.5-.7-1.5-1.5v-9c0-.8.7-1.5 1.5-1.5H17l4 4z" />
                          <path d="M8 10v6.5c0 .8-.7 1.5-1.5 1.5h-5c-.8 0-1.5-.7-1.5-1.5v-9c0-.8.7-1.5 1.5-1.5H7" />
                          <path d="M7 15v6" />
                          <path d="M11 15h4" />
                          <path d="M7 21h4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">No transactions yet</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[300px] mb-6">
                        Start tracking your finances by adding your first transaction
                      </p>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0 dark:bg-blue-500 dark:hover:bg-blue-600" onClick={() => setIsAddingTransaction(true)}>
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
                        Add Your First Transaction
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {/* Financial Health and Spending Patterns */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Financial Health Card */}
              <FinancialHealthCard metrics={financialHealth} />

              {/* Spending Patterns Card */}
              <SpendingPatternsCard
                patterns={spendingPatterns}
                categories={categories}
              />
            </div>

            {/* Enhanced Charts */}
            <EnhancedCharts
              monthlyData={monthlyData}
              yearlyData={[
                { name: (selectedYear-1).toString(), income: 0, expense: 0 },
                { name: selectedYear.toString(), income: totalIncome, expense: totalExpenses }
              ]}
              categoryData={categoryData}
            />

            {/* Legacy Analytics */}
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="text-gray-800 dark:text-gray-200">Financial Analytics</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Detailed analysis of your financial data
                </CardDescription>
              </CardHeader>
              <CardContent className="py-8">
                <div className="space-y-8">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Income vs Expenses ({selectedYear})</h3>
                    <IncomeExpenseChart data={monthlyData} />
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Spending by Category</h3>
                    <div className="h-64">
                      <CategoryPieChart
                        data={categoryData}
                        totalAmount={summary.totalExpenses}
                      />
                    </div>
                  </div>

                  {/* Nubank Integration Note */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 mr-2 text-gray-800 dark:text-gray-200"
                      >
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      Nubank Integration
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      We're developing an integration with Nubank to automatically import your transactions and provide even more powerful analytics. Stay tuned for updates!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="text-gray-800 dark:text-gray-200">Financial Reports</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Generate and download detailed financial reports
                </CardDescription>
              </CardHeader>
              <CardContent className="py-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="gray"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-8 w-8 text-gray-500 dark:text-gray-400"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                      <path d="M16 13H8" />
                      <path d="M16 17H8" />
                      <path d="M10 9H8" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Reports Coming Soon</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[400px]">
                    We're building comprehensive reporting tools to help you track your financial progress and make better decisions.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full max-w-[600px]">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-col items-center text-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="gray"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-8 w-8 mb-2 opacity-50 text-gray-500 dark:text-gray-400"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M3 9h18" />
                        <path d="M9 21V9" />
                      </svg>
                      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Monthly Summary</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Detailed monthly breakdown of your income and expenses
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-col items-center text-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="gray"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-8 w-8 mb-2 opacity-50 text-gray-500 dark:text-gray-400"
                      >
                        <path d="M12 2v20" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Budget Report</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Track your spending against your budget goals
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <CopilotChatbot
        summary={summary}
        categories={categories}
        transactions={transactions}
        financialHealth={financialHealth}
        spendingPatterns={spendingPatterns}
        monthlyData={monthlyData}
        categoryData={categoryData}
      />
    </>
  );
}
