// ══════════════════════════════════════════════════════════════
// 설악산 현장관리 — FCM 푸시 발송기 + 보안 게이트 (Google Apps Script)
//
// ★ 2026-07 보안 강화판 — 적용 방법 (기존 배포 스크립트 기준):
//   1) 이 파일의 doPost / _getSecrets / _verifyIdToken / _rateLimited 를
//      기존 스크립트에 덮어쓰기(또는 추가). ⚠️ 기존 스크립트에 mintToken(로그인
//      토큰 발급) 코드가 있으면 그 함수는 절대 지우지 말 것 — 아래 doPost가
//      handleMintToken(req) 이름으로 위임 호출한다. 기존 mintToken 처리 블록을
//      function handleMintToken(req){...} 로 감싸 이름만 맞춰주면 된다.
//   2) 프로젝트 설정 > 스크립트 속성에 아래 키 추가:
//        SECRET          = 새 공유 시크릿(길고 랜덤하게)  ← 앱 관리자 설정의 '공유 비밀번호'와 동일하게
//        SECRET_OLD      = (로테이션 중에만) 직전 시크릿 — 전 기기 업데이트 후 삭제
//        REQUIRE_AUTH    = 0   ← 전 기기가 새 앱(ID토큰 동봉)으로 업데이트된 뒤 1로 변경
//        FIREBASE_API_KEY= Firebase 웹 API 키 (ID토큰 검증용)
//   3) 배포 > 배포 관리 > 기존 배포 '수정' > 새 버전 → URL 유지된 채 코드만 교체됨
//
// 보안 계층:
//   · 시크릿: 코드 하드코딩 금지 — 스크립트 속성에서 읽음(로테이션 가능, 구/신 동시 허용)
//   · ID토큰: 앱이 Firebase 로그인 ID토큰을 동봉 → 서버가 검증. REQUIRE_AUTH=1이면
//     검증 실패 요청은 시크릿이 맞아도 거부(시크릿 유출 대비 2중 잠금)
//   · 레이트리밋: 분당 전체 60회·사용자당 20회 초과 시 거부(스팸·마비 공격 차단)
// ══════════════════════════════════════════════════════════════

// Firebase 프로젝트 ID
var PROJECT_ID = 'seoraksan';

// (레거시 폴백) 스크립트 속성 SECRET 미설정 시에만 사용 — 설정 후엔 무시됨
var SHARED_SECRET = 'CHANGE-ME-설악산-비밀번호';

// ── 시크릿: 스크립트 속성 우선(로테이션: SECRET_OLD 병행 허용) ──
function _getSecrets() {
  var p = PropertiesService.getScriptProperties();
  var s = [];
  var cur = p.getProperty('SECRET');
  var old = p.getProperty('SECRET_OLD');
  if (cur) s.push(cur);
  if (old) s.push(old);
  if (!s.length && SHARED_SECRET) s.push(SHARED_SECRET);
  return s;
}

