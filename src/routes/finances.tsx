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
  const { data = [] } = useList<any>("finances_balance", "date");
  const [form, setForm] = useState({ date: "", amount: "" });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.amount) {
      toast.error("Amount is required");
      return;
    }
    const { error } = await supabase.from("finances_balance").insert({
      user_id: user.id,
      date: form.date || new Date().toISOString().split("T")[0],
      amount: Number(form.amount),
    });
    if (error) return toast.error(error.message);
    setForm({ date: "", amount: "" });
    qc.invalidateQueries({ queryKey: ["finances_balance"] });
    toast.success("Amount logged!");
  };

  const del = async (id: string) => {
    await supabase.from("finances_balance").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["finances_balance"] });
  };

  const currentAmount = data.length > 0 ? data[0].amount : null;

  return (
    <>
      <PageHeader title="Finances" description={data.length > 0 ? `Current: $${Number(currentAmount).toFixed(2)}` : "Track your savings"} />
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <Card className="p-4">
          <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label>Current Amount ($)</Label>
              <Input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <Button type="submit">Log amount</Button>
          </form>
        </Card>

        {data.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-4">Balance trend</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={[...data].reverse()}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                <Line type="monotone" dataKey="amount" dot={true} strokeWidth={2} className="stroke-primary" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No entries yet.
                  </TableCell>
                </TableRow>
              )}
              {data.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>{f.date}</TableCell>
                  <TableCell>${Number(f.amount ?? 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => del(f.id)}>
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
