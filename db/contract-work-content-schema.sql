-- 계약별 작업 내용 및 수정 횟수 관리 스키마
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- 계약별 작업 내용 수정 횟수 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS erp.contract_work_content (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id uuid REFERENCES erp.contract(id) ON DELETE CASCADE NOT NULL,
  work_content_id uuid REFERENCES erp.contract_type_work_content(id) ON DELETE RESTRICT NOT NULL,
  modification_count integer DEFAULT 0, -- 수정 횟수
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(contract_id, work_content_id) -- 같은 계약에 동일한 작업 내용 중복 방지
);

-- ============================================
-- 인덱스 생성
-- ============================================

CREATE INDEX IF NOT EXISTS idx_contract_work_content_contract_id ON erp.contract_work_content(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_work_content_work_content_id ON erp.contract_work_content(work_content_id);

-- ============================================
-- 업데이트 트리거
-- ============================================

CREATE OR REPLACE FUNCTION update_contract_work_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contract_work_content_updated_at
  BEFORE UPDATE ON erp.contract_work_content
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_work_content_updated_at();

-- ============================================
-- RLS (Row Level Security) 정책 설정
-- ============================================

-- 개발 단계: RLS 비활성화 (인증 구현 후 활성화 예정)
-- ALTER TABLE erp.contract_work_content ENABLE ROW LEVEL SECURITY;

-- 인증 구현 후 아래 정책들을 활성화하세요:
-- CREATE POLICY "Authenticated users can view contract work contents" ON erp.contract_work_content
--   FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can manage contract work contents" ON erp.contract_work_content
--   FOR ALL USING (auth.role() = 'authenticated');
