#!/bin/sh
# ──────────────────────────────────────────────────────────────
# 원클릭 배포 — 설악산 현장관리
# 사용:  sh deploy.sh "변경 요약(커밋 메시지)"
#
# 하는 일 (기존 수동 절차 전부):
#   ① sw.js  _CACHE 버전 자동 +1            (셸 캐시 갱신 유도)
#   ② www/app.js OTA_VER 자동 갱신          (오늘 날짜 + 빌드번호 +1)
#   ③ www/ → 루트 미러 (GitHub Pages 서빙용 9개 파일)
#   ④ build-ota.sh 실행 (bundle.zip + ota.json 갱신)
#   ⑤ 전체 커밋 → 현재 기능 브랜치 push
#   ⑥ main 머지·push 후 원래 브랜치 복귀
# ──────────────────────────────────────────────────────────────
set -e
cd "$(dirname "$0")"
MSG="${1:?사용법: sh deploy.sh \"변경 요약\"}"

# ① 서비스워커 캐시 버전 +1 (루트 sw.js가 원본 — build-ota가 www로 복사)
CUR=$(grep -o "seoraksan-v[0-9]*" sw.js | head -1 | sed 's/seoraksan-v//')
NEXT=$((CUR+1))
sed -i.bak "s/seoraksan-v$CUR/seoraksan-v$NEXT/" sw.js && rm -f sw.js.bak

# ② OTA 버전: 오늘 날짜 + 마지막 빌드번호 +1  (예: 2026.07.12.98)
OLD=$(grep -o "const OTA_VER='[^']*'" www/app.js | head -1 | sed "s/const OTA_VER='//;s/'//")
BUILD=$(echo "$OLD" | awk -F. '{print $NF}')
NEWV="$(date +%Y.%m.%d).$((BUILD+1))"
sed -i.bak "s/const OTA_VER='$OLD'/const OTA_VER='$NEWV'/" www/app.js && rm -f www/app.js.bak

# ③ www → 루트 미러
for f in index.html style.css app.core.js app.map.js app.rescue.js app.report.js app.ops.js app.js park-boundary.json equip-seed.json equip-seed-photos.json; do
  cp -f "www/$f" "$f"
done

# ④ OTA 번들 (bundle.zip + ota.json, sw.js도 www로 동기화됨)
#    ota.json notes는 JSON 문자열이므로 커밋 메시지 첫 줄만, 따옴표·역슬래시 제거해 전달
NOTE=$(printf '%s' "$MSG" | head -1 | tr -d '"\\')
sh build-ota.sh "$NOTE"

# ⑤ 커밋 + 기능 브랜치 push
BR=$(git rev-parse --abbrev-ref HEAD)
git add -A
git commit -m "$MSG"
git push -u origin "$BR"

# ⑥ main 머지·push 후 복귀
git checkout main
git merge "$BR" --no-edit
git push -u origin main
git checkout "$BR"

echo "✅ 배포 완료 — 캐시 v$NEXT · OTA $NEWV · main 반영"
