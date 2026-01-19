import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import createExcelResponse from "@/lib/excel-export";

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return `${String(date.getFullYear()).slice(-2)}.${String(
    date.getMonth() + 1
  ).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

const formatWorkPeriod = (
  createdAt?: string | null,
  updatedAt?: string | null,
  status?: string
) => {
  const start = formatDate(createdAt);
  if (status === "completed" && updatedAt) {
    return `${start} ~ ${formatDate(updatedAt)}`;
  }
  return `${start} ~ `;
};

const statusLabelMap: Record<string, string> = {
  pending: "승인요청",
  approved: "승인완료",
  rejected: "승인반려",
  in_progress: "작업중",
  completed: "작업완료",
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
    const statusFilter = searchParams.get("statusFilter") || "all";

    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from("work_request")
      .select(
        `
        *,
        employee:employee_id (
          id,
          name
        )
      `
      )
      .eq("client_id", session.id)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    } else {
      query = query.in("status", ["approved", "in_progress", "completed"]);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []).map((wr: any) => ({
      ...wr,
      employee_name: wr.employee?.name || null,
    }));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("작업 현황");

    sheet.columns = [
      { header: "번호", key: "index", width: 8 },
      { header: "브랜드명", key: "brand_name", width: 20 },
      { header: "담당자", key: "employee_name", width: 14 },
      { header: "작업기간", key: "work_period", width: 22 },
      { header: "작업내용", key: "work_content", width: 40 },
      { header: "작업여부", key: "status", width: 12 },
    ];

    rows.forEach((row: any, index: number) => {
      sheet.addRow({
        index: rows.length - index,
        brand_name: row.brand_name || "-",
        employee_name: row.employee_name || "-",
        work_period: formatWorkPeriod(row.created_at, row.updated_at, row.status),
        work_content: row.work_content || "-",
        status: statusLabelMap[row.status] || row.status || "-",
      });
    });

    return createExcelResponse(workbook, "작업현황-목록.xlsx");
  } catch (error) {
    console.error("클라이언트 작업 현황 엑셀 다운로드 오류:", error);
    return NextResponse.json(
      { success: false, error: "엑셀 다운로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

