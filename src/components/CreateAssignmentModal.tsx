import React, { useState, useRef } from 'react';
import {
  FileCheck,
  Clock,
  Lock,
  Plus,
  Trash2,
  FileText,
  Share2,
  Upload
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { RubricCriterion } from '../types';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultChannelId?: string;
}

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

  // Section 3.2: Reference Materials vs Editable Student Copies
  const [referenceMode, setReferenceMode] = useState<'students-cant-edit' | 'students-edit-own-copy'>('students-cant-edit');
  const [referenceFileName, setReferenceFileName] = useState('Assignment_Specification_Sheet.pdf');
  const refFileInputRef = useRef<HTMLInputElement>(null);

  const handleRefFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceFileName(file.name);
    }
  };

  // Section 3.3: Exact Deadline Logic (3 independent timestamp controls)
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('2026-11-14T09:00');

  const [dueDate, setDueDate] = useState('2026-11-20T23:59');

  const [hasCloseDate, setHasCloseDate] = useState(true);
  const [closeDate, setCloseDate] = useState('2026-11-20T23:59');
  const [isStrictNoLate, setIsStrictNoLate] = useState(true);

  // Rubric weighted evaluation criteria
  const [rubric, setRubric] = useState<RubricCriterion[]>([
    { id: 'crit_1', criterion: 'Technical Correctness & Problem Formulation', maxPoints: 50 },
    { id: 'crit_2', criterion: 'Empirical Verification & Test Cases', maxPoints: 30 },
    { id: 'crit_3', criterion: 'Documentation & Code Quality', maxPoints: 20 }
  ]);

  if (!isOpen) return null;

  const handleApplyStrictNoLate = () => {
    setHasCloseDate(true);
    setCloseDate(dueDate);
    setIsStrictNoLate(true);
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

    createAssignment({
      courseId: selectedCourse.id,
      courseCode: selectedCourse.code,
      title: title.trim(),
      instructions: instructions.trim() || 'Please follow all specifications in the attached problem sheet and turn in your solution before the close cutoff.',
      points: Number(points),
      targetChannelId,
      referenceMaterialMode: referenceMode,
      referenceFiles: [
        {
          id: `ref_${Date.now()}`,
          name: referenceFileName,
          size: '1.5 MB',
          type: 'pdf'
        }
      ],
      dueAt: new Date(dueDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      closeAt: hasCloseDate ? new Date(closeDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : undefined,
      isStrictNoLateSubmission: isStrictNoLate,
      rubric
    });

    onClose();
    showDialog(
      `Assignment "${title}" published and routed to ${selectedCourse.channels.find(c => c.id === targetChannelId)?.name || 'General'}!`,
      { type: 'success', title: 'Assignment Published' }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-zinc-200 my-8 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5b5fc7]/10 text-[#5b5fc7] flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-zinc-900">Create & Publish Academic Assignment</h2>
              <p className="text-xs text-zinc-500">
                Phase 2 Lecturer Workflow: Exact Deadline Logic & SharePoint Permission Enforcement
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          {/* Assignment Title */}
          <div>
            <label className="block font-semibold text-zinc-700 mb-1">Assignment Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Lab 4: B-Tree Indexing Engine Implementation"
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
              placeholder="State problem statements, expected deliverables, compilation flags, and memory constraints..."
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-800 focus:ring-1 focus:ring-[#5b5fc7] focus:outline-none resize-none"
            />
          </div>

          {/* Section 3.2: Reference Materials vs Editable Student Copies */}
          <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#5b5fc7]" />
                Attached Reference Material
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                onClick={() => setReferenceMode('students-cant-edit')}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                  referenceMode === 'students-cant-edit'
                    ? 'bg-white border-[#5b5fc7] text-[#5b5fc7] font-semibold shadow-xs'
                    : 'border-zinc-200 bg-white/60 text-zinc-600'
                }`}
              >
                <div className="font-bold">"Students can't edit" (Default)</div>
                <p className="text-[10px] text-zinc-500 font-normal mt-0.5">
                  Question sheets & lecture slides. All students view the same read-only file.
                </p>
              </label>

              <label
                onClick={() => setReferenceMode('students-edit-own-copy')}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                  referenceMode === 'students-edit-own-copy'
                    ? 'bg-white border-[#5b5fc7] text-[#5b5fc7] font-semibold shadow-xs'
                    : 'border-zinc-200 bg-white/60 text-zinc-600'
                }`}
              >
                <div className="font-bold">"Students edit their own copy"</div>
                <p className="text-[10px] text-zinc-500 font-normal mt-0.5">
                  Generates an isolated, private duplicate template for each individual student.
                </p>
              </label>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-zinc-500 whitespace-nowrap">File:</span>
              <input
                type="file"
                ref={refFileInputRef}
                onChange={handleRefFilePicked}
                className="hidden"
              />
              <input
                type="text"
                value={referenceFileName}
                onChange={e => setReferenceFileName(e.target.value)}
                className="bg-white border border-zinc-300 rounded px-2 py-1 text-xs font-mono flex-1 text-zinc-800"
                placeholder="File name or select from device..."
              />
              <button
                type="button"
                onClick={() => refFileInputRef.current?.click()}
                className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded border border-zinc-300 flex items-center gap-1 cursor-pointer transition-colors"
                title="Browse local file"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Browse</span>
              </button>
            </div>
          </div>

          {/* Channel Notification Routing (Section 3.2) */}
          <div className="flex items-center justify-between bg-zinc-50 p-3 rounded-xl border border-zinc-200">
            <div>
              <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-[#5b5fc7]" />
                Channel Notification Routing
              </span>
              <p className="text-[10px] text-zinc-500">
                Post automated assignment card to this subject channel instead of General.
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

          {/* Section 3.3: Exact Deadline Logic (Three Timestamp Controls) */}
          <div className="bg-indigo-50/40 border border-indigo-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#5b5fc7]" />
                Assignment Dates & Deadlines
              </span>
              <button
                type="button"
                onClick={handleApplyStrictNoLate}
                className="text-[10px] bg-indigo-600 text-white font-bold px-2.5 py-1 rounded-md hover:bg-indigo-700 transition-colors shadow-2xs"
              >
                ⚡ Apply "Strict No-Late-Submission"
              </button>
            </div>

            {/* 1. Schedule to assign in future */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-indigo-100">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-700">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={e => setIsScheduled(e.target.checked)}
                  className="rounded text-[#5b5fc7]"
                />
                <span>1. Schedule to assign in the future (keeps hidden until date)</span>
              </label>
              {isScheduled && (
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  className="bg-white border border-zinc-300 rounded px-2 py-1 text-xs"
                />
              )}
            </div>

            {/* 2. Mandatory Due Date */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-indigo-100">
              <span className="font-semibold text-zinc-800">2. Due Date & Time (Official Deadline) *</span>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={e => {
                  setDueDate(e.target.value);
                  if (isStrictNoLate) setCloseDate(e.target.value);
                }}
                className="bg-white border border-zinc-300 rounded px-2 py-1 text-xs font-semibold text-zinc-900"
                required
              />
            </div>

            {/* 3. Close Date (Hard Cutoff) */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-indigo-100">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-800">
                <input
                  type="checkbox"
                  checked={hasCloseDate}
                  onChange={e => setHasCloseDate(e.target.checked)}
                  className="rounded text-[#5b5fc7]"
                />
                <span className="flex items-center gap-1 font-bold text-rose-900">
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  3. Close Date & Time (Hard Cutoff - Blocks Late Submissions)
                </span>
              </label>
              {hasCloseDate && (
                <input
                  type="datetime-local"
                  value={closeDate}
                  onChange={e => {
                    setCloseDate(e.target.value);
                    if (e.target.value !== dueDate) setIsStrictNoLate(false);
                  }}
                  className="bg-white border border-rose-300 rounded px-2 py-1 text-xs font-semibold text-rose-900"
                />
              )}
            </div>

            {hasCloseDate && closeDate === dueDate && (
              <p className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 p-2 rounded border border-emerald-200">
                ✓ "Strict No-Late-Submission" Active: The Turn In and Attach buttons will permanently lock the exact second of deadline expiration.
              </p>
            )}

            {hasCloseDate && closeDate > dueDate && (
              <p className="text-[10px] text-amber-800 font-semibold bg-amber-50 p-2 rounded border border-amber-200">
                ℹ️ Grace Window Active: Between Due Date and Close Date, student button will display "Turn in late". At Close Date sharp, portal locks completely.
              </p>
            )}
          </div>

          {/* Points & Rubric Matrix */}
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
                        className="text-zinc-400 hover:text-rose-600"
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
                className="text-[11px] font-semibold text-[#5b5fc7] hover:underline flex items-center gap-1 mt-1"
              >
                <Plus className="w-3 h-3" />
                Add Rubric Criterion
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#5b5fc7] hover:bg-[#4f52b2] text-white px-5 py-2 text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" />
              Publish Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
