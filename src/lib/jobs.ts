import { supabase } from "@/integrations/supabase/client";
import type { JobPriority, JobStatus } from "@/lib/rework";

export type ReworkJob = {
  id: string;
  job_no: string;
  reported_at: string;
  created_by: string;
  department: string | null;
  line_id: string | null;
  line_name: string | null;
  product_code: string;
  product_name: string | null;
  lot_no: string | null;
  work_order_no: string | null;
  defect_qty: number;
  unit: string;
  defect_type: string | null;
  problem_detail: string;
  root_cause: string | null;
  priority: JobPriority;
  due_date: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  status: JobStatus;
  started_at: string | null;
  rework_method: string | null;
  rework_qty: number | null;
  pass_qty: number | null;
  fail_qty: number | null;
  time_spent_minutes: number | null;
  result_note: string | null;
  result_by: string | null;
  result_at: string | null;
  qc_result: string | null;
  qc_reason: string | null;
  qc_by: string | null;
  qc_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileLite = { id: string; full_name: string; email: string | null; department: string | null };

export async function fetchJobs(): Promise<ReworkJob[]> {
  const { data, error } = await supabase
    .from("rework_jobs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ReworkJob[];
}

export async function fetchProfiles(): Promise<ProfileLite[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, department")
    .order("full_name");
  if (error) throw error;
  return (data ?? []) as unknown as ProfileLite[];
}

export function nameOf(profiles: ProfileLite[], id?: string | null) {
  if (!id) return "-";
  const p = profiles.find((x) => x.id === id);
  return p?.full_name || p?.email || "-";
}
