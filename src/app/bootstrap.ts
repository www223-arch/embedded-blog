import gsap from "gsap";
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
import { mountPaperCornerEasterEgg } from "../features/playground/entryEasterEgg";
import { animateViewEnter, bindHoverLift, bindPointerSpotlight } from "../shared/motion";
import { lazyLoadBackgrounds } from "../shared/lazyLoad";
import { bindDocumentShell, renderDocumentShell } from "../shared/documentView";
import { techDocs } from "../content/docs";
import { projectItems } from "../content/projects";
import { lifePosts } from "../content/lifePosts";
import { getCurrentRoute, navigate, onRouteChange } from "./router";
import type { RouteKey, RouteParams } from "./types";
import { getModule, getNavModules, register } from "./moduleRegistry";

export function bootstrap(): void {
  registerDefaults();
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;

  const base = import.meta.env.BASE_URL;
  document.documentElement.style.setProperty("--base-url", base);
  document.documentElement.style.setProperty("--bg-projects", `url('${base}KSC - SLS_03302026_Artemis II at the pad~orig.jpg')`);

  app.innerHTML = shellTemplate();
  bindNav();
  bindNavControls();
  bindQuickDock();
  bindThemeToggle();
  bindSearch();
  initTheme();
  renderRoute(getCurrentRoute());
  onRouteChange(renderRoute);
  mountPaperCornerEasterEgg();
}

function shellTemplate(): string {
  return `
    <header class="site-header">
      <a class="brand" href="#home">Embedded.dev</a>
      <nav id="nav"></nav>
      <div class="nav-right">
        <div class="nav-controls-container">
          <button class="nav-controls-btn" id="navControlsBtn" title="打开控制">
            <span class="nav-controls-icon">...</span>
          </button>
          <div class="nav-controls-panel" id="navControlsPanel">
            <div class="search-box">
              <input type="text" id="searchInput" placeholder="搜索..." />
              <button class="search-btn" id="searchBtn">Go</button>
            </div>
            <button class="theme-toggle" id="themeToggle" title="切换主题">
              <span class="theme-icon sun">L</span>
              <span class="theme-icon moon">D</span>
            </button>
          </div>
        </div>
        <button class="back-btn nav-back-btn" id="navBackBtn" title="返回" style="display: none;">
          <span class="back-icon">&lt;</span>
          <span>返回</span>
        </button>
      </div>
    </header>
    <div id="sidebarContainer"></div>
    <main id="view"></main>
    <div class="quick-dock" id="quickDock" aria-label="Quick actions">
      <button type="button" data-quick-action="search" aria-label="Focus search" title="Search">/</button>
      <button type="button" data-quick-action="top" aria-label="Back to top" title="Back to top">^</button>
      <button type="button" data-quick-action="random" aria-label="Open random item" title="Random">*</button>
    </div>
  `;
}

function bindNav(): void {
  const nav = document.getElementById("nav");
  if (!nav) return;
  const iconMap: Partial<Record<RouteKey, string>> = {
    home: "首页",
    docs: "文档",
    projects: "项目",
    life: "生活",
    board: "留言"
  };

  nav.innerHTML = [
    `<button data-route="home" class="nav-home nav-pill"><span class="nav-icon">${iconMap.home}</span><span>回到首页</span></button>`,
    ...getNavModules().map(
      (module) =>
        `<button data-route="${module.key}" class="nav-pill nav-${module.key}"><span class="nav-icon">${iconMap[module.key] || ""}</span><span>${module.label}</span></button>`
    )
  ].join("");
  nav.insertAdjacentHTML("beforeend", `<span id="navLiquidIndicator" class="nav-liquid-indicator"></span>`);
  nav.insertAdjacentHTML("beforeend", `<span id="navSheen" class="nav-sheen"></span>`);
  nav.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => navigate(button.getAttribute("data-route") as RouteKey));
    bindMagnetic(button);
  });
}

