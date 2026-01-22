"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSession, requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * 모든 활성 직원 목록 조회
 */
export async function getAllEmployees(): Promise<{
  success: boolean;
  data?: Array<{ id: string; name: string }>;
  error?: string;
}> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    const { data: employees, error } = await supabase
      .from("employee")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: employees || [],
    };
  } catch (error) {
    console.error("직원 목록 조회 오류:", error);
    return {
      success: false,
      error: "직원 목록을 조회하는 중 오류가 발생했습니다.",
      data: [],
    };
  }
}

export interface WorkRequest {
  id: string;
  client_id: string;
  employee_id: string | null;
  brand_name: string;
  manager?: string | null;
  work_content: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status: "pending" | "approved" | "rejected" | "in_progress" | "completed" | "deleted";
  created_at: string;
  updated_at: string;
  employee_name?: string | null;
}

export interface Notification {
  id: string;
  employee_id: string | null;
  client_id: string | null;
  work_request_id?: string | null;
  type: string;
  title?: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

/**
 * 관리업무 등록 (금액차감형/유지보수형)
 */
export async function createWorkRequest(data: {
  managedClientId: string;
  clientId: string;
  workType: "deduct" | "maintenance";
  brandName: string;
  manager: string;
  workPeriod: string; // "YYYY-MM-DD ~ YYYY-MM-DD" 형식
  attachmentUrl?: string;
  attachmentName?: string;
  cost?: string; // 금액차감형만
  workContent: string;
  count?: number; // 유지보수형만
  workTypeDetail?: string; // 유지보수형: 'textEdit', 'codingEdit', 'imageEdit', 'popupDesign', 'bannerDesign'
}): Promise<{
  success: boolean;
  error?: string;
  workRequestId?: string;
}> {
  try {
    const session = await getSession();
    if (!session || session.type !== "employee") {
      return {
        success: false,
        error: "직원 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();
    const employeeId = session.id;

    // 작업기간 파싱
    const [startDateStr, endDateStr] = data.workPeriod.split(" ~ ");
    const startDate = startDateStr
      ? new Date(startDateStr.trim()).toISOString()
      : null;
    const endDate = endDateStr
      ? new Date(endDateStr.trim()).toISOString()
      : null;

    // 업무 요청 생성
    const { data: workRequest, error: workRequestError } = await supabase
      .from("work_request")
      .insert({
        managed_client_id: data.managedClientId,
        client_id: data.clientId,
        employee_id: employeeId,
        work_type: data.workType,
        brand_name: data.brandName,
        manager: data.manager,
        work_period: data.workPeriod,
        attachment_url: data.attachmentUrl || null,
        attachment_name: data.attachmentName || null,
        cost: data.cost ? parseFloat(data.cost.replace(/,/g, "")) : null,
        work_content: data.workContent,
        count: data.count || null,
        work_type_detail: data.workTypeDetail || null,
        status: "pending",
      })
      .select()
      .single();

    if (workRequestError) throw workRequestError;

    // 관리 고객 정보 조회
    const { data: managedClient, error: managedClientError } = await supabase
      .from("managed_client")
      .select(
        "product_type1, status, payment_status, progress_started_date, detail_text_edit_count, detail_coding_edit_count, detail_image_edit_count, detail_popup_design_count, detail_banner_design_count, initial_detail_text_edit_count, initial_detail_coding_edit_count, initial_detail_image_edit_count, initial_detail_popup_design_count, initial_detail_banner_design_count"
      )
      .eq("id", data.managedClientId)
      .single();

    if (managedClientError) throw managedClientError;

    // 진행상황 업데이트: 관리업무가 있으면 "진행"으로 변경 (미납 상태는 유지)
    const updateData: any = {};

    // 진행상황이 "진행"이 아니고, "미납"이 아닌 경우에만 "진행"으로 변경
    if (
      managedClient.status !== "ongoing" &&
      managedClient.status !== "unpaid"
    ) {
      updateData.status = "ongoing";
      // 진행상황이 처음 "진행"으로 변경되는 경우 progress_started_date 설정
      if (!managedClient.progress_started_date) {
        updateData.progress_started_date = new Date()
          .toISOString()
          .split("T")[0]; // 오늘 날짜
      }
    }

    // 유지보수형인 경우 횟수 차감 및 초기화 체크
    if (data.workType === "maintenance" && data.workTypeDetail && data.count) {
      const currentDate = new Date();
      const today = currentDate.getDate();

      // 초기화 체크: progress_started_date의 날짜와 오늘 날짜 비교
      if (
        managedClient.progress_started_date &&
        managedClient.status === "ongoing"
      ) {
        const progressDate = new Date(managedClient.progress_started_date);
        const progressDay = progressDate.getDate();

        // 오늘이 초기화일인지 확인 (매월 progressDay일에 초기화)
        // 마지막 초기화일 확인 (같은 날 여러 번 초기화 방지)
        const lastResetDate = managedClient.progress_started_date;
        const todayStr = currentDate
          .toISOString()
          .split("T")[0]
          .substring(0, 7); // YYYY-MM
        const lastResetMonth = lastResetDate
          ? lastResetDate.substring(0, 7)
          : null;

        if (today === progressDay && lastResetMonth !== todayStr) {
          // 초기값으로 리셋
          updateData.detail_text_edit_count =
            managedClient.initial_detail_text_edit_count || 0;
          updateData.detail_coding_edit_count =
            managedClient.initial_detail_coding_edit_count || 0;
          updateData.detail_image_edit_count =
            managedClient.initial_detail_image_edit_count || 0;
          updateData.detail_popup_design_count =
            managedClient.initial_detail_popup_design_count || 0;
          updateData.detail_banner_design_count =
            managedClient.initial_detail_banner_design_count || 0;
        }
      }

      // 횟수 차감
      switch (data.workTypeDetail) {
        case "textEdit":
          updateData.detail_text_edit_count = Math.max(
            0,
            (updateData.detail_text_edit_count ??
              managedClient.detail_text_edit_count ??
              0) - data.count
          );
          break;
        case "codingEdit":
          updateData.detail_coding_edit_count = Math.max(
            0,
            (updateData.detail_coding_edit_count ??
              managedClient.detail_coding_edit_count ??
              0) - data.count
          );
          break;
        case "imageEdit":
          updateData.detail_image_edit_count = Math.max(
            0,
            (updateData.detail_image_edit_count ??
              managedClient.detail_image_edit_count ??
              0) - data.count
          );
          break;
        case "popupDesign":
          updateData.detail_popup_design_count = Math.max(
            0,
            (updateData.detail_popup_design_count ??
              managedClient.detail_popup_design_count ??
              0) - data.count
          );
          break;
        case "bannerDesign":
          updateData.detail_banner_design_count = Math.max(
            0,
            (updateData.detail_banner_design_count ??
              managedClient.detail_banner_design_count ??
              0) - data.count
          );
          break;
      }
    }

    // 관리 고객 정보 업데이트
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("managed_client")
        .update(updateData)
        .eq("id", data.managedClientId);

      if (updateError) throw updateError;
    }

    // 클라이언트에게 알림 생성
    const { error: notificationError } = await supabase
      .from("notification")
      .insert({
        client_id: data.clientId,
        employee_id: employeeId, // notification 테이블에 employee_id가 필수이므로 추가
        work_request_id: workRequest.id,
        type: "work_requested",
        title: "새로운 업무 승인 요청",
        message: `새로운 업무 승인 요청이 등록되었습니다: ${data.brandName}`,
        is_read: false,
      });

    if (notificationError) {
      console.error("알림 생성 오류:", notificationError);
      // 알림 생성 실패는 치명적이지 않으므로 계속 진행
    }

    revalidatePath("/operations/clients");
    revalidatePath("/operations/new");

    return {
      success: true,
      workRequestId: workRequest.id,
    };
  } catch (error) {
    console.error("업무 등록 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "업무 등록 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 클라이언트의 승인 대기 업무 요청 조회
 */
export async function getPendingWorkRequestsByClientId(clientId: string) {
  try {
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
      .eq("client_id", clientId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // employee 정보를 workRequest에 포함
    const workRequests = (data || []).map((wr: any) => ({
      ...wr,
      employee_name: wr.employee?.name || null,
    })) as (WorkRequest & { employee_name: string | null })[];

    return {
      success: true,
      data: workRequests as WorkRequest[],
    };
  } catch (error) {
    console.error("클라이언트 업무 요청 조회 오류:", error);
    return {
      success: false,
      error: "업무 요청을 조회하는 중 오류가 발생했습니다.",
      data: [],
    };
  }
}

/**
 * 클라이언트의 모든 업무 요청 조회 (승인 페이지용 - 모든 상태 포함)
 */
export async function getAllWorkRequestsByClientId(clientId: string) {
  try {
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
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // employee 정보를 workRequest에 포함
    const workRequests = (data || []).map((wr: any) => ({
      ...wr,
      employee_name: wr.employee?.name || null,
    })) as (WorkRequest & { employee_name: string | null })[];

    return {
      success: true,
      data: workRequests as WorkRequest[],
    };
  } catch (error) {
    console.error("클라이언트 업무 요청 조회 오류:", error);
    return {
      success: false,
      error: "업무 요청을 조회하는 중 오류가 발생했습니다.",
      data: [],
    };
  }
}

/**
 * 클라이언트 서명 파일 URL 조회
 */
export async function getClientSignatureUrl(): Promise<{
  success: boolean;
  url?: string | null;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session || session.type !== "client") {
      return {
        success: false,
        error: "클라이언트 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("client_attachment")
      .select("file_url")
      .eq("client_id", session.id)
      .eq("file_type", "signature")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    return {
      success: true,
      url: data && data.length > 0 ? data[0].file_url : null,
    };
  } catch (error) {
    console.error("클라이언트 서명 조회 오류:", error);
    return {
      success: false,
      error: "서명 정보를 불러오는 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 클라이언트의 읽지 않은 알림 개수 조회
 */
export async function getClientUnreadNotificationCount() {
  try {
    const session = await getSession();
    if (!session || session.type !== "client") {
      return {
        success: false,
        error: "클라이언트 로그인이 필요합니다.",
        count: 0,
      };
    }

    const supabase = await getSupabaseServerClient();

    const { count, error } = await supabase
      .from("notification")
      .select("*", { count: "exact", head: true })
      .eq("client_id", session.id)
      .eq("is_read", false);

    if (error) throw error;

    return {
      success: true,
      count: count || 0,
    };
  } catch (error) {
    console.error("읽지 않은 알림 개수 조회 오류:", error);
    return {
      success: false,
      error: "알림 개수를 조회하는 중 오류가 발생했습니다.",
      count: 0,
    };
  }
}

/**
 * 직원의 읽지 않은 알림 개수 조회
 */
export async function getEmployeeUnreadNotificationCount() {
  try {
    const session = await getSession();
    if (!session || session.type !== "employee") {
      return {
        success: false,
        error: "직원 로그인이 필요합니다.",
        count: 0,
      };
    }

    const supabase = await getSupabaseServerClient();

    const { count, error } = await supabase
      .from("notification")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", session.id)
      .eq("is_read", false);

    if (error) throw error;

    return {
      success: true,
      count: count || 0,
    };
  } catch (error) {
    console.error("직원 읽지 않은 알림 개수 조회 오류:", error);
    return {
      success: false,
      error: "알림 개수를 조회하는 중 오류가 발생했습니다.",
      count: 0,
    };
  }
}

/**
 * 클라이언트 알림 읽음 처리
 */
export async function markClientNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session || session.type !== "client") {
      return {
        success: false,
        error: "클라이언트 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    // 알림이 해당 클라이언트의 것인지 확인
    const { data: notification, error: fetchError } = await supabase
      .from("notification")
      .select("id, client_id")
      .eq("id", notificationId)
      .eq("client_id", session.id)
      .single();

    if (fetchError || !notification) {
      return {
        success: false,
        error: "알림을 찾을 수 없습니다.",
      };
    }

    // 읽음 처리
    const { error: updateError } = await supabase
      .from("notification")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("client_id", session.id);

    if (updateError) throw updateError;

    return {
      success: true,
    };
  } catch (error) {
    console.error("알림 읽음 처리 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알림 읽음 처리 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 클라이언트의 모든 알림 읽음 처리
 */
export async function markAllClientNotificationsAsRead(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session || session.type !== "client") {
      return {
        success: false,
        error: "클라이언트 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    // 해당 클라이언트의 모든 읽지 않은 알림을 읽음 처리
    const { error: updateError } = await supabase
      .from("notification")
      .update({ is_read: true })
      .eq("client_id", session.id)
      .eq("is_read", false);

    if (updateError) throw updateError;

    return {
      success: true,
    };
  } catch (error) {
    console.error("모든 알림 읽음 처리 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알림 읽음 처리 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 직원 알림 읽음 처리
 */
export async function markEmployeeNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session || session.type !== "employee") {
      return {
        success: false,
        error: "직원 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    const { data: notification, error: fetchError } = await supabase
      .from("notification")
      .select("id, employee_id")
      .eq("id", notificationId)
      .eq("employee_id", session.id)
      .single();

    if (fetchError || !notification) {
      return {
        success: false,
        error: "알림을 찾을 수 없습니다.",
      };
    }

    const { error: updateError } = await supabase
      .from("notification")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("employee_id", session.id);

    if (updateError) throw updateError;

    return {
      success: true,
    };
  } catch (error) {
    console.error("직원 알림 읽음 처리 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알림 읽음 처리 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 직원의 모든 알림 읽음 처리
 */
export async function markAllEmployeeNotificationsAsRead(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session || session.type !== "employee") {
      return {
        success: false,
        error: "직원 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    const { error: updateError } = await supabase
      .from("notification")
      .update({ is_read: true })
      .eq("employee_id", session.id)
      .eq("is_read", false);

    if (updateError) throw updateError;

    return {
      success: true,
    };
  } catch (error) {
    console.error("직원 모든 알림 읽음 처리 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알림 읽음 처리 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 클라이언트 알림 목록 조회
 */
export async function getClientNotifications(): Promise<{
  success: boolean;
  data?: Notification[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session || session.type !== "client") {
      return {
        success: false,
        error: "클라이언트 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    const { data: notifications, error } = await supabase
      .from("notification")
      .select(
        "id, employee_id, client_id, work_request_id, type, title, message, is_read, created_at"
      )
      .eq("client_id", session.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: (notifications || []) as Notification[],
    };
  } catch (error) {
    console.error("알림 조회 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알림을 조회하는 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 직원 알림 목록 조회
 */
export async function getEmployeeNotifications(): Promise<{
  success: boolean;
  data?: Notification[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session || session.type !== "employee") {
      return {
        success: false,
        error: "직원 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    const { data: notifications, error } = await supabase
      .from("notification")
      .select(
        "id, employee_id, client_id, work_request_id, type, title, message, is_read, created_at"
      )
      .eq("employee_id", session.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: (notifications || []) as Notification[],
    };
  } catch (error) {
    console.error("직원 알림 조회 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알림을 조회하는 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 클라이언트 알림 삭제
 */
export async function deleteClientNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session || session.type !== "client") {
      return {
        success: false,
        error: "클라이언트 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    const { error: deleteError } = await supabase
      .from("notification")
      .delete()
      .eq("id", notificationId)
      .eq("client_id", session.id);

    if (deleteError) throw deleteError;

    return {
      success: true,
    };
  } catch (error) {
    console.error("알림 삭제 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알림 삭제 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 직원 알림 삭제
 */
export async function deleteEmployeeNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session || session.type !== "employee") {
      return {
        success: false,
        error: "직원 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    const { error: deleteError } = await supabase
      .from("notification")
      .delete()
      .eq("id", notificationId)
      .eq("employee_id", session.id);

    if (deleteError) throw deleteError;

    return {
      success: true,
    };
  } catch (error) {
    console.error("알림 삭제 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알림 삭제 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 클라이언트의 업무 요청 조회 (필터링, 페이지네이션 지원)
 */
export async function getClientWorkRequests(
  clientId: string,
  options?: {
    statusFilter?:
      | "all"
      | "pending"
      | "approved"
      | "rejected"
      | "in_progress"
      | "completed";
    page?: number;
    limit?: number;
  }
): Promise<{
  success: boolean;
  data?: WorkRequest[];
  totalCount?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session || session.type !== "client") {
      return {
        success: false,
        error: "클라이언트 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();
    const actualClientId = clientId || session.id;

    let query = supabase
      .from("work_request")
      .select(
        `
        *,
        employee:employee_id (
          id,
          name
        )
      `,
        { count: "exact" }
      )
      .eq("client_id", actualClientId);

    if (options?.statusFilter && options.statusFilter !== "all") {
      query = query.eq("status", options.statusFilter);
    }

    query = query.order("created_at", { ascending: false });

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data: workRequests, error, count } = await query;

    if (error) throw error;

    // employee 정보를 workRequest에 포함
    const workRequestsWithEmployee = (workRequests || []).map((wr: any) => ({
      ...wr,
      employee_name: wr.employee?.name || null,
    })) as (WorkRequest & { employee_name: string | null })[];

    return {
      success: true,
      data: workRequestsWithEmployee as WorkRequest[],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error("클라이언트 업무 목록 조회 오류:", error);
    return {
      success: false,
      error: "업무 목록을 조회하는 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 관리자가 특정 거래처의 모든 업무 조회 (필터링, 페이지네이션 지원)
 */
export async function getWorkRequestsByClientIdForEmployee(
  clientId: string,
  currentEmployeeId: string,
  options?: {
    statusFilter?:
      | "all"
      | "pending"
      | "approved"
      | "rejected"
      | "in_progress"
      | "completed";
    searchType?: "brand" | "manager";
    searchKeyword?: string;
    employeeFilter?: string | null; // 담당자 필터 추가
    page?: number;
    limit?: number;
  }
): Promise<{
  success: boolean;
  data?: WorkRequest[];
  totalCount?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session || session.type !== "employee") {
      return {
        success: false,
        error: "직원 로그인이 필요합니다.",
      };
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
        ),
        client:client_id (
          id,
          name
        )
      `,
        { count: "exact" }
      )
      .eq("client_id", clientId);

    // 담당자 필터 적용 (employeeFilter가 제공되면 해당 담당자만, 없으면 모든 담당자)
    if (options?.employeeFilter && options.employeeFilter !== "all") {
      query = query.eq("employee_id", options.employeeFilter);
    }

    // 검색 필터 적용
    if (options?.searchKeyword) {
      if (options.searchType === "brand") {
        query = query.ilike("brand_name", `%${options.searchKeyword}%`);
      }
      // 담당자 검색은 클라이언트 측에서 필터링 (employee_name으로)
    }

    // 상태 필터
    if (options?.statusFilter && options.statusFilter !== "all") {
      query = query.eq("status", options.statusFilter);
    }

    query = query.order("created_at", { ascending: false });

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data: workRequests, error, count } = await query;

    if (error) throw error;

    // employee 정보를 workRequest에 포함
    const workRequestsWithEmployee = (workRequests || []).map((wr: any) => ({
      ...wr,
      employee_name: wr.employee?.name || null,
      client_name: wr.client?.name || null,
    })) as (WorkRequest & {
      employee_name: string | null;
      client_name: string | null;
    })[];

    return {
      success: true,
      data: workRequestsWithEmployee as WorkRequest[],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error("관리자 업무 목록 조회 오류:", error);
    return {
      success: false,
      error: "업무 목록을 조회하는 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 업무 상태 변경 (승인완료 → 작업중, 작업중 → 작업완료)
 * 담당자만 변경 가능
 */
export async function updateWorkRequestStatus(
  workRequestId: string,
  newStatus: "in_progress" | "completed",
  currentEmployeeId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session || session.type !== "employee") {
      return {
        success: false,
        error: "직원 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    // 업무 요청 조회하여 담당자 확인
    const { data: workRequest, error: fetchError } = await supabase
      .from("work_request")
      .select("employee_id, client_id, status, brand_name")
      .eq("id", workRequestId)
      .single();

    if (fetchError || !workRequest) {
      return {
        success: false,
        error: "업무 요청을 찾을 수 없습니다.",
      };
    }

    // 담당자가 아니면 오류
    if (workRequest.employee_id !== currentEmployeeId) {
      return {
        success: false,
        error: "담당자만 상태를 변경할 수 있습니다.",
      };
    }

    // 상태 변경 규칙 확인
    if (newStatus === "in_progress" && workRequest.status !== "approved") {
      return {
        success: false,
        error: "승인완료된 업무만 작업중으로 변경할 수 있습니다.",
      };
    }

    if (newStatus === "completed" && workRequest.status !== "in_progress") {
      return {
        success: false,
        error: "작업중인 업무만 작업완료로 변경할 수 있습니다.",
      };
    }

    // 상태 업데이트
    const { error: updateError } = await supabase
      .from("work_request")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workRequestId);

    if (updateError) throw updateError;

    // 클라이언트에게 알림 생성
    const brandName = workRequest.brand_name || "업무";
    const { error: notificationError } = await supabase
      .from("notification")
      .insert({
        client_id: workRequest.client_id,
        employee_id: workRequest.employee_id, // notification 테이블에 employee_id가 필수이므로 추가
        work_request_id: workRequestId,
        type: newStatus === "in_progress" ? "work_started" : "work_completed",
        title: newStatus === "in_progress" ? "업무 시작" : "업무 완료",
        message:
          newStatus === "in_progress"
            ? `업무 시작: ${brandName}`
            : `업무 완료: ${brandName}`,
        is_read: false,
      });

    if (notificationError) {
      console.error("알림 생성 오류:", notificationError);
      // 알림 생성 실패는 치명적이지 않으므로 계속 진행
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("업무 상태 변경 오류:", error);
    return {
      success: false,
      error: "업무 상태 변경 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 업무 상세 정보 조회 (관리자용)
 */
export async function getWorkRequestDetailForEmployee(
  workRequestId: string
): Promise<{
  success: boolean;
  data?: WorkRequest & {
    employee_name?: string | null;
    client_name?: string | null;
    client_id?: string;
    approved_by_client_name?: string | null;
    approved_by_signature_url?: string | null;
    approval_deducted_amount?: number | null;
    approval_remaining_amount?: number | null;
    approval_text_edit_count?: number | null;
    approval_coding_edit_count?: number | null;
    approval_image_edit_count?: number | null;
    approval_popup_design_count?: number | null;
    approval_banner_design_count?: number | null;
    managed_client?: {
      productType1: string;
      productType2: string;
      totalAmount: number | null;
      startDate: string | null;
      endDate: string | null;
      status: string;
      detailTextEditCount: number;
      detailCodingEditCount: number;
      detailImageEditCount: number;
      detailPopupDesignCount: number;
      detailBannerDesignCount: number;
    } | null;
  };
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session || session.type !== "employee") {
      return {
        success: false,
        error: "직원 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    // 업무 요청 및 관련 정보 조회
    const { data: workRequest, error: workRequestError } = await supabase
      .from("work_request")
      .select(
        `
        *,
        employee:employee_id (
          id,
          name
        ),
        client:client_id (
          id,
          name
        )
      `
      )
      .eq("id", workRequestId)
      .single();

    if (workRequestError || !workRequest) {
      return {
        success: false,
        error: "업무 요청을 찾을 수 없습니다.",
      };
    }

    // 관리 고객 정보 조회
    const { data: managedClient, error: managedClientError } = await supabase
      .from("managed_client")
      .select(
        "product_type1, product_type2, total_amount, start_date, end_date, status, detail_text_edit_count, detail_coding_edit_count, detail_image_edit_count, detail_popup_design_count, detail_banner_design_count"
      )
      .eq("client_id", workRequest.client_id)
      .single();

    // 승인한 클라이언트의 서명 이미지 조회
    let approvedByClientName: string | null = null;
    let approvedBySignatureUrl: string | null = null;

    if (workRequest.approved_by) {
      // 승인한 클라이언트 정보 조회
      const { data: approvedByClient, error: approvedByClientError } =
        await supabase
          .from("client")
          .select("id, name")
          .eq("id", workRequest.approved_by)
          .single();

      if (!approvedByClientError && approvedByClient) {
        approvedByClientName = approvedByClient.name || null;

        // 승인한 클라이언트의 서명 이미지 조회
        const { data: signatureAttachments, error: signatureError } =
          await supabase
            .from("client_attachment")
            .select("file_url")
            .eq("client_id", workRequest.approved_by)
            .eq("file_type", "signature")
            .order("created_at", { ascending: false })
            .limit(1);

        if (
          !signatureError &&
          signatureAttachments &&
          signatureAttachments.length > 0
        ) {
          approvedBySignatureUrl = signatureAttachments[0].file_url;
        }
      }
    }

    // 관리 고객 정보가 없어도 업무 정보는 반환
    const formattedWorkRequest = {
      ...workRequest,
      employee_name: (workRequest as any).employee?.name || null,
      client_name: (workRequest as any).client?.name || null,
      approved_by_client_name: approvedByClientName,
      approved_by_signature_url: approvedBySignatureUrl,
      approval_deducted_amount: workRequest.approval_deducted_amount
        ? Number(workRequest.approval_deducted_amount)
        : null,
      approval_remaining_amount: workRequest.approval_remaining_amount
        ? Number(workRequest.approval_remaining_amount)
        : null,
      approval_text_edit_count: workRequest.approval_text_edit_count || null,
      approval_coding_edit_count:
        workRequest.approval_coding_edit_count || null,
      approval_image_edit_count: workRequest.approval_image_edit_count || null,
      approval_popup_design_count:
        workRequest.approval_popup_design_count || null,
      approval_banner_design_count:
        workRequest.approval_banner_design_count || null,
      managed_client: managedClient
        ? {
            productType1: managedClient.product_type1,
            productType2: managedClient.product_type2 || "",
            totalAmount: managedClient.total_amount
              ? Number(managedClient.total_amount)
              : null,
            startDate: managedClient.start_date,
            endDate: managedClient.end_date,
            status: managedClient.status,
            detailTextEditCount: managedClient.detail_text_edit_count || 0,
            detailCodingEditCount: managedClient.detail_coding_edit_count || 0,
            detailImageEditCount: managedClient.detail_image_edit_count || 0,
            detailPopupDesignCount:
              managedClient.detail_popup_design_count || 0,
            detailBannerDesignCount:
              managedClient.detail_banner_design_count || 0,
          }
        : null,
    };

    return {
      success: true,
      data: formattedWorkRequest as any,
    };
  } catch (error) {
    console.error("업무 상세 정보 조회 오류:", error);
    return {
      success: false,
      error: "업무 상세 정보를 조회하는 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 담당자 기준 관리업무 현황 조회
 */
export async function getWorkRequestsForEmployee(employeeId?: string | null): Promise<{
  success: boolean;
  data?: (WorkRequest & { client_name?: string | null; employee_name?: string | null })[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session || session.type !== "employee") {
      return {
        success: false,
        error: "직원 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    // employeeId가 제공되면 해당 담당자만, 없으면 모든 담당자 조회
    let query = supabase
      .from("work_request")
      .select(
        `
        *,
        client:client_id (
          id,
          name
        ),
        employee:employee_id (
          id,
          name
        )
      `
      );

    // employeeId가 제공되면 해당 담당자만 필터링, 없으면 모든 담당자
    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    const { data: workRequests, error } = await query
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const workRequestsWithClient = (workRequests || []).map((wr: any) => ({
      ...wr,
      client_name: wr.client?.name || null,
      employee_name: wr.employee?.name || null,
    })) as (WorkRequest & { client_name?: string | null; employee_name?: string | null })[];

    return {
      success: true,
      data: workRequestsWithClient,
    };
  } catch (error) {
    console.error("담당자 업무 현황 조회 오류:", error);
    return {
      success: false,
      error: "업무 현황을 조회하는 중 오류가 발생했습니다.",
      data: [],
    };
  }
}

/**
 * 클라이언트용 업무 상세 조회
 */
export async function getWorkRequestDetailForClient(
  workRequestId: string
): Promise<{
  success: boolean;
  data?: WorkRequest & {
    employee_name?: string | null;
    client_name?: string | null;
    client_id?: string;
    approved_by_client_name?: string | null;
    approved_by_signature_url?: string | null;
    approval_deducted_amount?: number | null;
    approval_remaining_amount?: number | null;
    approval_text_edit_count?: number | null;
    approval_coding_edit_count?: number | null;
    approval_image_edit_count?: number | null;
    approval_popup_design_count?: number | null;
    approval_banner_design_count?: number | null;
    managed_client?: {
      productType1: string;
      productType2: string;
      totalAmount: number | null;
      startDate: string | null;
      endDate: string | null;
      status: string;
      detailTextEditCount: number;
      detailCodingEditCount: number;
      detailImageEditCount: number;
      detailPopupDesignCount: number;
      detailBannerDesignCount: number;
    } | null;
  };
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session || session.type !== "client") {
      return {
        success: false,
        error: "클라이언트 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    // 업무 요청 및 관련 정보 조회 (승인 시점 스냅샷 정보 포함)
    const { data: workRequest, error: workRequestError } = await supabase
      .from("work_request")
      .select(
        `
        *,
        employee:employee_id (
          id,
          name
        ),
        client:client_id (
          id,
          name
        )
      `
      )
      .eq("id", workRequestId)
      .eq("client_id", session.id) // 자신의 업무만 조회 가능
      .single();

    if (workRequestError || !workRequest) {
      return {
        success: false,
        error: "업무 요청을 찾을 수 없습니다.",
      };
    }

    // 관리 고객 정보 조회
    const { data: managedClient, error: managedClientError } = await supabase
      .from("managed_client")
      .select(
        "product_type1, product_type2, total_amount, start_date, end_date, status, detail_text_edit_count, detail_coding_edit_count, detail_image_edit_count, detail_popup_design_count, detail_banner_design_count"
      )
      .eq("client_id", workRequest.client_id)
      .single();

    // 승인한 클라이언트의 서명 이미지 조회
    let approvedByClientName: string | null = null;
    let approvedBySignatureUrl: string | null = null;

    if (workRequest.approved_by) {
      // 승인한 클라이언트 정보 조회
      const { data: approvedByClient, error: approvedByClientError } =
        await supabase
          .from("client")
          .select("id, name")
          .eq("id", workRequest.approved_by)
          .single();

      if (!approvedByClientError && approvedByClient) {
        approvedByClientName = approvedByClient.name || null;

        // 승인한 클라이언트의 서명 이미지 조회
        const { data: signatureAttachments, error: signatureError } =
          await supabase
            .from("client_attachment")
            .select("file_url")
            .eq("client_id", workRequest.approved_by)
            .eq("file_type", "signature")
            .order("created_at", { ascending: false })
            .limit(1);

        if (
          !signatureError &&
          signatureAttachments &&
          signatureAttachments.length > 0
        ) {
          approvedBySignatureUrl = signatureAttachments[0].file_url;
        }
      }
    }

    // 관리 고객 정보가 없어도 업무 정보는 반환
    const formattedWorkRequest = {
      ...workRequest,
      employee_name: (workRequest as any).employee?.name || null,
      client_name: (workRequest as any).client?.name || null,
      approved_by_client_name: approvedByClientName,
      approved_by_signature_url: approvedBySignatureUrl,
      approval_deducted_amount: workRequest.approval_deducted_amount
        ? Number(workRequest.approval_deducted_amount)
        : null,
      approval_remaining_amount: workRequest.approval_remaining_amount
        ? Number(workRequest.approval_remaining_amount)
        : null,
      approval_text_edit_count: workRequest.approval_text_edit_count || null,
      approval_coding_edit_count:
        workRequest.approval_coding_edit_count || null,
      approval_image_edit_count: workRequest.approval_image_edit_count || null,
      approval_popup_design_count:
        workRequest.approval_popup_design_count || null,
      approval_banner_design_count:
        workRequest.approval_banner_design_count || null,
      managed_client: managedClient
        ? {
            productType1: managedClient.product_type1,
            productType2: managedClient.product_type2 || "",
            totalAmount: managedClient.total_amount
              ? Number(managedClient.total_amount)
              : null,
            startDate: managedClient.start_date,
            endDate: managedClient.end_date,
            status: managedClient.status,
            detailTextEditCount: managedClient.detail_text_edit_count || 0,
            detailCodingEditCount: managedClient.detail_coding_edit_count || 0,
            detailImageEditCount: managedClient.detail_image_edit_count || 0,
            detailPopupDesignCount:
              managedClient.detail_popup_design_count || 0,
            detailBannerDesignCount:
              managedClient.detail_banner_design_count || 0,
          }
        : null,
    };

    return {
      success: true,
      data: formattedWorkRequest as any,
    };
  } catch (error) {
    console.error("클라이언트 업무 상세 정보 조회 오류:", error);
    return {
      success: false,
      error: "업무 상세 정보를 조회하는 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 업무 승인
 */
export async function approveWorkRequest(
  workRequestId: string,
  clientId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session || session.type !== "client") {
      return {
        success: false,
        error: "클라이언트 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase.rpc("approve_work_request", {
      p_work_request_id: workRequestId,
      p_client_id: clientId,
    });

    if (error) {
      console.error("승인 DB 함수 호출 오류:", error);
      return {
        success: false,
        error:
          error.message?.includes("approve_work_request") ||
          error.message?.includes("function")
            ? "DB 함수가 없습니다. db/approve-work-request-transaction.sql을 실행해 주세요."
            : error.message || "승인 처리 중 오류가 발생했습니다.",
      };
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result || !result.success) {
      return {
        success: false,
        error: result?.error || "승인 처리에 실패했습니다.",
      };
    }

    // 담당자에게 알림 생성
    if (result.employee_id) {
      const { data: workRequest, error: workRequestError } = await supabase
        .from("work_request")
        .select("brand_name")
        .eq("id", workRequestId)
        .single();
      const brandName = workRequest?.brand_name || "업무";
      if (workRequestError) {
        console.error("업무 정보 조회 오류:", workRequestError);
      }
      const { error: notificationError } = await supabase
        .from("notification")
        .insert({
          employee_id: result.employee_id,
          work_request_id: workRequestId,
          type: "work_approved",
          title: "업무 승인",
          message: `업무 승인 완료: ${brandName}`,
          is_read: false,
        });

      if (notificationError) {
        console.error("알림 생성 오류:", notificationError);
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("업무 승인 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "업무 승인 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 업무 거절
 */
export async function rejectWorkRequest(
  workRequestId: string,
  clientId: string,
  rejectionReason: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session || session.type !== "client") {
      return {
        success: false,
        error: "클라이언트 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    // 업무 요청 조회
    const { data: workRequest, error: fetchError } = await supabase
      .from("work_request")
      .select("employee_id, status, brand_name")
      .eq("id", workRequestId)
      .eq("client_id", clientId)
      .single();

    if (fetchError || !workRequest) {
      return {
        success: false,
        error: "업무 요청을 찾을 수 없습니다.",
      };
    }

    if (workRequest.status !== "pending") {
      return {
        success: false,
        error: "승인 대기 중인 업무만 거절할 수 있습니다.",
      };
    }

    // 상태 업데이트
    const { error: updateError } = await supabase
      .from("work_request")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason,
        approved_at: new Date().toISOString(),
        approved_by: clientId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workRequestId);

    if (updateError) throw updateError;

    // 담당자에게 알림 생성
    if (workRequest.employee_id) {
      const brandName = workRequest.brand_name || "업무";
      const { error: notificationError } = await supabase
        .from("notification")
        .insert({
          employee_id: workRequest.employee_id,
          work_request_id: workRequestId,
          type: "work_rejected",
          title: "업무 거절",
          message: `업무 승인 거절: ${brandName} (사유: ${rejectionReason})`,
          is_read: false,
        });

      if (notificationError) {
        console.error("알림 생성 오류:", notificationError);
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("업무 거절 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "업무 거절 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 업무 삭제 (금액 복구 포함) - 직원만 가능
 */
export async function deleteWorkRequest(
  workRequestId: string,
  employeeId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session || session.type !== "employee") {
      return {
        success: false,
        error: "직원 로그인이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase.rpc("delete_work_request", {
      p_work_request_id: workRequestId,
      p_employee_id: employeeId,
    });

    if (error) {
      console.error("삭제 DB 함수 호출 오류:", error);
      return {
        success: false,
        error:
          error.message?.includes("delete_work_request") ||
          error.message?.includes("function")
            ? "DB 함수가 없습니다. db/delete-work-request-transaction.sql을 실행해 주세요."
            : error.message || "삭제 처리 중 오류가 발생했습니다.",
      };
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result || !result.success) {
      return {
        success: false,
        error: result?.error || "삭제 처리에 실패했습니다.",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("업무 삭제 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "업무 삭제 중 오류가 발생했습니다.",
    };
  }
}
