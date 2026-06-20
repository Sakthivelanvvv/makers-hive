import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  ShoppingBag,
  Factory,
  ListTree,
  Wrench,
  Plus,
  HandCoins,
  ScrollText,
  Boxes,
} from "lucide-react";
import { PageHeader } from "@/lib/page-header";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { getDashboardStats } from "@/services/dashboard-service";
import {
  MANUFACTURING_STATUS_ORDER,
  PURCHASE_STATUS_ORDER,
  SALES_STATUS_ORDER,
} from "@/shared/constants";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Forge ERP" }] }),
  component: Dashboard,
});

const palette = ["#5dd4d4", "#5dd49f", "#e8c46b", "#a875e8", "#e87575"];

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const kpis = [
    { label: "Sales Orders", value: stats?.counts.sales_orders ?? 0, icon: ShoppingCart, to: "/sales" },
    { label: "Purchase Orders", value: stats?.counts.purchase_orders ?? 0, icon: ShoppingBag, to: "/purchase" },
    { label: "Manufacturing Orders", value: stats?.counts.manufacturing_orders ?? 0, icon: Factory, to: "/manufacturing" },
    { label: "Work Orders", value: stats?.counts.work_orders ?? 0, icon: Wrench, to: "/work-orders" },
    { label: "Audit Logs", value: stats?.counts.profiles ?? 0, icon: ScrollText, to: "/audit-logs" },
    { label: "Products", value: stats?.counts.products ?? 0, icon: Boxes, to: "/products" },
    { label: "Bill of Materials", value: stats?.counts.boms ?? 0, icon: ListTree, to: "/bom" },
    { label: "Work Centers", value: stats?.counts.work_centers ?? 0, icon: HandCoins, to: "/work-centers" },
  ] as const;

  const inventoryStatus = stats?.inventoryStatus;

  const toData = (statuses: string[], src?: Record<string, number>) =>
    statuses.map((s) => ({ name: s.replace(/_/g, " "), value: src?.[s] ?? 0 }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Real-time operations overview"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm"><Link to="/sales"><Plus className="mr-1 h-4 w-4" />Sales</Link></Button>
            <Button asChild size="sm" variant="secondary"><Link to="/purchase"><Plus className="mr-1 h-4 w-4" />Purchase</Link></Button>
            <Button asChild size="sm" variant="secondary"><Link to="/manufacturing"><Plus className="mr-1 h-4 w-4" />MO</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/products"><Plus className="mr-1 h-4 w-4" />Product</Link></Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} to={k.to} className="block">
            <Card className="glass border-border/50 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="text-xs text-muted-foreground">{k.label}</div>
                  <div className="mt-1 text-2xl font-semibold">{k.value}</div>
                </div>
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <k.icon className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Manufacturing Status" data={toData(MANUFACTURING_STATUS_ORDER, stats?.mo)} />
        <ChartCard title="Sales Status" data={toData(SALES_STATUS_ORDER, stats?.so)} />
        <ChartCard title="Purchase Status" data={toData(PURCHASE_STATUS_ORDER, stats?.po)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCardLine title="Sales Trend" data={stats?.salesTrend ?? []} />
        <ChartCardLine title="Purchase Trend" data={stats?.purchaseTrend ?? []} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <InventoryStatusCard title="Inventory Status" data={inventoryStatus} />
      </div>
    </div>
  );
}

function ChartCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="oklch(0.3 0.02 250 / 40%)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 11 }} />
              <YAxis tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "oklch(0.22 0.022 250)", border: "1px solid oklch(0.35 0.025 250)", borderRadius: 8 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={palette[i % palette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCardLine({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="oklch(0.3 0.02 250 / 40%)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 11 }} />
              <YAxis tick={{ fill: "oklch(0.7 0.02 250)", fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "oklch(0.22 0.022 250)", border: "1px solid oklch(0.35 0.025 250)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="value" stroke="#5dd4d4" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function InventoryStatusCard({ title, data }: { title: string; data?: { in_stock: number; low_stock: number; out_of_stock: number } }) {
  const items = [
    { label: "In Stock", value: data?.in_stock ?? 0, color: "text-success" },
    { label: "Low Stock", value: data?.low_stock ?? 0, color: "text-warning" },
    { label: "Out of Stock", value: data?.out_of_stock ?? 0, color: "text-destructive" },
  ];

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.label} className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className={`mt-1 text-2xl font-semibold ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
