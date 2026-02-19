"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSession, requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type WorkContentData = {
  workContentId: string;
  modificationCount: number;
};

type ContractData = {
  siteId: string;
  contractName: string;
  contractDate: string;
  contractTypeId: string;
  draftDueDate?: string;
  demoDueDate?: string;
  finalCompletionDate?: string;
  openDueDate?: string;
  contractAmount: number;
  paymentProgress: "paid" | "installment" | "unpaid";
  installmentAmount?: number;
  contractNote?: string;
  contractFunctionality?: string;
  workContents: WorkContentData[];
  contractFileUrl?: string;
  estimateFileUrl?: string;
  primaryContact: string;
  secondaryContact?: string;
  workNote?: string;
};

/**
 * 계약 생성
 */
export async function createContract(
  clientId: string,
  contracts: ContractData[]
): Promise<{
  success: boolean;
  error?: string;
  contractIds?: string[];
}> {
  try {
    const session = await requireAuth();
    if (session.type !== "employee") {
      return {
        success: false,
        error: "직원만 계약을 등록할 수 있습니다.",
      };
    }

    const supabase = await getSupabaseServerClient();
    const contractIds: string[] = [];

    // 각 계약을 순차적으로 저장
    for (const contractData of contracts) {
      // siteId는 이미 UUID 형식
      const siteUuid = contractData.siteId;

      // siteId 유효성 검사
      if (!siteUuid || !siteUuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return {
          success: false,
          error: "유효하지 않은 사이트 ID입니다.",
        };
      }

      // 계약 저장
      const { data: contract, error: contractError } = await supabase
        .from("contract")
        .insert({
          client_id: clientId,
          site_id: siteUuid,
          contract_name: contractData.contractName,
          contract_date: contractData.contractDate,
          contract_type_id: contractData.contractTypeId,
          draft_due_date: contractData.draftDueDate || null,
          demo_due_date: contractData.demoDueDate || null,
          final_completion_date: contractData.finalCompletionDate || null,
          open_due_date: contractData.openDueDate || null,
          contract_amount: contractData.contractAmount,
          payment_progress: contractData.paymentProgress,
          installment_amount: contractData.installmentAmount || null,
          contract_note: contractData.contractNote || null,
          contract_functionality: contractData.contractFunctionality || null,
          work_note: contractData.workNote || null,
          primary_contact: contractData.primaryContact,
          secondary_contact: contractData.secondaryContact || null,
          created_by: session.id,
        })
        .select("id")
        .single();

      if (contractError) throw contractError;
      if (!contract) throw new Error("계약 생성 실패");

      contractIds.push(contract.id);

      // 작업 내용 저장
      if (contractData.workContents && contractData.workContents.length > 0) {
        const workContentData = contractData.workContents
          .filter((wc) => wc.modificationCount > 0) // 수정 횟수가 0보다 큰 것만 저장
          .map((wc) => ({
            contract_id: contract.id,
            work_content_id: wc.workContentId,
            modification_count: wc.modificationCount,
          }));

        if (workContentData.length > 0) {
          const { error: workContentError } = await supabase
            .from("contract_work_content")
            .insert(workContentData);

          if (workContentError) throw workContentError;
        }
      }

      // 첨부파일 저장
      if (contractData.contractFileUrl) {
        const { error: attachmentError } = await supabase.from("contract_attachment").insert({
          contract_id: contract.id,
          file_url: contractData.contractFileUrl,
          file_name: contractData.contractFileUrl.split("/").pop() || "contract.pdf",
          file_type: "contract",
        });

        if (attachmentError) {
          console.error("계약서 첨부파일 저장 오류:", attachmentError);
          // 첨부파일 저장 실패는 계약 저장을 막지 않음
        }
      }

      if (contractData.estimateFileUrl) {
        const { error: attachmentError } = await supabase.from("contract_attachment").insert({
          contract_id: contract.id,
          file_url: contractData.estimateFileUrl,
          file_name: contractData.estimateFileUrl.split("/").pop() || "estimate.pdf",
          file_type: "estimate",
        });

        if (attachmentError) {
          console.error("견적서 첨부파일 저장 오류:", attachmentError);
          // 첨부파일 저장 실패는 계약 저장을 막지 않음
        }
      }
    }

    revalidatePath("/contracts");
    return {
      success: true,
      contractIds,
    };
  } catch (error: any) {
    console.error("계약 생성 오류:", error);
    return {
      success: false,
      error: error.message || "계약을 생성하는데 실패했습니다.",
    };
  }
}

