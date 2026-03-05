"use server";

import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { checkMenuPermission } from "@/app/actions/permission";
import { revalidatePath } from "next/cache";

/** 관리자 메모를 볼 수 있는지 (사장 role_id 1, 과장 이하 roleLevel<=2, 또는 staff-admin-memo 권한) */
export async function canViewStaffAdminMemo(): Promise<boolean> {
  const session = await getSession();
  if (!session || session.type !== "employee") return false;
  const emp = session as { roleId?: number | null; roleLevel?: number | null; id: string };
  if (emp.roleId === 1) return true;
  if (emp.roleLevel != null && emp.roleLevel <= 2) return true;
  return checkMenuPermission(emp.id, "staff-admin-memo", emp.roleId ?? null);
}

export type StaffListItem = {
  id: string;
  name: string;
  role_name: string | null;
  job_type: string | null;
  phone: string | null;
  contact_email: string | null;
  join_date: string | null;
  employment_status: string | null;
};

export type StaffDetail = {
  id: string;
  name: string;
  email: string;
  login_id: string | null;
  role_id: number | null;
  role_name: string | null;
  job_type: string | null;
  phone: string | null;
  contact_email: string | null;
  birth_date: string | null;
  join_date: string | null;
  leave_date: string | null;
  employment_status: string | null;
  leave_reason: string | null;
  profile_image_url: string | null;
  admin_memo: string | null;
  is_active: boolean;
};

