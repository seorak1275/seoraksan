/***************************************************************
 * 설악산 현장관리 — 통합 Apps Script (2026-07 보안 강화판)
 *  (1) FCM 푸시 발송 — 시크릿 + ID토큰 검증(선택) + 레이트리밋
 *  (2) 카카오 로그인 검증 + 허용목록 + Firebase 커스텀 토큰 발급
 *  (3) 기상특보 24시간 감시 (트리거 연결 시에만 동작)
 *
 * [적용] 전체 교체 → 저장 → 배포 → 배포 관리 → ✏️ → 새 버전 → 배포
 * [원복] 배포 관리 → 이전 버전 선택 → 배포
 * [나중에 잠금 올리기(선택)] 프로젝트 설정 → 스크립트 속성 → REQUIRE_AUTH = 1
 *   → 이후엔 앱 로그인 없는 푸시 요청은 시크릿이 맞아도 거부(시크릿 유출 대비)
 *
 * ※ 이 파일은 "실제 배포본"을 저장소에 반영한 참조본이다(코드 로직 = 배포 그대로).
 *   단, SA.private_key(서비스 계정 마스터키)는 민감정보라 저장소에는 넣지 않는다.
 *   → 아래 SA.private_key 값은 자리표시자이며, 앱스 스크립트 콘솔의 실제 키가 진본이다.
 *   (권장: 코드에 두지 말고 스크립트 속성 SA_JSON 에 키 JSON 전체를 넣어 관리)
 *
 * ── 강화 Firestore 규칙(firestore.rules.hardened)과의 관계 ──
 *   handleMintToken_ 이 커스텀 토큰에 { member:true, admin:!!isAdmin, kakaoId } 클레임을
 *   이미 넣으므로, 규칙의 request.auth.token.member/admin 이 그대로 동작한다(추가 조치 불필요).
 ***************************************************************/

// 앱과 일치해야 하는 시크릿 (스크립트 속성 SECRET 설정 시 그쪽 우선)
var SECRET = '설악산119';

// 마스터 관리자 카카오 이메일 — 항상 admin 권한 부여 (허용목록과 무관)
var MASTER_EMAIL = 'yraphael@kakao.com';

// Firebase 웹 API 키(공개키) — ID토큰 검증용
var FIREBASE_API_KEY = 'AIzaSyACBoT-h2h0aQXYJpPyznc3JBzprEhhUAw';

// Firebase 서비스 계정 키
//  ⚠️ private_key 는 저장소 보관 금지 — 아래는 자리표시자. 실제 값은 앱스 스크립트 콘솔/스크립트 속성에.
var SA = {
  "type": "service_account",
  "project_id": "seoraksan",
  "private_key_id": "REDACTED",
  "private_key": "-----BEGIN PRIVATE KEY-----\n<<앱스 스크립트 콘솔의 실제 키로 유지 — 저장소엔 넣지 않음>>\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@seoraksan.iam.gserviceaccount.com",
  "token_uri": "https://oauth2.googleapis.com/token"
};

// ── base64url 인코딩 ──
function b64url_(o) {
  return Utilities.base64EncodeWebSafe(
    typeof o === 'string' ? o : JSON.stringify(o)
  ).replace(/=+$/, '');
}

// ── 스크립트 속성 읽기 ──
function _prop(k) {
  try { return PropertiesService.getScriptProperties().getProperty(k) || ''; } catch (e) { return ''; }
}

// ── 시크릿: 속성 SECRET(+SECRET_OLD 로테이션) 우선, 없으면 위 SECRET 변수 ──
function _getSecrets() {
  var s = [];
  if (_prop('SECRET')) s.push(_prop('SECRET'));
  if (_prop('SECRET_OLD')) s.push(_prop('SECRET_OLD'));
  if (!s.length && SECRET) s.push(SECRET);
  return s;
}

// ── 분당 카운터 — limit 초과 시 true (스팸·마비 공격 차단) ──
function _bump(key, limit) {
  try {
    var c = CacheService.getScriptCache();
    var k = 'rl_' + key + '_' + Math.floor(Date.now() / 60000);
    var n = parseInt(c.get(k) || '0', 10) + 1;
    c.put(k, String(n), 120);
    return n > limit;
  } catch (e) { return false; }
}

