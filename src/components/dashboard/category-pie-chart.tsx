'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface CategoryPieChartProps {
  data: CategoryData[];
  totalAmount: number;
}

const RADIAN = Math.PI / 180;

// Custom label renderer for the pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show label if percentage is significant (> 5%)
  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-blue-900/90 p-3 rounded-lg border border-blue-500/30 shadow-lg backdrop-blur-md">
        <p className="text-sm font-medium text-white">{data.name}</p>
        <p className="text-xs text-blue-300">${data.value.toFixed(2)}</p>
        <p className="text-xs text-blue-300">{(data.percent * 100).toFixed(1)}%</p>
      </div>
    );
  }

  return null;
};

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data, totalAmount }) => {
  // If no data or total amount is 0, show empty state
  if (!data || data.length === 0 || totalAmount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-blue-300/80">
        <p>No expense data available for this period</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            formatter={(value, entry, index) => (
              <span className="text-xs text-blue-100">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