/** 직원 목록 조회 (검색·페이지네이션) */
export async function getStaffList(params: {
  searchType?: "name" | "grade" | "work";
  searchKeyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  success: boolean;
  data?: StaffListItem[];
  total?: number;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(200, Math.max(10, params.pageSize ?? 10));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("employee")
      .select(
        `
        id,
        name,
        phone,
        contact_email,
        job_type,
        join_date,
        employment_status,
        role:role_id ( name )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    const keyword = (params.searchKeyword ?? "").trim();
    if (keyword && params.searchType) {
      if (params.searchType === "name") {
        query = query.ilike("name", `%${keyword}%`);
      } else if (params.searchType === "grade") {
        const roleId = Number(keyword);
        if (!Number.isNaN(roleId)) query = query.eq("role_id", roleId);
      } else if (params.searchType === "work") {
        query = query.ilike("job_type", `%${keyword}%`);
      }
    }

    const { data: rows, error, count } = await query.range(from, to);

    if (error) throw error;

    const list: StaffListItem[] = (rows ?? []).map((r: any) => {
      const role = Array.isArray(r.role) ? r.role[0] : r.role;
      return {
        id: r.id,
        name: r.name ?? "",
        role_name: role?.name ?? null,
        job_type: r.job_type ?? null,
        phone: r.phone ?? null,
        contact_email: r.contact_email ?? null,
        join_date: r.join_date ?? null,
        employment_status: r.employment_status ?? null,
      };
    });

    return { success: true, data: list, total: count ?? 0 };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "직원 목록 조회 실패" };
  }
}

/** 직급(role) 목록 - 직원 등록/수정 폼용 */
export async function getRoleOptions(): Promise<{ id: number; name: string }[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("role")
    .select("id, name")
    .order("level", { ascending: true });
  if (error) return [];
  return (data ?? []).map((r: { id: number; name: string }) => ({ id: r.id, name: r.name }));
}

/** 직원 상세 조회 (수정 폼용). 관리자 메모는 권한 있을 때만 포함 */
export async function getStaffById(id: string): Promise<{
  success: boolean;
  data?: StaffDetail;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const includeAdminMemo = await canViewStaffAdminMemo();

    const selectFields = includeAdminMemo
      ? `
        id, name, email, login_id, role_id, job_type, phone, contact_email,
        birth_date, join_date, leave_date, employment_status, leave_reason,
        profile_image_url, admin_memo, is_active,
        role:role_id ( name )
      `
      : `
        id, name, email, login_id, role_id, job_type, phone, contact_email,
        birth_date, join_date, leave_date, employment_status, leave_reason,
        profile_image_url, is_active,
        role:role_id ( name )
      `;

    const { data: row, error } = await supabase
      .from("employee")
      .select(selectFields)
      .eq("id", id)
      .single();

    if (error || !row) {
      return { success: false, error: error?.message ?? "직원을 찾을 수 없습니다." };
    }

    const role = Array.isArray((row as any).role) ? (row as any).role[0] : (row as any).role;
    const detail: StaffDetail = {
      id: row.id,
      name: row.name ?? "",
      email: row.email ?? "",
      login_id: row.login_id ?? null,
      role_id: row.role_id ?? null,
      role_name: role?.name ?? null,
      job_type: row.job_type ?? null,
      phone: row.phone ?? null,
      contact_email: row.contact_email ?? null,
      birth_date: row.birth_date ?? null,
      join_date: row.join_date ?? null,
      leave_date: row.leave_date ?? null,
      employment_status: row.employment_status ?? null,
      leave_reason: row.leave_reason ?? null,
      profile_image_url: row.profile_image_url ?? null,
      admin_memo: includeAdminMemo ? (row.admin_memo ?? null) : null,
      is_active: row.is_active ?? true,
    };

    return { success: true, data: detail };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "직원 조회 실패" };
  }
}

export type CreateStaffInput = {
  name: string;
  login_id: string;
  password: string;
  role_id: number | null;
  job_type: string | null;
  phone: string | null;
  contact_email: string | null;
  birth_date: string | null;
  join_date: string | null;
  leave_date: string | null;
  employment_status: string | null;
  leave_reason: string | null;
  profile_image_url: string | null;
  admin_memo: string | null;
};

/** 직원 등록. 로그인 ID는 email 컬럼에 저장(기존 로그인 호환) */
export async function createStaff(
  input: CreateStaffInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const loginId = (input.login_id ?? "").trim().toLowerCase();
    if (!loginId) return { success: false, error: "아이디를 입력해주세요." };
    if (!input.name?.trim()) return { success: false, error: "이름을 입력해주세요." };
    if (!input.password || input.password.length < 6) {
      return { success: false, error: "비밀번호는 6자 이상 입력해주세요." };
    }

    const supabase = await getSupabaseServerClient();

    const { data: existing } = await supabase
      .from("employee")
      .select("id")
      .eq("email", loginId)
      .maybeSingle();
    if (existing) return { success: false, error: "이미 사용 중인 아이디(이메일)입니다." };

    const password_hash = await bcrypt.hash(input.password, 10);

    const { data: inserted, error } = await supabase
      .from("employee")
      .insert({
        email: loginId,
        login_id: loginId,
        password_hash,
        name: input.name.trim(),
        phone: input.phone?.trim() || null,
        contact_email: input.contact_email?.trim() || null,
        role_id: input.role_id || null,
        job_type: input.job_type?.trim() || null,
        birth_date: input.birth_date || null,
        join_date: input.join_date || null,
        leave_date: input.leave_date || null,
        employment_status: input.employment_status || "employed",
        leave_reason: input.leave_reason?.trim() || null,
        profile_image_url: input.profile_image_url || null,
        admin_memo: input.admin_memo?.trim() || null,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) throw error;
    revalidatePath("/staff");
    return { success: true, id: inserted?.id };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "직원 등록에 실패했습니다." };
  }
}

export type UpdateStaffInput = {
  name?: string;
  role_id?: number | null;
  job_type?: string | null;
  phone?: string | null;
  contact_email?: string | null;
  birth_date?: string | null;
  join_date?: string | null;
  leave_date?: string | null;
  employment_status?: string | null;
  leave_reason?: string | null;
  profile_image_url?: string | null;
  admin_memo?: string | null;
  is_active?: boolean;
};

/** 비밀번호만 변경 (수정 화면에서 "변경" 버튼용) */
export async function updateStaffPassword(
  employeeId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "비밀번호는 6자 이상 입력해주세요." };
  }
  try {
    const supabase = await getSupabaseServerClient();
    const password_hash = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
      .from("employee")
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq("id", employeeId);
    if (error) throw error;
    revalidatePath("/staff");
    revalidatePath(`/staff/${employeeId}/edit`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "비밀번호 변경에 실패했습니다." };
  }
}

/** 직원 수정 */
export async function updateStaff(
  id: string,
  input: UpdateStaffInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const canEditMemo = await canViewStaffAdminMemo();

    const payload: Record<string, unknown> = {
      name: input.name?.trim() ?? undefined,
      role_id: input.role_id ?? undefined,
      job_type: input.job_type?.trim() || null,
      phone: input.phone?.trim() || null,
      contact_email: input.contact_email?.trim() || null,
      birth_date: input.birth_date || null,
      join_date: input.join_date || null,
      leave_date: input.leave_date || null,
      employment_status: input.employment_status ?? undefined,
      leave_reason: input.leave_reason?.trim() || null,
      profile_image_url: input.profile_image_url || null,
      is_active: input.is_active ?? undefined,
      updated_at: new Date().toISOString(),
    };
    if (canEditMemo && input.admin_memo !== undefined) {
      payload.admin_memo = input.admin_memo?.trim() || null;
    }

    const { error } = await supabase.from("employee").update(payload).eq("id", id);
    if (error) throw error;
    revalidatePath("/staff");
    revalidatePath(`/staff/${id}/edit`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "직원 수정에 실패했습니다." };
  }
}

/** 직원 비활성화(삭제). is_active = false, 퇴사 처리 */
export async function deactivateStaff(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("employee")
      .update({
        is_active: false,
        employment_status: "left",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/staff");
    revalidatePath(`/staff/${id}/edit`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "직원 비활성화에 실패했습니다." };
  }
}
