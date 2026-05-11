"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
function loadMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as unknown as { google?: { maps?: unknown } }).google?.maps) { resolve(); return; }
    const cb = `_gm${Date.now()}`;
    const s  = document.createElement("script");
    s.src    = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${cb}`;
    s.async  = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)[cb] = () => { delete (window as any)[cb]; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
import {
  MapPin, CheckCircle2, Truck, ShoppingBag, Package,
  Phone, Loader2, Navigation, Clock,
} from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface TrackOrder {
  _id: string;
  orderNumber: string;
  status: "confirmed" | "out_for_delivery" | "delivered" | "cancelled" | "pending";
  deliveryAddress: { street: string; city: string; state: string; pincode: string };
  grandTotal: number;
  estimatedDelivery: { minHours: number; maxHours: number };
  items: { name: string; qty: number; price: number }[];
  deliveryPartner?: { name?: string; phone?: string; lat?: number; lng?: number };
  riderId?: { name?: string; phone?: string } | null;
}

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

const STEPS = [
  { key: "confirmed",        label: "Order Confirmed",   icon: ShoppingBag },
  { key: "out_for_delivery", label: "Out for Delivery",  icon: Truck },
  { key: "delivered",        label: "Delivered",         icon: CheckCircle2 },
];

const STATUS_STEP: Record<string, number> = {
  pending:          0,
  confirmed:        0,
  out_for_delivery: 1,
  delivered:        2,
  cancelled:        -1,
};

export default function TrackOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();

  const [order,      setOrder]      = useState<TrackOrder | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [riderPos,   setRiderPos]   = useState<{ lat: number; lng: number } | null>(null);
  const [delivered,  setDelivered]  = useState(false);

  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const riderMarker = useRef<google.maps.Marker | null>(null);
  const mapLoaded   = useRef(false);

  // Fetch order snapshot
  useEffect(() => {
    fetch(`/api/track/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setOrder(d.data);
          if (d.data.deliveryPartner?.lat) {
            setRiderPos({ lat: d.data.deliveryPartner.lat, lng: d.data.deliveryPartner.lng });
          }
          if (d.data.status === "delivered") setDelivered(true);
        }
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  // SSE — live rider location
  useEffect(() => {
    if (delivered) return;
    const es = new EventSource(`/api/track/${orderId}/live`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.lat != null && data.lng != null) setRiderPos({ lat: data.lat, lng: data.lng });
        if (data.status === "delivered") setDelivered(true);
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, [orderId, delivered]);

  // Init Google Maps
  useEffect(() => {
    if (!mapRef.current || mapLoaded.current || !MAPS_KEY) return;
    mapLoaded.current = true;

    loadMapsScript(MAPS_KEY).then(() => {
      if (!mapRef.current) return;
      mapInstance.current = new google.maps.Map(mapRef.current, {
        zoom:             15,
        center:           { lat: 19.076, lng: 72.877 },
        disableDefaultUI: true,
        zoomControl:      true,
        styles: [
          { featureType: "poi",    elementType: "labels", stylers: [{ visibility: "off" }] },
          { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
        ],
      });
    }).catch(() => {});
  }, []);

  // Geocode delivery address pin
  useEffect(() => {
    if (!order || !mapInstance.current || !window.google) return;
    const addr = `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state}`;
    new google.maps.Geocoder().geocode({ address: addr }, (results, status) => {
      if (status === "OK" && results?.[0] && mapInstance.current) {
        const loc = results[0].geometry.location;
        new google.maps.Marker({
          position: loc,
          map:      mapInstance.current,
          title:    "Your address",
          icon: {
            path:         google.maps.SymbolPath.CIRCLE,
            scale:        10,
            fillColor:    "#1A6B3A",
            fillOpacity:  1,
            strokeColor:  "#fff",
            strokeWeight: 2,
          },
        });
        mapInstance.current.setCenter(loc);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, mapInstance.current]);

  // Animate rider marker
  useEffect(() => {
    if (!riderPos || !mapInstance.current) return;
    const pos = { lat: riderPos.lat, lng: riderPos.lng };
    if (!riderMarker.current) {
      riderMarker.current = new google.maps.Marker({
        position: pos,
        map:      mapInstance.current,
        title:    "Delivery Partner",
        icon: {
          url:        "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="18" fill="#F97316"/>
              <text x="18" y="23" text-anchor="middle" font-size="18">🛵</text>
            </svg>`),
          scaledSize: new google.maps.Size(40, 40),
          anchor:     new google.maps.Point(20, 20),
        },
        zIndex: 10,
      });
    } else {
      riderMarker.current.setPosition(pos);
    }
    mapInstance.current.panTo(pos);
  }, [riderPos]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Package className="w-12 h-12 text-muted mb-4" />
        <p className="font-bold text-dark text-lg">Order not found</p>
        <Link href="/orders" className="mt-4 btn-primary">My Orders</Link>
      </div>
    );
  }

  const step     = delivered ? 2 : (STATUS_STEP[order.status] ?? 0);
  const riderName = order.riderId?.name ?? order.deliveryPartner?.name;
  const riderPhone = order.riderId?.phone ?? order.deliveryPartner?.phone;
  const isOutForDelivery = order.status === "out_for_delivery" && !delivered;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-border px-4 py-4 flex items-center gap-3">
        <Link href="/orders" className="p-2 rounded-xl hover:bg-accent transition-colors">
          <Navigation className="w-4 h-4 text-muted rotate-180" />
        </Link>
        <div>
          <p className="font-bold text-dark dark:text-white">Track Order</p>
          <p className="text-xs text-muted font-mono">{order.orderNumber}</p>
        </div>
        {isOutForDelivery && (
          <span className="ml-auto flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /> Live
          </span>
        )}
      </div>

      {/* Status timeline */}
      <div className="bg-white dark:bg-gray-900 px-5 py-5 border-b border-border">
        <div className="flex items-center justify-between">
          {STEPS.map((s, idx) => {
            const done   = idx <= step;
            const active = idx === step;
            const Icon   = s.icon;
            return (
              <div key={s.key} className="flex flex-col items-center flex-1 relative">
                {/* Connector line */}
                {idx > 0 && (
                  <div className={`absolute left-0 right-1/2 top-5 h-0.5 -translate-y-1/2
                                   ${idx <= step ? "bg-primary" : "bg-gray-200"}`} />
                )}
                {idx < STEPS.length - 1 && (
                  <div className={`absolute left-1/2 right-0 top-5 h-0.5 -translate-y-1/2
                                   ${idx < step ? "bg-primary" : "bg-gray-200"}`} />
                )}
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all
                                 ${done
                                   ? active ? "bg-primary shadow-md shadow-primary/30" : "bg-success"
                                   : "bg-gray-100 dark:bg-gray-800"}`}>
                  <Icon className={`w-5 h-5 ${done ? "text-white" : "text-muted"}`} />
                </div>
                <p className={`text-xs mt-1.5 text-center font-semibold leading-tight
                               ${done ? (active ? "text-primary" : "text-success") : "text-muted"}`}>
                  {s.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map (only when out for delivery) */}
      {isOutForDelivery && (
        <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={{ height: 260 }}>
          {MAPS_KEY ? (
            <div ref={mapRef} className="w-full h-full" />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex flex-col items-center justify-center gap-2 rounded-2xl">
              <MapPin className="w-10 h-10 text-muted" />
              <p className="text-muted text-sm font-medium">Live map unavailable</p>
              <p className="text-xs text-muted">Set NEXT_PUBLIC_GOOGLE_MAPS_KEY to enable</p>
            </div>
          )}
        </div>
      )}

      {/* Delivered banner */}
      {delivered && (
        <div className="mx-4 mt-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl shrink-0">🎉</div>
          <div>
            <p className="font-bold text-green-800 dark:text-green-300">Order Delivered!</p>
            <p className="text-sm text-green-700 dark:text-green-400">Enjoy your fresh groceries</p>
          </div>
        </div>
      )}

      {/* Rider info (when out for delivery) */}
      {isOutForDelivery && riderName && (
        <div className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-2xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-xl font-bold text-orange-600 shrink-0">
            {riderName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-dark dark:text-white text-sm">{riderName}</p>
            <p className="text-xs text-muted">Delivery Partner</p>
            {riderPos && (
              <p className="text-xs text-green-600 font-semibold mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Location live
              </p>
            )}
          </div>
          {riderPhone && (
            <a
              href={`tel:${riderPhone}`}
              className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 text-sm font-semibold"
            >
              <Phone className="w-4 h-4" /> Call
            </a>
          )}
        </div>
      )}

      {/* Order info */}
      <div className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-2xl border border-border p-5">
        <div className="flex items-start gap-3 mb-4">
          <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-0.5">Delivery Address</p>
            <p className="text-sm font-semibold text-dark dark:text-white">{order.deliveryAddress.street}</p>
            <p className="text-xs text-muted">{order.deliveryAddress.city}, {order.deliveryAddress.state} — {order.deliveryAddress.pincode}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted mb-4">
          <Clock className="w-3.5 h-3.5" />
          Estimated: {order.estimatedDelivery.minHours}–{order.estimatedDelivery.maxHours} hours from order
        </div>

        <div className="border-t border-border pt-4 space-y-1.5">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-dark dark:text-white">{item.name} <span className="text-muted">× {item.qty}</span></span>
              <span className="font-semibold text-dark dark:text-white">{formatPrice(item.price * item.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between text-base font-bold text-dark dark:text-white pt-2 border-t border-border mt-2">
            <span>Total</span>
            <span className="text-primary">{formatPrice(order.grandTotal)}</span>
          </div>
          <p className="text-xs text-muted">Payment: Cash on Delivery</p>
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}
