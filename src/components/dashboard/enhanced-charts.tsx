'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/language-context';

interface ChartData {
  name: string;
  income?: number;
  expense?: number;
  value?: number;
  color?: string;
}

interface EnhancedChartsProps {
  monthlyData: ChartData[];
  yearlyData: ChartData[];
  categoryData: ChartData[];
}

export function EnhancedCharts({ monthlyData, yearlyData, categoryData }: EnhancedChartsProps) {
  const [chartType, setChartType] = useState<'bar' | 'area' | 'line'>('bar');
  const { t } = useLanguage();

  // Custom tooltip formatter for currency values
  const currencyFormatter = (value: number) => formatCurrency(value);

  // Generate colors for pie chart if not provided
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">{t('charts.financialOverview')}</CardTitle>
          <Select
            value={chartType}
            onValueChange={(value: 'bar' | 'area' | 'line') => setChartType(value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t('charts.chartType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">{t('charts.barChart')}</SelectItem>
              <SelectItem value="area">{t('charts.areaChart')}</SelectItem>
              <SelectItem value="line">{t('charts.lineChart')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription>
          {t('charts.interactiveVisualization')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monthly">{t('charts.monthly')}</TabsTrigger>
            <TabsTrigger value="yearly">{t('charts.yearly')}</TabsTrigger>
            <TabsTrigger value="category">{t('charts.byCategory')}</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' && (
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={currencyFormatter} />
                    <RechartsTooltip
                      formatter={currencyFormatter}
                      labelFormatter={(label) => `${t('charts.month')}: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="income" fill="#4CAF50" name={t('dashboard.income')} />
                    <Bar dataKey="expense" fill="#F44336" name={t('dashboard.expenses')} />
                  </BarChart>
                )}

                {chartType === 'area' && (
                  <AreaChart
                    data={monthlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={currencyFormatter} />
                    <RechartsTooltip
                      formatter={currencyFormatter}
                      labelFormatter={(label) => `${t('charts.month')}: ${label}`}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="income" stackId="1" stroke="#4CAF50" fill="#4CAF50" name={t('dashboard.income')} />
                    <Area type="monotone" dataKey="expense" stackId="2" stroke="#F44336" fill="#F44336" name={t('dashboard.expenses')} />
                  </AreaChart>
                )}

                {chartType === 'line' && (
                  <LineChart
                    data={monthlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={currencyFormatter} />
                    <RechartsTooltip
                      formatter={currencyFormatter}
                      labelFormatter={(label) => `${t('charts.month')}: ${label}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#4CAF50" name={t('dashboard.income')} />
                    <Line type="monotone" dataKey="expense" stroke="#F44336" name={t('dashboard.expenses')} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="yearly" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' && (
                  <BarChart
                    data={yearlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={currencyFormatter} />
                    <RechartsTooltip
                      formatter={currencyFormatter}
                      labelFormatter={(label) => `${t('charts.year')}: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="income" fill="#4CAF50" name={t('dashboard.income')} />
                    <Bar dataKey="expense" fill="#F44336" name={t('dashboard.expenses')} />
                  </BarChart>
                )}

                {chartType === 'area' && (
                  <AreaChart
                    data={yearlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={currencyFormatter} />
                    <RechartsTooltip
                      formatter={currencyFormatter}
                      labelFormatter={(label) => `${t('charts.year')}: ${label}`}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="income" stackId="1" stroke="#4CAF50" fill="#4CAF50" name={t('dashboard.income')} />
                    <Area type="monotone" dataKey="expense" stackId="2" stroke="#F44336" fill="#F44336" name={t('dashboard.expenses')} />
                  </AreaChart>
                )}

                {chartType === 'line' && (
                  <LineChart
                    data={yearlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={currencyFormatter} />
                    <RechartsTooltip
                      formatter={currencyFormatter}
                      labelFormatter={(label) => `${t('charts.year')}: ${label}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#4CAF50" name={t('dashboard.income')} />
                    <Line type="monotone" dataKey="expense" stroke="#F44336" name={t('dashboard.expenses')} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="category" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}-${index}`}
                        fill={entry.color || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
