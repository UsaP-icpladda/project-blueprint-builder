import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ClipboardCheck, Factory, LineChart, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rework System — ระบบแจ้งและรายงานงาน Rework ฝ่ายผลิต" },
      {
        name: "description",
        content:
          "แจ้งงาน Rework ติดตามสถานะแบบเรียลไทม์ บันทึกผลการแก้ไข ตรวจสอบโดย QC/QA และออกรายงานสำหรับฝ่ายผลิต",
      },
      { property: "og:title", content: "Rework System — ระบบแจ้งและรายงานงาน Rework" },
      {
        property: "og:description",
        content: "ลดกระดาษ ลดข้อมูลตกหล่น ติดตามงาน Rework ได้ครบวงจรในที่เดียว",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-[#e8f8e8] text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-accent-glow)]">
            <Factory className="size-5" />
          </div>
          <span className="page-title text-xl">Rework System</span>
        </div>
        <Link to="/auth">
          <Button variant="default">เข้าสู่ระบบ</Button>
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border-2 border-primary/20 bg-[#FFF8E7] p-8 text-center shadow-[var(--shadow-card)]">
            <div className="hatched h-1.5 w-32 rounded-full opacity-90" />
            <h1 className="page-title mt-5 text-5xl leading-tight sm:text-6xl">
              ระบบแจ้งและรายงาน
              <br />
              งาน Rework ฝ่ายผลิต
            </h1>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/auth">
                <Button size="lg">เริ่มใช้งาน</Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline">
                  ดูข้อมูลตัวอย่าง
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              { label: "งานที่ติดตาม", value: "5+" },
              { label: "สถานะหลัก", value: "7" },
              {
                label: "รายงาน KPI",
                value: "4",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border-2 border-accent/20 bg-white p-5 shadow-[var(--shadow-card)]"
              >
                <p className="text-sm font-extrabold text-muted-foreground">{item.label}</p>
                <p className="page-title mt-1 text-4xl text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: ClipboardCheck,
              title: "แจ้งงานครบถ้วน",
            },
            {
              icon: ShieldCheck,
              title: "ตรวจสอบโดย QC/QA",
            },
            {
              icon: LineChart,
              title: "รายงานและ KPI",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-3xl border-2 border-primary/15 bg-white p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-accent text-white shadow-[var(--shadow-teal-glow)]">
                <f.icon className="size-6" />
              </div>
              <h2 className="mt-3 text-lg font-extrabold text-foreground">{f.title}</h2>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
