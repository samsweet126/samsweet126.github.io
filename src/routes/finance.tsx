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

export const Route = createFileRoute("/finance")({
  head: () => ({ meta: [{ title: "Finance · My Life" }] }),
  component: () => (
    <RequireAuth>
      <AppLayout><FinancePage /></AppLayout>
    </RequireAuth>
  ),
});

function FinancePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useList<any>("finance_entries", "month");
  const [form, setForm] = useState({ month: "", category: "", amount: "", notes: "" });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // store month as first day of month
    const monthDate = form.month ? `${form.month}-01` : "";
    const { error } = await supabase.from("finance_entries").insert({
      user_id: user.id, month: monthDate, category: form.category, amount: Number(form.amount) || 0, notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    setForm({ month: "", category: "", amount: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["finance_entries"] });
  };
  const del = async (id: string) => { await supabase.from("finance_entries").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["finance_entries"] }); };

  const total = data.reduce((a, f) => a + Number(f.amount ?? 0), 0);

  return (
    <>
      <PageHeader title="Finance tracker" description={`${data.length} entries · $${total.toFixed(2)} total`} />
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <Card className="p-4">
          <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div><Label>Month</Label><Input type="month" required value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></div>
            <div><Label>Category</Label><Input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Rent, food…" /></div>
            <div><Label>Amount</Label><Input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button type="submit" className="sm:col-span-5">Add entry</Button>
          </form>
        </Card>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Notes</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {data.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No entries yet.</TableCell></TableRow>}
              {data.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>{(f.month ?? "").slice(0, 7)}</TableCell>
                  <TableCell className="font-medium">{f.category}</TableCell>
                  <TableCell>${Number(f.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">{f.notes}</TableCell>
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
