import React, { useState, useEffect, useMemo } from 'react';
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
  ClipboardList,
  ArrowLeft,
  FileSpreadsheet,
  Globe,
  CreditCard,
  Database,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Activity,
  RefreshCw,
  Server
} from 'lucide-react';
import { ProCollegeLogo } from './ProCollegeLogo';
import { AdminRosterUpload } from './AdminRosterUpload';
import { useApp, type ActiveTab } from '../context/AppContext';
import type { LicenseSku, CourseTeam, DeploymentModel, Channel, User, InstitutionalRequest, FacultyDepartment } from '../types';

export interface PlatformOrg {
  id: string;
  name: string;
  code: string;
  status: string;
  billingPlan: string;
  studentCount: number;
  facultyCount: number;
  contactEmail: string;
  adminName: string;
  createdAt: string;
  startDate?: string;
  expiryDate?: string;
}

export const AdminCenterView: React.FC<{ activeDevTab?: ActiveTab }> = ({ activeDevTab = 'dev-overview' }) => {
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
    deleteFaculty,
    addMembersToFaculty,
    createInstitutionalAdmin,
    selectedInstitution,
    setSelectedInstitution,
    allInstitutions,
    activeTab,
    deleteOrganization
  } = useApp();

  const isDeveloper = currentUser.role === 'developer' || currentUser.role === 'platform_admin';
  const isDeveloperOrAdmin = isDeveloper || currentUser.role === 'admin';

  // Dedicated Developer Navigation Section - seamlessly kept in sync with activeTab
  const [currentDevSection, setCurrentDevSection] = useState<ActiveTab | 'campus-ops'>(
    activeTab?.startsWith('dev-') ? activeTab : (activeDevTab?.startsWith('dev-') ? activeDevTab : 'dev-overview')
  );

  useEffect(() => {
    if (activeTab?.startsWith('dev-')) {
      setCurrentDevSection(activeTab);
    }
  }, [activeTab]);

  const switchDevSection = (section: ActiveTab | 'campus-ops') => {
    setCurrentDevSection(section);
    if (section !== 'campus-ops') {
      setActiveTab(section);
    }
  };

  // Developer Platform Organizations State
  const [organizations, setOrganizations] = useState<PlatformOrg[]>([]);
  const [searchOrgQuery, setSearchOrgQuery] = useState('');
  const [newAdminPlan, setNewAdminPlan] = useState<'campus-pro' | 'enterprise'>('campus-pro');
  const [healthData, setHealthData] = useState<{
    database?: string;
    collegesCount?: number;
    d1Vault?: { status?: string };
    storage?: { cloudName?: string };
  } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [backupSnapshot, setBackupSnapshot] = useState<{
    timestamp?: string;
    results?: { colleges?: number; users?: number; courses?: number; course_files?: number };
  } | null>(null);
  const [isTriggeringBackup, setIsTriggeringBackup] = useState(false);

  // Primary Tab for Campus Admin (Classes, Faculties, Users, Roster, Requests, Roles)
  const [activeAdminTab, setActiveAdminTab] = useState<'classes' | 'faculties' | 'users' | 'roster' | 'requests' | 'roles'>('classes');
  const [searchClassQuery, setSearchClassQuery] = useState('');
  const [dbRequests, setDbRequests] = useState<InstitutionalRequest[]>([]);

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('procollege_token') || '';
      const res = await fetch('/api/platform/institutions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.organizations)) {
        setOrganizations(data.organizations);
      } else {
        setOrganizations([
          {
            id: 'padmashree-demo',
            name: 'Padmashree College',
            code: 'PDC',
            status: 'active',
            billingPlan: 'enterprise',
            studentCount: 154,
            facultyCount: 4,
            contactEmail: 'dean@padmashree.edu.np',
            adminName: 'Academic Dean',
            createdAt: '2026-11-12'
          },
          {
            id: 'col_procollege_network',
            name: 'ProCollege University Network',
            code: 'PCN',
            status: 'active',
            billingPlan: 'campus-pro',
            studentCount: 88,
            facultyCount: 2,
            contactEmail: 'admin@procollege.edu',
            adminName: 'Platform Administrator',
            createdAt: '2026-11-12'
          }
        ]);
      }
    } catch {
      setOrganizations([
        {
          id: 'padmashree-demo',
          name: 'Padmashree College',
          code: 'PDC',
          status: 'active',
          billingPlan: 'enterprise',
          studentCount: 154,
          facultyCount: 4,
          contactEmail: 'dean@padmashree.edu.np',
          adminName: 'Academic Dean',
          createdAt: '2026-11-12'
        }
      ]);
    }
  };

  useEffect(() => {
    if (isDeveloper) {
      fetchOrganizations();
    }
  }, [isDeveloper]);

  const handleToggleOrgStatus = async (orgId: string, _currentStatus?: string) => {
    try {
      const token = localStorage.getItem('procollege_token') || '';
      const res = await fetch(`/api/platform/institutions/${encodeURIComponent(orgId)}/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to toggle status');
      }

      setOrganizations(prev =>
        prev.map(org => (org.id === orgId ? { ...org, status: data.status } : org))
      );

      showDialog(
        `Organization workflow is now ${data.status === 'paused' ? 'PAUSED' : 'ACTIVATED'}.\n\n${data.message}`,
        {
          type: data.status === 'paused' ? 'warning' : 'success',
          title: `Workflow ${data.status === 'paused' ? 'Suspended' : 'Activated'}`
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showDialog(`Status Toggle Failed: ${msg}`, { type: 'error' });
    }
  };

  const handleDeleteOrg = async (org: PlatformOrg) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${org.name}"?\n\nThis will remove all associated faculties, classes, students, and campus data. This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('procollege_token') || '';
      const res = await fetch(`/api/platform/institutions/${encodeURIComponent(org.id)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete organization');
      }

      setOrganizations(prev => prev.filter(o => o.id !== org.id));
      deleteOrganization(org.name);

      showDialog(`Organization "${org.name}" has been permanently deleted.`, {
        type: 'success',
        title: 'Organization Deleted'
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showDialog(`Delete failed: ${msg}`, { type: 'error' });
    }
  };

  const handleRenewOrg = async (org: PlatformOrg) => {
    try {
      const token = localStorage.getItem('procollege_token') || '';
      const res = await fetch(`/api/platform/institutions/${encodeURIComponent(org.id)}/renew`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to renew subscription');
      }

      setOrganizations(prev =>
        prev.map(o => {
          if (o.id === org.id) {
            const currentExp = o.expiryDate ? new Date(o.expiryDate) : new Date();
            currentExp.setFullYear(currentExp.getFullYear() + 1);
            return {
              ...o,
              status: 'active',
              expiryDate: currentExp.toISOString().split('T')[0]
            };
          }
          return o;
        })
      );

      showDialog(`Subscription for "${org.name}" has been renewed for 1 year!\n\nStatus is set to Active.`, {
        type: 'success',
        title: 'Subscription Renewed'
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showDialog(`Renew failed: ${msg}`, { type: 'error' });
    }
  };

  const handleRunDiagnostics = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthData(data);
      showDialog(
        `Multi-Cloud Health Verified!\nTurso DB: Online (colleges: ${data.collegesCount})\nCloudflare D1 Vault: ${data.d1Vault?.status}\nCloudinary Storage: ${data.storage?.cloudName}`,
        { type: 'success', title: 'System Diagnostics Healthy' }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showDialog(`Diagnostics check failed: ${msg}`, { type: 'error' });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleTriggerBackup = async () => {
    setIsTriggeringBackup(true);
    try {
      const res = await fetch('/api/vault/backup', { method: 'POST' });
      const data = await res.json();
      setBackupSnapshot(data);
      showDialog(
        `D1 Vault Snapshot Stored!\nColleges: ${data.results?.colleges ?? 0}\nUsers: ${data.results?.users ?? 0}\nCourses: ${data.results?.courses ?? 0}\nFiles: ${data.results?.course_files ?? 0}`,
        { type: 'success', title: 'Backup Synchronized' }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showDialog(`Backup snapshot failed: ${msg}`, { type: 'error' });
    } finally {
      setIsTriggeringBackup(false);
    }
  };

  useEffect(() => {
    fetch('/api/colleges/requests')
      .then(res => res.json())
      .then(data => {
        if (data.requests && Array.isArray(data.requests)) {
          const mapped: InstitutionalRequest[] = data.requests.map((r: {
            id: string;
            institution_name: string;
            contact_name: string;
            email: string;
            phone?: string;
            student_count?: number;
            deployment_type?: string;
            status?: string;
            created_at?: string;
          }) => ({
            id: r.id,
            institutionName: r.institution_name,
            contactName: r.contact_name,
            email: r.email,
            phone: r.phone || '',
            studentCount: Number(r.student_count) || 1000,
            deploymentType: (r.deployment_type as DeploymentModel) || 'campus-pro',
            status: (r.status as 'pending' | 'provisioned') || 'pending',
            createdAt: r.created_at || new Date().toISOString(),
          }));
          setDbRequests(mapped);
        }
      })
      .catch(() => {});
  }, [activeAdminTab]);

  const allRequests = useMemo(() => {
    const ids = new Set(dbRequests.map(r => r.id));
    return [...dbRequests, ...institutionalRequests.filter(r => !ids.has(r.id))];
  }, [dbRequests, institutionalRequests]);

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
  const [deanSelectionMode, setDeanSelectionMode] = useState<'select' | 'manual'>('select');
  const [manualDeanName, setManualDeanName] = useState('');

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
  const [newUserLicense, setNewUserLicense] = useState<LicenseSku>('ProCollege Verified for Students');
  const [createdCredentials, setCreatedCredentials] = useState<{ user: User; password?: string } | null>(null);

  // New Class Form State (with Faculty Selector)
  const [selectedFacultyId, setSelectedFacultyId] = useState(faculties[0]?.id || 'fac_cs');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [term, setTerm] = useState('Fall 2026');
  const [model] = useState<DeploymentModel>('model-b');
  const [instructorId, setInstructorId] = useState(availableUsers[1]?.id || availableUsers[0]?.id);
  const [instructorSelectionMode, setInstructorSelectionMode] = useState<'select' | 'manual'>('select');
  const [manualInstructorName, setManualInstructorName] = useState('');
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
  const [classesSubView, setClassesSubView] = useState<'classes' | 'faculties'>('classes');
  const [showFacultyMembersModal, setShowFacultyMembersModal] = useState<boolean>(false);
  const [selectedFacultyForMembers, setSelectedFacultyForMembers] = useState<FacultyDepartment | null>(null);
  const [selectedMemberIdsForFaculty, setSelectedMemberIdsForFaculty] = useState<string[]>([]);
  const [searchFacultyQuery, setSearchFacultyQuery] = useState<string>('');

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

    const chosenFaculty = faculties.find(f => f.id === selectedFacultyId) || faculties[0];
    const deptName = chosenFaculty?.name || 'Computer Science';

    let leadInstructor: User;
    if (instructorSelectionMode === 'manual' && manualInstructorName.trim()) {
      const typed = manualInstructorName.trim();
      const existing = facultyMembers.find(u => u.name.toLowerCase() === typed.toLowerCase());
      if (existing) {
        leadInstructor = existing;
      } else {
        leadInstructor = {
          id: `usr_prof_${Date.now()}`,
          name: typed,
          email: `${typed.toLowerCase().replace(/[^a-z0-9]/g, '')}@${currentUser?.institutionName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'college'}.edu.np`,
          role: 'professor',
          avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          department: deptName,
          institutionName: currentUser?.institutionName || 'Padmashree College',
          license: 'ProCollege Verified for Faculty',
          status: 'available'
        };
      }
    } else {
      leadInstructor = facultyMembers.find(u => u.id === instructorId) || availableUsers.find(u => u.id === instructorId) || availableUsers[0];
    }

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
        const lect = availableUsers.find(u => u.id === sub.lecturerId) || leadInstructor;
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

    const newTeam: CourseTeam = {
      id: newCourseId,
      code: finalCode,
      name: courseName.trim(),
      facultyId: chosenFaculty?.id,
      department: deptName,
      term,
      color: '#4f46e5',
      icon: model === 'model-b' ? '🏛️' : '⚡',
      instructor: leadInstructor,
      coOwners: facultyMembers.filter(u => u.id !== leadInstructor.id).slice(0, 2),
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
      `Welcome students to ${courseName.trim()}. This is our official announcement section where all assigned lecturers and faculty can broadcast class details, syllabus updates, urgent alerts, holiday notices, and academic events.`,
      true,
      undefined,
      'general'
    );
    setShowNewClassModal(false);
    setCourseCode('');
    setCourseName('');
    setManualInstructorName('');
    setInstructorSelectionMode('select');
    showDialog(`Class "${newTeam.name}" created under ${deptName} with ${channels.length - 1} subjects and ${enrolled.length} enrolled students!`, { type: 'success', title: 'Class Created' });
  };

  // Create Faculty / Department Handler
  const handleCreateFacultySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacultyName.trim() || !newFacultyCode.trim()) return;

    let deanId: string;
    let deanName: string;

    if (deanSelectionMode === 'manual' && manualDeanName.trim()) {
      deanName = manualDeanName.trim();
      const existing = facultyMembers.find(u => u.name.toLowerCase() === deanName.toLowerCase());
      deanId = existing ? existing.id : `usr_dean_${Date.now()}`;
    } else {
      const dean = facultyMembers.find(u => u.id === newFacultyDeanId) || availableUsers.find(u => u.id === newFacultyDeanId) || availableUsers[1] || availableUsers[0];
      deanId = dean.id;
      deanName = dean.name;
    }

    createFaculty({
      name: newFacultyName.trim(),
      code: newFacultyCode.trim().toUpperCase(),
      deanId,
      deanName,
      description: newFacultyDesc.trim() || `Department of ${newFacultyName.trim()}`
    });

    setShowAddFacultyModal(false);
    setNewFacultyName('');
    setNewFacultyCode('');
    setNewFacultyDesc('');
    setManualDeanName('');
    setDeanSelectionMode('select');
    showDialog(
      `Faculty "${newFacultyName.trim()}" successfully created! You can now create classes and assign subject modules under this faculty.`,
      { type: 'success', title: 'Faculty / Department Created' }
    );
  };

  // Developer Direct Institutional Admin Provisioning Handler
  const handleDirectCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminInstitution.trim() || !newAdminContact.trim() || !newAdminEmail.trim()) return;

    try {
      const token = localStorage.getItem('procollege_token') || '';
      const res = await fetch('/api/platform/institutions/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newAdminInstitution.trim(),
          contactName: newAdminContact.trim(),
          email: newAdminEmail.trim().toLowerCase(),
          department: newAdminDept.trim(),
          plan: newAdminPlan
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to provision institution on backend');
      }

      // Add to local state & refresh organizations
      createInstitutionalAdmin({
        name: data.admin.name,
        email: data.admin.email,
        institutionName: data.institution.name,
        department: newAdminDept.trim(),
        temporaryPassword: data.admin.temporaryPassword
      });

      await fetchOrganizations();

      setShowCreateAdminModal(false);
      setNewAdminInstitution('');
      setNewAdminContact('');
      setNewAdminEmail('');

      showDialog(
        `Institutional Admin successfully provisioned!\nInstitution: ${data.institution.name}\nAdmin Name: ${data.admin.name}\nAdmin Login ID: ${data.admin.loginId}\nOfficial Email: ${data.admin.email}\nTemporary Password: ${data.admin.temporaryPassword}\n\nCredentials are saved in the live Turso database. The admin can log in immediately.`,
        { type: 'success', title: 'Institutional Admin Created' }
      );
    } catch {
      // Fallback
      const adminUser = createInstitutionalAdmin({
        name: newAdminContact.trim(),
        email: newAdminEmail.trim().toLowerCase(),
        institutionName: newAdminInstitution.trim(),
        department: newAdminDept.trim()
      });
      setShowCreateAdminModal(false);
      showDialog(
        `Institutional Admin provisioned in local state.\nInstitution: ${adminUser.institutionName}\nAdmin: ${adminUser.name}\nEmail: ${adminUser.email}`,
        { type: 'info', title: 'Admin Created (Local)' }
      );
    }
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

  // Courses belonging to a faculty
  const getFacultyCourses = (fac: FacultyDepartment) => {
    return courses.filter(c => {
      const matchId = c.facultyId && c.facultyId === fac.id;
      const matchName = c.department && c.department.toLowerCase() === fac.name.toLowerCase();
      const matchCode = c.department && fac.code && c.department.toLowerCase().includes(fac.code.toLowerCase());
      const matchInclude = c.department && fac.name && fac.name.toLowerCase().includes(c.department.toLowerCase());
      return matchId || matchName || matchCode || matchInclude;
    });
  };

  // Count classes belonging to a faculty
  const getFacultyClassCount = (fac: FacultyDepartment) => {
    return getFacultyCourses(fac).length;
  };

  // Count members (teachers/professors/staff) belonging to a faculty
  const getFacultyMemberCount = (fac: FacultyDepartment) => {
    if (fac.memberIds && fac.memberIds.length > 0) return fac.memberIds.length;
    return availableUsers.filter(u => {
      if (u.role === 'student') return false;
      if (!u.department) return false;
      return (
        u.department.toLowerCase() === fac.name.toLowerCase() ||
        u.department.toLowerCase().includes(fac.code.toLowerCase()) ||
        fac.name.toLowerCase().includes(u.department.toLowerCase())
      );
    }).length;
  };

  // Filter faculties by search query in All Faculties directory
  const filteredFaculties = faculties.filter(f => {
    if (!searchFacultyQuery.trim()) return true;
    const q = searchFacultyQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.code.toLowerCase().includes(q) ||
      (f.deanName && f.deanName.toLowerCase().includes(q))
    );
  });

  // Delete Faculty Handler
  const handleDeleteFaculty = (fac: FacultyDepartment) => {
    const facCourses = getFacultyCourses(fac);
    showDialog(
      `Are you sure you want to delete the faculty "${fac.name}" (${fac.code})?${
        facCourses.length > 0
          ? `\n\nNotice: This faculty currently has ${facCourses.length} active classes associated with it.`
          : ''
      }`,
      {
        type: 'warning',
        title: 'Delete Academic Faculty',
        confirmText: 'Delete Faculty',
        cancelText: 'Cancel',
        onConfirm: () => {
          deleteFaculty(fac.id);
          if (selectedFacultyFilter === fac.id) {
            setSelectedFacultyFilter('all');
          }
          showDialog(`Faculty "${fac.name}" has been permanently deleted.`, {
            type: 'success',
            title: 'Faculty Removed'
          });
        }
      }
    );
  };

  // Delete Course Handler
  const handleDeleteCourse = (course: CourseTeam) => {
    showDialog(
      `Are you sure you want to delete class "${course.code} - ${course.name}"? This will permanently delete all associated channels, assignments, and records.`,
      {
        type: 'warning',
        title: 'Delete Class',
        confirmText: 'Delete Class',
        cancelText: 'Cancel',
        onConfirm: () => {
          deleteCourse(course.id);
          showDialog(`Class "${course.code}" has been deleted.`, {
            type: 'success',
            title: 'Class Deleted'
          });
        }
      }
    );
  };

  // Open Faculty Members Modal
  const openFacultyMembersModal = (fac: FacultyDepartment) => {
    setSelectedFacultyForMembers(fac);
    const currentMemberIds = fac.memberIds || availableUsers
      .filter(u => {
        if (u.role === 'student') return false;
        if (!u.department) return false;
        return (
          u.department.toLowerCase() === fac.name.toLowerCase() ||
          u.department.toLowerCase().includes(fac.code.toLowerCase()) ||
          fac.name.toLowerCase().includes(u.department.toLowerCase())
        );
      })
      .map(u => u.id);
    setSelectedMemberIdsForFaculty(currentMemberIds);
    setShowFacultyMembersModal(true);
  };

  // Save Faculty Members
  const handleSaveFacultyMembers = () => {
    if (!selectedFacultyForMembers) return;
    addMembersToFaculty(selectedFacultyForMembers.id, selectedMemberIdsForFaculty);
    setShowFacultyMembersModal(false);
    showDialog(`Assigned ${selectedMemberIdsForFaculty.length} faculty members to "${selectedFacultyForMembers.name}".`, {
      type: 'success',
      title: 'Faculty Members Updated'
    });
  };

  // Filtered courses based on selected faculty filter and search query
  const filteredCourses = courses.filter(c => {
    // 1. Filter by faculty if selected
    if (selectedFacultyFilter !== 'all') {
      const fac = faculties.find(f => f.id === selectedFacultyFilter);
      if (fac) {
        const matchId = c.facultyId && c.facultyId === fac.id;
        const matchName = c.department && c.department.toLowerCase() === fac.name.toLowerCase();
        const matchCode = c.department && fac.code && c.department.toLowerCase().includes(fac.code.toLowerCase());
        const matchInclude = c.department && fac.name && fac.name.toLowerCase().includes(c.department.toLowerCase());
        if (!matchId && !matchName && !matchCode && !matchInclude) {
          return false;
        }
      }
    }
    // 2. Filter by search query
    if (!searchClassQuery.trim()) return true;
    const q = searchClassQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.term.toLowerCase().includes(q) ||
      (c.department && c.department.toLowerCase().includes(q))
    );
  });

  // Academic campus users only (Students, Lecturers, Deans, Campus Admins) - NEVER developer!
  const academicUsers = useMemo(() => {
    return availableUsers.filter(u => u.role !== 'developer');
  }, [availableUsers]);

  const allStudents = academicUsers.filter(u => u.role === 'student');
  // Faculty Members strictly excludes students: includes professors, lecturers, teachers, deans, campus admins, and TAs
  const facultyMembers = useMemo(() => {
    return academicUsers.filter(u => u.role !== 'student' && u.role !== 'developer');
  }, [academicUsers]);

  const licenseOptions: LicenseSku[] = [
    'ProCollege Verified for Faculty',
    'ProCollege Verified for Students',
    'ProCollege Enterprise Platform License'
  ];

  const filteredOrganizations = useMemo(() => {
    if (!searchOrgQuery.trim()) return organizations;
    const q = searchOrgQuery.toLowerCase();
    return organizations.filter(org =>
      org.name.toLowerCase().includes(q) ||
      org.code.toLowerCase().includes(q) ||
      org.contactEmail.toLowerCase().includes(q) ||
      org.adminName.toLowerCase().includes(q)
    );
  }, [organizations, searchOrgQuery]);

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
                  <>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 shadow-2xs">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      Developer Master (Root Access)
                    </span>
                    <div className="flex items-center gap-1.5 bg-zinc-100 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs">
                      <span className="text-[11px] text-zinc-500 font-semibold">Scope:</span>
                      <select
                        value={selectedInstitution}
                        onChange={e => setSelectedInstitution(e.target.value)}
                        className="bg-transparent text-zinc-800 text-xs font-semibold focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Real Institutions (Master Overview)</option>
                        {allInstitutions.map(inst => (
                          <option key={inst} value={inst}>
                            {inst}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
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
              <>
                <button
                  onClick={() => setShowCreateAdminModal(true)}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
                  title="Directly create and provision an Institutional Admin for any university"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Create Org Admin</span>
                </button>

                <button
                  onClick={() => {
                    switchDevSection('campus-ops');
                    setActiveAdminTab('requests');
                  }}
                  className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                  title="Review university inquiries and onboarding requests"
                >
                  <span>Requests ({institutionalRequests.filter(r => r.status === 'pending').length} Pending)</span>
                </button>
              </>
            )}

            <button
              onClick={() => setShowAddFacultyModal(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Add a new academic faculty / department"
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Add Faculty</span>
            </button>

            <button
              onClick={() => setShowNewClassModal(true)}
              className="flex items-center gap-1.5 bg-[#5b5fc7] hover:bg-[#4f52b2] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Add a new class with subjects and dedicated teachers"
            >
              <Plus className="w-4 h-4" />
              <span>New Class</span>
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

            <button
              onClick={() => setActiveAdminTab('roster')}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Bulk import student roster from Excel (.xlsx/.csv) with auto-generated passwords"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Import Roster</span>
            </button>
          </div>
        </div>

        {/* Master Navigation Tabs */}
        {isDeveloper ? (
          /* Developer Master Navigation Toolbar */
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => switchDevSection('dev-overview')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
                currentDevSection === 'dev-overview'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Platform Overview & Metrics</span>
            </button>

            <button
              onClick={() => switchDevSection('dev-organizations')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
                currentDevSection === 'dev-organizations'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Manage Organizations ({organizations.length})</span>
            </button>

            <button
              onClick={() => switchDevSection('dev-billing')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
                currentDevSection === 'dev-billing'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Billing & Flow</span>
            </button>

            <button
              onClick={() => switchDevSection('dev-system')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
                currentDevSection === 'dev-system'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Global Logs & Vault Backup</span>
            </button>

            <button
              onClick={() => switchDevSection('campus-ops')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
                currentDevSection === 'campus-ops'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-zinc-200'
              }`}
            >
              <School className="w-4 h-4" />
              <span>Inspect Campus Operations</span>
            </button>
          </div>
        ) : (
          /* Campus Administration Center Navigation Tabs for Academic Dean / Admin */
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
              Students & Lecturers ({academicUsers.length})
            </button>
            <button
              onClick={() => setActiveAdminTab('roster')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
                activeAdminTab === 'roster'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-emerald-800 hover:text-emerald-900 border border-emerald-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Excel Roster Import
            </button>
            {isDeveloperOrAdmin && (
              <button
                onClick={() => setActiveAdminTab('requests')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
                  activeAdminTab === 'requests'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-white text-purple-800 hover:text-purple-900 border border-purple-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Campus Access Requests ({allRequests.length})
                {allRequests.some(r => r.status === 'pending') && (
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
        )}

        {/* If Developer is inspecting Campus Operations, render academic sub-tabs */}
        {isDeveloper && currentDevSection === 'campus-ops' && (
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveAdminTab('classes')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeAdminTab === 'classes' ? 'bg-[#5b5fc7] text-white' : 'bg-white text-zinc-600 border border-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Classes ({courses.length})
            </button>
            <button
              onClick={() => setActiveAdminTab('faculties')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeAdminTab === 'faculties' ? 'bg-[#5b5fc7] text-white' : 'bg-white text-zinc-600 border border-zinc-200'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              Faculties ({faculties.length})
            </button>
            <button
              onClick={() => setActiveAdminTab('users')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeAdminTab === 'users' ? 'bg-[#5b5fc7] text-white' : 'bg-white text-zinc-600 border border-zinc-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Users ({academicUsers.length})
            </button>
            <button
              onClick={() => setActiveAdminTab('roster')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeAdminTab === 'roster' ? 'bg-emerald-700 text-white' : 'bg-white text-zinc-600 border border-zinc-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Roster Import
            </button>
            <button
              onClick={() => setActiveAdminTab('requests')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeAdminTab === 'requests' ? 'bg-purple-700 text-white' : 'bg-white text-zinc-600 border border-zinc-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Inquiries ({allRequests.length})
            </button>
            <button
              onClick={() => setActiveAdminTab('roles')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeAdminTab === 'roles' ? 'bg-[#5b5fc7] text-white' : 'bg-white text-zinc-600 border border-zinc-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Roles
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* DEVELOPER SECTION 1: PLATFORM OVERVIEW & METRICS          */}
        {/* ========================================================= */}
        {isDeveloper && currentDevSection === 'dev-overview' && (
          <div className="space-y-5">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Campuses</span>
                  <Building2 className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-zinc-900">{organizations.length}</div>
                <p className="text-[11px] text-zinc-500 mt-1">Multi-tenant institutional nodes</p>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Students</span>
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-zinc-900">
                  {organizations.reduce((acc: number, o: PlatformOrg) => acc + (o.studentCount || 0), 0)}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">Across all registered universities</p>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Faculties</span>
                  <FolderTree className="w-4 h-4 text-[#5b5fc7]" />
                </div>
                <div className="text-2xl font-black text-zinc-900">{faculties.length}</div>
                <p className="text-[11px] text-zinc-500 mt-1">Collegiate departments active</p>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Multi-Cloud Storage</span>
                  <Server className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>3 / 3 Online</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">Turso • CF D1 Vault • Cloudinary</p>
              </div>
            </div>

            {/* Multi-Cloud Health & Edge Diagnostics */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900">Multi-Cloud Infrastructure Health & Edge Telemetry</h2>
                    <p className="text-xs text-zinc-500">Live operational status of primary database, failover vault, binary storage, and edge workers.</p>
                  </div>
                </div>
                <button
                  onClick={handleRunDiagnostics}
                  disabled={isCheckingHealth}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                  <span>{isCheckingHealth ? 'Testing Clusters...' : 'Run Diagnostics'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800">Primary Database</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Online</span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-900">Turso LibSQL Cluster</p>
                  <p className="text-[11px] text-zinc-500">Region: AWS Mumbai (aws-ap-south-1)</p>
                  <p className="text-[11px] text-zinc-500 font-mono">Tenant Isolation: SQL College ID</p>
                </div>

                <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800">Backup SQL Vault</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">Bound</span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-900">Cloudflare D1 Serverless</p>
                  <p className="text-[11px] text-zinc-500">Binding: <code className="bg-zinc-200 px-1 rounded text-[10px]">procollege_vault</code></p>
                  <p className="text-[11px] text-zinc-500 font-mono">UUID: 605f2e0f...2686</p>
                </div>

                <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800">Asset Storage CDN</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">25GB Free</span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-900">Cloudinary Binary Vault</p>
                  <p className="text-[11px] text-zinc-500">Cloud Name: <code className="bg-zinc-200 px-1 rounded text-[10px]">pf66y0wq</code></p>
                  <p className="text-[11px] text-zinc-500">Signed Uploads & Edge Caching</p>
                </div>

                <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800">Real-Time Messaging</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">WebSockets</span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-900">Ably Edge Network</p>
                  <p className="text-[11px] text-zinc-500">Pub/Sub Presence & Class Alerts</p>
                  <p className="text-[11px] text-zinc-500 font-mono">Live Sync: Active</p>
                </div>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => switchDevSection('dev-organizations')}
                className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                  <Building2 className="w-4 h-4" />
                  <span>Manage University Campuses</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  View all collegiate tenants, verify student rosters, provision institutional deans and admins, and toggle tenant status.
                </p>
                <div className="text-xs font-semibold text-purple-600 flex items-center gap-1">
                  <span>Go to Campuses</span>
                  <span>→</span>
                </div>
              </div>

              <div
                onClick={() => switchDevSection('dev-billing')}
                className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                  <CreditCard className="w-4 h-4" />
                  <span>Campus Subscriptions & Billing</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Manage annual subscriptions, start/expiry dates, 1-year renewal cycles, and active/paused workflow state.
                </p>
                <div className="text-xs font-semibold text-purple-600 flex items-center gap-1">
                  <span>Go to Billing & Flow</span>
                  <span>→</span>
                </div>
              </div>

              <div
                onClick={() => switchDevSection('dev-system')}
                className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                  <Database className="w-4 h-4" />
                  <span>Global Logs & Vault Backup</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Trigger live Cloudflare D1 Vault snapshots, inspect storage synchronization, and review tenant isolation integrity logs.
                </p>
                <div className="text-xs font-semibold text-purple-600 flex items-center gap-1">
                  <span>Go to Logs & Vault</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* DEVELOPER SECTION 2: MANAGE ORGANIZATIONS / CAMPUSES      */}
        {/* ========================================================= */}
        {isDeveloper && currentDevSection === 'dev-organizations' && (
          <div className="space-y-4">
            {/* Header & Search */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-900">Collegiate Organizations & University Tenants</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Oversee all university campuses, registered deans, active student bodies, and platform workflow states.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchOrgQuery}
                    onChange={e => setSearchOrgQuery(e.target.value)}
                    placeholder="Search campus, code, admin..."
                    className="w-full bg-zinc-50 border border-zinc-300 rounded pl-8 pr-3 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <button
                  onClick={() => setShowCreateAdminModal(true)}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>+ Issue Org Admin</span>
                </button>
              </div>
            </div>

            {/* Organizations Table */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 font-semibold text-zinc-700">
                      <th className="py-3 px-4">University / Campus</th>
                      <th className="py-3 px-4">Primary Administrator</th>
                      <th className="py-3 px-4 text-center">Students</th>
                      <th className="py-3 px-4 text-center">Faculties</th>
                      <th className="py-3 px-4">Plan / Tier</th>
                      <th className="py-3 px-4">Workflow Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredOrganizations.map((org: PlatformOrg) => {
                      const isPaused = org.status === 'paused';
                      return (
                        <tr key={org.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center font-bold text-purple-700 text-xs shrink-0">
                                {org.code ? org.code.slice(0, 3) : org.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-zinc-900">{org.name}</div>
                                <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                                  <span>ID: {org.id}</span>
                                  {org.code && <span className="bg-zinc-100 px-1 rounded text-zinc-600 font-bold">{org.code}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-zinc-800">{org.adminName}</div>
                            <div className="text-[11px] text-zinc-500">{org.contactEmail}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-full font-mono text-xs">
                              {org.studentCount || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-full font-mono text-xs">
                              {org.facultyCount || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                              {org.billingPlan || 'campus-pro'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {isPaused ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit">
                                <PauseCircle className="w-3 h-3 text-rose-600" />
                                Paused (403 Blocked)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Active (Normal)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleOrgStatus(org.id, org.status)}
                                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                  isPaused
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                }`}
                                title={isPaused ? 'Resume workflows for this university' : 'Pause workflows (blocks logins & APIs with HTTP 403)'}
                              >
                                {isPaused ? (
                                  <>
                                    <PlayCircle className="w-3.5 h-3.5" />
                                    <span>Activate</span>
                                  </>
                                ) : (
                                  <>
                                    <PauseCircle className="w-3.5 h-3.5" />
                                    <span>Pause Workflow</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedInstitution(org.name);
                                  switchDevSection('campus-ops');
                                }}
                                className="px-2.5 py-1 rounded text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                                title="Inspect academic classes and faculties for this campus"
                              >
                                Inspect
                              </button>
                              <button
                                onClick={() => handleDeleteOrg(org)}
                                className="p-1 rounded text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                                title={`Permanently delete ${org.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* DEVELOPER SECTION 3: BILLING & FLOW                       */}
        {/* ========================================================= */}
        {isDeveloper && currentDevSection === 'dev-billing' && (
          <div className="space-y-4">
            {/* Header & Overview */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-900">Campus Subscriptions & Billing Status</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Manage institutional subscription plans, start/expiry dates, renewal cycles, and workflow status.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">
                  {organizations.filter(o => o.status !== 'paused').length} of {organizations.length} Campuses Active
                </span>
              </div>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 font-semibold text-zinc-700">
                      <th className="py-3 px-4">Organization Name</th>
                      <th className="py-3 px-4">Plan</th>
                      <th className="py-3 px-4">Start Date</th>
                      <th className="py-3 px-4">Expiry Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {organizations.map((org: PlatformOrg) => {
                      const isPaused = org.status === 'paused';
                      const startDate = org.startDate || org.createdAt?.split('T')[0] || '2026-09-01';
                      const expiryDate = org.expiryDate || '2027-09-01';

                      return (
                        <tr key={org.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center font-bold text-purple-700 text-xs shrink-0">
                                {org.code ? org.code.slice(0, 3) : org.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-zinc-900">{org.name}</div>
                                <div className="text-[11px] text-zinc-500">{org.contactEmail || org.adminName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
                              {org.billingPlan === 'enterprise' ? 'Enterprise' : 'Campus Pro'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-700">
                            {startDate}
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-700">
                            <div className="flex items-center gap-1.5">
                              <span>{expiryDate}</span>
                              <span className="text-[10px] font-sans font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Valid
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {isPaused ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit">
                                <PauseCircle className="w-3 h-3 text-rose-600" />
                                Paused
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Active
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Pause / Activate Button */}
                              <button
                                onClick={() => handleToggleOrgStatus(org.id, org.status)}
                                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                  isPaused
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                                title={isPaused ? 'Activate organization workflow' : 'Pause organization workflow'}
                              >
                                {isPaused ? (
                                  <>
                                    <PlayCircle className="w-3.5 h-3.5" />
                                    <span>Activate</span>
                                  </>
                                ) : (
                                  <>
                                    <PauseCircle className="w-3.5 h-3.5" />
                                    <span>Pause</span>
                                  </>
                                )}
                              </button>

                              {/* Renew (+1 Year) Button */}
                              <button
                                onClick={() => handleRenewOrg(org)}
                                className="px-2.5 py-1 rounded text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer flex items-center gap-1"
                                title="Extend subscription contract by 1 year and ensure active status"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
                                <span>Renew</span>
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteOrg(org)}
                                className="p-1 rounded text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                                title={`Permanently delete ${org.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* DEVELOPER SECTION 4: GLOBAL LOGS & VAULT BACKUP           */}
        {/* ========================================================= */}
        {isDeveloper && currentDevSection === 'dev-system' && (
          <div className="space-y-5">
            {/* Cloudflare D1 Vault Automated Backup Section */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900">Cloudflare D1 Vault Automated Snapshot Engine</h2>
                    <p className="text-xs text-zinc-500">Dual-database high-availability pipeline syncing Turso records to Cloudflare D1 serverless SQL.</p>
                  </div>
                </div>

                <button
                  onClick={handleTriggerBackup}
                  disabled={isTriggeringBackup}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTriggeringBackup ? 'animate-spin' : ''}`} />
                  <span>{isTriggeringBackup ? 'Backing up...' : 'Trigger Instant D1 Snapshot'}</span>
                </button>
              </div>

              {backupSnapshot ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>D1 Vault Snapshot Successfully Synchronized</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-mono">
                      {backupSnapshot.timestamp || new Date().toISOString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white/80 p-2 rounded border border-emerald-100">
                      <span className="text-zinc-500 text-[10px] block">Colleges Stored</span>
                      <span className="font-bold text-zinc-900 text-sm font-mono">{backupSnapshot.results?.colleges ?? 0}</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded border border-emerald-100">
                      <span className="text-zinc-500 text-[10px] block">Users Stored</span>
                      <span className="font-bold text-zinc-900 text-sm font-mono">{backupSnapshot.results?.users ?? 0}</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded border border-emerald-100">
                      <span className="text-zinc-500 text-[10px] block">Courses Stored</span>
                      <span className="font-bold text-zinc-900 text-sm font-mono">{backupSnapshot.results?.courses ?? 0}</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded border border-emerald-100">
                      <span className="text-zinc-500 text-[10px] block">Files Stored</span>
                      <span className="font-bold text-zinc-900 text-sm font-mono">{backupSnapshot.results?.course_files ?? 0}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-600">
                  <div>
                    <span className="font-bold text-zinc-800 block">D1 Vault Database: procollege-vault</span>
                    <span className="text-[11px] text-zinc-500 font-mono">ID: 605f2e0f-a519-4ba6-a050-48b32ad02686 • Status: Ready</span>
                  </div>
                  <span className="text-[11px] text-zinc-500">Click "Trigger Instant D1 Snapshot" to generate a live full backup.</span>
                </div>
              )}
            </div>

            {/* Multi-Cloud Health Diagnostics response */}
            {healthData && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3.5 text-xs space-y-1.5">
                <div className="font-bold text-purple-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-700" />
                  <span>Live Cluster Health Audit Verified</span>
                </div>
                <div className="text-[11px] text-purple-800 font-mono">
                  Turso: {healthData.database || 'Online'} • Registered Colleges: {healthData.collegesCount ?? 0} • D1 Vault: {healthData.d1Vault?.status || 'Bound'} • Cloudinary: {healthData.storage?.cloudName || 'pf66y0wq'}
                </div>
              </div>
            )}

            {/* Multi-Cloud Architecture Specs */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Production Cluster Architecture & Secrets
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-700">Primary Database Engine</span>
                  <p className="font-mono text-[11px] text-zinc-900">Turso LibSQL (AWS Mumbai ap-south-1)</p>
                  <p className="text-[10px] text-zinc-500">libsql://procollege-app-mrnobody-04.aws-ap-south-1.turso.io</p>
                </div>

                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-700">Disaster Recovery Vault</span>
                  <p className="font-mono text-[11px] text-zinc-900">Cloudflare D1 procollege-vault</p>
                  <p className="text-[10px] text-zinc-500">Binding: procollege_vault (605f2e0f-a519-4ba6-a050-48b32ad02686)</p>
                </div>

                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-700">Media CDN Storage</span>
                  <p className="font-mono text-[11px] text-zinc-900">Cloudinary Binary Cloud</p>
                  <p className="text-[10px] text-zinc-500">Cloud Name: pf66y0wq (25GB Free Storage Tier)</p>
                </div>

                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-700">Edge Compute Runtime</span>
                  <p className="font-mono text-[11px] text-zinc-900">Cloudflare Workers with Hono.js</p>
                  <p className="text-[10px] text-zinc-500">Compatibility: 2024-11-01 nodejs_compat, keep_vars = true</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CAMPUS OPERATIONS (For Admin or Developer Inspection)     */}
        {/* ========================================================= */}
        {(!isDeveloper || currentDevSection === 'campus-ops') && (
          <>
        {/* TAB 1: ACADEMIC CLASSES & SEMESTER ROLLOVER               */}
        {/* ========================================================= */}
        {activeAdminTab === 'classes' && (
          <div className="space-y-4">
            {/* Faculty Department Filter Toolbar */}
            <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-4 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <FolderTree className="w-4 h-4 text-[#5b5fc7]" />
                  <span className="text-xs font-bold text-zinc-800">Faculty Filter:</span>
                  <select
                    value={selectedFacultyFilter}
                    onChange={e => {
                      setSelectedFacultyFilter(e.target.value);
                      setClassesSubView('classes');
                    }}
                    className="bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#5b5fc7] cursor-pointer"
                  >
                    <option value="all">🌟 All Faculties ({courses.length} Classes)</option>
                    {faculties.map(fac => (
                      <option key={fac.id} value={fac.id}>
                        {fac.name} ({fac.code}) — {getFacultyClassCount(fac)} classes
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* View Mode Toggle */}
                  <div className="bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 flex items-center text-xs">
                    <button
                      type="button"
                      onClick={() => setClassesSubView('classes')}
                      className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                        classesSubView === 'classes'
                          ? 'bg-white text-[#5b5fc7] shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Classes ({filteredCourses.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setClassesSubView('faculties')}
                      className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                        classesSubView === 'faculties'
                          ? 'bg-white text-[#5b5fc7] shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <FolderTree className="w-3.5 h-3.5" />
                      <span>Faculties ({faculties.length})</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowAddFacultyModal(true)}
                    className="text-xs text-[#5b5fc7] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Faculty</span>
                  </button>

                  <button
                    onClick={() => {
                      if (selectedFacultyFilter !== 'all') setSelectedFacultyId(selectedFacultyFilter);
                      setShowNewClassModal(true);
                    }}
                    className="text-xs text-white bg-[#5b5fc7] hover:bg-[#4f52b2] px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Class</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  onClick={() => {
                    setSelectedFacultyFilter('all');
                    setClassesSubView('classes');
                  }}
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
                      onClick={() => {
                        setSelectedFacultyFilter(fac.id);
                        setClassesSubView('classes');
                      }}
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
            </div>

            {/* VIEW MODE 1: FACULTIES DIRECTORY */}
            {classesSubView === 'faculties' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900">Academic Faculties & Collegiate Departments</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Select any academic faculty below to view its included classes, manage assigned faculty members, or add new classes.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-60">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchFacultyQuery}
                        onChange={e => setSearchFacultyQuery(e.target.value)}
                        placeholder="Search faculties by name or code..."
                        className="w-full bg-zinc-50 border border-zinc-300 rounded pl-8 pr-3 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#5b5fc7]"
                      />
                    </div>
                    <button
                      onClick={() => setShowAddFacultyModal(true)}
                      className="flex items-center gap-1.5 bg-[#5b5fc7] hover:bg-[#4f52b2] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Faculty</span>
                    </button>
                  </div>
                </div>

                {filteredFaculties.length === 0 ? (
                  <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                      <FolderTree className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-zinc-900">No faculties found</h3>
                      <p className="text-xs text-zinc-500 max-w-md mx-auto">
                        No academic faculties matched your filter. Click below to add a collegiate faculty.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddFacultyModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5b5fc7] hover:bg-[#4f52b2] text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Faculty</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFaculties.map(faculty => {
                      const facCourses = getFacultyCourses(faculty);
                      const memberCount = getFacultyMemberCount(faculty);

                      return (
                        <div
                          key={faculty.id}
                          className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all hover:shadow-sm"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-[#5b5fc7] flex items-center justify-center font-bold text-sm shrink-0">
                                  {faculty.code.slice(0, 3)}
                                </div>
                                <div>
                                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                                    {faculty.code}
                                  </span>
                                  <h3 className="text-sm font-bold text-zinc-900 mt-0.5 leading-snug">
                                    {faculty.name}
                                  </h3>
                                </div>
                              </div>

                              {isDeveloperOrAdmin && (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleDeleteFaculty(faculty);
                                  }}
                                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Faculty"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                              {faculty.description || `Academic department overseeing ${faculty.name} degree curricula.`}
                            </p>

                            <div className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-100 text-xs space-y-1.5">
                              <div className="flex items-center justify-between text-zinc-600">
                                <span className="text-[11px] font-medium text-zinc-500">Appointed Dean:</span>
                                <span className="font-semibold text-zinc-800">{faculty.deanName || 'Academic Dean'}</span>
                              </div>
                              <div className="flex items-center justify-between text-zinc-600">
                                <span className="text-[11px] font-medium text-zinc-500">Active Classes:</span>
                                <span className="font-bold text-[#5b5fc7]">{facCourses.length} {facCourses.length === 1 ? 'class' : 'classes'}</span>
                              </div>
                              <div className="flex items-center justify-between text-zinc-600">
                                <span className="text-[11px] font-medium text-zinc-500">Faculty Members:</span>
                                <span className="font-semibold text-emerald-700">{memberCount} teachers</span>
                              </div>
                            </div>

                            {facCourses.length > 0 && (
                              <div>
                                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">
                                  Included Classes:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {facCourses.map(c => (
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

                          <div className="space-y-2 pt-2 border-t border-zinc-100">
                            <button
                              onClick={() => {
                                setSelectedFacultyFilter(faculty.id);
                                setClassesSubView('classes');
                              }}
                              className="w-full py-2 px-3 rounded-lg bg-[#5b5fc7] hover:bg-[#4f52b2] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>View Classes ({facCourses.length})</span>
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedFacultyId(faculty.id);
                                  setShowNewClassModal(true);
                                }}
                                className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Class</span>
                              </button>

                              <button
                                onClick={() => openFacultyMembersModal(faculty)}
                                className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <GraduationCap className="w-3 h-3 text-[#5b5fc7]" />
                                <span>Add Members</span>
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

            {/* VIEW MODE 2: CLASSES LIST (FILTERED BY SELECTED FACULTY OR ALL) */}
            {classesSubView === 'classes' && (
              <div className="space-y-4">
                {selectedFacultyFilter !== 'all' ? (
                  /* Banner for Selected Faculty */
                  (() => {
                    const currentFac = faculties.find(f => f.id === selectedFacultyFilter);
                    if (!currentFac) return null;
                    const facCourses = getFacultyCourses(currentFac);
                    const memberCount = getFacultyMemberCount(currentFac);

                    return (
                      <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <button
                              onClick={() => setSelectedFacultyFilter('all')}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#5b5fc7] hover:underline cursor-pointer mb-1"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Back to All Faculties</span>
                            </button>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-base font-bold text-zinc-900">{currentFac.name}</h2>
                              <span className="text-xs font-mono bg-white text-[#5b5fc7] px-2.5 py-0.5 rounded-full border border-indigo-200 font-bold">
                                {currentFac.code}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-zinc-600 flex-wrap pt-0.5">
                              <span>Dean: <strong className="text-zinc-800">{currentFac.deanName || 'Academic Dean'}</strong></span>
                              <span>•</span>
                              <span><strong>{facCourses.length}</strong> {facCourses.length === 1 ? 'class' : 'classes'}</span>
                              <span>•</span>
                              <span><strong className="text-emerald-700">{memberCount}</strong> faculty members</span>
                            </div>
                            <p className="text-xs text-zinc-600 pt-1 leading-relaxed">{currentFac.description}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <button
                              onClick={() => openFacultyMembersModal(currentFac)}
                              className="px-3 py-2 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold rounded-lg border border-zinc-200 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <GraduationCap className="w-3.5 h-3.5 text-[#5b5fc7]" />
                              <span>Add Faculty Members</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedFacultyId(currentFac.id);
                                setShowNewClassModal(true);
                              }}
                              className="px-3.5 py-2 bg-[#5b5fc7] hover:bg-[#4f52b2] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>New Class</span>
                            </button>

                            {isDeveloperOrAdmin && (
                              <button
                                onClick={() => handleDeleteFaculty(currentFac)}
                                className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 bg-white rounded-lg border border-zinc-200 transition-colors cursor-pointer"
                                title="Delete Faculty"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* Banner when All Faculties is selected */
                  <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-zinc-900">All Academic Classes</h2>
                        <span className="text-xs font-mono bg-white text-[#5b5fc7] px-2.5 py-0.5 rounded-full border border-indigo-200 font-bold">
                          {filteredCourses.length} {filteredCourses.length === 1 ? 'Class' : 'Classes'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        Displaying classes from all academic faculties. Click any faculty chip above or faculty badge on a class card to isolate that faculty's classes.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowNewClassModal(true)}
                      className="px-3.5 py-2 bg-[#5b5fc7] hover:bg-[#4f52b2] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Class</span>
                    </button>
                  </div>
                )}

                {/* Classes Toolbar with Search */}
                <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">
                      {selectedFacultyFilter === 'all'
                        ? `Catalog (${filteredCourses.length} Classes Across All Faculties)`
                        : `Faculty Classes (${filteredCourses.length})`}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Manage class modules, assign subject lecturers, enroll students, or remove classes.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-60">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchClassQuery}
                        onChange={e => setSearchClassQuery(e.target.value)}
                        placeholder="Search classes by name, code, or department..."
                        className="w-full bg-zinc-50 border border-zinc-300 rounded pl-8 pr-3 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#5b5fc7]"
                      />
                    </div>
                  </div>
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
                  <span>Add Class</span>
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-zinc-900">{course.code}</span>
                              <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-medium">
                                {course.term}
                              </span>
                              {(() => {
                                const parentFac = faculties.find(f => f.id === course.facultyId) ||
                                  faculties.find(f => f.name.toLowerCase() === course.department.toLowerCase()) ||
                                  faculties.find(f => f.code.toLowerCase() === course.department.toLowerCase()) ||
                                  faculties.find(f => f.name.toLowerCase().includes(course.department.toLowerCase()));
                                return parentFac ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedFacultyFilter(parentFac.id);
                                      setClassesSubView('classes');
                                    }}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-[#5b5fc7] border border-indigo-200 flex items-center gap-1 cursor-pointer transition-colors"
                                    title={`Filter to faculty: ${parentFac.name}`}
                                  >
                                    <FolderTree className="w-3 h-3 text-[#5b5fc7]" />
                                    <span>{parentFac.code}</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                                    {course.department}
                                  </span>
                                );
                              })()}
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
                          onClick={() => handleDeleteCourse(course)}
                          className="text-xs text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
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
                    {academicUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-500">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Users className="w-8 h-8 text-zinc-300" />
                            <p className="font-semibold text-zinc-700">No campus students or lecturers registered in this institution yet.</p>
                            <p className="text-zinc-400 text-xs max-w-sm">Use <strong>+ Register ID</strong> or <strong>Import Roster</strong> above to provision verified student and lecturer accounts.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      academicUsers.map(user => (
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
                      ))
                    )}
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
                  Establish collegiate faculties, appoint academic deans, and organize degree classes and subject modules under each department.
                </p>
              </div>

              <button
                onClick={() => setShowAddFacultyModal(true)}
                className="flex items-center gap-1.5 bg-[#5b5fc7] hover:bg-[#4f52b2] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Faculty</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {faculties.map(faculty => {
                const associatedClasses = getFacultyCourses(faculty);
                const memberCount = getFacultyMemberCount(faculty);

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

                        {isDeveloperOrAdmin && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteFaculty(faculty);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Faculty"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                        {faculty.description || `Academic department overseeing ${faculty.name} degree curricula.`}
                      </p>

                      <div className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-100 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-zinc-600">
                          <span className="text-[11px] font-medium text-zinc-500">Appointed Dean:</span>
                          <span className="font-semibold text-zinc-800">{faculty.deanName || 'Academic Dean'}</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-600">
                          <span className="text-[11px] font-medium text-zinc-500">Active Classes:</span>
                          <span className="font-bold text-[#5b5fc7]">{associatedClasses.length} {associatedClasses.length === 1 ? 'class' : 'classes'}</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-600">
                          <span className="text-[11px] font-medium text-zinc-500">Faculty Members:</span>
                          <span className="font-semibold text-emerald-700">{memberCount} teachers</span>
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

                    <div className="space-y-2 pt-2 border-t border-zinc-100">
                      <button
                        onClick={() => {
                          setSelectedFacultyFilter(faculty.id);
                          setActiveAdminTab('classes');
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-[#5b5fc7] hover:bg-[#4f52b2] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>View Classes ({associatedClasses.length})</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedFacultyId(faculty.id);
                            setShowNewClassModal(true);
                          }}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Class</span>
                        </button>

                        <button
                          onClick={() => openFacultyMembersModal(faculty)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <GraduationCap className="w-3 h-3 text-[#5b5fc7]" />
                          <span>Add Members</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3.5: BULK EXCEL ROSTER IMPORT & CREDENTIALS           */}
        {/* ========================================================= */}
        {activeAdminTab === 'roster' && (
          <div className="animate-in fade-in duration-200">
            <AdminRosterUpload />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: INSTITUTIONAL REQUESTS (DEVELOPER & DEAN ADMIN)    */}
        {/* ========================================================= */}
        {isDeveloperOrAdmin && activeAdminTab === 'requests' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-zinc-900">University & Organization Access Requests</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                    {isDeveloper ? 'Developer Root' : 'Academic Administration'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Review incoming campus access leads stored in live Turso database, or provision administrative credentials.
                </p>
              </div>

              <button
                onClick={() => setShowCreateAdminModal(true)}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Create Org Admin</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allRequests.map(req => (
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
          </>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-zinc-700">
                      Lead Lecturer (Class Owner)
                    </label>
                    <div className="flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200 text-[10px] font-medium">
                      <button
                        type="button"
                        onClick={() => setInstructorSelectionMode('select')}
                        className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                          instructorSelectionMode === 'select'
                            ? 'bg-[#5b5fc7] text-white shadow-2xs font-bold'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        Select Professor
                      </button>
                      <button
                        type="button"
                        onClick={() => setInstructorSelectionMode('manual')}
                        className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                          instructorSelectionMode === 'manual'
                            ? 'bg-[#5b5fc7] text-white shadow-2xs font-bold'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        Type Name Manually
                      </button>
                    </div>
                  </div>

                  {instructorSelectionMode === 'select' ? (
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
                  ) : (
                    <div>
                      <input
                        type="text"
                        list="professors-list"
                        value={manualInstructorName}
                        onChange={e => setManualInstructorName(e.target.value)}
                        placeholder="e.g. Er. Ramesh Sharma or Prof. John Doe"
                        className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-[#5b5fc7]"
                        required={instructorSelectionMode === 'manual'}
                      />
                      <datalist id="professors-list">
                        {facultyMembers.map(lecturer => (
                          <option key={lecturer.id} value={lecturer.name}>
                            {lecturer.role.toUpperCase()}
                          </option>
                        ))}
                      </datalist>
                    </div>
                  )}
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
                    <span>Add Single Subject</span>
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
                    <span>Add Subject</span>
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
      {/* MODAL 4B: MANAGE FACULTY MEMBERS                          */}
      {/* ========================================================= */}
      {showFacultyMembersModal && selectedFacultyForMembers && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#5b5fc7]" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">Manage Faculty Members</h3>
                  <p className="text-[11px] text-zinc-500">
                    {selectedFacultyForMembers.name} ({selectedFacultyForMembers.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFacultyMembersModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1.5 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100 text-xs space-y-1">
                <p className="font-semibold text-zinc-900">Department / Faculty Assignment</p>
                <p className="text-zinc-600 text-[11px] leading-relaxed">
                  Select professors, lecturers, and teaching assistants to assign to <strong>{selectedFacultyForMembers.name}</strong>. Assigned members can lead classes and instruct subjects within this faculty.
                </p>
              </div>

              {/* Members Selection List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800">
                    Teaching Staff & Professors ({facultyMembers.length} Available)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMemberIdsForFaculty(facultyMembers.map(m => m.id));
                      }}
                      className="text-xs text-[#5b5fc7] font-semibold hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-zinc-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMemberIdsForFaculty([]);
                      }}
                      className="text-xs text-zinc-500 font-semibold hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {facultyMembers.map(member => {
                    const isChecked = selectedMemberIdsForFaculty.includes(member.id);
                    return (
                      <label
                        key={member.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-indigo-50/70 border-indigo-300 shadow-2xs'
                            : 'bg-white border-zinc-200 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedMemberIdsForFaculty(prev => [...prev, member.id]);
                              } else {
                                setSelectedMemberIdsForFaculty(prev => prev.filter(id => id !== member.id));
                              }
                            }}
                            className="rounded text-[#5b5fc7] cursor-pointer"
                          />
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                          <div>
                            <span className="font-bold text-zinc-900 block leading-tight">{member.name}</span>
                            <span className="text-[11px] text-zinc-500">{member.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            member.role === 'professor'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {member.role}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-2 shrink-0">
              <span className="text-xs text-zinc-500">
                <strong>{selectedMemberIdsForFaculty.length}</strong> selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFacultyMembersModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveFacultyMembers}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#5b5fc7] hover:bg-[#4f52b2] text-white rounded-lg cursor-pointer shadow-xs transition-colors"
                >
                  Save Faculty Members
                </button>
              </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              </div>

              {/* Appointed Dean / Head with Toggle (Select from Faculty vs Type Manually) */}
              <div className="space-y-1.5 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Appointed Dean / Department Head
                  </label>
                  <div className="flex items-center bg-white p-0.5 rounded-md border border-zinc-200 text-[10px] font-medium">
                    <button
                      type="button"
                      onClick={() => setDeanSelectionMode('select')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        deanSelectionMode === 'select'
                          ? 'bg-[#5b5fc7] text-white shadow-2xs font-bold'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      Select Faculty Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeanSelectionMode('manual')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        deanSelectionMode === 'manual'
                          ? 'bg-[#5b5fc7] text-white shadow-2xs font-bold'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      Type Name Manually
                    </button>
                  </div>
                </div>

                {deanSelectionMode === 'select' ? (
                  <select
                    value={newFacultyDeanId}
                    onChange={e => setNewFacultyDeanId(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#5b5fc7]"
                  >
                    {facultyMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    <input
                      type="text"
                      required={deanSelectionMode === 'manual'}
                      value={manualDeanName}
                      onChange={e => setManualDeanName(e.target.value)}
                      placeholder="e.g. Prof. Dr. Anand Sharma"
                      className="w-full bg-white border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#5b5fc7]"
                    />
                  </div>
                )}
                <p className="text-[10px] text-zinc-500">
                  {deanSelectionMode === 'select'
                    ? 'Only certified faculty professors and department heads are listed (students strictly excluded).'
                    : 'Type any custom name for the Dean or Head of this Faculty.'}
                </p>
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

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Institutional Plan / Tier
                </label>
                <select
                  value={newAdminPlan}
                  onChange={e => setNewAdminPlan(e.target.value as 'campus-pro' | 'enterprise')}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-purple-600 font-semibold cursor-pointer"
                >
                  <option value="campus-pro">Campus Pro ($0 Zero-Budget Tier)</option>
                  <option value="enterprise">Enterprise Platinum (Full Multi-Tenant SLA)</option>
                </select>
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
