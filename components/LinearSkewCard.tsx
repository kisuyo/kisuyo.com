import { motion } from "framer-motion";
import { useState } from "react";

export default function LinearSkewCard() {
  const [threads, setThreads] = useState([
    {
      title: "React Performance Optimization",
      preview: "How can I optimize React components for better performance?",
      date: "Nov 1",
    },
    {
      title: "TypeScript Advanced Patterns",
      preview: "Explain generics and conditional types in TypeScript...",
      date: "Oct 24",
    },
    {
      title: "Next.js App Router",
      preview: "What are the differences between Pages and App Router?",
      date: "Sep 15",
    },
  ]);

  const handleThreadClick = (threadIndex: number) => {
    // Move clicked thread to the top
    const clickedThread = threads[threadIndex];
    const newThreads = [
      clickedThread,
      ...threads.filter((_, idx) => idx !== threadIndex),
    ];
    setThreads(newThreads);
  };

  return (
    <div className="w-[400px] relative h-[400px] border border-slate-400/30 rounded-md bg-white overflow-hidden flex items-center justify-center">
      <div className="relative w-full flex translate-y-[25%] h-full">
        {threads.slice(0, 3).map((thread, index) => {
          const isMiddleCard = index === 1;

          return (
            <motion.div
              key={thread.title}
              initial={{
                skewX: "0deg",
                skewY: "-14deg",
                scale: 1 - (threads.length - 1 - index) * 0.05,
                opacity: 1 - (threads.length - 1 - index) * 0.22,
                translateX: `${index * 54}px`,
                translateY: "0px",
              }}
              animate={
                isMiddleCard
                  ? {
                      translateY: ["0px", "-50px", "-50px", "0px", "0px"],
                    }
                  : {}
              }
              style={{
                position: "absolute",
                perspective: "1000px",
                top: `${index * 25}px`,
                zIndex: threads.length + index,
              }}
              transition={
                isMiddleCard
                  ? {
                      duration: 7, // Total cycle: 7 seconds (1s up + 2s wait + 1s down + 3s wait)
                      repeat: Infinity,
                      ease: "easeInOut",
                      times: [0, 1 / 7, 3 / 7, 4 / 7, 1], // 1s up, 2s wait at top, 1s down, 3s wait at bottom
                    }
                  : {
                      easings: "cubic-bezier(.77, 0, .175, 1)",
                      duration: 0.4,
                    }
              }
              onClick={() => handleThreadClick(index)}
              className="group cursor-pointer h-[120px] flex flex-col justify-between w-full ml-[10px] glass-card drop-shadow-lg p-3 rounded-[11px]"
            >
              <div
                className={`opacity-60 tracking-wider group-hover:opacity-100 group-hover:text-green-600/80 font-semibold text-sm duration-500 transition-all truncate`}
              >
                {thread.title}
              </div>
              <div className="text-xs tracking-wide opacity-40 line-clamp-2 group-hover:opacity-60 transition-opacity duration-500">
                {thread.preview}
              </div>
              <div className="opacity-60 text-[11px] font-light">
                {thread.date}
              </div>
            </motion.div>
          );
        })}
      </div>
      <div
        className="absolute top-0 right-0 w-[50%] h-full pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(255,255,255,1) 100%)",
        }}
      ></div>
    </div>
  );
}
