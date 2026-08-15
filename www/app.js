'use strict';
// ══════════════════════════════════════════
// 내 설정 (일반직원용)
// ══════════════════════════════════════════
var _settingsTab='info';
function settingsTab(tab,el){
  _settingsTab=tab;
  document.querySelectorAll('#v-settings .adm-tab').forEach(t=>t.classList.remove('on'));
  document.querySelectorAll('#v-settings .adm-sec').forEach(s=>s.classList.remove('on'));
  if(el)el.classList.add('on');
  document.getElementById('stab-'+tab+'-sec').classList.add('on');
  renderSettings();
}
function renderSettings(){
  const u=DB.g('currentUser')||{};
  if(_settingsTab==='info'){
    const _appr=u.approvalStatus==='approved';
    const _kakao=!!(u.kakaoImg||u.kakaoId);
    const _tmode=(function(){try{return localStorage.getItem('_tileAutoMode')||'wifi';}catch(e){return 'wifi';}})();
    const _mchip=(v,l)=>`<button onclick="_setTileAutoMode('${v}')" style="padding:6px 10px;border-radius:8px;border:1px solid ${_tmode===v?'rgba(94,207,143,.5)':'rgba(255,255,255,.12)'};background:${_tmode===v?'rgba(94,207,143,.14)':'none'};color:${_tmode===v?'#5fcf8f':'#8b95a1'};font-size:10.5px;font-weight:700;cursor:pointer;white-space:nowrap;">${l}</button>`;
    document.getElementById('settingsInfoWrap').innerHTML=`
      <div class="set-hd">계정</div>
      <div class="set-card">
        <div class="set-acct">
          ${_kakao&&u.kakaoImg?`<img class="set-avt" src="${_esc(_imgHttps(u.kakaoImg||''))}" onerror="this.outerHTML='<div class=&quot;set-avt&quot;>👤</div>'">`:`<div class="set-avt">👤</div>`}
          <div style="flex:1;min-width:0;">
            <div class="set-anm">${_esc(u.realName||u.name||'미설정')}</div>
            <div class="set-ade">${_esc(u.dept||'소속 미설정')}${u.rank?' · '+_esc(u.rank):''}${u.grade?' · '+_esc(u.grade):''}</div>
            ${_appr?'':`<div style="font-size:11px;font-weight:700;margin-top:4px;color:#e8a04a;">● 승인 대기</div>`}
          </div>
        </div>
        <button class="set-row tap" onclick="openChangeUser()"><div class="set-ic">✏️</div><div class="set-bd"><div class="set-lb">계정 정보 수정</div></div><span class="set-cv">›</span></button>
      </div>

      <div class="set-hd">카카오 로그인</div>
      <div class="set-card">
        ${_kakao?`
        <button class="set-row tap" onclick="kakaoLogout()"><div class="set-ic">🚪</div><div class="set-bd"><div class="set-lb" style="color:#ff8a80;">카카오 로그아웃</div></div><span class="set-cv">›</span></button>
        <button class="set-row tap" onclick="withdrawAccount()"><div class="set-ic">🗑️</div><div class="set-bd"><div class="set-lb" style="color:#cc4444;">회원탈퇴</div></div><span class="set-cv">›</span></button>`
        :`<div class="set-row"><div class="set-ic">💬</div><div class="set-bd"><div class="set-lb">카카오 계정 연결</div><div class="set-sb">로그인하면 작성자 정보가 자동 설정됩니다</div></div></div>
        <div style="padding:0 14px 14px;"><button class="set-btn set-btn-k" onclick="kakaoLogin()">💬 카카오로 로그인</button></div>`}
      </div>

      <div class="set-hd">앱</div>
      <div class="set-card">
        <button class="set-row tap" onclick="_otaCheck(true)"><div class="set-ic">🔄</div><div class="set-bd"><div class="set-lb">업데이트 확인 · 적용</div><div class="set-sb">버전 ${OTA_VER} · 재설치 없이 자체 갱신</div></div><span class="set-cv">›</span></button>
        <a class="set-row tap" href="https://github.com/seorak1275/seoraksan/releases/latest" target="_blank" style="text-decoration:none;"><div class="set-ic">📱</div><div class="set-bd"><div class="set-lb">안드로이드 APK 다운로드</div><div class="set-sb">최신 빌드 (GitHub Releases)</div></div><span class="set-cv">↗</span></a>
      </div>

      <div class="set-hd">오프라인 지도 · 무통신 대비</div>
      <div class="set-card">
        <div class="set-row" style="align-items:flex-start;"><div class="set-ic">📴</div><div class="set-bd"><div class="set-lb">산악지역 지도 미리저장</div><div class="set-sb">통신 끊긴 구역에서도 지도가 바로 뜨도록 설악산 인근을 미리 받아둡니다 (Wi-Fi 권장 · 1~2분). 앱 데이터·최근 암벽명단은 접속 중 자동 저장됩니다.</div><div id="tileCacheInfo" style="font-size:10px;color:#565f6b;margin-top:6px;">저장 현황 확인 중...</div></div></div>
        <div class="set-row"><div class="set-ic">🔁</div><div class="set-bd"><div class="set-lb">자동 저장</div></div><div style="display:flex;gap:4px;flex-shrink:0;">${_mchip('wifi','📶 WiFi')}${_mchip('always','항상')}${_mchip('off','끄기')}</div></div>
      </div>
      <div style="padding:0 2px;margin-top:9px;display:flex;flex-direction:column;gap:7px;">
        <button class="set-btn set-btn-g" onclick="preloadParkTiles()">⬇️ 설악산 인근 지도 미리받기</button>
        <button class="set-btn set-btn-n" onclick="clearTileCache()">🗑️ 지도 캐시 비우기</button>
      </div>`;
    setTimeout(function(){try{_updateTileCacheInfo();}catch(e){}},0);
  } else {
    const s=_ensureNotiDefaults();
    const allOn=NOTI_GROUPS.every(g=>g.items.every(it=>_notiOn(it.k)));
    const _vibe=DB.g('notiVibrate')!==false;
    const _notiPerm=('Notification' in window)?Notification.permission:'unsupported';
    document.getElementById('settingsNotiWrap').innerHTML=`
      <div class="set-hd">알림 동작</div>
      <div class="set-card">
        ${_notiPerm==='granted'?'':`<button class="set-row tap" onclick="_reqPerm&&_reqPerm('noti')"><div class="set-ic" style="background:rgba(232,200,74,.15);">🔔</div><div class="set-bd"><div class="set-lb" style="color:#e8c84a;">휴대폰 알림 권한 허용</div><div class="set-sb">꺼진 폰에도 알림이 오게 하려면 탭하세요</div></div><span class="set-cv">›</span></button>`}
        <div class="set-row"><div class="set-ic">📳</div><div class="set-bd"><div class="set-lb">진동</div><div class="set-sb">알림이 오면 휴대폰 진동</div></div><div class="toggle ${_vibe?'on':'off'}" onclick="togVibrate(this)"></div></div>
      </div>

      <div class="set-hd" style="display:flex;justify-content:space-between;align-items:center;">알림 종류<button onclick="togNotiAll(${allOn?'false':'true'})" style="font-size:10px;font-weight:800;background:rgba(49,130,246,.14);color:#4d9bf5;border:1px solid rgba(49,130,246,.3);border-radius:7px;padding:4px 10px;cursor:pointer;">${allOn?'전체 끄기':'전체 켜기'}</button></div>
      <div class="set-note">기본은 <b style="color:#5fcf8f;">모두에게</b> 옵니다. 받을 알림을 직접 켜고 끄세요. '(앱 내만)'은 OS 푸시 없이 앱 벨로만.</div>
      ${NOTI_GROUPS.map(g=>`
        <div class="set-hd">${g.title}</div>
        <div class="set-card">
          ${g.items.map(it=>`<div class="set-row"><div class="set-bd"><div class="set-lb">${it.l}${it.push===false?' <span style="font-size:9px;color:#565f6b;font-weight:600;">(앱 내만)</span>':''}</div><div class="set-sb">${it.sub}</div></div><div class="toggle ${_notiOn(it.k)?'on':'off'}" onclick="togNotiSet('${it.k}',this)"></div></div>`).join('')}
        </div>
      `).join('')}`;
  }
}
function togNotiSet(k,el){const s=DB.g('notiSetting')||{};const cur=_notiOn(k);s[k]=!cur;DB.s('notiSetting',s);el.className='toggle '+(!cur?'on':'off');_updateFcmTokenSettings();toast(!cur?'✅ 알림 켜짐':'🔕 꺼짐');}
function togVibrate(el){const cur=DB.g('notiVibrate')!==false;DB.s('notiVibrate',!cur);el.className='toggle '+(!cur?'on':'off');try{if(!cur&&navigator.vibrate)navigator.vibrate(120);}catch(e){}toast(!cur?'📳 진동 켜짐':'📴 진동 꺼짐');}
function togNotiAll(on){const s=DB.g('notiSetting')||{};NOTI_GROUPS.forEach(g=>g.items.forEach(it=>{s[it.k]=on;}));DB.s('notiSetting',s);_updateFcmTokenSettings();renderSettings();toast(on?'✅ 전체 알림 켜짐':'🔕 전체 알림 꺼짐');}
// PC 세로선(그래픽 합성 이음새) 보정 실행파일 배포 — 브라우저 설정을 건드리지 않고
// 실행 시에만 GPU 합성을 끄는 바로가기(.bat). 바탕화면에 두고 이걸로 열면 끝.
function _dlSeamFix(){
  const url='https://seorak1275.github.io/seoraksan/';
  const bat='@echo off\r\nrem Seoraksan app - screen seam fix launcher (GPU compositing off, this window only)\r\nstart "" chrome --app="'+url+'" --disable-gpu-compositing\r\nif errorlevel 1 start "" msedge --app="'+url+'" --disable-gpu-compositing\r\n';
  const a=document.createElement('a');
  a.href='data:application/octet-stream,'+encodeURIComponent(bat);
  a.download='설악산현장관리(세로선보정).bat';
  document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),1500);
  toast('💾 받은 파일을 바탕화면에 두고, 앞으로 그 파일로 실행하세요 — 세로선 없이 열립니다',7000);
}

// ══════════════════════════════════════════
// Google Sheets
// ══════════════════════════════════════════
async function syncToSheets(type,data){const url=DB.g('sheetsUrl');if(!url)return;try{await fetch(url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,data,ts:new Date().toISOString()})});}catch(e){console.warn('Sheets:',e);}}

// ══════════════════════════════════════════
// 가이드
// ══════════════════════════════════════════
const GUIDES={
  injury:{title:'부상 유형 안내',items:[{t:'골절',d:'뼈 파손. 변형·압통·부종. 부목 고정 후 이송.'},{t:'열상',d:'피부 찢김. 지혈 후 드레싱.'},{t:'뇌진탕',d:'두부 외상. 구토·기억상실 가능. 경과 관찰.'},{t:'저체온증',d:'체온 35°C 이하. 서서히 가온.'},{t:'심정지',d:'즉각 CPR. AED 확보.'}]},
  bodypart:{title:'신체 부위 주의',items:[{t:'두부·경추',d:'이동 금지. 경추 고정 후 이송.'},{t:'흉복부',d:'내출혈 가능. 산소 공급.'},{t:'골반',d:'대출혈. 압박 금지.'},{t:'척추',d:'로그롤. 마비 위험.'}]},
  severity:{title:'KTAS 중증도',items:[{t:'1 소생',d:'심정지·무호흡. 즉각 처치.'},{t:'2 긴급',d:'의식저하·호흡곤란. 15분 내.'},{t:'3 응급',d:'활력징후 안정. 30분 내.'},{t:'4 준응급',d:'경미 외상. 60분 내.'},{t:'5 비응급',d:'자력 이동. 120분 내.'}]},
  victim:{title:'사고자 기록 안내',items:[{t:'기저질환',d:'고혈압·당뇨·심장병. 처치 방향에 영향.'},{t:'복용약',d:'항혈전제는 출혈 위험 증가.'},{t:'알레르기',d:'약물 알레르기 특히 중요.'}]},
};
function openGuide(key){const g=GUIDES[key];if(!g)return;document.getElementById('guideTitle').textContent=g.title;document.getElementById('guideContent').innerHTML=g.items.map(i=>`<div class="guide-item"><div class="guide-t">${i.t}</div><div class="guide-d">${i.d}</div></div>`).join('');document.getElementById('modalGuide').classList.add('on');}

// ══════════════════════════════════════════
// 홈 요약
// ══════════════════════════════════════════
// ── 카카오 access_token → Apps Script 검증 → Firebase 커스텀 토큰 로그인 ──
// 서버(Apps Script)가 카카오 신원을 확인하고 허용목록을 대조한 뒤에만 토큰을 발급한다.
// 성공 시 _authRole(admin/member)이 세팅되고, 이후 Firestore 접근은 그 토큰으로 이뤄진다.
// (규칙이 아직 느슨한 전환기에는 실패해도 익명 인증이 유지되어 앱이 깨지지 않는다.)
async function _signInWithKakaoToken(kakaoAccessToken){
  const url=_FCM_PUSH_URL||(DB.g('fcmPushUrl')||'').trim();
  if(!url||!kakaoAccessToken)return{error:'no_url_or_token'};
  let j;
  // 미승인일 때 서버가 대기명단에 넣을 수 있도록 현재 프로필 동봉(관리자 직원 탭 자동 노출)
  const _cu=DB.g('currentUser')||{};
  const _prof={realName:_cu.realName||'',name:_cu.name||'',dept:_cu.dept||'',rank:_cu.rank||''};
  try{
    const res=await fetch(url,{
      method:'POST',
      headers:{'content-type':'text/plain;charset=utf-8'}, // Apps Script preflight 회피
      body:JSON.stringify({secret:_FCM_PUSH_SECRET||(DB.g('fcmPushSecret')||''),action:'mintToken',kakaoAccessToken:kakaoAccessToken,profile:_prof})
    });
    j=await res.json();
  }catch(e){return{error:'network',detail:String(e)};}
  if(j&&j.token){
    try{
      await firebase.auth().signInWithCustomToken(j.token);
      _authRole=j.role||'member';
      _authKakaoId=j.kakaoId||'';
      _authReady=true;_authErrCode='';
      if(_authRole==='admin')localStorage.setItem('_tokenAdmin','1');
      else localStorage.removeItem('_tokenAdmin');
      _markMemberOk(); // 멤버 확인 → 오프라인 보호 플래그
      window._memberAuthWarned=false;window._mintNetWarned=false;window._lastMintErr=''; // 복구됨 → 경고 상태 초기화
      try{var _ab=document.getElementById('authFixBanner');if(_ab)_ab.remove();}catch(e){}
      try{_enforceAccessGate();}catch(e){} // 멤버 확인 → 혹시 떠있던 게이트 해제
      setTimeout(_flushSyncQueue,300);
    }catch(e){return{error:'signin_failed',detail:String(e)};}
  }
  // 허용목록에서 빠진 사용자 → 멤버 플래그 회수(다음 게이트 평가 때 차단)
  if(j&&j.error==='not_allowed'){try{localStorage.removeItem('_memberOk');}catch(e){}}
  return j||{error:'empty'};
}
// refresh_token으로 카카오 access_token 재발급 (앱 재시작·토큰 만료 후 무중단 복구)
function _refreshKakaoToken(rt){
  return fetch('https://kauth.kakao.com/oauth/token',{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=utf-8'},
    body:'grant_type=refresh_token&client_id='+KAKAO_KEY+'&refresh_token='+encodeURIComponent(rt)
  }).then(function(r){return r.json();}).then(function(t){
    if(t&&t.access_token){
      try{localStorage.setItem('_kkAT',t.access_token);if(t.refresh_token)localStorage.setItem('_kkRT',t.refresh_token);if(window.Kakao&&Kakao.Auth)Kakao.Auth.setAccessToken(t.access_token);}catch(e){}
      return t.access_token;
    }
    return null;
  }).catch(function(){return null;});
}
// 현재 Firebase 세션에 member 클레임이 없으면 카카오 토큰으로 커스텀 토큰 재발급.
// 새 보안규칙(member==true)에서 익명/만료 세션이 쓰기 거부되는 문제를 재로그인 없이 복구.
let _ensuringMember=false;
async function _ensureMemberAuth(){
  if(_ensuringMember)return false;
  try{
    var u=firebase.auth().currentUser;
    if(u&&!u.isAnonymous){
      try{var r=await u.getIdTokenResult();if(r&&r.claims&&r.claims.member){_markMemberOk();return true;}}catch(e){}
    }
    var cu=DB.g('currentUser')||{};
    if(!cu.kakaoId)return false; // 카카오 로그인 이력이 없으면 재발급 불가(게스트)
    if(!navigator.onLine){window._lastMintErr='offline';return false;} // 오프라인 — 경고 없이 온라인 복귀 때 재시도
    _ensuringMember=true;
    var lastErr='';
    // 1) Kakao SDK가 들고 있는 토큰 또는 저장된 access_token으로 시도
    var at='';
    try{at=(window.Kakao&&Kakao.Auth&&Kakao.Auth.getAccessToken())||'';}catch(e){}
    if(!at)at=localStorage.getItem('_kkAT')||'';
    if(at){var mr=await _signInWithKakaoToken(at);if(mr&&mr.token){_ensuringMember=false;return true;}lastErr=(mr&&mr.error)||'';}
    else lastErr='no_access_token';
    // 2) access_token 만료 → refresh_token으로 새 토큰 발급 후 재시도
    var rt=localStorage.getItem('_kkRT')||'';
    if(rt){
      var nat=await _refreshKakaoToken(rt);
      if(nat){var mr2=await _signInWithKakaoToken(nat);if(mr2&&mr2.token){_ensuringMember=false;return true;}lastErr=(mr2&&mr2.error)||lastErr;}
      else lastErr=lastErr||'refresh_failed';
    }else if(lastErr==='no_access_token')lastErr='no_tokens';
    _ensuringMember=false;
    window._lastMintErr=lastErr||'unknown';
    // 오류 기록은 세션당 1회만 (반복 재시도로 기록이 도배되지 않게)
    if(!window._mintErrLogged){window._mintErrLogged=true;try{_logErr&&_logErr('memberAuth 실패: '+window._lastMintErr);}catch(e){}}
    // 네트워크·서버 일시 장애 → 재로그인 안내 대신 30초 뒤 자동 재시도(오해 방지)
    if(lastErr==='network'){
      if(!window._mintNetWarned){window._mintNetWarned=true;try{toast('⚠️ 인증 서버 연결 실패 — 잠시 후 자동 재시도합니다');}catch(e){}}
      clearTimeout(window._mintRetryT);
      window._mintRetryT=setTimeout(function(){try{_ensureMemberAuth();}catch(e){}},30000);
      return false;
    }
    // 멤버 승급 실패 → 미승인/만료. 프로필 완료 상태면 대기 게이트로 차단.
    try{_enforceAccessGate();}catch(e){}
    if(!window._memberAuthWarned){window._memberAuthWarned=true;
      // 토큰이 아예 없거나 만료 → 그 자리에서 바로 재로그인 제안 (한 번 로그인하면 이후 자동 갱신)
      if(lastErr==='no_tokens'||lastErr==='refresh_failed'){
        setTimeout(function(){
          try{_showAuthFixBanner();}catch(e){}
          try{
            if(confirm('저장 권한이 만료되었습니다 (카카오 로그인 토큰 없음/만료).\n지금 카카오로 다시 로그인할까요?\n\n※ 한 번만 로그인하면 이후엔 자동 갱신됩니다. 데이터는 보존됩니다.'))kakaoLogin();
          }catch(e){}
        },1500);
      }else{
        var _why=lastErr==='not_allowed'?'(승인 목록에서 제외된 상태 — 관리자 확인 필요)':'('+lastErr+')';
        setTimeout(function(){try{toast('⚠️ 저장 권한 오류 '+_why,6000);}catch(e){}},2500);
      }
    }
    return false;
  }catch(e){_ensuringMember=false;return false;}
}
// 재로그인 안내 고정 배너 — confirm을 지나쳐도 남아서 한 탭으로 복구 (로그인 성공 시 자동 제거)
function _showAuthFixBanner(){
  if(document.getElementById('authFixBanner'))return;
  const b=document.createElement('div');b.id='authFixBanner';
  b.style.cssText='position:fixed;top:calc(env(safe-area-inset-top) + 54px);left:10px;right:10px;z-index:9990;background:rgba(160,42,32,.97);border:1px solid rgba(255,180,168,.6);border-radius:11px;padding:9px 12px;display:flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(0,0,0,.5);';
  b.innerHTML='<span style="flex:1;font-size:12px;color:#fff;font-weight:700;line-height:1.4;">⚠️ 저장 권한 만료 — 재로그인 한 번이면 해결돼요 (데이터 보존)</span>'
    +'<button class="press-fx" onclick="try{kakaoLogin()}catch(e){}" style="flex-shrink:0;background:#FEE500;color:#191919;border:none;border-radius:7px;padding:8px 13px;font-size:12px;font-weight:800;cursor:pointer;">카카오 로그인</button>'
    +'<button onclick="var e=document.getElementById(\'authFixBanner\');if(e)e.remove();" style="flex-shrink:0;background:none;border:none;color:rgba(255,255,255,.7);font-size:17px;cursor:pointer;padding:0 2px;">×</button>';
  document.body.appendChild(b);
}
// 온라인 복귀 시 멤버 인증 자동 재시도 (오프라인 중 만료됐던 세션 복구)
window.addEventListener('online',function(){setTimeout(function(){try{_ensureMemberAuth();}catch(e){}},2000);});
// 로그인 이력 기록 (허용목록 관리 UI에서 직원을 골라 추가할 수 있도록 kakaoId+이름 수집)
function _recordLoginLog(){
  try{
    const u=DB.g('currentUser')||{};
    const kid=u.kakaoId||_authKakaoId;
    if(!kid)return;
    const log=(DB.g('loginLog')||[]).slice();
    const entry={kakaoId:String(kid),name:u.realName||u.name||'',dept:u.dept||'',rank:u.rank||'',grade:u.grade||'',at:Date.now()};
    const i=log.findIndex(e=>String(e.kakaoId)===String(kid));
    if(i>=0){
      const old=log[i];
      // 같은 정보로 20시간 내 재로그인이면 기록 생략 — 로그인마다 전 기기가 1읽기씩 재동기화하던 낭비 제거(하루 1회면 충분)
      if(old.name===entry.name&&old.dept===entry.dept&&old.rank===entry.rank&&(entry.at-(old.at||0))<20*3600*1000)return;
      log[i]=entry;
    } else log.push(entry);
    log.sort((a,b)=>(b.at||0)-(a.at||0));
    DB.s('loginLog',log.slice(0,300)); // 최근 300명 유지
  }catch(e){}
}
// 카카오 로그인 리다이렉트 URI: 네이티브 앱은 자기 출처(https://localhost)로 되돌려받아
// 앱 안에서 로그인을 끝낸다(웹페이지로 이탈 → 하얀화면 방지). 웹은 기존 깃헙페이지 경로.
function _kakaoRedirectUri(){
  return (typeof _isNativeApp==='function'&&_isNativeApp()) ? 'https://localhost' : 'https://seorak1275.github.io/seoraksan/';
}
// 로그인 진행 표시: 버튼 누른 뒤(또는 카카오에서 돌아와 토큰 교환 중) '로그인 중입니다…'를 띄우고
// 로그인 버튼을 잠가 중복 클릭을 막는다. 실패·완료 시 off로 원복.
function _loginBusy(on,msg){
  try{
    var b=document.getElementById('btnKakaoLogin');
    var s=document.getElementById('loginStatus');
    var ext=document.getElementById('extLoginWrap');
    if(b){b.style.pointerEvents=on?'none':'';b.style.opacity=on?'.45':'';}
    if(ext){ext.style.pointerEvents=on?'none':'';ext.style.opacity=on?'.4':'';}
    if(s){s.style.display=on?'flex':'none';var m=s.querySelector('.lg-msg');if(m&&msg)m.textContent=msg;}
  }catch(e){}
}
function kakaoLogin(){
  if(!window.Kakao||!Kakao.isInitialized()){toast('⚠️ 카카오 SDK 오류');return;}
  _loginBusy(true,'카카오에 연결 중입니다…'); // 리다이렉트 전에 즉시 피드백(느린 통신에서 중복 클릭 방지)
  // throughTalk:true → 휴대폰에 카카오톡이 깔려 있으면 앱이 켜지며 간편 로그인(이메일·비번 입력 불필요).
  //   앱 없거나 PC면 SDK가 자동으로 웹 로그인으로 폴백. 'prompt:login' 같은 강제 재입력 옵션은 두지 않음.
  // 네이티브 APK는 방금 안정화한 https://localhost 복귀 흐름을 유지하기 위해 throughTalk를 끔(카톡 앱 왕복은
  //   커스텀스킴/네이티브키 추가 설정이 필요해 추후 별도 작업).
  var _native=(typeof _isNativeApp==='function'&&_isNativeApp());
  Kakao.Auth.authorize({redirectUri:_kakaoRedirectUri(),throughTalk:!_native});
}
// [기능 제거 2026-08-06] 카카오톡 특보 알림(나와의 채팅) — 특보운영 폐지로 제거
// ── 외부기관 로그인 (다중 기관 지원) ──
// 저장 구조: extAgencies = [{name, code}] (코드는 평문, 대문자). 구버전(extAgencyCode/
// extAgencyDisplayName)은 최초 1회 자동 마이그레이션.
function _getExtAgencies(){
  var list=DB.g('extAgencies');
  if(Array.isArray(list)&&list.length)return list;
  // 마이그레이션: 단일 기관 설정 → 배열
  var legacyName=DB.g('extAgencyDisplayName')||'환동해 특수대응단';
  var legacyCode=(DB.g('extAgencyCode')||'HWANDONGHA').toUpperCase();
  return [{name:legacyName,code:legacyCode}];
}
function _toggleExtLogin(){
  var f=document.getElementById('extLoginForm');
  if(!f)return;
  var open=f.style.display==='none';
  f.style.display=open?'block':'none';
  if(open){
    // 기관 목록을 드롭다운에 채움
    var sel=document.getElementById('extAgencySel');
    var ags=_getExtAgencies();
    if(sel)sel.innerHTML=ags.map(function(a,i){return '<option value="'+i+'">'+_esc(a.name)+'</option>';}).join('');
    setTimeout(function(){var i=document.getElementById('extPersonInp');if(i)i.focus();},100);
  }
}
// 외부기관 로그인 후 구조 author 문자열: "기관명 · 담당자" (담당자 없으면 기관명만)
function _extAuthorStr(){
  var u=DB.g('currentUser')||{};
  return u.name+(u.person?' · '+u.person:'');
}
async function doExtAgencyLogin(){
  var selEl=document.getElementById('extAgencySel');
  var codeEl=document.getElementById('extCodeInp');
  var personEl=document.getElementById('extPersonInp');
  var person=(personEl?personEl.value:'').trim();
  var code=(codeEl?codeEl.value:'').trim().toUpperCase();
  if(!code){toast('⚠️ 코드를 입력하세요');return;}
  var ags=_getExtAgencies();
  var selIdx=selEl?parseInt(selEl.value||'0',10):0;
  var ag=ags[selIdx]||ags[0];
  if(!ag){toast('⚠️ 등록된 외부기관이 없습니다 (관리자 설정 필요)');return;}
  // 선택한 기관의 코드와 일치해야 함 (해시·평문 모두 허용)
  var storedCode=(ag.code||'').toUpperCase();
  var storedH=await _sha256(storedCode);
  var inputH=await _sha256(code);
  if(inputH!==storedH&&code!==storedCode){toast('❌ '+ag.name+' 코드가 올바르지 않습니다');if(codeEl){codeEl.value='';codeEl.focus();}return;}
  DB.s('currentUser',{name:ag.name,person:person,dept:ag.name,rank:'외부기관',authType:'external'});
  DB.s('authType','external');
  if(window.hideLoginScreen)window.hideLoginScreen();
  updateUserUI();
  goHome();
  toast('✅ '+ag.name+(person?' ('+person+')':'')+'로 로그인');
}
function extAgencyLogout(){
  DB.s('currentUser',{});
  DB.s('authType','');
  if(window.showLoginScreen)window.showLoginScreen();
  updateUserUI();
  toast('로그아웃 됐습니다');
}
function isExternal(){return DB.g('authType')==='external';}
function withdrawAccount(){
  if(!confirm('정말 회원탈퇴 하시겠습니까?\n탈퇴 후 재가입 시 승인코드가 다시 필요합니다.'))return;
  var u=DB.g('currentUser')||{};
  var kakaoId=String(u.kakaoId||'');
  // pendingUsers에서 제거
  if(kakaoId){
    var list=DB.g('pendingUsers')||[];
    DB.s('pendingUsers',list.filter(function(p){return String(p.id)!==kakaoId&&String(p.kakaoId||'')!==kakaoId;}));
    // deletedKakaoIds에 추가해 재로그인 시 코드 재요청
    var deleted=DB.g('deletedKakaoIds')||[];
    if(!deleted.includes(kakaoId)){deleted.push(kakaoId);DB.s('deletedKakaoIds',deleted);}
    // 역할(_acl)도 제거 — 남겨두면 재가입 승인 때 옛 관리자 권한이 그대로 승계되는 구멍(실제 발생)
    try{var acl=_getAcl();acl.members=acl.members.filter(function(x){return x!==kakaoId;});acl.admins=acl.admins.filter(function(x){return x!==kakaoId;});DB.s('_acl',acl);}catch(e){}
  }
  DB.s('currentUser',{});
  DB.s('authType','');
  if(window.showLoginScreen)window.showLoginScreen();
  updateUserUI();
  toast('탈퇴 처리되었습니다');
}
// 최상위 authType 키 확인 + 구버전/유실 시 currentUser로부터 추론·복원.
// (예전 버전에서 로그인했거나 어떤 이유로 authType 키만 비어 있어도, currentUser에
//  로그인 흔적이 남아 있으면 로그인 화면을 다시 띄우지 않도록 함)
function _resolveAuthType(){
  var at=DB.g('authType');
  if(at)return at;
  var u=DB.g('currentUser')||{};
  if(u.authType){DB.s('authType',u.authType);return u.authType;}
  if(u.kakaoId){DB.s('authType','kakao');return 'kakao';}
  return '';
}
// 같은 kakaoId의 프로필(이름·소속·직위)을 서버 기록(pendingUsers·loginLog)에서 currentUser로 복원.
// 기기 변경·캐시 초기화로 로컬 currentUser가 비어도 재입력 없이 이어쓰도록 함.
function _restoreProfileFromServer(kakaoId){
  kakaoId=String(kakaoId||'');if(!kakaoId)return false;
  var u=DB.g('currentUser')||{};
  if(u.dept&&(u.realName||u.name))return true; // 이미 완성(직위는 선택 사항)
  var src=(DB.g('pendingUsers')||[]).find(function(p){return String(p.kakaoId||p.id)===kakaoId&&(p.dept||p.rank);})
        ||(DB.g('loginLog')||[]).find(function(e){return String(e.kakaoId)===kakaoId&&(e.dept||e.rank);});
  if(!src)return false;
  var merged=Object.assign({},u,{
    realName:u.realName||src.realName||src.name||'',
    name:u.name||src.name||src.realName||'',
    dept:u.dept||src.dept||'',
    rank:u.rank||src.rank||'',
    grade:u.grade||src.grade||''
  });
  DB.s('currentUser',merged);
  return !!(merged.dept&&(merged.realName||merged.name));
}
function _checkAndRequireProfile(){
  var authType=_resolveAuthType();
  if(!authType)return;
  if(authType==='external')return; // 외부기관: 프로필 입력 불필요
  var u=DB.g('currentUser')||{};
  var isKakao=authType==='kakao';
  if(isKakao){
    if(window._needsCode)return; // _handleKakaoCode가 처리 중 — 간섭 금지
    // 프로필 미완성(이름·소속)이면 먼저 서버 기록에서 복원 시도, 그래도 없을 때만 입력 요구
    // (직위는 명부에 없어 선택 사항 — 이름·소속만 있으면 완성으로 본다)
    if(!u.dept||!(u.realName||u.name)){
      if(!(u.kakaoId&&_restoreProfileFromServer(u.kakaoId))){
        window._requireProfile=true;
        setTimeout(function(){openChangeUser();},300);
        return;
      }
      try{updateUserUI();}catch(e){}
    }
    // 프로필 완료 → 멤버 승인 여부 확인(미승인이면 전체 차단)
    try{_enforceAccessGate();}catch(e){}
    return;
  }
  if(!u.dept){
    window._requireProfile=true;setTimeout(function(){openChangeUser();},300);
  }
}

