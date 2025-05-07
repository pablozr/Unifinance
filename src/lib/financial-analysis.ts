import { Transaction } from '@/lib/supabase';
import { SpendingPrediction, SpendingAnomaly, FinancialRecommendation, PredictedExpense } from '@/modules/predictive/types';

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
 * Analisa transações para identificar anomalias de gastos
 * @param transactions Transações do usuário
 * @param predictions Previsões de gastos
 * @param categories Categorias de transações
 * @returns Lista de anomalias de gastos
 */
export function analyzeSpendingAnomalies(
  transactions: any[],
  predictions: SpendingPrediction,
  categories: any[]
): SpendingAnomaly[] {
  const anomalies: SpendingAnomaly[] = [];

  // Agrupar transações por categoria
  const transactionsByCategory = transactions.reduce((acc, transaction) => {
    const category = categories.find(c => c.id === transaction.category_id);
    if (!category) return acc;

    if (!acc[category.name]) {
      acc[category.name] = [];
    }

    acc[category.name].push(transaction);
    return acc;
  }, {} as Record<string, any[]>);

  // Analisar cada categoria para identificar anomalias
  Object.entries(transactionsByCategory).forEach(([categoryName, categoryTransactions]) => {
    // Encontrar a previsão para esta categoria
    const prediction = predictions.categoryPredictions.find(p => p.categoryName === categoryName);
    if (!prediction) return;

    // Calcular média e desvio padrão dos gastos nesta categoria
    const amounts = categoryTransactions.map(t => t.amount);
    const sum = amounts.reduce((a, b) => a + b, 0);
    const mean = sum / amounts.length;

    const squareDiffs = amounts.map(value => {
      const diff = value - mean;
      return diff * diff;
    });

    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    // Identificar transações anômalas (que estão a mais de 2 desvios padrão da média)
    categoryTransactions.forEach(transaction => {
      const deviation = Math.abs(transaction.amount - mean);
      const deviationRatio = deviation / (stdDev || 1); // Evitar divisão por zero

      if (deviationRatio > 2) {
        // Esta é uma transação anômala
        const percentageDeviation = ((transaction.amount - mean) / mean) * 100;
        const category = categories.find(c => c.id === transaction.category_id);

        // Determinar a severidade com base no desvio
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (deviationRatio > 4) {
          severity = 'high';
        } else if (deviationRatio > 3) {
          severity = 'medium';
        }

        anomalies.push({
          categoryId: transaction.category_id,
          categoryName: category?.name || 'Desconhecido',
          categoryColor: category?.color || '#808080',
          amount: transaction.amount,
          expectedAmount: mean,
          percentageDeviation,
          date: transaction.date,
          description: transaction.description,
          transactionId: transaction.id,
          severity
        });
      }
    });
  });

  // Ordenar anomalias por severidade (alta para baixa) e depois por desvio percentual (maior para menor)
  return anomalies.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];

    if (severityDiff !== 0) return severityDiff;
    return Math.abs(b.percentageDeviation) - Math.abs(a.percentageDeviation);
  });
}

/**
 * Gera recomendações financeiras com base nas previsões e anomalias
 * @param predictions Previsões de gastos
 * @param anomalies Anomalias de gastos
 * @param transactions Transações do usuário
 * @param language Idioma atual (pt ou en)
 * @returns Lista de recomendações financeiras
 */
