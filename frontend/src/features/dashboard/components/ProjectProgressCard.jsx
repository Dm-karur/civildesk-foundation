import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../../../components/ui/Card';

export function ProjectProgressCard({ data }) {
  // Calculate total for percentage display
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="flex flex-col h-full">
      <h3 className="text-base font-semibold text-text-primary mb-4">Project Progress</h3>
      
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 py-2">
        <div className="w-full md:w-1/2 min-h-[220px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-surface)', 
                  borderColor: 'var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-level-2)',
                  fontSize: '12px'
                }}
                itemStyle={{ color: 'var(--color-text-primary)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-text-primary">{total}</span>
            <span className="text-xs text-text-secondary">Projects</span>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 flex flex-col justify-center gap-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-text-secondary">{item.name}</span>
              </div>
              <span className="font-medium text-text-primary">
                {Math.round((item.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
