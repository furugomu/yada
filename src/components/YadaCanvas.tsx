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

function getColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue("--text").trim() || "#000";
}

function drawItem(
  ctx: CanvasRenderingContext2D,
  poolIndex: number,
  w: number,
  h: number,
  color: string,
) {
  const item = getItem(poolIndex);
  ctx.save();
  ctx.translate(item.xRatio * w, item.yRatio * h);
  ctx.rotate((item.rotation * Math.PI) / 180);
  ctx.globalAlpha = item.opacity;
  ctx.font = `${item.size}px sans-serif`;
  ctx.fillStyle = color;
  ctx.fillText("やだ！", 0, 0);
  ctx.restore();
}

const EXISTING_CAP = 1000;

export function YadaCanvas({ existingCount, newCount }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLCanvasElement | null>(null);

  // Use refs so draw functions always see current values without stale closures
  const stableCountRef = useRef(0);
  const newCountRef = useRef(0);
  stableCountRef.current = Math.min(existingCount, EXISTING_CAP);
  newCountRef.current = newCount;

  const rebuildBg = (w: number, h: number) => {
    if (!bgRef.current) bgRef.current = document.createElement("canvas");
    const bg = bgRef.current;
    bg.width = w;
    bg.height = h;
    const ctx = bg.getContext("2d");
    if (!ctx) return;
    const color = getColor();
    for (let i = 0; i < stableCountRef.current; i++) {
      drawItem(ctx, i, w, h, color);
    }
  };

  const redrawMain = (w: number, h: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (bgRef.current) ctx.drawImage(bgRef.current, 0, 0);
    const color = getColor();
    for (let i = 0; i < newCountRef.current; i++) {
      drawItem(ctx, EXISTING_CAP + i, w, h, color);
    }
  };

  // Rebuild background + redraw main when existing (server-confirmed) count changes
  const stableCount = Math.min(existingCount, EXISTING_CAP);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    rebuildBg(w, h);
    redrawMain(w, h);
  }, [stableCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Only redraw main (bg is cached) when new clicks come in — fast path
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    redrawMain(canvas.offsetWidth, canvas.offsetHeight);
  }, [newCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // On resize: rebuild bg and redraw main. Set up once; uses refs for current counts.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      rebuildBg(w, h);
      redrawMain(w, h);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
