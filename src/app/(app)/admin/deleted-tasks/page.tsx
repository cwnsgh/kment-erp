import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDeletedWorkRequestsForAdmin } from "@/app/actions/work-request";
import { getContractWorkRequestsForBoard } from "@/app/actions/contract-work-request";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "medium" });
  } catch {
    return iso;
  }
}

export default async function AdminDeletedTasksPage() {
  const session = await getSession();
  if (!session || session.type !== "employee" || !session.roleId || ![1, 2, 3].includes(session.roleId)) {
    redirect("/dashboard");
  }

  const [wrResult, cwrResult] = await Promise.all([
    getDeletedWorkRequestsForAdmin(),
    getContractWorkRequestsForBoard({ statusFilter: "deleted" }),
  ]);

  const workRequests = wrResult.success ? (wrResult.data ?? []) : [];
  const contractWorkRequests = cwrResult.success ? (cwrResult.data ?? []) : [];

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">업무 삭제 내역</h1>

      <section className="mb-10">
        <h2 className="text-lg font-medium mb-3">금액차감/유지보수형 업무 (삭제됨)</h2>
        <div className="overflow-x-auto rounded border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-2 px-3">삭제 시각</th>
                <th className="text-left py-2 px-3">거래처</th>
                <th className="text-left py-2 px-3">담당자</th>
                <th className="text-left py-2 px-3">브랜드명</th>
                <th className="text-left py-2 px-3">유형</th>
                <th className="text-left py-2 px-3">작업내용</th>
              </tr>
            </thead>
            <tbody>
              {workRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 px-3 text-center text-slate-500">
                    삭제된 내역이 없습니다.
                  </td>
                </tr>
              )}
              {workRequests.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3 whitespace-nowrap">{formatDate(r.updated_at)}</td>
                  <td className="py-2 px-3">{r.client_name ?? "-"}</td>
                  <td className="py-2 px-3">{r.employee_name ?? "-"}</td>
                  <td className="py-2 px-3">{r.brand_name}</td>
                  <td className="py-2 px-3">{r.work_type === "deduct" ? "금액차감" : r.work_type === "maintenance" ? "유지보수" : r.work_type}</td>
                  <td className="py-2 px-3 max-w-[200px] truncate">{r.work_content ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">계약 업무 (삭제됨)</h2>
        <div className="overflow-x-auto rounded border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-2 px-3">등록일</th>
                <th className="text-left py-2 px-3">거래처</th>
                <th className="text-left py-2 px-3">계약명</th>
                <th className="text-left py-2 px-3">담당자</th>
                <th className="text-left py-2 px-3">브랜드명</th>
                <th className="text-left py-2 px-3">작업내용</th>
              </tr>
            </thead>
            <tbody>
              {contractWorkRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 px-3 text-center text-slate-500">
                    삭제된 내역이 없습니다.
                  </td>
                </tr>
              )}
              {contractWorkRequests.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3 whitespace-nowrap">{formatDate(r.created_at)}</td>
                  <td className="py-2 px-3">{r.client_name}</td>
                  <td className="py-2 px-3">{r.contract_name}</td>
                  <td className="py-2 px-3">{r.employee_name ?? "-"}</td>
                  <td className="py-2 px-3">{r.brand_name}</td>
                  <td className="py-2 px-3 max-w-[200px] truncate">{r.work_content ?? r.work_content_name ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
