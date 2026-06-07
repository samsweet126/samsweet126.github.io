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
const CHESS_FLOOR = 1200;

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

function BooksGoalWidget({ books2026 }: { books2026: number }) {
  const BOOKS_GOAL = 30;
  const pct = Math.min(100, Math.round((books2026 / BOOKS_GOAL) * 100));

  return (
    <Link to="/books">
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Books</CardTitle>
          <BookOpen className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-semibold">{books2026}</div>
              <p className="text-xs text-muted-foreground">Read in 2026</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium text-muted-foreground">{BOOKS_GOAL}</div>
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

function FinancesGoalWidget({ currentAmount }: { currentAmount: number | null }) {
  const FINANCES_GOAL = 600;
  const pct = currentAmount ? Math.min(100, Math.round((currentAmount / FINANCES_GOAL) * 100)) : 0;

  return (
    <Link to="/finances">
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Finances</CardTitle>
          <Wallet className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-semibold">{currentAmount ? `$${currentAmount.toFixed(2)}` : "—"}</div>
              <p className="text-xs text-muted-foreground">Current</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium text-muted-foreground">${FINANCES_GOAL}</div>
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

function WeightGoalWidget({ currentWeight }: { currentWeight: number | null }) {
  const WEIGHT_GOAL = 215;
  const WEIGHT_START = 240;
  const pct = currentWeight
    ? Math.max(0, Math.min(100, Math.round(((WEIGHT_START - currentWeight) / (WEIGHT_START - WEIGHT_GOAL)) * 100)))
    : 0;

  return (
    <Link to="/weight">
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Weight</CardTitle>
          <Dumbbell className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-semibold">{currentWeight ? `${currentWeight.toFixed(1)}` : "—"}</div>
              <p className="text-xs text-muted-foreground">Current</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium text-muted-foreground">{WEIGHT_GOAL} lbs</div>
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
  const weights = useList<any>("weights", "date");
  const books = useList<any>("books", "date_finished");
  const financesBalance = useList<any>("finances_balance", "date");

  const chessStats = useQuery({
    queryKey: ["chess", CHESS_USERNAME],
    queryFn: async () => {
      const res = await fetch(`https://api.chess.com/pub/player/${CHESS_USERNAME}/stats`);
      if (!res.ok) throw new Error("Chess.com fetch failed");
      return res.json();
    },
  });
  const rapidRating = (chessStats.data as any)?.chess_rapid?.last?.rating;

  const books2026 = (books.data ?? []).filter((b) => b.date_finished?.startsWith("2026")).length;
  const currentWeight = weights.data && weights.data.length > 0 ? weights.data[0].weight : null;
  const currentAmount = financesBalance.data && financesBalance.data.length > 0 ? Number(financesBalance.data[0].amount) : null;
  const flights = (trips.data ?? []).filter((t) => t.travel_type === "flight").length;

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="max-w-5xl mx-auto px-8 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat to="/travel" icon={Plane} label="Travel" value={`${trips.data?.length ?? 0} trips`} sub={`${flights} flights`} />
        <ChessGoalWidget rating={rapidRating} />
        <BooksGoalWidget books2026={books2026} />
        <WeightGoalWidget currentWeight={currentWeight} />
        <FinancesGoalWidget currentAmount={currentAmount} />
      </div>
    </>
  );
}
