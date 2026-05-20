"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Zap, Leaf, ShieldCheck, Clock } from "lucide-react";

const OFFERS = [
  {
    tag:   "New User Offer",
    headline: "₹100 OFF",
    sub:   "Code FRESH100 · Min order ₹299",
    href:  "/register",
    cta:   "Grab Deal",
    from:  "#6D28D9",
    to:    "#4C1D95",
  },
  {
    tag:   "Free Delivery",
    headline: "Orders ₹499+",
    sub:   "No delivery charges, ever",
    href:  "#shop",
    cta:   "Shop Now",
    from:  "#059669",
    to:    "#064E3B",
  },
  {
    tag:   "Flash Sale",
    headline: "Up to 40% OFF",
    sub:   "Fresh fruits & vegetables",
    href:  "#shop",
    cta:   "See Deals",
    from:  "#EA580C",
    to:    "#9A3412",
  },
];

const STATS = [
  { Icon: Clock,       label: "Delivery",   value: "~10 min", ring: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-400" },
  { Icon: Zap,         label: "Live Deals",  value: "24 / 7",  ring: "bg-amber-100 dark:bg-amber-900/40",   text: "text-amber-700 dark:text-amber-400"   },
  { Icon: Leaf,        label: "Organic",     value: "100+",    ring: "bg-teal-100 dark:bg-teal-900/40",     text: "text-teal-700 dark:text-teal-400"     },
  { Icon: ShieldCheck, label: "Fresh Daily", value: "100%",    ring: "bg-blue-100 dark:bg-blue-900/40",     text: "text-blue-700 dark:text-blue-400"     },
];

export default function HeroSection() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % OFFERS.length), 3800);
    return () => clearInterval(t);
  }, []);

  const offer = OFFERS[idx];

  return (
    <section className="px-3 pt-3 pb-0 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">

        {/* ── Main offer card ─────────────────────────────────── */}
        <div className="sm:col-span-3 relative overflow-hidden rounded-2xl min-h-[140px] cursor-pointer">

          {/* Animated gradient background */}
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${offer.from}, ${offer.to})` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          </AnimatePresence>

          {/* Decorative blobs */}
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-10 bottom-0 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              className="relative z-10 p-5 flex flex-col justify-between h-full"
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0,  opacity: 1 }}
              exit={{    y: -14, opacity: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <div>
                <span className="inline-block text-[10px] font-black uppercase tracking-widest
                                 bg-white/20 text-white px-2.5 py-0.5 rounded-full mb-2.5">
                  {offer.tag}
                </span>
                <p className="text-3xl sm:text-4xl font-black text-white leading-none tracking-tight mb-1.5">
                  {offer.headline}
                </p>
                <p className="text-white/70 text-sm font-medium">{offer.sub}</p>
              </div>

              <Link
                href={offer.href}
                className="w-fit mt-4 inline-flex items-center gap-1.5 bg-white text-gray-900
                           text-xs font-black px-4 py-2 rounded-xl
                           hover:bg-white/90 active:scale-95 transition-all"
              >
                {offer.cta}
                <span className="text-base leading-none">→</span>
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="absolute bottom-3.5 right-4 flex gap-1 z-10">
            {OFFERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  i === idx ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/35"
                }`}
              />
            ))}
          </div>
        </div>

        {/* ── Stats bento grid ────────────────────────────────── */}
        <div className="sm:col-span-2 grid grid-cols-2 gap-2.5">
          {STATS.map(({ Icon, label, value, ring, text }) => (
            <motion.div
              key={label}
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={`${ring} rounded-2xl p-4 flex flex-col justify-between cursor-default`}
            >
              <Icon className={`w-5 h-5 ${text}`} />
              <div className="mt-3">
                <p className={`text-xl font-black ${text} leading-none`}>{value}</p>
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
