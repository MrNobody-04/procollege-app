import type {
  User,
  CourseTeam,
  ThreadPost,
  DirectMessage,
  Conversation,
  Assignment,
  CalendarEvent,
  CourseFile,
  ActivityNotification,
  InstitutionalRequest,
  FacultyDepartment
} from '../types';

export const INITIAL_FACULTIES: FacultyDepartment[] = [
  {
    id: 'fac_cs',
    name: 'Faculty of Computer Science & Engineering',
    code: 'FCSE',
    deanId: 'user_alan',
    deanName: 'Prof. Alan Turing',
    institutionName: 'ProCollege University Network',
    description: 'Algorithms, Software Architecture, Operating Systems & Distributed Infrastructure',
    isDemo: true
  },
  {
    id: 'fac_ai',
    name: 'Faculty of Artificial Intelligence & Data Science',
    code: 'FAIDS',
    deanId: 'user_feifei',
    deanName: 'Dr. Fei-Fei Li',
    institutionName: 'ProCollege University Network',
    description: 'Neural Networks, Computer Vision, Foundation Models & Deep Learning',
    isDemo: true
  },
  {
    id: 'fac_phys',
    name: 'Faculty of Applied Sciences & Quantum Physics',
    code: 'FASQP',
    deanId: 'user_feynman',
    deanName: 'Dr. Richard Feynman',
    institutionName: 'ProCollege University Network',
    description: 'Quantum Mechanics, Electromagnetism & Applied Computational Physics',
    isDemo: true
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user_alan',
    loginId: 'FAC-CS-301',
    name: 'Prof. Alan Turing',
    email: 'a.turing@procollege.edu',
    role: 'professor',
    license: 'ProCollege Verified for Faculty',
    department: 'Computer Science & Engineering',
    institutionName: 'ProCollege University Network',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    status: 'available',
    statusMessage: 'Office Hours: Tue/Thu 2-4 PM',
    isMuted: false,
    createdAt: '2026-09-10',
    isDemo: true
  },
  {
    id: 'user_org_admin',
    loginId: 'ORG-ADMIN-01',
    name: 'Dr. Margaret Hamilton',
    email: 'admin@procollege.edu',
    role: 'admin',
    license: 'ProCollege Verified for Faculty',
    department: 'Chief Academic IT Operations',
    institutionName: 'ProCollege University Network',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
    status: 'available',
    statusMessage: 'Organization Admin · Identity & User Provisioning',
    isMuted: false,
    createdAt: '2026-09-01',
    isDemo: true
  },
  {
    id: 'user_alex',
    loginId: 'STU-2026-0842',
    name: 'Alex Johnson',
    email: 'alex.j@student.procollege.edu',
    role: 'student',
    license: 'ProCollege Verified for Students',
    department: 'Computer Science (Class of 2027)',
    institutionName: 'ProCollege University Network',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
    status: 'available',
    statusMessage: 'Studying for CS301 Midterm',
    isMuted: false,
    createdAt: '2026-09-15',
    isDemo: true
  },
  {
    id: 'user_feifei',
    loginId: 'FAC-AI-204',
    name: 'Dr. Fei-Fei Li',
    email: 'f.li@procollege.edu',
    role: 'professor',
    license: 'ProCollege Verified for Faculty',
    department: 'Artificial Intelligence & Vision Lab',
    institutionName: 'ProCollege University Network',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    status: 'in-call',
    statusMessage: 'Keynote at Vision Summit',
    isMuted: false,
    createdAt: '2026-09-10',
    isDemo: true
  },
  {
    id: 'user_feynman',
    loginId: 'FAC-PHYS-210',
    name: 'Dr. Richard Feynman',
    email: 'r.feynman@procollege.edu',
    role: 'professor',
    license: 'ProCollege Verified for Faculty',
    department: 'Physics & Applied Sciences',
    institutionName: 'ProCollege University Network',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    status: 'busy',
    statusMessage: 'Quantum Lab Experiments in progress',
    isMuted: false,
    createdAt: '2026-09-10',
    isDemo: true
  },
  {
    id: 'user_sophia',
    loginId: 'STU-2026-1193',
    name: 'Sophia Chen',
    email: 'sophia.c@student.procollege.edu',
    role: 'student',
    license: 'ProCollege Verified for Students',
    department: 'Electrical Engineering & CS',
    institutionName: 'ProCollege University Network',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
    status: 'available',
    statusMessage: 'Working on capstone hardware test',
    isMuted: false,
    createdAt: '2026-09-15',
    isDemo: true
  },
  {
    id: 'user_elena',
    loginId: 'TA-CS-004',
    name: 'Elena Rostova (TA)',
    email: 'elena.r@procollege.edu',
    role: 'ta',
    license: 'ProCollege Verified for Faculty',
    department: 'Computer Science (Graduate TA)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    status: 'away',
    statusMessage: 'Grading Assignment 2, back at 5 PM',
    isMuted: false,
    isDemo: true
  },
  {
    id: 'user_marcus',
    loginId: 'STU-2026-1402',
    name: 'Marcus Aurelius',
    email: 'marcus.a@student.procollege.edu',
    role: 'student',
    license: 'ProCollege Verified for Students',
    department: 'Computer Science',
    institutionName: 'ProCollege University Network',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    status: 'available',
    isMuted: false,
    createdAt: '2026-09-15',
    isDemo: true
  },
  {
    id: 'user_devon',
    loginId: 'STU-2026-1589',
    name: 'Devon Vance',
    email: 'devon.v@student.procollege.edu',
    role: 'student',
    license: 'ProCollege Verified for Students',
    department: 'Computer Science',
    institutionName: 'ProCollege University Network',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
    status: 'offline',
    isMuted: false,
    createdAt: '2026-09-15',
    isDemo: true
  },
  {
    id: 'user_priya',
    loginId: 'STU-2026-1733',
    name: 'Priya Patel',
    email: 'priya.p@student.procollege.edu',
    role: 'student',
    license: 'ProCollege Verified for Students',
    department: 'Computer Science',
    institutionName: 'ProCollege University Network',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    status: 'available',
    isMuted: false,
    createdAt: '2026-09-15',
    isDemo: true
  }
];

