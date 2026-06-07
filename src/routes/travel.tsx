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
import { Trash2, Loader2, MapPin, Plus, X } from "lucide-react";

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

function searchCities(query: string): Promise<CityResult[]> {
  return new Promise((resolve) => {
    if (query.length < 2 || !(window as any).google) return resolve([]);
    const svc = new (window as any).google.maps.places.AutocompleteService();
    svc.getPlacePredictions(
      { input: query, types: ["(cities)"] },
      (predictions: any[], status: string) => {
        if (status !== "OK" || !predictions?.length) return resolve([]);
        const geocoder = new (window as any).google.maps.Geocoder();
        Promise.all(
          predictions.slice(0, 6).map(
            (p: any) =>
              new Promise<CityResult | null>((res) => {
                geocoder.geocode({ placeId: p.place_id }, (results: any[], s: string) => {
                  if (s !== "OK" || !results[0]) return res(null);
                  const comps = results[0].address_components;
                  const get = (type: string) =>
                    comps.find((c: any) => c.types.includes(type))?.long_name || "";
                  res({
                    city: get("locality") || get("administrative_area_level_2") || p.structured_formatting.main_text,
                    state: get("administrative_area_level_1"),
                    country: get("country"),
                    lat: results[0].geometry.location.lat(),
                    lon: results[0].geometry.location.lng(),
                    display: p.description,
                  });
                });
              })
          )
        ).then((all) => resolve(all.filter(Boolean) as CityResult[]));
      }
    );
  });
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
        <div className="absolute z-50 mt-1 w-full min-w-[260px] bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              className="w-full flex items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted transition-colors border-b border-border last:border-0"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(r);
                setQuery(`${r.city}${r.state ? `, ${r.state}` : ""}`);
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
  airport: string;
  lat: number | null;
  lon: number | null;
}

const emptyLocation = (): LocationFields => ({ city: "", state: "", country: "", airport: "", lat: null, lon: null });

function LocationBlock({
  label,
  loc,
  onChange,
  showAirport,
}: {
  label: string;
  loc: LocationFields;
  onChange: (l: LocationFields) => void;
  showAirport?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-1">
          <CitySearch
            label="City"
            value={loc.city}
            onSelect={(r) => onChange({ ...loc, city: r.city, state: r.state, country: r.country, lat: r.lat, lon: r.lon })}
          />
        </div>
        <div>
          <Label>State / Region</Label>
          <Input value={loc.state} onChange={(e) => onChange({ ...loc, state: e.target.value })} />
        </div>
        <div>
          <Label>Country</Label>
          <Input value={loc.country} onChange={(e) => onChange({ ...loc, country: e.target.value })} />
        </div>
        {showAirport && (
          <div>
            <Label>Airport</Label>
            <Input value={loc.airport} onChange={(e) => onChange({ ...loc, airport: e.target.value })} placeholder="e.g. JFK" />
          </div>
        )}
      </div>
    </div>
  );
}

function TravelPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useList<any>("trips", "date");
  const [loading, setLoading] = useState(false);
  const [multiCity, setMultiCity] = useState(false);
  const [departure, setDeparture] = useState<LocationFields>(emptyLocation());
  const [stops, setStops] = useState<LocationFields[]>([emptyLocation()]);
  const [form, setForm] = useState({ date: "", travel_type: "flight", airline: "", roundtrip: false });

  const addStop = () => setStops([...stops, emptyLocation()]);
  const removeStop = (i: number) => setStops(stops.filter((_, idx) => idx !== i));
  const updateStop = (i: number, loc: LocationFields) => setStops(stops.map((s, idx) => idx === i ? loc : s));

  const calcMiles = (points: LocationFields[]) => {
    let miles = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      if (a.lat && a.lon && b.lat && b.lon) {
        miles += haversine(a.lat, a.lon, b.lat, b.lon);
      }
    }
    return Math.round(miles);
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !departure.city || !stops[0].city) {
      toast.error("Select both a departure and destination city");
      return;
    }
    setLoading(true);
    try {
      const allPoints = [departure, ...stops];
      let miles = calcMiles(allPoints);
      if (form.roundtrip) miles *= 2;

      const mainDest = stops[0];
      const extraStops = stops.slice(1);

      const { error } = await supabase.from("trips").insert({
        user_id: user.id,
        departure_city: departure.city,
        departure_state: departure.state,
        city: mainDest.city,
        state: mainDest.state,
        country: mainDest.country,
        destination_airport: mainDest.airport || null,
        date: form.date,
        travel_type: form.travel_type,
        airline: form.travel_type === "flight" ? (form.airline || null) : null,
        roundtrip: form.roundtrip,
        miles,
        stops: extraStops.length > 0 ? extraStops : null,
      });

      if (error) return toast.error(error.message);
      setDeparture(emptyLocation());
      setStops([emptyLocation()]);
      setForm({ date: "", travel_type: "flight", airline: "", roundtrip: false });
      setMultiCity(false);
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
            <LocationBlock label="Departure" loc={departure} onChange={setDeparture} showAirport={form.travel_type === "flight"} />

            <div className="flex items-center gap-3">
              <Switch checked={multiCity} onCheckedChange={setMultiCity} id="mc" />
              <Label htmlFor="mc" className="cursor-pointer">Multi-city trip</Label>
            </div>

            {stops.map((stop, i) => (
              <div key={i} className="relative">
                {multiCity && stops.length > 1 && (
                  <button type="button" onClick={() => removeStop(i)} className="absolute -top-1 right-0 text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                )}
                <LocationBlock
                  label={multiCity ? `Stop ${i + 1}` : "Destination"}
                  loc={stop}
                  onChange={(l) => updateStop(i, l)}
                  showAirport={form.travel_type === "flight"}
                />
              </div>
            ))}

            {multiCity && (
              <Button type="button" variant="outline" size="sm" onClick={addStop}>
                <Plus className="h-4 w-4 mr-1" /> Add stop
              </Button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end pt-2 border-t border-border">
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
                <TableHead>Airport</TableHead>
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
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No trips yet.</TableCell>
                </TableRow>
              )}
              {data.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell>{t.departure_city ? `${t.departure_city}${t.departure_state ? `, ${t.departure_state}` : ""}` : "—"}</TableCell>
                  <TableCell className="font-medium">
                    {t.city}{t.state ? `, ${t.state}` : ""}
                    {t.stops?.length > 0 && <span className="text-xs text-muted-foreground ml-1">(+{t.stops.length} stops)</span>}
                  </TableCell>
                  <TableCell>{t.destination_airport ?? "—"}</TableCell>
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
