import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useList } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/travel")({
  head: () => ({ meta: [{ title: "Travel · Goal Tracker" }] }),
  component: () => (
    <RequireAuth>
      <AppLayout><TravelPage /></AppLayout>
    </RequireAuth>
  ),
});

// Geocode a city+state to lat/lon using OpenStreetMap Nominatim (free, no key needed)
async function geocode(city: string, state: string): Promise<{ lat: number; lon: number } | null> {
  const q = encodeURIComponent(`${city}, ${state}, USA`);
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
    headers: { "Accept-Language": "en" },
  });
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

// Haversine great-circle distance in miles
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function TravelPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useList<any>("trips", "date");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    departure_city: "",
    departure_state: "",
    city: "",
    state: "",
    date: "",
    travel_type: "flight",
    airline: "",
    roundtrip: false,
  });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      // Geocode both cities
      const [origin, dest] = await Promise.all([
        geocode(form.departure_city, form.departure_state),
        geocode(form.city, form.state),
      ]);

      let miles: number | null = null;
      if (origin && dest) {
        miles = Math.round(haversine(origin.lat, origin.lon, dest.lat, dest.lon));
        if (form.roundtrip) miles *= 2;
      } else {
        toast.error("Couldn't calculate miles — check city/state names");
      }

      const { error } = await supabase.from("trips").insert({
        user_id: user.id,
        departure_city: form.departure_city,
        departure_state: form.departure_state,
        city: form.city,
        state: form.state,
        date: form.date,
        travel_type: form.travel_type,
        airline: form.travel_type === "flight" ? (form.airline || null) : null,
        roundtrip: form.roundtrip,
        miles,
      });

      if (error) return toast.error(error.message);
      setForm({ departure_city: "", departure_state: "", city: "", state: "", date: "", travel_type: "flight", airline: "", roundtrip: false });
      qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success(miles ? `Trip added · ${miles.toLocaleString()} miles` : "Trip added");
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["trips"] });
  };

  const flights = data.filter((t) => t.travel_type === "flight").length;
  const drives = data.filter((t) => t.travel_type === "drive").length;
  const totalMiles = data.reduce((a: number, t: any) => a + Number(t.miles ?? 0), 0);

  return (
    <>
      <PageHeader title="Travel log" description={`${data.length} trips · ${flights} flights · ${drives} drives · ${totalMiles.toLocaleString()} miles`} />
      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        <Card className="p-4">
          <form onSubmit={add} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              {/* Departure */}
              <div className="sm:col-span-6 text-xs font-medium text-muted-foreground uppercase tracking-wide">Departure</div>
              <div className="sm:col-span-2">
                <Label>Departure city</Label>
                <Input required value={form.departure_city} onChange={(e) => setForm({ ...form, departure_city: e.target.value })} />
              </div>
              <div>
                <Label>State</Label>
                <Input required value={form.departure_state} onChange={(e) => setForm({ ...form, departure_state: e.target.value })} placeholder="IL" maxLength={2} />
              </div>

              {/* Destination */}
              <div className="sm:col-span-6 text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">Destination</div>
              <div className="sm:col-span-2">
                <Label>Destination city</Label>
                <Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label>State</Label>
                <Input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="NY" maxLength={2} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.travel_type} onValueChange={(v) => setForm({ ...form, travel_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flight">Flight</SelectItem>
                    <SelectItem value="drive">Drive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.travel_type === "flight" && (
                <div>
                  <Label>Airline</Label>
                  <Input value={form.airline} onChange={(e) => setForm({ ...form, airline: e.target.value })} />
                </div>
              )}
              <div className="flex items-center gap-3 sm:col-span-6">
                <Switch checked={form.roundtrip} onCheckedChange={(v) => setForm({ ...form, roundtrip: v })} id="rt" />
                <Label htmlFor="rt" className="cursor-pointer">Roundtrip (doubles miles)</Label>
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Calculating miles…</> : "Add trip"}
            </Button>
          </form>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Airline</TableHead>
                <TableHead>Roundtrip</TableHead>
                <TableHead className="text-right">Miles</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No trips yet.</TableCell>
                </TableRow>
              )}
              {data.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell>{t.departure_city ? `${t.departure_city}, ${t.departure_state}` : "—"}</TableCell>
                  <TableCell className="font-medium">{t.city}, {t.state}</TableCell>
                  <TableCell>{t.date}</TableCell>
                  <TableCell className="capitalize">{t.travel_type}</TableCell>
                  <TableCell>{t.airline ?? "—"}</TableCell>
                  <TableCell>{t.roundtrip ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">{t.miles ? t.miles.toLocaleString() : "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => del(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
