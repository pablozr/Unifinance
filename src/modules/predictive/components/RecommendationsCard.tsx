'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  BarChart4,
  Clock,
  ArrowRight
} from 'lucide-react';
import { FinancialRecommendation } from '../types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

interface RecommendationsCardProps {
  recommendations: FinancialRecommendation[];
  title?: string;
  description?: string;
  limit?: number;
  onViewDetails?: (recommendation: FinancialRecommendation) => void;
}

export function RecommendationsCard({
  recommendations,
  title = "Personalized Recommendations",
  description = "AI-powered suggestions to improve your financial health",
  limit = 3,
  onViewDetails
}: RecommendationsCardProps) {
  const { t, language } = useLanguage();

  // Limit the number of recommendations shown
  const limitedRecommendations = recommendations.slice(0, limit);

  // Get icon for recommendation type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'saving': return <PiggyBank className="h-5 w-5" />;
      case 'spending': return <Wallet className="h-5 w-5" />;
      case 'budget': return <BarChart4 className="h-5 w-5" />;
      case 'investment': return <TrendingUp className="h-5 w-5" />;
      default: return <Wallet className="h-5 w-5" />;
    }
  };

  // Get badge color for difficulty
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Get badge for time frame
  const getTimeFrameBadge = (timeFrame: string) => {
    switch (timeFrame) {
      case 'immediate':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t('predictive.immediate')}</Badge>;
      case 'short-term':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t('predictive.shortTerm')}</Badge>;
      case 'long-term':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t('predictive.longTerm')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {limitedRecommendations.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {t('predictive.noRecommendations')}
          </p>
        ) : (
          <div className="space-y-4">
            {limitedRecommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="flex flex-col space-y-3 p-4 border rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    {getTypeIcon(recommendation.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{recommendation.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {recommendation.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t('predictive.potentialImpact')}:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(recommendation.potentialImpact)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(recommendation.difficulty)}`}
                    >
                      {t(`predictive.${recommendation.difficulty}`)}
                    </span>
                    {getTimeFrameBadge(recommendation.timeFrame)}
                  </div>
                </div>

                {onViewDetails && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => onViewDetails(recommendation)}
                  >
                    {t('predictive.viewDetails')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
