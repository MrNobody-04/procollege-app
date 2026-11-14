import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Cpu, Building2, GraduationCap, ArrowUpRight } from 'lucide-react';

interface HubHotspot {
  id: string;
  name: string;
  category: string;
  metric: string;
  color: string;
  borderCol: string;
  icon: React.ReactNode;
  position: { top: string; left: string }; // Position of the badge tooltip
  hotspot: { top: string; left: string; width: string; height: string }; // Hoverable area
}

const HUBS: HubHotspot[] = [
  {
    id: 'library',
    name: 'Digital Library',
    category: 'Knowledge Vault',
    metric: '14,200+ Books & Journals Cached',
    color: '#6366f1',
    borderCol: 'border-indigo-400/40',
    icon: <BookOpen className="w-4 h-4 text-indigo-400" />,
    position: { top: '12%', left: '8%' },
    hotspot: { top: '8%', left: '4%', width: '30%', height: '32%' }
  },
  {
    id: 'lab',
    name: 'Science & AI Lab',
    category: 'Quantum Computing',
    metric: '32 GPU Nodes Synced • 99.8% Online',
    color: '#00f0ff',
    borderCol: 'border-cyan-400/40',
    icon: <Cpu className="w-4 h-4 text-cyan-400" />,
    position: { top: '12%', left: '64%' },
    hotspot: { top: '8%', left: '56%', width: '32%', height: '32%' }
  },
  {
    id: 'admin',
    name: 'Administration Suite',
    category: 'Campus Gatekeeper',
    metric: 'Attendance Standings: 98.4% Safe',
    color: '#10b981',
    borderCol: 'border-emerald-400/40',
    icon: <Building2 className="w-4 h-4 text-emerald-400" />,
    position: { top: '68%', left: '6%' },
    hotspot: { top: '52%', left: '2%', width: '32%', height: '36%' }
  },
  {
    id: 'classroom',
    name: 'Smart Classroom',
    category: 'Live Amphitheater',
    metric: 'CS 301 In Session • 48 Students',
    color: '#a855f7',
    borderCol: 'border-purple-400/40',
    icon: <GraduationCap className="w-4 h-4 text-purple-400" />,
    position: { top: '68%', left: '64%' },
    hotspot: { top: '54%', left: '54%', width: '34%', height: '36%' }
  }
];

