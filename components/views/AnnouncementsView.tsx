import React, { useState } from 'react';
import { User, Announcement, UserRole } from '../../types';
import Dialog from '../Dialog';
import { DocumentTextIcon, ArrowDownTrayIcon } from '../icons';

interface AnnouncementsViewProps {
    user: User;
    announcements: Announcement[];
    onAddAnnouncement: (announcement: Announcement) => void;
    onDeleteAnnouncement: (announcementId: number) => void;
}

const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ user, announcements, onAddAnnouncement, onDeleteAnnouncement }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [content, setContent] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);

    const canPost = user.role === UserRole.Administrator || user.role === UserRole.Teacher;
    
    const handleResetForm = () => {
        setContent('');
        setAttachment(null);
        setIsDialogOpen(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            // 5MB limit
            if (e.target.files[0].size > 5 * 1024 * 1024) {
                alert("File is too large. Maximum size is 5MB.");
                e.target.value = ''; // Reset the input
                return;
            }
            setAttachment(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            alert("Announcement content cannot be empty.");
            return;
        }

        const createAnnouncement = (attachmentData?: Announcement['attachment']) => {
            const newAnnouncement: Announcement = {
                id: Date.now(),
                author: user.name,
                authorId: user.id,
                avatar: user.avatar,
                content: content.trim(),
                timestamp: new Date(),
                attachment: attachmentData,
            };
            onAddAnnouncement(newAnnouncement);
            handleResetForm();
        };

        if (attachment) {
            const reader = new FileReader();
            reader.onload = (event) => {
                createAnnouncement({
                    name: attachment.name,
                    url: event.target?.result as string,
                    type: attachment.type,
                });
            };
            reader.onerror = () => {
                alert("Failed to read the file.");
            };
            reader.readAsDataURL(attachment);
        } else {
            createAnnouncement();
        }
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
            onDeleteAnnouncement(id);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Announcements</h1>
                {canPost && (
                    <button 
                        onClick={() => setIsDialogOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105 active:scale-95"
                    >
                        + New Announcement
                    </button>
                )}
            </div>

            <div className="space-y-6">
                {announcements.length > 0 ? [...announcements].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((announcement, index) => {
                    const canDelete = user.role === UserRole.Administrator || user.id === announcement.authorId;
                    return (
                        <div 
                            key={announcement.id} 
                            className="bg-white/50 dark:bg-black/20 p-5 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10 animate-list-item-enter card-hover-effect"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start gap-4">
                                <img src={announcement.avatar} alt={announcement.author} className="w-12 h-12 rounded-full" />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{announcement.author}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(announcement.timestamp).toLocaleString()}</p>
                                        </div>
                                        {canDelete && (
                                            <button 
                                                onClick={() => handleDelete(announcement.id)} 
                                                className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-100 rounded-full hover:bg-red-200 hover:text-red-800 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/70 transition-colors"
                                                aria-label="Delete announcement"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-200 mt-2 whitespace-pre-wrap">{announcement.content}</p>
                                    {announcement.attachment && (
                                        <div className="mt-4">
                                            {announcement.attachment.type.startsWith('image/') ? (
                                                <a href={announcement.attachment.url} target="_blank" rel="noopener noreferrer">
                                                    <img src={announcement.attachment.url} alt="attachment" className="rounded-lg max-h-64 border dark:border-gray-600" />
                                                </a>
                                            ) : (
                                                <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <DocumentTextIcon className="w-6 h-6 text-gray-500 dark:text-gray-300 flex-shrink-0" />
                                                        <span className="font-medium text-gray-700 dark:text-gray-200">{announcement.attachment.name}</span>
                                                    </div>
                                                    <a href={announcement.attachment.url} download={announcement.attachment.name} className="flex items-center gap-1 px-3 py-1 text-xs bg-teal-600 text-white font-semibold rounded-full hover:bg-teal-700">
                                                        <ArrowDownTrayIcon className="w-4 h-4"/> Download
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-16 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-xl shadow-lg border border-white/20 dark:border-white/10">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">No Announcements Yet</h2>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">Check back later for updates.</p>
                    </div>
                )}
            </div>

            <Dialog isOpen={isDialogOpen} onClose={handleResetForm} title="Create New Announcement">
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                    <div>
                        <label htmlFor="announcementContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Announcement Content*</label>
                        <textarea
                            id="announcementContent"
                            rows={6}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Write your announcement here..."
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attachment (Optional)</label>
                        <input
                            type="file"
                            id="attachment"
                            onChange={handleFileChange}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/50 dark:file:text-indigo-300 dark:hover:file:bg-indigo-900"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max file size: 5MB.</p>
                    </div>
                    {attachment && (
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                            Selected file: <span className="font-medium">{attachment.name}</span>
                        </div>
                    )}
                    <div className="flex justify-end pt-2">
                        <button type="button" onClick={handleResetForm} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 mr-2 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Post Announcement</button>
                    </div>
                </form>
            </Dialog>
        </div>
    );
};

export default AnnouncementsView;