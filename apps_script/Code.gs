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
