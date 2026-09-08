import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJobs, fetchProfiles, nameOf } from "@/lib/jobs";
import {
  formatDate,
  formatDateTime,
  PRIORITY_CLASS,
  PRIORITY_LABEL,
  STATUS_CLASS,
  STATUS_SHORT,
} from "@/lib/rework";

export const Route = createFileRoute("/_authenticated/jobs/$id")({
  component: JobDetailPage,
});

function JobDetailPage() {
  const { id } = Route.useParams();
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ["jobs"], queryFn: fetchJobs });
  const { data: profiles = [] } = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });
  const job = jobs.find((item) => item.id === id);

  return (
    <AppShell
      title={job?.job_no ?? "รายละเอียดงาน"}
      subtitle={
        job ? `${job.product_code} · ${job.line_name ?? "ไม่ระบุ Line"}` : "ตรวจสอบงาน Rework"
      }
      actions={
        <Link to="/jobs">
          <Button variant="outline">กลับรายการงาน</Button>
        </Link>
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      ) : !job ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">ไม่พบงานนี้ใน localStorage</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลปัญหา</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Info label="เลขที่งาน" value={job.job_no} />
              <Info label="วันที่แจ้ง" value={formatDateTime(job.reported_at)} />
              <Info label="Line ผลิต" value={job.line_name} />
              <Info label="Product" value={`${job.product_code} ${job.product_name ?? ""}`} />
              <Info label="Lot No." value={job.lot_no} />
              <Info label="Work Order" value={job.work_order_no} />
              <Info label="จำนวน Defect" value={`${job.defect_qty} ${job.unit}`} />
              <Info label="Due Date" value={formatDate(job.due_date)} />
              <div className="md:col-span-2">
                <Info label="ประเภทปัญหา" value={job.defect_type} />
              </div>
              <div className="md:col-span-2">
                <Info label="รายละเอียดปัญหา" value={job.problem_detail} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>สถานะงาน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={STATUS_CLASS[job.status]}>
                  {STATUS_SHORT[job.status]}
                </Badge>
                <Badge variant="outline" className={PRIORITY_CLASS[job.priority]}>
                  {PRIORITY_LABEL[job.priority]}
                </Badge>
              </div>
              <Info label="ผู้แจ้ง" value={nameOf(profiles, job.created_by)} />
              <Info label="ผู้รับผิดชอบ" value={nameOf(profiles, job.assigned_to)} />
              <Info label="วิธี Rework" value={job.rework_method} />
              <Info label="ผลการแก้ไข" value={job.result_note} />
              <Info label="ผล QC" value={job.qc_result} />
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-2xl bg-[#FFF8E7] p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-foreground">{value || "-"}</p>
    </div>
  );
}