export const INITIAL_COURSES: CourseTeam[] = [
  {
    id: 'course_cs301',
    code: 'CS 301',
    name: 'Advanced Algorithms & Complexity',
    department: 'Computer Science',
    institutionName: 'ProCollege University Network',
    facultyId: 'fac_cs',
    term: 'Fall 2026',
    color: '#4f46e5',
    icon: '⚡',
    instructor: INITIAL_USERS[1],
    memberCount: 68,
    isActivated: true,
    model: 'model-a',
    template: 'Class',
    isDemo: true,
    enrolledStudents: [
      INITIAL_USERS[2], // Alex Johnson
      INITIAL_USERS[5], // Sophia Chen
      {
        id: 'user_marcus',
        loginId: 'STU-2026-1402',
        name: 'Marcus Aurelius',
        email: 'marcus.a@student.procollege.edu',
        role: 'student',
        license: 'ProCollege Verified for Students',
        department: 'Computer Science',
        institutionName: 'ProCollege University Network',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
        status: 'available'
      },
      {
        id: 'user_priya',
        loginId: 'STU-2026-1733',
        name: 'Priya Patel',
        email: 'priya.p@student.procollege.edu',
        role: 'student',
        license: 'ProCollege Verified for Students',
        department: 'Computer Science',
        institutionName: 'ProCollege University Network',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        status: 'available'
      }
    ],
    channels: [
      { id: 'ch_cs301_gen', courseId: 'course_cs301', name: 'Announcements', description: 'Class-wide notices, exam schedules, and alerts from all lecturers', isGeneral: true, unreadCount: 2, studentFilePermission: 'read-only' },
      { id: 'ch_cs301_lec', courseId: 'course_cs301', name: 'Weekly Lectures', description: 'Slide decks, lecture recordings, and Q&A', isGeneral: false, unreadCount: 0, studentFilePermission: 'read-only', subjectLecturerName: 'Prof. Alan Turing', subjectLecturerId: 'user_alan' },
      { id: 'ch_cs301_proj', courseId: 'course_cs301', name: 'Final Project', description: 'Team formations, progress updates, and code reviews', isGeneral: false, unreadCount: 1, studentFilePermission: 'can-edit', subjectLecturerName: 'Prof. Alan Turing', subjectLecturerId: 'user_alan' },
      { id: 'ch_cs301_help', courseId: 'course_cs301', name: 'Office Hours & Helpdesk', description: 'Ask questions to Professor Turing and TA Elena', isGeneral: false, unreadCount: 0, studentFilePermission: 'can-edit', subjectLecturerName: 'Elena Rostova (TA)', subjectLecturerId: 'user_elena' }
    ]
  },
  {
    id: 'course_cohort_cs',
    code: 'B.Sc. CS 2026',
    name: 'B.Sc. Computer Science - Semester 3 (Section A)',
    department: 'School of Computing',
    institutionName: 'ProCollege University Network',
    facultyId: 'fac_cs',
    term: 'Academic Year 2026-2027',
    color: '#0891b2',
    icon: '🏛️',
    instructor: INITIAL_USERS[1],
    coOwners: [INITIAL_USERS[2], INITIAL_USERS[3]],
    memberCount: 75,
    isActivated: true,
    model: 'model-b',
    template: 'Class',
    isDemo: true,
    enrolledStudents: [
      INITIAL_USERS[2], // Alex Johnson
      INITIAL_USERS[5], // Sophia Chen
      {
        id: 'user_marcus',
        loginId: 'STU-2026-1402',
        name: 'Marcus Aurelius',
        email: 'marcus.a@student.procollege.edu',
        role: 'student',
        license: 'ProCollege Verified for Students',
        department: 'Computer Science',
        institutionName: 'ProCollege University Network',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
        status: 'available'
      },
      {
        id: 'user_devon',
        loginId: 'STU-2026-1589',
        name: 'Devon Vance',
        email: 'devon.v@student.procollege.edu',
        role: 'student',
        license: 'ProCollege Verified for Students',
        department: 'Computer Science',
        institutionName: 'ProCollege University Network',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
        status: 'offline'
      },
      {
        id: 'user_priya',
        loginId: 'STU-2026-1733',
        name: 'Priya Patel',
        email: 'priya.p@student.procollege.edu',
        role: 'student',
        license: 'ProCollege Verified for Students',
        department: 'Computer Science',
        institutionName: 'ProCollege University Network',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        status: 'available'
      }
    ],
    channels: [
      { id: 'ch_cohort_gen', courseId: 'course_cohort_cs', name: 'Announcements', description: 'Cohort announcement noticeboard where all lecturers broadcast notices and schedules', isGeneral: true, unreadCount: 0, studentFilePermission: 'read-only' },
      { id: 'ch_cohort_os', courseId: 'course_cohort_cs', name: 'Operating Systems', description: 'Subject Channel: Dr. Fei-Fei Li (Processes, Virtual Memory, Kernel Syscalls)', isGeneral: false, unreadCount: 3, studentFilePermission: 'read-only', subjectLecturerName: 'Dr. Fei-Fei Li', subjectLecturerId: 'user_feifei' },
      { id: 'ch_cohort_net', courseId: 'course_cohort_cs', name: 'Computer Networks', description: 'Subject Channel: Prof. Alan Turing (TCP/IP, Routing Protocols, Sockets)', isGeneral: false, unreadCount: 1, studentFilePermission: 'read-only', subjectLecturerName: 'Prof. Alan Turing', subjectLecturerId: 'user_alan' },
      { id: 'ch_cohort_db', courseId: 'course_cohort_cs', name: 'Database Systems', description: 'Subject Channel: Dr. Richard Feynman (ACID, Relational Algebra, B-Trees)', isGeneral: false, unreadCount: 0, studentFilePermission: 'read-only', subjectLecturerName: 'Dr. Richard Feynman', subjectLecturerId: 'user_feynman' }
    ]
  },
  {
    id: 'course_ds204',
    code: 'DS 204',
    name: 'Deep Learning & Neural Networks',
    department: 'Artificial Intelligence',
    institutionName: 'ProCollege University Network',
    facultyId: 'fac_ai',
    term: 'Fall 2026',
    color: '#059669',
    icon: '🧠',
    instructor: INITIAL_USERS[2],
    memberCount: 54,
    isActivated: true,
    model: 'model-a',
    template: 'Class',
    isDemo: true,
    channels: [
      { id: 'ch_ds204_gen', courseId: 'course_ds204', name: 'Announcements', description: 'Class notices, foundation updates, and lab schedules from all lecturers', isGeneral: true, unreadCount: 0, studentFilePermission: 'read-only' },
      { id: 'ch_ds204_labs', courseId: 'course_ds204', name: 'GPU Cluster Labs', description: 'Slurm and PyTorch multi-node training scripts', isGeneral: false, unreadCount: 0, studentFilePermission: 'can-edit', subjectLecturerName: 'Dr. Fei-Fei Li', subjectLecturerId: 'user_feifei' }
    ]
  },
  {
    id: 'course_phys210',
    code: 'PHYS 210',
    name: 'Quantum Mechanics & Modern Physics',
    department: 'Physics',
    institutionName: 'ProCollege University Network',
    facultyId: 'fac_phys',
    term: 'Fall 2026',
    color: '#d97706',
    icon: '⚛️',
    instructor: INITIAL_USERS[3],
    memberCount: 42,
    isActivated: true,
    model: 'model-a',
    template: 'Class',
    isDemo: true,
    channels: [
      { id: 'ch_phys210_gen', courseId: 'course_phys210', name: 'Announcements', description: 'Class notices, syllabus updates, and lab schedules from all lecturers', isGeneral: true, unreadCount: 0, studentFilePermission: 'read-only' },
      { id: 'ch_phys210_lab', courseId: 'course_phys210', name: 'Experimental Lab', description: 'Apparatus calibration and lab reports', isGeneral: false, unreadCount: 0, studentFilePermission: 'can-edit', subjectLecturerName: 'Dr. Richard Feynman', subjectLecturerId: 'user_feynman' }
    ]
  }
];

