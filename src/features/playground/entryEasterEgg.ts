import gsap from "gsap";
import { getCurrentRoute, navigate } from "../../app/router";

const DRAG_THRESHOLD = 140;

export function mountPaperCornerEasterEgg(): void {
  if (document.getElementById("paperCorner")) return;

  const corner = document.createElement("div");
  corner.id = "paperCorner";
  corner.className = "paper-corner";
  corner.innerHTML = `<div class="paper-corner-inner"><span id="paperCornerLabel">Play</span></div>`;
  document.body.appendChild(corner);
  ensurePageFlipOverlay();

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
  if ("vibrate" in navigator) navigator.vibrate([30, 35, 30]);
  corner.classList.add("paper-corner-shake");
  const now = getCurrentRoute();
  const target = now.route === "playground" ? "home" : "playground";
  const label = document.getElementById("paperCornerLabel");
  if (label) label.textContent = target === "playground" ? "Play" : "Back";
  runPageFlip(target, () => {
    corner.classList.remove("paper-corner-shake");
    gsap.set(corner, { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 });
  });
}

function ensurePageFlipOverlay(): void {
  if (document.getElementById("pageFlipOverlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "pageFlipOverlay";
  overlay.className = "page-flip-overlay";
  overlay.innerHTML = `<div class="page-flip-sheet"></div>`;
  document.body.appendChild(overlay);
}

function runPageFlip(target: "home" | "playground", onDone: () => void): void {
  const overlay = document.getElementById("pageFlipOverlay");
  const sheet = overlay?.querySelector(".page-flip-sheet") as HTMLElement | null;
  if (!overlay || !sheet) {
    navigate(target);
    onDone();
    return;
  }
  overlay.classList.add("active");
  
  // 重置初始状态 - 确保动画从正确的起点开始
  gsap.set(sheet, { 
    transformOrigin: "right bottom",
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
    x: 0,
    y: 0
  });
  
  // ??????????????????
  gsap.to(sheet, {
    rotateX: -15,
    rotateY: -120,
    rotateZ: 8,
    scale: 0.95,
    x: -50,
    y: 30,
    duration: 0.5,
    ease: "power2.in",
    onComplete: () => {
      // ??????????????????
      navigate(target);
      
      // ???????????????????????
      gsap.to(sheet, {
        rotateX: -30,
        rotateY: -180,
        rotateZ: 15,
        scale: 0.9,
        x: -100,
        y: 50,
        opacity: 0,
        duration: 0.4,
        ease: "power3.out",
        onComplete: () => {
          overlay.classList.remove("active");
          gsap.set(sheet, { opacity: 1 });
          onDone();
        }
      });
    }
  });
}
