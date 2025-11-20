# 거래처 등록 폼 - 사용 방법

## 방법 1: Server Actions 사용 (권장)

```typescript
'use client';

import { createClient } from '@/app/actions/client';
import { useFormState } from 'react-dom';

export function ClientForm() {
  const [state, formAction] = useFormState(createClient, null);

  return (
    <form action={formAction}>
      {/* 폼 필드들 */}
      <button type="submit">등록</button>
    </form>
  );
}
```

## 방법 2: API Route + fetch 사용

```typescript
'use client';

import { useState } from 'react';

export function ClientForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      businessRegistrationNumber: formData.get('businessRegistrationNumber'),
      name: formData.get('name'),
      // ... 나머지 필드들
      contacts: [...], // 담당자 배열
      sites: [...],    // 사이트 배열
    };

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('등록 완료!');
        // 페이지 이동 또는 폼 초기화
      } else {
        alert('등록 실패: ' + result.error);
      }
    } catch (error) {
      alert('오류 발생');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 폼 필드들 */}
      <button type="submit" disabled={loading}>
        {loading ? '등록 중...' : '등록'}
      </button>
    </form>
  );
}
```

## 비교

| 항목 | Server Actions | API Route + fetch |
|------|---------------|-------------------|
| 보안 | ⭐⭐⭐⭐⭐ (서버에서 실행) | ⭐⭐⭐ (클라이언트에서 호출) |
| 코드 복잡도 | ⭐⭐⭐⭐⭐ (간단) | ⭐⭐⭐ (상대적으로 복잡) |
| 타입 안정성 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 유연성 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**추천: Server Actions 사용**