export const INITIAL_POSTS: Record<string, ThreadPost[]> = {
  ch_cs301_gen: [
    {
      id: 'post_1',
      channelId: 'ch_cs301_gen',
      author: INITIAL_USERS[1],
      title: 'Welcome to CS 301: Advanced Algorithms & Complexity',
      content: 'Welcome students. All course lecture notes, reading packets, and problem sheets have been placed in the Class Materials folder. Submissions will follow our deadlines.',
      isAnnouncement: false,
      timestamp: 'Today at 09:30 AM',
      pinned: true,
      reactions: { '👍': ['Alex Johnson', 'Sophia Chen'] },
      replies: [
        {
          id: 'rep_1',
          author: INITIAL_USERS[0],
          content: 'Thank you Professor! Will lecture slides also be uploaded directly after each Tuesday session?',
          timestamp: 'Today at 09:45 AM',
          reactions: {}
        },
        {
          id: 'rep_2',
          author: INITIAL_USERS[1],
          content: 'Yes Alex, slides will be added to the Class Materials folder right after lecture.',
          timestamp: 'Today at 09:50 AM',
          reactions: {}
        }
      ],
      attachments: [
        {
          id: 'att_1',
          name: 'CS301_Complete_Syllabus_2026.pdf',
          type: 'pdf',
          size: '1.4 MB',
          isClassMaterial: true,
          permission: 'read-only'
        }
      ]
    }
  ],
  ch_cohort_os: [
    {
      id: 'post_os_1',
      channelId: 'ch_cohort_os',
      author: INITIAL_USERS[2],
      title: 'Operating Systems: Virtual Memory & Page Tables',
      content: 'This week we cover multi-level page tables and TLB caching. Please review the starter code in the files section before lab.',
      isAnnouncement: false,
      timestamp: 'Yesterday at 2:00 PM',
      reactions: { '👍': ['Alex Johnson'] },
      replies: []
    }
  ],
  ch_cohort_net: [
    {
      id: 'post_net_1',
      channelId: 'ch_cohort_net',
      author: INITIAL_USERS[1],
      title: 'TCP Congestion Control & Sliding Window',
      content: 'Please review RFC 5681 before tomorrow morning. We will demonstrate TCP Reno vs BBR captures.',
      timestamp: '2 days ago',
      reactions: {},
      replies: []
    }
  ]
};

