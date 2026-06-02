import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
  const [form, setForm] = useState({ destination: "", trip_date: "", miles: "", flights: "" });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("trips").insert({
      user_id: user.id,
      destination: form.destination,
      trip_date: form.trip_date,
      miles: Number(form.miles) || 0,
      flights: Number(form.flights) || 0,
    });
    if (error) return toast.error(error.message);
    setForm({ destination: "", trip_date: "", miles: "", flights: "" });
    qc.invalidateQueries({ queryKey: ["trips"] });
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["trips"] });
  };

  const totalMiles = data.reduce((a, t) => a + Number(t.miles ?? 0), 0);
  const totalFlights = data.reduce((a, t) => a + Number(t.flights ?? 0), 0);

  return (
    <>
      <PageHeader title="Travel log" description={`${data.length} trips · ${totalMiles.toLocaleString()} miles · ${totalFlights} flights`} />
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <Card className="p-4">
          <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-2"><Label>Destination</Label><Input required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
            <div><Label>Date</Label><Input type="date" required value={form.trip_date} onChange={(e) => setForm({ ...form, trip_date: e.target.value })} /></div>
            <div><Label>Miles</Label><Input type="number" min="0" value={form.miles} onChange={(e) => setForm({ ...form, miles: e.target.value })} /></div>
            <div><Label>Flights</Label><Input type="number" min="0" value={form.flights} onChange={(e) => setForm({ ...form, flights: e.target.value })} /></div>
            <Button type="submit" className="sm:col-span-5">Add trip</Button>
          </form>
        </Card>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Destination</TableHead><TableHead>Date</TableHead><TableHead>Miles</TableHead><TableHead>Flights</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {data.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No trips yet.</TableCell></TableRow>}
              {data.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.destination}</TableCell>
                  <TableCell>{t.trip_date}</TableCell>
                  <TableCell>{Number(t.miles).toLocaleString()}</TableCell>
                  <TableCell>{t.flights}</TableCell>
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
