# 설악산 현장관리 PWA — 개발 규칙

## 배포 규칙 (필수)

**모든 커밋 후 반드시 main 병합·푸시할 것.**

GitHub Pages(`seorak1275.github.io/seoraksan`)는 `main` 브랜치를 서빙한다.
(계정: `seorak1275` — 프로젝트 저장소라 URL 뒤 `/seoraksan` 경로는 GitHub 규칙상 필수.
카카오 개발자 콘솔에는 경로 없이 origin `https://seorak1275.github.io`만 등록하면 됨)
기능 브랜치(세션마다 이름이 다름)에만 커밋하면 웹앱에 반영되지 않는다.

### 작업 순서 (원클릭 배포)
1. 현재 세션의 기능 브랜치에서 `www/` 수정 → `node --check`로 문법 확인
2. **배포는 한 줄** (커밋 메시지를 인자로):
   ```
   sh deploy.sh "변경 요약"
   ```
   deploy.sh가 전부 자동 수행: `sw.js` `_CACHE` +1 → `OTA_VER` 오늘날짜.빌드+1 →
   www→루트 미러(9개) → build-ota.sh(bundle.zip·ota.json) → 커밋 → 기능 브랜치 push →
   **main 머지·push** → 기능 브랜치 복귀.
   여러 요청은 모아서 한 번에 배포할 것(요청마다 배포 금지 — 토큰·클라이언트 캐시 낭비).
3. (참고) OTA: 설치된 앱이 ota.json을 보고 bundle.zip을 받아 자체 교체. 재빌드 불필요.
   최초 1회만 빌드 담당이 `npm install` 후 APK 재빌드 필요(Capgo 플러그인 포함)

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
- `sw.js` — 서비스워커. 셸 캐시(`_SHELL`)에 위 JS 6개 모두 포함. 구조 변경 시 `_CACHE` 버전 올릴 것.
  카카오 타일 캐시 `_TILES`(daumcdn 이미지 cache-first — 배포·버전업에도 유지, 오프라인 지도)
- Firebase Firestore: 실시간 동기화 (`_SHARED_DOC`, `_SHARED_COLL`)
- Kakao Maps SDK (appkey: `4ba2cd810d516a4f336d4dee5fa5eba5`)

### 편집 시 주의
- 기능/JS 수정 → 해당 기능 파일만 (예: 지도=`app.map.js`, 조난자·로그인·OTA=`app.js`, 관리자=`app.ops.js`)
- 새 파일 추가/분리 경계 변경 시 → `index.html` `<script>` 순서 + `sw.js` `_SHELL` + 루트 미러 cp 함께 갱신
- 즉시 실행(부팅) 코드는 `app.core.js`에 모여 있음 — 다른 파일이 로드 시점에 `app.core.js`의 함수를 호출하지 않도록 주의(setTimeout/onload 등 지연 호출은 안전)
- 디자인/CSS 수정 → `www/style.css`
- 화면 구조/모달 마크업 → `www/index.html`
- 인라인 스크립트(카카오맵·로딩)는 `www/index.html` 헤드에 그대로 둘 것(로드 타이밍)

## 기능 색인 (탐색 절약용 — grep 전에 여기부터 볼 것)

