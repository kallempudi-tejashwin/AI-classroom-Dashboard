
import React, { useState, useCallback, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DeveloperDashboardPage from './pages/DeveloperDashboardPage';
import SplashScreen from './components/SplashScreen';
import FluidBackground from './components/FluidBackground';
import { User, LeaveRequest, Announcement, ClassFile, Grade, CommunicationLog, UserRole, Student } from './types';
import { MOCK_ANNOUNCEMENTS, MOCK_GRADES, MOCK_SEED_DATA } from './data/mock';

interface AppState {
  users: User[];
  leaveRequests: LeaveRequest[];
  announcements: Announcement[];
  classFiles: ClassFile[];
  grades: Grade[];
  communicationLogs: CommunicationLog[];
  theme: 'light' | 'dark';
}

const getInitialState = (): AppState => {
  return {
    users: [], // We will fetch this from the database
    leaveRequests: [],
    announcements: MOCK_ANNOUNCEMENTS,
    classFiles: [],
    grades: MOCK_GRADES,
    communicationLogs: [],
    theme: 'light'
  };
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>(getInitialState);

  const [error, setError] = useState<string>('');
  const [showSplash, setShowSplash] = useState(true);

  // --- Derived State from AppState ---
  const { users, leaveRequests, announcements, classFiles, grades, communicationLogs, theme } = appState;
  
  // A helper to update parts of the state
  const updateState = (updates: Partial<AppState>) => {
    setAppState(prevState => ({ ...prevState, ...updates }));
  };

  // --- Fetch initial data from the database ---
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // This will call your new get-students.js function
        // For a full app, you'd have a get-users.js to get all user types
        const response = await fetch('/.netlify/functions/get-students');
        const usersData = await response.json();
        updateState({ users: usersData });
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Effect to auto-delete old announcements
  useEffect(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const filteredAnnouncements = announcements.filter((a: Announcement) => {
        const timestampDate = new Date(a.timestamp);
        return timestampDate.getTime() > sixMonthsAgo.getTime();
    });
    
    if (filteredAnnouncements.length !== announcements.length) {
        updateState({ announcements: filteredAnnouncements });
    }
  }, []); // Run only once on mount

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleLogin = useCallback((id: string, role: string, password: string) => {
    const user = users.find(u => u.id === id && u.role === role && u.password === password);
    if (user) {
      if (user.status === 'Deactivated') {
        setError('Your account has been deactivated. Please contact an administrator.');
        return;
      }
      // Check if the user's admin is deactivated
      if (user.adminId) {
        const admin = users.find(u => u.id === user.adminId);
        if (admin && admin.status === 'Deactivated') {
          setError("Your school's account has been deactivated. Please consult authorities.");
          return;
        }
      }

      setCurrentUser(user);
      setError('');
    } else {
      setError('Invalid ID or Password. Please try again.');
    }
  }, [users]);
  
  const handleDeveloperLogin = (password: string) => {
    const devUser = users.find(u => u.role === UserRole.Developer && u.password === password);
    if (devUser) {
        setCurrentUser(devUser);
        setError('');
    } else {
        setError('Invalid developer password.');
    }
  };

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
  }, []);
  
  const handleRegisterAdmin = (newAdmin: User) => {
    updateState({ users: [...users, { ...newAdmin, status: 'Active' }] });
  };

  const handleRegisterTeacher = (newTeacher: User) => {
    updateState({ users: [...users, { ...newTeacher, status: 'Active' }] });
  };

  const handleRegisterStudent = async (newStudentData: User) => {
    try {
      // The newStudentData from the form is already a complete User object
      // We just need to ensure it's sent to the backend.

      const response = await fetch('/.netlify/functions/add-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudentData),
      });
      if (!response.ok) {
        throw new Error('Failed to add student');
      }
      const result = await response.json();
      // Add the new student to the local state to update the UI instantly
      // The backend returns an `insertedId`, but our frontend already has the full object.
      // For consistency, we'll use the object we sent, ensuring the `_id` from MongoDB
      // doesn't cause issues if we were to use it directly.
      const newStudentWithId: User = { ...newStudentData, id: result.insertedId };
      updateState({ users: [...users, newStudentWithId] });
    } catch (err) {
      console.error("Error registering student:", err);
      // Optionally, set an error message to show in the UI
    }
  };
  
  const handleBulkRegisterStudents = (newStudents: User[]) => {
    const studentsWithDefaults = newStudents.map(s => ({ ...s, status: 'Active' as const }));
    updateState({ users: [...users, ...studentsWithDefaults] });
  };

  const handleLeaveRequestSubmit = (newRequest: LeaveRequest) => {
    updateState({ leaveRequests: [newRequest, ...leaveRequests] });
  };
  
  const handleUpdateRequestStatus = (requestId: number, status: 'Approved' | 'Rejected') => {
    const updatedRequests = leaveRequests.map(req => 
      req.id === requestId ? { ...req, status } : req
    );
    updateState({ leaveRequests: updatedRequests });
  };

  const handleUpdateUser = (updatedUser: User) => {
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    updateState({ users: updatedUsers });
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUsers = (userIds: string[]) => {
    const usersToDelete = users.filter(u => userIds.includes(u.id));
    const studentIdsToDelete = usersToDelete.filter(u => u.role === UserRole.Student).map(s => s.id);
    const teacherIdsToDelete = usersToDelete.filter(u => u.role === UserRole.Teacher).map(t => t.id);
      
    const newGrades = studentIdsToDelete.length > 0 ? grades.filter(g => !studentIdsToDelete.includes(g.studentId)) : grades;
    const newLeaveRequests = userIds.length > 0 ? leaveRequests.filter(r => !userIds.includes(r.user.id)) : leaveRequests;
    
    let newCommLogs = communicationLogs;
    if (studentIdsToDelete.length > 0) newCommLogs = newCommLogs.filter(l => !studentIdsToDelete.includes(l.studentId));
    if (teacherIdsToDelete.length > 0) newCommLogs = newCommLogs.filter(l => !teacherIdsToDelete.includes(l.teacherId));
    
    const updatedUsers = users.map(u => 
      (u.role === UserRole.Student && u.teacherId && teacherIdsToDelete.includes(u.teacherId)) 
        ? { ...u, teacherId: undefined } 
        : u
    ).filter(u => !userIds.includes(u.id));
    
    updateState({
        users: updatedUsers,
        grades: newGrades,
        leaveRequests: newLeaveRequests,
        communicationLogs: newCommLogs
    });
  };

  const handleBulkUpdateUsersStatus = (userIds: string[], status: 'Active' | 'Deactivated') => {
    const updatedUsers = users.map(u => userIds.includes(u.id) ? { ...u, status } : u);
    updateState({ users: updatedUsers });
  };

  const handleAddAnnouncement = (newAnnouncement: Announcement) => {
    updateState({ announcements: [newAnnouncement, ...announcements] });
  };

  const handleDeleteAnnouncement = useCallback((announcementId: number) => {
    const updatedAnnouncements = announcements.filter(a => a.id !== announcementId);
    updateState({ announcements: updatedAnnouncements });
  }, [announcements]);

  const handleAddFile = (newFile: ClassFile) => {
    updateState({ classFiles: [newFile, ...classFiles] });
  };
  
  const handleAddGrade = (newGrade: Omit<Grade, 'id'>) => {
    updateState({ grades: [...grades, { ...newGrade, id: Date.now() }] });
  };

  const handleUpdateGrade = (updatedGrade: Grade) => {
    const updatedGrades = grades.map(g => g.id === updatedGrade.id ? updatedGrade : g);
    updateState({ grades: updatedGrades });
  };
  
  const handleDeleteGrade = (gradeId: number) => {
    const updatedGrades = grades.filter(g => g.id !== gradeId);
    updateState({ grades: updatedGrades });
  };

  const handleAddCommLog = (newLog: Omit<CommunicationLog, 'id'>) => {
    updateState({ communicationLogs: [...communicationLogs, { ...newLog, id: Date.now() }] });
  };

  // --- New Data Management Handlers ---
  const handleFactoryReset = () => {
    // This would now be a server-side operation to clear collections
    setAppState(getInitialState());
  };

  const handleSeedData = () => {
    const existingUserIds = new Set(users.map(u => u.id));
    const newUsers = MOCK_SEED_DATA.users.filter(u => !existingUserIds.has(u.id));

    const existingGradeIds = new Set(grades.map(g => g.id));
    const newGrades = MOCK_SEED_DATA.grades.filter(g => !existingGradeIds.has(g.id));
    
    const existingRequestIds = new Set(leaveRequests.map(r => r.id));
    const newLeaveRequests = MOCK_SEED_DATA.leaveRequests.filter(r => !existingRequestIds.has(r.id));
    
    updateState({
        users: [...users, ...newUsers],
        grades: [...grades, ...newGrades],
        leaveRequests: [...leaveRequests, ...newLeaveRequests]
    });
  };

  const handleImportData = (importedState: Partial<AppState> & { version?: string }) => {
    // Basic validation
    if (!importedState.users || !importedState.version) {
        throw new Error("Invalid import file format.");
    }
    const parsedState = {
      ...getInitialState(),
      ...importedState,
      // Ensure dates are parsed correctly
      announcements: importedState.announcements?.map(a => ({...a, timestamp: new Date(a.timestamp)})) || [],
      communicationLogs: importedState.communicationLogs?.map(l => ({...l, timestamp: new Date(l.timestamp)})) || [],
      classFiles: importedState.classFiles?.map(f => ({...f, uploadTimestamp: new Date(f.uploadTimestamp)})) || [],
    };
    setAppState(parsedState);
  };

  const getAppStateForExport = () => appState;

  const renderContent = () => {
      if (!currentUser) {
          return <LoginPage onLogin={handleLogin} users={users} error={error} onDeveloperLogin={handleDeveloperLogin} />;
      }
      if (currentUser.role === UserRole.Developer) {
           return (
                <DeveloperDashboardPage
                    user={currentUser}
                    onLogout={handleLogout}
                    allUsers={users}
                    onRegisterAdmin={handleRegisterAdmin}
                    onUpdateUser={handleUpdateUser}
                    onDeleteUsers={handleDeleteUsers}
                    onImportData={handleImportData}
                />
            );
      }
      return (
          <DashboardPage
            user={currentUser}
            onLogout={handleLogout}
            allUsers={users}
            onRegisterTeacher={handleRegisterTeacher}
            onRegisterStudent={handleRegisterStudent}
            onBulkRegisterStudents={handleBulkRegisterStudents}
            onUpdateUser={handleUpdateUser}
            onDeleteUsers={handleDeleteUsers}
            onBulkUpdateUsersStatus={handleBulkUpdateUsersStatus}
            leaveRequests={leaveRequests}
            onLeaveRequestSubmit={handleLeaveRequestSubmit}
            onUpdateRequestStatus={handleUpdateRequestStatus}
            announcements={announcements}
            onAddAnnouncement={handleAddAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            classFiles={classFiles}
            onAddFile={handleAddFile}
            grades={grades} // Fix: Corrected typo from onUpdateGrade to handleUpdateGrade.
            onAddGrade={handleAddGrade} // Fix: Corrected typo from onUpdateGrade to handleUpdateGrade.
            onUpdateGrade={handleUpdateGrade}
            onDeleteGrade={handleDeleteGrade}
            theme={theme}
            setTheme={(newTheme) => updateState({ theme: newTheme })}
            communicationLogs={communicationLogs}
            onAddCommLog={handleAddCommLog}
            onFactoryReset={handleFactoryReset}
            onSeedData={handleSeedData}
            onImportData={handleImportData}
          />
      );
  }

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <main className="w-full min-h-screen font-sans">
      <FluidBackground />
      <div className="relative z-10 w-full min-h-screen flex justify-center items-center p-0 sm:p-4">
        {renderContent()}
      </div>
    </main>
  );
};

export default App;
