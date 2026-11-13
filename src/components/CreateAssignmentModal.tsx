import React, { useState, useRef } from 'react';
import {
  FileCheck,
  Clock,
  Plus,
  Trash2,
  FileText,
  File,
  Presentation,
  FileArchive,
  Share2,
  Upload,
  Calendar,
  Paperclip
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { RubricCriterion } from '../types';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultChannelId?: string;
}

interface AttachedReferenceFile {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'doc' | 'ppt' | 'archive' | 'code' | 'image';
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
  defaultChannelId
}) => {
  const { selectedCourse, createAssignment, showDialog } = useApp();

  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [points, setPoints] = useState(100);
  const [targetChannelId, setTargetChannelId] = useState(defaultChannelId || selectedCourse.channels[0].id);

  // Multiple Reference Files State (PDF, PPT, DOC, ZIP)
  const [referenceFiles, setReferenceFiles] = useState<AttachedReferenceFile[]>([
    {
      id: 'ref-default-1',
      name: 'Assignment_Specification_Sheet.pdf',
      size: '1.4 MB',
      type: 'pdf'
    }
  ]);
  const [isDragging, setIsDragging] = useState(false);
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

  if (!isOpen) return null;

  // File Upload Handlers
  const handleFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addFilesToList(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addFilesToList = (files: File[]) => {
    const newFiles: AttachedReferenceFile[] = files.map(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let type: AttachedReferenceFile['type'] = 'doc';
      if (ext === 'pdf') type = 'pdf';
      else if (ext === 'ppt' || ext === 'pptx') type = 'ppt';
      else if (['zip', 'rar', 'tar', '7z', 'gz'].includes(ext)) type = 'archive';
      else if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) type = 'image';
      else if (['js', 'ts', 'py', 'java', 'cpp', 'c', 'html', 'css'].includes(ext)) type = 'code';

      const sizeFormatted = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

      return {
        id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: sizeFormatted,
        type
      };
    });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const now = new Date();
    const publishedAtFormatted = now.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    const dueAtFormatted = new Date(dueDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    const closeAtFormatted = hasCloseDate
      ? new Date(closeDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
      : undefined;

    createAssignment({
      courseId: selectedCourse.id,
      courseCode: selectedCourse.code,
      title: title.trim(),
      instructions: instructions.trim() || 'Please follow all specifications in the attached problem sheet and turn in your solution before the close cutoff.',
      points: Number(points),
      targetChannelId,
      referenceMaterialMode: 'students-cant-edit',
      referenceFiles: referenceFiles.map(rf => ({
        id: rf.id,
        name: rf.name,
        size: rf.size,
        type: rf.type
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
        ? `Assignment "${title}" scheduled for release on ${new Date(scheduleDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.`
        : `Assignment "${title}" published and routed to ${selectedCourse.channels.find(c => c.id === targetChannelId)?.name || 'General'}!`,
      { type: 'success', title: isScheduled ? 'Assignment Scheduled' : 'Assignment Published' }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5b5fc7]/10 text-[#5b5fc7] flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-zinc-900">Create & Publish Assignment</h2>
              <p className="text-[11px] text-zinc-500">
                Course: <span className="font-semibold text-zinc-700">{selectedCourse.code}</span> — {selectedCourse.name}
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
          {/* Assignment Title */}
          <div>
            <label className="block font-semibold text-zinc-700 mb-1">Assignment Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Lab 4: B-Tree Indexing Engine Implementation"
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 font-medium focus:ring-1 focus:ring-[#5b5fc7] focus:outline-none"
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
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-800 focus:ring-1 focus:ring-[#5b5fc7] focus:outline-none resize-none"
            />
          </div>

          {/* Multiple Reference Material Uploads */}
          <div className="bg-zinc-50/80 rounded-xl p-3.5 border border-zinc-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 flex items-center gap-1.5 text-xs">
                <Paperclip className="w-4 h-4 text-[#5b5fc7]" />
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
                  ? 'border-[#5b5fc7] bg-indigo-50/50'
                  : 'border-zinc-300 hover:border-[#5b5fc7]/60 bg-white hover:bg-zinc-50'
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
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer shrink-0 ml-2"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Channel Notification Routing */}
          <div className="flex items-center justify-between bg-zinc-50 p-3 rounded-xl border border-zinc-200">
            <div>
              <span className="font-semibold text-zinc-800 flex items-center gap-1.5 text-xs">
                <Share2 className="w-4 h-4 text-[#5b5fc7]" />
                Channel Notification Routing
              </span>
              <p className="text-[10px] text-zinc-500">
                Post automated assignment announcement to this subject channel.
              </p>
            </div>
            <select
              value={targetChannelId}
              onChange={e => setTargetChannelId(e.target.value)}
              className="bg-white border border-zinc-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-800 focus:ring-1 focus:ring-[#5b5fc7]"
            >
              {selectedCourse.channels.map(ch => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assignment Dates & Deadlines */}
          <div className="bg-zinc-50/80 border border-zinc-200 rounded-xl p-3.5 sm:p-4 space-y-3.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#5b5fc7]" />
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
                      ? 'bg-white border-[#5b5fc7] shadow-xs'
                      : 'bg-white/60 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="release-option"
                      checked={!isScheduled}
                      onChange={() => setIsScheduled(false)}
                      className="text-[#5b5fc7]"
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
                      ? 'bg-white border-[#5b5fc7] shadow-xs'
                      : 'bg-white/60 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="release-option"
                      checked={isScheduled}
                      onChange={() => setIsScheduled(true)}
                      className="text-[#5b5fc7]"
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
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-medium focus:ring-1 focus:ring-[#5b5fc7]"
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
                className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-900 focus:ring-1 focus:ring-[#5b5fc7]"
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
                  className="mt-0.5 rounded text-[#5b5fc7]"
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
                    className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:ring-1 focus:ring-[#5b5fc7]"
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
                className="text-[11px] font-semibold text-[#5b5fc7] hover:underline flex items-center gap-1 mt-1 cursor-pointer"
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
              className="bg-[#5b5fc7] hover:bg-[#4f52b2] text-white px-5 py-2 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>{isScheduled ? 'Schedule Assignment' : 'Publish Assignment'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
