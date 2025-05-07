'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PlusIcon, BarChartIcon, PieChartIcon, ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface ActionButtonsProps {
  onAddTransaction?: () => void
  onViewTransactions?: () => void
  onViewAnalytics?: () => void
  onViewIncome?: () => void
  onViewExpenses?: () => void
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onAddTransaction,
  onViewTransactions,
  onViewAnalytics,
  onViewIncome,
  onViewExpenses
}) => {
  const { t } = useLanguage();
  return (
    <Card className="w-full overflow-hidden border border-border bg-card shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          {onAddTransaction && (
            <Button
              size="sm"
              onClick={onAddTransaction}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <PlusIcon className="mr-1 h-4 w-4" />
              {t('dashboard.addTransaction')}
            </Button>
          )}

          {onViewTransactions && (
            <Button
              size="sm"
              variant="outline"
              onClick={onViewTransactions}
            >
              <BarChartIcon className="mr-1 h-4 w-4" />
              {t('transactions.viewAll')}
            </Button>
          )}

          {onViewAnalytics && (
            <Button
              size="sm"
              variant="outline"
              onClick={onViewAnalytics}
            >
              <PieChartIcon className="mr-1 h-4 w-4" />
              {t('reports.viewAnalytics')}
            </Button>
          )}

          {onViewIncome && (
            <Button
              size="sm"
              variant="outline"
              onClick={onViewIncome}
              className="text-green-500 border-green-500 hover:bg-green-500/10"
            >
              <ArrowUpIcon className="mr-1 h-4 w-4" />
              {t('dashboard.income')}
            </Button>
          )}

          {onViewExpenses && (
            <Button
              size="sm"
              variant="outline"
              onClick={onViewExpenses}
              className="text-red-500 border-red-500 hover:bg-red-500/10"
            >
              <ArrowDownIcon className="mr-1 h-4 w-4" />
              {t('dashboard.expenses')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