var _weatherFetched=false;
var KMA_KEY='S3Nk1fdqSpqzZNX3anqaWA';
var KMA_BASE='https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstInfoService_2.0';
// 지역별 KMA 격자 좌표 — 인제산지=내설악(백담·용대) 권역, 기상청 특보구역 '인제산지'와 동일 명칭
var _WEATHER_REGIONS=[
  {name:'속초',nx:87,ny:141},
  {name:'인제',nx:73,ny:132},
  {name:'인제산지',nx:83,ny:140},
  {name:'양양',nx:79,ny:138},
  {name:'고성',nx:83,ny:146},
  {name:'설악',nx:80,ny:140}
];
// 권역별 대표 위경도 (open-meteo 폴백용 — KMA 프록시 전멸 시)
var _WEATHER_COORDS={속초:{lat:38.21,lng:128.59},인제:{lat:38.06,lng:128.17},인제산지:{lat:38.17,lng:128.37},양양:{lat:38.08,lng:128.62},고성:{lat:38.38,lng:128.47},설악:{lat:38.13,lng:128.41}};
function _kmaNCSTTime(){
  var n=new Date(),m=n.getMinutes();
  var d=m<10?new Date(n-3600000):n;
  var h=d.getHours();
  return{date:d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0'),time:String(h).padStart(2,'0')+'00'};
}
function _kmaVsrtTime(){
  // 초단기예보: HH:30 관측 → HH:45 발표. 45분 이후면 당시간:30, 아니면 전시간:30
  var n=new Date(),h=n.getHours(),m=n.getMinutes();
  var bh=m>=45?h:(h===0?23:h-1);
  var bd=m<45&&h===0?new Date(n-86400000):n;
  return{date:bd.getFullYear()+String(bd.getMonth()+1).padStart(2,'0')+String(bd.getDate()).padStart(2,'0'),time:String(bh).padStart(2,'0')+'30'};
}
function _kmaFcstTime(){
  var n=new Date(),h=n.getHours(),m=n.getMinutes();
  var slots=[23,20,17,14,11,8,5,2];
  for(var i=0;i<slots.length;i++){var s=slots[i];if(h>s||(h===s&&m>=10))return{date:n.getFullYear()+String(n.getMonth()+1).padStart(2,'0')+String(n.getDate()).padStart(2,'0'),time:String(s).padStart(2,'0')+'00'};}
  var p=new Date(n-86400000);return{date:p.getFullYear()+String(p.getMonth()+1).padStart(2,'0')+String(p.getDate()).padStart(2,'0'),time:'2300'};
}
function _kmaItems(json){
  if(!json||!json.response)return[];
  var b=json.response.body;if(!b||!b.items)return[];
  var it=b.items.item;return Array.isArray(it)?it:(it?[it]:[]);
}
// 기상청 apihub는 브라우저 CORS 허용 헤더를 주지 않아 GitHub Pages에서 직접 호출이 차단된다.
// ① 직빵(direct) 먼저 시도 — 되면 가장 빠름 ② 막히면 CORS 프록시 경유로 '진짜 기상청' 데이터 확보
// (authKey는 이미 클라이언트에 노출된 공개 키라 프록시 경유로 인한 추가 노출 없음)
var _KMA_PROXIES=[
  function(u){return 'https://api.codetabs.com/v1/proxy/?quest='+encodeURIComponent(u);},
  function(u){return 'https://api.allorigins.win/raw?url='+encodeURIComponent(u);},
  function(u){return 'https://corsproxy.io/?url='+encodeURIComponent(u);}
];
var _KMA_DEFAULT_PROXY='https://seoraksan-kma.yraphael.workers.dev'; // 기본 내장 프록시(Cloudflare Worker) — 관리자 설정 미입력 시 사용
// 기상청 typ01 응답은 EUC-KR — UTF-8로 읽으면 한글이 �로 깨져 특보 파싱이 전부 실패한다.
// UTF-8로 먼저 읽고 깨짐(U+FFFD)이 보이면 EUC-KR로 다시 디코딩.
function _kmaReadText(r){
  return r.arrayBuffer().then(function(buf){
    var u8=new Uint8Array(buf);var txt='';
    try{txt=new TextDecoder('utf-8').decode(u8);}catch(e){}
    if(!txt||txt.indexOf('\uFFFD')>=0){try{txt=new TextDecoder('euc-kr').decode(u8);}catch(e){}}
    return txt;
  });
}
function _fetchKma(url,asText){
  var read=function(r){if(!r||!r.ok)throw new Error('http '+(r&&r.status));return asText?_kmaReadText(r):r.json();};
  var chain=[];
  // ① 관리자가 설정한 본인 소유 프록시(Cloudflare Worker) 우선 — 가장 안정적, 미입력 시 내장 기본값 사용
  var w=(DB.g('kmaProxyUrl')||'').trim()||_KMA_DEFAULT_PROXY;
  if(w)chain.push(w+(w.indexOf('?')>=0?'&':'?')+'url='+encodeURIComponent(url));
  // ② 직빵(direct) — 혹시 되면 최속
  chain.push(url);
  // ③ 공개 CORS 프록시 보조
  _KMA_PROXIES.forEach(function(p){chain.push(p(url));});
  var go=function(i){
    if(i>=chain.length)return Promise.reject(new Error('kma all sources failed'));
    return fetch(chain[i]).then(read).then(function(v){window._kmaLastSrc=chain[i];return v;}).catch(function(){return go(i+1);});
  };
  return go(0);
}
// [기능 제거 2026-08-06] 특보 수신 진단(kmaWarnDiag) 제거 — 데이터는 백업 파일(삭제전백업_암벽_특보_장비_2026-08-06.json) 참조
// [기능 제거 2026-08-06] 기상특보(KMA) 주기 재조회·자동 발령 제거(특보운영 기능 폐지) — 데이터는 백업 파일(삭제전백업_암벽_특보_장비_2026-08-06.json) 참조
// ── 날씨 30분마다 자동 갱신 (백그라운드 시 정지) ──
setInterval(function(){
  if(document.hidden)return;
  _weatherFetched=false;_wDetailCache=null;fetchWeather();
},30*60*1000);

// ── 진행중 구조 방치 감시: 보고서·타임라인에 24시간 새 내용이 없으면 '최초 작성자에게만' 알림 ──────
// (추가보고·📌 기록·댓글·팀 출동/도착·공단 공유·인계 등 모든 활동을 '새 내용'으로 집계.
//  하루 한 번만 — 끝났는데 종료 처리를 잊은 건을 확인시키는 용도)
const _STALE_HOURS=24;              // 무소식 임계(시간)
const _STALE_REPEAT_MS=24*3600*1000; // 동일 건 재알림 최소 간격 (하루 1회)
let _staleAlerted={};               // {id: lastAlertTs} — 재시작해도 유지(localStorage)
try{_staleAlerted=JSON.parse(localStorage.getItem('_staleAlerted_v1')||'{}')||{};}catch(e){}
function _parseDT(s){
  // "YYYY-MM-DD HH:MM" 또는 "YYYY-MM-DDTHH:MM" → ms
  if(!s)return null;
  const m=String(s).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/);
  if(!m)return null;
  return new Date(+m[1],+m[2]-1,+m[3],+m[4],+m[5]).getTime();
}
function _lastActivityTs(r){
  let t=_parseDT(r.date)||0;
  const up=v=>{const pt=_parseDT(v);if(pt&&pt>t)t=pt;};
  (r.reports||[]).forEach(p=>{up(p.repTime);up(p.date);});
  (r.timetable||[]).forEach(e=>up(e.time));          // 📌 기록
  (r.comments||[]).forEach(c=>up(c.time));            // 댓글
  (r.npsLog||[]).forEach(n=>up(n.time));              // 공단 공유
  (r.teams||[]).forEach(tm=>{up(tm.requestedAt);up(tm.arrivedAt);up(tm.createdAt);}); // 팀 출동·도착
  if(r.handover)up(r.handover.time);                  // 환자 인계
  return t;
}
function _checkStaleRescues(){
  // 최초 작성자(r.author)의 기기에서만 로컬 알림 — 전체 방송·OS푸시 없음
  const u=DB.g('currentUser')||{};
  if(!u.name)return;
  if(!_notiOn('progress'))return;
  const res=DB.g('rescues')||[];
  const nowMs=Date.now();
  res.filter(r=>r.status==='ongoing').forEach(r=>{
    if(!r.author||String(r.author).trim()!==String(u.name).trim())return;
    const last=_lastActivityTs(r);
    if(!last)return;
    const elapsedH=(nowMs-last)/3600000;
    if(elapsedH<_STALE_HOURS)return;
    const lastAlert=_staleAlerted[r.id]||0;
    if(nowMs-lastAlert<_STALE_REPEAT_MS)return;
    _staleAlerted[r.id]=nowMs;
    try{localStorage.setItem('_staleAlerted_v1',JSON.stringify(_staleAlerted));}catch(e){}
    const d=Math.floor(elapsedH/24);
    const msg='💤 내가 접수한 "'+(r.title||'진행중 구조')+'" — '+(d>=1?d+'일':Math.floor(elapsedH)+'시간')+' 동안 새 소식 없음. 상황이 끝났다면 종료 처리해 주세요';
    try{const ns=DB.g('notis')||[];ns.unshift({id:nowMs,msg,ico:'💤',time:now(),read:false,link:{app:'rescue',tab:2,id:r.id}});if(ns.length>80)ns.splice(80);DB.s('notis',ns);updateBell();}catch(e){}
    try{_showSystemNoti(msg,'💤');}catch(e){}
  });
}
setInterval(_checkStaleRescues,15*60*1000);
setTimeout(_checkStaleRescues,60*1000);
function updateSummary(){
  const res=DB.g('rescues')||[];const facs=DB.g('facilities')||[];
  // 시설 위험은 폐지된 status 대신 현재 경고표시(_facWarn) 기준 — 홈 '위험시설' 수가 항상 0이던 문제 수정
  const og=res.filter(r=>r.status==='ongoing');const bad=facs.filter(f=>typeof _facWarn==='function'&&_facWarn(f));
  const thisMonth=res.filter(r=>r.date&&r.date.startsWith(today().slice(0,7))).length;
  function se(id,v){const e=document.getElementById(id);if(!e)return;if(typeof _countTo==='function')_countTo(e,v);else e.textContent=v;}
  se('hs-og',og.length);
  se('hs-tot',thisMonth);
  se('hs-fb',bad.length);
  se('hs-ft',facs.length);
  const ogNumEl=document.getElementById('hs-og');
  if(ogNumEl)ogNumEl.classList.toggle('blink',og.length>0);
  function sd(id,v,col){const e=document.getElementById(id);if(!e)return;e.textContent=v;e.style.color=col||'';}
  sd('hdR',og.length?`⚠️ ${og.length}건 진행중`:'구조보고·위험상황',og.length?'#ffaaaa':'');
  sd('hdI',bad.length?`⚠️ 위험 ${bad.length}개`:'시설 관리·이력',bad.length?'#ffaaaa':'');
  sd('hdA','기상특보 비상근무','');
  updateBell();
  try{_checkNewJoinerAlert();}catch(e){}
  try{renderHomeActive();}catch(e){}
  try{renderMobilizeBanner();}catch(e){}
}
// ── 홈 메뉴 표시 관리 (관리자 전용, 전 직원 동기화) ──
// 미완성 기능을 전 직원 화면에서 숨긴다. 잠금 방지를 위해 '내 설정'·'관리자 전용'은 숨김 대상에서 제외.
var HOME_MENUS=[
  {k:'rescue', id:'mbRescue', label:'🚨 재난/구조'},
  {k:'inspect',id:'mbInspect',label:'🛠️ 시설물 점검'},
  {k:'stats',  id:'mbStats',  label:'📊 전체 통계'},
  {k:'board',  id:'mbBoard',  label:'🖥️ 상황판'}
];
function _homeHiddenSet(){try{return new Set((DB.g('homeHidden')||[]).map(String));}catch(e){return new Set();}}
function _applyHomeMenuVisibility(){
  var hid=_homeHiddenSet();
  HOME_MENUS.forEach(function(m){
    var el=document.getElementById(m.id);if(!el)return;
    el.style.display=hid.has(m.k)?'none':'';
  });
}
function _setHomeMenuHidden(key,hidden){
  if(!(typeof isAdminUser==='function'&&isAdminUser())){toast('⚠️ 관리자만 변경할 수 있습니다');return;}
  var arr=(DB.g('homeHidden')||[]).map(String).filter(Boolean);
  var set=new Set(arr);
  if(hidden)set.add(String(key));else set.delete(String(key));
  DB.s('homeHidden',Array.from(set));
  try{_applyHomeMenuVisibility();}catch(e){}
  try{if(typeof renderAdmSys==='function'&&document.getElementById('admSysWrap'))renderAdmSys();}catch(e){}
  var m=HOME_MENUS.find(function(x){return x.k===String(key);});
  toast((hidden?'🙈 숨김: ':'👁️ 표시: ')+(m?m.label:key));
}
// 홈: 진행중 구조 건을 가로 스크롤 카드로 즉시 노출 (한눈에 현황 파악)
function renderHomeActive(){
  try{_applyHomeMenuVisibility();}catch(e){}
  const el=document.getElementById('homeActiveStrip');if(!el)return;
  // 내용이 그대로면 innerHTML 재작성 생략 — 원격 갱신 버스트마다 홈 스트립 DOM 재구성하던 비용 제거
  const _setHA=h=>{if(el._lastHtml!==h){el._lastHtml=h;el.innerHTML=h;}};
  if(isExternal()){el.style.display='none';_setHA('');return;}
  el.style.display='block';
  const og=(DB.g('rescues')||[]).filter(r=>r.status==='ongoing');
  const haz=(typeof _HAZ_OFF!=='undefined'&&_HAZ_OFF)?[]:(DB.g('hazards')||[]).filter(h=>!h.hazStatus||h.hazStatus==='미조치'||h.hazStatus==='조치중');
  // 폐지된 status 대신 현재 경고표시(_facWarn) 기준 — 홈 주의현황에 위험시설 카드가 안 뜨던 문제 수정(updateSummary와 동일)
  const badFac=(DB.g('facilities')||[]).filter(f=>typeof _facWarn==='function'&&_facWarn(f));
  const total=og.length+haz.length+badFac.length;
  if(!total){
    // 첫 동기화 전(콜드 부팅)엔 '없음'으로 단정하지 않고 스켈레톤 자리표시 — 데이터 도착 시 자동 교체
    if(!window._dbFirstReady){
      _setHA(`<div style="display:flex;align-items:center;gap:12px;background:#0c1826;border:1px solid rgba(255,255,255,.05);border-radius:16px;padding:15px 16px;">
        <div class="skl" style="width:40px;height:40px;border-radius:50%;flex-shrink:0;"></div>
        <div style="flex:1;min-width:0;"><div class="skl" style="width:55%;height:14px;margin-bottom:7px;"></div>
        <div class="skl" style="width:82%;height:10px;"></div></div>
      </div>`);
      return;
    }
    _setHA(`<div style="display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,#0e2a20,#0b1c19);border:1px solid rgba(39,174,96,.22);border-radius:16px;padding:15px 16px;">
      <div style="width:40px;height:40px;border-radius:50%;background:rgba(39,174,96,.15);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">✅</div>
      <div style="min-width:0;"><div style="font-size:14px;font-weight:800;color:#eef0f2;">현재 주의 항목 없음</div>
      <div style="font-size:11.5px;color:#7fb89c;margin-top:2px;">진행 중인 구조·위험 상황이 없습니다</div></div>
    </div>`);
    return;
  }
  // 상단 요약(0건 카테고리는 생략)
  const sum=[];
  if(og.length)sum.push(`<span style="color:#ff7a6e;font-weight:800;">진행중 ${og.length}</span>`);
  if(haz.length)sum.push(`<span style="color:#f0a44a;font-weight:800;">위험상황 ${haz.length}</span>`);
  if(badFac.length)sum.push(`<span style="color:#ffc05a;font-weight:800;">위험시설 ${badFac.length}</span>`);
  // 공통 카드 골격
  const _card=(onclick,accent,borderRGBA,badgeBg,badgeCol,badgeTxt,ico,mobHtml,title,meta,foot)=>
    `<div onclick="${onclick}" style="flex:0 0 auto;width:166px;background:#0f1e30;border:1px solid ${borderRGBA};border-left:3px solid ${accent};border-radius:13px;padding:10px 12px;cursor:pointer;box-shadow:0 2px 9px rgba(0,0,0,.3);">
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:6px;">
        <span style="font-size:14px;">${ico}</span>
        <span style="font-size:10px;font-weight:800;color:${badgeCol};background:${badgeBg};border-radius:6px;padding:2px 6px;letter-spacing:.2px;">${badgeTxt}</span>
        ${mobHtml||''}
      </div>
      <div style="font-size:11.5px;font-weight:700;color:#eef0f2;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
      <div style="font-size:9.5px;color:#949aa2;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${meta}</div>
      ${foot||''}
    </div>`;
  const cards=[];
  og.slice().reverse().forEach(r=>{
    const ti=RES_TYPES[r.type]||RES_TYPES['기타'];
    const elp=_elapsedStr(r.date);
    const mob=(r.mobilize&&r.mobilize.length)?`<span style="font-size:8px;background:rgba(231,76,60,.2);color:#ff6b5e;border-radius:7px;padding:1px 5px;font-weight:700;">🚨</span>`:'';
    cards.push(_card(`openRescueFromHome(${r.id})`,'#e74c3c','rgba(231,76,60,.3)','rgba(231,76,60,.18)','#ff7a6e','진행중',ti.ico,mob,
      _esc(r.title||r.type),
      _esc(r.vName||'미상')+(r.location?' · '+_esc(r.location):''),
      elp?`<div class="js-elapsed" data-d="${_esc(r.date)}" style="font-size:10px;font-weight:700;color:#f0a500;margin-top:4px;">⏱ ${elp}</div>`:''));
  });
  haz.slice().reverse().forEach(h=>{
    const hico=(h.hazType||'').split(' ')[0]||'⚠️';
    cards.push(_card(`openHazFromHome(${h.id})`,'#e67e22','rgba(230,126,34,.32)','rgba(230,126,34,.18)','#f0a44a',_esc(h.hazStatus||'미조치'),hico,'',
      _esc((h.hazType||'위험상황').replace(/^\S+\s/,'')||'위험상황'),
      _esc(h.loc||'위치 미상')+(h.danger?' · '+_esc(h.danger):'')));
  });
  badFac.forEach(f=>{
    const fico=(String(f.type||'')).split(' ')[0]||'🛠️';
    cards.push(_card(`openFacFromHome(${f.id})`,'#e0a030','rgba(224,160,48,.32)','rgba(224,160,48,.18)','#ffc05a','위험',fico,'',
      _esc(f.name||'시설물'),
      _esc(String(f.type||'').split(' ').slice(1).join(' ')||'시설')+(f.loc?' · '+_esc(f.loc):'')));
  });
  _setHA(`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <span style="font-size:12.5px;font-weight:800;color:#eef0f2;">⚡ 주의 현황</span>
      <span style="font-size:10.5px;color:#9bb8cc;">${sum.join(' <span style=\"color:#3a5a74;\">·</span> ')}</span>
    </div>
    <div style="display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding-bottom:2px;">${cards.join('')}</div>`);
}
function openRescueFromHome(id){
  openApp('rescue');
  setTimeout(()=>{try{openResListDetail(id);}catch(e){}},90);
}
function openHazFromHome(id){
  openApp('rescue');
  setTimeout(()=>{try{openHazDetail(id);}catch(e){}},90);
}
function openFacFromHome(id){
  openApp('inspect');
  setTimeout(()=>{try{openFacDetail(id);}catch(e){}},120);
}
// [기능 제거 2026-08-06] 🧗 암벽 이용관리(climbUsage) 전체 블록 제거(업로드·명단·통계·사고자 연동 포함) — 데이터는 백업 파일(삭제전백업_암벽_특보_장비_2026-08-06.json) 참조
// ══════════════════════════════════════════
// 전체 통계 (일반직원도 열람 가능)
// ══════════════════════════════════════════
function renderFullStats(){
  // 전년대비·전체 통계는 1년 이전 기록도 필요 → 최초 1회만 로드 후 재호출(이후엔 이미 로드됨)
  if(_ARCHIVE_COLLS.some(k=>!_archiveLoaded[k])){
    Promise.all(_ARCHIVE_COLLS.map(_loadArchive)).then(()=>{if(window.curApp==='stats')renderFullStats();});
  }
  const res=DB.g('rescues')||[];const facs=DB.g('facilities')||[];
  const haz=DB.g('hazards')||[];const hist=DB.g('history')||[];
  const now_=new Date();const todayStr=today();
  const fy=s=>s&&s.startsWith(now_.getFullYear()+'-');
  const fy_prev=s=>s&&s.startsWith((now_.getFullYear()-1)+'-');
  const fm=s=>s&&s.startsWith(now_.getFullYear()+'-'+(''+(now_.getMonth()+1)).padStart(2,'0'));
  const fw=s=>{if(!s)return false;const ds=String(s).split(' ')[0].split('T')[0];const day=now_.getDay()||7;const m=new Date(now_);m.setDate(now_.getDate()-(day-1));const e=new Date(m);e.setDate(m.getDate()+6);const _f=dt=>dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');return ds>=_f(m)&&ds<=_f(e);}; // UTC파싱 제거 — 로컬 날짜 문자열 비교(주 경계 정확)
  const fd=s=>s&&s.startsWith(todayStr);
  const period=window._statPeriod||'이번달';
  const pf={'오늘':fd,'이번주':fw,'이번달':fm,'올해':fy,'전체':()=>true}[period]||fm;
  const getDate=r=>r.date||r.dt||'';
  const pRes=res.filter(r=>pf(getDate(r)));
  const pHaz=haz.filter(h=>pf(getDate(h)));
  const pHist=hist.filter(h=>pf(h.date||''));
  // 전년대비
  const thisY=res.filter(r=>fy(getDate(r))).length;
  const prevY=res.filter(r=>fy_prev(getDate(r))).length;
  const diff=thisY-prevY;
  const diffStr=diff>0?`▲${diff}`:diff<0?`▼${Math.abs(diff)}`:'±0';
  const diffCol=diff>0?'#c0392b':diff<0?'#27ae60':'#565f6b';
  // 유형별
  const typeMap={};pRes.forEach(r=>{typeMap[r.type]=(typeMap[r.type]||0)+1;});
  // 안전사고 세부
  const accRes=pRes.filter(r=>r.type==='안전사고');
  const injMap={},sevMap={},cauMap={},locMap={},methodMap={};
  accRes.forEach(r=>{
    (r.injuryParts||[]).forEach(p=>{injMap[p]=(injMap[p]||0)+1;});
    if(r.severity)sevMap[r.severity]=(sevMap[r.severity]||0)+1;
    if(r.cause){const c=(typeof _causeCanon==='function')?_causeCanon(r.cause):r.cause;if(c)cauMap[c]=(cauMap[c]||0)+1;}
    if(r.loctype)locMap[r.loctype]=(locMap[r.loctype]||0)+1;
    (r.rescueMethod||[]).forEach(m=>{methodMap[m]=(methodMap[m]||0)+1;});
  });
  const topN=(obj,n=5)=>Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,n);
  const safe_max=obj=>Math.max(...Object.values(obj),1);
  const barRow=(k,v,max,col)=>`<div style="margin-bottom:4px;"><div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:1px;"><span style="color:#cdd1d6;">${_esc(k)}</span><span style="color:${col};font-weight:700;">${v}</span></div><div style="height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;"><div style="height:100%;width:${Math.round(v/max*100)}%;background:${col};border-radius:2px;"></div></div></div>`;
  const mini=(label,val,col='#eaecef')=>`<div style="background:#0f0f11;border-radius:7px;padding:5px 4px;text-align:center;"><div style="font-size:14px;font-weight:800;color:${col};line-height:1.2;">${val}</div><div style="font-size:8px;color:#8b95a1;margin-top:1px;">${label}</div></div>`;
  const pill_tab=p=>`<div onclick="window._statPeriod='${p}';renderFullStats();" style="flex:1;padding:5px 2px;text-align:center;font-size:11px;font-weight:600;border-radius:7px;cursor:pointer;${p===period?'background:#1a4a6e;color:#eaecef;':'color:rgba(255,255,255,.6);'}">${p}</div>`;
  const row2=(a,b)=>`<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">${a}${b}</div>`;
  const w=document.getElementById('statsWrap');
  w.innerHTML=`
    <div style="display:flex;background:#1c1c1e;border-radius:9px;padding:3px;gap:2px;margin-bottom:2px;">
      ${['오늘','이번주','이번달','올해','전체'].map(pill_tab).join('')}
    </div>
    ${row2(
      `<div class="scard">
        <div class="stitle">🚨 구조 · ${period} ${pRes.length}건</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-bottom:${Object.keys(typeMap).length?'6':'0'}px;">
          ${mini(period,pRes.length,'#3182f6')}${mini('진행중',res.filter(r=>r.status==='ongoing').length,'#c0392b')}
          ${mini('전년대비',diffStr,diffCol)}${mini('누적',res.length)}
        </div>
        ${Object.keys(typeMap).length?topN(typeMap,3).map(([k,v])=>barRow(k,v,safe_max(typeMap),'#3182f6')).join(''):''}
      </div>`,
      `<div class="scard">
        <div class="stitle">⚠️ 위험상황 · ${pHaz.length}건</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;margin-bottom:4px;">
          ${mini('낙석',pHaz.filter(h=>h.hazType?.includes('낙석')).length,'#7d3c98')}
          ${mini('위험수목',pHaz.filter(h=>h.hazType?.includes('위험수목')).length,'#ca6f1e')}
          ${mini('산불',pHaz.filter(h=>h.hazType?.includes('산불')).length,'#a93226')}
        </div>
        <div style="font-size:9px;color:#6b7684;">미조치 ${pHaz.filter(h=>h.hazStatus==='미조치').length} · 완료 ${pHaz.filter(h=>h.hazStatus&&h.hazStatus!=='미조치'&&h.hazStatus!=='조치중').length}</div>
      </div>`
    )}
    <div class="scard">
      <div class="stitle">🛠️ 시설물 · 점검 ${pHist.length}건</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:3px;">
        ${mini('전체',facs.length)}${mini('⚠️경고표시',facs.filter(f=>typeof _facWarn==='function'&&_facWarn(f)).length,'#c0392b')}
        ${mini('등급 D·E',facs.filter(f=>{try{const g=_facCurGrade(f);return g&&(g.g==='D'||g.g==='E');}catch(e){return false;}}).length,'#e67e22')}${mini('기간점검',pHist.length,'#27ae60')}
      </div>
    </div>
    

    ${accRes.length?`
    <div class="scard">
      <div class="stitle">🤕 안전사고 세부 · ${accRes.length}건</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:3px;margin-bottom:6px;">
        ${mini('내국인',accRes.filter(r=>r.vNation==='내국인').length)}
        ${mini('외국인',accRes.filter(r=>r.vNation==='외국인').length)}
        ${mini('음주',accRes.filter(r=>r.alcohol==='확인됨'||r.alcohol==='의심').length,'#e67e22')}
        ${mini('후송',accRes.filter(r=>r.hospital&&r.hospital.includes('후송')).length,'#c0392b')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div>${Object.keys(cauMap).length?`<div class="stitle">⚡원인</div>${topN(cauMap,3).map(([k,v])=>barRow(k,v,safe_max(cauMap),'#e67e22')).join('')}`:''}</div>
        <div>${Object.keys(injMap).length?`<div class="stitle">🦵부위</div>${topN(injMap,3).map(([k,v])=>barRow(k,v,safe_max(injMap),'#c0392b')).join('')}`:''}</div>
        <div>${Object.keys(methodMap).length?`<div class="stitle">🚑방법</div>${topN(methodMap,3).map(([k,v])=>barRow(k,v,safe_max(methodMap),'#27ae60')).join('')}`:''}</div>
        <div>${Object.keys(sevMap).length?`<div class="stitle">🩺중증도</div>${topN(sevMap,3).map(([k,v])=>barRow(k,v,safe_max(sevMap),'#7d3c98')).join('')}`:''}</div>
      </div>
    </div>`:''}
  `;
}

// 목록·홈 주의현황에서 탭 → 지도 팝업과 동일한 우선순위·병합 정보로 표시
// (예전의 '1보/2보 선택 모달' 대신. 더 자세히는 팝업의 📄 보고서 버튼으로)
function openResListDetail(id){
  try{openRescueOverlay(id);}catch(e){}
}
function viewSinglePhase(resId,phaseIdx){
  const res=DB.g('rescues')||[];const r=res.find(x=>x.id===resId);if(!r)return;
  selResId=resId;curResId=resId;
  document.getElementById('topTitle').textContent=r.title+' · '+(phaseIdx+1)+'보';
  document.getElementById('bnav').style.display='none';
  _hideRepFooter();showV('v-report');
  const all=[r,...(r.reports||[])];
  renderPhaseBar(phaseIdx,all.length);
  // 단일 보 내용만 표시
  const p=all[phaseIdx];const isFirst=phaseIdx===0;
  const w=document.getElementById('repContent');
  const content=isFirst?`
    <div class="rsec"><div class="rsec-t">📋 1보 — 초기 접수</div>
      <div style="font-size:12px;color:#8b95a1;line-height:2.0;">
        <b>유형:</b> ${r.type}<br><b>발생:</b> ${r.date}<br><b>위치:</b> ${r.location||'-'} (${r.loctype||'-'})<br>
        <b>사고자:</b> ${r.vName||'미상'} / ${(r.vGender&&r.vGender!=='알수없음')?r.vGender:'성별미상'} / ${(r.vNation&&r.vNation!=='알수없음')?r.vNation:'국적미상'}<br>
        <b>연락처:</b> ${r.vTel||'-'}<br><b>중증도:</b> ${r.severity||'-'}<br>
        <b>사고 원인:</b> ${r.cause||'-'}<br><b>부상 부위:</b> ${(r.injuryParts||[]).join(', ')||'-'}<br>
        <b>구조 방법:</b> ${(r.rescueMethod||[]).join(', ')||'-'}<br>
        <b>출동 대원:</b> ${(r.members||[]).join(', ')||'-'}<br>
        <b>병원 후송:</b> ${(r.hospital&&r.hospital!=='미정')?r.hospital:'미정'}<br><b>작성자:</b> ${r.author||'-'}
      </div>
    </div>`:
    `<div class="rsec"><div class="rsec-t">📋 ${phaseIdx+1}보 — 상황 업데이트</div>
      <div style="font-size:12px;color:#8b95a1;line-height:2.0;">
        <b>보고 시간:</b> ${p.repTime||'-'}<br>
        <b>상황 내용:</b> ${p.update||'-'}<br>
        <b>부상자 상태:</b> ${p.victimChange||'-'}<br>
        ${p.addMem?`<b>추가 대원:</b> ${p.addMem}<br>`:''}
        <b>작성자:</b> ${p.author||'-'}
      </div>
    </div>`;
  w.innerHTML=content+`
    <div style="display:flex;gap:6px;margin-top:6px;">
      <button class="btn btn-ghost" style="flex:1;" onclick="openResListDetail(${resId})">← 보 목록</button>
      <button class="btn btn-blue" style="flex:1;" onclick="renderTimeline(getRes(${resId}))">📊 전체 타임라인</button>
    </div>`;
}
function openFullTimeline(){
  const res=DB.g('rescues')||[];const r=res.find(x=>x.id===selResId);if(!r)return;
  closeM('modalPhaseSelect');
  document.getElementById('topTitle').textContent=r.title+' 타임라인';
  document.getElementById('bnav').style.display='none';
  _hideRepFooter();showV('v-report');
  renderPhaseBar((r.reports||[]).length,(r.reports||[]).length+1);
  renderTimeline(r,'brief');
}


// [기능 제거 2026-08-06] 🧰 구조대 장비관리(equipInv) 전체 블록 제거 — 데이터는 백업 파일(삭제전백업_암벽_특보_장비_2026-08-06.json) 참조
// ══════════════════════════════════════════
// 응소 응답(예상 도착시간 / 응소불가 / 미응답)
// ══════════════════════════════════════════
const MOBILIZE_DEPT_MAP={'특구대':'특수산악구조대','재난과':'재난안전과'}; // 전직원응소는 전체 대상
// 목록 카드에서 한눈에 보이는 응소 응답 요약 배지 — 상세를 열지 않아도 진행 상황 파악 가능
function _mobilizeCompactBadge(r){
  if(!r.mobilize||!r.mobilize.length)return '';
  const roster=_mobilizeRoster(r.mobilize);if(!roster.length)return '';
  const respMap={};(r.mobilizeResp||[]).forEach(x=>{respMap[x.name]=x;});
  const okCnt=roster.filter(s=>(respMap[s.name]||{}).status==='eta').length;
  const noCnt=roster.filter(s=>(respMap[s.name]||{}).status==='unable').length;
  return ` <span style="font-size:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:9px;padding:1px 6px;font-weight:700;vertical-align:middle;color:#a5abb3;">🟢${okCnt} 🔴${noCnt} ⚪${roster.length-okCnt-noCnt}</span>`;
}
function _mobilizeRoster(mobilize){
  if(!mobilize||!mobilize.length)return [];
  const all=getTeamMembers();
  if(mobilize.includes('전직원응소'))return all;
  const depts=mobilize.map(m=>MOBILIZE_DEPT_MAP[m]).filter(Boolean);
  if(!depts.length)return [];
  return all.filter(s=>depts.includes(s.dept));
}
function _mobilizeBlockHtml(coll,r){
  if(!r.mobilize||!r.mobilize.length)return '';
  const roster=_mobilizeRoster(r.mobilize);
  const respMap={};(r.mobilizeResp||[]).forEach(x=>{respMap[x.name]=x;});
  const me=DB.g('currentUser')||{};
  const myName=me.realName||me.name||'';
  const iAmTarget=!!myName&&roster.some(s=>s.name===myName);
  const myResp=myName?respMap[myName]:null;
  const okCnt=roster.filter(s=>(respMap[s.name]||{}).status==='eta').length;
  const noCnt=roster.filter(s=>(respMap[s.name]||{}).status==='unable').length;
  const pendCnt=roster.length-okCnt-noCnt;
  // 과/분소별로 묶어서 표시 — 부서가 둘 이상 섞여 있을 때만 그룹 헤더 노출
  const deptGroups={};roster.forEach(s=>{const k=s.dept||'기타';if(!deptGroups[k])deptGroups[k]=[];deptGroups[k].push(s);});
  const deptKeys=Object.keys(deptGroups).sort((a,b)=>DEPTS.indexOf(a)-DEPTS.indexOf(b));
  const multiDept=deptKeys.length>1;
  const personRow=s=>{
    const rr=respMap[s.name];
    let stat;
    if(rr&&rr.status==='eta')stat=`<span style="color:#3ad17a;">🟢 도착예정 ${_esc(rr.eta)}</span>`;
    else if(rr&&rr.status==='unable')stat=`<span style="color:#e74c3c;">🔴 응소불가</span>`;
    else stat=`<span style="color:rgba(255,255,255,.35);">⚪ 미응답</span>`;
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:11px;">
      <span style="color:#c4c8ce;">${_esc(s.name)}${s.rank?` <span style="color:#565f6b;font-size:9px;">${_esc(s.rank)}</span>`:''}</span>${stat}
    </div>`;
  };
  const rows=deptKeys.map(dk=>{
    const members=deptGroups[dk];
    const dOk=members.filter(s=>(respMap[s.name]||{}).status==='eta').length;
    const dNo=members.filter(s=>(respMap[s.name]||{}).status==='unable').length;
    return (multiDept?`<div style="font-size:10px;font-weight:700;color:#7ec8a0;margin:6px 0 2px;padding-top:6px;border-top:.5px solid rgba(255,255,255,.05);display:flex;justify-content:space-between;"><span>${_esc(dk)}</span><span style="color:#565f6b;">🟢${dOk} 🔴${dNo} / ${members.length}명</span></div>`:'')
      +members.map(personRow).join('');
  }).join('');
  return `<div id="mobBlk_${coll}_${r.id}" style="background:#1c1c1e;border-radius:10px;padding:11px 12px;border:.5px solid rgba(231,76,60,.25);margin-top:8px;">
    <div style="font-size:11px;color:#e74c3c;font-weight:700;margin-bottom:7px;">🚨 응소 현황 (${_esc(r.mobilize.join('·'))})</div>
    ${roster.length>1?`<div style="display:flex;gap:10px;font-size:10.5px;font-weight:700;margin-bottom:7px;padding-bottom:7px;border-bottom:.5px solid rgba(255,255,255,.07);">
      <span style="color:#3ad17a;">🟢 ${okCnt}명</span><span style="color:#e74c3c;">🔴 ${noCnt}명</span><span style="color:rgba(255,255,255,.4);">⚪ ${pendCnt}명</span><span style="color:#565f6b;margin-left:auto;">총 ${roster.length}명</span>
    </div>`:''}
    ${rows||'<div style="font-size:11px;color:rgba(255,255,255,.3);">대상 인원 없음</div>'}
    ${iAmTarget?`<div>
      <div id="mobBtnRow_${coll}_${r.id}" style="display:flex;gap:6px;margin-top:8px;">
        <button onclick="_toggleMobEtaInput('${coll}',${r.id})" style="flex:1;background:rgba(39,174,96,.15);color:#3ad17a;border:1px solid rgba(39,174,96,.35);border-radius:8px;padding:7px;font-size:11px;font-weight:700;cursor:pointer;">🟢 ${myResp&&myResp.status==='eta'?'도착시간 수정':'응소 가능·도착시간 입력'}</button>
        <button onclick="submitMobilizeResp('${coll}',${r.id},'unable')" style="flex:1;background:rgba(231,76,60,.12);color:#e74c3c;border:1px solid rgba(231,76,60,.3);border-radius:8px;padding:7px;font-size:11px;font-weight:700;cursor:pointer;">🔴 응소 불가</button>
      </div>
      <div id="mobEtaInputRow_${coll}_${r.id}" style="display:none;margin-top:8px;">
        <div style="display:flex;gap:5px;margin-bottom:6px;">
          ${[10,20,30,60].map(m=>`<button onclick="submitMobilizeResp('${coll}',${r.id},'eta',_etaFromMinutes(${m}))" style="flex:1;background:rgba(39,174,96,.18);color:#3ad17a;border:1px solid rgba(39,174,96,.4);border-radius:8px;padding:6px 2px;font-size:10.5px;font-weight:700;cursor:pointer;">+${m}분</button>`).join('')}
        </div>
        <div style="display:flex;gap:6px;">
          <input type="text" id="mobEtaInp_${coll}_${r.id}" class="fi" placeholder="직접 입력 (예: 14:30)" value="${_esc((myResp&&myResp.eta)||'')}" onkeydown="if(event.key==='Enter')_confirmMobEta('${coll}',${r.id})" style="flex:1;">
          <button onclick="_confirmMobEta('${coll}',${r.id})" style="background:rgba(39,174,96,.18);color:#3ad17a;border:1px solid rgba(39,174,96,.4);border-radius:8px;padding:0 12px;font-size:11px;font-weight:700;cursor:pointer;">확인</button>
          <button onclick="_cancelMobEtaInput('${coll}',${r.id})" style="background:rgba(255,255,255,.06);color:#c4c8ce;border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:0 12px;font-size:11px;font-weight:700;cursor:pointer;">취소</button>
        </div>
      </div>
    </div>`:''}
    ${(pendCnt>0&&isAdminUser())?`<button onclick="_remindMobilizeNonResponders('${coll}',${r.id})" style="width:100%;margin-top:7px;background:rgba(240,165,0,.12);color:#f0a500;border:1px solid rgba(240,165,0,.35);border-radius:8px;padding:6px;font-size:10.5px;font-weight:700;cursor:pointer;">🔔 미응답자 ${pendCnt}명 재알림</button>`:''}
  </div>`;
}
async function _remindMobilizeNonResponders(coll,id){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const arr=DB.g(coll)||[];
  const r=arr.find(x=>x.id===id);
  if(!r)return;
  const roster=_mobilizeRoster(r.mobilize);
  const respMap={};(r.mobilizeResp||[]).forEach(x=>{respMap[x.name]=x;});
  const pendNames=roster.filter(s=>!respMap[s.name]).map(s=>s.name);
  if(!pendNames.length){toast('✅ 전원 응답 완료');return;}
  const title=r.title||r.hazType||'위험상황';
  const body=`🔔 [재알림] ${title} — 응소 여부를 회신해 주세요`;
  toast('🔔 미응답자 재알림 발송 중…');
  try{
    if(!_fdb)throw new Error('no-db');
    const url=_FCM_PUSH_URL||(DB.g('fcmPushUrl')||'').trim();
    const snap=await _fdb.collection('fcmTokens').get();
    const tokens=[];snap.forEach(d=>{const v=d.data()||{};if(v.token&&pendNames.includes(v.name))tokens.push(v.token);});
    if(tokens.length&&url){
      const res=await fetch(url,{method:'POST',headers:{'content-type':'text/plain;charset=utf-8'},
        body:JSON.stringify(Object.assign(await _gasAuth(),{title:'설악산 현장관리',body,
          data:{app:'rescue',tab:'2',id:String(id)},tokens:tokens}))});
      const out=await res.json().catch(()=>({}));
      toast(`🔔 ${out.sent||tokens.length}명에게 재알림 발송됨`);
    }else{
      pushNoti(`🔔 [재알림] ${pendNames.join(', ')} — ${title} 응소 여부 회신 요청`,'🔔','rescue_mobilize',{app:'rescue',tab:2,id});
      toast('🔔 미응답자에게 전체 알림으로 발송됨');
    }
  }catch(e){
    pushNoti(`🔔 [재알림] ${pendNames.join(', ')} — ${title} 응소 여부 회신 요청`,'🔔',r.type||'화재',{app:'rescue',tab:2,id},'안전사고');
    toast('🔔 미응답자에게 전체 알림으로 발송됨');
  }
}
function _etaFromMinutes(min){
  const d=new Date(Date.now()+min*60000);
  return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}
function _toggleMobEtaInput(coll,id){
  const btnRow=document.getElementById('mobBtnRow_'+coll+'_'+id);
  const inpRow=document.getElementById('mobEtaInputRow_'+coll+'_'+id);
  if(!btnRow||!inpRow)return;
  btnRow.style.display='none';
  inpRow.style.display='block';
  const inp=document.getElementById('mobEtaInp_'+coll+'_'+id);
  if(inp){inp.focus();inp.select();}
}
function _cancelMobEtaInput(coll,id){
  const btnRow=document.getElementById('mobBtnRow_'+coll+'_'+id);
  const inpRow=document.getElementById('mobEtaInputRow_'+coll+'_'+id);
  if(btnRow)btnRow.style.display='flex';
  if(inpRow)inpRow.style.display='none';
}
function _confirmMobEta(coll,id){
  const inp=document.getElementById('mobEtaInp_'+coll+'_'+id);
  const eta=inp?inp.value.trim():'';
  if(!eta){toast('⚠️ 시간 입력 필요');if(inp)inp.focus();return;}
  submitMobilizeResp(coll,id,'eta',eta);
}
function submitMobilizeResp(coll,id,status,eta=''){
  const arr=DB.g(coll)||[];
  const idx=arr.findIndex(x=>x.id===id);
  if(idx===-1)return;
  const me=DB.g('currentUser')||{};
  const myName=me.realName||me.name||'';
  if(!myName){toast('⚠️ 설정에서 이름을 먼저 입력하세요');return;}
  if(status==='eta'&&!String(eta).trim()){toast('⚠️ 시간 입력 필요');return;}
  const resp=(arr[idx].mobilizeResp||[]).filter(x=>x.name!==myName);
  resp.push({name:myName,dept:me.dept||'',rank:me.rank||'',status,eta:String(eta).trim(),time:now()});
  arr[idx]={...arr[idx],mobilizeResp:resp};
  DB.s(coll,arr);
  toast(status==='eta'?'🟢 응소 가능 등록됨':'🔴 응소 불가 등록됨');
  const blk=document.getElementById('mobBlk_'+coll+'_'+id);
  if(blk)blk.outerHTML=_mobilizeBlockHtml(coll,arr[idx]);
  try{renderMobilizeBanner();}catch(e){}
}
// 내가 응답해야 하는(아직 미응답인) 응소 요청 목록 — 홈 화면 배너용
function _myPendingMobilizations(){
  const me=DB.g('currentUser')||{};
  const myName=me.realName||me.name||'';
  if(!myName)return [];
  const collect=(coll,activeFilter)=>(DB.g(coll)||[]).filter(activeFilter).filter(r=>r.mobilize&&r.mobilize.length).filter(r=>{
    if(!_mobilizeRoster(r.mobilize).some(s=>s.name===myName))return false;
    return !(r.mobilizeResp||[]).some(x=>x.name===myName);
  }).map(r=>({coll,id:r.id,title:r.title||r.hazType||'위험상황',mobilize:r.mobilize}));
  return [
    ...collect('rescues',r=>r.status==='ongoing'),
    ...collect('hazards',h=>!h.hazStatus||h.hazStatus==='미조치'||h.hazStatus==='조치중'),
  ];
}
function renderMobilizeBanner(){
  const el=document.getElementById('mobilizeBanner');if(!el)return;
  // 내용이 그대로면 innerHTML 재작성 생략 — 원격 갱신 버스트마다 배너 DOM 재구성하던 비용 제거
  const _setMB=h=>{if(el._lastHtml!==h){el._lastHtml=h;el.innerHTML=h;}};
  if(isExternal()){_setMB('');return;}
  const pend=_myPendingMobilizations();
  if(!pend.length){_setMB('');return;}
  const first=pend[0];
  const onclick=first.coll==='rescues'?`openRescueFromHome(${first.id})`:`openHazFromHome(${first.id})`;
  const qBtn=(label,min)=>`<button onclick="event.stopPropagation();submitMobilizeResp('${first.coll}',${first.id},'eta',_etaFromMinutes(${min}))" style="flex:1;background:rgba(39,174,96,.18);color:#3ad17a;border:1px solid rgba(39,174,96,.4);border-radius:8px;padding:6px 2px;font-size:10.5px;font-weight:700;cursor:pointer;">${label}</button>`;
  _setMB(`<div style="background:linear-gradient(135deg,#3a1410,#240a08);border:1px solid rgba(231,76,60,.5);border-radius:16px;padding:14px 16px;margin-bottom:20px;">
    <div onclick="${onclick}" style="display:flex;align-items:center;gap:12px;cursor:pointer;">
      <div style="width:40px;height:40px;border-radius:50%;background:rgba(231,76,60,.22);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;"><span class="blink">🚨</span></div>
      <div style="min-width:0;flex:1;">
        <div style="font-size:14px;font-weight:800;color:#ffdcd6;">응소 요청 — 응답이 필요합니다</div>
        <div style="font-size:11.5px;color:#f0a89e;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_esc(first.title)} · ${_esc(first.mobilize.join('·'))}${pend.length>1?` 외 ${pend.length-1}건`:''}</div>
      </div>
      <div style="font-size:11px;font-weight:700;color:#ff6b5e;flex-shrink:0;">상세 ›</div>
    </div>
    <div style="display:flex;gap:5px;margin-top:10px;">
      ${qBtn('🟢 +10분',10)}${qBtn('🟢 +30분',30)}${qBtn('🟢 +1시간',60)}
      <button onclick="event.stopPropagation();submitMobilizeResp('${first.coll}',${first.id},'unable')" style="flex:1;background:rgba(231,76,60,.15);color:#e74c3c;border:1px solid rgba(231,76,60,.35);border-radius:8px;padding:6px 2px;font-size:10.5px;font-weight:700;cursor:pointer;">🔴 불가</button>
    </div>
  </div>`);
}

function chkHazOnSite(el){
  const val=el.textContent;
  const detail=document.getElementById('hazOnSiteDetail');
  if(detail) detail.style.display=val.includes('있음')?'block':'none';
}

// ── 2보 분기 ──
let _phaseChoice='yes';
let _timetableEntries=[];
// 자주 발생하는 단계만 버튼화 — 나머지는 '✏️ 직접입력'으로 수동 기재
const TT_STAGES_INIT=['지점통과','요구조자 조우','헬기 요청','기상 악화','구조 중단'];
const TT_STAGES_AFTER=['응급처치','심정지','하산 시작','헬기 도착','헬기 회항(기상)','대피소 숙박','구조 재개','휴식'];
let _ttFoundVictim=false;

function selectPhaseChoice(choice,el){
  _phaseChoice=choice;
  document.querySelectorAll('#phaseChoiceWrap button').forEach(b=>{b.style.background='transparent';b.style.color='#cdd1d6';b.style.borderColor='rgba(255,255,255,.1)';});
  el.style.background='rgba(255,255,255,.12)';el.style.color='#3182f6';el.style.borderColor='rgba(255,255,255,.5)';
  document.getElementById('phaseChoiceWrap').style.display='none';
  document.getElementById('phaseFormWrap').style.display='block';
  const _ra=document.getElementById('r_repAuthor');if(_ra){_ra.value=getAuthor();_ra.disabled=true;}
  const prevWrap=document.getElementById('prevReadonlyWrap');
  // 전보 내용 표시
  const res=DB.g('rescues')||[];const r=res.find(x=>x.id===curResId);
  if(!r){return;}
  const phaseIdx=(r.reports||[]).length; // 현재 작성할 보 번호
  const prev=phaseIdx>0?r.reports[phaseIdx-1]:null;
  if(choice==='yes'){
    // 예: 전보 내용 먼저 보여주고, 변경사항 입력
    if(prev){
      prevWrap.style.display='block';
      prevWrap.innerHTML=`<div style="background:#0f0f11;border-radius:9px;padding:10px 12px;margin-bottom:8px;border:1px solid rgba(255,255,255,.15);">
        <div style="font-size:10px;color:#3182f6;font-weight:700;margin-bottom:6px;">📋 전보 (${phaseIdx}보) 내용</div>
        <div style="font-size:11px;color:#8b95a1;line-height:1.8;">
          <b>시간:</b> ${prev.repTime||'-'}<br>
          <b>상황:</b> ${prev.update||'-'}<br>
          <b>부상자:</b> ${prev.victimChange||'-'}
        </div>
      </div>`;
    }
  } else {
    // 아니오: 1보에서 작성 안 한 항목만 보여줌 + 기존 작성내용은 readonly
    prevWrap.style.display='block';
    prevWrap.innerHTML=`<div style="background:#0f0f11;border-radius:9px;padding:10px 12px;margin-bottom:8px;border:1px solid rgba(39,174,96,.15);">
      <div style="font-size:10px;color:#27ae60;font-weight:700;margin-bottom:4px;">✅ 기존 작성 내용 (수정불가)</div>
      <div style="font-size:11px;color:#5a8070;line-height:1.8;">
        유형: ${r.type} · 사고자: ${r.vName||'미상'}<br>
        중증도: ${r.severity||'-'} · 구조방법: ${(r.rescueMethod||[]).join(', ')||'-'}
      </div>
    </div>
    <div style="font-size:10px;color:#3182f6;font-weight:700;margin-bottom:6px;">📝 미작성 항목 추가입력</div>`;
  }
}

function openTimetable(){
  closeM('modalAddPhase');
  _timetableEntries=[];_ttFoundVictim=false;
  renderTimetableList();
  document.getElementById('modalTimetable').classList.add('on');
}
function renderTimetableList(){
  const stages=_ttFoundVictim?TT_STAGES_AFTER:TT_STAGES_INIT;
  const listEl=document.getElementById('timetableList');
  listEl.innerHTML=`
    <div style="margin-bottom:8px;">
      ${_timetableEntries.map((e,i)=>`
        <div style="background:#0f0f11;border-radius:8px;padding:10px 12px;margin-bottom:5px;border:1px solid rgba(255,255,255,.12);">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${e.stage==='요구조자 조우'?'#c0392b':'#3182f6'};flex-shrink:0;"></div>
            <div style="flex:1;">
              <div style="font-size:12px;font-weight:700;color:#eaecef;">${e.stage}</div>
              <div style="font-size:10px;color:#565f6b;">${e.time||'-'}</div>
              ${e.note?`<div style="font-size:11px;color:#8b95a1;margin-top:2px;">${e.note}</div>`:''}
            </div>
            <button onclick="removeTTEntry(${i})" style="background:rgba(192,57,43,.12);border:1px solid rgba(192,57,43,.3);border-radius:8px;color:#e05050;font-size:13px;font-weight:700;cursor:pointer;width:38px;height:38px;flex-shrink:0;display:flex;align-items:center;justify-content:center;">✕</button>
          </div>
        </div>`).join('')}
    </div>
    <div style="font-size:10px;color:#3182f6;font-weight:700;margin-bottom:6px;">단계 선택 <span style="color:rgba(255,255,255,.3);font-weight:400;">· 없으면 직접입력</span></div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;">
      ${stages.filter(s=>!_timetableEntries.find(e=>e.stage===s&&s!=='지점통과'&&s!=='휴식')).map(s=>{
        const isVic=s==='요구조자 조우'||s==='심정지';
        return `<div onclick="selectTTStage('${s}')" style="padding:6px 12px;border-radius:20px;border:1.5px solid ${isVic?'rgba(231,76,60,.4)':'rgba(255,255,255,.3)'};color:${isVic?'#e74c3c':'#3182f6'};font-size:11px;font-weight:600;cursor:pointer;background:${isVic?'rgba(231,76,60,.07)':'rgba(255,255,255,.06)'};">${s}</div>`;}).join('')}
      <div onclick="selectTTStageCustom()" style="padding:6px 12px;border-radius:20px;border:1.5px dashed rgba(255,255,255,.3);color:rgba(255,255,255,.55);font-size:11px;font-weight:600;cursor:pointer;background:transparent;">✏️ 직접입력</div>
    </div>
    <div id="ttInputWrap" style="display:none;margin-top:10px;">
      <div style="font-size:11px;color:#3182f6;font-weight:700;margin-bottom:6px;" id="ttStageLabel"></div>
      <div class="frow">
        <div class="fg"><span class="fl">시간</span><input type="datetime-local" id="ttTime" class="fi" value="NOWDT"></div>
      </div>
      <div class="fg"><span class="fl">메모 (선택)</span><input type="text" id="ttNote" class="fi" placeholder="지점명, 특이사항 등"></div>
      <!-- CPR 추가 필드 (심정지 선택 시만 표시) -->
      <div id="ttCprWrap" style="display:none;background:rgba(231,76,60,.07);border:1px solid rgba(231,76,60,.25);border-radius:9px;padding:10px 12px;margin-top:6px;">
        <div style="font-size:10px;color:#e74c3c;font-weight:700;margin-bottom:7px;">🫀 CPR 기록</div>
        <div class="frow">
          <div class="fg"><span class="fl">CPR 시작</span><input type="datetime-local" id="ttCprStart" class="fi" value="NOWDT"></div>
          <div class="fg"><span class="fl">CPR 종료</span><input type="datetime-local" id="ttCprEnd" class="fi"></div>
        </div>
        <div class="frow">
          <div class="fg"><span class="fl">AED 사용</span>
            <div style="display:flex;gap:6px;margin-top:4px;">
              <button id="ttAedY" onclick="this.style.background='rgba(231,76,60,.25)';this.style.color='#e74c3c';document.getElementById('ttAedN').style.background='transparent';document.getElementById('ttAedN').style.color='rgba(255,255,255,.4)';this._v=1;" style="flex:1;padding:6px;border-radius:7px;border:1px solid rgba(231,76,60,.3);background:transparent;color:rgba(255,255,255,.4);font-size:11px;font-weight:700;cursor:pointer;">사용함</button>
              <button id="ttAedN" onclick="this.style.background='rgba(255,255,255,.15)';this.style.color='#3182f6';document.getElementById('ttAedY').style.background='transparent';document.getElementById('ttAedY').style.color='rgba(255,255,255,.4)';" style="flex:1;padding:6px;border-radius:7px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#3182f6;font-size:11px;font-weight:700;cursor:pointer;">미사용</button>
            </div>
          </div>
        </div>
      </div>
      <button onclick="confirmTTEntry()" style="width:100%;padding:9px;background:#1a4a6e;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;margin-top:8px;">추가</button>
    </div>`.replace(/NOWDT/g, new Date().toISOString().slice(0,16));
}
let _selectedTTStage='';
function selectTTStageCustom(){
  const s=prompt('기록할 단계·상황을 직접 입력하세요\n(예: 헬기 이륙 대기, 대피소 직원 합류, 장비 보급, 요구조자 자력보행 등)');
  if(!s||!s.trim())return;
  selectTTStage(s.trim());
}
function selectTTStage(stage){
  _selectedTTStage=stage;
  const wrap=document.getElementById('ttInputWrap');
  const label=document.getElementById('ttStageLabel');
  const cprWrap=document.getElementById('ttCprWrap');
  if(wrap){wrap.style.display='block';}
  if(label){label.textContent=(stage==='심정지'?'💔':'📍')+' '+stage+' 시간 입력';}
  if(cprWrap){cprWrap.style.display=stage==='심정지'?'block':'none';}
}
function confirmTTEntry(){
  const time=document.getElementById('ttTime')?.value||'';
  const note=document.getElementById('ttNote')?.value||'';
  const entry={stage:_selectedTTStage,time:time.replace('T',' '),note};
  // 심정지 → CPR 데이터 수집
  if(_selectedTTStage==='심정지'){
    const cs=document.getElementById('ttCprStart')?.value||'';
    const ce=document.getElementById('ttCprEnd')?.value||'';
    const aedY=document.getElementById('ttAedY');
    if(cs)entry.cprStart=cs.replace('T',' ');
    if(ce)entry.cprEnd=ce.replace('T',' ');
    entry.aed=aedY&&aedY._v?'사용':'미사용';
  }
  _timetableEntries.push(entry);
  if(_selectedTTStage==='요구조자 조우') _ttFoundVictim=true;
  renderTimetableList();
}
function removeTTEntry(i){
  const e=_timetableEntries[i];
  if(e&&!confirm('"'+(e.stage||'기록')+'" 기록을 삭제할까요?'))return;
  _timetableEntries.splice(i,1);if(!_timetableEntries.find(e=>e.stage==='요구조자 조우'))_ttFoundVictim=false;renderTimetableList();
}
function addTimetableEntry(){selectTTStage('지점통과');}
function saveTimetable(){
  const res=DB.g('rescues')||[];const idx=res.findIndex(x=>x.id===curResId);if(idx===-1)return;
  if(!res[idx].timetable)res[idx].timetable=[];
  res[idx].timetable=[...(res[idx].timetable||[]),..._timetableEntries];
  if(!res[idx].reports)res[idx].reports=[];
  res[idx].reports.push({
    repTime:new Date().toISOString().slice(0,16).replace('T',' '),
    update:'타임테이블 업데이트: '+_timetableEntries.map(e=>e.stage+'('+e.time+')').join(' → '),
    victimChange:'변화없음',author:getAuthor(),isTimetable:true,
  });
  DB.s('rescues',res);
  closeM('modalTimetable');
  renderTimeline(res[idx],_tlViewMode||'brief');
  toast('✅ 타임테이블 저장');
}



// ══════════════════════════════════════════
// 추가 출동 인원 관리
// ══════════════════════════════════════════
let _extraDispatch = []; // [{name, type, note}]

function initExtraDispatch(prefill){
  _extraDispatch = (prefill&&prefill.extraMembers) ? [...prefill.extraMembers] : [];
  renderExtraDispatch();
}

function renderExtraDispatch(){
  const el = document.getElementById('extraDispatchList');
  if(!el) return;
  if(!_extraDispatch.length){
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `
    <div style="font-size:10px;color:#3182f6;font-weight:700;margin:8px 0 5px;">추가 출동 인원</div>
    ${_extraDispatch.map((d,i)=>`
      <div style="display:flex;align-items:center;gap:8px;background:#0f0f11;border-radius:7px;padding:7px 10px;margin-bottom:4px;border:1px solid rgba(255,255,255,.12);">
        <div style="flex:1;">
          <div style="font-size:12px;color:#eaecef;font-weight:600;">${d.name}</div>
          <div style="font-size:10px;color:#565f6b;">${d.type}${d.note?' · '+d.note:''}</div>
        </div>
        <button onclick="removeExtraDispatch(${i})" style="background:none;border:none;color:#c0392b;font-size:14px;cursor:pointer;padding:2px 5px;">×</button>
      </div>`).join('')}`;
}


function confirmAddDispatch(){
  const name = document.getElementById('dispNameIn').value.trim();
  if(!name){ toast('⚠️ 이름/소속 입력'); return; }
  const type = getSelPills('dispTypePills')[0] || '기타';
  const note = document.getElementById('dispNoteIn').value.trim();
  _extraDispatch.push({name, type, note});
  renderExtraDispatch();
  closeM('modalAddDispatch');
  toast('✅ '+name+' 추가');
}

function removeExtraDispatch(i){
  _extraDispatch.splice(i,1);
  renderExtraDispatch();
}

// ══════════════════════════════════════════
// 타임라인 시간순 정렬 + 편집
// ══════════════════════════════════════════
let _ttInlineEntries = [];
let _ttInlineSelectedStage = '';
let _ttInlineFoundVictim = false;
// _ttInlineEntries 시간순 정렬
function sortTTByTime(entries){
  return [...entries].sort((a,b)=>{
    if(!a.time) return 1;
    if(!b.time) return -1;
    return a.time.localeCompare(b.time);
  });
}

// renderTTInline 교체: 편집 버튼 추가 + 시간순 정렬
function renderTTInline(){
  const listEl = document.getElementById('ttEntryList');
    if(!listEl) return;

  // 시간순 정렬 (원본 배열도 갱신)
  _ttInlineEntries = sortTTByTime(_ttInlineEntries);

  listEl.innerHTML = _ttInlineEntries.length
    ? _ttInlineEntries.map((e,i)=>`
      <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#0f0f11;border-radius:8px;margin-bottom:5px;border:1px solid rgba(255,255,255,.12);">
        <div style="width:8px;height:8px;border-radius:50%;background:${
          e.stage==='요구조자 조우'?'#c0392b':
          e.stage==='처치완료'?'#27ae60':
          e.stage==='하산시작'?'#3182f6':'#565f6b'
        };flex-shrink:0;margin-top:2px;"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;font-weight:700;color:#eaecef;">${e.actor?`<span style="font-size:10px;color:#7ec8e3;font-weight:600;margin-right:5px;">[${e.actor}]</span>`:''}${e.stage}</div>
          <div style="font-size:10px;color:#565f6b;">${e.time||'시간미기재'}${e.note?' · '+e.note:''}</div>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0;">
          <button onclick="editTTInline(${i})" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#3182f6;font-size:10px;padding:3px 8px;border-radius:5px;cursor:pointer;">✏️</button>
          <button onclick="removeTTInline(${i})" style="background:rgba(192,57,43,.12);border:1px solid rgba(192,57,43,.3);color:#e05050;font-size:13px;font-weight:700;width:36px;height:36px;flex-shrink:0;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>
      </div>`).join('')
    : '<div style="font-size:11px;color:rgba(255,255,255,.25);padding:6px 0 10px;">아직 기록 없음 — 아래에서 단계 선택</div>';

}

// 편집: 해당 항목 데이터를 입력 영역에 채우고 인덱스 기억
let _editTTIdx = -1;
function editTTInline(i){
  _editTTIdx = i;
  _ttInlineSelectedStage = _ttInlineEntries[i].stage;
  const area  = document.getElementById('ttInputArea');
  const label = document.getElementById('ttInputLabel');
  const timeIn= document.getElementById('ttTimeIn');
  const noteIn= document.getElementById('ttNoteIn');
  if(area)  area.style.display='block';
  if(label) label.textContent='✏️ '+_ttInlineSelectedStage+' 수정';
  if(timeIn)timeIn.value = _ttInlineEntries[i].time
    ? _ttInlineEntries[i].time.replace(' ','T') : '';
  if(noteIn)noteIn.value = _ttInlineEntries[i].note||'';
  document.querySelectorAll('#ttActorPills .pill').forEach(p=>{
    p.classList.toggle('on', p.textContent===(_ttInlineEntries[i].actor||''));
  });
}

// confirmTTInline 재정의: 수정 or 신규 추가
function confirmTTInline(){
  const time = (document.getElementById('ttTimeIn')?.value||'').replace('T',' ')||now();
  const note = document.getElementById('ttNoteIn')?.value||'';
  // 직접입력이면 메모를 단계명으로
  let finalStage = _ttInlineSelectedStage==='직접입력' ? (note||'기타') : _ttInlineSelectedStage;
  let finalNote  = _ttInlineSelectedStage==='직접입력' ? '' : note;
  // 상황전파: 접수경로를 메모에 자동 포함
  if(_ttInlineSelectedStage==='상황전파'){
    const recv=document.getElementById('r_recv')?.value||'';
    if(recv) finalNote=(recv+(note?' · '+note:''));
  }
  let actor='';
  if(_ttInlineSelectedStage==='상황전파'){
    actor=(DB.g('currentUser')||{}).name||getAuthor()||'';
  } else {
    actor=[...document.querySelectorAll('#ttActorPills .pill.on')].map(p=>p.textContent).join(', ')||'';
  }
  if(_editTTIdx >= 0){
    _ttInlineEntries[_editTTIdx] = {stage: finalStage, time, note: finalNote, actor};
    _editTTIdx = -1;
    toast('✅ 수정 완료');
  } else {
    _ttInlineEntries.push({stage: finalStage, time, note: finalNote, actor});
    if(finalStage==='요구조자 조우') _ttInlineFoundVictim=true;
    toast('✅ '+finalStage+' 기록');
  }
  document.getElementById('ttInputArea').style.display='none';
  renderTTInline();
}

// selectTTInline: 신규 선택 시 editIdx 초기화
function selectTTInline(stage, pillEl){
  _editTTIdx = -1;
  _ttInlineSelectedStage = stage;
  // 선택된 stage pill 시각 표시
  document.querySelectorAll('.tt-stage-pill').forEach(p=>p.classList.remove('on'));
  if(pillEl) pillEl.classList.add('on');
  const area=document.getElementById('ttInputArea');
  const label=document.getElementById('ttInputLabel');
  const timeIn=document.getElementById('ttTimeIn');
  const noteIn=document.getElementById('ttNoteIn');
  const rw=document.getElementById('ttRecvWrap');
  const actorWrap=document.getElementById('ttActorWrap');
  if(!area) return;
  area.style.display='block';
  if(timeIn) timeIn.value=new Date().toISOString().slice(0,16);
  if(rw) rw.style.display=stage==='상황전파'?'block':'none';
  if(actorWrap) actorWrap.style.display=stage==='상황전파'?'none':'';
  if(stage==='직접입력'){
    if(label) label.innerHTML='✏️ 내용 직접 입력 <span style="font-size:10px;color:#8b95a1;">(메모란에 입력)</span>';
    if(noteIn){noteIn.placeholder='예: 헬기구조완료, 주민신고접수 등';noteIn.focus();}
  } else {
    if(label) label.textContent='📍 '+stage+' 시간 입력';
    if(noteIn){noteIn.placeholder='지점명, 특이사항 등';noteIn.value='';}
  }
  // 누가 pills: 실제 선택된 대원 이름 기반으로 구성
  const actorPillsEl=document.getElementById('ttActorPills');
  if(actorPillsEl && stage!=='상황전파'){
    const staffList=typeof staff!=='undefined'?staff:[];
    const deptMap={};staffList.forEach(s=>{deptMap[s.name]=s.dept;});
    const mainNames=[...document.querySelectorAll('#memChkGrid .chk-item.on')].map(el=>{
      const t=el.querySelector('.chk-txt');return t?(t.childNodes[0]?.textContent||'').trim():'';
    }).filter(Boolean);
    const mainDepts=[...new Set(mainNames.map(n=>DEPT_SHORT[deptMap[n]]||deptMap[n]||'공단'))];
    const extraTeamNames=(_extraTeams||[]).filter(t=>t.members&&t.members.length>0).map(t=>t.teamName||'추가팀');
    const hwChecked=document.getElementById('agHwChk')?.classList.contains('on');
    const hwName=DB.g('extAgencyDisplayName')||'환동해 특수대응단';
    const agencyNames=(_fireAgencies||[]).filter(a=>a.name).map(a=>a.name);
    const allActors=['요구조자',...mainDepts,...extraTeamNames,...(hwChecked?[hwName]:[]),...agencyNames,'기타'];
    actorPillsEl.innerHTML=allActors.map(a=>`<div class="pill tt-actor-pill" onclick="selTTActor(this,'${a.replace(/'/g,"\\'")}') " style="cursor:pointer;font-size:11px;">${a}</div>`).join('');
    const autoActor=stage==='요구조자 조우'||stage==='처치중'||stage==='처치완료'?'요구조자':
      stage==='헬기이륙/출발'||stage==='헬기구조완료'?hwName:null;
    if(autoActor){
      document.querySelectorAll('#ttActorPills .pill').forEach(p=>{if(p.textContent===autoActor)p.classList.add('on');});
    }
  }
}

