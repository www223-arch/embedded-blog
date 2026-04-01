import { lifePosts } from "../../content/lifePosts";
import { animateSwapOutIn } from "../../shared/motion";

export function renderLife(): string {
  const tags = [...new Set(lifePosts.map((post) => post.tag))];
  return `
  <div class="page-wrapper life-page">
    <div class="bg-slider">
      <div class="bg-slide active" style="background-image: url('/guosai2.jpg')"></div>
      <div class="bg-slide" style="background-image: url('/xiaoshao.jpg')"></div>
      <div class="bg-slide" style="background-image: url('/Giobal.jpg')"></div>
    </div>
    <div class="bg-navigation">
      <button class="bg-nav-btn prev" id="prevBg">&lt;</button>
      <button class="bg-nav-btn next" id="nextBg">&gt;</button>
    </div>
    <section class="container section life-content">
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
          <article class="card life-card" data-tag="${post.tag}" data-id="${post.id}">
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
    <div id="lifeModal" class="modal" style="display: none;">
      <div class="modal-content">
        <span class="modal-close">&times;</span>
        <div id="lifeModalContent"></div>
      </div>
    </div>
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
  
  // 绑定卡片点击事件
  document.querySelectorAll(".life-card").forEach((card) => {
    card.addEventListener("click", () => {
      const postId = card.getAttribute("data-id");
      if (postId) {
        showLifeDetails(postId);
      }
    });
  });
  
  // 绑定模态框关闭事件
  const modal = document.getElementById("lifeModal");
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
  
  // 堆叠式背景切换功能
  const slides = document.querySelectorAll<HTMLElement>(".bg-slide");
  const prevBtn = document.getElementById("prevBg");
  const nextBtn = document.getElementById("nextBg");
  
  if (slides.length > 0 && prevBtn && nextBtn) {
    let currentIndex = 0;
    const totalSlides = slides.length;
    let autoSlideInterval: NodeJS.Timeout;
    
    function showSlide(index: number) {
      // 确保索引在有效范围内
      if (index < 0) index = totalSlides - 1;
      if (index >= totalSlides) index = 0;
      
      // 移除所有激活状态
      slides.forEach((slide, i) => {
        slide.classList.remove("active", "prev", "next");
        if (i === index) {
          slide.classList.add("active");
        } else if (i === (index - 1 + totalSlides) % totalSlides) {
          slide.classList.add("prev");
        } else if (i === (index + 1) % totalSlides) {
          slide.classList.add("next");
        }
      });
      
      currentIndex = index;
    }
    
    // 启动自动轮播
    function startAutoSlide() {
      // 清除现有的定时器
      if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
      }
      // 重新设置定时器
      autoSlideInterval = setInterval(() => {
        showSlide(currentIndex + 1);
      }, 8000); // 每8秒切换一次
    }
    
    // 手动切换
    prevBtn.addEventListener("click", () => {
      showSlide(currentIndex - 1);
      startAutoSlide(); // 重置自动切换定时器
    });
    
    nextBtn.addEventListener("click", () => {
      showSlide(currentIndex + 1);
      startAutoSlide(); // 重置自动切换定时器
    });
    
    // 初始化显示并启动自动轮播
    showSlide(0);
    startAutoSlide();
  }
}

function showLifeDetails(postId: string): void {
  const post = lifePosts.find((p) => p.id === postId);
  const modal = document.getElementById("lifeModal");
  const content = document.getElementById("lifeModalContent");
  if (!post || !modal || !content) return;
  
  content.innerHTML = `
    <h3>${post.title}</h3>
    ${post.cover ? `<img src="${post.cover}" alt="${post.title}" style="width: 100%; border-radius: 10px; margin: 20px 0;"/>` : ""}
    <div class="life-meta">${post.date} · ${post.tag}</div>
    <p>${post.summary}</p>
  `;
  modal.style.display = "block";
}
