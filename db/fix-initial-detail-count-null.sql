-- initial_detail_*_count가 NULL인 유지보수형 행 보정 (현재 잔여를 초기값으로 채움)
-- Supabase SQL Editor에서 실행하세요.

UPDATE erp.managed_client
SET 
  initial_detail_text_edit_count = COALESCE(initial_detail_text_edit_count, COALESCE(detail_text_edit_count, 0)),
  initial_detail_coding_edit_count = COALESCE(initial_detail_coding_edit_count, COALESCE(detail_coding_edit_count, 0)),
  initial_detail_image_edit_count = COALESCE(initial_detail_image_edit_count, COALESCE(detail_image_edit_count, 0)),
  initial_detail_popup_design_count = COALESCE(initial_detail_popup_design_count, COALESCE(detail_popup_design_count, 0)),
  initial_detail_banner_design_count = COALESCE(initial_detail_banner_design_count, COALESCE(detail_banner_design_count, 0))
WHERE product_type1 = 'maintenance'
  AND (
    initial_detail_text_edit_count IS NULL
    OR initial_detail_coding_edit_count IS NULL
    OR initial_detail_image_edit_count IS NULL
    OR initial_detail_popup_design_count IS NULL
    OR initial_detail_banner_design_count IS NULL
  );
