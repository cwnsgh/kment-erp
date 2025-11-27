# KMENT ERP - 프로젝트 현황

> **작성일**: 2024년  
> **목적**: 현재까지 구현된 기능 정리 (임시 문서)

---

## ✅ 구현 완료된 기능

### 1. 인증 시스템 🔐

#### 로그인
- **경로**: `/login`
- **기능**:
  - 직원 로그인 (이메일 또는 아이디)
  - 사업자 로그인 (아이디)
  - 자동 로그인 상태 유지 (쿠키 기반 세션)
  - 비밀번호 해싱 (bcryptjs)
- **파일**: `src/app/actions/auth.ts`, `src/app/(auth)/login/page.tsx`

#### 회원가입
- **경로**: `/signup`
- **기능**:
  - 사업자 회원가입 요청
  - 아이디 중복 확인
  - 사업자등록번호 중복 확인
  - 주소 검색 (다음 주소 API)
  - 파일 업로드 (사업자등록증, 서명)
  - 비밀번호 해싱
  - 승인 대기 상태로 저장
- **파일**: `src/app/actions/signup.ts`, `src/app/(auth)/signup/page.tsx`

#### 로그아웃
- **기능**: 세션 삭제 및 로그인 페이지로 리다이렉트
- **파일**: `src/app/actions/auth.ts`

#### 세션 관리
- **기능**:
  - 직원 세션 (쿠키: `employee_session`)
  - 사업자 세션 (쿠키: `client_session`)
  - 미들웨어를 통한 인증 체크
- **파일**: `src/lib/auth.ts`, `src/middleware.ts`

---

### 2. 거래처 관리 🏢

#### 거래처 등록
- **경로**: `/clients/new`
- **기능**:
  - 거래처 정보 입력
  - 담당자 정보 다중 입력
  - 사이트 정보 다중 입력
  - 파일 첨부 (사업자등록증, 서명)
  - 주소 검색
  - 자동 승인 (관리자가 등록 시)
- **파일**: `src/app/actions/client.ts`, `src/components/clients/client-form.tsx`

#### 거래처 조회
- **경로**: `/clients`
- **기능**: 거래처 목록 표시
- **파일**: `src/app/(app)/clients/page.tsx`, `src/components/clients/client-table.tsx`

---

### 3. 회원가입 승인 시스템 ✅

#### 승인 대기 목록
- **경로**: `/staff/approvals`
- **기능**:
  - 승인 대기 중인 회원가입 요청 목록
  - 승인/거절 기능
  - 거절 사유 입력
  - 승인 이력 저장
- **파일**: `src/app/actions/client-approval.ts`, `src/app/(app)/staff/approvals/page.tsx`

---

### 4. 중복 확인 시스템 🔍

#### 아이디 중복 확인
- **기능**:
  - 사업자 테이블 확인
  - 직원 테이블 확인 (이메일)
  - 실시간 검증
- **파일**: `src/app/actions/signup-validation.ts`

#### 사업자등록번호 중복 확인
- **기능**: 거래처 테이블에서 중복 확인
- **파일**: `src/app/actions/signup-validation.ts`

---

### 5. 파일 업로드 📁

#### 파일 업로드 API
- **경로**: `POST /api/files/upload`
- **기능**:
  - Supabase Storage에 파일 업로드
  - 사업자등록증 폴더: `business-registration`
  - 서명 폴더: `signature`
  - 최대 30MB 제한
  - 공개 URL 반환
- **파일**: `src/app/api/files/upload/route.ts`

---

### 6. 주소 검색 🗺️

#### 다음 주소 API 연동
- **기능**:
  - 주소 검색 팝업
  - 도로명/지번 주소 선택
  - 우편번호 자동 입력
  - 건물명 자동 포함
- **파일**: `src/components/common/address-search.tsx`

---

### 7. 데이터베이스 스키마 🗄️

#### 구현된 테이블
- `erp.client` - 거래처 정보
- `erp.client_contact` - 거래처 담당자
- `erp.client_attachment` - 거래처 첨부파일
- `erp.employee` - 직원 정보
- `erp.role` - 역할/권한
- `erp.signup_approval` - 회원가입 승인 이력

#### SQL 파일
- `db/schema.sql` - 기본 스키마
- `db/employee-schema.sql` - 직원 및 역할 스키마
- `db/create-test-employee.sql` - 테스트 계정 생성
- `db/add-employee-login-id.sql` - login_id 필드 추가

---

### 8. 개발/디버깅 도구 🛠️

