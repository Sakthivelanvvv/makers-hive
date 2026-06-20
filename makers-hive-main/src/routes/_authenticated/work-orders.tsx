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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Play, Square } from "lucide-react";
import { PageHeader } from "@/lib/page-header";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/work-orders")({
  head: () => ({ meta: [{ title: "Work Orders — Forge ERP" }] }),
  component: WoPage,
});

const woColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/20 text-primary",
  in_progress: "bg-warning/20 text-warning",
  done: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
};

function WoPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: wcs = [] } = useQuery({
    queryKey: ["wcs-min"],
    queryFn: async () => (await supabase.from("work_centers").select("id,name")).data ?? [],
  });
  const { data: wos = [] } = useQuery({
    queryKey: ["work_orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("work_orders")
        .select("*, work_centers:work_center_id(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; operation: string; status: string; expected_duration: number; actual_duration: number; start_time: string | null; work_centers: { name: string } | null }>;
    },
  });

  const create = useMutation({
    mutationFn: async (v: { operation: string; work_center_id: string; expected_duration: number }) => {
      const { error } = await supabase.from("work_orders").insert(v);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["work_orders"] }); setOpen(false); toast.success("Created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const start = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("work_orders").update({ status: "in_progress", start_time: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work_orders"] }),
  });
  const finish = useMutation({
    mutationFn: async (wo: { id: string; start_time: string | null }) => {
      const start = wo.start_time ? new Date(wo.start_time).getTime() : Date.now();
      const duration = (Date.now() - start) / 60000;
      const { error } = await supabase.from("work_orders").update({ status: "done", end_time: new Date().toISOString(), actual_duration: Number(duration.toFixed(2)) }).eq("id", wo.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work_orders"] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("work_orders").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work_orders"] }),
  });

  return (
    <div>
      <PageHeader title="Work Orders" description="Operations executed at work centers with live timing"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4"/>New Work Order</Button></DialogTrigger>
            <NewWoForm wcs={wcs} onSubmit={(v) => create.mutate(v)} pending={create.isPending} />
          </Dialog>
        }
      />
      <Card className="glass border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Operation</TableHead><TableHead>Work Center</TableHead>
              <TableHead className="text-right">Expected (min)</TableHead>
              <TableHead className="text-right">Actual (min)</TableHead>
              <TableHead>Status</TableHead><TableHead className="w-40"/>
            </TableRow></TableHeader>
            <TableBody>
              {wos.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No work orders yet.</TableCell></TableRow>}
              {wos.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.operation}</TableCell>
                  <TableCell>{w.work_centers?.name ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(w.expected_duration)}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(w.actual_duration)}</TableCell>
                  <TableCell><Badge variant="outline" className={woColor[w.status] ?? ""}>{w.status.replace(/_/g," ")}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {w.status !== "in_progress" && w.status !== "done" && (
                        <Button size="sm" variant="secondary" onClick={() => start.mutate(w.id)}><Play className="mr-1 h-3 w-3"/>Start</Button>
                      )}
                      {w.status === "in_progress" && (
                        <Button size="sm" onClick={() => finish.mutate({ id: w.id, start_time: w.start_time })}><Square className="mr-1 h-3 w-3"/>Stop</Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => del.mutate(w.id)}><Trash2 className="h-4 w-4"/></Button>
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

function NewWoForm({ wcs, onSubmit, pending }: {
  wcs: { id: string; name: string }[];
  onSubmit: (v: { operation: string; work_center_id: string; expected_duration: number }) => void;
  pending: boolean;
}) {
  const [v, setV] = useState({ operation: "", work_center_id: "", expected_duration: 30 });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>New Work Order</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); if (!v.work_center_id) return; onSubmit(v); }} className="space-y-3">
        <div className="space-y-2"><Label>Operation</Label><Input required value={v.operation} onChange={(e) => setV({ ...v, operation: e.target.value })} /></div>
        <div className="space-y-2"><Label>Work Center</Label>
          <Select value={v.work_center_id} onValueChange={(val) => setV({ ...v, work_center_id: val })}>
            <SelectTrigger><SelectValue placeholder={wcs.length ? "Select work center" : "Create a work center first"} /></SelectTrigger>
            <SelectContent>{wcs.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Expected Duration (minutes)</Label><Input type="number" value={v.expected_duration} onChange={(e) => setV({ ...v, expected_duration: +e.target.value })} /></div>
        <DialogFooter><Button type="submit" disabled={pending || !v.work_center_id}>Create</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
