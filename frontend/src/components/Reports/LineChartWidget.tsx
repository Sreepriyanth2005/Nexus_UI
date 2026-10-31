import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface LineChartWidgetProps {
  title: string;
  data: any[];
  xKey: string;
  yKey: string;
  unit?: string;
  rightAction?: React.ReactNode;
  color?: string;
  variant?: 'default' | 'bare';
}

export const LineChartWidget: React.FC<LineChartWidgetProps> = ({
  title,
  data,
  xKey,
  yKey,
  unit,
  rightAction,
  color = '#d97706', // amber-600 default
  variant = 'default'
}) => {
  const isBare = variant === 'bare';
  const containerClass = isBare 
    ? "flex flex-col h-full w-full" 
    : "bg-[var(--paper)] rounded-[var(--r-lg)] border border-[var(--line)] py-[22px] px-[24px] flex flex-col h-full shadow-[var(--shadow-sm)]";

  return (
    <div className={containerClass}>
      {!isBare && (
        <div className="flex justify-between items-center mb-3.5">
          <h3 className="text-[var(--ink)] font-[var(--fw-semibold)] text-[length:var(--fs-h3)]">{title}</h3>
          {rightAction}
        </div>
      )}
      
      <div className="flex-1 h-64 w-full [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none [&_*]:!outline-none">
        <ResponsiveContainer width="100%" height="100%" className="!outline-none">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ outline: 'none' }} className="!outline-none">
            <defs>
              <linearGradient id={`color-${yKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey={xKey} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#9ca3af' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid #e5e7eb', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                backgroundColor: '#ffffff',
                fontSize: '12px',
                padding: '8px 12px'
              }}
              formatter={(value: any) => [
                unit ? `${typeof value === 'number' ? value.toFixed(1) : value} ${unit}` : (typeof value === 'number' ? value.toLocaleString() : value),
                title || yKey
              ]}
            />
            <Area 
              type="monotone" 
              dataKey={yKey} 
              stroke={color} 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill={`url(#color-${yKey})`} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

