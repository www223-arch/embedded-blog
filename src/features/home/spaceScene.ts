import * as THREE from "three";

type DisposableObject = THREE.Object3D & {
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material | THREE.Material[];
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

export function mountHomeSpaceScene(): () => void {
  const host = document.getElementById("spaceScene");
  if (!host || reducedMotion.matches || !supportsWebGL()) return () => {};

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = "space-scene-canvas";
  host.appendChild(renderer.domElement);
  host.classList.add("ready");
  const fallbackRocket = document.querySelector(".rocket-container");
  fallbackRocket?.classList.add("rocket-container--space-ready");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
  camera.position.set(0, 0.15, 9.4);

  const pointer = new THREE.Vector2();
  const targetPointer = new THREE.Vector2();
  const clock = new THREE.Clock();
  const textures: THREE.Texture[] = [];

  const rig = new THREE.Group();
  scene.add(rig);

  const starTexture = createStarTexture();
  textures.push(starTexture);
  const starsFar = createStarField(780, 56, 0.1, 0xbfd8ff, starTexture);
  const starsNear = createStarField(180, 28, 0.24, 0xffffff, starTexture);
  rig.add(starsFar, starsNear);

  const nebulaTexture = createNebulaTexture();
  textures.push(nebulaTexture);
  const nebula = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: nebulaTexture,
      color: 0x7adfff,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  nebula.scale.set(9.5, 5.8, 1);
  nebula.position.set(2.4, 0.25, -5);
  rig.add(nebula);

  const orbitGroup = createOrbitGroup();
  orbitGroup.position.set(1.5, -0.95, -1.6);
  rig.add(orbitGroup);

  const rocket = createRocket();
  rocket.position.set(1.9, -2.35, 0.4);
  rocket.rotation.set(0.18, -0.22, -0.2);
  rocket.scale.setScalar(0.72);
  rig.add(rocket);

  const launchLight = new THREE.PointLight(0x67d8ff, 1.7, 8, 1.8);
  launchLight.position.set(1.9, -2.65, 1.2);
  rig.add(launchLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
  keyLight.position.set(-2.5, 2.8, 4);
  scene.add(keyLight);
  scene.add(new THREE.AmbientLight(0x91a7ff, 0.55));

  let scrollProgress = 0;
  let launchProgress = 0;
  let frameId = 0;
  let disposed = false;
  let isNarrow = false;

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    isNarrow = width < 640;
    camera.aspect = width / height;
    camera.fov = isNarrow ? 54 : 48;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  const handlePointerMove = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    targetPointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    targetPointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  };

  const handlePointerLeave = () => {
    targetPointer.set(0, 0);
  };

  const updateScroll = () => {
    scrollProgress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
    launchProgress = THREE.MathUtils.clamp((window.scrollY - 80) / 540, 0, 1);
  };

  const animate = () => {
    const elapsed = clock.getElapsedTime();
    pointer.lerp(targetPointer, 0.055);

    rig.rotation.y = pointer.x * 0.055 + scrollProgress * 0.08;
    rig.rotation.x = -pointer.y * 0.035 - scrollProgress * 0.045;
    starsFar.rotation.y = elapsed * 0.006;
    starsNear.rotation.y = -elapsed * 0.012;
    nebula.material.opacity = 0.18 + Math.sin(elapsed * 0.7) * 0.035;

    orbitGroup.position.x = isNarrow ? 0.72 : 1.5;
    orbitGroup.position.y = isNarrow ? -0.58 : -0.95;
    orbitGroup.rotation.x = 1.1 + Math.sin(elapsed * 0.2) * 0.05;
    orbitGroup.rotation.z = elapsed * 0.08;

    const rocketBaseX = isNarrow ? 1.05 : 1.9;
    const rocketBaseScale = isNarrow ? 0.56 : 0.72;
    rocket.position.y = -2.35 + launchProgress * 5.9 + Math.sin(elapsed * 2.2) * 0.025;
    rocket.position.x = rocketBaseX - launchProgress * 0.6 + pointer.x * 0.08;
    rocket.rotation.z = -0.2 - launchProgress * 0.16 + pointer.x * 0.025;
    rocket.scale.setScalar(rocketBaseScale - launchProgress * 0.14);

    const exhaust = rocket.getObjectByName("rocket-exhaust");
    if (exhaust) {
      exhaust.scale.set(1 + launchProgress * 0.65, 1 + launchProgress * 1.8, 1 + launchProgress * 0.65);
      exhaust.visible = launchProgress > 0.03 || Math.sin(elapsed * 10) > -0.2;
    }

    launchLight.position.x = rocket.position.x;
    launchLight.position.y = rocket.position.y - 0.3;
    launchLight.intensity = 1.2 + launchProgress * 3.1 + Math.sin(elapsed * 12) * 0.22;
    camera.position.z = 9.4 - scrollProgress * 1.55;
    camera.position.x = pointer.x * 0.18;
    camera.position.y = 0.15 - scrollProgress * 0.35 - pointer.y * 0.1;
    camera.lookAt(0, -0.1, 0);

    renderer.render(scene, camera);
    if (!disposed) frameId = requestAnimationFrame(animate);
  };

  resize();
  updateScroll();
  animate();

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", updateScroll, { passive: true });
  host.addEventListener("pointermove", handlePointerMove);
  host.addEventListener("pointerleave", handlePointerLeave);

  return () => {
    disposed = true;
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", resize);
    window.removeEventListener("scroll", updateScroll);
    host.removeEventListener("pointermove", handlePointerMove);
    host.removeEventListener("pointerleave", handlePointerLeave);
    host.classList.remove("ready");
    fallbackRocket?.classList.remove("rocket-container--space-ready");
    renderer.domElement.remove();
    disposeScene(scene);
    textures.forEach((texture) => texture.dispose());
    renderer.dispose();
  };
}

function supportsWebGL(): boolean {
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
}

function createStarField(
  count: number,
  radius: number,
  size: number,
  color: THREE.ColorRepresentation,
  map: THREE.Texture
): THREE.Points {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const distance = THREE.MathUtils.randFloat(radius * 0.35, radius);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));

    positions[i * 3] = distance * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = distance * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = distance * Math.cos(phi);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color,
      map,
      size,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.72,
      alphaTest: 0.02,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
}

function createStarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);

  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 30);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.34, "rgba(255, 255, 255, 0.88)");
  gradient.addColorStop(0.72, "rgba(255, 255, 255, 0.18)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createOrbitGroup(): THREE.Group {
  const group = new THREE.Group();
  const orbitMaterial = new THREE.LineBasicMaterial({
    color: 0xaedbff,
    transparent: true,
    opacity: 0.38,
    blending: THREE.AdditiveBlending
  });

  [2.1, 2.7, 3.35].forEach((radius, index) => {
    const points = [];
    for (let i = 0; i <= 160; i += 1) {
      const angle = (i / 160) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.34, 0));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), orbitMaterial.clone());
    line.rotation.z = index * 0.38;
    group.add(line);
  });

  const satellite = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.26, 0.26),
    new THREE.MeshStandardMaterial({ color: 0xf1f7ff, roughness: 0.32, metalness: 0.58 })
  );
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x2266c9,
    roughness: 0.42,
    metalness: 0.28,
    emissive: 0x0a2d66,
    emissiveIntensity: 0.28
  });
  const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.04, 0.34), panelMaterial);
  const rightPanel = leftPanel.clone();
  leftPanel.position.x = -0.54;
  rightPanel.position.x = 0.54;
  satellite.add(body, leftPanel, rightPanel);
  satellite.position.set(2.7, 0.02, 0.12);
  satellite.rotation.set(0.25, 0.75, 0.1);
  group.add(satellite);

  return group;
}

function createRocket(): THREE.Group {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xf6fbff, roughness: 0.24, metalness: 0.24 });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0x5ad7ff,
    emissive: 0x1195ff,
    emissiveIntensity: 0.6,
    roughness: 0.18,
    metalness: 0.18
  });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x07111f, roughness: 0.18, metalness: 0.72 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.23, 1.22, 32), bodyMaterial);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 32), bodyMaterial);
  const window = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 16), darkMaterial);
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.012, 8, 40), trimMaterial);
  const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.16, 28), darkMaterial);

  nose.position.y = 0.82;
  window.position.set(0, 0.34, 0.18);
  stripe.position.y = -0.22;
  stripe.rotation.x = Math.PI / 2;
  engine.position.y = -0.69;

  const finMaterial = new THREE.MeshStandardMaterial({ color: 0xdde8f5, roughness: 0.35, metalness: 0.25 });
  const finGeometry = new THREE.ConeGeometry(0.12, 0.42, 3);
  [-0.23, 0.23].forEach((x, index) => {
    const fin = new THREE.Mesh(finGeometry, finMaterial);
    fin.position.set(x, -0.48, 0.02);
    fin.rotation.set(Math.PI / 2, 0, index === 0 ? -0.55 : 0.55);
    group.add(fin);
  });

  const exhaustMaterial = new THREE.MeshBasicMaterial({
    color: 0x69dcff,
    transparent: true,
    opacity: 0.58,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const exhaust = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.2, 32), exhaustMaterial);
  exhaust.name = "rocket-exhaust";
  exhaust.position.y = -1.36;
  exhaust.rotation.x = Math.PI;

  group.add(body, nose, window, stripe, engine, exhaust);
  return group;
}

function createNebulaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);

  const gradient = context.createRadialGradient(256, 256, 20, 256, 256, 250);
  gradient.addColorStop(0, "rgba(116, 229, 255, 0.95)");
  gradient.addColorStop(0.35, "rgba(83, 134, 255, 0.45)");
  gradient.addColorStop(0.68, "rgba(255, 167, 75, 0.18)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 38; i += 1) {
    const x = 130 + Math.random() * 260;
    const y = 130 + Math.random() * 260;
    const r = 20 + Math.random() * 70;
    const cloud = context.createRadialGradient(x, y, 0, x, y, r);
    cloud.addColorStop(0, "rgba(255, 255, 255, 0.16)");
    cloud.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = cloud;
    context.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function disposeScene(scene: THREE.Scene): void {
  scene.traverse((object) => {
    const disposable = object as DisposableObject;
    disposable.geometry?.dispose();
    if (Array.isArray(disposable.material)) {
      disposable.material.forEach((material) => material.dispose());
    } else {
      disposable.material?.dispose();
    }
  });
}
