"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
}

/**
 * Fits a fixed-width Framer canvas inside the viewport without
 * upscaling. Framer's exported variants ship with hardcoded pixel
 * widths (Desktop=1400, Tablet=768, Phone=200). On viewports wider
 * than the canvas we just center the native design — upscaling looks
 * chunky. On narrower viewports we scale down so nothing overflows.
 *
 * Measures the intrinsic scrollWidth/scrollHeight (transform-agnostic)
 * via ResizeObserver, applies transform: scale() with origin top-
 * center, and sets the wrapper height to the scaled height so
 * following sections don't overlap.
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
      // Never upscale — capped at 1. Wide screens see the design centered
      // at its native canvas width; narrow screens scale it down to fit.
      const nextScale = Math.min(1, viewport / intrinsicWidth);
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
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        ref={innerRef}
        style={{
          width: "fit-content",
          transform: `scale(${metrics.scale})`,
          transformOrigin: "top center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
