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

export default function ProductCard({
  product,
  priority = false,
}: {
  product: IProduct;
  priority?: boolean;
}) {
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

  const [imgError, setImgError]   = useState(false);
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
    addItem({
      productId: pid, variantSku: v.sku, name: product.name,
      image: product.images[0] ?? "/placeholder.png",
      unit: `${v.size}${v.unit}`, mrp: v.mrp, sellingPrice: flashPrice,
      quantity: 1, stock: product.stockQty,
    });
    if (qty === 0) {
      toast.success("Added to cart!");
      trackAddToCart(pid, product.name, v.sellingPrice, 1);
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: pid, event: "cart" }),
      }).catch(() => {});
    }
  }

  function handleDec(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    updateQuantity(pid, qty - 1);
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    toggle({
      productId: pid, name: product.name,
      image: product.images[0] ?? "/placeholder.png",
      slug: product.slug, price: v?.sellingPrice ?? 0, mrp: v?.mrp ?? 0,
    });
    if (isWishlisted) { toast("Removed from wishlist"); trackWishlistRemove(pid, product.name); }
    else              { toast.success("Added to wishlist!"); trackWishlistAdd(pid, product.name); }
  }

  return (
    <Link href={`/products/${product.slug}`} className="block group">
      <motion.article
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative flex flex-col overflow-hidden rounded-2xl h-full
                   bg-white dark:bg-gray-900
                   border border-gray-100 dark:border-gray-800
                   shadow-sm hover:shadow-xl dark:hover:shadow-black/40
                   transition-shadow duration-200"
      >
        {/* ── Image ───────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-800">

          {/* Delivery badge */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1
                          bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm
                          rounded-lg px-1.5 py-0.5 shadow-sm border border-gray-100 dark:border-gray-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-gray-700 dark:text-gray-300 tracking-wide">10 MIN</span>
          </div>

          {/* Discount / flash badge */}
          {showDiscount && (
            <div className="absolute top-2 right-2 z-10">
              {flashActive ? (
                <motion.div
                  animate={{ scale: [1, 1.07, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="flex items-center gap-0.5 bg-red-500 text-white
                             text-[10px] font-black px-1.5 py-0.5 rounded-lg"
                >
                  <Zap className="w-2.5 h-2.5" />{discountPct}%
                </motion.div>
              ) : (
                <div className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg">
                  {discountPct}% OFF
                </div>
              )}
            </div>
          )}

          {/* Organic badge (only when no discount) */}
          {product.isOrganic && !showDiscount && (
            <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5
                            bg-emerald-50 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700
                            text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
              <Leaf className="w-2.5 h-2.5" /> Organic
            </div>
          )}

          {/* Wishlist */}
          <motion.button
            onClick={handleWishlist}
            whileTap={{ scale: 0.7 }}
            aria-label="Wishlist"
            className="absolute bottom-2 right-2 z-10 w-7 h-7 rounded-full
                       bg-white dark:bg-gray-800 shadow-md flex items-center justify-center
                       border border-gray-100 dark:border-gray-700 cursor-pointer"
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-300 dark:text-gray-500"}`} />
          </motion.button>

          {/* Product image — full-bleed, object-cover */}
          <div className="aspect-square relative">
            {product.images[0] && !imgError ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
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
            <div className="absolute inset-0 z-20 flex items-center justify-center
                            bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400
                               bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full
                               border border-gray-200 dark:border-gray-700">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* ── Info ────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-1.5">

          {/* Category */}
          {categoryName && (
            <p className="text-[9px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 truncate">
              {categoryName}
            </p>
          )}

          {/* Name */}
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 flex-1
                         group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {product.name}
          </h3>

          {/* Size + reorder */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {v && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800
                               px-1.5 py-0.5 rounded-md font-medium">
                {v.size}{v.unit}
              </span>
            )}
            {hasOrdered(pid) && (
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                ✓ Ordered
              </span>
            )}
          </div>

          {/* Flash countdown */}
          {flashActive && countdown && (
            <span className="text-[10px] text-red-500 font-bold">⚡ {countdown}</span>
          )}

          {/* Stock urgency */}
          {!isOOS && product.stockQty <= 10 && (
            <span className={`text-[10px] font-bold ${product.stockQty <= 3 ? "text-red-500" : "text-orange-500"}`}>
              {product.stockQty <= 3 ? `⚡ Only ${product.stockQty} left!` : `Only ${product.stockQty} left`}
            </span>
          )}

          {/* Price + Add button */}
          <div className="flex items-center justify-between gap-2 mt-auto pt-1">
            <div>
              <span className="text-base font-black text-gray-900 dark:text-white leading-none">
                {formatPrice(displayPrice)}
              </span>
              {v && v.mrp > displayPrice && (
                <span className="block text-[11px] text-gray-400 line-through leading-none mt-0.5">
                  {formatPrice(v.mrp)}
                </span>
              )}
              {v && v.mrp > displayPrice && (
                <span className="inline-block text-[10px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Saves {formatPrice(v.mrp - displayPrice)}
                </span>
              )}
            </div>

            {/* Add / qty control */}
            <AnimatePresence mode="wait" initial={false}>
              {qty > 0 ? (
                <motion.div
                  key="qty"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1,    opacity: 1 }}
                  exit={{    scale: 0.85, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="flex items-center rounded-xl overflow-hidden shrink-0
                             border-2 border-emerald-500 dark:border-emerald-600"
                  onClick={e => e.preventDefault()}
                >
                  <button
                    onClick={handleDec}
                    aria-label="Remove"
                    className="w-8 h-8 flex items-center justify-center text-emerald-600 dark:text-emerald-400
                               hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-black text-gray-900 dark:text-white">
                    {qty}
                  </span>
                  <button
                    onClick={handleAdd}
                    disabled={qty >= product.stockQty}
                    aria-label="Add"
                    className="w-8 h-8 flex items-center justify-center
                               bg-emerald-500 dark:bg-emerald-600 text-white
                               hover:bg-emerald-400 dark:hover:bg-emerald-500 transition-colors
                               disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="add"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1,    opacity: 1 }}
                  exit={{    scale: 0.85, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={handleAdd}
                  disabled={isOOS}
                  aria-label="Add to cart"
                  className="flex items-center gap-1 px-3 h-9 rounded-xl shrink-0
                             bg-emerald-500 hover:bg-emerald-400
                             dark:bg-emerald-600 dark:hover:bg-emerald-500
                             text-white font-black text-xs
                             shadow-md shadow-emerald-500/25 dark:shadow-emerald-900/40
                             disabled:opacity-40 disabled:cursor-not-allowed
                             transition-colors duration-150 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  ADD
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
