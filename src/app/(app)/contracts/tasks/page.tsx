import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getContractWorkRequestsForBoard } from "@/app/actions/contract-work-request";
import { ContractTaskStatusBoard } from "@/components/contracts/contract-task-status-board";

export default async function ContractTasksPage() {
  const session = await getSession();
  if (!session || session.type !== "employee") {
    redirect("/login");
  }

  const result = await getContractWorkRequestsForBoard({});
  const initialData = result.success && result.data ? result.data : [];

  return (
    <div className="page_section">
      <ContractTaskStatusBoard initialData={initialData} currentEmployeeId={session.id} />
    </div>
  );
}
