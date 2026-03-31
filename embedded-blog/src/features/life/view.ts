import { lifePosts } from "../../content/lifePosts";
import { animateSwapOutIn } from "../../shared/motion";

export function renderLife(): string {
  const tags = [...new Set(lifePosts.map((post) => post.tag))];
  return `
  <section class="container section">
    <h2 class="reveal">个人分享</h2>
    <p class="reveal page-intro">这里记录生活、摄影、阅读和日常的小灵感。</p>
    <div class="filter reveal" id="lifeFilter">
      <button class="active" data-life-filter="all">全部</button>
      ${tags.map((tag) => `<button data-life-filter="${tag}">${tag}</button>`).join("")}
    </div>
    <div class="grid-two life-grid">
      ${lifePosts
        .map(
          (post) => `
          <article class="card life-card" data-tag="${post.tag}">
            <img src="${post.cover}" alt="${post.title}" loading="lazy" />
            <div class="life-meta">${post.date} · ${post.tag}</div>
            <h3>${post.title}</h3>
            <p>${post.summary}</p>
          </article>
        `
        )
        .join("")}
    </div>
  </section>
  `;
}

export function bindLifeFilter(): void {
  const filter = document.getElementById("lifeFilter");
  const grid = document.querySelector<HTMLElement>(".life-grid");
  if (!filter || !grid) return;
  filter.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.getAttribute("data-life-filter") || "all";
      filter.querySelectorAll("button").forEach((node) => node.classList.remove("active"));
      button.classList.add("active");
      animateSwapOutIn(grid, () => {
        document.querySelectorAll<HTMLElement>(".life-card").forEach((card) => {
          const match = tag === "all" || card.dataset.tag === tag;
          card.style.display = match ? "block" : "none";
        });
      });
    });
  });
}
