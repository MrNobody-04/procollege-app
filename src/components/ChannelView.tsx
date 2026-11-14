import React, { useState, useRef } from 'react';
import {
  Video,
  FileText,
  MessageSquare,
  GraduationCap,
  Paperclip,
  Send,
  Bold,
  Italic,
  Code,
  List,
  UploadCloud,
  FileCheck,
  Plus,
  Calendar,
  FolderLock,
  ChevronLeft,
  Eye,
  Download,
  ClipboardCheck
} from 'lucide-react';
import { useApp, type ChannelTab } from '../context/AppContext';
import { ThreadPostItem } from './ThreadPostItem';
import { CreateAssignmentModal } from './CreateAssignmentModal';
import { SpeedGraderModal } from './SpeedGraderModal';
import { StudentAssignmentModal } from './StudentAssignmentModal';
import { FilePreviewModal } from './FilePreviewModal';
import { SchoolRollCallModal } from './SchoolRollCallModal';
import { SubjectRollCallModal } from './SubjectRollCallModal';
import { downloadFile, readFileAsDataUrl, getFileType } from '../utils/fileManager';
import type { Assignment, PostCategory, Attachment, CourseFile } from '../types';

export const ChannelView: React.FC = () => {
  const {
    selectedCourse,
    selectedChannel,
    channelTab,
    setChannelTab,
    posts,
    addPost,
    startMeeting,
    courseFiles,
    uploadCourseFile,
    deleteCourseFile,
    assignments,
    currentUser,
    availableUsers,
    updateChannelLecturer,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    showDialog,
    setActiveTab,
    getStudentSubjectAttendance
  } = useApp();

  const [showSchoolRollCallModal, setShowSchoolRollCallModal] = useState(false);
  const [showSubjectRollCallModal, setShowSubjectRollCallModal] = useState(false);

  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<PostCategory>('general');
  const [isExpandedComposer, setIsExpandedComposer] = useState(false);

  // Modals
  const [showCreateAsgnModal, setShowCreateAsgnModal] = useState(false);
  const [activeSpeedGraderAsgn, setActiveSpeedGraderAsgn] = useState<Assignment | null>(null);
  const [speedGraderStudentId, setSpeedGraderStudentId] = useState<string | undefined>(undefined);
  const [activeStudentAsgn, setActiveStudentAsgn] = useState<Assignment | null>(null);
  const [currentTime] = useState(() => Date.now());

  // File Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<'Class Materials' | 'Subject Files'>('Class Materials');
  const [newFileName, setNewFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState<string>('2.1 MB');
  const [selectedUploadedFile, setSelectedUploadedFile] = useState<File | null>(null);
  const [composerAttachments, setComposerAttachments] = useState<Attachment[]>([]);
  const [previewCourseFile, setPreviewCourseFile] = useState<CourseFile | null>(null);

  const composerFilePickerRef = useRef<HTMLInputElement>(null);
  const modalFilePickerRef = useRef<HTMLInputElement>(null);

  const handleModalFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedUploadedFile(file);
      setNewFileName(file.name);
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.max(1, Math.round(file.size / 1024))} KB`;
      setSelectedFileSize(sizeStr);
    }
  };

  const handleComposerFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const sizeStr =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.max(1, Math.round(file.size / 1024))} KB`;
        const type = getFileType(file.name) as Attachment['type'];
        const newAttachment: Attachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: sizeStr,
          type,
          url: dataUrl
        };
        setComposerAttachments(prev => [...prev, newAttachment]);
      } catch (err) {
        showDialog('Failed to process attached file.', { type: 'warning', title: 'File Error' });
      }
      if (composerFilePickerRef.current) composerFilePickerRef.current.value = '';
    }
  };

  if (!selectedCourse || !selectedChannel) {
    const isAdminOrDev = currentUser.role === 'admin' || currentUser.role === 'developer' || currentUser.role === 'platform_admin';
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-50/50 text-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#173bff] mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-1.5">
            Welcome to {currentUser.institutionName || 'Your Campus Workspace'}
          </h2>
          <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
            {isAdminOrDev
              ? 'Your institutional campus environment is active and ready. Start by adding faculties, creating classes, or uploading your student roster.'
              : 'No classes have been provisioned for your account yet. Please contact your campus administration to be enrolled.'}
          </p>
          {isAdminOrDev && (
            <button
              onClick={() => setActiveTab('admin')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#173bff] via-[#244cff] to-[#0d2ee6] text-white text-xs font-bold shadow-[0_4px_18px_rgba(23,59,255,0.3)] hover:shadow-[0_8px_24px_rgba(23,59,255,0.45)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Go to Admin Center & Create Classes</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentChannelPosts = (selectedChannel?.id && posts[selectedChannel.id]) ? posts[selectedChannel.id] : [];
  const activeInstitution = currentUser.institutionName || selectedCourse?.institutionName || 'ProCollege University Network';
  const currentSubjectAssignments = assignments.filter(a => {
    if (currentUser.role !== 'developer') {
      if (a.institutionName && activeInstitution && a.institutionName !== activeInstitution) return false;
    }
    if (!selectedCourse || a.courseId !== selectedCourse.id) return false;
    const asgnChannelId = a.channelId || a.targetChannelId;
    return asgnChannelId === selectedChannel?.id;
  });
  const currentCourseFiles = courseFiles.filter(f => f.courseId === selectedCourse?.id);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!postContent.trim() && composerAttachments.length === 0) || !selectedChannel?.id) return;
    addPost(
      selectedChannel.id,
      postTitle.trim(),
      postContent.trim() || (composerAttachments.length > 0 ? `Shared ${composerAttachments.length} file(s)` : ''),
      isOwner || currentUser.role === 'admin',
      undefined,
      postCategory,
      composerAttachments.length > 0 ? composerAttachments : undefined
    );
    setPostTitle('');
    setPostContent('');
    setComposerAttachments([]);
    setIsExpandedComposer(false);
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    let dataUrl: string | undefined = undefined;
    if (selectedUploadedFile) {
      try {
        dataUrl = await readFileAsDataUrl(selectedUploadedFile);
      } catch (err) {
        console.warn('Could not read uploaded file as data url:', err);
      }
    }

    const isCM = uploadCategory === 'Class Materials';
    const res = uploadCourseFile({
      courseId: selectedCourse?.id || '',
      channelId: selectedChannel?.id || '',
      name: newFileName.trim(),
      category: isCM ? 'Class Materials' : 'Subject Files',
      size: selectedFileSize || '2.4 MB',
      uploadedBy: currentUser.name,
      isClassMaterials: isCM,
      permission: isCM ? 'read-only' : 'can-edit',
      url: dataUrl
    });

    if (res.success) {
      setShowUploadModal(false);
      setNewFileName('');
      setSelectedUploadedFile(null);
    } else {
      showDialog(res.message, { type: 'warning', title: 'File Upload Notice' });
    }
  };

  const tabs: { id: ChannelTab; label: string; icon: React.ReactNode }[] = [
    { id: 'posts', label: 'Posts', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'files', label: 'Files', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'assignments', label: 'Assignments', icon: <FileCheck className="w-3.5 h-3.5" /> },
    { id: 'grades', label: 'Grades', icon: <GraduationCap className="w-3.5 h-3.5" /> }
  ];

  const isOwner =
    currentUser.role === 'professor' ||
    currentUser.role === 'lecturer' ||
    currentUser.role === 'admin' ||
    (currentUser as unknown as { role: string }).role === 'teacher';

  const isGeneralChannel = Boolean(
    selectedChannel.isGeneral ||
    selectedChannel.name.toLowerCase() === 'announcements' ||
    selectedChannel.name.toLowerCase() === 'general'
  );

  const canPublishInSubject = Boolean(
    !isGeneralChannel && (
      currentUser.role === 'developer' ||
      currentUser.role === 'admin' ||
      selectedChannel?.subjectLecturerId === currentUser.id ||
      (selectedChannel?.subjectLecturerName && selectedChannel.subjectLecturerName.toLowerCase().includes(currentUser.name.toLowerCase())) ||
      selectedCourse?.instructor?.id === currentUser.id ||
      selectedCourse?.coOwners?.some(co => co.id === currentUser.id)
    )
  );

  const studentAttendance =
    currentUser.role === 'student' && selectedCourse && selectedChannel
      ? getStudentSubjectAttendance(currentUser.id, selectedChannel.id)
      : null;

  return (
    <div className={`flex-1 flex flex-col h-full bg-[#E8E9E2] min-w-0 overflow-hidden select-none ${mobileSidebarOpen ? 'hidden md:flex' : 'flex'}`}>
      {/* Channel Header Bar - Clean and Natural (No Hashtag, No Pill Box) */}
      <header className="bg-white border-b border-zinc-200 px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-0.5 transition-colors shrink-0"
            title="Back to Teams and Channels"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-[11px]">Classes</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base text-zinc-900 truncate tracking-tight">
                {selectedChannel?.name || 'Channel'}
              </h1>
              {selectedChannel?.isGeneral ? (
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full shrink-0">
                  Noticeboard
                </span>
              ) : (currentUser.role === 'admin' || currentUser.role === 'developer') ? (
                <div className="flex items-center gap-1 shrink-0">
                  <GraduationCap className="w-3.5 h-3.5 text-[#26394D]" />
                  <select
                    value={selectedChannel?.subjectLecturerId || ''}
                    onChange={(e) => {
                      const lectId = e.target.value;
                      const lect = availableUsers.find(u => u.id === lectId);
                      const name = lect ? lect.name : (lectId ? lectId : '');
                      if (selectedCourse && selectedChannel) {
                        updateChannelLecturer(selectedCourse.id, selectedChannel.id, lectId, name);
                        showDialog(`Subject "${selectedChannel.name}" lecturer updated to ${name || 'Lead Instructor'}.`, {
                          type: 'success',
                          title: 'Lecturer Assigned'
                        });
                      }
                    }}
                    className="text-[11px] font-semibold bg-indigo-50/90 hover:bg-indigo-100 text-[#26394D] border border-indigo-200 rounded px-2 py-0.5 cursor-pointer focus:outline-none"
                    title="Click to directly select or change the assigned lecturer for this subject (1-Click Assignment)"
                  >
                    <option value="">{selectedChannel?.subjectLecturerName || selectedCourse?.instructor?.name || 'Class Owner'}</option>
                    {availableUsers
                      .filter(u => u.role === 'lecturer' || u.role === 'admin' || (u.role as any) === 'professor')
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role === 'admin' ? 'Admin' : 'Lecturer'})
                        </option>
                      ))}
                  </select>
                </div>
              ) : selectedChannel?.subjectLecturerName ? (
                <span className="text-[10px] font-medium text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full truncate shrink-0">
                  {selectedChannel.subjectLecturerName}
                </span>
              ) : null}
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-500 truncate">
              {selectedCourse?.code || ''} {selectedCourse?.name ? `• ${selectedCourse.name}` : ''}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Student Subject Attendance Standing Badge */}
          {currentUser.role === 'student' && studentAttendance && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${studentAttendance.threshold.badgeClass} shadow-2xs`}
              title={`${studentAttendance.percentage}% Attendance (${studentAttendance.presentCount}/${studentAttendance.totalSessions} sessions held)`}
            >
              <span>{studentAttendance.threshold.icon}</span>
              <span>{studentAttendance.percentage}%</span>
              <span className="hidden sm:inline font-medium text-[10px]">({studentAttendance.threshold.label})</span>
            </span>
          )}

          {/* Teacher / Admin Roll-Call Action Buttons */}
          {isOwner && selectedCourse && (
            <>
              {isGeneralChannel ? (
                <button
                  type="button"
                  onClick={() => setShowSchoolRollCallModal(true)}
                  className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 sm:px-3 py-1.5 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title="Conduct daily school roll-call for all enrolled students in this class"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Daily Roll-Call</span>
                  <span className="sm:hidden">Roll-Call</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubjectRollCallModal(true)}
                  className="flex items-center gap-1.5 bg-[#26394D] hover:bg-[#141E2B] text-white px-2.5 sm:px-3 py-1.5 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title={`Take session attendance for ${selectedChannel.name}`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Subject Attendance</span>
                  <span className="sm:hidden">Attendance</span>
                </button>
              )}
            </>
          )}

          {canPublishInSubject && channelTab === 'assignments' && (
            <button
              onClick={() => setShowCreateAsgnModal(true)}
              className="flex items-center gap-1.5 bg-[#26394D] hover:bg-[#141E2B] text-white px-2.5 sm:px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
          )}

          <button
            onClick={() =>
              startMeeting(
                `${selectedCourse?.code || 'Class'}: ${selectedChannel?.name || 'Room'}`,
                selectedCourse?.code || ''
              )
            }
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-2.5 sm:px-3 py-1.5 rounded text-xs font-medium border border-zinc-300 transition-colors"
          >
            <Video className="w-3.5 h-3.5 text-zinc-600" />
            <span className="hidden xs:inline">Meet</span>
          </button>
        </div>
      </header>

      {/* Channel Tabs */}
      <div className="bg-white px-3 sm:px-6 border-b border-zinc-200 flex gap-3 sm:gap-6 shrink-0 text-xs font-medium overflow-x-auto no-scrollbar">
        {tabs.map(tab => {
          const isActive = channelTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setChannelTab(tab.id)}
              className={`flex items-center gap-1.5 py-2.5 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                isActive
                  ? 'border-[#26394D] text-[#26394D] font-semibold'
                  : 'border-transparent text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area by Tab */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* POSTS TAB */}
        {channelTab === 'posts' && (
          <div className="max-w-4xl mx-auto space-y-3">
            {/* New Thread Post Composer (Teams Style) */}
            <div className="bg-white rounded-lg border border-zinc-200 p-3.5">
              {!isExpandedComposer ? (
                <div
                  onClick={() => setIsExpandedComposer(true)}
                  className="flex items-center gap-3 cursor-pointer text-zinc-400 hover:text-zinc-600"
                >
                  <img
                    src={currentUser.avatar}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-200"
                  />
                  <div className="flex-1 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded px-3 py-1.5 text-xs text-zinc-500">
                    Start a new conversation in {selectedChannel.name}...
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreatePost} className="space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100">
                    <span className="text-xs font-semibold text-zinc-700">New post</span>
                    <button
                      type="button"
                      onClick={() => setIsExpandedComposer(false)}
                      className="text-xs text-zinc-400 hover:text-zinc-600"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Lecturer Announcement Category Selector */}
                  {(isOwner || currentUser.role === 'admin') && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5 pb-1">
                      <span className="text-[11px] font-semibold text-zinc-500 mr-1">Broadcast Type:</span>
                      {[
                        { id: 'class-details', label: '📘 Class Details', color: 'border-blue-300 text-blue-700 bg-blue-50' },
                        { id: 'alert', label: '🚨 Urgent Alert', color: 'border-rose-300 text-rose-700 bg-rose-50' },
                        { id: 'holiday', label: '🏖️ Holiday Notice', color: 'border-emerald-300 text-emerald-700 bg-emerald-50' },
                        { id: 'event', label: '📅 Academic Event', color: 'border-purple-300 text-purple-700 bg-purple-50' },
                        { id: 'general', label: '📢 Announcement', color: 'border-indigo-300 text-indigo-700 bg-indigo-50' }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setPostCategory(cat.id as PostCategory)}
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                            postCategory === cat.id
                              ? `${cat.color} ring-1 ring-offset-1 ring-zinc-400 font-black shadow-2xs`
                              : 'border-zinc-200 text-zinc-600 bg-white hover:bg-zinc-100'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <input
                    type="text"
                    value={postTitle}
                    onChange={e => setPostTitle(e.target.value)}
                    placeholder="Subject line..."
                    className="w-full text-xs font-semibold text-zinc-900 border-b border-zinc-200 pb-1 focus:outline-none focus:border-[#26394D]"
                  />

                  <textarea
                    rows={3}
                    value={postContent}
                    onChange={e => setPostContent(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full text-xs text-zinc-800 focus:outline-none resize-none"
                    autoFocus
                  />

                  {/* Attached Files Preview Chips */}
                  {composerAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 py-2 border-t border-zinc-100">
                      {composerAttachments.map(att => (
                        <div
                          key={att.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#173bff]" />
                          <span className="font-semibold truncate max-w-48">{att.name}</span>
                          <span className="text-[10px] text-blue-600">({att.size})</span>
                          <button
                            type="button"
                            onClick={() => setComposerAttachments(prev => prev.filter(a => a.id !== att.id))}
                            className="ml-1 text-blue-400 hover:text-rose-600 font-bold p-0.5 cursor-pointer"
                            title="Remove attachment"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formatting & Send Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                    <div className="flex items-center gap-1 text-zinc-400">
                      <button type="button" className="p-1 hover:bg-zinc-100 rounded text-zinc-600" title="Bold">
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" className="p-1 hover:bg-zinc-100 rounded text-zinc-600" title="Italic">
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" className="p-1 hover:bg-zinc-100 rounded text-zinc-600" title="Code">
                        <Code className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" className="p-1 hover:bg-zinc-100 rounded text-zinc-600" title="List">
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="file"
                        ref={composerFilePickerRef}
                        onChange={handleComposerFilePicked}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => composerFilePickerRef.current?.click()}
                        className="p-1 hover:bg-zinc-100 rounded text-zinc-600 flex items-center gap-1 text-[11px] cursor-pointer"
                        title="Attach file from device"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Attach</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={!postContent.trim() && composerAttachments.length === 0}
                      className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                        postContent.trim() || composerAttachments.length > 0
                          ? 'bg-[#26394D] hover:bg-[#141E2B] text-white shadow-xs'
                          : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      Post
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Thread Posts List */}
            {currentChannelPosts.length === 0 ? (
              <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center text-zinc-500">
                <p className="font-semibold text-zinc-800 text-sm">No posts in {selectedChannel.name} yet</p>
                <p className="text-xs text-zinc-500 mt-1">Start a conversation above.</p>
              </div>
            ) : (
              currentChannelPosts.map(post => (
                <ThreadPostItem key={post.id} post={post} />
              ))
            )}
          </div>
        )}

        {/* FILES TAB */}
        {channelTab === 'files' && (
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="bg-white rounded-lg border border-zinc-200 p-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                <div>
                  <h2 className="font-semibold text-sm text-zinc-900">
                    Files • {selectedChannel.name}
                  </h2>
                  <p className="text-xs text-zinc-500">Class materials and shared documents</p>
                </div>

                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-1.5 bg-[#26394D] hover:bg-[#141E2B] text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload
                </button>
              </div>

              {/* Class Materials Info Box */}
              <div className="mt-3 bg-zinc-50 border border-zinc-200 rounded p-3 flex items-start gap-2.5 text-xs text-zinc-700">
                <FolderLock className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-zinc-900">Class Materials:</span> Files in this folder are read-only for students. Only lecturers can add or edit master slides and course packets.
                </div>
              </div>

              {/* Files Table */}
              <div className="divide-y divide-zinc-100 mt-3">
                {currentCourseFiles.map(file => (
                  <div
                    key={file.id}
                    className="py-2.5 flex items-center justify-between hover:bg-zinc-50 px-2 rounded transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                      <div className="min-w-0">
                        <p
                          onClick={() => setPreviewCourseFile(file)}
                          className="text-xs font-semibold text-zinc-900 truncate hover:text-[#173bff] cursor-pointer"
                        >
                          {file.name}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {file.category} • {file.size} • Uploaded {file.uploadedAt} by {file.uploadedBy}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewCourseFile(file)}
                        className="px-2 py-1 text-zinc-600 hover:text-[#173bff] hover:bg-zinc-100 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Preview file"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Preview</span>
                      </button>

                      <button
                        onClick={() =>
                          downloadFile(file.name, file.url, {
                            courseName: selectedCourse?.name,
                            category: file.category,
                            author: file.uploadedBy
                          })
                        }
                        className="px-2 py-1 text-zinc-600 hover:text-emerald-700 hover:bg-zinc-100 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Download file to computer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </button>

                      {isOwner && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${file.name}?`)) {
                              deleteCourseFile(file.id);
                            }
                          }}
                          className="text-xs text-zinc-400 hover:text-rose-600 px-1"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ASSIGNMENTS TAB */}
        {channelTab === 'assignments' && (
          <div className="max-w-4xl mx-auto space-y-3">
            {isGeneralChannel ? (
              <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#26394D] flex items-center justify-center mx-auto">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">General Noticeboard Channel</h3>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                    Assignments and problem sets are strictly organized inside specific subject channels (e.g., Database Systems, Operating Systems). Please select a subject channel from the left sidebar to view or publish coursework.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-zinc-200 p-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                  <div>
                    <h2 className="font-semibold text-sm text-zinc-900">
                      Assignments: {selectedChannel.name}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {selectedCourse?.code || ''} • {selectedCourse?.name || ''} {selectedChannel?.subjectLecturerName ? `• Lecturer: ${selectedChannel.subjectLecturerName}` : ''}
                    </p>
                  </div>

                  {canPublishInSubject && (
                    <button
                      onClick={() => setShowCreateAsgnModal(true)}
                      className="flex items-center gap-1.5 bg-[#26394D] hover:bg-[#141E2B] text-white text-xs font-medium px-3 py-1.5 rounded transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create Assignment
                    </button>
                  )}
                </div>

                {/* Assignment Cards List - Natural Teams Clean Look */}
                {currentSubjectAssignments.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-xs">
                    <FileCheck className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="font-medium text-zinc-700">No assignments in {selectedChannel.name} yet</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Coursework assigned specifically for this subject will appear here.
                    </p>
                    {canPublishInSubject && (
                      <button
                        onClick={() => setShowCreateAsgnModal(true)}
                        className="mt-3 inline-flex items-center gap-1.5 bg-[#26394D] hover:bg-[#141E2B] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Publish First Assignment
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 mt-2">
                    {currentSubjectAssignments.map(asgn => {
                      const studentSub = asgn.submissions.find(s => s.studentId === currentUser.id);
                      const isSubmitted = studentSub?.status === 'turned-in' || studentSub?.status === 'graded';
                      const isPassed = Boolean(asgn.dueTimestamp && currentTime > asgn.dueTimestamp);

                      return (
                        <div
                          key={asgn.id}
                          onClick={() => {
                            if (currentUser.role === 'student') {
                              setActiveStudentAsgn(asgn);
                            } else {
                              setActiveSpeedGraderAsgn(asgn);
                              setSpeedGraderStudentId(asgn.submissions[0]?.studentId);
                            }
                          }}
                          className="py-3.5 px-3 flex items-center justify-between hover:bg-zinc-50 cursor-pointer rounded transition-colors"
                        >
                          <div className="min-w-0 pr-4">
                            <h3 className="font-semibold text-xs text-zinc-900 truncate hover:text-[#26394D]">
                              {asgn.title}
                            </h3>
                            <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-zinc-400" />
                                Due {asgn.dueAt}
                              </span>
                              <span>•</span>
                              <span>{asgn.points} points</span>
                              {asgn.referenceFiles && asgn.referenceFiles.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-zinc-600">
                                    <Paperclip className="w-3 h-3 text-zinc-400" />
                                    {asgn.referenceFiles.length} {asgn.referenceFiles.length === 1 ? 'file' : 'files'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Clean Natural Status Text */}
                          <div className="shrink-0 text-right">
                            {currentUser.role === 'student' ? (
                              isSubmitted ? (
                                <span className="text-xs font-medium text-emerald-700">
                                  Turned in
                                </span>
                              ) : isPassed ? (
                                <span className="text-xs font-medium text-rose-600">
                                  Due date passed
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-zinc-600">
                                  Assigned
                                </span>
                              )
                            ) : (
                              <span className="text-xs font-medium text-zinc-600">
                                {asgn.submissions.length} submitted
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* GRADES TAB */}
        {channelTab === 'grades' && (
          <div className="max-w-4xl mx-auto bg-white rounded-lg border border-zinc-200 p-5 space-y-3">
            <h2 className="font-semibold text-sm text-zinc-900">Grades</h2>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 font-medium">
                  <th className="py-2 px-3">Student</th>
                  <th className="py-2 px-3">Problem Set 4</th>
                  <th className="py-2 px-3">Problem Set 5</th>
                  <th className="py-2 px-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr className="hover:bg-zinc-50">
                  <td className="py-2.5 px-3 font-medium text-zinc-900">Alex Johnson</td>
                  <td className="py-2.5 px-3 text-zinc-800">96 / 100</td>
                  <td className="py-2.5 px-3 text-zinc-500">Not turned in</td>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900">96.0%</td>
                </tr>
                <tr className="hover:bg-zinc-50">
                  <td className="py-2.5 px-3 font-medium text-zinc-900">Sophia Chen</td>
                  <td className="py-2.5 px-3 text-zinc-500">Pending</td>
                  <td className="py-2.5 px-3 text-zinc-500">Not turned in</td>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900">--</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE ASSIGNMENT MODAL (Lecturer) */}
      <CreateAssignmentModal
        isOpen={showCreateAsgnModal}
        onClose={() => setShowCreateAsgnModal(false)}
        defaultCourseId={selectedCourse?.id}
        defaultChannelId={selectedChannel?.id}
      />

      {/* SPEEDGRADER REVIEW MODAL (Lecturer) */}
      {activeSpeedGraderAsgn && (
        <SpeedGraderModal
          assignment={activeSpeedGraderAsgn}
          initialStudentId={speedGraderStudentId}
          isOpen={true}
          onClose={() => setActiveSpeedGraderAsgn(null)}
        />
      )}

      {/* STUDENT ASSIGNMENT WORKSPACE MODAL (Student) */}
      {activeStudentAsgn && (
        <StudentAssignmentModal
          assignment={activeStudentAsgn}
          isOpen={true}
          onClose={() => setActiveStudentAsgn(null)}
        />
      )}

      {/* UPLOAD FILE MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 shadow-lg border border-zinc-200">
            <h3 className="font-semibold text-sm text-zinc-900 mb-2">Upload file</h3>

            <form onSubmit={handleUploadFile} className="space-y-3 text-xs">
              <input
                type="file"
                ref={modalFilePickerRef}
                onChange={handleModalFilePicked}
                className="hidden"
              />

              <div
                onClick={() => modalFilePickerRef.current?.click()}
                className="p-3 border-2 border-dashed border-zinc-300 hover:border-[#26394D] rounded-lg text-center cursor-pointer transition-colors bg-zinc-50 hover:bg-zinc-100/60"
              >
                <UploadCloud className="w-6 h-6 text-[#26394D] mx-auto mb-1" />
                <p className="font-semibold text-zinc-800 text-xs">Choose file from device</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">PDF, Word, Code, Slide deck, or ZIP</p>
              </div>

              <div>
                <label className="block text-zinc-600 mb-1">Destination</label>
                <select
                  value={uploadCategory}
                  onChange={e => setUploadCategory(e.target.value as any)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded p-1.5 text-xs text-zinc-800"
                >
                  <option value="Class Materials">Class Materials (Read-only for students)</option>
                  <option value="Subject Files">Channel Files (Collaboration)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-600 mb-1">File Name</label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                  placeholder="Lecture_Notes_Week_4.pdf"
                  className="w-full bg-zinc-50 border border-zinc-300 rounded p-1.5 text-xs focus:outline-none focus:border-[#26394D]"
                  required
                />
                {newFileName && (
                  <p className="text-[10px] text-zinc-400 mt-0.5">Size: {selectedFileSize}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#26394D] hover:bg-[#141E2B] text-white px-3.5 py-1.5 rounded font-medium text-xs shadow-xs"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewCourseFile && (
        <FilePreviewModal
          file={{
            name: previewCourseFile.name,
            size: previewCourseFile.size,
            url: previewCourseFile.url,
            uploadedBy: previewCourseFile.uploadedBy,
            uploadedAt: previewCourseFile.uploadedAt,
            category: previewCourseFile.category,
            courseName: selectedCourse?.name
          }}
          isOpen={Boolean(previewCourseFile)}
          onClose={() => setPreviewCourseFile(null)}
          onDownload={() =>
            downloadFile(previewCourseFile.name, previewCourseFile.url, {
              courseName: selectedCourse?.name,
              category: previewCourseFile.category,
              author: previewCourseFile.uploadedBy
            })
          }
        />
      )}

      {/* School Roll-Call Modal */}
      {selectedCourse && (
        <SchoolRollCallModal
          course={selectedCourse}
          isOpen={showSchoolRollCallModal}
          onClose={() => setShowSchoolRollCallModal(false)}
        />
      )}

      {/* University Subject Roll-Call Modal */}
      {selectedCourse && selectedChannel && (
        <SubjectRollCallModal
          course={selectedCourse}
          subject={selectedChannel}
          isOpen={showSubjectRollCallModal}
          onClose={() => setShowSubjectRollCallModal(false)}
        />
      )}
    </div>
  );
};
