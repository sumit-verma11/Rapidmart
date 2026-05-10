"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import AnimatedHeroText from "./AnimatedHeroText";
import { ClaimOfferHeroLink } from "./ClaimOfferButton";

const GRID_ITEMS = [
  { emoji: "🥑", name: "Avocado",      bg: "bg-green-900/60"  },
  { emoji: "🍓", name: "Strawberry",   bg: "bg-rose-900/60"   },
  { emoji: "🥛", name: "Milk",         bg: "bg-blue-900/60"   },
  { emoji: "🫐", name: "Blueberry",    bg: "bg-indigo-900/60" },
  { emoji: "🍋", name: "Lemon",        bg: "bg-yellow-900/60" },
  { emoji: "🥦", name: "Broccoli",     bg: "bg-emerald-900/60"},
  { emoji: "🍅", name: "Tomato",       bg: "bg-red-900/60"    },
  { emoji: "🫚", name: "Olive Oil",    bg: "bg-amber-900/60"  },
  { emoji: "🧀", name: "Cheese",       bg: "bg-orange-900/60" },
];

const STATS = [
  { val: "50K+", label: "Customers"  },
  { val: "2hr",  label: "Delivery"   },
  { val: "99%",  label: "Freshness"  },
  { val: "₹0",   label: "Min. Order" },
];

export default function HeroSection() {
  return (
    <section className="relative bg-[#070f09] overflow-hidden">

      {/* Subtle noise texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Green glow top-left */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-600/20 blur-3xl" />
      {/* Amber glow bottom-right */}
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 min-h-0 gap-0">

          {/* ── Left: Copy ─────────────────────────────────── */}
          <div className="flex flex-col justify-center py-14 lg:py-20 lg:pr-12">

            {/* Offer pill */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 self-start rounded-full
                         bg-emerald-500/15 border border-emerald-500/30
                         px-4 py-1.5 text-sm font-bold text-emerald-400"
            >
              <Tag className="h-3.5 w-3.5" />
              ₹100 off your first order · Code: FRESH100
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight text-white mb-2">
                FRESH
              </h1>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight text-emerald-400 mb-2">
                GROCERIES
              </h1>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight text-white/30 mb-6">
                <AnimatedHeroText />
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mb-8 max-w-sm text-white/50 text-base leading-relaxed"
            >
              Farm-to-door delivery in under 2 hours.
              50,000+ happy customers across the city.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-wrap items-center gap-3 mb-10"
            >
              <Link
                href="#shop"
                className="group inline-flex items-center gap-2 rounded-2xl
                           bg-emerald-500 hover:bg-emerald-400 text-white
                           font-bold px-8 py-4 text-base
                           shadow-lg shadow-emerald-900/50
                           transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                Shop Now
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <ClaimOfferHeroLink />
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex items-center gap-6 flex-wrap"
            >
              {STATS.map(({ val, label }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                >
                  <p className="text-xl font-black text-white">{val}</p>
                  <p className="text-xs text-white/40 font-medium mt-0.5">{label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* ── Right: Product mosaic ───────────────────────── */}
          <div className="hidden lg:flex items-center justify-center py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-3 gap-3 w-[340px]"
            >
              {GRID_ITEMS.map(({ emoji, name, bg }, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.08, rotate: 2 }}
                  className={`${bg} backdrop-blur-sm border border-white/10
                              rounded-2xl aspect-square flex flex-col items-center
                              justify-center gap-1 cursor-default select-none
                              hover:border-white/20 transition-colors duration-200`}
                >
                  <span className="text-3xl">{emoji}</span>
                  <span className="text-[10px] font-semibold text-white/60">{name}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

        </div>
      </div>

      {/* Bottom divider line */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-800/50 to-transparent" />
    </section>
  );
}
