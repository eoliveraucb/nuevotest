import { useEffect, useRef, useState } from "react";

/**
 * Lightweight "scrollama"-style hook. Give it a number of steps; it returns
 * a ref-setter for each step element and the index of whichever step is
 * currently most visible in the viewport (biased toward the vertical center).
 *
 * Usage:
 *   const { setStepRef, activeStep } = useActiveStep(steps.length);
 *   steps.map((s, i) => <div ref={setStepRef(i)}>...</div>)
 */
export function useActiveStep(count, { threshold = 0 } = {}) {
  const [activeStep, setActiveStep] = useState(0);
  const refs = useRef([]);
  const visibleRatios = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.dataset.stepIndex);
          visibleRatios.current[idx] = entry.isIntersecting
            ? entry.intersectionRatio
            : 0;
        });

        // Pick whichever observed step currently has the most overlap with
        // the center band. Falls back gracefully if none intersect yet.
        let bestIdx = null;
        let bestRatio = 0;
        Object.entries(visibleRatios.current).forEach(([idx, ratio]) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIdx = Number(idx);
          }
        });
        if (bestIdx != null && bestRatio > 0) {
          setActiveStep(bestIdx);
        }
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: "-35% 0px -35% 0px",
      }
    );

    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [count, threshold]);

  const setStepRef = (index) => (el) => {
    refs.current[index] = el;
    if (el) el.dataset.stepIndex = String(index);
  };

  return { setStepRef, activeStep };
}
