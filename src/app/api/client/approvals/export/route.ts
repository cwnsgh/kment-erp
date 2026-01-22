import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import createExcelResponse from "@/lib/excel-export";

export const dynamic = "force-dynamic";

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return `${String(date.getFullYear()).slice(-2)}.${String(
    date.getMonth() + 1
  ).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

const statusLabelMap: Record<string, string> = {
  pending: "승인요청",
  approved: "승인완료",
  rejected: "승인반려",
  in_progress: "작업중",
  completed: "작업완료",
  deleted: "삭제됨",
};

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.type !== "client") {
      return NextResponse.json(
        { success: false, error: "클라이언트 로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
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
      .neq("status", "deleted") // 삭제된 항목 제외
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rows = (data || []).map((wr: any) => ({
      ...wr,
      employee_name: wr.employee?.name || null,
    }));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("승인 현황");

    sheet.columns = [
      { header: "번호", key: "index", width: 8 },
      { header: "브랜드명", key: "brand_name", width: 20 },
      { header: "담당자", key: "employee_name", width: 14 },
      { header: "요청날짜", key: "created_at", width: 14 },
      { header: "작업내용", key: "work_content", width: 40 },
      { header: "승인여부", key: "status", width: 12 },
    ];

    rows.forEach((row: any, index: number) => {
      sheet.addRow({
        index: rows.length - index,
        brand_name: row.brand_name || "-",
        employee_name: row.employee_name || "-",
        created_at: formatDate(row.created_at),
        work_content: row.work_content || "-",
        status: statusLabelMap[row.status] || row.status || "-",
      });
    });

    return createExcelResponse(workbook, "승인현황-목록.xlsx");
  } catch (error) {
    console.error("클라이언트 승인 현황 엑셀 다운로드 오류:", error);
    return NextResponse.json(
      { success: false, error: "엑셀 다운로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

