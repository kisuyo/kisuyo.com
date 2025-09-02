"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function BoxGrid() {
  const gridSize = 9; // Change this number to adjust grid size (e.g., 5 for 5x5, 8 for 8x8)
  const totalBoxes = gridSize * gridSize;
  const boxes = Array.from({ length: totalBoxes }, (_, i) => i);
  const [hoveredBox, setHoveredBox] = useState<number | null>(null);

  const getBlueRingColor = (boxIndex: number) => {
    if (hoveredBox === null) return "var(--secondary-900)";

    const hoveredCol = hoveredBox % gridSize;
    const hoveredRow = Math.floor(hoveredBox / gridSize);
    const boxCol = boxIndex % gridSize;
    const boxRow = Math.floor(boxIndex / gridSize);

    const distance = Math.max(
      Math.abs(hoveredCol - boxCol),
      Math.abs(hoveredRow - boxRow)
    );

    // Static blue ring scheme
    if (distance === 0) return "#1e40af"; // Deep blue - center
    if (distance === 1) return "#1d4ed8"; // Medium blue - inner ring
    if (distance === 2) return "#3b82f6"; // Light blue - outer ring
    return "var(--secondary-900)"; // Default
  };

  const getTranslateY = (boxIndex: number) => {
    if (hoveredBox === null) return 0;

    const hoveredCol = hoveredBox % gridSize;
    const hoveredRow = Math.floor(hoveredBox / gridSize);
    const boxCol = boxIndex % gridSize;
    const boxRow = Math.floor(boxIndex / gridSize);

    const distance = Math.max(
      Math.abs(hoveredCol - boxCol),
      Math.abs(hoveredRow - boxRow)
    );

    if (distance === 0) return 20; // Center box - most translation
    if (distance === 1) return 10; // Inner ring - medium translation
    if (distance === 2) return 5; // Outer ring - small translation
    return 0; // No translation
  };

  return (
    <div className="w-screen h-screen bg-[var(--secondary-900)] text-[var(--secondary-100)] flex items-center justify-center">
      <div
        className={`grid relative w-[100px] h-[100px]`}
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {boxes.map((index) => {
          const col = index % gridSize;
          const row = Math.floor(index / gridSize);
          return (
            <Box
              key={index}
              col={col}
              row={row}
              index={index}
              onHover={() => setHoveredBox(index)}
              onLeave={() => setHoveredBox(null)}
              color={getBlueRingColor(index)}
              translateY={getTranslateY(index)}
            />
          );
        })}
      </div>
    </div>
  );
}

const Box = ({
  col,
  row,
  index,
  onHover,
  onLeave,
  color,
  translateY,
}: {
  col: number;
  row: number;
  index: number;
  onHover: () => void;
  onLeave: () => void;
  color: string;
  translateY: number;
}) => {
  return (
    <motion.div
      className="absolute flex items-center justify-center cursor-pointer"
      style={{
        perspective: "1000px",
        perspectiveOrigin: "center center",
        top: `${row * 26 - col * -26 - 200}px`,
        left: `${col * 50 + row * -50}px`,
        zIndex: index,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      whileHover={{ scale: 1.05 }}
      animate={{ y: translateY }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <div
        className="relative"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(-25deg) rotateY(-45deg)",
        }}
      >
        {/* Front face */}
        <motion.div
          className="absolute w-[50px] h-[80px] border-2 border-white"
          style={{
            transform: "",
            left: "0px",
            top: "50px",
            backgroundColor: color,
          }}
          animate={{ backgroundColor: color }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />

        {/* Top face */}
        <motion.div
          className="absolute w-[50px] h-[50px] border-2 border-white"
          style={{
            transform: "rotateX(90deg) translateZ(0px)",
            transformOrigin: "bottom",
            left: "0px",
            top: "0px",
            backgroundColor: color,
          }}
          animate={{ backgroundColor: color }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />

        {/* Right face */}
        <motion.div
          className="absolute w-[50px] h-[80px] border-2 border-white"
          style={{
            transform: "rotateY(90deg)",
            transformOrigin: "left",
            left: "50px",
            top: "50px",
            backgroundColor: color,
          }}
          animate={{ backgroundColor: color }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
};
