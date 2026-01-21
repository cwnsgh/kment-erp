-- 사업자등록번호 저장 형식을 10자리 숫자로 정규화
-- Supabase SQL Editor에서 실행하세요

UPDATE erp.client
SET business_registration_number = regexp_replace(business_registration_number, '\D', '', 'g')
WHERE business_registration_number IS NOT NULL;

