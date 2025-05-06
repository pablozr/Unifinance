'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ImportedTransaction, ImportFormat, BANK_TEMPLATES } from '@/lib/import-types';

// Simplified category interface for import mapping
interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  type?: 'income' | 'expense';
}

interface ImportMappingProps {
  transactions: ImportedTransaction[];
  categories: Category[];
  onConfirm: (transactions: any[]) => void;
  onCancel: () => void;
}

export function ImportMapping({
  transactions,
  categories,
  onConfirm,
  onCancel
}: ImportMappingProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(BANK_TEMPLATES[0].id);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [mappedTransactions, setMappedTransactions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 20;

  // Update mapped transactions when template or transactions change
  useEffect(() => {
    if (!transactions.length) return;

    const template = BANK_TEMPLATES.find(t => t.id === selectedTemplate)?.format || BANK_TEMPLATES[0].format;

    // Map transactions to system format
    const mapped = transactions.map(transaction => {
      // Try to determine category based on description
      let categoryId = '';
      const description = transaction.description.toLowerCase();

      // Simple keyword matching for categories
      for (const category of categories) {
        if (description.includes(category.name.toLowerCase())) {
          categoryId = category.id;
          break;
        }
      }

      // Default to first category if no match found
      if (!categoryId && categories.length > 0) {
        // Use appropriate category based on transaction type
        if (transaction.type === 'income') {
          const incomeCategory = categories.find(c => ['Salary', 'Freelance', 'Investments', 'Other Income'].includes(c.name));
          categoryId = incomeCategory?.id || categories[0].id;
        } else {
          const expenseCategory = categories.find(c => !['Salary', 'Freelance', 'Investments', 'Other Income'].includes(c.name));
          categoryId = expenseCategory?.id || categories[0].id;
        }
      }

      // Format the date as ISO string (YYYY-MM-DD)
      let formattedDate = '';
      try {
        // Try to parse the date
        const transactionDate = new Date(transaction.date);

        // Check if the date is valid
        if (isNaN(transactionDate.getTime())) {
          // If invalid, use current date
          console.warn(`Invalid date: ${transaction.date}, using current date instead`);
          formattedDate = new Date().toISOString().split('T')[0];
        } else {
          // If valid, format as YYYY-MM-DD
          formattedDate = transactionDate.toISOString().split('T')[0];
        }
      } catch (error) {
        // If any error occurs, use current date
        console.error(`Error parsing date: ${transaction.date}`, error);
        formattedDate = new Date().toISOString().split('T')[0];
      }

      return {
        amount: parseFloat(transaction.amount.replace(/[^\d.-]/g, '')),
        description: transaction.description,
        category_id: categoryId,
        date: formattedDate,
        type: transaction.type || 'expense'
      };
    });

    setMappedTransactions(mapped);
  }, [transactions, selectedTemplate, categories]);

  // Handle category change for a transaction
  const handleCategoryChange = (index: number, categoryId: string) => {
    const updated = [...mappedTransactions];
    updated[index].category_id = categoryId;
    setMappedTransactions(updated);
  };

  // Handle type change for a transaction
  const handleTypeChange = (index: number, type: 'income' | 'expense') => {
    const updated = [...mappedTransactions];
    updated[index].type = type;
    setMappedTransactions(updated);
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <CardHeader className="border-b border-gray-100 dark:border-gray-700">
        <CardTitle className="text-gray-800 dark:text-gray-200">Review Imported Transactions</CardTitle>
        <CardDescription className="text-gray-500 dark:text-gray-400">
          Review and categorize your imported transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              Bank Template
            </label>
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
            >
              <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                <SelectValue placeholder="Select a bank template" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                {BANK_TEMPLATES.map(template => (
                  <SelectItem key={template.id} value={template.id} className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Transactions Found
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {transactions.length}
            </p>
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-800">
              <TableRow className="border-gray-200 dark:border-gray-700">
                <TableHead className="text-gray-700 dark:text-gray-300">Date</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Description</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Amount</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Type</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappedTransactions
                .slice((currentPage - 1) * transactionsPerPage, currentPage * transactionsPerPage)
                .map((transaction, index) => {
                  const actualIndex = (currentPage - 1) * transactionsPerPage + index;
                  return (
                    <TableRow key={actualIndex} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell className="text-gray-800 dark:text-gray-200">
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-gray-800 dark:text-gray-200 max-w-[200px] truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={transaction.type}
                          onValueChange={(value) => handleTypeChange(actualIndex, value as 'income' | 'expense')}
                        >
                          <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 h-8 w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                            <SelectItem value="income" className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                              Income
                            </SelectItem>
                            <SelectItem value="expense" className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                              Expense
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={transaction.category_id}
                          onValueChange={(value) => handleCategoryChange(actualIndex, value)}
                        >
                          <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 h-8">
                            <SelectValue>
                              {categories.find(c => c.id === transaction.category_id)?.name || 'Select category'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                            {categories
                              .filter(c => {
                                // Filter categories based on transaction type
                                const incomeCategories = ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'];
                                return transaction.type === 'income'
                                  ? incomeCategories.includes(c.name)
                                  : !incomeCategories.includes(c.name);
                              })
                              .map(category => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                  className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  {category.name}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}

              {mappedTransactions.length === 0 && (
                <TableRow className="border-gray-200 dark:border-gray-700">
                  <TableCell colSpan={5} className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No transactions found in the imported file
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination controls */}
        {mappedTransactions.length > transactionsPerPage && (
          <div className="flex items-center justify-center space-x-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Previous
            </Button>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {Math.ceil(mappedTransactions.length / transactionsPerPage)}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(mappedTransactions.length / transactionsPerPage)))}
              disabled={currentPage >= Math.ceil(mappedTransactions.length / transactionsPerPage)}
              className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm(mappedTransactions)}
          className="bg-blue-600 hover:bg-blue-700 text-white border-0 dark:bg-blue-500 dark:hover:bg-blue-600"
          disabled={mappedTransactions.length === 0}
        >
          Import {mappedTransactions.length} Transactions
        </Button>
      </CardFooter>
    </Card>
  );
}

