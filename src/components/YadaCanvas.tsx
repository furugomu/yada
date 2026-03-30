import { useEffect, useRef } from "react";

interface Props {
  totalCount: number;
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

const MAX_COUNT = 1000;
const items: YadaItem[] = (() => {
  const rand = seededRandom(42);
  return Array.from({ length: MAX_COUNT }, () => ({
    xRatio: rand(),
    yRatio: rand(),
    size: 12 + rand() * 20,
    rotation: (rand() - 0.5) * 60,
    opacity: 0.1 + rand() * 0.3,
  }));
})();

export function YadaCanvas({ totalCount }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawCount = Math.min(totalCount, MAX_COUNT);

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

      for (let i = 0; i < drawCount; i++) {
        const item = items[i];
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
  }, [drawCount]);

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
