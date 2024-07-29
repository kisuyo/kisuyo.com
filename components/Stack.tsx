import { motion } from "framer-motion";
import Icons from "./Icons";

export default function Stack(props: { scrollPointReached: number }) {
  const StackVariants = {
    expanded: { height: "400px" },
    closed: { height: "0px" },
  };
  return (
    <motion.div
      variants={StackVariants}
      layout
      initial={"closed"}
      transition={{ duration: 0.8, easings: "ease-out" }}
      animate={3 <= props.scrollPointReached ? "expanded" : "closed"}
      className="w-full h-full flex md:flex-row flex-col gap-[20px] overflow-hidden"
    >
      <div className="w-full h-full flex flex-col gap-[20px]">
        <div className="bg-[#0e0e0e] rounded-[20px] md:h-1/2 h-[100px] flex items-center p-[30px] gap-[20px]">
          <Icons name="Tailwind" size={["50px", "50px"]} />
          <Icons name="React" size={["50px", "50px"]} />
          <Icons name="SolidJS" size={["50px", "50px"]} />
        </div>
        <div className="bg-[#0e0e0e] rounded-[20px] md:h-1/2 h-[100px] font-bold text-white/30  flex items-center justify-evenly">
          <a
            href="https://github.com/Kisuyo"
            target="_blank"
            className="hover:text-white/40 cursor-pointer transition-all"
          >
            Github
          </a>
          <a
            href="https://www.instagram.com/kisuyot_t/"
            target="_blank"
            className="hover:text-white/40 cursor-pointer transition-all"
          >
            Instagram
          </a>
          <a
            href="https://x.com/KisuyoTT"
            target="_blank"
            className="hover:text-white/40 cursor-pointer transition-all"
          >
            Twitter
          </a>
        </div>
      </div>
      <div className="w-full h-full bg-[#0e0e0e] p-2 rounded-[20px] flex justify-between flex-col">
        <a
          href="https://github.com/learn-anything/learn-anything.xyz"
          target="_blank"
          className="flex items-center font-light w-full gap-4 hover:bg-[#121212] transition-all p-2 rounded-md cursor-pointer"
        >
          <div className="min-w-[100px] h-[100px] bg-[#171717] overflow-hidden flex items-center justify-center object-cover rounded-md">
            <img
              src="/LALogo.png"
              alt="Learn Anything"
              className="w-[100px] h-[100px]"
            />
          </div>
          <div className="text-white/60 pr-[50px] ">
            <div className="text-[20px] font-bold text-white">
              Learn Anything
            </div>
            It is a app to track your links and learn new topics fast.
          </div>
        </a>
        <a
          href="https://github.com/kuskusapp/kuskus"
          target="_black"
          className="flex items-center w-full gap-4 p-2 rounded-md cursor-pointer hover:bg-[#121212] transition-all"
        >
          <div className="text-white/60 pl-[50px] text-end">
            <div className="text-[20px] font-bold text-white">Kuskus</div>
            Its an app that allows you to share places you have eaten in like
            restaurants or cafes.
          </div>
          <div className="min-w-[100px] h-[100px] overflow-hidden flex items-center justify-center object-cover bg-[#171717] rounded-md">
            <img
              src="/KusKus.png"
              alt="KusKus"
              className="w-[100px] h-[100px]"
            />
          </div>
        </a>
      </div>
    </motion.div>
  );
}
