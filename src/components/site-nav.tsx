import { Link, useNavigate } from "@tanstack/react-router";
import { Crown, Radar, ShoppingBag, Bookmark, LogIn, LogOut, User as UserIcon, Bell } from "lucide-react";
import { PRODUCTS, PLATFORMS, type Platform } from "@/lib/products-data";
import { useSavedProducts } from "@/hooks/use-saved-products";
import { usePriceAlerts } from "@/hooks/use-price-alerts";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const baseCls =
  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition border-border/60 bg-surface/40 text-muted-foreground hover:text-foreground";
const accentCls =
  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition border-primary/50 bg-primary/15 text-primary hover:bg-primary/25";
const activeProps = { className: "!text-foreground !border-primary/60 !bg-primary/10" };

export function SiteNav() {
  const { items: saved } = useSavedProducts();
  const { unreadCount } = usePriceAlerts();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary glow-primary">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg font-bold leading-none">ProfitHunter</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Winning Product Radar
            </div>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm">
          <Link to="/" activeOptions={{ exact: true }} className={baseCls} activeProps={activeProps}>
            <ShoppingBag className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <Link to="/hunt" className={accentCls} activeProps={activeProps}>
            <Radar className="h-3.5 w-3.5" /> Run Hunter
          </Link>
          <Link to="/saved" className={baseCls} activeProps={activeProps}>
            <Bookmark className="h-3.5 w-3.5" /> Saved
            {user && saved.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/20 px-1.5 text-[10px] font-bold text-primary">
                {saved.length}
              </span>
            )}
          </Link>
          <Link to="/alerts" className={baseCls} activeProps={activeProps}>
            <Bell className="h-3.5 w-3.5" /> Alerts
            {user && unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-gold/25 px-1.5 text-[10px] font-bold text-gold">
                {unreadCount}
              </span>
            )}
          </Link>
          {PLATFORMS.map((p) => (
            <Link
              key={p.value}
              to="/store/$platform"
              params={{ platform: p.value as Platform }}
              className={baseCls}
              activeProps={activeProps}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
              {p.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground md:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"></span>
            {PRODUCTS.length} products · 4 marketplaces
          </div>
          {!loading && (user ? (
            <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-surface/60 px-1 py-1 text-xs">
              <div className="flex items-center gap-1.5 pl-2 pr-1">
                <UserIcon className="h-3.5 w-3.5 text-primary" />
                <span className="hidden max-w-[140px] truncate text-foreground sm:inline">
                  {user.email}
                </span>
              </div>
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Link to="/auth" className={accentCls}>
              <LogIn className="h-3.5 w-3.5" /> Sign in
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
