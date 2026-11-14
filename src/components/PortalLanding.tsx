import React, { useState, useEffect } from 'react';
import {
  Users,
  Video,
  FileCheck,
  FolderOpen,
  ArrowRight,
  LogIn,
  Check,
  X,
  Building2,
  Key,
  CheckCircle2,
  Menu,
  Mail,
  Phone,
  MessageSquare,
  Loader2,
  ShieldCheck,
  Lock,
  ArrowLeft,
  KeyRound,
  RotateCcw
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

  const [showSignInModal, setShowSignInModal] = useState<boolean>(false);
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [requestSubmitted, setRequestSubmitted] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Sign In & Password Reset Modal State
  const [authStep, setAuthStep] = useState<'credentials' | 'otp' | 'change-password' | 'forgot-password-request' | 'forgot-password-verify'>('credentials');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

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

  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const resetAuthModal = () => {
    setShowSignInModal(false);
    setAuthStep('credentials');
    setLoginError('');
    setOtpCode('');
    setOtpEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setResetEmail('');
    setResetOtpCode('');
    setResetNewPass('');
    setResetConfirmPass('');
    setPendingAuthResponse(null);
  };

  const finishLoginSession = (data: any) => {
    // Store credentials in localStorage with robust institution name preservation
    const instName = data.college?.name || data.user?.institution_name || data.user?.institutionName || 'Academic Institution';
    if (data.user) {
      data.user.institution_name = instName;
      data.user.institutionName = instName;
    }
    localStorage.setItem('procollege_token', data.token);
    localStorage.setItem('procollege_user', JSON.stringify(data.user));
    localStorage.setItem('procollege_college', JSON.stringify(data.college || { name: instName }));

    if (data.deviceToken) {
      saveDeviceToken(data.deviceToken);
    }

    // Strict 4-Tier Role Architecture Enforcement: developer | admin | lecturer | student
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
      name: data.user.full_name || data.user.name,
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
          ? 'ProCollege Platform Operations'
          : instName,
      avatar: data.user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      status: 'available',
    };

    setIsDemoMode(false);
    setCurrentUser(appUser);
    resetAuthModal();
    setShowRequestModal(false);
    setMobileMenuOpen(false);
    setViewMode('app');
  };

  const performLogin = async (emailToUse: string, passwordToUse: string) => {
    setIsLoggingIn(true);
    setLoginError('');
    setResendMessage('');

    try {
      const deviceHash = getOrCreateDeviceHash();
      const deviceToken = getStoredDeviceToken();
      const deviceName = getDeviceDisplayName();

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-hash': deviceHash,
          'x-device-token': deviceToken,
        },
        body: JSON.stringify({
          email: emailToUse,
          password: passwordToUse,
          deviceHash,
          deviceToken,
          deviceName,
        }),
      });

      const data = await res.json();

      // Check requireOtp FIRST: triggers 2FA flow for student/admin only if device is NOT recognized
      if (data.requireOtp) {
        setAuthStep('otp');
        setOtpEmail(data.email || emailToUse);
        setOtpCode(''); // Blank code input - user must enter from email
        setResendCooldown(60);
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      if (data.deviceToken) {
        saveDeviceToken(data.deviceToken);
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
    setResendMessage('');
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
      setLoginError('Please enter a valid 6-digit OTP code.');
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
      const message = err instanceof Error ? err.message : String(err);
      setLoginError(message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Secure OTP-Based Password Recovery (Forgot Password Flow)
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

      // Automatically log the user in immediately!
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

  const [isSubmittingRequest, setIsSubmittingRequest] = useState<boolean>(false);

  const launchDemoMode = (targetRoleOrUser: 'student' | 'professor' | 'admin' | typeof availableUsers[0] = 'student') => {
    // 1. NEVER SAVE DEMO CREDENTIALS: Purge any stored tokens, credentials, or sessions
    try {
      localStorage.removeItem('procollege_token');
      localStorage.removeItem('procollege_user');
      localStorage.removeItem('procollege_college');
      sessionStorage.clear();
    } catch {
      // ignore
    }

    // 2. Set demo mode to true (Strict Zero Database Writes Sandbox)
    setIsDemoMode(true);

    // 3. Resolve role and target persona with guaranteed fallback to canonical initial users
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
      targetTab = 'admin'; // Open directly into Campus Administration Center
    } else if (targetRoleOrUser === 'professor') {
      demoUser =
        allUsers.find(u => u.id === 'user_alan') ||
        allUsers.find(u => u.role === 'professor' || u.role === 'lecturer' || (u as unknown as { role: string }).role === 'teacher') ||
        INITIAL_USERS[0];
      targetTab = 'teams'; // Open into Professor teaching & grading workflow
    } else {
      // default: 'student'
      demoUser =
        allUsers.find(u => u.id === 'user_alex') ||
        allUsers.find(u => u.role === 'student') ||
        INITIAL_USERS[2];
      targetTab = 'teams'; // Open into Student classroom & assignments workflow
    }

    setCurrentUser(demoUser);
    setActiveTab(targetTab);

    // Ensure initial course and channel are selected
    if (courses && courses.length > 0) {
      const matchCourse = courses.find(c => c.institutionName === demoUser.institutionName) || courses[0];
      setSelectedCourse(matchCourse);
      if (matchCourse.channels && matchCourse.channels.length > 0) {
        setSelectedChannel(matchCourse.channels[0]);
      }
    }

    // 4. Close any open dialogs and navigate to the application workspace
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
      console.warn('Could not post inquiry to live Turso backend:', err);
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
  };

  return (
    <div className="min-h-screen w-full bg-[#080808] text-[#CDCBCA] font-dmsans selection:bg-[#D41514] selection:text-white antialiased overflow-x-hidden relative">
      {/* 1. Header Navigation Bar (header-surface: obsidian #080808 with chrome border) */}
      <header className="sticky top-0 z-40 bg-[#080808]/92 backdrop-blur-md border-b border-[#CDCBCA]/15 transition-all">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 xl:px-12 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand Logo & Name */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
          >
            <ProCollegeLogo size="sm" variant="crimson-text" className="sm:hidden" />
            <ProCollegeLogo size="md" variant="crimson-text" className="hidden sm:flex" />
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-9 text-[15px] lg:text-[16px] font-medium text-[#CDCBCA]">
            <button
              onClick={() => scrollTo('solutions')}
              className="hover:text-[#D41514] transition-colors cursor-pointer"
            >
              Solutions
            </button>
            <button
              onClick={() => scrollTo('features')}
              className="hover:text-[#D41514] transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollTo('perspectives')}
              className="hover:text-[#D41514] transition-colors cursor-pointer"
            >
              Perspectives
            </button>
            <button
              onClick={() => scrollTo('pricing')}
              className="hover:text-[#D41514] transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 shrink-0">
            <button
              onClick={() => {
                setShowSignInModal(true);
              }}
              className="text-xs sm:text-sm md:text-[15px] font-bold text-[#CDCBCA] hover:text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-[#CDCBCA]/20 hover:border-[#CDCBCA]/50 hover:bg-[#141416] active:scale-95 transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D41514] shrink-0" />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => scrollTo('pricing')}
              className="btn-hive-crimson bg-gradient-to-r from-[#D41514] via-[#ea201f] to-[#b80f0e] text-white text-xs sm:text-sm md:text-[15px] font-black px-3.5 xs:px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full border border-[#D41514]/50 shadow-[0_0_20px_rgba(212,21,20,0.45)] hover:shadow-[0_0_30px_rgba(212,21,20,0.65)] flex items-center gap-1.5 cursor-pointer leading-none shrink-0 group"
            >
              <span className="hidden xs:inline tracking-tight">Explore plans</span>
              <span className="xs:hidden tracking-tight">Plans</span>
              <span className="text-xs sm:text-sm font-bold transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-lg text-[#CDCBCA] hover:text-white hover:bg-[#141416] border border-[#CDCBCA]/20 transition-colors cursor-pointer shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0c0c0e]/98 backdrop-blur-md border-b border-[#CDCBCA]/20 px-5 py-4 space-y-3 animate-in slide-in-from-top-2 shadow-2xl">
            <div className="flex flex-col space-y-1 text-base font-medium text-[#CDCBCA]">
              <button
                onClick={() => scrollTo('solutions')}
                className="w-full text-left py-2 px-2 hover:bg-[#141416] rounded-lg hover:text-[#D41514] transition-colors"
              >
                Solutions
              </button>
              <button
                onClick={() => scrollTo('features')}
                className="w-full text-left py-2 px-2 hover:bg-[#141416] rounded-lg hover:text-[#D41514] transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollTo('perspectives')}
                className="w-full text-left py-2 px-2 hover:bg-[#141416] rounded-lg hover:text-[#D41514] transition-colors"
              >
                Perspectives
              </button>
              <button
                onClick={() => scrollTo('pricing')}
                className="w-full text-left py-2 px-2 hover:bg-[#141416] rounded-lg hover:text-[#D41514] transition-colors"
              >
                Pricing
              </button>
            </div>

            <div className="pt-3 border-t border-[#CDCBCA]/15 flex flex-col gap-2.5">
              <button
                onClick={() => launchDemoMode()}
                className="btn-hive-crimson w-full bg-gradient-to-r from-[#D41514] via-[#ea201f] to-[#b80f0e] text-white py-3 px-4 rounded-xl font-bold text-sm text-center shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#D41514]/40"
              >
                <span>Explore the platform</span>
                <span>→</span>
              </button>
              <button
                onClick={() => {
                  setShowRequestModal(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-[#121215] hover:bg-[#18181c] border-2 border-[#CDCBCA]/30 text-[#CDCBCA] hover:text-white py-3 px-4 rounded-xl font-bold text-sm text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Building2 className="w-4 h-4 text-[#D41514]" />
                <span>Request Campus Access</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section (hero-surface: obsidian #080808 with atmospheric crimson & silver glow) */}
      <section
        id="solutions"
        className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-18 lg:pt-20 lg:pb-24 border-b border-[#CDCBCA]/15"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 75% 25%, rgba(212, 21, 20, 0.12), transparent), radial-gradient(ellipse 50% 50% at 20% 75%, rgba(205, 203, 202, 0.05), transparent), #080808'
        }}
      >
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 xl:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-3.5 sm:space-y-6 text-left">
              {/* Eyebrow (hero-eyebrow) */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D41514]/12 border border-[#D41514]/35 text-[#D41514] font-black text-[10px] sm:text-[11px] tracking-[0.18em] uppercase shadow-[0_0_16px_rgba(212,21,20,0.25)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D41514] animate-pulse" />
                <span>THE CAMPUS MANAGEMENT SYSTEM</span>
              </div>

              {/* Title (hero-title) */}
              <h1 className="font-fraunces font-bold text-white text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[54px] xl:text-[62px] leading-[1.12] tracking-tight break-words">
                A more connected way to <span className="bg-gradient-to-r from-white via-[#CDCBCA] to-[#CDCBCA] bg-clip-text text-transparent">campus.</span>
              </h1>

              {/* Description (hero-description) */}
              <p className="text-[#CDCBCA] text-sm sm:text-base md:text-lg lg:text-[19px] leading-relaxed max-w-xl">
                Bring conversations, classrooms, coursework, and campus resources together in one
                thoughtfully designed experience.
              </p>

              {/* Action Buttons (hero-primary & hero-secondary) */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:max-w-xl">
                <button
                  onClick={() => launchDemoMode()}
                  className="btn-hive-crimson w-full sm:w-auto bg-gradient-to-r from-[#D41514] via-[#ea201f] to-[#b80f0e] text-white text-sm sm:text-[16px] font-black px-7 sm:px-9 py-3.5 sm:py-4 rounded-full shadow-[0_0_28px_rgba(212,21,20,0.55)] hover:shadow-[0_0_40px_rgba(212,21,20,0.75)] border border-[#D41514]/60 transition-all flex items-center justify-center gap-2.5 group cursor-pointer text-center"
                >
                  <span>Explore the platform</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                </button>

                <button
                  onClick={() => setShowRequestModal(true)}
                  className="w-full sm:w-auto bg-[#121214] hover:bg-[#1a1a1d] border-2 border-[#CDCBCA]/30 hover:border-[#CDCBCA]/80 text-[#CDCBCA] hover:text-white text-sm sm:text-[16px] font-black px-6 sm:px-8 py-3.5 sm:py-4 rounded-full shadow-[0_0_20px_rgba(205,203,202,0.08)] hover:shadow-[0_0_25px_rgba(205,203,202,0.18)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer text-center"
                >
                  <Building2 className="w-4 h-4 text-[#D41514] group-hover:scale-110 transition-transform duration-300" />
                  <span>Request Campus Access</span>
                </button>
              </div>

              {/* Note below buttons (hero-note) */}
              <p className="text-[#8E8C8B] text-xs sm:text-[13px] pt-1">
                One place for the moments that move learning forward.
              </p>
            </div>

            {/* Right Media Column */}
            <div className="lg:col-span-5 relative mt-4 lg:mt-0">
              {/* Main Photo Card with Caption */}
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_12px_45px_rgba(0,0,0,0.8)] border-2 sm:border-4 border-[#CDCBCA]/30 group">
                <img
                  src="https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=1280"
                  alt="Students gathered on a university campus"
                  className="w-full h-[210px] xs:h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px] object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-5 sm:right-5 text-[#CDCBCA] font-dmsans font-bold text-xs sm:text-[14px]">
                  A campus experience that feels connected.
                </div>
              </div>

              {/* Floating Campus Overview Preview Card */}
              <div className="relative sm:absolute mt-3 sm:mt-0 sm:-bottom-6 sm:-left-6 lg:-left-8 bg-[#0e0e11]/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.8)] border border-[#CDCBCA]/30 max-w-full sm:max-w-[260px] animate-in fade-in slide-in-from-bottom-3 duration-300">
                <div className="text-[10px] sm:text-[11px] font-bold text-[#D41514] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D41514]" />
                  <span>CAMPUS OVERVIEW</span>
                </div>
                <div className="text-base sm:text-[18px] font-black text-white mt-1">
                  Everything in sync
                </div>
                <div className="text-xs sm:text-[12px] text-[#CDCBCA] mt-1">
                  Learning, people, and progress—together.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Unified Suite (features-surface: obsidian #080808) */}
      <section id="features" className="py-12 sm:py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 bg-[#080808]">
        <div className="max-w-3xl mb-8 sm:mb-12 lg:mb-14 text-left">
          {/* Kicker */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D41514]/12 border border-[#D41514]/30 text-[#D41514] font-black text-[10px] sm:text-[11px] tracking-[0.18em] uppercase mb-2 sm:mb-3 shadow-[0_0_12px_rgba(212,21,20,0.2)]">
            <span>THE UNIFIED SUITE</span>
          </div>

          {/* Title */}
          <h2 className="font-fraunces font-bold text-white text-2xl sm:text-3xl lg:text-[40px] leading-tight tracking-tight">
            Everything your campus needs. Finally together.
          </h2>

          {/* Description */}
          <p className="mt-2.5 sm:mt-4 text-[#CDCBCA] text-sm sm:text-base lg:text-[17px] leading-relaxed">
            Less switching between tools. More room to teach, learn, collaborate, and get things done.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: ProCollege Teams */}
          <div className="bg-[#0f0f11] border border-[#CDCBCA]/20 hover:border-[#D41514] rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(212,21,20,0.25)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer" onClick={() => scrollTo('perspectives')}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#161618] border border-[#CDCBCA]/25 group-hover:bg-[#D41514] text-[#CDCBCA] group-hover:text-white group-hover:border-[#D41514] flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 shadow-sm">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-[10px] font-black tracking-wider uppercase text-[#8E8C8B] group-hover:text-[#D41514] transition-colors">
                COMMUNICATE
              </div>
              <h3 className="font-black text-lg sm:text-[19px] text-white mt-1 group-hover:text-[#CDCBCA] transition-colors">
                ProCollege Teams
              </h3>
              <p className="text-[#CDCBCA] text-xs sm:text-[13px] leading-relaxed mt-2 sm:mt-2.5">
                Channels and conversations that keep classes, clubs, and departments on the same page.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-[#CDCBCA]/15 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161618] border border-[#CDCBCA]/25 group-hover:bg-[#D41514] text-[#CDCBCA] group-hover:text-white group-hover:border-[#D41514] text-xs font-bold transition-all duration-200">
                <span>See how it connects</span>
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </span>
            </div>
          </div>

          {/* Card 2: ProCollege Meet */}
          <div className="bg-[#0f0f11] border border-[#CDCBCA]/20 hover:border-[#D41514] rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(212,21,20,0.25)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer" onClick={() => scrollTo('perspectives')}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#161618] border border-[#CDCBCA]/25 group-hover:bg-[#D41514] text-[#CDCBCA] group-hover:text-white group-hover:border-[#D41514] flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 shadow-sm">
                <Video className="w-5 h-5" />
              </div>
              <div className="text-[10px] font-black tracking-wider uppercase text-[#8E8C8B] group-hover:text-[#D41514] transition-colors">
                CONNECT
              </div>
              <h3 className="font-black text-lg sm:text-[19px] text-white mt-1 group-hover:text-[#CDCBCA] transition-colors">
                ProCollege Meet
              </h3>
              <p className="text-[#CDCBCA] text-xs sm:text-[13px] leading-relaxed mt-2 sm:mt-2.5">
                A welcoming space for virtual lectures, discussion, and participation wherever you are.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-[#CDCBCA]/15 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161618] border border-[#CDCBCA]/25 group-hover:bg-[#D41514] text-[#CDCBCA] group-hover:text-white group-hover:border-[#D41514] text-xs font-bold transition-all duration-200">
                <span>See how it connects</span>
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </span>
            </div>
          </div>

          {/* Card 3: ProCollege LMS */}
          <div className="bg-[#0f0f11] border border-[#CDCBCA]/20 hover:border-[#D41514] rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(212,21,20,0.25)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer" onClick={() => scrollTo('perspectives')}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#161618] border border-[#CDCBCA]/25 group-hover:bg-[#D41514] text-[#CDCBCA] group-hover:text-white group-hover:border-[#D41514] flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 shadow-sm">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="text-[10px] font-black tracking-wider uppercase text-[#8E8C8B] group-hover:text-[#D41514] transition-colors">
                TEACH
              </div>
              <h3 className="font-black text-lg sm:text-[19px] text-white mt-1 group-hover:text-[#CDCBCA] transition-colors">
                ProCollege LMS
              </h3>
              <p className="text-[#CDCBCA] text-xs sm:text-[13px] leading-relaxed mt-2 sm:mt-2.5">
                Bring assignments, feedback, and learning progress into a clearer academic workflow.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-[#CDCBCA]/15 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161618] border border-[#CDCBCA]/25 group-hover:bg-[#D41514] text-[#CDCBCA] group-hover:text-white group-hover:border-[#D41514] text-xs font-bold transition-all duration-200">
                <span>See how it connects</span>
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </span>
            </div>
          </div>

          {/* Card 4: ProCollege Cloud */}
          <div className="bg-[#0f0f11] border border-[#CDCBCA]/20 hover:border-[#D41514] rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(212,21,20,0.25)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer" onClick={() => scrollTo('perspectives')}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#161618] border border-[#CDCBCA]/25 group-hover:bg-[#D41514] text-[#CDCBCA] group-hover:text-white group-hover:border-[#D41514] flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 shadow-sm">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div className="text-[10px] font-black tracking-wider uppercase text-[#8E8C8B] group-hover:text-[#D41514] transition-colors">
                ORGANIZE
              </div>
              <h3 className="font-black text-lg sm:text-[19px] text-white mt-1 group-hover:text-[#CDCBCA] transition-colors">
                ProCollege Cloud
              </h3>
              <p className="text-[#CDCBCA] text-xs sm:text-[13px] leading-relaxed mt-2 sm:mt-2.5">
                Give documents, research, and shared resources a place everyone can find.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-[#CDCBCA]/15 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161618] border border-[#CDCBCA]/25 group-hover:bg-[#D41514] text-[#CDCBCA] group-hover:text-white group-hover:border-[#D41514] text-xs font-bold transition-all duration-200">
                <span>See how it connects</span>
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. One Seamless Workflow Banner (workflow-panel: obsidian #0b0b0d with laser crimson accent) */}
      <section className="bg-gradient-to-b from-[#0d0d0f] via-[#09090a] to-[#0d0d0f] text-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 xl:px-12 border-y border-[#CDCBCA]/15 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(212, 21, 20, 0.08), transparent 70%)'
        }} />
        <div className="max-w-4xl mx-auto text-center space-y-3 sm:space-y-4 relative z-10">
          {/* Kicker */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D41514]/12 border border-[#D41514]/30 text-[#D41514] font-black text-[10px] sm:text-[11px] tracking-[0.18em] uppercase shadow-[0_0_12px_rgba(212,21,20,0.2)]">
            <span>ONE SEAMLESS WORKFLOW</span>
          </div>

          {/* Title */}
          <h2 className="font-fraunces font-bold text-white text-xl sm:text-2xl md:text-3xl lg:text-[34px] leading-snug">
            The whole campus, in conversation.
          </h2>

          {/* Description */}
          <p className="text-[#CDCBCA] text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            A discussion becomes a class. A class becomes an assignment. Great work stays easy to find.
          </p>

          <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => launchDemoMode()}
              className="btn-hive-crimson bg-gradient-to-r from-[#D41514] via-[#ea201f] to-[#b80f0e] text-white font-black text-sm sm:text-[15px] px-7 sm:px-8 py-3.5 rounded-full border border-[#D41514]/50 shadow-[0_0_25px_rgba(212,21,20,0.5)] cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>Experience the workflow</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </button>
            <button
              onClick={() => setShowRequestModal(true)}
              className="bg-[#121214] hover:bg-[#1a1a1d] border-2 border-[#CDCBCA]/30 hover:border-[#CDCBCA]/80 text-[#CDCBCA] hover:text-white font-black text-sm sm:text-[15px] px-6 sm:px-7 py-3.5 rounded-full hover:shadow-[0_0_20px_rgba(205,203,202,0.15)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 group"
            >
              <Building2 className="w-4 h-4 text-[#D41514] group-hover:scale-110 transition-transform duration-300" />
              <span>Contact for Campus Onboarding</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5. Perspectives Section (perspectives-surface: obsidian #080808) */}
      <section id="perspectives" className="py-12 sm:py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 bg-[#080808]">
        <div className="max-w-3xl mb-8 sm:mb-12 lg:mb-14 text-left">
          {/* Kicker */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D41514]/12 border border-[#D41514]/30 text-[#D41514] font-black text-[10px] sm:text-[11px] tracking-[0.18em] uppercase mb-2 sm:mb-3 shadow-[0_0_12px_rgba(212,21,20,0.2)]">
            <span>MADE FOR CAMPUS LIFE</span>
          </div>

          {/* Title */}
          <h2 className="font-fraunces font-bold text-white text-2xl sm:text-3xl lg:text-[40px] leading-tight tracking-tight">
            One experience. Many ways to thrive.
          </h2>

          {/* Description */}
          <p className="mt-2.5 sm:mt-4 text-[#CDCBCA] text-sm sm:text-base lg:text-[17px] leading-relaxed">
            Imagine a simpler day for everyone who makes a campus work.
          </p>
        </div>

        {/* 3 Perspective Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Student perspective */}
          <div className="bg-[#0f0f11] border-2 border-[#CDCBCA]/20 hover:border-[#D41514]/70 rounded-2xl p-5 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(212,21,20,0.2)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <p className="text-[#CDCBCA] group-hover:text-white text-sm sm:text-[15px] leading-relaxed italic transition-colors">
              &quot;Lectures, team chats, feedback, and files—without the search across five different tools.&quot;
            </p>
            <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-[#CDCBCA]/15 flex items-center justify-between">
              <div className="text-white group-hover:text-[#D41514] font-black text-xs sm:text-[13px] tracking-wide uppercase transition-colors">
                Student perspective
              </div>
              <span className="w-2 h-2 rounded-full bg-[#D41514] opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_#D41514]" />
            </div>
          </div>

          {/* Card 2: Faculty perspective */}
          <div className="bg-[#0f0f11] border-2 border-[#CDCBCA]/20 hover:border-[#D41514]/70 rounded-2xl p-5 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(212,21,20,0.2)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <p className="text-[#CDCBCA] group-hover:text-white text-sm sm:text-[15px] leading-relaxed italic transition-colors">
              &quot;One calm place to plan a class, support students, and stay connected to colleagues.&quot;
            </p>
            <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-[#CDCBCA]/15 flex items-center justify-between">
              <div className="text-white group-hover:text-[#D41514] font-black text-xs sm:text-[13px] tracking-wide uppercase transition-colors">
                Faculty perspective
              </div>
              <span className="w-2 h-2 rounded-full bg-[#D41514] opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_#D41514]" />
            </div>
          </div>

          {/* Card 3: IT perspective */}
          <div className="bg-[#0f0f11] border-2 border-[#CDCBCA]/20 hover:border-[#D41514]/70 rounded-2xl p-5 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(212,21,20,0.2)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <p className="text-[#CDCBCA] group-hover:text-white text-sm sm:text-[15px] leading-relaxed italic transition-colors">
              &quot;A clearer starting point for bringing people and campus workflows together.&quot;
            </p>
            <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-[#CDCBCA]/15 flex items-center justify-between">
              <div className="text-white group-hover:text-[#D41514] font-black text-xs sm:text-[13px] tracking-wide uppercase transition-colors">
                IT perspective
              </div>
              <span className="w-2 h-2 rounded-full bg-[#D41514] opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_#D41514]" />
            </div>
          </div>
        </div>

        {/* sample-note */}
        <p className="text-center text-[#8E8C8B] text-[11px] sm:text-[12px] mt-6 sm:mt-8">
          Illustrative perspectives only; these are not customer endorsements.
        </p>
      </section>

      {/* 6. Pricing Section (pricing-surface: obsidian #0a0a0c) */}
      <section
        id="pricing"
        className="py-12 sm:py-16 lg:py-24 border-t border-[#CDCBCA]/15 px-3 xs:px-4 sm:px-6 lg:px-8 xl:px-12 bg-[#0a0a0c]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-8 sm:mb-12 lg:mb-14 text-left">
            {/* Kicker */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D41514]/12 border border-[#D41514]/30 text-[#D41514] font-black text-[10px] sm:text-[11px] tracking-[0.18em] uppercase mb-2 sm:mb-3 shadow-[0_0_12px_rgba(212,21,20,0.2)]">
              <span>CAMPUS PLANS</span>
            </div>

            {/* Title */}
            <h2 className="font-fraunces font-bold text-white text-2xl sm:text-3xl lg:text-[40px] leading-tight tracking-tight">
              Room to grow, at every scale.
            </h2>

            {/* Description */}
            <p className="mt-2.5 sm:mt-4 text-[#CDCBCA] text-sm sm:text-base lg:text-[17px] leading-relaxed">
              Explore example plans for a small team, a connected campus, or an entire institution.
            </p>
          </div>

          {/* 3 Pricing Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {/* Tier 1: Starter */}
            <div
              onClick={() => setShowRequestModal(true)}
              className="plan-card bg-[#0f0f12] border-2 border-[#CDCBCA]/25 hover:border-[#CDCBCA]/70 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_0_35px_rgba(205,203,202,0.15)] flex flex-col justify-between transition-all duration-300 ease-out group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#CDCBCA]/30 group-hover:bg-[#CDCBCA] transition-colors duration-300" />
              <div>
                <h3 className="font-black text-lg sm:text-[20px] text-white group-hover:text-[#CDCBCA] transition-colors">
                  Starter
                </h3>
                <div className="mt-3 sm:mt-4 font-black text-2xl sm:text-[34px] text-white leading-none">
                  Free
                </div>
                <div className="text-xs sm:text-[13px] text-[#8E8C8B] mt-1 sm:mt-1.5">
                  For clubs and small departments
                </div>

                <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[#CDCBCA]/15 space-y-3 sm:space-y-3.5">
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#CDCBCA]">
                    <div className="w-5 h-5 rounded-full bg-[#18181b] border border-[#CDCBCA]/30 group-hover:border-[#CDCBCA] text-[#CDCBCA] flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Up to 100 users</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#CDCBCA]">
                    <div className="w-5 h-5 rounded-full bg-[#18181b] border border-[#CDCBCA]/30 group-hover:border-[#CDCBCA] text-[#CDCBCA] flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Core collaboration tools</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#CDCBCA]">
                    <div className="w-5 h-5 rounded-full bg-[#18181b] border border-[#CDCBCA]/30 group-hover:border-[#CDCBCA] text-[#CDCBCA] flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Shared workspace</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-[#CDCBCA]/15">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRequestModal(true);
                  }}
                  className="btn-hive-silver w-full py-3.5 px-6 rounded-full bg-[#161619] hover:bg-[#202024] text-[#CDCBCA] hover:text-white border border-[#CDCBCA]/30 hover:border-[#CDCBCA]/70 text-sm sm:text-[15px] font-black shadow-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Request Starter Access</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>

            {/* Tier 2: Campus Pro (Featured Plan) */}
            <div
              onClick={() => setShowRequestModal(true)}
              className="plan-card plan-card-featured bg-gradient-to-b from-[#141418] via-[#0f0f13] to-[#0a0a0d] border-2 border-[#D41514] hover:border-[#ea201f] ring-4 ring-[#D41514]/25 hover:ring-[#D41514]/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(212,21,20,0.3)] hover:shadow-[0_0_70px_rgba(212,21,20,0.45)] flex flex-col justify-between relative transform lg:-translate-y-2 lg:hover:-translate-y-4 transition-all duration-300 ease-out group overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#D41514] via-[#ea201f] to-[#CDCBCA]" />

              {/* pro-badge */}
              <div className="absolute -top-3.5 left-6 sm:left-8 bg-gradient-to-r from-[#D41514] to-[#a30b0a] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-[0_0_15px_rgba(212,21,20,0.6)] group-hover:shadow-[0_0_20px_rgba(212,21,20,0.8)] transition-all">
                Featured plan
              </div>

              <div>
                <h3 className="font-black text-lg sm:text-[20px] text-white group-hover:text-[#CDCBCA] transition-colors">
                  Campus Pro
                </h3>
                <div className="mt-3 sm:mt-4 font-black text-2xl sm:text-[34px] text-white group-hover:text-[#D41514] leading-none transition-colors">
                  $6 / student / mo
                </div>
                <div className="text-xs sm:text-[13px] text-[#8E8C8B] mt-1 sm:mt-1.5">
                  Illustrative annual pricing
                </div>

                <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[#D41514]/30 space-y-3 sm:space-y-3.5">
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-white font-medium">
                    <div className="w-5 h-5 rounded-full bg-[#D41514]/20 border border-[#D41514]/50 group-hover:bg-[#D41514] text-[#D41514] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Full Teams experience</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-white font-medium">
                    <div className="w-5 h-5 rounded-full bg-[#D41514]/20 border border-[#D41514]/50 group-hover:bg-[#D41514] text-[#D41514] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Virtual lectures</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-white font-medium">
                    <div className="w-5 h-5 rounded-full bg-[#D41514]/20 border border-[#D41514]/50 group-hover:bg-[#D41514] text-[#D41514] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Learning workflows</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-white font-medium">
                    <div className="w-5 h-5 rounded-full bg-[#D41514]/20 border border-[#D41514]/50 group-hover:bg-[#D41514] text-[#D41514] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Study assistance</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-[#D41514]/30">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRequestModal(true);
                  }}
                  className="btn-hive-crimson w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#D41514] via-[#ea201f] to-[#b80f0e] hover:from-[#ea201f] hover:to-[#9f0a09] text-white text-sm sm:text-[15px] font-black shadow-[0_0_30px_rgba(212,21,20,0.55)] hover:shadow-[0_0_45px_rgba(212,21,20,0.75)] border border-[#D41514]/60 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Request Campus Access</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>

            {/* Tier 3: Enterprise University */}
            <div
              onClick={() => setShowRequestModal(true)}
              className="plan-card bg-[#0f0f12] border-2 border-[#CDCBCA]/25 hover:border-[#D41514]/60 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_0_35px_rgba(212,21,20,0.2)] flex flex-col justify-between transition-all duration-300 ease-out group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#CDCBCA]/30 group-hover:bg-[#D41514] transition-colors duration-300" />
              <div>
                <h3 className="font-black text-lg sm:text-[20px] text-white group-hover:text-[#CDCBCA] transition-colors">
                  Enterprise University
                </h3>
                <div className="mt-3 sm:mt-4 font-black text-2xl sm:text-[34px] text-white leading-none">
                  Custom
                </div>
                <div className="text-xs sm:text-[13px] text-[#8E8C8B] mt-1 sm:mt-1.5">
                  For larger institutions
                </div>

                <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[#CDCBCA]/15 space-y-3 sm:space-y-3.5">
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#CDCBCA]">
                    <div className="w-5 h-5 rounded-full bg-[#18181b] border border-[#CDCBCA]/30 group-hover:border-[#D41514] text-[#CDCBCA] group-hover:text-[#D41514] flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Multi-campus planning</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#CDCBCA]">
                    <div className="w-5 h-5 rounded-full bg-[#18181b] border border-[#CDCBCA]/30 group-hover:border-[#D41514] text-[#CDCBCA] group-hover:text-[#D41514] flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Institutional integrations</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#CDCBCA]">
                    <div className="w-5 h-5 rounded-full bg-[#18181b] border border-[#CDCBCA]/30 group-hover:border-[#D41514] text-[#CDCBCA] group-hover:text-[#D41514] flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Governance considerations</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#CDCBCA]">
                    <div className="w-5 h-5 rounded-full bg-[#18181b] border border-[#CDCBCA]/30 group-hover:border-[#D41514] text-[#CDCBCA] group-hover:text-[#D41514] flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Dedicated support options</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-[#CDCBCA]/15">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRequestModal(true);
                  }}
                  className="btn-hive w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#141417] via-[#1a1a1f] to-[#141417] hover:from-[#D41514] hover:to-[#b80f0e] text-[#CDCBCA] hover:text-white text-sm sm:text-[15px] font-black border border-[#CDCBCA]/30 hover:border-[#D41514] shadow-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Inquire for Institution</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>
          </div>

          {/* pricing-note */}
          <p className="text-center text-[#8E8C8B] text-[11px] sm:text-[12px] mt-6 sm:mt-8">
            Plans and prices shown are illustrative, not a live offer.
          </p>
        </div>
      </section>

      {/* 7. Footer (footer-surface: obsidian #050505) */}
      <footer className="bg-[#050505] text-[#CDCBCA] py-12 sm:py-16 px-4 sm:px-6 lg:px-8 xl:px-12 border-t border-[#CDCBCA]/15">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 md:gap-10">
            {/* Brand & Slogan */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2.5">
                <ProCollegeLogo size="md" variant="crimson-text" />
              </div>
              <div className="text-xs sm:text-[13px] text-[#8E8C8B] font-normal pt-1">
                Your College, Smarter.
              </div>
            </div>

            {/* Navigation Columns */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-8 lg:gap-12 text-xs sm:text-[14px]">
              <button
                onClick={() => scrollTo('solutions')}
                className="text-left hover:text-white transition-colors cursor-pointer"
              >
                Solutions
              </button>
              <button
                onClick={() => scrollTo('features')}
                className="text-left hover:text-white transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => scrollTo('perspectives')}
                className="text-left hover:text-white transition-colors cursor-pointer"
              >
                Perspectives
              </button>
              <button
                onClick={() => scrollTo('pricing')}
                className="text-left hover:text-white transition-colors cursor-pointer"
              >
                Pricing
              </button>
              <button
                onClick={() => setShowRequestModal(true)}
                className="text-left px-3.5 py-1.5 rounded-full bg-[#D41514]/15 hover:bg-[#D41514] text-[#D41514] hover:text-white border border-[#D41514]/40 font-bold text-xs transition-all cursor-pointer shadow-[0_0_12px_rgba(212,21,20,0.25)] self-start"
              >
                Request Access ↗
              </button>
              <button
                onClick={() => launchDemoMode()}
                className="text-left px-3.5 py-1.5 rounded-full bg-[#CDCBCA]/12 hover:bg-[#CDCBCA] text-[#CDCBCA] hover:text-[#080808] border border-[#CDCBCA]/30 font-bold text-xs transition-all cursor-pointer shadow-xs self-start"
              >
                Access Workspace Portal →
              </button>
            </div>
          </div>

          {/* Concept Note & Copyright */}
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-[#CDCBCA]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] sm:text-[12px] text-[#8E8C8B]">
            <p className="leading-relaxed">
              Website concept: platform access, purchases, trials, and sales requests are managed via institutional onboarding agreements.
            </p>
            <p className="shrink-0 font-medium text-[#CDCBCA]">
              © 2026 ProCollege. Your College, Smarter.
            </p>
          </div>
        </div>
      </footer>

      {/* 8. Institutional Access Request Modal (Contact Form) */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl lg:max-w-5xl w-full p-5 sm:p-7 md:p-8 shadow-2xl border border-zinc-200 relative max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <ProCollegeLogo size="sm" variant="dark-text" />
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
                  {/* Left Column: Campus Deployment Form (7 cols on desktop) */}
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
                            className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff]"
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
                            className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1">
                            Contact Person Name & Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={orgForm.contactName}
                            onChange={e => setOrgForm({ ...orgForm, contactName: e.target.value })}
                            placeholder="Full Name & Academic Role"
                            className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff]"
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
                            className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff]"
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
                              className="w-28 text-xs sm:text-sm border border-zinc-300 rounded-xl px-2.5 py-2.5 text-zinc-900 bg-zinc-50 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff] shrink-0 font-medium cursor-pointer"
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
                              className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff]"
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
                            className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff] bg-white cursor-pointer"
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
                              ? 'border-[#173bff] bg-blue-50/50 text-[#173bff] font-bold'
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
                              ? 'border-[#173bff] bg-blue-50/50 text-[#173bff] font-bold'
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
                          placeholder="Implementation requirements, SIS integration needs, or campus specifics..."
                          className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2 text-zinc-900 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff]"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmittingRequest}
                          className="btn-hive w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#173bff] to-[#0c2de6] text-white text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                          {isSubmittingRequest ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Submitting Deployment Request...</span>
                            </>
                          ) : (
                            <>
                              <span>Submit Deployment Request</span>
                              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Right Column: Direct Deployment & Contact Card (5 cols on desktop) */}
                  <div className="lg:col-span-5 bg-gradient-to-br from-[#101b46] via-[#0d173b] to-[#090f28] text-white rounded-2xl p-5 sm:p-6 border border-blue-900/50 shadow-xl flex flex-col justify-between space-y-4">
                    <div>
                      <div className="text-[11px] font-bold tracking-wider uppercase text-blue-400">
                        Direct Deployment Contacts
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-white mt-1">
                        Connect with Our Team
                      </h4>
                      <p className="text-xs text-blue-200/80 mt-1 leading-relaxed">
                        Speak directly with our campus deployment lead for fast onboarding, agreement details, and institutional rollouts.
                      </p>

                      <div className="mt-4 pt-4 border-t border-blue-800/40 space-y-3.5">
                        {/* Name */}
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                            Name & Leadership
                          </div>
                          <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                            Sujan GC
                          </div>
                          <div className="text-[11px] text-blue-200/70">
                            Campus Deployment & Academic Systems
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                            Email ID
                          </div>
                          <a
                            href="mailto:gcsujan321@gmail.com"
                            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-100 hover:text-white hover:underline mt-0.5 group"
                          >
                            <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                            <span className="break-all">gcsujan321@gmail.com</span>
                          </a>
                        </div>

                        {/* Contact Info */}
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                            Contact Info (WhatsApp / Cell Phone)
                          </div>
                          <a
                            href="tel:+9779848962315"
                            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-100 hover:text-white hover:underline mt-0.5"
                          >
                            <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>+977 9848962315</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Quick Contact Actions */}
                    <div className="pt-3 border-t border-blue-800/40 space-y-2">
                      <a
                        href="https://wa.me/9779848962315"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat on WhatsApp</span>
                      </a>

                      <a
                        href="mailto:gcsujan321@gmail.com?subject=ProCollege%20Campus%20Deployment%20Inquiry"
                        className="w-full py-2.5 px-3.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Send Official Inquiry</span>
                      </a>

                      <div className="text-[11px] text-blue-300/80 text-center pt-1">
                        Direct response within 1 to 2 hours
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 sm:py-6 text-center space-y-3 sm:space-y-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#101b46]">Request Successfully Dispatched!</h3>
                <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 sm:p-4 text-xs text-blue-900 text-left space-y-2">
                  <div className="font-bold text-xs sm:text-sm text-[#101b46] flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-[#173bff]" />
                    <span>Next Step: Organization Admin Login ID Verification</span>
                  </div>
                  <p className="leading-relaxed text-[#44536c]">
                    Our university deployment specialist will review your institutional credentials for <strong>{orgForm.institutionName}</strong> and contact <strong>{orgForm.contactName}</strong> at <strong>{orgForm.email}</strong>.
                  </p>
                  <p className="leading-relaxed text-[#44536c]">
                    Upon verification, you will receive your official <strong>Organization Admin Login ID (ORG-ADMIN-XX)</strong>, enabling you to provision all student and lecturer accounts.
                  </p>
                </div>

                <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
                  <button
                    onClick={() => launchDemoMode()}
                    className="btn-hive w-full sm:w-auto py-3 px-6 rounded-xl bg-gradient-to-r from-[#173bff] to-[#0c2de6] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 group"
                  >
                    <span>Open Platform Workspace</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() => {
                      setShowRequestModal(false);
                      setRequestSubmitted(false);
                    }}
                    className="w-full sm:w-auto py-3 px-5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. Institutional Sign-In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 relative max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-100">
              <ProCollegeLogo size="sm" variant="dark-text" />
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
                  <p className="text-xs text-[#586680] mt-1.5 leading-relaxed">
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
                      className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff]"
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
                        className="text-xs text-[#173bff] hover:text-[#0c2de6] hover:underline font-semibold cursor-pointer"
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
                      className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="btn-hive w-full py-3.5 rounded-xl bg-gradient-to-r from-[#173bff] via-[#244cff] to-[#0d2ee6] text-white text-xs sm:text-sm font-bold shadow-[0_4px_18px_rgba(23,59,255,0.4)] hover:shadow-[0_8px_24px_rgba(23,59,255,0.55)] transition-all flex items-center justify-center gap-2 cursor-pointer group mt-2 disabled:opacity-60"
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
                      className="text-xs text-[#173bff] hover:underline font-semibold"
                    >
                      Need an account for your university? Request Campus Deployment →
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 2: 6-Digit Email 2FA OTP Verification */}
            {authStep === 'otp' && (
              <>
                <div className="mt-5">
                  <div className="w-10 h-10 rounded-xl bg-[#173bff]/10 text-[#173bff] flex items-center justify-center mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Two-Factor Security Verification</h3>
                  <p className="text-xs text-[#586680] mt-1.5 leading-relaxed">
                    A 6-digit security code was dispatched directly to <span className="font-semibold text-zinc-900">{otpEmail}</span>. Please check your inbox and spam folder.
                  </p>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-[#173bff] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-blue-950">Check Your Registered Mailbox</p>
                    <p className="text-blue-800/80 leading-relaxed">
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
                      className="w-full text-center font-mono text-2xl tracking-[0.35em] font-bold border border-zinc-300 rounded-xl px-4 py-3 text-zinc-900 placeholder-zinc-300 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
                    <span>Didn't get the code?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isResending}
                      className="font-semibold text-[#173bff] hover:underline disabled:text-zinc-400 disabled:no-underline cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : isResending ? 'Sending...' : 'Resend Code'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpCode.trim().length !== 6}
                    className="btn-hive w-full py-3.5 rounded-xl bg-gradient-to-r from-[#173bff] via-[#244cff] to-[#0d2ee6] text-white text-xs sm:text-sm font-bold shadow-[0_4px_18px_rgba(23,59,255,0.4)] hover:shadow-[0_8px_24px_rgba(23,59,255,0.55)] transition-all flex items-center justify-center gap-2 cursor-pointer group mt-2 disabled:opacity-50"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Security Code...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Continue</span>
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
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 font-semibold"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Email & Password</span>
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
                  <p className="text-xs text-[#586680] mt-1.5 leading-relaxed">
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
                      className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff]"
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
                      className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword || !newPassword || !confirmPassword}
                    className="btn-hive w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs sm:text-sm font-bold shadow-[0_4px_18px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer group mt-2 disabled:opacity-50"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save & Enter Workspace</span>
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
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 font-semibold"
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
                  <div className="w-10 h-10 rounded-xl bg-[#173bff]/10 text-[#173bff] flex items-center justify-center mb-3">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Reset Your Password</h3>
                  <p className="text-xs text-[#586680] mt-1.5 leading-relaxed">
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
                      className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isRequestingResetOtp || !resetEmail.trim()}
                    className="btn-hive w-full py-3.5 rounded-xl bg-gradient-to-r from-[#173bff] via-[#244cff] to-[#0d2ee6] text-white text-xs sm:text-sm font-bold shadow-[0_4px_18px_rgba(23,59,255,0.4)] hover:shadow-[0_8px_24px_rgba(23,59,255,0.55)] transition-all flex items-center justify-center gap-2 cursor-pointer group mt-2 disabled:opacity-50"
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
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Verify Code & Set New Password</h3>
                  <p className="text-xs text-[#586680] mt-1.5 leading-relaxed">
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
                      className="w-full text-center font-mono text-2xl tracking-[0.35em] font-bold border border-zinc-300 rounded-xl px-4 py-2.5 text-zinc-900 placeholder-zinc-300 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
                    <span>Didn't receive the code?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isResending}
                      className="font-semibold text-[#173bff] hover:underline disabled:text-zinc-400 disabled:no-underline cursor-pointer"
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
                      className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff]"
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
                      className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingReset || resetOtpCode.length !== 6 || !resetNewPass || !resetConfirmPass}
                    className="btn-hive w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white text-xs sm:text-sm font-bold shadow-[0_4px_18px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer group mt-2 disabled:opacity-50"
                  >
                    {isVerifyingReset ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Resetting Password...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset Password & Enter Portal</span>
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
