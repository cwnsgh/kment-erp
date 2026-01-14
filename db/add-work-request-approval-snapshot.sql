-- work_request 테이블에 승인 시점 스냅샷 필드 추가
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- 승인 시점 스냅샷 필드 추가
-- ============================================

-- 금액차감형 승인 시점 정보
ALTER TABLE erp.work_request
ADD COLUMN IF NOT EXISTS approval_deducted_amount numeric,  -- 승인 시점의 차감 금액 (cost)
ADD COLUMN IF NOT EXISTS approval_remaining_amount numeric; -- 승인 시점의 잔여 금액

-- 유지보수형 승인 시점 정보
ALTER TABLE erp.work_request
ADD COLUMN IF NOT EXISTS approval_text_edit_count integer,
ADD COLUMN IF NOT EXISTS approval_coding_edit_count integer,
ADD COLUMN IF NOT EXISTS approval_image_edit_count integer,
ADD COLUMN IF NOT EXISTS approval_popup_design_count integer,
ADD COLUMN IF NOT EXISTS approval_banner_design_count integer;

-- ============================================
-- 인덱스 추가 (선택사항)
-- ============================================

-- 승인 시점 정보 검색을 위한 인덱스 (필요시)
-- CREATE INDEX IF NOT EXISTS idx_work_request_approved_at ON erp.work_request(approved_at);
-- CREATE INDEX IF NOT EXISTS idx_work_request_approved_by ON erp.work_request(approved_by);



