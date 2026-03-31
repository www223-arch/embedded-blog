export function mountHomeParticles(): void {
  const canvas = document.getElementById("heroParticles") as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const particles = Array.from({ length: 34 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 1 + Math.random() * 2.6,
    vx: (Math.random() - 0.5) * 0.0005,
    vy: (Math.random() - 0.5) * 0.0005,
    alpha: 0.25 + Math.random() * 0.4
  }));

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > 1) p.vx *= -1;
      if (p.y < 0 || p.y > 1) p.vy *= -1;
      ctx.beginPath();
      ctx.fillStyle = `rgba(182,210,255,${p.alpha})`;
      ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  };

  resize();
  draw();
  window.addEventListener("resize", resize, { passive: true });
}
