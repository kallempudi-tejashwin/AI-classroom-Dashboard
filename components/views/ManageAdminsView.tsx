import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole } from '../../types';
import Dialog from '../Dialog';

interface ManageAdminsViewProps {
    admins: User[];
    allUsers: User[];
    onRegisterAdmin: (admin: User) => void;
    onUpdateUser: (user: User) => void;
    onDeleteUsers: (userIds: string[]) => void;
    onImportData: (data: any) => void;
    getAppStateForExport: () => any;
    onExportUserData: (userId: string) => void;
}

const initialFormState = { id: '', name: '', password: '' };

const ManageAdminsView: React.FC<ManageAdminsViewProps> = ({ admins, allUsers, onRegisterAdmin, onUpdateUser, onDeleteUsers, onImportData, getAppStateForExport, onExportUserData }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [selectedAdmins, setSelectedAdmins] = useState<Set<string>>(new Set());
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const importFileInputRef = React.useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (editingAdmin) {
        setFormData({
            id: editingAdmin.id,
            name: editingAdmin.name,
            password: editingAdmin.password || '',
        });
    } else {
        setFormData(initialFormState);
    }
  }, [editingAdmin]);


  const handleOpenDialog = (admin: User | null = null) => {
    setEditingAdmin(admin);
    setError('');
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAdmin(null);
    setFormData(initialFormState);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleToggleStatus = (admin: User) => {
    const newStatus = admin.status === 'Active' ? 'Deactivated' : 'Active';
    const action = newStatus.toLowerCase();
    if (window.confirm(`Are you sure you want to ${action} this administrator account? This will affect all associated teachers and students.`)) {
        onUpdateUser({ ...admin, status: newStatus });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim() || !formData.id.trim() || !formData.password.trim()) {
        setError('Name, ID, and Password are required.');
        return;
    }
    if (!editingAdmin && allUsers.some(u => u.id.toUpperCase() === formData.id.trim().toUpperCase())) {
        setError('A user with this ID already exists.');
        return;
    }

    const adminData: User = {
        ...editingAdmin,
        id: formData.id.trim().toUpperCase(),
        name: formData.name.trim(),
        password: formData.password,
        role: UserRole.Administrator,
        status: editingAdmin?.status || 'Active',
        avatar: editingAdmin?.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${formData.name.trim()}`,
    };

    if (editingAdmin) {
        onUpdateUser(adminData);
    } else {
        onRegisterAdmin(adminData);
    }
    handleCloseDialog();
  };

  const handleSelectAdmin = (adminId: string) => {
    setSelectedAdmins(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(adminId)) {
            newSelection.delete(adminId);
        } else {
            newSelection.add(adminId);
        }
        return newSelection;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedAdmins(new Set(admins.map(a => a.id)));
      } else {
          setSelectedAdmins(new Set());
      }
  };

  const handleDeleteSelected = () => {
      onDeleteUsers(Array.from(selectedAdmins));
      setSelectedAdmins(new Set());
      setIsDeleteConfirmOpen(false);
  };

  const handleExportAdmins = () => {
    const jsonString = JSON.stringify(admins, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin_list_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAllData = () => {
    const dataToExport = getAppStateForExport();
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `full_backup_${new Date().toISOString().split('T')[0]}.json`;
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
            if (window.confirm("Are you sure you want to import this file? This will overwrite ALL existing application data.")) {
                onImportData(data);
                alert("Data imported successfully!");
            }
        } catch (error) {
            alert("Error parsing file. Please ensure it's a valid JSON backup file.");
        }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = ''; // Reset input
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">School & Data Management</h1>
        <button onClick={() => handleOpenDialog()} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-transform transform hover:scale-105 active:scale-95">
            + Register New School (Admin)
        </button>
      </div>
       <div className="mb-6 p-4 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Global Data Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button onClick={handleExportAdmins} className="data-btn bg-sky-600 hover:bg-sky-700">Export Admin List</button>
                <button onClick={handleExportAllData} className="data-btn bg-teal-600 hover:bg-teal-700">Export All Data</button>
                <button onClick={handleImportClick} className="data-btn bg-rose-600 hover:bg-rose-700">Import All Data</button>
                <input type="file" ref={importFileInputRef} onChange={handleImportFileSelected} className="hidden" accept="application/json" />
            </div>
            <style>{`.data-btn { padding: 0.5rem 1rem; color: white; font-weight: 600; border-radius: 0.5rem; transition: all 0.2s; }`}</style>
      </div>

      <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Registered Administrators</h2>
        {selectedAdmins.size > 0 && (
            <div className="mb-4 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-between animate-fade-in-fast">
                <span className="font-semibold text-indigo-800 dark:text-indigo-200">{selectedAdmins.size} admin(s) selected</span>
                <button onClick={() => setIsDeleteConfirmOpen(true)} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">
                    Delete Selected
                </button>
            </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-base text-left text-gray-600 dark:text-gray-300">
            <thead className="text-base text-gray-700 dark:text-gray-400 uppercase bg-white/50 dark:bg-gray-900/50">
              <tr>
                <th className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={admins.length > 0 && selectedAdmins.size === admins.length} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" /></th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Admin ID</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin.id} className="bg-transparent border-b dark:border-gray-700 hover:bg-white/50 dark:hover:bg-gray-700/50">
                  <td className="p-4"><input type="checkbox" checked={selectedAdmins.has(admin.id)} onChange={() => handleSelectAdmin(admin.id)} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" /></td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                      <img src={admin.avatar} alt={admin.name} className="w-10 h-10 rounded-full object-cover"/>
                      {admin.name}
                  </td>
                  <td className="px-6 py-4">{admin.id}</td>
                   <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                      admin.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                    }`}>
                      {admin.status}
                    </span>
                  </td>
                   <td className="px-6 py-4 space-x-3 whitespace-nowrap">
                    <button onClick={() => handleOpenDialog(admin)} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                        Edit
                    </button>
                    <button onClick={() => handleToggleStatus(admin)} className={`font-medium ${admin.status === 'Active' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} hover:underline`}>
                      {admin.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => onExportUserData(admin.id)} className="font-medium text-teal-600 dark:text-teal-400 hover:underline">
                        Export Data
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Confirm Deletion">
          <p className="text-lg">Are you sure you want to delete {selectedAdmins.size} admin(s)?</p>
          <p className="text-base text-red-600 dark:text-red-400 mt-2">This will permanently remove their records. This action cannot be undone.</p>
          <div className="flex justify-end mt-6">
              <button onClick={() => setIsDeleteConfirmOpen(false)} className="px-4 py-2 font-medium bg-gray-200 dark:bg-gray-600 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
              <button onClick={handleDeleteSelected} className="px-4 py-2 font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Confirm Delete</button>
          </div>
      </Dialog>
      <Dialog isOpen={isDialogOpen} onClose={handleCloseDialog} title={editingAdmin ? "Edit Administrator" : "Register New School (Admin)"}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="School Name / Admin Name" required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
            <input type="text" name="id" value={formData.id} onChange={handleInputChange} placeholder="Admin ID (e.g., ADM302)" required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-600" disabled={!!editingAdmin} />
            <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Password" required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
            {error && <p className="text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={handleCloseDialog} className="px-4 py-2 font-medium bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">{editingAdmin ? "Save Changes" : "Register"}</button>
            </div>
        </form>
      </Dialog>
    </div>
  );
};

export default ManageAdminsView;