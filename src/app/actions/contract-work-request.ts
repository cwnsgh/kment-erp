"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSession, requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/** 계약 업무 등록 폼용: 계약 + 거래처 + 사이트/연락처 + 작업내용(PC/모바일 수정 N회) */
export async function getContractForTaskRegistration(contractId: string): Promise<{
  success: boolean;
  error?: string;
  contract?: {
    id: string;
    client_id: string;
    contract_name: string;
    contract_date: string;
    contract_type_name: string;
    site_brand_name: string | null;
    primary_contact_name: string | null;
    secondary_contact_name: string | null;
    work_note: string | null;
  };
  client?: {
    id: string;
    name: string;
    business_registration_number: string | null;
    address: string | null;
    ceo_name: string | null;
  };
  sites?: Array<{ id: string; brand_name: string | null }>;
  contacts?: Array<{ name: string; phone: string | null; email: string | null }>;
  workContents?: Array<{
    id: string;
    work_content_id: string;
    work_content_name: string;
    modification_count: number;
  }>;
}> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    const { data: contractRow, error: contractError } = await supabase
      .from("contract")
      .select(`
        id,
        client_id,
        contract_name,
        contract_date,
        contract_type_id,
        work_note,
        primary_contact,
        secondary_contact,
        site_id,
        contract_type:contract_type_id ( name ),
        primary_contact_employee:primary_contact ( name ),
        secondary_contact_employee:secondary_contact ( name ),
        site:site_id ( brand_name )
      `)
      .eq("id", contractId)
      .single();

    if (contractError || !contractRow) {
      return { success: false, error: "계약을 찾을 수 없습니다." };
    }

    const clientId = contractRow.client_id as string;
    const contractTypeId = contractRow.contract_type_id as string;
    const [clientRes, contactsRes, sitesRes, workContentRes, typeWorkContentRes] = await Promise.all([
      supabase
        .from("client")
        .select("id, name, business_registration_number, address, ceo_name")
        .eq("id", clientId)
        .single(),
      supabase
        .from("client_contact")
        .select("name, phone, email")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true }),
      supabase
        .from("client_site")
        .select("id, brand_name")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true }),
      supabase
        .from("contract_work_content")
        .select(`
          id,
          work_content_id,
          modification_count,
          contract_type_work_content:work_content_id ( work_content_name )
        `)
        .eq("contract_id", contractId),
      supabase
        .from("contract_type_work_content")
        .select("id, work_content_name, display_order, default_modification_count")
        .eq("contract_type_id", contractTypeId)
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
    ]);

    const client = clientRes.data;
    if (!client) {
      return { success: false, error: "거래처 정보를 찾을 수 없습니다." };
    }

    const contractType = Array.isArray(contractRow.contract_type)
      ? contractRow.contract_type[0]
      : contractRow.contract_type;
    const primaryEmp = Array.isArray(contractRow.primary_contact_employee)
      ? contractRow.primary_contact_employee[0]
      : contractRow.primary_contact_employee;
    const secondaryEmp = Array.isArray(contractRow.secondary_contact_employee)
      ? contractRow.secondary_contact_employee[0]
      : contractRow.secondary_contact_employee;
    const site = Array.isArray(contractRow.site) ? contractRow.site[0] : contractRow.site;

    const existingByWorkContentId = new Map<string, { id: string; modification_count: number; work_content_name: string }>();
    for (const row of workContentRes.data ?? []) {
      const wc = Array.isArray(row.contract_type_work_content)
        ? row.contract_type_work_content[0]
        : row.contract_type_work_content;
      const count = Number(row.modification_count ?? 0);
      existingByWorkContentId.set(row.work_content_id, {
        id: row.id,
        modification_count: count,
        work_content_name: wc?.work_content_name ?? "",
      });
    }

    const typeWorkContents = typeWorkContentRes.data ?? [];
    const workContents: Array<{ id: string; work_content_id: string; work_content_name: string; modification_count: number }> = [];

    for (const typeWc of typeWorkContents) {
      const workContentId = typeWc.id;
      const existing = existingByWorkContentId.get(workContentId);
      if (existing) {
        workContents.push({
          id: existing.id,
          work_content_id: workContentId,
          work_content_name: existing.work_content_name || (typeWc.work_content_name ?? ""),
          modification_count: existing.modification_count,
        });
      } else {
        const defaultCount = Math.max(0, Number((typeWc as { default_modification_count?: number }).default_modification_count ?? 0));
        const { data: inserted, error: insertErr } = await supabase
          .from("contract_work_content")
          .insert({
            contract_id: contractId,
            work_content_id: workContentId,
            modification_count: defaultCount,
          })
          .select("id, modification_count")
          .single();
        if (!insertErr && inserted) {
          const count = Number((inserted as { id: string; modification_count?: number }).modification_count ?? defaultCount);
          workContents.push({
            id: inserted.id,
            work_content_id: workContentId,
            work_content_name: typeWc.work_content_name ?? "",
            modification_count: count,
          });
        }
      }
    }

    return {
      success: true,
      contract: {
        id: contractRow.id,
        client_id: clientId,
        contract_name: contractRow.contract_name,
        contract_date: contractRow.contract_date,
        contract_type_name: contractType?.name ?? "",
        site_brand_name: site?.brand_name ?? null,
        primary_contact_name: primaryEmp?.name ?? null,
        secondary_contact_name: secondaryEmp?.name ?? null,
        work_note: contractRow.work_note ?? null,
      },
      client: {
        id: client.id,
        name: client.name ?? "",
        business_registration_number: client.business_registration_number ?? null,
        address: client.address ?? null,
        ceo_name: client.ceo_name ?? null,
      },
      sites: (sitesRes.data ?? []).map((s: { id: string; brand_name: string | null }) => ({
        id: s.id,
        brand_name: s.brand_name ?? null,
      })),
      contacts: (contactsRes.data ?? []).map((c: { name: string; phone: string | null; email: string | null }) => ({
        name: c.name,
        phone: c.phone ?? null,
        email: c.email ?? null,
      })),
      workContents,
    };
  } catch (error: any) {
    console.error("계약(업무등록용) 조회 오류:", error);
    return {
      success: false,
      error: error.message ?? "계약 정보를 불러오는데 실패했습니다.",
    };
  }
}

