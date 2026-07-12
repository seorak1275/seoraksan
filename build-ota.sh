#!/bin/sh
# ──────────────────────────────────────────────────────────────
# OTA 번들 빌드 — 설악산 현장관리 (Capgo 자체호스팅)
# www/ 를 bundle.zip 으로 묶고, www/app.js 의 OTA_VER 로 ota.json 을 갱신한다.
# 설치된 APK는 ota.json 의 version 이 자기 번들보다 새로우면 bundle.zip 을 받아 교체.
#
# 사용:  sh build-ota.sh "릴리스 메모(선택)"
# 릴리스 절차:
#   1) www/app.js 수정 + 맨 위 OTA_VER 를 새 값으로 올림
#   2) cp www/index.html index.html && cp www/style.css style.css && cp www/app.js app.js
#   3) sh build-ota.sh "변경 요약"     ← bundle.zip + ota.json 생성
#   4) git add -A && commit && main 머지·푸시
# ──────────────────────────────────────────────────────────────
set -e
cd "$(dirname "$0")"

# sw.js 는 루트에서만 갱신되므로 번들 전에 www 로 동기화
cp -f sw.js www/sw.js 2>/dev/null || true

# 현재 번들 버전 = www/app.js 의 OTA_VER (단일 소스)
VER=$(grep -o "const OTA_VER='[^']*'" www/app.js | head -1 | sed "s/const OTA_VER='//;s/'//")
[ -z "$VER" ] && { echo "OTA_VER 를 www/app.js 에서 찾지 못했습니다"; exit 1; }
# notes는 ota.json(JSON) 문자열에 들어가므로 첫 줄만 + 따옴표·역슬래시 제거 (여러 줄이면 JSON 깨짐)
NOTES=$(printf '%s' "${1:-}" | head -1 | tr -d '"\\')

# www 전체를 zip (index.html 이 zip 루트에 오도록 www 안에서 압축)
rm -f bundle.zip
( cd www && zip -qr ../bundle.zip . -x '*.DS_Store' '*/.*' )

# ota.json (루트 = GitHub Pages 서빙 위치, www = 다음 번들에도 포함)
printf '{"version":"%s","url":"https://seorak1275.github.io/seoraksan/bundle.zip","notes":"%s"}\n' "$VER" "$NOTES" > ota.json
cp -f ota.json www/ota.json

echo "✅ OTA 번들 생성: version=$VER  ($(du -h bundle.zip | cut -f1))  notes=$NOTES"
