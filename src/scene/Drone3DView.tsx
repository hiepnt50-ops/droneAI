/**
 * Three.js 3D & 2D Simulation View for WhalesBot Eagle 1003
 * Includes interactive obstacle/virtual human drag & drop, AprilTag grid, and 2D/3D toggle
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  DroneState,
  FieldObstacle,
  FlightPathPoint,
  ObstacleType,
  TagGridConfig,
} from '../types/drone';
import { getAllTags, START_PAD_SIZE } from '../simulator/physics';
import { computeHashLayout, DEFAULT_HASH_CONFIG } from '../simulator/challengeEngine';
import { HashGridConfig } from '../types/drone';
import { Plus, Trash2, SlidersHorizontal, Check, PanelRightOpen, Battery, Gauge, Layers, Clock } from 'lucide-react';

interface Drone3DViewProps {
  drone: DroneState;
  flightPath: FlightPathPoint[];
  comparisonPath?: FlightPathPoint[] | null;
  tagConfig: TagGridConfig;
  hashConfig?: HashGridConfig;
  obstacles: FieldObstacle[];
  showArenaObstacles: boolean;
  onUpdateObstacles?: (obstacles: FieldObstacle[]) => void;
  onToggleShowArena?: (show: boolean) => void;
  onOpenArenaEditor?: () => void;
  selectedObstacleId?: string | null;
  onSelectObstacle?: (id: string | null) => void;
  isToolboxCollapsed?: boolean;
  onToggleToolboxCollapse?: () => void;
  fieldWidthCm?: number;
  fieldHeightCm?: number;
  language: 'vi' | 'en';
}

export const Drone3DView: React.FC<Drone3DViewProps> = ({
  drone,
  flightPath,
  comparisonPath,
  tagConfig,
  hashConfig = DEFAULT_HASH_CONFIG,
  obstacles,
  showArenaObstacles,
  onUpdateObstacles,
  onToggleShowArena,
  onOpenArenaEditor,
  selectedObstacleId: controlledSelectedId,
  onSelectObstacle,
  isToolboxCollapsed = false,
  onToggleToolboxCollapse,
  fieldWidthCm = 300,
  fieldHeightCm = 300,
  language,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTopDownView, setIsTopDownView] = useState(false);
  const [showTags, setShowTags] = useState(true);
  const [showIdealPath, setShowIdealPath] = useState(true);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const selectedObstacleId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;
  const setSelectedObstacleId = (id: string | null) => {
    setInternalSelectedId(id);
    if (onSelectObstacle) {
      onSelectObstacle(id);
    }
  };
  const [isDraggingObstacle, setIsDraggingObstacle] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const droneGroupRef = useRef<THREE.Group | null>(null);
  const rotorsRef = useRef<THREE.Mesh[]>([]);
  const headlightBeamRef = useRef<THREE.SpotLight | null>(null);
  const rgbLedRef = useRef<THREE.PointLight | null>(null);
  const shadowMeshRef = useRef<THREE.Mesh | null>(null);

  const actualPathLineRef = useRef<THREE.Line | null>(null);
  const idealPathLineRef = useRef<THREE.Line | null>(null);
  const comparePathLineRef = useRef<THREE.Line | null>(null);

  const obstacleGroupRef = useRef<THREE.Group | null>(null);
  const selectionRingRef = useRef<THREE.Mesh | null>(null);
  const tagGroupRef = useRef<THREE.Group | null>(null);
  const floorGroupRef = useRef<THREE.Group | null>(null);

  // Orbit controls state
  const isDraggingOrbitRef = useRef(false);
  const isPanningRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({
    radius: 460,
    theta: Math.PI / 4,
    phi: Math.PI / 3.4,
    target: new THREE.Vector3(0, 35, 0),
  });

  // Dragging obstacle reference
  const draggingObsIdRef = useRef<string | null>(null);

  const toWorld = (x: number, y: number, z: number): THREE.Vector3 => {
    return new THREE.Vector3(x - fieldWidthCm / 2, z, -(y - fieldHeightCm / 2));
  };

  const toField = (worldX: number, worldZ: number): { x: number; y: number } => {
    return {
      x: Math.round(Math.max(15, Math.min(fieldWidthCm - 15, worldX + fieldWidthCm / 2))),
      y: Math.round(Math.max(15, Math.min(fieldHeightCm - 15, -worldZ + fieldHeightCm / 2))),
    };
  };

  // 1. Initial Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b1120');
    scene.fog = new THREE.FogExp2('#0b1120', 0.0008);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(200, 450, 250);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 1200;
    dirLight.shadow.camera.left = -300;
    dirLight.shadow.camera.right = 300;
    dirLight.shadow.camera.top = 300;
    dirLight.shadow.camera.bottom = -300;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.45);
    scene.add(hemiLight);

    const floorGroup = new THREE.Group();
    scene.add(floorGroup);
    floorGroupRef.current = floorGroup;

    buildFloor(floorGroup, fieldWidthCm, fieldHeightCm);
    buildDroneModel(scene);
    setupPathLines(scene);

    const tagGroup = new THREE.Group();
    scene.add(tagGroup);
    tagGroupRef.current = tagGroup;

    const obsGroup = new THREE.Group();
    scene.add(obsGroup);
    obstacleGroupRef.current = obsGroup;

    // Selection ring
    const ringGeo = new THREE.RingGeometry(18, 20, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const selRing = new THREE.Mesh(ringGeo, ringMat);
    selRing.rotation.x = -Math.PI / 2;
    selRing.visible = false;
    scene.add(selRing);
    selectionRingRef.current = selRing;

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (rotorsRef.current.length > 0) {
        const spinSpeed = drone.isFlying ? 40 : drone.isUnlocked ? 10 : 0;
        rotorsRef.current.forEach((rotor, idx) => {
          rotor.rotation.y += spinSpeed * delta * (idx % 2 === 0 ? 1 : -1);
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update floor if dimensions change
  useEffect(() => {
    if (floorGroupRef.current) {
      buildFloor(floorGroupRef.current, fieldWidthCm, fieldHeightCm);
    }
  }, [fieldWidthCm, fieldHeightCm]);

  const buildFloor = (group: THREE.Group, w: number, h: number) => {
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const floorGeo = new THREE.PlaneGeometry(w, h);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.15,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    const maxDim = Math.max(w, h);
    const grid = new THREE.GridHelper(maxDim, Math.round(maxDim / 10), 0x38bdf8, 0x334155);
    grid.position.y = 0.1;
    group.add(grid);

    // Border
    const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 1, h));
    const borderMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 });
    const border = new THREE.LineSegments(borderGeo, borderMat);
    border.position.y = 0.5;
    group.add(border);

    // Start Pad 30x30 cm at bottom-left corner
    const padCenter = toWorld(START_PAD_SIZE / 2, START_PAD_SIZE / 2, 0.2);
    const padGeo = new THREE.PlaneGeometry(START_PAD_SIZE, START_PAD_SIZE);
    const padCanvas = document.createElement('canvas');
    padCanvas.width = 128;
    padCanvas.height = 128;
    const ctx = padCanvas.getContext('2d')!;
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 116, 116);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', 64, 64);

    const padTex = new THREE.CanvasTexture(padCanvas);
    const padMat = new THREE.MeshBasicMaterial({ map: padTex });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.rotation.x = -Math.PI / 2;
    padMesh.position.copy(padCenter);
    group.add(padMesh);
  };

  const buildDroneModel = (scene: THREE.Scene) => {
    const droneGroup = new THREE.Group();
    droneGroupRef.current = droneGroup;

    // Body Fuselage
    const bodyGeo = new THREE.CylinderGeometry(4.5, 5.5, 3.2, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.3,
      roughness: 0.4,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    droneGroup.add(body);

    const stripeGeo = new THREE.RingGeometry(4.6, 5.2, 16);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.rotation.x = Math.PI / 2;
    stripe.position.y = 0.5;
    droneGroup.add(stripe);

    // Front Nose Indicator (Orange)
    const noseGeo = new THREE.ConeGeometry(2, 4, 4);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, 0, -5.5);
    droneGroup.add(nose);

    // 4 Diagonal arms
    const armLength = 11;
    const armGeo = new THREE.CylinderGeometry(0.7, 0.7, armLength, 8);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });

    const armAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
    const rotors: THREE.Mesh[] = [];

    armAngles.forEach(ang => {
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.rotation.z = Math.PI / 2;
      arm.rotation.y = ang;
      arm.position.set(Math.cos(ang) * (armLength / 2), 0, Math.sin(ang) * (armLength / 2));
      droneGroup.add(arm);

      const motorGeo = new THREE.CylinderGeometry(1.5, 1.5, 2.2, 8);
      const motorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
      const motor = new THREE.Mesh(motorGeo, motorMat);
      motor.position.set(Math.cos(ang) * armLength, 0.6, Math.sin(ang) * armLength);
      droneGroup.add(motor);

      const prop = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.2, 1.2),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.85,
        })
      );
      prop.position.set(Math.cos(ang) * armLength, 2.0, Math.sin(ang) * armLength);
      droneGroup.add(prop);
      rotors.push(prop);

      const ringGeo = new THREE.TorusGeometry(4.8, 0.2, 4, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x64748b });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(Math.cos(ang) * armLength, 1.5, Math.sin(ang) * armLength);
      droneGroup.add(ring);
    });

    rotorsRef.current = rotors;

    const spotLight = new THREE.SpotLight(0xffffff, 2, 250, Math.PI / 4, 0.3);
    spotLight.position.set(0, 0, -4);
    spotLight.target.position.set(0, -50, -120);
    droneGroup.add(spotLight);
    droneGroup.add(spotLight.target);
    headlightBeamRef.current = spotLight;

    const pointLight = new THREE.PointLight(0x00ff88, 1.5, 40);
    pointLight.position.set(0, 2.5, 1.5);
    droneGroup.add(pointLight);
    rgbLedRef.current = pointLight;

    const shadowGeo = new THREE.CircleGeometry(8, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.2;
    scene.add(shadowMesh);
    shadowMeshRef.current = shadowMesh;

    scene.add(droneGroup);
  };

  const setupPathLines = (scene: THREE.Scene) => {
    const actualGeo = new THREE.BufferGeometry();
    const actualMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 3 });
    const actualLine = new THREE.Line(actualGeo, actualMat);
    scene.add(actualLine);
    actualPathLineRef.current = actualLine;

    const idealGeo = new THREE.BufferGeometry();
    const idealMat = new THREE.LineDashedMaterial({
      color: 0xf59e0b,
      dashSize: 4,
      gapSize: 3,
      linewidth: 2,
    });
    const idealLine = new THREE.Line(idealGeo, idealMat);
    scene.add(idealLine);
    idealPathLineRef.current = idealLine;

    const compGeo = new THREE.BufferGeometry();
    const compMat = new THREE.LineDashedMaterial({
      color: 0xec4899,
      dashSize: 3,
      gapSize: 3,
      linewidth: 2,
    });
    const compLine = new THREE.Line(compGeo, compMat);
    scene.add(compLine);
    comparePathLineRef.current = compLine;
  };

  // Update drone position
  useEffect(() => {
    if (!droneGroupRef.current) return;

    const worldPos = toWorld(drone.position.x, drone.position.y, drone.position.z);
    droneGroupRef.current.position.copy(worldPos);

    const yawRad = -((drone.yaw * Math.PI) / 180);
    const pitchRad = (drone.pitch * Math.PI) / 180;
    const rollRad = (drone.roll * Math.PI) / 180;

    droneGroupRef.current.rotation.set(pitchRad, yawRad, rollRad, 'YXZ');

    if (headlightBeamRef.current) {
      headlightBeamRef.current.intensity = drone.headlightOn ? (drone.headlightBrightness / 100) * 3 : 0;
    }

    if (shadowMeshRef.current) {
      shadowMeshRef.current.position.x = worldPos.x;
      shadowMeshRef.current.position.z = worldPos.z;
      const h = Math.max(0, drone.position.z);
      const scale = 1 + h * 0.008;
      shadowMeshRef.current.scale.set(scale, scale, 1);
      (shadowMeshRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(
        0.08,
        0.5 - h * 0.002
      );
    }
  }, [drone, fieldWidthCm, fieldHeightCm]);

  // Update Paths
  useEffect(() => {
    if (flightPath.length === 0) {
      if (actualPathLineRef.current) actualPathLineRef.current.geometry.setFromPoints([]);
      if (idealPathLineRef.current) idealPathLineRef.current.geometry.setFromPoints([]);
      return;
    }

    const actualPts = flightPath.map(p => toWorld(p.actual.x, p.actual.y, p.actual.z));
    if (actualPathLineRef.current) {
      actualPathLineRef.current.geometry.setFromPoints(actualPts);
    }

    if (idealPathLineRef.current && showIdealPath) {
      const idealPts = flightPath.map(p => toWorld(p.ideal.x, p.ideal.y, p.ideal.z));
      idealPathLineRef.current.geometry.setFromPoints(idealPts);
      idealPathLineRef.current.computeLineDistances();
    } else if (idealPathLineRef.current) {
      idealPathLineRef.current.geometry.setFromPoints([]);
    }

    if (comparePathLineRef.current) {
      if (comparisonPath && comparisonPath.length > 0) {
        const compPts = comparisonPath.map(p => toWorld(p.actual.x, p.actual.y, p.actual.z));
        comparePathLineRef.current.geometry.setFromPoints(compPts);
        comparePathLineRef.current.computeLineDistances();
      } else {
        comparePathLineRef.current.geometry.setFromPoints([]);
      }
    }
  }, [flightPath, comparisonPath, showIdealPath, fieldWidthCm, fieldHeightCm]);

  // Update AprilTags
  useEffect(() => {
    const group = tagGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (!showTags) return;

    const tags = getAllTags(tagConfig, fieldWidthCm, fieldHeightCm);

    tags.forEach(tag => {
      const world = toWorld(tag.x, tag.y, 0.15);

      const tagCanvas = document.createElement('canvas');
      tagCanvas.width = 128;
      tagCanvas.height = 128;
      const ctx = tagCanvas.getContext('2d')!;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 12, 104, 104);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(24, 24, 80, 80);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(tag.id), 64, 64);

      const tex = new THREE.CanvasTexture(tagCanvas);
      const tagMat = new THREE.MeshBasicMaterial({ map: tex });
      const tagMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), tagMat);
      tagMesh.rotation.x = -Math.PI / 2;
      tagMesh.position.copy(world);
      group.add(tagMesh);
    });
  }, [tagConfig, showTags, fieldWidthCm, fieldHeightCm]);

  // Update Obstacles & Selection Ring
  useEffect(() => {
    const group = obstacleGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (!showArenaObstacles) {
      if (selectionRingRef.current) selectionRingRef.current.visible = false;
      return;
    }

    obstacles.forEach(obs => {
      const world = toWorld(obs.x, obs.y, obs.z);

      if (obs.type === 'pole') {
        const r = obs.radius || 6;
        const h = obs.height || 100;
        const geo = new THREE.CylinderGeometry(r, r, h, 16);
        const mat = new THREE.MeshStandardMaterial({
          color: selectedObstacleId === obs.id ? 0x38bdf8 : 0xef4444,
          roughness: 0.5,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(world.x, obs.z + h / 2, world.z);
        mesh.castShadow = true;
        mesh.userData = { obstacleId: obs.id };
        group.add(mesh);
      } else if (obs.type === 'hoop') {
        const outerR = obs.radius || 22;
        const tubeR = 2.5;
        const centerZ = obs.centerZ || obs.z + outerR;
        const torusGeo = new THREE.TorusGeometry(outerR, tubeR, 8, 24);
        const mat = new THREE.MeshStandardMaterial({
          color: selectedObstacleId === obs.id ? 0x38bdf8 : 0xeab308,
          roughness: 0.3,
        });
        const torus = new THREE.Mesh(torusGeo, mat);
        torus.position.set(world.x, centerZ, world.z);
        torus.castShadow = true;
        torus.userData = { obstacleId: obs.id };
        group.add(torus);

        const standH = centerZ - outerR;
        if (standH > 0) {
          const standGeo = new THREE.CylinderGeometry(1.5, 1.5, standH, 8);
          const standMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
          const stand = new THREE.Mesh(standGeo, standMat);
          stand.position.set(world.x, standH / 2, world.z);
          stand.userData = { obstacleId: obs.id };
          group.add(stand);
        }
      } else if (obs.type === 'barrier' || obs.type === 'cube') {
        const w = obs.width || 30;
        const d = obs.depth || 15;
        const h = obs.height || 40;
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({
          color: selectedObstacleId === obs.id ? 0x38bdf8 : 0x8b5cf6,
          roughness: 0.6,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(world.x, obs.z + h / 2, world.z);
        mesh.castShadow = true;
        mesh.userData = { obstacleId: obs.id };
        group.add(mesh);
      } else if (obs.type === 'human') {
        const humanGroup = new THREE.Group();
        humanGroup.userData = { obstacleId: obs.id };

        const bodyGeo = new THREE.CylinderGeometry(6, 4, 70, 8);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: selectedObstacleId === obs.id ? 0x38bdf8 : 0x10b981,
        });
        const humanBody = new THREE.Mesh(bodyGeo, bodyMat);
        humanBody.position.y = 35;
        humanBody.userData = { obstacleId: obs.id };
        humanGroup.add(humanBody);

        const headGeo = new THREE.SphereGeometry(6, 12, 12);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xfde047 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 76;
        head.userData = { obstacleId: obs.id };
        humanGroup.add(head);

        humanGroup.position.set(world.x, obs.z, world.z);
        group.add(humanGroup);
      } else if (obs.type === 'flame') {
        const flameGeo = new THREE.ConeGeometry(8, 24, 8);
        const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(world.x, obs.z + 12, world.z);
        flame.userData = { obstacleId: obs.id };
        group.add(flame);

        const light = new THREE.PointLight(0xf97316, 2, 80);
        light.position.set(world.x, obs.z + 15, world.z);
        group.add(light);
      } else if (obs.type === 'pinwheel') {
        // Pinwheel on vertical stand
        const pwGroup = new THREE.Group();
        pwGroup.userData = { obstacleId: obs.id };

        const standH = obs.height || 60;
        const bladeR = obs.bladeRadius || 10;
        const bladeZ = obs.z + standH;

        // Stand rod
        const standGeo = new THREE.CylinderGeometry(2, 2.5, standH, 12);
        const standMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
        const stand = new THREE.Mesh(standGeo, standMat);
        stand.position.set(world.x, obs.z + standH / 2, world.z);
        stand.userData = { obstacleId: obs.id };
        group.add(stand);

        // Rotating pinwheel blades head
        const headGeo = new THREE.CylinderGeometry(bladeR, bladeR, 1.5, 4);
        const headMat = new THREE.MeshStandardMaterial({
          color: selectedObstacleId === obs.id ? 0x38bdf8 : 0x06b6d4,
          roughness: 0.2,
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(world.x, bladeZ, world.z);
        // Angle from rotations
        const rotDeg = (obs.currentRotations || 0) * 360;
        head.rotation.y = (rotDeg * Math.PI) / 180;
        head.userData = { obstacleId: obs.id };
        group.add(head);

        // Center pin
        const pinGeo = new THREE.SphereGeometry(3, 8, 8);
        const pinMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const pin = new THREE.Mesh(pinGeo, pinMat);
        pin.position.set(world.x, bladeZ + 1.5, world.z);
        pin.userData = { obstacleId: obs.id };
        group.add(pin);

        // Downwash cone indicator (semi-transparent when selected)
        if (selectedObstacleId === obs.id) {
          const coneH = 45; // 15cm to 60cm above blades
          const coneGeo = new THREE.ConeGeometry(18, coneH, 16, 1, true);
          const coneMat = new THREE.MeshBasicMaterial({
            color: 0x06b6d4,
            transparent: true,
            opacity: 0.2,
            wireframe: true,
          });
          const cone = new THREE.Mesh(coneGeo, coneMat);
          cone.rotation.x = Math.PI; // point downwards to blades
          cone.position.set(world.x, bladeZ + 15 + coneH / 2, world.z);
          group.add(cone);
        }
      } else if (obs.type === 'stick') {
        // Stick / Rod lying horizontally
        const stickLen = obs.length || 40;
        const stickDiam = obs.diameter || 3;
        const stickAngle = obs.angleDeg || 0;

        const stickGeo = new THREE.CylinderGeometry(stickDiam / 2, stickDiam / 2, stickLen, 16);
        const stickMat = new THREE.MeshStandardMaterial({
          color: selectedObstacleId === obs.id ? 0x38bdf8 : 0xd97706,
          roughness: 0.5,
        });
        const stickMesh = new THREE.Mesh(stickGeo, stickMat);
        stickMesh.rotation.z = Math.PI / 2;
        stickMesh.rotation.y = -(stickAngle * Math.PI) / 180;
        stickMesh.position.set(world.x, obs.z + stickDiam / 2, world.z);
        stickMesh.castShadow = true;
        stickMesh.userData = { obstacleId: obs.id };
        group.add(stickMesh);
      } else if (obs.type === 'target_zone') {
        // Target zone disk on the floor
        const tzR = obs.radius || 25;
        const tzGeo = new THREE.RingGeometry(2, tzR, 32);
        const tzMat = new THREE.MeshBasicMaterial({
          color: selectedObstacleId === obs.id ? 0x38bdf8 : 0x10b981,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75,
        });
        const tzMesh = new THREE.Mesh(tzGeo, tzMat);
        tzMesh.rotation.x = -Math.PI / 2;
        tzMesh.position.set(world.x, 0.2, world.z);
        tzMesh.userData = { obstacleId: obs.id };
        group.add(tzMesh);
      }
    });

    // Hash Grid (#) reference lines rendering if any hash poles or hash challenge active
    const hasHashPoles = obstacles.some(o => o.id.startsWith('hash_pole'));
    if (hasHashPoles) {
      const hashLayout = computeHashLayout(hashConfig);
      hashLayout.lines.forEach(line => {
        const p1World = toWorld(line.p1.x, line.p1.y, 0.3);
        const p2World = toWorld(line.p2.x, line.p2.y, 0.3);
        const points = [p1World, p2World];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineDashedMaterial({
          color: 0x38bdf8,
          dashSize: 6,
          gapSize: 4,
          linewidth: 2,
        });
        const lineSeg = new THREE.Line(lineGeo, lineMat);
        lineSeg.computeLineDistances();
        group.add(lineSeg);
      });
    }

    // Update selection ring
    const selectedObs = obstacles.find(o => o.id === selectedObstacleId);
    if (selectedObs && selectionRingRef.current) {
      const sw = toWorld(selectedObs.x, selectedObs.y, 0.2);
      selectionRingRef.current.position.set(sw.x, 0.25, sw.z);
      selectionRingRef.current.visible = true;
    } else if (selectionRingRef.current) {
      selectionRingRef.current.visible = false;
    }
  }, [obstacles, showArenaObstacles, selectedObstacleId, fieldWidthCm, fieldHeightCm]);

  // Camera Orbit handlers
  const updateCameraPosition = () => {
    const camera = cameraRef.current;
    if (!camera) return;

    if (isTopDownView) {
      camera.position.set(0, Math.max(500, fieldWidthCm * 1.5), 0.01);
      camera.lookAt(0, 0, 0);
      return;
    }

    const s = cameraSphericalRef.current;
    const x = s.radius * Math.sin(s.phi) * Math.sin(s.theta);
    const y = s.radius * Math.cos(s.phi);
    const z = s.radius * Math.sin(s.phi) * Math.cos(s.theta);

    camera.position.set(s.target.x + x, s.target.y + y, s.target.z + z);
    camera.lookAt(s.target);
  };

  // Raycast to find clicked obstacle
  const raycastObstacle = (e: React.MouseEvent): string | null => {
    if (!containerRef.current || !cameraRef.current || !obstacleGroupRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(obstacleGroupRef.current.children, true);

    if (intersects.length > 0) {
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && obj !== obstacleGroupRef.current) {
        if (obj.userData?.obstacleId) {
          return obj.userData.obstacleId;
        }
        obj = obj.parent;
      }
    }
    return null;
  };

  // Raycast ground plane to get (fieldX, fieldY)
  const raycastGround = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!containerRef.current || !cameraRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(groundPlane, target);
    if (hit) {
      return toField(target.x, target.z);
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Check if clicked an obstacle
      const hitObsId = raycastObstacle(e);
      if (hitObsId) {
        setSelectedObstacleId(hitObsId);
        draggingObsIdRef.current = hitObsId;
        setIsDraggingObstacle(true);
        return;
      } else {
        setSelectedObstacleId(null);
      }
      isDraggingOrbitRef.current = true;
    } else if (e.button === 2) {
      isPanningRef.current = true;
    }
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // If dragging an obstacle
    if (draggingObsIdRef.current && onUpdateObstacles) {
      const fieldCoords = raycastGround(e.clientX, e.clientY);
      if (fieldCoords) {
        const updated = obstacles.map(o =>
          o.id === draggingObsIdRef.current ? { ...o, x: fieldCoords.x, y: fieldCoords.y } : o
        );
        onUpdateObstacles(updated);
      }
      return;
    }

    const dx = e.clientX - prevMouseRef.current.x;
    const dy = e.clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };

    if (isTopDownView) return;

    if (isDraggingOrbitRef.current) {
      const s = cameraSphericalRef.current;
      s.theta -= dx * 0.008;
      s.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, s.phi - dy * 0.008));
      updateCameraPosition();
    } else if (isPanningRef.current) {
      const s = cameraSphericalRef.current;
      s.target.x -= dx * 0.4;
      s.target.z += dy * 0.4;
      updateCameraPosition();
    }
  };

  const handleMouseUp = () => {
    isDraggingOrbitRef.current = false;
    isPanningRef.current = false;
    draggingObsIdRef.current = null;
    setIsDraggingObstacle(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const s = cameraSphericalRef.current;
    s.radius = Math.max(100, Math.min(1000, s.radius + e.deltaY * 0.35));
    updateCameraPosition();
  };

  const resetCamera = () => {
    setIsTopDownView(false);
    cameraSphericalRef.current = {
      radius: 460,
      theta: Math.PI / 4,
      phi: Math.PI / 3.4,
      target: new THREE.Vector3(0, 35, 0),
    };
    updateCameraPosition();
  };

  const toggleTopDown = () => {
    setIsTopDownView(prev => {
      const next = !prev;
      setTimeout(updateCameraPosition, 50);
      return next;
    });
  };

  // Add new obstacle quickly
  const handleQuickAdd = (type: ObstacleType, coords?: { x: number; y: number }) => {
    if (!onUpdateObstacles) return;
    const id = 'obs_' + Date.now();
    const x = coords?.x ?? 150;
    const y = coords?.y ?? 150;

    let newObs: FieldObstacle;
    if (type === 'human') {
      newObs = {
        id,
        type: 'human',
        name: `Người ảo #${obstacles.length + 1}`,
        x,
        y,
        z: 0,
        width: 25,
        depth: 25,
        height: 80,
      };
    } else if (type === 'barrier') {
      newObs = {
        id,
        type: 'barrier',
        name: `Thanh chắn #${obstacles.length + 1}`,
        x,
        y,
        z: 0,
        width: 60,
        depth: 15,
        height: 40,
      };
    } else if (type === 'pole') {
      newObs = {
        id,
        type: 'pole',
        name: `Cột tiêu #${obstacles.length + 1}`,
        x,
        y,
        z: 0,
        width: 12,
        depth: 12,
        height: 110,
        radius: 6,
      };
    } else if (type === 'hoop') {
      newObs = {
        id,
        type: 'hoop',
        name: `Vòng bay #${obstacles.length + 1}`,
        x,
        y,
        z: 30,
        width: 44,
        depth: 5,
        height: 60,
        radius: 22,
        innerRadius: 16,
        centerZ: 80,
      };
    } else if (type === 'pinwheel') {
      newObs = {
        id,
        type: 'pinwheel',
        name: `Chong chóng #${obstacles.length + 1}`,
        x,
        y,
        z: 0,
        width: 20,
        depth: 20,
        height: 60,
        bladeRadius: 10,
        targetRotations: 3,
        currentRotations: 0,
        currentRotationSpeedDegS: 0,
        maxTimeSec: 30,
      };
    } else if (type === 'stick') {
      newObs = {
        id,
        type: 'stick',
        name: `Gậy đẩy #${obstacles.length + 1}`,
        x,
        y,
        z: 0,
        width: 40,
        depth: 3,
        height: 3,
        length: 40,
        diameter: 3,
        angleDeg: 0,
        massKg: 0.2,
        frictionCoeff: 0.8,
        velocityX: 0,
        velocityY: 0,
        angularVelocityDegS: 0,
        pushCount: 0,
      };
    } else if (type === 'target_zone') {
      newObs = {
        id,
        type: 'target_zone',
        name: `Vùng đích #${obstacles.length + 1}`,
        x,
        y,
        z: 0,
        width: 50,
        depth: 50,
        height: 1,
        radius: 25,
      };
    } else {
      newObs = {
        id,
        type: 'flame',
        name: `Nguồn lửa #${obstacles.length + 1}`,
        x,
        y,
        z: 0,
        width: 20,
        depth: 20,
        height: 25,
      };
    }

    const updated = [...obstacles, newObs];
    onUpdateObstacles(updated);
    setSelectedObstacleId(id);
    if (!showArenaObstacles && onToggleShowArena) {
      onToggleShowArena(true);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedObstacleId || !onUpdateObstacles) return;
    const updated = obstacles.filter(o => o.id !== selectedObstacleId);
    onUpdateObstacles(updated);
    setSelectedObstacleId(null);
  };

  // HTML5 Drag-and-drop onto the 3D canvas
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('obstacleType') as ObstacleType;
    if (type) {
      const coords = raycastGround(e.clientX, e.clientY);
      handleQuickAdd(type, coords || undefined);
    }
  };

  const selectedObs = obstacles.find(o => o.id === selectedObstacleId);

  return (
    <div
      className="relative w-full h-full select-none overflow-hidden bg-slate-950 flex flex-col"
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div
        ref={containerRef}
        className={`w-full h-full ${
          isDraggingObstacle ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={e => e.preventDefault()}
      />

      {/* Floating Top Left Controls */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-auto z-10">
        <button
          onClick={toggleTopDown}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md backdrop-blur-md transition-all flex items-center gap-1.5 ${
            isTopDownView
              ? 'bg-cyan-500 text-white ring-2 ring-cyan-300'
              : 'bg-slate-900/85 hover:bg-slate-800 text-slate-200 border border-slate-700'
          }`}
          title="Chuyển sang góc nhìn 2D từ trên xuống"
        >
          <span>
            {isTopDownView
              ? language === 'vi'
                ? '📐 Nhìn 2D Trên Xuống'
                : '📐 2D Top-Down'
              : language === 'vi'
              ? '🌐 Góc nhìn 3D'
              : '🌐 3D View'}
          </span>
        </button>

        <button
          onClick={resetCamera}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900/85 hover:bg-slate-800 text-slate-300 border border-slate-700 shadow-md backdrop-blur-md transition-all"
        >
          🔄 {language === 'vi' ? 'Đặt lại góc' : 'Reset View'}
        </button>

        <button
          onClick={() => setShowTags(!showTags)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium shadow-md backdrop-blur-md transition-all ${
            showTags
              ? 'bg-emerald-950/85 text-emerald-300 border border-emerald-700'
              : 'bg-slate-900/85 text-slate-400 border border-slate-700'
          }`}
        >
          🏷️ {showTags ? (language === 'vi' ? 'Hiện AprilTag' : 'Tags ON') : (language === 'vi' ? 'Ẩn AprilTag' : 'Tags OFF')}
        </button>

        <button
          onClick={() => setShowIdealPath(!showIdealPath)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium shadow-md backdrop-blur-md transition-all ${
            showIdealPath
              ? 'bg-amber-950/85 text-amber-300 border border-amber-700'
              : 'bg-slate-900/85 text-slate-400 border border-slate-700'
          }`}
        >
          ➖ {showIdealPath ? (language === 'vi' ? 'Đường lý tưởng' : 'Ideal Path') : (language === 'vi' ? 'Ẩn lý tưởng' : 'Hide Ideal')}
        </button>
      </div>

      {/* Floating Bottom Left: Obstacle Drag & Drop Tool Palette */}
      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5 bg-slate-950/90 border border-slate-800/90 rounded-xl p-1.5 shadow-xl backdrop-blur-md z-10 pointer-events-auto text-xs">
        <span className="text-[11px] font-semibold text-slate-400 px-1.5 select-none hidden sm:inline">
          {language === 'vi' ? 'Kéo thả vật cản:' : 'Add Obstacles:'}
        </span>

        {/* Human button (draggable) */}
        <button
          draggable
          onDragStart={e => e.dataTransfer.setData('obstacleType', 'human')}
          onClick={() => handleQuickAdd('human')}
          className="px-2.5 py-1 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-medium transition flex items-center gap-1 active:scale-95 cursor-grab"
          title="Kéo thả hoặc nhấn để đặt Người ảo lên sân (cảm biến thân nhiệt sẽ phản ứng)"
        >
          <span>🚶 {language === 'vi' ? 'Người ảo' : 'Human'}</span>
        </button>

        {/* Barrier */}
        <button
          draggable
          onDragStart={e => e.dataTransfer.setData('obstacleType', 'barrier')}
          onClick={() => handleQuickAdd('barrier')}
          className="px-2.5 py-1 rounded-lg bg-purple-950/90 hover:bg-purple-900 border border-purple-700 text-purple-300 font-medium transition flex items-center gap-1 active:scale-95 cursor-grab"
          title="Kéo thả hoặc nhấn để đặt Thanh chắn lên sân"
        >
          <span>🧱 {language === 'vi' ? 'Thanh chắn' : 'Barrier'}</span>
        </button>

        {/* Pole */}
        <button
          draggable
          onDragStart={e => e.dataTransfer.setData('obstacleType', 'pole')}
          onClick={() => handleQuickAdd('pole')}
          className="px-2.5 py-1 rounded-lg bg-rose-950/90 hover:bg-rose-900 border border-rose-700 text-rose-300 font-medium transition flex items-center gap-1 active:scale-95 cursor-grab"
          title="Kéo thả hoặc nhấn để đặt Cột tiêu lên sân"
        >
          <span>🔴 {language === 'vi' ? 'Cột' : 'Pole'}</span>
        </button>

        {/* Hoop */}
        <button
          draggable
          onDragStart={e => e.dataTransfer.setData('obstacleType', 'hoop')}
          onClick={() => handleQuickAdd('hoop')}
          className="px-2.5 py-1 rounded-lg bg-amber-950/90 hover:bg-amber-900 border border-amber-700 text-amber-300 font-medium transition flex items-center gap-1 active:scale-95 cursor-grab"
          title="Kéo thả hoặc nhấn để đặt Vòng bay lên sân"
        >
          <span>🟡 {language === 'vi' ? 'Vòng' : 'Hoop'}</span>
        </button>

        {/* Pinwheel */}
        <button
          draggable
          onDragStart={e => e.dataTransfer.setData('obstacleType', 'pinwheel')}
          onClick={() => handleQuickAdd('pinwheel')}
          className="px-2.5 py-1 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-medium transition flex items-center gap-1 active:scale-95 cursor-grab"
          title="Kéo thả hoặc nhấn để đặt Chong chóng lên sân (gió drone làm quay)"
        >
          <span>🌀 {language === 'vi' ? 'Chong chóng' : 'Pinwheel'}</span>
        </button>

        {/* Stick */}
        <button
          draggable
          onDragStart={e => e.dataTransfer.setData('obstacleType', 'stick')}
          onClick={() => handleQuickAdd('stick')}
          className="px-2.5 py-1 rounded-lg bg-amber-900/90 hover:bg-amber-800 border border-amber-600 text-amber-200 font-medium transition flex items-center gap-1 active:scale-95 cursor-grab"
          title="Kéo thả hoặc nhấn để đặt Gậy lên sân (drone đẩy trượt)"
        >
          <span>🥢 {language === 'vi' ? 'Gậy đẩy' : 'Stick'}</span>
        </button>

        {onOpenArenaEditor && (
          <button
            onClick={onOpenArenaEditor}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
            title="Mở bảng cấu hình chi tiết sân và AprilTag"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Selected Obstacle HUD card */}
      {selectedObs && (
        <div className="absolute bottom-14 left-3 bg-slate-900/95 border border-cyan-500/60 rounded-xl p-2.5 shadow-2xl backdrop-blur-md z-20 pointer-events-auto flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold text-slate-200">{selectedObs.name}</span>
          </div>
          <div className="font-mono text-cyan-300 flex items-center gap-2">
            <span>X: {selectedObs.x}cm</span>
            <span>Y: {selectedObs.y}cm</span>
            <span>Cao: {selectedObs.z}cm</span>
          </div>
          <button
            onClick={handleDeleteSelected}
            className="p-1 rounded bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 transition flex items-center gap-1"
            title="Xóa đối tượng này"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Xóa' : 'Delete'}</span>
          </button>
        </div>
      )}

      {/* Floating 4-stat HUD strip & Reopen button when Toolbox is collapsed */}
      {isToolboxCollapsed && (
        <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2 pointer-events-auto">
          {/* Compact 4-stat strip: Altitude, Speed, Battery, Clock */}
          <div className="bg-slate-900/95 border border-cyan-500/60 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-md flex items-center gap-3.5 text-xs font-mono text-slate-200">
            {/* 1. Altitude */}
            <div className="flex items-center gap-1.5" title="Độ cao (Z)">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400 text-[10px]">Cao:</span>
              <span className="font-bold text-cyan-300">{drone.position.z.toFixed(1)}</span>
              <span className="text-[10px] text-slate-500">cm</span>
            </div>

            <div className="w-[1px] h-3.5 bg-slate-700" />

            {/* 2. Speed */}
            <div className="flex items-center gap-1.5" title="Tốc độ bay">
              <Gauge className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-400 text-[10px]">Tốc:</span>
              <span className="font-bold text-purple-300">
                {Math.sqrt(drone.velocity.x ** 2 + drone.velocity.y ** 2 + drone.velocity.z ** 2).toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500">cm/s</span>
            </div>

            <div className="w-[1px] h-3.5 bg-slate-700" />

            {/* 3. Battery */}
            <div className="flex items-center gap-1.5" title="Pin LiPo">
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-emerald-300">{drone.batteryVoltage.toFixed(2)}V</span>
              <span className="text-[10px] text-slate-400">({Math.round(drone.batteryPercent)}%)</span>
            </div>

            <div className="w-[1px] h-3.5 bg-slate-700" />

            {/* 4. Clock / Flight Time */}
            <div className="flex items-center gap-1.5" title="Đồng hồ thời gian bay">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-amber-300">{drone.flightTimeSeconds.toFixed(1)}s</span>
            </div>
          </div>

          {/* Re-open toolbox button */}
          {onToggleToolboxCollapse && (
            <button
              onClick={onToggleToolboxCollapse}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xl transition-all active:scale-95 group"
              title={
                language === 'vi'
                  ? 'Mở lại hộp công cụ (phím P)'
                  : 'Re-open simulator toolbox (key P)'
              }
            >
              <PanelRightOpen className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline">
                {language === 'vi' ? 'Hộp công cụ' : 'Toolbox'}
              </span>
              <span className="text-[10px] font-mono bg-cyan-800/80 px-1 py-0.2 rounded text-cyan-200">
                P
              </span>
            </button>
          )}
        </div>
      )}

      {/* Mini Legend (shown only when toolbox is NOT collapsed or on wide screens) */}
      {!isToolboxCollapsed && (
        <div className="absolute bottom-3 right-3 bg-slate-900/85 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 backdrop-blur-md flex items-center gap-3 pointer-events-none hidden md:flex">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block rounded"></span>
            <span>{language === 'vi' ? 'Thực tế' : 'Actual'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-amber-400 inline-block"></span>
            <span>{language === 'vi' ? 'Lý tưởng' : 'Ideal'}</span>
          </div>
          {comparisonPath && comparisonPath.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-pink-400 inline-block"></span>
              <span>{language === 'vi' ? 'So sánh cũ' : 'Compare'}</span>
            </div>
          )}
        </div>
      )}

      {/* Coordinate & Altitude Indicator */}
      <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 backdrop-blur-md flex items-center gap-3 pointer-events-none">
        <div>
          <span className="text-slate-400">X:</span>{' '}
          <span className="text-cyan-400 font-bold">{drone.position.x.toFixed(1)}</span>
        </div>
        <div>
          <span className="text-slate-400">Y:</span>{' '}
          <span className="text-cyan-400 font-bold">{drone.position.y.toFixed(1)}</span>
        </div>
        <div>
          <span className="text-slate-400">{language === 'vi' ? 'Cao Z:' : 'Alt Z:'}</span>{' '}
          <span className="text-emerald-400 font-bold">{drone.position.z.toFixed(1)}</span> cm
        </div>
        <div>
          <span className="text-slate-400">Yaw:</span>{' '}
          <span className="text-amber-400 font-bold">{Math.round(drone.yaw)}°</span>
        </div>
      </div>
    </div>
  );
};
