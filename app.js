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
    document.getElementById('settingsInfoWrap').innerHTML=`
      <div class="scard" style="margin-bottom:8px;">
        <div class="stitle">👤 내 계정</div>
        <div style="font-size:12px;color:#b8d4e8;line-height:2.0;">이름: <b>${_esc(u.realName||u.name||'미설정')}</b><br>소속: <b>${_esc(u.dept||'미설정')}</b><br>직위: <b>${_esc(u.rank||'미설정')}</b>${u.kakaoId?`<br><span style="color:#4a7090;font-size:10px;">카카오ID: ${_esc(u.kakaoId)}</span>`:''}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px;margin-bottom:8px;">
          <div style="font-size:11px;color:${u.approvalStatus==='approved'?'#7ec8a0':'#e67e22'};">● ${u.approvalStatus==='approved'?'승인됨':'승인 대기'}</div>
        </div>
        <button onclick="openChangeUser()" style="width:100%;background:#1a4a6e;color:#fff;border:none;padding:9px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">✏️ 계정 수정</button>
      </div>
      <div class="scard" style="margin-bottom:8px;">
        <div class="stitle">💬 카카오 로그인</div>
        ${(()=>{if(u.kakaoImg||u.kakaoId){return`<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><img src="${_esc(_imgHttps(u.kakaoImg||''))}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;background:#1a3a5a;" onerror="this.style.display='none'"><div style="font-size:12px;color:#b8d4e8;"><b style="color:#e0edf8;">${_esc(u.name||'')}</b> 님으로 연결됨</div></div><button onclick="kakaoLogout()" style="width:100%;background:rgba(255,80,80,.12);color:#ff8a80;border:1px solid rgba(255,80,80,.25);padding:9px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;margin-bottom:6px;">🚪 카카오 로그아웃</button><button onclick="withdrawAccount()" style="width:100%;background:rgba(180,20,20,.12);color:#cc4444;border:1px solid rgba(180,20,20,.25);padding:8px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;">🗑️ 회원탈퇴</button>`;}return`<div style="font-size:11px;color:#7a9cb8;margin-bottom:8px;">카카오 계정으로 로그인하면 작성자 정보가 자동 설정됩니다.</div><button onclick="kakaoLogin()" style="width:100%;background:rgba(254,229,0,.18);color:#f0d900;border:1px solid rgba(254,229,0,.3);padding:9px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">💬 카카오로 로그인</button>`;})()}
      </div>
      <div class="scard" style="margin-bottom:8px;">
        <div class="stitle">🔄 앱 업데이트</div>
        <div style="font-size:11px;color:#7a9cb8;margin-bottom:8px;">현재 버전 <b style="color:#cfe2f2;">${OTA_VER}</b> · 앱은 재설치 없이 최신으로 자체 업데이트됩니다. (웹은 새로고침 시 자동)</div>
        <button onclick="_otaCheck(true)" style="width:100%;padding:11px;border-radius:8px;border:1px solid rgba(79,168,208,.4);background:rgba(79,168,208,.12);color:#4fa8d0;font-size:13px;font-weight:700;cursor:pointer;">🔄 업데이트 확인 / 적용</button>
      </div>
      <a href="https://github.com/109yoon/seoraksan/releases/latest" target="_blank" style="display:flex;align-items:center;gap:10px;background:#0b1c30;border:1px solid rgba(79,168,208,.18);border-radius:10px;padding:11px 13px;text-decoration:none;flex-shrink:0;">
        <span style="font-size:18px;">📱</span>
        <div style="flex:1;"><div style="font-size:12px;font-weight:700;color:#e0edf8;">안드로이드 APK 다운로드</div><div style="font-size:10px;color:#3a6a8a;margin-top:1px;">최신 빌드 받기 (GitHub Releases)</div></div>
        <span style="font-size:11px;color:#4fa8d0;">↗</span>
      </a>`;
  } else {
    const s=_ensureNotiDefaults();
    const allOn=NOTI_GROUPS.every(g=>g.items.every(it=>s[it.k]!==false));
    document.getElementById('settingsNotiWrap').innerHTML=`
      <div class="scard">
        <div class="stitle" style="display:flex;align-items:center;justify-content:space-between;">🔔 알림 설정
          <button onclick="togNotiAll(${allOn?'false':'true'})" style="font-size:10px;font-weight:700;background:rgba(79,168,208,.12);color:#4fa8d0;border:1px solid rgba(79,168,208,.3);border-radius:7px;padding:4px 9px;cursor:pointer;">${allOn?'전체 끄기':'전체 켜기'}</button>
        </div>
        <div class="tog-sub" style="margin:-4px 0 10px;color:#5a7e98;">📵 끈 항목은 앱 알림·OS 푸시 모두 차단됩니다. '(앱 내만)' 항목은 끄지 않아도 OS 푸시는 가지 않습니다.</div>
        ${NOTI_GROUPS.map(g=>`
          <div style="font-size:11px;font-weight:800;color:#6a94b0;letter-spacing:.4px;margin:14px 0 4px;border-top:1px solid rgba(255,255,255,.05);padding-top:10px;">${g.title}</div>
          ${g.items.map(it=>`<div class="tog-row"><div><div class="tog-lbl">${it.l}${it.push===false?' <span style="font-size:9px;color:#4a7090;font-weight:600;">(앱 내만)</span>':''}</div><div class="tog-sub">${it.sub}</div></div><div class="toggle ${s[it.k]!==false?'on':'off'}" onclick="togNotiSet('${it.k}',this)"></div></div>`).join('')}
        `).join('')}
      </div>`;
  }
}
function togNotiSet(k,el){const s=DB.g('notiSetting')||{};const cur=s[k]!==false;s[k]=!cur;DB.s('notiSetting',s);el.className='toggle '+(!cur?'on':'off');_updateFcmTokenSettings();toast(!cur?'✅ 알림 켜짐':'🔕 꺼짐');}
function togNotiAll(on){const s=DB.g('notiSetting')||{};NOTI_GROUPS.forEach(g=>g.items.forEach(it=>{s[it.k]=on;}));DB.s('notiSetting',s);_updateFcmTokenSettings();renderSettings();toast(on?'✅ 전체 알림 켜짐':'🔕 전체 알림 꺼짐');}

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
    _ensuringMember=true;
    // 1) Kakao SDK가 들고 있는 토큰 또는 저장된 access_token으로 시도
    var at='';
    try{at=(window.Kakao&&Kakao.Auth&&Kakao.Auth.getAccessToken())||'';}catch(e){}
    if(!at)at=localStorage.getItem('_kkAT')||'';
    if(at){var mr=await _signInWithKakaoToken(at);if(mr&&mr.token){_ensuringMember=false;return true;}}
    // 2) access_token 만료 → refresh_token으로 새 토큰 발급 후 재시도
    var rt=localStorage.getItem('_kkRT')||'';
    if(rt){
      var nat=await _refreshKakaoToken(rt);
      if(nat){var mr2=await _signInWithKakaoToken(nat);if(mr2&&mr2.token){_ensuringMember=false;return true;}}
    }
    _ensuringMember=false;
    // 멤버 승급 실패 → 미승인/만료. 프로필 완료 상태면 대기 게이트로 차단.
    try{_enforceAccessGate();}catch(e){}
    if(!window._memberAuthWarned){window._memberAuthWarned=true;
      setTimeout(function(){try{toast('⚠️ 저장 권한이 만료되었습니다 — 카카오 재로그인이 필요합니다(데이터는 보존됨)');}catch(e){}},2500);
    }
    return false;
  }catch(e){_ensuringMember=false;return false;}
}
// 로그인 이력 기록 (허용목록 관리 UI에서 직원을 골라 추가할 수 있도록 kakaoId+이름 수집)
function _recordLoginLog(){
  try{
    const u=DB.g('currentUser')||{};
    const kid=u.kakaoId||_authKakaoId;
    if(!kid)return;
    const log=(DB.g('loginLog')||[]).slice();
    const entry={kakaoId:String(kid),name:u.realName||u.name||'',dept:u.dept||'',rank:u.rank||'',at:Date.now()};
    const i=log.findIndex(e=>String(e.kakaoId)===String(kid));
    if(i>=0)log[i]=entry; else log.push(entry);
    log.sort((a,b)=>(b.at||0)-(a.at||0));
    DB.s('loginLog',log.slice(0,300)); // 최근 300명 유지
  }catch(e){}
}
// 카카오 로그인 리다이렉트 URI: 네이티브 앱은 자기 출처(https://localhost)로 되돌려받아
// 앱 안에서 로그인을 끝낸다(웹페이지로 이탈 → 하얀화면 방지). 웹은 기존 깃헙페이지 경로.
function _kakaoRedirectUri(){
  return (typeof _isNativeApp==='function'&&_isNativeApp()) ? 'https://localhost' : 'https://109yoon.github.io/seoraksan/';
}
function kakaoLogin(){
  if(!window.Kakao||!Kakao.isInitialized()){toast('⚠️ 카카오 SDK 오류');return;}
  // throughTalk:true → 휴대폰에 카카오톡이 깔려 있으면 앱이 켜지며 간편 로그인(이메일·비번 입력 불필요).
  //   앱 없거나 PC면 SDK가 자동으로 웹 로그인으로 폴백. 'prompt:login' 같은 강제 재입력 옵션은 두지 않음.
  // 네이티브 APK는 방금 안정화한 https://localhost 복귀 흐름을 유지하기 위해 throughTalk를 끔(카톡 앱 왕복은
  //   커스텀스킴/네이티브키 추가 설정이 필요해 추후 별도 작업).
  var _native=(typeof _isNativeApp==='function'&&_isNativeApp());
  Kakao.Auth.authorize({redirectUri:_kakaoRedirectUri(),throughTalk:!_native});
}
function _handleKakaoCode(code,redirectUri){
  var _uri=redirectUri||_kakaoRedirectUri();
  window._needsCode=true; // 동기적으로 먼저 세팅 (checkAuth 타이밍 충돌 방지)
  var _kakaoAccessTok=''; // 서버 검증(커스텀 토큰 발급)에 쓸 카카오 access_token 보관
  fetch('https://kauth.kakao.com/oauth/token',{
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded;charset=utf-8'},
    body:'grant_type=authorization_code&client_id='+KAKAO_KEY+'&redirect_uri='+encodeURIComponent(_uri)+'&code='+encodeURIComponent(code)
  })
  .then(function(r){return r.json();})
  .then(function(tok){
    if(!tok.access_token)throw new Error(tok.error_description||'토큰 오류');
    _kakaoAccessTok=tok.access_token;
    // 토큰 보관: 재방문(앱 재시작) 시 재로그인 없이 member 토큰 자동 재발급에 사용
    try{localStorage.setItem('_kkAT',tok.access_token);if(tok.refresh_token)localStorage.setItem('_kkRT',tok.refresh_token);}catch(e){}
    if(window.Kakao&&Kakao.Auth)Kakao.Auth.setAccessToken(tok.access_token);
    return fetch('https://kapi.kakao.com/v2/user/me',{headers:{Authorization:'Bearer '+tok.access_token}});
  })
  .then(function(r){return r.json();})
  .then(function(res){
    var u=DB.g('currentUser')||{};
    var prof=(res.kakao_account&&res.kakao_account.profile)||{};
    var kakaoId=String(res.id);
    // deletedKakaoIds에서 제거
    var deletedIds=DB.g('deletedKakaoIds')||[];
    if(deletedIds.includes(kakaoId)){
      DB.s('deletedKakaoIds',deletedIds.filter(function(id){return id!==kakaoId;}));
    }
    // 서버에 저장된 내 프로필(이름·부서·계급) 복원 — localStorage가 비어도 재입력 불필요(카카오 재로그인만으로 복구)
    var _roster=[].concat(DB.g('pendingUsers')||[],DB.g('approvedUsers')||[]);
    var _saved=_roster.find(function(x){return x&&String(x.kakaoId||x.id)===kakaoId;})||{};
    var merged=Object.assign({},u,{
      kakaoId:kakaoId,
      kakaoImg:_imgHttps(prof.profile_image_url||prof.thumbnail_image_url||''),
      realName:u.realName||_saved.realName||'',
      name:u.name||_saved.name||_saved.realName||prof.nickname||'',
      dept:u.dept||_saved.dept||'',
      rank:u.rank||_saved.rank||''
    });
    DB.s('currentUser',merged);
    DB.s('authType','kakao');
    // 서버 검증 → Firebase 커스텀 토큰 로그인 (허용목록 기반 접근권한 부여)
    _signInWithKakaoToken(_kakaoAccessTok).then(function(mr){
      if(mr&&mr.error==='not_allowed'){
        setTimeout(function(){try{toast('⚠️ 접근 권한이 없습니다. 관리자에게 등록을 요청하세요 (내 ID: '+(mr.kakaoId||'?')+')');}catch(e){}},1200);
      }
      try{_recordLoginLog();}catch(e){}
      try{updateUserUI();}catch(e){}
      // 프로필이 이미 있으면 즉시 게이트 판정(미승인이면 대기 화면). 프로필 미완이면 입력 후 판정.
      try{var cu=DB.g('currentUser')||{};if(cu.dept&&cu.rank&&(cu.realName||cu.name))_enforceAccessGate();}catch(e){}
    });
    if(window._hideLoading)window._hideLoading();
    if(window.hideLoginScreen)window.hideLoginScreen();
    updateUserUI();
    toast('✅ 카카오 로그인 완료');
    // 소속·직위·이름이 이미 저장돼 있으면(재로그인) 다시 입력받지 않음
    if(!merged.dept||!merged.rank||!(merged.realName||merged.name)){
      window._requireProfile=true;
      setTimeout(function(){openChangeUser();},300);
    } else {
      window._needsCode=false;
    }
  })
  .catch(function(e){
    if(window._hideLoading)window._hideLoading();
    toast('⚠️ 카카오 로그인 실패: '+e.message);
  });
}
function kakaoLogout(){
  window._needsCode=false;window._requireProfile=false;
  DB.s('currentUser',{});
  DB.s('authType','');
  // 커스텀 토큰 세션·역할 정리 → 익명 인증으로 복귀
  localStorage.removeItem('_tokenAdmin');_authRole='';_authKakaoId='';
  try{localStorage.removeItem('_kkAT');localStorage.removeItem('_kkRT');localStorage.removeItem('_memberOk');window._memberAuthWarned=false;}catch(e){}
  var _g=document.getElementById('approvalGate');if(_g)_g.style.display='none';
  try{firebase.auth().signOut();}catch(e){}
  if(window.showLoginScreen)window.showLoginScreen();
  updateUserUI();
  try{renderSettings();}catch(e){}
  toast('로그아웃 됐습니다');
}
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
  if(u.dept&&u.rank&&(u.realName||u.name))return true; // 이미 완성
  var src=(DB.g('pendingUsers')||[]).find(function(p){return String(p.kakaoId||p.id)===kakaoId&&(p.dept||p.rank);})
        ||(DB.g('loginLog')||[]).find(function(e){return String(e.kakaoId)===kakaoId&&(e.dept||e.rank);});
  if(!src)return false;
  var merged=Object.assign({},u,{
    realName:u.realName||src.realName||src.name||'',
    name:u.name||src.name||src.realName||'',
    dept:u.dept||src.dept||'',
    rank:u.rank||src.rank||''
  });
  DB.s('currentUser',merged);
  return !!(merged.dept&&merged.rank&&(merged.realName||merged.name));
}
function _checkAndRequireProfile(){
  var authType=_resolveAuthType();
  if(!authType)return;
  if(authType==='external')return; // 외부기관: 프로필 입력 불필요
  var u=DB.g('currentUser')||{};
  var isKakao=authType==='kakao';
  if(isKakao){
    if(window._needsCode)return; // _handleKakaoCode가 처리 중 — 간섭 금지
    // 프로필 미완성이면 먼저 서버 기록에서 복원 시도, 그래도 없을 때만 입력 요구
    if(!u.dept||!u.rank||!(u.realName||u.name)){
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
  if(!u.dept||!u.rank){
    window._requireProfile=true;setTimeout(function(){openChangeUser();},300);
  }
}

var _weatherFetched=false;
var KMA_KEY='S3Nk1fdqSpqzZNX3anqaWA';
var KMA_BASE='https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstInfoService_2.0';
// 지역별 KMA 격자 좌표
var _WEATHER_REGIONS=[
  {name:'속초',nx:87,ny:141},
  {name:'인제',nx:73,ny:132},
  {name:'양양',nx:79,ny:138},
  {name:'고성',nx:83,ny:146},
  {name:'설악',nx:80,ny:140}
];
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
function _fetchKma(url,asText){
  var read=function(r){if(!r||!r.ok)throw new Error('http '+(r&&r.status));return asText?r.text():r.json();};
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
    return fetch(chain[i]).then(read).catch(function(){return go(i+1);});
  };
  return go(0);
}
function _parsePCP(v){if(!v||v==='강수없음')return 0;if(v.includes('미만'))return 0.5;var n=parseFloat(v);return isNaN(n)?0:n;}
function _ptyInfo(pty){var p=parseInt(pty||0);return{ico:p===0?'☀️':p===1||p===4?'🌧️':p===2?'🌨️':p===3?'❄️':'🌤️',desc:['맑음','비','비/눈','눈','소나기'][p]||'맑음'};}
function _skyIco(sky,pty){var p=parseInt(pty||0);if(p===1||p===4)return'🌧️';if(p===2)return'🌨️';if(p===3)return'❄️';var s=parseInt(sky||1);return s===1?'☀️':s===3?'⛅':s===4?'☁️':'🌤️';}
// 기상특보 텍스트 파싱 (wrn_now_data_new.php disp=1 응답)
var _kmaWrnCache=null;
var _kmaWrnCacheAt=0; // 기상특보 캐시 시각 — 구조 상황에선 발효/해제가 빨라 오래된 특보를 재사용하면 위험
var _KMA_WRN_TTL=900000; // 15분
function _parseKmaWarnings(txt){
  var alertMap={};
  _kmaWrnCache=txt;
  _kmaWrnCacheAt=Date.now();
  if(!txt||typeof txt!=='string')return alertMap;
  var gangwon=['속초','고성','양양','인제','영동','강원','산지'];
  var wrnTypes=['호우','강풍','대설','태풍','폭풍해일','한파','폭염','풍랑','건조'];
  txt.split('\n').forEach(function(line){
    var l=line.trim();
    if(!l||l.startsWith('#'))return;
    // 헤더 행 건너뜀
    if(/^[A-Z_,\s]+$/.test(l))return;
    var hasWrn=wrnTypes.some(function(t){return l.includes(t);});
    if(!hasWrn)return;
    var hasArea=gangwon.some(function(k){return l.includes(k);});
    if(!hasArea)return;
    var wrnType='';
    wrnTypes.forEach(function(t){if(!wrnType&&l.includes(t))wrnType=t;});
    var level=l.includes('경보')&&!l.includes('주의보경보')?'경보':(l.includes('주의보')?'주의보':'');
    if(!wrnType||!level)return;
    // 지역명 추출
    var rName='강원 영동';
    ['영동북부','영동남부','영동중부','영동','속초','고성','양양','인제','산지'].forEach(function(k){if(l.includes(k))rName=k;});
    if(!alertMap[rName])alertMap[rName]={level:level,reasons:[]};
    if(level==='경보')alertMap[rName].level='경보';
    var reason=wrnType+(level==='경보'?'경보':'주의보');
    if(alertMap[rName].reasons.indexOf(reason)===-1)alertMap[rName].reasons.push(reason);
  });
  return alertMap;
}
function fetchWeather(){
  if(_weatherFetched)return;
  _weatherFetched=true;
  var dt=_kmaNCSTTime(),vt=_kmaVsrtTime();
  // 초단기실황: 기온·풍속·강수형태
  var ncstUrl=KMA_BASE+'/getUltraSrtNcst?authKey='+KMA_KEY+'&dataType=JSON&numOfRows=10&pageNo=1&baseDate='+dt.date+'&baseTime='+dt.time+'&nx=87&ny=141';
  // 초단기예보: SKY(하늘상태)·LGT(낙뢰)
  var vsrtUrl=KMA_BASE+'/getUltraSrtFcst?authKey='+KMA_KEY+'&dataType=JSON&numOfRows=60&pageNo=1&baseDate='+vt.date+'&baseTime='+vt.time+'&nx=87&ny=141';
  // 기상특보현황 (실시간 발효 특보)
  var wrnUrl='https://apihub.kma.go.kr/api/typ01/url/wrn_now_data_new.php?authKey='+KMA_KEY+'&disp=1';
  Promise.all([
    _fetchKma(ncstUrl,false),
    _fetchKma(vsrtUrl,false).catch(function(){return null;}),
    _fetchKma(wrnUrl,true).catch(function(){return '';})
  ]).then(function(results){
    var ncst=results[0],vsrt=results[1],wrnTxt=results[2];
    var ncstOk=ncst&&ncst.response&&ncst.response.header&&ncst.response.header.resultCode==='00';
    if(!ncstOk){_fetchWeatherFallback(wrnTxt);return;}
    // 실황 파싱
    var obs={};
    _kmaItems(ncst).forEach(function(it){obs[it.category]=it.obsrValue;});
    var temp=parseFloat(obs.T1H||0);
    var wspd=parseFloat(obs.WSD||0);
    var pty=parseInt(obs.PTY||0);
    // SKY from 초단기예보
    var sky=1;
    if(vsrt&&vsrt.response&&vsrt.response.header&&vsrt.response.header.resultCode==='00'){
      var skyItem=_kmaItems(vsrt).find(function(it){return it.category==='SKY';});
      if(skyItem)sky=parseInt(skyItem.fcstValue||1);
    }
    // LGT(낙뢰) 확인
    var lgt=false;
    if(vsrt&&vsrt.response&&vsrt.response.header&&vsrt.response.header.resultCode==='00'){
      var lgtItem=_kmaItems(vsrt).find(function(it){return it.category==='LGT'&&it.fcstValue!=='0';});
      if(lgtItem)lgt=true;
    }
    // 아이콘 결정: PTY > LGT > SKY 순
    var ico,desc;
    if(pty===1||pty===4){ico='🌧️';desc=pty===4?'소나기':'비';}
    else if(pty===2){ico='🌨️';desc='비/눈';}
    else if(pty===3){ico='❄️';desc='눈';}
    else if(lgt){ico='⛈️';desc='낙뢰';}
    else{ico=sky===1?'☀️':sky===3?'⛅':sky===4?'☁️':'🌤️';desc=sky===1?'맑음':sky===3?'구름많음':sky===4?'흐림':'맑음';}
    document.getElementById('wIco').textContent=ico;
    document.getElementById('wTmp').textContent=(isNaN(temp)?'--':Math.round(temp))+'°';
    document.getElementById('wDesc').textContent='속초 · '+desc;
    document.getElementById('wWind').textContent='💨 '+Math.round(wspd)+'m/s';
    var ws=document.getElementById('weatherStrip');if(ws)ws.style.display='flex';
    // 실제 기상특보 (기상청 발효 특보)
    var alertMap=_parseKmaWarnings(wrnTxt||'');
    _renderWeatherAlerts(alertMap);
  }).catch(function(e){
    console.warn('KMA 오류, 폴백:',e);
    _weatherFetched=false; // 폴백도 실패할 수 있으니 재시도 가능하도록 해제
    _fetchWeatherFallback();
  });
}
// ── 기상특보 주기적 재조회 (운영 중 실시간 자동 발령) ──
var _kmaWarnPollTimer=null;
function _pollKmaWarnings(){
  if(document.visibilityState&&document.visibilityState!=='visible')return; // 백그라운드면 생략
  var url='https://apihub.kma.go.kr/api/typ01/url/wrn_now_data_new.php?authKey='+KMA_KEY+'&disp=1';
  _fetchKma(url,true).then(function(txt){
    if(typeof txt==='string')_renderWeatherAlerts(_parseKmaWarnings(txt),false); // 공식 특보 → _syncAutoAlerts 자동 발령
  }).catch(function(){});
}
function _startKmaWarnPoll(){
  if(_kmaWarnPollTimer)return;
  _kmaWarnPollTimer=setInterval(_pollKmaWarnings,600000); // 10분마다
  // 앱이 다시 포그라운드로 오면 즉시 1회 재조회 (백그라운드 중 발효된 특보 즉시 반영)
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')_pollKmaWarnings();});
}
function _fetchWeatherFallback(realWrnTxt){
  // KMA CORS 차단 시 open-meteo로 폴백 (기온만; 특보는 typ01 실데이터가 있으면 그걸 우선)
  var base='https://api.open-meteo.com/v1/forecast';
  var cur=base+'?latitude=38.21&longitude=128.59&current=temperature_2m,wind_speed_10m,weather_code&wind_speed_unit=ms&timezone=Asia%2FSeoul';
  var reg=_WEATHER_REGIONS.map(function(r){
    // latitude/longitude from nx/ny approximation for fallback
    var coords={87:{lat:38.21,lng:128.59},73:{lat:38.06,lng:128.17},79:{lat:38.08,lng:128.62},83:{lat:38.38,lng:128.47},80:{lat:38.13,lng:128.41}};
    var c=coords[r.nx]||{lat:38.13,lng:128.41};
    return base+'?latitude='+c.lat+'&longitude='+c.lng+'&hourly=precipitation,snowfall,windgusts_10m,wind_speed_10m&wind_speed_unit=ms&timezone=Asia%2FSeoul&forecast_hours=24';
  });
  Promise.all([fetch(cur).then(function(r){return r.json();})].concat(reg.map(function(u){return fetch(u).then(function(r){return r.json();});})))
    .then(function(results){
      var cw=(results[0].current||results[0].current_weather||{});
      var code=cw.weather_code!==undefined?cw.weather_code:(cw.weathercode||0);
      var temp=cw.temperature_2m!==undefined?cw.temperature_2m:cw.temperature;
      var wspd=cw.wind_speed_10m!==undefined?cw.wind_speed_10m:cw.windspeed;
      var ico=code===0?'☀️':code<=2?'🌤️':code===3?'☁️':code<=48?'🌫️':code<=55?'🌦️':code<=65?'🌧️':code<=77?'🌨️':code<=82?'🌧️':code<=86?'🌨️':'⛈️';
      var descs=['맑음','대체로맑음','구름조금','흐림','안개','이슬비','비','눈','소나기','뇌우'];
      var desc=descs[code===0?0:code<=1?1:code<=2?2:code<=3?3:code<=48?4:code<=55?5:code<=65?6:code<=77?7:8]||'';
      document.getElementById('wIco').textContent=ico;
      document.getElementById('wTmp').textContent=(isNaN(temp)?'--':Math.round(temp))+'°';
      document.getElementById('wDesc').textContent='속초 · '+desc;
      document.getElementById('wWind').textContent='💨 '+Math.round(wspd)+'m/s';
      var ws=document.getElementById('weatherStrip');if(ws)ws.style.display='flex';
      var rNames=['속초','인제','양양','고성','설악'];
      var alertMap={};
      results.slice(1).forEach(function(d,i){
        var h=d.hourly||{};
        var precip=h.precipitation||[];var snow=h.snowfall||[];var gust=h.windgusts_10m||[];var wind=h.wind_speed_10m||[];
        var s12p=precip.slice(0,12).reduce(function(a,b){return a+b;},0);
        var s12s=snow.slice(0,12).reduce(function(a,b){return a+b;},0);
        var mxG=Math.max.apply(null,gust.slice(0,12).concat([0]));
        var mxW=Math.max.apply(null,wind.slice(0,12).concat([0]));
        var reasons=[],level='';
        if(s12p>=110){level='경보';reasons.push('호우경보');}else if(s12p>=70){level='주의보';reasons.push('호우주의보');}
        if(mxG>=26||mxW>=21){level='경보';reasons.push('강풍경보');}else if((mxG>=20||mxW>=14)&&level!=='경보'){level='주의보';reasons.push('강풍주의보');}
        if(s12s>=20){level='경보';reasons.push('대설경보');}else if(s12s>=5&&level!=='경보'){level='주의보';reasons.push('대설주의보');}
        if(reasons.length)alertMap[rNames[i]]={level:level,reasons:reasons};
      });
      // 기상청 특보(typ01)가 실제로 수신됐으면 추정값 대신 진짜 발효 특보 표시
      if(typeof realWrnTxt==='string'&&realWrnTxt.length){
        _renderWeatherAlerts(_parseKmaWarnings(realWrnTxt),false);
      }else{
        _renderWeatherAlerts(alertMap,true);
      }
    }).catch(function(e){console.warn('날씨 폴백 실패:',e);_weatherFetched=false;});
}
function _renderWeatherAlerts(alertMap,estimated){
  // 특보운영 연동: 공식 발효 특보만 자동 발령 근거로 사용(추정값 제외)
  try{
    window._kmaLiveAlerts=estimated?[]:_kmaLiveList(alertMap);
    if(!estimated){
      _syncAutoAlerts(window._kmaLiveAlerts);
      if(window.curApp==='alert'&&typeof renderAlertView==='function')renderAlertView();
    }
  }catch(e){}
  var wrap=document.getElementById('weatherAlertWrap');if(!wrap)return;
  var entries=Object.entries(alertMap);
  if(!entries.length){wrap.innerHTML='';wrap.style.display='none';return;}
  // 경보 먼저, 주의보 나중
  entries.sort(function(a,b){return a[1].level==='경보'&&b[1].level!=='경보'?-1:1;});
  // 같은 특보를 가진 지역끼리 묶기
  var grouped={};
  entries.forEach(function(e){
    var key=e[1].reasons.join('/');
    if(!grouped[key])grouped[key]={level:e[1].level,regions:[],reasons:e[1].reasons};
    grouped[key].regions.push(e[0]);
  });
  wrap.innerHTML=Object.values(grouped).map(function(g){
    var ico=g.reasons.some(function(r){return r.includes('호우');})?'🌧️':g.reasons.some(function(r){return r.includes('강풍');})?'💨':g.reasons.some(function(r){return r.includes('대설');})?'❄️':'⚠️';
    var regionStr=g.regions.join('·');
    var reasonStr=g.reasons.map(function(r){return r.replace('경보','').replace('주의보','');}).join(', ');
    // estimated=true: 기상청 미연결로 open-meteo 관측값에서 추정한 특보 → 공식 특보와 명확히 구분
    if(estimated){
      return'<div class="w-alert w-alert-추정">'+ico+' <b>추정 '+g.level+'</b> '+regionStr+' — '+reasonStr+' <span style="font-weight:400;opacity:.85;">· 기상청 미연결</span></div>';
    }
    return'<div class="w-alert w-alert-'+g.level+'">'+ico+' <b>'+g.level+'</b> '+regionStr+' — '+reasonStr+'</div>';
  }).join('');
  wrap.style.display='flex';
}
var _wDetailCache=null;
var _wDetailFetching=false;
function openWeatherDetail(){
  document.getElementById('modalWeather').classList.add('on');
  if(_wDetailCache&&(_wDetailCache.regions||Array.isArray(_wDetailCache))){_renderWeatherDetail(_wDetailCache);return;}
  _fetchWeatherDetail();
}
function refreshWeatherDetail(){
  _wDetailCache=null;
  _kmaWrnCache=null;_kmaWrnCacheAt=0; // 수동 새로고침 시 특보도 다시 받아옴
  document.getElementById('weatherDetailBody').innerHTML='<div class="wdetail-loading">날씨 새로고침 중...</div>';
  _fetchWeatherDetail();
}
function _fetchWeatherDetail(){
  if(_wDetailFetching)return;
  _wDetailFetching=true;
  var dt=_kmaNCSTTime(),ft=_kmaFcstTime();
  var ncstCalls=_WEATHER_REGIONS.map(function(r){
    var url=KMA_BASE+'/getUltraSrtNcst?authKey='+KMA_KEY+'&dataType=JSON&numOfRows=10&pageNo=1&baseDate='+dt.date+'&baseTime='+dt.time+'&nx='+r.nx+'&ny='+r.ny;
    return _fetchKma(url,false).catch(function(){return null;}); // 일부 권역 프록시 실패 허용
  });
  var fcst7Url=KMA_BASE+'/getVilageFcst?authKey='+KMA_KEY+'&dataType=JSON&numOfRows=900&pageNo=1&baseDate='+ft.date+'&baseTime='+ft.time+'&nx=80&ny=140';
  // 기상특보: 캐시가 신선(15분 이내)하면 재사용, 아니면 새로 조회
  var wrnFresh=_kmaWrnCache!==null&&(Date.now()-_kmaWrnCacheAt)<_KMA_WRN_TTL;
  var wrnPromise=wrnFresh
    ?Promise.resolve(_kmaWrnCache)
    :_fetchKma('https://apihub.kma.go.kr/api/typ01/url/wrn_now_data_new.php?authKey='+KMA_KEY+'&disp=1',true).catch(function(){return '';});
  Promise.all([
    Promise.all(ncstCalls),
    _fetchKma(fcst7Url,false).catch(function(){return null;}),
    wrnPromise
  ]).then(function(all){
    _wDetailFetching=false;
    // 권역 중 하나라도 성공하면 기상청 데이터로 처리(나머지 권역 프록시 실패는 허용)
    var wrnTxtOk=(typeof all[2]==='string'&&all[2].length>0);
    var wrnMap=_parseKmaWarnings(all[2]||'');
    var anyOk=all[0].some(function(x){return x&&x.response&&x.response.header&&x.response.header.resultCode==='00';});
    // 기온(typ02) 실패해도 특보(typ01)가 살아 있으면 진짜 기상청 특보를 폴백 렌더러로 넘김
    if(!anyOk){_fetchWeatherDetailFallback(wrnTxtOk?wrnMap:null);return;}
    _wDetailCache={regions:_WEATHER_REGIONS.map(function(r,i){return{region:r.name,ncst:all[0][i]};}),fcst7:all[1],wrnMap:wrnMap};
    _renderWeatherDetail(_wDetailCache);
  }).catch(function(){
    _wDetailFetching=false;
    _fetchWeatherDetailFallback();
  });
}
function _fetchWeatherDetailFallback(realWrnMap){
  _wDetailFetching=true;
  var base='https://api.open-meteo.com/v1/forecast';
  var coords={속초:{lat:38.21,lng:128.59},인제:{lat:38.06,lng:128.17},양양:{lat:38.08,lng:128.62},고성:{lat:38.38,lng:128.47},설악:{lat:38.13,lng:128.41}};
  var daily=base+'?latitude=38.13&longitude=128.41&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,windgusts_10m_max&wind_speed_unit=ms&timezone=Asia%2FSeoul&forecast_days=7';
  Promise.all([
    Promise.all(_WEATHER_REGIONS.map(function(r){
      var c=coords[r.name]||{lat:38.13,lng:128.41};
      return fetch(base+'?latitude='+c.lat+'&longitude='+c.lng+'&current=temperature_2m,wind_speed_10m,weather_code&hourly=precipitation,snowfall,windgusts_10m,wind_speed_10m&wind_speed_unit=ms&timezone=Asia%2FSeoul&forecast_hours=24')
        .then(function(res){return res.json();}).then(function(d){return{region:r.name,data:d};});
    })),
    fetch(daily).then(function(res){return res.json();}).catch(function(){return null;})
  ]).then(function(all){
    _wDetailFetching=false;
    _wDetailCache={omFallback:true,regions:all[0],daily:all[1],realWrnMap:realWrnMap||null};
    _renderWeatherDetail(_wDetailCache);
  }).catch(function(){
    _wDetailFetching=false;
    document.getElementById('weatherDetailBody').innerHTML='<div class="wdetail-loading">날씨 데이터를 불러오지 못했습니다. ↻ 를 눌러 재시도하세요.</div>';
  });
}
function _renderWeatherDetail(cache){
  if(cache.omFallback)return _renderWeatherDetailOM(cache);
  var results=cache.regions||[];
  var fcst7=cache.fcst7||null;
  var wrnMap=cache.wrnMap||{};
  var src=results.some(function(x){return x&&x.ncst&&x.ncst.response;})?'기상청':'Open-Meteo';
  var html='<div style="font-size:10px;color:#3a6a8a;margin-bottom:8px;text-align:right;">'+new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})+' 기준 ('+src+')</div>';
  // ── 기상특보 (기상청 실제 발효 특보) ──────────────
  var wrnEntries=Object.entries(wrnMap);
  if(wrnEntries.length){
    html+='<div style="margin-bottom:10px;">';
    wrnEntries.forEach(function(e){
      var region=e[0],info=e[1];
      var ico=info.reasons.some(function(r){return r.includes('호우');})?'🌧️':info.reasons.some(function(r){return r.includes('대설');})?'❄️':info.reasons.some(function(r){return r.includes('강풍');})?'💨':info.reasons.some(function(r){return r.includes('태풍');})?'🌀':info.reasons.some(function(r){return r.includes('한파');})?'🥶':info.reasons.some(function(r){return r.includes('폭염');})?'🌡️':'⚠️';
      html+='<div class="wdetail-alert w-alert-'+info.level+'" style="display:flex;align-items:center;gap:5px;padding:7px 10px;border-radius:7px;margin-bottom:4px;">'
        +ico+' <b>기상청 '+info.level+'</b> — '+region+' '+info.reasons.join(', ')+'</div>';
    });
    html+='</div>';
  }else{
    html+='<div style="text-align:center;padding:6px 0 10px;font-size:11px;color:#27ae60;">✅ 현재 발효 중인 특보 없음 (기상청)</div>';
  }
  // ── 권역별 현재 날씨 (초단기실황) ─────────────────
  html+='<div class="wfc-sec"><div class="wfc-title">🌡️ 권역별 현재 날씨</div>';
  html+='<div class="wdetail-now-grid">';
  results.forEach(function(item,idx){
    var r=item.region;
    var obs={};
    _kmaItems(item.ncst).forEach(function(it){obs[it.category]=it.obsrValue;});
    var temp=parseFloat(obs.T1H||0);
    var wspd=parseFloat(obs.WSD||0);
    var rn1=parseFloat(obs.RN1||0);
    var pi=_ptyInfo(obs.PTY||0);
    // 이 지역에 실제 특보 있는지
    var hasWrn=Object.keys(wrnMap).some(function(k){return k.includes(r)||r.includes(k);});
    var wide=(idx===4)?'wdr-wide':'';
    html+='<div class="wdetail-region '+wide+'">'
      +'<div class="wdetail-rname">'+r+(hasWrn?' <span style="color:#ff8a80;">⚠</span>':'')+'</div>'
      +'<div class="wdetail-row">'
        +'<div class="wdetail-ico">'+pi.ico+'</div>'
        +'<div class="wdetail-main">'
          +'<div class="wdetail-tmp">'+(isNaN(temp)?'--':Math.round(temp))+'°</div>'
          +'<div class="wdetail-desc">'+pi.desc+'</div>'
        +'</div>'
      +'</div>'
      +'<div class="wdetail-meta">'
        +'<span>💨'+Math.round(wspd)+'</span>'
        +(rn1>0?'<span>🌧️'+rn1.toFixed(1)+'mm</span>':'')
      +'</div>'
      +'</div>';
  });
  html+='</div></div>';
  // ── 7일 예보 (설악 단기예보) ──────────────────────
  if(fcst7){
    var items=_kmaItems(fcst7);
    var byDate={};
    items.forEach(function(it){
      var dk=it.fcstDate;
      if(!byDate[dk])byDate[dk]={};
      if(it.category==='TMX')byDate[dk].TMX=parseFloat(it.fcstValue);
      else if(it.category==='TMN')byDate[dk].TMN=parseFloat(it.fcstValue);
      else if(it.category==='SKY'&&it.fcstTime==='1200')byDate[dk].SKY=it.fcstValue;
      else if(it.category==='PTY'&&it.fcstTime==='1200')byDate[dk].PTY=it.fcstValue;
      else if(it.category==='PCP'){var p=_parsePCP(it.fcstValue);byDate[dk].PCP=(byDate[dk].PCP||0)+p;}
      else if(it.category==='WSD'){var w=parseFloat(it.fcstValue||0);if(w>(byDate[dk].WSD||0))byDate[dk].WSD=w;}
    });
    var dayNames=['일','월','화','수','목','금','토'];
    var dateKeys=Object.keys(byDate).sort().slice(0,7);
    html+='<div class="wfc-sec"><div class="wfc-title">📅 7일 예보 (설악 기준 · 기상청)</div>';
    dateKeys.forEach(function(dk,i){
      var dd=byDate[dk];
      var d2=new Date(dk.slice(0,4)+'-'+dk.slice(4,6)+'-'+dk.slice(6,8));
      var dayLabel=i===0?'오늘':i===1?'내일':dayNames[d2.getDay()]+'요';
      var ico=_skyIco(dd.SKY||'1',dd.PTY||'0');
      var rain=dd.PCP||0;var gust=dd.WSD||0;
      html+='<div class="wfc-row">'
        +'<div class="wfc-day">'+dayLabel+'</div>'
        +'<div class="wfc-ico">'+ico+'</div>'
        +'<div class="wfc-tmp">'+(dd.TMX!==undefined?Math.round(dd.TMX):'?')+'° <span>/ '+(dd.TMN!==undefined?Math.round(dd.TMN):'?')+'°</span></div>'
        +'<div class="wfc-rain">'+(rain>0?'🌧️'+rain.toFixed(0)+'mm':'')+'</div>'
        +'<div class="wfc-wind">'+(gust>0?'💨'+gust.toFixed(0):'')+'</div>'
        +'</div>';
    });
    html+='</div>';
  }
  document.getElementById('weatherDetailBody').innerHTML=html;
}
function _renderWeatherDetailOM(cache){
  // open-meteo 폴백용 렌더러
  var results=cache.regions||[];
  var daily=cache.daily||null;
  function wico(c){return c===0?'☀️':c<=2?'🌤️':c===3?'☁️':c<=48?'🌫️':c<=55?'🌦️':c<=65?'🌧️':c<=77?'🌨️':c<=82?'🌧️':c<=86?'🌨️':'⛈️';}
  function wdesc(c){return c===0?'맑음':c<=2?'구름조금':c===3?'흐림':c<=48?'안개':c<=55?'이슬비':c<=65?'비':c<=77?'눈':c<=82?'소나기':'뇌우';}
  // 기상특보가 typ01(기상청)에서 실제로 수신된 경우 — 기온만 Open-Meteo, 특보는 진짜 기상청 발효분 사용
  var realWrn=cache.realWrnMap||null;
  var hasRealWrn=(realWrn!==null&&realWrn!==undefined);
  var srcLabel=hasRealWrn?'특보: 기상청 · 기온: Open-Meteo':'Open-Meteo';
  var html='<div style="font-size:10px;color:#3a6a8a;margin-bottom:8px;text-align:right;">'+new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})+' 기준 ('+srcLabel+')</div>';
  html+='<div class="wfc-sec"><div class="wfc-title">🌡️ 권역별 현재 날씨</div><div class="wdetail-now-grid">';
  var anyAlert=false,alertsAll=[];
  results.forEach(function(item,idx){
    var r=item.region;var d=item.data;
    var cw=d.current||d.current_weather||{};var h=d.hourly||{};
    var code=cw.weather_code!==undefined?cw.weather_code:(cw.weathercode||0);
    var gust=h.windgusts_10m||[];var precip=h.precipitation||[];var snow=h.snowfall||[];
    var mxG=Math.max.apply(null,gust.slice(0,12).concat([0]));
    var s12p=precip.slice(0,12).reduce(function(a,b){return a+b;},0);
    var s12s=snow.slice(0,12).reduce(function(a,b){return a+b;},0);
    var alerts=[];
    if(s12p>=110)alerts.push({lv:'경보',msg:r+' 호우경보'});else if(s12p>=70)alerts.push({lv:'주의보',msg:r+' 호우주의보'});
    if(mxG>=26)alerts.push({lv:'경보',msg:r+' 강풍경보'});else if(mxG>=20)alerts.push({lv:'주의보',msg:r+' 강풍주의보'});
    if(s12s>=20)alerts.push({lv:'경보',msg:r+' 대설경보'});else if(s12s>=5)alerts.push({lv:'주의보',msg:r+' 대설주의보'});
    if(alerts.length){anyAlert=true;alertsAll=alertsAll.concat(alerts);}
    // 실제 기상청 특보가 있으면 권역 ⚠ 표식도 추정값이 아닌 실데이터 기준
    var rWarn=hasRealWrn?Object.keys(realWrn).some(function(k){return k.includes(r)||r.includes(k);}):(alerts.length>0);
    var tmp=cw.temperature_2m!==undefined?Math.round(cw.temperature_2m):cw.temperature!==undefined?Math.round(cw.temperature):'-';
    var wsp=cw.wind_speed_10m!==undefined?Math.round(cw.wind_speed_10m):cw.windspeed!==undefined?Math.round(cw.windspeed):'-';
    var wide=(idx===4)?'wdr-wide':'';
    html+='<div class="wdetail-region '+wide+'">'
      +'<div class="wdetail-rname">'+r+(rWarn?' <span style="color:#ff8a80;">⚠</span>':'')+'</div>'
      +'<div class="wdetail-row"><div class="wdetail-ico">'+wico(code)+'</div>'
      +'<div class="wdetail-main"><div class="wdetail-tmp">'+tmp+'°</div><div class="wdetail-desc">'+wdesc(code)+'</div></div></div>'
      +'<div class="wdetail-meta"><span>💨'+wsp+'</span>'+(mxG>0?'<span>돌풍'+mxG.toFixed(0)+'</span>':'')+(s12p>0?'<span>🌧️'+s12p.toFixed(0)+'mm</span>':'')+(s12s>0?'<span>❄️'+s12s.toFixed(0)+'cm</span>':'')+'</div></div>';
  });
  html+='</div></div>';
  if(hasRealWrn){
    // 진짜 기상청 발효 특보 (typ01) — 추정값 대신 실데이터 표시
    var realEntries=Object.entries(realWrn);
    if(realEntries.length){
      html+='<div style="margin-bottom:10px;">'+realEntries.map(function(e){
        var info=e[1];
        var ic=info.reasons.some(function(x){return x.includes('호우');})?'🌧️':info.reasons.some(function(x){return x.includes('대설');})?'❄️':info.reasons.some(function(x){return x.includes('강풍');})?'💨':info.reasons.some(function(x){return x.includes('태풍');})?'🌀':info.reasons.some(function(x){return x.includes('한파');})?'🥶':info.reasons.some(function(x){return x.includes('폭염');})?'🌡️':'⚠️';
        return'<div class="wdetail-alert w-alert-'+info.level+'" style="display:flex;align-items:center;gap:5px;">'+ic+' <b>기상청 '+info.level+'</b> — '+e[0]+' '+info.reasons.join(', ')+'</div>';
      }).join('')+'</div>';
    }else{
      html+='<div style="text-align:center;padding:6px 0 10px;font-size:11px;color:#27ae60;">✅ 현재 발효 중인 특보 없음 (기상청)</div>';
    }
  }
  else if(anyAlert){html+='<div style="margin-bottom:10px;">'+alertsAll.map(function(a){return'<div class="wdetail-alert w-alert-'+a.lv+'" style="display:flex;align-items:center;gap:5px;">⚠️ <b>'+a.lv+'</b> '+a.msg+'</div>';}).join('')+'</div>';}
  else{html+='<div style="text-align:center;padding:6px 0 10px;font-size:11px;color:#27ae60;">✅ 현재 발효 중인 특보 없음</div>';}
  if(daily&&daily.daily){
    var dd=daily.daily;var days=['일','월','화','수','목','금','토'];
    html+='<div class="wfc-sec"><div class="wfc-title">📅 7일 예보 (설악 기준 · Open-Meteo)</div>';
    (dd.time||[]).forEach(function(t,i){
      var dt2=new Date(t);var dayLabel=i===0?'오늘':i===1?'내일':days[dt2.getDay()]+'요';
      var code=((dd.weather_code||dd.weathercode)||[])[i]||0;
      var tmax=(dd.temperature_2m_max||[])[i];var tmin=(dd.temperature_2m_min||[])[i];
      var rain=(dd.precipitation_sum||[])[i]||0;var gust=(dd.windgusts_10m_max||[])[i]||0;
      html+='<div class="wfc-row"><div class="wfc-day">'+dayLabel+'</div><div class="wfc-ico">'+wico(code)+'</div>'
        +'<div class="wfc-tmp">'+(tmax!==undefined?Math.round(tmax):'?')+'° <span>/ '+(tmin!==undefined?Math.round(tmin):'?')+'°</span></div>'
        +'<div class="wfc-rain">'+(rain>0?'🌧️'+rain.toFixed(0)+'mm':'')+'</div>'
        +'<div class="wfc-wind">'+(gust>0?'💨'+gust.toFixed(0):'')+'</div></div>';
    });
    html+='</div>';
  }
  document.getElementById('weatherDetailBody').innerHTML=html;
}
// ── 날씨 30분마다 자동 갱신 (백그라운드 시 정지) ──
setInterval(function(){
  if(document.hidden)return;
  _weatherFetched=false;_wDetailCache=null;fetchWeather();
},30*60*1000);

