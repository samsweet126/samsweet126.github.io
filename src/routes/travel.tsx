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
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/travel")({
  head: () => ({ meta: [{ title: "Travel · My Life" }] }),
  component: () => (
    <RequireAuth>
      <AppLayout><TravelPage /></AppLayout>
    </RequireAuth>
  ),
});

function TravelPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useList<any>("trips", "trip_date");
  const [form, setForm] = useState({ city: "", state: "", trip_date: "", travel_type: "flight", airline: "", roundtrip: false });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("trips").insert({
      user_id: user.id,
      city: form.city,
      state: form.state,
      trip_date: form.trip_date,
      travel_type: form.travel_type,
      airline: form.travel_type === "flight" ? (form.airline || null) : null,
      roundtrip: form.roundtrip,
    });
    if (error) return toast.error(error.message);
    setForm({ city: "", state: "", trip_date: "", travel_type: "flight", airline: "", roundtrip: false });
    qc.invalidateQueries({ queryKey: ["trips"] });
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["trips"] });
  };

  const flights = data.filter((t) => t.travel_type === "flight").length;
  const drives = data.filter((t) => t.travel_type === "drive").length;

  return (
    <>
      <PageHeader title="Travel log" description={`${data.length} trips · ${flights} flights · ${drives} drives`} />
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <Card className="p-4">
          <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
            <div className="sm:col-span-2"><Label>City</Label><Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>State</Label><Input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
            <div><Label>Date</Label><Input type="date" required value={form.trip_date} onChange={(e) => setForm({ ...form, trip_date: e.target.value })} /></div>
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
            <div>
              <Label>Airline</Label>
              <Input disabled={form.travel_type !== "flight"} value={form.airline} onChange={(e) => setForm({ ...form, airline: e.target.value })} />
            </div>
            <div className="flex items-center gap-3 sm:col-span-6">
              <Switch checked={form.roundtrip} onCheckedChange={(v) => setForm({ ...form, roundtrip: v })} id="rt" />
              <Label htmlFor="rt" className="cursor-pointer">Roundtrip</Label>
            </div>
            <Button type="submit" className="sm:col-span-6">Add trip</Button>
          </form>
        </Card>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>City</TableHead><TableHead>State</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Airline</TableHead><TableHead>Roundtrip</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {data.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No trips yet.</TableCell></TableRow>}
              {data.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.city}</TableCell>
                  <TableCell>{t.state}</TableCell>
                  <TableCell>{t.trip_date}</TableCell>
                  <TableCell className="capitalize">{t.travel_type}</TableCell>
                  <TableCell>{t.airline ?? "—"}</TableCell>
                  <TableCell>{t.roundtrip ? "Yes" : "No"}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => del(t.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
