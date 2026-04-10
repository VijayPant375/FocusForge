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
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 h-[320px] flex items-center justify-center">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-4">Weekly Progress</h3>
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="day" 
              stroke="#94a3b8" 
              tick={{fill: '#94a3b8'}} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#94a3b8" 
              tick={{fill: '#94a3b8'}} 
              tickLine={false} 
              axisLine={false} 
              allowDecimals={false} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
              itemStyle={{ color: '#8b5cf6' }}
              cursor={{fill: '#334155'}}
            />
            <Bar 
              dataKey="completed" 
              fill="#8b5cf6" 
              radius={[4, 4, 0, 0]} 
              name="Completed Habits" 
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default WeeklyChart;