/**
 * 계약 목록 조회
 */
export async function getContracts(params?: {
  searchKeyword?: string;
  paymentProgress?: "paid" | "unpaid" | "installment" | "all";
  contractDateFrom?: string;
  contractDateTo?: string;
}): Promise<{
  success: boolean;
  contracts?: Array<{
    id: string;
    contract_date: string;
    contract_name: string;
    client_name: string;
    brand_name: string;
    payment_progress: string;
    contract_type_name: string;
    contract_amount: number;
    installment_amount: number | null;
    primary_contact_name: string | null;
  }>;
  error?: string;
}> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    let query = supabase
      .from("contract")
      .select(`
        id,
        contract_date,
        contract_name,
        contract_amount,
        payment_progress,
        installment_amount,
        client:client_id (
          name
        ),
        site:site_id (
          brand_name
        ),
        contract_type:contract_type_id (
          name
        ),
        primary_contact_employee:primary_contact (
          name
        )
      `)
      .order("contract_date", { ascending: false });

    // 검색 키워드 필터는 관계형 필드 검색이 복잡하므로 일단 계약명만 검색
    // 필요시 별도로 조회 후 필터링
    if (params?.searchKeyword) {
      query = query.ilike("contract_name", `%${params.searchKeyword}%`);
    }

    // 진행상태 필터
    if (params?.paymentProgress && params.paymentProgress !== "all") {
      query = query.eq("payment_progress", params.paymentProgress);
    }

    // 계약일 범위 필터
    if (params?.contractDateFrom) {
      query = query.gte("contract_date", params.contractDateFrom);
    }
    if (params?.contractDateTo) {
      query = query.lte("contract_date", params.contractDateTo);
    }

    const { data, error } = await query;

    if (error) throw error;

    const formattedContracts =
      data?.map((contract: any) => ({
        id: contract.id,
        contract_date: contract.contract_date,
        contract_name: contract.contract_name,
        client_name: contract.client?.name || "",
        brand_name: contract.site?.brand_name || "",
        payment_progress: contract.payment_progress,
        contract_type_name: contract.contract_type?.name || "",
        contract_amount: contract.contract_amount || 0,
        installment_amount: contract.installment_amount,
        primary_contact_name: contract.primary_contact_employee?.name || null,
      })) || [];

    return {
      success: true,
      contracts: formattedContracts,
    };
  } catch (error: any) {
    console.error("계약 조회 오류:", error);
    return {
      success: false,
      error: error.message || "계약 조회에 실패했습니다.",
      contracts: [],
    };
  }
}

/**
 * 계약 상세 조회 (상세 패널용)
 * contract + client + site + contacts + attachments 일괄 조회
 */
