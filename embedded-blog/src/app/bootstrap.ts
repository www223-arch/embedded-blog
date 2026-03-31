import { renderHome } from "../features/home/view";
import { runTypewriter } from "../features/home/typewriter";
import { renderDocs, bindDocFilter } from "../features/docs/view";
import { renderProjects } from "../features/projects/view";
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
    <div class="container nav">
      <a class="brand" href="#home">Embedded.dev</a>
      <nav id="nav"></nav>
    </div>
  </header>
  <main id="view"></main>
  <footer class="container footer">© ${new Date().getFullYear()} WL | Built with Vite + TypeScript</footer>
  `;
}

function bindNav(): void {
  const nav = document.getElementById("nav");
  if (!nav) return;
  const iconMap: Record<string, string> = {
    home: "⌂",
    docs: "◫",
    projects: "✦",
    life: "✿",
    board: "✎"
  };
  nav.innerHTML = [
    `<button data-route="home" class="nav-home nav-pill"><span class="nav-icon">${iconMap.home}</span><span>回到首页</span></button>`,
    ...getNavModules().map(
      (m) =>
        `<button data-route="${m.key}" class="nav-pill nav-${m.key}"><span class="nav-icon">${iconMap[m.key] || "•"}</span><span>${m.label}</span></button>`
    )
  ]
    .join("");
  nav.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => navigate(btn.getAttribute("data-route") as RouteKey));
  });
}

function renderRoute(route: RouteKey): void {
  const view = document.getElementById("view");
  const header = document.querySelector<HTMLElement>(".site-header");
  if (!view) return;
  const current = getModule(route);
  if (!current) return;
  if (header) {
    header.classList.toggle("liquid-nav", route !== "home" && route !== "playground");
    header.classList.toggle("header-hidden", route === "playground");
  }
  document.title = `Embedded Blog | ${current.title}`;
  view.innerHTML = current.render();
  animateViewEnter(view);
  bindHoverLift(".card");
  current.afterMount?.();
  document.querySelectorAll("#nav button").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-route") === route);
  });
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
      bindStageNav();
      mountPet();
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
