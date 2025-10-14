import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '3xl': 'max-w-6xl',
    '4xl': 'max-w-7xl',
  };

  const dialogContent = (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in-fast"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <style>{`
          @keyframes fade-in-fast {
              from { opacity: 0; }
              to { opacity: 1; }
          }
          .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
          
          @keyframes slide-up-fast {
              from { opacity: 0; transform: translateY(20px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-slide-up-fast { animation: slide-up-fast 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
      
      <div 
        className={`w-full ${sizeClasses[size]} p-6 rounded-2xl shadow-2xl animate-slide-up-fast
                   bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/30 dark:border-white/10`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1 text-gray-400 dark:text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close dialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-4 text-gray-600 dark:text-gray-300">
          {children}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(dialogContent, document.body);
};

export default Dialog;