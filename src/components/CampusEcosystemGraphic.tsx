import React, { useState } from 'react';
import { BookOpen, Cpu, Building2, GraduationCap, Sparkles, Activity, ShieldCheck, Database } from 'lucide-react';

export const CampusEcosystemGraphic: React.FC = () => {
  const [activeHub, setActiveHub] = useState<string | null>(null);

  return (
    <div className="relative w-full max-w-[620px] lg:max-w-[680px] mx-auto select-none">
      {/* Ambient Radial Backlight Glow */}
      <div className="absolute inset-0 -m-10 bg-gradient-to-tr from-indigo-200/40 via-purple-100/30 to-cyan-100/30 blur-3xl rounded-full hero-glow-pulse pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full aspect-[1058/822] overflow-visible">
        {/* 1. Base 3D Isometric Campus Infrastructure Graphic */}
        <img
          src="/hero-campus-feathered.png"
          alt="ProSchool 3D Campus Infrastructure Ecosystem"
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* 2. Seamless Cinematic 360° Rotating Earth Globe (Positioned exactly over central globe) */}
        <div
          className="absolute rounded-full overflow-hidden shadow-[0_0_40px_rgba(0,240,255,0.35),0_0_80px_rgba(99,102,241,0.25)] pointer-events-none transition-transform duration-500"
          style={{
            left: '31.2%',
            top: '22.0%',
            width: '21.6%',
            height: '27.8%',
            boxShadow: 'inset -12px -12px 24px rgba(0,0,0,0.85), inset 8px 8px 18px rgba(0,240,255,0.45), 0 0 35px rgba(59,130,246,0.35)'
          }}
        >
          {/* Continuous rotating earth continents layer */}
          <div
            className="w-full h-full animate-globe-spin"
            style={{
              backgroundImage: 'url(/earth-map-seamless.svg)',
              backgroundSize: '200% 100%',
              backgroundRepeat: 'repeat-x',
              opacity: 0.88,
              mixBlendMode: 'screen'
            }}
          />

          {/* 3D Spherical Specular Glass Highlight & Atmospheric Rim */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 34% 28%, rgba(255,255,255,0.55) 0%, rgba(0,240,255,0.22) 36%, rgba(10,18,34,0.82) 100%)',
              mixBlendMode: 'overlay'
            }}
          />
        </div>

        {/* 3. Luminous Fiber-Optic Curved Data Streams & Flowing Pulses (SVG Hardware-Accelerated) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 1000 775"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Cyan/Electric Blue Stream Gradient */}
            <linearGradient id="cyanStream" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.9" />
            </linearGradient>

            {/* Magenta/Violet Stream Gradient */}
            <linearGradient id="magentaStream" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#EC4899" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.9" />
            </linearGradient>

            {/* Neon Glow Filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Intense Particle Glow */}
            <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Orbital Concentric Rings around Globe */}
          <ellipse
            cx="420"
            cy="348"
            rx="220"
            ry="85"
            stroke="url(#cyanStream)"
            strokeWidth="1.5"
            strokeDasharray="8 16"
            strokeOpacity="0.65"
            className="animate-spin-slow"
          />
          <ellipse
            cx="420"
            cy="352"
            rx="285"
            ry="110"
            stroke="url(#magentaStream)"
            strokeWidth="1.2"
            strokeDasharray="6 20"
            strokeOpacity="0.5"
            className="animate-spin-reverse"
          />

          {/* --- PATH 1: Central Globe -> Top-Left Library Hub --- */}
          <path
            id="stream-library"
            d="M 420,340 C 330,315 270,275 210,230"
            stroke="url(#cyanStream)"
            strokeWidth={activeHub === 'library' ? 3.5 : 2}
            strokeLinecap="round"
            className="animate-fiber-pulse"
            filter="url(#neonGlow)"
          />
          <path
            d="M 410,335 C 320,305 260,265 200,225"
            stroke="url(#magentaStream)"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="animate-fiber-pulse-rev"
            strokeOpacity="0.75"
          />
          {/* Traveling Photon Pulses */}
          <circle r="4.5" fill="#00F0FF" filter="url(#pulseGlow)">
            <animateMotion dur="2.8s" repeatCount="indefinite" path="M 420,340 C 330,315 270,275 210,230" />
          </circle>
          <circle r="3.5" fill="#EC4899" filter="url(#pulseGlow)">
            <animateMotion dur="3.4s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" path="M 420,340 C 330,315 270,275 210,230" />
          </circle>

          {/* --- PATH 2: Central Globe -> Top-Right Science & AI Lab --- */}
          <path
            id="stream-lab"
            d="M 420,340 C 505,315 595,275 675,250"
            stroke="url(#cyanStream)"
            strokeWidth={activeHub === 'lab' ? 3.5 : 2}
            strokeLinecap="round"
            className="animate-fiber-pulse"
            filter="url(#neonGlow)"
          />
          <path
            d="M 425,345 C 515,325 605,285 685,255"
            stroke="url(#magentaStream)"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="animate-fiber-pulse-rev"
            strokeOpacity="0.75"
          />
          {/* Traveling Photon Pulses */}
          <circle r="4.5" fill="#38BDF8" filter="url(#pulseGlow)">
            <animateMotion dur="3.1s" repeatCount="indefinite" path="M 420,340 C 505,315 595,275 675,250" />
          </circle>
          <circle r="3.5" fill="#A855F7" filter="url(#pulseGlow)">
            <animateMotion dur="2.7s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" path="M 420,340 C 505,315 595,275 675,250" />
          </circle>

          {/* --- PATH 3: Central Globe -> Bottom-Left Administration Hub --- */}
          <path
            id="stream-admin"
            d="M 420,340 C 330,380 250,460 190,530"
            stroke="url(#cyanStream)"
            strokeWidth={activeHub === 'admin' ? 3.5 : 2}
            strokeLinecap="round"
            className="animate-fiber-pulse"
            filter="url(#neonGlow)"
          />
          <path
            d="M 415,345 C 320,390 240,470 180,535"
            stroke="url(#magentaStream)"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="animate-fiber-pulse-rev"
            strokeOpacity="0.75"
          />
          {/* Traveling Photon Pulses */}
          <circle r="4.5" fill="#00F0FF" filter="url(#pulseGlow)">
            <animateMotion dur="3.5s" repeatCount="indefinite" path="M 420,340 C 330,380 250,460 190,530" />
          </circle>
          <circle r="3.5" fill="#F43F5E" filter="url(#pulseGlow)">
            <animateMotion dur="2.9s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" path="M 420,340 C 330,380 250,460 190,530" />
          </circle>

          {/* --- PATH 4: Central Globe -> Bottom-Right Smart Lecture Hall --- */}
          <path
            id="stream-lecture"
            d="M 420,340 C 505,390 585,480 645,550"
            stroke="url(#cyanStream)"
            strokeWidth={activeHub === 'lecture' ? 3.5 : 2}
            strokeLinecap="round"
            className="animate-fiber-pulse"
            filter="url(#neonGlow)"
          />
          <path
            d="M 425,335 C 515,380 595,470 655,545"
            stroke="url(#magentaStream)"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="animate-fiber-pulse-rev"
            strokeOpacity="0.75"
          />
          {/* Traveling Photon Pulses */}
          <circle r="4.5" fill="#38BDF8" filter="url(#pulseGlow)">
            <animateMotion dur="2.6s" repeatCount="indefinite" path="M 420,340 C 505,390 585,480 645,550" />
          </circle>
          <circle r="3.5" fill="#EC4899" filter="url(#pulseGlow)">
            <animateMotion dur="3.3s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" path="M 420,340 C 505,390 585,480 645,550" />
          </circle>
        </svg>

        {/* 4. Interactive Floating Isometric Campus Modules with Hover Physics */}

        {/* Hub 1: Digital Library & Knowledge Vault (Top-Left) */}
        <div
          onMouseEnter={() => setActiveHub('library')}
          onMouseLeave={() => setActiveHub(null)}
          className="absolute z-20 animate-hub-1 group cursor-pointer"
          style={{ top: '8%', left: '5%', width: '30%', height: '32%' }}
        >
          {/* Hover Glow Highlight */}
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/0 group-hover:bg-indigo-500/10 group-hover:shadow-[0_0_25px_rgba(99,102,241,0.45)] group-hover:scale-105 transition-all duration-300 pointer-events-none" />

          {/* Live Floating Pill Badge */}
          <div className="absolute -top-3 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-100 shadow-[0_8px_20px_rgba(79,70,229,0.18)] flex items-center gap-1.5 text-[11px] transform group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300">
            <BookOpen className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span className="font-extrabold text-zinc-900">Digital Library</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </div>

          {/* Rich Tooltip on Hover */}
          {activeHub === 'library' && (
            <div className="absolute top-full left-2 mt-2 bg-zinc-950/90 text-white backdrop-blur-md px-3.5 py-2 rounded-xl text-[10px] shadow-xl border border-indigo-400/30 whitespace-nowrap z-30 animate-in fade-in zoom-in-95 duration-150">
              <p className="font-bold text-indigo-300">14,200+ Digital Volumes Online</p>
              <p className="text-zinc-400">Automated e-Book Lending &amp; AI Search</p>
            </div>
          )}
        </div>

        {/* Hub 2: Science & AI Computing Lab (Top-Right) */}
        <div
          onMouseEnter={() => setActiveHub('lab')}
          onMouseLeave={() => setActiveHub(null)}
          className="absolute z-20 animate-hub-2 group cursor-pointer"
          style={{ top: '10%', left: '57%', width: '31%', height: '32%' }}
        >
          {/* Hover Glow Highlight */}
          <div className="absolute inset-0 rounded-2xl bg-cyan-500/0 group-hover:bg-cyan-500/10 group-hover:shadow-[0_0_25px_rgba(6,182,212,0.45)] group-hover:scale-105 transition-all duration-300 pointer-events-none" />

          {/* Live Floating Pill Badge */}
          <div className="absolute -top-3 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-100 shadow-[0_8px_20px_rgba(6,182,212,0.18)] flex items-center gap-1.5 text-[11px] transform group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-600" />
            <span className="font-extrabold text-zinc-900">Science &amp; AI Lab</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse ml-0.5" />
          </div>

          {/* Rich Tooltip on Hover */}
          {activeHub === 'lab' && (
            <div className="absolute top-full right-2 mt-2 bg-zinc-950/90 text-white backdrop-blur-md px-3.5 py-2 rounded-xl text-[10px] shadow-xl border border-cyan-400/30 whitespace-nowrap z-30 animate-in fade-in zoom-in-95 duration-150">
              <p className="font-bold text-cyan-300">Compute Grid Active • 99.8% Uptime</p>
              <p className="text-zinc-400">Virtual Chemistry &amp; Physics Simulators</p>
            </div>
          )}
        </div>

        {/* Hub 3: Campus Administration & Faculty Suite (Bottom-Left) */}
        <div
          onMouseEnter={() => setActiveHub('admin')}
          onMouseLeave={() => setActiveHub(null)}
          className="absolute z-20 animate-hub-3 group cursor-pointer"
          style={{ top: '53%', left: '3%', width: '31%', height: '35%' }}
        >
          {/* Hover Glow Highlight */}
          <div className="absolute inset-0 rounded-2xl bg-emerald-500/0 group-hover:bg-emerald-500/10 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.45)] group-hover:scale-105 transition-all duration-300 pointer-events-none" />

          {/* Live Floating Pill Badge */}
          <div className="absolute -bottom-2 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-100 shadow-[0_8px_20px_rgba(16,185,129,0.18)] flex items-center gap-1.5 text-[11px] transform group-hover:scale-105 group-hover:translate-y-1 transition-all duration-300">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-extrabold text-zinc-900">Administration Suite</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </div>

          {/* Rich Tooltip on Hover */}
          {activeHub === 'admin' && (
            <div className="absolute bottom-full left-2 mb-2 bg-zinc-950/90 text-white backdrop-blur-md px-3.5 py-2 rounded-xl text-[10px] shadow-xl border border-emerald-400/30 whitespace-nowrap z-30 animate-in fade-in zoom-in-95 duration-150">
              <p className="font-bold text-emerald-300">Multi-Campus Roster Active</p>
              <p className="text-zinc-400">Gatekeeper Locked • 92.5% Aggregate</p>
            </div>
          )}
        </div>

        {/* Hub 4: Smart Lecture Hall & Auditorium (Bottom-Right) */}
        <div
          onMouseEnter={() => setActiveHub('lecture')}
          onMouseLeave={() => setActiveHub(null)}
          className="absolute z-20 animate-hub-4 group cursor-pointer"
          style={{ top: '55%', left: '55%', width: '32%', height: '35%' }}
        >
          {/* Hover Glow Highlight */}
          <div className="absolute inset-0 rounded-2xl bg-purple-500/0 group-hover:bg-purple-500/10 group-hover:shadow-[0_0_25px_rgba(168,85,247,0.45)] group-hover:scale-105 transition-all duration-300 pointer-events-none" />

          {/* Live Floating Pill Badge */}
          <div className="absolute -bottom-2 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-purple-100 shadow-[0_8px_20px_rgba(168,85,247,0.18)] flex items-center gap-1.5 text-[11px] transform group-hover:scale-105 group-hover:translate-y-1 transition-all duration-300">
            <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
            <span className="font-extrabold text-zinc-900">Smart Classroom</span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse ml-0.5" />
          </div>

          {/* Rich Tooltip on Hover */}
          {activeHub === 'lecture' && (
            <div className="absolute bottom-full right-2 mb-2 bg-zinc-950/90 text-white backdrop-blur-md px-3.5 py-2 rounded-xl text-[10px] shadow-xl border border-purple-400/30 whitespace-nowrap z-30 animate-in fade-in zoom-in-95 duration-150">
              <p className="font-bold text-purple-300">CS 301: Advanced Algorithms</p>
              <p className="text-zinc-400">Live HD Broadcast • Attendance 98.4%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

