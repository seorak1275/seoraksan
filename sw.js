'use strict';
// ──────────────────────────────────────────────
// 설악산 현장관리 Service Worker
// - PWA 오프라인 캐싱 (app shell)
// - FCM 백그라운드 메시지 수신 → 시스템 알림 표시
// ──────────────────────────────────────────────
const _CACHE = 'seoraksan-v156';
// 지도 타일 캐시(2단) — 셸 버전과 무관하게 유지(배포해도 안 지움). 한 번 본 타일은 오프라인·저속에서도 즉시 표시
// park: '설악산 인근 미리받기'분 보관 — 다른 지역 열람에 밀려나지 않음
// recent: 일반 열람 임시 저장 — 소량만 유지(전국을 둘러봐도 이 상한까지만, 오래된 것부터 자동 정리)
const _TILES_PARK = 'seoraksan-tiles-park-1';
const _TILES_RECENT = 'seoraksan-tiles-recent-1';
const _PARK_MAX = 6000, _RECENT_MAX = 1500;
let _parkModeUntil = 0; // 미리받기 진행 중 표시 — 클라이언트가 스텝마다 갱신(TILE_MODE_PARK 메시지)
// 프로젝트 경로(/seoraksan/) 배포이므로 반드시 상대 경로 사용
// v10: 단일 index.html → index.html + style.css + app.js 분리에 따라 셸 캐시에 추가
const _SHELL = ['./', './index.html', './style.css', './app.core.js', './app.map.js', './app.rescue.js', './app.report.js', './app.ops.js', './app.js', './park-boundary.json', './tpl-status.hwpx', './tpl-trend.hwpx', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

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
        // ignoreSearch: 타일 URL에 버전·타임스탬프 쿼리가 붙어도 '봤던 위치'로 인식해 재사용 (재방문 시 재다운로드 방지)
        const park = await caches.open(_TILES_PARK);
        let hit = await park.match(e.request, { ignoreSearch: true });
        if (hit) return hit;
        const recent = await caches.open(_TILES_RECENT);
        hit = await recent.match(e.request, { ignoreSearch: true });
        if (hit) return hit;
        const res = await fetch(e.request);
        if (res && (res.ok || res.type === 'opaque')) {
          const isPark = Date.now() < _parkModeUntil; // 미리받기 중이면 보관함, 아니면 임시함
          const c = isPark ? park : recent, max = isPark ? _PARK_MAX : _RECENT_MAX;
          // 저장 실패(용량 초과 등) 시 절반으로 정리 — 지도 표시 자체는 계속
          c.put(e.request, res.clone()).catch(() => _pruneTiles(c, Math.floor(max / 2)));
          if (Math.random() < 0.03) _pruneTiles(c, max);
        }
        return res;
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
