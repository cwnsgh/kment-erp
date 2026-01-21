"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/auth";
import { formatBusinessNumber } from "@/lib/business-number";
import { revalidatePath } from "next/cache";

export interface SignupRequest {
  id: string;
  business_registration_number: string;
  name: string;
  ceo_name: string | null;
  address: string | null;
  address_detail: string | null;
  business_type: string | null;
  business_item: string | null;
  login_id: string | null;
  created_at: string;
  contacts: Array<{
    name: string;
    phone: string | null;
    email: string | null;
    title: string | null;
  }>;
  attachments: Array<{
    id: string;
    file_url: string;
    file_name: string | null;
    file_type: string;
  }>;
}

/**
 * 승인 대기 중인 회원가입 요청 목록 조회
 */
export async function getPendingSignupRequests(): Promise<{
  success: boolean;
  data?: SignupRequest[];
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session) {
      return {
        success: false,
        error: "인증이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    // pending 상태인 client 조회
    const { data: clients, error: clientsError } = await supabase
      .from("client")
      .select(
        "id, business_registration_number, name, ceo_name, address, address_detail, business_type, business_item, login_id, created_at"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (clientsError) throw clientsError;

    if (!clients || clients.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const clientIds = clients.map((client) => client.id);
    const [contactsResult, attachmentsResult] = await Promise.all([
      supabase
        .from("client_contact")
        .select("client_id, name, phone, email, title")
        .in("client_id", clientIds),
      supabase
        .from("client_attachment")
        .select("id, client_id, file_url, file_name, file_type")
        .in("client_id", clientIds),
    ]);

    if (contactsResult.error) throw contactsResult.error;
    if (attachmentsResult.error) throw attachmentsResult.error;

    const contactsByClientId = new Map<string, SignupRequest["contacts"]>();
    for (const contact of contactsResult.data || []) {
      const list = contactsByClientId.get(contact.client_id) || [];
      list.push({
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        title: contact.title,
      });
      contactsByClientId.set(contact.client_id, list);
    }

    const attachmentsByClientId = new Map<string, SignupRequest["attachments"]>();
    for (const attachment of attachmentsResult.data || []) {
      const list = attachmentsByClientId.get(attachment.client_id) || [];
      list.push({
        id: attachment.id,
        file_url: attachment.file_url,
        file_name: attachment.file_name,
        file_type: attachment.file_type,
      });
      attachmentsByClientId.set(attachment.client_id, list);
    }

    const requests: SignupRequest[] = clients.map((client) => ({
      id: client.id,
      business_registration_number: formatBusinessNumber(
        client.business_registration_number
      ),
      name: client.name,
      ceo_name: client.ceo_name,
      address: client.address,
      address_detail: client.address_detail,
      business_type: client.business_type,
      business_item: client.business_item,
      login_id: client.login_id,
      created_at: client.created_at,
      contacts: contactsByClientId.get(client.id) || [],
      attachments: attachmentsByClientId.get(client.id) || [],
    }));

    return {
      success: true,
      data: requests,
    };
  } catch (error) {
    console.error("승인 대기 목록 조회 오류:", error);
    return {
      success: false,
      error: "승인 대기 목록을 조회하는 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 회원가입 요청 승인
 */
export async function approveSignupRequest(clientId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session) {
      return {
        success: false,
        error: "인증이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    // client 상태를 approved로 변경
    const { error: updateError } = await supabase
      .from("client")
      .update({ status: "approved" })
      .eq("id", clientId);

    if (updateError) throw updateError;

    // 승인 이력 저장
    const { error: approvalError } = await supabase
      .from("signup_approval")
      .insert({
        client_id: clientId,
        approved_by: session.id,
        status: "approved",
      });

    if (approvalError) throw approvalError;

    revalidatePath("/staff/approvals");
    revalidatePath("/clients");

    return {
      success: true,
    };
  } catch (error) {
    console.error("승인 처리 오류:", error);
    return {
      success: false,
      error: "승인 처리 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 회원가입 요청 거절
 */
export async function rejectSignupRequest(
  clientId: string,
  reason: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session) {
      return {
        success: false,
        error: "인증이 필요합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    // client 상태를 rejected로 변경
    const { error: updateError } = await supabase
      .from("client")
      .update({ status: "rejected" })
      .eq("id", clientId);

    if (updateError) throw updateError;

    // 거절 이력 저장
    const { error: approvalError } = await supabase
      .from("signup_approval")
      .insert({
        client_id: clientId,
        approved_by: session.id,
        status: "rejected",
        reason: reason,
      });

    if (approvalError) throw approvalError;

    revalidatePath("/staff/approvals");
    revalidatePath("/clients");

    return {
      success: true,
    };
  } catch (error) {
    console.error("거절 처리 오류:", error);
    return {
      success: false,
      error: "거절 처리 중 오류가 발생했습니다.",
    };
  }
}