// Current local time: Nov 12, 2026 ~ 7:30 PM (timestamp approx 1794500000000)
// Future deadlines: Nov 20, Nov 25 (timestamp > current)
// Past deadlines: Nov 05, Nov 02 (timestamp < current)
export const INITIAL_ASSIGNMENTS: Assignment[] = [
  // 1. PENDING (To Do) - Future deadline, not turned in yet (CS 301 - Weekly Lectures)
  {
    id: 'asgn_pending',
    institutionName: 'ProCollege University Network',
    facultyId: 'fac_cs',
    courseId: 'course_cs301',
    courseCode: 'CS 301',
    channelId: 'ch_cs301_lec',
    targetChannelId: 'ch_cs301_lec',
    subjectName: 'Weekly Lectures',
    createdByEmail: 'a.turing@procollege.edu',
    title: 'Problem Set 5: Dynamic Programming on Trees',
    instructions: 'Complete problems 1 through 4. Prove the optimal substructure and implement memoized recurrence relations for weighted tree independent sets. Attach your written PDF before the due date.',
    points: 100,
    referenceMaterialMode: 'students-cant-edit',
    referenceFiles: [
      {
        id: 'ref_ps5',
        name: 'PS5_Tree_DP_Specification.pdf',
        type: 'pdf',
        size: '1.1 MB',
        isClassMaterial: true,
        permission: 'read-only'
      }
    ],
    dueAt: 'Nov 20, 2026, 11:59 PM',
    dueTimestamp: 1795219140000, // Future!
    closeAt: 'Nov 20, 2026, 11:59 PM',
    isStrictNoLateSubmission: true,
    rubric: [
      { id: 'r1', criterion: 'Proof of optimal substructure', maxPoints: 50 },
      { id: 'r2', criterion: 'Asymptotic complexity verification', maxPoints: 30 },
      { id: 'r3', criterion: 'Written clarity and LaTeX format', maxPoints: 20 }
    ],
    submissions: [
      {
        studentId: 'user_alex',
        studentName: 'Alex Johnson',
        status: 'not-turned-in',
        files: []
      }
    ]
  },

  // 2. COMPLETED (Turned in before deadline - CS 301 - Weekly Lectures)
  {
    id: 'asgn_completed_replaceable',
    institutionName: 'ProCollege University Network',
    facultyId: 'fac_cs',
    courseId: 'course_cs301',
    courseCode: 'CS 301',
    channelId: 'ch_cs301_lec',
    targetChannelId: 'ch_cs301_lec',
    subjectName: 'Weekly Lectures',
    createdByEmail: 'a.turing@procollege.edu',
    title: 'Problem Set 4: Network Flow & Bipartite Matching',
    instructions: 'Implement push-relabel algorithm and benchmark against bipartite graph matching datasets. Submit your code and typed proof report. You may replace or revise your files until the deadline expires.',
    points: 100,
    referenceMaterialMode: 'students-cant-edit',
    referenceFiles: [
      {
        id: 'ref_ps4',
        name: 'PS4_Question_Paper_Official.pdf',
        type: 'pdf',
        size: '1.2 MB',
        isClassMaterial: true,
        permission: 'read-only'
      }
    ],
    dueAt: 'Nov 24, 2026, 11:59 PM',
    dueTimestamp: 1795564740000, // Future! Still before deadline
    closeAt: 'Nov 24, 2026, 11:59 PM',
    isStrictNoLateSubmission: true,
    rubric: [
      { id: 'r1', criterion: 'Push-relabel implementation', maxPoints: 50 },
      { id: 'r2', criterion: 'Benchmark results on SNAP dataset', maxPoints: 30 },
      { id: 'r3', criterion: 'Complexity proof', maxPoints: 20 }
    ],
    submissions: [
      {
        studentId: 'user_alex',
        studentName: 'Alex Johnson',
        status: 'turned-in',
        viewedAt: 'Nov 12, 2026, 09:15 AM',
        submittedAt: 'Nov 12, 2026, 03:45 PM',
        fileName: 'CS301_PS4_AlexJohnson_Solution.pdf',
        fileSize: '1.8 MB',
        files: [
          { name: 'CS301_PS4_AlexJohnson_Solution.pdf', size: '1.8 MB', type: 'pdf', isReadOnly: true, uploadedAt: 'Nov 12, 2026, 03:44 PM' },
          { name: 'push_relabel_benchmark.cpp', size: '42 KB', type: 'code', isReadOnly: true, uploadedAt: 'Nov 12, 2026, 03:45 PM' }
        ]
      }
    ]
  },

  // 3. DUE DATE PASSED - CS 301 - Final Project
  {
    id: 'asgn_due_passed',
    institutionName: 'ProCollege University Network',
    facultyId: 'fac_cs',
    courseId: 'course_cs301',
    courseCode: 'CS 301',
    channelId: 'ch_cs301_proj',
    targetChannelId: 'ch_cs301_proj',
    subjectName: 'Final Project',
    createdByEmail: 'a.turing@procollege.edu',
    title: 'Lab 1: Asymptotic Graph Traversal & DFS Profiling',
    instructions: 'Profile DFS and BFS on dense graphs with Valgrind and Callgrind. All submissions had to be received before the cutoff date.',
    points: 100,
    referenceMaterialMode: 'students-cant-edit',
    referenceFiles: [
      {
        id: 'ref_lab1',
        name: 'Lab1_Profiling_Guide.pdf',
        type: 'pdf',
        size: '800 KB',
        permission: 'read-only'
      }
    ],
    dueAt: 'Nov 05, 2026, 11:59 PM',
    dueTimestamp: 1793923140000, // Past! Due date has passed
    closeAt: 'Nov 05, 2026, 11:59 PM',
    isStrictNoLateSubmission: true,
    rubric: [
      { id: 'r1', criterion: 'Profiling report accuracy', maxPoints: 60 },
      { id: 'r2', criterion: 'Memory leak checks', maxPoints: 40 }
    ],
    submissions: [
      {
        studentId: 'user_alex',
        studentName: 'Alex Johnson',
        status: 'not-turned-in',
        files: []
      }
    ]
  },

  // 4. COMPLETED & GRADED - Cohort B.Sc. CS 2026 - Operating Systems
  {
    id: 'asgn_graded',
    institutionName: 'ProCollege University Network',
    facultyId: 'fac_cs',
    courseId: 'course_cohort_cs',
    courseCode: 'B.Sc. CS 2026',
    channelId: 'ch_cohort_os',
    targetChannelId: 'ch_cohort_os',
    subjectName: 'Operating Systems',
    createdByEmail: 'f.li@procollege.edu',
    title: 'OS Lab 1: Linux Process Forking & Inter-Process Pipes',
    instructions: 'Implement a command-line pipeline in C supporting stdin/stdout redirection and concurrent pipe execution.',
    points: 100,
    referenceMaterialMode: 'students-cant-edit',
    referenceFiles: [
      {
        id: 'ref_os_1',
        name: 'OS_Lab1_Specification.pdf',
        type: 'pdf',
        size: '1.4 MB',
        permission: 'read-only'
      }
    ],
    dueAt: 'Nov 02, 2026, 05:00 PM',
    dueTimestamp: 1793667600000, // Past!
    closeAt: 'Nov 02, 2026, 05:00 PM',
    isStrictNoLateSubmission: true,
    rubric: [
      { id: 'r1', criterion: 'Pipeline execution correctness', maxPoints: 50 },
      { id: 'r2', criterion: 'Signal handling and zombie prevention', maxPoints: 30 },
      { id: 'r3', criterion: 'Clean code & comments', maxPoints: 20 }
    ],
    submissions: [
      {
        studentId: 'user_alex',
        studentName: 'Alex Johnson',
        status: 'graded',
        submittedAt: 'Nov 02, 2026, 03:15 PM',
        grade: 95,
        feedback: 'Dr. Fei-Fei Li: Clean pipe handling and good zombie prevention with waitpid.',
        fileName: 'IPC_Pipes_Solution.c',
        fileSize: '14 KB',
        files: [
          { name: 'IPC_Pipes_Solution.c', size: '14 KB', type: 'code', isReadOnly: true, uploadedAt: 'Nov 02, 2026, 03:15 PM' }
        ]
      }
    ]
  },

  // 5. Cohort B.Sc. CS 2026 - Computer Networks
  {
    id: 'asgn_net_1',
    institutionName: 'ProCollege University Network',
    facultyId: 'fac_cs',
    courseId: 'course_cohort_cs',
    courseCode: 'B.Sc. CS 2026',
    channelId: 'ch_cohort_net',
    targetChannelId: 'ch_cohort_net',
    subjectName: 'Computer Networks',
    createdByEmail: 'a.turing@procollege.edu',
    title: 'Socket Programming: Multi-Threaded HTTP Web Server',
    instructions: 'Design and implement an asynchronous multi-threaded TCP web server in C/C++ handling concurrent HTTP GET requests and binary file streaming.',
    points: 100,
    referenceMaterialMode: 'students-cant-edit',
    referenceFiles: [
      {
        id: 'ref_net_1',
        name: 'RFC2616_HTTP_Specification.pdf',
        type: 'pdf',
        size: '950 KB',
        permission: 'read-only'
      }
    ],
    dueAt: 'Nov 28, 2026, 11:59 PM',
    dueTimestamp: 1795910340000,
    closeAt: 'Nov 28, 2026, 11:59 PM',
    isStrictNoLateSubmission: true,
    rubric: [
      { id: 'r1', criterion: 'TCP Socket bind and concurrency', maxPoints: 50 },
      { id: 'r2', criterion: 'HTTP protocol parser correctness', maxPoints: 30 },
      { id: 'r3', criterion: 'Stress test throughput', maxPoints: 20 }
    ],
    submissions: []
  },

  // 6. Cohort B.Sc. CS 2026 - Database Systems
  {
    id: 'asgn_db_1',
    institutionName: 'ProCollege University Network',
    facultyId: 'fac_cs',
    courseId: 'course_cohort_cs',
    courseCode: 'B.Sc. CS 2026',
    channelId: 'ch_cohort_db',
    targetChannelId: 'ch_cohort_db',
    subjectName: 'Database Systems',
    createdByEmail: 'r.feynman@procollege.edu',
    title: 'Database Assignment 1: B+ Tree Concurrency & WAL Logging',
    instructions: 'Implement write-ahead logging (WAL) and 2-phase locking concurrency protocols for crash-safe B+ tree indexes under concurrent workloads.',
    points: 100,
    referenceMaterialMode: 'students-cant-edit',
    referenceFiles: [
      {
        id: 'ref_db_1',
        name: 'ARIES_Recovery_Algorithm.pdf',
        type: 'pdf',
        size: '1.6 MB',
        permission: 'read-only'
      }
    ],
    dueAt: 'Nov 30, 2026, 11:59 PM',
    dueTimestamp: 1796083140000,
    closeAt: 'Nov 30, 2026, 11:59 PM',
    isStrictNoLateSubmission: true,
    rubric: [
      { id: 'r1', criterion: 'WAL log record serialization and replay', maxPoints: 50 },
      { id: 'r2', criterion: '2PL latch acquisition and deadlock handling', maxPoints: 30 },
      { id: 'r3', criterion: 'Crash recovery unit tests', maxPoints: 20 }
    ],
    submissions: []
  }
];

