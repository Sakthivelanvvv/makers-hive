
-- =========================
-- ENUMS
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TYPE public.order_status AS ENUM ('draft','confirmed','partially_delivered','fully_delivered','partially_received','fully_received','cancelled');
CREATE TYPE public.mo_status AS ENUM ('draft','confirmed','in_progress','to_close','done','cancelled');
CREATE TYPE public.wo_status AS ENUM ('draft','confirmed','in_progress','done','cancelled');

-- =========================
-- TIMESTAMP TRIGGER
-- =========================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========================
-- PROFILES
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  login_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  position TEXT,
  status TEXT DEFAULT 'active',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- USER ROLES + has_role
-- =========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Admin policy for user_roles management
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================
-- AUTO PROFILE + FIRST USER ADMIN
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_count INT;
BEGIN
  INSERT INTO public.profiles (id, email, login_id, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'login_id', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1))
  );
  SELECT count(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id,'admin');
  ELSE
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id,'user');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- PRODUCTS
-- =========================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sales_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  on_hand_qty NUMERIC(14,2) NOT NULL DEFAULT 0,
  reserved_qty NUMERIC(14,2) NOT NULL DEFAULT 0,
  uom TEXT DEFAULT 'unit',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select_auth" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_insert_auth" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "products_update_auth" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "products_delete_admin" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- WORK CENTERS
-- =========================
CREATE TABLE public.work_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  capacity NUMERIC(10,2) DEFAULT 1,
  cost_per_hour NUMERIC(12,2) DEFAULT 0,
  responsible_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_centers TO authenticated;
GRANT ALL ON public.work_centers TO service_role;
ALTER TABLE public.work_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wc_select" ON public.work_centers FOR SELECT TO authenticated USING (true);
CREATE POLICY "wc_insert" ON public.work_centers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "wc_update" ON public.work_centers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "wc_delete" ON public.work_centers FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_wc_updated BEFORE UPDATE ON public.work_centers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- BILL OF MATERIALS
-- =========================
CREATE TABLE public.boms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  version TEXT DEFAULT '1.0',
  effective_from DATE DEFAULT CURRENT_DATE,
  quantity NUMERIC(14,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boms TO authenticated;
GRANT ALL ON public.boms TO service_role;
ALTER TABLE public.boms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bom_select" ON public.boms FOR SELECT TO authenticated USING (true);
CREATE POLICY "bom_write" ON public.boms FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_bom_updated BEFORE UPDATE ON public.boms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.bom_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID NOT NULL REFERENCES public.boms(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES public.products(id),
  quantity NUMERIC(14,2) NOT NULL DEFAULT 1,
  uom TEXT DEFAULT 'unit',
  notes TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bom_components TO authenticated;
GRANT ALL ON public.bom_components TO service_role;
ALTER TABLE public.bom_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bomc_all" ON public.bom_components FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================
-- SALES ORDERS
-- =========================
CREATE SEQUENCE IF NOT EXISTS public.so_seq START 1000;
CREATE TABLE public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  so_number TEXT UNIQUE NOT NULL DEFAULT ('SO/'||to_char(now(),'YYYY')||'/'||nextval('public.so_seq')),
  customer TEXT NOT NULL,
  customer_address TEXT,
  salesperson_id UUID REFERENCES auth.users(id),
  status public.order_status NOT NULL DEFAULT 'draft',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  creation_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_orders TO authenticated;
GRANT ALL ON public.sales_orders TO service_role;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "so_all" ON public.sales_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_so_updated BEFORE UPDATE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sales_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  so_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  ordered_qty NUMERIC(14,2) NOT NULL DEFAULT 0,
  delivered_qty NUMERIC(14,2) NOT NULL DEFAULT 0,
  sales_price NUMERIC(14,2) NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_order_lines TO authenticated;
GRANT ALL ON public.sales_order_lines TO service_role;
ALTER TABLE public.sales_order_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sol_all" ON public.sales_order_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================
-- PURCHASE ORDERS
-- =========================
CREATE SEQUENCE IF NOT EXISTS public.po_seq START 1000;
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT UNIQUE NOT NULL DEFAULT ('PO/'||to_char(now(),'YYYY')||'/'||nextval('public.po_seq')),
  vendor TEXT NOT NULL,
  vendor_address TEXT,
  responsible_id UUID REFERENCES auth.users(id),
  status public.order_status NOT NULL DEFAULT 'draft',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  creation_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "po_all" ON public.purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_po_updated BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.purchase_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  ordered_qty NUMERIC(14,2) NOT NULL DEFAULT 0,
  received_qty NUMERIC(14,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(14,2) NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_lines TO authenticated;
GRANT ALL ON public.purchase_order_lines TO service_role;
ALTER TABLE public.purchase_order_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pol_all" ON public.purchase_order_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================
-- MANUFACTURING ORDERS
-- =========================
CREATE SEQUENCE IF NOT EXISTS public.mo_seq START 1000;
CREATE TABLE public.manufacturing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mo_number TEXT UNIQUE NOT NULL DEFAULT ('MO/'||to_char(now(),'YYYY')||'/'||nextval('public.mo_seq')),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity NUMERIC(14,2) NOT NULL DEFAULT 1,
  bom_id UUID REFERENCES public.boms(id),
  assignee_id UUID REFERENCES auth.users(id),
  status public.mo_status NOT NULL DEFAULT 'draft',
  scheduled_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manufacturing_orders TO authenticated;
GRANT ALL ON public.manufacturing_orders TO service_role;
ALTER TABLE public.manufacturing_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mo_all" ON public.manufacturing_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_mo_updated BEFORE UPDATE ON public.manufacturing_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.mo_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mo_id UUID NOT NULL REFERENCES public.manufacturing_orders(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES public.products(id),
  to_consume_qty NUMERIC(14,2) NOT NULL DEFAULT 0,
  consumed_qty NUMERIC(14,2) NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mo_components TO authenticated;
GRANT ALL ON public.mo_components TO service_role;
ALTER TABLE public.mo_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "moc_all" ON public.mo_components FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================
-- WORK ORDERS
-- =========================
CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mo_id UUID REFERENCES public.manufacturing_orders(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  work_center_id UUID REFERENCES public.work_centers(id),
  expected_duration NUMERIC(10,2) DEFAULT 0,
  actual_duration NUMERIC(10,2) DEFAULT 0,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status public.wo_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_orders TO authenticated;
GRANT ALL ON public.work_orders TO service_role;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wo_all" ON public.work_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_wo_updated BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- AUDIT LOGS
-- =========================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  module TEXT NOT NULL,
  record_type TEXT,
  record_id TEXT,
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "audit_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
