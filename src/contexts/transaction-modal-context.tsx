'use client';

import React, { createContext, useContext, useState } from 'react';

type TransactionType = 'income' | 'expense';

interface TransactionModalContextType {
  isAddingTransaction: boolean;
  setIsAddingTransaction: (value: boolean) => void;
  newTransaction: {
    amount: string;
    description: string;
    category_id: string;
    type: TransactionType;
  };
  setNewTransaction: React.Dispatch<React.SetStateAction<{
    amount: string;
    description: string;
    category_id: string;
    type: TransactionType;
  }>>;
  openAddTransactionModal: (type?: TransactionType) => void;
}

export const TransactionModalContext = createContext<TransactionModalContextType>({
  isAddingTransaction: false,
  setIsAddingTransaction: () => {},
  newTransaction: {
    amount: '',
    description: '',
    category_id: '',
    type: 'expense',
  },
  setNewTransaction: () => {},
  openAddTransactionModal: () => {},
});

export function TransactionModalProvider({ children }: { children: React.ReactNode }) {
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: '',
    category_id: '',
    type: 'expense' as TransactionType,
  });

  const openAddTransactionModal = (type?: TransactionType) => {
    setNewTransaction({
      amount: '',
      description: '',
      category_id: '',
      type: type || 'expense',
    });
    setIsAddingTransaction(true);
  };

  return (
    <TransactionModalContext.Provider value={{
      isAddingTransaction,
      setIsAddingTransaction,
      newTransaction,
      setNewTransaction,
      openAddTransactionModal,
    }}>
      {children}
    </TransactionModalContext.Provider>
  );
}

export function useTransactionModal() {
  return useContext(TransactionModalContext);
}