function removeTTInline(i){
  const e=_ttInlineEntries[i];
  if(e&&!confirm('"'+(e.stage||'기록')+'" 기록을 삭제할까요?'))return;
  _ttInlineEntries.splice(i,1);
  _ttInlineFoundVictim = _ttInlineEntries.some(e=>e.stage==='요구조자 조우');
  renderTTInline();
}

// ══════════════════════════════════════════
// 지도에서 위치 선택
// ══════════════════════════════════════════
let mapPicker=null;

function openMapPicker(){
  document.getElementById('modalMapPicker').classList.add('on');
  // 현재 GPS 입력값으로 초기 위치 결정
  const gpsVal=(document.getElementById('r_gps')?.value||'').split(',');
  const initLat=gpsVal.length===2&&!isNaN(parseFloat(gpsVal[0]))?parseFloat(gpsVal[0]):(window._lastCrosshairCoord?.lat??DC.lat);
  const initLng=gpsVal.length===2&&!isNaN(parseFloat(gpsVal[1]))?parseFloat(gpsVal[1]):(window._lastCrosshairCoord?.lng??DC.lng);
  setTimeout(()=>{
    if(!mapPicker){
      if(!window._KR){ toast('⚠️ 지도 로딩 중... 잠시 후 다시 시도'); return; }
      mapPicker=new kakao.maps.Map(document.getElementById('mapPicker'),{
        center:new kakao.maps.LatLng(initLat,initLng), level:5
      });
      mapPicker.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
      _addPickerSigns();
      var _pickerTimer=null;
      kakao.maps.event.addListener(mapPicker,'center_changed',function(){
        const c=mapPicker.getCenter();
        const coordEl=document.getElementById('pickerCoords');
        if(coordEl) coordEl.textContent=c.getLat().toFixed(5)+', '+c.getLng().toFixed(5);
        clearTimeout(_pickerTimer);
        _pickerTimer=setTimeout(function(){_updateZoneBadge(c.getLat(),c.getLng(),'pickerZoneBadge');},300);
      });
    } else {
      mapPicker.relayout();
      mapPicker.setCenter(new kakao.maps.LatLng(initLat,initLng));
      _addPickerSigns(); // 처음 열 때 시설물이 아직 로딩 전이었을 수 있음
    }
    // 초기 좌표·Zone 뱃지 표시
    const coordEl=document.getElementById('pickerCoords');
    if(coordEl) coordEl.textContent=initLat.toFixed(5)+', '+initLng.toFixed(5);
    _updateZoneBadge(initLat,initLng,'pickerZoneBadge');
  },200);
}

