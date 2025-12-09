"use client";

import { motion, useDragControls } from "framer-motion";
import { useRef } from "react";

export default function Bezier() {
  const constraintRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const hoverRef = useRef<HTMLDivElement>(null);

  function startDrag(event: any) {
    // Start the drag gesture imperatively
    console.log("startDrag");
    dragControls.start(event, { snapToCursor: true });
  }
  function endDrag(event: any) {
    console.log("endDrag");
    dragControls.start(event, { snapToCursor: false });
  }

  const ball = "w-[40px] h-[40px] bg-white rounded-full";
  return (
    <div className="w-full h-screen poppins grid grid-cols-3 grid-rows-3">
      <div className="flex items-center flex-col gap-8 justify-center ">
        <div className="flex items-center gap-8">
          <motion.div
            animate={{
              y: [0, 10, -50, 0, -10, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              times: [0, 0.1, 0.4, 0.7, 0.8, 0.9, 1],
            }}
            className={ball}
          ></motion.div>
          <motion.div
            initial={{ scale: 1 }}
            animate={{
              y: [0, -50],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              type: "spring",
            }}
            className={ball}
          ></motion.div>
        </div>

        <h1>1. Anticipation</h1>
      </div>
      <div className="flex items-center flex-col gap-8 justify-center ">
        <motion.div className="flex items-center bg-red-500 z-[100] relative  gap-8   rounded-lg justify-center px-4 p-2">
          <motion.div
            ref={constraintRef}
            onHoverStart={startDrag}
            onHoverEnd={endDrag}
            className="absolute bg-white/20 rounded-md w-full h-full z-[100]"
          ></motion.div>
          {/* <motion.div
            drag
            dragControls={dragControls}
            dragConstraints={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            dragElastic={0.05}
            className="absolute bg-white rounded-md w-full h-full"
          ></motion.div> */}
          <motion.div
            drag
            dragControls={dragControls}
            dragConstraints={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            dragElastic={0.05}
            whileDrag={{
              scale: 1.1,
            }}
            className=" relative z-10"
          >
            Hello World!
          </motion.div>
        </motion.div>

        <h1>2. Hover Constraint</h1>
      </div>
    </div>
  );
}