#### 개발용 API
- `GET /api/dev/check-env` - 환경 변수 확인
- `GET /api/dev/test-connection` - DB 연결 테스트
- `GET /api/dev/debug-login` - 로그인 디버깅

---

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── (auth)/              # 인증 관련 페이지
│   │   ├── login/           # 로그인
│   │   └── signup/          # 회원가입
│   ├── (app)/               # 인증 필요 페이지
│   │   ├── clients/         # 거래처 관리
│   │   ├── contracts/       # 계약 관리
│   │   ├── operations/       # 관리 업무
│   │   ├── staff/           # 직원 관리
│   │   └── dashboard/       # 대시보드
│   ├── actions/             # Server Actions
│   │   ├── auth.ts          # 인증
│   │   ├── client.ts        # 거래처
│   │   ├── client-approval.ts # 승인 관리
│   │   ├── signup.ts        # 회원가입
│   │   └── signup-validation.ts # 중복 확인
│   └── api/                 # API Routes
│       ├── dev/             # 개발/디버깅
│       └── files/           # 파일 관리
├── components/
│   ├── clients/             # 거래처 컴포넌트
│   ├── common/              # 공통 컴포넌트
│   │   └── address-search.tsx # 주소 검색
│   └── layout/              # 레이아웃 컴포넌트
├── lib/
│   ├── auth.ts              # 세션 관리
│   └── supabase-server.ts   # Supabase 클라이언트
└── config/
    └── navigation.ts        # 네비게이션 설정
```

---

## 🔑 주요 기능 상세

### 로그인 플로우
1. 사용자가 아이디/이메일과 비밀번호 입력
2. 시스템이 직원 테이블에서 먼저 검색 (이메일 또는 login_id)
3. 없으면 사업자 테이블에서 검색 (login_id)
4. 비밀번호 검증 (bcrypt)
5. 세션 생성 및 쿠키 저장
6. 대시보드로 리다이렉트

### 회원가입 플로우
1. 사업자가 회원가입 폼 작성
2. 아이디 중복 확인 (필수)
3. 사업자등록번호 중복 확인 (필수)
4. 주소 검색으로 주소 입력
5. 파일 업로드 (사업자등록증, 서명)
6. 비밀번호 해싱 후 DB 저장
7. 상태: `pending` (승인 대기)
8. 관리자가 승인하면 `approved`로 변경
9. 승인된 사업자만 로그인 가능

### 승인 플로우
1. 관리자가 `/staff/approvals` 접속
2. 승인 대기 목록 확인
3. 승인 또는 거절 선택
4. 거절 시 사유 입력
5. 승인 이력 저장 (`erp.signup_approval`)

---

## 🛠️ 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일**: Tailwind CSS
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Cookie 기반 세션 관리
- **비밀번호**: bcryptjs
- **파일 저장**: Supabase Storage

---

## 📝 주요 설정

### 환경 변수
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key (서버 전용)

### 테스트 계정
- **직원**: `admin@kment.co.kr` / `admin123`
- **사업자**: 회원가입 후 승인 필요

---

## 🚧 미구현 기능

### 페이지 (UI만 존재)
- 대시보드 (`/dashboard`)
- 계약 관리 (`/contracts/*`)
- 관리 업무 (`/operations/*`)
- 일정 관리 (`/schedule`)
- 직원 조회 (`/staff`)
- 연차 관리 (`/vacations`)

### 기능
- 계약 CRUD
- 관리 업무 승인 흐름
- 일정 관리
- 연차 신청/승인
- 직원 관리 (등록, 수정, 삭제)

---

## 📚 문서

- `docs/API_STRUCTURE.md` - API 구조 가이드
- `docs/DB_STRUCTURE.md` - 데이터베이스 구조
- `src/app/api/README.md` - API Routes 설명

---

## ⚠️ 주의사항

1. **개발 API**: `/api/dev/*` 경로는 프로덕션에서 비활성화 필요
2. **세션 보안**: 프로덕션에서는 HTTPS 필수
3. **파일 크기**: 최대 30MB 제한
4. **비밀번호**: bcrypt 해싱 사용 (rounds: 10)

---

## 🎯 다음 단계

1. 계약 관리 기능 구현
2. 관리 업무 승인 흐름 구현
3. 대시보드 데이터 연동
4. 직원 관리 기능 구현
5. 일정/연차 관리 구현

---

**이 문서는 임시 문서이며, 프로젝트 진행에 따라 업데이트됩니다.**






