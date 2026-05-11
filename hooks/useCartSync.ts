"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cart";
import { useWishlistStore, WishlistItem } from "@/store/wishlist";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { IClientCartItem } from "@/types";

export function useCartSync() {
  const { items: cartItems, setItems: setCartItems, clearCart }     = useCartStore();
  const { items: wishItems, add: addWish, clear: clearWishlist }    = useWishlistStore();
  const { data: session, status }  = useSession();
  const isOnline                   = useOnlineStatus();

  const clientId   = useRef(
    typeof crypto !== "undefined"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  );
  const prevCartJson    = useRef("");
  const prevWishJson    = useRef("");
  const debouncer       = useRef<ReturnType<typeof setTimeout>>();
  const wasOffline      = useRef(false);
  const loadedForUser   = useRef<string | null>(null);

  // ── BroadcastChannel: instant cross-tab sync ────────────────────────────────
  useEffect(() => {
    const bc = new BroadcastChannel("rapidmart-cart");
    bc.onmessage = (e: MessageEvent<{ from: string; items: IClientCartItem[] }>) => {
      if (e.data.from !== clientId.current) setCartItems(e.data.items);
    };
    return () => bc.close();
  }, [setCartItems]);

  // ── Load user's cart + wishlist from server on login ────────────────────────
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    if (loadedForUser.current === session.user.id) return; // already loaded for this user
    loadedForUser.current = session.user.id;

    fetch("/api/user/state")
      .then((r) => r.json())
      .then(({ cart, wishlist }) => {
        // Replace local state with server state for this user
        setCartItems((cart as IClientCartItem[]) ?? []);
        clearWishlist();
        ((wishlist as WishlistItem[]) ?? []).forEach((item) => addWish(item));
        // Seed the prev refs so the save effect below doesn't immediately re-save
        prevCartJson.current    = JSON.stringify(cart ?? []);
        prevWishJson.current    = JSON.stringify(wishlist ?? []);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id]);

  // ── Reset loaded flag on logout so next login re-fetches ────────────────────
  useEffect(() => {
    if (status === "unauthenticated") {
      loadedForUser.current = null;
    }
  }, [status]);

  // ── Save cart + wishlist to server whenever they change ─────────────────────
  useEffect(() => {
    if (!session?.user?.id || !isOnline) return;

    const cartJson = JSON.stringify(cartItems);
    const wishJson = JSON.stringify(wishItems);
    if (cartJson === prevCartJson.current && wishJson === prevWishJson.current) return;
    prevCartJson.current = cartJson;
    prevWishJson.current = wishJson;

    // Also broadcast cart changes to other tabs
    try {
      const bc = new BroadcastChannel("rapidmart-cart");
      bc.postMessage({ from: clientId.current, items: cartItems });
      bc.close();
    } catch { /* SSR guard */ }

    // Debounce server save to avoid hammering on rapid changes
    clearTimeout(debouncer.current);
    debouncer.current = setTimeout(() => {
      fetch("/api/user/state", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ cart: cartItems, wishlist: wishItems }),
      }).catch(() => {});

      // Also broadcast via SSE for cross-device cart sync
      fetch("/api/cart/sync", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ items: cartItems, clientId: clientId.current }),
      }).catch(() => {});
    }, 800);
  }, [cartItems, wishItems, session?.user?.id, isOnline]);

  // ── Reconnect sync ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOnline) { wasOffline.current = true; return; }
    if (wasOffline.current && session?.user?.id) {
      wasOffline.current = false;
      toast("🔁 Back online — cart synced", { duration: 2500 });
      fetch("/api/user/state", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ cart: cartItems, wishlist: wishItems }),
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, session?.user?.id]);

  // ── SSE: receive cross-device cart updates ───────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id) return;
    const es = new EventSource(`/api/cart/sync?clientId=${clientId.current}`);
    es.addEventListener("cartUpdate", (e: MessageEvent) => {
      try {
        const { items: newItems } = JSON.parse(e.data) as { items: IClientCartItem[] };
        setCartItems(newItems);
      } catch { /* ignore */ }
    });
    return () => es.close();
  }, [session?.user?.id, setCartItems]);
}
