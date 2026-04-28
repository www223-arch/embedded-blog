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
import type { RouteKey, RouteParams } from "./types";
import { getModule, getNavModules, register } from "./moduleRegistry";
import { mountPaperCornerEasterEgg } from "../features/playground/entryEasterEgg";
import gsap from "gsap";
import { techDocs } from "../content/docs";
import { projectItems } from "../content/projects";
import { lifePosts } from "../content/lifePosts";
import { lazyLoadBackgrounds } from "../shared/lazyLoad";
import { renderSidebar, bindSidebarEvents, renderContentWithHeadingIds } from "../shared/sidebar";

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
    <div class="nav-right">
      <div class="nav-controls-container">
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
      </div>
      <button class="back-btn nav-back-btn" id="navBackBtn" title="返回" style="display: none;">
        <span class="back-icon">←</span>
        <span>返回</span>
      </button>
    </div>
  </header>
  <div id="sidebarContainer"></div>
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

function renderRoute(routeInfo: { route: RouteKey; params: RouteParams }): void {
  const { route, params } = routeInfo;
  const view = document.getElementById("view");
  const sidebarContainer = document.getElementById("sidebarContainer");
  const header = document.querySelector<HTMLElement>(".site-header");
  const navBackBtn = document.getElementById("navBackBtn");
  if (!view || !sidebarContainer) return;
  
  // 处理详情页路由
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
    // 清空侧边栏
    sidebarContainer.innerHTML = "";
    
    const current = getModule(route);
    if (!current) return;
    
    // 隐藏返回按钮
    if (navBackBtn) navBackBtn.style.display = "none";
    
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
  }
  
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
  } else {
    // 详情页显示导航栏
    const header = document.querySelector<HTMLElement>(".site-header");
    if (header) {
      header.style.display = "block";
      header.classList.add("liquid-nav");
    }
  }
  
  const cornerLabel = document.getElementById("paperCornerLabel");
  if (cornerLabel) cornerLabel.textContent = route === "playground" ? "Back" : "Play";
  updateNavIndicator();
}

