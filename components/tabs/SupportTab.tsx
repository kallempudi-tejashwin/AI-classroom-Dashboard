
import React, { useState } from 'react';
import { getAIDiagnosis } from '../../services/geminiService';

const SupportTab: React.FC = () => {
  const [logs, setLogs] = useState("System logs will appear here...");
  const [isHealing, setIsHealing] = useState(false);
  const [healProgress, setHealProgress] = useState(0);
  const [healStatus, setHealStatus] = useState('');
  const [diagnosis, setDiagnosis] = useState<{ diagnosis: string; solution: string } | null>(null);
  const [isLoadingDiagnosis, setIsLoadingDiagnosis] = useState(false);

  const runDiagnosis = async () => {
    setIsLoadingDiagnosis(true);
    setDiagnosis(null);
    const result = await getAIDiagnosis();
    setDiagnosis(result);
    setLogs(`AI Diagnosis Complete.\n${result.diagnosis}\nRecommendation: ${result.solution}`);
    setIsLoadingDiagnosis(false);
  };
  
  const runSelfHeal = () => {
    setIsHealing(true);
    setHealProgress(0);
    setHealStatus("Initializing self-healing protocol...");

    const interval = setInterval(() => {
      setHealProgress(prev => {
        const next = prev + 10;
        if (next === 30) setHealStatus("Analyzing system integrity...");
        if (next === 60) setHealStatus("Applying AI-generated patch...");
        if (next === 90) setHealStatus("Verifying resolution...");
        if (next >= 100) {
          clearInterval(interval);
          setIsHealing(false);
          setHealStatus("System Optimized. All services are operational.");
          setLogs(prev => prev + "\nSelf-Healing successful.");
          return 100;
        }
        return next;
      });
    }, 400);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-4">Intelligent Debugging Panel</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">System Status</h3>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
            <div className="flex justify-between items-center"><span>API Gateway</span> <span className="text-lime-400 font-bold">Operational</span></div>
            <div className="flex justify-between items-center"><span>Database Connection</span> <span className="text-lime-400 font-bold">Operational</span></div>
            <div className="flex justify-between items-center"><span>Content Delivery Network</span> <span className="text-lime-400 font-bold">Operational</span></div>
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-2">Autonomous Maintenance</h3>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            {isHealing && (
              <div className="mb-4">
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div className="bg-teal-400 h-2.5 rounded-full transition-all duration-300" style={{ width: `${healProgress}%` }}></div>
                </div>
                <p className="text-center text-sm mt-2 text-gray-300">{healStatus}</p>
              </div>
            )}
            {!isHealing && healStatus && <p className="text-center text-lime-400 mb-4">{healStatus}</p>}
            <div className="flex gap-4">
              <button onClick={runDiagnosis} disabled={isLoadingDiagnosis || isHealing} className="flex-1 px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-600 transition-colors disabled:bg-gray-600">
                {isLoadingDiagnosis ? 'Diagnosing...' : 'Run AI Diagnosis'}
              </button>
              <button onClick={runSelfHeal} disabled={isHealing} className="flex-1 px-4 py-2 bg-rose-500 text-white font-semibold rounded-lg shadow-md hover:bg-rose-600 transition-colors disabled:bg-gray-600">
                {isHealing ? 'Healing...' : 'Trigger Self-Healing'}
              </button>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Live Logs & Diagnosis</h3>
          <div className="h-full p-4 bg-black/30 rounded-lg border border-white/10 font-mono text-sm text-gray-300 overflow-y-auto min-h-[280px]">
            <pre className="whitespace-pre-wrap">{logs}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportTab;
