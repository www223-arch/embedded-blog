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
    <!-- 顶部空间 - 让物体可以向下移动，完全移出画面上方 -->
    <div style="height: 200px;"></div>
    <section class="container section life-content">
      <div class="life-header">
        <p class="reveal page-intro">这里记录生活、摄影、阅读和日常的小灵感。</p>
        <div class="filter reveal" id="lifeFilter">
          <button class="active" data-life-filter="all">全部</button>
          ${tags.map((tag) => `<button data-life-filter="${tag}">${tag}</button>`).join("")}
        </div>
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
    <!-- 底部占位符 - 确保可以向下滚动到更低 -->
    <div style="height: 0px;"></div>
    <div id="lifeModal" class="modal" style="display: none;">
      <div class="modal-content">
        <span class="modal-close">&times;</span>
        <div id="lifeModalContent"></div>
      </div>
    </div>
  </div>
  `;
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

export function bindLifeFilter(): void {
  const filter = document.getElementById("lifeFilter");
  const grid = document.querySelector<HTMLElement>(".life-grid");
  const siteHeader = document.querySelector<HTMLElement>(".site-header");
  const lifeCards = document.querySelectorAll<HTMLElement>(".life-card");
  
  if (!filter || !grid) return;
  
  // 为所有filter按钮添加磁吸效果
  filter.querySelectorAll("button").forEach((button) => {
    bindMagneticButton(button as HTMLElement);
    
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
      
      const prevIndex = currentIndex;
      
      // 移除所有激活状态
      slides.forEach((slide, i) => {
        slide.classList.remove("active");
      });
      
      // 先让新图片显示（在最上层）
      slides[index].classList.add("active");
      
      // 如果之前有激活的图片且不是同一张，确保它在下层保持显示直到过渡完成
      if (prevIndex !== index) {
        slides[prevIndex].style.opacity = '1';
        slides[prevIndex].style.zIndex = '1';
        
        // 延迟后让旧图片淡出
        setTimeout(() => {
          slides[prevIndex].style.opacity = '';
          slides[prevIndex].style.zIndex = '';
        }, 50);
      }
      
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
      }, 4500); // 每3秒切换一次
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
  
  // ============================================
  // 滚动定格效果逻辑
  // ============================================
  const lifeHeader = document.querySelector<HTMLElement>('.life-header');
  const bgNavigation = document.querySelector<HTMLElement>('.bg-navigation');
  const pageIntro = document.querySelector<HTMLElement>('.page-intro');
  const lifeFilter = document.querySelector<HTMLElement>('#lifeFilter');
  
  if (siteHeader && lifeHeader) {
    // 只在life页面显示页头
    const currentView = document.getElementById('view');
    if (currentView && currentView.classList.contains('life')) {
      siteHeader.style.display = 'block';
    }
    
    let isFixed = false;
    let initialOffsetTop = 0;
    let headerHeight = 0;
    let lifeHeaderHeight = 0;
    
    // 计算初始位置和高度
    function calculateInitialPositions() {
      // 确保元素未固定
      lifeHeader.classList.remove('fixed');
      siteHeader.classList.remove('header-fixed');
      
      // 计算初始位置和高度
      const rect = lifeHeader.getBoundingClientRect();
      initialOffsetTop = rect.top + window.scrollY;
      headerHeight = 56; // 固定值，与CSS中的top值一致
      lifeHeaderHeight = rect.height;
    }
    
    // 创建占位符元素
    const placeholder = document.createElement('div');
    placeholder.style.display = 'none';
    placeholder.style.height = '0';
    lifeHeader.parentNode?.insertBefore(placeholder, lifeHeader.nextSibling);
    
    // 初始计算
    calculateInitialPositions();
    
    // 计算背景导航按钮透明度
    function updateBgNavigationOpacity() {
      if (!bgNavigation || !pageIntro || !lifeFilter) return;
      
      const introRect = pageIntro.getBoundingClientRect();
      const filterRect = lifeFilter.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // 获取两个元素中较高的那个的顶部位置
      const higherTop = Math.min(introRect.top, filterRect.top);
      
      // 定义渐隐范围：从窗口底部往上到 60vh 位置
      const fadeStart = windowHeight; // 开始渐隐的位置（窗口底部）
      const fadeEnd = windowHeight * 0.4; // 完全透明的位置（40vh）
      
      let opacity = 1;
      
      if (higherTop < fadeStart) {
        // 元素进入渐隐范围
        if (higherTop <= fadeEnd) {
          // 已经完全进入，透明度为0
          opacity = 0;
        } else {
          // 在渐隐过程中，计算透明度
          opacity = (higherTop - fadeEnd) / (fadeStart - fadeEnd);
          opacity = Math.max(0, Math.min(1, opacity));
        }
      }
      
      bgNavigation.style.opacity = String(opacity);
      bgNavigation.style.pointerEvents = opacity < 0.1 ? 'none' : 'auto';
    }
    
    function updateScroll() {
      const scrollY = window.scrollY;
      
      // 顶部导航固定
      if (scrollY > 100) {
        siteHeader.classList.add('header-fixed');
      } else {
        siteHeader.classList.remove('header-fixed');
      }
      
      // 个人分享页头固定
      const triggerPoint = initialOffsetTop - headerHeight;
      
      if (scrollY > triggerPoint && !isFixed) {
        // 固定页头
        lifeHeader.classList.add('fixed');
        // 设置占位符高度为页头原始高度
        placeholder.style.display = 'block';
        placeholder.style.height = lifeHeaderHeight + 'px';
        isFixed = true;
      } else if (scrollY <= triggerPoint && isFixed) {
        // 取消固定
        lifeHeader.classList.remove('fixed');
        placeholder.style.display = 'none';
        placeholder.style.height = '0';
        isFixed = false;
      }
      
      // 更新背景导航按钮透明度
      updateBgNavigationOpacity();
    }
    
    // 初始更新
    updateScroll();
    
    // 滚动事件监听
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', () => {
      calculateInitialPositions();
      updateScroll();
    }, { passive: true });
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
