"use server";

import { cache } from "react";
import { getSupabaseServerClient, getSupabaseStorageClient } from "@/lib/supabase-server";
import { requireAuth, type EmployeeSession } from "@/lib/auth";

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

// 메뉴 구조 캐싱 (변경 빈도가 낮으므로 캐싱)
const getMenuStructure = cache(async () => {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("menu_structure")
    .select("menu_key")
    .eq("is_active", true)
    .order("category_key", { ascending: true })
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data || [];
});

// 메뉴 구조 전체 조회 (캐싱 적용 - 메뉴 구조는 거의 변하지 않음)
export const getAllMenuStructure = cache(async () => {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from("menu_structure")
      .select("*")
      .eq("is_active", true)
      .order("category_key", { ascending: true })
      .order("display_order", { ascending: true });

    if (error) {
      console.error("메뉴 구조 조회 에러:", error);
      throw error;
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("메뉴 구조 조회 오류:", error);
    const errorMessage = error instanceof Error 
      ? error.message
      : "메뉴 구조 조회에 실패했습니다.";
    return {
      success: false,
      error: errorMessage,
      data: [],
    };
  }
});

// 특정 직원의 메뉴 권한 조회 (캐싱 적용)
export const getMenuPermissionByEmployeeId = cache(async (
  employeeId: string,
  roleId: number | null
) => {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();

    // 관리자(role_id: 1)는 모든 메뉴 접근 가능 - DB 조회 없이 즉시 반환
    if (roleId === 1) {
      const allMenus = await getMenuStructure();
      return {
        success: true,
        data: allMenus.map((menu) => ({
          menu_key: menu.menu_key,
          employee_id: employeeId,
          allowed: true,
        })),
      };
    }

    // 일반 직원은 권한 데이터 조회
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
});

// 특정 메뉴에 대한 접근 권한 확인 (roleId를 파라미터로 받아 불필요한 DB 조회 제거)
export async function checkMenuPermission(
  employeeId: string,
  menuKey: string,
  roleId: number | null
): Promise<boolean> {
  try {
    // 관리자(role_id: 1)는 모든 메뉴 접근 가능 - DB 조회 없이 즉시 반환
    if (roleId === 1) {
      return true;
    }

    const supabase = await getSupabaseServerClient();

    // 권한 확인
    const { data, error } = await supabase
      .from("menu_permission")
      .select("allowed")
      .eq("employee_id", employeeId)
      .eq("menu_key", menuKey)
      .single();

    if (error) {
      // 권한 데이터가 없으면 false 반환
      if (error.code === "PGRST116") {
        return false;
      }
      throw error;
    }

    return data?.allowed ?? false;
  } catch (error) {
    console.error("메뉴 권한 확인 오류:", error);
    return false;
  }
}

// 메뉴 권한 저장 (여러 권한을 한번에 저장)
export async function saveMenuPermissions(
  permissions: Array<{ menuKey: string; employeeId: string; allowed: boolean }>
) {
  try {
    await requireAuth();
    
    // 권한 문제 해결을 위해 Service Role Key 사용 (getSupabaseStorageClient 사용)
    // 이 클라이언트는 Service Role Key를 사용하므로 RLS를 우회할 수 있습니다
    const supabase = await getSupabaseStorageClient();

    console.log("권한 저장 시작, 개수:", permissions.length);

    // 트랜잭션으로 처리
    const results = await Promise.all(
      permissions.map(async (perm) => {
        try {
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

          if (error) {
            console.error(`권한 저장 오류 (${perm.menuKey}, ${perm.employeeId}):`, {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
            });
            throw error;
          }
          return data;
        } catch (error) {
          console.error(`개별 권한 저장 실패:`, perm, error);
          throw error;
        }
      })
    );

    console.log("권한 저장 성공");

    return {
      success: true,
      data: results.flat(),
    };
  } catch (error) {
    console.error("메뉴 권한 저장 오류:", error);
    const errorMessage = error instanceof Error 
      ? `${error.message}${error.cause ? ` (원인: ${error.cause})` : ''}`
      : "메뉴 권한 저장에 실패했습니다.";
    return {
      success: false,
      error: errorMessage,
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

