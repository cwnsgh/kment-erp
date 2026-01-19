import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import createExcelResponse from "@/lib/excel-export";

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(date.getDate()).padStart(2, "0")}`;
};

const formatWorkPeriod = (startDate?: string | null, endDate?: string | null) =>
  !startDate && !endDate ? "-" : `${formatDate(startDate)} ~ ${formatDate(endDate)}`;

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
    if (!session || session.type !== "employee") {
      return NextResponse.json(
        { success: false, error: "직원 로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("clientId") || "";
    const statusFilter = searchParams.get("statusFilter") || "all";
    const searchType = searchParams.get("searchType") || "brand";
    const searchKeyword = searchParams.get("searchKeyword") || "";

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "clientId가 필요합니다." },
        { status: 400 }
      );
    }

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
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (searchKeyword && searchType === "brand") {
      query = query.ilike("brand_name", `%${searchKeyword}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    let rows = (data || []).map((wr: any) => ({
      ...wr,
      employee_name: wr.employee?.name || null,
    }));

    if (searchKeyword && searchType === "manager") {
      const keyword = searchKeyword.toLowerCase();
      rows = rows.filter((wr: any) =>
        (wr.employee_name || "").toLowerCase().includes(keyword)
      );
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("관리업무");

    sheet.columns = [
      { header: "번호", key: "index", width: 8 },
      { header: "브랜드명", key: "brand_name", width: 20 },
      { header: "담당자", key: "employee_name", width: 14 },
      { header: "요청일", key: "requested_at", width: 12 },
      { header: "승인일", key: "approved_at", width: 12 },
      { header: "상태변경일", key: "status_updated_at", width: 12 },
      { header: "작업기간", key: "work_period", width: 22 },
      { header: "작업내용", key: "work_content", width: 40 },
      { header: "승인여부", key: "status", width: 12 },
    ];

    rows.forEach((row: any, index: number) => {
      sheet.addRow({
        index: rows.length - index,
        brand_name: row.brand_name || "-",
        employee_name: row.employee_name || "-",
        requested_at: formatDate(row.created_at),
        approved_at: formatDate(row.approved_at),
        status_updated_at: formatDate(row.updated_at),
        work_period: formatWorkPeriod(row.start_date, row.end_date),
        work_content: row.work_content || "-",
        status: statusLabelMap[row.status] || row.status || "-",
      });
    });

    return createExcelResponse(workbook, "관리업무-목록.xlsx");
  } catch (error) {
    console.error("관리업무 엑셀 다운로드 오류:", error);
    return NextResponse.json(
      { success: false, error: "엑셀 다운로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

