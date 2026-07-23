/**************************************************************
 * 설악산 현장관리 — 통합 Apps Script (2026-07 보안 강화 통합본)
 *  (1) FCM 푸시 발송 — 시크릿 + ID토큰 검증 + 레이트리밋
 *  (2) 카카오 로그인 검증 + 허용목록 + Firebase 커스텀 토큰 발급
 *  (3) 기상특보 24시간 감시(트리거)
 *
 * [교체 방법 — 전체 복붙 한 번]
 *  ① 기존 스크립트에서 var SA = {...} 블록(서비스 계정 키)만 복사해 두기
 *  ② 기존 코드 전체 삭제 → 이 파일 전체 붙여넣기
 *  ③ 아래 "var SA" 자리에 ①에서 복사한 키 붙여넣기
 *     (또는 스크립트 속성 SA_JSON에 키 JSON 전체를 넣으면 코드에 안 둬도 됨 — 권장)
 *  ④ 프로젝트 설정 > 스크립트 속성 추가:
 *       REQUIRE_AUTH     = 0    ← 전 기기 앱 업데이트 확인 후 1로 (푸시에 로그인 필수화)
 *       FIREBASE_API_KEY = Firebase 웹 API 키 (ID토큰 검증용)
 *       (선택) SECRET / SECRET_OLD — 시크릿 로테이션 시
 *       (선택) SA_JSON — 서비스 계정 키 JSON 전체
 *  ⑤ 배포 → 배포 관리 → 기존 배포 ✏️수정 → 새 버전 → 배포 (URL 그대로 유지)
 *  ⑥ 테스트: 앱 카카오 로그인 1회 + 관리자 푸시 1회
 *  ※ 문제 생기면: 배포 관리 → 이전 버전 선택 → 배포 (즉시 원복)
 **************************************************************/

// Firebase 프로젝트 ID
var PROJECT_ID = 'seoraksan';

// 앱과 일치해야 하는 공유 시크릿 (스크립트 속성 SECRET 설정 시 그쪽 우선)
var SHARED_SECRET = '설악산119';

// 마스터 관리자 카카오 이메일 — 항상 admin 권한 (허용목록과 무관)
var MASTER_EMAIL = 'yraphael@kakao.com';

// ── Firebase 서비스 계정 키 ──
// 스크립트 속성 SA_JSON이 있으면 그걸 쓰고, 없으면 아래 인라인 블록 사용.
var SA = (function () {
  try {
    var p = PropertiesService.getScriptProperties().getProperty('SA_JSON');
    if (p) return JSON.parse(p);
  } catch (e) {}
  return {
    /* ⚠️ 여기에 기존 스크립트의 var SA = { ... } 중괄호 안 내용을 그대로 붙여넣기
       (type, project_id, private_key_id, private_key, client_email, token_uri) */
  };
})();

// ── base64url 인코딩 (커스텀 토큰 서명용) ──
function b64url(o) {
  return Utilities.base64EncodeWebSafe(
    typeof o === 'string' ? o : JSON.stringify(o)
  ).replace(/=+$/, '');
}

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

// ── 레이트리밋: 분당 전체 60회 · 사용자당 20회 ──
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

// ── Firestore appData 문서 읽기/쓰기 (스크립트 소유자 권한) ──
function _fsDocGet(k) {
  try {
    var res = UrlFetchApp.fetch(
      'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents/appData/' + encodeURIComponent(k),
      { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return null;
    var f = JSON.parse(res.getContentText()).fields;
    if (!f || !f.d || !f.d.stringValue) return null;
    return JSON.parse(f.d.stringValue);
  } catch (e) { return null; }
}
function _fsDocSet(k, obj) {
  try {
    UrlFetchApp.fetch(
      'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents/appData/' + encodeURIComponent(k) + '?updateMask.fieldPaths=d',
      { method: 'patch', contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
        payload: JSON.stringify({ fields: { d: { stringValue: JSON.stringify(obj) } } }),
        muteHttpExceptions: true });
  } catch (e) {}
}

// ══════════════ 메인 진입점 ══════════════
function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);

    // ① 시크릿(구/신 허용) — 1차 차단막
    var secrets = _getSecrets();
    if (secrets.length && secrets.indexOf(req.secret) < 0) {
      return _json({ error: 'unauthorized' });
    }

    // ② 카카오 로그인 → Firebase 커스텀 토큰 발급
    if (req.action === 'mintToken') return handleMintToken(req);

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
      if (code === 200) { sent++; }
      else {
        var txt = res.getContentText();
        if (code === 404 ||
            txt.indexOf('UNREGISTERED') >= 0 ||
            txt.indexOf('INVALID_ARGUMENT') >= 0) {
          invalid.push(tok); // 만료/삭제된 토큰 → 앱이 정리하도록 돌려줌
        }
      }
    });

    return _json({ ok: true, sent: sent, invalid: invalid });
  } catch (err) {
    return _json({ error: String(err) });
  }
}

