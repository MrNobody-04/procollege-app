import React, { useState } from 'react';
import {
  FileCheck,
  Calendar,
  Clock,
  Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CreateAssignmentModal } from './CreateAssignmentModal';
import { SpeedGraderModal } from './SpeedGraderModal';
import { StudentAssignmentModal } from './StudentAssignmentModal';
import type { Assignment } from '../types';

export const AssignmentsView: React.FC = () => {
  const {
    assignments,
    currentUser
  } = useApp();

  // 4 Standard Options requested: Pending, Completed, Due Date Passed, and All
  type FilterType = 'pending' | 'completed' | 'due-passed' | 'all';
  const [activeFilter, setActiveFilter] = useState<FilterType>('pending');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeSpeedGraderAsgn, setActiveSpeedGraderAsgn] = useState<Assignment | null>(null);
  const [activeStudentAsgn, setActiveStudentAsgn] = useState<Assignment | null>(null);

  const isOwner = currentUser.role === 'professor' || currentUser.role === 'lecturer';

  const [currentTime] = useState(() => Date.now());

  // Helper to determine if assignment deadline has passed
  const isDeadlinePassed = (asgn: Assignment): boolean => {
    if (asgn.dueTimestamp) {
      return currentTime > asgn.dueTimestamp;
    }
    return false;
  };

  // Helper to determine student submission status
  const getStudentStatus = (asgn: Assignment) => {
    const studentSub = asgn.submissions.find(s => s.studentId === currentUser.id);
    const isSubmitted = studentSub?.status === 'turned-in' || studentSub?.status === 'graded';
    const isPassed = isDeadlinePassed(asgn);

    if (isSubmitted) return 'completed';
    if (isPassed) return 'due-passed';
    return 'pending';
  };

  // Filtered lists for the 4 options
  const pendingAssignments = assignments.filter(a => getStudentStatus(a) === 'pending');
  const completedAssignments = assignments.filter(a => getStudentStatus(a) === 'completed');
  const duePassedAssignments = assignments.filter(a => getStudentStatus(a) === 'due-passed');

  const displayedAssignments =
    activeFilter === 'pending'
      ? pendingAssignments
      : activeFilter === 'completed'
      ? completedAssignments
      : activeFilter === 'due-passed'
      ? duePassedAssignments
      : assignments;

  return (
    <div className="flex-1 bg-[#f5f5f5] p-3 sm:p-5 md:p-6 overflow-y-auto select-none">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg border border-zinc-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
              Assignments
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Track upcoming coursework, deadlines, and completed submissions.
            </p>
          </div>

          {isOwner && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 bg-[#5b5fc7] hover:bg-[#4f52b2] text-white px-3.5 py-1.5 rounded text-xs font-medium shadow-xs transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assignment</span>
            </button>
          )}
        </div>

        {/* 4 Standard Options Navigation (Pending, Completed, Due Date Passed, All) */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-zinc-200 pb-2 text-xs font-medium overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded transition-colors shrink-0 whitespace-nowrap text-[11px] sm:text-xs ${
              activeFilter === 'pending'
                ? 'bg-[#5b5fc7] text-white font-semibold'
                : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
            }`}
          >
            Pending ({pendingAssignments.length})
          </button>

          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded transition-colors shrink-0 whitespace-nowrap text-[11px] sm:text-xs ${
              activeFilter === 'completed'
                ? 'bg-[#5b5fc7] text-white font-semibold'
                : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
            }`}
          >
            Completed ({completedAssignments.length})
          </button>

          <button
            onClick={() => setActiveFilter('due-passed')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded transition-colors shrink-0 whitespace-nowrap text-[11px] sm:text-xs ${
              activeFilter === 'due-passed'
                ? 'bg-[#5b5fc7] text-white font-semibold'
                : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
            }`}
          >
            Due Date Passed ({duePassedAssignments.length})
          </button>

          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded transition-colors shrink-0 whitespace-nowrap text-[11px] sm:text-xs ${
              activeFilter === 'all'
                ? 'bg-[#5b5fc7] text-white font-semibold'
                : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
            }`}
          >
            All ({assignments.length})
          </button>
        </div>

        {/* Natural List of Assignments (No glowing dots, no oval badges) */}
        <div className="bg-white rounded-lg border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
          {displayedAssignments.length === 0 ? (
            <div className="p-10 text-center text-zinc-500 text-xs">
              <FileCheck className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="font-medium text-zinc-700">No assignments in this category</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {activeFilter === 'pending' && 'You have no pending assignments to submit.'}
                {activeFilter === 'completed' && 'No completed submissions yet.'}
                {activeFilter === 'due-passed' && 'No missed deadlines.'}
              </p>
            </div>
          ) : (
            displayedAssignments.map(asgn => {
              const studentSub = asgn.submissions.find(s => s.studentId === currentUser.id);
              const isSubmitted = studentSub?.status === 'turned-in' || studentSub?.status === 'graded';
              const isPassed = isDeadlinePassed(asgn);

              return (
                <div
                  key={asgn.id}
                  onClick={() => {
                    if (currentUser.role === 'student') {
                      setActiveStudentAsgn(asgn);
                    } else {
                      setActiveSpeedGraderAsgn(asgn);
                    }
                  }}
                  className="p-4 flex items-center justify-between hover:bg-zinc-50/80 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 pr-4 space-y-1">
                    <h3 className="font-semibold text-xs text-zinc-900 hover:text-[#5b5fc7] transition-colors truncate">
                      {asgn.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                      <span>{asgn.courseCode}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-400" />
                        Due {asgn.dueAt}
                      </span>
                      <span>•</span>
                      <span>{asgn.points} points</span>
                    </div>
                  </div>

                  {/* Clean Natural Status Indicator */}
                  <div className="shrink-0 text-right">
                    {currentUser.role === 'student' ? (
                      isSubmitted ? (
                        <div>
                          <p className="text-xs font-medium text-emerald-700">Turned in</p>
                          {studentSub?.submittedAt && (
                            <p className="text-[10px] text-zinc-400">{studentSub.submittedAt}</p>
                          )}
                        </div>
                      ) : isPassed ? (
                        <div>
                          <p className="text-xs font-medium text-rose-600 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            Due date passed
                          </p>
                          <p className="text-[10px] text-zinc-400">Submissions closed</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-medium text-zinc-700">Assigned</p>
                          <p className="text-[10px] text-zinc-400">Not turned in</p>
                        </div>
                      )
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-zinc-700">
                          {asgn.submissions.length} turned in
                        </p>
                        <p className="text-[10px] text-[#5b5fc7] hover:underline">SpeedGrader</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      <CreateAssignmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* SPEEDGRADER MODAL */}
      {activeSpeedGraderAsgn && (
        <SpeedGraderModal
          assignment={activeSpeedGraderAsgn}
          isOpen={true}
          onClose={() => setActiveSpeedGraderAsgn(null)}
        />
      )}

      {/* STUDENT SUBMISSION MODAL */}
      {activeStudentAsgn && (
        <StudentAssignmentModal
          assignment={activeStudentAsgn}
          isOpen={true}
          onClose={() => setActiveStudentAsgn(null)}
        />
      )}
    </div>
  );
};
