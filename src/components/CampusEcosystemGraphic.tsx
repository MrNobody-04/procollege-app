import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Cpu, Building2, GraduationCap, Wifi, Zap, Activity, ShieldCheck, ArrowRight, Sparkles, Layers } from 'lucide-react';

type HubType = 'all' | 'library' | 'lab' | 'admin' | 'lecture';

interface HubDetail {
  id: HubType;
  name: string;
  badge: string;
  category: string;
  color: string;
  borderCol: string;
  glowCol: string;
  icon: React.ReactNode;
  metricLabel: string;
  metricValue: string;
  subText: string;
  statusText: string;
  gatekeeperStatus: string;
}

const HUB_INFO: Record<Exclude<HubType, 'all'>, HubDetail> = {
  library: {
    id: 'library',
    name: 'Digital Knowledge Vault',
    badge: 'Digital Library',
    category: 'Research & Archive Hub',
    color: '#6366f1',
    borderCol: 'border-indigo-400/40',
    glowCol: 'rgba(99,102,241,0.25)',
    icon: <BookOpen className="w-4 h-4 text-indigo-400" />,
    metricLabel: 'Cataloged Assets',
    metricValue: '14,200+ Books & Journals',
    subText: 'Real-time multi-campus CDN cache with instant e-reader synchronization.',
    statusText: '100% Operational • 12ms latency',
    gatekeeperStatus: 'Unrestricted Academic Access'
  },
  lab: {
    id: 'lab',
    name: 'AI & Computational Cluster',
    badge: 'Science & AI Lab',
    category: 'Advanced Simulation Suite',
    color: '#00f0ff',
    borderCol: 'border-cyan-400/40',
    glowCol: 'rgba(0,240,255,0.25)',
    icon: <Cpu className="w-4 h-4 text-cyan-400" />,
    metricLabel: 'Active Workstations',
    metricValue: '32 GPU Nodes Synced',
    subText: 'Physics, Chemistry & Machine Learning sandboxes running in edge containers.',
    statusText: 'Cluster Compute • 99.8% Online',
    gatekeeperStatus: 'Quota Gatekeeper: Verified'
  },
  admin: {
    id: 'admin',
    name: 'Campus Gatekeeper Suite',
    badge: 'Administration Suite',
    category: 'Multi-Tenant Governance',
    color: '#10b981',
    borderCol: 'border-emerald-400/40',
    glowCol: 'rgba(16,185,129,0.25)',
    icon: <Building2 className="w-4 h-4 text-emerald-400" />,
    metricLabel: 'Attendance Standing',
    metricValue: '98.4% Safe Aggregate',
    subText: 'Biometric & roll-call gateway with auto-locking for university assignments.',
    statusText: 'Dual-Vault 2FA Active • Real-Time Sync',
    gatekeeperStatus: 'Attendance Filter: Enforced (>=75%)'
  },
  lecture: {
    id: 'lecture',
    name: 'Smart Amphitheater',
    badge: 'Smart Classroom',
    category: 'Interactive Live Learning',
    color: '#a855f7',
    borderCol: 'border-purple-400/40',
    glowCol: 'rgba(168,85,247,0.25)',
    icon: <GraduationCap className="w-4 h-4 text-purple-400" />,
    metricLabel: 'Current Session',
    metricValue: 'CS 301: Advanced Algorithms',
    subText: 'Real-time student polling, attendance tracking, and HD interactive streaming.',
    statusText: 'Live In Session • 48 Students',
    gatekeeperStatus: 'Assignment Submissions: Unlocked'
  }
};

