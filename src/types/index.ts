export type UserRole = 'developer' | 'admin' | 'assistant_admin' | 'lecturer' | 'student' | 'professor' | 'ta' | 'platform_admin';
export type PresenceStatus = 'available' | 'busy' | 'away' | 'dnd' | 'in-call' | 'offline';
export type EducationLevel = 'school_k10' | 'high_school_11_12' | 'bachelor';
export type LicenseSku =
  | 'ProCollege Verified for Faculty'
  | 'ProCollege Verified for Students'
  | 'ProCollege Verified for Administration'
  | 'ProCollege Enterprise Platform License'
  | 'Microsoft 365 A5 for Faculty'
  | 'Microsoft 365 A3 for Faculty'
  | 'Microsoft 365 A1 for Faculty'
  | 'Microsoft 365 A5 for Students'
  | 'Microsoft 365 A3 for Students'
  | 'Microsoft 365 A1 for Students';

export interface User {
  id: string;
  loginId?: string;
  name: string;
  email: string;
  role: UserRole;
  license: LicenseSku;
  department: string;
  institutionName?: string;
  institutionId?: string;
  collegeId?: string;
  collegeName?: string;
  educationLevel?: EducationLevel;
  avatar: string;
  status: PresenceStatus;
  statusMessage?: string;
  isMuted?: boolean;
  temporaryPassword?: string;
  createdAt?: string;
  isDemo?: boolean;
}

export interface DepartmentSubject {
  id?: string;
  name: string;
  code: string;
  description?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headId?: string;
  headName?: string;
  deanId?: string; // backwards compatibility alias
  deanName?: string; // backwards compatibility alias
  description: string;
  institutionName?: string;
  collegeId?: string;
  memberIds?: string[];
  subjects?: DepartmentSubject[];
  educationLevel?: EducationLevel;
  isDemo?: boolean;
}
export type FacultyDepartment = Department;

export interface InstitutionalRequest {
  id: string;
  institutionName: string;
  department: string;
  contactName: string;
  email: string;
  phone: string;
  studentCount: number;
  deploymentType: 'campus-pro' | 'enterprise';
  notes?: string;
  status: 'pending' | 'verified' | 'provisioned';
  submittedAt: string;
  assignedAdminId?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'code' | 'archive' | 'image' | 'ppt' | 'presentation' | 'sheet' | 'text' | 'other';
  size: string;
  url?: string;
  mimeType?: string;
  isClassMaterial?: boolean;
  permission?: 'read-only' | 'editable';
}

export interface Reply {
  id: string;
  author: User;
  content: string;
  timestamp: string;
  reactions: Record<string, string[]>; // emoji -> array of user names
}

export type PostCategory = 'general' | 'alert' | 'holiday' | 'event' | 'class-details';

export interface ThreadPost {
  id: string;
  channelId: string;
  author: User;
  title?: string;
  content: string;
  isAnnouncement?: boolean;
  category?: PostCategory;
  timestamp: string;
  pinned?: boolean;
  reactions: Record<string, string[]>;
  replies: Reply[];
  attachments?: Attachment[];
  assignmentId?: string; // routed assignment announcement card
}

export interface Channel {
  id: string;
  courseId: string;
  name: string;
  description: string;
  isGeneral?: boolean;
  unreadCount?: number;
  studentFilePermission?: 'read-only' | 'can-edit';
  subjectLecturerName?: string;
  subjectLecturerId?: string;
}

export type DeploymentModel = 'model-a' | 'model-b'; // Model A: Subject-per-Team | Model B: Cohort-Batch with Subject Channels

