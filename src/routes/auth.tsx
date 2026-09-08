import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Factory } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ — Rework System" },
      {
        name: "description",
        content: "เข้าสู่ระบบเพื่อแจ้งงาน Rework ติดตามสถานะ และดูรายงานฝ่ายผลิต",
      },
      { property: "og:title", content: "เข้าสู่ระบบ — Rework System" },
      { property: "og:description", content: "เข้าสู่ระบบแจ้งงาน Rework ของฝ่ายผลิต" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error("เข้าสู่ระบบไม่สำเร็จ", { description: error.message });
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, department },
      },
    });
    setBusy(false);
    if (error) {
      toast.error("สมัครใช้งานไม่สำเร็จ", { description: error.message });
      return;
    }
    if (!data.session) {
      toast.success("สมัครสำเร็จ", {
        description: "กรุณาตรวจอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ",
      });
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen bg-[#e8f8e8] lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-[#d8f3dc] p-10 text-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded bg-primary text-primary-foreground shadow-[var(--shadow-accent-glow)]">
            <Factory className="size-5" />
          </div>
          <span className="page-title text-xl">Rework System</span>
        </div>
        <div>
          <div className="hatched h-1.5 w-24 rounded-full opacity-80" />
          <h2 className="page-title mt-5 text-4xl">ระบบแจ้งและรายงานงาน Rework</h2>
          <p className="mt-3 max-w-md text-foreground/70">
            แจ้งงาน ติดตามสถานะ บันทึกผลการแก้ไข และตรวจสอบโดย QC/QA ครบในระบบเดียว
          </p>
        </div>
        <p className="text-xs text-foreground/50">Production Quality Control Platform</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-3xl border-2 border-primary/20 bg-[#FFF8E7] p-6 shadow-[var(--shadow-card)]">
          <h1 className="page-title text-3xl">เข้าใช้งานระบบ</h1>
          <p className="mt-1 text-sm text-muted-foreground">ใช้อีเมลบริษัทของคุณในการเข้าสู่ระบบ</p>

          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">เข้าสู่ระบบ</TabsTrigger>
              <TabsTrigger value="signup">สมัครใช้งาน</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                  <Input
                    id="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dept">แผนก</Label>
                  <Input
                    id="dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="เช่น ฝ่ายผลิต"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">อีเมล</Label>
                  <Input
                    id="email2"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">รหัสผ่าน</Label>
                  <Input
                    id="password2"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "กำลังสมัคร..." : "สมัครใช้งาน"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  ผู้ใช้ใหม่จะได้สิทธิ์ Operator โดยอัตโนมัติ (ผู้ใช้คนแรกของระบบเป็น Admin) — Admin
                  สามารถปรับสิทธิ์ได้ที่หน้าตั้งค่าระบบ
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
