import React, { useMemo, useState, useEffect, useRef } from 'react';
import { User, UserRole, Grade, CommunicationLog } from '../../types';
import Dialog from '../Dialog';
import { ArrowDownTrayIcon, SparklesIcon } from '../icons';
import { generateStudentPerformanceSummary } from '../../services/geminiService';

interface ManageStudentsViewProps {
    user: User;
    allUsers: User[];
    onRegisterStudent: (student: User) => void;
    onBulkRegisterStudents: (students: User[]) => void;
    onUpdateUser: (student: User) => void;
    onDeleteUsers: (userIds: string[]) => void;
    onBulkUpdateUsersStatus: (userIds: string[], status: 'Active' | 'Deactivated') => void;
    grades: Grade[];
    communicationLogs: CommunicationLog[];
}

const initialStudentState: Omit<User, 'role' | 'avatar' | 'status'> = {
    id: '', name: '', password: '', teacherId: '',
    class: '', section: '',
    dateOfBirth: '', gender: 'Male', motherName: '',
    fatherName: '', contactNumber: '', admissionDate: '',
    admissionNo: '', apparId: '', penNo: ''
};

// --- CSV Import Types ---
type ImportStep = 'upload' | 'preview' | 'summary';
interface CsvRow {
    data: Record<string, string>;
    originalIndex: number;
    error?: string;
}

