-- notification 테이블의 type 제약조건 수정
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- 기존 제약조건 제거
-- ============================================

-- 기존 CHECK 제약조건 찾기 및 제거
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    -- notification_type_check 제약조건 찾기
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'erp.notification'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%type%';
    
    -- 제약조건이 있으면 제거
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE erp.notification DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END IF;
END $$;

-- ============================================
-- 새로운 제약조건 추가 (work_started, work_completed 포함)
-- ============================================

ALTER TABLE erp.notification 
ADD CONSTRAINT notification_type_check 
CHECK (type = ANY (ARRAY[
    'work_approved'::text, 
    'work_rejected'::text, 
    'work_requested'::text,
    'work_started'::text,
    'work_completed'::text
]));

-- ============================================
-- notification 테이블의 title 필드 NULL 허용 (선택사항)
-- ============================================

-- 코드에서 title을 설정하지 않는 경우가 있으므로 NULL 허용으로 변경
ALTER TABLE erp.notification 
ALTER COLUMN title DROP NOT NULL;

