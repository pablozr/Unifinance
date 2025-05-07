import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Calculator, TrendingUp, Info } from 'lucide-react';

interface FinancialConceptCardProps {
  title: string;
  description: string;
  importance: string;
  tips: string[];
  formula?: string;
  example?: string;
  benchmarks?: Record<string, string>;
}

export function FinancialConceptCard({
  title,
  description,
  importance,
  tips,
  formula,
  example,
  benchmarks
}: FinancialConceptCardProps) {
  return (
    <Card className="w-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <CardHeader className="p-4 pb-2 bg-primary/5 border-b border-gray-100 dark:border-gray-700">
        <CardTitle className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Descrição */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>

          {/* Fórmula (se disponível) */}
          {formula && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center mb-1">
                <Calculator className="h-4 w-4 mr-1" />
                Fórmula
              </h4>
              <p className="text-sm font-mono bg-white dark:bg-gray-800 p-2 rounded border border-blue-100 dark:border-blue-800">
                {formula}
              </p>
              {example && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  <span className="font-medium">Exemplo:</span> {example}
                </p>
              )}
            </div>
          )}

          {/* Importância */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center mb-1">
              <Info className="h-4 w-4 mr-1 text-blue-500" />
              Importância
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{importance}</p>
          </div>

          {/* Benchmarks (se disponíveis) */}
          {benchmarks && Object.keys(benchmarks).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center mb-1">
                <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                Referências
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(benchmarks).map(([key, value], index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dicas */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dicas Práticas
            </h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
