import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type {
  User,
  UserRole,
  CourseTeam,
  Channel,
  ThreadPost,
  PostCategory,
  DirectMessage,
  Conversation,
  Assignment,
  CalendarEvent,
  CourseFile,
  ActivityNotification,
  LicenseSku,
  SubmittedFile,
  RubricCriterion,
  InstitutionalRequest,
  FacultyDepartment,
  PresenceStatus,
  DialogState,
  DialogOptions,
  DialogType
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_COURSES,
  INITIAL_POSTS,
  INITIAL_DIRECT_MESSAGES,
  INITIAL_CONVERSATIONS,
  INITIAL_ASSIGNMENTS,
  INITIAL_SCHEDULE,
  INITIAL_FILES,
  INITIAL_NOTIFICATIONS,
  INITIAL_INSTITUTIONAL_REQUESTS,
  INITIAL_FACULTIES
} from '../data/initialData';

export type ActiveTab = 'activity' | 'chat' | 'teams' | 'assignments' | 'calendar' | 'calls' | 'files' | 'admin';
export type ChannelTab = 'posts' | 'files' | 'assignments' | 'grades';
export type ViewMode = 'app' | 'portal';

interface MeetingState {
  isOpen: boolean;
  title: string;
  courseCode: string;
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  participants: User[];
  messages: { sender: string; text: string; time: string }[];
}

