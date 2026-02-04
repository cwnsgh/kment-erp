"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireAuth } from "@/lib/auth";
import { formatBusinessNumber } from "@/lib/business-number";
import { revalidatePath } from "next/cache";

/**
 * 유지보수형 횟수 초기화 체크 및 실행
 * 진행상황이 "진행"이고 오늘이 초기화일인 경우 초기값으로 리셋
 */
export async function checkAndResetMaintenanceCounts(managedClientId: string): Promise<{
  success: boolean;
  wasReset: boolean;
  error?: string;
}> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    // 관리 고객 정보 조회
    const { data: managedClient, error: fetchError } = await supabase
      .from("managed_client")
      .select("product_type1, status, progress_started_date, detail_text_edit_count, detail_coding_edit_count, detail_image_edit_count, detail_popup_design_count, detail_banner_design_count, initial_detail_text_edit_count, initial_detail_coding_edit_count, initial_detail_image_edit_count, initial_detail_popup_design_count, initial_detail_banner_design_count")
      .eq("id", managedClientId)
      .single();

    if (fetchError || !managedClient) {
      return {
        success: false,
        wasReset: false,
        error: "관리 고객을 찾을 수 없습니다.",
      };
    }

    // 유지보수형이 아니거나 진행상황이 "진행"이 아니면 초기화 안 함
    if (managedClient.product_type1 !== "maintenance" || managedClient.status !== "ongoing") {
      return {
        success: true,
        wasReset: false,
      };
    }

    // progress_started_date가 없으면 초기화 안 함
    if (!managedClient.progress_started_date) {
      return {
        success: true,
        wasReset: false,
      };
    }

    const currentDate = new Date();
    const today = currentDate.getDate();
    const progressDate = new Date(managedClient.progress_started_date);
    const progressDay = progressDate.getDate();

    // 오늘이 초기화일인지 확인 (매월 progressDay일에 초기화)
    if (today === progressDay) {
      // 마지막 초기화일 확인 (같은 날 여러 번 초기화 방지)
      const lastResetDate = managedClient.progress_started_date;
      const todayStr = currentDate.toISOString().split("T")[0].substring(0, 7); // YYYY-MM
      const lastResetMonth = lastResetDate ? lastResetDate.substring(0, 7) : null;

      // 이번 달에 아직 초기화하지 않았으면 초기화
      if (lastResetMonth !== todayStr) {
        const { error: updateError } = await supabase
          .from("managed_client")
          .update({
            detail_text_edit_count: managedClient.initial_detail_text_edit_count || 0,
            detail_coding_edit_count: managedClient.initial_detail_coding_edit_count || 0,
            detail_image_edit_count: managedClient.initial_detail_image_edit_count || 0,
            detail_popup_design_count: managedClient.initial_detail_popup_design_count || 0,
            detail_banner_design_count: managedClient.initial_detail_banner_design_count || 0,
          })
          .eq("id", managedClientId);

        if (updateError) throw updateError;

        return {
          success: true,
          wasReset: true,
        };
      }
    }

    return {
      success: true,
      wasReset: false,
    };
  } catch (error) {
    console.error("횟수 초기화 체크 오류:", error);
    return {
      success: false,
      wasReset: false,
      error:
        error instanceof Error
          ? error.message
          : "횟수 초기화 체크 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 거래처 목록 조회 (모달용 - 검색 가능)
 */
export async function getClientsForModal(
  searchType?: "name" | "ceo",
  searchKeyword?: string
) {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from("client")
      .select("id, business_registration_number, name, ceo_name, status")
      .in("status", ["approved", "suspended", "closed"]) // 승인된 거래처만
      .order("created_at", { ascending: false });

    // 검색 조건 적용
    if (searchKeyword && searchKeyword.trim()) {
      if (searchType === "ceo") {
        query = query.ilike("ceo_name", `%${searchKeyword.trim()}%`);
      } else {
        // 기본: 회사명 검색
        query = query.ilike("name", `%${searchKeyword.trim()}%`);
      }
    }

    const { data: clients, error } = await query;

    if (error) throw error;

    // 이미 관리상품이 있는 거래처 체크
    if (clients && clients.length > 0) {
      const clientIds = clients.map((c) => c.id);
      
      const { data: managedClients, error: managedError } = await supabase
        .from("managed_client")
        .select("client_id")
        .in("client_id", clientIds);

      if (managedError) throw managedError;

      const managedClientIds = new Set(
        (managedClients || []).map((mc) => mc.client_id)
      );

      const clientsWithFlag = clients.map((client) => ({
        ...client,
        business_registration_number: formatBusinessNumber(
          client.business_registration_number
        ),
        hasManagedProduct: managedClientIds.has(client.id),
      }));

      return {
        success: true,
        clients: clientsWithFlag,
      };
    }

    return {
      success: true,
      clients: [],
    };
  } catch (error) {
    console.error("거래처 조회 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "거래처 조회에 실패했습니다.",
      clients: [],
    };
  }
}

/**
 * 거래처 상세 정보 조회 (관리고객 등록용)
 */
export async function getClientForManagedRegistration(clientId: string) {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();
    // 거래처 메인 정보
    const { data: client, error: clientError } = await supabase
      .from("client")
      .select(
        "id, business_registration_number, name, ceo_name, postal_code, address, address_detail, business_type, business_item, login_id, status, note"
      )
      .eq("id", clientId)
      .single();

    if (clientError) throw clientError;
    if (!client) throw new Error("거래처를 찾을 수 없습니다.");

    const [contactsResult, sitesResult, attachmentsResult] = await Promise.all([
      supabase
        .from("client_contact")
        .select("name, phone, email, title, note")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true }),
      supabase
        .from("client_site")
        .select("brand_name, domain, solution, login_id, login_password, type")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true }),
      supabase
        .from("client_attachment")
        .select("file_url, file_name, file_type")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true }),
    ]);

    if (contactsResult.error) throw contactsResult.error;
    if (sitesResult.error) throw sitesResult.error;
    if (attachmentsResult.error) throw attachmentsResult.error;

    const contacts = contactsResult.data;
    const sites = sitesResult.data;
    const attachments = attachmentsResult.data;

    // status 매핑
    const statusMap: Record<string, "정상" | "휴업" | "폐업"> = {
      approved: "정상",
      suspended: "휴업",
      closed: "폐업",
    };

    return {
      success: true,
      client: {
        id: client.id,
        businessRegistrationNumber: formatBusinessNumber(
          client.business_registration_number
        ),
        name: client.name,
        ceoName: client.ceo_name || "",
        postalCode: client.postal_code || "",
        address: client.address || "",
        addressDetail: client.address_detail || "",
        businessType: client.business_type || "",
        businessItem: client.business_item || "",
        loginId: client.login_id || "",
        loginPassword: "", // 보안상 빈 문자열
        status: statusMap[client.status as string] || "정상",
        note: client.note || "",
        contacts:
          contacts?.map((c) => ({
            name: c.name,
            phone: c.phone || "",
            email: c.email || "",
            title: c.title || "",
            note: c.note || "",
          })) || [],
        sites:
          sites?.map((s) => ({
            brandName: s.brand_name || "",
            domain: s.domain || "",
            solution: s.solution || "",
            loginId: s.login_id || "",
            loginPassword: s.login_password || "",
            type: s.type || "",
          })) || [],
        attachments:
          attachments?.map((a) => ({
            fileUrl: a.file_url,
            fileName: a.file_name || "",
            fileType: a.file_type,
          })) || [],
      },
    };
  } catch (error) {
    console.error("거래처 상세 조회 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "거래처 상세 조회에 실패했습니다.",
      client: null,
    };
  }
}

