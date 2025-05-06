'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { transactionService, categoryService } from '@/services';
import { Transaction as DBTransaction, Category as DBCategory, supabase } from '@/lib/supabase';
import { useTransactionModal } from '@/contexts/transaction-modal-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

// Tipos para as transações na UI
type TransactionType = 'income' | 'expense';

interface Transaction extends DBTransaction {
  category_name?: string;
  category_color?: string;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const transactionsPerPage = 20;

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

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

  // Use the transaction modal context
  const {
    isAddingTransaction,
    setIsAddingTransaction,
    newTransaction,
    setNewTransaction,
    openAddTransactionModal
  } = useTransactionModal();

  // Load user data
  const loadUserData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load categories
      const userCategories = await categoryService.getCategories(user.id);
      setCategories(userCategories);

      // Load transactions with pagination
      const { data: transactionsData, count } = await transactionService.getTransactions(
        user.id,
        {
          page: currentPage,
          limit: transactionsPerPage,
          searchTerm,
          categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
          type: typeFilter !== 'all' ? typeFilter as TransactionType : undefined,
          year: dateFilter !== 'all' ? selectedYear : undefined,
          month: dateFilter !== 'all' ? selectedMonth : undefined
        }
      );

      // Calculate total pages
      setTotalPages(Math.ceil((count || 0) / transactionsPerPage));

      // Add category names to transactions
      const enhancedTransactions = transactionsData.map(transaction => {
        const category = userCategories.find(c => c.id === transaction.category_id);
        return {
          ...transaction,
          category_name: category?.name || 'Uncategorized',
          category_color: category?.color || '#888888'
        };
      });

      setTransactions(enhancedTransactions);
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
  }, [user, currentPage, searchTerm, categoryFilter, typeFilter, dateFilter, selectedYear, selectedMonth]);

  // Function to clear all transactions
  const handleClearTransactions = async () => {
    if (!user) {
      toast.error('You must be logged in to clear transactions');
      return;
    }

    setIsClearing(true);

    try {
      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Authentication error. Please log in again.');
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
      toast.success(`Successfully cleared ${result.count} transactions`);

    } catch (error) {
      console.error('Error clearing transactions:', error);
      toast.error('Failed to clear transactions');
    } finally {
      setIsClearing(false);
    }
  };

  // Function to handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    loadUserData();
  };

  // Function to handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Dialog for Clear Transactions Confirmation */}
      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Clear All Transactions</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              This will permanently delete all your transactions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setIsClearDialogOpen(false)}
              className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearTransactions}
              className="bg-red-600 hover:bg-red-700 text-white border-0 dark:bg-red-700 dark:hover:bg-red-800"
              disabled={isClearing}
            >
              {isClearing ? 'Clearing...' : 'Yes, Clear All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and view all your financial transactions
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-gray-800 dark:text-gray-200">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-4">
            <div>
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              />
            </div>
            <div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 dark:bg-blue-500 dark:hover:bg-blue-600">
                Apply Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
          <CardTitle className="text-xl text-gray-800 dark:text-gray-200">All Transactions</CardTitle>
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
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white border-0 dark:bg-blue-500 dark:hover:bg-blue-600"
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
              Add Transaction
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Category</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">Amount</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 max-w-[200px] truncate">
                        {transaction.description}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${transaction.category_color}20`,
                            color: transaction.category_color
                          }}
                        >
                          {transaction.category_name}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium text-right ${
                        transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400">
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
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                          <span className="sr-only">Edit</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No transactions found. Add a transaction to get started.
            </div>
          )}
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 py-3 px-4">
            <Pagination className="mx-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''} size={undefined}                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={page === currentPage} size={undefined}                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''} size={undefined}                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}



