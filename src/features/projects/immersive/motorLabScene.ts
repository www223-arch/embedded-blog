import * as THREE from "three";
import { createMotorLabState, isPointerDrag, type MotorLabPart } from "./motorLabState.ts";
import type { ImmersiveSceneController, ProjectChapter } from "./types.ts";

type MotorLabRendererConfig = {
  pixelRatio: number;
  interactive: true;
};

type MotorAssembly = {
  group: THREE.Group;
  rotor: THREE.Group;
  housingMaterial: THREE.MeshPhysicalMaterial;
  rotorMaterial: THREE.MeshStandardMaterial;
  encoderMaterial: THREE.MeshStandardMaterial;
  phaseMaterials: THREE.MeshStandardMaterial[];
  trace: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  tracePositions: Float32Array;
};

const TRACE_POINTS = 96;
const CHAPTER_PARTS: MotorLabPart[] = ["assembly", "phases", "encoder", "encoder", "rotor"];

export function getMotorLabRendererConfig(devicePixelRatio: number): MotorLabRendererConfig {
  return { pixelRatio: Math.min(devicePixelRatio || 1, 1.5), interactive: true };
}

export function mountMotorLabScene(
  host: HTMLElement,
  chapters: ProjectChapter[],
  onPartChange: (part: MotorLabPart) => void = () => {}
): ImmersiveSceneController | undefined {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.innerWidth < 760) return undefined;

  const renderer = createRenderer(host);
  if (!renderer) return undefined;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
  const world = new THREE.Group();
  const motor = createMotorAssembly();
  const labGrid = new THREE.GridHelper(9, 30, 0x31586d, 0x172839);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const targetLook = new THREE.Vector3(0, 0.05, 0);
  const targetRotation = new THREE.Vector2(-0.12, -0.5);
  const currentRotation = new THREE.Vector2(-0.12, -0.5);

  labGrid.position.y = -1.72;
  labGrid.material.transparent = true;
  labGrid.material.opacity = 0.24;
  world.add(createStarField(), labGrid, motor.group);
  scene.add(world);
  addLighting(scene);
  host.appendChild(renderer.domElement);
  host.dataset.state = "ready";
  host.dataset.scene = "motor-lab";

  let activeIndex = 0;
  let diagnostic = false;
  let selectedPart: MotorLabPart = "assembly";
  let targetCameraZ = 5.8;
  let targetHousingOpacity = 0.78;
  let targetRippleStrength = 0.2;
  let currentRippleStrength = 0.2;
  let frameId = 0;
  let disposed = false;
  let running = false;
  let lastFrameAt = performance.now();
  let elapsed = 0;
  let pointerId: number | undefined;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerLastX = 0;
  let pointerLastY = 0;
  let pointerDistanceSquared = 0;

  const applyState = () => {
    const state = createMotorLabState(chapters.length, activeIndex, diagnostic, selectedPart);
    activeIndex = state.activeIndex;
    targetCameraZ = state.cameraZ;
    targetHousingOpacity = state.housingOpacity;
    targetRippleStrength = state.rippleStrength;
    updatePartHighlight(motor, state.selectedPart);
  };

  const selectPart = (part: MotorLabPart) => {
    selectedPart = part;
    applyState();
    onPartChange(part);
  };

  const resize = () => {
    const rect = host.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width), 1);
    const height = Math.max(Math.floor(rect.height), 1);
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(getMotorLabRendererConfig(window.devicePixelRatio).pixelRatio);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    motor.group.position.x = width > 1080 ? 1.12 : 0.56;
    targetLook.x = width > 1080 ? 0.36 : 0.14;
  };

  const pickPart = (clientX: number, clientY: number) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(motor.group, true).find((intersection) => getMotorPart(intersection.object));
    selectPart(hit ? getMotorPart(hit.object) ?? "assembly" : "assembly");
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || pointerId !== undefined) return;
    pointerId = event.pointerId;
    pointerStartX = pointerLastX = event.clientX;
    pointerStartY = pointerLastY = event.clientY;
    pointerDistanceSquared = 0;
    renderer.domElement.setPointerCapture(event.pointerId);
    renderer.domElement.classList.add("is-dragging");
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return;
    const deltaX = event.clientX - pointerLastX;
    const deltaY = event.clientY - pointerLastY;
    const totalX = event.clientX - pointerStartX;
    const totalY = event.clientY - pointerStartY;
    pointerDistanceSquared = totalX * totalX + totalY * totalY;
    targetRotation.y += deltaX * 0.007;
    targetRotation.x = THREE.MathUtils.clamp(targetRotation.x + deltaY * 0.005, -0.72, 0.58);
    pointerLastX = event.clientX;
    pointerLastY = event.clientY;
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return;
    if (!isPointerDrag(pointerDistanceSquared)) pickPart(event.clientX, event.clientY);
    if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    renderer.domElement.classList.remove("is-dragging");
    pointerId = undefined;
  };

  const render = () => {
    if (disposed || !running) return;
    const now = performance.now();
    const delta = Math.min((now - lastFrameAt) / 1000, 0.05);
    lastFrameAt = now;
    elapsed += delta;

    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCameraZ, 3.5, delta);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, (activeIndex - Math.max(chapters.length - 1, 0) / 2) * 0.08, 2.4, delta);
    camera.lookAt(targetLook);
    currentRotation.x = THREE.MathUtils.damp(currentRotation.x, targetRotation.x, 5, delta);
    currentRotation.y = THREE.MathUtils.damp(currentRotation.y, targetRotation.y, 5, delta);
    motor.group.rotation.x = currentRotation.x;
    motor.group.rotation.y = currentRotation.y;
    motor.rotor.rotation.x += delta * (diagnostic ? 1.15 : 0.28);
    motor.housingMaterial.opacity = THREE.MathUtils.damp(motor.housingMaterial.opacity, targetHousingOpacity, 4, delta);
    currentRippleStrength = THREE.MathUtils.damp(currentRippleStrength, targetRippleStrength, 3.5, delta);
    updateSpeedTrace(motor, elapsed, currentRippleStrength);
    updateDiagnosticPulse(motor, elapsed, diagnostic);

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

  const handleVisibility = () => document.hidden ? stop() : start();

  resize();
  camera.position.set(0, 0.2, 5.8);
  applyState();
  onPartChange("assembly");
  renderer.domElement.addEventListener("pointerdown", handlePointerDown);
  renderer.domElement.addEventListener("pointermove", handlePointerMove);
  renderer.domElement.addEventListener("pointerup", handlePointerUp);
  renderer.domElement.addEventListener("pointercancel", handlePointerUp);
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", handleVisibility);
  start();

  return {
    setActiveChapter(index) {
      activeIndex = index;
      selectedPart = CHAPTER_PARTS[index] ?? "assembly";
      applyState();
      onPartChange(selectedPart);
    },
    setDiagnosticMode(active) {
      diagnostic = active;
      if (active) selectedPart = "encoder";
      applyState();
      onPartChange(selectedPart);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      disposeScene(scene);
      renderer.dispose();
      renderer.domElement.remove();
      delete host.dataset.state;
      delete host.dataset.scene;
    }
  };
}

