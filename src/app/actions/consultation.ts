"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSession, requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ConsultationCategory = { id: string; name: string; sort_order: number };

/** 상담 구분(카테고리) 목록 */
export async function getConsultationCategories(): Promise<{
  success: boolean;
  data?: ConsultationCategory[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("consultation_category")
      .select("id, name, sort_order")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return { success: true, data: (data ?? []) as ConsultationCategory[] };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "카테고리 조회 실패", data: [] };
  }
}

export type CreateConsultationInput = {
  companyName: string;
  industry: string;
  brand: string;
  budget: string;
  generalRemarks: string;
  consultationDate: string;
  consultationContent: string;
  categoryIds: string[];
  contacts: Array<{ name: string; email: string; phone: string; note: string }>;
  sites: Array<{ brand: string; domain: string; solution: string; type: string }>;
  attachments: Array<{ fileUrl: string; fileName: string; fileSize?: number }>;
};

/** 상담 등록 */
export async function createConsultation(input: CreateConsultationInput): Promise<{
  success: boolean;
  id?: string;
  error?: string;
}> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    const { data: consultation, error: consultError } = await supabase
      .from("consultation")
      .insert({
        company_name: input.companyName?.trim() || "(미입력)",
        industry: input.industry.trim() || null,
        brand: input.brand.trim() || null,
        budget: input.budget.trim() || null,
        general_remarks: input.generalRemarks.trim() || null,
        consultation_date: input.consultationDate || null,
        consultation_content: input.consultationContent.trim() || null,
      })
      .select("id")
      .single();

    if (consultError || !consultation) {
      return { success: false, error: consultError?.message ?? "상담 등록 실패" };
    }

    const consultationId = consultation.id;

    if (input.contacts.length > 0) {
      const contactRows = input.contacts
        .filter((c) => c.name.trim() !== "")
        .map((c, i) => ({
          consultation_id: consultationId,
          name: c.name.trim(),
          email: c.email.trim() || null,
          phone: c.phone.trim() || null,
          note: c.note.trim() || null,
          sort_order: i,
        }));
      if (contactRows.length > 0) {
        const { error: contactError } = await supabase.from("consultation_contact").insert(contactRows);
        if (contactError) console.error("담당자 저장 오류:", contactError);
      }
    }

    if (input.sites.length > 0) {
      const siteRows = input.sites
        .filter((s) => s.brand?.trim() || s.domain?.trim())
        .map((s, i) => ({
          consultation_id: consultationId,
          brand: s.brand?.trim() || null,
          domain: s.domain?.trim() || null,
          solution: s.solution?.trim() || null,
          type: s.type?.trim() || null,
          sort_order: i,
        }));
      if (siteRows.length > 0) {
        const { error: siteError } = await supabase.from("consultation_site").insert(siteRows);
        if (siteError) console.error("사이트 저장 오류:", siteError);
      }
    }

    if (input.categoryIds.length > 0) {
      const categoryRows = input.categoryIds.map((category_id) => ({
        consultation_id: consultationId,
        category_id,
      }));
      const { error: catError } = await supabase.from("consultation_consultation_category").insert(categoryRows);
      if (catError) console.error("구분 저장 오류:", catError);
    }

    if (input.attachments.length > 0) {
      const attachRows = input.attachments.map((a) => ({
        consultation_id: consultationId,
        file_url: a.fileUrl,
        file_name: a.fileName || null,
        file_size: a.fileSize ?? null,
      }));
      const { error: attachError } = await supabase.from("consultation_attachment").insert(attachRows);
      if (attachError) console.error("첨부파일 저장 오류:", attachError);
    }

    revalidatePath("/consultation");
    revalidatePath("/consultation/new");
    return { success: true, id: consultationId };
  } catch (e: any) {
    console.error("상담 등록 오류:", e);
    return { success: false, error: e?.message ?? "상담 등록에 실패했습니다." };
  }
}
