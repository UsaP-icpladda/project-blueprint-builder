import { nameOf, type ProfileLite, type ReworkJob } from "@/lib/jobs";
import { formatDate } from "@/lib/rework";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function exportJobsCsv(jobs: ReworkJob[], profiles: ProfileLite[]) {
  const headers = [
    "เลขที่งาน",
    "วันที่แจ้ง",
    "Line",
    "Product Code",
    "Product Name",
    "Lot No",
    "Work Order",
    "ประเภทปัญหา",
    "รายละเอียดปัญหา",
    "จำนวน",
    "หน่วย",
    "ผู้แจ้ง",
    "ผู้รับผิดชอบ",
    "Priority",
    "สถานะ",
    "Due Date",
  ];
  const rows = jobs.map((job) => [
    job.job_no,
    formatDate(job.reported_at),
    job.line_name,
    job.product_code,
    job.product_name,
    job.lot_no,
    job.work_order_no,
    job.defect_type,
    job.problem_detail,
    job.defect_qty,
    job.unit,
    nameOf(profiles, job.created_by),
    nameOf(profiles, job.assigned_to),
    job.priority,
    job.status,
    formatDate(job.due_date),
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rework-jobs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
