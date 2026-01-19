import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

const EXCEL_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function createExcelResponse(
  workbook: ExcelJS.Workbook,
  filename: string
) {
  const buffer = await workbook.xlsx.writeBuffer();
  const encodedFilename = encodeURIComponent(filename);
  const asciiFilename = filename.replace(/[^\x20-\x7E]+/g, "_") || "export.xlsx";

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": EXCEL_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
      "Cache-Control": "no-store",
    },
  });
}

export default createExcelResponse;

