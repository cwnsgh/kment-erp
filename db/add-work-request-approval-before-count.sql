-- 승인 전 잔여 횟수 스냅샷 (유지보수형 승인 시 "승인 전" 표시용)
-- Supabase SQL Editor에서 실행 후 approve-work-request-transaction.sql 재실행

ALTER TABLE erp.work_request
ADD COLUMN IF NOT EXISTS approval_before_text_edit_count integer,
ADD COLUMN IF NOT EXISTS approval_before_coding_edit_count integer,
ADD COLUMN IF NOT EXISTS approval_before_image_edit_count integer,
ADD COLUMN IF NOT EXISTS approval_before_popup_design_count integer,
ADD COLUMN IF NOT EXISTS approval_before_banner_design_count integer;
