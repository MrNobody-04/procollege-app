export type HeroMotionOptions = {
  heroSelector?: string;
  revealSelector?: string;
  dashboardSelector?: string;
  tiltEnabled?: boolean;
};

export function initHeroAnimations(
  options: HeroMotionOptions = {}
): () => void {
  const {
    heroSelector = ".hero",
    revealSelector = "[data-reveal]",
    dashboardSelector = ".hero-dashboard-shell",
    tiltEnabled = true,
  } = options;

  if (typeof window === "undefined") {
    return () => {};
  }

  const hero = document.querySelector<HTMLElement>(heroSelector);
  const dashboard = document.querySelector<HTMLElement>(dashboardSelector);

  const revealElements = document.querySelectorAll<HTMLElement>(revealSelector);

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const cleanups: Array<() => void> = [];

  // 1. Scroll reveal
  if (reducedMotion) {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  } else {
    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            element.classList.add("is-visible");
            currentObserver.unobserve(element);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    revealElements.forEach((element) => observer.observe(element));

    cleanups.push(() => observer.disconnect());
  }

  // 2. Mouse-following 3D dashboard
  if (
    dashboard &&
    tiltEnabled &&
    !reducedMotion &&
    window.matchMedia("(pointer: fine)").matches
  ) {
    let frame = 0;

    const handlePointerMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        if (window.innerWidth < 950) return;

        const rect = dashboard.getBoundingClientRect();

        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        const rotateY = (x - 0.5) * 8;
        const rotateX = (0.5 - y) * 6;

        dashboard.style.setProperty("--tilt-x", `${rotateX}deg`);
        dashboard.style.setProperty("--tilt-y", `${rotateY}deg`);
      });
    };

    const resetTilt = () => {
      cancelAnimationFrame(frame);
      dashboard.style.setProperty("--tilt-x", "0deg");
      dashboard.style.setProperty("--tilt-y", "0deg");
    };

    dashboard.addEventListener("pointermove", handlePointerMove);
    dashboard.addEventListener("pointerleave", resetTilt);

    cleanups.push(() => {
      cancelAnimationFrame(frame);
      dashboard.removeEventListener("pointermove", handlePointerMove);
      dashboard.removeEventListener("pointerleave", resetTilt);
      resetTilt();
    });
  }

  // 3. Scroll parallax
  if (hero && !reducedMotion) {
    let scrollFrame = 0;

    const updateParallax = () => {
      cancelAnimationFrame(scrollFrame);

      scrollFrame = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();

        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          return;
        }

        const progress = Math.max(0, -rect.top);

        hero.style.setProperty("--hero-scroll", `${progress * 0.12}px`);
      });
    };

    window.addEventListener("scroll", updateParallax, {
      passive: true,
    });

    updateParallax();

    cleanups.push(() => {
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener("scroll", updateParallax);
    });
  }

  // Return cleanup for React useEffect or page navigation.
  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
