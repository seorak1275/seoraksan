// ══════════════════════════════════════════════════════════════
// 설악산 현장관리 — FCM 푸시 발송기 (Google Apps Script)
//
// 역할: 앱(클라이언트)이 보낸 토큰 목록으로 FCM HTTP v1 푸시를 발송.
//       서비스 계정/비밀키 불필요 — 이 스크립트를 실행하는 구글 계정의
//       권한(ScriptApp.getOAuthToken)으로 발송한다.
//
// 사전 조건:
//   · 이 스크립트는 Firebase 프로젝트(seoraksan)에 접근 권한이 있는
//     구글 계정(소유자/편집자)으로 만들고 배포해야 한다.
//   · appsscript.json 의 oauthScopes 가 포함돼 있어야 한다(같이 첨부).
//
// 배포: 배포 > 새 배포 > 웹 앱
//   · 실행 주체: "나(스크립트 소유자)"
//   · 액세스 권한: "모든 사용자"
//   그 후 나오는 /exec URL 을 앱 관리자 설정의 "Apps Script 발송 URL"에 입력.
// ══════════════════════════════════════════════════════════════

// Firebase 프로젝트 ID
var PROJECT_ID = 'seoraksan';

// 공유 비밀번호 — 앱 관리자 설정의 "공유 비밀번호"와 반드시 동일하게.
// 아무나 푸시를 쏘지 못하게 막는 간단한 차단막.
var SHARED_SECRET = 'CHANGE-ME-설악산-비밀번호';

function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);

    if (SHARED_SECRET && req.secret !== SHARED_SECRET) {
      return _json({ error: 'unauthorized' });
    }

    var tokens = req.tokens || [];
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
