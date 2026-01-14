import { getSession, ClientSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import {
  getPendingWorkRequestsByClientId,
  getClientUnreadNotificationCount,
  WorkRequest,
} from "@/app/actions/work-request";
import { ClientDashboardDeduct } from "@/components/client/client-dashboard-deduct";
import { ClientDashboardMaintenance } from "@/components/client/client-dashboard-maintenance";
import { ClientDashboardNone } from "@/components/client/client-dashboard-none";

export default async function ClientDashboardPage() {
  const session = await getSession();

  if (!session || session.type !== "client") {
    redirect("/login");
  }

  const clientSession = session as ClientSession;
  const supabase = await getSupabaseServerClient();

  // 클라이언트의 관리 상품 조회
  const { data: managedClients, error } = await supabase
    .from("managed_client")
    .select("*")
    .eq("client_id", clientSession.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("관리 상품 조회 오류:", error);
  }

  // 클라이언트 정보 조회
  const { data: client } = await supabase
    .from("client")
    .select("name")
    .eq("id", clientSession.id)
    .single();

  // 가장 최근 관리 상품 (또는 첫 번째)
  const managedClient =
    managedClients && managedClients.length > 0 ? managedClients[0] : null;

  // 승인 현황용: pending(승인요청), rejected(승인반려)만 최신순 5개
  const { data: approvalRequests } = await supabase
    .from("work_request")
    .select("*")
    .eq("client_id", clientSession.id)
    .in("status", ["pending", "rejected"])
    .order("created_at", { ascending: false })
    .limit(5);

  // 작업 현황용: approved(작업대기), in_progress(작업중), completed(작업완료) 모두 조회
  const { data: workRequests } = await supabase
    .from("work_request")
    .select("*")
    .eq("client_id", clientSession.id)
    .in("status", ["approved", "in_progress", "completed"])
    .order("created_at", { ascending: false })
    .limit(10);

  // 승인 통계용: 모든 승인 관련 기록 조회 (통계 계산용)
  const { data: allApprovalStatsData } = await supabase
    .from("work_request")
    .select("status, approved_at")
    .eq("client_id", clientSession.id)
    .or("status.in.(pending,approved,rejected),approved_at.not.is.null");

  // 읽지 않은 알림 개수 조회
  const unreadCountResult = await getClientUnreadNotificationCount();
  const unreadNotificationCount =
    unreadCountResult.success && unreadCountResult.count
      ? unreadCountResult.count
      : 0;

  const clientName = client?.name || clientSession.name;
  const approvalRequestsList = (approvalRequests || []) as WorkRequest[];
  const workRequestsList = (workRequests || []) as WorkRequest[];

  // 승인 통계 계산 (모든 승인 관련 기록에서)
  const approvalStats = {
    pending: (allApprovalStatsData || []).filter(
      (r: any) => r.status === "pending"
    ).length,
    approved: (allApprovalStatsData || []).filter(
      (r: any) => r.approved_at !== null && r.status !== "rejected"
    ).length,
    rejected: (allApprovalStatsData || []).filter(
      (r: any) => r.status === "rejected"
    ).length,
  };

  // 관리상품 타입에 따라 적절한 컴포넌트 렌더링
  if (!managedClient) {
    return (
      <ClientDashboardNone
        clientName={clientName}
        unreadNotificationCount={unreadNotificationCount}
      />
    );
  }

  if (managedClient.product_type1 === "deduct") {
    return (
      <ClientDashboardDeduct
        clientName={clientName}
        managedClient={managedClient}
        approvalRequests={approvalRequestsList}
        approvalStats={approvalStats}
        workRequests={workRequestsList}
        unreadNotificationCount={unreadNotificationCount}
      />
    );
  }

  // 유지보수형
  return (
    <ClientDashboardMaintenance
      clientName={clientName}
      managedClient={managedClient}
      approvalRequests={approvalRequestsList}
      approvalStats={approvalStats}
      workRequests={workRequestsList}
      unreadNotificationCount={unreadNotificationCount}
    />
  );
}
