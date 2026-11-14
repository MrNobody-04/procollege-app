export type AttendanceStatus = 'present' | 'absent' | 'late';
export type AttendanceThresholdStatus = 'safe' | 'warning' | 'danger' | 'pending';

export interface AttendanceThreshold {
  status: AttendanceThresholdStatus;
  label: string;
  percentage: number;
  badgeClass: string;
  pillClass: string;
  textClass: string;
  borderClass: string;
  dotColor: string;
  icon: string;
  isRestricted: boolean; // true if attendance < 75%
}

export interface SchoolAttendanceRecord {
  id: string;
  sessionId: string;
  collegeId?: string;
  classId: string;
  studentId: string;
  studentName?: string;
  date: string;
  status: AttendanceStatus;
  takenByUserId: string;
  createdAt?: string;
}

export interface SubjectAttendanceRecord {
  id: string;
  sessionId: string;
  collegeId?: string;
  courseId: string;
  subjectId: string; // channelId
  studentId: string;
  studentName?: string;
  date: string;
  status: AttendanceStatus;
  takenByUserId: string;
  createdAt?: string;
}

export interface AttendanceOverride {
  id: string;
  assignmentId: string;
  studentId: string;
  overriddenBy: string;
  overriddenAt?: string;
  active: boolean;
}

export interface StudentAttendanceSummary {
  studentId: string;
  studentName?: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  percentage: number;
  threshold: AttendanceThreshold;
}

export function getPendingAttendanceThreshold(): AttendanceThreshold {
  return {
    status: 'pending',
    label: 'No Records',
    percentage: 0,
    badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    pillClass: 'bg-zinc-400 text-white',
    textClass: 'text-zinc-600',
    borderClass: 'border-zinc-300',
    dotColor: '#94a3b8',
    icon: '',
    isRestricted: false
  };
}

/**
 * Global Threshold & Color-Coding Rules:
 * Safe: Attendance >= 80% (Emerald badge/text)
 * Moderate / Warning: Attendance between 75% and 79% (Zinc/Slate badge/text)
 * In Danger: Attendance < 75% (Rose badge/text)
 */
export function getAttendanceThreshold(percentage: number): AttendanceThreshold {
  const rounded = Math.round(percentage);

  if (rounded >= 80) {
    return {
      status: 'safe',
      label: 'Safe',
      percentage: rounded,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pillClass: 'bg-emerald-600 text-white',
      textClass: 'text-emerald-700',
      borderClass: 'border-emerald-500',
      dotColor: '#10b981',
      icon: '',
      isRestricted: false
    };
  }

  if (rounded >= 75) {
    return {
      status: 'warning',
      label: 'Moderate',
      percentage: rounded,
      badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-300',
      pillClass: 'bg-zinc-600 text-white',
      textClass: 'text-zinc-700',
      borderClass: 'border-zinc-400',
      dotColor: '#71717a',
      icon: '',
      isRestricted: false
    };
  }

  return {
    status: 'danger',
    label: 'In Danger',
    percentage: rounded,
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    pillClass: 'bg-rose-600 text-white',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-500',
    dotColor: '#f43f5e',
    icon: '',
    isRestricted: true
  };
}

/**
 * School Level Attendance Calculation (Nursery to Class 12)
 * Formula: (Total Days Present / Total Days Attendance Taken) * 100
 */
export function calculateSchoolAttendance(
  records: { status: AttendanceStatus }[]
): {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  percentage: number;
  threshold: AttendanceThreshold;
} {
  const totalSessions = records.length;
  if (totalSessions === 0) {
    // If no attendance has been recorded yet, student has no records
    return {
      totalSessions: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      percentage: 0,
      threshold: getPendingAttendanceThreshold()
    };
  }

  const presentCount = records.filter(r => r.status === 'present').length;
  const lateCount = records.filter(r => r.status === 'late').length;
  const absentCount = records.filter(r => r.status === 'absent').length;

  // Formula: (Total Days Present / Total Days Attendance Taken) * 100
  const percentage = (presentCount / totalSessions) * 100;

  return {
    totalSessions,
    presentCount,
    absentCount,
    lateCount,
    percentage: Math.round(percentage * 10) / 10,
    threshold: getAttendanceThreshold(percentage)
  };
}

/**
 * University Level Subject Attendance Calculation (Bachelor's)
 * Formula: strictly dynamically computed per subject based on total classes held for that module
 * percentage = (subject_present / total_subject_sessions_conducted) * 100
 */
export function calculateSubjectAttendance(
  records: { status: AttendanceStatus }[]
): {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  percentage: number;
  threshold: AttendanceThreshold;
} {
  const totalSessions = records.length;
  if (totalSessions === 0) {
    return {
      totalSessions: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      percentage: 0,
      threshold: getPendingAttendanceThreshold()
    };
  }

  const presentCount = records.filter(r => r.status === 'present').length;
  const lateCount = records.filter(r => r.status === 'late').length;
  const absentCount = records.filter(r => r.status === 'absent').length;

  const percentage = (presentCount / totalSessions) * 100;

  return {
    totalSessions,
    presentCount,
    absentCount,
    lateCount,
    percentage: Math.round(percentage * 10) / 10,
    threshold: getAttendanceThreshold(percentage)
  };
}

/**
 * Determines whether student is restricted from submitting an assignment.
 * Locked IF:
 * 1. Student subject attendance is < 75%
 * AND
 * 2. NO active lecturer override exists for (assignmentId, studentId)
 */
export function isAssignmentSubmissionLocked(
  attendancePercentage: number,
  hasOverride: boolean
): {
  isLocked: boolean;
  percentage: number;
  hasOverride: boolean;
  message?: string;
} {
  if (hasOverride) {
    return {
      isLocked: false,
      percentage: Math.round(attendancePercentage),
      hasOverride: true
    };
  }

  if (attendancePercentage < 75) {
    return {
      isLocked: true,
      percentage: Math.round(attendancePercentage),
      hasOverride: false,
      message: `Assignment submission restricted due to low attendance (${Math.round(attendancePercentage)}%). Contact your lecturer for manual override permission to submit.`
    };
  }

  return {
    isLocked: false,
    percentage: Math.round(attendancePercentage),
    hasOverride: false
  };
}
