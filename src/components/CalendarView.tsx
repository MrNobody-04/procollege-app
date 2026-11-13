import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Video,
  MapPin,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Filter,
  FileCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Users
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { CalendarEvent, Assignment } from '../types';

export const CalendarView: React.FC = () => {
  const {
    calendarEvents,
    addCalendarEvent,
    startMeeting,
    courses,
    assignments,
    setActiveTab,
    availableUsers,
    currentUser
  } = useApp();

  // Calendar State
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // 0-indexed: 10 = November
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedDay, setSelectedDay] = useState<number>(16); // Day of month (Nov 16, 2026)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'deadlines'>('month');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCourseCode, setNewEventCourseCode] = useState('CS 301');
  const [newEventInstructor, setNewEventInstructor] = useState('Prof. Alan Turing');
  const [newEventDayNum, setNewEventDayNum] = useState<number>(16);
  const [newEventStartTime, setNewEventStartTime] = useState('10:00 AM');
  const [newEventEndTime, setNewEventEndTime] = useState('11:30 AM');
  const [newEventLocation, setNewEventLocation] = useState('Turing Hall 101');
  const [newEventIsVirtual, setNewEventIsVirtual] = useState(true);

  // Parse assignment release and due dates
  const assignmentDatesMap = useMemo(() => {
    const dueMap: Record<number, Assignment[]> = {};
    const releaseMap: Record<number, Assignment[]> = {};

    assignments.forEach(asg => {
      // Due Date parse: match "Nov (\d+)"
      const dueMatch = asg.dueAt.match(/Nov\s+(\d+)/i);
      if (dueMatch) {
        const dayNum = parseInt(dueMatch[1], 10);
        if (!dueMap[dayNum]) dueMap[dayNum] = [];
        dueMap[dayNum].push(asg);
      }

      // Released Date:
      let relDayNum: number | null = null;
      if (asg.id === 'asg_1') relDayNum = 13;
      else if (asg.id === 'asg_2') relDayNum = 10;
      else if (asg.id === 'asg_3') relDayNum = 5;
      else if (asg.id === 'asg_4') relDayNum = 14;
      else if (asg.scheduleDate) {
        const relMatch = asg.scheduleDate.match(/Nov\s+(\d+)/i);
        if (relMatch) relDayNum = parseInt(relMatch[1], 10);
      } else {
        relDayNum = 12;
      }

      if (relDayNum) {
        if (!releaseMap[relDayNum]) releaseMap[relDayNum] = [];
        releaseMap[relDayNum].push(asg);
      }
    });

    return { dueMap, releaseMap };
  }, [assignments]);

  // Parse lecture event dates
  const eventsByDayMap = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    calendarEvents.forEach(evt => {
      let dayNum: number | null = null;
      const match = evt.dateStr?.match(/Nov\s+(\d+)/i);
      if (match) {
        dayNum = parseInt(match[1], 10);
      } else if (evt.day === 'Mon') dayNum = 16;
      else if (evt.day === 'Tue') dayNum = 17;
      else if (evt.day === 'Wed') dayNum = 18;
      else if (evt.day === 'Thu') dayNum = 19;
      else if (evt.day === 'Fri') dayNum = 20;

      if (dayNum) {
        if (!map[dayNum]) map[dayNum] = [];
        map[dayNum].push(evt);
      }
    });
    return map;
  }, [calendarEvents]);

  // November 2026 starts on Sunday (day 0) and has 30 days
  const monthDaysCount = 30;
  const startDayOfWeek = 0; // Sunday

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleToday = () => {
    setSelectedMonth(10);
    setSelectedYear(2026);
    setSelectedDay(16);
  };

  // Filtered lists for the selected day
  const selectedDayReleases = useMemo(() => {
    const list = assignmentDatesMap.releaseMap[selectedDay] || [];
    return list.filter(a => courseFilter === 'all' || a.courseCode === courseFilter);
  }, [assignmentDatesMap, selectedDay, courseFilter]);

  const selectedDayDues = useMemo(() => {
    const list = assignmentDatesMap.dueMap[selectedDay] || [];
    return list.filter(a => courseFilter === 'all' || a.courseCode === courseFilter);
  }, [assignmentDatesMap, selectedDay, courseFilter]);

  const selectedDayEvents = useMemo(() => {
    const list = eventsByDayMap[selectedDay] || [];
    return list.filter(e => courseFilter === 'all' || e.courseCode === courseFilter);
  }, [eventsByDayMap, selectedDay, courseFilter]);

  // Week schedule days (Monday Nov 16 to Friday Nov 20)
  const weekDays = [
    { dayName: 'Monday', short: 'Mon', dayNum: 16 },
    { dayName: 'Tuesday', short: 'Tue', dayNum: 17 },
    { dayName: 'Wednesday', short: 'Wed', dayNum: 18 },
    { dayName: 'Thursday', short: 'Thu', dayNum: 19 },
    { dayName: 'Friday', short: 'Fri', dayNum: 20 }
  ];

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    addCalendarEvent({
      courseCode: newEventCourseCode,
      title: newEventTitle.trim(),
      instructorName: newEventInstructor,
      day: 'Mon',
      dateStr: `Nov ${newEventDayNum}`,
      startTime: newEventStartTime,
      endTime: newEventEndTime,
      location: newEventLocation,
      isVirtual: newEventIsVirtual,
      meetingLink: newEventIsVirtual ? `procollege://meet/${newEventTitle.toLowerCase().replace(/\s+/g, '-')}` : undefined
    });

    setShowScheduleModal(false);
    setNewEventTitle('');
  };

  // Get day of week name for selected day
  const getSelectedDayLabel = () => {
    // Nov 1, 2026 was Sunday.
    const dayOfWeekIdx = (startDayOfWeek + (selectedDay - 1)) % 7;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${days[dayOfWeekIdx]}, November ${selectedDay}, 2026`;
  };

  return (
    <div className="flex-1 bg-[#f8f9fc] p-3 sm:p-5 md:p-6 overflow-y-auto select-none">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* 1. Elevated Clean Header */}
        <div className="bg-white rounded-xl border border-zinc-200/90 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-[#26394D] flex items-center justify-center font-bold shadow-2xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-zinc-900 tracking-tight">
                  Academic Calendar
                </h1>
                <span className="text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-full">
                  Fall Term 2026
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Master schedule of lectures, subject timetables, assignment releases, and deadlines.
              </p>
            </div>
          </div>

          {/* View Mode Switcher & Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'month' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'hover:text-zinc-900'
                }`}
              >
                Month Grid
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'week' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'hover:text-zinc-900'
                }`}
              >
                Weekly Timetable
              </button>
              <button
                onClick={() => setViewMode('deadlines')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'deadlines' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'hover:text-zinc-900'
                }`}
              >
                Deadlines
              </button>
            </div>

            <button
              onClick={() => startMeeting('Ad-Hoc Academic Consultation', 'CS 301')}
              className="flex items-center gap-1.5 bg-white hover:bg-zinc-50 text-[#26394D] border border-indigo-200 text-xs font-semibold px-3 py-2 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Start an instant ad-hoc study room"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Meet Now</span>
            </button>

            {(currentUser.role === 'professor' || currentUser.role === 'lecturer' || currentUser.role === 'admin') && (
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center gap-1.5 bg-[#26394D] hover:bg-[#141E2B] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Class</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Month Navigation & Course Filter Bar */}
        <div className="bg-white rounded-xl border border-zinc-200/90 p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg border border-zinc-200 transition-colors cursor-pointer"
            >
              Today
            </button>

            <div className="flex items-center bg-zinc-50 rounded-lg border border-zinc-200 px-1 py-0.5 text-xs text-zinc-700">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-white rounded text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-bold text-zinc-900 min-w-36 text-center">
                {monthNames[selectedMonth]} {selectedYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-white rounded text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Clear, Minimal Legend */}
            <div className="hidden sm:flex items-center gap-3 text-xs font-medium ml-2">
              <span className="flex items-center gap-1.5 text-zinc-700">
                <span className="w-2 h-2 rounded-full bg-[#26394D]" />
                Lectures
              </span>
              <span className="flex items-center gap-1.5 text-zinc-700">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Deadlines
              </span>
              <span className="flex items-center gap-1.5 text-zinc-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Assigned
              </span>
            </div>
          </div>

          {/* Filter by Course */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className="bg-zinc-50 hover:bg-white border border-zinc-300 rounded-lg px-2.5 py-1 text-xs text-zinc-800 font-medium focus:outline-none focus:border-[#26394D] cursor-pointer"
            >
              <option value="all">All Classes ({courses.length})</option>
              {courses.map(c => (
                <option key={c.id} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: MONTH CALENDAR GRID + SELECTED DAY AGENDA         */}
        {/* ========================================================= */}
        {viewMode === 'month' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* 30-Day Grid (8 cols on lg) */}
            <div className="lg:col-span-8 bg-white rounded-xl border border-zinc-200/90 shadow-xs overflow-hidden">
              {/* Day of Week Header */}
              <div className="grid grid-cols-7 bg-zinc-50 border-b border-zinc-200 text-center text-[11px] font-bold text-zinc-500 py-2.5">
                <span>SUN</span>
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
                <span>FRI</span>
                <span>SAT</span>
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-zinc-100">
                {/* Empty cells before month start */}
                {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="bg-zinc-50/40 min-h-[100px] p-2 opacity-30" />
                ))}

                {/* Days of November (1 - 30) */}
                {Array.from({ length: monthDaysCount }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const isSelected = selectedDay === dayNum;
                  const isToday = dayNum === 16;
                  const isWeekend = (startDayOfWeek + idx) % 7 === 0 || (startDayOfWeek + idx) % 7 === 6;

                  const dues = (assignmentDatesMap.dueMap[dayNum] || []).filter(
                    a => courseFilter === 'all' || a.courseCode === courseFilter
                  );
                  const releases = (assignmentDatesMap.releaseMap[dayNum] || []).filter(
                    a => courseFilter === 'all' || a.courseCode === courseFilter
                  );
                  const events = (eventsByDayMap[dayNum] || []).filter(
                    e => courseFilter === 'all' || e.courseCode === courseFilter
                  );

                  const totalCount = dues.length + releases.length + events.length;

                  return (
                    <div
                      key={dayNum}
                      onClick={() => setSelectedDay(dayNum)}
                      className={`min-h-[105px] p-2 transition-all cursor-pointer flex flex-col justify-between group ${
                        isSelected
                          ? 'bg-indigo-50/40 ring-2 ring-inset ring-[#26394D]'
                          : isToday
                          ? 'bg-amber-50/30 hover:bg-zinc-50'
                          : isWeekend
                          ? 'bg-zinc-50/40 hover:bg-zinc-50'
                          : 'bg-white hover:bg-zinc-50/80'
                      }`}
                    >
                      {/* Top: Day Number */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isToday
                              ? 'bg-[#26394D] text-white shadow-xs'
                              : isSelected
                              ? 'bg-indigo-100 text-[#26394D]'
                              : 'text-zinc-700 group-hover:text-zinc-900'
                          }`}
                        >
                          {dayNum}
                        </span>

                        {isToday && (
                          <span className="text-[9px] font-bold text-[#26394D] uppercase tracking-wider">
                            Today
                          </span>
                        )}
                      </div>

                      {/* Event Chips (Clean, readable, styled without clumsy ellipsis cuts) */}
                      <div className="space-y-1 flex-1 overflow-hidden">
                        {/* 1. Dues (Top Priority) */}
                        {dues.slice(0, 1).map(asg => (
                          <div
                            key={asg.id}
                            className="bg-rose-50 border-l-2 border-rose-500 text-rose-900 rounded-r px-1.5 py-0.5 text-[10px] font-semibold truncate flex items-center gap-1"
                            title={`Due: ${asg.title} (${asg.courseCode})`}
                          >
                            <span className="truncate">Due: {asg.title}</span>
                          </div>
                        ))}

                        {/* 2. Lectures */}
                        {events.slice(0, 2).map(evt => (
                          <div
                            key={evt.id}
                            className="bg-indigo-50/90 border-l-2 border-[#26394D] text-indigo-950 rounded-r px-1.5 py-0.5 text-[10px] font-semibold truncate flex items-center gap-1"
                            title={`${evt.startTime} • ${evt.courseCode}: ${evt.title}`}
                          >
                            <span className="truncate">{evt.courseCode}: {evt.title}</span>
                          </div>
                        ))}

                        {/* 3. Releases */}
                        {releases.slice(0, 1).map(asg => (
                          <div
                            key={`rel-${asg.id}`}
                            className="bg-emerald-50 border-l-2 border-emerald-500 text-emerald-900 rounded-r px-1.5 py-0.5 text-[10px] font-semibold truncate"
                            title={`Assigned: ${asg.title}`}
                          >
                            <span className="truncate">Assigned: {asg.title}</span>
                          </div>
                        ))}

                        {totalCount > 3 && (
                          <div className="text-[9px] font-semibold text-zinc-400 pl-1">
                            +{totalCount - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Agenda Drawer (4 cols on lg) */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-zinc-200/90 shadow-xs p-4 sm:p-5 space-y-4">
              <div className="pb-3 border-b border-zinc-100 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    Day Schedule
                  </span>
                  <h2 className="text-base font-bold text-zinc-900 mt-0.5">
                    {getSelectedDayLabel()}
                  </h2>
                </div>
                <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                  {selectedDayDues.length + selectedDayReleases.length + selectedDayEvents.length} Items
                </span>
              </div>

              {/* 1. Deadlines on this date */}
              {selectedDayDues.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Assignments Due Today ({selectedDayDues.length})</span>
                  </div>

                  <div className="space-y-2">
                    {selectedDayDues.map(asg => (
                      <div
                        key={asg.id}
                        className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                              {asg.courseCode}
                            </span>
                            <h4 className="font-bold text-xs text-zinc-900 mt-1">
                              {asg.title}
                            </h4>
                          </div>
                          <span className="text-xs font-extrabold text-rose-700 shrink-0">
                            {asg.points} pts
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-zinc-600 pt-1 border-t border-rose-200/60">
                          <span className="flex items-center gap-1 text-rose-900 font-semibold">
                            <Clock className="w-3 h-3 text-rose-600" />
                            Due: {asg.dueAt}
                          </span>
                          <button
                            onClick={() => setActiveTab('assignments')}
                            className="text-xs font-bold text-[#26394D] hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Submit Work</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Lectures on this date */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#26394D]" />
                  Class Sessions ({selectedDayEvents.length})
                </span>

                {selectedDayEvents.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-zinc-200 text-center text-xs text-zinc-400">
                    No scheduled lectures for this day.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedDayEvents.map(evt => (
                      <div
                        key={evt.id}
                        className="p-3 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white space-y-2 transition-all shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                              {evt.courseCode}
                            </span>
                            <h4 className="font-bold text-xs text-zinc-900 mt-1">
                              {evt.title}
                            </h4>
                            <p className="text-[11px] text-zinc-500">
                              {evt.instructorName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-zinc-600 pt-1 border-t border-zinc-100">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            {evt.startTime} – {evt.endTime}
                          </span>
                          <span className="flex items-center gap-1 text-zinc-500">
                            <MapPin className="w-3 h-3 text-zinc-400" />
                            {evt.location}
                          </span>
                        </div>

                        {evt.isVirtual && (
                          <button
                            onClick={() => startMeeting(evt.title, evt.courseCode)}
                            className="w-full py-1.5 rounded-lg bg-[#26394D] hover:bg-[#141E2B] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Virtual Classroom</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Assignments Released */}
              {selectedDayReleases.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Assignments Released ({selectedDayReleases.length})</span>
                  </div>
                  <div className="space-y-2">
                    {selectedDayReleases.map(asg => (
                      <div
                        key={asg.id}
                        className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900">{asg.title}</span>
                          <span className="text-[10px] text-emerald-700 font-bold">{asg.points} pts</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 line-clamp-1">{asg.instructions}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: WEEKLY TIMETABLE (MON - FRI SCHEDULE)             */}
        {/* ========================================================= */}
        {viewMode === 'week' && (
          <div className="bg-white rounded-xl border border-zinc-200/90 shadow-xs p-4 sm:p-5 space-y-4 overflow-x-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-bold text-zinc-900">
                  Weekly Academic Schedule & Timetable
                </h2>
                <p className="text-xs text-zinc-500">
                  Daily recurring lecture timetable and room assignments for Week 11 (Nov 16 – 20, 2026).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 min-w-[700px]">
              {weekDays.map(col => {
                const dayEvents = (eventsByDayMap[col.dayNum] || []).filter(
                  e => courseFilter === 'all' || e.courseCode === courseFilter
                );
                const isSelected = selectedDay === col.dayNum;
                const isToday = col.dayNum === 16;

                return (
                  <div
                    key={col.dayNum}
                    onClick={() => setSelectedDay(col.dayNum)}
                    className={`rounded-xl border p-3 flex flex-col justify-between space-y-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#26394D] bg-indigo-50/30 shadow-xs'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                      <div>
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                          {col.short}
                        </span>
                        <span className="text-sm font-black text-zinc-900">
                          Nov {col.dayNum}
                        </span>
                      </div>
                      {isToday && (
                        <span className="text-[9px] font-bold text-white bg-[#26394D] px-1.5 py-0.5 rounded">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      {dayEvents.length === 0 ? (
                        <p className="text-xs text-zinc-400 py-4 text-center">
                          No classes scheduled
                        </p>
                      ) : (
                        dayEvents.map(evt => (
                          <div
                            key={evt.id}
                            className="p-2.5 rounded-lg border border-indigo-100 bg-indigo-50/60 hover:bg-indigo-50 space-y-1.5 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                                {evt.courseCode}
                              </span>
                              <span className="text-[10px] font-semibold text-zinc-600">
                                {evt.startTime}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-zinc-900 leading-snug">
                              {evt.title}
                            </h4>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                              <Users className="w-3 h-3 text-zinc-400" />
                              <span>{evt.instructorName}</span>
                            </div>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-zinc-400" />
                              <span>{evt.location}</span>
                            </div>

                            {evt.isVirtual && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  startMeeting(evt.title, evt.courseCode);
                                }}
                                className="w-full mt-1 py-1 rounded bg-[#26394D] hover:bg-[#141E2B] text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <Video className="w-3 h-3" />
                                <span>Join Class</span>
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: DEADLINES & RELEASES TIMELINE                      */}
        {/* ========================================================= */}
        {viewMode === 'deadlines' && (
          <div className="bg-white rounded-xl border border-zinc-200/90 shadow-xs p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                Coursework Deadlines & Milestones Master Schedule
              </h2>
              <p className="text-xs text-zinc-500">
                Complete list of all assignments, problem sets, and lab project deadlines across all courses.
              </p>
            </div>

            <div className="space-y-3">
              {assignments.map(asg => (
                <div
                  key={asg.id}
                  className="p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-[#26394D] flex items-center justify-center font-bold shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded border bg-indigo-50 text-indigo-700 border-indigo-200">
                          {asg.courseCode}
                        </span>
                        <h3 className="font-bold text-sm text-zinc-900 truncate">
                          {asg.title}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-1 mt-1">
                        {asg.instructions}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-bold text-rose-700">
                        <Clock className="w-3.5 h-3.5 text-rose-600" />
                        <span>Due: {asg.dueAt}</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-medium">
                        Worth {asg.points} points
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveTab('assignments')}
                      className="px-3.5 py-1.5 rounded-lg bg-[#26394D] hover:bg-[#141E2B] text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SCHEDULE MODAL (Admin/Professor) */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-zinc-200 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-base text-zinc-900">Schedule Academic Session</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  placeholder="Lecture or Session Title (CS 301: Graph Connectivity)"
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-[#26394D] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Instructor / Lecturer
                </label>
                <select
                  value={newEventInstructor}
                  onChange={e => setNewEventInstructor(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
                >
                  {availableUsers
                    .filter(u => u.role === 'professor' || u.role === 'lecturer' || u.role === 'admin')
                    .map(u => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Course Code
                  </label>
                  <select
                    value={newEventCourseCode}
                    onChange={e => setNewEventCourseCode(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Date in November
                  </label>
                  <select
                    value={newEventDayNum}
                    onChange={e => setNewEventDayNum(Number(e.target.value))}
                    className="w-full bg-white border border-zinc-300 rounded px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
                  >
                    {Array.from({ length: 30 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Nov {i + 1}, 2026
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={newEventStartTime}
                    onChange={e => setNewEventStartTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={newEventEndTime}
                    onChange={e => setNewEventEndTime(e.target.value)}
                    placeholder="11:30 AM"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Location / Classroom
                </label>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={e => setNewEventLocation(e.target.value)}
                  placeholder="Turing Hall 101 / Microsoft Teams"
                  className="w-full bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#26394D]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalVirtual"
                  checked={newEventIsVirtual}
                  onChange={e => setNewEventIsVirtual(e.target.checked)}
                  className="rounded text-[#26394D]"
                />
                <label htmlFor="modalVirtual" className="text-xs text-zinc-700 font-medium">
                  Enable Microsoft Teams Virtual Classroom Meeting Room
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#26394D] hover:bg-[#141E2B] text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
