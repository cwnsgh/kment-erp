import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import createExcelResponse from "@/lib/excel-export";
import { formatBusinessNumber } from "@/lib/business-number";

const mapStatus = (status: string | null | undefined) => {
  if (!status) return "확인불가";
  const statusMap: Record<string, string> = {
    approved: "정상",
    suspended: "휴업",
    closed: "폐업",
    unavailable: "확인불가",
    unknown: "확인불가",
  };
  return statusMap[status] || "확인불가";
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
    const searchType = searchParams.get("searchType") || "company";
    const searchQuery = searchParams.get("searchQuery") || "";

    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from("client")
      .select(
        "business_registration_number, name, ceo_name, postal_code, address, address_detail, business_type, business_item, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (searchQuery.trim()) {
      const keyword = searchQuery.trim();
      if (searchType === "company") {
        query = query.ilike("name", `%${keyword}%`);
      } else if (searchType === "ceo") {
        query = query.ilike("ceo_name", `%${keyword}%`);
      } else if (searchType === "business_number") {
        query = query.ilike("business_registration_number", `%${keyword}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("거래처");

    sheet.columns = [
      { header: "사업자등록번호", key: "businessNumber", width: 20 },
      { header: "회사명", key: "name", width: 24 },
      { header: "대표자명", key: "ceoName", width: 16 },
      { header: "우편번호", key: "postalCode", width: 10 },
      { header: "주소", key: "address", width: 32 },
      { header: "상세주소", key: "addressDetail", width: 24 },
      { header: "업태", key: "businessType", width: 16 },
      { header: "종목", key: "businessItem", width: 20 },
      { header: "휴·폐업 상태", key: "status", width: 12 },
    ];

    (data || []).forEach((client) => {
      sheet.addRow({
        businessNumber: client.business_registration_number
          ? formatBusinessNumber(client.business_registration_number)
          : "-",
        name: client.name || "-",
        ceoName: client.ceo_name || "-",
        postalCode: client.postal_code || "-",
        address: client.address || "-",
        addressDetail: client.address_detail || "-",
        businessType: client.business_type || "-",
        businessItem: client.business_item || "-",
        status: mapStatus(client.status),
      });
    });

    return createExcelResponse(workbook, "거래처-목록.xlsx");
  } catch (error) {
    console.error("거래처 엑셀 다운로드 오류:", error);
    return NextResponse.json(
      { success: false, error: "엑셀 다운로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

