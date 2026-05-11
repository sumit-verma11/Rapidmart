"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
  MapPin, Package, Navigation, CheckCircle2, Loader2,
  Phone, ArrowLeft, IndianRupee, AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice } from "@/lib/utils";

interface TrackOrder {
  _id: string;
  orderNumber: string;
  status: string;
  deliveryAddress: { street: string; city: string; state: string; pincode: string };
  grandTotal: number;
  items: { name: string; qty: number; price: number }[];
  deliveryPartner?: { name?: string; phone?: string; lat?: number; lng?: number };
  riderId?: { name: string; phone?: string } | null;
}

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

export default function RiderDeliveryPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router      = useRouter();

  const [order,       setOrder]       = useState<TrackOrder | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [delivering,  setDelivering]  = useState(false);
  const [gpsError,    setGpsError]    = useState("");
  const [riderPos,    setRiderPos]    = useState<{ lat: number; lng: number } | null>(null);

  const mapRef          = useRef<HTMLDivElement>(null);
  const mapInstance     = useRef<google.maps.Map | null>(null);
  const riderMarker     = useRef<google.maps.Marker | null>(null);
  const destMarker      = useRef<google.maps.Marker | null>(null);
  const locationRef     = useRef<number | null>(null);
  const lastSentRef     = useRef<number>(0);
  const mapLoaded       = useRef(false);

  // Fetch order details
  useEffect(() => {
    fetch(`/api/track/${orderId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrder(d.data); })
      .catch(() => toast.error("Failed to load order"))
      .finally(() => setLoading(false));
  }, [orderId]);

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

  // Geocode destination once order is loaded
  useEffect(() => {
    if (!order || !mapInstance.current) return;
    const addr = `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state}`;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: addr }, (results, status) => {
      if (status === "OK" && results?.[0] && mapInstance.current) {
        const loc = results[0].geometry.location;
        destMarker.current = new google.maps.Marker({
          position: loc,
          map:      mapInstance.current,
          title:    "Delivery Location",
          icon: {
            path:         google.maps.SymbolPath.CIRCLE,
            scale:        10,
            fillColor:    "#EF4444",
            fillOpacity:  1,
            strokeColor:  "#fff",
            strokeWeight: 2,
          },
        });
        new google.maps.InfoWindow({ content: `<b>📦 Delivery</b><br/>${order.deliveryAddress.street}` })
          .open(mapInstance.current, destMarker.current);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, mapInstance.current]);

  // Update rider marker on map
  useEffect(() => {
    if (!riderPos || !mapInstance.current) return;
    const pos = { lat: riderPos.lat, lng: riderPos.lng };
    if (!riderMarker.current) {
      riderMarker.current = new google.maps.Marker({
        position: pos,
        map:      mapInstance.current,
        title:    "You",
        icon: {
          path:         google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale:        6,
          fillColor:    "#1A6B3A",
          fillOpacity:  1,
          strokeColor:  "#fff",
          strokeWeight: 2,
        },
        zIndex: 10,
      });
    } else {
      riderMarker.current.setPosition(pos);
    }
    mapInstance.current.panTo(pos);
  }, [riderPos]);

  // Start GPS tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) { setGpsError("GPS not supported on this device"); return; }

    locationRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setRiderPos({ lat, lng });
        setGpsError("");

        // Throttle server updates to max once every 10s
        const now = Date.now();
        if (now - lastSentRef.current < 10_000) return;
        lastSentRef.current = now;

        fetch("/api/rider/location", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ orderId, lat, lng }),
        }).catch(() => {});
      },
      (err) => {
        setGpsError(err.code === 1 ? "Location permission denied" : "GPS signal lost");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, [orderId]);

  useEffect(() => {
    startTracking();
    return () => {
      if (locationRef.current != null) navigator.geolocation.clearWatch(locationRef.current);
    };
  }, [startTracking]);

  async function markDelivered() {
    if (!confirm("Mark order as delivered?")) return;
    setDelivering(true);
    try {
      const res  = await fetch(`/api/rider/orders/${orderId}/deliver`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      toast.success("Order delivered! 🎉");
      router.push("/rider");
    } catch {
      toast.error("Network error");
    } finally {
      setDelivering(false);
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-danger mb-4" />
        <p className="font-bold text-dark text-lg">Order not found</p>
        <button onClick={() => router.push("/rider")} className="mt-4 btn-primary">Back to Dashboard</button>
      </div>
    );
  }

  const mapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state}`
  )}&travelmode=driving`;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-border z-10">
        <button onClick={() => router.push("/rider")} className="p-2 rounded-xl hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-dark dark:text-white text-sm truncate">{order.orderNumber}</p>
          <p className="text-xs text-muted truncate">{order.deliveryAddress.city}, {order.deliveryAddress.pincode}</p>
        </div>
        {riderPos ? (
          <span className="flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> GPS Live
          </span>
        ) : (
          <span className="flex items-center gap-1.5 bg-gray-100 text-muted text-xs font-semibold px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-gray-400" /> GPS...
          </span>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {MAPS_KEY ? (
          <div ref={mapRef} className="w-full h-full" />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-muted mx-auto mb-2" />
              <p className="text-muted text-sm font-medium">Map requires NEXT_PUBLIC_GOOGLE_MAPS_KEY</p>
              {riderPos && (
                <p className="text-xs text-muted mt-1">GPS: {riderPos.lat.toFixed(5)}, {riderPos.lng.toFixed(5)}</p>
              )}
            </div>
          </div>
        )}

        {/* GPS error banner */}
        {gpsError && (
          <div className="absolute top-3 left-3 right-3 bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 z-10">
            <AlertCircle className="w-4 h-4 shrink-0" /> {gpsError}
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl px-5 pt-4 pb-8 z-10">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

        {/* Address */}
        <div className="flex items-start gap-3 mb-4 p-3 bg-accent rounded-2xl">
          <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-0.5">Deliver to</p>
            <p className="font-semibold text-dark dark:text-white text-sm">{order.deliveryAddress.street}</p>
            <p className="text-xs text-muted">{order.deliveryAddress.city}, {order.deliveryAddress.state} — {order.deliveryAddress.pincode}</p>
          </div>
        </div>

        {/* Items + total */}
        <div className="flex items-center gap-3 mb-5 text-sm">
          <div className="flex items-center gap-1.5 text-muted">
            <Package className="w-4 h-4" />
            {order.items.length} item{order.items.length > 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-1 font-bold text-dark dark:text-white">
            <IndianRupee className="w-4 h-4" />
            {formatPrice(order.grandTotal)}
            <span className="text-xs text-orange-600 font-semibold ml-1">COD</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href={mapsNavUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-3.5 px-5 text-sm font-bold transition-colors"
          >
            <Navigation className="w-4 h-4" /> Navigate
          </a>
          {order.riderId && (order.riderId as { phone?: string }).phone && (
            <a
              href={`tel:${(order.riderId as { phone?: string }).phone}`}
              className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-dark dark:text-white rounded-2xl py-3.5 px-5 text-sm font-bold"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={markDelivered}
            disabled={delivering}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl py-3.5 text-sm font-bold disabled:opacity-60 transition-colors"
          >
            {delivering ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Mark Delivered
          </button>
        </div>
      </div>
    </div>
  );
}
