import React from 'react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import type { ChartData } from '@workspace/api-client-react/src/generated/api.schemas';

interface DynamicChartProps {
  chart: ChartData;
}

const COLORS = [
  'hsl(188 86% 53%)', // cyan
  'hsl(260 80% 65%)', // purple
  'hsl(150 70% 50%)', // green
  'hsl(40 90% 60%)',  // orange
  'hsl(330 80% 65%)', // pink
];

export function DynamicChart({ chart }: DynamicChartProps) {
  const { type, data, xKey, yKey, keys, title } = chart;

  if (!data || data.length === 0) return null;

  // Infer keys if not provided
  const plotKeys = keys || (yKey ? [yKey] : Object.keys(data[0] || {}).filter(k => k !== xKey));
  const xAxisKey = xKey || Object.keys(data[0] || {})[0];

  const renderTooltip = () => (
    <Tooltip 
      contentStyle={{ 
        backgroundColor: 'hsl(var(--popover))', 
        borderColor: 'hsl(var(--border))',
        borderRadius: '0.5rem',
        color: 'hsl(var(--foreground))'
      }} 
      itemStyle={{ color: 'hsl(var(--foreground))' }}
    />
  );

  const renderChartType = () => {
    switch (type) {
      case 'bar':
      case 'histogram':
        return (
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
            {renderTooltip()}
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {plotKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
      
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
            {renderTooltip()}
            <Legend />
            {plotKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{ r: 4, fill: COLORS[i % COLORS.length], strokeWidth: 0 }} activeDot={{ r: 6 }} />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
            {renderTooltip()}
            <Legend />
            {plotKeys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} fill={COLORS[i % COLORS.length]} stroke={COLORS[i % COLORS.length]} fillOpacity={0.3} />
            ))}
          </AreaChart>
        );

      case 'scatter':
        return (
          <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xAxisKey} type="number" name={xAxisKey} stroke="hsl(var(--muted-foreground))" />
            <YAxis dataKey={plotKeys[0]} type="number" name={plotKeys[0]} stroke="hsl(var(--muted-foreground))" />
            {renderTooltip()}
            <Scatter name={title} data={data} fill={COLORS[0]} />
          </ScatterChart>
        );

      case 'pie':
        return (
          <PieChart>
            {renderTooltip()}
            <Legend />
            <Pie
              data={data}
              dataKey={plotKeys[0]}
              nameKey={xAxisKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={60}
              paddingAngle={5}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="hsl(var(--background))" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        );

      default:
        return (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Chart type '{type}' is not supported yet.
          </div>
        );
    }
  };

  return (
    <div className="w-full my-6 bg-card border border-border/50 rounded-xl p-4 shadow-lg shadow-black/20">
      {title && <h4 className="text-sm font-semibold mb-4 text-foreground/80 px-2">{title}</h4>}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChartType()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
