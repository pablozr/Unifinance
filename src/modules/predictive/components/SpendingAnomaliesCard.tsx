'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SpendingAnomaly } from '../types';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

interface SpendingAnomaliesCardProps {
  anomalies: SpendingAnomaly[];
  title?: string;
  description?: string;
  limit?: number;
}

export function SpendingAnomaliesCard({
  anomalies,
  title = "Unusual Spending",
  description = "Transactions that deviate from your normal spending patterns",
  limit = 5
}: SpendingAnomaliesCardProps) {
  const { t } = useLanguage();

  // Limit the number of anomalies shown
  const limitedAnomalies = anomalies.slice(0, limit);

  // Get severity badge color
  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {limitedAnomalies.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {t('predictive.noAnomalies')}
          </p>
        ) : (
          <div className="space-y-4">
            {limitedAnomalies.map((anomaly) => (
              <div
                key={anomaly.transactionId}
                className="flex flex-col space-y-2 p-3 border rounded-lg"
                style={{ borderLeftColor: anomaly.categoryColor, borderLeftWidth: '4px' }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{anomaly.description}</h4>
                    <p className="text-sm text-muted-foreground">
                      {anomaly.categoryName} • {new Date(anomaly.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={getSeverityColor(anomaly.severity)}>
                    {anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('transactions.amount')}</p>
                    <p className="font-medium">{formatCurrency(anomaly.amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('predictive.expectedAmount')}</p>
                    <p className="font-medium">{formatCurrency(anomaly.expectedAmount)}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground">{t('predictive.deviation')}</p>
                  <p className={`font-medium ${anomaly.percentageDeviation > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {anomaly.percentageDeviation > 0 ? '+' : ''}
                    {anomaly.percentageDeviation.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
