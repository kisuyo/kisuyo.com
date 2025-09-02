"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function BoxGrid() {
  const boxes = Array.from({ length: 49 }, (_, i) => i);
  const [clickedBox, setClickedBox] = useState<number | null>(null);
  const [pingProgress, setPingProgress] = useState<number>(0);
  const [isPinging, setIsPinging] = useState<boolean>(false);

  const handleBoxClick = (boxIndex: number) => {
    setClickedBox(boxIndex);
    setIsPinging(true);
    setPingProgress(0);

    // Animate ping from 0 to 7 (max distance)
    const pingDuration = 1000; // 1 second
    const startTime = Date.now();

    const animatePing = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / pingDuration, 1);
      setPingProgress(progress * 7); // 0 to 7

      if (progress < 1) {
        requestAnimationFrame(animatePing);
      } else {
        setIsPinging(false);
      }
    };

    requestAnimationFrame(animatePing);
  };

  const getSonarColor = (boxIndex: number) => {
    if (clickedBox === null) return "var(--secondary-900)";

    const clickedCol = clickedBox % 7;
    const clickedRow = Math.floor(clickedBox / 7);
    const boxCol = boxIndex % 7;
    const boxRow = Math.floor(boxIndex / 7);

    const distance = Math.max(
      Math.abs(clickedCol - boxCol),
      Math.abs(clickedRow - boxRow)
    );

    // During ping animation
    if (isPinging) {
      const pingDistance = Math.abs(distance - pingProgress);
      if (pingDistance <= 0.5) {
        return "#3b82f6"; // Blue during ping
      }
      return "var(--secondary-900)";
    }

    // After ping completes - static blue scheme
    if (distance === 0) return "#1e40af"; // Deep blue - center
    if (distance === 1) return "#1d4ed8"; // Medium blue - inner ring
    if (distance === 2) return "#3b82f6"; // Light blue - outer ring
    return "var(--secondary-900)"; // Default
  };

  const getTranslateY = (boxIndex: number) => {
    if (clickedBox === null) return 0;

    const clickedCol = clickedBox % 7;
    const clickedRow = Math.floor(clickedBox / 7);
    const boxCol = boxIndex % 7;
    const boxRow = Math.floor(boxIndex / 7);

    const distance = Math.max(
      Math.abs(clickedCol - boxCol),
      Math.abs(clickedRow - boxRow)
    );

    if (distance === 0) return 20; // Center box - most translation
    if (distance === 1) return 10; // Inner ring - medium translation
    if (distance === 2) return 5; // Outer ring - small translation
    return 0; // No translation
  };

  return (
    <div className="w-screen h-screen bg-[var(--secondary-900)] text-[var(--secondary-100)] flex items-center justify-center">
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
              onClick={() => handleBoxClick(index)}
              color={getSonarColor(index)}
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
  onClick,
  color,
  translateY,
}: {
  col: number;
  row: number;
  index: number;
  onClick: () => void;
  color: string;
  translateY: number;
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