// ── Firebase ID토큰 검증 — 유효하면 uid, 아니면 '' ──
function _verifyIdToken(idToken) {
  if (!idToken) return '';
  var key = PropertiesService.getScriptProperties().getProperty('FIREBASE_API_KEY');
  if (!key) return '';
  try {
    var res = UrlFetchApp.fetch(
      'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + key,
      { method: 'post', contentType: 'application/json',
        payload: JSON.stringify({ idToken: idToken }), muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return '';
    var users = (JSON.parse(res.getContentText()).users) || [];
    if (!users.length || users[0].disabled) return '';
    return users[0].localId || '';
  } catch (e) { return ''; }
}

// ── 레이트리밋: 분당 전체 60회 · 사용자(uid 또는 익명)당 20회 ──
function _rateLimited(uid) {
  try {
    var c = CacheService.getScriptCache();
    var m = Math.floor(Date.now() / 60000);
    var gk = 'rl_g_' + m, uk = 'rl_u_' + (uid || 'anon') + '_' + m;
    var g = parseInt(c.get(gk) || '0', 10) + 1;
    var u = parseInt(c.get(uk) || '0', 10) + 1;
    c.put(gk, String(g), 120); c.put(uk, String(u), 120);
    return g > 60 || u > 20;
  } catch (e) { return false; }
}

function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);

    // ① 시크릿(구/신 허용) — 1차 차단막
    var secrets = _getSecrets();
    if (secrets.length && secrets.indexOf(req.secret) < 0) {
      return _json({ error: 'unauthorized' });
    }

    // ② 로그인(mintToken)은 기존 로직에 위임 — 카카오 토큰을 자체 검증하므로 여기서 종료
    if (req.action === 'mintToken') {
      if (typeof handleMintToken === 'function') return handleMintToken(req);
      return _json({ error: 'mintToken_not_installed' }); // 기존 mintToken 블록을 handleMintToken으로 감싸주세요
    }

    // ③ 푸시 발송 — ID토큰 검증(REQUIRE_AUTH=1이면 필수) + 레이트리밋
    var uid = _verifyIdToken(req.idToken);
    var requireAuth = PropertiesService.getScriptProperties().getProperty('REQUIRE_AUTH') === '1';
    if (requireAuth && !uid) return _json({ error: 'auth_required' });
    if (_rateLimited(uid)) return _json({ error: 'rate_limited' });

    var tokens = req.tokens || [];
    if (tokens.length > 500) tokens = tokens.slice(0, 500); // 폭주 방지 상한
    var title  = req.title  || '설악산 현장관리';
    var body   = req.body   || '';
    var rawData = req.data  || {};

    // FCM data 필드는 모든 값이 문자열이어야 함
    var data = {};
    Object.keys(rawData).forEach(function (k) {
      data[k] = String(rawData[k] == null ? '' : rawData[k]);
    });

    var accessToken = ScriptApp.getOAuthToken();
    var url = 'https://fcm.googleapis.com/v1/projects/' + PROJECT_ID + '/messages:send';

    var sent = 0;
    var invalid = [];

    tokens.forEach(function (tok) {
      var message = {
        message: {
          token: tok,
          notification: { title: title, body: body },
          data: data,
          android: {
            priority: 'high',
            notification: {
              channel_id: 'seoraksan_alerts',
              sound: 'default',
              default_vibrate_timings: true
            }
          }
        }
      };

      var res = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + accessToken },
        payload: JSON.stringify(message),
        muteHttpExceptions: true
      });

      var code = res.getResponseCode();
      if (code === 200) {
        sent++;
      } else {
        var txt = res.getContentText();
        // 만료/삭제된 토큰 → 앱이 정리하도록 돌려줌
        if (code === 404 ||
            txt.indexOf('UNREGISTERED') >= 0 ||
            txt.indexOf('INVALID_ARGUMENT') >= 0) {
          invalid.push(tok);
        }
      }
    });

    return _json({ ok: true, sent: sent, invalid: invalid });
  } catch (err) {
    return _json({ error: String(err) });
  }
}

