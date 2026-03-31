export function mountHomeParticles(): void {
  const canvas = document.getElementById("heroParticles") as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  
  let mouseX = -1000;
  let mouseY = -1000;
  
  const particles = Array.from({ length: 34 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 1 + Math.random() * 2.6,
    vx: (Math.random() - 0.5) * 0.0006,
    vy: (Math.random() - 0.5) * 0.0006,
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
    
    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        const dx = (p1.x - p2.x) * w;
        const dy = (p1.y - p2.y) * h;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 120) {
          const alpha = (1 - distance / 120) * 0.12;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(p1.x * w, p1.y * h);
          ctx.lineTo(p2.x * w, p2.y * h);
          ctx.stroke();
        }
      }
    }
    
    particles.forEach((p) => {
      // Stronger mouse repulsion
      const px = p.x * w;
      const py = p.y * h;
      const dx = px - mouseX;
      const dy = py - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 200 && distance > 0) {
        const force = Math.pow((200 - distance) / 200, 2);
        const angle = Math.atan2(dy, dx);
        p.vx += Math.cos(angle) * force * 0.15 / w;
        p.vy += Math.sin(angle) * force * 0.15 / h;
      }
      
      p.x += p.vx;
      p.y += p.vy;
      
      // Smart speed control
      const idealMinSpeed = 0.0003;
      const idealMaxSpeed = 0.0008;
      const speedX = Math.abs(p.vx);
      const speedY = Math.abs(p.vy);
      
      // If too fast - slow down
      if (speedX > idealMaxSpeed) p.vx *= 0.99;
      if (speedY > idealMaxSpeed) p.vy *= 0.99;
      
      // If too slow - speed up
      if (speedX < idealMinSpeed) {
        const signX = p.vx >= 0 ? 1 : -1;
        p.vx = signX * (idealMinSpeed + Math.random() * 0.0003);
      }
      if (speedY < idealMinSpeed) {
        const signY = p.vy >= 0 ? 1 : -1;
        p.vy = signY * (idealMinSpeed + Math.random() * 0.0003);
      }
      
      // Hard limit
      const maxSpeed = 0.004;
      p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));
      p.vy = Math.max(-maxSpeed, Math.min(maxSpeed, p.vy));
      
      if (p.x < 0 || p.x > 1) p.vx *= -1;
      if (p.y < 0 || p.y > 1) p.vy *= -1;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    
    requestAnimationFrame(draw);
  };

  // Mouse events
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  canvas.addEventListener("mouseleave", () => {
    mouseX = -1000;
    mouseY = -1000;
  });

  resize();
  draw();
  window.addEventListener("resize", resize, { passive: true });
}
