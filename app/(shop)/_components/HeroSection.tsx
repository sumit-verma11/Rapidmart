"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Leaf, Zap, ShieldCheck, Clock } from "lucide-react";
import AnimatedHeroText from "./AnimatedHeroText";
import { ClaimOfferHeroLink } from "./ClaimOfferButton";

const TRUST = [
  { icon: Clock,       label: "2-Hour Delivery",   val: "Lightning fast"  },
  { icon: Leaf,        label: "100% Organic",       val: "Farm to door"    },
  { icon: ShieldCheck, label: "Safe & Fresh",       val: "Quality assured" },
  { icon: Zap,         label: "50K+ Customers",     val: "& growing"       },
];

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#0c3d20]">

      {/* Parallax gradient bg */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 bg-gradient-to-br from-[#0c3d20] via-[#1A6B3A] to-[#2d9e58]"
      />

      {/* Animated blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-yellow-300/15 blur-3xl"
          animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        <motion.div
          className="absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-white/5 blur-2xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* Dot grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-0">
        <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">

          {/* ── Copy ──────────────────────────────────────── */}
          <div className="text-white py-4 lg:py-6">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full
                         border border-emerald-400/30 bg-emerald-400/10
                         px-4 py-1.5 text-sm font-semibold backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Farm Fresh · Delivered Daily
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4 text-4xl font-black leading-[1.1] sm:text-5xl lg:text-6xl tracking-tight"
            >
              Fresh Groceries
              <br />
              <span className="text-secondary">
                <AnimatedHeroText />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8 max-w-lg text-white/70 text-lg leading-relaxed"
            >
              Premium produce delivered in under 2 hours.
              Free delivery above{" "}
              <span className="font-bold text-yellow-300">₹499</span>.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                href="#shop"
                className="group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5
                           font-bold text-primary shadow-xl shadow-black/20
                           hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 active:scale-95"
              >
                Shop Now
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <ClaimOfferHeroLink />
            </motion.div>

            {/* Trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              {TRUST.map(({ icon: Icon, label, val }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="flex items-center gap-2.5"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white leading-none">{label}</p>
                    <p className="text-[10px] text-white/50 mt-0.5">{val}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* ── Right — emoji showcase ─────────────────────── */}
          <div className="hidden lg:block relative self-end">
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-[320px]"
            >
              {/* Big ring */}
              <div className="flex h-64 w-64 mx-auto items-center justify-center rounded-full
                              border-2 border-white/10 bg-white/10 backdrop-blur-md shadow-2xl text-[6rem]">
                🛒
                {/* Orbiting ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2
                                  w-5 h-5 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50
                                  flex items-center justify-center text-[10px]">
                    ✦
                  </div>
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 13, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4"
                >
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2
                                  w-3 h-3 rounded-full bg-emerald-400 shadow-md" />
                </motion.div>
              </div>

              {/* Float card 1 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 }}
                className="absolute top-2 -right-4 flex items-center gap-2.5
                           bg-white/95 dark:bg-gray-900/95 rounded-2xl px-3.5 py-2.5 shadow-xl"
              >
                <span className="text-xl">🥑</span>
                <div>
                  <p className="text-xs font-bold text-gray-800">Avocado</p>
                  <p className="text-[10px] font-semibold text-emerald-600">Just restocked</p>
                </div>
              </motion.div>

              {/* Float card 2 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 }}
                className="absolute bottom-6 -left-6 flex items-center gap-2.5
                           bg-white/95 dark:bg-gray-900/95 rounded-2xl px-3.5 py-2.5 shadow-xl"
              >
                <span className="text-xl">🍓</span>
                <div>
                  <p className="text-xs font-bold text-gray-800">Strawberries</p>
                  <p className="text-[10px] font-semibold text-rose-500">Farm fresh today</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="relative mt-8 -mb-px">
          <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg"
               className="w-full block dark:hidden" preserveAspectRatio="none">
            <path d="M0 56L60 46.7C120 37 240 19 360 14C480 9 600 19 720 28C840 37 960 46 1080 46.7C1200 47 1320 38 1380 33.3L1440 28V56H0Z"
                  fill="#f9fafb"/>
          </svg>
          <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg"
               className="w-full block hidden dark:block" preserveAspectRatio="none">
            <path d="M0 56L60 46.7C120 37 240 19 360 14C480 9 600 19 720 28C840 37 960 46 1080 46.7C1200 47 1320 38 1380 33.3L1440 28V56H0Z"
                  fill="#030712"/>
          </svg>
        </div>
      </div>
    </section>
  );
}
