import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../types';
import ManageAdminsView from '../components/views/ManageAdminsView';
import { ArrowLeftOnRectangleIcon, KeyIcon } from '../components/icons';
import Dialog from '../components/Dialog';

interface DeveloperDashboardPageProps {
  user: User;
  onLogout: () => void;
  allUsers: User[];
  onRegisterAdmin: (admin: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUsers: (userIds: string[]) => void;
  onImportData: (data: any) => void;
  getAppStateForExport: () => any;
  onExportUserData: (userId: string) => void;
}

const DeveloperDashboardPage: React.FC<DeveloperDashboardPageProps> = (props) => {
    const { user, onLogout, allUsers, onRegisterAdmin, onUpdateUser, onDeleteUsers, onImportData, getAppStateForExport, onExportUserData } = props;
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
  
    const admins = useMemo(() => allUsers.filter(u => u.role === UserRole.Administrator), [allUsers]);

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (currentPassword !== user.password) {
            setPasswordError("Incorrect current password.");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters long.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }
        
        onUpdateUser({ ...user, password: newPassword, passwordLastChanged: new Date().toISOString() });
        setPasswordSuccess("Password updated successfully!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setIsSettingsOpen(false), 1500);
    };

    return (
        <>
            <div className="w-full h-full max-w-screen-xl max-h-[1000px] mx-auto flex flex-col bg-white/20 dark:bg-gray-900/40 backdrop-blur-3xl border border-white/30 dark:border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/30 backdrop-blur-sm shrink-0">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Developer Console</h1>
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <p className="font-semibold text-lg text-gray-800 dark:text-gray-100">{user.name}</p>
                            <p className="text-base text-gray-500 dark:text-gray-400">Super User</p>
                        </div>
                        <button 
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                            aria-label="Change Password"
                        >
                            <KeyIcon className="w-6 h-6" />
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
                <main className="flex-1 overflow-y-auto bg-gray-50/20 dark:bg-black/20 p-8 md:p-10">
                    <ManageAdminsView
                        admins={admins}
                        allUsers={allUsers}
                        onRegisterAdmin={onRegisterAdmin}
                        onUpdateUser={onUpdateUser}
                        onDeleteUsers={onDeleteUsers}
                        onImportData={onImportData}
                        getAppStateForExport={getAppStateForExport}
                        onExportUserData={onExportUserData}
                    />
                </main>
            </div>
            <Dialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Change Developer Password">
                 <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white/80 dark:bg-gray-700/80 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white/80 dark:bg-gray-700/80 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white/80 dark:bg-gray-700/80 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    {passwordError && <p className="text-sm text-red-600 dark:text-red-500">{passwordError}</p>}
                    {passwordSuccess && <p className="text-sm text-green-600 dark:text-green-500">{passwordSuccess}</p>}
                    <div className="flex justify-end pt-2">
                        <button type="button" onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 font-medium bg-gray-200 dark:bg-gray-600 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Update Password</button>
                    </div>
                </form>
            </Dialog>
        </>
    );
};

export default DeveloperDashboardPage;