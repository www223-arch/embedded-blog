import gsap from "gsap";
import { navigate } from "../app/router";
import type { RouteKey, RouteParams } from "../app/types";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function navigateFromCard(card: Element, route: RouteKey, params?: RouteParams): void {
  const node = card as HTMLElement;
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
    navigate(route, params);
    return;
  }

  const rect = node.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    navigate(route, params);
    return;
  }

  const overlay = buildTransitionCard(node, rect);
  document.body.appendChild(overlay);
  document.documentElement.classList.add("route-transition-lock");

  const targetWidth = Math.min(window.innerWidth - 48, 900);
  const targetHeight = Math.min(window.innerHeight - 150, Math.max(360, rect.height * 0.72));
  const targetLeft = (window.innerWidth - targetWidth) / 2;
  const targetTop = Math.max(88, (window.innerHeight - targetHeight) / 2);

  gsap
    .timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        overlay.remove();
        document.documentElement.classList.remove("route-transition-lock");
      }
    })
    .set(overlay, {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      opacity: 1
    })
    .to(overlay, {
      left: targetLeft,
      top: targetTop,
      width: targetWidth,
      height: targetHeight,
      borderRadius: 8,
      duration: 0.38
    })
    .add(() => navigate(route, params), "-=0.12")
    .to(overlay, {
      opacity: 0,
      scale: 0.985,
      duration: 0.24,
      delay: 0.08,
      ease: "power2.out"
    });
}

function buildTransitionCard(source: HTMLElement, rect: DOMRect): HTMLElement {
  const title = source.querySelector("h3")?.textContent?.trim() || "Opening";
  const kicker = source.querySelector(".card-kicker-row")?.textContent?.replace(/\s+/g, " ").trim() || "Detail";
  const summary = source.querySelector(".card-summary, p")?.textContent?.trim() || "";
  const image = source.querySelector<HTMLImageElement>(".card-media img, img");
  const imageSrc = image?.currentSrc || image?.src || "";

  const overlay = document.createElement("div");
  overlay.className = "route-card-transition";
  overlay.style.left = `${rect.left}px`;
  overlay.style.top = `${rect.top}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;

  const media = imageSrc
    ? `<div class="route-card-transition-media" style="background-image: url('${escapeAttribute(imageSrc)}')"></div>`
    : `<div class="route-card-transition-media note"></div>`;

  overlay.innerHTML = `
    ${media}
    <div class="route-card-transition-copy">
      <span>${escapeHtml(kicker)}</span>
      <strong>${escapeHtml(title)}</strong>
      ${summary ? `<p>${escapeHtml(summary)}</p>` : ""}
    </div>
  `;
  return overlay;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
