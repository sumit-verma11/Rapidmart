"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";

const PHRASES = [
  "in 2 Hours",
  "at Your Doorstep",
  "Fresh Every Day",
  "Across the City",
];

export default function AnimatedHeroText() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % PHRASES.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="relative inline-block overflow-hidden align-bottom h-[1.15em] w-full">
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          className="absolute left-0 text-emerald-400 whitespace-nowrap"
          initial={{ y: 40, opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0,  opacity: 1, filter: "blur(0px)" }}
          exit={{    y: -40, opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {PHRASES[idx]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
