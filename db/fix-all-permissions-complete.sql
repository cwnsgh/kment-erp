-- 모든 권한 문제 해결 (한 번에 실행)
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- ============================================
-- 1. 스키마 권한
-- ============================================
GRANT USAGE ON SCHEMA erp TO authenticated;
GRANT USAGE ON SCHEMA erp TO service_role;
GRANT USAGE ON SCHEMA erp TO anon;

-- ============================================
-- 2. menu_structure 테이블 권한
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.menu_structure TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.menu_structure TO service_role;
GRANT SELECT ON erp.menu_structure TO anon;

-- RLS 비활성화
ALTER TABLE erp.menu_structure DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. menu_permission 테이블 권한
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.menu_permission TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.menu_permission TO service_role;
GRANT SELECT ON erp.menu_permission TO anon;

-- RLS 비활성화
ALTER TABLE erp.menu_permission DISABLE ROW LEVEL SECURITY;

-- 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Allow authenticated users to view menu_structure" ON erp.menu_structure;
DROP POLICY IF EXISTS "Allow service_role full access to menu_structure" ON erp.menu_structure;
DROP POLICY IF EXISTS "Allow authenticated users to access menu_permission" ON erp.menu_permission;
DROP POLICY IF EXISTS "Allow service_role full access to menu_permission" ON erp.menu_permission;

-- ============================================
-- 4. 시퀀스 권한
-- ============================================
GRANT USAGE ON ALL SEQUENCES IN SCHEMA erp TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA erp TO service_role;

-- ============================================
-- 5. 권한 확인
-- ============================================
-- menu_structure 권한 확인
SELECT 
  'menu_structure' as table_name,
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'erp' 
  AND table_name = 'menu_structure' 
  AND grantee IN ('authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- menu_permission 권한 확인
SELECT 
  'menu_permission' as table_name,
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'erp' 
  AND table_name = 'menu_permission' 
  AND grantee IN ('authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- RLS 상태 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'erp' 
  AND tablename IN ('menu_structure', 'menu_permission');

