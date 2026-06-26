import * as THREE from "three";
import { createSpaceFieldState } from "./spaceFieldMotion";

type StarPoint = {
  angle: number;
  radius: number;
  speed: number;
  y: number;
  z: number;
};

type PlumePoint = {
  angle: number;
  radius: number;
  drift: number;
  speed: number;
  lane: number;
};

const STAR_COUNT = 720;
const PLUME_COUNT = 190;
const FIELD_DEPTH = 13;
const TUNNEL_RING_COUNT = 13;

export function mountHomeSpaceField(): () => void {
  const host = document.getElementById("spaceField");
  if (!host) return () => {};

  const renderer = createRenderer();
  if (!renderer) {
    host.dataset.state = "unsupported";
    return () => {};
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  const fieldGroup = new THREE.Group();
  const orbitGroup = createOrbitGroup();
  const tunnelGroup = createTunnelGroup();
  const beam = createBeamMesh();
  const starPoints = createStarPoints(STAR_COUNT);
  const plumePoints = createPlumePoints(PLUME_COUNT);
  const stars = createStarMesh(starPoints);
  const plume = createPlumeMesh(plumePoints);
  const startedAt = performance.now();
  const hero = host.closest<HTMLElement>(".hero");

  let disposed = false;
  let frameId = 0;
  let launchProgress = 0;
  let pointerX: number | null = null;
  let pointerY: number | null = null;

  renderer.domElement.className = "space-field-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  fieldGroup.add(stars, orbitGroup, tunnelGroup, beam, plume);
  scene.add(fieldGroup);
  host.classList.add("ready");
  host.dataset.state = "ready";

  const resize = () => {
    const rect = host.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width), 1);
    const height = Math.max(Math.floor(rect.height), 1);
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const handlePointerMove = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / Math.max(rect.width, 1);
    pointerY = (event.clientY - rect.top) / Math.max(rect.height, 1);
  };

  const handlePointerLeave = () => {
    pointerX = null;
    pointerY = null;
  };

  const handleScroll = () => {
    launchProgress = clamp((window.scrollY - 20) / 440, 0, 1);
  };

  const render = () => {
    if (disposed) return;

    const time = (performance.now() - startedAt) / 1000;
    const state = createSpaceFieldState({ pointerX, pointerY, launchProgress });

    updateStars(stars, starPoints, time, state.starSpeed, state.warpStrength);
    updateOrbitGroup(orbitGroup, time, state.orbitalOpacity);
    updateTunnelGroup(tunnelGroup, time, state.tunnelCompression, state.orbitalOpacity);
    updateBeam(beam, time, state.beamOpacity);
    updatePlume(plume, plumePoints, time, state.plumeLength, state.plumeSpread, state.beamOpacity);
    syncHeroLaunchVars(hero, state.rocketAura, state.beamOpacity, state.plumeLength);

    fieldGroup.rotation.set(
      state.fieldRotation.x + Math.sin(time * 0.16) * 0.015,
      state.fieldRotation.y + time * 0.025,
      state.fieldRotation.z
    );
    camera.position.set(state.cameraPosition.x, state.cameraPosition.y, state.cameraPosition.z);
    camera.lookAt(0, -0.12, -3.2);

    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
  };

  resize();
  handleScroll();
  render();

  host.addEventListener("pointermove", handlePointerMove);
  host.addEventListener("pointerleave", handlePointerLeave);
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", handleScroll, { passive: true });

  return () => {
    disposed = true;
    cancelAnimationFrame(frameId);
    host.removeEventListener("pointermove", handlePointerMove);
    host.removeEventListener("pointerleave", handlePointerLeave);
    window.removeEventListener("resize", resize);
    window.removeEventListener("scroll", handleScroll);
    host.classList.remove("ready");
    delete host.dataset.state;
    clearHeroLaunchVars(hero);
    disposeObject(scene);
    renderer.dispose();
    renderer.domElement.remove();
  };
}

function createRenderer(): THREE.WebGLRenderer | null {
  try {
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    return renderer;
  } catch (error) {
    console.warn("Space field renderer is unavailable", error);
    return null;
  }
}

function createStarPoints(count: number): StarPoint[] {
  return Array.from({ length: count }, (_, index) => {
    const lane = index % 5;
    return {
      angle: Math.random() * Math.PI * 2,
      radius: 1.1 + Math.random() * 4.8 + lane * 0.08,
      speed: 0.55 + Math.random() * 1.4,
      y: (Math.random() - 0.5) * 3.8,
      z: -Math.random() * FIELD_DEPTH
    };
  });
}

