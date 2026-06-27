# 설악산 현장관리 PWA — 개발 규칙

## 배포 규칙 (필수)

**모든 커밋 후 반드시 main 병합·푸시할 것.**

GitHub Pages(`109yoon.github.io/seoraksan`)는 `main` 브랜치를 서빙한다.
기능 브랜치(`claude/update-java-version-xi45x`)에만 커밋하면 웹앱에 반영되지 않는다.

### 작업 순서
1. `claude/update-java-version-xi45x` 브랜치에서 작업·커밋
2. `www/` → 루트 미러 (3개 파일 모두):
   ```
   cp www/index.html index.html && cp www/style.css style.css && cp www/app.js app.js
   ```
3. feature 브랜치에 push
4. **즉시 main에 머지·푸시**:
   ```
   git checkout main && git merge claude/update-java-version-xi45x --no-edit && git push -u origin main && git checkout claude/update-java-version-xi45x
   ```
5. 코드 구조를 바꿨으면 `sw.js`의 `_CACHE` 버전을 올려 캐시 갱신 유도

## 파일 구조

PWA가 3개 파일로 분리됨 (2026-06 단일파일 12k줄 → 분리):
- `www/index.html` — HTML 골격 + 헤드 인라인 초기화(카카오맵 로더·로딩화면) — **편집은 항상 www/**
- `www/style.css` — 전체 CSS
- `www/app.js` — 전체 애플리케이션 로직(대부분의 기능)
- 루트 `index.html`/`style.css`/`app.js` — www/의 미러 (GitHub Pages 서빙용, cp로 동기화)
- `sw.js` — 서비스워커. 셸 캐시(`_SHELL`)에 위 3개 포함. 구조 변경 시 `_CACHE` 버전 올릴 것
- Firebase Firestore: 실시간 동기화 (`_SHARED_DOC`, `_SHARED_COLL`)
- Kakao Maps SDK (appkey: `4ba2cd810d516a4f336d4dee5fa5eba5`)

### 편집 시 주의
- 기능/JS 수정 → `www/app.js`
- 디자인/CSS 수정 → `www/style.css`
- 화면 구조/모달 마크업 → `www/index.html`
- 인라인 스크립트(카카오맵·로딩)는 `www/index.html` 헤드에 그대로 둘 것(로드 타이밍)

## 보안 (절대 변경 금지)

- Master admin: `_MASTER_ID='yraphael@kakao.com'`
- Master PH: `21fe2594c32497629b4b6e5da35e3e8d613f4453c29e3c6db6d68de6f1892894`
- Admin PH(dnjs1209!): `5ea963a2abe59fd456f6b4b2bcb7b095acdc2fbf8f3a460f949a5649187cb211`
