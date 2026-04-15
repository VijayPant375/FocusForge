import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RadialChart({ habits }) {
  const COLORS = ['#8b5cf6', '#ec4899', '#38bdf8', '#10b981', '#f59e0b', '#6366f1'];

  const data = habits ? habits.reduce((acc, habit) => {
    const existing = acc.find(item => item.name === habit.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: habit.category, value: 1 });
    }
    return acc;
  }, []) : [];

  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>No categories yet</div>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--tooltip-bg)', 
              borderColor: 'var(--tooltip-border)',
              borderRadius: '8px',
              color: '#f8fafc',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }} 
            itemStyle={{ color: '#e2e8f0' }}
          />
          <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