function renderProjectDetail(projectId: string): void {
  const project = projectItems.find((p) => p.id === projectId);
  const view = document.getElementById("view");
  const sidebarContainer = document.getElementById("sidebarContainer");
  if (!project || !view || !sidebarContainer) return;
  
  view.className = "project-detail";
  document.title = `Embedded Blog | ${project.title}`;
  const base = import.meta.env.BASE_URL;
  const theme = document.documentElement.getAttribute("data-theme") || "light";
  
  const markdownContent = (project as any).markdown ? renderContentWithHeadingIds((project as any).markdown) : "";
  
  // 渲染主内容
  view.innerHTML = `
    <div class="main-content">
      <div class="page-wrapper project-detail-page">
        <div class="bg-slider">
          <div class="bg-slide bg-slide-light ${theme === "light" ? "active" : ""}" data-bg="${base}xiangmuzuopingbaitian.jpg"></div>
          <div class="bg-slide bg-slide-dark ${theme === "dark" ? "active" : ""}" data-bg="${base}xiangmuzuopingheitian.jpg"></div>
        </div>
        
        <!-- 左侧栏目 -->
        <div style="width: 160px; position: fixed; left: 20px; top: 90px; z-index: 10;">
          <!-- 合并的卡片 -->
          <div style="border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(10, 10, 15, 0.6); border-radius: 8px; overflow: hidden; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
            <!-- 文件目录 -->
            <div id="fileTreePanel" style="border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
              <div style="padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: space-between;">
                <div style="font-size: 12px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 6px;">
                  <span>📁</span>
                  <span>文件</span>
                </div>
                <button id="fileTreeToggle" style="background: none; border: none; cursor: pointer; color: var(--text); font-size: 12px; padding: 4px;">▼</button>
              </div>
              <div id="fileTreeContent" style="max-height: 200px; overflow-y: auto; padding: 8px;">
                <div style="font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; padding: 0 6px;">项目</div>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 2px;">
                    <div class="file-link" data-route="project-detail" data-id="edge-gateway" style="display: block; padding: 6px 8px; color: var(--text); font-size: 12px; cursor: pointer; border-radius: 4px; transition: background var(--duration-fast) var(--ease-out);">
                      工业边缘网关
                    </div>
                  </li>
                  <li style="margin-bottom: 2px;">
                    <div class="file-link active" data-route="project-detail" data-id="motor-control" style="display: block; padding: 6px 8px; color: white; font-size: 12px; cursor: pointer; border-radius: 4px; background: var(--accent);">
                      STM32 PID 电机
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <!-- 页面目录 -->
            <div id="tocPanel">
              <div style="padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: space-between;">
                <div style="font-size: 12px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 6px;">
                  <span>📋</span>
                  <span>目录</span>
                </div>
                <button id="tocToggle" style="background: none; border: none; cursor: pointer; color: var(--text); font-size: 12px; padding: 4px;">▼</button>
              </div>
              <div id="tocContent" style="max-height: 200px; overflow-y: auto; padding: 8px;">
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 2px;">
                    <div class="toc-link" style="display: block; padding: 4px 8px; color: var(--text-muted); font-size: 11px; cursor: pointer; border-radius: 4px; transition: all var(--duration-fast) var(--ease-out);">
                      项目概述
                    </div>
                  </li>
                  <li style="margin-bottom: 2px; padding-left: 12px;">
                    <div class="toc-link" style="display: block; padding: 4px 8px; color: var(--text-muted); font-size: 11px; cursor: pointer; border-radius: 4px; transition: all var(--duration-fast) var(--ease-out);">
                      技术实现
                    </div>
                  </li>
                  <li style="margin-bottom: 2px;">
                    <div class="toc-link active" style="display: block; padding: 4px 8px; color: var(--accent); font-size: 11px; cursor: pointer; border-radius: 4px; background: rgba(0, 113, 227, 0.1);">
                      项目总结
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <section class="container section" style="margin-left: 180px; margin-top: 20px;">
              <h1>${project.title}</h1>
              <div class="project-gallery">
                ${project.gallery.map(img => `<img src="${img}" alt="${project.title}" loading="lazy"/>`).join("")}
              </div>
              <div class="project-content">
                <p class="project-summary">${project.summary}</p>
                <div class="tags">${project.stack.map((tag) => `<span>${tag}</span>`).join("")}</div>
                <h2>项目亮点</h2>
                <ul>${project.highlights.map((h) => `<li>${h}</li>`).join("")}</ul>
                ${project.links.length > 0 ? `
                <div class="project-links">
                  ${project.links.map((link) => `<a href="${link.href}" class="btn">${link.label}</a>`).join("")}
                </div>
                ` : ""}
                ${markdownContent ? `
                <div class="project-markdown">
                  ${markdownContent}
                </div>
                ` : ""}
              </div>
        </section>
      </div>
    </div>
  `;
  
  animateViewEnter(view);
  bindSidebarEvents();
  
  // 初始化背景图片懒加载
  lazyLoadBackgrounds();
}

