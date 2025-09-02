"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  startFrom?: number;
  format?: "number" | "currency";
}

export const AnimatedCounter = ({
  value,
  duration = 0.5,
  startFrom,
  format = "number",
}: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(startFrom || value);

  useEffect(() => {
    const startValue = startFrom !== undefined ? startFrom : displayValue;
    const endValue = value;

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, startFrom]);

  const formatValue = (val: number) => {
    const formatNumber = (num: number) => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(0) + "M";
      } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + "k";
      }
      return num.toFixed(0);
    };

    if (format === "currency") {
      return `$${formatNumber(val)}`;
    }
    return formatNumber(val);
  };

  return (
    <motion.span
      key={displayValue}
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
    >
      {formatValue(displayValue)}
    </motion.span>
  );
};
