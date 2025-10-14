import React, { useState, useEffect, useCallback } from 'react';
import { User, ChartData } from '../../types';
import { getPredictiveAnalytics } from '../../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface InsightsViewProps {
  user: User;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

const InsightsView: React.FC<InsightsViewProps> = ({ user }) => {
  const [analytics, setAnalytics] = useState<{ suggestions: string[], chartData: ChartData[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async (currentUser) => {
    setLoading(true);
    await new Promise(res => setTimeout(res, 500));
    const data = await getPredictiveAnalytics(currentUser.role);
    setAnalytics(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAnalytics(user);
  }, [user, fetchAnalytics]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Predictive Analytics Dashboard</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6">AI-generated forecasts and suggestions to improve outcomes.</p>
      
      <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10 mb-6 card-hover-effect">
        {loading ? (
            <div className="w-full h-72 bg-gray-300/30 dark:bg-gray-700/50 rounded-lg animate-pulse flex items-end p-4">
              <div className="flex-1 h-3/4 bg-gray-400/50 dark:bg-gray-600 rounded-t-md mx-2"></div>
              <div className="flex-1 h-1/2 bg-gray-400/50 dark:bg-gray-600 rounded-t-md mx-2"></div>
              <div className="flex-1 h-2/3 bg-gray-400/50 dark:bg-gray-600 rounded-t-md mx-2"></div>
              <div className="flex-1 h-full bg-gray-400/50 dark:bg-gray-600 rounded-t-md mx-2"></div>
              <div className="flex-1 h-1/3 bg-gray-400/50 dark:bg-gray-600 rounded-t-md mx-2"></div>
            </div>
        ) : (
            <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.chartData}>
                <XAxis dataKey="name" stroke={'#9ca3af'} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={'#9ca3af'} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                    cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
                    contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(200, 200, 200, 0.5)', 
                        borderRadius: '0.75rem' 
                    }}
                    labelStyle={{ color: '#1f2937' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={true}>
                    {analytics?.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
            </div>
        )}
      </div>

      <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10 card-hover-effect">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">AI-Powered Suggestions</h2>
        {loading ? (
           <div className="space-y-3 animate-pulse">
             {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-300/30 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-4 h-4 rounded-full bg-gray-400/50 dark:bg-gray-600 mt-1"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-400/50 dark:bg-gray-600 rounded-full w-full"></div>
                        <div className="h-4 bg-gray-400/50 dark:bg-gray-600 rounded-full w-5/6"></div>
                    </div>
                </div>
             ))}
           </div>
        ) : (
          <ul className="space-y-3">
            {analytics?.suggestions.map((suggestion, index) => (
              <li 
                key={index} 
                className="flex items-start gap-3 p-3 bg-lime-500/10 rounded-lg border border-lime-500/20 animate-list-item-enter"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="text-lime-600 dark:text-lime-400 font-bold mt-1">▶</span>
                <p className="text-gray-700 dark:text-gray-200">{suggestion}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default InsightsView;