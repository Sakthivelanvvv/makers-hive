import { supabase } from "@/integrations/supabase/client";

export type PurchaseOrderRecord = {
  id: string;
  po_number: string;
  vendor: string;
  vendor_address: string | null;
  amount: number;
  creation_date: string | null;
  status: string;
};

export async function fetchPurchaseOrders() {
  const { data, error } = await supabase.from("purchase_orders").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PurchaseOrderRecord[];
}

export async function createPurchaseOrder(payload: { vendor: string; vendor_address: string; amount: number }) {
  const { error } = await supabase.from("purchase_orders").insert({
    vendor: payload.vendor,
    vendor_address: payload.vendor_address,
    amount: payload.amount,
  });
  if (error) throw error;
}

export async function updatePurchaseOrderStatus(id: string, status: string) {
  const { error } = await supabase.from("purchase_orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deletePurchaseOrder(id: string) {
  const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
  if (error) throw error;
}
