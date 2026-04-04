import { renderHome } from "../features/home/view";
import { runTypewriter } from "../features/home/typewriter";
import { mountHomeParticles } from "../features/home/fx";
import { mountScrollEffect } from "../features/home/scrollEffect";
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
import gsap from "gsap";
import { techDocs } from "../content/docs";
import { projectItems } from "../content/projects";
import { lifePosts } from "../content/lifePosts";

export function bootstrap(): void {
  registerDefaults();
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;
  const base = import.meta.env.BASE_URL;
  document.documentElement.style.setProperty('--base-url', base);
  document.documentElement.style.setProperty('--bg-projects', `url('${base}KSC - SLS_03302026_Artemis II at the pad~orig.jpg')`);
  app.innerHTML = shellTemplate();
  bindNav();
  bindNavControls();
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
    <button class="nav-controls-btn" id="navControlsBtn" title="打开控制">
      <span class="nav-controls-icon">☰</span>
    </button>
    <div class="nav-controls-panel" id="navControlsPanel">
      <div class="search-box">
        <input type="text" id="searchInput" placeholder="搜索..." />
        <button class="search-btn" id="searchBtn">🔍</button>
      </div>
      <button class="theme-toggle" id="themeToggle" title="切换主题">
        <span class="theme-icon sun">☀️</span>
        <span class="theme-icon moon">🌙</span>
      </button>
    </div>
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
  
  // 设置滚动位置
  if (route === 'life') {
    // 个人分享页面的初始滚动位置 - 滚动到内容区域
    setTimeout(() => {
      window.scrollTo(0, 1500*0.15);
    }, 0);
  } else {
    // 其他页面重置到顶部
    window.scrollTo(0, 0);
  }
  
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

// 导航控制按钮功能
function bindNavControls(): void {
  const navControlsBtn = document.getElementById("navControlsBtn");
  const navControlsPanel = document.getElementById("navControlsPanel");
  
  if (!navControlsBtn || !navControlsPanel) return;

  // 切换控制面板显示/隐藏
  navControlsBtn.addEventListener("click", () => {
    navControlsBtn.classList.toggle("active");
    navControlsPanel.classList.toggle("active");
  });

  // 点击面板外部关闭
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest("#navControlsBtn") && !target.closest("#navControlsPanel")) {
      navControlsBtn.classList.remove("active");
      navControlsPanel.classList.remove("active");
    }
  });

  // 点击搜索结果项时关闭面板
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest(".search-result-item")) {
      navControlsBtn.classList.remove("active");
      navControlsPanel.classList.remove("active");
    }
  });
}

// 主题切换功能
function bindThemeToggle(): void {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return;

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  });
}

function setTheme(theme: string): void {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  
  // 同步切换所有页面的背景
  if (currentTheme !== theme) {
    switchPageBackgrounds(theme);
  }
}

function switchPageBackgrounds(theme: string): void {
  // 获取当前所有页面的bg-slide元素
  const lightSlides = document.querySelectorAll<HTMLElement>('.bg-slide-light');
  const darkSlides = document.querySelectorAll<HTMLElement>('.bg-slide-dark');
  
  // 根据主题切换active类，实现交叉淡入淡出
  if (theme === 'light') {
    lightSlides.forEach(slide => slide.classList.add('active'));
    darkSlides.forEach(slide => slide.classList.remove('active'));
  } else {
    lightSlides.forEach(slide => slide.classList.remove('active'));
    darkSlides.forEach(slide => slide.classList.add('active'));
  }
}

function initTheme(): void {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme || (prefersDark ? "dark" : "light");
  setTheme(theme);
}

// 搜索功能
function bindSearch(): void {
  const searchInput = document.getElementById("searchInput") as HTMLInputElement;
  const searchBtn = document.getElementById("searchBtn");
  
  if (!searchInput) return;

  // 创建搜索结果下拉框
  const searchResults = document.createElement("div");
  searchResults.className = "search-results";
  searchResults.id = "searchResults";
  
  const navControlsPanel = document.getElementById("navControlsPanel");
  if (navControlsPanel) {
    navControlsPanel.style.position = "relative";
    navControlsPanel.appendChild(searchResults);
  }

  // 搜索输入事件
  let debounceTimer: ReturnType<typeof setTimeout>;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    const query = (e.target as HTMLInputElement).value.trim();
    
    if (query.length === 0) {
      hideSearchResults();
      return;
    }

    debounceTimer = setTimeout(() => {
      performSearch(query);
    }, 300);
  });

  // 搜索按钮点击事件
  searchBtn?.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) {
      performSearch(query);
    }
  });

  // 回车键搜索
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (query) {
        performSearch(query);
      }
    }
  });

  // 点击外部关闭搜索结果
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".search-box") && !target.closest(".search-results")) {
      hideSearchResults();
    }
  });
}

function performSearch(query: string): void {
  const results: Array<{ title: string; type: string; route: string; id?: string }> = [];
  const lowerQuery = query.toLowerCase();

  // 搜索技术文档
  techDocs.forEach((doc) => {
    if (doc.title.toLowerCase().includes(lowerQuery) || 
        doc.summary.toLowerCase().includes(lowerQuery)) {
      results.push({
        title: doc.title,
        type: "技术文档",
        route: "docs",
        id: doc.id
      });
    }
  });

  // 搜索项目
  projectItems.forEach((project) => {
    if (project.title.toLowerCase().includes(lowerQuery) || 
        project.summary.toLowerCase().includes(lowerQuery)) {
      results.push({
        title: project.title,
        type: "项目作品",
        route: "projects",
        id: project.id
      });
    }
  });

  // 搜索生活分享
  lifePosts.forEach((post) => {
    if (post.title.toLowerCase().includes(lowerQuery) || 
        post.summary.toLowerCase().includes(lowerQuery) ||
        post.tag.toLowerCase().includes(lowerQuery)) {
      results.push({
        title: post.title,
        type: "个人分享",
        route: "life",
        id: post.id
      });
    }
  });

  displaySearchResults(results, query);
}

function displaySearchResults(results: Array<{ title: string; type: string; route: string; id?: string }>, query: string): void {
  const searchResults = document.getElementById("searchResults");
  if (!searchResults) return;

  if (results.length === 0) {
    searchResults.innerHTML = `<div class="search-no-results">未找到与 "${query}" 相关的内容</div>`;
  } else {
    searchResults.innerHTML = results.map((result) => `
      <div class="search-result-item" data-route="${result.route}" data-id="${result.id || ""}">
        <div class="search-result-title">${highlightMatch(result.title, query)}</div>
        <div class="search-result-type">${result.type}</div>
      </div>
    `).join("");

    // 绑定点击事件
    searchResults.querySelectorAll(".search-result-item").forEach((item) => {
      item.addEventListener("click", () => {
        const route = item.getAttribute("data-route") as RouteKey;
        const id = item.getAttribute("data-id");
        navigate(route);
        hideSearchResults();
        
        // 如果有ID，滚动到对应元素
        if (id) {
          setTimeout(() => {
            const element = document.querySelector(`[data-id="${id}"]`);
            element?.scrollIntoView({ behavior: "smooth", block: "center" });
            // 高亮显示
            element?.classList.add("highlight");
            setTimeout(() => element?.classList.remove("highlight"), 2000);
          }, 300);
        }
      });
    });
  }

  searchResults.classList.add("active");
}

function hideSearchResults(): void {
  const searchResults = document.getElementById("searchResults");
  searchResults?.classList.remove("active");
}

function highlightMatch(text: string, query: string): string {
  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
