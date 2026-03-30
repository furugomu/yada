import { useEffect, useRef } from "react";

interface Props {
  existingCount: number;
  newCount: number;
}

interface YadaItem {
  xRatio: number;
  yRatio: number;
  size: number;
  rotation: number;
  opacity: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = Math.imul(s, 1664525) + 1013904223;
    return (s >>> 0) / 0xffffffff;
  };
}

// Lazily-grown pool of pre-generated positions (stable across re-renders)
const pool: YadaItem[] = [];

function getItem(index: number): YadaItem {
  while (pool.length <= index) {
    const rand = seededRandom(pool.length * 2654435761 + 1);
    pool.push({
      xRatio: rand(),
      yRatio: rand(),
      size: 12 + rand() * 20,
      rotation: (rand() - 0.5) * 60,
      opacity: 0.1 + rand() * 0.3,
    });
  }
  return pool[index];
}

const EXISTING_CAP = 1000;

export function YadaCanvas({ existingCount, newCount }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stableCount = Math.min(existingCount, EXISTING_CAP);
  const totalDraw = stableCount + newCount;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const color =
        getComputedStyle(document.documentElement).getPropertyValue("--text").trim() || "#000";

      for (let i = 0; i < totalDraw; i++) {
        // Existing items: indices 0..(stableCount-1)
        // New items: indices EXISTING_CAP..(EXISTING_CAP+newCount-1)
        const poolIndex = i < stableCount ? i : EXISTING_CAP + (i - stableCount);
        const item = getItem(poolIndex);
        const x = item.xRatio * canvas.width;
        const y = item.yRatio * canvas.height;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.globalAlpha = item.opacity;
        ctx.font = `${item.size}px sans-serif`;
        ctx.fillStyle = color;
        ctx.fillText("やだ！", 0, 0);
        ctx.restore();
      }
    };

    draw();

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [stableCount, totalDraw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