function renderRoute(routeInfo: { route: RouteKey; params: RouteParams }): void {
  const { route, params } = routeInfo;
  const view = document.getElementById("view");
  const sidebarContainer = document.getElementById("sidebarContainer");
  const header = document.querySelector<HTMLElement>(".site-header");
  const navBackBtn = document.getElementById("navBackBtn");
  if (!view || !sidebarContainer) return;

  if (route === "project-detail" && params.id) {
    renderProjectDetail(params.id);
    if (navBackBtn) navBackBtn.style.display = "inline-flex";
  } else if (route === "life-detail" && params.id) {
    renderLifeDetail(params.id);
    if (navBackBtn) navBackBtn.style.display = "inline-flex";
  } else if (route === "doc-detail" && params.id) {
    renderDocDetail(params.id);
    if (navBackBtn) navBackBtn.style.display = "inline-flex";
  } else {
    sidebarContainer.innerHTML = "";
    const current = getModule(route);
    if (!current) return;

    if (navBackBtn) navBackBtn.style.display = "none";
    view.className = route;
    if (header) {
      header.classList.toggle("liquid-nav", route !== "home" && route !== "playground");
      header.classList.toggle("header-hidden", route === "playground");
      header.style.display = route === "home" ? "none" : "block";
    }
    document.title = `Embedded Blog | ${current.title}`;
    view.innerHTML = current.render();
    animateViewEnter(view);
    bindHoverLift(".card");
    bindPointerSpotlight(".reading-card");
    window.scrollTo(0, route === "life" ? 225 : 0);
    current.afterMount?.();
  }

  document.querySelectorAll("#nav button").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-route") === route);
  });

  if (header) {
    if (route === "home") {
      header.style.display = "none";
      header.classList.remove("header-fixed");
    } else {
      header.style.display = "block";
      header.classList.add("liquid-nav");
    }
  }

  const cornerLabel = document.getElementById("paperCornerLabel");
  if (cornerLabel) cornerLabel.textContent = route === "playground" ? "Back" : "Play";
  updateQuickDock(route);
  updateNavIndicator();
}

function renderProjectDetail(projectId: string): void {
  const project = projectItems.find((item) => item.id === projectId);
  const view = document.getElementById("view");
  const sidebarContainer = document.getElementById("sidebarContainer");
  if (!project || !view || !sidebarContainer) return;

  const base = import.meta.env.BASE_URL;
  const theme = document.documentElement.getAttribute("data-theme") || "light";
  view.className = "project-detail";
  sidebarContainer.innerHTML = "";
  document.title = `Embedded Blog | ${project.title}`;
  view.innerHTML = detailPage("project-detail-page", theme, `${base}xiangmuzuopingbaitian.jpg`, `${base}xiangmuzuopingheitian.jpg`, renderDocumentShell({
    eyebrow: "Project",
    title: project.title,
    summary: project.summary,
    markdown: project.markdown || `# ${project.title}\n\n${project.summary}`,
    currentId: project.id,
    files: projectItems.map((item) => ({ id: item.id, title: item.title, route: "project-detail", group: "Projects" })),
    metas: [{ label: "Stack", value: project.stack.join(" / ") }],
    tags: project.stack,
    heroImages: project.gallery,
    insights: project.highlights.slice(0, 4).map((highlight, index) => ({
      label: `Highlight ${index + 1}`,
      value: highlight
    })),
    actions: project.links,
    contentClass: "project-content"
  }));
  mountDetailView(view);
}

function renderLifeDetail(postId: string): void {
  const post = lifePosts.find((item) => item.id === postId);
  const view = document.getElementById("view");
  const sidebarContainer = document.getElementById("sidebarContainer");
  if (!post || !view || !sidebarContainer) return;

  const base = import.meta.env.BASE_URL;
  const theme = document.documentElement.getAttribute("data-theme") || "light";
  view.className = "life-detail";
  sidebarContainer.innerHTML = "";
  document.title = `Embedded Blog | ${post.title}`;
  view.innerHTML = detailPage("life-detail-page", theme, `${base}guosai2.jpg`, `${base}xiaoshao.jpg`, renderDocumentShell({
    eyebrow: "Life",
    title: post.title,
    summary: post.summary,
    markdown: post.markdown || `# ${post.title}\n\n${post.summary}`,
    currentId: post.id,
    files: lifePosts.map((item) => ({ id: item.id, title: item.title, route: "life-detail", group: item.tag })),
    metas: [
      { label: "Date", value: post.date },
      { label: "Tag", value: post.tag }
    ],
    tags: [post.tag],
    heroImages: post.cover ? [post.cover] : undefined,
    insights: [
      { label: "Date", value: post.date || "Draft" },
      { label: "Topic", value: post.tag },
      { label: "Format", value: "Personal note" }
    ],
    contentClass: "life-content"
  }));
  mountDetailView(view);
}

