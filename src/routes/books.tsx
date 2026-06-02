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
import { Trash2, Star } from "lucide-react";

export const Route = createFileRoute("/books")({
  head: () => ({ meta: [{ title: "Books · My Life" }] }),
  component: () => (
    <RequireAuth>
      <AppLayout><BooksPage /></AppLayout>
    </RequireAuth>
  ),
});

function Stars({ n }: { n: number }) {
  return <div className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-4 w-4 ${i <= n ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />)}</div>;
}

function BooksPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useList<any>("books", "date_finished");
  const [form, setForm] = useState({
    title: "", author: "", date_started: "", date_finished: "",
    rating: "5", pages: "", type: "", year: "",
  });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const payload: any = {
      user_id: user.id,
      title: form.title,
      author: form.author,
      date_started: form.date_started || null,
      date_finished: form.date_finished || null,
      rating: form.rating ? Number(form.rating) : null,
      pages: form.pages ? Number(form.pages) : null,
      type: form.type || null,
      year: form.year ? Number(form.year) : null,
    };
    const { error } = await supabase.from("books").insert(payload);
    if (error) return toast.error(error.message);
    setForm({ title: "", author: "", date_started: "", date_finished: "", rating: "5", pages: "", type: "", year: "" });
    qc.invalidateQueries({ queryKey: ["books"] });
  };
  const del = async (id: string) => { await supabase.from("books").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["books"] }); };

  return (
    <>
      <PageHeader title="Books read" description={`${data.length} books`} />
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <Card className="p-4">
          <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2"><Label>Book</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Author</Label><Input required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
            <div><Label>Date started</Label><Input type="date" value={form.date_started} onChange={(e) => setForm({ ...form, date_started: e.target.value })} /></div>
            <div><Label>Date finished</Label><Input type="date" value={form.date_finished} onChange={(e) => setForm({ ...form, date_finished: e.target.value })} /></div>
            <div><Label>Rating</Label><Input type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
            <div><Label>Pages</Label><Input type="number" min="0" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} /></div>
            <div><Label>Type</Label><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Fiction, memoir…" /></div>
            <div><Label>Year</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="Published" /></div>
            <Button type="submit" className="sm:col-span-4">Add book</Button>
          </form>
        </Card>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Book</TableHead><TableHead>Author</TableHead><TableHead>Started</TableHead><TableHead>Finished</TableHead><TableHead>Pages</TableHead><TableHead>Type</TableHead><TableHead>Year</TableHead><TableHead>Rating</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {data.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No books yet.</TableCell></TableRow>}
              {data.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell>{b.author}</TableCell>
                  <TableCell>{b.date_started ?? "—"}</TableCell>
                  <TableCell>{b.date_finished ?? "—"}</TableCell>
                  <TableCell>{b.pages ?? "—"}</TableCell>
                  <TableCell>{b.type ?? "—"}</TableCell>
                  <TableCell>{b.year ?? "—"}</TableCell>
                  <TableCell>{b.rating ? <Stars n={b.rating} /> : "—"}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => del(b.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
