"use server";

import bcrypt from "bcryptjs";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSession, requireAuth } from "@/lib/auth";
import { formatBusinessNumber, normalizeBusinessNumber } from "@/lib/business-number";
import { revalidatePath } from "next/cache";

function resolveBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

type ClientData = {
  businessRegistrationNumber: string;
  name: string;
  ceoName?: string;
  address?: string;
  addressDetail?: string;
  businessType?: string;
  businessItem?: string;
  loginId?: string;
  loginPassword?: string;
  note?: string;
  status?: string; // 휴·폐업 상태 (정상, 휴업, 폐업)
  contacts: Array<{
    name: string;
    phone?: string;
    email?: string;
    title?: string;
    note?: string;
  }>;
  sites: Array<{
    brandName?: string;
    domain?: string;
    solution?: string;
    loginId?: string;
    loginPassword?: string;
    note?: string;
  }>;
  attachments: Array<{
    fileUrl: string;
    fileName?: string;
    fileType: "business_registration" | "signature";
  }>;
};

export async function createClient(data: ClientData) {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();
    // 비밀번호 해싱 (있는 경우)
    let hashedPassword = data.loginPassword;
    if (data.loginPassword) {
      hashedPassword = await bcrypt.hash(data.loginPassword, 10);
    }

    // 1. 거래처 메인 정보 저장
    const { data: client, error: clientError } = await supabase
      .from("client")
      .insert({
        business_registration_number: normalizeBusinessNumber(
          data.businessRegistrationNumber
        ),
        name: data.name,
        ceo_name: data.ceoName,
        address: data.address,
        address_detail: data.addressDetail,
        business_type: data.businessType,
        business_item: data.businessItem,
        login_id: data.loginId,
        login_password: hashedPassword,
        status: "approved", // 관리자가 등록한 경우 바로 승인
        note: data.note,
      })
      .select()
      .single();

    if (clientError) throw clientError;
    if (!client) throw new Error("거래처 생성 실패");

    // 2. 담당자 정보 저장 (여러 명)
    if (data.contacts.length > 0) {
      const contactsData = data.contacts
        .filter((c) => c.name.trim() !== "") // 이름이 있는 것만
        .map((contact) => ({
          client_id: client.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          title: contact.title,
          note: contact.note,
        }));

      if (contactsData.length > 0) {
        const { error: contactsError } = await supabase
          .from("client_contact")
          .insert(contactsData);

        if (contactsError) throw contactsError;
      }
    }

    // 3. 사이트 정보 저장 (여러 개)
    if (data.sites.length > 0) {
      const sitesData = data.sites
        .filter((s) => s.brandName?.trim() || s.domain?.trim()) // 브랜드명이나 도메인이 있는 것만
        .map((site) => ({
          client_id: client.id,
          brand_name: site.brandName,
          domain: site.domain,
          solution: site.solution,
          login_id: site.loginId,
          login_password: site.loginPassword,
          note: site.note,
        }));

      if (sitesData.length > 0) {
        const { error: sitesError } = await supabase
          .from("client_site")
          .insert(sitesData);

        if (sitesError) throw sitesError;
      }
    }

    // 4. 첨부파일 저장
    if (data.attachments.length > 0) {
      const attachmentsData = data.attachments.map((attachment) => ({
        client_id: client.id,
        file_url: attachment.fileUrl,
        file_name: attachment.fileName,
        file_type: attachment.fileType,
      }));

      const { error: attachmentsError } = await supabase
        .from("client_attachment")
        .insert(attachmentsData);

      if (attachmentsError) throw attachmentsError;
    }

    revalidatePath("/clients");
    revalidatePath("/clients/new");

    return { success: true, clientId: client.id };
  } catch (error) {
    console.error("거래처 등록 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "거래처 등록에 실패했습니다.",
    };
  }
}

/**
 * 거래처 목록 조회
 */
export async function getClients() {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();
    const { data: clients, error } = await supabase
      .from("client")
      .select(
        "id, business_registration_number, name, ceo_name, status, created_at"
      )
      // status 필터 제거: 모든 상태의 거래처를 조회 (정상, 휴업, 폐업, 확인불가 등)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formattedClients =
      clients?.map((client) => ({
        ...client,
        business_registration_number: formatBusinessNumber(
          client.business_registration_number
        ),
      })) || [];

    return {
      success: true,
      clients: formattedClients,
    };
  } catch (error) {
    console.error("거래처 조회 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "거래처 조회에 실패했습니다.",
      clients: [],
    };
  }
}

/**
 * 거래처 상세 조회 (관련 테이블 포함)
 */
