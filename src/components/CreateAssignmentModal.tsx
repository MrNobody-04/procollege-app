import React, { useState, useRef, useEffect } from 'react';
import {
  FileCheck,
  Clock,
  Plus,
  Trash2,
  FileText,
  File,
  Presentation,
  FileArchive,
  Upload,
  Calendar,
  Paperclip,
  Lock,
  Layers,
  BookOpen,
  Eye,
  Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FilePreviewModal } from './FilePreviewModal';
import { downloadFile, readFileAsDataUrl } from '../utils/fileManager';
import type { RubricCriterion } from '../types';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCourseId?: string;
  defaultChannelId?: string;
}

interface AttachedReferenceFile {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'doc' | 'ppt' | 'archive' | 'code' | 'image';
  url?: string;
}

const toDateTimeLocalString = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  defaultCourseId,
  defaultChannelId
}) => {
  const { courses, selectedCourse, createAssignment, showDialog, currentUser } = useApp();

  const isContextLocked = Boolean(defaultCourseId && defaultChannelId);

  // Eligible courses for current user based on institution and role
  const userInstitution = currentUser.institutionName || 'ProCollege University Network';
  const eligibleCourses = courses.filter(c => {
    if (currentUser.role !== 'developer') {
      if (c.institutionName && userInstitution && c.institutionName !== userInstitution) return false;
    }
    if (currentUser.role === 'admin' || currentUser.role === 'developer') return true;
    return (
      c.instructor.id === currentUser.id ||
      c.coOwners?.some(co => co.id === currentUser.id) ||
      c.channels.some(
        ch =>
          !ch.isGeneral &&
          (ch.subjectLecturerId === currentUser.id ||
            (ch.subjectLecturerName && ch.subjectLecturerName.toLowerCase().includes(currentUser.name.toLowerCase())))
      )
    );
  });

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    defaultCourseId || eligibleCourses[0]?.id || selectedCourse?.id || ''
  );
  const [selectedChannelId, setSelectedChannelId] = useState<string>(defaultChannelId || '');

  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [points, setPoints] = useState(100);

  // Reference Files State
  const [referenceFiles, setReferenceFiles] = useState<AttachedReferenceFile[]>([
    {
      id: 'ref-default-1',
      name: 'Assignment_Specification_Sheet.pdf',
      size: '1.4 MB',
      type: 'pdf'
    }
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    name: string;
    size?: string;
    url?: string;
    category?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-calculated Dates & Scheduling Logic
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return toDateTimeLocalString(tomorrow);
  });

  const [dueDate, setDueDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 0, 0);
    return toDateTimeLocalString(nextWeek);
  });

  const [hasCloseDate, setHasCloseDate] = useState(true);
  const [closeDate, setCloseDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 0, 0);
    return toDateTimeLocalString(nextWeek);
  });
  const [isStrictNoLate, setIsStrictNoLate] = useState(true);

  // Rubric weighted evaluation criteria
  const [rubric, setRubric] = useState<RubricCriterion[]>([
    { id: 'crit_1', criterion: 'Technical Correctness & Problem Formulation', maxPoints: 50 },
    { id: 'crit_2', criterion: 'Empirical Verification & Test Cases', maxPoints: 30 },
    { id: 'crit_3', criterion: 'Documentation & Code Quality', maxPoints: 20 }
  ]);

  // Synchronize on modal open or when defaultCourseId/defaultChannelId change
  useEffect(() => {
    if (isOpen) {
      if (defaultCourseId) {
        setSelectedCourseId(defaultCourseId);
        if (defaultChannelId) {
          setSelectedChannelId(defaultChannelId);
        } else {
          const c = courses.find(item => item.id === defaultCourseId);
          const firstSub = c?.channels.find(ch => !ch.isGeneral);
          setSelectedChannelId(firstSub?.id || c?.channels[0]?.id || '');
        }
      } else {
        const first = eligibleCourses[0] || selectedCourse;
        setSelectedCourseId(first.id);
        const firstSub = (first.channels || []).find(ch => {
          if (ch.isGeneral || ch.name.toLowerCase() === 'announcements' || ch.name.toLowerCase() === 'general') return false;
          if (currentUser.role === 'admin' || currentUser.role === 'developer') return true;
          if (first.instructor.id === currentUser.id || first.coOwners?.some(co => co.id === currentUser.id)) return true;
          return (
            ch.subjectLecturerId === currentUser.id ||
            (ch.subjectLecturerName && ch.subjectLecturerName.toLowerCase().includes(currentUser.name.toLowerCase()))
          );
        });
        setSelectedChannelId(firstSub?.id || '');
      }
    }
  }, [isOpen, defaultCourseId, defaultChannelId]);

  // When active class changes in global picker mode, update eligible subject channels
  const activeCourse = courses.find(c => c.id === selectedCourseId) || eligibleCourses[0] || selectedCourse;

  const eligibleChannels = (activeCourse?.channels || []).filter(ch => {
    if (ch.isGeneral || ch.name.toLowerCase() === 'announcements' || ch.name.toLowerCase() === 'general') {
      return false;
    }
    if (currentUser.role === 'admin' || currentUser.role === 'developer') return true;
    if (activeCourse.instructor.id === currentUser.id || activeCourse.coOwners?.some(co => co.id === currentUser.id)) {
      return true;
    }
    return (
      ch.subjectLecturerId === currentUser.id ||
      (ch.subjectLecturerName && ch.subjectLecturerName.toLowerCase().includes(currentUser.name.toLowerCase()))
    );
  });

  useEffect(() => {
    if (!defaultCourseId && selectedCourseId) {
      if (!eligibleChannels.some(ch => ch.id === selectedChannelId)) {
        setSelectedChannelId(eligibleChannels[0]?.id || '');
      }
    }
  }, [selectedCourseId, eligibleChannels.length]);

  if (!isOpen) return null;

  // File Upload Handlers
  const handleFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addFilesToList(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addFilesToList = async (files: File[]) => {
    const newFiles: AttachedReferenceFile[] = await Promise.all(
      files.map(async file => {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        let type: AttachedReferenceFile['type'] = 'doc';
        if (ext === 'pdf') type = 'pdf';
        else if (ext === 'ppt' || ext === 'pptx') type = 'ppt';
        else if (['zip', 'rar', 'tar', '7z', 'gz'].includes(ext)) type = 'archive';
        else if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) type = 'image';
        else if (['js', 'ts', 'py', 'java', 'cpp', 'c', 'html', 'css'].includes(ext)) type = 'code';

        const sizeFormatted =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.max(1, Math.round(file.size / 1024))} KB`;

        let url: string | undefined = undefined;
        try {
          url = await readFileAsDataUrl(file);
        } catch (err) {
          console.warn('Could not read reference file as data url:', err);
        }

        return {
          id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: sizeFormatted,
          type,
          url
        };
      })
    );

    setReferenceFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setReferenceFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToList(Array.from(e.dataTransfer.files));
    }
  };

  const getFileIcon = (type: AttachedReferenceFile['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-600" />;
      case 'ppt':
        return <Presentation className="w-4 h-4 text-amber-600" />;
      case 'archive':
        return <FileArchive className="w-4 h-4 text-purple-600" />;
      case 'doc':
      default:
        return <File className="w-4 h-4 text-blue-600" />;
    }
  };

  const getFileBadgeBg = (type: AttachedReferenceFile['type']) => {
    switch (type) {
      case 'pdf':
        return 'bg-rose-50 border-rose-200';
      case 'ppt':
        return 'bg-amber-50 border-amber-200';
      case 'archive':
        return 'bg-purple-50 border-purple-200';
      case 'doc':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const handleAddCriterion = () => {
    setRubric(prev => [
      ...prev,
      { id: `crit_${Date.now()}`, criterion: 'Additional Evaluation Criterion', maxPoints: 10 }
    ]);
  };

  const handleRemoveCriterion = (id: string) => {
    setRubric(prev => prev.filter(r => r.id !== id));
  };

  const activeChannel = activeCourse?.channels.find(ch => ch.id === selectedChannelId) || eligibleChannels[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (!selectedChannelId || !activeChannel) {
      showDialog('Please select an authorized subject channel to publish this assignment.', {
        type: 'warning',
        title: 'Subject Required'
      });
      return;
    }

    if (activeChannel.isGeneral) {
      showDialog('Assignments cannot be published to the Announcements channel. Please select a specific Subject channel.', {
        type: 'warning',
        title: 'Invalid Channel'
      });
      return;
    }

    const now = new Date();
    const publishedAtFormatted = now.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    const dueAtFormatted = new Date(dueDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    const closeAtFormatted = hasCloseDate
      ? new Date(closeDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
      : undefined;

    createAssignment({
      institutionName: activeCourse.institutionName || userInstitution,
      facultyId: activeCourse.facultyId || 'fac_cs',
      courseId: activeCourse.id,
      courseCode: activeCourse.code,
      channelId: activeChannel.id,
      targetChannelId: activeChannel.id,
      subjectName: activeChannel.name,
      createdByEmail: currentUser.email,
      title: title.trim(),
      instructions:
        instructions.trim() ||
        'Please follow all specifications in the attached problem sheet and turn in your solution before the close cutoff.',
      points: Number(points),
      referenceMaterialMode: 'students-cant-edit',
      referenceFiles: referenceFiles.map(rf => ({
        id: rf.id,
        name: rf.name,
        size: rf.size,
        type: rf.type,
        url: rf.url
      })),
      publishedAt: publishedAtFormatted,
      scheduleDate: isScheduled ? scheduleDate : undefined,
      isScheduled,
      dueAt: dueAtFormatted,
      closeAt: closeAtFormatted,
      isStrictNoLateSubmission: isStrictNoLate,
      rubric
    });

    onClose();
    showDialog(
      isScheduled
        ? `Assignment "${title}" scheduled for release in ${activeCourse.name} • ${activeChannel.name} on ${new Date(
            scheduleDate
          ).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.`
        : `Assignment "${title}" published and locked to ${activeCourse.code} • ${activeChannel.name}!`,
      { type: 'success', title: isScheduled ? 'Assignment Scheduled' : 'Assignment Published' }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#26394D]/10 text-[#26394D] flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-zinc-900">Create & Publish Assignment</h2>
              <p className="text-[11px] text-zinc-500">
                Strict 4-Level Scoping: Bound strictly to Organization, Faculty, Class, and Subject.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer text-base"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="create-assignment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs">
          {/* Class & Subject Scoping Header / Selectors */}
          {isContextLocked ? (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                  <BookOpen className="w-4 h-4 text-[#26394D]" />
                  <span>{activeCourse.name} ({activeCourse.code})</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-indigo-700">
                  <Layers className="w-3.5 h-3.5 text-[#26394D]" />
                  <span>Subject: <strong className="font-semibold text-zinc-900">{activeChannel?.name || 'Subject Channel'}</strong></span>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-indigo-200 text-indigo-700 text-[10px] font-bold self-start sm:self-center shadow-2xs">
                <Lock className="w-3 h-3 text-[#26394D]" />
                <span>Context Locked</span>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-800 text-xs flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#26394D]" />
                  Target Class & Subject Channel *
                </span>
                <span className="text-[10px] text-zinc-400">Never leaks to other subjects</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Select Class */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    Select Class / Section:
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={e => setSelectedCourseId(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-800 focus:ring-1 focus:ring-[#26394D]"
                  >
                    {eligibleCourses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Subject Channel */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    Select Subject Channel:
                  </label>
                  {eligibleChannels.length === 0 ? (
                    <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                      No taught subjects found for your account in this class.
                    </div>
                  ) : (
                    <select
                      value={selectedChannelId}
                      onChange={e => setSelectedChannelId(e.target.value)}
                      className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-800 focus:ring-1 focus:ring-[#26394D]"
                    >
                      {eligibleChannels.map(ch => (
                        <option key={ch.id} value={ch.id}>
                          {ch.name} {ch.subjectLecturerName ? `(Lecturer: ${ch.subjectLecturerName})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Assignment Title */}
          <div>
            <label className="block font-semibold text-zinc-700 mb-1">Assignment Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Lab 4: B-Tree Indexing Engine Implementation"
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 font-medium focus:ring-1 focus:ring-[#26394D] focus:outline-none"
              required
            />
          </div>

          {/* Formatted Instructions */}
          <div>
            <label className="block font-semibold text-zinc-700 mb-1">Detailed Instructions & Problem Outline</label>
            <textarea
              rows={3}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="State problem statements, expected deliverables, submission guidelines, and constraints..."
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-800 focus:ring-1 focus:ring-[#26394D] focus:outline-none resize-none"
            />
          </div>

          {/* Multiple Reference Material Uploads */}
          <div className="bg-zinc-50/80 rounded-xl p-3.5 border border-zinc-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 flex items-center gap-1.5 text-xs">
                <Paperclip className="w-4 h-4 text-[#26394D]" />
                Assignment Files & Reference Materials
              </span>
              <span className="text-[10px] text-zinc-400">PDF, DOC, PPT, ZIP</span>
            </div>

            {/* Hidden Multi-file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFilesPicked}
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.xls,.xlsx"
              className="hidden"
            />

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-[#26394D] bg-indigo-50/50'
                  : 'border-zinc-300 hover:border-[#26394D]/60 bg-white hover:bg-zinc-50'
              }`}
            >
              <Upload className="w-5 h-5 text-zinc-400 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-zinc-700">
                Click to browse or drag and drop assignment files
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Attach multiple PDF briefs, lecture slides, question sheets, or datasets
              </p>
            </div>

            {/* Attached Files List */}
            {referenceFiles.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-semibold text-zinc-600">
                  Attached Files ({referenceFiles.length})
                </p>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {referenceFiles.map(file => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2.5 bg-white border border-zinc-200 rounded-lg shadow-2xs hover:border-zinc-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${getFileBadgeBg(file.type)}`}
                        >
                          {getFileIcon(file.type)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-zinc-900 truncate">{file.name}</p>
                          <p className="text-[10px] text-zinc-400">{file.size} • Student Reference Material</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => setPreviewFile({ name: file.name, size: file.size, url: file.url, category: 'Assignment Reference Material' })}
                          className="p-1 text-zinc-400 hover:text-[#173bff] hover:bg-zinc-100 rounded transition-colors cursor-pointer"
                          title="Preview file"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadFile(file.name, file.url, { courseName: activeCourse?.name, category: 'Assignment Reference Material' })}
                          className="p-1 text-zinc-400 hover:text-emerald-600 hover:bg-zinc-100 rounded transition-colors cursor-pointer"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Assignment Dates & Deadlines */}
          <div className="bg-zinc-50/80 border border-zinc-200 rounded-xl p-3.5 sm:p-4 space-y-3.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#26394D]" />
              <span className="font-bold text-xs text-zinc-900">Assignment Dates & Deadlines</span>
            </div>

            {/* Release Timing Selector */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-700 text-xs">
                Assignment Release Timing
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  onClick={() => setIsScheduled(false)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    !isScheduled
                      ? 'bg-white border-[#26394D] shadow-xs'
                      : 'bg-white/60 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="release-option"
                      checked={!isScheduled}
                      onChange={() => setIsScheduled(false)}
                      className="text-[#26394D]"
                    />
                    <span className="font-semibold text-zinc-900 text-xs">Publish Immediately</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5 pl-5">
                    Assignment is active and visible to students right now.
                  </p>
                </label>

                <label
                  onClick={() => setIsScheduled(true)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    isScheduled
                      ? 'bg-white border-[#26394D] shadow-xs'
                      : 'bg-white/60 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="release-option"
                      checked={isScheduled}
                      onChange={() => setIsScheduled(true)}
                      className="text-[#26394D]"
                    />
                    <span className="font-semibold text-zinc-900 text-xs">Schedule for Future</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5 pl-5">
                    Keeps assignment hidden from students until scheduled time.
                  </p>
                </label>
              </div>

              {/* Scheduled Date/Time Input */}
              {isScheduled && (
                <div className="mt-2 p-3 bg-white rounded-lg border border-indigo-200 space-y-1">
                  <label className="block font-medium text-zinc-700 text-[11px]">
                    Release Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-medium focus:ring-1 focus:ring-[#26394D]"
                    required={isScheduled}
                  />
                  <p className="text-[10px] text-zinc-400">
                    Students will receive notification and access to materials at this date and time.
                  </p>
                </div>
              )}
            </div>

            {/* Official Submission Deadline (Due Date) */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-200">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-zinc-800 text-xs">
                  Submission Deadline (Official Due Date) *
                </label>
                <span className="text-[10px] text-zinc-400">Auto-calculated: 7 days from publish</span>
              </div>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={e => {
                  setDueDate(e.target.value);
                  if (isStrictNoLate) {
                    setCloseDate(e.target.value);
                  }
                }}
                className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-900 focus:ring-1 focus:ring-[#26394D]"
                required
              />
            </div>

            {/* Late Submissions & Strict Deadline Policy */}
            <div className="space-y-2 pt-2 border-t border-zinc-200">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isStrictNoLate}
                  onChange={e => {
                    const checked = e.target.checked;
                    setIsStrictNoLate(checked);
                    setHasCloseDate(checked);
                    if (checked) {
                      setCloseDate(dueDate);
                    }
                  }}
                  className="mt-0.5 rounded text-[#26394D]"
                />
                <div>
                  <span className="font-semibold text-zinc-800 text-xs">
                    Apply strict deadline (No late submissions permitted)
                  </span>
                  <p className="text-[10px] text-zinc-500">
                    The Turn In and Attach buttons will permanently lock at the deadline timestamp.
                  </p>
                </div>
              </label>

              {!isStrictNoLate && (
                <div className="mt-2 pl-6 space-y-1.5">
                  <label className="block font-medium text-zinc-700 text-[11px]">
                    Hard Cutoff Date & Time (Close Date)
                  </label>
                  <input
                    type="datetime-local"
                    value={closeDate}
                    onChange={e => setCloseDate(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:ring-1 focus:ring-[#26394D]"
                  />
                  <p className="text-[10px] text-zinc-400">
                    Submissions between Due Date and Close Date are recorded as late. Submissions lock at Close Date.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Points & Evaluation Rubric */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-zinc-800">Total Points & Evaluation Rubric</span>
              <div className="flex items-center gap-1">
                <span className="text-zinc-500">Max Points:</span>
                <input
                  type="number"
                  value={points}
                  onChange={e => setPoints(Number(e.target.value))}
                  className="w-16 bg-zinc-50 border border-zinc-300 rounded px-2 py-1 font-bold text-right"
                />
              </div>
            </div>

            <div className="space-y-2 border border-zinc-200 rounded-xl p-3 bg-zinc-50/50">
              {rubric.map(r => (
                <div key={r.id} className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-zinc-200">
                  <input
                    type="text"
                    value={r.criterion}
                    onChange={e =>
                      setRubric(prev =>
                        prev.map(item => (item.id === r.id ? { ...item, criterion: e.target.value } : item))
                      )
                    }
                    className="flex-1 bg-transparent border-0 text-xs font-medium focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      +{r.maxPoints} pts
                    </span>
                    {rubric.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(r.id)}
                        className="text-zinc-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddCriterion}
                className="text-[11px] font-semibold text-[#26394D] hover:underline flex items-center gap-1 mt-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add Rubric Criterion
              </button>
            </div>
          </div>
        </form>

        {/* Fixed Footer */}
        <div className="px-5 py-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              {isScheduled ? 'Scheduled to release in future' : 'Publishes immediately upon saving'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-200/60 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-assignment-form"
              disabled={!selectedChannelId || eligibleChannels.length === 0}
              className="bg-[#26394D] hover:bg-[#141E2B] disabled:bg-zinc-300 disabled:cursor-not-allowed text-white px-5 py-2 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>{isScheduled ? 'Schedule Assignment' : 'Publish Assignment'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={{
            name: previewFile.name,
            size: previewFile.size,
            url: previewFile.url,
            category: previewFile.category,
            courseName: activeCourse?.name
          }}
          isOpen={Boolean(previewFile)}
          onClose={() => setPreviewFile(null)}
          onDownload={() =>
            downloadFile(previewFile.name, previewFile.url, {
              courseName: activeCourse?.name,
              category: previewFile.category
            })
          }
        />
      )}
    </div>
  );
};
