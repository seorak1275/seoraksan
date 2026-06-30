'use strict';
// ── 전역 오류 기록: 현장에서 "삐걱거림" 원인 추적용 (관리자 → 시스템 탭) ──
function _logErr(msg){
  try{
    const log=JSON.parse(localStorage.getItem('_errLog')||'[]');
    log.unshift({t:new Date().toISOString().slice(5,16).replace('T',' '),m:String(msg).slice(0,180)});
    localStorage.setItem('_errLog',JSON.stringify(log.slice(0,30)));
  }catch(e){}
  try{_uploadErr(msg);}catch(e){} // 관리자가 모든 기기 오류를 모아볼 수 있도록 서버에도 기록(웹/앱·작성자 포함)
}
// 오류를 Firestore(errLogs)에 업로드 — 폭주 방지(같은 오류 세션당 1회 + 최소 3초 간격)
var _errUpLast=0,_errUpSeen={};
function _uploadErr(msg){
  try{
    var db=(typeof _fdb!=='undefined'&&_fdb)?_fdb:null;if(!db)return;
    var key=String(msg).slice(0,80);
    if(_errUpSeen[key])return;
    var nowMs=Date.now();if(nowMs-_errUpLast<3000)return;
    _errUpSeen[key]=1;_errUpLast=nowMs;
    var u={};try{u=DB.g('currentUser')||{};}catch(e){}
    db.collection('errLogs').add({
      m:String(msg).slice(0,200),
      dev:(typeof _MY_DEVICE_ID!=='undefined'?_MY_DEVICE_ID:''),
      by:(u.realName||u.name||''),dept:(u.dept||''),
      plat:(typeof _isNativeApp==='function'&&_isNativeApp())?'APP':'WEB',
      at:nowMs
    }).catch(function(){});
  }catch(e){}
}
// 카카오 프로필 사진 URL은 http:// 로 오는데, 앱이 https://localhost 출처라 혼합콘텐츠로 차단됨 → https로 승격
function _imgHttps(u){return String(u||'').replace(/^http:\/\//i,'https://');}
// 개발자(나) 카카오ID — 항상 관리자·삭제/역할변경 불가·전체초기화 권한. (재등록 불필요)
const _DEV_KAKAO_ID='4896979764';
window.addEventListener('error',e=>{_logErr((e.message||'오류')+' @'+(e.filename||'').split('/').pop()+':'+(e.lineno||''));});
window.addEventListener('unhandledrejection',e=>{_logErr('Promise: '+((e.reason&&e.reason.message)||e.reason||'거부'));});

// ── 앱 버전 (CI 빌드 시 릴리스 태그로 자동 스탬프됨) ──
const APP_VER='v0';
try{document.getElementById('appVerLabel').textContent='설악산 현장관리 '+APP_VER;}catch(e){}

// ── 새 버전 알림: 네이티브 앱에서만, GitHub 최신 릴리스 태그와 비교 ──
function _checkAppUpdate(){
  try{
    const Cap=window.Capacitor;
    if(!Cap||!Cap.isNativePlatform||!Cap.isNativePlatform())return;
    if(!/^v\d{8}-\d{4}$/.test(APP_VER))return; // CI 스탬프 안 된 개발 빌드는 스킵
    const last=parseInt(localStorage.getItem('_updCheckAt')||'0',10);
    if(Date.now()-last<6*3600*1000)return; // 6시간에 한 번만 확인
    fetch('https://api.github.com/repos/109yoon/seoraksan/releases/latest')
      .then(r=>r.ok?r.json():null)
      .then(rel=>{
        // 확인이 실제로 성공했을 때만 6시간 창을 소모(오프라인/실패 시 다음 호출에서 재시도)
        localStorage.setItem('_updCheckAt',String(Date.now()));
        if(!rel||!rel.tag_name)return;
        if(!/^v\d{8}-\d{4}$/.test(rel.tag_name))return; // 형식이 다른 태그는 비교하지 않음(오탐 방지)
        if(rel.tag_name>APP_VER)_showUpdateBanner(rel);
      }).catch(()=>{});
  }catch(e){}
}
function _showUpdateBanner(rel){
  if(document.getElementById('updateBanner'))return;
  const asset=(rel.assets||[]).find(a=>/\.apk$/i.test(a.name));
  const url=(asset&&asset.browser_download_url)||rel.html_url;
  const div=document.createElement('div');
  div.id='updateBanner';
  div.style.cssText='position:fixed;left:10px;right:10px;bottom:14px;z-index:99999;background:#1d6fa5;color:#fff;padding:12px 14px;border-radius:12px;font-size:13px;display:flex;align-items:center;justify-content:space-between;gap:10px;box-shadow:0 4px 14px rgba(0,0,0,.3);';
  div.innerHTML='<span>🆕 새 버전('+rel.tag_name+')이 있습니다</span>';
  const btnWrap=document.createElement('div');
  btnWrap.style.cssText='display:flex;gap:8px;flex-shrink:0;';
  const dlBtn=document.createElement('a');
  dlBtn.textContent='업데이트';
  dlBtn.href=url;
  dlBtn.style.cssText='background:#fff;color:#1d6fa5;padding:6px 12px;border-radius:6px;font-weight:700;text-decoration:none;white-space:nowrap;';
  const closeBtn=document.createElement('button');
  closeBtn.type='button';
  closeBtn.textContent='닫기';
  closeBtn.style.cssText='background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5);padding:6px 10px;border-radius:6px;white-space:nowrap;';
  closeBtn.onclick=function(){div.remove();};
  btnWrap.appendChild(dlBtn);btnWrap.appendChild(closeBtn);
  div.appendChild(btnWrap);
  document.body.appendChild(div);
}
setTimeout(_checkAppUpdate,4000);
// ══════════════════════════════════════════
// DB
// ══════════════════════════════════════════
// ── Firebase 설정 ──
const _FB_CFG={
  apiKey:"AIzaSyACBoT-h2h0aQXYJpPyznc3JBzprEhhUAw",
  authDomain:"seoraksan.firebaseapp.com",
  projectId:"seoraksan",
  storageBucket:"seoraksan.firebasestorage.app",
  messagingSenderId:"457414135264",
  appId:"1:457414135264:web:4103268ba0702a95a12f85"
};
// 기기 간 공유할 키 목록
// _SHARED_COLL: 항목마다 개별 Firestore 문서 (Race Condition 방지)
// facilities: 시설물 다수(표지판 169+)·점검사진 누적으로 단일문서 1MB 한계·동시편집 덮어쓰기 위험 → 건별 문서로 전환
// history: 점검이력은 무제한으로 계속 쌓이는 로그성 데이터라 단일문서 그대로 두면 매 점검마다 전체가 전원에게 재전송됨 → 건별 문서로 전환
const _SHARED_COLL=['rescues','hazards','facilities','history'];
// _SHARED_DOC: 단일 문서에 JSON 배열 저장 (관리자 전용, 동시 쓰기 없음)
const _SHARED_DOC=['alertOps','staff','catFac','catFacMeta','pendingUsers','approvedUsers','deletedKakaoIds','adminOwnerKakaoId','adminApprovalCode','extAgencies','extAgencyCode','extAgencyDisplayName','geminiApiKey','kmaProxyUrl','_acl','loginLog','trailStatus','crisisLevel','weatherBrief','weatherLog','trailLog','sosBlocked','autoApprove','pushLog','devKakaoId'];
// 시설물 레거시(단일문서) 폴백/시드 동기화 상태
let _legacyFacBackup=null; // appData/facilities(구버전)의 백업 — 컬렉션 비었을 때 화면 폴백
let _facSeedReady=false;   // 시설물 첫 스냅샷·레거시 백업 확인 완료(시드 레이스 방지)
let _facMigTried=false;    // 레거시→건별 이관 1회 시도 플래그
const _SHARED=[..._SHARED_COLL,..._SHARED_DOC]; // 하위 호환용
// 1년 이상 지난 구조/위험상황/점검이력 기록은 실시간 동기화 대상에서 빼고, 조회 시에만 1회 불러온다.
// (수백 명이 동시 접속해도 매번 전체 역대기록을 받지 않도록 — id가 Date.now() 기반이라 시간 필터에 그대로 쓸 수 있음)
const _ARCHIVE_COLLS=['rescues','hazards','history'];
const _ARCHIVE_CUTOFF_DAYS=365;
let _fsRecent={},_fsArchive={}; // k별: 실시간 구간 / 1회 조회한 과거 구간
let _archiveLoaded={}; // k별: 과거 구간 로드 완료(또는 시도중) 여부
// 실시간 구간(_fsRecent)+과거 구간(_fsArchive)을 합쳐 _fs[k]/_fsSync[k] 재구성
// (id 중복 시 실시간 구간 우선 — 경계 시점에 양쪽에 다 걸려도 최신 데이터로 통일)
function _rebuildFsColl(k){
  const map=new Map();
  (_fsArchive[k]||[]).forEach(r=>map.set(String(r.id),r));
  (_fsRecent[k]||[]).forEach(r=>map.set(String(r.id),r));
  const list=Array.from(map.values());
  try{list.sort((a,b)=>(Number(b.id)||0)-(Number(a.id)||0));}catch{}
  _fs[k]=list;
  const syncMap=new Map();
  list.forEach(r=>{syncMap.set(String(r.id),JSON.stringify(r));});
  _fsSync[k]=syncMap;
}
// 1년 이전 과거 기록을 1회 조회해 _fsArchive에 채운다(세션당 1회, 조회 시에만 호출)
function _loadArchive(k){
  if(!_ARCHIVE_COLLS.includes(k)||_archiveLoaded[k]||!_fdb)return Promise.resolve();
  _archiveLoaded[k]=true;
  const cutoff=Date.now()-_ARCHIVE_CUTOFF_DAYS*86400000;
  return _fdb.collection(k).where('id','<',cutoff).get().then(snap=>{
    _fsArchive[k]=snap.docs.map(d=>d.data());
    _rebuildFsColl(k);
  }).catch(()=>{_archiveLoaded[k]=false;});
}
var _remoteUpdateTimer=null; // module scope: shared across all Firebase listeners
const _fs={};   // Firestore 인메모리 캐시
let _fdb=null;
let _fst=null;
let _fmsg=null;
let _authReady=false;  // 인증(익명 또는 커스텀 토큰) 성공 여부
let _authErrCode='';   // 인증 실패 코드 (auth/operation-not-allowed 등)
let _authRole='';      // 커스텀 토큰 역할: 'admin' | 'member' | '' (익명/미인증)
let _authKakaoId='';   // 인증된 카카오 ID (커스텀 토큰 발급 시)
let _swReg=null;
// 기기 고유 ID (localStorage 영속, 알림 브로드캐스트 출처 구분용)
const _MY_DEVICE_ID=(function(){
  let id=localStorage.getItem('_deviceId');
  if(!id){id=Date.now().toString(36)+Math.random().toString(36).slice(2);localStorage.setItem('_deviceId',id);}
  return id;
})();
let _maxSharedNotiAt=0,_sharedNotiInited=false;

// 마지막 동기화 상태 스냅샷 (k → Map(id→json)) — DB.g가 캐시 참조를 그대로 반환하므로
// 호출부가 제자리 수정하면 _fs[k]와 새 값이 동일 객체가 되어 비교가 무의미해짐.
// 동기화 시점의 JSON을 따로 보관해 그것과 비교해야 변경이 정확히 감지됨.
const _fsSync={};
// _SHARED_DOC(단일문서 배열)의 동기화 기준 시점 스냅샷 — DB.s/원격 리스너에서만 갱신.
// 호출부가 DB.g 반환값을 push 등으로 제자리 수정해도 이 맵은 영향받지 않으므로,
// "직전 동기화 시점에 있었지만 지금 없는 항목 = 의도적 삭제"를 정확히 구분할 수 있다.
const _fsDocBase={};

// ── 저장 재시도 큐: Firebase 미준비/쓰기 거부 시 localStorage에 보관 후 자동 재전송 ──
// (오프라인 중 쓰기는 Firestore persistence가 자체 보존하므로, 여기서는
//  _fdb가 아직 null인 부팅 직후 호출과 권한 거부 등 하드 실패만 담당)
function _loadSyncQ(){try{return JSON.parse(localStorage.getItem('_syncQ')||'[]');}catch{return[];}}
function _saveSyncQ(q){try{localStorage.setItem('_syncQ',JSON.stringify(q));}catch{}_updateSyncBadge();}
function _updateSyncBadge(){
  const n=_loadSyncQ().length;
  const b=document.getElementById('syncBadge'),c=document.getElementById('syncBadgeN');
  if(b)b.style.display=n?'inline':'none';
  if(c)c.textContent=n;
  _updateHomeNetStatus();
}
// 홈 화면 상단의 항상 보이는 네트워크/동기화 상태 칩 (현장 신호 약한 환경 대비)
function _updateHomeNetStatus(){
  const el=document.getElementById('homeNetStatus');if(!el)return;
  const n=(typeof _loadSyncQ==='function')?_loadSyncQ().length:0;
  if(!navigator.onLine){
    el.textContent='📡 오프라인'+(n?' · 저장 '+n+'건 대기':'');
    el.style.color='#e74c3c';el.style.display='inline';
  }else if(n){
    el.textContent='⏳ 동기화 '+n+'건 ↻';
    el.style.color='#f0a500';el.style.display='inline';
  }else{
    el.style.display='none';
  }
}
let _syncQWarnedAt=0;
function _syncWriteFailed(item){ // item: {key, op:'set'|'del', coll?, id?, doc?, json?}
  const q=_loadSyncQ();
  const i=q.findIndex(x=>x.key===item.key);
  if(i>=0)q[i]=item;else q.push(item); // 같은 문서는 최신 내용으로 교체
  _saveSyncQ(q);
  if(Date.now()-_syncQWarnedAt>30000){
    _syncQWarnedAt=Date.now();
    // 인증이 안 된 상태면 원인을 명확히 안내 (콘솔 익명 인증 누락이 가장 흔함)
    var msg=_authErrCode==='auth/operation-not-allowed'
      ?'⚠️ 동기화 차단: Firebase 익명 인증이 꺼져 있습니다 (관리자 설정 필요)'
      :(!_authReady?'⚠️ 인증 대기 중 — 동기화는 인증 완료 후 자동 재시도':'⚠️ 서버 저장 대기 중 — 연결되면 자동 재시도');
    try{toast(msg);}catch(e){}
  }
}
let _syncQFlushing=false;
// 큐에서 특정 항목 제거 (key+json 동시 일치 — 플러시 중 갱신된 최신본 보호)
function _removeSyncItem(it){
  const cur=_loadSyncQ();const ci=cur.findIndex(x=>x.key===it.key&&x.json===it.json);
  if(ci>=0){cur.splice(ci,1);_saveSyncQ(cur);}
}
function _flushSyncQueue(){
  if(_syncQFlushing||!_fdb)return;
  const q=_loadSyncQ();
  if(!q.length){_updateSyncBadge();return;}
  _syncQFlushing=true;
  (async()=>{
    let ok=0;
    for(const it of q){
      try{
        if(it.doc!==undefined)await _txMergeDoc(it.doc,it.base!==undefined?JSON.parse(it.base):undefined,JSON.parse(it.json)); // 트랜잭션 병합(오프라인 큐도 통째 덮어쓰기 방지)
        else if(it.op==='del')await _fdb.collection(it.coll).doc(it.id).delete();
        else await _txMergeSet(it.coll,it.id,JSON.parse(it.json)); // 트랜잭션 병합(오프라인 변경분 재접속 시 서버 최신본과 합침)
        _removeSyncItem(it);ok++;
      }catch(e){
        // 데이터 신뢰성 최우선 — 실패해도 절대 폐기하지 않고 큐에 보존, 무한 재시도.
        // 단 한 항목의 실패가 뒤 항목을 막지 않도록 break 대신 continue(head-of-line blocking 제거).
        const code=(e&&e.code)||'';
        console.warn('[syncQ] 저장 실패(보존·재시도 예정):',it.key,'code='+code,e&&e.message);
        _markSyncFail(it,code,e&&e.message);
      }
    }
    _syncQFlushing=false;
    if(ok&&!_loadSyncQ().length)try{toast('✅ 대기 변경 '+ok+'건 동기화 완료');}catch(e){}
  })();
}
// 실패 항목에 진단 정보 누적 (시도 횟수·마지막 에러) — 폐기는 하지 않음
function _markSyncFail(it,code,msg){
  const cur=_loadSyncQ();const ci=cur.findIndex(x=>x.key===it.key&&x.json===it.json);
  if(ci>=0){cur[ci]=Object.assign({},cur[ci],{_n:(cur[ci]._n||0)+1,_err:code||'unknown',_errMsg:(msg||'').slice(0,140),_at:Date.now()});_saveSyncQ(cur);}
}
// 대기 항목 상세 — 무엇이/왜 안 되는지 사용자가 직접 확인
function _showSyncQueueInfo(){
  const q=_loadSyncQ();
  if(!q.length){try{toast('대기 중인 변경 없음');}catch(e){}return;}
  const lines=q.map(function(it,i){
    var what=it.doc!==undefined?('문서 '+it.doc):((it.op==='del'?'삭제 ':'저장 ')+it.coll+'/'+it.id);
    var sz=it.json?(' ~'+Math.round(it.json.length/1024)+'KB'):'';
    var tries=it._n?(' · 시도 '+it._n+'회'):'';
    var err=it._err?('\n   사유: '+it._err+(it._errMsg?(' — '+it._errMsg):'')):'';
    return (i+1)+'. '+what+sz+tries+err;
  });
  // 권한 오류(permission-denied)가 끼어 있으면 = member 토큰 만료/누락 → 자동복구 시도 후, 실패 시 재로그인 유도
  var permErr=q.some(function(it){return /permission|insufficient/i.test(it._err||'')||/permission|insufficient/i.test(it._errMsg||'');});
  if(permErr){
    _ensureMemberAuth().then(function(okk){
      if(okk){setTimeout(_flushSyncQueue,400);try{toast('✅ 저장 권한 복구됨 — 동기화 재시도');}catch(e){}}
      else{ if(confirm('저장 권한이 만료된 것 같습니다('+q.length+'건 대기).\n카카오로 다시 로그인하면 즉시 동기화됩니다.\n\n지금 다시 로그인할까요? (데이터는 안전하게 보존됨)')){try{kakaoLogin();}catch(e){}} }
    });
    return;
  }
  alert('서버에 아직 저장되지 못한 변경 '+q.length+'건:\n\n'+lines.join('\n\n')+'\n\n※ 자동으로 계속 재시도하며, 데이터는 이 기기에 안전하게 보존됩니다.\n※ 1000KB(1MB) 이상이면 Firestore 문서 한계로 저장 불가 — 사진을 줄여야 합니다.');
}
function _clearSyncQueue(){
  if(!confirm('서버에 아직 전송되지 않은 변경 '+_loadSyncQ().length+'건을 삭제하시겠습니까?\n(이미 저장된 데이터는 영향 없음)'))return;
  _saveSyncQ([]);
  toast('✅ 대기 항목 삭제됨');
}
window.addEventListener('online',()=>setTimeout(_flushSyncQueue,1500));
setInterval(_flushSyncQueue,45000);
_updateSyncBadge(); // 이전 세션에서 남은 대기 건 표시
// 네트워크 끊김을 동기화 실패 전에 즉시 알림 (대기 큐 배지는 쓰기가 실패해야만 뜸)
function _updateOfflineBadge(){const b=document.getElementById('offlineBadge');if(b)b.style.display=navigator.onLine?'none':'inline';_updateHomeNetStatus();}
window.addEventListener('online',_updateOfflineBadge);
window.addEventListener('offline',_updateOfflineBadge);
_updateOfflineBadge(); // 시작 시 1회 — 오프라인 상태로 켜도 배지가 바로 뜨도록
_updateOfflineBadge();

// 사용자 입력에서 태그 주입 차단: 공유 데이터 저장 시 <,>를 전각 문자로 치환
function _stripTags(v){
  if(typeof v==='string')return v.replace(/</g,'\uFF1C').replace(/>/g,'\uFF1E');
  if(Array.isArray(v))return v.map(_stripTags);
  if(v&&typeof v==='object'){const o={};for(const k in v)o[k]=_stripTags(v[k]);return o;}
  return v;
}
const _SANITIZE_KEYS=['rescues','hazards','pendingUsers'];
// ── 동시편집 병합: 누적 데이터(보고·댓글·타임라인·통과기록)는 합집합 보존, 단일값은 최신(로컬) 우선 ──
function _unionBy(server,local,keyFn){
  const map=new Map();let n=0;
  (server||[]).forEach(x=>{try{map.set(keyFn(x),x);}catch{map.set('_s'+(n++),x);}});
  (local||[]).forEach(x=>{try{map.set(keyFn(x),x);}catch{map.set('_l'+(n++),x);}});
  return [...map.values()];
}
// 로컬 레코드를 서버 최신본과 병합. 누적 배열만 union, 나머지 필드는 로컬 유지.
function _mergeRecord(local,server){
  if(!server||typeof server!=='object')return local;
  const out=Object.assign({},local);
  const fields=[
    ['reports',r=>r&&r.rid?('rid:'+r.rid):((r&&r.repTime||'')+'|'+(r&&r.author||'')+'|'+(r&&r.update||''))],
    ['comments',c=>(c&&c.id!=null)?('id:'+c.id):JSON.stringify(c)],
    ['timetable',e=>JSON.stringify(e)],
    ['wpLog',e=>JSON.stringify(e)],
    ['npsLog',e=>JSON.stringify(e)],
    ['photos',p=>(p&&p.url)?('url:'+p.url):JSON.stringify(p)],
    ['mobilizeResp',m=>(m&&m.name)?('name:'+m.name):JSON.stringify(m)], // 응소 응답(이름별 1건, 본인 응답은 항상 최신 로컬값 우선)
    ['fireTL',e=>JSON.stringify(e)] // 산불 진행 타임라인(등록 후에도 계속 추가됨)
  ];
  fields.forEach(([f,keyFn])=>{
    if(!Array.isArray(local[f])&&!Array.isArray(server[f]))return; // 양쪽 다 없으면 손대지 않음
    out[f]=_unionBy(server[f],local[f],keyFn);
  });
  if(Array.isArray(out.reports))out.reports.sort((a,b)=>String((a&&a.repTime)||'').localeCompare(String((b&&b.repTime)||'')));
  if(Array.isArray(out.fireTL))out.fireTL.sort((a,b)=>String((a&&a.time)||'').localeCompare(String((b&&b.time)||'')));
  // 추가 사고자(victims2): 병합된 보고 중 가장 최신 보고의 값을 신뢰
  // (한쪽 기기가 오프라인 중 작성한 stale 본으로 다른 기기가 추가한 사고자가 덮여 사라지는 것을 방지)
  if(Array.isArray(out.reports)&&out.reports.length){
    const latest=out.reports[out.reports.length-1];
    if(latest&&latest.victims2)out.victims2=latest.victims2;
  }
  // 종료 처리(status:'done')는 한쪽이라도 완료면 유지 — 동시편집으로 완료 처리가 되돌려지지 않게 함
  if(server.status==='done'||local.status==='done')out.status='done';
  // 시설 점검 상태: 두 기기가 같은 시설을 동시 점검하면 더 최근 점검(statusAt 큰 쪽)을 신뢰
  // — 트랜잭션 커밋 순서가 아니라 실제 점검 시각으로 승자를 정해 결과가 뒤바뀌지 않게 함
  if(server.statusAt!=null&&local.statusAt!=null&&server.statusAt>local.statusAt&&server.status){out.status=server.status;out.statusAt=server.statusAt;}
  // 환자 인계 기록은 더 최신 시각 쪽을 유지
  if(server.handover&&(!local.handover||String(server.handover.time||'')>String(local.handover.time||'')))out.handover=server.handover;
  return out;
}
// 건별 문서 1건을 트랜잭션으로 병합 저장(서버 최신본과 누적데이터 합침). 실패 시 reject → 호출부가 큐 보존.
function _txMergeSet(coll,id,localObj){
  const ref=_fdb.collection(coll).doc(id);
  return _fdb.runTransaction(t=>t.get(ref).then(snap=>{
    const merged=_mergeRecord(localObj,snap.exists?snap.data():null);
    t.set(ref,merged);
    return merged;
  }));
}
// 단일문서(JSON 배열) 항목 식별 키 — id 있으면 id, 없으면(문자열 등) 값 자체
function _sdItemKey(x){return(x&&typeof x==='object'&&x.id!=null)?('id:'+x.id):JSON.stringify(x);}
// 3-way 병합(base/local/server): base에는 있었지만 local에 없는 항목은 "의도적 삭제"로
// 보고 복원하지 않는다. base에 없던 항목이 local에 새로 생겼으면 추가, server에만 있는
// (다른 기기가 추가한) 항목은 그대로 보존 — 단순 합집합(union)과 달리 삭제가 안전하게 반영됨.
function _mergeSharedArray(base,local,server){
  const baseIds=new Set((base||[]).map(_sdItemKey));
  const localIds=new Set((local||[]).map(_sdItemKey));
  const removedIds=new Set([...baseIds].filter(id=>!localIds.has(id)));
  const localMap=new Map((local||[]).map(x=>[_sdItemKey(x),x]));
  const out=[];const seen=new Set();
  (server||[]).forEach(x=>{
    const id=_sdItemKey(x);
    if(removedIds.has(id))return; // 로컬에서 의도적으로 삭제한 항목 — 복원하지 않음
    out.push(localMap.has(id)?localMap.get(id):x); // 같은 id면 로컬 버전(수정분) 우선
    seen.add(id);
  });
  (local||[]).forEach(x=>{
    const id=_sdItemKey(x);
    if(!seen.has(id)){out.push(x);seen.add(id);} // 로컬에서 새로 추가된 항목
  });
  return out;
}
// appData/{key} 단일문서를 트랜잭션으로 병합 저장.
// base(직전 동기화 시점 스냅샷)가 있을 때만 3-way 병합 시도 — 여러 기기가 동시에
// 점검이력·가입신청 등을 추가해도 한쪽 기기의 덮어쓰기로 다른 기기의 항목이
// 통째로 사라지지 않는다. base가 없거나 배열이 아니면(딕셔너리/스칼라) 기존처럼 로컬 우선.
function _txMergeDoc(key,base,localVal){
  const ref=_fdb.collection('appData').doc(key);
  return _fdb.runTransaction(t=>t.get(ref).then(snap=>{
    let serverVal=null;
    if(snap.exists){try{serverVal=JSON.parse(snap.data().d);}catch(e){serverVal=null;}}
    const merged=(Array.isArray(localVal)&&Array.isArray(serverVal)&&Array.isArray(base))
      ?_mergeSharedArray(base,localVal,serverVal):localVal;
    t.set(ref,{d:JSON.stringify(merged)});
    return merged;
  }));
}
let _lsQuotaWarned=false; // localStorage 용량 초과 통지 1회 제한 플래그
const DB={
  g(k){
    if(_SHARED.includes(k)) return (_fs[k]!==undefined)?_fs[k]:null;
    try{return JSON.parse(localStorage.getItem('v7_'+k)||'null');}catch{return null;}
  },
  s(k,v){
    if(k==='facilities')_invalidateSignCache();
    if(_SANITIZE_KEYS.includes(k))v=_stripTags(v);
    if(_SHARED_COLL.includes(k)){
      _fs[k]=v||[];
      const prevJson=_fsSync[k]||new Map();
      const newJson=new Map();
      (v||[]).forEach(r=>{newJson.set(String(r.id),JSON.stringify(r));});
      // 새로 추가되거나 변경된 항목만 개별 문서에 저장 (실패 시 재시도 큐)
      newJson.forEach((json,id)=>{
        if(prevJson.get(id)===json)return;
        if(_fdb)_txMergeSet(k,id,JSON.parse(json)).catch(()=>_syncWriteFailed({key:k+'/'+id,op:'set',coll:k,id,json}));
        else _syncWriteFailed({key:k+'/'+id,op:'set',coll:k,id,json});
      });
      // 삭제된 항목 제거
      prevJson.forEach((_,id)=>{
        if(newJson.has(id))return;
        if(_fdb)_fdb.collection(k).doc(id).delete().catch(()=>_syncWriteFailed({key:k+'/'+id,op:'del',coll:k,id}));
        else _syncWriteFailed({key:k+'/'+id,op:'del',coll:k,id});
      });
      _fsSync[k]=newJson;
    }else if(_SHARED_DOC.includes(k)){
      const base=_fsDocBase[k]; // DB.s/원격 리스너에서만 갱신되는 기준 스냅샷(제자리수정 영향 없음)
      _fs[k]=v;_fsDocBase[k]=v;
      const json=JSON.stringify(v);
      if(_fdb)_txMergeDoc(k,base,v).catch(()=>_syncWriteFailed({key:'doc/'+k,doc:k,json,base:JSON.stringify(base===undefined?null:base)}));
      else _syncWriteFailed({key:'doc/'+k,doc:k,json,base:JSON.stringify(base===undefined?null:base)});
    }else{
      try{localStorage.setItem('v7_'+k,JSON.stringify(v));}
      catch(e){ // 저장 공간 초과 등으로 실패 시 조용히 넘어가지 않고 1회 통지
        if(!_lsQuotaWarned){_lsQuotaWarned=true;try{toast('⚠️ 기기 저장 공간 부족 — 일부 설정이 저장되지 않았습니다');}catch(_){}}
      }
    }
  },
  d(k){
    if(_SHARED_COLL.includes(k)){
      const prev=_fs[k]||[];
      _fs[k]=[];
      if(_fdb) prev.forEach(r=>_fdb.collection(k).doc(String(r.id)).delete().catch(()=>_syncWriteFailed({key:k+'/'+r.id,op:'del',coll:k,id:String(r.id)})));
      _fsSync[k]=new Map();
    }else if(_SHARED_DOC.includes(k)){
      _fs[k]=null;
      if(_fdb) _fdb.collection('appData').doc(k).delete().catch(()=>{});
    }else{
      localStorage.removeItem('v7_'+k);
    }
  },
  sync(){} // no-op (이전 코드 호환)
};

function initFirebase(onReady){
  try{
    if(!firebase.apps.length) firebase.initializeApp(_FB_CFG);
    // 익명 인증: Firestore 보안 규칙(request.auth != null)을 적용하기 위한 기반.
    // 인증 성공/실패를 추적하고, 성공 시 대기 큐를 즉시 재전송한다.
    try{
      firebase.auth().onAuthStateChanged(function(u){
        if(u){
          _authReady=true;_authErrCode='';
          // 커스텀 토큰(비익명) 세션이면 새로고침 후에도 클레임에서 역할 복원
          if(!u.isAnonymous){
            u.getIdTokenResult().then(function(r){
              var c=(r&&r.claims)||{};
              if(c.member){
                _authRole=c.admin?'admin':'member';
                _authKakaoId=c.kakaoId||'';
                if(c.admin)localStorage.setItem('_tokenAdmin','1');else localStorage.removeItem('_tokenAdmin');
                try{_markMemberOk();}catch(e){}
              }else{
                // 비익명인데 member 클레임이 없는 비정상 세션 → 카카오로 재발급 시도
                setTimeout(function(){try{_ensureMemberAuth();}catch(e){}},400);
              }
              try{updateUserUI();}catch(e){}
              try{_enforceAccessGate();}catch(e){}
            }).catch(function(){});
          }else{
            // 익명 세션: 카카오 로그인 이력이 있으면 member 토큰으로 자동 승급
            // (새 규칙은 member 클레임 없는 쓰기를 거부하므로, 재로그인 없이 권한 복원)
            setTimeout(function(){try{_ensureMemberAuth();}catch(e){}},500);
          }
          setTimeout(_flushSyncQueue,300); // 인증 완료 → 막혔던 쓰기 즉시 재시도
        }else{
          // 로그인 세션이 전혀 없을 때만 익명 인증으로 폴백.
          // (커스텀 토큰 세션은 위 분기에서 유지되므로 덮어쓰지 않는다.)
          firebase.auth().signInAnonymously().catch(function(e){
            _authErrCode=(e&&e.code)||'auth/unknown';
            // 익명 인증이 콘솔에서 꺼져 있으면 모든 쓰기가 막힌다 → 사용자에게 명확히 안내
            if(_authErrCode==='auth/operation-not-allowed'){
              setTimeout(function(){try{toast('⚠️ Firebase 익명 인증이 꺼져 있어 동기화가 안 됩니다 (관리자: 콘솔에서 익명 로그인 활성화 필요)');}catch(e){}},2500);
            }
          });
        }
      });
    }catch(e){_authErrCode='auth/init-failed';}
    _fdb=firebase.firestore();
    _fdb.enablePersistence().catch(()=>{});
    _fst=firebase.storage();
    try{_fmsg=firebase.messaging();}catch(e){}
    setTimeout(_flushSyncQueue,3000); // 부팅 직후 대기 큐 재전송
    setTimeout(_processPhotoQueue,5000); // 이전 세션 오프라인 사진 이어서 업로드
    setTimeout(_cleanOldSharedNotis,8000); // 세션당 1회: 24h 지난 브로드캐스트 알림 정리(확률 의존 X)
    const totalKeys=_SHARED.length;
    const loaded=new Set();
    function _checkReady(){if(loaded.size===totalKeys){onReady&&onReady();onReady=null;}}
    function _onRemoteUpdate(){
      _checkDeletedUser();updateSummary();
      // 관리자에서 강등(_acl)되면 즉시 반영 — 옛 플래그 정리 + 관리자 화면이면 홈으로
      try{
        if(typeof isAdminUser==='function'&&!isAdminUser()){
          if(localStorage.getItem('_adminAuthed')==='1'||localStorage.getItem('_tokenAdmin')==='1'){
            localStorage.removeItem('_adminAuthed');localStorage.removeItem('_tokenAdmin');
            if(window.curApp==='admin'){try{toast('관리자 권한이 해제되었습니다');}catch(e){}try{goHome();}catch(e){}}
          }
        }
      }catch(e){}
      try{_checkNewJoinerAlert();}catch(e){}
      // 새 기기 첫 로그인: 동기화 전이라 프로필을 못 찾아 입력창이 떴어도, pendingUsers가 도착하면
      // 서버 기록에서 자동 복원하고 입력창을 닫음(개인정보 재입력 방지)
      try{
        var _cu=DB.g('currentUser')||{};
        if(_resolveAuthType()==='kakao'&&_cu.kakaoId&&!(_cu.dept&&_cu.rank&&(_cu.realName||_cu.name))){
          if(_restoreProfileFromServer(_cu.kakaoId)){
            updateUserUI();
            var _mu=document.getElementById('modalUser');
            if(_mu&&_mu.classList.contains('on')){window._requireProfile=false;window._needsCode=false;try{closeM('modalUser');}catch(e){}}
            try{_enforceAccessGate();}catch(e){}
          }
        }
      }catch(e){}
      // 승인 대기 중인 사용자: _acl 동기화 즉시 멤버 판정 → 재로그인 없이 자동 입장
      try{var _g=document.getElementById('approvalGate');if(_g&&_g.style.display!=='none'){if(_isAutoApprove()){var _u=DB.g('currentUser')||{};if(_u.kakaoId)_aclSelfApprove(_u.kakaoId);}if(_isMember()){_g.style.display='none';_stopApprovalPoll();updateUserUI();try{goHome();}catch(e){}toast('✅ 승인 완료 — 환영합니다');}}}catch(e){}
      try{_updateCrisisBanner();}catch(e){}
      clearTimeout(_remoteUpdateTimer);
      _remoteUpdateTimer=setTimeout(function(){
        if(window.curApp==='rescue'){renderResList();try{renderRescueMap();}catch(e){}}
        else if(window.curApp==='inspect'){renderFacList();renderInspectMap();}
        else if(window.curApp==='alert')renderAlertView();
        else if(window.curApp==='stats')renderFullStats();
      },400);
    }
    // ── 컬렉션 리스너: 항목마다 개별 문서 (rescues, hazards) ──
    // rescues/hazards는 최근 1년(_ARCHIVE_CUTOFF_DAYS)만 실시간 구독 — 수백 명 접속해도
    // 매번 전체 역대기록을 받지 않도록(id가 Date.now() 기반이라 그대로 범위 필터 가능).
    // 1년 이전 기록은 조회 시 _loadArchive()로 1회만 불러온다.
    _SHARED_COLL.forEach(k=>{
      const isArchived=_ARCHIVE_COLLS.includes(k);
      const ref=isArchived?_fdb.collection(k).where('id','>=',Date.now()-_ARCHIVE_CUTOFF_DAYS*86400000):_fdb.collection(k);
      ref.onSnapshot(snap=>{
        const docs=snap.docs.map(d=>d.data());
        if(isArchived){
          _fsRecent[k]=docs;
          _rebuildFsColl(k);
        }else{
          _fs[k]=docs;
          try{_fs[k].sort((a,b)=>(Number(b.id)||0)-(Number(a.id)||0));}catch{}
          // 동기화 기준 스냅샷 갱신 (서버 상태 = 마지막 동기화 상태)
          const syncMap=new Map();
          _fs[k].forEach(r=>{syncMap.set(String(r.id),JSON.stringify(r));});
          _fsSync[k]=syncMap;
        }
        // 시설물: 컬렉션이 비어있으면 레거시 단일문서 백업으로 폴백 표시 + 1회 이관 시도
        if(k==='facilities'){
          if(_fs[k].length===0&&_legacyFacBackup&&_legacyFacBackup.length){
            _fs[k]=_legacyFacBackup.slice(); // 화면 폴백(동기화 끊겨도 데이터 안 사라짐)
            if(!_facMigTried){_facMigTried=true;try{DB.s('facilities',_fs[k]);}catch(e){}} // 건별 문서로 이관(실패 시 큐 보존)
          }
          if(loaded.has(k))try{_invalidateSignCache();}catch(e){}
          _facSeedReady=true;
          try{_ensureSignSeed();}catch(e){}
        }
        if(!loaded.has(k)){loaded.add(k);_checkReady();}
        else{_onRemoteUpdate();}
      },()=>{if(k==='facilities'){_facSeedReady=true;try{_ensureSignSeed();}catch(e){}}if(!loaded.has(k)){loaded.add(k);_checkReady();}});
    });
    // ── 단일 문서 리스너: appData/{key} ──
    _SHARED_DOC.forEach(k=>{
      _fdb.collection('appData').doc(k).onSnapshot(snap=>{
        _fs[k]=snap.exists?(()=>{try{return JSON.parse(snap.data().d);}catch{return null;}})():null;
        _fsDocBase[k]=_fs[k]; // 서버 확정 상태 = 다음 쓰기의 병합 기준
        if(!loaded.has(k)){loaded.add(k);_checkReady();}
        else{
          // 원격 업데이트: 표지판/시설 캐시 무효화 후 리렌더 (catFacMeta가 표지판 표시에 영향)
          if(k==='catFacMeta')try{_invalidateSignCache();}catch(e){}
          _onRemoteUpdate();
        }
      },()=>{if(!loaded.has(k)){loaded.add(k);_checkReady();}});
    });
    // ── 시설물 레거시(단일문서) 백업 읽기: 컬렉션 비었을 때 폴백·이관 소스 ──
    _fdb.collection('appData').doc('facilities').get().then(snap=>{
      if(snap.exists){try{const a=JSON.parse(snap.data().d);if(Array.isArray(a)&&a.length)_legacyFacBackup=a;}catch(e){}}
      // 백업 확보 후, 이미 빈 컬렉션 스냅샷을 받았다면 폴백 반영
      if(_legacyFacBackup&&(!_fs['facilities']||_fs['facilities'].length===0)){
        _fs['facilities']=_legacyFacBackup.slice();
        if(!_facMigTried){_facMigTried=true;try{DB.s('facilities',_fs['facilities']);}catch(e){}}
        try{_invalidateSignCache();}catch(e){}
        try{if(window.curApp==='inspect'){renderFacList();renderInspectMap();}}catch(e){}
      }
    }).catch(()=>{});
    // ── 구버전 단일 문서 → 개별 문서 마이그레이션 ──
    // ── 기기 간 알림 브로드캐스트 리스너 (준비 체크에 미포함) ──
    _fdb.collection('sharedNotis').orderBy('at','desc').limit(50)
      .onSnapshot(snap=>{
        if(!_sharedNotiInited){
          // 첫 스냅샷: 현재 최신 ts 기록 → 기존 알림은 무시
          _maxSharedNotiAt=snap.docs.reduce((m,d)=>Math.max(m,d.data().at||0),0);
          _sharedNotiInited=true;
          return;
        }
        snap.docChanges().forEach(ch=>{
          if(ch.type!=='added')return;
          const d=ch.doc.data();
          if((d.at||0)<=_maxSharedNotiAt)return;
          if(d.deviceId===_MY_DEVICE_ID)return; // 내가 보낸 것
          _maxSharedNotiAt=Math.max(_maxSharedNotiAt,d.at||0);
          if(d.adminOnly&&!(typeof isAdminUser==='function'&&isAdminUser()))return; // 관리자 전용 알림은 관리자만 수신
          // 앱 내 벨 알림 추가
          const ns=DB.g('notis')||[];
          ns.unshift({id:d.id||Date.now(),msg:d.msg,ico:d.ico,time:d.timeStr||now(),read:false,link:d.link||null});
          if(ns.length>80)ns.splice(80);
          DB.s('notis',ns);updateBell();
          // OS 시스템 알림 (앱이 백그라운드일 때만)
          _showSystemNoti(d.msg,d.ico);
        });
      },()=>{});
    _migrateLegacyCollections();
    setTimeout(()=>{if(onReady){onReady();onReady=null;}},10000);
  }catch(e){onReady&&onReady();}
}

async function _migrateLegacyCollections(){
  if(!_fdb)return;
  for(const k of _SHARED_COLL){
    try{
      const oldDoc=await _fdb.collection('appData').doc(k).get();
      if(!oldDoc.exists)continue;
      const oldData=JSON.parse(oldDoc.data().d||'[]');
      if(!Array.isArray(oldData)||!oldData.length){
        await _fdb.collection('appData').doc(k).delete();continue;
      }
      // 이미 새 구조에 데이터 있으면 구버전 문서만 삭제
      const existing=await _fdb.collection(k).limit(1).get();
      if(!existing.empty){await _fdb.collection('appData').doc(k).delete();continue;}
      // 배치 마이그레이션 (최대 500건)
      const batch=_fdb.batch();
      oldData.slice(0,500).forEach(r=>batch.set(_fdb.collection(k).doc(String(r.id)),r));
      await batch.commit();
      await _fdb.collection('appData').doc(k).delete();
      console.log(`[마이그레이션] ${k} ${oldData.length}건 개별 문서 이전 완료`);
    }catch(e){console.warn('[마이그레이션 오류]',k,e);}
  }
}

const RES_TYPES={
  '안전사고':{ico:'🤕',pc:'p-acc',color:'#c0392b'},
  '낙석':    {ico:'🪨',pc:'p-rock',color:'#7d3c98'},
  '위험수목':{ico:'🌲',pc:'p-tree',color:'#ca6f1e'},
  '화재':    {ico:'🔥',pc:'p-fire',color:'#a93226'},
  '':    {ico:'🌊',pc:'p-haz', color:'#1a6090'},
  '기타':    {ico:'⚠️',pc:'p-etc', color:'#5d6d7e'},
};

function _ensureSignSeed(){
  var _facs=DB.g('facilities')||[];
  var _hasSign=_facs.some(function(f){return f.type&&f.type.indexOf('다목적위치표지판')>=0;});
  if(_hasSign)return;
  var _seed=[{"id":1,"type":"🪧 다목적위치표지판","name":"01-01 청운정 아래500m","lat":38.173718,"lng":128.480326,"loc":"01-01","elev":219,"status":"ok"},{"id":2,"type":"🪧 다목적위치표지판","name":"01-02 청운정","lat":38.173346,"lng":128.47574,"loc":"01-02","elev":239,"status":"ok"},{"id":3,"type":"🪧 다목적위치표지판","name":"01-03 군량장 아래 300m","lat":38.170381,"lng":128.473421,"loc":"01-03","elev":250,"status":"ok"},{"id":4,"type":"🪧 다목적위치표지판","name":"01-04 (와선대 아래 100m","lat":38.166325,"lng":128.471024,"loc":"01-04","elev":267,"status":"ok"},{"id":5,"type":"🪧 다목적위치표지판","name":"01-05 비선대","lat":38.162865,"lng":128.466413,"loc":"01-05","elev":320,"status":"ok"},{"id":6,"type":"🪧 다목적위치표지판","name":"01-06 설악골 위 100m","lat":38.159572,"lng":128.469408,"loc":"01-06","elev":376,"status":"ok"},{"id":7,"type":"🪧 다목적위치표지판","name":"01-07 잦은바위골","lat":38.155681,"lng":128.470476,"loc":"01-07","elev":418,"status":"ok"},{"id":8,"type":"🪧 다목적위치표지판","name":"01-08 귀면암","lat":38.152346,"lng":128.469876,"loc":"01-08","elev":496,"status":"ok"},{"id":9,"type":"🪧 다목적위치표지판","name":"01-09 병풍교","lat":38.150047,"lng":128.472944,"loc":"01-09","elev":530,"status":"ok"},{"id":10,"type":"🪧 다목적위치표지판","name":"01-10 칠선골 아래 100m","lat":38.146238,"lng":128.473648,"loc":"01-10","elev":600,"status":"ok"},{"id":11,"type":"🪧 다목적위치표지판","name":"01-11 오련폭포","lat":38.143603,"lng":128.474455,"loc":"01-11","elev":660,"status":"ok"},{"id":12,"type":"🪧 다목적위치표지판","name":"01-12 양폭대피소","lat":38.139774,"lng":128.47469,"loc":"01-12","elev":709,"status":"ok"},{"id":13,"type":"🪧 다목적위치표지판","name":"01-13 죽음의 계곡 아래 400m","lat":38.136418,"lng":128.473544,"loc":"01-13","elev":798,"status":"ok"},{"id":14,"type":"🪧 다목적위치표지판","name":"01-14 죽음의 계곡 위 100m","lat":38.13374,"lng":128.469714,"loc":"01-14","elev":883,"status":"ok"},{"id":15,"type":"🪧 다목적위치표지판","name":"01-15 무너미고개 아래","lat":38.135076,"lng":128.46466,"loc":"01-15","elev":1069,"status":"ok"},{"id":16,"type":"🪧 다목적위치표지판","name":"01-16 희운각대피소","lat":38.132853,"lng":128.464842,"loc":"01-16","elev":1095,"status":"ok"},{"id":17,"type":"🪧 다목적위치표지판","name":"01-17 사태골 위 200m","lat":38.13034,"lng":128.461456,"loc":"01-17","elev":1251,"status":"ok"},{"id":18,"type":"🪧 다목적위치표지판","name":"01-18 소청 아래 300m","lat":38.12721,"lng":128.458564,"loc":"01-18","elev":1445,"status":"ok"},{"id":19,"type":"🪧 다목적위치표지판","name":"01-19 소청 위 100m","lat":38.12373,"lng":128.457235,"loc":"01-19","elev":1627,"status":"ok"},{"id":20,"type":"🪧 다목적위치표지판","name":"01-20 중청대피소 위 100m","lat":38.120766,"lng":128.462003,"loc":"01-20","elev":1602,"status":"ok"},{"id":21,"type":"🪧 다목적위치표지판","name":"02-01 금강굴 삼거리 위 50m","lat":38.164229,"lng":128.463435,"loc":"02-01","elev":491,"status":"ok"},{"id":22,"type":"🪧 다목적위치표지판","name":"02-02 제1쉼터","lat":38.165649,"lng":128.462028,"loc":"02-02","elev":634,"status":"ok"},{"id":23,"type":"🪧 다목적위치표지판","name":"02-03 제1쉼터 위 500m","lat":38.16608,"lng":128.457469,"loc":"02-03","elev":794,"status":"ok"},{"id":24,"type":"🪧 다목적위치표지판","name":"02-04 샘터 아래500m","lat":38.163876,"lng":128.452519,"loc":"02-04","elev":935,"status":"ok"},{"id":25,"type":"🪧 다목적위치표지판","name":"02-05 샘터","lat":38.161342,"lng":128.447673,"loc":"02-05","elev":963,"status":"ok"},{"id":26,"type":"🪧 다목적위치표지판","name":"02-06 샘터 위500m","lat":38.161155,"lng":128.44155,"loc":"02-06","elev":1129,"status":"ok"},{"id":27,"type":"🪧 다목적위치표지판","name":"02-07 공룡능선 갈림길","lat":38.158086,"lng":128.437903,"loc":"02-07","elev":1209,"status":"ok"},{"id":28,"type":"🪧 다목적위치표지판","name":"02-08 첫능선200m","lat":38.156006,"lng":128.43436,"loc":"02-08","elev":1178,"status":"ok"},{"id":29,"type":"🪧 다목적위치표지판","name":"02-09 오세암 아래400m","lat":38.153822,"lng":128.431494,"loc":"02-09","elev":1024,"status":"ok"},{"id":30,"type":"🪧 다목적위치표지판","name":"02-10 오세암 위100m","lat":38.153225,"lng":128.430556,"loc":"02-10","elev":963,"status":"ok"},{"id":31,"type":"🪧 다목적위치표지판","name":"02-11 만경대 갈림길 아래 100m","lat":38.151083,"lng":128.427951,"loc":"02-11","elev":884,"status":"ok"},{"id":32,"type":"🪧 다목적위치표지판","name":"02-12 원명암터","lat":38.152069,"lng":128.420109,"loc":"02-12","elev":794,"status":"ok"},{"id":33,"type":"🪧 다목적위치표지판","name":"02-13 첫고개쉼터","lat":38.152974,"lng":128.416565,"loc":"02-13","elev":708,"status":"ok"},{"id":34,"type":"🪧 다목적위치표지판","name":"02-14 샘터 위 300m","lat":38.15252,"lng":128.411329,"loc":"02-14","elev":640,"status":"ok"},{"id":35,"type":"🪧 다목적위치표지판","name":"03-01 나한봉","lat":38.154916,"lng":128.438841,"loc":"03-01","elev":1279,"status":"ok"},{"id":36,"type":"🪧 다목적위치표지판","name":"03-02 제3쉼터, 큰바위정상아래100m","lat":38.153187,"lng":128.441108,"loc":"03-02","elev":1201,"status":"ok"},{"id":37,"type":"🪧 다목적위치표지판","name":"03-03 제4쉼지나서 아래100m","lat":38.150306,"lng":128.443895,"loc":"03-03","elev":1203,"status":"ok"},{"id":38,"type":"🪧 다목적위치표지판","name":"03-04 1275고지 아래100m","lat":38.14833,"lng":128.450044,"loc":"03-04","elev":1217,"status":"ok"},{"id":39,"type":"🪧 다목적위치표지판","name":"03-05 샘터입구 위 200m","lat":38.146088,"lng":128.453457,"loc":"03-05","elev":1105,"status":"ok"},{"id":40,"type":"🪧 다목적위치표지판","name":"03-06 강남대 동판","lat":38.142938,"lng":128.454629,"loc":"03-06","elev":1155,"status":"ok"},{"id":41,"type":"🪧 다목적위치표지판","name":"03-07 신선대 아래 500m","lat":38.140757,"lng":128.45799,"loc":"03-07","elev":1129,"status":"ok"},{"id":42,"type":"🪧 다목적위치표지판","name":"03-08 신선대","lat":38.13874,"lng":128.461976,"loc":"03-08","elev":1214,"status":"ok"},{"id":43,"type":"🪧 다목적위치표지판","name":"03-09 무너미정상아래 400m","lat":38.135323,"lng":128.463904,"loc":"03-09","elev":1094,"status":"ok"},{"id":44,"type":"🪧 다목적위치표지판","name":"04-01 안양암","lat":38.177708,"lng":128.483462,"loc":"04-01","elev":239,"status":"ok"},{"id":45,"type":"🪧 다목적위치표지판","name":"04-02 첫교량 끝","lat":38.180858,"lng":128.479667,"loc":"04-02","elev":276,"status":"ok"},{"id":46,"type":"🪧 다목적위치표지판","name":"04-03 가동 휴게소 화장실","lat":38.183441,"lng":128.476513,"loc":"04-03","elev":306,"status":"ok"},{"id":47,"type":"🪧 다목적위치표지판","name":"04-04 전망대","lat":38.187867,"lng":128.475315,"loc":"04-04","elev":388,"status":"ok"},{"id":48,"type":"🪧 다목적위치표지판","name":"04-05 울산바위 유래간판","lat":38.190873,"lng":128.473491,"loc":"04-05","elev":485,"status":"ok"},{"id":49,"type":"🪧 다목적위치표지판","name":"04-06 매점터,철계단 시점","lat":38.20505556,"lng":128.79797222,"loc":"04-06","elev":585,"status":"ok"},{"id":50,"type":"🪧 다목적위치표지판","name":"05-01 가동 휴게소 아래 100m","lat":38.170065,"lng":128.495219,"loc":"05-01","elev":201,"status":"ok"},{"id":51,"type":"🪧 다목적위치표지판","name":"05-02 나동 휴게소 아래 200m","lat":38.168687,"lng":128.500664,"loc":"05-02","elev":179,"status":"ok"},{"id":52,"type":"🪧 다목적위치표지판","name":"05-03 자살탕","lat":38.165785,"lng":128.501889,"loc":"05-03","elev":247,"status":"ok"},{"id":53,"type":"🪧 다목적위치표지판","name":"05-04 비룡폭포","lat":38.162964,"lng":128.502201,"loc":"05-04","elev":281,"status":"ok"},{"id":54,"type":"🪧 다목적위치표지판","name":"06-01 독주골 갈림길 위 250m","lat":38.087797,"lng":128.448537,"loc":"06-01","elev":480,"status":"ok"},{"id":55,"type":"🪧 다목적위치표지판","name":"06-02 돌계단 끝","lat":38.092245,"lng":128.450126,"loc":"06-02","elev":690,"status":"ok"},{"id":56,"type":"🪧 다목적위치표지판","name":"06-03 제1쉼터 위 200m","lat":38.096467,"lng":128.451558,"loc":"06-03","elev":859,"status":"ok"},{"id":57,"type":"🪧 다목적위치표지판","name":"06-04 끝청갈림길 위 300m","lat":38.098362,"lng":128.454893,"loc":"06-04","elev":903,"status":"ok"},{"id":58,"type":"🪧 다목적위치표지판","name":"06-05 설악폭포","lat":38.103345,"lng":128.456638,"loc":"06-05","elev":999,"status":"ok"},{"id":59,"type":"🪧 다목적위치표지판","name":"06-06 물터위 계단 끝","lat":38.105879,"lng":128.459868,"loc":"06-06","elev":1113,"status":"ok"},{"id":60,"type":"🪧 다목적위치표지판","name":"06-07 제2쉼터 아래 200m","lat":38.108556,"lng":128.459998,"loc":"06-07","elev":1256,"status":"ok"},{"id":61,"type":"🪧 다목적위치표지판","name":"06-08 능선끝","lat":38.113456,"lng":128.460649,"loc":"06-08","elev":1492,"status":"ok"},{"id":62,"type":"🪧 다목적위치표지판","name":"06-09 구대청대피소 아래 420m","lat":38.115969,"lng":128.46315,"loc":"06-09","elev":1573,"status":"ok"},{"id":63,"type":"🪧 다목적위치표지판","name":"07-01 매표소 시발 0.5㎞ 지점","lat":38.077336,"lng":128.442598,"loc":"07-01","elev":355,"status":"ok"},{"id":64,"type":"🪧 다목적위치표지판","name":"07-02 오색석사 아래 200m","lat":38.076182,"lng":128.439941,"loc":"07-02","elev":371,"status":"ok"},{"id":65,"type":"🪧 다목적위치표지판","name":"07-03 독주암, 제2약수터 아래 200m","lat":38.078343,"lng":128.437413,"loc":"07-03","elev":385,"status":"ok"},{"id":66,"type":"🪧 다목적위치표지판","name":"07-04 선녀탕 위100m","lat":38.080587,"lng":128.43512,"loc":"07-04","elev":419,"status":"ok"},{"id":67,"type":"🪧 다목적위치표지판","name":"07-05 매표소 시발 2.5㎞ 지점","lat":38.082892,"lng":128.432072,"loc":"07-05","elev":452,"status":"ok"},{"id":68,"type":"🪧 다목적위치표지판","name":"07-06 12폭포 갈림길","lat":38.083242,"lng":128.430483,"loc":"07-06","elev":462,"status":"ok"},{"id":69,"type":"🪧 다목적위치표지판","name":"08-01 12폭포 아래 500m","lat":38.081944,"lng":128.427122,"loc":"08-01","elev":537,"status":"ok"},{"id":70,"type":"🪧 다목적위치표지판","name":"08-02 12폭포","lat":38.07937,"lng":128.42608,"loc":"08-02","elev":602,"status":"ok"},{"id":71,"type":"🪧 다목적위치표지판","name":"08-03 무명폭포 하향 200m","lat":38.08044,"lng":128.423813,"loc":"08-03","elev":620,"status":"ok"},{"id":72,"type":"🪧 다목적위치표지판","name":"08-04 등선폭포","lat":38.080789,"lng":128.419306,"loc":"08-04","elev":769,"status":"ok"},{"id":73,"type":"🪧 다목적위치표지판","name":"08-05 금강문 시발 2.5km(등선대 정상)","lat":38.083671,"lng":128.417325,"loc":"08-05","elev":956,"status":"ok"},{"id":74,"type":"🪧 다목적위치표지판","name":"08-06 칠형제봉 입구","lat":38.086039,"lng":128.416179,"loc":"08-06","elev":839,"status":"ok"},{"id":75,"type":"🪧 다목적위치표지판","name":"08-07 흘림골매표소 상향 제1교량","lat":38.087871,"lng":128.417377,"loc":"08-07","elev":772,"status":"ok"},{"id":76,"type":"🪧 다목적위치표지판","name":"09-01 첫고개 위 100m","lat":38.100203,"lng":128.409455,"loc":"09-01","elev":1085,"status":"ok"},{"id":77,"type":"🪧 다목적위치표지판","name":"09-02 첫고개 위 100m","lat":38.10358,"lng":128.41206,"loc":"09-02","elev":1299,"status":"ok"},{"id":78,"type":"🪧 다목적위치표지판","name":"09-03 상투바 아래 100m","lat":38.108377,"lng":128.410679,"loc":"09-03","elev":1292,"status":"ok"},{"id":79,"type":"🪧 다목적위치표지판","name":"09-04 샘터","lat":38.110374,"lng":128.410132,"loc":"09-04","elev":1268,"status":"ok"},{"id":80,"type":"🪧 다목적위치표지판","name":"09-05 왕주목 아래 100m","lat":38.112063,"lng":128.410236,"loc":"09-05","elev":1353,"status":"ok"},{"id":81,"type":"🪧 다목적위치표지판","name":"09-06 왕주목 위 400m","lat":38.111282,"lng":128.416645,"loc":"09-06","elev":1324,"status":"ok"},{"id":82,"type":"🪧 다목적위치표지판","name":"09-07 1379봉 아래 100m","lat":38.110274,"lng":128.421674,"loc":"09-07","elev":1391,"status":"ok"},{"id":83,"type":"🪧 다목적위치표지판","name":"09-08 헬기장, 제2전망대","lat":38.109432,"lng":128.427041,"loc":"09-08","elev":1450,"status":"ok"},{"id":84,"type":"🪧 다목적위치표지판","name":"09-09 쉼터아래 500m","lat":38.110071,"lng":128.43061,"loc":"09-09","elev":1421,"status":"ok"},{"id":85,"type":"🪧 다목적위치표지판","name":"09-10 1쉼터","lat":38.112214,"lng":128.437488,"loc":"09-10","elev":1461,"status":"ok"},{"id":86,"type":"🪧 다목적위치표지판","name":"09-11 독주골","lat":38.115139,"lng":128.441708,"loc":"09-11","elev":1452,"status":"ok"},{"id":87,"type":"🪧 다목적위치표지판","name":"09-12 끝청아래 400m","lat":38.11617,"lng":128.448039,"loc":"09-12","elev":1496,"status":"ok"},{"id":88,"type":"🪧 다목적위치표지판","name":"09-13 끝청 위 100m","lat":38.116624,"lng":128.451661,"loc":"09-13","elev":1598,"status":"ok"},{"id":89,"type":"🪧 다목적위치표지판","name":"09-14 중청 정상 아래 300m","lat":38.119302,"lng":128.45463,"loc":"09-14","elev":1596,"status":"ok"},{"id":90,"type":"🪧 다목적위치표지판","name":"10-01 셔틀버스 종점 위 500m","lat":38.175507,"lng":128.372925,"loc":"10-01","elev":452,"status":"ok"},{"id":91,"type":"🪧 다목적위치표지판","name":"10-02 셔틀버스 종점 시발1.0㎞ 지점","lat":38.170978,"lng":128.372351,"loc":"10-02","elev":471,"status":"ok"},{"id":92,"type":"🪧 다목적위치표지판","name":"10-03 셔틀버스 종점 시발1.5㎞ 지점","lat":38.168363,"lng":128.371283,"loc":"10-03","elev":489,"status":"ok"},{"id":93,"type":"🪧 다목적위치표지판","name":"10-04 셔틀버스 종점 시발2.0㎞ 지점","lat":38.169578,"lng":128.375608,"loc":"10-04","elev":519,"status":"ok"},{"id":94,"type":"🪧 다목적위치표지판","name":"10-05 셔틀버스 종점 시발2.5㎞ 지점","lat":38.167891,"lng":128.37936,"loc":"10-05","elev":489,"status":"ok"},{"id":95,"type":"🪧 다목적위치표지판","name":"10-06 대피소 아래 500m","lat":38.164905,"lng":128.376207,"loc":"10-06","elev":494,"status":"ok"},{"id":96,"type":"🪧 다목적위치표지판","name":"10-07 백담대피소","lat":38.160108,"lng":128.374905,"loc":"10-07","elev":502,"status":"ok"},{"id":97,"type":"🪧 다목적위치표지판","name":"10-08 길골 아래 200m","lat":38.157452,"lng":128.375296,"loc":"10-08","elev":504,"status":"ok"},{"id":98,"type":"🪧 다목적위치표지판","name":"10-09 길골 위 300m","lat":38.15628,"lng":128.380897,"loc":"10-09","elev":517,"status":"ok"},{"id":99,"type":"🪧 다목적위치표지판","name":"10-10 셔틀버스 종점 시발5.0㎞ 지점","lat":38.156816,"lng":128.386082,"loc":"10-10","elev":492,"status":"ok"},{"id":100,"type":"🪧 다목적위치표지판","name":"10-11 셔틀버스 종점 시발5.5㎞ 지점","lat":38.153276,"lng":128.389078,"loc":"10-11","elev":505,"status":"ok"},{"id":101,"type":"🪧 다목적위치표지판","name":"10-12 셔틀버스 종점 시발6.0㎞ 지점","lat":38.152989,"lng":128.394159,"loc":"10-12","elev":566,"status":"ok"},{"id":102,"type":"🪧 다목적위치표지판","name":"10-13 영시암 아래 500m","lat":38.152579,"lng":128.399891,"loc":"10-13","elev":554,"status":"ok"},{"id":103,"type":"🪧 다목적위치표지판","name":"10-14 영시암","lat":38.153527,"lng":128.405154,"loc":"10-14","elev":564,"status":"ok"},{"id":104,"type":"🪧 다목적위치표지판","name":"10-15 영시암 위 500m","lat":38.150234,"lng":128.408359,"loc":"10-15","elev":582,"status":"ok"},{"id":105,"type":"🪧 다목적위치표지판","name":"10-16 수렴동대피소 밑 200m","lat":38.146899,"lng":128.411954,"loc":"10-16","elev":598,"status":"ok"},{"id":106,"type":"🪧 다목적위치표지판","name":"10-17 수렴동대피소 위 300m","lat":38.145418,"lng":128.415471,"loc":"10-17","elev":583,"status":"ok"},{"id":107,"type":"🪧 다목적위치표지판","name":"10-18 셔틀버스 종점 시발 9.0㎞ 지점","lat":38.143215,"lng":128.415628,"loc":"10-18","elev":595,"status":"ok"},{"id":108,"type":"🪧 다목적위치표지판","name":"10-19 만수담 아래 500m","lat":38.14128,"lng":128.415185,"loc":"10-19","elev":605,"status":"ok"},{"id":109,"type":"🪧 다목적위치표지판","name":"10-20 만수담","lat":38.138748,"lng":128.416747,"loc":"10-20","elev":639,"status":"ok"},{"id":110,"type":"🪧 다목적위치표지판","name":"10-21 백운동 아래 400m","lat":38.136607,"lng":128.419145,"loc":"10-21","elev":688,"status":"ok"},{"id":111,"type":"🪧 다목적위치표지판","name":"10-22 백운동 위 100m","lat":38.135785,"lng":128.423366,"loc":"10-22","elev":715,"status":"ok"},{"id":112,"type":"🪧 다목적위치표지판","name":"10-23 관음폭포 아래 400m","lat":38.133644,"lng":128.425945,"loc":"10-23","elev":756,"status":"ok"},{"id":113,"type":"🪧 다목적위치표지판","name":"10-24 관음폭포 위 100m","lat":38.132595,"lng":128.430374,"loc":"10-24","elev":832,"status":"ok"},{"id":114,"type":"🪧 다목적위치표지판","name":"10-25 쌍폭","lat":38.131196,"lng":128.433501,"loc":"10-25","elev":901,"status":"ok"},{"id":115,"type":"🪧 다목적위치표지판","name":"10-26 쌍폭 위 500m","lat":38.130203,"lng":128.437931,"loc":"10-26","elev":974,"status":"ok"},{"id":116,"type":"🪧 다목적위치표지판","name":"10-27 사자바위 아래 100m","lat":38.128132,"lng":128.444052,"loc":"10-27","elev":1141,"status":"ok"},{"id":117,"type":"🪧 다목적위치표지판","name":"10-28 봉정암 아래 100m","lat":38.128647,"lng":128.44671,"loc":"10-28","elev":1232,"status":"ok"},{"id":118,"type":"🪧 다목적위치표지판","name":"10-29 소청대피소 아래 300m","lat":38.127557,"lng":128.450982,"loc":"10-29","elev":1387,"status":"ok"},{"id":119,"type":"🪧 다목적위치표지판","name":"10-30 소청대피소 위 200m","lat":38.12611111,"lng":128.45611111,"loc":"10-30","elev":1534,"status":"ok"},{"id":120,"type":"🪧 다목적위치표지판","name":"11-01 사중폭포 위 200m","lat":38.121889,"lng":128.344708,"loc":"11-01","elev":584,"status":"ok"},{"id":121,"type":"🪧 다목적위치표지판","name":"11-02 사중폭포 위 100m","lat":38.125471,"lng":128.343197,"loc":"11-02","elev":785,"status":"ok"},{"id":122,"type":"🪧 다목적위치표지판","name":"11-03 마지막 물터 아래 300m","lat":38.129012,"lng":128.34192,"loc":"11-03","elev":788,"status":"ok"},{"id":123,"type":"🪧 다목적위치표지판","name":"11-04 마지막물터 위 200m","lat":38.131772,"lng":128.344916,"loc":"11-04","elev":890,"status":"ok"},{"id":124,"type":"🪧 다목적위치표지판","name":"11-05 대승령 아래 200m","lat":38.135334,"lng":128.346584,"loc":"11-05","elev":1041,"status":"ok"},{"id":125,"type":"🪧 다목적위치표지판","name":"11-06 대승령→ 남교리 300m","lat":38.138627,"lng":128.342389,"loc":"11-06","elev":1242,"status":"ok"},{"id":126,"type":"🪧 다목적위치표지판","name":"11-07 안산갈림길→ 남교리 300m","lat":38.139779,"lng":128.338168,"loc":"11-07","elev":1353,"status":"ok"},{"id":127,"type":"🪧 다목적위치표지판","name":"11-08 분소 시발 4.0㎞ 지점(능선끝 쉼터)","lat":38.14262,"lng":128.338272,"loc":"11-08","elev":1335,"status":"ok"},{"id":128,"type":"🪧 다목적위치표지판","name":"11-09 마지막물터→ 대승령 300m","lat":38.143772,"lng":128.334077,"loc":"11-09","elev":1212,"status":"ok"},{"id":129,"type":"🪧 다목적위치표지판","name":"11-10 마지막물터→ 남교리 200m","lat":38.147519,"lng":128.332045,"loc":"11-10","elev":1102,"status":"ok"},{"id":130,"type":"🪧 다목적위치표지판","name":"11-11 주목→ 남교리 100m","lat":38.151637,"lng":128.332957,"loc":"11-11","elev":1021,"status":"ok"},{"id":131,"type":"🪧 다목적위치표지판","name":"11-12 감투바위","lat":38.155404,"lng":128.331654,"loc":"11-12","elev":975,"status":"ok"},{"id":132,"type":"🪧 다목적위치표지판","name":"11-13 두문폭포→ 대승령 200m","lat":38.157977,"lng":128.327798,"loc":"11-13","elev":863,"status":"ok"},{"id":133,"type":"🪧 다목적위치표지판","name":"11-14 복숭아탕→ 대승령 200m","lat":38.159973,"lng":128.323186,"loc":"11-14","elev":793,"status":"ok"},{"id":134,"type":"🪧 다목적위치표지판","name":"11-15 무명폭포","lat":38.16166,"lng":128.321206,"loc":"11-15","elev":715,"status":"ok"},{"id":135,"type":"🪧 다목적위치표지판","name":"11-16 제6교량→ 대승령 100m","lat":38.164666,"lng":128.318731,"loc":"11-16","elev":678,"status":"ok"},{"id":136,"type":"🪧 다목적위치표지판","name":"11-17 너래반석→ 남교리 200m","lat":38.171418,"lng":128.314666,"loc":"11-17","elev":540,"status":"ok"},{"id":137,"type":"🪧 다목적위치표지판","name":"11-18 응봉폭포","lat":38.174361,"lng":128.312035,"loc":"11-18","elev":476,"status":"ok"},{"id":138,"type":"🪧 다목적위치표지판","name":"11-19 제5교량","lat":38.17541,"lng":128.307736,"loc":"11-19","elev":430,"status":"ok"},{"id":139,"type":"🪧 다목적위치표지판","name":"11-20 4교량→ 남교리 200m","lat":38.174627,"lng":128.305625,"loc":"11-20","elev":419,"status":"ok"},{"id":140,"type":"🪧 다목적위치표지판","name":"11-21 추모비→ 남교리 100m","lat":38.175862,"lng":128.303593,"loc":"11-21","elev":368,"status":"ok"},{"id":141,"type":"🪧 다목적위치표지판","name":"11-22 남교리매표소→ 대승령 300m","lat":38.179465,"lng":128.301717,"loc":"11-22","elev":341,"status":"ok"},{"id":142,"type":"🪧 다목적위치표지판","name":"12-09 대승령 위100m","lat":38.136837,"lng":128.347365,"loc":"12-09","elev":1235,"status":"ok"},{"id":143,"type":"🪧 다목적위치표지판","name":"12-10 백담대피소 시발 5.0㎞ 지점","lat":38.135458,"lng":128.350726,"loc":"12-10","elev":1198,"status":"ok"},{"id":144,"type":"🪧 다목적위치표지판","name":"12-11 백담대피소 시발 5.5㎞ 지점","lat":38.135027,"lng":128.356094,"loc":"12-11","elev":1304,"status":"ok"},{"id":145,"type":"🪧 다목적위치표지판","name":"12-12 백담대피소 시발 6.0㎞ 지점","lat":38.131322,"lng":128.357709,"loc":"12-12","elev":1269,"status":"ok"},{"id":146,"type":"🪧 다목적위치표지판","name":"12-13 백담대피소 시발 6.5㎞ 지점","lat":38.128851,"lng":128.359585,"loc":"12-13","elev":1274,"status":"ok"},{"id":147,"type":"🪧 다목적위치표지판","name":"12-14 1408고지","lat":38.128235,"lng":128.364041,"loc":"12-14","elev":1233,"status":"ok"},{"id":148,"type":"🪧 다목적위치표지판","name":"12-15 백담대피소 시발 7.5㎞ 지점","lat":38.124532,"lng":128.377693,"loc":"12-15","elev":1339,"status":"ok"},{"id":149,"type":"🪧 다목적위치표지판","name":"12-16 백담대피소 시발 8.0㎞ 지점","lat":38.123467,"lng":128.382941,"loc":"12-16","elev":1389,"status":"ok"},{"id":150,"type":"🪧 다목적위치표지판","name":"12-17 백담대피소 시발 8.5㎞ 지점","lat":38.123319,"lng":128.387724,"loc":"12-17","elev":1471,"status":"ok"},{"id":151,"type":"🪧 다목적위치표지판","name":"12-18 백담대피소 시발 9.0㎞ 지점","lat":38.124021,"lng":128.393508,"loc":"12-18","elev":1314,"status":"ok"},{"id":152,"type":"🪧 다목적위치표지판","name":"12-19 백담대피소 시발 9.5㎞ 지점","lat":38.122416,"lng":128.397052,"loc":"12-19","elev":1445,"status":"ok"},{"id":153,"type":"🪧 다목적위치표지판","name":"12-20 백담대피소 시발 10.0㎞ 지점","lat":38.119884,"lng":128.398954,"loc":"12-20","elev":1492,"status":"ok"},{"id":154,"type":"🪧 다목적위치표지판","name":"12-21 백담대피소 시발 10.5㎞ 지점","lat":38.116487,"lng":128.401664,"loc":"12-21","elev":1384,"status":"ok"},{"id":155,"type":"🪧 다목적위치표지판","name":"12-22 백담대피소 시발 11.0㎞ 지점","lat":38.114141,"lng":128.406223,"loc":"12-22","elev":1278,"status":"ok"},{"id":156,"type":"🪧 다목적위치표지판","name":"13-01 오세암 시발 0.5km 지점","lat":38.148634,"lng":128.43165,"loc":"13-01","elev":865,"status":"ok"},{"id":157,"type":"🪧 다목적위치표지판","name":"13-02 오세암 시발 1.0km 지점","lat":38.146721,"lng":128.435845,"loc":"13-02","elev":891,"status":"ok"},{"id":158,"type":"🪧 다목적위치표지판","name":"13-03 오세암 시발 1.5km 지점","lat":38.145281,"lng":128.439232,"loc":"13-03","elev":919,"status":"ok"},{"id":159,"type":"🪧 다목적위치표지판","name":"13-04 고갯마루 쉼터","lat":38.143017,"lng":128.444416,"loc":"13-04","elev":970,"status":"ok"},{"id":160,"type":"🪧 다목적위치표지판","name":"13-05 가야동계곡 사거리","lat":38.141041,"lng":128.445433,"loc":"13-05","elev":858,"status":"ok"},{"id":161,"type":"🪧 다목적위치표지판","name":"13-06 오세암 시발 3.0km 지점","lat":38.137665,"lng":128.445745,"loc":"13-06","elev":936,"status":"ok"},{"id":162,"type":"🪧 다목적위치표지판","name":"13-07 오세암 시발 3.5km 지점","lat":38.132538,"lng":128.446319,"loc":"13-07","elev":1045,"status":"ok"},{"id":163,"type":"🪧 다목적위치표지판","name":"14-01 곰배골지킴터 상단 400m","lat":38.0190743,"lng":128.40738772,"loc":"14-01","elev":632,"status":"ok"},{"id":164,"type":"🪧 다목적위치표지판","name":"14-02 곰배골지킴터 상단 700m","lat":38.01985338,"lng":128.41045271,"loc":"14-02","elev":652,"status":"ok"},{"id":165,"type":"🪧 다목적위치표지판","name":"14-03 곰배골지킴터 상단 1.2km","lat":38.0206789,"lng":128.4155566,"loc":"14-03","elev":720,"status":"ok"},{"id":166,"type":"🪧 다목적위치표지판","name":"14-04 곰배골지킴터 상단 1.7km","lat":38.02159347,"lng":128.42066956,"loc":"14-04","elev":785,"status":"ok"},{"id":167,"type":"🪧 다목적위치표지판","name":"14-05 곰배골지킴터 상단 2.2km","lat":38.02233403,"lng":128.42556115,"loc":"14-05","elev":856,"status":"ok"},{"id":168,"type":"🪧 다목적위치표지판","name":"14-06 곰배골지킴터 상단 2.8km","lat":38.02326768,"lng":128.43052776,"loc":"14-06","elev":940,"status":"ok"},{"id":169,"type":"🪧 다목적위치표지판","name":"14-07 곰배골지킴터 상단 3.2km","lat":38.02692511,"lng":128.43100905,"loc":"14-07","elev":1089,"status":"ok"},{"id":170,"type":"🪧 다목적위치표지판","name":"08-08","lat":38.088614,"lng":128.421311,"loc":"08-08","elev":0,"status":"ok"},{"id":171,"type":"🪧 다목적위치표지판","name":"12-01 흑선동계곡비탐","lat":38.153952,"lng":128.375739,"loc":"12-01","elev":0,"status":"ok"},{"id":172,"type":"🪧 다목적위치표지판","name":"12-02 흑선동계곡비탐","lat":38.153951,"lng":128.372482,"loc":"12-02","elev":0,"status":"ok"},{"id":173,"type":"🪧 다목적위치표지판","name":"12-03 흑선동계곡비탐","lat":38.15045,"lng":128.368105,"loc":"12-03","elev":0,"status":"ok"},{"id":174,"type":"🪧 다목적위치표지판","name":"12-05 흑선동계곡비탐","lat":38.148019,"lng":128.359142,"loc":"12-05","elev":0,"status":"ok"},{"id":175,"type":"🪧 다목적위치표지판","name":"12-06 흑선동계곡비탐","lat":38.145115,"lng":128.355129,"loc":"12-06","elev":0,"status":"ok"},{"id":176,"type":"🪧 다목적위치표지판","name":"12-07 흑선동계곡비탐","lat":38.142191,"lng":128.352446,"loc":"12-07","elev":0,"status":"ok"},{"id":177,"type":"🪧 다목적위치표지판","name":"12-08 흑선동계곡비탐","lat":38.139514,"lng":128.349736,"loc":"12-08","elev":0,"status":"ok"}];
  var _maxId=_facs.reduce(function(mx,f){return Math.max(mx,Number(f.id)||0);},0);
  var _seeded=_seed.map(function(s,i){return Object.assign({},s,{id:_maxId+1+i});});
  DB.s('facilities',_facs.concat(_seeded));
}
function initDB(){
  // 더미 직원 데이터 정리
  const _existStaff=DB.g('staff');
  if(!_existStaff||(_existStaff.length&&['손경완','김택찬','염원종','김종식','나진영','양지석','윤태종'].some(n=>_existStaff.some(s=>s.name===n)))){
    DB.s('staff',[]);
  }
  if(!DB.g('catFac'))     DB.s('catFac',['🪧 다목적위치표지판','📍 장소','🛤️ 데크/계단','🌉 교량','🏠 대피소','🛡️ 안전난간','🪵 목재계단','🚿 계곡시설']);
  // 카테고리 마이그레이션: 위치표지판 제거, 장소 추가
  (function(){var c=DB.g('catFac');if(!c)return;var c2=c.filter(function(x){return x!=='🪧 위치표지판';});if(!c2.includes('📍 장소'))c2.splice(1,0,'📍 장소');if(c2.length!==c.length||!c.includes('📍 장소'))DB.s('catFac',c2);})();
  // 이모지 없는 카테고리명 마이그레이션 (catFac + facilities + catFacMeta)
  (function(){var map={'분소':'🏠 분소','암빙벽':'🧗 암빙벽'};var c=DB.g('catFac');if(c){var changed=false;var c2=c.map(function(x){return map[x]?(changed=true,map[x]):x;});if(changed)DB.s('catFac',c2);}var facs=DB.g('facilities');if(facs){var fc=false;var f2=facs.map(function(f){if(map[f.type]){fc=true;return Object.assign({},f,{type:map[f.type]});}return f;});if(fc)DB.s('facilities',f2);}var m=DB.g('catFacMeta')||{};Object.keys(map).forEach(function(old){if(m[old]){m[map[old]]=m[old];delete m[old];}});DB.s('catFacMeta',m);})();
  // 탐방지원센터 분리 마이그레이션
  (function(){
    var c=DB.g('catFac')||[];var meta=DB.g('catFacMeta')||{};var changed=false;
    // 1) 결합된 카테고리명(분소+탐방지원센터) 처리: 분소만 남기고 탐방지원센터 분리
    var c2=[];c.forEach(function(x){
      if(x.includes('탐방지원센터')&&x.includes('분소')){
        var boso=x.replace(/\/?탐방지원센터\/?/g,'').trim()||'🏠 분소';
        if(!c2.some(function(v){return v===boso;}))c2.push(boso);
        changed=true;
      } else {c2.push(x);}
    });
    // 2) 탐방지원센터 단독 카테고리 없으면 추가
    if(!c2.some(function(x){return x.includes('탐방지원센터');})){c2.push('🛖 탐방지원센터');changed=true;}
    // 3) 이모지 없는 '탐방지원센터' → '🛖 탐방지원센터'
    c2=c2.map(function(x){if(x==='탐방지원센터'){changed=true;return '🛖 탐방지원센터';}return x;});
    if(changed)DB.s('catFac',c2);
    // 4) facilities type도 동일하게 수정
    var facs=DB.g('facilities');if(facs){var fc=false;var f2=facs.map(function(f){
      if(f.type&&f.type.includes('탐방지원센터')&&f.type.includes('분소')){fc=true;return Object.assign({},f,{type:'🛖 탐방지원센터'});}
      if(f.type==='탐방지원센터'){fc=true;return Object.assign({},f,{type:'🛖 탐방지원센터'});}
      return f;});if(fc)DB.s('facilities',f2);}
    // 5) catFacMeta 키 이전
    if(meta['탐방지원센터']){meta['🛖 탐방지원센터']=meta['탐방지원센터'];delete meta['탐방지원센터'];DB.s('catFacMeta',meta);}
  })();
  // catFacMeta 초기화 (재난지도 표시 여부 + 관리자 전용 여부)
  (function(){var m=DB.g('catFacMeta')||{};var changed=false;var def={'🪧 다목적위치표지판':{rescue:true,adminOnly:false},'📍 장소':{rescue:true,adminOnly:true},'🏠 대피소':{rescue:true,adminOnly:false}};Object.keys(def).forEach(function(k){if(!m[k]){m[k]=def[k];changed=true;}});if(changed)DB.s('catFacMeta',m);})();
  // 사찰 카테고리 마이그레이션: catFac 목록에서 암/사로 끝나는 항목 제거하고 🛕 사찰로 통합 (1회성)
  (function(){
    var TEMPLE='🛕 사찰';
    var isTemple=function(s){var t=s.replace(/^[\s\S]*\s/,'');return /암$|사$/.test(t);};
    var c=DB.g('catFac')||[];var cm=false;
    // 사찰 항목 없으면 추가
    if(!c.includes(TEMPLE)){c.push(TEMPLE);cm=true;}
    // 암/사로 끝나는 catFac 항목 제거 (카테고리 목록만 정리, 시설물 타입은 건드리지 않음)
    var c2=c.filter(function(x){if(x===TEMPLE)return true;var name=x.replace(/^[^\s]+\s/,'');if(isTemple(name)){cm=true;return false;}return true;});
    if(cm)DB.s('catFac',c2);
  })();
  // 다목적위치표지판 시드: 표지판이 하나도 없으면 1회 주입 (null·빈배열·전체삭제 모두 복원)
  if(!_fdb||_facSeedReady)_ensureSignSeed(); // 시드 레이스 방지 + 중복 시드 IIFE 제거(일원화)
  if(!DB.g('rescues'))    DB.s('rescues',[]);
  if(!DB.g('hazards'))    DB.s('hazards',[]);
  if(!DB.g('history'))    DB.s('history',[]);
  if(!DB.g('alertOps'))   DB.s('alertOps',[]);
  if(!DB.g('notis'))         DB.s('notis',[]);
  if(!DB.g('notiSetting'))   DB.s('notiSetting',{});
  _ensureNotiDefaults();
  if(!DB.g('currentUser'))   DB.s('currentUser',{name:'',dept:'',rank:'',kakao:null});
}

// ══════════════════════════════════════════
// 유틸
// ══════════════════════════════════════════
const pad=n=>String(n).padStart(2,'0');
// 생년월일(YYYY...) → 만 나이(연도 기준). 값 없으면 '' 반환
function _ageFromBirth(b){if(!b)return '';const y=parseInt(String(b).slice(0,4));const cy=new Date().getFullYear();if(isNaN(y)||y<1900||y>cy)return '';return cy-y;}
// 생년월일 텍스트 입력 자동 포매팅: 숫자만 입력 → YYYY-MM-DD 삽입
function _fmtBirth(el){
  const c=el.selectionStart;
  let v=el.value.replace(/\D/g,'').slice(0,8);
  let fmt='';
  if(v.length>4)fmt=v.slice(0,4)+'-'+v.slice(4);else fmt=v;
  if(v.length>6)fmt=v.slice(0,4)+'-'+v.slice(4,6)+'-'+v.slice(6);
  el.value=fmt;
  try{el.setSelectionRange(c+(fmt.length-el.value.length+1>0?1:0),c+(fmt.length-el.value.length+1>0?1:0));}catch(e){}
}
function now(){const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes());}
function _debounce(fn,ms){let t;return function(...a){clearTimeout(t);t=setTimeout(()=>fn.apply(this,a),ms);};}
// '2026-06-12 14:30' → '2시간 13분 경과' (골든타임 표시용)
function _elapsedStr(dateStr){
  try{
    const t=new Date(String(dateStr).replace(' ','T'));
    let m=Math.floor((Date.now()-t.getTime())/60000);
    if(isNaN(m)||m<0)return'';
    const d=Math.floor(m/1440);m-=d*1440;const h=Math.floor(m/60);m-=h*60;
    return(d?d+'일 ':'')+(h?h+'시간 ':'')+m+'분 경과';
  }catch(e){return'';}
}
function today(){return now().slice(0,10);}
// 진행중 경과시간 라이브 갱신: '.js-elapsed[data-d]' 요소의 텍스트를 주기적으로 다시 계산.
// (경과시간은 분 단위라 30초 간격이면 충분 — 새로고침 없이 자동으로 시간이 올라감)
function _tickElapsed(){
  try{
    document.querySelectorAll('.js-elapsed[data-d]').forEach(function(el){
      var v=_elapsedStr(el.getAttribute('data-d'));
      if(v)el.textContent='⏱ '+v;
    });
  }catch(e){}
}
if(!window._elapsedTimer)window._elapsedTimer=setInterval(_tickElapsed,30000);
function nowDT(){
  const d=new Date();
  return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());
}
var _toastTimer=null;
function toast(m,dur){const t=document.getElementById('toast');t.textContent=m;t.classList.add('on');clearTimeout(_toastTimer);
  // 중요 메시지(실패·경고·오류)는 자동으로 4초간 표시 — 놓치지 않도록
  if(dur===undefined){dur=(/실패|오류|⚠️|에러|불가|없습니다|권한/.test(String(m)))?4000:2200;}
  _toastTimer=setTimeout(()=>t.classList.remove('on'),dur);}
