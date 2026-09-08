import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { JobPriority } from "@/lib/rework";

export const Route = createFileRoute("/_authenticated/jobs/new")({
  head: () => ({
    meta: [
      { title: "สร้างงาน Rework — Rework System" },
      { name: "description", content: "สร้างใบแจ้งงาน Rework ใหม่" },
    ],
  }),
  component: NewJobPage,
});

function newJobNo() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `RWK-${date}-${seq}`;
}

function NewJobPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    line_name: "Line 1 - Assembly",
    product_code: "",
    product_name: "",
    lot_no: "",
    work_order_no: "",
    defect_qty: "",
    unit: "PCS",
    defect_type: "",
    problem_detail: "",
    priority: "normal" as JobPriority,
    due_date: "",
  });

  function setField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function createJob(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;

    setBusy(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("rework_jobs").insert({
      id: crypto.randomUUID(),
      job_no: newJobNo(),
      reported_at: now,
      created_by: user.id,
      department: profile?.department ?? null,
      line_id: form.line_name,
      line_name: form.line_name,
      product_code: form.product_code.trim(),
      product_name: form.product_name.trim() || null,
      lot_no: form.lot_no.trim() || null,
      work_order_no: form.work_order_no.trim() || null,
      defect_qty: Number(form.defect_qty),
      unit: form.unit.trim() || "PCS",
      defect_type: form.defect_type.trim() || null,
      problem_detail: form.problem_detail.trim(),
      root_cause: null,
      priority: form.priority,
      due_date: form.due_date || null,
      assigned_to: null,
      assigned_by: null,
      assigned_at: null,
      status: "new",
      started_at: null,
      rework_method: null,
      rework_qty: null,
      pass_qty: null,
      fail_qty: null,
      time_spent_minutes: null,
      result_note: null,
      result_by: null,
      result_at: null,
      qc_result: null,
      qc_reason: null,
      qc_by: null,
      qc_at: null,
      closed_at: null,
      created_at: now,
      updated_at: now,
    });
    setBusy(false);

    if (error) {
      toast.error("สร้างงานไม่สำเร็จ", { description: error.message });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["jobs"] });
    toast.success("สร้างงาน Rework สำเร็จ");
    navigate({ to: "/jobs" });
  }

  return (
    <AppShell title="สร้างงาน Rework" subtitle="บันทึกปัญหาหน้างานลง localStorage">
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>รายละเอียดงาน</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createJob} className="grid gap-4 md:grid-cols-2">
            <Field label="Line ผลิต">
              <select
                value={form.line_name}
                onChange={(event) => setField("line_name", event.target.value)}
                className="flex min-h-10 w-full rounded-2xl border-2 border-input bg-[#FFF8E7] px-4 py-2 text-sm font-semibold shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
              >
                <option>Line 1 - Assembly</option>
                <option>Line 2 - Packing</option>
                <option>Line 3 - Molding</option>
              </select>
            </Field>
            <Field label="Product Code">
              <Input
                required
                value={form.product_code}
                onChange={(e) => setField("product_code", e.target.value)}
              />
            </Field>
            <Field label="Product Name">
              <Input
                value={form.product_name}
                onChange={(e) => setField("product_name", e.target.value)}
              />
            </Field>
            <Field label="Lot No.">
              <Input value={form.lot_no} onChange={(e) => setField("lot_no", e.target.value)} />
            </Field>
            <Field label="Work Order No.">
              <Input
                value={form.work_order_no}
                onChange={(e) => setField("work_order_no", e.target.value)}
              />
            </Field>
            <Field label="จำนวน Defect">
              <Input
                required
                min="1"
                type="number"
                value={form.defect_qty}
                onChange={(e) => setField("defect_qty", e.target.value)}
              />
            </Field>
            <Field label="หน่วย">
              <Input
                required
                value={form.unit}
                onChange={(e) => setField("unit", e.target.value)}
              />
            </Field>
            <Field label="ประเภทปัญหา">
              <Input
                required
                value={form.defect_type}
                onChange={(e) => setField("defect_type", e.target.value)}
              />
            </Field>
            <Field label="Priority">
              <select
                value={form.priority}
                onChange={(event) => setField("priority", event.target.value)}
                className="flex min-h-10 w-full rounded-2xl border-2 border-input bg-[#FFF8E7] px-4 py-2 text-sm font-semibold shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
              >
                <option value="low">ต่ำ (Low)</option>
                <option value="normal">ปกติ (Normal)</option>
                <option value="high">สูง (High)</option>
                <option value="urgent">เร่งด่วน (Urgent)</option>
              </select>
            </Field>
            <Field label="Due Date">
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setField("due_date", e.target.value)}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="รายละเอียดปัญหา">
                <Textarea
                  required
                  value={form.problem_detail}
                  onChange={(e) => setField("problem_detail", e.target.value)}
                  rows={5}
                />
              </Field>
            </div>
            <div className="flex gap-3 md:col-span-2">
              <Button type="submit" disabled={busy}>
                {busy ? "กำลังบันทึก..." : "บันทึกงาน"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/jobs" })}>
                ยกเลิก
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
