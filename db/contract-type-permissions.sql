-- 계약 종목 및 작업 내용 테이블 권한 설정
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- ============================================
-- 스키마 권한 확인 및 부여
-- ============================================
GRANT USAGE ON SCHEMA erp TO authenticated;
GRANT USAGE ON SCHEMA erp TO service_role;
GRANT USAGE ON SCHEMA erp TO anon;

-- ============================================
-- 계약 종목 테이블 권한
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.contract_type TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.contract_type TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.contract_type TO anon;

-- ============================================
-- 계약 종목별 작업 내용 테이블 권한
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.contract_type_work_content TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.contract_type_work_content TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.contract_type_work_content TO anon;

-- ============================================
-- 계약별 작업 내용 수정 횟수 테이블 권한
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.contract_work_content TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.contract_work_content TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.contract_work_content TO anon;

-- ============================================
-- 계약 테이블 권한 (이미 있을 수 있지만 확인)
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.contract TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.contract TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.contract TO anon;

-- ============================================
-- 계약 첨부파일 테이블 권한
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.contract_attachment TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.contract_attachment TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.contract_attachment TO anon;

-- ============================================
-- 시퀀스 권한
-- ============================================
GRANT USAGE ON ALL SEQUENCES IN SCHEMA erp TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA erp TO service_role;

-- ============================================
-- RLS 비활성화 (개발 단계)
-- ============================================
ALTER TABLE erp.contract_type DISABLE ROW LEVEL SECURITY;
ALTER TABLE erp.contract_type_work_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE erp.contract_work_content DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 권한 확인 쿼리 (실행 후 확인용)
-- ============================================
-- 아래 쿼리를 실행하여 권한이 제대로 부여되었는지 확인하세요:
/*
SELECT 
  grantee, 
  table_name,
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'erp' 
  AND table_name IN ('contract_type', 'contract_type_work_content', 'contract_work_content', 'contract', 'contract_attachment')
  AND grantee IN ('authenticated', 'service_role', 'anon')
ORDER BY table_name, grantee, privilege_type;
*/
