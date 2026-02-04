-- 관리고객 목록 성능 개선용 VIEW
-- Supabase SQL Editor에서 실행하세요

DROP VIEW IF EXISTS erp.managed_client_view;

CREATE OR REPLACE VIEW erp.managed_client_view AS
SELECT
  mc.id,
  mc.client_id,
  c.name AS client_name,
  mc.product_type1,
  mc.product_type2,
  mc.total_amount,
  mc.initial_total_amount,
  mc.payment_status,
  mc.start_date,
  mc.end_date,
  mc.status,
  mc.detail_text_edit_count,
  mc.detail_coding_edit_count,
  mc.detail_image_edit_count,
  mc.detail_popup_design_count,
  mc.detail_banner_design_count,
  mc.note,
  CASE
    WHEN mc.end_date IS NOT NULL THEN mc.end_date
    WHEN mc.start_date IS NULL THEN NULL
    WHEN mc.product_type1 = 'deduct' AND mc.product_type2 ~ '^[0-9]+' THEN
      mc.start_date + make_interval(
        months => regexp_replace(mc.product_type2, '[^0-9]', '', 'g')::int
      )
    WHEN mc.product_type1 = 'maintenance' THEN mc.start_date + interval '1 year'
    ELSE mc.start_date
  END AS computed_end_date,
  CASE
    WHEN mc.status IS NOT NULL THEN mc.status
    WHEN mc.payment_status = 'unpaid' THEN 'unpaid'
    WHEN (
      (mc.end_date IS NOT NULL AND mc.end_date < now()) OR
      (
        mc.end_date IS NULL AND mc.start_date IS NOT NULL AND (
          (
            mc.product_type1 = 'deduct' AND mc.product_type2 ~ '^[0-9]+' AND
            (mc.start_date + make_interval(
              months => regexp_replace(mc.product_type2, '[^0-9]', '', 'g')::int
            )) < now()
          ) OR
          (mc.product_type1 = 'maintenance' AND (mc.start_date + interval '1 year') < now())
        )
      ) OR
      (mc.product_type1 = 'deduct' AND mc.total_amount IS NOT NULL AND mc.total_amount = 0)
    ) THEN 'end'
    WHEN mc.start_date IS NOT NULL THEN 'ongoing'
    ELSE 'wait'
  END AS computed_status,
  mc.created_at
FROM erp.managed_client mc
LEFT JOIN erp.client c ON c.id = mc.client_id;

GRANT SELECT ON erp.managed_client_view TO anon;
GRANT SELECT ON erp.managed_client_view TO authenticated;
GRANT SELECT ON erp.managed_client_view TO service_role;