const ManageStudentsView: React.FC<ManageStudentsViewProps> = ({ user, allUsers, onRegisterStudent, onBulkRegisterStudents, onUpdateUser, grades, communicationLogs, onDeleteUsers, onBulkUpdateUsersStatus }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  const [formData, setFormData] = useState<Omit<User, 'role' | 'avatar' | 'status'>>(initialStudentState);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Deactivated'>('Active');
  
  const [classFilter, setClassFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Bulk Actions State ---
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // --- CSV Import State ---
  const [importStep, setImportStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [importSummary, setImportSummary] = useState<{ successCount: number; errors: { row: number; message: string; data: string }[] } | null>(null);
    
  const students = useMemo(() => allUsers.filter(u => u.role === UserRole.Student), [allUsers]);
  const teachers = useMemo(() => allUsers.filter(u => u.role === UserRole.Teacher && u.status === 'Active'), [allUsers]);
  
  const existingDataSets = useMemo(() => ({
    ids: new Set(allUsers.map(u => u.id.toUpperCase())),
    admissionNos: new Set(allUsers.map(u => u.admissionNo).filter(Boolean)),
    apparIds: new Set(allUsers.map(u => u.apparId).filter(Boolean)),
    penNos: new Set(allUsers.map(u => u.penNo).filter(Boolean)),
  }), [allUsers]);


  const isTeacherView = user.role === UserRole.Teacher;

  useEffect(() => {
      if (editingStudent) {
        setFormData({ ...initialStudentState, ...editingStudent });
      } else {
        const defaultState = isTeacherView ? { ...initialStudentState, class: user.class, section: user.section } : initialStudentState;
        setFormData(defaultState);
      }
  }, [editingStudent, isTeacherView, user]);
  
  const visibleStudents = useMemo(() => {
    if (user.role === UserRole.Administrator) return students;
    return students.filter(s => s.teacherId === user.id);
  }, [user, students]);

  const { uniqueClasses, uniqueSections } = useMemo(() => {
    const classSet = new Set<string>();
    const sectionSet = new Set<string>();
    visibleStudents.forEach(s => {
      if(s.class) classSet.add(s.class);
      if(s.section) sectionSet.add(s.section);
    });
    return { 
      uniqueClasses: ['All', ...Array.from(classSet).sort((a, b) => parseInt(a) - parseInt(b))],
      uniqueSections: ['All', ...Array.from(sectionSet).sort()]
    };
  }, [visibleStudents]);

  const filteredStudents = useMemo(() => {
    return visibleStudents.filter(student => {
      const classMatch = classFilter === 'All' || student.class === classFilter;
      const sectionMatch = sectionFilter === 'All' || student.section === sectionFilter;
      const statusMatch = statusFilter === 'All' || student.status === statusFilter;
      const searchMatch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.id.toLowerCase().includes(searchTerm.toLowerCase());
      return classMatch && sectionMatch && statusMatch && searchMatch;
    });
  }, [visibleStudents, classFilter, sectionFilter, statusFilter, searchTerm]);
  
  useEffect(() => {
    setSelectedStudents(new Set());
  }, [classFilter, sectionFilter, statusFilter, searchTerm]);

  const handleOpenForm = (student: User | null = null) => {
    setEditingStudent(student);
    setIsFormOpen(true);
    setError('');
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingStudent(null);
  };
  
  const handleToggleStatus = (student: User) => {
    const newStatus = student.status === 'Active' ? 'Deactivated' : 'Active';
    if(window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} this student?`)) {
      onUpdateUser({ ...student, status: newStatus });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleOpenProfile = (student: User) => {
      setSelectedStudent(student);
      setAiSummary('');
      setIsProfileOpen(true);
  };

  const handleGenerateSummary = async () => {
    if (!selectedStudent) return;
    setIsGeneratingSummary(true);
    setAiSummary('');
    const studentGrades = grades.filter(g => g.studentId === selectedStudent.id);
    const studentLogs = communicationLogs.filter(l => l.studentId === selectedStudent.id);
    const summary = await generateStudentPerformanceSummary(selectedStudent.name, studentGrades, studentLogs);
    setAiSummary(summary);
    setIsGeneratingSummary(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const requiredFields: (keyof typeof formData)[] = ['id', 'name', 'password', 'class', 'section', 'admissionNo'];
    if (user.role === UserRole.Administrator) requiredFields.push('teacherId');

    if (requiredFields.some(field => !formData[field]?.trim())) {
        setError('Please fill out all required fields.'); return;
    }
    if (!editingStudent && existingDataSets.ids.has(formData.id.trim().toUpperCase())) {
        setError('A user with this ID already exists.'); return;
    }

    const studentData: User = {
        ...editingStudent,
        ...formData,
        id: formData.id.trim().toUpperCase(),
        name: formData.name.trim(),
        role: UserRole.Student,
        status: editingStudent?.status || 'Active',
        avatar: editingStudent?.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${formData.name.trim()}`,
        teacherId: user.role === UserRole.Teacher ? user.id : formData.teacherId,
        adminId: user.role === UserRole.Administrator ? user.id : user.adminId,
    };
    
    if (editingStudent) {
      onUpdateUser(studentData);
    } else {
      onRegisterStudent(studentData);
    }
    handleCloseForm();
  };
  
  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId);
        } else {
            newSelection.add(studentId);
        }
        return newSelection;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
      } else {
          setSelectedStudents(new Set());
      }
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
      if (action === 'delete') {
          setIsConfirmDialogOpen(true);
      } else {
          const status = action === 'activate' ? 'Active' : 'Deactivated';
          onBulkUpdateUsersStatus(Array.from(selectedStudents), status);
          setSelectedStudents(new Set());
      }
  };

  const confirmDelete = () => {
      onDeleteUsers(Array.from(selectedStudents));
      setSelectedStudents(new Set());
      setIsConfirmDialogOpen(false);
  };

  const handleDownloadCSV = () => {
    const headers = ["Student ID", "Name", "Password", "Class", "Section", "Admission No.", "APPAR ID", "PEN No.", "Gender", "Date of Birth", "Mother's Name", "Father's Name", "Contact Number", "Admission Date", "Assigned Teacher", "Status"];
    const teacherMap = new Map(allUsers.filter(u => u.role === UserRole.Teacher).map(t => [t.id, t.name]));

    const csvContent = [
        headers.join(','),
        ...filteredStudents.map(s => [
            s.id, `"${s.name}"`, s.password, s.class || '', s.section || '', s.admissionNo || '', s.apparId || '', s.penNo || '', s.gender || '',
            s.dateOfBirth || '', `"${s.motherName || ''}"`, `"${s.fatherName || ''}"`,
            s.contactNumber || '', s.admissionDate || '', `"${s.teacherId ? teacherMap.get(s.teacherId) || 'N/A' : 'N/A'}"`, s.status
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "student_data.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // --- New CSV Import Logic ---
    const importFields = useMemo(() => {
        const baseRequired: { key: keyof User; label: string }[] = [
            { key: 'id', label: 'Student ID' },
            { key: 'name', label: 'Name' },
            { key: 'password', label: 'Password' },
            { key: 'admissionNo', label: 'Admission No.' },
        ];
        
        const optional: { key: keyof User; label: string }[] = [
            { key: 'admissionDate', label: 'Admission Date' },
            { key: 'apparId', label: 'APPAR ID' },
            { key: 'penNo', label: 'PEN No.' },
            { key: 'gender', label: 'Gender' },
            { key: 'dateOfBirth', label: 'Date of Birth' },
            { key: 'motherName', label: "Mother's Name" },
            { key: 'fatherName', label: "Father's Name" },
            { key: 'contactNumber', label: 'Contact Number' },
        ];

        if (user.role === UserRole.Administrator) {
            return {
                required: [ ...baseRequired, { key: 'class', label: 'Class' }, { key: 'section', label: 'Section' }, { key: 'teacherId', label: 'TeacherID' }],
                optional
            };
        }
        
        // For Teacher
        return { required: baseRequired, optional };
    }, [user.role]);

    const handleDownloadTemplate = () => {
        const headers = [...importFields.required.map(f => f.label), ...importFields.optional.map(f => f.label)].join(',');
        const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'student_import_template.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const handleResetImport = () => {
        setImportStep('upload');
        setFileName('');
        setCsvHeaders([]);
        setCsvRows([]);
        setColumnMap({});
        setImportSummary(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            // More robust line splitting for \n and \r\n
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) { alert('CSV file must have a header row and at least one data row.'); return; }
            
            // Safer header parsing (trims whitespace and quotes)
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const rows = lines.slice(1).map((line, index) => {
                // This regex handles commas inside quoted fields
                const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                const rowData: Record<string, string> = {};
                headers.forEach((h, i) => { 
                    // Trim whitespace and quotes from each value
                    rowData[h] = (values[i] || '').trim().replace(/^"|"$/g, '');
                });
                return { data: rowData, originalIndex: index + 2 };
            });

            setCsvHeaders(headers);
            setCsvRows(rows);
            
            const allImportFields = [...importFields.required, ...importFields.optional];
            const newColumnMap: Record<string, string> = {};
            allImportFields.forEach(field => {
                const foundHeader = headers.find(h => h.toLowerCase().replace(/[\s_'.]/g, '') === field.label.toLowerCase().replace(/[\s_'.]/g, ''));
                if (foundHeader) newColumnMap[field.key] = foundHeader;
            });
            setColumnMap(newColumnMap);
            setImportStep('preview');
        };
        reader.readAsText(file);
    };

    const handleMapColumn = (field: keyof User, header: string) => {
        setColumnMap(prev => ({ ...prev, [field]: header }));
    };

    const handleProcessImport = () => {
        const validStudents: User[] = [];
        const importErrors: { row: number; message: string; data: string }[] = [];
        
        // Use a temporary set to check for duplicates within the uploaded file itself
        const tempImportedIds = new Set<string>();
        const tempImportedAdmissionNos = new Set<string>();

        csvRows.forEach(row => {
            const stringifiedData = Object.values(row.data).join(', ');
            
            // 1. Check for missing required fields
            const missingField = importFields.required.find(f => !row.data[columnMap[f.key]]?.trim());
            if (missingField) {
                importErrors.push({ row: row.originalIndex, message: `Missing required field: '${missingField.label}'`, data: stringifiedData });
                return; // Skips to the next iteration in forEach
            }

            const studentId = row.data[columnMap.id]?.trim().toUpperCase();
            const admissionNo = row.data[columnMap.admissionNo]?.trim();

            // 2. Check for duplicates (against existing data AND within the file)
            if (existingDataSets.ids.has(studentId) || tempImportedIds.has(studentId)) {
                importErrors.push({ row: row.originalIndex, message: `Duplicate Student ID: ${studentId}`, data: stringifiedData });
                return;
            }
            if (admissionNo && (existingDataSets.admissionNos.has(admissionNo) || tempImportedAdmissionNos.has(admissionNo))) {
                importErrors.push({ row: row.originalIndex, message: `Duplicate Admission No.: ${admissionNo}`, data: stringifiedData });
                return;
            }

            // If checks pass, add to temporary sets for subsequent row checks
            tempImportedIds.add(studentId);
            if (admissionNo) tempImportedAdmissionNos.add(admissionNo);

            const studentName = row.data[columnMap.name]?.trim();

            // 3. Construct the new student object
            const newStudent: User = {
                id: studentId,
                name: studentName,
                password: row.data[columnMap.password]?.trim(),
                role: UserRole.Student,
                status: 'Active',
                avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(studentName)}`,
                // For Teacher, auto-fill class/section/teacherId. For Admin, use CSV data.
                class: isTeacherView ? user.class : row.data[columnMap.class]?.trim() || '',
                section: isTeacherView ? user.section : row.data[columnMap.section]?.trim().toUpperCase() || '',
                teacherId: isTeacherView ? user.id : row.data[columnMap.teacherId]?.trim() || '',
                adminId: isTeacherView ? user.adminId : user.id,
                // Required and optional fields from CSV
                admissionNo: admissionNo,
                admissionDate: row.data[columnMap.admissionDate]?.trim() || undefined,
                apparId: row.data[columnMap.apparId]?.trim() || undefined,
                penNo: row.data[columnMap.penNo]?.trim() || undefined,
                gender: (row.data[columnMap.gender]?.trim() as User['gender']) || undefined,
                dateOfBirth: row.data[columnMap.dateOfBirth]?.trim() || undefined,
                motherName: row.data[columnMap.motherName]?.trim() || undefined,
                fatherName: row.data[columnMap.fatherName]?.trim() || undefined,
                contactNumber: row.data[columnMap.contactNumber]?.trim() || undefined,
            };
            validStudents.push(newStudent);
        });
        
        // 4. Perform the bulk update if there are any valid students
        if (validStudents.length > 0) {
            onBulkRegisterStudents(validStudents);
        }

        // 5. Show the summary
        setImportSummary({ successCount: validStudents.length, errors: importErrors });
        setImportStep('summary');
    };

    const validatedPreviewRows = useMemo(() => {
        return csvRows.slice(0, 5).map(row => {
            let error;
            const missingField = importFields.required.find(f => !row.data[columnMap[f.key]]?.trim());
            if (missingField) {
                error = `Missing ${missingField.label}`;
            } else {
                const studentId = row.data[columnMap.id]?.trim().toUpperCase();
                if (studentId && existingDataSets.ids.has(studentId)) error = 'Duplicate Student ID';
                const admissionNo = row.data[columnMap.admissionNo]?.trim();
                if (!error && admissionNo && existingDataSets.admissionNos.has(admissionNo)) error = 'Duplicate Admission No.';
            }
            return { ...row, error };
        });
    }, [csvRows, columnMap, existingDataSets, importFields.required]);
  
  const labelClasses = "block mb-1 text-base font-medium text-gray-700 dark:text-gray-300";
  const inputClasses = "block w-full px-3 py-2 text-base bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-200 dark:disabled:bg-gray-600";


  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Manage Students</h1>
        <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-transform transform hover:scale-105 active:scale-95 text-base">
                <ArrowDownTrayIcon className="w-5 h-5"/> Download
            </button>
            <button onClick={() => setIsImportOpen(true)} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-105 active:scale-95 text-base">
                Import CSV
            </button>
            <button onClick={() => handleOpenForm()} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105 active:scale-95 text-base">
                + New Student
            </button>
        </div>
      </div>
      <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input 
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="lg:col-span-2 w-full px-4 py-2 text-base bg-white/80 dark:bg-gray-700/80 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-full px-4 py-2 text-base bg-white/80 dark:bg-gray-700/80 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
              {uniqueClasses.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>)}
          </select>
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="w-full px-4 py-2 text-base bg-white/80 dark:bg-gray-700/80 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
              {uniqueSections.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sections' : s}</option>)}
          </select>
        </div>
         {selectedStudents.size > 0 && (
            <div className="mb-4 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-between animate-fade-in-fast">
                <span className="font-semibold text-indigo-800 dark:text-indigo-200">{selectedStudents.size} student(s) selected</span>
                <div className="flex gap-2">
                    <button onClick={() => handleBulkAction('activate')} className="px-3 py-1 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700">Activate</button>
                    <button onClick={() => handleBulkAction('deactivate')} className="px-3 py-1 text-sm font-semibold text-white bg-yellow-600 rounded-lg hover:bg-yellow-700">Deactivate</button>
                    <button onClick={() => handleBulkAction('delete')} className="px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">Delete</button>
                </div>
            </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-base text-left text-gray-600 dark:text-gray-300">
            <thead className="text-base text-gray-700 dark:text-gray-400 uppercase bg-white/50 dark:bg-gray-900/50 rounded-t-lg">
              <tr>
                <th scope="col" className="p-4">
                    <input 
                        type="checkbox" 
                        onChange={handleSelectAll} 
                        checked={filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length} 
                        className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                </th>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Student ID</th>
                <th scope="col" className="px-6 py-3">Class</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => (
                <tr 
                    key={student.id} 
                    className="bg-transparent border-b dark:border-gray-700 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-200 animate-list-item-enter"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="p-4">
                    <input 
                        type="checkbox" 
                        checked={selectedStudents.has(student.id)} 
                        onChange={() => handleSelectStudent(student.id)} 
                        className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    <div className="flex items-center gap-3">
                        <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover"/>
                        <button onClick={() => handleOpenProfile(student)} className="hover:underline">{student.name}</button>
                    </div>
                  </td>
                  <td className="px-6 py-4">{student.id}</td>
                  <td className="px-6 py-4">{student.class}-{student.section}</td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                      student.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-3">
                    <button onClick={() => handleOpenForm(student)} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Edit</button>
                    <button onClick={() => handleToggleStatus(student)} className={`font-medium ${student.status === 'Active' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} hover:underline`}>
                      {student.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400 text-base">
                        {visibleStudents.length === 0 ? "No students have been registered." : "No students match the current filters."}
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog isOpen={isConfirmDialogOpen} onClose={() => setIsConfirmDialogOpen(false)} title="Confirm Deletion">
          <div>
              <p className="text-lg">Are you sure you want to delete {selectedStudents.size} student(s)?</p>
              <p className="text-base text-red-600 dark:text-red-400 mt-2">
                  This will permanently remove their records, including all grades, requests, and communication logs. This action cannot be undone.
              </p>
              <div className="flex justify-end mt-6">
                  <button onClick={() => setIsConfirmDialogOpen(false)} className="px-4 py-2 font-medium bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded-lg mr-2 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                  <button onClick={confirmDelete} className="px-4 py-2 font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Confirm Delete</button>
              </div>
          </div>
      </Dialog>
      <Dialog isOpen={isFormOpen} onClose={handleCloseForm} title={editingStudent ? 'Edit Student' : 'Register New Student'} size="4xl">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><label className={labelClasses}>Full Name*</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className={inputClasses}/></div>
                <div><label className={labelClasses}>Student ID*</label><input type="text" name="id" value={formData.id} onChange={handleInputChange} className={inputClasses} disabled={!!editingStudent}/></div>
                <div><label className={labelClasses}>Admission No.*</label><input type="text" name="admissionNo" value={formData.admissionNo} onChange={handleInputChange} className={inputClasses} /></div>
                <div><label className={labelClasses}>Password*</label><input type="password" name="password" value={formData.password} onChange={handleInputChange} className={inputClasses}/></div>
                <div><label className={labelClasses}>Class*</label><input type="text" name="class" value={formData.class} onChange={handleInputChange} className={inputClasses} placeholder="e.g., 10" disabled={isTeacherView}/></div>
                <div><label className={labelClasses}>Section*</label><input type="text" name="section" value={formData.section} onChange={handleInputChange} className={inputClasses} placeholder="e.g., A" disabled={isTeacherView}/></div>
                <div><label className={labelClasses}>APPAR ID</label><input type="text" name="apparId" value={formData.apparId} onChange={handleInputChange} className={inputClasses} /></div>
                <div><label className={labelClasses}>PEN No.</label><input type="text" name="penNo" value={formData.penNo} onChange={handleInputChange} className={inputClasses} /></div>
                <div><label className={labelClasses}>Gender</label><select name="gender" value={formData.gender} onChange={handleInputChange} className={inputClasses}><option>Male</option><option>Female</option><option>Other</option></select></div>
                <div><label className={labelClasses}>Date of Birth</label><input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className={inputClasses}/></div>
                <div><label className={labelClasses}>Admission Date</label><input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleInputChange} className={inputClasses}/></div>
                <div><label className={labelClasses}>Mother's Name</label><input type="text" name="motherName" value={formData.motherName} onChange={handleInputChange} className={inputClasses}/></div>
                <div><label className={labelClasses}>Father's Name</label><input type="text" name="fatherName" value={formData.fatherName} onChange={handleInputChange} className={inputClasses}/></div>
                <div><label className={labelClasses}>Contact Number</label><input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className={inputClasses}/></div>
                {user.role === UserRole.Administrator && (
                    <div><label className={labelClasses}>Assign Teacher*</label><select name="teacherId" value={formData.teacherId} onChange={handleInputChange} className={inputClasses}><option value="">Select a teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name} (Class {t.class}-{t.section})</option>)}</select></div>
                )}
            </div>
            {error && <p className="text-base text-red-600 dark:text-red-500 pt-2">{error}</p>}
            <div className="flex justify-end pt-2 border-t dark:border-gray-600 mt-6">
                 <button type="button" onClick={handleCloseForm} className="px-4 py-2 text-base font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 mr-2">Cancel</button>
                 <button type="submit" className="px-4 py-2 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">{editingStudent ? 'Save Changes' : 'Register Student'}</button>
            </div>
        </form>
      </Dialog>
      <Dialog isOpen={isImportOpen} onClose={() => { setIsImportOpen(false); handleResetImport(); }} title="Import Students Wizard" size="4xl">
          <div className="min-h-[60vh]">
              {importStep === 'upload' && (
                  <div className="text-center p-8">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Step 1: Upload your CSV file</h3>
                      <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">Make sure your file has a header row. Don't have a file? Download our template.</p>
                      <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportFileChange} className="block w-full max-w-md mx-auto text-base text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/50 dark:file:text-indigo-300 dark:hover:file:bg-indigo-900"/>
                      <button onClick={handleDownloadTemplate} className="mt-6 flex items-center gap-2 mx-auto px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700">
                          <ArrowDownTrayIcon className="w-5 h-5"/> Download Template
                      </button>
                  </div>
              )}
              {importStep === 'preview' && (
                  <div>
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Step 2: Map Columns & Preview Data</h3>
                      <p className="text-gray-500 dark:text-gray-400 mt-1 mb-4">Match the required fields to the columns from your file: <span className="font-medium text-gray-700 dark:text-gray-200">{fileName}</span></p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700 mb-4">
                          {[...importFields.required, ...importFields.optional].map(field => (
                              <div key={field.key}>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}{importFields.required.some(f => f.key === field.key) ? '*' : ''}</label>
                                  <select value={columnMap[field.key] || ''} onChange={e => handleMapColumn(field.key as keyof User, e.target.value)} className="mt-1 w-full p-2 text-sm bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
                                      <option value="">Select column...</option>
                                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                  </select>
                              </div>
                          ))}
                      </div>
                      <h4 className="font-semibold mb-2 dark:text-gray-200">Data Preview (First 5 rows)</h4>
                      <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
                          <table className="w-full text-sm">
                              <thead className="bg-gray-100 dark:bg-gray-800"><tr className="text-left">{csvHeaders.map(h => <th key={h} className="p-2 font-medium">{h}</th>)}<th className="p-2 font-medium">Status</th></tr></thead>
                              <tbody>
                                  {validatedPreviewRows.map(row => (
                                      <tr key={row.originalIndex} className={`border-t dark:border-gray-700 ${row.error ? 'bg-red-100 dark:bg-red-900/30' : ''}`}>
                                          {csvHeaders.map(h => <td key={h} className="p-2 truncate max-w-[150px]">{row.data[h]}</td>)}
                                          <td className={`p-2 font-semibold ${row.error ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{row.error || 'Ready'}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                      <div className="flex justify-end gap-2 mt-4 pt-4 border-t dark:border-gray-700">
                          <button onClick={handleResetImport} className="px-4 py-2 font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Back</button>
                          <button onClick={handleProcessImport} disabled={importFields.required.some(f => !columnMap[f.key])} className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-800">Confirm & Import</button>
                      </div>
                  </div>
              )}
              {importStep === 'summary' && importSummary && (
                  <div className="p-4 text-center">
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Import Complete!</h3>
                      <p className="text-lg text-green-600 dark:text-green-400 mt-2">{importSummary.successCount} students imported successfully.</p>
                      {importSummary.errors.length > 0 && (
                          <div className="mt-6 text-left">
                              <p className="text-lg font-semibold text-red-600 dark:text-red-400">{importSummary.errors.length} rows failed to import:</p>
                              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700 max-h-60 overflow-y-auto text-sm">
                                  {importSummary.errors.map((err, i) => <p key={i}><strong>Row {err.row}:</strong> {err.message} <span className="text-xs text-gray-500">({err.data})</span></p>)}
                              </div>
                          </div>
                      )}
                      <button onClick={() => { setIsImportOpen(false); handleResetImport(); }} className="mt-6 px-6 py-2 font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Done</button>
                  </div>
              )}
          </div>
      </Dialog>
      {selectedStudent && (
          <Dialog isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} title="Student Profile" size="4xl">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[80vh]">
                    <div className="lg:col-span-1 space-y-4">
                        <div className="flex flex-col items-center p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                            <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-24 h-24 rounded-full mb-2 object-cover" />
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{selectedStudent.name}</h2>
                            <p className="text-gray-500 dark:text-gray-400">{selectedStudent.id} | Class {selectedStudent.class}-{selectedStudent.section}</p>
                        </div>
                        <div className="p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                           <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Details</h3>
                           <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                <p><strong>Admission No:</strong> {selectedStudent.admissionNo || 'N/A'}</p>
                                <p><strong>APPAR ID:</strong> {selectedStudent.apparId || 'N/A'}</p>
                                <p><strong>PEN No:</strong> {selectedStudent.penNo || 'N/A'}</p>
                           </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">AI Performance Summary</h3>
                         <button onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 transition-colors">
                            <SparklesIcon className="w-5 h-5" />
                            {isGeneratingSummary ? 'Generating...' : 'Generate AI Performance Summary'}
                        </button>
                        <div className="p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg min-h-[300px] max-h-[50vh] overflow-y-auto border dark:border-gray-700">
                           {isGeneratingSummary && <p className="text-center text-gray-500 dark:text-gray-400">AI is analyzing the student's data...</p>}
                           {aiSummary && <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: aiSummary.replace(/## (.*)/g, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>').replace(/### (.*)/g, '<h3 class="text-md font-semibold mt-3 mb-1">$1</h3>') }} />}
                        </div>
                    </div>
              </div>
          </Dialog>
      )}
    </div>
  );
};

export default ManageStudentsView;