function renderLifeDetail(postId: string): void {
  const post = lifePosts.find((p) => p.id === postId);
  const view = document.getElementById("view");
  const sidebarContainer = document.getElementById("sidebarContainer");
  if (!post || !view || !sidebarContainer) return;
  
  view.className = "life-detail";
  document.title = `Embedded Blog | ${post.title}`;
  const theme = document.documentElement.getAttribute("data-theme") || "light";
  const base = import.meta.env.BASE_URL;
  
  const markdownContent = (post as any).markdown ? renderContentWithHeadingIds((post as any).markdown) : "";
  
  // 渲染主内容
  view.innerHTML = `
    <div class="main-content">
      <div class="page-wrapper life-detail-page">
        <div class="bg-slider">
          <div class="bg-slide bg-slide-light ${theme === "light" ? "active" : ""}" data-bg="${base}guosai2.jpg"></div>
          <div class="bg-slide bg-slide-dark ${theme === "dark" ? "active" : ""}" data-bg="${base}xiaoshao.jpg"></div>
        </div>
        
        <!-- 左侧栏目 -->
        <div style="width: 160px; position: fixed; left: 20px; top: 90px; z-index: 10;">
          <!-- 合并的卡片 -->
          <div style="border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(10, 10, 15, 0.6); border-radius: 8px; overflow: hidden; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
            <!-- 文件目录 -->
            <div id="fileTreePanel" style="border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
              <div style="padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: space-between;">
                <div style="font-size: 12px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 6px;">
                  <span>📁</span>
                  <span>文件</span>
                </div>
                <button id="fileTreeToggle" style="background: none; border: none; cursor: pointer; color: var(--text); font-size: 12px; padding: 4px;">▼</button>
              </div>
              <div id="fileTreeContent" style="max-height: 200px; overflow-y: auto; padding: 8px;">
                <div style="font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; padding: 0 6px;">生活</div>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 2px;">
                    <div class="file-link" data-route="life-detail" data-id="desk-upgrade" style="display: block; padding: 6px 8px; color: var(--text); font-size: 12px; cursor: pointer; border-radius: 4px; transition: background var(--duration-fast) var(--ease-out);">
                      桌面升级
                    </div>
                  </li>
                  <li style="margin-bottom: 2px;">
                    <div class="file-link" data-route="life-detail" data-id="mountain-weekend" style="display: block; padding: 6px 8px; color: var(--text); font-size: 12px; cursor: pointer; border-radius: 4px; transition: background var(--duration-fast) var(--ease-out);">
                      山间周末
                    </div>
                  </li>
                  <li style="margin-bottom: 2px;">
                    <div class="file-link" data-route="life-detail" data-id="street-light" style="display: block; padding: 6px 8px; color: var(--text); font-size: 12px; cursor: pointer; border-radius: 4px; transition: background var(--duration-fast) var(--ease-out);">
                      街灯
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <!-- 页面目录 -->
            <div id="tocPanel">
              <div style="padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: space-between;">
                <div style="font-size: 12px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 6px;">
                  <span>📋</span>
                  <span>目录</span>
                </div>
                <button id="tocToggle" style="background: none; border: none; cursor: pointer; color: var(--text); font-size: 12px; padding: 4px;">▼</button>
              </div>
              <div id="tocContent" style="max-height: 200px; overflow-y: auto; padding: 8px;">
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 2px;">
                    <div class="toc-link" style="display: block; padding: 4px 8px; color: var(--text-muted); font-size: 11px; cursor: pointer; border-radius: 4px; transition: all var(--duration-fast) var(--ease-out);">
                      项目概述
                    </div>
                  </li>
                  <li style="margin-bottom: 2px; padding-left: 12px;">
                    <div class="toc-link" style="display: block; padding: 4px 8px; color: var(--text-muted); font-size: 11px; cursor: pointer; border-radius: 4px; transition: all var(--duration-fast) var(--ease-out);">
                      技术实现
                    </div>
                  </li>
                  <li style="margin-bottom: 2px;">
                    <div class="toc-link active" style="display: block; padding: 4px 8px; color: var(--accent); font-size: 11px; cursor: pointer; border-radius: 4px; background: rgba(0, 113, 227, 0.1);">
                      项目总结
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <section class="container section" style="margin-left: 180px; margin-top: 20px;">
          <h1>${post.title}</h1>
          <div class="life-meta">
            <span class="life-date">${post.date}</span>
            <span class="life-tag">${post.tag}</span>
          </div>
          <div class="life-content">
            <p>${post.summary}</p>
            ${post.cover ? `
            <div class="life-gallery">
              <img src="${post.cover}" alt="${post.title}" loading="lazy"/>
            </div>
            ` : ""}
            ${markdownContent ? `
            <div class="life-markdown">
              ${markdownContent}
            </div>
            ` : ""}
          </div>
        </section>
      </div>
    </div>
  `;
  
  animateViewEnter(view);
  bindSidebarEvents();
  
  // 初始化背景图片懒加载
  lazyLoadBackgrounds();
}

