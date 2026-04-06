import { techDocs } from "../../content/docs";
import { animateSwapOutIn } from "../../shared/motion";
import { navigate } from "../../app/router";
import { lazyLoadBackgrounds } from "../../shared/lazyLoad";

export function renderDocs(): string {
  const categories = [...new Set(techDocs.map((d) => d.category))];
  const cards = techDocs
    .map(
      (doc) => `
      <article class="card doc-card" data-category="${doc.category}" data-id="${doc.id}">
        <div class="pill">${doc.level}</div>
        <h3>${doc.title}</h3>
        <p>${doc.summary}</p>
        <div class="doc-meta">
          <div class="meta-item">
            <span class="meta-icon">?</span>
            <span>${doc.updatedAt}</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">??</span>
            <span>${doc.readingTime}</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">??</span>
            <span>${doc.views} views</span>
          </div>
        </div>
        <div class="tags">${doc.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
      </article>
    `
    )
    .join("");
  const theme = document.documentElement.getAttribute("data-theme") || "light";
  const base = import.meta.env.BASE_URL;
  return `
  <div class="page-wrapper docs-page">
    <div class="bg-slider">
      <div class="bg-slide bg-slide-light ${theme === "light" ? "active" : ""}" data-bg="${base}jishuwendangbaitian.jpg"></div>
      <div class="bg-slide bg-slide-dark ${theme === "dark" ? "active" : ""}" data-bg="${base}jishuwendheitian.jpg"></div>
    </div>
    <section class="container section">
    <div class="filter reveal" id="docFilter">
      <button class="active" data-filter="all">全部</button>
      ${categories.map((c) => `<button data-filter="${c}">${c}</button>`).join("")}
    </div>
      <div class="grid-two" id="docGrid">${cards}</div>
    </section>
  </div>`;
}

function bindMagneticButton(btn: HTMLElement): void {
  btn.addEventListener("pointermove", (event) => {
    const rect = btn.getBoundingClientRect();
    const dx = (event.clientX - rect.left - rect.width / 2) / rect.width;
    const dy = (event.clientY - rect.top - rect.height / 2) / rect.height;
    btn.style.transform = `translate(${dx * 8}px, ${dy * 6}px) scale(1.05)`;
  });
  btn.addEventListener("pointerleave", () => {
    btn.style.transform = "translate(0, 0) scale(1)";
  });
}

export function bindDocFilter(): void {
  const wrap = document.getElementById("docFilter");
  const grid = document.getElementById("docGrid");
  if (!wrap || !grid) return;
  
  // 为所有filter按钮添加磁吸效果
  wrap.querySelectorAll("button").forEach((btn) => {
    bindMagneticButton(btn as HTMLElement);
    
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
  
  // 绑定卡片点击事件
  document.querySelectorAll(".doc-card").forEach((card) => {
    card.addEventListener("click", () => {
      const docId = card.getAttribute("data-id");
      if (docId) {
        navigate("doc-detail", { id: docId });
      }
    });
  });
  
  // 初始化背景图片懒加载
  lazyLoadBackgrounds();
}
