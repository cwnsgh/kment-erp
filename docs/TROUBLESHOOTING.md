# 문제 해결 가이드

## .next 폴더 오류 해결

### 증상
```
[Error: UNKNOWN: unknown error, open '.next/static/chunks/...']
```

### 원인
- Windows 파일 시스템의 파일 잠금 문제
- 여러 프로세스가 동시에 .next 폴더에 접근
- 개발 서버가 빠르게 재빌드하면서 발생

### 해결 방법

#### 1. 즉시 해결
```bash
# 개발 서버 중지 후
rmdir /s /q .next
npm run dev
```

#### 2. 자동화 스크립트 추가
`package.json`에 다음 스크립트 추가:
```json
{
  "scripts": {
    "clean": "rmdir /s /q .next 2>nul || echo .next 폴더 삭제 완료",
    "dev:clean": "npm run clean && npm run dev"
  }
}
```

#### 3. VS Code 설정
`.vscode/settings.json`에 추가:
```json
{
  "files.watcherExclude": {
    "**/.next/**": true
  }
}
```

#### 4. 바이러스 백신 예외 설정
Windows Defender나 백신 프로그램에서 `.next` 폴더를 예외로 추가

### 예방 방법
1. 개발 서버 종료 시 `Ctrl+C`로 정상 종료
2. 파일 수정 후 잠시 대기 (빠른 연속 수정 피하기)
3. `.next` 폴더는 Git에 포함하지 않음 (이미 .gitignore에 있음)






