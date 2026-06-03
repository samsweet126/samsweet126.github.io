import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useList } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/chess")({
  head: () => ({ meta: [{ title: "Chess · Goal Tracker" }] }),
  component: () => (
    <RequireAuth>
      <AppLayout><ChessPage /></AppLayout>
    </RequireAuth>
  ),
});

const MODES: { key: string; label: string; type: string }[] = [
  { key: "chess_rapid", label: "Rapid", type: "rapid" },
  { key: "chess_blitz", label: "Blitz", type: "blitz" },
  { key: "chess_bullet", label: "Bullet", type: "bullet" },
  { key: "chess_daily", label: "Daily", type: "daily" },
];

function ChessPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [saved, setSaved] = useState("");
  const { data: snapshots = [] } = useList<any>("chess_ratings", "date");

  useEffect(() => {
    if (!user) return;
    supabase.from("chess_accounts").select("username").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.username) { setUsername(data.username); setSaved(data.username); }
    });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("chess_accounts").upsert({ user_id: user.id, username, updated_at: new Date().toISOString() });
    if (error) return toast.error(error.message);
    setSaved(username);
    toast.success("Username saved");
  };

  const stats = useQuery({
    queryKey: ["chess", saved],
    enabled: !!saved,
    queryFn: async () => {
      const res = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(saved.toLowerCase())}/stats`);
      if (!res.ok) throw new Error("User not found on Chess.com");
      return res.json();
    },
  });

  const snapshot = async () => {
    if (!user || !saved || !stats.data) return;
    const today = new Date().toISOString().slice(0, 10);
    const rows = MODES
      .map((m) => ({ mode: m, r: (stats.data as any)[m.key]?.last?.rating }))
      .filter((x) => x.r)
      .map(({ mode, r }) => ({ user_id: user.id, username: saved, rating: r, rating_type: mode.type, date: today }));
    if (!rows.length) return toast.error("No ratings to save");
    const { error } = await supabase.from("chess_ratings" as any).insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Saved ${rows.length} rating snapshots`);
    qc.invalidateQueries({ queryKey: ["chess_ratings"] });
  };

  return (
    <>
      <PageHeader title="Chess.com" description="Live ratings pulled from the Chess.com public API." />
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <Card className="p-4">
          <form onSubmit={save} className="flex gap-3 items-end">
            <div className="flex-1"><Label>Chess.com username</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. magnuscarlsen" required /></div>
            <Button type="submit">Save</Button>
          </form>
        </Card>

        {!saved && <p className="text-muted-foreground text-sm">Save a username above to see stats.</p>}
        {stats.isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
        {stats.isError && <p className="text-destructive text-sm">{(stats.error as Error).message}</p>}
        {stats.data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {MODES.map((m) => {
                const d: any = (stats.data as any)[m.key];
                const r = d?.last?.rating;
                const best = d?.best?.rating;
                const rec = d?.record;
                return (
                  <Card key={m.key}>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{m.label}</CardTitle></CardHeader>
                    <CardContent>
                      <div className="text-3xl font-semibold">{r ?? "—"}</div>
                      {best && <p className="text-xs text-muted-foreground mt-1">Best {best}</p>}
                      {rec && <p className="text-xs text-muted-foreground">{rec.win}W · {rec.loss}L · {rec.draw}D</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <Button onClick={snapshot} variant="secondary">Save snapshot for today</Button>
          </>
        )}

        {snapshots.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">Recent snapshots</h3>
            <div className="space-y-1 text-sm">
              {snapshots.slice(0, 20).map((s) => (
                <div key={s.id} className="flex justify-between text-muted-foreground">
                  <span>{s.date} · {s.rating_type}</span>
                  <span className="font-medium text-foreground">{s.rating}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
