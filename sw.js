'use strict';
// ──────────────────────────────────────────────
// 설악산 현장관리 Service Worker
// - PWA 오프라인 캐싱 (app shell)
// - FCM 백그라운드 메시지 수신 → 시스템 알림 표시
// ──────────────────────────────────────────────
const _CACHE = 'seoraksan-v364';
// 지도 타일 캐시(2단) — 셸 버전과 무관하게 유지(배포해도 안 지움). 한 번 본 타일은 오프라인·저속에서도 즉시 표시
// park: '설악산 인근 미리받기'분 보관 — 다른 지역 열람에 밀려나지 않음
// recent: 일반 열람 임시 저장 — 소량만 유지(전국을 둘러봐도 이 상한까지만, 오래된 것부터 자동 정리)
const _TILES_PARK = 'seoraksan-tiles-park-1';
const _TILES_RECENT = 'seoraksan-tiles-recent-1';
const _PARK_MAX = 14000, _RECENT_MAX = 20000; // 용량을 쓰더라도 재다운로드(깜빡임)를 없애는 방향 — 여유는 _quotaOk가 감시
// 저장공간 여유 확인(30초 캐시) — 여유가 없으면 저장 시도 자체를 생략해 '실패→정리 스캔' 반복(버벅임)을 차단
let _quotaOkCache = { ok: true, at: 0 };
async function _quotaOk() {
  const now = Date.now();
  if (now - _quotaOkCache.at < 30000) return _quotaOkCache.ok;
  _quotaOkCache.at = now;
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      _quotaOkCache.ok = !est.quota || est.usage < est.quota * 0.9;
    }
  } catch (e) { _quotaOkCache.ok = true; }
  return _quotaOkCache.ok;
}
// 타일 fetch 모드: null=미확인, true=CORS 가능(비불투명 응답 → 캐시 용량 정확·대량 저장), false=opaque 폴백.
// opaque(no-cors) 응답은 크롬이 용량 계산 시 큰 패딩을 붙여, 타일 몇천장이면 저장할당량을 초과해
// put이 계속 실패 → 방금 본 타일도 캐시에 안 남아 확대/축소 때마다 다시 하얗게 받는 문제의 근본원인.
// CORS로 받으면 실제 크기로만 계산돼 훨씬 많이 저장된다(daumcdn이 CORS 허용 시).
let _tileCorsMode = null, _tileCorsFails = 0;
async function _fetchTile(req) {
  if (_tileCorsMode !== false) {
    try {
      const r = await fetch(req.url, { mode: 'cors', credentials: 'omit' });
      if (r && r.ok) { _tileCorsMode = true; return r; }
      // 응답은 왔지만 실패(403 등) — 확정 전이면 몇 번 보고 CORS 포기(매 타일 2중 요청 방지)
      if (_tileCorsMode === null && ++_tileCorsFails >= 3) _tileCorsMode = false;
    } catch (_) { if (_tileCorsMode === null) _tileCorsMode = false; }
  }
  return fetch(req); // CORS 미지원 → 기존 방식(opaque)
}
// 저장 실패(할당량 초과) 시: 고정 목표가 아니라 '현재 보관량의 절반'으로 줄이고 1회 재시도.
// opaque 응답은 브라우저가 용량 계산에 큰 패딩을 붙여 실제 할당량이 몇백 장일 수 있는데,
// 예전 로직(max/2 고정)은 그보다 커서 영원히 저장 실패 → 확대/축소 때마다 재다운로드되던 웹 증상의 원인.
// 절반씩 적응적으로 줄이면 몇 번의 실패 후 그 기기 할당량에 맞는 크기로 자리잡아 이후 저장이 계속 성공한다.
function _putAdaptive(c, req, res) {
  const first = res.clone(), retry = res.clone();
  return c.put(req, first).catch(() =>
    c.keys().then(ks => {
      const target = Math.max(50, Math.floor(ks.length / 2));
      return Promise.all(ks.slice(0, Math.max(0, ks.length - target)).map(k => c.delete(k)));
    }).then(() => c.put(req, retry)).catch(() => {})
  );
}
let _parkModeUntil = 0; // 미리받기 진행 중 표시 — 클라이언트가 스텝마다 갱신(TILE_MODE_PARK 메시지)
// 프로젝트 경로(/seoraksan/) 배포이므로 반드시 상대 경로 사용
// v10: 단일 index.html → index.html + style.css + app.js 분리에 따라 셸 캐시에 추가
const _SHELL = ['./', './index.html', './style.css', './app.core.js', './app.map.js', './app.rescue.js', './app.report.js', './app.ops.js', './app.js', './park-boundary.json', './tpl-status.hwpx', './tpl-trend.hwpx', './tpl-safety.hwpx', './manifest.json', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png', './patrol-map.jpg', './splash.jpg', './staff-roster.json', './park-zones.json', './park-usezones.json'];

// Firebase Messaging SDK (SW 컨텍스트용)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:"AIzaSyACBoT-h2h0aQXYJpPyznc3JBzprEhhUAw",
  authDomain:"seoraksan.firebaseapp.com",
  projectId:"seoraksan",
  storageBucket:"seoraksan.firebasestorage.app",
  messagingSenderId:"457414135264",
  appId:"1:457414135264:web:4103268ba0702a95a12f85"
});

