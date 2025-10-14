
import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Recommendation } from '../../types';
import { getRecommendationsForRole } from '../../services/geminiService';
import { BoltIcon } from '../icons';

interface OverviewTabProps {
  role: UserRole;
}

const RecommendationCard: React.FC<{ recommendation: Recommendation }> = ({ recommendation }) => (
    <div className="bg-white/5 p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-1.5 bg-teal-500/20 rounded-full">
                <BoltIcon className="w-5 h-5 text-teal-400" />
            </div>
            <h3 className="font-semibold text-lg">{recommendation.title}</h3>
        </div>
        <p className="text-gray-300 text-sm">{recommendation.description}</p>
        <span className="mt-3 inline-block bg-teal-500/20 text-teal-300 text-xs font-medium px-2 py-1 rounded-full">{recommendation.category}</span>
    </div>
);

const OverviewTab: React.FC<OverviewTabProps> = ({ role }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = useCallback(async (currentRole: UserRole) => {
    setLoading(true);
    const data = await getRecommendationsForRole(currentRole);
    setRecommendations(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecommendations(role);
  }, [role, fetchRecommendations]);

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold mb-2">Welcome, {role}!</h2>
      <p className="text-gray-400 mb-6">Here's your personalized overview and AI-powered recommendations.</p>

      <h3 className="text-xl font-semibold mb-4">AI Recommendations for You</h3>
      {loading ? (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/5 p-4 rounded-lg border border-white/10 animate-pulse">
                <div className="h-6 bg-gray-600 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                <div className="mt-3 h-5 bg-gray-600 rounded-full w-1/4"></div>
              </div>
            ))}
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec, index) => (
            <RecommendationCard key={index} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