function createRenderer(host: HTMLElement): THREE.WebGLRenderer | undefined {
  try {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(getMotorLabRendererConfig(window.devicePixelRatio).pixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.className = "immersive-project-canvas motor-lab-canvas";
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.pointerEvents = "auto";
    renderer.domElement.style.touchAction = "none";
    return renderer;
  } catch (error) {
    console.warn("Motor lab renderer is unavailable", error);
    host.dataset.state = "unsupported";
    return undefined;
  }
}

function createMotorAssembly(): MotorAssembly {
  const group = new THREE.Group();
  const rotor = new THREE.Group();
  const housingMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x8797a6,
    metalness: 0.82,
    roughness: 0.28,
    transparent: true,
    opacity: 0.78,
    transmission: 0.08,
    side: THREE.DoubleSide,
    depthWrite: false,
    emissive: 0x102333,
    emissiveIntensity: 0.18
  });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x263443, metalness: 0.86, roughness: 0.32, emissive: 0x102332 });
  const rotorMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5368, metalness: 0.78, roughness: 0.24, emissive: 0x15364a, emissiveIntensity: 0.3 });
  const copperMaterial = new THREE.MeshStandardMaterial({ color: 0xc5763c, metalness: 0.74, roughness: 0.24, emissive: 0x50210c, emissiveIntensity: 0.3 });
  const encoderMaterial = new THREE.MeshStandardMaterial({ color: 0xd8e1e8, metalness: 0.68, roughness: 0.22, emissive: 0x163e4b, emissiveIntensity: 0.36 });
  const phaseMaterials = [0xf06d62, 0x69ddbf, 0x719cf7].map((color) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.34, metalness: 0.2, roughness: 0.34 }));

  const housing = markPart(new THREE.Mesh(new THREE.CylinderGeometry(1.34, 1.34, 2.4, 56, 1, true, Math.PI * 0.18, Math.PI * 1.62), housingMaterial), "assembly");
  housing.rotation.z = Math.PI / 2;
  group.add(housing);

  const ringGeometry = new THREE.TorusGeometry(1.34, 0.075, 10, 56);
  [-1.18, 1.18].forEach((x) => {
    const ring = markPart(new THREE.Mesh(ringGeometry, darkMetal), "assembly");
    ring.rotation.y = Math.PI / 2;
    ring.position.x = x;
    group.add(ring);
  });

  const shaft = markPart(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.55, 28), darkMetal), "rotor");
  shaft.rotation.z = Math.PI / 2;
  rotor.add(shaft);
  const rotorStack = markPart(new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 1.9, 40), rotorMaterial), "rotor");
  rotorStack.rotation.z = Math.PI / 2;
  rotor.add(rotorStack);

  const magnetGeometry = new THREE.BoxGeometry(1.7, 0.12, 0.25);
  for (let index = 0; index < 8; index += 1) {
    const angle = index / 8 * Math.PI * 2;
    const magnet = markPart(new THREE.Mesh(magnetGeometry, rotorMaterial), "rotor");
    magnet.position.set(0, Math.cos(angle) * 0.58, Math.sin(angle) * 0.58);
    magnet.rotation.x = angle;
    rotor.add(magnet);
  }
  group.add(rotor);

  const statorToothGeometry = new THREE.BoxGeometry(1.78, 0.13, 0.22);
  const coilGeometry = new THREE.TorusGeometry(0.23, 0.068, 10, 24);
  const torusAxis = new THREE.Vector3(0, 0, 1);
  for (let index = 0; index < 12; index += 1) {
    const angle = index / 12 * Math.PI * 2;
    const radialY = Math.cos(angle);
    const radialZ = Math.sin(angle);
    const tooth = markPart(new THREE.Mesh(statorToothGeometry, darkMetal), "phases");
    tooth.position.set(0, radialY * 0.82, radialZ * 0.82);
    tooth.rotation.x = angle;
    const coil = markPart(new THREE.Mesh(coilGeometry, copperMaterial), "phases");
    coil.position.set(0, radialY * 0.96, radialZ * 0.96);
    coil.quaternion.setFromUnitVectors(torusAxis, new THREE.Vector3(0, -radialZ, radialY));
    coil.scale.set(1.42, 1, 1);
    group.add(tooth, coil);
  }

  const encoder = markPart(new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.08, 56), encoderMaterial), "encoder");
  encoder.rotation.z = Math.PI / 2;
  encoder.position.x = -1.48;
  group.add(encoder);
  const tickGeometry = new THREE.BoxGeometry(0.045, 0.035, 0.13);
  for (let index = 0; index < 24; index += 1) {
    const angle = index / 24 * Math.PI * 2;
    const tick = markPart(new THREE.Mesh(tickGeometry, darkMetal), "encoder");
    tick.position.set(-1.54, Math.cos(angle) * 0.57, Math.sin(angle) * 0.57);
    tick.rotation.x = angle;
    group.add(tick);
  }

  const phasePathMaterials = phaseMaterials;
  phasePathMaterials.forEach((material, index) => {
    const y = 1.18 - index * 0.13;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.1, y, 0.08 + index * 0.1),
      new THREE.Vector3(-0.25, y + 0.08, 0.2),
      new THREE.Vector3(0.62, y - 0.05, 0.05),
      new THREE.Vector3(1.46, y + 0.04, -0.12)
    ]);
    const path = markPart(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.024, 6, false), material), "phases");
    group.add(path);
  });

  const tracePositions = new Float32Array(TRACE_POINTS * 3);
  const traceGeometry = new THREE.BufferGeometry();
  traceGeometry.setAttribute("position", new THREE.BufferAttribute(tracePositions, 3));
  const trace = new THREE.Line(traceGeometry, new THREE.LineBasicMaterial({ color: 0x79e0bf, transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending, depthWrite: false }));
  trace.userData.motorPart = "encoder";
  group.add(trace);

  group.scale.setScalar(0.86);
  return { group, rotor, housingMaterial, rotorMaterial, encoderMaterial, phaseMaterials, trace, tracePositions };
}

