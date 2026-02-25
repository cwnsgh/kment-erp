-- contract_type_work_content에 기본 수정 횟수 컬럼 추가
-- 작업내용관리에서 설정한 값이 새 계약에 해당 작업유형을 추가할 때 기본값으로 사용됨

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'erp'
      AND table_name = 'contract_type_work_content'
      AND column_name = 'default_modification_count'
  ) THEN
    ALTER TABLE erp.contract_type_work_content
      ADD COLUMN default_modification_count integer NOT NULL DEFAULT 0;
    COMMENT ON COLUMN erp.contract_type_work_content.default_modification_count IS '기본 수정 횟수 (계약에 해당 작업유형을 처음 추가할 때 사용)';
  END IF;
END $$;
