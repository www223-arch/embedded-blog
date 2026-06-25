type Particle = {
  alpha: number;
  r: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

type Streak = {
  depth: number;
  drift: number;
  x: number;
  y: number;
};

export function mountHomeParticles(): () => void {
  const canvas = document.getElementById("heroParticles") as HTMLCanvasElement | null;
  if (!canvas) return () => {};
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const particles = createParticles(28);
  const streaks = createStreaks(36);
  const hero = canvas.closest<HTMLElement>(".hero");

  let disposed = false;
  let frameId = 0;
  let launchProgress = 0;
  let mouseX = -1000;
  let mouseY = -1000;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const handleMouseMove = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    hero?.style.setProperty("--hero-pointer-x", `${(mouseX / Math.max(rect.width, 1)) * 100}%`);
    hero?.style.setProperty("--hero-pointer-y", `${(mouseY / Math.max(rect.height, 1)) * 100}%`);
  };

  const handleMouseLeave = () => {
    mouseX = -1000;
    mouseY = -1000;
    hero?.style.removeProperty("--hero-pointer-x");
    hero?.style.removeProperty("--hero-pointer-y");
  };

  const handleScroll = () => {
    launchProgress = Math.min(Math.max((window.scrollY - 30) / 420, 0), 1);
  };

  const draw = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    drawLaunchStreaks(ctx, streaks, w, h, launchProgress);
    drawConnections(ctx, particles, w, h, launchProgress);
    drawParticles(ctx, particles, w, h, mouseX, mouseY, launchProgress);

    if (!disposed) frameId = requestAnimationFrame(draw);
  };

  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseleave", handleMouseLeave);
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", handleScroll, { passive: true });

  resize();
  handleScroll();
  draw();

  return () => {
    disposed = true;
    cancelAnimationFrame(frameId);
    canvas.removeEventListener("mousemove", handleMouseMove);
    canvas.removeEventListener("mouseleave", handleMouseLeave);
    window.removeEventListener("resize", resize);
    window.removeEventListener("scroll", handleScroll);
    hero?.style.removeProperty("--hero-pointer-x");
    hero?.style.removeProperty("--hero-pointer-y");
  };
}

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 1 + Math.random() * 2.4,
    vx: (Math.random() - 0.5) * 0.0006,
    vy: (Math.random() - 0.5) * 0.0006,
    alpha: 0.24 + Math.random() * 0.42
  }));
}

function createStreaks(count: number): Streak[] {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    depth: 0.25 + Math.random() * 0.75,
    drift: (Math.random() - 0.5) * 0.0008
  }));
}

function drawConnections(ctx: CanvasRenderingContext2D, particles: Particle[], w: number, h: number, launchProgress: number): void {
  const maxDistance = 150;
  const maxDistanceSquared = maxDistance * maxDistance;

  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const p1 = particles[i];
      const p2 = particles[j];
      const dx = (p1.x - p2.x) * w;
      const dy = (p1.y - p2.y) * h;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared >= maxDistanceSquared) continue;

      const distance = Math.sqrt(distanceSquared);
      const alpha = (1 - distance / maxDistance) * (0.22 + launchProgress * 0.18);
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1.1;
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    }
  }
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  w: number,
  h: number,
  mouseX: number,
  mouseY: number,
  launchProgress: number
): void {
  particles.forEach((particle) => {
    repelFromPointer(particle, w, h, mouseX, mouseY);

    particle.x += particle.vx;
    particle.y += particle.vy - launchProgress * 0.0012;
    normalizeParticleSpeed(particle);

    if (particle.x < 0 || particle.x > 1) particle.vx *= -1;
    if (particle.y < 0) particle.y = 1;
    if (particle.y > 1) particle.vy *= -1;

    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha + launchProgress * 0.24})`;
    ctx.arc(particle.x * w, particle.y * h, particle.r + launchProgress * 0.65, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawLaunchStreaks(
  ctx: CanvasRenderingContext2D,
  streaks: Streak[],
  w: number,
  h: number,
  launchProgress: number
): void {
  if (launchProgress <= 0.02) return;

  const originX = w * 0.5;
  const originY = h * 0.72;
  const warp = launchProgress * launchProgress;

  ctx.save();
  ctx.lineCap = "round";

  streaks.forEach((streak) => {
    streak.y -= warp * (0.003 + streak.depth * 0.004);
    streak.x += streak.drift;

    if (streak.y < -0.12) {
      streak.y = 1.12;
      streak.x = Math.random();
    }
    if (streak.x < -0.08) streak.x = 1.08;
    if (streak.x > 1.08) streak.x = -0.08;

    const x = streak.x * w;
    const y = streak.y * h;
    const dx = x - originX;
    const dy = y - originY;
    const distance = Math.max(Math.hypot(dx, dy), 1);
    const unitX = dx / distance;
    const unitY = dy / distance;
    const lineLength = (24 + streak.depth * 128) * warp;
    const tailX = x - unitX * lineLength;
    const tailY = y - unitY * lineLength;
    const gradient = ctx.createLinearGradient(tailX, tailY, x, y);

    gradient.addColorStop(0, "rgba(0, 212, 255, 0)");
    gradient.addColorStop(0.52, `rgba(0, 212, 255, ${0.1 + streak.depth * 0.28 * warp})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, ${0.22 + streak.depth * 0.48 * warp})`);

    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 0.7 + streak.depth * 1.2;
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(x, y);
    ctx.stroke();
  });

  ctx.restore();
}

function repelFromPointer(particle: Particle, w: number, h: number, mouseX: number, mouseY: number): void {
  const px = particle.x * w;
  const py = particle.y * h;
  const dx = px - mouseX;
  const dy = py - mouseY;
  const distanceSquared = dx * dx + dy * dy;

  if (distanceSquared >= 40000 || distanceSquared <= 0) return;

  const distance = Math.sqrt(distanceSquared);
  const force = Math.pow((200 - distance) / 200, 2);
  const angle = Math.atan2(dy, dx);
  particle.vx += (Math.cos(angle) * force * 0.15) / w;
  particle.vy += (Math.sin(angle) * force * 0.15) / h;
}

function normalizeParticleSpeed(particle: Particle): void {
  const idealMinSpeed = 0.0003;
  const idealMaxSpeed = 0.0008;
  const speedX = Math.abs(particle.vx);
  const speedY = Math.abs(particle.vy);

  if (speedX > idealMaxSpeed) particle.vx *= 0.99;
  if (speedY > idealMaxSpeed) particle.vy *= 0.99;

  if (speedX < idealMinSpeed) {
    const signX = particle.vx >= 0 ? 1 : -1;
    particle.vx = signX * (idealMinSpeed + Math.random() * 0.0003);
  }
  if (speedY < idealMinSpeed) {
    const signY = particle.vy >= 0 ? 1 : -1;
    particle.vy = signY * (idealMinSpeed + Math.random() * 0.0003);
  }

  const maxSpeed = 0.004;
  particle.vx = Math.max(-maxSpeed, Math.min(maxSpeed, particle.vx));
  particle.vy = Math.max(-maxSpeed, Math.min(maxSpeed, particle.vy));
}
