"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ImageCubeGridProps {
  imageUrl: string;
  width: number;
  cubeSize?: number;
}

// Component to create a grid of smaller cubes from an image
function ImageCubeGrid({ imageUrl, width, cubeSize = 20 }: ImageCubeGridProps) {
  const [height, setHeight] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Calculate height based on image aspect ratio
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.height / img.width;
      setHeight(width * aspectRatio);
      setIsImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl, width]);

  const cols = Math.floor(width / cubeSize);
  const rows = Math.floor(height / cubeSize);

  const cubes = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cubes.push(
        <motion.div
          initial={{
            scale: 0,
            borderRadius: "10px",
          }}
          animate={{
            scale: 1,
            borderRadius: "0px",
          }}
          transition={{
            borderRadius: {
              delay: 0.5 + row * 0.1,
              duration: 1,
            },
            duration: 0.7,
            delay: row * 0.05,
          }}
          key={`${row}-${col}`}
          className="absolute"
          style={{
            width: `${cubeSize}px`,
            height: `${cubeSize}px`,
            left: `${col * cubeSize}px`,
            top: `${row * cubeSize}px`,
            backgroundColor: "var(--primary-300)",
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: `${cols * cubeSize}px ${rows * cubeSize}px`,
            backgroundPosition: `-${col * cubeSize}px -${row * cubeSize}px`,
          }}
        />
      );
    }
  }

  return (
    <div
      className="relative"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {cubes}
    </div>
  );
}

export default function Try() {
  const [cubeSize, setCubeSize] = useState(20);
  const [width, setWidth] = useState(300);

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center gap-8">
      <ImageCubeGrid imageUrl="/stock.jpeg" width={width} cubeSize={cubeSize} />
    </div>
  );
}
