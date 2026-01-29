"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { checkMenuPermission } from "@/app/actions/permission";
import { getMenuKeyFromPath } from "@/lib/menu-permission";

/**
 * 페이지에서 메뉴 권한을 체크하고, 권한이 없으면 리다이렉트
 * @param pathname - 현재 경로 (예: /contracts/new)
 * @returns 권한이 있으면 true, 없으면 리다이렉트
 */
export async function requireMenuPermission(pathname: string): Promise<void> {
  // 인증 확인
  const session = await requireAuth();
  
  // 관리자(role_id: 1)는 모든 메뉴 접근 가능
  if (session.roleId === 1) {
    return;
  }
  
  // 경로에서 menu_key 추출
  const menuKey = getMenuKeyFromPath(pathname);
  
  // menu_key가 없으면 권한 체크 불필요 (예: 대시보드)
  if (!menuKey) {
    return;
  }
  
  // 권한 확인
  const hasPermission = await checkMenuPermission(
    session.id,
    menuKey,
    session.roleId
  );
  
  // 권한이 없으면 대시보드로 리다이렉트
  if (!hasPermission) {
    redirect("/dashboard?error=permission_denied");
  }
}

