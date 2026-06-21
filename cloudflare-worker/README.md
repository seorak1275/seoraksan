# 기상청 프록시 설정 (Cloudflare Worker) — 일회성, 약 3분

웹앱(GitHub Pages)에서 **진짜 기상청 데이터**를 안정적으로 받기 위한 무료 프록시입니다.
공개 프록시(corsproxy 등)는 자주 막히지만, 본인 소유 워커는 항상 동작합니다.

## 왜 필요한가
브라우저가 기상청 `apihub.kma.go.kr`을 직접 부르면 CORS 규칙에 막힙니다.
이 워커가 중간에서 대신 호출해 CORS 헤더를 붙여 돌려줍니다.
보안상 **기상청(`*.kma.go.kr`) 주소만** 통과시킵니다.

## 설정 단계

1. **Cloudflare 가입** (무료) — https://dash.cloudflare.com/sign-up
2. 좌측 메뉴 **Workers & Pages** → **Create application** → **Create Worker**
3. 이름 입력 (예: `seoraksan-kma`) → **Deploy**
4. **Edit code** 클릭 → 기존 코드를 모두 지우고 [`kma-proxy.js`](./kma-proxy.js) 내용을 붙여넣기 → **Deploy**
5. 상단에 표시되는 워커 주소 복사
   예: `https://seoraksan-kma.your-name.workers.dev`
6. 앱에서 **관리자 설정 → 🌦️ 기상청 프록시 주소** 칸에 그 주소를 붙여넣고 **저장**

끝입니다. 이제 날씨 상세 화면 출처가 항상 **"기상청"** 으로 뜹니다.

## 무료 한도
Cloudflare Workers 무료 플랜: **하루 100,000 요청**. 현장 사용량으로는 절대 초과하지 않습니다.

## 동작 확인
워커 주소 뒤에 테스트 URL을 붙여 브라우저에서 열어보면 JSON이 보입니다:

```
https://<워커주소>/?url=https%3A%2F%2Fapihub.kma.go.kr%2Fapi%2Ftyp02%2FopenApi%2FVilageFcstInfoService_2.0%2FgetUltraSrtNcst%3FauthKey%3DS3Nk1fdqSpqzZNX3anqaWA%26dataType%3DJSON%26numOfRows%3D10%26pageNo%3D1%26baseDate%3D20260101%26baseTime%3D0500%26nx%3D87%26ny%3D141
```
