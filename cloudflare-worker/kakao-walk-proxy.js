// 설악산 PWA — 카카오 도보/자전거/차량 경로 프록시 (Cloudflare Worker)
// ------------------------------------------------------------
// REST 키를 서버(워커 시크릿)에만 두고, CORS 붙여 돌려준다.
//   · 도보/자전거: dapi.kakao.com/v2/routing/{walk|bicycle}   (start_x,start_y,end_x,end_y)
//   · 차량:        apis-navi.kakaomobility.com/v1/directions   (origin, destination = "경도,위도")
//
// ⚠️ 차량(mode=car)은 카카오모빌리티 '자동차 길찾기(Directions)' API 사용 신청/활성화가 필요할 수 있음.
//
// 배포: Cloudflare Worker → 이 코드 붙여넣기 → Settings > Variables 에
//        KAKAO_REST_KEY (Secret) 추가 → Deploy
// 호출: /?start_x=&start_y=&end_x=&end_y=            (기본 도보)
//       /?mode=car&start_x=&start_y=&end_x=&end_y=   (차량)

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };
    const json = (o, s) => new Response(JSON.stringify(o), {
      status: s || 200, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
    });
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const key = env.KAKAO_REST_KEY;
    if (!key) return json({ status: 'NO_KEY' }, 500);

    const p = new URL(request.url).searchParams;
    const mode = p.get('mode') || 'walk';
    const sx = p.get('start_x'), sy = p.get('start_y'), ex = p.get('end_x'), ey = p.get('end_y');
    if (!sx || !sy || !ex || !ey) return json({ status: 'BAD_PARAMS' }, 400);

    let target;
    if (mode === 'car') {
      // 자동차 길찾기 (카카오모빌리티) — origin/destination 은 "경도,위도"
      const q = new URLSearchParams({ origin: sx + ',' + sy, destination: ex + ',' + ey, priority: p.get('priority') || 'RECOMMEND' });
      target = 'https://apis-navi.kakaomobility.com/v1/directions?' + q.toString();
    } else {
      // 도보 / 자전거
      const path = mode === 'bicycle' ? 'bicycle' : 'walk';
      const q = new URLSearchParams({ start_x: sx, start_y: sy, end_x: ex, end_y: ey });
      ['via_x', 'via_y', 'route_mode', 's_name', 'e_name', 'v_name', 'input_coord', 'output_coord'].forEach((k) => {
        const v = p.get(k); if (v) q.set(k, v);
      });
      target = 'https://dapi.kakao.com/v2/routing/' + path + '?' + q.toString();
    }

    let up;
    try { up = await fetch(target, { headers: { Authorization: 'KakaoAK ' + key, Accept: 'application/json' } }); }
    catch (e) { return json({ status: 'UPSTREAM_FAIL' }, 502); }
    const body = await up.arrayBuffer();
    const headers = new Headers(cors);
    headers.set('Content-Type', up.headers.get('Content-Type') || 'application/json; charset=utf-8');
    headers.set('Cache-Control', 'public, max-age=120');
    return new Response(body, { status: up.status, headers });
  },
};
