import { useEffect, useRef, useState } from "react";

/**
 * Tracks scroll progress (0 -> 1) of an element as it moves through the
 * viewport. 0 = element's top just entered the bottom of the viewport,
 * 1 = element's bottom has just left the top of the viewport.
 * Useful for scrubbing a chart/animation as the user scrolls through a
 * tall "pinned" section.
 */
export function useScrollProgress() {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = null;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height + vh;
      const traveled = vh - rect.top;
      const p = Math.min(1, Math.max(0, traveled / total));
      setProgress(p);
      raf = null;
    };

    const onScroll = () => {
      if (raf == null) raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return [ref, progress];
}
