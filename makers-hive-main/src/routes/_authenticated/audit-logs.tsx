import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/lib/page-header";
import { Download, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — Forge ERP" }] }),
  component: AuditLogsPage,
});

const PAGE_SIZE = 20;

type AuditLog = {
  id: string;
  user_id: string | null;
  module: string;
  action: string;
  record_type: string | null;
  record_id: string | null;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  profile: { name: string | null; email: string } | null;
};

function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const userIds = Array.from(new Set((data ?? []).map((l) => l.user_id).filter((x): x is string => !!x)));
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("id,name,email").in("id", userIds)
        : { data: [] as { id: string; name: string | null; email: string }[] };
      const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      return (data ?? []).map((l) => ({ ...l, profile: l.user_id ? (pMap.get(l.user_id) ?? null) : null })) as AuditLog[];
    },
  });

  const modules = useMemo(() => ["all", ...Array.from(new Set(logs.map((l) => l.module).filter(Boolean)))], [logs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((l) => {
      const matchModule = moduleFilter === "all" || l.module === moduleFilter;
      const matchSearch =
        !q ||
        l.action.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q) ||
        (l.profile?.name ?? "").toLowerCase().includes(q) ||
        (l.profile?.email ?? "").toLowerCase().includes(q) ||
        (l.record_type ?? "").toLowerCase().includes(q);
      return matchModule && matchSearch;
    });
  }, [logs, search, moduleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const headers = ["Audit ID", "User", "Activity", "Date & Time", "Module"];
    const rows = filtered.map((l) => [
      l.id,
      l.profile?.name ?? l.profile?.email ?? "—",
      l.action,
      new Date(l.created_at).toLocaleString("en-IN"),
      l.module,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const headers = ["Audit ID", "User", "Activity", "Date & Time", "Module"];
    const rows = filtered.map((l) => [
      l.id,
      l.profile?.name ?? l.profile?.email ?? "—",
      l.action,
      new Date(l.created_at).toLocaleString("en-IN"),
      l.module,
    ]);
    const tsv = [headers, ...rows].map((r) => r.join("\t")).join("\n");
    const blob = new Blob([tsv], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.xls";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Every create, update, delete and status change across the ERP"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportCSV}>
              <Download className="mr-1 h-4 w-4" />CSV
            </Button>
            <Button size="sm" variant="outline" onClick={exportExcel}>
              <Download className="mr-1 h-4 w-4" />Excel
            </Button>
          </div>
        }
      />
      <Card className="glass border-border/50">
        <CardContent className="p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs…"
                className="h-9 pl-8"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((m) => (
                  <SelectItem key={m} value={m}>{m === "all" ? "All Modules" : m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Audit ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Module</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell>
                  </TableRow>
                )}
                {!isLoading && paginated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No audit entries found.</TableCell>
                  </TableRow>
                )}
                {paginated.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.id.slice(0, 8)}…</TableCell>
                    <TableCell>{l.profile?.name ?? l.profile?.email ?? "—"}</TableCell>
                    <TableCell><span className="text-primary">{l.action}</span></TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString("en-IN")}</TableCell>
                    <TableCell>{l.module}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>{filtered.length} entries</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <span className="flex items-center px-2">Page {page} of {totalPages}</span>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
