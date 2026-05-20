"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, TrendingDown } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface OrderSummary {
  placedAt: string;
  totalDiscount: number;
}

function calcStreak(orders: OrderSummary[]): number {
  if (orders.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orderDays = new Set(
    orders.map((o) => {
      const d = new Date(o.placedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    if (orderDays.has(day.getTime())) {
      streak++;
    } else if (i > 0) {
      break; // gap found
    }
  }
  return streak;
}

function calcMonthlySavings(orders: OrderSummary[]): number {
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return orders
    .filter((o) => new Date(o.placedAt) >= monthStart)
    .reduce((sum, o) => sum + (o.totalDiscount ?? 0), 0);
}

export default function GamificationWidget() {
  const { data: session, status } = useSession();
  const [streak,  setStreak]  = useState(0);
  const [savings, setSavings] = useState(0);
  const [loaded,  setLoaded]  = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/orders?page=1")
      .then((r) => r.json())
      .then((d) => {
        const orders: OrderSummary[] = d.data ?? [];
        setStreak(calcStreak(orders));
        setSavings(calcMonthlySavings(orders));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [status]);

  if (status !== "authenticated" || !loaded || (streak === 0 && savings === 0)) return null;

  const streakMsg =
    streak >= 30 ? "🏆 Month champion!" :
    streak >= 7  ? "🔥 Weekly warrior!" :
    streak >= 3  ? `${7 - streak} more days for a bonus!` :
                   `${7 - streak} more days to reach weekly reward`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38 }}
      className="px-3 pt-3 max-w-7xl mx-auto"
    >
      <div className="grid grid-cols-2 gap-2.5">

        {/* Streak card */}
        {streak > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-red-50
                          dark:from-orange-950/30 dark:to-red-950/30
                          border border-orange-100 dark:border-orange-900/50
                          rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm shrink-0">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">Daily Streak</span>
            </div>
            <p className="text-3xl font-black text-orange-600 dark:text-orange-400 leading-none">
              {streak}
              <span className="text-sm font-bold ml-1">days</span>
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 leading-tight">
              {streakMsg}
            </p>
          </div>
        )}

        {/* Savings card */}
        {savings > 0 ? (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50
                          dark:from-emerald-950/30 dark:to-teal-950/30
                          border border-emerald-100 dark:border-emerald-900/50
                          rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm shrink-0">
                <TrendingDown className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Saved This Month</span>
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
              {formatPrice(Math.round(savings))}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 leading-tight">
              vs buying at full MRP prices
            </p>
          </div>
        ) : streak > 0 ? (
          /* Placeholder when streak exists but no savings yet */
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50
                          dark:from-emerald-950/30 dark:to-teal-950/30
                          border border-emerald-100 dark:border-emerald-900/50
                          rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-2xl mb-1.5">🎁</span>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              Order today to start saving!
            </p>
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}
