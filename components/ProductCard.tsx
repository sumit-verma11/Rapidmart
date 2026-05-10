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

function getNutriScore(calories: number) {
  if (calories < 80)  return { grade: "A", tw: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400" };
  if (calories < 160) return { grade: "B", tw: "bg-lime-100 text-lime-700 dark:bg-lime-900/50 dark:text-lime-400" };
  if (calories < 240) return { grade: "C", tw: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400" };
  if (calories < 350) return { grade: "D", tw: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400" };
  return               { grade: "E", tw: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400" };
}

export default function ProductCard({ product }: { product: IProduct }) {
  const { items, addItem, updateQuantity } = useCartStore();
  const { toggle, has } = useWishlistStore();
  const { hasOrdered, daysSinceOrder } = useUserActivity();

  const v = product.variants[0];
  const discount = v ? calculateDiscount(v.mrp, v.sellingPrice) : 0;
  const isOutOfStock = !product.isAvailable || product.stockQty === 0;
  const effectivePrice = v?.sellingPrice ?? 0;
  const isWishlisted = has(product._id.toString());

  const cartItem = items.find(
    (i) => i.productId === product._id.toString() && i.variantSku === v?.sku
  );
  const qty = cartItem?.quantity ?? 0;
  const pid = product._id.toString();
  const reordered = hasOrdered(pid);
  const daysAgo = daysSinceOrder(pid);

  const flashEndsAt = product.flashSale?.endsAt;
  const flashActive = !!(flashEndsAt && new Date(flashEndsAt) > new Date());
  const flashPrice = flashActive && v && product.flashSale
    ? Math.round(v.mrp * (1 - product.flashSale.discountPercent / 100))
    : effectivePrice;

  const [countdown, setCountdown] = useState<string | null>(null);
  useEffect(() => {
    if (!flashActive || !flashEndsAt) return;
    const tick = () => {
      const ms = new Date(flashEndsAt).getTime() - Date.now();
      if (ms <= 0) { setCountdown(null); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setCountdown([h, m, s].map((n) => String(n).padStart(2, "0")).join(":"));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashActive]);

  const categoryName =
    product.category !== null && typeof product.category === "object" && "name" in product.category
      ? (product.category as ICategory).name : "";

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (isOutOfStock || !v) return;
    haptic(50);
    addItem({
      productId: pid, variantSku: v.sku, name: product.name,
      image: product.images[0] ?? "/placeholder.png",
      unit: `${v.size}${v.unit}`, mrp: v.mrp, sellingPrice: flashPrice,
      quantity: 1, stock: product.stockQty,
    });
    if (qty === 0) {
      toast.success(`${product.name} added`);
      trackAddToCart(pid, product.name, v.sellingPrice, 1);
      fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: pid, event: "cart" }) }).catch(() => {});
    }
  }

  function handleDecrement(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    updateQuantity(pid, qty - 1);
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    toggle({ productId: pid, name: product.name, image: product.images[0] ?? "/placeholder.png",
      slug: product.slug, price: effectivePrice, mrp: v?.mrp ?? effectivePrice });
    if (isWishlisted) { toast("Removed from wishlist"); trackWishlistRemove(pid, product.name); }
    else              { toast.success("Added to wishlist"); trackWishlistAdd(pid, product.name); }
  }

  const displayPrice = flashActive ? flashPrice : effectivePrice;
  const showStrike   = v && (flashActive ? flashPrice < v.mrp : v.sellingPrice < v.mrp);

  return (
    <Link href={`/products/${product.slug}`} className="block group">
      <motion.div
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={`relative flex flex-col overflow-hidden rounded-2xl h-full
                    border border-gray-200 dark:border-gray-700
                    bg-white dark:bg-gray-900
                    shadow-md hover:shadow-2xl dark:shadow-black/40
                    transition-shadow duration-300
                    ${flashActive ? "ring-2 ring-red-500/70 ring-offset-2 dark:ring-offset-gray-950" : ""}`}
      >

        {/* ── Image area ──────────────────────────────────────── */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-contain p-3 transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">🥕</div>
          )}

          {/* Dark bottom gradient for readability */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

          {/* Wishlist */}
          <motion.button
            onClick={handleWishlist}
            whileTap={{ scale: 0.7 }}
            style={{ willChange: "transform" }}
            className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center
                        shadow-lg border transition-all duration-150
                        ${isWishlisted
                          ? "bg-red-500 border-red-500 text-white"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 dark:hover:text-red-400"}`}
            aria-label="Toggle wishlist"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-white" : ""}`} />
          </motion.button>

          {/* Badges */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {flashActive && (
              <motion.span animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500 text-white shadow">
                <Zap className="w-2.5 h-2.5" /> FLASH
              </motion.span>
            )}
            {discount > 0 && !flashActive && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-secondary text-white shadow">
                {discount}% OFF
              </span>
            )}
            {product.isOrganic && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shadow">
                <Leaf className="w-2.5 h-2.5" /> Organic
              </span>
            )}
            {product.isNewArrival && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white shadow">
                <Sparkles className="w-2.5 h-2.5" /> New
              </span>
            )}
            {product.isBestseller && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white shadow">
                <Flame className="w-2.5 h-2.5" /> Hot
              </span>
            )}
            {reordered && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow">
                <RotateCcw className="w-2.5 h-2.5" /> Reorder
              </span>
            )}
          </div>

          {/* Out of stock */}
          {isOutOfStock && (
            <div className="absolute inset-0 z-20 flex items-center justify-center
                            bg-white/80 dark:bg-gray-900/85 backdrop-blur-sm">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full
                               bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* ── Info area ───────────────────────────────────────── */}
        <div className="flex flex-col flex-1 p-3 gap-2 bg-white dark:bg-gray-900">

          {/* Category */}
          {categoryName && (
            <p className="text-[10px] uppercase tracking-widest font-bold text-primary/70 dark:text-emerald-400/70">
              {categoryName}
            </p>
          )}

          {/* Name */}
          <h3 className="text-sm font-bold leading-snug line-clamp-2
                         text-gray-900 dark:text-gray-100
                         group-hover:text-primary dark:group-hover:text-emerald-400
                         transition-colors duration-150">
            {product.name}
          </h3>

          {/* Size + rating row */}
          <div className="flex items-center gap-2 flex-wrap">
            {v && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                {v.size}{v.unit}
              </span>
            )}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-0.5 ml-auto">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-[10px] text-gray-400">({product.reviewCount})</span>
              </div>
            )}
          </div>

          {/* Allergen + Nutri badges */}
          {(product.allergyInfo || product.nutritionFacts?.calories != null) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {product.allergyInfo && (
                <Tooltip content={<><span className="font-semibold block mb-0.5">Allergen Info</span>{product.allergyInfo}</>} side="top" maxWidth={200}>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 cursor-default">
                    <AlertTriangle className="w-2.5 h-2.5" /> Allergen
                  </span>
                </Tooltip>
              )}
              {product.nutritionFacts?.calories != null && (() => {
                const ns = getNutriScore(product.nutritionFacts.calories as number);
                return (
                  <Tooltip content={<><span className="font-semibold block mb-1">Nutri-Score {ns.grade}</span><span>{product.nutritionFacts!.calories} kcal/100g</span></>} side="top" maxWidth={160}>
                    <span className={`inline-flex text-[10px] font-black px-1.5 py-0.5 rounded-full cursor-default ${ns.tw}`}>{ns.grade}</span>
                  </Tooltip>
                );
              })()}
            </div>
          )}

          {/* Price + cart ─ always at bottom */}
          <div className="mt-auto pt-2 flex items-center justify-between gap-2
                          border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-base font-extrabold text-primary dark:text-emerald-400 leading-none">
                {formatPrice(displayPrice)}
              </p>
              {showStrike && (
                <p className="text-xs text-gray-400 line-through mt-0.5">{formatPrice(v!.mrp)}</p>
              )}
              {flashActive && countdown && (
                <p className="text-[10px] text-red-500 dark:text-red-400 font-bold mt-0.5">⚡ {countdown}</p>
              )}
              {!flashActive && daysAgo !== null && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  {daysAgo === 0 ? "Ordered today" : `${daysAgo}d ago`}
                </p>
              )}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {qty > 0 ? (
                <motion.div
                  key="qty"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="flex items-center rounded-xl overflow-hidden shrink-0
                             bg-primary/5 dark:bg-emerald-900/30 border-2 border-primary dark:border-emerald-600"
                  onClick={(e) => e.preventDefault()}
                >
                  <button onClick={handleDecrement}
                    className="w-7 h-7 flex items-center justify-center text-primary dark:text-emerald-400
                               hover:bg-primary/10 transition-colors"
                    aria-label="Decrease">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-black text-gray-900 dark:text-white">{qty}</span>
                  <button onClick={handleAdd} disabled={qty >= product.stockQty}
                    className="w-7 h-7 flex items-center justify-center text-primary dark:text-emerald-400
                               hover:bg-primary/10 transition-colors disabled:opacity-30"
                    aria-label="Increase">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="add"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  className="flex items-center gap-1.5 bg-primary hover:bg-primary-600 dark:bg-emerald-600 dark:hover:bg-emerald-500
                             text-white text-xs font-bold px-3 h-8 rounded-xl shrink-0
                             shadow-md shadow-primary/30 dark:shadow-emerald-900/50
                             disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Add
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
