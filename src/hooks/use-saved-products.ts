import { useEffect, useState, useCallback, useRef } from "react";
import type { HuntResult, HuntPlatform } from "@/lib/hunter.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type SavedProduct = HuntResult & {
  id: string;
  savedAt: number;
  query: string;
  note?: string;
  targetPrice: number | null;
  lastKnownPrice: number | null;
  lastCheckedAt: string | null;
  sourceCurrency: string | null;
  lastKnownCurrency: string | null;
  lastKnownRawPrice: number | null;
  lastKnownShippingUsd: number | null;
  lastKnownTaxUsd: number | null;
};

type Row = {
  id: string;
  product_url: string;
  platform: string;
  title: string;
  price: number | string | null;
  description: string | null;
  thumbnail: string | null;
  query: string;
  note: string | null;
  created_at: string;
  target_price: number | string | null;
  last_known_price: number | string | null;
  last_checked_at: string | null;
  source_currency: string | null;
  last_known_currency: string | null;
  last_known_raw_price: number | string | null;
  last_known_shipping_usd: number | string | null;
  last_known_tax_usd: number | string | null;
};

function rowToSaved(r: Row): SavedProduct {
  return {
    id: r.id,
    url: r.product_url,
    platform: r.platform as HuntPlatform,
    title: r.title,
    price: r.price == null ? null : Number(r.price),
    description: r.description ?? "",
    image: r.thumbnail,
    query: r.query ?? "",
    note: r.note ?? undefined,
    savedAt: new Date(r.created_at).getTime(),
    targetPrice: r.target_price == null ? null : Number(r.target_price),
    lastKnownPrice: r.last_known_price == null ? null : Number(r.last_known_price),
    lastCheckedAt: r.last_checked_at,
    sourceCurrency: r.source_currency ?? null,
    lastKnownCurrency: r.last_known_currency ?? null,
    lastKnownRawPrice: r.last_known_raw_price == null ? null : Number(r.last_known_raw_price),
    lastKnownShippingUsd:
      r.last_known_shipping_usd == null ? null : Number(r.last_known_shipping_usd),
    lastKnownTaxUsd: r.last_known_tax_usd == null ? null : Number(r.last_known_tax_usd),
  };
}

export function useSavedProducts() {
  const { user } = useAuth();
  const [items, setItems] = useState<SavedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const userIdRef = useRef<string | null>(null);

  const refetch = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("saved_products")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setItems(((data ?? []) as Row[]).map(rowToSaved));
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
      .channel(`saved_products:${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "saved_products", filter: `user_id=eq.${uid}` },
        () => {
          if (userIdRef.current === uid) refetch(uid);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  const isSaved = useCallback(
    (url: string) => items.some((i) => i.url === url),
    [items],
  );

  const save = useCallback(
    async (result: HuntResult, query: string) => {
      if (!user) return { error: "Sign in to save products" };
      const { error } = await supabase.from("saved_products").upsert(
        {
          user_id: user.id,
          product_url: result.url,
          platform: result.platform,
          title: result.title,
          price: result.price,
          description: result.description,
          thumbnail: result.image,
          query,
        },
        { onConflict: "user_id,product_url" },
      );
      return { error: error?.message };
    },
    [user],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user) return;
      // id can be DB uuid or url (legacy)
      const matchUrl = items.find((i) => i.id === id)?.url ?? id;
      await supabase
        .from("saved_products")
        .delete()
        .eq("user_id", user.id)
        .or(`id.eq.${id},product_url.eq.${matchUrl}`);
    },
    [user, items],
  );

  const toggle = useCallback(
    async (result: HuntResult, query: string) => {
      if (!user) return { error: "Sign in to save products" };
      const existing = items.find((i) => i.url === result.url);
      if (existing) {
        await supabase.from("saved_products").delete().eq("id", existing.id);
        return { error: undefined };
      }
      return save(result, query);
    },
    [user, items, save],
  );

  const clear = useCallback(async () => {
    if (!user) return;
    await supabase.from("saved_products").delete().eq("user_id", user.id);
  }, [user]);

  const byPlatform = useCallback(
    (platform: HuntPlatform) => items.filter((i) => i.platform === platform),
    [items],
  );

  return { items, loading, isSaved, save, remove, toggle, clear, byPlatform };
}
