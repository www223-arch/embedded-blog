import { projectItems } from "../../content/projects";

export function renderProjects(): string {
  return `
  <div class="page-wrapper projects-page">
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
    <div id="projectModal" class="modal" style="display: none;">
      <div class="modal-content">
        <span class="modal-close">&times;</span>
        <div id="projectModalContent"></div>
      </div>
    </div>
  </div>
  `;
}

export function bindProjectClick(): void {
  // 绑定卡片点击事件
  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", () => {
      const projectId = card.getAttribute("data-id");
      if (projectId) {
        showProjectDetails(projectId);
      }
    });
  });
  
  // 绑定模态框关闭事件
  const modal = document.getElementById("projectModal");
  const closeBtn = document.querySelector(".modal-close");
  if (modal && closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
    window.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });
  }
}

function showProjectDetails(projectId: string): void {
  const project = projectItems.find((p) => p.id === projectId);
  const modal = document.getElementById("projectModal");
  const content = document.getElementById("projectModalContent");
  if (!project || !modal || !content) return;
  
  content.innerHTML = `
    <h3>${project.title}</h3>
    <img src="${project.gallery[0]}" alt="${project.title}" style="width: 100%; border-radius: 10px; margin: 20px 0;"/>
    <p>${project.summary}</p>
    <div class="tags">${project.stack.map((tag) => `<span>${tag}</span>`).join("")}</div>
    <h4>Highlights</h4>
    <ul>${project.highlights.map((h) => `<li>${h}</li>`).join("")}</ul>
    ${project.links.length > 0 ? `
    <div class="project-links">
      ${project.links.map((link) => `<a href="${link.href}" class="btn">${link.label}</a>`).join("")}
    </div>
    ` : ""}
  `;
  modal.style.display = "block";
}
