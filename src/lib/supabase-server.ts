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

