"use client";

import { useEffect, useRef } from "react";

const GRID_SIZE = 400; // core square size in px
const CELLS_PER_SIDE = 40; // 40 x 40 cells inside the core square
const CELL_SIZE = GRID_SIZE / CELLS_PER_SIDE;
const FADE_MARGIN = 4; // extra rings of cells for the smoothing halo
const TOTAL_CELLS_PER_SIDE = CELLS_PER_SIDE + FADE_MARGIN * 2;
const TOTAL_WIDTH = TOTAL_CELLS_PER_SIDE * CELL_SIZE;
const IMAGE_SOURCE = "/stock.jpeg";

type CellSample = {
  color: string;
  opacity: number;
  radius: number;
  x: number;
  y: number;
};

const potencyScore = (r: number, g: number, b: number, a: number) => {
  const alpha = a / 255;
  return alpha * (r * r + g * g + b * b);
};

const computeRadiusRatio = (r: number, g: number, b: number, a: number) => {
  const alpha = a / 255;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return Math.min(1, Math.max(0, luminance * alpha));
};

const buildCells = (samplerCtx: CanvasRenderingContext2D): CellSample[] => {
  const cells: CellSample[] = [];

  for (let row = -FADE_MARGIN; row < CELLS_PER_SIDE + FADE_MARGIN; row++) {
    for (let col = -FADE_MARGIN; col < CELLS_PER_SIDE + FADE_MARGIN; col++) {
      const sampleCol = Math.min(Math.max(col, 0), CELLS_PER_SIDE - 1);
      const sampleRow = Math.min(Math.max(row, 0), CELLS_PER_SIDE - 1);
      const data = samplerCtx.getImageData(
        sampleCol * CELL_SIZE,
        sampleRow * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      ).data;

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
      const a = data[bestIndex + 3];
      const radiusRatio = computeRadiusRatio(r, g, b, a);
      const color = `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;

      const halfSpan = CELLS_PER_SIDE / 2;
      const fadeDistance = Math.max(
        Math.abs(col + 0.5 - halfSpan),
        Math.abs(row + 0.5 - halfSpan)
      ) - halfSpan;
      const fadeRatio = fadeDistance > 0 ? Math.max(0, 1 - fadeDistance / FADE_MARGIN) : 1;
      const opacity = radiusRatio === 0 ? 0 : Math.max(0, Math.min(1, fadeRatio));

      const displayCol = col + FADE_MARGIN;
      const displayRow = row + FADE_MARGIN;
      const centerX = displayCol * CELL_SIZE + CELL_SIZE / 2;
      const centerY = displayRow * CELL_SIZE + CELL_SIZE / 2;
      const radius = (CELL_SIZE * radiusRatio) / 2;

      cells.push({ color, opacity, radius, x: centerX, y: centerY });
    }
  }

  return cells;
};

const drawCells = (ctx: CanvasRenderingContext2D, cells: CellSample[]) => {
  ctx.clearRect(0, 0, TOTAL_WIDTH, TOTAL_WIDTH);
  cells.forEach((cell) => {
    if (cell.radius <= 0 || cell.opacity <= 0) return;
    ctx.globalAlpha = cell.opacity;
    ctx.fillStyle = cell.color;
    ctx.beginPath();
    ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
};

export default function Halftone() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const displayCanvas = canvasRef.current;
    if (!displayCanvas) return;

    const sampler = document.createElement("canvas");
    sampler.width = GRID_SIZE;
    sampler.height = GRID_SIZE;
    const samplerCtx = sampler.getContext("2d");
    const displayCtx = displayCanvas.getContext("2d");

    if (!samplerCtx || !displayCtx) return;

    let disposed = false;
    const img = new Image();
    img.src = IMAGE_SOURCE;
    img.crossOrigin = "anonymous";

    const handleLoad = () => {
      if (disposed) return;

      samplerCtx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);

      const scale = Math.max(GRID_SIZE / img.width, GRID_SIZE / img.height);
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      const offsetX = (GRID_SIZE - drawWidth) / 2;
      const offsetY = (GRID_SIZE - drawHeight) / 2;

      samplerCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      const cells = buildCells(samplerCtx);

      const dpr = window.devicePixelRatio ?? 1;
      displayCanvas.width = TOTAL_WIDTH * dpr;
      displayCanvas.height = TOTAL_WIDTH * dpr;
      displayCanvas.style.width = `${TOTAL_WIDTH}px`;
      displayCanvas.style.height = `${TOTAL_WIDTH}px`;
      displayCtx.setTransform(1, 0, 0, 1, 0, 0);
      displayCtx.scale(dpr, dpr);

      drawCells(displayCtx, cells);
    };

    img.addEventListener("load", handleLoad);
    return () => {
      disposed = true;
      img.removeEventListener("load", handleLoad);
    };
  }, []);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black">
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${IMAGE_SOURCE})` }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 to-black/90" />

      <canvas
        ref={canvasRef}
        className="relative"
        style={{ width: `${TOTAL_WIDTH}px`, height: `${TOTAL_WIDTH}px` }}
      />
    </div>
  );
}