// 위치 선택 지도에 다목적위치표지판 번호 라벨 추가 (1회)
let _pickerSignsAdded=false;
function _addPickerSigns(){
  if(_pickerSignsAdded||!mapPicker)return;
  const signs=(DB.g('facilities')||[]).filter(f=>f.type&&f.type.includes('다목적위치표지판')&&f.lat&&f.lng);
  if(!signs.length)return;
  signs.forEach(f=>{
    const m=(f.name||'').match(/^\d{1,2}-\d{1,3}/);
    const code=m?m[0]:(f.name||'').slice(0,5);
    const el=document.createElement('div');
    el.style.cssText='background:rgba(8,18,36,.82);border:1px solid rgba(125,211,250,.4);border-radius:5px;padding:1px 4px;font-size:9px;font-weight:700;color:#aab4c0;font-family:monospace;pointer-events:none;white-space:nowrap;';
    el.textContent=code;
    new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(f.lat,f.lng),content:el,zIndex:2}).setMap(mapPicker);
  });
  _pickerSignsAdded=true;
}

function confirmMapPicker(){
  if(!mapPicker){ toast('⚠️ 지도 로딩 필요'); return; }
  const center=mapPicker.getCenter();
  const lat=center.getLat(),lng=center.getLng();
  const coords=lat.toFixed(5)+', '+lng.toFixed(5);
  const gpsEl=document.getElementById('r_gps');
  if(gpsEl) gpsEl.value=coords;
  syncFormMapFromInput();
  _updateFormMiniMap(lat,lng);
  // 사고 장소: 가장 가까운 표지판 번호를 최우선 자동입력
  const locEl=document.getElementById('r_loc');
  if(locEl&&!locEl.value.trim()&&!locEl.dataset.userEdited){
    const s=_nearestSignFull(lat,lng);
    if(s){
      const base=getBaseForSign(s.code);
      const bName=base?((SEORAK_BASES[base.primary]||{}).name||'').replace('탐방지원센터','센터'):'';
      locEl.value=s.code+(s.zoneName?' ('+s.zoneName+')':'')+(bName?' → '+bName:'');
      autoGenTitle();
    }
  }
  closeM('modalMapPicker');
  toast('📍 위치 선택 완료');
}

// ══════════════════════════════════════════
// 사고 제목 자동생성
// ══════════════════════════════════════════
// 사고 유형 버튼 선택 → 숨김 input(r_type) 갱신 + 제목 자동생성
function selAccType(t){
  const h=document.getElementById('r_type');if(h)h.value=t;
  document.querySelectorAll('#typePills .pill').forEach(p=>p.classList.toggle('on',p.textContent.trim()===t));
  const c=document.getElementById('r_typeCustom');
  if(c){c.style.display=t==='기타'?'block':'none';if(t==='기타')setTimeout(()=>{try{c.focus();}catch(e){}},50);}
  try{autoGenTitle();}catch(e){}
}
// 사고유형 최종값: '기타' + 직접입력이 있으면 그 텍스트 사용
function _resolvedAccType(){
  const t=document.getElementById('r_type')?.value||'안전사고';
  if(t!=='기타')return t;
  const c=(document.getElementById('r_typeCustom')?.value||'').trim();
  return c||'기타';
}
function autoGenTitle(returnOnly=false){
  const loc   = (document.getElementById('r_loc')?.value||'').trim();
  const type  = (typeof _resolvedAccType==='function')?_resolvedAccType():(document.getElementById('r_type')?.value||'안전사고');
  const nation= document.getElementById('r_vNat')?.value||'알수없음';
  const gender= document.getElementById('r_vGender')?.value||'';
  // 부상 내역 요약: 자연어 표기('왼쪽 팔목 골절'·'팔목골절'·'저혈당')
  let injStr='';
  if(typeof _injuries!=='undefined'&&_injuries.length){
    injStr=(typeof _injLabel==='function')?_injLabel(_injuries[0]):((_injuries[0].part||'')+(_injuries[0].type||''));
    if(_injuries.length>1)injStr+=' 외 '+(_injuries.length-1);
  }
  // 제목 형식: 「00-00인근(구역명) 부상 66세,남」 / 외국인은 「… 외국인(국적),여」
  const _m=loc.match(/(\d{1,2})-\d{1,3}/);
  const _zone=(_m&&typeof ZONE_NAMES!=='undefined')?(ZONE_NAMES[String(_m[1]).padStart(2,'0')]||''):'';
  let locLabel='';
  if(_m)locLabel=_m[0]+'인근'+(_zone?'('+_zone+')':'');   // 표지판 코드가 있으면 04-04인근(울산바위)
  else if(loc)locLabel=loc.slice(0,10);                    // 없으면 장소명 앞부분
  // 인적: 내국인=나이,성별 / 외국인=외국인(국적),성별
  const _g=(gender&&gender!=='알수없음')?gender:'';
  let who='';
  if(nation==='외국인'){
    const _nat=(document.getElementById('r_vAddr')?.value||'').trim(); // 외국인일 땐 거주지칸=국적
    who='외국인'+(_nat?'('+_nat.slice(0,8)+')':'')+(_g?','+_g:'');
  }else{
    let _age='';try{const _b=(document.getElementById('r_vBirth')?.value||'').trim();if(_b&&typeof _ageFromBirth==='function')_age=_ageFromBirth(_b);}catch(e){}
    if(_age!==''&&_age!=null&&!isNaN(_age))who=_age+'세'+(_g?','+_g:'');
    else if(_g)who=_g;
  }
  const parts=[];
  if(locLabel)parts.push(locLabel);
  parts.push(injStr||type);
  if(who)parts.push(who);
  const title=parts.join(' ')||today()+' '+type;
  if(returnOnly) return title;
  const el=document.getElementById('r_title');
  if(el&&(!el.dataset.userEdited)){
    el.value=title;
  }
  try{if(typeof _updateTabDots==='function')_updateTabDots();}catch(e){} // 필 선택류도 탭 점 갱신
  return title;
}
// 사용자가 직접 수정 시 자동생성 중단
document.addEventListener('input',e=>{
  if(e.target.id==='r_title') e.target.dataset.userEdited='1';
});


