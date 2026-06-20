import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart, ShoppingBag, Factory, Package, ListTree, Users, Wrench, Building2, Plus,
} from "lucide-react";
import { PageHeader } from "@/lib/page-header";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Forge ERP" }] }),
  component: Dashboard,
});

const palette = ["#5dd4d4", "#5dd49f", "#e8c46b", "#a875e8", "#e87575"];

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const tables = ["sales_orders","purchase_orders","manufacturing_orders","products","boms","work_orders","work_centers","profiles"] as const;
      const counts: Record<string, number> = {};
      await Promise.all(tables.map(async (t) => {
        const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
        counts[t] = count ?? 0;
      }));

      const { data: mo } = await supabase.from("manufacturing_orders").select("status");
      const { data: so } = await supabase.from("sales_orders").select("status");
      const { data: po } = await supabase.from("purchase_orders").select("status");

      const bucket = (rows: { status: string }[] | null) => {
        const m: Record<string, number> = {};
        (rows ?? []).forEach((r) => { m[r.status] = (m[r.status] ?? 0) + 1; });
        return m;
      };
      return { counts, mo: bucket(mo), so: bucket(so), po: bucket(po) };
    },
  });

  const kpis = [
    { label: "Sales Orders", value: stats?.counts.sales_orders ?? 0, icon: ShoppingCart },
    { label: "Purchase Orders", value: stats?.counts.purchase_orders ?? 0, icon: ShoppingBag },
    { label: "Mfg Orders", value: stats?.counts.manufacturing_orders ?? 0, icon: Factory },
    { label: "Products", value: stats?.counts.products ?? 0, icon: Package },
    { label: "BoMs", value: stats?.counts.boms ?? 0, icon: ListTree },
    { label: "Work Orders", value: stats?.counts.work_orders ?? 0, icon: Wrench },
    { label: "Work Centers", value: stats?.counts.work_centers ?? 0, icon: Building2 },
    { label: "Users", value: stats?.counts.profiles ?? 0, icon: Users },
  ];

  const moStatuses = ["draft","confirmed","in_progress","to_close","done"];
  const soStatuses = ["draft","confirmed","partially_delivered","fully_delivered","cancelled"];
  const poStatuses = ["draft","confirmed","partially_received","fully_received","cancelled"];

  const toData = (statuses: string[], src?: Record<string, number>) =>
    statuses.map((s) => ({ name: s.replace(/_/g," "), value: src?.[s] ?? 0 }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Real-time operations overview"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm"><Link to="/sales"><Plus className="mr-1 h-4 w-4"/>Sales</Link></Button>
            <Button asChild size="sm" variant="secondary"><Link to="/purchase"><Plus className="mr-1 h-4 w-4"/>Purchase</Link></Button>
            <Button asChild size="sm" variant="secondary"><Link to="/manufacturing"><Plus className="mr-1 h-4 w-4"/>MO</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/products"><Plus className="mr-1 h-4 w-4"/>Product</Link></Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="glass border-border/50">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
                <div className="mt-1 text-2xl font-semibold">{k.value}</div>
              </div>
              <div className="rounded-lg bg-primary/10 p-2.5"><k.icon className="h-5 w-5 text-primary" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Manufacturing Status" data={toData(moStatuses, stats?.mo)} />
        <ChartCard title="Sales Status" data={toData(soStatuses, stats?.so)} />
        <ChartCard title="Purchase Status" data={toData(poStatuses, stats?.po)} />
      </div>
    </div>
  );
}

function ChartCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <Card className="glass border-border/50">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="oklch(0.3 0.02 250 / 40%)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 11 }} />
              <YAxis tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "oklch(0.22 0.022 250)", border: "1px solid oklch(0.35 0.025 250)", borderRadius: 8 }} />
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
