import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../../../components/ui/Card';

export function CostOverviewCard({ data, totalBudget }) {
  // We format the data to be consumed by Recharts (it expects an array of objects)
  // Our mock data is already an array of {name, value, fill}
  
  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Cost Overview</h3>
          <p className="text-sm text-text-secondary mt-1">Budget vs Spent (Cr)</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-text-secondary">Total Budget</p>
          <p className="text-xl font-bold text-text-primary">{totalBudget}</p>
        </div>
      </div>
      
      <div className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border)" />
            <XAxis 
              type="number" 
              hide 
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} 
              width={110}
            />
            <Tooltip 
              cursor={{ fill: 'var(--color-surface-muted)' }}
              contentStyle={{ 
                backgroundColor: 'var(--color-surface)', 
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-level-2)',
                fontSize: '12px'
              }}
              formatter={(value) => [`₹${value} Cr`, 'Amount']}
            />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]} 
              barSize={24}
              label={{ position: 'right', fill: 'var(--color-text-primary)', fontSize: 12, formatter: (val) => `₹${val}` }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill || 'var(--color-primary)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