// 되돌리기 스낵바: 삭제 등 위험 작업 후 일정 시간 안에 취소 가능. onUndo=취소 시, onCommit=시간 경과 후 실제 확정.
let _undoTimer=null,_undoCommit=null;
function _undoToast(msg,onUndo,onCommit,dur=5000){
  const bar=document.getElementById('undoBar');if(!bar){onCommit&&onCommit();return;}
  // 직전 대기중인 확정이 있으면 먼저 실행(중첩 방지)
  if(_undoCommit){try{_undoCommit();}catch(e){}_undoCommit=null;}
  clearTimeout(_undoTimer);
  document.getElementById('undoBarMsg').textContent=msg;
  bar.style.display='flex';
  _undoCommit=onCommit||null;
  const close=()=>{bar.style.display='none';};
  document.getElementById('undoBarBtn').onclick=()=>{
    clearTimeout(_undoTimer);_undoCommit=null;close();
    try{onUndo&&onUndo();}catch(e){}
  };
  _undoTimer=setTimeout(()=>{close();_undoCommit=null;try{onCommit&&onCommit();}catch(e){}},dur);
}
function closeDB(){document.querySelectorAll('.dbcard').forEach(c=>c.classList.remove('on'));}
function closeM(id){document.getElementById(id).classList.remove('on');}
// 모달 배경(backdrop) 클릭 시 닫기
document.querySelectorAll('.modal').forEach(m=>{
  if(m.id==='modalUser')return; // 필수입력 검증 때문에 별도처리
  m.addEventListener('click',function(e){if(e.target===this)closeM(this.id);});
});
// ── 오프라인 사진 업로드 큐 (IndexedDB 영속 — 앱 재시작에도 유지) ──
const _offlinePhotoQueue=[];
function _photoIDB(){
  return new Promise((ok,no)=>{
    const rq=indexedDB.open('seorak_photoQ',1);
    rq.onupgradeneeded=()=>{rq.result.createObjectStore('q',{keyPath:'id'});};
    rq.onsuccess=()=>ok(rq.result);rq.onerror=()=>no(rq.error);
  });
}
async function _photoQPut(item){
  try{const db=await _photoIDB();const tx=db.transaction('q','readwrite');tx.objectStore('q').put(item);}catch(e){}
}
async function _photoQDel(id){
  try{const db=await _photoIDB();const tx=db.transaction('q','readwrite');tx.objectStore('q').delete(id);}catch(e){}
}
async function _photoQAll(){
  try{
    const db=await _photoIDB();
    return await new Promise((ok)=>{
      const rq=db.transaction('q','readonly').objectStore('q').getAll();
      rq.onsuccess=()=>ok(rq.result||[]);rq.onerror=()=>ok([]);
    });
  }catch(e){return[];}
}
// 제출 시 호출: 업로드 대기 중(pending)인 미리보기 사진을 저장된 레코드에 연결
function _registerPendingPhoto(pid,dest){
  const it=_offlinePhotoQueue.find(x=>x.pid===pid&&!x.dest);
  if(!it)return;
  it.dest=dest;
  _photoQPut({id:it.id,pid:it.pid,file:it.file,dest});
}
// 업로드 완료된 URL을 레코드 필드에 반영
function _applyPhotoDest(dest,url){
  if(!dest)return;
  const arr=DB.g(dest.key)||[];const i=arr.findIndex(x=>x.id===dest.id);
  if(i<0)return;
  if(dest.append){
    if(!arr[i][dest.field])arr[i][dest.field]=[];
    arr[i][dest.field].push({url,time:now(),by:dest.by||''});
  }else{
    arr[i][dest.field]=url;
  }
  DB.s(dest.key,arr);
}
async function _processPhotoQueue(){
  if(!navigator.onLine||!_fst)return;
  // 메모리 큐 + IDB 복원분 합치기 (재시작 후에도 이어서 업로드)
  const idb=await _photoQAll();
  idb.forEach(d=>{if(!_offlinePhotoQueue.some(x=>x.id===d.id))_offlinePhotoQueue.push(d);});
  if(!_offlinePhotoQueue.length)return;
  toast('🌐 대기 중인 사진 '+_offlinePhotoQueue.length+'장 업로드 중...');
  const items=_offlinePhotoQueue.splice(0);
  let ok=0;
  for(const item of items){
    try{
      const url=await uploadImageToStorage(item.file,'photos/'+(item.pid||'queued'));
      if(item.dest)_applyPhotoDest(item.dest,url);
      const prev=item.pid?document.getElementById(item.pid):null;
      if(prev){prev.dataset.url=url;const img=prev.querySelector('img');if(img)img.src=url;prev.querySelector('.up-badge')?.remove();}
      _photoQDel(item.id);ok++;
    }catch(e){_offlinePhotoQueue.push(item);} // 실패 → 큐 유지
  }
  if(ok)toast('✅ 사진 '+ok+'장 업로드 완료');
}
window.addEventListener('online',()=>setTimeout(_processPhotoQueue,2000));
// ── 이미지 압축 (긴 축 1200px, 82% JPEG) ─────────
async function _compressImage(file,maxPx=1200,quality=0.82){
  if(file.size<300*1024)return file; // 300KB 이하 압축 생략
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      URL.revokeObjectURL(img.src);
      let w=img.width,h=img.height;
      if(w<=maxPx&&h<=maxPx&&file.size<800*1024){resolve(file);return;}
      if(w>h){if(w>maxPx){h=Math.round(h*maxPx/w);w=maxPx;}}
      else{if(h>maxPx){w=Math.round(w*maxPx/h);h=maxPx;}}
      const c=document.createElement('canvas');c.width=w;c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      c.toBlob(b=>resolve(b||file),'image/jpeg',quality);
    };
    img.onerror=()=>resolve(file);
    img.src=URL.createObjectURL(file);
  });
}
async function uploadImageToStorage(file,path){
  if(!_fst)throw new Error('Storage 미초기화');
  const ref=_fst.ref().child(path+'/'+Date.now()+'_'+(file.name||'photo').replace(/[^a-zA-Z0-9._-]/g,'_'));
  const snap=await ref.put(file);
  return await snap.ref.getDownloadURL();
}
// dataset.url이 'pending'이면 빈 문자열 반환
const _photoUrl=id=>{const u=document.getElementById(id)?.dataset?.url||'';return u==='pending'?'':u;};
async function prevImg(inp,pid){
  if(!inp.files||!inp.files[0])return;
  const file=inp.files[0];
  const prev=document.getElementById(pid);
  const objUrl=URL.createObjectURL(file);
  prev.innerHTML=`<img src="${objUrl}" style="opacity:.75">`;
  prev.dataset.url='';
  const compressed=await _compressImage(file);
  if(!navigator.onLine){
    prev.innerHTML=`<img src="${objUrl}"><div class="up-badge" style="font-size:10px;color:#e67e22;background:rgba(0,0,0,.75);padding:2px 6px;border-radius:4px;margin-top:3px;text-align:center;">📵 연결 시 자동 업로드</div>`;
    prev.dataset.url='pending';
    const qItem={id:Date.now()+'_'+pid,file:compressed,pid};
    _offlinePhotoQueue.push(qItem);
    _photoQPut(qItem); // 제출 전이라도 보존 (제출 시 dest 연결됨)
    return;
  }
  // 업로드 완료 전 제출되어도 사진이 유실되지 않도록 큐에 등록(제출 시 _registerPendingPhoto로 dest 연결).
  prev.dataset.url='pending';
  const qItem={id:Date.now()+'_'+pid,file:compressed,pid};
  _offlinePhotoQueue.push(qItem);
  prev.innerHTML=`<img src="${objUrl}" style="opacity:.6"><div class="up-badge" style="font-size:10px;color:#4fa8d0;background:rgba(0,0,0,.75);padding:2px 6px;border-radius:4px;margin-top:3px;text-align:center;">업로드 중...</div>`;
  try{
    const url=await uploadImageToStorage(compressed,'photos/'+pid);
    prev.dataset.url=url;
    prev.innerHTML=`<img src="${url}">`;
    // 업로드 도중 사용자가 이미 제출했으면(dest 연결됨) 저장된 레코드에 URL 반영
    const qi=_offlinePhotoQueue.find(x=>x.id===qItem.id);
    if(qi&&qi.dest)_applyPhotoDest(qi.dest,url);
    const qidx=_offlinePhotoQueue.findIndex(x=>x.id===qItem.id);
    if(qidx>=0)_offlinePhotoQueue.splice(qidx,1);
    try{_photoQDel(qItem.id);}catch(e){}
  }catch(e){
    // 실패해도 큐에 보존 → 연결 복구 시 자동 재시도(제출돼 있으면 레코드에 자동 반영)
    prev.innerHTML=`<img src="${objUrl}"><div class="up-badge" style="font-size:10px;color:#e67e22;background:rgba(0,0,0,.75);padding:2px 6px;border-radius:4px;margin-top:3px;text-align:center;">⚠️ 업로드 대기 — 자동 재시도</div>`;
    try{_photoQPut(qItem);}catch(_){}
    toast('⚠️ 사진 업로드 실패 — 연결 시 자동 재시도');
  }
}
function fillSel(id,arr){document.getElementById(id).innerHTML=arr.map(v=>`<option value="${v}">${v}</option>`).join('');}
const SC=s=>s==='ok'?'#27ae60':s==='warn'?'#e67e22':'#c0392b';
const SL=s=>s==='ok'?'양호':s==='warn'?'보수필요':'파손위험';
function getAuthor(){const u=DB.g('currentUser')||{};return u.name||'미지정';}
function getSelPills(id){return [...document.querySelectorAll(`#${id} .pill.on`)].map(p=>p.textContent);}
function tPill(el){el.classList.toggle('on');}
function sPill(el,wrId){document.querySelectorAll(`#${wrId} .pill`).forEach(p=>p.classList.remove('on'));el.classList.add('on');
  // 음주 버튼 → hidden input 동기화
  if(wrId==='alcPills'){const val=el.textContent.replace(/[🚫⚠️🍺]/g,'').trim();const h=document.getElementById('r_alc');if(h)h.value=val;}
}
// 여러 핀 그룹의 선택(.on) 일괄 해제
function _resetPills(...ids){ids.forEach(id=>document.querySelectorAll(`#${id} .pill`).forEach(p=>p.classList.remove('on')));}
function chkIllegal(sel){
  document.getElementById('fineWrap').style.display=sel.value.includes('비법정')?'block':'none';
  const pw=document.getElementById('permitWrap');
  if(pw) pw.style.display=(sel.value==='암벽'||sel.value==='빙벽')?'block':'none';
  const clw=document.getElementById('climbLocWrap');
  if(clw){
    const isClimb=sel.value==='암벽'||sel.value==='빙벽';
    clw.style.display=isClimb?'block':'none';
    if(isClimb){
      const locs=sel.value==='암벽'?_ROCK_LOCS:_ICE_LOCS;
      const curVal=(document.getElementById('r_loc')?.value||'').trim();
      clw.innerHTML=`<span class="fl">📍 ${sel.value} 위치 선택</span><div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px;" id="climbLocBtns">${locs.map(l=>`<button class="tog-btn${curVal===l?' on':''}" onclick="selClimbLoc('${l.replace(/'/g,"\\'")}',this)">${l}</button>`).join('')}</div>`;
    }
  }
}
function selClimbLoc(loc,btn){
  const inp=document.getElementById('r_loc');
  if(inp){inp.value=loc;autoGenTitle();}
  // Scope to the clicked button's own group — #climbLocBtns can exist in two modals
  const grp=btn?btn.parentElement:document.getElementById('climbLocBtns');
  if(grp)grp.querySelectorAll('.tog-btn').forEach(b=>b.classList.remove('on'));
  if(btn)btn.classList.add('on');
}
function chkPermit(sel){document.getElementById('permitNote').style.display=sel.value==='허가자 있음'?'block':'none';}
let _companionCount=(window._companionCount)||0;
function addCompanion(){
  _companionCount++;
  const list=document.getElementById('companionList');
  if(!list)return;
  const idx=list.children.length;
  const div=document.createElement('div');
  div.className='companion-item';
  div.dataset.idx=idx;
  div.style.cssText='background:#060d1a;border-radius:8px;padding:10px;margin-bottom:6px;border:1px solid rgba(255,255,255,.07);';
  div.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span style="font-size:11px;color:#4fa8d0;font-weight:700;">동반자 ${idx+1}</span><button onclick="this.closest('.companion-item').remove();renumberCompanions()" style="background:rgba(192,57,43,.15);color:#c0392b;border:none;border-radius:5px;padding:3px 8px;font-size:10px;cursor:pointer;">삭제</button></div>
  <div class="frow"><div class="fg"><span class="fl">성명</span><input type="text" class="fi comp-name" placeholder="이름"></div><div class="fg"><span class="fl">연락처</span><input type="tel" class="fi comp-tel" placeholder="연락처"></div></div>`;
  list.appendChild(div);
}
function removeCompanion(idx){
  const items=document.querySelectorAll('#companionList .companion-item');
  if(items[idx])items[idx].remove();
  renumberCompanions();
}
function renumberCompanions(){
  document.querySelectorAll('#companionList .companion-item').forEach((el,i)=>{
    const label=el.querySelector('span');
    if(label)label.textContent='동반자 '+(i+1);
    el.dataset.idx=i;
  });
}
function getCompanions(){
  return [...document.querySelectorAll('#companionList .companion-item')].map(el=>({
    name:el.querySelector('.comp-name')?.value||'',
    tel:el.querySelector('.comp-tel')?.value||''
  })).filter(c=>c.name||c.tel);
}
// 추가 사고자(다수 사상자) — 기본 사고자(vName 등)는 유지하고 추가분만 배열로 보관
const _V2_SEV=['','KTAS 1 (소생)','KTAS 2 (긴급)','KTAS 3 (응급)','KTAS 4 (준응급)','KTAS 5 (비응급)'];
function _victim2CardHtml(v){
  v=v||{};
  const sevOpts=_V2_SEV.map(o=>`<option value="${o}"${(v.severity||'')===o?' selected':''}>${o||'중증도 선택'}</option>`).join('');
  const genOpts=['알수없음','남','여'].map(o=>`<option${(v.gender||'알수없음')===o?' selected':''}>${o}</option>`).join('');
  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span style="font-size:11px;color:#e9897e;font-weight:700;">🧑 추가 사고자</span><button onclick="this.closest('.victim2-item').remove()" style="background:rgba(192,57,43,.15);color:#c0392b;border:none;border-radius:5px;padding:3px 8px;font-size:10px;cursor:pointer;">삭제</button></div>
  <div class="frow"><div class="fg"><span class="fl">성명</span><input type="text" class="fi v2-name" placeholder="이름" value="${(v.name||'').replace(/"/g,'&quot;')}"></div><div class="fg"><span class="fl">성별</span><select class="fsel v2-gender">${genOpts}</select></div></div>
  <div class="frow"><div class="fg"><span class="fl">나이</span><input type="number" inputmode="numeric" class="fi v2-age" placeholder="세" value="${v.age||''}"></div><div class="fg"><span class="fl">중증도</span><select class="fsel v2-sev">${sevOpts}</select></div></div>
  <div class="fg"><span class="fl">부상/상태</span><input type="text" class="fi v2-note" placeholder="예: 우측 발목 골절, 의식 명료" value="${(v.note||'').replace(/"/g,'&quot;')}"></div>`;
}
function addVictim2(){
  const list=document.getElementById('victim2List');if(!list)return;
  const div=document.createElement('div');
  div.className='victim2-item';
  div.style.cssText='background:#060d1a;border-radius:8px;padding:10px;margin-bottom:6px;border:1px solid rgba(231,76,60,.15);';
  div.innerHTML=_victim2CardHtml({});
  list.appendChild(div);
}
function getVictims2(){
  return [...document.querySelectorAll('#victim2List .victim2-item')].map(el=>({
    name:el.querySelector('.v2-name')?.value||'',
    gender:el.querySelector('.v2-gender')?.value||'',
    age:el.querySelector('.v2-age')?.value||'',
    severity:el.querySelector('.v2-sev')?.value||'',
    note:el.querySelector('.v2-note')?.value||''
  })).filter(v=>v.name||v.note||v.age);
}
function _victims2Str(arr){
  return (arr||[]).map(v=>[v.name||'미상',v.gender&&v.gender!=='알수없음'?v.gender:'',v.age?v.age+'세':'',v.severity,v.note].filter(Boolean).join(' · ')).join(' / ');
}
function chkNation(sel){
  const wrap=document.getElementById('r_vNatWrap_extra');
  if(wrap)wrap.style.display=sel.value==='외국인'?'block':'none';
  autoGenTitle();
}

