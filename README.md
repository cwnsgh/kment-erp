# KMENT ERP

회사 내부에서 사용하는 거래처 · 계약 · 관리업무 ERP를 구축하기 위한 Next.js 기반 프로젝트입니다.  
대시보드, 거래처/계약 CRUD, 관리업무 승인 흐름 등을 웹에서 통합 관리하는 것을 목표로 합니다.

## 주요 기술 스택
- Next.js 14 (App Router, Route Handler)
- React 18, TypeScript
- Tailwind CSS
- Vercel (예정), Supabase(Postgres) 연동 예정

## 폴더 구조
```
src/
├─ app/                 # App Router 페이지
│  ├─ (dashboard)/
│  ├─ (management)/     # 거래처 관련
│  ├─ (contracts)/      # 계약 관련
│  ├─ (operations)/     # 관리업무 관련
│  ├─ schedule/ staff/ vacations/
│  └─ layout.tsx, page.tsx 등
├─ components/          # UI 컴포넌트
├─ config/              # 네비게이션 등 공통 설정
└─ lib/                 # (추가 예정) 공통 유틸
```

## 로컬 개발 가이드
1. 의존성 설치  
   ```bash
   npm install
   ```
   또는 `pnpm install`

2. 개발 서버 실행  
   ```bash
   npm run dev
   ```
   브라우저에서 http://localhost:3000 접속

3. 코드 품질 검사  
   ```bash
   npm run lint
   ```

## 다음 단계
- ERD 설계 및 Supabase 스키마 정의
- 인증/권한(Route Handler + Supabase Auth) 구현
- API 명세(OpenAPI/Notion) 작성 후 실제 데이터 연동
- UI 상태 관리 · 폼 검증 로직 추가

## 라이선스
사내 전용 프로젝트로 별도 라이선스 없음.
