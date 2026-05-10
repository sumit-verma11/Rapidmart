"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Leaf, Star, Minus, Plus, Heart,
  Flame, Sparkles, RotateCcw, Zap, AlertTriangle,
} from "lucide-react";
import { ICategory, IProduct } from "@/types";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useUserActivity } from "@/store/userActivity";
import { trackAddToCart, trackWishlistAdd, trackWishlistRemove } from "@/lib/analytics";
import toast from "react-hot-toast";
import { haptic } from "@/lib/haptics";
import Tooltip from "@/components/Tooltip";

function getNutriScore(cal: number) {
  if (cal < 80)  return { g: "A", c: "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-400" };
  if (cal < 160) return { g: "B", c: "bg-lime-100 text-lime-700 dark:bg-lime-900/60 dark:text-lime-400" };
  if (cal < 240) return { g: "C", c: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-400" };
  if (cal < 350) return { g: "D", c: "bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-400" };
  return          { g: "E", c: "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-400" };
}

export default function ProductCard({ product }: { product: IProduct }) {
  const { items, addItem, updateQuantity } = useCartStore();
  const { toggle, has } = useWishlistStore();
  const { hasOrdered, daysSinceOrder } = useUserActivity();

  const v            = product.variants[0];
  const discount     = v ? calculateDiscount(v.mrp, v.sellingPrice) : 0;
  const isOOS        = !product.isAvailable || product.stockQty === 0;
  const isWishlisted = has(product._id.toString());
  const cartItem     = items.find(i => i.productId === product._id.toString() && i.variantSku === v?.sku);
  const qty          = cartItem?.quantity ?? 0;
  const pid          = product._id.toString();
  const reordered    = hasOrdered(pid);
  const daysAgo      = daysSinceOrder(pid);

  const flashEndsAt  = product.flashSale?.endsAt;
  const flashActive  = !!(flashEndsAt && new Date(flashEndsAt) > new Date());
  const flashPrice   = flashActive && v && product.flashSale
    ? Math.round(v.mrp * (1 - product.flashSale.discountPercent / 100))
    : v?.sellingPrice ?? 0;

  const [countdown, setCountdown] = useState<string | null>(null);
  useEffect(() => {
    if (!flashActive || !flashEndsAt) return;
    const tick = () => {
      const ms = new Date(flashEndsAt).getTime() - Date.now();
      if (ms <= 0) { setCountdown(null); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setCountdown([h, m, s].map(n => String(n).padStart(2, "0")).join(":"));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashActive]);

  const categoryName =
    product.category && typeof product.category === "object" && "name" in product.category
      ? (product.category as ICategory).name : "";

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (isOOS || !v) return;
    haptic(50);
    addItem({ productId: pid, variantSku: v.sku, name: product.name,
      image: product.images[0] ?? "/placeholder.png",
      unit: `${v.size}${v.unit}`, mrp: v.mrp, sellingPrice: flashPrice,
      quantity: 1, stock: product.stockQty });
    if (qty === 0) {
      toast.success(`${product.name} added`);
      trackAddToCart(pid, product.name, v.sellingPrice, 1);
      fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: pid, event: "cart" }) }).catch(() => {});
    }
  }
  function handleDec(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    updateQuantity(pid, qty - 1);
  }
  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    toggle({ productId: pid, name: product.name, image: product.images[0] ?? "/placeholder.png",
      slug: product.slug, price: v?.sellingPrice ?? 0, mrp: v?.mrp ?? 0 });
    if (isWishlisted) { toast("Removed"); trackWishlistRemove(pid, product.name); }
    else { toast.success("Wishlisted!"); trackWishlistAdd(pid, product.name); }
  }

  const price      = flashActive ? flashPrice : (v?.sellingPrice ?? 0);
  const showStrike = v && (flashActive ? flashPrice < v.mrp : v.sellingPrice < v.mrp);

  return (
    <Link href={`/products/${product.slug}`} className="block group">
      <motion.article
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className={`relative flex flex-col overflow-hidden rounded-3xl h-full
                    bg-white dark:bg-gray-900
                    border border-gray-100 dark:border-gray-800
                    shadow-sm group-hover:shadow-xl dark:shadow-black/40
                    transition-shadow duration-300
                    ${flashActive ? "ring-2 ring-red-500 ring-offset-2 dark:ring-offset-gray-950" : ""}`}
      >
        {/* ── Image ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-t-3xl"
             style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #f9fafb 100%)" }}>
          <div className="dark:hidden absolute inset-0"
               style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #f9fafb 100%)" }} />
          <div className="hidden dark:block absolute inset-0"
               style={{ background: "linear-gradient(135deg, #1a2e1a 0%, #111827 100%)" }} />

          <div className="relative aspect-square">
            {product.images[0] ? (
              <Image src={product.images[0]} alt={product.name} fill
                className="object-contain p-4 transition-transform duration-500 group-hover:scale-110 relative z-10"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
            ) : (
              <div className="relative z-10 w-full h-full flex items-center justify-center text-6xl opacity-30">🥕</div>
            )}
          </div>

          {/* Wishlist */}
          <motion.button onClick={handleWishlist} whileTap={{ scale: 0.7 }}
            className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center
                        shadow-md border transition-all duration-150
                        ${isWishlisted
                          ? "bg-red-500 border-red-500 text-white"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-300 hover:text-red-500"}`}
            aria-label="Wishlist">
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-white" : ""}`} />
          </motion.button>

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1">
            {flashActive && (
              <motion.span animate={{ scale: [1, 1.07, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500 text-white">
                <Zap className="w-2.5 h-2.5" />FLASH
              </motion.span>
            )}
            {!flashActive && discount > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-gray-900">
                {discount}% OFF
              </span>
            )}
            {product.isOrganic && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                <Leaf className="w-2.5 h-2.5" />Organic
              </span>
            )}
            {product.isNewArrival && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white">
                <Sparkles className="w-2.5 h-2.5" />New
              </span>
            )}
            {product.isBestseller && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                <Flame className="w-2.5 h-2.5" />Hot
              </span>
            )}
            {reordered && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500 text-white">
                <RotateCcw className="w-2.5 h-2.5" />Again
              </span>
            )}
          </div>

          {/* Out of stock */}
          {isOOS && (
            <div className="absolute inset-0 z-20 flex items-center justify-center
                            bg-white/80 dark:bg-gray-900/85 backdrop-blur-sm rounded-t-3xl">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full
                               bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400
                               border border-gray-200 dark:border-gray-700">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* ── Info ────────────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 px-3.5 py-3 gap-1.5 bg-white dark:bg-gray-900">

          {categoryName && (
            <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">
              {categoryName}
            </p>
          )}

          <h3 className="text-sm font-bold leading-snug line-clamp-2
                         text-gray-900 dark:text-gray-100
                         group-hover:text-emerald-600 dark:group-hover:text-emerald-400
                         transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center gap-2">
            {v && <span className="text-[11px] text-gray-400 dark:text-gray-500">{v.size}{v.unit}</span>}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-0.5 ml-auto">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{product.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Allergen / nutri */}
          {(product.allergyInfo || product.nutritionFacts?.calories != null) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {product.allergyInfo && (
                <Tooltip content={<><b className="block mb-0.5">Allergen Info</b>{product.allergyInfo}</>} side="top" maxWidth={200}>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 cursor-default">
                    <AlertTriangle className="w-2.5 h-2.5" />Allergen
                  </span>
                </Tooltip>
              )}
              {product.nutritionFacts?.calories != null && (() => {
                const ns = getNutriScore(product.nutritionFacts.calories as number);
                return (
                  <Tooltip content={<><b className="block mb-1">Nutri-Score {ns.g}</b><span>{product.nutritionFacts!.calories} kcal/100g</span></>} side="top" maxWidth={160}>
                    <span className={`inline-flex text-[10px] font-black px-1.5 py-0.5 rounded-full cursor-default ${ns.c}`}>{ns.g}</span>
                  </Tooltip>
                );
              })()}
            </div>
          )}

          {/* Price + Cart */}
          <div className="mt-auto pt-2.5 flex items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-lg font-black text-gray-900 dark:text-white leading-none">
                {formatPrice(price)}
              </p>
              {showStrike && (
                <p className="text-[11px] text-gray-400 line-through mt-0.5">{formatPrice(v!.mrp)}</p>
              )}
              {flashActive && countdown && (
                <p className="text-[10px] text-red-500 font-bold mt-0.5">⚡ {countdown}</p>
              )}
              {!flashActive && daysAgo !== null && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  {daysAgo === 0 ? "Ordered today" : `${daysAgo}d ago`}
                </p>
              )}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {qty > 0 ? (
                <motion.div key="qty"
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="flex items-center rounded-2xl overflow-hidden shrink-0
                             bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500 dark:border-emerald-600"
                  onClick={e => e.preventDefault()}>
                  <button onClick={handleDec} aria-label="–"
                    className="w-8 h-8 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-black text-gray-900 dark:text-white">{qty}</span>
                  <button onClick={handleAdd} disabled={qty >= product.stockQty} aria-label="+"
                    className="w-8 h-8 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-30">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ) : (
                <motion.button key="add"
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={handleAdd} disabled={isOOS}
                  className="inline-flex items-center gap-1.5 rounded-2xl
                             bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-600 dark:hover:bg-emerald-500
                             text-white text-xs font-bold px-3.5 h-9 shrink-0
                             shadow-md shadow-emerald-500/25 dark:shadow-emerald-900/50
                             disabled:opacity-40 disabled:cursor-not-allowed
                             transition-colors duration-150"
                  aria-label="Add to cart">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Add
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
