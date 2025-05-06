import { Transaction } from '@/lib/supabase';

/**
 * Financial Analysis Utilities
 * 
 * This module provides functions for analyzing financial data and generating insights.
 */

export interface SpendingPattern {
  type: 'recurring' | 'unusual' | 'increasing' | 'decreasing';
  description: string;
  amount: number;
  category: string;
  categoryId: string;
  change?: number; // Percentage change
}

export interface FinancialHealthMetrics {
  score: number; // 0-100
  savingsRate: number; // Percentage
  budgetAdherence: number; // Percentage
  expenseToIncomeRatio: number; // Ratio
  recommendations: string[];
}

/**
 * Identifies recurring expenses in transaction data
 * @param transactions Array of transactions
 * @returns Array of recurring expense patterns
 */
export function identifyRecurringExpenses(transactions: Transaction[]): SpendingPattern[] {
  const patterns: SpendingPattern[] = [];
  const expenseMap = new Map<string, Transaction[]>();
  
  // Group transactions by description (simplified approach)
  transactions.forEach(transaction => {
    if (transaction.type === 'expense') {
      const key = transaction.description.toLowerCase().trim();
      if (!expenseMap.has(key)) {
        expenseMap.set(key, []);
      }
      expenseMap.get(key)!.push(transaction);
    }
  });
  
  // Identify recurring expenses (3 or more occurrences)
  expenseMap.forEach((txs, description) => {
    if (txs.length >= 3) {
      // Check if they occur at regular intervals
      const sortedTxs = [...txs].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Calculate average amount
      const avgAmount = sortedTxs.reduce((sum, tx) => sum + tx.amount, 0) / sortedTxs.length;
      
      patterns.push({
        type: 'recurring',
        description: description.charAt(0).toUpperCase() + description.slice(1),
        amount: avgAmount,
        category: 'Unknown', // This would be replaced with actual category name
        categoryId: sortedTxs[0].category_id || '',
      });
    }
  });
  
  return patterns;
}

/**
 * Identifies unusual spending patterns
 * @param transactions Array of transactions
 * @returns Array of unusual spending patterns
 */
export function identifyUnusualSpending(transactions: Transaction[]): SpendingPattern[] {
  const patterns: SpendingPattern[] = [];
  
  // Group transactions by category
  const categoryMap = new Map<string, Transaction[]>();
  transactions.forEach(transaction => {
    if (transaction.type === 'expense') {
      const key = transaction.category_id || 'uncategorized';
      if (!categoryMap.has(key)) {
        categoryMap.set(key, []);
      }
      categoryMap.get(key)!.push(transaction);
    }
  });
  
  // For each category, find transactions that are significantly higher than average
  categoryMap.forEach((txs, categoryId) => {
    if (txs.length < 3) return; // Need at least 3 transactions to establish a pattern
    
    const amounts = txs.map(tx => tx.amount);
    const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, amount) => sum + Math.pow(amount - avgAmount, 2), 0) / amounts.length
    );
    
    // Transactions that are 2 standard deviations above average are considered unusual
    const threshold = avgAmount + (2 * stdDev);
    
    txs.forEach(tx => {
      if (tx.amount > threshold) {
        patterns.push({
          type: 'unusual',
          description: tx.description,
          amount: tx.amount,
          category: 'Unknown', // This would be replaced with actual category name
          categoryId: categoryId,
          change: Math.round(((tx.amount - avgAmount) / avgAmount) * 100)
        });
      }
    });
  });
  
  return patterns;
}

/**
 * Calculates financial health metrics
 * @param transactions Array of transactions
 * @param budgets Array of budgets (optional)
 * @returns Financial health metrics
 */
export function calculateFinancialHealth(
  transactions: Transaction[],
  budgets: any[] = []
): FinancialHealthMetrics {
  // Calculate total income and expenses
  const totalIncome = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const totalExpenses = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  // Calculate savings rate
  const savingsRate = totalIncome > 0 
    ? Math.max(0, Math.min(100, ((totalIncome - totalExpenses) / totalIncome) * 100))
    : 0;
  
  // Calculate expense to income ratio
  const expenseToIncomeRatio = totalIncome > 0 
    ? totalExpenses / totalIncome
    : 1;
  
  // Calculate budget adherence if budgets are provided
  let budgetAdherence = 100;
  if (budgets.length > 0) {
    // This is a simplified calculation
    budgetAdherence = 80; // Placeholder value
  }
  
  // Calculate overall financial health score (0-100)
  // This is a simplified algorithm
  const savingsScore = savingsRate * 0.4; // 40% weight
  const ratioScore = (1 - Math.min(1, expenseToIncomeRatio)) * 100 * 0.4; // 40% weight
  const adherenceScore = budgetAdherence * 0.2; // 20% weight
  
  const score = Math.round(savingsScore + ratioScore + adherenceScore);
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (savingsRate < 20) {
    recommendations.push('Try to increase your savings rate to at least 20% of your income.');
  }
  
  if (expenseToIncomeRatio > 0.9) {
    recommendations.push('Your expenses are very close to your income. Look for ways to reduce spending.');
  }
  
  if (budgetAdherence < 70) {
    recommendations.push('You\'re frequently exceeding your budgets. Consider adjusting them to be more realistic.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Your financial health looks good! Consider investing any extra savings.');
  }
  
  return {
    score,
    savingsRate,
    budgetAdherence,
    expenseToIncomeRatio,
    recommendations
  };
}
