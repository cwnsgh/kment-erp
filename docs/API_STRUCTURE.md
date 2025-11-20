# API 구조 가이드

## 개요

이 프로젝트는 **Next.js 14 App Router**를 사용하며, **Server Actions**를 주로 사용합니다.

## 구조 원칙

### 1. Server Actions (주로 사용) ✅
- **위치**: `src/app/actions/`
- **용도**: 폼 제출, 데이터 조회/수정/삭제
- **장점**: 타입 안정성, 자동 캐싱, 간단한 사용

### 2. API Routes (특수한 경우만) 🔧
- **위치**: `src/app/api/`
- **용도**: 
  - 파일 업로드 (multipart/form-data)
  - 외부 API 연동
  - 웹훅 수신
  - 개발/디버깅용 유틸리티

## 현재 API 구조

### Server Actions

#### 인증 관련 (`actions/auth.ts`)
```typescript
- login(email, password)      // 직원 로그인
- logout()                    // 로그아웃
```

#### 거래처 관련 (`actions/client.ts`)
```typescript
- createClient(data)          // 거래처 등록
```

#### 회원가입 승인 관련 (`actions/client-approval.ts`)
```typescript
- getPendingSignupRequests()  // 승인 대기 목록 조회
- approveSignupRequest(id)   // 승인
- rejectSignupRequest(id, reason) // 거절
```

#### 회원가입 관련 (`actions/signup.ts`)
```typescript
- signup(data)               // 외부 사용자 회원가입
```

### API Routes

#### 파일 관리 (`api/files/`)
```typescript
POST /api/files/upload        // 파일 업로드 (Supabase Storage)
  - body: FormData { file, folder }
  - folder: 'business-registration' | 'signature'
  - maxSize: 30MB
```

#### 개발/디버깅 (`api/dev/`)
```typescript
GET /api/dev/check-env              // 환경 변수 확인
GET /api/dev/test-connection         // DB 연결 테스트
GET /api/dev/debug-login?username=   // 로그인 디버깅
```

> ⚠️ **주의**: 개발 API는 프로덕션에서 비활성화하거나 인증을 추가해야 합니다.

## 사용 가이드

### Server Action 사용 예시

```typescript
// 클라이언트 컴포넌트
'use client';
import { login } from '@/app/actions/auth';

async function handleLogin() {
  const result = await login(email, password);
  if (result.success) {
    // 성공 처리
  }
}
```

### API Route 사용 예시

```typescript
// 클라이언트 컴포넌트
const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});
```

## 파일 구조

```
src/app/
├── actions/              # Server Actions (주로 사용)
│   ├── auth.ts          # 인증
│   ├── client.ts        # 거래처
│   ├── client-approval.ts # 승인 관리
│   └── signup.ts       # 회원가입
│
└── api/                 # API Routes (특수한 경우만)
    ├── dev/             # 개발/디버깅용 API
    │   ├── check-env/   # 환경 변수 확인
    │   ├── test-connection/ # DB 연결 테스트
    │   └── debug-login/ # 로그인 디버깅
    ├── files/           # 파일 관리 API
    │   └── upload/      # 파일 업로드
    └── README.md        # API 구조 설명
```

## 향후 추가 예정

### Server Actions
- `actions/contract.ts` - 계약 관리
- `actions/operation.ts` - 관리 업무
- `actions/employee.ts` - 직원 관리

### API Routes
- `api/webhooks/*` - 외부 웹훅 수신
- `api/integrations/*` - 외부 서비스 연동
