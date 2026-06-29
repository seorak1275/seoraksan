'use strict';
// ══════════════════════════════════════════
// 작성자 관리
// ══════════════════════════════════════════
function _renderStaffQuickPick(){
  // 가입/작성자 설정 시 기존 직원 이름을 노출하지 않는다(개인정보·사칭 방지). 각자 직접 입력.
  const wrap=document.getElementById('staffQuickPick');
  if(wrap)wrap.style.display='none';
}
function openChangeUser(){
  const u=DB.g('currentUser')||{};
  const authType=DB.g('authType');
  const isKakao=authType==='kakao';
  const notApproved=isKakao&&u.approvalStatus!=='approved';
  const titleEl=document.getElementById('modalUserTitle');
  if(titleEl)titleEl.textContent=notApproved?'🆕 가입 신청':'👤 작성자 설정';
  // 승인코드 폐지 — 입력란 항상 숨김(승인은 관리자 멤버 지정으로만)
  const codeWrap=document.getElementById('uCodeWrap');
  if(codeWrap)codeWrap.style.display='none';
  document.getElementById('uNameIn').value=u.realName||u.name||'';
  const ds=document.getElementById('uDeptIn');if(ds)ds.value=u.dept||'';
  document.querySelectorAll('#rankPills .pill').forEach(p=>p.classList.remove('on'));
  if(u.rank){document.querySelectorAll('#rankPills .pill').forEach(p=>{if(p.textContent===u.rank)p.classList.add('on');});}
  const banner=document.getElementById('kakaoUserBanner');
  if(banner)banner.style.display=(u.kakaoId||u.kakaoImg)?'block':'none';
  _renderStaffQuickPick();
  document.getElementById('modalUser').classList.add('on');
}
async function _sha256(str){
  const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function doAdminLogin(){
  const pw=(document.getElementById('adminLoginPw').value||'').trim();
  if(!pw){toast('⚠️ 비밀번호를 입력하세요');return;}
  // 관리자 비밀번호 (해시 비교) — 기존 마스터 비밀번호도 비상용으로 유지
  const _ADMIN_PH='5ea963a2abe59fd456f6b4b2bcb7b095acdc2fbf8f3a460f949a5649187cb211';
  const _MASTER_PH='21fe2594c32497629b4b6e5da35e3e8d613f4453c29e3c6db6d68de6f1892894';
  const pwH=await _sha256(pw);
  if(pwH===_ADMIN_PH||pwH===_MASTER_PH){
    localStorage.setItem('_adminAuthed','1');
    const _cu=DB.g('currentUser')||{};
    if(_cu.kakaoId)DB.s('adminOwnerKakaoId',String(_cu.kakaoId));
    document.getElementById('adminLoginOverlay').style.display='none';
    document.getElementById('adminLoginPw').value='';
    var _g=document.getElementById('approvalGate');if(_g)_g.style.display='none'; // 관리자는 게이트 통과
    openApp('admin');
    try{setTimeout(_autoSeedAccidents,1500);}catch(e){} // 관리자 로그인 시 과거 안전사고 1회 자동 반영

  }else{
    toast('❌ 비밀번호가 틀렸습니다');
    document.getElementById('adminLoginPw').value='';
    document.getElementById('adminLoginPw').focus();
  }
}
function adminLogout(){
  localStorage.removeItem('_adminAuthed');
  goHome();
  toast('관리자 로그아웃');
}
function isAdminUser(){
  // 토큰 admin 클레임(허용목록 기반) 또는 기존 비밀번호 인증(전환기 폴백) 둘 다 인정
  return localStorage.getItem('_adminAuthed')==='1'
      || localStorage.getItem('_tokenAdmin')==='1'
      || _authRole==='admin';
}
// ── 멤버십(접근권한) 판정 — _acl 단일 기준 ──
// 멤버/관리자만 앱 사용 가능. 외부기관은 별도 경로(자체 제한)라 통과시킨다.
function _isMember(){
  if(isExternal&&typeof isExternal==='function'&&isExternal())return true; // 외부기관: 자체 제한 적용
  if(isAdminUser())return true;
  if(_authRole==='member'||_authRole==='admin')return true;   // 토큰 클레임
  if(localStorage.getItem('_memberOk')==='1')return true;      // 이전에 멤버 확인됨(오프라인 보호)
  var u=DB.g('currentUser')||{};
  if(u.kakaoId){var acl=_getAcl();var id=String(u.kakaoId);if(acl.members.indexOf(id)>=0||acl.admins.indexOf(id)>=0)return true;}
  return false;
}
// 멤버 확인 시 호출 — 오프라인 재방문에도 잠기지 않도록 플래그 저장
function _markMemberOk(){try{localStorage.setItem('_memberOk','1');}catch(e){}}
// 접근 게이트: 카카오 로그인 + 프로필 완료 + 멤버 아님 → 전체 차단 화면 표시
function _enforceAccessGate(){
  var gate=document.getElementById('approvalGate');if(!gate)return;
  var authType=(typeof _resolveAuthType==='function')?_resolveAuthType():'';
  var u=DB.g('currentUser')||{};
  var isKakao=authType==='kakao';
  var profileDone=!!(u.dept&&u.rank&&(u.realName||u.name));
  // 카카오 사용자가 프로필까지 끝냈는데 멤버가 아니면 차단. 그 외(미로그인·외부·프로필 미완)는 각 흐름이 처리.
  if(isKakao&&profileDone&&!_isMember()){
    // 자동 승인 모드: 대기 없이 스스로 멤버 등록 후 바로 입장
    if(_isAutoApprove()&&(u.kakaoId||_authKakaoId)){
      _aclSelfApprove(u.kakaoId||_authKakaoId);
      gate.style.display='none';
      try{closeM('modalUser');}catch(e){}
      return false;
    }
    // 수동 승인 대기 화면을 최상단에 표시(로그인·프로필 모달 닫고 게이트만 남김)
    try{closeM('modalUser');}catch(e){}
    try{if(window.hideLoginScreen)window.hideLoginScreen();}catch(e){}
    var idEl=document.getElementById('approvalGateId');
    if(idEl)idEl.innerHTML='이름: <b style="color:#cfe2f2;">'+_esc(u.realName||u.name||'-')+'</b> · '+_esc(u.dept||'')+'<br>내 카카오 ID: <b style="color:#cfe2f2;">'+(u.kakaoId||_authKakaoId||'?')+'</b><br><span style="color:#5a8aaa;">이 ID를 관리자에게 전달하면 승인됩니다</span>';
    gate.style.display='flex';
    _startApprovalPoll(); // 승인되면 재로그인 없이 자동 입장
    return true; // 차단됨
  }
  _stopApprovalPoll();
  gate.style.display='none';
  return false;
}
// "승인 확인" 버튼 — 토큰 재발급 후 멤버면 게이트 해제
function _recheckApproval(){
  toast('승인 상태 확인 중...');
  _ensureMemberAuth().then(function(ok){
    if(ok||_isMember()){
      _markMemberOk();
      document.getElementById('approvalGate').style.display='none';
      try{updateUserUI();}catch(e){}
      try{goHome();}catch(e){}
      toast('✅ 승인 확인됨 — 환영합니다');
    }else{
      toast('⚠️ 아직 승인되지 않았습니다. 관리자에게 요청하세요');
    }
  });
}
function saveUser(){
  const name=document.getElementById('uNameIn').value.trim();
  if(!name){toast('⚠️ 이름을 입력해주세요');return;}
  const dept=document.getElementById('uDeptIn').value;
  const rank=getSelPills('rankPills')[0]||'';
  if(!dept){toast('⚠️ 소속 과/분소를 선택해주세요');return;}
  if(!rank){toast('⚠️ 직위를 선택해주세요');return;}
  const existing=DB.g('currentUser')||{};
  // 승인은 관리자가 직원 탭에서 '멤버' 지정으로만 부여(승인코드 제거). 여기선 프로필만 저장.
  const saved={...existing,realName:name,name,dept,rank};
  DB.s('currentUser',saved);
  _notifyNewJoiner(saved);
  window._requireProfile=false;
  window._needsCode=false;
  closeM('modalUser');
  updateUserUI();
  toast('✅ 저장: '+name);
  try{renderSettings();}catch(e){}
  // 프로필 저장 완료 → 멤버 승인 여부 확인(미승인이면 대기 화면)
  try{_enforceAccessGate();}catch(e){}
}
function _notifyNewJoiner(u){
  const all=DB.g('pendingUsers')||[];
  const uid=String(u.kakaoId||u.name||Date.now());
  const prev=all.find(function(p){return p.id===uid;});
  const status=u.approvalStatus||(prev&&prev.approvalStatus)||'pending';
  const filtered=all.filter(function(p){return p.id!==uid;});
  filtered.push({
    id:uid,realName:u.realName,name:u.name,dept:u.dept,rank:u.rank,
    kakaoId:u.kakaoId||null,kakaoImg:u.kakaoImg||null,
    approvalStatus:status,
    submittedAt:(prev&&prev.submittedAt)||Date.now(),
    seen:(prev&&prev.seen)||false
  });
  DB.s('pendingUsers',filtered);
}

function _renderPendingList(){
  var list=(DB.g('pendingUsers')||[]).slice().reverse().slice(0,20);
  if(!list.length)return'<div style="font-size:11px;color:#4a7090;padding:8px 0;">새 가입자 없음</div>';
  return list.map(function(u){return'<div style="background:#060d1a;border:1px solid rgba(79,168,208,.15);border-radius:8px;padding:10px;margin-bottom:7px;'+(u.seen?'opacity:.55':'')+'">'+(!u.seen?'<div style="font-size:9px;color:#4fa8d0;font-weight:700;margin-bottom:4px;">NEW</div>':'')+
    '<div style="font-size:12px;color:#e0edf8;font-weight:700;">'+_esc(u.realName||u.name)+' <span style="font-weight:400;color:#7a9cb8;">· '+_esc(u.dept||'')+' · '+_esc(u.rank||'')+'</span></div>'+
    '<div style="font-size:10px;color:#4a7090;margin-top:2px;">닉네임: '+_esc(u.name)+' · '+(u.submittedAt?new Date(u.submittedAt).toLocaleDateString('ko-KR'):'')+' 가입</div>'+
    '<button onclick="_markSeen(\''+_escq(u.id)+'\')" style="margin-top:6px;background:rgba(79,168,208,.1);color:#4fa8d0;border:1px solid rgba(79,168,208,.2);padding:5px 10px;border-radius:6px;font-size:10px;cursor:pointer;">확인 완료</button>'+
  '</div>';}).join('');
}
function _markSeen(id){
  var list=DB.g('pendingUsers')||[];
  var idx=list.findIndex(function(p){return p.id===id;});
  if(idx>=0){list[idx].seen=true;DB.s('pendingUsers',list);}
  renderAdmSys();
}
function _getUnseenCount(){
  return(DB.g('pendingUsers')||[]).filter(function(p){return!p.seen;}).length;
}
// 아직 승인(_acl 등록) 안 된 가입 신청자 목록
function _pendingNotApproved(){
  var acl=_getAcl();
  return(DB.g('pendingUsers')||[]).filter(function(u){
    if((u.approvalStatus||'pending')==='approved')return false;
    var id=String(u.kakaoId||'');
    if(id&&(acl.members.indexOf(id)>=0||acl.admins.indexOf(id)>=0))return false; // 이미 멤버/관리자
    return true;
  });
}
// 홈 관리자 버튼 배지(미승인 신청 건수) 갱신
function _updateAdminBadge(n){
  var b=document.getElementById('admBadge');if(!b)return;
  if(n>0){b.textContent=n>99?'99+':String(n);b.style.display='block';}
  else b.style.display='none';
}
// 관리자 기기: 새 가입 신청이 들어오면 알림(첫 동기화 배치는 배지만, 이후 신규만 토스트)
var _joinerAlertInited=false;
function _checkNewJoinerAlert(){
  var pend=_pendingNotApproved();
  if(!isAdminUser()){_updateAdminBadge(0);return;}
  // 자동 승인 모드면 관리자 기기에서 대기자를 즉시 일괄 승인(본인 기기 부재 대비 이중 안전장치)
  if(_isAutoApprove()&&pend.length){try{if(_autoApproveSweep()>0){pend=_pendingNotApproved();try{renderAdmMembers();}catch(e){}}}catch(e){}}
  _updateAdminBadge(pend.length);
  var alerted={};try{alerted=JSON.parse(localStorage.getItem('_joinerAlerted')||'{}');}catch(e){}
  var fresh=pend.filter(function(u){return!alerted[String(u.id)];});
  if(fresh.length){
    fresh.forEach(function(u){alerted[String(u.id)]=1;});
    try{localStorage.setItem('_joinerAlerted',JSON.stringify(alerted));}catch(e){}
    if(_joinerAlertInited){ // 첫 로드 폭주 방지: 초기 동기화분은 알림 생략
      var names=fresh.map(function(u){return u.realName||u.name||'신규';}).join(', ');
      toast('🔔 새 멤버 승인 요청: '+names);
      try{_showSystemNoti('새 멤버 승인 요청: '+names+' — 직원 탭에서 멤버 지정','🔔');}catch(e){}
    }
  }
  _joinerAlertInited=true;
}
// 외부기관 관리 행 HTML
function _extAgencyRowsHtml(){
  return _getExtAgencies().map(function(a){
    return `<div class="extAgRow" style="display:flex;gap:6px;margin-bottom:6px;align-items:center;">
      <input class="fi extAgName" value="${_esc(a.name||'')}" placeholder="기관명 (예: 설악산악구조대)" style="flex:1.4;font-size:12px;">
      <input class="fi extAgCode" value="${_esc((a.code||'').toUpperCase())}" placeholder="코드" style="flex:1;font-family:monospace;font-size:13px;letter-spacing:1px;">
      <button onclick="this.closest('.extAgRow').remove()" style="background:rgba(192,57,43,.12);color:#c0392b;border:none;border-radius:7px;padding:8px 10px;font-size:13px;cursor:pointer;flex-shrink:0;">✕</button>
    </div>`;
  }).join('');
}
function addExtAgencyRow(){
  const wrap=document.getElementById('extAgencyListWrap');if(!wrap)return;
  const div=document.createElement('div');
  div.className='extAgRow';div.style.cssText='display:flex;gap:6px;margin-bottom:6px;align-items:center;';
  div.innerHTML=`<input class="fi extAgName" value="" placeholder="기관명 (예: 설악산악구조대)" style="flex:1.4;font-size:12px;">
    <input class="fi extAgCode" value="" placeholder="코드" style="flex:1;font-family:monospace;font-size:13px;letter-spacing:1px;">
    <button onclick="this.closest('.extAgRow').remove()" style="background:rgba(192,57,43,.12);color:#c0392b;border:none;border-radius:7px;padding:8px 10px;font-size:13px;cursor:pointer;flex-shrink:0;">✕</button>`;
  wrap.appendChild(div);
  const ni=div.querySelector('.extAgName');if(ni)ni.focus();
}
function saveExtAgencies(){
  const rows=[...document.querySelectorAll('#extAgencyListWrap .extAgRow')];
  const list=[];const seen={};
  for(const r of rows){
    const _n=r.querySelector('.extAgName');const name=(_n?_n.value:'').trim();
    const _c=r.querySelector('.extAgCode');const code=(_c?_c.value:'').trim().toUpperCase();
    if(!name&&!code)continue; // 빈 행 무시
    if(!name||!code){toast('⚠️ 기관명과 코드를 모두 입력하세요');return;}
    if(seen[code]){toast('⚠️ 코드 중복: '+code);return;}
    seen[code]=1;list.push({name,code});
  }
  if(!list.length){toast('⚠️ 최소 1개 기관을 등록하세요');return;}
  DB.s('extAgencies',list);
  // 구버전 키도 첫 기관으로 동기화 (타임라인 등 잔존 참조 호환)
  DB.s('extAgencyDisplayName',list[0].name);
  DB.s('extAgencyCode',list[0].code);
  toast('✅ 외부기관 '+list.length+'곳 저장됨');
}
function saveGeminiKey(){
  const _gk=document.getElementById('geminiKeyInp');const key=(_gk?_gk.value:'').trim();
  if(!key){toast('⚠️ API 키를 입력하세요');return;}
  DB.s('geminiApiKey',key);
  toast('✅ Gemini API 키 저장됨');
}
function saveKmaProxy(){
  const _kp=document.getElementById('kmaProxyInp');let url=(_kp?_kp.value:'').trim();
  if(url&&!/^https?:\/\//.test(url)){toast('⚠️ https:// 로 시작하는 주소를 입력하세요');return;}
  url=url.replace(/\/+$/,''); // 끝 슬래시 제거
  DB.s('kmaProxyUrl',url);
  _weatherFetched=false;_wDetailCache=null; // 캐시 비우고 다음 조회부터 적용
  try{fetchWeather();}catch(e){}
  toast(url?'✅ 기상청 프록시 저장됨 — 날씨 새로고침':'✅ 프록시 해제됨');
}
function saveFcmCfg(){
  const _fu=document.getElementById('fcmUrlInp');const url=(_fu?_fu.value:'').trim();
  const _fs=document.getElementById('fcmSecInp');const sec=(_fs?_fs.value:'').trim();
  DB.s('fcmPushUrl',url);DB.s('fcmPushSecret',sec);
  toast('✅ 푸시 설정 저장됨');_refreshFcmStatus();
}
async function _refreshFcmStatus(){
  const el=document.getElementById('fcmStatus');if(!el)return;
  const customUrl=(DB.g('fcmPushUrl')||'').trim();
  const url=_FCM_PUSH_URL||customUrl; // 내장값 우선
  const Cap=window.Capacitor,native=!!(Cap&&Cap.isNativePlatform&&Cap.isNativePlatform());
  let line=native?'📱 이 기기: 네이티브(APK) — 푸시 수신 가능':'🌐 이 기기: 웹 브라우저 — 앱이 열려 있을 때만 알림';
  line+=`<br>발송기: ${url?(customUrl?'✅ 설정됨 (직접 지정)':'✅ 자동 (내장)'):'❌ 미설정'}`;
  if(_fdb){
    try{
      const snap=await _fdb.collection('fcmTokens').get();
      let me=false;snap.forEach(d=>{if(d.id===_MY_DEVICE_ID)me=true;});
      line+=`<br>등록된 기기: <b>${snap.size}대</b>${me?' (내 기기 포함 ✅)':' — 내 기기 미등록, 알림 권한을 허용하세요'}`;
    }catch(e){line+='<br>등록 기기 조회 실패';}
  }
  el.innerHTML=line;
}
// 관리자가 직접 작성한 내용으로 전 직원에게 푸시 발송
async function sendCustomPush(){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const url=_FCM_PUSH_URL||(DB.g('fcmPushUrl')||'').trim();
  if(!url){toast('⚠️ 발송기 URL 미설정');return;}
  const title=(document.getElementById('pushTitleInp')?.value||'설악산 현장관리').trim()||'설악산 현장관리';
  const body=(document.getElementById('pushBodyInp')?.value||'').trim();
  if(!body){toast('⚠️ 보낼 내용을 입력하세요');document.getElementById('pushBodyInp')?.focus();return;}
  if(!confirm('전 직원에게 푸시를 발송합니다.\n\n제목: '+title+'\n내용: '+body+'\n\n발송할까요?'))return;
  toast('📨 푸시 발송 중…');
  try{
    const snap=await _fdb.collection('fcmTokens').get();
    const tokens=[];snap.forEach(d=>{const v=d.data()||{};if(v.token)tokens.push(v.token);});
    if(!tokens.length){toast('⚠️ 등록된 기기가 없습니다');return;}
    const res=await fetch(url,{method:'POST',headers:{'content-type':'text/plain;charset=utf-8'},
      body:JSON.stringify({secret:_FCM_PUSH_SECRET||(DB.g('fcmPushSecret')||''),title,body,data:{app:'home'},tokens})});
    const out=await res.json().catch(()=>({}));
    if(out.error){toast('❌ 발송기 오류: '+out.error);}
    else{
      toast(`✅ ${out.sent||0}대 발송 완료${out.invalid&&out.invalid.length?` · 무효 ${out.invalid.length}`:''}`);
      const b=document.getElementById('pushBodyInp');if(b)b.value='';
    }
  }catch(e){toast('❌ 발송 실패: '+e.message);}
}

function updateUserUI(){
  const u=DB.g('currentUser')||{};
  const ne=document.getElementById('myName');
  const se=document.getElementById('mySub');
  const av=document.getElementById('myAvatar');
  if(ne)ne.textContent=u.name||'작성자를 선택하세요';
  const parts=[];if(u.dept)parts.push(u.dept);if(u.rank)parts.push(u.rank);
  const authType=DB.g('authType');
  if(se)se.textContent=parts.join(' · ')||'탭하여 설정';
  // 아바타: 카카오 프로필 사진 or 이니셜
  if(av){
    if(u.kakaoImg){
      av.innerHTML=`<img src="${_esc(u.kakaoImg)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.textContent='👤'">`;
    } else {
      const initial=u.name?u.name.charAt(0):'👤';
      av.textContent=initial;
    }
  }
  // 외부기관 모드: 제한된 메뉴 표시
  const ext=authType==='external';
  document.body.classList.toggle('ext-mode',ext);
}

// ══════════════════════════════════════════
// 재난/구조 — 지도
// ══════════════════════════════════════════
let selResId=null,curResId=null,resFilter='전체';
let resTypeF=new Set(),resStatusF=new Set();
let _resListTab='all'; // 'all'|'rescue'|'haz'
// ── 필터 상태 유지: 화면 전환·앱 재시작 후에도 마지막 필터 복원 ──
function _persistFilters(){
  try{
    localStorage.setItem('_filt_v1',JSON.stringify({
      resType:[...resTypeF],resStatus:[...resStatusF],resTab:_resListTab,
      facStatus:(typeof facMapStatusF!=='undefined'?[...facMapStatusF]:[]),
      facType:(typeof facMapTypeF!=='undefined'?[...facMapTypeF]:[]),
      facLoc:(typeof facMapLocF!=='undefined'?[...facMapLocF]:[]),
      facSort:(typeof facListSort!=='undefined'?facListSort:'default')
    }));
  }catch(e){}
}
function _restoreFilters(){
  try{
    const j=JSON.parse(localStorage.getItem('_filt_v1')||'{}');
    if(j.resType)resTypeF=new Set(j.resType);
    if(j.resStatus)resStatusF=new Set(j.resStatus);
    if(j.resTab)_resListTab=j.resTab;
    if(typeof facMapStatusF!=='undefined'&&j.facStatus)facMapStatusF=new Set(j.facStatus);
    if(typeof facMapTypeF!=='undefined'&&j.facType)facMapTypeF=new Set(j.facType);
    if(typeof facMapLocF!=='undefined'&&j.facLoc)facMapLocF=new Set(j.facLoc);
    if(typeof facListSort!=='undefined'&&j.facSort)facListSort=j.facSort;
  }catch(e){}
}
function _resDefaultDates(){const t=today();const f=new Date();f.setMonth(f.getMonth()-1);return{from:f.toISOString().slice(0,10),to:t};}
const _rd=_resDefaultDates();
let resDateFrom=_rd.from,resDateTo=_rd.to;
let resFacCatH=new Set(),resFacCatF=new Set();
const _RES_DEFAULT_CATS=['🏠 분소','🛖 탐방지원센터','🪧 다목적위치표지판','🏠 대피소'];
// Facility overlay pool: created once, show/hide on filter changes
var _rFacPool=new Map(); // String(id) → {ov, el, type, lat, lng}
var _rEvOvs=[],_rEvEls=[]; // event overlays only (rescues + hazards)
var _rTeamOvs=[],_rTeamEls=[],_rTeamConnLines=[]; // team position markers + connector lines
var _rFocusResId=null; // currently focused rescue id (focus mode)
var _rFocusPolylines=[]; // route polylines for focus mode
var _rRouteCache={}; // cacheKey → {path,duration,distance,fallback}
var _rRouteInfo={}; // {resId:[{carMin,carKm,walkMin,walkKm},...]}}
function _buildRFacEl(f){
  const el=document.createElement('div');el.className='mpin-num';
  if(f.type.includes('다목적위치표지판')){
    const code=(f.name.match(/\d[\d\-]*\d|\d/)||[f.name.slice(0,6)])[0];
    el.textContent=code;el.title=f.name;
    el.onclick=e=>{e.stopPropagation();toast('📍 '+f.name);};
  }else if(f.type.includes('장소')){
    el.style.cssText='background:rgba(20,10,40,.88);border-color:rgba(180,100,255,.7);color:#d4a0ff;';
    el.textContent=f.name;el.title=f.name;
    el.onclick=e=>{e.stopPropagation();toast('📍 '+f.name+(f.loc?' ('+f.loc+')':''));};
  }else if(f.type.includes('대피소')){
    el.style.cssText='background:rgba(8,30,20,.88);border-color:rgba(39,174,96,.7);color:#7de8a8;';
    el.textContent=f.name;el.title=f.name;
    el.onclick=e=>{e.stopPropagation();toast('🏠 '+f.name+(f.loc?' ('+f.loc+')':''));};
  }else{
    el.style.cssText='background:rgba(20,20,40,.88);border-color:rgba(150,150,200,.7);color:#c8c8e8;';
    el.textContent=f.name;el.title=f.name;
    el.onclick=e=>{e.stopPropagation();toast(f.type.split(' ')[0]+' '+f.name+(f.loc?' ('+f.loc+')':''));};
  }
  return el;
}
function _syncRFacPool(){
  if(!mapR)return;
  const _rm=DB.g('catFacMeta')||{};
  const all=(DB.g('facilities')||[]).filter(f=>f.lat&&f.lng&&f.type&&(_rm[f.type]||{}).rescue);
  const validIds=new Set(all.map(f=>String(f.id)));
  // Remove pool entries whose facility was deleted or lost rescue status
  _rFacPool.forEach((entry,id)=>{
    if(!validIds.has(id)){try{entry.ov.setMap(null);}catch(e){}_rFacPool.delete(id);}
  });
  // Add only genuinely new entries — no lat/lng comparison to avoid float precision mismatches
  all.forEach(f=>{
    if(_rFacPool.has(String(f.id)))return;
    const el=_buildRFacEl(f);
    const ov=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(f.lat,f.lng),content:el,clickable:true});
    _rFacPool.set(String(f.id),{ov,el,type:f.type});
  });
  _applyRFacFilter();
}
function _applyRFacFilter(){
  if(!mapR)return;
  // Pool already guarantees rescue=true — only apply the user's category show/hide filter
  const facEls=[];
  _rFacPool.forEach(entry=>{
    const t=entry.type;
    const show=_RES_DEFAULT_CATS.includes(t)?!resFacCatH.has(t):resFacCatF.has(t);
    entry.ov.setMap(show?mapR:null);
    if(show)facEls.push(entry.el);
  });
  rOvs=[..._rEvOvs,...[..._rFacPool.values()].map(e=>e.ov)];
  rEls=[..._rEvEls,...facEls];
  if(mapR)_scaleOvs(rEls,mapR.getLevel(),5);
}
function _resDateOk(dateStr){
  if(!resDateFrom&&!resDateTo)return true;
  const d=(dateStr||'').slice(0,10);
  if(resDateFrom&&d<resDateFrom)return false;
  if(resDateTo&&d>resDateTo)return false;
  return true;
}
function renderRescueMap(){
  if(!mapR)return;
  // Clear event overlays only — facility pool is reused
  _rEvOvs.forEach(o=>{try{o.setMap(null);}catch(e){}});_rEvOvs=[];_rEvEls=[];
  // Clear team markers + connector lines
  _rTeamOvs.forEach(o=>{try{o.setMap(null);}catch(e){}});_rTeamOvs=[];_rTeamEls=[];
  _rTeamConnLines.forEach(p=>{try{p.setMap(null);}catch(e){}});_rTeamConnLines=[];
  _updateResFilterPanels();
  const _showRes=resTypeF.size===0||resTypeF.has('🚨구조');
  const _showHaz=resTypeF.size===0||resTypeF.has('⚠️위험상황');
  const _stOkRes=s=>resStatusF.size===0||(resStatusF.has('진행중')&&s==='ongoing')||(resStatusF.has('종료')&&s==='done');
  const _stOkHaz=s=>{const active=!s||s==='미조치'||s==='조치중';return resStatusF.size===0||(resStatusF.has('진행중')&&active)||(resStatusF.has('종료')&&!active);};
  // 구조 이력 핀
  const _resAll=DB.g('rescues')||[];
  // 하루·유형별 사고 번호: 같은 날 같은 유형이 2건 이상이면 '안전사고1·2·3…' 부여 (전 상태 통산)
  const _dtg={};_resAll.forEach(x=>{const k=(x.type||'')+'|'+((x.date||'').slice(0,10));(_dtg[k]=_dtg[k]||[]).push(x);});
  Object.values(_dtg).forEach(g=>g.sort((a,b)=>(a.id||0)-(b.id||0)));
  const _accNum=r=>{const k=(r.type||'')+'|'+((r.date||'').slice(0,10));const g=_dtg[k]||[];return g.length<2?(r.type||'사고'):(r.type||'사고')+(g.findIndex(x=>x.id===r.id)+1);};
  if(_showRes)_resAll.forEach(r=>{
    if(!r.lat||!r.lng)return;
    if(!_stOkRes(r.status))return;
    if(!_resDateOk(r.date))return;
    const isOg=r.status==='ongoing';const ti=RES_TYPES[r.type]||RES_TYPES['기타'];
    const el=document.createElement('div');
    if(isOg){
      // 진행중: 클러스터 없이 개별 — 읽기 쉬운 빨간 칩(아이콘+유형+당일번호)
      el.className='res-chip-og';
      el.innerHTML=`${ti.ico} <span>${_esc(_accNum(r))}</span>`;
    }else{
      el.className=`mpin ${ti.pc} p-done`;el.innerHTML=ti.ico;
    }
    el.dataset.ev='1';
    el.dataset.rid=String(r.id);
    let _ts=null;
    el.addEventListener('touchstart',e=>{_ts={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
    el.addEventListener('touchend',e=>{
      if(!_ts)return;const dx=e.changedTouches[0].clientX-_ts.x,dy=e.changedTouches[0].clientY-_ts.y;_ts=null;
      if(Math.abs(dx)<8&&Math.abs(dy)<8){e.stopPropagation();e.preventDefault();
        if(isOg&&r.teams&&r.teams.length)enterFocusMode(r.id);else openResPopup(r.id,'rescue');}
    });
    el.addEventListener('click',e=>{e.stopPropagation();
      if(isOg&&r.teams&&r.teams.length)enterFocusMode(r.id);else openResPopup(r.id,'rescue');});
    const ov=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(r.lat,r.lng),content:el,clickable:true,zIndex:isOg?8:3});
    ov._lat=r.lat;ov._lng=r.lng;ov._noClus=isOg; // 진행중 구조는 클러스터 제외 + 최상단
    ov.setMap(mapR);_rEvOvs.push(ov);_rEvEls.push(el);
  });
  // 위험상황 핀
  if(_showHaz)(DB.g('hazards')||[]).forEach(h=>{
    if(!h.lat||!h.lng)return;
    if(!_stOkHaz(h.hazStatus))return;
    if(!_resDateOk(h.date))return;
    const done=h.hazStatus&&h.hazStatus!=='미조치'&&h.hazStatus!=='조치중';
    const el=document.createElement('div');el.className=`mpin p-haz${done?' p-done':''}`;el.innerHTML='⚠️';
    let _ts=null;
    el.addEventListener('touchstart',e=>{_ts={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
    el.addEventListener('touchend',e=>{if(!_ts)return;const dx=e.changedTouches[0].clientX-_ts.x,dy=e.changedTouches[0].clientY-_ts.y;_ts=null;if(Math.abs(dx)<8&&Math.abs(dy)<8){e.stopPropagation();e.preventDefault();openResPopup(h.id,'hazard');}});
    el.addEventListener('click',e=>{e.stopPropagation();openResPopup(h.id,'hazard');});
    const ov=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(h.lat,h.lng),content:el,clickable:true});
    ov._lat=h.lat;ov._lng=h.lng;
    ov.setMap(mapR);_rEvOvs.push(ov);_rEvEls.push(el);
  });
  // 사고/위험 상황 핀 클러스터링 (밀집 시 개수 버블로 묶음 — 시설물은 제외)
  _rEvItems=_rEvOvs.map(ov=>({ov,lat:ov._lat,lng:ov._lng,noClus:ov._noClus}));
  try{_reclusterRescue();}catch(e){}
  // 🆘 조난자 위치 핀 (클러스터 제외, 최상단, 맥동)
  try{_drawSosPins();}catch(e){}
  // 팀 위치 마커: 진행중 구조 팀의 현재 위치
  _rebuildTeamChips();
  // 시설물: 풀 동기화 후 필터 적용 (DOM 재생성 없이 show/hide)
  _syncRFacPool();
  // Focus mode: apply dimming to non-focused overlays
  if(_rFocusResId){
    _applyFocusDim();
    _drawFocusRoutes(_rFocusResId);
  }
  updateSummary();
}

// ══════════════════════════════════════════
// 포커스 모드: 사고 탭 → 팀 경로 + 진행 패널
// ══════════════════════════════════════════
const TEAM_COLORS=['#4fa8d0','#27ae60','#e67e22','#9b59b6'];
// 지도 칩용 팀 이름 축약: 특수산악구조대 1팀 → 특구대 1팀
function _shortTeamName(n){
  let s=String(n||'');
  Object.entries(DEPT_SHORT).forEach(([k,v])=>{s=s.split(k).join(v);});
  s=s.replace('탐방지원센터','센터');
  return s.length>10?s.slice(0,10)+'…':s;
}
function _teamIco(t){return t.type==='heli'?'🚁':t.type==='vehicle'?'🚐':'🥾';}

// 진행중 구조의 팀 위치 칩 마커를 모두 지우고 다시 그림
function _rebuildTeamChips(){
  _rTeamOvs.forEach(o=>{try{o.setMap(null);}catch(e){}});_rTeamOvs=[];_rTeamEls=[];
  _rTeamConnLines.forEach(p=>{try{p.setMap(null);}catch(e){}});_rTeamConnLines=[];
  if(!mapR)return;
  (DB.g('rescues')||[]).filter(r=>r.status==='ongoing'&&r.teams&&r.teams.length).forEach(rescue=>{
    rescue.teams.forEach((team,ti)=>{
      const cur=team.wps&&team.wps[team.wpIdx>=0?team.wpIdx:0];
      if(!cur||!cur.lat||!cur.lng)return;
      const typeIco=_teamIco(team);
      const col=TEAM_COLORS[ti%TEAM_COLORS.length];
      const el=document.createElement('div');
      el.className='team-chip';
      el.style.borderColor=col;el.style.color=col;
      el.innerHTML=`${typeIco} <span>${_shortTeamName(team.name)}</span>`;
      el.dataset.ev='1';el.dataset.rid=String(rescue.id);
      let _ts=null;
      el.addEventListener('touchstart',e=>{_ts={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
      el.addEventListener('touchend',ev=>{if(!_ts)return;const dx=ev.changedTouches[0].clientX-_ts.x,dy=ev.changedTouches[0].clientY-_ts.y;_ts=null;if(Math.abs(dx)<8&&Math.abs(dy)<8){ev.stopPropagation();ev.preventDefault();enterFocusMode(rescue.id);}});
      el.addEventListener('click',ev=>{ev.stopPropagation();enterFocusMode(rescue.id);});
      const ov=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(cur.lat,cur.lng),content:el,clickable:true,yAnchor:1.5,zIndex:4});
      ov.setMap(mapR);_rTeamOvs.push(ov);_rTeamEls.push(el);
      // 팀 위치 → 사고 위치 점선 연결 (연관성 표시)
      if(rescue.lat&&rescue.lng){
        try{
          const conn=new kakao.maps.Polyline({
            path:[new kakao.maps.LatLng(cur.lat,cur.lng),new kakao.maps.LatLng(rescue.lat,rescue.lng)],
            strokeWeight:2,strokeColor:'#ffffff',strokeOpacity:.65,strokeStyle:'shortdot',zIndex:2
          });
          conn.setMap(mapR);_rTeamConnLines.push(conn);
        }catch(e){}
      }
    });
  });
}

function _haversineKm(lat1,lng1,lat2,lng2){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function _fmtMin(min){
  if(min<60)return Math.round(min)+'분';
  const h=Math.floor(min/60),m=Math.round(min%60);
  return h+'시간'+(m>0?' '+m+'분':'');
}

async function _fetchCarRoute(key,fromLat,fromLng,toLat,toLng){
  if(_rRouteCache[key])return _rRouteCache[key];
  try{
    const url='https://apis-navi.kakaomobility.com/v1/directions?origin='+fromLng+','+fromLat+'&destination='+toLng+','+toLat+'&priority=RECOMMEND';
    const resp=await fetch(url,{headers:{'Authorization':'KakaoAK 4ba2cd810d516a4f336d4dee5fa5eba5'}});
    if(!resp.ok)throw new Error('HTTP '+resp.status);
    const d=await resp.json();
    const route=d.routes&&d.routes[0];
    if(!route||route.result_code!==0)throw new Error('no route');
    const sum=route.summary;
    const path=[];
    (route.sections||[]).forEach(sec=>{
      (sec.roads||[]).forEach(road=>{
        const vx=road.vertexes||[];
        for(let i=0;i+1<vx.length;i+=2)path.push(new kakao.maps.LatLng(vx[i+1],vx[i]));
      });
    });
    const result={path,duration:Math.round((sum.duration||0)/60),distance:+((sum.distance||0)/1000).toFixed(1),fallback:false};
    _rRouteCache[key]=result;
    return result;
  }catch(e){
    const km=+(_haversineKm(fromLat,fromLng,toLat,toLng)*1.35).toFixed(1);
    const result={path:null,duration:Math.round(km/45*60),distance:km,fallback:true};
    _rRouteCache[key]=result;
    return result;
  }
}

// 🚗 X분 X.Xkm · 🚶 X시간 X분 X.Xkm 형식 문자열
function _routeInfoStr(info,showWalk){
  const car=info.carMin!=null?(info.fallback?'🚗 약 ':'🚗 ')+_fmtMin(info.carMin)+' '+info.carKm+'km':'🚗 계산중…';
  const walk=showWalk&&info.walkKm?' · 🚶 '+_fmtMin(info.walkMin)+' '+info.walkKm+'km':'';
  return car+walk;
}

function _renderFocusPanelRouteInfo(resId){
  const infos=_rRouteInfo[resId]||[];
  infos.forEach((info,ti)=>{
    const el=document.getElementById('rinfo-'+resId+'-'+ti);
    if(!el||!info)return;
    el.textContent=_routeInfoStr(info,true);
    el.style.color=info.fallback?'rgba(240,192,64,.55)':'rgba(240,192,64,.85)';
  });
}

function _getBaseByName(name){
  return Object.values(SEORAK_BASES).find(b=>b.name===name)||null;
}
// 도로 접근 가능한 거점 중 사고지점에서 가장 가까운 곳 (대피소 등 도보전용 제외)
function _nearestBase(lat,lng){
  if(!(lat&&lng))return null;
  let best=null,bd=Infinity;
  Object.values(SEORAK_BASES).forEach(b=>{
    if(/대피소/.test(b.name||''))return; // 대청봉대피소 등 차량 진입 불가 → 제외
    if(!(b.lat&&b.lng))return;
    const d=_haversineKm(lat,lng,b.lat,b.lng);
    if(d<bd){bd=d;best=b;}
  });
  return best?Object.assign({},best,{distKm:bd}):null;
}

function _applyFocusDim(){
  const fid=String(_rFocusResId);
  // Event markers: dim if not the focused rescue
  _rEvEls.forEach(el=>{
    const isMe=el.dataset&&el.dataset.rid===fid;
    el.style.opacity=isMe?'1':'0.12';
  });
  // Team markers: dim if not the focused rescue
  _rTeamEls.forEach(el=>{
    const rid=el.dataset&&el.dataset.rid;
    el.style.opacity=rid===fid?'1':'0.12';
  });
  // Facility pool: dim all
  _rFacPool.forEach(entry=>{entry.el.style.opacity='0.12';});
}

function _clearFocusDim(){
  _rEvEls.forEach(el=>{el.style.opacity='';});
  _rTeamEls.forEach(el=>{el.style.opacity='';});
  _rFacPool.forEach(entry=>{entry.el.style.opacity='';});
}

function _clearFocusPolylines(){
  _rFocusPolylines.forEach(p=>{try{p.setMap(null);}catch(e){}});
  _rFocusPolylines=[];
}

function _drawFocusRoutes(resId){
  _clearFocusPolylines();
  if(!mapR||!resId)return;
  const rescue=(DB.g('rescues')||[]).find(r=>r.id===resId);
  if(!rescue||!rescue.teams)return;
  const bounds=new kakao.maps.LatLngBounds();
  if(rescue.lat&&rescue.lng)bounds.extend(new kakao.maps.LatLng(rescue.lat,rescue.lng));
  if(!_rRouteInfo[resId])_rRouteInfo[resId]=[];

  rescue.teams.forEach((team,ti)=>{
    const col=TEAM_COLORS[ti%TEAM_COLORS.length];
    const wps=team.wps||[];
    if(!wps.length)return;
    const baseWp=wps.find(w=>w.isBase);
    const baseCoords=baseWp?_getBaseByName(baseWp.name):null;
    const trailPts=wps.filter(w=>!w.isBase&&w.lat&&w.lng);
    if(!trailPts.length)return;

    // Walk distance: 상행 구간만 합산 (하산은 역순 중복이므로 제외) × 등산로 보정계수
    const ascPts=trailPts.filter(w=>!w.descent);
    let walkKm=0;
    for(let i=1;i<ascPts.length;i++)walkKm+=_haversineKm(ascPts[i-1].lat,ascPts[i-1].lng,ascPts[i].lat,ascPts[i].lng);
    walkKm=+(walkKm*1.45).toFixed(1);
    const walkMin=Math.round(walkKm/2.5*60);
    _rRouteInfo[resId][ti]={carMin:null,carKm:null,walkMin,walkKm,fallback:true};

    // Car segment: draw dashed placeholder immediately, then fetch actual road geometry
    if(baseCoords){
      const tp0=trailPts[0];
      const placeholder=new kakao.maps.Polyline({
        path:[new kakao.maps.LatLng(baseCoords.lat,baseCoords.lng),new kakao.maps.LatLng(tp0.lat,tp0.lng)],
        strokeWeight:3,strokeColor:'#f0c040',strokeOpacity:.5,strokeStyle:'shortdash',map:mapR
      });
      _rFocusPolylines.push(placeholder);
      bounds.extend(new kakao.maps.LatLng(baseCoords.lat,baseCoords.lng));
      bounds.extend(new kakao.maps.LatLng(tp0.lat,tp0.lng));

      // Base label
      const baseLbl=document.createElement('div');
      baseLbl.style.cssText='background:rgba(10,20,40,.9);border:1px solid #f0c040;border-radius:8px;padding:2px 7px;font-size:10px;font-weight:700;color:#f0c040;white-space:nowrap;pointer-events:none;';
      baseLbl.textContent='🏠 '+(baseWp.name||'').replace('탐방지원센터','').replace('설악산국립공원사무소','공단사무소').slice(0,8);
      const baseOv=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(baseCoords.lat,baseCoords.lng),content:baseLbl,yAnchor:1.5,zIndex:5});
      baseOv.setMap(mapR);_rFocusPolylines.push(baseOv);

      // Async: fetch actual car route
      const cacheKey=baseCoords.lat+','+baseCoords.lng+'>'+tp0.lat+','+tp0.lng;
      _fetchCarRoute(cacheKey,baseCoords.lat,baseCoords.lng,tp0.lat,tp0.lng).then(result=>{
        if(_rFocusResId!==resId||!mapR)return;
        if(_rRouteInfo[resId]&&_rRouteInfo[resId][ti]){
          _rRouteInfo[resId][ti].carMin=result.duration;
          _rRouteInfo[resId][ti].carKm=result.distance;
          _rRouteInfo[resId][ti].fallback=result.fallback;
        }
        if(!result.fallback&&result.path&&result.path.length>1){
          try{placeholder.setMap(null);}catch(e){}
          const roadLine=new kakao.maps.Polyline({
            path:result.path,strokeWeight:4,strokeColor:'#f0c040',strokeOpacity:.9,strokeStyle:'solid',map:mapR
          });
          _rFocusPolylines.push(roadLine);
        }else{
          // Fallback: show dashed line at full opacity
          try{placeholder.setStrokeOpacity(.75);}catch(e){}
        }
        _renderFocusPanelRouteInfo(resId);
      });
    }

    // Walk segment: 흰 점선(경로 윤곽) + 팀 색상 실선 (시인성 향상)
    if(trailPts.length>=2){
      const walkPath=trailPts.map(w=>new kakao.maps.LatLng(w.lat,w.lng));
      // 흰 점선 밑 레이어 — 배경 대비용
      const whiteLine=new kakao.maps.Polyline({
        path:walkPath,strokeWeight:7,strokeColor:'#ffffff',strokeOpacity:.22,strokeStyle:'solid',map:mapR
      });
      _rFocusPolylines.push(whiteLine);
      // 팀 색상 실선 위 레이어
      const walkLine=new kakao.maps.Polyline({
        path:walkPath,strokeWeight:4,strokeColor:col,strokeOpacity:.92,strokeStyle:'solid',map:mapR
      });
      _rFocusPolylines.push(walkLine);
      walkPath.forEach(p=>bounds.extend(p));

      // 각 표지판 위치에 점 마커 + 번호 라벨 (하산 중복 좌표는 1회만)
      const curWpIdx=team.wpIdx>=0?team.wpIdx:0;
      const seenPos=new Set();
      wps.forEach((w,wi)=>{
        if(w.isBase||!w.lat||!w.lng)return;
        const isCur=wi===curWpIdx;
        const key=w.lat.toFixed(6)+','+w.lng.toFixed(6);
        if(seenPos.has(key)&&!isCur)return;
        seenPos.add(key);
        const isPassed=wi<curWpIdx;
        const dotEl=document.createElement('div');
        if(isCur){
          dotEl.style.cssText=`width:14px;height:14px;border-radius:50%;background:${col};border:2.5px solid #fff;box-shadow:0 0 0 3px ${col}55,0 0 12px ${col}99;animation:wpPulse 1.4s ease-in-out infinite;pointer-events:none;`;
        }else{
          dotEl.style.cssText=`width:9px;height:9px;border-radius:50%;background:${isPassed?col+'99':'rgba(255,255,255,.6)'};border:1.5px solid ${isPassed?col:'rgba(255,255,255,.85)'};pointer-events:none;`;
        }
        const dotOv=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(w.lat,w.lng),content:dotEl,zIndex:isCur?7:6});
        dotOv.setMap(mapR);_rFocusPolylines.push(dotOv);
        // 표지판 번호 라벨: 전체 표시 (현재·사고지점은 강조, 나머지는 작게)
        if(w.code||w.isTarget||w.isHosp){
          const lbl=document.createElement('div');
          const _nm=(w.name||'').replace(/^\d{2}-\d{2}\s*/,'').trim();  // 이름 앞 코드 중복 제거
          const txt=w.isHosp?'🏥 '+w.name:(w.code||'')+((isCur||w.isTarget)&&_nm&&_nm!==w.code?' '+_nm.slice(0,8):'');
          if(isCur||w.isTarget||w.isHosp){
            const bc=isCur?col:w.isHosp?'#27ae60':'#e05050';
            lbl.style.cssText=`background:rgba(8,18,36,.93);border:1.5px solid ${bc};border-radius:7px;padding:2px 6px;font-size:10px;font-weight:700;color:${bc};white-space:nowrap;pointer-events:none;`;
          }else{
            lbl.style.cssText='background:rgba(8,18,36,.78);border:1px solid rgba(255,255,255,.25);border-radius:5px;padding:1px 4px;font-size:9px;font-weight:600;color:rgba(255,255,255,.82);white-space:nowrap;pointer-events:none;font-family:monospace;';
          }
          lbl.textContent=txt;
          const lblOv=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(w.lat,w.lng),content:lbl,yAnchor:1.9,zIndex:isCur?8:5});
          lblOv.setMap(mapR);_rFocusPolylines.push(lblOv);
        }
      });
    }else if(trailPts.length===1){
      bounds.extend(new kakao.maps.LatLng(trailPts[0].lat,trailPts[0].lng));
    }

    // (팀 이름 라벨은 팀 칩이 같은 자리에 이미 표시되므로 별도 라벨 생략)
  });

  _focusBounds=bounds;
  _fitFocusBounds();
}
// 포커스 모드: 하단 패널에 경로가 가리지 않도록 패널 높이만큼 아래 여백을 줘서 맞춤
let _focusBounds=null;
function _fitFocusBounds(){
  if(!mapR||!_focusBounds)return;
  const panel=document.getElementById('focusModePanel');
  const mapEl=document.getElementById('mapRescue');
  const mh=(mapEl&&mapEl.offsetHeight)||window.innerHeight||600;
  let bpad=Math.round(mh*0.42); // 패널 미표시 시 기본값
  if(panel&&panel.classList.contains('on')&&panel.offsetHeight>0){
    bpad=Math.min(panel.offsetHeight+24,Math.round(mh*0.72)); // 패널 높이 + 여유 (과도 방지 상한)
  }
  try{mapR.setBounds(_focusBounds,50,40,bpad,40);}catch(e){}
}

