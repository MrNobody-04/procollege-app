import React, { useState } from 'react';
import {
  Users,
  Layers,
  CheckCircle2,
  Plus,
  Sliders,
  VolumeX,
  Volume2,
  Trash2,
  School,
  Building2,
  UserPlus,
  GraduationCap,
  Repeat,
  BookOpen,
  UserCheck,
  Search,
  ExternalLink,
  Sparkles,
  Building,
  Key,
  FolderTree,
  Megaphone,
  ClipboardList
} from 'lucide-react';
import { ProCollegeLogo } from './ProCollegeLogo';
import { useApp } from '../context/AppContext';
import type { LicenseSku, CourseTeam, DeploymentModel, Channel, User, InstitutionalRequest } from '../types';

export const AdminCenterView: React.FC = () => {
  const {
    currentUser,
    availableUsers,
    updateUserLicense,
    toggleUserMute,
    courses,
    createCourse,
    deleteCourse,
    institutionalRequests,
    provisionInstitutionalRequest,
    registerUserByAdmin,
    addChannel,
    deleteChannel,
    enrollStudentsToCourse,
    removeStudentFromCourse,
    rolloverCourseToNextSemester,
    setActiveTab,
    setSelectedCourse,
    setSelectedChannel,
    showDialog,
    addPost,
    faculties,
    createFaculty,
    createInstitutionalAdmin,
    selectedInstitution,
    setSelectedInstitution,
    allInstitutions
  } = useApp();

  const isDeveloper = currentUser.role === 'developer';

  // Primary Tab - Classes, Faculties, Users, Developer Requests, and Roles
  const [activeAdminTab, setActiveAdminTab] = useState<'classes' | 'faculties' | 'users' | 'requests' | 'roles'>('classes');
  const [searchClassQuery, setSearchClassQuery] = useState('');

  // Modals
  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const [showRolloverModal, setShowRolloverModal] = useState(false);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [showManageStudentsModal, setShowManageStudentsModal] = useState(false);
  const [showRegisterUserModal, setShowRegisterUserModal] = useState(false);
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [selectedCourseForAction, setSelectedCourseForAction] = useState<CourseTeam | null>(null);

  // New Faculty Modal Form State
  const [newFacultyName, setNewFacultyName] = useState('');
  const [newFacultyCode, setNewFacultyCode] = useState('');
  const [newFacultyDeanId, setNewFacultyDeanId] = useState(availableUsers[1]?.id || availableUsers[0]?.id);
  const [newFacultyDesc, setNewFacultyDesc] = useState('');

  // Developer Direct Institutional Admin Modal State
  const [newAdminInstitution, setNewAdminInstitution] = useState('');
  const [newAdminContact, setNewAdminContact] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('+1 (555) 234-5678');
  const [newAdminDept, setNewAdminDept] = useState('Academic Operations & Engineering');

  // New User Registration Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'lecturer' | 'professor'>('student');
  const [newUserLicense, setNewUserLicense] = useState<LicenseSku>('Microsoft 365 A3 for Students');
  const [createdCredentials, setCreatedCredentials] = useState<{ user: User; password?: string } | null>(null);

  // New Class Form State (with Faculty Selector)
  const [selectedFacultyId, setSelectedFacultyId] = useState(faculties[0]?.id || 'fac_cs');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [term, setTerm] = useState('Fall 2026');
  const [model] = useState<DeploymentModel>('model-b');
  const [instructorId, setInstructorId] = useState(availableUsers[1]?.id || availableUsers[0]?.id);
  const [newClassSubjects, setNewClassSubjects] = useState<{ name: string; code: string; description: string; lecturerId: string }[]>([
    { name: 'Operating Systems', code: 'CS-302', description: 'Processes, Memory & Syscalls', lecturerId: availableUsers[3]?.id || availableUsers[1]?.id },
    { name: 'Computer Networks', code: 'CS-304', description: 'TCP/IP, Routing & Sockets', lecturerId: availableUsers[1]?.id },
    { name: 'Database Systems', code: 'CS-305', description: 'Relational Models & SQL', lecturerId: availableUsers[4]?.id || availableUsers[1]?.id }
  ]);
  const [selectedStudentIdsToEnroll, setSelectedStudentIdsToEnroll] = useState<string[]>(
    availableUsers.filter(u => u.role === 'student').map(s => s.id)
  );

  // Rollover Form State
  const [rolloverSourceCourseId, setRolloverSourceCourseId] = useState<string>('');
  const [rolloverNewCode, setRolloverNewCode] = useState('B.Sc. CS 2027');
  const [rolloverNewName, setRolloverNewName] = useState('B.Sc. Computer Science - Semester 4 (Section A)');
  const [rolloverNewTerm, setRolloverNewTerm] = useState('Spring 2027');
  const [rolloverLeadInstructorId, setRolloverLeadInstructorId] = useState(availableUsers[1]?.id || availableUsers[0]?.id);
  const [rolloverSubjects, setRolloverSubjects] = useState<{ name: string; description: string; lecturerId: string }[]>([
    { name: 'Compiler Design', description: 'Lexical analysis & parsing', lecturerId: availableUsers[1]?.id },
    { name: 'Software Engineering', description: 'Agile architectures & design patterns', lecturerId: availableUsers[3]?.id || availableUsers[1]?.id },
    { name: 'Web Technologies', description: 'Distributed client-server applications', lecturerId: availableUsers[4]?.id || availableUsers[1]?.id },
    { name: 'Artificial Intelligence', description: 'Search, heuristics & neural nets', lecturerId: availableUsers[3]?.id || availableUsers[1]?.id }
  ]);

  // Add Subject Channel Form State
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelLecturerId, setNewChannelLecturerId] = useState(availableUsers[1]?.id || availableUsers[0]?.id);

  // Manage Students Form State
  const [studentsToAddToClass, setStudentsToAddToClass] = useState<string[]>([]);

  // Faculty Filter in Tab 1
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string>('all');

  // Batch / Preset Subjects Library State
  const [showBatchPasteInput, setShowBatchPasteInput] = useState<boolean>(false);
  const [batchPasteText, setBatchPasteText] = useState<string>('');

  const SUBJECT_BLOCK_PRESETS = [
    {
      name: 'Computer Science Core',
      short: 'CS Block (4)',
      subjects: [
        { name: 'Operating Systems', code: 'CS-302', description: 'Processes, Memory Management & Syscalls' },
        { name: 'Computer Networks', code: 'CS-304', description: 'TCP/IP, Routing Protocols & Sockets' },
        { name: 'Database Systems', code: 'CS-305', description: 'Relational Algebra, SQL & Indexing' },
        { name: 'Algorithms & Complexity', code: 'CS-301', description: 'Graph algorithms, NP-completeness & dynamic programming' }
      ]
    },
    {
      name: 'AI & Data Science',
      short: 'AI / DS Block (4)',
      subjects: [
        { name: 'Machine Learning', code: 'AI-401', description: 'Supervised/Unsupervised models & Scikit-Learn' },
        { name: 'Deep Learning & Neural Networks', code: 'AI-402', description: 'PyTorch, CNNs, Transformers & Backprop' },
        { name: 'Big Data Analytics', code: 'DS-403', description: 'Distributed data pipelines, Spark & SQL' },
        { name: 'Natural Language Processing', code: 'AI-405', description: 'Text representations, LLMs & Tokenization' }
      ]
    },
    {
      name: 'Software Engineering',
      short: 'SE Block (4)',
      subjects: [
        { name: 'Software Architecture & Design', code: 'SE-301', description: 'Design patterns, Microservices & Clean Code' },
        { name: 'Cloud Computing & DevOps', code: 'SE-302', description: 'Docker, Kubernetes, CI/CD & Terraform' },
        { name: 'Modern Web Technologies', code: 'SE-303', description: 'Full-stack client/server, REST & GraphQL' },
        { name: 'Software Testing & QA', code: 'SE-304', description: 'Unit testing, TDD, CI automation & QA' }
      ]
    },
    {
      name: 'Business & Management',
      short: 'Business Block (3)',
      subjects: [
        { name: 'Financial Accounting & Reporting', code: 'BUS-201', description: 'Ledgers, Cash flows & Financial Analysis' },
        { name: 'Organizational Behavior', code: 'BUS-202', description: 'Leadership, Team Dynamics & Communication' },
        { name: 'Strategic Management & Marketing', code: 'BUS-203', description: 'Market research, Positioning & Product Strategy' }
      ]
    }
  ];

  const handleApplyPresetBlock = (presetIndex: number, mode: 'append' | 'replace' = 'append') => {
    const preset = SUBJECT_BLOCK_PRESETS[presetIndex];
    if (!preset) return;
    const defaultTeacherId = availableUsers.find(u => u.role === 'professor' || u.role === 'lecturer')?.id || availableUsers[1]?.id || availableUsers[0]?.id;
    const mapped = preset.subjects.map(s => ({
      name: s.name,
      code: s.code,
      description: s.description,
      lecturerId: defaultTeacherId
    }));

    if (mode === 'replace') {
      setNewClassSubjects(mapped);
    } else {
      setNewClassSubjects(prev => [...prev, ...mapped]);
    }
  };

  const handleApplyBatchPaste = (mode: 'append' | 'replace' = 'append') => {
    if (!batchPasteText.trim()) return;
    const defaultTeacherId = availableUsers.find(u => u.role === 'professor' || u.role === 'lecturer')?.id || availableUsers[1]?.id || availableUsers[0]?.id;
    const lines = batchPasteText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed = lines.map((line, idx) => {
      let name = line;
      let code = '';
      if (line.includes(',')) {
        const parts = line.split(',');
        name = parts[0]?.trim() || `Subject ${idx + 1}`;
        code = parts[1]?.trim() || '';
      } else if (line.includes(' - ')) {
        const parts = line.split(' - ');
        name = parts[0]?.trim() || `Subject ${idx + 1}`;
        code = parts[1]?.trim() || '';
      }
      return {
        name,
        code,
        description: `Subject: ${name}${code ? ` (${code})` : ''}`,
        lecturerId: defaultTeacherId
      };
    });

    if (mode === 'replace') {
      setNewClassSubjects(parsed);
    } else {
      setNewClassSubjects(prev => [...prev, ...parsed]);
    }
    setBatchPasteText('');
    setShowBatchPasteInput(false);
  };

  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const registered = registerUserByAdmin({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      department: 'Computer Science & Engineering',
      license: newUserLicense
    });

    setCreatedCredentials({
      user: registered,
      password: registered.temporaryPassword
    });

    setNewUserName('');
    setNewUserEmail('');
  };

  const handleProvisionOrgAdmin = (req: InstitutionalRequest) => {
    const creds = provisionInstitutionalRequest(req.id);
    showDialog(`Institutional request for ${req.institutionName} approved! Assigned Admin ID: ${creds.adminId}`, { type: 'success', title: 'Request Approved' });
  };

  // Open Semester Rollover Modal for a specific course
  const openRolloverForCourse = (course: CourseTeam) => {
    setSelectedCourseForAction(course);
    setRolloverSourceCourseId(course.id);

    // Auto-generate next semester name
    if (course.name.includes('Semester 3')) {
      setRolloverNewName(course.name.replace('Semester 3', 'Semester 4'));
      setRolloverNewCode('B.Sc. CS 2027');
      setRolloverNewTerm('Spring 2027');
    } else if (course.name.includes('Semester 1')) {
      setRolloverNewName(course.name.replace('Semester 1', 'Semester 2'));
      setRolloverNewCode(`${course.code}-S2`);
      setRolloverNewTerm('Spring 2027');
    } else {
      setRolloverNewName(`${course.name} - Next Semester`);
      setRolloverNewCode(`${course.code}-NEXT`);
      setRolloverNewTerm('Spring 2027');
    }

    setRolloverLeadInstructorId(course.instructor.id);
    setShowRolloverModal(true);
  };

  // Execute Semester Rollover
  const handleCompleteRollover = (e: React.FormEvent) => {
    e.preventDefault();
    const sourceId = rolloverSourceCourseId || courses[0]?.id;
    if (!sourceId) return;

    const channelsPayload = rolloverSubjects.filter(s => s.name.trim()).map(sub => {
      const lect = availableUsers.find(u => u.id === sub.lecturerId) || availableUsers[1];
      return {
        name: sub.name.trim(),
        description: sub.description.trim() || `Subject: ${sub.name.trim()}`,
        subjectLecturerName: lect.name,
        subjectLecturerId: lect.id
      };
    });

    const rolled = rolloverCourseToNextSemester(sourceId, {
      code: rolloverNewCode.trim().toUpperCase(),
      name: rolloverNewName.trim(),
      term: rolloverNewTerm.trim(),
      instructorId: rolloverLeadInstructorId,
      channels: channelsPayload
    });

    setShowRolloverModal(false);
    showDialog(`Semester rollover complete! "${rolled.name}" created with ${rolled.memberCount} enrolled students automatically carried over.`, { type: 'success', title: 'Semester Rollover Complete' });
  };

  // Create a brand new Class Team
  const handleCreateClassTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;

    const instructor = availableUsers.find(u => u.id === instructorId) || availableUsers[0];
    const newCourseId = `course_${Date.now()}`;
    const finalCode = (courseCode.trim() || courseName.trim().slice(0, 10)).toUpperCase();

    const enrolled = availableUsers.filter(u => selectedStudentIdsToEnroll.includes(u.id));

    const channels: Channel[] = [
      {
        id: `ch_${newCourseId}_gen`,
        courseId: newCourseId,
        name: 'Announcements',
        description: 'Class-wide Announcements, Notices, Holidays & Academic Events (All Lecturers)',
        isGeneral: true,
        unreadCount: 0,
        studentFilePermission: 'read-only'
      },
      ...newClassSubjects.filter(s => s.name.trim()).map((sub, idx) => {
        const lect = availableUsers.find(u => u.id === sub.lecturerId) || instructor;
        const codeTag = sub.code?.trim() ? ` [${sub.code.trim()}]` : '';
        return {
          id: `ch_${newCourseId}_sub_${idx + 1}`,
          courseId: newCourseId,
          name: `${sub.name.trim()}${codeTag}`,
          description: sub.description?.trim() || `Subject: ${sub.name.trim()}${sub.code?.trim() ? ` (${sub.code.trim()})` : ''}`,
          isGeneral: false,
          unreadCount: 0,
          studentFilePermission: 'read-only' as const,
          subjectLecturerName: lect.name,
          subjectLecturerId: lect.id
        };
      })
    ];

    const chosenFaculty = faculties.find(f => f.id === selectedFacultyId) || faculties[0];
    const deptName = chosenFaculty?.name || 'Computer Science';

    const newTeam: CourseTeam = {
      id: newCourseId,
      code: finalCode,
      name: courseName.trim(),
      department: deptName,
      term,
      color: '#4f46e5',
      icon: model === 'model-b' ? '🏛️' : '⚡',
      instructor,
      coOwners: availableUsers.filter(u => u.role === 'professor' && u.id !== instructor.id).slice(0, 2),
      memberCount: enrolled.length,
      enrolledStudents: enrolled,
      channels,
      isActivated: true,
      model,
      template: 'Class'
    };

    createCourse(newTeam);

    // Seed official welcome post in General & Announcements where all lecturers post
    addPost(
      `ch_${newCourseId}_gen`,
      `Welcome to ${courseName.trim()} - Class Noticeboard`,
      `Welcome students to ${courseName.trim()}. This is our official cohort announcement section where all assigned lecturers and faculty can broadcast class details, syllabus updates, urgent alerts, holiday notices, and academic events.`,
      true,
      undefined,
      'general'
    );
    setShowNewClassModal(false);
    setCourseCode('');
    setCourseName('');
    showDialog(`Class "${newTeam.name}" created with ${channels.length - 1} subjects and ${enrolled.length} enrolled students!`, { type: 'success', title: 'Class Created' });
  };

  // Create Faculty / Department Handler
  const handleCreateFacultySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacultyName.trim() || !newFacultyCode.trim()) return;

    const dean = availableUsers.find(u => u.id === newFacultyDeanId) || availableUsers[1] || availableUsers[0];

    createFaculty({
      name: newFacultyName.trim(),
      code: newFacultyCode.trim().toUpperCase(),
      deanId: dean.id,
      deanName: dean.name,
      description: newFacultyDesc.trim() || `Department of ${newFacultyName.trim()}`
    });

    setShowAddFacultyModal(false);
    setNewFacultyName('');
    setNewFacultyCode('');
    setNewFacultyDesc('');
    showDialog(
      `Faculty "${newFacultyName.trim()}" successfully created! You can now create classes and assign subject modules under this faculty.`,
      { type: 'success', title: 'Faculty / Department Created' }
    );
  };

  // Developer Direct Institutional Admin Provisioning Handler
  const handleDirectCreateAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminInstitution.trim() || !newAdminContact.trim() || !newAdminEmail.trim()) return;

    const adminUser = createInstitutionalAdmin({
      name: newAdminContact.trim(),
      email: newAdminEmail.trim().toLowerCase(),
      institutionName: newAdminInstitution.trim(),
      department: newAdminDept.trim()
    });

    setShowCreateAdminModal(false);
    setNewAdminInstitution('');
    setNewAdminContact('');
    setNewAdminEmail('');
    showDialog(
      `Institutional Admin successfully provisioned!\nInstitution: ${adminUser.institutionName}\nAdmin Name: ${adminUser.name}\nAdmin Login ID: ${adminUser.loginId}\nOfficial Email: ${adminUser.email}\nTemporary Password: ${adminUser.temporaryPassword || 'ProCollege#2026'}`,
      { type: 'success', title: 'Institutional Admin Created' }
    );
  };

  // Add Subject Channel to existing class
  const handleAddChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForAction || !newChannelName.trim()) return;

    const lect = availableUsers.find(u => u.id === newChannelLecturerId);

    addChannel(selectedCourseForAction.id, {
      name: newChannelName.trim(),
      description: newChannelDesc.trim() || `Subject Channel: ${newChannelName.trim()}`,
      subjectLecturerId: lect?.id,
      subjectLecturerName: lect?.name
    });

    setShowAddChannelModal(false);
    setNewChannelName('');
    setNewChannelDesc('');
    showDialog(`Subject channel "${newChannelName}" added with dedicated teacher ${lect?.name || 'Assigned'}!`, { type: 'success', title: 'Subject Channel Added' });
  };

  // Save Enrolled Students
  const handleSaveEnrolledStudents = () => {
    if (!selectedCourseForAction) return;
    if (studentsToAddToClass.length > 0) {
      enrollStudentsToCourse(selectedCourseForAction.id, studentsToAddToClass);
    }
    setShowManageStudentsModal(false);
    setStudentsToAddToClass([]);
  };

  // Count classes belonging to a faculty
  const getFacultyClassCount = (fac: (typeof faculties)[0]) => {
    return courses.filter(c => {
      const matchName = c.department.toLowerCase() === fac.name.toLowerCase();
      const matchCode = c.department.toLowerCase().includes(fac.code.toLowerCase());
      const matchInclude = fac.name.toLowerCase().includes(c.department.toLowerCase());
      return matchName || matchCode || matchInclude;
    }).length;
  };

  // Filtered courses based on selected faculty filter and search query
  const filteredCourses = courses.filter(c => {
    // 1. Filter by faculty if selected
    if (selectedFacultyFilter !== 'all') {
      const fac = faculties.find(f => f.id === selectedFacultyFilter);
      if (fac) {
        const matchName = c.department.toLowerCase() === fac.name.toLowerCase();
        const matchCode = c.department.toLowerCase().includes(fac.code.toLowerCase());
        const matchInclude = fac.name.toLowerCase().includes(c.department.toLowerCase());
        if (!matchName && !matchCode && !matchInclude) {
          return false;
        }
      }
    }
    // 2. Filter by search query
    if (!searchClassQuery.trim()) return true;
    const q = searchClassQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.term.toLowerCase().includes(q);
  });

  const allStudents = availableUsers.filter(u => u.role === 'student');
  const facultyMembers = availableUsers.filter(u => u.role === 'professor' || u.role === 'lecturer' || u.role === 'ta');

  const licenseOptions: LicenseSku[] = [
    'Microsoft 365 A5 for Faculty',
    'Microsoft 365 A3 for Faculty',
    'Microsoft 365 A1 for Faculty',
    'Microsoft 365 A5 for Students',
    'Microsoft 365 A3 for Students',
    'Microsoft 365 A1 for Students'
  ];

  return (
    <div className="flex-1 bg-[#f4f5f8] p-4 sm:p-6 overflow-y-auto select-none">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Admin Header with ProCollege Logo & Dynamic Role Badging */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="px-2.5 py-1.5 bg-zinc-50 rounded-lg border border-zinc-200 shadow-2xs flex items-center justify-center shrink-0">
              <ProCollegeLogo size="sm" variant="dark-text" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-zinc-900">
                  {isDeveloper ? 'Platform Creator & Developer Console' : 'Campus Administration Center'}
                </h1>
                {isDeveloper ? (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    Developer Master (Root Access)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1 shadow-2xs">
                    <Building className="w-3 h-3 text-indigo-600" />
                    Institutional Campus Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isDeveloper
                  ? 'Master platform governance: direct provisioning of university campus admins, university inquiries approval, and campus architecture.'
                  : `Manage academic faculties, classes, assign dedicated lecturers to subjects, enroll students, and execute automated semester rollovers for ${currentUser.institutionName || 'your university'}.`}
              </p>
            </div>
          </div>

          {/* Prominent Admin Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {isDeveloper && (
              <button
                onClick={() => setShowCreateAdminModal(true)}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Directly create and provision an Institutional Admin for any university"
              >
                <Key className="w-3.5 h-3.5" />
                <span>+ Create Org Admin</span>
              </button>
            )}

            <button
              onClick={() => setShowAddFacultyModal(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Add a new academic faculty / department"
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>+ Add Faculty</span>
            </button>

            <button
              onClick={() => setShowNewClassModal(true)}
              className="flex items-center gap-1.5 bg-[#5b5fc7] hover:bg-[#4f52b2] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Add a new class with subjects and dedicated teachers"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Class</span>
            </button>

            <button
              onClick={() => {
                const source = courses.find(c => c.name.includes('Semester 3')) || courses[0];
                if (source) openRolloverForCourse(source);
                else setShowRolloverModal(true);
              }}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Clone a class to next semester: automatically keeps all students without manual entry"
            >
              <Repeat className="w-4 h-4" />
              <span>Semester Rollover</span>
            </button>

            <button
              onClick={() => setShowRegisterUserModal(true)}
              className="flex items-center gap-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
              title="Register student or faculty identity"
            >
              <UserPlus className="w-3.5 h-3.5 text-zinc-600" />
              <span>Register ID</span>
            </button>
          </div>
        </div>

        {/* Developer Mode Master Banner (Shown only to Developer Admin) */}
        {isDeveloper && (
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-4 rounded-xl shadow-md border border-purple-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                  Platform Creator & Root Governance
                </p>
                <p className="text-xs text-white font-medium">
                  You are logged in as Platform Developer (Creator). You possess superior multi-campus authority, can provision institutional admins, review incoming university requests, and control all tenant domains.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Organization Scope Dropdown */}
              <div className="flex items-center gap-1.5 bg-purple-950/80 border border-purple-500/40 rounded-lg px-2.5 py-1.5 shadow-2xs">
                <span className="text-[11px] text-purple-200 font-semibold">Scope:</span>
                <select
                  value={selectedInstitution}
                  onChange={e => setSelectedInstitution(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-zinc-900 text-white">All Organizations (Master Overview)</option>
                  {allInstitutions.map(inst => (
                    <option key={inst} value={inst} className="bg-zinc-900 text-white">
                      {inst}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setActiveAdminTab('requests');
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Review Requests ({institutionalRequests.filter(r => r.status === 'pending').length} Pending)
              </button>
              <button
                onClick={() => setShowCreateAdminModal(true)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer border border-white/20"
              >
                + Issue Org Admin Login
              </button>
            </div>
          </div>
        )}

        {/* Admin Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveAdminTab('classes')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
              activeAdminTab === 'classes'
                ? 'bg-[#5b5fc7] text-white shadow-xs'
                : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Classes & Semester Rollover ({courses.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('faculties')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
              activeAdminTab === 'faculties'
                ? 'bg-[#5b5fc7] text-white shadow-xs'
                : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            Faculties & Departments ({faculties.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('users')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
              activeAdminTab === 'users'
                ? 'bg-[#5b5fc7] text-white shadow-xs'
                : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Students & Lecturers ({availableUsers.length})
          </button>
          {isDeveloper && (
            <button
              onClick={() => setActiveAdminTab('requests')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
                activeAdminTab === 'requests'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-purple-800 hover:text-purple-900 border border-purple-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Institutional Requests ({institutionalRequests.length})
              {institutionalRequests.some(r => r.status === 'pending') && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          )}
          <button
            onClick={() => setActiveAdminTab('roles')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
              activeAdminTab === 'roles'
                ? 'bg-[#5b5fc7] text-white shadow-xs'
                : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Roles
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: ACADEMIC CLASSES & SEMESTER ROLLOVER               */}
        {/* ========================================================= */}
        {activeAdminTab === 'classes' && (
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-900">Academic Classes & Subject Structure</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Assign dedicated lecturers to subjects, manage enrolled students, and rollover classes to the next semester.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchClassQuery}
                    onChange={e => setSearchClassQuery(e.target.value)}
                    placeholder="Search classes or term..."
                    className="w-full bg-zinc-50 border border-zinc-300 rounded pl-8 pr-3 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#5b5fc7]"
                  />
                </div>
              </div>
            </div>

            {/* Faculty Filter & Hierarchy Selector */}
            <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-4 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-[#5b5fc7]" />
                  <span className="text-xs font-bold text-zinc-800">Faculty Department Filter:</span>
                </div>
                <button
                  onClick={() => setShowAddFacultyModal(true)}
                  className="text-xs text-[#5b5fc7] hover:underline font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Faculty</span>
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  onClick={() => setSelectedFacultyFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer ${
                    selectedFacultyFilter === 'all'
                      ? 'bg-[#5b5fc7] text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  <span>All Faculties</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedFacultyFilter === 'all' ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-700'
                  }`}>
                    {courses.length}
                  </span>
                </button>

                {faculties.map(fac => {
                  const count = getFacultyClassCount(fac);
                  const isSelected = selectedFacultyFilter === fac.id;
                  return (
                    <button
                      key={fac.id}
                      onClick={() => setSelectedFacultyFilter(fac.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#5b5fc7] text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      <span>{fac.name}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-700'
                      }`}>
                        {fac.code} ({count})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Faculty Details Banner when a faculty is selected */}
              {selectedFacultyFilter !== 'all' && (() => {
                const currentFac = faculties.find(f => f.id === selectedFacultyFilter);
                if (!currentFac) return null;
                const count = getFacultyClassCount(currentFac);
                return (
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-zinc-900">{currentFac.name}</span>
                        <span className="text-[10px] font-mono bg-white text-[#5b5fc7] px-2 py-0.5 rounded border border-indigo-200 font-bold">
                          {currentFac.code}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          • Dean: <strong className="text-zinc-800">{currentFac.deanName}</strong>
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          • <strong>{count}</strong> {count === 1 ? 'class' : 'classes'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-600">{currentFac.description}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFacultyId(currentFac.id);
                        setShowNewClassModal(true);
                      }}
                      className="px-3 py-1.5 bg-[#5b5fc7] hover:bg-[#4f52b2] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Class to {currentFac.code}</span>
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Class Cards Grid or Empty State */}
            {filteredCourses.length === 0 ? (
              <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                  <School className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-900">No classes found</h3>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto">
                    {selectedFacultyFilter !== 'all'
                      ? 'No classes have been provisioned under this faculty yet. Create a class to add subjects and enroll students.'
                      : 'No classes matched your search filter.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (selectedFacultyFilter !== 'all') setSelectedFacultyId(selectedFacultyFilter);
                    setShowNewClassModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5b5fc7] hover:bg-[#4f52b2] text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Class</span>
                </button>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCourses.map(course => {
                const enrolled = course.enrolledStudents || [];
                return (
                  <div key={course.id} className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Course Header */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-zinc-100">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl p-1.5 bg-zinc-50 rounded-lg border border-zinc-200">{course.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-zinc-900">{course.code}</span>
                              <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-medium">
                                {course.term}
                              </span>
                            </div>
                            <h3 className="text-xs font-semibold text-zinc-800 truncate mt-0.5">{course.name}</h3>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          Active
                        </span>
                      </div>

                      {/* Lead Lecturer (Owner) */}
                      <div className="flex items-center justify-between bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 text-xs">
                        <div className="flex items-center gap-2">
                          <img
                            src={course.instructor.avatar}
                            alt={course.instructor.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <div>
                            <span className="text-[11px] text-zinc-400 block leading-tight">Lead Lecturer (Class Owner)</span>
                            <span className="font-semibold text-zinc-800">{course.instructor.name}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">{course.instructor.email}</span>
                      </div>

                      {/* Enrolled Students Section */}
                      <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#5b5fc7]" />
                            Enrolled Students ({enrolled.length > 0 ? enrolled.length : course.memberCount})
                          </span>
                          <button
                            onClick={() => {
                              setSelectedCourseForAction(course);
                              setShowManageStudentsModal(true);
                            }}
                            className="text-xs text-[#5b5fc7] hover:underline font-semibold flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            Manage Students
                          </button>
                        </div>

                        {/* Student Avatars Preview */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {enrolled.slice(0, 5).map(student => (
                            <span
                              key={student.id}
                              className="inline-flex items-center gap-1 bg-white border border-zinc-200 px-2 py-0.5 rounded-md text-[11px] text-zinc-700 shadow-2xs"
                            >
                              <img src={student.avatar} alt={student.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                              <span className="truncate max-w-[100px]">{student.name}</span>
                            </span>
                          ))}
                          {enrolled.length > 5 && (
                            <span className="text-[10px] text-zinc-500 font-medium">+{enrolled.length - 5} more</span>
                          )}
                        </div>
                      </div>

                      {/* Subject Channels with Dedicated Assigned Lecturers */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-[#5b5fc7]" />
                            Subjects & Dedicated Teachers ({course.channels.length})
                          </span>
                          <button
                            onClick={() => {
                              setSelectedCourseForAction(course);
                              setShowAddChannelModal(true);
                            }}
                            className="text-xs text-[#5b5fc7] hover:underline font-semibold flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add Subject
                          </button>
                        </div>

                        <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-lg overflow-hidden bg-white">
                          {course.channels.map(ch => (
                            <div key={ch.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-zinc-50">
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-semibold text-zinc-900 truncate">{ch.name}</p>
                                  {ch.isGeneral && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-[#5b5fc7] border border-indigo-200">
                                      Noticeboard
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-zinc-400 truncate">{ch.description}</p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[11px] bg-indigo-50 text-[#5b5fc7] border border-indigo-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                                  <GraduationCap className="w-3 h-3" />
                                  <span>{ch.subjectLecturerName || course.instructor.name}</span>
                                </span>

                                {!ch.isGeneral && ch.name.toLowerCase() !== 'announcements' && (
                                  <button
                                    onClick={() => {
                                      showDialog(
                                        `Are you sure you want to delete the subject "${ch.name}" from "${course.name}"? This will permanently remove its discussions, files, and lectures.`,
                                        {
                                          type: 'warning',
                                          title: 'Delete Subject',
                                          confirmText: 'Delete Subject',
                                          cancelText: 'Cancel',
                                          onConfirm: () => {
                                            deleteChannel(course.id, ch.id);
                                            showDialog(`Subject "${ch.name}" has been removed from ${course.name}.`, {
                                              type: 'success',
                                              title: 'Subject Removed'
                                            });
                                          }
                                        }
                                      );
                                    }}
                                    className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                    title="Delete subject from class"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Card Actions */}
                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => openRolloverForCourse(course)}
                        className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        title="Automatic semester rollover: clones class with all enrolled students carried forward"
                      >
                        <Repeat className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Rollover to Next Semester</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedCourse(course);
                            setSelectedChannel(course.channels[0]);
                            setActiveTab('teams');
                          }}
                          className="text-xs text-zinc-600 hover:text-[#5b5fc7] font-medium flex items-center gap-1"
                        >
                          <span>Open in Class</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Delete class ${course.code}?`)) {
                              deleteCourse(course.id);
                            }
                          }}
                          className="text-xs text-rose-500 hover:text-rose-700 p-1"
                          title="Delete class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: USERS & LICENSES                                   */}
        {/* ========================================================= */}
        {activeAdminTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Provisioned Users & License SKUs</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Manage student and faculty accounts, assignments, and mute controls.
                </p>
              </div>

              <button
                onClick={() => setShowRegisterUserModal(true)}
                className="flex items-center gap-2 bg-[#5b5fc7] hover:bg-[#4f52b2] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Register New User
              </button>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Login ID</th>
                      <th className="py-3 px-4">License SKU</th>
                      <th className="py-3 px-4">Mute State</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {availableUsers.map(user => (
                      <tr key={user.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                            <div>
                              <p className="font-bold text-zinc-900">{user.name}</p>
                              <p className="text-zinc-500 text-[11px]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : user.role === 'professor' || user.role === 'lecturer'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-zinc-700">{user.loginId || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <select
                            value={user.license}
                            onChange={e => updateUserLicense(user.id, e.target.value as LicenseSku)}
                            className="bg-zinc-50 border border-zinc-300 rounded px-2 py-1 text-xs text-zinc-800 font-medium focus:ring-1 focus:ring-[#5b5fc7] focus:outline-none"
                          >
                            {licenseOptions.map(lic => (
                              <option key={lic} value={lic}>
                                {lic}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          {user.isMuted ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                              <VolumeX className="w-3.5 h-3.5" /> Muted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                              <Volume2 className="w-3.5 h-3.5" /> Active
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => toggleUserMute(user.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
                              user.isMuted
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {user.isMuted ? 'Unmute' : 'Mute'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: FACULTIES & DEPARTMENTS                            */}
        {/* ========================================================= */}
        {activeAdminTab === 'faculties' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-[#5b5fc7]" />
                  <span>Academic Faculties & Departments</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Establish collegiate faculties, appoint academic deans, and organize degree class cohorts and subject modules under each department.
                </p>
              </div>

              <button
                onClick={() => setShowAddFacultyModal(true)}
                className="flex items-center gap-1.5 bg-[#5b5fc7] hover:bg-[#4f52b2] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Faculty</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {faculties.map(faculty => {
                const associatedClasses = courses.filter(
                  c =>
                    c.department?.toLowerCase() === faculty.name.toLowerCase() ||
                    c.department?.toLowerCase().includes(faculty.code.toLowerCase()) ||
                    c.name.toLowerCase().includes(faculty.code.toLowerCase())
                );

                return (
                  <div
                    key={faculty.id}
                    className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-[#5b5fc7] flex items-center justify-center font-bold text-sm shrink-0">
                            {faculty.code.slice(0, 3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                                {faculty.code}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-zinc-900 mt-0.5 leading-snug">
                              {faculty.name}
                            </h3>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                        {faculty.description || `Academic department overseeing ${faculty.name} degree curricula.`}
                      </p>

                      <div className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-100 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-zinc-600">
                          <span className="text-[11px] font-medium text-zinc-500">Appointed Dean:</span>
                          <span className="font-semibold text-zinc-800">{faculty.deanName}</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-600">
                          <span className="text-[11px] font-medium text-zinc-500">Active Classes:</span>
                          <span className="font-bold text-[#5b5fc7]">{associatedClasses.length} cohorts</span>
                        </div>
                      </div>

                      {associatedClasses.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">
                            Associated Classes:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {associatedClasses.map(c => (
                              <span
                                key={c.id}
                                className="text-[10px] bg-zinc-100 text-zinc-700 font-medium px-2 py-0.5 rounded border border-zinc-200"
                              >
                                {c.code}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedFacultyId(faculty.id);
                        setShowNewClassModal(true);
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Class to {faculty.code}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: INSTITUTIONAL REQUESTS (DEVELOPER CREATOR ONLY)    */}
        {/* ========================================================= */}
        {isDeveloper && activeAdminTab === 'requests' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-zinc-900">University & Organization Access Requests</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                    Developer Mode Only
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Review and approve college access inquiries submitted through the portal, or directly issue an Institutional Admin login.
                </p>
              </div>

              <button
                onClick={() => setShowCreateAdminModal(true)}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Key className="w-3.5 h-3.5" />
                <span>+ Create Org Admin</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {institutionalRequests.map(req => (
                <div key={req.id} className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900">{req.institutionName}</h3>
                      <p className="text-xs text-zinc-500">Contact: {req.contactName} ({req.email})</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        req.status === 'provisioned'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="bg-zinc-50 p-2.5 rounded-lg text-xs space-y-1 text-zinc-600">
                    <p>Phone: {req.phone || 'N/A'}</p>
                    <p>Estimated Students: {req.studentCount}</p>
                    <p>Deployment: {req.deploymentType}</p>
                  </div>

                  {req.status === 'pending' && (
                    <button
                      onClick={() => handleProvisionOrgAdmin(req)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Approve & Provision Org Admin
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: ROLES & ACADEMIC GOVERNANCE                        */}
        {/* ========================================================= */}
        {activeAdminTab === 'roles' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#5b5fc7]" />
                <span>Roles & Academic Access Governance</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Multi-tier academic governance matrix governing Developer Creator, Institutional Administrators, Teaching Faculty, and Students.
              </p>
            </div>

            {/* Role Cards Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-purple-900">Developer Creator</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    Superior Root
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Platform owner with supreme cross-campus authority. Provisions college institutional admins, oversees tenant requests, and governs infrastructure.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-indigo-200 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-indigo-900">Institutional Admin</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    Campus Admin
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Campus administrator. Creates faculties and departments, provisions classes, assigns lecturers to subjects, registers students, and executes semester rollovers.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-blue-900">Professor / Lecturer</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Teaching Staff
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Course & subject instructors. Broadcast class announcements and notices, publish syllabus and lecture files, create assignments, and grade student submissions.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-emerald-900">Student</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Enrolled Member
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Enrolled learners. View announcements and read-only class materials, interact in discussions, submit coursework with attachments, and view graded feedback.
                </p>
              </div>
            </div>

            {/* Permission Matrix Table */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-zinc-200 bg-zinc-50">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Operational Permissions Matrix
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-zinc-50/50 border-b border-zinc-200 font-semibold text-zinc-700">
                      <th className="py-2.5 px-3">Academic Tier</th>
                      <th className="py-2.5 px-3">Create Faculties & Classes</th>
                      <th className="py-2.5 px-3">Assign Subject Teachers</th>
                      <th className="py-2.5 px-3">Announcements & Alerts</th>
                      <th className="py-2.5 px-3">Assignments & Grading</th>
                      <th className="py-2.5 px-3">Multi-Campus Provisioning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <tr className="bg-purple-50/20">
                      <td className="py-2.5 px-3 font-bold text-purple-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        Developer Master
                      </td>
                      <td className="py-2.5 px-3 text-purple-800 font-semibold">Full Root Control</td>
                      <td className="py-2.5 px-3 text-purple-800 font-semibold">Allowed</td>
                      <td className="py-2.5 px-3 text-purple-800 font-semibold">Global Broadcast</td>
                      <td className="py-2.5 px-3 text-purple-800 font-semibold">Full System Access</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">Exclusive Root</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-indigo-900">Institutional Admin</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">Campus-wide Allowed</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">Campus-wide Allowed</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">Campus-wide Allowed</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">Gradebook Supervise</td>
                      <td className="py-2.5 px-3 text-zinc-400 font-medium">Restricted (Developer Only)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-zinc-900">Professor / Lecturer</td>
                      <td className="py-2.5 px-3 text-zinc-400">Class Request Only</td>
                      <td className="py-2.5 px-3 text-zinc-600">Assigned by Admin</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">Post to General Channel</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">Author, Review & Grade</td>
                      <td className="py-2.5 px-3 text-zinc-400 font-medium">No Access</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-zinc-900">Student</td>
                      <td className="py-2.5 px-3 text-zinc-400">No Access</td>
                      <td className="py-2.5 px-3 text-zinc-400">No Access</td>
                      <td className="py-2.5 px-3 text-zinc-600">Reply & React</td>
                      <td className="py-2.5 px-3 text-zinc-700">Submit Work & View Grades</td>
                      <td className="py-2.5 px-3 text-zinc-400 font-medium">No Access</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: NEW CLASS                                         */}
      {/* ========================================================= */}
      {showNewClassModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden">
          <form
            onSubmit={handleCreateClassTeam}
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-zinc-200 flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Pinned Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5b5fc7]">
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 leading-tight">Provision Academic Class</h3>
                  <p className="text-[11px] text-zinc-500">Create a class under a faculty, configure subject modules, and enroll students.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewClassModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Faculty / Academic Department Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Faculty / Academic Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedFacultyId}
                  onChange={e => setSelectedFacultyId(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 font-semibold focus:outline-none focus:border-[#5b5fc7]"
                  required
                >
                  {faculties.map(fac => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.code}) — Dean: {fac.deanName}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500 mt-1">
                  This class and its subject courses will be cataloged under this faculty.
                </p>
              </div>

              {/* Class Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Class Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                  placeholder="e.g. B.Sc. Computer Science - Semester 4 (Section A)"
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#5b5fc7] focus:bg-white"
                  required
                />
              </div>

              {/* Academic Term & Lead Lecturer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Academic Term <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={term}
                    onChange={e => setTerm(e.target.value)}
                    placeholder="Fall 2026"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-[#5b5fc7] focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Lead Lecturer (Class Owner)
                  </label>
                  <select
                    value={instructorId}
                    onChange={e => setInstructorId(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-[#5b5fc7]"
                  >
                    {facultyMembers.map(lecturer => (
                      <option key={lecturer.id} value={lecturer.id}>
                        {lecturer.name} ({lecturer.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 1. Default Announcement Section (Not a Subject) */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#5b5fc7]" />
                  <span className="text-xs font-bold text-zinc-900">
                    Default Section: Announcements
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 text-[#5b5fc7] rounded">
                    Noticeboard
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  Automatic class-wide noticeboard (not a subject). All lecturers assigned to this class can post <strong>notices, lecture schedules, urgent alerts, exam dates, and academic events</strong> directly to students.
                </p>
              </div>

              {/* 2. Subjects & Dedicated Lecturers Builder */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-zinc-200">
                  <div>
                    <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#5b5fc7]" />
                      Subjects & Dedicated Lecturers ({newClassSubjects.length})
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Academic subjects taught in this class (listed after Announcements)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewClassSubjects(prev => [
                        ...prev,
                        { name: '', code: '', description: '', lecturerId: facultyMembers[0]?.id }
                      ]);
                    }}
                    className="text-xs text-[#5b5fc7] font-semibold hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add Single Subject
                  </button>
                </div>

                {/* Preset Subject Blocks & Batch Add Buttons */}
                <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-zinc-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-zinc-700">Quick Add Subject Block:</span>
                    <button
                      type="button"
                      onClick={() => setShowBatchPasteInput(!showBatchPasteInput)}
                      className="text-[11px] text-[#5b5fc7] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ClipboardList className="w-3 h-3" />
                      <span>{showBatchPasteInput ? '✕ Close Paste' : 'Batch Paste Subjects'}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SUBJECT_BLOCK_PRESETS.map((block, pIdx) => (
                      <button
                        key={block.name}
                        type="button"
                        onClick={() => handleApplyPresetBlock(pIdx, 'append')}
                        className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-[#5b5fc7] border border-indigo-200 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        title={`Append 4 subjects: ${block.subjects.map(s => s.name).join(', ')}`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>{block.short}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Batch Paste Expander */}
                {showBatchPasteInput && (
                  <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-800">
                        Paste Multiple Subjects & Codes
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">Format: Subject Name, Code</span>
                    </div>
                    <textarea
                      rows={3}
                      value={batchPasteText}
                      onChange={e => setBatchPasteText(e.target.value)}
                      placeholder="Operating Systems, CS-302&#10;Computer Networks, CS-304&#10;Database Systems, CS-305"
                      className="w-full bg-white border border-zinc-300 rounded p-2 text-xs font-mono text-zinc-800 focus:outline-none focus:border-[#5b5fc7]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplyBatchPaste('replace')}
                        disabled={!batchPasteText.trim()}
                        className="px-2.5 py-1 bg-white hover:bg-zinc-100 disabled:opacity-50 text-zinc-700 border border-zinc-300 rounded text-xs font-medium cursor-pointer"
                        title="Replace current subjects list with these"
                      >
                        Replace All
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyBatchPaste('append')}
                        disabled={!batchPasteText.trim()}
                        className="px-3 py-1 bg-[#5b5fc7] hover:bg-[#4f52b2] disabled:opacity-50 text-white rounded text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        + Append to Subjects
                      </button>
                    </div>
                  </div>
                )}

                {/* Common Subject Datalist */}
                <datalist id="common-subjects">
                  <option value="Operating Systems" />
                  <option value="Computer Networks" />
                  <option value="Database Systems" />
                  <option value="Software Engineering" />
                  <option value="Artificial Intelligence" />
                  <option value="Compiler Design" />
                  <option value="Cloud Computing" />
                  <option value="Algorithms & Complexity" />
                  <option value="Computer Architecture" />
                  <option value="Cybersecurity" />
                </datalist>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {newClassSubjects.map((sub, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white p-2 rounded-lg border border-zinc-200">
                      <input
                        type="text"
                        list="common-subjects"
                        value={sub.name}
                        onChange={e => {
                          const val = e.target.value;
                          setNewClassSubjects(prev =>
                            prev.map((s, i) => (i === idx ? { ...s, name: val } : s))
                          );
                        }}
                        placeholder={`Subject ${idx + 1} Name`}
                        className="flex-1 bg-zinc-50 border border-zinc-300 rounded px-2 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#5b5fc7] focus:bg-white"
                        required
                      />

                      <input
                        type="text"
                        value={sub.code}
                        onChange={e => {
                          const val = e.target.value;
                          setNewClassSubjects(prev =>
                            prev.map((s, i) => (i === idx ? { ...s, code: val } : s))
                          );
                        }}
                        placeholder="Code (CS-301)"
                        className="w-full sm:w-28 bg-zinc-50 border border-zinc-300 rounded px-2 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#5b5fc7] focus:bg-white"
                      />

                      <select
                        value={sub.lecturerId}
                        onChange={e => {
                          const val = e.target.value;
                          setNewClassSubjects(prev =>
                            prev.map((s, i) => (i === idx ? { ...s, lecturerId: val } : s))
                          );
                        }}
                        className="bg-zinc-50 border border-zinc-300 rounded px-2 py-1.5 text-xs text-zinc-800 focus:outline-none"
                        title="Select Dedicated Teacher for this subject"
                      >
                        {facultyMembers.map(f => (
                          <option key={f.id} value={f.id}>
                            Teacher: {f.name}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setNewClassSubjects(prev => prev.filter((_, i) => i !== idx))}
                        className="text-zinc-400 hover:text-rose-600 p-1 self-end sm:self-center cursor-pointer"
                        title="Remove subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Enrollment Selection */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-zinc-200">
                  <div>
                    <span className="text-xs font-bold text-zinc-800 block">
                      Enroll Students ({selectedStudentIdsToEnroll.length} selected)
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Import from previous class directly, or select individual students below
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedStudentIdsToEnroll.length === allStudents.length) {
                          setSelectedStudentIdsToEnroll([]);
                        } else {
                          setSelectedStudentIdsToEnroll(allStudents.map(s => s.id));
                        }
                      }}
                      className="text-xs text-[#5b5fc7] font-semibold hover:underline cursor-pointer"
                    >
                      {selectedStudentIdsToEnroll.length === allStudents.length ? 'Deselect All' : 'Select All Students'}
                    </button>
                  </div>
                </div>

                {/* Direct Import From Previous Class */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-zinc-200">
                  <span className="text-xs font-medium text-zinc-700 shrink-0">
                    Select from Previous Class:
                  </span>
                  <select
                    onChange={e => {
                      const prevCourse = courses.find(c => c.id === e.target.value);
                      if (prevCourse && prevCourse.enrolledStudents && prevCourse.enrolledStudents.length > 0) {
                        setSelectedStudentIdsToEnroll(prevCourse.enrolledStudents.map(s => s.id));
                      }
                    }}
                    defaultValue=""
                    className="flex-1 bg-zinc-50 border border-zinc-300 rounded px-2.5 py-1 text-xs text-zinc-800 focus:outline-none focus:border-[#5b5fc7]"
                  >
                    <option value="">-- Choose previous class to populate students --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.enrolledStudents?.length || 0} students)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Individual Manual Student Checkboxes */}
                <div>
                  <span className="text-[11px] font-semibold text-zinc-600 block mb-1">
                    Student Roster (toggle manually):
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {allStudents.map(student => {
                      const isChecked = selectedStudentIdsToEnroll.includes(student.id);
                      return (
                        <label
                          key={student.id}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked ? 'bg-indigo-50/70 border-indigo-200 font-medium' : 'bg-white border-zinc-200 hover:bg-zinc-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedStudentIdsToEnroll(prev => [...prev, student.id]);
                              } else {
                                setSelectedStudentIdsToEnroll(prev => prev.filter(id => id !== student.id));
                              }
                            }}
                            className="rounded text-[#5b5fc7]"
                          />
                          <span className="truncate">{student.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Pinned Footer */}
            <div className="p-3 sm:p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowNewClassModal(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-[#5b5fc7] hover:bg-[#4f52b2] text-white rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Create Class
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: SEMESTER ROLLOVER (AUTOMATIC STUDENT CARRYOVER)   */}
      {/* ========================================================= */}
      {showRolloverModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden">
          <form
            onSubmit={handleCompleteRollover}
            className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-zinc-200 flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Pinned Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 leading-tight">Semester Rollover & Class Duplicate</h3>
                  <p className="text-[11px] text-zinc-500">
                    Automatically carries forward all enrolled students into the new semester without re-entering them.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRolloverModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Source Class Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Source Class (Previous Semester)</label>
                <select
                  value={rolloverSourceCourseId}
                  onChange={e => {
                    const cId = e.target.value;
                    setRolloverSourceCourseId(cId);
                    const selected = courses.find(c => c.id === cId);
                    if (selected) {
                      if (selected.name.includes('Semester 3')) {
                        setRolloverNewName(selected.name.replace('Semester 3', 'Semester 4'));
                        setRolloverNewCode('B.Sc. CS 2027');
                      } else {
                        setRolloverNewName(`${selected.name} - Next Semester`);
                        setRolloverNewCode(`${selected.code}-S2`);
                      }
                      setRolloverLeadInstructorId(selected.instructor.id);
                    }
                  }}
                  className="w-full bg-white border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 font-medium focus:outline-none focus:border-[#5b5fc7]"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code} • {c.name} ({c.term})
                    </option>
                  ))}
                </select>
              </div>

              {/* Automatic Student Carryover Banner */}
              {(() => {
                const src = courses.find(c => c.id === (rolloverSourceCourseId || courses[0]?.id));
                const count = src?.enrolledStudents?.length || src?.memberCount || allStudents.length;
                return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Automated Student Rollover</p>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        All <strong>{count} enrolled students</strong> from {src?.code} are automatically transferred into the new semester class. You do not have to manually re-add them.
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">New Class Code</label>
                  <input
                    type="text"
                    value={rolloverNewCode}
                    onChange={e => setRolloverNewCode(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 font-medium focus:outline-none focus:border-[#5b5fc7]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">New Semester Term</label>
                  <input
                    type="text"
                    value={rolloverNewTerm}
                    onChange={e => setRolloverNewTerm(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 font-medium focus:outline-none focus:border-[#5b5fc7]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">New Semester Class Title</label>
                <input
                  type="text"
                  value={rolloverNewName}
                  onChange={e => setRolloverNewName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 font-medium focus:outline-none focus:border-[#5b5fc7]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Assign Lead Lecturer</label>
                <select
                  value={rolloverLeadInstructorId}
                  onChange={e => setRolloverLeadInstructorId(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none"
                >
                  {facultyMembers.map(lecturer => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.name} ({lecturer.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Define New Semester Subjects & Dedicated Teachers */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#5b5fc7]" />
                    New Semester Subjects & Dedicated Teachers ({rolloverSubjects.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRolloverSubjects(prev => [
                        ...prev,
                        { name: '', description: '', lecturerId: facultyMembers[0]?.id }
                      ]);
                    }}
                    className="text-xs text-[#5b5fc7] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    + Add Subject
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {rolloverSubjects.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-zinc-200">
                      <input
                        type="text"
                        value={sub.name}
                        onChange={e => {
                          const val = e.target.value;
                          setRolloverSubjects(prev =>
                            prev.map((s, i) => (i === idx ? { ...s, name: val } : s))
                          );
                        }}
                        placeholder={`Subject ${idx + 1}`}
                        className="flex-1 bg-zinc-50 border border-zinc-300 rounded px-2 py-1 text-xs text-zinc-800 focus:outline-none"
                        required
                      />

                      <select
                        value={sub.lecturerId}
                        onChange={e => {
                          const val = e.target.value;
                          setRolloverSubjects(prev =>
                            prev.map((s, i) => (i === idx ? { ...s, lecturerId: val } : s))
                          );
                        }}
                        className="bg-zinc-50 border border-zinc-300 rounded px-2 py-1 text-xs text-zinc-800"
                        title="Dedicated Subject Teacher"
                      >
                        {facultyMembers.map(f => (
                          <option key={f.id} value={f.id}>
                            Teacher: {f.name.split(' ')[0]} {f.name.split(' ')[1] || ''}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setRolloverSubjects(prev => prev.filter((_, i) => i !== idx))}
                        className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pinned Footer */}
            <div className="p-3 sm:p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowRolloverModal(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Execute Semester Rollover</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ADD SUBJECT CHANNEL WITH DEDICATED TEACHER       */}
      {/* ========================================================= */}
      {showAddChannelModal && selectedCourseForAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden">
          <form
            onSubmit={handleAddChannelSubmit}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-zinc-200 flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#5b5fc7]" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">Add Subject Channel</h3>
                  <p className="text-[11px] text-zinc-500">Adding to {selectedCourseForAction.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddChannelModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1.5 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={e => setNewChannelName(e.target.value)}
                  placeholder="Distributed Systems & Cloud Labs"
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#5b5fc7]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Subject Description</label>
                <input
                  type="text"
                  value={newChannelDesc}
                  onChange={e => setNewChannelDesc(e.target.value)}
                  placeholder="Microservices, consensus protocols, and containers"
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#5b5fc7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Dedicated Subject Teacher</label>
                <select
                  value={newChannelLecturerId}
                  onChange={e => setNewChannelLecturerId(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none"
                >
                  {facultyMembers.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.department})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500 mt-1">
                  This lecturer will be the assigned instructor for this subject channel.
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddChannelModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#5b5fc7] hover:bg-[#4f52b2] text-white rounded-lg cursor-pointer"
              >
                Add Subject Channel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: MANAGE ENROLLED STUDENTS                         */}
      {/* ========================================================= */}
      {showManageStudentsModal && selectedCourseForAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#5b5fc7]" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">Manage Enrolled Students</h3>
                  <p className="text-[11px] text-zinc-500">{selectedCourseForAction.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowManageStudentsModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1.5 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Currently Enrolled Students */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-800 block">
                  Currently Enrolled Students ({(selectedCourseForAction.enrolledStudents || []).length})
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {(selectedCourseForAction.enrolledStudents || []).map(student => (
                    <div key={student.id} className="flex items-center justify-between bg-zinc-50 p-2 rounded border border-zinc-200 text-xs">
                      <div className="flex items-center gap-2">
                        <img src={student.avatar} alt={student.name} className="w-5 h-5 rounded-full object-cover" />
                        <div>
                          <span className="font-semibold text-zinc-800">{student.name}</span>
                          <span className="text-[10px] text-zinc-400 ml-2 font-mono">{student.loginId}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeStudentFromCourse(selectedCourseForAction.id, student.id)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                        title="Remove student from class"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add More Students to Class */}
              <div className="space-y-2 pt-2 border-t border-zinc-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800">
                    Available Students to Add
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const currentIds = new Set((selectedCourseForAction.enrolledStudents || []).map(s => s.id));
                      const unenrolled = allStudents.filter(s => !currentIds.has(s.id)).map(s => s.id);
                      setStudentsToAddToClass(unenrolled);
                    }}
                    className="text-xs text-[#5b5fc7] font-semibold hover:underline cursor-pointer"
                  >
                    Enroll All Available
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {allStudents
                    .filter(s => !(selectedCourseForAction.enrolledStudents || []).some(es => es.id === s.id))
                    .map(student => {
                      const isChecked = studentsToAddToClass.includes(student.id);
                      return (
                        <label
                          key={student.id}
                          className={`flex items-center justify-between p-2 rounded border text-xs cursor-pointer ${
                            isChecked ? 'bg-indigo-50/60 border-indigo-200' : 'bg-white border-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setStudentsToAddToClass(prev => [...prev, student.id]);
                                } else {
                                  setStudentsToAddToClass(prev => prev.filter(id => id !== student.id));
                                }
                              }}
                              className="rounded text-[#5b5fc7]"
                            />
                            <span className="font-medium text-zinc-800">{student.name}</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">{student.loginId}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowManageStudentsModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveEnrolledStudents}
                disabled={studentsToAddToClass.length === 0}
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#5b5fc7] hover:bg-[#4f52b2] disabled:bg-zinc-300 text-white rounded-lg cursor-pointer"
              >
                Add {studentsToAddToClass.length} Selected Student(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: REGISTER USER MODAL                              */}
      {/* ========================================================= */}
      {showRegisterUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-900">Register Student / Faculty ID</h3>
              <button onClick={() => setShowRegisterUserModal(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <form onSubmit={handleRegisterUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="Full Name (Student or Lecturer)"
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#5b5fc7]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Institutional Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="m.lin@student.procollege.edu"
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#5b5fc7]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Role</label>
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as 'student' | 'lecturer' | 'professor')}
                    className="w-full bg-white border border-zinc-300 rounded px-2 py-1.5 text-xs text-zinc-800"
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="professor">Professor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">License SKU</label>
                  <select
                    value={newUserLicense}
                    onChange={e => setNewUserLicense(e.target.value as LicenseSku)}
                    className="w-full bg-white border border-zinc-300 rounded px-2 py-1.5 text-xs text-zinc-800"
                  >
                    {licenseOptions.map(l => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowRegisterUserModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#5b5fc7] hover:bg-[#4f52b2] text-white rounded cursor-pointer"
                >
                  Register User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: CREATED CREDENTIALS NOTIFICATION                 */}
      {/* ========================================================= */}
      {createdCredentials && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-zinc-200 space-y-3">
            <h3 className="font-bold text-sm text-zinc-900">User Registered Successfully</h3>
            <div className="bg-zinc-50 p-3 rounded text-xs space-y-1 font-mono text-zinc-700">
              <p>Name: {createdCredentials.user.name}</p>
              <p>Login ID: {createdCredentials.user.loginId}</p>
              <p>Email: {createdCredentials.user.email}</p>
              <p>Temp Password: {createdCredentials.password || 'ProCollege@2026'}</p>
            </div>
            <button
              onClick={() => setCreatedCredentials(null)}
              className="w-full bg-[#5b5fc7] text-white text-xs font-semibold py-2 rounded"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: CREATE FACULTY / DEPARTMENT                      */}
      {/* ========================================================= */}
      {showAddFacultyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden">
          <form
            onSubmit={handleCreateFacultySubmit}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-zinc-200 flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-[#5b5fc7]" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">Create Academic Faculty</h3>
                  <p className="text-[11px] text-zinc-500">Establish a university department</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddFacultyModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1.5 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Faculty Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFacultyName}
                  onChange={e => setNewFacultyName(e.target.value)}
                  placeholder="e.g. Faculty of Electrical & Aerospace Engineering"
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#5b5fc7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Code / Abbreviation <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newFacultyCode}
                    onChange={e => setNewFacultyCode(e.target.value.toUpperCase())}
                    placeholder="FEAE"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 font-mono uppercase focus:outline-none focus:border-[#5b5fc7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Appointed Dean / Head
                  </label>
                  <select
                    value={newFacultyDeanId}
                    onChange={e => setNewFacultyDeanId(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none"
                  >
                    {facultyMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Department Curriculum Description
                </label>
                <textarea
                  rows={2}
                  value={newFacultyDesc}
                  onChange={e => setNewFacultyDesc(e.target.value)}
                  placeholder="Degree curricula, laboratory tracks, research focus..."
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#5b5fc7]"
                />
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddFacultyModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#5b5fc7] hover:bg-[#4f52b2] text-white rounded-lg cursor-pointer"
              >
                Create Faculty
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 8: DIRECT INSTITUTIONAL ADMIN CREATION (DEVELOPER)  */}
      {/* ========================================================= */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden">
          <form
            onSubmit={handleDirectCreateAdminSubmit}
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">Issue Institutional Admin Login</h3>
                  <p className="text-[11px] text-zinc-500">Developer Root Console: Provision university tenant administrator</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateAdminModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1.5 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  University / Institution Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAdminInstitution}
                  onChange={e => setNewAdminInstitution(e.target.value)}
                  placeholder="e.g. Oxford Institute of Technology"
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Contact Admin Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newAdminContact}
                    onChange={e => setNewAdminContact(e.target.value)}
                    placeholder="e.g. Dr. Arthur Pendelton"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Official Admin Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={e => setNewAdminEmail(e.target.value)}
                    placeholder="admin@oxford.edu"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Direct Phone / Cell
                  </label>
                  <input
                    type="text"
                    value={newAdminPhone}
                    onChange={e => setNewAdminPhone(e.target.value)}
                    placeholder="+44 20 7946 0991"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Department / Operation
                  </label>
                  <input
                    type="text"
                    value={newAdminDept}
                    onChange={e => setNewAdminDept(e.target.value)}
                    placeholder="Academic Operations"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 text-[11px] text-purple-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <p>
                  Provisioning will automatically issue an official <strong>Organization Admin Login ID (ORG-ADMIN-XX)</strong> and temporary credentials. The college admin can then manage their faculties and classes.
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateAdminModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer"
              >
                Provision Institutional Admin
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
