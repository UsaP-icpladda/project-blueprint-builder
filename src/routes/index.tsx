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
    <div className="min-h-screen bg-sidebar text-sidebar-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded bg-sidebar-primary text-sidebar-primary-foreground">
            <Factory className="size-5" />
          </div>
          <span className="page-title text-xl">Rework System</span>
        </div>
        <Link to="/auth">
          <Button variant="default">เข้าสู่ระบบ</Button>
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        <div className="hatched h-1.5 w-32 rounded-full opacity-80" />
        <h1 className="page-title mt-6 text-5xl leading-tight sm:text-6xl">
          ระบบแจ้งและรายงาน
          <br />
          งาน Rework ฝ่ายผลิต
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-sidebar-foreground/75">
          แจ้งงานจากหน้างานได้ในไม่กี่ขั้นตอน มอบหมายผู้รับผิดชอบ ติดตามสถานะแบบเรียลไทม์
          บันทึกผลการแก้ไข ตรวจสอบและอนุมัติปิดงานโดย QC/QA พร้อมรายงานสรุปสำหรับผู้บริหาร
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/auth">
            <Button size="lg">เริ่มใช้งาน</Button>
          </Link>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: ClipboardCheck,
              title: "แจ้งงานครบถ้วน",
              text: "Line, Product, Lot/Batch, จำนวน, ประเภทปัญหา, ความเร่งด่วน และไฟล์แนบ",
            },
            {
              icon: ShieldCheck,
              title: "ตรวจสอบโดย QC/QA",
              text: "Approve เพื่อปิดงาน หรือ Reject พร้อมเหตุผล ส่งกลับให้แก้ไขอัตโนมัติ",
            },
            {
              icon: LineChart,
              title: "รายงานและ KPI",
              text: "Lead time, Pass rate, Overdue, Top defect, Rework by line และ Export ข้อมูล",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-5">
              <f.icon className="size-6 text-sidebar-primary" />
              <h2 className="mt-3 font-semibold text-sidebar-accent-foreground">{f.title}</h2>
              <p className="mt-1.5 text-sm text-sidebar-foreground/70">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
