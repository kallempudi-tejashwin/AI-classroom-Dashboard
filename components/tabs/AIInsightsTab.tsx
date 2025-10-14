
import React, { useState, useEffect, useCallback } from 'react';
// Fix: Add necessary type imports for analytics data.
import { User, UserRole, ChartData, Grade, Announcement, LeaveRequest, CommunicationLog } from '../../types';
import { getPredictiveAnalytics } from '../../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Fix: Update props to include all data required for predictive analytics.
interface AIInsightsTabProps {
  user: User;
  allUsers: User[];
  grades: Grade[];
  announcements: Announcement[];
  leaveRequests: LeaveRequest[];
  communicationLogs: CommunicationLog[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AIInsightsTab: React.FC<AIInsightsTabProps> = ({ user, allUsers, grades, announcements, leaveRequests, communicationLogs }) => {
  const [analytics, setAnalytics] = useState<{ suggestions: string[], chartData: ChartData[] } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fix: Call getPredictiveAnalytics with the full AnalyticsData object as required.
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const data = await getPredictiveAnalytics({
      currentUser: user,
      allUsers,
      grades,
      announcements,
      leaveRequests,
      communicationLogs,
    });
    setAnalytics(data);
    setLoading(false);
  }, [user, allUsers, grades, announcements, leaveRequests, communicationLogs]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-4">Predictive Analytics Dashboard</h2>
      <p className="text-gray-400 mb-6">AI-generated forecasts and suggestions to improve outcomes.</p>
      
      {loading ? (
        <div className="w-full h-64 bg-white/5 rounded-lg animate-pulse"></div>
      ) : (
        <div className="w-full h-72 p-4 bg-white/5 rounded-lg border border-white/10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics?.chartData}>
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#d1d5db' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {analytics?.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-3">AI-Powered Suggestions</h3>
        {loading ? (
           <div className="space-y-3">
             <div className="h-8 bg-white/5 rounded-lg animate-pulse"></div>
             <div className="h-8 bg-white/5 rounded-lg animate-pulse w-5/6"></div>
           </div>
        ) : (
          <ul className="space-y-3">
            {analytics?.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                <span className="text-lime-400 font-bold mt-1">▶</span>
                <p className="text-gray-200">{suggestion}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AIInsightsTab;
