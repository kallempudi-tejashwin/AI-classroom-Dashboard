

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { User, UserRole, Grade, CommunicationLog, ChartData, Announcement, LeaveRequest } from '../../types';
import { generateText, generateStudyTips, getPredictiveAnalytics, generateStudentPerformanceSummary } from '../../services/geminiService';
import { SparklesIcon, BoltIcon, ChartBarIcon, DocumentTextIcon, AcademicCapIcon } from '../icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AIToolCard: React.FC<{
    icon: React.ElementType;
    title: string;
    description: string;
    children: React.ReactNode;
}> = ({ icon: Icon, title, description, children }) => (
    <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10 card-hover-effect">
        <div className="flex items-center gap-3 mb-3">
            <Icon className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            {children}
        </div>
    </div>
);

const SmartComposeCard: React.FC = () => {
    const [goal, setGoal] = useState('Make this sound more professional');
    const [context, setContext] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setResult('');
        const response = await generateText(goal, context);
        setResult(response);
        setIsLoading(false);
    };

    return (
        <AIToolCard icon={SparklesIcon} title="Smart Compose" description="Generate or rewrite text for any purpose, from announcements to emails.">
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Goal</label>
                    <input type="text" value={goal} onChange={(e) => setGoal(e.target.value)} className="mt-1 w-full p-2 bg-white/80 dark:bg-gray-700/80 rounded-md border border-gray-300 dark:border-gray-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Input Text (Optional)</label>
                    <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={3} className="mt-1 w-full p-2 bg-white/80 dark:bg-gray-700/80 rounded-md border border-gray-300 dark:border-gray-600"/>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400">
                    {isLoading ? 'Generating...' : 'Generate'}
                </button>
                {result && (
                    <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-md">
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{result}</p>
                    </div>
                )}
            </form>
        </AIToolCard>
    );
};

const StudyTipsCard: React.FC<{ user: User; grades: Grade[] }> = ({ user, grades }) => {
    const myGrades = useMemo(() => grades.filter(g => g.studentId === user.id), [grades, user.id]);
    const [tips, setTips] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateTips = async () => {
        setIsLoading(true);
        setTips([]);
        const response = await generateStudyTips(myGrades);
        setTips(response);
        setIsLoading(false);
    };

    return (
        <AIToolCard icon={AcademicCapIcon} title="Personalized Study Tips" description="Get AI-powered advice based on your recent academic performance to help you succeed.">
            <button onClick={handleGenerateTips} disabled={isLoading} className="w-full py-2 px-4 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 disabled:bg-gray-400">
                {isLoading ? 'Analyzing...' : 'Generate My Study Tips'}
            </button>
            {tips.length > 0 && (
                <ul className="mt-4 space-y-2">
                    {tips.map((tip, index) => (
                         <li key={index} className="flex items-start gap-3 p-2 bg-lime-500/10 rounded-lg border border-lime-500/20">
                            <span className="text-lime-600 dark:text-lime-400 font-bold mt-1">▶</span>
                            <p className="text-gray-700 dark:text-gray-200 text-sm">{tip}</p>
                        </li>
                    ))}
                </ul>
            )}
        </AIToolCard>
    );
};

const StudentSummaryCard: React.FC<{ user: User; allUsers: User[]; grades: Grade[]; communicationLogs: CommunicationLog[] }> = ({ user, allUsers, grades, communicationLogs }) => {
    const students = useMemo(() => allUsers.filter(u => u.role === UserRole.Student && u.teacherId === user.id), [allUsers, user]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!selectedStudentId) return;
        setIsLoading(true);
        setSummary('');
        const student = students.find(s => s.id === selectedStudentId);
        if (student) {
            const studentGrades = grades.filter(g => g.studentId === student.id);
            const studentLogs = communicationLogs.filter(l => l.studentId === student.id);
            const response = await generateStudentPerformanceSummary(student.name, studentGrades, studentLogs);
            setSummary(response);
        }
        setIsLoading(false);
    };

    return (
        <AIToolCard icon={DocumentTextIcon} title="Student Performance Summary" description="Generate a holistic, AI-written performance report for any student.">
            <div className="space-y-3">
                <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full p-2 bg-white/80 dark:bg-gray-700/80 rounded-md border border-gray-300 dark:border-gray-600">
                    <option value="">Select a student...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                </select>
                <button onClick={handleGenerate} disabled={isLoading || !selectedStudentId} className="w-full py-2 px-4 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 disabled:bg-gray-400">
                    {isLoading ? 'Generating...' : 'Generate Summary'}
                </button>
                {summary && (
                    <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-md max-h-60 overflow-y-auto prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: summary.replace(/## (.*)/g, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>') }}>
                    </div>
                )}
            </div>
        </AIToolCard>
    );
};

