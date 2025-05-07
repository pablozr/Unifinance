'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { PredictedExpense } from '../types';
import { useLanguage } from '@/contexts/language-context';

interface PredictedExpensesChartProps {
  predictions: PredictedExpense[];
  title?: string;
  description?: string;
}

export function PredictedExpensesChart({
  predictions,
  title,
  description
}: PredictedExpensesChartProps) {
  const { t } = useLanguage();
  // Sort predictions by amount (highest first)
  const sortedPredictions = [...predictions]
    .sort((a, b) => b.predictedAmount - a.predictedAmount)
    .slice(0, 10); // Show top 10 categories

  // Prepare data for chart
  const chartData = sortedPredictions.map(prediction => ({
    name: prediction.categoryName,
    amount: prediction.predictedAmount,
    color: prediction.categoryColor,
    confidence: prediction.confidence,
    trend: prediction.trend || '',
    justification: prediction.justification || '',
    previousAmount: prediction.previousAmount,
    percentageChange: prediction.percentageChange
  }));

  // Format currency for tooltip
  const currencyFormatter = (value: number) => formatCurrency(value);

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    if (!trend) return null;

    if (trend.includes('alta') || trend.includes('aumento')) {
      return <span className="text-green-500">↗</span>;
    } else if (trend.includes('queda') || trend.includes('redução')) {
      return <span className="text-red-500">↘</span>;
    } else if (trend.includes('estável')) {
      return <span className="text-blue-500">→</span>;
    }
    return null;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-md p-3 shadow-md max-w-xs">
          <p className="font-medium">{label} {getTrendIcon(data.trend)}</p>
          <p className="text-sm">
            <span className="font-medium">{t('predictive.predictedAmount')}:</span> {currencyFormatter(data.amount)}
          </p>

          {data.previousAmount !== undefined && (
            <p className="text-sm">
              <span className="font-medium">{t('predictive.previousAmount')}:</span> {currencyFormatter(data.previousAmount)}
              {data.percentageChange !== undefined && (
                <span className={`ml-1 ${data.percentageChange > 0 ? 'text-red-500' : data.percentageChange < 0 ? 'text-green-500' : 'text-gray-500'}`}>
                  ({data.percentageChange > 0 ? '+' : ''}{data.percentageChange.toFixed(1)}%)
                </span>
              )}
            </p>
          )}

          <p className="text-sm">
            <span className="font-medium">{t('predictive.confidence')}:</span> {(data.confidence * 100).toFixed(0)}%
          </p>

          {data.trend && (
            <p className="text-sm">
              <span className="font-medium">{t('predictive.trend')}:</span> {data.trend}
            </p>
          )}

          {data.justification && (
            <p className="text-sm mt-1 text-gray-600 dark:text-gray-400 border-t pt-1">
              {data.justification}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || t('predictive.predictedExpenses')}</CardTitle>
        <CardDescription>{description || t('predictive.estimatedExpensesByCategory')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              barSize={30}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fontSize: 12 }}
              />
              <YAxis tickFormatter={currencyFormatter} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="amount" name={t('predictive.predictedAmount')}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
