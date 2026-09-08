import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchJobs, fetchProfiles, nameOf, type ReworkJob } from "@/lib/jobs";
import { exportJobsCsv } from "@/lib/export";
import { useAuth } from "@/hooks/useAuth";
import {
  PRIORITY_CLASS,
  PRIORITY_LABEL,
  STATUS_CLASS,
  STATUS_ORDER,
  STATUS_SHORT,
  formatDate,
  isOverdue,
  type JobStatus,
} from "@/lib/rework";

export const Route = createFileRoute("/_authenticated/jobs/")({
  head: () => ({
    meta: [
      { title: "รายการงาน Rework — Rework System" },
      { name: "description", content: "ค้นหา กรอง และติดตามสถานะใบแจ้งงาน Rework ทั้งหมด" },
      { property: "og:title", content: "รายการงาน Rework" },
      { property: "og:description", content: "ค้นหาและติดตามสถานะงาน Rework ของฝ่ายผลิต" },
    ],
  }),
  component: JobList,
});

function JobList() {
  const { roles, user } = useAuth();
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ["jobs"], queryFn: fetchJobs });
  const { data: profiles = [] } = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [scope, setScope] = useState<string>("all");

  const canExport = roles.some((r) => ["supervisor", "qc", "manager", "admin"].includes(r));
  const canCreate = roles.some((r) => ["operator", "supervisor", "qc", "admin"].includes(r));

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return jobs.filter((j: ReworkJob) => {
      if (status !== "all" && j.status !== status) return false;
      if (scope === "mine" && j.created_by !== user?.id) return false;
      if (scope === "assigned" && j.assigned_to !== user?.id) return false;
      if (scope === "overdue" && !isOverdue(j.due_date, j.status)) return false;
      if (!term) return true;
      return [j.job_no, j.product_code, j.product_name, j.lot_no, j.work_order_no, j.line_name, j.problem_detail]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [jobs, q, status, scope, user?.id]);

  return (
    <AppShell
      title="งาน Rework"
      subtitle={`ทั้งหมด ${filtered.length} รายการ`}
      actions={
        <div className="flex gap-2">
          {canExport && (
            <Button variant="outline" onClick={() => exportJobsCsv(filtered, profiles)}>
              <Download className="size-4" /> Export
            </Button>
          )}
          {canCreate && (
            <Link to="/jobs/new">
              <Button>สร้างงาน Rework</Button>
            </Link>
          )}
        </div>
      }
    >
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_200px_200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหาเลขที่งาน, Product, Lot, W/O, ปัญหา..."
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_SHORT[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger>
                <SelectValue placeholder="มุมมอง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="mine">งานที่ฉันแจ้ง</SelectItem>
                <SelectItem value="assigned">งานที่ได้รับมอบหมาย</SelectItem>
                <SelectItem value="overdue">เกินกำหนด</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่งาน</TableHead>
                  <TableHead>วันที่แจ้ง</TableHead>
                  <TableHead>Line / Product</TableHead>
                  <TableHead>ปัญหา</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead>ผู้รับผิดชอบ</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      กำลังโหลด...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      ไม่พบงานที่ตรงกับเงื่อนไข
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((j) => (
                  <TableRow key={j.id} className="cursor-pointer">
                    <TableCell className="font-mono text-xs font-medium">
                      <Link to="/jobs/$id" params={{ id: j.id }} className="hover:underline">
                        {j.job_no}
                      </Link>
                      {isOverdue(j.due_date, j.status) && (
                        <Badge variant="outline" className="ml-2 border-destructive/40 bg-destructive/10 text-destructive">
                          Overdue
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{formatDate(j.reported_at)}</TableCell>
                    <TableCell className="text-sm">
                      <div>{j.line_name || "-"}</div>
                      <div className="text-xs text-muted-foreground">
                        {j.product_code} {j.product_name ? `· ${j.product_name}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[240px] text-sm">
                      <div className="truncate">{j.defect_type || "-"}</div>
                      <div className="truncate text-xs text-muted-foreground">{j.problem_detail}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-sm">
                      {j.defect_qty} {j.unit}
                    </TableCell>
                    <TableCell className="text-sm">{nameOf(profiles, j.assigned_to)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={PRIORITY_CLASS[j.priority]}>
                        {PRIORITY_LABEL[j.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_CLASS[j.status as JobStatus]}>
                        {STATUS_SHORT[j.status as JobStatus]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
