-- 누락된 메뉴 확인
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 전체 메뉴 개수 확인
SELECT COUNT(*) as total_count FROM erp.menu_structure WHERE is_active = true;

-- 카테고리별 메뉴 개수 확인
SELECT category_key, category_name, COUNT(*) as menu_count
FROM erp.menu_structure
WHERE is_active = true
GROUP BY category_key, category_name
ORDER BY category_key;

-- 예상되는 메뉴 목록과 비교
-- 거래처 관리: 2개
-- 상담 관리: 2개
-- 계약 관리: 4개
-- 일정 관리: 2개
-- 관리 업무: 4개
-- 직원 관리: 3개
-- 연차 관리: 2개
-- 관리자 페이지: 4개
-- 총 23개 (아, 맞네요! 24개가 아니라 23개입니다)

-- 모든 메뉴 목록 확인
SELECT category_key, category_name, menu_key, menu_name, is_active
FROM erp.menu_structure
WHERE is_active = true
ORDER BY category_key, display_order;

