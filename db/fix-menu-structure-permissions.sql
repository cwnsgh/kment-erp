-- menu_structure 테이블 권한 수정
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 스키마 권한 확인 및 부여
GRANT USAGE ON SCHEMA erp TO authenticated;
GRANT USAGE ON SCHEMA erp TO service_role;
GRANT USAGE ON SCHEMA erp TO anon;

-- 테이블 권한 확인 및 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.menu_structure TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.menu_structure TO service_role;
GRANT SELECT ON erp.menu_structure TO anon;

-- 시퀀스 권한
GRANT USAGE ON ALL SEQUENCES IN SCHEMA erp TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA erp TO service_role;

-- RLS (Row Level Security) 처리 방법 2가지:

-- 방법 1: RLS 비활성화 (간단한 방법, 권장)
ALTER TABLE erp.menu_structure DISABLE ROW LEVEL SECURITY;

-- 방법 2: RLS 활성화 + 정책 추가 (더 안전한 방법)
-- 아래 주석을 해제하고 방법 1을 주석 처리하면 RLS를 사용할 수 있습니다
/*
ALTER TABLE erp.menu_structure ENABLE ROW LEVEL SECURITY;

-- authenticated 사용자는 모든 메뉴 구조를 볼 수 있도록 정책 추가
DROP POLICY IF EXISTS "Allow authenticated users to view menu_structure" ON erp.menu_structure;
CREATE POLICY "Allow authenticated users to view menu_structure"
  ON erp.menu_structure
  FOR SELECT
  TO authenticated
  USING (true);

-- service_role은 모든 권한
DROP POLICY IF EXISTS "Allow service_role full access to menu_structure" ON erp.menu_structure;
CREATE POLICY "Allow service_role full access to menu_structure"
  ON erp.menu_structure
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
*/

