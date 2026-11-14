import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Cpu, Building2, GraduationCap, ArrowUpRight } from 'lucide-react';

interface CampusHub {
  id: string;
  name: string;
  badge: string;
  module: string;
  metric: string;
  subMetric: string;
  accentHex: string;
  accentBg: string;
  accentBorder: string;
  icon: React.ReactNode;
  beaconPos: { x: number; y: number }; // SVG pixel coords in 1058x822 viewBox
  desktopPos: { top: string; left: string };
  hotspot: { top: string; left: string; width: string; height: string };
}

const CAMPUS_HUBS: CampusHub[] = [
  {
    id: 'classroom',
    name: 'Smart Amphitheater',
    badge: 'ProCollege Meet',
    module: 'Virtual Lectures',
    metric: '48 Active Students • HD Interactive',
    subMetric: 'Real-time roll-call synchronized with LMS',
    accentHex: '#A855F7',
    accentBg: 'bg-purple-500/20 text-purple-300',
    accentBorder: 'border-purple-500/40',
    icon: <GraduationCap className="w-4 h-4 text-purple-400" />,
    beaconPos: { x: 800, y: 580 },
    desktopPos: { top: '60%', left: '56%' },
    hotspot: { top: '52%', left: '54%', width: '38%', height: '38%' }
  },
  {
    id: 'lab',
    name: 'Science & AI Computing Lab',
    badge: 'Cloud Workbenches',
    module: 'Interactive STEM',
    metric: 'Real-Time Sync • 18ms Edge Latency',
    subMetric: 'Collaborative cloud labs & test runners',
    accentHex: '#00F0FF',
    accentBg: 'bg-cyan-500/20 text-cyan-300',
    accentBorder: 'border-cyan-500/40',
    icon: <Cpu className="w-4 h-4 text-cyan-400" />,
    beaconPos: { x: 850, y: 260 },
    desktopPos: { top: '8%', left: '58%' },
    hotspot: { top: '8%', left: '54%', width: '38%', height: '38%' }
  },
  {
    id: 'admin',
    name: 'Administration Suite',
    badge: 'Campus Gatekeeper',
    module: 'Multi-Campus Governance',
    metric: '75% Attendance Lock • 98.4% Safe',
    subMetric: 'Automated compliance & assignment gating',
    accentHex: '#10B981',
    accentBg: 'bg-emerald-500/20 text-emerald-300',
    accentBorder: 'border-emerald-500/40',
    icon: <Building2 className="w-4 h-4 text-emerald-400" />,
    beaconPos: { x: 215, y: 580 },
    desktopPos: { top: '60%', left: '4%' },
    hotspot: { top: '52%', left: '4%', width: '38%', height: '38%' }
  },
  {
    id: 'library',
    name: 'ProCollege Cloud Repository',
    badge: 'Knowledge Vault',
    module: 'Institutional Library',
    metric: '14,200+ Syllabus Resources & Notes',
    subMetric: 'Instant offline sync & verified course packs',
    accentHex: '#6366F1',
    accentBg: 'bg-indigo-500/20 text-indigo-300',
    accentBorder: 'border-indigo-500/40',
    icon: <BookOpen className="w-4 h-4 text-indigo-400" />,
    beaconPos: { x: 215, y: 260 },
    desktopPos: { top: '8%', left: '4%' },
    hotspot: { top: '8%', left: '4%', width: '38%', height: '38%' }
  }
];

