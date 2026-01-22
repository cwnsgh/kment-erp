import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteWorkRequest } from "@/app/actions/work-request";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session || session.type !== "employee") {
      return NextResponse.json(
        { success: false, error: "직원 로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const workRequestId = params.id;

    // 삭제 처리 (금액 복구 포함) - 직원만 가능
    const result = await deleteWorkRequest(workRequestId, session.id);

    if (!result.success) {
      console.error("삭제 처리 실패:", result.error);
      return NextResponse.json(
        { success: false, error: result.error || "삭제 처리에 실패했습니다." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "업무 요청이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("삭제 처리 오류:", error);
    return NextResponse.json(
      { success: false, error: "삭제 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

