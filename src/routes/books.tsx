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
  const { data = [] } = useList<any>("books", "finished_on");
  const [form, setForm] = useState({ title: "", author: "", finished_on: "", rating: "5" });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("books").insert({
      user_id: user.id, title: form.title, author: form.author, finished_on: form.finished_on, rating: Number(form.rating),
    });
    if (error) return toast.error(error.message);
    setForm({ title: "", author: "", finished_on: "", rating: "5" });
    qc.invalidateQueries({ queryKey: ["books"] });
  };
  const del = async (id: string) => { await supabase.from("books").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["books"] }); };

  return (
    <>
      <PageHeader title="Books read" description={`${data.length} books finished`} />
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <Card className="p-4">
          <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-2"><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Author</Label><Input required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
            <div><Label>Finished</Label><Input type="date" required value={form.finished_on} onChange={(e) => setForm({ ...form, finished_on: e.target.value })} /></div>
            <div><Label>Rating</Label><Input type="number" min="1" max="5" required value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
            <Button type="submit" className="sm:col-span-5">Add book</Button>
          </form>
        </Card>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Author</TableHead><TableHead>Finished</TableHead><TableHead>Rating</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {data.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No books yet.</TableCell></TableRow>}
              {data.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell>{b.author}</TableCell>
                  <TableCell>{b.finished_on}</TableCell>
                  <TableCell><Stars n={b.rating} /></TableCell>
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