function markPart<T extends THREE.Object3D>(object: T, part: MotorLabPart): T {
  object.userData.motorPart = part;
  return object;
}

function getMotorPart(object: THREE.Object3D): MotorLabPart | undefined {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.userData.motorPart) return current.userData.motorPart as MotorLabPart;
    current = current.parent;
  }
  return undefined;
}

function updatePartHighlight(motor: MotorAssembly, part: MotorLabPart): void {
  motor.housingMaterial.emissiveIntensity = part === "assembly" ? 0.56 : 0.14;
  motor.rotorMaterial.emissiveIntensity = part === "rotor" ? 0.9 : 0.28;
  motor.encoderMaterial.emissiveIntensity = part === "encoder" ? 1.1 : 0.34;
  motor.phaseMaterials.forEach((material) => { material.emissiveIntensity = part === "phases" ? 1.05 : 0.32; });
}

function updateSpeedTrace(motor: MotorAssembly, elapsed: number, strength: number): void {
  for (let index = 0; index < TRACE_POINTS; index += 1) {
    const progress = index / (TRACE_POINTS - 1);
    motor.tracePositions[index * 3] = -1.5 + progress * 3;
    motor.tracePositions[index * 3 + 1] = 1.52 + Math.sin(progress * Math.PI * 9 + elapsed * 3.5) * 0.08 * strength + Math.sin(progress * Math.PI * 23) * 0.035 * strength;
    motor.tracePositions[index * 3 + 2] = 0.45;
  }
  motor.trace.geometry.attributes.position.needsUpdate = true;
  motor.trace.material.opacity = 0.26 + strength * 0.56;
}

