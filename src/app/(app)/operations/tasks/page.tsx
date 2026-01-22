import { OperationsTaskBoard } from "@/components/operations/operations-task-board";
import { PageHeader } from "@/components/layout/page-header";
import { getWorkRequestsForEmployee } from "@/app/actions/work-request";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OperationsTaskPage() {
  const session = await getSession();
  if (!session || session.type !== "employee") {
    redirect("/login");
  }

  // 모든 담당자의 업무 조회 (기본값은 자신의 업무이지만 필터로 변경 가능)
  const result = await getWorkRequestsForEmployee(null);
  const workRequests = result.success && result.data ? result.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="관리업무 현황"
        description="요청된 관리 업무의 진행도를 확인하고 히스토리를 관리합니다."
      />
      <OperationsTaskBoard workRequests={workRequests} currentEmployeeId={session.id} />
    </div>
  );
}
