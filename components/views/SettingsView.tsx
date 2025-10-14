import React, { useState, useRef } from 'react';
import { User, UserRole, LeaveRequest, Announcement, Grade, CommunicationLog, ClassFile } from '../../types';
import Dialog from '../Dialog';

interface SettingsViewProps {
    user: User;
    onUpdateUser: (user: User) => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    // Props for admin data management
    allUsers?: User[];
    leaveRequests?: LeaveRequest[];
    announcements?: Announcement[];
    grades?: Grade[];
    communicationLogs?: CommunicationLog[];
    classFiles?: ClassFile[];
    onFactoryReset?: () => void;
    onSeedData?: () => void;
    onImportData?: (data: any) => void;
}

const SettingsView: React.FC<SettingsViewProps> = (props) => {
    const { user, onUpdateUser, theme, setTheme, allUsers = [], leaveRequests = [], announcements = [], grades = [], communicationLogs = [], classFiles = [], onFactoryReset, onSeedData, onImportData } = props;
    
    const [name, setName] = useState(user.name);
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const avatarFileInputRef = useRef<HTMLInputElement>(null);
    const importFileInputRef = useRef<HTMLInputElement>(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'reset' | 'import' | null>(null);
    const [importedData, setImportedData] = useState<any>(null);

    const handleAvatarClick = () => {
        avatarFileInputRef.current?.click();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (e.g., JPG, PNG).');
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert('File size exceeds 2MB limit.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const newAvatarUrl = reader.result as string;
            onUpdateUser({ ...user, avatar: newAvatarUrl });
        };
        reader.readAsDataURL(file);
    };

    const handleSaveChanges = () => {
      if (name.trim() !== user.name) {
        onUpdateUser({ ...user, name: name.trim() });
        alert("Display name updated successfully!");
      }
    };
    
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
    };
    
    const handleExportData = () => {
        const dataToExport = {
            users: allUsers,
            leaveRequests: leaveRequests,
            announcements: announcements,
            grades: grades,
            communicationLogs: communicationLogs,
            classFiles: classFiles,
            theme: theme,
            version: "1.1.0" // Match App.tsx version
        };
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `classroom_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        importFileInputRef.current?.click();
    };
    
    const handleImportFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                setImportedData(data);
                setConfirmAction('import');
                setIsConfirmOpen(true);
            } catch (error) {
                alert("Error parsing file. Please ensure it's a valid JSON backup file.");
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    const handleConfirm = () => {
        if (confirmAction === 'reset' && onFactoryReset) {
            onFactoryReset();
        } else if (confirmAction === 'import' && onImportData && importedData) {
            try {
                onImportData(importedData);
                alert("Data imported successfully!");
            } catch (error: any) {
                alert(`Import failed: ${error.message}`);
            }
        }
        setIsConfirmOpen(false);
        setConfirmAction(null);
        setImportedData(null);
    };
    
    const openConfirmDialog = (action: 'reset') => {
        setConfirmAction(action);
        setIsConfirmOpen(true);
    };

    const renderConfirmDialog = () => {
        if (!isConfirmOpen) return null;
        
        const messages = {
            reset: {
                title: 'Confirm Factory Reset',
                body: 'Are you sure you want to reset all data? This will delete all users, grades, requests, and files, and restore the application to its initial state. This action cannot be undone.',
                confirmText: 'Yes, Reset Data'
            },
            import: {
                title: 'Confirm Data Import',
                body: 'Are you sure you want to import this file? This will overwrite all existing data in the application with the contents of the backup file. This action cannot be undone.',
                confirmText: 'Yes, Import Data'
            }
        };
        const content = messages[confirmAction!];

        return (
            <Dialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title={content.title}>
                 <p className="text-base text-red-600 dark:text-red-400">{content.body}</p>
                 <div className="flex justify-end mt-6">
                    <button onClick={() => setIsConfirmOpen(false)} className="px-4 py-2 font-medium bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded-lg mr-2 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button onClick={handleConfirm} className="px-4 py-2 font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">{content.confirmText}</button>
                </div>
            </Dialog>
        );
    };

  return (
    <div className="max-w-3xl mx-auto">
      {renderConfirmDialog()}
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Profile & Settings</h1>
      
      <div className="p-6 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Your Profile</h2>
        <div className="flex items-center gap-6 mb-4">
            <div className="relative group">
                <img src={user.avatar} alt="Current user avatar" className="w-20 h-20 rounded-full object-cover" />
                <button 
                    onClick={handleAvatarClick}
                    className="absolute inset-0 w-full h-full bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Change profile picture"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                <input
                    type="file"
                    ref={avatarFileInputRef}
                    onChange={handleAvatarChange}
                    className="hidden"
                    accept="image/png, image/jpeg"
                />
            </div>
            <div>
                 <p className="font-semibold text-xl text-gray-800 dark:text-gray-100">{user.name}</p>
                 <p className="text-gray-600 dark:text-gray-400">{user.id} - {user.role}</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Click on the picture to upload a new one. (Max 2MB)</p>
            </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="userName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
          <input 
            type="text" 
            id="userName" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 bg-white/80 dark:bg-gray-700/80 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="mt-4 text-right">
            <button 
                onClick={handleSaveChanges}
                className="px-5 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-transform transform hover:scale-105 active:scale-95"
            >
                Save Name
            </button>
        </div>
      </div>

      <div className="mt-8 p-6 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Change Theme</h2>
        <div className="flex items-center justify-between">
            <label htmlFor="theme-toggle" className="text-gray-700 dark:text-gray-300">Dark Mode</label>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="theme-toggle" checked={theme === 'dark'} onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
        </div>
      </div>

      <div className="mt-8 p-6 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Change Password</h2>
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
            <div className="text-right">
                <button type="submit" className="px-5 py-2 bg-rose-600 text-white font-semibold rounded-lg shadow-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-transform transform hover:scale-105 active:scale-95">
                    Update Password
                </button>
            </div>
        </form>
      </div>

      {user.role === UserRole.Administrator && (
        <div className="mt-8 p-6 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Data Management</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Backup, restore, or reset the application's data.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button onClick={handleExportData} className="data-btn bg-sky-600 hover:bg-sky-700 ring-sky-500">Export All Data</button>
                <button onClick={handleImportClick} className="data-btn bg-teal-600 hover:bg-teal-700 ring-teal-500">Import Data</button>
                <input type="file" ref={importFileInputRef} onChange={handleImportFileSelected} className="hidden" accept="application/json" />
                <button onClick={onSeedData} className="data-btn bg-indigo-600 hover:bg-indigo-700 ring-indigo-500">Seed Demo Data</button>
                <button onClick={() => openConfirmDialog('reset')} className="data-btn bg-red-600 hover:bg-red-700 ring-red-500">Factory Reset</button>
            </div>
             <style>{`.data-btn { padding: 0.5rem 1rem; color: white; font-weight: 600; border-radius: 0.5rem; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1); transition: all 0.2s ease-in-out; transform: scale(1); } .data-btn:hover { transform: scale(1.05); } .data-btn:active { transform: scale(0.98); } .data-btn:focus { outline: none; ring-width: 2px; ring-offset-width: 2px; ring-offset-color: #1f2937; }`}</style>
        </div>
      )}
    </div>
  );
};

export default SettingsView;