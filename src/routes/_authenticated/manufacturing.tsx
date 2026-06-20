import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/lib/page-header";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/manufacturing")({
  head: () => ({ meta: [{ title: "Manufacturing Orders — Forge ERP" }] }),
  component: ManufacturingPage,
});

const moColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/20 text-primary",
  in_progress: "bg-warning/20 text-warning",
  to_close: "bg-warning/30 text-warning",
  done: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
};

function ManufacturingPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["products-min"],
    queryFn: async () => (await supabase.from("products").select("id,name")).data ?? [],
  });
  const { data: mos = [] } = useQuery({
    queryKey: ["mos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("manufacturing_orders")
        .select("*, products:product_id(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; mo_number: string; quantity: number; status: string; scheduled_date: string; products: { name: string } | null }>;
    },
  });

  const create = useMutation({
    mutationFn: async (v: { product_id: string; quantity: number }) => {
      const { error } = await supabase.from("manufacturing_orders").insert({
        product_id: v.product_id, quantity: v.quantity,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mos"] }); setOpen(false); toast.success("MO created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const advance = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("manufacturing_orders").update({ status: status as never }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mos"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("manufacturing_orders").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mos"] }),
  });

  return (
    <div>
      <PageHeader title="Manufacturing Orders" description="Production runs with state machine: draft → confirmed → in progress → to close → done"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />New MO</Button></DialogTrigger>
            <NewMoForm products={products} onSubmit={(v) => create.mutate(v)} pending={create.isPending} />
          </Dialog>
        }
      />
      <Card className="glass border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MO Number</TableHead>
                <TableHead>Finished Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-72">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mos.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No manufacturing orders yet.</TableCell></TableRow>}
              {mos.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.mo_number}</TableCell>
                  <TableCell className="font-medium">{m.products?.name ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.quantity}</TableCell>
                  <TableCell>{m.scheduled_date}</TableCell>
                  <TableCell><Badge variant="outline" className={moColor[m.status] ?? ""}>{m.status.replace(/_/g," ")}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {m.status === "draft" && <Button size="sm" onClick={() => advance.mutate({ id: m.id, status: "confirmed" })}>Confirm</Button>}
                      {m.status === "confirmed" && <Button size="sm" variant="secondary" onClick={() => advance.mutate({ id: m.id, status: "in_progress" })}>Start</Button>}
                      {m.status === "in_progress" && <Button size="sm" variant="secondary" onClick={() => advance.mutate({ id: m.id, status: "to_close" })}>To Close</Button>}
                      {m.status === "to_close" && <Button size="sm" onClick={() => advance.mutate({ id: m.id, status: "done" })}>Produce</Button>}
                      {!["done","cancelled"].includes(m.status) && <Button size="sm" variant="ghost" onClick={() => advance.mutate({ id: m.id, status: "cancelled" })}>Cancel</Button>}
                      <Button size="icon" variant="ghost" onClick={() => del.mutate(m.id)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NewMoForm({ products, onSubmit, pending }: {
  products: { id: string; name: string }[];
  onSubmit: (v: { product_id: string; quantity: number }) => void;
  pending: boolean;
}) {
  const [v, setV] = useState({ product_id: "", quantity: 1 });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>New Manufacturing Order</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); if (!v.product_id) return; onSubmit(v); }} className="space-y-3">
        <div className="space-y-2"><Label>Finished Product</Label>
          <Select value={v.product_id} onValueChange={(val) => setV({ ...v, product_id: val })}>
            <SelectTrigger><SelectValue placeholder={products.length ? "Select product" : "Create a product first"} /></SelectTrigger>
            <SelectContent>
              {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Quantity</Label>
          <Input type="number" min={1} value={v.quantity} onChange={(e) => setV({ ...v, quantity: +e.target.value })} />
        </div>
        <DialogFooter><Button type="submit" disabled={pending || !v.product_id}>Create MO</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