function renderDocDetail(docId: string): void {
  const doc = techDocs.find((item) => item.id === docId);
  const view = document.getElementById("view");
  const sidebarContainer = document.getElementById("sidebarContainer");
  if (!doc || !view || !sidebarContainer) return;

  const base = import.meta.env.BASE_URL;
  const theme = document.documentElement.getAttribute("data-theme") || "light";
  view.className = "doc-detail";
  sidebarContainer.innerHTML = "";
  document.title = `Embedded Blog | ${doc.title}`;
  view.innerHTML = detailPage("doc-detail-page", theme, `${base}jishuwendangbaitian.jpg`, `${base}jishuwendheitian.jpg`, renderDocumentShell({
    eyebrow: "Docs",
    title: doc.title,
    summary: doc.summary,
    markdown: doc.markdown,
    currentId: doc.id,
    files: techDocs.map((item) => ({ id: item.id, title: item.title, route: "doc-detail", group: item.category })),
    metas: [
      { label: "Level", value: doc.level },
      { label: "Updated", value: doc.updatedAt },
      { label: "Read", value: doc.readingTime },
      { label: "Views", value: doc.views }
    ],
    tags: doc.tags,
    insights: [
      { label: "Category", value: doc.category, description: "Knowledge base" },
      { label: "Level", value: doc.level },
      { label: "Updated", value: doc.updatedAt },
      { label: "Reading", value: doc.readingTime }
    ],
    contentClass: "doc-content"
  }));
  mountDetailView(view);
}

function detailPage(pageClass: string, theme: string, lightBg: string, darkBg: string, content: string): string {
  return `
    <div class="main-content">
      <div class="page-wrapper ${pageClass}">
        <div class="bg-slider">
          <div class="bg-slide bg-slide-light ${theme === "light" ? "active" : ""}" data-bg="${lightBg}"></div>
          <div class="bg-slide bg-slide-dark ${theme === "dark" ? "active" : ""}" data-bg="${darkBg}"></div>
        </div>
        ${content}
      </div>
    </div>
  `;
}

function mountDetailView(view: HTMLElement): void {
  animateViewEnter(view);
  bindDocumentShell();
  lazyLoadBackgrounds();
  window.scrollTo(0, 0);
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
  register({ key: "projects", label: "项目作品", title: "项目作品", render: renderProjects, afterMount: bindProjectClick });
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
}

function bindMagnetic(button: Element): void {
  const node = button as HTMLElement;
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

function bindNavControls(): void {
  const navControlsBtn = document.getElementById("navControlsBtn");
  const navControlsPanel = document.getElementById("navControlsPanel");
  const navBackBtn = document.getElementById("navBackBtn");
  if (!navControlsBtn || !navControlsPanel) return;

  navControlsBtn.addEventListener("click", () => {
    navControlsBtn.classList.toggle("active");
    navControlsPanel.classList.toggle("active");
  });

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (!target.closest("#navControlsBtn") && !target.closest("#navControlsPanel") && !target.closest("#quickDock")) {
      navControlsBtn.classList.remove("active");
      navControlsPanel.classList.remove("active");
    }
  });

  navBackBtn?.addEventListener("click", () => {
    const current = getCurrentRoute();
    if (current.route === "project-detail") navigate("projects");
    if (current.route === "life-detail") navigate("life");
    if (current.route === "doc-detail") navigate("docs");
    navControlsBtn.classList.remove("active");
    navControlsPanel.classList.remove("active");
  });
}

function bindQuickDock(): void {
  const dock = document.getElementById("quickDock");
  if (!dock) return;

  dock.querySelectorAll<HTMLButtonElement>("button[data-quick-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.quickAction;
      if (action === "search") openSearchPanel();
      if (action === "top") window.scrollTo({ top: 0, behavior: "smooth" });
      if (action === "random") openRandomContent();
    });
  });
}

function updateQuickDock(route: RouteKey): void {
  const dock = document.getElementById("quickDock");
  if (!dock) return;
  dock.classList.toggle("visible", route !== "home" && route !== "playground");
}

function openSearchPanel(): void {
  const navControlsBtn = document.getElementById("navControlsBtn");
  const navControlsPanel = document.getElementById("navControlsPanel");
  const searchInput = document.getElementById("searchInput") as HTMLInputElement | null;
  navControlsBtn?.classList.add("active");
  navControlsPanel?.classList.add("active");
  searchInput?.focus();
}

