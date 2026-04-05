import { lifePosts } from "../../content/lifePosts";
import { animateSwapOutIn } from "../../shared/motion";
import { navigate } from "../../app/router";

export function renderLife(): string {
  const tags = [...new Set(lifePosts.map((post) => post.tag))];
  const base = import.meta.env.BASE_URL;
  return `
  <div class="page-wrapper life-page">
    <div class="bg-slider">
      <div class="bg-slide active" style="background-image: url('${base}guosai2.jpg')"></div>
      <div class="bg-slide" style="background-image: url('${base}xiaoshao.jpg')"></div>
      <div class="bg-slide" style="background-image: url('${base}Giobal.jpg')"></div>
    </div>
    <div class="bg-navigation">
      <button class="bg-nav-btn prev" id="prevBg">&lt;</button>
      <button class="bg-nav-btn next" id="nextBg">&gt;</button>
    </div>
    <div style="height: 250px;"></div>
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
    <div style="height: 0px;"></div>
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
  
  if (!filter || !grid) return;
  
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
  
  document.querySelectorAll(".life-card").forEach((card) => {
    card.addEventListener("click", () => {
      const postId = card.getAttribute("data-id");
      if (postId) {
        navigate("life-detail", { id: postId });
      }
    });
  });
  
  const slides = document.querySelectorAll<HTMLElement>(".bg-slide");
  const prevBtn = document.getElementById("prevBg");
  const nextBtn = document.getElementById("nextBg");
  
  if (slides.length > 0 && prevBtn && nextBtn) {
    let currentIndex = 0;
    const totalSlides = slides.length;
    let autoSlideInterval: ReturnType<typeof setTimeout>;
    
    function showSlide(index: number) {
      if (index < 0) index = totalSlides - 1;
      if (index >= totalSlides) index = 0;
      
      const prevIndex = currentIndex;
      
      slides.forEach((slide) => {
        slide.classList.remove("active");
      });
      
      slides[index].classList.add("active");
      
      if (prevIndex !== index) {
        slides[prevIndex].style.opacity = '1';
        slides[prevIndex].style.zIndex = '1';
        
        setTimeout(() => {
          slides[prevIndex].style.opacity = '';
          slides[prevIndex].style.zIndex = '';
        }, 50);
      }
      
      currentIndex = index;
    }
    
    function startAutoSlide() {
      if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
      }
      autoSlideInterval = setInterval(() => {
        showSlide(currentIndex + 1);
      }, 4500);
    }
    
    prevBtn.addEventListener("click", () => {
      showSlide(currentIndex - 1);
      startAutoSlide();
    });
    
    nextBtn.addEventListener("click", () => {
      showSlide(currentIndex + 1);
      startAutoSlide();
    });
    
    showSlide(0);
    startAutoSlide();
  }
  
  const lifeHeader = document.querySelector<HTMLElement>('.life-header');
  const bgNavigation = document.querySelector<HTMLElement>('.bg-navigation');
  const pageIntro = document.querySelector<HTMLElement>('.page-intro');
  const lifeFilter = document.querySelector<HTMLElement>('#lifeFilter');
  
  if (siteHeader && lifeHeader) {
    const currentView = document.getElementById('view');
    if (currentView && currentView.classList.contains('life')) {
      siteHeader.style.display = 'block';
    }
    
    let isFixed = false;
    let initialOffsetTop = 0;
    let headerHeight = 0;
    let lifeHeaderHeight = 0;
    
    function calculateInitialPositions() {
      if (lifeHeader) {
        lifeHeader.classList.remove('fixed');
      }
      if (siteHeader) {
        siteHeader.classList.remove('header-fixed');
      }
      
      if (lifeHeader) {
        const rect = lifeHeader.getBoundingClientRect();
        initialOffsetTop = rect.top + window.scrollY;
        headerHeight = 56;
        lifeHeaderHeight = rect.height;
      }
    }
    
    const placeholder = document.createElement('div');
    placeholder.style.display = 'none';
    placeholder.style.height = '0';
    lifeHeader.parentNode?.insertBefore(placeholder, lifeHeader.nextSibling);
    
    calculateInitialPositions();
    
    function updateBgNavigationOpacity() {
      if (!bgNavigation || !pageIntro || !lifeFilter) return;
      
      const introRect = pageIntro.getBoundingClientRect();
      const filterRect = lifeFilter.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const higherTop = Math.min(introRect.top, filterRect.top);
      
      const fadeStart = windowHeight;
      const fadeEnd = windowHeight * 0.4;
      
      let opacity = 1;
      
      if (higherTop < fadeStart) {
        if (higherTop <= fadeEnd) {
          opacity = 0;
        } else {
          opacity = (higherTop - fadeEnd) / (fadeStart - fadeEnd);
          opacity = Math.max(0, Math.min(1, opacity));
        }
      }
      
      bgNavigation.style.opacity = String(opacity);
      bgNavigation.style.pointerEvents = opacity < 0.1 ? 'none' : 'auto';
    }
    
    function updateScroll() {
      const scrollY = window.scrollY;
      
      if (siteHeader) {
        if (scrollY > 100) {
          siteHeader.classList.add('header-fixed');
        } else {
          siteHeader.classList.remove('header-fixed');
        }
      }
      
      const triggerPoint = initialOffsetTop - headerHeight;
      
      if (scrollY > triggerPoint && !isFixed && lifeHeader) {
        lifeHeader.classList.add('fixed');
        placeholder.style.display = 'block';
        placeholder.style.height = lifeHeaderHeight + 'px';
        isFixed = true;
      } else if (scrollY <= triggerPoint && isFixed && lifeHeader) {
        lifeHeader.classList.remove('fixed');
        placeholder.style.display = 'none';
        placeholder.style.height = '0';
        isFixed = false;
      }
      
      updateBgNavigationOpacity();
    }
    
    updateScroll();
    
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', () => {
      calculateInitialPositions();
      updateScroll();
    }, { passive: true });
  }
}


