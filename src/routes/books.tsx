import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useList } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trash2, Star, Search, ArrowUpDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

export const Route = createFileRoute("/books")({
  head: () => ({ meta: [{ title: "Books · Goal Tracker" }] }),
  component: () => (
    <RequireAuth>
      <AppLayout><BooksPage /></AppLayout>
    </RequireAuth>
  ),
});

function Stars({ n }: { n: number }) {
  return <div className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-4 w-4 ${i <= n ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />)}</div>;
}

interface BookData {
  title: string;
  author: string;
  pages?: number;
  year?: number;
  genre?: string;
  cover?: string;
}

function SearchDialog({ open, onOpenChange, onSelect }: { open: boolean; onOpenChange: (open: boolean) => void; onSelect: (book: BookData) => void }) {
  const [query, setQuery] = useState("");

  const search = useQuery({
    queryKey: ["book-search", query],
    enabled: !!query && query.length > 2,
    queryFn: async () => {
      const key = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${key}`
      );
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
  });

  const handleSelect = (item: any) => {
    const info = item.volumeInfo;
    onSelect({
      title: info.title,
      author: info.authors?.[0] || "",
      pages: info.pageCount,
      year: info.publishedDate ? parseInt(info.publishedDate) : undefined,
      genre: info.categories?.[0] || "",
      cover: info.imageLinks?.thumbnail,
    });
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Search books</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search by title or author…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {search.isLoading && <p className="text-muted-foreground text-sm">Searching…</p>}
          {search.isError && <p className="text-destructive text-sm">Search failed</p>}
          {search.data?.items && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {search.data.items.map((item: any, i: number) => {
                const info = item.volumeInfo;
                const cover = info.imageLinks?.thumbnail;
                return (
                  <div key={i} className="p-3 border rounded hover:bg-muted cursor-pointer flex gap-3" onClick={() => handleSelect(item)}>
                    {cover && <img src={cover} alt="" className="h-16 w-12 object-cover rounded flex-shrink-0" />}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{info.title}</div>
                      <div className="text-xs text-muted-foreground">{info.authors?.join(", ") || "Unknown author"}</div>
                      {info.publishedDate && <div className="text-xs text-muted-foreground">{info.publishedDate}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type SortKey = keyof any;

function BooksPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useList<any>("books", "date_finished");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [form, setForm] = useState({
    title: "",
    author: "",
    date_started: "",
    date_finished: "",
    rating: "5",
    pages: "",
    year: "",
    genre: "",
    cover: "",
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSearchSelect = (book: BookData) => {
    setForm({
      ...form,
      title: book.title,
      author: book.author,
      pages: book.pages?.toString() || "",
      year: book.year?.toString() || "",
      genre: book.genre || "",
      cover: book.cover || "",
    });
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.date_finished) {
      toast.error("Date finished is required");
      return;
    }
    const payload: any = {
      user_id: user.id,
      title: form.title,
      author: form.author,
      date_started: form.date_started || null,
      date_finished: form.date_finished,
      rating: form.rating ? Number(form.rating) : null,
      pages: form.pages ? Number(form.pages) : null,
      year: form.year ? Number(form.year) : null,
    };
    if (form.genre) payload.genre = form.genre;
    if (form.cover) payload.cover = form.cover;
    const { error } = await supabase.from("books").insert(payload);
    if (error) {
      console.error("Insert error:", error);
      toast.error(error.message);
      return;
    }
    setForm({
      title: "",
      author: "",
      date_started: "",
      date_finished: "",
      rating: "5",
      pages: "",
      year: "",
      genre: "",
      cover: "",
    });
    qc.invalidateQueries({ queryKey: ["books"] });
    toast.success("Book added!");
  };

  const del = async (id: string) => {
    await supabase.from("books").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["books"] });
  };

  const SortHeader = ({ label, sortBy }: { label: string; sortBy: SortKey }) => (
    <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort(sortBy)}>
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown className={`h-4 w-4 ${sortKey === sortBy ? "text-primary" : "text-muted-foreground/30"}`} />
      </div>
    </TableHead>
  );

  return (
    <>
      <PageHeader title="Books read" description={`${data.length} books`} />
      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        {/* Analytics section */}
        <div className="space-y-6">
          {/* Books by month */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-4">Books read by month</h3>
            {(() => {
              const monthMap: Record<string, number> = {};
              data.forEach((b) => {
                if (b.date_finished) {
                  const month = b.date_finished.substring(0, 7);
                  monthMap[month] = (monthMap[month] || 0) + 1;
                }
              });
              const monthData = Object.entries(monthMap)
                .sort()
                .map(([month, count]) => ({ month, count }));
              return monthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm py-8 text-center">No data yet</p>
              );
            })()}
          </Card>

          {/* Top 10 authors */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-4">Top 10 authors</h3>
            {(() => {
              const authorMap: Record<string, number> = {};
              data.forEach((b) => {
                authorMap[b.author] = (authorMap[b.author] || 0) + 1;
              });
              const authorData = Object.entries(authorMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([author, count]) => ({ author, count }));
              return authorData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={authorData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="author" width={120} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm py-8 text-center">No data yet</p>
              );
            })()}
          </Card>

          {/* Ratings distribution */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-4">Ratings distribution</h3>
            {(() => {
              const ratingData = [
                { rating: 5, count: data.filter((b) => b.rating === 5).length },
                { rating: 4, count: data.filter((b) => b.rating === 4).length },
                { rating: 3, count: data.filter((b) => b.rating === 3).length },
                { rating: 2, count: data.filter((b) => b.rating === 2).length },
                { rating: 1, count: data.filter((b) => b.rating === 1).length },
              ].filter((r) => r.count > 0);
              const colors = ["#10b981", "#84cc16", "#f59e0b", "#f97316", "#ef4444"];
              return ratingData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={ratingData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="rating" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {ratingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[5 - entry.rating]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm py-8 text-center">No ratings yet</p>
              );
            })()}
          </Card>
        </div>

        <Card className="p-4">
          <form onSubmit={add} className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setSearchOpen(true)}>
                <Search className="h-4 w-4 mr-2" />
                Search Google Books
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <Label>Title</Label>
                <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Author</Label>
                <Input required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              </div>
              <div>
                <Label>Genre</Label>
                <Input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
              </div>
              <div>
                <Label>Year</Label>
                <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </div>
              <div>
                <Label>Pages</Label>
                <Input type="number" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} />
              </div>
              <div>
                <Label>Date started</Label>
                <Input type="date" value={form.date_started} onChange={(e) => setForm({ ...form, date_started: e.target.value })} />
              </div>
              <div>
                <Label>Date finished</Label>
                <Input type="date" required value={form.date_finished} onChange={(e) => setForm({ ...form, date_finished: e.target.value })} />
              </div>
              <div>
                <Label>Rating</Label>
                <Input type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              Add book
            </Button>
          </form>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <SortHeader label="Book" sortBy="title" />
                <SortHeader label="Author" sortBy="author" />
                <SortHeader label="Genre" sortBy="genre" />
                <SortHeader label="Pages" sortBy="pages" />
                <SortHeader label="Year" sortBy="year" />
                <SortHeader label="Started" sortBy="date_started" />
                <SortHeader label="Finished" sortBy="date_finished" />
                <SortHeader label="Rating" sortBy="rating" />
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No books yet.
                  </TableCell>
                </TableRow>
              )}
              {sortedData.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="w-12">
                    {b.cover && <img src={b.cover} alt="" className="h-12 w-8 object-cover rounded" />}
                  </TableCell>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell>{b.author}</TableCell>
                  <TableCell>{b.genre ?? "—"}</TableCell>
                  <TableCell>{b.pages ?? "—"}</TableCell>
                  <TableCell>{b.year ?? "—"}</TableCell>
                  <TableCell>{b.date_started ?? "—"}</TableCell>
                  <TableCell>{b.date_finished ?? "—"}</TableCell>
                  <TableCell>{b.rating ? <Stars n={b.rating} /> : "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => del(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} onSelect={handleSearchSelect} />
    </>
  );
}
