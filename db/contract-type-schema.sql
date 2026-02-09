-- 계약 종목 및 작업 내용 관리 스키마
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- 계약 종목 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS erp.contract_type (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE, -- 계약 종목명 (예: 신규, 갱신, 추가, 이전, 개발, 유지보수, 기타)
  display_order integer DEFAULT 0, -- 표시 순서
  is_active boolean DEFAULT true, -- 활성화 여부
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 계약 종목별 작업 내용 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS erp.contract_type_work_content (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_type_id uuid REFERENCES erp.contract_type(id) ON DELETE CASCADE NOT NULL,
  work_content_name text NOT NULL, -- 작업 내용명 (예: PC 수정, 모바일 수정)
  display_order integer DEFAULT 0, -- 표시 순서
  is_active boolean DEFAULT true, -- 활성화 여부
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(contract_type_id, work_content_name) -- 같은 계약 종목에 동일한 작업 내용 중복 방지
);

-- ============================================
-- 인덱스 생성
-- ============================================

CREATE INDEX IF NOT EXISTS idx_contract_type_display_order ON erp.contract_type(display_order);
CREATE INDEX IF NOT EXISTS idx_contract_type_is_active ON erp.contract_type(is_active);
CREATE INDEX IF NOT EXISTS idx_contract_type_work_content_contract_type_id ON erp.contract_type_work_content(contract_type_id);
CREATE INDEX IF NOT EXISTS idx_contract_type_work_content_display_order ON erp.contract_type_work_content(display_order);
CREATE INDEX IF NOT EXISTS idx_contract_type_work_content_is_active ON erp.contract_type_work_content(is_active);

-- ============================================
-- 업데이트 트리거
-- ============================================

CREATE OR REPLACE FUNCTION update_contract_type_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contract_type_updated_at
  BEFORE UPDATE ON erp.contract_type
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_type_updated_at();

CREATE TRIGGER trigger_update_contract_type_work_content_updated_at
  BEFORE UPDATE ON erp.contract_type_work_content
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_type_updated_at();

-- ============================================
-- 초기 데이터 삽입 (기본 계약 종목)
-- ============================================

INSERT INTO erp.contract_type (name, display_order) VALUES
  ('신규', 1),
  ('갱신', 2),
  ('추가', 3),
  ('이전', 4),
  ('개발', 5),
  ('유지보수', 6),
  ('기타', 7)
ON CONFLICT (name) DO NOTHING;

-- 기본 작업 내용 삽입 (각 계약 종목에 PC 수정, 모바일 수정 추가)
DO $$
DECLARE
  type_record RECORD;
BEGIN
  FOR type_record IN SELECT id FROM erp.contract_type LOOP
    INSERT INTO erp.contract_type_work_content (contract_type_id, work_content_name, display_order)
    VALUES
      (type_record.id, 'PC 수정', 1),
      (type_record.id, '모바일 수정', 2)
    ON CONFLICT (contract_type_id, work_content_name) DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- RLS (Row Level Security) 정책 설정
-- ============================================

-- 개발 단계: RLS 비활성화 (인증 구현 후 활성화 예정)
-- ALTER TABLE erp.contract_type ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE erp.contract_type_work_content ENABLE ROW LEVEL SECURITY;

-- 인증 구현 후 아래 정책들을 활성화하세요:
-- CREATE POLICY "Authenticated users can view contract types" ON erp.contract_type
--   FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can manage contract types" ON erp.contract_type
--   FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can view work contents" ON erp.contract_type_work_content
--   FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can manage work contents" ON erp.contract_type_work_content
--   FOR ALL USING (auth.role() = 'authenticated');