export async function getContractDetail(contractId: string): Promise<{
  success: boolean;
  error?: string;
  detail?: {
    contract: {
      id: string;
      contract_type_id: string;
      contract_name: string;
      contract_date: string;
      contract_type_name: string;
      draft_due_date: string | null;
      demo_due_date: string | null;
      final_completion_date: string | null;
      open_due_date: string | null;
      contract_amount: number;
      payment_progress: string;
      installment_amount: number | null;
      contract_note: string | null;
      contract_functionality: string | null;
      work_note: string | null;
      primary_contact: string | null;
      secondary_contact: string | null;
      primary_contact_name: string | null;
      secondary_contact_name: string | null;
    };
    client: {
      business_registration_number: string;
      name: string;
      address: string | null;
      ceo_name: string | null;
      business_type: string | null;
      business_item: string | null;
      login_id: string | null;
      login_password: string | null;
      note: string | null;
    };
    sites: Array<{
      id: string;
      brand_name: string | null;
      domain: string | null;
      solution: string | null;
      login_id: string | null;
      login_password: string | null;
      note: string | null;
    }>;
    contacts: Array<{
      name: string;
      phone: string | null;
      email: string | null;
      note: string | null;
    }>;
    clientAttachments: Array<{
      file_name: string | null;
      file_url: string;
      file_type: string;
    }>;
    contractAttachments: Array<{
      file_name: string;
      file_url: string;
      file_type: string;
    }>;
  };
}> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    const { data: contractRow, error: contractError } = await supabase
      .from("contract")
      .select(`
        id,
        client_id,
        site_id,
        contract_name,
        contract_date,
        contract_type_id,
        draft_due_date,
        demo_due_date,
        final_completion_date,
        open_due_date,
        contract_amount,
        payment_progress,
        installment_amount,
        contract_note,
        contract_functionality,
        work_note,
        primary_contact,
        secondary_contact,
        contract_type:contract_type_id ( name ),
        primary_contact_employee:primary_contact ( name ),
        secondary_contact_employee:secondary_contact ( name )
      `)
      .eq("id", contractId)
      .single();

    if (contractError || !contractRow) {
      return { success: false, error: "계약을 찾을 수 없습니다." };
    }

    const clientId = contractRow.client_id;
    const siteId = contractRow.site_id;

    const [clientRes, contactsRes, sitesRes, clientAttachRes, contractAttachRes] = await Promise.all([
      supabase.from("client").select("business_registration_number, name, address, ceo_name, business_type, business_item, login_id, login_password, note").eq("id", clientId).single(),
      supabase.from("client_contact").select("name, phone, email, note").eq("client_id", clientId).order("created_at", { ascending: true }),
      supabase.from("client_site").select("id, brand_name, domain, solution, login_id, login_password, note").eq("client_id", clientId).order("created_at", { ascending: true }),
      supabase.from("client_attachment").select("file_name, file_url, file_type").eq("client_id", clientId),
      supabase.from("contract_attachment").select("file_name, file_url, file_type").eq("contract_id", contractId),
    ]);

    const client = clientRes.data;
    if (!client) {
      return { success: false, error: "거래처 정보를 찾을 수 없습니다." };
    }

    const contractType = Array.isArray(contractRow.contract_type) ? contractRow.contract_type[0] : contractRow.contract_type;
    const primaryEmp = Array.isArray(contractRow.primary_contact_employee) ? contractRow.primary_contact_employee[0] : contractRow.primary_contact_employee;
    const secondaryEmp = Array.isArray(contractRow.secondary_contact_employee) ? contractRow.secondary_contact_employee[0] : contractRow.secondary_contact_employee;

    const detail = {
      contract: {
        id: contractRow.id,
        contract_type_id: contractRow.contract_type_id ?? "",
        contract_name: contractRow.contract_name,
        contract_date: contractRow.contract_date,
        contract_type_name: contractType?.name ?? "",
        draft_due_date: contractRow.draft_due_date ?? null,
        demo_due_date: contractRow.demo_due_date ?? null,
        final_completion_date: contractRow.final_completion_date ?? null,
        open_due_date: contractRow.open_due_date ?? null,
        contract_amount: Number(contractRow.contract_amount ?? 0),
        payment_progress: contractRow.payment_progress ?? "unpaid",
        installment_amount: contractRow.installment_amount != null ? Number(contractRow.installment_amount) : null,
        contract_note: contractRow.contract_note ?? null,
        contract_functionality: contractRow.contract_functionality ?? null,
        work_note: contractRow.work_note ?? null,
        primary_contact: contractRow.primary_contact ?? null,
        secondary_contact: contractRow.secondary_contact ?? null,
        primary_contact_name: primaryEmp?.name ?? null,
        secondary_contact_name: secondaryEmp?.name ?? null,
      },
      client: {
        business_registration_number: client.business_registration_number ?? "",
        name: client.name ?? "",
        address: client.address ?? null,
        ceo_name: client.ceo_name ?? null,
        business_type: client.business_type ?? null,
        business_item: client.business_item ?? null,
        login_id: client.login_id ?? null,
        login_password: client.login_password ?? null,
        note: client.note ?? null,
      },
      sites: (sitesRes.data ?? []).map((s: { id: string; brand_name: string | null; domain: string | null; solution: string | null; login_id: string | null; login_password: string | null; note: string | null }) => ({
        id: s.id,
        brand_name: s.brand_name ?? null,
        domain: s.domain ?? null,
        solution: s.solution ?? null,
        login_id: s.login_id ?? null,
        login_password: s.login_password ?? null,
        note: s.note ?? null,
      })),
      contacts: (contactsRes.data ?? []).map((c: { name: string; phone: string | null; email: string | null; note: string | null }) => ({
        name: c.name,
        phone: c.phone ?? null,
        email: c.email ?? null,
        note: c.note ?? null,
      })),
      clientAttachments: (clientAttachRes.data ?? []).map((a: { file_name: string | null; file_url: string; file_type: string }) => ({
        file_name: a.file_name ?? null,
        file_url: a.file_url,
        file_type: a.file_type,
      })),
      contractAttachments: (contractAttachRes.data ?? []).map((a: { file_name: string; file_url: string; file_type: string }) => ({
        file_name: a.file_name,
        file_url: a.file_url,
        file_type: a.file_type,
      })),
    };

    return { success: true, detail };
  } catch (error: any) {
    console.error("계약 상세 조회 오류:", error);
    return {
      success: false,
      error: error.message || "계약 상세 조회에 실패했습니다.",
    };
  }
}