export async function getClientDetail(clientId: string) {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();
    // 1. 거래처 메인 정보
    const { data: client, error: clientError } = await supabase
      .from("client")
      .select(
        "id, login_id, business_registration_number, name, address, ceo_name, business_type, business_item, note, status"
      )
      .eq("id", clientId)
      .single();

    if (clientError) throw clientError;
    if (!client) throw new Error("거래처를 찾을 수 없습니다.");

    const [contactsResult, sitesResult, attachmentsResult] = await Promise.all([
      supabase
        .from("client_contact")
        .select("name, phone, email, note")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true }),
      supabase
        .from("client_site")
        .select("brand_name, solution, domain, login_id, login_password")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true }),
      supabase
        .from("client_attachment")
        .select("file_url, file_name, file_type")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true }),
    ]);

    if (contactsResult.error) throw contactsResult.error;
    if (sitesResult.error) throw sitesResult.error;
    if (attachmentsResult.error) throw attachmentsResult.error;

    const contacts = contactsResult.data;
    const sites = sitesResult.data;
    const attachments = attachmentsResult.data;

    // 비밀번호는 보안상 반환하지 않음 (필요시 별도 처리)
    const businessRegistrationAttachment = attachments?.find(
      (a) => a.file_type === "business_registration"
    );
    const signatureAttachment = attachments?.find(
      (a) => a.file_type === "signature"
    );

    const businessRegistrationFile =
      businessRegistrationAttachment?.file_name || "";
    const businessRegistrationFileUrl =
      businessRegistrationAttachment?.file_url || "";
    const signatureFile = signatureAttachment?.file_name || "";
    const signatureFileUrl = signatureAttachment?.file_url || "";

    // status 매핑 (DB의 status를 UI 상태로 변환)
    const statusMap: Record<string, "정상" | "휴업" | "폐업"> = {
      approved: "정상",
      suspended: "휴업",
      closed: "폐업",
    };

    return {
      success: true,
      client: {
        id: client.id,
        loginId: client.login_id || "",
        loginPassword: "", // 보안상 빈 문자열 반환
        businessRegistrationNumber: formatBusinessNumber(
          client.business_registration_number
        ),
        name: client.name,
        address: client.address || "",
        ceoName: client.ceo_name || "",
        businessType: client.business_type || "",
        businessItem: client.business_item || "",
        businessRegistrationFile,
        businessRegistrationFileUrl,
        signatureFile,
        signatureFileUrl,
        status: statusMap[client.status as string] || "정상",
        contacts:
          contacts?.map((c) => ({
            name: c.name,
            phone: c.phone || "",
            email: c.email || "",
            note: c.note || "",
          })) || [],
        sites:
          sites?.map((s) => ({
            brandName: s.brand_name || "",
            solution: s.solution || "",
            domain: s.domain || "",
            loginId: s.login_id || "",
            loginPassword: s.login_password || "",
            type: "", // DB에 type 필드가 없으면 빈 문자열
          })) || [],
        note: client.note || "",
      },
    };
  } catch (error) {
    console.error("거래처 상세 조회 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "거래처 상세 조회에 실패했습니다.",
      client: null,
    };
  }
}

/**
 * 거래처 수정
 */
