"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChefHat, ArrowRight } from "lucide-react";

const MEALS = [
  {
    name:     "Breakfast",
    emoji:    "🥞",
    desc:     "Eggs · Bread · Butter · Milk",
    serves:   "2 servings",
    query:    "eggs",
    gradient: "from-amber-400 to-orange-500",
    bg:       "bg-amber-50 dark:bg-amber-950/30",
    border:   "border-amber-100 dark:border-amber-900/50",
    dot:      "bg-amber-500",
  },
  {
    name:     "Dal Tadka",
    emoji:    "🍛",
    desc:     "Dal · Rice · Onion · Tomato",
    serves:   "4 servings",
    query:    "dal",
    gradient: "from-yellow-400 to-orange-500",
    bg:       "bg-yellow-50 dark:bg-yellow-950/30",
    border:   "border-yellow-100 dark:border-yellow-900/50",
    dot:      "bg-yellow-500",
  },
  {
    name:     "Pasta Night",
    emoji:    "🍝",
    desc:     "Pasta · Sauce · Cheese · Garlic",
    serves:   "2 servings",
    query:    "pasta",
    gradient: "from-red-400 to-rose-500",
    bg:       "bg-red-50 dark:bg-red-950/30",
    border:   "border-red-100 dark:border-red-900/50",
    dot:      "bg-red-500",
  },
  {
    name:     "Fresh Salad",
    emoji:    "🥗",
    desc:     "Cucumber · Tomato · Carrot",
    serves:   "2 servings",
    query:    "cucumber",
    gradient: "from-emerald-400 to-teal-500",
    bg:       "bg-emerald-50 dark:bg-emerald-950/30",
    border:   "border-emerald-100 dark:border-emerald-900/50",
    dot:      "bg-emerald-500",
  },
  {
    name:     "Chicken Biryani",
    emoji:    "🍗",
    desc:     "Chicken · Basmati · Yogurt · Spices",
    serves:   "4 servings",
    query:    "chicken",
    gradient: "from-amber-500 to-yellow-500",
    bg:       "bg-orange-50 dark:bg-orange-950/30",
    border:   "border-orange-100 dark:border-orange-900/50",
    dot:      "bg-orange-500",
  },
  {
    name:     "Smoothie Bowl",
    emoji:    "🫐",
    desc:     "Banana · Berries · Milk · Honey",
    serves:   "1 serving",
    query:    "banana",
    gradient: "from-violet-400 to-purple-500",
    bg:       "bg-violet-50 dark:bg-violet-950/30",
    border:   "border-violet-100 dark:border-violet-900/50",
    dot:      "bg-violet-500",
  },
];

export default function MealSection() {
  const router = useRouter();

  return (
    <section className="px-3 pt-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
          <ChefHat className="w-4 h-4 text-orange-500" />
        </div>
        <div>
          <h2 className="text-base font-black text-gray-900 dark:text-white leading-tight">
            Shop by Meal
          </h2>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
            Find all ingredients for your favourite recipe
          </p>
        </div>
      </div>

      {/* Meal cards grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {MEALS.map((meal, i) => (
          <motion.button
            key={meal.name}
            onClick={() => router.push(`/?search=${encodeURIComponent(meal.query)}#shop`)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 25 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`${meal.bg} ${meal.border} border rounded-2xl p-3 text-left
                        hover:shadow-md transition-shadow duration-200 cursor-pointer`}
          >
            <span className="text-2xl block mb-2">{meal.emoji}</span>
            <p className="text-[11px] font-black text-gray-900 dark:text-white leading-tight mb-1">
              {meal.name}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed mb-2.5 line-clamp-2">
              {meal.desc}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">{meal.serves}</span>
              <span className={`w-5 h-5 rounded-full bg-gradient-to-br ${meal.gradient}
                               flex items-center justify-center shrink-0 shadow-sm`}>
                <ArrowRight className="w-2.5 h-2.5 text-white" />
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
