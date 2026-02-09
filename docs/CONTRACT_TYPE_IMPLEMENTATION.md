# 계약 종목 및 작업 내용 관리 구현 가이드

## 📋 개요

계약 종목과 작업 내용을 관리자가 동적으로 설정할 수 있도록 구현합니다.
계약 등록 시 선택한 계약 종목에 따라 해당 종목의 작업 내용이 동적으로 표시됩니다.

## ✅ 완료된 작업

1. ✅ DB 스키마 설계
   - `db/contract-type-schema.sql` - 계약 종목 및 작업 내용 관리 테이블
   - `db/contract-work-content-schema.sql` - 계약별 작업 내용 수정 횟수 테이블
   - `db/contract-schema.sql` - 계약 테이블 수정 (contract_type → contract_type_id)

2. ✅ DB 구조 문서 업데이트
   - `docs/DB_STRUCTURE.md` - 새로운 테이블 구조 반영

## 🔨 내일 해야 할 작업

### 1. DB 스키마 실행 (최우선)

**순서:**
1. `db/contract-type-schema.sql` 실행
2. `db/contract-work-content-schema.sql` 실행
3. `db/contract-schema.sql` 실행 (기존 테이블이 있다면 ALTER 필요)

**주의사항:**
- 기존 `erp.contract` 테이블에 데이터가 있다면 마이그레이션 필요
- `contract_type` (text) → `contract_type_id` (uuid) 변환 작업 필요

---

### 2. Server Actions 생성

**파일:** `src/app/actions/contract-type.ts`

**필요한 함수들:**

#### 2.1 계약 종목 관리
```typescript
// 계약 종목 목록 조회
export async function getContractTypes(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    display_order: number;
    is_active: boolean;
  }>;
  error?: string;
}>

// 계약 종목 생성
export async function createContractType(name: string, displayOrder: number): Promise<{
  success: boolean;
  data?: { id: string };
  error?: string;
}>

// 계약 종목 수정
export async function updateContractType(
  id: string,
  name: string,
  displayOrder: number,
  isActive: boolean
): Promise<{ success: boolean; error?: string }>

// 계약 종목 삭제
export async function deleteContractType(id: string): Promise<{
  success: boolean;
  error?: string;
}>
```

#### 2.2 작업 내용 관리
```typescript
// 계약 종목별 작업 내용 조회
export async function getWorkContentsByContractType(contractTypeId: string): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    work_content_name: string;
    display_order: number;
    is_active: boolean;
  }>;
  error?: string;
}>

// 작업 내용 생성
export async function createWorkContent(
  contractTypeId: string,
  workContentName: string,
  displayOrder: number
): Promise<{ success: boolean; data?: { id: string }; error?: string }>

// 작업 내용 수정
export async function updateWorkContent(
  id: string,
  workContentName: string,
  displayOrder: number,
  isActive: boolean
): Promise<{ success: boolean; error?: string }>

// 작업 내용 삭제
export async function deleteWorkContent(id: string): Promise<{
  success: boolean;
  error?: string;
}>
```

---

### 3. 작업 내용 관리 페이지 생성

**파일:** `src/app/(app)/admin/work-content/page.tsx`

**기능:**
- 계약 종목 목록 표시
- 각 계약 종목별 작업 내용 표시
- 계약 종목 추가/수정/삭제
- 작업 내용 추가/수정/삭제
- 드래그 앤 드롭으로 순서 변경 (선택사항)

**컴포넌트 구조:**
```
src/app/(app)/admin/work-content/
  ├── page.tsx (메인 페이지)
  └── components/
      └── work-content-management.tsx (메인 컴포넌트)
```

**UI 요구사항:**
- 계약 종목별로 섹션 구분
- 각 계약 종목 옆에 "+" 버튼으로 작업 내용 추가
- 작업 내용은 편집/삭제 가능
- 이미지 참고: 계약 종목별로 테이블 형태로 표시

---

### 4. 네비게이션 메뉴 추가

**파일:** `src/config/navigation.ts`

**수정 내용:**
```typescript
{
  label: "관리자 페이지",
  href: "/admin",
  icon: "lock",
  allowedRoleIds: [1, 2, 3],
  children: [
    { label: "업무 삭제 내역", href: "/admin/deleted-tasks" },
    { label: "로그 관리", href: "/admin/logs", ... },
    { label: "회원가입 승인 관리", href: "/staff/approvals", badge: 0 },
    { label: "메뉴 권한 관리", href: "/admin/permissions" },
    { label: "작업 내용 관리", href: "/admin/work-content" }, // 추가
  ],
}
```

---

### 5. 계약 등록 폼 수정

