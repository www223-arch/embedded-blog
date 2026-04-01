export function mountScrollEffect(): void {
  const homeContainer = document.querySelector('.home-container');
  const homeBackground = document.querySelector('.home-background');
  const homeForeground = document.querySelector('.home-foreground');
  const navStage = document.getElementById('navStage');
  const stageCards = document.querySelectorAll('.stage-card');
  const heroTextElements = document.querySelectorAll('.hero .container p, .hero .container span');
  const rocketContainer = document.querySelector('.rocket-container') as HTMLElement;
  
  if (!homeContainer || !homeBackground || !homeForeground || !navStage) return;
  
  let hasTriggered = false;
  let currentPhase: 'idle' | 'jet' | 'launch' = 'idle';
  
  // ???????????
  const SCROLL_THRESHOLD_JET = 30;      // ???????????????
  const SCROLL_THRESHOLD_LAUNCH = 150;  // ??????????????
  const SCROLL_MAX_LAUNCH = 600;        // ??????????????????
  
  function handleScroll() {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    
    // ??????????????? (0-1)
    const scrollProgress = Math.min(scrollY / windowHeight, 1);
    
    // ????????????????
    const scale = 1 - scrollProgress * 0.4;
    const blur = scrollProgress * 12;
    
    homeBackground.style.transform = `scale(${scale})`;
    homeBackground.style.filter = `blur(${blur}px)`;
    
    // ?????????
    heroTextElements.forEach(element => {
      const opacity = Math.max(0, 1 - scrollProgress * 2);
      (element as HTMLElement).style.transform = `scale(${scale})`;
      (element as HTMLElement).style.opacity = `${opacity}`;
      if (opacity === 0) {
        (element as HTMLElement).style.display = 'none';
      } else {
        (element as HTMLElement).style.display = 'block';
      }
    });
    
    // ?????????
    const translateY = scrollProgress * 80;
    homeForeground.style.transform = `translateY(${translateY}px)`;
    
    // ????????????????
    if (rocketContainer) {
      handleRocketAnimation(scrollY);
    }
    
    // ??????????????
    if (scrollProgress > 0.5 && !hasTriggered) {
      hasTriggered = true;
      navStage.classList.add('visible');
      
      setTimeout(() => {
        stageCards.forEach(card => {
          card.classList.add('visible');
        });
      }, 100);
    }
  }
  
  function handleRocketAnimation(scrollY: number) {
    if (!rocketContainer) return;
    
    // ???1: ??????? (SCROLL_THRESHOLD_JET ~ SCROLL_THRESHOLD_LAUNCH)
    if (scrollY >= SCROLL_THRESHOLD_JET && scrollY < SCROLL_THRESHOLD_LAUNCH) {
      if (currentPhase !== 'jet') {
        currentPhase = 'jet';
        rocketContainer.classList.remove('phase-launch');
        rocketContainer.classList.add('phase-jet');
      }
      
      // ???????????????????????????????????
      const jetProgress = (scrollY - SCROLL_THRESHOLD_JET) / (SCROLL_THRESHOLD_LAUNCH - SCROLL_THRESHOLD_JET);
      const sinkY = jetProgress * 10; // ??????10px
      rocketContainer.style.transform = `translateX(-50%) translateY(${sinkY}px)`;
      rocketContainer.style.opacity = '1';
    }
    // ???2: ???? (SCROLL_THRESHOLD_LAUNCH ~ SCROLL_MAX_LAUNCH)
    else if (scrollY >= SCROLL_THRESHOLD_LAUNCH) {
      if (currentPhase !== 'launch') {
        currentPhase = 'launch';
        rocketContainer.classList.remove('phase-jet');
        rocketContainer.classList.add('phase-launch');
      }
      
      // ??????????? (0-1)
      const launchProgress = Math.min(
        (scrollY - SCROLL_THRESHOLD_LAUNCH) / (SCROLL_MAX_LAUNCH - SCROLL_THRESHOLD_LAUNCH),
        1
      );
      
      // ?????????????????????????????
      const launchY = -launchProgress * (window.innerHeight + 300); // ?????????
      const rocketScale = 1 - launchProgress * 0.3; // ?????
      const rocketOpacity = 1 - launchProgress * 0.8; // ?????
      
      rocketContainer.style.transform = `translateX(-50%) translateY(${launchY}px) scale(${rocketScale})`;
      rocketContainer.style.opacity = `${rocketOpacity}`;
    }
    // ?????
    else {
      if (currentPhase !== 'idle') {
        currentPhase = 'idle';
        rocketContainer.classList.remove('phase-jet', 'phase-launch');
      }
      
      // ???????????????
      const idleScale = Math.max(0.85, 1 - scrollY / SCROLL_THRESHOLD_JET * 0.15);
      rocketContainer.style.transform = `translateX(-50%) scale(${idleScale})`;
      rocketContainer.style.opacity = '1';
    }
  }
  
  // ?????
  handleScroll();
  
  // ????????
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // ????????
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}
