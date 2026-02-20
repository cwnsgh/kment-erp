import { getSession, type EmployeeSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ContractTaskRegistrationForm } from "@/components/contracts/contract-task-registration-form";

export default async function ContractTaskNewPage() {
  const session = await getSession();
  if (!session || session.type !== "employee") {
    redirect("/login");
  }

  const employeeName = (session as EmployeeSession).name ?? "";

  return <ContractTaskRegistrationForm employeeName={employeeName} />;
}