/**
 * 계약 수정
 */
export async function updateContract(
  contractId: string,
  data: {
    contract_name: string;
    contract_date: string;
    contract_type_id: string;
    draft_due_date?: string | null;
    demo_due_date?: string | null;
    final_completion_date?: string | null;
    open_due_date?: string | null;
    contract_amount: number;
    payment_progress: "paid" | "installment" | "unpaid";
    installment_amount?: number | null;
    contract_note?: string | null;
    contract_functionality?: string | null;
    work_note?: string | null;
    primary_contact: string;
    secondary_contact?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase
      .from("contract")
      .update({
        contract_name: data.contract_name,
        contract_date: data.contract_date,
        contract_type_id: data.contract_type_id,
        draft_due_date: data.draft_due_date ?? null,
        demo_due_date: data.demo_due_date ?? null,
        final_completion_date: data.final_completion_date ?? null,
        open_due_date: data.open_due_date ?? null,
        contract_amount: data.contract_amount,
        payment_progress: data.payment_progress,
        installment_amount: data.installment_amount ?? null,
        contract_note: data.contract_note ?? null,
        contract_functionality: data.contract_functionality ?? null,
        work_note: data.work_note ?? null,
        primary_contact: data.primary_contact,
        secondary_contact: data.secondary_contact ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId);

    if (error) throw error;
    revalidatePath("/contracts");
    revalidatePath(`/contracts/${contractId}/edit`);
    return { success: true };
  } catch (error: any) {
    console.error("계약 수정 오류:", error);
    return {
      success: false,
      error: error.message || "계약 수정에 실패했습니다.",
    };
  }
}

/**
 * 파일 업로드 헬퍼 함수
 */
export async function uploadContractFile(
  file: File,
  fileType: "contract" | "estimate"
): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "contract-attachments");

    // 서버 사이드에서 실행 중이므로 절대 URL 필요
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    const response = await fetch(`${baseUrl}/api/files/upload`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error || "파일 업로드에 실패했습니다.",
      };
    }

    return {
      success: true,
      url: result.url,
    };
  } catch (error: any) {
    console.error("파일 업로드 오류:", error);
    return {
      success: false,
      error: error.message || "파일 업로드에 실패했습니다.",
    };
  }
}
