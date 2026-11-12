import React, { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProCollegeLogo } from './ProCollegeLogo';

export const PortalLanding: React.FC = () => {
  const {
    setViewMode,
    setCurrentUser,
    availableUsers,
    setIsDemoMode,
    submitInstitutionalRequest
  } = useApp();

  const [showSignInModal, setShowSignInModal] = useState<boolean>(false);
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [requestSubmitted, setRequestSubmitted] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Sign In Modal State
  const [signInTab, setSignInTab] = useState<'demo' | 'institutional'>('demo');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

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

  const launchDemoMode = (userToSet?: typeof availableUsers[0]) => {
    setIsDemoMode(true);
    if (userToSet) {
      setCurrentUser(userToSet);
    }
    setShowSignInModal(false);
    setShowRequestModal(false);
    setMobileMenuOpen(false);
    setViewMode('app');
  };

  const handleInstitutionalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const email = loginEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setLoginError('Please enter a valid institutional email address (name@university.edu).');
      return;
    }

    const foundUser = availableUsers.find(
      u => u.email.toLowerCase() === email || (u.loginId && u.loginId.toLowerCase() === email)
    );

    if (foundUser) {
      setIsDemoMode(false); // Official verified session
      setCurrentUser(foundUser);
      setShowSignInModal(false);
      setViewMode('app');
    } else {
      setLoginError(
        'Institutional email not found in our registry. Please check your credentials or submit an access request.'
      );
    }
  };

  const handleOrgRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgForm.institutionName || !orgForm.contactName || !orgForm.email) return;

    const fullPhone = orgForm.phone.trim() ? `${phoneCountryCode} ${orgForm.phone.trim()}` : '';

    submitInstitutionalRequest({
      institutionName: orgForm.institutionName.trim(),
      department: orgForm.department.trim() || 'Academic Operations',
      contactName: orgForm.contactName.trim(),
      email: orgForm.email.trim(),
      phone: fullPhone || 'N/A',
      studentCount: Number(orgForm.studentCount) || 1000,
      deploymentType: orgForm.deploymentType,
      notes: orgForm.notes.trim()
    });

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
    <div className="min-h-screen w-full bg-white text-[#101b46] font-dmsans selection:bg-[#173bff] selection:text-white antialiased overflow-x-hidden">
      {/* 1. Header Navigation Bar (header-surface) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-100 transition-all">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 xl:px-12 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand Logo & Name (header-brand) */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
          >
            <ProCollegeLogo size="sm" className="sm:hidden" />
            <ProCollegeLogo size="md" className="hidden sm:flex" />
          </div>

          {/* Center Navigation Links (desktop & tablet landscape) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-9 text-[15px] lg:text-[16px] font-normal text-[#44536c]">
            <button
              onClick={() => scrollTo('solutions')}
              className="hover:text-[#173bff] transition-colors cursor-pointer"
            >
              Solutions
            </button>
            <button
              onClick={() => scrollTo('features')}
              className="hover:text-[#173bff] transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollTo('perspectives')}
              className="hover:text-[#173bff] transition-colors cursor-pointer"
            >
              Perspectives
            </button>
            <button
              onClick={() => scrollTo('pricing')}
              className="hover:text-[#173bff] transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </nav>

          {/* Right Action Buttons: Sign In + header-cta (Explore plans ↗) */}
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 shrink-0">
            <button
              onClick={() => {
                setSignInTab('institutional');
                setShowSignInModal(true);
              }}
              className="text-xs sm:text-sm md:text-[15px] font-bold text-[#101b46] hover:text-[#173bff] px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-transparent hover:border-zinc-200 hover:bg-zinc-100/70 active:scale-95 transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#173bff] shrink-0" />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => scrollTo('pricing')}
              className="btn-hive-cyan bg-gradient-to-r from-[#18d6ff] via-[#45e4ff] to-[#00c5ee] text-[#091538] text-xs sm:text-sm md:text-[15px] font-black px-3.5 xs:px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full border border-cyan-200/90 shadow-[0_2px_14px_rgba(24,214,255,0.45)] hover:shadow-[0_4px_22px_rgba(24,214,255,0.7)] flex items-center gap-1.5 cursor-pointer leading-none shrink-0 group"
            >
              <span className="hidden xs:inline tracking-tight">Explore plans</span>
              <span className="xs:hidden tracking-tight">Plans</span>
              <span className="text-xs sm:text-sm font-bold transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-zinc-800" />
              ) : (
                <Menu className="w-5 h-5 text-zinc-800" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (compact and touch-friendly) */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/98 backdrop-blur-md border-b border-zinc-200 px-5 py-4 space-y-3 animate-in slide-in-from-top-2 shadow-lg">
            <div className="flex flex-col space-y-1 text-base font-medium text-[#44536c]">
              <button
                onClick={() => scrollTo('solutions')}
                className="w-full text-left py-2 px-2 hover:bg-zinc-50 rounded-lg hover:text-[#173bff] transition-colors"
              >
                Solutions
              </button>
              <button
                onClick={() => scrollTo('features')}
                className="w-full text-left py-2 px-2 hover:bg-zinc-50 rounded-lg hover:text-[#173bff] transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollTo('perspectives')}
                className="w-full text-left py-2 px-2 hover:bg-zinc-50 rounded-lg hover:text-[#173bff] transition-colors"
              >
                Perspectives
              </button>
              <button
                onClick={() => scrollTo('pricing')}
                className="w-full text-left py-2 px-2 hover:bg-zinc-50 rounded-lg hover:text-[#173bff] transition-colors"
              >
                Pricing
              </button>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2.5">
              <button
                onClick={() => launchDemoMode()}
                className="btn-hive w-full bg-gradient-to-r from-[#173bff] to-[#0d2ee6] text-white py-3 px-4 rounded-xl font-bold text-sm text-center shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore the platform</span>
                <span>→</span>
              </button>
              <button
                onClick={() => {
                  setShowRequestModal(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-white hover:bg-blue-50/70 border-2 border-[#173bff]/30 text-[#101b46] py-3 px-4 rounded-xl font-bold text-sm text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Building2 className="w-4 h-4 text-[#173bff]" />
                <span>Request Campus Access</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section (hero-surface: gradient #f9fbff to #e6faff, 125deg) */}
      <section
        id="solutions"
        className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-18 lg:pt-20 lg:pb-24 border-b border-blue-50"
        style={{
          background: 'linear-gradient(125deg, #f9fbff 0%, #e6faff 100%)'
        }}
      >
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 xl:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-3.5 sm:space-y-6 text-left">
              {/* Eyebrow (hero-eyebrow) */}
              <div className="inline-block text-[#173bff] font-black text-[10px] sm:text-[11px] tracking-[0.16em] uppercase">
                THE CAMPUS MANAGEMENT SYSTEM
              </div>

              {/* Title (hero-title) - fully fluid responsive */}
              <h1 className="font-fraunces font-bold text-[#101b46] text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[54px] xl:text-[62px] leading-[1.12] tracking-tight break-words">
                A more connected way to campus.
              </h1>

              {/* Description (hero-description) */}
              <p className="text-[#52627c] text-sm sm:text-base md:text-lg lg:text-[19px] leading-relaxed max-w-xl">
                Bring conversations, classrooms, coursework, and campus resources together in one
                thoughtfully designed experience.
              </p>

              {/* Action Buttons (hero-primary & hero-secondary) */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:max-w-xl">
                <button
                  onClick={() => launchDemoMode()}
                  className="btn-hive w-full sm:w-auto bg-gradient-to-r from-[#173bff] via-[#244cff] to-[#0d2ee6] text-white text-sm sm:text-[16px] font-black px-7 sm:px-9 py-3.5 sm:py-4 rounded-full shadow-[0_6px_22px_rgba(23,59,255,0.42)] hover:shadow-[0_12px_32px_rgba(23,59,255,0.58)] border border-blue-300/30 transition-all flex items-center justify-center gap-2.5 group cursor-pointer text-center"
                >
                  <span>Explore the platform</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                </button>

                <button
                  onClick={() => setShowRequestModal(true)}
                  className="w-full sm:w-auto bg-white/95 hover:bg-blue-50/70 border-2 border-[#173bff]/25 hover:border-[#173bff] text-[#101b46] hover:text-[#173bff] text-sm sm:text-[16px] font-black px-6 sm:px-8 py-3.5 sm:py-4 rounded-full shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer text-center"
                >
                  <Building2 className="w-4 h-4 text-[#173bff] group-hover:scale-110 transition-transform duration-300" />
                  <span>Request Campus Access</span>
                </button>
              </div>

              {/* Note below buttons (hero-note) */}
              <p className="text-[#63748e] text-xs sm:text-[13px] pt-1">
                One place for the moments that move learning forward.
              </p>
            </div>

            {/* Right Media Column (hero-image + preview-card) */}
            <div className="lg:col-span-5 relative mt-4 lg:mt-0">
              {/* Main Photo Card with Caption */}
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border-2 sm:border-4 border-white/80 group">
                <img
                  src="https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=1280"
                  alt="Students gathered on a university campus"
                  className="w-full h-[210px] xs:h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px] object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-5 sm:right-5 text-white font-dmsans font-bold text-xs sm:text-[14px]">
                  A campus experience that feels connected.
                </div>
              </div>

              {/* Floating Campus Overview Preview Card (responsive position to avoid overflow) */}
              <div className="relative sm:absolute mt-3 sm:mt-0 sm:-bottom-6 sm:-left-6 lg:-left-8 bg-white rounded-2xl p-4 sm:p-5 shadow-lg sm:shadow-xl border border-blue-100/90 max-w-full sm:max-w-[260px] animate-in fade-in slide-in-from-bottom-3 duration-300">
                <div className="text-[10px] sm:text-[11px] font-bold text-[#6b7991] uppercase tracking-wider">
                  CAMPUS OVERVIEW
                </div>
                <div className="text-base sm:text-[18px] font-black text-[#101b46] mt-0.5">
                  Everything in sync
                </div>
                <div className="text-xs sm:text-[12px] text-[#6b7991] mt-0.5">
                  Learning, people, and progress—together.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Unified Suite (features-surface: #ffffff) */}
      <section id="features" className="py-12 sm:py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 bg-white">
        <div className="max-w-3xl mb-8 sm:mb-12 lg:mb-14 text-left">
          {/* Kicker (features-kicker) */}
          <div className="text-[#173bff] font-black text-[10px] sm:text-[11px] tracking-[0.16em] uppercase mb-2 sm:mb-3">
            THE UNIFIED SUITE
          </div>

          {/* Title (features-title) */}
          <h2 className="font-fraunces font-bold text-[#101b46] text-2xl sm:text-3xl lg:text-[40px] leading-tight tracking-tight">
            Everything your campus needs. Finally together.
          </h2>

          {/* Description (features-description) */}
          <p className="mt-2.5 sm:mt-4 text-[#586680] text-sm sm:text-base lg:text-[17px] leading-relaxed">
            Less switching between tools. More room to teach, learn, collaborate, and get things done.
          </p>
        </div>

        {/* 4 Feature Cards Grid: 1 col on mobile, 2 cols on tablet, 4 cols on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: ProCollege Teams */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-lg hover:border-[#173bff] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer" onClick={() => launchDemoMode()}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-[#173bff] text-[#173bff] group-hover:text-white flex items-center justify-center mb-3 sm:mb-4 transition-colors duration-300">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-[10px] font-black tracking-wider uppercase text-[#7081a2]">
                COMMUNICATE
              </div>
              <h3 className="font-black text-lg sm:text-[19px] text-[#101b46] mt-1 group-hover:text-[#173bff] transition-colors">
                ProCollege Teams
              </h3>
              <p className="text-[#586680] text-xs sm:text-[13px] leading-relaxed mt-2 sm:mt-2.5">
                Channels and conversations that keep classes, clubs, and departments on the same page.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-zinc-100 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 group-hover:bg-[#173bff] text-[#173bff] group-hover:text-white text-xs font-bold transition-all duration-200 shadow-2xs group-hover:shadow-sm">
                <span>See how it connects</span>
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </span>
            </div>
          </div>

          {/* Card 2: ProCollege Meet */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-lg hover:border-cyan-500 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer" onClick={() => launchDemoMode()}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-50 group-hover:bg-cyan-500 text-cyan-600 group-hover:text-white flex items-center justify-center mb-3 sm:mb-4 transition-colors duration-300">
                <Video className="w-5 h-5" />
              </div>
              <div className="text-[10px] font-black tracking-wider uppercase text-[#7081a2]">
                CONNECT
              </div>
              <h3 className="font-black text-lg sm:text-[19px] text-[#101b46] mt-1 group-hover:text-cyan-600 transition-colors">
                ProCollege Meet
              </h3>
              <p className="text-[#586680] text-xs sm:text-[13px] leading-relaxed mt-2 sm:mt-2.5">
                A welcoming space for virtual lectures, discussion, and participation wherever you are.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-zinc-100 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 group-hover:bg-cyan-600 text-cyan-700 group-hover:text-white text-xs font-bold transition-all duration-200 shadow-2xs group-hover:shadow-sm">
                <span>See how it connects</span>
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </span>
            </div>
          </div>

          {/* Card 3: ProCollege LMS */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-lg hover:border-emerald-500 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer" onClick={() => launchDemoMode()}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center mb-3 sm:mb-4 transition-colors duration-300">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="text-[10px] font-black tracking-wider uppercase text-[#7081a2]">
                TEACH
              </div>
              <h3 className="font-black text-lg sm:text-[19px] text-[#101b46] mt-1 group-hover:text-emerald-600 transition-colors">
                ProCollege LMS
              </h3>
              <p className="text-[#586680] text-xs sm:text-[13px] leading-relaxed mt-2 sm:mt-2.5">
                Bring assignments, feedback, and learning progress into a clearer academic workflow.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-zinc-100 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white text-xs font-bold transition-all duration-200 shadow-2xs group-hover:shadow-sm">
                <span>See how it connects</span>
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </span>
            </div>
          </div>

          {/* Card 4: ProCollege Cloud */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-lg hover:border-purple-500 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer" onClick={() => launchDemoMode()}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 group-hover:bg-purple-600 text-purple-600 group-hover:text-white flex items-center justify-center mb-3 sm:mb-4 transition-colors duration-300">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div className="text-[10px] font-black tracking-wider uppercase text-[#7081a2]">
                ORGANIZE
              </div>
              <h3 className="font-black text-lg sm:text-[19px] text-[#101b46] mt-1 group-hover:text-purple-600 transition-colors">
                ProCollege Cloud
              </h3>
              <p className="text-[#586680] text-xs sm:text-[13px] leading-relaxed mt-2 sm:mt-2.5">
                Give documents, research, and shared resources a place everyone can find.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-zinc-100 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 group-hover:bg-purple-600 text-purple-700 group-hover:text-white text-xs font-bold transition-all duration-200 shadow-2xs group-hover:shadow-sm">
                <span>See how it connects</span>
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. One Seamless Workflow Banner (workflow-panel: #101b46) */}
      <section className="bg-[#101b46] text-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-4xl mx-auto text-center space-y-3 sm:space-y-4">
          {/* Kicker (workflow-kicker) */}
          <div className="text-[#18d6ff] font-black text-[10px] sm:text-[11px] tracking-[0.16em] uppercase">
            ONE SEAMLESS WORKFLOW
          </div>

          {/* Title (workflow-title) */}
          <h2 className="font-fraunces font-bold text-white text-xl sm:text-2xl md:text-3xl lg:text-[34px] leading-snug">
            The whole campus, in conversation.
          </h2>

          {/* Description (workflow-description) */}
          <p className="text-[#c2d1f4] text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            A discussion becomes a class. A class becomes an assignment. Great work stays easy to find.
          </p>

          <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => launchDemoMode()}
              className="btn-hive-cyan bg-gradient-to-r from-[#18d6ff] via-[#48e4ff] to-[#00c5ee] text-[#091538] font-black text-sm sm:text-[15px] px-7 sm:px-8 py-3.5 rounded-full border border-cyan-200/90 shadow-[0_6px_24px_rgba(24,214,255,0.45)] cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>Experience the workflow</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </button>
            <button
              onClick={() => setShowRequestModal(true)}
              className="bg-white/10 hover:bg-white/20 border-2 border-white/40 hover:border-white text-white font-black text-sm sm:text-[15px] px-6 sm:px-7 py-3.5 rounded-full hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 group"
            >
              <Building2 className="w-4 h-4 text-[#18d6ff] group-hover:scale-110 transition-transform duration-300" />
              <span>Contact for Campus Onboarding</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5. Perspectives Section (perspectives-surface: #ffffff) */}
      <section id="perspectives" className="py-12 sm:py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 bg-white">
        <div className="max-w-3xl mb-8 sm:mb-12 lg:mb-14 text-left">
          {/* Kicker (perspectives-kicker) */}
          <div className="text-[#173bff] font-black text-[10px] sm:text-[11px] tracking-[0.16em] uppercase mb-2 sm:mb-3">
            MADE FOR CAMPUS LIFE
          </div>

          {/* Title (perspectives-title) */}
          <h2 className="font-fraunces font-bold text-[#101b46] text-2xl sm:text-3xl lg:text-[40px] leading-tight tracking-tight">
            One experience. Many ways to thrive.
          </h2>

          {/* Description (perspectives-description) */}
          <p className="mt-2.5 sm:mt-4 text-[#586680] text-sm sm:text-base lg:text-[17px] leading-relaxed">
            Imagine a simpler day for everyone who makes a campus work.
          </p>
        </div>

        {/* 3 Perspective Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Student perspective */}
          <div className="bg-white border-2 border-zinc-200/90 hover:border-[#173bff]/50 rounded-2xl p-5 sm:p-7 shadow-xs hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <p className="text-[#273550] text-sm sm:text-[15px] leading-relaxed italic group-hover:text-[#101b46] transition-colors">
              &quot;Lectures, team chats, feedback, and files—without the search across five different tools.&quot;
            </p>
            <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-zinc-100 flex items-center justify-between">
              <div className="text-[#101b46] group-hover:text-[#173bff] font-black text-xs sm:text-[13px] tracking-wide uppercase transition-colors">
                Student perspective
              </div>
              <span className="w-2 h-2 rounded-full bg-[#173bff] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Card 2: Faculty perspective */}
          <div className="bg-white border-2 border-zinc-200/90 hover:border-[#173bff]/50 rounded-2xl p-5 sm:p-7 shadow-xs hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <p className="text-[#273550] text-sm sm:text-[15px] leading-relaxed italic group-hover:text-[#101b46] transition-colors">
              &quot;One calm place to plan a class, support students, and stay connected to colleagues.&quot;
            </p>
            <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-zinc-100 flex items-center justify-between">
              <div className="text-[#101b46] group-hover:text-[#173bff] font-black text-xs sm:text-[13px] tracking-wide uppercase transition-colors">
                Faculty perspective
              </div>
              <span className="w-2 h-2 rounded-full bg-[#173bff] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Card 3: IT perspective */}
          <div className="bg-white border-2 border-zinc-200/90 hover:border-[#173bff]/50 rounded-2xl p-5 sm:p-7 shadow-xs hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <p className="text-[#273550] text-sm sm:text-[15px] leading-relaxed italic group-hover:text-[#101b46] transition-colors">
              &quot;A clearer starting point for bringing people and campus workflows together.&quot;
            </p>
            <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-zinc-100 flex items-center justify-between">
              <div className="text-[#101b46] group-hover:text-[#173bff] font-black text-xs sm:text-[13px] tracking-wide uppercase transition-colors">
                IT perspective
              </div>
              <span className="w-2 h-2 rounded-full bg-[#173bff] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* sample-note */}
        <p className="text-center text-[#71809a] text-[11px] sm:text-[12px] mt-6 sm:mt-8">
          Illustrative perspectives only; these are not customer endorsements.
        </p>
      </section>

      {/* 6. Pricing Section (pricing-surface: #f5f8ff) */}
      <section
        id="pricing"
        className="py-12 sm:py-16 lg:py-24 border-t border-blue-50 px-3 xs:px-4 sm:px-6 lg:px-8 xl:px-12"
        style={{ backgroundColor: '#f5f8ff' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-8 sm:mb-12 lg:mb-14 text-left">
            {/* Kicker (pricing-kicker) */}
            <div className="text-[#173bff] font-black text-[10px] sm:text-[11px] tracking-[0.16em] uppercase mb-2 sm:mb-3">
              CAMPUS PLANS
            </div>

            {/* Title (pricing-title) */}
            <h2 className="font-fraunces font-bold text-[#101b46] text-2xl sm:text-3xl lg:text-[40px] leading-tight tracking-tight">
              Room to grow, at every scale.
            </h2>

            {/* Description (pricing-description) */}
            <p className="mt-2.5 sm:mt-4 text-[#586680] text-sm sm:text-base lg:text-[17px] leading-relaxed">
              Explore example plans for a small team, a connected campus, or an entire institution.
            </p>
          </div>

          {/* 3 Pricing Cards Grid with Interactive Hover Elevations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {/* Tier 1: Starter */}
            <div
              onClick={() => setShowRequestModal(true)}
              className="plan-card bg-white border-2 border-zinc-200/90 hover:border-[#173bff] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-[0_20px_45px_-12px_rgba(23,59,255,0.22)] flex flex-col justify-between transition-all duration-300 ease-out group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-200 group-hover:bg-[#173bff] transition-colors duration-300" />
              <div>
                <h3 className="font-black text-lg sm:text-[20px] text-[#101b46] group-hover:text-[#173bff] transition-colors">
                  Starter
                </h3>
                <div className="mt-3 sm:mt-4 font-black text-2xl sm:text-[34px] text-[#101b46] leading-none">
                  Free
                </div>
                <div className="text-xs sm:text-[13px] text-[#586680] mt-1 sm:mt-1.5">
                  For clubs and small departments
                </div>

                <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-zinc-100 space-y-3 sm:space-y-3.5">
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#44536c]">
                    <div className="w-5 h-5 rounded-full bg-blue-50 group-hover:bg-[#173bff] text-[#173bff] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Up to 100 users</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#44536c]">
                    <div className="w-5 h-5 rounded-full bg-blue-50 group-hover:bg-[#173bff] text-[#173bff] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Core collaboration tools</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#44536c]">
                    <div className="w-5 h-5 rounded-full bg-blue-50 group-hover:bg-[#173bff] text-[#173bff] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Shared workspace</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRequestModal(true);
                  }}
                  className="btn-hive w-full py-3.5 px-6 rounded-full bg-zinc-900 group-hover:bg-[#173bff] text-white text-sm sm:text-[15px] font-black shadow-sm group-hover:shadow-[0_8px_20px_rgba(23,59,255,0.4)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Request Starter Access</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>

            {/* Tier 2: Campus Pro (Featured Plan) */}
            <div
              onClick={() => setShowRequestModal(true)}
              className="plan-card plan-card-featured bg-gradient-to-b from-white via-white to-blue-50/50 border-2 border-[#173bff] hover:border-[#0026e6] ring-4 ring-[#173bff]/15 hover:ring-[#173bff]/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-[0_28px_60px_-10px_rgba(23,59,255,0.38)] flex flex-col justify-between relative transform lg:-translate-y-2 lg:hover:-translate-y-4 transition-all duration-300 ease-out group overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#173bff] via-[#18d6ff] to-[#173bff]" />

              {/* pro-badge */}
              <div className="absolute -top-3.5 left-6 sm:left-8 bg-gradient-to-r from-[#173bff] to-[#0026e6] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md group-hover:shadow-lg transition-all">
                Featured plan
              </div>

              <div>
                <h3 className="font-black text-lg sm:text-[20px] text-[#101b46] group-hover:text-[#173bff] transition-colors">
                  Campus Pro
                </h3>
                <div className="mt-3 sm:mt-4 font-black text-2xl sm:text-[34px] text-[#101b46] group-hover:text-[#173bff] leading-none transition-colors">
                  $6 / student / mo
                </div>
                <div className="text-xs sm:text-[13px] text-[#586680] mt-1 sm:mt-1.5">
                  Illustrative annual pricing
                </div>

                <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-blue-100 space-y-3 sm:space-y-3.5">
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#44536c] font-medium">
                    <div className="w-5 h-5 rounded-full bg-blue-100 group-hover:bg-[#173bff] text-[#173bff] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Full Teams experience</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#44536c] font-medium">
                    <div className="w-5 h-5 rounded-full bg-blue-100 group-hover:bg-[#173bff] text-[#173bff] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Virtual lectures</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#44536c] font-medium">
                    <div className="w-5 h-5 rounded-full bg-blue-100 group-hover:bg-[#173bff] text-[#173bff] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Learning workflows</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#44536c] font-medium">
                    <div className="w-5 h-5 rounded-full bg-blue-100 group-hover:bg-[#173bff] text-[#173bff] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Study assistance</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-blue-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRequestModal(true);
                  }}
                  className="btn-hive w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#173bff] via-[#244cff] to-[#0c2de6] hover:from-[#1236ea] hover:to-[#0822b8] text-white text-sm sm:text-[15px] font-black shadow-[0_8px_24px_rgba(23,59,255,0.45)] hover:shadow-[0_12px_32px_rgba(23,59,255,0.65)] border border-blue-300/40 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Request Campus Access</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>

            {/* Tier 3: Enterprise University */}
            <div
              onClick={() => setShowRequestModal(true)}
              className="plan-card bg-white border-2 border-zinc-200/90 hover:border-[#101b46] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-[0_20px_45px_-12px_rgba(16,27,70,0.22)] flex flex-col justify-between transition-all duration-300 ease-out group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-200 group-hover:bg-[#101b46] transition-colors duration-300" />
              <div>
                <h3 className="font-black text-lg sm:text-[20px] text-[#101b46] group-hover:text-[#173bff] transition-colors">
                  Enterprise University
                </h3>
                <div className="mt-3 sm:mt-4 font-black text-2xl sm:text-[34px] text-[#101b46] leading-none">
                  Custom
                </div>
                <div className="text-xs sm:text-[13px] text-[#586680] mt-1 sm:mt-1.5">
                  For larger institutions
                </div>

                <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-zinc-100 space-y-3 sm:space-y-3.5">
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#44536c]">
                    <div className="w-5 h-5 rounded-full bg-blue-50 group-hover:bg-[#101b46] text-[#173bff] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Multi-campus planning</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#44536c]">
                    <div className="w-5 h-5 rounded-full bg-blue-50 group-hover:bg-[#101b46] text-[#173bff] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Institutional integrations</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#44536c]">
                    <div className="w-5 h-5 rounded-full bg-blue-50 group-hover:bg-[#101b46] text-[#173bff] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Governance considerations</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-[14px] text-[#44536c]">
                    <div className="w-5 h-5 rounded-full bg-blue-50 group-hover:bg-[#101b46] text-[#173bff] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>Dedicated support options</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRequestModal(true);
                  }}
                  className="btn-hive w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#101b46] via-[#1c2e72] to-[#101b46] group-hover:from-[#173bff] group-hover:to-[#0026e6] text-white text-sm sm:text-[15px] font-black shadow-sm group-hover:shadow-[0_8px_24px_rgba(23,59,255,0.4)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Inquire for Institution</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>
          </div>

          {/* pricing-note */}
          <p className="text-center text-[#71809a] text-[11px] sm:text-[12px] mt-6 sm:mt-8">
            Plans and prices shown are illustrative, not a live offer.
          </p>
        </div>
      </section>

      {/* 7. Footer (footer-surface: #101b46) */}
      <footer className="bg-[#101b46] text-[#b9c8e7] py-12 sm:py-16 px-4 sm:px-6 lg:px-8 xl:px-12 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 md:gap-10">
            {/* Brand & Slogan */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2.5">
                <ProCollegeLogo size="md" variant="light-text" />
              </div>
              <div className="text-xs sm:text-[13px] text-[#aab9dc] font-normal pt-1">
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
                className="text-left px-3 py-1 rounded-full bg-white/10 hover:bg-[#18d6ff] text-[#18d6ff] hover:text-[#101b46] font-bold text-xs transition-all cursor-pointer shadow-xs self-start"
              >
                Request Access ↗
              </button>
              <button
                onClick={() => launchDemoMode()}
                className="text-left px-3 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-white font-bold text-xs transition-all cursor-pointer shadow-xs self-start"
              >
                Access Workspace Portal →
              </button>
            </div>
          </div>

          {/* Concept Note & Copyright */}
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-blue-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] sm:text-[12px] text-[#aab9dc]">
            <p className="leading-relaxed">
              Website concept: platform access, purchases, trials, and sales requests are managed via institutional onboarding agreements.
            </p>
            <p className="shrink-0 font-medium">
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
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              orgForm.deploymentType === 'campus-pro'
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
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              orgForm.deploymentType === 'enterprise'
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
                          className="btn-hive w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#173bff] to-[#0c2de6] text-white text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 group"
                        >
                          <span>Submit Deployment Request</span>
                          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
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

      {/* 9. Sign-In & Demo Persona Switcher Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-7 md:p-8 shadow-2xl border border-zinc-200 relative max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <ProCollegeLogo size="sm" variant="dark-text" />
              </div>
              <button
                onClick={() => setShowSignInModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs: Role Sign-In vs Institutional Sign-In */}
            <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-1.5 sm:gap-2 p-1 bg-zinc-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setSignInTab('demo')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center ${
                  signInTab === 'demo'
                    ? 'bg-white text-[#173bff] shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Academic Roles</span>
              </button>

              <button
                type="button"
                onClick={() => setSignInTab('institutional')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center ${
                  signInTab === 'institutional'
                    ? 'bg-white text-[#173bff] shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Key className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Institutional Sign-In</span>
              </button>
            </div>

            {/* TAB 1: ACADEMIC ROLE SIGN-IN (Professor & Students only - Zero Admin in Demo) */}
            {signInTab === 'demo' && (() => {
              const demoPersonas = [
                {
                  roleLabel: 'Professor',
                  badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                  user: availableUsers.find(u => u.role === 'professor') || availableUsers[1]
                },
                {
                  roleLabel: 'Student',
                  badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  user: availableUsers.find(u => u.role === 'student') || availableUsers[2]
                },
                {
                  roleLabel: 'Student',
                  badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
                  user: availableUsers.find(u => u.id === 'user_sophia') || availableUsers.find(u => u.role === 'student' && u.id !== 'user_alex') || availableUsers[2]
                }
              ];

              return (
                <div className="mt-4 sm:mt-5 space-y-3">
                  <div className="text-xs text-[#586680] leading-relaxed">
                    Select your authorized academic persona to sign in directly:
                  </div>

                  <div className="space-y-2.5">
                    {demoPersonas.map((persona, idx) => (
                      <button
                        key={persona.user.id || idx}
                        onClick={() => launchDemoMode(persona.user)}
                        className="w-full p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-zinc-200 hover:border-[#173bff] hover:bg-zinc-50/90 text-left flex items-center justify-between transition-all group cursor-pointer gap-2.5 shadow-xs hover:shadow-md"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={persona.user.avatar}
                            alt=""
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover ring-1 ring-zinc-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-[#101b46] group-hover:text-[#173bff] transition-colors flex items-center gap-2 truncate">
                              <span>{persona.user.name}</span>
                              <span
                                className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${persona.badgeColor}`}
                              >
                                {persona.roleLabel}
                              </span>
                            </div>
                            <div className="text-[10px] sm:text-xs text-[#586680] truncate mt-0.5">
                              {persona.user.department}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#173bff] shrink-0 group-hover:translate-x-1 transition-transform">
                          <span>Sign In</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSignInModal(false);
                        setShowRequestModal(true);
                      }}
                      className="text-xs text-[#173bff] hover:underline font-bold"
                    >
                      Need an account for your university? Request Campus Deployment →
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* TAB 2: INSTITUTIONAL SIGN-IN FORM */}
            {signInTab === 'institutional' && (
              <form onSubmit={handleInstitutionalLogin} className="mt-4 sm:mt-5 space-y-3.5">
                <div className="text-xs text-[#586680] leading-relaxed">
                  Sign in with your official institutional email provided by your College Administrator.
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs sm:text-sm border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#173bff] focus:ring-1 focus:ring-[#173bff]"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-hive w-full py-3.5 rounded-xl bg-gradient-to-r from-[#173bff] via-[#244cff] to-[#0d2ee6] text-white text-xs sm:text-sm font-black shadow-[0_4px_18px_rgba(23,59,255,0.4)] hover:shadow-[0_8px_24px_rgba(23,59,255,0.55)] transition-all flex items-center justify-center gap-2 cursor-pointer group mt-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Sign In to Workspace</span>
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSignInModal(false);
                      setShowRequestModal(true);
                    }}
                    className="text-xs text-[#173bff] hover:underline font-bold"
                  >
                    Need an account for your university? Request Campus Deployment →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
