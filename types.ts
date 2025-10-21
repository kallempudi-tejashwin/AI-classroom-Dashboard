// Fix: Import React to use React.ElementType type.
import React from 'react';

export enum UserRole {
  Student = "Student",
  Teacher = "Teacher",
  Administrator = "Administrator",
  Developer = "Developer",
}

export enum TabId {
  Dashboard = "Dashboard",
  ManageTeachers = "ManageTeachers",
  ManageStudents = "ManageStudents",
  Classes = "Classes",
  Content = "Content",
  Leave = "Leave",
  Grades = "Grades",
  Gradebook = "Gradebook",
  CommLog = "CommLog",
  MyCommLog = "MyCommLog",
  Announcements = "Announcements",
  Support = "Support",
  Settings = "Settings",
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  password?: string;
  teacherId?: string;
  adminId?: string; // Link to the managing administrator
  status: 'Active' | 'Deactivated';
  // Tracking for feature limits
  lastAvatarChange?: string; // ISO Date string
  passwordLastChanged?: string; // ISO Date string
  // Detailed student info
  class?: string;
  section?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  motherName?: string;
  fatherName?: string;
  contactNumber?: string;
  admissionDate?: string;
  admissionNo?: string;
  apparId?: string;
  penNo?: string;
}

// A more specific type for Students
export type Student = User & {
  role: UserRole.Student;
};

export interface Tab {
  id: TabId;
  label: string;
  roles: UserRole[];
  icon: React.ElementType;
}

export interface Recommendation {
  title: string;
  description: string;
  category: string;
}

export interface SystemStatus {
  service: string;
  status: 'Operational' | 'Degraded' | 'Offline';
  details: string;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface Announcement {
  id: number;
  author: string;
  authorId: string;
  avatar: string;
  content: string;
  timestamp: Date;
  targetClasses?: { class: string; section: string }[];
  attachment?: {
    name: string;
    url: string; // Data URL
    type: string; // Mime type
  };
}

export interface ClassFile {
  id: number;
  name: string;
  uploader: string;
  avatar: string;
  category: string;
  tags: string[];
  targetClasses: 'All' | { class: string; section: string }[];
  uploadTimestamp: Date;
  description?: string;
}

export interface LeaveRequest {
  id: number;
  user: User;
  type: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  fromDate: string;
  toDate: string;
}

export interface Grade {
  id: number;
  studentId: string;
  testTitle: string;
  subject: string;
  score: number;
  grade: string;
  comments: string;
}

export interface CommunicationLog {
  id: number;
  studentId: string;
  teacherId: string;
  timestamp: Date;
  note: string;
}