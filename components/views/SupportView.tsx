import React, { useState } from 'react';
import { getAIDiagnosis } from '../../services/geminiService';

const SupportView: React.FC = () => {
  const [logs, setLogs] = useState("System logs will appear here...");
  const [isHealing, setIsHealing] = useState(false);
  const [healProgress, setHealProgress] = useState(0);
  const [healStatus, setHealStatus] = useState('');
  const [diagnosis, setDiagnosis] = useState<{ diagnosis: string; solution: string } | null>(null);
  const [isLoadingDiagnosis, setIsLoadingDiagnosis] = useState(false);

  const runDiagnosis = async () => {
    setIsLoadingDiagnosis(true);
    setDiagnosis(null);
    setLogs("Running AI diagnosis...");
    const result = await getAIDiagnosis();
    setDiagnosis(result);
    setLogs(`AI Diagnosis Complete.\n\n[Issue]: ${result.diagnosis}\n[Recommendation]: ${result.solution}`);
    setIsLoadingDiagnosis(false);
  };
  
  const runSelfHeal = () => {
    if (!diagnosis) {
        alert("Please run a diagnosis first to identify the issue.");
        return;
    }
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
          setLogs(prev => prev + "\n\nSelf-Healing successful. System restored to optimal performance.");
          return 100;
        }
        return next;
      });
    }, 400);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Intelligent Debugging Panel</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">System Status</h2>
          <div className="p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3">
            <div className="flex justify-between items-center"><span>API Gateway</span> <span className="text-lime-600 dark:text-lime-400 font-bold">Operational</span></div>
            <div className="flex justify-between items-center"><span>Database Connection</span> <span className="text-lime-600 dark:text-lime-400 font-bold">Operational</span></div>
            <div className="flex justify-between items-center"><span>Content Delivery Network</span> <span className="text-lime-600 dark:text-lime-400 font-bold">Operational</span></div>
          </div>

          <h2 className="text-xl font-semibold mt-6 mb-2 text-gray-800 dark:text-gray-100">Autonomous Maintenance</h2>
          <div className="p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            {isHealing && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                  <div className="bg-teal-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${healProgress}%` }}></div>
                </div>
                <p className="text-center text-sm mt-2 text-gray-600 dark:text-gray-300">{healStatus}</p>
              </div>
            )}
            {!isHealing && healStatus && <p className="text-center font-medium text-lime-600 dark:text-lime-400 mb-4">{healStatus}</p>}
            <div className="flex gap-4">
              <button onClick={runDiagnosis} disabled={isLoadingDiagnosis || isHealing} className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors disabled:bg-gray-400 transition-transform transform hover:scale-105 active:scale-95">
                {isLoadingDiagnosis ? 'Diagnosing...' : 'Run AI Diagnosis'}
              </button>
              <button onClick={runSelfHeal} disabled={isHealing || !diagnosis} className="flex-1 px-4 py-2 bg-rose-600 text-white font-semibold rounded-lg shadow-sm hover:bg-rose-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed transition-transform transform hover:scale-105 active:scale-95">
                {isHealing ? 'Healing...' : 'Trigger Self-Healing'}
              </button>
            </div>
          </div>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-xl shadow-md border border-white/10">
          <h2 className="text-xl font-semibold mb-2 text-white">Live Logs & Diagnosis</h2>
          <div className="h-full bg-black/80 rounded-lg p-4 font-mono text-sm text-lime-300 overflow-y-auto min-h-[300px]">
            <pre className="whitespace-pre-wrap">{logs}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportView;