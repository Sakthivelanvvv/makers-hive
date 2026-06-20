export const ERP_ROLES = {
  ADMIN: "admin",
  SALES_USER: "sales_user",
  PURCHASE_USER: "purchase_user",
  MANUFACTURING_USER: "manufacturing_user",
  INVENTORY_MANAGER: "inventory_manager",
  BUSINESS_OWNER: "business_owner",
} as const;

export const SALES_STATUS_ORDER = [
  "draft",
  "confirmed",
  "partially_delivered",
  "fully_delivered",
  "cancelled",
] as const;

export const PURCHASE_STATUS_ORDER = [
  "draft",
  "pending_approval",
  "approved",
  "confirmed",
  "partially_received",
  "fully_received",
  "cancelled",
] as const;

export const MANUFACTURING_STATUS_ORDER = [
  "draft",
  "confirmed",
  "in_progress",
  "to_close",
  "done",
  "cancelled",
] as const;

export const STATUS_LABELS = {
  draft: "Draft",
  confirmed: "Confirmed",
  pending_approval: "Pending Approval",
  approved: "Approved",
  partially_delivered: "Partially Delivered",
  fully_delivered: "Fully Delivered",
  partially_received: "Partially Received",
  fully_received: "Fully Received",
  in_progress: "In Progress",
  to_close: "To Close",
  done: "Done",
  cancelled: "Cancelled",
} as const;

export const ROLE_LABELS = {
  [ERP_ROLES.ADMIN]: "Admin",
  [ERP_ROLES.SALES_USER]: "Sales User",
  [ERP_ROLES.PURCHASE_USER]: "Purchase User",
  [ERP_ROLES.MANUFACTURING_USER]: "Manufacturing User",
  [ERP_ROLES.INVENTORY_MANAGER]: "Inventory Manager",
  [ERP_ROLES.BUSINESS_OWNER]: "Business Owner",
} as const;
