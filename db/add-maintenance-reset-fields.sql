-- 유지보수형 횟수 초기화 기능을 위한 필드 추가
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- 초기값 필드 추가 (유지보수형만)
-- ============================================

-- 영역 텍스트 수정 초기값
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'erp' 
    AND table_name = 'managed_client' 
    AND column_name = 'initial_detail_text_edit_count'
  ) THEN
    ALTER TABLE erp.managed_client ADD COLUMN initial_detail_text_edit_count integer;
  END IF;
END $$;

-- 코딩 수정 초기값
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'erp' 
    AND table_name = 'managed_client' 
    AND column_name = 'initial_detail_coding_edit_count'
  ) THEN
    ALTER TABLE erp.managed_client ADD COLUMN initial_detail_coding_edit_count integer;
  END IF;
END $$;

-- 기존 결과물 이미지 수정 초기값
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'erp' 
    AND table_name = 'managed_client' 
    AND column_name = 'initial_detail_image_edit_count'
  ) THEN
    ALTER TABLE erp.managed_client ADD COLUMN initial_detail_image_edit_count integer;
  END IF;
END $$;

-- 팝업 디자인 초기값
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'erp' 
    AND table_name = 'managed_client' 
    AND column_name = 'initial_detail_popup_design_count'
  ) THEN
    ALTER TABLE erp.managed_client ADD COLUMN initial_detail_popup_design_count integer;
  END IF;
END $$;

-- 배너 디자인 초기값
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'erp' 
    AND table_name = 'managed_client' 
    AND column_name = 'initial_detail_banner_design_count'
  ) THEN
    ALTER TABLE erp.managed_client ADD COLUMN initial_detail_banner_design_count integer;
  END IF;
END $$;

-- ============================================
-- 진행상황 시작일 필드 추가
-- ============================================

-- 진행상황이 "진행"으로 변경된 날짜 (초기화 기준일)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'erp' 
    AND table_name = 'managed_client' 
    AND column_name = 'progress_started_date'
  ) THEN
    ALTER TABLE erp.managed_client ADD COLUMN progress_started_date date;
  END IF;
END $$;

-- ============================================
-- 기존 데이터 초기값 설정 (유지보수형만)
-- ============================================

-- 기존 유지보수형 데이터의 현재 값을 초기값으로 설정
UPDATE erp.managed_client
SET 
  initial_detail_text_edit_count = COALESCE(detail_text_edit_count, 0),
  initial_detail_coding_edit_count = COALESCE(detail_coding_edit_count, 0),
  initial_detail_image_edit_count = COALESCE(detail_image_edit_count, 0),
  initial_detail_popup_design_count = COALESCE(detail_popup_design_count, 0),
  initial_detail_banner_design_count = COALESCE(detail_banner_design_count, 0)
WHERE product_type1 = 'maintenance'
  AND (
    initial_detail_text_edit_count IS NULL
    OR initial_detail_coding_edit_count IS NULL
    OR initial_detail_image_edit_count IS NULL
    OR initial_detail_popup_design_count IS NULL
    OR initial_detail_banner_design_count IS NULL
  );

-- 진행상황이 "진행"인 경우 progress_started_date 설정 (start_date 사용)
UPDATE erp.managed_client
SET progress_started_date = DATE(start_date)
WHERE status = 'ongoing'
  AND start_date IS NOT NULL
  AND progress_started_date IS NULL;

-- ============================================
-- 인덱스 생성
-- ============================================

CREATE INDEX IF NOT EXISTS idx_managed_client_progress_started_date 
ON erp.managed_client(progress_started_date) 
WHERE progress_started_date IS NOT NULL;

