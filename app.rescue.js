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
  // 제목: 최초 가입(프로필 미완성)일 때만 '가입 신청' — 기존엔 구버전 approvalStatus를 봐서
  // 승인된 직원에게도 '가입 신청'이 떴음(현 승인체계는 _acl 기준이라 이 필드가 안 채워짐)
  const _pDone0=!!(u.dept&&u.rank&&(u.realName||u.name));
  const titleEl=document.getElementById('modalUserTitle');
  if(titleEl)titleEl.textContent=(isKakao&&!_pDone0)?'🆕 가입 신청':(_pDone0?'👤 내 정보':'👤 작성자 설정');
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
  // 개인정보 잠금: '관리자 승인(멤버 등록)'이 끝난 뒤부터 — 가입 입력~승인 대기 중엔 본인이 자유롭게 수정 가능
  // (프로필 채움만으로 잠그면 가입 직후 오타도 못 고치고, 재설치·기기변경 자동복원 첫 로그인도 잠겨버림)
  // 승인 후엔 전원(관리자 본인 포함) 열람 전용 — 변경은 '관리자에게 정정 요청' 또는 관리자 전용→직원 탭에서만
  const _profileDone=_pDone0;
  const _locked=isKakao&&_profileDone&&(typeof _isMember==='function'?_isMember():true);
  const _nameIn=document.getElementById('uNameIn');
  const _deptIn=document.getElementById('uDeptIn');
  const _pillsBox=document.getElementById('rankPills');
  const _saveBtn=document.getElementById('userSaveBtn');
  const _lockNote=document.getElementById('userLockNote');
  const _quick=document.getElementById('staffQuickPick');
  if(_locked){
    if(titleEl)titleEl.textContent='👤 내 정보';
    if(_nameIn){_nameIn.readOnly=true;_nameIn.style.opacity='.6';}
    if(_deptIn){_deptIn.disabled=true;_deptIn.style.opacity='.6';}
    if(_pillsBox){_pillsBox.style.pointerEvents='none';_pillsBox.style.opacity='.6';}
    if(_quick)_quick.style.display='none';
    if(_saveBtn)_saveBtn.style.display='none';
    if(_lockNote)_lockNote.style.display='block';
    var _fixBtn=document.getElementById('profileFixReqBtn');if(_fixBtn)_fixBtn.style.display='block';
  }else{
    var _fixBtn2=document.getElementById('profileFixReqBtn');if(_fixBtn2)_fixBtn2.style.display='none';
    if(_nameIn){_nameIn.readOnly=false;_nameIn.style.opacity='';}
    if(_deptIn){_deptIn.disabled=false;_deptIn.style.opacity='';}
    if(_pillsBox){_pillsBox.style.pointerEvents='';_pillsBox.style.opacity='';}
    if(_saveBtn)_saveBtn.style.display='';
    if(_lockNote)_lockNote.style.display='none';
  }
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
    if(pwH===_MASTER_PH){ // 개발자(마스터 비밀번호) — 이 카카오 계정을 '개발자'로 고정 등록(전 기기 공유)
      localStorage.setItem('_masterAuthed','1');
      if(_cu.kakaoId){
        DB.s('devKakaoId',String(_cu.kakaoId));
        try{var _acl=_getAcl();if(_acl.admins.indexOf(String(_cu.kakaoId))<0){_acl.admins.push(String(_cu.kakaoId));DB.s('_acl',_acl);}}catch(e){} // 개발자를 정식 _acl 관리자로도 등록
      }
    }
    if(_cu.kakaoId&&!DB.g('adminOwnerKakaoId'))DB.s('adminOwnerKakaoId',String(_cu.kakaoId));
    document.getElementById('adminLoginOverlay').style.display='none';
    document.getElementById('adminLoginPw').value='';
    var _g=document.getElementById('approvalGate');if(_g)_g.style.display='none'; // 관리자는 게이트 통과
    openApp('admin');
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
  // 개발자(마스터)는 항상 관리자
  if(localStorage.getItem('_masterAuthed')==='1')return true;
  var u=DB.g('currentUser')||{};
  if(u.kakaoId){
    // 카카오 사용자: 관리자 판정을 _acl(동기화)로만 — 강등되면 즉시 반영(옛 비번/토큰 플래그 무시)
    var kid=String(u.kakaoId),acl=_getAcl();
    if(_isDeveloper(kid))return true; // 개발자(나)는 항상 관리자
    if(acl.admins.indexOf(kid)>=0)return true;
    return false;
  }
  // 카카오ID 없는(비밀번호 전용) 환경: 기존 플래그 인정
  return localStorage.getItem('_adminAuthed')==='1'
      || localStorage.getItem('_tokenAdmin')==='1'
      || _authRole==='admin';
}
// 시설물 수정·삭제·숨김 권한: 개발자(마스터) + 탐방시설과 직원 (추가·등록은 누구나)
function _canManageFac(){
  if(typeof _isMasterAdmin==='function'&&_isMasterAdmin())return true;
  var u=DB.g('currentUser')||{};
  if(u.dept==='탐방시설과')return true;
  // 🔧 시설담당자로 지정된 직원(직원관리에서 지정, ACL 기반) — 부서명이 바뀌어도 권한 유지
  try{if(_isFacManager())return true;}catch(e){}
  return false;
}
// 이 시설이 나에게 보이는가: 숨김(hidden)이면 권한자에게만 보임(일반 사용자에겐 숨김)
function _facVisibleTo(f){return !(f&&f.hidden)||_canManageFac();}
// ── 시설물 담당자(하자 접수 재평가자) — 직원관리에서 지정, facManagers에 카카오ID 저장 ──
function _facManagers(){return (DB.g('facManagers')||[]).map(String).filter(Boolean);}
function _isFacManager(kakaoId){
  var k=String(kakaoId||((DB.g('currentUser')||{}).kakaoId)||'');
  if(!k)return false;
  return _facManagers().indexOf(k)>=0;
}
// 개발자: 하드코딩된 개발자 카카오ID 본인 or 마스터 비밀번호 인증. 전체 초기화·본인 삭제방지 등에 사용
function _isMasterAdmin(){
  var u=DB.g('currentUser')||{};
  if(u.kakaoId&&_isDeveloper(u.kakaoId))return true;
  return localStorage.getItem('_masterAuthed')==='1';
}
// 대상 kakaoId가 '개발자(나)'인가 — 직원목록에서 역할변경·삭제 버튼 숨김용(나만 보호).
// 하드코딩 ID(재등록 불필요) 또는 마스터로 지정한 devKakaoId.
function _isDeveloper(kakaoId){
  if(String(kakaoId)===_DEV_KAKAO_ID)return true;
  var dev=DB.g('devKakaoId');return !!(dev&&String(kakaoId)===String(dev));
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
      try{_applyAppLock();}catch(e){} // 승인 완료 → 앱 잠금 해제
      return false;
    }
    // 수동 승인 대기 화면을 최상단에 표시(로그인·프로필 모달 닫고 게이트만 남김)
    try{closeM('modalUser');}catch(e){}
    try{if(window.hideLoginScreen)window.hideLoginScreen();}catch(e){}
    var idEl=document.getElementById('approvalGateId');
    if(idEl)idEl.innerHTML='이름: <b style="color:#d5d8dc;">'+_esc(u.realName||u.name||'-')+'</b> · '+_esc(u.dept||'')+'<br>내 카카오 ID: <b style="color:#d5d8dc;">'+(u.kakaoId||_authKakaoId||'?')+'</b><br><span style="color:#6b7684;">이 ID를 관리자에게 전달하면 승인됩니다</span>';
    gate.style.display='flex';
    try{_applyAppLock();}catch(e){} // 승인 대기 → 앱 잠금 유지
    _startApprovalPoll(); // 승인되면 재로그인 없이 자동 입장
    return true; // 차단됨
  }
  _stopApprovalPoll();
  gate.style.display='none';
  try{_applyAppLock();}catch(e){} // 게이트 통과 → 잠금 재평가
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
// 직원 → 관리자: 내 정보(이름·소속·직위) 정정 요청 (잠금 상태에서 직접 못 고치는 대신)
function requestProfileFix(){
  const u=DB.g('currentUser')||{};
  const cur=(u.realName||u.name||'-')+' / '+(u.dept||'-')+' / '+(u.rank||'-');
  const msg=prompt('수정이 필요한 내용을 적어주세요.\n관리자에게 정정 요청이 전달됩니다.\n\n(현재 등록: '+cur+')','');
  if(msg==null)return;
  const t=String(msg).trim();if(!t){toast('내용을 입력하세요');return;}
  try{pushNoti('✏️ 정보 정정 요청 — '+(u.realName||u.name||'')+(u.kakaoId?' ('+u.kakaoId+')':'')+': '+t,'✏️','info',{app:'admin'},null,{adminOnly:true});}catch(e){}
  toast('✅ 관리자에게 정정 요청을 보냈습니다');
}
// 직원 → 관리자: 관리자 권한 요청 (관리자 페이지 권한 없음 화면에서)
function requestAdminAccess(){
  const u=DB.g('currentUser')||{};
  if(!u.kakaoId){toast('카카오 로그인 후 요청하세요');return;}
  try{pushNoti('🔐 관리자 권한 요청 — '+(u.realName||u.name||'')+' ('+u.kakaoId+')','🔐','info',{app:'admin'},null,{adminOnly:true});}catch(e){}
  toast('✅ 관리자에게 권한 요청을 보냈습니다');
  const e=document.getElementById('adminDeniedOverlay');if(e)e.remove();
  try{goHome();}catch(_e){}
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
  if(!list.length)return'<div style="font-size:11px;color:#565f6b;padding:8px 0;">새 가입자 없음</div>';
  return list.map(function(u){return'<div style="background:#0f0f11;border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:10px;margin-bottom:7px;'+(u.seen?'opacity:.55':'')+'">'+(!u.seen?'<div style="font-size:9px;color:#3182f6;font-weight:700;margin-bottom:4px;">NEW</div>':'')+
    '<div style="font-size:12px;color:#eaecef;font-weight:700;">'+_esc(u.realName||u.name)+' <span style="font-weight:400;color:#8b95a1;">· '+_esc(u.dept||'')+' · '+_esc(u.rank||'')+'</span></div>'+
    '<div style="font-size:10px;color:#565f6b;margin-top:2px;">닉네임: '+_esc(u.name)+' · '+(u.submittedAt?new Date(u.submittedAt).toLocaleDateString('ko-KR'):'')+' 가입</div>'+
    '<button onclick="_markSeen(\''+_escq(u.id)+'\')" style="margin-top:6px;background:rgba(255,255,255,.1);color:#3182f6;border:1px solid rgba(255,255,255,.2);padding:5px 10px;border-radius:6px;font-size:10px;cursor:pointer;">확인 완료</button>'+
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
  // 자동 승인 모드: 관리자 기기에서 '로그인만 한' 사람까지 전원 일괄 승인.
  // (pend는 pendingUsers만이라 로그인이력만 있는 사용자를 못 잡음 → pend.length 조건 제거)
  if(_isAutoApprove()){try{if(_autoApproveSweep()>0){pend=_pendingNotApproved();try{renderAdmMembers();}catch(e){}}}catch(e){}}
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
  // 받는 대상: '전체' 체크 또는 아무 소속도 안 고르면 전체, 아니면 선택한 소속들
  const allChk=document.getElementById('pushAll')&&document.getElementById('pushAll').checked;
  const depts=[].slice.call(document.querySelectorAll('.pushDept:checked')).map(c=>c.value);
  let tgtLabel,filterTok;
  if(allChk||!depts.length){tgtLabel='전체';filterTok=function(){return true;};}
  else{tgtLabel='소속 · '+depts.join(', ');const set=new Set(depts);filterTok=function(v){return set.has(v.dept||'');};}
  if(!confirm('['+tgtLabel+']에게 푸시를 발송합니다.\n\n제목: '+title+'\n내용: '+body+'\n\n발송할까요?'))return;
  toast('📨 푸시 발송 중…');
  try{
    const snap=await _fdb.collection('fcmTokens').get();
    const tokens=[];snap.forEach(d=>{const v=d.data()||{};if(!v.token)return;if(filterTok(v))tokens.push(v.token);});
    if(!tokens.length){toast('⚠️ 대상 기기가 없습니다 (해당 직원이 아직 앱에서 알림을 켜지 않았을 수 있음)');return;}
    const res=await fetch(url,{method:'POST',headers:{'content-type':'text/plain;charset=utf-8'},
      body:JSON.stringify({secret:_FCM_PUSH_SECRET||(DB.g('fcmPushSecret')||''),title,body,data:{app:'home'},tokens})});
    const out=await res.json().catch(()=>({}));
    if(out.error){toast('❌ 발송기 오류: '+out.error);}
    else{
      toast(`✅ ${out.sent||0}대 발송 완료${out.invalid&&out.invalid.length?` · 무효 ${out.invalid.length}`:''}`);
      const b=document.getElementById('pushBodyInp');if(b)b.value='';
      // 보낸 내역 기록
      try{const me=DB.g('currentUser')||{};const log=DB.g('pushLog')||[];log.unshift({title,body,target:tgtLabel,by:(me.realName||me.name||'관리자'),at:Date.now(),sent:out.sent||0});DB.s('pushLog',log.slice(0,30));}catch(e){}
      try{renderAdmSys();}catch(e){}
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
      av.innerHTML=`<img src="${_esc(_imgHttps(u.kakaoImg))}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.textContent='👤'">`;
    } else {
      const initial=u.name?u.name.charAt(0):'👤';
      av.textContent=initial;
    }
  }
  // 외부기관 모드: 제한된 메뉴 표시
  const ext=authType==='external';
  document.body.classList.toggle('ext-mode',ext);
  try{_applyAppLock();}catch(e){}
}

// ── 앱 하드 잠금(2차 방어선) ──
// 완전 인증(외부기관 · 관리자 · 카카오+프로필+멤버) 이전에는 #app 자체를 조작 불가로 만든다.
// 로그인·승인 오버레이가 화면을 덮지만, 그 오버레이가 페이드 중이거나(투명 클릭통과)
// 어떤 이유로 잠깐 사라져도 홈이 조작·열람되지 않도록 하는 근본 차단.
function _isAppUnlocked(){
  try{
    if(typeof isExternal==='function'&&isExternal())return true;         // 외부기관
    if(typeof isAdminUser==='function'&&isAdminUser())return true;        // 관리자·개발자
    var at=(typeof _resolveAuthType==='function')?_resolveAuthType():DB.g('authType');
    var u=DB.g('currentUser')||{};
    var profileDone=!!(u.dept&&u.rank&&(u.realName||u.name));
    if(at==='kakao'&&profileDone&&_isMember())return true;               // 카카오+프로필완료+승인멤버
  }catch(e){return true;} // 판정이 깨지면 정상 사용자 잠김 방지 위해 개방(1차 방어는 오버레이)
  return false;
}
function _applyAppLock(){
  try{
    var app=document.getElementById('app');if(!app)return;
    var locked=!_isAppUnlocked();
    // class 방식: #app 전체는 잠그되, 안에 있는 가입 모달(#modalUser)·관리자 로그인 창은 CSS 예외로 조작 가능
    // (예전 style.pointerEvents 직접 차단은 가입 신청 모달까지 잠가 최초 가입 입력이 불가능했음)
    app.classList.toggle('applock',locked);
    app.style.pointerEvents='';
  }catch(e){}
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
      facGrade:(typeof facMapGradeF!=='undefined'?[...facMapGradeF]:[]),
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
    // 시설물 지도 필터는 복원하지 않음 — 항상 '모든곳(전체)'로 시작(마지막 필터가 남아 일부만 보이던 문제 방지)
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
var _rTeamOvs=[],_rTeamEls=[]; // team chip markers
function _buildRFacEl(f){
  const el=document.createElement('div');el.className='mpin-num'+((typeof _facWarn==='function'&&_facWarn(f))?' blink':'');
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
  const all=(DB.g('facilities')||[]).filter(f=>f.lat&&f.lng&&f.type&&(_rm[f.type]||{}).rescue&&_facVisibleTo(f));
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
  // 숨김 처리된(삭제/hidden) 시설 오버레이 정리
  _rFacPool.forEach((entry,id)=>{if(!validIds.has(id)){try{entry.ov.setMap(null);}catch(x){}_rFacPool.delete(id);}});
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
  if(mapR)_scaleOvs(rEls,mapR.getLevel(),3);
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
  try{if(typeof _mergeCustomResTypes==='function')_mergeCustomResTypes();}catch(e){} // 커스텀 유형 아이콘 반영
  // Clear event overlays only — facility pool is reused
  _rEvOvs.forEach(o=>{try{o.setMap(null);}catch(e){}});_rEvOvs=[];_rEvEls=[];
  // Clear team markers
  _rTeamOvs.forEach(o=>{try{o.setMap(null);}catch(e){}});_rTeamOvs=[];_rTeamEls=[];
  _updateResFilterPanels();
  const _showRes=resTypeF.size===0||resTypeF.has('🚨구조');
  const _showHaz=(resTypeF.size===0||resTypeF.has('⚠️위험상황'))&&!(typeof _HAZ_OFF!=='undefined'&&_HAZ_OFF);
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
      if(Math.abs(dx)<8&&Math.abs(dy)<8){e.stopPropagation();e.preventDefault();openResPopup(r.id,'rescue');}
    });
    el.addEventListener('click',e=>{e.stopPropagation();openResPopup(r.id,'rescue');});
    const ov=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(r.lat,r.lng),content:el,clickable:true,zIndex:isOg?8:3});
    ov._lat=r.lat;ov._lng=r.lng;ov._noClus=isOg;ov._ev={id:r.id,type:'rescue',title:r.title||'구조',status:r.status}; // 진행중 구조는 클러스터 제외 + 최상단
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
    ov._lat=h.lat;ov._lng=h.lng;ov._ev={id:h.id,type:'hazard',title:h.title||h.hazType||'위험상황',status:h.hazStatus};
    ov.setMap(mapR);_rEvOvs.push(ov);_rEvEls.push(el);
  });
  // 사고/위험 상황 핀 클러스터링 (밀집 시 개수 버블로 묶음 — 시설물은 제외)
  _rEvItems=_rEvOvs.map(ov=>({ov,lat:ov._lat,lng:ov._lng,noClus:ov._noClus}));
  window._rcLastSig=null; // 핀 데이터가 새로 구성됨 — 다음 재클러스터는 반드시 수행(줌 생략 가드 해제)
  try{_reclusterRescue();}catch(e){}
  // 🆘 조난자 위치 핀 (클러스터 제외, 최상단, 맥동)
  try{_drawSosPins();}catch(e){}
  // 팀 칩 마커: 진행중 구조의 출동팀
  _rebuildTeamChips();
  // 시설물: 풀 동기화 후 필터 적용 (DOM 재생성 없이 show/hide)
  _syncRFacPool();
  if(window._popupDimOn){
    // 팝업 집중 상태 유지: 마커 재생성 후에도 흐림 재적용
    const rp=document.getElementById('resPopup');
    if(rp&&rp.classList.contains('on')&&selResId!=null){window._popupDimOn=false;_popupFocusDim(selResId);}
    else window._popupDimOn=false;
  }
  updateSummary();
}