export const CampusEcosystemGraphic: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeHubIndex, setActiveHubIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState({ rotateX: 0, rotateY: 0 });

  // Auto-Rolling Interval: Cycles through hubs every 3.8s smoothly
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveHubIndex(prev => (prev + 1) % CAMPUS_HUBS.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isPaused]);

  const activeHub = CAMPUS_HUBS[activeHubIndex];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({
      rotateY: x * 6,
      rotateX: -y * 6
    });
  };

  const handleMouseLeave = () => {
    setMousePos({ rotateX: 0, rotateY: 0 });
    setIsPaused(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full aspect-[1058/822] max-w-[680px] lg:max-w-[760px] mx-auto select-none perspective-[1200px]"
    >
      {/* 3D Parallax & Floating Motion Wrapper */}
      <motion.div
        animate={{
          y: [-5, 5, -5],
          rotateX: mousePos.rotateX,
          rotateY: mousePos.rotateY
        }}
        transition={{
          y: { repeat: Infinity, duration: 6, ease: 'easeInOut' },
          rotateX: { type: 'spring', stiffness: 120, damping: 20 },
          rotateY: { type: 'spring', stiffness: 120, damping: 20 }
        }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full h-full"
      >
        {/* --- 1. Symmetrical Central Earth Atmosphere Halo (Behinds Globe) --- */}
        <div
          className="absolute top-[44.8%] left-[49.2%] -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full pointer-events-none -z-10"
          style={{
            background: 'radial-gradient(circle, rgba(0, 240, 255, 0.4) 0%, rgba(99, 102, 241, 0.22) 45%, rgba(168, 85, 247, 0) 70%)',
            filter: 'blur(24px)',
            animation: 'earthPulse 4s ease-in-out infinite'
          }}
        />

        {/* --- 2. Pristine Ultra-HD 3D Campus Isometric Ecosystem Illustration --- */}
        <img
          src="/hero-campus-feathered-hd.png"
          srcSet="/hero-campus-feathered-hd.png 2x, /hero-campus-feathered.png 1x"
          alt="ProCollege Connected Campus Ecosystem"
          className="w-full h-full object-contain pointer-events-none drop-shadow-[0_24px_50px_rgba(79,70,229,0.18)]"
          style={{
            imageRendering: '-webkit-optimize-contrast',
            filter: 'contrast(1.05) saturate(1.10) brightness(1.01)'
          }}
          draggable={false}
        />

        {/* --- 3. Interactive Hotspot Zones on 3D Buildings --- */}
        {CAMPUS_HUBS.map((hub, idx) => (
          <div
            key={`hotspot-${hub.id}`}
            onClick={() => setActiveHubIndex(idx)}
            onMouseEnter={() => {
              setActiveHubIndex(idx);
              setIsPaused(true);
            }}
            onMouseLeave={() => setIsPaused(false)}
            className="absolute cursor-pointer rounded-3xl z-20 group transition-all"
            style={{
              top: hub.hotspot.top,
              left: hub.hotspot.left,
              width: hub.hotspot.width,
              height: hub.hotspot.height
            }}
            aria-label={`View ${hub.name}`}
          />
        ))}

        {/* --- 4. Mathematically Centered Concentric Orbital Streams & Radar Beacons (SVG) --- */}
        <svg
          viewBox="0 0 1058 822"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          shapeRendering="geometricPrecision"
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        >
          <defs>
            <radialGradient id="photonRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="40%" stopColor="#00F0FF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="photonPinkRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="40%" stopColor="#EC4899" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="orbitGlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#A855F7" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Symmetrically Centered Globe Perspective Orbit Ring (Globe center X=520, Y=368) */}
          <ellipse
            cx="520"
            cy="368"
            rx="145"
            ry="50"
            stroke="url(#orbitGlowGradient)"
            strokeWidth="1.8"
            strokeDasharray="6 8"
            className="opacity-75"
          />

          {/* Symmetrical Orbiting Particle */}
          <circle r="4" fill="url(#photonRadial)">
            <animateMotion
              repeatCount="indefinite"
              dur="12s"
              path="M 375,368 A 145,50 0 1,0 665,368 A 145,50 0 1,0 375,368"
            />
          </circle>

          {/* Stream 1: Globe -> Digital Library (Top-Left) */}
          <path
            d="M 450,330 C 370,290 290,260 210,240"
            stroke="rgba(0, 240, 255, 0.45)"
            strokeWidth="2"
            strokeDasharray="6 8"
          />
          {/* Stream 2: Globe -> Science & AI Lab (Top-Right) */}
          <path
            d="M 590,330 C 680,280 770,270 860,250"
            stroke="rgba(0, 240, 255, 0.5)"
            strokeWidth="2"
            strokeDasharray="6 8"
          />
          {/* Stream 3: Globe -> Administration Suite (Bottom-Left) */}
          <path
            d="M 450,420 C 360,460 280,510 210,560"
            stroke="rgba(16, 185, 129, 0.5)"
            strokeWidth="2"
            strokeDasharray="6 8"
          />
          {/* Stream 4: Globe -> Smart Classroom (Bottom-Right) */}
          <path
            d="M 590,420 C 670,460 740,510 820,560"
            stroke="rgba(168, 85, 247, 0.5)"
            strokeWidth="2"
            strokeDasharray="6 8"
          />

          {/* Traveling White-Hot Photons along data conduits */}
          <circle r="4.5" fill="url(#photonRadial)">
            <animateMotion repeatCount="indefinite" dur="2.4s" path="M 450,330 C 370,290 290,260 210,240" />
          </circle>
          <circle r="4.5" fill="url(#photonRadial)">
            <animateMotion repeatCount="indefinite" dur="2.8s" path="M 590,330 C 680,280 770,270 860,250" />
          </circle>
          <circle r="4.5" fill="url(#photonRadial)">
            <animateMotion repeatCount="indefinite" dur="2.2s" path="M 450,420 C 360,460 280,510 210,560" />
          </circle>
          <circle r="4.5" fill="url(#photonPinkRadial)">
            <animateMotion repeatCount="indefinite" dur="2.6s" path="M 590,420 C 670,460 740,510 820,560" />
          </circle>

          {/* Active Hub Radar Beacon Ping on the 3D Building */}
          <g transform={`translate(${activeHub.beaconPos.x}, ${activeHub.beaconPos.y})`}>
            <circle
              r="22"
              fill="none"
              stroke={activeHub.accentHex}
              strokeWidth="2"
              className="animate-ping"
              opacity="0.6"
            />
            <circle
              r="10"
              fill={activeHub.accentHex}
              opacity="0.35"
            />
            <circle
              r="5"
              fill={activeHub.accentHex}
            />
            <circle
              r="2"
              fill="#FFFFFF"
            />
          </g>
        </svg>

        {/* --- 5. THE ROLLING POPOVER (Auto-Cycling Campus Station Card) --- */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="absolute z-30 transition-all duration-500 ease-out sm:block pointer-events-auto"
          style={{
            top: activeHub.desktopPos.top,
            left: activeHub.desktopPos.left,
            maxWidth: '310px',
            width: 'calc(100% - 24px)'
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeHub.id}
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="bg-slate-900/90 backdrop-blur-xl border border-white/15 ring-1 ring-white/10 shadow-[0_20px_45px_rgba(15,23,42,0.5)] rounded-2xl p-3.5 sm:p-4 text-left relative overflow-hidden"
            >
              {/* Top Accent Light Beam */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${activeHub.accentHex} 50%, transparent 100%)`
                }}
              />

              {/* Header: Icon, Name & Live Sync Pill */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg border flex-shrink-0 ${activeHub.accentBg} ${activeHub.accentBorder}`}
                  >
                    {activeHub.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                      {activeHub.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {activeHub.badge}
                    </p>
                  </div>
                </div>

                {/* Live Pulse Indicator */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>

              {/* Metric Breakdown */}
              <div className="bg-slate-800/60 rounded-xl p-2.5 mb-2.5 border border-white/5">
                <p className="text-xs font-semibold text-slate-100 flex items-center justify-between">
                  <span>{activeHub.metric}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {activeHub.subMetric}
                </p>
              </div>

              {/* Station Indicators: 4 interactive pills for rolling status */}
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  {CAMPUS_HUBS.map((hub, idx) => (
                    <button
                      key={`pill-${hub.id}`}
                      type="button"
                      onClick={() => setActiveHubIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === activeHubIndex
                          ? 'w-6 bg-white'
                          : 'w-2 bg-slate-600 hover:bg-slate-400'
                      }`}
                      title={hub.name}
                      aria-label={`Jump to ${hub.name}`}
                    />
                  ))}
                </div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                  Station {activeHubIndex + 1}/4
                </span>
              </div>

              {/* Smooth 3.8s Rolling Progress Bar at Bottom */}
              <motion.div
                key={`progress-${activeHubIndex}-${isPaused}`}
                initial={{ width: '0%' }}
                animate={{ width: isPaused ? '0%' : '100%' }}
                transition={{ duration: 3.8, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-[2.5px]"
                style={{ backgroundColor: activeHub.accentHex }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
