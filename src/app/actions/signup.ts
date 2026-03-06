"use server";

import bcrypt from "bcryptjs";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { normalizeBusinessNumber } from "@/lib/business-number";

type SignupData = {
  username: string;
  password: string;
  businessNumber: string;
  companyName: string;
  ceoName?: string;
  address?: string;
  addressDetail?: string;
  businessType?: string;
  businessItem?: string;
  contacts: Array<{
    name: string;
    phone?: string;
    email?: string;
    title?: string;
  }>;
  sites: Array<{
    brandName?: string;
    domain?: string;
    solution?: string;
    loginId?: string;
    loginPassword?: string;
    type?: string;
  }>;
  businessRegistrationFileUrl?: string;
  businessRegistrationFileName?: string;
  signatureFileUrl?: string;
  signatureFileName?: string;
};

/**
 * 회원가입 요청 처리
 * 사업자 회원가입은 거래처 등록과 동일한 구조로 저장
 */
export async function signup(data: SignupData) {
  const supabase = await getSupabaseServerClient();
  const normalizedBiz = normalizeBusinessNumber(data.businessNumber);

  try {
    // 거절된 건이 있으면 재신청(갱신) 처리
    const { data: existingClient } = await supabase
      .from("client")
      .select("id, login_id, status")
      .eq("business_registration_number", normalizedBiz)
      .maybeSingle();

    if (existingClient?.status === "rejected") {
      const trimmedUsername = data.username.trim();
      const { data: otherClient } = await supabase
        .from("client")
        .select("id")
        .eq("login_id", trimmedUsername)
        .neq("id", existingClient.id)
        .maybeSingle();
      if (otherClient) {
        return {
          success: false,
          error: "이미 다른 거래처에서 사용 중인 아이디입니다.",
        };
      }
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const { error: updateError } = await supabase
        .from("client")
        .update({
          name: data.companyName,
          ceo_name: data.ceoName,
          address: data.address,
          address_detail: data.addressDetail,
          business_type: data.businessType,
          business_item: data.businessItem,
          login_id: data.username.trim(),
          login_password: hashedPassword,
          status: "pending",
          note: "회원가입 요청(재신청)",
        })
        .eq("id", existingClient.id);
      if (updateError) throw updateError;

      await supabase.from("client_contact").delete().eq("client_id", existingClient.id);
      await supabase.from("client_site").delete().eq("client_id", existingClient.id);
      await supabase.from("client_attachment").delete().eq("client_id", existingClient.id);

      const client = { id: existingClient.id };

      if (data.contacts.length > 0) {
        const contactsData = data.contacts
          .filter((c) => c.name?.trim() !== "")
          .map((contact) => ({
            client_id: client.id,
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            title: contact.title,
          }));
        if (contactsData.length > 0) {
          await supabase.from("client_contact").insert(contactsData);
        }
      }
      if (data.sites?.length) {
        const sitesData = data.sites
          .filter((s) => s.brandName?.trim() || s.domain?.trim())
          .map((site) => ({
            client_id: client.id,
            brand_name: site.brandName,
            domain: site.domain,
            solution: site.solution,
            login_id: site.loginId,
            login_password: site.loginPassword,
            type: site.type,
          }));
        if (sitesData.length > 0) {
          await supabase.from("client_site").insert(sitesData);
        }
      }
      const attachments: { client_id: string; file_url: string; file_name: string | null; file_type: string }[] = [];
      if (data.businessRegistrationFileUrl) {
        attachments.push({
          client_id: client.id,
          file_url: data.businessRegistrationFileUrl,
          file_name: data.businessRegistrationFileName ?? null,
          file_type: "business_registration",
        });
      }
      if (data.signatureFileUrl) {
        attachments.push({
          client_id: client.id,
          file_url: data.signatureFileUrl,
          file_name: data.signatureFileName ?? null,
          file_type: "signature",
        });
      }
      if (attachments.length > 0) {
        await supabase.from("client_attachment").insert(attachments);
      }
      return { success: true, clientId: client.id };
    }

    if (existingClient) {
      return {
        success: false,
        error: "이미 등록된 사업자등록번호입니다.",
      };
    }

    const { checkBusinessNumber, checkUsername } = await import("./signup-validation");
    const businessNumberCheck = await checkBusinessNumber(data.businessNumber);
    if (!businessNumberCheck.available) {
      return {
        success: false,
        error:
          businessNumberCheck.message ||
          "사업자등록번호가 이미 등록되어 있습니다.",
      };
    }

    const usernameCheck = await checkUsername(data.username);
    if (!usernameCheck.available) {
      return {
        success: false,
        error: usernameCheck.message || "아이디가 이미 사용 중입니다.",
      };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const { data: client, error: clientError } = await supabase
      .from("client")
      .insert({
        business_registration_number: normalizedBiz,
        name: data.companyName,
        ceo_name: data.ceoName,
        address: data.address,
        address_detail: data.addressDetail,
        business_type: data.businessType,
        business_item: data.businessItem,
        login_id: data.username,
        login_password: hashedPassword,
        status: "pending",
        note: "회원가입 요청",
      })
      .select()
      .single();

    if (clientError) {
      if (clientError.code === "23505") {
        if (clientError.message.includes("business_registration_number")) {
          return { success: false, error: "이미 등록된 사업자등록번호입니다." };
        }
        if (clientError.message.includes("login_id")) {
          return { success: false, error: "이미 사용 중인 아이디입니다." };
        }
      }
      throw clientError;
    }
    if (!client) throw new Error("회원가입 요청 생성 실패");

    // 2. 담당자 정보 저장
    if (data.contacts.length > 0) {
      const contactsData = data.contacts
        .filter((c) => c.name.trim() !== "")
        .map((contact) => ({
          client_id: client.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          title: contact.title,
        }));

      if (contactsData.length > 0) {
        const { error: contactsError } = await supabase
          .from("client_contact")
          .insert(contactsData);

        if (contactsError) throw contactsError;
      }
    }

    // 3. 사이트 정보 저장 (여러 개)
    if (data.sites && data.sites.length > 0) {
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
        }));

      if (sitesData.length > 0) {
        const { error: sitesError } = await supabase
          .from("client_site")
          .insert(sitesData);

        if (sitesError) throw sitesError;
      }
    }

    // 4. 첨부파일 저장
    const attachments = [];
    if (data.businessRegistrationFileUrl) {
      attachments.push({
        client_id: client.id,
        file_url: data.businessRegistrationFileUrl,
        file_name: data.businessRegistrationFileName,
        file_type: "business_registration",
      });
    }
    if (data.signatureFileUrl) {
      attachments.push({
        client_id: client.id,
        file_url: data.signatureFileUrl,
        file_name: data.signatureFileName,
        file_type: "signature",
      });
    }

    if (attachments.length > 0) {
      const { error: attachmentsError } = await supabase
        .from("client_attachment")
        .insert(attachments);

      if (attachmentsError) throw attachmentsError;
    }

    return { success: true, clientId: client.id };
  } catch (error) {
    console.error("회원가입 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "회원가입에 실패했습니다.",
    };
  }
}
