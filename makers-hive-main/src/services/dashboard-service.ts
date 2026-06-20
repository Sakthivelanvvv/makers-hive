import { supabase } from "@/integrations/supabase/client";

const countTable = async (table: string) => {
  try {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
};

const bucketStatuses = async (table: string) => {
  try {
    const { data, error } = await supabase.from(table).select("status");
    if (error) return {};

    const result: Record<string, number> = {};
    for (const row of data ?? []) {
      const key = row.status;
      result[key] = (result[key] ?? 0) + 1;
    }

    return result;
  } catch {
    return {};
  }
};

const buildTrend = async (table: string, amountField = "amount") => {
  try {
    const { data, error } = await supabase.from(table).select(`created_at, ${amountField}`);
    if (error || !data) return [];

    const monthly = new Map<string, number>();
    for (const row of data) {
      const date = new Date(row.created_at);
      if (Number.isNaN(date.getTime())) continue;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const value = Number(row[amountField] ?? 0);
      monthly.set(monthKey, (monthly.get(monthKey) ?? 0) + value);
    }

    return Array.from(monthly.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-6)
      .map(([key, value]) => ({
        name: key.slice(5),
        value,
      }));
  } catch {
    return [];
  }
};

const getInventoryStatus = async () => {
  try {
    const { data, error } = await supabase.from("products").select("on_hand_qty,reserved_qty");
    if (error || !data) return { in_stock: 0, low_stock: 0, out_of_stock: 0 };

    const status = { in_stock: 0, low_stock: 0, out_of_stock: 0 };
    for (const row of data) {
      const available = Number(row.on_hand_qty ?? 0) - Number(row.reserved_qty ?? 0);
      if (available <= 0) {
        status.out_of_stock += 1;
      } else if (available < 5) {
        status.low_stock += 1;
      } else {
        status.in_stock += 1;
      }
    }
    return status;
  } catch {
    return { in_stock: 0, low_stock: 0, out_of_stock: 0 };
  }
};

export async function getDashboardStats() {
  const [
    salesOrders,
    purchaseOrders,
    manufacturingOrders,
    products,
    boms,
    workOrders,
    workCenters,
    profiles,
  ] = await Promise.all([
    countTable("sales_orders"),
    countTable("purchase_orders"),
    countTable("manufacturing_orders"),
    countTable("products"),
    countTable("boms"),
    countTable("work_orders"),
    countTable("work_centers"),
    countTable("profiles"),
  ]);

  const [moStatusMap, soStatusMap, poStatusMap, salesTrend, purchaseTrend, inventoryStatus] =
    await Promise.all([
      bucketStatuses("manufacturing_orders"),
      bucketStatuses("sales_orders"),
      bucketStatuses("purchase_orders"),
      buildTrend("sales_orders"),
      buildTrend("purchase_orders"),
      getInventoryStatus(),
    ]);

  return {
    counts: {
      sales_orders: salesOrders,
      purchase_orders: purchaseOrders,
      manufacturing_orders: manufacturingOrders,
      products,
      boms,
      work_orders: workOrders,
      work_centers: workCenters,
      profiles,
    },
    mo: moStatusMap,
    so: soStatusMap,
    po: poStatusMap,
    salesTrend,
    purchaseTrend,
    inventoryStatus,
  };
}
