import * as THREE from "three";
import { createSignalOrbitState } from "./sceneState.ts";
import type { ProjectChapter } from "./types.ts";

export type SignalOrbitSceneController = {
  setActiveChapter(index: number): void;
  dispose(): void;
};

type SignalOrbitRendererConfig = {
  pixelRatio: number;
  ariaHidden: string;
};

const STAR_COUNT = 180;

export function getSignalOrbitRendererConfig(devicePixelRatio: number): SignalOrbitRendererConfig {
  return { pixelRatio: Math.min(devicePixelRatio || 1, 1.5), ariaHidden: "true" };
}

export function mountSignalOrbitScene(host: HTMLElement, chapters: ProjectChapter[]): SignalOrbitSceneController | undefined {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.innerWidth < 760) return undefined;

  const renderer = createRenderer(host);
  if (!renderer) return undefined;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
  const world = new THREE.Group();
  const anchors = createAnchors(chapters);
  const signal = createSignalRibbon();
  const core = createControlCore();
  const stars = createStarField();
  const targetCamera = new THREE.Vector3();
  const targetLook = new THREE.Vector3();
  const currentLook = new THREE.Vector3();
  const targetSignalColor = new THREE.Color();

  world.add(stars, createOrbits(), core, signal.group, anchors.group);
  scene.add(world);
  host.appendChild(renderer.domElement);
  host.dataset.state = "ready";

  let activeIndex = 0;
  let frameId = 0;
  let disposed = false;
  let running = false;
  let lastFrameAt = performance.now();
  let elapsed = 0;

  const setActiveChapter = (index: number) => {
    const state = createSignalOrbitState(chapters, index);
    activeIndex = state.activeIndex;
    targetCamera.set(...state.cameraTarget);
    targetLook.set(...state.lookTarget);
    targetSignalColor.setHex(state.signalColor);
    signal.targetStrength = state.signalStrength;
    anchors.setActive(state.activeIndex, state.anchorColors);
  };

  const resize = () => {
    const rect = host.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width), 1);
    const height = Math.max(Math.floor(rect.height), 1);
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(getSignalOrbitRendererConfig(window.devicePixelRatio).pixelRatio);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const render = () => {
    if (disposed || !running) return;
    const now = performance.now();
    const delta = Math.min((now - lastFrameAt) / 1000, 0.05);
    lastFrameAt = now;
    elapsed += delta;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamera.x, 3.8, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamera.y, 3.8, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamera.z, 3.8, delta);
    currentLook.x = THREE.MathUtils.damp(currentLook.x, targetLook.x, 4.2, delta);
    currentLook.y = THREE.MathUtils.damp(currentLook.y, targetLook.y, 4.2, delta);
    currentLook.z = THREE.MathUtils.damp(currentLook.z, targetLook.z, 4.2, delta);
    camera.lookAt(currentLook);

    world.rotation.y = THREE.MathUtils.damp(world.rotation.y, (activeIndex - Math.max(chapters.length - 1, 0) / 2) * -0.055, 2.2, delta);
    core.rotation.y += delta * 0.24;
    core.rotation.x += delta * 0.08;
    updateSignal(signal, targetSignalColor, elapsed, delta);
    anchors.update(elapsed, activeIndex);

    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(frameId);
  };

  const start = () => {
    if (disposed || running || document.hidden) return;
    running = true;
    lastFrameAt = performance.now();
    frameId = requestAnimationFrame(render);
  };

  const handleVisibility = () => {
    if (document.hidden) stop();
    else start();
  };

  resize();
  setActiveChapter(0);
  camera.position.copy(targetCamera);
  currentLook.copy(targetLook);
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", handleVisibility);
  start();

  return {
    setActiveChapter,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      disposeScene(scene);
      renderer.dispose();
      renderer.domElement.remove();
      delete host.dataset.state;
    }
  };
}

function createRenderer(host: HTMLElement): THREE.WebGLRenderer | undefined {
  try {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    const config = getSignalOrbitRendererConfig(window.devicePixelRatio);
    renderer.setPixelRatio(config.pixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "immersive-project-canvas";
    renderer.domElement.setAttribute("aria-hidden", config.ariaHidden);
    renderer.domElement.style.pointerEvents = "none";
    return renderer;
  } catch (error) {
    console.warn("Signal orbit renderer is unavailable", error);
    host.dataset.state = "unsupported";
    return undefined;
  }
}

function createStarField(): THREE.Points {
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  const seed = createSeededRandom(481516);
  const palettes = [new THREE.Color(0xc9e7ff), new THREE.Color(0x75d9c7), new THREE.Color(0xe6b56c)];

  for (let index = 0; index < STAR_COUNT; index += 1) {
    const radius = 2.2 + seed() * 6.8;
    const angle = seed() * Math.PI * 2;
    const color = palettes[index % palettes.length];
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = (seed() - 0.5) * 4.4;
    positions[index * 3 + 2] = -seed() * 9.5;
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.042, transparent: true, opacity: 0.88, vertexColors: true, depthWrite: false }));
}

