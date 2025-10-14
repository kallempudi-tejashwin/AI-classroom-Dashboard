
import React, { useState, useMemo } from 'react';
import { User, TabId, UserRole, LeaveRequest, Announcement, ClassFile, Grade, CommunicationLog } from '../types';
import { TABS } from '../constants';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

import OverviewView from '../components/views/OverviewView';
import LeaveView from '../components/views/LeaveView';
import ContentView from '../components/views/ContentView';
import SupportView from '../components/views/SupportView';
import SettingsView from '../components/views/SettingsView';
import ManageTeachersView from '../components/views/ManageTeachersView';
import ManageStudentsView from '../components/views/ManageStudentsView';
import ClassesView from '../components/views/ClassesView';
import AnnouncementsView from '../components/views/AnnouncementsView';
import GradesView from '../components/views/GradesView';
import GradebookView from '../components/views/GradebookView';
import CommLogView from '../components/views/CommLogView';
import MyCommLogView from '../components/views/MyCommLogView';

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
  allUsers: User[];
  onRegisterTeacher: (teacher: User) => void;
  onRegisterStudent: (student: User) => void;
  onBulkRegisterStudents: (students: User[]) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUsers: (userIds: string[]) => void;
  onBulkUpdateUsersStatus: (userIds: string[], status: 'Active' | 'Deactivated') => void;
  leaveRequests: LeaveRequest[];
  onLeaveRequestSubmit: (request: LeaveRequest) => void;
  onUpdateRequestStatus: (requestId: number, status: 'Approved' | 'Rejected') => void;
  announcements: Announcement[];
  onAddAnnouncement: (announcement: Announcement) => void;
  onDeleteAnnouncement: (announcementId: number) => void;
  classFiles: ClassFile[];
  onAddFile: (file: ClassFile) => void;
  grades: Grade[];
  onAddGrade: (grade: Omit<Grade, 'id'>) => void;
  onUpdateGrade: (grade: Grade) => void;
  onDeleteGrade: (gradeId: number) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  communicationLogs: CommunicationLog[];
  onAddCommLog: (log: Omit<CommunicationLog, 'id'>) => void;
  // New Data Management Props
  onFactoryReset: () => void;
  onSeedData: () => void;
  onImportData: (data: any) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = (props) => {
  const { user, onLogout, allUsers, onRegisterTeacher, onRegisterStudent, onBulkRegisterStudents, onUpdateUser, onDeleteUsers, onBulkUpdateUsersStatus, leaveRequests, onLeaveRequestSubmit, onUpdateRequestStatus, announcements, onAddAnnouncement, onDeleteAnnouncement, classFiles, onAddFile, grades, onAddGrade, onUpdateGrade, onDeleteGrade, theme, setTheme, communicationLogs, onAddCommLog, onFactoryReset, onSeedData, onImportData } = props;
  
  // Add Settings to the list of available tabs for rendering, even though it's not in the sidebar
  const TABS_WITH_SETTINGS = useMemo(() => [
      ...TABS,
      { id: TabId.Settings, label: "Profile & Settings", roles: [UserRole.Student, UserRole.Teacher, UserRole.Administrator], icon: () => null },
  ], []);

  const availableTabs = useMemo(() => TABS.filter(tab => tab.roles.includes(user.role)), [user.role]);
  const [activeTab, setActiveTab] = useState<TabId>(availableTabs[0]?.id || TabId.Dashboard);
  
  const teachers = useMemo(() => allUsers.filter(u => u.role === UserRole.Teacher), [allUsers]);

  const renderContent = () => {
    switch (activeTab) {
      case TabId.Dashboard:
        return <OverviewView 
            user={user} 
            announcements={announcements} 
            setActiveTab={setActiveTab} 
            allUsers={allUsers}
            leaveRequests={leaveRequests}
            grades={grades}
          />;
      case TabId.ManageTeachers:
        return <ManageTeachersView user={user} teachers={teachers} onRegisterTeacher={onRegisterTeacher} onUpdateUser={onUpdateUser} allUsers={allUsers} onDeleteUsers={onDeleteUsers} />;
      case TabId.ManageStudents:
        return <ManageStudentsView user={user} allUsers={allUsers} onRegisterStudent={onRegisterStudent} onBulkRegisterStudents={onBulkRegisterStudents} onUpdateUser={onUpdateUser} grades={grades} communicationLogs={communicationLogs} onDeleteUsers={onDeleteUsers} onBulkUpdateUsersStatus={onBulkUpdateUsersStatus} />;
      case TabId.Classes:
        return <ClassesView allUsers={allUsers} />;
      case TabId.Leave:
        return <LeaveView user={user} allUsers={allUsers} leaveRequests={leaveRequests} onLeaveRequestSubmit={onLeaveRequestSubmit} onUpdateRequestStatus={onUpdateRequestStatus} />;
      case TabId.Grades:
        return <GradesView user={user} grades={grades} />;
      case TabId.Gradebook:
        return <GradebookView user={user} allUsers={allUsers} grades={grades} onAddGrade={onAddGrade} onUpdateGrade={onUpdateGrade} onDeleteGrade={onDeleteGrade} />;
      case TabId.CommLog:
        return <CommLogView user={user} allUsers={allUsers} communicationLogs={communicationLogs} onAddCommLog={onAddCommLog} />;
      case TabId.MyCommLog:
        return <MyCommLogView user={user} allUsers={allUsers} communicationLogs={communicationLogs} />;
      case TabId.Content:
          return <ContentView user={user} allUsers={allUsers} files={classFiles} onAddFile={onAddFile} />;
      case TabId.Announcements:
          return <AnnouncementsView user={user} announcements={announcements} onAddAnnouncement={onAddAnnouncement} onDeleteAnnouncement={onDeleteAnnouncement} />;
      case TabId.Support:
          return <SupportView />;
       case TabId.Settings:
          return <SettingsView 
              user={user} 
              onUpdateUser={onUpdateUser} 
              theme={theme} 
              setTheme={setTheme}
              // Pass all data for export/import
              allUsers={allUsers}
              leaveRequests={leaveRequests}
              announcements={announcements}
              grades={grades}
              communicationLogs={communicationLogs}
              classFiles={classFiles}
              // Pass handlers
              onFactoryReset={onFactoryReset}
              onSeedData={onSeedData}
              onImportData={onImportData}
            />;
      default:
        return <div className="p-6"><h1 className="text-2xl font-bold dark:text-white">Welcome to your Dashboard, {user.name}!</h1><p>Select a page from the sidebar to get started.</p></div>;
    }
  };

  return (
    <div className="w-full h-screen md:h-full md:max-w-screen-2xl md:max-h-[1200px] mx-auto flex flex-col md:flex-row bg-white/20 dark:bg-gray-900/40 backdrop-blur-3xl border border-white/30 dark:border-white/20 md:rounded-2xl shadow-2xl overflow-y-auto md:overflow-hidden">
      <Sidebar user={user} availableTabs={availableTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col min-h-0">
        <Header 
          user={user} 
          onLogout={onLogout} 
          allUsers={allUsers}
          announcements={announcements}
          classFiles={classFiles}
          setActiveTab={setActiveTab}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50/20 dark:bg-black/20 p-4 sm:p-8 md:p-10">
           <div key={activeTab} className="animate-content-enter">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
