import gsap from "gsap";

export const motionTokens = {
  enterDuration: 0.5,
  hoverDuration: 0.24,
  swapDuration: 0.22,
  ease: "power2.out"
};

export function animateViewEnter(container: HTMLElement): void {
  gsap.from(container.querySelectorAll(".reveal"), {
    y: 16,
    opacity: 0,
    duration: motionTokens.enterDuration,
    ease: motionTokens.ease,
    stagger: 0.06
  });
}

export function bindHoverLift(selector: string): void {
  containerSafeQuery(selector).forEach((el) => {
    el.addEventListener("mouseenter", () => {
      gsap.to(el, { y: -4, duration: motionTokens.hoverDuration, ease: motionTokens.ease });
    });
    el.addEventListener("mouseleave", () => {
      gsap.to(el, { y: 0, duration: motionTokens.hoverDuration, ease: motionTokens.ease });
    });
  });
}

export function animateSwapOutIn(target: HTMLElement, beforeIn: () => void): void {
  gsap.to(target, {
    y: 8,
    opacity: 0,
    duration: motionTokens.swapDuration,
    ease: "power1.out",
    onComplete: () => {
      beforeIn();
      gsap.fromTo(
        target,
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: motionTokens.swapDuration, ease: motionTokens.ease }
      );
    }
  });
}

function containerSafeQuery(selector: string): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(selector)];
}