interface AnalyticsCardProps {
    user: User;
    allUsers: User[];
    grades: Grade[];
    announcements: Announcement[];
    leaveRequests: LeaveRequest[];
    communicationLogs: CommunicationLog[];
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ user, allUsers, grades, announcements, leaveRequests, communicationLogs }) => {
    const [analytics, setAnalytics] = useState<{ suggestions: string[], chartData: ChartData[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            const data = await getPredictiveAnalytics({ currentUser: user, allUsers, grades, announcements, leaveRequests, communicationLogs });
            setAnalytics(data);
            setLoading(false);
        };
        fetchAnalytics();
    }, [user, allUsers, grades, announcements, leaveRequests, communicationLogs]);

    const { title, description } = useMemo(() => {
        switch (user.role) {
            case UserRole.Student:
                return { title: 'Personal Performance Insights', description: 'AI-generated analysis of your academic progress and habits.' };
            case UserRole.Teacher:
                return { title: 'Classroom Analytics', description: 'AI-generated insights on your students\' performance and engagement.' };
            case UserRole.Administrator:
                return { title: 'Platform Analytics', description: 'AI-generated overview of platform usage and user engagement.' };
            default:
                return { title: 'Predictive Analytics', description: 'AI-generated forecasts and suggestions to improve outcomes.' };
        }
    }, [user.role]);

    return (
        <AIToolCard icon={ChartBarIcon} title={title} description={description}>
            {loading ? (
                <div className="w-full h-60 bg-gray-300/30 dark:bg-gray-700/50 rounded-lg animate-pulse"></div>
            ) : (
                <div className="w-full h-60">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics?.chartData}>
                            <XAxis dataKey="name" stroke={'#9ca3af'} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)', border: '1px solid rgba(200, 200, 200, 0.5)', borderRadius: '0.75rem' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {analytics?.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
            <ul className="mt-4 space-y-2">
                {analytics?.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-lg text-sm">
                        <span className="text-indigo-500 font-bold mt-0.5">›</span>
                        <p className="text-gray-700 dark:text-gray-300">{suggestion}</p>
                    </li>
                ))}
            </ul>
        </AIToolCard>
    );
};


interface AICenterViewProps {
  user: User;
  allUsers: User[];
  grades: Grade[];
  communicationLogs: CommunicationLog[];
  announcements: Announcement[];
  leaveRequests: LeaveRequest[];
}

const AICenterView: React.FC<AICenterViewProps> = ({ user, allUsers, grades, communicationLogs, announcements, leaveRequests }) => {
    
    const analyticsProps = { user, allUsers, grades, announcements, leaveRequests, communicationLogs };

    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">AI Center</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">Your central hub for all intelligent tools and insights.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SmartComposeCard />

                {user.role === UserRole.Student && (
                    <>
                        <StudyTipsCard user={user} grades={grades} />
                        <AnalyticsCard {...analyticsProps} />
                    </>
                )}

                {user.role === UserRole.Teacher && (
                    <>
                        <AnalyticsCard {...analyticsProps} />
                        <StudentSummaryCard user={user} allUsers={allUsers} grades={grades} communicationLogs={communicationLogs} />
                    </>
                )}
                
                {user.role === UserRole.Administrator && (
                    <AnalyticsCard {...analyticsProps} />
                )}
            </div>
        </div>
    );
};

export default AICenterView;