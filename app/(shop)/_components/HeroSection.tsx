"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Leaf, Sparkles, Clock, Star } from "lucide-react";
import AnimatedHeroText from "./AnimatedHeroText";
import { ClaimOfferHeroLink } from "./ClaimOfferButton";

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 30 } as const,
  animate:    { opacity: 1, y: 0  } as const,
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const, delay },
});

const floatCards = [
  {
    emoji: "🥑",
    label: "Avocado",
    sub: "Just restocked",
    accent: "text-emerald-600",
    pos: "top-4 right-0 lg:right-[-1rem]",
    delay: 0.8,
  },
  {
    emoji: "🍓",
    label: "Strawberries",
    sub: "Farm fresh today",
    accent: "text-rose-500",
    pos: "bottom-10 left-0 lg:left-[-1.5rem]",
    delay: 1.0,
  },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0b3d22] via-[#1A6B3A] to-[#1e7d43]">

      {/* Animated mesh orbs */}
      <motion.div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        <motion.div
          className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-emerald-400/15 blur-3xl"
          animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 h-[380px] w-[380px] rounded-full bg-yellow-400/10 blur-3xl"
          animate={{ scale: [1, 1.15, 1], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <div className="absolute top-1/2 left-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-2xl" />
      </motion.div>

      {/* Grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid lg:grid-cols-2 gap-10 items-center">

          {/* ── Left copy ──────────────────────────────────────────── */}
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
              className="mb-5 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-[3.3rem]"
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
              <span className="font-bold text-yellow-300">₹499</span>.
            </motion.p>

            {/* CTAs */}
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

            {/* Trust badges */}
            <motion.div {...fadeUp(0.4)} className="mt-10 flex items-center gap-6 flex-wrap">
              {[
                { icon: <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />, val: "4.8★", label: "App Rating" },
                { icon: <Clock className="w-4 h-4 text-emerald-300" />, val: "2hr", label: "Delivery" },
                { icon: <Leaf className="w-4 h-4 text-green-300" />, val: "100%", label: "Fresh" },
              ].map(({ icon, val, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    {icon}
                  </div>
                  <div>
                    <p className="text-lg font-extrabold leading-none text-white">{val}</p>
                    <p className="text-[11px] text-white/55 mt-0.5">{label}</p>
                  </div>
                </div>
              ))}

              {/* Divider */}
              <div className="w-px h-8 bg-white/20 hidden sm:block" />

              <div>
                <p className="text-lg font-extrabold text-white leading-none">50K+</p>
                <p className="text-[11px] text-white/55 mt-0.5">Happy Customers</p>
              </div>
            </motion.div>
          </div>

          {/* ── Right visual ───────────────────────────────────────── */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative">

              {/* Main circle */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                className="relative flex h-72 w-72 items-center justify-center rounded-full
                           border border-white/15 bg-white/10 text-[7rem] shadow-2xl backdrop-blur-md"
              >
                🛒

                {/* Orbiting dot */}
                <motion.div
                  className="absolute h-5 w-5 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/60
                             flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                  style={{ top: -2, left: "50%", originX: "50%", originY: "148px" }}
                >
                  <span className="text-[10px]">✦</span>
                </motion.div>

                {/* Second orbiting dot (opposite direction) */}
                <motion.div
                  className="absolute h-3 w-3 rounded-full bg-emerald-300 shadow-md shadow-emerald-400/50"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
                  style={{ top: 12, left: "50%", originX: "50%", originY: "130px" }}
                />
              </motion.div>

              {/* Floating product cards */}
              {floatCards.map(({ emoji, label, sub, accent, pos, delay }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.05, y: -3 }}
                  className={`absolute ${pos} flex items-center gap-3 rounded-2xl
                              border border-white/10 bg-white/95 dark:bg-gray-900/95
                              px-4 py-3 shadow-xl backdrop-blur-md`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{label}</p>
                    <p className={`text-[10px] font-semibold ${accent}`}>{sub}</p>
                  </div>
                </motion.div>
              ))}

              {/* Delivery time badge */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="absolute -bottom-4 right-4 flex items-center gap-2 bg-white/95 dark:bg-gray-900/95
                           rounded-2xl px-4 py-2.5 shadow-xl border border-white/10"
              >
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-muted font-medium">Delivery in</p>
                  <p className="text-xs font-extrabold text-gray-800">Under 2 hours</p>
                </div>
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
