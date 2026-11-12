import React from 'react';
import { Bell, CheckCheck, Megaphone, AtSign, FileCheck, PhoneCall, Award, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ActivityView: React.FC = () => {
  const { notifications, markNotificationsAsRead, courses, setSelectedCourse, setSelectedChannel, setActiveTab, setChannelTab } = useApp();

  const getIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-purple-600" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-blue-600" />;
      case 'assignment':
        return <FileCheck className="w-4 h-4 text-emerald-600" />;
      case 'grade':
        return <Award className="w-4 h-4 text-amber-600" />;
      case 'revision':
        return <RotateCcw className="w-4 h-4 text-purple-600" />;
      case 'call':
        return <PhoneCall className="w-4 h-4 text-rose-600" />;
      default:
        return <Bell className="w-4 h-4 text-zinc-600" />;
    }
  };

  const handleNotificationClick = (courseCode?: string) => {
    if (!courseCode) return;
    const course = courses.find(c => c.code === courseCode);
    if (course) {
      setSelectedCourse(course);
      setSelectedChannel(course.channels[0]);
      setChannelTab('posts');
      setActiveTab('teams');
    }
  };

  return (
    <div className="flex-1 bg-[#f0f2f5] p-3 sm:p-5 md:p-6 overflow-y-auto select-none">
      <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#5b5fc7] flex items-center justify-center font-bold">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Activity Feed & Alerts</h1>
              <p className="text-xs text-zinc-500">
                Phase 3 Synchronized Alerts: Assignment postings, grade returns, and revision overrides.
              </p>
            </div>
          </div>

          <button
            onClick={markNotificationsAsRead}
            className="flex items-center gap-1.5 text-xs text-[#5b5fc7] hover:text-[#4f52b2] font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs divide-y divide-zinc-100 overflow-hidden">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n.courseCode)}
              className={`p-4 flex items-start gap-3.5 cursor-pointer transition-colors ${
                !n.isRead ? 'bg-indigo-50/40 hover:bg-indigo-50/70' : 'hover:bg-zinc-50'
              }`}
            >
              <div className="relative">
                <img
                  src={n.author?.avatar || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80'}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-zinc-200"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center">
                  {getIcon(n.type)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-xs text-zinc-900">{n.title}</span>
                  <span className="text-[11px] text-zinc-400 font-mono">{n.timestamp}</span>
                </div>
                <p className="text-xs text-zinc-600 line-clamp-2">{n.detail}</p>
                {n.courseCode && (
                  <span className="inline-block mt-1 text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    {n.courseCode}
                  </span>
                )}
              </div>

              {!n.isRead && (
                <div className="w-2 h-2 rounded-full bg-[#5b5fc7] shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
