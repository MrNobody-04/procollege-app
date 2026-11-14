import React, { useState } from 'react';
import { BookOpen, Cpu, Building2, GraduationCap } from 'lucide-react';

export const CampusEcosystemGraphic: React.FC = () => {
  const [hoveredHub, setHoveredHub] = useState<string | null>(null);

  return (
    <div className="relative w-full max-w-[620px] lg:max-w-[680px] mx-auto select-none">
      {/* Ambient Radial Backlight Glow */}
      <div className="absolute inset-0 -m-12 bg-gradient-to-tr from-indigo-200/40 via-purple-100/25 to-cyan-100/35 blur-3xl rounded-full hero-glow-pulse pointer-events-none" />

      {/* Main 3D Isometric Ecosystem Container */}
      <div className="relative w-full aspect-[1058/822]">
        {/* 1. Pristine 3D Campus Infrastructure Base Artwork */}
        <img
          src="/hero-campus-feathered.png"
          alt="ProSchool 3D Campus Infrastructure Ecosystem"
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* 2. Single Opaque Seamless 360° Rotating Earth Globe (NO duplicate earth ghosting) */}
        <div
          className="absolute rounded-full overflow-hidden pointer-events-none"
          style={{
            left: '30.9%',
            top: '25.2%',
            width: '22.3%',
            aspectRatio: '1 / 1',
            backgroundColor: '#0c1524',
            boxShadow:
              'inset -14px -14px 28px rgba(0,0,0,0.92), inset 10px 10px 20px rgba(0,240,255,0.48), 0 0 35px rgba(56,189,248,0.45), 0 0 70px rgba(99,102,241,0.25)'
          }}
        >
          {/* Continuous rotating continents layer (OPAQUE base, seamless west-to-east translation) */}
          <div
            className="w-full h-full animate-globe-spin"
            style={{
              backgroundImage: 'url(/earth-map-seamless.svg)',
              backgroundSize: '200% 100%',
              backgroundRepeat: 'repeat-x',
              opacity: 0.95
            }}
          />

          {/* 3D Spherical Specular Glass Highlight & Atmospheric Rim */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 35% 26%, rgba(255,255,255,0.65) 0%, rgba(56,189,248,0.28) 28%, rgba(0,0,0,0) 65%, rgba(10,18,34,0.85) 100%)'
            }}
          />
        </div>

        {/* 3. Luminous Fiber-Optic Curved Data Streams & Flowing Pulses (Hardware-Accelerated SVG) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 1000 775"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Cyan/Electric Blue Stream Gradient */}
            <linearGradient id="cyanStream" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.95" />
            </linearGradient>

            {/* Magenta/Violet Stream Gradient */}
            <linearGradient id="magentaStream" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#EC4899" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.95" />
            </linearGradient>

            {/* Neon Glow Filter */}
            <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Particle Glow */}
            <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Orbital Concentric Glowing Rings around Globe */}
          <ellipse
            cx="421"
            cy="348"
            rx="215"
            ry="82"
            stroke="url(#cyanStream)"
            strokeWidth="1.5"
            strokeDasharray="8 16"
            strokeOpacity="0.65"
            className="animate-spin-slow"
          />
          <ellipse
            cx="421"
            cy="352"
            rx="280"
            ry="105"
            stroke="url(#magentaStream)"
            strokeWidth="1.2"
            strokeDasharray="6 20"
            strokeOpacity="0.5"
            className="animate-spin-reverse"
          />

          {/* PATH 1: Central Globe -> Top-Left Library Hub */}
          <path
            id="stream-library"
            d="M 370,290 C 310,270 260,250 210,230"
            stroke="url(#cyanStream)"
            strokeWidth={hoveredHub === 'library' ? 3.5 : 2}
            strokeLinecap="round"
            className="animate-fiber-pulse"
            filter="url(#neonGlow)"
          />
          <circle r="4" fill="#00F0FF" filter="url(#pulseGlow)">
            <animateMotion dur="2.8s" repeatCount="indefinite" path="M 370,290 C 310,270 260,250 210,230" />
          </circle>
          <circle r="3" fill="#EC4899" filter="url(#pulseGlow)">
            <animateMotion dur="3.4s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" path="M 370,290 C 310,270 260,250 210,230" />
          </circle>

          {/* PATH 2: Central Globe -> Top-Right Science & AI Lab */}
          <path
            id="stream-lab"
            d="M 470,290 C 530,270 600,250 670,245"
            stroke="url(#cyanStream)"
            strokeWidth={hoveredHub === 'lab' ? 3.5 : 2}
            strokeLinecap="round"
            className="animate-fiber-pulse"
            filter="url(#neonGlow)"
          />
          <circle r="4" fill="#38BDF8" filter="url(#pulseGlow)">
            <animateMotion dur="3.1s" repeatCount="indefinite" path="M 470,290 C 530,270 600,250 670,245" />
          </circle>
          <circle r="3" fill="#A855F7" filter="url(#pulseGlow)">
            <animateMotion dur="2.7s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" path="M 470,290 C 530,270 600,250 670,245" />
          </circle>

          {/* PATH 3: Central Globe -> Bottom-Left Administration Hub */}
          <path
            id="stream-admin"
            d="M 365,360 C 300,400 240,460 190,525"
            stroke="url(#cyanStream)"
            strokeWidth={hoveredHub === 'admin' ? 3.5 : 2}
            strokeLinecap="round"
            className="animate-fiber-pulse"
            filter="url(#neonGlow)"
          />
          <circle r="4" fill="#00F0FF" filter="url(#pulseGlow)">
            <animateMotion dur="3.5s" repeatCount="indefinite" path="M 365,360 C 300,400 240,460 190,525" />
          </circle>
          <circle r="3" fill="#F43F5E" filter="url(#pulseGlow)">
            <animateMotion dur="2.9s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" path="M 365,360 C 300,400 240,460 190,525" />
          </circle>

          {/* PATH 4: Central Globe -> Bottom-Right Smart Lecture Hall */}
          <path
            id="stream-lecture"
            d="M 475,360 C 530,400 590,460 645,540"
            stroke="url(#cyanStream)"
            strokeWidth={hoveredHub === 'lecture' ? 3.5 : 2}
            strokeLinecap="round"
            className="animate-fiber-pulse"
            filter="url(#neonGlow)"
          />
          <circle r="4" fill="#38BDF8" filter="url(#pulseGlow)">
            <animateMotion dur="2.6s" repeatCount="indefinite" path="M 475,360 C 530,400 590,460 645,540" />
          </circle>
          <circle r="3" fill="#EC4899" filter="url(#pulseGlow)">
            <animateMotion dur="3.3s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" path="M 475,360 C 530,400 590,460 645,540" />
          </circle>
        </svg>

        {/* 4. Elegant Interactive Hover Zones (NO intrusive static pills blocking the buildings!) */}

        {/* Hub 1: Digital Library & Knowledge Vault (Top-Left) */}
        <div
          onMouseEnter={() => setHoveredHub('library')}
          onMouseLeave={() => setHoveredHub(null)}
          className="absolute z-20 cursor-pointer rounded-2xl group transition-all duration-300"
          style={{ top: '8%', left: '5%', width: '30%', height: '32%' }}
        >
          {/* Subtle Hover Aura */}
          <div className="absolute inset-0 rounded-2xl group-hover:bg-indigo-500/10 group-hover:shadow-[0_0_25px_rgba(99,102,241,0.35)] group-hover:scale-105 transition-all duration-300 pointer-events-none" />

          {/* Clean Modern Tooltip on Hover */}
          {hoveredHub === 'library' && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-950/92 text-white backdrop-blur-md px-3.5 py-1.5 rounded-xl text-[11px] shadow-xl border border-indigo-400/40 whitespace-nowrap z-30 animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-bold">Digital Library</span>
              <span className="text-zinc-400">• 14,200+ Volumes Online</span>
            </div>
          )}
        </div>

        {/* Hub 2: Science & AI Computing Lab (Top-Right) */}
        <div
          onMouseEnter={() => setHoveredHub('lab')}
          onMouseLeave={() => setHoveredHub(null)}
          className="absolute z-20 cursor-pointer rounded-2xl group transition-all duration-300"
          style={{ top: '10%', left: '57%', width: '31%', height: '32%' }}
        >
          <div className="absolute inset-0 rounded-2xl group-hover:bg-cyan-500/10 group-hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] group-hover:scale-105 transition-all duration-300 pointer-events-none" />

          {hoveredHub === 'lab' && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-950/92 text-white backdrop-blur-md px-3.5 py-1.5 rounded-xl text-[11px] shadow-xl border border-cyan-400/40 whitespace-nowrap z-30 animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold">Science &amp; AI Lab</span>
              <span className="text-zinc-400">• Compute Grid Active</span>
            </div>
          )}
        </div>

        {/* Hub 3: Campus Administration & Faculty Suite (Bottom-Left) */}
        <div
          onMouseEnter={() => setHoveredHub('admin')}
          onMouseLeave={() => setHoveredHub(null)}
          className="absolute z-20 cursor-pointer rounded-2xl group transition-all duration-300"
          style={{ top: '53%', left: '3%', width: '31%', height: '35%' }}
        >
          <div className="absolute inset-0 rounded-2xl group-hover:bg-emerald-500/10 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.35)] group-hover:scale-105 transition-all duration-300 pointer-events-none" />

          {hoveredHub === 'admin' && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-zinc-950/92 text-white backdrop-blur-md px-3.5 py-1.5 rounded-xl text-[11px] shadow-xl border border-emerald-400/40 whitespace-nowrap z-30 animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">Administration Suite</span>
              <span className="text-zinc-400">• Multi-Campus Synced</span>
            </div>
          )}
        </div>

        {/* Hub 4: Smart Lecture Hall & Auditorium (Bottom-Right) */}
        <div
          onMouseEnter={() => setHoveredHub('lecture')}
          onMouseLeave={() => setHoveredHub(null)}
          className="absolute z-20 cursor-pointer rounded-2xl group transition-all duration-300"
          style={{ top: '55%', left: '55%', width: '32%', height: '35%' }}
        >
          <div className="absolute inset-0 rounded-2xl group-hover:bg-purple-500/10 group-hover:shadow-[0_0_25px_rgba(168,85,247,0.35)] group-hover:scale-105 transition-all duration-300 pointer-events-none" />

          {hoveredHub === 'lecture' && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-zinc-950/92 text-white backdrop-blur-md px-3.5 py-1.5 rounded-xl text-[11px] shadow-xl border border-purple-400/40 whitespace-nowrap z-30 animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-bold">Smart Lecture Hall</span>
              <span className="text-zinc-400">• Roll-Call Live</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
