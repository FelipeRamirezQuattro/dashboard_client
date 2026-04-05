// client/src/hooks/useCountUp.ts
import { useState, useEffect } from "react";

/**
 * Animates a number from 0 to `target` over `duration` ms with cubic ease-out.
 * Skips animation if user prefers reduced motion.
 */
export function useCountUp(target: number, duration = 800): number {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [count, setCount] = useState(prefersReduced ? target : 0);

  useEffect(() => {
    if (prefersReduced) {
      setCount(target);
      return;
    }
    if (target === 0) {
      setCount(0);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, prefersReduced]);

  return count;
}
