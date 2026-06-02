import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useList } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trash2, Star } from "lucide-react";

export const Route = createFileRoute("/watching")({
  head: () => ({ meta: [{ title: "Movies & TV · My Life" }] }),
  component: () => (
    <RequireAuth>
      <AppLayout><WatchPage /></AppLayout>
    </RequireAuth>
  ),
});

function Stars({ n }: { n: number }) {
  return <div className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-4 w-4 ${i <= n ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />)}</div>;
}

function WatchPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useList<any>("watchlist", "watched_on");
  const [form, setForm] = useState({ title: "", kind: "movie", watched_on: "", rating: "5" });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("watchlist").insert({
      user_id: user.id, title: form.title, kind: form.kind, watched_on: form.watched_on, rating: Number(form.rating),
    });
    if (error) return toast.error(error.message);
    setForm({ title: "", kind: "movie", watched_on: "", rating: "5" });
    qc.invalidateQueries({ queryKey: ["watchlist"] });
  };
  const del = async (id: string) => { await supabase.from("watchlist").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["watchlist"] }); };

  return (
    <>
      <PageHeader title="Movies & TV" description={`${data.length} titles watched`} />
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <Card className="p-4">
          <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-2"><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="movie">Movie</SelectItem><SelectItem value="tv">TV</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Watched</Label><Input type="date" required value={form.watched_on} onChange={(e) => setForm({ ...form, watched_on: e.target.value })} /></div>
            <div><Label>Rating</Label><Input type="number" min="1" max="5" required value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
            <Button type="submit" className="sm:col-span-5">Add entry</Button>
          </form>
        </Card>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead>Rating</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {data.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nothing watched yet.</TableCell></TableRow>}
              {data.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.title}</TableCell>
                  <TableCell className="capitalize">{w.kind}</TableCell>
                  <TableCell>{w.watched_on}</TableCell>
                  <TableCell><Stars n={w.rating} /></TableCell>
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
