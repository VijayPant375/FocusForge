import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { analyticsAPI } from '../api';

function WeeklyChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        const response = await analyticsAPI.getWeekly();
        
        // Format the dates to be more readable (e.g., 'Mon', 'Tue' instead of '2023-10-25')
        const formattedData = response.data.weekData.map(item => {
          // Adjust for timezone offset properly by appending time
          const dateObj = new Date(item.date + 'T00:00:00');
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          return {
            ...item,
            day: dayName
          };
        });
        
        setData(formattedData);
      } catch (err) {
        console.error('Error fetching weekly data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeeklyData();
  }, []);

  if (loading) {
    return (
      <div className="h-[250px] flex items-center justify-center">
        <div style={{ color: 'var(--text-secondary)' }}>Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="h-64 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} opacity={0.5} />
          <XAxis 
            dataKey="day" 
            stroke="var(--text-secondary)" 
            tick={{fill: 'var(--text-secondary)'}} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="var(--text-secondary)" 
            tick={{fill: 'var(--text-secondary)'}} 
            tickLine={false} 
            axisLine={false} 
            allowDecimals={false} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px' }}
            itemStyle={{ color: 'var(--accent-1)' }}
            cursor={{fill: 'var(--glass-border)', opacity: 0.2}}
          />
          <Bar 
            dataKey="completed" 
            fill="var(--accent-1)" 
            radius={[4, 4, 0, 0]} 
            name="Completed Habits" 
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default WeeklyChart;