/** 계약 업무 요청 생성 (승인요청) */
export async function createContractWorkRequest(data: {
  contractId: string;
  clientId: string;
  contractWorkContentId: string;
  brandName: string;
  manager: string;
  workPeriod: string;
  attachmentUrl?: string;
  attachmentName?: string;
  workContent: string;
  memo?: string;
}): Promise<{ success: boolean; error?: string; requestId?: string }> {
  try {
    const session = await getSession();
    if (!session || session.type !== "employee") {
      return { success: false, error: "직원 로그인이 필요합니다." };
    }

    const supabase = await getSupabaseServerClient();

    const { data: workContentRow, error: countError } = await supabase
      .from("contract_work_content")
      .select("modification_count")
      .eq("id", data.contractWorkContentId)
      .single();

    if (countError || !workContentRow) {
      return { success: false, error: "작업 유형 정보를 찾을 수 없습니다." };
    }
    const count = Number(workContentRow.modification_count ?? 0);
    if (count < 1) {
      return { success: false, error: "수정 횟수가 부족합니다. 해당 작업 유형의 잔여 횟수가 0회입니다." };
    }

    const { data: row, error } = await supabase
      .from("contract_work_request")
      .insert({
        contract_id: data.contractId,
        client_id: data.clientId,
        employee_id: session.id,
        contract_work_content_id: data.contractWorkContentId,
        brand_name: data.brandName,
        manager: data.manager,
        work_period: data.workPeriod || null,
        attachment_url: data.attachmentUrl ?? null,
        attachment_name: data.attachmentName ?? null,
        work_content: data.workContent || null,
        memo: data.memo ?? null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;
    revalidatePath("/contracts/tasks/new");
    revalidatePath("/contracts");
    return { success: true, requestId: row?.id };
  } catch (error: any) {
    console.error("계약 업무 요청 생성 오류:", error);
    return {
      success: false,
      error: error.message ?? "승인 요청 등록에 실패했습니다.",
    };
  }
}

/** 계약별 업무 요청 목록 (업무 등록 페이지에서 표시) */
export async function getContractWorkRequestsByContract(contractId: string): Promise<{
  success: boolean;
  error?: string;
  requests?: Array<{
    id: string;
    contract_work_content_id: string | null;
    work_content_name: string | null;
    brand_name: string;
    manager: string;
    work_period: string | null;
    attachment_url: string | null;
    attachment_name: string | null;
    work_content: string | null;
    memo: string | null;
    status: string;
    created_at: string;
  }>;
}> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    const { data: rows, error } = await supabase
      .from("contract_work_request")
      .select(`
        id,
        contract_work_content_id,
        brand_name,
        manager,
        work_period,
        attachment_url,
        attachment_name,
        work_content,
        memo,
        status,
        created_at,
        contract_work_content:contract_work_content_id (
          contract_type_work_content:work_content_id ( work_content_name )
        )
      `)
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const requests = (rows ?? []).map((r: any) => {
      const cwc = r.contract_work_content;
      const wc = cwc?.contract_type_work_content;
      const name = Array.isArray(wc) ? wc[0]?.work_content_name : wc?.work_content_name;
      return {
        id: r.id,
        contract_work_content_id: r.contract_work_content_id ?? null,
        work_content_name: name ?? null,
        brand_name: r.brand_name ?? "",
        manager: r.manager ?? "",
        work_period: r.work_period ?? null,
        attachment_url: r.attachment_url ?? null,
        attachment_name: r.attachment_name ?? null,
        work_content: r.work_content ?? null,
        memo: r.memo ?? null,
        status: r.status ?? "pending",
        created_at: r.created_at,
      };
    });

    return { success: true, requests };
  } catch (error: any) {
    console.error("계약 업무 요청 목록 조회 오류:", error);
    return {
      success: false,
      error: error.message ?? "목록 조회에 실패했습니다.",
      requests: [],
    };
  }
}

