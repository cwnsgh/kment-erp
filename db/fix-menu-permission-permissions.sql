-- menu_permission 테이블 권한 수정
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 스키마 권한 확인 및 부여
GRANT USAGE ON SCHEMA erp TO authenticated;
GRANT USAGE ON SCHEMA erp TO service_role;
GRANT USAGE ON SCHEMA erp TO anon;

-- 테이블 권한 확인 및 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.menu_permission TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.menu_permission TO service_role;
GRANT SELECT ON erp.menu_permission TO anon;

-- 시퀀스 권한
GRANT USAGE ON ALL SEQUENCES IN SCHEMA erp TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA erp TO service_role;

-- RLS 비활성화 (간단한 방법, 권장)
ALTER TABLE erp.menu_permission DISABLE ROW LEVEL SECURITY;

-- 기존 RLS 정책이 있다면 삭제
DROP POLICY IF EXISTS "Allow authenticated users to access menu_permission" ON erp.menu_permission;
DROP POLICY IF EXISTS "Allow service_role full access to menu_permission" ON erp.menu_permission;

-- 확인
SELECT COUNT(*) FROM erp.menu_permission;

-- 권한 확인
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'erp' 
  AND table_name = 'menu_permission' 
  AND grantee IN ('authenticated', 'service_role');

