'use server';

import bcrypt from 'bcryptjs';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

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
    fileType: 'business_registration' | 'signature';
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

    // 1. 거래처 메인 정보 저장
    const { data: client, error: clientError } = await supabase
      .from('client')
      .insert({
        business_registration_number: data.businessRegistrationNumber,
        name: data.name,
        ceo_name: data.ceoName,
        address: data.address,
        address_detail: data.addressDetail,
        business_type: data.businessType,
        business_item: data.businessItem,
        login_id: data.loginId,
        login_password: hashedPassword,
        status: 'approved', // 관리자가 등록한 경우 바로 승인
        note: data.note,
      })
      .select()
      .single();

    if (clientError) throw clientError;
    if (!client) throw new Error('거래처 생성 실패');

    // 2. 담당자 정보 저장 (여러 명)
    if (data.contacts.length > 0) {
      const contactsData = data.contacts
        .filter((c) => c.name.trim() !== '') // 이름이 있는 것만
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
          .from('client_contact')
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
          .from('client_site')
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
        .from('client_attachment')
        .insert(attachmentsData);

      if (attachmentsError) throw attachmentsError;
    }

    revalidatePath('/clients');
    revalidatePath('/clients/new');

    return { success: true, clientId: client.id };
  } catch (error) {
    console.error('거래처 등록 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '거래처 등록에 실패했습니다.',
    };
  }
}

