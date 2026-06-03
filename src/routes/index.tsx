import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useList } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { Plane, Dumbbell, BookOpen, Trophy, Wallet } from "lucide-react";
import { Link } from "@tanstack/react-router";

const CHESS_USERNAME = "sam12678";
const CHESS_GOAL = 1500;
const CHESS_FLOOR = 400;

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard · Goal Tracker" }, { name: "description", content: "Personal life tracker dashboard" }] }),
  component: () => (
    <RequireAuth>
      <AppLayout>
        <Dashboard />
      </AppLayout>
    </RequireAuth>
  ),
});

function Stat({ to, icon: Icon, label, value, sub }: any) {
  return (
    <Link to={to}>
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <Icon className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{value}</div>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

function ChessGoalWidget({ rating }: { rating: number | undefined }) {
  const pct = rating
    ? Math.min(100, Math.round(((rating - CHESS_FLOOR) / (CHESS_GOAL - CHESS_FLOOR)) * 100))
    : 0;

  return (
    <Link to="/chess">
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Chess</CardTitle>
          <Trophy className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-semibold">{rating ?? "—"}</div>
              <p className="text-xs text-muted-foreground">Rapid rating</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium text-muted-foreground">{CHESS_GOAL}</div>
              <p className="text-xs text-muted-foreground">Goal</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">{pct}% to goal</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function Dashboard() {
  const trips = useList<any>("trips", "date");
  const workouts = useList<any>("workouts", "date");
  const books = useList<any>("books", "date_finished");
  const finances = useList<any>("finances", "date");

  const chessStats = useQuery({
    queryKey: ["chess", CHESS_USERNAME],
    queryFn: async () => {
      const res = await fetch(`https://api.chess.com/pub/player/${CHESS_USERNAME}/stats`);
      if (!res.ok) throw new Error("Chess.com fetch failed");
      return res.json();
    },
  });
  const rapidRating = (chessStats.data as any)?.chess_rapid?.last?.rating;

  const flights = (trips.data ?? []).filter((t) => t.travel_type === "flight").length;
  const totalMinutes = (workouts.data ?? []).reduce((a, w) => a + Number(w.time_minutes ?? 0), 0);
  const totalMiles = (workouts.data ?? []).reduce((a, w) => a + Number(w.miles ?? 0), 0);
  const totalSpend = (finances.data ?? []).reduce((a, f) => a + Number(f.amount ?? 0), 0);

  return (
    <>
      <PageHeader title="Dashboard" description="A snapshot of your life this season." />
      <div className="max-w-5xl mx-auto px-8 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat to="/travel" icon={Plane} label="Travel" value={`${trips.data?.length ?? 0} trips`} sub={`${flights} flights`} />
        <ChessGoalWidget rating={rapidRating} />
        <Stat to="/fitness" icon={Dumbbell} label="Fitness" value={`${workouts.data?.length ?? 0} sessions`} sub={`${totalMiles.toFixed(1)} mi · ${Math.round(totalMinutes / 60)} h`} />
        <Stat to="/books" icon={BookOpen} label="Books read" value={`${books.data?.length ?? 0}`} sub={books.data?.[0]?.title ? `Last: ${books.data[0].title}` : "—"} />
        <Stat to="/finances" icon={Wallet} label="Finances" value={`$${totalSpend.toFixed(2)}`} sub={`${finances.data?.length ?? 0} entries`} />
      </div>
    </>
  );
}
