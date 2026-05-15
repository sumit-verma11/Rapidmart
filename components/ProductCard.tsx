"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Heart, Leaf, Zap } from "lucide-react";
import { ICategory, IProduct } from "@/types";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useUserActivity } from "@/store/userActivity";
import { trackAddToCart, trackWishlistAdd, trackWishlistRemove } from "@/lib/analytics";
import toast from "react-hot-toast";
import { haptic } from "@/lib/haptics";

export default function ProductCard({ product, priority = false }: { product: IProduct; priority?: boolean }) {
  const { items, addItem, updateQuantity } = useCartStore();
  const { toggle, has } = useWishlistStore();
  const { hasOrdered } = useUserActivity();

  const v            = product.variants[0];
  const discount     = v ? calculateDiscount(v.mrp, v.sellingPrice) : 0;
  const isOOS        = !product.isAvailable || product.stockQty === 0;
  const isWishlisted = has(product._id.toString());
  const cartItem     = items.find(i => i.productId === product._id.toString() && i.variantSku === v?.sku);
  const qty          = cartItem?.quantity ?? 0;
  const pid          = product._id.toString();

  const flashEndsAt = product.flashSale?.endsAt;
  const flashActive = !!(flashEndsAt && new Date(flashEndsAt) > new Date());
  const flashPrice  = flashActive && v && product.flashSale
    ? Math.round(v.mrp * (1 - product.flashSale.discountPercent / 100))
    : v?.sellingPrice ?? 0;
  const displayPrice = flashActive ? flashPrice : (v?.sellingPrice ?? 0);
  const showDiscount = flashActive ? flashPrice < (v?.mrp ?? 0) : discount > 0;
  const discountPct  = flashActive && v
    ? Math.round((1 - flashPrice / v.mrp) * 100)
    : discount;

  const [imgError, setImgError] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  useEffect(() => {
    if (!flashActive || !flashEndsAt) return;
    const tick = () => {
      const ms = new Date(flashEndsAt).getTime() - Date.now();
      if (ms <= 0) { setCountdown(null); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setCountdown(`${m}:${String(s).padStart(2, "0")}`);
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
      toast.success(`Added to cart!`);
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
    if (isWishlisted) { toast("Removed from wishlist"); trackWishlistRemove(pid, product.name); }
    else { toast.success("Added to wishlist!"); trackWishlistAdd(pid, product.name); }
  }

  return (
    <Link href={`/products/${product.slug}`} className="block group">
      <motion.article
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative flex flex-col overflow-hidden rounded-2xl h-full
                   bg-white dark:bg-gray-900
                   border border-gray-100 dark:border-gray-800
                   shadow-sm hover:shadow-lg dark:hover:shadow-black/30
                   transition-shadow duration-200"
      >
        {/* ── Image area ─────────────────────────────── */}
        <div className="relative bg-gray-50 dark:bg-gray-800 overflow-hidden">
          {/* Delivery time badge — Blinkit style */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1
                          bg-white dark:bg-gray-900 rounded-lg px-1.5 py-0.5 shadow-sm
                          border border-gray-100 dark:border-gray-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-gray-700 dark:text-gray-300">8 MINS</span>
          </div>

          {/* Discount badge */}
          {showDiscount && (
            <div className="absolute top-2 right-2 z-10">
              {flashActive ? (
                <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                  className="flex items-center gap-0.5 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg">
                  <Zap className="w-2.5 h-2.5" />{discountPct}%
                </motion.div>
              ) : (
                <div className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg">
                  {discountPct}% OFF
                </div>
              )}
            </div>
          )}

          {/* Organic badge */}
          {product.isOrganic && !showDiscount && (
            <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5
                            bg-emerald-50 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700
                            text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
              <Leaf className="w-2.5 h-2.5" /> Organic
            </div>
          )}

          {/* Wishlist */}
          <motion.button onClick={handleWishlist} whileTap={{ scale: 0.7 }}
            className="absolute bottom-2 right-2 z-10 w-7 h-7 rounded-full
                       bg-white dark:bg-gray-800 shadow-md flex items-center justify-center
                       border border-gray-100 dark:border-gray-700"
            aria-label="Wishlist">
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-300 dark:text-gray-500"}`} />
          </motion.button>

          {/* Product image */}
          <div className="aspect-square relative">
            {product.images[0] && !imgError ? (
              <Image src={product.images[0]} alt={product.name} fill
                className="object-contain p-4 transition-transform duration-400 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                priority={priority}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">🛒</div>
            )}
          </div>

          {/* OOS overlay */}
          {isOOS && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* ── Info area ──────────────────────────────── */}
        <div className="flex flex-col flex-1 p-3 gap-2">

          {/* Category */}
          {categoryName && (
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 truncate">
              {categoryName}
            </p>
          )}

          {/* Name */}
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 flex-1
                         group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {product.name}
          </h3>

          {/* Size */}
          {v && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{v.size}{v.unit}</p>
          )}

          {/* Reorder chip */}
          {hasOrdered(pid) && (
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✓ Ordered before</p>
          )}

          {/* Price + Add button — Blinkit style */}
          <div className="flex items-end justify-between gap-2 pt-1 mt-auto">
            <div className="flex flex-col">
              <span className="text-base font-black text-gray-900 dark:text-white leading-none">
                {formatPrice(displayPrice)}
              </span>
              {v && v.sellingPrice < v.mrp && (
                <span className="text-[11px] text-gray-400 line-through mt-0.5">
                  {formatPrice(v.mrp)}
                </span>
              )}
              {flashActive && countdown && (
                <span className="text-[10px] text-red-500 font-bold mt-0.5">⚡ {countdown}</span>
              )}
            </div>

            {/* Add / qty control */}
            <AnimatePresence mode="wait" initial={false}>
              {qty > 0 ? (
                <motion.div key="qty"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="flex items-center gap-0 rounded-xl overflow-hidden shrink-0
                             border-2 border-emerald-500 dark:border-emerald-600"
                  onClick={e => e.preventDefault()}>
                  <button onClick={handleDec} aria-label="Remove"
                    className="w-8 h-8 flex items-center justify-center
                               text-emerald-600 dark:text-emerald-400
                               hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-black text-gray-900 dark:text-white">{qty}</span>
                  <button onClick={handleAdd} disabled={qty >= product.stockQty} aria-label="Add"
                    className="w-8 h-8 flex items-center justify-center
                               bg-emerald-500 dark:bg-emerald-600 text-white
                               hover:bg-emerald-400 dark:hover:bg-emerald-500 transition-colors
                               disabled:opacity-40">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ) : (
                <motion.button key="add"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={handleAdd} disabled={isOOS}
                  className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400
                             dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white
                             flex items-center justify-center shrink-0
                             shadow-md shadow-emerald-500/20 dark:shadow-emerald-900/40
                             disabled:opacity-40 disabled:cursor-not-allowed
                             transition-colors duration-150"
                  aria-label="Add to cart">
                  <Plus className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
