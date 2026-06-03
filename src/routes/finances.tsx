import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useList } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/finances")({
  head: () => ({ meta: [{ title: "Finances · Goal Tracker" }] }),
  component: () => (
    <RequireAuth>
      <AppLayout><FinancesPage /></AppLayout>
    </RequireAuth>
  ),
});

function FinancesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useList<any>("finances", "date");
  const [form, setForm] = useState({ date: "", category: "", amount: "", notes: "" });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("finances" as any).insert({
      user_id: user.id,
      date: form.date,
      category: form.category,
      amount: Number(form.amount) || 0,
      notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    setForm({ date: "", category: "", amount: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["finances"] });
  };
  const del = async (id: string) => {
    await supabase.from("finances" as any).delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["finances"] });
  };

  const total = data.reduce((a, f) => a + Number(f.amount ?? 0), 0);

  return (
    <>
      <PageHeader title="Finances" description={`${data.length} entries · $${total.toFixed(2)}`} />
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <Card className="p-4">
          <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div><Label>Date</Label><Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label>Category</Label><Input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Groceries, rent…" /></div>
            <div><Label>Amount</Label><Input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div className="sm:col-span-4"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button type="submit" className="sm:col-span-4">Add entry</Button>
          </form>
        </Card>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Notes</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {data.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No entries yet.</TableCell></TableRow>}
              {data.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>{f.date}</TableCell>
                  <TableCell>{f.category}</TableCell>
                  <TableCell>${Number(f.amount ?? 0).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">{f.notes ?? "—"}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => del(f.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
