import { projectItems } from "../../content/projects";
import { lazyLoadBackgrounds } from "../../shared/lazyLoad";
import { navigateFromCard } from "../../shared/routeTransition";

export function renderProjects(): string {
  const theme = document.documentElement.getAttribute("data-theme") || "light";
  const base = import.meta.env.BASE_URL;
  return `
  <div class="page-wrapper projects-page">
    <div class="bg-slider">
      <div class="bg-slide bg-slide-light ${theme === "light" ? "active" : ""}" data-bg="${base}xiangmuzuopingbaitian.jpg"></div>
      <div class="bg-slide bg-slide-dark ${theme === "dark" ? "active" : ""}" data-bg="${base}xiangmuzuopingheitian.jpg"></div>
    </div>
    <section class="container section">
      <div class="grid-two">
      ${projectItems
        .map(
          (item, index) => `
        <article class="card reading-card project-card ${index % 2 === 0 ? 'project-card-left' : 'project-card-right'}" data-id="${item.id}">
          <div class="card-index">${String(index + 1).padStart(2, "0")}</div>
          <div class="card-media">
            <img src="${resolveAssetPath(item.gallery[0] || "")}" alt="${item.title}" loading="lazy"/>
          </div>
          <div class="card-kicker-row">
            <span>Project</span>
            <span>${item.stack.length} stack</span>
          </div>
          <div class="card-title-row">
            <h3>${item.title}</h3>
            <span class="card-read-cue">Open -&gt;</span>
          </div>
          <p class="card-summary">${item.summary}</p>
          <div class="tags">${item.stack.slice(0, 4).map((tag) => `<span>${tag}</span>`).join("")}</div>
          <ul class="card-highlights">${item.highlights.slice(0, 3).map((h) => `<li>${h}</li>`).join("")}</ul>
        </article>
      `
        )
        .join("")}
      </div>
    </section>
  </div>
  `;
}

export function bindProjectClick() {
  // 绑定卡片点击事件
  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", () => {
      const projectId = card.getAttribute("data-id");
      if (projectId) {
        navigateFromCard(card, "project-detail", { id: projectId });
      }
    });
  });
  
  // 初始化背景图片懒加载
  lazyLoadBackgrounds();
}

function resolveAssetPath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return trimmed;
  const base = import.meta.env.BASE_URL || "/";
  if (base === "/" || trimmed.startsWith(base)) return trimmed;
  return `${base.replace(/\/$/, "")}${trimmed}`;
}
