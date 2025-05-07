import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { TransactionService } from '@/services/TransactionService';
import { Transaction, TransactionFilterOptions } from '../types';
import { toast } from 'sonner';

export function useTransactions(page = 1, pageSize = 10, initialFilters?: TransactionFilterOptions) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<TransactionFilterOptions>(initialFilters || {});
  
  const transactionService = new TransactionService();

  const loadTransactions = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const result = await transactionService.getPaginatedTransactions(
        user.id,
        page,
        pageSize,
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
          categoryId: filters.categoryId,
          type: filters.type !== 'all' ? filters.type : undefined,
          searchTerm: filters.searchTerm
        }
      );

      setTransactions(result.transactions);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [user, page, pageSize, filters, transactionService]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const updateFilters = useCallback((newFilters: Partial<TransactionFilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) return false;
    
    try {
      await transactionService.deleteTransaction(id, user.id);
      toast.success('Transaction deleted successfully');
      loadTransactions();
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
      return false;
    }
  }, [user, transactionService, loadTransactions]);

  return {
    transactions,
    isLoading,
    totalCount,
    totalPages,
    filters,
    updateFilters,
    deleteTransaction,
    refreshTransactions: loadTransactions
  };
}
