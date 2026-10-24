import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPricingPrefs, savePricingPrefs } from "@/lib/price-watch.functions";
import { DEFAULT_PREFS, type PricingPrefs } from "@/lib/normalize";
import { useAuth } from "./use-auth";

export function usePricingPrefs() {
  const { user } = useAuth();
  const load = useServerFn(getPricingPrefs);
  const persist = useServerFn(savePricingPrefs);
  const [prefs, setPrefs] = useState<PricingPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setPrefs(DEFAULT_PREFS);
      return;
    }
    setLoading(true);
    load()
      .then((p) => setPrefs(p ?? DEFAULT_PREFS))
      .catch(() => setPrefs(DEFAULT_PREFS))
      .finally(() => setLoading(false));
  }, [user, load]);

  const save = useCallback(
    async (next: PricingPrefs) => {
      setPrefs(next); // optimistic
      const res = await persist({ data: next });
      return res;
    },
    [persist],
  );

  return { prefs, loading, save };
}
