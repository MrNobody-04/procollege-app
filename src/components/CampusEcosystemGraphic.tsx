import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BookOpen, Cpu, Building2, GraduationCap } from 'lucide-react';

export const CampusEcosystemGraphic: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeHub, setActiveHub] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // --- 1. Scene & Camera Setup ---
    const scene = new THREE.Scene();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // Perspective camera with isometric angle (FOV 34 for telephoto architectural feel)
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(13, 15, 20);
    camera.lookAt(0, 0.3, 0);

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

    // --- 2. Studio Lighting Setup (Crisp Architectural Lighting) ---
    const ambientLight = new THREE.AmbientLight(0xf1f0ff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(12, 20, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    scene.add(keyLight);

    const cyanFillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    cyanFillLight.position.set(-15, 8, -10);
    scene.add(cyanFillLight);

    const violetRimLight = new THREE.DirectionalLight(0xa855f7, 1.2);
    violetRimLight.position.set(0, -5, -15);
    scene.add(violetRimLight);

    // Ground Shadow Receiver (Frosted Stage Disc)
    const shadowGeo = new THREE.CircleGeometry(11, 48);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.08
    });
    const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = -3.2;
    scene.add(shadowDisc);

    // Master Ecosystem Group for Parallax Mouse Movement
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // --- 3. Procedural High-Contrast Earth Texture ---
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = 1024;
    mapCanvas.height = 512;
    const ctx = mapCanvas.getContext('2d')!;

    // Deep Midnight Blue Ocean
    ctx.fillStyle = '#081226';
    ctx.fillRect(0, 0, 1024, 512);

    // Latitude / Longitude Grid Lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1024; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y < 512; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Continents & Landmasses
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;

    // Helper for continent blobs
    const drawLand = (pathData: number[][]) => {
      ctx.beginPath();
      ctx.moveTo(pathData[0][0], pathData[0][1]);
      for (let i = 1; i < pathData.length; i++) {
        ctx.lineTo(pathData[i][0], pathData[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // North America
    drawLand([[100, 80], [180, 60], [240, 110], [210, 180], [140, 240], [90, 200], [80, 130]]);
    // South America
    drawLand([[180, 250], [240, 270], [250, 360], [200, 440], [160, 360], [150, 280]]);
    // Europe
    drawLand([[430, 80], [510, 70], [530, 130], [470, 150], [420, 110]]);
    // Africa
    drawLand([[440, 170], [530, 170], [560, 260], [510, 370], [450, 340], [410, 230]]);
    // Asia
    drawLand([[550, 70], [740, 60], [820, 140], [780, 250], [670, 250], [570, 180]]);
    // South Asia / Nepal / India
    drawLand([[650, 190], [690, 200], [680, 270], [640, 240]]);
    // Australia
    drawLand([[750, 320], [840, 320], [830, 400], [750, 400]]);

    // Glowing Global Academic Nodes / City Lights
    const nodeCoords = [
      [160, 120], [200, 140], [190, 300], [480, 110], [490, 230],
      [665, 210], [680, 160], [740, 120], [790, 350]
    ];
    nodeCoords.forEach(([nx, ny]) => {
      ctx.fillStyle = '#00F0FF';
      ctx.beginPath();
      ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(nx, ny, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    const earthTexture = new THREE.CanvasTexture(mapCanvas);
    earthTexture.wrapS = THREE.RepeatWrapping;
    earthTexture.wrapT = THREE.ClampToEdgeWrapping;

    // --- 4. Central 3D Earth Globe ---
    const globeRadius = 2.1;
    const globeGeo = new THREE.SphereGeometry(globeRadius, 48, 48);
    const globeMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.35,
      metalness: 0.3,
      emissive: 0x08152c,
      emissiveIntensity: 0.4
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeMesh.position.set(0, 0.6, 0);
    globeMesh.castShadow = true;
    masterGroup.add(globeMesh);

    // Glowing Atmospheric Rim Shell
    const atmoGeo = new THREE.SphereGeometry(globeRadius * 1.035, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    atmoMesh.position.copy(globeMesh.position);
    masterGroup.add(atmoMesh);

    // Metallic Pedestal Stand for Globe
    const standRingGeo = new THREE.TorusGeometry(1.6, 0.12, 16, 48);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0xdde6ed,
      metalness: 0.9,
      roughness: 0.15
    });
    const standRing = new THREE.Mesh(standRingGeo, standMat);
    standRing.rotation.x = Math.PI / 2;
    standRing.position.set(0, -1.2, 0);
    masterGroup.add(standRing);

    // Concentric 3D Glowing Orbital Rings
    const orbit1Geo = new THREE.RingGeometry(3.2, 3.26, 64);
    const orbit1Mat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    const orbit1 = new THREE.Mesh(orbit1Geo, orbit1Mat);
    orbit1.rotation.x = Math.PI / 2.3;
    orbit1.position.copy(globeMesh.position);
    masterGroup.add(orbit1);

    const orbit2Geo = new THREE.RingGeometry(4.1, 4.15, 64);
    const orbit2Mat = new THREE.MeshBasicMaterial({
      color: 0xec4899,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const orbit2 = new THREE.Mesh(orbit2Geo, orbit2Mat);
    orbit2.rotation.x = Math.PI / 2.5;
    orbit2.rotation.y = Math.PI / 8;
    orbit2.position.copy(globeMesh.position);
    masterGroup.add(orbit2);

    // --- 5. Helper to Build 3D Isometric Architectural Campus Rooms ---
    const createHub = (
      name: string,
      colorTheme: number,
      builder: (roomGroup: THREE.Group) => void
    ) => {
      const group = new THREE.Group();

      // Architectural Base Slab
      const baseGeo = new THREE.BoxGeometry(3.0, 0.35, 3.0);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.1
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.receiveShadow = true;
      base.castShadow = true;
      group.add(base);

      // Neon LED Edge Accent
      const edgeGeo = new THREE.BoxGeometry(3.05, 0.08, 3.05);
      const edgeMat = new THREE.MeshBasicMaterial({
        color: colorTheme,
        transparent: true,
        opacity: 0.85
      });
      const edge = new THREE.Mesh(edgeGeo, edgeMat);
      edge.position.y = -0.12;
      group.add(edge);

      // Translucent Glass Corner Walls
      const wallMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        transmission: 0.9,
        thickness: 0.5
      });

      const backWallGeo = new THREE.BoxGeometry(3.0, 2.0, 0.08);
      const backWall = new THREE.Mesh(backWallGeo, wallMat);
      backWall.position.set(0, 1.0, -1.46);
      group.add(backWall);

      const sideWallGeo = new THREE.BoxGeometry(0.08, 2.0, 3.0);
      const sideWall = new THREE.Mesh(sideWallGeo, wallMat);
      sideWall.position.set(-1.46, 1.0, 0);
      group.add(sideWall);

      // Custom Interior Content
      builder(group);

      group.userData = { name };
      return group;
    };

    // --- Hub 1: Modern Digital Library & Knowledge Hub (Top-Left) ---
    const hubLibrary = createHub('library', 0x6366f1, (room) => {
      // Bookshelf with colorful books
      const shelfGeo = new THREE.BoxGeometry(2.4, 1.6, 0.35);
      const shelfMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
      const shelf = new THREE.Mesh(shelfGeo, shelfMat);
      shelf.position.set(0, 0.9, -1.25);
      room.add(shelf);

      // Mini books row
      const bookColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6];
      for (let i = 0; i < 8; i++) {
        const bGeo = new THREE.BoxGeometry(0.22, 0.5, 0.25);
        const bMat = new THREE.MeshStandardMaterial({ color: bookColors[i % bookColors.length] });
        const b = new THREE.Mesh(bGeo, bMat);
        b.position.set(-0.9 + i * 0.25, 0.9, -1.2);
        room.add(b);
      }

      // Reading Desk with Glowing Laptops
      const deskGeo = new THREE.BoxGeometry(1.4, 0.45, 0.7);
      const deskMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
      const desk = new THREE.Mesh(deskGeo, deskMat);
      desk.position.set(0.2, 0.4, 0.2);
      room.add(desk);

      // Glowing Laptop
      const laptopGeo = new THREE.BoxGeometry(0.35, 0.25, 0.04);
      const laptopMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const laptop = new THREE.Mesh(laptopGeo, laptopMat);
      laptop.position.set(0.2, 0.75, 0.2);
      laptop.rotation.x = -Math.PI / 8;
      room.add(laptop);
    });
    hubLibrary.position.set(-6.8, 1.8, -4.2);
    masterGroup.add(hubLibrary);

    // --- Hub 2: Advanced Science & AI Computing Lab (Top-Right) ---
    const hubLab = createHub('lab', 0x00f0ff, (room) => {
      // Server Blade Rack Tower
      const serverGeo = new THREE.BoxGeometry(0.6, 1.7, 0.6);
      const serverMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
      const server = new THREE.Mesh(serverGeo, serverMat);
      server.position.set(1.0, 0.95, -1.0);
      room.add(server);

      // Blinking status lights on server
      for (let j = 0; j < 4; j++) {
        const ledGeo = new THREE.BoxGeometry(0.4, 0.04, 0.05);
        const ledMat = new THREE.MeshBasicMaterial({ color: j % 2 === 0 ? 0x00f0ff : 0x10b981 });
        const led = new THREE.Mesh(ledGeo, ledMat);
        led.position.set(1.0, 0.4 + j * 0.35, -0.68);
        room.add(led);
      }

      // Lab Workstation with Dual Monitors
      const labBenchGeo = new THREE.BoxGeometry(1.6, 0.5, 0.8);
      const labBenchMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const labBench = new THREE.Mesh(labBenchGeo, labBenchMat);
      labBench.position.set(-0.2, 0.45, 0.1);
      room.add(labBench);

      // Dual Curved Displays
      const monGeo = new THREE.BoxGeometry(0.6, 0.38, 0.04);
      const monMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const mon1 = new THREE.Mesh(monGeo, monMat);
      mon1.position.set(-0.4, 0.85, 0.1);
      mon1.rotation.y = Math.PI / 12;
      room.add(mon1);

      const mon2 = new THREE.Mesh(monGeo, monMat);
      mon2.position.set(0.2, 0.85, 0.1);
      mon2.rotation.y = -Math.PI / 12;
      room.add(mon2);
    });
    hubLab.position.set(6.8, 2.0, -3.8);
    masterGroup.add(hubLab);

    // --- Hub 3: Campus Administration & Faculty Suite (Bottom-Left) ---
    const hubAdmin = createHub('admin', 0x10b981, (room) => {
      // Curved Reception / Executive Desk
      const deskGeo = new THREE.BoxGeometry(1.6, 0.5, 0.7);
      const deskMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
      const desk = new THREE.Mesh(deskGeo, deskMat);
      desk.position.set(-0.2, 0.45, -0.2);
      room.add(desk);

      // Administrative Terminal Screen
      const termGeo = new THREE.BoxGeometry(0.5, 0.35, 0.04);
      const termMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const term = new THREE.Mesh(termGeo, termMat);
      term.position.set(-0.2, 0.85, -0.2);
      room.add(term);

      // Modern Executive Chair
      const chairGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.45, 16);
      const chairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      const chair = new THREE.Mesh(chairGeo, chairMat);
      chair.position.set(-0.2, 0.4, -0.85);
      room.add(chair);
    });
    hubAdmin.position.set(-6.5, -1.6, 4.6);
    masterGroup.add(hubAdmin);

    // --- Hub 4: Smart Tiered Lecture Hall & Classroom (Bottom-Right) ---
    const hubLecture = createHub('lecture', 0xa855f7, (room) => {
      // Tiered amphitheater steps
      const tier1Geo = new THREE.BoxGeometry(2.4, 0.2, 0.7);
      const tierMat = new THREE.MeshStandardMaterial({ color: 0xd4a373 }); // Warm wood tone
      const tier1 = new THREE.Mesh(tier1Geo, tierMat);
      tier1.position.set(0, 0.3, 0.8);
      room.add(tier1);

      const tier2Geo = new THREE.BoxGeometry(2.4, 0.4, 0.7);
      const tier2 = new THREE.Mesh(tier2Geo, tierMat);
      tier2.position.set(0, 0.4, 0.0);
      room.add(tier2);

      const tier3Geo = new THREE.BoxGeometry(2.4, 0.6, 0.7);
      const tier3 = new THREE.Mesh(tier3Geo, tierMat);
      tier3.position.set(0, 0.5, -0.8);
      room.add(tier3);

      // Front Presentation Screen
      const screenGeo = new THREE.BoxGeometry(2.0, 1.1, 0.04);
      const screenMat = new THREE.MeshBasicMaterial({ color: 0x818cf8 });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 1.0, 1.35);
      screen.rotation.y = Math.PI;
      room.add(screen);
    });
    hubLecture.position.set(6.6, -1.8, 4.8);
    masterGroup.add(hubLecture);

    // --- 6. 3D Fiber-Optic Spline Pathways & Flowing Energy Pulses ---
    interface StreamTrack {
      curve: THREE.CatmullRomCurve3;
      tube: THREE.Mesh;
      pulses: { mesh: THREE.Mesh; t: number; speed: number }[];
    }

    const streams: StreamTrack[] = [];

    const createStream = (start: THREE.Vector3, end: THREE.Vector3, colorHex: number) => {
      const mid1 = new THREE.Vector3().lerpVectors(start, end, 0.35);
      mid1.y += 1.2; // Graceful 3D arc
      const mid2 = new THREE.Vector3().lerpVectors(start, end, 0.65);
      mid2.y += 0.9;

      const curve = new THREE.CatmullRomCurve3([start, mid1, mid2, end]);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.045, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.75
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      masterGroup.add(tube);

      // Flowing Photon Particle Pulses
      const pulseGeo = new THREE.SphereGeometry(0.14, 16, 16);
      const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      const pulses = [
        { mesh: new THREE.Mesh(pulseGeo, pulseMat), t: 0.1, speed: 0.28 },
        { mesh: new THREE.Mesh(pulseGeo, pulseMat), t: 0.6, speed: 0.24 }
      ];

      pulses.forEach((p) => {
        masterGroup.add(p.mesh);
      });

      streams.push({ curve, tube, pulses });
    };

    // Connect Globe to the 4 Campus Hubs
    createStream(new THREE.Vector3(-1.6, 0.5, -0.9), new THREE.Vector3(-5.3, 1.6, -3.2), 0x00f0ff);
    createStream(new THREE.Vector3(1.6, 0.6, -0.8), new THREE.Vector3(5.3, 1.7, -3.0), 0x00f0ff);
    createStream(new THREE.Vector3(-1.5, -0.4, 1.2), new THREE.Vector3(-5.0, -1.3, 3.6), 0xec4899);
    createStream(new THREE.Vector3(1.5, -0.4, 1.2), new THREE.Vector3(5.1, -1.4, 3.8), 0xec4899);

    // --- 7. Mouse Parallax & Animation Loop ---
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetRotY = mouseX * 0.14;
      targetRotX = -mouseY * 0.1;
    };

    window.addEventListener('mousemove', onMouseMove);

    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Ambient Continuous Globe Rotation (~22s full rotation)
      globeMesh.rotation.y += 0.0035;

      // Smooth Orbital Ring Rotations
      orbit1.rotation.z += 0.004;
      orbit2.rotation.z -= 0.003;

      // Independent Organic Floating Bobbing on 4 Hubs (4-8px scale equivalent)
      hubLibrary.position.y = 1.8 + Math.sin(elapsed * 1.2) * 0.16;
      hubLab.position.y = 2.0 + Math.sin(elapsed * 1.0 + 1.2) * 0.14;
      hubAdmin.position.y = -1.6 + Math.sin(elapsed * 0.9 + 2.4) * 0.18;
      hubLecture.position.y = -1.8 + Math.sin(elapsed * 1.1 + 3.6) * 0.15;

      // Advance Fiber-Optic Photon Pulses along 3D Splines
      streams.forEach((stream) => {
        stream.pulses.forEach((p) => {
          p.t = (p.t + p.speed * 0.016) % 1.0;
          const pos = stream.curve.getPointAt(p.t);
          p.mesh.position.copy(pos);
        });
      });

      // Smooth Camera Parallax Tilt
      masterGroup.rotation.y += (targetRotY - masterGroup.rotation.y) * 0.05;
      masterGroup.rotation.x += (targetRotX - masterGroup.rotation.x) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
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

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      resizeObserver.disconnect();
      renderer.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      orbit1Geo.dispose();
      orbit1Mat.dispose();
      orbit2Geo.dispose();
      orbit2Mat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] max-w-[640px] lg:max-w-[700px] mx-auto select-none"
    >
      {/* Three.js Real-time 3D Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating Interactive Badge Overlays */}
      <div className="absolute top-2 left-2 z-20">
        <div
          onMouseEnter={() => setActiveHub('library')}
          onMouseLeave={() => setActiveHub(null)}
          className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-100 shadow-[0_8px_20px_rgba(79,70,229,0.14)] flex items-center gap-1.5 text-xs font-bold text-zinc-900 cursor-pointer hover:scale-105 transition-all"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#4F46E5]" />
          <span>Digital Library</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
        </div>
      </div>

      <div className="absolute top-2 right-2 z-20">
        <div
          onMouseEnter={() => setActiveHub('lab')}
          onMouseLeave={() => setActiveHub(null)}
          className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-100 shadow-[0_8px_20px_rgba(6,182,212,0.14)] flex items-center gap-1.5 text-xs font-bold text-zinc-900 cursor-pointer hover:scale-105 transition-all"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-600" />
          <span>Science &amp; AI Lab</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse ml-0.5" />
        </div>
      </div>

      <div className="absolute bottom-2 left-2 z-20">
        <div
          onMouseEnter={() => setActiveHub('admin')}
          onMouseLeave={() => setActiveHub(null)}
          className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-100 shadow-[0_8px_20px_rgba(16,185,129,0.14)] flex items-center gap-1.5 text-xs font-bold text-zinc-900 cursor-pointer hover:scale-105 transition-all"
        >
          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Administration Suite</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
        </div>
      </div>

      <div className="absolute bottom-2 right-2 z-20">
        <div
          onMouseEnter={() => setActiveHub('lecture')}
          onMouseLeave={() => setActiveHub(null)}
          className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-purple-100 shadow-[0_8px_20px_rgba(168,85,247,0.14)] flex items-center gap-1.5 text-xs font-bold text-zinc-900 cursor-pointer hover:scale-105 transition-all"
        >
          <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
          <span>Smart Classroom</span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse ml-0.5" />
        </div>
      </div>
    </div>
  );
};
