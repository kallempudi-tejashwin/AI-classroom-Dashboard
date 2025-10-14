import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, TabId, Announcement, ClassFile, UserRole } from '../types';
import { ArrowLeftOnRectangleIcon, MagnifyingGlassIcon, UserGroupIcon, AcademicCapIcon, DocumentTextIcon, MegaphoneIcon, Cog6ToothIcon } from './icons';

// --- Search Components (New) ---

interface SearchResults {
  students: User[];
  teachers: User[];
  announcements: Announcement[];
  files: ClassFile[];
}

interface GlobalSearchBarProps {
  allUsers: User[];
  announcements: Announcement[];
  classFiles: ClassFile[];
  setActiveTab: (tabId: TabId) => void;
}

const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ allUsers, announcements, classFiles, setActiveTab }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const performSearch = useCallback((currentQuery: string) => {
    if (!currentQuery.trim()) {
      setResults(null);
      return;
    }

    const lowerCaseQuery = currentQuery.toLowerCase();
    
    const students = allUsers.filter(u => u.role === UserRole.Student && (u.name.toLowerCase().includes(lowerCaseQuery) || u.id.toLowerCase().includes(lowerCaseQuery)));
    const teachers = allUsers.filter(u => u.role === UserRole.Teacher && (u.name.toLowerCase().includes(lowerCaseQuery) || u.id.toLowerCase().includes(lowerCaseQuery)));
    const searchAnnouncements = announcements.filter(a => a.content.toLowerCase().includes(lowerCaseQuery));
    const searchFiles = classFiles.filter(f => f.name.toLowerCase().includes(lowerCaseQuery) || (f.description && f.description.toLowerCase().includes(lowerCaseQuery)));

    setResults({
      students: students.slice(0, 3),
      teachers: teachers.slice(0, 3),
      announcements: searchAnnouncements.slice(0, 3),
      files: searchFiles.slice(0, 3),
    });
  }, [allUsers, announcements, classFiles]);

  useEffect(() => {
    if (query.length > 1) {
      setIsOpen(true);
      const handler = setTimeout(() => {
        performSearch(query);
      }, 300); // Debounce
      return () => clearTimeout(handler);
    } else {
      setIsOpen(false);
      setResults(null);
    }
  }, [query, performSearch]);
  
  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNavigate = (tabId: TabId) => {
    setActiveTab(tabId);
    setQuery('');
    setIsOpen(false);
  };

  const hasResults = results && (results.students.length > 0 || results.teachers.length > 0 || results.announcements.length > 0 || results.files.length > 0);

  return (
    <div className="relative w-full max-w-xs sm:max-w-md" ref={searchRef}>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 1 && setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 text-base text-gray-800 dark:text-gray-200 bg-white/70 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 dark:border-white/20 rounded-lg shadow-2xl z-50 overflow-hidden animate-content-enter" style={{ animationDuration: '0.2s' }}>
          <div className="max-h-96 overflow-y-auto">
            {results && hasResults ? (
              <>
                {results.students.length > 0 && (
                  <ResultCategory title="Students" icon={AcademicCapIcon}>
                    {results.students.map(user => <ResultItem key={user.id} text={user.name} subtext={user.id} onClick={() => handleNavigate(TabId.ManageStudents)} />)}
                  </ResultCategory>
                )}
                {results.teachers.length > 0 && (
                   <ResultCategory title="Teachers" icon={UserGroupIcon}>
                    {results.teachers.map(user => <ResultItem key={user.id} text={user.name} subtext={user.id} onClick={() => handleNavigate(TabId.ManageTeachers)} />)}
                  </ResultCategory>
                )}
                {results.files.length > 0 && (
                  <ResultCategory title="Class Files" icon={DocumentTextIcon}>
                    {results.files.map(file => <ResultItem key={file.id} text={file.name} subtext={file.category} onClick={() => handleNavigate(TabId.Content)} />)}
                  </ResultCategory>
                )}
                {results.announcements.length > 0 && (
                  <ResultCategory title="Announcements" icon={MegaphoneIcon}>
                    {results.announcements.map(item => <ResultItem key={item.id} text={item.content} subtext={`By ${item.author}`} onClick={() => handleNavigate(TabId.Announcements)} isContent />)}
                  </ResultCategory>
                )}
              </>
            ) : query.length > 1 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">No results found for "{query}"</div>
            ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">Keep typing to see results...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ResultCategory: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div>
    <h3 className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 first:border-t-0">
      <Icon className="w-4 h-4" /> {title}
    </h3>
    <ul>{children}</ul>
  </div>
);

const ResultItem: React.FC<{ text: string; subtext: string; onClick: () => void; isContent?: boolean; }> = ({ text, subtext, onClick, isContent }) => (
  <li>
    <button onClick={onClick} className="w-full text-left px-4 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
      <p className={`font-medium text-gray-800 dark:text-gray-100 ${isContent ? 'truncate' : ''}`}>{text}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{subtext}</p>
    </button>
  </li>
);

// --- Header Component (Updated) ---

interface HeaderProps {
  user: User;
  onLogout: () => void;
  allUsers: User[];
  announcements: Announcement[];
  classFiles: ClassFile[];
  setActiveTab: (tabId: TabId) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, allUsers, announcements, classFiles, setActiveTab }) => {
  return (
    <header className="flex items-center justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/30 backdrop-blur-sm shrink-0">
      <GlobalSearchBar
        allUsers={allUsers}
        announcements={announcements}
        classFiles={classFiles}
        setActiveTab={setActiveTab}
      />
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="text-right">
          <p className="font-semibold text-base sm:text-lg text-gray-800 dark:text-gray-100">{user.name}</p>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 hidden sm:block">{user.role}</p>
        </div>
        <img src={user.avatar} alt={user.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
        <button
          onClick={() => setActiveTab(TabId.Settings)}
          className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
          aria-label="Profile and Settings"
        >
          <Cog6ToothIcon className="w-6 h-6" />
        </button>
        <button 
          onClick={onLogout} 
          className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
          aria-label="Logout"
        >
          <ArrowLeftOnRectangleIcon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;