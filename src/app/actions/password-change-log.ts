"use server";

import { getSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export type PasswordChangeLogRow = {
  id: string;
  created_at: string;
  actor_type: string;
  target_type: string;
  actor_employee_name: string | null;
  actor_employee_login_id: string | null;
  actor_client_name: string | null;
  actor_client_login_id: string | null;
  target_employee_name: string | null;
  target_client_name: string | null;
};

/**
 * 비밀번호 변경 이력 조회 (직원만 가능)
 */
export async function getPasswordChangeLogs(limit = 100) {
  const session = await getSession();
  if (!session || session.type !== "employee") {
    return { success: false, error: "권한이 없습니다.", logs: [] };
  }

  const supabase = await getSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("password_change_log")
    .select("id, created_at, actor_type, actor_employee_id, actor_client_id, target_type, target_employee_id, target_client_id")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      success: false,
      error: error.message,
      logs: [] as PasswordChangeLogRow[],
    };
  }

  const list = (rows ?? []) as Array<{
    id: string;
    created_at: string;
    actor_type: string;
    actor_employee_id: string | null;
    actor_client_id: string | null;
    target_type: string;
    target_employee_id: string | null;
    target_client_id: string | null;
  }>;

  const employeeIds = new Set<string>();
  const clientIds = new Set<string>();
  for (const r of list) {
    if (r.actor_employee_id) employeeIds.add(r.actor_employee_id);
    if (r.actor_client_id) clientIds.add(r.actor_client_id);
    if (r.target_employee_id) employeeIds.add(r.target_employee_id);
    if (r.target_client_id) clientIds.add(r.target_client_id);
  }

  const [employeeRows, clientRows] = await Promise.all([
    employeeIds.size > 0
      ? supabase.from("employee").select("id, name, email").in("id", [...employeeIds])
      : Promise.resolve({ data: [] as Array<{ id: string; name: string | null; email: string | null }> }),
    clientIds.size > 0
      ? supabase.from("client").select("id, name, login_id").in("id", [...clientIds])
      : Promise.resolve({ data: [] as Array<{ id: string; name: string | null; login_id: string | null }> }),
  ]);

  const empMap = new Map(
    (employeeRows.data ?? []).map((e) => [e.id, { name: e.name, login_id: e.email }])
  );
  const clientMap = new Map(
    (clientRows.data ?? []).map((c) => [c.id, { name: c.name, login_id: c.login_id }])
  );

  const logs: PasswordChangeLogRow[] = list.map((r) => {
    const eActor = r.actor_employee_id ? empMap.get(r.actor_employee_id) : null;
    const cActor = r.actor_client_id ? clientMap.get(r.actor_client_id) : null;
    const eTarget = r.target_employee_id ? empMap.get(r.target_employee_id) : null;
    const cTarget = r.target_client_id ? clientMap.get(r.target_client_id) : null;
    return {
      id: r.id,
      created_at: r.created_at,
      actor_type: r.actor_type,
      target_type: r.target_type,
      actor_employee_name: eActor?.name ?? null,
      actor_employee_login_id: eActor?.login_id ?? null,
      actor_client_name: cActor?.name ?? null,
      actor_client_login_id: cActor?.login_id ?? null,
      target_employee_name: eTarget?.name ?? null,
      target_client_name: cTarget?.name ?? null,
    };
  });

  return { success: true, logs };
}
