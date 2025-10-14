import { User, UserRole, Announcement, ClassFile, LeaveRequest, Grade } from '../types';

export const MOCK_USERS: User[] = [
  // Administrator is the only user at the start
  { id: 'ADM301', name: 'Sarah Wilson', role: UserRole.Administrator, avatar: `https://api.dicebear.com/8.x/initials/svg?seed=Sarah Wilson`, password: 'admin', status: 'Active' },
  // Developer User
  { id: 'DEV001', name: 'Developer', role: UserRole.Developer, avatar: `https://api.dicebear.com/8.x/initials/svg?seed=Dev`, password: '123456', status: 'Active' },
  // Sample Teacher
  { id: 'TCH201', name: 'David Lee', role: UserRole.Teacher, avatar: `https://api.dicebear.com/8.x/initials/svg?seed=David Lee`, password: 'password', class: '10', section: 'A', status: 'Active', adminId: 'ADM301' },
  // Sample Student
  { id: 'STU101', name: 'Alex Johnson', role: UserRole.Student, avatar: `https://api.dicebear.com/8.x/initials/svg?seed=Alex Johnson`, password: 'password', teacherId: 'TCH201', class: '10', section: 'A', status: 'Active', admissionNo: 'ADM12345', apparId: 'APPAR67890', penNo: 'PEN54321', adminId: 'ADM301' },
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

// New larger mock data for seeding
const SEED_TEACHERS: User[] = [
    { id: 'TCH202', name: 'Maria Garcia', role: UserRole.Teacher, avatar: `https://api.dicebear.com/8.x/initials/svg?seed=Maria Garcia`, password: 'password', class: '10', section: 'B', status: 'Active', adminId: 'ADM301' },
    { id: 'TCH203', name: 'James Smith', role: UserRole.Teacher, avatar: `https://api.dicebear.com/8.x/initials/svg?seed=James Smith`, password: 'password', class: '9', section: 'A', status: 'Active', adminId: 'ADM301' },
];

const SEED_STUDENTS: User[] = [
    // Students for TCH201
    { id: 'STU102', name: 'Emily White', role: UserRole.Student, avatar: `https://api.dicebear.com/8.x/initials/svg?seed=Emily White`, password: 'password', teacherId: 'TCH201', class: '10', section: 'A', status: 'Active', admissionNo: 'ADM12346', adminId: 'ADM301' },
    { id: 'STU103', name: 'Michael Brown', role: UserRole.Student, avatar: `https://api.dicebear.com/8.x/initials/svg?seed=Michael Brown`, password: 'password', teacherId: 'TCH201', class: '10', section: 'A', status: 'Active', admissionNo: 'ADM12347', adminId: 'ADM301' },
    // Students for TCH202
    { id: 'STU104', name: 'Jessica Green', role: UserRole.Student, avatar: `https://api.dicebear.com/8.x/initials/svg?seed=Jessica Green`, password: 'password', teacherId: 'TCH202', class: '10', section: 'B', status: 'Active', admissionNo: 'ADM12348', adminId: 'ADM301' },
    { id: 'STU105', name: 'Chris Taylor', role: UserRole.Student, avatar: `https://api.dicebear.com/8.x/initials/svg?seed=Chris Taylor`, password: 'password', teacherId: 'TCH202', class: '10', section: 'B', status: 'Deactivated', admissionNo: 'ADM12349', adminId: 'ADM301' },
    // Students for TCH203
    { id: 'STU106', name: 'Olivia Martinez', role: UserRole.Student, avatar: `https://api.dicebear.com/8.x/initials/svg?seed=Olivia Martinez`, password: 'password', teacherId: 'TCH203', class: '9', section: 'A', status: 'Active', admissionNo: 'ADM12350', adminId: 'ADM301' },
];

const SEED_GRADES: Grade[] = [
    { id: 101, studentId: 'STU102', testTitle: 'Algebra Test', subject: 'Mathematics', score: 78, grade: 'C+', comments: 'Good effort, needs to practice factoring.' },
    { id: 102, studentId: 'STU103', testTitle: 'Algebra Test', subject: 'Mathematics', score: 95, grade: 'A+', comments: 'Outstanding work.' },
    { id: 103, studentId: 'STU104', testTitle: 'History Paper', subject: 'History', score: 88, grade: 'B+', comments: 'Well-researched paper.' },
    { id: 104, studentId: 'STU105', testTitle: 'History Paper', subject: 'History', score: 65, grade: 'D', comments: 'Needs more sources and better structure.' },
    { id: 105, studentId: 'STU106', testTitle: 'Science Fair Project', subject: 'Science', score: 92, grade: 'A', comments: 'Creative and well-executed project.' },
];

const SEED_LEAVE_REQUESTS: LeaveRequest[] = [
    { id: 101, user: SEED_STUDENTS[0], type: 'Leave', reason: 'Family function', status: 'Approved', fromDate: '2024-05-10', toDate: '2024-05-11' },
    { id: 102, user: SEED_STUDENTS[2], type: 'Leave', reason: 'Medical appointment', status: 'Pending', fromDate: '2024-05-20', toDate: '2024-05-20' },
    { id: 103, user: SEED_TEACHERS[1], type: 'Leave', reason: 'Personal leave', status: 'Pending', fromDate: '2024-06-01', toDate: '2024-06-03' },
];

export const MOCK_SEED_DATA = {
    users: [...SEED_TEACHERS, ...SEED_STUDENTS],
    grades: SEED_GRADES,
    leaveRequests: SEED_LEAVE_REQUESTS,
};