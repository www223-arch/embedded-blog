import { projectItems } from "../../content/projects";

export function renderProjects(): string {
  return `
  <div class="page-wrapper projects-page">
    <section class="container section">
      <h2 class="reveal">项目作品</h2>
      <div class="grid-two">
      ${projectItems
        .map(
          (item) => `
        <article class="card project-card">
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
