import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createIssScenePose } from "./issMotion";

const MODEL_PATH = "models/nasa/iss-b.glb";

export function mountHomeIssScene(): () => void {
  const host = document.getElementById("issScene");
  if (!host) return () => {};

  const renderer = createRenderer();
  if (!renderer) {
    host.dataset.state = "unsupported";
    return () => {};
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  const modelGroup = new THREE.Group();
  const stars = createStarField();
  const startedAt = performance.now();
  const dracoLoader = new DRACOLoader();
  const loader = new GLTFLoader();

  let disposed = false;
  let frameId = 0;
  let launchProgress = 0;
  let pointerX: number | null = null;
  let pointerY: number | null = null;

  renderer.domElement.className = "iss-scene-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  scene.add(createAmbientLight(), createKeyLight(), createRimLight(), stars, modelGroup);
  dracoLoader.setDecoderPath(`${import.meta.env.BASE_URL}vendor/draco/`);
  loader.setDRACOLoader(dracoLoader);

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
    const pose = createIssScenePose({ pointerX, pointerY, launchProgress, time });
    const isNarrowLayout = host.clientWidth < 640;
    const responsiveScale = isNarrowLayout ? 0.68 : 1;
    const baseX = isNarrowLayout ? 1.42 : 1.05;
    const baseY = isNarrowLayout ? 0.02 : 0.12;
    const scrollDrift = isNarrowLayout ? 0.22 : 0.36;

    modelGroup.scale.setScalar(responsiveScale);
    modelGroup.rotation.set(
      pose.modelRotation.x + Math.sin(time * 0.32) * 0.035,
      pose.modelRotation.y + time * 0.035,
      pose.modelRotation.z + Math.sin(time * 0.24) * 0.018
    );
    modelGroup.position.set(baseX - launchProgress * scrollDrift, baseY + launchProgress * 0.04, 0);
    stars.rotation.y = time * 0.018 + launchProgress * 0.18;
    stars.rotation.x = -launchProgress * 0.08;

    camera.position.set(
      pose.cameraPosition.x * 0.78,
      pose.cameraPosition.y * 0.82,
      pose.cameraPosition.z + launchProgress * 0.38 + (isNarrowLayout ? 0.75 : 0)
    );
    camera.lookAt(0.6 - launchProgress * 0.35, 0.05, 0);
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
  };

  loader.load(
    `${import.meta.env.BASE_URL}${MODEL_PATH}`,
    (gltf) => {
      if (disposed) {
        disposeObject(gltf.scene);
        return;
      }

      normalizeModel(gltf.scene);
      modelGroup.add(gltf.scene);
      host.classList.add("ready");
      host.dataset.state = "ready";
      host.dataset.modelChildren = String(modelGroup.children.length);
    },
    undefined,
    (error) => {
      host.dataset.state = "error";
      console.warn("ISS model failed to load", error);
    }
  );

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
    delete host.dataset.modelChildren;
    disposeObject(scene);
    dracoLoader.dispose();
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
    renderer.shadowMap.enabled = false;
    return renderer;
  } catch (error) {
    console.warn("WebGL renderer is unavailable", error);
    return null;
  }
}

function createAmbientLight(): THREE.AmbientLight {
  return new THREE.AmbientLight(0xc9e8ff, 1.05);
}

function createKeyLight(): THREE.DirectionalLight {
  const light = new THREE.DirectionalLight(0xffffff, 2.4);
  light.position.set(-3.4, 3.2, 4.6);
  return light;
}

function createRimLight(): THREE.DirectionalLight {
  const light = new THREE.DirectionalLight(0x4edcff, 1.8);
  light.position.set(4.5, -1.6, -2.2);
  return light;
}

function createStarField(): THREE.Points {
  const count = 320;
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const radius = 7 + Math.random() * 14;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    positions[index * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    positions[index * 3 + 1] = Math.cos(phi) * radius * 0.56;
    positions[index * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius - 4;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xdff8ff,
    opacity: 0.64,
    size: 0.028,
    transparent: true,
    depthWrite: false
  });

  return new THREE.Points(geometry, material);
}

function normalizeModel(model: THREE.Object3D): void {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z, 1);
  const scale = 3.1 / maxAxis;

  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
  model.rotation.set(0.14, -0.38, -0.08);
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();

    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    materials.forEach((material) => disposeMaterial(material));
  });
}

function disposeMaterial(material: THREE.Material): void {
  Object.values(material).forEach((value) => {
    if (value instanceof THREE.Texture) value.dispose();
  });
  material.dispose();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
