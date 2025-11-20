-- 직원 및 역할 관리 스키마
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- 역할 관리 (숫자로 권한 레벨 관리)
-- ============================================

CREATE TABLE IF NOT EXISTS erp.role (
  id serial PRIMARY KEY,
  level int UNIQUE NOT NULL, -- 권한 레벨 (1=사장, 2=과장, 3=대리, 4=주임, 5=프로)
  name text UNIQUE NOT NULL, -- 역할 이름
  description text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 직원 관리
-- ============================================

CREATE TABLE IF NOT EXISTS erp.employee (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL, -- 이메일 (로그인 ID)
  password_hash text NOT NULL, -- 비밀번호 해시
  name text NOT NULL, -- 이름
  phone text, -- 전화번호
  profile_image_url text, -- 프로필 이미지 URL
  role_id int REFERENCES erp.role(id), -- 역할 ID
  is_active boolean DEFAULT true, -- 활성 상태
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 회원가입 요청 승인 관리
-- ============================================

-- 거래처 테이블에 status 필드 추가 (회원가입 승인 상태)
ALTER TABLE erp.client 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- status 값:
-- 'pending': 승인 대기
-- 'approved': 승인됨 (로그인 가능)
-- 'rejected': 거절됨

-- 승인 이력 테이블
CREATE TABLE IF NOT EXISTS erp.signup_approval (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES erp.client(id) ON DELETE CASCADE,
  approved_by uuid REFERENCES erp.employee(id), -- 승인한 직원
  status text NOT NULL, -- 'approved' 또는 'rejected'
  reason text, -- 거절 사유 (거절 시)
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 인덱스 생성
-- ============================================

CREATE INDEX IF NOT EXISTS idx_employee_email ON erp.employee(email);
CREATE INDEX IF NOT EXISTS idx_employee_role_id ON erp.employee(role_id);
CREATE INDEX IF NOT EXISTS idx_employee_is_active ON erp.employee(is_active);
CREATE INDEX IF NOT EXISTS idx_client_status ON erp.client(status);
CREATE INDEX IF NOT EXISTS idx_signup_approval_client_id ON erp.signup_approval(client_id);
CREATE INDEX IF NOT EXISTS idx_role_level ON erp.role(level);

-- ============================================
-- 초기 역할 데이터 삽입
-- ============================================

INSERT INTO erp.role (level, name, description) VALUES
  (1, '사장', '최고 관리자'),
  (2, '과장', '과장급 관리자'),
  (3, '대리', '대리급 직원'),
  (4, '주임', '주임급 직원'),
  (5, '프로', '일반 직원')
ON CONFLICT (level) DO NOTHING;

-- ============================================
-- 권한 부여 (anon, authenticated)
-- ============================================

GRANT USAGE ON SCHEMA erp TO anon;
GRANT ALL ON SCHEMA erp TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA erp TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA erp TO anon;

GRANT USAGE ON SCHEMA erp TO authenticated;
GRANT ALL ON SCHEMA erp TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA erp TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA erp TO authenticated;

