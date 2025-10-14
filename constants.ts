import { UserRole, Tab, TabId } from './types';
import { HomeIcon, BoltIcon, ChartBarIcon, DocumentTextIcon, WrenchScrewdriverIcon, Cog6ToothIcon, UserGroupIcon, AcademicCapIcon, CalendarDaysIcon, BookOpenIcon, MegaphoneIcon, ClipboardDocumentCheckIcon, ChatBubbleLeftRightIcon, SparklesIcon } from './components/icons';

export const TABS: Tab[] = [
  { id: TabId.Dashboard, label: "Dashboard", roles: [UserRole.Student, UserRole.Teacher, UserRole.Administrator], icon: HomeIcon },
  { id: TabId.ManageTeachers, label: "Manage Teachers", roles: [UserRole.Administrator], icon: UserGroupIcon },
  { id: TabId.ManageStudents, label: "Manage Students", roles: [UserRole.Administrator, UserRole.Teacher], icon: AcademicCapIcon },
  { id: TabId.Classes, label: "Classes", roles: [UserRole.Teacher, UserRole.Administrator], icon: BookOpenIcon },
  { id: TabId.Content, label: "Class Files", roles: [UserRole.Student, UserRole.Teacher, UserRole.Administrator], icon: DocumentTextIcon },
  { id: TabId.Leave, label: "Requests", roles: [UserRole.Student, UserRole.Teacher, UserRole.Administrator], icon: CalendarDaysIcon },
  { id: TabId.Grades, label: "My Grades", roles: [UserRole.Student], icon: ClipboardDocumentCheckIcon },
  { id: TabId.Gradebook, label: "Gradebook", roles: [UserRole.Teacher], icon: ClipboardDocumentCheckIcon },
  { id: TabId.CommLog, label: "Comm Log", roles: [UserRole.Teacher], icon: ChatBubbleLeftRightIcon },
  { id: TabId.MyCommLog, label: "My Comm Log", roles: [UserRole.Student], icon: ChatBubbleLeftRightIcon },
  { id: TabId.Announcements, label: "Announcements", roles: [UserRole.Student, UserRole.Teacher, UserRole.Administrator], icon: MegaphoneIcon },
  { id: TabId.Support, label: "Support", roles: [UserRole.Administrator], icon: WrenchScrewdriverIcon },
  // { id: TabId.Settings, label: "Profile & Settings", roles: [UserRole.Student, UserRole.Teacher, UserRole.Administrator], icon: Cog6ToothIcon },
];

export const ACCENT_COLORS = [
  { name: 'Indigo', color: 'bg-indigo-500', ring: 'ring-indigo-400', text: 'text-indigo-500' },
  { name: 'Teal', color: 'bg-teal-500', ring: 'ring-teal-400', text: 'text-teal-500' },
  { name: 'Rose', color: 'bg-rose-500', ring: 'ring-rose-400', text: 'text-rose-500' },
  { name: 'Sky', color: 'bg-sky-500', ring: 'ring-sky-400', text: 'text-sky-500' },
];

export const MOTIVATIONAL_QUOTES = [
    "The beautiful thing about learning is that no one can take it away from you.",
    "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
    "The only way to do great work is to love what you do.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "Believe you can and you're halfway there."
];