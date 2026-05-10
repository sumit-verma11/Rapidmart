"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, Timer } from "lucide-react";
import { IProduct } from "@/types";

function formatCountdown(ms: number): { h: string; m: string; s: string } {
  if (ms <= 0) return { h: "00", m: "00", s: "00" };
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sc = total % 60;
  return {
    h:  String(h).padStart(2, "0"),
    m:  String(m).padStart(2, "0"),
    s:  String(sc).padStart(2, "0"),
  };
}

function CountdownBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="font-mono font-black text-sm leading-none bg-black/25 rounded-md px-1.5 py-1 min-w-[2rem] text-center"
        >
          {value}
        </motion.span>
      </AnimatePresence>
      <span className="text-[8px] uppercase tracking-wider mt-0.5 opacity-70">{label}</span>
    </div>
  );
}

export default function FlashSaleBanner() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetch("/api/flash-sale")
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (products.length === 0) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [products.length]);

  const active = products.filter(
    (p) => p.flashSale?.endsAt && new Date(p.flashSale.endsAt) > new Date()
  );

  if (active.length === 0 || dismissed) return null;

  const featured = active[0];
  const remaining = new Date(featured.flashSale!.endsAt).getTime() - Date.now();
  const time = formatCountdown(remaining);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative overflow-hidden"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-red-500 to-orange-600
                        animate-gradient bg-[length:200%_100%]" />

        {/* Shimmer overlay */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
            animation: "shimmerBanner 2.5s ease-in-out infinite",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3
                        flex items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            {/* Icon */}
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <Zap className="w-5 h-5 fill-white shrink-0" />
            </motion.div>

            <span className="font-black text-sm sm:text-base uppercase tracking-wide shrink-0">
              Flash Sale!
            </span>

            <Link
              href={`/products/${featured.slug}`}
              className="font-semibold text-sm hover:underline truncate max-w-[140px] sm:max-w-xs"
            >
              {featured.name}
            </Link>

            <span className="text-sm font-black bg-white/20 px-2.5 py-0.5 rounded-full shrink-0">
              {featured.flashSale!.discountPercent}% OFF
            </span>

            {active.length > 1 && (
              <span className="text-xs opacity-75 shrink-0">+{active.length - 1} more</span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Countdown */}
            <div className="flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 opacity-75" />
              <div className="flex items-center gap-1">
                <CountdownBlock value={time.h} label="hr" />
                <span className="font-bold opacity-60 text-sm mb-3">:</span>
                <CountdownBlock value={time.m} label="min" />
                <span className="font-bold opacity-60 text-sm mb-3">:</span>
                <CountdownBlock value={time.s} label="sec" />
              </div>
            </div>

            <button
              onClick={() => setDismissed(true)}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Suppress unused tick */}
        <span className="hidden">{tick}</span>
      </motion.div>
    </AnimatePresence>
  );
}
