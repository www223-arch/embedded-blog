import { projectItems } from "../content/projects";
import { techDocs } from "../content/docs";
import { lifePosts } from "../content/lifePosts";

function createModalOverlay(): HTMLElement {
  let overlay = document.getElementById("modalOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "modalOverlay";
    overlay.className = "modal-overlay";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });
    document.body.appendChild(overlay);
  }
  return overlay;
}

function closeModal(): void {
  const overlay = document.getElementById("modalOverlay");
  if (overlay) {
    overlay.classList.remove("active");
  }
}

function openModal(content: string): void {
  const overlay = createModalOverlay();
  overlay.innerHTML = `
    <div class="modal">
      <button class="modal-close" id="modalClose">&times;</button>
      ${content}
    </div>
  `;
  
  const closeBtn = document.getElementById("modalClose");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }
  
  overlay.classList.add("active");
}

function renderProjectModal(project: typeof projectItems[0]): string {
  return `
    <div class="modal-header">
      <h2 class="modal-title">${project.title}</h2>
      <div class="modal-meta">
        ${project.stack.map(tag => `<span class="modal-pill">${tag}</span>`).join("")}
      </div>
    </div>
    <div class="modal-content">
      <div class="modal-section">
        <p style="font-size: 1.1rem; color: rgba(255,255,255,0.85); line-height: 1.8;">${project.summary}</p>
      </div>
      
      ${project.gallery.length > 0 ? `
        <div class="modal-section">
          <h4>閿熸枻鎷风洰鍥剧墖</h4>
          <div class="modal-gallery">
            ${project.gallery.map(img => `<img src="${img}" alt="${project.title}" loading="lazy"/>`).join("")}
          </div>
        </div>
      ` : ""}
      
      <div class="modal-section">
        <h4>閿熸枻鎷风洰閿熸枻鎷烽敓鏂ゆ嫹</h4>
        <ul class="modal-list">
          ${project.highlights.map(h => `<li>${h}</li>`).join("")}
        </ul>
      </div>
      
      ${project.links.length > 0 ? `
        <div class="modal-section">
          <h4>閿熸枻鎷烽敓鏂ゆ嫹閿熸枻鎷烽敓锟�</h4>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            ${project.links.map(link => `
              <a href="${link.href}" style="background: linear-gradient(135deg, var(--accent), #00ffbb); color: #000; padding: 10px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">${link.label}</a>
            `).join("")}
          </div>
        </div>
      ` : ""}
    </div>
  `;
}

function renderDocModal(doc: typeof techDocs[0]): string {
  return `
    <div class="modal-header">
      <h2 class="modal-title">${doc.title}</h2>
      <div class="modal-meta">
        <span class="modal-pill">${doc.category}</span>
        <span class="modal-pill">${doc.level}</span>
        <span class="modal-pill">${doc.updatedAt}</span>
      </div>
    </div>
    <div class="modal-content">
      <div class="modal-section">
        <p style="font-size: 1.1rem; color: rgba(255,255,255,0.85); line-height: 1.8;">${doc.summary}</p>
      </div>
      
      <div class="modal-section">
        <h4>閿熸枻鎷风</h4>
        <div class="modal-tags">
          ${doc.tags.map(tag => `<span>${tag}</span>`).join("")}
        </div>
      </div>
      
      <div class="modal-section">
        <h4>閿熶茎纰夋嫹閿熸枻鎷烽敓鏂ゆ嫹</h4>
        <div class="modal-markdown">
          ${doc.markdown.split("\n").map(line => {
            if (line.startsWith("## ")) {
              return `<h2>${line.substring(3)}</h2>`;
            } else if (line.startsWith("### ")) {
              return `<h3>${line.substring(4)}</h3>`;
            } else if (line.startsWith("- ")) {
              return `<li>${line.substring(2)}</li>`;
            } else if (line.trim() === "") {
              return "";
            } else {
              return `<p>${line}</p>`;
            }
          }).join("").replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')}
        </div>
      </div>
    </div>
  `;
}

function renderLifeModal(post: typeof lifePosts[0]): string {
  return `
    <div class="modal-header">
      <h2 class="modal-title">${post.title}</h2>
      <div class="modal-meta">
        <span class="modal-pill">${post.date}</span>
        <span class="modal-pill">${post.tag}</span>
      </div>
    </div>
    <div class="modal-content">
      <div class="modal-section">
        <img src="${post.cover}" alt="${post.title}" style="width: 100%; border-radius: 16px; margin-bottom: 20px;"/>
        <p style="font-size: 1.1rem; color: rgba(255,255,255,0.85); line-height: 1.8;">${post.summary}</p>
      </div>
      
      <div class="modal-section" style="text-align: center; padding: 30px 0; border-top: 1px solid rgba(255,255,255,0.1);">
        <p style="color: rgba(255,255,255,0.5); font-style: italic;">閿熸枻鎷烽敓娲佺簿閿熸枻鎷烽敓鏂ゆ嫹閿熸嵎纭锋嫹閿熸枻鎷烽敓鏂ゆ嫹閿熸枻鎷�...</p>
      </div>
    </div>
  `;
}

export function bindModalEvents(): void {
  // Project cards
  document.querySelectorAll(".project-card").forEach((card, index) => {
    card.addEventListener("click", () => {
      const project = projectItems[index];
      if (project) {
        openModal(renderProjectModal(project));
      }
    });
  });
  
  // Doc cards
  document.querySelectorAll(".doc-card").forEach((card) => {
    card.addEventListener("click", () => {
      const title = card.querySelector("h3")?.textContent;
      const doc = techDocs.find(d => d.title === title);
      if (doc) {
        openModal(renderDocModal(doc));
      }
    });
  });
  
  // Life cards
  document.querySelectorAll(".life-card").forEach((card, index) => {
    card.addEventListener("click", () => {
      const post = lifePosts[index];
      if (post) {
        openModal(renderLifeModal(post));
      }
    });
  });
  
  // Escape key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });
}
