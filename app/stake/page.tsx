"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { AnimatedCounter } from "../../components/AnimateCounter";

export default function Stake() {
  const stakes = [
    { small: 1, big: 2, buyIn: { min: 40, max: 200 } },
    { small: 2, big: 5, buyIn: { min: 100, max: 500 } },
    { small: 5, big: 10, buyIn: { min: 2000, max: 10000 } },
    { small: 10, big: 25, buyIn: { min: 5000, max: 25000 } },
    { small: 25, big: 50, buyIn: { min: 10000, max: 50000 } },
    { small: 50, big: 100, buyIn: { min: 20000, max: 100000 } },
    { small: 500, big: 1000, buyIn: { min: 200000, max: 1000000 } },
    { small: 5000, big: 10000, buyIn: { min: 2000000, max: 10000000 } },
  ];
  const [chosedStake, setChosedStake] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    const swipeThreshold = 30;

    if (Math.abs(diff) > swipeThreshold) {
      const swipeDistance = Math.abs(diff);
      const steps = Math.floor(swipeDistance / 50);
      const maxSteps = Math.max(1, steps);

      if (diff < 0) {
        const newStake = Math.min(chosedStake + maxSteps, stakes.length - 1);
        setChosedStake(newStake);
        touchStartX.current = touchEndX.current;
      } else if (diff > 0) {
        const newStake = Math.max(chosedStake - maxSteps, 0);
        setChosedStake(newStake);
        touchStartX.current = touchEndX.current;
      }
    }
  };

  const handleTouchEnd = () => {};

  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      touchEndX.current = e.clientX;
      const diff = touchStartX.current - touchEndX.current;
      const swipeThreshold = 30;

      if (Math.abs(diff) > swipeThreshold) {
        const swipeDistance = Math.abs(diff);
        const steps = Math.floor(swipeDistance / 50);
        const maxSteps = Math.max(1, steps);

        if (diff < 0) {
          const newStake = Math.min(chosedStake + maxSteps, stakes.length - 1);
          setChosedStake(newStake);
          touchStartX.current = touchEndX.current;
        } else if (diff > 0) {
          const newStake = Math.max(chosedStake - maxSteps, 0);
          setChosedStake(newStake);
          touchStartX.current = touchEndX.current;
        }
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {};
  return (
    <>
      <div className="w-full bg-[var(--secondary-900)]">
        <div
          className="max-w-[500px] mx-auto bg-[var(--secondary-900)] h-screen flex flex-col"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <motion.div
            animate={{
              y: [-300, 0],
            }}
            transition={{
              duration: 1,
              ease: "easeOut",
            }}
            className="h-[50%] flex justify-center items-between flex-col w-ful rounded-b-[50px]"
            style={{
              background: `radial-gradient(
              circle at 50% -100%,
              hsl(from var(--secondary-400) h s l / 1),
              hsl(from var(--secondary-500) h s l / 0.5)
            )
            padding-box`,
            }}
          >
            <motion.div
              animate={{
                opacity: [0, 1],
                filter: ["blur(10px)", "blur(0px)"],
              }}
              transition={{
                duration: 1,
                ease: "easeOut",
                delay: 1,
              }}
              className="  flex-1 flex items-center justify-center flex-col gap-8"
            >
              <div className="text-[var(--primary-200)] flex items-center justify-center flex-col text-[24px] leading-[1.2] text-center">
                <span className="font-medium">Stakes</span>
                <span className="text-[var(--primary-200)] text-[56px] font-bold flex items-center gap-2">
                  <AnimatedCounter
                    value={stakes[chosedStake].small}
                    duration={1.5}
                  />
                  /
                  <AnimatedCounter
                    value={stakes[chosedStake].big}
                    duration={1.5}
                  />
                </span>
              </div>
              <div className="text-[var(--primary-200)] flex items-center justify-center flex-col text-[24px] leading-[1.2] text-center">
                <span className="font-medium">Buy-in</span>
                <span className="text-[var(--primary-200)] text-[56px] font-bold flex items-center gap-2">
                  <AnimatedCounter
                    value={stakes[chosedStake].buyIn.min}
                    format="currency"
                    duration={1.5}
                  />
                  /
                  <AnimatedCounter
                    value={stakes[chosedStake].buyIn.max}
                    format="currency"
                    duration={1.5}
                  />
                </span>
              </div>

              <div className="text-[var(--primary-200)] text-center"></div>
            </motion.div>
            <motion.div
              animate={{
                opacity: [0, 1],
                filter: ["blur(10px)", "blur(0px)"],
              }}
              transition={{
                duration: 1,
                ease: "easeOut",
                delay: 1,
              }}
              className="flex justify-evenly items-end p-[20px] py-[40px] h-[100px]"
            >
              {stakes.map((stake, index) => {
                const distance = Math.abs(index - chosedStake);
                const opacity =
                  distance === 0
                    ? 1
                    : distance === 1
                    ? 0.6
                    : distance === 2
                    ? 0.3
                    : 0.1;

                return (
                  <motion.div
                    key={index}
                    className="w-[4px] bg-white rounded-full cursor-pointer"
                    animate={{
                      height: chosedStake === index ? "70px" : "50px",
                      opacity: opacity,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeInOut",
                    }}
                    onClick={() => setChosedStake(index)}
                  ></motion.div>
                );
              })}
            </motion.div>
          </motion.div>
          <div
            className="flex-1 w-[60%] text-center mx-auto flex items-center justify-center"
            style={{
              background: `linear-gradient(to bottom, var(--primary-200), transparent)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              opacity: 0.3,
            }}
          >
            Swipe your mouse or touch the screen to select your stake
          </div>
        </div>
      </div>
    </>
  );
}