let _fpTeamOpen=new Set(); // 펼쳐진 팀 카드 인덱스
function _fpToggleTeam(ti){_fpTeamOpen.has(ti)?_fpTeamOpen.delete(ti):_fpTeamOpen.add(ti);if(_rFocusResId)_renderFocusPanel(_rFocusResId);}

function _renderFocusPanel(resId){
  const panel=document.getElementById('focusModePanel');
  const titleEl=document.getElementById('focusPanelTitle');
  const teamsEl=document.getElementById('focusPanelTeams');
  if(!panel||!titleEl||!teamsEl)return;
  const rescue=(DB.g('rescues')||[]).find(r=>r.id===resId);
  if(!rescue){exitFocusMode();return;}
  const _elp=_elapsedStr(rescue.date);
  titleEl.innerHTML='🔴 '+_esc(rescue.title)+(_elp?` <span class="js-elapsed" data-d="${_esc(rescue.date)}" style="color:#f0a500;font-size:10px;font-weight:700;">⏱ ${_elp}</span>`:'');
  const teams=rescue.teams||[];
  // 보고서·타임라인 버튼 (상단 고정)
  const actionBtns=`<div style="display:flex;gap:6px;margin-bottom:10px;">
    <button onclick="selResId=${resId};curResId=${resId};viewReport();" style="flex:1;padding:7px 0;border-radius:8px;border:1px solid rgba(79,168,208,.3);background:rgba(79,168,208,.1);color:#4fa8d0;font-size:11px;font-weight:700;cursor:pointer;">📄 보고서</button>
    <button onclick="selResId=${resId};curResId=${resId};viewTimeline();" style="flex:1;padding:7px 0;border-radius:8px;border:1px solid rgba(79,168,208,.3);background:rgba(79,168,208,.1);color:#4fa8d0;font-size:11px;font-weight:700;cursor:pointer;">📍 타임라인</button>
    <button onclick="selResId=${resId};curResId=${resId};endSit();" style="flex:none;padding:7px 10px;border-radius:8px;border:1px solid rgba(39,174,96,.3);background:rgba(39,174,96,.08);color:#27ae60;font-size:11px;font-weight:700;cursor:pointer;">✅ 종료</button>
  </div>`;
  if(!teams.length){
    teamsEl.innerHTML=actionBtns+'<div style="font-size:11px;color:rgba(255,255,255,.35);text-align:center;padding:12px 0;">팀 없음 — 타임라인에서 팀 생성</div>';
    panel.classList.add('on');return;
  }
  const stagePal=[
    {c:'rgba(255,255,255,.4)',label:'출발'},
    {c:'#4fa8d0',label:'이동중'},
    {c:'#f0a500',label:'환자조우'},
    {c:'#27ae60',label:'하산'},
  ];
  const rInfos=_rRouteInfo[resId]||[];
  const teamCards=teams.map((team,ti)=>{
    const col=TEAM_COLORS[ti%TEAM_COLORS.length];
    const si=_teamStageIdx(team);
    const pal=stagePal[si]||stagePal[3];
    const typeIco=_teamIco(team);
    const total=Math.max(team.wps.length-1,1);
    const pct=Math.round((team.wpIdx/total)*100);
    const atEnd=team.wpIdx>=team.wps.length-1;
    const curWp=team.wps[team.wpIdx]||team.wps[0]||{};
    const curName=(curWp.code?curWp.code+' ':'')+(curWp.name||'').replace(/^\d{2}-\d{2}\s*/,'').slice(0,14);
    const info=rInfos[ti];
    const baseWp=team.wps.find(w=>w.isBase);
    const hasBase=baseWp&&_getBaseByName(baseWp.name);
    const tps=team.wps.filter(w=>!w.isBase&&w.lat&&w.lng);
    let routeStr='';
    if(hasBase){
      const body=info?_routeInfoStr(info,tps.length>1):'🚗 계산중…'+(tps.length>1?' · 🚶 …':'');
      routeStr=`<div id="rinfo-${resId}-${ti}" style="font-size:10px;color:rgba(240,192,64,${info?'.65':'.45'});margin-top:5px;padding-top:5px;border-top:1px solid rgba(255,255,255,.05);">${body}</div>`;
    }
    const isOpen=_fpTeamOpen.has(ti);
    // 세부정보: 구성원 + 경유지 목록
    let detailHtml='';
    if(isOpen){
      const mems=(team.members||[]);
      const memStr=mems.length?mems.map(m=>_esc(m)).join(' · '):'<span style="opacity:.4;">구성원 미입력</span>';
      const wpList=team.wps.map((w,wi)=>{
        const stIco=w.status==='passed'?'✅':w.status==='active'?'▶':w.status==='skipped'?'⏭':'⬜';
        const nm=(w.code?w.code+' ':'')+_esc((w.name||'-').replace(/^\d{2}-\d{2}\s*/,''));
        const timeStr=w.passedAt?` <span style="color:rgba(255,255,255,.3);font-size:9px;">${w.passedAt.slice(11,16)}</span>`:'';
        const flag=w.isBase?'🏠':w.isTarget?'🚨':w.descent?'🔽':'';
        return`<div style="display:flex;align-items:center;gap:5px;padding:2px 0;${wi===team.wpIdx?'background:rgba(79,168,208,.07);border-radius:4px;margin:0 -3px;padding:2px 3px;':''}"><span style="font-size:10px;flex-shrink:0;">${stIco}</span><span style="font-size:10px;color:rgba(255,255,255,.7);flex:1;">${flag?flag+' ':''} ${nm}</span>${timeStr}</div>`;
      }).join('');
      detailHtml=`<div style="margin-top:7px;padding-top:7px;border-top:1px solid rgba(255,255,255,.07);">
        <div style="font-size:10px;color:#4fa8d0;font-weight:700;margin-bottom:3px;">👥 구성원</div>
        <div style="font-size:11px;color:rgba(255,255,255,.65);margin-bottom:7px;">${memStr}</div>
        <div style="font-size:10px;color:#4fa8d0;font-weight:700;margin-bottom:3px;">📍 경유지</div>
        <div style="font-size:10px;line-height:1.8;">${wpList||'<span style="opacity:.4;">경유지 없음</span>'}</div>
        ${rescue.handover&&rescue.handover.team===team.name?`<div style="margin-top:5px;font-size:10px;color:#27ae60;">🤝 인계: ${_esc(rescue.handover.to)}</div>`:''}
      </div>`;
    }
    const hasDescent=team.wps.some(w=>w.descent);
    const actionBtn=(()=>{
      if(atEnd&&curWp.isTarget&&!hasDescent)return`<button onclick="_focusDescentTeam(${resId},${ti})" style="background:rgba(39,174,96,.15);border:1px solid rgba(39,174,96,.4);color:#27ae60;border-radius:7px;padding:4px 11px;font-size:11px;font-weight:700;cursor:pointer;">${team.type==='heli'?'🏥 이송':'🔽 하산'}</button>`;
      if(atEnd)return`<span style="font-size:10px;color:#27ae60;font-weight:700;">✓ ${hasDescent?(team.type==='heli'?'이송 완료':'하산 완료'):'완료'}</span>`;
      const canReturn=!hasDescent&&team.wpIdx>0&&!curWp.isTarget;
      return`${canReturn?`<button onclick="_focusReturnTeam(${resId},${ti})" style="background:rgba(230,126,34,.1);border:1px solid rgba(230,126,34,.3);color:#e67e22;border-radius:7px;padding:4px 8px;font-size:11px;font-weight:600;cursor:pointer;">↩️</button>`:''}<button onclick="_focusPassTeam(${resId},${ti})" style="background:rgba(79,168,208,.15);border:1px solid rgba(79,168,208,.35);color:#4fa8d0;border-radius:7px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;">▶ 통과</button>`;
    })();
    return `<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:10px 11px;margin-bottom:8px;">
      <div onclick="_fpToggleTeam(${ti})" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;cursor:pointer;user-select:none;">
        <span style="font-size:12px;font-weight:800;color:${col};">${typeIco} ${_esc(team.name)}</span>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:10px;font-weight:700;color:${pal.c};background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);padding:2px 8px;border-radius:10px;">${pal.label}</span>
          <span style="font-size:11px;color:rgba(255,255,255,.3);">${isOpen?'▾':'▸'}</span>
        </div>
      </div>
      <div style="height:5px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden;margin-bottom:6px;">
        <div style="height:100%;width:${pct}%;background:${col};border-radius:3px;transition:width .4s;"></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
        <span style="font-size:10px;color:rgba(255,255,255,.4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">📍 ${_esc(curName||'-')} · ${team.wpIdx}/${total}</span>
        <span style="display:flex;gap:5px;flex-shrink:0;">${actionBtn}</span>
      </div>
      ${routeStr}
      ${detailHtml}
    </div>`;
  }).join('');
  teamsEl.innerHTML=actionBtns+teamCards;
  // 전 팀 완료 배너
  if(teams.length>0&&teams.every(t=>_teamDone(t))){
    teamsEl.innerHTML+=`<div style="background:rgba(39,174,96,.12);border:1.5px solid rgba(39,174,96,.45);border-radius:12px;padding:14px 16px;margin-top:4px;text-align:center;">
      <div style="font-size:13px;font-weight:800;color:#27ae60;margin-bottom:6px;">🏁 전 팀 하산/이송 완료</div>
      <div style="font-size:11px;color:rgba(255,255,255,.45);margin-bottom:10px;">상황을 종료하시겠습니까?</div>
      <button onclick="selResId=${resId};curResId=${resId};endSit();" style="background:rgba(39,174,96,.2);border:1px solid rgba(39,174,96,.55);color:#27ae60;border-radius:8px;padding:8px 0;font-size:12px;font-weight:700;cursor:pointer;width:100%;">✅ 상황 종료</button>
    </div>`;
  }
  panel.classList.add('on');
}


