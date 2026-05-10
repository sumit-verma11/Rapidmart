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

function getNutriScore(calories: number): { grade: string; color: string; bg: string } {
  if (calories < 80)  return { grade: "A", color: "text-green-700 dark:text-green-400",  bg: "bg-green-100 dark:bg-green-900/40" };
  if (calories < 160) return { grade: "B", color: "text-lime-700 dark:text-lime-400",    bg: "bg-lime-100 dark:bg-lime-900/40"   };
  if (calories < 240) return { grade: "C", color: "text-yellow-700 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/40" };
  if (calories < 350) return { grade: "D", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/40" };
  return               { grade: "E", color: "text-red-700 dark:text-red-400",    bg: "bg-red-100 dark:bg-red-900/40"   };
}

interface ProductCardProps {
  product: IProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
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
    product.category !== null &&
    typeof product.category === "object" &&
    "name" in product.category
      ? (product.category as ICategory).name
      : "";

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || !v) return;
    haptic(50);
    addItem({
      productId: product._id.toString(),
      variantSku: v.sku,
      name: product.name,
      image: product.images[0] ?? "/placeholder.png",
      unit: `${v.size}${v.unit}`,
      mrp: v.mrp,
      sellingPrice: flashPrice,
      quantity: 1,
      stock: product.stockQty,
    });
    if (qty === 0) {
      toast.success(`${product.name} added to cart`);
      trackAddToCart(pid, product.name, v.sellingPrice, 1);
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: pid, event: "cart" }),
      }).catch(() => {});
    }
  }

  function handleDecrement(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product._id.toString(), qty - 1);
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle({
      productId: product._id.toString(),
      name: product.name,
      image: product.images[0] ?? "/placeholder.png",
      slug: product.slug,
      price: effectivePrice,
      mrp: v?.mrp ?? effectivePrice,
    });
    if (isWishlisted) {
      toast("Removed from wishlist");
      trackWishlistRemove(product._id.toString(), product.name);
    } else {
      toast.success("Added to wishlist");
      trackWishlistAdd(product._id.toString(), product.name);
    }
  }

  return (
    <Link href={`/products/${product.slug}`} className="block group">
      <motion.div
        className={`relative overflow-hidden h-full flex flex-col rounded-2xl
                    bg-white dark:bg-gray-900
                    border border-gray-100 dark:border-gray-800
                    shadow-sm hover:shadow-lg dark:shadow-black/30
                    transition-shadow duration-300
                    ${flashActive ? "ring-2 ring-red-500 ring-offset-1 dark:ring-offset-gray-950 animate-glow" : ""}`}
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
      >
        {/* ── Image ───────────────────────────────────────────────── */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100
                        dark:from-gray-800 dark:to-gray-900 overflow-hidden">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-contain p-2 group-hover:scale-108 transition-transform duration-500 ease-out"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">🥕</div>
          )}

          {/* Gradient fade at bottom of image */}
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/20 dark:from-gray-900/20 to-transparent pointer-events-none" />

          {/* Wishlist */}
          <motion.button
            onClick={handleWishlist}
            whileTap={{ scale: 0.75 }}
            className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center
                        justify-center shadow-md transition-all duration-150
                        ${isWishlisted
                          ? "bg-red-500 text-white"
                          : "bg-white/90 dark:bg-gray-800/90 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"}`}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-white" : ""}`} />
          </motion.button>

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {flashActive && (
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white shadow-sm"
              >
                <Zap className="w-3 h-3" /> FLASH
              </motion.span>
            )}
            {reordered && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm">
                <RotateCcw className="w-3 h-3" /> Re-order
              </span>
            )}
            {product.isOrganic && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-400 shadow-sm">
                <Leaf className="w-3 h-3" /> Organic
              </span>
            )}
            {product.isNewArrival && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white shadow-sm">
                <Sparkles className="w-3 h-3" /> New
              </span>
            )}
            {product.isBestseller && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white shadow-sm">
                <Flame className="w-3 h-3" /> Hot
              </span>
            )}
            {(product.isSale || discount > 0) && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-white shadow-sm">
                {discount > 0 ? `${discount}% OFF` : "SALE"}
              </span>
            )}
          </div>

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/75 dark:bg-gray-900/80 flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full
                               bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 shadow-sm">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* ── Info ────────────────────────────────────────────────── */}
        <div className="p-3 flex flex-col flex-1 gap-1.5">
          {categoryName && (
            <p className="text-[11px] text-muted font-semibold uppercase tracking-wide">{categoryName}</p>
          )}

          <h3 className="font-semibold text-sm leading-snug line-clamp-2
                         text-gray-800 dark:text-gray-100
                         group-hover:text-primary transition-colors duration-150">
            {product.name}
          </h3>

          {v && (
            <p className="text-[11px] text-muted">{v.size}{v.unit}</p>
          )}

          {/* Rating + info badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-secondary text-secondary" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{product.rating.toFixed(1)}</span>
                <span className="text-[10px] text-muted">({product.reviewCount})</span>
              </div>
            )}
            {product.allergyInfo && (
              <Tooltip
                content={<><span className="font-semibold block mb-0.5">Allergen Info</span>{product.allergyInfo}</>}
                side="top"
                maxWidth={200}
              >
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold
                                 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40
                                 text-amber-700 dark:text-amber-400 cursor-default">
                  <AlertTriangle className="w-2.5 h-2.5" /> Allergen
                </span>
              </Tooltip>
            )}
            {product.nutritionFacts?.calories != null && (
              (() => {
                const ns = getNutriScore(product.nutritionFacts.calories as number);
                return (
                  <Tooltip
                    content={
                      <>
                        <span className="font-semibold block mb-1">Nutri-Score {ns.grade}</span>
                        <span className="block">{product.nutritionFacts!.calories} kcal / 100g</span>
                        {product.nutritionFacts!.protein != null && (
                          <span className="block text-gray-300">Protein: {product.nutritionFacts!.protein}g</span>
                        )}
                        {product.nutritionFacts!.fat != null && (
                          <span className="block text-gray-300">Fat: {product.nutritionFacts!.fat}g</span>
                        )}
                      </>
                    }
                    side="top"
                    maxWidth={180}
                  >
                    <span className={`inline-flex items-center text-[10px] font-bold
                                     px-1.5 py-0.5 rounded-full cursor-default ${ns.bg} ${ns.color}`}
                      aria-label={`Nutri-score grade ${ns.grade}`}
                    >
                      {ns.grade}
                    </span>
                  </Tooltip>
                );
              })()
            )}
          </div>

          {/* Price + cart */}
          <div className="flex items-center justify-between mt-auto pt-2 gap-2 border-t border-gray-100 dark:border-gray-800">
            <div className="min-w-0">
              <span className="text-base font-extrabold text-primary">
                {formatPrice(flashActive ? flashPrice : effectivePrice)}
              </span>
              {v && (flashActive ? flashPrice < v.mrp : v.sellingPrice < v.mrp) && (
                <span className="text-xs text-muted line-through ml-1.5">
                  {formatPrice(v.mrp)}
                </span>
              )}
              {flashActive && countdown && (
                <p className="text-[10px] text-red-500 dark:text-red-400 font-bold mt-0.5">
                  ⚡ {countdown}
                </p>
              )}
              {!flashActive && daysAgo !== null && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  {daysAgo === 0 ? "Ordered today" : `Ordered ${daysAgo}d ago`}
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
                             border-2 border-primary dark:border-primary/80"
                  onClick={(e) => e.preventDefault()}
                >
                  <button
                    onClick={handleDecrement}
                    className="w-7 h-7 flex items-center justify-center text-primary
                               hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-gray-800 dark:text-gray-100 leading-none">
                    {qty}
                  </span>
                  <button
                    onClick={handleAdd}
                    disabled={qty >= product.stockQty}
                    className="w-7 h-7 flex items-center justify-center text-primary
                               hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors
                               disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Increase quantity"
                  >
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
                  className="bg-primary hover:bg-primary-600 text-white w-8 h-8 rounded-xl
                             flex items-center justify-center transition-colors duration-150
                             disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-sm
                             shadow-primary/30"
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