// ══════════════════════════════════════════
// 포커스 모드: 사고 탭 → 팀 경로 + 진행 패널
// ══════════════════════════════════════════
const TEAM_COLORS=['#3182f6','#27ae60','#e67e22','#9b59b6'];
// 지도 칩용 팀 이름 축약: 특수산악구조대 1팀 → 특구대 1팀
function _shortTeamName(n){
  let s=String(n||'');
  Object.entries(DEPT_SHORT).forEach(([k,v])=>{s=s.split(k).join(v);});
  s=s.replace('탐방지원센터','센터');
  return s.length>10?s.slice(0,10)+'…':s;
}
function _teamIco(t){return t.type==='heli'?'🚁':t.type==='vehicle'?'🚐':'🥾';}

// 지도 팀 칩 표시 제거 — 출동 인원은 사고 팝업의 [👥 인원] 버튼으로 확인 (구 마커 청소만 유지)
function _rebuildTeamChips(){
  _rTeamOvs.forEach(o=>{try{o.setMap(null);}catch(e){}});_rTeamOvs=[];_rTeamEls=[];
}
// 사고 팝업 → 출동 인원 바텀시트
function viewTeamsSheet(){
  const r=(DB.g('rescues')||[]).find(x=>String(x.id)===String(selResId));
  if(r&&r.teams&&r.teams.length)_showTeamChipPopup(r);
  else toast('출동팀 없음');
}