// ══════════════════════════════════════════
// 알림
// ══════════════════════════════════════════
// ── 알림 카테고리(세분화) ── def: 기본 켜짐 여부 / push: OS 푸시 여부(false면 앱 내 종만)
const NOTI_GROUPS=[
  {title:'🚨 현장 위험상황·구조', items:[
    {k:'안전사고',l:'안전사고',sub:'실족·추락·부상',def:true,push:true},
    {k:'낙석',l:'낙석',sub:'낙석 발생',def:true,push:true},
    {k:'위험수목',l:'위험수목',sub:'쓰러짐·낙목',def:true,push:true},
    {k:'화재',l:'화재·산불',sub:'산불·시설 화재',def:true,push:true},
    {k:'기타',l:'기타 위험',sub:'기타 위험상황',def:true,push:true},
    {k:'rescue_mobilize',l:'응소 요청',sub:'야간·산불 응소·재알림',def:true,push:true},
    {k:'progress',l:'진행중 경과 알림',sub:'장시간 미종료 리마인더',def:true,push:true},
    {k:'rescue_update',l:'추가보고·댓글',sub:'구조 추가보고·댓글',def:false,push:false},
    {k:'rescue_close',l:'상황 종료',sub:'구조 상황 종료',def:false,push:false},
  ]},
  {title:'🏗️ 시설물 점검', items:[
    {k:'fac_bad',l:'위험 시설물',sub:'파손 심각 등록',def:true,push:true},
    {k:'fac_warn',l:'보수 필요',sub:'보수필요 판정',def:false,push:false},
  ]},
  {title:'🌀 재난대응 (특보·위기경보)', items:[
    {k:'op_start',l:'특보운영 시작',sub:'특보운영 개시',def:true,push:true},
    {k:'op_change',l:'특보 상향·하향',sub:'단계 변경·추가 발령',def:true,push:true},
    {k:'op_end',l:'특보운영 종료',sub:'운영 종료',def:true,push:true},
    {k:'op_kma',l:'기상특보 수신',sub:'기상청 자동 특보',def:true,push:true},
    {k:'crisis',l:'재난위기경보',sub:'관심·주의·경계·심각',def:true,push:true},
    {k:'trail',l:'탐방로 통제',sub:'구간 통제·개방',def:true,push:true},
    {k:'weather',l:'기상 브리핑',sub:'정기 기상 브리핑',def:true,push:false},
  ]},
];
const NOTI_PUSH=(()=>{const m={};NOTI_GROUPS.forEach(g=>g.items.forEach(it=>{m[it.k]=it.push;}));return m;})();
// 신규 카테고리를 기존 사용자 설정에 기본값으로 보강
function _ensureNotiDefaults(){
  const s=DB.g('notiSetting')||{};let ch=false;
  NOTI_GROUPS.forEach(g=>g.items.forEach(it=>{if(s[it.k]===undefined){s[it.k]=it.def;ch=true;}}));
  if(ch)DB.s('notiSetting',s);
  return s;
}
function pushNoti(msg,ico,type='info',link=null,pushCat=null,opts){
  const adminOnly=!!(opts&&opts.adminOnly); // 관리자에게만 보낼 알림(권한 요청 등)
  const s=DB.g('notiSetting')||{};if(type!=='info'&&s[type]===false)return;
  // pushCat 미지정 시: 카테고리 정의에 push:false면 OS 푸시 끔(앱 내 종만)
  if(pushCat===null)pushCat=(NOTI_PUSH[type]===false)?'info':type;
  const id=Date.now();
  // 내 벨에 추가 — 관리자 전용 알림인데 내가 관리자가 아니면(요청자 본인) 추가 안 함
  if(!adminOnly||(typeof isAdminUser==='function'&&isAdminUser())){
    const ns=DB.g('notis')||[];ns.unshift({id,msg,ico,time:now(),read:false,link});
    if(ns.length>80)ns.splice(80);DB.s('notis',ns);updateBell();
  }
  // 꺼진 폰까지 OS 푸시 — 관리자 전용은 전체 OS푸시를 보내지 않음(앱 내 벨로만, 전원 진동 방지)
  if(!adminOnly)_sendFcmPush('설악산 현장관리',msg,pushCat||type,link);
  // 기기 간 Firestore 브로드캐스트 (adminOnly면 수신측에서 관리자만 표시)
  if(_fdb){
    _fdb.collection('sharedNotis').doc(String(id)).set({
      id,msg,ico,type:type||'info',link:link||null,adminOnly:adminOnly,
      at:id,timeStr:now(),deviceId:_MY_DEVICE_ID
    }).catch(()=>{});
  }
}
function _cleanOldSharedNotis(){
  if(!_fdb)return;
  const cutoff=Date.now()-24*60*60*1000;
  // 한 번에 최대 100건만 삭제(여러 기기가 동시에 돌려도 부담 적게) — 200명 동시접속 시 폭주 방지
  _fdb.collection('sharedNotis').where('at','<',cutoff).limit(100).get()
    .then(snap=>snap.docs.forEach(d=>d.ref.delete())).catch(()=>{});
}
function _showSystemNoti(body,ico){
  if(document.visibilityState==='visible')return; // 앱 보이는 중이면 불필요
  if(typeof Notification==='undefined'||Notification.permission!=='granted')return; // 인앱 브라우저 등 Notification 미지원 환경 보호
  const title='설악산 현장관리 '+(ico||'🔔');
  if(_swReg){
    _swReg.showNotification(title,{body,icon:'icons/icon-192.png',vibrate:[200,100,200]});
  }else if('Notification' in window){
    try{new Notification(title,{body});}catch(e){}
  }
}
function toggleHiContrast(){
  const on=document.body.classList.toggle('hi-contrast');
  localStorage.setItem('_hiContrast',on?'1':'');
  const btn=document.getElementById('hiContrastBtn');
  if(btn)btn.style.opacity=on?'1':'.5';
  toast(on?'🌞 야외 고대비 모드 켜짐':'🌙 고대비 모드 꺼짐');
}
// VAPID 키 설정 후 FCM 토큰 등록 (Firebase Console > Project Settings > Cloud Messaging > Web Push 인증서)
const _FCM_VAPID=''; // ← 여기에 Firebase Console에서 발급한 VAPID 키 입력
const _FCM_PUSH_URL='https://script.google.com/macros/s/AKfycbwp4JWCBkLC-LlSqiPOmyUEIO3uhv9w0ReJhEaJcXvlK0NWWwIrEK3Jo-DTaBWRHqJW/exec';
const _FCM_PUSH_SECRET='설악산119';
async function _initFCM(){
  if(!_fmsg||!_fdb||!_swReg||typeof Notification==='undefined'||Notification.permission!=='granted'||!_FCM_VAPID)return;
  try{
    const token=await _fmsg.getToken({vapidKey:_FCM_VAPID,serviceWorkerRegistration:_swReg});
    if(token)_saveFcmToken(token,'web');
  }catch(e){}
}

