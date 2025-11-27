type RequiredEnv = 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY' | 'PUBLIC_DATA_API_KEY';

export function getEnv(name: RequiredEnv): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`환경 변수 ${name}가 설정되지 않았습니다.`);
  }
  return value;
}












