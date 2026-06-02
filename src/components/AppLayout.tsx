import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Home, Plane, Trophy, Dumbbell, BookOpen, Film, Wallet, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/travel", label: "Travel", icon: Plane },
  { to: "/chess", label: "Chess", icon: Trophy },
  { to: "/fitness", label: "Fitness", icon: Dumbbell },
  { to: "/books", label: "Books", icon: BookOpen },
  { to: "/watching", label: "Movies & TV", icon: Film },
  { to: "/finance", label: "Finance", icon: Wallet },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="px-6 py-6">
          <h1 className="text-lg font-semibold tracking-tight text-sidebar-foreground">My Life</h1>
          <p className="text-xs text-muted-foreground">Personal tracker</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = path === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="border-b border-border bg-card/50">
      <div className="max-w-5xl mx-auto px-8 py-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