// ══════════════ 카카오 로그인 → 커스텀 토큰 ══════════════
// 요청: {secret, action:'mintToken', kakaoAccessToken, profile:{realName,name,dept,rank}}
// 응답: {token, role:'admin'|'member', kakaoId}  /  {error:'not_allowed'|...}
function handleMintToken(req) {
  if (_rateLimited('mint')) return _json({ error: 'rate_limited' });
  var tok = req.kakaoAccessToken;
  if (!tok) return _json({ error: 'no_token' });

  // ① 카카오 서버에 직접 신원 확인 — 토큰 위조 불가
  var kres;
  try {
    kres = UrlFetchApp.fetch('https://kapi.kakao.com/v2/user/me',
      { headers: { Authorization: 'Bearer ' + tok }, muteHttpExceptions: true });
  } catch (e) { return _json({ error: 'kakao_unreachable' }); }
  if (kres.getResponseCode() !== 200) return _json({ error: 'kakao_invalid' });
  var kj = JSON.parse(kres.getContentText());
  var kakaoId = String(kj.id || '');
  if (!kakaoId) return _json({ error: 'kakao_invalid' });
  var email = (kj.kakao_account && kj.kakao_account.email) || '';

  // ② 탈퇴·차단 목록 확인
  var deleted = _fsDocGet('deletedKakaoIds') || [];
  if (Array.isArray(deleted) && deleted.map(String).indexOf(kakaoId) >= 0) {
    return _json({ error: 'not_allowed' });
  }

  // ③ 역할 판정: 마스터 이메일 → admin / _acl 허용목록 → 등록된 역할 / 자동승인 → member
  var role = '';
  if (email && email === MASTER_EMAIL) role = 'admin';
  if (!role) {
    var acl = _fsDocGet('_acl') || {};
    var ent = acl[kakaoId];
    var r = (typeof ent === 'string') ? ent : (ent && ent.role);
    if (r === 'admin' || r === 'member') role = r;
  }
  if (!role) {
    var aa = _fsDocGet('autoApprove');
    var aaOn = aa === true || aa === 1 || aa === '1' || aa === 'true' ||
               (aa && typeof aa === 'object' && (aa.on === true || aa.enabled === true));
    if (aaOn) role = 'member';
  }
  if (!role) {
    // 미승인 → 대기명단에 프로필 등록(관리자 직원 탭 자동 노출, 중복 방지) 후 거절
    try {
      var pend = _fsDocGet('pendingUsers') || [];
      if (!pend.some(function (p) { return String(p.id || p.kakaoId || '') === kakaoId; })) {
        var pf = req.profile || {};
        pend.push({ id: kakaoId, kakaoId: kakaoId, name: pf.name || '', realName: pf.realName || '',
                    dept: pf.dept || '', rank: pf.rank || '', at: Date.now() });
        _fsDocSet('pendingUsers', pend);
      }
    } catch (e) {}
    return _json({ error: 'not_allowed' });
  }

  // ④ Firebase 커스텀 토큰 발급 (서비스 계정 키로 서명)
  //    보안규칙(request.auth.token.member/admin)과 클라이언트(app.core.js: c.member/c.admin)가
  //    이 커스텀 클레임을 읽는다. role은 여기서 항상 'member' 또는 'admin'이므로 member는 항상 true.
  //    ⚠️ 이 클레임을 먼저 배포·검증한 뒤에 강화된 firestore.rules를 게시할 것(순서 반대면 전원 잠김).
  var token = _mintCustomToken('kakao:' + kakaoId,
    { role: role, kakaoId: kakaoId, member: true, admin: (role === 'admin') });
  if (!token) return _json({ error: 'mint_failed' });
  return _json({ token: token, role: role, kakaoId: kakaoId });
}

// 커스텀 토큰(JWT RS256) 생성 — SA 키 필요
function _mintCustomToken(uid, claims) {
  try {
    if (!SA || !SA.private_key || !SA.client_email) return '';
    var now = Math.floor(Date.now() / 1000);
    var header = { alg: 'RS256', typ: 'JWT' };
    var payload = {
      iss: SA.client_email, sub: SA.client_email,
      aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
      iat: now, exp: now + 3600,
      uid: uid, claims: claims || {}
    };
    var base = b64url(header) + '.' + b64url(payload);
    var sig = Utilities.computeRsaSha256Signature(base, SA.private_key);
    return base + '.' + Utilities.base64EncodeWebSafe(sig).replace(/=+$/, '');
  } catch (e) { return ''; }
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
// 설정(1회): 편집기에서 watchKmaWarnings 1회 [실행](권한 승인) →
//   ⏰ 트리거 추가: watchKmaWarnings · 시간 기반 · 분 단위 · 10분마다
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

  if (!txt || !(txt.indexOf('START7777') >= 0 || txt.indexOf('REG_UP') >= 0)) return;

  var cur = _kmaParseWatch(txt);
  var sig = Object.keys(cur).sort().map(function (t) { return t + ':' + cur[t]; }).join('|');
  var props = PropertiesService.getScriptProperties();
  var prev = props.getProperty('kmaSig');
  if (prev === sig) return;
  props.setProperty('kmaSig', sig);
  if (prev === null) return;

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

  var tokens = _fetchPushTokens('op_kma');
  if (tokens.length) _sendFcmToTokens(tokens, '📡 기상특보 (설악산 관할)', msg.join(' / '), { app: 'alert' });
}

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
