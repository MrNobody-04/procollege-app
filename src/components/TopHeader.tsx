import React, { useState, useRef, useMemo } from 'react';
import {
  Search,
  Video,
  Grid,
  GraduationCap,
  FileCheck,
  Calendar,
  FolderOpen,
  Camera,
  LogOut,
  Check,
  ChevronRight,
  UserCheck,
  Shield,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProCollegeLogo } from './ProCollegeLogo';
import type { PresenceStatus } from '../types';

export const TopHeader: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    availableUsers,
    startMeeting,
    searchQuery,
    setSearchQuery,
    selectedCourse,
    activeTab,
    setActiveTab,
    setViewMode,
    updateUserPresence,
    updateUserAvatar,
    logoutUser,
    isDemoMode,
    showDialog
  } = useApp();

  const [showWaffle, setShowWaffle] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showSwitchAccounts, setShowSwitchAccounts] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const DEMO_PERSONAS = [
    {
      id: 'usr-student-01',
      name: 'Sujan G.C.',
      email: 'sujan@padmashree.edu.np',
      role: 'student' as const,
      badge: '🎓 Student • Sem 5 - Sec A',
      department: 'Department of BIT',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    },
    {
      id: 'usr-teacher-01',
      name: 'Er. Ramesh Sharma',
      email: 'teacher@padmashree.edu.np',
      role: 'professor' as const,
      badge: '👨‍🏫 Teacher • Dept of BIT',
      department: 'Department of BIT',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
    },
    {
      id: 'usr-admin-01',
      name: 'Academic Dean',
      email: 'dean@padmashree.edu.np',
      role: 'admin' as const,
      badge: '🏛️ Academic Dean • Admin',
      department: 'Administration',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    },
  ];

  const currentBadge = useMemo(() => {
    if (currentUser.role === 'admin') return '🏛️ Academic Dean • Admin';
    if (
      currentUser.role === 'professor' ||
      currentUser.role === 'lecturer' ||
      (currentUser as unknown as { role: string }).role === 'teacher'
    ) {
      return '👨‍🏫 Teacher • Dept of BIT';
    }
    if (currentUser.role === 'developer') return '⚡ Developer • Root';
    return '🎓 Student • Sem 5 - Sec A';
  }, [currentUser.role]);

  const handleSwitchPersona = (p: (typeof DEMO_PERSONAS)[0]) => {
    const newUser: typeof currentUser = {
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role,
      license:
        p.role === 'student'
          ? 'Microsoft 365 A5 for Students'
          : 'Microsoft 365 A5 for Faculty',
      department: p.department,
      institutionName: 'Padmashree College',
      avatar: p.avatar,
      status: 'available',
    };

    localStorage.setItem(
      'procollege_user',
      JSON.stringify({
        id: p.id,
        email: p.email,
        name: p.name,
        full_name: p.name,
        role: p.role === 'professor' ? 'teacher' : p.role,
        college_id: 'padmashree-demo',
        avatar_url: p.avatar,
      })
    );

    setCurrentUser(newUser);
    setShowRoleDropdown(false);
    if (p.role === 'student' && activeTab === 'admin') {
      setActiveTab('teams');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status mapping
  const statusConfig: Record<PresenceStatus, { label: string; dotClass: string; desc: string }> = {
    available: { label: 'Available', dotClass: 'bg-emerald-500', desc: 'Online and active' },
    busy: { label: 'Busy', dotClass: 'bg-rose-500', desc: 'In a class or meeting' },
    dnd: { label: 'Do not disturb', dotClass: 'bg-rose-600', desc: 'Only urgent notifications' },
    away: { label: 'Away', dotClass: 'bg-amber-500', desc: 'Be right back' },
    offline: { label: 'Appear offline', dotClass: 'bg-zinc-400', desc: 'Not active' },
    'in-call': { label: 'In a call', dotClass: 'bg-rose-500', desc: 'In a video meeting' }
  };

  // Filter switcher accounts to exactly 3 accounts, never showing admin in demo
  const switchableUsers = useMemo(() => {
    if (isDemoMode) {
      // In Demo Mode: strictly non-admin personas only (1 professor, 2 students), never admin
      const nonAdmins = availableUsers.filter(u => u.role !== 'admin' && u.role !== 'developer');
      const unique = [currentUser, ...nonAdmins.filter(u => u.id !== currentUser.id)];
      return unique.slice(0, 3);
    }
    if (currentUser.role === 'developer') {
      const adminUser = availableUsers.find(u => u.role === 'admin');
      const profUser = availableUsers.find(u => u.role === 'professor');
      return [currentUser, adminUser, profUser].filter((u): u is typeof currentUser => Boolean(u)).slice(0, 3);
    }
    if (currentUser.role === 'admin') {
      const profUser = availableUsers.find(u => u.role === 'professor');
      const studentUser = availableUsers.find(u => u.role === 'student');
      return [currentUser, profUser, studentUser].filter((u): u is typeof currentUser => Boolean(u)).slice(0, 3);
    }
    // Normal institutional user (professor / lecturer / student)
    // Never show admin or developer to normal students/lecturers
    const nonAdminPool = availableUsers.filter(u => u.role !== 'admin' && u.role !== 'developer');
    const list = [currentUser, ...nonAdminPool.filter(u => u.id !== currentUser.id)];
    return list.slice(0, 3);
  }, [availableUsers, currentUser, isDemoMode]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showDialog('Please select an image file (PNG, JPG, WebP).', { type: 'warning', title: 'Invalid File Format' });
        return;
      }
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target?.result) {
          updateUserAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <header className="h-12 bg-[#2b2b2b] text-white flex items-center justify-between px-3 sm:px-4 border-b border-zinc-800 z-30 shrink-0 select-none relative">
      {/* Brand & 9-Dot App Launcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Microsoft 365 9-Dot App Launcher */}
        <div className="relative">
          <button
            onClick={() => setShowWaffle(!showWaffle)}
            className={`p-1.5 rounded-md hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center justify-center ${
              showWaffle ? 'bg-zinc-800 text-white' : ''
            }`}
            title="Microsoft 365 Apps"
          >
            <Grid className="w-4 h-4" />
          </button>

          {showWaffle && (
            <div
              className="absolute left-0 top-12 w-64 bg-white text-zinc-900 rounded-xl shadow-xl border border-zinc-200 p-3 z-50 animate-in fade-in"
              onMouseLeave={() => setShowWaffle(false)}
            >
              <div className="pb-2 mb-2 border-b border-zinc-100">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                  Apps
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => {
                    setActiveTab('teams');
                    setShowWaffle(false);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-100 transition-colors text-left"
                >
                  <GraduationCap className="w-4 h-4 text-[#5b5fc7]" />
                  <span className="font-medium text-zinc-800">Class</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('assignments');
                    setShowWaffle(false);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-100 transition-colors text-left"
                >
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-zinc-800">Assignments</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('calendar');
                    setShowWaffle(false);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-100 transition-colors text-left"
                >
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-zinc-800">Calendar</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('files');
                    setShowWaffle(false);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-100 transition-colors text-left"
                >
                  <FolderOpen className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-zinc-800">Files</span>
                </button>

                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      setActiveTab('admin');
                      setShowWaffle(false);
                    }}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-100 transition-colors text-left"
                  >
                    <Shield className="w-4 h-4 text-[#5b5fc7]" />
                    <span className="font-medium text-zinc-800">Admin Center</span>
                  </button>
                )}
              </div>

              <div className="pt-2 mt-2 border-t border-zinc-100">
                <button
                  onClick={() => {
                    setViewMode('portal');
                    setShowWaffle(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 text-[#173bff] transition-colors text-xs font-semibold"
                >
                  <span>ProCollege Website & About</span>
                  <span>↗</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* App Logo */}
        <div
          onClick={() => setActiveTab('teams')}
          className="flex items-center cursor-pointer group"
          title="ProCollege Campus System"
        >
          <div className="h-8 sm:h-8.5 px-2.5 py-1 flex items-center transition-colors">
            <ProCollegeLogo size="sm" variant="light-text" />
          </div>
        </div>

        {/* Institution Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[11px] font-medium border border-zinc-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="truncate max-w-[130px]">{currentUser.institutionName || 'Padmashree College'}</span>
        </div>

        {/* Website & About Link */}
        <button
          onClick={() => setViewMode('portal')}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded border border-zinc-700 transition-colors ml-1 cursor-pointer"
          title="View ProCollege Website, About Us & Institutional Access"
        >
          <span>Website & About</span>
          <span className="text-[10px] text-zinc-400">↗</span>
        </button>

        {/* Admin Center Shortcut - Only visible to Admin */}
        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-white bg-[#5b5fc7] hover:bg-[#4f52b2] rounded transition-colors ml-1 cursor-pointer shadow-2xs"
            title="Open Campus Administration & Class Management"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Center</span>
          </button>
        )}
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-xl mx-2 sm:mx-4">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search across ${selectedCourse ? selectedCourse.code : 'courses'}, assignments, messages (Ctrl+E)`}
            className="w-full bg-[#1e1e1e] hover:bg-[#181818] focus:bg-[#181818] text-xs text-zinc-200 placeholder-zinc-500 rounded-md pl-9 pr-8 py-1.5 border border-zinc-700/60 focus:border-[#5b5fc7] focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-xs text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Actions: Meet Now & Clean User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dynamic Role Badge & 1-Click Demo Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-all cursor-pointer shadow-xs"
            title="Click to Switch Demo Persona (Student, Teacher, Admin)"
          >
            <span>{currentBadge}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {showRoleDropdown && (
            <div
              className="absolute right-0 top-10 w-72 bg-white text-zinc-900 rounded-xl shadow-2xl border border-zinc-200 p-3 z-50 animate-in fade-in select-none text-xs"
              onMouseLeave={() => setShowRoleDropdown(false)}
            >
              <div className="pb-2 mb-2 border-b border-zinc-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">
                  Switch Demo Persona
                </span>
                <span className="text-[10px] text-[#5b5fc7] font-semibold">1-Click Live</span>
              </div>
              <div className="space-y-1.5">
                {DEMO_PERSONAS.map(p => {
                  const isSelected = currentUser.email.toLowerCase() === p.email.toLowerCase();
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSwitchPersona(p)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 border border-indigo-200 shadow-2xs font-bold text-indigo-950'
                          : 'hover:bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={p.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate">{p.name}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{p.badge}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#5b5fc7] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() =>
            startMeeting(
              `${selectedCourse?.code || 'ProCollege'} Virtual Classroom`,
              selectedCourse?.code
            )
          }
          className="flex items-center gap-1.5 bg-[#5b5fc7] hover:bg-[#4f52b2] text-white px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
          title="Start meeting"
        >
          <Video className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Meet</span>
        </button>

        {/* Clean Microsoft Teams User Profile with Presence Status Indicator */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="relative flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-zinc-600 transition-all focus:outline-none cursor-pointer"
            title={`${currentUser.name} (${statusConfig[currentUser.status]?.label || 'Available'})`}
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover"
            />
            {/* Status dot badge */}
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#2b2b2b] ${
                statusConfig[currentUser.status]?.dotClass || 'bg-emerald-500'
              }`}
            />
          </button>

          {/* Profile Menu Popover */}
          {showProfile && (
            <div
              className="absolute right-0 top-10 w-80 bg-white text-zinc-900 rounded-xl shadow-2xl border border-zinc-200 p-4 z-50 animate-in fade-in select-none text-xs"
              onMouseLeave={() => {
                setShowProfile(false);
                setShowStatusMenu(false);
                setShowSwitchAccounts(false);
              }}
            >
              {/* Profile Card Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
                <div className="relative group/avatar shrink-0">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-full object-cover ring-1 ring-zinc-200"
                  />
                  {/* Presence indicator on large avatar */}
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${
                      statusConfig[currentUser.status]?.dotClass || 'bg-emerald-500'
                    }`}
                  />
                  {/* Upload Avatar Overlay Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/50 text-white opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                    title="Upload new profile picture"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-zinc-900 truncate">{currentUser.name}</h4>
                  <p className="text-[11px] text-zinc-500 truncate">{currentUser.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded capitalize">
                      {currentUser.role}
                    </span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] text-[#5b5fc7] hover:underline"
                    >
                      Change photo
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Picker Section (Available, Busy, DND, Away, Offline) */}
              <div className="py-2 border-b border-zinc-100">
                <div className="flex items-center justify-between text-xs text-zinc-600 mb-1">
                  <span className="font-medium text-zinc-500">Status</span>
                  <button
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    className="text-[#5b5fc7] hover:underline text-[11px] font-semibold"
                  >
                    {showStatusMenu ? 'Close' : 'Change status'}
                  </button>
                </div>

                {/* Current Active Status */}
                <div
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors border border-zinc-100"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        statusConfig[currentUser.status]?.dotClass || 'bg-emerald-500'
                      }`}
                    />
                    <span className="font-semibold text-zinc-800">
                      {statusConfig[currentUser.status]?.label || 'Available'}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </div>

                {/* Status Options Dropdown */}
                {showStatusMenu && (
                  <div className="mt-1.5 p-1 bg-zinc-50 rounded-lg border border-zinc-200 space-y-0.5 animate-in fade-in">
                    {(['available', 'busy', 'dnd', 'away', 'offline'] as PresenceStatus[]).map(st => {
                      const cfg = statusConfig[st];
                      const isSelected = currentUser.status === st;
                      return (
                        <button
                          key={st}
                          onClick={() => {
                            updateUserPresence(st);
                            setShowStatusMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors cursor-pointer ${
                            isSelected ? 'bg-white font-semibold text-zinc-900 shadow-2xs' : 'hover:bg-zinc-200/60 text-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotClass}`} />
                            <span>{cfg.label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#5b5fc7]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Switch Accounts Section */}
              <div className="py-2 border-b border-zinc-100">
                <button
                  onClick={() => setShowSwitchAccounts(!showSwitchAccounts)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 transition-colors text-zinc-700 font-medium"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-zinc-500" />
                    <span>Switch account</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {switchableUsers.length} accounts
                  </span>
                </button>

                {showSwitchAccounts && (
                  <div className="mt-1 space-y-1 p-1 bg-zinc-50 rounded-lg border border-zinc-200 animate-in fade-in">
                    {switchableUsers.map((user: (typeof availableUsers)[number]) => {
                      const isCurrent = user.id === currentUser.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            setCurrentUser(user);
                            setShowSwitchAccounts(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded text-left transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-white border border-[#5b5fc7]/30 shadow-2xs'
                              : 'hover:bg-zinc-200/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={user.avatar}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-zinc-800 text-[11px] truncate">
                                {user.name}
                              </p>
                              <p className="text-[10px] text-zinc-400 truncate capitalize">
                                {user.role} • {user.department}
                              </p>
                            </div>
                          </div>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-[#5b5fc7] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sign Out / Logout Option */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowProfile(false);
                    logoutUser();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-rose-50 text-rose-700 transition-colors font-medium cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
