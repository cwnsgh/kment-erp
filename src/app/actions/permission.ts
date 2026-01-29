"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireAuth } from "@/lib/auth";

// 메뉴 권한 조회
export async function getMenuPermissions() {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("menu_permission")
      .select("*")
      .order("menu_key", { ascending: true })
      .order("employee_id", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("메뉴 권한 조회 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "메뉴 권한 조회에 실패했습니다.",
      data: [],
    };
  }
}

// 특정 메뉴의 권한 조회
export async function getMenuPermissionByKey(menuKey: string) {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("menu_permission")
      .select("*")
      .eq("menu_key", menuKey);

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("메뉴 권한 조회 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "메뉴 권한 조회에 실패했습니다.",
      data: [],
    };
  }
}

// 특정 직원의 메뉴 권한 조회
export async function getMenuPermissionByEmployeeId(employeeId: string) {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("menu_permission")
      .select("*")
      .eq("employee_id", employeeId);

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("직원 메뉴 권한 조회 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "직원 메뉴 권한 조회에 실패했습니다.",
      data: [],
    };
  }
}

// 메뉴 권한 저장 (여러 권한을 한번에 저장)
export async function saveMenuPermissions(
  permissions: Array<{ menuKey: string; employeeId: string; allowed: boolean }>
) {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    // 트랜잭션으로 처리
    const results = await Promise.all(
      permissions.map(async (perm) => {
        const { data, error } = await supabase
          .from("menu_permission")
          .upsert(
            {
              menu_key: perm.menuKey,
              employee_id: perm.employeeId,
              allowed: perm.allowed,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "menu_key,employee_id",
            }
          )
          .select();

        if (error) throw error;
        return data;
      })
    );

    return {
      success: true,
      data: results.flat(),
    };
  } catch (error) {
    console.error("메뉴 권한 저장 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "메뉴 권한 저장에 실패했습니다.",
    };
  }
}

// 모든 활성 직원 조회 (권한 설정용)
export async function getAllEmployeesForPermission() {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("employee")
      .select(`
        id,
        name,
        role_id,
        role:role_id (
          id,
          name,
          level
        )
      `)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;

    // role이 배열로 반환될 수 있으므로 단일 객체로 변환
    const transformedData = (data || []).map((employee: any) => ({
      ...employee,
      role: Array.isArray(employee.role) ? employee.role[0] : employee.role,
    }));

    return {
      success: true,
      data: transformedData,
    };
  } catch (error) {
    console.error("직원 조회 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "직원 조회에 실패했습니다.",
      data: [],
    };
  }
}

