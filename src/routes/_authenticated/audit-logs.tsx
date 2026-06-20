import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/lib/page-header";

export const Route = createFileRoute("/_authenticated/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — Forge ERP" }] }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const { data: logs = [] } = useQuery({
    queryKey: ["audit_logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_logs")
        .select("*, profiles:user_id(name,email)").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data as Array<{ id: string; created_at: string; module: string; record_type: string | null; record_id: string | null; action: string; field_changed: string | null; old_value: string | null; new_value: string | null; profiles: { name: string | null; email: string } | null }>;
    },
  });

  return (
    <div>
      <PageHeader title="Audit Logs" description="Every create, update, delete and status change across the ERP" />
      <Card className="glass border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>When</TableHead><TableHead>User</TableHead>
              <TableHead>Module</TableHead><TableHead>Action</TableHead>
              <TableHead>Record</TableHead><TableHead>Field</TableHead>
              <TableHead>Old → New</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {logs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No audit entries yet.</TableCell></TableRow>}
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</TableCell>
                  <TableCell>{l.profiles?.name ?? l.profiles?.email ?? "—"}</TableCell>
                  <TableCell>{l.module}</TableCell>
                  <TableCell><span className="text-primary">{l.action}</span></TableCell>
                  <TableCell className="font-mono text-xs">{l.record_type} {l.record_id?.slice(0,8)}</TableCell>
                  <TableCell>{l.field_changed ?? "—"}</TableCell>
                  <TableCell className="text-xs"><span className="text-muted-foreground">{l.old_value ?? ""}</span>{l.new_value && <> → <span className="text-foreground">{l.new_value}</span></>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
