import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Check,
  ArrowRight,
  FileText,
  Folder as FolderIcon
} from 'lucide-react';

interface CapabilityCardData {
  id: string;
  title: string;
  description: string;
  demoRole: 'student' | 'professor' | 'admin';
  renderVisual: () => React.ReactNode;
}

interface Props {
  onLaunchDemo: (role: 'student' | 'professor' | 'admin') => void;
}

export const PlatformCapabilitiesCarousel: React.FC<Props> = ({ onLaunchDemo }) => {
  const [isPaused, setIsPaused] = useState(false);

  const CARDS: CapabilityCardData[] = [
    // 1. Live & Recorded Classes
    {
      id: 'live-classes',
      title: 'Live & Recorded Classes',
      description: 'Teach and share knowledge anywhere, anytime.',
      demoRole: 'professor',
      renderVisual: () => (
        <div className="relative w-full h-[145px] rounded-2xl bg-gradient-to-r from-[#171447] via-[#241F63] to-[#2E2880] p-2.5 flex items-center gap-3 overflow-hidden shadow-[0_8px_20px_rgba(23,20,71,0.25)] border border-indigo-900/50">
          {/* Video Player Mockup on Left */}
          <div className="relative w-[56%] h-full rounded-xl overflow-hidden bg-zinc-950 shrink-0 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=350&q=80"
              alt="Lecturer streaming live"
              className="w-full h-full object-cover"
            />
            {/* Top-Left Live Badge */}
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-rose-600/95 text-[9px] font-black text-white flex items-center gap-1 shadow-sm tracking-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>LIVE + HD</span>
            </div>
            {/* Bottom Player Controls Bar */}
            <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center px-2 gap-1.5">
              <Play className="w-2.5 h-2.5 text-white fill-white shrink-0" />
              <div className="relative w-full h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="w-[42%] h-full bg-cyan-400 rounded-full" />
              </div>
            </div>
          </div>

          {/* Vertical Lecture Schedule on Right */}
          <div className="relative flex-1 flex flex-col justify-center space-y-2.5 pl-1">
            <div className="relative flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 ring-4 ring-cyan-400/25 shrink-0" />
              <span className="text-[10px] font-extrabold text-white tracking-tight whitespace-nowrap">
                Lecture: 10:00 AM
              </span>
            </div>
            <div className="relative flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300/80 shrink-0" />
              <span className="text-[10px] font-medium text-indigo-200/80 tracking-tight whitespace-nowrap">
                Lecture: 3:00 AM
              </span>
            </div>
            <div className="relative flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300/80 shrink-0" />
              <span className="text-[10px] font-medium text-indigo-200/80 tracking-tight whitespace-nowrap">
                Lecture: 7:00 AM
              </span>
            </div>
          </div>
        </div>
      )
    },

    // 2. Assignments & Exams
    {
      id: 'assignments',
      title: 'Assignments & Exams',
      description: 'Create, distribute, and track assignments easily.',
      demoRole: 'student',
      renderVisual: () => (
        <div className="relative w-full h-[145px] rounded-2xl bg-[#F8FAFC] p-3 flex items-center justify-between overflow-hidden border border-zinc-100">
          {/* Left Column: Submission Progress Pill & Floating Document Icons */}
          <div className="flex flex-col justify-between h-full py-0.5 space-y-2">
            <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-[0_6px_16px_rgba(16,185,129,0.32)]">
              <p className="text-[9px] font-semibold text-emerald-100 uppercase tracking-wider">
                Submission Progress
              </p>
              <p className="text-xs font-black text-white">98% Graded</p>
            </div>
            <div className="flex items-center gap-2 pl-1">
              <div className="w-6 h-7 rounded-md bg-[#4F46E5] text-white flex items-center justify-center shadow-md">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="w-6 h-6 rounded-md bg-[#10B981] text-white flex items-center justify-center shadow-md">
                <FolderIcon className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Right Column: Stacked Rubric Card */}
          <div className="relative bg-white rounded-xl border border-zinc-200/80 p-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.06)] min-w-[125px] space-y-1.5">
            <p className="text-[10px] font-extrabold text-zinc-900 tracking-tight">Rubric</p>
            <div className="space-y-1 text-[9px]">
              <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
                <div className="w-3 h-3 rounded bg-indigo-600 text-white flex items-center justify-center text-[8px]">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Check List</span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
                <div className="w-3 h-3 rounded bg-indigo-600 text-white flex items-center justify-center text-[8px]">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Auto-Grading</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
                <div className="w-3 h-3 rounded border border-zinc-300" />
                <span>Rubric List</span>
              </div>
            </div>
            {/* Stacked Paper Bottom Layers */}
            <div className="absolute -bottom-1 inset-x-2 h-1 bg-zinc-200 rounded-b-xl -z-10" />
            <div className="absolute -bottom-2 inset-x-4 h-1 bg-zinc-300/60 rounded-b-xl -z-20" />
          </div>
        </div>
      )
    },

    // 3. Student Management
    {
      id: 'student-mgmt',
      title: 'Student Management',
      description: 'Manage students, classes, and progress.',
      demoRole: 'admin',
      renderVisual: () => (
        <div className="relative w-full h-[145px] rounded-2xl bg-[#F8FAFC] p-4 flex flex-col items-center justify-center gap-3 overflow-hidden border border-zinc-100">
          {/* 4 Overlapping Circular Student Avatars */}
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 rounded-full ring-2 ring-white shadow-md overflow-hidden z-40">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80"
                alt="Student 1"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-10 h-10 rounded-full ring-2 ring-white shadow-md overflow-hidden -ml-2.5 z-30">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80"
                alt="Student 2"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-10 h-10 rounded-full ring-2 ring-white shadow-md overflow-hidden -ml-2.5 z-20">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80"
                alt="Student 3"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-10 h-10 rounded-full ring-2 ring-white shadow-md overflow-hidden -ml-2.5 z-10">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80"
                alt="Student 4"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Active Cohort Pill Button */}
          <div className="px-5 py-1.5 rounded-full bg-gradient-to-r from-[#211C54] via-[#2F277A] to-[#4338CA] text-white text-[11px] font-extrabold shadow-[0_6px_18px_rgba(42,35,110,0.32)] tracking-tight">
            Active Cohort
          </div>
        </div>
      )
    },

    // 4. Real-Time Collaboration
    {
      id: 'collaboration',
      title: 'Real-Time Collaboration',
      description: 'Chat, discuss, and work together effortlessly.',
      demoRole: 'student',
      renderVisual: () => (
        <div className="relative w-full h-[145px] rounded-2xl bg-[#F8FAFC] p-4 flex flex-col items-center justify-center gap-2.5 overflow-hidden border border-zinc-100">
          {/* Top Dark Indigo Chat Bubble (UI conversation) */}
          <div className="px-3.5 py-1.5 rounded-full bg-[#272166] text-white text-[11px] font-bold shadow-md flex items-center gap-2 transform -translate-x-3">
            <span className="text-[12px]">💬</span>
            <span className="tracking-tight">UI conversation</span>
            <div className="w-4 h-4 rounded-full ring-1 ring-white/60 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&q=80"
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Bottom Frosted Lilac Chat Bubble (Comment) */}
          <div className="px-3.5 py-1.5 rounded-full bg-[#E0E7FF] text-[#272166] text-[11px] font-bold shadow-sm flex items-center gap-2 transform translate-x-3">
            <span className="text-[12px]">💬</span>
            <span className="tracking-tight">Comment</span>
            <div className="w-4 h-4 rounded-full ring-1 ring-indigo-400 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80"
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )
    },

    // 5. Resource Library
    {
      id: 'resource-library',
      title: 'Resource Library',
      description: 'Share files, notes, and study materials.',
      demoRole: 'professor',
      renderVisual: () => (
        <div className="relative w-full h-[145px] rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] p-3 flex items-center justify-between overflow-hidden shadow-[0_8px_20px_rgba(37,99,235,0.25)] border border-blue-600/30">
          {/* Stylized Folder Graphic on Left */}
          <div className="relative w-[48%] h-full rounded-xl bg-[#0F172A] p-2 flex flex-col justify-between shadow-inner">
            <div className="w-14 h-2 rounded-t-md bg-[#0F172A] -mt-3 ml-1" />
            <div className="w-full h-2 rounded-full bg-blue-500/30" />
            <div className="w-3/4 h-2 rounded-full bg-blue-500/20" />
          </div>

          {/* 2x2 Tag Pills on Right */}
          <div className="grid grid-cols-2 gap-2 pl-2">
            <span className="px-2.5 py-1 rounded-md bg-white text-zinc-900 text-[10px] font-black shadow-sm text-center tracking-tight">
              PDF
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white text-zinc-900 text-[10px] font-black shadow-sm text-center tracking-tight">
              NOTES
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white text-zinc-900 text-[10px] font-black shadow-sm text-center tracking-tight">
              PDS
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white text-zinc-900 text-[10px] font-black shadow-sm text-center tracking-tight">
              SYLLABUS
            </span>
          </div>
        </div>
      )
    },

    // 6. Progress Analytics
    {
      id: 'analytics',
      title: 'Progress Analytics',
      description: 'Track performance with detailed insights.',
      demoRole: 'admin',
      renderVisual: () => (
        <div className="relative w-full h-[145px] rounded-2xl bg-[#F8FAFC] p-3 flex items-center justify-between overflow-hidden border border-zinc-100">
          {/* Floating Data Card with Line Graph on Left */}
          <div className="relative w-[65%] h-full bg-white rounded-xl border border-zinc-200/80 p-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.06)] flex flex-col justify-between">
            <span className="text-[10px] font-extrabold text-zinc-800 tracking-tight">
              Data Card
            </span>
            {/* Dual Line Trend Chart */}
            <svg viewBox="0 0 100 45" className="w-full h-12" fill="none">
              {/* Cyan/Green Trendline */}
              <path
                d="M 5,38 Q 25,20 45,30 T 80,10 T 95,5"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Blue/Purple Trendline */}
              <path
                d="M 5,30 Q 25,35 45,18 T 80,22 T 95,12"
                stroke="#2563EB"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Growth Pill Badge on Right */}
          <div className="px-3 py-2.5 rounded-xl bg-blue-50/90 border border-blue-100 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-xs font-black text-zinc-950">+18%</span>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
              Growth
            </span>
          </div>
        </div>
      )
    }
  ];

  // Duplicate cards for seamless infinite horizontal loop
  const loopCards = [...CARDS, ...CARDS];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full overflow-hidden py-4 select-none"
    >
      {/* Left & Right Soft Fade Gradients for Seamless Infinity Look */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-28 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-28 bg-gradient-to-l from-white to-transparent z-10" />

      {/* Infinite Horizontal Sliding Track (Right to Left) */}
      <div
        className="flex items-stretch gap-6 w-max"
        style={{
          animation: 'slideTrackRightToLeft 32s linear infinite',
          animationPlayState: isPaused ? 'paused' : 'running'
        }}
      >
        {loopCards.map((card, idx) => (
          <motion.div
            key={`${card.id}-${idx}`}
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-[340px] sm:w-[370px] bg-white rounded-3xl p-6 sm:p-7 border border-zinc-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_36px_rgba(79,70,229,0.12)] transition-shadow duration-300 flex flex-col justify-between shrink-0 group cursor-pointer"
          >
            {/* Visual Container */}
            <div className="mb-6">{card.renderVisual()}</div>

            {/* Text & Action */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-lg sm:text-xl text-zinc-950 tracking-tight">
                {card.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed">
                {card.description}
              </p>
            </div>

            <button
              onClick={() => onLaunchDemo(card.demoRole)}
              className="mt-6 text-xs sm:text-sm font-bold text-[#4F46E5] group-hover:text-[#4338CA] inline-flex items-center gap-1.5 cursor-pointer w-fit transition-transform"
            >
              <span>Learn More</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
