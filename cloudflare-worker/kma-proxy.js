// 설악산 PWA — 기상청(KMA) CORS 우회 프록시 (Cloudflare Worker)
// ------------------------------------------------------------
// 기상청 apihub는 브라우저 CORS 허용 헤더를 주지 않아 웹앱에서 직접 호출이 막힌다.
// 이 워커가 중간에서 대신 호출해 CORS 헤더를 붙여 돌려준다.
// 보안: 기상청(*.kma.go.kr) 주소만 통과시켜 오픈 프록시 악용을 막는다.
//
// 배포: Cloudflare 대시보드 → Workers & Pages → Create → 이 코드 붙여넣고 Deploy
// 사용: 발급된 https://<이름>.<서브도메인>.workers.dev 주소를
//       앱 관리자 설정 > "기상청 프록시 주소"에 붙여넣기

export default {
  async fetch(request) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }
    const target = new URL(request.url).searchParams.get('url');
    if (!target) {
      return new Response('missing ?url=', { status: 400, headers: cors });
    }
    let host;
    try {
      host = new URL(target).hostname;
    } catch (e) {
      return new Response('bad url', { status: 400, headers: cors });
    }
    // 기상청 도메인만 허용 (오픈 프록시 악용 방지)
    if (!/(^|\.)kma\.go\.kr$/.test(host)) {
      return new Response('host not allowed', { status: 403, headers: cors });
    }
    let upstream;
    try {
      upstream = await fetch(target, { headers: { Accept: 'application/json,text/plain,*/*' } });
    } catch (e) {
      return new Response('upstream fetch failed', { status: 502, headers: cors });
    }
    const body = await upstream.arrayBuffer();
    const headers = new Headers(cors);
    headers.set('Content-Type', upstream.headers.get('Content-Type') || 'application/json; charset=utf-8');
    headers.set('Cache-Control', 'public, max-age=300'); // 5분 캐시
    return new Response(body, { status: upstream.status, headers });
  },
};
