"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export default function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <motion.div
      animate={{ opacity: [0, 1], scale: [0.95, 1] }}
      transition={{ duration: 0.45, ease: [0.35, 0.1, 0.55, 1.0] }}
    >
      <div
        className={`glass-card h-fit w-full max-w-2xl rounded-3xl border border-white/70 bg-white/80 p-8 text-slate-900 shadow-xl shadow-rose-100/50 backdrop-blur-lg ${className}`}
      >
        {children}
      </div>
    </motion.div>
  );
}
