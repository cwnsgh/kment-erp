import { NextRequest, NextResponse } from "next/server";
import { getClientWorkRequests } from "@/app/actions/work-request";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get("statusFilter") as "all" | "pending" | "approved" | "rejected" | "in_progress" | "completed" || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await getClientWorkRequests("", {
      statusFilter,
      page,
      limit,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        totalCount: result.totalCount,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("클라이언트 업무 요청 조회 오류:", error);
    return NextResponse.json(
      { success: false, error: "업무 요청 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

