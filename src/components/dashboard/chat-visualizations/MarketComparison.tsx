import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ComparisonData {
  category: string;
  userValue: number;
  marketAverage: number;
  color: string;
}

interface MarketComparisonProps {
  title: string;
  description: string;
  data: ComparisonData[];
  valuePrefix?: string;
}

export function MarketComparison({
  title,
  description,
  data,
  valuePrefix = ''
}: MarketComparisonProps) {
  // Preparar dados para o gráfico
  const chartData = data.map(item => ({
    name: item.category,
    Você: item.userValue,
    Média: item.marketAverage,
    color: item.color
  }));

  // Formatar valores para o tooltip
  const formatValue = (value: number) => {
    return `${valuePrefix}${value.toFixed(2)}`;
  };

  // Customizar tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 shadow-sm rounded text-sm">
          <p className="font-medium text-gray-800 dark:text-gray-200">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`tooltip-${entry.name}-${index}`} style={{ color: entry.color }}>
              {entry.name}: {formatValue(entry.value)}
            </p>
          ))}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {payload[0].value > payload[1].value
              ? 'Você gasta mais que a média'
              : 'Você gasta menos que a média'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <CardHeader className="p-4 pb-2 bg-primary/5 border-b border-gray-100 dark:border-gray-700">
        <CardTitle className="text-lg font-medium text-gray-800 dark:text-gray-200">{title}</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barSize={20}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="name"
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${valuePrefix}${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => <span className="text-gray-700 dark:text-gray-300">{value}</span>}
              />
              <Bar
                dataKey="Você"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Média"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Insights:</h4>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {data.map((item, index) => (
              <li key={`insight-${item.category}-${index}`} className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>
                  {item.userValue > item.marketAverage
                    ? `Seus gastos com ${item.category.toLowerCase()} são ${((item.userValue / item.marketAverage - 1) * 100).toFixed(0)}% maiores que a média.`
                    : `Seus gastos com ${item.category.toLowerCase()} são ${((1 - item.userValue / item.marketAverage) * 100).toFixed(0)}% menores que a média.`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
