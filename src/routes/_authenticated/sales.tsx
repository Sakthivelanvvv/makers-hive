import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/lib/page-header";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sales")({
  head: () => ({ meta: [{ title: "Sales Orders — Forge ERP" }] }),
  component: SalesPage,
});

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/20 text-primary",
  partially_delivered: "bg-warning/20 text-warning",
  fully_delivered: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
};

function StatusBadge({ s }: { s: string }) {
  return <Badge variant="outline" className={statusColor[s] ?? ""}>{s.replace(/_/g, " ")}</Badge>;
}

function SalesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: orders = [] } = useQuery({
    queryKey: ["sales_orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async (v: { customer: string; customer_address: string; amount: number }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("sales_orders").insert({
        customer: v.customer, customer_address: v.customer_address, amount: v.amount,
        salesperson_id: u.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sales_orders"] }); setOpen(false); toast.success("Created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("sales_orders").update({ status: status as never }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales_orders"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales_orders"] }),
  });

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        description="Customer orders, delivery tracking and fulfillment"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4"/>New Sales Order</Button></DialogTrigger>
            <NewSoForm onSubmit={(v) => create.mutate(v)} pending={create.isPending} />
          </Dialog>
        }
      />
      <Card className="glass border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SO Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-64">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No sales orders yet.</TableCell></TableRow>}
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.so_number}</TableCell>
                  <TableCell className="font-medium">{o.customer}</TableCell>
                  <TableCell>{o.creation_date}</TableCell>
                  <TableCell className="text-right tabular-nums">${Number(o.amount).toFixed(2)}</TableCell>
                  <TableCell><StatusBadge s={o.status} /></TableCell>
                  <TableCell>
                    <ActionRow status={o.status} onConfirm={() => setStatus.mutate({ id: o.id, status: "confirmed" })}
                      onDeliver={() => setStatus.mutate({ id: o.id, status: "fully_delivered" })}
                      onPartial={() => setStatus.mutate({ id: o.id, status: "partially_delivered" })}
                      onCancel={() => setStatus.mutate({ id: o.id, status: "cancelled" })}
                      onDelete={() => del.mutate(o.id)} />
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

function ActionRow({ status, onConfirm, onDeliver, onPartial, onCancel, onDelete }: {
  status: string;
  onConfirm: () => void; onDeliver: () => void; onPartial: () => void; onCancel: () => void; onDelete: () => void;
}) {
  const buttons: ReactNode[] = [];
  if (status === "draft") buttons.push(<Button key="c" size="sm" onClick={onConfirm}>Confirm</Button>);
  if (["confirmed","partially_delivered"].includes(status)) {
    buttons.push(<Button key="d" size="sm" variant="secondary" onClick={onDeliver}>Deliver</Button>);
    buttons.push(<Button key="p" size="sm" variant="outline" onClick={onPartial}>Partial</Button>);
  }
  if (!["fully_delivered","cancelled"].includes(status)) {
    buttons.push(<Button key="x" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>);
  }
  buttons.push(<Button key="del" size="icon" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4"/></Button>);
  return <div className="flex flex-wrap gap-1">{buttons}</div>;
}

function NewSoForm({ onSubmit, pending }: { onSubmit: (v: { customer: string; customer_address: string; amount: number }) => void; pending: boolean }) {
  const [v, setV] = useState({ customer: "", customer_address: "", amount: 0 });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>New Sales Order</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(v); }} className="space-y-3">
        <div className="space-y-2"><Label>Customer</Label><Input required value={v.customer} onChange={(e) => setV({ ...v, customer: e.target.value })} /></div>
        <div className="space-y-2"><Label>Address</Label><Input value={v.customer_address} onChange={(e) => setV({ ...v, customer_address: e.target.value })} /></div>
        <div className="space-y-2"><Label>Total Amount</Label><Input type="number" step="0.01" value={v.amount} onChange={(e) => setV({ ...v, amount: +e.target.value })} /></div>
        <DialogFooter><Button type="submit" disabled={pending}>Create</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
