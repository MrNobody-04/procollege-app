import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export const CampusEcosystemGraphic: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({
      rotateY: x * 7, // Subtle organic 3D parallax tilt
      rotateX: -y * 7
    });
  };

  const handleMouseLeave = () => {
    setMousePos({ rotateX: 0, rotateY: 0 });
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
        {/* --- 1. Central Ambient Atmosphere Halo (Positioned BEHIND globe to preserve artwork clarity) --- */}
        <div
          className="absolute top-[43%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full pointer-events-none -z-10"
          style={{
            background: 'radial-gradient(circle, rgba(0, 240, 255, 0.4) 0%, rgba(99, 102, 241, 0.2) 45%, rgba(168, 85, 247, 0) 70%)',
            filter: 'blur(22px)',
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

        {/* --- 3. Luminous Fiber-Optic Energy Stream Traveling Photons (Vector SVG Layer) --- */}
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
          </defs>

          {/* Stream 1: Globe -> Digital Library (Top-Left) */}
          <path
            d="M 450,330 C 370,290 290,260 210,240"
            stroke="rgba(0, 240, 255, 0.45)"
            strokeWidth="2"
            strokeDasharray="6 8"
            className="animate-pulse"
          />
          <path
            d="M 440,360 C 350,320 280,290 200,270"
            stroke="rgba(99, 102, 241, 0.4)"
            strokeWidth="1.8"
            strokeDasharray="4 6"
          />

          {/* Stream 2: Globe -> Science & AI Lab (Top-Right) */}
          <path
            d="M 590,330 C 680,280 770,270 860,250"
            stroke="rgba(0, 240, 255, 0.5)"
            strokeWidth="2"
            strokeDasharray="6 8"
            className="animate-pulse"
          />
          <path
            d="M 600,360 C 690,320 780,310 870,290"
            stroke="rgba(236, 72, 153, 0.45)"
            strokeWidth="1.8"
            strokeDasharray="4 6"
          />

          {/* Stream 3: Globe -> Administration Suite (Bottom-Left) */}
          <path
            d="M 450,420 C 360,460 280,510 210,560"
            stroke="rgba(16, 185, 129, 0.5)"
            strokeWidth="2"
            strokeDasharray="6 8"
            className="animate-pulse"
          />
          <path
            d="M 470,450 C 390,490 310,540 230,590"
            stroke="rgba(0, 240, 255, 0.4)"
            strokeWidth="1.8"
            strokeDasharray="4 6"
          />

          {/* Stream 4: Globe -> Smart Classroom (Bottom-Right) */}
          <path
            d="M 590,420 C 670,460 740,510 820,560"
            stroke="rgba(168, 85, 247, 0.5)"
            strokeWidth="2"
            strokeDasharray="6 8"
            className="animate-pulse"
          />
          <path
            d="M 570,450 C 650,490 720,540 800,590"
            stroke="rgba(236, 72, 153, 0.45)"
            strokeWidth="1.8"
            strokeDasharray="4 6"
          />

          {/* Animated Flowing Photons (White-hot energy packets traveling continuously along conduits) */}
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
        </svg>
      </motion.div>
    </div>
  );
};
