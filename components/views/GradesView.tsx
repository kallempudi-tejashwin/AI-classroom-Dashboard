import React, { useMemo, useState } from 'react';
import { User, Grade } from '../../types';
import Dialog from '../Dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface GradesViewProps {
    user: User;
    grades: Grade[];
}

const GradesView: React.FC<GradesViewProps> = ({ user, grades }) => {
    const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
    const [subjectFilter, setSubjectFilter] = useState('All');

    const myGrades = useMemo(() => {
        return grades.filter(g => g.studentId === user.id);
    }, [grades, user.id]);

    const uniqueSubjects = useMemo(() => {
        const subjects = new Set(myGrades.map(g => g.subject));
        return ['All', ...Array.from(subjects)];
    }, [myGrades]);

    const filteredGrades = useMemo(() => {
        if (subjectFilter === 'All') {
            return myGrades;
        }
        return myGrades.filter(g => g.subject === subjectFilter);
    }, [myGrades, subjectFilter]);

    const { gpa, averageScore } = useMemo(() => {
        const gradesToCalculate = subjectFilter === 'All' ? myGrades : filteredGrades;
        if (gradesToCalculate.length === 0) return { gpa: 'N/A', averageScore: 'N/A' };
        
        const gradeToGpa = (grade: string): number => {
            if (grade.startsWith('A')) return 4.0;
            if (grade.startsWith('B')) return 3.0;
            if (grade.startsWith('C')) return 2.0;
            if (grade.startsWith('D')) return 1.0;
            return 0.0;
        };

        const totalGpaPoints = gradesToCalculate.reduce((acc, curr) => acc + gradeToGpa(curr.grade), 0);
        const calculatedGpa = (totalGpaPoints / gradesToCalculate.length).toFixed(2);
        
        const totalScore = gradesToCalculate.reduce((acc, curr) => acc + curr.score, 0);
        const calculatedAverage = (totalScore / gradesToCalculate.length).toFixed(1);

        return { gpa: calculatedGpa, averageScore: calculatedAverage };
    }, [myGrades, filteredGrades, subjectFilter]);

    const getGradeColor = (grade: string) => {
        if (grade.startsWith('A')) return 'from-green-500 to-green-400';
        if (grade.startsWith('B')) return 'from-blue-500 to-blue-400';
        if (grade.startsWith('C')) return 'from-yellow-500 to-yellow-400';
        if (grade.startsWith('D')) return 'from-orange-500 to-orange-400';
        return 'from-red-500 to-red-400';
    };

    const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, grade: Grade) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedGrade(grade);
        }
    };

    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-6">My Grades</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10 text-center">
                    <p className="text-5xl font-bold text-indigo-600 dark:text-indigo-400">{gpa}</p>
                    <p className="text-base text-gray-500 dark:text-gray-400 mt-1">{subjectFilter === 'All' ? 'Overall' : subjectFilter} GPA</p>
                </div>
                <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10 text-center">
                    <p className="text-5xl font-bold text-teal-600 dark:text-teal-400">{averageScore}%</p>
                    <p className="text-base text-gray-500 dark:text-gray-400 mt-1">{subjectFilter === 'All' ? 'Overall' : subjectFilter} Average</p>
                </div>
            </div>

            <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10 mb-8">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Performance Trend</h2>
                    <div>
                        <label htmlFor="subject-filter" className="sr-only">Filter by Subject</label>
                        <select
                            id="subject-filter"
                            value={subjectFilter}
                            onChange={(e) => setSubjectFilter(e.target.value)}
                            className="w-full max-w-xs pl-3 pr-10 py-2 text-base rounded-md bg-white/80 dark:bg-gray-700/80 border-gray-300 dark:border-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {uniqueSubjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                        </select>
                    </div>
                </div>
                <div className="w-full h-72">
                    {filteredGrades.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={filteredGrades} margin={{ top: 5, right: 20, left: -10, bottom: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                                <XAxis dataKey="testTitle" stroke="#6b7280" fontSize={12} tick={{ angle: -30, textAnchor: 'end' }} interval={0} />
                                <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(4px)',
                                        border: '1px solid rgba(200, 200, 200, 0.5)',
                                        borderRadius: '0.75rem'
                                    }}
                                />
                                <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2} name="Score (%)" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <p>Not enough data points to show a trend for this subject. Select another subject or 'All'.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myGrades.length === 0 ? (
                    <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
                        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">No Grades Available</h2>
                        <p className="mt-1 text-base text-gray-500 dark:text-gray-400">Your grades have not been posted yet. Please check back later.</p>
                    </div>
                ) : filteredGrades.length === 0 ? (
                    <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
                         <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">No Grades Found</h2>
                        <p className="mt-1 text-base text-gray-500 dark:text-gray-400">No grades recorded for "{subjectFilter}".</p>
                    </div>
                ) : (
                    filteredGrades.map((grade, index) => (
                        <div 
                            key={grade.id} 
                            className="bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10 overflow-hidden animate-list-item-enter cursor-pointer card-hover-effect"
                            style={{ animationDelay: `${index * 50}ms` }}
                            onClick={() => setSelectedGrade(grade)}
                            onKeyDown={(e) => handleCardKeyDown(e, grade)}
                            role="button"
                            tabIndex={0}
                            aria-label={`View details for ${grade.testTitle}`}
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{grade.subject}</h2>
                                        <p className="text-base text-gray-600 dark:text-gray-300">{grade.testTitle}</p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-lg bg-gradient-to-br ${getGradeColor(grade.grade)}`}>
                                        <p className="text-white font-bold text-3xl">{grade.grade}</p>
                                    </div>
                                </div>
                                <p className="font-semibold text-gray-600 dark:text-gray-200 mt-2 text-lg">{grade.score}%</p>
                                <p className="text-base text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 truncate">
                                    <strong>Comments:</strong> {grade.comments}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {selectedGrade && (
                <Dialog isOpen={!!selectedGrade} onClose={() => setSelectedGrade(null)} title="Grade Details">
                    <div className="space-y-3 text-base">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{selectedGrade.testTitle}</h2>
                        <p><strong>Subject:</strong> {selectedGrade.subject}</p>
                        <p><strong>Score:</strong> <span className="font-semibold text-lg">{selectedGrade.score}%</span></p>
                        <p><strong>Grade:</strong> <span className="font-semibold text-lg">{selectedGrade.grade}</span></p>
                        <div>
                            <p><strong>Teacher's Comments:</strong></p>
                            <p className="mt-1 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{selectedGrade.comments || "No comments provided."}</p>
                        </div>
                    </div>
                </Dialog>
            )}
        </div>
    );
};

export default GradesView;