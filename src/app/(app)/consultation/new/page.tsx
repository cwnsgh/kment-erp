import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getConsultationCategories } from "@/app/actions/consultation";
import { ConsultationRegistrationForm } from "@/components/consultation/consultation-registration-form";

export default async function ConsultationNewPage() {
  const session = await getSession();
  if (!session || session.type !== "employee") {
    redirect("/login");
  }
  if (session.roleId !== 1) {
    redirect("/dashboard");
  }

  const { success, data: categories } = await getConsultationCategories();
  const list = success && categories ? categories : [];

  return (
    <div style={{ padding: "24px 0" }}>
      <h1 className="page_title">상담 등록</h1>
      <ConsultationRegistrationForm categories={list} />
    </div>
  );
}