export interface CourseTeam {
  id: string;
  code: string;
  name: string;
  department: string;
  departmentId?: string;
  institutionName?: string;
  facultyId?: string; // backwards compatibility alias
  term: string;
  color: string;
  icon: string;
  instructor: User;
  coOwners?: User[]; // For Model B cohort batch teams
  memberCount: number;
  enrolledStudents?: User[];
  channels: Channel[];
  isActivated: boolean; // Pre-staged inactive state until Lecturer clicks Activate banner
  model: DeploymentModel;
  template: 'Class' | 'PLC' | 'Staff' | 'Other';
  educationLevel?: EducationLevel;
  isDemo?: boolean;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  reactions: Record<string, string[]>;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participants: User[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  institutionName?: string;
  isDemo?: boolean;
}

export type SubmissionStatus =
  | 'not-turned-in'
  | 'viewed'
  | 'turned-in'
  | 'turned-in-late'
  | 'graded'
  | 'returned'
  | 'revision-requested';

export interface SubmittedFile {
  name: string;
  size: string;
  type: string;
  isReadOnly: boolean;
  uploadedAt: string;
  url?: string;
  mimeType?: string;
}

export interface AssignmentSubmission {
  studentId: string;
  studentName: string;
  status: SubmissionStatus;
  viewedAt?: string;
  submittedAt?: string;
  fileName?: string;
  fileSize?: string;
  files: SubmittedFile[];
  grade?: number;
  feedback?: string;
  rubricScores?: Record<string, number>;
  revisionGranted?: boolean; // Individual deadline override granted by lecturer
}

export interface RubricCriterion {
  id: string;
  criterion: string;
  description?: string;
  maxPoints: number;
}

export interface Assignment {
  id: string;
  institutionName: string; // 1. Organization boundary
  facultyId: string; // 2. Faculty/Department boundary
  courseId: string; // 3. Class/Section boundary (e.g. BIT Sem 5 - Sec A)
  courseCode: string;
  channelId: string; // 4. Exact Subject ID inside that class (e.g. Operating Systems vs Database Systems)
  targetChannelId?: string; // Routing: General vs specific subject channel (alias for channelId)
  subjectName: string; // Display name of the subject
  createdByEmail: string; // The lecturer who published it
  title: string;
  instructions: string;
  points: number;
  referenceMaterialMode?: 'students-cant-edit' | 'students-edit-own-copy'; // Permission setting beside attached file
  referenceFiles?: Attachment[];
  publishedAt?: string; // Auto-selected timestamp when published
  scheduleDate?: string; // Schedule to assign in future
  isScheduled?: boolean;
  dueAt: string; // Mandatory Due Date & Time
  dueTimestamp?: number; // Epoch timestamp for deadline checking
  closeAt?: string; // Close Date & Time (Hard Cutoff)
  isStrictNoLateSubmission?: boolean; // Strict rule: Close Date == Due Date
  rubric: RubricCriterion[];
  submissions: AssignmentSubmission[];
}

export interface CalendarEvent {
  id: string;
  courseId?: string;
  courseCode?: string;
  title: string;
  instructorName: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  dateStr: string;
  startTime: string;
  endTime: string;
  location: string;
  isVirtual: boolean;
  meetingLink?: string;
  institutionName?: string;
  isDemo?: boolean;
}

export interface CourseFile {
  id: string;
  courseId: string;
  channelId?: string;
  institutionName?: string;
  name: string;
  category: 'Class Materials' | 'Syllabus' | 'Lecture Slides' | 'Lab Manuals' | 'Readings' | 'Subject Files' | 'Private Submissions';
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  uploadedByRole?: UserRole;
  isClassMaterials?: boolean; // Pinned folder: Owners = Edit, Members = Read-Only
  permission: 'read-only' | 'can-edit';
  isPrivate?: boolean; // Private student submissions or working files restricted from public listing
  isDemo?: boolean;
  url?: string;
  mimeType?: string;
}

export interface ActivityNotification {
  id: string;
  type: 'mention' | 'assignment' | 'reply' | 'announcement' | 'call' | 'grade' | 'revision' | 'course_material';
  title: string;
  detail: string;
  timestamp: string;
  courseId?: string;
  courseCode?: string;
  channelId?: string;
  institutionName?: string;
  isRead: boolean;
  author?: User;
  isDemo?: boolean;
}

export type DialogType = 'success' | 'info' | 'warning' | 'error' | 'alert' | 'confirm';

export interface DialogOptions {
  title?: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface DialogState {
  isOpen: boolean;
  message: string;
  title: string;
  type: DialogType;
  confirmText: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// Attendance & Gatekeeper Types
export type AttendanceStatus = 'present' | 'absent' | 'late';
export type AttendanceTier = 'school' | 'university';

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
  subjectId: string; // channel_id
  studentId: string;
  studentName?: string;
  date: string;
  status: AttendanceStatus;
  takenByUserId: string;
  createdAt?: string;
}

export interface AssignmentAttendanceOverride {
  id: string;
  assignmentId: string;
  studentId: string;
  overriddenBy: string;
  overriddenAt?: string;
  active: boolean;
}