export const INITIAL_DIRECT_MESSAGES: Record<string, DirectMessage[]> = {
  conv_alex_alan: [
    {
      id: 'dm_1',
      conversationId: 'conv_alex_alan',
      senderId: 'user_alex',
      content: 'Good morning Professor Turing, do you have a few minutes after lecture today to discuss my independent study proposal?',
      timestamp: '10:14 AM',
      reactions: {}
    },
    {
      id: 'dm_2',
      conversationId: 'conv_alex_alan',
      senderId: 'user_alan',
      content: 'Good morning Alex. Absolutely. Stop by my office at 11:30 AM or we can start a quick Teams call right here.',
      timestamp: '10:18 AM',
      reactions: { '👍': ['Alex Johnson'] }
    }
  ]
};

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_alex_alan',
    type: 'direct',
    participants: [INITIAL_USERS[1], INITIAL_USERS[0]],
    lastMessage: 'Good morning Alex. Absolutely. Stop by my office at 11:30 AM...',
    lastMessageTime: '10:18 AM',
    unreadCount: 0
  }
];

export const INITIAL_SCHEDULE: CalendarEvent[] = [
  // Monday
  {
    id: 'evt_1',
    courseId: 'course_cs301',
    courseCode: 'CS 301',
    title: 'CS 301 Lecture: Dynamic Graph Connectivity',
    instructorName: 'Prof. Alan Turing',
    day: 'Mon',
    dateStr: 'Nov 16',
    startTime: '10:00 AM',
    endTime: '11:30 AM',
    location: 'Turing Hall 101',
    isVirtual: true,
    meetingLink: 'procollege://meet/cs301-lecture'
  },
  {
    id: 'evt_mon_2',
    courseId: 'course_cohort_cs',
    courseCode: 'B.Sc. CS 2026',
    title: 'Computer Networks: Socket Programming & TCP',
    instructorName: 'Prof. Andrew Ng',
    day: 'Mon',
    dateStr: 'Nov 16',
    startTime: '01:00 PM',
    endTime: '02:30 PM',
    location: 'Networking Lab 2',
    isVirtual: false
  },
  {
    id: 'evt_mon_3',
    courseId: 'course_cohort_cs',
    courseCode: 'B.Sc. CS 2026',
    title: 'Database Systems: B-Tree Indexing & Query Tuning',
    instructorName: 'Prof. Barbara Liskov',
    day: 'Mon',
    dateStr: 'Nov 16',
    startTime: '03:00 PM',
    endTime: '04:30 PM',
    location: 'Lab 302',
    isVirtual: true,
    meetingLink: 'procollege://meet/db-tuning'
  },

  // Tuesday
  {
    id: 'evt_tue_1',
    courseId: 'course_ds204',
    courseCode: 'DS 204',
    title: 'Deep Learning: Convolutional Networks & Vision',
    instructorName: 'Prof. Geoffrey Hinton',
    day: 'Tue',
    dateStr: 'Nov 17',
    startTime: '09:30 AM',
    endTime: '11:00 AM',
    location: 'Turing Hall 102',
    isVirtual: true,
    meetingLink: 'procollege://meet/ds204-vision'
  },
  {
    id: 'evt_2',
    courseId: 'course_cohort_cs',
    courseCode: 'B.Sc. CS 2026',
    title: 'Operating Systems: Paging & Virtual Memory',
    instructorName: 'Dr. Fei-Fei Li',
    day: 'Tue',
    dateStr: 'Nov 17',
    startTime: '01:00 PM',
    endTime: '03:00 PM',
    location: 'Auditorium B',
    isVirtual: true,
    meetingLink: 'procollege://meet/os-paging'
  },
  {
    id: 'evt_tue_3',
    courseId: 'course_cs301',
    courseCode: 'CS 301',
    title: 'Algorithms Recitation & Problem Solving',
    instructorName: 'Elena Rostova (TA)',
    day: 'Tue',
    dateStr: 'Nov 17',
    startTime: '03:30 PM',
    endTime: '05:00 PM',
    location: 'Seminar Room 4',
    isVirtual: false
  },

  // Wednesday
  {
    id: 'evt_wed_1',
    courseId: 'course_cs301',
    courseCode: 'CS 301',
    title: 'CS 301 Lecture: Network Flow & Edmonds-Karp',
    instructorName: 'Prof. Alan Turing',
    day: 'Wed',
    dateStr: 'Nov 18',
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    location: 'Turing Hall 101',
    isVirtual: true,
    meetingLink: 'procollege://meet/cs301-network-flow'
  },
  {
    id: 'evt_wed_2',
    courseId: 'course_cohort_cs',
    courseCode: 'B.Sc. CS 2026',
    title: 'Operating Systems: Concurrency & Semaphores',
    instructorName: 'Dr. Fei-Fei Li',
    day: 'Wed',
    dateStr: 'Nov 18',
    startTime: '11:00 AM',
    endTime: '12:30 PM',
    location: 'Auditorium B',
    isVirtual: false
  },
  {
    id: 'evt_wed_3',
    courseId: 'course_phys210',
    courseCode: 'PHYS 210',
    title: 'Modern Physics: Wave-Particle Duality & Hilbert Spaces',
    instructorName: 'Dr. Richard Feynman',
    day: 'Wed',
    dateStr: 'Nov 18',
    startTime: '02:00 PM',
    endTime: '03:30 PM',
    location: 'Science Hall A',
    isVirtual: false
  },
  {
    id: 'evt_wed_4',
    courseId: 'course_cs301',
    courseCode: 'CS 301',
    title: 'Office Hours & Academic Advising',
    instructorName: 'Prof. Alan Turing',
    day: 'Wed',
    dateStr: 'Nov 18',
    startTime: '04:00 PM',
    endTime: '05:00 PM',
    location: 'Faculty Office 410 / Teams',
    isVirtual: true,
    meetingLink: 'procollege://meet/turing-office-hours'
  },

  // Thursday
  {
    id: 'evt_thu_1',
    courseId: 'course_cohort_cs',
    courseCode: 'B.Sc. CS 2026',
    title: 'Computer Networks: Wireshark Packet Analysis Lab',
    instructorName: 'Prof. Andrew Ng',
    day: 'Thu',
    dateStr: 'Nov 19',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    location: 'Networking Lab 2',
    isVirtual: false
  },
  {
    id: 'evt_thu_2',
    courseId: 'course_ds204',
    courseCode: 'DS 204',
    title: 'PyTorch Distributed GPU Cluster Workshop',
    instructorName: 'Prof. Geoffrey Hinton',
    day: 'Thu',
    dateStr: 'Nov 19',
    startTime: '01:30 PM',
    endTime: '03:30 PM',
    location: 'AI Cluster Lab 4',
    isVirtual: true,
    meetingLink: 'procollege://meet/ds204-pytorch-lab'
  },
  {
    id: 'evt_thu_3',
    courseId: 'course_cohort_cs',
    courseCode: 'B.Sc. CS 2026',
    title: 'Database Systems: Normalization & ACID Transactions',
    instructorName: 'Prof. Barbara Liskov',
    day: 'Thu',
    dateStr: 'Nov 19',
    startTime: '04:00 PM',
    endTime: '05:00 PM',
    location: 'Room 108',
    isVirtual: false
  },

  // Friday
  {
    id: 'evt_fri_1',
    courseId: 'course_cs301',
    courseCode: 'CS 301',
    title: 'CS 301 Research Seminar: P vs NP & Intractability',
    instructorName: 'Prof. Alan Turing',
    day: 'Fri',
    dateStr: 'Nov 20',
    startTime: '09:30 AM',
    endTime: '11:00 AM',
    location: 'Turing Hall 101',
    isVirtual: true,
    meetingLink: 'procollege://meet/cs301-p-np'
  },
  {
    id: 'evt_fri_2',
    courseId: 'course_cohort_cs',
    courseCode: 'B.Sc. CS 2026',
    title: 'Capstone Project Milestone Sync & Code Review',
    instructorName: 'Dr. Fei-Fei Li',
    day: 'Fri',
    dateStr: 'Nov 20',
    startTime: '11:30 AM',
    endTime: '01:00 PM',
    location: 'Innovation Hub 3',
    isVirtual: false
  },
  {
    id: 'evt_fri_3',
    courseId: 'course_phys210',
    courseCode: 'PHYS 210',
    title: 'Quantum Mechanics: Harmonic Oscillators Lab',
    instructorName: 'Dr. Richard Feynman',
    day: 'Fri',
    dateStr: 'Nov 20',
    startTime: '02:30 PM',
    endTime: '04:00 PM',
    location: 'Science Hall A',
    isVirtual: false
  }
];

