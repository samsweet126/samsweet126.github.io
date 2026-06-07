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
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useList } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trash2, Loader2, MapPin } from "lucide-react";

export const Route = createFileRoute("/travel")({
  head: () => ({ meta: [{ title: "Travel · Goal Tracker" }] }),
  component: () => (
    <RequireAuth>
      <AppLayout><TravelPage /></AppLayout>
    </RequireAuth>
  ),
});

interface CityResult {
  city: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  display: string;
}

async function searchCities(query: string): Promise<CityResult[]> {
  if (query.length < 2) return [];
  const key = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

  // Step 1: Autocomplete
  const acRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${key}`
  );
  const acData = await acRes.json();
  if (!acData.predictions?.length) return [];

  // Step 2: Get details (lat/lon + address components) for each prediction
  const results = await Promise.all(
    acData.predictions.slice(0, 6).map(async (p: any) => {
      const detailRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=geometry,address_components,name&key=${key}`
      );
      const detail = await detailRes.json();
      const comps: any[] = detail.result?.address_components || [];
      const get = (type: string) => comps.find((c: any) => c.types.includes(type))?.long_name || "";
      const city = get("locality") || get("administrative_area_level_2") || detail.result?.name || "";
      const state = get("administrative_area_level_1");
      const country = get("country");
      const lat = detail.result?.geometry?.location?.lat;
      const lon = detail.result?.geometry?.location?.lng;
      return { city, state, country, lat, lon, display: p.description };
    })
  );

  return results.filter((r) => r.city && r.lat);
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface CitySearchProps {
  label: string;
  onSelect: (result: CityResult) => void;
  value: string;
}

function CitySearch({ label, onSelect, value }: CitySearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<CityResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (query.length < 2) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      const r = await searchCities(query);
      setResults(r);
      setOpen(r.length > 0);
      setLoading(false);
    }, 350);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search city…"
          autoComplete="off"
        />
        {loading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-w-sm bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              className="w-full flex items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted transition-colors border-b border-border last:border-0"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(r);
                setQuery(`${r.city}, ${r.state || r.country}`);
                setOpen(false);
              }}
            >
              <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div>
                <div className="font-medium">{r.city}</div>
                <div className="text-xs text-muted-foreground">{[r.state, r.country].filter(Boolean).join(", ")}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface LocationFields {
  city: string;
  state: string;
  country: string;
  lat: number | null;
  lon: number | null;
}

const emptyLocation = (): LocationFields => ({ city: "", state: "", country: "", lat: null, lon: null });

function TravelPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useList<any>("trips", "date");
  const [loading, setLoading] = useState(false);
  const [departure, setDeparture] = useState<LocationFields>(emptyLocation());
  const [destination, setDestination] = useState<LocationFields>(emptyLocation());
  const [form, setForm] = useState({ date: "", travel_type: "flight", airline: "", roundtrip: false });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !departure.city || !destination.city) {
      toast.error("Select both a departure and destination city");
      return;
    }
    setLoading(true);
    try {
      let miles: number | null = null;
      if (departure.lat && departure.lon && destination.lat && destination.lon) {
        miles = Math.round(haversine(departure.lat, departure.lon, destination.lat, destination.lon));
        if (form.roundtrip) miles *= 2;
      }

      const { error } = await supabase.from("trips").insert({
        user_id: user.id,
        departure_city: departure.city,
        departure_state: departure.state,
        city: destination.city,
        state: destination.state,
        country: destination.country,
        date: form.date,
        travel_type: form.travel_type,
        airline: form.travel_type === "flight" ? (form.airline || null) : null,
        roundtrip: form.roundtrip,
        miles,
      });

      if (error) return toast.error(error.message);
      setDeparture(emptyLocation());
      setDestination(emptyLocation());
      setForm({ date: "", travel_type: "flight", airline: "", roundtrip: false });
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

  const flights = data.filter((t: any) => t.travel_type === "flight").length;
  const drives = data.filter((t: any) => t.travel_type === "drive").length;
  const totalMiles = Math.round(data.reduce((a: number, t: any) => a + Number(t.miles ?? 0), 0));
  const statesVisited = new Set(data.map((t: any) => t.state).filter(Boolean)).size;
  const countriesVisited = new Set(data.map((t: any) => t.country).filter(Boolean)).size;

  return (
    <>
      <PageHeader title="Travel log" description={`${data.length} trips · ${flights} flights · ${drives} drives · ${totalMiles.toLocaleString()} miles`} />
      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        <Card className="p-4">
          <form onSubmit={add} className="space-y-5">
            {/* Departure */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Departure</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <CitySearch
                  label="City"
                  value={departure.city}
                  onSelect={(r) => setDeparture({ city: r.city, state: r.state, country: r.country, lat: r.lat, lon: r.lon })}
                />
                <div>
                  <Label>State / Region</Label>
                  <Input value={departure.state} onChange={(e) => setDeparture({ ...departure, state: e.target.value })} />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input value={departure.country} onChange={(e) => setDeparture({ ...departure, country: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Destination */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Destination</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <CitySearch
                  label="City"
                  value={destination.city}
                  onSelect={(r) => setDestination({ city: r.city, state: r.state, country: r.country, lat: r.lat, lon: r.lon })}
                />
                <div>
                  <Label>State / Region</Label>
                  <Input value={destination.state} onChange={(e) => setDestination({ ...destination, state: e.target.value })} />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input value={destination.country} onChange={(e) => setDestination({ ...destination, country: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Trip details */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
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
              <div className="flex items-center gap-3">
                <Switch checked={form.roundtrip} onCheckedChange={(v) => setForm({ ...form, roundtrip: v })} id="rt" />
                <Label htmlFor="rt" className="cursor-pointer">Roundtrip</Label>
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Calculating miles…</> : "Add trip"}
            </Button>
          </form>
        </Card>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total miles", value: totalMiles.toLocaleString() },
            { label: "Flights", value: flights },
            { label: "States visited", value: statesVisited },
            { label: "Countries visited", value: countriesVisited },
          ].map((m) => (
            <Card key={m.label} className="p-4 text-center">
              <div className="text-3xl font-semibold">{m.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
            </Card>
          ))}
        </div>

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
                  <TableCell>{t.departure_city ? `${t.departure_city}${t.departure_state ? `, ${t.departure_state}` : ""}` : "—"}</TableCell>
                  <TableCell className="font-medium">{t.city}{t.state ? `, ${t.state}` : ""}{t.country ? ` · ${t.country}` : ""}</TableCell>
                  <TableCell>{t.date}</TableCell>
                  <TableCell className="capitalize">{t.travel_type}</TableCell>
                  <TableCell>{t.airline ?? "—"}</TableCell>
                  <TableCell>{t.roundtrip ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">{t.miles ? Number(t.miles).toLocaleString() : "—"}</TableCell>
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
