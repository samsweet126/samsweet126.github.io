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

export const Route = createFileRoute("/fitness")({
  head: () => ({ meta: [{ title: "Fitness · Goal Tracker" }] }),
  component: () => (
    <RequireAuth>
      <AppLayout><FitnessPage /></AppLayout>
    </RequireAuth>
  ),
});

function FitnessPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useList<any>("workouts", "date");
  const [form, setForm] = useState({ date: "", miles: "", time_minutes: "" });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("workouts").insert({
      user_id: user.id,
      date: form.date,
      miles: Number(form.miles) || 0,
      time_minutes: Number(form.time_minutes) || 0,
    });
    if (error) return toast.error(error.message);
    setForm({ date: "", miles: "", time_minutes: "" });
    qc.invalidateQueries({ queryKey: ["workouts"] });
  };
  const del = async (id: string) => {
    await supabase.from("workouts").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["workouts"] });
  };

  const totalMin = data.reduce((a, w) => a + Number(w.time_minutes ?? 0), 0);
  const totalMiles = data.reduce((a, w) => a + Number(w.miles ?? 0), 0);

  return (
    <>
      <PageHeader title="Fitness log" description={`${data.length} sessions · ${totalMiles.toFixed(1)} mi · ${Math.round(totalMin / 60)} h`} />
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <Card className="p-4">
          <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div><Label>Date</Label><Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label>Miles</Label><Input type="number" step="0.01" min="0" value={form.miles} onChange={(e) => setForm({ ...form, miles: e.target.value })} /></div>
            <div><Label>Time (min)</Label><Input type="number" min="0" value={form.time_minutes} onChange={(e) => setForm({ ...form, time_minutes: e.target.value })} /></div>
            <Button type="submit">Add</Button>
          </form>
        </Card>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Miles</TableHead><TableHead>Time</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {data.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No sessions logged.</TableCell></TableRow>}
              {data.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>{w.date}</TableCell>
                  <TableCell>{Number(w.miles ?? 0).toFixed(2)}</TableCell>
                  <TableCell>{w.time_minutes} min</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => del(w.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
