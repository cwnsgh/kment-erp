import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WorkContentManagement } from "@/components/admin/work-content-management";

export default async function WorkContentManagementPage() {
  const session = await getSession();

  // 관리자만 접근 가능 (role_id: 1, 2, 3)
  if (!session || session.type !== "employee" || !session.roleId || ![1, 2, 3].includes(session.roleId)) {
    redirect("/dashboard");
  }

  return <WorkContentManagement />;
}
