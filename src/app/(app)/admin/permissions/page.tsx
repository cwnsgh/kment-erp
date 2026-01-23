import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PermissionManagement } from "@/components/admin/permission-management";

export default async function PermissionManagementPage() {
  const session = await getSession();

  // 관리자만 접근 가능 (role_id: 1)
  if (!session || session.type !== "employee" || session.roleId !== 1) {
    redirect("/dashboard");
  }

  return <PermissionManagement />;
}

