import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchJobs, fetchProfiles, nameOf } from "@/lib/jobs";
import {
  formatDate,
  isOverdue,
  leadTimeHours,
  PRIORITY_CLASS,
  PRIORITY_LABEL,
  STATUS_CLASS,
  STATUS_SHORT,
  type JobStatus,
} from "@/lib/rework";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "รายงาน — Rework System" },
      { name: "description", content: "รายงานสรุปงาน Rework และ KPI ฝ่ายผลิต" },
    ],
  }),
  component: ReportsPage,
});

const REPORT_COLORS = ["#00C2FF", "#FFD23F", "#FF4D8D", "#7C3AED", "#00D084", "#FF7A00"];

function reportColor(index: number) {
  return REPORT_COLORS[index % REPORT_COLORS.length];
}

function ReportsPage() {
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ["jobs"], queryFn: fetchJobs });
  const { data: profiles = [] } = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });

  const open = jobs.filter((job) => !["closed", "cancelled"].includes(job.status));
  const closed = jobs.filter((job) => job.status === "closed");
  const overdue = jobs.filter((job) => isOverdue(job.due_date, job.status));
  const totalReworked = closed.reduce((sum, job) => sum + (job.rework_qty ?? 0), 0);
  const totalPass = closed.reduce((sum, job) => sum + (job.pass_qty ?? 0), 0);
  const passRate = totalReworked ? (totalPass / totalReworked) * 100 : 0;
  const leadTimes = closed
    .map((job) => leadTimeHours(job.reported_at, job.closed_at))
    .filter((value): value is number => value !== null);
  const avgLead = leadTimes.length
    ? leadTimes.reduce((sum, value) => sum + value, 0) / leadTimes.length
    : 0;

  const byStatus = (Object.keys(STATUS_SHORT) as JobStatus[])
    .map((status) => ({
      name: STATUS_SHORT[status],
      value: jobs.filter((job) => job.status === status).length,
    }))
    .filter((item) => item.value > 0);

  const byLine = [
    ...jobs.reduce((map, job) => {
      const line = job.line_name || "ไม่ระบุ";
      map.set(line, (map.get(line) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ].map(([name, count]) => ({ name, count }));

  const byDefect = [
    ...jobs.reduce((map, job) => {
      const defect = job.defect_type || "ไม่ระบุ";
      map.set(defect, (map.get(defect) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count);

  return (
    <AppShell title="รายงาน" subtitle="KPI งาน Rework จากข้อมูลใน localStorage">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลดรายงาน...</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="งานทั้งหมด" value={jobs.length} hint={`เปิดอยู่ ${open.length} งาน`} />
            <KpiCard label="ปิดงานแล้ว" value={closed.length} hint="Closed" />
            <KpiCard label="เกินกำหนด" value={overdue.length} hint="Overdue" tone="danger" />
            <KpiCard
              label="Pass Rate"
              value={`${passRate.toFixed(1)}%`}
              hint={`Lead time ${avgLead.toFixed(1)} ชม.`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">สัดส่วนสถานะงาน</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {byStatus.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={95} label>
                        {byStatus.map((item, index) => (
                          <Cell key={item.name} fill={reportColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} งาน`, `${name}`]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">งานแยกตาม Line ผลิต</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {byLine.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byLine}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis allowDecimals={false} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[14, 14, 0, 0]} className="drop-shadow-md">
                        {byLine.map((line, index) => (
                          <Cell key={line.name} fill={reportColor(index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty />
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ประเภทปัญหาที่พบ</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {byDefect.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDefect} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                    <XAxis type="number" allowDecimals={false} fontSize={12} />
                    <YAxis type="category" dataKey="name" width={140} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 14, 14, 0]} className="drop-shadow-md">
                      {byDefect.map((defect, index) => (
                        <Cell key={defect.name} fill={reportColor(index)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">รายการงานสำหรับรายงาน</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขที่งาน</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>Line / Product</TableHead>
                    <TableHead>ผู้แจ้ง</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs font-bold">{job.job_no}</TableCell>
                      <TableCell>{formatDate(job.reported_at)}</TableCell>
                      <TableCell>
                        <div>{job.line_name || "-"}</div>
                        <div className="text-xs text-muted-foreground">{job.product_code}</div>
                      </TableCell>
                      <TableCell>{nameOf(profiles, job.created_by)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={PRIORITY_CLASS[job.priority]}>
                          {PRIORITY_LABEL[job.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_CLASS[job.status]}>
                          {STATUS_SHORT[job.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: "default" | "danger";
}) {
  return (
    <Card className={tone === "danger" ? "border-l-destructive" : "border-l-primary"}>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="page-title mt-1 text-4xl">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function Empty() {
  return (
    <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
      ยังไม่มีข้อมูล
    </p>
  );
}
