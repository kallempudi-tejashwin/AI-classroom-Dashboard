import React, { useState, useCallback, useMemo } from 'react';
import { categorizeFile } from '../../services/geminiService';
import { DocumentTextIcon, ArrowDownTrayIcon } from '../icons';
import { User, ClassFile, UserRole } from '../../types';
import Dialog from '../Dialog';

interface ContentViewProps {
    user: User;
    allUsers: User[];
    files: ClassFile[];
    onAddFile: (file: ClassFile) => void;
}

interface PendingFile {
    name: string;
    category: string;
    tags: string[];
    description: string;
}

const ALLOWED_FILE_TYPES = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ContentView: React.FC<ContentViewProps> = ({ user, allUsers, files, onAddFile }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
    const [targetScope, setTargetScope] = useState<'All' | 'Specific'>('All');
    const [selectedClasses, setSelectedClasses] = useState<Record<string, boolean>>({});
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const isUploader = user.role === UserRole.Administrator || user.role === UserRole.Teacher;

    const availableClasses = useMemo(() => {
        const classSet = new Set<string>();
        allUsers.filter(u => u.role === UserRole.Student && u.class && u.section)
            .forEach(s => classSet.add(`${s.class}-${s.section}`));
        return Array.from(classSet).sort();
    }, [allUsers]);

    const handleFileValidation = (file: File): boolean => {
        setUploadError(null);
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            setUploadError(`Invalid file type. Please upload PDF, DOCX, TXT, JPG, or PNG.`);
            return false;
        }
        if (file.size > MAX_FILE_SIZE) {
            setUploadError(`File is too large. Maximum size is 10MB.`);
            return false;
        }
        return true;
    };
    
    const handleFileDrop = async (selectedFile: File | null) => {
        if (!selectedFile) return;
        if (!handleFileValidation(selectedFile)) return;

        setIsLoading(true);
        setPendingFile(null);
        setUploadProgress(0);

        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress(prev => (prev >= 90 ? 90 : prev + 10));
        }, 150);

        const result = await categorizeFile(selectedFile.name);
        clearInterval(interval);
        setUploadProgress(100);

        setTimeout(() => {
            setPendingFile({ name: selectedFile.name, ...result, description: '' });
            setIsLoading(false);
            setIsPublishing(true);
            setUploadProgress(0);
        }, 500);
    };
  
    const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (isUploader) setIsDragOver(true);
    }, [isUploader]);

    const onDragLeave = useCallback(() => setIsDragOver(false), []);

    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (isUploader && e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileDrop(e.dataTransfer.files[0]);
        }
    }, [isUploader]);

    const handleClassToggle = (classKey: string) => {
        setSelectedClasses(prev => ({ ...prev, [classKey]: !prev[classKey] }));
    };

    const handlePublish = () => {
        if (!pendingFile) return;

        let targetClasses: 'All' | { class: string; section: string }[];
        if (targetScope === 'All') {
            targetClasses = 'All';
        } else {
            targetClasses = Object.entries(selectedClasses)
                .filter(([, isSelected]) => isSelected)
                .map(([key]) => ({ class: key.split('-')[0], section: key.split('-')[1] }));
            if (targetClasses.length === 0) {
                alert('Please select at least one class to publish to.');
                return;
            }
        }

        const newFile: ClassFile = {
            id: Date.now(),
            name: pendingFile.name,
            uploader: user.name,
            avatar: user.avatar,
            category: pendingFile.category,
            tags: pendingFile.tags,
            targetClasses,
            uploadTimestamp: new Date(),
            description: pendingFile.description.trim(),
        };

        onAddFile(newFile);
        setIsPublishing(false);
        setPendingFile(null);
        setSelectedClasses({});
        setTargetScope('All');
    };

    const visibleFiles = useMemo(() => {
        if (isUploader) return files;
        return files.filter(file => {
            if (file.targetClasses === 'All') return true;
            if (Array.isArray(file.targetClasses)) {
                return file.targetClasses.some(tc => tc.class === user.class && tc.section === user.section);
            }
            return false;
        }).sort((a, b) => b.uploadTimestamp.getTime() - a.uploadTimestamp.getTime());
    }, [files, user, isUploader]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">{isUploader ? 'Manage Class Files' : 'Class Resources'}</h1>
            {isUploader && (
                <div className="bg-white/50 dark:bg-black/20 p-6 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10 mb-8">
                  <div
                      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                      className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors duration-300 bg-white/50 dark:bg-gray-700/30 ${isDragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400'}`}
                  >
                      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileDrop(e.target.files ? e.target.files[0] : null)} disabled={isLoading} />
                      <>
                          <DocumentTextIcon className="w-12 h-12 text-gray-400 mb-3" />
                          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Drag & drop a file to upload</p>
                          <p className="text-gray-500 dark:text-gray-400">or click to select a file</p>
                          <p className="text-xs text-gray-400 mt-2">Max file size: 10MB. Allowed types: PDF, DOCX, TXT, JPG, PNG.</p>
                      </>
                  </div>
                  {uploadError && <p className="text-red-600 text-sm mt-2 text-center">{uploadError}</p>}
                  {isLoading && (
                    <div className="mt-4">
                        <div className="flex justify-between mb-1">
                            <span className="text-base font-medium text-indigo-700 dark:text-indigo-300">AI is analyzing your file...</span>
                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%`, transition: 'width 0.2s' }}></div>
                        </div>
                    </div>
                  )}
                </div>
            )}

            <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">{isUploader ? 'Recently Uploaded Files' : 'Available For You'}</h2>
                <div className="space-y-4">
                    {visibleFiles.map(file => (
                        <div key={file.id} className="bg-white/50 dark:bg-black/20 p-4 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10 card-hover-effect">
                            <div className="flex items-start gap-4">
                                <DocumentTextIcon className="w-10 h-10 text-indigo-500 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{file.name}</p>
                                    {file.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{file.description}</p>}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">By {file.uploader} on {file.uploadTimestamp.toLocaleDateString()}</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        {file.tags.map(tag => <span key={tag} className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>)}
                                    </div>
                                </div>
                                {!isUploader && (
                                    <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-teal-700">
                                        <ArrowDownTrayIcon className="w-4 h-4" /> Download
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {visibleFiles.length === 0 && !isLoading && (
                        <div className="text-center py-10 bg-white/50 dark:bg-black/20 rounded-xl shadow-sm border dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400">No files have been shared yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {isUploader && pendingFile && (
                <Dialog isOpen={isPublishing} onClose={() => setIsPublishing(false)} title="Publish File">
                    <div className="space-y-4">
                        <div>
                            <p className="font-semibold text-lg text-gray-800 dark:text-gray-100">{pendingFile.name}</p>
                            <p><strong>AI Category:</strong> <span className="font-semibold text-teal-600 dark:text-teal-400">{pendingFile.category}</span></p>
                            <div className="mt-1 flex flex-wrap gap-2">
                                {pendingFile.tags.map(tag => <span key={tag} className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>)}
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
                            <textarea
                                value={pendingFile.description}
                                onChange={(e) => setPendingFile(p => p ? {...p, description: e.target.value} : null)}
                                rows={2}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Add a short description for the file..."
                            />
                        </div>
                        <div className="pt-2 border-t dark:border-gray-600">
                            <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Select Audience</h3>
                            <div className="flex gap-4">
                                <label className="flex items-center"><input type="radio" name="scope" checked={targetScope === 'All'} onChange={() => setTargetScope('All')} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300" /> <span className="ml-2">All Students</span></label>
                                <label className="flex items-center"><input type="radio" name="scope" checked={targetScope === 'Specific'} onChange={() => setTargetScope('Specific')} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300" /> <span className="ml-2">Specific Classes</span></label>
                            </div>
                        </div>
                        {targetScope === 'Specific' && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border rounded-md max-h-40 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-2">
                                    {availableClasses.map(classKey => (
                                        <label key={classKey} className="flex items-center p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md">
                                            <input type="checkbox" checked={!!selectedClasses[classKey]} onChange={() => handleClassToggle(classKey)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                            <span className="ml-2 text-sm text-gray-800 dark:text-gray-200">Class {classKey.replace('-', ' Sec ')}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={() => setIsPublishing(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 mr-2 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                            <button type="button" onClick={handlePublish} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Publish File</button>
                        </div>
                    </div>
                </Dialog>
            )}
        </div>
    );
};

export default ContentView;