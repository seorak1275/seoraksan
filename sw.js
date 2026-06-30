'use strict';
// ──────────────────────────────────────────────
// 설악산 현장관리 Service Worker
// - PWA 오프라인 캐싱 (app shell)
// - FCM 백그라운드 메시지 수신 → 시스템 알림 표시
// ──────────────────────────────────────────────
const _CACHE = 'seoraksan-v49';
// 프로젝트 경로(/seoraksan/) 배포이므로 반드시 상대 경로 사용
// v10: 단일 index.html → index.html + style.css + app.js 분리에 따라 셸 캐시에 추가
const _SHELL = ['./', './index.html', './style.css', './app.core.js', './app.map.js', './app.rescue.js', './app.report.js', './app.ops.js', './app.js', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

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
      .then(ks => Promise.all(ks.filter(k => k !== _CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: network-first + 오프라인 폴백 ────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // 동일 출처만 캐싱 (Firebase, Kakao CDN 제외)
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
  if (!e.data || e.data.type !== 'SHOW_NOTI') return;
  self.registration.showNotification(e.data.title || '설악산 현장관리', {
    body:    e.data.body  || '',
    icon:    'icons/icon-192.png',
    tag:     e.data.tag   || 'noti',
    vibrate: [200, 100, 200],
  });
});
