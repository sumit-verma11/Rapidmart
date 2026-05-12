"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Heart, Zap } from "lucide-react";
import { ICategory, IProduct } from "@/types";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useUserActivity } from "@/store/userActivity";
import { trackAddToCart, trackWishlistAdd, trackWishlistRemove } from "@/lib/analytics";
import toast from "react-hot-toast";
import { haptic } from "@/lib/haptics";

export default function ProductCard({ product }: { product: IProduct }) {
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

  const flashEndsAt  = product.flashSale?.endsAt;
  const flashActive  = !!(flashEndsAt && new Date(flashEndsAt) > new Date());
  const flashPrice   = flashActive && v && product.flashSale
    ? Math.round(v.mrp * (1 - product.flashSale.discountPercent / 100))
    : v?.sellingPrice ?? 0;
  const displayPrice = flashActive ? flashPrice : (v?.sellingPrice ?? 0);
  const showDiscount = flashActive ? flashPrice < (v?.mrp ?? 0) : discount > 0;
  const discountPct  = flashActive && v
    ? Math.round((1 - flashPrice / v.mrp) * 100)
    : discount;

  const [imgError,   setImgError]   = useState(false);
  const [countdown,  setCountdown]  = useState<string | null>(null);

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
      toast.success("Added to cart!");
      trackAddToCart(pid, product.name, v.sellingPrice, 1);
      fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: pid, event: "cart" }) }).catch(() => {});
    }
  }

  function handleDec(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    haptic(30);
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
    <Link href={`/products/${product.slug}`} className="block">
      <article className="relative flex flex-col bg-white rounded-2xl overflow-hidden
                          border border-gray-100 shadow-sm h-full">

        {/* ── Image section ─────────────────────────────────── */}
        <div className="relative bg-gray-50">

          {/* Delivery badge — top left */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1
                          bg-white rounded-md px-1.5 py-0.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black text-gray-600 tracking-wide">8 MINS</span>
          </div>

          {/* Discount badge — top right */}
          {showDiscount && (
            <div className="absolute top-2 right-2 z-10">
              {flashActive ? (
                <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                  className="flex items-center gap-0.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                  <Zap className="w-2.5 h-2.5" />{discountPct}%
                </motion.div>
              ) : (
                <div className="bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                  {discountPct}% OFF
                </div>
              )}
            </div>
          )}

          {/* Wishlist — bottom right of image */}
          <motion.button onClick={handleWishlist} whileTap={{ scale: 0.7 }}
            className="absolute bottom-2 right-2 z-10 w-6 h-6 rounded-full
                       bg-white shadow flex items-center justify-center"
            aria-label="Wishlist">
            <Heart className={`w-3 h-3 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-300"}`} />
          </motion.button>

          {/* Image */}
          <div className="aspect-square relative">
            {product.images[0] && !imgError ? (
              <Image src={product.images[0]} alt={product.name} fill
                className="object-contain p-3"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20">🛒</div>
            )}
          </div>

          {/* OOS overlay */}
          {isOOS && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/75 backdrop-blur-[2px]">
              <span className="text-[10px] font-bold text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* ── Info section ──────────────────────────────────── */}
        <div className="flex flex-col flex-1 px-2.5 pt-2 pb-2.5 gap-1">

          {/* Category */}
          {categoryName && (
            <p className="text-[9px] uppercase tracking-widest font-bold text-gray-400 truncate">
              {categoryName}
            </p>
          )}

          {/* Name */}
          <h3 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2 flex-1">
            {product.name}
          </h3>

          {/* Weight */}
          {v && (
            <p className="text-[10px] text-gray-400 font-medium">{v.size}{v.unit}</p>
          )}

          {/* Reorder label */}
          {hasOrdered(pid) && (
            <p className="text-[9px] font-bold text-primary">✓ Ordered before</p>
          )}

          {/* Flash countdown */}
          {flashActive && countdown && (
            <p className="text-[9px] text-red-500 font-bold">⚡ {countdown}</p>
          )}

          {/* Price row + Add button */}
          <div className="flex items-center justify-between gap-1 mt-auto pt-1.5">

            {/* Price */}
            <div>
              <p className="text-sm font-black text-gray-900 leading-none">
                {formatPrice(displayPrice)}
              </p>
              {v && v.sellingPrice < v.mrp && (
                <p className="text-[10px] text-gray-400 line-through mt-0.5">
                  {formatPrice(v.mrp)}
                </p>
              )}
            </div>

            {/* Add / qty control */}
            <AnimatePresence mode="wait" initial={false}>
              {qty > 0 ? (
                <motion.div key="qty"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="flex items-center rounded-xl overflow-hidden border-2 border-primary shrink-0"
                  onClick={e => e.preventDefault()}>
                  <button onClick={handleDec} aria-label="Remove"
                    className="w-7 h-7 flex items-center justify-center text-primary
                               hover:bg-primary/10 transition-colors">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-black text-gray-900">{qty}</span>
                  <button onClick={handleAdd} disabled={qty >= product.stockQty} aria-label="Add"
                    className="w-7 h-7 flex items-center justify-center
                               bg-primary text-white transition-colors
                               disabled:opacity-40">
                    <Plus className="w-3 h-3" />
                  </button>
                </motion.div>
              ) : (
                <motion.button key="add"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={handleAdd} disabled={isOOS}
                  className="w-8 h-8 rounded-xl bg-primary text-white
                             flex items-center justify-center shrink-0
                             shadow-md shadow-primary/25
                             disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Add to cart">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </article>
    </Link>
  );
}
