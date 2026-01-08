import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getManagedClientDetail } from "@/app/actions/managed-client";
import {
  getWorkRequestsByClientIdForEmployee,
  type WorkRequest,
} from "@/app/actions/work-request";
import WorkRequestList from "@/components/operations/work-request-list";

export default async function ClientTasksPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();

  // 세션 확인
  if (!session || session.type !== "employee") {
    redirect("/login");
  }

  const managedClientId = params.id;

  // 관리 고객 정보 조회
  const managedClientResult = await getManagedClientDetail(managedClientId);

  if (!managedClientResult.success || !managedClientResult.managedClient || !managedClientResult.client) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>관리 고객 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const clientId = managedClientResult.client.id;
  const clientName = managedClientResult.client.name || "거래처";

  // 초기 업무 목록 조회
  const workRequestsResult = await getWorkRequestsByClientIdForEmployee(
    clientId,
    session.id,
    {
      page: 1,
      limit: 20,
    }
  );

  const initialWorkRequests: WorkRequest[] =
    workRequestsResult.success && workRequestsResult.data
      ? workRequestsResult.data
      : [];
  const initialTotalCount = workRequestsResult.totalCount || 0;

  return (
    <WorkRequestList
      clientId={clientId}
      clientName={clientName}
      currentEmployeeId={session.id}
      initialWorkRequests={initialWorkRequests}
      initialTotalCount={initialTotalCount}
    />
  );
}