function createOrbits(): THREE.Group {
  const group = new THREE.Group();
  const rings = [
    { radiusX: 2.2, radiusY: 0.72, z: -0.8, rotation: 0.2, color: 0xe6b56c },
    { radiusX: 3.35, radiusY: 1.15, z: -1.8, rotation: -0.26, color: 0x79e0bf },
    { radiusX: 4.55, radiusY: 1.52, z: -2.9, rotation: 0.42, color: 0xb7a0ff }
  ];

  rings.forEach((ring) => {
    const points: THREE.Vector3[] = [];
    for (let index = 0; index <= 112; index += 1) {
      const angle = (index / 112) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * ring.radiusX, Math.sin(angle) * ring.radiusY, ring.z));
    }
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: ring.color, transparent: true, opacity: 0.48, depthWrite: false }));
    line.rotation.z = ring.rotation;
    group.add(line);
  });
  return group;
}

function createControlCore(): THREE.Mesh {
  const material = new THREE.MeshBasicMaterial({ color: 0x79e0bf, transparent: true, opacity: 0.84 });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 2), material);
  core.position.set(0, 0, -1.35);
  return core;
}

function createSignalRibbon(): { group: THREE.Group; material: THREE.MeshBasicMaterial; targetStrength: number } {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.9, -0.08, -2.7),
    new THREE.Vector3(-2.4, 0.38, -1.9),
    new THREE.Vector3(-0.8, -0.28, -1.22),
    new THREE.Vector3(0.75, 0.25, -1.1),
    new THREE.Vector3(2.25, -0.38, -1.82),
    new THREE.Vector3(3.85, 0.08, -2.65)
  ], false, "centripetal");
  const material = new THREE.MeshBasicMaterial({ color: 0x79e0bf, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false });
  const ribbon = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.052, 7, false), material);
  const group = new THREE.Group();
  group.add(ribbon);
  return { group, material, targetStrength: 1 };
}

function createAnchors(chapters: ProjectChapter[]): { group: THREE.Group; setActive(index: number, colors: number[]): void; update(elapsed: number, activeIndex: number): void } {
  const group = new THREE.Group();
  const meshes: THREE.Mesh[] = [];
  const count = Math.max(chapters.length, 1);

  for (let index = 0; index < count; index += 1) {
    const progress = count === 1 ? 0.5 : index / (count - 1);
    const angle = (progress - 0.5) * 1.52;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 18), new THREE.MeshBasicMaterial({ color: 0xe6b56c, transparent: true, opacity: 0.88 }));
    mesh.position.set(Math.sin(angle) * 2.65, Math.cos(angle * 1.8) * 0.42, -1.28 - Math.abs(angle) * 1.1);
    meshes.push(mesh);
    group.add(mesh);
  }

  return {
    group,
    setActive(index, colors) {
      meshes.forEach((mesh, meshIndex) => {
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.color.setHex(colors[meshIndex] ?? 0x79e0bf);
        material.opacity = meshIndex === index ? 1 : 0.56;
        mesh.scale.setScalar(meshIndex === index ? 1.75 : 1);
      });
    },
    update(elapsed, activeIndex) {
      meshes.forEach((mesh, index) => {
        const base = index === activeIndex ? 0.046 : 0.018;
        const pulse = Math.sin(elapsed * 2.1 + index * 1.7) * base;
        const target = index === activeIndex ? 1.75 + pulse : 1 + pulse;
        mesh.scale.setScalar(target);
      });
    }
  };
}

function updateSignal(
  signal: { material: THREE.MeshBasicMaterial; targetStrength: number },
  targetColor: THREE.Color,
  elapsed: number,
  delta: number
): void {
  signal.material.color.lerp(targetColor, 1 - Math.exp(-4 * delta));
  signal.material.opacity = 0.28 + signal.targetStrength * 0.32 + Math.sin(elapsed * 2.4) * 0.025;
}

function disposeScene(scene: THREE.Scene): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  scene.traverse((node) => {
    const renderable = node as THREE.Mesh;
    if (renderable.geometry) geometries.add(renderable.geometry);
    const material = renderable.material;
    (Array.isArray(material) ? material : material ? [material] : []).forEach((item) => materials.add(item));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

function createSeededRandom(seedValue: number): () => number {
  let seed = seedValue >>> 0;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}
