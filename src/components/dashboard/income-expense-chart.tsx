'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  income: number;
  expense: number;
}

interface IncomeExpenseChartProps {
  data: ChartData[];
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-blue-900/90 p-3 rounded-lg border border-blue-500/30 shadow-lg backdrop-blur-md">
        <p className="text-sm font-medium text-white mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: ${entry.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ data }) => {
  // If no data, show empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-blue-300/80">
        <p>No transaction data available for this period</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.2)" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#93c5fd' }} 
            axisLine={{ stroke: 'rgba(59, 130, 246, 0.3)' }}
          />
          <YAxis 
            tick={{ fill: '#93c5fd' }} 
            axisLine={{ stroke: 'rgba(59, 130, 246, 0.3)' }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            formatter={(value, entry, index) => (
              <span className="text-xs text-blue-100">{value}</span>
            )}
          />
          <Bar dataKey="income" name="Income" fill="#4ade80" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Expense" fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
