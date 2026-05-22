"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
}

/**
 * Fits a fixed-width Framer canvas inside the viewport.
 *
 * Framer's exported variants ship with hardcoded pixel widths
 * (Desktop=1400, Tablet=768, Phone≈200). Each is designed at a
 * different "natural" rendering width, so we apply different scaling
 * rules per breakpoint, detected from the measured intrinsic width:
 *
 *   - intrinsic ≥ 1200 → Desktop variant. Cap scale at 1.0 — its
 *     1400px native size is the intended display size; upscaling
 *     makes fonts look chunky on wide monitors.
 *   - 700 ≤ intrinsic < 1200 → Tablet variant. Cap at 1.4 — small
 *     upscale OK to fill tablet/laptop viewports without distortion.
 *   - intrinsic < 700 → Phone variant. No cap — the 200px canvas is
 *     clearly meant to be upscaled to viewport width on real phones.
 *
 * Always scales DOWN if viewport is narrower than the canvas.
 * Re-measures via ResizeObserver and on window resize.
 */
function computeScale(intrinsicWidth: number, viewportWidth: number): number {
  if (intrinsicWidth <= 0) return 1;
  const ratio = viewportWidth / intrinsicWidth;
  if (intrinsicWidth >= 1200) return Math.min(1, ratio);
  if (intrinsicWidth >= 700) return Math.min(1.4, ratio);
  return ratio;
}

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
      const nextScale = computeScale(intrinsicWidth, viewport);
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
