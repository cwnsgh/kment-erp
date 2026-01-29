-- 기존 데이터의 is_active를 true로 업데이트
-- 이 파일을 Supabase SQL Editor에서 실행하세요

UPDATE erp.menu_structure 
SET is_active = true 
WHERE is_active IS NULL OR is_active = false;

-- 확인
SELECT COUNT(*) as total_count, 
       COUNT(*) FILTER (WHERE is_active = true) as active_count,
       COUNT(*) FILTER (WHERE is_active = false) as inactive_count,
       COUNT(*) FILTER (WHERE is_active IS NULL) as null_count
FROM erp.menu_structure;

