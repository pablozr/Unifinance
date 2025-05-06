'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FinancialHealthMetrics } from '@/lib/financial-analysis';
import { ArrowDownIcon, ArrowUpIcon, InfoIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FinancialHealthCardProps {
  metrics: FinancialHealthMetrics;
}

export function FinancialHealthCard({ metrics }: FinancialHealthCardProps) {
  // Determine score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Determine progress color based on value
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Financial Health Score</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-5 w-5 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Your financial health score is calculated based on your savings rate, 
                  expense-to-income ratio, and budget adherence.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          A holistic view of your financial wellbeing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-6">
          {/* Overall Score */}
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(metrics.score)}`}>
                {metrics.score}/100
              </span>
            </div>
            <Progress 
              value={metrics.score} 
              className="h-2"
              indicatorClassName={getProgressColor(metrics.score)}
            />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Savings Rate */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Savings Rate</span>
                <span className={`text-lg font-semibold ${metrics.savingsRate >= 20 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.savingsRate.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.savingsRate >= 20 ? 
                  <span className="flex items-center text-green-500">
                    <ArrowUpIcon className="h-3 w-3 mr-1" /> Good
                  </span> : 
                  <span className="flex items-center text-red-500">
                    <ArrowDownIcon className="h-3 w-3 mr-1" /> Needs improvement
                  </span>
                }
              </div>
            </div>

            {/* Budget Adherence */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Budget Adherence</span>
                <span className={`text-lg font-semibold ${metrics.budgetAdherence >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>
                  {metrics.budgetAdherence.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.budgetAdherence >= 80 ? 
                  <span className="flex items-center text-green-500">
                    <ArrowUpIcon className="h-3 w-3 mr-1" /> On track
                  </span> : 
                  <span className="flex items-center text-yellow-500">
                    <ArrowDownIcon className="h-3 w-3 mr-1" /> Slightly over budget
                  </span>
                }
              </div>
            </div>

            {/* Expense to Income Ratio */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Expense Ratio</span>
                <span className={`text-lg font-semibold ${metrics.expenseToIncomeRatio <= 0.7 ? 'text-green-500' : 'text-red-500'}`}>
                  {(metrics.expenseToIncomeRatio * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.expenseToIncomeRatio <= 0.7 ? 
                  <span className="flex items-center text-green-500">
                    <ArrowDownIcon className="h-3 w-3 mr-1" /> Healthy
                  </span> : 
                  <span className="flex items-center text-red-500">
                    <ArrowUpIcon className="h-3 w-3 mr-1" /> Too high
                  </span>
                }
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Recommendations</h4>
            <ul className="space-y-1">
              {metrics.recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
