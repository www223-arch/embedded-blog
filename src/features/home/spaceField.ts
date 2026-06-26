import * as THREE from "three";
import { createSpaceFieldState } from "./spaceFieldMotion";

type StarPoint = {
  angle: number;
  radius: number;
  speed: number;
  y: number;
  z: number;
};

const STAR_COUNT = 720;
const FIELD_DEPTH = 13;

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
  const starPoints = createStarPoints(STAR_COUNT);
  const stars = createStarMesh(starPoints);
  const startedAt = performance.now();

  let disposed = false;
  let frameId = 0;
  let launchProgress = 0;
  let pointerX: number | null = null;
  let pointerY: number | null = null;

  renderer.domElement.className = "space-field-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  fieldGroup.add(stars, orbitGroup);
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

function updateOrbitGroup(group: THREE.Group, time: number, opacity: number): void {
  group.children.forEach((child, index) => {
    child.rotation.z += 0.0008 * (index + 1);
    const line = child as THREE.Line;
    const material = line.material as THREE.LineBasicMaterial;
    material.opacity = opacity * (0.58 - index * 0.1) + Math.sin(time * 0.8 + index) * 0.025;
  });
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