function openRandomContent(): void {
  const pool: Array<{ route: RouteKey; id: string }> = [
    ...techDocs.map((doc) => ({ route: "doc-detail" as RouteKey, id: doc.id })),
    ...projectItems.map((project) => ({ route: "project-detail" as RouteKey, id: project.id })),
    ...lifePosts.map((post) => ({ route: "life-detail" as RouteKey, id: post.id }))
  ];
  const item = pool[Math.floor(Math.random() * pool.length)];
  if (item) navigate(item.route, { id: item.id });
}

function bindThemeToggle(): void {
  document.getElementById("themeToggle")?.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    setTheme(currentTheme === "dark" ? "light" : "dark");
  });
}

function setTheme(theme: string): void {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  if (currentTheme !== theme) switchPageBackgrounds(theme);
}

function switchPageBackgrounds(theme: string): void {
  document.querySelectorAll<HTMLElement>(".bg-slide-light").forEach((slide) => slide.classList.toggle("active", theme === "light"));
  document.querySelectorAll<HTMLElement>(".bg-slide-dark").forEach((slide) => slide.classList.toggle("active", theme === "dark"));
}

function initTheme(): void {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(savedTheme || (prefersDark ? "dark" : "light"));
}

function bindSearch(): void {
  const searchInput = document.getElementById("searchInput") as HTMLInputElement | null;
  const searchBtn = document.getElementById("searchBtn");
  const navControlsPanel = document.getElementById("navControlsPanel");
  if (!searchInput || !navControlsPanel) return;

  const searchResults = document.createElement("div");
  searchResults.className = "search-results";
  searchResults.id = "searchResults";
  navControlsPanel.style.position = "relative";
  navControlsPanel.appendChild(searchResults);

  let debounceTimer: ReturnType<typeof setTimeout>;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();
    if (!query) {
      hideSearchResults();
      return;
    }
    debounceTimer = setTimeout(() => performSearch(query), 300);
  });

  searchBtn?.addEventListener("click", () => {
    if (searchInput.value.trim()) performSearch(searchInput.value.trim());
  });

  searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && searchInput.value.trim()) performSearch(searchInput.value.trim());
  });
}

function performSearch(query: string): void {
  const lowerQuery = query.toLowerCase();
  const results: Array<{ title: string; type: string; route: RouteKey; id?: string }> = [];

  techDocs.forEach((doc) => {
    if (matches(doc.title, doc.summary, lowerQuery)) results.push({ title: doc.title, type: "Docs", route: "doc-detail", id: doc.id });
  });
  projectItems.forEach((project) => {
    if (matches(project.title, project.summary, lowerQuery)) results.push({ title: project.title, type: "Projects", route: "project-detail", id: project.id });
  });
  lifePosts.forEach((post) => {
    if (matches(post.title, post.summary, lowerQuery) || post.tag.toLowerCase().includes(lowerQuery)) {
      results.push({ title: post.title, type: "Life", route: "life-detail", id: post.id });
    }
  });

  displaySearchResults(results, query);
}

function matches(title: string, summary: string, lowerQuery: string): boolean {
  return title.toLowerCase().includes(lowerQuery) || summary.toLowerCase().includes(lowerQuery);
}

function displaySearchResults(results: Array<{ title: string; type: string; route: RouteKey; id?: string }>, query: string): void {
  const searchResults = document.getElementById("searchResults");
  if (!searchResults) return;

  searchResults.innerHTML = results.length
    ? results.map((result) => `
        <div class="search-result-item" data-route="${result.route}" data-id="${result.id || ""}">
          <div class="search-result-title">${highlightMatch(result.title, query)}</div>
          <div class="search-result-type">${result.type}</div>
        </div>
      `).join("")
    : `<div class="search-no-results">没有找到 "${query}" 的相关内容</div>`;

  searchResults.querySelectorAll<HTMLElement>(".search-result-item").forEach((item) => {
    item.addEventListener("click", () => {
      const route = item.dataset.route as RouteKey;
      const id = item.dataset.id;
      navigate(route, id ? { id } : undefined);
      hideSearchResults();
    });
  });
  searchResults.classList.add("active");
}

function hideSearchResults(): void {
  document.getElementById("searchResults")?.classList.remove("active");
}

function highlightMatch(text: string, query: string): string {
  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
