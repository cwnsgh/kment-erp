import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmployeeNotifications } from "@/components/staff/employee-notifications";

export default async function EmployeeNotificationsPage() {
  const session = await getSession();

  if (!session || session.type !== "employee") {
    redirect("/login");
  }

  return <EmployeeNotifications />;
}