function createPlumePoints(count: number): PlumePoint[] {
  return Array.from({ length: count }, (_, index) => {
    const lane = index % 6;
    return {
      angle: Math.random() * Math.PI * 2,
      radius: Math.random(),
      drift: Math.random() * Math.PI * 2,
      speed: 0.65 + Math.random() * 1.55,
      lane
    };
  });
}

function createStarMesh(points: StarPoint[]): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(points.length * 3), 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(createStarColors(points.length), 3));

  const material = new THREE.PointsMaterial({
    opacity: 0.78,
    size: 0.026,
    transparent: true,
    vertexColors: true,
    depthWrite: false
  });

  return new THREE.Points(geometry, material);
}

function createPlumeMesh(points: PlumePoint[]): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(points.length * 3), 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(createPlumeColors(points.length), 3));

  const material = new THREE.PointsMaterial({
    opacity: 0.3,
    size: 0.038,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const plume = new THREE.Points(geometry, material);
  plume.position.set(0, -1.72, -2.15);
  return plume;
}

function createStarColors(count: number): Float32Array {
  const colors = new Float32Array(count * 3);
  const palette = [
    new THREE.Color(0xdff8ff),
    new THREE.Color(0x67d9ff),
    new THREE.Color(0xffc46b),
    new THREE.Color(0xffffff)
  ];

  for (let index = 0; index < count; index += 1) {
    const color = palette[index % palette.length];
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  return colors;
}

function createPlumeColors(count: number): Float32Array {
  const colors = new Float32Array(count * 3);
  const palette = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xcff8ff),
    new THREE.Color(0x7fe9ff),
    new THREE.Color(0xffd29a)
  ];

  for (let index = 0; index < count; index += 1) {
    const color = palette[index % palette.length];
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  return colors;
}

function updateStars(stars: THREE.Points, points: StarPoint[], time: number, starSpeed: number, warpStrength: number): void {
  const positions = stars.geometry.getAttribute("position") as THREE.BufferAttribute;

  points.forEach((point, index) => {
    const travel = (point.z + time * point.speed * starSpeed * 1.8) % FIELD_DEPTH;
    const z = travel - FIELD_DEPTH;
    const depthScale = 1 + (FIELD_DEPTH + z) * warpStrength * 0.034;
    const angle = point.angle + time * 0.025 + z * 0.018;
    const x = Math.cos(angle) * point.radius * depthScale;
    const y = point.y * depthScale + Math.sin(angle * 1.7) * 0.08;

    positions.setXYZ(index, x, y, z);
  });

  positions.needsUpdate = true;
}

function updatePlume(
  plume: THREE.Points,
  points: PlumePoint[],
  time: number,
  length: number,
  spread: number,
  opacity: number
): void {
  const positions = plume.geometry.getAttribute("position") as THREE.BufferAttribute;
  const material = plume.material as THREE.PointsMaterial;
  const plumeDepth = 2.8 + length * 5.8;
  const plumeWidth = 0.12 + spread * 0.42;

  points.forEach((point, index) => {
    const stream = (point.radius + time * point.speed * 0.16) % 1;
    const taper = Math.pow(1 - stream, 1.7);
    const pulse = Math.sin(time * (1.6 + point.lane * 0.18) + point.drift) * 0.08;
    const radius = (0.05 + point.lane * 0.018 + stream * plumeWidth) * (0.74 + taper * 0.68 + pulse);
    const angle = point.angle + time * (0.36 + point.lane * 0.025) + stream * 1.1;
    const x = Math.cos(angle) * radius;
    const y = -stream * plumeDepth + Math.sin(point.drift + time * 2.1) * 0.035;
    const z = -stream * 1.65 + Math.sin(angle * 1.4) * 0.08;

    positions.setXYZ(index, x, y, z);
  });

  material.opacity = Math.min(0.46, 0.08 + opacity * 0.38);
  material.size = 0.026 + spread * 0.034;
  positions.needsUpdate = true;
}

function createOrbitGroup(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0x7fe9ff,
    opacity: 0.26,
    transparent: true,
    depthWrite: false
  });

  [
    { radiusX: 2.4, radiusY: 0.78, z: -3.2, rotation: 0.28 },
    { radiusX: 3.5, radiusY: 1.08, z: -5.4, rotation: -0.22 },
    { radiusX: 4.7, radiusY: 1.42, z: -7.6, rotation: 0.46 }
  ].forEach((ring) => {
    const points = [];
    for (let index = 0; index <= 96; index += 1) {
      const angle = (index / 96) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * ring.radiusX, Math.sin(angle) * ring.radiusY - 0.2, ring.z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.LineLoop(geometry, material.clone());
    line.rotation.z = ring.rotation;
    group.add(line);
  });

  return group;
}

