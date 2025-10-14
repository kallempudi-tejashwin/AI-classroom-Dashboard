import React, { useMemo } from 'react';
import { User, CommunicationLog, UserRole } from '../../types';

interface MyCommLogViewProps {
    user: User;
    allUsers: User[];
    communicationLogs: CommunicationLog[];
}

const MyCommLogView: React.FC<MyCommLogViewProps> = ({ user, allUsers, communicationLogs }) => {

    const teacherMap = useMemo(() => {
        const map = new Map<string, string>();
        allUsers.filter(u => u.role === UserRole.Teacher).forEach(t => map.set(t.id, t.name));
        return map;
    }, [allUsers]);

    const myLogs = useMemo(() => {
        return communicationLogs
            .filter(log => log.studentId === user.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [communicationLogs, user.id]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">My Communication Log</h1>
            <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
                 <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                    Log History
                </h2>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {myLogs.length > 0 ? myLogs.map((log, index) => (
                         <div 
                            key={log.id} 
                            className="p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 animate-list-item-enter"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(log.timestamp).toLocaleString()} by <span className="font-semibold">{teacherMap.get(log.teacherId) || 'Unknown Teacher'}</span>
                            </p>
                            <p className="text-base text-gray-700 dark:text-gray-200 mt-1 whitespace-pre-wrap">{log.note}</p>
                        </div>
                    )) : (
                        <div className="text-center py-16">
                            <p className="text-gray-500 dark:text-gray-400">No communication logs found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyCommLogView;
