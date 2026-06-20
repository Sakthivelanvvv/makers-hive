import { supabase } from "@/integrations/supabase/client";

export type ProductRecord = {
  id: string;
  name: string;
  sales_price: number;
  cost_price: number;
  on_hand_qty: number;
  reserved_qty: number;
  uom: string | null;
};

export async function fetchProducts() {
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProductRecord[];
}

export async function upsertProduct(payload: Partial<ProductRecord> & { id?: string }) {
  const values = {
    name: payload.name,
    sales_price: payload.sales_price ?? 0,
    cost_price: payload.cost_price ?? 0,
    on_hand_qty: payload.on_hand_qty ?? 0,
    reserved_qty: payload.reserved_qty ?? 0,
    uom: payload.uom ?? "unit",
  };

  if (payload.id) {
    const { error } = await supabase.from("products").update(values).eq("id", payload.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("products").insert(values);
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}
