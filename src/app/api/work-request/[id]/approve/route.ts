import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/auth";

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

    const workRequestId = params.id;
    const supabase = await getSupabaseServerClient();

    // 업무 요청 확인
    const { data: workRequest, error: fetchError } = await supabase
      .from("work_request")
      .select("*")
      .eq("id", workRequestId)
      .eq("client_id", session.id)
      .single();

    if (fetchError || !workRequest) {
      return NextResponse.json(
        { success: false, error: "업무 요청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (workRequest.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "이미 처리된 업무 요청입니다." },
        { status: 400 }
      );
    }

    // 승인 처리
    const { error: updateError } = await supabase
      .from("work_request")
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", workRequestId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "승인 처리에 실패했습니다." },
        { status: 500 }
      );
    }

    // 담당자에게 알림 생성
    if (workRequest.employee_id) {
      await supabase.from("notification").insert({
        employee_id: workRequest.employee_id,
        type: "work_approved",
        message: `${workRequest.brand_name} 업무 요청이 승인되었습니다.`,
        is_read: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: "업무 요청이 승인되었습니다.",
    });
  } catch (error) {
    console.error("승인 처리 오류:", error);
    return NextResponse.json(
      { success: false, error: "승인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

