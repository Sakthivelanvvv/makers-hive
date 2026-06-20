import { supabase } from "@/integrations/supabase/client";

export type ManufacturingOrderRecord = {
  id: string;
  mo_number: string;
  quantity: number;
  status: string;
  scheduled_date: string | null;
  products?: { name: string } | null;
};

export async function fetchProductsForMo() {
  const { data, error } = await supabase.from("products").select("id,name");
  if (error) throw error;
  return (data ?? []) as { id: string; name: string }[];
}

export async function fetchManufacturingOrders() {
  const { data, error } = await supabase.from("manufacturing_orders")
    .select("*, products:product_id(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ManufacturingOrderRecord[];
}

export async function createManufacturingOrder(payload: { product_id: string; quantity: number }) {
  const { error } = await supabase.from("manufacturing_orders").insert(payload);
  if (error) throw error;
}

export async function updateManufacturingOrderStatus(id: string, status: string) {
  const { error } = await supabase.from("manufacturing_orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteManufacturingOrder(id: string) {
  const { error } = await supabase.from("manufacturing_orders").delete().eq("id", id);
  if (error) throw error;
}