interface AppContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  launchProduct: (productId: string) => void;

  currentUser: User;
  setCurrentUser: (user: User) => void;
  availableUsers: User[];
  updateUserLicense: (userId: string, license: LicenseSku) => void;
  toggleUserMute: (userId: string) => void;
  updateUserPresence: (status: PresenceStatus) => void;
  updateUserAvatar: (avatarUrl: string) => void;
  logoutUser: () => void;

  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  courses: CourseTeam[];
  selectedCourse: CourseTeam;
  setSelectedCourse: (course: CourseTeam) => void;
  activateCourse: (courseId: string) => void;
  createCourse: (newCourse: CourseTeam) => void;
  deleteCourse: (courseId: string) => void;
  addChannel: (courseId: string, channel: { name: string; description: string; subjectLecturerName?: string; subjectLecturerId?: string }) => void;
  enrollStudentsToCourse: (courseId: string, studentIds: string[]) => void;
  removeStudentFromCourse: (courseId: string, studentId: string) => void;
  updateChannelLecturer: (courseId: string, channelId: string, lecturerId: string, lecturerName: string) => void;
  rolloverCourseToNextSemester: (sourceCourseId: string, data: {
    code: string;
    name: string;
    term: string;
    instructorId: string;
    channels: { name: string; description: string; subjectLecturerName?: string; subjectLecturerId?: string }[];
  }) => CourseTeam;

  selectedChannel: Channel;
  setSelectedChannel: (channel: Channel) => void;
  channelTab: ChannelTab;
  setChannelTab: (tab: ChannelTab) => void;
  toggleChannelFilePermission: (channelId: string, permission: 'read-only' | 'can-edit') => void;

  posts: Record<string, ThreadPost[]>;
  addPost: (
    channelId: string,
    title: string,
    content: string,
    isAnnouncement?: boolean,
    assignmentId?: string,
    category?: PostCategory
  ) => void;
  addReply: (channelId: string, postId: string, content: string) => void;
  toggleReaction: (channelId: string, postId: string, emoji: string, replyId?: string) => void;

  conversations: Conversation[];
  selectedConversation: Conversation;
  setSelectedConversation: (conv: Conversation) => void;
  directMessages: Record<string, DirectMessage[]>;
  sendDirectMessage: (convId: string, content: string) => void;

  assignments: Assignment[];
  createAssignment: (newAsgn: {
    courseId: string;
    courseCode: string;
    title: string;
    instructions: string;
    points: number;
    targetChannelId?: string;
    referenceMaterialMode: 'students-cant-edit' | 'students-edit-own-copy';
    referenceFiles?: { id: string; name: string; size: string; type: 'pdf' | 'doc' | 'code' | 'archive' | 'image' | 'ppt' }[];
    dueAt: string;
    closeAt?: string;
    isStrictNoLateSubmission?: boolean;
    rubric: RubricCriterion[];
  }) => void;
  markAssignmentViewed: (asgnId: string, studentId: string) => void;
  attachStudentFile: (asgnId: string, studentId: string, file: SubmittedFile) => void;
  removeStudentFile: (asgnId: string, studentId: string, fileName: string) => void;
  turnInAssignment: (asgnId: string, studentId: string, isLate?: boolean) => { success: boolean; message: string };
  undoTurnIn: (asgnId: string, studentId: string) => { success: boolean; message: string };
  returnAssignment: (asgnId: string, studentId: string, grade: number, feedback: string, rubricScores?: Record<string, number>) => void;
  returnForRevision: (asgnId: string, studentId: string, feedback: string) => void;

  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  courseFiles: CourseFile[];
  uploadCourseFile: (file: Omit<CourseFile, 'id' | 'uploadedAt'>) => { success: boolean; message: string };
  deleteCourseFile: (fileId: string) => { success: boolean; message: string };

  notifications: ActivityNotification[];
  markNotificationsAsRead: () => void;

  meeting: MeetingState;
  startMeeting: (title?: string, courseCode?: string) => void;
  endMeeting: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
  toggleHand: () => void;
  sendMeetingMessage: (text: string) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;

  isDemoMode: boolean;
  setIsDemoMode: (isDemo: boolean) => void;
  resetDemoData: () => void;

  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;

  institutionalRequests: InstitutionalRequest[];
  submitInstitutionalRequest: (reqData: Omit<InstitutionalRequest, 'id' | 'status' | 'submittedAt'>) => string;
  provisionInstitutionalRequest: (requestId: string) => { adminId: string; tempPass: string };
  registerUserByAdmin: (userData: {
    name: string;
    email: string;
    role: 'student' | 'lecturer' | 'professor';
    department: string;
    license: LicenseSku;
  }) => User;

  faculties: FacultyDepartment[];
  createFaculty: (faculty: Omit<FacultyDepartment, 'id'>) => void;
  createInstitutionalAdmin: (data: { name: string; email: string; institutionName: string; department?: string; temporaryPassword?: string }) => User;

  deleteChannel: (courseId: string, channelId: string) => void;
  selectedInstitution: string;
  setSelectedInstitution: (inst: string) => void;
  allInstitutions: string[];

  dialog: DialogState | null;
  showDialog: (message: string, options?: DialogOptions | string) => void;
  closeDialog: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Application First: Defaults directly to 'app' workspace
  const [viewMode, setViewMode] = useState<ViewMode>('portal');
  const [availableUsers, setAvailableUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Prof. Alan Turing (Lecturer/Owner) default
  const [activeTab, setActiveTab] = useState<ActiveTab>('teams');

  const [courses, setCourses] = useState<CourseTeam[]>(INITIAL_COURSES);
  const [selectedCourse, setSelectedCourse] = useState<CourseTeam>(INITIAL_COURSES[0]);
  const [selectedChannel, setSelectedChannel] = useState<Channel>(INITIAL_COURSES[0].channels[0]);
  const [channelTab, setChannelTab] = useState<ChannelTab>('posts');

  const [posts, setPosts] = useState<Record<string, ThreadPost[]>>(INITIAL_POSTS);
  const [conversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [selectedConversation, setSelectedConversation] = useState<Conversation>(INITIAL_CONVERSATIONS[0]);
  const [directMessages, setDirectMessages] = useState<Record<string, DirectMessage[]>>(INITIAL_DIRECT_MESSAGES);
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [courseFiles, setCourseFiles] = useState<CourseFile[]>(INITIAL_FILES);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(INITIAL_SCHEDULE);

  const addCalendarEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `evt_${Date.now()}`
    };
    setCalendarEvents(prev => [...prev, newEvent]);
  };
  const [notifications, setNotifications] = useState<ActivityNotification[]>(INITIAL_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [institutionalRequests, setInstitutionalRequests] = useState<InstitutionalRequest[]>(INITIAL_INSTITUTIONAL_REQUESTS);
  const [faculties, setFaculties] = useState<FacultyDepartment[]>(INITIAL_FACULTIES);
  const [selectedInstitution, setSelectedInstitution] = useState<string>('ProCollege University Network');

  // Restore authenticated Turso session on refresh if present
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem('procollege_user');
      const savedToken = localStorage.getItem('procollege_token');
      if (savedUserStr && savedToken) {
        const u = JSON.parse(savedUserStr);
        const mappedRole: UserRole =
          u.role === 'admin'
            ? 'admin'
            : u.role === 'teacher'
            ? 'professor'
            : 'student';

        const restoredUser: User = {
          id: u.id,
          name: u.full_name || u.name,
          email: u.email,
          role: mappedRole,
          license:
            u.role === 'admin' || u.role === 'teacher'
              ? 'Microsoft 365 A5 for Faculty'
              : 'Microsoft 365 A5 for Students',
          department: u.role === 'admin' ? 'Administration' : 'Department of BIT',
          institutionName: 'Padmashree College',
          avatar:
            u.avatar_url ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
          status: 'available',
        };
        setCurrentUser(restoredUser);
        setIsDemoMode(false);
        setViewMode('app');
      }
    } catch {
      // ignore
    }
  }, []);

  const [dialog, setDialog] = useState<DialogState | null>(null);

  const closeDialog = useCallback(() => {
    setDialog(null);
  }, []);

  const showDialog = useCallback((message: string, options?: DialogOptions | string) => {
    let title = 'ProCollege Notice';
    let type: DialogType = 'info';
    let confirmText = 'OK';
    let cancelText: string | undefined = undefined;
    let onConfirm: (() => void) | undefined = undefined;
    let onCancel: (() => void) | undefined = undefined;

    if (typeof options === 'string') {
      title = options;
    } else if (options) {
      if (options.title) title = options.title;
      if (options.type) type = options.type;
      if (options.confirmText) confirmText = options.confirmText;
      if (options.cancelText) cancelText = options.cancelText;
      if (options.onConfirm) onConfirm = options.onConfirm;
      if (options.onCancel) onCancel = options.onCancel;
    }

    if (!options || (typeof options === 'object' && !options.type)) {
      const lower = message.toLowerCase();
      if (
        lower.includes('added') ||
        lower.includes('created') ||
        lower.includes('approved') ||
        lower.includes('complete') ||
        lower.includes('success') ||
        lower.includes('saved') ||
        lower.includes('returned') ||
        lower.includes('granted') ||
        lower.includes('uploaded') ||
        lower.includes('copied') ||
        lower.includes('assigned')
      ) {
        type = 'success';
        if (title === 'ProCollege Notice') title = 'Success';
      } else if (
        lower.includes('deadline has passed') ||
        lower.includes('not permitted') ||
        lower.includes('cannot') ||
        lower.includes('limit reached') ||
        lower.includes('muted') ||
        lower.includes('closed') ||
        lower.includes('warning')
      ) {
        type = 'warning';
        if (title === 'ProCollege Notice') title = 'Notice';
      } else if (lower.includes('error') || lower.includes('failed')) {
        type = 'error';
        if (title === 'ProCollege Notice') title = 'Error';
      }
    }

    setDialog({
      isOpen: true,
      message,
      title,
      type,
      confirmText,
      cancelText,
      onConfirm,
      onCancel
    });
  }, []);

  useEffect(() => {
    // Intercept native browser alert to always use the in-screen dialogue box
    window.alert = (msg: string) => {
      showDialog(msg);
    };
  }, [showDialog]);

  const [meeting, setMeeting] = useState<MeetingState>({
    isOpen: false,
    title: '',
    courseCode: '',
    isMuted: false,
    isCameraOn: true,
    isScreenSharing: false,
    isHandRaised: false,
    participants: [],
    messages: []
  });

  const launchProduct = (productId: string) => {
    setViewMode('app');
    if (productId === 'teams') setActiveTab('teams');
    else if (productId === 'assignments') setActiveTab('assignments');
    else if (productId === 'files') setActiveTab('files');
    else if (productId === 'calendar') setActiveTab('calendar');
    else if (productId === 'admin') setActiveTab('admin');
    else setActiveTab('teams');
  };

  const updateUserLicense = (userId: string, license: LicenseSku) => {
    setAvailableUsers(prev => prev.map(u => (u.id === userId ? { ...u, license } : u)));
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, license }));
    }
  };

  const toggleUserMute = (userId: string) => {
    setAvailableUsers(prev => prev.map(u => (u.id === userId ? { ...u, isMuted: !u.isMuted } : u)));
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  };

  const updateUserPresence = (status: PresenceStatus) => {
    setCurrentUser(prev => ({ ...prev, status }));
    setAvailableUsers(prev =>
      prev.map(u => (u.id === currentUser.id ? { ...u, status } : u))
    );
  };

  const updateUserAvatar = (avatarUrl: string) => {
    setCurrentUser(prev => ({ ...prev, avatar: avatarUrl }));
    setAvailableUsers(prev =>
      prev.map(u => (u.id === currentUser.id ? { ...u, avatar: avatarUrl } : u))
    );
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
    if (user.institutionName) {
      setSelectedInstitution(user.institutionName);
    }
    if (user.role !== 'admin' && user.role !== 'developer' && activeTab === 'admin') {
      setActiveTab('teams');
    }
  };

  const logoutUser = () => {
    try {
      localStorage.removeItem('procollege_token');
      localStorage.removeItem('procollege_user');
      localStorage.removeItem('procollege_college');
    } catch {
      // ignore
    }
    setViewMode('portal');
  };

  // Phase 1 & 2: Activate Inactive (Locked) Team
  const activateCourse = (courseId: string) => {
    setCourses(prev =>
      prev.map(c => {
        if (c.id === courseId) {
          return { ...c, isActivated: true };
        }
        return c;
      })
    );
    if (selectedCourse.id === courseId) {
      setSelectedCourse(prev => ({ ...prev, isActivated: true }));
    }

    // Broadcast automated notification to students
    const newNotif: ActivityNotification = {
      id: `notif_${Date.now()}`,
      type: 'announcement',
      title: `${selectedCourse.code} is now Activated!`,
      detail: `${currentUser.name} has unlocked the Class Team for student access. Course materials are now viewable.`,
      timestamp: 'Just now',
      courseCode: selectedCourse.code,
      isRead: false,
      author: currentUser
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Phase 1: Provision Class Team
  const createCourse = (newCourse: CourseTeam) => {
    const inst = currentUser.institutionName || (selectedInstitution !== 'all' ? selectedInstitution : 'ProCollege University Network');
    const courseWithInst: CourseTeam = {
      ...newCourse,
      institutionName: newCourse.institutionName || inst
    };
    setCourses(prev => [...prev, courseWithInst]);
    setSelectedCourse(courseWithInst);
    if (courseWithInst.channels.length > 0) {
      setSelectedChannel(courseWithInst.channels[0]);
    }
  };

  const deleteCourse = (courseId: string) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
    if (selectedCourse.id === courseId) {
      const remaining = courses.filter(c => c.id !== courseId);
      if (remaining.length > 0) {
        setSelectedCourse(remaining[0]);
        setSelectedChannel(remaining[0].channels[0]);
      }
    }
  };

  const deleteChannel = (courseId: string, channelId: string) => {
    setCourses(prev =>
      prev.map(c => {
        if (c.id === courseId) {
          const updated = c.channels.filter(ch => ch.id !== channelId || ch.isGeneral);
          return { ...c, channels: updated };
        }
        return c;
      })
    );

    if (selectedCourse.id === courseId) {
      setSelectedCourse(prev => {
        const updated = prev.channels.filter(ch => ch.id !== channelId || ch.isGeneral);
        return { ...prev, channels: updated };
      });
      if (selectedChannel.id === channelId) {
        const fallback = selectedCourse.channels.find(ch => ch.id !== channelId) || selectedCourse.channels[0];
        if (fallback) setSelectedChannel(fallback);
      }
    }
  };

  // Add a new channel/subject to a course with an assigned subject teacher
  const addChannel = (
    courseId: string,
    channelData: { name: string; description: string; subjectLecturerName?: string; subjectLecturerId?: string }
  ) => {
    const newChanId = `ch_${Date.now()}`;
    const newChan: Channel = {
      id: newChanId,
      courseId,
      name: channelData.name.trim(),
      description: channelData.description.trim() || `Subject Channel: ${channelData.name}`,
      isGeneral: false,
      unreadCount: 0,
      studentFilePermission: 'read-only',
      subjectLecturerName: channelData.subjectLecturerName,
      subjectLecturerId: channelData.subjectLecturerId
    };

    setCourses(prev =>
      prev.map(c => {
        if (c.id === courseId) {
          return {
            ...c,
            channels: [...c.channels, newChan]
          };
        }
        return c;
      })
    );

    if (selectedCourse.id === courseId) {
      setSelectedCourse(prev => ({
        ...prev,
        channels: [...prev.channels, newChan]
      }));
    }

    setPosts(prev => ({ ...prev, [newChanId]: [] }));

    const targetCourse = courses.find(c => c.id === courseId);
    if (targetCourse) {
      const notif: ActivityNotification = {
        id: `notif_chan_${Date.now()}`,
        type: 'announcement',
        title: `New Subject Channel: ${channelData.name}`,
        detail: `A new subject channel was added to ${targetCourse.code} with lecturer ${channelData.subjectLecturerName || targetCourse.instructor.name}.`,
        timestamp: 'Just now',
        courseCode: targetCourse.code,
        channelId: newChanId,
        isRead: false,
        author: currentUser
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  // Enroll students to a course
  const enrollStudentsToCourse = (courseId: string, studentIds: string[]) => {
    const studentsToEnroll = availableUsers.filter(u => studentIds.includes(u.id));

    setCourses(prev =>
      prev.map(c => {
        if (c.id === courseId) {
          const currentEnrolled = c.enrolledStudents || [];
          const currentIds = new Set(currentEnrolled.map(s => s.id));
          const newlyAdded = studentsToEnroll.filter(s => !currentIds.has(s.id));
          const updatedEnrolled = [...currentEnrolled, ...newlyAdded];
          return {
            ...c,
            enrolledStudents: updatedEnrolled,
            memberCount: updatedEnrolled.length
          };
        }
        return c;
      })
    );

    if (selectedCourse.id === courseId) {
      setSelectedCourse(prev => {
        const currentEnrolled = prev.enrolledStudents || [];
        const currentIds = new Set(currentEnrolled.map(s => s.id));
        const newlyAdded = studentsToEnroll.filter(s => !currentIds.has(s.id));
        const updatedEnrolled = [...currentEnrolled, ...newlyAdded];
        return {
          ...prev,
          enrolledStudents: updatedEnrolled,
          memberCount: updatedEnrolled.length
        };
      });
    }
  };

  // Remove student from course
  const removeStudentFromCourse = (courseId: string, studentId: string) => {
    setCourses(prev =>
      prev.map(c => {
        if (c.id === courseId && c.enrolledStudents) {
          const updated = c.enrolledStudents.filter(s => s.id !== studentId);
          return {
            ...c,
            enrolledStudents: updated,
            memberCount: Math.max(1, updated.length)
          };
        }
        return c;
      })
    );
  };

  // Update a channel's dedicated lecturer
  const updateChannelLecturer = (courseId: string, channelId: string, lecturerId: string, lecturerName: string) => {
    setCourses(prev =>
      prev.map(c => {
        if (c.id === courseId) {
          return {
            ...c,
            channels: c.channels.map(ch =>
              ch.id === channelId ? { ...ch, subjectLecturerId: lecturerId, subjectLecturerName: lecturerName } : ch
            )
          };
        }
        return c;
      })
    );
  };

  // Rollover / Clone Course to Next Semester
  // Automatically keeps all enrolled students from the previous semester so admin doesn't have to re-enter them!
  const rolloverCourseToNextSemester = (
    sourceCourseId: string,
    data: {
      code: string;
      name: string;
      term: string;
      instructorId: string;
      channels: { name: string; description: string; subjectLecturerName?: string; subjectLecturerId?: string }[];
    }
  ): CourseTeam => {
    const source = courses.find(c => c.id === sourceCourseId);
    const leadLecturer = availableUsers.find(u => u.id === data.instructorId) || currentUser;
    const newCourseId = `course_rollover_${Date.now()}`;

    // Automatically carry over all enrolled students from source course!
    const carriedStudents = source?.enrolledStudents && source.enrolledStudents.length > 0
      ? [...source.enrolledStudents]
      : availableUsers.filter(u => u.role === 'student');

    // Create the channels for the new semester
    const newChannels: Channel[] = [
      {
        id: `ch_${newCourseId}_gen`,
        courseId: newCourseId,
        name: 'Announcements',
        description: `${data.name} Class announcements and notices from all lecturers`,
        isGeneral: true,
        unreadCount: 0,
        studentFilePermission: 'read-only'
      },
      ...data.channels.map((ch, idx) => ({
        id: `ch_${newCourseId}_${idx + 1}`,
        courseId: newCourseId,
        name: ch.name,
        description: ch.description || `Subject: ${ch.name}`,
        isGeneral: false,
        unreadCount: 0,
        studentFilePermission: 'read-only' as const,
        subjectLecturerName: ch.subjectLecturerName,
        subjectLecturerId: ch.subjectLecturerId
      }))
    ];

    const rolledCourse: CourseTeam = {
      id: newCourseId,
      code: data.code,
      name: data.name,
      department: source?.department || 'Computer Science',
      term: data.term,
      color: source?.color || '#0891b2',
      icon: source?.icon || '🏛️',
      instructor: leadLecturer,
      coOwners: source?.coOwners,
      memberCount: carriedStudents.length,
      enrolledStudents: carriedStudents,
      channels: newChannels,
      isActivated: true,
      model: source?.model || 'model-b',
      template: 'Class'
    };

    setCourses(prev => [...prev, rolledCourse]);
    setSelectedCourse(rolledCourse);
    setSelectedChannel(newChannels[0]);

    // Initialize posts for each new channel with a clean welcome announcement
    newChannels.forEach(ch => {
      setPosts(prev => ({
        ...prev,
        [ch.id]: [
          {
            id: `post_${ch.id}_welcome`,
            channelId: ch.id,
            author: leadLecturer,
            title: `Welcome to ${ch.name} - ${data.term}`,
            content: `Welcome students! This class has been rolled over for ${data.term}. Course materials, syllabus, and lecture schedules will be posted here.`,
            timestamp: 'Just now',
            isAnnouncement: true,
            isPinned: true,
            reactions: {},
            replies: []
          }
        ]
      }));
    });

    // Notify carried-over students
    const rolloverNotif: ActivityNotification = {
      id: `notif_rollover_${Date.now()}`,
      type: 'announcement',
      title: `Enrolled in ${data.code} (${data.term})`,
      detail: `Your class has completed the semester rollover into ${data.name}. You are automatically enrolled.`,
      timestamp: 'Just now',
      courseCode: data.code,
      channelId: newChannels[0].id,
      isRead: false,
      author: leadLecturer
    };
    setNotifications(prev => [rolloverNotif, ...prev]);

    return rolledCourse;
  };

  // Subject Channel Permission Toggle
  const toggleChannelFilePermission = (channelId: string, permission: 'read-only' | 'can-edit') => {
    setCourses(prev =>
      prev.map(c => ({
        ...c,
        channels: c.channels.map(ch => (ch.id === channelId ? { ...ch, studentFilePermission: permission } : ch))
      }))
    );
    if (selectedChannel.id === channelId) {
      setSelectedChannel(prev => ({ ...prev, studentFilePermission: permission }));
    }
  };

  // Posts & Reactions
  const addPost = (
    channelId: string,
    title: string,
    content: string,
    isAnnouncement = false,
    assignmentId?: string,
    category?: PostCategory
  ) => {
    if (currentUser.isMuted) {
      showDialog('You have been muted from posting by the College Administrator or Course Owner.', { type: 'warning', title: 'Muted Notice' });
      return;
    }

    const newPost: ThreadPost = {
      id: `post_${Date.now()}`,
      channelId,
      author: currentUser,
      title: title || undefined,
      content,
      isAnnouncement,
      category: category || (isAnnouncement ? 'general' : undefined),
      assignmentId,
      timestamp: 'Just now',
      reactions: {},
      replies: []
    };

    setPosts(prev => ({
      ...prev,
      [channelId]: [newPost, ...(prev[channelId] || [])]
    }));

    // Broadcast automated notification to students when administrator/lecturer publishes
    if (currentUser.role === 'professor' || currentUser.role === 'lecturer' || currentUser.role === 'admin') {
      const channelObj = selectedCourse.channels.find(c => c.id === channelId);
      const notifTitle = isAnnouncement
        ? `Class Announcement: ${selectedCourse.code}`
        : `New Post in ${selectedCourse.code} • ${channelObj?.name || 'Channel'}`;
      const newNotif: ActivityNotification = {
        id: `notif_${Date.now()}`,
        type: isAnnouncement ? 'announcement' : 'mention',
        title: notifTitle,
        detail: title ? `"${title}": ${content.substring(0, 90)}` : content.substring(0, 100),
        timestamp: 'Just now',
        courseCode: selectedCourse.code,
        channelId,
        isRead: false,
        author: currentUser
      };
      setNotifications(prev => [newNotif, ...prev]);

      // Sync announcement to live Turso notices table & Ably broadcast
      if (isAnnouncement || currentUser.role === 'admin' || currentUser.role === 'professor') {
        fetch('/api/notices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            college_id: 'padmashree-demo',
            title: title || `${selectedCourse.code} Announcement`,
            content: content,
            priority: isAnnouncement ? 'important' : 'normal',
            author_id: currentUser.id,
            author_name: currentUser.name,
          }),
        }).catch(() => {});
      }
    }
  };

  const addReply = (channelId: string, postId: string, content: string) => {
    if (currentUser.isMuted) {
      showDialog('You have been muted from posting by the College Administrator or Course Owner.', { type: 'warning', title: 'Muted Notice' });
      return;
    }

    const newReply = {
      id: `rep_${Date.now()}`,
      author: currentUser,
      content,
      timestamp: 'Just now',
      reactions: {}
    };

    setPosts(prev => ({
      ...prev,
      [channelId]: (prev[channelId] || []).map(p => {
        if (p.id === postId) {
          return { ...p, replies: [...p.replies, newReply] };
        }
        return p;
      })
    }));
  };

  const toggleReaction = (channelId: string, postId: string, emoji: string, replyId?: string) => {
    setPosts(prev => ({
      ...prev,
      [channelId]: (prev[channelId] || []).map(p => {
        if (p.id !== postId) return p;
        if (!replyId) {
          const userList = p.reactions[emoji] || [];
          const hasReacted = userList.includes(currentUser.name);
          const nextList = hasReacted ? userList.filter(u => u !== currentUser.name) : [...userList, currentUser.name];
          const nextReactions = { ...p.reactions, [emoji]: nextList };
          if (nextList.length === 0) delete nextReactions[emoji];
          return { ...p, reactions: nextReactions };
        } else {
          return {
            ...p,
            replies: p.replies.map(r => {
              if (r.id !== replyId) return r;
              const userList = r.reactions[emoji] || [];
              const hasReacted = userList.includes(currentUser.name);
              const nextList = hasReacted ? userList.filter(u => u !== currentUser.name) : [...userList, currentUser.name];
              const nextReactions = { ...r.reactions, [emoji]: nextList };
              if (nextList.length === 0) delete nextReactions[emoji];
              return { ...r, reactions: nextReactions };
            })
          };
        }
      })
    }));
  };

  // Direct Messages
  const sendDirectMessage = (convId: string, content: string) => {
    if (!content.trim()) return;
    const newMsg: DirectMessage = {
      id: `dm_${Date.now()}`,
      conversationId: convId,
      senderId: currentUser.id,
      content,
      timestamp: 'Just now',
      reactions: {}
    };
    setDirectMessages(prev => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMsg]
    }));
  };

  // ==========================================
  // ASSIGNMENTS ENGINE (Phase 2, 3, 4)
  // ==========================================

  // Phase 2: Create & Publish Assignment
  const createAssignment = (newAsgn: {
    courseId: string;
    courseCode: string;
    title: string;
    instructions: string;
    points: number;
    targetChannelId?: string;
    referenceMaterialMode: 'students-cant-edit' | 'students-edit-own-copy';
    referenceFiles?: { id: string; name: string; size: string; type: 'pdf' | 'doc' | 'code' | 'archive' | 'image' | 'ppt' }[];
    dueAt: string;
    closeAt?: string;
    isStrictNoLateSubmission?: boolean;
    rubric: RubricCriterion[];
  }) => {
    const asgnId = `asgn_${Date.now()}`;
    const targetChannel = newAsgn.targetChannelId || selectedCourse.channels[0].id;

    const fullAssignment: Assignment = {
      id: asgnId,
      courseId: newAsgn.courseId,
      courseCode: newAsgn.courseCode,
      title: newAsgn.title,
      instructions: newAsgn.instructions,
      points: newAsgn.points,
      targetChannelId: targetChannel,
      referenceMaterialMode: newAsgn.referenceMaterialMode,
      referenceFiles: (newAsgn.referenceFiles || []).map(f => ({
        ...f,
        isClassMaterial: true,
        permission: newAsgn.referenceMaterialMode === 'students-cant-edit' ? 'read-only' : 'editable'
      })),
      dueAt: newAsgn.dueAt,
      closeAt: newAsgn.closeAt || newAsgn.dueAt,
      isStrictNoLateSubmission: newAsgn.isStrictNoLateSubmission ?? false,
      rubric: newAsgn.rubric,
      submissions: []
    };

    setAssignments(prev => [fullAssignment, ...prev]);

    // Sync to live Turso assignments table
    fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: asgnId,
        college_id: 'padmashree-demo',
        section_id: 'sec-sem5-a',
        title: newAsgn.title,
        description: newAsgn.instructions,
        due_at: newAsgn.dueAt,
        max_points: newAsgn.points,
        created_by: currentUser.name,
      }),
    }).catch(() => {});

    // Channel Notification Routing: Post automated assignment card in target channel
    addPost(
      targetChannel,
      `📋 Assignment: ${newAsgn.title}`,
      `A new assignment has been posted for ${newAsgn.courseCode}.\n\n• Points: ${newAsgn.points} pts\n• Due: ${newAsgn.dueAt}\n• Hard Close: ${newAsgn.closeAt || newAsgn.dueAt}\n\nReview instructions in the Assignments tab.`,
      true,
      asgnId
    );

    // Synchronized Student Alert: Activity Bell notification
    const newNotif: ActivityNotification = {
      id: `notif_${Date.now()}`,
      type: 'assignment',
      title: `New Assignment in ${newAsgn.courseCode}`,
      detail: `"${newAsgn.title}" is due on ${newAsgn.dueAt}.`,
      timestamp: 'Just now',
      courseCode: newAsgn.courseCode,
      isRead: false,
      author: currentUser
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Phase 3: Audit Trail - Switch status from 'not-turned-in' to 'viewed' upon opening
  const markAssignmentViewed = (asgnId: string, studentId: string) => {
    setAssignments(prev =>
      prev.map(asgn => {
        if (asgn.id !== asgnId) return asgn;

        const existingSub = asgn.submissions.find(s => s.studentId === studentId);
        if (!existingSub) {
          const studentObj = availableUsers.find(u => u.id === studentId);
          const newSub = {
            studentId,
            studentName: studentObj?.name || 'Student',
            status: 'viewed' as const,
            viewedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
            files: []
          };
          return { ...asgn, submissions: [...asgn.submissions, newSub] };
        } else if (existingSub.status === 'not-turned-in') {
          return {
            ...asgn,
            submissions: asgn.submissions.map(s =>
              s.studentId === studentId
                ? {
                    ...s,
                    status: 'viewed' as const,
                    viewedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
                  }
                : s
            )
          };
        }
        return asgn;
      })
    );
  };

  // Phase 3: Attach Student Work (Private Sandbox - up to 10 files, 500MB)
  const attachStudentFile = (asgnId: string, studentId: string, file: SubmittedFile) => {
    setAssignments(prev =>
      prev.map(asgn => {
        if (asgn.id !== asgnId) return asgn;

        // Strict deadline enforcement: after deadline, no uploads allowed
        if (asgn.dueTimestamp && Date.now() > asgn.dueTimestamp) {
          showDialog('Deadline has passed. File uploads are closed.', { type: 'warning', title: 'Submission Closed' });
          return asgn;
        }

        const sub = asgn.submissions.find(s => s.studentId === studentId);
        if (sub) {
          if (sub.status === 'turned-in' || sub.status === 'turned-in-late' || sub.status === 'graded') {
            showDialog('Cannot attach files while turned in. Undo turn in first to replace or add files.', { type: 'warning', title: 'Submission Locked' });
            return asgn;
          }
          if (sub.files.length >= 10) {
            showDialog('Limit reached: Maximum 10 files per assignment.', { type: 'warning', title: 'Attachment Limit' });
            return asgn;
          }
          return {
            ...asgn,
            submissions: asgn.submissions.map(s =>
              s.studentId === studentId ? { ...s, files: [...s.files, file] } : s
            )
          };
        } else {
          const studentObj = availableUsers.find(u => u.id === studentId);
          return {
            ...asgn,
            submissions: [
              ...asgn.submissions,
              {
                studentId,
                studentName: studentObj?.name || 'Student',
                status: 'viewed',
                files: [file]
              }
            ]
          };
        }
      })
    );
  };

  const removeStudentFile = (asgnId: string, studentId: string, fileName: string) => {
    setAssignments(prev =>
      prev.map(asgn => {
        if (asgn.id !== asgnId) return asgn;

        // Strict deadline enforcement: after deadline, no deletions allowed
        if (asgn.dueTimestamp && Date.now() > asgn.dueTimestamp) {
          showDialog('Deadline has passed. Deleting files is not permitted.', { type: 'warning', title: 'File Deletion Locked' });
          return asgn;
        }

        return {
          ...asgn,
          submissions: asgn.submissions.map(s => {
            if (s.studentId === studentId && s.status !== 'turned-in' && s.status !== 'turned-in-late') {
              return { ...s, files: s.files.filter(f => f.name !== fileName) };
            }
            return s;
          })
        };
      })
    );
  };

  // Phase 3: "Turn In" Lock with Immutable Timestamp & Read-Only Lock
  const turnInAssignment = (asgnId: string, studentId: string, isLate = false): { success: boolean; message: string } => {
    const targetAsgn = assignments.find(a => a.id === asgnId);
    if (!targetAsgn) return { success: false, message: 'Assignment not found' };

    // Strict deadline check: cannot turn in if deadline has passed
    if (targetAsgn.dueTimestamp && Date.now() > targetAsgn.dueTimestamp) {
      return { success: false, message: 'The deadline for this assignment has passed. Submissions are closed.' };
    }

    const serverTimestamp = `Turned in ${new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    setAssignments(prev =>
      prev.map(asgn => {
        if (asgn.id !== asgnId) return asgn;

        return {
          ...asgn,
          submissions: asgn.submissions.map(s => {
            if (s.studentId === studentId) {
              return {
                ...s,
                status: isLate ? 'turned-in-late' : 'turned-in',
                submittedAt: serverTimestamp,
                fileName: s.files[0]?.name || `${s.studentName.replace(/\s+/g, '_')}_Submission.pdf`,
                fileSize: s.files[0]?.size || '1.8 MB',
                // Lock files to read-only upon submission
                files: s.files.map(f => ({ ...f, isReadOnly: true }))
              };
            }
            return s;
          })
        };
      })
    );

    // Sync submission with live Turso database
    fetch(`/api/assignments/${encodeURIComponent(asgnId)}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        student_name: currentUser.name,
        submission_text: `Turned in by ${currentUser.name}`,
        file_name: `${currentUser.name.replace(/\s+/g, '_')}_Submission.pdf`,
        file_size: '1.8 MB',
      }),
    }).catch(() => {});

    return { success: true, message: `Submission recorded: ${serverTimestamp}` };
  };

  // Phase 3: "Undo Turn In" Before Deadline
  const undoTurnIn = (asgnId: string, studentId: string): { success: boolean; message: string } => {
    const targetAsgn = assignments.find(a => a.id === asgnId);
    if (!targetAsgn) return { success: false, message: 'Assignment not found' };

    // Strict deadline check: cannot undo turn in after deadline
    if (targetAsgn.dueTimestamp && Date.now() > targetAsgn.dueTimestamp) {
      return { success: false, message: 'Cannot undo turn in after the deadline has passed.' };
    }

    setAssignments(prev =>
      prev.map(asgn => {
        if (asgn.id !== asgnId) return asgn;

        return {
          ...asgn,
          submissions: asgn.submissions.map(s => {
            if (s.studentId === studentId) {
              return {
                ...s,
                status: 'viewed',
                // Unlock files back to writable draft state
                files: s.files.map(f => ({ ...f, isReadOnly: false }))
              };
            }
            return s;
          })
        };
      })
    );

    return { success: true, message: 'Turn In undone. Draft unlocked for editing.' };
  };

  // Phase 4: SpeedGrader Return Action (Normal Return)
  const returnAssignment = (
    asgnId: string,
    studentId: string,
    grade: number,
    feedback: string,
    rubricScores?: Record<string, number>
  ) => {
    setAssignments(prev =>
      prev.map(asgn => {
        if (asgn.id !== asgnId) return asgn;

        return {
          ...asgn,
          submissions: asgn.submissions.map(s => {
            if (s.studentId === studentId) {
              return {
                ...s,
                status: 'returned',
                grade,
                feedback,
                rubricScores
              };
            }
            return s;
          })
        };
      })
    );

    // Notify student
    const studentUser = availableUsers.find(u => u.id === studentId);
    if (studentUser) {
      const notif: ActivityNotification = {
        id: `notif_${Date.now()}`,
        type: 'grade',
        title: `Grade Returned: ${grade} pts`,
        detail: `${currentUser.name} graded your work: "${feedback}"`,
        timestamp: 'Just now',
        isRead: false,
        author: currentUser
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  // Phase 4: Return for Revision (Individual Deadline Override)
  const returnForRevision = (asgnId: string, studentId: string, feedback: string) => {
    setAssignments(prev =>
      prev.map(asgn => {
        if (asgn.id !== asgnId) return asgn;

        return {
          ...asgn,
          submissions: asgn.submissions.map(s => {
            if (s.studentId === studentId) {
              return {
                ...s,
                status: 'revision-requested',
                feedback,
                revisionGranted: true,
                // Unlock student files for revision
                files: s.files.map(f => ({ ...f, isReadOnly: false }))
              };
            }
            return s;
          })
        };
      })
    );

    // Direct urgent notification with individual deadline override notice
    const notif: ActivityNotification = {
      id: `notif_${Date.now()}`,
      type: 'revision',
      title: 'Submission Re-Opened for Revision',
      detail: `${currentUser.name} granted an individual deadline override: "${feedback}"`,
      timestamp: 'Just now',
      isRead: false,
      author: currentUser
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // ==========================================
  // FILES REPOSITORY (Phase 2 & Read-Only)
  // ==========================================
  const uploadCourseFile = (file: Omit<CourseFile, 'id' | 'uploadedAt'>): { success: boolean; message: string } => {
    // Read-Only Enforcement for Students in Class Materials
    if (file.isClassMaterials && currentUser.role === 'student') {
      return {
        success: false,
        message: 'Permission Denied: The Class Materials directory is locked to Read-Only for students by SharePoint RBAC.'
      };
    }

    const newFile: CourseFile = {
      ...file,
      id: `file_${Date.now()}`,
      uploadedAt: 'Today'
    };

    setCourseFiles(prev => [newFile, ...prev]);

    // Broadcast automated notification to students when administrator/lecturer uploads materials
    if (currentUser.role === 'professor' || currentUser.role === 'lecturer' || currentUser.role === 'admin') {
      const targetCourse = courses.find(c => c.id === file.courseId);
      const notif: ActivityNotification = {
        id: `notif_${Date.now()}`,
        type: 'course_material',
        title: `New Course Material in ${targetCourse?.code || 'Course'}`,
        detail: `${currentUser.name} uploaded "${file.name}" to ${file.category}.`,
        timestamp: 'Just now',
        courseCode: targetCourse?.code,
        isRead: false,
        author: currentUser
      };
      setNotifications(prev => [notif, ...prev]);
    }

    return { success: true, message: `File "${file.name}" uploaded successfully.` };
  };

  const deleteCourseFile = (fileId: string): { success: boolean; message: string } => {
    const target = courseFiles.find(f => f.id === fileId);
    if (!target) return { success: false, message: 'File not found' };

    if (target.isClassMaterials && currentUser.role === 'student') {
      return {
        success: false,
        message: 'Permission Denied: Students cannot delete items from the Class Materials folder.'
      };
    }

    setCourseFiles(prev => prev.filter(f => f.id !== fileId));
    return { success: true, message: `Deleted ${target.name}` };
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Meeting controls
  const startMeeting = (title?: string, courseCode?: string) => {
    setMeeting({
      isOpen: true,
      title: title || `${selectedCourse.code}: Virtual Classroom`,
      courseCode: courseCode || selectedCourse.code,
      isMuted: false,
      isCameraOn: true,
      isScreenSharing: false,
      isHandRaised: false,
      participants: [currentUser, availableUsers[1], availableUsers[3]],
      messages: [
        { sender: 'System', text: 'Call started with end-to-end encryption.', time: 'Now' }
      ]
    });
  };

  const endMeeting = () => {
    setMeeting(prev => ({ ...prev, isOpen: false }));
  };

  const toggleMute = () => setMeeting(prev => ({ ...prev, isMuted: !prev.isMuted }));
  const toggleCamera = () => setMeeting(prev => ({ ...prev, isCameraOn: !prev.isCameraOn }));
  const toggleScreenShare = () => setMeeting(prev => ({ ...prev, isScreenSharing: !prev.isScreenSharing }));
  const toggleHand = () => setMeeting(prev => ({ ...prev, isHandRaised: !prev.isHandRaised }));

  const sendMeetingMessage = (text: string) => {
    if (!text.trim()) return;
    setMeeting(prev => ({
      ...prev,
      messages: [...prev.messages, { sender: currentUser.name, text, time: 'Now' }]
    }));
  };

  const resetDemoData = () => {
    setCourses(INITIAL_COURSES);
    setSelectedCourse(INITIAL_COURSES[0]);
    setSelectedChannel(INITIAL_COURSES[0].channels[0]);
    setPosts(INITIAL_POSTS);
    setAssignments(INITIAL_ASSIGNMENTS);
    setCourseFiles(INITIAL_FILES);
    setAvailableUsers(INITIAL_USERS);
    setDirectMessages(INITIAL_DIRECT_MESSAGES);
    setNotifications([
      {
        id: `notif_reset_${Date.now()}`,
        type: 'announcement',
        title: 'Demo Environment Reset',
        detail: 'All demo course data, messages, and submissions restored to factory defaults.',
        timestamp: 'Just now',
        isRead: false
      },
      ...INITIAL_NOTIFICATIONS
    ]);
  };

  const submitInstitutionalRequest = (reqData: Omit<InstitutionalRequest, 'id' | 'status' | 'submittedAt'>): string => {
    const newId = `req_${Date.now()}`;
    const newReq: InstitutionalRequest = {
      ...reqData,
      id: newId,
      status: 'pending',
      submittedAt: 'Just now'
    };
    setInstitutionalRequests(prev => [newReq, ...prev]);
    setNotifications(prev => [
      {
        id: `notif_req_${Date.now()}`,
        type: 'announcement',
        title: `Institutional Access Request: ${newReq.institutionName}`,
        detail: `${newReq.contactName} (${newReq.email}) submitted an onboarding request for ${newReq.studentCount} students.`,
        timestamp: 'Just now',
        isRead: false
      },
      ...prev
    ]);
    return newId;
  };

  const provisionInstitutionalRequest = (requestId: string) => {
    const req = institutionalRequests.find(r => r.id === requestId);
    const adminId = `ORG-ADMIN-${Math.floor(10 + Math.random() * 90)}`;
    const tempPass = `CampusKey-${Math.random().toString(36).substring(2, 8).toUpperCase()}!`;

    setInstitutionalRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'provisioned', assignedAdminId: adminId } : r))
    );

    if (req) {
      createInstitutionalAdmin({
        name: req.contactName,
        email: req.email,
        institutionName: req.institutionName,
        department: req.department,
        temporaryPassword: tempPass
      });
    }

    setNotifications(prev => [
      {
        id: `notif_prov_${Date.now()}`,
        type: 'announcement',
        title: `Organization Admin ID Issued: ${adminId} (${req?.institutionName || 'Campus'})`,
        detail: `Official tenant created for ${req?.institutionName || 'Institution'}. Login credentials active for ${req?.email || 'admin'}.`,
        timestamp: 'Just now',
        isRead: false
      },
      ...prev
    ]);

    return { adminId, tempPass };
  };

  const registerUserByAdmin = (userData: {
    name: string;
    email: string;
    role: 'student' | 'lecturer' | 'professor';
    department: string;
    license: LicenseSku;
  }): User => {
    const year = new Date().getFullYear();
    const isStudent = userData.role === 'student';
    const deptPrefix = (userData.department || 'GEN').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const loginId = isStudent ? `STU-${year}-${randomSuffix}` : `FAC-${deptPrefix}-${randomSuffix}`;
    const temporaryPassword = `ProCol-${Math.random().toString(36).substring(2, 8).toUpperCase()}!`;

    const avatarMap: Record<string, string> = {
      student: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      lecturer: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
      professor: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80'
    };

    const inst = currentUser.institutionName || (selectedInstitution !== 'all' ? selectedInstitution : 'ProCollege University Network');
    const newUser: User = {
      id: `user_${Date.now()}`,
      loginId,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      license: userData.license,
      department: userData.department,
      institutionName: inst,
      avatar: avatarMap[userData.role] || avatarMap.student,
      status: 'available',
      statusMessage: `${isStudent ? 'Student' : 'Faculty'} Account Active`,
      temporaryPassword,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setAvailableUsers(prev => [newUser, ...prev]);

    setNotifications(prev => [
      {
        id: `notif_user_${Date.now()}`,
        type: 'announcement',
        title: `Account Provisioned: ${newUser.name}`,
        detail: `Official Login ID ${loginId} assigned with ${newUser.license} for ${inst}.`,
        timestamp: 'Just now',
        isRead: false
      },
      ...prev
    ]);

    return newUser;
  };

  const createFaculty = (data: Omit<FacultyDepartment, 'id'>) => {
    const inst = currentUser.institutionName || (selectedInstitution !== 'all' ? selectedInstitution : 'ProCollege University Network');
    const newFac: FacultyDepartment = {
      ...data,
      institutionName: data.institutionName || inst,
      id: `fac_${Date.now()}`
    };
    setFaculties(prev => [...prev, newFac]);
  };

  const createInstitutionalAdmin = (data: { name: string; email: string; institutionName: string; department?: string; temporaryPassword?: string }) => {
    const newAdmin: User = {
      id: `user_admin_${Date.now()}`,
      loginId: `ORG-ADMIN-${Math.floor(1000 + Math.random() * 9000)}`,
      name: data.name,
      email: data.email,
      role: 'admin',
      license: 'Microsoft 365 A5 for Faculty',
      department: data.department || 'Chief Academic Operations',
      institutionName: data.institutionName,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
      status: 'available',
      statusMessage: `Admin for ${data.institutionName}`,
      isMuted: false,
      temporaryPassword: data.temporaryPassword || 'ProCollege#2026',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setAvailableUsers(prev => [newAdmin, ...prev]);

    // Automatically seed an initial Faculty for this institution if none exists yet
    const hasFac = faculties.some(f => f.institutionName === data.institutionName);
    if (!hasFac) {
      const defaultFac: FacultyDepartment = {
        id: `fac_${Date.now()}`,
        name: data.department ? `Faculty of ${data.department}` : 'Faculty of Computer Science & Information Technology',
        code: 'FCIT',
        deanId: newAdmin.id,
        deanName: newAdmin.name,
        institutionName: data.institutionName,
        description: `Official academic faculty for ${data.institutionName}.`
      };
      setFaculties(prev => [...prev, defaultFac]);
    }

    return newAdmin;
  };

  // Multi-Tenant Isolation Derivations
  const allInstitutions = useMemo(() => {
    const set = new Set<string>();
    courses.forEach(c => { if (c.institutionName) set.add(c.institutionName); });
    faculties.forEach(f => { if (f.institutionName) set.add(f.institutionName); });
    availableUsers.forEach(u => { if (u.institutionName) set.add(u.institutionName); });
    institutionalRequests.forEach(r => { if (r.institutionName) set.add(r.institutionName); });
    set.add('ProCollege University Network');
    return Array.from(set);
  }, [courses, faculties, availableUsers, institutionalRequests]);

  const activeInstitution = useMemo(() => {
    if (currentUser.role === 'developer') {
      return selectedInstitution;
    }
    return currentUser.institutionName || 'ProCollege University Network';
  }, [currentUser.role, currentUser.institutionName, selectedInstitution]);

  const tenantCourses = useMemo(() => {
    if (currentUser.role === 'developer' && selectedInstitution === 'all') {
      return courses;
    }
    return courses.filter(c => (c.institutionName || 'ProCollege University Network') === activeInstitution);
  }, [courses, currentUser.role, selectedInstitution, activeInstitution]);

  const tenantFaculties = useMemo(() => {
    if (currentUser.role === 'developer' && selectedInstitution === 'all') {
      return faculties;
    }
    return faculties.filter(f => (f.institutionName || 'ProCollege University Network') === activeInstitution);
  }, [faculties, currentUser.role, selectedInstitution, activeInstitution]);

  const tenantUsers = useMemo(() => {
    if (currentUser.role === 'developer' && selectedInstitution === 'all') {
      return availableUsers;
    }
    return availableUsers.filter(u => u.role === 'developer' || (u.institutionName || 'ProCollege University Network') === activeInstitution);
  }, [availableUsers, currentUser.role, selectedInstitution, activeInstitution]);

  // Keep selectedCourse in sync when switching institution or tenant
  useEffect(() => {
    if (tenantCourses.length > 0) {
      if (!tenantCourses.some((c: CourseTeam) => c.id === selectedCourse.id)) {
        setSelectedCourse(tenantCourses[0]);
        if (tenantCourses[0].channels.length > 0) {
          setSelectedChannel(tenantCourses[0].channels[0]);
        }
      }
    }
  }, [tenantCourses, selectedCourse.id]);

  return (
    <AppContext.Provider
      value={{
        viewMode,
        setViewMode,
        launchProduct,

        currentUser,
        setCurrentUser: switchUser,
        availableUsers: tenantUsers,
        updateUserLicense,
        toggleUserMute,
        updateUserPresence,
        updateUserAvatar,
        logoutUser,

        activeTab,
        setActiveTab,

        courses: tenantCourses,
        selectedCourse,
        setSelectedCourse,
        activateCourse,
        createCourse,
        deleteCourse,
        addChannel,
        deleteChannel,
        enrollStudentsToCourse,
        removeStudentFromCourse,
        updateChannelLecturer,
        rolloverCourseToNextSemester,

        selectedChannel,
        setSelectedChannel,
        channelTab,
        setChannelTab,
        toggleChannelFilePermission,

        posts,
        addPost,
        addReply,
        toggleReaction,

        conversations,
        selectedConversation,
        setSelectedConversation,
        directMessages,
        sendDirectMessage,

        assignments,
        createAssignment,
        markAssignmentViewed,
        attachStudentFile,
        removeStudentFile,
        turnInAssignment,
        undoTurnIn,
        returnAssignment,
        returnForRevision,

        calendarEvents,
        addCalendarEvent,
        courseFiles,
        uploadCourseFile,
        deleteCourseFile,

        notifications,
        markNotificationsAsRead,

        meeting,
        startMeeting,
        endMeeting,
        toggleMute,
        toggleCamera,
        toggleScreenShare,
        toggleHand,
        sendMeetingMessage,

        searchQuery,
        setSearchQuery,

        isDemoMode,
        setIsDemoMode,
        resetDemoData,

        mobileSidebarOpen,
        setMobileSidebarOpen,

        institutionalRequests,
        submitInstitutionalRequest,
        provisionInstitutionalRequest,
        registerUserByAdmin,

        faculties: tenantFaculties,
        createFaculty,
        createInstitutionalAdmin,

        selectedInstitution,
        setSelectedInstitution,
        allInstitutions,

        dialog,
        showDialog,
        closeDialog
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
