import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface Insight {
  category: string;
  amount: number;
  change: number;
  color: string;
  isHighest?: boolean;
}

interface PersonalizedFeedbackProps {
  title: string;
  insights: Insight[];
  savingsRate: number;
  previousSavingsRate: number;
  period: string;
  recommendations: string[];
}

export function PersonalizedFeedback({
  title,
  insights,
  savingsRate,
  previousSavingsRate,
  period,
  recommendations
}: PersonalizedFeedbackProps) {
  const savingsRateChange = savingsRate - previousSavingsRate;
  const savingsRateDirection = savingsRateChange >= 0 ? 'up' : 'down';

  return (
    <Card className="w-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <CardHeader className="p-4 pb-2 bg-primary/5 border-b border-gray-100 dark:border-gray-700">
        <CardTitle className="text-lg font-medium text-gray-800 dark:text-gray-200">{title}</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">{period}</p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Taxa de Economia */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400">Taxa de Economia</h4>
              <div className="flex items-center">
                {savingsRateDirection === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-xs font-medium ${
                  savingsRateDirection === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {Math.abs(savingsRateChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">{savingsRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {savingsRate >= 20 
                ? 'Excelente! Você está economizando mais que o recomendado.'
                : savingsRate >= 10
                ? 'Bom trabalho! Sua taxa de economia está dentro do recomendado.'
                : 'Atenção! Sua taxa de economia está abaixo do recomendado.'}
            </p>
          </div>

          {/* Principais Categorias */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Principais Categorias de Gastos</h4>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: insight.color }}></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{insight.category}</span>
                    {insight.isHighest && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded">
                        Maior gasto
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">R$ {insight.amount.toFixed(2)}</span>
                    <div className="flex items-center">
                      {insight.change > 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-red-500 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-green-500 mr-0.5" />
                      )}
                      <span className={`text-xs ${
                        insight.change > 0 ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {Math.abs(insight.change)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recomendações */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1 text-blue-500" />
              Recomendações Personalizadas
            </h4>
            <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