export const CampusEcosystemGraphic: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeFilter, setActiveFilter] = useState<HubType>('all');
  const [hoveredHub, setHoveredHub] = useState<Exclude<HubType, 'all'> | null>(null);

  // Store 3D scene elements to respond dynamically to filters
  const sceneStateRef = useRef<{
    targetRotY: number;
    targetRotX: number;
    highlightHub: (hub: HubType) => void;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // --- 1. Scene, Camera & High-Performance WebGL Setup ---
    const scene = new THREE.Scene();

    const width = container.clientWidth || 680;
    const height = container.clientHeight || 560;

    // Telephoto isometric perspective (FOV 30 for authentic isometric compression)
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    camera.position.set(12, 14.5, 18);
    camera.lookAt(0, 0.2, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Master Group for Mouse Parallax
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // --- 2. Vibrant Multi-Directional Lighting (Key, Cyan Fill, Magenta Rim, Warm Accent) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(14, 25, 14);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    scene.add(keyLight);

    const cyanFill = new THREE.DirectionalLight(0x00f0ff, 2.2);
    cyanFill.position.set(-18, 12, -12);
    scene.add(cyanFill);

    const magentaRim = new THREE.DirectionalLight(0xec4899, 2.0);
    magentaRim.position.set(8, -8, -16);
    scene.add(magentaRim);

    const goldAccent = new THREE.DirectionalLight(0xfbbf24, 1.2);
    goldAccent.position.set(-6, -4, 14);
    scene.add(goldAccent);

    // --- 3. Ground Platform: Concentric Radar Waves, Glass Base & Holographic Grid ---
    // Soft radial ground disc
    const groundBaseGeo = new THREE.CircleGeometry(13.5, 64);
    const groundBaseMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.05
    });
    const groundBase = new THREE.Mesh(groundBaseGeo, groundBaseMat);
    groundBase.rotation.x = -Math.PI / 2;
    groundBase.position.y = -3.4;
    masterGroup.add(groundBase);

    // Dynamic Concentric Energy Rings
    const groundRings: { mesh: THREE.Mesh; baseRadius: number; phase: number }[] = [];
    const ringRadii = [3.2, 5.5, 7.8, 10.2, 12.4];
    ringRadii.forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r, r + 0.06, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx % 2 === 0 ? 0x00f0ff : 0xec4899,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = -3.38;
      masterGroup.add(ringMesh);
      groundRings.push({ mesh: ringMesh, baseRadius: r, phase: idx * 0.8 });
    });

    // Ambient Cyber Dust Floating Particles (120 particles)
    const dustCount = 120;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 22;
      dustPositions[i * 3 + 1] = (Math.random() - 0.3) * 10;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 22;

      const c = new THREE.Color(
        i % 3 === 0 ? 0x00f0ff : i % 3 === 1 ? 0xec4899 : 0xa855f7
      );
      dustColors[i * 3] = c.r;
      dustColors[i * 3 + 1] = c.g;
      dustColors[i * 3 + 2] = c.b;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    masterGroup.add(dustPoints);

    // --- 4. Radiant Central Earth Globe Texture (High-Def Glowing Ocean & Continents) ---
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = 2048;
    mapCanvas.height = 1024;
    const ctx = mapCanvas.getContext('2d')!;

    // Vibrant Luminous Ocean Gradient (Deep Royal Sapphire to Turquoise Horizon)
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    oceanGrad.addColorStop(0, '#0a1d4a');
    oceanGrad.addColorStop(0.35, '#0c2e6b');
    oceanGrad.addColorStop(0.5, '#0e3a82');
    oceanGrad.addColorStop(0.7, '#082558');
    oceanGrad.addColorStop(1, '#051433');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 2048, 1024);

    // High-Tech Cyber Grid (Latitude / Longitude with Specular Glow)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 1.4;
    for (let x = 0; x < 2048; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }
    for (let y = 0; y < 1024; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(2048, y);
      ctx.stroke();
    }

    // Equator Glowing Line
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 512);
    ctx.lineTo(2048, 512);
    ctx.stroke();

    // Continent Outlines & Land Fill Function
    const drawContinent = (points: number[][], landColor: string, borderColor: string) => {
      // Land shadow/glow
      ctx.shadowColor = borderColor;
      ctx.shadowBlur = 14;
      ctx.fillStyle = landColor;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 3.5;

      ctx.beginPath();
      ctx.moveTo(points[0][0] * 2, points[0][1] * 2);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0] * 2, points[i][1] * 2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // Realistic Scaled Continents (Illuminated in High-Contrast Futuristic Cyan & Teal)
    const landBase = '#0f274a';
    const landBorder = '#38bdf8';

    // North America
    drawContinent(
      [[70, 70], [140, 50], [210, 80], [260, 130], [220, 190], [170, 230], [120, 250], [90, 200], [60, 130]],
      landBase,
      landBorder
    );
    // South America
    drawContinent(
      [[170, 260], [230, 270], [250, 340], [220, 430], [180, 440], [150, 360], [140, 290]],
      landBase,
      landBorder
    );
    // Europe
    drawContinent(
      [[420, 80], [490, 70], [530, 110], [510, 160], [450, 160], [410, 120]],
      landBase,
      landBorder
    );
    // Africa
    drawContinent(
      [[430, 180], [520, 170], [560, 260], [530, 370], [470, 390], [440, 340], [400, 240]],
      landBase,
      landBorder
    );
    // Asia (Eurasia)
    drawContinent(
      [[540, 70], [720, 50], [830, 100], [850, 180], [790, 240], [680, 240], [560, 180]],
      landBase,
      landBorder
    );
    // South Asia / Indian Subcontinent (Nepal / South Asia Highlight)
    drawContinent(
      [[640, 190], [690, 195], [680, 275], [635, 235]],
      '#1e40af',
      '#00f0ff'
    );
    // Australia
    drawContinent(
      [[740, 320], [840, 310], [850, 390], [780, 410], [730, 370]],
      landBase,
      landBorder
    );

    // City Light Constellations (80+ Glowing Amber & Cyan Academic Nodes)
    const cities = [
      [140, 120], [180, 110], [210, 140], [170, 190], [190, 300], [220, 350],
      [440, 110], [480, 100], [510, 130], [470, 230], [500, 290], [520, 340],
      [665, 205], // Nepal / ProSchool Node
      [650, 180], [680, 160], [720, 110], [760, 140], [800, 170], [780, 210],
      [770, 340], [810, 360], [820, 330]
    ];

    cities.forEach(([cx, cy], i) => {
      const isHub = i === 12; // Nepal node
      const rad = isHub ? 8 : 4;
      const col = isHub ? '#fbbf24' : i % 2 === 0 ? '#00f0ff' : '#fef08a';

      // Outer aura
      ctx.fillStyle = isHub ? 'rgba(251, 191, 36, 0.5)' : 'rgba(0, 240, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(cx * 2, cy * 2, rad * 3, 0, Math.PI * 2);
      ctx.fill();

      // Core point
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(cx * 2, cy * 2, rad, 0, Math.PI * 2);
      ctx.fill();
    });

    // Great Circle Intercontinental Flight & Data Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(180 * 2, 110 * 2);
    ctx.quadraticCurveTo(330 * 2, 40 * 2, 480 * 2, 100 * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(480 * 2, 100 * 2);
    ctx.quadraticCurveTo(570 * 2, 80 * 2, 665 * 2, 205 * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(665 * 2, 205 * 2);
    ctx.quadraticCurveTo(750 * 2, 230 * 2, 780 * 2, 340 * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const earthTexture = new THREE.CanvasTexture(mapCanvas);
    earthTexture.wrapS = THREE.RepeatWrapping;
    earthTexture.wrapT = THREE.ClampToEdgeWrapping;

    // --- 5. Central 3D Globe with Multi-Layer Atmosphere & Chrome Gimbal ---
    const globeRadius = 2.45;
    const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.22,
      metalness: 0.35,
      emissive: 0x0c2554,
      emissiveIntensity: 0.85
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeMesh.position.set(0, 0.6, 0);
    globeMesh.castShadow = true;
    masterGroup.add(globeMesh);

    // Inner Glowing Cyan Atmosphere Shell
    const atmoInnerGeo = new THREE.SphereGeometry(globeRadius * 1.05, 32, 32);
    const atmoInnerMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const atmoInner = new THREE.Mesh(atmoInnerGeo, atmoInnerMat);
    atmoInner.position.copy(globeMesh.position);
    masterGroup.add(atmoInner);

    // Outer Electric Violet Atmosphere Shell
    const atmoOuterGeo = new THREE.SphereGeometry(globeRadius * 1.14, 32, 32);
    const atmoOuterMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const atmoOuter = new THREE.Mesh(atmoOuterGeo, atmoOuterMat);
    atmoOuter.position.copy(globeMesh.position);
    masterGroup.add(atmoOuter);

    // Chrome Base Ring Pedestal
    const baseStandGeo = new THREE.CylinderGeometry(1.85, 2.1, 0.35, 32);
    const baseStandMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.9,
      roughness: 0.15
    });
    const baseStand = new THREE.Mesh(baseStandGeo, baseStandMat);
    baseStand.position.set(0, -1.35, 0);
    baseStand.receiveShadow = true;
    masterGroup.add(baseStand);

    // Neon Cyan LED Underglow Ring on Pedestal
    const baseNeonGeo = new THREE.TorusGeometry(1.95, 0.08, 16, 64);
    const baseNeonMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.95
    });
    const baseNeon = new THREE.Mesh(baseNeonGeo, baseNeonMat);
    baseNeon.rotation.x = Math.PI / 2;
    baseNeon.position.set(0, -1.3, 0);
    masterGroup.add(baseNeon);

    // Two Orbiting Gimbal Rings with Laser Streaks
    const gimbal1Geo = new THREE.RingGeometry(3.6, 3.68, 64);
    const gimbal1Mat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const gimbal1 = new THREE.Mesh(gimbal1Geo, gimbal1Mat);
    gimbal1.rotation.x = Math.PI / 2.3;
    gimbal1.position.copy(globeMesh.position);
    masterGroup.add(gimbal1);

    const gimbal2Geo = new THREE.RingGeometry(4.5, 4.56, 64);
    const gimbal2Mat = new THREE.MeshBasicMaterial({
      color: 0xec4899,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const gimbal2 = new THREE.Mesh(gimbal2Geo, gimbal2Mat);
    gimbal2.rotation.x = Math.PI / 2.5;
    gimbal2.rotation.y = Math.PI / 6;
    gimbal2.position.copy(globeMesh.position);
    masterGroup.add(gimbal2);

    // --- 6. The 4 Rich Architectural Campus Hub Dioramas ---
    const hubGroups: Record<Exclude<HubType, 'all'>, THREE.Group> = {
      library: new THREE.Group(),
      lab: new THREE.Group(),
      admin: new THREE.Group(),
      lecture: new THREE.Group()
    };

    const createArchitecturalHub = (
      type: Exclude<HubType, 'all'>,
      colorHex: number,
      builder: (g: THREE.Group) => void
    ) => {
      const g = hubGroups[type];

      // 1. Polished Architectural Foundation Slab (Thick Beveled Isometric Base)
      const slabGeo = new THREE.BoxGeometry(3.4, 0.42, 3.4);
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.15,
        metalness: 0.12
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.castShadow = true;
      slab.receiveShadow = true;
      g.add(slab);

      // 2. High-Tech Vibrant LED Perimeter Underglow
      const ledGeo = new THREE.BoxGeometry(3.48, 0.1, 3.48);
      const ledMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.95
      });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.y = -0.16;
      g.add(led);

      // 3. Architectural Frosted Glass Walls
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.38,
        roughness: 0.05,
        transmission: 0.92,
        thickness: 0.8
      });

      const backWallGeo = new THREE.BoxGeometry(3.4, 2.3, 0.08);
      const backWall = new THREE.Mesh(backWallGeo, glassMat);
      backWall.position.set(0, 1.15, -1.66);
      g.add(backWall);

      const sideWallGeo = new THREE.BoxGeometry(0.08, 2.3, 3.4);
      const sideWall = new THREE.Mesh(sideWallGeo, glassMat);
      sideWall.position.set(-1.66, 1.15, 0);
      g.add(sideWall);

      // Top Chrome Railing
      const railGeo = new THREE.BoxGeometry(3.44, 0.06, 0.08);
      const railMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
      const railBack = new THREE.Mesh(railGeo, railMat);
      railBack.position.set(0, 2.32, -1.66);
      g.add(railBack);

      const railSideGeo = new THREE.BoxGeometry(0.08, 0.06, 3.44);
      const railSide = new THREE.Mesh(railSideGeo, railMat);
      railSide.position.set(-1.66, 2.32, 0);
      g.add(railSide);

      // Interior architectural custom elements
      builder(g);

      masterGroup.add(g);
      return g;
    };

    // --- HUB 1: Digital Library (Top-Left) ---
    createArchitecturalHub('library', 0x6366f1, (room) => {
      // Modern High-Capacity Bookshelf
      const shelfGeo = new THREE.BoxGeometry(2.8, 1.9, 0.45);
      const shelfMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.25 });
      const shelf = new THREE.Mesh(shelfGeo, shelfMat);
      shelf.position.set(0, 1.05, -1.4);
      room.add(shelf);

      // Shelving dividers
      const bookColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0x06b6d4, 0xec4899];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 9; col++) {
          const bGeo = new THREE.BoxGeometry(0.18, 0.48, 0.32);
          const bMat = new THREE.MeshStandardMaterial({
            color: bookColors[(row * 9 + col) % bookColors.length],
            roughness: 0.3
          });
          const b = new THREE.Mesh(bGeo, bMat);
          b.position.set(-1.05 + col * 0.26, 0.42 + row * 0.58, -1.34);
          room.add(b);
        }
      }

      // Reading desk & Glowing Laptops
      const deskGeo = new THREE.BoxGeometry(1.8, 0.52, 0.85);
      const deskMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
      const desk = new THREE.Mesh(deskGeo, deskMat);
      desk.position.set(0.3, 0.46, 0.2);
      room.add(desk);

      // Laptop 1
      const lap1Geo = new THREE.BoxGeometry(0.42, 0.3, 0.04);
      const lap1Mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const lap1 = new THREE.Mesh(lap1Geo, lap1Mat);
      lap1.position.set(0.0, 0.88, 0.2);
      lap1.rotation.x = -Math.PI / 8;
      room.add(lap1);

      // Laptop 2
      const lap2 = new THREE.Mesh(lap1Geo, new THREE.MeshBasicMaterial({ color: 0xec4899 }));
      lap2.position.set(0.65, 0.88, 0.2);
      lap2.rotation.x = -Math.PI / 8;
      room.add(lap2);

      // Desk Reading Lamp
      const lampBaseGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.45, 16);
      const lampMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8 });
      const lamp = new THREE.Mesh(lampBaseGeo, lampMat);
      lamp.position.set(-0.45, 0.75, 0.2);
      room.add(lamp);

      const bulbGeo = new THREE.SphereGeometry(0.1, 16, 16);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(-0.45, 1.0, 0.2);
      room.add(bulb);
    });
    hubGroups.library.position.set(-7.4, 2.2, -4.5);

    // --- HUB 2: Science & AI Lab (Top-Right) ---
    createArchitecturalHub('lab', 0x00f0ff, (room) => {
      // Supercomputing Blade Server Cabinets (Dual Rack)
      for (let r = 0; r < 2; r++) {
        const rackGeo = new THREE.BoxGeometry(0.65, 2.0, 0.7);
        const rackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
        const rack = new THREE.Mesh(rackGeo, rackMat);
        rack.position.set(0.75 + r * 0.75, 1.1, -1.1);
        room.add(rack);

        // Blinking LED status strips
        for (let l = 0; l < 6; l++) {
          const ledStGeo = new THREE.BoxGeometry(0.48, 0.04, 0.05);
          const ledStMat = new THREE.MeshBasicMaterial({
            color: l % 2 === 0 ? 0x00f0ff : 0x10b981
          });
          const ledSt = new THREE.Mesh(ledStGeo, ledStMat);
          ledSt.position.set(0.75 + r * 0.75, 0.4 + l * 0.28, -0.73);
          room.add(ledSt);
        }
      }

      // AI Research Multi-Display Workstation
      const benchGeo = new THREE.BoxGeometry(1.8, 0.52, 0.95);
      const benchMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 });
      const bench = new THREE.Mesh(benchGeo, benchMat);
      bench.position.set(-0.4, 0.46, 0.1);
      room.add(bench);

      // Triple Ultrawide Displays
      const monGeo = new THREE.BoxGeometry(0.55, 0.38, 0.04);
      const monMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

      const mon1 = new THREE.Mesh(monGeo, monMat);
      mon1.position.set(-0.7, 0.92, 0.1);
      mon1.rotation.y = Math.PI / 8;
      room.add(mon1);

      const mon2 = new THREE.Mesh(monGeo, monMat);
      mon2.position.set(-0.15, 0.92, 0.08);
      room.add(mon2);

      const mon3 = new THREE.Mesh(monGeo, new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
      mon3.position.set(0.38, 0.92, 0.1);
      mon3.rotation.y = -Math.PI / 8;
      room.add(mon3);

      // Central Floating Holographic Quantum Core
      const coreGeo = new THREE.IcosahedronGeometry(0.28, 0);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        wireframe: true,
        emissive: 0x00f0ff,
        emissiveIntensity: 1.5
      });
      const qCore = new THREE.Mesh(coreGeo, coreMat);
      qCore.position.set(-0.4, 1.45, 0.1);
      room.add(qCore);
      room.userData.qCore = qCore;
    });
    hubGroups.lab.position.set(7.4, 2.4, -4.2);

    // --- HUB 3: Administration Suite (Bottom-Left) ---
    createArchitecturalHub('admin', 0x10b981, (room) => {
      // Executive L-Desk
      const desk1Geo = new THREE.BoxGeometry(1.8, 0.52, 0.8);
      const deskMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
      const desk1 = new THREE.Mesh(desk1Geo, deskMat);
      desk1.position.set(-0.2, 0.46, -0.2);
      room.add(desk1);

      const desk2Geo = new THREE.BoxGeometry(0.7, 0.52, 1.2);
      const desk2 = new THREE.Mesh(desk2Geo, deskMat);
      desk2.position.set(0.65, 0.46, 0.4);
      room.add(desk2);

      // Dual Biometric & Attendance Terminals
      const termGeo = new THREE.BoxGeometry(0.58, 0.4, 0.04);
      const termMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const term = new THREE.Mesh(termGeo, termMat);
      term.position.set(-0.2, 0.92, -0.2);
      room.add(term);

      // Modern Executive Chair
      const chairBase = new THREE.CylinderGeometry(0.32, 0.32, 0.45, 16);
      const chairMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      const chair = new THREE.Mesh(chairBase, chairMat);
      chair.position.set(-0.2, 0.45, -0.9);
      room.add(chair);

      const chairBack = new THREE.BoxGeometry(0.55, 0.6, 0.1);
      const chairB = new THREE.Mesh(chairBack, chairMat);
      chairB.position.set(-0.2, 0.9, -1.05);
      room.add(chairB);

      // Architectural Planter Box with Green Foliage
      const potGeo = new THREE.BoxGeometry(0.6, 0.5, 0.6);
      const potMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const pot = new THREE.Mesh(potGeo, potMat);
      pot.position.set(-1.1, 0.45, 1.0);
      room.add(pot);

      const plantGeo = new THREE.SphereGeometry(0.38, 16, 16);
      const plantMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });
      const plant = new THREE.Mesh(plantGeo, plantMat);
      plant.position.set(-1.1, 0.85, 1.0);
      room.add(plant);
    });
    hubGroups.admin.position.set(-7.0, -1.9, 4.8);

    // --- HUB 4: Smart Classroom (Bottom-Right) ---
    createArchitecturalHub('lecture', 0xa855f7, (room) => {
      // Stepped Tiered Amphitheater Seating (3 Warm Oak Tiers)
      const woodMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.45 });
      for (let k = 0; k < 3; k++) {
        const tierGeo = new THREE.BoxGeometry(2.8, 0.26 * (k + 1), 0.75);
        const tier = new THREE.Mesh(tierGeo, woodMat);
        tier.position.set(0, 0.13 * (k + 1) + 0.14, 0.9 - k * 0.8);
        room.add(tier);

        // Student Tablet Screens on Tier
        for (let t = 0; t < 3; t++) {
          const tabGeo = new THREE.BoxGeometry(0.32, 0.02, 0.22);
          const tabMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
          const tab = new THREE.Mesh(tabGeo, tabMat);
          tab.position.set(-0.8 + t * 0.8, 0.26 * (k + 1) + 0.29, 0.9 - k * 0.8);
          room.add(tab);
        }
      }

      // Giant Wall-Sized Interactive Presentation Smartboard
      const boardGeo = new THREE.BoxGeometry(2.5, 1.35, 0.05);
      const boardMat = new THREE.MeshBasicMaterial({ color: 0x6366f1 });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(0, 1.25, 1.55);
      board.rotation.y = Math.PI;
      room.add(board);

      // Lecturer Presentation Podium
      const podGeo = new THREE.BoxGeometry(0.6, 0.85, 0.45);
      const podMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      const pod = new THREE.Mesh(podGeo, podMat);
      pod.position.set(0.65, 0.55, 1.1);
      room.add(pod);
    });
    hubGroups.lecture.position.set(7.2, -2.1, 5.0);

    // --- 7. Dense Luminous 3D Fiber-Optic Energy Cables (24+ Spline Ribbons & Traveling Photons) ---
    interface CableConduit {
      hub: Exclude<HubType, 'all'>;
      curve: THREE.CatmullRomCurve3;
      tube: THREE.Mesh;
      pulses: { mesh: THREE.Mesh; t: number; speed: number }[];
    }

    const conduits: CableConduit[] = [];

    const createConduit = (
      hub: Exclude<HubType, 'all'>,
      start: THREE.Vector3,
      end: THREE.Vector3,
      colorHex: number,
      arcHeight: number,
      thickness = 0.045
    ) => {
      const mid1 = new THREE.Vector3().lerpVectors(start, end, 0.3);
      mid1.y += arcHeight;
      const mid2 = new THREE.Vector3().lerpVectors(start, end, 0.7);
      mid2.y += arcHeight * 0.8;

      const curve = new THREE.CatmullRomCurve3([start, mid1, mid2, end]);
      const tubeGeo = new THREE.TubeGeometry(curve, 36, thickness, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.85
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      masterGroup.add(tube);

      // Flowing White & Neon Photon Pulses
      const pulseGeo = new THREE.SphereGeometry(thickness * 2.8, 16, 16);
      const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      const pulses = [
        { mesh: new THREE.Mesh(pulseGeo, pulseMat), t: Math.random(), speed: 0.22 + Math.random() * 0.14 },
        { mesh: new THREE.Mesh(pulseGeo, pulseMat), t: Math.random(), speed: 0.18 + Math.random() * 0.12 }
      ];

      pulses.forEach((p) => masterGroup.add(p.mesh));
      conduits.push({ hub, curve, tube, pulses });
    };

    // Bundle 1: Globe -> Digital Library (Cyan, Electric Blue & Violet Arcs)
    createConduit('library', new THREE.Vector3(-1.8, 0.8, -1.0), new THREE.Vector3(-5.7, 2.0, -3.5), 0x00f0ff, 1.8, 0.05);
    createConduit('library', new THREE.Vector3(-1.9, 0.4, -1.2), new THREE.Vector3(-6.0, 1.7, -3.3), 0x38bdf8, 1.3, 0.04);
    createConduit('library', new THREE.Vector3(-1.6, 1.0, -0.8), new THREE.Vector3(-5.5, 2.2, -3.8), 0x818cf8, 2.2, 0.045);
    createConduit('library', new THREE.Vector3(-2.1, 0.1, -0.9), new THREE.Vector3(-6.2, 1.5, -3.1), 0x00f0ff, 0.9, 0.035);
    createConduit('library', new THREE.Vector3(-1.5, 1.2, -1.1), new THREE.Vector3(-5.2, 2.4, -3.6), 0xa855f7, 2.5, 0.04);

    // Bundle 2: Globe -> Science & AI Lab (Neon Cyan & Bright Magenta Arcs)
    createConduit('lab', new THREE.Vector3(1.8, 0.9, -0.9), new THREE.Vector3(5.7, 2.2, -3.3), 0x00f0ff, 1.8, 0.05);
    createConduit('lab', new THREE.Vector3(1.9, 0.5, -1.1), new THREE.Vector3(6.0, 1.9, -3.0), 0x38bdf8, 1.3, 0.04);
    createConduit('lab', new THREE.Vector3(1.6, 1.1, -0.7), new THREE.Vector3(5.5, 2.4, -3.5), 0xec4899, 2.2, 0.045);
    createConduit('lab', new THREE.Vector3(2.1, 0.2, -0.8), new THREE.Vector3(6.2, 1.7, -2.8), 0x00f0ff, 0.9, 0.035);
    createConduit('lab', new THREE.Vector3(1.5, 1.3, -1.0), new THREE.Vector3(5.2, 2.6, -3.4), 0xec4899, 2.6, 0.04);

    // Bundle 3: Globe -> Administration Suite (Emerald, Cyan & Hot Pink Arcs)
    createConduit('admin', new THREE.Vector3(-1.7, -0.2, 1.4), new THREE.Vector3(-5.4, -1.3, 3.9), 0x10b981, 1.4, 0.05);
    createConduit('admin', new THREE.Vector3(-1.9, -0.5, 1.2), new THREE.Vector3(-5.7, -1.6, 3.6), 0x00f0ff, 1.0, 0.04);
    createConduit('admin', new THREE.Vector3(-1.5, 0.1, 1.6), new THREE.Vector3(-5.1, -1.1, 4.2), 0xec4899, 1.8, 0.045);
    createConduit('admin', new THREE.Vector3(-2.0, -0.8, 1.0), new THREE.Vector3(-5.9, -1.8, 3.4), 0x10b981, 0.7, 0.035);
    createConduit('admin', new THREE.Vector3(-1.4, 0.3, 1.7), new THREE.Vector3(-4.8, -0.9, 4.4), 0xa855f7, 2.1, 0.04);

    // Bundle 4: Globe -> Smart Classroom (Electric Purple, Magenta & Sky Blue Arcs)
    createConduit('lecture', new THREE.Vector3(1.7, -0.2, 1.4), new THREE.Vector3(5.5, -1.4, 4.1), 0xa855f7, 1.4, 0.05);
    createConduit('lecture', new THREE.Vector3(1.9, -0.5, 1.2), new THREE.Vector3(5.8, -1.7, 3.8), 0xec4899, 1.0, 0.04);
    createConduit('lecture', new THREE.Vector3(1.5, 0.1, 1.6), new THREE.Vector3(5.2, -1.2, 4.3), 0x38bdf8, 1.8, 0.045);
    createConduit('lecture', new THREE.Vector3(2.0, -0.8, 1.0), new THREE.Vector3(6.0, -1.9, 3.5), 0xa855f7, 0.7, 0.035);
    createConduit('lecture', new THREE.Vector3(1.4, 0.3, 1.7), new THREE.Vector3(4.9, -1.0, 4.5), 0x00f0ff, 2.1, 0.04);

    // Dynamic Filter Highlighter function
    const highlightHub = (filter: HubType) => {
      const keys: Exclude<HubType, 'all'>[] = ['library', 'lab', 'admin', 'lecture'];
      keys.forEach((k) => {
        const grp = hubGroups[k];
        const isTarget = filter === 'all' || filter === k;
        grp.scale.setScalar(isTarget ? (filter === k ? 1.08 : 1.0) : 0.94);
      });

      conduits.forEach((c) => {
        const isTarget = filter === 'all' || filter === c.hub;
        const mat = c.tube.material as THREE.MeshBasicMaterial;
        mat.opacity = isTarget ? 0.9 : 0.2;
      });
    };

    sceneStateRef.current = {
      targetRotX: 0,
      targetRotY: 0,
      highlightHub
    };

    // --- 8. Mouse Parallax & Smooth 60fps Animation Loop ---
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      if (sceneStateRef.current) {
        sceneStateRef.current.targetRotY = mouseX * 0.15;
        sceneStateRef.current.targetRotX = -mouseY * 0.12;
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Continuous Smooth 360° Axial Globe Rotation (~22 seconds)
      globeMesh.rotation.y += 0.0038;

      // Orbiting Gimbal Rings Counter-Rotation
      gimbal1.rotation.z += 0.005;
      gimbal2.rotation.z -= 0.004;

      // Holographic Quantum Core Spin in Lab
      if (hubGroups.lab.userData.qCore) {
        hubGroups.lab.userData.qCore.rotation.x += 0.02;
        hubGroups.lab.userData.qCore.rotation.y += 0.025;
      }

      // Ground Radar Ripple Pulse
      groundRings.forEach((r) => {
        const mat = r.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.18 + Math.sin(elapsed * 2.5 + r.phase) * 0.14;
      });

      // Dust Swirling Effect
      dustPoints.rotation.y = elapsed * 0.03;

      // Independent Sine-Wave Floating Bobbing for the 4 Hubs
      hubGroups.library.position.y = 2.2 + Math.sin(elapsed * 1.3) * 0.18;
      hubGroups.lab.position.y = 2.4 + Math.sin(elapsed * 1.1 + 1.2) * 0.16;
      hubGroups.admin.position.y = -1.9 + Math.sin(elapsed * 1.0 + 2.4) * 0.19;
      hubGroups.lecture.position.y = -2.1 + Math.sin(elapsed * 1.2 + 3.6) * 0.17;

      // Flowing Photon Pulses along 3D Catmull-Rom Splines
      conduits.forEach((stream) => {
        stream.pulses.forEach((p) => {
          p.t = (p.t + p.speed * 0.016) % 1.0;
          const pos = stream.curve.getPointAt(p.t);
          p.mesh.position.copy(pos);
        });
      });

      // Smooth Camera Parallax Response
      if (sceneStateRef.current) {
        masterGroup.rotation.y += (sceneStateRef.current.targetRotY - masterGroup.rotation.y) * 0.05;
        masterGroup.rotation.x += (sceneStateRef.current.targetRotX - masterGroup.rotation.x) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      resizeObserver.disconnect();
      renderer.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      atmoInnerGeo.dispose();
      atmoInnerMat.dispose();
      atmoOuterGeo.dispose();
      atmoOuterMat.dispose();
      groundBaseGeo.dispose();
      groundBaseMat.dispose();
      baseStandGeo.dispose();
      baseStandMat.dispose();
      baseNeonGeo.dispose();
      baseNeonMat.dispose();
      gimbal1Geo.dispose();
      gimbal1Mat.dispose();
      gimbal2Geo.dispose();
      gimbal2Mat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
    };
  }, []);

  // Update 3D scene when filter changes
  useEffect(() => {
    if (sceneStateRef.current) {
      sceneStateRef.current.highlightHub(activeFilter);
    }
  }, [activeFilter]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] max-w-[700px] lg:max-w-[760px] mx-auto select-none"
    >
      {/* Three.js 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* --- Top Floating Interactive Filter Mode Selector (Framer Motion Sliding Pill) --- */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center p-1 bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_8px_24px_rgba(79,70,229,0.12)] rounded-full text-[11px] sm:text-xs font-bold text-zinc-700">
        {(
          [
            { id: 'all', label: 'All Campus Hubs', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'library', label: 'Library', icon: <BookOpen className="w-3.5 h-3.5" /> },
            { id: 'lab', label: 'AI Lab', icon: <Cpu className="w-3.5 h-3.5" /> },
            { id: 'admin', label: 'Gatekeeper', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
            { id: 'lecture', label: 'Classroom', icon: <GraduationCap className="w-3.5 h-3.5" /> }
          ] as const
        ).map((item) => {
          const isActive = activeFilter === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveFilter(item.id)}
              className={`relative px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer ${
                isActive ? 'text-white' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeHeroPill"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-full shadow-[0_2px_10px_rgba(79,70,229,0.4)]"
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* --- Framer Motion Interactive Floating Hub Badges --- */}

      {/* Top-Left: Digital Library Badge */}
      <motion.div
        initial={{ opacity: 0, x: -25, y: -25 }}
        animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
        transition={{ y: { repeat: Infinity, duration: 4.8, ease: 'easeInOut' }, duration: 0.6 }}
        className="absolute top-12 left-2 sm:left-4 z-20"
      >
        <motion.div
          onMouseEnter={() => setHoveredHub('library')}
          onMouseLeave={() => setHoveredHub(null)}
          onClick={() => setActiveFilter(activeFilter === 'library' ? 'all' : 'library')}
          whileHover={{ scale: 1.08, y: -4 }}
          whileTap={{ scale: 0.96 }}
          className={`px-3.5 py-2 rounded-2xl backdrop-blur-xl border transition-all cursor-pointer shadow-lg flex items-center gap-2 text-xs font-bold ${
            activeFilter === 'library' || hoveredHub === 'library'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_10px_25px_rgba(79,70,229,0.35)]'
              : 'bg-white/90 text-zinc-900 border-indigo-100/80 shadow-[0_8px_20px_rgba(79,70,229,0.12)]'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span>Digital Library</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
        </motion.div>
      </motion.div>

      {/* Top-Right: Science & AI Lab Badge */}
      <motion.div
        initial={{ opacity: 0, x: 25, y: -25 }}
        animate={{ opacity: 1, x: 0, y: [0, -7, 0] }}
        transition={{ y: { repeat: Infinity, duration: 5.2, ease: 'easeInOut', delay: 0.8 }, duration: 0.6 }}
        className="absolute top-12 right-2 sm:right-4 z-20"
      >
        <motion.div
          onMouseEnter={() => setHoveredHub('lab')}
          onMouseLeave={() => setHoveredHub(null)}
          onClick={() => setActiveFilter(activeFilter === 'lab' ? 'all' : 'lab')}
          whileHover={{ scale: 1.08, y: -4 }}
          whileTap={{ scale: 0.96 }}
          className={`px-3.5 py-2 rounded-2xl backdrop-blur-xl border transition-all cursor-pointer shadow-lg flex items-center gap-2 text-xs font-bold ${
            activeFilter === 'lab' || hoveredHub === 'lab'
              ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_10px_25px_rgba(6,182,212,0.35)]'
              : 'bg-white/90 text-zinc-900 border-cyan-100/80 shadow-[0_8px_20px_rgba(6,182,212,0.12)]'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-400">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <span>Science &amp; AI Lab</span>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse ml-0.5" />
        </motion.div>
      </motion.div>

      {/* Bottom-Left: Administration Suite Badge */}
      <motion.div
        initial={{ opacity: 0, x: -25, y: 25 }}
        animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
        transition={{ y: { repeat: Infinity, duration: 5.6, ease: 'easeInOut', delay: 1.6 }, duration: 0.6 }}
        className="absolute bottom-12 left-2 sm:left-4 z-20"
      >
        <motion.div
          onMouseEnter={() => setHoveredHub('admin')}
          onMouseLeave={() => setHoveredHub(null)}
          onClick={() => setActiveFilter(activeFilter === 'admin' ? 'all' : 'admin')}
          whileHover={{ scale: 1.08, y: -4 }}
          whileTap={{ scale: 0.96 }}
          className={`px-3.5 py-2 rounded-2xl backdrop-blur-xl border transition-all cursor-pointer shadow-lg flex items-center gap-2 text-xs font-bold ${
            activeFilter === 'admin' || hoveredHub === 'admin'
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_10px_25px_rgba(16,185,129,0.35)]'
              : 'bg-white/90 text-zinc-900 border-emerald-100/80 shadow-[0_8px_20px_rgba(16,185,129,0.12)]'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <span>Administration Suite</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
        </motion.div>
      </motion.div>

      {/* Bottom-Right: Smart Classroom Badge */}
      <motion.div
        initial={{ opacity: 0, x: 25, y: 25 }}
        animate={{ opacity: 1, x: 0, y: [0, -7, 0] }}
        transition={{ y: { repeat: Infinity, duration: 5.0, ease: 'easeInOut', delay: 2.2 }, duration: 0.6 }}
        className="absolute bottom-12 right-2 sm:right-4 z-20"
      >
        <motion.div
          onMouseEnter={() => setHoveredHub('lecture')}
          onMouseLeave={() => setHoveredHub(null)}
          onClick={() => setActiveFilter(activeFilter === 'lecture' ? 'all' : 'lecture')}
          whileHover={{ scale: 1.08, y: -4 }}
          whileTap={{ scale: 0.96 }}
          className={`px-3.5 py-2 rounded-2xl backdrop-blur-xl border transition-all cursor-pointer shadow-lg flex items-center gap-2 text-xs font-bold ${
            activeFilter === 'lecture' || hoveredHub === 'lecture'
              ? 'bg-purple-600 text-white border-purple-400 shadow-[0_10px_25px_rgba(168,85,247,0.35)]'
              : 'bg-white/90 text-zinc-900 border-purple-100/80 shadow-[0_8px_20px_rgba(168,85,247,0.12)]'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
          <span>Smart Classroom</span>
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse ml-0.5" />
        </motion.div>
      </motion.div>

      {/* --- Rich Framer Motion Live Telemetry Slide-Over Card on Hover --- */}
      <AnimatePresence>
        {hoveredHub && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950/95 text-white backdrop-blur-2xl p-5 rounded-3xl text-xs shadow-[0_25px_60px_rgba(0,0,0,0.6)] border ${HUB_INFO[hoveredHub].borderCol} pointer-events-none z-30 min-w-[310px] max-w-[360px] space-y-3 text-left`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${HUB_INFO[hoveredHub].color}20` }}
                >
                  {HUB_INFO[hoveredHub].icon}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white tracking-tight">
                    {HUB_INFO[hoveredHub].name}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    {HUB_INFO[hoveredHub].category}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>

            {/* Metrics */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-[11px] font-medium">
                  {HUB_INFO[hoveredHub].metricLabel}:
                </span>
                <span className="text-white font-extrabold text-[12px]">
                  {HUB_INFO[hoveredHub].metricValue}
                </span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                {HUB_INFO[hoveredHub].subText}
              </p>
            </div>

            {/* Gatekeeper Standing Alert Box */}
            <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Gatekeeper Protocol:
              </span>
              <span className="text-emerald-300 font-bold">
                {HUB_INFO[hoveredHub].gatekeeperStatus}
              </span>
            </div>

            {/* Status Footer */}
            <div className="pt-1 flex items-center justify-between text-[10px] text-zinc-400 font-medium border-t border-zinc-800/80">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                {HUB_INFO[hoveredHub].statusText}
              </span>
              <span className="text-indigo-400 font-bold flex items-center gap-0.5">
                Explore <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Continuous Sliding Live Data Stream Marquee at Bottom --- */}
      <div className="absolute bottom-1 left-4 right-4 z-20 pointer-events-none overflow-hidden rounded-full bg-white/75 backdrop-blur-md border border-white/80 shadow-[0_4px_16px_rgba(79,70,229,0.08)] py-1.5 px-3">
        <motion.div
          animate={{ x: [0, -600] }}
          transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
          className="flex items-center gap-8 whitespace-nowrap text-[11px] font-semibold text-zinc-600"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <strong className="text-zinc-900">Attendance Gatekeeper:</strong> 2,850 Records Synced Today
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-500" />
            <strong className="text-zinc-900">University Subject Attendance:</strong> Threshold 75% Gatekeeper Safe
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-indigo-500" />
            <strong className="text-zinc-900">Digital Library Vault:</strong> 14,200+ Academic Volumes Cached
          </span>
          <span className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-cyan-500" />
            <strong className="text-zinc-900">Edge Data Mesh:</strong> 12ms WebSocket Latency
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-purple-500" />
            <strong className="text-zinc-900">ProSchool Campus:</strong> Serving 500+ Institutions
          </span>
        </motion.div>
      </div>
    </div>
  );
};
