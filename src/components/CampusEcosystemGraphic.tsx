import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Cpu, Building2, GraduationCap, Wifi, Zap, Activity } from 'lucide-react';

export const CampusEcosystemGraphic: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredHub, setHoveredHub] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // --- 1. Scene & Camera Setup ---
    const scene = new THREE.Scene();

    const width = container.clientWidth || 650;
    const height = container.clientHeight || 550;

    // Isometric Telephoto Angle (FOV 32)
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(11, 13.5, 17);
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

    // --- 2. Dynamic Lighting (Key, Cyan Fill, Magenta Rim, Ambient) ---
    const ambientLight = new THREE.AmbientLight(0xf5f3ff, 1.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(12, 22, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const cyanFillLight = new THREE.DirectionalLight(0x00f0ff, 1.4);
    cyanFillLight.position.set(-16, 10, -12);
    scene.add(cyanFillLight);

    const magentaRimLight = new THREE.DirectionalLight(0xec4899, 1.3);
    magentaRimLight.position.set(5, -6, -14);
    scene.add(magentaRimLight);

    // Master Ecosystem Group for Parallax
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // Ground Holographic Ripple Disc
    const groundGeo = new THREE.CircleGeometry(12, 64);
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.04
    });
    const groundDisc = new THREE.Mesh(groundGeo, groundMat);
    groundDisc.rotation.x = -Math.PI / 2;
    groundDisc.position.y = -3.2;
    masterGroup.add(groundDisc);

    // Ground Concentric Energy Radar Rings
    const groundRings: THREE.Mesh[] = [];
    for (let r = 3; r <= 10; r += 2.2) {
      const ringGeo = new THREE.RingGeometry(r, r + 0.05, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -3.18;
      masterGroup.add(ring);
      groundRings.push(ring);
    }

    // --- 3. Procedural High-Contrast Earth Texture ---
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = 2048;
    mapCanvas.height = 1024;
    const ctx = mapCanvas.getContext('2d')!;

    // Deep Metallic Midnight Blue Ocean
    ctx.fillStyle = '#060e20';
    ctx.fillRect(0, 0, 2048, 1024);

    // Latitude & Longitude Matrix Grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.lineWidth = 1.2;
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

    // Continents & Glowing Coastlines
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2.5;

    const drawLand = (coords: number[][]) => {
      ctx.beginPath();
      ctx.moveTo(coords[0][0] * 2, coords[0][1] * 2);
      for (let i = 1; i < coords.length; i++) {
        ctx.lineTo(coords[i][0] * 2, coords[i][1] * 2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // Continents (Scaled to 2048x1024)
    drawLand([[100, 80], [180, 60], [240, 110], [210, 180], [140, 240], [90, 200], [80, 130]]);
    drawLand([[180, 250], [240, 270], [250, 360], [200, 440], [160, 360], [150, 280]]);
    drawLand([[430, 80], [510, 70], [530, 130], [470, 150], [420, 110]]);
    drawLand([[440, 170], [530, 170], [560, 260], [510, 370], [450, 340], [410, 230]]);
    drawLand([[550, 70], [740, 60], [820, 140], [780, 250], [670, 250], [570, 180]]);
    drawLand([[650, 190], [690, 200], [680, 270], [640, 240]]); // South Asia / Nepal
    drawLand([[750, 320], [840, 320], [830, 400], [750, 400]]);

    // Academic Global Nodes / Constellation Points
    const nodes = [
      [160, 120], [200, 140], [190, 300], [480, 110], [490, 230],
      [665, 205], [680, 160], [740, 120], [790, 350]
    ];
    nodes.forEach(([nx, ny]) => {
      ctx.fillStyle = '#00F0FF';
      ctx.beginPath();
      ctx.arc(nx * 2, ny * 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(nx * 2, ny * 2, 16, 0, Math.PI * 2);
      ctx.fill();
    });

    const earthTexture = new THREE.CanvasTexture(mapCanvas);
    earthTexture.wrapS = THREE.RepeatWrapping;
    earthTexture.wrapT = THREE.ClampToEdgeWrapping;

    // --- 4. Central 3D Earth Globe with Multi-Layer Atmosphere ---
    const globeRadius = 2.45;
    const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.32,
      metalness: 0.35,
      emissive: 0x071530,
      emissiveIntensity: 0.55
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeMesh.position.set(0, 0.6, 0);
    globeMesh.castShadow = true;
    masterGroup.add(globeMesh);

    // Cyan Atmospheric Shell (Inner)
    const atmoInnerGeo = new THREE.SphereGeometry(globeRadius * 1.04, 32, 32);
    const atmoInnerMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const atmoInner = new THREE.Mesh(atmoInnerGeo, atmoInnerMat);
    atmoInner.position.copy(globeMesh.position);
    masterGroup.add(atmoInner);

    // Electric Violet Atmospheric Shell (Outer)
    const atmoOuterGeo = new THREE.SphereGeometry(globeRadius * 1.1, 32, 32);
    const atmoOuterMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const atmoOuter = new THREE.Mesh(atmoOuterGeo, atmoOuterMat);
    atmoOuter.position.copy(globeMesh.position);
    masterGroup.add(atmoOuter);

    // Chrome Pedestal Ring
    const standRingGeo = new THREE.TorusGeometry(1.8, 0.14, 16, 64);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.12
    });
    const standRing = new THREE.Mesh(standRingGeo, standMat);
    standRing.rotation.x = Math.PI / 2;
    standRing.position.set(0, -1.35, 0);
    masterGroup.add(standRing);

    // Concentric Gimbal Orbital Rings with Glowing Dashes
    const orbit1Geo = new THREE.RingGeometry(3.5, 3.58, 64);
    const orbit1Mat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const orbit1 = new THREE.Mesh(orbit1Geo, orbit1Mat);
    orbit1.rotation.x = Math.PI / 2.3;
    orbit1.position.copy(globeMesh.position);
    masterGroup.add(orbit1);

    const orbit2Geo = new THREE.RingGeometry(4.4, 4.46, 64);
    const orbit2Mat = new THREE.MeshBasicMaterial({
      color: 0xec4899,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const orbit2 = new THREE.Mesh(orbit2Geo, orbit2Mat);
    orbit2.rotation.x = Math.PI / 2.5;
    orbit2.rotation.y = Math.PI / 7;
    orbit2.position.copy(globeMesh.position);
    masterGroup.add(orbit2);

    // --- 5. Rich Procedural 3D Architectural Campus Hubs ---
    const createHub = (
      name: string,
      colorHex: number,
      builder: (g: THREE.Group) => void
    ) => {
      const group = new THREE.Group();

      // Architectural Base Slab with Beveled Edges
      const baseGeo = new THREE.BoxGeometry(3.2, 0.4, 3.2);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.18,
        metalness: 0.1
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);

      // Neon LED Base Underglow
      const neonTrimGeo = new THREE.BoxGeometry(3.28, 0.08, 3.28);
      const neonTrimMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.95
      });
      const neonTrim = new THREE.Mesh(neonTrimGeo, neonTrimMat);
      neonTrim.position.y = -0.15;
      group.add(neonTrim);

      // Translucent Glass Corner Partitions
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        roughness: 0.08,
        transmission: 0.92,
        thickness: 0.6
      });

      const backWallGeo = new THREE.BoxGeometry(3.2, 2.2, 0.08);
      const backWall = new THREE.Mesh(backWallGeo, glassMat);
      backWall.position.set(0, 1.1, -1.56);
      group.add(backWall);

      const sideWallGeo = new THREE.BoxGeometry(0.08, 2.2, 3.2);
      const sideWall = new THREE.Mesh(sideWallGeo, glassMat);
      sideWall.position.set(-1.56, 1.1, 0);
      group.add(sideWall);

      builder(group);

      group.userData = { name, originalScale: 1.0 };
      return group;
    };

    // Hub 1: Digital Library & Knowledge Vault (Top-Left)
    const hubLibrary = createHub('library', 0x6366f1, (room) => {
      // Bookshelf Unit
      const shelfGeo = new THREE.BoxGeometry(2.6, 1.8, 0.4);
      const shelfMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
      const shelf = new THREE.Mesh(shelfGeo, shelfMat);
      shelf.position.set(0, 1.0, -1.35);
      room.add(shelf);

      // Colorful Book Rows
      const bookColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0x06b6d4];
      for (let i = 0; i < 10; i++) {
        const bGeo = new THREE.BoxGeometry(0.2, 0.55, 0.3);
        const bMat = new THREE.MeshStandardMaterial({ color: bookColors[i % bookColors.length] });
        const b = new THREE.Mesh(bGeo, bMat);
        b.position.set(-1.0 + i * 0.22, 1.0, -1.28);
        room.add(b);
      }

      // Reading Table with Laptop
      const deskGeo = new THREE.BoxGeometry(1.6, 0.5, 0.8);
      const deskMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9 });
      const desk = new THREE.Mesh(deskGeo, deskMat);
      desk.position.set(0.3, 0.45, 0.2);
      room.add(desk);

      const laptopGeo = new THREE.BoxGeometry(0.4, 0.28, 0.04);
      const laptopMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const laptop = new THREE.Mesh(laptopGeo, laptopMat);
      laptop.position.set(0.3, 0.85, 0.2);
      laptop.rotation.x = -Math.PI / 8;
      room.add(laptop);
    });
    hubLibrary.position.set(-7.2, 2.0, -4.4);
    masterGroup.add(hubLibrary);

    // Hub 2: Advanced Science & AI Lab (Top-Right)
    const hubLab = createHub('lab', 0x00f0ff, (room) => {
      // Supercomputing Blade Tower
      const rackGeo = new THREE.BoxGeometry(0.7, 1.9, 0.7);
      const rackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85 });
      const rack = new THREE.Mesh(rackGeo, rackMat);
      rack.position.set(1.1, 1.05, -1.05);
      room.add(rack);

      for (let j = 0; j < 5; j++) {
        const ledGeo = new THREE.BoxGeometry(0.5, 0.05, 0.06);
        const ledMat = new THREE.MeshBasicMaterial({ color: j % 2 === 0 ? 0x00f0ff : 0x10b981 });
        const led = new THREE.Mesh(ledGeo, ledMat);
        led.position.set(1.1, 0.4 + j * 0.32, -0.69);
        room.add(led);
      }

      // Lab Workbench
      const benchGeo = new THREE.BoxGeometry(1.8, 0.52, 0.9);
      const benchMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const bench = new THREE.Mesh(benchGeo, benchMat);
      bench.position.set(-0.2, 0.46, 0.1);
      room.add(bench);

      // Dual Curved Displays
      const monGeo = new THREE.BoxGeometry(0.65, 0.42, 0.04);
      const monMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const mon1 = new THREE.Mesh(monGeo, monMat);
      mon1.position.set(-0.5, 0.9, 0.1);
      mon1.rotation.y = Math.PI / 10;
      room.add(mon1);

      const mon2 = new THREE.Mesh(monGeo, monMat);
      mon2.position.set(0.2, 0.9, 0.1);
      mon2.rotation.y = -Math.PI / 10;
      room.add(mon2);
    });
    hubLab.position.set(7.2, 2.2, -4.0);
    masterGroup.add(hubLab);

    // Hub 3: Campus Administration Suite (Bottom-Left)
    const hubAdmin = createHub('admin', 0x10b981, (room) => {
      const deskGeo = new THREE.BoxGeometry(1.8, 0.52, 0.8);
      const deskMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
      const desk = new THREE.Mesh(deskGeo, deskMat);
      desk.position.set(-0.2, 0.46, -0.2);
      room.add(desk);

      const screenGeo = new THREE.BoxGeometry(0.6, 0.38, 0.04);
      const screenMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(-0.2, 0.9, -0.2);
      room.add(screen);

      const chairGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.5, 16);
      const chairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      const chair = new THREE.Mesh(chairGeo, chairMat);
      chair.position.set(-0.2, 0.45, -0.9);
      room.add(chair);
    });
    hubAdmin.position.set(-6.8, -1.8, 4.8);
    masterGroup.add(hubAdmin);

    // Hub 4: Smart Lecture Hall & Auditorium (Bottom-Right)
    const hubLecture = createHub('lecture', 0xa855f7, (room) => {
      const tierMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.5 });
      for (let k = 0; k < 3; k++) {
        const tierGeo = new THREE.BoxGeometry(2.6, 0.25 * (k + 1), 0.75);
        const tier = new THREE.Mesh(tierGeo, tierMat);
        tier.position.set(0, 0.125 * (k + 1) + 0.15, 0.8 - k * 0.8);
        room.add(tier);
      }

      const boardGeo = new THREE.BoxGeometry(2.2, 1.2, 0.05);
      const boardMat = new THREE.MeshBasicMaterial({ color: 0x818cf8 });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(0, 1.1, 1.45);
      board.rotation.y = Math.PI;
      room.add(board);
    });
    hubLecture.position.set(7.0, -2.0, 5.0);
    masterGroup.add(hubLecture);

    // --- 6. Dense Luminous 3D Fiber-Optic Cable Bundles (16+ Curves) ---
    interface StreamBundle {
      curve: THREE.CatmullRomCurve3;
      pulses: { mesh: THREE.Mesh; t: number; speed: number }[];
    }

    const streamBundles: StreamBundle[] = [];

    const addCable = (
      start: THREE.Vector3,
      end: THREE.Vector3,
      colorHex: number,
      arcHeight: number
    ) => {
      const mid1 = new THREE.Vector3().lerpVectors(start, end, 0.32);
      mid1.y += arcHeight;
      const mid2 = new THREE.Vector3().lerpVectors(start, end, 0.68);
      mid2.y += arcHeight * 0.85;

      const curve = new THREE.CatmullRomCurve3([start, mid1, mid2, end]);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.04, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.8
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      masterGroup.add(tube);

      // Flowing Light Pulses along cable
      const pulseGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      const pulses = [
        { mesh: new THREE.Mesh(pulseGeo, pulseMat), t: Math.random(), speed: 0.22 + Math.random() * 0.1 },
        { mesh: new THREE.Mesh(pulseGeo, pulseMat), t: Math.random(), speed: 0.18 + Math.random() * 0.1 }
      ];

      pulses.forEach((p) => masterGroup.add(p.mesh));
      streamBundles.push({ curve, pulses });
    };

    // Bundle 1: Globe -> Library
    addCable(new THREE.Vector3(-1.8, 0.7, -1.0), new THREE.Vector3(-5.6, 1.8, -3.4), 0x00f0ff, 1.5);
    addCable(new THREE.Vector3(-1.9, 0.3, -1.2), new THREE.Vector3(-5.8, 1.6, -3.2), 0x38bdf8, 1.1);
    addCable(new THREE.Vector3(-1.7, 0.9, -0.8), new THREE.Vector3(-5.4, 2.0, -3.6), 0x818cf8, 1.8);

    // Bundle 2: Globe -> AI Lab
    addCable(new THREE.Vector3(1.8, 0.8, -0.9), new THREE.Vector3(5.6, 2.0, -3.2), 0x00f0ff, 1.5);
    addCable(new THREE.Vector3(1.9, 0.4, -1.1), new THREE.Vector3(5.8, 1.8, -3.0), 0x38bdf8, 1.2);
    addCable(new THREE.Vector3(1.7, 1.0, -0.7), new THREE.Vector3(5.4, 2.2, -3.4), 0x818cf8, 1.7);

    // Bundle 3: Globe -> Admin Suite
    addCable(new THREE.Vector3(-1.7, -0.3, 1.3), new THREE.Vector3(-5.3, -1.4, 3.8), 0xec4899, 1.3);
    addCable(new THREE.Vector3(-1.8, -0.6, 1.1), new THREE.Vector3(-5.5, -1.6, 3.6), 0x10b981, 0.9);
    addCable(new THREE.Vector3(-1.6, -0.1, 1.5), new THREE.Vector3(-5.1, -1.2, 4.0), 0xa855f7, 1.6);

    // Bundle 4: Globe -> Lecture Hall
    addCable(new THREE.Vector3(1.7, -0.3, 1.3), new THREE.Vector3(5.4, -1.5, 4.0), 0xec4899, 1.3);
    addCable(new THREE.Vector3(1.8, -0.6, 1.1), new THREE.Vector3(5.6, -1.7, 3.8), 0x818cf8, 1.0);
    addCable(new THREE.Vector3(1.6, -0.1, 1.5), new THREE.Vector3(5.2, -1.3, 4.2), 0xa855f7, 1.6);

    // --- 7. Mouse Parallax & 60fps Loop ---
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetRotY = mouseX * 0.16;
      targetRotX = -mouseY * 0.12;
    };

    window.addEventListener('mousemove', onMouseMove);

    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Continuous Axial Globe Rotation (Smooth 22s period)
      globeMesh.rotation.y += 0.0035;

      // Smooth Concentric Orbital Ring Spin
      orbit1.rotation.z += 0.004;
      orbit2.rotation.z -= 0.003;

      // Radar Ripple Pulse on Ground Rings
      groundRings.forEach((ring, idx) => {
        const mat = ring.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.12 + Math.sin(elapsed * 2 + idx) * 0.08;
      });

      // Independent Sine-Wave Floating Bobbing (4-8px scale equivalent)
      hubLibrary.position.y = 2.0 + Math.sin(elapsed * 1.3) * 0.18;
      hubLab.position.y = 2.2 + Math.sin(elapsed * 1.1 + 1.2) * 0.16;
      hubAdmin.position.y = -1.8 + Math.sin(elapsed * 1.0 + 2.4) * 0.2;
      hubLecture.position.y = -2.0 + Math.sin(elapsed * 1.2 + 3.6) * 0.17;

      // Animate Light Pulses along 3D Catmull-Rom Splines
      streamBundles.forEach((stream) => {
        stream.pulses.forEach((p) => {
          p.t = (p.t + p.speed * 0.016) % 1.0;
          const pos = stream.curve.getPointAt(p.t);
          p.mesh.position.copy(pos);
        });
      });

      // Smooth Camera Parallax Response
      masterGroup.rotation.y += (targetRotY - masterGroup.rotation.y) * 0.05;
      masterGroup.rotation.x += (targetRotX - masterGroup.rotation.x) * 0.05;

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
      groundGeo.dispose();
      groundMat.dispose();
      standRingGeo.dispose();
      standMat.dispose();
      orbit1Geo.dispose();
      orbit1Mat.dispose();
      orbit2Geo.dispose();
      orbit2Mat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] max-w-[650px] lg:max-w-[720px] mx-auto select-none"
    >
      {/* Three.js 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* --- Framer Motion Interactive Floating Badges & Hover Cards --- */}

      {/* Top-Left: Digital Library Badge */}
      <motion.div
        initial={{ opacity: 0, x: -20, y: -20 }}
        animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
        transition={{ y: { repeat: Infinity, duration: 4.5, ease: 'easeInOut' }, duration: 0.6 }}
        className="absolute top-3 left-3 z-20"
      >
        <motion.div
          onMouseEnter={() => setHoveredHub('library')}
          onMouseLeave={() => setHoveredHub(null)}
          whileHover={{ scale: 1.08, y: -2 }}
          className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-indigo-100 shadow-[0_10px_25px_rgba(79,70,229,0.18)] flex items-center gap-2 text-xs font-bold text-zinc-900 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-[#4F46E5]">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span>Digital Library</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
        </motion.div>
      </motion.div>

      {/* Top-Right: Science & AI Lab Badge */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: -20 }}
        animate={{ opacity: 1, x: 0, y: [0, -5, 0] }}
        transition={{ y: { repeat: Infinity, duration: 5.0, ease: 'easeInOut', delay: 0.8 }, duration: 0.6 }}
        className="absolute top-3 right-3 z-20"
      >
        <motion.div
          onMouseEnter={() => setHoveredHub('lab')}
          onMouseLeave={() => setHoveredHub(null)}
          whileHover={{ scale: 1.08, y: -2 }}
          className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-cyan-100 shadow-[0_10px_25px_rgba(6,182,212,0.18)] flex items-center gap-2 text-xs font-bold text-zinc-900 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-600">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <span>Science &amp; AI Lab</span>
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse ml-0.5" />
        </motion.div>
      </motion.div>

      {/* Bottom-Left: Administration Suite Badge */}
      <motion.div
        initial={{ opacity: 0, x: -20, y: 20 }}
        animate={{ opacity: 1, x: 0, y: [0, -7, 0] }}
        transition={{ y: { repeat: Infinity, duration: 5.5, ease: 'easeInOut', delay: 1.5 }, duration: 0.6 }}
        className="absolute bottom-3 left-3 z-20"
      >
        <motion.div
          onMouseEnter={() => setHoveredHub('admin')}
          onMouseLeave={() => setHoveredHub(null)}
          whileHover={{ scale: 1.08, y: -2 }}
          className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-emerald-100 shadow-[0_10px_25px_rgba(16,185,129,0.18)] flex items-center gap-2 text-xs font-bold text-zinc-900 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <span>Administration Suite</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
        </motion.div>
      </motion.div>

      {/* Bottom-Right: Smart Classroom Badge */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: 20 }}
        animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
        transition={{ y: { repeat: Infinity, duration: 4.8, ease: 'easeInOut', delay: 2.2 }, duration: 0.6 }}
        className="absolute bottom-3 right-3 z-20"
      >
        <motion.div
          onMouseEnter={() => setHoveredHub('lecture')}
          onMouseLeave={() => setHoveredHub(null)}
          whileHover={{ scale: 1.08, y: -2 }}
          className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-purple-100 shadow-[0_10px_25px_rgba(168,85,247,0.18)] flex items-center gap-2 text-xs font-bold text-zinc-900 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
          <span>Smart Classroom</span>
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse ml-0.5" />
        </motion.div>
      </motion.div>

      {/* --- Rich Framer Motion Live Telemetry Floating Modal on Hover --- */}
      <AnimatePresence>
        {hoveredHub && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950/95 text-white backdrop-blur-xl px-5 py-3.5 rounded-2xl text-xs shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-indigo-400/40 pointer-events-none z-30 min-w-[280px] space-y-1 text-center"
          >
            {hoveredHub === 'library' && (
              <>
                <div className="flex items-center justify-center gap-1.5 text-indigo-400 font-bold text-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>Digital Knowledge Vault</span>
                </div>
                <p className="text-zinc-300 font-medium">14,200+ Books &amp; Academic Journals</p>
                <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-emerald-400 font-semibold">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Auto-Cataloging Active • 100% Synced</span>
                </div>
              </>
            )}

            {hoveredHub === 'lab' && (
              <>
                <div className="flex items-center justify-center gap-1.5 text-cyan-400 font-bold text-sm">
                  <Cpu className="w-4 h-4" />
                  <span>Science &amp; AI Computing Lab</span>
                </div>
                <p className="text-zinc-300 font-medium">Virtual Physics &amp; Chemistry Simulators</p>
                <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-cyan-300 font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Compute Grid • 99.8% Online</span>
                </div>
              </>
            )}

            {hoveredHub === 'admin' && (
              <>
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-sm">
                  <Building2 className="w-4 h-4" />
                  <span>Campus Administration Suite</span>
                </div>
                <p className="text-zinc-300 font-medium">Multi-Campus Roster &amp; Gatekeeper</p>
                <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-emerald-300 font-semibold">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Real-Time Biometric &amp; Attendance Sync</span>
                </div>
              </>
            )}

            {hoveredHub === 'lecture' && (
              <>
                <div className="flex items-center justify-center gap-1.5 text-purple-400 font-bold text-sm">
                  <GraduationCap className="w-4 h-4" />
                  <span>Smart Amphitheater Classroom</span>
                </div>
                <p className="text-zinc-300 font-medium">CS 301: Advanced Algorithms In Session</p>
                <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-purple-300 font-semibold">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Attendance Standing: 98.4% Safe</span>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
