import React, { useState } from 'react';
import {
  X,
  Calendar,
  BookOpen,
  Users,
  Save,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { CourseTeam, Channel, AttendanceStatus } from '../types';

interface SubjectRollCallModalProps {
  course: CourseTeam;
  subject: Channel;
  isOpen: boolean;
  onClose: () => void;
}

export const SubjectRollCallModal: React.FC<SubjectRollCallModalProps> = ({
  course,
  subject,
  isOpen,
  onClose
}) => {
  const {
    saveSubjectRollCall,
    getStudentSubjectAttendance,
    subjectAttendance,
    showDialog,
    availableUsers,
    currentUser
  } = useApp();

  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const students = (course.enrolledStudents && course.enrolledStudents.length > 0)
    ? course.enrolledStudents
    : availableUsers.filter(u => u.role === 'student').slice(0, 5);

  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>(() => {
    const initial: Record<string, AttendanceStatus> = {};
    students.forEach(s => {
      const existing = subjectAttendance.find(
        r => r.subjectId === subject.id && r.studentId === s.id && r.date === date
      );
      initial[s.id] = (existing?.status as AttendanceStatus) || 'present';
    });
    return initial;
  });

  if (!isOpen) return null;

  const handleSetAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach(s => {
      updated[s.id] = status;
    });
    setStatusMap(updated);
  };

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setStatusMap(prev => ({ ...prev, [studentId]: status }));
  };

  const presentCount = Object.values(statusMap).filter(st => st === 'present').length;
  const absentCount = Object.values(statusMap).filter(st => st === 'absent').length;
  const lateCount = Object.values(statusMap).filter(st => st === 'late').length;
  const totalCount = students.length;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const records = students.map(s => ({
        studentId: s.id,
        status: statusMap[s.id] || 'present'
      }));

      await saveSubjectRollCall(course.id, subject.id, date, records);

      showDialog(
        `Subject Attendance recorded for "${subject.name}" on ${date}! Present: ${presentCount}/${totalCount}. Dynamic subject attendance rates recalculated.`,
        { type: 'success', title: 'Subject Attendance Recorded' }
      );
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showDialog(`Failed to record subject attendance: ${msg}`, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-zinc-900 leading-tight">Subject Session Attendance</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  University Tier
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {subject.name} • Class: {course.code} • Lecturer: {subject.subjectLecturerName || currentUser.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1.5 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Date Picker & Quick Actions */}
        <div className="p-3 sm:p-4 bg-zinc-50/80 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-white border border-zinc-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-indigo-600 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSetAll('present')}
              className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark All Present</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetAll('absent')}
              className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Dynamic Calculation Info */}
        <div className="px-4 py-2 bg-indigo-50/40 border-b border-indigo-100 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-zinc-700">
              Enrolled: <strong className="text-zinc-900">{totalCount}</strong>
            </span>
            <span className="text-indigo-700 font-semibold">
              Present: <strong>{presentCount}</strong>
            </span>
            <span className="text-rose-700 font-semibold">
              Absent: <strong>{absentCount}</strong>
            </span>
            <span className="text-amber-700 font-semibold">
              Late: <strong>{lateCount}</strong>
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            Granular per-session formula
          </span>
        </div>

        {/* Student Roll-Call List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-zinc-100">
          {students.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs">
              <Users className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
              No students enrolled in this class yet.
            </div>
          ) : (
            students.map((student, idx) => {
              const currentStatus = statusMap[student.id] || 'present';
              const subjectStats = getStudentSubjectAttendance(student.id, subject.id);
              const t = subjectStats.threshold;

              return (
                <div
                  key={student.id || idx}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-zinc-50/70 rounded-lg px-2 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={student.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                      alt={student.name}
                      className="w-8 h-8 rounded-full object-cover border border-zinc-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-xs text-zinc-900 truncate">{student.name}</p>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold border ${t.badgeClass}`}>
                          <span>{t.icon}</span>
                          <span>{t.percentage}%</span>
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {student.loginId || `STU-${idx + 101}`} • {subjectStats.presentCount}/{subjectStats.totalSessions} sessions
                      </p>
                    </div>
                  </div>

                  {/* Quick Toggle Pills: [P] Present, [A] Absent, [L] Late */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStudentStatus(student.id, 'present')}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        currentStatus === 'present'
                          ? 'bg-emerald-600 text-white shadow-xs scale-105'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                      }`}
                      title="Mark Present"
                    >
                      P
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentStatus(student.id, 'absent')}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        currentStatus === 'absent'
                          ? 'bg-rose-600 text-white shadow-xs scale-105'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                      }`}
                      title="Mark Absent"
                    >
                      A
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentStatus(student.id, 'late')}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        currentStatus === 'late'
                          ? 'bg-amber-600 text-white shadow-xs scale-105'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                      }`}
                      title="Mark Late"
                    >
                      L
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || students.length === 0}
            className="px-5 py-2 bg-[#26394D] hover:bg-[#141E2B] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving...' : 'Save Subject Roll-Call'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
