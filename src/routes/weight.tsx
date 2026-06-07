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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/weight")({
  head: () => ({ meta: [{ title: "Weight · Goal Tracker" }] }),
  component: () => (
    <RequireAuth>
      <AppLayout><WeightPage /></AppLayout>
    </RequireAuth>
  ),
});

function WeightPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useList<any>("weights", "date");
  const [form, setForm] = useState({ date: "", weight: "" });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.weight) {
      toast.error("Weight is required");
      return;
    }
    const { error } = await supabase.from("weights").insert({
      user_id: user.id,
      date: form.date || new Date().toISOString().split("T")[0],
      weight: Number(form.weight),
    });
    if (error) return toast.error(error.message);
    setForm({ date: "", weight: "" });
    qc.invalidateQueries({ queryKey: ["weights"] });
    toast.success("Weight logged!");
  };

  const del = async (id: string) => {
    await supabase.from("weights").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["weights"] });
  };

  const currentWeight = data.length > 0 ? data[0].weight : null;

  return (
    <>
      <PageHeader title="Weight" description={data.length > 0 ? `Current: ${currentWeight} lbs` : "Track your weight"} />
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <Card className="p-4">
          <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label>Weight (lbs)</Label>
              <Input type="number" step="0.1" required value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </div>
            <Button type="submit">Log weight</Button>
          </form>
        </Card>

        {data.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-4">Weight trend</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={[...data].reverse()}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `${value} lbs`} />
                <Line type="monotone" dataKey="weight" dot={true} strokeWidth={2} className="stroke-primary" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No weight entries yet.
                  </TableCell>
                </TableRow>
              )}
              {data.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>{w.date}</TableCell>
                  <TableCell>{Number(w.weight).toFixed(1)} lbs</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => del(w.id)}>
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
