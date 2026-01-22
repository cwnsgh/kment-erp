-- 업무 삭제 처리 (금액 복구 포함) - 직원만 가능
-- 실행 후 Supabase에 함수가 생성됩니다.

-- 기존 함수 삭제 (파라미터 이름 변경을 위해)
drop function if exists erp.delete_work_request(uuid, uuid);

-- 새 함수 생성
create or replace function erp.delete_work_request(
  p_work_request_id uuid,
  p_employee_id uuid
)
returns table (
  success boolean,
  error text,
  work_request_id uuid
)
language plpgsql
as $$
declare
  v_wr record;
  v_mc record;
  v_deducted numeric;
  v_remaining numeric;
  v_current_total numeric;
  v_restored_total numeric;
begin
  -- 업무 요청 조회 (직원은 모든 업무 삭제 가능)
  select *
    into v_wr
    from erp.work_request
   where id = p_work_request_id
   for update;

  if not found then
    return query select false, '업무 요청을 찾을 수 없습니다.', null;
    return;
  end if;

  -- 이미 삭제된 경우 체크 (status가 'deleted'인 경우)
  if v_wr.status = 'deleted' then
    return query select false, '이미 삭제된 업무입니다.', v_wr.id;
    return;
  end if;

  -- 금액차감형이고 승인된 경우에만 금액 복구
  if v_wr.work_type = 'deduct' 
     and v_wr.status = 'approved' 
     and v_wr.approval_deducted_amount is not null 
     and v_wr.approval_deducted_amount > 0
     and v_wr.managed_client_id is not null then
    
    -- 관리 고객 정보 조회
    select *
      into v_mc
      from erp.managed_client
     where id = v_wr.managed_client_id
     for update;
    
    if found then
      -- 차감된 금액
      v_deducted := v_wr.approval_deducted_amount;
      
      -- 현재 총 금액
      v_current_total := coalesce(v_mc.total_amount, 0);
      
      -- 복구된 총 금액 = 현재 금액 + 차감된 금액
      v_restored_total := v_current_total + v_deducted;
      
      -- managed_client의 total_amount 복구
      update erp.managed_client
         set total_amount = v_restored_total,
             updated_at = now()
       where id = v_wr.managed_client_id;
    end if;
  end if;

  -- work_request 상태를 'deleted'로 변경 (실제 삭제하지 않고 상태만 변경)
  update erp.work_request
     set status = 'deleted',
         updated_at = now()
   where id = v_wr.id;

  return query select true, null, v_wr.id;
end;
$$;

