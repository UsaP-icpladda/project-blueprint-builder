import { createFileRoute, Link } from "@tanstack/react-router";
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
import { AlertTriangle, CheckCircle2, Clock, ClipboardList } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJobs, fetchProfiles, nameOf } from "@/lib/jobs";
import {
  STATUS_SHORT,
  STATUS_CLASS,
  formatDateTime,
  isOverdue,
  leadTimeHours,
  type JobStatus,
} from "@/lib/rework";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Rework System" },
      { name: "description", content: "สรุปสถานะงาน Rework ภาพรวม ปัญหาที่พบบ่อย และงานล่าสุด" },
      { property: "og:title", content: "Dashboard — Rework System" },
      { property: "og:description", content: "ภาพรวมงาน Rework ของฝ่ายผลิตแบบเรียลไทม์" },
    ],
  }),
  component: Dashboard,
});

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const DEFECT_COLORS = [
  "#00C2FF",
  "#FFD23F",
  "#FF4D8D",
  "#7C3AED",
  "#00D084",
  "#FF7A00",
  "#FF3B30",
  "#14B8A6",
];

const LINE_COLORS = ["#00C2FF", "#FFD23F", "#FF4D8D", "#7C3AED", "#00D084", "#FF7A00"];

function defectColor(index: number) {
  return DEFECT_COLORS[index % DEFECT_COLORS.length];
}

function lineColor(index: number) {
  return LINE_COLORS[index % LINE_COLORS.length];
}

function Dashboard() {
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ["jobs"], queryFn: fetchJobs });
  const { data: profiles = [] } = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });

  const open = jobs.filter((j) => !["closed", "cancelled"].includes(j.status));
  const closed = jobs.filter((j) => j.status === "closed");
  const overdue = jobs.filter((j) => isOverdue(j.due_date, j.status));
  const pendingQc = jobs.filter((j) => j.status === "pending_qc");

  const totalPass = closed.reduce((s, j) => s + (j.pass_qty ?? 0), 0);
  const totalReworked = closed.reduce((s, j) => s + (j.rework_qty ?? 0), 0);
  const passRate = totalReworked > 0 ? (totalPass / totalReworked) * 100 : 0;

  const leadTimes = closed
    .map((j) => leadTimeHours(j.reported_at, j.closed_at))
    .filter((x): x is number => x !== null);
  const avgLead = leadTimes.length ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length : 0;

  const byStatus = (Object.keys(STATUS_SHORT) as JobStatus[])
    .map((s) => {
      const value = jobs.filter((j) => j.status === s).length;
      return {
        name: STATUS_SHORT[s],
        value,
        percent: jobs.length ? (value / jobs.length) * 100 : 0,
      };
    })
    .filter((x) => x.value > 0);

  const defectCount = new Map<string, number>();
  jobs.forEach((j) => {
    const k = j.defect_type || "ไม่ระบุ";
    defectCount.set(k, (defectCount.get(k) ?? 0) + 1);
  });
  const topDefects = [...defectCount.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const lineCount = new Map<string, number>();
  jobs.forEach((j) => {
    const k = j.line_name || "ไม่ระบุ";
    lineCount.set(k, (lineCount.get(k) ?? 0) + 1);
  });
  const byLine = [...lineCount.entries()].map(([name, count]) => ({ name, count }));

  const recent = jobs.slice(0, 8);

  return (
    <AppShell
      title="Dashboard"
      subtitle="ภาพรวมงาน Rework ของฝ่ายผลิต"
      actions={
        <Link to="/jobs/new">
          <Button>สร้างงาน Rework</Button>
        </Link>
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={ClipboardList}
              label="งานที่ยังไม่ปิด"
              value={open.length}
              hint={`ทั้งหมด ${jobs.length} งาน`}
            />
            <StatCard
              icon={Clock}
              label="รอ QC/QA ตรวจสอบ"
              value={pendingQc.length}
              hint="Pending QC"
            />
            <StatCard
              icon={AlertTriangle}
              label="เกินกำหนด (Overdue)"
              value={overdue.length}
              hint="เลย Due date"
              tone="danger"
            />
            <StatCard
              icon={CheckCircle2}
              label="Pass Rate"
              value={`${passRate.toFixed(1)}%`}
              hint={`Lead time เฉลี่ย ${avgLead.toFixed(1)} ชม.`}
              tone="success"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">สัดส่วนงานตามสถานะ</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {byStatus.length === 0 ? (
                  <Empty />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byStatus}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={2}
                        labelLine={false}
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {byStatus.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} งาน`, `${name}`]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Problem — ประเภทปัญหาที่พบบ่อย</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {topDefects.length === 0 ? (
                  <Empty />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topDefects} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                      <XAxis type="number" allowDecimals={false} fontSize={12} />
                      <YAxis type="category" dataKey="name" width={120} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 14, 14, 0]} className="drop-shadow-md">
                        {topDefects.map((defect, i) => (
                          <Cell key={defect.name} fill={defectColor(i)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rework แยกตาม Line ผลิต</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {byLine.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byLine}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[14, 14, 0, 0]} className="drop-shadow-md">
                      {byLine.map((line, i) => (
                        <Cell key={line.name} fill={lineColor(i)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">งานล่าสุด</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recent.length === 0 && (
                  <p className="p-6 text-sm text-muted-foreground">ยังไม่มีงาน Rework</p>
                )}
                {recent.map((j) => (
                  <Link
                    key={j.id}
                    to="/jobs/$id"
                    params={{ id: j.id }}
                    className="flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/60"
                  >
                    <span className="font-mono text-sm font-medium">{j.job_no}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                      {j.product_code} · {j.problem_detail}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {nameOf(profiles, j.created_by)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(j.reported_at)}
                    </span>
                    <Badge variant="outline" className={STATUS_CLASS[j.status]}>
                      {STATUS_SHORT[j.status]}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function Empty() {
  return (
    <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
      ยังไม่มีข้อมูล
    </p>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "danger" | "success";
}) {
  const toneClass =
    tone === "danger" ? "text-destructive" : tone === "success" ? "text-success" : "text-primary";
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <div className="rounded-md bg-muted p-2.5">
          <Icon className={`size-5 ${toneClass}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="page-title text-3xl">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