// ── 진행중 구조 방치 감시: 마지막 보고 후 일정시간 경과 시 알림 ──────
const _STALE_HOURS=2;            // 경과 임계(시간)
const _STALE_REPEAT_MS=2*3600*1000; // 동일 건 재알림 최소 간격
let _staleAlerted={};            // {id: lastAlertTs}
function _parseDT(s){
  // "YYYY-MM-DD HH:MM" 또는 "YYYY-MM-DDTHH:MM" → ms
  if(!s)return null;
  const m=String(s).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/);
  if(!m)return null;
  return new Date(+m[1],+m[2]-1,+m[3],+m[4],+m[5]).getTime();
}
function _lastActivityTs(r){
  let t=_parseDT(r.date)||0;
  (r.reports||[]).forEach(p=>{const pt=_parseDT(p.repTime)||_parseDT(p.date);if(pt&&pt>t)t=pt;});
  return t;
}
function _checkStaleRescues(){
  const res=DB.g('rescues')||[];
  const nowMs=Date.now();
  res.filter(r=>r.status==='ongoing').forEach(r=>{
    const last=_lastActivityTs(r);
    if(!last)return;
    const elapsedH=(nowMs-last)/3600000;
    if(elapsedH<_STALE_HOURS)return;
    const lastAlert=_staleAlerted[r.id]||0;
    if(nowMs-lastAlert<_STALE_REPEAT_MS)return;
    _staleAlerted[r.id]=nowMs;
    pushNoti('⏰ 진행중 '+Math.floor(elapsedH)+'시간 경과 — 상태 확인 필요',
      '⏰','progress',{app:'rescue',tab:2,id:r.id});
  });
}
setInterval(_checkStaleRescues,15*60*1000);
setTimeout(_checkStaleRescues,60*1000);
function updateSummary(){
  const res=DB.g('rescues')||[];const facs=DB.g('facilities')||[];
  const og=res.filter(r=>r.status==='ongoing');const bad=facs.filter(f=>f.status==='bad');const warn=facs.filter(f=>f.status==='warn');const ok=facs.filter(f=>f.status==='ok');
  const thisMonth=res.filter(r=>r.date&&r.date.startsWith(today().slice(0,7))).length;
  function se(id,v){const e=document.getElementById(id);if(e)e.textContent=v;}
  se('hs-og',og.length);
  se('hs-tot',thisMonth);
  se('hs-fb',bad.length);
  se('hs-ft',facs.length);
  const ogNumEl=document.getElementById('hs-og');
  if(ogNumEl)ogNumEl.classList.toggle('blink',og.length>0);
  function sd(id,v,col){const e=document.getElementById(id);if(!e)return;e.textContent=v;e.style.color=col||'';}
  sd('hdR',og.length?`⚠️ ${og.length}건 진행중`:'구조보고·위험상황',og.length?'#ffaaaa':'');
  sd('hdI',bad.length?`⚠️ 위험 ${bad.length}개`:'시설 관리·이력',bad.length?'#ffaaaa':'');
  {const _ao=(DB.g('alertOps')||[]).find(o=>!o.closedAt);sd('hdA',_ao?`🌀 ${_opLevel(_ao)} 운영중`:'기상특보 비상근무',_ao?'#ffaaaa':'');}
  updateBell();
  try{_checkNewJoinerAlert();}catch(e){}
  try{renderHomeActive();}catch(e){}
  try{renderMobilizeBanner();}catch(e){}
}
// 홈: 진행중 구조 건을 가로 스크롤 카드로 즉시 노출 (한눈에 현황 파악)
function renderHomeActive(){
  const el=document.getElementById('homeActiveStrip');if(!el)return;
  if(isExternal()){el.style.display='none';el.innerHTML='';return;}
  el.style.display='block';
  const og=(DB.g('rescues')||[]).filter(r=>r.status==='ongoing');
  const haz=(DB.g('hazards')||[]).filter(h=>!h.hazStatus||h.hazStatus==='미조치'||h.hazStatus==='조치중');
  const badFac=(DB.g('facilities')||[]).filter(f=>f.status==='bad');
  const total=og.length+haz.length+badFac.length;
  if(!total){
    el.innerHTML=`<div style="display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,#0e2a20,#0b1c19);border:1px solid rgba(39,174,96,.22);border-radius:16px;padding:15px 16px;">
      <div style="width:40px;height:40px;border-radius:50%;background:rgba(39,174,96,.15);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">✅</div>
      <div style="min-width:0;"><div style="font-size:14px;font-weight:800;color:#eaf2fa;">현재 주의 항목 없음</div>
      <div style="font-size:11.5px;color:#7fb89c;margin-top:2px;">진행 중인 구조·위험 상황이 없습니다</div></div>
    </div>`;
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
        <span style="font-size:8.5px;font-weight:800;color:${badgeCol};background:${badgeBg};border-radius:6px;padding:2px 6px;letter-spacing:.2px;">${badgeTxt}</span>
        ${mobHtml||''}
      </div>
      <div style="font-size:11.5px;font-weight:700;color:#eaf2fa;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
      <div style="font-size:9.5px;color:#8ab4cc;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${meta}</div>
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
    const fico=(f.type||'').split(' ')[0]||'🛠️';
    cards.push(_card(`openFacFromHome(${f.id})`,'#e0a030','rgba(224,160,48,.32)','rgba(224,160,48,.18)','#ffc05a','위험',fico,'',
      _esc(f.name||'시설물'),
      _esc(f.type.split(' ').slice(1).join(' ')||'시설')+(f.loc?' · '+_esc(f.loc):'')));
  });
  el.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <span style="font-size:12.5px;font-weight:800;color:#eaf2fa;">⚡ 주의 현황</span>
      <span style="font-size:10.5px;color:#9bb8cc;">${sum.join(' <span style=\"color:#3a5a74;\">·</span> ')}</span>
    </div>
    <div style="display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding-bottom:2px;">${cards.join('')}</div>`;
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
  const alertOps=DB.g('alertOps')||[];
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
  const pAlertOps=alertOps.filter(o=>pf((o.startedAt||'').split('T')[0]||o.startedAt||''));
  const activeAlertOps=alertOps.filter(o=>!o.closedAt);
  // 전년대비
  const thisY=res.filter(r=>fy(getDate(r))).length;
  const prevY=res.filter(r=>fy_prev(getDate(r))).length;
  const diff=thisY-prevY;
  const diffStr=diff>0?`▲${diff}`:diff<0?`▼${Math.abs(diff)}`:'±0';
  const diffCol=diff>0?'#c0392b':diff<0?'#27ae60':'#4a7090';
  // 유형별
  const typeMap={};pRes.forEach(r=>{typeMap[r.type]=(typeMap[r.type]||0)+1;});
  // 안전사고 세부
  const accRes=pRes.filter(r=>r.type==='안전사고');
  const injMap={},sevMap={},cauMap={},locMap={},methodMap={};
  accRes.forEach(r=>{
    (r.injuryParts||[]).forEach(p=>{injMap[p]=(injMap[p]||0)+1;});
    if(r.severity)sevMap[r.severity]=(sevMap[r.severity]||0)+1;
    if(r.cause)cauMap[r.cause]=(cauMap[r.cause]||0)+1;
    if(r.loctype)locMap[r.loctype]=(locMap[r.loctype]||0)+1;
    (r.rescueMethod||[]).forEach(m=>{methodMap[m]=(methodMap[m]||0)+1;});
  });
  const topN=(obj,n=5)=>Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,n);
  const safe_max=obj=>Math.max(...Object.values(obj),1);
  const barRow=(k,v,max,col)=>`<div style="margin-bottom:4px;"><div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:1px;"><span style="color:#c0d8ec;">${_esc(k)}</span><span style="color:${col};font-weight:700;">${v}</span></div><div style="height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;"><div style="height:100%;width:${Math.round(v/max*100)}%;background:${col};border-radius:2px;"></div></div></div>`;
  const mini=(label,val,col='#e0edf8')=>`<div style="background:#060d1a;border-radius:7px;padding:5px 4px;text-align:center;"><div style="font-size:14px;font-weight:800;color:${col};line-height:1.2;">${val}</div><div style="font-size:8px;color:#7a9cb8;margin-top:1px;">${label}</div></div>`;
  const pill_tab=p=>`<div onclick="window._statPeriod='${p}';renderFullStats();" style="flex:1;padding:5px 2px;text-align:center;font-size:11px;font-weight:600;border-radius:7px;cursor:pointer;${p===period?'background:#1a4a6e;color:#e0edf8;':'color:rgba(255,255,255,.6);'}">${p}</div>`;
  const row2=(a,b)=>`<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">${a}${b}</div>`;
  const w=document.getElementById('statsWrap');
  w.innerHTML=`
    <div style="display:flex;background:#0b1c30;border-radius:9px;padding:3px;gap:2px;margin-bottom:2px;">
      ${['오늘','이번주','이번달','올해','전체'].map(pill_tab).join('')}
    </div>
    ${row2(
      `<div class="scard">
        <div class="stitle">🚨 구조 · ${period} ${pRes.length}건</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-bottom:${Object.keys(typeMap).length?'6':'0'}px;">
          ${mini(period,pRes.length,'#4fa8d0')}${mini('진행중',res.filter(r=>r.status==='ongoing').length,'#c0392b')}
          ${mini('전년대비',diffStr,diffCol)}${mini('누적',res.length)}
        </div>
        ${Object.keys(typeMap).length?topN(typeMap,3).map(([k,v])=>barRow(k,v,safe_max(typeMap),'#4fa8d0')).join(''):''}
      </div>`,
      `<div class="scard">
        <div class="stitle">⚠️ 위험상황 · ${pHaz.length}건</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;margin-bottom:4px;">
          ${mini('낙석',pHaz.filter(h=>h.hazType?.includes('낙석')).length,'#7d3c98')}
          ${mini('위험수목',pHaz.filter(h=>h.hazType?.includes('위험수목')).length,'#ca6f1e')}
          ${mini('산불',pHaz.filter(h=>h.hazType?.includes('산불')).length,'#a93226')}
        </div>
        <div style="font-size:9px;color:#5a8aaa;">미조치 ${pHaz.filter(h=>h.hazStatus==='미조치').length} · 완료 ${pHaz.filter(h=>h.hazStatus&&h.hazStatus!=='미조치'&&h.hazStatus!=='조치중').length}</div>
      </div>`
    )}
    <div class="scard">
      <div class="stitle">🛠️ 시설물 · 점검 ${pHist.length}건</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:3px;">
        ${mini('전체',facs.length)}${mini('위험',facs.filter(f=>f.status==='bad').length,'#c0392b')}
        ${mini('요주의',facs.filter(f=>f.status==='warn').length,'#e67e22')}${mini('기간점검',pHist.length,'#27ae60')}
      </div>
    </div>
    ${(()=>{
      const lvlMap={};
      pAlertOps.forEach(op=>{const lv=typeof _opLevel==='function'?_opLevel(op):(((op.alerts||[]).length?(op.alerts[op.alerts.length-1].stage||'예비특보'):(op.level||'예비특보')));lvlMap[lv]=(lvlMap[lv]||0)+1;});
      const typeAlertMap={};
      pAlertOps.forEach(op=>{(op.alerts||[]).forEach(a=>{const t=a.type||'기타';typeAlertMap[t]=(typeAlertMap[t]||0)+1;});});
      const totResponders=pAlertOps.reduce((s,op)=>s+(op.responders||[]).length,0);
      const totReports=pAlertOps.reduce((s,op)=>s+(op.reports||[]).length,0);
      const closedOps=pAlertOps.filter(o=>o.closedAtMs&&o.startedAtMs);
      const avgHrs=closedOps.length?Math.round(closedOps.reduce((s,o)=>s+((o.closedAtMs||0)-(o.startedAtMs||0)),0)/closedOps.length/3600000):0;
      const lvlColor={'예비특보':'#27ae60','Ⅰ단계(주의보)':'#e67e22','Ⅱ단계(경보)':'#c0392b','Ⅲ단계':'#7d3c98'};
      const lvlRows=Object.entries(lvlMap).sort((a,b)=>(['예비특보','Ⅰ단계(주의보)','Ⅱ단계(경보)','Ⅲ단계'].indexOf(b[0])||0)-(['예비특보','Ⅰ단계(주의보)','Ⅱ단계(경보)','Ⅲ단계'].indexOf(a[0])||0)).map(([k,v])=>barRow(k,v,Math.max(...Object.values(lvlMap),1),lvlColor[k]||'#4fa8d0')).join('');
      const typeRows=Object.entries(typeAlertMap).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>barRow(k,v,Math.max(...Object.values(typeAlertMap),1),'#4fa8d0')).join('');
      if(!pAlertOps.length&&!activeAlertOps.length)return '';
      return `<div class="scard">
        <div class="stitle">🌀 특보운영 · ${period} ${pAlertOps.length}건</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:3px;margin-bottom:6px;">
          ${mini(period,pAlertOps.length,'#4fa8d0')}${mini('운영중',activeAlertOps.length,activeAlertOps.length?'#c0392b':'#4fa8d0')}
          ${mini('응소인원',totResponders,'#e67e22')}${mini('관측보고',totReports,'#27ae60')}
        </div>
        ${pAlertOps.length?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div>${lvlRows?`<div style="font-size:9px;color:#7a9cb8;margin-bottom:3px;">단계별</div>${lvlRows}`:''}</div>
          <div>${typeRows?`<div style="font-size:9px;color:#7a9cb8;margin-bottom:3px;">특보 종류</div>${typeRows}`:''}</div>
        </div>${avgHrs?`<div style="font-size:9px;color:#5a8aaa;margin-top:4px;">평균 운영 ${avgHrs}시간</div>`:''}`:
        `<div style="font-size:10px;color:#5a8aaa;">현재 운영중 ${activeAlertOps.length}건</div>`}
      </div>`;
    })()}
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

