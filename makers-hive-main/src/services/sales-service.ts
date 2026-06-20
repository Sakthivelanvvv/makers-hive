import { supabase } from "@/integrations/supabase/client";

export type SalesOrderRecord = {
  id: string;
  so_number: string;
  customer: string;
  customer_address: string | null;
  amount: number;
  creation_date: string | null;
  status: string;
};

export async function fetchSalesOrders() {
  const { data, error } = await supabase.from("sales_orders").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SalesOrderRecord[];
}

export async function createSalesOrder(payload: { customer: string; customer_address: string; amount: number }) {
  const { error } = await supabase.from("sales_orders").insert({
    customer: payload.customer,
    customer_address: payload.customer_address,
    amount: payload.amount,
  });
  if (error) throw error;
}

export async function updateSalesOrderStatus(id: string, status: string) {
  const { error } = await supabase.from("sales_orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteSalesOrder(id: string) {
  const { error } = await supabase.from("sales_orders").delete().eq("id", id);
  if (error) throw error;
}