export async function updateClient(clientId: string, data: ClientData) {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();
    // 비밀번호 해싱 (변경된 경우만)
    let hashedPassword = data.loginPassword;
    if (data.loginPassword && !data.loginPassword.startsWith("$2")) {
      hashedPassword = await bcrypt.hash(data.loginPassword, 10);
    }

    // status 매핑 (UI 상태를 DB 상태로 변환)
    const statusMap: Record<string, string> = {
      정상: "approved",
      휴업: "suspended",
      폐업: "closed",
    };
    const formDataObj = data as any;
    const dbStatus = statusMap[formDataObj.status] || "approved";

    // 1. 거래처 메인 정보 업데이트
    const { data: client, error: clientError } = await supabase
      .from("client")
      .update({
        business_registration_number: normalizeBusinessNumber(
          data.businessRegistrationNumber
        ),
        name: data.name,
        ceo_name: data.ceoName,
        address: data.address,
        address_detail: data.addressDetail,
        business_type: data.businessType,
        business_item: data.businessItem,
        login_id: data.loginId,
        login_password: hashedPassword,
        status: dbStatus,
        note: data.note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId)
      .select()
      .single();

    if (clientError) throw clientError;
    if (!client) throw new Error("거래처 수정 실패");

    // 2. 기존 담당자 정보 삭제 후 새로 추가
    await supabase.from("client_contact").delete().eq("client_id", clientId);

    if (data.contacts.length > 0) {
      const contactsData = data.contacts
        .filter((c) => c.name.trim() !== "")
        .map((contact) => ({
          client_id: clientId,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          title: contact.title,
          note: contact.note,
        }));

      if (contactsData.length > 0) {
        const { error: contactsError } = await supabase
          .from("client_contact")
          .insert(contactsData);
        if (contactsError) throw contactsError;
      }
    }

    // 3. 기존 사이트 정보 삭제 후 새로 추가
    await supabase.from("client_site").delete().eq("client_id", clientId);

    if (data.sites.length > 0) {
      const sitesData = data.sites
        .filter((s) => s.brandName?.trim() || s.domain?.trim())
        .map((site) => ({
          client_id: clientId,
          brand_name: site.brandName,
          domain: site.domain,
          solution: site.solution,
          login_id: site.loginId,
          login_password: site.loginPassword,
          note: site.note,
        }));

      if (sitesData.length > 0) {
        const { error: sitesError } = await supabase
          .from("client_site")
          .insert(sitesData);
        if (sitesError) throw sitesError;
      }
    }

    // 4. 첨부파일은 별도로 관리 (추가만, 삭제는 별도 처리 필요)
    if (data.attachments.length > 0) {
      const attachmentsData = data.attachments.map((attachment) => ({
        client_id: clientId,
        file_url: attachment.fileUrl,
        file_name: attachment.fileName,
        file_type: attachment.fileType,
      }));

      const { error: attachmentsError } = await supabase
        .from("client_attachment")
        .insert(attachmentsData);
      if (attachmentsError) throw attachmentsError;
    }

    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}/edit`);

    return { success: true, clientId: client.id };
  } catch (error) {
    console.error("거래처 수정 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "거래처 수정에 실패했습니다.",
    };
  }
}

type CheckBusinessRegistrationNumberResult =
  | {
      success: true;
      isDuplicate: false;
      message: string;
      businessStatus?: {
        status: string;
      };
    }
  | {
      success: false;
      isDuplicate: true;
      existingClient: { id: any; name: any };
      message: string;
    }
  | {
      success: false;
      isDuplicate: false;
      error: string;
    };

/**
 * 사업자등록번호 중복 확인 및 유효성 검증
 * 1. 먼저 사업자등록번호가 유효한지 API로 확인
 * 2. 그 다음 중복 여부 확인
 */
export async function checkBusinessRegistrationNumber(
  businessRegistrationNumber: string,
  excludeClientId?: string
): Promise<CheckBusinessRegistrationNumberResult> {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();
    // 1. 먼저 사업자등록번호가 유효한지 API로 확인
    const baseUrl = resolveBaseUrl();
    const normalized = normalizeBusinessNumber(businessRegistrationNumber);
    if (normalized.length !== 10) {
      return {
        success: false,
        isDuplicate: false,
        error: "사업자등록번호 형식이 올바르지 않습니다.",
      };
    }
    const formatted = formatBusinessNumber(normalized);

    let businessStatus: { status: string; statusText?: string } | undefined;
    
    try {
      const response = await fetch(`${baseUrl}/api/business/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessNumber: normalized,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          businessStatus = {
            status: result.status,
            statusText: result.statusText,
          };
        } else {
          // API 호출은 성공했지만 사업자등록번호를 확인할 수 없는 경우
          return {
            success: false,
            isDuplicate: false,
            error: result.error || "사업자등록번호를 확인할 수 없습니다.",
          };
        }
      } else {
        // API 호출 실패
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          isDuplicate: false,
          error: errorData.error || "사업자등록번호 유효성 검증에 실패했습니다.",
        };
      }
    } catch (apiError) {
      console.error("사업자등록번호 API 호출 오류:", apiError);
      return {
        success: false,
        isDuplicate: false,
        error: "사업자등록번호 유효성 검증 중 오류가 발생했습니다.",
      };
    }

    // 2. 유효한 사업자등록번호인 경우, 중복 여부 확인
    const candidates = Array.from(
      new Set([businessRegistrationNumber, normalized, formatted])
    );
    const orConditions = candidates
      .map((value) => `business_registration_number.eq.${value}`)
      .join(",");

    let query = supabase
      .from("client")
      .select("id, name")
      .or(orConditions);

    // 수정 시에는 현재 거래처는 제외
    if (excludeClientId) {
      query = query.neq("id", excludeClientId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;

    if (data) {
      return {
        success: false,
        isDuplicate: true,
        existingClient: data,
        message: `이미 등록된 사업자등록번호입니다. (거래처: ${data.name})`,
      };
    }

    // 유효하고 중복되지 않은 경우
    return {
      success: true,
      isDuplicate: false,
      message: "사용 가능한 사업자등록번호입니다.",
      businessStatus: businessStatus,
    };
  } catch (error) {
    console.error("사업자등록번호 중복 확인 오류:", error);
    return {
      success: false,
      isDuplicate: false,
      error:
        error instanceof Error
          ? error.message
          : "사업자등록번호 중복 확인 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 클라이언트 비밀번호 변경
 */
export async function changeClientPassword(data: {
  clientId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  try {
    const session = await getSession();
    if (!session || session.type !== "client" || session.id !== data.clientId) {
      return {
        success: false,
        error: "클라이언트 인증이 필요합니다.",
      };
    }

    if (data.newPassword !== data.confirmPassword) {
      return {
        success: false,
        error: "새 비밀번호가 일치하지 않습니다.",
      };
    }

    if (data.newPassword.length < 6) {
      return {
        success: false,
        error: "새 비밀번호는 최소 6자 이상이어야 합니다.",
      };
    }

    const supabase = await getSupabaseServerClient();

    const { data: client, error: fetchError } = await supabase
      .from("client")
      .select("login_password")
      .eq("id", data.clientId)
      .single();

    if (fetchError || !client) {
      return {
        success: false,
        error: "클라이언트 정보를 찾을 수 없습니다.",
      };
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      data.currentPassword,
      client.login_password
    );

    if (!isCurrentPasswordValid) {
      return {
        success: false,
        error: "현재 비밀번호가 올바르지 않습니다.",
      };
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    const { error: updateError } = await supabase
      .from("client")
      .update({
        login_password: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.clientId);

    if (updateError) {
      return {
        success: false,
        error: "비밀번호 변경에 실패했습니다.",
      };
    }

    return {
      success: true,
      message: "비밀번호가 성공적으로 변경되었습니다.",
    };
  } catch (error) {
    console.error("클라이언트 비밀번호 변경 오류:", error);
    return {
      success: false,
      error: "비밀번호 변경 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 거래처 사업자 상태 새로고침
 */
export async function refreshBusinessStatus(clientIds: string[] = []) {
  try {
    await requireAuth();
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from("client")
      .select("id, business_registration_number");

    // 특정 거래처만 조회하는 경우
    if (clientIds.length > 0) {
      query = query.in("id", clientIds);
    }

    const { data: clients, error } = await query;

    if (error) throw error;

    if (!clients || clients.length === 0) {
      return {
        success: true,
        message: "업데이트할 거래처가 없습니다.",
        updated: 0,
      };
    }

    // 사업자등록번호로 실제 상태를 조회하고 업데이트 (배치 호출)
    let updatedCount = 0;
    const baseUrl = resolveBaseUrl();

    const cleanedToClientMap = new Map<
      string,
      { id: string; businessNo: string }
    >();
    const businessNumbers = clients.map((client) => {
      const clean = normalizeBusinessNumber(client.business_registration_number);
      cleanedToClientMap.set(clean, {
        id: client.id,
        businessNo: client.business_registration_number,
      });
      return clean;
    });

    const response = await fetch(`${baseUrl}/api/business/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        businessNumbers,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "사업자등록번호 배치 검증 실패:",
        errorData.error || response.statusText
      );
      return {
        success: false,
        message:
          errorData.error || "사업자등록번호 배치 검증에 실패했습니다.",
        updated: 0,
      };
    }

    const result = await response.json();
    if (!result.success || !Array.isArray(result.results)) {
      console.error("사업자등록번호 배치 검증 실패:", result?.error);
      return {
        success: false,
        message:
          result?.error || "사업자등록번호 배치 검증에 실패했습니다.",
        updated: 0,
      };
    }

    const statusByBusinessNo = new Map<string, string>();
    for (const item of result.results) {
      const clean = String(item.businessNumber).replace(/-/g, "");
      statusByBusinessNo.set(clean, item.status);
    }

    for (const [cleanBusinessNo, meta] of cleanedToClientMap.entries()) {
      const dbStatus = statusByBusinessNo.get(cleanBusinessNo) || "unavailable";

      if (!["approved", "suspended", "closed", "unavailable"].includes(dbStatus)) {
        continue;
      }

      const { error: updateError } = await supabase
        .from("client")
        .update({ status: dbStatus })
        .eq("id", meta.id);

      if (updateError) {
        console.error(`거래처 ${meta.id} 상태 업데이트 실패:`, updateError);
        continue;
      }

      updatedCount++;
    }

    return {
      success: true,
      message: `총 ${updatedCount}건의 상태가 업데이트되었습니다.`,
      updated: updatedCount,
    };
  } catch (error) {
    console.error("상태 새로고침 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "상태 새로고침에 실패했습니다.",
      updated: 0,
    };
  }
}
