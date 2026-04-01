import { lifePosts } from "../../content/lifePosts";
import { animateSwapOutIn } from "../../shared/motion";

export function renderLife(): string {
  const tags = [...new Set(lifePosts.map((post) => post.tag))];
  return `
  <div class="page-wrapper life-page bg-1">
    <div class="bg-controls">
      <button class="bg-btn active" data-bg="1"></button>
      <button class="bg-btn" data-bg="2"></button>
      <button class="bg-btn" data-bg="3"></button>
    </div>
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
  </div>
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
  
  // 背景切换功能
  const pageWrapper = document.querySelector<HTMLElement>(".life-page");
  const bgBtns = document.querySelectorAll<HTMLElement>(".bg-btn");
  if (pageWrapper && bgBtns.length > 0) {
    let currentBg = 1;
    const totalBg = 3;
    
    function switchBg(bgIndex: number) {
      // 移除所有背景类
      pageWrapper.classList.remove("bg-1", "bg-2", "bg-3");
      // 添加当前背景类
      pageWrapper.classList.add(`bg-${bgIndex}`);
      // 更新按钮状态
      bgBtns.forEach((b, index) => {
        if (index + 1 === bgIndex) {
          b.classList.add("active");
        } else {
          b.classList.remove("active");
        }
      });
      currentBg = bgIndex;
    }
    
    // 手动切换
    bgBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const bg = parseInt(btn.getAttribute("data-bg") || "1");
        switchBg(bg);
      });
    });
    
    // 自动轮播
    setInterval(() => {
      let nextBg = currentBg + 1;
      if (nextBg > totalBg) {
        nextBg = 1;
      }
      switchBg(nextBg);
    }, 8000); // 每8秒切换一次
  }
}