function enterFocusMode(resId){
  if(!resId)return;
  _rFocusResId=resId;
  _rebuildTeamChips();
  _applyFocusDim();
  _drawFocusRoutes(resId);
  _renderFocusPanel(resId);
  // Close existing popup
  const popup=document.getElementById('resPopup');if(popup)popup.classList.remove('on');
  // 패널 슬라이드업(.3s) 후 실제 패널 높이로 경로 재맞춤 → 하단 가림 방지
  setTimeout(_fitFocusBounds,360);
}

function exitFocusMode(){
  _rFocusResId=null;
  _fpTeamOpen.clear();
  _clearFocusPolylines();
  _clearFocusDim();
  const panel=document.getElementById('focusModePanel');
  if(panel)panel.classList.remove('on');
}

function _focusPassTeam(resId,teamIdx){
  const _res=DB.g('rescues')||[];const _ri=_res.findIndex(x=>x.id===resId);
  if(_ri<0)return;
  const team=(_res[_ri].teams||[])[teamIdx];
  if(!team)return;
  const next=team.wpIdx+1;
  if(next>=team.wps.length){toast('✅ 경로 끝 — 통과할 지점 없음');return;}
  const passedWp=team.wps[team.wpIdx];
  if(passedWp){passedWp.status='passed';passedWp.passedAt=now();}
  team.wps[next].status='active';
  team.wpIdx=next;
  if(!_res[_ri].wpLog)_res[_ri].wpLog=[];
  const _d=new Date();
  _res[_ri].wpLog.push({time:_d.getHours().toString().padStart(2,'0')+':'+_d.getMinutes().toString().padStart(2,'0'),teamName:team.name,code:(passedWp&&passedWp.code)||'',wpName:(passedWp&&passedWp.name)||''});
  DB.s('rescues',_res);
  // Sync in-memory _tlTeams if same rescue is open in timeline
  if(_tlWpResId===resId&&_tlTeams[teamIdx]){
    _tlTeams[teamIdx]=Object.assign({},team,{collapsed:_tlTeams[teamIdx].collapsed});
    if(_tlSelTeam===teamIdx){_tlWps=_tlTeams[teamIdx].wps;_tlWpIdx=_tlTeams[teamIdx].wpIdx;}
  }
  const curWp=team.wps[next]||{};
  const wpLabel=(curWp.code?curWp.code+' ':'')+(curWp.name||'').slice(0,12);
  toast('✅ '+team.name+': '+(wpLabel||'통과'));
  if(next>=team.wps.length-1&&team.wps[next]&&team.wps[next].descent)_promptHandover(resId,team);
  _renderFocusPanel(resId);
  _checkAllTeamsDone(resId);
  try{_clearFocusPolylines();_drawFocusRoutes(resId);}catch(e){}
  _rebuildTeamChips();
  _applyFocusDim();
}

