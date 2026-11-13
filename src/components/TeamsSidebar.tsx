import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Megaphone,
  BookOpen,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { CourseTeam, Channel } from '../types';

export const TeamsSidebar: React.FC = () => {
  const {
    courses,
    faculties,
    selectedCourse,
    setSelectedCourse,
    selectedChannel,
    setSelectedChannel,
    setChannelTab,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    setActiveTab,
    currentUser
  } = useApp();

  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({
    course_cs301: true,
    course_cohort_cs: true,
    course_ds204: true,
    course_phys210: false
  });

  const [filterText, setFilterText] = useState('');
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string>('all');

  const toggleCourse = (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  const handleSelectChannel = (course: CourseTeam, channel: Channel) => {
    setSelectedCourse(course);
    setSelectedChannel(channel);
    setChannelTab('posts');
    setMobileSidebarOpen(false);
  };

  const visibleCourses = courses.filter(c => {
    // 1. Filter by faculty if selected
    if (selectedFacultyFilter !== 'all') {
      const targetFac = faculties.find(f => f.id === selectedFacultyFilter);
      if (targetFac) {
        const directIdMatch = c.facultyId && c.facultyId === targetFac.id;
        const matchName = c.department.toLowerCase() === targetFac.name.toLowerCase();
        const matchCode = c.department.toLowerCase().includes(targetFac.code.toLowerCase());
        const matchInclude = targetFac.name.toLowerCase().includes(c.department.toLowerCase());
        if (!directIdMatch && !matchName && !matchCode && !matchInclude) {
          return false;
        }
      }
    }

    // 2. Filter by search filterText
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q) ||
      c.channels.some(ch => ch.name.toLowerCase().includes(q))
    );
  });

  return (
    <aside className={`w-full md:w-68 bg-[#f5f5f5] border-r border-[#e0e0e0] flex flex-col h-full select-none shrink-0 ${
      mobileSidebarOpen ? 'flex' : 'hidden md:flex'
    }`}>
      {/* Sidebar Header */}
      <div className="p-3 border-b border-[#e5e5e5] flex items-center justify-between">
        <h2 className="font-bold text-xs text-zinc-900 tracking-tight uppercase">
          Your Classes
        </h2>
        <div className="flex items-center gap-1">
          {(currentUser.role === 'admin' || currentUser.role === 'developer') && (
            <button
              onClick={() => setActiveTab('admin')}
              className="p-1 rounded hover:bg-zinc-200/80 text-[#5b5fc7] transition-colors cursor-pointer"
              title="Add Class / Rollover Semester in Admin Center"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            className="p-1 rounded hover:bg-zinc-200/80 text-zinc-600 transition-colors"
            title="Filter courses"
            onClick={() => setFilterText(filterText ? '' : ' ')}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Faculty Department Filter Selector for Classes */}
      {faculties.length > 0 && (
        <div className="px-2.5 py-1.5 border-b border-[#e5e5e5] bg-zinc-50/70">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
            <span>Filter Faculty:</span>
            {selectedFacultyFilter !== 'all' && (
              <button
                onClick={() => setSelectedFacultyFilter('all')}
                className="text-[#5b5fc7] hover:underline cursor-pointer lowercase font-medium"
              >
                show all
              </button>
            )}
          </div>
          <select
            value={selectedFacultyFilter}
            onChange={e => setSelectedFacultyFilter(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[#5b5fc7] cursor-pointer shadow-2xs"
            title="Choose which faculty's classes to view"
          >
            <option value="all">All Faculties ({courses.length} classes)</option>
            {faculties.map(fac => {
              const count = courses.filter(c =>
                (c.facultyId && c.facultyId === fac.id) ||
                c.department.toLowerCase() === fac.name.toLowerCase() ||
                c.department.toLowerCase().includes(fac.code.toLowerCase()) ||
                fac.name.toLowerCase().includes(c.department.toLowerCase())
              ).length;
              return (
                <option key={fac.id} value={fac.id}>
                  {fac.name} ({fac.code}) - {count}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Course filter if activated */}
      {filterText !== '' && (
        <div className="px-3 pt-2">
          <input
            type="text"
            value={filterText.trim()}
            onChange={e => setFilterText(e.target.value)}
            placeholder="Filter classes & channels..."
            className="w-full bg-white border border-zinc-300 rounded px-2 py-1 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#5b5fc7]"
            autoFocus
          />
        </div>
      )}

      {/* Course and Channel List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {visibleCourses.length === 0 ? (
          <div className="p-4 text-center text-zinc-500 text-xs space-y-2">
            <p className="font-semibold text-zinc-700">No classes found</p>
            <p className="text-[11px]">
              {selectedFacultyFilter !== 'all'
                ? 'No classes provisioned in this faculty yet.'
                : 'No classes matched your search filter.'}
            </p>
            {selectedFacultyFilter !== 'all' && (
              <button
                onClick={() => setSelectedFacultyFilter('all')}
                className="text-xs text-[#5b5fc7] hover:underline font-semibold"
              >
                View all faculties
              </button>
            )}
          </div>
        ) : (
          visibleCourses.map(course => {
          const isExpanded = expandedCourses[course.id] ?? true;
          const isCourseActive = selectedCourse?.id === course.id;

          return (
            <div key={course.id} className="rounded-lg transition-colors">
              {/* Course Header Tile */}
              <div
                onClick={() => {
                  setSelectedCourse(course);
                  if (course.channels.length > 0) {
                    setSelectedChannel(course.channels[0]);
                  }
                }}
                className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                  isCourseActive ? 'bg-zinc-200/80 font-semibold' : 'hover:bg-zinc-200/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={e => toggleCourse(course.id, e)}
                    className="p-0.5 text-zinc-500 hover:text-zinc-800 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: course.color }}
                  >
                    {course.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-zinc-900 truncate font-bold leading-tight">{course.code}</p>
                      {course.department && (
                        <span className="text-[9px] font-mono font-semibold px-1 py-0.5 rounded bg-zinc-200/80 text-zinc-700 truncate max-w-[70px]" title={course.department}>
                          {course.department}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 truncate">{course.name}</p>
                  </div>
                </div>
              </div>

              {/* Channels List Under Course */}
              {isExpanded && (() => {
                const announcementChannel =
                  course.channels.find(c => c.isGeneral || c.name.toLowerCase().includes('announce')) ||
                  course.channels[0];
                const subjectChannels = course.channels.filter(c => c.id !== announcementChannel?.id);

                return (
                  <div className="ml-5 pl-2 border-l-2 border-zinc-300/60 my-1 space-y-1">
                    {/* Default Section: Announcements (Not a class, it is announcement noticeboard where all lecturers send notice) */}
                    {announcementChannel && (
                      <button
                        onClick={() => handleSelectChannel(course, announcementChannel)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left text-xs transition-colors ${
                          selectedCourse?.id === course.id && selectedChannel?.id === announcementChannel.id
                            ? 'bg-white text-[#5b5fc7] font-bold shadow-xs border border-zinc-200/80'
                            : 'text-zinc-800 hover:bg-zinc-200/60 font-semibold'
                        }`}
                        title="Class Announcements: Noticeboard where all lecturers broadcast notices and updates"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Megaphone className="w-3.5 h-3.5 shrink-0 text-[#5b5fc7]" />
                          <span className="truncate">{announcementChannel.name}</span>
                        </div>

                        {Boolean(announcementChannel.unreadCount && announcementChannel.unreadCount > 0) && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#c4314b] text-white rounded-full">
                            {announcementChannel.unreadCount}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Academic Subjects List */}
                    {subjectChannels.length > 0 && (
                      <div className="pt-1">
                        <div className="px-2 py-0.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          <span>Subjects</span>
                          <span className="text-[9px] font-mono text-zinc-400">({subjectChannels.length})</span>
                        </div>

                        <div className="space-y-0.5 mt-0.5">
                          {subjectChannels.map(channel => {
                            const isChannelActive =
                              selectedCourse?.id === course.id && selectedChannel?.id === channel.id;

                            return (
                              <button
                                key={channel.id}
                                onClick={() => handleSelectChannel(course, channel)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left text-xs transition-colors ${
                                  isChannelActive
                                    ? 'bg-white text-[#5b5fc7] font-bold shadow-xs border border-zinc-200/80'
                                    : 'text-zinc-700 hover:bg-zinc-200/60'
                                }`}
                                title={
                                  channel.subjectLecturerName
                                    ? `${channel.name} (Lecturer: ${channel.subjectLecturerName})`
                                    : channel.name
                                }
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <BookOpen className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                                  <span className="truncate">{channel.name}</span>
                                </div>

                                {Boolean(channel.unreadCount && channel.unreadCount > 0) && (
                                  <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#c4314b] text-white rounded-full">
                                    {channel.unreadCount}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        }))}
      </div>

      {/* Admin Quick Action Bar at bottom - Only visible to Admin / Developer */}
      {(currentUser.role === 'admin' || currentUser.role === 'developer') && (
        <div className="p-2 border-t border-[#e0e0e0] bg-[#ebebeb]">
          <button
            onClick={() => setActiveTab('admin')}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-zinc-100 text-[#5b5fc7] border border-zinc-300 rounded text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Open Admin Center: Add Classes, Assign Teachers to Subjects, or Rollover Semester"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Class / Rollover</span>
          </button>
        </div>
      )}
    </aside>
  );
};
