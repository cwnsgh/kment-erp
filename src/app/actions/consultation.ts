"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSession, requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ConsultationCategory = { id: string; name: string; sort_order: number };

export type ConsultationListItem = {
  id: string;
  company_name: string;
  industry: string | null;
  brand: string | null;
  consultation_date: string | null;
  created_at: string;
  category_names: string[];
};

/** 상담 목록 조회 */
export async function getConsultations(): Promise<{
  success: boolean;
  data?: ConsultationListItem[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: rows, error } = await supabase
      .from("consultation")
      .select(
        `
        id,
        company_name,
        industry,
        brand,
        consultation_date,
        created_at,
        consultation_consultation_category(
          consultation_category(name)
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    const list: ConsultationListItem[] = (rows ?? []).map((r: any) => {
      const categories = r.consultation_consultation_category ?? [];
      const category_names = categories
        .map((cc: { consultation_category?: { name: string } | null }) => cc?.consultation_category?.name)
        .filter(Boolean);
      return {
        id: r.id,
        company_name: r.company_name ?? "",
        industry: r.industry ?? null,
        brand: r.brand ?? null,
        consultation_date: r.consultation_date ?? null,
        created_at: r.created_at ?? "",
        category_names,
      };
    });

    return { success: true, data: list };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "상담 목록 조회 실패" };
  }
}

export type ConsultationDetail = {
  id: string;
  company_name: string;
  industry: string | null;
  brand: string | null;
  budget: string | null;
  general_remarks: string | null;
  consultation_date: string | null;
  consultation_content: string | null;
  created_at: string;
  category_names: string[];
  contacts: Array<{ name: string; email: string | null; phone: string | null; note: string | null }>;
  sites: Array<{ brand: string | null; domain: string | null; solution: string | null; type: string | null }>;
  attachments: Array<{ file_url: string; file_name: string | null; file_size: number | null }>;
};

/** 상담 상세 조회 (모달용) */
export async function getConsultationDetail(consultationId: string): Promise<{
  success: boolean;
  data?: ConsultationDetail;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: row, error } = await supabase
      .from("consultation")
      .select(
        `
        id,
        company_name,
        industry,
        brand,
        budget,
        general_remarks,
        consultation_date,
        consultation_content,
        created_at,
        consultation_contact(name, email, phone, note),
        consultation_site(brand, domain, solution, type),
        consultation_consultation_category(consultation_category(name)),
        consultation_attachment(file_url, file_name, file_size)
      `
      )
      .eq("id", consultationId)
      .single();

    if (error || !row) {
      return { success: false, error: error?.message ?? "상담을 찾을 수 없습니다." };
    }

    const categories = (row as any).consultation_consultation_category ?? [];
    const category_names = categories
      .map((cc: { consultation_category?: { name: string } | null }) => cc?.consultation_category?.name)
      .filter(Boolean);

    const detail: ConsultationDetail = {
      id: row.id,
      company_name: row.company_name ?? "",
      industry: row.industry ?? null,
      brand: row.brand ?? null,
      budget: row.budget ?? null,
      general_remarks: row.general_remarks ?? null,
      consultation_date: row.consultation_date ?? null,
      consultation_content: row.consultation_content ?? null,
      created_at: row.created_at ?? "",
      category_names,
      contacts: ((row as any).consultation_contact ?? []).map((c: any) => ({
        name: c.name ?? "",
        email: c.email ?? null,
        phone: c.phone ?? null,
        note: c.note ?? null,
      })),
      sites: ((row as any).consultation_site ?? []).map((s: any) => ({
        brand: s.brand ?? null,
        domain: s.domain ?? null,
        solution: s.solution ?? null,
        type: s.type ?? null,
      })),
      attachments: ((row as any).consultation_attachment ?? []).map((a: any) => ({
        file_url: a.file_url,
        file_name: a.file_name ?? null,
        file_size: a.file_size ?? null,
      })),
    };

    return { success: true, data: detail };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "상담 상세 조회 실패" };
  }
}

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
