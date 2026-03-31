import gsap from "gsap";
import { navigate } from "../../app/router";

const DRAG_THRESHOLD = 140;

export function mountPaperCornerEasterEgg(): void {
  if (document.getElementById("paperCorner")) return;

  const corner = document.createElement("div");
  corner.id = "paperCorner";
  corner.className = "paper-corner";
  corner.innerHTML = `<div class="paper-corner-inner"><span>Play</span></div>`;
  document.body.appendChild(corner);

  let startX = 0;
  let startY = 0;
  let dragging = false;

  corner.addEventListener("pointerdown", (event) => {
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    corner.setPointerCapture(event.pointerId);
  });

  corner.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = Math.min(0, event.clientX - startX);
    const dy = Math.min(0, event.clientY - startY);
    const dist = Math.hypot(dx, dy);
    gsap.to(corner, {
      x: dx * 0.55,
      y: dy * 0.55,
      rotate: Math.max(-22, -dist / 11),
      duration: 0.08,
      overwrite: true
    });
    if (dist > DRAG_THRESHOLD) {
      triggerOpen(corner);
      dragging = false;
    }
  });

  corner.addEventListener("pointerup", () => {
    dragging = false;
    gsap.to(corner, { x: 0, y: 0, rotate: 0, duration: 0.28, ease: "power2.out" });
  });
}

function triggerOpen(corner: HTMLElement): void {
  gsap.to(corner, {
    scale: 1.12,
    opacity: 0,
    duration: 0.28,
    onComplete: () => {
      navigate("playground");
      gsap.set(corner, { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 });
    }
  });
}
