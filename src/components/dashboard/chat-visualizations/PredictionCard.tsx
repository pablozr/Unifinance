import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface PredictionData {
  month: string;
  value: number;
  predicted: boolean;
}

interface PredictionCardProps {
  title: string;
  description: string;
  data: PredictionData[];
  valuePrefix?: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  insights: string[];
}

export function PredictionCard({
  title,
  description,
  data,
  valuePrefix = '',
  trend,
  trendPercentage,
  insights
}: PredictionCardProps) {
  // Encontrar o índice onde começa a previsão
  const predictionStartIndex = data.findIndex(item => item.predicted);

  // Formatar valores para o tooltip
  const formatValue = (value: number) => {
    return `${valuePrefix}${value.toFixed(2)}`;
  };

  // Customizar tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isPredicted = data.find(item => item.month === label)?.predicted;
      
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 shadow-sm rounded text-sm">
          <p className="font-medium text-gray-800 dark:text-gray-200">{label}</p>
          <p style={{ color: isPredicted ? '#8b5cf6' : '#3b82f6' }}>
            {isPredicted ? 'Previsto: ' : 'Valor: '}
            {formatValue(payload[0].value)}
          </p>
          {isPredicted && (
            <div className="flex items-center text-xs text-purple-500 mt-1">
              <span className="mr-1">Previsão</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <CardHeader className="p-4 pb-2 bg-primary/5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium text-gray-800 dark:text-gray-200">{title}</CardTitle>
          <div className="flex items-center">
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
            ) : null}
            <span className={`text-sm font-medium ${
              trend === 'up' ? 'text-red-500' : 
              trend === 'down' ? 'text-green-500' : 
              'text-gray-500 dark:text-gray-400'
            }`}>
              {Math.abs(trendPercentage).toFixed(1)}%
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="month" 
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${valuePrefix}${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => <span className="text-gray-700 dark:text-gray-300">
                  {value === 'value' ? 'Valor' : value}
                </span>}
              />
              
              {/* Linha para dados históricos */}
              <Line 
                type="monotone" 
                dataKey="value" 
                name="Valor"
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 1 }}
                activeDot={{ r: 6, strokeWidth: 1 }}
              />
              
              {/* Linha pontilhada para previsão */}
              {predictionStartIndex > 0 && (
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name="Previsão"
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4, strokeWidth: 1 }}
                  activeDot={{ r: 6, strokeWidth: 1 }}
                  data={data.slice(predictionStartIndex)}
                />
              )}
              
              {/* Linha de referência onde começa a previsão */}
              {predictionStartIndex > 0 && (
                <ReferenceLine 
                  x={data[predictionStartIndex].month} 
                  stroke="#8b5cf6" 
                  strokeDasharray="3 3"
                  label={{ 
                    value: 'Previsão', 
                    position: 'top',
                    fill: '#8b5cf6',
                    fontSize: 12
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Insights:</h4>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
