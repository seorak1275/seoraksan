# 설악산 현장관리 PWA — 개발 규칙

## 배포 규칙 (필수)

**모든 커밋 후 반드시 main 병합·푸시할 것.**

GitHub Pages(`109yoon.github.io/seoraksan`)는 `main` 브랜치를 서빙한다.
기능 브랜치(`claude/update-java-version-xi45x`)에만 커밋하면 웹앱에 반영되지 않는다.

### 작업 순서
1. `claude/update-java-version-xi45x` 브랜치에서 작업·커밋
2. `www/index.html` → `index.html` 미러 (`cp www/index.html index.html`)
3. feature 브랜치에 push
4. **즉시 main에 머지·푸시**:
   ```
   git checkout main && git merge claude/update-java-version-xi45x --no-edit && git push -u origin main && git checkout claude/update-java-version-xi45x
   ```

## 파일 구조

- `www/index.html` — 단일 파일 PWA (항상 여기를 편집)
- `index.html` — www/index.html의 미러 (cp로 동기화)
- Firebase Firestore: 실시간 동기화 (`_SHARED_DOC`, `_SHARED_COLL`)
- Kakao Maps SDK (appkey: `4ba2cd810d516a4f336d4dee5fa5eba5`)

## 보안 (절대 변경 금지)

- Master admin: `_MASTER_ID='yraphael@kakao.com'`
- Master PH: `21fe2594c32497629b4b6e5da35e3e8d613f4453c29e3c6db6d68de6f1892894`
- Admin PH(dnjs1209!): `5ea963a2abe59fd456f6b4b2bcb7b095acdc2fbf8f3a460f949a5649187cb211`
