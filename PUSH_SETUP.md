# 📲 푸시 알림 설정 가이드 (꺼진 폰까지 울리기)

> 구조 1보·위험상황이 발생하면, 앱을 완전히 꺼둔 대원의 폰까지 알림이 울리게 합니다.
> 카카오톡·배민과 똑같은 원리(FCM)입니다.

## 왜 이 설정이 필요한가
앱이 **완전히 꺼져 있으면 앱 스스로는 아무것도 못 합니다.** 그래서 알림을 띄우는 건
앱이 아니라 **안드로이드(구글 FCM)** 가 대신 합니다. 이를 위해 3가지가 필요합니다.

| 필요한 것 | 역할 | 누가 |
|---|---|---|
| ① `google-services.json` | 이 앱이 우리 Firebase 프로젝트 것임을 증명하는 **신분증** | 사장님 (아래 1단계) |
| ② push 플러그인 + 토큰 코드 | 폰이 "내 주소(토큰)"를 구글에 등록 | ✅ 코드 완료 |
| ③ Apps Script 발송기 | "1보 떴어!" 하고 구글에 푸시를 부탁하는 **서버** | 사장님 (아래 3단계) |

---

## 1단계 — google-services.json 발급 (신분증)

1. [Firebase 콘솔](https://console.firebase.google.com) → **seoraksan** 프로젝트 선택
2. 좌측 상단 ⚙️ → **프로젝트 설정** → **내 앱** 섹션
3. **Android 앱 추가** (안드로이드 아이콘) 클릭
   - **Android 패키지 이름**: `kr.go.nps.seoraksan` ← 반드시 정확히
   - 앱 닉네임: `설악산 현장관리` (아무거나)
   - "앱 등록" 클릭
4. **`google-services.json` 다운로드** 버튼 클릭
5. 받은 파일을 프로젝트의 **`android/app/`** 폴더에 넣기
   (`android/app/google-services.json` 위치)

> ⚠️ 이 파일은 깃허브에 올리지 마세요(`.gitignore`에 이미 제외돼 있음). 빌드할 PC에만 두세요.

---

## 2단계 — 안드로이드 빌드에 푸시 연동 (빌드하는 분)

빌드하는 PC에서 프로젝트 폴더를 열고:

```bash
npm install                      # @capacitor/push-notifications 설치
npx cap sync android             # 네이티브 프로젝트에 반영
```

그다음 **Firebase google-services Gradle 플러그인**이 적용돼 있어야 합니다.
보통 `npx cap sync` 후 자동 처리되지만, 빌드 오류가 나면 아래를 확인하세요.

`android/build.gradle` 의 `dependencies` 에:
```gradle
classpath 'com.google.gms:google-services:4.4.2'
```
`android/app/build.gradle` 맨 아래에:
```gradle
apply plugin: 'com.google.gms.google-services'
```

마지막으로 Android Studio(또는 `./gradlew assembleRelease`)로 **APK를 새로 빌드**해서
GitHub Releases에 올리고, 대원들이 새 APK를 설치하면 됩니다.

---

## 3단계 — Apps Script 발송기 만들기 (서버, 무료)

1. **seoraksan 프로젝트를 소유한 구글 계정**으로 [script.google.com](https://script.google.com) 접속
   (Firebase 프로젝트에 접근 권한이 있는 계정이어야 함)
2. **새 프로젝트** 생성
3. 기본 `Code.gs` 내용을 지우고, 이 저장소 **`apps_script/Code.gs`** 내용을 붙여넣기
4. 파일 안의 비밀번호를 직접 정하기:
   ```js
   var SHARED_SECRET = 'CHANGE-ME-설악산-비밀번호';  // ← 원하는 비밀번호로 변경
   ```
5. **프로젝트 설정**(⚙️) → "`appsscript.json` 매니페스트 파일 표시" 체크
   → 나타난 `appsscript.json` 을 이 저장소 **`apps_script/appsscript.json`** 내용으로 교체
6. **배포 → 새 배포 → 유형: 웹 앱**
   - 실행 주체: **나(스크립트 소유자)**
   - 액세스 권한: **모든 사용자**
   - "배포" → 권한 승인(구글 로그인 → "고급" → "안전하지 않음" 통과)
7. 나온 **웹 앱 URL**(`.../exec`로 끝남) 복사

---

## 4단계 — 앱에 연결

앱 → **관리자 → 시스템 → 📲 푸시 알림** 카드에서:

- **Apps Script 발송 URL**: 3단계에서 복사한 `/exec` URL 입력
- **공유 비밀번호**: `Code.gs`의 `SHARED_SECRET`과 **똑같이** 입력
- **💾 저장** → **🔔 테스트 발송** 으로 확인

테스트 발송 시 다른 폰에 알림이 뜨면 성공입니다. 🎉

---

## 동작 방식 요약

- 누가 **1보**를 등록하면 → 그 폰이 등록된 모든 기기 토큰을 읽어 Apps Script에 발송 요청
  → Apps Script가 구글 FCM으로 푸시 → **꺼진 폰까지 울림**
- 각 대원이 **관리자 → 설정 → 🔔 알림 설정**에서 켜둔 종류만 그 사람 폰으로 갑니다.
  (예: '낙석' 끄면 낙석 푸시 안 받음. '안전사고' 끄면 1보 푸시 안 받음)
- 보내는 본인 폰에는 푸시가 가지 않습니다(이미 아니까).

## 비용
- Apps Script: **무료**
- FCM 푸시: **무료** (무제한)
- google-services.json / Firebase: **무료** (현재 무료 요금제 그대로)

---

## 4단계 — 기상특보 24시간 서버 감시 (앱 꺼져 있어도 푸시)

앱은 열려 있는 동안만 특보를 확인합니다. 새벽처럼 아무도 앱을 안 볼 때도
발령 즉시 푸시를 받으려면, 3단계에서 만든 **같은 Apps Script**에 감시
트리거만 추가하면 됩니다.

1. [script.google.com](https://script.google.com) → 3단계에서 만든 프로젝트 열기
2. 저장소의 `apps_script/Code.gs` 최신 내용을 통째로 붙여넣고 저장
   (아래에 `watchKmaWarnings` 함수가 추가돼 있어야 함)
3. 상단 함수 선택에서 **watchKmaWarnings** 선택 → **실행** 1회 (권한 승인 창이 뜨면 허용)
   - 첫 실행은 "현재 특보 상태"를 기준으로 저장만 하고 알림은 보내지 않습니다
4. 좌측 ⏰ **트리거** → **트리거 추가**:
   - 실행할 함수: `watchKmaWarnings`
   - 이벤트 소스: **시간 기반** · 유형: **분 단위 타이머** · **10분마다**
5. 끝. 이후 설악산 관할(속초·고성·양양·인제·설악·강원북부산지) 특보가
   발령·변경·해제되면 10분 이내에 전 기기로 푸시가 갑니다.
   (설정 > 알림에서 "기상특보 수신"을 끈 기기는 제외)

> 검증: 트리거 추가 후 좌측 "실행" 메뉴에서 watchKmaWarnings가 10분마다
> "완료"로 찍히는지 확인. 실패가 반복되면 실행 로그의 오류 내용을 확인하세요.
