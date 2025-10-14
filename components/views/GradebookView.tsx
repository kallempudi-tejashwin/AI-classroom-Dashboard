import React, { useState, useMemo, useEffect } from 'react';
import { User, Grade, UserRole } from '../../types';

interface GradebookViewProps {
    user: User;
    allUsers: User[];
    grades: Grade[];
    onAddGrade: (grade: Omit<Grade, 'id'>) => void;
    onUpdateGrade: (grade: Grade) => void;
    onDeleteGrade: (gradeId: number) => void;
}

const initialFormState = { studentId: '', testTitle: '', subject: '', score: '', comments: '' };

const GradebookView: React.FC<GradebookViewProps> = ({ user, allUsers, grades, onAddGrade, onUpdateGrade, onDeleteGrade }) => {
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [formData, setFormData] = useState(initialFormState);
    const [editingGrade, setEditingGrade] = useState<Grade | null>(null);

    const myStudents = useMemo(() => {
        return allUsers.filter(u => u.role === UserRole.Student && u.teacherId === user.id && u.status === 'Active');
    }, [allUsers, user.id]);

    useEffect(() => {
        // Pre-select the first student if available and none is selected
        if (myStudents.length > 0 && !myStudents.find(s => s.id === selectedStudentId)) {
            setSelectedStudentId(myStudents[0].id);
        } else if (myStudents.length === 0) {
            setSelectedStudentId('');
        }
    }, [myStudents, selectedStudentId]);
    
    useEffect(() => {
        // Reset form when student changes
        setFormData({ ...initialFormState, studentId: selectedStudentId });
        setEditingGrade(null);
    }, [selectedStudentId]);

    const studentGrades = useMemo(() => {
        if (!selectedStudentId) return [];
        return grades.filter(g => g.studentId === selectedStudentId);
    }, [grades, selectedStudentId]);

    const getLetterGrade = (score: number): string => {
        if (score >= 97) return 'A+';
        if (score >= 93) return 'A';
        if (score >= 90) return 'A-';
        if (score >= 87) return 'B+';
        if (score >= 83) return 'B';
        if (score >= 80) return 'B-';
        if (score >= 77) return 'C+';
        if (score >= 73) return 'C';
        if (score >= 70) return 'C-';
        if (score >= 60) return 'D';
        return 'F';
    };
    
    const handleCancelEdit = () => {
        setEditingGrade(null);
        setFormData({ ...initialFormState, studentId: selectedStudentId });
    };

    const handleEditClick = (grade: Grade) => {
        setEditingGrade(grade);
        setFormData({
            studentId: grade.studentId,
            testTitle: grade.testTitle,
            subject: grade.subject,
            score: grade.score.toString(),
            comments: grade.comments
        });
    };

    const handleDeleteClick = (gradeId: number) => {
        if (window.confirm('Are you sure you want to delete this grade?')) {
            onDeleteGrade(gradeId);
            if (editingGrade && editingGrade.id === gradeId) {
                handleCancelEdit();
            }
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const score = parseInt(formData.score, 10);
        if (!selectedStudentId) {
            alert('Please select a student first.');
            return;
        }
        if (!formData.subject.trim() || !formData.testTitle.trim() || isNaN(score) || score < 0 || score > 100) {
            alert('Please provide a valid test title, subject, and a score between 0 and 100.');
            return;
        }

        const gradeData = {
            studentId: selectedStudentId,
            testTitle: formData.testTitle,
            subject: formData.subject,
            score: score,
            grade: getLetterGrade(score),
            comments: formData.comments,
        };

        if (editingGrade) {
            onUpdateGrade({ ...gradeData, id: editingGrade.id });
        } else {
            onAddGrade(gradeData);
        }

        setFormData({ ...initialFormState, studentId: selectedStudentId });
        setEditingGrade(null);
    };
    
    const inputClasses = "block w-full rounded-md border border-gray-300 bg-white/80 px-3 py-2 text-base shadow-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700/80 dark:text-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-600";

    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-6">Gradebook</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">{editingGrade ? 'Edit Grade' : 'Add New Grade'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-base font-medium text-gray-700 dark:text-gray-300">Student</label>
                            <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className={inputClasses}>
                                {myStudents.length === 0 ? (
                                    <option value="" disabled>No active students</option>
                                ) : (
                                    <>
                                        <option value="" disabled>Select a student</option>
                                        {myStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </>
                                )}
                            </select>
                        </div>
                         <div>
                            <label className="block text-base font-medium text-gray-700 dark:text-gray-300">Test Title</label>
                            <input type="text" name="testTitle" value={formData.testTitle} onChange={handleFormChange} className={inputClasses} placeholder="e.g., Midterm Exam" required disabled={!selectedStudentId} />
                        </div>
                        <div>
                            <label className="block text-base font-medium text-gray-700 dark:text-gray-300">Subject</label>
                            <input type="text" name="subject" value={formData.subject} onChange={handleFormChange} className={inputClasses} placeholder="e.g., Mathematics" required disabled={!selectedStudentId} />
                        </div>
                        <div>
                            <label className="block text-base font-medium text-gray-700 dark:text-gray-300">Score (0-100)</label>
                            <input type="number" name="score" value={formData.score} onChange={handleFormChange} className={inputClasses} placeholder="e.g., 95" min="0" max="100" required disabled={!selectedStudentId} />
                        </div>
                        <div>
                            <label className="block text-base font-medium text-gray-700 dark:text-gray-300">Comments</label>
                            <textarea name="comments" value={formData.comments} onChange={handleFormChange} rows={3} className={inputClasses} placeholder="Add comments..." disabled={!selectedStudentId}></textarea>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            {editingGrade && (
                                <button type="button" onClick={handleCancelEdit} className="px-4 py-2 text-base font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                            )}
                            <button type="submit" className="px-5 py-2 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 dark:disabled:bg-gray-600" disabled={!selectedStudentId}>{editingGrade ? 'Update Grade' : 'Add Grade'}</button>
                        </div>
                    </form>
                </div>
                <div className="lg:col-span-2 bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
                    <div className="mb-4">
                        <label className="block text-base font-medium text-gray-700 dark:text-gray-300">Select Student to View Grades</label>
                        <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className={inputClasses}>
                            {myStudents.length === 0 ? (
                                <option value="" disabled>No active students in your class</option>
                            ) : (
                                <>
                                    <option value="" disabled>Select a student...</option>
                                    {myStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </>
                            )}
                        </select>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                        Grades for {allUsers.find(u => u.id === selectedStudentId)?.name || '...'}
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-base text-left text-gray-600 dark:text-gray-300">
                            <thead className="text-base text-gray-700 dark:text-gray-400 uppercase bg-white/50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-4 py-3">Test</th>
                                    <th className="px-4 py-3 text-center">Score</th>
                                    <th className="px-4 py-3 text-center">Grade</th>
                                    <th className="px-4 py-3">Comments</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentGrades.map((grade, index) => (
                                    <tr 
                                        key={grade.id} 
                                        className="border-b dark:border-gray-700 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-200 animate-list-item-enter"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{grade.testTitle}</td>
                                        <td className="px-4 py-3 text-center">{grade.score}</td>
                                        <td className="px-4 py-3 font-bold text-center">{grade.grade}</td>
                                        <td className="px-4 py-3 max-w-xs truncate">{grade.comments}</td>
                                        <td className="px-4 py-3 flex gap-2">
                                            <button onClick={() => handleEditClick(grade)} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Edit</button>
                                            <button onClick={() => handleDeleteClick(grade.id)} className="font-medium text-red-600 dark:text-red-400 hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {studentGrades.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-6 text-gray-500 dark:text-gray-400 text-base">{!selectedStudentId ? 'Please select a student to view their grades.' : 'No grades found for this student.'}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GradebookView;