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
  head: () => ({ meta: [{ title: "Fitness · My Life" }] }),
  component: () => (
    <RequireAuth>
      <AppLayout><FitnessPage /></AppLayout>
    </RequireAuth>
  ),
});

function FitnessPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useList<any>("workouts", "activity_date");
  const [form, setForm] = useState({ activity_date: "", activity: "", duration_minutes: "", notes: "" });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("workouts").insert({
      user_id: user.id,
      activity_date: form.activity_date,
      activity: form.activity,
      duration_minutes: Number(form.duration_minutes) || 0,
      notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    setForm({ activity_date: "", activity: "", duration_minutes: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["workouts"] });
  };
  const del = async (id: string) => {
    await supabase.from("workouts").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["workouts"] });
  };

  const totalMin = data.reduce((a, w) => a + Number(w.duration_minutes ?? 0), 0);

  return (
    <>
      <PageHeader title="Fitness log" description={`${data.length} workouts · ${Math.round(totalMin / 60)} h logged`} />
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <Card className="p-4">
          <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div><Label>Date</Label><Input type="date" required value={form.activity_date} onChange={(e) => setForm({ ...form, activity_date: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Activity</Label><Input required value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })} placeholder="Run, lift, yoga…" /></div>
            <div><Label>Duration (min)</Label><Input type="number" min="0" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} /></div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button type="submit" className="sm:col-span-5">Add workout</Button>
          </form>
        </Card>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Activity</TableHead><TableHead>Duration</TableHead><TableHead>Notes</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {data.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No workouts logged.</TableCell></TableRow>}
              {data.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>{w.activity_date}</TableCell>
                  <TableCell className="font-medium">{w.activity}</TableCell>
                  <TableCell>{w.duration_minutes} min</TableCell>
                  <TableCell className="text-muted-foreground">{w.notes}</TableCell>
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
