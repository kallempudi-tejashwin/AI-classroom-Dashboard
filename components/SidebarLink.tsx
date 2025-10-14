import React from 'react';

interface SidebarLinkProps {
  label: string;
  Icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ label, Icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 text-base font-medium group ${
        isActive
          ? `bg-indigo-100 text-indigo-700 shadow-sm dark:bg-indigo-500/20 dark:text-indigo-300`
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`} />
      <span>{label}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-pulse"></div>
      )}
    </button>
  );
};

export default SidebarLink;
