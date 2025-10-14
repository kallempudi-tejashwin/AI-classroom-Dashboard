import React, { useState, useMemo, useEffect } from 'react';
import { User, CommunicationLog, UserRole } from '../../types';

interface CommLogViewProps {
    user: User;
    allUsers: User[];
    communicationLogs: CommunicationLog[];
    onAddCommLog: (log: Omit<CommunicationLog, 'id'>) => void;
}

const CommLogView: React.FC<CommLogViewProps> = ({ user, allUsers, communicationLogs, onAddCommLog }) => {
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [note, setNote] = useState('');

    const myStudents = useMemo(() => {
        return allUsers.filter(u => u.role === UserRole.Student && u.teacherId === user.id && u.status === 'Active');
    }, [allUsers, user.id]);

    useEffect(() => {
        if (myStudents.length > 0 && !selectedStudentId) {
            setSelectedStudentId(myStudents[0].id);
        }
    }, [myStudents, selectedStudentId]);

    const studentLogs = useMemo(() => {
        if (!selectedStudentId) return [];
        return communicationLogs
            .filter(log => log.studentId === selectedStudentId && log.teacherId === user.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [communicationLogs, selectedStudentId, user.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim() || !selectedStudentId) {
            alert("Please select a student and write a note.");
            return;
        }

        onAddCommLog({
            studentId: selectedStudentId,
            teacherId: user.id,
            timestamp: new Date(),
            note: note.trim(),
        });
        setNote('');
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Communication Log</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Add New Log Entry</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Student</label>
                            <select 
                                value={selectedStudentId} 
                                onChange={e => setSelectedStudentId(e.target.value)} 
                                className="w-full mt-1 px-3 py-2 bg-white/80 dark:bg-gray-700/80 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {myStudents.length === 0 ? (
                                    <option value="" disabled>No active students</option>
                                ) : (
                                    <>
                                     <option value="" disabled>Select a student...</option>
                                     {myStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Log Note</label>
                            <textarea 
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                rows={8}
                                className="w-full mt-1 px-3 py-2 bg-white/80 dark:bg-gray-700/80 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Record observations, parent communications, etc."
                                required
                                disabled={!selectedStudentId}
                            />
                        </div>
                        <div className="text-right">
                             <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 dark:disabled:bg-gray-600" disabled={!selectedStudentId}>
                                Save Log
                            </button>
                        </div>
                    </form>
                </div>
                <div className="lg:col-span-2 bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Student</label>
                        <select 
                            value={selectedStudentId} 
                            onChange={e => setSelectedStudentId(e.target.value)} 
                            className="w-full mt-1 px-3 py-2 bg-white/80 dark:bg-gray-700/80 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {myStudents.length === 0 ? (
                                <option value="" disabled>No active students</option>
                            ) : (
                                <>
                                    <option value="" disabled>Select a student...</option>
                                    {myStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </>
                            )}
                        </select>
                    </div>
                     <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                        Log History for {allUsers.find(u => u.id === selectedStudentId)?.name || '...'}
                    </h2>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {studentLogs.length > 0 ? studentLogs.map(log => (
                             <div key={log.id} className="p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                                <p className="text-base text-gray-700 dark:text-gray-200 mt-1 whitespace-pre-wrap">{log.note}</p>
                            </div>
                        )) : (
                            <div className="text-center py-10">
                                <p className="text-gray-500 dark:text-gray-400">
                                    {!selectedStudentId ? "Please select a student to view their log." : "No communication logs for this student yet."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommLogView;