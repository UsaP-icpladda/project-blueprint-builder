export type JobStatus =
  | "new"
  | "assigned"
  | "in_progress"
  | "pending_qc"
  | "rework_required"
  | "closed"
  | "cancelled";

export type JobPriority = "low" | "normal" | "high" | "urgent";
export type AppRole = "operator" | "supervisor" | "qc" | "manager" | "admin";

export const STATUS_LABEL: Record<JobStatus, string> = {
  new: "New — งานใหม่",
  assigned: "Assigned — มอบหมายแล้ว",
  in_progress: "In Progress — กำลังแก้ไข",
  pending_qc: "Pending QC/QA — รอตรวจสอบ",
  rework_required: "Rework Required — ต้องแก้ไขเพิ่ม",
  closed: "Closed — ปิดงาน",
  cancelled: "Cancelled — ยกเลิก",
};

export const STATUS_SHORT: Record<JobStatus, string> = {
  new: "New",
  assigned: "Assigned",
  in_progress: "In Progress",
  pending_qc: "Pending QC",
  rework_required: "Rework Required",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const STATUS_ORDER: JobStatus[] = [
  "new",
  "assigned",
  "in_progress",
  "pending_qc",
  "rework_required",
  "closed",
  "cancelled",
];

export const STATUS_CLASS: Record<JobStatus, string> = {
  new: "bg-info/12 text-info border-info/30",
  assigned: "bg-primary/15 text-primary-foreground/90 border-primary/40",
  in_progress: "bg-warning/20 text-warning-foreground border-warning/40",
  pending_qc: "bg-accent text-accent-foreground border-border",
  rework_required: "bg-destructive/12 text-destructive border-destructive/30",
  closed: "bg-success/12 text-success border-success/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export const PRIORITY_LABEL: Record<JobPriority, string> = {
  low: "ต่ำ (Low)",
  normal: "ปกติ (Normal)",
  high: "สูง (High)",
  urgent: "เร่งด่วน (Urgent)",
};

export const PRIORITY_CLASS: Record<JobPriority, string> = {
  low: "bg-muted text-muted-foreground border-border",
  normal: "bg-info/12 text-info border-info/30",
  high: "bg-warning/25 text-warning-foreground border-warning/50",
  urgent: "bg-destructive/12 text-destructive border-destructive/40",
};

export const ROLE_LABEL: Record<AppRole, string> = {
  operator: "Production Operator",
  supervisor: "Production Supervisor",
  qc: "QC / QA",
  manager: "Production Manager",
  admin: "Admin",
};

export const ROLE_LIST: AppRole[] = ["operator", "supervisor", "qc", "manager", "admin"];

export function isOverdue(dueDate: string | null, status: JobStatus) {
  if (!dueDate) return false;
  if (status === "closed" || status === "cancelled") return false;
  return new Date(dueDate).getTime() < new Date(new Date().toDateString()).getTime();
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("th-TH", { dateStyle: "medium" });
}

export function leadTimeHours(from?: string | null, to?: string | null) {
  if (!from || !to) return null;
  return (new Date(to).getTime() - new Date(from).getTime()) / 3_600_000;
}
