import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ConsultationPage() {
  const session = await getSession();
  if (!session || session.type !== "employee") {
    redirect("/login");
  }
  if (session.roleId !== 1) {
    redirect("/dashboard");
  }

  return (
    <div style={{ padding: "24px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 className="page_title">상담 내역</h1>
        <Link href="/consultation/new" className="btn btn_md primary">
          상담 등록
        </Link>
      </div>
      <p className="text-slate-600">상담 목록 조회 기능은 준비 중입니다. 상담 등록은 상단 버튼을 이용해 주세요.</p>
    </div>
  );
}
