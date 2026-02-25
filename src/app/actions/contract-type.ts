"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============================================
// 계약 종목 관리
// ============================================

/**
 * 계약 종목 목록 조회
 */
export async function getContractTypes(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    display_order: number;
    is_active: boolean;
  }>;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("contract_type")
      .select("id, name, display_order, is_active")
      .order("display_order", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error: any) {
    console.error("계약 종목 조회 오류:", error);
    return {
      success: false,
      error: error.message || "계약 종목을 조회하는데 실패했습니다.",
    };
  }
}

/**
 * 활성화된 계약 종목만 조회
 */
export async function getActiveContractTypes(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    display_order: number;
  }>;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("contract_type")
      .select("id, name, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error: any) {
    console.error("활성 계약 종목 조회 오류:", error);
    return {
      success: false,
      error: error.message || "계약 종목을 조회하는데 실패했습니다.",
    };
  }
}

/**
 * 계약 종목 생성
 */
export async function createContractType(
  name: string,
  displayOrder: number
): Promise<{
  success: boolean;
  data?: { id: string };
  error?: string;
}> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("contract_type")
      .insert({
        name: name.trim(),
        display_order: displayOrder,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) throw error;
    if (!data) throw new Error("계약 종목 생성 실패");

    revalidatePath("/admin/work-content");
    return {
      success: true,
      data: { id: data.id },
    };
  } catch (error: any) {
    console.error("계약 종목 생성 오류:", error);
    return {
      success: false,
      error: error.message || "계약 종목을 생성하는데 실패했습니다.",
    };
  }
}

/**
 * 계약 종목 수정
 */
export async function updateContractType(
  id: string,
  name: string,
  displayOrder: number,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase
      .from("contract_type")
      .update({
        name: name.trim(),
        display_order: displayOrder,
        is_active: isActive,
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/work-content");
    return { success: true };
  } catch (error: any) {
    console.error("계약 종목 수정 오류:", error);
    return {
      success: false,
      error: error.message || "계약 종목을 수정하는데 실패했습니다.",
    };
  }
}

/**
 * 계약 종목 삭제
 */
export async function deleteContractType(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    // 계약에서 사용 중인지 확인
    const { data: contracts, error: checkError } = await supabase
      .from("contract")
      .select("id")
      .eq("contract_type_id", id)
      .limit(1);

    if (checkError) throw checkError;

    if (contracts && contracts.length > 0) {
      return {
        success: false,
        error: "사용 중인 계약 종목은 삭제할 수 없습니다.",
      };
    }

    const { error } = await supabase.from("contract_type").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/work-content");
    return { success: true };
  } catch (error: any) {
    console.error("계약 종목 삭제 오류:", error);
    return {
      success: false,
      error: error.message || "계약 종목을 삭제하는데 실패했습니다.",
    };
  }
}

// ============================================
// 작업 내용 관리
// ============================================

/**
 * 계약 종목별 작업 내용 조회
 */
export async function getWorkContentsByContractType(
  contractTypeId: string
): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    work_content_name: string;
    display_order: number;
    is_active: boolean;
    default_modification_count?: number | null;
  }>;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("contract_type_work_content")
      .select("id, work_content_name, display_order, is_active, default_modification_count")
      .eq("contract_type_id", contractTypeId)
      .order("display_order", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error: any) {
    console.error("작업 내용 조회 오류:", error);
    return {
      success: false,
      error: error.message || "작업 내용을 조회하는데 실패했습니다.",
    };
  }
}

/**
 * 활성화된 작업 내용만 조회
 */
export async function getActiveWorkContentsByContractType(
  contractTypeId: string
): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    work_content_name: string;
    display_order: number;
    default_modification_count?: number | null;
  }>;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("contract_type_work_content")
      .select("id, work_content_name, display_order, default_modification_count")
      .eq("contract_type_id", contractTypeId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error: any) {
    console.error("활성 작업 내용 조회 오류:", error);
    return {
      success: false,
      error: error.message || "작업 내용을 조회하는데 실패했습니다.",
    };
  }
}

/**
 * 작업 내용 생성
 */
export async function createWorkContent(
  contractTypeId: string,
  workContentName: string,
  displayOrder: number,
  defaultModificationCount: number = 0
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    const payload: Record<string, unknown> = {
      contract_type_id: contractTypeId,
      work_content_name: workContentName.trim(),
      display_order: displayOrder,
      is_active: true,
    };
    if (defaultModificationCount !== undefined && defaultModificationCount !== null) {
      payload.default_modification_count = Math.max(0, Math.floor(defaultModificationCount));
    }

    const { data, error } = await supabase
      .from("contract_type_work_content")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw error;
    if (!data) throw new Error("작업 내용 생성 실패");

    revalidatePath("/admin/work-content");
    return {
      success: true,
      data: { id: data.id },
    };
  } catch (error: any) {
    console.error("작업 내용 생성 오류:", error);
    return {
      success: false,
      error: error.message || "작업 내용을 생성하는데 실패했습니다.",
    };
  }
}

/**
 * 작업 내용 수정
 */
export async function updateWorkContent(
  id: string,
  workContentName: string,
  displayOrder: number,
  isActive: boolean,
  defaultModificationCount?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    const payload: Record<string, unknown> = {
      work_content_name: workContentName.trim(),
      display_order: displayOrder,
      is_active: isActive,
    };
    if (defaultModificationCount !== undefined && defaultModificationCount !== null) {
      payload.default_modification_count = Math.max(0, Math.floor(defaultModificationCount));
    }

    const { error } = await supabase
      .from("contract_type_work_content")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/work-content");
    return { success: true };
  } catch (error: any) {
    console.error("작업 내용 수정 오류:", error);
    return {
      success: false,
      error: error.message || "작업 내용을 수정하는데 실패했습니다.",
    };
  }
}

/**
 * 작업 내용 삭제
 */
export async function deleteWorkContent(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    // 계약에서 사용 중인지 확인
    const { data: contractWorkContents, error: checkError } = await supabase
      .from("contract_work_content")
      .select("id")
      .eq("work_content_id", id)
      .limit(1);

    if (checkError) throw checkError;

    if (contractWorkContents && contractWorkContents.length > 0) {
      return {
        success: false,
        error: "사용 중인 작업 내용은 삭제할 수 없습니다.",
      };
    }

    const { error } = await supabase
      .from("contract_type_work_content")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/work-content");
    return { success: true };
  } catch (error: any) {
    console.error("작업 내용 삭제 오류:", error);
    return {
      success: false,
      error: error.message || "작업 내용을 삭제하는데 실패했습니다.",
    };
  }
}
