import React, { useMemo } from 'react';
import { User, UserRole } from '../../types';
import { AcademicCapIcon } from '../icons';

interface ClassesViewProps {
    allUsers: User[];
}

interface ClassGroup {
    teacherName: string;
    teacherAvatar: string;
    students: User[];
}

const ClassesView: React.FC<ClassesViewProps> = ({ allUsers }) => {
    
    const { students, teachers } = useMemo(() => ({
        students: allUsers.filter(u => u.role === UserRole.Student),
        teachers: allUsers.filter(u => u.role === UserRole.Teacher)
    }), [allUsers]);

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);

    const groupedClasses = useMemo(() => {
        const groups: Record<string, ClassGroup> = {};

        students.forEach(student => {
            // Only count active students for class groups
            if (student.status !== 'Active') return;
            
            const className = student.class || 'Unassigned';
            const section = student.section || 'N/A';
            const key = `${className}-${section}`;
            const teacher = student.teacherId ? teacherMap.get(student.teacherId) : null;

            if (!groups[key]) {
                groups[key] = {
                    teacherName: teacher ? teacher.name : 'Unassigned',
                    teacherAvatar: teacher ? teacher.avatar : `https://api.dicebear.com/8.x/initials/svg?seed=U`,
                    students: []
                };
            }
            groups[key].students.push(student);
        });

        return Object.entries(groups).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
    }, [students, teacherMap]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Class Overview</h1>
            {groupedClasses.length === 0 ? (
                 <div className="text-center py-16 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
                    <AcademicCapIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-500" />
                    <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-200">No Classes to Display</h2>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Register active students and assign them to a class and section to see them here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedClasses.map(([key, group], index) => {
                        const [className, section] = key.split('-');
                        return (
                            <div 
                                key={key} 
                                className="bg-white/50 dark:bg-black/20 p-5 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10 animate-list-item-enter card-hover-effect"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">Class {className}</h2>
                                        <p className="font-semibold text-gray-600 dark:text-gray-300">Section {section}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{group.students.length}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Students</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex items-center gap-3">
                                    <img src={group.teacherAvatar} alt={group.teacherName} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Teacher</p>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{group.teacherName}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default ClassesView;