// ══════════════════════════════════════════
// 🆘 조난자 위치 전송 (로그인 불필요 · 공개 URL ?sos=1)
// ══════════════════════════════════════════
let _sosDb=null,_sosId=null,_sosWatch=null,_sosLast=null,_sosCount=0;
// 다국어(10): 한국어·영어·중국어·일본어·베트남어·태국어·러시아어·스페인어·프랑스어·독일어
const _SOS_LANGS=[['ko','한국어'],['en','English'],['zh','中文'],['ja','日本語'],['vi','Tiếng Việt'],['th','ไทย'],['ru','Русский'],['es','Español'],['fr','Français'],['de','Deutsch']];
const _SOS_LABEL={ko:'한국어',en:'영어',zh:'중국어',ja:'일본어',vi:'베트남어',th:'태국어',ru:'러시아어',es:'스페인어',fr:'프랑스어',de:'독일어'};
const _SOS_T={
  ko:{org:'설악산 국립공원 구조대',sub:'이 화면을 켠 채로 두면<br>구조대가 당신의 위치를 실시간으로 받습니다',perm:'위치 권한을 허용해 주세요',locating:'위치 확인 중…',recv:'구조대가 위치를 받고 있습니다',block:'전송이 막혔습니다 — 신호 잡히면 자동 재시도',start:'📍 내 위치 전송 시작',retry:'📍 다시 시도',info:'구조대에 전할 정보 (선택)',name:'이름',msg:'상태·부상·주변 지형 등',country:'국적 (예: 대한민국)',tip:'화면을 켜 두고 안전한 곳에서 기다리세요.<br>구조대가 출동합니다.',fail:'전송 실패 — 아래 좌표를 복사해, 링크를 보낸 번호로 문자 회신해 주세요',copy:'📋 좌표 복사'},
  en:{org:'Seoraksan Nat’l Park Rescue',sub:'Keep this screen on.<br>The rescue team receives your location in real time.',perm:'Please allow location access',locating:'Getting your location…',recv:'The rescue team is receiving your location',block:'Sending blocked — will retry when signal returns',start:'📍 Send my location',retry:'📍 Try again',info:'Info for the rescue team (optional)',name:'Name',msg:'Condition, injury, surroundings…',country:'Country',tip:'Keep the screen on and wait in a safe place.<br>The rescue team is coming.',fail:'Send failed — copy the coordinates below and text them to the number that sent you this link',copy:'📋 Copy coordinates'},
  zh:{org:'雪岳山国立公园救援队',sub:'请保持此屏幕开启，<br>救援队正在实时接收您的位置。',perm:'请允许获取位置权限',locating:'正在获取位置…',recv:'救援队正在接收您的位置',block:'发送受阻 — 有信号时将自动重试',start:'📍 发送我的位置',retry:'📍 重试',info:'提供给救援队的信息（可选）',name:'姓名',msg:'状态、受伤、周围地形等',country:'国家',tip:'请保持屏幕开启并在安全处等待。<br>救援队正在赶来。',fail:'发送失败 — 请复制下方坐标，并短信发送给给您链接的号码',copy:'📋 复制坐标'},
  ja:{org:'雪岳山国立公園 救助隊',sub:'この画面をつけたままにしてください。<br>救助隊が位置をリアルタイムで受信します。',perm:'位置情報の許可をお願いします',locating:'位置を確認中…',recv:'救助隊が位置を受信しています',block:'送信がブロックされました — 電波が入ると自動で再試行',start:'📍 自分の位置を送信',retry:'📍 再試行',info:'救助隊への情報（任意）',name:'名前',msg:'状態・けが・周囲の地形など',country:'国籍',tip:'画面をつけたまま安全な場所でお待ちください。<br>救助隊が向かっています。',fail:'送信失敗 — 下の座標をコピーし、リンクを送った番号にSMSで返信してください',copy:'📋 座標をコピー'},
  vi:{org:'Cứu hộ Vườn QG Seoraksan',sub:'Giữ màn hình này bật.<br>Đội cứu hộ đang nhận vị trí của bạn theo thời gian thực.',perm:'Vui lòng cho phép truy cập vị trí',locating:'Đang xác định vị trí…',recv:'Đội cứu hộ đang nhận vị trí của bạn',block:'Bị chặn gửi — sẽ thử lại khi có sóng',start:'📍 Gửi vị trí của tôi',retry:'📍 Thử lại',info:'Thông tin cho đội cứu hộ (tùy chọn)',name:'Tên',msg:'Tình trạng, chấn thương, địa hình…',country:'Quốc gia',tip:'Giữ màn hình bật và chờ ở nơi an toàn.<br>Đội cứu hộ đang đến.',fail:'Gửi thất bại — sao chép tọa độ bên dưới và nhắn tin tới số đã gửi liên kết',copy:'📋 Sao chép tọa độ'},
  th:{org:'หน่วยกู้ภัยอุทยานซอรัคซาน',sub:'เปิดหน้าจอนี้ไว้<br>ทีมกู้ภัยกำลังรับตำแหน่งของคุณแบบเรียลไทม์',perm:'โปรดอนุญาตการเข้าถึงตำแหน่ง',locating:'กำลังหาตำแหน่ง…',recv:'ทีมกู้ภัยกำลังรับตำแหน่งของคุณ',block:'การส่งถูกบล็อก — จะลองใหม่เมื่อมีสัญญาณ',start:'📍 ส่งตำแหน่งของฉัน',retry:'📍 ลองอีกครั้ง',info:'ข้อมูลสำหรับทีมกู้ภัย (ไม่บังคับ)',name:'ชื่อ',msg:'อาการ บาดเจ็บ ภูมิประเทศ',country:'ประเทศ',tip:'เปิดหน้าจอไว้และรอในที่ปลอดภัย<br>ทีมกู้ภัยกำลังไป',fail:'ส่งไม่สำเร็จ — คัดลอกพิกัดด้านล่างแล้วส่ง SMS ไปยังเบอร์ที่ส่งลิงก์ให้คุณ',copy:'📋 คัดลอกพิกัด'},
  ru:{org:'Спасатели нацпарка Сораксан',sub:'Не выключайте экран.<br>Спасатели получают вашу геолокацию в реальном времени.',perm:'Разрешите доступ к геолокации',locating:'Определение местоположения…',recv:'Спасатели получают ваше местоположение',block:'Отправка заблокирована — повтор при сигнале',start:'📍 Отправить геолокацию',retry:'📍 Повторить',info:'Информация для спасателей (необязательно)',name:'Имя',msg:'Состояние, травмы, местность…',country:'Страна',tip:'Не выключайте экран и ждите в безопасном месте.<br>Спасатели уже в пути.',fail:'Сбой отправки — скопируйте координаты ниже и отправьте SMS на номер, приславший ссылку',copy:'📋 Копировать координаты'},
  es:{org:'Rescate Parque Nac. Seoraksan',sub:'Mantén esta pantalla encendida.<br>El equipo de rescate recibe tu ubicación en tiempo real.',perm:'Permite el acceso a la ubicación',locating:'Obteniendo tu ubicación…',recv:'El equipo de rescate recibe tu ubicación',block:'Envío bloqueado: reintento al haber señal',start:'📍 Enviar mi ubicación',retry:'📍 Reintentar',info:'Información para el rescate (opcional)',name:'Nombre',msg:'Estado, lesión, entorno…',country:'País',tip:'Mantén la pantalla encendida y espera en lugar seguro.<br>El rescate va en camino.',fail:'Error de envío — copia las coordenadas y envíalas por SMS al número que te dio el enlace',copy:'📋 Copiar coordenadas'},
  fr:{org:'Secours Parc Nat. Seoraksan',sub:'Gardez cet écran allumé.<br>L’équipe de secours reçoit votre position en temps réel.',perm:'Autorisez l’accès à la localisation',locating:'Localisation en cours…',recv:'L’équipe de secours reçoit votre position',block:'Envoi bloqué — nouvelle tentative au signal',start:'📍 Envoyer ma position',retry:'📍 Réessayer',info:'Infos pour les secours (facultatif)',name:'Nom',msg:'État, blessure, environnement…',country:'Pays',tip:'Gardez l’écran allumé et attendez en lieu sûr.<br>Les secours arrivent.',fail:'Échec d’envoi — copiez les coordonnées et envoyez-les par SMS au numéro qui vous a envoyé le lien',copy:'📋 Copier les coordonnées'},
  de:{org:'Bergrettung NP Seoraksan',sub:'Lassen Sie diesen Bildschirm an.<br>Das Rettungsteam empfängt Ihren Standort in Echtzeit.',perm:'Bitte Standortzugriff erlauben',locating:'Standort wird ermittelt…',recv:'Das Rettungsteam empfängt Ihren Standort',block:'Senden blockiert — erneuter Versuch bei Signal',start:'📍 Meinen Standort senden',retry:'📍 Erneut versuchen',info:'Infos für die Rettung (optional)',name:'Name',msg:'Zustand, Verletzung, Umgebung…',country:'Land',tip:'Bildschirm anlassen und an sicherem Ort warten.<br>Die Rettung kommt.',fail:'Senden fehlgeschlagen — Koordinaten kopieren und per SMS an die Nummer senden, die den Link geschickt hat',copy:'📋 Koordinaten kopieren'}
};
// 추가 문구(링크 종료 안내·구조대 메시지) — 본 사전이 길어 분리 보관
const _SOS_T2={
  ko:{closedT:'위치 접수가 종료되었습니다',closed:'구조대가 이 링크의 접수를 종료했습니다.<br>도움이 더 필요하면 119 또는 구조대에 다시 연락해 주세요.',teamLabel:'구조대 메시지',notice:'ⓘ [내 위치 전송]을 누르면 구조 출동을 위해 현재 위치(GPS)와 입력하신 정보가 설악산국립공원 구조대에 전송됩니다. 위치정보는 구조 목적 외에는 사용·제공되지 않으며, 버튼을 누르면 이에 동의한 것으로 처리됩니다.'},
  en:{closedT:'Location sharing ended',closed:'The rescue team has closed this request.<br>If you still need help, call 119 or contact the rescue team again.',teamLabel:'Message from rescue team',notice:'ⓘ By tapping [Send my location], your current GPS location and any info you enter will be sent to the Seoraksan National Park rescue team for rescue dispatch. It is used only for rescue purposes; tapping the button constitutes your consent.'},
  zh:{closedT:'位置接收已结束',closed:'救援队已结束此链接的接收。<br>如仍需帮助，请拨打119或再次联系救援队。',teamLabel:'救援队消息',notice:'ⓘ 点击[发送我的位置]即表示您同意：为救援出动，您的当前位置(GPS)及所填信息将发送给雪岳山国立公园救援队，仅用于救援目的。'},
  ja:{closedT:'位置の受付が終了しました',closed:'救助隊がこのリンクの受付を終了しました。<br>さらに支援が必要な場合は119または救助隊に再度ご連絡ください。',teamLabel:'救助隊からのメッセージ',notice:'ⓘ [自分の位置を送信]を押すと、救助出動のため現在地(GPS)と入力情報が雪岳山国立公園救助隊に送信されます。位置情報は救助目的以外に使用・提供されず、ボタンを押すことで同意したものとみなされます。'},
  vi:{closedT:'Đã kết thúc chia sẻ vị trí',closed:'Đội cứu hộ đã đóng yêu cầu này.<br>Nếu vẫn cần trợ giúp, hãy gọi 119 hoặc liên hệ lại đội cứu hộ.',teamLabel:'Tin nhắn từ đội cứu hộ',notice:'ⓘ Khi nhấn [Gửi vị trí của tôi], vị trí GPS hiện tại và thông tin bạn nhập sẽ được gửi tới đội cứu hộ VQG Seoraksan để triển khai cứu hộ, chỉ dùng cho mục đích cứu hộ; việc nhấn nút được coi là bạn đồng ý.'},
  th:{closedT:'สิ้นสุดการรับตำแหน่งแล้ว',closed:'ทีมกู้ภัยได้ปิดคำขอนี้แล้ว<br>หากยังต้องการความช่วยเหลือ โปรดโทร 119 หรือติดต่อทีมกู้ภัยอีกครั้ง',teamLabel:'ข้อความจากทีมกู้ภัย',notice:'ⓘ เมื่อกด [ส่งตำแหน่งของฉัน] ตำแหน่ง GPS ปัจจุบันและข้อมูลที่กรอกจะถูกส่งไปยังทีมกู้ภัยอุทยานฯ ซอรัคซานเพื่อการช่วยเหลือ ใช้เพื่อการกู้ภัยเท่านั้น การกดปุ่มถือว่าท่านยินยอม'},
  ru:{closedT:'Приём геолокации завершён',closed:'Спасатели закрыли этот запрос.<br>Если вам всё ещё нужна помощь, позвоните 119 или свяжитесь со спасателями снова.',teamLabel:'Сообщение спасателей',notice:'ⓘ Нажимая [Отправить геолокацию], вы соглашаетесь: ваши координаты GPS и введённые данные будут переданы спасателям нацпарка Сораксан для выезда на спасение и используются только в целях спасения.'},
  es:{closedT:'Recepción de ubicación finalizada',closed:'El equipo de rescate ha cerrado esta solicitud.<br>Si aún necesitas ayuda, llama al 119 o contacta de nuevo con el equipo de rescate.',teamLabel:'Mensaje del equipo de rescate',notice:'ⓘ Al pulsar [Enviar mi ubicación], tu ubicación GPS y los datos introducidos se enviarán al equipo de rescate del Parque Nacional Seoraksan para la operación de rescate; se usan solo con fines de rescate y pulsar el botón constituye tu consentimiento.'},
  fr:{closedT:'Réception de position terminée',closed:'L’équipe de secours a clôturé cette demande.<br>Si vous avez encore besoin d’aide, appelez le 119 ou recontactez les secours.',teamLabel:'Message de l’équipe de secours',notice:'ⓘ En appuyant sur [Envoyer ma position], votre position GPS et les informations saisies seront transmises aux secours du parc national de Seoraksan pour l’intervention ; elles ne sont utilisées qu’à des fins de secours et l’appui sur le bouton vaut consentement.'},
  de:{closedT:'Standortempfang beendet',closed:'Das Rettungsteam hat diese Anfrage geschlossen.<br>Wenn Sie weiterhin Hilfe brauchen, rufen Sie 119 an oder kontaktieren Sie das Rettungsteam erneut.',teamLabel:'Nachricht des Rettungsteams',notice:'ⓘ Mit [Meinen Standort senden] werden Ihr GPS-Standort und Ihre Angaben zur Koordination des Rettungseinsatzes an die Bergrettung des Nationalparks Seoraksan übermittelt; sie werden nur für Rettungszwecke verwendet, das Drücken gilt als Einwilligung.'}
};
let _sosLang='ko';
function _st(k){const a=(_SOS_T[_sosLang]||_SOS_T.en),b=(_SOS_T2[_sosLang]||_SOS_T2.en);return a[k]||b[k]||_SOS_T.en[k]||_SOS_T2.en[k]||k;}
function _sosBuildUI(){
  const wrap=document.getElementById('sosVictim');if(!wrap)return;
  const _nm=(document.getElementById('sosName')||{}).value||'';
  const _mg=(document.getElementById('sosMsg')||{}).value||'';
  const _ct=(document.getElementById('sosCountry')||{}).value||'';
  const langBtns=_SOS_LANGS.map(([c,n])=>`<button onclick="_sosSetLang('${c}')" style="flex:0 0 auto;background:${_sosLang===c?'#c0392b':'rgba(255,255,255,.08)'};color:#fff;border:1px solid ${_sosLang===c?'#ffe14d':'rgba(255,255,255,.15)'};border-radius:14px;padding:5px 11px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">${n}</button>`).join('');
  // 언어 버튼: 가로 스크롤 대신 줄바꿈(flex-wrap) — 큰 글자 설정에서도 전부 보이도록
  wrap.innerHTML=`
    <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;width:100%;max-width:440px;padding-bottom:5px;margin-bottom:2px;">${langBtns}</div>
    <div style="font-size:34px;margin-top:2px;">🆘</div>
    <div style="font-size:19px;font-weight:800;margin-top:6px;text-align:center;">${_st('org')}</div>
    <div style="font-size:13px;color:#949aa2;margin-top:3px;text-align:center;line-height:1.6;">${_st('sub')}</div>
    <div id="sosStatus" style="margin-top:16px;width:100%;max-width:420px;background:#11233a;border:1.5px solid rgba(231,76,60,.5);border-radius:14px;padding:16px;text-align:center;">
      <div id="sosStatusIco" style="font-size:30px;">📡</div>
      <div id="sosStatusTxt" style="font-size:15px;font-weight:700;margin-top:6px;color:#ffd9d0;">${_st('perm')}</div>
      <div id="sosCoords" style="font-size:12px;color:#a5abb3;margin-top:8px;font-family:monospace;line-height:1.7;"></div>
    </div>
    <button id="sosStartBtn" onclick="_sosRequest()" style="margin-top:14px;width:100%;max-width:420px;padding:18px;border:none;border-radius:14px;background:linear-gradient(180deg,#e74c3c,#c0392b);color:#fff;font-size:18px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(192,57,43,.5);">${_st('start')}</button>
    <div style="margin-top:9px;width:100%;max-width:420px;font-size:11px;color:#8b95a1;line-height:1.65;text-align:left;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:9px;padding:9px 11px;">${_st('notice')}</div>
    <div style="margin-top:16px;width:100%;max-width:420px;">
      <div style="font-size:12px;color:#949aa2;font-weight:700;margin-bottom:6px;">${_st('info')}</div>
      <input id="sosName" placeholder="${_st('name')}" value="${_esc(_nm)}" oninput="_sosPushInfo()" style="width:100%;box-sizing:border-box;background:#1c1c1e;border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:9px;padding:12px;font-size:15px;margin-bottom:7px;">
      ${_sosLang!=='ko'?`<input id="sosCountry" placeholder="${_st('country')}" value="${_esc(_ct)}" oninput="_sosPushInfo()" style="width:100%;box-sizing:border-box;background:#1c1c1e;border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:9px;padding:12px;font-size:15px;margin-bottom:7px;">`:''}
      <textarea id="sosMsg" placeholder="${_st('msg')}" oninput="_sosPushInfo()" rows="3" style="width:100%;box-sizing:border-box;background:#1c1c1e;border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:9px;padding:12px;font-size:15px;resize:vertical;">${_esc(_mg)}</textarea>
    </div>
    <div id="sosTip" style="margin-top:16px;font-size:12px;color:#6b7684;text-align:center;line-height:1.6;max-width:420px;">${_st('tip')}</div>
    <div style="width:100%;max-width:420px;margin-top:18px;">
      <div style="font-size:12px;color:#949aa2;font-weight:700;margin-bottom:6px;">💬 ${_sct('chat')}</div>
      <div id="sosChat" style="background:#1c1c1e;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:10px;min-height:60px;max-height:260px;overflow-y:auto;"></div>
      <div style="display:flex;gap:6px;margin-top:7px;">
        <input id="sosChatIn" placeholder="${_sct('chatPh')}" style="flex:1;min-width:0;box-sizing:border-box;background:#1c1c1e;border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:9px;padding:11px;font-size:15px;" onkeydown="if(event.key==='Enter')_sosVictimSend()">
        <button onclick="_sosVictimSend()" style="flex-shrink:0;background:#1a6e9e;color:#fff;border:none;border-radius:9px;padding:0 16px;font-size:14px;font-weight:700;cursor:pointer;">${_sct('send')}</button>
      </div>
    </div>`;
  _sosRefreshStatus();
  try{_sosRenderChat();}catch(e){}
}
// 조난자 대화 라벨(간소 10개국 — 본 사전과 별도)
const _SOS_CHAT={
  ko:{chat:'구조대와 대화',send:'전송',chatPh:'메시지 입력'},en:{chat:'Chat with rescue team',send:'Send',chatPh:'Type a message'},
  zh:{chat:'与救援队对话',send:'发送',chatPh:'输入消息'},ja:{chat:'救助隊と会話',send:'送信',chatPh:'メッセージを入力'},
  vi:{chat:'Trò chuyện với đội cứu hộ',send:'Gửi',chatPh:'Nhập tin nhắn'},th:{chat:'แชทกับทีมกู้ภัย',send:'ส่ง',chatPh:'พิมพ์ข้อความ'},
  ru:{chat:'Чат со спасателями',send:'Отпр.',chatPh:'Введите сообщение'},es:{chat:'Chat con rescate',send:'Enviar',chatPh:'Escribe un mensaje'},
  fr:{chat:'Discuter avec les secours',send:'Envoyer',chatPh:'Écrire un message'},de:{chat:'Chat mit der Rettung',send:'Senden',chatPh:'Nachricht eingeben'}
};
function _sct(k){return (_SOS_CHAT[_sosLang]||_SOS_CHAT.en)[k]||_SOS_CHAT.en[k]||k;}
function _sosMsgTime(ts){try{const d=new Date(ts);const p=n=>String(n).padStart(2,'0');return p(d.getMonth()+1)+'/'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes());}catch(e){return '';}}
// 채팅 말풍선: mySide 기준 내 메시지는 오른쪽, 상대는 왼쪽(라벨 표시). 팀 말풍선은 조난자에겐 소속, 팀에겐 보낸 사람 이름.
function _sosChatBubbles(msgs,mySide){
  if(!msgs||!msgs.length)return '<div style="text-align:center;font-size:11px;color:#6b7684;padding:12px 0;">아직 주고받은 메시지가 없습니다</div>';
  return msgs.slice().sort((a,b)=>(a.ts||0)-(b.ts||0)).map(m=>{
    const mine=(m.f===mySide);
    let label='';
    if(!mine){
      if(m.f==='t')label=(mySide==='v'?(m.org||'구조대'):(m.by||m.org||'구조대'));
      else label=(m.by||'조난자');
    }
    const bg=mine?'#1a6e9e':'#22384e',align=mine?'flex-end':'flex-start';
    return '<div style="display:flex;flex-direction:column;align-items:'+align+';margin-bottom:8px;">'
      +(label?'<div style="font-size:10px;color:#aab4c0;font-weight:700;margin-bottom:2px;padding:0 4px;">'+_esc(label)+'</div>':'')
      +'<div style="max-width:80%;background:'+bg+';color:#eaf4fb;border-radius:13px;padding:8px 11px;font-size:14px;line-height:1.45;word-break:break-word;">'+_esc(m.x||'')+'</div>'
      +'<div style="font-size:9px;color:#6b7684;margin-top:2px;padding:0 4px;">'+_sosMsgTime(m.ts)+'</div></div>';
  }).join('');
}
// sos 문서 msgs 배열에 메시지 추가(arrayUnion → 동시 추가에도 누락 없음). 인증 사용자(팀·익명 조난자) 모두 허용.
function _sosAppendMsg(id,msg){
  const db=_fdb||_sosDb;if(!db||!id)return;
  try{db.collection('sos').doc(id).set({msgs:firebase.firestore.FieldValue.arrayUnion(msg)},{merge:true}).catch(function(){});}catch(e){}
}
let _sosMsgsCache=[];
function _sosRenderChat(){
  const el=document.getElementById('sosChat');if(!el)return;
  el.innerHTML=_sosChatBubbles(_sosMsgsCache,'v');
  el.scrollTop=el.scrollHeight;
}
function _sosVictimSend(){
  const inp=document.getElementById('sosChatIn');const t=((inp&&inp.value)||'').trim();if(!t)return;
  inp.value='';
  const nm=((document.getElementById('sosName')||{}).value||'').trim()||'조난자';
  const msg={f:'v',x:t.slice(0,300),by:nm.slice(0,20),org:'',ts:Date.now()};
  _sosMsgsCache=(_sosMsgsCache||[]).concat([msg]);_sosRenderChat(); // 낙관적 즉시 표시
  _sosAppendMsg(_sosId,msg);
}
function _sosRefreshStatus(){
  const btn=document.getElementById('sosStartBtn');
  if(_sosLast){ // 이미 위치 수신 중 → 좌표 유지, 시작버튼 숨김 (언어 바꿔도 끊김 없음)
    _sosSet('✅',_st('recv'),'#7ee0a0');
    if(btn)btn.style.display='none';
    const c=document.getElementById('sosCoords');
    if(c)c.innerHTML=_sosLast.lat.toFixed(6)+', '+_sosLast.lng.toFixed(6)+'<br>±'+_sosLast.acc+'m';
  }else if(_sosWatch!=null){_sosSet('📡',_st('locating'),'#ffd9d0');if(btn)btn.style.display='none';}
  else{_sosSet('📡',_st('perm'),'#ffd9d0');if(btn)btn.style.display='block';}
}
function _sosSetLang(l){_sosLang=l;try{localStorage.setItem('_sosLang',l);}catch(e){}_sosBuildUI();if(_sosLast)_sosWrite(true);} // 언어 즉시 반영 + 팀에 lang 전달
function _bootSos(){
  ['loadingScreen','loginScreen','approvalGate'].forEach(id=>{const e=document.getElementById(id);if(e)e.remove();});
  try{if(window._safeLoadingTimer)clearTimeout(window._safeLoadingTimer);clearInterval(window._loadTipTimer);clearInterval(window._loadBarTimer);}catch(e){}
  // 링크 토큰(?sos=<token>)을 문서 ID로 — 팀 발급(active:true) 링크만 표시됨
  var _tok=((new URLSearchParams(location.search).get('sos'))||'').trim();
  if(/^[a-z0-9]{4,12}$/i.test(_tok))_sosId=_tok;
  else _sosId='x'+Math.random().toString(36).slice(2,8);
  // 언어 자동 감지(저장값 우선)
  try{var sv=localStorage.getItem('_sosLang');if(sv&&_SOS_T[sv])_sosLang=sv;else{var nl=(navigator.language||'ko').slice(0,2).toLowerCase();if(_SOS_T[nl])_sosLang=nl;}}catch(e){}
  const wrap=document.createElement('div');
  wrap.id='sosVictim';
  wrap.style.cssText='position:fixed;inset:0;z-index:99999;background:#0a1320;color:#eaecef;display:flex;flex-direction:column;align-items:center;padding:calc(18px + env(safe-area-inset-top)) 18px calc(18px + env(safe-area-inset-bottom));overflow-y:auto;font-family:inherit;-webkit-text-size-adjust:100%;';
  document.body.innerHTML='';document.body.appendChild(wrap);
  _sosBuildUI();
  document.title='🆘 SOS — 설악산 구조대';
  try{ if(!firebase.apps.length) firebase.initializeApp(_FB_CFG); }catch(e){}
  try{
    _sosDb=firebase.firestore();
    firebase.auth().signInAnonymously().catch(()=>{});
    firebase.auth().onAuthStateChanged(function(u){ if(u){ _sosAuthed=true; _sosMarkOpened(); _sosRequest(); if(_sosLast)_sosWrite(); _sosVictimListen(); } });
    _sosVictimListen(); // 인증 전이라도(공개 get 허용) 종료·메시지 감지 시도
    _sosMarkOpened();   // 링크 접속 즉시 알림용(위치 수신 전) — 실패해도 무해
  }catch(e){}
  setTimeout(_sosRequest,400);
}
// 링크 열림 표시(1회) — 구조대 화면에서 '접속함' 알림을 울리기 위함
function _sosMarkOpened(){
  if(window._sosOpenSent||!_sosDb||!_sosId)return;
  try{
    _sosDb.collection('sos').doc(_sosId).set({openedAt:Date.now()},{merge:true})
      .then(function(){window._sosOpenSent=true;})
      .catch(function(){});
  }catch(e){}
}
let _sosAuthed=false;
function _sosSet(ico,txt,col){
  const i=document.getElementById('sosStatusIco'),t=document.getElementById('sosStatusTxt'),b=document.getElementById('sosStatus');
  if(i)i.textContent=ico;if(t){t.textContent=txt;if(col)t.style.color=col;}
  if(b&&col==='#7ee0a0')b.style.borderColor='rgba(46,204,113,.6)';
}
let _sosHeartbeat=null;
function _sosRequest(){
  if(!navigator.geolocation){_sosSet('⚠️',_st('block'),'#ffd9d0');return;}
  // 하트비트: 가만히 있어 watchPosition이 안 울려도 20초마다 강제 재전송(연결 유지)
  if(!_sosHeartbeat)_sosHeartbeat=setInterval(function(){if(_sosLast)_sosWrite(true);},20000);
  if(_sosWatch!=null)return; // 이미 추적 중
  _sosSet('📡',_st('locating'),'#ffd9d0');
  _sosWatch=navigator.geolocation.watchPosition(_sosOnPos,_sosOnErr,{enableHighAccuracy:true,timeout:20000,maximumAge:2000});
}
function _sosOnPos(pos){
  const lat=pos.coords.latitude,lng=pos.coords.longitude,acc=Math.round(pos.coords.accuracy||0);
  // GPS 고도(지원 기기에서만 값이 옴) — 구조대 화면에 '⛰고도' 표시용
  const alt=(pos.coords.altitude!=null&&isFinite(pos.coords.altitude))?Math.round(pos.coords.altitude):null;
  _sosLast={lat,lng,acc,alt};
  const btn=document.getElementById('sosStartBtn');if(btn)btn.style.display='none';
  _sosSet('✅',_st('recv'),'#7ee0a0');
  const c=document.getElementById('sosCoords');
  if(c)c.innerHTML=`${lat.toFixed(6)}, ${lng.toFixed(6)}<br>±${acc}m${alt!=null?' · ⛰'+alt+'m':''}`;
  _sosWrite();
}
function _sosOnErr(e){
  _sosWatch=null;
  _sosSet('⚠️',_st('block'),'#ffd9d0');
  const btn=document.getElementById('sosStartBtn');if(btn){btn.style.display='block';btn.textContent=_st('retry');}
}
let _sosLastWriteTs=0,_sosLastWritePos=null;
function _sosWrite(force){
  if(!_sosDb||!_sosLast)return; // 인증 여부와 무관하게 전송 시도(규칙이 sos 공개 허용)
  // 데이터 절약: 최소 15초 간격 또는 25m 이상 이동 시에만 전송 (force=이름/메모 입력 즉시 반영)
  const nowMs=Date.now();
  if(!force&&_sosLastWriteTs){
    const dt=nowMs-_sosLastWriteTs;
    let moved=999;try{if(_sosLastWritePos)moved=_haversineKm(_sosLastWritePos.lat,_sosLastWritePos.lng,_sosLast.lat,_sosLast.lng)*1000;}catch(e){}
    if(dt<15000&&moved<25)return;
  }
  // 데이터 최소화: 좌표 소수 5자리(약 1m), ua·at 제거(at는 ts로 대체), 빈 값·한국어 lang 생략
  const name=String((document.getElementById('sosName')||{}).value||'').slice(0,40);
  const msg=String((document.getElementById('sosMsg')||{}).value||'').slice(0,250);
  const country=String((document.getElementById('sosCountry')||{}).value||'').slice(0,30);
  const rec={id:_sosId,lat:+_sosLast.lat.toFixed(5),lng:+_sosLast.lng.toFixed(5),acc:Math.round(_sosLast.acc),ts:nowMs,noticeVer:1}; // noticeVer: 위치수집 고지문이 표시된 화면에서 전송됐음을 기록(분쟁 대비)
  if(_sosLast.alt!=null)rec.alt=_sosLast.alt; // GPS 고도(m)
  if(name)rec.name=name;
  if(msg)rec.msg=msg;
  if(_sosLang!=='ko'){rec.lang=_sosLang;rec.country=country||'';} // 외국어 → 언어 계열 전달
  else{rec.lang='';rec.country='';} // 한국어로 되돌리면 외국인 표기 즉시 해제(이전 외국어 값 잔존 방지)
  _sosLastWriteTs=nowMs;_sosLastWritePos={lat:_sosLast.lat,lng:_sosLast.lng};
  _sosDb.collection('sos').doc(_sosId).set(rec,{merge:true}).then(function(){
    _sosCount++;
    _sosSet('✅',_st('recv'),'#7ee0a0');
    const c=document.getElementById('sosCoords');
    if(c)c.innerHTML=_sosLast.lat.toFixed(6)+', '+_sosLast.lng.toFixed(6)+'<br>±'+Math.round(_sosLast.acc)+'m · ✓'+_sosCount;
  }).catch(function(e){
    // 전송 실패 → 좌표 복사 후 회신 안내 (데이터 안 터질 때 최후 수단)
    _sosSet('⚠️',_st('block'),'#ffd9d0');
    const c=document.getElementById('sosCoords');
    const co=_sosLast.lat.toFixed(5)+', '+_sosLast.lng.toFixed(5);
    if(c)c.innerHTML='<div style="color:#ffd24d;font-weight:700;margin-bottom:6px;line-height:1.5;">'+_st('fail')+'</div>'
      +'<div style="font-size:16px;color:#fff;font-weight:800;letter-spacing:.5px;">'+co+'</div>'
      +'<button onclick="_sosCopyCoords(\''+co+'\')" style="margin-top:8px;background:#1a4a6e;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-size:14px;font-weight:700;cursor:pointer;">'+_st('copy')+'</button>';
    _sosLastWriteTs=0; // 다음 기회에 즉시 재시도
  });
}
function _sosCopyCoords(co){
  if(navigator.clipboard)navigator.clipboard.writeText(co).then(function(){toast('📋 '+co);}).catch(function(){_sosSmsFallback(co);});
  else _sosSmsFallback(co);
}
function _sosSmsFallback(co){try{location.href='sms:?body='+encodeURIComponent('SOS '+co);}catch(e){}}
let _sosInfoTimer=null;
function _sosPushInfo(){clearTimeout(_sosInfoTimer);_sosInfoTimer=setTimeout(()=>_sosWrite(true),600);}
// ── 조난자 측: 자신의 링크 문서 구독 → 구조대의 종료·메시지를 실시간 수신 ──
let _sosClosed=false,_sosTeamMsgSeen='',_sosVictimBound=false;
function _sosVictimListen(){
  if(_sosVictimBound||!_sosDb||!_sosId)return;
  _sosVictimBound=true;
  try{
    _sosDb.collection('sos').doc(_sosId).onSnapshot(function(d){
      _sosVictimUpdate(d.exists?d.data():null);
    },function(){ _sosVictimBound=false; }); // 권한·네트워크 실패 시 다음 인증/요청에서 재시도
  }catch(e){ _sosVictimBound=false; }
}
function _sosVictimUpdate(d){
  if(!d)return;
  // 채팅 메시지 동기화(+구버전 teamMsg는 팀 메시지로 흡수)
  let msgs=(d.msgs||[]).slice();
  if(d.teamMsg&&!msgs.some(m=>m.f==='t'&&m.x===d.teamMsg)){msgs.push({f:'t',x:d.teamMsg,org:'구조대',ts:d.teamMsgAt||Date.now()});}
  const prevLen=(_sosMsgsCache||[]).length;
  _sosMsgsCache=msgs;
  try{_sosRenderChat();}catch(e){}
  if(msgs.length>prevLen){try{const last=msgs[msgs.length-1];if(last&&last.f==='t')toast('💬 구조대 메시지가 도착했습니다');}catch(e){}}
  if(d.active===false&&!_sosClosed){_sosClosed=true;_sosStopAll();_sosShowClosed();}
}
function _sosStopAll(){
  try{if(_sosWatch!=null)navigator.geolocation.clearWatch(_sosWatch);}catch(e){}_sosWatch=null;
  try{clearInterval(_sosHeartbeat);}catch(e){}_sosHeartbeat=null;
  try{clearTimeout(_sosInfoTimer);}catch(e){}
}
function _sosShowClosed(){
  const wrap=document.getElementById('sosVictim');if(!wrap)return;
  const e=document.getElementById('sosTeamMsg');// 종료 시 하단 메시지는 본문으로 흡수
  wrap.innerHTML='<div style="margin:auto;text-align:center;max-width:380px;padding:34px 18px;">'
    +'<div style="font-size:48px;">✅</div>'
    +'<div style="font-size:20px;font-weight:800;margin-top:14px;color:#7ee0a0;">'+_st('closedT')+'</div>'
    +'<div style="font-size:14px;color:#a5abb3;margin-top:12px;line-height:1.7;">'+_st('closed')+'</div>'
    +(_sosTeamMsgSeen?'<div style="margin-top:18px;background:#11233a;border:1px solid rgba(125,211,250,.3);border-radius:12px;padding:14px;text-align:left;"><div style="font-size:11px;color:#aab4c0;font-weight:700;margin-bottom:4px;">📢 '+_st('teamLabel')+'</div><div style="font-size:15px;color:#eaecef;line-height:1.5;">'+_esc(_sosTeamMsgSeen)+'</div></div>':'')
    +'</div>';
  if(e)e.remove();
}
function _sosShowTeamMsg(m){
  if(_sosClosed){_sosShowClosed();return;}
  let el=document.getElementById('sosTeamMsg');
  if(!el){el=document.createElement('div');el.id='sosTeamMsg';el.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:100001;background:linear-gradient(180deg,#1a4a6e,#0d3350);color:#fff;padding:14px 16px calc(14px + env(safe-area-inset-bottom));box-shadow:0 -3px 14px rgba(0,0,0,.55);';document.body.appendChild(el);}
  el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">'
    +'<div style="flex:1;min-width:0;"><div style="font-size:11px;color:#aab4c0;font-weight:700;margin-bottom:3px;">📢 '+_st('teamLabel')+'</div>'
    +'<div style="font-size:15px;font-weight:600;line-height:1.5;word-break:break-word;">'+_esc(m)+'</div></div>'
    +'<button onclick="this.closest(\'#sosTeamMsg\').remove()" style="background:none;border:none;color:rgba(255,255,255,.6);font-size:22px;line-height:1;cursor:pointer;flex-shrink:0;">×</button></div>';
}

// ── 구조대 측: 조난·사고자 위치 실시간 구독 (1회용 토큰: 팀이 발급한 active 링크만 표시) ──
let _sosPings=[];                              // 활성(active) 발급 토큰 전체(위치 있든 없든)
// SOS 이벤트 알림 1회 발송 보장(3중 방어) — 접속 중인 모든 기기가 같은 이벤트를 각자 전체 발송하면
// 기기 수만큼 푸시가 중복(알람 폭주)됨.
//  ① Firestore 트랜잭션 선점(claim): 최초 1대만 발송, 나머지는 선점 확인 후 발송 포기
//  ② 선점 확인 실패(권한·통신)여도 즉시 발송하지 않음 — 무작위 지연(1.2~5초) 후,
//     그 사이 다른 기기의 방송(sharedNotis, dk 키)이 도착했으면 발송 취소, 발송 직전 한 번 더 조회
//  ③ 수신 측도 같은 dk 키 알림은 한 번만 표시(app.core.js) — 그래도 새는 중복까지 차단
function _sosNotiOnce(key,fn){
  const sk=window._notiSeenDk||(window._notiSeenDk={});
  if(sk[key])return; // 이미 발송됐거나 다른 기기 방송을 수신함
  const emit=()=>{if(sk[key])return;sk[key]=1;try{fn();}catch(e){}};
  if(!_fdb){emit();return;}
  const emitChecked=()=>{ // 발송 직전 방송 존재 여부 재확인(지연 경합 창 축소)
    if(sk[key])return;
    _fdb.collection('sharedNotis').where('dk','==',key).limit(1).get()
      .then(s=>{if(!s.empty){sk[key]=1;return;}emit();})
      .catch(()=>emit());
  };
  const ref=_fdb.collection('sosNotiClaims').doc(String(key).replace(/[\/#?]/g,'_'));
  _fdb.runTransaction(t=>t.get(ref).then(s=>{
    if(s.exists)throw {dup:1};
    t.set(ref,{at:Date.now(),by:(typeof _MY_DEVICE_ID!=='undefined'?_MY_DEVICE_ID:'')});
  })).then(emit)
    .catch(err=>{
      if(err&&err.dup){sk[key]=1;return;} // 다른 기기가 선점 — 발송 안 함
      setTimeout(emitChecked,1200+Math.floor(Math.random()*4000));
    });
}
function _sosLocated(){return (_sosPings||[]).filter(p=>p.lat&&p.lng);} // 실제 위치 수신된 건
function _initSosWatch(){
  if(!_fdb||window._sosWatchBound)return;
  // 인증(익명/커스텀 토큰) 완료 전에 구독하면 'Missing or insufficient permissions' 오류가 나고
  // 오류기록에도 남는다(첫 부팅에 흔함) → 인증이 준비될 때까지 잠깐 기다렸다 구독(최대 ~15초).
  var _ready=true;try{_ready=(typeof _authReady==='undefined')||_authReady;}catch(e){_ready=true;}
  if(!_ready&&(window._sosAuthWaitN||0)<25){
    window._sosAuthWaitN=(window._sosAuthWaitN||0)+1;
    setTimeout(_initSosWatch,600);
    return;
  }
  window._sosWatchBound=true;
  try{
    _fdb.collection('sos').onSnapshot(function(snap){
      window._sosRetryMs=0; // 수신 성공 → 재시도 백오프 초기화
      // 팀이 발급(active:true)했고 48시간 이내인 것만 — 밤샘·다일 구조 커버, 옛 링크 자동 무효
      // 보안: 문서 id가 앱 토큰 형식(_sosGenToken)이 아니면 폐기 — 세계쓰기 가능한 sos 컬렉션에 심긴
      //  악성 id/필드가 onclick 핸들러·HTML에 그대로 박혀 실행되던 저장형 XSS 경로 원천 차단.
      _sosPings=snap.docs.map(d=>d.data()).filter(p=>p&&p.active===true&&/^[a-z0-9]{4,12}$/i.test(String(p.id||''))&&Date.now()-(p.issuedAt||p.ts||0)<48*3600000);
      // 위치가 새로 수신된 조난자 알림(최초 스냅샷·미수신 토큰은 제외)
      const seen=window._sosSeen||(window._sosSeen={});
      const seenOpen=window._sosSeenOpen||(window._sosSeenOpen={});
      _sosPings.forEach(p=>{
        // 🧪 검증 모드에서 발급된 테스트 링크(test:true): 전 직원 알림·토스트·푸시 전부 생략,
        //    관리자 기기에서만 조용한 토스트로 동작 확인 (수신 기기 각자가 울리는 구조라 발신측 차단만으론 부족)
        const _isTest=!!p.test;
        const _adminHere=(typeof isAdminUser==='function'&&isAdminUser());
        // 링크 '접속' 즉시 알림 (위치 수신 전 단계 — 링크가 전달됐고 열렸다는 신호)
        if(p.openedAt&&!seenOpen[p.id]){seenOpen[p.id]=1;
          if(window._sosInited&&!(p.lat&&p.lng)){
            if(_isTest){if(_adminHere)try{toast('🧪 [테스트] 위치요청 링크 접속됨 — 알림 미발송',5000);}catch(e){}}
            else{try{toast('🔗 위치요청 링크 접속됨'+(p.name?': '+p.name:'')+' — 위치 수신 대기',6000);}catch(e){}
            _sosNotiOnce('open:'+p.id,()=>{try{pushNoti('🔗 위치요청 링크 접속됨'+(p.name?': '+p.name:''),'🆘','sos',{app:'rescue',tab:1},null,{dedupeKey:'open:'+p.id});}catch(e){}});}}
        }
        if(p.lat&&p.lng&&!seen[p.id]){seen[p.id]=1;
          if(window._sosInited){
            if(_isTest){if(_adminHere)try{toast('🧪 [테스트] 조난·사고자 위치 수신'+(p.acc?' (±'+p.acc+'m)':'')+' — 알림 미발송',5000);}catch(e){}}
            else{try{toast('🆘 조난·사고자 위치 수신: '+(p.name||'익명')+(p.acc?' (±'+p.acc+'m)':''),6000);}catch(e){}
            _sosNotiOnce('loc:'+p.id,()=>{try{pushNoti('🆘 조난·사고자 위치 수신'+(p.name?': '+p.name:''),'🆘','sos',{app:'rescue',tab:1},null,{dedupeKey:'loc:'+p.id});}catch(e){}});}}
        }
      });
      window._sosInited=true;
      try{_autoTrackSosRescues();}catch(e){} // 🔗 연계 SOS 위치가 움직이면 사고 위치 자동 추적
      try{_drawSosPins();}catch(e){}
      try{_updateSosFab();}catch(e){}
      try{const bv=document.getElementById('v-board');if(bv&&bv.classList.contains('on')&&_boardMap)_renderBoardPins(false);}catch(e){}
      const ids=_sosLocated().map(p=>p.id).sort().join(',');
      if(ids!==window._sosIdSig){
        window._sosIdSig=ids;
        clearTimeout(window._sosRefreshT);
        window._sosRefreshT=setTimeout(function(){
          try{
            if(window.curApp==='rescue'){
              const mv=document.getElementById('v-rescue-map');
              if(mv&&mv.classList.contains('on')){try{renderRescueMap();}catch(e){}}
              try{renderResList();}catch(e){}
            }
            const bv=document.getElementById('v-board');
            if(bv&&bv.classList.contains('on')&&_boardMap){try{_renderBoardPins(false);}catch(e){}}
          }catch(e){}
        },350);
      }
    },function(err){
      // 오류 시 onSnapshot은 영구 해제됨 — 익명 인증 완료 전 구독(permission 오류) 등 일시 오류 후
      // SOS 수신이 죽은 채 방치되지 않도록 백오프 재구독 (10s→20s→…최대 5분)
      var _em=(err&&err.message||err||'')+'';
      // permission 오류는 인증 준비 전 일시 현상(재구독으로 자동 복구) → 오류기록에 남기지 않아 혼란 방지
      if(!/permission|insufficient/i.test(_em)){
        try{if(!window._sosErrLogged){window._sosErrLogged=true;_logErr&&_logErr('sos listen: '+_em);}}catch(e){}
      }
      window._sosWatchBound=false;
      var d=window._sosRetryMs=Math.min((window._sosRetryMs||5000)*2,300000);
      setTimeout(function(){try{_initSosWatch();}catch(e){}},d);
    });
  }catch(e){}
}
function _sosBadgeCount(){return _sosLocated().length;}
function _updateSosFab(){
  const b=document.getElementById('sosReqBtn');if(!b)return;
  const n=_sosBadgeCount();
  b.innerHTML='🆘 조난·사고자'+(n?' <span style="background:#fff;color:#c0392b;border-radius:50%;padding:0 5px;font-weight:800;">'+n+'</span>':' 위치요청');
  b.style.background=n?'rgba(192,57,43,.95)':'rgba(192,57,43,.6)';
}
// ⚠️ location.origin 사용 금지 — 안드로이드 APK(Capacitor)는 앱을 https://localhost 에서 실행하므로
// 그대로 쓰면 조난자에게 'https://localhost/?sos=…'라는 열 수 없는 링크가 감. 항상 공개 웹 주소로 고정.
function _sosVictimUrl(tok){return 'https://seorak1275.github.io/seoraksan/?sos='+tok;}
// 1회용 링크 토큰 — 추측·열거 불가하도록 암호학적 난수 12자(혼동문자 제외 32자 알파벳, ~60bit).
// 이 토큰만 알면 조난자 실시간 위치가 노출되므로 짧은 랜덤(구 5자리)은 열거공격에 취약 → 강화.
function _sosGenToken(){
  try{
    var a=new Uint8Array(12);(window.crypto||crypto).getRandomValues(a);
    var cs='23456789abcdefghijkmnpqrstuvwxyz',s='';
    for(var i=0;i<a.length;i++)s+=cs[a[i]&31];
    return s;
  }catch(e){return Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,10);}
}
// 새 1회용 링크 발급 (토큰 생성 → active:true 문서 생성)
function _sosNewLink(){
  if(!_fdb){toast('연결 준비 중 — 잠시 후 다시');return;}
  const tok=_sosGenToken();
  const by=(typeof getAuthor==='function')?getAuthor():'구조대';
  // 🧪 검증 모드 중 발급된 링크는 test:true — 접속·위치수신 시 전 직원 알림이 울리지 않음(관리자 기기 확인용 토스트만)
  const _isTest=(typeof _testSilentOn==='function')&&_testSilentOn();
  const doc={id:tok,active:true,issuedAt:Date.now(),by:by};
  if(_isTest)doc.test=true;
  _fdb.collection('sos').doc(tok).set(doc,{merge:true})
    .then(function(){toast(_isTest?'🧪 [테스트] 링크 생성됨 — 접속·위치수신 알림이 직원들에게 가지 않습니다':'🔗 1회용 링크 생성됨 — 조난자에게 보내세요',5000);openSosRequest();if(navigator.share)_sosShareUrl(tok);})
    .catch(function(e){toast('생성 실패: '+(e&&(e.code||e.message)||''));});
}
// 접수 종료 (active:false → 그 링크로는 더 이상 수신 안 됨, 기록은 남음)
// 조난·사고자 관련 화면(지도·목록·상황판·열린 모달) 즉시 동기화 — 액션 후 바로 반영
function _sosRefreshAll(){
  try{_drawSosPins();}catch(e){}
  try{_updateSosFab();}catch(e){}
  try{if(window.curApp==='rescue')renderResList();}catch(e){}
  try{const bv=document.getElementById('v-board');if(bv&&bv.classList.contains('on')&&_boardMap)_renderBoardPins(false);}catch(e){}
  // 모달이 열려 있으면: 팝업(대화)이면 채팅만 갱신(입력 보존), 목록이면 목록 갱신
  try{if(document.getElementById('sosModal')){if(window._sosPopupId)_sosRefreshTeamChat();else openSosRequest();}}catch(e){}
}
function _sosRefreshTeamChat(){
  if(!window._sosPopupId)return;
  const c=document.getElementById('sosTeamChat');if(!c)return;
  const p=(_sosPings||[]).find(x=>x.id===window._sosPopupId);if(!p)return;
  c.innerHTML=_sosChatBubbles(p.msgs||[],'t');c.scrollTop=c.scrollHeight;
}
function _sosCloseToken(id){
  if(!confirm('이 1회용 링크를 종료할까요?\n종료하면 해당 링크로는 더 이상 위치가 들어오지 않고, 접속한 사람 화면에도 종료 안내가 표시됩니다.'))return;
  if(_fdb)_fdb.collection('sos').doc(id).set({active:false,closedAt:Date.now()},{merge:true}).catch(()=>{});
  _sosPings=(_sosPings||[]).filter(p=>p.id!==id);
  _sosRefreshAll();
  toast('✅ 접수 종료 — 링크 비활성화됨');
}
function openSosRequest(){
  window._sosPopupId=null; // 목록 화면 → 팝업 대화 모드 해제
  const toks=(_sosPings||[]).slice().sort((a,b)=>(b.issuedAt||0)-(a.issuedAt||0));
  const cards=toks.map(p=>{
    const url=_sosVictimUrl(p.id);
    const has=p.lat&&p.lng;
    const mm=p.ts?Math.round((Date.now()-(p.ts||0))/60000):null;
    const status=has
      ? `<span style="color:#3ad17a;font-weight:800;">🟢 위치 수신 ±${p.acc||'?'}m</span> <span style="color:#949aa2;font-size:10px;">${mm}분 전</span>`
      : `<span style="color:#ffd24d;font-weight:700;">⚪ 전송 대기 중</span>`;
    // 48시간 자동만료까지 남은 시간
    const _iss=p.issuedAt||p.ts||0;
    const _remMs=48*3600000-(Date.now()-_iss);
    const _rh=Math.floor(_remMs/3600000),_rm=Math.floor((_remMs%3600000)/60000);
    const _remStr=_remMs<=0?'만료됨':(_rh>0?_rh+'시간 '+_rm+'분':_rm+'분')+' 남음';
    const _remCol=_remMs<=0?'#e05050':(_remMs<6*3600000?'#ffd24d':'#7ee0a0');
    return `<div style="background:#1c1c1e;border:1px solid ${has?'rgba(231,76,60,.4)':'rgba(255,255,255,.12)'};border-radius:11px;padding:11px 12px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:6px;flex-wrap:wrap;">
        <span style="font-size:12px;">${status}</span>
        <span style="font-size:9px;color:#6b7684;font-family:monospace;">🔗 1회용 · ${p.id}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px;flex-wrap:wrap;">
        <span style="font-size:11px;color:${_remCol};font-weight:700;">⏱ 자동만료까지 ${_remStr}</span>
        <button onclick="_sosExtend('${p.id}')" style="flex-shrink:0;background:rgba(241,196,15,.13);color:#f0c040;border:1px solid rgba(241,196,15,.4);border-radius:14px;padding:5px 12px;font-size:11px;font-weight:800;cursor:pointer;">⏱ 48시간 연장</button>
      </div>
      ${has?`<div onclick="_sosFocus('${p.id}')" style="cursor:pointer;margin-bottom:7px;">
        <div style="font-size:13px;font-weight:800;color:#ff8a73;">🆘 ${_esc(p.name||'익명')}</div>
        ${_sosForeignBadge(p)?`<div style="margin-top:3px;">${_sosForeignBadge(p)}</div>`:''}
        ${p.msg?`<div style="font-size:12px;color:#d5d8dc;margin-top:2px;">${_esc(p.msg)}</div>`:''}
        <div style="font-size:10px;color:#6b7684;font-family:monospace;margin-top:2px;">${(+p.lat).toFixed(5)}, ${(+p.lng).toFixed(5)} · 탭하면 지도 이동</div>
      </div>`:''}
      <div style="display:flex;gap:5px;margin-bottom:6px;">
        <input readonly value="${_esc(url)}" onclick="this.select()" style="flex:1;min-width:0;background:#0f0f11;border:1px solid rgba(255,255,255,.3);color:#aab4c0;border-radius:7px;padding:8px;font-size:11px;font-family:monospace;">
        <button onclick="_sosCopyUrl('${p.id}',this)" style="flex-shrink:0;background:#1a4a6e;color:#fff;border:none;border-radius:7px;padding:0 13px;font-size:12px;font-weight:700;cursor:pointer;transition:background .15s;">복사</button>
      </div>
      <div style="display:flex;gap:5px;">
        ${navigator.share?`<button onclick="_sosShareUrl('${p.id}')" style="flex:1;background:rgba(39,174,96,.12);color:#27ae60;border:1px solid rgba(39,174,96,.35);border-radius:7px;padding:8px;font-size:12px;font-weight:700;cursor:pointer;">📤 보내기</button>`:`<button onclick="_sosSms('${p.id}')" style="flex:1;background:rgba(255,255,255,.1);color:#3182f6;border:1px solid rgba(255,255,255,.3);border-radius:7px;padding:8px;font-size:12px;font-weight:700;cursor:pointer;">✉️ 문자</button>`}
        <button onclick="_sosPinPopup('${p.id}')" style="flex:1;background:rgba(125,211,250,.1);color:#aab4c0;border:1px solid rgba(125,211,250,.3);border-radius:7px;padding:8px;font-size:12px;font-weight:700;cursor:pointer;">💬 대화${(p.msgs&&p.msgs.length)?' '+p.msgs.length:''}</button>
        ${has?`<button onclick="sosToRescue('${p.id}')" style="flex:1;background:rgba(231,76,60,.15);color:#ff6b5e;border:1px solid rgba(231,76,60,.4);border-radius:7px;padding:8px;font-size:12px;font-weight:700;cursor:pointer;">🚨 구조등록</button>`:''}
        <button onclick="_sosCloseToken('${p.id}')" style="flex-shrink:0;background:rgba(192,57,43,.1);color:#c0392b;border:1px solid rgba(192,57,43,.3);border-radius:7px;padding:8px 11px;font-size:12px;font-weight:700;cursor:pointer;">종료</button>
      </div>
    </div>`;
  }).join('');
  const html=`
    <div style="background:rgba(241,196,15,.08);border:1px solid rgba(241,196,15,.25);border-radius:9px;padding:9px 11px;margin-bottom:10px;font-size:12px;color:#e8c84a;line-height:1.5;">
      🔗 <b>1회용 링크</b>입니다. 조난·사고자마다 새로 발급해 보내세요.<br>
      <span style="color:#a5abb3;">구조가 끝나면 <b style="color:#ff8a73;">접수 종료</b>를 누르면 그 링크는 비활성화됩니다. (보내지 않아도 48시간 후 자동 만료)</span>
    </div>
    <button onclick="_sosNewLink()" style="width:100%;padding:14px;border-radius:11px;border:none;background:linear-gradient(180deg,#e74c3c,#c0392b);color:#fff;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 3px 10px rgba(192,57,43,.4);margin-bottom:12px;">➕ 새 1회용 링크 만들기</button>
    ${toks.length?cards:'<div style="font-size:12px;color:rgba(255,255,255,.35);padding:6px 0;text-align:center;">발급된 링크가 없습니다. 위 버튼으로 새 링크를 만드세요.</div>'}`;
  _sosModal('🆘 조난·사고자 위치요청 (1회용 링크)',html);
}
// 1회용 링크 48시간 자동만료 연장(발급시각을 지금으로 리셋 → 다시 48시간)
function _sosExtend(id){
  const nowMs=Date.now();
  const p=(_sosPings||[]).find(x=>x.id===id);if(p)p.issuedAt=nowMs;
  if(_fdb)_fdb.collection('sos').doc(id).set({issuedAt:nowMs},{merge:true}).catch(()=>{});
  _sosRefreshAll();
  toast('⏱️ 48시간 연장됨 (지금부터 다시 48시간)');
}
function _sosModal(title,html){
  let m=document.getElementById('sosModal');
  if(!m){m=document.createElement('div');m.id='sosModal';document.body.appendChild(m);}
  m.style.cssText='position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center;';
  m.innerHTML=`<div style="background:#16161a;width:100%;max-width:480px;max-height:85vh;overflow-y:auto;border-radius:14px 14px 0 0;padding:16px 16px 28px;box-shadow:0 -4px 20px rgba(0,0,0,.7);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span style="font-size:15px;font-weight:800;color:#eaecef;">${title}</span><button onclick="_sosCloseModal()" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:24px;cursor:pointer;line-height:1;">×</button></div>
    ${html}</div>`;
  m.onclick=function(e){if(e.target===m)_sosCloseModal();};
}
function _sosCloseModal(){window._sosPopupId=null;const m=document.getElementById('sosModal');if(m)m.remove();}
// 조난자 위치 삭제 (테스트·종료된 항목 정리)
// 외국인/언어/국적 배지 (팀 화면용)
function _sosForeignBadge(p){
  if(!p||!p.lang||p.lang==='ko')return '';
  const lbl=(typeof _SOS_LABEL!=='undefined'&&_SOS_LABEL[p.lang])||p.lang;
  return '<span style="font-size:10px;background:rgba(241,196,15,.15);color:#f0c040;border:1px solid rgba(241,196,15,.35);border-radius:6px;padding:1px 7px;font-weight:700;">🌐 외국인 · '+_esc(lbl)+(p.country?' · '+_esc(p.country):'')+'</span>';
}
function _sosAtStr(p){if(!p)return '';if(p.at)return p.at.slice(11);try{return new Date(p.ts).toTimeString().slice(0,8);}catch(e){return '';}}
function deleteSosPing(id,silent){
  if(!_fdb)return;
  if(!silent&&!confirm('이 조난자 위치를 삭제할까요?'))return;
  _fdb.collection('sos').doc(id).delete().catch(()=>{});
  _sosPings=(_sosPings||[]).filter(p=>p.id!==id);
  try{if(window._sosSeen)delete window._sosSeen[id];}catch(e){}
  if(silent){try{_drawSosPins();}catch(e){}try{_updateSosFab();}catch(e){}}
  else{_sosRefreshAll();toast('🗑️ 위치 삭제됨');}
}
function clearAllSos(){
  const all=(_sosPings||[]).slice();
  if(!all.length){toast('삭제할 위치 없음');return;}
  if(!confirm('수신된 조난자 위치 '+all.length+'건을 모두 삭제할까요?\n(테스트 정리용 — 실제 조난자가 있으면 주의)'))return;
  all.forEach(p=>deleteSosPing(p.id,true));
  toast('🗑️ '+all.length+'건 삭제됨');
  _sosCloseModal();
}
let _sosOvs=[];
function _drawSosPins(){
  _sosOvs.forEach(o=>{try{o.setMap(null);}catch(e){}});_sosOvs=[];
  if(!mapR)return;
  // 사고에 연결된 실시간 핑(역할 포함) → 그 사고(최초접수 좌표)와 잇는 정보
  const _rescues=(typeof DB!=='undefined')?(DB.g('rescues')||[]):[];
  const _linkOf={}; // tok → {r, role, name}
  _rescues.forEach(r=>{
    if(!r||!r.lat||!r.lng)return;
    (typeof _rescueSosLinks==='function'?_rescueSosLinks(r):[]).forEach(l=>{_linkOf[l.id]={r:r,role:l.role||'사고자',name:l.name||''};});
  });
  _sosLocated().forEach(p=>{
    const pos=new kakao.maps.LatLng(p.lat,p.lng);
    const link=_linkOf[p.id]||null;      // 이 실시간 위치가 어느 사고의 누구인지
    const isVictim=link&&link.role==='사고자';
    const col=link?'#14b8a6':'#ff3b30';  // 연결됨=청록(실시간) / 미연결=빨강(일반 조난)
    // 정확도 원(±오차반경) — 위치가 '이 범위 안'임을 시각화
    const acc=Math.max(parseInt(p.acc)||0,15);
    try{
      const circ=new kakao.maps.Circle({center:pos,radius:acc,strokeWeight:1.5,strokeColor:col,strokeOpacity:.85,strokeStyle:'shortdash',fillColor:col,fillOpacity:.13});
      circ.setMap(mapR);_sosOvs.push(circ);
    }catch(e){}
    // 사고자 역할만: 최초접수 좌표 ↔ 실시간 위치 점선 + 거리 라벨(동반자 등은 선 없이 라벨로 구분 — 지도 어지러움 방지)
    if(isVictim){
      const linked=link.r;
      const dist=(typeof _haversineKm==='function')?Math.round(_haversineKm(linked.lat,linked.lng,p.lat,p.lng)*1000):0;
      if(dist>=15){
        try{
          const line=new kakao.maps.Polyline({path:[new kakao.maps.LatLng(linked.lat,linked.lng),pos],strokeWeight:2.5,strokeColor:'#ffffff',strokeOpacity:.8,strokeStyle:'shortdash',zIndex:9});
          line.setMap(mapR);_sosOvs.push(line);
          const ml=new kakao.maps.LatLng((linked.lat+p.lat)/2,(linked.lng+p.lng)/2);
          const lbl=document.createElement('div');
          lbl.style.cssText='background:rgba(4,10,22,.85);color:#a7f3e4;border:1px solid rgba(20,184,166,.5);border-radius:7px;padding:1px 7px;font-size:10px;font-weight:800;white-space:nowrap;transform:translateY(-1px);';
          lbl.textContent='최초접수↔실시간 '+dist+'m';
          const lov=new kakao.maps.CustomOverlay({position:ml,content:lbl,zIndex:11});
          lov.setMap(mapR);_sosOvs.push(lov);
        }catch(e){}
      }
    }
    // 작은 도트 + 라벨: 역할(사고자/동반자/신고자…) + 이름 + 정확도 + ⛰고도(GPS 수신 시)
    const who=link
      ?(link.role+((link.name||p.name)?' '+String(link.name||p.name).slice(0,6):''))
      :String(p.name||'조난자').slice(0,8);
    const el=document.createElement('div');
    el.className='sos-pin'+(link?' sos-live':'');
    // 🚨진행중 구조 핀과 ~20m 이내(같은 사고의 좌표) 겹침 → 화면상 오른쪽 위로 비껴 표시(연결선·실제위치 점은 CSS .sos-offset — 픽셀 오프셋이라 줌 무관)
    try{
      const _resShown=(typeof resTypeF==='undefined'||resTypeF.size===0||resTypeF.has('🚨구조'))&&(typeof resStatusF==='undefined'||resStatusF.size===0||resStatusF.has('진행중'));
      if(_resShown&&typeof _haversineKm==='function'&&_rescues.some(r=>r&&r.status==='ongoing'&&r.lat&&r.lng&&_haversineKm(r.lat,r.lng,p.lat,p.lng)*1000<=20))el.className+=' sos-offset';
    }catch(e){}
    el.innerHTML=`<span class="sos-dot">🆘</span><span class="sos-lbl">${_esc(who)}</span>`;
    el.addEventListener('click',e=>{e.stopPropagation();_sosPinPopup(p.id);});
    const ov=new kakao.maps.CustomOverlay({position:pos,content:el,clickable:true,yAnchor:0.5,zIndex:12});
    ov.setMap(mapR);_sosOvs.push(ov);
  });
}
function _sosPinPopup(id){
  const p=(_sosPings||[]).find(x=>x.id===id);if(!p)return;
  try{_logAccess&&_logAccess('조난자 정보',p.name||'익명');}catch(e){}
  window._sosPopupId=id; // 스냅샷 갱신 시 이 대화만 갱신(입력 보존)
  const has=p.lat&&p.lng;
  const mm=p.ts?Math.round((Date.now()-(p.ts||0))/60000):null;
  const html=`
    <div style="background:#1c1c1e;border:1px solid rgba(231,76,60,.4);border-radius:11px;padding:13px 15px;margin-bottom:10px;">
      <div style="font-size:16px;font-weight:800;color:#ff8a73;">🆘 ${_esc(p.name||'익명 조난자')}</div>
      ${_sosForeignBadge(p)?`<div style="margin-top:5px;">${_sosForeignBadge(p)}</div>`:''}
      ${p.msg?`<div style="font-size:13px;color:#eaecef;margin-top:6px;line-height:1.5;">${_esc(p.msg)}</div>`:''}
      ${has?`<div style="font-size:11px;color:#949aa2;margin-top:8px;font-family:monospace;">📍 ${(+p.lat).toFixed(6)}, ${(+p.lng).toFixed(6)}${(typeof _elevStr==='function')?' <span style="color:#a7f3e4;">'+_elevStr(p.lat,p.lng,p.alt)+'</span>':''}<br>정확도 ±${p.acc||'?'}m · ${mm}분 전 수신 · ${_sosAtStr(p)}</div>`:`<div style="font-size:11px;color:#ffd24d;margin-top:8px;">⚪ 아직 위치 미수신 — 대화는 가능합니다</div>`}
    </div>
    ${has?`<div style="display:flex;gap:6px;">
      <button onclick="_sosFocus('${p.id}')" style="flex:1;background:rgba(255,255,255,.12);color:#3182f6;border:1px solid rgba(255,255,255,.35);border-radius:8px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;">🗺️ 위치로 이동</button>
      <button onclick="sosToRescue('${p.id}')" style="flex:1;background:linear-gradient(180deg,#e74c3c,#c0392b);color:#fff;border:none;border-radius:8px;padding:11px;font-size:13px;font-weight:800;cursor:pointer;">🚨 구조 사고로 등록</button>
    </div>`:''}
    <div style="margin-top:10px;background:#1c1c1e;border:1px solid rgba(255,255,255,.08);border-radius:11px;padding:10px;">
      <div style="font-size:12px;font-weight:700;color:#aab4c0;margin-bottom:7px;">💬 조난자와 대화 <span style="font-size:10px;color:#6b7684;font-weight:400;">상대 화면에 실시간 표시</span></div>
      <div id="sosTeamChat" style="max-height:230px;overflow-y:auto;margin-bottom:8px;">${_sosChatBubbles(p.msgs||[],'t')}</div>
      <div style="display:flex;gap:6px;">
        <input id="sosTeamChatIn" placeholder="메시지 입력" style="flex:1;min-width:0;box-sizing:border-box;background:#0f0f11;border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:8px;padding:10px;font-size:14px;" onkeydown="if(event.key==='Enter')_sosTeamSend('${p.id}')">
        <button onclick="_sosTeamSend('${p.id}')" style="flex-shrink:0;background:#1a6e9e;color:#fff;border:none;border-radius:8px;padding:0 15px;font-size:13px;font-weight:700;cursor:pointer;">전송</button>
      </div>
    </div>
    <button onclick="_sosCloseModal();_sosCloseToken('${p.id}')" style="width:100%;margin-top:7px;background:rgba(192,57,43,.1);color:#c0392b;border:1px solid rgba(192,57,43,.3);border-radius:8px;padding:10px;font-size:12px;font-weight:700;cursor:pointer;">🔚 접수 종료 (링크 비활성화)</button>`;
  _sosModal('🆘 조난자',html);
  setTimeout(function(){const c=document.getElementById('sosTeamChat');if(c)c.scrollTop=c.scrollHeight;},30);
}
// 구조대 → 조난자 메시지 전송(채팅) — 보낸 사람 이름/소속 함께 저장
function _sosTeamSend(id){
  const inp=document.getElementById('sosTeamChatIn');const t=((inp&&inp.value)||'').trim();if(!t)return;
  inp.value='';
  const u=DB.g('currentUser')||{};
  const by=(u.realName||u.name||'구조대').slice(0,20);
  const org=(u.dept||'설악산 구조대').slice(0,20);
  const msg={f:'t',x:t.slice(0,300),by:by,org:org,ts:Date.now()};
  const p=(_sosPings||[]).find(x=>x.id===id);if(p)p.msgs=(p.msgs||[]).concat([msg]);
  _sosRefreshTeamChat(); // 낙관적 즉시 표시
  _sosAppendMsg(id,msg);
}
function _sosCopyBtnOk(btn){if(!btn)return;const o=btn.textContent;btn.textContent='✓ 복사됨';btn.style.background='#27ae60';setTimeout(function(){try{btn.textContent=o;btn.style.background='#1a4a6e';}catch(e){}},1600);}
function _sosCopyUrl(tok,btn){const u=_sosVictimUrl(tok);if(navigator.clipboard)navigator.clipboard.writeText(u).then(function(){toast('📋 링크 복사됨 — 조난·사고자에게 보내세요');_sosCopyBtnOk(btn);}).catch(function(){_fallbackCopy(u);_sosCopyBtnOk(btn);});else{_fallbackCopy(u);_sosCopyBtnOk(btn);}}
function _sosShareUrl(tok){const u=_sosVictimUrl(tok);if(navigator.share)navigator.share({title:'설악산 구조대 위치전송',text:'[설악산국립공원 구조대] 안전사고 구조 출동을 위해 현 위치 확인이 필요합니다. 아래 1회용 링크를 열고 [위치 전송]을 누르시면 현재 위치가 구조대원에게 전송됩니다(구조 목적 외 사용하지 않음, 로그인 불필요).\n'+u}).catch(()=>{});}
function _sosSms(tok){const u=_sosVictimUrl(tok);location.href='sms:?body='+encodeURIComponent('[설악산국립공원 구조대] 안전사고 구조 출동을 위해 현 위치 확인이 필요합니다. 아래 1회용 링크를 열고 [위치 전송]을 누르시면 현재 위치가 구조대원에게 전송됩니다(구조 목적 외 사용하지 않음, 로그인 불필요): '+u);}
// 전화/위치요청 버튼 HTML (사고자·신고자 전화번호 옆)
function _telBtnsHtml(tel,resId,role,name){
  const t=String(tel||'').replace(/[^0-9+]/g,'');if(!t)return '';
  const _q=s=>String(s||'').replace(/[\\']/g,'').slice(0,20);
  const _r=(resId!==undefined&&resId!==null&&resId!=='')?","+resId+",'"+_q(role||'사고자')+"','"+_q(name)+"'":'';
  // margin-left:auto → 인적사항 줄이 길어 버튼이 아래로 내려가도 항상 우측 정렬(완성도 있게). 두 버튼은 한 덩어리로 유지
  return ` <span style="display:inline-flex;gap:4px;margin-left:auto;flex-shrink:0;"><button onclick="_callTel('${t}')" style="background:rgba(39,174,96,.15);color:#5dbf8a;border:1px solid rgba(39,174,96,.35);border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;">📞 전화</button><button onclick="_smsSosTo('${t}'${_r})" style="background:rgba(255,255,255,.15);color:#aab4c0;border:1px solid rgba(255,255,255,.35);border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;">🆘 위치요청</button></span>`;}
// 보고서 상세: 전화번호 탭 → 전화 / 위치요청(1회용 SOS 링크 만들어 그 번호로 문자)
function _callTel(tel){tel=String(tel||'').replace(/[^0-9+]/g,'');if(!tel){toast('전화번호 없음');return;}if(confirm(tel+' 로 전화하겠습니까?'))location.href='tel:'+tel;}

// resId 를 함께 주면: 발급 토큰을 그 사고에 역할(사고자/동반자/신고자/추가 사고자)과 함께 연결(r.sosLinks)
// → 실시간 위치가 지도·보고서에 '누구인지' 표시. 사고자 역할 토큰은 r.sosId(대표)로도 유지(채택·거리 기준)
function _smsSosTo(tel,resId,role,name){
  tel=String(tel||'').replace(/[^0-9+]/g,'');if(!tel){toast('전화번호 없음');return;}
  if(!_fdb){toast('연결 준비 중 — 잠시 후 다시');return;}
  const tok=_sosGenToken();
  const by=(typeof getAuthor==='function')?getAuthor():'구조대';
  toast('🆘 위치요청 링크 생성 중…');
  _fdb.collection('sos').doc(tok).set({id:tok,active:true,issuedAt:Date.now(),by:by},{merge:true})
    .then(function(){
      let foreign=false;
      if(resId!==undefined&&resId!==null&&resId!==''){
        try{
          const res=DB.g('rescues')||[];const i=res.findIndex(x=>String(x.id)===String(resId));
          if(i>=0){
            const rl=role||'사고자';
            res[i].sosLinks=(res[i].sosLinks||[]).concat([{id:tok,role:rl,name:(name||'').slice(0,20)}]);
            if(rl==='사고자')res[i].sosId=tok;
            DB.s('rescues',res);foreign=res[i].vNation==='외국인';
          }
        }catch(e){}
      }
      const u=_sosVictimUrl(tok);
      // 외국인 사고자면 한국어 아래 영어 병기 — 수집 목적·사용 범위 고지 포함(면책·동의 근거)
      const _koMsg='[설악산국립공원 구조대] 안전사고 구조 출동을 위해 현 위치 확인이 필요합니다. 아래 링크를 열고 [위치 전송]을 누르시면 현재 위치가 구조대원에게 전송됩니다(구조 목적 외 사용하지 않음, 로그인 불필요)';
      const body=foreign
        ?_koMsg+'.\n[Seoraksan Rescue] To dispatch rescuers for a safety incident, we need your current location. Open the link and tap [Send Location] — your location is sent to the rescue team and used for rescue purposes only (no login required):\n'+u
        :_koMsg+': '+u;
      location.href='sms:'+tel+'?&body='+encodeURIComponent(body);
    })
    .catch(function(){toast('링크 생성 실패 — 다시 시도');});
}
// 사고의 SOS 링크 전체(신형 sosLinks + 구형 sosId) — [{id,role,name}]
function _rescueSosLinks(r){
  if(!r)return [];
  const links=(r.sosLinks||[]).slice();
  if(r.sosId&&!links.some(l=>l.id===r.sosId))links.unshift({id:r.sosId,role:'사고자',name:r.vName||''});
  return links;
}
// 사고에 연결된 실시간 위치 전체 — 위치 수신된 것만 [{ping,role,name}]
function _linkedSosAll(r){
  const out=[];
  _rescueSosLinks(r).forEach(l=>{
    const p=(_sosPings||[]).find(x=>x.id===l.id);
    if(p&&p.lat&&p.lng)out.push({ping:p,role:l.role||'사고자',name:l.name||''});
  });
  return out;
}
// 대표(사고자) 실시간 핑 — 채택·거리 기준. 없으면 null
function _linkedSosPing(r){
  if(!r||!r.sosId)return null;
  const p=(_sosPings||[]).find(x=>x.id===r.sosId);
  return (p&&p.lat&&p.lng)?p:null;
}
// 🔗 연계 SOS 실시간 위치 → 진행중 사고 위치 자동 추적. 25m 이상 이동 + 45초 쓰로틀(쿼터 절약), 최초접수 원본 보존·이력 기록.
// r.sosAutoTrack===false 인 사고는 제외(수동 채택만). 사고자 이동/이송 중 위치가 저절로 따라감.
function _autoTrackSosRescues(){
  try{
    if(!window._sosInited)return;
    const res=DB.g('rescues')||[];let changed=false;const t=Date.now();
    res.forEach(r=>{
      if(r.status!=='ongoing'||!r.sosId||r.sosAutoTrack===false)return;
      const p=(_sosPings||[]).find(x=>x.id===r.sosId&&x.lat&&x.lng);if(!p)return;
      const moved=(r.lat&&r.lng&&typeof _haversineKm==='function')?_haversineKm(r.lat,r.lng,p.lat,p.lng)*1000:99999;
      if(moved<25)return;                              // GPS 지터 무시
      if(r._sosTrackAt&&t-r._sosTrackAt<45000)return;  // 45초 쓰로틀
      if(r.origLat==null){r.origLat=r.lat;r.origLng=r.lng;}
      r.locLog=(r.locLog||[]).concat([{from:{lat:r.lat||0,lng:r.lng||0},to:{lat:+(+p.lat).toFixed(6),lng:+(+p.lng).toFixed(6)},at:now(),by:'실시간추적',dist:Math.round(moved),via:'SOS 자동추적'}]);
      r.lat=+(+p.lat).toFixed(6);r.lng=+(+p.lng).toFixed(6);r._sosTrackAt=t;changed=true;
    });
    if(changed){DB.s('rescues',res);try{if(window.curApp==='rescue'){renderRescueMap();renderResList();}}catch(e){}}
  }catch(e){}
}
// 사고 종료 시 연계된 SOS 링크(토큰) 전부 비활성화 — 종료된 사고의 실시간 추적 잔존 방지
function _closeLinkedSos(r){
  const links=_rescueSosLinks(r);
  if(!links.length)return;
  const ids=links.map(l=>l.id);
  try{if(_fdb)ids.forEach(id=>_fdb.collection('sos').doc(id).set({active:false,closedAt:Date.now()},{merge:true}).catch(()=>{}));}catch(e){}
  _sosPings=(_sosPings||[]).filter(x=>!ids.includes(x.id));
  try{_drawSosPins();_updateSosFab();}catch(e){}
}
// 사고자 실시간 위치를 최초접수 좌표로 '채택'(수동) — r.lat/lng 갱신 + 변경 이력 기록. 최초접수는 원본 보존(origLat/origLng)
function adoptSosLoc(resId){
  const res=DB.g('rescues')||[];const i=res.findIndex(x=>String(x.id)===String(resId));if(i<0)return;
  const r=res[i];const p=_linkedSosPing(r);
  if(!p){toast('실시간 위치 없음');return;}
  const dist=(typeof _haversineKm==='function')?Math.round(_haversineKm(r.lat,r.lng,p.lat,p.lng)*1000):0;
  if(!confirm('사고 위치를 사고자 실시간 위치로 이동합니까?\n(최초접수 좌표는 기록에 보존됩니다'+(dist?' · 거리 '+dist+'m':'')+')'))return;
  if(r.origLat==null){r.origLat=r.lat;r.origLng=r.lng;} // 최초접수 원본 1회 보존
  const by=(typeof getAuthor==='function')?getAuthor():'구조대';
  r.locLog=(r.locLog||[]).concat([{from:{lat:r.lat,lng:r.lng},to:{lat:+p.lat,lng:+p.lng},at:(typeof now==='function')?now():'',by:by,dist:dist}]);
  r.lat=+(+p.lat).toFixed(6);r.lng=+(+p.lng).toFixed(6);
  DB.s('rescues',res);
  toast('📍 사고 위치를 실시간 위치로 이동');
  try{if(window.curApp==='rescue'){renderRescueMap();renderResList();}}catch(e){}
  try{const rp=document.getElementById('resPopup');if(rp&&rp.classList.contains('on'))openResPopup(resId,'rescue');}catch(e){}
  try{const ov=document.getElementById('resOverlay');if(ov)openRescueOverlay(resId);}catch(e){}
}
// 구조대 → 조난·사고자에게 메시지 전송 (그 사람 화면 하단에 즉시 표시 · 비우면 삭제)
// 카드의 '💬 대화' 버튼 → 채팅 팝업 열기
function _sosSendMsg(id){_sosPinPopup(id);}
function _sosFocus(id){
  const p=(_sosPings||[]).find(x=>x.id===id);if(!p)return;
  _sosCloseModal();
  if(mapR&&p.lat&&p.lng){try{mapR.setCenter(new kakao.maps.LatLng(p.lat,p.lng));mapR.setLevel(4);}catch(e){}}
}
// 조난·사고자 위치 → 1보 작성 폼으로 바로 이동 (코드기반 제목 '09-11 조난', 이름은 사고자란)
function sosToRescue(id){
  const p=(_sosPings||[]).find(x=>x.id===id);if(!p||!p.lat||!p.lng){toast('위치 수신 후 등록 가능');return;}
  window._pendingSosId=id; // 1보 '제출' 시점에 토큰 종료(작성 취소 시 위치 유지)
  _sosCloseModal();
  // 가까운 표지판 코드 → 제목 'NN-NN 조난'
  let sign=null;try{sign=_nearestSignFull(p.lat,p.lng);}catch(e){}
  const code=sign?sign.code:'';
  // 외국인이면 국적/언어를 인적사항·경위에 반영
  const isForeign=p.lang&&p.lang!=='ko';
  const langLbl=isForeign?((typeof _SOS_LABEL!=='undefined'&&_SOS_LABEL[p.lang])||p.lang):'';
  const foreignNote=isForeign?('[외국인'+(p.country?' · '+p.country:'')+' · '+langLbl+'] '):'';
  const prefill={
    type:'조난', lat:p.lat, lng:p.lng, loctype:'법정탐방로',
    vName:(p.name||''),                       // 이름은 사고자 인적사항(세부)에
    vNation:(isForeign?'외국인':'알수없음'), vNationality:(isForeign?(p.country||langLbl):''),
    situation:(foreignNote+(p.msg||'')).trim(),// 외국인 표기 + 조난자 메모 → 사고경위
    title:(code?code+' 조난':'조난'), sosId:id
  };
  // 1보 작성 폼 열기 (openNewRescue와 동일 경로)
  curResId=null;
  document.getElementById('topTitle').textContent='신규 구조 접수 (최초접수)';
  document.getElementById('bnav').style.display='none';
  showV('v-report');render1BoForm(prefill);
  try{_autoFillLoc(p.lat,p.lng);}catch(e){}     // 사고 장소 자동(가까운 표지판)
  setTimeout(function(){
    const t=document.getElementById('r_title');if(!t)return;
    t.value=prefill.title;t.dataset.userEdited='1';
    if(!code){ // 표지판 코드 없음 → 역지오코딩 지명으로 'OO 조난'
      try{
        const gc=new kakao.maps.services.Geocoder();
        gc.coord2Address(p.lng,p.lat,function(res,st){
          if(st===kakao.maps.services.Status.OK&&res&&res[0]){
            const a=res[0].address||res[0].road_address;
            const nm=a?(a.region_3depth_name||a.region_2depth_name||''):'';
            if(nm&&t)t.value=nm+' 조난';
          }
        });
      }catch(e){}
    }
  },220);
  toast('🚨 조난 접수 — 1보 작성 화면');
}

// ══════════════════════════════════════════
// 앱 자체 업데이트 (OTA · Capgo 자체호스팅) — APK 전용. 웹/PWA는 서비스워커가 자동 갱신.
// 번들(www)의 새 버전을 ota.json으로 알리면, 설치된 앱이 받아서 그 자리에서 교체(재빌드 불필요).
// ══════════════════════════════════════════
const OTA_VER='2026.08.15.382';                         // ← 현재 번들 버전 (릴리스마다 올림 · build-ota.sh가 ota.json에 반영)
const OTA_MANIFEST='https://seorak1275.github.io/seoraksan/ota.json';
// 업데이트 확인 폴백 소스 — 일부 기관망·통신사에서 github.io가 막혀 '확인 실패(네트워크)'가 나는 경우 대비.
// 순서대로 시도: ① GitHub Pages(원본·즉시 반영) ② jsDelivr CDN(공개저장소 미러·거의 모든 망 통과)
// ③ raw.githubusercontent(원본 직접). 매니페스트를 받은 소스에서 번들(bundle.zip)도 같이 받는다.
const OTA_SOURCES=[
  {mf:'https://seorak1275.github.io/seoraksan/ota.json',                      base:'https://seorak1275.github.io/seoraksan/'},
  {mf:'https://cdn.jsdelivr.net/gh/seorak1275/seoraksan@main/ota.json',       base:'https://cdn.jsdelivr.net/gh/seorak1275/seoraksan@main/'},
  {mf:'https://raw.githubusercontent.com/seorak1275/seoraksan/main/ota.json', base:'https://raw.githubusercontent.com/seorak1275/seoraksan/main/'}
];
let _otaInfo=null;
function _otaPlugin(){try{return (window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.CapacitorUpdater)||null;}catch(e){return null;}}
function _isNativeApp(){try{return !!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());}catch(e){return false;}}
// OTA 버전 비교 'YYYY.MM.DD.build' — a가 b보다 크면 1, 작으면 -1, 같으면 0. (구버전으로 '업데이트' 되던 것 방지)
function _otaCmp(a,b){var pa=String(a||'').split('.').map(function(n){return parseInt(n,10)||0;}),pb=String(b||'').split('.').map(function(n){return parseInt(n,10)||0;});for(var i=0;i<Math.max(pa.length,pb.length);i++){var x=pa[i]||0,y=pb[i]||0;if(x!==y)return x>y?1:-1;}return 0;}
async function _otaCheck(manual){
  const plug=_otaPlugin();
  if(!_isNativeApp()||!plug){ if(manual)toast('웹은 새로고침으로 자동 갱신됩니다(앱 전용 기능)'); return; }
  let m=null,src=null,lastErr='';
  for(const s of OTA_SOURCES){
    try{
      const r=await fetch(s.mf+'?t='+Date.now(),{cache:'no-store'});
      if(!r.ok)throw new Error('HTTP '+r.status);
      m=await r.json(); src=s; break;
    }catch(e){ lastErr=(e&&e.message)||String(e); }
  }
  if(!m){
    // 최후 폴백: Firestore 미러(웹 방문자들이 자동 갱신) — 이 앱의 동기화가 되는 망이면 무조건 받아짐
    try{ const fs=DB.g('otaInfo'); if(fs&&fs.version&&fs.url)m=fs; }catch(e){}
    if(!m){ if(manual)toast('⚠️ 업데이트 확인 실패 — 서버 접근 불가 ('+lastErr+') · 네트워크(Wi-Fi↔LTE)를 바꿔 재시도해 보세요',5000); return; }
  }
  if(!m.version||!m.url){ if(manual)toast('업데이트 정보 없음'); return; }
  // github.io가 막힌 망: 매니페스트를 받아온 폴백 소스에서 번들도 받도록 URL 재작성
  try{ if(src&&src.base.indexOf('github.io')<0){ const fn=String(m.url).split('/').pop()||'bundle.zip'; m.url=src.base+fn; } }catch(e){}
  // 확인 성공분을 Firestore에 미러 — github이 막힌 다른 기기들의 폴백 정보로 사용
  try{ if(typeof _authReady!=='undefined'&&_authReady){ const cur=DB.g('otaInfo'); if(!cur||_otaCmp(m.version,cur.version)>0)DB.s('otaInfo',{version:m.version,url:m.url,notes:m.notes||'',at:Date.now()}); } }catch(e){}
  if(_otaCmp(m.version,OTA_VER)<=0){ _otaInfo=null;_otaBanner(); if(manual)toast('✅ 최신 버전입니다 ('+OTA_VER+')'); return; } // 같거나 낮은 버전이면 업데이트 안내·적용 안 함
  _otaInfo=m; _otaBanner();
  if(manual)_otaApply();
}
async function _otaApply(){
  const plug=_otaPlugin(); if(!plug||!_otaInfo)return;
  _otaClearCountdown();
  const _m=document.getElementById('otaModal');if(_m)_m.remove();
  try{
    toast('⬇️ 업데이트 받는 중… 잠시만요 (완료되면 자동 재시작)',8000);
    let b;
    try{ b=await plug.download({url:_otaInfo.url,version:String(_otaInfo.version)}); }
    catch(e1){
      // 원본(github.io) 다운로드 실패 → jsDelivr CDN 미러로 1회 재시도 (github 계열이 막힌 망 대응)
      const alt='https://cdn.jsdelivr.net/gh/seorak1275/seoraksan@main/'+(String(_otaInfo.url).split('/').pop()||'bundle.zip');
      if(alt!==_otaInfo.url)b=await plug.download({url:alt,version:String(_otaInfo.version)});
      else throw e1;
    }
    await plug.set(b); // 적용 + 자동 재시작 (새 번들이 notifyAppReady 못하면 다음 실행 시 자동 롤백)
  }catch(e){ toast('⚠️ 업데이트 실패: '+(e&&(e.message||e.code)||e)); }
}
var _otaCountTimer=null,_otaDeferred=false;
function _otaClearCountdown(){if(_otaCountTimer){clearInterval(_otaCountTimer);_otaCountTimer=null;}}
function _otaDismiss(){_otaClearCountdown();_otaDeferred=true;const el=document.getElementById('otaModal');if(el)el.remove();}
// 가운데 팝업: [지금 업데이트]/[나중에 하기]. 5초 안에 '나중에 하기'를 안 누르면 자동 업데이트.
function _otaBanner(){
  // 정보 없음 → 닫기
  if(!_otaInfo){_otaClearCountdown();const e=document.getElementById('otaModal');if(e)e.remove();return;}
  if(_otaDeferred)return;            // 이미 '나중에' 선택 → 이번 세션엔 다시 안 띄움
  let el=document.getElementById('otaModal');
  if(el)return;                      // 이미 떠 있음
  el=document.createElement('div');el.id='otaModal';
  el.style.cssText='position:fixed;inset:0;z-index:100002;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:24px;';
  el.innerHTML='<div style="background:#0f2034;border:1px solid rgba(255,255,255,.3);border-radius:18px;max-width:340px;width:100%;padding:24px 20px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.6);">'
    +'<div style="font-size:40px;">🔄</div>'
    +'<div style="font-size:18px;font-weight:800;color:#eaecef;margin-top:8px;">새 버전이 있습니다</div>'
    +(_otaInfo.notes?'<div style="font-size:12px;color:#a5abb3;margin-top:8px;line-height:1.6;">'+_esc(_otaInfo.notes)+'</div>':'')
    +'<div id="otaCountTxt" style="font-size:11px;color:#6b7684;margin-top:12px;"><b style="color:#aab4c0;">5초</b> 후 자동으로 업데이트됩니다</div>'
    +'<button onclick="_otaApply()" style="width:100%;margin-top:16px;padding:14px;border:none;border-radius:12px;background:linear-gradient(180deg,#3182f6,#1a6e9e);color:#fff;font-size:15px;font-weight:800;cursor:pointer;">지금 업데이트</button>'
    +'<button onclick="_otaDismiss()" style="width:100%;margin-top:8px;padding:12px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:none;color:#a5abb3;font-size:13px;font-weight:600;cursor:pointer;">나중에 하기</button>'
    +'</div>';
  document.body.appendChild(el);
  // 5초 카운트다운 → 자동 업데이트
  _otaClearCountdown();
  var left=5;
  _otaCountTimer=setInterval(function(){
    left--;
    var t=document.getElementById('otaCountTxt');
    if(left>0){ if(t)t.innerHTML='<b style="color:#aab4c0;">'+left+'초</b> 후 자동으로 업데이트됩니다'; }
    else{ _otaClearCountdown(); if(document.getElementById('otaModal'))_otaApply(); }
  },1000);
}
function _otaInit(){
  if(!_isNativeApp())return;
  const plug=_otaPlugin();
  if(plug&&plug.notifyAppReady){try{plug.notifyAppReady();}catch(e){}} // 현재 번들 정상 표시(미호출 시 다음 실행 롤백)
  setTimeout(function(){_otaCheck(false);},4000); // 시작 후 조용히 확인 → 있으면 가운데 팝업
  // 앱을 껐다 켜지 않아도 새 버전이 반영되도록: 복귀 시(30분 스로틀) + 60분마다 재확인
  var _last=Date.now();
  var _re=function(){if(Date.now()-_last<1800000)return;_last=Date.now();_otaCheck(false);};
  setInterval(function(){_re();},3600000);
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')_re();});
}

window.onload=function(){
  // 안드로이드 APK: 시스템 글자 확대가 WebView 텍스트만 부풀려 레이아웃이 깨지는 것 방지
  // (@capacitor/text-zoom 플러그인이 포함된 APK에서만 동작 — 미포함이면 조용히 무시)
  try{
    var _tz=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.TextZoom;
    if(_tz&&_tz.set)_tz.set({value:1}).catch(function(){});
  }catch(e){}
  // 🆘 조난자 위치전송 모드(?sos): 로그인·앱 로딩 전부 건너뛰고 위치만 전송
  if(/[?&]sos(=|&|$)/.test(location.search)){ try{_bootSos();}catch(e){document.body.innerHTML='<div style="color:#fff;padding:30px;font-size:16px;">위치 전송 초기화 오류: '+(e&&e.message||e)+'<br>새로고침 해주세요.</div>';} return; }
  try{_restoreFilters();}catch(e){} // 마지막 사용 필터 복원
  // ── 로딩 화면 ── (애니메이션은 loadingScreen 직후 인라인 스크립트에서 이미 시작됨)
  (function(){
    window._hideLoading=function(){
      if(window._hideLoadingDone) return;
      window._hideLoadingDone=true;
      if(window._safeLoadingTimer)clearTimeout(window._safeLoadingTimer);
      clearInterval(window._loadTipTimer);clearInterval(window._loadBarTimer);
      var barEl=document.getElementById('loadBar');
      if(barEl)barEl.style.width='100%';
      var _hlTimer=null;
      window.showLoginScreen=function showLoginScreen(){
        if(_hlTimer){clearTimeout(_hlTimer);_hlTimer=null;}
        var ls=document.getElementById('loginScreen');
        if(!ls)return;
        window._loginVisible=true; // 뒤로가기 판정용 (style.display 의존 제거)
        // 즉시 완전히 덮는다 — 예전엔 opacity 0 + pointerEvents none 상태로 잠깐 두었다가
        // rAF 뒤에 켜서, 그 사이 홈이 비쳐 보이고 클릭이 통과되는 버그가 있었다. 페이드 없이 바로 표시.
        ls.style.transition='';
        ls.style.display='flex';
        ls.style.opacity='1';
        ls.style.pointerEvents='auto';
        // 카카오에서 돌아와 토큰 교환 중이면(느린 통신에서 6초 안전타임아웃으로 로그인화면이 드러나도)
        // 버튼 대신 '로그인 중입니다…'를 보여 재클릭을 막는다.
        try{_loginBusy(!!(window._needsCode||window._kakaoAuthCode));}catch(e){}
        try{_applyAppLock();}catch(e){} // 2차 방어선: #app 자체를 조작 불가로
      }
      window.hideLoginScreen=function hideLoginScreen(){
        var ls=document.getElementById('loginScreen');
        window._loginVisible=false; // 로그인 완료 → 즉시 미표시로 간주 (페이드아웃 중 오판 방지)
        try{_loginBusy(false);}catch(e){} // 진행 표시 원복
        if(!ls||ls.style.display==='none'){try{_applyAppLock();}catch(e){}return;}
        ls.style.pointerEvents='none';
        ls.style.transition='opacity .3s';ls.style.opacity='0';
        if(_hlTimer)clearTimeout(_hlTimer);
        _hlTimer=setTimeout(function(){_hlTimer=null;ls.style.display='none';ls.style.transition='';},350);
        try{_applyAppLock();}catch(e){} // 로그인만 됐고 프로필·승인 미완이면 앱은 계속 잠긴 채로
      }
      function checkAuth(){
        updateUserUI();
        var authType=(typeof DB!=='undefined'&&typeof _resolveAuthType==='function')?_resolveAuthType():'';
        if(!authType){showLoginScreen();}
        else{_checkAndRequireProfile();}
        try{_applyAppLock();}catch(e){}
      }
      // 먼저 인증 판정을 끝내(필요 시 loginScreen[z10000]이 loadingScreen[z9999] 위로 즉시 덮음)
      // 그 다음 로딩화면을 걷어낸다 → 로딩 제거~로그인 표시 사이에 홈이 노출되던 창을 없앰.
      setTimeout(function(){
        var ls=document.getElementById('loadingScreen');
        checkAuth();
        if(ls){
          ls.style.pointerEvents='none';
          ls.style.transition='opacity .35s';ls.style.opacity='0';
          setTimeout(function(){ if(ls.parentNode)ls.parentNode.removeChild(ls); },350);
        }
      },120);
    };
    // 최종 폴백은 위쪽 스크립트의 6초 절대 타임아웃(_safeLoadingTimer)에 위임.
    // 여기서 별도로 더 일찍 강제 전환하지 않아야 Firestore 데이터가
    // 도착하기 전에 빈 화면이 먼저 보이는 문제(로딩 중 데이터 미리 받기)를 막을 수 있다.
  })();

  // 안드로이드 하드웨어 뒤로가기: Capacitor App 플러그인 콜백 → history.back() 위임.
  // (이 리스너를 등록하면 Capacitor 기본 동작인 "즉시 앱 종료"가 꺼지고, 아래
  //  popstate 핸들러가 모달 닫기·서브뷰 복귀·홈에서 2회 눌러야 종료를 그대로 처리한다)
  (function(){
    var App=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App;
    if(!App)return;
    App.addListener('backButton', function(){ window.history.back(); });
  })();
  // 웹/PWA 뒤로가기 처리
  var _backExitReady=false,_backExitTimer=null;
  function _exitApp(){
    var isNative=window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform();
    if(isNative&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App){Capacitor.Plugins.App.exitApp();return true;}
    var isPWA=window.matchMedia('(display-mode: standalone)').matches||!!window.navigator.standalone;
    if(isPWA){window.close();return true;}
    toast('브라우저 탭을 닫아 종료하세요');return false;
  }
  window.addEventListener('popstate', function(e){
    // 로그인 화면(미로그인 상태)에서 뒤로가기: 돌아갈 곳이 없으므로 바로 종료
    if(window._loginVisible){
      history.pushState({view:'home'},'','');
      _exitApp();return;
    }
    // 관리자 로그인 오버레이가 떠 있으면 그것부터 닫기 (전체 화면을 덮고 있어 안 닫으면 먹통처럼 보임)
    var adminOv=document.getElementById('adminLoginOverlay');
    if(adminOv&&adminOv.style.display==='flex'){adminOv.style.display='none';history.pushState({view:'home'},'','');return;}
    // 🧭 시설물 내비 오버레이 → 뒤로가기로 닫기(GPS·음성 정리)
    var fnOv=document.getElementById('facNavOv');
    if(fnOv){try{closeFacNav();}catch(e){fnOv.remove();}history.pushState({view:'home'},'','');return;}
    // 사진 전체보기 닫기
    var lb=document.getElementById('photoLightbox');
    if(lb&&lb.style.display==='flex'){lb.style.display='none';history.pushState({view:'home'},'','');return;}
    // 변경사항(체인지로그) 모달 닫기
    var clog=document.getElementById('changelogModal');
    if(clog&&clog.style.display!=='none'&&clog.style.display!==''){closeChangelog();history.pushState({view:'home'},'','');return;}
    // 알림(벨) 패널 닫기
    var nPanel=document.getElementById('notiPanel');
    if(nPanel&&nPanel.classList.contains('on')){closeNoti();history.pushState({view:'home'},'','');return;}
    // 열린 모달이 있으면 닫기
    var openModal=document.querySelector('.modal.on,.modal-bottom.on');
    if(openModal){openModal.classList.remove('on');history.pushState({view:'home'},'','');return;}
    // 서브뷰: 유형 세부통계
    if(document.getElementById('v-type-detail').classList.contains('on')){
      showV('v-rescue-stats');renderRescueStats();history.pushState({view:'rescue-stats'},'','');return;
    }
    // v-report(구조 타임라인) → 목록으로 복귀
    if(document.getElementById('v-report').classList.contains('on')){
      // 작성 중(미저장 입력 있음)이면 이탈 경고 — 취소 시 폼에 머무름
      if(window._reportMode==='form'&&_formDirty){
        if(!confirm('작성 중인 내용이 저장되지 않았습니다.\n나가시겠습니까? (임시저장본은 보관됩니다)')){
          history.pushState({view:'rescue-report'},'','');return; // 머무르기
        }
        try{_saveDraftNow();}catch(e){}
      }
      window._reportMode='';clearInterval(_draftAutoTimer);
      _hideRepFooter();
      showV('v-rescue-list');renderResList();
      document.getElementById('appHdr').style.display='block';
      document.getElementById('topTitle').textContent='재난/구조 관리';
      var _bn=document.getElementById('bnav');_bn.style.display='flex';
      [1,2,3].forEach(function(i){document.getElementById('nv'+i).classList.remove('on');});
      document.getElementById('nv2').classList.add('on');
      history.pushState({view:'rescue'},'','');
      return;
    }
    var homeActive=document.getElementById('v-home').classList.contains('on');
    if(!homeActive){
      // 다른 화면 → 홈으로
      try{_zoneOverlayCleanup();}catch(e){} // 구역 범례·카드·위치조정 패널이 홈에 남지 않게(편집 중이면 드래그 잠금도 해제)
      showV('v-home');
      document.getElementById('appHdr').style.display='none';
      document.getElementById('bnav').style.display='none';
      closeDB();updateSummary();
      history.pushState({view:'home'},'','');
    } else {
      // 홈 화면: 항상 home 상태를 다시 push해서 앱 밖으로 절대 못 나가게
      history.pushState({view:'home'},'','');
      var isNative=window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform();
      var isPWA=window.matchMedia('(display-mode: standalone)').matches||!!window.navigator.standalone;
      if(_backExitReady){
        clearTimeout(_backExitTimer);_backExitReady=false;
        _exitApp();
      } else {
        _backExitReady=true;
        toast((isNative||isPWA)?'한 번 더 누르면 종료됩니다':'종료하려면 탭을 닫으세요');
        _backExitTimer=setTimeout(function(){_backExitReady=false;},2000);
      }
    }
  });
  // 앱 시작: guard + home 두 개 push → 뒤로가기가 앱 밖으로 절대 이탈 안 함
  history.pushState({view:'_guard_'},'','');
  history.pushState({view:'home'},'','');

  // ── 권한 배너 ──────────────────────────────────
  function _permBanner(type,state){
    var wrap=document.getElementById('permBanners');if(!wrap)return;
    var id='pb-'+type;var old=document.getElementById(id);if(old)old.remove();
    if(state==='granted'){localStorage.setItem('_permOk_'+type,'1');return;}
    if(localStorage.getItem('_permOk_'+type)==='1')return;
    if(state==='denied')localStorage.removeItem('_permOk_'+type);
    var cfg=type==='loc'
      ?{ico:'📍',title:'위치 권한',desc:state==='denied'?'설정에서 위치 권한을 허용해 주세요':'지도 GPS 기능을 위해 위치 접근 허용'}
      :{ico:'🔔',title:'알림 권한',desc:state==='denied'?'설정에서 알림 권한을 허용해 주세요':'구조 발생 시 알림 수신 허용'};
    var div=document.createElement('div');
    div.id=id;
    div.style.cssText='display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:9px;padding:8px 10px;flex-shrink:0;';
    div.innerHTML='<span style="font-size:15px;">'+cfg.ico+'</span>'
      +'<div style="flex:1;min-width:0;">'
        +'<div style="font-size:11px;font-weight:700;color:#3182f6;">'+cfg.title+'</div>'
        +'<div style="font-size:10px;color:#454e5a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+cfg.desc+'</div>'
      +'</div>'
      +(state!=='denied'?'<button onclick="_reqPerm(\''+type+'\')" style="flex-shrink:0;background:#1a3d5c;color:#3182f6;border:1px solid rgba(255,255,255,.3);border-radius:6px;padding:5px 11px;font-size:10px;font-weight:700;cursor:pointer;">허용</button>':'')
      +'<button onclick="document.getElementById(\'pb-'+type+'\').remove()" style="flex-shrink:0;background:none;border:none;color:rgba(255,255,255,.2);font-size:16px;line-height:1;cursor:pointer;padding:0 2px;">×</button>';
    wrap.appendChild(div);
  }
  function _initPermBanners(){
    // 위치 권한
    if(navigator.permissions){
      navigator.permissions.query({name:'geolocation'}).then(function(r){
        _permBanner('loc',r.state);
        r.onchange=function(){_permBanner('loc',r.state);};
      }).catch(function(){_permBanner('loc','prompt');});
    } else if(navigator.geolocation){
      _permBanner('loc','prompt');
    }
    // 알림 권한 (지원하는 경우만)
    if('Notification' in window){
      _permBanner('noti',Notification.permission);
    }
  }
  window._reqPerm=function(type){
    if(type==='loc'){
      navigator.geolocation.getCurrentPosition(
        function(){toast('📍 위치 권한 허용됨');_permBanner('loc','granted');},
        function(){toast('⚠️ 위치 권한이 거부되었습니다');},
        {enableHighAccuracy:true,timeout:15000}
      );
    } else if(type==='noti'){
      if(typeof Notification==='undefined'){toast('이 브라우저는 알림을 지원하지 않습니다');return;}
      Notification.requestPermission().then(function(r){
        _permBanner('noti',r);
        toast(r==='granted'?'🔔 알림 권한 허용됨':'⚠️ 알림 권한이 거부되었습니다');
        if(r==='granted') _initFCM();
      });
    }
  };
  setTimeout(_initPermBanners, 800); // 앱 로딩 후 표시

  // 야외 고대비 모드 복원
  if(localStorage.getItem('_hiContrast')){document.body.classList.add('hi-contrast');var _hb=document.getElementById('hiContrastBtn');if(_hb)_hb.style.opacity='1';}

  // ── Service Worker 등록 (PWA 오프라인 + FCM 백그라운드 알림) ──
  if('serviceWorker' in navigator){
    var _hadController=!!navigator.serviceWorker.controller; // 첫 설치(claim)와 '업데이트'를 구분
    navigator.serviceWorker.register('sw.js').then(function(reg){
      _swReg=reg;
      if('Notification' in window&&Notification.permission==='granted') _initFCM();
      try{var _up=reg.update();if(_up&&_up.catch)_up.catch(function(){});}catch(e){} // 새 버전 즉시 확인(업데이트 실패 시 조용히 — iOS 'sw.js load failed' 미처리거부 방지)
      // 켜둔 채로도 새 배포가 스스로 적용되도록: 복귀 시 + 30분마다 확인(새 버전이면 1회 자동 새로고침)
      var _swChk=function(){try{var u=reg.update();if(u&&u.catch)u.catch(function(){});}catch(e){}};
      setInterval(_swChk,1800000);
      document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')_swChk();});
    }).catch(function(){});
    // 새 서비스워커가 활성화(업데이트)되면 새로고침해 적용 → '며칠 전 버전에 멈춤' 방지(자가치유).
    // 단, 작성 중(입력 포커스·1보 폼·보고서 작성)에 바로 새로고침하면 입력을 잃으므로
    // 손을 뗄 때까지 미뤘다가 적용(유휴 5초 간격 확인 + 화면 이탈 시 즉시)
    navigator.serviceWorker.addEventListener('controllerchange',function(){
      if(!_hadController||window._swReloaded)return; // 첫 설치는 새로고침 안 함(루프 방지)
      window._swReloaded=true;
      var _done=false;var _go=function(){if(_done)return;_done=true;location.reload();};
      var _busyNow=function(){
        try{
          var ae=document.activeElement;
          if(ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'))return true;
          var nr=document.getElementById('v-newres');if(nr&&nr.classList.contains('on'))return true; // 1보 작성 중
          if(window._reportMode==='write')return true; // N보/보고서 작성 중
          var tn=document.getElementById('tlRecNote'),tc=document.getElementById('tlRecCustom');
          if((tn&&tn.value)||(tc&&tc.value))return true; // 기록카드 임시 입력 보호
        }catch(e){}
        return false;
      };
      if(!_busyNow()){_go();return;}
      try{toast('⬆️ 새 버전이 준비됐어요 — 입력이 끝나면 자동 적용됩니다');}catch(e){}
      var t=setInterval(function(){if(!_busyNow()){clearInterval(t);_go();}},5000);
      document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'){try{clearInterval(t);}catch(e){}_go();}});
    });
  }
  try{_otaInit();}catch(e){} // APK 자체 업데이트(OTA) 확인
  // 네이티브(APK): 알림 권한 먼저 요청 → 끝난 뒤 위치 권한 요청 (시스템 다이얼로그가 겹치지 않도록 순차 실행)
  Promise.resolve(_initNativePush()).catch(function(){}).then(function(){return _initNativeLocationPerm();}).catch(function(){});

  initFirebase(function(){
    initDB();
    updateSummary();updateUserUI();
    const d=new Date();const days=['일','월','화','수','목','금','토'];
    document.getElementById('homeDate').textContent=d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일 ('+days[d.getDay()]+')';
    // ── 로그인/홈 화면을 먼저 띄운다(체감 속도 개선) ──
    // 지도 2개 생성·날씨·특보폴링 등 무거운 초기화가 로딩화면을 붙잡던 것을 첫 페인트 뒤로 미룬다.
    if(window._kakaoAuthCode){var _kc=window._kakaoAuthCode;window._kakaoAuthCode=null;_handleKakaoCode(_kc);} // 토큰 교환이 로딩화면 해제 담당
    else if(window._hideLoading) window._hideLoading();
    setTimeout(function(){
      // 저장소 영속화 요청 — 승인되면 브라우저가 공간 부족 시에도 타일 캐시·데이터를 임의 삭제하지 않음(웹 오프라인 지도 보존)
      try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(function(){});}catch(e){}
      // 웹 방문자: ota.json(같은 서버라 항상 성공)을 Firestore에 미러 — github이 막힌 망의 APK가 이걸로 업데이트 확인
      try{
        if(!_isNativeApp())setTimeout(function(){
          fetch('ota.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.json();}).then(function(m){
            if(!(m&&m.version&&m.url))return;
            if(typeof _authReady==='undefined'||!_authReady)return; // 인증 전 쓰기 금지(동기화 대기 방지)
            var cur=DB.g('otaInfo');
            if(!cur||_otaCmp(m.version,cur.version)>0)DB.s('otaInfo',{version:m.version,url:m.url,notes:m.notes||'',at:Date.now()});
          }).catch(function(){});
        },6000);
      }catch(e){}
      try{if(window._KR){initMaps();}else{window._KCB=function(){initMaps();};}}catch(e){}
      try{fetchWeather();}catch(e){}
      try{setTimeout(_autoApplyCoordFix,3500);}catch(e){} // 표지판 좌표 자동 최신화(1회)
      try{_initSosWatch();}catch(e){} // 🆘 조난·사고자 위치 실시간 구독
      try{setTimeout(_autoPreloadParkTiles,25000);}catch(e){} // 🗺️ 설악산 타일 자동 미리받기(7일마다, 요금 배려) — 깜빡임 없는 지도
      // 위험상황 비활성화: 정적 버튼(지도 FAB·통계 탭) 숨김
      try{if(typeof _HAZ_OFF!=='undefined'&&_HAZ_OFF){['hazFab','rsTabHaz'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none';});}}catch(e){}
      // 스켈레톤 안전장치: 12초가 지나도 동기화·날씨가 안 오면(오프라인 등) 자리표시를 정리해 영원히 반짝이지 않게
      try{setTimeout(function(){
        if(!window._dbFirstReady){window._dbFirstReady=true;try{renderHomeActive();}catch(e){}}
        var wt=document.getElementById('wTmp');
        if(wt&&wt.classList.contains('skl')){var ws=document.getElementById('weatherStrip');if(ws)ws.style.display='none';}
      },12000);}catch(e){}
      try{if('Notification' in window&&Notification.permission==='granted') _initFCM();}catch(e){} // FCM 토큰 갱신
      try{_flushFcmToken();}catch(e){} // 네이티브 토큰이 Firebase 준비 전 등록됐으면 지금 저장
      if(/[?&]board=1/.test(location.search))setTimeout(openBoard,300); // ?board=1 → 상황판
    },0);
  });
};