/** 계약 업무 현황 페이지용 목록 조회 (담당자/회사·브랜드/진행상태/등록일 필터) */
export async function getContractWorkRequestsForBoard(filters?: {
  employeeId?: string | null;
  searchKeyword?: string;
  statusFilter?: "all" | "pending" | "approved" | "in_progress" | "completed" | "rejected" | "deleted";
  dateFrom?: string;
  dateTo?: string;
}): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    contract_id: string;
    contract_name: string;
    client_name: string;
    brand_name: string;
    manager: string;
    employee_name: string | null;
    created_at: string;
    work_content: string | null;
    work_content_name: string | null;
    status: string;
  }>;
  error?: string;
}> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    let query = supabase
      .from("contract_work_request")
      .select(`
        id,
        contract_id,
        brand_name,
        manager,
        work_content,
        status,
        created_at,
        employee_id,
        contract:contract_id ( contract_name, client:client_id ( name ) ),
        employee:employee_id ( name ),
        contract_work_content:contract_work_content_id (
          contract_type_work_content:work_content_id ( work_content_name )
        )
      `)
      .order("created_at", { ascending: false });

    if (filters?.employeeId) {
      query = query.eq("employee_id", filters.employeeId);
    }
    if (filters?.statusFilter && filters.statusFilter !== "all") {
      query = query.eq("status", filters.statusFilter);
    }
    if (filters?.dateFrom) {
      query = query.gte("created_at", `${filters.dateFrom}T00:00:00.000Z`);
    }
    if (filters?.dateTo) {
      query = query.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    let list = (rows ?? []).map((r: any) => {
      const contract = Array.isArray(r.contract) ? r.contract[0] : r.contract;
      const client = contract?.client;
      const clientData = Array.isArray(client) ? client[0] : client;
      const emp = Array.isArray(r.employee) ? r.employee[0] : r.employee;
      const cwc = r.contract_work_content;
      const wc = cwc?.contract_type_work_content;
      const workContentName = Array.isArray(wc) ? wc[0]?.work_content_name : wc?.work_content_name;
      return {
        id: r.id,
        contract_id: r.contract_id,
        contract_name: contract?.contract_name ?? "",
        client_name: clientData?.name ?? "",
        brand_name: r.brand_name ?? "",
        manager: r.manager ?? "",
        employee_name: emp?.name ?? null,
        created_at: r.created_at,
        work_content: r.work_content ?? null,
        work_content_name: workContentName ?? null,
        status: r.status ?? "pending",
      };
    });

    if (filters?.searchKeyword?.trim()) {
      const kw = filters.searchKeyword.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.client_name.toLowerCase().includes(kw) ||
          item.brand_name.toLowerCase().includes(kw) ||
          (item.contract_name || "").toLowerCase().includes(kw)
      );
    }

    return { success: true, data: list };
  } catch (error: any) {
    console.error("계약 업무 현황 목록 조회 오류:", error);
    return {
      success: false,
      error: error.message ?? "목록 조회에 실패했습니다.",
      data: [],
    };
  }
}

