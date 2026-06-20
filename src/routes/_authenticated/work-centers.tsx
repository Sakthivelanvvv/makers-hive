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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/lib/page-header";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/work-centers")({
  head: () => ({ meta: [{ title: "Work Centers — Forge ERP" }] }),
  component: WorkCentersPage,
});

function WorkCentersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: wcs = [] } = useQuery({
    queryKey: ["work_centers"],
    queryFn: async () => (await supabase.from("work_centers").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const create = useMutation({
    mutationFn: async (v: { name: string; capacity: number; cost_per_hour: number }) => {
      const { error } = await supabase.from("work_centers").insert(v);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["work_centers"] }); setOpen(false); toast.success("Created"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("work_centers").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work_centers"] }),
  });

  return (
    <div>
      <PageHeader title="Work Centers" description="Production resources with capacity and hourly cost"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4"/>New Work Center</Button></DialogTrigger>
            <NewWcForm onSubmit={(v) => create.mutate(v)} pending={create.isPending} />
          </Dialog>
        }
      />
      <Card className="glass border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead className="text-right">Capacity</TableHead>
              <TableHead className="text-right">Cost / hr</TableHead><TableHead>Status</TableHead><TableHead className="w-16"/>
            </TableRow></TableHeader>
            <TableBody>
              {wcs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No work centers yet.</TableCell></TableRow>}
              {wcs.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(w.capacity)}</TableCell>
                  <TableCell className="text-right tabular-nums">${Number(w.cost_per_hour).toFixed(2)}</TableCell>
                  <TableCell>{w.status}</TableCell>
                  <TableCell><Button size="icon" variant="ghost" onClick={() => del.mutate(w.id)}><Trash2 className="h-4 w-4"/></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NewWcForm({ onSubmit, pending }: { onSubmit: (v: { name: string; capacity: number; cost_per_hour: number }) => void; pending: boolean }) {
  const [v, setV] = useState({ name: "", capacity: 1, cost_per_hour: 0 });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>New Work Center</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(v); }} className="space-y-3">
        <div className="space-y-2"><Label>Name</Label><Input required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Capacity</Label><Input type="number" step="0.1" value={v.capacity} onChange={(e) => setV({ ...v, capacity: +e.target.value })} /></div>
          <div className="space-y-2"><Label>Cost / hour</Label><Input type="number" step="0.01" value={v.cost_per_hour} onChange={(e) => setV({ ...v, cost_per_hour: +e.target.value })} /></div>
        </div>
        <DialogFooter><Button type="submit" disabled={pending}>Create</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
