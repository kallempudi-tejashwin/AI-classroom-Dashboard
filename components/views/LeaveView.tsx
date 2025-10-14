import React, { useState, useMemo } from 'react';
import { User, LeaveRequest, UserRole } from '../../types';
import { getSmartReply } from '../../services/geminiService';
import Dialog from '../Dialog';

interface LeaveViewProps {
  user: User;
  allUsers: User[];
  leaveRequests: LeaveRequest[];
  onLeaveRequestSubmit: (request: LeaveRequest) => void;
  onUpdateRequestStatus: (requestId: number, status: 'Approved' | 'Rejected') => void;
}

const AttendanceSummary: React.FC<{ studentRequests: LeaveRequest[] }> = ({ studentRequests }) => {
    const TOTAL_WORKING_DAYS = 210;
    const REQUIRED_ATTENDANCE_PERCENT = 0.80;
    const MAX_LEAVE_DAYS = Math.floor(TOTAL_WORKING_DAYS * (1 - REQUIRED_ATTENDANCE_PERCENT));

    const calculateDaysBetween = (from: string, to: string): number => {
        if (!from || !to) return 0;
        const fromDate = new Date(from);
        const toDate = new Date(to);
        const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };
    
    const leaveDaysTaken = studentRequests
        .filter(req => req.status === 'Approved' && req.type === 'Leave')
        .reduce((acc, req) => acc + calculateDaysBetween(req.fromDate, req.toDate), 0);
        
    const remainingLeaveDays = MAX_LEAVE_DAYS - leaveDaysTaken;
    const attendancePercentage = ((TOTAL_WORKING_DAYS - leaveDaysTaken) / TOTAL_WORKING_DAYS * 100).toFixed(1);

    return (
        <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Attendance Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{attendancePercentage}%</p>
                    <p className="text-base text-gray-600 dark:text-gray-400">Current Attendance</p>
                </div>
                 <div>
                    <p className="text-3xl font-bold text-gray-700 dark:text-gray-200">{MAX_LEAVE_DAYS}</p>
                    <p className="text-base text-gray-600 dark:text-gray-400">Allowed Leave Days</p>
                </div>
                <div>
                    <p className="text-3xl font-bold text-red-500">{leaveDaysTaken}</p>
                    <p className="text-base text-gray-600 dark:text-gray-400">Leave Days Taken</p>
                </div>
                <div>
                    <p className="text-3xl font-bold text-green-600">{remainingLeaveDays}</p>
                    <p className="text-base text-gray-600 dark:text-gray-400">Remaining Days</p>
                </div>
            </div>
        </div>
    );
};