function updateDiagnosticPulse(motor: MotorAssembly, elapsed: number, diagnostic: boolean): void {
  const pulse = diagnostic ? 0.82 + Math.sin(elapsed * 4.4) * 0.22 : 0.34;
  motor.encoderMaterial.emissiveIntensity = Math.max(motor.encoderMaterial.emissiveIntensity, pulse);
  motor.phaseMaterials.forEach((material, index) => {
    const phasePulse = diagnostic ? 0.68 + Math.sin(elapsed * 3.2 + index * 2.1) * 0.26 : 0.32;
    material.emissiveIntensity = Math.max(material.emissiveIntensity, phasePulse);
  });
}

function createStarField(): THREE.Points {
  const count = 96;
  const positions = new Float32Array(count * 3);
  let seed = 90210;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * 11;
    positions[index * 3 + 1] = (random() - 0.42) * 7;
    positions[index * 3 + 2] = -1 - random() * 8;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xb9d6e7, size: 0.028, transparent: true, opacity: 0.72, depthWrite: false }));
}

function addLighting(scene: THREE.Scene): void {
  scene.add(new THREE.HemisphereLight(0xaccff0, 0x08121e, 1.35));
  const key = new THREE.DirectionalLight(0xeaf5ff, 3.2);
  key.position.set(3.6, 4.2, 5.4);
  scene.add(key);
  const rim = new THREE.PointLight(0x63dbbd, 8, 9);
  rim.position.set(-3, 1.2, 2.4);
  scene.add(rim);
  const copper = new THREE.PointLight(0xe0a05e, 5, 8);
  copper.position.set(2.8, -1.4, 1.8);
  scene.add(copper);
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
