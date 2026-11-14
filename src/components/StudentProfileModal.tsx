import React, { useState } from 'react';
import {
  X,
  Mail,
  Phone,
  Calendar,
  Building2,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { User, CourseTeam } from '../types';

interface StudentProfileModalProps {
  student: User;
  isOpen: boolean;
  onClose: () => void;
  course?: CourseTeam;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  isOpen,
  onClose,
  course
}) => {
  const {
    getStudentSubjectAttendance,
    getStudentOverallAttendance,
    schoolAttendance,
    subjectAttendance,
    courses
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'subjects'>('overview');

  if (!isOpen) return null;

  // Determine overall attendance standing
  const overallAttendance = getStudentOverallAttendance(student.id);
  const threshold = overallAttendance.threshold;

  // School level records for this student
  const studentSchoolRecords = schoolAttendance.filter(r => r.studentId === student.id);
  // Subject level records for this student
  const studentSubjectRecords = subjectAttendance.filter(r => r.studentId === student.id);

  // Student's enrolled courses
  const enrolledCourses = courses.filter(c => c.enrolledStudents?.some(s => s.id === student.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={student.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
              alt={student.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-zinc-900 leading-tight">{student.name}</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${threshold.badgeClass}`}>
                  <span>{threshold.icon}</span>
                  <span>{threshold.label} ({threshold.percentage}%)</span>
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                ID: {student.loginId || student.id} • {student.department || 'Enrolled Student'}
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

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-200 bg-white px-4 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'overview'
                ? 'border-[#173bff] text-[#173bff]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Overview & Standing
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`py-3 px-3 font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'subjects'
                ? 'border-[#173bff] text-[#173bff]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Subject Attendance Modules
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-3 px-3 font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'sessions'
                ? 'border-[#173bff] text-[#173bff]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Attendance History ({studentSchoolRecords.length + studentSubjectRecords.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Prominent Attendance Standing Card */}
              <div className={`p-4 rounded-xl border ${threshold.badgeClass} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{threshold.icon}</span>
                    <div>
                      <h4 className="font-bold text-sm">Overall Attendance Rate: {threshold.percentage}%</h4>
                      <p className="text-xs opacity-90">
                        Standing: <strong>{threshold.label}</strong> (Minimum required threshold: 75%)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black">{threshold.percentage}%</span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full bg-black/10 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, threshold.percentage))}%`,
                      backgroundColor: threshold.dotColor
                    }}
                  />
                </div>

                {/* Gatekeeper Warning if In Danger */}
                {threshold.status === 'danger' && (
                  <div className="bg-white/80 p-3 rounded-lg border border-rose-300 flex items-start gap-2.5 text-xs text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Assignment Access Gatekeeper: Locked</p>
                      <p className="text-[11px] text-rose-800 mt-0.5">
                        This student's attendance has fallen below 75%. Assignment submissions are automatically locked. Reading materials remain accessible. A lecturer must toggle a manual override to grant permission to submit.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Attendance Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Sessions</p>
                  <p className="text-lg font-bold text-zinc-900 mt-1">{overallAttendance.totalSessions}</p>
                </div>
                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Present
                  </p>
                  <p className="text-lg font-bold text-emerald-800 mt-1">{overallAttendance.presentCount}</p>
                </div>
                <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200">
                  <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-rose-600" />
                    Absent
                  </p>
                  <p className="text-lg font-bold text-rose-800 mt-1">{overallAttendance.absentCount}</p>
                </div>
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Late
                  </p>
                  <p className="text-lg font-bold text-amber-800 mt-1">{overallAttendance.lateCount}</p>
                </div>
              </div>

              {/* Student Details & Parent Contact Information */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                <h4 className="font-bold text-xs text-zinc-800 uppercase tracking-wider">Student Profile & Guardian Contact</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Email Address</span>
                    <span className="font-medium text-zinc-800 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      {student.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Institution / Campus</span>
                    <span className="font-medium text-zinc-800 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                      {student.institutionName || 'ProCollege Campus'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Class / Enrolled Program</span>
                    <span className="font-medium text-zinc-800 flex items-center gap-1 mt-0.5">
                      <GraduationCap className="w-3.5 h-3.5 text-zinc-400" />
                      {course ? course.name : (enrolledCourses[0]?.name || student.department || 'Enrolled Student')}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Parent / Emergency Contact</span>
                    <span className="font-medium text-zinc-800 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      +977 9841-000000 (Guardian)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">
                Granular attendance computed dynamically strictly from total conducted sessions for each subject module.
              </p>

              {enrolledCourses.flatMap(c => c.channels.filter(ch => !ch.isGeneral)).length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
                  No subject modules found for enrolled classes.
                </div>
              ) : (
                <div className="space-y-2">
                  {enrolledCourses.flatMap(c =>
                    c.channels.filter(ch => !ch.isGeneral).map(ch => {
                      const stats = getStudentSubjectAttendance(student.id, ch.id);
                      const t = stats.threshold;

                      return (
                        <div
                          key={ch.id}
                          className="bg-white p-3.5 rounded-xl border border-zinc-200 flex items-center justify-between hover:border-zinc-300 transition-colors shadow-2xs"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-xs text-zinc-900 truncate">{ch.name}</h5>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${t.badgeClass}`}>
                                <span>{t.icon}</span>
                                <span>{t.label} ({t.percentage}%)</span>
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              Class: {c.code} • Teacher: {ch.subjectLecturerName || 'Assigned Lecturer'}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-bold text-zinc-800">
                              {stats.presentCount} / {stats.totalSessions} sessions
                            </span>
                            <span className="block text-[10px] text-zinc-400">
                              {stats.totalSessions === 0 ? 'No sessions yet' : `${stats.percentage}% conducted`}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-zinc-800 uppercase tracking-wider">Session Roll-Call Log</h4>
              {studentSchoolRecords.length === 0 && studentSubjectRecords.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
                  No roll-call sessions recorded yet for this student.
                </div>
              ) : (
                <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-xl overflow-hidden text-xs">
                  {[...studentSchoolRecords, ...studentSubjectRecords]
                    .sort((a, b) => (b.date > a.date ? 1 : -1))
                    .map((rec, i) => (
                      <div key={rec.id || i} className="p-3 bg-white flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Calendar className="w-4 h-4 text-zinc-400" />
                          <div>
                            <span className="font-bold text-zinc-800">{rec.date}</span>
                            <span className="text-[11px] text-zinc-500 ml-2">
                              {'subjectId' in rec ? `Subject: ${rec.subjectId}` : 'Daily Class Roll-Call'}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            rec.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : rec.status === 'absent'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-zinc-500">
            ProCollege Official Attendance & Academic Record Ledger
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
