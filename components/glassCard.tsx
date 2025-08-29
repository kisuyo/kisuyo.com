import { motion } from "framer-motion";

export default function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      animate={{ opacity: [0, 1], scale: [0.9, 1] }}
      transition={{ duration: 0.4, ease: [0.35, 0.1, 0.55, 1.0] }}
    >
      <div className="glass-card z-[100] w-[400px] p-6 h-fit bg-white/10 rounded-2xl">
        {children}
      </div>
    </motion.div>
  );
}
