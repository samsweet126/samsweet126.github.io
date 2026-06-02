import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useList } from "@/lib/queries";
import { Plane, Dumbbell, BookOpen, Trophy, Wallet } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard · My Life" }, { name: "description", content: "Personal life tracker dashboard" }] }),
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

function Dashboard() {
  const trips = useList<any>("trips", "date");
  const workouts = useList<any>("workouts", "date");
  const books = useList<any>("books", "date_finished");
  const finances = useList<any>("finances", "date");

  const flights = (trips.data ?? []).filter((t) => t.travel_type === "flight").length;
  const totalMinutes = (workouts.data ?? []).reduce((a, w) => a + Number(w.time_minutes ?? 0), 0);
  const totalMiles = (workouts.data ?? []).reduce((a, w) => a + Number(w.miles ?? 0), 0);
  const totalSpend = (finances.data ?? []).reduce((a, f) => a + Number(f.amount ?? 0), 0);

  return (
    <>
      <PageHeader title="Dashboard" description="A snapshot of your life this season." />
      <div className="max-w-5xl mx-auto px-8 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat to="/travel" icon={Plane} label="Travel" value={`${trips.data?.length ?? 0} trips`} sub={`${flights} flights`} />
        <Stat to="/chess" icon={Trophy} label="Chess" value="View ratings" sub="From Chess.com" />
        <Stat to="/fitness" icon={Dumbbell} label="Fitness" value={`${workouts.data?.length ?? 0} sessions`} sub={`${totalMiles.toFixed(1)} mi · ${Math.round(totalMinutes / 60)} h`} />
        <Stat to="/books" icon={BookOpen} label="Books read" value={`${books.data?.length ?? 0}`} sub={books.data?.[0]?.title ? `Last: ${books.data[0].title}` : "—"} />
        <Stat to="/finances" icon={Wallet} label="Finances" value={`$${totalSpend.toFixed(2)}`} sub={`${finances.data?.length ?? 0} entries`} />
      </div>
    </>
  );
}
