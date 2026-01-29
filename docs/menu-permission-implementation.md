# 메뉴 권한 시스템 구현 가이드

## 📅 작업 일자
2026년 1월 22일

## 📋 작업 개요
세부 메뉴 단위의 권한 관리 시스템을 구현하고, 네비게이션 바에서 권한이 있는 메뉴만 표시되도록 하며, URL 직접 접근을 차단하는 기능을 추가했습니다.

## 🎯 주요 기능

### 1. 네비게이션 바 권한 필터링
- 권한이 있는 메뉴만 네비게이션 바에 표시
- 대분류: 해당 카테고리의 세부 메뉴 중 하나라도 권한이 있으면 표시
- 세부 메뉴: 권한이 있는 것만 표시
- 관리자(role_id: 1): 모든 메뉴 표시

### 2. URL 직접 접근 차단
- 권한이 없는 페이지에 URL로 직접 접근 시 자동 리다이렉트
- 권한이 없으면 `/dashboard?error=permission_denied`로 이동

## 📁 수정/추가된 파일

### 1. `src/components/layout/app-shell.tsx`
**변경 사항:**
- 메뉴 구조와 권한 정보를 로드하는 로직 추가
- `getMenuKeyFromHref`: 경로에서 menu_key를 찾는 함수 개선
- `getCategoryKeyFromHref`: 대분류 경로를 카테고리 키로 매핑하는 함수 추가
- `hasCategoryPermission`: 카테고리별 권한 확인 함수 추가
- `filterNavByEmployee`: 권한 기반 메뉴 필터링 로직 개선
- 로딩 상태 관리 추가 (`permissionsLoaded`)

**주요 코드:**
```typescript
// 메뉴 구조와 권한 정보 로드
const [menuPermissions, setMenuPermissions] = useState<Record<string, boolean>>({});
const [menuStructure, setMenuStructure] = useState<Array<{ menu_key: string; navigation_path: string; category_key: string }>>([]);
const [permissionsLoaded, setPermissionsLoaded] = useState(false);

// 대분류 경로를 카테고리 키로 매핑
const categoryMapping: Record<string, string> = {
  "/clients": "client-management",
  "/consultation": "consultation",
  "/contracts": "contract",
  "/schedule": "schedule",
  "/operations/tasks": "operations",
  "/staff": "staff",
  "/vacations": "vacation",
  "/admin": "admin",
};
```

### 2. `src/lib/menu-permission.ts` (신규)
**기능:**
- 경로를 menu_key로 변환하는 유틸리티 함수
- 권한 체크가 필요한 경로인지 확인하는 함수

**주요 함수:**
- `getMenuKeyFromPath(pathname: string): string | null`
  - 경로에서 menu_key 추출
  - 예: `/contracts/new` → `contract-register`
  
- `requiresPermissionCheck(pathname: string): boolean`
  - 권한 체크가 필요한 경로인지 확인

**경로 매핑:**
```typescript
const pathToMenuKeyMap: Record<string, string> = {
  "/clients": "client-list",
  "/clients/new": "client-register",
  "/contracts": "contract-list",
  "/contracts/new": "contract-register",
  // ... 기타 경로들
};
```

### 3. `src/lib/require-menu-permission.ts` (신규)
**기능:**
- 페이지에서 메뉴 권한을 체크하고, 권한이 없으면 리다이렉트하는 서버 액션

**사용 방법:**
```typescript
import { requireMenuPermission } from '@/lib/require-menu-permission';

export default async function YourPage() {
  await requireMenuPermission('/your/path');
  // ... 나머지 코드
}
```

**동작:**
1. 인증 확인 (`requireAuth`)
2. 관리자(role_id: 1)는 모든 메뉴 접근 가능
3. 경로에서 menu_key 추출
4. 권한 확인 (`checkMenuPermission`)
5. 권한이 없으면 `/dashboard?error=permission_denied`로 리다이렉트

### 4. `src/app/(app)/contracts/new/page.tsx`
**변경 사항:**
- 서버 컴포넌트로 변경 (`async function`)
- 권한 체크 추가

```typescript
export default async function ContractCreatePage() {
  await requireMenuPermission('/contracts/new');
  // ... 나머지 코드
}
```

### 5. `src/app/(app)/clients/new/page.tsx`
**변경 사항:**
- 서버 컴포넌트로 변경 (`async function`)
- 권한 체크 추가

