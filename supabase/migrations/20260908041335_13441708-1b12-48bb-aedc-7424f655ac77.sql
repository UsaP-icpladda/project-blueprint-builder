CREATE TYPE public.app_role AS ENUM ('operator','supervisor','qc','manager','admin');
CREATE TYPE public.job_status AS ENUM ('new','assigned','in_progress','pending_qc','rework_required','closed','cancelled');
CREATE TYPE public.job_priority AS ENUM ('low','normal','high','urgent');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  employee_code text,
  department text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_count int;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, department)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email, NEW.raw_user_meta_data->>'department');
  SELECT count(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'operator');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin(auth.uid())) WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "roles readable" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.departments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.production_lines (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.products (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, unit text NOT NULL DEFAULT 'PCS', active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.defect_types (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.units (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['departments','production_lines','products','defect_types','units'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY "read master %1$s" ON public.%1$I FOR SELECT TO authenticated USING (true);', t);
    EXECUTE format('CREATE POLICY "admin write %1$s" ON public.%1$I FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));', t);
  END LOOP;
END $$;

CREATE TABLE public.rework_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_no text NOT NULL UNIQUE,
  reported_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  department text,
  line_id uuid REFERENCES public.production_lines(id),
  line_name text,
  product_code text NOT NULL,
  product_name text,
  lot_no text,
  work_order_no text,
  defect_qty numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'PCS',
  defect_type text,
  problem_detail text NOT NULL,
  root_cause text,
  priority public.job_priority NOT NULL DEFAULT 'normal',
  due_date date,
  assigned_to uuid REFERENCES auth.users(id),
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz,
  status public.job_status NOT NULL DEFAULT 'new',
  started_at timestamptz,
  rework_method text,
  rework_qty numeric,
  pass_qty numeric,
  fail_qty numeric,
  time_spent_minutes numeric,
  result_note text,
  result_by uuid REFERENCES auth.users(id),
  result_at timestamptz,
  qc_result text,
  qc_reason text,
  qc_by uuid REFERENCES auth.users(id),
  qc_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rework_jobs TO authenticated;
GRANT ALL ON public.rework_jobs TO service_role;
ALTER TABLE public.rework_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs readable" ON public.rework_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "jobs insert" ON public.rework_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND NOT public.has_role(auth.uid(),'manager'));
CREATE POLICY "jobs update" ON public.rework_jobs FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(),'supervisor')
    OR public.has_role(auth.uid(),'qc')
    OR auth.uid() = created_by
    OR auth.uid() = assigned_to
  ) WITH CHECK (true);
CREATE POLICY "jobs delete admin" ON public.rework_jobs FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_rework_jobs_updated BEFORE UPDATE ON public.rework_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.set_job_no()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d text; n int; BEGIN
  IF NEW.job_no IS NOT NULL AND NEW.job_no <> '' THEN RETURN NEW; END IF;
  d := to_char(timezone('Asia/Bangkok', now()), 'YYYYMMDD');
  SELECT COALESCE(MAX(NULLIF(regexp_replace(job_no, '^RWK-\d{8}-', ''), '')::int), 0) + 1 INTO n
  FROM public.rework_jobs WHERE job_no LIKE 'RWK-' || d || '-%';
  NEW.job_no := 'RWK-' || d || '-' || lpad(n::text, 4, '0');
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_set_job_no BEFORE INSERT ON public.rework_jobs FOR EACH ROW EXECUTE FUNCTION public.set_job_no();

CREATE TABLE public.job_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.rework_jobs(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  phase text NOT NULL DEFAULT 'before',
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.job_attachments TO authenticated;
GRANT ALL ON public.job_attachments TO service_role;
ALTER TABLE public.job_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attachments readable" ON public.job_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "attachments insert" ON public.job_attachments FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "attachments delete" ON public.job_attachments FOR DELETE TO authenticated USING (auth.uid() = uploaded_by OR public.is_admin(auth.uid()));

CREATE TABLE public.job_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.rework_jobs(id) ON DELETE CASCADE,
  action text NOT NULL,
  detail text,
  from_status public.job_status,
  to_status public.job_status,
  actor_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.job_history TO authenticated;
GRANT ALL ON public.job_history TO service_role;
ALTER TABLE public.job_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history readable" ON public.job_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "history insert" ON public.job_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.rework_jobs(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO public.departments (name) VALUES ('ฝ่ายผลิต'),('QC/QA'),('วิศวกรรม'),('คลังสินค้า');
INSERT INTO public.production_lines (code, name) VALUES ('LINE-01','Line 1 - Assembly'),('LINE-02','Line 2 - Packing'),('LINE-03','Line 3 - Molding');
INSERT INTO public.products (code, name, unit) VALUES ('PRD-1001','ฝาขวด PET 28mm','PCS'),('PRD-1002','ขวด PET 600ml','PCS'),('PRD-1003','กล่องกระดาษลูกฟูก B','BOX');
INSERT INTO public.defect_types (code, name) VALUES ('DF-01','ฉลากติดเบี้ยว'),('DF-02','รอยขีดข่วน'),('DF-03','สีเพี้ยน'),('DF-04','บรรจุไม่ครบ'),('DF-05','ปิดผนึกไม่สนิท');
INSERT INTO public.units (code, name) VALUES ('PCS','ชิ้น'),('BOX','กล่อง'),('KG','กิโลกรัม'),('PLT','พาเลท');

CREATE POLICY "rework attachments read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'rework-attachments');
CREATE POLICY "rework attachments upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'rework-attachments');
CREATE POLICY "rework attachments delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'rework-attachments');