"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function HeatMapBoxGrid() {
  const boxes = Array.from({ length: 49 }, (_, i) => i);
  const [clickedBox, setClickedBox] = useState<number | null>(null);

  const getHeatMapColor = (boxIndex: number) => {
    if (clickedBox === null) return "var(--secondary-900)";

    const clickedCol = clickedBox % 7;
    const clickedRow = Math.floor(clickedBox / 7);
    const boxCol = boxIndex % 7;
    const boxRow = Math.floor(boxIndex / 7);

    const distance = Math.max(
      Math.abs(clickedCol - boxCol),
      Math.abs(clickedRow - boxRow)
    );

    if (distance === 0) return "#ef4444"; // Red - center
    if (distance === 1) return "#eab308"; // Yellow - inner ring
    if (distance === 2) return "#22c55e"; // Green - outer ring
    return "var(--secondary-900)"; // Default
  };

  return (
    <div className="w-full h-full bg-[var(--secondary-900)] text-[var(--secondary-100)] flex items-center justify-center">
      <div className="grid grid-cols-7 relative w-[100px] h-[100px]">
        {boxes.map((index) => {
          const col = index % 7;
          const row = Math.floor(index / 7);
          return (
            <Box
              key={index}
              col={col}
              row={row}
              index={index}
              onClick={() => setClickedBox(index)}
              color={getHeatMapColor(index)}
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
  onClick,
  color,
}: {
  col: number;
  row: number;
  index: number;
  onClick: () => void;
  color: string;
}) => {
  return (
    <motion.div
      className="absolute flex items-center justify-center cursor-pointer"
      style={{
        perspective: "1000px",
        perspectiveOrigin: "center center",
        top: `${row * 26 - col * -26}px`,
        left: `${col * 50 + row * -50}px`,
        zIndex: index,
      }}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
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
