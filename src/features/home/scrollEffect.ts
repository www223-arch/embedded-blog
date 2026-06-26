import { createRocketLaunchState } from "./rocketLaunchMotion";
import { createStageRevealState } from "./stageRevealMotion";

export function mountScrollEffect(): () => void {
  const homeContainer = document.querySelector('.home-container');
  const homeBackground = document.querySelector<HTMLElement>('.home-background');
  const homeForeground = document.querySelector<HTMLElement>('.home-foreground');
  const navStage = document.getElementById('navStage');
  const stageCards = document.querySelectorAll('.stage-card');
  const heroTextElements = document.querySelectorAll('.hero .container p, .hero .container span');
  const rocketContainer = document.querySelector('.rocket-container') as HTMLElement;
  
  if (!homeContainer || !homeBackground || !homeForeground || !navStage) return () => {};
  const navStageElement = navStage;
  
  let hasTriggered = false;
  let currentPhase: 'idle' | 'jet' | 'launch' = 'idle';
  
  function handleScroll() {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    
    // 计算滚动进度 (0-1)
    const scrollProgress = Math.min(scrollY / windowHeight, 1);
    
    // ????????????????
    const scale = 1 - scrollProgress * 0.4;
    const blur = scrollProgress * 12;
    
    if (homeBackground) {
      homeBackground.style.transform = `scale(${scale})`;
      homeBackground.style.filter = `blur(${blur}px)`;
    }
    
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
    if (homeForeground) {
      const translateY = scrollProgress * 80;
      homeForeground.style.transform = `translateY(${translateY}px)`;
    }
    
    // ????????????????
    if (rocketContainer) {
      handleRocketAnimation(scrollY);
    }
    
    const stageState = createStageRevealState({
      scrollY,
      viewportHeight: windowHeight,
      cardCount: stageCards.length
    });

    navStageElement.style.setProperty("--stage-unlock", stageState.intensity.toFixed(3));

    if (stageState.visible && !hasTriggered) {
      hasTriggered = true;
      navStageElement.classList.add('visible');
      
      setTimeout(() => {
        stageCards.forEach(card => {
          card.classList.add('visible');
        });
      }, 100);
    }

    stageCards.forEach((card, index) => {
      const node = card as HTMLElement;
      node.style.setProperty("--stage-card-progress", (stageState.cardProgress[index] ?? 0).toFixed(3));
    });
  }
  
  function handleRocketAnimation(scrollY: number) {
    if (!rocketContainer) return;

    const rocketState = createRocketLaunchState({ scrollY, viewportHeight: window.innerHeight });

    if (currentPhase !== rocketState.phase) {
      currentPhase = rocketState.phase;
      rocketContainer.classList.toggle("phase-jet", rocketState.phase === "jet");
      rocketContainer.classList.toggle("phase-launch", rocketState.phase === "launch");
    }

    rocketContainer.style.transform = `translateX(-50%) translateY(${rocketState.translateY}px) scale(${rocketState.scale})`;
    rocketContainer.style.opacity = `${rocketState.opacity}`;
  }
  
  // ?????
  handleScroll();
  
  // ????????
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // ????????
  return () => {
    window.removeEventListener('scroll', handleScroll);
    homeBackground.style.transform = "";
    homeBackground.style.filter = "";
    homeForeground.style.transform = "";
    navStageElement.style.removeProperty("--stage-unlock");
    stageCards.forEach((card) => {
      const node = card as HTMLElement;
      node.classList.remove("visible");
      node.style.removeProperty("--stage-card-progress");
    });
    heroTextElements.forEach((element) => {
      const node = element as HTMLElement;
      node.style.transform = "";
      node.style.opacity = "";
      node.style.display = "";
    });
    if (rocketContainer) {
      rocketContainer.classList.remove("phase-jet", "phase-launch");
      rocketContainer.style.transform = "";
      rocketContainer.style.opacity = "";
    }
  };
}
