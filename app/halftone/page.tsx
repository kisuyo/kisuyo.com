"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const GRID_SIZE = 400;
const CELLS_PER_SIDE = 40; // double the prior 20x20 density
const CELL_SIZE = GRID_SIZE / CELLS_PER_SIDE;
const TOTAL_CELLS = CELLS_PER_SIDE * CELLS_PER_SIDE;
const IMAGE_SOURCE = "/stock.jpeg";

type CellSample = {
  color: string;
  radiusRatio: number; // 0 - invisible, 1 - fills the entire cell
};

const getInitialCells = (): CellSample[] =>
  Array.from({ length: TOTAL_CELLS }, () => ({
    color: "rgba(255, 255, 255, 0.08)",
    radiusRatio: 0,
  }));

const potencyScore = (r: number, g: number, b: number, a: number) => {
  const alpha = a / 255;
  // weight saturated, bright colors slightly higher than dull tones
  return alpha * (r * r + g * g + b * b);
};

export default function Halftone() {
  const [cells, setCells] = useState<CellSample[]>(() => getInitialCells());
  const [isReady, setIsReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = IMAGE_SOURCE;
    img.crossOrigin = "anonymous";

    const handleLoad = () => {
      canvas.width = GRID_SIZE;
      canvas.height = GRID_SIZE;

      // scale image so it covers the square without stretching
      const scale = Math.max(GRID_SIZE / img.width, GRID_SIZE / img.height);
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      const offsetX = (GRID_SIZE - drawWidth) / 2;
      const offsetY = (GRID_SIZE - drawHeight) / 2;

      ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      const nextCells: CellSample[] = [];

      for (let row = 0; row < CELLS_PER_SIDE; row++) {
        for (let col = 0; col < CELLS_PER_SIDE; col++) {
          const x = col * CELL_SIZE;
          const y = row * CELL_SIZE;
          const data = ctx.getImageData(x, y, CELL_SIZE, CELL_SIZE).data;
          let bestIndex = 0;
          let bestScore = -1;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            const score = potencyScore(r, g, b, a);

            if (score > bestScore) {
              bestScore = score;
              bestIndex = i;
            }
          }

          const r = data[bestIndex];
          const g = data[bestIndex + 1];
          const b = data[bestIndex + 2];
          const alpha = data[bestIndex + 3] / 255;
          const color = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;

          // luminance weighted brightness scaled by alpha for smoother fades
          const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          const radiusRatio = Math.min(1, Math.max(0, luminance * alpha));
          nextCells.push({ color, radiusRatio });
        }
      }

      setCells(nextCells);
      setIsReady(true);
    };

    img.addEventListener("load", handleLoad);
    return () => {
      img.removeEventListener("load", handleLoad);
    };
  }, []);

  const gridTemplateStyle = useMemo(() => ({
    width: `${GRID_SIZE}px`,
    height: `${GRID_SIZE}px`,
    gridTemplateColumns: `repeat(${CELLS_PER_SIDE}, ${CELL_SIZE}px)`,
    gridTemplateRows: `repeat(${CELLS_PER_SIDE}, ${CELL_SIZE}px)`,
  }), []);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${IMAGE_SOURCE})` }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 to-black/90" />

      <div className="relative flex flex-col items-center gap-6">
        <div className="text-center space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Halftone Sampler</p>
          <p className="text-base text-slate-400 max-w-md">
            A 400 x 400 halftone grid now subdivided into 40 x 40 cells, sampling the punchiest pixel in every block and scaling the ball size based on how bright that tone is.
          </p>
        </div>

        <div
          className="grid rounded-[24px] border border-white/10 p-2 shadow-2xl shadow-black/60 backdrop-blur"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        >
          <div
            className="grid overflow-hidden rounded-[16px] border border-white/20"
            style={gridTemplateStyle}
          >
            {cells.map((cell, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center"
                style={{ width: "100%", height: "100%" }}
              >
                <span
                  className="transition-all duration-500 ease-out"
                  style={{
                    width: `${CELL_SIZE * cell.radiusRatio}px`,
                    height: `${CELL_SIZE * cell.radiusRatio}px`,
                    borderRadius: "9999px",
                    backgroundColor: cell.color,
                    opacity: cell.radiusRatio === 0 ? 0 : 1,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {!isReady && (
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Processing image…</p>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