// ── Firebase ID토큰 검증 — 유효하면 uid, 아니면 '' ──
function _verifyIdToken(idToken) {
  if (!idToken) return '';
  var key = _prop('FIREBASE_API_KEY') || FIREBASE_API_KEY;
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

// ── 서비스 계정 액세스 토큰 발급 (scope별 55분 캐시) ──
function getAccessToken_(scope) {
  scope = scope || 'https://www.googleapis.com/auth/firebase.messaging';
  var cache = CacheService.getScriptCache();
  var ckey = 'tok_' + Utilities.base64EncodeWebSafe(scope).replace(/=+$/, '');
  var cached = cache.get(ckey);
  if (cached) return cached;

  var now = Math.floor(Date.now() / 1000);
  var header = { alg: 'RS256', typ: 'JWT' };
  var claim = {
    iss: SA.client_email,
    scope: scope,
    aud: SA.token_uri,
    exp: now + 3600,
    iat: now
  };
  var toSign = b64url_(header) + '.' + b64url_(claim);
  var sig = Utilities.computeRsaSha256Signature(toSign, SA.private_key);
  var jwt = toSign + '.' + Utilities.base64EncodeWebSafe(sig).replace(/=+$/, '');

  var res = UrlFetchApp.fetch(SA.token_uri, {
    method: 'post',
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt },
    muteHttpExceptions: true
  });
  var tok = JSON.parse(res.getContentText()).access_token;
  if (tok) cache.put(ckey, tok, 3300); // 55분 캐시
  return tok;
}

// ──────────────────────────────────────────────────────────
//  (2) 카카오 검증 + 허용목록 + Firebase 커스텀 토큰
// ──────────────────────────────────────────────────────────

// 카카오 access_token 검증 → { id, email } 또는 null
function verifyKakao_(accessToken) {
  if (!accessToken) return null;
  var res = UrlFetchApp.fetch('https://kapi.kakao.com/v2/user/me', {
    method: 'get',
    headers: { Authorization: 'Bearer ' + accessToken },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) return null;
  var j = JSON.parse(res.getContentText());
  if (!j || !j.id) return null;
  var email = (j.kakao_account && j.kakao_account.email) || '';
  return { id: String(j.id), email: String(email).toLowerCase() };
}

// Firestore REST에서 허용목록 읽기 → { members:[id...], admins:[id...] }
function readAllowlist_() {
  var tok = getAccessToken_('https://www.googleapis.com/auth/datastore');
  var url = 'https://firestore.googleapis.com/v1/projects/' + SA.project_id +
            '/databases/(default)/documents/appData/_acl';
  var res = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + tok },
    muteHttpExceptions: true
  });
  var out = { members: [], admins: [] };
  if (res.getResponseCode() !== 200) return out;
  try {
    var doc = JSON.parse(res.getContentText());
    var raw = doc && doc.fields && doc.fields.d && doc.fields.d.stringValue;
    if (!raw) return out;
    var v = JSON.parse(raw);
    var norm = function (arr) {
      return (Array.isArray(arr) ? arr : []).map(function (x) { return String(x); })
                                            .filter(function (s) { return s; });
    };
    out.members = norm(v.members);
    out.admins = norm(v.admins);
  } catch (e) {}
  return out;
}

// Firebase 커스텀 토큰 생성 (서비스 계정 키로 직접 서명)
function mintFirebaseCustomToken_(uid, claims) {
  var now = Math.floor(Date.now() / 1000);
  var header = { alg: 'RS256', typ: 'JWT' };
  var payload = {
    iss: SA.client_email,
    sub: SA.client_email,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: now,
    exp: now + 3600,
    uid: String(uid).substring(0, 128),
    claims: claims || {}
  };
  var toSign = b64url_(header) + '.' + b64url_(payload);
  var sig = Utilities.computeRsaSha256Signature(toSign, SA.private_key);
  return toSign + '.' + Utilities.base64EncodeWebSafe(sig).replace(/=+$/, '');
}