function renderDocDetail(docId: string): void {
  const doc = techDocs.find((d) => d.id === docId);
  const view = document.getElementById("view");
  const sidebarContainer = document.getElementById("sidebarContainer");
  if (!doc || !view || !sidebarContainer) return;
  
  view.className = "doc-detail";
  document.title = `Embedded Blog | ${doc.title}`;
  const theme = document.documentElement.getAttribute("data-theme") || "light";
  const base = import.meta.env.BASE_URL;
  
  const markdownContent = renderContentWithHeadingIds(doc.markdown);
  
  // 渲染主内容
  view.innerHTML = `
    <div class="main-content">
      <div class="page-wrapper doc-detail-page">
        <div class="bg-slider">
          <div class="bg-slide bg-slide-light ${theme === "light" ? "active" : ""}" data-bg="${base}jishuwendangbaitian.jpg"></div>
          <div class="bg-slide bg-slide-dark ${theme === "dark" ? "active" : ""}" data-bg="${base}jishuwendheitian.jpg"></div>
        </div>
        
        <!-- 左侧栏目 -->
        <div style="width: 160px; position: fixed; left: 20px; top: 90px; z-index: 10;">
          <!-- 合并的卡片 -->
          <div style="border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(10, 10, 15, 0.6); border-radius: 8px; overflow: hidden; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
            <!-- 文件目录 -->
            <div id="fileTreePanel" style="border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
              <div style="padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: space-between;">
                <div style="font-size: 12px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 6px;">
                  <span>📁</span>
                  <span>文件</span>
                </div>
                <button id="fileTreeToggle" style="background: none; border: none; cursor: pointer; color: var(--text); font-size: 12px; padding: 4px;">▼</button>
              </div>
              <div id="fileTreeContent" style="max-height: 200px; overflow-y: auto; padding: 8px;">
                <div style="font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; padding: 0 6px;">文档</div>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 2px;">
                    <div class="file-link active" data-route="doc-detail" data-id="architecture-overview" style="display: block; padding: 6px 8px; color: white; font-size: 12px; cursor: pointer; border-radius: 4px; background: var(--accent);">
                      架构概述
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <!-- 页面目录 -->
            <div id="tocPanel">
              <div style="padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: space-between;">
                <div style="font-size: 12px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 6px;">
                  <span>📋</span>
                  <span>目录</span>
                </div>
                <button id="tocToggle" style="background: none; border: none; cursor: pointer; color: var(--text); font-size: 12px; padding: 4px;">▼</button>
              </div>
              <div id="tocContent" style="max-height: 200px; overflow-y: auto; padding: 8px;">
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 2px;">
                    <div class="toc-link" style="display: block; padding: 4px 8px; color: var(--text-muted); font-size: 11px; cursor: pointer; border-radius: 4px; transition: all var(--duration-fast) var(--ease-out);">
                      项目概述
                    </div>
                  </li>
                  <li style="margin-bottom: 2px; padding-left: 12px;">
                    <div class="toc-link" style="display: block; padding: 4px 8px; color: var(--text-muted); font-size: 11px; cursor: pointer; border-radius: 4px; transition: all var(--duration-fast) var(--ease-out);">
                      技术实现
                    </div>
                  </li>
                  <li style="margin-bottom: 2px;">
                    <div class="toc-link active" style="display: block; padding: 4px 8px; color: var(--accent); font-size: 11px; cursor: pointer; border-radius: 4px; background: rgba(0, 113, 227, 0.1);">
                      项目总结
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <section class="container section" style="margin-left: 180px; margin-top: 20px;">
          <h1>${doc.title}</h1>
          <div class="doc-meta">
            <span class="doc-level">${doc.level}</span>
            <span class="doc-date">${doc.updatedAt}</span>
            <span class="doc-reading-time">${doc.readingTime}</span>
            <span class="doc-views">${doc.views} views</span>
          </div>
          <div class="tags">${doc.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
          <div class="doc-content">${markdownContent}</div>
        </section>
      </div>
    </div>
  `;
  
  animateViewEnter(view);
  bindSidebarEvents();
  
  // 初始化背景图片懒加载
  lazyLoadBackgrounds();
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

  // 绑定返回按钮点击事件
  const navBackBtn = document.getElementById("navBackBtn");
  if (navBackBtn) {
    navBackBtn.addEventListener("click", () => {
      const currentRoute = getCurrentRoute();
      if (currentRoute.route === "project-detail") {
        navigate("projects");
      } else if (currentRoute.route === "life-detail") {
        navigate("life");
      } else if (currentRoute.route === "doc-detail") {
        navigate("docs");
      }
      // 关闭控制面板
      navControlsBtn.classList.remove("active");
      navControlsPanel.classList.remove("active");
    });
  }
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
