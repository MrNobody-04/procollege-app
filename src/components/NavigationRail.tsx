import React from 'react';
import {
  Bell,
  MessageSquare,
  GraduationCap,
  FileCheck,
  Calendar,
  FolderOpen,
  Shield,
  Globe,
  Building2,
  CreditCard,
  Database
} from 'lucide-react';
import { useApp, type ActiveTab } from '../context/AppContext';
import { ProCollegeLogo } from './ProCollegeLogo';

export const NavigationRail: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    notifications,
    conversations,
    currentUser
  } = useApp();

  const isPlatformDev = currentUser.role === 'developer' || currentUser.role === 'platform_admin';

  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  const unreadChats = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Dedicated Developer Sidebar (strictly isolates platform tools and hides student/teacher items)
  const devNavItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dev-overview', label: 'Overview', icon: <Globe className="w-5 h-5" /> },
    { id: 'dev-organizations', label: 'Organizations', icon: <Building2 className="w-5 h-5" /> },
    { id: 'dev-billing', label: 'Subscriptions', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'dev-system', label: 'Backups', icon: <Database className="w-5 h-5" /> },
  ];

  // Standard Academic Sidebar for Students, Lecturers, Deans, Campus Admins
  const standardNavItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'activity', label: 'Activity', icon: <Bell className="w-5 h-5" />, badge: unreadNotifications },
    { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-5 h-5" />, badge: unreadChats },
    { id: 'teams', label: 'Class', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'assignments', label: 'Assignments', icon: <FileCheck className="w-5 h-5" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-5 h-5" /> },
    { id: 'files', label: 'Files', icon: <FolderOpen className="w-5 h-5" /> },
    ...(currentUser.role === 'admin'
      ? [{ id: 'admin' as ActiveTab, label: 'Admin', icon: <Shield className="w-5 h-5" /> }]
      : [])
  ];

  const navItems = isPlatformDev ? devNavItems : standardNavItems;

  return (
    <aside className="w-14 sm:w-16 md:w-18 bg-[#201f1e] text-zinc-300 flex flex-col items-center py-2 sm:py-2.5 select-none z-20 shrink-0 border-r border-zinc-800">
      {/* College Logo */}
      <div
        className="mb-2 sm:mb-3 flex flex-col items-center cursor-pointer group"
        onClick={() => setActiveTab(isPlatformDev ? 'dev-overview' : 'teams')}
        title="ProCollege"
      >
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs border border-zinc-700/50 group-hover:ring-2 group-hover:ring-[#5b5fc7] transition-all">
          <ProCollegeLogo size="sm" variant="mark-only" />
        </div>
      </div>

      {/* Main Navigation Items */}
      <nav className="flex-1 flex flex-col gap-0.5 sm:gap-1 w-full px-0.5 sm:px-1">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 sm:py-2 px-0.5 sm:px-1 rounded-lg w-full transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 sm:top-2 sm:bottom-2 w-1 bg-[#5b5fc7] rounded-r" />
              )}
              <div className="relative [&_svg]:w-4.5 [&_svg]:h-4.5 sm:[&_svg]:w-5 sm:[&_svg]:h-5">
                {item.icon}
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-3.5 text-[9px] font-bold bg-[#c4314b] text-white rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] sm:text-[10px] mt-1 tracking-tight leading-none text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* User Avatar */}
      <div className="pt-2 border-t border-zinc-800 w-full flex flex-col items-center">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-zinc-700"
        />
      </div>
    </aside>
  );
};
