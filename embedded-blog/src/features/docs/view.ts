import { techDocs } from "../../content/docs";
import { animateSwapOutIn } from "../../shared/motion";

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
  return `
  <div class="page-wrapper docs-page">
    <section class="container section">
    <div class="filter reveal" id="docFilter">
      <button class="active" data-filter="all">全部</button>
      ${categories.map((c) => `<button data-filter="${c}">${c}</button>`).join("")}
    </div>
      <div class="grid-two" id="docGrid">${cards}</div>
    </section>
    <div id="docModal" class="modal" style="display: none;">
      <div class="modal-content">
        <span class="modal-close">&times;</span>
        <div id="docModalContent"></div>
      </div>
    </div>
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
  
  // ??????????
  document.querySelectorAll(".doc-card").forEach((card) => {
    card.addEventListener("click", () => {
      const docId = card.getAttribute("data-id");
      if (docId) {
        showDocDetails(docId);
      }
    });
  });
  
  // ???????????
  const modal = document.getElementById("docModal");
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

function showDocDetails(docId: string): void {
  const doc = techDocs.find((d) => d.id === docId);
  const modal = document.getElementById("docModal");
  const content = document.getElementById("docModalContent");
  if (!doc || !modal || !content) return;
  
  content.innerHTML = `
    <h3>${doc.title}</h3>
    <div class="pill">${doc.level}</div>
    <div class="tags">${doc.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
    <p class="doc-date">Updated: ${doc.updatedAt}</p>
    <div class="doc-content">${markdownToHtml(doc.markdown)}</div>
  `;
  modal.style.display = "block";
}

function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/^## (.*$)/gm, '<h4>$1</h4>')
    .replace(/^### (.*$)/gm, '<h5>$1</h5>')
    .replace(/\n\* (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '<br><br>');
}
