# 데이터베이스 구조

## 스키마 개요

모든 테이블은 `erp` 스키마에 저장됩니다.

## 테이블 구조

### 1. 역할 관리 (`erp.role`)
직원의 권한 레벨을 관리합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | serial | PK |
| level | int | 권한 레벨 (1=사장, 2=과장, 3=대리, 4=주임, 5=프로) |
| name | text | 역할 이름 |
| description | text | 설명 |

### 2. 직원 관리 (`erp.employee`)
직원 정보와 로그인 정보를 저장합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| email | text | 이메일 (로그인 ID, UNIQUE) |
| password_hash | text | 비밀번호 해시 (bcrypt) |
| name | text | 이름 |
| phone | text | 전화번호 |
| profile_image_url | text | 프로필 이미지 URL |
| role_id | int | 역할 ID (FK → erp.role) |
| is_active | boolean | 활성 상태 |
| created_at | timestamptz | 생성일시 |
| updated_at | timestamptz | 수정일시 |

### 3. 거래처 관리 (`erp.client`)
거래처(고객사) 기본 정보를 저장합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| business_registration_number | text | 사업자등록번호 (UNIQUE) |
| name | text | 상호(법인명) |
| ceo_name | text | 대표자 |
| address | text | 사업자 주소 |
| address_detail | text | 상세 주소 |
| business_type | text | 업태 |
| business_item | text | 종목 |
| login_id | text | 로그인 ID |
| login_password | text | 로그인 비밀번호 (해시) |
| status | text | 상태 (pending/approved/rejected) |
| note | text | 비고 |
| created_at | timestamptz | 생성일시 |
| updated_at | timestamptz | 수정일시 |

### 4. 거래처 담당자 (`erp.client_contact`)
거래처의 담당자 정보를 저장합니다. (1:N 관계)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| client_id | uuid | 거래처 ID (FK → erp.client) |
| name | text | 이름 |
| phone | text | 연락처 |
| email | text | 이메일 |
| title | text | 직책 |
| note | text | 비고 |

### 5. 거래처 사이트 (`erp.client_site`)
거래처의 사이트 정보를 저장합니다. (1:N 관계)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| client_id | uuid | 거래처 ID (FK → erp.client) |
| brand_name | text | 브랜드명 |
| domain | text | 도메인 |
| solution | text | 솔루션 |
| login_id | text | 로그인 ID |
| login_password | text | 로그인 비밀번호 |
| note | text | 비고 |

### 6. 거래처 첨부파일 (`erp.client_attachment`)
거래처 관련 첨부파일을 저장합니다. (1:N 관계)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| client_id | uuid | 거래처 ID (FK → erp.client) |
| file_url | text | 파일 URL (Supabase Storage) |
| file_name | text | 원본 파일명 |
| file_type | text | 파일 타입 (business_registration/signature) |
| created_at | timestamptz | 생성일시 |

### 7. 회원가입 승인 이력 (`erp.signup_approval`)
회원가입 승인/거절 이력을 저장합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| client_id | uuid | 거래처 ID (FK → erp.client) |
| approved_by | uuid | 승인한 직원 ID (FK → erp.employee) |
| status | text | 상태 (approved/rejected) |
| reason | text | 거절 사유 (거절 시) |
| created_at | timestamptz | 생성일시 |

## 관계도

```
erp.role (1) ──< (N) erp.employee
erp.employee (1) ──< (N) erp.signup_approval
erp.client (1) ──< (N) erp.client_contact
erp.client (1) ──< (N) erp.client_site
erp.client (1) ──< (N) erp.client_attachment
erp.client (1) ──< (N) erp.signup_approval
```

## 인덱스

- `idx_employee_email` - 직원 이메일 검색
- `idx_employee_role_id` - 역할별 직원 조회
- `idx_employee_is_active` - 활성 직원 조회
- `idx_client_status` - 상태별 거래처 조회
- `idx_signup_approval_client_id` - 거래처별 승인 이력 조회
- `idx_role_level` - 역할 레벨 검색

## 데이터 흐름

### 회원가입 프로세스
1. 외부 사용자 → `erp.client` (status='pending')
2. 관리자 승인 → `erp.client` (status='approved') + `erp.signup_approval` 기록

### 로그인 프로세스
1. 직원 이메일/비밀번호 입력
2. `erp.employee`에서 조회 및 비밀번호 검증
3. 세션 생성 (쿠키 저장)

### 거래처 등록 프로세스
1. `erp.client` 생성
2. `erp.client_contact` 생성 (여러 개)
3. `erp.client_site` 생성 (여러 개)
4. `erp.client_attachment` 생성 (여러 개)






