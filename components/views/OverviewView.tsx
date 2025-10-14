import React, { useMemo } from 'react';
import { User, Announcement, UserRole, TabId, LeaveRequest, Grade } from '../../types';
import { MegaphoneIcon, ClipboardDocumentCheckIcon, UserGroupIcon, CalendarDaysIcon, ChartBarIcon, AcademicCapIcon } from '../icons';
import { MOTIVATIONAL_QUOTES } from '../../constants';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface OverviewViewProps {
  user: User;
  announcements: Announcement[];
  setActiveTab: (tabId: TabId) => void;
  allUsers: User[];
  leaveRequests: LeaveRequest[];
  grades: Grade[];
}

// Reusable Stat Card Component
const StatCard: React.FC<{ icon: React.ElementType, label: string, value: string | number, color: string }> = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white/50 dark:bg-black/20 p-5 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10 flex items-center gap-4">
        <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-500/20`}>
            <Icon className={`w-7 h-7 text-${color}-600 dark:text-${color}-400`} />
        </div>
        <div>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
            <p className="text-base text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    </div>
);


// Admin-specific Dashboard
const AdminDashboard: React.FC<{ allUsers: User[], leaveRequests: LeaveRequest[] }> = ({ allUsers, leaveRequests }) => {
    const stats = useMemo(() => ({
        students: allUsers.filter(u => u.role === UserRole.Student).length,
        teachers: allUsers.filter(u => u.role === UserRole.Teacher).length,
        pendingLeaves: leaveRequests.filter(r => r.status === 'Pending').length,
    }), [allUsers, leaveRequests]);

    return (
        <div className="mt-8">
             <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">Platform At-a-Glance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={AcademicCapIcon} label="Total Students" value={stats.students} color="sky" />
                <StatCard icon={UserGroupIcon} label="Total Teachers" value={stats.teachers} color="indigo" />
                <StatCard icon={CalendarDaysIcon} label="Pending Requests" value={stats.pendingLeaves} color="rose" />
            </div>
        </div>
    );
};

// Teacher-specific Dashboard
const TeacherDashboard: React.FC<{ user: User, allUsers: User[], grades: Grade[], leaveRequests: LeaveRequest[] }> = ({ user, allUsers, grades, leaveRequests }) => {
    const { myStudents, stats, gradeDistribution } = useMemo(() => {
        const myStudents = allUsers.filter(s => s.role === UserRole.Student && s.teacherId === user.id);
        const myStudentIds = myStudents.map(s => s.id);
        
        const myGrades = grades.filter(g => myStudentIds.includes(g.studentId));
        const avgScore = myGrades.length > 0 ? (myGrades.reduce((acc, g) => acc + g.score, 0) / myGrades.length).toFixed(1) : 'N/A';

        const pendingLeaves = leaveRequests.filter(r => r.status === 'Pending' && myStudentIds.includes(r.user.id)).length;
        
        const distribution = myGrades.reduce((acc, grade) => {
            if (grade.score >= 90) acc[0].value++;
            else if (grade.score >= 80) acc[1].value++;
            else if (grade.score >= 70) acc[2].value++;
            else acc[3].value++;
            return acc;
        }, [
            { name: 'A (90+)', value: 0 },
            { name: 'B (80-89)', value: 0 },
            { name: 'C (70-79)', value: 0 },
            { name: 'D/F (<70)', value: 0 },
        ]);

        return {
            myStudents,
            stats: { studentCount: myStudents.length, avgScore, pendingLeaves },
            gradeDistribution: distribution
        };
    }, [user, allUsers, grades, leaveRequests]);
    
    const COLORS = ['#22c55e', '#3b82f6', '#facc15', '#ef4444'];

    return (
        <div className="mt-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={AcademicCapIcon} label="My Students" value={stats.studentCount} color="sky" />
                <StatCard icon={ChartBarIcon} label="Class Average" value={`${stats.avgScore}%`} color="teal" />
                <StatCard icon={CalendarDaysIcon} label="Pending Requests" value={stats.pendingLeaves} color="rose" />
            </div>
            <div className="bg-white/50 dark:bg-black/20 p-5 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
                 <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Class Grade Distribution</h3>
                 <div className="w-full h-48">
                    <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie
                                data={gradeDistribution}
                                cx="50%"
                                cy="50%"
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                            >
                                {gradeDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)', border: '1px solid rgba(200, 200, 200, 0.5)', borderRadius: '0.75rem' }} />
                            <Legend iconSize={10} wrapperStyle={{fontSize: '12px'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// Student-specific Dashboard
const StudentDashboard: React.FC<{ user: User, grades: Grade[], leaveRequests: LeaveRequest[] }> = ({ user, grades, leaveRequests }) => {
    const myGrades = useMemo(() => grades.filter(g => g.studentId === user.id), [grades, user.id]);

    const { gpa, averageScore } = useMemo(() => {
        if (myGrades.length === 0) return { gpa: 'N/A', averageScore: 'N/A' };
        const gradeToGpa = (grade: string): number => {
            if (grade.startsWith('A')) return 4.0; if (grade.startsWith('B')) return 3.0; if (grade.startsWith('C')) return 2.0; if (grade.startsWith('D')) return 1.0; return 0.0;
        };
        const totalGpaPoints = myGrades.reduce((acc, curr) => acc + gradeToGpa(curr.grade), 0);
        const calculatedGpa = (totalGpaPoints / myGrades.length).toFixed(2);
        const totalScore = myGrades.reduce((acc, curr) => acc + curr.score, 0);
        const calculatedAverage = (totalScore / myGrades.length).toFixed(1);
        return { gpa: calculatedGpa, averageScore: calculatedAverage };
    }, [myGrades]);

    return (
        <div className="mt-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard icon={AcademicCapIcon} label="Overall GPA" value={gpa} color="indigo" />
                <StatCard icon={ChartBarIcon} label="Average Score" value={`${averageScore}%`} color="teal" />
            </div>
            <div className="bg-white/50 dark:bg-black/20 p-5 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">Recent Grades</h3>
                <div className="space-y-3">
                    {myGrades.slice(0, 4).map(grade => (
                        <div key={grade.id} className="flex justify-between items-center p-2 bg-white/50 dark:bg-gray-700/30 rounded-lg">
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-100">{grade.subject}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{grade.testTitle}</p>
                            </div>
                            <p className="font-bold text-lg text-gray-700 dark:text-gray-200">{grade.score}% ({grade.grade})</p>
                        </div>
                    ))}
                    {myGrades.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-4">No grades posted yet.</p>}
                </div>
            </div>
        </div>
    );
};

// Quick Actions Component
const QuickActions: React.FC<{ user: User, setActiveTab: (tabId: TabId) => void }> = ({ user, setActiveTab }) => {
    const getActions = () => {
        switch (user.role) {
            case UserRole.Administrator:
                return [{ label: "Manage Teachers", icon: UserGroupIcon, tabId: TabId.ManageTeachers }, { label: "Post Announcement", icon: MegaphoneIcon, tabId: TabId.Announcements }, { label: "Manage Students", icon: AcademicCapIcon, tabId: TabId.ManageStudents }];
            case UserRole.Teacher:
                return [{ label: "Gradebook", icon: ClipboardDocumentCheckIcon, tabId: TabId.Gradebook }, { label: "My Students", icon: UserGroupIcon, tabId: TabId.ManageStudents }, { label: "Class Files", icon: MegaphoneIcon, tabId: TabId.Content }];
            case UserRole.Student:
                return [{ label: "View My Grades", icon: ClipboardDocumentCheckIcon, tabId: TabId.Grades }, { label: "Submit Request", icon: CalendarDaysIcon, tabId: TabId.Leave }, { label: "Class Files", icon: MegaphoneIcon, tabId: TabId.Content }];
            default: return [];
        }
    };

    return (
        <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {getActions().map((action, index) => (
                    <button key={action.label} onClick={() => setActiveTab(action.tabId)} className="bg-white/50 dark:bg-black/20 p-5 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10 flex items-center gap-4 text-left card-hover-effect animate-list-item-enter" style={{ animationDelay: `${index * 100}ms` }}>
                        <action.icon className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                        <div>
                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{action.label}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Jump to section</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

// Latest Announcements Component
const LatestAnnouncements: React.FC<{ announcements: Announcement[] }> = ({ announcements }) => (
    <div className="text-left mt-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-5 text-center">Latest Announcements</h2>
        <div className="space-y-6">
            {announcements?.length > 0 ? announcements.slice(0, 3).map((ann, i) => (
                <div key={ann.id} className="bg-white/50 dark:bg-black/20 p-5 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10 animate-list-item-enter card-hover-effect" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex items-start gap-4">
                        <img src={ann.avatar} alt={ann.author} className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{ann.author}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(ann.timestamp).toLocaleString()}</p>
                            </div>
                            <p className="text-gray-700 dark:text-gray-200 mt-1">{ann.content}</p>
                        </div>
                    </div>
                </div>
            )) : <p className="text-center text-gray-500 dark:text-gray-400">No announcements yet.</p>}
        </div>
    </div>
);


const OverviewView: React.FC<OverviewViewProps> = (props) => {
  const { user, announcements } = props;
  const quote = useMemo(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)], []);

  return (
    <div className="w-full max-w-6xl mx-auto text-center">
      <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">Welcome back, {user.name.split(' ')[0]}!</h1>
      <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">"{quote}"</p>

      {user.role === UserRole.Administrator && <AdminDashboard {...props} />}
      {user.role === UserRole.Teacher && <TeacherDashboard {...props} />}
      {user.role === UserRole.Student && <StudentDashboard {...props} />}
      
      <QuickActions user={user} setActiveTab={props.setActiveTab} />
      <LatestAnnouncements announcements={announcements} />
    </div>
  );
};

export default OverviewView;