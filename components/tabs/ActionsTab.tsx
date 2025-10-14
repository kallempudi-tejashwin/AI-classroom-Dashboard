
import React, { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../../types';
import { getSmartReply } from '../../services/geminiService';

interface ActionsTabProps {
  role: UserRole;
}

const ActionsTab: React.FC<ActionsTabProps> = ({ role }) => {
  const [requestType, setRequestType] = useState('Leave');
  const [reason, setReason] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [notification, setNotification] = useState('');
  
  const handleSmartCompose = async () => {
      setIsComposing(true);
      const prompt = `User role: ${role}, Request type: ${requestType}. Help me write a professional reason for this request.`;
      const smartReason = await getSmartReply(prompt);
      setReason(smartReason);
      setIsComposing(false);
  };

  const fetchNotification = useCallback(async () => {
    const context = `Generate a relevant notification for a ${role}.`;
    const smartNote = await getSmartReply(context);
    setNotification(smartNote);
  }, [role]);

  useEffect(() => {
    fetchNotification();
  }, [fetchNotification]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Request submitted!\nType: ${requestType}\nReason: ${reason}`);
    setReason('');
  };

  return (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Submit a Request</h2>
        <form onSubmit={handleSubmit} className="p-6 bg-white/5 rounded-lg border border-white/10">
          <div className="mb-4">
            <label htmlFor="requestType" className="block text-sm font-medium text-gray-300 mb-1">Request Type</label>
            <select
              id="requestType"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full bg-gray-900/50 border border-white/20 rounded-md px-3 py-2 focus:ring-2 focus:ring-teal-400 focus:outline-none"
            >
              <option>Leave</option>
              <option>Resource</option>
              <option>Technical Help</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-1">Reason / Details</label>
            <textarea
              id="reason"
              rows={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe your request..."
              className="w-full bg-gray-900/50 border border-white/20 rounded-md px-3 py-2 focus:ring-2 focus:ring-teal-400 focus:outline-none"
            />
          </div>
          <div className="flex justify-between items-center">
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-lg shadow-md hover:scale-105 transform transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              Submit Request
            </button>
            <button
              type="button"
              onClick={handleSmartCompose}
              disabled={isComposing}
              className="px-5 py-2 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-600 transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isComposing ? 'Composing...' : '✨ Smart Compose'}
            </button>
          </div>
        </form>
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-4">AI Communication Feed</h2>
        <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="font-semibold text-teal-300 mb-1">Smart Notification</h3>
                {notification ? (
                    <p className="text-gray-200">{notification}</p>
                ) : (
                    <div className="h-5 bg-gray-700 rounded w-full animate-pulse"></div>
                )}
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10 opacity-60">
                <h3 className="font-semibold text-teal-300 mb-1">Reminder: Project Deadline</h3>
                <p className="text-gray-300">Your final project for 'Advanced AI' is due this Friday.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ActionsTab;
