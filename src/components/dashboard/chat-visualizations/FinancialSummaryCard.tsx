'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownIcon, ArrowUpIcon, DollarSignIcon, PercentIcon } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface FinancialSummaryCardProps {
  title: string
  totalIncome: number
  totalExpenses: number
  balance: number
  savingsRate: number
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  title,
  totalIncome,
  totalExpenses,
  balance,
  savingsRate
}) => {
  const { t, language } = useLanguage();
  return (
    <Card className="w-full overflow-hidden border border-border bg-card shadow-sm">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">{t('dashboard.income')}</span>
            <div className="flex items-center">
              <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
              <span className="font-medium text-green-500">
                R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">{t('dashboard.expenses')}</span>
            <div className="flex items-center">
              <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
              <span className="font-medium text-red-500">
                R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">{t('dashboard.balance')}</span>
            <div className="flex items-center">
              <DollarSignIcon className="mr-1 h-4 w-4 text-primary" />
              <span className={`font-medium ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">{t('dashboard.savingsRate')}</span>
            <div className="flex items-center">
              <PercentIcon className="mr-1 h-4 w-4 text-primary" />
              <span className={`font-medium ${savingsRate >= 20 ? 'text-green-500' : savingsRate >= 10 ? 'text-yellow-500' : 'text-red-500'}`}>
                {savingsRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