function createTunnelGroup(): THREE.Group {
  const group = new THREE.Group();

  for (let index = 0; index < TUNNEL_RING_COUNT; index += 1) {
    const depth = index / (TUNNEL_RING_COUNT - 1);
    const radius = 0.86 + depth * 3.8;
    const geometry = createRingGeometry(radius, 0.42 + depth * 1.18);
    const material = new THREE.LineBasicMaterial({
      color: index % 3 === 0 ? 0xffc46b : 0x7fe9ff,
      opacity: 0.08 + depth * 0.08,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.LineLoop(geometry, material);
    ring.position.z = -2.1 - depth * 8.8;
    ring.rotation.z = index * 0.33;
    ring.userData.baseDepth = depth;
    ring.userData.baseRadius = radius;
    group.add(ring);
  }

  return group;
}

function createRingGeometry(radiusX: number, radiusY: number): THREE.BufferGeometry {
  const points = [];
  for (let index = 0; index <= 128; index += 1) {
    const angle = (index / 128) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY - 0.16, 0));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

function createBeamMesh(): THREE.Mesh {
  const geometry = new THREE.ConeGeometry(1.42, 8.6, 64, 1, true);
  const material = new THREE.MeshBasicMaterial({
    color: 0x73e9ff,
    opacity: 0.08,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const beam = new THREE.Mesh(geometry, material);
  beam.rotation.x = Math.PI / 2;
  beam.position.set(0, -0.42, -5.6);
  return beam;
}

function updateOrbitGroup(group: THREE.Group, time: number, opacity: number): void {
  group.children.forEach((child, index) => {
    child.rotation.z += 0.0008 * (index + 1);
    const line = child as THREE.Line;
    const material = line.material as THREE.LineBasicMaterial;
    material.opacity = opacity * (0.58 - index * 0.1) + Math.sin(time * 0.8 + index) * 0.025;
  });
}

function updateTunnelGroup(group: THREE.Group, time: number, compression: number, opacity: number): void {
  group.children.forEach((child, index) => {
    const ring = child as THREE.Line;
    const material = ring.material as THREE.LineBasicMaterial;
    const depth = ring.userData.baseDepth as number;
    const pulse = Math.sin(time * 1.15 + index * 0.7) * 0.035;
    const scale = 1 - compression * 0.28 + depth * compression * 0.18 + pulse;

    ring.position.z = -1.9 - depth * (9.6 - compression * 3.2);
    ring.scale.setScalar(Math.max(scale, 0.42));
    ring.rotation.z += 0.0018 + compression * 0.0032;
    material.opacity = opacity * (0.16 + depth * 0.18);
  });
}

function updateBeam(beam: THREE.Mesh, time: number, opacity: number): void {
  const material = beam.material as THREE.MeshBasicMaterial;
  const pulse = 0.92 + Math.sin(time * 2.2) * 0.08;
  beam.scale.set(1 + opacity * 0.18, pulse, 1 + opacity * 0.18);
  material.opacity = opacity * 0.18;
}

function syncHeroLaunchVars(hero: HTMLElement | null, rocketAura: number, beamOpacity: number, plumeLength: number): void {
  if (!hero) return;
  hero.style.setProperty("--launch-tunnel-intensity", rocketAura.toFixed(3));
  hero.style.setProperty("--launch-beam-opacity", beamOpacity.toFixed(3));
  hero.style.setProperty("--launch-plume-length", plumeLength.toFixed(3));
}

function clearHeroLaunchVars(hero: HTMLElement | null): void {
  hero?.style.removeProperty("--launch-tunnel-intensity");
  hero?.style.removeProperty("--launch-beam-opacity");
  hero?.style.removeProperty("--launch-plume-length");
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();

    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    materials.forEach((material) => material.dispose());
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