const messaging = firebase.messaging();

// ── 설치: app shell 캐싱 ────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(_CACHE).then(c => c.addAll(_SHELL))
  );
});

// ── 활성화: 구버전 캐시 정리 ───────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== _CACHE && k !== _TILES_PARK && k !== _TILES_RECENT).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 타일 캐시 정리 — Cache keys()는 삽입 순 → 앞(오래된 것)부터 삭제해 max장만 유지
function _pruneTiles(c, max) {
  return c.keys().then(ks => {
    if (ks.length <= max) return;
    return Promise.all(ks.slice(0, ks.length - max).map(k => c.delete(k)));
  }).catch(() => {});
}

// ── Fetch: network-first + 오프라인 폴백 ────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // ── 카카오맵 리소스: 오프라인 지도 캐시 ──────
  // 타일(이미지)=cache-first: 한 번 본 지도는 저속·오프라인에서도 즉시 표시.
  // SDK 스크립트·CSS=network-first: 평소엔 최신 유지, 오프라인엔 캐시 폴백.
  if (/(^|\.)daumcdn\.net$/.test(url.hostname) || url.hostname === 'dapi.kakao.com') {
    const isImg = e.request.destination === 'image' || /\.(png|jpe?g|webp|gif)$/i.test(url.pathname);
    if (isImg) {
      e.respondWith((async () => {
        // 한 번 본 타일은 무조건 자체 캐시에서 즉시 — HTTP 캐시는 타일 주소의 버전·타임스탬프
        // 쿼리가 바뀌면 미스가 나 다시 받지만(깜빡임), ignoreSearch 매칭은 '봤던 위치'로 인식해 재사용.
        const park = await caches.open(_TILES_PARK);
        let hit = await park.match(e.request, { ignoreSearch: true });
        if (hit) return hit;
        const recent = await caches.open(_TILES_RECENT);
        hit = await recent.match(e.request, { ignoreSearch: true });
        if (hit) return hit;
        try {
          const res = await _fetchTile(e.request); // CORS 우선(용량 정확·대량 저장) → 실패 시 opaque
          if (res && (res.ok || res.type === 'opaque')) {
            const isPark = Date.now() < _parkModeUntil; // 미리받기 중이면 보관함, 아니면 열람함
            const c = isPark ? park : recent, max = isPark ? _PARK_MAX : _RECENT_MAX;
            if (await _quotaOk()) { // 저장공간 여유 있을 때만 저장(실패 반복으로 인한 버벅임 방지)
              _putAdaptive(c, e.request, res); // 그래도 실패하면 보관량 절반으로 줄여 재시도(할당량 자동 적응)
              if (Math.random() < 0.02) e.waitUntil(_pruneTiles(c, max));
            }
          }
          return res;
        } catch (err) {
          // 오프라인 폴백: 저장분 아무 캐시에서나
          const any = await caches.match(e.request, { ignoreSearch: true });
          if (any) return any;
          throw err;
        }
      })());
    } else {
      // SDK 스크립트·CSS — 몇 개 안 되고 오프라인 지도 부팅에 필수라 열람 타일에 안 밀리는 보관함에 저장
      e.respondWith(
        fetch(e.request).then(res => {
          if (res && (res.ok || res.type === 'opaque')) {
            const clone = res.clone();
            caches.open(_TILES_PARK).then(c => c.put(e.request, clone).catch(() => {}));
          }
          return res;
        }).catch(() => caches.match(e.request))
      );
    }
    return;
  }
  // 그 외 교차 출처는 관여하지 않음 (Firebase 등)
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(_CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── FCM 백그라운드 메시지 → 시스템 알림 ────────
messaging.onBackgroundMessage(payload => {
  const n = payload.notification || {};
  const title = n.title || '설악산 현장관리';
  const body  = n.body  || '';
  return self.registration.showNotification(title, {
    body,
    icon:    'icons/icon-192.png',
    badge:   'icons/icon-192.png',
    tag:     (payload.data && payload.data.type) || 'noti',
    data:    payload.data || {},
    vibrate: [200, 100, 200],
  });
});

// ── 알림 탭 → 앱 포커스 ─────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        const app = clients.find(c =>
          c.url.includes(self.location.origin) && 'focus' in c
        );
        if (app) return app.focus();
        return self.clients.openWindow('./');
      })
  );
});

// ── 메인 스레드 → SW 직접 알림 요청 ──────────────
self.addEventListener('message', e => {
  // 미리받기 진행 신호 — 이후 20초간 받는 타일을 '설악산 보관함'에 저장 (스텝마다 갱신됨)
  if (e.data && e.data.type === 'TILE_MODE_PARK') { _parkModeUntil = Date.now() + 20000; return; }
  if (!e.data || e.data.type !== 'SHOW_NOTI') return;
  self.registration.showNotification(e.data.title || '설악산 현장관리', {
    body:    e.data.body  || '',
    icon:    'icons/icon-192.png',
    tag:     e.data.tag   || 'noti',
    vibrate: [200, 100, 200],
  });
});