const LeaveView: React.FC<LeaveViewProps> = ({ user, allUsers, leaveRequests, onLeaveRequestSubmit, onUpdateRequestStatus }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  // Form state for students
  const [studentRequestType, setStudentRequestType] = useState('Leave');
  const [studentReason, setStudentReason] = useState('');
  const [studentFromDate, setStudentFromDate] = useState('');
  const [studentToDate, setStudentToDate] = useState('');
  const [isStudentRewriting, setIsStudentRewriting] = useState(false);

  // Form state for teachers (their own leave)
  const [teacherReason, setTeacherReason] = useState('');
  const [teacherFromDate, setTeacherFromDate] = useState('');
  const [teacherToDate, setTeacherToDate] = useState('');

  // View state for teachers
  const [teacherView, setTeacherView] = useState<'studentRequests' | 'myRequests'>('studentRequests');

  const myStudentIds = useMemo(() => {
    if (user.role !== UserRole.Teacher) return [];
    return allUsers.filter(u => u.teacherId === user.id).map(s => s.id);
  }, [user, allUsers]);

  const filteredRequests = useMemo(() => {
      switch (user.role) {
          case UserRole.Administrator:
              return leaveRequests.filter(req => 
                  (req.user.role === UserRole.Teacher && req.type === 'Leave') || 
                  (req.user.role === UserRole.Student && req.type === 'Technical Help')
              ).sort((a,b) => b.id - a.id);
          case UserRole.Teacher:
              if (teacherView === 'studentRequests') {
                  return leaveRequests.filter(req => 
                      myStudentIds.includes(req.user.id) && 
                      (req.type === 'Leave' || req.type === 'Resource')
                  ).sort((a,b) => b.id - a.id);
              }
              return leaveRequests.filter(req => req.user.id === user.id).sort((a,b) => b.id - a.id);
          case UserRole.Student:
              return leaveRequests.filter(req => req.user.id === user.id).sort((a,b) => b.id - a.id);
          default:
              return [];
      }
  }, [user.role, leaveRequests, myStudentIds, teacherView]);

  const handleViewDetails = (request: LeaveRequest) => {
      setSelectedRequest(request);
      setShowDialog(true);
  };
  
  const handleStatusUpdate = (requestId: number, status: 'Approved' | 'Rejected') => {
      onUpdateRequestStatus(requestId, status);
  };

  const handleStudentRewrite = async () => {
      if (!studentReason.trim()) { alert("Please provide a reason first."); return; }
      setIsStudentRewriting(true);
      const prompt = `Rewrite the following request reason to be more professional, correct any grammatical errors, and briefly expand on it. Keep it concise.\n\nReason: "${studentReason}"`;
      const rewrittenReason = await getSmartReply(prompt);
      setStudentReason(rewrittenReason);
      setIsStudentRewriting(false);
  };
  
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentReason.trim() || !studentFromDate || !studentToDate) {
        alert("Please fill in all fields: from date, to date, and a reason."); return;
    }
    const newRequest: LeaveRequest = {
        id: Date.now(), user: user, type: studentRequestType,
        reason: studentReason, status: 'Pending',
        fromDate: studentFromDate, toDate: studentToDate,
    };
    onLeaveRequestSubmit(newRequest);
    setStudentReason(''); setStudentFromDate(''); setStudentToDate('');
  };
  
  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherReason.trim() || !teacherFromDate || !teacherToDate) {
        alert("Please fill in all fields."); return;
    }
    const newRequest: LeaveRequest = {
        id: Date.now(), user: user, type: 'Leave',
        reason: teacherReason, status: 'Pending',
        fromDate: teacherFromDate, toDate: teacherToDate,
    };
    onLeaveRequestSubmit(newRequest);
    setTeacherReason(''); setTeacherFromDate(''); setTeacherToDate('');
  };

  const getStatusClass = (status: 'Pending' | 'Approved' | 'Rejected') => {
      switch (status) {
          case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
          case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
          case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      }
  };

  const renderRequestList = (requests: LeaveRequest[], isManagerView: boolean) => {
    const canManage = (request: LeaveRequest): boolean => {
        if (!isManagerView || request.status !== 'Pending') return false;
        if (user.role === UserRole.Administrator) return true;
        if (user.role === UserRole.Teacher) return myStudentIds.includes(request.user.id);
        return false;
    };

    return (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {requests.length > 0 ? requests.map((request, index) => (
                <div key={request.id} className="p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-wrap justify-between items-center gap-2 animate-list-item-enter" style={{ animationDelay: `${index * 50}ms` }}>
                    <div>
                        <p className="font-semibold text-lg text-gray-800 dark:text-gray-100">{request.user.name} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({request.user.role})</span></p>
                        <p className="text-sm text-gray-500 dark:text-gray-400"><strong>Type:</strong> {request.type}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400"><strong>Dates:</strong> {new Date(request.fromDate).toLocaleDateString()} to {new Date(request.toDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${getStatusClass(request.status)}`}>{request.status}</span>
                        <button onClick={() => handleViewDetails(request)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">View</button>
                        {canManage(request) && (
                            <>
                                <button onClick={() => handleStatusUpdate(request.id, 'Approved')} className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-200 rounded-full hover:bg-green-300 dark:bg-green-900/60 dark:text-green-300 dark:hover:bg-green-900">Approve</button>
                                <button onClick={() => handleStatusUpdate(request.id, 'Rejected')} className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-200 rounded-full hover:bg-red-300 dark:bg-red-900/60 dark:text-red-300 dark:hover:bg-red-900">Reject</button>
                            </>
                        )}
                    </div>
                </div>
            )) : <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-base">No requests found in this view.</p>}
        </div>
    );
  };
  
  const renderStudentView = () => (
    <>
      <AttendanceSummary studentRequests={filteredRequests} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Submit a Request</h2>
          <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                  <label htmlFor="requestType" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Request Type</label>
                  <select id="requestType" value={studentRequestType} onChange={(e) => setStudentRequestType(e.target.value)} className="w-full bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base">
                      <option>Leave</option><option>Resource</option><option>Technical Help</option>
                  </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="fromDate" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
                      <input type="date" id="fromDate" value={studentFromDate} onChange={e => setStudentFromDate(e.target.value)} className="w-full bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base" />
                  </div>
                  <div>
                      <label htmlFor="toDate" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
                      <input type="date" id="toDate" value={studentToDate} onChange={e => setStudentToDate(e.target.value)} className="w-full bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base" />
                  </div>
              </div>
              <div>
                  <label htmlFor="reason" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Reason / Details</label>
                  <textarea id="reason" rows={5} value={studentReason} onChange={(e) => setStudentReason(e.target.value)} placeholder="Describe your request..." className="w-full bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base" />
              </div>
              <div className="flex justify-between items-center">
                  <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-transform transform hover:scale-105 active:scale-95 text-base">Submit</button>
                  <button type="button" onClick={handleStudentRewrite} disabled={isStudentRewriting} className="px-5 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 transition-colors disabled:bg-gray-400 transition-transform transform hover:scale-105 active:scale-95 text-base">{isStudentRewriting ? 'Rewriting...' : 'Rewrite with AI ✨'}</button>
              </div>
          </form>
        </div>
        <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">My Request History</h2>
          {renderRequestList(filteredRequests, false)}
        </div>
      </div>
    </>
  );

  const renderTeacherView = () => (
    <>
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button onClick={() => setTeacherView('studentRequests')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg ${teacherView === 'studentRequests' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}>Student Requests</button>
            <button onClick={() => setTeacherView('myRequests')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg ${teacherView === 'myRequests' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}>My Leave</button>
        </nav>
      </div>
      {teacherView === 'studentRequests' ? (
        <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Pending Student Requests</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Review leave and resource requests from your assigned students.</p>
            {renderRequestList(filteredRequests, true)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-indigo-900/40 p-6 rounded-xl shadow-lg border border-white/20 dark:border-white/10">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Submit Leave to Admin</h2>
                <form onSubmit={handleTeacherSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label htmlFor="teacherFromDate" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
                          <input type="date" id="teacherFromDate" value={teacherFromDate} onChange={e => setTeacherFromDate(e.target.value)} className="w-full bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"/>
                      </div>
                      <div>
                          <label htmlFor="teacherToDate" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
                          <input type="date" id="teacherToDate" value={teacherToDate} onChange={e => setTeacherToDate(e.target.value)} className="w-full bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"/>
                      </div>
                    </div>
                    <div>
                        <label htmlFor="teacherReason" className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                        <textarea id="teacherReason" rows={4} value={teacherReason} onChange={e => setTeacherReason(e.target.value)} placeholder="Reason for leave..." className="w-full bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"/>
                    </div>
                    <div className="text-right">
                        <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-transform transform hover:scale-105 active:scale-95 text-base">Submit Leave Request</button>
                    </div>
                </form>
            </div>
            <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">My Leave History</h2>
                {renderRequestList(filteredRequests, false)}
            </div>
        </div>
      )}
    </>
  );

  const renderAdminView = () => (
    <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Request Queue</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Manage incoming teacher leave requests and student technical support tickets.</p>
      {renderRequestList(filteredRequests, true)}
    </div>
  );

  return (
    <div>
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-6">{user.role === UserRole.Student ? 'My Requests' : (user.role === UserRole.Teacher ? 'Requests Center' : 'Manage Requests')}</h1>
        {user.role === UserRole.Student && renderStudentView()}
        {user.role === UserRole.Teacher && renderTeacherView()}
        {user.role === UserRole.Administrator && renderAdminView()}
        {selectedRequest && (
            <Dialog isOpen={showDialog} onClose={() => setShowDialog(false)} title="Request Details">
                <div className="space-y-3 text-base">
                    <p><strong>Applicant:</strong> {selectedRequest.user.name}</p>
                    <p><strong>Role:</strong> {selectedRequest.user.role}</p>
                    <p><strong>From Date:</strong> {new Date(selectedRequest.fromDate).toLocaleDateString()}</p>
                    <p><strong>To Date:</strong> {new Date(selectedRequest.toDate).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> <span className={`font-medium px-2 py-0.5 rounded-full ${getStatusClass(selectedRequest.status)}`}>{selectedRequest.status}</span></p>
                    <p><strong>Reason:</strong></p>
                    <p className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md text-gray-700 dark:text-gray-200">{selectedRequest.reason}</p>
                </div>
            </Dialog>
        )}
    </div>
  );
};

export default LeaveView;