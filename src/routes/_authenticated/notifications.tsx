import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/rework";

type NotificationRow = {
  id: string;
  job_id: string | null;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, job_id, title, message, read_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as NotificationRow[];
    },
  });

  return (
    <AppShell title="การแจ้งเตือน" subtitle="รายการแจ้งเตือนจากระบบ Rework">
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">กำลังโหลด...</p>}
          {!isLoading && notifications.length === 0 && (
            <p className="text-sm text-muted-foreground">ยังไม่มีการแจ้งเตือน</p>
          )}
          {notifications.map((item) => (
            <div key={item.id} className="rounded-3xl bg-[#FFF8E7] p-4 shadow-[var(--shadow-card)]">
              <div className="flex gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bell className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDateTime(item.created_at)}
                  </p>
                </div>
                {item.job_id && (
                  <Link to="/jobs/$id" params={{ id: item.job_id }}>
                    <Button variant="outline" size="sm">
                      เปิดงาน
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
