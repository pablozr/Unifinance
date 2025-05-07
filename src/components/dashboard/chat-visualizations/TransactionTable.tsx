'use client'

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/language-context'

interface Transaction {
  descricao: string
  valor: number
  categoria: string
  data: string
  tipo?: 'receita' | 'despesa'
}

interface TransactionTableProps {
  title: string
  transactions: Transaction[]
  showType?: boolean
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  title,
  transactions,
  showType = false
}) => {
  const { t, language } = useLanguage();
  return (
    <Card className="w-full overflow-hidden border border-border bg-card shadow-sm">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[300px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('transactions.description')}</TableHead>
                <TableHead>{t('transactions.amount')}</TableHead>
                <TableHead>{t('transactions.category')}</TableHead>
                <TableHead>{t('transactions.date')}</TableHead>
                {showType && <TableHead>{t('transactions.type')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{transaction.descricao}</TableCell>
                  <TableCell className={transaction.tipo === 'despesa' ? 'text-red-500' : 'text-green-500'}>
                    {transaction.tipo === 'despesa' ? '-' : '+'}
                    R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.categoria}</Badge>
                  </TableCell>
                  <TableCell>{transaction.data}</TableCell>
                  {showType && (
                    <TableCell>
                      <Badge variant={transaction.tipo === 'despesa' ? 'destructive' : 'default'}>
                        {transaction.tipo === 'despesa' ? t('transactions.expense') : t('transactions.income')}
                      </Badge>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
