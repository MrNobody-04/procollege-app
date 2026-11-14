import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  ExternalLink,
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
  Search,
  Sparkles,
  Key,
  FolderTree,
  Megaphone,
  ClipboardList,
  FileSpreadsheet,
  Globe,
  CreditCard,
  Database,
  Shield,
  ShieldCheck,
  RefreshCw,
  Mail,
  Send,
  AlertTriangle,
  Copy
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
  adminCount?: number;
  admins?: Array<{ id: string; name: string; email: string; department?: string; createdAt?: string }>;
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
    setSelectedCourse,
    setSelectedChannel,
    deleteChannel,
    institutionalRequests,
    provisionInstitutionalRequest,
    registerUserByAdmin,
    addChannel,
    enrollStudentsToCourse,
    removeStudentFromCourse,
    rolloverCourseToNextSemester,
    setActiveTab,
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
    deleteOrganization,
    updateChannelLecturer,
    fetchInstitutionAdmins,
    appointInstitutionAdmin,
    resetInstitutionAdminPassword,
    removeInstitutionAdmin
  } = useApp();

  const isDeveloper = currentUser.role === 'developer' || currentUser.role === 'platform_admin';
  const isDeveloperOrAdmin = isDeveloper || currentUser.role === 'admin';

  // Dedicated Developer Navigation Section - seamlessly kept in sync with activeTab
  const [currentDevSection, setCurrentDevSection] = useState<ActiveTab | 'campus-ops' | 'dev-email'>(
    activeTab?.startsWith('dev-') ? activeTab : (activeDevTab?.startsWith('dev-') ? activeDevTab : 'dev-overview')
  );

  useEffect(() => {
    if (activeTab?.startsWith('dev-')) {
      setCurrentDevSection(activeTab);
    }
  }, [activeTab]);

  const switchDevSection = (section: ActiveTab | 'campus-ops' | 'dev-email') => {
    setCurrentDevSection(section);
    if (section !== 'campus-ops' && section !== 'dev-email') {
      setActiveTab(section);
    }
  };

  // Developer Platform 2FA Email Gateway State
  const [emailSettings, setEmailSettings] = useState<{
    provider: string;
    apiKey: string;
    senderEmail: string;
    senderName: string;
    relayUrl: string;
    hasEnvKey?: boolean;
  }>({
    provider: 'relay',
    apiKey: '',
    senderEmail: 'security@procollege.edu.np',
    senderName: 'ProCollege Security',
    relayUrl: '',
    hasEnvKey: false
  });
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [isLoadingEmailSettings, setIsLoadingEmailSettings] = useState(false);
  const [isSavingEmailSettings, setIsSavingEmailSettings] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState(currentUser.email || 'gcsujan321@gmail.com');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string; provider?: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState<'all' | 'delivered' | 'failed'>('all');
  const [copiedOtpId, setCopiedOtpId] = useState<string | null>(null);

  const handleCopyOtp = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedOtpId(id);
    setTimeout(() => setCopiedOtpId(null), 2000);
  };

  const filteredEmailLogs = useMemo(() => {
    return emailLogs.filter((log: any) => {
      const matchesStatus = logStatusFilter === 'all' || log.status === logStatusFilter;
      const q = logSearchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        (log.recipient_email || '').toLowerCase().includes(q) ||
        (log.recipient_name || '').toLowerCase().includes(q) ||
        (log.otp_code || '').toLowerCase().includes(q) ||
        (log.provider || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [emailLogs, logStatusFilter, logSearchQuery]);

  const deliveredCount = useMemo(() => emailLogs.filter((l: any) => l.status === 'delivered').length, [emailLogs]);
  const failedCount = useMemo(() => emailLogs.filter((l: any) => l.status === 'failed').length, [emailLogs]);

  const fetchEmailSettings = async () => {
    setIsLoadingEmailSettings(true);
    try {
      const token = localStorage.getItem('procollege_token') || '';
      const [settingsRes, logsRes] = await Promise.all([
        fetch('/api/platform/email-settings', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/platform/email-logs', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setEmailSettings(data);
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        setEmailLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Failed to fetch email settings:', err);
    } finally {
      setIsLoadingEmailSettings(false);
    }
  };

  useEffect(() => {
    if (isDeveloper && currentDevSection === 'dev-email') {
      fetchEmailSettings();
    }
  }, [isDeveloper, currentDevSection]);

  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEmailSettings(true);
    try {
      const token = localStorage.getItem('procollege_token') || '';
      const res = await fetch('/api/platform/email-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(emailSettings)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update email settings');
      showDialog('2FA Email Gateway settings saved successfully!', { type: 'success', title: 'Settings Updated' });
      fetchEmailSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showDialog(`Failed to save settings: ${msg}`, { type: 'error', title: 'Update Error' });
    } finally {
      setIsSavingEmailSettings(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailTarget.trim()) return;
    setIsSendingTestEmail(true);
    setTestEmailResult(null);
    try {
      const token = localStorage.getItem('procollege_token') || '';
      const res = await fetch('/api/platform/send-test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: testEmailTarget.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Test email failed');
      }
      setTestEmailResult({
        success: true,
        message: data.message,
        provider: data.provider
      });
      fetchEmailSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestEmailResult({
        success: false,
        message: msg
      });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  // Developer Platform Organizations State
  const [organizations, setOrganizations] = useState<PlatformOrg[]>([]);
  const [searchOrgQuery, setSearchOrgQuery] = useState('');
  const [newAdminPlan, setNewAdminPlan] = useState<'campus-pro' | 'enterprise'>('campus-pro');
  const [backupSnapshot, setBackupSnapshot] = useState<{
    timestamp?: string;
    results?: { colleges?: number; users?: number; courses?: number; course_files?: number };
  } | null>(null);
  const [isTriggeringBackup, setIsTriggeringBackup] = useState(false);

  // Platform Admin Issued Credentials & Reset Confirmation State
  const [issuedCredsModal, setIssuedCredsModal] = useState<{
    title: string;
    institutionName: string;
    adminEmail: string;
    adminName: string;
    loginId?: string;
    temporaryPassword: string;
  } | null>(null);
  const [confirmResetOrg, setConfirmResetOrg] = useState<PlatformOrg | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Multi-Admin Management Modal State (for Developer Admin managing multiple Institutional Admins per organization)
  const [selectedOrgForAdmins, setSelectedOrgForAdmins] = useState<PlatformOrg | null>(null);
  const [orgAdminsList, setOrgAdminsList] = useState<any[]>([]);
  const [isLoadingOrgAdmins, setIsLoadingOrgAdmins] = useState(false);
  const [showAddAdminSubModal, setShowAddAdminSubModal] = useState(false);
  const [newAdminSubName, setNewAdminSubName] = useState('');
  const [newAdminSubEmail, setNewAdminSubEmail] = useState('');
  const [newAdminSubDept, setNewAdminSubDept] = useState('Campus Administration');
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [newAdminIssuedResult, setNewAdminIssuedResult] = useState<any | null>(null);

  const loadOrgAdmins = async (orgId: string) => {
    setIsLoadingOrgAdmins(true);
    try {
      const list = await fetchInstitutionAdmins(orgId);
      setOrgAdminsList(list);
    } catch {
      setOrgAdminsList([]);
    } finally {
      setIsLoadingOrgAdmins(false);
    }
  };

  const handleOpenManageAdmins = (org: PlatformOrg) => {
    setSelectedOrgForAdmins(org);
    setShowAddAdminSubModal(false);
    setNewAdminIssuedResult(null);
    loadOrgAdmins(org.id);
  };

  const handleAppointAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgForAdmins || !newAdminSubName.trim() || !newAdminSubEmail.trim()) return;
    setIsSubmittingAdmin(true);
    try {
      const res = await appointInstitutionAdmin(selectedOrgForAdmins.id, {
        name: newAdminSubName.trim(),
        email: newAdminSubEmail.trim().toLowerCase(),
        department: newAdminSubDept.trim()
      });
      setNewAdminIssuedResult(res.admin);
      setShowAddAdminSubModal(false);
      setNewAdminSubName('');
      setNewAdminSubEmail('');
      loadOrgAdmins(selectedOrgForAdmins.id);
      fetchOrganizations();
      showDialog(`Institutional Admin "${res.admin.name}" appointed successfully for ${selectedOrgForAdmins.name}.`, {
        type: 'success',
        title: 'Admin Appointed'
      });
    } catch (err: any) {
      showDialog(err.message || 'Failed to appoint admin', { type: 'alert', title: 'Error' });
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleResetAdminCredentials = async (adminId: string, adminName: string) => {
    if (!selectedOrgForAdmins) return;
    try {
      const res = await resetInstitutionAdminPassword(selectedOrgForAdmins.id, adminId);
      showDialog(`Credentials reset for ${adminName}. New temporary password: ${res.temporaryPassword}. A 2FA verification code has been dispatched to their email.`, {
        type: 'success',
        title: 'Credentials Reset'
      });
      loadOrgAdmins(selectedOrgForAdmins.id);
    } catch (err: any) {
      showDialog(err.message || 'Failed to reset credentials', { type: 'alert', title: 'Error' });
    }
  };

  const handleRemoveAdmin = async (adminId: string, adminName: string) => {
    if (!selectedOrgForAdmins) return;
    if (orgAdminsList.length <= 1) {
      showDialog('Cannot remove the sole administrator. Every institution must retain at least one Institutional Admin.', {
        type: 'alert',
        title: 'Removal Blocked'
      });
      return;
    }
    try {
      await removeInstitutionAdmin(selectedOrgForAdmins.id, adminId);
      showDialog(`Administrator "${adminName}" removed from ${selectedOrgForAdmins.name}.`, {
        type: 'success',
        title: 'Admin Removed'
      });
      loadOrgAdmins(selectedOrgForAdmins.id);
      fetchOrganizations();
    } catch (err: any) {
      showDialog(err.message || 'Failed to remove admin', { type: 'alert', title: 'Error' });
    }
  };

  // Primary Tab for Campus Admin (Classes, Faculties, Users, Roster, Requests, Roles)
  const [activeAdminTab, setActiveAdminTab] = useState<'classes' | 'faculties' | 'users' | 'roster' | 'requests' | 'roles'>('classes');
  const [dbRequests, setDbRequests] = useState<InstitutionalRequest[]>([]);
  const [searchClassQuery, setSearchClassQuery] = useState('');
  const [addSubjectModalCourse, setAddSubjectModalCourse] = useState<CourseTeam | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectDesc, setNewSubjectDesc] = useState('');
  const [newSubjectLecturerId, setNewSubjectLecturerId] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'lecturer' | 'student'>('all');
  const [searchUserQuery, setSearchUserQuery] = useState('');

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
        setOrganizations([]);
      }
    } catch {
      setOrganizations([]);
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

  const executeResetAdminPassword = async (org: PlatformOrg) => {
    setIsResettingPassword(true);
    try {
      const token = localStorage.getItem('procollege_token') || '';
      const res = await fetch(`/api/platform/institutions/${encodeURIComponent(org.id)}/reset-admin-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset administrator credentials');
      }

      setConfirmResetOrg(null);
      setIssuedCredsModal({
        title: 'Administrator Password Reset',
        institutionName: data.institutionName || org.name,
        adminEmail: data.adminEmail,
        adminName: data.adminName,
        temporaryPassword: data.temporaryPassword,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showDialog(`Reset failed: ${msg}`, { type: 'error' });
    } finally {
      setIsResettingPassword(false);
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
  // Dedicated Assign Lecturer Modal & Collapsible Departments State
  const [assignLecturerModal, setAssignLecturerModal] = useState<{
    isOpen: boolean;
    course: CourseTeam;
    channel?: Channel;
  } | null>(null);
  const [modalTargetChannelId, setModalTargetChannelId] = useState<string>('all');

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
  const [extraOrgAdmins, setExtraOrgAdmins] = useState<Array<{ name: string; email: string; department: string }>>([]);

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
  const [showFacultyMembersModal, setShowFacultyMembersModal] = useState<boolean>(false);
  const [selectedFacultyForMembers, setSelectedFacultyForMembers] = useState<FacultyDepartment | null>(null);
  const [selectedMemberIdsForFaculty, setSelectedMemberIdsForFaculty] = useState<string[]>([]);

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
          institutionName: currentUser?.institutionName || 'Academic Institution',
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
          plan: newAdminPlan,
          additionalAdmins: extraOrgAdmins.filter(a => a.name.trim() && a.email.trim())
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
      setExtraOrgAdmins([]);

      setIssuedCredsModal({
        title: 'Institutional Administrator Created',
        institutionName: data.institution.name,
        adminEmail: data.admin.email,
        adminName: data.admin.name,
        loginId: data.admin.loginId,
        temporaryPassword: data.admin.temporaryPassword,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showDialog(`Provisioning failed: ${msg}`, { type: 'error' });
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


  const handleAddSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSubjectModalCourse || !newSubjectName.trim()) return;

    const lect = facultyMembers.find(f => f.id === newSubjectLecturerId) ||
      (newSubjectLecturerId === addSubjectModalCourse.instructor?.id ? addSubjectModalCourse.instructor : null);

    const fullName = newSubjectCode.trim()
      ? `${newSubjectName.trim()} [${newSubjectCode.trim().toUpperCase()}]`
      : newSubjectName.trim();

    addChannel(addSubjectModalCourse.id, {
      name: fullName,
      description: newSubjectDesc.trim() || `Subject Module: ${newSubjectName.trim()}`,
      subjectLecturerName: lect ? lect.name : undefined,
      subjectLecturerId: lect ? lect.id : undefined
    });

    showDialog(`Subject "${fullName}" added to ${addSubjectModalCourse.name}.`, {
      type: 'success',
      title: 'Subject Added'
    });

    setAddSubjectModalCourse(null);
    setNewSubjectName('');
    setNewSubjectCode('');
    setNewSubjectDesc('');
    setNewSubjectLecturerId('');
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
    // 1. Filter by department if selected
    if (selectedFacultyFilter !== 'all') {
      const fac = faculties.find(f => f.id === selectedFacultyFilter);
      if (fac) {
        const matchId = (c.departmentId && c.departmentId === fac.id) || (c.facultyId && c.facultyId === fac.id);
        const matchName = c.department && c.department.toLowerCase() === fac.name.toLowerCase();
        const matchCode = c.department && fac.code && c.department.toLowerCase().includes(fac.code.toLowerCase());
        const matchInclude = c.department && fac.name && fac.name.toLowerCase().includes(c.department.toLowerCase());
        if (!matchId && !matchName && !matchCode && !matchInclude) {
          return false;
        }
      }
    }

    // 2. Filter by search query
    if (searchClassQuery.trim()) {
      const q = searchClassQuery.toLowerCase().trim();
      const matchName = c.name.toLowerCase().includes(q);
      const matchCode = c.code.toLowerCase().includes(q);
      const matchDept = c.department.toLowerCase().includes(q);
      const matchLecturer = c.instructor?.name?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDept && !matchLecturer) {
        return false;
      }
    }

    return true;
  });

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

  const handleAssignLecturerConfirm = (lecturer: User) => {
    if (!assignLecturerModal) return;
    const { course, channel } = assignLecturerModal;

    if (channel) {
      updateChannelLecturer(course.id, channel.id, lecturer.id, lecturer.name);
      showDialog(`Assigned ${lecturer.name} to ${channel.name} (${course.name}).`, {
        type: 'success',
        title: 'Lecturer Assigned'
      });
    } else {
      if (modalTargetChannelId === 'all') {
        course.channels.forEach(ch => {
          updateChannelLecturer(course.id, ch.id, lecturer.id, lecturer.name);
        });
        showDialog(`Assigned ${lecturer.name} as lead lecturer across all subjects in ${course.name}.`, {
          type: 'success',
          title: 'Lecturers Assigned'
        });
      } else {
        const targetCh = course.channels.find(ch => ch.id === modalTargetChannelId);
        if (targetCh) {
          updateChannelLecturer(course.id, targetCh.id, lecturer.id, lecturer.name);
          showDialog(`Assigned ${lecturer.name} to ${targetCh.name}.`, {
            type: 'success',
            title: 'Lecturer Assigned'
          });
        }
      }
    }
    setAssignLecturerModal(null);
  };

  const renderExactClassCard = (course: CourseTeam, _isRightColumn?: boolean) => {
    const enrolled = course.enrolledStudents && course.enrolledStudents.length > 0
      ? course.enrolledStudents
      : (academicUsers.filter(u => u.role === 'student').length > 0
          ? academicUsers.filter(u => u.role === 'student').slice(0, 3)
          : []);

    // Show Announcements + all subject modules
    const allChannels: Channel[] = course.channels && course.channels.length > 0
      ? course.channels
      : [{
          id: `ch_${course.id}_gen`,
          name: 'Announcements',
          isGeneral: true,
          courseId: course.id,
          description: `${course.name} Announcements Noticeboard`,
          unreadCount: 0,
          studentFilePermission: 'read-only',
          subjectLecturerName: course.instructor?.name,
          subjectLecturerId: course.instructor?.id
        }];

    return (
      <div key={course.id} className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-4 sm:p-5 space-y-4 hover:border-zinc-300 transition-all min-w-0">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-zinc-900 leading-tight">
                {course.name || course.code}
              </h3>
              {course.department && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-[#26394D] border border-indigo-100">
                  {course.department}
                </span>
              )}
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-1 flex items-center gap-1.5 flex-wrap">
              <span>Lead Lecturer:</span>
              <span className="text-zinc-800 font-semibold">{course.instructor?.name || 'Lead Instructor'}</span>
              {course.term && <span className="text-zinc-400">• {course.term}</span>}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => openRolloverForCourse(course)}
              className="p-1.5 text-zinc-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
              title="Rollover class to next semester"
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteCourse(course)}
              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete class and all its channels"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Enrolled Students Section */}
        <div className="space-y-1.5 bg-zinc-50/70 p-3 rounded-lg border border-zinc-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700">
              Enrolled Students ({enrolled.length})
            </span>
            <button
              onClick={() => {
                setSelectedCourseForAction(course);
                setShowManageStudentsModal(true);
              }}
              className="text-[11px] text-[#26394D] hover:underline font-semibold cursor-pointer"
            >
              Manage Students
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {enrolled.map((student: any) => (
              <span
                key={student.id || student.name}
                className="inline-flex items-center gap-1.5 bg-white border border-zinc-200 px-2.5 py-1 rounded-full text-xs text-zinc-800 shadow-2xs"
              >
                <img
                  src={student.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                  alt={student.name}
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                />
                <span className="font-medium text-[11px] truncate max-w-[120px]">{student.name}</span>
              </span>
            ))}
            {enrolled.length === 0 && (
              <span className="text-xs text-zinc-400 italic">No students enrolled yet</span>
            )}
          </div>
        </div>

        {/* Subjects & Dedicated Teachers List */}
        <div className="space-y-1">
          <div className="flex items-center justify-between pb-1 border-b border-zinc-100 text-xs font-bold text-zinc-800">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#26394D]" />
              <span>Subjects & Dedicated Teachers ({allChannels.length})</span>
            </span>
            <button
              onClick={() => {
                setSelectedCourseForAction(course);
                setAddSubjectModalCourse(course);
              }}
              className="text-[11px] text-[#26394D] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Subject</span>
            </button>
          </div>

          <div className="divide-y divide-zinc-100">
            {allChannels.map(ch => {
              const isAnnouncement = ch.isGeneral || ch.name.toLowerCase() === 'announcements' || ch.name.toLowerCase() === 'general';
              const currentLecturer = ch.subjectLecturerName || (isAnnouncement ? course.instructor?.name : '');

              return (
                <div key={ch.id} className="py-2 flex items-center justify-between text-xs gap-2 flex-wrap sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-zinc-900 text-xs truncate">
                        {ch.name.replace(/\[(.*?)\]/g, '($1)')}
                      </span>
                      {isAnnouncement && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-[#26394D] border border-indigo-200 shrink-0">
                          Noticeboard
                        </span>
                      )}
                    </div>
                    {ch.description && !isAnnouncement && (
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">{ch.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isAnnouncement ? (
                      <span className="text-[11px] text-zinc-600 font-medium px-2 py-0.5 rounded bg-zinc-100">
                        Broadcaster: {course.instructor?.name || 'Class Owner'}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <select
                          value={ch.subjectLecturerId || (facultyMembers.find(f => f.name.toLowerCase() === (currentLecturer || '').toLowerCase())?.id || '')}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            const selectedUser = facultyMembers.find(f => f.id === selectedId) ||
                              (selectedId === course.instructor?.id ? course.instructor : null);
                            if (selectedUser) {
                              updateChannelLecturer(course.id, ch.id, selectedUser.id, selectedUser.name);
                              showDialog(`Assigned ${selectedUser.name} to ${ch.name}.`, { type: 'success', title: 'Lecturer Assigned' });
                            } else {
                              updateChannelLecturer(course.id, ch.id, '', '');
                              showDialog(`Cleared assigned lecturer for ${ch.name}.`, { type: 'info', title: 'Assignment Cleared' });
                            }
                          }}
                          className="bg-zinc-50 hover:bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg px-2 py-1 text-xs text-zinc-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#26394D] cursor-pointer max-w-[170px] truncate transition-colors"
                          title="Instant 1-click lecturer assignment"
                        >
                          <option value="">+ Assign Lecturer</option>
                          {course.instructor && (
                            <option value={course.instructor.id}>{course.instructor.name} (Lead)</option>
                          )}
                          {facultyMembers.filter(f => f.id !== course.instructor?.id).map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            showDialog(`Delete subject module "${ch.name}" from ${course.name}?`, {
                              type: 'warning',
                              title: 'Delete Subject',
                              confirmText: 'Delete Subject',
                              cancelText: 'Cancel',
                              onConfirm: () => {
                                deleteChannel(course.id, ch.id);
                                showDialog(`Subject "${ch.name}" removed from ${course.name}.`, { type: 'success' });
                              }
                            });
                          }}
                          className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete subject module"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedCourseForAction(course);
                setAddSubjectModalCourse(course);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-600" />
              <span>+ Add Subject</span>
            </button>
            <button
              onClick={() => {
                setSelectedCourse(course);
                if (course.channels && course.channels.length > 0) {
                  setSelectedChannel(course.channels[0]);
                }
                setActiveTab('teams');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#26394D] border border-indigo-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Class</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openRolloverForCourse(course)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
              title="Rollover class to next academic semester"
            >
              <Repeat className="w-3.5 h-3.5 text-emerald-700" />
              <span>Rollover</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#E8E9E2] p-4 sm:p-6 overflow-y-auto select-none">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Admin Header with ProCollege Logo & Dynamic Role Badging */}
        {isDeveloper ? (
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="px-2.5 py-1.5 bg-zinc-50 rounded-lg border border-zinc-200 shadow-2xs flex items-center justify-center shrink-0">
                <ProCollegeLogo size="sm" variant="dark-text" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-zinc-900">Developer Console</h1>
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
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Manage institutional tenants, administrative accounts, subscriptions, and platform settings.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
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
            </div>
          </div>
        ) : (
          /* Institutional Campus Administration Center Header (Exact Clean Clone) */
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Campus Administration Center
              </h1>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                institutional Admin Role Tiers: Developer, Institutional, Lecturer, Student
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <button
                onClick={() => setActiveAdminTab('roster')}
                className="bg-[#107c41] hover:bg-[#0c6233] text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Bulk import student roster from Excel (.xlsx/.csv)"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Import Roster</span>
              </button>

              <button
                onClick={() => setShowNewClassModal(true)}
                className="bg-[#26394D] hover:bg-[#141E2B] text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Add a new class with subjects and dedicated teachers"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Class</span>
              </button>

              <button
                onClick={() => setShowAddFacultyModal(true)}
                className="bg-[#26394D] hover:bg-[#141E2B] text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Add a new academic department / faculty"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Department</span>
              </button>
            </div>
          </div>
        )}

        {/* Master Navigation Tabs */}
        {isDeveloper ? (
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
              <span>Overview</span>
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
              <span>Organizations ({organizations.length})</span>
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
              <span>Subscriptions</span>
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
              <span>Backups</span>
            </button>

            <button
              onClick={() => switchDevSection('dev-email')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
                currentDevSection === 'dev-email'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>2FA Email Gateway</span>
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
              <span>Campus View</span>
            </button>
          </div>
        ) : (
          /* Institutional Horizontal Tabs - Strictly 3 Clean Tabs */
          <div className="flex items-center gap-6 border-b border-zinc-200 pb-2 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveAdminTab('classes')}
              className={`flex items-center gap-2 pb-2 -mb-2 font-bold transition-colors cursor-pointer border-b-2 ${
                activeAdminTab === 'classes'
                  ? 'border-[#26394D] text-[#26394D]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Classes & Departments</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('users')}
              className={`flex items-center gap-2 pb-2 -mb-2 font-bold transition-colors cursor-pointer border-b-2 ${
                activeAdminTab === 'users'
                  ? 'border-[#26394D] text-[#26394D]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Lecturers & Students</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('roster')}
              className={`flex items-center gap-2 pb-2 -mb-2 font-bold transition-colors cursor-pointer border-b-2 ${
                activeAdminTab === 'roster'
                  ? 'border-[#26394D] text-[#26394D]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Roster Import</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* DEVELOPER SECTION 1: OVERVIEW                             */}
        {/* ========================================================= */}
        {isDeveloper && currentDevSection === 'dev-overview' && (
          <div className="space-y-5">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-xs font-medium text-zinc-500">Total Organizations</span>
                  <Building2 className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="text-2xl font-bold text-zinc-900">{organizations.length}</div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {organizations.filter(o => o.status !== 'paused').length} active institutions
                </p>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-xs font-medium text-zinc-500">Enrolled Students</span>
                  <Users className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="text-2xl font-bold text-zinc-900">
                  {organizations.reduce((acc: number, o: PlatformOrg) => acc + (o.studentCount || 0), 0)}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">Across all registered campuses</p>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-xs font-medium text-zinc-500">Academic Departments</span>
                  <FolderTree className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="text-2xl font-bold text-zinc-900">{faculties.length}</div>
                <p className="text-[11px] text-zinc-500 mt-1">Academic departments configured</p>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-xs font-medium text-zinc-500">Active Subscriptions</span>
                  <CreditCard className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="text-2xl font-bold text-zinc-900">
                  {organizations.filter(o => o.status !== 'paused').length}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">Good standing / active billing</p>
              </div>
            </div>

            {/* Organizations Summary Table */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Institutions & Campuses</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Overview of registered tenants and administrator accounts.</p>
                </div>
                <button
                  onClick={() => switchDevSection('dev-organizations')}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-800 transition-colors cursor-pointer"
                >
                  Manage all ({organizations.length}) →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 font-semibold text-zinc-700">
                      <th className="py-3 px-4">Organization</th>
                      <th className="py-3 px-4">Administrator</th>
                      <th className="py-3 px-4 text-center">Students</th>
                      <th className="py-3 px-4 text-center">Departments</th>
                      <th className="py-3 px-4">Plan</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {organizations.map((org: PlatformOrg) => {
                      const isPaused = org.status === 'paused';
                      return (
                        <tr key={org.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-700 text-xs shrink-0">
                                {org.code ? org.code.slice(0, 3) : org.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-zinc-900">{org.name}</div>
                                <div className="text-[11px] text-zinc-500 font-mono">{org.code || org.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-zinc-800">{org.adminName}</div>
                            <div className="text-[11px] text-zinc-500">{org.contactEmail}</div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-zinc-700">
                            {org.studentCount || 0}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-zinc-700">
                            {org.facultyCount || 0}
                          </td>
                          <td className="py-3 px-4 text-zinc-800 font-medium">
                            {org.billingPlan === 'enterprise' ? 'Enterprise' : 'Campus Pro'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-xs text-zinc-700">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                              <span>{isPaused ? 'Paused' : 'Active'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedInstitution(org.name);
                                switchDevSection('campus-ops');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Platform Services Status Bar (Clean & Real) */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-zinc-500">Database Engine:</span>
                  <span className="font-medium text-zinc-800">Connected</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-zinc-500">Secondary Vault:</span>
                  <span className="font-medium text-zinc-800">Operational</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-zinc-500">Media Storage:</span>
                  <span className="font-medium text-zinc-800">Operational</span>
                </div>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">Edge Compute Runtime</span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* DEVELOPER SECTION 2: ORGANIZATIONS                        */}
        {/* ========================================================= */}
        {isDeveloper && currentDevSection === 'dev-organizations' && (
          <div className="space-y-4">
            {/* Header & Search */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-900">Organizations</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Manage registered institutional accounts, administrators, student bodies, and access status.
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
                      <th className="py-3 px-4">Institutional Admins</th>
                      <th className="py-3 px-4 text-center">Students</th>
                      <th className="py-3 px-4 text-center">Departments</th>
                      <th className="py-3 px-4">Plan</th>
                      <th className="py-3 px-4">Status</th>
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
                              <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-700 text-xs shrink-0">
                                {org.code ? org.code.slice(0, 3) : org.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-zinc-900">{org.name}</div>
                                <div className="text-[11px] text-zinc-500 font-mono">
                                  {org.code ? `${org.code} • ` : ''}ID: {org.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-zinc-900 text-xs">{org.adminName}</span>
                              {org.adminCount && org.adminCount > 1 ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700">
                                  +{org.adminCount - 1} more
                                </span>
                              ) : null}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-mono">{org.contactEmail}</div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-zinc-700">
                            {org.studentCount || 0}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-zinc-700">
                            {org.facultyCount || 0}
                          </td>
                          <td className="py-3 px-4 text-zinc-800 font-medium">
                            {org.billingPlan === 'enterprise' ? 'Enterprise' : 'Campus Pro'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-xs text-zinc-700">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                              <span>{isPaused ? 'Paused' : 'Active'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenManageAdmins(org)}
                                className="px-2.5 py-1 rounded text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer flex items-center gap-1"
                                title={`Appoint and manage Institutional Admins for ${org.name}`}
                              >
                                <Shield className="w-3 h-3 text-purple-600" />
                                <span>Admins ({org.adminCount || 1})</span>
                              </button>
                              <button
                                onClick={() => handleToggleOrgStatus(org.id, org.status)}
                                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                                  isPaused
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                                }`}
                                title={isPaused ? 'Resume workflows for this university' : 'Pause workflows'}
                              >
                                {isPaused ? 'Activate' : 'Pause'}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedInstitution(org.name);
                                  switchDevSection('campus-ops');
                                }}
                                className="px-2.5 py-1 rounded text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                                title="Inspect academic classes and departments for this campus"
                              >
                                Inspect
                              </button>
                              <button
                                onClick={() => setConfirmResetOrg(org)}
                                className="px-2 py-1 rounded text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                                title={`Reset administrator password for ${org.name}`}
                              >
                                Reset
                              </button>
                              <button
                                onClick={() => handleDeleteOrg(org)}
                                className="p-1.5 rounded text-xs text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title={`Delete ${org.name}`}
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
        {/* DEVELOPER SECTION 3: SUBSCRIPTIONS & BILLING              */}
        {/* ========================================================= */}
        {isDeveloper && currentDevSection === 'dev-billing' && (
          <div className="space-y-4">
            {/* Header & Overview */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-900">Subscriptions & Billing</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Manage institutional subscription plans, renewal cycles, and workflow status.
                </p>
              </div>

              <div className="text-xs text-zinc-600">
                {organizations.filter(o => o.status !== 'paused').length} of {organizations.length} Subscriptions Active
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
                              <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-700 text-xs shrink-0">
                                {org.code ? org.code.slice(0, 3) : org.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-zinc-900">{org.name}</div>
                                <div className="text-[11px] text-zinc-500">{org.contactEmail || org.adminName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-zinc-800 font-medium">
                            {org.billingPlan === 'enterprise' ? 'Enterprise' : 'Campus Pro'}
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-600">
                            {startDate}
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-600">
                            {expiryDate}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-xs text-zinc-700">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                              <span>{isPaused ? 'Paused' : 'Active'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Pause / Activate Button */}
                              <button
                                onClick={() => handleToggleOrgStatus(org.id, org.status)}
                                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                                  isPaused
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                                }`}
                                title={isPaused ? 'Activate organization workflow' : 'Pause organization workflow'}
                              >
                                {isPaused ? 'Activate' : 'Pause'}
                              </button>

                              {/* Renew (+1 Year) Button */}
                              <button
                                onClick={() => handleRenewOrg(org)}
                                className="px-2.5 py-1 rounded text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                                title={`Renew subscription for 1 year`}
                              >
                                +1 Year
                              </button>

                              {/* Reset Admin Password & OTP Button */}
                              <button
                                onClick={() => setConfirmResetOrg(org)}
                                className="px-2 py-1 rounded text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                                title={`Reset administrator password for ${org.name}`}
                              >
                                Reset
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteOrg(org)}
                                className="p-1.5 rounded text-xs text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title={`Delete ${org.name}`}
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
        {/* DEVELOPER SECTION 4: BACKUPS                              */}
        {/* ========================================================= */}
        {isDeveloper && currentDevSection === 'dev-system' && (
          <div className="space-y-5">
            {/* Database Backup & Snapshot Engine */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900">Database Snapshots & Backups</h2>
                    <p className="text-xs text-zinc-500">Synchronize database records to secondary storage for disaster recovery.</p>
                  </div>
                </div>

                <button
                  onClick={handleTriggerBackup}
                  disabled={isTriggeringBackup}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTriggeringBackup ? 'animate-spin' : ''}`} />
                  <span>{isTriggeringBackup ? 'Syncing...' : 'Trigger Backup Snapshot'}</span>
                </button>
              </div>

              {backupSnapshot ? (
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-900 font-semibold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Snapshot synchronized successfully</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {backupSnapshot.timestamp || new Date().toISOString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-zinc-200">
                      <span className="text-zinc-500 text-[11px] block">Organizations</span>
                      <span className="font-bold text-zinc-900 text-base font-mono">{backupSnapshot.results?.colleges ?? 0}</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-zinc-200">
                      <span className="text-zinc-500 text-[11px] block">User Accounts</span>
                      <span className="font-bold text-zinc-900 text-base font-mono">{backupSnapshot.results?.users ?? 0}</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-zinc-200">
                      <span className="text-zinc-500 text-[11px] block">Classes</span>
                      <span className="font-bold text-zinc-900 text-base font-mono">{backupSnapshot.results?.courses ?? 0}</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-zinc-200">
                      <span className="text-zinc-500 text-[11px] block">Course Files</span>
                      <span className="font-bold text-zinc-900 text-base font-mono">{backupSnapshot.results?.course_files ?? 0}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-600">
                  <div>
                    <span className="font-semibold text-zinc-800 block">Automated Backup Pipeline</span>
                    <span className="text-[11px] text-zinc-500">Secondary database replica is configured and ready.</span>
                  </div>
                  <span className="text-[11px] text-zinc-500">Click &ldquo;Trigger Backup Snapshot&rdquo; to execute a manual sync.</span>
                </div>
              )}
            </div>

            {/* Clean System Configuration Panel */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Backup Policies & Storage Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-500">Scheduled Backups</span>
                  <p className="font-medium text-zinc-900">Automated Daily Sync (00:00 UTC)</p>
                  <p className="text-[11px] text-zinc-500">All institutional schemas, users, and class records.</p>
                </div>

                <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-500">Disaster Recovery</span>
                  <p className="font-medium text-zinc-900">Multi-Region Secondary SQL Vault</p>
                  <p className="text-[11px] text-zinc-500">Instant failover replica with point-in-time state.</p>
                </div>

                <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-500">File & Document Storage</span>
                  <p className="font-medium text-zinc-900">Distributed Cloud Media Storage</p>
                  <p className="text-[11px] text-zinc-500">Encrypted binary uploads with CDN distribution.</p>
                </div>

                <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-500">Data Encryption & Compliance</span>
                  <p className="font-medium text-zinc-900">AES-256 at Rest & TLS 1.3 in Transit</p>
                  <p className="text-[11px] text-zinc-500">Strict multi-tenant isolation per institution boundary.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* DEVELOPER SECTION 5: 2FA EMAIL & OTP DISPATCH GATEWAY      */}
        {/* ========================================================= */}
        {isDeveloper && currentDevSection === 'dev-email' && (
          <div className="space-y-6">
            {/* Email Gateway Configuration & Test Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Provider Settings Form (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">Email Dispatch Provider</h3>
                      <p className="text-xs text-zinc-500">Select and configure your transactional email service.</p>
                    </div>
                  </div>
                  <button
                    onClick={fetchEmailSettings}
                    disabled={isLoadingEmailSettings}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors cursor-pointer"
                    title="Refresh Settings"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingEmailSettings ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <form onSubmit={handleSaveEmailSettings} className="space-y-4">
                  {/* Provider Radio Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-2">Delivery Method</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'relay', name: 'Google Apps Script', badge: '100% Free' },
                        { id: 'brevo', name: 'Brevo (Sendinblue)', badge: '300/day' },
                        { id: 'resend', name: 'Resend API', badge: '3,000/mo' },
                        { id: 'plunk', name: 'Plunk', badge: '30,000/mo' },
                      ].map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setEmailSettings(prev => ({ ...prev, provider: p.id }))}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            emailSettings.provider === p.id
                              ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900 shadow-xs'
                              : 'border-zinc-200 hover:border-zinc-300 bg-white'
                          }`}
                        >
                          <span className="block text-xs font-bold text-zinc-900">{p.name}</span>
                          <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            emailSettings.provider === p.id
                              ? 'text-zinc-900 bg-zinc-200'
                              : 'text-zinc-500 bg-zinc-100'
                          }`}>
                            {p.badge}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Provider Details based on selection */}
                  {emailSettings.provider === 'relay' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          Google Apps Script Webhook URL (Recommended)
                        </label>
                        <input
                          type="url"
                          value={emailSettings.relayUrl}
                          onChange={e => setEmailSettings(prev => ({ ...prev, relayUrl: e.target.value }))}
                          placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                          className="w-full text-xs font-mono border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 bg-white placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                        />
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Sends directly from your Gmail account to any student/admin address with 100% inbox delivery and zero spam filtering.
                        </p>
                      </div>

                      {/* Google Apps Script 1-Click Code Snippet */}
                      <div className="bg-zinc-50 text-zinc-800 rounded-xl p-4 text-xs space-y-2.5 border border-zinc-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-zinc-700 font-semibold text-[11px] uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Quick Google Apps Script Setup (30 Seconds)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const code = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    MailApp.sendEmail({
      to: data.to,
      subject: data.subject,
      htmlBody: data.html
    });
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
                              navigator.clipboard.writeText(code);
                              setCopiedScript(true);
                              setTimeout(() => setCopiedScript(false), 2000);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                          >
                            {copiedScript ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Script'}</span>
                          </button>
                        </div>
                        <ol className="list-decimal list-inside space-y-1.5 text-zinc-600 text-[11px] leading-relaxed">
                          <li>Open <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-semibold">script.google.com</a> and click <strong>New Project</strong>.</li>
                          <li>Paste the copied script and click <strong>Deploy &gt; New deployment</strong>.</li>
                          <li>Select <strong>Web app</strong>, set <em>Who has access</em> to <strong>Anyone</strong>, click Deploy, and paste your Webhook URL above.</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {emailSettings.provider !== 'relay' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          API Key / Secret Key
                        </label>
                        <input
                          type="password"
                          value={emailSettings.apiKey}
                          onChange={e => setEmailSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                          placeholder={emailSettings.provider === 'brevo' ? 'xkeysib-...' : emailSettings.provider === 'resend' ? 're_...' : 'sk_...'}
                          className="w-full text-xs font-mono border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 bg-white placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">Sender Email</label>
                          <input
                            type="email"
                            value={emailSettings.senderEmail}
                            onChange={e => setEmailSettings(prev => ({ ...prev, senderEmail: e.target.value }))}
                            placeholder="notifications@procollege.edu.np"
                            className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 bg-white placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">Sender Name</label>
                          <input
                            type="text"
                            value={emailSettings.senderName}
                            onChange={e => setEmailSettings(prev => ({ ...prev, senderName: e.target.value }))}
                            placeholder="ProCollege Security"
                            className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 bg-white placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSavingEmailSettings}
                    className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSavingEmailSettings ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Configuration...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Save Email Gateway Settings</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Column: Live Test & Diagnostics (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                {/* Developer Diagnostic Sandbox Card */}
                <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0">
                        <Send className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-zinc-900">Developer Delivery Sandbox</h3>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Auto in Production
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          In real usage, 2FA OTP codes are sent automatically to users upon sign-in. Nobody manually enters recipient emails. Use this tool only to test your webhook.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSendTestEmail} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Target Test Email Address</label>
                      <input
                        type="email"
                        required
                        value={testEmailTarget}
                        onChange={e => setTestEmailTarget(e.target.value)}
                        placeholder="gcsujan321@gmail.com"
                        className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 bg-white placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingTestEmail || !testEmailTarget.trim()}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#26394D] hover:bg-[#141E2B] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSendingTestEmail ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching Test Email...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Test 2FA Email</span>
                        </>
                      )}
                    </button>
                  </form>

                  {testEmailResult && (
                    <div className={`p-3.5 rounded-xl border text-xs ${
                      testEmailResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}>
                      <div className="flex items-start gap-2">
                        {testEmailResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-semibold">{testEmailResult.success ? 'Email Delivered Successfully!' : 'Email Dispatch Failed'}</p>
                          <p className="text-[11px] mt-0.5 leading-relaxed opacity-90">{testEmailResult.message}</p>
                          {testEmailResult.provider && (
                            <span className="inline-block mt-1 text-[10px] font-mono font-bold bg-white/80 px-2 py-0.5 rounded border border-zinc-200 text-zinc-700">
                              via {testEmailResult.provider}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Architecture Guide Card */}
                <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 text-xs space-y-2.5">
                  <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                    <span>How ProCollege 2FA Operates</span>
                  </div>
                  <ul className="space-y-2 text-zinc-600 text-[11px] leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
                      <span><strong>Campus Admins:</strong> Upon creation or password reset, logging in dispatches a fresh 6-digit OTP code directly to their official email.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
                      <span><strong>Imported Students:</strong> Entering temporary roster credentials triggers a 6-digit OTP to their Gmail, followed by mandatory permanent password setup.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
                      <span><strong>Multi-Campus Isolation:</strong> Zero demo accounts exist; all institutions operate strictly within their own encrypted database boundary.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Row: Live 2FA & Email Audit Logs Table (Redesigned) */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden space-y-0">
              {/* Header Bar */}
              <div className="p-4 sm:p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0">
                    <ClipboardList className="w-4 h-4 text-zinc-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-zinc-900">Recent 2FA OTP & Email Delivery Logs</h3>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Stream
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Real-time telemetry of 6-digit OTP verification codes issued across all organizations.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    onClick={fetchEmailSettings}
                    disabled={isLoadingEmailSettings}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEmailSettings ? 'animate-spin' : ''}`} />
                    <span>Refresh Logs</span>
                  </button>
                </div>
              </div>

              {/* Quick KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-200/80 border-b border-zinc-200 text-xs">
                <div className="bg-white p-3.5">
                  <span className="text-[11px] font-medium text-zinc-500 block">Total Codes Dispatched</span>
                  <span className="text-base font-bold text-zinc-900 font-mono mt-0.5 block">{emailLogs.length}</span>
                </div>
                <div className="bg-white p-3.5">
                  <span className="text-[11px] font-medium text-zinc-500 block">Inbox Delivery Rate</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-base font-bold text-emerald-600 font-mono">
                      {emailLogs.length > 0 ? Math.round((deliveredCount / emailLogs.length) * 100) : 100}%
                    </span>
                    <span className="text-[10px] text-zinc-400">({deliveredCount} delivered)</span>
                  </div>
                </div>
                <div className="bg-white p-3.5">
                  <span className="text-[11px] font-medium text-zinc-500 block">Dispatch Exceptions</span>
                  <span className={`text-base font-bold font-mono mt-0.5 block ${failedCount > 0 ? 'text-rose-600' : 'text-zinc-700'}`}>
                    {failedCount}
                  </span>
                </div>
                <div className="bg-white p-3.5">
                  <span className="text-[11px] font-medium text-zinc-500 block">Active Dispatch Engine</span>
                  <span className="text-xs font-bold text-zinc-900 uppercase font-mono mt-1 block">
                    {emailSettings.provider === 'relay' ? 'Google Apps Script Relay' : (emailSettings.provider || 'Relay')}
                  </span>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="p-3 bg-zinc-50/70 border-b border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={e => setLogSearchQuery(e.target.value)}
                    placeholder="Search by recipient email, name, or OTP code..."
                    className="w-full text-xs pl-8 pr-7 py-1.5 bg-white border border-zinc-200 rounded-lg placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                  />
                  {logSearchQuery && (
                    <button
                      onClick={() => setLogSearchQuery('')}
                      className="absolute right-2.5 top-1.5 text-zinc-400 hover:text-zinc-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-zinc-200 shrink-0 text-xs">
                  <button
                    onClick={() => setLogStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      logStatusFilter === 'all'
                        ? 'bg-zinc-900 text-white shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    All ({emailLogs.length})
                  </button>
                  <button
                    onClick={() => setLogStatusFilter('delivered')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      logStatusFilter === 'delivered'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Delivered ({deliveredCount})
                  </button>
                  <button
                    onClick={() => setLogStatusFilter('failed')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      logStatusFilter === 'failed'
                        ? 'bg-rose-700 text-white shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Failed ({failedCount})
                  </button>
                </div>
              </div>

              {/* Table Body */}
              {filteredEmailLogs.length === 0 ? (
                <div className="p-10 text-center text-zinc-400 text-xs bg-white">
                  <Mail className="w-9 h-9 mx-auto mb-2 text-zinc-300" />
                  <p className="font-semibold text-zinc-700 text-sm">
                    {emailLogs.length === 0 ? 'No email delivery events recorded yet' : 'No logs match your filter criteria'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                    {emailLogs.length === 0
                      ? 'When campus admins or students sign in, their generated 2FA security codes will appear here in real time.'
                      : 'Try clearing your search query or switching filter tabs to view other security dispatches.'}
                  </p>
                  {logSearchQuery && (
                    <button
                      onClick={() => { setLogSearchQuery(''); setLogStatusFilter('all'); }}
                      className="mt-3 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-500 text-[11px] font-semibold bg-zinc-50/80 uppercase tracking-wider">
                        <th className="py-3 px-4">Recipient Account</th>
                        <th className="py-3 px-4">Security 2FA Code</th>
                        <th className="py-3 px-4">Relay Engine</th>
                        <th className="py-3 px-4">Delivery Status</th>
                        <th className="py-3 px-4 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredEmailLogs.map((log: any) => {
                        const initial = (log.recipient_name?.[0] || log.recipient_email?.[0] || 'U').toUpperCase();
                        const isDelivered = log.status === 'delivered';
                        return (
                          <tr key={log.id} className="hover:bg-zinc-50/70 transition-colors">
                            {/* Recipient Account */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-700 text-xs shrink-0 font-mono">
                                  {initial}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-zinc-900 font-mono text-xs truncate max-w-[220px]">
                                    {log.recipient_email}
                                  </div>
                                  <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                    <span>{log.recipient_name || 'Campus User'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 2FA Security Code */}
                            <td className="py-3 px-4">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100/90 border border-zinc-200 font-mono text-xs font-bold text-zinc-900 tracking-wider">
                                <span>{log.otp_code || '••••••'}</span>
                                {log.otp_code && (
                                  <button
                                    onClick={() => handleCopyOtp(log.id, log.otp_code)}
                                    title="Copy 2FA code"
                                    className="p-0.5 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer ml-1"
                                  >
                                    {copiedOtpId === log.id ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Relay Engine */}
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200/60">
                                {log.provider || 'Relay'}
                              </span>
                            </td>

                            {/* Delivery Status */}
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                isDelivered
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {isDelivered ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>Delivered to Inbox</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                    <span>Dispatch Failed</span>
                                  </>
                                )}
                              </span>
                            </td>

                            {/* Timestamp */}
                            <td className="py-3 px-4 text-right">
                              <div className="text-zinc-700 font-medium text-xs">
                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-0.5">
                                {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Footer */}
              <div className="p-3 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                <span>Showing {filteredEmailLogs.length} of {emailLogs.length} logged events</span>
                <span className="text-[11px] text-zinc-400">Retention: 30 days rolling audit logs</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CAMPUS OPERATIONS (For Admin or Developer Inspection)     */}
        {/* ========================================================= */}
        {(!isDeveloper || currentDevSection === 'campus-ops') && (
          <>
        {/* TAB 1: ACADEMIC CLASSES & DEPARTMENTS (UNIFIED VIEW) */}
        {activeAdminTab === 'classes' && (
          <div className="space-y-5">
            {/* 1. Unified Department Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#26394D]" />
                  <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                    Academic Departments ({faculties.length})
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddFacultyModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#26394D] hover:bg-[#141E2B] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Department</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* All Departments Filter Card */}
                <div
                  onClick={() => setSelectedFacultyFilter('all')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedFacultyFilter === 'all'
                      ? 'bg-white border-[#26394D] ring-2 ring-[#26394D]/10 shadow-xs'
                      : 'bg-white/80 hover:bg-white border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-zinc-900">All Departments</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-semibold">
                      {courses.length} Classes
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Campus-wide master catalog across all departments
                  </p>
                </div>

                {/* Individual Department Cards */}
                {faculties.map(dept => {
                  const isSelected = selectedFacultyFilter === dept.id;
                  const deptCourses = getFacultyCourses(dept);

                  return (
                    <div
                      key={dept.id}
                      onClick={() => setSelectedFacultyFilter(isSelected ? 'all' : dept.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-white border-[#26394D] ring-2 ring-[#26394D]/10 shadow-xs'
                          : 'bg-white/80 hover:bg-white border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-xs text-zinc-900 truncate max-w-[170px]" title={dept.name}>
                          {dept.name}
                        </h4>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-[#26394D]">
                          {deptCourses.length} {deptCourses.length === 1 ? 'Class' : 'Classes'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate">
                        Head: <span className="font-semibold text-zinc-700">{dept.headName || dept.deanName || 'Appointed Head'}</span>
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-100 text-[10px] text-zinc-400">
                        <span className="font-mono">{dept.code}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFaculty(dept);
                            }}
                            className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            title="Delete Department"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Single Clear Class Catalog Section */}
            <div className="space-y-4 pt-1">
              <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#26394D]" />
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900">
                      Academic Classes ({filteredCourses.length})
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      {selectedFacultyFilter === 'all'
                        ? 'Displaying all active classes across campus'
                        : `Filtered by department: ${faculties.find(f => f.id === selectedFacultyFilter)?.name || ''}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={searchClassQuery}
                      onChange={e => setSearchClassQuery(e.target.value)}
                      placeholder="Search classes by name, code..."
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#26394D] focus:bg-white"
                    />
                  </div>

                  <button
                    onClick={() => setShowNewClassModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#26394D] hover:bg-[#141E2B] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Class</span>
                  </button>
                </div>
              </div>

              {/* Class Cards Grid */}
              {filteredCourses.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-zinc-300 p-8 text-center space-y-3">
                  <School className="w-8 h-8 text-zinc-400 mx-auto" />
                  <h4 className="text-sm font-bold text-zinc-800">No classes found</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    No academic classes match your active department filter or search query.
                  </p>
                  <button
                    onClick={() => setShowNewClassModal(true)}
                    className="px-4 py-2 bg-[#26394D] hover:bg-[#141E2B] text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    + Create Class
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                  {filteredCourses.map(course => renderExactClassCard(course, false))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: USERS & LICENSES                                   */}
        {/* ========================================================= */}
        {activeAdminTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Campus Directory & Accounts</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Manage certified lecturers and enrolled students.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setUserRoleFilter('all')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                        userRoleFilter === 'all' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      All ({academicUsers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserRoleFilter('lecturer')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                        userRoleFilter === 'lecturer' ? 'bg-white text-[#26394D] shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      Lecturers ({facultyMembers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserRoleFilter('student')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                        userRoleFilter === 'student' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      Students ({allStudents.length})
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={searchUserQuery}
                      onChange={e => setSearchUserQuery(e.target.value)}
                      placeholder="Search users..."
                      className="bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-2.5 py-1 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowRegisterUserModal(true)}
                className="flex items-center gap-2 bg-[#26394D] hover:bg-[#141E2B] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
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
                      academicUsers
                      .filter(u => {
                        if (userRoleFilter === 'lecturer') return u.role !== 'student';
                        if (userRoleFilter === 'student') return u.role === 'student';
                        return true;
                      })
                      .filter(u => {
                        if (!searchUserQuery.trim()) return true;
                        const q = searchUserQuery.toLowerCase().trim();
                        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.department && u.department.toLowerCase().includes(q));
                      })
                      .map(user => (
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
                              className="bg-zinc-50 border border-zinc-300 rounded px-2 py-1 text-xs text-zinc-800 font-medium focus:ring-1 focus:ring-[#26394D] focus:outline-none"
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
                  <FolderTree className="w-4 h-4 text-[#26394D]" />
                  <span>Academic Departments</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Establish collegiate departments, appoint department heads, and organize degree classes and subject modules under each department.
                </p>
              </div>

              <button
                onClick={() => setShowAddFacultyModal(true)}
                className="flex items-center gap-1.5 bg-[#26394D] hover:bg-[#141E2B] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Department</span>
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
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-[#26394D] flex items-center justify-center font-bold text-sm shrink-0">
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
                          <span className="text-[11px] font-medium text-zinc-500">Department Head:</span>
                          <span className="font-semibold text-zinc-800">{faculty.deanName || 'Department Head'}</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-600">
                          <span className="text-[11px] font-medium text-zinc-500">Active Classes:</span>
                          <span className="font-bold text-[#26394D]">{associatedClasses.length} {associatedClasses.length === 1 ? 'class' : 'classes'}</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-600">
                          <span className="text-[11px] font-medium text-zinc-500">Department Members:</span>
                          <span className="font-semibold text-emerald-700">{memberCount} lecturers</span>
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
                        className="w-full py-2 px-3 rounded-lg bg-[#26394D] hover:bg-[#141E2B] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
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
                          <GraduationCap className="w-3 h-3 text-[#26394D]" />
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
                <Sliders className="w-4 h-4 text-[#26394D]" />
                <span>Roles & Permissions</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Overview of user roles and operational capabilities across academic classes and campus administration.
              </p>
            </div>

            {/* Role Cards Breakdown */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${isDeveloper ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
              {isDeveloper && (
                <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-zinc-900">Platform Administrator</span>
                    <span className="text-[11px] font-medium text-purple-700">Developer</span>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Platform owner. Provisions institutional admins, oversees university inquiries, and manages platform infrastructure.
                  </p>
                </div>
              )}

              <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-zinc-900">Institutional Admin</span>
                  <span className="text-[11px] font-medium text-indigo-700">Campus Admin</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Campus administrator. Manages faculties, classes, lecturer subject assignments, student enrollment, and semester rollovers.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-zinc-900">Lecturer</span>
                  <span className="text-[11px] font-medium text-blue-700">Teaching Staff</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Course instructors. Post class announcements, upload syllabus and lecture resources, publish assignments, and grade submissions.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-zinc-900">Student</span>
                  <span className="text-[11px] font-medium text-emerald-700">Enrolled Member</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Enrolled learners. View class notices, access study materials, participate in discussions, and submit assignments.
                </p>
              </div>
            </div>

            {/* Permission Matrix Table */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-zinc-200 bg-zinc-50">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Role Capabilities & Access Scope
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-zinc-50/50 border-b border-zinc-200 font-semibold text-zinc-700">
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Departments & Classes</th>
                      <th className="py-2.5 px-3">Assign Lecturers</th>
                      <th className="py-2.5 px-3">Announcements</th>
                      <th className="py-2.5 px-3">Assignments & Grading</th>
                      <th className="py-2.5 px-3">Campus Settings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {isDeveloper && (
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-900">Platform Administrator</td>
                        <td className="py-2.5 px-3 text-zinc-700">Full Access</td>
                        <td className="py-2.5 px-3 text-zinc-700">Full Access</td>
                        <td className="py-2.5 px-3 text-zinc-700">Global Broadcast</td>
                        <td className="py-2.5 px-3 text-zinc-700">Full Access</td>
                        <td className="py-2.5 px-3 text-emerald-700 font-medium">Multi-Campus Root</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-zinc-900">Institutional Admin</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">Campus-wide Allowed</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">Campus-wide Allowed</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">Campus-wide Allowed</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">Gradebook Supervise</td>
                      <td className="py-2.5 px-3 text-zinc-500 font-medium">Campus Only</td>
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
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#26394D]">
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 leading-tight">Provision Academic Class</h3>
                  <p className="text-[11px] text-zinc-500">Create a class under a department, configure subject modules, and enroll students.</p>
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
              {/* Academic Department Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Academic Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedFacultyId}
                  onChange={e => setSelectedFacultyId(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 font-semibold focus:outline-none focus:border-[#26394D]"
                  required
                >
                  {faculties.map(fac => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.code}) — Head: {fac.deanName}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500 mt-1">
                  This class and its subject courses will be cataloged under this department.
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
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#26394D] focus:bg-white"
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
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D] focus:bg-white"
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
                            ? 'bg-[#26394D] text-white shadow-2xs font-bold'
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
                            ? 'bg-[#26394D] text-white shadow-2xs font-bold'
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
                      className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
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
                        className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
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
                  <Megaphone className="w-4 h-4 text-[#26394D]" />
                  <span className="text-xs font-bold text-zinc-900">
                    Default Section: Announcements
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 text-[#26394D] rounded">
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
                      <BookOpen className="w-3.5 h-3.5 text-[#26394D]" />
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
                    className="text-xs text-[#26394D] font-semibold hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
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
                      className="text-[11px] text-[#26394D] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
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
                        className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-[#26394D] border border-indigo-200 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
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
                      className="w-full bg-white border border-zinc-300 rounded p-2 text-xs font-mono text-zinc-800 focus:outline-none focus:border-[#26394D]"
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
                        className="px-3 py-1 bg-[#26394D] hover:bg-[#141E2B] disabled:opacity-50 text-white rounded text-xs font-semibold cursor-pointer shadow-xs"
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
                        className="flex-1 bg-zinc-50 border border-zinc-300 rounded px-2 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D] focus:bg-white"
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
                        className="w-full sm:w-28 bg-zinc-50 border border-zinc-300 rounded px-2 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D] focus:bg-white"
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
                      className="text-xs text-[#26394D] font-semibold hover:underline cursor-pointer"
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
                    className="flex-1 bg-zinc-50 border border-zinc-300 rounded px-2.5 py-1 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
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
                            className="rounded text-[#26394D]"
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
                className="px-5 py-2 text-xs font-semibold bg-[#26394D] hover:bg-[#141E2B] text-white rounded-lg shadow-sm transition-colors cursor-pointer"
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
                  className="w-full bg-white border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 font-medium focus:outline-none focus:border-[#26394D]"
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
                    className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 font-medium focus:outline-none focus:border-[#26394D]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">New Semester Term</label>
                  <input
                    type="text"
                    value={rolloverNewTerm}
                    onChange={e => setRolloverNewTerm(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 font-medium focus:outline-none focus:border-[#26394D]"
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
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 font-medium focus:outline-none focus:border-[#26394D]"
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
                    <BookOpen className="w-3.5 h-3.5 text-[#26394D]" />
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
                    className="text-xs text-[#26394D] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
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
                <BookOpen className="w-5 h-5 text-[#26394D]" />
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
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
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
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
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
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#26394D] hover:bg-[#141E2B] text-white rounded-lg cursor-pointer"
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
                <Users className="w-5 h-5 text-[#26394D]" />
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
                    className="text-xs text-[#26394D] font-semibold hover:underline cursor-pointer"
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
                              className="rounded text-[#26394D]"
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
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#26394D] hover:bg-[#141E2B] disabled:bg-zinc-300 text-white rounded-lg cursor-pointer"
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
                <GraduationCap className="w-5 h-5 text-[#26394D]" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">Manage Department Members</h3>
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
                <p className="font-semibold text-zinc-900">Department Assignment</p>
                <p className="text-zinc-600 text-[11px] leading-relaxed">
                  Select lecturers and teaching staff to assign to <strong>{selectedFacultyForMembers.name}</strong>. Assigned members can lead classes and instruct subjects within this department.
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
                      className="text-xs text-[#26394D] font-semibold hover:underline cursor-pointer"
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
                            className="rounded text-[#26394D] cursor-pointer"
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
                  className="px-4 py-1.5 text-xs font-semibold bg-[#26394D] hover:bg-[#141E2B] text-white rounded-lg cursor-pointer shadow-xs transition-colors"
                >
                  Save Department Members
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
              <h3 className="font-bold text-sm text-zinc-900">Register Student / Lecturer</h3>
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
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
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
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
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
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#26394D] hover:bg-[#141E2B] text-white rounded cursor-pointer"
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
              className="w-full bg-[#26394D] text-white text-xs font-semibold py-2 rounded"
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
                <FolderTree className="w-5 h-5 text-[#26394D]" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">Create Academic Department</h3>
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
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newFacultyName}
                    onChange={e => setNewFacultyName(e.target.value)}
                    placeholder="e.g. Department of Computer Science & Engineering"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
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
                    placeholder="CSE"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 font-mono uppercase focus:outline-none focus:border-[#26394D]"
                  />
                </div>
              </div>

              {/* Appointed Dean / Head with Toggle (Select from Faculty vs Type Manually) */}
              <div className="space-y-1.5 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Department Head / Lead Lecturer
                  </label>
                  <div className="flex items-center bg-white p-0.5 rounded-md border border-zinc-200 text-[10px] font-medium">
                    <button
                      type="button"
                      onClick={() => setDeanSelectionMode('select')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        deanSelectionMode === 'select'
                          ? 'bg-[#26394D] text-white shadow-2xs font-bold'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      Select Lecturer
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeanSelectionMode('manual')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        deanSelectionMode === 'manual'
                          ? 'bg-[#26394D] text-white shadow-2xs font-bold'
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
                    className="w-full bg-white border border-zinc-300 rounded px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
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
                      className="w-full bg-white border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
                    />
                  </div>
                )}
                <p className="text-[10px] text-zinc-500">
                  {deanSelectionMode === 'select'
                    ? 'Only certified lecturers and department heads are listed (students strictly excluded).'
                    : 'Type any custom name for the Head or Lead Lecturer of this Department.'}
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
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
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
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#26394D] hover:bg-[#141E2B] text-white rounded-lg cursor-pointer"
              >
                Create Department
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

              {/* Multi-Admin Management During Org Creation */}
              <div className="bg-purple-50/60 border border-purple-200 rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-600" />
                      Additional Institutional Admins ({extraOrgAdmins.length})
                    </span>
                    <p className="text-[10px] text-purple-700">Appoint multiple administrators for this institution during creation.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExtraOrgAdmins(prev => [...prev, { name: '', email: '', department: 'Campus Operations' }])}
                    className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded border border-purple-200 shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add Admin</span>
                  </button>
                </div>

                {extraOrgAdmins.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {extraOrgAdmins.map((ea, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-purple-200">
                        <input
                          type="text"
                          required
                          value={ea.name}
                          onChange={e => {
                            const val = e.target.value;
                            setExtraOrgAdmins(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                          }}
                          placeholder={`Admin ${idx + 2} Name`}
                          className="flex-1 bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-800 focus:outline-none focus:border-purple-600"
                        />
                        <input
                          type="email"
                          required
                          value={ea.email}
                          onChange={e => {
                            const val = e.target.value;
                            setExtraOrgAdmins(prev => prev.map((item, i) => i === idx ? { ...item, email: val } : item));
                          }}
                          placeholder={`admin${idx + 2}@campus.edu`}
                          className="flex-1 bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-800 focus:outline-none focus:border-purple-600"
                        />
                        <button
                          type="button"
                          onClick={() => setExtraOrgAdmins(prev => prev.filter((_, i) => i !== idx))}
                          className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Remove admin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* Platform Developer: Reset Confirmation Dialog Modal */}
      {confirmResetOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-zinc-200 p-5 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Reset Administrator Password</h3>
                <p className="text-[11px] text-zinc-500">{confirmResetOrg.name}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Are you sure you want to reset credentials for <strong>{confirmResetOrg.name}</strong>?
            </p>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-600 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">Target Administrator:</span>
                <span className="font-semibold text-zinc-800">{confirmResetOrg.contactEmail || confirmResetOrg.adminName}</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                A new secure temporary password will be issued. Upon their next sign-in, a fresh 6-digit 2FA code will be sent to their email, and they will be prompted to create a permanent password.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setConfirmResetOrg(null)}
                disabled={isResettingPassword}
                className="px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeResetAdminPassword(confirmResetOrg)}
                disabled={isResettingPassword}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
              >
                {isResettingPassword ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting Credentials...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>Confirm Password Reset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formatted Admin Credentials Modal (For both Provisioning and Password Reset) */}
      {issuedCredsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-zinc-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">{issuedCredsModal.title}</h3>
                  <p className="text-[11px] text-zinc-500">{issuedCredsModal.institutionName}</p>
                </div>
              </div>
              <button
                onClick={() => setIssuedCredsModal(null)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Email 2FA Notice (NO OTP code displayed here!) */}
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-700 leading-relaxed">
              <p className="font-semibold text-zinc-900 mb-0.5 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Automatic 2FA Email Verification</span>
              </p>
              When the administrator signs in with these credentials, a fresh 6-digit OTP code will be sent directly to their email ({issuedCredsModal.adminEmail}).
            </div>

            {/* Formatted Credentials Cards */}
            <div className="space-y-2.5">
              {/* Institution & Admin Name */}
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Institution & Administrator</p>
                <p className="text-xs font-bold text-zinc-900">{issuedCredsModal.institutionName}</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">{issuedCredsModal.adminName}</p>
              </div>

              {/* Login Email */}
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Official Login Email</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-900 font-mono font-semibold select-all">{issuedCredsModal.adminEmail}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(issuedCredsModal.adminEmail);
                      setCopiedField('email');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="text-[11px] text-[#173bff] hover:underline font-semibold cursor-pointer"
                  >
                    {copiedField === 'email' ? 'Copied!' : 'Copy Email'}
                  </button>
                </div>
              </div>

              {/* Temporary Password */}
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Temporary Password</p>
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono font-bold text-zinc-900 bg-white px-2 py-1 rounded border border-zinc-200 select-all">
                    {issuedCredsModal.temporaryPassword}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(issuedCredsModal.temporaryPassword);
                      setCopiedField('password');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="text-[11px] text-[#173bff] hover:underline font-semibold cursor-pointer"
                  >
                    {copiedField === 'password' ? 'Copied!' : 'Copy Password'}
                  </button>
                </div>
              </div>
            </div>

            {/* Copy Full Package Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  const summary = `🏛️ ProCollege Official Administrator Credentials\nInstitution: ${issuedCredsModal.institutionName}\nAdministrator: ${issuedCredsModal.adminName}\nLogin Email: ${issuedCredsModal.adminEmail}\nTemporary Password: ${issuedCredsModal.temporaryPassword}\nLogin Portal: ${window.location.origin}\n\n*Note: A 6-digit security OTP will be dispatched directly to your email upon sign in.`;
                  navigator.clipboard.writeText(summary);
                  setCopiedField('all');
                  setTimeout(() => setCopiedField(null), 2000);
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{copiedField === 'all' ? 'Copied Full Credentials Package!' : 'Copy Full Credentials Package'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* Modal: Add Subject to Class */}
      {addSubjectModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-[#26394D] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">
                    Add Subject Module
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {addSubjectModalCourse.name} ({addSubjectModalCourse.code})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddSubjectModalCourse(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 hover:bg-zinc-200/60 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubjectSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Compulsory Mathematics, Accountancy, Physics"
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#26394D] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Subject Code (Optional)
                </label>
                <input
                  type="text"
                  value={newSubjectCode}
                  onChange={e => setNewSubjectCode(e.target.value)}
                  placeholder="e.g. MATH-10, ACC-12"
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 font-mono uppercase focus:outline-none focus:border-[#26394D] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Assigned Dedicated Lecturer
                </label>
                <select
                  value={newSubjectLecturerId}
                  onChange={e => setNewSubjectLecturerId(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#26394D]"
                >
                  <option value="">Select Lecturer (Optional - can assign later)</option>
                  {addSubjectModalCourse.instructor && (
                    <option value={addSubjectModalCourse.instructor.id}>
                      {addSubjectModalCourse.instructor.name} (Class Owner)
                    </option>
                  )}
                  {facultyMembers
                    .filter(f => f.id !== addSubjectModalCourse?.instructor?.id)
                    .map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.role.toUpperCase()})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Curriculum Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newSubjectDesc}
                  onChange={e => setNewSubjectDesc(e.target.value)}
                  placeholder="Syllabus coverage, learning objectives..."
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#26394D] focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setAddSubjectModalCourse(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#26394D] hover:bg-[#141E2B] text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer"
                >
                  + Add Subject to Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Assign Lecturer Modal (Exact Functional Match) */}
      {assignLecturerModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-zinc-900">
                  {assignLecturerModal.channel
                    ? `Assign Lecturer: ${assignLecturerModal.channel.name}`
                    : `Assign Lecturers: ${assignLecturerModal.course.name}`}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Select a campus lecturer to teach this subject module.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignLecturerModal(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 hover:bg-zinc-200/60 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {!assignLecturerModal.channel && (
              <div className="p-4 border-b border-zinc-100 bg-white shrink-0">
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Target Subject Module:
                </label>
                <select
                  value={modalTargetChannelId}
                  onChange={e => setModalTargetChannelId(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 font-semibold focus:outline-none focus:border-[#26394D] cursor-pointer"
                >
                  <option value="all">🌟 All Subjects in this Class</option>
                  {assignLecturerModal.course.channels.map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
              {facultyMembers.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-xs">
                  No lecturers registered. Add teachers in the Students & Lecturers tab.
                </div>
              ) : (
                facultyMembers.map(lecturer => (
                  <div
                    key={lecturer.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/80 transition-all text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={lecturer.avatar}
                        alt={lecturer.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-900 truncate">{lecturer.name}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{lecturer.email} • {lecturer.department}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAssignLecturerConfirm(lecturer)}
                      className="bg-[#26394D] hover:bg-[#141E2B] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0 ml-2"
                    >
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MULTI-ADMIN MANAGEMENT FOR INSTITUTION (DEVELOPER)  */}
      {/* ========================================================= */}
      {selectedOrgForAdmins && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[88vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-zinc-900 leading-tight">
                    Institutional Administrators
                  </h3>
                  <p className="text-[11px] text-zinc-500">{selectedOrgForAdmins.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedOrgForAdmins(null);
                  setNewAdminIssuedResult(null);
                  setShowAddAdminSubModal(false);
                }}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Newly Appointed Admin Alert Card with Temporary Password */}
              {newAdminIssuedResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>New Institutional Admin Appointed!</span>
                    </span>
                    <button
                      onClick={() => setNewAdminIssuedResult(null)}
                      className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-emerald-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Name:</span>
                      <span className="font-bold text-zinc-900">{newAdminIssuedResult.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Official Email:</span>
                      <span className="font-mono font-semibold text-zinc-900">{newAdminIssuedResult.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Temporary Password:</span>
                      <code className="bg-zinc-100 px-2 py-0.5 rounded font-mono font-bold text-zinc-900">
                        {newAdminIssuedResult.temporaryPassword}
                      </code>
                    </div>
                    <div className="pt-1 text-[11px] text-zinc-500">
                      ✉️ A 2FA verification code has been dispatched directly to <strong>{newAdminIssuedResult.email}</strong>. The administrator will verify 2FA upon initial sign-in.
                    </div>
                  </div>
                </div>
              )}

              {/* Top Action Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="text-xs font-bold text-zinc-800">
                  Appointed Admins ({orgAdminsList.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddAdminSubModal(!showAddAdminSubModal)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#26394D] hover:bg-[#141E2B] text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddAdminSubModal ? 'Cancel' : '+ Appoint Another Admin'}</span>
                </button>
              </div>

              {/* Inline Form to Appoint New Admin */}
              {showAddAdminSubModal && (
                <form onSubmit={handleAppointAdminSubmit} className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-zinc-900">Appoint New Institutional Administrator</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newAdminSubName}
                        onChange={e => setNewAdminSubName(e.target.value)}
                        placeholder="e.g. Prof. David Miller"
                        className="w-full bg-white border border-zinc-300 rounded px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                        Official Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={newAdminSubEmail}
                        onChange={e => setNewAdminSubEmail(e.target.value)}
                        placeholder="d.miller@campus.edu"
                        className="w-full bg-white border border-zinc-300 rounded px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Department / Role
                    </label>
                    <input
                      type="text"
                      value={newAdminSubDept}
                      onChange={e => setNewAdminSubDept(e.target.value)}
                      placeholder="e.g. Dean of Academics"
                      className="w-full bg-white border border-zinc-300 rounded px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddAdminSubModal(false)}
                      className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-200 rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingAdmin}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-[#26394D] hover:bg-[#141E2B] text-white rounded-lg cursor-pointer"
                    >
                      {isSubmittingAdmin ? 'Appointing...' : 'Appoint Admin'}
                    </button>
                  </div>
                </form>
              )}

              {/* List of Admins */}
              {isLoadingOrgAdmins ? (
                <div className="py-8 text-center text-xs text-zinc-400">Loading administrators...</div>
              ) : orgAdminsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">No institutional administrators found.</div>
              ) : (
                <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  {orgAdminsList.map(admin => (
                    <div key={admin.id} className="p-3 sm:p-3.5 flex items-center justify-between text-xs gap-3 hover:bg-zinc-50">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900">{admin.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                            Institutional Admin
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{admin.email}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{admin.department || 'Campus Administration'}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleResetAdminCredentials(admin.id, admin.name)}
                          className="px-2.5 py-1 rounded text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                          title="Reset temporary password & send fresh 2FA code"
                        >
                          Reset Pass
                        </button>
                        <button
                          onClick={() => handleRemoveAdmin(admin.id, admin.name)}
                          disabled={orgAdminsList.length <= 1}
                          className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                            orgAdminsList.length <= 1
                              ? 'text-zinc-300 cursor-not-allowed'
                              : 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title={orgAdminsList.length <= 1 ? 'Every institution must retain at least 1 administrator' : 'Remove Admin'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500 shrink-0">
              <span>{orgAdminsList.length} Active Administrator(s)</span>
              <button
                onClick={() => setSelectedOrgForAdmins(null)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-900 text-white rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
