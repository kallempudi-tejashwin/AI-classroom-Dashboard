import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { AcademicCapIcon, ShieldCheckIcon, UserGroupIcon, Cog6ToothIcon } from '../components/icons';
import Dialog from '../components/Dialog';

interface DeveloperLoginProps {
  onLogin: (password: string) => void;
  onClose: () => void;
}

const DeveloperLogin: React.FC<DeveloperLoginProps> = ({ onLogin, onClose }) => {
  const [password, setPassword] = useState('');
  
  const handleDevLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
      <Dialog isOpen={true} onClose={onClose} title="Developer Console Login">
        <p className="text-base mb-4 text-gray-600 dark:text-gray-400">Enter the master password to access the school administration panel.</p>
        <form onSubmit={handleDevLogin} className="space-y-4">
            <div>
                <label htmlFor="dev-password" className="sr-only">Password</label>
                <input
                    id="dev-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 text-lg bg-white/80 dark:bg-gray-800/60 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Developer Password"
                    required
                    autoFocus
                />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 font-medium bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
              <button type="submit" className="px-4 py-2 font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700">Access Console</button>
            </div>
        </form>
      </Dialog>
  );
};


interface LoginPageProps {
  onLogin: (id: string, role: UserRole, password: string) => void;
  users: User[];
  error: string;
  onDeveloperLogin: (password: string) => void;
}

const roles = [
  { name: UserRole.Student, icon: AcademicCapIcon },
  { name: UserRole.Teacher, icon: UserGroupIcon },
  { name: UserRole.Administrator, icon: ShieldCheckIcon },
];

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, users, error, onDeveloperLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.Student);
  const [uniqueId, setUniqueId] = useState('');
  const [password, setPassword] = useState('');
  const [showDevLogin, setShowDevLogin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uniqueId.trim() && password.trim()) {
      onLogin(uniqueId.trim().toUpperCase(), selectedRole, password);
    }
  };

  return (
    <>
      <div className="w-full max-w-lg p-10 space-y-8 bg-white/30 dark:bg-gray-900/30 backdrop-blur-3xl rounded-2xl shadow-lg border border-white/50 dark:border-white/20 animate-apple-glass-fade-in">
        <div className="text-center">
          <div className="text-6xl mb-4">🎓</div>
          <h1 className="text-5xl font-bold text-gray-800 dark:text-gray-100">AI Classroom Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Welcome! Please select your role and sign in.</p>
        </div>

        <div className="flex justify-center space-x-2 rounded-xl bg-gray-200 dark:bg-gray-800/50 p-1">
          {roles.map((role) => (
            <button
              key={role.name}
              onClick={() => setSelectedRole(role.name)}
              className={`w-full flex justify-center items-center gap-2 rounded-lg px-4 py-2.5 text-base font-semibold transition-colors duration-200 ${
                selectedRole === role.name
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/50'
              }`}
            >
              <role.icon className="w-5 h-5" />
              {role.name}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="uniqueId" className="sr-only">
              Unique ID
            </label>
            <input
              id="uniqueId"
              name="uniqueId"
              type="text"
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value)}
              required
              className="w-full px-4 py-3 text-lg text-gray-800 dark:text-gray-200 bg-white/80 dark:bg-gray-800/60 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder={`${selectedRole} Unique ID (e.g., STU101, TCH201)`}
            />
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 text-lg text-gray-800 dark:text-gray-200 bg-white/80 dark:bg-gray-800/60 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="Password"
            />
          </div>

          {error && <p className="text-base text-center text-red-600 dark:text-red-400">{error}</p>}

          <div>
            <button
              type="submit"
              className="w-full px-4 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105 active:scale-95"
            >
              Login
            </button>
          </div>
        </form>
      </div>

      <button
        onClick={() => setShowDevLogin(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-900 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        aria-label="Developer Login"
      >
        <Cog6ToothIcon className="w-6 h-6" />
        <span className="font-semibold">Developer</span>
      </button>

      {showDevLogin && <DeveloperLogin onLogin={onDeveloperLogin} onClose={() => setShowDevLogin(false)} />}
    </>
  );
};

export default LoginPage;