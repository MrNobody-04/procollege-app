import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Video,
  Check,
  X,
  Building2,
  Key,
  CheckCircle2,
  Menu,
  Mail,
  MessageSquare,
  Loader2,
  ShieldCheck,
  Lock,
  ArrowLeft,
  KeyRound,
  RotateCcw,
  Play,
  FileText,
  Folder,
  BarChart2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Calendar,
  Award,
  Megaphone,
  BookOpen,
  Compass
} from 'lucide-react';
import { useApp, type ActiveTab } from '../context/AppContext';
import { ProCollegeLogo } from './ProCollegeLogo';
import { INITIAL_USERS } from '../data/initialData';
import type { User, UserRole } from '../types';
import {
  getOrCreateDeviceHash,
  getStoredDeviceToken,
  saveDeviceToken,
  getDeviceDisplayName
} from '../utils/deviceFingerprint';
import { initHeroAnimations } from '../utils/heroAnimations';

export const PortalLanding: React.FC = () => {
  const {
    setViewMode,
    setCurrentUser,
    availableUsers,
    setIsDemoMode,
    submitInstitutionalRequest,
    setActiveTab,
    courses,
    setSelectedCourse,
    setSelectedChannel
  } = useApp();

  // Initialize the ProSchool Hero & Scroll Motion System
  useEffect(() => {
    const cleanup = initHeroAnimations();
    return cleanup;
  }, []);

  const [showSignInModal, setShowSignInModal] = useState<boolean>(false);
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [requestSubmitted, setRequestSubmitted] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState<boolean>(false);

  // Dynamic Up-to-Date Real-Time Calendar for ProSchool Workspace Preview
  const calendarData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();
    const currentHour = now.getHours();

    const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
    const termSeason = currentMonth >= 7 ? 'Fall' : currentMonth >= 4 ? 'Summer' : 'Spring';
    const termText = `Term: ${termSeason} ${currentYear}`;
    const monthYearText = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sun
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const prevMonthDays = Array.from(
      { length: firstDayOfWeek },
      (_, i) => daysInPrevMonth - firstDayOfWeek + 1 + i
    );

    const currentMonthDays = Array.from(
      { length: daysInCurrentMonth },
      (_, i) => i + 1
    );

    const filledCount = prevMonthDays.length + currentMonthDays.length;
    const totalGridCells = filledCount <= 28 ? 28 : Math.ceil(filledCount / 7) * 7;
    const nextMonthDaysCount = totalGridCells - filledCount;
    const nextMonthDays = Array.from({ length: nextMonthDaysCount }, (_, i) => i + 1);

    return {
      greeting,
      termText,
      monthYearText,
      currentDay,
      prevMonthDays,
      currentMonthDays,
      nextMonthDays,
    };
  }, []);

  // Sign In & Password Reset Modal State
  const [authStep, setAuthStep] = useState<
    'credentials' | 'select-college' | 'otp' | 'change-password' | 'forgot-password-request' | 'forgot-password-verify'
  >('credentials');
  const [collegeOptions, setCollegeOptions] = useState<Array<{ id: string; name: string; code: string; role: string }>>([]);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // OTP State (Login 2FA)
  const [otpEmail, setOtpEmail] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendMessage, setResendMessage] = useState<string>('');

  // Forgot Password Recovery State
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetOtpCode, setResetOtpCode] = useState<string>('');
  const [resetNewPass, setResetNewPass] = useState<string>('');
  const [resetConfirmPass, setResetConfirmPass] = useState<string>('');
  const [isRequestingResetOtp, setIsRequestingResetOtp] = useState<boolean>(false);
  const [isVerifyingReset, setIsVerifyingReset] = useState<boolean>(false);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // First-time Password Change State
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [pendingAuthResponse, setPendingAuthResponse] = useState<any>(null);

  // Institutional Request Form State
  const [orgForm, setOrgForm] = useState({
    institutionName: '',
    department: '',
    contactName: '',
    email: '',
    phone: '',
    studentCount: 1500,
    deploymentType: 'campus-pro' as 'campus-pro' | 'enterprise',
    notes: ''
  });
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>('+977');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState<boolean>(false);

  const resetAuthModal = () => {
    setShowSignInModal(false);
    setAuthStep('credentials');
    setLoginError('');
    setResendMessage('');
    setLoginEmail('');
    setLoginPassword('');
    setOtpCode('');
    setOtpEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setResetEmail('');
    setResetOtpCode('');
    setResetNewPass('');
    setResetConfirmPass('');
    setCollegeOptions([]);
    setPendingAuthResponse(null);
  };

  const finishLoginSession = (data: any) => {
    const instName = data.college?.name || data.user.institutionName || 'ProSchool Campus';
    localStorage.setItem('procollege_token', data.token);
    localStorage.setItem('procollege_user', JSON.stringify(data.user));
    localStorage.setItem('procollege_college', JSON.stringify(data.college || { name: instName }));

    if (data.deviceToken) {
      saveDeviceToken(data.deviceToken);
    }

    const roleStr = String(data.user.role || '').toLowerCase();
    const mappedRole: UserRole =
      roleStr === 'developer' || roleStr === 'platform_admin'
        ? 'developer'
        : roleStr === 'admin'
          ? 'admin'
          : roleStr === 'student'
            ? 'student'
            : 'lecturer';

    const appUser: User = {
      id: data.user.id,
      loginId: data.user.loginId || data.user.email,
      name: data.user.name,
      email: data.user.email,
      role: mappedRole,
      license:
        mappedRole === 'developer'
          ? 'ProCollege Enterprise Platform License'
          : mappedRole === 'admin'
            ? 'ProCollege Verified for Administration'
            : mappedRole === 'lecturer'
              ? 'ProCollege Verified for Faculty'
              : 'ProCollege Verified for Students',
      department:
        mappedRole === 'developer'
          ? 'Platform Architecture & Operations'
          : mappedRole === 'admin'
            ? 'Administration'
            : String(data.user.department || 'Academic Department'),
      institutionName:
        mappedRole === 'developer'
          ? 'ProSchool Platform Operations'
          : instName,
      institutionId: data.college?.id || 'inst_active',
      collegeId: data.college?.id || 'inst_active',
      collegeName: instName,
      avatar:
        data.user.avatar ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80`,
      status: 'available',
      statusMessage: 'Signed into ProSchool Campus',
      isDemo: false
    };

    setIsDemoMode(false);
    setCurrentUser(appUser);
    setActiveTab(mappedRole === 'developer' || mappedRole === 'admin' ? 'admin' : 'teams');

    resetAuthModal();
    setShowRequestModal(false);
    setMobileMenuOpen(false);
    setViewMode('app');
  };

  const performLogin = async (email: string, pass: string, collegeId?: string) => {
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const deviceHash = getOrCreateDeviceHash();
      const deviceToken = getStoredDeviceToken();
      const deviceName = getDeviceDisplayName();

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-hash': deviceHash,
          ...(deviceToken ? { 'x-device-token': deviceToken } : {})
        },
        body: JSON.stringify({ email, password: pass, deviceHash, deviceName, collegeId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials.');
      }

      if (data.requireCollegeSelect) {
        setCollegeOptions(data.colleges || []);
        setAuthStep('select-college');
        return;
      }

      if (data.requireOtp) {
        setOtpEmail(data.email || email);
        setOtpCode('');
        setResendCooldown(60);
        setResendMessage(data.message || `A 6-digit security code has been sent to ${email}.`);
        setAuthStep('otp');
        return;
      }

      if (data.mustChangePassword) {
        setPendingAuthResponse(data);
        setAuthStep('change-password');
        return;
      }

      finishLoginSession(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setLoginError('');
    try {
      const targetEmail = authStep === 'forgot-password-verify' ? resetEmail : otpEmail;
      const res = await fetch(
        authStep === 'forgot-password-verify'
          ? '/api/auth/forgot-password/request-otp'
          : '/api/auth/resend-otp',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to resend verification code');
      }
      setResendMessage(data.message || `A new 6-digit verification code has been dispatched to ${targetEmail}.`);
      setResendCooldown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not resend verification code';
      setLoginError(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const code = otpCode.trim();
    if (!code || code.length !== 6) {
      setLoginError('Please enter the 6-digit code sent to your email.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const deviceHash = getOrCreateDeviceHash();
      const deviceName = getDeviceDisplayName();

      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-hash': deviceHash
        },
        body: JSON.stringify({
          email: otpEmail,
          otp: code,
          deviceHash,
          deviceName
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid or expired OTP code.');
      }

      if (data.deviceToken) {
        saveDeviceToken(data.deviceToken);
      }

      if (data.mustChangePassword) {
        setPendingAuthResponse(data);
        setAuthStep('change-password');
        return;
      }

      finishLoginSession(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error verifying security code';
      setLoginError(message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleRequestPasswordResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setResendMessage('');
    const email = resetEmail.trim().toLowerCase();
    if (!email) {
      setLoginError('Please enter your registered institutional email address.');
      return;
    }

    setIsRequestingResetOtp(true);
    try {
      const res = await fetch('/api/auth/forgot-password/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to request password reset code.');
      }

      setResetOtpCode('');
      setResetNewPass('');
      setResetConfirmPass('');
      setAuthStep('forgot-password-verify');
      setResendCooldown(60);
      setResendMessage(data.message || `A 6-digit security code has been sent to ${email}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error requesting password reset.';
      setLoginError(msg);
    } finally {
      setIsRequestingResetOtp(false);
    }
  };

  const handleVerifyPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const code = resetOtpCode.trim();
    if (!code || code.length !== 6) {
      setLoginError('Please enter a valid 6-digit verification code.');
      return;
    }
    if (!resetNewPass || resetNewPass.length < 6) {
      setLoginError('New password must be at least 6 characters long.');
      return;
    }
    if (resetNewPass !== resetConfirmPass) {
      setLoginError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsVerifyingReset(true);
    try {
      const deviceHash = getOrCreateDeviceHash();
      const deviceName = getDeviceDisplayName();

      const res = await fetch('/api/auth/forgot-password/verify-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-hash': deviceHash,
        },
        body: JSON.stringify({
          email: resetEmail.trim().toLowerCase(),
          otpCode: code,
          newPassword: resetNewPass,
          deviceHash,
          deviceName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      if (data.deviceToken) {
        saveDeviceToken(data.deviceToken);
      }

      finishLoginSession(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error resetting password.';
      setLoginError(msg);
    } finally {
      setIsVerifyingReset(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!newPassword || newPassword.length < 6) {
      setLoginError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLoginError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pendingAuthResponse?.token || ''}`,
        },
        body: JSON.stringify({
          newPassword,
          email: pendingAuthResponse?.user?.email || otpEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update password.');
      }

      finishLoginSession(pendingAuthResponse);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setLoginError(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const launchDemoMode = (targetRoleOrUser: 'student' | 'professor' | 'admin' | typeof availableUsers[0] = 'student') => {
    try {
      localStorage.removeItem('procollege_token');
      localStorage.removeItem('procollege_user');
      localStorage.removeItem('procollege_college');
      sessionStorage.clear();
    } catch {
      // ignore
    }

    setIsDemoMode(true);
    const allUsers = [...availableUsers, ...INITIAL_USERS];
    let demoUser: User;
    let targetTab: ActiveTab = 'teams';

    if (typeof targetRoleOrUser === 'object') {
      demoUser = targetRoleOrUser;
      targetTab = targetRoleOrUser.role === 'admin' ? 'admin' : 'teams';
    } else if (targetRoleOrUser === 'admin') {
      demoUser =
        allUsers.find(u => u.id === 'user_org_admin') ||
        allUsers.find(u => u.role === 'admin') ||
        INITIAL_USERS[1];
      targetTab = 'admin';
    } else if (targetRoleOrUser === 'professor') {
      demoUser =
        allUsers.find(u => u.id === 'user_alan') ||
        allUsers.find(u => u.role === 'professor' || u.role === 'lecturer' || (u as unknown as { role: string }).role === 'teacher') ||
        INITIAL_USERS[0];
      targetTab = 'teams';
    } else {
      demoUser =
        allUsers.find(u => u.id === 'user_alex') ||
        allUsers.find(u => u.role === 'student') ||
        INITIAL_USERS[2];
      targetTab = 'teams';
    }

    setCurrentUser(demoUser);
    setActiveTab(targetTab);

    if (courses && courses.length > 0) {
      const matchCourse = courses.find(c => c.institutionName === demoUser.institutionName) || courses[0];
      setSelectedCourse(matchCourse);
      if (matchCourse.channels && matchCourse.channels.length > 0) {
        setSelectedChannel(matchCourse.channels[0]);
      }
    }

    setShowSignInModal(false);
    setShowRequestModal(false);
    setMobileMenuOpen(false);
    setViewMode('app');
  };

  const handleInstitutionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const email = loginEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setLoginError('Please enter a valid institutional email address.');
      return;
    }

    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    await performLogin(email, loginPassword);
  };

  const handleOrgRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgForm.institutionName || !orgForm.contactName || !orgForm.email) return;

    setIsSubmittingRequest(true);
    const fullPhone = orgForm.phone.trim() ? `${phoneCountryCode} ${orgForm.phone.trim()}` : '';

    const payload = {
      institutionName: orgForm.institutionName.trim(),
      department: orgForm.department.trim() || 'Academic Operations',
      contactName: orgForm.contactName.trim(),
      email: orgForm.email.trim(),
      phone: fullPhone || 'N/A',
      studentCount: Number(orgForm.studentCount) || 1000,
      deploymentType: orgForm.deploymentType,
      notes: orgForm.notes.trim()
    };

    try {
      await fetch('/api/colleges/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('Could not post inquiry to live backend:', err);
    } finally {
      setIsSubmittingRequest(false);
    }

    submitInstitutionalRequest(payload);
    setRequestSubmitted(true);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
    setSolutionsDropdownOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-white text-zinc-900 font-sans selection:bg-[#4F46E5] selection:text-white antialiased overflow-x-hidden relative">
      {/* ============================================================== */}
      {/* 1. TOP NAVIGATION BAR (Approved ProSchool Styling)             */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* ProSchool Brand Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 cursor-pointer group select-none shrink-0"
          >
            <ProCollegeLogo size="md" brandName="ProSchool" showSlogan={false} />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-[14px] font-semibold text-zinc-600">
            <button
              onClick={() => scrollTo('home')}
              className="hover:text-[#4F46E5] transition-colors cursor-pointer text-zinc-900 font-bold"
            >
              Home
            </button>
            <button
              onClick={() => scrollTo('features')}
              className="hover:text-[#4F46E5] transition-colors cursor-pointer"
            >
              Features
            </button>

            {/* Solutions with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSolutionsDropdownOpen(!solutionsDropdownOpen)}
                onBlur={() => setTimeout(() => setSolutionsDropdownOpen(false), 200)}
                className="hover:text-[#4F46E5] transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Solutions</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {solutionsDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-zinc-100 rounded-xl shadow-xl py-2 z-50 text-xs">
                  <button
                    onClick={() => scrollTo('solutions')}
                    className="w-full px-4 py-2 text-left hover:bg-indigo-50 hover:text-[#4F46E5] flex items-center gap-2"
                  >
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>For Administrators</span>
                  </button>
                  <button
                    onClick={() => scrollTo('solutions')}
                    className="w-full px-4 py-2 text-left hover:bg-indigo-50 hover:text-[#4F46E5] flex items-center gap-2"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                    <span>For Teachers</span>
                  </button>
                  <button
                    onClick={() => scrollTo('solutions')}
                    className="w-full px-4 py-2 text-left hover:bg-indigo-50 hover:text-[#4F46E5] flex items-center gap-2"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span>For Students</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowRequestModal(true)}
              className="hover:text-[#4F46E5] transition-colors cursor-pointer"
            >
              Contact
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowSignInModal(true)}
              className="text-xs sm:text-sm font-bold text-zinc-700 hover:text-[#4F46E5] px-3.5 sm:px-4 py-2 rounded-xl border border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer"
            >
              Sign In
            </button>

            <button
              onClick={() => setShowRequestModal(true)}
              className="hero-button bg-gradient-to-r from-[#4F46E5] via-[#5B4FF5] to-[#4338CA] hover:from-[#4338CA] hover:to-[#3730A3] text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-[0_4px_16px_rgba(79,70,229,0.28)] flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <span>Get Started Free</span>
              <span className="text-xs font-bold">→</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/98 border-b border-zinc-200 px-6 py-5 space-y-3 shadow-lg">
            <div className="flex flex-col space-y-2 text-sm font-semibold text-zinc-700">
              <button
                onClick={() => scrollTo('home')}
                className="w-full text-left py-2 hover:text-[#4F46E5] transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollTo('features')}
                className="w-full text-left py-2 hover:text-[#4F46E5] transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollTo('solutions')}
                className="w-full text-left py-2 hover:text-[#4F46E5] transition-colors"
              >
                Solutions
              </button>
              <button
                onClick={() => {
                  setShowRequestModal(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 hover:text-[#4F46E5] transition-colors"
              >
                Contact &amp; Access
              </button>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2">
              <button
                onClick={() => launchDemoMode('student')}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 text-[#4F46E5] font-bold text-xs text-center border border-indigo-200 cursor-pointer"
              >
                Explore Live Demo
              </button>
              <button
                onClick={() => {
                  setShowRequestModal(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-[#4F46E5] text-white py-2.5 px-4 rounded-xl font-bold text-xs text-center shadow-md cursor-pointer"
              >
                Request Campus Deployment →
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================== */}
      {/* 2. HERO SECTION WITH 3D TILT DASHBOARD & FLOATING NOTIFICATIONS */}
      {/* ============================================================== */}
      <section className="hero relative bg-gradient-to-b from-[#FAF8FF] via-white to-white pt-10 sm:pt-16 pb-16 sm:pb-24 overflow-hidden" id="home">
        {/* Subtle Parallax Background Glows */}
        <div className="hero-bg hero-bg-one -top-24 -left-24 w-96 h-96 rounded-full bg-purple-100/50 blur-3xl" />
        <div className="hero-bg hero-bg-two top-1/2 right-0 w-[450px] h-[450px] rounded-full bg-indigo-100/40 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Heading, Subtext, CTAs, Social Proof */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <h1
                data-reveal
                style={{ '--reveal-delay': '100ms' } as React.CSSProperties}
                className="text-3xl sm:text-5xl lg:text-[56px] font-black tracking-tight text-zinc-950 leading-[1.12]"
              >
                Build a Smarter <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#4338CA] bg-clip-text text-transparent">
                  Campus Experience
                </span>
              </h1>

              <p
                data-reveal
                style={{ '--reveal-delay': '250ms' } as React.CSSProperties}
                className="text-base sm:text-lg text-zinc-600 max-w-xl leading-relaxed"
              >
                ProSchool brings your college or school community together in one powerful platform — just like Teams, but built for education.
              </p>

              {/* Action Buttons */}
              <div
                data-reveal
                style={{ '--reveal-delay': '400ms' } as React.CSSProperties}
                className="flex flex-wrap items-center gap-3 pt-1"
              >
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="hero-button px-6 sm:px-7 py-3 sm:py-3.5 bg-gradient-to-r from-[#4F46E5] to-[#4338CA] hover:from-[#4338CA] hover:to-[#3730A3] text-white rounded-xl text-sm sm:text-base font-bold shadow-[0_10px_25px_rgba(79,70,229,0.28)] flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>Start Free Trial</span>
                  <span>→</span>
                </button>

                <button
                  onClick={() => launchDemoMode('student')}
                  className="hero-button px-5 sm:px-6 py-3 sm:py-3.5 bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 rounded-xl text-sm sm:text-base font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Play className="w-4 h-4 text-[#4F46E5] fill-[#4F46E5]" />
                  <span>Watch Demo</span>
                </button>
              </div>

              {/* Social Proof & Trusted Indicator */}
              <div
                data-reveal
                style={{ '--reveal-delay': '550ms' } as React.CSSProperties}
                className="flex items-center gap-3.5 pt-3"
              >
                <div className="flex -space-x-2 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80"
                    alt="Student"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white object-cover"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80"
                    alt="Lecturer"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white object-cover"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80"
                    alt="Student"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white object-cover"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80"
                    alt="Dean"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white object-cover"
                  />
                </div>
                <div className="text-xs text-zinc-600">
                  <p className="font-bold text-zinc-900 leading-tight">
                    Trusted by 500+ Schools &amp; Colleges
                  </p>
                  <p className="text-[11px] text-zinc-500">across Nepal &amp; South Asia</p>
                </div>
              </div>
            </div>

            {/* Right Column: Realistic 3D Tilt Floating Dashboard & Floating Notifications */}
            <div className="lg:col-span-6 relative">
              <div
                className="hero-dashboard-shell relative"
                data-reveal="right"
                style={{ '--reveal-delay': '200ms' } as React.CSSProperties}
              >
                {/* Main 3D Floating Dashboard Card */}
                <div className="hero-dashboard bg-white border border-[#E0E7FF] rounded-2xl shadow-[0_25px_70px_rgba(79,70,229,0.13),0_5px_20px_rgba(79,70,229,0.06)] p-3 sm:p-5 overflow-hidden">
                  {/* Mock Window Top Bar */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="ml-2 text-[11px] font-bold text-zinc-600 font-mono">
                        proschool.edu.np/dashboard
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                        ● Term Active
                      </span>
                    </div>
                  </div>

                  {/* Dashboard Content Mockup */}
                  <div className="grid grid-cols-12 gap-3 text-xs">
                    {/* Mini Sidebar */}
                    <div className="col-span-3 bg-zinc-50/70 border border-zinc-100 rounded-xl p-2.5 space-y-2 hidden sm:block">
                      <div className="flex items-center gap-1.5 text-[#4F46E5] font-bold pb-2 border-b border-zinc-200/60">
                        <GraduationCap className="w-4 h-4" />
                        <span className="text-[11px]">ProSchool</span>
                      </div>
                      <div className="space-y-1 text-[11px] text-zinc-600">
                        <div className="bg-[#4F46E5]/10 text-[#4F46E5] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5" />
                          <span>Dashboard</span>
                        </div>
                        <div className="hover:bg-zinc-100 px-2 py-1 rounded flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Classes</span>
                        </div>
                        <div className="hover:bg-zinc-100 px-2 py-1 rounded flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Assignments</span>
                        </div>
                        <div className="hover:bg-zinc-100 px-2 py-1 rounded flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Meetings</span>
                        </div>
                      </div>
                    </div>

                    {/* Main Workspace Area */}
                    <div className="col-span-12 sm:col-span-9 space-y-3">
                      {/* Greeting Header */}
                      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50/60 to-purple-50/40 p-3 rounded-xl border border-indigo-100/60">
                        <div>
                          <h4 className="font-bold text-zinc-900 text-xs sm:text-sm">
                            Good Morning, Professor! 👋
                          </h4>
                          <p className="text-[11px] text-zinc-500">B.Sc. Computer Science • Semester 4</p>
                        </div>
                        <span className="text-[10px] bg-white text-indigo-700 px-2 py-1 rounded-md font-semibold border border-indigo-100 shadow-2xs">
                          Live Sync
                        </span>
                      </div>

                      {/* Stat Counters */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                          <span className="text-[10px] text-blue-700 font-semibold block">Total Students</span>
                          <span className="text-base sm:text-lg font-black text-blue-950">2,850</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100">
                          <span className="text-[10px] text-purple-700 font-semibold block">Active Classes</span>
                          <span className="text-base sm:text-lg font-black text-purple-950">24</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                          <span className="text-[10px] text-emerald-700 font-semibold block">Pending Tasks</span>
                          <span className="text-base sm:text-lg font-black text-emerald-950">12</span>
                        </div>
                      </div>

                      {/* Upcoming Class Schedule Item */}
                      <div className="p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            CS
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 text-xs">CS 301: Advanced Algorithms</p>
                            <p className="text-[10px] text-zinc-500">Today, 10:00 AM – 11:30 AM • Turing Hall</p>
                          </div>
                        </div>
                        <button
                          onClick={() => launchDemoMode('professor')}
                          className="px-2.5 py-1 bg-[#4F46E5] text-white rounded-lg text-[10px] font-bold hover:bg-[#4338CA] transition-colors cursor-pointer shrink-0"
                        >
                          Join Class
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Notification 1: Assignment Submitted */}
                <div className="hero-notification -top-4 -right-2 sm:-right-6 bg-white px-3.5 py-2.5 rounded-xl border border-emerald-100 shadow-[0_12px_28px_rgba(16,185,129,0.18)] flex items-center gap-2.5 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 leading-tight">Assignment Submitted</p>
                    <p className="text-[10px] text-zinc-500">CS 301: Dynamic Graph Solvers</p>
                  </div>
                </div>

                {/* Floating Notification 2: New Announcement */}
                <div className="hero-notification -bottom-4 -left-2 sm:-left-6 bg-white px-3.5 py-2.5 rounded-xl border border-indigo-100 shadow-[0_12px_28px_rgba(79,70,229,0.18)] flex items-center gap-2.5 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 leading-tight">New Class Announcement</p>
                    <p className="text-[10px] text-zinc-500">Semester Term Timetable Released</p>
                  </div>
                </div>

                {/* Floating Notification 3: Upcoming Meeting */}
                <div className="hero-notification -top-6 left-10 bg-white px-3 py-2 rounded-xl border border-blue-100 shadow-[0_10px_24px_rgba(37,99,235,0.14)] hidden sm:flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Video className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 leading-tight text-[11px]">Upcoming Meeting</p>
                    <p className="text-[9px] text-zinc-500">Faculty Council in 15 mins</p>
                  </div>
                </div>

                {/* Floating Notification 4: Resource Uploaded */}
                <div className="hero-notification -bottom-6 right-6 bg-white px-3 py-2 rounded-xl border border-purple-100 shadow-[0_10px_24px_rgba(147,51,234,0.14)] hidden sm:flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 leading-tight text-[11px]">Resource Uploaded</p>
                    <p className="text-[9px] text-zinc-500">Lecture04_Graphs.pdf</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. CORE PLATFORM CAPABILITIES (6 Cards Matched to Image 2)     */}
      {/* ============================================================== */}
      <section className="py-14 sm:py-20 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {/* Card 1: Live & Recorded Classes */}
            <div
              data-reveal
              style={{ '--reveal-delay': '100ms' } as React.CSSProperties}
              className="bg-white rounded-3xl p-7 sm:p-8 border border-purple-100/70 shadow-[0_4px_25px_rgba(99,102,241,0.04)] hover:shadow-[0_12px_35px_rgba(99,102,241,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#5B4FF5] text-white flex items-center justify-center shadow-[0_6px_20px_rgba(91,79,245,0.35)] mb-6">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-extrabold text-lg sm:text-xl text-zinc-950 mb-2.5 tracking-tight">
                  Live &amp; Recorded Classes
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed mb-6">
                  Teach and share knowledge anywhere, anytime.
                </p>
              </div>
              <button
                onClick={() => launchDemoMode('professor')}
                className="mt-auto text-xs sm:text-sm font-bold text-[#4F46E5] hover:text-[#4338CA] inline-flex items-center gap-1.5 cursor-pointer w-fit"
              >
                <span>Learn More</span>
                <span>→</span>
              </button>
            </div>

            {/* Card 2: Assignments & Exams */}
            <div
              data-reveal
              style={{ '--reveal-delay': '200ms' } as React.CSSProperties}
              className="bg-white rounded-3xl p-7 sm:p-8 border border-purple-100/70 shadow-[0_4px_25px_rgba(99,102,241,0.04)] hover:shadow-[0_12px_35px_rgba(99,102,241,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-[0_6px_20px_rgba(16,185,129,0.35)] mb-6">
                  <Check className="w-6 h-6 stroke-[3] text-white" />
                </div>
                <h3 className="font-extrabold text-lg sm:text-xl text-zinc-950 mb-2.5 tracking-tight">
                  Assignments &amp; Exams
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed mb-6">
                  Create, distribute, and track assignments easily.
                </p>
              </div>
              <button
                onClick={() => launchDemoMode('student')}
                className="mt-auto text-xs sm:text-sm font-bold text-[#4F46E5] hover:text-[#4338CA] inline-flex items-center gap-1.5 cursor-pointer w-fit"
              >
                <span>Learn More</span>
                <span>→</span>
              </button>
            </div>

            {/* Card 3: Student Management */}
            <div
              data-reveal
              style={{ '--reveal-delay': '300ms' } as React.CSSProperties}
              className="bg-white rounded-3xl p-7 sm:p-8 border border-purple-100/70 shadow-[0_4px_25px_rgba(99,102,241,0.04)] hover:shadow-[0_12px_35px_rgba(99,102,241,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#5B4FF5] text-white flex items-center justify-center shadow-[0_6px_20px_rgba(91,79,245,0.35)] mb-6">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-extrabold text-lg sm:text-xl text-zinc-950 mb-2.5 tracking-tight">
                  Student Management
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed mb-6">
                  Manage students, classes, and progress.
                </p>
              </div>
              <button
                onClick={() => launchDemoMode('admin')}
                className="mt-auto text-xs sm:text-sm font-bold text-[#4F46E5] hover:text-[#4338CA] inline-flex items-center gap-1.5 cursor-pointer w-fit"
              >
                <span>Learn More</span>
                <span>→</span>
              </button>
            </div>

            {/* Card 4: Real-Time Collaboration */}
            <div
              data-reveal
              style={{ '--reveal-delay': '400ms' } as React.CSSProperties}
              className="bg-white rounded-3xl p-7 sm:p-8 border border-purple-100/70 shadow-[0_4px_25px_rgba(99,102,241,0.04)] hover:shadow-[0_12px_35px_rgba(99,102,241,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#5B4FF5] text-white flex items-center justify-center shadow-[0_6px_20px_rgba(91,79,245,0.35)] mb-6">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-extrabold text-lg sm:text-xl text-zinc-950 mb-2.5 tracking-tight">
                  Real-Time Collaboration
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed mb-6">
                  Chat, discuss, and work together effortlessly.
                </p>
              </div>
              <button
                onClick={() => launchDemoMode('student')}
                className="mt-auto text-xs sm:text-sm font-bold text-[#4F46E5] hover:text-[#4338CA] inline-flex items-center gap-1.5 cursor-pointer w-fit"
              >
                <span>Learn More</span>
                <span>→</span>
              </button>
            </div>

            {/* Card 5: Resource Library */}
            <div
              data-reveal
              style={{ '--reveal-delay': '500ms' } as React.CSSProperties}
              className="bg-white rounded-3xl p-7 sm:p-8 border border-purple-100/70 shadow-[0_4px_25px_rgba(99,102,241,0.04)] hover:shadow-[0_12px_35px_rgba(99,102,241,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#3B82F6] text-white flex items-center justify-center shadow-[0_6px_20px_rgba(59,130,246,0.35)] mb-6">
                  <Folder className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-extrabold text-lg sm:text-xl text-zinc-950 mb-2.5 tracking-tight">
                  Resource Library
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed mb-6">
                  Share files, notes, and study materials.
                </p>
              </div>
              <button
                onClick={() => launchDemoMode('professor')}
                className="mt-auto text-xs sm:text-sm font-bold text-[#4F46E5] hover:text-[#4338CA] inline-flex items-center gap-1.5 cursor-pointer w-fit"
              >
                <span>Learn More</span>
                <span>→</span>
              </button>
            </div>

            {/* Card 6: Progress Analytics */}
            <div
              data-reveal
              style={{ '--reveal-delay': '600ms' } as React.CSSProperties}
              className="bg-white rounded-3xl p-7 sm:p-8 border border-purple-100/70 shadow-[0_4px_25px_rgba(99,102,241,0.04)] hover:shadow-[0_12px_35px_rgba(99,102,241,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#5B4FF5] text-white flex items-center justify-center shadow-[0_6px_20px_rgba(91,79,245,0.35)] mb-6">
                  <BarChart2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-extrabold text-lg sm:text-xl text-zinc-950 mb-2.5 tracking-tight">
                  Progress Analytics
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed mb-6">
                  Track performance with detailed insights.
                </p>
              </div>
              <button
                onClick={() => launchDemoMode('admin')}
                className="mt-auto text-xs sm:text-sm font-bold text-[#4F46E5] hover:text-[#4338CA] inline-flex items-center gap-1.5 cursor-pointer w-fit"
              >
                <span>Learn More</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. BUILT FOR INSTITUTIONS OF ALL SIZES (Matched to Image 2)    */}
      {/* ============================================================== */}
      <section className="py-16 sm:py-24 bg-white border-t border-purple-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <h2
                data-reveal
                style={{ '--reveal-delay': '150ms' } as React.CSSProperties}
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#111827] tracking-tight leading-tight"
              >
                Built for Institutions <br />
                of All Sizes
              </h2>

              <p
                data-reveal
                style={{ '--reveal-delay': '250ms' } as React.CSSProperties}
                className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-md"
              >
                Whether it's a small college or a large university, ProSchool scales with your needs.
              </p>

              <div
                data-reveal
                style={{ '--reveal-delay': '350ms' } as React.CSSProperties}
                className="space-y-3.5 text-sm sm:text-base text-zinc-800 font-medium"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#6366F1] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Easy setup &amp; onboarding</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#6366F1] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Highly customizable</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#6366F1] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>24/7 support</span>
                </div>
              </div>

              <div data-reveal style={{ '--reveal-delay': '450ms' } as React.CSSProperties} className="pt-2">
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="px-7 py-3.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Learn More</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Right Campus Architecture Visual with organic purple backdrop blob */}
            <div className="lg:col-span-6 relative flex items-center justify-center" data-reveal="right">
              {/* Decorative organic lavender backdrop blob matching Image 2 */}
              <div className="absolute -inset-4 sm:-inset-6 bg-gradient-to-tr from-purple-300/40 via-indigo-200/30 to-purple-400/25 rounded-[44px] filter blur-xs -z-10 transform -rotate-1" />
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl -z-10 pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl -z-10 pointer-events-none" />

              <div className="relative rounded-3xl sm:rounded-[32px] overflow-hidden shadow-2xl border-2 border-white/80 group w-full">
                <img
                  src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80"
                  alt="Modern Campus Architecture"
                  className="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. EMPOWERING EDUCATION, TOGETHER (3 Role Solutions)          */}
      {/* ============================================================== */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white via-indigo-50/30 to-white" id="solutions">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span
              data-reveal
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-[#4F46E5] border border-indigo-200/80 mb-3"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Solutions for Every Need</span>
            </span>
            <h2
              data-reveal
              style={{ '--reveal-delay': '150ms' } as React.CSSProperties}
              className="text-2xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight"
            >
              Empowering Education, Together
            </h2>
            <p
              data-reveal
              style={{ '--reveal-delay': '250ms' } as React.CSSProperties}
              className="text-sm sm:text-base text-zinc-500 mt-2"
            >
              Whether you are an administrator, teacher, or student — ProSchool is designed for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Persona 1: Administrators */}
            <div
              data-reveal
              style={{ '--reveal-delay': '100ms' } as React.CSSProperties}
              className="feature-card p-6 sm:p-7 bg-white rounded-2xl border border-zinc-200/90 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-[#4F46E5] flex items-center justify-center shadow-2xs">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">For Administrators</h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Manage your institution efficiently with role-based access control, departmental cohort allocation, and automated semester rollovers.
                </p>
                <ul className="text-xs text-zinc-600 space-y-1.5 pt-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>Multi-faculty department management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>Granular RBAC access controls</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>Institutional audit trails</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => launchDemoMode('admin')}
                className="mt-6 text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 cursor-pointer"
              >
                <span>Launch Admin Preview</span>
                <span>→</span>
              </button>
            </div>

            {/* Persona 2: Teachers */}
            <div
              data-reveal
              style={{ '--reveal-delay': '200ms' } as React.CSSProperties}
              className="feature-card p-6 sm:p-7 bg-white rounded-2xl border border-zinc-200/90 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-2xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">For Teachers</h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Create engaging classes, track progress, distribute coursework, and grade with SpeedGrader and criterion rubrics in seconds.
                </p>
                <ul className="text-xs text-zinc-600 space-y-1.5 pt-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-600" />
                    <span>Interactive lecture channels</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-600" />
                    <span>SpeedGrader™ grading workflow</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-600" />
                    <span>Direct student &amp; group messaging</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => launchDemoMode('professor')}
                className="mt-6 text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Launch Teacher Preview</span>
                <span>→</span>
              </button>
            </div>

            {/* Persona 3: Students */}
            <div
              data-reveal
              style={{ '--reveal-delay': '300ms' } as React.CSSProperties}
              className="feature-card p-6 sm:p-7 bg-white rounded-2xl border border-zinc-200/90 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">For Students</h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Access course resources, submit homework, collaborate on team assignments, and stay synchronized with deadline calendars.
                </p>
                <ul className="text-xs text-zinc-600 space-y-1.5 pt-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Unified class noticeboards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Instant file preview &amp; uploads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Timetable &amp; submission alerts</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => launchDemoMode('student')}
                className="mt-6 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Launch Student Preview</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. EVERYTHING YOU NEED IN ONE PLACE (Interactive Dashboard UI) */}
      {/* ============================================================== */}
      <section className="py-16 sm:py-24 bg-white border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <h2
                data-reveal
                style={{ '--reveal-delay': '150ms' } as React.CSSProperties}
                className="text-2xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight leading-tight"
              >
                Everything You Need in One Place
              </h2>

              <p
                data-reveal
                style={{ '--reveal-delay': '250ms' } as React.CSSProperties}
                className="text-sm sm:text-base text-zinc-600 leading-relaxed"
              >
                From virtual classrooms to student management, ProSchool helps you work smarter, not harder.
              </p>

              <div
                data-reveal
                style={{ '--reveal-delay': '350ms' } as React.CSSProperties}
                className="space-y-3 text-xs sm:text-sm text-zinc-700"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-[#4F46E5] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Conduct live &amp; recorded classes</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-[#4F46E5] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Share resources &amp; announcements</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-[#4F46E5] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Manage assignments &amp; deadlines</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-[#4F46E5] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Communicate with students &amp; parents</span>
                </div>
              </div>

              <div data-reveal style={{ '--reveal-delay': '450ms' } as React.CSSProperties} className="pt-2">
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors cursor-pointer"
                >
                  Explore All Features →
                </button>
              </div>
            </div>

            {/* Right Detailed Dashboard Mockup */}
            <div className="lg:col-span-7" data-reveal="right">
              <div className="bg-white border border-zinc-200 rounded-3xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(79,70,229,0.08)] space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#4F46E5] text-white flex items-center justify-center font-bold text-xs">
                      P
                    </div>
                    <span className="font-bold text-xs text-zinc-900">ProSchool Workspace</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">{calendarData.termText}</span>
                </div>

                {/* Main Inside Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Left Column Stats */}
                  <div className="sm:col-span-7 space-y-3">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3.5 rounded-2xl border border-indigo-100">
                      <p className="text-xs text-indigo-950 font-bold">{calendarData.greeting}, Teacher! 👋</p>
                      <p className="text-[11px] text-zinc-500">Ready for today's classes?</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-center">
                        <span className="text-[10px] text-blue-700 font-semibold block">Students</span>
                        <span className="text-base font-black text-blue-950">2,850</span>
                      </div>
                      <div className="p-2.5 bg-rose-50/70 border border-rose-100 rounded-xl text-center">
                        <span className="text-[10px] text-rose-700 font-semibold block">Classes</span>
                        <span className="text-base font-black text-rose-950">24</span>
                      </div>
                      <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-center">
                        <span className="text-[10px] text-emerald-700 font-semibold block">Tasks</span>
                        <span className="text-base font-black text-emerald-950">12</span>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Next Lecture</span>
                      <p className="text-xs font-bold text-zinc-900">Computer Science • Algorithms</p>
                      <p className="text-[10px] text-zinc-500">10:00 AM – 11:30 AM (Room 204)</p>
                    </div>
                  </div>

                  {/* Right Calendar Simulation - Fully Dynamic & Up-to-Date */}
                  <div className="sm:col-span-5 bg-zinc-50/70 border border-zinc-200/80 rounded-2xl p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-zinc-800 text-[11px]">
                      <span>{calendarData.monthYearText}</span>
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-zinc-400 font-mono">
                      <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono">
                      {calendarData.prevMonthDays.map((d) => (
                        <span key={`prev-${d}`} className="text-zinc-300 py-0.5 select-none">{d}</span>
                      ))}
                      {calendarData.currentMonthDays.map((d) => (
                        <span
                          key={`curr-${d}`}
                          className={`py-0.5 rounded transition-colors ${
                            d === calendarData.currentDay
                              ? 'bg-[#4F46E5] text-white font-bold shadow-xs'
                              : 'text-zinc-700 hover:bg-zinc-200 cursor-default'
                          }`}
                        >
                          {d}
                        </span>
                      ))}
                      {calendarData.nextMonthDays.map((d) => (
                        <span key={`next-${d}`} className="text-zinc-300 py-0.5 select-none">{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. CONTINUOUS IN-MOTION OCEAN WAVES + PHONE-OPTIMIZED FOOTER   */}
      {/* ============================================================== */}
      {/* Continuous Living Ocean Waves Divider */}
      <div className="relative w-full overflow-hidden leading-none bg-white h-10 sm:h-20 md:h-28 -mb-1 select-none pointer-events-none">
        {/* Layer 1: Back Wave (Translucent Indigo #6366F1) */}
        <div className="absolute inset-x-0 bottom-0 w-[200%] h-full flex animate-wave-slow">
          <svg
            className="w-full h-full block"
            viewBox="0 0 2880 160"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 0,30 C 280,75 520,5 720,40 C 920,75 1160,5 1440,40 C 1720,75 1960,5 2160,40 C 2360,75 2600,5 2880,40 L 2880,160 L 0,160 Z"
              fill="#6366F1"
              fillOpacity="0.4"
            />
          </svg>
        </div>

        {/* Layer 2: Middle Wave (Translucent Violet #818CF8 in Reverse) */}
        <div className="absolute inset-x-0 bottom-0 w-[200%] h-full flex animate-wave-medium">
          <svg
            className="w-full h-full block"
            viewBox="0 0 2880 160"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 0,45 C 320,95 440,10 720,50 C 1000,90 1140,15 1440,50 C 1760,95 1880,10 2160,50 C 2440,90 2580,15 2880,50 L 2880,160 L 0,160 Z"
              fill="#818CF8"
              fillOpacity="0.45"
            />
          </svg>
        </div>

        {/* Layer 3: Front Solid Deep Dark Navy Wave (#111827) */}
        <div className="absolute inset-x-0 bottom-0 w-[200%] h-full flex animate-wave-fast">
          <svg
            className="w-full h-full block"
            viewBox="0 0 2880 160"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 0,65 C 240,120 480,20 720,65 C 960,110 1200,20 1440,65 C 1680,120 1920,20 2160,65 C 2400,110 2640,20 2880,65 L 2880,160 L 0,160 Z"
              fill="#111827"
            />
          </svg>
        </div>
      </div>

      <footer className="bg-[#111827] text-zinc-400 pt-6 sm:pt-10 pb-6 sm:pb-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 sm:gap-8">
            {/* Brand Logo & Compact Social Icons */}
            <div className="space-y-3 shrink-0 md:max-w-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                  <GraduationCap className="w-5 h-5 text-[#A5B4FC]" />
                </div>
                <div>
                  <span className="font-extrabold text-base sm:text-lg text-white tracking-tight block">ProSchool</span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-zinc-500 tracking-widest uppercase block">
                    LEARN · COLLABORATE · EXCEL
                  </span>
                </div>
              </div>

              {/* Social Icon Row: YouTube, LinkedIn, Discord, X, Facebook */}
              <div className="flex items-center gap-2 pt-1 text-zinc-400">
                {/* YouTube */}
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-800/80 hover:bg-[#6366F1] hover:text-white flex items-center justify-center transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-800/80 hover:bg-[#6366F1] hover:text-white flex items-center justify-center transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>

                {/* Discord */}
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Discord"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-800/80 hover:bg-[#6366F1] hover:text-white flex items-center justify-center transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>

                {/* X (formerly Twitter) */}
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-800/80 hover:bg-[#6366F1] hover:text-white flex items-center justify-center transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-800/80 hover:bg-[#6366F1] hover:text-white flex items-center justify-center transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* 3 Compact Link Columns Side-by-Side on Phone */}
            <div className="grid grid-cols-3 gap-4 sm:gap-10">
              {/* Col: Product */}
              <div className="space-y-2">
                <h4 className="font-bold text-[11px] sm:text-xs uppercase tracking-wider text-white">Product</h4>
                <ul className="space-y-1.5 text-[11px] sm:text-xs text-zinc-400">
                  <li><button onClick={() => scrollTo('features')} className="hover:text-white transition-colors cursor-pointer">Features</button></li>
                  <li><button onClick={() => scrollTo('solutions')} className="hover:text-white transition-colors cursor-pointer">Solutions</button></li>
                  <li><button onClick={() => scrollTo('features')} className="hover:text-white transition-colors cursor-pointer">Changelog</button></li>
                </ul>
              </div>

              {/* Col: Resources */}
              <div className="space-y-2">
                <h4 className="font-bold text-[11px] sm:text-xs uppercase tracking-wider text-white">Resources</h4>
                <ul className="space-y-1.5 text-[11px] sm:text-xs text-zinc-400">
                  <li><button onClick={() => scrollTo('features')} className="hover:text-white transition-colors cursor-pointer">Platform</button></li>
                  <li><button onClick={() => setShowRequestModal(true)} className="hover:text-white transition-colors cursor-pointer">Support</button></li>
                  <li><button onClick={() => setShowSignInModal(true)} className="hover:text-white transition-colors cursor-pointer">Portal</button></li>
                </ul>
              </div>

              {/* Col: Company */}
              <div className="space-y-2">
                <h4 className="font-bold text-[11px] sm:text-xs uppercase tracking-wider text-white">Company</h4>
                <ul className="space-y-1.5 text-[11px] sm:text-xs text-zinc-400">
                  <li><button onClick={() => scrollTo('home')} className="hover:text-white transition-colors cursor-pointer">About Us</button></li>
                  <li><button onClick={() => setShowRequestModal(true)} className="hover:text-white transition-colors cursor-pointer">Careers</button></li>
                  <li><button onClick={() => setShowRequestModal(true)} className="hover:text-white transition-colors cursor-pointer">Contact</button></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Legal */}
          <div className="pt-4 sm:pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-[10px] sm:text-[11px] text-zinc-500">
            <p>© {new Date().getFullYear()} ProSchool. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="hover:text-zinc-300 transition-colors cursor-pointer">Privacy Policy</span>
              <span className="text-zinc-700">·</span>
              <span className="hover:text-zinc-300 transition-colors cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* 14. INSTITUTIONAL REQUEST MODAL (CAMPUS DEPLOYMENT ONBOARDING)  */}
      {/* ============================================================== */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl lg:max-w-5xl w-full p-5 sm:p-7 md:p-8 shadow-2xl border border-zinc-200 relative max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <ProCollegeLogo size="sm" brandName="ProSchool" />
              </div>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setRequestSubmitted(false);
                }}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!requestSubmitted ? (
              <div className="mt-4 sm:mt-5">
                <div className="mb-4">
                  <h3 className="text-xl sm:text-2xl font-black text-[#101b46]">Request Campus Deployment</h3>
                  <p className="text-xs text-[#586680] mt-1 leading-relaxed">
                    Connect with our deployment team. Once verified, we will issue your university an official Organization Admin Login ID to register and manage your students and lecturers.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Campus Deployment Form */}
                  <div className="lg:col-span-7">
                    <form onSubmit={handleOrgRequestSubmit} className="space-y-3 sm:space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1">
                            College / University Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={orgForm.institutionName}
                            onChange={e => setOrgForm({ ...orgForm, institutionName: e.target.value })}
                            placeholder="College or University Name"
                            className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1">
                            Department / Faculty Unit
                          </label>
                          <input
                            type="text"
                            value={orgForm.department}
                            onChange={e => setOrgForm({ ...orgForm, department: e.target.value })}
                            placeholder="Department or Faculty Unit"
                            className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1">
                            Contact Person Name &amp; Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={orgForm.contactName}
                            onChange={e => setOrgForm({ ...orgForm, contactName: e.target.value })}
                            placeholder="Full Name &amp; Academic Role"
                            className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1">
                            Official Institutional Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={orgForm.email}
                            onChange={e => setOrgForm({ ...orgForm, email: e.target.value })}
                            placeholder="official.email@institution.edu"
                            className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1">
                            Contact Phone Number
                          </label>
                          <div className="flex items-center gap-2">
                            <select
                              value={phoneCountryCode}
                              onChange={e => setPhoneCountryCode(e.target.value)}
                              className="w-28 text-xs sm:text-sm border border-zinc-300 rounded-xl px-2.5 py-2.5 text-zinc-900 bg-zinc-50 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] shrink-0 font-medium cursor-pointer"
                            >
                              <option value="+977">+977 (NP)</option>
                              <option value="+1">+1 (US/CA)</option>
                              <option value="+44">+44 (UK)</option>
                              <option value="+91">+91 (IN)</option>
                              <option value="+61">+61 (AU)</option>
                              <option value="+49">+49 (DE)</option>
                              <option value="+33">+33 (FR)</option>
                              <option value="+81">+81 (JP)</option>
                              <option value="+86">+86 (CN)</option>
                              <option value="+971">+971 (UAE)</option>
                              <option value="+65">+65 (SG)</option>
                            </select>
                            <input
                              type="tel"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={10}
                              value={orgForm.phone}
                              onChange={e => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setOrgForm(prev => ({ ...prev, phone: digits }));
                              }}
                              placeholder="10-digit number"
                              className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                            />
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1">Numbers only, maximum 10 digits.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1">
                            Projected Student Count
                          </label>
                          <select
                            value={orgForm.studentCount}
                            onChange={e => setOrgForm({ ...orgForm, studentCount: Number(e.target.value) })}
                            className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] bg-white cursor-pointer"
                          >
                            <option value={500}>Up to 500 students</option>
                            <option value={1500}>500 - 2,500 students</option>
                            <option value={5000}>2,500 - 10,000 students</option>
                            <option value={20000}>10,000+ students (Enterprise)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          Target Deployment Plan
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
                          <label
                            onClick={() => setOrgForm({ ...orgForm, deploymentType: 'campus-pro' })}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              orgForm.deploymentType === 'campus-pro'
                                ? 'border-[#4F46E5] bg-indigo-50/50 text-[#4F46E5] font-bold'
                                : 'border-zinc-200 text-zinc-600'
                            }`}
                          >
                            <div>Campus Pro ($6 / mo)</div>
                            <p className="text-[10px] text-zinc-500 font-normal mt-0.5">
                              Standard college departments
                            </p>
                          </label>

                          <label
                            onClick={() => setOrgForm({ ...orgForm, deploymentType: 'enterprise' })}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              orgForm.deploymentType === 'enterprise'
                                ? 'border-[#4F46E5] bg-indigo-50/50 text-[#4F46E5] font-bold'
                                : 'border-zinc-200 text-zinc-600'
                            }`}
                          >
                            <div>Enterprise University</div>
                            <p className="text-[10px] text-zinc-500 font-normal mt-0.5">
                              Full institution + custom SIS
                            </p>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          Implementation Notes / Specific Requirements
                        </label>
                        <textarea
                          rows={2}
                          value={orgForm.notes}
                          onChange={e => setOrgForm({ ...orgForm, notes: e.target.value })}
                          placeholder="Specific requirements (e.g., student roster CSV sync, department structures)"
                          className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2 text-zinc-900 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] resize-none"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => launchDemoMode('student')}
                          className="text-xs text-[#4F46E5] hover:underline font-semibold order-2 sm:order-1 cursor-pointer"
                        >
                          Or explore Live Demo without account →
                        </button>

                        <button
                          type="submit"
                          disabled={isSubmittingRequest}
                          className="w-full sm:w-auto py-3 px-6 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#4338CA] hover:from-[#4338CA] hover:to-[#3730A3] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-2 disabled:opacity-50"
                        >
                          {isSubmittingRequest ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <span>Submit Institutional Request</span>
                              <span>→</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Right Column: Deployment Assistance Details */}
                  <div className="lg:col-span-5 bg-zinc-50 border border-zinc-200/90 rounded-2xl p-5 sm:p-6 space-y-4">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-[#4F46E5] bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                        Deployment Operations
                      </span>
                      <h4 className="font-extrabold text-sm sm:text-base text-zinc-900 mt-2">
                        Direct Campus Support &amp; Verification
                      </h4>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Our regional institutional team verifies every college account before provisioning production tenants.
                      </p>
                    </div>

                    <div className="space-y-3 text-xs text-zinc-700">
                      <div className="p-3 bg-white rounded-xl border border-zinc-200 space-y-1">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase block">Deployment Team</span>
                        <p className="font-bold text-zinc-900 text-xs sm:text-sm">ProSchool Academic Deployment</p>
                        <p className="text-[11px] text-zinc-500">Kathmandu, Nepal • Regional Cloud Center</p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-zinc-200 space-y-1">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase block">Direct Email Support</span>
                        <a href="mailto:deploy@proschool.edu.np" className="font-bold text-[#4F46E5] hover:underline block text-xs sm:text-sm">
                          deploy@proschool.edu.np
                        </a>
                        <p className="text-[11px] text-zinc-400">Response turnaround: within 4 business hours</p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-zinc-200 space-y-1">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase block">Helpline &amp; WhatsApp</span>
                        <p className="font-bold text-zinc-900 text-xs sm:text-sm">+977 (01) 597-0044</p>
                        <p className="text-[11px] text-zinc-400">Sun – Fri, 9:00 AM – 6:00 PM NPT</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 sm:py-12 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-zinc-900">
                  Institutional Request Submitted!
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong className="text-zinc-900">{orgForm.contactName}</strong>. Our regional onboarding engineers will verify <strong className="text-zinc-900">{orgForm.institutionName}</strong> and contact you at <strong className="text-zinc-900">{orgForm.email}</strong> with your administrator credentials.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setShowRequestModal(false);
                      setRequestSubmitted(false);
                    }}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    Close Window
                  </button>
                  <button
                    onClick={() => launchDemoMode('student')}
                    className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    Explore Live Platform Demo →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 15. INSTITUTIONAL SIGN-IN MODAL (ALL 5 SECURE AUTH STEPS)       */}
      {/* ============================================================== */}
      {showSignInModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 relative max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-100">
              <ProCollegeLogo size="sm" brandName="ProSchool" />
              <button
                onClick={resetAuthModal}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Institutional Credentials */}
            {authStep === 'credentials' && (
              <>
                <div className="mt-5">
                  <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Institutional Sign-In</h3>
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                    Enter your registered institutional credentials to access your academic workspace.
                  </p>
                </div>

                <form onSubmit={handleInstitutionalLogin} className="mt-5 space-y-4">
                  {loginError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                      {loginError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Institutional Email
                    </label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="name@institution.edu"
                      className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-zinc-700">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginError('');
                          setResendMessage('');
                          setResetEmail(loginEmail);
                          setAuthStep('forgot-password-request');
                        }}
                        className="text-xs text-[#4F46E5] hover:text-[#4338CA] hover:underline font-semibold cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#5B4FF5] to-[#4338CA] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSignInModal(false);
                        setShowRequestModal(true);
                      }}
                      className="text-xs text-[#4F46E5] hover:underline font-semibold cursor-pointer"
                    >
                      Need an account for your university? Request Campus Deployment →
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 1.5: Multi-Campus Account Selection */}
            {authStep === 'select-college' && (
              <>
                <div className="mt-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center mb-3">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Select Campus Portal</h3>
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                    Your email <strong className="text-zinc-800">{loginEmail}</strong> is registered across multiple institutional accounts. Choose where you want to sign in:
                  </p>
                </div>

                <div className="mt-5 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {collegeOptions.map(col => (
                    <button
                      key={col.id}
                      type="button"
                      disabled={isLoggingIn}
                      onClick={() => performLogin(loginEmail, loginPassword, col.id)}
                      className="w-full text-left p-3.5 rounded-xl border border-zinc-200 hover:border-[#4F46E5] bg-zinc-50/70 hover:bg-white flex items-center justify-between transition-all cursor-pointer group shadow-2xs hover:shadow-xs disabled:opacity-50"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-zinc-900 group-hover:text-[#4F46E5] truncate">
                            {col.name}
                          </h4>
                          {col.code && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-200/80 text-zinc-700 uppercase">
                              {col.code}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5 font-medium capitalize">
                          Account Access: <span className="text-zinc-700 font-semibold">{col.role}</span>
                        </p>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 group-hover:bg-indigo-50 text-zinc-400 group-hover:text-[#4F46E5] flex items-center justify-center shrink-0 transition-colors">
                        {isLoggingIn ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthStep('credentials');
                      setLoginError('');
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-800 font-semibold cursor-pointer"
                  >
                    ← Back to Credentials
                  </button>
                </div>
              </>
            )}

            {/* Step 2: 6-Digit Email 2FA OTP Verification */}
            {authStep === 'otp' && (
              <>
                <div className="mt-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Two-Factor Security Verification</h3>
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                    A 6-digit security code was dispatched directly to <span className="font-semibold text-zinc-900">{otpEmail}</span>. Please check your inbox and spam folder.
                  </p>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-900 flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-indigo-950">Check Your Registered Mailbox</p>
                    <p className="text-indigo-800/80 leading-relaxed">
                      Enter the 6-digit code received via email to verify your identity and access your dashboard.
                    </p>
                  </div>
                </div>

                {resendMessage && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{resendMessage}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
                  {loginError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                      {loginError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5 text-center">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center font-mono text-2xl tracking-[0.35em] font-bold border border-zinc-300 rounded-xl px-4 py-3 text-zinc-900 placeholder-zinc-300 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
                    <span>Didn't get the code?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isResending}
                      className="font-semibold text-[#4F46E5] hover:underline disabled:text-zinc-400 disabled:no-underline cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : isResending ? 'Sending...' : 'Resend Code'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpCode.trim().length !== 6}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#5B4FF5] to-[#4338CA] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Security Code...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify &amp; Continue</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep('credentials');
                        setLoginError('');
                        setResendMessage('');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 font-semibold cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Email &amp; Password</span>
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 3: First-time Password Change */}
            {authStep === 'change-password' && (
              <>
                <div className="mt-5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Set Permanent Password</h3>
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                    You are signing in with a temporary roster password. Please create a secure permanent password to protect your student records.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
                  {loginError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                      {loginError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword || !newPassword || !confirmPassword}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save &amp; Enter Workspace</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep('credentials');
                        setLoginError('');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 font-semibold cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 4: Forgot Password - Request 6-Digit OTP */}
            {authStep === 'forgot-password-request' && (
              <>
                <div className="mt-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center mb-3">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Reset Your Password</h3>
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                    Enter your registered institutional email address. We'll dispatch a secure 6-digit verification code directly to your email inbox.
                  </p>
                </div>

                <form onSubmit={handleRequestPasswordResetOtp} className="mt-5 space-y-4">
                  {loginError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                      {loginError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Institutional Email Address
                    </label>
                    <input
                      type="email"
                      required
                      autoFocus
                      autoComplete="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="e.g. yourname@institution.edu"
                      className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isRequestingResetOtp || !resetEmail.trim()}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#5B4FF5] to-[#4338CA] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
                  >
                    {isRequestingResetOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Security Code...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Send Verification Code</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep('credentials');
                        setLoginError('');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 font-semibold cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 5: Forgot Password - Verify OTP & Set New Password */}
            {authStep === 'forgot-password-verify' && (
              <>
                <div className="mt-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Verify Code &amp; Set New Password</h3>
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                    Enter the 6-digit verification code sent to <span className="font-semibold text-zinc-900">{resetEmail}</span> along with your new password.
                  </p>
                </div>

                {resendMessage && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{resendMessage}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyPasswordReset} className="mt-5 space-y-4">
                  {loginError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                      {loginError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5 text-center">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      value={resetOtpCode}
                      onChange={e => setResetOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center font-mono text-2xl tracking-[0.35em] font-bold border border-zinc-300 rounded-xl px-4 py-2.5 text-zinc-900 placeholder-zinc-300 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
                    <span>Didn't receive the code?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isResending}
                      className="font-semibold text-[#4F46E5] hover:underline disabled:text-zinc-400 disabled:no-underline cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : isResending ? 'Sending...' : 'Resend Code'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={resetNewPass}
                      onChange={e => setResetNewPass(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={resetConfirmPass}
                      onChange={e => setResetConfirmPass(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingReset || resetOtpCode.length !== 6 || !resetNewPass || !resetConfirmPass}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
                  >
                    {isVerifyingReset ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Resetting Password...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset Password &amp; Enter Portal</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep('credentials');
                        setLoginError('');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 font-semibold cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
