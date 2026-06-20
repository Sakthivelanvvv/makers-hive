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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/lib/page-header";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/bom")({
  head: () => ({ meta: [{ title: "Bill of Materials — Forge ERP" }] }),
  component: BomPage,
});

function BomPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: products = [] } = useQuery({
    queryKey: ["products-min"],
    queryFn: async () => (await supabase.from("products").select("id,name")).data ?? [],
  });
  const { data: boms = [] } = useQuery({
    queryKey: ["boms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("boms").select("*, products:product_id(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; name: string; version: string; quantity: number; effective_from: string; products: { name: string } | null }>;
    },
  });

  const create = useMutation({
    mutationFn: async (v: { name: string; product_id: string; version: string; quantity: number }) => {
      const { error } = await supabase.from("boms").insert(v);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["boms"] }); setOpen(false); toast.success("BoM created"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("boms").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["boms"] }),
  });

  return (
    <div>
      <PageHeader title="Bills of Materials" description="Recipes that power manufacturing orders"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4"/>New BoM</Button></DialogTrigger>
            <NewBomForm products={products} onSubmit={(v) => create.mutate(v)} pending={create.isPending} />
          </Dialog>
        }
      />
      <Card className="glass border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Product</TableHead>
              <TableHead>Version</TableHead><TableHead className="text-right">Qty</TableHead>
              <TableHead>Effective</TableHead><TableHead className="w-16"/>
            </TableRow></TableHeader>
            <TableBody>
              {boms.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No BoMs yet.</TableCell></TableRow>}
              {boms.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>{b.products?.name ?? "—"}</TableCell>
                  <TableCell>{b.version}</TableCell>
                  <TableCell className="text-right tabular-nums">{b.quantity}</TableCell>
                  <TableCell>{b.effective_from}</TableCell>
                  <TableCell><Button size="icon" variant="ghost" onClick={() => del.mutate(b.id)}><Trash2 className="h-4 w-4"/></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NewBomForm({ products, onSubmit, pending }: {
  products: { id: string; name: string }[];
  onSubmit: (v: { name: string; product_id: string; version: string; quantity: number }) => void;
  pending: boolean;
}) {
  const [v, setV] = useState({ name: "", product_id: "", version: "1.0", quantity: 1 });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>New Bill of Materials</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); if (!v.product_id) return; onSubmit(v); }} className="space-y-3">
        <div className="space-y-2"><Label>Name</Label><Input required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
        <div className="space-y-2"><Label>Product</Label>
          <Select value={v.product_id} onValueChange={(val) => setV({ ...v, product_id: val })}>
            <SelectTrigger><SelectValue placeholder={products.length ? "Select product" : "Create a product first"} /></SelectTrigger>
            <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Version</Label><Input value={v.version} onChange={(e) => setV({ ...v, version: e.target.value })} /></div>
          <div className="space-y-2"><Label>Quantity</Label><Input type="number" min={1} value={v.quantity} onChange={(e) => setV({ ...v, quantity: +e.target.value })} /></div>
        </div>
        <DialogFooter><Button type="submit" disabled={pending || !v.product_id}>Create</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
