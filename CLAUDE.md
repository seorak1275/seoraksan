# 설악산 현장관리 PWA — 개발 규칙

## 배포 규칙 (필수)

**모든 커밋 후 반드시 main 병합·푸시할 것.**

GitHub Pages(`109yoon.github.io/seoraksan`)는 `main` 브랜치를 서빙한다.
기능 브랜치(`claude/update-java-version-xi45x`)에만 커밋하면 웹앱에 반영되지 않는다.

### 작업 순서
1. `claude/update-java-version-xi45x` 브랜치에서 작업·커밋
2. `www/` → 루트 미러 (index/style + 분리된 JS 6개 모두):
   ```
   cp www/index.html index.html && cp www/style.css style.css && cp www/app.core.js app.core.js && cp www/app.map.js app.map.js && cp www/app.rescue.js app.rescue.js && cp www/app.report.js app.report.js && cp www/app.ops.js app.ops.js && cp www/app.js app.js
   ```
3. feature 브랜치에 push
4. **즉시 main에 머지·푸시**:
   ```
   git checkout main && git merge claude/update-java-version-xi45x --no-edit && git push -u origin main && git checkout claude/update-java-version-xi45x
   ```
5. 코드 구조를 바꿨으면 `sw.js`의 `_CACHE` 버전을 올려 캐시 갱신 유도
6. **APK 자체 업데이트(OTA)**: 코드 변경 시 `www/app.js`의 `OTA_VER`를 올리고 `sh build-ota.sh "변경요약"` 실행 → `bundle.zip`·`ota.json` 갱신 → 같이 커밋·푸시. (설치된 앱이 자동/버튼으로 새 번들을 받아 교체. 재빌드 불필요)
   - 최초 1회만 빌드 담당이 `npm install` 후 APK 재빌드 필요(Capgo 플러그인 포함)

## 파일 구조

JS가 기능별 6개로 분리됨 (2026-06 단일 app.js 11.6k줄 → 분리. 전부 같은 전역 스코프,
`index.html`에서 아래 순서대로 `<script>` 로드 → 합치면 원본과 동일하게 동작):
- `www/index.html` — HTML 골격 + 헤드 인라인 초기화(카카오맵 로더·로딩화면) — **편집은 항상 www/**
- `www/style.css` — 전체 CSS
- `www/app.core.js` — 전역 오류기록·DB(동기화)·유틸·알림 (즉시 실행되는 부팅 코드 포함)
- `www/app.map.js` — 카카오맵·본부 상황판
- `www/app.rescue.js` — 사용자/직원 픽, 구조·위험 목록/지도 코어
- `www/app.report.js` — 십자선, 구조 1~N보 폼, 보고서
- `www/app.ops.js` — 시설물 점검, 특보운영, 관리자(직원·승인·ACL·시스템)
- `www/app.js` — 설정, 카카오 로그인·인증, 통계, 응소, 🆘조난자, OTA, `window.onload` 부팅
  (※ `OTA_VER` 상수가 여기 있음 — build-ota.sh가 `www/app.js`에서 읽음)
- 루트 `index.html`/`style.css`/`app*.js` — www/의 미러 (GitHub Pages 서빙용, cp로 동기화)
- `sw.js` — 서비스워커. 셸 캐시(`_SHELL`)에 위 JS 6개 모두 포함. 구조 변경 시 `_CACHE` 버전 올릴 것
- Firebase Firestore: 실시간 동기화 (`_SHARED_DOC`, `_SHARED_COLL`)
- Kakao Maps SDK (appkey: `4ba2cd810d516a4f336d4dee5fa5eba5`)

### 편집 시 주의
- 기능/JS 수정 → 해당 기능 파일만 (예: 지도=`app.map.js`, 조난자·로그인·OTA=`app.js`, 관리자=`app.ops.js`)
- 새 파일 추가/분리 경계 변경 시 → `index.html` `<script>` 순서 + `sw.js` `_SHELL` + 루트 미러 cp 함께 갱신
- 즉시 실행(부팅) 코드는 `app.core.js`에 모여 있음 — 다른 파일이 로드 시점에 `app.core.js`의 함수를 호출하지 않도록 주의(setTimeout/onload 등 지연 호출은 안전)
- 디자인/CSS 수정 → `www/style.css`
- 화면 구조/모달 마크업 → `www/index.html`
- 인라인 스크립트(카카오맵·로딩)는 `www/index.html` 헤드에 그대로 둘 것(로드 타이밍)

## 보안 (절대 변경 금지)

- Master admin: `_MASTER_ID='yraphael@kakao.com'`
- Master PH: `21fe2594c32497629b4b6e5da35e3e8d613f4453c29e3c6db6d68de6f1892894`
- Admin PH(dnjs1209!): `5ea963a2abe59fd456f6b4b2bcb7b095acdc2fbf8f3a460f949a5649187cb211`
