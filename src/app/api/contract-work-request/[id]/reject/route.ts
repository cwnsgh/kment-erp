import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { rejectContractWorkRequest } from "@/app/actions/contract-work-request";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.type !== "client") {
      return NextResponse.json(
        { success: false, error: "클라이언트 로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const id = params.id;
    const body = await request.json().catch(() => ({}));
    const rejectionReason = (body.rejectionReason as string) ?? "";

    const result = await rejectContractWorkRequest(id, session.id, rejectionReason);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? "거절 처리에 실패했습니다." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "계약 업무 요청이 거절되었습니다.",
    });
  } catch (error) {
    console.error("계약 업무 거절 오류:", error);
    return NextResponse.json(
      { success: false, error: "거절 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
