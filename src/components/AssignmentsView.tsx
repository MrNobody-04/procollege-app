import React, { useState } from 'react';
import {
  FileCheck,
  Calendar,
  Clock,
  Plus,
  Paperclip,
  BookOpen,
  Layers,
  Filter
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CreateAssignmentModal } from './CreateAssignmentModal';
import { SpeedGraderModal } from './SpeedGraderModal';
import { StudentAssignmentModal } from './StudentAssignmentModal';
import type { Assignment } from '../types';

export const AssignmentsView: React.FC = () => {
  const { assignments, courses, currentUser } = useApp();

  type FilterType = 'pending' | 'completed' | 'due-passed' | 'all';
  const [activeFilter, setActiveFilter] = useState<FilterType>('pending');

  // Filter dropdown state
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeSpeedGraderAsgn, setActiveSpeedGraderAsgn] = useState<Assignment | null>(null);
  const [activeStudentAsgn, setActiveStudentAsgn] = useState<Assignment | null>(null);

  const isOwner =
    currentUser.role === 'professor' ||
    currentUser.role === 'lecturer' ||
    currentUser.role === 'admin' ||
    currentUser.role === 'developer' ||
    (currentUser as unknown as { role: string }).role === 'teacher';

  const [currentTime] = useState(() => Date.now());

  const userInstitution = currentUser.institutionName || 'ProCollege University Network';
  const isStudent = currentUser.role === 'student';

  // 1. Scoped classes for current user
  const userCourses = courses.filter(c => {
    if (currentUser.role !== 'developer') {
      if (c.institutionName && userInstitution && c.institutionName !== userInstitution) return false;
    }
    if (isStudent) {
      return (
        c.enrolledStudents?.some(s => s.id === currentUser.id) ||
        (currentUser.enrolledCourses && currentUser.enrolledCourses.includes(c.code))
      );
    }
    if (
      currentUser.role === 'teacher' ||
      currentUser.role === 'professor' ||
      currentUser.role === 'lecturer'
    ) {
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
    }
    return true; // Admin / Developer
  });

  const userCourseIds = new Set(userCourses.map(c => c.id));

  // 2. Base assignments accessible to current user
  const scopedAssignments = assignments.filter(a => {
    // Institution boundary
    if (currentUser.role !== 'developer') {
      if (a.institutionName && userInstitution && a.institutionName !== userInstitution) return false;
    }
    // Must belong to an accessible course
    if (!userCourseIds.has(a.courseId)) return false;

    // Lecturer boundary: only subjects they teach or course lead
    if (
      currentUser.role === 'teacher' ||
      currentUser.role === 'professor' ||
      currentUser.role === 'lecturer'
    ) {
      const course = courses.find(c => c.id === a.courseId);
      if (!course) return false;
      const isCourseLead =
        course.instructor.id === currentUser.id || course.coOwners?.some(co => co.id === currentUser.id);
      if (!isCourseLead) {
        const asgnChanId = a.channelId || a.targetChannelId;
        const channel = course.channels.find(ch => ch.id === asgnChanId);
        const isSubjectLecturer =
          channel &&
          (channel.subjectLecturerId === currentUser.id ||
            (channel.subjectLecturerName &&
              channel.subjectLecturerName.toLowerCase().includes(currentUser.name.toLowerCase())));
        if (!isSubjectLecturer && a.createdByEmail !== currentUser.email) return false;
      }
    }

    // Student boundary: hide future scheduled assignments
    if (isStudent && a.scheduleDate && new Date(a.scheduleDate).getTime() > currentTime) {
      return false;
    }

    return true;
  });

  // 3. Dropdown filtering (Course & Subject)
  const activeCourseObj = courses.find(c => c.id === selectedCourseId);
  const availableSubjectChannels = activeCourseObj
    ? activeCourseObj.channels.filter(
        ch => !ch.isGeneral && ch.name.toLowerCase() !== 'announcements' && ch.name.toLowerCase() !== 'general'
      )
    : [];

  const handleCourseFilterChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedChannelId('all'); // Reset subject filter when class changes
  };

  const filteredByDropdowns = scopedAssignments.filter(a => {
    if (selectedCourseId !== 'all' && a.courseId !== selectedCourseId) {
      return false;
    }
    if (selectedChannelId !== 'all') {
      const asgnChanId = a.channelId || a.targetChannelId;
      if (asgnChanId !== selectedChannelId) return false;
    }
    return true;
  });

  // Helper to determine if assignment deadline has passed
  const isDeadlinePassed = (asgn: Assignment): boolean => {
    if (asgn.dueTimestamp) {
      return currentTime > asgn.dueTimestamp;
    }
    return false;
  };

  // Helper to determine student submission status
  const getStudentStatus = (asgn: Assignment) => {
    if (asgn.scheduleDate && new Date(asgn.scheduleDate).getTime() > currentTime) {
      return 'scheduled';
    }
    const studentSub = asgn.submissions.find(s => s.studentId === currentUser.id);
    const isSubmitted = studentSub?.status === 'turned-in' || studentSub?.status === 'graded';
    const isPassed = isDeadlinePassed(asgn);

    if (isSubmitted) return 'completed';
    if (isPassed) return 'due-passed';
    return 'pending';
  };

  // Filtered lists for the 4 status tabs based on active dropdown filter
  const pendingAssignments = filteredByDropdowns.filter(a => getStudentStatus(a) === 'pending');
  const completedAssignments = filteredByDropdowns.filter(a => getStudentStatus(a) === 'completed');
  const duePassedAssignments = filteredByDropdowns.filter(a => getStudentStatus(a) === 'due-passed');

  const displayedAssignments =
    activeFilter === 'pending'
      ? pendingAssignments
      : activeFilter === 'completed'
      ? completedAssignments
      : activeFilter === 'due-passed'
      ? duePassedAssignments
      : filteredByDropdowns;

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
              Coursework and problem sets scoped to your enrolled classes and subjects.
            </p>
          </div>

          {isOwner && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 bg-[#5b5fc7] hover:bg-[#4f52b2] text-white px-3.5 py-1.5 rounded text-xs font-medium shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assignment</span>
            </button>
          )}
        </div>

        {/* 2 Filter Dropdowns: Filter by Class & Filter by Subject */}
        <div className="bg-white rounded-lg border border-zinc-200 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-700 font-semibold shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#5b5fc7]" />
            <span>Filters:</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap flex-1 justify-end">
            {/* Filter by Class */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                Class:
              </label>
              <select
                value={selectedCourseId}
                onChange={e => handleCourseFilterChange(e.target.value)}
                className="bg-zinc-50 hover:bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-800 focus:ring-1 focus:ring-[#5b5fc7] transition-colors"
              >
                <option value="all">All My Classes ({userCourses.length})</option>
                {userCourses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Subject */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                Subject:
              </label>
              <select
                value={selectedChannelId}
                onChange={e => setSelectedChannelId(e.target.value)}
                disabled={selectedCourseId === 'all'}
                className="bg-zinc-50 hover:bg-white disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-800 focus:ring-1 focus:ring-[#5b5fc7] transition-colors"
              >
                <option value="all">
                  {selectedCourseId === 'all' ? 'All Subjects (Select class first)' : 'All Subjects in Class'}
                </option>
                {availableSubjectChannels.map(ch => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
            </div>

            {(selectedCourseId !== 'all' || selectedChannelId !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCourseId('all');
                  setSelectedChannelId('all');
                }}
                className="text-[11px] text-[#5b5fc7] hover:underline font-semibold cursor-pointer ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* 4 Standard Status Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-zinc-200 pb-2 text-xs font-medium overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded transition-colors shrink-0 whitespace-nowrap text-[11px] sm:text-xs cursor-pointer ${
              activeFilter === 'pending'
                ? 'bg-[#5b5fc7] text-white font-semibold'
                : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
            }`}
          >
            Pending ({pendingAssignments.length})
          </button>

          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded transition-colors shrink-0 whitespace-nowrap text-[11px] sm:text-xs cursor-pointer ${
              activeFilter === 'completed'
                ? 'bg-[#5b5fc7] text-white font-semibold'
                : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
            }`}
          >
            Completed ({completedAssignments.length})
          </button>

          <button
            onClick={() => setActiveFilter('due-passed')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded transition-colors shrink-0 whitespace-nowrap text-[11px] sm:text-xs cursor-pointer ${
              activeFilter === 'due-passed'
                ? 'bg-[#5b5fc7] text-white font-semibold'
                : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
            }`}
          >
            Due Date Passed ({duePassedAssignments.length})
          </button>

          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded transition-colors shrink-0 whitespace-nowrap text-[11px] sm:text-xs cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#5b5fc7] text-white font-semibold'
                : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
            }`}
          >
            All ({filteredByDropdowns.length})
          </button>
        </div>

        {/* Natural List of Assignments with Strict Scoped Badges */}
        <div className="bg-white rounded-lg border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
          {displayedAssignments.length === 0 ? (
            <div className="p-10 text-center text-zinc-500 text-xs">
              <FileCheck className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="font-medium text-zinc-700">No assignments in this category</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {activeFilter === 'pending' && 'You have no pending assignments to submit.'}
                {activeFilter === 'completed' && 'No completed submissions yet.'}
                {activeFilter === 'due-passed' && 'No missed deadlines.'}
                {activeFilter === 'all' && 'No assignments match the selected class or subject filters.'}
              </p>
            </div>
          ) : (
            displayedAssignments.map(asgn => {
              const studentSub = asgn.submissions.find(s => s.studentId === currentUser.id);
              const isSubmitted = studentSub?.status === 'turned-in' || studentSub?.status === 'graded';
              const isPassed = isDeadlinePassed(asgn);
              const courseObj = courses.find(c => c.id === asgn.courseId);
              const displayCourseName = courseObj?.name || asgn.courseCode;

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
                  <div className="min-w-0 pr-4 space-y-1.5">
                    {/* Strict Class • Subject Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50/80 text-indigo-800 font-semibold text-[11px] border border-indigo-200">
                        <BookOpen className="w-3 h-3 text-[#5b5fc7]" />
                        <span>{displayCourseName}</span>
                        <span className="text-indigo-400">•</span>
                        <span className="font-bold text-indigo-900">{asgn.subjectName || 'Subject'}</span>
                      </span>

                      {asgn.scheduleDate && new Date(asgn.scheduleDate).getTime() > currentTime && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                          Scheduled
                        </span>
                      )}
                    </div>

                    {/* Assignment Title */}
                    <h3 className="font-bold text-xs sm:text-sm text-zinc-900 hover:text-[#5b5fc7] transition-colors truncate">
                      {asgn.title}
                    </h3>

                    {/* Meta info */}
                    <div className="flex items-center gap-2.5 text-[11px] text-zinc-500 flex-wrap">
                      {asgn.scheduleDate && new Date(asgn.scheduleDate).getTime() > currentTime ? (
                        <span className="flex items-center gap-1 text-amber-700 font-medium">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Releases {new Date(asgn.scheduleDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          Due {asgn.dueAt}
                        </span>
                      )}
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

                  {/* Clean Natural Status Indicator */}
                  <div className="shrink-0 text-right">
                    {currentUser.role === 'student' ? (
                      isSubmitted ? (
                        <div>
                          <p className="text-xs font-semibold text-emerald-700">Turned in</p>
                          {studentSub?.submittedAt && (
                            <p className="text-[10px] text-zinc-400">{studentSub.submittedAt}</p>
                          )}
                        </div>
                      ) : isPassed ? (
                        <div>
                          <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            Due date passed
                          </p>
                          <p className="text-[10px] text-zinc-400">Submissions closed</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-zinc-700">Assigned</p>
                          <p className="text-[10px] text-zinc-400">Not turned in</p>
                        </div>
                      )
                    ) : (
                      asgn.scheduleDate && new Date(asgn.scheduleDate).getTime() > currentTime ? (
                        <div>
                          <p className="text-xs font-semibold text-amber-700">Scheduled</p>
                          <p className="text-[10px] text-zinc-400">Hidden from students</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-zinc-700">
                            {asgn.submissions.length} turned in
                          </p>
                          <p className="text-[10px] text-[#5b5fc7] hover:underline font-medium">SpeedGrader</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CREATE MODAL (Global mode with Class & Subject selector) */}
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
