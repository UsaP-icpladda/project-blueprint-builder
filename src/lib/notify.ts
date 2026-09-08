import { supabase } from "@/integrations/supabase/client";

export type NotifyKind =
  "created" | "assigned" | "pending_qc" | "rejected" | "closed" | "cancelled";

type Ctx = {
  jobNo: string;
  jobId: string;
  createdBy?: string;
  productCode?: string;
  qty?: number | string;
  reason?: string;
};

export function buildMessage(kind: NotifyKind, ctx: Ctx) {
  switch (kind) {
    case "created":
      return {
        title: "มีงาน Rework ใหม่",
        message: `งาน Rework เลขที่ ${ctx.jobNo} ถูกสร้างโดย ${ctx.createdBy ?? "-"} สำหรับสินค้า ${ctx.productCode ?? "-"} จำนวน ${ctx.qty ?? "-"} รายการ`,
      };
    case "assigned":
      return {
        title: "คุณได้รับมอบหมายงาน Rework",
        message: `งาน Rework เลขที่ ${ctx.jobNo} ถูกมอบหมายให้คุณ กรุณาตรวจสอบและดำเนินการ`,
      };
    case "pending_qc":
      return {
        title: "งาน Rework รอตรวจสอบ",
        message: `งาน Rework เลขที่ ${ctx.jobNo} ดำเนินการเสร็จแล้ว รอ QC/QA ตรวจสอบ`,
      };
    case "rejected":
      return {
        title: "งาน Rework ถูก Reject",
        message: `งาน Rework เลขที่ ${ctx.jobNo} ไม่ผ่านการตรวจสอบ เหตุผล: ${ctx.reason ?? "-"}`,
      };
    case "closed":
      return {
        title: "งาน Rework ถูกปิดแล้ว",
        message: `งาน Rework เลขที่ ${ctx.jobNo} ได้รับการอนุมัติและปิดงานเรียบร้อยแล้ว`,
      };
    case "cancelled":
      return {
        title: "งาน Rework ถูกยกเลิก",
        message: `งาน Rework เลขที่ ${ctx.jobNo} ถูกยกเลิก`,
      };
  }
}

/** ส่งการแจ้งเตือนในระบบให้ผู้ใช้หลายคน (ตัดค่าซ้ำและค่าว่างออก) */
export async function notifyUsers(
  userIds: (string | null | undefined)[],
  kind: NotifyKind,
  ctx: Ctx,
) {
  const ids = Array.from(new Set(userIds.filter(Boolean) as string[]));
  if (ids.length === 0) return;
  const { title, message } = buildMessage(kind, ctx);
  await supabase
    .from("notifications")
    .insert(ids.map((user_id) => ({ user_id, job_id: ctx.jobId, title, message })));
}

/** ผู้ใช้ทั้งหมดที่มี role ที่กำหนด */
export async function userIdsWithRoles(roles: string[]) {
  const { data } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .in("role", roles as never[]);
  return (data ?? []).map((r) => r["user_id"] as string);
}

export async function logHistory(params: {
  jobId: string;
  actorId: string;
  action: string;
  detail?: string;
  fromStatus?: string | null;
  toStatus?: string | null;
}) {
  await supabase.from("job_history").insert({
    job_id: params.jobId,
    actor_id: params.actorId,
    action: params.action,
    detail: params.detail ?? null,
    from_status: (params.fromStatus ?? null) as never,
    to_status: (params.toStatus ?? null) as never,
  });
}
