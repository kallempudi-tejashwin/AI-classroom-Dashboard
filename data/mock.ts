import { User, UserRole, Announcement, ClassFile, LeaveRequest, Grade } from '../types';

export const MOCK_USERS: User[] = [
  // Administrator is the only user at the start
  // Developer User
  { id: 'DEV001', name: 'Developer', role: UserRole.Developer, avatar: `https://api.dicebear.com/8.x/initials/svg?seed=Dev`, password: '123456', status: 'Active' },
  { id: 'ADM301', name: 'Sarah Wilson', role: UserRole.Administrator, avatar: `https://api.dicebear.com/8.x/initials/svg?seed=Sarah Wilson`, password: 'admin', status: 'Active' },
  // Sample Teacher
  { id: 'TCH201', name: 'David Lee', role: UserRole.Teacher, avatar: `https://api.dicebear.com/8.x/initials/svg?seed=David Lee`, password: 'teacher', class: '10', section: 'A', status: 'Active', adminId: 'ADM301' },
  // Sample Student
  { id: 'STU101', name: 'Alex Johnson', role: UserRole.Student, avatar: `https://api.dicebear.com/8.x/initials/svg?seed=Alex Johnson`, password: 'student', teacherId: 'TCH201', class: '10', section: 'A', status: 'Active', admissionNo: 'ADM12345', apparId: 'APPAR67890', penNo: 'PEN54321', adminId: 'ADM301' },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
    {
        id: 1,
        author: 'Sarah Wilson',
        authorId: 'ADM301',
        avatar: `https://api.dicebear.com/8.x/initials/svg?seed=Sarah Wilson`,
        content: 'Welcome everyone to the new school year! Please make sure to update your profiles in the settings section.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    }
];

export const MOCK_CLASS_FILES: ClassFile[] = [];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [];

export const MOCK_GRADES: Grade[] = [
  { id: 1, studentId: 'STU101', testTitle: 'Calculus Midterm', subject: 'Mathematics', score: 92, grade: 'A', comments: 'Excellent understanding of calculus concepts.' },
  { id: 2, studentId: 'STU101', testTitle: 'Lab Report: Electromagnetism', subject: 'Physics', score: 88, grade: 'B+', comments: 'Strong performance in labs, needs to review theory on electromagnetism.' },
  { id: 3, studentId: 'STU101', testTitle: 'Essay: Shakespearean Sonnets', subject: 'Literature', score: 95, grade: 'A+', comments: 'Insightful analysis in the essay on Shakespeare.' },
  { id: 4, studentId: 'STU101', testTitle: 'World War II Exam', subject: 'History', score: 85, grade: 'B', comments: 'Good grasp of events, can improve on source analysis.' },
  { id: 5, studentId: 'STU101', testTitle: 'Final Project: Data Structures', subject: 'Computer Science', score: 98, grade: 'A+', comments: 'Exceptional coding skills and project work.' },
  { id: 6, studentId: 'STU101', testTitle: 'Still Life Painting', subject: 'Art', score: 82, grade: 'B-', comments: 'Shows creativity but can work on technical skills.' },
];

export const MOCK_SEED_DATA = {
    users: [],
    grades: [],
    leaveRequests: [],
};