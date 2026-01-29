-- 권한 상태 확인 및 강제 수정
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- ============================================
-- 1. 현재 권한 상태 확인
-- ============================================
-- menu_permission 테이블 권한 확인
SELECT 
  grantee, 
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'erp' 
  AND table_name = 'menu_permission' 
  AND grantee IN ('authenticated', 'service_role', 'anon')
ORDER BY grantee, privilege_type;

-- RLS 상태 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'erp' 
  AND tablename = 'menu_permission';

-- ============================================
-- 2. 권한 강제 부여 (소유자 권한으로)
-- ============================================
-- 테이블 소유자 확인
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'erp' 
  AND tablename = 'menu_permission';

-- 모든 권한 부여 (소유자가 실행해야 함)
GRANT ALL PRIVILEGES ON erp.menu_permission TO authenticated;
GRANT ALL PRIVILEGES ON erp.menu_permission TO service_role;

-- 또는 개별 권한 명시적으로 부여
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON erp.menu_permission TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON erp.menu_permission TO service_role;

-- ============================================
-- 3. RLS 완전히 비활성화
-- ============================================
ALTER TABLE erp.menu_permission DISABLE ROW LEVEL SECURITY;

-- 모든 정책 삭제
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'erp' AND tablename = 'menu_permission') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON erp.menu_permission';
    END LOOP;
END $$;

-- ============================================
-- 4. 최종 확인
-- ============================================
-- 권한 재확인
SELECT 
  grantee, 
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'erp' 
  AND table_name = 'menu_permission' 
  AND grantee = 'authenticated'
ORDER BY privilege_type;

-- RLS 상태 재확인
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'erp' 
  AND tablename = 'menu_permission';