// mintToken 요청 처리
function handleMintToken_(req) {
  var info = verifyKakao_(req.kakaoAccessToken);
  if (!info) return { error: 'kakao_verify_failed' };

  var acl = readAllowlist_();
  var isMaster = MASTER_EMAIL && info.email && (info.email === MASTER_EMAIL.toLowerCase());
  var listEmpty = (acl.members.length === 0 && acl.admins.length === 0);

  var isAdmin = isMaster || acl.admins.indexOf(info.id) >= 0;
  var isMember = isAdmin || acl.members.indexOf(info.id) >= 0;

  // 부트스트랩(TOFU): 허용목록이 완전히 비어 있으면 첫 로그인 사용자에게 admin 부여.
  var bootstrap = false;
  if (!isMember && listEmpty) { isAdmin = true; isMember = true; bootstrap = true; }

  if (!isMember) {
    return { error: 'not_allowed', kakaoId: info.id, email: info.email };
  }

  var token = mintFirebaseCustomToken_('kakao:' + info.id, {
    member: true,
    admin: !!isAdmin,
    kakaoId: info.id
  });
  return {
    token: token,
    role: isAdmin ? 'admin' : 'member',
    kakaoId: info.id,
    email: info.email,
    bootstrap: bootstrap
  };
}

// ──────────────────────────────────────────────────────────
//  (1) FCM 푸시 — req.action 없으면 이쪽으로
// ──────────────────────────────────────────────────────────
function handlePush_(req) {
  var tokens = req.tokens || [];
  if (tokens.length > 500) tokens = tokens.slice(0, 500); // 폭주 방지 상한
  if (!tokens.length) return { sent: 0 };

  var accessToken = getAccessToken_('https://www.googleapis.com/auth/firebase.messaging');
  if (!accessToken) return { error: 'no_access_token' };

  var fcmUrl = 'https://fcm.googleapis.com/v1/projects/' + SA.project_id + '/messages:send';

  var data = {};
  if (req.data) { for (var k in req.data) data[k] = String(req.data[k]); }

  var title = req.title || '설악산 현장관리';
  var body = req.body || '';

  var requests = tokens.map(function (tok) {
    return {
      url: fcmUrl,
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + accessToken },
      muteHttpExceptions: true,
      payload: JSON.stringify({
        message: {
          token: tok,
          notification: { title: title, body: body },
          data: data,
          android: {
            priority: 'high',
            notification: { channel_id: 'seoraksan_alerts', sound: 'default', default_vibrate_timings: true }
          },
          apns: { headers: { 'apns-priority': '10' }, payload: { aps: { sound: 'default' } } },
          webpush: { headers: { Urgency: 'high' } }
        }
      })
    };
  });

  var responses = UrlFetchApp.fetchAll(requests);
  var sent = 0, invalid = [];
  responses.forEach(function (r, i) {
    var code = r.getResponseCode();
    if (code === 200) { sent++; return; }
    var txt = r.getContentText();
    if (code === 404 || code === 400 ||
        /UNREGISTERED|INVALID_ARGUMENT|NOT_FOUND|registration-token-not-registered/i.test(txt)) {
      invalid.push(tokens[i]);
    }
  });
  return { sent: sent, invalid: invalid };
}

// ── 라우터 ──
function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);

    // ① 시크릿 확인 (속성 SECRET/SECRET_OLD 로테이션 지원)
    var secrets = _getSecrets();
    if (secrets.length && secrets.indexOf(req.secret) < 0) return out_({ error: 'unauthorized' });

    // ② 로그인 — 분당 120회 상한
    if (req.action === 'mintToken') {
      if (_bump('mint', 120)) return out_({ error: 'rate_limited' });
      return out_(handleMintToken_(req));
    }

    // ③ 푸시 — (선택)ID토큰 검증 + 분당 전체 60회·사용자당 20회 상한
    var uid = _verifyIdToken(req.idToken);
    if (_prop('REQUIRE_AUTH') === '1' && !uid) return out_({ error: 'auth_required' });
    if (_bump('push', 60) || _bump('pu_' + (uid || 'anon'), 20)) return out_({ error: 'rate_limited' });
    return out_(handlePush_(req));
  } catch (err) {
    return out_({ error: String(err) });
  }
}

function doGet() {
  return out_({ ok: true, project: SA.project_id });
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