export const INITIAL_FILES: CourseFile[] = [
  {
    id: 'file_cm_1',
    courseId: 'course_cs301',
    channelId: 'ch_cs301_gen',
    institutionName: 'ProCollege University Network',
    name: 'CS301_Complete_Syllabus_2026.pdf',
    category: 'Class Materials',
    size: '1.4 MB',
    uploadedAt: 'Sep 2, 2026',
    uploadedBy: 'Prof. Alan Turing',
    uploadedByRole: 'professor',
    isClassMaterials: true,
    permission: 'read-only',
    isDemo: true
  },
  {
    id: 'file_cm_2',
    courseId: 'course_cs301',
    channelId: 'ch_cs301_gen',
    institutionName: 'ProCollege University Network',
    name: 'Lecture01_Amortized_Analysis.pdf',
    category: 'Class Materials',
    size: '4.8 MB',
    uploadedAt: 'Sep 5, 2026',
    uploadedBy: 'Prof. Alan Turing',
    uploadedByRole: 'professor',
    isClassMaterials: true,
    permission: 'read-only',
    isDemo: true
  },
  {
    id: 'file_cm_3',
    courseId: 'course_cs301',
    channelId: 'ch_cs301_gen',
    institutionName: 'ProCollege University Network',
    name: 'Lecture02_Fibonacci_Heaps.pdf',
    category: 'Class Materials',
    size: '3.9 MB',
    uploadedAt: 'Sep 12, 2026',
    uploadedBy: 'Prof. Alan Turing',
    uploadedByRole: 'professor',
    isClassMaterials: true,
    permission: 'read-only',
    isDemo: true
  },
  {
    id: 'file_collab_1',
    courseId: 'course_cs301',
    channelId: 'ch_cs301_proj',
    institutionName: 'ProCollege University Network',
    name: 'Group_Project_Collaboration_Notes.docx',
    category: 'Subject Files',
    size: '320 KB',
    uploadedAt: 'Oct 14, 2026',
    uploadedBy: 'Alex Johnson',
    uploadedByRole: 'student',
    isClassMaterials: false,
    permission: 'can-edit',
    isPrivate: true, // Private student file - hidden from global public repository
    isDemo: true
  },
  {
    id: 'file_os_1',
    courseId: 'course_cohort_cs',
    channelId: 'ch_cohort_os',
    institutionName: 'ProCollege University Network',
    name: 'OS_Kernel_Architecture_Guide.pdf',
    category: 'Class Materials',
    size: '2.7 MB',
    uploadedAt: 'Sep 15, 2026',
    uploadedBy: 'Dr. Fei-Fei Li',
    uploadedByRole: 'professor',
    isClassMaterials: true,
    permission: 'read-only',
    isDemo: true
  },
  {
    id: 'file_net_1',
    courseId: 'course_cohort_cs',
    channelId: 'ch_cohort_net',
    institutionName: 'ProCollege University Network',
    name: 'Socket_Programming_Lab_Manual.pdf',
    category: 'Class Materials',
    size: '1.9 MB',
    uploadedAt: 'Sep 20, 2026',
    uploadedBy: 'Prof. Alan Turing',
    uploadedByRole: 'professor',
    isClassMaterials: true,
    permission: 'read-only',
    isDemo: true
  },
  {
    id: 'file_db_1',
    courseId: 'course_cohort_cs',
    channelId: 'ch_cohort_db',
    institutionName: 'ProCollege University Network',
    name: 'Relational_Algebra_Cheatsheet.pdf',
    category: 'Class Materials',
    size: '890 KB',
    uploadedAt: 'Sep 25, 2026',
    uploadedBy: 'Dr. Richard Feynman',
    uploadedByRole: 'professor',
    isClassMaterials: true,
    permission: 'read-only',
    isDemo: true
  },
  {
    id: 'file_ds_1',
    courseId: 'course_ds204',
    channelId: 'ch_ds204_gen',
    institutionName: 'ProCollege University Network',
    name: 'Deep_Learning_PyTorch_Setup.docx',
    category: 'Subject Files',
    size: '450 KB',
    uploadedAt: 'Oct 02, 2026',
    uploadedBy: 'Dr. Margaret Hamilton',
    uploadedByRole: 'admin',
    isClassMaterials: false,
    permission: 'can-edit',
    isDemo: true
  }
];

export const INITIAL_NOTIFICATIONS: ActivityNotification[] = [
  {
    id: 'notif_1',
    type: 'announcement',
    title: 'Announcement in CS 301',
    detail: 'Prof. Alan Turing posted course materials for review.',
    timestamp: '1 hour ago',
    courseCode: 'CS 301',
    isRead: false,
    author: INITIAL_USERS[1]
  },
  {
    id: 'notif_2',
    type: 'assignment',
    title: 'Assignment Posted: Problem Set 5',
    detail: 'Due on Nov 20, 2026, 11:59 PM.',
    timestamp: '2 hours ago',
    courseCode: 'CS 301',
    isRead: false,
    author: INITIAL_USERS[1]
  }
];

export const INITIAL_INSTITUTIONAL_REQUESTS: InstitutionalRequest[] = [];