type ManagedClientData = {
  clientId: string;
  productType1: "deduct" | "maintenance";
  productType2?: string; // '3m' | '6m' | '9m' | '12m' | 'standard' | 'premium'
  totalAmount?: number; // 금액차감형만
  paymentStatus: "paid" | "prepaid" | "unpaid";
  // 유지보수형 세부 내용
  detailTextEditCount?: number;
  detailCodingEditCount?: number;
  detailImageEditCount?: number;
  detailPopupDesignCount?: number;
  detailBannerDesignCount?: number; // 프리미엄만
  note?: string;
};

/**
 * 관리고객 등록
 */
export async function createManagedClient(data: ManagedClientData) {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();
    // 유지보수형인 경우 초기값도 함께 저장
    const insertData: any = {
      client_id: data.clientId,
      product_type1: data.productType1,
      product_type2: data.productType2 || null,
      total_amount: data.totalAmount || null,
      payment_status: data.paymentStatus,
      note: data.note || null,
    };

    // 금액차감형인 경우 initial_total_amount 저장 (등록 시점의 total_amount가 초기값)
    if (data.productType1 === "deduct" && data.totalAmount) {
      insertData.initial_total_amount = data.totalAmount;
    }

    // 유지보수형인 경우 현재 횟수와 초기값 모두 저장
    if (data.productType1 === "maintenance") {
      insertData.detail_text_edit_count = data.detailTextEditCount || 0;
      insertData.detail_coding_edit_count = data.detailCodingEditCount || 0;
      insertData.detail_image_edit_count = data.detailImageEditCount || 0;
      insertData.detail_popup_design_count = data.detailPopupDesignCount || 0;
      insertData.detail_banner_design_count = data.detailBannerDesignCount || 0;
      
      // 초기값 저장 (등록 시점의 값이 초기값)
      insertData.initial_detail_text_edit_count = data.detailTextEditCount || 0;
      insertData.initial_detail_coding_edit_count = data.detailCodingEditCount || 0;
      insertData.initial_detail_image_edit_count = data.detailImageEditCount || 0;
      insertData.initial_detail_popup_design_count = data.detailPopupDesignCount || 0;
      insertData.initial_detail_banner_design_count = data.detailBannerDesignCount || 0;
    }

    const { data: managedClient, error } = await supabase
      .from("managed_client")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/operations/clients");
    revalidatePath("/operations/clients/new");

    return {
      success: true,
      managedClientId: managedClient.id,
    };
  } catch (error) {
    console.error("관리고객 등록 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "관리고객 등록에 실패했습니다.",
    };
  }
}

