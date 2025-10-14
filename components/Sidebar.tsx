import React from 'react';
import { User, Tab, TabId } from '../types';
import SidebarLink from './SidebarLink';

interface SidebarProps {
    user: User;
    availableTabs: Tab[];
    activeTab: TabId;
    setActiveTab: (tabId: TabId) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, availableTabs, activeTab, setActiveTab }) => {
    return (
        <aside className="w-full md:w-64 flex flex-col shrink-0 bg-white/20 dark:bg-gray-900/20 backdrop-blur-3xl border-b md:border-b-0 md:border-r border-white/20 dark:border-white/10 p-2 md:p-4">
            <div className="hidden md:flex items-center gap-3 mb-8 px-2">
                <div className="text-3xl">🎓</div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-wide">Classroom</h1>
            </div>

            <nav className="flex-1">
                <ul className="flex flex-row gap-1 md:flex-col md:gap-2 overflow-x-auto md:overflow-x-visible -mx-2 px-2 md:mx-0 md:px-0">
                    {availableTabs.map(tab => (
                        <li key={tab.id} className="flex-shrink-0">
                            <SidebarLink
                                label={tab.label}
                                Icon={tab.icon}
                                isActive={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                            />
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="hidden md:block mt-auto text-center p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">&copy; 2024 Classroom Dashboard</p>
            </div>
        </aside>
    );
};

export default Sidebar;