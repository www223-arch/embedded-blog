import { projectItems } from "../../content/projects";
import { navigate } from "../../app/router";
import { lazyLoadBackgrounds } from "../../shared/lazyLoad";

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
        <article class="card project-card ${index % 2 === 0 ? 'project-card-left' : 'project-card-right'}" data-id="${item.id}">
          <img src="${item.gallery[0]}" alt="${item.title}" loading="lazy"/>
          <h3>${item.title}</h3>
          <p>${item.summary}</p>
          <div class="tags">${item.stack.map((tag) => `<span>${tag}</span>`).join("")}</div>
          <ul>${item.highlights.map((h) => `<li>${h}</li>`).join("")}</ul>
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
        navigate("project-detail", { id: projectId });
      }
    });
  });
  
  // 初始化背景图片懒加载
  lazyLoadBackgrounds();
}
