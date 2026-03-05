import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDeletedWorkRequestsForAdmin } from "@/app/actions/work-request";
import { getContractWorkRequestsForBoard } from "@/app/actions/contract-work-request";
import styles from "./page.module.css";

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

  const [wrResult, cwrResult] = await Promise.all([getDeletedWorkRequestsForAdmin(), getContractWorkRequestsForBoard({ statusFilter: "deleted" })]);

  const workRequests = wrResult.success ? (wrResult.data ?? []) : [];
  const contractWorkRequests = cwrResult.success ? (cwrResult.data ?? []) : [];

  return (
    <div className={`${styles.deletedPage}`}>
      <div className="page_title">
        <h1>업무 삭제 내역</h1>
      </div>

      <div className="white_box">
        <div className="box_inner">
          <section style={{ marginBottom: "100px" }}>
            <h2 className={`${styles.table_title}`}>금액차감/유지보수형 업무 (삭제됨)</h2>
            <div className={styles.tableTop}>
              <div className={styles.topTotal}>
                <p>
                  총 <span></span>건의 삭제 내역이 조회되었습니다.
                </p>
              </div>
              <div className={styles.topBtnGroup}>
                <button type="button" className="btn btn_md normal">
                  전체 선택
                </button>
                <button type="button" className="btn btn_md primary">
                  영구 삭제
                </button>
                <select className="viewSelect">
                  <option value={10}>10개씩 보기</option>
                  <option value={30}>50개씩 보기</option>
                  <option value={50}>100개씩 보기</option>
                  <option value={100}>200개씩 보기</option>
                </select>
              </div>
            </div>
            <div className={`${styles.table_wrap} overflow-x-auto`}>
              <table className="w-full text-sm">
                <colgroup>
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "auto" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>삭제 시각</th>
                    <th>거래처</th>
                    <th>담당자</th>
                    <th>브랜드명</th>
                    <th>유형</th>
                    <th>작업내용</th>
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
                    <tr key={r.id}>
                      <td className="whitespace-nowrap">{formatDate(r.updated_at)}</td>
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
            <h2 className={`${styles.table_title}`}>계약 업무 (삭제됨)</h2>
            <div className={styles.tableTop}>
              <div className={styles.topTotal}>
                <p>
                  총 <span></span>건의 삭제 내역이 조회되었습니다.
                </p>
              </div>
              <div className={styles.topBtnGroup}>
                <button type="button" className="btn btn_md normal">
                  전체 선택
                </button>
                <button type="button" className="btn btn_md primary">
                  영구 삭제
                </button>
                <select className="viewSelect">
                  <option value={10}>10개씩 보기</option>
                  <option value={30}>50개씩 보기</option>
                  <option value={50}>100개씩 보기</option>
                  <option value={100}>200개씩 보기</option>
                </select>
              </div>
            </div>
            <div className={`${styles.table_wrap} overflow-x-auto`}>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>등록일</th>
                    <th>거래처</th>
                    <th>계약명</th>
                    <th>담당자</th>
                    <th>브랜드명</th>
                    <th>작업내용</th>
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
      </div>
    </div>
  );
}
