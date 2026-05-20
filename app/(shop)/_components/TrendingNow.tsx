"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { IProduct } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { haptic } from "@/lib/haptics";
import toast from "react-hot-toast";

// Deterministic "ordered today" count seeded from product name
function seedCount(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return 18 + Math.abs(h % 83); // 18–100
}

export default function TrendingNow() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const { addItem, items } = useCartStore();

  useEffect(() => {
    fetch("/api/products?limit=12&available=true&sort=name")
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.data.slice(0, 12)); })
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="px-3 pt-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white leading-tight">
              Trending Now
            </h2>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
              Popular in your area right now
            </p>
          </div>
        </div>
        <Link href="#shop" className="text-xs font-bold text-primary hover:underline shrink-0">
          See all →
        </Link>
      </div>

      {/* Horizontal scroll strip */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3">
        {products.map((product, i) => {
          const v = product.variants?.[0];
          if (!v) return null;
          const count     = seedCount(product.name);
          const inCart    = items.some((x) => x.productId === product._id.toString());
          const isOOS     = !product.isAvailable || product.stockQty === 0;

          return (
            <motion.div
              key={product._id.toString()}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 25 }}
              className="shrink-0 w-[120px] flex flex-col"
            >
              <Link href={`/products/${product.slug}`} className="block mb-1.5">
                {/* Image box */}
                <div className="relative rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 aspect-square mb-2">
                  {/* Rank badge */}
                  {i < 3 && (
                    <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-0.5
                                    bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow">
                      <Flame className="w-2.5 h-2.5" />#{i + 1}
                    </div>
                  )}
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="120px"
                      className="object-contain p-2 transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-20">🛒</div>
                  )}
                </div>

                <p className="text-[11px] font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight mb-0.5">
                  {product.name}
                </p>
                <p className="text-xs font-black text-gray-900 dark:text-white">{formatPrice(v.sellingPrice)}</p>
                <p className="text-[10px] text-red-500 font-bold mt-0.5">🔥 {count} ordered today</p>
              </Link>

              <button
                disabled={isOOS}
                onClick={() => {
                  haptic(40);
                  addItem({
                    productId:   product._id.toString(),
                    variantSku:  v.sku,
                    name:        product.name,
                    image:       product.images?.[0] ?? "/placeholder.png",
                    unit:        `${v.size}${v.unit}`,
                    mrp:         v.mrp,
                    sellingPrice: v.sellingPrice,
                    quantity:    1,
                    stock:       product.stockQty,
                  });
                  if (!inCart) toast.success("Added to cart!");
                }}
                className="mt-auto w-full py-1.5 rounded-xl text-[11px] font-black transition-colors cursor-pointer
                           bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-600 dark:hover:bg-emerald-500
                           text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isOOS ? "Out of Stock" : inCart ? "✓ In Cart" : "+ ADD"}
              </button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
