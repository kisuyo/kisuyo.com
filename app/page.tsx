"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Icons from "@/components/Icons";
import Stack from "@/components/Stack";
import GlassCard from "@/components/glassCard";

export default function Home() {
  return (
    <>
      <main className="w-screen h-screen text-[var(--text-5)] flex items-center justify-center">
        <GlassCard>
          <div className="w-full h-full gap-4 flex flex-col">
            <h1 className="text-lg font-bold">Igor Voloboev</h1>
            <p className="text-sm text-[var(--text-4)]">
              Im a fullstack software engineer based in Spain. I love building
              and discovering new things about css.
            </p>
            <button
              onClick={() => {
                window.open("https://github.com/kisuyo", "_blank");
              }}
              className="underline w-fit font-semibold"
            >
              Learn More
            </button>
          </div>
        </GlassCard>
        {/* <div className="w-[100px] h-[100px] absolute top-[55%] left-[50%] bg-white backdrop-blur-sm rounded-2xl"></div> */}
      </main>
    </>
  );
}
