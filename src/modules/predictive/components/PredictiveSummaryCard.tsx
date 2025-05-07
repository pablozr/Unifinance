'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownIcon, ArrowUpIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { SpendingPrediction } from '../types';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

interface PredictiveSummaryCardProps {
  prediction: SpendingPrediction;
  title?: string;
  description?: string;
}

export function PredictiveSummaryCard({
  prediction,
  title = "Next Month Forecast",
  description = "Predicted financial overview for the upcoming month"
}: PredictiveSummaryCardProps) {
  const { t, language } = useLanguage();

  // Format month for display
  const [year, month] = prediction.month.split('-');
  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', { month: 'long' });
  const displayMonth = `${monthName} ${year}`;

  // Determine if balance is positive or negative
  const isPositiveBalance = prediction.predictedBalance >= 0;

  // Determine if savings rate is good
  const isSavingsRateGood = prediction.predictedSavingsRate >= 20;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-muted-foreground">{displayMonth}</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('predictive.predictedIncome')}</p>
              <div className="flex items-center">
                <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-lg font-medium text-green-500">
                  {formatCurrency(prediction.totalPredictedIncome)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('predictive.predictedExpense')}</p>
              <div className="flex items-center">
                <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
                <span className="text-lg font-medium text-red-500">
                  {formatCurrency(prediction.totalPredictedExpense)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('predictive.predictedBalance')}</p>
                <div className="flex items-center">
                  {isPositiveBalance ? (
                    <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-lg font-medium ${isPositiveBalance ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(prediction.predictedBalance)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('predictive.savingsRate')}</p>
                <div className="flex items-center">
                  {isSavingsRateGood ? (
                    <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4 text-yellow-500" />
                  )}
                  <span className={`text-lg font-medium ${
                    prediction.predictedSavingsRate >= 20 ? 'text-green-500' :
                    prediction.predictedSavingsRate >= 10 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {prediction.predictedSavingsRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">{t('predictive.topExpenseCategories')}</p>
            <div className="space-y-2">
              {prediction.categoryPredictions
                .sort((a, b) => b.predictedAmount - a.predictedAmount)
                .slice(0, 3)
                .map((category, index) => (
                  <div key={category.categoryId || `category-${index}`} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: category.categoryColor }}
                      />
                      <span className="text-sm">{category.categoryName}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(category.predictedAmount)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
