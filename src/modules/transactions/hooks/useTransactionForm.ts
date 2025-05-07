import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { TransactionService } from '@/services/TransactionService';
import { TransactionFormData } from '../types';
import { toast } from 'sonner';

export function useTransactionForm(onSuccess?: () => void) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const transactionService = new TransactionService();

  const submitTransaction = useCallback(async (data: TransactionFormData, transactionId?: string) => {
    if (!user) return false;
    
    setIsSubmitting(true);
    try {
      const transactionData = {
        user_id: user.id,
        amount: parseFloat(data.amount),
        description: data.description,
        category_id: data.category_id,
        date: data.date,
        type: data.type
      };

      if (transactionId) {
        // Update existing transaction
        await transactionService.updateTransaction(transactionId, transactionData, user.id);
        toast.success('Transaction updated successfully');
      } else {
        // Create new transaction
        await transactionService.createTransaction(transactionData);
        toast.success('Transaction added successfully');
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      return true;
    } catch (error) {
      console.error('Error submitting transaction:', error);
      toast.error('Failed to save transaction');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, transactionService, onSuccess]);

  return {
    isSubmitting,
    submitTransaction
  };
}
