import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session || session.type !== "employee") {
    redirect("/login");
  }

  return <DashboardOverview employeeName={session.name} />;
}