// 포커스 패널: 팀 데이터 변경 공통 처리 (DB 저장 + 타임라인 동기화 + 재렌더)
function _focusMutateTeam(resId,teamIdx,mutate){
  const _res=DB.g('rescues')||[];const _ri=_res.findIndex(x=>x.id===resId);
  if(_ri<0)return;
  const team=(_res[_ri].teams||[])[teamIdx];
  if(!team)return;
  if(!mutate(team))return;
  DB.s('rescues',_res);
  if(_tlWpResId===resId&&_tlTeams[teamIdx]){
    _tlTeams[teamIdx]=Object.assign({},team,{collapsed:_tlTeams[teamIdx].collapsed});
    if(_tlSelTeam===teamIdx){_tlWps=_tlTeams[teamIdx].wps;_tlWpIdx=_tlTeams[teamIdx].wpIdx;}
  }
  _renderFocusPanel(resId);
  try{_clearFocusPolylines();_drawFocusRoutes(resId);}catch(e){}
  _rebuildTeamChips();
  _applyFocusDim();
}

function _focusDescentTeam(resId,teamIdx){
  _focusMutateTeam(resId,teamIdx,team=>{
    if(!_appendDescentWps(team)){toast('⚠️ 환자 조우 후 가능');return false;}
    toast(team.type==='heli'?'🏥 '+team.name+': 병원 이송 시작':'🔽 '+team.name+': 하산 시작');
    return true;
  });
}

