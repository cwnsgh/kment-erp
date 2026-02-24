import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientContractWorkRequests } from "@/app/actions/contract-work-request";
import createExcelResponse from "@/lib/excel-export";

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return `${String(date.getFullYear()).slice(-2)}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

const formatWorkPeriod = (createdAt: string | null, workPeriod: string | null) => {
  const start = formatDate(createdAt);
  return workPeriod ? `${start} ~ ${formatDate(workPeriod)}` : `${start} ~ `;
};

const statusLabelMap: Record<string, string> = {
  pending: "승인요청",
  approved: "승인완료",
  rejected: "승인반려",
  in_progress: "작업중",
  completed: "작업완료",
  deleted: "삭제됨",
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.type !== "client") {
      return NextResponse.json(
        { success: false, error: "클라이언트 로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const statusFilter = (searchParams.get("statusFilter") as "all" | "pending" | "approved" | "rejected" | "in_progress" | "completed") || "all";

    const result = await getClientContractWorkRequests(session.id, {
      statusFilter,
      page: 1,
      limit: 50000,
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error ?? "데이터 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    const rows = result.data;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("계약 업무 현황");

    sheet.columns = [
      { header: "번호", key: "index", width: 8 },
      { header: "계약명", key: "contract_name", width: 24 },
      { header: "브랜드명", key: "brand_name", width: 16 },
      { header: "담당자", key: "employee_name", width: 14 },
      { header: "작업기간", key: "work_period", width: 22 },
      { header: "작업유형", key: "work_content_name", width: 16 },
      { header: "작업내용", key: "work_content", width: 40 },
      { header: "작업여부", key: "status", width: 12 },
    ];

    rows.forEach((row, index) => {
      sheet.addRow({
        index: rows.length - index,
        contract_name: row.contract_name || "-",
        brand_name: row.brand_name || "-",
        employee_name: row.employee_name || row.manager || "-",
        work_period: formatWorkPeriod(row.created_at, row.work_period),
        work_content_name: row.work_content_name || "-",
        work_content: row.work_content || "-",
        status: statusLabelMap[row.status] || row.status || "-",
      });
    });

    return createExcelResponse(workbook, "계약업무-작업현황-목록.xlsx");
  } catch (error) {
    console.error("클라이언트 계약 업무 엑셀 다운로드 오류:", error);
    return NextResponse.json(
      { success: false, error: "엑셀 다운로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
