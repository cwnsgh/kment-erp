-- KMENT ERP 전용 스키마 생성
-- Supabase SQL Editor에서 실행하세요

-- 1. 새 스키마 생성 (이미 있으면 무시)
CREATE SCHEMA IF NOT EXISTS erp;

-- 2. 스키마 사용 권한 설정 (Supabase는 자동으로 처리하지만 명시적으로 설정)
GRANT USAGE ON SCHEMA erp TO authenticated;
GRANT ALL ON SCHEMA erp TO authenticated;

-- 3. 기본 확장 기능 활성화 (UUID 생성 등)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 거래처 관리
-- ============================================

-- 거래처 메인 테이블
CREATE TABLE IF NOT EXISTS erp.client (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_registration_number text UNIQUE NOT NULL, -- 사업자등록번호
  name text NOT NULL, -- 상호(법인명)
  ceo_name text, -- 대표자
  address text, -- 사업자 주소
  address_detail text, -- 상세 주소
  business_type text, -- 업태
  business_item text, -- 종목
  login_id text, -- 아이디
  login_password text, -- 패스워드
  note text, -- 비고
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 거래처 첨부파일 테이블 (사업자등록증, 서명 등)
CREATE TABLE IF NOT EXISTS erp.client_attachment (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES erp.client(id) ON DELETE CASCADE,
  file_url text NOT NULL, -- 파일 URL (Supabase Storage)
  file_name text, -- 원본 파일명
  file_type text NOT NULL, -- 'business_registration' (사업자등록증), 'signature' (서명)
  created_at timestamptz DEFAULT now()
);

-- 거래처 담당자 테이블 (1:N 관계, 여러 명 추가 가능)
CREATE TABLE IF NOT EXISTS erp.client_contact (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES erp.client(id) ON DELETE CASCADE,
  name text NOT NULL, -- 이름
  phone text, -- 연락처
  email text, -- 이메일
  title text, -- 직책
  note text, -- 비고 
  created_at timestamptz DEFAULT now()
);

-- 거래처 사이트 정보 테이블 (1:N 관계, 여러 개 추가 가능)
CREATE TABLE IF NOT EXISTS erp.client_site (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES erp.client(id) ON DELETE CASCADE,
  brand_name text, -- 브랜드명
  domain text, -- 도메인
  solution text, -- 솔루션
  login_id text, -- 아이디
  login_password text, -- 패스워드
  note text, -- 비고
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_client_business_number ON erp.client(business_registration_number);
CREATE INDEX IF NOT EXISTS idx_client_attachment_client_id ON erp.client_attachment(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contact_client_id ON erp.client_contact(client_id);
CREATE INDEX IF NOT EXISTS idx_client_site_client_id ON erp.client_site(client_id);

-- ============================================
-- RLS (Row Level Security) 정책 설정
-- ============================================

-- 개발 단계: RLS 비활성화 (인증 구현 후 활성화 예정)
-- ALTER TABLE erp.client ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE erp.client_attachment ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE erp.client_contact ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE erp.client_site ENABLE ROW LEVEL SECURITY;

-- 인증 구현 후 아래 정책들을 활성화하세요:
-- CREATE POLICY "Authenticated users can view clients" ON erp.client
--   FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can insert clients" ON erp.client
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can update clients" ON erp.client
--   FOR UPDATE USING (auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can delete clients" ON erp.client
--   FOR DELETE USING (auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can manage attachments" ON erp.client_attachment
--   FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can manage contacts" ON erp.client_contact
--   FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can manage sites" ON erp.client_site
--   FOR ALL USING (auth.role() = 'authenticated');