// 브라우저로 URL 열었을 때 상태 확인용
function doGet() {
  return _json({ status: '설악산 FCM 푸시 발송기 작동중' });
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ══════════════════════════════════════════════════════════════
// 기상특보 24시간 감시 — 앱이 모두 꺼져 있어도 서버가 감지해 전 기기 푸시
//
// 설정(1회, PUSH_SETUP.md 참고):
//   1) 이 파일 전체를 Apps Script 프로젝트에 붙여넣고 저장
//   2) 편집기에서 watchKmaWarnings 를 한 번 [실행]해 권한 승인
//   3) 좌측 ⏰(트리거) > 트리거 추가:
//      함수 watchKmaWarnings · 시간 기반 · 분 단위 · 10분마다
//
// 앱(클라이언트)의 자동발령·인앱알림은 그대로 동작한다. 이 감시는
// '아무도 앱을 보고 있지 않을 때'를 위한 백업 푸시이며, 클라이언트
// 감지와 겹치면 같은 특보 푸시가 최대 2번 갈 수 있다(무해).
// ══════════════════════════════════════════════════════════════
var KMA_AUTH_KEY = 'S3Nk1fdqSpqzZNX3anqaWA';
var KMA_SETAK_REGIONS = ['속초','고성','양양','인제','설악','강원북부산지','북부산지'];

function watchKmaWarnings() {
  var txt;
  try {
    var res = UrlFetchApp.fetch(
      'https://apihub.kma.go.kr/api/typ01/url/wrn_now_data_new.php?authKey=' + KMA_AUTH_KEY + '&disp=1',
      { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return;
    txt = res.getBlob().getDataAsString('EUC-KR');
  } catch (e) { return; }

  // typ01 정상 응답 마커가 없으면(에러 페이지 등) 상태 유지 — '특보 없음'으로 오인 금지
  if (!txt || !(txt.indexOf('START7777') >= 0 || txt.indexOf('REG_UP') >= 0)) return;

  var cur = _kmaParseWatch(txt); // 예: {'호우':'경보','강풍':'주의보'}
  var sig = Object.keys(cur).sort().map(function (t) { return t + ':' + cur[t]; }).join('|');
  var props = PropertiesService.getScriptProperties();
  var prev = props.getProperty('kmaSig');
  if (prev === sig) return;      // 변화 없음
  props.setProperty('kmaSig', sig);
  if (prev === null) return;     // 최초 실행: 기준만 저장, 알림 없음

  var prevMap = {};
  (prev || '').split('|').forEach(function (p) {
    if (!p) return;
    var i = p.indexOf(':');
    prevMap[p.slice(0, i)] = p.slice(i + 1);
  });
  var added = [], changed = [], removed = [];
  Object.keys(cur).forEach(function (t) {
    if (!(t in prevMap)) added.push(t + cur[t]);
    else if (prevMap[t] !== cur[t]) changed.push(t + ' ' + prevMap[t] + '→' + cur[t]);
  });
  Object.keys(prevMap).forEach(function (t) { if (!(t in cur)) removed.push(t + prevMap[t]); });

  var msg = [];
  if (added.length)   msg.push('발령 ' + added.join(', '));
  if (changed.length) msg.push('변경 ' + changed.join(', '));
  if (removed.length) msg.push('해제 ' + removed.join(', '));
  if (!msg.length) return;

  var tokens = _fetchPushTokens('op_kma'); // 기상특보 알림을 끈 기기는 제외
  if (tokens.length) _sendFcmToTokens(tokens, '📡 기상특보 (설악산 관할)', msg.join(' / '), { app: 'alert' });
}

// wrn_now_data_new.php 파싱 — 앱의 _parseKmaWarnings 축약판 (종류별 최고 등급만)
function _kmaParseWatch(txt) {
  var types = ['호우','강풍','대설','태풍','폭풍해일','한파','폭염','풍랑','건조','황사'];
  var CODE = { W:'강풍', R:'호우', C:'한파', D:'건조', O:'폭풍해일', V:'풍랑', T:'태풍', S:'대설', Y:'황사', H:'폭염' };
  var rank = { '예비':0, '주의보':1, '경보':2 };
  var out = {};
  txt.split('\n').forEach(function (line) {
    var l = line.trim();
    if (!l || l.charAt(0) === '#' || /^[A-Z_,\s]+$/.test(l)) return;
    var f = l.split(',').map(function (x) { return x.trim(); });
    if (f.length < 8) {
      var f2 = l.split(/[\s,]+/).filter(function (x) { return x !== ''; });
      if (f2.length > f.length) f = f2;
    }
    var region = (f[1] || '') + ' ' + (f[3] || '');
    if (!KMA_SETAK_REGIONS.some(function (k) { return region.indexOf(k) >= 0; })) return;
    var wrnRaw = f[6] || '', lvlRaw = f[7] || '';
    var type = '';
    types.forEach(function (t) { if (!type && wrnRaw.indexOf(t) >= 0) type = t; });
    if (!type && CODE[wrnRaw.toUpperCase()]) type = CODE[wrnRaw.toUpperCase()];
    if (!type) types.forEach(function (t) { if (!type && l.indexOf(t) >= 0) type = t; });
    if (!type) return;
    var lvl = '';
    if (lvlRaw.indexOf('예비') >= 0) lvl = '예비';
    else if (lvlRaw.indexOf('경보') >= 0) lvl = '경보';
    else if (lvlRaw.indexOf('주의보') >= 0) lvl = '주의보';
    else if (lvlRaw === '2') lvl = '경보';
    else if (lvlRaw === '1') lvl = '주의보';
    if (!lvl) return;
    if (!(type in out) || rank[lvl] > rank[out[type]]) out[type] = lvl;
  });
  return out;
}

// Firestore REST로 fcmTokens 읽기 (cat 알림을 명시적으로 끈 기기는 제외)
function _fetchPushTokens(cat) {
  var tokens = [];
  try {
    var res = UrlFetchApp.fetch(
      'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents/fcmTokens?pageSize=300',
      { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return tokens;
    var docs = JSON.parse(res.getContentText()).documents || [];
    docs.forEach(function (d) {
      var fl = d.fields || {};
      var tok = fl.token && fl.token.stringValue;
      if (!tok) return;
      var ns = fl.notiSetting && fl.notiSetting.mapValue && fl.notiSetting.mapValue.fields;
      if (ns && ns[cat] && ns[cat].booleanValue === false) return;
      tokens.push(tok);
    });
  } catch (e) {}
  return tokens;
}

// FCM v1 발송 (doPost와 같은 방식 — 트리거 실행용 공용 함수)
function _sendFcmToTokens(tokens, title, body, data) {
  var accessToken = ScriptApp.getOAuthToken();
  var url = 'https://fcm.googleapis.com/v1/projects/' + PROJECT_ID + '/messages:send';
  var d = {};
  Object.keys(data || {}).forEach(function (k) { d[k] = String(data[k] == null ? '' : data[k]); });
  tokens.forEach(function (tok) {
    var message = { message: {
      token: tok,
      notification: { title: title, body: body },
      data: d,
      android: { priority: 'high', notification: { channel_id: 'seoraksan_alerts', sound: 'default', default_vibrate_timings: true } }
    } };
    try {
      UrlFetchApp.fetch(url, {
        method: 'post', contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + accessToken },
        payload: JSON.stringify(message), muteHttpExceptions: true
      });
    } catch (e) {}
  });
}
