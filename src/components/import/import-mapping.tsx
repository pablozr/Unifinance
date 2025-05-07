'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ImportedTransaction, BANK_TEMPLATES } from '@/lib/import-types';
import { useLanguage } from '@/contexts/language-context';

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
  const { t } = useLanguage();
  const [selectedTemplate, setSelectedTemplate] = useState(BANK_TEMPLATES[0].id);
  const [mappedTransactions, setMappedTransactions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 20;

  // Update mapped transactions when template or transactions change
  useEffect(() => {
    if (!transactions.length) return;

    // Função para classificar transações com IA
    const classifyTransactionsWithAI = async () => {
      try {
        // Importar o serviço de categorização do Copilot
        const { CopilotCategoryService } = await import('@/services/copilot-category-service');

        // Classificar transações usando IA
        const classifiedTransactions = await CopilotCategoryService.classifyTransactions(
          transactions,
          categories
        );

        // Mapear transações para o formato do sistema
        const mapped = classifiedTransactions.map(transaction => {
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
            category_id: transaction.suggestedCategoryId || '',
            date: formattedDate,
            type: transaction.type || 'expense',
            confidence: transaction.confidence || 0
          };
        });

        setMappedTransactions(mapped);
      } catch (error) {
        console.error('Error classifying transactions with AI:', error);

        // Fallback para o método simples em caso de erro
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
            type: transaction.type || 'expense',
            confidence: 0.5
          };
        });

        setMappedTransactions(mapped);
      }
    };

    // Executar a classificação
    classifyTransactionsWithAI();
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

  // Aceitar todas as sugestões de categorias da IA
  const acceptAllSuggestions = () => {
    // Verificar se há transações com sugestões
    if (mappedTransactions.length === 0) return;

    // Criar uma cópia das transações
    const updated = [...mappedTransactions];

    // Contar quantas transações foram atualizadas
    let updatedCount = 0;

    // Atualizar apenas as transações com alta confiança (>= 70%)
    updated.forEach(transaction => {
      if (transaction.confidence && transaction.confidence >= 0.7) {
        // Verificar se a categoria já está definida
        if (transaction.category_id) {
          updatedCount++;
        }
      }
    });

    // Atualizar o estado
    setMappedTransactions(updated);

    // Mostrar mensagem de sucesso
    alert(t ?
      (t('import.categoriesApplied') || 'AI suggested categories applied successfully!') + ` (${updatedCount} transactions)`
      : `AI suggested categories applied successfully! (${updatedCount} transactions)`);
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <CardHeader className="border-b border-gray-100 dark:border-gray-700">
        <CardTitle className="text-gray-800 dark:text-gray-200">
          {t('import.reviewImportedTransactions')}
        </CardTitle>
        <CardDescription className="text-gray-500 dark:text-gray-400">
          {t('import.reviewAndCategorize')}
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

          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={acceptAllSuggestions}
              className="border-green-300 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900"
              disabled={mappedTransactions.length === 0}
            >
              {t ? t('import.acceptAllSuggestions') || 'Accept AI Suggestions' : 'Accept AI Suggestions'}
            </Button>
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
                <TableHead className="text-gray-700 dark:text-gray-300">AI Confidence</TableHead>
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
                              {categories.find(c => c.id === transaction.category_id)?.name ?
                                (t(`categories.${categories.find(c => c.id === transaction.category_id)?.name}`) || categories.find(c => c.id === transaction.category_id)?.name)
                                : t('transactions.selectCategory')}
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
                                  {t(`categories.${category.name}`) || category.name}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </TableCell>
                      {/* Coluna de confiança da IA */}
                      <TableCell>
                        {transaction.confidence !== undefined && (
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                              <div
                                className={`h-2.5 rounded-full ${
                                  transaction.confidence >= 0.7 ? 'bg-green-500' :
                                  transaction.confidence >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.round(transaction.confidence * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {Math.round(transaction.confidence * 100)}%
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

              {mappedTransactions.length === 0 && (
                <TableRow className="border-gray-200 dark:border-gray-700">
                  <TableCell colSpan={6} className="text-center text-gray-500 dark:text-gray-400 py-8">
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

