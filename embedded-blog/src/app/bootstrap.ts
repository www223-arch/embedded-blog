import { renderHome } from "../features/home/view";
import { runTypewriter } from "../features/home/typewriter";
import { mountHomeParticles } from "../features/home/fx";
import { mountScrollEffect } from "../features/home/scrollEffect";
import { renderDocs, bindDocFilter } from "../features/docs/view";
import { renderProjects, bindProjectClick } from "../features/projects/view";
import { renderLife, bindLifeFilter } from "../features/life/view";
import { renderBoard, mountBoard } from "../features/board/view";
import { renderPlayground } from "../features/playground/view";
import { mountGames } from "../features/playground/games";
import { mountPet } from "../features/pet/petEngine";
import { animateViewEnter, bindHoverLift } from "../shared/motion";
import { getCurrentRoute, navigate, onRouteChange } from "./router";
import type { RouteKey } from "./types";
import { getModule, getNavModules, register } from "./moduleRegistry";
import { mountPaperCornerEasterEgg } from "../features/playground/entryEasterEgg";
import gsap from "gsap";

export function bootstrap(): void {
  registerDefaults();
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;
  app.innerHTML = shellTemplate();
  bindNav();
  renderRoute(getCurrentRoute());
  onRouteChange(renderRoute);
  mountPaperCornerEasterEgg();
}

function shellTemplate(): string {
  return `
  <header class="site-header">
    <a class="brand" href="#home">Embedded.dev</a>
    <nav id="nav"></nav>
  </header>
  <main id="view"></main>
  `;
}

function bindNav(): void {
  const nav = document.getElementById("nav");
  if (!nav) return;
  const iconMap: Record<string, string> = {
    home: "◉",
    docs: "📄",
    projects: "▢",
    life: "✦",
    board: "💭"
  };
  nav.innerHTML = [
    `<button data-route="home" class="nav-home nav-pill"><span class="nav-icon">${iconMap.home}</span><span>回到首页</span></button>`,
    ...getNavModules().map(
      (m) =>
        `<button data-route="${m.key}" class="nav-pill nav-${m.key}"><span class="nav-icon">${iconMap[m.key] || "?"}</span><span>${m.label}</span></button>`
    )
  ]
    .join("");
  nav.insertAdjacentHTML("beforeend", `<span id="navLiquidIndicator" class="nav-liquid-indicator"></span>`);
  nav.insertAdjacentHTML("beforeend", `<span id="navSheen" class="nav-sheen"></span>`);
  nav.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => navigate(btn.getAttribute("data-route") as RouteKey));
    bindMagnetic(btn);
  });
  // bindHeaderRefraction();
}

function renderRoute(route: RouteKey): void {
  const view = document.getElementById("view");
  const header = document.querySelector<HTMLElement>(".site-header");
  if (!view) return;
  const current = getModule(route);
  if (!current) return;
  
  // 添加页面类
  view.className = route;
  
  if (header) {
    header.classList.toggle("liquid-nav", route !== "home" && route !== "playground");
    header.classList.toggle("header-hidden", route === "playground");
    // 强制控制首页导航栏显示/隐藏
    if (route === "home") {
      header.style.display = "none";
    } else {
      header.style.display = "block";
    }
  }
  document.title = `Embedded Blog | ${current.title}`;
  view.innerHTML = current.render();
  animateViewEnter(view);
  bindHoverLift(".card");
  current.afterMount?.();
  document.querySelectorAll("#nav button").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-route") === route);
  });
  
  // 确保首页导航栏正确隐藏
  if (route === "home") {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (header) {
      header.style.display = "none";
      header.classList.remove("header-fixed");
    }
  }
  
  const cornerLabel = document.getElementById("paperCornerLabel");
  if (cornerLabel) cornerLabel.textContent = route === "playground" ? "Back" : "Play";
  updateNavIndicator();
}

function registerDefaults(): void {
  register({
    key: "home",
    label: "首页",
    title: "首页",
    visibleInNav: false,
    render: renderHome,
    afterMount: () => {
      runTypewriter();
      mountHomeParticles();
      bindStageNav();
      mountPet();
      mountScrollEffect();
    }
  });
  register({ key: "docs", label: "技术文档", title: "技术文档", render: renderDocs, afterMount: bindDocFilter });
  register({ key: "projects", label: "项目作品", title: "项目作品", render: renderProjects });
  register({ key: "life", label: "个人分享", title: "个人分享", render: renderLife, afterMount: bindLifeFilter });
  register({ key: "board", label: "留言板", title: "留言板", render: renderBoard, afterMount: mountBoard });
  register({
    key: "playground",
    label: "趣味实验室",
    title: "趣味实验室",
    visibleInNav: false,
    render: renderPlayground,
    afterMount: mountGames
  });
}

function bindStageNav(): void {
  document.querySelectorAll<HTMLElement>(".stage-card[data-route]").forEach((card) => {
    card.addEventListener("click", () => navigate(card.dataset.route as RouteKey));
  });
}

function updateNavIndicator(): void {
  const nav = document.getElementById("nav");
  const active = nav?.querySelector<HTMLElement>("button.active");
  const indicator = document.getElementById("navLiquidIndicator");
  if (!nav || !active || !indicator) return;
  const navRect = nav.getBoundingClientRect();
  const activeRect = active.getBoundingClientRect();
  const left = activeRect.left - navRect.left;
  gsap.to(indicator, {
    x: left,
    width: activeRect.width,
    opacity: 1,
    duration: 0.46,
    ease: "elastic.out(1, 0.75)"
  });
  const sheen = document.getElementById("navSheen");
  if (sheen) {
    gsap.fromTo(
      sheen,
      { x: left - 18, width: activeRect.width * 0.7, opacity: 0 },
      { x: left + activeRect.width * 0.35, width: 34, opacity: 0.58, duration: 0.24, ease: "power2.out" }
    );
    gsap.to(sheen, { opacity: 0, duration: 0.3, delay: 0.14, ease: "power2.out" });
  }
}

function bindHeaderRefraction(): void {
  const header = document.querySelector<HTMLElement>(".site-header");
  if (!header || header.dataset.scrollBound === "1") return;
  header.dataset.scrollBound = "1";
  const onScroll = () => {
    const y = window.scrollY;
    const opacity = Math.min(0.94, 0.68 + y / 520);
    const sat = Math.min(190, 125 + y / 3);
    header.style.backdropFilter = `blur(14px) saturate(${sat}%)`;
    header.style.background = `rgba(235, 243, 255, ${opacity})`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function bindMagnetic(btn: Element): void {
  const node = btn as HTMLElement;
  node.addEventListener("pointermove", (event) => {
    const rect = node.getBoundingClientRect();
    const dx = (event.clientX - rect.left - rect.width / 2) / rect.width;
    const dy = (event.clientY - rect.top - rect.height / 2) / rect.height;
    gsap.to(node, { x: dx * 6, y: dy * 4, duration: 0.2, ease: "power2.out", overwrite: true });
  });
  node.addEventListener("pointerleave", () => {
    gsap.to(node, { x: 0, y: 0, duration: 0.28, ease: "power2.out" });
  });
}
