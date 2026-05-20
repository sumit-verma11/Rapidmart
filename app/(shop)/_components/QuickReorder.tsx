"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RotateCcw, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

interface OrderItem {
  productId: string;
  variantSku: string;
  name: string;
  qty: number;
  price: number;
}

interface LastOrder {
  _id: string;
  placedAt: string;
  grandTotal: number;
  items: OrderItem[];
}

export default function QuickReorder() {
  const { data: session, status } = useSession();
  const { addItem } = useCartStore();
  const [order, setOrder]     = useState<LastOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    fetch("/api/orders?page=1")
      .then((r) => r.json())
      .then((d) => {
        const list: LastOrder[] = d.data ?? [];
        if (list.length > 0) setOrder(list[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  if (status !== "authenticated" || loading || !order || order.items.length === 0) return null;

  const daysAgo = Math.round(
    (Date.now() - new Date(order.placedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  function handleReorder() {
    if (!order) return;
    order.items.forEach((item) => {
      addItem({
        productId:    item.productId,
        variantSku:   item.variantSku,
        name:         item.name,
        image:        "/placeholder.png",
        unit:         "",
        mrp:          item.price,
        sellingPrice: item.price,
        quantity:     item.qty,
        stock:        99,
      });
    });
    setDone(true);
    toast.success(`${order.items.length} items added to cart!`);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38 }}
      className="px-3 pt-4 max-w-7xl mx-auto"
    >
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800
                      rounded-2xl p-4 shadow-sm">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 dark:text-white">Order Again</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Last ordered {daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`}
                {" · "}{formatPrice(order.grandTotal)}
              </p>
            </div>
          </div>

          <button
            onClick={handleReorder}
            disabled={done}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold
                       bg-primary hover:bg-primary/90 disabled:opacity-60
                       transition-colors cursor-pointer shadow-sm shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {done ? "Added!" : "Reorder All"}
          </button>
        </div>

        {/* Item chips */}
        <div className="flex flex-wrap gap-2">
          {order.items.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800
                         border border-gray-100 dark:border-gray-700
                         rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300"
            >
              {item.name}
              <span className="text-gray-400 dark:text-gray-500 font-normal">×{item.qty}</span>
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
