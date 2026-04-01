export function mountScrollEffect(): void {
  const homeContainer = document.querySelector('.home-container');
  const homeBackground = document.querySelector('.home-background');
  const homeForeground = document.querySelector('.home-foreground');
  const navStage = document.getElementById('navStage');
  const stageCards = document.querySelectorAll('.stage-card');
  
  if (!homeContainer || !homeBackground || !homeForeground || !navStage) return;
  
  let hasTriggered = false;
  
  function handleScroll() {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    
    // 滚动进度与滚动距离成线性关系
    const scrollProgress = Math.min(scrollY / windowHeight, 1);
    
    // 背景缩小和模糊效果 - 滚动越多缩得越小
    const scale = 1 - scrollProgress * 0.4;
    const blur = scrollProgress * 12;
    
    homeBackground.style.transform = `scale(${scale})`;
    homeBackground.style.filter = `blur(${blur}px)`;
    
    // 前景元素移动
    const translateY = scrollProgress * 80;
    homeForeground.style.transform = `translateY(${translateY}px)`;
    
    // 触发导航舞台显示
    if (scrollProgress > 0.5 && !hasTriggered) {
      hasTriggered = true;
      navStage.classList.add('visible');
      
      // 触发卡牌翻转效果
      setTimeout(() => {
        stageCards.forEach(card => {
          card.classList.add('visible');
        });
      }, 100);
    }
  }
  
  // 初始调用
  handleScroll();
  
  // 监听滚动事件
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // 清理函数
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}
