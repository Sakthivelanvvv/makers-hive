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
      const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      const userIds = Array.from(new Set((data ?? []).map((l) => l.user_id).filter((x): x is string => !!x)));
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("id,name,email").in("id", userIds)
        : { data: [] as { id: string; name: string | null; email: string }[] };
      const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      return (data ?? []).map((l) => ({ ...l, profile: l.user_id ? pMap.get(l.user_id) ?? null : null }));
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
                  <TableCell>{l.profile?.name ?? l.profile?.email ?? "—"}</TableCell>
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
