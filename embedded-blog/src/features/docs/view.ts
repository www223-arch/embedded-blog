import { techDocs } from "../../content/docs";
import { animateSwapOutIn } from "../../shared/motion";

export function renderDocs(): string {
  const categories = [...new Set(techDocs.map((d) => d.category))];
  const cards = techDocs
    .map(
      (doc) => `
      <article class="card doc-card" data-category="${doc.category}">
        <div class="pill">${doc.level}</div>
        <h3>${doc.title}</h3>
        <p>${doc.summary}</p>
        <div class="tags">${doc.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
      </article>
    `
    )
    .join("");
  return `
  <section class="container section">
    <h2 class="reveal">技术文档</h2>
    <div class="filter reveal" id="docFilter">
      <button class="active" data-filter="all">全部</button>
      ${categories.map((c) => `<button data-filter="${c}">${c}</button>`).join("")}
    </div>
    <div class="grid-two" id="docGrid">${cards}</div>
  </section>`;
}

export function bindDocFilter(): void {
  const wrap = document.getElementById("docFilter");
  const grid = document.getElementById("docGrid");
  if (!wrap || !grid) return;
  wrap.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.getAttribute("data-filter") || "all";
      wrap.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      animateSwapOutIn(grid, () => {
        document.querySelectorAll<HTMLElement>(".doc-card").forEach((card) => {
          const match = filter === "all" || card.dataset.category === filter;
          card.style.display = match ? "block" : "none";
        });
      });
    });
  });
}
