# 직원 계정 생성 가이드

SQL Editor에서 직원 계정을 생성하는 방법을 안내합니다.

## 📋 사전 준비

1. **필수 스키마 실행 확인**
   - `employee-schema.sql` 실행 완료
   - `add-employee-login-id.sql` 실행 완료

2. **역할(role) 확인**
   ```sql
   SELECT id, level, name FROM erp.role ORDER BY level;
   ```
   - 레벨 1: 사장
   - 레벨 2: 과장
   - 레벨 3: 대리
   - 레벨 4: 주임
   - 레벨 5: 프로

## 🔐 비밀번호 해시 생성 방법

### 방법 1: Node.js 스크립트 사용 (권장)

```bash
# 프로젝트 루트에서 실행
npx tsx scripts/generate-password-hash.ts password123
```

출력 예시:
```
✅ 비밀번호 해시 생성 완료!

원본 비밀번호: password123
해시값: $2a$10$IdwZNAPaLdpp7EexPB8aCeag3NZe99wdmIIZVLB7fzu7WdIeFlXsy

📋 SQL에 사용할 수 있는 형식:
'$2a$10$IdwZNAPaLdpp7EexPB8aCeag3NZe99wdmIIZVLB7fzu7WdIeFlXsy'
```

### 방법 2: 온라인 bcrypt 생성기 사용

- https://bcrypt-generator.com/
- Rounds: 10
- 생성된 해시값을 복사하여 사용

### 방법 3: 기존 해시값 재사용 (테스트용)

⚠️ **주의**: 프로덕션에서는 절대 사용하지 마세요!

아래 해시값은 모두 `password123`의 해시입니다:
```
$2a$10$IdwZNAPaLdpp7EexPB8aCeag3NZe99wdmIIZVLB7fzu7WdIeFlXsy
```

## 📝 SQL 예시

### 예시 1: 단일 직원 생성

```sql
INSERT INTO erp.employee (login_id, email, password_hash, name, phone, role_id, is_active)
VALUES (
  'honggildong',                    -- login_id (로그인 아이디)
  'hong@kment.co.kr',               -- email
  '$2a$10$IdwZNAPaLdpp7EexPB8aCeag3NZe99wdmIIZVLB7fzu7WdIeFlXsy',  -- 비밀번호 해시
  '홍길동',                          -- name
  '010-1234-5678',                  -- phone
  (SELECT id FROM erp.role WHERE level = 3 LIMIT 1),  -- role_id (3=대리)
  true                               -- is_active
)
ON CONFLICT (login_id) DO UPDATE
SET 
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  role_id = EXCLUDED.role_id,
  is_active = true,
  updated_at = now();
```

### 예시 2: 여러 직원 한번에 생성

```sql
INSERT INTO erp.employee (login_id, email, password_hash, name, phone, role_id, is_active)
VALUES 
  -- 직원 1: 과장
  (
    'kimmanager',
    'kim@kment.co.kr',
    '$2a$10$IdwZNAPaLdpp7EexPB8aCeag3NZe99wdmIIZVLB7fzu7WdIeFlXsy',
    '김과장',
    '010-1111-2222',
    (SELECT id FROM erp.role WHERE level = 2 LIMIT 1),
    true
  ),
  -- 직원 2: 대리
  (
    'leedeputy',
    'lee@kment.co.kr',
    '$2a$10$IdwZNAPaLdpp7EexPB8aCeag3NZe99wdmIIZVLB7fzu7WdIeFlXsy',
    '이대리',
    '010-2222-3333',
    (SELECT id FROM erp.role WHERE level = 3 LIMIT 1),
    true
  )
ON CONFLICT (login_id) DO UPDATE
SET 
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  role_id = EXCLUDED.role_id,
  is_active = true,
  updated_at = now();
```

## ✅ 생성 확인

```sql
-- 모든 직원 목록 조회
SELECT 
  e.id,
  e.login_id,
  e.email,
  e.name,
  e.phone,
  r.name as role_name,
  r.level as role_level,
  e.is_active,
  e.created_at
FROM erp.employee e
LEFT JOIN erp.role r ON e.role_id = r.id
ORDER BY r.level, e.created_at;
```

## 🔄 비밀번호 변경

1. 새 비밀번호 해시 생성:
   ```bash
   npx tsx scripts/generate-password-hash.ts newpassword123
   ```

2. SQL 실행:
   ```sql
   UPDATE erp.employee
   SET 
     password_hash = '$2a$10$새로운해시값을여기에입력',
     updated_at = now()
   WHERE login_id = 'honggildong';
   ```

## 🚫 직원 비활성화

```sql
UPDATE erp.employee
SET 
  is_active = false,
  updated_at = now()
WHERE login_id = 'honggildong';
```

## ⚠️ 주의사항

1. **비밀번호 해시**: 반드시 bcrypt로 생성된 해시값을 사용하세요
2. **login_id 중복**: UNIQUE 제약 조건이 있으므로 중복되지 않도록 주의
3. **email 중복**: UNIQUE 제약 조건이 있으므로 중복되지 않도록 주의
4. **role_id**: 존재하는 역할 ID만 사용하세요
5. **ON CONFLICT**: 이미 존재하는 login_id면 업데이트됩니다

## 📚 관련 파일

- `db/create-employees.sql` - 상세한 SQL 예시
- `scripts/generate-password-hash.ts` - 비밀번호 해시 생성 스크립트
- `scripts/create-test-employee.ts` - Node.js로 직원 생성 (자동화)

