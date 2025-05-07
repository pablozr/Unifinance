'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/language-context'

interface MiniChartProps {
  title: string
  data: Array<{
    name: string
    value: number
    color?: string
  }>
  type?: 'bar' | 'horizontal'
  height?: number
  valuePrefix?: string
  valueSuffix?: string
}

export const MiniChart: React.FC<MiniChartProps> = ({
  title,
  data,
  type = 'bar',
  height = 200,
  valuePrefix = '',
  valueSuffix = ''
}) => {
  const { t } = useLanguage();
  // Formatar os valores para exibição
  const formatValue = (value: number) => {
    return `${valuePrefix}${value.toLocaleString('pt-BR')}${valueSuffix}`
  }

  return (
    <Card className="w-full overflow-hidden border border-border bg-card shadow-sm">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout={type === 'horizontal' ? 'vertical' : 'horizontal'}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <XAxis
                dataKey={type === 'horizontal' ? 'value' : 'name'}
                type={type === 'horizontal' ? 'number' : 'category'}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                dataKey={type === 'horizontal' ? 'name' : 'value'}
                type={type === 'horizontal' ? 'category' : 'number'}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                formatter={(value: number) => [formatValue(value), t('charts.value')]}
                labelFormatter={(label) => `${label}`}
              />
              <Bar
                dataKey="value"
                fill="var(--chart-1)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
