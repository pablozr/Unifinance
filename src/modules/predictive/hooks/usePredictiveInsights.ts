import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { PredictiveAnalysisService } from '@/services/PredictiveAnalysisService';
import { PredictiveInsights } from '../types';
import { toast } from 'sonner';
import { TransactionService } from '@/services/TransactionService';
import { CategoryService } from '@/services/CategoryService';

export function usePredictiveInsights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<PredictiveInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use useMemo para evitar recriação dos serviços a cada renderização
  const predictiveService = useMemo(() => new PredictiveAnalysisService(), []);
  const transactionService = useMemo(() => new TransactionService(), []);
  const categoryService = useMemo(() => new CategoryService(), []);

  const loadInsights = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Obter dados reais do usuário para análise
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // Obter transações dos últimos 6 meses
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const startDate = sixMonthsAgo.toISOString().split('T')[0];

      // Buscar dados reais
      const transactions = await transactionService.getAllTransactions(user.id, undefined, undefined, {
        startDate
      });

      const categories = await categoryService.getCategories(user.id);

      // Usar o serviço de análise preditiva com dados reais
      const data = await predictiveService.getPredictiveInsights(user.id);

      // Atualizar o estado com os dados reais
      setInsights(data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading predictive insights:', err);
      setError('Failed to load predictive insights');
      toast.error('Failed to load predictive insights');

      // Em caso de erro, usar dados de fallback para demonstração
      // Obter o mês seguinte para a previsão
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = `${nextMonth.getFullYear()}-${(nextMonth.getMonth() + 1).toString().padStart(2, '0')}`;

      const fallbackData: PredictiveInsights = {
        predictions: {
          month: nextMonthStr,
          totalPredictedExpense: 2500,
          totalPredictedIncome: 4000,
          predictedBalance: 1500,
          predictedSavingsRate: 37.5,
          categoryPredictions: [
            {
              categoryId: '1',
              categoryName: 'Alimentação',
              categoryColor: '#FF5733',
              predictedAmount: 800,
              confidence: 0.85,
              previousAmount: 750,
              percentageChange: 6.67
            },
            {
              categoryId: '2',
              categoryName: 'Moradia',
              categoryColor: '#33A8FF',
              predictedAmount: 1200,
              confidence: 0.95,
              previousAmount: 1200,
              percentageChange: 0
            },
            {
              categoryId: '3',
              categoryName: 'Transporte',
              categoryColor: '#33FF57',
              predictedAmount: 300,
              confidence: 0.75,
              previousAmount: 350,
              percentageChange: -14.29
            },
            {
              categoryId: '4',
              categoryName: 'Lazer',
              categoryColor: '#F033FF',
              predictedAmount: 200,
              confidence: 0.65,
              previousAmount: 180,
              percentageChange: 11.11
            }
          ]
        },
        anomalies: [
          {
            categoryId: '4',
            categoryName: 'Lazer',
            categoryColor: '#F033FF',
            amount: 350,
            expectedAmount: 180,
            percentageDeviation: 94.44,
            date: '2023-05-15',
            description: 'Viagem de fim de semana',
            transactionId: 'tx123',
            severity: 'medium'
          }
        ],
        recommendations: [
          {
            id: 'save-more',
            type: 'saving',
            title: 'Aumente sua taxa de economia',
            description: 'Sua taxa de economia atual é boa, mas você pode aumentá-la ainda mais para atingir seus objetivos financeiros mais rapidamente.',
            potentialImpact: 500,
            difficulty: 'medium',
            timeFrame: 'short-term',
            relevanceScore: 0.85
          },
          {
            id: 'reduce-food',
            type: 'spending',
            title: 'Reduza gastos com alimentação',
            description: 'Seus gastos com alimentação estão acima da média. Considere preparar mais refeições em casa.',
            potentialImpact: 200,
            difficulty: 'easy',
            timeFrame: 'immediate',
            relevanceScore: 0.9,
            relatedCategories: ['1']
          },
          {
            id: 'invest',
            type: 'investment',
            title: 'Considere opções de investimento',
            description: 'Com seu saldo positivo, você poderia investir parte do dinheiro para crescimento a longo prazo.',
            potentialImpact: 750,
            difficulty: 'medium',
            timeFrame: 'long-term',
            relevanceScore: 0.75
          }
        ],
        lastUpdated: new Date()
      };

      setInsights(fallbackData);
      setIsLoading(false);
    }
  }, [user, predictiveService, transactionService, categoryService]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  return {
    insights,
    isLoading,
    error,
    refreshInsights: loadInsights
  };
}
