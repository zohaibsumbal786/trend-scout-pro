import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import type { HuntPlatform } from "@/lib/hunter.functions";

export type PriceAlert = {
  id: string;
  savedProductId: string;
  url: string;
  title: string;
  platform: HuntPlatform;
  oldPrice: number | null;
  newPrice: number;
  targetPrice: number;
  readAt: string | null;
  createdAt: string;
  currency: string;
  rawNewPrice: number | null;
  shippingUsd: number | null;
  taxUsd: number | null;
};

type Row = {
  id: string;
  saved_product_id: string;
  product_url: string;
  title: string;
  platform: string;
  old_price: number | string | null;
  new_price: number | string;
  target_price: number | string;
  read_at: string | null;
  created_at: string;
  currency: string | null;
  raw_new_price: number | string | null;
  shipping_usd: number | string | null;
  tax_usd: number | string | null;
};

function rowToAlert(r: Row): PriceAlert {
  return {
    id: r.id,
    savedProductId: r.saved_product_id,
    url: r.product_url,
    title: r.title,
    platform: r.platform as HuntPlatform,
    oldPrice: r.old_price == null ? null : Number(r.old_price),
    newPrice: Number(r.new_price),
    targetPrice: Number(r.target_price),
    readAt: r.read_at,
    createdAt: r.created_at,
    currency: (r.currency ?? "USD").toUpperCase(),
    rawNewPrice: r.raw_new_price == null ? null : Number(r.raw_new_price),
    shippingUsd: r.shipping_usd == null ? null : Number(r.shipping_usd),
    taxUsd: r.tax_usd == null ? null : Number(r.tax_usd),
  };
}

export function usePriceAlerts() {
  const { user } = useAuth();
  const [items, setItems] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const userIdRef = useRef<string | null>(null);

  const refetch = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(100);
    setItems(((data ?? []) as Row[]).map(rowToAlert));
  }, []);

  useEffect(() => {
    if (!user) {
      userIdRef.current = null;
      setItems([]);
      return;
    }
    const uid = user.id;
    userIdRef.current = uid;
    setLoading(true);
    refetch(uid).finally(() => setLoading(false));

    const channel = supabase
      .channel(`price_alerts:${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "price_alerts", filter: `user_id=eq.${uid}` },
        () => {
          if (userIdRef.current === uid) refetch(uid);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  const unreadCount = items.filter((a) => !a.readAt).length;

  const markRead = useCallback(
    async (id: string) => {
      if (!user) return;
      await supabase
        .from("price_alerts")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);
    },
    [user],
  );

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("price_alerts")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
  }, [user]);

  const remove = useCallback(
    async (id: string) => {
      if (!user) return;
      await supabase.from("price_alerts").delete().eq("id", id).eq("user_id", user.id);
    },
    [user],
  );

  const clear = useCallback(async () => {
    if (!user) return;
    await supabase.from("price_alerts").delete().eq("user_id", user.id);
  }, [user]);

  return { items, loading, unreadCount, markRead, markAllRead, remove, clear };
}
