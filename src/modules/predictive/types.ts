export interface PredictedExpense {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  predictedAmount: number;
  confidence: number; // 0-1 value representing prediction confidence
  previousAmount?: number; // Amount from previous period for comparison
  percentageChange?: number; // Percentage change from previous period
  trend?: string; // Trend description (e.g., "increasing", "stable", "decreasing")
  justification?: string; // Explanation for the prediction
}

export interface SpendingPrediction {
  month: string; // Format: "YYYY-MM"
  totalPredictedExpense: number;
  totalPredictedIncome: number;
  predictedBalance: number;
  predictedSavingsRate: number;
  categoryPredictions: PredictedExpense[];
}

export interface SpendingAnomaly {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  expectedAmount: number;
  percentageDeviation: number;
  date: string;
  description: string;
  transactionId: string;
  severity: 'low' | 'medium' | 'high';
}

export interface FinancialRecommendation {
  id: string;
  type: 'saving' | 'spending' | 'budget' | 'investment';
  title: string;
  description: string;
  potentialImpact: number; // Estimated financial impact in currency
  difficulty: 'easy' | 'medium' | 'hard';
  timeFrame: 'immediate' | 'short-term' | 'long-term';
  relevanceScore: number; // 0-1 value representing how relevant this recommendation is
  relatedCategories?: string[]; // Category IDs related to this recommendation
}

export interface PredictiveInsights {
  predictions: SpendingPrediction;
  anomalies: SpendingAnomaly[];
  recommendations: FinancialRecommendation[];
  lastUpdated: Date;
}
