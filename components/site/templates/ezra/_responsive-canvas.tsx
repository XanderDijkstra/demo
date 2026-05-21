"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
}

/**
 * Scales a fixed-width Framer canvas to fill the viewport horizontally.
 *
 * Framer's exported variants ship with hardcoded pixel widths
 * (Desktop=1400, Tablet=768, Phone=200). This wrapper:
 *   1. Measures the intrinsic width via scrollWidth (transform-agnostic).
 *   2. Computes scale = viewport / intrinsic.
 *   3. Applies transform: scale() with origin top-left.
 *   4. Sets the outer wrapper's height to the *scaled* inner height so
 *      following sections don't overlap.
 *
 * Re-measures on window resize and when the child content changes size
 * (ResizeObserver), via requestAnimationFrame to coalesce.
 */
export function ResponsiveCanvas({ children }: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<{ scale: number; height: number }>({
    scale: 1,
    height: 0,
  });

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;

    let rafId = 0;

    function update() {
      rafId = 0;
      if (!inner) return;
      const intrinsicWidth = inner.scrollWidth;
      const intrinsicHeight = inner.scrollHeight;
      const viewport = window.innerWidth;
      if (intrinsicWidth <= 0) return;
      const nextScale = viewport / intrinsicWidth;
      const nextHeight = intrinsicHeight * nextScale;
      setMetrics((prev) =>
        Math.abs(prev.scale - nextScale) < 0.0005 &&
        Math.abs(prev.height - nextHeight) < 0.5
          ? prev
          : { scale: nextScale, height: nextHeight }
      );
    }

    function schedule() {
      if (rafId) return;
      rafId = requestAnimationFrame(update);
    }

    update();

    const ro = new ResizeObserver(schedule);
    ro.observe(inner);
    window.addEventListener("resize", schedule);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: metrics.height || undefined,
        overflow: "hidden",
      }}
    >
      <div
        ref={innerRef}
        style={{
          width: "fit-content",
          transform: `scale(${metrics.scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
