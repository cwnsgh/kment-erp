-- menu_structure 테이블의 RLS 비활성화 (가장 간단한 해결책)
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- RLS 비활성화
ALTER TABLE erp.menu_structure DISABLE ROW LEVEL SECURITY;

-- 확인
SELECT COUNT(*) FROM erp.menu_structure WHERE is_active = true;

