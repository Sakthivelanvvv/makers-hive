import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Pencil, Search } from "lucide-react";
import { PageHeader } from "@/lib/page-header";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/products")({
  head: () => ({ meta: [{ title: "Products — Forge ERP" }] }),
  component: ProductsPage,
});

type Product = {
  id: string; name: string;
  sales_price: number; cost_price: number;
  on_hand_qty: number; reserved_qty: number;
  uom: string | null;
};

function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const upsert = useMutation({
    mutationFn: async (vals: Partial<Product> & { id?: string }) => {
      if (vals.id) {
        const { error } = await supabase.from("products").update({
          name: vals.name, sales_price: vals.sales_price, cost_price: vals.cost_price,
          on_hand_qty: vals.on_hand_qty, reserved_qty: vals.reserved_qty, uom: vals.uom,
        }).eq("id", vals.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert({
          name: vals.name!, sales_price: vals.sales_price ?? 0, cost_price: vals.cost_price ?? 0,
          on_hand_qty: vals.on_hand_qty ?? 0, reserved_qty: vals.reserved_qty ?? 0, uom: vals.uom ?? "unit",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Saved"); setOpen(false); setEdit(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Products"
        description="Inventory master with computed free-to-use quantity"
        actions={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEdit(null)}><Plus className="mr-1 h-4 w-4" />New Product</Button>
            </DialogTrigger>
            <ProductForm
              key={edit?.id ?? "new"}
              initial={edit}
              onSubmit={(v) => upsert.mutate({ ...v, id: edit?.id })}
              submitting={upsert.isPending}
            />
          </Dialog>
        }
      />

      <Card className="glass border-border/50">
        <CardContent className="p-4">
          <div className="mb-3 relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products…" className="h-9 pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Sales Price</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">On Hand</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="text-right">Free to Use</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>}
                {!isLoading && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No products yet — create your first one.</TableCell></TableRow>
                )}
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right tabular-nums">${Number(p.sales_price).toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">${Number(p.cost_price).toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(p.on_hand_qty)}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(p.reserved_qty)}</TableCell>
                    <TableCell className="text-right tabular-nums text-primary">{Number(p.on_hand_qty) - Number(p.reserved_qty)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEdit(p); setOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Delete ${p.name}?`)) del.mutate(p.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProductForm({ initial, onSubmit, submitting }: {
  initial: Product | null;
  onSubmit: (v: Omit<Product, "id">) => void;
  submitting: boolean;
}) {
  const [v, setV] = useState({
    name: initial?.name ?? "",
    sales_price: initial?.sales_price ?? 0,
    cost_price: initial?.cost_price ?? 0,
    on_hand_qty: initial?.on_hand_qty ?? 0,
    reserved_qty: initial?.reserved_qty ?? 0,
    uom: initial?.uom ?? "unit",
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{initial ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(v); }} className="space-y-3">
        <div className="space-y-2"><Label>Name</Label>
          <Input value={v.name} required onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Sales Price</Label>
            <Input type="number" step="0.01" value={v.sales_price} onChange={(e) => setV({ ...v, sales_price: +e.target.value })} /></div>
          <div className="space-y-2"><Label>Cost Price</Label>
            <Input type="number" step="0.01" value={v.cost_price} onChange={(e) => setV({ ...v, cost_price: +e.target.value })} /></div>
          <div className="space-y-2"><Label>On Hand Qty</Label>
            <Input type="number" step="0.01" value={v.on_hand_qty} onChange={(e) => setV({ ...v, on_hand_qty: +e.target.value })} /></div>
          <div className="space-y-2"><Label>Reserved Qty</Label>
            <Input type="number" step="0.01" value={v.reserved_qty} onChange={(e) => setV({ ...v, reserved_qty: +e.target.value })} /></div>
          <div className="space-y-2 col-span-2"><Label>Unit of Measure</Label>
            <Input value={v.uom} onChange={(e) => setV({ ...v, uom: e.target.value })} /></div>
        </div>
        <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
          Free to Use = On Hand − Reserved = <span className="text-primary font-medium">{v.on_hand_qty - v.reserved_qty}</span>
        </div>
        <DialogFooter><Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
