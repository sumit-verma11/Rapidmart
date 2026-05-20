"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

type Segment = "morning" | "afternoon" | "evening" | "night";

function getSegment(): Segment {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

const CONFIG: Record<Segment, {
  emoji: string;
  greeting: string;
  suggestion: string;
  searchQuery: string;
  cta: string;
  gradient: string;
  iconBg: string;
  dotColor: string;
}> = {
  morning: {
    emoji: "☀️",
    greeting: "Good morning",
    suggestion: "Fresh milk, eggs & bread for your morning",
    searchQuery: "milk",
    cta: "Grab Breakfast →",
    gradient: "from-amber-400 via-orange-400 to-rose-400",
    iconBg: "bg-amber-50 dark:bg-amber-950/50",
    dotColor: "bg-amber-400",
  },
  afternoon: {
    emoji: "🌤️",
    greeting: "Good afternoon",
    suggestion: "Fresh veggies & staples for a wholesome meal",
    searchQuery: "vegetables",
    cta: "Shop Lunch →",
    gradient: "from-emerald-400 via-teal-400 to-cyan-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
    dotColor: "bg-emerald-400",
  },
  evening: {
    emoji: "🌅",
    greeting: "Good evening",
    suggestion: "Evening munchies, chips & beverages",
    searchQuery: "snacks",
    cta: "Snack Now →",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    iconBg: "bg-violet-50 dark:bg-violet-950/50",
    dotColor: "bg-violet-400",
  },
  night: {
    emoji: "🌙",
    greeting: "Good night",
    suggestion: "Quick bites & midnight essentials",
    searchQuery: "instant",
    cta: "Shop Now →",
    gradient: "from-indigo-500 via-blue-500 to-cyan-500",
    iconBg: "bg-indigo-50 dark:bg-indigo-950/50",
    dotColor: "bg-indigo-400",
  },
};

export default function GreetingBanner() {
  const { data: session } = useSession();
  const [segment, setSegment] = useState<Segment>("morning");

  useEffect(() => {
    setSegment(getSegment());
    const t = setInterval(() => setSegment(getSegment()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!session?.user) return null;

  const cfg  = CONFIG[segment];
  const name = session.user.name?.split(" ")[0] ?? "there";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="px-3 pt-2.5 max-w-7xl mx-auto"
    >
      {/* Gradient border trick */}
      <div className={`bg-gradient-to-r ${cfg.gradient} p-px rounded-2xl`}>
        <div className="bg-white dark:bg-gray-900 rounded-[15px] px-4 py-3 flex items-center justify-between gap-3">

          {/* Left: icon + text */}
          <div className="flex items-center gap-3 min-w-0">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${cfg.iconBg}`}>
              {cfg.emoji}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                {cfg.greeting}, {name}! 👋
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {cfg.suggestion}
              </p>
            </div>
          </div>

          {/* CTA button */}
          <Link
            href={`/?search=${encodeURIComponent(cfg.searchQuery)}#shop`}
            className={`shrink-0 text-[11px] font-black px-3.5 py-2 rounded-xl text-white
                        bg-gradient-to-r ${cfg.gradient} hover:opacity-90 transition-opacity
                        whitespace-nowrap shadow-sm`}
          >
            {cfg.cta}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
