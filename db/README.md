# 데이터베이스 스키마

## 스키마 구조

이 프로젝트는 `erp` 스키마를 사용하여 기존 `public` 스키마와 분리합니다.

## 설정 방법

### 1. Supabase SQL Editor에서 실행

1. Supabase 대시보드 접속
2. SQL Editor 메뉴 클릭
3. `db/schema.sql` 파일의 내용을 복사하여 실행
4. 또는 파일을 직접 업로드

### 2. 스키마 확인

```sql
-- 생성된 스키마 확인
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'erp';

-- 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'erp';
```

## 스키마 사용 방법

### Supabase 클라이언트에서 스키마 지정

```typescript
// Supabase 클라이언트 생성 시 스키마 지정
const supabase = createClient(url, key, {
  db: {
    schema: 'erp'
  }
});
```

또는 쿼리 시 직접 지정:

```typescript
const { data } = await supabase
  .from('erp.client')
  .select('*');
```

## 장점

1. **네임스페이스 분리**: 기존 `public` 스키마의 테이블과 충돌 방지
2. **권한 관리**: 스키마별로 다른 권한 정책 적용 가능
3. **유지보수**: 프로젝트별로 명확하게 구분
4. **확장성**: 나중에 다른 프로젝트를 위한 추가 스키마 생성 가능

## 주의사항

- Supabase는 기본적으로 `public` 스키마를 사용합니다
- `erp` 스키마를 사용하려면 쿼리 시 스키마를 명시하거나 클라이언트 설정에서 지정해야 합니다
- RLS (Row Level Security) 정책은 각 테이블별로 설정해야 합니다