```typescript
export default async function ClientCreatePage() {
  await requireMenuPermission('/clients/new');
  // ... 나머지 코드
}
```

## 🔧 기술적 세부사항

### 권한 체크 흐름

1. **네비게이션 바 표시**
   ```
   페이지 로드 → 메뉴 구조 로드 → 권한 정보 로드 → 필터링 → 표시
   ```

2. **URL 직접 접근 차단**
   ```
   페이지 접근 → requireMenuPermission 호출 → 권한 확인 → 리다이렉트 또는 표시
   ```

### 카테고리 권한 로직

- **대분류 표시 조건**: 해당 카테고리의 세부 메뉴 중 하나라도 권한이 있으면 표시
- **세부 메뉴 표시 조건**: 해당 세부 메뉴에 권한이 있어야 표시
- **관리자(role_id: 1)**: 모든 메뉴 표시 (DB 조회 없이 즉시 반환)

### 경로 매핑 전략

1. **정확한 매칭**: `/contracts/new` → `contract-register`
2. **부분 매칭**: `/admin/logs/clients` → `admin-logs`
3. **대분류 매핑**: `/admin` → `admin` 카테고리

## 📝 적용 가이드

### 다른 페이지에 권한 체크 추가하기

1. 페이지를 서버 컴포넌트로 변경:
```typescript
// Before
export default function YourPage() {
  // ...
}

// After
export default async function YourPage() {
  // ...
}
```

2. 권한 체크 추가:
```typescript
import { requireMenuPermission } from '@/lib/require-menu-permission';

export default async function YourPage() {
  await requireMenuPermission('/your/path');
  // ... 나머지 코드
}
```

3. `src/lib/menu-permission.ts`에 경로 추가 (필요한 경우):
```typescript
const pathToMenuKeyMap: Record<string, string> = {
  // ... 기존 경로들
  "/your/path": "your-menu-key",
};
```

## 🐛 해결한 문제들

### 1. 중복 함수 정의 오류
- **문제**: `hasCategoryPermission` 함수가 중복 정의됨
- **해결**: 중복된 함수 정의 제거

### 2. 관리자페이지 대분류가 표시되지 않음
- **문제**: `/admin` 경로가 `menu_structure`의 `navigation_path`와 매칭되지 않음
- **해결**: `getCategoryKeyFromHref` 함수에 대분류 경로 매핑 추가

### 3. 로딩 중 권한 없는 메뉴가 보임
- **문제**: 권한 로드 전에 필터링이 실행되어 모든 메뉴가 표시됨
- **해결**: `permissionsLoaded` 상태 추가하여 권한 로드 완료 후 필터링

### 4. UI 깜빡임
- **문제**: 권한 저장 시 전체 데이터를 다시 로드하여 UI가 깜빡임
- **해결**: 로컬 상태를 직접 업데이트하여 깜빡임 방지 (이전 작업)

## 📊 데이터베이스 스키마

### `erp.menu_structure` 테이블
- 메뉴 구조 카탈로그 (대분류와 세부 메뉴 정보)
- 주요 컬럼: `category_key`, `menu_key`, `navigation_path`

### `erp.menu_permission` 테이블
- 직원별 메뉴 접근 권한
- 주요 컬럼: `menu_key`, `employee_id`, `allowed`

## 🔐 보안 고려사항

1. **서버 사이드 권한 체크**: 클라이언트 사이드만으로는 충분하지 않으므로 서버에서도 권한 체크 필수
2. **관리자 우회**: `role_id: 1`인 사용자는 모든 메뉴 접근 가능 (DB 조회 없이)
3. **권한 없는 접근 차단**: URL 직접 접근 시 자동 리다이렉트

## 🚀 향후 개선 사항

1. **모든 페이지에 권한 체크 적용**: 현재는 일부 페이지만 적용됨
2. **에러 메시지 개선**: 권한 없음 에러 메시지를 사용자 친화적으로 표시
3. **권한 캐싱 최적화**: React `cache()`를 활용한 권한 정보 캐싱
4. **동적 경로 처리**: `[id]` 같은 동적 경로에 대한 권한 체크 로직 추가

## 📚 참고 자료

- 메뉴 권한 관리 페이지: `/admin/permissions`
- 권한 체크 서버 액션: `src/app/actions/permission.ts`
- 네비게이션 설정: `src/config/navigation.ts`

---

**작성자**: AI Assistant  
**최종 수정일**: 2026년 1월 22일

