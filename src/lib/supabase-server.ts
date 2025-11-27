import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { getEnv } from './env';

/**
 * 서버 사이드에서 사용하는 Supabase 클라이언트
 * Server Actions나 API Routes에서 사용
 */
export async function getSupabaseServerClient() {
  const client = createSupabaseClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      db: {
        schema: 'erp', // 기본 스키마를 erp로 설정
      },
    }
  );
  
  return client;
}

/**
 * Storage 업로드용 Supabase 클라이언트 (Service Role Key 사용)
 * 서버 사이드에서만 사용하며, Storage 권한 문제를 피하기 위해 사용
 */
export async function getSupabaseStorageClient() {
  // Service Role Key가 있으면 사용, 없으면 anon key 사용
  // service_role 또는 SUPABASE_SERVICE_ROLE_KEY 둘 다 지원
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.service_role;
  const key = serviceRoleKey || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  const client = createSupabaseClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    key,
    {
      db: {
        schema: 'erp',
      },
    }
  );
  
  return client;
}

