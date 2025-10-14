import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole } from '../../types';
import Dialog from '../Dialog';

interface ManageTeachersViewProps {
    user: User; // The currently logged-in admin
    teachers: User[];
    allUsers: User[];
    onRegisterTeacher: (teacher: User) => void;
    onUpdateUser: (teacher: User) => void;
    onDeleteUsers: (userIds: string[]) => void;
}

const initialFormState = { id: '', name: '', password: '', class: '', section: '' };

const ManageTeachersView: React.FC<ManageTeachersViewProps> = ({ user, teachers, allUsers, onRegisterTeacher, onUpdateUser, onDeleteUsers }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Deactivated'>('Active');
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set());
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const filteredTeachers = useMemo(() => {
    return teachers
      .filter(teacher => {
        if (statusFilter === 'All') return true;
        return teacher.status === statusFilter;
      })
      .filter(teacher => 
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [teachers, searchTerm, statusFilter]);
  
  useEffect(() => {
    setSelectedTeachers(new Set());
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (editingTeacher) {
      setFormData({
        id: editingTeacher.id,
        name: editingTeacher.name,
        password: editingTeacher.password || '',
        class: editingTeacher.class || '',
        section: editingTeacher.section || ''
      });
    } else {
      setFormData(initialFormState);
    }
  }, [editingTeacher]);
  
  const handleOpenDialog = (teacher: User | null = null) => {
    setEditingTeacher(teacher);
    setIsDialogOpen(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTeacher(null);
    setFormData(initialFormState);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  const handleToggleStatus = (teacher: User) => {
    const newStatus = teacher.status === 'Active' ? 'Deactivated' : 'Active';
    if(window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} this user?`)) {
      onUpdateUser({ ...teacher, status: newStatus });
    }
  };
  
  const handleSelectTeacher = (teacherId: string) => {
    setSelectedTeachers(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(teacherId)) {
            newSelection.delete(teacherId);
        } else {
            newSelection.add(teacherId);
        }
        return newSelection;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedTeachers(new Set(filteredTeachers.map(t => t.id)));
      } else {
          setSelectedTeachers(new Set());
      }
  };
  
  const handleDeleteSelected = () => {
      onDeleteUsers(Array.from(selectedTeachers));
      setSelectedTeachers(new Set());
      setIsDeleteConfirmOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim() || !formData.id.trim() || !formData.password.trim()) {
        setError('Name, ID, and Password fields are required.');
        return;
    }
    
    if (!editingTeacher && allUsers.some(u => u.id.toUpperCase() === formData.id.trim().toUpperCase())) {
        setError('A user with this ID already exists.');
        return;
    }

    const teacherData: User = {
        ...editingTeacher,
        id: formData.id.trim().toUpperCase(),
        name: formData.name.trim(),
        password: formData.password,
        role: UserRole.Teacher,
        status: editingTeacher?.status || 'Active',
        avatar: editingTeacher?.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${formData.name.trim()}`,
        class: formData.class.trim(),
        section: formData.section.trim().toUpperCase(),
        adminId: editingTeacher?.adminId || user.id, // Assign the admin's ID
    };

    if (editingTeacher) {
      onUpdateUser(teacherData);
    } else {
      onRegisterTeacher(teacherData);
    }
    
    handleCloseDialog();
  };


  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">Manage Teachers</h1>
        <button 
            onClick={() => handleOpenDialog()}
            className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105 active:scale-95 text-base"
        >
            + Register New Teacher
        </button>
      </div>
      <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
        <div className="flex justify-between items-center mb-4 gap-4">
            <input 
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-xs px-4 py-2 text-base bg-white/80 dark:bg-gray-700/80 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 text-base bg-white/80 dark:bg-gray-700/80 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
                <option value="Active">Active</option>
                <option value="Deactivated">Deactivated</option>
                <option value="All">All</option>
            </select>
        </div>
        {selectedTeachers.size > 0 && (
            <div className="mb-4 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-between animate-fade-in-fast">
                <span className="font-semibold text-indigo-800 dark:text-indigo-200">{selectedTeachers.size} teacher(s) selected</span>
                <button 
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                    Delete Selected
                </button>
            </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-base text-left text-gray-600 dark:text-gray-300">
            <thead className="text-base text-gray-700 dark:text-gray-400 uppercase bg-white/50 dark:bg-gray-900/50 rounded-t-lg">
              <tr>
                <th scope="col" className="p-4">
                  <input 
                      type="checkbox" 
                      className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      checked={filteredTeachers.length > 0 && selectedTeachers.size === filteredTeachers.length}
                      onChange={handleSelectAll}
                  />
                </th>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3 hidden md:table-cell">Teacher ID</th>
                <th scope="col" className="px-6 py-3 hidden lg:table-cell">Assigned Class</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher, index) => (
                <tr 
                    key={teacher.id} 
                    className="bg-transparent border-b dark:border-gray-700 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-200 animate-list-item-enter"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="p-4">
                      <input 
                          type="checkbox" 
                          className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          checked={selectedTeachers.has(teacher.id)}
                          onChange={() => handleSelectTeacher(teacher.id)}
                      />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    <div className="flex items-center gap-3">
                        <img src={teacher.avatar} alt={teacher.name} className="w-10 h-10 rounded-full object-cover"/>
                        <span>{teacher.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">{teacher.id}</td>
                  <td className="px-6 py-4 hidden lg:table-cell">{teacher.class ? `Class ${teacher.class} - ${teacher.section}` : 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                      teacher.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                    }`}>
                      {teacher.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-3">
                    <button onClick={() => handleOpenDialog(teacher)} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Edit</button>
                    <button onClick={() => handleToggleStatus(teacher)} className={`font-medium ${teacher.status === 'Active' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} hover:underline`}>
                      {teacher.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
               {filteredTeachers.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400 text-base">
                        {teachers.length === 0 ? "No teachers have been registered yet." : "No teachers match your search or filter."}
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Confirm Deletion">
          <div>
              <p className="text-lg">Are you sure you want to delete {selectedTeachers.size} teacher(s)?</p>
              <p className="text-base text-red-600 dark:text-red-400 mt-2">
                  This will permanently remove their records. Students assigned to them will become unassigned. This action cannot be undone.
              </p>
              <div className="flex justify-end mt-6">
                  <button onClick={() => setIsDeleteConfirmOpen(false)} className="px-4 py-2 font-medium bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded-lg mr-2 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                  <button onClick={handleDeleteSelected} className="px-4 py-2 font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Confirm Delete</button>
              </div>
          </div>
      </Dialog>
      <Dialog isOpen={isDialogOpen} onClose={handleCloseDialog} title={editingTeacher ? "Edit Teacher" : "Register New Teacher"} size="2xl">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <div>
                <label htmlFor="teacherName" className="block text-base font-medium text-gray-700 dark:text-gray-300">Full Name*</label>
                <input type="text" id="teacherName" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full px-4 py-2 text-base bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
             <div>
                <label htmlFor="teacherId" className="block text-base font-medium text-gray-700 dark:text-gray-300">Teacher ID* (e.g., TCH203)</label>
                <input type="text" id="teacherId" name="id" value={formData.id} onChange={handleInputChange} disabled={!!editingTeacher} className="mt-1 block w-full px-4 py-2 text-base bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <label htmlFor="teacherClass" className="block text-base font-medium text-gray-700 dark:text-gray-300">Class</label>
                  <input type="text" id="teacherClass" name="class" value={formData.class} onChange={handleInputChange} className="mt-1 block w-full px-4 py-2 text-base bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., 10"/>
              </div>
              <div>
                  <label htmlFor="teacherSection" className="block text-base font-medium text-gray-700 dark:text-gray-300">Section</label>
                  <input type="text" id="teacherSection" name="section" value={formData.section} onChange={handleInputChange} className="mt-1 block w-full px-4 py-2 text-base bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., A"/>
              </div>
            </div>
             <div>
                <label htmlFor="password" className="block text-base font-medium text-gray-700 dark:text-gray-300">Password*</label>
                <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} className="mt-1 block w-full px-4 py-2 text-base bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            {error && <p className="text-base text-red-600 dark:text-red-500">{error}</p>}
            <div className="flex justify-end pt-2">
                 <button type="button" onClick={handleCloseDialog} className="px-4 py-2 text-base font-medium text-gray-700 bg-gray-100 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 rounded-lg hover:bg-gray-200 mr-2">Cancel</button>
                 <button type="submit" className="px-4 py-2 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">{editingTeacher ? 'Save Changes' : 'Register'}</button>
            </div>
        </form>
      </Dialog>
    </div>
  );
};

export default ManageTeachersView;