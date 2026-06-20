export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          field_changed: string | null
          id: string
          ip_address: string | null
          module: string
          new_value: string | null
          old_value: string | null
          record_id: string | null
          record_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          field_changed?: string | null
          id?: string
          ip_address?: string | null
          module: string
          new_value?: string | null
          old_value?: string | null
          record_id?: string | null
          record_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          field_changed?: string | null
          id?: string
          ip_address?: string | null
          module?: string
          new_value?: string | null
          old_value?: string | null
          record_id?: string | null
          record_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bom_components: {
        Row: {
          bom_id: string
          component_id: string
          id: string
          notes: string | null
          quantity: number
          uom: string | null
        }
        Insert: {
          bom_id: string
          component_id: string
          id?: string
          notes?: string | null
          quantity?: number
          uom?: string | null
        }
        Update: {
          bom_id?: string
          component_id?: string
          id?: string
          notes?: string | null
          quantity?: number
          uom?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bom_components_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "boms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_components_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      boms: {
        Row: {
          created_at: string
          effective_from: string | null
          id: string
          name: string
          product_id: string
          quantity: number
          updated_at: string
          version: string | null
        }
        Insert: {
          created_at?: string
          effective_from?: string | null
          id?: string
          name: string
          product_id: string
          quantity?: number
          updated_at?: string
          version?: string | null
        }
        Update: {
          created_at?: string
          effective_from?: string | null
          id?: string
          name?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boms_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturing_orders: {
        Row: {
          assignee_id: string | null
          bom_id: string | null
          created_at: string
          id: string
          mo_number: string
          product_id: string
          quantity: number
          scheduled_date: string | null
          status: Database["public"]["Enums"]["mo_status"]
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          bom_id?: string | null
          created_at?: string
          id?: string
          mo_number?: string
          product_id: string
          quantity?: number
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["mo_status"]
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          bom_id?: string | null
          created_at?: string
          id?: string
          mo_number?: string
          product_id?: string
          quantity?: number
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["mo_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manufacturing_orders_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "boms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manufacturing_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      mo_components: {
        Row: {
          component_id: string
          consumed_qty: number
          id: string
          mo_id: string
          to_consume_qty: number
        }
        Insert: {
          component_id: string
          consumed_qty?: number
          id?: string
          mo_id: string
          to_consume_qty?: number
        }
        Update: {
          component_id?: string
          consumed_qty?: number
          id?: string
          mo_id?: string
          to_consume_qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "mo_components_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mo_components_mo_id_fkey"
            columns: ["mo_id"]
            isOneToOne: false
            referencedRelation: "manufacturing_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          cost_price: number
          created_at: string
          created_by: string | null
          id: string
          name: string
          on_hand_qty: number
          reserved_qty: number
          sales_price: number
          uom: string | null
          updated_at: string
        }
        Insert: {
          cost_price?: number
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          on_hand_qty?: number
          reserved_qty?: number
          sales_price?: number
          uom?: string | null
          updated_at?: string
        }
        Update: {
          cost_price?: number
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          on_hand_qty?: number
          reserved_qty?: number
          sales_price?: number
          uom?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          last_login: string | null
          login_id: string | null
          name: string | null
          position: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          last_login?: string | null
          login_id?: string | null
          name?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          login_id?: string | null
          name?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_order_lines: {
        Row: {
          cost_price: number
          id: string
          ordered_qty: number
          po_id: string
          product_id: string
          received_qty: number
        }
        Insert: {
          cost_price?: number
          id?: string
          ordered_qty?: number
          po_id: string
          product_id: string
          received_qty?: number
        }
        Update: {
          cost_price?: number
          id?: string
          ordered_qty?: number
          po_id?: string
          product_id?: string
          received_qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_lines_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          amount: number
          created_at: string
          creation_date: string | null
          id: string
          po_number: string
          responsible_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          vendor: string
          vendor_address: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          creation_date?: string | null
          id?: string
          po_number?: string
          responsible_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          vendor: string
          vendor_address?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          creation_date?: string | null
          id?: string
          po_number?: string
          responsible_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          vendor?: string
          vendor_address?: string | null
        }
        Relationships: []
      }
      sales_order_lines: {
        Row: {
          delivered_qty: number
          id: string
          ordered_qty: number
          product_id: string
          sales_price: number
          so_id: string
        }
        Insert: {
          delivered_qty?: number
          id?: string
          ordered_qty?: number
          product_id: string
          sales_price?: number
          so_id: string
        }
        Update: {
          delivered_qty?: number
          id?: string
          ordered_qty?: number
          product_id?: string
          sales_price?: number
          so_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_lines_so_id_fkey"
            columns: ["so_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          amount: number
          created_at: string
          creation_date: string | null
          customer: string
          customer_address: string | null
          id: string
          salesperson_id: string | null
          so_number: string
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          creation_date?: string | null
          customer: string
          customer_address?: string | null
          id?: string
          salesperson_id?: string | null
          so_number?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          creation_date?: string | null
          customer?: string
          customer_address?: string | null
          id?: string
          salesperson_id?: string | null
          so_number?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_centers: {
        Row: {
          capacity: number | null
          cost_per_hour: number | null
          created_at: string
          id: string
          name: string
          responsible_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          cost_per_hour?: number | null
          created_at?: string
          id?: string
          name: string
          responsible_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          cost_per_hour?: number | null
          created_at?: string
          id?: string
          name?: string
          responsible_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          actual_duration: number | null
          created_at: string
          end_time: string | null
          expected_duration: number | null
          id: string
          mo_id: string | null
          operation: string
          start_time: string | null
          status: Database["public"]["Enums"]["wo_status"]
          updated_at: string
          work_center_id: string | null
        }
        Insert: {
          actual_duration?: number | null
          created_at?: string
          end_time?: string | null
          expected_duration?: number | null
          id?: string
          mo_id?: string | null
          operation: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["wo_status"]
          updated_at?: string
          work_center_id?: string | null
        }
        Update: {
          actual_duration?: number | null
          created_at?: string
          end_time?: string | null
          expected_duration?: number | null
          id?: string
          mo_id?: string | null
          operation?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["wo_status"]
          updated_at?: string
          work_center_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_mo_id_fkey"
            columns: ["mo_id"]
            isOneToOne: false
            referencedRelation: "manufacturing_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_work_center_id_fkey"
            columns: ["work_center_id"]
            isOneToOne: false
            referencedRelation: "work_centers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      mo_status:
        | "draft"
        | "confirmed"
        | "in_progress"
        | "to_close"
        | "done"
        | "cancelled"
      order_status:
        | "draft"
        | "confirmed"
        | "partially_delivered"
        | "fully_delivered"
        | "partially_received"
        | "fully_received"
        | "cancelled"
      wo_status: "draft" | "confirmed" | "in_progress" | "done" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      mo_status: [
        "draft",
        "confirmed",
        "in_progress",
        "to_close",
        "done",
        "cancelled",
      ],
      order_status: [
        "draft",
        "confirmed",
        "partially_delivered",
        "fully_delivered",
        "partially_received",
        "fully_received",
        "cancelled",
      ],
      wo_status: ["draft", "confirmed", "in_progress", "done", "cancelled"],
    },
  },
} as const
