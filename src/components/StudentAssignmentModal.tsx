import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Lock,
  Trash2,
  FileText,
  File,
  Presentation,
  FileArchive,
  FileCheck,
  CheckCircle2,
  RotateCcw,
  Paperclip,
  Download,
  Award,
  AlertCircle,
  Clock,
  Upload,
  Eye
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FilePreviewModal } from './FilePreviewModal';
import { downloadFile, readFileAsDataUrl } from '../utils/fileManager';
import type { Assignment, SubmittedFile } from '../types';

interface StudentAssignmentModalProps {
  assignment: Assignment;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentAssignmentModal: React.FC<StudentAssignmentModalProps> = ({
  assignment,
  isOpen,
  onClose
}) => {
  const {
    currentUser,
    markAssignmentViewed,
    attachStudentFile,
    removeStudentFile,
    turnInAssignment,
    undoTurnIn,
    showDialog,
    isStudentLockedFromAssignment
  } = useApp();

  const [newFileName, setNewFileName] = useState('');
  const [actionNotification, setActionNotification] = useState<string | null>(null);
  const [currentTime] = useState(() => Date.now());
  const [previewAssignmentFile, setPreviewAssignmentFile] = useState<{
    name: string;
    size?: string;
    url?: string;
    category?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subject Attendance & Submission Gatekeeper Check (< 75% Locks Submission)
  const targetSubjectId = assignment.channelId || assignment.targetChannelId || '';
  const attendanceLock = isStudentLockedFromAssignment(assignment.id, currentUser.id, targetSubjectId);

  // Find student submission
  const submission = assignment.submissions.find(s => s.studentId === currentUser.id);

  // Mark viewed when student opens
  useEffect(() => {
    if (isOpen && currentUser.role === 'student') {
      markAssignmentViewed(assignment.id, currentUser.id);
    }
  }, [isOpen, assignment.id, currentUser.id, currentUser.role, markAssignmentViewed]);

  const handleDeviceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let dataUrl: string | undefined = undefined;
      try {
        dataUrl = await readFileAsDataUrl(file);
      } catch (err) {
        console.warn('Could not read file as data url:', err);
      }

      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.max(1, Math.round(file.size / 1024))} KB`;

      const ext = file.name.split('.').pop()?.toLowerCase();
      const type: SubmittedFile['type'] =
        ext === 'zip' || ext === 'rar' || ext === 'tar' || ext === 'gz'
          ? 'archive'
          : ext === 'cpp' || ext === 'c' || ext === 'py' || ext === 'java' || ext === 'ts' || ext === 'js'
          ? 'code'
          : ext === 'doc' || ext === 'docx'
          ? 'doc'
          : 'pdf';

      const newFile: SubmittedFile = {
        name: file.name,
        size: sizeStr,
        type,
        isReadOnly: false,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        url: dataUrl
      };
      attachStudentFile(assignment.id, currentUser.id, newFile);
    }

    setActionNotification(`${files.length} file(s) attached from device.`);
    setTimeout(() => setActionNotification(null), 3500);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  // Deadline calculation
  const isDeadlinePassed = Boolean(assignment.dueTimestamp && currentTime > assignment.dueTimestamp);

  // Submission statuses
  const isSubmitted =
    submission?.status === 'turned-in' ||
    submission?.status === 'turned-in-late' ||
    submission?.status === 'graded';
  const isRevisionRequested = submission?.status === 'revision-requested';

  // Can the student edit or upload files?
  // Only if: deadline has NOT passed AND not turned in (or revision requested)
  const canEditFiles = (!isDeadlinePassed && !isSubmitted) || isRevisionRequested;

  // Can the student undo turn in?
  // Only allowed BEFORE deadline when already submitted
  const canUndoTurnIn = !isDeadlinePassed && isSubmitted && !isRevisionRequested;

  const handleAttachFile = (presetName?: string) => {
    const rawName = presetName || newFileName.trim() || `${currentUser.name.replace(/\s+/g, '_')}_ProblemSet_Solution.pdf`;
    const newFile: SubmittedFile = {
      name: rawName,
      size: '2.1 MB',
      type: rawName.endsWith('.zip') ? 'archive' : rawName.endsWith('.cpp') ? 'code' : 'pdf',
      isReadOnly: false,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    attachStudentFile(assignment.id, currentUser.id, newFile);
    setNewFileName('');
    setActionNotification(`File "${rawName}" attached to your draft.`);
    setTimeout(() => setActionNotification(null), 3000);
  };

  const handleRemoveFile = (fileName: string) => {
    removeStudentFile(assignment.id, currentUser.id, fileName);
    setActionNotification(`File "${fileName}" removed.`);
    setTimeout(() => setActionNotification(null), 3000);
  };

  const handleTurnIn = () => {
    if (attendanceLock.isLocked) {
      showDialog(attendanceLock.message || `Assignment submission restricted due to low attendance (${attendanceLock.percentage}%). Contact your lecturer for manual override permission to submit.`, {
        type: 'warning',
        title: 'Attendance Gatekeeper Lock'
      });
      return;
    }

    if (isDeadlinePassed && !isRevisionRequested) {
      showDialog('The deadline has passed. Submissions are closed.', { type: 'warning', title: 'Deadline Closed' });
      return;
    }

    if (!submission?.files || submission.files.length === 0) {
      const defaultFile: SubmittedFile = {
        name: `${currentUser.name.replace(/\s+/g, '_')}_Assignment_Submission.pdf`,
        size: '1.8 MB',
        type: 'pdf',
        isReadOnly: true,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      attachStudentFile(assignment.id, currentUser.id, defaultFile);
    }

    const res = turnInAssignment(assignment.id, currentUser.id, false);
    if (res.success) {
      setActionNotification('Assignment turned in successfully. Files are locked.');
      setTimeout(() => setActionNotification(null), 4000);
    } else {
      showDialog(res.message, { type: 'warning', title: 'Turn In Status' });
    }
  };

  const handleUndoTurnIn = () => {
    if (isDeadlinePassed) {
      showDialog('Cannot undo turn in after the deadline has passed.', { type: 'warning', title: 'Action Not Allowed' });
      return;
    }

    const res = undoTurnIn(assignment.id, currentUser.id);
    if (res.success) {
      setActionNotification('Turn in undone. You can now delete, replace, or upload new files before the deadline.');
      setTimeout(() => setActionNotification(null), 4000);
    } else {
      showDialog(res.message, { type: 'warning', title: 'Undo Turn In' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto select-none">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl border border-zinc-200 my-8 animate-in fade-in">
        {/* Header - Clean and Natural */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-600">
                {assignment.courseCode}
              </span>
              <span className="text-zinc-300">•</span>
              <span className="text-xs text-zinc-500">
                {assignment.points} points possible
              </span>
            </div>
            <h2 className="text-base font-bold text-zinc-900 mt-1">
              {assignment.title}
            </h2>
            <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Due: <strong className="text-zinc-800">{assignment.dueAt}</strong>
              </span>
              {assignment.closeAt && (
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  Closes: <strong className="text-zinc-800">{assignment.closeAt}</strong>
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded text-base"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Attendance Gatekeeper Status Banner */}
        {attendanceLock.isLocked && !isSubmitted && (
          <div className="mt-3 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-3 text-xs text-rose-900 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-rose-950">Assignment Submission Restricted</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-200 text-rose-900">
                  Attendance: {attendanceLock.percentage}%
                </span>
              </div>
              <p className="text-rose-800 mt-0.5 leading-relaxed">
                Assignment submission restricted due to low attendance ({attendanceLock.percentage}%). Contact your lecturer for manual override permission to submit.
              </p>
              <p className="text-[11px] text-rose-700 mt-1">
                You may still read and review the assignment instructions, rubric, and reference materials below.
              </p>
            </div>
          </div>
        )}

        {attendanceLock.hasOverride && !isSubmitted && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-3 text-xs text-emerald-900 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-emerald-950">Lecturer Exception Active</span>
              <p className="text-emerald-800 mt-0.5">
                Your lecturer has granted an attendance exception for this assignment. Submission portal is active.
              </p>
            </div>
          </div>
        )}

        {/* Action / Notification Banner */}
        {actionNotification && (
          <div className="mt-3 p-2.5 bg-[#f0f1fc] text-[#26394D] text-xs font-medium rounded border border-[#d6d8f5] flex items-center justify-between">
            <span>{actionNotification}</span>
            <button
              onClick={() => setActionNotification(null)}
              className="text-xs font-bold text-[#26394D] hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Status Lifecycle Notice (Matching 4 Options) */}
        <div className="mt-4">
          {isDeadlinePassed ? (
            isSubmitted ? (
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-zinc-900">
                    Completed • Turned In ({submission?.submittedAt || 'on time'})
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    The deadline has passed. Submissions are permanently closed and files cannot be undone, edited, or replaced.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-900">
                    Due Date Passed • Submissions Closed
                  </p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    The deadline was {assignment.dueAt}. You are no longer permitted to upload, edit, or delete files, or turn in work for this assignment.
                  </p>
                </div>
              </div>
            )
          ) : isSubmitted ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900">
                    Completed • Turned In
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {submission?.submittedAt || 'Turned in before deadline'}. Files are currently locked to read-only.
                  </p>
                  <p className="text-[11px] text-emerald-800 mt-1">
                    Need to replace a file? Click <strong>Undo Turn In</strong> below to unlock your draft before the deadline.
                  </p>
                </div>
              </div>
            </div>
          ) : isRevisionRequested ? (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded text-xs text-purple-900 flex items-start gap-2.5">
              <RotateCcw className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-purple-900">
                  Revision Requested by Instructor
                </p>
                <p className="text-[11px] text-purple-800 mt-0.5">
                  Instructor feedback: "{submission?.feedback || 'Please update the requested sections and turn in your revision.'}"
                </p>
                <p className="text-[11px] text-purple-700 mt-0.5">
                  An individual deadline override has re-opened submission for you.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-zinc-900">
                  Pending Submission
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Due {assignment.dueAt}. Attach your completed solution files below and click Turn In before the cutoff.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="space-y-4 mt-4 text-xs">
          {/* Instructions */}
          <div className="bg-white rounded border border-zinc-200 p-3.5 space-y-1">
            <h3 className="font-semibold text-zinc-900">Instructions</h3>
            <p className="text-zinc-700 leading-relaxed whitespace-pre-line text-xs">
              {assignment.instructions}
            </p>
          </div>

          {/* Reference Materials */}
          {assignment.referenceFiles && assignment.referenceFiles.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="font-semibold text-zinc-900 text-xs">Reference Materials ({assignment.referenceFiles.length})</h3>
              <div className="space-y-1.5">
                {assignment.referenceFiles.map(rf => (
                  <div
                    key={rf.id}
                    className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200 flex items-center justify-between hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${
                        rf.type === 'pdf' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                        rf.type === 'ppt' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                        rf.type === 'archive' ? 'bg-purple-50 border-purple-200 text-purple-600' :
                        'bg-blue-50 border-blue-200 text-blue-600'
                      }`}>
                        {rf.type === 'pdf' ? <FileText className="w-4 h-4" /> :
                         rf.type === 'ppt' ? <Presentation className="w-4 h-4" /> :
                         rf.type === 'archive' ? <FileArchive className="w-4 h-4" /> :
                         <File className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-xs text-zinc-900 truncate">{rf.name}</p>
                        <p className="text-[10px] text-zinc-400">
                          {rf.size} • Read-only reference material
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        onClick={() =>
                          setPreviewAssignmentFile({
                            name: rf.name,
                            size: rf.size,
                            url: rf.url,
                            category: 'Reference Material'
                          })
                        }
                        className="text-[#173bff] hover:underline font-medium text-xs flex items-center gap-1 cursor-pointer"
                        title="Preview reference material"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() =>
                          downloadFile(rf.name, rf.url, {
                            courseName: assignment.courseCode,
                            category: 'Assignment Reference Material'
                          })
                        }
                        className="text-zinc-600 hover:text-emerald-700 hover:underline font-medium text-xs flex items-center gap-1 cursor-pointer"
                        title="Download reference material"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Work (Student Submission Files & Replace Mechanism) */}
          <div className="border border-zinc-200 rounded p-4 bg-zinc-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-zinc-600" />
                  My Work
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Private student working files. Only you and course lecturers can view.
                </p>
              </div>

              {isSubmitted && !canEditFiles ? (
                <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-zinc-400" />
                  Files locked (read-only)
                </span>
              ) : null}
            </div>

            {/* Attached files list */}
            <div className="space-y-2">
              {submission?.files && submission.files.length > 0 ? (
                submission.files.map((file, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-2.5 rounded border border-zinc-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900 truncate">{file.name}</p>
                        <p className="text-[11px] text-zinc-400">
                          {file.size} • Attached {file.uploadedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewAssignmentFile({
                            name: file.name,
                            size: file.size,
                            url: file.url,
                            category: 'Student Solution'
                          })
                        }
                        className="p-1 text-zinc-500 hover:text-[#173bff] rounded transition-colors cursor-pointer"
                        title="Preview submitted file"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadFile(file.name, file.url, {
                            courseName: assignment.courseCode,
                            category: 'Student Solution'
                          })
                        }
                        className="p-1 text-zinc-500 hover:text-emerald-600 rounded transition-colors cursor-pointer"
                        title="Download submitted file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {/* Delete button: ONLY allowed before deadline and when draft is unlocked */}
                      {canEditFiles ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.name)}
                          className="text-zinc-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                          title="Remove file (to replace or delete)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-400">Read-only</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center border border-dashed border-zinc-300 rounded bg-white text-zinc-400 text-xs">
                  {isDeadlinePassed
                    ? 'No files were submitted before the deadline.'
                    : 'No files attached yet. Add your solution files below.'}
                </div>
              )}
            </div>

            {/* File Upload / Replace Controls */}
            {canEditFiles ? (
              <div className="space-y-3 pt-2 border-t border-zinc-200">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleDeviceFileUpload}
                  multiple
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#26394D] hover:bg-[#141E2B] text-white px-4 py-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Upload className="w-4 h-4" />
                    <span>+ Attach File from Device</span>
                  </button>

                  <div className="flex flex-1 gap-1.5">
                    <input
                      type="text"
                      value={newFileName}
                      onChange={e => setNewFileName(e.target.value)}
                      placeholder="Or enter filename manually..."
                      className="flex-1 bg-white border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAttachFile()}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer"
                    >
                      Attach
                    </button>
                  </div>
                </div>
              </div>
            ) : isDeadlinePassed ? (
              <p className="text-[11px] text-zinc-400 italic">
                File upload, replacement, and deletion are disabled because the deadline has passed.
              </p>
            ) : isSubmitted ? (
              <p className="text-[11px] text-zinc-500">
                Files are locked while turned in. Click <strong>Undo Turn In</strong> below if you need to replace or update files before the deadline.
              </p>
            ) : null}
          </div>

          {/* Graded Feedback (if graded) */}
          {submission?.grade !== undefined && (
            <div className="bg-zinc-50 border border-zinc-200 rounded p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Grade & Feedback
                </span>
                <span className="font-bold text-sm text-emerald-700">
                  {submission.grade} / {assignment.points} points
                </span>
              </div>
              {submission.feedback && (
                <p className="text-zinc-600 text-xs mt-1">"{submission.feedback}"</p>
              )}
            </div>
          )}

          {/* Modal Footer / Action Buttons */}
          <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-xs text-zinc-600 hover:text-zinc-900 font-medium px-3 py-1.5 rounded hover:bg-zinc-100 transition-colors"
            >
              Close
            </button>

            <div className="flex items-center gap-2">
              {/* After deadline without turn-in: Submissions Closed */}
              {isDeadlinePassed && !isSubmitted && !isRevisionRequested ? (
                <button
                  disabled
                  className="bg-zinc-200 text-zinc-400 px-4 py-2 rounded text-xs font-semibold cursor-not-allowed"
                >
                  Submissions Closed
                </button>
              ) : isSubmitted ? (
                <>
                  <div className="flex items-center gap-1 text-emerald-700 font-medium text-xs mr-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Turned In</span>
                  </div>

                  {/* Undo Turn In: Allowed BEFORE deadline to replace files */}
                  {canUndoTurnIn ? (
                    <button
                      type="button"
                      onClick={handleUndoTurnIn}
                      className="bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 px-3.5 py-1.5 rounded font-medium text-xs transition-colors flex items-center gap-1.5"
                      title="Unlock your submission to replace or edit files before the deadline"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Undo Turn In</span>
                    </button>
                  ) : isDeadlinePassed ? (
                    <span className="text-xs text-zinc-400 italic">
                      Locked (Deadline passed)
                    </span>
                  ) : null}
                </>
              ) : attendanceLock.isLocked ? (
                <button
                  type="button"
                  disabled
                  className="bg-rose-50 text-rose-700 border border-rose-300 px-4 py-2 rounded font-semibold text-xs flex items-center gap-1.5 cursor-not-allowed opacity-90 shadow-2xs"
                  title={`Assignment submission restricted due to low attendance (${attendanceLock.percentage}%). Contact your lecturer for manual override permission to submit.`}
                >
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  <span>Submission Locked ({attendanceLock.percentage}% Attendance)</span>
                </button>
              ) : (
                /* Before deadline or revision requested: Turn In */
                <button
                  type="button"
                  onClick={handleTurnIn}
                  className="bg-[#26394D] hover:bg-[#141E2B] text-white px-5 py-2 rounded font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isRevisionRequested ? 'Turn In Revised Work' : 'Turn In'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewAssignmentFile && (
        <FilePreviewModal
          file={{
            name: previewAssignmentFile.name,
            size: previewAssignmentFile.size,
            url: previewAssignmentFile.url,
            category: previewAssignmentFile.category,
            courseName: assignment.courseCode
          }}
          isOpen={Boolean(previewAssignmentFile)}
          onClose={() => setPreviewAssignmentFile(null)}
          onDownload={() =>
            downloadFile(previewAssignmentFile.name, previewAssignmentFile.url, {
              courseName: assignment.courseCode,
              category: previewAssignmentFile.category
            })
          }
        />
      )}
    </div>
  );
};