export function generateFinancialRecommendations(
  predictions: SpendingPrediction,
  anomalies: SpendingAnomaly[],
  transactions: any[],
  language: string = 'pt'
): FinancialRecommendation[] {
  const recommendations: FinancialRecommendation[] = [];
  const isPt = language === 'pt';

  // Recomendação baseada no saldo previsto
  if (predictions.predictedBalance < 0) {
    // Saldo negativo previsto
    recommendations.push({
      id: 'negative-balance',
      type: 'budget',
      title: isPt ? 'Reduza despesas para evitar saldo negativo' : 'Reduce expenses to avoid negative balance',
      description: isPt
        ? `Suas despesas previstas excedem sua receita em R$ ${Math.abs(predictions.predictedBalance).toFixed(2)}. Considere reduzir gastos não essenciais.`
        : `Your predicted expenses exceed your income by $ ${Math.abs(predictions.predictedBalance).toFixed(2)}. Consider reducing non-essential spending.`,
      potentialImpact: Math.abs(predictions.predictedBalance),
      difficulty: 'medium',
      timeFrame: 'immediate',
      relevanceScore: 0.95
    });

    // Identificar categorias com maior aumento percentual para sugerir cortes
    const increasingCategories = predictions.categoryPredictions
      .filter(p => p.percentageChange && p.percentageChange > 10)
      .sort((a, b) => (b.percentageChange || 0) - (a.percentageChange || 0));

    if (increasingCategories.length > 0) {
      const topCategory = increasingCategories[0];
      recommendations.push({
        id: `reduce-${topCategory.categoryName.toLowerCase()}`,
        type: 'spending',
        title: isPt
          ? `Reduza gastos em ${topCategory.categoryName}`
          : `Reduce spending in ${topCategory.categoryName}`,
        description: isPt
          ? `Esta categoria teve um aumento de ${topCategory.percentageChange?.toFixed(1)}% em relação à média anterior. Considere reduzir estes gastos.`
          : `This category had an increase of ${topCategory.percentageChange?.toFixed(1)}% compared to the previous average. Consider reducing these expenses.`,
        potentialImpact: topCategory.predictedAmount * 0.2, // Sugerir redução de 20%
        difficulty: 'medium',
        timeFrame: 'short-term',
        relevanceScore: 0.85,
        relatedCategories: [topCategory.categoryId]
      });
    }
  } else if (predictions.predictedBalance > 0) {
    // Saldo positivo previsto - recomendar investimento ou poupança
    if (predictions.predictedSavingsRate > 20) {
      recommendations.push({
        id: 'invest-savings',
        type: 'investment',
        title: isPt ? 'Invista seu saldo positivo' : 'Invest your positive balance',
        description: isPt
          ? `Você terá um saldo positivo previsto de R$ ${predictions.predictedBalance.toFixed(2)}. Considere investir parte deste valor.`
          : `You will have a predicted positive balance of $ ${predictions.predictedBalance.toFixed(2)}. Consider investing part of this amount.`,
        potentialImpact: predictions.predictedBalance * 0.5,
        difficulty: 'medium',
        timeFrame: 'short-term',
        relevanceScore: 0.8
      });
    } else {
      recommendations.push({
        id: 'increase-savings',
        type: 'saving',
        title: isPt ? 'Aumente sua taxa de economia' : 'Increase your savings rate',
        description: isPt
          ? `Sua taxa de economia prevista é de ${predictions.predictedSavingsRate.toFixed(1)}%. Tente aumentar para pelo menos 20%.`
          : `Your predicted savings rate is ${predictions.predictedSavingsRate.toFixed(1)}%. Try to increase it to at least 20%.`,
        potentialImpact: (predictions.totalPredictedIncome * 0.2) - predictions.predictedBalance,
        difficulty: 'medium',
        timeFrame: 'medium-term',
        relevanceScore: 0.75
      });
    }
  }

  // Recomendações baseadas em anomalias
  if (anomalies.length > 0) {
    // Agrupar anomalias por categoria
    const anomaliesByCategory = anomalies.reduce((acc, anomaly) => {
      if (!acc[anomaly.categoryName]) {
        acc[anomaly.categoryName] = [];
      }
      acc[anomaly.categoryName].push(anomaly);
      return acc;
    }, {} as Record<string, SpendingAnomaly[]>);

    // Identificar categorias com múltiplas anomalias
    Object.entries(anomaliesByCategory)
      .filter(([_, categoryAnomalies]) => categoryAnomalies.length > 1)
      .forEach(([categoryName, categoryAnomalies]) => {
        const highSeverityCount = categoryAnomalies.filter(a => a.severity === 'high').length;

        if (highSeverityCount > 0) {
          recommendations.push({
            id: `review-${categoryName.toLowerCase()}`,
            type: 'spending',
            title: isPt
              ? `Revise seus gastos em ${categoryName}`
              : `Review your spending in ${categoryName}`,
            description: isPt
              ? `Detectamos ${categoryAnomalies.length} transações anômalas nesta categoria, incluindo ${highSeverityCount} de alta severidade.`
              : `We detected ${categoryAnomalies.length} anomalous transactions in this category, including ${highSeverityCount} of high severity.`,
            potentialImpact: categoryAnomalies.reduce((sum, a) => sum + (a.amount - a.expectedAmount), 0),
            difficulty: 'easy',
            timeFrame: 'immediate',
            relevanceScore: 0.9,
            relatedCategories: [categoryAnomalies[0].categoryId]
          });
        }
      });
  }

  // Recomendação de orçamento se não houver um padrão claro de gastos
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const totalMonths = Math.ceil(expenseTransactions.length / 20); // Estimativa grosseira

  if (totalMonths < 3 || expenseTransactions.length < 30) {
    recommendations.push({
      id: 'create-budget',
      type: 'budget',
      title: isPt ? 'Crie um orçamento mensal' : 'Create a monthly budget',
      description: isPt
        ? 'Estabelecer um orçamento detalhado ajudará você a controlar melhor seus gastos e planejar para o futuro.'
        : 'Establishing a detailed budget will help you better control your spending and plan for the future.',
      potentialImpact: predictions.totalPredictedExpense * 0.1, // Estimativa de economia de 10%
      difficulty: 'medium',
      timeFrame: 'short-term',
      relevanceScore: 0.7
    });
  }

  // Ordenar recomendações por relevância
  return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
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
