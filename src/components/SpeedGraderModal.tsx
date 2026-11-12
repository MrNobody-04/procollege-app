import React, { useState } from 'react';
import {
  Award,
  Clock,
  RotateCcw,
  Send,
  Eye,
  Lock,
  ChevronLeft,
  ChevronRight,
  FileCode,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Assignment, AssignmentSubmission } from '../types';

interface SpeedGraderModalProps {
  assignment: Assignment;
  initialStudentId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SpeedGraderModal: React.FC<SpeedGraderModalProps> = ({
  assignment,
  initialStudentId,
  isOpen,
  onClose
}) => {
  const { availableUsers, returnAssignment, returnForRevision, showDialog } = useApp();

  const students = availableUsers.filter(u => u.role === 'student');
  const [currentStudentIndex, setCurrentStudentIndex] = useState(() => {
    if (!initialStudentId) return 0;
    const idx = students.findIndex(s => s.id === initialStudentId);
    return idx >= 0 ? idx : 0;
  });

  const student = students[currentStudentIndex] || students[0];
  const submission: AssignmentSubmission | undefined = assignment.submissions.find(s => s.studentId === student.id);

  // Rubric Scores State
  const [rubricScores, setRubricScores] = useState<Record<string, number>>(() => {
    if (submission?.rubricScores) return submission.rubricScores;
    const initial: Record<string, number> = {};
    assignment.rubric.forEach(r => {
      initial[r.id] = r.maxPoints;
    });
    return initial;
  });

  const [feedback, setFeedback] = useState(submission?.feedback || 'Comprehensive solution. Excellent edge-case handling.');
  const [customGrade, setCustomGrade] = useState<number>(() => {
    if (submission?.grade !== undefined) return submission.grade;
    return assignment.points;
  });

  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  if (!isOpen) return null;

  const totalRubricScore = Object.values(rubricScores).reduce((acc, v) => acc + v, 0);

  const handleScoreChange = (critId: string, val: number) => {
    const updated = { ...rubricScores, [critId]: val };
    setRubricScores(updated);
    const sum = Object.values(updated).reduce((acc, v) => acc + v, 0);
    setCustomGrade(sum);
  };

  const handleReturn = () => {
    returnAssignment(assignment.id, student.id, customGrade, feedback, rubricScores);
    showDialog(
      `Grade returned to ${student.name}: ${customGrade} / ${assignment.points} points. Recorded in Grades ledger.`,
      { type: 'success', title: 'Grade Returned' }
    );
  };

  const handleReturnForRevision = () => {
    const defaultReason = 'Medical excuse verified: Submission portal re-opened exclusively for you to submit revisions.';
    returnForRevision(assignment.id, student.id, defaultReason);
    showDialog(
      `Individual Deadline Override granted for ${student.name}! Submission portal has been re-opened solely for this student.`,
      { type: 'success', title: 'Deadline Override Granted' }
    );
  };

  const nextStudent = () => {
    if (currentStudentIndex < students.length - 1) {
      setCurrentStudentIndex(currentStudentIndex + 1);
    }
  };

  const prevStudent = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(currentStudentIndex - 1);
    }
  };

  const currentFile = submission?.files?.[selectedFileIndex];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex flex-col z-50 overflow-hidden text-zinc-900 select-none">
      {/* SpeedGrader Top Bar */}
      <header className="h-14 bg-[#2b2b2b] text-white flex items-center justify-between px-6 border-b border-zinc-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#5b5fc7] flex items-center justify-center font-bold text-sm">
            <Award className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{assignment.title}</span>
              <span className="text-xs font-semibold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                {assignment.courseCode}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Microsoft Teams SpeedGrader™ Review Environment</p>
          </div>
        </div>

        {/* Student Selector & Stepper */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevStudent}
            disabled={currentStudentIndex === 0}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 bg-zinc-800/90 px-3 py-1 rounded-lg border border-zinc-700">
            <img src={student.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
            <span className="text-xs font-bold text-white">{student.name}</span>
            <span className="text-[10px] text-zinc-400">
              ({currentStudentIndex + 1} of {students.length})
            </span>
          </div>

          <button
            onClick={nextStudent}
            disabled={currentStudentIndex === students.length - 1}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button onClick={onClose} className="ml-4 text-zinc-400 hover:text-white text-lg">
            ✕
          </button>
        </div>
      </header>

      {/* Main Split Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Interactive Document & Work Preview */}
        <div className="flex-1 bg-zinc-900 flex flex-col overflow-hidden border-r border-zinc-800">
          {/* File Switcher Header */}
          <div className="h-10 bg-[#1e1e1e] border-b border-zinc-800 px-4 flex items-center justify-between text-xs text-zinc-400 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-300">Submitted Artifacts ({submission?.files?.length || 0}):</span>
              {submission?.files?.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedFileIndex(i)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1 transition-colors ${
                    selectedFileIndex === i
                      ? 'bg-[#5b5fc7] text-white font-semibold'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3 h-3" />
                  {f.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>SharePoint Working Sandbox Locked</span>
            </div>
          </div>

          {/* Document Content Simulation */}
          <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-[#181818]">
            {submission && submission.files && submission.files.length > 0 ? (
              <div className="bg-white text-zinc-900 rounded-xl shadow-2xl max-w-3xl w-full p-8 font-serif leading-relaxed border border-zinc-300 space-y-4">
                <div className="border-b border-zinc-200 pb-4 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold font-sans text-zinc-900">{assignment.title}</h3>
                    <p className="text-xs font-sans text-zinc-500">Student Solution Document: {currentFile?.name || 'Solution.pdf'}</p>
                    <p className="text-xs font-sans text-indigo-700 font-semibold mt-1">Author: {student.name} • {student.email}</p>
                  </div>
                  <div className="text-right font-sans text-xs">
                    <span className="font-bold text-zinc-800">Submitted:</span>
                    <p className="text-zinc-500 font-mono">{submission.submittedAt || 'Turned in before deadline'}</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs font-mono text-zinc-800 bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                  <p className="text-indigo-900 font-bold">// Implementation: Push-Relabel Maximum Flow & Bipartite Matching</p>
                  <p className="text-zinc-600">// Asymptotic bound: O(V^2 * sqrt(E)) with highest-label heuristic</p>
                  <p className="text-emerald-700">#include &lt;iostream&gt;</p>
                  <p className="text-emerald-700">#include &lt;vector&gt;</p>
                  <p className="text-emerald-700">#include &lt;queue&gt;</p>
                  <p>void push_relabel_flow_network(int nodes, int source, int sink) &#123;</p>
                  <p className="pl-4">std::vector&lt;long long&gt; excess(nodes, 0);</p>
                  <p className="pl-4">std::vector&lt;int&gt; height(nodes, 0);</p>
                  <p className="pl-4">height[source] = nodes;</p>
                  <p className="pl-4">// Discharge algorithm and active vertex queue...</p>
                  <p className="pl-4 text-zinc-500">// Benchmarked on Stanford SNAP: 3.4x faster than Edmonds-Karp</p>
                  <p>&#125;</p>
                </div>

                <div className="text-xs text-zinc-700 space-y-2">
                  <h4 className="font-bold text-zinc-900 font-sans text-sm">Empirical Runtime & Scaling Verification:</h4>
                  <p>
                    We tested the bipartite matching solver on 10 random scale-free graphs with up to 100,000 nodes.
                    Average time per matching query stabilized at 14.2 milliseconds, satisfying all performance criteria.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-500 space-y-2">
                <FileText className="w-12 h-12 text-zinc-600" />
                <p className="font-semibold text-sm">No solution attached yet by {student.name}</p>
                <p className="text-xs text-zinc-600">Student status is currently: {submission?.status || 'not-turned-in'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: SpeedGrader Review, Rubric & Actions */}
        <div className="w-96 bg-white flex flex-col justify-between border-l border-zinc-200 p-5 overflow-y-auto">
          <div className="space-y-4">
            {/* Submission Status */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-2">
              <span className="font-semibold text-xs text-zinc-800 block">
                Submission Details
              </span>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Submission State:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      submission?.status === 'turned-in'
                        ? 'bg-emerald-100 text-emerald-800'
                        : submission?.status === 'turned-in-late'
                        ? 'bg-amber-100 text-amber-800'
                        : submission?.status === 'viewed'
                        ? 'bg-blue-100 text-blue-800'
                        : submission?.status === 'revision-requested'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {submission?.status || 'not-turned-in'}
                  </span>
                </div>

                {submission?.viewedAt && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-blue-600" />
                      Viewed by Student:
                    </span>
                    <span className="font-mono text-zinc-800">{submission.viewedAt}</span>
                  </div>
                )}

                {submission?.submittedAt && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      Timestamp:
                    </span>
                    <span className="font-mono text-zinc-800">{submission.submittedAt}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rubric Evaluation Matrix */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-zinc-800">Grading Rubric Matrix:</span>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  Sum: {totalRubricScore} / {assignment.points}
                </span>
              </div>

              <div className="space-y-2">
                {assignment.rubric.map(crit => {
                  const currentScore = rubricScores[crit.id] ?? crit.maxPoints;
                  return (
                    <div key={crit.id} className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-zinc-800">{crit.criterion}</span>
                        <span className="font-bold text-indigo-700 font-mono">
                          {currentScore} / {crit.maxPoints} pts
                        </span>
                      </div>
                      {crit.description && <p className="text-[10px] text-zinc-500">{crit.description}</p>}
                      <div className="flex gap-1 pt-1">
                        {[0, Math.floor(crit.maxPoints / 2), Math.floor(crit.maxPoints * 0.75), crit.maxPoints].map(
                          pt => (
                            <button
                              key={pt}
                              type="button"
                              onClick={() => handleScoreChange(crit.id, pt)}
                              className={`flex-1 py-1 rounded text-[10px] font-bold border transition-colors ${
                                currentScore === pt
                                  ? 'bg-[#5b5fc7] text-white border-[#5b5fc7]'
                                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                              }`}
                            >
                              {pt}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Points & Feedback Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-800">Final Points Awarded:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={customGrade}
                    onChange={e => setCustomGrade(Number(e.target.value))}
                    className="w-16 bg-zinc-50 border border-zinc-300 rounded px-2 py-1 text-xs font-bold text-right"
                  />
                  <span className="text-xs text-zinc-500">/ {assignment.points}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Written Feedback to Student:</label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#5b5fc7] resize-none"
                  placeholder="Provide concrete academic feedback and suggestions..."
                />
              </div>
            </div>
          </div>

          {/* Section 5.3: Return vs Return for Revision */}
          <div className="pt-4 border-t border-zinc-200 space-y-2">
            <button
              onClick={handleReturn}
              className="w-full bg-[#5b5fc7] hover:bg-[#4f52b2] text-white py-2.5 rounded-lg text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Return (Publish Final Grade & Feedback)</span>
            </button>

            <button
              onClick={handleReturnForRevision}
              className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              title="Individual Deadline Override: re-opens submission solely for this student without reopening for class."
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
              <span>Return for revision</span>
            </button>
            <p className="text-[10px] text-zinc-400 text-center">
              Re-opens submission for {student.name.split(' ')[0]} to submit an updated copy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