// ══ 네이티브 푸시 (Capacitor / 안드로이드 APK) ══
// 웹 VAPID와 달리 OS 차원 푸시 → 앱이 완전히 꺼져 있어도 수신.
let _pnListenersSet=false;
async function _initNativePush(){
  const Cap=window.Capacitor;
  if(!Cap||!Cap.isNativePlatform||!Cap.isNativePlatform())return; // 웹은 _initFCM 사용
  const PN=Cap.Plugins&&Cap.Plugins.PushNotifications;
  if(!PN)return;
  try{
    // 긴급 알림 채널(안드로이드 8+, 헤드업 표시)
    if(PN.createChannel){try{await PN.createChannel({id:'seoraksan_alerts',name:'긴급 알림',description:'구조·위험상황 푸시',importance:5,visibility:1,vibration:true,sound:'default'});}catch(e){}}
    let perm=await PN.checkPermissions();
    if(perm.receive!=='granted')perm=await PN.requestPermissions();
    if(perm.receive!=='granted')return;
    if(!_pnListenersSet){
      _pnListenersSet=true;
      PN.addListener('registration',t=>{_saveFcmToken(t.value,'android');});
      PN.addListener('registrationError',()=>{});
      PN.addListener('pushNotificationActionPerformed',act=>{
        const d=(act.notification&&act.notification.data)||{};
        if(d.app){try{goNotiLink({app:d.app,tab:d.tab?+d.tab:0,id:d.id||null});}catch(e){}}
      });
    }
    await PN.register();
  }catch(e){}
}
// 네이티브(APK)에서 알림 권한처럼 위치 권한도 최초 실행 시 자동으로 요청.
// AndroidManifest에 위치 권한이 선언돼 있으면 Capacitor WebView가
// navigator.geolocation 호출 시 OS 권한창을 띄운다.
// (@capacitor/geolocation 플러그인은 play-services-location의 구버전 Kotlin이
//  KGP와 충돌해 릴리스 빌드를 깨뜨려 사용하지 않음)
function _initNativeLocationPerm(){
  const Cap=window.Capacitor;
  if(!Cap||!Cap.isNativePlatform||!Cap.isNativePlatform())return; // 웹은 화면 하단 배너로 요청
  if(!navigator.geolocation)return;
  if(localStorage.getItem('_locPermAsked'))return;
  localStorage.setItem('_locPermAsked','1');
  navigator.geolocation.getCurrentPosition(()=>{},()=>{},{enableHighAccuracy:true,timeout:15000});
}
let _fcmTokenCache=null;
function _saveFcmToken(token,platform){
  if(!token)return;
  _fcmTokenCache={token,platform:platform||'web'};   // Firebase 준비 전이면 캐시 후 재시도
  if(!_fdb)return;
  const u=DB.g('currentUser')||{};
  _fdb.collection('fcmTokens').doc(_MY_DEVICE_ID).set({
    token,userId:u.id||'',name:u.name||'',dept:u.dept||'',kakaoId:String(u.kakaoId||''),
    notiSetting:DB.g('notiSetting')||{},platform:_fcmTokenCache.platform,updatedAt:Date.now()
  },{merge:true}).catch(()=>{});
}
function _flushFcmToken(){if(_fcmTokenCache)_saveFcmToken(_fcmTokenCache.token,_fcmTokenCache.platform);}
// 알림 설정 변경 시 내 토큰 문서에도 반영 (받는 사람별 필터용)
function _updateFcmTokenSettings(){
  if(!_fdb)return;
  _fdb.collection('fcmTokens').doc(_MY_DEVICE_ID).set(
    {notiSetting:DB.g('notiSetting')||{},updatedAt:Date.now()},{merge:true}
  ).catch(()=>{});
}
// 중요 알림을 꺼진 폰까지 발송 (Apps Script 경유). cat=알림설정 키, 'info'면 발송 안 함.
async function _sendFcmPush(title,body,cat,link){
  if(!_fdb)return;
  const url=_FCM_PUSH_URL||(DB.g('fcmPushUrl')||'').trim();
  if(!url||!cat||cat==='info')return;
  try{
    const snap=await _fdb.collection('fcmTokens').get();
    const targets=[];
    snap.forEach(d=>{
      const v=d.data()||{};
      if(!v.token||d.id===_MY_DEVICE_ID)return;        // 내 폰엔 안 보냄
      if(((v.notiSetting||{})[cat])===false)return;     // 그 사람이 끈 알림
      targets.push({id:d.id,token:v.token});
    });
    if(!targets.length)return;
    const res=await fetch(url,{
      method:'POST',
      headers:{'content-type':'text/plain;charset=utf-8'}, // Apps Script preflight 회피
      body:JSON.stringify({
        secret:_FCM_PUSH_SECRET||(DB.g('fcmPushSecret')||''),title,body,
        data:link?{app:link.app||'',tab:String(link.tab||''),id:String(link.id||'')}:{},
        tokens:targets.map(t=>t.token)
      })
    });
    const out=await res.json().catch(()=>({}));
    if(out&&Array.isArray(out.invalid)){                // 무효 토큰 정리
      out.invalid.forEach(tok=>{
        const hit=targets.find(t=>t.token===tok);
        if(hit)_fdb.collection('fcmTokens').doc(hit.id).delete().catch(()=>{});
      });
    }
  }catch(e){}
}
function updateBell(){
  const cnt=(DB.g('notis')||[]).filter(n=>!n.read).length;
  ['bellCnt','bellCntHome'].forEach(id=>{const e=document.getElementById(id);if(!e)return;e.textContent=cnt>9?'9+':cnt;e.classList.toggle('on',cnt>0);});
}
function openNoti(){
  const ns=DB.g('notis')||[];
  document.getElementById('notiList').innerHTML=ns.length
    ?ns.map(n=>{
      const hasLink=n.link&&n.link.app;
      const linkStr=hasLink?`goNotiLink(${JSON.stringify(n.link).replace(/"/g,"'")})`:'';
      return `<div class="ni ${n.read?'read':'unread'}" style="${hasLink?'cursor:pointer;':''}" ${hasLink?`onclick="${linkStr}"`:''}  >
        <div style="position:relative;flex-shrink:0;">
          <div class="ni-ico">${n.ico}</div>
          ${n.read?'':'<div style="position:absolute;top:-2px;right:-2px;width:7px;height:7px;background:#e05050;border-radius:50%;border:1.5px solid #0b1c30;"></div>'}
        </div>
        <div style="flex:1;min-width:0;">
          <div class="ni-msg">${_esc(n.msg)}</div>
          <div class="ni-t">${n.time}${hasLink?' · <span style="color:#4fa8d0;font-size:10px;">탭하여 이동 →</span>':''}</div>
        </div>
      </div>`;
    }).join('')
    :'<div class="noti-empty">✅ 새 알림 없음</div>';
  DB.s('notis',(ns).map(n=>({...n,read:true})));updateBell();
  document.getElementById('notiPanel').classList.add('on');document.getElementById('notiBg').classList.add('on');
}
function goNotiLink(link){
  closeNoti();
  if(!link||!link.app) return;
  openApp(link.app);
  if(link.tab) setTimeout(()=>switchTab(link.tab,document.getElementById('nv'+link.tab)),200);
  if(link.id) setTimeout(()=>{
    if(link.app==='rescue') openResPopup(link.id,'rescue');
    else if(link.app==='inspect') openFacDetail(link.id);
  },300);
}
function closeNoti(){document.getElementById('notiPanel').classList.remove('on');document.getElementById('notiBg').classList.remove('on');}
function markAllRead(){DB.s('notis',(DB.g('notis')||[]).map(n=>({...n,read:true})));updateBell();openNoti();}
function clearNotis(){DB.s('notis',[]);updateBell();closeNoti();toast('🗑️ 알림 삭제');}

