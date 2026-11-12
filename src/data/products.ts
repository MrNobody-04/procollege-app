import type { ProductItem } from '../types/products';

export const PROCOLLEGE_PRODUCTS: ProductItem[] = [
  {
    id: 'teams',
    name: 'ProCollege Teams',
    shortName: 'Teams',
    tagline: 'Collaborative Classrooms, Channels & Real-Time Messaging',
    description: 'Empower students and faculty to communicate seamlessly with threaded class discussions, announcement banners, reactions, and direct chats.',
    iconName: 'Users',
    category: 'collaboration',
    status: 'active',
    badge: 'Core App',
    color: '#5b5fc7',
    linkText: 'Launch Teams',
    features: [
      'Organized Course Teams & Channels',
      'Threaded discussions with rich markdown',
      'Instant direct & group student-professor chat',
      'Role-based permissions & presence indicators'
    ]
  },
  {
    id: 'meet',
    name: 'ProCollege Meet',
    shortName: 'Meet',
    tagline: 'HD WebRTC Live Classrooms & Virtual Seminars',
    description: 'Ultra low-latency video lectures, presentation screen sharing, raised hand queue, interactive floating emoji reactions, and live in-meeting chat.',
    iconName: 'Video',
    category: 'collaboration',
    status: 'active',
    badge: '1080p HD',
    color: '#0ea5e9',
    linkText: 'Launch Meet',
    features: [
      'WebRTC peer-to-peer and SFU video conferencing',
      'Code editor & slide presentation sharing',
      'Real-time raised hand queue & active speaker focus',
      'Auto-transcription & recording archive'
    ]
  },
  {
    id: 'assignments',
    name: 'ProCollege Assignments & LMS',
    shortName: 'Assignments',
    tagline: 'Homework Submissions, Rubrics & Grading Ledger',
    description: 'Streamline coursework distribution, student PDF/code solution turn-in, weighted rubrics, and professor feedback scoring.',
    iconName: 'FileCheck',
    category: 'learning',
    status: 'active',
    badge: 'LMS',
    color: '#10b981',
    linkText: 'Open Assignments',
    features: [
      'Due date tracking with status badges',
      'One-click student solution submission',
      'Detailed grading rubrics & professor feedback',
      'Automated weighted gradebook ledger'
    ]
  },
  {
    id: 'drive',
    name: 'ProCollege Cloud Drive',
    shortName: 'Drive',
    tagline: 'Centralized Campus Courseware & Document Storage',
    description: 'Secure university cloud repository storing lecture decks, laboratory manuals, reference PDFs, and research datasets with download/preview.',
    iconName: 'FolderOpen',
    category: 'productivity',
    status: 'active',
    color: '#8b5cf6',
    linkText: 'Explore Files',
    features: [
      'Course-specific document categories',
      'Encrypted cloud storage & fast downloads',
      'Direct integration with class channel files',
      'Versioned lecture slide archives'
    ]
  },
  {
    id: 'copilot',
    name: 'ProCollege AI Copilot',
    shortName: 'Copilot',
    tagline: 'AI Teaching Assistant & Lecture Synthesizer',
    description: 'Instant answers to syllabus questions, automated code debugging, lecture summary generation, and personalized study guides.',
    iconName: 'Sparkles',
    category: 'intelligence',
    status: 'beta',
    badge: 'AI Powered',
    color: '#ec4899',
    linkText: 'Join Beta Waitlist',
    features: [
      'Instant Q&A grounded in course syllabus',
      'Algorithmic code review & test generation',
      'Automated lecture note summarization',
      'Smart flashcard generation from class slides'
    ]
  },
  {
    id: 'exams',
    name: 'ProCollege Proctored Exams',
    shortName: 'Exams',
    tagline: 'Secure Online Assessments & Code Sandbox',
    description: 'High-integrity testing environment with timed assessments, automated grading test suites, and tamper-resistant exam monitoring.',
    iconName: 'Award',
    category: 'learning',
    status: 'coming-soon',
    badge: 'Coming Soon',
    color: '#f59e0b',
    linkText: 'Learn More',
    features: [
      'Timed midterm & final examination modules',
      'Built-in sandboxed coding IDE for programming exams',
      'Automated unit-test scoring engine',
      'Plagiarism and submission verification'
    ]
  }
];
