-- 상담 관리 스키마 (상담 등록/조회)
-- Supabase SQL Editor에서 실행하세요.

-- ============================================
-- 상담 구분(카테고리) 마스터
-- ============================================
CREATE TABLE IF NOT EXISTS erp.consultation_category (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  sort_order int DEFAULT 0
);

INSERT INTO erp.consultation_category (name, sort_order) VALUES
  ('쇼핑몰', 1),
  ('홍대이지', 2),
  ('개발', 3),
  ('관리상품', 4),
  ('기타', 5)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 상담 메인 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS erp.consultation (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name text NOT NULL,        -- 상호(법인명)
  industry text,                     -- 업종
  brand text,                         -- 브랜드 (기본정보)
  budget text,                        -- 예산
  general_remarks text,               -- 비고 (전체)
  consultation_date date,             -- 상담일자
  consultation_content text,          -- 상담내용
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION erp.update_consultation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_consultation_updated_at ON erp.consultation;
CREATE TRIGGER trigger_consultation_updated_at
  BEFORE UPDATE ON erp.consultation
  FOR EACH ROW EXECUTE FUNCTION erp.update_consultation_updated_at();

-- ============================================
-- 상담 담당자 (1:N)
-- ============================================
CREATE TABLE IF NOT EXISTS erp.consultation_contact (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id uuid NOT NULL REFERENCES erp.consultation(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  note text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 상담 사이트 정보 (1:N)
-- ============================================
CREATE TABLE IF NOT EXISTS erp.consultation_site (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id uuid NOT NULL REFERENCES erp.consultation(id) ON DELETE CASCADE,
  brand text,
  domain text,
  solution text,   -- 솔루션 (드롭다운 값)
  type text,        -- 유형 (드롭다운 값)
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 상담 구분 N:M (상담 1건에 여러 구분)
-- ============================================
CREATE TABLE IF NOT EXISTS erp.consultation_consultation_category (
  consultation_id uuid NOT NULL REFERENCES erp.consultation(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES erp.consultation_category(id) ON DELETE CASCADE,
  PRIMARY KEY (consultation_id, category_id)
);

-- ============================================
-- 상담 첨부파일 (1:N)
-- ============================================
CREATE TABLE IF NOT EXISTS erp.consultation_attachment (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id uuid NOT NULL REFERENCES erp.consultation(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text,
  file_size bigint,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 인덱스
-- ============================================
CREATE INDEX IF NOT EXISTS idx_consultation_created_at ON erp.consultation(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultation_consultation_date ON erp.consultation(consultation_date DESC);
CREATE INDEX IF NOT EXISTS idx_consultation_contact_consultation_id ON erp.consultation_contact(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_site_consultation_id ON erp.consultation_site(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_attachment_consultation_id ON erp.consultation_attachment(consultation_id);

-- ============================================
-- 권한
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.consultation TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.consultation TO authenticated;
GRANT ALL ON erp.consultation TO service_role;
GRANT SELECT ON erp.consultation_category TO anon;
GRANT SELECT ON erp.consultation_category TO authenticated;
GRANT ALL ON erp.consultation_category TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.consultation_contact TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.consultation_contact TO authenticated;
GRANT ALL ON erp.consultation_contact TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.consultation_site TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.consultation_site TO authenticated;
GRANT ALL ON erp.consultation_site TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.consultation_consultation_category TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.consultation_consultation_category TO authenticated;
GRANT ALL ON erp.consultation_consultation_category TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.consultation_attachment TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.consultation_attachment TO authenticated;
GRANT ALL ON erp.consultation_attachment TO service_role;
