// 설악산 PWA — 카카오 도보/자전거 경로 프록시 (Cloudflare Worker)
// ------------------------------------------------------------
// 브라우저(WebView)가 카카오 dapi.kakao.com 을 직접 부르면 CORS 에 막히고,
// REST 키를 앱 JS 에 넣으면 노출된다. 이 워커가 중간에서:
//   ① REST 키를 서버(워커 시크릿)에만 두고
//   ② 카카오 도보/자전거 경로를 대신 호출해
//   ③ CORS 헤더를 붙여 돌려준다.
//
// 배포:
//   1) Cloudflare → Workers & Pages → Create Worker (예: seoraksan-walk) → Deploy
//   2) Edit code → 이 파일 내용 붙여넣기 → Deploy
//   3) 워커 Settings → Variables and Secrets → Add
//        이름 KAKAO_REST_KEY / 값 = 카카오 개발자 콘솔의 REST API 키 / Type: Secret → Deploy
//   4) 발급된 https://<이름>.<서브도메인>.workers.dev 주소를
//      앱 관리자설정 "🥾 도보경로 프록시 주소" 에 붙여넣기
//
// 호출 예:
//   https://<워커>/?start_x=128.3749&start_y=38.1601&end_x=128.4467&end_y=38.1286
//   선택: &route_mode=SHORTEST  &mode=bicycle  &via_x=..&via_y=..  &s_name=..&e_name=..

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };
    const json = (obj, status) => new Response(JSON.stringify(obj), {
      status: status || 200,
      headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
    });
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const key = env.KAKAO_REST_KEY;
    if (!key) return json({ status: 'NO_KEY', message: 'KAKAO_REST_KEY 시크릿을 워커에 추가하세요' }, 500);

    const p = new URL(request.url).searchParams;
    const mode = p.get('mode') === 'bicycle' ? 'bicycle' : 'walk'; // 도보 기본
    const sx = p.get('start_x'), sy = p.get('start_y'), ex = p.get('end_x'), ey = p.get('end_y');
    if (!sx || !sy || !ex || !ey) return json({ status: 'BAD_PARAMS' }, 400);

    const q = new URLSearchParams({ start_x: sx, start_y: sy, end_x: ex, end_y: ey });
    ['via_x', 'via_y', 'route_mode', 's_name', 'e_name', 'v_name', 'input_coord', 'output_coord'].forEach((k) => {
      const v = p.get(k); if (v) q.set(k, v);
    });

    const target = 'https://dapi.kakao.com/v2/routing/' + mode + '?' + q.toString();
    let up;
    try {
      up = await fetch(target, { headers: { Authorization: 'KakaoAK ' + key, Accept: 'application/json' } });
    } catch (e) {
      return json({ status: 'UPSTREAM_FAIL' }, 502);
    }
    const body = await up.arrayBuffer();
    const headers = new Headers(cors);
    headers.set('Content-Type', up.headers.get('Content-Type') || 'application/json; charset=utf-8');
    headers.set('Cache-Control', 'public, max-age=120'); // 2분 캐시(같은 경로 재호출 절약)
    return new Response(body, { status: up.status, headers });
  },
};