/** 클라이언트의 계약 업무 요청 목록 (승인 페이지용) */
export async function getClientContractWorkRequests(
  clientIdOrEmpty: string,
  options?: { statusFilter?: "all" | "pending" | "approved" | "rejected" | "in_progress" | "completed"; page?: number; limit?: number }
): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    contract_id: string;
    contract_name: string;
    work_content_name: string | null;
    brand_name: string;
    manager: string;
    work_period: string | null;
    work_content: string | null;
    memo: string | null;
    status: string;
    created_at: string;
    employee_name: string | null;
  }>;
  totalCount?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session || session.type !== "client") {
      return { success: false, error: "클라이언트 로그인이 필요합니다." };
    }
    const supabase = await getSupabaseServerClient();
    const clientId = clientIdOrEmpty || session.id;

    let query = supabase
      .from("contract_work_request")
      .select(
        `
        id,
        contract_id,
        brand_name,
        manager,
        work_period,
        work_content,
        memo,
        status,
        created_at,
        contract:contract_id ( contract_name ),
        employee:employee_id ( name ),
        contract_work_content:contract_work_content_id (
          contract_type_work_content:work_content_id ( work_content_name )
        )
      `,
        { count: "exact" }
      )
      .eq("client_id", clientId);

    if (options?.statusFilter && options.statusFilter !== "all") {
      query = query.eq("status", options.statusFilter);
    }
    query = query.order("created_at", { ascending: false });

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: rows, error, count } = await query;
    if (error) throw error;

    const data = (rows ?? []).map((r: any) => {
      const contract = Array.isArray(r.contract) ? r.contract[0] : r.contract;
      const emp = Array.isArray(r.employee) ? r.employee[0] : r.employee;
      const cwc = r.contract_work_content;
      const wc = cwc?.contract_type_work_content;
      const name = Array.isArray(wc) ? wc[0]?.work_content_name : wc?.work_content_name;
      return {
        id: r.id,
        contract_id: r.contract_id,
        contract_name: contract?.contract_name ?? "",
        work_content_name: name ?? null,
        brand_name: r.brand_name ?? "",
        manager: r.manager ?? "",
        work_period: r.work_period ?? null,
        work_content: r.work_content ?? null,
        memo: r.memo ?? null,
        status: r.status ?? "pending",
        created_at: r.created_at,
        employee_name: emp?.name ?? null,
      };
    });

    return { success: true, data, totalCount: count ?? 0 };
  } catch (error: any) {
    console.error("클라이언트 계약 업무 요청 조회 오류:", error);
    return {
      success: false,
      error: error.message ?? "목록 조회에 실패했습니다.",
      data: [],
      totalCount: 0,
    };
  }
}

/** 클라이언트 승인 (RPC: modification_count 차감 후 approved) */
export async function approveContractWorkRequest(
  requestId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.rpc("approve_contract_work_request", {
      p_request_id: requestId,
      p_client_id: clientId,
    });

    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (row && row.success === false) {
      return { success: false, error: row.error ?? "승인 처리에 실패했습니다." };
    }
    revalidatePath("/contracts/tasks/new");
    revalidatePath("/contracts");
    return { success: true };
  } catch (error: any) {
    console.error("계약 업무 승인 오류:", error);
    return {
      success: false,
      error: error.message ?? "승인 처리에 실패했습니다.",
    };
  }
}

/** 클라이언트 거절 */
export async function rejectContractWorkRequest(
  requestId: string,
  clientId: string,
  rejectionReason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("contract_work_request")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason,
        approved_at: new Date().toISOString(),
        approved_by: clientId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("client_id", clientId)
      .eq("status", "pending");

    if (error) throw error;
    revalidatePath("/contracts/tasks/new");
    revalidatePath("/contracts");
    return { success: true };
  } catch (error: any) {
    console.error("계약 업무 거절 오류:", error);
    return {
      success: false,
      error: error.message ?? "거절 처리에 실패했습니다.",
    };
  }
}

/** 업무 상태 변경: in_progress | completed */
export async function updateContractWorkRequestStatus(
  requestId: string,
  status: "in_progress" | "completed"
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("contract_work_request")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .in("status", ["approved", "in_progress"]);

    if (error) throw error;
    revalidatePath("/contracts/tasks/new");
    revalidatePath("/contracts");
    return { success: true };
  } catch (error: any) {
    console.error("계약 업무 상태 변경 오류:", error);
    return {
      success: false,
      error: error.message ?? "상태 변경에 실패했습니다.",
    };
  }
}

/** 업무 요청 삭제 (승인된 경우 횟수 복구 후 deleted) */
export async function deleteContractWorkRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.rpc("delete_contract_work_request", {
      p_request_id: requestId,
    });

    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (row && row.success === false) {
      return { success: false, error: row.error ?? "삭제에 실패했습니다." };
    }
    revalidatePath("/contracts/tasks/new");
    revalidatePath("/contracts");
    return { success: true };
  } catch (error: any) {
    console.error("계약 업무 삭제 오류:", error);
    return {
      success: false,
      error: error.message ?? "삭제에 실패했습니다.",
    };
  }
}
