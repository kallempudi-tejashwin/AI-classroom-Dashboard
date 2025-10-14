import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center relative overflow-hidden animate-[splash-fade-out_0.5s_ease-in_2.8s_forwards]">
      <style>{`
        .splash-background {
          background-color: #f0e8f8;
        }
        .dark .splash-background {
           background-color: #1a1222;
        }
        @keyframes hat-pop-in {
          0% { transform: translateY(80px) scale(0.3); opacity: 0; }
          60% { transform: translateY(-15px) scale(1.1); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes text-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .hat-emoji {
          opacity: 0;
          animation: hat-pop-in 1.0s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s forwards;
        }
        .splash-title {
          opacity: 0;
          animation: text-fade-in 0.8s ease-in 1.3s forwards;
        }
      `}</style>
      
      {/* This div will be the animated background */}
      <div className="absolute inset-0 splash-background"></div>
      
      {/* This relative container ensures the content is on top of the background */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="hat-emoji text-[12rem] drop-shadow-lg">
            🎓
        </div>
        
        <h1 className="splash-title text-3xl font-bold text-gray-700 dark:text-gray-200 mt-4 tracking-wider drop-shadow-md text-center">
          AI Classroom Dashboard
        </h1>
      </div>
    </div>
  );
};

export default SplashScreen;