import { motion, useAnimate } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export default function FramerMotionLayout() {
  const [currentCase, setCurrentCase] = useState(1);
  const [prevCase, setPrevCase] = useState(currentCase);
  const [scope, animate] = useAnimate();

  const handleAnimate = async () => {
    await animate(
      `#case-${currentCase}`,
      { opacity: [0, 1] },
      { duration: 0.5, delay: 0.5 }
    );
  };

  useEffect(() => {
    handleAnimate();
    console.log(prevCase, currentCase);
  }, [currentCase]);

  return (
    <div ref={scope}>
      <div className="flex gap-2">
        <button
          onClick={() => {
            setPrevCase(currentCase);
            setCurrentCase(1);
          }}
        >
          Case 1
        </button>
        <button
          onClick={() => {
            setPrevCase(currentCase);
            setCurrentCase(2);
          }}
        >
          Case 2
        </button>
        <button
          onClick={() => {
            setPrevCase(currentCase);
            setCurrentCase(3);
          }}
        >
          Case 3
        </button>
      </div>
      <div className="absolute bottom-0 left-[50%] -translate-x-[50%]">
        <motion.div
          layoutId="container"
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="bg-black text-white w-[300px] rounded-t-xl p-4  "
        >
          <div className="relative">
            {currentCase === 1 && <div id="case-1">CaseOne</div>}
            {currentCase === 2 && (
              <div id="case-2" className="flex flex-col gap-2">
                2 lorem ipsum dolor sit amet{" "}
                <div className="px-4 w-full bg-violet-500 rounded-lg">
                  button
                </div>
              </div>
            )}
            {currentCase === 3 && (
              <div id="case-3" className="w-full ">
                3 lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem
                ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum
                dolor sit amet lorem ipsum
                <div className="px-4 w-full"></div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