export const CampusEcosystemGraphic: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredHub, setHoveredHub] = useState<HubHotspot | null>(null);
  const [mousePos, setMousePos] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({
      rotateY: x * 8, // subtle 3D tilt up to 8 deg
      rotateX: -y * 8
    });
  };

  const handleMouseLeave = () => {
    setMousePos({ rotateX: 0, rotateY: 0 });
    setHoveredHub(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full aspect-[1058/822] max-w-[680px] lg:max-w-[740px] mx-auto select-none perspective-[1200px]"
    >
      {/* 3D Parallax & Organic Floating Motion Wrapper */}
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
        {/* --- 1. Pristine 3D Campus Isometric Ecosystem Illustration --- */}
        <img
          src="/hero-campus-feathered.png"
          alt="ProSchool 3D Connected Campus Ecosystem"
          className="w-full h-full object-contain filter drop-shadow-[0_20px_45px_rgba(79,70,229,0.12)] pointer-events-none"
          draggable={false}
        />

        {/* --- 2. Central Earth Radiant Atmosphere & Halo Glow Pulse --- */}
        <div
          className="absolute top-[41%] left-[49.5%] -translate-x-1/2 -translate-y-1/2 w-[185px] h-[185px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(0, 240, 255, 0.35) 0%, rgba(99, 102, 241, 0.2) 45%, rgba(168, 85, 247, 0) 70%)',
            filter: 'blur(12px)',
            animation: 'earthPulse 4s ease-in-out infinite'
          }}
        />

        {/* Orbiting Gimbal Laser Flare Shimmer */}
        <div
          className="absolute top-[41%] left-[49.5%] -translate-x-1/2 -translate-y-1/2 w-[220px] h-[110px] rounded-[100%] border border-cyan-400/40 pointer-events-none"
          style={{
            transform: 'translate(-50%, -50%) rotate(-25deg)',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.3), inset 0 0 15px rgba(0, 240, 255, 0.2)',
            animation: 'orbitSpin 18s linear infinite'
          }}
        />

        {/* --- 3. Luminous Fiber-Optic Energy Stream Traveling Photons (SVG Layer) --- */}
        <svg
          viewBox="0 0 1058 822"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            {/* Glowing Gradient Filters */}
            <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowPink" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="photonRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="40%" stopColor="#00F0FF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="photonPinkRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="40%" stopColor="#EC4899" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Stream 1: Globe -> Digital Library (Top-Left) */}
          <path
            id="streamLib1"
            d="M 450,330 C 370,290 290,260 210,240"
            stroke="rgba(0, 240, 255, 0.5)"
            strokeWidth="2"
            strokeDasharray="6 8"
            className="animate-pulse"
          />
          <path
            id="streamLib2"
            d="M 440,360 C 350,320 280,290 200,270"
            stroke="rgba(99, 102, 241, 0.45)"
            strokeWidth="1.8"
            strokeDasharray="4 6"
          />

          {/* Stream 2: Globe -> Science & AI Lab (Top-Right) */}
          <path
            id="streamLab1"
            d="M 590,330 C 680,280 770,270 860,250"
            stroke="rgba(0, 240, 255, 0.55)"
            strokeWidth="2"
            strokeDasharray="6 8"
            className="animate-pulse"
          />
          <path
            id="streamLab2"
            d="M 600,360 C 690,320 780,310 870,290"
            stroke="rgba(236, 72, 153, 0.5)"
            strokeWidth="1.8"
            strokeDasharray="4 6"
          />

          {/* Stream 3: Globe -> Administration Suite (Bottom-Left) */}
          <path
            id="streamAdmin1"
            d="M 450,420 C 360,460 280,510 210,560"
            stroke="rgba(16, 185, 129, 0.55)"
            strokeWidth="2"
            strokeDasharray="6 8"
            className="animate-pulse"
          />
          <path
            id="streamAdmin2"
            d="M 470,450 C 390,490 310,540 230,590"
            stroke="rgba(0, 240, 255, 0.45)"
            strokeWidth="1.8"
            strokeDasharray="4 6"
          />

          {/* Stream 4: Globe -> Smart Classroom (Bottom-Right) */}
          <path
            id="streamClass1"
            d="M 590,420 C 670,460 740,510 820,560"
            stroke="rgba(168, 85, 247, 0.55)"
            strokeWidth="2"
            strokeDasharray="6 8"
            className="animate-pulse"
          />
          <path
            id="streamClass2"
            d="M 570,450 C 650,490 720,540 800,590"
            stroke="rgba(236, 72, 153, 0.5)"
            strokeWidth="1.8"
            strokeDasharray="4 6"
          />

          {/* Animated Flowing Photons (White-hot energy packets) */}
          <circle r="4.5" fill="url(#photonRadial)" filter="url(#glowCyan)">
            <animateMotion repeatCount="indefinite" dur="2.4s" path="M 450,330 C 370,290 290,260 210,240" />
          </circle>
          <circle r="4.5" fill="url(#photonRadial)" filter="url(#glowCyan)">
            <animateMotion repeatCount="indefinite" dur="2.8s" path="M 590,330 C 680,280 770,270 860,250" />
          </circle>
          <circle r="4.5" fill="url(#photonRadial)" filter="url(#glowCyan)">
            <animateMotion repeatCount="indefinite" dur="2.2s" path="M 450,420 C 360,460 280,510 210,560" />
          </circle>
          <circle r="4.5" fill="url(#photonPinkRadial)" filter="url(#glowPink)">
            <animateMotion repeatCount="indefinite" dur="2.6s" path="M 590,420 C 670,460 740,510 820,560" />
          </circle>
        </svg>

        {/* --- 4. Interactive Hover Hotspots & Floating Micro-Badges --- */}
        {HUBS.map((hub) => (
          <div
            key={hub.id}
            onMouseEnter={() => setHoveredHub(hub)}
            onMouseLeave={() => setHoveredHub(null)}
            style={{
              top: hub.hotspot.top,
              left: hub.hotspot.left,
              width: hub.hotspot.width,
              height: hub.hotspot.height
            }}
            className="absolute z-20 cursor-pointer rounded-3xl"
          >
            {/* Subtle Hover Bloom on the Hub */}
            <div
              className={`w-full h-full rounded-3xl transition-opacity duration-300 pointer-events-none ${
                hoveredHub?.id === hub.id ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background: `radial-gradient(circle, ${hub.color}30 0%, transparent 70%)`
              }}
            />
          </div>
        ))}

        {/* Floating Glassmorphic Telemetry Tooltip when Hovering any Hub */}
        <AnimatePresence>
          {hoveredHub && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              style={{
                top: hoveredHub.position.top,
                left: hoveredHub.position.left
              }}
              className={`absolute z-30 pointer-events-none p-3.5 rounded-2xl bg-zinc-950/90 text-white backdrop-blur-xl border ${hoveredHub.borderCol} shadow-[0_15px_35px_rgba(0,0,0,0.5)] min-w-[240px] max-w-[280px] space-y-1.5`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${hoveredHub.color}25` }}
                  >
                    {hoveredHub.icon}
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-white tracking-tight">
                      {hoveredHub.name}
                    </h5>
                    <p className="text-[10px] text-zinc-400 font-medium">
                      {hoveredHub.category}
                    </p>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-zinc-300 font-medium leading-tight">
                {hoveredHub.metric}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-[10px] text-zinc-400">
                <span className="text-emerald-400 font-semibold">Active &amp; Synced</span>
                <span className="text-indigo-400 font-semibold flex items-center gap-0.5">
                  Inspect <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