**파일:** `src/components/contracts/contract-form.tsx`

**수정 사항:**

#### 5.1 계약 종목 드롭다운 변경
- 하드코딩된 "신규", "갱신", "추가" 제거
- `getContractTypes()`로 동적으로 로드
- `contractType` (string) → `contractTypeId` (uuid)로 변경

#### 5.2 작업 내용 동적 표시
- 계약 종목 선택 시 `getWorkContentsByContractType()` 호출
- 선택한 계약 종목의 작업 내용을 동적으로 표시
- 각 작업 내용별로 수정 횟수 입력 필드 표시

**데이터 구조 변경:**
```typescript
type ContractData = {
  // ... 기존 필드
  contractTypeId: string; // contractType (string) → contractTypeId (uuid)
  workContents: Array<{ // 추가
    workContentId: string;
    workContentName: string;
    modificationCount: string;
  }>;
  // pcModification, mobileModification 제거 (동적으로 처리)
}
```

**UI 변경:**
- "PC 수정", "모바일 수정" 하드코딩 제거
- 계약 종목 선택 시 해당 종목의 작업 내용이 동적으로 표시
- 각 작업 내용 옆에 수정 횟수 입력 필드

---

### 6. 계약 저장 로직 수정

**파일:** `src/app/actions/contract.ts` (생성 필요)

**수정 사항:**
- 계약 저장 시 `erp.contract` 테이블에 저장
- 계약별 작업 내용은 `erp.contract_work_content` 테이블에 저장
- `contract_type_id` 사용

**함수:**
```typescript
export async function createContract(data: {
  clientId: string;
  siteId: string;
  contractName: string;
  contractDate: string;
  contractTypeId: string;
  // ... 기타 필드
  workContents: Array<{
    workContentId: string;
    modificationCount: number;
  }>;
}): Promise<{ success: boolean; error?: string; contractId?: string }>
```

---

## 📝 구현 순서 권장

1. **DB 스키마 실행** (최우선)
2. **Server Actions 생성** (`contract-type.ts`)
3. **작업 내용 관리 페이지 생성**
4. **네비게이션 메뉴 추가**
5. **계약 등록 폼 수정**
6. **계약 저장 로직 수정**

---

## 🔍 참고사항

### 기존 데이터 마이그레이션 (필요 시)

기존 `erp.contract` 테이블에 데이터가 있다면:

```sql
-- 1. 기본 계약 종목 생성 확인
SELECT * FROM erp.contract_type;

-- 2. 기존 contract_type (text) 값을 contract_type_id (uuid)로 변환
-- 예: '신규' → 해당하는 contract_type.id

UPDATE erp.contract c
SET contract_type_id = (
  SELECT id FROM erp.contract_type WHERE name = c.contract_type
)
WHERE contract_type_id IS NULL;

-- 3. 기존 pc_modification_count, mobile_modification_count를 
--    erp.contract_work_content로 마이그레이션 (선택사항)
```

### 테스트 체크리스트

- [ ] 작업 내용 관리 페이지에서 계약 종목 추가/수정/삭제 가능
- [ ] 작업 내용 관리 페이지에서 작업 내용 추가/수정/삭제 가능
- [ ] 계약 등록 시 계약 종목 드롭다운에 저장된 종목 표시
- [ ] 계약 종목 선택 시 해당 종목의 작업 내용 동적 표시
- [ ] 계약 저장 시 작업 내용 수정 횟수 함께 저장
- [ ] 계약 조회 시 작업 내용 및 수정 횟수 표시

---

## 📚 관련 파일 목록

### DB 스키마
- `db/contract-type-schema.sql`
- `db/contract-work-content-schema.sql`
- `db/contract-schema.sql`

### 문서
- `docs/DB_STRUCTURE.md`

### 구현 필요 파일
- `src/app/actions/contract-type.ts` (생성)
- `src/app/actions/contract.ts` (생성)
- `src/app/(app)/admin/work-content/page.tsx` (생성)
- `src/components/contracts/contract-form.tsx` (수정)
- `src/config/navigation.ts` (수정)

---

## 💡 추가 개선 사항 (선택)

1. **드래그 앤 드롭 순서 변경**
   - 계약 종목 순서 변경
   - 작업 내용 순서 변경

2. **작업 내용 템플릿**
   - 기본 작업 내용 템플릿 제공
   - 계약 종목 생성 시 자동으로 기본 작업 내용 추가

3. **검색 및 필터링**
   - 계약 종목 검색
   - 작업 내용 검색

4. **일괄 작업**
   - 여러 계약 종목에 동일한 작업 내용 일괄 추가
