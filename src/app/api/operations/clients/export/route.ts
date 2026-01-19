import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getManagedClients } from "@/app/actions/managed-client";
import createExcelResponse from "@/lib/excel-export";

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(date.getDate()).padStart(2, "0")}`;
};

const formatProductType = (type1: string, type2: string) => {
  if (type1 === "deduct") {
    return `금액차감형(${(type2 || "").toUpperCase() || "-"})`;
  }
  if (type1 === "maintenance") {
    const type2Label = type2 === "standard" ? "S" : "P";
    return `유지보수형(${type2Label})`;
  }
  return "-";
};

const statusLabelMap: Record<string, string> = {
  ongoing: "진행",
  wait: "대기",
  end: "종료",
  unpaid: "미납",
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
    const searchKeyword = searchParams.get("searchKeyword") || undefined;
    const productType1 = (searchParams.get("productType1") ||
      undefined) as "deduct" | "maintenance" | undefined;
    const status = (searchParams.get("status") ||
      undefined) as "ongoing" | "wait" | "end" | "unpaid" | undefined;
    const startDateFrom = searchParams.get("startDateFrom") || undefined;
    const startDateTo = searchParams.get("startDateTo") || undefined;

    const result = await getManagedClients({
      page: 1,
      limit: 100000,
      searchKeyword,
      productType1,
      status,
      startDateFrom,
      startDateTo,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "목록 조회 실패" },
        { status: 500 }
      );
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("관리 고객");

    sheet.columns = [
      { header: "회사명", key: "companyName", width: 24 },
      { header: "브랜드명", key: "brandNames", width: 24 },
      { header: "관리유형", key: "productType", width: 16 },
      { header: "시작일(종료일)", key: "period", width: 22 },
      { header: "진행상황", key: "status", width: 12 },
    ];

    (result.managedClients || []).forEach((mc) => {
      sheet.addRow({
        companyName: mc.companyName || "-",
        brandNames: mc.brandNames?.length ? mc.brandNames.join(", ") : "-",
        productType: formatProductType(mc.productType1, mc.productType2),
        period: `${formatDate(mc.startDate)}(${formatDate(mc.endDate)})`,
        status: statusLabelMap[mc.status] || mc.status || "-",
      });
    });

    return createExcelResponse(workbook, "관리고객-목록.xlsx");
  } catch (error) {
    console.error("관리 고객 엑셀 다운로드 오류:", error);
    return NextResponse.json(
      { success: false, error: "엑셀 다운로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

