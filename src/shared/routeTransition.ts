import gsap from "gsap";
import { navigate } from "../app/router";
import type { RouteKey, RouteParams } from "../app/types";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
let closeActivePreview: (() => void) | null = null;

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

  closeActivePreview?.();
  const overlay = document.createElement("div");
  overlay.className = "route-preview-overlay";
  overlay.innerHTML = `<div class="route-preview-scrim" data-preview-action="close"></div>`;
  const transitionCard = buildTransitionCard(node, rect);
  overlay.appendChild(transitionCard);
  document.body.appendChild(overlay);
  overlay.classList.add("active");
  document.documentElement.classList.add("route-transition-lock");
  closeActivePreview = () => cleanupPreview(overlay);

  const targetWidth = Math.min(window.innerWidth - 48, 900);
  const targetHeight = Math.min(window.innerHeight - 120, Math.max(430, rect.height * 0.86));
  const targetLeft = (window.innerWidth - targetWidth) / 2;
  const targetTop = Math.max(74, (window.innerHeight - targetHeight) / 2);

  const closePreview = () => {
    gsap
      .timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => cleanupPreview(overlay)
      })
      .to(transitionCard, {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        borderRadius: 8,
        duration: 0.32
      })
      .to(
        overlay,
        {
          opacity: 0,
          duration: 0.18,
          ease: "power2.out"
        },
        "-=0.18"
      );
  };

  const openDetail = () => {
    gsap
      .timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => {
          cleanupPreview(overlay);
          navigate(route, params);
        }
      })
      .to(transitionCard, {
        y: -10,
        scale: 0.985,
        opacity: 0,
        duration: 0.22
      })
      .to(
        overlay,
        {
          opacity: 0,
          duration: 0.18
        },
        "-=0.16"
      );
  };

  overlay.addEventListener("click", (event) => {
    const action = (event.target as HTMLElement).closest<HTMLElement>("[data-preview-action]")?.dataset.previewAction;
    if (action === "close") closePreview();
    if (action === "open") openDetail();
  });

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") closePreview();
    if (event.key === "Enter") openDetail();
  };
  window.addEventListener("keydown", onKeyDown);
  overlay.addEventListener("route-preview-cleanup", () => window.removeEventListener("keydown", onKeyDown), { once: true });

  gsap
    .timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => transitionCard.classList.add("ready")
    })
    .set(overlay, {
      opacity: 1
    })
    .set(transitionCard, {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      opacity: 1
    })
    .to(transitionCard, {
      left: targetLeft,
      top: targetTop,
      width: targetWidth,
      height: targetHeight,
      borderRadius: 8,
      duration: 0.38
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
    <div class="route-card-transition-actions">
      <button type="button" data-preview-action="close">返回列表</button>
      <button type="button" data-preview-action="open">进入详情</button>
    </div>
  `;
  return overlay;
}

function cleanupPreview(overlay: HTMLElement): void {
  overlay.dispatchEvent(new Event("route-preview-cleanup"));
  overlay.remove();
  document.documentElement.classList.remove("route-transition-lock");
  if (closeActivePreview) closeActivePreview = null;
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
