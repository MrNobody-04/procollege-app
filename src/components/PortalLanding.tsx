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
  ChevronDown,
  ChevronUp,
  ChevronRight,
  GraduationCap,
  Megaphone,
  ClipboardList,
  Bookmark,
  HelpCircle,
  Landmark,
  Smartphone,
  Headphones
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp, type ActiveTab } from '../context/AppContext';
import { ProCollegeLogo } from './ProCollegeLogo';
import { CampusEcosystemGraphic } from './CampusEcosystemGraphic';
import { PlatformCapabilitiesCarousel } from './PlatformCapabilitiesCarousel';
import { INITIAL_USERS } from '../data/initialData';
import type { User, UserRole } from '../types';
import {
  getOrCreateDeviceHash,
  getStoredDeviceToken,
  saveDeviceToken,
  getDeviceDisplayName
} from '../utils/deviceFingerprint';
import { initHeroAnimations } from '../utils/heroAnimations';
import { ProCollegeAIAssistant } from './ProCollegeAIAssistant';

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

  // Dynamic Live System Date & Auto-Update Daily
  const [liveDate, setLiveDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLiveDate(prev => {
        if (
          now.getDate() !== prev.getDate() ||
          now.getMonth() !== prev.getMonth() ||
          now.getFullYear() !== prev.getFullYear() ||
          now.getHours() !== prev.getHours()
        ) {
          return now;
        }
        return prev;
      });
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Compute exact coordinates of current day on the 3D isometric workspace calendar plate
  const liveDayCoords = useMemo(() => {
    const d = Math.max(1, Math.min(31, liveDate.getDate()));
    const row = Math.floor((d - 1) / 7);
    const col = (d - 1) % 7;
    const x = 1115 - 12.5 * row + 52 * col + (row > 0 ? 3.2 * col : 0);
    const y = 755 + 70.0 * row + 15 * col + (2.2 * col * row);
    return {
      left: Number((x / 1752 * 100).toFixed(2)),
      top: Number((y / 1716 * 100).toFixed(2))
    };
  }, [liveDate]);

  const [showSignInModal, setShowSignInModal] = useState<boolean>(false);
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [requestSubmitted, setRequestSubmitted] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState<boolean>(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

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
    const eduLevel = data.college?.educationLevel || data.college?.education_level || data.user?.educationLevel || data.user?.education_level || 'bachelor';
    const collegeObj = data.college ? { ...data.college, educationLevel: eduLevel, education_level: eduLevel } : { name: instName, educationLevel: eduLevel, education_level: eduLevel };

    localStorage.setItem('procollege_token', data.token);
    localStorage.setItem('procollege_user', JSON.stringify(data.user));
    localStorage.setItem('procollege_college', JSON.stringify(collegeObj));

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
      educationLevel: eduLevel,
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
      {/* 2. HERO SECTION - 3D CAMPUS ECOSYSTEM ANIMATION (IMAGE 2 CLONE)*/}
      {/* ============================================================== */}
      <section className="hero relative bg-gradient-to-b from-[#FAF8FF] via-white to-white pt-8 sm:pt-14 pb-14 sm:pb-20 overflow-hidden" id="home">
        {/* Subtle Parallax Background Glows */}
        <div className="hero-bg hero-bg-one -top-24 -left-24 w-96 h-96 rounded-full bg-purple-100/50 blur-3xl" />
        <div className="hero-bg hero-bg-two top-1/2 right-0 w-[450px] h-[450px] rounded-full bg-indigo-100/40 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Real Native Web Typography & Real Glass Turntable Pedestal */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Native 3D Gradient Typography & Elegant Vector Chrome Ribbon Underline */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-1 select-none"
              >
                <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-black tracking-tight leading-[1.08]">
                  <span
                    className="block bg-gradient-to-b from-[#2E1065] via-[#581C87] to-[#7E22CE] bg-clip-text text-transparent"
                    style={{
                      textShadow: '0 1px 0 #6b21a8, 0 2px 0 #581c87, 0 3px 0 #3b0764, 0 4px 8px rgba(46,16,101,0.3)'
                    }}
                  >
                    Designed for
                  </span>
                  <span
                    className="block bg-gradient-to-b from-[#1E3A8A] via-[#2563EB] to-[#38BDF8] bg-clip-text text-transparent"
                    style={{
                      textShadow: '0 1px 0 #2563eb, 0 2px 0 #1d4ed8, 0 3px 0 #1e40af, 0 4px 10px rgba(30,58,138,0.35)'
                    }}
                  >
                    Modern Education
                  </span>
                </h1>

                {/* Elegant Undulating Liquid Chrome Ribbon Underline (Pure Sharp Vector SVG) */}
                <div className="w-full max-w-[430px] pt-1">
                  <svg
                    viewBox="0 0 450 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-auto filter drop-shadow-[0_4px_8px_rgba(79,70,229,0.22)]"
                  >
                    <defs>
                      <linearGradient id="chromeRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.4" />
                        <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.95" />
                        <stop offset="50%" stopColor="#818CF8" stopOpacity="0.85" />
                        <stop offset="75%" stopColor="#38BDF8" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.3" />
                      </linearGradient>
                      <linearGradient id="chromeShine" x1="0%" y1="50%" x2="100%" y2="50%">
                        <stop offset="0%" stopColor="#94A3B8" />
                        <stop offset="30%" stopColor="#FFFFFF" />
                        <stop offset="60%" stopColor="#818CF8" />
                        <stop offset="100%" stopColor="#CBD5E1" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 5,20 C 80,22 130,4 210,11 C 290,18 330,32 445,14 C 380,36 290,24 210,16 C 130,8 70,28 5,20 Z"
                      fill="url(#chromeRibbon)"
                    />
                    <path
                      d="M 15,20 C 85,21 135,5 210,12 C 285,19 330,31 440,15"
                      stroke="url(#chromeShine)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </motion.div>

              {/* Subheading Exactly Matched to Image 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-1.5 pt-0.5"
              >
                <p className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                  A Nexus for the Future.
                </p>
                <p className="text-sm sm:text-base text-zinc-600 max-w-xl leading-relaxed">
                  ProSchool is your all-in-one platform to manage, teach, and grow, seamlessly connecting students, faculty, and curriculum.
                </p>
              </motion.div>

              {/* Action Button: Brushed Silver Metallic 3D Glass Pill (Start Free Trial Removed per request) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="pt-1"
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => launchDemoMode('student')}
                  className="hero-button px-8 py-3.5 sm:py-4 bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#D5DEE9] hover:from-[#FFFFFF] hover:to-[#CAD5E2] text-zinc-800 border-[1.5px] border-white/95 rounded-2xl text-base font-extrabold shadow-[0_8px_22px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.06),inset_0_1.5px_2px_rgba(255,255,255,1),inset_0_-1.5px_2px_rgba(148,163,184,0.35)] flex items-center justify-center gap-3 cursor-pointer transition-all"
                >
                  <Play className="w-5 h-5 text-[#2563EB] fill-[#2563EB] shrink-0" />
                  <span>Watch Demo</span>
                </motion.button>
              </motion.div>

              {/* Real Native 3D Glass Turntable Pedestal (100% Matched to Elliptical 3D Disc) */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="pt-4 select-none perspective-[800px]"
              >
                <div className="relative w-full max-w-[430px] h-[135px] rounded-[100%] bg-gradient-to-b from-white/95 via-white/50 to-indigo-100/35 backdrop-blur-2xl border-[2.5px] border-white/95 shadow-[0_20px_45px_rgba(79,70,229,0.16),0_4px_12px_rgba(0,0,0,0.08),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-2px_6px_rgba(99,102,241,0.15)] ring-1 ring-slate-300/40 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-[0_24px_50px_rgba(79,70,229,0.22)]">
                  {/* Floating Avatars & Glowing Center Orb Row along Elliptical Arc */}
                  <div className="flex items-center justify-center gap-2.5 sm:gap-3 -mt-3 mb-1">
                    {/* Avatar 1 */}
                    <motion.div
                      whileHover={{ scale: 1.25, y: -6 }}
                      className="group relative w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-white/95 shadow-md overflow-hidden cursor-pointer transform -translate-y-1"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80"
                        alt="Sneha KC - Student Council"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950 text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-lg pointer-events-none z-30">
                        Sneha • Council
                      </div>
                    </motion.div>

                    {/* Avatar 2 */}
                    <motion.div
                      whileHover={{ scale: 1.25, y: -6 }}
                      className="group relative w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-white/95 shadow-md overflow-hidden cursor-pointer transform translate-y-1"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80"
                        alt="Dr. Ram Bista - Principal"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950 text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-lg pointer-events-none z-30">
                        Dr. Ram • Principal
                      </div>
                    </motion.div>

                    {/* Central 3D Glowing Violet ProSchool Orb */}
                    <motion.div
                      whileHover={{ scale: 1.18, rotate: 10 }}
                      className="relative mx-1.5 cursor-pointer"
                    >
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-[#2A1660] via-[#4F2FA5] to-[#7C3AED] flex items-center justify-center text-white shadow-[0_0_24px_rgba(124,58,237,0.6),inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-3px_6px_rgba(0,0,0,0.5)] transform -translate-y-2 ring-2 ring-purple-300/50">
                        <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white filter drop-shadow-sm" />
                      </div>
                      <div className="absolute inset-0 rounded-full bg-purple-500/40 blur-md -z-10 animate-pulse" />
                    </motion.div>

                    {/* Avatar 3 */}
                    <motion.div
                      whileHover={{ scale: 1.25, y: -6 }}
                      className="group relative w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-white/95 shadow-md overflow-hidden cursor-pointer transform translate-y-1"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80"
                        alt="Pooja Sharma - HOD"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950 text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-lg pointer-events-none z-30">
                        Pooja • HOD Computing
                      </div>
                    </motion.div>

                    {/* Avatar 4 */}
                    <motion.div
                      whileHover={{ scale: 1.25, y: -6 }}
                      className="group relative w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-white/95 shadow-md overflow-hidden cursor-pointer transform -translate-y-1"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80"
                        alt="Aarav Shrestha - Dean"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950 text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-lg pointer-events-none z-30">
                        Aarav • Faculty Lead
                      </div>
                    </motion.div>
                  </div>

                  {/* Real Crisp Vector Text on Disc Face */}
                  <div className="text-center space-y-0.5 mt-1">
                    <p className="font-extrabold text-zinc-900 text-xs sm:text-[13px] tracking-tight">
                      Trusted by 500+ Schools &amp; Colleges
                    </p>
                    <p className="text-[11px] text-zinc-500 font-medium">
                      across Nepal &amp; South Asia
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column: 3D Campus Ecosystem Infrastructure Animation */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              <div
                className="hero-dashboard-shell relative w-full"
                data-reveal="right"
                style={{ '--reveal-delay': '200ms' } as React.CSSProperties}
              >
                <CampusEcosystemGraphic />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. CORE PLATFORM CAPABILITIES (Continuous Sliding Animation)   */}
      {/* ============================================================== */}
      <section className="py-14 sm:py-20 bg-white overflow-hidden" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">
            Core Platform <span className="text-[#4F46E5]">Capabilities</span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 max-w-xl mx-auto leading-relaxed">
            Everything educators, faculty, and students need, powered by continuous live synchronization.
          </p>
        </div>

        {/* Continuous Right-to-Left Infinite Sliding Track */}
        <PlatformCapabilitiesCarousel onLaunchDemo={launchDemoMode} />
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
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white via-indigo-50/20 to-white" id="solutions">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span
              data-reveal
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-300/80 text-slate-800 shadow-xs mb-3"
            >
              <Bookmark className="w-3.5 h-3.5 text-slate-700" />
              <span>Solutions for Every Need</span>
            </span>
            <h2
              data-reveal
              style={{ '--reveal-delay': '150ms' } as React.CSSProperties}
              className="text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-900 tracking-tight"
            >
              Empowering{' '}
              <span className="bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#7C3AED] bg-clip-text text-transparent">
                Education,
              </span>{' '}
              Together
            </h2>
            <p
              data-reveal
              style={{ '--reveal-delay': '250ms' } as React.CSSProperties}
              className="text-sm sm:text-base text-slate-500 mt-2 font-normal max-w-xl mx-auto"
            >
              Whether you are an administrator, teacher, or student, ProSchool is designed for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
            {/* Persona 1: Administrators (Genuine 3D Campus Illustration) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 sm:p-7 bg-white/95 backdrop-blur-xl rounded-3xl border border-sky-200/90 shadow-[0_10px_35px_rgba(56,189,248,0.08)] flex flex-col justify-between hover:shadow-[0_20px_45px_rgba(56,189,248,0.18)] hover:-translate-y-1 transition-all duration-300 group"
            >
              <div>
                {/* 3D Isometric Floating Illustration */}
                <div className="h-48 sm:h-52 w-full flex items-center justify-center p-2 mb-4 rounded-2xl overflow-hidden bg-gradient-to-b from-sky-50/60 via-blue-50/25 to-transparent">
                  <motion.img
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                    whileHover={{ scale: 1.05 }}
                    src="/role-admin-ultra-hd.png"
                    alt="For Administrators"
                    className="h-full w-auto max-h-[210px] object-contain filter drop-shadow-[0_14px_28px_rgba(56,189,248,0.22)] select-none"
                  />
                </div>

                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">For Administrators</h3>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal mb-5">
                  Manage your institution efficiently with role-based access control, departmental cohort allocation, and automated semester rollovers.
                </p>

                <ul className="text-xs sm:text-[13px] text-slate-700 space-y-2.5 pt-1">
                  <li className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>Multi-faculty department management</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>Granular RBAC access controls</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>Institutional audit trails</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => launchDemoMode('admin')}
                  className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer group-hover:translate-x-0.5 transition-all"
                >
                  <span>Launch Admin Preview</span>
                  <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            </motion.div>

            {/* Persona 2: Teachers (3D Smart Classroom Stage) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 sm:p-7 bg-white/95 backdrop-blur-xl rounded-3xl border border-purple-200/90 shadow-[0_10px_35px_rgba(168,85,247,0.08)] flex flex-col justify-between hover:shadow-[0_20px_45px_rgba(168,85,247,0.18)] hover:-translate-y-1 transition-all duration-300 group"
            >
              <div>
                {/* 3D Isometric Floating Illustration */}
                <div className="h-48 sm:h-52 w-full flex items-center justify-center p-2 mb-4 rounded-2xl overflow-hidden bg-gradient-to-b from-purple-50/60 via-pink-50/25 to-transparent">
                  <motion.img
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 4.8, delay: 0.5, ease: "easeInOut" }}
                    whileHover={{ scale: 1.05 }}
                    src="/role-teacher-ultra-hd.png"
                    alt="For Teachers"
                    className="h-full w-auto max-h-[210px] object-contain filter drop-shadow-[0_14px_28px_rgba(168,85,247,0.22)] select-none"
                  />
                </div>

                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">For Teachers</h3>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal mb-5">
                  Create engaging classes, track progress, distribute coursework, and grade with SpeedGrader and criterion rubrics in seconds.
                </p>

                <ul className="text-xs sm:text-[13px] text-slate-700 space-y-2.5 pt-1">
                  <li className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>Interactive lecture channels</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>SpeedGrader™ grading workflow</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>Direct student &amp; group messaging</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => launchDemoMode('professor')}
                  className="text-xs sm:text-sm font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 cursor-pointer group-hover:translate-x-0.5 transition-all"
                >
                  <span>Launch Teacher Preview</span>
                  <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            </motion.div>

            {/* Persona 3: Students (3D Collaboration & Calendar Stage) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 sm:p-7 bg-white/95 backdrop-blur-xl rounded-3xl border border-indigo-200/90 shadow-[0_10px_35px_rgba(99,102,241,0.08)] flex flex-col justify-between hover:shadow-[0_20px_45px_rgba(99,102,241,0.18)] hover:-translate-y-1 transition-all duration-300 group"
            >
              <div>
                {/* 3D Isometric Floating Illustration */}
                <div className="h-48 sm:h-52 w-full flex items-center justify-center p-2 mb-4 rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-50/60 via-blue-50/25 to-transparent">
                  <motion.img
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 5.1, delay: 1, ease: "easeInOut" }}
                    whileHover={{ scale: 1.05 }}
                    src="/role-student-ultra-hd.png"
                    alt="For Students"
                    className="h-full w-auto max-h-[210px] object-contain filter drop-shadow-[0_14px_28px_rgba(99,102,241,0.22)] select-none"
                  />
                </div>

                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">For Students</h3>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal mb-5">
                  Access course resources, submit homework, collaborate on team assignments, and stay synchronized with deadline calendars.
                </p>

                <ul className="text-xs sm:text-[13px] text-slate-700 space-y-2.5 pt-1">
                  <li className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>Unified class noticeboards</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>Instant file preview &amp; uploads</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>Timetable &amp; submission alerts.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => launchDemoMode('student')}
                  className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer group-hover:translate-x-0.5 transition-all"
                >
                  <span>Launch Student Preview</span>
                  <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. EVERYTHING YOU NEED IN ONE PLACE (Matches Image 2 & Motion) */}
      {/* ============================================================== */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white via-[#FAF5FF]/30 to-white border-t border-zinc-100 overflow-hidden relative">
        {/* Continuous ambient blur light on top-right */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.35, 0.65, 0.35]
          }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-purple-200/30 via-indigo-100/20 to-transparent rounded-full blur-3xl pointer-events-none -z-0"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">

            {/* Left Column Content & 4 Connected Badges */}
            <motion.div
              initial={{ opacity: 0, x: -25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 space-y-6 text-left"
            >
              {/* Heading: Exact match with Image 2 */}
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-slate-900 tracking-tight leading-[1.12]">
                Everything You <br className="hidden sm:inline" />
                Need in{' '}
                <span className="bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#7C3AED] bg-clip-text text-transparent">
                  One Place
                </span>
              </h2>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-md">
                From virtual classrooms to student management, ProSchool helps you work smarter, not harder.
              </p>

              {/* 4 Connected Glassmorphism Badges (2x2 Grid) with Organic Fluid Backdrop */}
              <div className="relative pt-2">
                {/* Organic Fluid Glow Connector linking badges to the CTA button with continuous breathing */}
                <motion.div
                  animate={{
                    scale: [0.98, 1.05, 0.98],
                    opacity: [0.4, 0.7, 0.4]
                  }}
                  transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  className="absolute -inset-2 -z-10 rounded-3xl bg-gradient-to-br from-indigo-100/50 via-purple-50/60 to-blue-50/40 blur-xl pointer-events-none"
                />

                {/* Playful Curved Pointer Arrow pointing up & right towards the 3D workspace with continuous pointing pulse */}
                <motion.div
                  animate={{
                    x: [0, 5, 0],
                    y: [0, -5, 0],
                    rotate: [0, 2, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                  className="absolute -top-10 right-2 hidden sm:block pointer-events-none select-none z-20"
                >
                  <svg width="60" height="50" viewBox="0 0 60 50" fill="none" className="text-purple-500/85 filter drop-shadow-[0_2px_6px_rgba(124,58,237,0.2)]">
                    <path
                      d="M 10 44 C 18 20, 32 10, 50 14"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M 43 7 L 51 14 L 41 21"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </motion.div>

                {/* 2x2 Grid of Badges with continuous subtle organic floating wave */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Badge 1: Top-Left (Deep Indigo Gradient with continuous pulse & shimmer) */}
                  <motion.div
                    animate={{
                      y: [0, -4, 0],
                      boxShadow: [
                        "0 8px 20px rgba(30,27,75,0.25)",
                        "0 12px 28px rgba(79,70,229,0.38)",
                        "0 8px 20px rgba(30,27,75,0.25)"
                      ]
                    }}
                    transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
                    whileHover={{ scale: 1.04, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-full bg-gradient-to-r from-[#171c4c] via-[#201c64] to-[#2e267d] text-white border border-indigo-500/20 cursor-pointer group transition-all"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
                      className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 text-white shadow-inner group-hover:scale-105 transition-transform"
                    >
                      <Video className="w-4 h-4 stroke-[2.2]" />
                    </motion.div>
                    <div className="text-left leading-tight">
                      <span className="block text-xs sm:text-[13px] font-semibold text-white tracking-tight">Conduct live &amp;</span>
                      <span className="block text-xs sm:text-[13px] font-semibold text-white/90 tracking-tight">recorded classes</span>
                    </div>
                  </motion.div>

                  {/* Badge 2: Top-Right (Frosted Glass with Megaphone & continuous gentle bobbing) */}
                  <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 4.8, delay: 0.5, ease: "easeInOut" }}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-full bg-white/80 backdrop-blur-xl border border-white text-slate-800 shadow-[0_8px_25px_rgba(0,0,0,0.04)] cursor-pointer group hover:bg-white transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-100/90 text-[#7C3AED] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Megaphone className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="text-left leading-tight">
                      <span className="block text-xs sm:text-[13px] font-semibold text-slate-800 tracking-tight">Share resources &amp;</span>
                      <span className="block text-xs sm:text-[13px] font-semibold text-slate-700 tracking-tight">announcements</span>
                    </div>
                  </motion.div>

                  {/* Badge 3: Bottom-Left (Frosted Glass with Clipboard & continuous gentle bobbing) */}
                  <motion.div
                    animate={{ y: [0, -3.5, 0] }}
                    transition={{ repeat: Infinity, duration: 5.2, delay: 1, ease: "easeInOut" }}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-full bg-white/80 backdrop-blur-xl border border-white text-slate-800 shadow-[0_8px_25px_rgba(0,0,0,0.04)] cursor-pointer group hover:bg-white transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-100/90 text-[#2563EB] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <ClipboardList className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="text-left leading-tight">
                      <span className="block text-xs sm:text-[13px] font-semibold text-slate-800 tracking-tight">Manage assignments</span>
                      <span className="block text-xs sm:text-[13px] font-semibold text-slate-700 tracking-tight">&amp; deadlines</span>
                    </div>
                  </motion.div>

                  {/* Badge 4: Bottom-Right (Frosted Glass with Chat & continuous gentle bobbing) */}
                  <motion.div
                    animate={{ y: [0, 3.5, 0] }}
                    transition={{ repeat: Infinity, duration: 4.6, delay: 1.5, ease: "easeInOut" }}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-full bg-white/80 backdrop-blur-xl border border-white text-slate-800 shadow-[0_8px_25px_rgba(0,0,0,0.04)] cursor-pointer group hover:bg-white transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-sky-100/90 text-[#0284C7] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <MessageSquare className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="text-left leading-tight">
                      <span className="block text-xs sm:text-[13px] font-semibold text-slate-800 tracking-tight">Communicate with</span>
                      <span className="block text-xs sm:text-[13px] font-semibold text-slate-700 tracking-tight">students &amp; parents</span>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Glowing CTA Button with continuous subtle pulsing glow */}
              <div className="pt-2">
                <motion.button
                  animate={{
                    boxShadow: [
                      "0 10px 25px rgba(99,102,241,0.35)",
                      "0 16px 36px rgba(124,58,237,0.55)",
                      "0 10px 25px rgba(99,102,241,0.35)"
                    ]
                  }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowRequestModal(true)}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#7C3AED] hover:from-[#2563EB] hover:to-[#6D28D9] text-white text-xs sm:text-sm font-bold cursor-pointer transition-transform duration-300 group"
                >
                  <span>Explore All Features</span>
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="text-base leading-none inline-block"
                  >
                    →
                  </motion.span>
                </motion.button>
              </div>
            </motion.div>

            {/* Right Column: 3D Isometric Glassmorphism Workspace Showcase */}
            <motion.div
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 relative flex items-center justify-center"
            >
              {/* Atmospheric Background Nebula Glow with continuous breathing */}
              <motion.div
                animate={{
                  scale: [0.94, 1.12, 0.94],
                  opacity: [0.45, 0.85, 0.45]
                }}
                transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
                className="absolute -inset-6 bg-gradient-to-br from-indigo-500/22 via-purple-500/18 to-transparent blur-3xl rounded-full pointer-events-none"
              />

              {/* Floating Animated Stars / Sparkles with continuous twinkle & drift */}
              <motion.div
                animate={{
                  scale: [0.8, 1.4, 0.8],
                  opacity: [0.35, 1, 0.35],
                  rotate: [0, 90, 180],
                  y: [0, -6, 0]
                }}
                transition={{ repeat: Infinity, duration: 3.6, ease: "easeInOut" }}
                className="absolute top-2 right-8 text-purple-400 text-lg pointer-events-none select-none z-20"
              >
                ✦
              </motion.div>
              <motion.div
                animate={{
                  scale: [0.9, 1.5, 0.9],
                  opacity: [0.3, 0.95, 0.3],
                  rotate: [0, -120, -240],
                  y: [0, 6, 0]
                }}
                transition={{ repeat: Infinity, duration: 4.2, delay: 0.7, ease: "easeInOut" }}
                className="absolute bottom-6 right-16 text-indigo-400 text-base pointer-events-none select-none z-20"
              >
                ✦
              </motion.div>
              <motion.div
                animate={{
                  scale: [0.7, 1.3, 0.7],
                  opacity: [0.25, 0.9, 0.25],
                  rotate: [0, 180, 360],
                  x: [0, 4, 0]
                }}
                transition={{ repeat: Infinity, duration: 4.8, delay: 1.4, ease: "easeInOut" }}
                className="absolute top-1/2 right-3 text-purple-300 text-sm pointer-events-none select-none z-20"
              >
                ✦
              </motion.div>
              <motion.div
                animate={{
                  scale: [0.85, 1.35, 0.85],
                  opacity: [0.3, 0.85, 0.3],
                  rotate: [0, 45, 0],
                  y: [-4, 4, -4]
                }}
                transition={{ repeat: Infinity, duration: 3.2, delay: 0.3, ease: "easeInOut" }}
                className="absolute top-6 left-12 text-indigo-300 text-sm pointer-events-none select-none z-20"
              >
                ✦
              </motion.div>

              {/* Main 3D Floating Isometric Canvas with continuous gentle floating & tilt */}
              <motion.div
                animate={{
                  y: [-7, 7, -7],
                  rotateZ: [-0.6, 0.6, -0.6]
                }}
                transition={{ repeat: Infinity, duration: 5.8, ease: "easeInOut" }}
                whileHover={{ scale: 1.03 }}
                className="relative w-full max-w-[620px] transition-transform duration-500 cursor-pointer group"
                onClick={() => launchDemoMode('professor')}
                title="Click to launch interactive teacher demo"
              >
                <img
                  src="/workspace-3d-ultra-hd.png"
                  alt="ProSchool 3D Glassmorphism Workspace"
                  className="w-full h-auto object-contain drop-shadow-[0_25px_50px_rgba(79,70,229,0.22)] select-none"
                />

                {/* Dynamic Live Calendar Date Highlight Lens (Auto-updated daily without altering design/animation) */}
                <motion.div
                  style={{
                    left: `${liveDayCoords.left}%`,
                    top: `${liveDayCoords.top}%`,
                    transform: 'translate(-50%, -50%) rotate(16deg) skewX(-10deg)'
                  }}
                  animate={{
                    scale: [0.96, 1.05, 0.96],
                    boxShadow: [
                      '0 0 10px rgba(124,58,237,0.7), inset 0 1px 2px rgba(255,255,255,0.85)',
                      '0 0 20px rgba(147,51,234,0.95), inset 0 1.5px 3px rgba(255,255,255,1)',
                      '0 0 10px rgba(124,58,237,0.7), inset 0 1px 2px rgba(255,255,255,0.85)'
                    ]
                  }}
                  transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                  className="absolute pointer-events-none z-20 w-[4.6%] aspect-[48/44] rounded-[10px] bg-gradient-to-tr from-[#3B0764] via-[#581C87] to-[#7C3AED] border-[2px] border-white text-white flex items-center justify-center font-black text-[9px] sm:text-[11px] select-none"
                >
                  <span>{liveDate.getDate()}</span>
                </motion.div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>


      {/* ============================================================== */}
      {/* 8. FREQUENTLY ASKED QUESTIONS & NEED HELP (Matches Image 2)   */}
      {/* ============================================================== */}
      <section className="py-12 sm:py-16 bg-white relative overflow-hidden" id="faq">
        {/* Decorative Dot Grids (Matched to Image 2) */}
        <div className="absolute top-12 left-6 w-16 h-16 bg-[radial-gradient(#9333ea_1.2px,transparent_1.2px)] [background-size:10px_10px] opacity-25 pointer-events-none hidden sm:block" />
        <div className="absolute bottom-12 right-6 w-20 h-20 bg-[radial-gradient(#9333ea_1.2px,transparent_1.2px)] [background-size:10px_10px] opacity-25 pointer-events-none hidden sm:block" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">
          {/* Section Header */}
          <div className="text-left space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE9FE] text-[#6D28D9] text-xs font-bold shadow-xs">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>FAQ</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">
              Frequently Asked <span className="text-[#4F46E5]">Questions</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-600">
              Find answers to common questions about ProSchool.
            </p>
            <div className="w-12 h-1.5 bg-[#4F46E5] rounded-full mt-2.5" />
          </div>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: 4 Interactive Accordion Cards with Icons */}
            <div className="lg:col-span-8 space-y-3.5">
              {[
                {
                  q: 'Is ProSchool free for educational institutions?',
                  a: 'Yes, we offer a free trial and affordable plans for schools and colleges.',
                  icon: <Landmark className="w-4 h-4" />,
                  iconBg: 'bg-[#EDE9FE]',
                  iconCol: 'text-[#6D28D9]'
                },
                {
                  q: 'Can I use ProSchool on mobile?',
                  a: 'Yes! ProSchool works seamlessly across all devices including iOS, Android, tablets, and desktop browsers.',
                  icon: <Smartphone className="w-4 h-4" />,
                  iconBg: 'bg-[#E0F2FE]',
                  iconCol: 'text-[#0284C7]'
                },
                {
                  q: 'Is my data secure?',
                  a: 'Absolutely. We use enterprise-grade encryption, secondary vault backups, and multi-tenant isolation to ensure your institution\'s data remains private and secure.',
                  icon: <ShieldCheck className="w-4 h-4" />,
                  iconBg: 'bg-[#DCFCE7]',
                  iconCol: 'text-[#16A34A]'
                },
                {
                  q: 'How do I get support?',
                  a: 'Our dedicated support team is available 24/7 via live chat, email, and direct WhatsApp / phone hotline for campus administrators.',
                  icon: <Headphones className="w-4 h-4" />,
                  iconBg: 'bg-[#FFEDD5]',
                  iconCol: 'text-[#EA580C]'
                }
              ].map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-zinc-100 rounded-2xl overflow-hidden transition-all duration-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(79,70,229,0.08)]"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full px-5 sm:px-6 py-4 sm:py-4.5 flex items-center justify-between text-left cursor-pointer transition-colors hover:bg-zinc-50/50"
                    >
                      <div className="flex items-center gap-3.5 pr-4">
                        <div className={`w-9 h-9 rounded-full ${faq.iconBg} ${faq.iconCol} flex items-center justify-center shrink-0 shadow-xs`}>
                          {faq.icon}
                        </div>
                        <span className="font-extrabold text-zinc-900 text-sm sm:text-base tracking-tight">
                          {faq.q}
                        </span>
                      </div>
                      <span className="shrink-0 text-zinc-500">
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-[#4F46E5] stroke-[2.5] transition-transform" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-zinc-400 stroke-[2.5] transition-transform" />
                        )}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-4 pt-1 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100/80 bg-zinc-50/40 pl-16">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Column: "Need Help?" Card (100% Matched to Image 2) */}
            <div className="lg:col-span-4">
              <div className="bg-[#FAF8FF]/90 border border-purple-100/70 rounded-[32px] p-7 sm:p-9 text-center space-y-4 shadow-[0_14px_40px_rgba(99,102,241,0.07)] flex flex-col items-center">
                <div className="w-56 max-w-full flex items-center justify-center">
                  <motion.img
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
                    whileHover={{ scale: 1.06 }}
                    src="/faq-support-robot-ultra-hd.png"
                    alt="Need Help Robot Support"
                    className="w-full h-auto object-contain filter drop-shadow-[0_12px_24px_rgba(79,70,229,0.18)] select-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                    Need Help?
                  </h3>
                  <p className="text-zinc-600 text-xs sm:text-sm max-w-[240px] mx-auto leading-relaxed font-medium">
                    Our support team is here to help you 24/7.
                  </p>
                </div>

                <button
                  onClick={() => setShowRequestModal(true)}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] active:scale-95 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-full shadow-[0_6px_20px_rgba(79,70,229,0.35)] hover:shadow-[0_10px_25px_rgba(79,70,229,0.45)] transition-all cursor-pointer"
                >
                  <Headphones className="w-4 h-4" />
                  <span>Contact Support →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 9. CONTINUOUS IN-MOTION OCEAN WAVES + PHONE-OPTIMIZED FOOTER   */}
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
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
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
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
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
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
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
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
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
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${orgForm.deploymentType === 'campus-pro'
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
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${orgForm.deploymentType === 'enterprise'
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
      {/* ProCollege AI Concierge Assistant (Echo) */}
      <ProCollegeAIAssistant />
    </div>
  );
};
