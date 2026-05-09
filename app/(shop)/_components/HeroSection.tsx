"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Leaf, Sparkles } from "lucide-react";
import AnimatedHeroText from "./AnimatedHeroText";
import { ClaimOfferHeroLink } from "./ClaimOfferButton";

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 28 } as const,
  animate:    { opacity: 1, y: 0  } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay },
});

const floatCards = [
  { emoji: "🥑", label: "Avocado",       sub: "Just restocked",   pos: "top-6 right-0 lg:right-[-1.5rem]",  delay: 0.7 },
  { emoji: "🍓", label: "Strawberries",  sub: "Farm fresh today", pos: "bottom-8 left-0 lg:left-[-2rem]",   delay: 0.9 },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0f4c2a] via-[#1A6B3A] to-[#1e7d43]">
      {/* Mesh orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-[320px] w-[320px] rounded-full bg-yellow-400/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-2xl" />
      </div>

      {/* Grid texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">

          {/* ── Left copy ─────────────────────────────────────── */}
          <div className="text-white">
            {/* Badge */}
            <motion.div
              {...fadeUp(0)}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20
                         bg-white/10 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm"
            >
              <Leaf className="h-3.5 w-3.5 text-emerald-300" />
              Farm Fresh · Delivered Daily
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp(0.1)}
              className="mb-5 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-[3.4rem]"
            >
              Fresh Groceries
              <br />
              <AnimatedHeroText />
            </motion.h1>

            {/* Sub */}
            <motion.p
              {...fadeUp(0.2)}
              className="mb-8 max-w-md text-base leading-relaxed text-white/75 sm:text-lg"
            >
              Premium fruits, vegetables, dairy & more — delivered in 2 hours.
              Free delivery on orders above{" "}
              <span className="font-semibold text-yellow-300">₹499</span>.
            </motion.p>

            {/* CTA row */}
            <motion.div {...fadeUp(0.3)} className="flex flex-wrap gap-3">
              <Link
                href="#shop"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5
                           font-bold text-primary shadow-lg shadow-black/20 transition-all
                           duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
              >
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <ClaimOfferHeroLink />
            </motion.div>

            {/* Stats */}
            <motion.div {...fadeUp(0.4)} className="mt-10 flex items-center gap-8">
              {[
                ["50K+", "Happy Customers"],
                ["99%",  "Fresh Guarantee"],
                ["4.8★", "App Rating"],
              ].map(([val, label]) => (
                <div key={label}>
                  <p className="text-xl font-extrabold text-white sm:text-2xl">{val}</p>
                  <p className="mt-0.5 text-xs text-white/55">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right visual ──────────────────────────────────── */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative">
              {/* Glow ring */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                className="relative flex h-72 w-72 items-center justify-center rounded-full
                           border border-white/20 bg-white/10 text-[7rem] shadow-2xl backdrop-blur-md"
              >
                🛒

                {/* Orbiting dot */}
                <motion.div
                  className="absolute h-4 w-4 rounded-full bg-yellow-400 shadow-md shadow-yellow-400/50"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  style={{ top: 0, left: "50%", originX: "50%", originY: "150px" }}
                />
              </motion.div>

              {/* Floating product cards */}
              {floatCards.map(({ emoji, label, sub, pos, delay }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0,  scale: 1   }}
                  transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
                  className={`absolute ${pos} flex items-center gap-3 rounded-2xl
                              border border-white/10 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{label}</p>
                    <p className="text-[10px] font-semibold text-emerald-600">{sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