function _focusReturnTeam(resId,teamIdx){
  const _res=DB.g('rescues')||[];const _ri=_res.findIndex(x=>x.id===resId);
  const team=_ri>=0?(_res[_ri].teams||[])[teamIdx]:null;
  if(!team)return;
  if(!confirm(team.name+' 복귀(하산)시킬까요? 남은 상행 구간은 취소됩니다.'))return;
  _focusMutateTeam(resId,teamIdx,t=>{
    if(!_appendReturnWps(t)){toast('⚠️ 복귀 불가 상태');return false;}
    toast('↩️ '+t.name+': 복귀 경로 생성');
    return true;
  });
}

// ══════════════════════════════════════════
// 재난 목록 + 필터
// ══════════════════════════════════════════
function setResListTab(tab){
  _resListTab=tab;_persistFilters();
  ['all','rescue','haz'].forEach(t=>{
    const btn=document.getElementById('resListTab_'+t);
    if(!btn)return;
    const isOn=t===tab;
    const cols={all:['rgba(79,168,208,.35)','rgba(79,168,208,.15)','#4fa8d0'],rescue:['rgba(192,57,43,.4)','rgba(192,57,43,.18)','#e05050'],haz:['rgba(230,126,34,.4)','rgba(230,126,34,.18)','#e67e22']};
    const [bc,bg,col]=cols[t];
    btn.style.borderColor=isOn?bc:'rgba(255,255,255,.1)';
    btn.style.background=isOn?bg:'transparent';
    btn.style.color=isOn?col:'rgba(255,255,255,.3)';
  });
  renderResList();
}
let _resSearchQ='';
const _renderResListDebounced=_debounce(()=>renderResList(),250);
function onResSearch(v){
  _resSearchQ=(v||'').trim().toLowerCase();
  const clr=document.getElementById('resSearchClear');
  if(clr)clr.style.display=_resSearchQ?'block':'none';
  _renderResListDebounced();
}
function clearResSearch(){
  _resSearchQ='';
  const inp=document.getElementById('resSearchInput');if(inp)inp.value='';
  const clr=document.getElementById('resSearchClear');if(clr)clr.style.display='none';
  renderResList();
}
function _resMatchSearch(r){
  if(!_resSearchQ)return true;
  const hay=[r.title,r.vName,r.location,r.loc,r.author,r.type,r.hazType,r.cause,r.extAgency,r.repName]
    .filter(Boolean).join(' ').toLowerCase();
  return hay.includes(_resSearchQ);
}
let _resListLimit=50,_resListSig='';
function _moreResList(){_resListLimit+=50;renderResList();}
function renderResList(){
  const res=DB.g('rescues')||[];const haz=DB.g('hazards')||[];
  _updateResFilterPanels();
  const _showRes=(_resListTab==='all'||_resListTab==='rescue')&&(resTypeF.size===0||resTypeF.has('🚨구조'));
  const _showHaz=(_resListTab==='all'||_resListTab==='haz')&&(resTypeF.size===0||resTypeF.has('⚠️위험상황'));
  const _stOkRes=s=>resStatusF.size===0||(resStatusF.has('진행중')&&s==='ongoing')||(resStatusF.has('종료')&&s==='done');
  const _stOkHaz=s=>{const active=!s||s==='미조치'||s==='조치중';return resStatusF.size===0||(resStatusF.has('진행중')&&active)||(resStatusF.has('종료')&&!active);};
  const _dateOkL=d=>_resDateOk(d);
  // 필터·검색·탭이 바뀌면 페이지 한도를 처음(50)으로 리셋. '더 보기' 재호출 땐 유지.
  const _sig=_resListTab+'|'+[...resTypeF].join()+'|'+[...resStatusF].join()+'|'+resDateFrom+'|'+resDateTo+'|'+(_resSearchQ||'');
  if(_sig!==_resListSig){_resListSig=_sig;_resListLimit=50;}
  let cards=[];
  const _hdr=(txt,col)=>`<div style="display:flex;align-items:center;gap:7px;margin:4px 2px 7px;"><span style="font-size:11px;font-weight:800;color:${col};letter-spacing:.3px;">${txt}</span><div style="flex:1;height:1px;background:linear-gradient(90deg,${col}44,transparent);"></div></div>`;
  // 🆘 조난·사고자 위치 수신 — 별도 sos 컬렉션이라 목록 최상단에 노출(아직 사고 미등록 건만)
  if(_resListTab!=='haz'&&(_sosPings||[]).length){
    const _regIds=new Set((res||[]).map(r=>r.sosId).filter(Boolean));
    const _open=(_sosPings||[]).filter(p=>p.lat&&p.lng&&!_regIds.has(p.id)).sort((a,b)=>(b.ts||0)-(a.ts||0));
    if(_open.length){
      cards.push(_hdr('🆘 위치 수신 (미등록) '+_open.length,'#ffd24d'));
      _open.forEach(p=>{
        const mm=Math.round((Date.now()-(p.ts||0))/60000);
        cards.push(`<div class="lcard" onclick="_sosPinPopup('${p.id}')" style="position:relative;border-left:3px solid #ffe14d;">
          <div class="lico" style="background:#c0392b;border:none;color:#fff;">🆘</div>
          <div class="linfo">
            <div class="lname">🆘 ${_esc(p.name||'익명')} <span style="font-size:9px;color:#8ab4cc;font-weight:400;">±${p.acc||'?'}m · ${mm}분 전</span></div>
            ${_sosForeignBadge(p)?`<div style="margin-top:2px;">${_sosForeignBadge(p)}</div>`:''}
            ${p.msg?`<div class="lmeta" style="margin-top:2px;color:#cfe2f2;">${_esc(p.msg)}</div>`:''}
            <div class="lmeta" style="margin-top:2px;font-family:monospace;">${(+p.lat).toFixed(5)}, ${(+p.lng).toFixed(5)}</div>
            <button onclick="event.stopPropagation();sosToRescue('${p.id}')" style="margin-top:6px;padding:6px 12px;background:rgba(231,76,60,.15);border:1px solid rgba(231,76,60,.45);color:#ff6b5e;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">🚨 구조 사고로 등록</button>
          </div>
        </div>`);
      });
    }
  }
  // 진행중 구조를 상단에 별도 그룹으로 모아 일일 운영 시인성 강화
  if(_showRes){
    const _rescues=res.filter(r=>_stOkRes(r.status)&&_dateOkL(r.date)&&_resMatchSearch(r)).slice().reverse();
    const _og=_rescues.filter(r=>r.status==='ongoing');
    const _dn=_rescues.filter(r=>r.status!=='ongoing');
    const _mkCard=r=>{
      const isOg=r.status==='ongoing';const ti=RES_TYPES[r.type]||RES_TYPES['기타'];
      const hasCoord=!!(r.lat&&r.lng);
      return `<div class="lcard" onclick="openResListDetail(${r.id})" style="position:relative;border-left:3px solid ${isOg?'#e74c3c':'#27ae60'};">
        <div class="lico" style="background:${isOg?ti.color:'#1a3a1a'};border:none;color:#fff;">${ti.ico}</div>
        <div class="linfo">
          <div class="lname">🚨 ${_esc(r.title)}</div>
          ${(r.extAgency||(r.mobilize&&r.mobilize.length))?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:3px;">
            ${r.extAgency?`<span style="font-size:9px;background:rgba(255,120,30,.18);color:#f08050;border:1px solid rgba(255,120,30,.35);border-radius:9px;padding:1px 7px;font-weight:700;">🚒 ${_esc(r.extAgency)}</span>`:''}
            ${(r.mobilize&&r.mobilize.length)?`<span style="font-size:9px;background:rgba(231,76,60,.18);color:#e74c3c;border:1px solid rgba(231,76,60,.4);border-radius:9px;padding:1px 7px;font-weight:700;">🚨 ${_esc(r.mobilize.join('·'))}</span>${_mobilizeCompactBadge(r)}`:''}
          </div>`:''}
          <div class="lmeta" style="margin-top:3px;">${_esc(r.type)} · ${r.date} · 사고자 ${_esc(r.vName||'미상')}${(r.victims2&&r.victims2.length)?` <span style="color:#e9897e;font-weight:700;">외 ${r.victims2.length}명</span>`:''}</div>
          ${hasCoord?`<button onclick="event.stopPropagation();viewOnMap(${r.lat},${r.lng})" style="margin-top:6px;padding:6px 12px;background:rgba(79,168,208,.12);border:1px solid rgba(79,168,208,.35);color:#4fa8d0;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;">🗺️ 지도보기</button>`:''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;align-self:flex-start;flex-shrink:0;">
          <span class="lbadge" style="background:${isOg?'rgba(231,76,60,.22)':'rgba(39,174,96,.2)'};color:${isOg?'#ff6b5e':'#3ad17a'};">${isOg?'진행중':'종료'}</span>
          ${isOg&&_elapsedStr(r.date)?`<span class="js-elapsed" data-d="${_esc(r.date)}" style="font-size:10px;font-weight:700;color:#f0a500;white-space:nowrap;">⏱ ${_elapsedStr(r.date)}</span>`:''}
        </div>
      </div>`;
    };
    if(_og.length)cards.push(_hdr('🔴 진행중 작전 '+_og.length,'#ff6b5e'),..._og.map(_mkCard));
    if(_dn.length)cards.push(_hdr('✅ 종료 '+_dn.length,'#3ad17a'),..._dn.map(_mkCard));
  }
  if(_showHaz){
    cards=cards.concat((haz.filter(h=>_stOkHaz(h.hazStatus)&&_dateOkL(h.date)&&_resMatchSearch(h))).slice().reverse().map(h=>{
      const done=h.hazStatus&&h.hazStatus!=='미조치'&&h.hazStatus!=='조치중';
      const hasCoord=!!(h.lat&&h.lng);
      return `<div class="haz-card ${done?'haz-removed':''}" onclick="openHazDetail(${h.id})" style="border-left:3px solid ${done?'#27ae60':'#e67e22'};">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="font-size:22px;">${h.hazType?.split(' ')[0]||'⚠️'}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;color:#e0edf8;font-weight:600;">${_esc(h.hazType||'위험상황')} · ${_esc(h.loc||'-')}${(h.mobilize&&h.mobilize.length)?` <span style="font-size:9px;background:rgba(231,76,60,.18);color:#e74c3c;border:1px solid rgba(231,76,60,.4);border-radius:9px;padding:1px 6px;font-weight:700;vertical-align:middle;">🚨 ${_esc(h.mobilize.join('·'))}</span>${_mobilizeCompactBadge(h)}`:''}</div>
            <div style="font-size:11px;color:#8ab4cc;margin-top:3px;">${h.dt||'-'} · ${_esc(h.danger||'-')} · ${_esc(h.author||'-')}</div>
            <div style="font-size:11px;color:#7a9cb8;margin-top:2px;">${_esc((h.desc||'').slice(0,40))}${(h.desc||'').length>40?'...':''}</div>
            ${hasCoord?`<button onclick="event.stopPropagation();viewOnMap(${h.lat},${h.lng})" style="margin-top:5px;padding:4px 10px;background:rgba(230,126,34,.12);border:1px solid rgba(230,126,34,.35);color:#e67e22;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;">🗺️ 지도보기</button>`:''}
          </div>
          <span class="lbadge ${done?'haz-badge-done':'haz-badge-active'}" style="align-self:flex-start;flex-shrink:0;">${_esc(h.hazStatus||'미조치')}</span>
        </div>
      </div>`;
    }));
  }
  const _tot=cards.length;
  let html=cards.slice(0,_resListLimit).join('');
  if(_tot>_resListLimit){
    html+=`<button onclick="_moreResList()" style="width:100%;margin-top:8px;padding:11px;border-radius:10px;border:1px solid rgba(79,168,208,.3);background:rgba(79,168,208,.08);color:#4fa8d0;font-size:13px;font-weight:700;cursor:pointer;">▾ 더 보기 (${_tot-_resListLimit}건 더)</button>`;
  }
  document.getElementById('resListWrap').innerHTML=html||'<div class="empty"><div class="empty-ico">📋</div><div class="empty-txt">해당 항목 없음</div><button onclick="resetResFilter()" style="margin-top:10px;padding:7px 16px;background:rgba(79,168,208,.12);border:1px solid rgba(79,168,208,.35);color:#4fa8d0;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">🔄 필터 초기화</button></div>';
}

// ══════════════════════════════════════════
// 재난 통계
// ══════════════════════════════════════════
// 평균 대응시간 분석 카드 (타임라인 타임스탬프 기반)
function _buildRespTimeCard(res){
  // 각 구조별 주요 시점 추출
  const arr=(res||[]).map(r=>{
    const t0=_parseDT(r.date);
    let tEnc=null,tDesc=null,tDone=null;
    (r.timetable||[]).forEach(e=>{
      const t=_parseDT(e.time);if(!t)return;
      const s=e.stage||'';
      if(/조우/.test(s)&&(!tEnc||t<tEnc))tEnc=t;
      if(/하산|이송|복귀/.test(s)&&(!tDesc||t<tDesc))tDesc=t;
      if(/처치완료|상황종료|완료/.test(s)&&(!tDone||t>tDone))tDone=t;
    });
    const tHand=_parseDT(r.handover&&r.handover.time);
    return {t0,tEnc,tDesc,tHand,tDone};
  });
  const avg=list=>{const v=list.filter(x=>x!=null&&x>=0&&x<48*60);return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):null;};
  const diffMin=(a,b)=>(a!=null&&b!=null&&b>=a)?Math.round((b-a)/60000):null;
  const encMins=arr.map(x=>diffMin(x.t0,x.tEnc));
  const careMins=arr.map(x=>diffMin(x.tEnc,x.tHand||x.tDone||x.tDesc));
  const totMins=arr.map(x=>diffMin(x.t0,x.tHand||x.tDone));
  const fmt=m=>m==null?'-':(m>=60?Math.floor(m/60)+'시간 '+(m%60)+'분':m+'분');
  const aEnc=avg(encMins),aCare=avg(careMins),aTot=avg(totMins);
  const nEnc=encMins.filter(x=>x!=null).length,nCare=careMins.filter(x=>x!=null).length,nTot=totMins.filter(x=>x!=null).length;
  if(!nEnc&&!nCare&&!nTot)return '';
  const cell=(label,val,n,col)=>`<div style="background:#060d1a;border-radius:8px;padding:9px 6px;text-align:center;">
    <div style="font-size:15px;font-weight:800;color:${col};line-height:1.2;">${fmt(val)}</div>
    <div style="font-size:9px;color:#7a9cb8;margin-top:3px;">${label}</div>
    <div style="font-size:8px;color:#3a6a8a;margin-top:1px;">n=${n}</div>
  </div>`;
  return `<div class="scard"><div class="stitle">⏱ 평균 대응시간</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;">
      ${cell('신고→환자조우',aEnc,nEnc,'#4fa8d0')}
      ${cell('환자조우→인계',aCare,nCare,'#e67e22')}
      ${cell('신고→상황종료',aTot,nTot,'#27ae60')}
    </div>
    <div style="font-size:9px;color:#3a6a8a;margin-top:7px;line-height:1.5;">※ 타임라인에 기록된 시각 기준. 단계 기록이 있는 건만 집계(n)됩니다.</div>
  </div>`;
}
function renderRescueStats(){
  document.getElementById('topTitle').textContent='재난/구조 관리';
  if(!window._rescueStatTab)window._rescueStatTab='rescue';
  const tab=window._rescueStatTab;
  const rsTabR=document.getElementById('rsTabRescue');
  const rsTabH=document.getElementById('rsTabHaz');
  if(rsTabR&&rsTabH){
    rsTabR.style.background=tab==='rescue'?'#3d0a0a':'#1a0a0a';
    rsTabR.style.color=tab==='rescue'?'#ff7070':'#e05050';
    rsTabH.style.background=tab==='haz'?'#3d1f00':'#1a1000';
    rsTabH.style.color=tab==='haz'?'#ffaa44':'#e67e22';
  }
  const res=DB.g('rescues')||[];const haz=DB.g('hazards')||[];
  const mon=today().slice(0,7);
  const safeMax=obj=>Math.max(...Object.values(obj),1);
  const hbar=(k,v,max,col='#4fa8d0')=>{
    const pct=Math.round(v/max*100);
    return `<div style="display:flex;align-items:center;gap:5px;margin-bottom:5px;">
      <div style="width:64px;font-size:9px;color:#9bbdd4;text-align:right;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${k}</div>
      <div style="flex:1;height:8px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${col};border-radius:4px;"></div>
      </div>
      <div style="width:22px;font-size:9px;color:${col};font-weight:700;text-align:right;flex-shrink:0;">${v}</div>
    </div>`;
  };
  const mini=(l,v,col='#e0edf8')=>`<div style="background:#060d1a;border-radius:7px;padding:6px 4px;text-align:center;"><div style="font-size:15px;font-weight:800;color:${col};line-height:1.2;">${v}</div><div style="font-size:8px;color:#3a6a8a;margin-top:1px;">${l}</div></div>`;
  const chartCard=(title,obj,col)=>{
    const entries=Object.entries(obj).sort((a,b)=>b[1]-a[1]);
    if(!entries.length)return '';
    const mx=safeMax(obj);
    return `<div class="scard"><div class="stitle">${title}</div>${entries.map(([k,v])=>hbar(k,v,mx,col)).join('')}</div>`;
  };
  const w=document.getElementById('rescueStatsWrap');
  // 엑셀 다운로드 카드: 날짜 범위 선택
  if(!window._statExpFrom){const d=new Date();window._statExpFrom=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01';}
  if(!window._statExpTo)window._statExpTo=today();
  const expCard=`<div class="scard" style="border-color:rgba(39,174,96,.25);">
    <div class="stitle" style="color:#27ae60;">📥 엑셀 다운로드</div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
      <input type="date" value="${window._statExpFrom}" onchange="window._statExpFrom=this.value"
        style="flex:1;background:#060d1a;border:1px solid rgba(255,255,255,.12);color:#b8d4e8;border-radius:7px;padding:7px 8px;font-size:12px;color-scheme:dark;">
      <span style="font-size:11px;color:#3a6a8a;flex-shrink:0;">~</span>
      <input type="date" value="${window._statExpTo}" onchange="window._statExpTo=this.value"
        style="flex:1;background:#060d1a;border:1px solid rgba(255,255,255,.12);color:#b8d4e8;border-radius:7px;padding:7px 8px;font-size:12px;color-scheme:dark;">
    </div>
    <button onclick="downloadStatsExcel('${tab}')"
      style="width:100%;padding:9px;border-radius:8px;background:rgba(39,174,96,.13);border:1px solid rgba(39,174,96,.4);color:#27ae60;font-size:12px;font-weight:700;cursor:pointer;">
      📥 ${tab==='rescue'?'구조보고':'위험상황'} 자료 다운로드 (.csv)
    </button>
  </div>`;
  if(tab==='rescue'){
    const injMap={},sevMap={},cauMap={},methodMap={},ageMap={},timeMap={'새벽(0-6시)':0,'오전(6-12시)':0,'오후(12-18시)':0,'저녁(18-24시)':0},genderMap={},loctypeMap={},weatherMap={};
    res.forEach(r=>{
      (r.injuryParts||[]).forEach(p=>{injMap[p]=(injMap[p]||0)+1;});
      if(r.severity)sevMap[r.severity]=(sevMap[r.severity]||0)+1;
      if(r.cause)cauMap[r.cause]=(cauMap[r.cause]||0)+1;
      (r.rescueMethod||[]).forEach(m=>{methodMap[m]=(methodMap[m]||0)+1;});
      if(r.vGender&&r.vGender!=='알수없음')genderMap[r.vGender]=(genderMap[r.vGender]||0)+1; // 미상은 차트에서 제외(타 화면과 일관)
      if(r.loctype)loctypeMap[r.loctype]=(loctypeMap[r.loctype]||0)+1;
      if(r.weather)weatherMap[r.weather]=(weatherMap[r.weather]||0)+1;
      {let age=r.vBirth?_ageFromBirth(r.vBirth):(r.vAge!=null&&r.vAge!==''?parseInt(r.vAge):'');if(age!==''&&!isNaN(age)){const ag=age<20?'10대 이하':age<30?'20대':age<40?'30대':age<50?'40대':age<60?'50대':age<70?'60대':'70대+';ageMap[ag]=(ageMap[ag]||0)+1;}}
      // 발생 시각: r.date("YYYY-MM-DD HH:MM" 또는 "...THH:MM")에서 시(時) 추출 (r.time 필드는 존재하지 않음)
      {const _tm=(r.date||'').match(/[ T](\d{1,2}):/);if(_tm){const h=parseInt(_tm[1],10);if(h<6)timeMap['새벽(0-6시)']++;else if(h<12)timeMap['오전(6-12시)']++;else if(h<18)timeMap['오후(12-18시)']++;else timeMap['저녁(18-24시)']++;}}
    });
    // 구조 월별 추이 (최근 6개월)
    const rMonMap={};
    res.forEach(r=>{if(r.date){const m=r.date.slice(0,7);rMonMap[m]=(rMonMap[m]||0)+1;}});
    const rMonSorted=Object.fromEntries(Object.entries(rMonMap).sort((a,b)=>a[0].localeCompare(b[0])).slice(-6));
    // 평균 대응시간 분석
    const respCard=_buildRespTimeCard(res);
    w.innerHTML=`
      ${expCard}
      <div class="scard">
        <div class="stitle">🚨 구조보고 현황</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;">
          ${mini('전체',res.length)}
          ${mini('진행중',res.filter(r=>r.status==='ongoing').length,'#e05050')}
          ${mini('종료',res.filter(r=>r.status==='done').length,'#27ae60')}
          ${mini('이번달',res.filter(r=>r.date&&r.date.startsWith(mon)).length,'#4fa8d0')}
        </div>
      </div>
      <div class="scard">
        <div class="stitle">🔥 사고 다발 구간 (히트맵)</div>
        <div id="heatMapEl" style="width:100%;height:280px;border-radius:9px;overflow:hidden;background:#060d1a;"></div>
        <div id="heatTopList" style="margin-top:8px;"></div>
      </div>
      ${respCard}
      ${chartCard('📈 월별 구조 발생 (최근 6개월)',rMonSorted,'#e05050')}
      ${chartCard('⏰ 발생 시간대',timeMap,'#4fa8d0')}
      ${chartCard('👤 연령대',ageMap,'#9b59b6')}
      ${chartCard('⚧ 성별',genderMap,'#3498db')}
      ${chartCard('🚑 구조유형',Object.fromEntries(Object.keys(RES_TYPES).map(t=>[t,res.filter(r=>r.type===t).length]).filter(([,v])=>v)),'#e05050')}
      ${chartCard('⚡ 사고원인',cauMap,'#e67e22')}
      ${chartCard('🦵 부상부위',injMap,'#c0392b')}
      ${chartCard('🩺 중증도',sevMap,'#8e44ad')}
      ${chartCard('🛟 구조방법',methodMap,'#27ae60')}
      ${chartCard('📍 장소구분',loctypeMap,'#1abc9c')}
      ${chartCard('🌤 날씨',weatherMap,'#f39c12')}
    `;
    setTimeout(()=>_renderHeatMap('rescue'),120);
  } else {
    const typMap={},statusMap={},monMap={};
    haz.forEach(h=>{
      if(h.hazType)typMap[h.hazType]=(typMap[h.hazType]||0)+1;
      if(h.hazStatus)statusMap[h.hazStatus]=(statusMap[h.hazStatus]||0)+1;
      if(h.date){const m=h.date.slice(0,7);monMap[m]=(monMap[m]||0)+1;}
    });
    const monSorted=Object.fromEntries(Object.entries(monMap).sort((a,b)=>a[0].localeCompare(b[0])).slice(-6));
    w.innerHTML=`
      ${expCard}
      <div class="scard">
        <div class="stitle">⚠️ 위험상황 현황</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;">
          ${mini('전체',haz.length)}
          ${mini('미조치',haz.filter(h=>h.hazStatus==='미조치').length,'#e05050')}
          ${mini('조치중',haz.filter(h=>h.hazStatus==='조치중').length,'#e67e22')}
          ${mini('완료',haz.filter(h=>h.hazStatus&&h.hazStatus!=='미조치'&&h.hazStatus!=='조치중').length,'#27ae60')}
        </div>
      </div>
      <div class="scard">
        <div class="stitle">🔥 사고 다발 구간 (히트맵)</div>
        <div id="heatMapEl" style="width:100%;height:280px;border-radius:9px;overflow:hidden;background:#060d1a;"></div>
        <div id="heatTopList" style="margin-top:8px;"></div>
      </div>
      ${chartCard('🪨 위험 유형',typMap,'#e67e22')}
      ${chartCard('📋 처리 현황',statusMap,'#3498db')}
      ${chartCard('📅 월별 발생 (최근 6개월)',monSorted,'#9b59b6')}
    `;
    setTimeout(()=>_renderHeatMap('haz'),120);
  }
}

// 통계 자료 엑셀(CSV) 다운로드: 날짜 범위 필터
// ── 사고 다발 구간 히트맵: 표지판 코드 기준으로 집계 (GPS 없어도 포함) ──
function _renderHeatMap(tab){
  const el=document.getElementById('heatMapEl');
  if(!el||!window._KR)return;
  const allData=(tab==='haz'?(DB.g('hazards')||[]):(DB.g('rescues')||[]));
  if(!allData.length){el.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:11px;color:rgba(255,255,255,.25);">기록 없음</div>';return;}

  // 표지판 코드 맵 구성 (01-05 → {lat,lng,name})
  const facs=DB.g('facilities')||[];
  const signMap={};
  facs.filter(f=>f.type&&f.type.includes('다목적위치표지판')&&f.lat&&f.lng).forEach(f=>{
    const m=(f.name||'').match(/^(\d{2}-\d{2})/);
    if(m)signMap[m[1]]={lat:f.lat,lng:f.lng,code:m[1],name:f.name};
  });

  // 집계: 표지판 코드 우선, 없으면 위치 텍스트 코드, 없으면 GPS 250m 격자
  const CELL=0.0025;
  const bins={}; // key → {latSum,lngSum,latN,n,code,label}
  allData.forEach(x=>{
    let key,code=null;
    // 1) GPS → 가장 가까운 표지판 코드로 snap (1km 이내)
    if(x.lat&&x.lng&&Object.keys(signMap).length){
      let bestCode=null,bestD=Infinity;
      Object.values(signMap).forEach(s=>{const d=_haversineKm(x.lat,x.lng,s.lat,s.lng);if(d<bestD){bestD=d;bestCode=s.code;}});
      if(bestCode&&bestD<1){code=bestCode;key='s_'+code;}
    }
    // 2) 위치 텍스트에서 XX-XX 코드 추출 (GPS 없거나 1km 밖)
    if(!key){
      const m=(x.location||'').match(/(\d{2}-\d{2})/);
      if(m){code=m[1];key='s_'+code;}
    }
    // 3) GPS만 있고 표지판 없는 구역 → 250m 격자
    if(!key&&x.lat&&x.lng){key='g_'+Math.round(x.lat/CELL)+'_'+Math.round(x.lng/CELL);}
    if(!key)return; // GPS도 없고 코드도 없으면 제외
    if(!bins[key])bins[key]={latSum:0,lngSum:0,latN:0,n:0,code};
    if(x.lat&&x.lng){bins[key].latSum+=x.lat;bins[key].lngSum+=x.lng;bins[key].latN++;}
    bins[key].n++;
  });

  // 각 bin의 대표 좌표: GPS 평균 → 표지판 좌표 → null
  const cells=Object.values(bins).map(b=>{
    let lat=b.latN>0?b.latSum/b.latN:null,lng=b.latN>0?b.lngSum/b.latN:null;
    const s=b.code&&signMap[b.code];
    if(!lat&&s){lat=s.lat;lng=s.lng;} // GPS 없는 기록만 있는 경우 표지판 좌표 사용
    const label=b.code?b.code+(s&&s.name?' '+s.name.replace(/^\d{2}-\d{2}\s*/,'').slice(0,8):'')
                :(lat?lat.toFixed(4)+','+lng.toFixed(4):'?');
    return {lat,lng,n:b.n,label};
  }).filter(c=>c.lat&&c.lng).sort((a,b)=>b.n-a.n);

  if(!cells.length){el.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:11px;color:rgba(255,255,255,.25);">좌표·위치 정보 없음</div>';return;}
  try{
    const map=new kakao.maps.Map(el,{center:new kakao.maps.LatLng(38.13,128.43),level:8});
    map.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
    const bounds=new kakao.maps.LatLngBounds();
    const colOf=n=>n>=5?'#c0392b':n>=3?'#e74c3c':n>=2?'#e67e22':'#f1c40f';
    cells.forEach(c=>{
      const pos=new kakao.maps.LatLng(c.lat,c.lng);
      bounds.extend(pos);
      new kakao.maps.Circle({
        center:pos,radius:140+Math.min(c.n,8)*45,
        fillColor:colOf(c.n),fillOpacity:.42,strokeWeight:1,strokeColor:colOf(c.n),strokeOpacity:.6,map
      });
      const lbl=document.createElement('div');
      lbl.style.cssText='font-size:11px;font-weight:800;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.9);pointer-events:none;';
      lbl.textContent=c.n;
      new kakao.maps.CustomOverlay({position:pos,content:lbl,zIndex:3}).setMap(map);
    });
    if(cells.length>1)map.setBounds(bounds,30);else map.setCenter(new kakao.maps.LatLng(cells[0].lat,cells[0].lng));
  }catch(e){}
  // TOP 5 순위
  const top=document.getElementById('heatTopList');
  if(top){
    top.innerHTML=cells.slice(0,5).map((c,i)=>`<div style="display:flex;align-items:center;gap:7px;padding:3px 0;">
      <span style="font-size:9px;font-weight:800;color:${i===0?'#e74c3c':'#9bbdd4'};width:14px;">${i+1}</span>
      <span style="font-size:11px;color:#b8d4e8;flex:1;">${c.label}</span>
      <span style="font-size:10px;font-weight:700;color:${c.n>=3?'#e74c3c':'#e67e22'};">${c.n}건</span>
    </div>`).join('');
  }
}

function downloadStatsExcel(tab){
  const from=window._statExpFrom||'';
  const to=window._statExpTo||'';
  if(from&&to&&from>to){toast('⚠️ 시작일이 종료일보다 늦습니다');return;}
  const inRange=d=>{
    const ds=(d||'').slice(0,10);
    if(!ds)return false;
    if(from&&ds<from)return false;
    if(to&&ds>to)return false;
    return true;
  };
  // CSV 셀 이스케이프: 쉼표/따옴표/줄바꿈 처리
  const esc=v=>{
    const s=String(v==null?'':v);
    return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
  };
  let headers=[],rows=[],fname='';
  if(tab==='rescue'){
    const res=(DB.g('rescues')||[]).filter(r=>inRange(r.date));
    if(!res.length){toast('⚠️ 해당 기간에 구조보고가 없습니다');return;}
    headers=['날짜','시간','제목','구조유형','상태','위치','장소구분','위도','경도','사고자명','성별','출생연도','국적','중증도','부상부위','사고원인','구조방법','날씨','사고자수','추가사고자','초동팀','출동팀','작성자'];
    rows=res.map(r=>[
      (r.date||'').slice(0,10), r.time||(r.date||'').slice(11,16), r.title||'', r.type||'',
      r.status==='ongoing'?'진행중':'종료', r.location||'', r.loctype||'',
      r.lat||'', r.lng||'',
      r.vName||'', r.vGender||'', r.vBirth?String(r.vBirth).slice(0,4):'', r.vNation||r.vNationality||'',
      r.severity||'', (r.injuryParts||[]).join('/'), r.cause||'', (r.rescueMethod||[]).join('/'), r.weather||'',
      1+((r.victims2||[]).length),
      (r.victims2||[]).map(v=>[v.name||'미상',v.severity,v.note].filter(Boolean).join(' ')).join(' / '),
      (r.members||[]).join('/'),
      (r.teams||[]).map(t=>t.name+((t.members&&t.members.length)?'('+t.members.join('·')+')':'')).join('/'),
      r.author||''
    ]);
    fname='구조보고_'+(from||'전체')+'_'+(to||'전체')+'.csv';
  }else{
    const haz=(DB.g('hazards')||[]).filter(h=>inRange(h.date));
    if(!haz.length){toast('⚠️ 해당 기간에 위험상황이 없습니다');return;}
    headers=['날짜','위험유형','처리현황','위치','위도','경도','내용','작성자'];
    rows=haz.map(h=>[
      (h.date||'').slice(0,10), h.hazType||'', h.hazStatus||'미조치', h.loc||h.location||'',
      h.lat||'', h.lng||'', h.desc||h.memo||'', h.author||''
    ]);
    fname='위험상황_'+(from||'전체')+'_'+(to||'전체')+'.csv';
  }
  // UTF-8 BOM: 엑셀에서 한글 깨짐 방지
  const csv='\uFEFF'+[headers,...rows].map(row=>row.map(esc).join(',')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=fname;
  document.body.appendChild(a);a.click();
  setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},300);
  toast('📥 '+rows.length+'건 다운로드 완료');
}


// ══════════════════════════════════════════
// 팝업 & 상황 종료
// ══════════════════════════════════════════
function _popRow(ico,val){return val?`<div style="display:flex;gap:5px;margin-bottom:3px;"><span style="color:#4a7090;flex-shrink:0;">${ico}</span><span style="color:#c0d8ec;font-size:11px;">${_esc(val)}</span></div>`:'';}
function openResPopup(id,type='rescue'){
  const data=type==='rescue'?(DB.g('rescues')||[]).find(x=>x.id===id):(DB.g('hazards')||[]).find(x=>x.id===id);if(!data)return;
  selResId=id;
  if(type==='rescue'){
    const isOg=data.status==='ongoing';const ti=RES_TYPES[data.type]||RES_TYPES['기타'];
    const totalPh=(data.reports||[]).length+1;
    document.getElementById('resPopTitle').textContent=ti.ico+' '+data.title;
    // 빈값/미상 필터 헬퍼
    const _skip=v=>{if(!v)return true;const s=String(v).trim();return !s||s==='-'||['미상','없음','모르겠음','알수없음','미정','해당없음','기타'].includes(s);};
    const _arr=v=>(Array.isArray(v)?v:typeof v==='string'?[v]:[]).filter(x=>!_skip(x));
    const row=_popRow;
    const d=data;
    const rows=[
      row('📅',d.date),
      row('📍',[d.location,d.loctype].filter(x=>!_skip(x)).join(' · ')||''),
      row('🌤',(!_skip(d.weather)?d.weather:'')+(!_skip(d.weatherAlert)?' '+d.weatherAlert:'')||''),
      row('👤',[!_skip(d.vName)?d.vName:'',(!_skip(d.vBirth)?_ageFromBirth(d.vBirth)+'세':''),(!_skip(d.vGender)&&d.vGender!=='알수없음'?d.vGender:''),(!_skip(d.vNation)&&d.vNation!=='알수없음'?d.vNation:'')].filter(Boolean).join(' · ')||''),
      row('🩺',!_skip(d.severity)?d.severity:''),
      row('👥',(d.victims2&&d.victims2.length)?('추가 사고자 '+d.victims2.length+'명: '+_victims2Str(d.victims2)):''),
      row('⚡',!_skip(d.cause)?d.cause:''),
      row('🦵',_arr(d.injuryParts).join(', ')),
      row('🚑',_arr(d.rescueMethod).join(', ')),
      row('🚨',_arr(d.mobilize).length?'응소: '+_arr(d.mobilize).join(', '):''),
      row('🏥',!_skip(d.hospital)&&d.hospital!=='미정'?d.hospital:''),
      row('🍺',!_skip(d.alcohol)&&d.alcohol!=='알수없음'?'음주: '+d.alcohol:''),
    ].filter(Boolean).join('');
    document.getElementById('resPopMeta').innerHTML=`
      <div style="display:flex;gap:5px;margin-bottom:6px;align-items:center;">
        <span style="font-size:10px;padding:2px 7px;border-radius:9px;font-weight:700;background:${isOg?'rgba(192,57,43,.2)':'rgba(39,174,96,.15)'};color:${isOg?'#e05050':'#27ae60'};">${isOg?'진행중':'종료'}</span>
        <span style="font-size:10px;color:#4a7090;">${totalPh}보 기록</span>
        <span style="font-size:10px;color:#3a6a8a;">${_esc(d.type)}</span>
      </div>
      ${rows||'<div style="color:#4a7090;font-size:11px;">상세 정보 없음</div>'}`;
    document.getElementById('btnViewRep').style.display='block';
    document.getElementById('btnViewTl').style.display=type==='rescue'?'block':'none';
    const rEl=document.getElementById('resPopRoutes');
    if(rEl){const rh=_buildResRouteHtml(data);rEl.innerHTML=rh;rEl.style.display=rh?'block':'none';}
  } else {
    document.getElementById('resPopTitle').textContent='⚠️ '+data.hazType+' 위험상황';
    const _skip=v=>{if(!v)return true;const s=String(v).trim();return !s||s==='-'||['미상','없음','알수없음','미정'].includes(s);};
    const row=_popRow;
    const d=data;
    document.getElementById('resPopMeta').innerHTML=[
      row('📍',!_skip(d.loc)?d.loc:''),
      row('⚠️',!_skip(d.danger)?d.danger:''),
      row('📋',!_skip(d.hazStatus)?d.hazStatus:''),
      row('🚨',(d.mobilize&&d.mobilize.length)?'응소: '+d.mobilize.join(', '):''),
      row('👤',!_skip(d.author)?d.author:''),
    ].filter(Boolean).join('')||'<div style="color:#4a7090;font-size:11px;">상세 정보 없음</div>';
    document.getElementById('btnViewRep').style.display='none';
    document.getElementById('btnViewTl').style.display='none';
    const rEl2=document.getElementById('resPopRoutes');if(rEl2)rEl2.style.display='none';
  }
  document.getElementById('facPopup').classList.remove('on');
  document.getElementById('resPopup').classList.add('on');
}

function openHazDetail(id){
  const h=(DB.g('hazards')||[]).find(x=>x.id===id);if(!h)return;
  let ov=document.getElementById('hazDetailOv');
  if(!ov){ov=document.createElement('div');ov.id='hazDetailOv';document.body.appendChild(ov);}
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:flex-end;';
  ov.innerHTML=`<div style="background:#040a16;border-radius:14px 14px 0 0;width:100%;max-height:80vh;max-height:80dvh;overflow:hidden;display:flex;flex-direction:column;border-top:.5px solid rgba(230,126,34,.3);">
    <div style="padding:14px 16px 10px;display:flex;align-items:center;justify-content:space-between;border-bottom:.5px solid rgba(255,255,255,.07);flex-shrink:0;">
      <span style="font-size:13px;font-weight:700;color:#e0edf8;">${_esc(h.hazType||'위험상황')}</span>
      <button onclick="document.getElementById('hazDetailOv').style.display='none'" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:20px;cursor:pointer;padding:0 4px;line-height:1;">×</button>
    </div>
    <div style="overflow-y:auto;flex:1;padding:12px 14px;">
      <div style="font-size:12px;color:#b8d4e8;line-height:1.8;">
        ${h.leadAgency?`주관기관: <b style="color:#3ad17a;">🌲 ${_esc(h.leadAgency)}</b><br>`:''}
        위치: <b>${_esc(h.loc||'-')}</b><br>
        시각: ${_esc(h.dt||'-')}<br>
        위험도: ${_esc(h.danger||'-')}<br>
        상태: <b style="color:${h.hazStatus==='미조치'?'#e05050':(h.hazStatus==='조치중'?'#e67e22':'#27ae60')};">${_esc(h.hazStatus||'-')}</b><br>
        작성: ${_esc(h.author||'-')}
        ${h.desc?`<br><br>${_esc(h.desc)}`:''}
      </div>
      <div style="margin-top:12px;">
        <div style="font-size:11px;color:#7a9cb8;font-weight:700;margin-bottom:6px;">상태 변경</div>
        <div style="display:flex;gap:6px;">
          ${['미조치','조치중','제거 완료','통제중'].map(st=>{
            const on=(h.hazStatus||'미조치')===st;
            const col=st==='미조치'?'#e05050':(st==='조치중'?'#e67e22':'#27ae60');
            return `<button onclick="_setHazStatus(${h.id},'${st}')" style="flex:1;padding:7px 2px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid ${on?col:'rgba(255,255,255,.12)'};background:${on?col+'22':'transparent'};color:${on?col:'rgba(255,255,255,.45)'};">${st}</button>`;
          }).join('')}
        </div>
      </div>
      ${(h.statusLog&&h.statusLog.length)?`<div style="margin-top:12px;">
        <div style="font-size:11px;color:#7a9cb8;font-weight:700;margin-bottom:6px;">📋 상태 이력</div>
        ${h.statusLog.slice().reverse().map(s=>`<div style="display:flex;gap:8px;font-size:11px;padding:4px 0;border-top:1px solid rgba(255,255,255,.05);">
          <span style="color:#6a93b5;font-family:monospace;flex-shrink:0;">${_esc((s.at||'').slice(5,16))}</span>
          <span style="color:${s.status==='미조치'?'#e05050':(s.status==='조치중'?'#e67e22':'#27ae60')};font-weight:700;flex:1;">${_esc(s.status)}</span>
          <span style="color:#5a7e98;flex-shrink:0;">${_esc(s.by||'-')}</span>
        </div>`).join('')}
      </div>`:''}
      ${_mobilizeBlockHtml('hazards',h)}
      ${_hazFireTLHtml(h)}
    </div>
  </div>`;
  ov.onclick=e=>{if(e.target===ov)ov.style.display='none';};
}
function _setHazStatus(id,st){
  const haz=DB.g('hazards')||[];const idx=haz.findIndex(x=>x.id===id);if(idx===-1)return;
  if((haz[idx].hazStatus||'미조치')===st){toast('이미 '+st+' 상태입니다');return;}
  if(!haz[idx].statusLog)haz[idx].statusLog=[{status:haz[idx].hazStatus||'미조치',at:haz[idx].dt||now(),by:haz[idx].author||'-'}];
  haz[idx].hazStatus=st;
  haz[idx].statusLog.push({status:st,at:now(),by:(typeof getAuthor==='function'?getAuthor():'')||haz[idx].author||'-'});
  DB.s('hazards',haz);
  toast('✅ 상태 변경: '+st);
  openHazDetail(id); // 상세 갱신
  try{renderRescueMap();}catch(e){}try{renderResList();}catch(e){}try{updateSummary();}catch(e){}
  if(document.getElementById('v-board')&&document.getElementById('v-board').classList.contains('on')){try{renderBoard();}catch(e){}}
}

