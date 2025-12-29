"use server";

import bcrypt from "bcryptjs";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

type ClientData = {
  businessRegistrationNumber: string;
  name: string;
  ceoName?: string;
  postalCode?: string;
  address?: string;
  addressDetail?: string;
  businessType?: string;
  businessItem?: string;
  loginId?: string;
  loginPassword?: string;
  note?: string;
  status?: string; // 휴·폐업 상태 (정상, 휴업, 폐업) - UI 상태
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
    type?: string;
    note?: string;
  }>;
  attachments: Array<{
    fileUrl: string;
    fileName?: string;
    fileType: "business_registration" | "signature";
  }>;
};

export async function createClient(data: ClientData) {
  const supabase = await getSupabaseServerClient();

  try {
    // 비밀번호 해싱 (있는 경우)
    let hashedPassword = data.loginPassword;
    if (data.loginPassword) {
      hashedPassword = await bcrypt.hash(data.loginPassword, 10);
    }

    // status 매핑 (UI 상태를 DB 상태로 변환)
    const statusMap: Record<string, string> = {
      정상: "approved",
      휴업: "suspended",
      폐업: "closed",
    };
    const dbStatus = data.status
      ? statusMap[data.status] || "approved"
      : "approved";

    // 1. 거래처 메인 정보 저장
    const { data: client, error: clientError } = await supabase
      .from("client")
      .insert({
        business_registration_number: data.businessRegistrationNumber,
        name: data.name,
        ceo_name: data.ceoName,
        postal_code: data.postalCode,
        address: data.address,
        address_detail: data.addressDetail,
        business_type: data.businessType,
        business_item: data.businessItem,
        login_id: data.loginId,
        login_password: hashedPassword,
        status: dbStatus, // API에서 가져온 상태 또는 기본값
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
          type: site.type,
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
  const supabase = await getSupabaseServerClient();

  try {
    const { data: clients, error } = await supabase
      .from("client")
      .select(
        "id, business_registration_number, name, ceo_name, status, created_at"
      )
      .in("status", ["approved", "suspended", "closed"]) // 승인된 거래처만 조회 (정상, 휴업, 폐업)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      clients: clients || [],
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
  const supabase = await getSupabaseServerClient();

  try {
    // 1. 거래처 메인 정보
    const { data: client, error: clientError } = await supabase
      .from("client")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError) throw clientError;
    if (!client) throw new Error("거래처를 찾을 수 없습니다.");

    // 2. 담당자 정보
    const { data: contacts, error: contactsError } = await supabase
      .from("client_contact")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    if (contactsError) throw contactsError;

    // 3. 사이트 정보
    const { data: sites, error: sitesError } = await supabase
      .from("client_site")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    if (sitesError) throw sitesError;

    // 4. 첨부파일 정보
    const { data: attachments, error: attachmentsError } = await supabase
      .from("client_attachment")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    if (attachmentsError) throw attachmentsError;

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
        businessRegistrationNumber: client.business_registration_number,
        name: client.name,
        postalCode: client.postal_code || "",
        address: client.address || "",
        addressDetail: client.address_detail || "",
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
            type: s.type || "",
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
  const supabase = await getSupabaseServerClient();

  try {
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
        business_registration_number: data.businessRegistrationNumber,
        name: data.name,
        ceo_name: data.ceoName,
        postal_code: data.postalCode,
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
          type: site.type,
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

/**
 * 사업자등록번호 중복 확인 및 상태 확인
 */
export async function checkBusinessRegistrationNumber(
  businessRegistrationNumber: string,
  excludeClientId?: string
) {
  const supabase = await getSupabaseServerClient();

  try {
    // 1. DB에서 중복 확인
    let query = supabase
      .from("client")
      .select("id, name")
      .eq("business_registration_number", businessRegistrationNumber);

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

    // 2. 국세청 API로 상태 확인 (내부 API Route 사용)
    let businessStatus: {
      status: "approved" | "suspended" | "closed";
      statusText: string;
    } | null = null;

    try {
      // 내부 API Route 호출 (서버 사이드이므로 절대 URL 필요)
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        "http://localhost:3000";

      const verifyResponse = await fetch(`${baseUrl}/api/business/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessNumber: businessRegistrationNumber,
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({
          error: `HTTP ${verifyResponse.status}: ${verifyResponse.statusText}`,
        }));
        return {
          success: false,
          isDuplicate: false,
          error: errorData.error || "사업자등록번호 확인에 실패했습니다.",
          businessStatus: null,
        };
      }

      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        businessStatus = {
          status: verifyData.status,
          statusText: verifyData.statusText,
        };
      } else {
        return {
          success: false,
          isDuplicate: false,
          error: verifyData.error || "사업자등록번호를 확인할 수 없습니다.",
          businessStatus: null,
        };
      }
    } catch (statusError) {
      // API 호출 실패 시 에러 반환
      console.error("사업자 상태 확인 오류:", statusError);
      return {
        success: false,
        isDuplicate: false,
        error: `사업자등록번호 확인 중 오류가 발생했습니다: ${
          statusError instanceof Error ? statusError.message : "알 수 없는 오류"
        }`,
        businessStatus: null,
      };
    }

    // businessStatus가 null이면 API 호출이 실패한 것
    if (!businessStatus) {
      return {
        success: false,
        isDuplicate: false,
        error: "사업자등록번호 상태를 확인할 수 없습니다. 다시 시도해주세요.",
        businessStatus: null,
      };
    }

    return {
      success: true,
      isDuplicate: false,
      message: "사용 가능한 사업자등록번호입니다.",
      businessStatus, // 상태 정보 포함
    };
  } catch (error) {
    console.error("중복 확인 오류:", error);
    return {
      success: false,
      isDuplicate: false,
      error:
        error instanceof Error ? error.message : "중복 확인에 실패했습니다.",
    };
  }
}

/**
 * 거래처 상태 일괄 새로고침 (국세청 API 사용)
 * @param clientIds - 새로고침할 거래처 ID 배열 (빈 배열이면 전체)
 */
export async function refreshBusinessStatus(clientIds: string[] = []) {
  const supabase = await getSupabaseServerClient();

  try {
    // 1. 거래처 목록 조회 (승인된 거래처만 - pending, rejected는 제외)
    let query = supabase
      .from("client")
      .select("id, business_registration_number, status")
      .in("status", ["approved", "suspended", "closed"]); // 승인된 거래처만 (승인 상태)

    if (clientIds.length > 0) {
      query = query.in("id", clientIds);
    }

    const { data: clients, error: clientsError } = await query;

    if (clientsError) throw clientsError;
    if (!clients || clients.length === 0) {
      return {
        success: true,
        message: "새로고침할 거래처가 없습니다.",
        updated: 0,
        failed: 0,
      };
    }

    // 2. 사업자등록번호 수집 (하이픈 제거)
    const businessNumbers = clients.map((c) =>
      c.business_registration_number.replace(/-/g, "")
    );

    // 3. 국세청 API 호출 (100개씩 배치 처리)
    const batchSize = 100;
    const batches: string[][] = [];
    for (let i = 0; i < businessNumbers.length; i += batchSize) {
      batches.push(businessNumbers.slice(i, i + batchSize));
    }

    let totalUpdated = 0;
    let totalFailed = 0;
    const updateResults: Array<{
      clientId: string;
      oldStatus: string;
      newStatus: string;
      success: boolean;
    }> = [];

    // 내부 API Route 호출 (배치 처리)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";

    for (const batch of batches) {
      try {
        const verifyResponse = await fetch(`${baseUrl}/api/business/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            businessNumbers: batch,
          }),
        });

        if (!verifyResponse.ok) {
          console.error(`배치 API 호출 실패: ${verifyResponse.status}`);
          totalFailed += batch.length;
          continue;
        }

        const verifyData = await verifyResponse.json();

        if (verifyData.success && verifyData.results) {
          // 4. API 응답과 거래처 매칭하여 상태 업데이트
          // API Route에서 이미 매핑된 상태를 반환하므로 그대로 사용
          for (const result of verifyData.results) {
            const businessNumber = result.businessNumber;
            const newBusinessStatus = result.status; // 이미 "approved", "suspended", "closed" 형식

            // 해당 사업자등록번호를 가진 거래처 찾기
            const client = clients.find(
              (c) =>
                c.business_registration_number.replace(/-/g, "") ===
                businessNumber
            );

            if (client) {
              const oldStatus = client.status;

              // 승인 상태 확인: approved, suspended, closed만 휴·폐업 상태 업데이트 가능
              // pending, rejected는 승인 상태이므로 건드리지 않음
              const isApprovedStatus = [
                "approved",
                "suspended",
                "closed",
              ].includes(oldStatus);

              if (!isApprovedStatus) {
                // 승인되지 않은 거래처는 건너뛰기
                console.log(
                  `거래처 ${client.id}는 승인되지 않아 상태를 업데이트하지 않습니다. (현재 상태: ${oldStatus})`
                );
                continue;
              }

              // 휴·폐업 상태가 변경된 경우만 업데이트
              // 예: approved → suspended (정상에서 휴업으로)
              // 예: suspended → approved (휴업에서 정상으로)
              // 예: approved → closed (정상에서 폐업으로)
              if (oldStatus !== newBusinessStatus) {
                const { error: updateError } = await supabase
                  .from("client")
                  .update({
                    status: newBusinessStatus,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", client.id);

                if (updateError) {
                  console.error(
                    `거래처 ${client.id} 업데이트 실패:`,
                    updateError
                  );
                  totalFailed++;
                  updateResults.push({
                    clientId: client.id,
                    oldStatus,
                    newStatus: newBusinessStatus,
                    success: false,
                  });
                } else {
                  totalUpdated++;
                  updateResults.push({
                    clientId: client.id,
                    oldStatus,
                    newStatus: newBusinessStatus,
                    success: true,
                  });
                }
              }
            }
          }
        }
      } catch (batchError) {
        console.error("배치 처리 오류:", batchError);
        totalFailed += batch.length;
      }
    }

    // 5. 캐시 재검증
    revalidatePath("/clients");

    return {
      success: true,
      message: `총 ${totalUpdated}건의 상태가 업데이트되었습니다.`,
      updated: totalUpdated,
      failed: totalFailed,
      results: updateResults,
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
      failed: 0,
    };
  }
}