// 지도 팀 칩 탭 → 출동 인원 바텀시트 (아래로 내리면 닫힘)
function _closeTeamSheet(){
  const m=document.getElementById('teamSheetWrap');if(!m)return;
  const s=document.getElementById('teamSheet');
  if(s){s.style.transition='transform .2s cubic-bezier(.4,0,.2,1)';s.style.transform='translateY(105%)';}
  m.style.background='rgba(0,0,0,0)';
  m.style.pointerEvents='none'; // 배경 투명 페이드 중에도 터치 통과(제거 지연/실패해도 먹통 방지)
  setTimeout(()=>{try{m.remove();}catch(e){}},210);
}
function _showTeamChipPopup(rescue){
  const teams=(rescue.teams||[]);
  if(!teams.length)return;
  const old=document.getElementById('teamSheetWrap');if(old)old.remove();
  const m=document.createElement('div');m.id='teamSheetWrap';
  m.style.cssText='position:fixed;inset:0;z-index:9700;background:rgba(0,0,0,.45);transition:background .2s;';
  const _ds=n=>(typeof _deptShort==='function'?_deptShort(n):String(n||''));
  const _tc=t=>((t.members&&t.members.length)||t.memberCount||0);
  const _tot=teams.reduce((a,t)=>a+_tc(t),0);
  const rows=teams.map(t=>{
    const mem=(t.members&&t.members.length)?t.members.join(', '):'';
    const cnt=_tc(t)?_tc(t)+'명':'';
    const req=t.requestedAt?String(t.requestedAt).slice(11,16):'';
    const arr=t.arrivedAt?String(t.arrivedAt).slice(11,16):'';
    return `<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 12px;margin-bottom:7px;">
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
        <span style="font-size:13px;font-weight:800;color:#eaecef;">${_teamIco(t)} ${_esc(_ds(t.name))}</span>
        ${cnt?`<span style="font-size:10px;color:#aab4c0;font-weight:700;">${cnt}</span>`:''}
      </div>
      ${mem?`<div style="font-size:12px;color:#c4c8ce;margin-top:5px;line-height:1.55;">👥 ${_esc(mem)}</div>`:''}
      ${(req||arr)?`<div style="font-size:10px;color:#6b7684;margin-top:4px;">${req?'🚨 출동 '+req:''}${arr?(req?' · ':'')+'🏁 도착 '+arr:''}</div>`:''}
    </div>`;
  }).join('');
  m.innerHTML=`<div id="teamSheet" style="position:absolute;bottom:0;left:0;right:0;background:#16161a;border-top:1.5px solid rgba(255,255,255,.28);border-radius:16px 16px 0 0;max-height:70vh;overflow-y:auto;padding:0 14px calc(16px + env(safe-area-inset-bottom));transform:translateY(105%);transition:transform .25s cubic-bezier(.4,0,.2,1);box-shadow:0 -5px 28px rgba(0,0,0,.8);">
    <div id="teamSheetHandle" style="position:sticky;top:0;background:#16161a;padding:9px 0 7px;cursor:grab;user-select:none;touch-action:none;">
      <div class="sheet-handle"></div>
      <div style="font-size:13px;font-weight:800;color:#eaecef;margin-top:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">🚑 출동팀 ${teams.length}팀${_tot?` · 총 ${_tot}명`:''} · ${_esc(rescue.title||'')}</div>
    </div>
    ${rows}
  </div>`;
  document.body.appendChild(m);
  m.addEventListener('click',function(e){if(e.target===m)_closeTeamSheet();});
  requestAnimationFrame(()=>{const s=document.getElementById('teamSheet');if(s)s.style.transform='translateY(0)';});
  try{_initFPDrag('teamSheetHandle','teamSheet',_closeTeamSheet);}catch(e){}
}
function _haversineKm(lat1,lng1,lat2,lng2){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// 팝업 집중: 사고 하나를 탭하면 나머지 사고·시설 마커 불투명도↓ → 여러 사고 동시 상황에서 시인성 확보
// (전용 focus 모드보다 가벼움 · 팝업 닫으면 _clearPopupDim 으로 원복)
function _popupFocusDim(rid){
  const f=String(rid);
  _rEvEls.forEach(el=>{el.style.transition='opacity .2s';el.style.opacity=(el.dataset&&el.dataset.rid===f)?'1':'0.28';});
  _rTeamEls.forEach(el=>{el.style.transition='opacity .2s';el.style.opacity=(el.dataset&&el.dataset.rid===f)?'1':'0.28';});
  _rFacPool.forEach(entry=>{entry.el.style.transition='opacity .2s';entry.el.style.opacity='0.28';});
  window._popupDimOn=true;
}
function _clearPopupDim(){
  if(!window._popupDimOn)return;
  window._popupDimOn=false;
  _rEvEls.forEach(el=>{el.style.opacity='';});
  _rTeamEls.forEach(el=>{el.style.opacity='';});
  _rFacPool.forEach(entry=>{entry.el.style.opacity='';});
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
    const cols={all:['rgba(255,255,255,.35)','rgba(255,255,255,.15)','#3182f6'],rescue:['rgba(192,57,43,.4)','rgba(192,57,43,.18)','#e05050'],haz:['rgba(230,126,34,.4)','rgba(230,126,34,.18)','#e67e22']};
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
var _resSortNewest=true; // 구조 목록 정렬: 기본 최신순(위가 최신)
function toggleResSort(){_resSortNewest=!_resSortNewest;try{renderResList();}catch(e){}toast(_resSortNewest?'↕ 최신순 정렬':'↕ 오래된순 정렬');}
function renderResList(){
  try{if(typeof _mergeCustomResTypes==='function')_mergeCustomResTypes();}catch(e){}
  try{if(typeof _migrateDedupLogs==='function')_migrateDedupLogs();}catch(e){} // 타임라인 중복 항목 1회 청소
  try{if(typeof _migrateGender==='function')_migrateGender();}catch(e){} // 성별 남성/여성→남/여 1회 정규화

  const res=DB.g('rescues')||[];const haz=DB.g('hazards')||[];
  _updateResFilterPanels();
  // 목록은 지도 필터(진행중·종류)와 무관하게 항상 진행중+종료 전부 표시 — 탭·검색·날짜만 적용
  const _showRes=(_resListTab==='all'||_resListTab==='rescue');
  const _showHaz=(_resListTab==='all'||_resListTab==='haz')&&!(typeof _HAZ_OFF!=='undefined'&&_HAZ_OFF);
  const _dateOkL=d=>_resDateOk(d);
  // 검색·탭·날짜가 바뀌면 페이지 한도를 처음(50)으로 리셋. '더 보기' 재호출 땐 유지.
  const _sig=_resListTab+'|'+resDateFrom+'|'+resDateTo+'|'+(_resSearchQ||'');
  if(_sig!==_resListSig){_resListSig=_sig;_resListLimit=50;}
  let cards=[];
  const _hdr=(txt,col)=>`<div style="display:flex;align-items:center;gap:7px;margin:4px 2px 7px;"><span style="font-size:11px;font-weight:800;color:${col};letter-spacing:.3px;">${txt}</span><div style="flex:1;height:1px;background:linear-gradient(90deg,${col}44,transparent);"></div></div>`;
  // 정렬 토글(기본 최신순) — 날짜 정렬이 헷갈린다는 피드백 반영
  cards.push(`<div style="display:flex;justify-content:flex-end;margin:0 2px 6px;"><button onclick="toggleResSort()" style="background:rgba(255,255,255,.1);color:#3182f6;border:1px solid rgba(255,255,255,.28);border-radius:16px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;">↕ ${_resSortNewest?'최신순':'오래된순'}</button></div>`);
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
            <div class="lname">🆘 ${_esc(p.name||'익명')} <span style="font-size:9px;color:#949aa2;font-weight:400;">±${p.acc||'?'}m · ${mm}분 전</span></div>
            ${_sosForeignBadge(p)?`<div style="margin-top:2px;">${_sosForeignBadge(p)}</div>`:''}
            ${p.msg?`<div class="lmeta" style="margin-top:2px;color:#d5d8dc;">${_esc(p.msg)}</div>`:''}
            <div class="lmeta" style="margin-top:2px;font-family:monospace;">${(+p.lat).toFixed(5)}, ${(+p.lng).toFixed(5)}</div>
            <button onclick="event.stopPropagation();sosToRescue('${p.id}')" style="margin-top:6px;padding:6px 12px;background:rgba(231,76,60,.15);border:1px solid rgba(231,76,60,.45);color:#ff6b5e;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">🚨 구조 사고로 등록</button>
          </div>
        </div>`);
      });
    }
  }
  // 진행중 구조를 상단에 별도 그룹으로 모아 일일 운영 시인성 강화
  if(_showRes){
    // res는 id(=시각) 내림차순(최신 먼저). 기본 최신순, 토글 시 오래된순
    const _rescues=res.filter(r=>_dateOkL(r.date)&&_resMatchSearch(r)).slice();
    if(!_resSortNewest)_rescues.reverse();
    const _og=_rescues.filter(r=>r.status==='ongoing');
    const _dn=_rescues.filter(r=>r.status!=='ongoing');
    _navOrder.rescue=[..._og,..._dn].map(r=>String(r.id)); // 상세 이전/다음 순서 = 목록 표시 순서
    const _mkCard=r=>{
      const isOg=r.status==='ongoing';const ti=RES_TYPES[r.type]||RES_TYPES['기타'];
      const hasCoord=!!(r.lat&&r.lng);
      // 목록 카드 미리보기 — 보고서(부상·중증도)+타임라인(최근 기록)을 한눈에 (굳이 안 들어가도 파악)
      const _injL=(Array.isArray(r.injuries)&&r.injuries.length)
        ? r.injuries.map(i=>(typeof _injLabel==='function')?_injLabel(i):((i.part||'')+(i.type||''))).filter(Boolean).join(', ')
        : [].concat(r.injuryParts||[],r.injuryTypes||[]).filter(Boolean).join(' ');
      const _injLine=[_injL,r.severity].filter(x=>{const s=String(x||'').trim();return s&&!['미상','없음','-'].includes(s);}).join(' · ');
      let _last=null;try{const _le=(typeof _collectLogEntries==='function')?_collectLogEntries(r):[];_last=_le.length?_le[_le.length-1]:null;}catch(e){}
      return `<div class="lcard" onclick="openResListDetail(${r.id})" style="position:relative;border-left:3px solid ${isOg?'#e74c3c':'#27ae60'};">
        <div class="lico" style="background:${isOg?ti.color:'#1a3a1a'};border:none;color:#fff;">${ti.ico}</div>
        <div class="linfo">
          <div class="lname">🚨 ${_esc(r.title)}</div>
          ${(r.extAgency||(r.mobilize&&r.mobilize.length))?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:3px;">
            ${r.extAgency?`<span style="font-size:9px;background:rgba(255,120,30,.18);color:#f08050;border:1px solid rgba(255,120,30,.35);border-radius:9px;padding:1px 7px;font-weight:700;">🚒 ${_esc(r.extAgency)}</span>`:''}
            ${(r.mobilize&&r.mobilize.length)?`<span style="font-size:9px;background:rgba(231,76,60,.18);color:#e74c3c;border:1px solid rgba(231,76,60,.4);border-radius:9px;padding:1px 7px;font-weight:700;">🚨 ${_esc(r.mobilize.join('·'))}</span>${_mobilizeCompactBadge(r)}`:''}
          </div>`:''}
          <div class="lmeta" style="margin-top:3px;">${_esc(r.type)} · ${r.date} · 사고자 ${_esc(r.vName||'미상')}${(r.victims2&&r.victims2.length)?` <span style="color:#e9897e;font-weight:700;">외 ${r.victims2.length}명</span>`:''}</div>
          ${_injLine?`<div class="lmeta" style="margin-top:2px;color:#ff9a8a;">🤕 ${_esc(_injLine)}</div>`:''}
          ${_last?`<div class="lmeta" style="margin-top:2px;color:#949aa2;">🕐 ${_esc(_last.t)} ${_esc(_last.label)}${_last.sub?' · '+_esc(String(_last.sub).slice(0,18)):''}</div>`:''}
          ${hasCoord?`<button onclick="event.stopPropagation();viewOnMap(${r.lat},${r.lng})" style="margin-top:6px;padding:6px 12px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.35);color:#3182f6;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;">🗺️ 지도보기</button>`:''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;align-self:flex-start;flex-shrink:0;">
          <span class="lbadge" style="background:${isOg?'rgba(231,76,60,.22)':'rgba(39,174,96,.2)'};color:${isOg?'#ff6b5e':'#3ad17a'};">${isOg?'진행중':'종료'}</span>
          ${isOg&&_elapsedStr(r.date)?`<span class="js-elapsed" data-d="${_esc(r.date)}" style="font-size:10px;font-weight:700;color:#f0a500;white-space:nowrap;">⏱ ${_elapsedStr(r.date)}</span>`:''}
        </div>
      </div>`;
    };
    if(_og.length)cards.push(_hdr('🔴 진행중 구조 '+_og.length,'#ff6b5e'),..._og.map(_mkCard));
    if(_dn.length)cards.push(_hdr('✅ 종료 '+_dn.length,'#3ad17a'),..._dn.map(_mkCard));
  }
  if(_showHaz){
    cards=cards.concat((haz.filter(h=>_dateOkL(h.date)&&_resMatchSearch(h))).slice().reverse().map(h=>{
      const done=h.hazStatus&&h.hazStatus!=='미조치'&&h.hazStatus!=='조치중';
      const hasCoord=!!(h.lat&&h.lng);
      return `<div class="haz-card ${done?'haz-removed':''}" onclick="openHazDetail(${h.id})" style="border-left:3px solid ${done?'#27ae60':'#e67e22'};">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="font-size:22px;">${h.hazType?.split(' ')[0]||'⚠️'}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;color:#eaecef;font-weight:600;">${_esc(h.hazType||'위험상황')} · ${_esc(h.loc||'-')}${(h.mobilize&&h.mobilize.length)?` <span style="font-size:9px;background:rgba(231,76,60,.18);color:#e74c3c;border:1px solid rgba(231,76,60,.4);border-radius:9px;padding:1px 6px;font-weight:700;vertical-align:middle;">🚨 ${_esc(h.mobilize.join('·'))}</span>${_mobilizeCompactBadge(h)}`:''}</div>
            <div style="font-size:11px;color:#949aa2;margin-top:3px;">${h.dt||'-'} · ${_esc(h.danger||'-')} · ${_esc(h.author||'-')}</div>
            <div style="font-size:11px;color:#8b95a1;margin-top:2px;">${_esc((h.desc||'').slice(0,40))}${(h.desc||'').length>40?'...':''}</div>
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
    html+=`<button onclick="_moreResList()" style="width:100%;margin-top:8px;padding:11px;border-radius:10px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);color:#3182f6;font-size:13px;font-weight:700;cursor:pointer;">▾ 더 보기 (${_tot-_resListLimit}건 더)</button>`;
  }
  // 실시간 구독은 최근 90일 — 그 이전 기록은 버튼으로 지연 로드(기기 캐시 우선이라 두 번째부터는 서버 읽기 0)
  if(typeof _ARCHIVE_COLLS!=='undefined'&&_ARCHIVE_COLLS.some(k=>(k==='rescues'||k==='hazards')&&!_archiveLoaded[k])){
    html+=`<button onclick="_loadOldResRecords(this)" style="width:100%;margin-top:8px;padding:10px;border-radius:10px;border:1px dashed rgba(255,255,255,.18);background:rgba(255,255,255,.03);color:#949aa2;font-size:12px;font-weight:700;cursor:pointer;">📜 90일 이전 기록 불러오기</button>`;
  }
  document.getElementById('resListWrap').innerHTML=html||'<div class="empty"><div class="empty-ico">📋</div><div class="empty-txt">해당 항목 없음</div><button onclick="resetResFilter()" style="margin-top:10px;padding:7px 16px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.35);color:#3182f6;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">🔄 필터 초기화</button></div>';
}
// 90일 이전 기록 지연 로드 → 목록·지도 갱신 (기기 캐시 우선이라 첫 1회만 서버 읽기)
function _loadOldResRecords(btn){
  if(btn){btn.disabled=true;btn.textContent='📜 불러오는 중…';}
  Promise.all(['rescues','hazards'].filter(k=>typeof _ARCHIVE_COLLS!=='undefined'&&_ARCHIVE_COLLS.includes(k)).map(k=>_loadArchive(k)))
    .then(()=>{try{renderResList();}catch(e){}try{renderRescueMap();}catch(e){}toast('📜 지난 기록을 불러왔습니다');});
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
    // 응소(mobilizeResp) 회신 — 가장 이른 '응소 가능' 회신 시각 + 인원수
    let tResp=null,nResp=0;(r.mobilizeResp||[]).forEach(x=>{if(x&&x.status==='eta'){nResp++;const t=_parseDT(x.time);if(t&&(!tResp||t<tResp))tResp=t;}});
    return {t0,tEnc,tDesc,tHand,tDone,tResp,nResp};
  });
  const avg=list=>{const v=list.filter(x=>x!=null&&x>=0&&x<48*60);return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):null;};
  const diffMin=(a,b)=>(a!=null&&b!=null&&b>=a)?Math.round((b-a)/60000):null;
  const encMins=arr.map(x=>diffMin(x.t0,x.tEnc));
  const careMins=arr.map(x=>diffMin(x.tEnc,x.tHand||x.tDone||x.tDesc));
  const totMins=arr.map(x=>diffMin(x.t0,x.tHand||x.tDone));
  const respMins=arr.map(x=>diffMin(x.t0,x.tResp)); // B: 신고→첫 응소 회신
  const fmt=m=>m==null?'-':(m>=60?Math.floor(m/60)+'시간 '+(m%60)+'분':m+'분');
  const aEnc=avg(encMins),aCare=avg(careMins),aTot=avg(totMins),aResp=avg(respMins);
  const nEnc=encMins.filter(x=>x!=null).length,nCare=careMins.filter(x=>x!=null).length,nTot=totMins.filter(x=>x!=null).length,nResp=respMins.filter(x=>x!=null).length;
  const totRespPeople=arr.reduce((a,x)=>a+(x.nResp||0),0); // C: 누적 응소 인원
  if(!nEnc&&!nCare&&!nTot&&!nResp)return '';
  const cell=(label,val,n,col)=>`<div style="background:#0f0f11;border-radius:8px;padding:9px 6px;text-align:center;">
    <div style="font-size:15px;font-weight:800;color:${col};line-height:1.2;">${fmt(val)}</div>
    <div style="font-size:9px;color:#8b95a1;margin-top:3px;">${label}</div>
    <div style="font-size:8px;color:#454e5a;margin-top:1px;">n=${n}</div>
  </div>`;
  return `<div class="scard"><div class="stitle">⏱ 평균 대응시간</div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:5px;">
      ${cell('신고→응소회신',aResp,nResp,'#e8b34a')}
      ${cell('신고→환자조우',aEnc,nEnc,'#3182f6')}
      ${cell('환자조우→인계',aCare,nCare,'#e67e22')}
      ${cell('신고→상황종료',aTot,nTot,'#27ae60')}
    </div>
    <div style="font-size:9px;color:#454e5a;margin-top:7px;line-height:1.5;">※ 타임라인·응소 회신 시각 기준. 단계 기록이 있는 건만 집계(n).${totRespPeople?` · 누적 응소 회신 <b style="color:#e8b34a;">${totRespPeople}명</b>`:''}</div>
  </div>`;
}
// ── 사고원인 → 대표 원인분류(9종) 매핑 ── 사용자 사고대장 엑셀의 '원인분류' 열에서 추출한 실제 분류.
// 흩어진 사고원인 표기(추락3m·개인질환·고립…)를 넘어짐/무리한산행/추락/심정지/조난/벌쏘임/낙석/자살추정/기타로 통합.
const _CAUSE_MAP={"3m추락":"추락","40~50m추락":"추락","5m추락":"추락","7m추락":"추락","강우로인한":"조난","강풍넘어짐":"넘어짐","강풍으로넘어짐":"넘어짐","개인질환":"심정지","계단에서구름":"넘어짐","고립":"조난","고무패들걸려넘어짐":"넘어짐","고사목":"낙석","고혈당추정":"심정지","공황장애및지병":"무리한산행","과도한스트레스":"무리한산행","과로":"심정지","굴러떨어짐":"넘어짐","급체":"무리한산행","기립성저혈압":"심정지","기상악화":"조난","기저질환":"심정지","기타":"기타","길을잃음":"조난","길잃음":"조난","낙빙":"낙석","낙상":"넘어짐","낙석":"낙석","내과질환":"무리한산행","넘어져구름":"넘어짐","넘어져추락":"넘어짐","넘어짐":"넘어짐","노면단차":"넘어짐","노후된시설물":"넘어짐","눈미끄러짐":"넘어짐","돌깔림사고":"무리한산행","돌밝고넘어짐":"넘어짐","돌밝고삐긋":"넘어짐","돌밟고미끄러짐":"넘어짐","돌밟고삐끗":"넘어짐","돌탑":"낙석","동·식물":"벌쏘임","무리하산행":"무리한산행","무리한등반":"무리한산행","무리한산행":"무리한산행","무리한신행":"무리한산행","미끄러짐":"넘어짐","미상":"심정지","바닥단차":"넘어짐","바위를잘못밝아미끄러짐":"무리한산행","발목골절":"넘어짐","발목부상":"넘어짐","발목염좌":"넘어짐","발목접질림":"넘어짐","뱀물림":"벌쏘임","벌쏘임":"벌쏘임","벌쏘임및넘어짐":"벌쏘임","변사자":"자살추정","변사체":"자살추정","보강재걸려넘어짐":"넘어짐","복부통증,토혈":"무리한산행","부정맥":"심정지","부주의":"넘어짐","부주의및추락":"추락","불법산행":"조난","빗길미끄러짐":"넘어짐","사망":"심정지","산행준비미흡":"무리한산행","산행중연락두절":"조난","실족":"넘어짐","실족염좌":"넘어짐","실종":"조난","실종신고":"조난","실종자수색":"조난","심정지":"심정지","심혈관질환":"심정지","쓰러짐":"무리한산행","어깨팔골":"무리한산행","원인미상":"심정지","음주":"무리한산행","음주넘어짐":"넘어짐","의식,호흡없음":"심정지","의식소실":"심정지","이석증추정":"무리한산행","자살추정":"자살추정","장비미숙":"조난","저체온증":"무리한산행","저혈당":"심정지","저혈압쓰러짐":"심정지","접질림":"넘어짐","조난":"조난","주취자":"넘어짐","지병":"심정지","추락":"추락","추락10m":"추락","추락3m":"추락","탈진,발목염좌":"넘어짐","탈출로고립":"조난","탐방로이탈계곡진입":"넘어짐","폭설":"조난","폭설실종":"조난","하강로프꼬임":"조난","하강로프부족":"조난","해충":"벌쏘임","헛디딤":"넘어짐","호흡곤란":"심정지","흉통":"기타","흔들바위밀다가":"넘어짐"};
// 표시 순서(엑셀 원인분류 기반 + 의료 세분: 심정지 버킷을 심정지/질환/원인미상으로 분리)
const _CAUSE_CATS=['넘어짐','무리한산행','추락','심정지','질환','원인미상','조난','벌쏘임','낙석','자살추정','기타'];
// 사고원인 원문 → 대표 분류. 엑셀 매핑표 우선 → 키워드 추정. 그 후 의료 세분화 적용.
// (엑셀은 개인질환·저혈당·원인미상을 모두 '심정지등'으로 뭉쳤으나, 실제 심정지와 개인질환·원인미상은 구분)
function _causeCanon(s){
  const raw=String(s||'').trim();if(!raw)return '';
  const k=raw.replace(/\([^)]*\)/g,'').replace(/\s+/g,'').trim();
  // 원인미상은 어느 버킷보다 우선
  if(/^미상$|원인미상|불명/.test(k))return '원인미상';
  // 개인질환·지병성 키워드 → 질환 (심정지·추락 등 명확한 외인은 아래 매핑이 이미 처리)
  if(/개인질환|기저질환|내과질환|심혈관|부정맥|저혈당|고혈당|저혈압|기립성|당뇨|이석증|흉통|복통|지병|급체|호흡곤란|천식|한랭질환/.test(k))return '질환';
  let cat=_CAUSE_MAP[k];
  if(!cat){
    if(/추락|떨어/.test(k))cat='추락';
    else if(/벌|뱀|해충|물림|쏘/.test(k))cat='벌쏘임';
    else if(/낙석|낙빙|고사목|돌탑/.test(k))cat='낙석';
    else if(/자살|변사/.test(k))cat='자살추정';
    else if(/조난|고립|실종|길잃|길을잃|연락두절|수색/.test(k))cat='조난';
    else if(/심정지|심장|돌연사|의식|호흡/.test(k))cat='심정지';
    else if(/질환|지병|쓰러|과로/.test(k))cat='질환';
    else if(/넘어|미끄|실족|낙상|접질|헛디|삐끗|삐긋|골절|염좌/.test(k))cat='넘어짐';
    else if(/무리|탈진|음주|저체온|산행/.test(k))cat='무리한산행';
    else cat='기타';
  }
  // 엑셀이 '심정지'로 뭉쳐둔 것 중 실제 심정지 아닌 건 질환으로 (개인질환·과로 등)
  if(cat==='심정지'&&!/심정지|심장|돌연사|의식|호흡|사망/.test(k))cat='질환';
  return cat;
}
// ── 부상유형 정규화 ── 앱 실제 데이터(injuryTypes)엔 '실족 발목염좌'·'미끄러져 발목부상'처럼 경위(실족·미끄러짐·추락)가 섞임.
// 경위는 떼고 실제 부상만 임상 종류로 통합(발목염좌·발목 접질림→염좌 등). 순수 사고원인(고립·조난·변사)은 부상 아님으로 제외(사고원인·결과에 이미 잡힘).
function _injKind(s){
  const t=String(s||'').replace(/\s+/g,'');
  if(!t)return '';
  if(/사망/.test(t))return '사망';
  if(/심정지|의식불명|의식없음|의식소실|의식저하|호흡없음/.test(t))return '심정지·의식';
  if(/탈골|탈구/.test(t))return '탈구';
  if(/골절|다발성골/.test(t))return '골절';
  if(/염좌|접질림|접지름|삠|삐끗|삐긋/.test(t))return '염좌';
  if(/열상|찢/.test(t))return '열상';
  if(/찰과|까짐|쓸림/.test(t))return '찰과상';
  if(/타박/.test(t))return '타박상';
  if(/출혈|유혈/.test(t))return '출혈';
  if(/마비|파열/.test(t))return '기타외상';
  if(/탈진|체력저하|기진|무기력/.test(t))return '탈진';
  if(/저체온/.test(t))return '저체온증';
  if(/열사병|일사병|온열/.test(t))return '온열질환';
  if(/경련|쥐/.test(t))return '경련';
  if(/어지럼|현기|어지러|현훈/.test(t))return '어지럼증';
  if(/호흡곤란|과호흡/.test(t))return '호흡곤란';
  if(/벌쏘|벌에|뱀물|뱀에|물림|쏘임/.test(t))return '벌쏘임·교상';
  if(/화상/.test(t))return '화상';
  if(/흉통|가슴통증|심장/.test(t))return '흉통';
  if(/복통|배아픔/.test(t))return '복통';
  if(/저혈당|고혈당|저혈압|고혈압|지병|기저질환|질환|당뇨|통풍|알러지|알레르기|부정맥|디스크|급체|구토|메스꺼|울렁|이석/.test(t))return '질환';
  if(/통증|아픔|결림|근육통|두통|부어오름|부음|불편|거동불가|저림/.test(t))return '통증';
  if(/부상|외상|손상|다침/.test(t))return '기타외상';
  if(/변사|자살|수색|실종|고립|길잃음|길을잃음|조난|미귀가|귀가신고|랜턴|방전|장비미숙|로프|미끄러짐|실족|추락|넘어짐|부주의|미상|무리한산행/.test(t))return ''; // 부상 아닌 상황
  return '기타';
}
// 부상부위 추출(경위·부상종류 섞인 원문에서 신체 부위만)
function _injPartOf(s){
  const t=String(s||'').replace(/\s+/g,'');
  if(/발목/.test(t))return '발목';
  if(/무릎|슬관절/.test(t))return '무릎';
  if(/골반/.test(t))return '골반';
  if(/허리|요추/.test(t))return '허리';
  if(/두부|머리|안면|얼굴|이마|코뼈|광대|턱/.test(t))return '머리·안면';
  if(/어깨|쇄골/.test(t))return '어깨';
  if(/손목|손가락|손등|팔꿈치|팔|상완|전완/.test(t))return /손/.test(t)?'손·손목':'팔';
  if(/갈비|늑골|흉부|가슴/.test(t))return '가슴';
  if(/종아리|정강|허벅지|다리|하퇴|대퇴/.test(t))return '다리';
  if(/발(?!목)/.test(t))return '발';
  if(/전신|다발성/.test(t))return '전신';
  return '';
}
function renderRescueStats(){
  document.getElementById('topTitle').textContent='재난/구조 관리';
  // 기간을 과거·전체로 넓힌 통계를 위해 1년 이전 기록도 1회 로드(평소엔 최근 1년만 구독) — 로드되면 자동 재집계
  if(typeof _ARCHIVE_COLLS!=='undefined'&&_ARCHIVE_COLLS.some(k=>!_archiveLoaded[k])){
    Promise.all(_ARCHIVE_COLLS.map(_loadArchive)).then(()=>{try{if(window._rescueTab===3||document.getElementById('rescueStatsWrap'))renderRescueStats();}catch(e){}});
  }
  if(!window._rescueStatTab)window._rescueStatTab='rescue';
  if(typeof _HAZ_OFF!=='undefined'&&_HAZ_OFF)window._rescueStatTab='rescue'; // 위험상황 비활성화 — 통계도 구조만
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
  const hbar=(k,v,max,col='#3182f6')=>{
    const pct=Math.round(v/max*100);
    return `<div style="display:flex;align-items:center;gap:5px;margin-bottom:5px;">
      <div style="width:64px;font-size:9px;color:#a5abb3;text-align:right;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${k}</div>
      <div style="flex:1;height:8px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${col};border-radius:4px;"></div>
      </div>
      <div style="width:22px;font-size:9px;color:${col};font-weight:700;text-align:right;flex-shrink:0;">${v}</div>
    </div>`;
  };
  const mini=(l,v,col='#eaecef')=>`<div style="background:#0f0f11;border-radius:7px;padding:6px 4px;text-align:center;"><div style="font-size:15px;font-weight:800;color:${col};line-height:1.2;">${v}</div><div style="font-size:8px;color:#454e5a;margin-top:1px;">${l}</div></div>`;
  const chartCard=(title,obj,col,byKey)=>{
    // byKey=true: 값(건수) 순이 아니라 항목의 자연 순서(시간대·연령대·월 등)로 정렬 — 분포를 읽기 위한 차트
    const entries=Object.entries(obj).filter(([,v])=>v>0)
      .sort(byKey?((a,b)=>a[0].localeCompare(b[0],'ko',{numeric:true})):((a,b)=>b[1]-a[1]));
    if(!entries.length)return '';
    const mx=safeMax(obj);
    return `<div class="scard"><div class="stitle">${title}</div>${entries.map(([k,v])=>hbar(k,v,mx,col)).join('')}</div>`;
  };
  const w=document.getElementById('rescueStatsWrap');
  // 엑셀 다운로드 카드: 날짜 범위 선택
  if(!window._statExpFrom){window._statExpFrom=new Date().getFullYear()+'-01-01';} // 기본: 올해 1월 1일 ~ 오늘
  if(!window._statExpTo)window._statExpTo=today();
  const _rangeChip=(lbl,f,t)=>`<span onclick="window._statExpFrom='${f}';window._statExpTo='${t}';renderRescueStats();" style="cursor:pointer;padding:4px 10px;border-radius:12px;font-size:10.5px;font-weight:700;background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.3);color:#5dbf8a;">${lbl}</span>`;
  const _y=new Date().getFullYear();
  const expCard=`<div class="scard" style="border-color:rgba(39,174,96,.25);">
    <div class="stitle" style="color:#27ae60;">📅 기간 · 📥 엑셀 다운로드 <span style="font-size:9px;font-weight:400;color:#6b7684;">기간은 아래 사고다발구간에도 적용</span></div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
      <input type="date" value="${window._statExpFrom}" onchange="window._statExpFrom=this.value;renderRescueStats();"
        style="flex:1;background:#0f0f11;border:1px solid rgba(255,255,255,.12);color:#c4c8ce;border-radius:7px;padding:7px 8px;font-size:12px;color-scheme:dark;">
      <span style="font-size:11px;color:#454e5a;flex-shrink:0;">~</span>
      <input type="date" value="${window._statExpTo}" onchange="window._statExpTo=this.value;renderRescueStats();"
        style="flex:1;background:#0f0f11;border:1px solid rgba(255,255,255,.12);color:#c4c8ce;border-radius:7px;padding:7px 8px;font-size:12px;color-scheme:dark;">
    </div>
    <div style="display:flex;gap:5px;margin-bottom:8px;">${_rangeChip('이번달',mon+'-01',today())}${_rangeChip('올해',_y+'-01-01',today())}${_rangeChip('전체','2020-01-01',today())}</div>
    <button onclick="downloadStatsExcel('${tab}')"
      style="width:100%;padding:9px;border-radius:8px;background:rgba(39,174,96,.13);border:1px solid rgba(39,174,96,.4);color:#27ae60;font-size:12px;font-weight:700;cursor:pointer;">
      📥 ${tab==='rescue'?'구조보고':'위험상황'} 자료 다운로드 (.csv)
    </button>
  </div>`;
  if(tab==='rescue'){
    // ── 통계 정규화 — 흩어진 표기 합치기: 괄호 제거·띄어쓰기 제거로 변형 통합(무리한 산행=무리한산행, 발목 염좌=발목염좌), 성별(남성/남→남) ──
    const _statBase=s=>String(s||'').replace(/\([^)]*\)/g,'').replace(/\s+/g,'').trim();
    const _statGender=g=>{const s=String(g||'').trim();return /^남/.test(s)?'남':/^여/.test(s)?'여':'';};
    const injMap={},injPartMap={},sevMap={},cauMap={},methodMap={},ageMap={},timeMap={},genderMap={},loctypeMap={},weatherMap={},outcomeMap={};
    res.forEach(r=>{
      if(r.outcome){outcomeMap[r.outcome]=(outcomeMap[r.outcome]||0)+1;}
      // 부상: 구조화 r.injuries[{type,part}] 우선, 없으면 레거시 injuryTypes/injuryParts.
      // _injKind로 경위(실족·미끄러짐) 떼고 임상 종류로 통합, _injPart로 부위 추출(순수 사고원인은 제외)
      if(Array.isArray(r.injuries)&&r.injuries.length){
        r.injuries.forEach(i=>{
          if(!i)return;
          const t=_injKind(i.type);if(t)injMap[t]=(injMap[t]||0)+1;
          const pt=_injPartOf(i.part)||_injPartOf(i.type);if(pt)injPartMap[pt]=(injPartMap[pt]||0)+1;
        });
      } else {
        (r.injuryTypes||[]).forEach(v=>{const t=_injKind(v);if(t)injMap[t]=(injMap[t]||0)+1;const pt=_injPartOf(v);if(pt)injPartMap[pt]=(injPartMap[pt]||0)+1;});
        (r.injuryParts||[]).forEach(p=>{const pt=_injPartOf(p)||_statBase(p);if(pt)injPartMap[pt]=(injPartMap[pt]||0)+1;});
      }
      if(r.severity){const k=_statBase(r.severity);if(k)sevMap[k]=(sevMap[k]||0)+1;}
      if(r.cause){const k=_causeCanon(r.cause);if(k)cauMap[k]=(cauMap[k]||0)+1;}
      (r.rescueMethod||[]).forEach(m=>{const k=_statBase(m);if(k)methodMap[k]=(methodMap[k]||0)+1;});
      {const g=_statGender(r.vGender);if(g)genderMap[g]=(genderMap[g]||0)+1;} // 남성/남→남, 여성/여→여, 미상 제외
      if(r.loctype){const k=_statBase(r.loctype);if(k)loctypeMap[k]=(loctypeMap[k]||0)+1;}
      if(r.weather){const k=_statBase(r.weather);if(k)weatherMap[k]=(weatherMap[k]||0)+1;}
      {let age=r.vBirth?_ageFromBirth(r.vBirth):(r.vAge!=null&&r.vAge!==''?parseInt(r.vAge):'');if(age!==''&&!isNaN(age)){const ag=age<20?'10대 이하':age<30?'20대':age<40?'30대':age<50?'40대':age<60?'50대':age<70?'60대':'70대+';ageMap[ag]=(ageMap[ag]||0)+1;}}
      // 발생 시각: r.date("YYYY-MM-DD HH:MM" 또는 "...THH:MM")에서 시(時) 추출 (r.time 필드는 존재하지 않음)
      {const _tm=(r.date||'').match(/[ T](\d{1,2}):/);if(_tm){const h=parseInt(_tm[1],10);const b=Math.floor(h/2)*2;const k=String(b).padStart(2,'0')+'~'+String(b+2).padStart(2,'0')+'시';timeMap[k]=(timeMap[k]||0)+1;}}
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
          ${mini('이번달',res.filter(r=>r.date&&r.date.startsWith(mon)).length,'#3182f6')}
        </div>
      </div>
      <div class="scard">
        <div class="stitle">🔥 사고 다발 구간 (히트맵) <span style="font-size:9px;font-weight:400;color:#6b7684;">${window._statExpFrom} ~ ${window._statExpTo}</span></div>
        <div id="heatMapEl" style="width:100%;height:280px;border-radius:9px;overflow:hidden;background:#0f0f11;"></div>
        <div id="heatTopList" style="margin-top:8px;"></div>
      </div>
      ${respCard}
      ${chartCard('📈 월별 구조 발생 (최근 6개월)',rMonSorted,'#e05050',true)}
      ${chartCard('⏰ 발생 시간대 <span style="font-size:9px;font-weight:400;color:#6b7684;">2시간 단위 · 시간 순</span>',timeMap,'#3182f6',true)}
      ${chartCard('👤 연령대 <span style="font-size:9px;font-weight:400;color:#6b7684;">나이 순</span>',ageMap,'#9b59b6',true)}
      ${chartCard('⚧ 성별',genderMap,'#3498db')}
      ${chartCard('🚑 구조유형',Object.fromEntries(Object.keys(RES_TYPES).map(t=>[t,res.filter(r=>r.type===t).length]).filter(([,v])=>v)),'#e05050')}
      ${chartCard('🚩 결과',outcomeMap,'#c0392b')}
      ${chartCard('⚡ 사고원인',cauMap,'#e67e22')}
      ${chartCard('🩹 부상유형',injMap,'#c0392b')}
      ${chartCard('🦵 부상부위',injPartMap,'#d35400')}
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
        <div class="stitle">🔥 사고 다발 구간 (히트맵) <span style="font-size:9px;font-weight:400;color:#6b7684;">${window._statExpFrom} ~ ${window._statExpTo}</span></div>
        <div id="heatMapEl" style="width:100%;height:280px;border-radius:9px;overflow:hidden;background:#0f0f11;"></div>
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
  // 통계 기간(엑셀 다운로드 카드의 날짜 범위)과 연동 — 그 기간의 사고만 집계
  const _hf=window._statExpFrom||'',_ht=window._statExpTo||'';
  const allData=(tab==='haz'?(DB.g('hazards')||[]):(DB.g('rescues')||[]))
    .filter(r=>{const d=String(r.date||'').slice(0,10);return d&&(!_hf||d>=_hf)&&(!_ht||d<=_ht);});
  if(!allData.length){el.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:11px;color:rgba(255,255,255,.25);">선택 기간에 기록 없음</div>';const tl=document.getElementById('heatTopList');if(tl)tl.innerHTML='';return;}

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
    // 시인성: 사고가 많은 곳일수록 불투명도↑(지도가 잘 안 보일 정도) + 반경↑. 숫자 라벨은 표시 안 함(요청).
    const maxN=Math.max(...cells.map(c=>c.n),1);
    cells.forEach(c=>{
      const pos=new kakao.maps.LatLng(c.lat,c.lng);
      bounds.extend(pos);
      const op=Math.min(0.3+(c.n/maxN)*0.55,0.85); // 1건→옅게, 최다 발생지→거의 불투명(0.85)
      new kakao.maps.Circle({
        center:pos,radius:150+Math.min(c.n,10)*55,
        fillColor:colOf(c.n),fillOpacity:op,strokeWeight:1.5,strokeColor:colOf(c.n),strokeOpacity:Math.min(op+0.1,0.95),map
      });
    });
    if(cells.length>1)map.setBounds(bounds,30);else map.setCenter(new kakao.maps.LatLng(cells[0].lat,cells[0].lng));
  }catch(e){}
  // TOP 5 순위
  const top=document.getElementById('heatTopList');
  if(top){
    top.innerHTML=cells.slice(0,5).map((c,i)=>`<div style="display:flex;align-items:center;gap:7px;padding:3px 0;">
      <span style="font-size:9px;font-weight:800;color:${i===0?'#e74c3c':'#a5abb3'};width:14px;">${i+1}</span>
      <span style="font-size:11px;color:#c4c8ce;flex:1;">${c.label}</span>
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
function _popRow(ico,val){return val?`<div style="display:flex;gap:5px;margin-bottom:3px;"><span style="color:#565f6b;flex-shrink:0;">${ico}</span><span style="color:#cdd1d6;font-size:11px;">${_esc(val)}</span></div>`:'';}
// 구조 팝업 본문(우선순위·추가보고 병합) — 지도 팝업·목록/홈 오버레이가 공용으로 사용
function _resPopMetaHtml(data){
  const isOg=data.status==='ongoing';
  const _skip=v=>{if(!v)return true;const s=String(v).trim();return !s||s==='-'||['미상','없음','모르겠음','알수없음','미정','해당없음','기타'].includes(s);};
  const _arr=v=>(Array.isArray(v)?v:typeof v==='string'?[v]:[]).filter(x=>!_skip(x));
  const d=(typeof _mergedRescue==='function')?_mergedRescue(data):data; // 추가보고 최신 정보 병합
  const _injStr=(()=>{const il=(Array.isArray(d.injuries)?d.injuries:[]).filter(i=>i&&(i.part||i.type));if(il.length)return il.map(i=>(typeof _injLabel==='function')?_injLabel(i):((i.part||'')+(i.type||''))).filter(Boolean).join(', ');const ip=_arr(d.injuryParts),it=_arr(d.injuryTypes);return (ip.join(', ')+(it.length?' / '+it.join(', '):'')).trim();})();
  const _vLine=[!_skip(d.vName)?_esc(d.vName):'미상',(!_skip(d.vBirth)?_ageFromBirth(d.vBirth)+'세':(!_skip(d.vAge)?_esc(d.vAge)+'세':'')),(!_skip(d.vGender)&&d.vGender!=='알수없음'?_esc(d.vGender):''),(!_skip(d.vTel)?_esc(_fmtTel(d.vTel)):'')].filter(Boolean).join(' · ');
  return `
    <div style="display:flex;gap:5px;margin-bottom:7px;align-items:center;">
      <span style="font-size:10px;padding:2px 7px;border-radius:9px;font-weight:700;background:${isOg?'rgba(192,57,43,.2)':'rgba(39,174,96,.15)'};color:${isOg?'#e05050':'#27ae60'};">${isOg?'진행중':'종료'}</span>
      <span style="font-size:10px;color:#454e5a;">${_esc(d.type)}</span>
    </div>
    <div style="background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.3);border-radius:9px;padding:9px 11px;margin-bottom:6px;">
      <div style="font-size:9px;color:#ff8a73;font-weight:800;margin-bottom:2px;">🤕 부상 정도</div>
      <div style="font-size:14px;font-weight:800;color:#ffd9d0;line-height:1.35;">${_injStr||'<span style="font-size:12px;color:#9c7a72;font-weight:600;">미입력</span>'}${!_skip(d.severity)?` <span style="font-size:10px;color:#fff;background:#c0392b;border-radius:5px;padding:1px 6px;vertical-align:middle;">${_esc(d.severity)}</span>`:''}</div>
    </div>
    ${!_skip(d.location)?`<div style="font-size:12px;color:#d5d8dc;margin-bottom:6px;">📍 ${_esc(d.location)}${(typeof _elevStr==='function'&&data.lat&&data.lng)?` <span style="color:#a7f3e4;font-size:10px;">${_elevStr(data.lat,data.lng,data.alt)}</span>`:''}${!_skip(d.loctype)?` <span style="color:#8b95a1;font-size:10px;">· ${_esc(d.loctype)}</span>`:''}</div>`:''}
    <div style="display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-bottom:6px;"><span style="font-size:10px;color:#565f6b;font-weight:700;">사고자</span><span style="font-size:12px;color:#eaecef;font-weight:600;">${_vLine}</span>${!_skip(d.vTel)?_telBtnsHtml(d.vTel,data.id,'사고자',d.vName):''}</div>
    ${(d.victims2&&d.victims2.length)?d.victims2.map((v,vi)=>`<div style="display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-bottom:6px;"><span style="font-size:10px;color:#e9897e;font-weight:700;">추가사고자${d.victims2.length>1?vi+1:''}</span><span style="font-size:12px;color:#f0d9d4;">${_esc([v.name||'미상',v.age?v.age+'세':'',(v.gender&&v.gender!=='알수없음')?v.gender:'',v.tel?_fmtTel(v.tel):''].filter(Boolean).join(' · '))}</span>${v.tel?_telBtnsHtml(v.tel,data.id,'추가 사고자',v.name):''}</div>`).join(''):''}
    ${(!_skip(d.repName)||!_skip(d.repTel))?`<div style="display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-bottom:6px;"><span style="font-size:10px;color:#565f6b;font-weight:700;">신고자</span><span style="font-size:12px;color:#d5d8dc;">${[!_skip(d.repName)?_esc(d.repName):'',!_skip(d.repTel)?_esc(_fmtTel(d.repTel)):''].filter(Boolean).join(' · ')}</span>${!_skip(d.repRel)?`<span style="font-size:10px;color:#e8b34a;background:rgba(232,179,74,.1);border:1px solid rgba(232,179,74,.3);border-radius:5px;padding:1px 6px;font-weight:700;">${_esc(d.repRel)}</span>`:''}${!_skip(d.repTel)?_telBtnsHtml(d.repTel,data.id,'신고자',d.repName):''}</div>`:''}
    ${(d.companions&&d.companions.length)?d.companions.map((c,ci)=>`<div style="display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-bottom:6px;"><span style="font-size:10px;color:#565f6b;font-weight:700;">동반자${d.companions.length>1?ci+1:''}</span><span style="font-size:12px;color:#d5d8dc;">${_esc((c.name||'미상')+(c.tel?' '+_fmtTel(c.tel):''))}</span>${c.tel?_telBtnsHtml(c.tel,data.id,'동반자',c.name):''}</div>`).join(''):''}
    ${_sosLiveLineHtml(data)}
    ${!_skip(d.reception)?`<div style="font-size:11px;color:#c4c8ce;line-height:1.5;background:#1c1c1e;border-radius:8px;padding:8px 10px;"><span style="font-size:9px;color:#565f6b;font-weight:700;">📝 접수내용</span><br>${_esc(d.reception)}</div>`:''}`;
}
// 실시간 위치 안내줄(연결된 SOS 링크 전원 — 사고자/동반자/신고자/추가 사고자 역할 표시)
// 사고자 줄에만 '위치 채택' 버튼. 없으면 빈 문자열
function _sosLiveLineHtml(data){
  const all=(typeof _linkedSosAll==='function')?_linkedSosAll(data):[];
  if(!all.length)return '';
  return all.map(({ping:p,role,name})=>{
    const dist=(data.lat&&data.lng&&typeof _haversineKm==='function')?Math.round(_haversineKm(data.lat,data.lng,p.lat,p.lng)*1000):null;
    const mm=p.ts?Math.round((Date.now()-(p.ts||0))/60000):null;
    const far=dist!=null&&dist>=30;
    const isVictim=role==='사고자';
    const ev=(typeof _elevStr==='function')?_elevStr(p.lat,p.lng,p.alt):'';
    return `<div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:6px;background:rgba(20,184,166,.08);border:1px solid rgba(20,184,166,.32);border-radius:8px;padding:7px 9px;">
    <span style="font-size:10px;color:#2dd4bf;font-weight:800;">🆘 ${_esc(role)}${name?' '+_esc(String(name).slice(0,8)):''}</span>
    <span style="font-size:11px;color:#a7f3e4;font-family:monospace;">${(+p.lat).toFixed(5)}, ${(+p.lng).toFixed(5)}</span>
    ${ev?`<span style="font-size:10px;color:#a7f3e4;">${ev}</span>`:''}
    ${mm!=null?`<span style="font-size:10px;color:#5a9e94;">${mm}분 전</span>`:''}
    ${dist!=null?`<span style="font-size:10px;font-weight:700;color:${far?'#ffb454':'#5a9e94'};">최초접수와 ${dist}m</span>`:''}
    ${isVictim?`<button onclick="event.stopPropagation();adoptSosLoc('${data.id}')" style="margin-left:auto;background:rgba(20,184,166,.18);color:#2dd4bf;border:1px solid rgba(20,184,166,.4);border-radius:6px;padding:3px 9px;font-size:11px;font-weight:700;cursor:pointer;">📍 위치 채택</button>`:''}
  </div>`;
  }).join('');
}
// 목록·홈에서 탭 → 전역 오버레이(지도 화면이 아니어도 뜸)로 동일 팝업 표시
function openRescueOverlay(id){
  const data=(DB.g('rescues')||[]).find(x=>String(x.id)===String(id));if(!data)return;
  selResId=id;curResId=id;
  const ti=RES_TYPES[data.type]||RES_TYPES['기타'];
  let m=document.getElementById('resOverlay');
  if(!m){m=document.createElement('div');m.id='resOverlay';document.body.appendChild(m);}
  m.style.cssText='position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center;';
  m.innerHTML=`<div style="background:#16161a;width:100%;max-width:480px;max-height:85vh;overflow-y:auto;border-radius:14px 14px 0 0;padding:16px 16px calc(20px + env(safe-area-inset-bottom));box-shadow:0 -4px 20px rgba(0,0,0,.7);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;"><span style="font-size:15px;font-weight:800;color:#eaecef;line-height:1.3;">${ti.ico} ${_esc(data.title)}</span><button onclick="var e=document.getElementById('resOverlay');if(e)e.remove();" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:24px;cursor:pointer;line-height:1;flex-shrink:0;">×</button></div>
    ${_navBtns('rescue',id,'openResListDetail')}
    ${_resPopMetaHtml(data)}
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button onclick="var e=document.getElementById('resOverlay');if(e)e.remove();selResId=${id};curResId=${id};viewReport();" style="flex:1;padding:12px;border-radius:9px;border:1px solid rgba(49,130,246,.45);background:rgba(49,130,246,.14);color:#3182f6;font-size:13px;font-weight:800;cursor:pointer;">📋 보고서 · 타임라인 보기</button>
      ${data.lat&&data.lng?`<button onclick="var e=document.getElementById('resOverlay');if(e)e.remove();viewOnMap(${data.lat},${data.lng})" style="flex:none;padding:12px 14px;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#c4c8ce;font-size:13px;font-weight:700;cursor:pointer;">🗺️</button>`:''}
    </div>
  </div>`;
  m.onclick=function(e){if(e.target===m)m.remove();};
}
function openResPopup(id,type='rescue'){
  const data=type==='rescue'?(DB.g('rescues')||[]).find(x=>String(x.id)===String(id)):(DB.g('hazards')||[]).find(x=>String(x.id)===String(id));if(!data)return;
  selResId=id;
  if(type==='rescue'){
    const ti=RES_TYPES[data.type]||RES_TYPES['기타'];
    document.getElementById('resPopTitle').textContent=ti.ico+' '+data.title;
    document.getElementById('resPopMeta').innerHTML=_resPopMetaHtml(data);
    document.getElementById('btnViewRep').style.display='block';
    {const _tl=document.getElementById('btnViewTl');if(_tl)_tl.style.display='none';} // 보고서·타임라인 버튼 통합 — 타임라인 단독버튼 폐지
    const _bt=document.getElementById('btnViewTeams');if(_bt)_bt.style.display=(data.teams&&data.teams.length)?'block':'none';
    // 출동 거점·좌표복사(라우트) 블록 제거 — 팝업에 불필요
    const rEl=document.getElementById('resPopRoutes');
    if(rEl){rEl.innerHTML='';rEl.style.display='none';}
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
    ].filter(Boolean).join('')||'<div style="color:#565f6b;font-size:11px;">상세 정보 없음</div>';
    document.getElementById('btnViewRep').style.display='none';
    document.getElementById('btnViewTl').style.display='none';
    const _bt2=document.getElementById('btnViewTeams');if(_bt2)_bt2.style.display='none';
    const rEl2=document.getElementById('resPopRoutes');if(rEl2)rEl2.style.display='none';
  }
  document.getElementById('facPopup').classList.remove('on');
  document.getElementById('resPopup').classList.add('on');
  // 지도에서 이 사고에 집중: 나머지 마커 흐리게 (여러 사고 동시 발생 시 시인성)
  try{if(mapR){const mv=document.getElementById('v-rescue-map');if(mv&&mv.classList.contains('on'))_popupFocusDim(id);}}catch(e){}
}

function openHazDetail(id){
  const h=(DB.g('hazards')||[]).find(x=>x.id===id);if(!h)return;
  let ov=document.getElementById('hazDetailOv');
  if(!ov){ov=document.createElement('div');ov.id='hazDetailOv';document.body.appendChild(ov);}
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:flex-end;';
  ov.innerHTML=`<div style="background:#0a0a0c;border-radius:14px 14px 0 0;width:100%;max-height:80vh;max-height:80dvh;overflow:hidden;display:flex;flex-direction:column;border-top:.5px solid rgba(230,126,34,.3);">
    <div style="padding:14px 16px 10px;display:flex;align-items:center;justify-content:space-between;border-bottom:.5px solid rgba(255,255,255,.07);flex-shrink:0;">
      <span style="font-size:13px;font-weight:700;color:#eaecef;">${_esc(h.hazType||'위험상황')}</span>
      <button onclick="document.getElementById('hazDetailOv').style.display='none'" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:20px;cursor:pointer;padding:0 4px;line-height:1;">×</button>
    </div>
    <div style="overflow-y:auto;flex:1;padding:12px 14px;">
      <div style="font-size:12px;color:#c4c8ce;line-height:1.8;">
        ${h.leadAgency?`주관기관: <b style="color:#3ad17a;">🌲 ${_esc(h.leadAgency)}</b><br>`:''}
        위치: <b>${_esc(h.loc||'-')}</b><br>
        시각: ${_esc(h.dt||'-')}<br>
        위험도: ${_esc(h.danger||'-')}<br>
        상태: <b style="color:${h.hazStatus==='미조치'?'#e05050':(h.hazStatus==='조치중'?'#e67e22':'#27ae60')};">${_esc(h.hazStatus||'-')}</b><br>
        작성: ${_esc(h.author||'-')}
        ${h.desc?`<br><br>${_esc(h.desc)}`:''}
      </div>
      <div style="margin-top:12px;">
        <div style="font-size:11px;color:#8b95a1;font-weight:700;margin-bottom:6px;">상태 변경</div>
        <div style="display:flex;gap:6px;">
          ${['미조치','조치중','제거 완료','통제중'].map(st=>{
            const on=(h.hazStatus||'미조치')===st;
            const col=st==='미조치'?'#e05050':(st==='조치중'?'#e67e22':'#27ae60');
            return `<button onclick="_setHazStatus(${h.id},'${st}')" style="flex:1;padding:7px 2px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid ${on?col:'rgba(255,255,255,.12)'};background:${on?col+'22':'transparent'};color:${on?col:'rgba(255,255,255,.45)'};">${st}</button>`;
          }).join('')}
        </div>
      </div>
      ${(h.statusLog&&h.statusLog.length)?`<div style="margin-top:12px;">
        <div style="font-size:11px;color:#8b95a1;font-weight:700;margin-bottom:6px;">📋 상태 이력</div>
        ${h.statusLog.slice().reverse().map(s=>`<div style="display:flex;gap:8px;font-size:11px;padding:4px 0;border-top:1px solid rgba(255,255,255,.05);">
          <span style="color:#6a93b5;font-family:monospace;flex-shrink:0;">${_esc((s.at||'').slice(5,16))}</span>
          <span style="color:${s.status==='미조치'?'#e05050':(s.status==='조치중'?'#e67e22':'#27ae60')};font-weight:700;flex:1;">${_esc(s.status)}</span>
          <span style="color:#6b7684;flex-shrink:0;">${_esc(s.by||'-')}</span>
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

