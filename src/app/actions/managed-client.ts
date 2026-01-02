"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

/**
 * 거래처 목록 조회 (모달용 - 검색 가능)
 */
export async function getClientsForModal(
  searchType?: "name" | "ceo",
  searchKeyword?: string
) {
  const supabase = await getSupabaseServerClient();

  try {
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
  const supabase = await getSupabaseServerClient();

  try {
    // 거래처 메인 정보
    const { data: client, error: clientError } = await supabase
      .from("client")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError) throw clientError;
    if (!client) throw new Error("거래처를 찾을 수 없습니다.");

    // 담당자 정보
    const { data: contacts, error: contactsError } = await supabase
      .from("client_contact")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    if (contactsError) throw contactsError;

    // 사이트 정보
    const { data: sites, error: sitesError } = await supabase
      .from("client_site")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    if (sitesError) throw sitesError;

    // 첨부파일 정보
    const { data: attachments, error: attachmentsError } = await supabase
      .from("client_attachment")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    if (attachmentsError) throw attachmentsError;

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
        businessRegistrationNumber: client.business_registration_number,
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
  const supabase = await getSupabaseServerClient();

  try {
    const { data: managedClient, error } = await supabase
      .from("managed_client")
      .insert({
        client_id: data.clientId,
        product_type1: data.productType1,
        product_type2: data.productType2 || null,
        total_amount: data.totalAmount || null,
        payment_status: data.paymentStatus,
        detail_text_edit_count: data.detailTextEditCount || null,
        detail_coding_edit_count: data.detailCodingEditCount || null,
        detail_image_edit_count: data.detailImageEditCount || null,
        detail_popup_design_count: data.detailPopupDesignCount || null,
        detail_banner_design_count: data.detailBannerDesignCount || null,
        note: data.note || null,
      })
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
  productType1?: "deduct" | "maintenance" | "";
  status?: "ongoing" | "wait" | "end" | "unpaid" | "";
  startDateFrom?: string;
  startDateTo?: string;
}) {
  const supabase = await getSupabaseServerClient();
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  try {
    // 기본 쿼리: managed_client 조회
    let query = supabase
      .from("managed_client")
      .select("*")
      .order("created_at", { ascending: false });

    // 검색 조건: 회사명 또는 브랜드명
    let clientIds: string[] | null = null;
    if (params.searchKeyword && params.searchKeyword.trim()) {
      const keyword = params.searchKeyword.trim();

      // 회사명으로 검색
      const { data: clientsByName } = await supabase
        .from("client")
        .select("id")
        .ilike("name", `%${keyword}%`);

      // 브랜드명으로 검색
      const { data: sitesByBrand } = await supabase
        .from("client_site")
        .select("client_id")
        .ilike("brand_name", `%${keyword}%`);

      const idsByName = clientsByName?.map((c) => c.id) || [];
      const idsByBrand = sitesByBrand?.map((s) => s.client_id) || [];
      const allIds = [...new Set([...idsByName, ...idsByBrand])];

      if (allIds.length > 0) {
        clientIds = allIds;
        query = query.in("client_id", allIds);
      } else {
        // 검색 결과가 없으면 빈 결과 반환
        return {
          success: true,
          managedClients: [],
          totalCount: 0,
          totalPages: 0,
        };
      }
    }

    // 관리유형 필터
    if (params.productType1) {
      query = query.eq("product_type1", params.productType1);
    }

    // 시작일 범위 필터
    if (params.startDateFrom) {
      query = query.gte("start_date", params.startDateFrom);
    }
    if (params.startDateTo) {
      query = query.lte("start_date", params.startDateTo);
    }

    // 먼저 모든 데이터를 가져옴 (진행상황 계산을 위해)
    const { data: managedClientsData, error } = await query;

    if (error) throw error;

    const finalData = managedClientsData || [];

    // client_id 목록 수집
    const uniqueClientIds = [
      ...new Set(finalData.map((item: any) => item.client_id)),
    ];

    // client 정보 조회
    const { data: clientsData } = await supabase
      .from("client")
      .select("id, name")
      .in("id", uniqueClientIds);

    // client_site 정보 조회
    const { data: sitesData } = await supabase
      .from("client_site")
      .select("client_id, brand_name")
      .in("client_id", uniqueClientIds);

    // client와 sites를 맵으로 변환
    const clientsMap = new Map((clientsData || []).map((c: any) => [c.id, c]));
    const sitesMap = new Map<string, any[]>();
    (sitesData || []).forEach((s: any) => {
      if (!sitesMap.has(s.client_id)) {
        sitesMap.set(s.client_id, []);
      }
      sitesMap.get(s.client_id)!.push(s);
    });

    // 데이터 변환 및 진행상황 계산
    let processedData = finalData.map((item: any) => {
      const client = clientsMap.get(item.client_id);
      const sites = sitesMap.get(item.client_id) || [];
      const brandNames = sites.map((s: any) => s.brand_name).filter(Boolean);

      // 종료일 계산 (없으면 계산)
      let endDate = item.end_date;
      if (!endDate && item.start_date) {
        if (item.product_type1 === "deduct" && item.product_type2) {
          const months = parseInt(item.product_type2.replace("m", ""));
          const start = new Date(item.start_date);
          start.setMonth(start.getMonth() + months);
          endDate = start.toISOString();
        } else if (item.product_type1 === "maintenance") {
          const start = new Date(item.start_date);
          start.setFullYear(start.getFullYear() + 1);
          endDate = start.toISOString();
        }
      }

      // 진행상황 계산
      let status = item.status;
      if (!status) {
        // 미납 체크 (최우선)
        if (item.payment_status === "unpaid") {
          status = "unpaid";
        } else {
          // 종료 여부 확인
          const now = new Date();
          const isEnded =
            (endDate && new Date(endDate) < now) ||
            (item.product_type1 === "deduct" &&
              item.total_amount !== null &&
              Number(item.total_amount) === 0);

          if (isEnded) {
            status = "end";
          } else if (item.start_date) {
            status = "ongoing";
          } else {
            status = "wait";
          }
        }
      } else {
        // status가 이미 있더라도 재계산 (미납 우선, 종료 확인)
        if (item.payment_status === "unpaid") {
          status = "unpaid";
        } else {
          const now = new Date();
          const isEnded =
            (endDate && new Date(endDate) < now) ||
            (item.product_type1 === "deduct" &&
              item.total_amount !== null &&
              Number(item.total_amount) === 0);

          if (isEnded) {
            status = "end";
          }
        }
      }

      return {
        id: item.id,
        clientId: client?.id || item.client_id || "",
        companyName: client?.name || "",
        brandNames: brandNames,
        productType1: item.product_type1,
        productType2: item.product_type2 || "",
        totalAmount: item.total_amount ? Number(item.total_amount) : null,
        paymentStatus: item.payment_status,
        startDate: item.start_date,
        endDate: endDate,
        status: status,
        createdAt: item.created_at,
      };
    });

    // 진행상황 필터 적용
    if (params.status) {
      processedData = processedData.filter((mc) => mc.status === params.status);
    }

    // 전체 개수 계산
    const totalCount = processedData.length;

    // 페이지네이션 적용
    const paginatedData = processedData.slice(offset, offset + limit);
    const totalPages = Math.ceil(totalCount / limit);

    const managedClients = paginatedData;

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
  const supabase = await getSupabaseServerClient();

  try {
    // managed_client 정보 조회
    const { data: managedClient, error: managedClientError } = await supabase
      .from("managed_client")
      .select("*")
      .eq("id", managedClientId)
      .single();

    if (managedClientError) throw managedClientError;
    if (!managedClient) throw new Error("관리고객을 찾을 수 없습니다.");

    // 거래처 정보 조회
    const { data: client, error: clientError } = await supabase
      .from("client")
      .select("*")
      .eq("id", managedClient.client_id)
      .single();

    if (clientError) throw clientError;
    if (!client) throw new Error("거래처를 찾을 수 없습니다.");

    // 담당자 정보
    const { data: contacts, error: contactsError } = await supabase
      .from("client_contact")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: true });

    if (contactsError) throw contactsError;

    // 사이트 정보
    const { data: sites, error: sitesError } = await supabase
      .from("client_site")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: true });

    if (sitesError) throw sitesError;

    // 첨부파일 정보
    const { data: attachments, error: attachmentsError } = await supabase
      .from("client_attachment")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: true });

    if (attachmentsError) throw attachmentsError;

    // status 매핑
    const statusMap: Record<string, "정상" | "휴업" | "폐업"> = {
      approved: "정상",
      suspended: "휴업",
      closed: "폐업",
    };

    // 종료일 계산
    let endDate = managedClient.end_date;
    if (!endDate && managedClient.start_date) {
      if (managedClient.product_type1 === "deduct" && managedClient.product_type2) {
        const months = parseInt(managedClient.product_type2.replace("m", ""));
        const start = new Date(managedClient.start_date);
        start.setMonth(start.getMonth() + months);
        endDate = start.toISOString();
      } else if (managedClient.product_type1 === "maintenance") {
        const start = new Date(managedClient.start_date);
        start.setFullYear(start.getFullYear() + 1);
        endDate = start.toISOString();
      }
    }

    // 진행상황 계산
    let status = managedClient.status;
    if (!status) {
      if (managedClient.payment_status === "unpaid") {
        status = "unpaid";
      } else {
        const now = new Date();
        const isEnded =
          (endDate && new Date(endDate) < now) ||
          (managedClient.product_type1 === "deduct" &&
            managedClient.total_amount !== null &&
            Number(managedClient.total_amount) === 0);

        if (isEnded) {
          status = "end";
        } else if (managedClient.start_date) {
          status = "ongoing";
        } else {
          status = "wait";
        }
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
        paymentStatus: managedClient.payment_status,
        startDate: managedClient.start_date,
        endDate: endDate,
        status: status,
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
        businessRegistrationNumber: client.business_registration_number,
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
 * 관리고객 삭제 (여러 개)
 */
export async function deleteManagedClients(ids: string[]) {
  const supabase = await getSupabaseServerClient();

  try {
    const { error } = await supabase
      .from("managed_client")
      .delete()
      .in("id", ids);

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
