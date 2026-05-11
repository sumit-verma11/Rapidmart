"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  MapPin, Package, CheckCircle2, Navigation, Loader2,
  RefreshCw, Clock, IndianRupee, Bike, ChevronRight, LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice } from "@/lib/utils";

interface OrderItem { name: string; qty: number; price: number }
interface DeliveryAddress { street: string; city: string; state: string; pincode: string }
interface RiderOrder {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  deliveryAddress: DeliveryAddress;
  grandTotal: number;
  placedAt: string;
  estimatedDelivery: { minHours: number; maxHours: number };
}

export default function RiderDashboard() {
  const { data: session } = useSession();
  const [available,  setAvailable]  = useState<RiderOrder[]>([]);
  const [active,     setActive]     = useState<RiderOrder | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [accepting,  setAccepting]  = useState<string | null>(null);
  const [delivering, setDelivering] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res  = await fetch("/api/rider/orders");
      const data = await res.json();
      if (data.success) {
        setAvailable(data.available ?? []);
        setActive(data.active ?? null);
      }
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Auto-refresh every 30 s
  useEffect(() => {
    const t = setInterval(fetchOrders, 30_000);
    return () => clearInterval(t);
  }, [fetchOrders]);

  async function acceptOrder(orderId: string) {
    setAccepting(orderId);
    try {
      const res  = await fetch(`/api/rider/orders/${orderId}/accept`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      toast.success("Order accepted!");
      fetchOrders();
    } catch {
      toast.error("Network error");
    } finally {
      setAccepting(null);
    }
  }

  async function markDelivered(orderId: string) {
    if (!confirm("Mark this order as delivered?")) return;
    setDelivering(true);
    try {
      const res  = await fetch(`/api/rider/orders/${orderId}/deliver`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      toast.success("Marked as delivered! 🎉");
      setActive(null);
      fetchOrders();
    } catch {
      toast.error("Network error");
    } finally {
      setDelivering(false);
    }
  }

  const todayEarnings = active ? active.grandTotal : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary to-green-700 px-5 pt-10 pb-20 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
              {session?.user?.name?.[0]?.toUpperCase() ?? "R"}
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">{session?.user?.name ?? "Rider"}</p>
              <p className="text-green-200 text-xs">Delivery Partner</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchOrders} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/rider-login" })}
              className="p-2 rounded-xl bg-white/10 hover:bg-red-500/60 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bike className="w-4 h-4 text-green-200" />
              <span className="text-xs text-green-200">Active</span>
            </div>
            <p className="text-2xl font-bold">{active ? 1 : 0}</p>
            <p className="text-xs text-green-200">delivery</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="w-4 h-4 text-green-200" />
              <span className="text-xs text-green-200">Pending</span>
            </div>
            <p className="text-2xl font-bold">{formatPrice(todayEarnings)}</p>
            <p className="text-xs text-green-200">COD to collect</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-10 pb-8 space-y-5">

        {/* ── Active delivery ─────────────────────────────────────────────── */}
        {active && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg overflow-hidden border-2 border-orange-300 dark:border-orange-700">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 flex items-center gap-2">
              <Bike className="w-4 h-4 text-white" />
              <span className="text-white font-bold text-sm">Active Delivery</span>
              <span className="ml-auto text-white/80 text-xs font-mono">{active.orderNumber}</span>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-dark dark:text-white text-sm">{active.deliveryAddress.street}</p>
                  <p className="text-muted text-xs">{active.deliveryAddress.city}, {active.deliveryAddress.state} — {active.deliveryAddress.pincode}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted mb-4">
                <Package className="w-3.5 h-3.5" />
                {active.items.length} item{active.items.length > 1 ? "s" : ""}
                <span className="mx-1">·</span>
                <IndianRupee className="w-3.5 h-3.5" />
                <span className="font-semibold text-dark dark:text-white">{formatPrice(active.grandTotal)} COD</span>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/rider/delivery/${active._id}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-2xl py-3 text-sm font-bold"
                >
                  <Navigation className="w-4 h-4" /> Live Map
                </Link>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${active.deliveryAddress.street}, ${active.deliveryAddress.city}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-2xl py-3 px-4 text-sm font-bold"
                >
                  <Navigation className="w-4 h-4" />
                </a>
                <button
                  onClick={() => markDelivered(active._id)}
                  disabled={delivering}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white rounded-2xl py-3 text-sm font-bold disabled:opacity-60"
                >
                  {delivering ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Delivered
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Available orders ────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-dark dark:text-white text-base">
              Available Orders
              {available.length > 0 && (
                <span className="ml-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{available.length}</span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : available.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-10 text-center">
              <Clock className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="font-semibold text-dark dark:text-white">No orders right now</p>
              <p className="text-muted text-sm mt-1">Pull down to refresh</p>
            </div>
          ) : (
            <div className="space-y-3">
              {available.map((order) => (
                <div key={order._id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-border overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-muted">{order.orderNumber}</span>
                      <span className="text-xs text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {order.estimatedDelivery.minHours}–{order.estimatedDelivery.maxHours}h window
                      </span>
                    </div>

                    <div className="flex items-start gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-dark dark:text-white">{order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
                        <p className="text-xs text-muted">{order.deliveryAddress.pincode}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted mb-4">
                      <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {order.items.length} items</span>
                      <span className="flex items-center gap-1 font-semibold text-dark dark:text-white">
                        <IndianRupee className="w-3.5 h-3.5" />{formatPrice(order.grandTotal)} COD
                      </span>
                    </div>

                    <button
                      onClick={() => acceptOrder(order._id)}
                      disabled={!!accepting || !!active}
                      className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-2xl py-3 text-sm font-bold disabled:opacity-50"
                    >
                      {accepting === order._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <><ChevronRight className="w-4 h-4" /> Accept Order</>
                      )}
                    </button>
                    {active && (
                      <p className="text-xs text-center text-muted mt-2">Complete your active delivery first</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