/**
 * 관리고객 목록 조회
 */
export async function getManagedClients(params: {
  page?: number;
  limit?: number;
  searchKeyword?: string; // 회사명 또는 브랜드명
  productType1?: "deduct" | "maintenance";
  status?: "ongoing" | "wait" | "end" | "unpaid";
  startDateFrom?: string;
  startDateTo?: string;
}) {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    // managed_client와 client 조인하여 조회
    let query = supabase
      .from("managed_client_view")
      .select(
        `
        id,
        client_id,
        client_name,
        product_type1,
        product_type2,
        total_amount,
        payment_status,
        start_date,
        computed_end_date,
        computed_status,
        created_at
      `,
        { count: "exact" }
      );

    // 검색 키워드 필터 (회사명 또는 브랜드명)
    if (params.searchKeyword) {
      query = query.ilike("client_name", `%${params.searchKeyword}%`);
    }

    // 관리유형 필터
    if (params.productType1) {
      query = query.eq("product_type1", params.productType1);
    }

    // 진행상황 필터
    if (params.status) {
      query = query.eq("computed_status", params.status);
    }

    // 시작일 필터
    if (params.startDateFrom) {
      query = query.gte("start_date", params.startDateFrom);
    }
    if (params.startDateTo) {
      query = query.lte("start_date", params.startDateTo);
    }

    query = query.order("created_at", { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // 모든 관리고객의 client_id 수집
    const clientIds = (data || []).map((item: any) => item.client_id).filter(Boolean);
    
    // 모든 브랜드명 조회 (한 번에)
    let brandNamesMap: Record<string, string[]> = {};
    if (clientIds.length > 0) {
      const { data: sitesData, error: sitesError } = await supabase
        .from("client_site")
        .select("client_id, brand_name")
        .in("client_id", clientIds);
      
      if (!sitesError && sitesData) {
        // client_id별로 브랜드명 그룹화
        sitesData.forEach((site: any) => {
          if (site.client_id && site.brand_name) {
            if (!brandNamesMap[site.client_id]) {
              brandNamesMap[site.client_id] = [];
            }
            brandNamesMap[site.client_id].push(site.brand_name);
          }
        });
      }
    }

    // 데이터 가공
    let processedData = (data || []).map((item: any) => {
      const brandNames = brandNamesMap[item.client_id] || [];

      return {
        id: item.id,
        clientId: item.client_id || "",
        companyName: item.client_name || "",
        brandNames,
        productType1: item.product_type1,
        productType2: item.product_type2 || "",
        totalAmount: item.total_amount ? Number(item.total_amount) : null,
        paymentStatus: item.payment_status,
        startDate: item.start_date,
        endDate: item.computed_end_date,
        status: item.computed_status,
        createdAt: item.created_at,
      };
    });

    // 전체 개수 계산 (DB count 기반)
    const totalCount = count ?? processedData.length;
    const totalPages = Math.ceil(totalCount / limit);

    const managedClients = processedData;

    return {
      success: true,
      managedClients,
      totalCount,
      totalPages,
    };
  } catch (error) {
    console.error("관리고객 목록 조회 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "관리고객 목록 조회에 실패했습니다.",
      managedClients: [],
      totalCount: 0,
      totalPages: 0,
    };
  }
}

/**
 * 관리고객 상세 조회
 */
export async function getManagedClientDetail(managedClientId: string) {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();
    // managed_client 정보 조회
    const { data: managedClient, error: managedClientError } = await supabase
      .from("managed_client_view")
      .select(
        "id, client_id, product_type1, product_type2, total_amount, initial_total_amount, payment_status, start_date, end_date, status, detail_text_edit_count, detail_coding_edit_count, detail_image_edit_count, detail_popup_design_count, detail_banner_design_count, note, computed_end_date, computed_status, created_at"
      )
      .eq("id", managedClientId)
      .single();

    if (managedClientError) throw managedClientError;
    if (!managedClient) throw new Error("관리고객을 찾을 수 없습니다.");

    const clientId = managedClient.client_id;
    
    // 사용금액 계산 (금액차감형인 경우)
    let usedAmount = 0;
    if (managedClient.product_type1 === "deduct") {
      const { data: workRequests, error: workRequestError } = await supabase
        .from("work_request")
        .select("approval_deducted_amount")
        .eq("managed_client_id", managedClientId)
        .eq("work_type", "deduct")
        .in("status", ["approved", "in_progress", "completed"])
        .neq("status", "deleted");
      
      if (workRequestError) {
        console.error("사용금액 계산 오류:", workRequestError);
      }
      
      if (workRequests && workRequests.length > 0) {
        usedAmount = workRequests.reduce((sum, wr) => {
          const amount = wr.approval_deducted_amount ? Number(wr.approval_deducted_amount) : 0;
          return sum + amount;
        }, 0);
      }
      
      // 디버깅용 로그
      console.log("금액 정보:", {
        total_amount: managedClient.total_amount,
        initial_total_amount: managedClient.initial_total_amount,
        usedAmount,
        workRequestsCount: workRequests?.length || 0,
      });
    }
    
    const [clientResult, contactsResult, sitesResult, attachmentsResult] =
      await Promise.all([
        supabase
          .from("client")
          .select(
            "id, business_registration_number, name, ceo_name, postal_code, address, address_detail, business_type, business_item, login_id, status, note"
          )
          .eq("id", clientId)
          .single(),
        supabase
          .from("client_contact")
          .select("name, phone, email, title, note")
          .eq("client_id", clientId)
          .order("created_at", { ascending: true }),
        supabase
          .from("client_site")
          .select("id, brand_name, domain, solution, login_id, login_password, type")
          .eq("client_id", clientId)
          .order("created_at", { ascending: true }),
        supabase
          .from("client_attachment")
          .select("file_url, file_name, file_type")
          .eq("client_id", clientId)
          .order("created_at", { ascending: true }),
      ]);

    if (clientResult.error) throw clientResult.error;
    if (!clientResult.data) throw new Error("거래처를 찾을 수 없습니다.");
    if (contactsResult.error) throw contactsResult.error;
    if (sitesResult.error) throw sitesResult.error;
    if (attachmentsResult.error) throw attachmentsResult.error;

    const client = clientResult.data;
    const contacts = contactsResult.data;
    const sites = sitesResult.data;
    const attachments = attachmentsResult.data;

    // status 매핑
    const statusMap: Record<string, "정상" | "휴업" | "폐업"> = {
      approved: "정상",
      suspended: "휴업",
      closed: "폐업",
    };

    // 유지보수형이고 진행상황이 "진행"인 경우 초기화 체크
    if (
      managedClient.product_type1 === "maintenance" &&
      managedClient.computed_status === "ongoing"
    ) {
      await checkAndResetMaintenanceCounts(managedClientId);
      // 초기화 후 다시 조회하여 최신 데이터 가져오기
      const { data: updatedManagedClient } = await supabase
        .from("managed_client")
        .select("detail_text_edit_count, detail_coding_edit_count, detail_image_edit_count, detail_popup_design_count, detail_banner_design_count")
        .eq("id", managedClientId)
        .single();
      
      if (updatedManagedClient) {
        managedClient.detail_text_edit_count = updatedManagedClient.detail_text_edit_count;
        managedClient.detail_coding_edit_count = updatedManagedClient.detail_coding_edit_count;
        managedClient.detail_image_edit_count = updatedManagedClient.detail_image_edit_count;
        managedClient.detail_popup_design_count = updatedManagedClient.detail_popup_design_count;
        managedClient.detail_banner_design_count = updatedManagedClient.detail_banner_design_count;
      }
    }

    return {
      success: true,
      managedClient: {
        id: managedClient.id,
        clientId: client.id,
        productType1: managedClient.product_type1,
        productType2: managedClient.product_type2 || "",
        totalAmount: managedClient.total_amount ? Number(managedClient.total_amount) : null,
        initialTotalAmount: managedClient.initial_total_amount 
          ? Number(managedClient.initial_total_amount) 
          : (managedClient.product_type1 === "deduct" && managedClient.total_amount 
              ? Number(managedClient.total_amount) + usedAmount 
              : null),
        usedAmount: usedAmount,
        remainingAmount: managedClient.total_amount ? Number(managedClient.total_amount) : null,
        paymentStatus: managedClient.payment_status,
        startDate: managedClient.start_date,
        endDate: managedClient.computed_end_date,
        status: managedClient.computed_status,
        detailTextEditCount: managedClient.detail_text_edit_count || 0,
        detailCodingEditCount: managedClient.detail_coding_edit_count || 0,
        detailImageEditCount: managedClient.detail_image_edit_count || 0,
        detailPopupDesignCount: managedClient.detail_popup_design_count || 0,
        detailBannerDesignCount: managedClient.detail_banner_design_count || 0,
        note: managedClient.note || "",
        createdAt: managedClient.created_at,
      },
      client: {
        id: client.id,
        businessRegistrationNumber: formatBusinessNumber(
          client.business_registration_number
        ),
        name: client.name,
        ceoName: client.ceo_name || "",
        postalCode: client.postal_code || "",
        address: client.address || "",
        addressDetail: client.address_detail || "",
        businessType: client.business_type || "",
        businessItem: client.business_item || "",
        loginId: client.login_id || "",
        loginPassword: "", // 보안상 빈 문자열
        status: statusMap[client.status as string] || "정상",
        note: client.note || "",
        contacts:
          contacts?.map((c) => ({
            name: c.name,
            phone: c.phone || "",
            email: c.email || "",
            title: c.title || "",
            note: c.note || "",
          })) || [],
        sites:
          sites?.map((s) => ({
            brandName: s.brand_name || "",
            domain: s.domain || "",
            solution: s.solution || "",
            loginId: s.login_id || "",
            loginPassword: s.login_password || "",
            type: s.type || "",
          })) || [],
        attachments:
          attachments?.map((a) => ({
            fileUrl: a.file_url,
            fileName: a.file_name || "",
            fileType: a.file_type,
          })) || [],
      },
    };
  } catch (error) {
    console.error("관리고객 상세 조회 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "관리고객 상세 조회에 실패했습니다.",
      managedClient: null,
      client: null,
    };
  }
}

