// 懒加载工具函数
export function lazyLoadBackgrounds(): void {
  // 选择所有带有 data-bg 属性的元素
  const elements = document.querySelectorAll('[data-bg]');
  
  if (!elements.length) return;
  
  // 创建 Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        const bgUrl = element.getAttribute('data-bg');
        
        if (bgUrl) {
          // 设置背景图片
          element.style.backgroundImage = `url('${bgUrl}')`;
          // 移除 data-bg 属性，避免重复加载
          element.removeAttribute('data-bg');
        }
        
        // 停止观察该元素
        observer.unobserve(element);
      }
    });
  }, {
    // 当元素进入视口 10% 时触发
    threshold: 0.1
  });
  
  // 观察所有带有 data-bg 属性的元素
  elements.forEach((element) => {
    observer.observe(element);
  });
}

// 预加载关键图片
export function preloadCriticalImages(imageUrls: string[]): void {
  imageUrls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}
