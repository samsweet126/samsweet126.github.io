import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useList } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/chess")({
  head: () => ({ meta: [{ title: "Chess · Goal Tracker" }] }),
  component: () => (
    <RequireAuth>
      <AppLayout><ChessPage /></AppLayout>
    </RequireAuth>
  ),
});

const USERNAME = "sam12678";

function ChessPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: snapshots = [] } = useList<any>("chess_ratings", "date");

  const rapidSnapshots = (snapshots as any[])
    .filter((s) => s.rating_type === "rapid")
    .slice(0, 30)
    .reverse();

  const stats = useQuery({
    queryKey: ["chess", USERNAME],
    queryFn: async () => {
      const res = await fetch(`https://api.chess.com/pub/player/${USERNAME}/stats`);
      if (!res.ok) throw new Error("User not found on Chess.com");
      return res.json();
    },
  });

  const rapidRating = (stats.data as any)?.chess_rapid?.last?.rating;
  const rapidBest = (stats.data as any)?.chess_rapid?.best?.rating;
  const rapidRecord = (stats.data as any)?.chess_rapid?.record;

  const snapshot = async () => {
    if (!user || !stats.data) return;
    const today = new Date().toISOString().slice(0, 10);
    if (!rapidRating) return toast.error("No rapid rating to save");
    const { error } = await supabase.from("chess_ratings" as any).insert([
      { user_id: user.id, username: USERNAME, rating: rapidRating, rating_type: "rapid", date: today },
    ]);
    if (error) return toast.error(error.message);
    toast.success("Rapid rating snapshot saved");
    qc.invalidateQueries({ queryKey: ["chess_ratings"] });
  };

  return (
    <>
      <PageHeader title="Chess.com" description={`Live rapid rating for ${USERNAME}`} />
      <div className="max-w-3xl mx-auto px-8 py-8 space-y-6">
        {stats.isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
        {stats.isError && <p className="text-destructive text-sm">{(stats.error as Error).message}</p>}

        {stats.data && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Rapid Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-semibold">{rapidRating ?? "—"}</div>
                {rapidBest && <p className="text-xs text-muted-foreground mt-1">Best {rapidBest}</p>}
                {rapidRecord && (
                  <p className="text-xs text-muted-foreground">{rapidRecord.win}W · {rapidRecord.loss}L · {rapidRecord.draw}D</p>
                )}
              </CardContent>
            </Card>
            <Button onClick={snapshot} variant="secondary">Save snapshot for today</Button>
          </>
        )}

        <Card className="p-4">
          <h3 className="text-sm font-medium mb-4">Rapid rating over time</h3>
          {rapidSnapshots.length === 0 ? (
            <p className="text-muted-foreground text-sm py-12 text-center">Save snapshots to see your rating history here.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={rapidSnapshots}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="rating" dot={true} strokeWidth={2} className="stroke-primary" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </>
  );
}