- **app.core.js** (1.4k줄): DB 동기화(`DB.g/DB.s`, `_SHARED_COLL`=rescues·hazards·facilities·history·facIssues, `_SHARED_DOC` 목록, 오프라인 큐 `_syncQ`/`_flushSyncQueue`/`_showSyncQueueInfo`, 저장불가·10회실패는 데드레터 `_syncQDead`로 격리해 무한재시도·경고 중단 `_markSyncFail`) · 알림(`pushNoti` — `opts.adminOnly`/`opts.targetKakaoIds` 대상지정, 전체 OS푸시 `_sendFcmPush`·특정인 필수푸시 `_sendFcmPushToKakao`(탈퇴 통보 등, 앱 꺼져도 수신·안드로이드), `NOTI_GROUPS` 카테고리, `sharedNotis` 수신 리스너 ~600행, 벨 `openNoti`/`_pruneOldNotis` 7일 자동삭제, `goNotiLink`) · 사진(**Firebase Storage 미프로비저닝 → 데이터URL로 압축해 Firestore 기록에 직접 저장**: `prevImg`→`_compressToDataUrl`(문서 1MB 한계로 maxLen 제한, 다중첨부는 용량가드), 표시는 `_facPhotoView` 라이트박스; `uploadImageToStorage`/`_processPhotoQueue`는 레거시 큐용) · 이전/다음 버튼(`_navOrder`/`_navBtns`) · 뷰포트 변화 시 지도 relayout(`_fixAppHeight`+`_relayoutMaps`/`_onViewportChange` — 주소창 접힘·회전·복귀로 카카오 내부크기 stale→지도 터치먹통 방지, visualViewport 포함) · 유령 오버레이 방어(`_ghostOverlayGuard` — 투명해진 채 안 지워진 body직속 전체화면 백드롭이 전역 터치 삼키는 먹통 자가복구, 탭 시 pointer-events off) · `now`/`today`/`getAuthor`
- **app.map.js** (2.0k줄): `openApp`/`switchTab`(하단탭 nv1~4, nv4=담당 업무함 표시조건) · `showV`/`rMaps` · 상황판(`openBoard` — v-board를 body로 이동, `_createBoardMap`, `toggleBoardMapType`) · 공원경계(`_drawParkBoundary`) · 구조지도 클러스터(`_reclusterRescue`/`_clusterByPixels`/`_showClusterList`) · 시설물 겹친핀 선택(`_facPinTap`→`_facOverlapGroup` 22px내 겹침 감지→축소상태면 `_clusterZoom` 확대 분리, 최대확대·25m내면 `_showFacOverlapList` 하단 목록 시트, `_pickFacOverlap`/`_closeFacOverlapSheet`; 숫자 뭉치기 없음) · 해발고도(`_elevStr`→GPS실측 우선, 없으면 오픈메테오 DEM `_fetchElev` 캐시·placeholder 채움; plain=문서용) · 오프라인 지도 미리받기(`preloadParkTiles` — 숨은 지도 자동 팬으로 타일 선적재, `clearTileCache`; 설정 카드는 app.js renderSettings) · `_esc`/`_escq` · `_showAdminDenied`
- **app.rescue.js** (1.3k줄): 권한 헬퍼 전부(`_canManageFac`=시설과+개발자, `_isMasterAdmin`, `_isDeveloper`, `_isMember`, `_isFacManager`/`_facManagers`) · 접근 게이트 `_enforceAccessGate` · 구조 목록 `renderResList` · 팀 칩 `_rebuildTeamChips`/`_showTeamChipPopup` · `_facVisibleTo`(숨김 시설)
- **app.report.js** (2.3k줄): 십자선 · 구조 1~N보 폼/제출 · hwpx 보고서 생성(줄바꿈=hp:p 분할) · 처리현황 다운로드
- **app.ops.js** (3.3k줄): 위험요소(hazard) ~130행 · 시설물(지도 `renderInspectMap`, 팝업 `openFacFromMap`, 목록 `renderFacList`, 상세 `openFacDetail`, 경고표시 `openFacWarn`/`saveFacWarn`, 숨김 `toggleFacHide`, 등록 `openAddFac`/`submitAddFac`) · **점검 워크플로** ~620행부터(`FAC_GRADES` A~E, `FAC_ISTAGE` 4단계, `INSPECT_TAGS` 점검태그, 신고 `openFacIssueReport`/`submitFacIssue`, 상세 `openFacIssueDetail`, 처리 코어 `_facIssueReviewCore`/`_facIssueZoneCore`/`_facIssueDeptCore`/`_facIssueDeptPlanCore`(조치예정일), 목록 `renderFacIssues`) · **담당 업무함**(`renderFacWork`, `_facWorkVisible`, `_updateFacWorkBadge`, 인라인폼 `fw*` — 모달 `fi*`와 ID 분리) · 특보운영(`ALERT_REQS`/`ALERT_GROUPS`, `openAlertHistory`, 자동동기화 `_syncAutoAlerts`; **특보 이력 로그 `alertLog`**=발효~해제 영구기록 `_alertLogOpen`/`_alertLogSyncStage`/`_alertLogEnd`/`_alertLogEndOp`/`_migrateAlertLog` — 자동·수동 해제로 사라지던 기록 보존, 통계 `_renderAlertStats`가 이 로그로 집계+발효이력 목록) · 관리자(직원 `renderAdmMembers` ~2200행 — 🔧담당자 `_toggleFacManager`, ACL `_getAcl`/`_aclSetRole`, 자동승인 `_autoApproveSweep`, 시스템 `renderAdmSys`/오류기록)
- **app.js** (3.4k줄): 설정 `renderSettings` · **🧗암벽 이용관리**(홈메뉴 버튼 `mbClimb`→`openClimb` 전체화면 패널, 탭 `climbTab` 당일명단`_renderClimbRoster`(지구·코스별 인적사항·전화)/통계`_renderClimbStats`; `climbUpload`→SheetJS 지연로드 `_loadXlsx`·헤더명 파서 `_climbParseWB`·이용일자별 `_climbSave`→`climbUsage` 컬렉션+커버리지 `climbDates`; 특보·우천 일괄취소 `climbCancelDate`→`climbCancels`(재업로드 유지·통계제외); 시즌 5.16~11.14 `_climbInSeason`; **열람=전직원 `_canClimbView`, 업로드·취소=특수산악구조대·관리자 `_canClimbManage`**; 코스→지구 `CLIMB_DISTRICTS`; 명단PII는 전체동기화 X·요청상 전직원 열람) · 카카오 로그인/인증 · KMA 특보 수신(`_parseKmaWarnings` EUC-KR·코드포맷, `_SETAK_REGIONS` 지역필터, `kmaWarnDiag` 진단) · 24h 경과알림 `_checkStaleRescues`(작성자에게만) · 카톡 자기메시지 `_sendKakaoSelf` · 통계 · 응소 · 🆘SOS · **OTA(`OTA_VER` ~2787행 — deploy.sh가 자동 증가)** · `window.onload` 부팅
- **index.html**: 뷰 `v-*`(inspect-map/list/stats/work…) · 모달 `modal*`(FacIssue=점검등록, FacIssueDetail) · 하단네비 `nv1~4`(nv4=담당+배지) · 알림패널 ~206행
- **style.css**: 맨 위=터치/선택 규칙(지도만 user-select 금지, `.sel-ok` 예외) · `.ni` 알림 · `.dbcard` 바텀시트(닫힘 시 pointer-events:none) · `.navi` 하단탭

## 보안 (절대 변경 금지)

- Master admin: `_MASTER_ID='yraphael@kakao.com'`
- Master PH: `21fe2594c32497629b4b6e5da35e3e8d613f4453c29e3c6db6d68de6f1892894`
- Admin PH(dnjs1209!): `5ea963a2abe59fd456f6b4b2bcb7b095acdc2fbf8f3a460f949a5649187cb211`