function openResListDetail(id){
  const res=DB.g('rescues')||[];const r=res.find(x=>x.id===id);if(!r)return;
  selResId=id;curResId=id;
  const all=[r,...(r.reports||[])];
  document.getElementById('phaseSelectTitle').textContent=r.title;
  document.getElementById('phaseSelectList').innerHTML=all.map((p,i)=>{
    const isFirst=i===0;
    const timeStr=isFirst?r.date:p.repTime||'-';
    const authorStr=isFirst?r.author||'-':p.author||'-';
    const summary=isFirst
      ?`${r.type} · ${r.vName||'미상'} · ${r.severity||'-'}`
      :`${(p.update||'').slice(0,40)}${(p.update||'').length>40?'...':''}`;
    return `<div class="lcard" onclick="viewSinglePhase(${id},${i});closeM('modalPhaseSelect')">
      <div style="width:32px;height:32px;border-radius:50%;background:${i===all.length-1?'#1a4a6e':'#0b1c30'};border:2px solid ${i===all.length-1?'#4fa8d0':'rgba(79,168,208,.3)'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#4fa8d0;flex-shrink:0;">${i+1}보</div>
      <div class="linfo">
        <div class="lname">${i+1}보 — ${isFirst?'초기 접수':'업데이트'}</div>
        <div class="lmeta">${timeStr} · ${authorStr}</div>
        <div class="lmeta">${summary}</div>
      </div>
    </div>`;
  }).join('');
  document.getElementById('modalPhaseSelect').classList.add('on');
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
      <div style="font-size:12px;color:#7a9cb8;line-height:2.0;">
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
      <div style="font-size:12px;color:#7a9cb8;line-height:2.0;">
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

// 직원 정렬: 직위 → 과순서 → 이름순
const RANKS=['소장','과장','분소장','대장','팀장','계장','주임'];
const DEPTS=['행정과','재난안전과','탐방시설과','자원보전과','특수산악구조대','대청분소','백담분소','오색분소','한계산성분소','점봉산분소'];
const DEPT_SHORT={'특수산악구조대':'특구대','대청분소':'대청','백담분소':'백담'};
function sortStaff(arr){
  return [...arr].sort((a,b)=>{
    const ri=RANKS.indexOf(a.rank)-RANKS.indexOf(b.rank);
    if(ri!==0)return ri;
    const di=DEPTS.indexOf(a.dept)-DEPTS.indexOf(b.dept);
    if(di!==0)return di;
    return (a.name||'').localeCompare(b.name||'','ko');
  });
}
function getTeamMembers(){
  // 앱에 실제 가입한 사용자만 팀원 풀로 사용
  const users=DB.g('pendingUsers')||[];
  return sortStaff(users.filter(u=>u.name||u.realName).map(u=>({
    name:u.realName||u.name,dept:u.dept||'',rank:u.rank||''
  })));
}

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
  return ` <span style="font-size:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:9px;padding:1px 6px;font-weight:700;vertical-align:middle;color:#9bbdd4;">🟢${okCnt} 🔴${noCnt} ⚪${roster.length-okCnt-noCnt}</span>`;
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
      <span style="color:#b8d4e8;">${_esc(s.name)}${s.rank?` <span style="color:#4a7090;font-size:9px;">${_esc(s.rank)}</span>`:''}</span>${stat}
    </div>`;
  };
  const rows=deptKeys.map(dk=>{
    const members=deptGroups[dk];
    const dOk=members.filter(s=>(respMap[s.name]||{}).status==='eta').length;
    const dNo=members.filter(s=>(respMap[s.name]||{}).status==='unable').length;
    return (multiDept?`<div style="font-size:10px;font-weight:700;color:#7ec8a0;margin:6px 0 2px;padding-top:6px;border-top:.5px solid rgba(255,255,255,.05);display:flex;justify-content:space-between;"><span>${_esc(dk)}</span><span style="color:#4a7090;">🟢${dOk} 🔴${dNo} / ${members.length}명</span></div>`:'')
      +members.map(personRow).join('');
  }).join('');
  return `<div id="mobBlk_${coll}_${r.id}" style="background:#0b1c30;border-radius:10px;padding:11px 12px;border:.5px solid rgba(231,76,60,.25);margin-top:8px;">
    <div style="font-size:11px;color:#e74c3c;font-weight:700;margin-bottom:7px;">🚨 응소 현황 (${_esc(r.mobilize.join('·'))})</div>
    ${roster.length>1?`<div style="display:flex;gap:10px;font-size:10.5px;font-weight:700;margin-bottom:7px;padding-bottom:7px;border-bottom:.5px solid rgba(255,255,255,.07);">
      <span style="color:#3ad17a;">🟢 ${okCnt}명</span><span style="color:#e74c3c;">🔴 ${noCnt}명</span><span style="color:rgba(255,255,255,.4);">⚪ ${pendCnt}명</span><span style="color:#4a7090;margin-left:auto;">총 ${roster.length}명</span>
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
          <button onclick="_cancelMobEtaInput('${coll}',${r.id})" style="background:rgba(255,255,255,.06);color:#b8d4e8;border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:0 12px;font-size:11px;font-weight:700;cursor:pointer;">취소</button>
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
        body:JSON.stringify({secret:_FCM_PUSH_SECRET||(DB.g('fcmPushSecret')||''),title:'설악산 현장관리',body,
          data:{app:'rescue',tab:'2',id:String(id)},tokens:tokens})});
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
  if(isExternal()){el.innerHTML='';return;}
  const pend=_myPendingMobilizations();
  if(!pend.length){el.innerHTML='';return;}
  const first=pend[0];
  const onclick=first.coll==='rescues'?`openRescueFromHome(${first.id})`:`openHazFromHome(${first.id})`;
  const qBtn=(label,min)=>`<button onclick="event.stopPropagation();submitMobilizeResp('${first.coll}',${first.id},'eta',_etaFromMinutes(${min}))" style="flex:1;background:rgba(39,174,96,.18);color:#3ad17a;border:1px solid rgba(39,174,96,.4);border-radius:8px;padding:6px 2px;font-size:10.5px;font-weight:700;cursor:pointer;">${label}</button>`;
  el.innerHTML=`<div style="background:linear-gradient(135deg,#3a1410,#240a08);border:1px solid rgba(231,76,60,.5);border-radius:16px;padding:14px 16px;margin-bottom:20px;">
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
  </div>`;
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
const TT_STAGES_INIT=['지점통과','요구조자 조우','헬기 요청','기상 악화','작전 중단'];
const TT_STAGES_AFTER=['응급처치','심정지','하산 시작','헬기 도착','헬기 회항(기상)','대피소 숙박','작전 재개','휴식'];
let _ttFoundVictim=false;

function selectPhaseChoice(choice,el){
  _phaseChoice=choice;
  document.querySelectorAll('#phaseChoiceWrap button').forEach(b=>{b.style.background='transparent';b.style.color='#c0d8ec';b.style.borderColor='rgba(255,255,255,.1)';});
  el.style.background='rgba(79,168,208,.12)';el.style.color='#4fa8d0';el.style.borderColor='rgba(79,168,208,.5)';
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
      prevWrap.innerHTML=`<div style="background:#060d1a;border-radius:9px;padding:10px 12px;margin-bottom:8px;border:1px solid rgba(79,168,208,.15);">
        <div style="font-size:10px;color:#4fa8d0;font-weight:700;margin-bottom:6px;">📋 전보 (${phaseIdx}보) 내용</div>
        <div style="font-size:11px;color:#7a9cb8;line-height:1.8;">
          <b>시간:</b> ${prev.repTime||'-'}<br>
          <b>상황:</b> ${prev.update||'-'}<br>
          <b>부상자:</b> ${prev.victimChange||'-'}
        </div>
      </div>`;
    }
  } else {
    // 아니오: 1보에서 작성 안 한 항목만 보여줌 + 기존 작성내용은 readonly
    prevWrap.style.display='block';
    prevWrap.innerHTML=`<div style="background:#060d1a;border-radius:9px;padding:10px 12px;margin-bottom:8px;border:1px solid rgba(39,174,96,.15);">
      <div style="font-size:10px;color:#27ae60;font-weight:700;margin-bottom:4px;">✅ 기존 작성 내용 (수정불가)</div>
      <div style="font-size:11px;color:#5a8070;line-height:1.8;">
        유형: ${r.type} · 사고자: ${r.vName||'미상'}<br>
        중증도: ${r.severity||'-'} · 구조방법: ${(r.rescueMethod||[]).join(', ')||'-'}
      </div>
    </div>
    <div style="font-size:10px;color:#4fa8d0;font-weight:700;margin-bottom:6px;">📝 미작성 항목 추가입력</div>`;
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
        <div style="background:#060d1a;border-radius:8px;padding:10px 12px;margin-bottom:5px;border:1px solid rgba(79,168,208,.12);">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${e.stage==='요구조자 조우'?'#c0392b':'#4fa8d0'};flex-shrink:0;"></div>
            <div style="flex:1;">
              <div style="font-size:12px;font-weight:700;color:#e0edf8;">${e.stage}</div>
              <div style="font-size:10px;color:#4a7090;">${e.time||'-'}</div>
              ${e.note?`<div style="font-size:11px;color:#7a9cb8;margin-top:2px;">${e.note}</div>`:''}
            </div>
            <button onclick="removeTTEntry(${i})" style="background:rgba(192,57,43,.12);border:1px solid rgba(192,57,43,.3);border-radius:8px;color:#e05050;font-size:13px;font-weight:700;cursor:pointer;width:38px;height:38px;flex-shrink:0;display:flex;align-items:center;justify-content:center;">✕</button>
          </div>
        </div>`).join('')}
    </div>
    <div style="font-size:10px;color:#4fa8d0;font-weight:700;margin-bottom:6px;">단계 선택 <span style="color:rgba(255,255,255,.3);font-weight:400;">· 없으면 직접입력</span></div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;">
      ${stages.filter(s=>!_timetableEntries.find(e=>e.stage===s&&s!=='지점통과'&&s!=='휴식')).map(s=>{
        const isVic=s==='요구조자 조우'||s==='심정지';
        return `<div onclick="selectTTStage('${s}')" style="padding:6px 12px;border-radius:20px;border:1.5px solid ${isVic?'rgba(231,76,60,.4)':'rgba(79,168,208,.3)'};color:${isVic?'#e74c3c':'#4fa8d0'};font-size:11px;font-weight:600;cursor:pointer;background:${isVic?'rgba(231,76,60,.07)':'rgba(79,168,208,.06)'};">${s}</div>`;}).join('')}
      <div onclick="selectTTStageCustom()" style="padding:6px 12px;border-radius:20px;border:1.5px dashed rgba(255,255,255,.3);color:rgba(255,255,255,.55);font-size:11px;font-weight:600;cursor:pointer;background:transparent;">✏️ 직접입력</div>
    </div>
    <div id="ttInputWrap" style="display:none;margin-top:10px;">
      <div style="font-size:11px;color:#4fa8d0;font-weight:700;margin-bottom:6px;" id="ttStageLabel"></div>
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
              <button id="ttAedN" onclick="this.style.background='rgba(79,168,208,.15)';this.style.color='#4fa8d0';document.getElementById('ttAedY').style.background='transparent';document.getElementById('ttAedY').style.color='rgba(255,255,255,.4)';" style="flex:1;padding:6px;border-radius:7px;border:1px solid rgba(79,168,208,.25);background:rgba(79,168,208,.1);color:#4fa8d0;font-size:11px;font-weight:700;cursor:pointer;">미사용</button>
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
    <div style="font-size:10px;color:#4fa8d0;font-weight:700;margin:8px 0 5px;">추가 출동 인원</div>
    ${_extraDispatch.map((d,i)=>`
      <div style="display:flex;align-items:center;gap:8px;background:#060d1a;border-radius:7px;padding:7px 10px;margin-bottom:4px;border:1px solid rgba(79,168,208,.12);">
        <div style="flex:1;">
          <div style="font-size:12px;color:#e0edf8;font-weight:600;">${d.name}</div>
          <div style="font-size:10px;color:#4a7090;">${d.type}${d.note?' · '+d.note:''}</div>
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
      <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#060d1a;border-radius:8px;margin-bottom:5px;border:1px solid rgba(79,168,208,.12);">
        <div style="width:8px;height:8px;border-radius:50%;background:${
          e.stage==='요구조자 조우'?'#c0392b':
          e.stage==='처치완료'?'#27ae60':
          e.stage==='하산시작'?'#4fa8d0':'#4a7090'
        };flex-shrink:0;margin-top:2px;"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;font-weight:700;color:#e0edf8;">${e.actor?`<span style="font-size:10px;color:#7ec8e3;font-weight:600;margin-right:5px;">[${e.actor}]</span>`:''}${e.stage}</div>
          <div style="font-size:10px;color:#4a7090;">${e.time||'시간미기재'}${e.note?' · '+e.note:''}</div>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0;">
          <button onclick="editTTInline(${i})" style="background:rgba(79,168,208,.08);border:1px solid rgba(79,168,208,.2);color:#4fa8d0;font-size:10px;padding:3px 8px;border-radius:5px;cursor:pointer;">✏️</button>
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
    if(label) label.innerHTML='✏️ 내용 직접 입력 <span style="font-size:10px;color:#7a9cb8;">(메모란에 입력)</span>';
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
    el.style.cssText='background:rgba(8,18,36,.82);border:1px solid rgba(125,211,250,.4);border-radius:5px;padding:1px 4px;font-size:9px;font-weight:700;color:#7dd3fa;font-family:monospace;pointer-events:none;white-space:nowrap;';
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
function autoGenTitle(returnOnly=false){
  const loc   = (document.getElementById('r_loc')?.value||'').trim();
  const sev   = getSelPills('sevPills')[0]||'';
  const cause = document.getElementById('r_cause')?.value||'';
  const type  = document.getElementById('r_type')?.value||'안전사고';
  const nation= document.getElementById('r_vNat')?.value||'알수없음';
  const gender= document.getElementById('r_vGender')?.value||'';
  // 부상 내역 요약: 부상현황 목록 → 부상부위/유형 필 순으로 탐색
  let injStr='';
  if(typeof _injuries!=='undefined'&&_injuries.length){
    const i0=_injuries[0];
    injStr=((i0.side&&i0.side!=='해당없음'?i0.side+' ':'')+(i0.part||'')+' '+(i0.type||'')).trim();
    if(_injuries.length>1)injStr+=' 외 '+(_injuries.length-1);
  }
  if(!injStr){
    const ip=getSelPills('injParts')[0]||'',it=getSelPills('injTypes')[0]||'';
    injStr=(ip+' '+it).trim();
  }
  const parts=[];
  if(loc)     parts.push(loc.slice(0,12)+(loc.length>12?'...':''));
  if(type!=='안전사고') parts.push(type);
  if(injStr)  parts.push(injStr);
  else if(cause&&cause!=='실족') parts.push(cause);
  if(sev)     parts.push('KTAS'+sev.replace('KTAS ','').split('(')[0].trim());
  if(nation==='외국인'){
    const gLabel=(gender&&gender!=='알수없음')?'('+gender+')':'';
    parts.push('외국인'+gLabel);
  }
  const title=parts.join(' · ')||today()+' '+type;
  if(returnOnly) return title;
  const el=document.getElementById('r_title');
  if(el&&(!el.dataset.userEdited)){
    el.value=title;
  }
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
  ko:{closedT:'위치 접수가 종료되었습니다',closed:'구조대가 이 링크의 접수를 종료했습니다.<br>도움이 더 필요하면 119 또는 구조대에 다시 연락해 주세요.',teamLabel:'구조대 메시지'},
  en:{closedT:'Location sharing ended',closed:'The rescue team has closed this request.<br>If you still need help, call 119 or contact the rescue team again.',teamLabel:'Message from rescue team'},
  zh:{closedT:'位置接收已结束',closed:'救援队已结束此链接的接收。<br>如仍需帮助，请拨打119或再次联系救援队。',teamLabel:'救援队消息'},
  ja:{closedT:'位置の受付が終了しました',closed:'救助隊がこのリンクの受付を終了しました。<br>さらに支援が必要な場合は119または救助隊に再度ご連絡ください。',teamLabel:'救助隊からのメッセージ'},
  vi:{closedT:'Đã kết thúc chia sẻ vị trí',closed:'Đội cứu hộ đã đóng yêu cầu này.<br>Nếu vẫn cần trợ giúp, hãy gọi 119 hoặc liên hệ lại đội cứu hộ.',teamLabel:'Tin nhắn từ đội cứu hộ'},
  th:{closedT:'สิ้นสุดการรับตำแหน่งแล้ว',closed:'ทีมกู้ภัยได้ปิดคำขอนี้แล้ว<br>หากยังต้องการความช่วยเหลือ โปรดโทร 119 หรือติดต่อทีมกู้ภัยอีกครั้ง',teamLabel:'ข้อความจากทีมกู้ภัย'},
  ru:{closedT:'Приём геолокации завершён',closed:'Спасатели закрыли этот запрос.<br>Если вам всё ещё нужна помощь, позвоните 119 или свяжитесь со спасателями снова.',teamLabel:'Сообщение спасателей'},
  es:{closedT:'Recepción de ubicación finalizada',closed:'El equipo de rescate ha cerrado esta solicitud.<br>Si aún necesitas ayuda, llama al 119 o contacta de nuevo con el equipo de rescate.',teamLabel:'Mensaje del equipo de rescate'},
  fr:{closedT:'Réception de position terminée',closed:'L’équipe de secours a clôturé cette demande.<br>Si vous avez encore besoin d’aide, appelez le 119 ou recontactez les secours.',teamLabel:'Message de l’équipe de secours'},
  de:{closedT:'Standortempfang beendet',closed:'Das Rettungsteam hat diese Anfrage geschlossen.<br>Wenn Sie weiterhin Hilfe brauchen, rufen Sie 119 an oder kontaktieren Sie das Rettungsteam erneut.',teamLabel:'Nachricht des Rettungsteams'}
};
let _sosLang='ko';
function _st(k){const a=(_SOS_T[_sosLang]||_SOS_T.en),b=(_SOS_T2[_sosLang]||_SOS_T2.en);return a[k]||b[k]||_SOS_T.en[k]||_SOS_T2.en[k]||k;}
function _sosBuildUI(){
  const wrap=document.getElementById('sosVictim');if(!wrap)return;
  const _nm=(document.getElementById('sosName')||{}).value||'';
  const _mg=(document.getElementById('sosMsg')||{}).value||'';
  const _ct=(document.getElementById('sosCountry')||{}).value||'';
  const langBtns=_SOS_LANGS.map(([c,n])=>`<button onclick="_sosSetLang('${c}')" style="flex:0 0 auto;background:${_sosLang===c?'#c0392b':'rgba(255,255,255,.08)'};color:#fff;border:1px solid ${_sosLang===c?'#ffe14d':'rgba(255,255,255,.15)'};border-radius:14px;padding:5px 11px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">${n}</button>`).join('');
  wrap.innerHTML=`
    <div style="display:flex;gap:6px;overflow-x:auto;width:100%;max-width:440px;padding-bottom:5px;margin-bottom:2px;-webkit-overflow-scrolling:touch;">${langBtns}</div>
    <div style="font-size:34px;margin-top:2px;">🆘</div>
    <div style="font-size:19px;font-weight:800;margin-top:6px;text-align:center;">${_st('org')}</div>
    <div style="font-size:13px;color:#8ab4cc;margin-top:3px;text-align:center;line-height:1.6;">${_st('sub')}</div>
    <div id="sosStatus" style="margin-top:16px;width:100%;max-width:420px;background:#11233a;border:1.5px solid rgba(231,76,60,.5);border-radius:14px;padding:16px;text-align:center;">
      <div id="sosStatusIco" style="font-size:30px;">📡</div>
      <div id="sosStatusTxt" style="font-size:15px;font-weight:700;margin-top:6px;color:#ffd9d0;">${_st('perm')}</div>
      <div id="sosCoords" style="font-size:12px;color:#9bbdd4;margin-top:8px;font-family:monospace;line-height:1.7;"></div>
    </div>
    <button id="sosStartBtn" onclick="_sosRequest()" style="margin-top:14px;width:100%;max-width:420px;padding:18px;border:none;border-radius:14px;background:linear-gradient(180deg,#e74c3c,#c0392b);color:#fff;font-size:18px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(192,57,43,.5);">${_st('start')}</button>
    <div style="margin-top:16px;width:100%;max-width:420px;">
      <div style="font-size:12px;color:#8ab4cc;font-weight:700;margin-bottom:6px;">${_st('info')}</div>
      <input id="sosName" placeholder="${_st('name')}" value="${_esc(_nm)}" oninput="_sosPushInfo()" style="width:100%;box-sizing:border-box;background:#0b1c30;border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:9px;padding:12px;font-size:15px;margin-bottom:7px;">
      ${_sosLang!=='ko'?`<input id="sosCountry" placeholder="${_st('country')}" value="${_esc(_ct)}" oninput="_sosPushInfo()" style="width:100%;box-sizing:border-box;background:#0b1c30;border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:9px;padding:12px;font-size:15px;margin-bottom:7px;">`:''}
      <textarea id="sosMsg" placeholder="${_st('msg')}" oninput="_sosPushInfo()" rows="3" style="width:100%;box-sizing:border-box;background:#0b1c30;border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:9px;padding:12px;font-size:15px;resize:vertical;">${_esc(_mg)}</textarea>
    </div>
    <div id="sosTip" style="margin-top:16px;font-size:12px;color:#5a7e98;text-align:center;line-height:1.6;max-width:420px;">${_st('tip')}</div>
    <div style="width:100%;max-width:420px;margin-top:18px;">
      <div style="font-size:12px;color:#8ab4cc;font-weight:700;margin-bottom:6px;">💬 ${_sct('chat')}</div>
      <div id="sosChat" style="background:#0b1c30;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:10px;min-height:60px;max-height:260px;overflow-y:auto;"></div>
      <div style="display:flex;gap:6px;margin-top:7px;">
        <input id="sosChatIn" placeholder="${_sct('chatPh')}" style="flex:1;min-width:0;box-sizing:border-box;background:#0b1c30;border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:9px;padding:11px;font-size:15px;" onkeydown="if(event.key==='Enter')_sosVictimSend()">
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
  if(!msgs||!msgs.length)return '<div style="text-align:center;font-size:11px;color:#5a7e98;padding:12px 0;">아직 주고받은 메시지가 없습니다</div>';
  return msgs.slice().sort((a,b)=>(a.ts||0)-(b.ts||0)).map(m=>{
    const mine=(m.f===mySide);
    let label='';
    if(!mine){
      if(m.f==='t')label=(mySide==='v'?(m.org||'구조대'):(m.by||m.org||'구조대'));
      else label=(m.by||'조난자');
    }
    const bg=mine?'#1a6e9e':'#22384e',align=mine?'flex-end':'flex-start';
    return '<div style="display:flex;flex-direction:column;align-items:'+align+';margin-bottom:8px;">'
      +(label?'<div style="font-size:10px;color:#7dd3fa;font-weight:700;margin-bottom:2px;padding:0 4px;">'+_esc(label)+'</div>':'')
      +'<div style="max-width:80%;background:'+bg+';color:#eaf4fb;border-radius:13px;padding:8px 11px;font-size:14px;line-height:1.45;word-break:break-word;">'+_esc(m.x||'')+'</div>'
      +'<div style="font-size:9px;color:#5a7e98;margin-top:2px;padding:0 4px;">'+_sosMsgTime(m.ts)+'</div></div>';
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
  wrap.style.cssText='position:fixed;inset:0;z-index:99999;background:#0a1320;color:#e0edf8;display:flex;flex-direction:column;align-items:center;padding:calc(18px + env(safe-area-inset-top)) 18px calc(18px + env(safe-area-inset-bottom));overflow-y:auto;font-family:inherit;-webkit-text-size-adjust:100%;';
  document.body.innerHTML='';document.body.appendChild(wrap);
  _sosBuildUI();
  document.title='🆘 SOS — 설악산 구조대';
  try{ if(!firebase.apps.length) firebase.initializeApp(_FB_CFG); }catch(e){}
  try{
    _sosDb=firebase.firestore();
    firebase.auth().signInAnonymously().catch(()=>{});
    firebase.auth().onAuthStateChanged(function(u){ if(u){ _sosAuthed=true; _sosRequest(); if(_sosLast)_sosWrite(); _sosVictimListen(); } });
    _sosVictimListen(); // 인증 전이라도(공개 get 허용) 종료·메시지 감지 시도
  }catch(e){}
  setTimeout(_sosRequest,400);
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
  _sosLast={lat,lng,acc};
  const btn=document.getElementById('sosStartBtn');if(btn)btn.style.display='none';
  _sosSet('✅',_st('recv'),'#7ee0a0');
  const c=document.getElementById('sosCoords');
  if(c)c.innerHTML=`${lat.toFixed(6)}, ${lng.toFixed(6)}<br>±${acc}m`;
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
  const rec={id:_sosId,lat:+_sosLast.lat.toFixed(5),lng:+_sosLast.lng.toFixed(5),acc:Math.round(_sosLast.acc),ts:nowMs};
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
    +'<div style="font-size:14px;color:#9bbdd4;margin-top:12px;line-height:1.7;">'+_st('closed')+'</div>'
    +(_sosTeamMsgSeen?'<div style="margin-top:18px;background:#11233a;border:1px solid rgba(125,211,250,.3);border-radius:12px;padding:14px;text-align:left;"><div style="font-size:11px;color:#7dd3fa;font-weight:700;margin-bottom:4px;">📢 '+_st('teamLabel')+'</div><div style="font-size:15px;color:#e0edf8;line-height:1.5;">'+_esc(_sosTeamMsgSeen)+'</div></div>':'')
    +'</div>';
  if(e)e.remove();
}
function _sosShowTeamMsg(m){
  if(_sosClosed){_sosShowClosed();return;}
  let el=document.getElementById('sosTeamMsg');
  if(!el){el=document.createElement('div');el.id='sosTeamMsg';el.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:100001;background:linear-gradient(180deg,#1a4a6e,#0d3350);color:#fff;padding:14px 16px calc(14px + env(safe-area-inset-bottom));box-shadow:0 -3px 14px rgba(0,0,0,.55);';document.body.appendChild(el);}
  el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">'
    +'<div style="flex:1;min-width:0;"><div style="font-size:11px;color:#7dd3fa;font-weight:700;margin-bottom:3px;">📢 '+_st('teamLabel')+'</div>'
    +'<div style="font-size:15px;font-weight:600;line-height:1.5;word-break:break-word;">'+_esc(m)+'</div></div>'
    +'<button onclick="this.closest(\'#sosTeamMsg\').remove()" style="background:none;border:none;color:rgba(255,255,255,.6);font-size:22px;line-height:1;cursor:pointer;flex-shrink:0;">×</button></div>';
}

// ── 구조대 측: 조난·사고자 위치 실시간 구독 (1회용 토큰: 팀이 발급한 active 링크만 표시) ──
let _sosPings=[];                              // 활성(active) 발급 토큰 전체(위치 있든 없든)
function _sosLocated(){return (_sosPings||[]).filter(p=>p.lat&&p.lng);} // 실제 위치 수신된 건
function _initSosWatch(){
  if(!_fdb||window._sosWatchBound)return;
  window._sosWatchBound=true;
  try{
    _fdb.collection('sos').onSnapshot(function(snap){
      // 팀이 발급(active:true)했고 48시간 이내인 것만 — 밤샘·다일 구조 커버, 옛 링크 자동 무효
      _sosPings=DB.g('sosBlocked')?[]:snap.docs.map(d=>d.data()).filter(p=>p&&p.active===true&&Date.now()-(p.issuedAt||p.ts||0)<48*3600000);
      // 위치가 새로 수신된 조난자 알림(최초 스냅샷·미수신 토큰은 제외)
      const seen=window._sosSeen||(window._sosSeen={});
      _sosPings.forEach(p=>{
        if(p.lat&&p.lng&&!seen[p.id]){seen[p.id]=1;
          if(window._sosInited){try{toast('🆘 조난·사고자 위치 수신: '+(p.name||'익명')+(p.acc?' (±'+p.acc+'m)':''),6000);}catch(e){}try{pushNoti('🆘 조난·사고자 위치 수신'+(p.name?': '+p.name:''),'🆘','sos',{app:'rescue',tab:1});}catch(e){}}
        }
      });
      window._sosInited=true;
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
    },function(err){try{_logErr&&_logErr('sos listen: '+(err&&err.message||err));}catch(e){}});
  }catch(e){}
}
function _sosBadgeCount(){return _sosLocated().length;}
function _updateSosFab(){
  const b=document.getElementById('sosReqBtn');if(!b)return;
  const n=_sosBadgeCount();
  b.innerHTML='🆘 조난·사고자'+(n?' <span style="background:#fff;color:#c0392b;border-radius:50%;padding:0 5px;font-weight:800;">'+n+'</span>':' 위치요청');
  b.style.background=n?'rgba(192,57,43,.95)':'rgba(192,57,43,.6)';
}
function _sosVictimUrl(tok){return location.origin+location.pathname+'?sos='+tok;}
// 새 1회용 링크 발급 (토큰 생성 → active:true 문서 생성)
function _sosNewLink(){
  if(!_fdb){toast('연결 준비 중 — 잠시 후 다시');return;}
  if(DB.g('sosBlocked')){toast('⚠️ 조난 접수가 차단되어 있습니다 (관리자 → 시스템에서 해제)');return;}
  const tok=Math.random().toString(36).slice(2,7); // 5자리 토큰
  const by=(typeof getAuthor==='function')?getAuthor():'구조대';
  _fdb.collection('sos').doc(tok).set({id:tok,active:true,issuedAt:Date.now(),by:by},{merge:true})
    .then(function(){toast('🔗 1회용 링크 생성됨 — 조난자에게 보내세요',5000);openSosRequest();if(navigator.share)_sosShareUrl(tok);})
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
      ? `<span style="color:#3ad17a;font-weight:800;">🟢 위치 수신 ±${p.acc||'?'}m</span> <span style="color:#8ab4cc;font-size:10px;">${mm}분 전</span>`
      : `<span style="color:#ffd24d;font-weight:700;">⚪ 전송 대기 중</span>`;
    // 48시간 자동만료까지 남은 시간
    const _iss=p.issuedAt||p.ts||0;
    const _remMs=48*3600000-(Date.now()-_iss);
    const _rh=Math.floor(_remMs/3600000),_rm=Math.floor((_remMs%3600000)/60000);
    const _remStr=_remMs<=0?'만료됨':(_rh>0?_rh+'시간 '+_rm+'분':_rm+'분')+' 남음';
    const _remCol=_remMs<=0?'#e05050':(_remMs<6*3600000?'#ffd24d':'#7ee0a0');
    return `<div style="background:#0b1c30;border:1px solid ${has?'rgba(231,76,60,.4)':'rgba(255,255,255,.12)'};border-radius:11px;padding:11px 12px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:6px;flex-wrap:wrap;">
        <span style="font-size:12px;">${status}</span>
        <span style="font-size:9px;color:#5a7e98;font-family:monospace;">🔗 1회용 · ${p.id}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px;flex-wrap:wrap;">
        <span style="font-size:11px;color:${_remCol};font-weight:700;">⏱ 자동만료까지 ${_remStr}</span>
        <button onclick="_sosExtend('${p.id}')" style="flex-shrink:0;background:rgba(241,196,15,.13);color:#f0c040;border:1px solid rgba(241,196,15,.4);border-radius:14px;padding:5px 12px;font-size:11px;font-weight:800;cursor:pointer;">⏱ 48시간 연장</button>
      </div>
      ${has?`<div onclick="_sosFocus('${p.id}')" style="cursor:pointer;margin-bottom:7px;">
        <div style="font-size:13px;font-weight:800;color:#ff8a73;">🆘 ${_esc(p.name||'익명')}</div>
        ${_sosForeignBadge(p)?`<div style="margin-top:3px;">${_sosForeignBadge(p)}</div>`:''}
        ${p.msg?`<div style="font-size:12px;color:#cfe2f2;margin-top:2px;">${_esc(p.msg)}</div>`:''}
        <div style="font-size:10px;color:#5a7e98;font-family:monospace;margin-top:2px;">${(+p.lat).toFixed(5)}, ${(+p.lng).toFixed(5)} · 탭하면 지도 이동</div>
      </div>`:''}
      <div style="display:flex;gap:5px;margin-bottom:6px;">
        <input readonly value="${url}" onclick="this.select()" style="flex:1;min-width:0;background:#060d1a;border:1px solid rgba(79,168,208,.3);color:#7dd3fa;border-radius:7px;padding:8px;font-size:11px;font-family:monospace;">
        <button onclick="_sosCopyUrl('${p.id}',this)" style="flex-shrink:0;background:#1a4a6e;color:#fff;border:none;border-radius:7px;padding:0 13px;font-size:12px;font-weight:700;cursor:pointer;transition:background .15s;">복사</button>
      </div>
      <div style="display:flex;gap:5px;">
        ${navigator.share?`<button onclick="_sosShareUrl('${p.id}')" style="flex:1;background:rgba(39,174,96,.12);color:#27ae60;border:1px solid rgba(39,174,96,.35);border-radius:7px;padding:8px;font-size:12px;font-weight:700;cursor:pointer;">📤 보내기</button>`:`<button onclick="_sosSms('${p.id}')" style="flex:1;background:rgba(79,168,208,.1);color:#4fa8d0;border:1px solid rgba(79,168,208,.3);border-radius:7px;padding:8px;font-size:12px;font-weight:700;cursor:pointer;">✉️ 문자</button>`}
        <button onclick="_sosPinPopup('${p.id}')" style="flex:1;background:rgba(125,211,250,.1);color:#7dd3fa;border:1px solid rgba(125,211,250,.3);border-radius:7px;padding:8px;font-size:12px;font-weight:700;cursor:pointer;">💬 대화${(p.msgs&&p.msgs.length)?' '+p.msgs.length:''}</button>
        ${has?`<button onclick="sosToRescue('${p.id}')" style="flex:1;background:rgba(231,76,60,.15);color:#ff6b5e;border:1px solid rgba(231,76,60,.4);border-radius:7px;padding:8px;font-size:12px;font-weight:700;cursor:pointer;">🚨 구조등록</button>`:''}
        <button onclick="_sosCloseToken('${p.id}')" style="flex-shrink:0;background:rgba(192,57,43,.1);color:#c0392b;border:1px solid rgba(192,57,43,.3);border-radius:7px;padding:8px 11px;font-size:12px;font-weight:700;cursor:pointer;">종료</button>
      </div>
    </div>`;
  }).join('');
  const html=`
    <div style="background:rgba(241,196,15,.08);border:1px solid rgba(241,196,15,.25);border-radius:9px;padding:9px 11px;margin-bottom:10px;font-size:12px;color:#e8c84a;line-height:1.5;">
      🔗 <b>1회용 링크</b>입니다. 조난·사고자마다 새로 발급해 보내세요.<br>
      <span style="color:#9bbdd4;">구조가 끝나면 <b style="color:#ff8a73;">접수 종료</b>를 누르면 그 링크는 비활성화됩니다. (보내지 않아도 48시간 후 자동 만료)</span>
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
  m.innerHTML=`<div style="background:#0a1828;width:100%;max-width:480px;max-height:85vh;overflow-y:auto;border-radius:14px 14px 0 0;padding:16px 16px 28px;box-shadow:0 -4px 20px rgba(0,0,0,.7);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span style="font-size:15px;font-weight:800;color:#e0edf8;">${title}</span><button onclick="_sosCloseModal()" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:24px;cursor:pointer;line-height:1;">×</button></div>
    ${html}</div>`;
  m.onclick=function(e){if(e.target===m)_sosCloseModal();};
}
function _sosCloseModal(){window._sosPopupId=null;const m=document.getElementById('sosModal');if(m)m.remove();}
// 조난자 위치 삭제 (테스트·종료된 항목 정리)
// 외국인/언어/국적 배지 (팀 화면용)
function _sosForeignBadge(p){
  if(!p||!p.lang||p.lang==='ko')return '';
  const lbl=(typeof _SOS_LABEL!=='undefined'&&_SOS_LABEL[p.lang])||p.lang;
  return '<span style="font-size:10px;background:rgba(241,196,15,.15);color:#f0c040;border:1px solid rgba(241,196,15,.35);border-radius:6px;padding:1px 7px;font-weight:700;">🌐 외국인 · '+lbl+(p.country?' · '+_esc(p.country):'')+'</span>';
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
  _sosLocated().forEach(p=>{
    const pos=new kakao.maps.LatLng(p.lat,p.lng);
    // 정확도 원(±오차반경) — 위치가 '이 범위 안'임을 시각화
    const acc=Math.max(parseInt(p.acc)||0,15);
    try{
      const circ=new kakao.maps.Circle({center:pos,radius:acc,strokeWeight:1.5,strokeColor:'#ff3b30',strokeOpacity:.85,strokeStyle:'shortdash',fillColor:'#ff3b30',fillOpacity:.13});
      circ.setMap(mapR);_sosOvs.push(circ);
    }catch(e){}
    // 작은 도트 + 이름(정확도 표기)
    const el=document.createElement('div');
    el.className='sos-pin';
    el.innerHTML=`<span class="sos-dot">🆘</span><span class="sos-lbl">${_esc((p.name||'조난자').slice(0,8))} ±${acc}m</span>`;
    el.addEventListener('click',e=>{e.stopPropagation();_sosPinPopup(p.id);});
    const ov=new kakao.maps.CustomOverlay({position:pos,content:el,clickable:true,yAnchor:1.15,zIndex:10});
    ov.setMap(mapR);_sosOvs.push(ov);
  });
}
function _sosPinPopup(id){
  const p=(_sosPings||[]).find(x=>x.id===id);if(!p)return;
  window._sosPopupId=id; // 스냅샷 갱신 시 이 대화만 갱신(입력 보존)
  const has=p.lat&&p.lng;
  const mm=p.ts?Math.round((Date.now()-(p.ts||0))/60000):null;
  const html=`
    <div style="background:#0b1c30;border:1px solid rgba(231,76,60,.4);border-radius:11px;padding:13px 15px;margin-bottom:10px;">
      <div style="font-size:16px;font-weight:800;color:#ff8a73;">🆘 ${_esc(p.name||'익명 조난자')}</div>
      ${_sosForeignBadge(p)?`<div style="margin-top:5px;">${_sosForeignBadge(p)}</div>`:''}
      ${p.msg?`<div style="font-size:13px;color:#e0edf8;margin-top:6px;line-height:1.5;">${_esc(p.msg)}</div>`:''}
      ${has?`<div style="font-size:11px;color:#8ab4cc;margin-top:8px;font-family:monospace;">📍 ${(+p.lat).toFixed(6)}, ${(+p.lng).toFixed(6)}<br>정확도 ±${p.acc||'?'}m · ${mm}분 전 수신 · ${_sosAtStr(p)}</div>`:`<div style="font-size:11px;color:#ffd24d;margin-top:8px;">⚪ 아직 위치 미수신 — 대화는 가능합니다</div>`}
    </div>
    ${has?`<div style="display:flex;gap:6px;">
      <button onclick="_sosFocus('${p.id}')" style="flex:1;background:rgba(79,168,208,.12);color:#4fa8d0;border:1px solid rgba(79,168,208,.35);border-radius:8px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;">🗺️ 위치로 이동</button>
      <button onclick="sosToRescue('${p.id}')" style="flex:1;background:linear-gradient(180deg,#e74c3c,#c0392b);color:#fff;border:none;border-radius:8px;padding:11px;font-size:13px;font-weight:800;cursor:pointer;">🚨 구조 사고로 등록</button>
    </div>`:''}
    <div style="margin-top:10px;background:#0b1c30;border:1px solid rgba(255,255,255,.08);border-radius:11px;padding:10px;">
      <div style="font-size:12px;font-weight:700;color:#7dd3fa;margin-bottom:7px;">💬 조난자와 대화 <span style="font-size:10px;color:#5a7e98;font-weight:400;">상대 화면에 실시간 표시</span></div>
      <div id="sosTeamChat" style="max-height:230px;overflow-y:auto;margin-bottom:8px;">${_sosChatBubbles(p.msgs||[],'t')}</div>
      <div style="display:flex;gap:6px;">
        <input id="sosTeamChatIn" placeholder="메시지 입력" style="flex:1;min-width:0;box-sizing:border-box;background:#060d1a;border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:8px;padding:10px;font-size:14px;" onkeydown="if(event.key==='Enter')_sosTeamSend('${p.id}')">
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
function _sosShareUrl(tok){const u=_sosVictimUrl(tok);if(navigator.share)navigator.share({title:'설악산 구조대 위치전송',text:'[설악산 구조대] 아래 1회용 링크를 열면 위치가 구조대에 전송됩니다(로그인 불필요).\n'+u}).catch(()=>{});}
function _sosSms(tok){const u=_sosVictimUrl(tok);location.href='sms:?body='+encodeURIComponent('[설악산 구조대] 아래 1회용 링크를 열어 위치를 보내주세요(로그인 불필요): '+u);}
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
  document.getElementById('topTitle').textContent='신규 구조 접수 (1보)';
  document.getElementById('bnav').style.display='none';
  showV('v-report');renderPhaseBar(0,1);render1BoForm(prefill);
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
const OTA_VER='2026.06.29.22';                         // ← 현재 번들 버전 (릴리스마다 올림 · build-ota.sh가 ota.json에 반영)
const OTA_MANIFEST='https://109yoon.github.io/seoraksan/ota.json';
let _otaInfo=null;
function _otaPlugin(){try{return (window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.CapacitorUpdater)||null;}catch(e){return null;}}
function _isNativeApp(){try{return !!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());}catch(e){return false;}}
async function _otaCheck(manual){
  const plug=_otaPlugin();
  if(!_isNativeApp()||!plug){ if(manual)toast('웹은 새로고침으로 자동 갱신됩니다(앱 전용 기능)'); return; }
  let m;
  try{ const r=await fetch(OTA_MANIFEST+'?t='+Date.now(),{cache:'no-store'}); m=await r.json(); }
  catch(e){ if(manual)toast('⚠️ 업데이트 확인 실패 (네트워크)'); return; }
  if(!m||!m.version||!m.url){ if(manual)toast('업데이트 정보 없음'); return; }
  if(String(m.version)===String(OTA_VER)){ _otaInfo=null;_otaBanner(); if(manual)toast('✅ 최신 버전입니다 ('+OTA_VER+')'); return; }
  _otaInfo=m; _otaBanner();
  if(manual)_otaApply();
}
async function _otaApply(){
  const plug=_otaPlugin(); if(!plug||!_otaInfo)return;
  _otaClearCountdown();
  const _m=document.getElementById('otaModal');if(_m)_m.remove();
  try{
    toast('⬇️ 업데이트 받는 중… 잠시만요 (완료되면 자동 재시작)',8000);
    const b=await plug.download({url:_otaInfo.url,version:String(_otaInfo.version)});
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
  el.innerHTML='<div style="background:#0f2034;border:1px solid rgba(79,168,208,.3);border-radius:18px;max-width:340px;width:100%;padding:24px 20px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.6);">'
    +'<div style="font-size:40px;">🔄</div>'
    +'<div style="font-size:18px;font-weight:800;color:#e0edf8;margin-top:8px;">새 버전이 있습니다</div>'
    +(_otaInfo.notes?'<div style="font-size:12px;color:#9bbdd4;margin-top:8px;line-height:1.6;">'+_esc(_otaInfo.notes)+'</div>':'')
    +'<div id="otaCountTxt" style="font-size:11px;color:#5a8aaa;margin-top:12px;"><b style="color:#7dd3fa;">5초</b> 후 자동으로 업데이트됩니다</div>'
    +'<button onclick="_otaApply()" style="width:100%;margin-top:16px;padding:14px;border:none;border-radius:12px;background:linear-gradient(180deg,#4fa8d0,#1a6e9e);color:#fff;font-size:15px;font-weight:800;cursor:pointer;">지금 업데이트</button>'
    +'<button onclick="_otaDismiss()" style="width:100%;margin-top:8px;padding:12px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:none;color:#9bbdd4;font-size:13px;font-weight:600;cursor:pointer;">나중에 하기</button>'
    +'</div>';
  document.body.appendChild(el);
  // 5초 카운트다운 → 자동 업데이트
  _otaClearCountdown();
  var left=5;
  _otaCountTimer=setInterval(function(){
    left--;
    var t=document.getElementById('otaCountTxt');
    if(left>0){ if(t)t.innerHTML='<b style="color:#7dd3fa;">'+left+'초</b> 후 자동으로 업데이트됩니다'; }
    else{ _otaClearCountdown(); if(document.getElementById('otaModal'))_otaApply(); }
  },1000);
}
function _otaInit(){
  if(!_isNativeApp())return;
  const plug=_otaPlugin();
  if(plug&&plug.notifyAppReady){try{plug.notifyAppReady();}catch(e){}} // 현재 번들 정상 표시(미호출 시 다음 실행 롤백)
  setTimeout(function(){_otaCheck(false);},4000); // 시작 후 조용히 확인 → 있으면 가운데 팝업
}

window.onload=function(){
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
        ls.style.opacity='0';
        ls.style.display='flex';
        ls.style.pointerEvents='none';
        requestAnimationFrame(function(){requestAnimationFrame(function(){
          ls.style.transition='opacity .3s';ls.style.opacity='1';ls.style.pointerEvents='auto';
        });});
      }
      window.hideLoginScreen=function hideLoginScreen(){
        var ls=document.getElementById('loginScreen');
        window._loginVisible=false; // 로그인 완료 → 즉시 미표시로 간주 (페이드아웃 중 오판 방지)
        if(!ls||ls.style.display==='none')return;
        ls.style.pointerEvents='none';
        ls.style.transition='opacity .3s';ls.style.opacity='0';
        if(_hlTimer)clearTimeout(_hlTimer);
        _hlTimer=setTimeout(function(){_hlTimer=null;ls.style.display='none';ls.style.transition='';},350);
      }
      function checkAuth(){
        updateUserUI();
        var authType=(typeof DB!=='undefined'&&typeof _resolveAuthType==='function')?_resolveAuthType():'';
        if(!authType){showLoginScreen();}
        else{_checkAndRequireProfile();}
      }
      setTimeout(function(){
        var ls=document.getElementById('loadingScreen');
        if(ls){
          ls.style.pointerEvents='none';
          ls.style.transition='opacity .35s';ls.style.opacity='0';
          setTimeout(function(){
            if(ls.parentNode)ls.parentNode.removeChild(ls);
            checkAuth();
          },350);
        } else {
          checkAuth();
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
    div.style.cssText='display:flex;align-items:center;gap:8px;background:rgba(79,168,208,.08);border:1px solid rgba(79,168,208,.18);border-radius:9px;padding:8px 10px;flex-shrink:0;';
    div.innerHTML='<span style="font-size:15px;">'+cfg.ico+'</span>'
      +'<div style="flex:1;min-width:0;">'
        +'<div style="font-size:11px;font-weight:700;color:#4fa8d0;">'+cfg.title+'</div>'
        +'<div style="font-size:10px;color:#3a6a8a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+cfg.desc+'</div>'
      +'</div>'
      +(state!=='denied'?'<button onclick="_reqPerm(\''+type+'\')" style="flex-shrink:0;background:#1a3d5c;color:#4fa8d0;border:1px solid rgba(79,168,208,.3);border-radius:6px;padding:5px 11px;font-size:10px;font-weight:700;cursor:pointer;">허용</button>':'')
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
    }).catch(function(){});
    // 새 서비스워커가 활성화(업데이트)되면 자동 새로고침 → '며칠 전 버전에 멈춤' 방지(자가치유)
    navigator.serviceWorker.addEventListener('controllerchange',function(){
      if(!_hadController||window._swReloaded)return; // 첫 설치는 새로고침 안 함(루프 방지)
      window._swReloaded=true;location.reload();
    });
  }
  try{_otaInit();}catch(e){} // APK 자체 업데이트(OTA) 확인
  // 네이티브(APK): 알림 권한 먼저 요청 → 끝난 뒤 위치 권한 요청 (시스템 다이얼로그가 겹치지 않도록 순차 실행)
  Promise.resolve(_initNativePush()).catch(function(){}).then(function(){return _initNativeLocationPerm();}).catch(function(){});

  initFirebase(function(){
    initDB();
    if(window._KR){ initMaps(); } else { window._KCB=function(){initMaps();}; }
    updateSummary();updateUserUI();fetchWeather();
    try{setTimeout(_autoApplyCoordFix,3500);}catch(e){} // 표지판 좌표 자동 최신화(1회)
    try{if((DB.g('alertOps')||[]).some(o=>!o.closedAt))_startAlertReminder();}catch(e){}
    try{_startKmaWarnPoll();}catch(e){}
    const d=new Date();const days=['일','월','화','수','목','금','토'];
    document.getElementById('homeDate').textContent=d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일 ('+days[d.getDay()]+')';
    try{_initSosWatch();}catch(e){} // 🆘 조난·사고자 위치 실시간 구독 (early return 전에 보장)
    if(window._kakaoAuthCode){var _kc=window._kakaoAuthCode;window._kakaoAuthCode=null;_handleKakaoCode(_kc);return;}
    // Firebase 준비 후 FCM 토큰 갱신 (권한·SW·VAPID 모두 준비된 경우만)
    if('Notification' in window&&Notification.permission==='granted') _initFCM();
    _flushFcmToken(); // 네이티브 토큰이 Firebase 준비 전 등록됐으면 지금 저장
    // 모니터 거치용: 주소에 ?board=1 붙이면 켜자마자 상황판
    if(/[?&]board=1/.test(location.search))setTimeout(openBoard,300);
    if(window._hideLoading) window._hideLoading();
    // 이미 관리자 세션이면 과거 안전사고 데이터 1회 자동 반영 (아카이브 로드 후)
    try{setTimeout(_autoSeedAccidents,6000);}catch(e){}
  });
};