/**
 * 관리고객 수정
 */
export async function updateManagedClient(
  managedClientId: string,
  data: Partial<ManagedClientData> & {
    startDate?: string;
    endDate?: string;
    status?: "ongoing" | "wait" | "end" | "unpaid";
    note?: string;
  }
) {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    const updateData: any = {};

    if (data.productType1 !== undefined) {
      updateData.product_type1 = data.productType1;
    }
    if (data.productType2 !== undefined) {
      updateData.product_type2 = data.productType2 || null;
    }
    if (data.totalAmount !== undefined) {
      updateData.total_amount = data.totalAmount || null;
    }
    if (data.paymentStatus !== undefined) {
      updateData.payment_status = data.paymentStatus;
    }
    if (data.startDate !== undefined) {
      updateData.start_date = data.startDate || null;
    }
    if (data.endDate !== undefined) {
      updateData.end_date = data.endDate || null;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.note !== undefined) {
      updateData.note = data.note || null;
    }

    // 유지보수형인 경우 세부 내용 업데이트
    if (data.productType1 === "maintenance" || updateData.product_type1 === "maintenance") {
      if (data.detailTextEditCount !== undefined) {
        updateData.detail_text_edit_count = data.detailTextEditCount || 0;
      }
      if (data.detailCodingEditCount !== undefined) {
        updateData.detail_coding_edit_count = data.detailCodingEditCount || 0;
      }
      if (data.detailImageEditCount !== undefined) {
        updateData.detail_image_edit_count = data.detailImageEditCount || 0;
      }
      if (data.detailPopupDesignCount !== undefined) {
        updateData.detail_popup_design_count = data.detailPopupDesignCount || 0;
      }
      if (data.detailBannerDesignCount !== undefined) {
        updateData.detail_banner_design_count = data.detailBannerDesignCount || 0;
      }
    }

    const { error } = await supabase
      .from("managed_client")
      .update(updateData)
      .eq("id", managedClientId);

    if (error) throw error;

    revalidatePath("/operations/clients");
    revalidatePath(`/operations/clients/${managedClientId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("관리고객 수정 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "관리고객 수정에 실패했습니다.",
    };
  }
}

/**
 * 관리고객 삭제
 */
export async function deleteManagedClients(managedClientIds: string[]) {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("managed_client")
      .delete()
      .in("id", managedClientIds);

    if (error) throw error;

    revalidatePath("/operations/clients");

    return {
      success: true,
    };
  } catch (error) {
    console.error("관리고객 삭제 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "관리고객 삭제에 실패했습니다.",
    };
  }
}
