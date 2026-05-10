"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Tag, Zap } from "lucide-react";
import AnimatedHeroText from "./AnimatedHeroText";

export default function HeroSection() {
  return (
    <section className="relative bg-[#070f09] overflow-hidden">
      {/* Glow blobs */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-emerald-600/25 blur-3xl" />
      <div className="pointer-events-none absolute top-0 right-1/3 h-32 w-64 rounded-full bg-emerald-400/10 blur-2xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-7 sm:py-8">

          {/* Left — copy */}
          <div className="flex flex-col gap-3">
            {/* Offer pill */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45 }}
              className="inline-flex items-center gap-2 self-start rounded-full
                         bg-emerald-500/15 border border-emerald-500/30
                         px-3 py-1 text-xs font-bold text-emerald-400"
            >
              <Tag className="h-3 w-3" />
              ₹100 off first order · FRESH100
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
            >
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-none tracking-tight">
                Fresh Groceries
              </h1>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 leading-none">
                <AnimatedHeroText />
              </span>
            </motion.div>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="text-sm text-white/45 max-w-sm leading-relaxed"
            >
              Farm-to-door in under 2 hours · Free delivery above{" "}
              <span className="text-yellow-400 font-semibold">₹499</span>
            </motion.p>
          </div>

          {/* Right — CTAs + stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="flex flex-col gap-3 sm:items-end shrink-0"
          >
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                href="#shop"
                className="group inline-flex items-center gap-2 rounded-xl
                           bg-emerald-500 hover:bg-emerald-400 text-white
                           font-bold px-5 py-2.5 text-sm
                           shadow-lg shadow-emerald-900/40
                           transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                Shop Now
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-xl
                           border border-white/20 hover:border-white/40
                           text-white/70 hover:text-white
                           font-semibold px-5 py-2.5 text-sm
                           transition-all duration-200 hover:bg-white/5"
              >
                <Zap className="h-3.5 w-3.5 text-yellow-400" />
                Claim ₹100 Off
              </Link>
            </div>

            {/* Compact stats */}
            <div className="flex items-center gap-4">
              {[["50K+","Customers"],["2hr","Delivery"],["99%","Fresh"]].map(([v,l]) => (
                <div key={l} className="text-center">
                  <p className="text-sm font-black text-white">{v}</p>
                  <p className="text-[10px] text-white/35">{l}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom edge */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-800/40 to-transparent" />
    </section>
  );
}
