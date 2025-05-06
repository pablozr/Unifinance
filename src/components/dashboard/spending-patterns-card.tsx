'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SpendingPattern } from '@/lib/financial-analysis';
import { AlertCircleIcon, ArrowUpIcon, RefreshCwIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';

interface SpendingPatternsCardProps {
  patterns: {
    recurring: SpendingPattern[];
    unusual: SpendingPattern[];
  };
  categories: any[]; // Replace with your category type
}

export function SpendingPatternsCard({ patterns, categories }: SpendingPatternsCardProps) {
  // Helper to get category name from ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  // Helper to get pattern icon
  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'recurring':
        return <RefreshCwIcon className="h-4 w-4 text-blue-500" />;
      case 'unusual':
        return <AlertCircleIcon className="h-4 w-4 text-orange-500" />;
      case 'increasing':
        return <TrendingUpIcon className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDownIcon className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  // Helper to get pattern badge color
  const getPatternBadgeColor = (type: string) => {
    switch (type) {
      case 'recurring':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'unusual':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'increasing':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'decreasing':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Spending Patterns</CardTitle>
        <CardDescription>
          Insights into your spending habits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recurring" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recurring">
              Recurring Expenses
              {patterns.recurring.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {patterns.recurring.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unusual">
              Unusual Spending
              {patterns.unusual.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {patterns.unusual.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="recurring" className="mt-4">
            {patterns.recurring.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No recurring expenses detected
              </div>
            ) : (
              <div className="space-y-3">
                {patterns.recurring.map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getPatternIcon(pattern.type)}
                      <div>
                        <h4 className="text-sm font-medium">{pattern.description}</h4>
                        <p className="text-xs text-gray-500">
                          {getCategoryName(pattern.categoryId)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {formatCurrency(pattern.amount)}
                      </div>
                      <Badge className={`text-xs ${getPatternBadgeColor(pattern.type)}`}>
                        Monthly
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="unusual" className="mt-4">
            {patterns.unusual.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No unusual spending detected
              </div>
            ) : (
              <div className="space-y-3">
                {patterns.unusual.map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getPatternIcon(pattern.type)}
                      <div>
                        <h4 className="text-sm font-medium">{pattern.description}</h4>
                        <p className="text-xs text-gray-500">
                          {getCategoryName(pattern.categoryId)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {formatCurrency(pattern.amount)}
                      </div>
                      {pattern.change && (
                        <div className="flex items-center justify-end text-xs text-red-500">
                          <ArrowUpIcon className="h-3 w-3 mr-1" />
                          {pattern.change}% above average
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
