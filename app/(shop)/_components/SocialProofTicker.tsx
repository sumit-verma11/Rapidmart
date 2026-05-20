"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const buildMessages = (count: number, mins: number) => [
  `🛵 ${count} orders delivered near you today · Last delivery ${mins} min ago`,
  `⚡ ${count + 4} happy customers ordered in the last hour`,
  `🌿 ${Math.round(count * 0.3)} people chose organic products today`,
  `✅ Average delivery time today: 9 minutes`,
];

export default function SocialProofTicker() {
  const [count, setCount] = useState(47);
  const [mins,  setMins]  = useState(3);
  const [idx,   setIdx]   = useState(0);

  useEffect(() => {
    // Increment order count every 30s to feel live
    const t1 = setInterval(() => setCount((c) => c + 1), 30_000);
    // Count down last-delivery minutes, reset at 1
    const t2 = setInterval(() => setMins((m) => (m <= 1 ? 4 : m - 1)), 15_000);
    // Rotate messages every 4.5s
    const t3 = setInterval(() => setIdx((i) => (i + 1) % 4), 4_500);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, []);

  const messages = buildMessages(count, mins);

  return (
    <div className="px-3 max-w-7xl mx-auto mt-2">
      <div className="bg-emerald-50 dark:bg-emerald-950/30
                      border border-emerald-100 dark:border-emerald-900/50
                      rounded-2xl px-4 py-2.5 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{    y: -10, opacity: 0 }}
            transition={{ duration: 0.32 }}
            className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 text-center"
          >
            {messages[idx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
