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
