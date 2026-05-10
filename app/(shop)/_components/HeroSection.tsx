"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  {
    label:    "New User Offer",
    headline: "Get ₹100 OFF your first order",
    sub:      "Use code FRESH100 · Min. order ₹299",
    cta:      "Claim Now",
    href:     "/register",
    bg:       "from-emerald-600 to-emerald-800",
    accent:   "bg-yellow-400",
    emoji:    "🎉",
  },
  {
    label:    "Lightning Fast",
    headline: "Delivered in under 2 hours",
    sub:      "Free delivery on orders above ₹499",
    cta:      "Shop Now",
    href:     "#shop",
    bg:       "from-violet-600 to-purple-800",
    accent:   "bg-emerald-400",
    emoji:    "⚡",
  },
  {
    label:    "100% Fresh",
    headline: "Farm-fresh produce, every day",
    sub:      "Organic fruits & vegetables at your door",
    cta:      "Explore",
    href:     "#shop",
    bg:       "from-orange-500 to-rose-600",
    accent:   "bg-white",
    emoji:    "🥦",
  },
];

export default function HeroSection() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    const t = setInterval(() => { setDir(1); setIdx(i => (i + 1) % SLIDES.length); }, 4000);
    return () => clearInterval(t);
  }, []);

  function go(next: number) {
    setDir(next > idx ? 1 : -1);
    setIdx(next);
  }

  const slide = SLIDES[idx];

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${slide.bg} transition-all duration-700`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px] sm:h-20 gap-4">

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={idx}
              custom={dir}
              variants={{
                enter: (d: number) => ({ x: d * 60, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: -d * 60, opacity: 0 }),
              }}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 min-w-0"
            >
              <span className="text-2xl sm:text-3xl shrink-0">{slide.emoji}</span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-0.5">{slide.label}</p>
                <p className="text-sm sm:text-base font-black text-white leading-tight truncate">{slide.headline}</p>
                <p className="text-xs text-white/65 hidden sm:block mt-0.5">{slide.sub}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={slide.href}
              className={`${slide.accent} text-gray-900 text-xs font-black px-4 py-2 rounded-xl
                          hover:opacity-90 transition-opacity whitespace-nowrap shadow-md`}>
              {slide.cta}
            </Link>
            <div className="flex items-center gap-1">
              <button onClick={() => go((idx - 1 + SLIDES.length) % SLIDES.length)}
                className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                <ChevronLeft className="w-3.5 h-3.5 text-white" />
              </button>
              <button onClick={() => go((idx + 1) % SLIDES.length)}
                className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 pb-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => go(i)}
              className={`rounded-full transition-all duration-300 ${i === idx ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/30"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
