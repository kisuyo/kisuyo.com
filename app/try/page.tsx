"use client";

import { useEffect, useRef, useState } from "react";

export default function Try() {
  const [dimensions, setDimensions] = useState({ columns: 0, rows: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateDimensions = () => {
      const columns = Math.floor(window.innerWidth / 50);
      const rows = Math.floor(window.innerHeight / 50);
      setDimensions({ columns, rows });
    };

    calculateDimensions();
    window.addEventListener("resize", calculateDimensions);

    return () => window.removeEventListener("resize", calculateDimensions);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty(
        "--columns",
        dimensions.columns.toString()
      );
      containerRef.current.style.setProperty(
        "--rows",
        dimensions.rows.toString()
      );
    }
  }, [dimensions]);

  const createTiles = () => {
    return Array.from({ length: dimensions.columns * dimensions.rows }).map(
      (_, index) => <div key={index} className="bg-red-500" />
    );
  };

  return (
    <div id="tile-container" ref={containerRef} className="">
      {createTiles()}
    </div>
  );
}
