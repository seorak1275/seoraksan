'use strict';
// ══════════════════════════════════════════
// 위험상황 보고
// ══════════════════════════════════════════
let _hazFireTL=[];
function chkHazType(txt){
  const isFire=txt.includes('산불');
  document.getElementById('hazFireTimelineWrap').style.display=isFire?'block':'none';
  document.getElementById('hazFireMobilizeWrap').style.display=isFire?'block':'none';
  document.getElementById('hazFireLeadWrap').style.display=isFire?'block':'none';
  if(isFire){
    const el=document.getElementById('hazFireTLTime');
    if(el)el.value=new Date().toISOString().slice(0,16);
    const stages=['최초 발화 확인','소방 신고','소방 도착','진화 시작','진화 완료','재발화','완전 진화'];
    const qp=document.getElementById('hazFireQuickPills');
    if(qp)qp.innerHTML=stages.map(s=>`<div class="pill" onclick="addHazFireTL('${s}')" style="font-size:10px;">${s}</div>`).join('');
  }
}
function addHazFireTL(stage){
  const timeEl=document.getElementById('hazFireTLTime');
  const noteEl=document.getElementById('hazFireTLNote');
  const time=timeEl?.value?.replace('T',' ')||new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
  noteEl.value=stage;
  renderHazFireTL();
}
function confirmHazFireTL(){
  const time=(document.getElementById('hazFireTLTime')?.value||'').replace('T',' ');
  const note=document.getElementById('hazFireTLNote')?.value||'';
  if(!note.trim()){toast('⚠️ 내용 입력');return;}
  _hazFireTL.push({time,note});
  _hazFireTL.sort((a,b)=>a.time.localeCompare(b.time));
  document.getElementById('hazFireTLNote').value='';
  renderHazFireTL();
}
function renderHazFireTL(){
  const el=document.getElementById('hazFireTLList');
  if(!el)return;
  el.innerHTML=_hazFireTL.length?_hazFireTL.map((t,i)=>`<div style="display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.05);">
    <span style="font-size:10px;color:#4fa8d0;flex-shrink:0;">${t.time.slice(11)||t.time}</span>
    <span style="font-size:11px;color:#e0edf8;flex:1;">${_esc(t.note)}</span>
    <button onclick="_hazFireTL.splice(${i},1);renderHazFireTL()" style="background:none;border:none;color:#c0392b;font-size:13px;cursor:pointer;">✕</button>
  </div>`).join(''):'<div style="font-size:11px;color:rgba(255,255,255,.25);padding:4px 0;">타임라인 항목 없음</div>';
}
// 등록 후 상세화면에서도 산불 진행 타임라인을 계속 추가/삭제할 수 있도록(N보 대체)
function _hazFireTLHtml(h){
  if(!h.hazType||!h.hazType.includes('산불'))return '';
  const tl=h.fireTL||[];
  const stages=['최초 발화 확인','소방 신고','소방 도착','진화 시작','진화 완료','재발화','완전 진화'];
  return `<div id="fireTLBlk_${h.id}" style="background:#0b1c30;border-radius:10px;padding:11px 12px;border:.5px solid rgba(192,57,43,.25);margin-top:8px;">
    <div style="font-size:11px;color:#c0392b;font-weight:700;margin-bottom:7px;">🔥 산불 진행 타임라인</div>
    <div style="margin-bottom:6px;">
      ${tl.length?tl.map((t,i)=>`<div style="display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.05);">
        <span style="font-size:10px;color:#4fa8d0;flex-shrink:0;">${_esc((t.time||'').slice(11)||t.time||'-')}</span>
        <span style="font-size:11px;color:#e0edf8;flex:1;">${_esc(t.note)}</span>
        <button onclick="delHazFireTL(${h.id},${i})" style="background:none;border:none;color:#c0392b;font-size:13px;cursor:pointer;">✕</button>
      </div>`).join(''):'<div style="font-size:11px;color:rgba(255,255,255,.25);padding:4px 0;">타임라인 항목 없음</div>'}
    </div>
    <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;">
      ${stages.map(s=>`<div class="pill" onclick="document.getElementById('fireTLNote_${h.id}').value='${_escq(s)}'" style="font-size:10px;">${s}</div>`).join('')}
    </div>
    <div style="display:flex;gap:5px;align-items:flex-end;">
      <input type="datetime-local" id="fireTLTime_${h.id}" class="fi" style="flex:1;" value="${new Date().toISOString().slice(0,16)}">
      <input type="text" id="fireTLNote_${h.id}" class="fi" style="flex:2;" placeholder="상황 내용">
      <button onclick="addHazFireTLEntry(${h.id})" style="background:#1a4a6e;color:#fff;border:none;padding:9px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;flex-shrink:0;">추가</button>
    </div>
  </div>`;
}
function addHazFireTLEntry(id){
  const haz=DB.g('hazards')||[];
  const idx=haz.findIndex(x=>x.id===id);if(idx===-1)return;
  const time=(document.getElementById('fireTLTime_'+id)?.value||'').replace('T',' ');
  const note=document.getElementById('fireTLNote_'+id)?.value||'';
  if(!note.trim()){toast('⚠️ 내용 입력');return;}
  const tl=[...(haz[idx].fireTL||[]),{time,note}].sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  haz[idx]={...haz[idx],fireTL:tl};
  DB.s('hazards',haz);
  const blk=document.getElementById('fireTLBlk_'+id);
  if(blk)blk.outerHTML=_hazFireTLHtml(haz[idx]);
  toast('🔥 타임라인 추가');
}
function delHazFireTL(id,i){
  const haz=DB.g('hazards')||[];
  const idx=haz.findIndex(x=>x.id===id);if(idx===-1)return;
  const tl=(haz[idx].fireTL||[]).slice();tl.splice(i,1);
  haz[idx]={...haz[idx],fireTL:tl};
  DB.s('hazards',haz);
  const blk=document.getElementById('fireTLBlk_'+id);
  if(blk)blk.outerHTML=_hazFireTLHtml(haz[idx]);
}
function openNewHazard(){
  _hazFireTL=[];
  document.getElementById('hz_dt').value=nowDT();
  document.getElementById('hz_loc').value='';document.getElementById('hz_gps').value='';
  initHazMiniMap();
  document.getElementById('hz_desc').value='';const _ha=document.getElementById('hz_author');_ha.value=getAuthor();_ha.disabled=true;
  document.getElementById('prevHaz').innerHTML='📸 현장 사진';
  document.getElementById('hazFireTimelineWrap').style.display='none';
  document.getElementById('hazFireMobilizeWrap').style.display='none';
  document.getElementById('hazFireLeadWrap').style.display='none';
  _resetPills('hazTypePills','hazDangerPills','hazStatusPills','hazOnSitePills','hazResponsePills','hazMobilizePills');
  document.querySelector('#hazStatusPills .pill').classList.add('on');
  renderHazFireTL();
  document.getElementById('modalHazard').classList.add('on');
}
let _hazSubmitting=false;
function submitHazard(){
  const type=getSelPills('hazTypePills')[0];
  if(!type){toast('⚠️ 유형 선택');return;}
  if(_hazSubmitting)return; // 이중 탭 중복 등록 방지
  _hazSubmitting=true;
  setTimeout(()=>{_hazSubmitting=false;},1500);
  const gps=document.getElementById('hz_gps').value.split(',');
  const lat=parseFloat(gps[0])||null,lng=parseFloat(gps[1])||null;
  const h={
    id:Date.now(),hazType:type,
    dt:document.getElementById('hz_dt').value.replace('T',' '),
    loc:document.getElementById('hz_loc').value,lat,lng,
    danger:getSelPills('hazDangerPills')[0]||'',
    desc:document.getElementById('hz_desc').value,
    hazStatus:getSelPills('hazStatusPills')[0]||'미조치',
    statusLog:[{status:getSelPills('hazStatusPills')[0]||'미조치',at:now(),by:document.getElementById('hz_author').value||'-'}],
    onSite:getSelPills('hazOnSitePills')[0]||'',response:getSelPills('hazResponsePills')[0]||'',
    author:document.getElementById('hz_author').value,
    photo:_photoUrl('prevHaz'),
    fireTL:type.includes('산불')?[..._hazFireTL]:[],
    mobilize:type.includes('산불')?getSelPills('hazMobilizePills'):[],
    leadAgency:type.includes('산불')?'산림청':'',
  };
  const haz=DB.g('hazards')||[];haz.push(h);DB.s('hazards',haz);
  _registerPendingPhoto('prevHaz',{key:'hazards',id:h.id,field:'photo'});
  pushNoti(`⚠️ 위험상황: ${type} · ${h.loc||'-'}`,'⚠️','낙석',{app:'rescue',tab:2});
  if(h.mobilize&&h.mobilize.length)pushNoti(`🚨 산불 응소 요청: ${h.mobilize.join(', ')} — ${h.loc||'-'}`,'🚨','rescue_mobilize',{app:'rescue',tab:2});
  closeM('modalHazard');try{renderRescueMap();}catch(e){}try{renderResList();}catch(e){}toast('⚠️ 위험상황 등록'+(h.mobilize&&h.mobilize.length?' · 응소: '+h.mobilize.join(', '):''));updateSummary();
}

// ══════════════════════════════════════════
// 시설물
// ══════════════════════════════════════════
let selFacId=null;
let facMapStatusF=new Set(),facMapTypeF=new Set(),facMapLocF=new Set(),facMapGradeF=new Set();
let facListSort='default'; // 'default' | 'overdue'(점검 오래된순)
function setFacListSort(v){
  facListSort=facListSort===v?'default':v;
  _persistFilters();
  if(facListSort==='overdue')_loadArchive('history').then(()=>{_updateFacListFilterPanel();renderFacList();}); // 1년 이전 점검이력도 반영
  _updateFacListFilterPanel();renderFacList();
}
// 점검이력·상태(주의/심각) 제거 마이그레이션 (1회) — 시설은 경고표시 체계로 전환
function _facMigrateV2(){
  try{
    if(localStorage.getItem('_facV2')==='1')return;
    var f=DB.g('facilities')||[],ch=false;
    f.forEach(function(x){if('status' in x){delete x.status;ch=true;}if('statusAt' in x){delete x.statusAt;ch=true;}});
    if(ch)DB.s('facilities',f);
    if((DB.g('history')||[]).length)DB.s('history',[]);
    localStorage.setItem('_facV2','1');
  }catch(e){}
}
function renderInspectMap(){
  if(!mapI){return;}
  _facMigrateV2();
  try{_closeFacOverlapSheet();}catch(e){} // 열린 겹침 목록 시트가 있으면 닫기(재구성 시)
  iOvs.forEach(o=>{try{o.setMap(null);}catch(e){}});iOvs=[];iEls=[];
  _iClusterOvs.forEach(o=>{try{o.setMap(null);}catch(e){}});_iClusterOvs=[];
  const _admin=isAdminUser();const _meta=DB.g('catFacMeta')||{};
  // Firestore 수신 전엔 경량 부트 캐시로 핀 먼저 표시(즉시 표시) — 수신되면 자동 재렌더로 교체
  const _facsAll=DB.g('facilities')||(typeof _facBootCache==='function'&&_facBootCache())||[];
  const facs=_facsAll.filter(f=>_admin||!(_meta[f.type]||{}).adminOnly);
  const types=['전체',...new Set(facs.map(f=>f.type.split(' ').slice(1).join(' ')||f.type).filter(Boolean))];
  const _signFacs=_facsAll.filter(f=>f.type&&f.type.includes('다목적위치표지판'));
  const locs=['전체',...new Set(_signFacs.map(f=>(f.name.match(/\d+/)||[''])[0]).filter(Boolean)).values()].sort((a,b)=>a==='전체'?-1:a.localeCompare(b,'ko'));
  _updateInspFilterPanel(types,locs);
  const filtered=facs.filter(f=>{
    if(!_facVisibleTo(f))return false; // 숨김 시설은 일반 사용자에게 미표시
    const wOk=facMapStatusF.size===0||(facMapStatusF.has('warn')&&!!_facWarn(f));
    const tOk=facMapTypeF.size===0||[...facMapTypeF].some(t=>f.type.includes(t));
    const lOk=facMapLocF.size===0||[...facMapLocF].some(v=>_facInZone(f,v));
    const _cg=facMapGradeF.size?_facCurGrade(f):null;
    const gOk=facMapGradeF.size===0||(_cg&&facMapGradeF.has(_cg.g));
    return wOk&&tOk&&lOk&&gOk;
  });
  filtered.forEach(f=>{
    if(!f.lat||!f.lng)return;
    const el=document.createElement('div');el.className='mpin '+(_facWarn(f)?'p-bad blink':'p-fac');el.innerHTML=f.type.split(' ')[0];
    el._facId=f.id;
    // 종류별 색 — 테두리+바탕 틴트로 한눈에 구분 (경고표시는 빨간 깜빡임 유지)
    if(!_facWarn(f)){const _tc=_facTypeColor(f.type);el.style.borderColor=_tc;el.style.background=`linear-gradient(0deg,${_tc}44,${_tc}44),#0b1c30`;}
    if(f.hidden)el.style.opacity='.4'; // 권한자에게만 보이는 숨김 시설 — 흐리게
    let _ts=null;
    el.addEventListener('touchstart',e=>{_ts={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
    el.addEventListener('touchend',e=>{
      if(!_ts)return;
      const dx=e.changedTouches[0].clientX-_ts.x,dy=e.changedTouches[0].clientY-_ts.y;
      _ts=null;
      if(Math.abs(dx)<8&&Math.abs(dy)<8){e.stopPropagation();e.preventDefault();_facPinTap(f.id);}
    });
    el.addEventListener('click',e=>{e.stopPropagation();_facPinTap(f.id);});
    const ov=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(f.lat,f.lng),content:el,clickable:true});
    ov._lat=f.lat;ov._lng=f.lng;ov._facId=f.id; // 부채꼴 펼침이 겹친 핀을 찾을 때 사용
    ov._sign=!!(f.type&&f.type.includes('다목적위치표지판')); // 줌아웃 시 표지판 숨김용 플래그
    ov._warn=!!_facWarn(f); // 경고 표시 시설은 축소 상태에서도 항상 표시
    // 지도 부착은 _reclusterInspect가 결정(밀집 핀은 버블로 묶음) — 초기 수백개 일괄 부착/제거 비용 제거
    iOvs.push(ov);iEls.push(el);
  });
  if(mapI)_scaleOvs(iEls,mapI.getLevel(),1);
  // 시설물 클러스터링 (밀집 시 개수 버블로 묶음)
  _iItems=iOvs.map(ov=>({ov,lat:ov._lat,lng:ov._lng}));
  try{_reclusterInspect();}catch(e){}
  // 지도 팝업 이전/다음 순서: 서쪽 끝에서 시작해 가장 가까운 시설로 이어지는 체인(탐방로 연속 이동용)
  try{
    const pts=filtered.filter(f=>f.lat&&f.lng);
    if(pts.length>1){
      let cur=pts.reduce((m,f)=>f.lng<m.lng?f:m,pts[0]);
      const left=new Set(pts.map(f=>f.id)),chain=[];
      while(cur){
        chain.push(String(cur.id));left.delete(cur.id);
        let best=null,bd=Infinity;
        pts.forEach(f=>{if(!left.has(f.id))return;const d=(f.lat-cur.lat)*(f.lat-cur.lat)+(f.lng-cur.lng)*(f.lng-cur.lng);if(d<bd){bd=d;best=f;}});
        cur=best;
      }
      window._facMapOrder=chain;
    }else window._facMapOrder=pts.map(f=>String(f.id));
  }catch(e){window._facMapOrder=[];}
}
// ── 내 주변 시설물: GPS 기준 가까운 순 목록 + 바로 점검 (점검 나갈 때 한 번에) ──
function openNearFacs(){
  const old=document.getElementById('nearFacOv');if(old){old.remove();return;} // 토글
  toast('📍 내 위치 확인 중...');
  if(!navigator.geolocation){toast('⚠️ 이 기기는 위치를 지원하지 않습니다');return;}
  navigator.geolocation.getCurrentPosition(
    p=>_showNearFacs(p.coords.latitude,p.coords.longitude),
    ()=>toast('⚠️ 위치를 가져올 수 없습니다 — GPS 확인'),
    {enableHighAccuracy:true,timeout:10000,maximumAge:30000});
}
function _showNearFacs(la,ln){
  const _meta=DB.g('catFacMeta')||{};const admin=isAdminUser();
  const facs=(DB.g('facilities')||[]).filter(f=>f.lat&&f.lng&&_facVisibleTo(f)&&(admin||!(_meta[f.type]||{}).adminOnly));
  // 최근 점검일 표시용(참고 정보) — '분기 미점검' 판정·정렬은 제거(점검 주기 논란 소지)
  const _lastChk={};(DB.g('facIssues')||[]).forEach(i=>{if(i.facId&&(i.id||0)>(_lastChk[i.facId]||0))_lastChk[i.facId]=i.id||0;});
  let near=facs.map(f=>({f,d:_haversine(la,ln,f.lat,f.lng),chk:_lastChk[f.id]||0})).filter(n=>n.d<=1000); // 반경 1km 이내만
  near.sort((a,b)=>a.d-b.d); // 가까운 순
  near=near.slice(0,15);
  if(!near.length){toast('1km 이내에 등록된 시설물이 없습니다');return;}
  const old=document.getElementById('nearFacOv');if(old)old.remove();
  const ov=document.createElement('div');ov.id='nearFacOv';
  // 하단바(z20) 위로 — facPopup과 동일하게 화면 맨 아래까지 사용
  ov.style.cssText='position:absolute;bottom:0;left:0;right:0;z-index:30;background:#0b1c30;border:1px solid rgba(79,168,208,.2);border-radius:16px 16px 0 0;box-shadow:0 -4px 20px rgba(0,0,0,.7);max-height:56vh;display:flex;flex-direction:column;padding-bottom:calc(8px + env(safe-area-inset-bottom));';
  const rows=near.map(n=>{
    const col=_facTypeColor(n.f.type);
    const cg=_facCurGrade(n.f);
    const dist=n.d<1000?Math.round(n.d)+'m':(n.d/1000).toFixed(1)+'km';
    return `<div style="display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid rgba(255,255,255,.04);">
      <span onclick="_nearFacGo(${n.f.id})" style="width:26px;height:26px;border-radius:50%;background:${col}30;border:1.5px solid ${col};display:inline-flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;cursor:pointer;">${_esc(n.f.type.split(' ')[0])}</span>
      <span onclick="_nearFacGo(${n.f.id})" style="flex:1;min-width:0;cursor:pointer;">
        <span style="display:block;font-size:12px;font-weight:700;color:#dceaf6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_esc(n.f.name)} ${cg?`<span style="color:${_gColor(cg.g)};font-size:10.5px;font-weight:900;">${_esc(cg.g)}</span>`:''}</span>
        <span style="display:block;font-size:9.5px;color:#5d86a3;">${_esc(n.f.type.split(' ').slice(1).join(' ')||'')} · <b style="color:#7fc4e0;">${dist}</b>${n.chk?` · <span style="color:#5fcf8f;">✓ ${new Date(n.chk).toLocaleDateString('ko-KR',{month:'2-digit',day:'2-digit'})} 점검</span>`:''}</span>
      </span>
      <button onclick="document.getElementById('nearFacOv').remove();openFacIssueReport(${n.f.id})" style="flex-shrink:0;padding:6px 11px;border-radius:8px;border:1px solid rgba(79,168,208,.35);background:rgba(79,168,208,.12);color:#4fa8d0;font-size:11px;font-weight:800;cursor:pointer;-webkit-appearance:none;appearance:none;">🔧 점검</button>
    </div>`;
  }).join('');
  ov.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 13px 7px;flex-shrink:0;">
      <span style="font-size:12px;font-weight:800;color:#7fc4e0;">📍 내 주변 시설물 <span style="font-size:9px;color:#46708f;font-weight:600;">1km 이내 ${near.length}개 · 가까운 순</span></span>
      <button onclick="document.getElementById('nearFacOv').remove()" style="background:none;border:none;color:rgba(255,255,255,.45);font-size:18px;cursor:pointer;padding:0 2px;line-height:1;">×</button>
    </div>
    <div style="overflow-y:auto;padding:0 13px 10px;">${rows}</div>`;
  const host=document.querySelector('#v-inspect-map .mapwrap')||document.getElementById('v-inspect-map');
  (host||document.body).appendChild(ov);
}
function _nearFacGo(id){
  const f=(DB.g('facilities')||[]).find(x=>x.id===id);if(!f)return;
  const nv=document.getElementById('nearFacOv');if(nv)nv.remove();
  try{if(mapI&&f.lat){mapI.setLevel(Math.min(mapI.getLevel(),4));mapI.panTo(new kakao.maps.LatLng(f.lat,f.lng));}}catch(e){}
  openFacFromMap(id);
}
// ── 개별 시설 숨김 토글 (권한자만) — 일반 사용자에게 이 시설만 안 보이게 ──
function toggleFacHide(id){
  if(!_canManageFac()){toast('⚠️ 탐방시설과·개발자만 가능');return;}
  const facs=DB.g('facilities')||[];const idx=facs.findIndex(x=>x.id===id);if(idx<0)return;
  facs[idx].hidden=!facs[idx].hidden;
  DB.s('facilities',facs);
  try{renderInspectMap();}catch(e){}try{renderFacList();}catch(e){}
  try{if(typeof _syncRFacPool==='function')_syncRFacPool();}catch(e){}
  try{_refreshFacSurface(id);}catch(e){}
  toast(facs[idx].hidden?'🙈 일반 사용자에게 숨김':'👁️ 다시 표시');
}
// 열려 있는 화면(지도 팝업 또는 상세 모달)만 새로고침 — 지도에서 눌렀는데 모달이 뜨는 것 방지
function _refreshFacSurface(id){
  const fp=document.getElementById('facPopup');
  if(fp&&fp.classList.contains('on')){openFacFromMap(id);return;}
  const md=document.getElementById('modalFacDetail');
  if(md&&md.classList.contains('on'))openFacDetail(id);
}
function setMapFacF(t,v){
  const set=t==='s'?facMapStatusF:t==='t'?facMapTypeF:t==='g'?facMapGradeF:facMapLocF;
  if(set.has(v))set.delete(v);else set.add(v);
  _persistFilters();renderInspectMap();renderFacList();
}
function _smfs(t,v){setMapFacF(t,v);}
// 섹션별 '전체' 칩 — 아무것도 선택 안 됐을 때 켜져 보이고, 누르면 그 섹션 선택 해제(=전체 표시)
function _smfsAll(t){
  const set=t==='s'?facMapStatusF:t==='t'?facMapTypeF:t==='g'?facMapGradeF:facMapLocF;
  set.clear();_persistFilters();renderInspectMap();renderFacList();
}
function _srfAll(k){
  if(k==='t')resTypeF=new Set();else resStatusF=new Set();
  _persistFilters();_updateResFilterPanels();renderRescueMap();renderResList();
}
function _filterAllChip(set,onclick){
  const on=set.size===0;
  const c=on?'#7ec8a0':'rgba(255,255,255,.5)';
  return `<span onclick="${onclick}" style="display:inline-block;margin:2px 2px;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:700;cursor:pointer;border:1.5px solid ${on?c:'rgba(255,255,255,.12)'};color:${on?c:'rgba(255,255,255,.35)'};background:${on?c+'22':'transparent'};">${on?'✓ ':''}전체</span>`;
}
// 필터 패널 공용 헬퍼 (시설물지도/시설물목록/구조필터 3곳에서 동일 템플릿 사용)
function _filterChip(label,set,val,onclick,col){
  const on=set.has(val);
  const c=col||(on?'#4fa8d0':'rgba(255,255,255,.5)');
  return `<span onclick="${onclick}" style="display:inline-block;margin:2px 2px;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:600;cursor:pointer;border:1.5px solid ${on?c:'rgba(255,255,255,.12)'};color:${on?c:'rgba(255,255,255,.35)'};background:${on?c+'22':'transparent'};">${label}</span>`;
}
function _filterSec(id,title,html,set,extraCnt){
  const el=document.getElementById(id);if(!el)return;
  const cnt=(set?set.size:0)+(extraCnt||0),open=window._fpSec&&window._fpSec[id];
  el.innerHTML=`
    <div onclick="_toggleFPSec('${id}')"
      style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;user-select:none;">
      <span style="font-size:11px;font-weight:700;color:#9bbdd4;">${title}${cnt?` <span style="color:#e05050;font-size:10px;">(${cnt})</span>`:''}</span>
      <b style="font-size:13px;color:#3a6a8a;font-weight:400;">${open?'⌄':'›'}</b>
    </div>
    <div style="display:${open?'block':'none'};padding:4px 0 2px;">${html}</div>`;
}
function _updateInspFilterPanel(types,locs){
  _filterSec('inspFP_status','경고표시',
    _filterChip('⚠️ 경고표시만',facMapStatusF,'warn',`_smfs('s','warn')`,'#e05050'),facMapStatusF);
  _filterSec('inspFP_grade','안전등급',
    _filterAllChip(facMapGradeF,`_smfsAll('g')`)+['A','B','C','D','E'].map(g=>_filterChip(g+' '+_gLabel(g),facMapGradeF,g,`_smfs('g','${g}')`,_gColor(g))).join(''),facMapGradeF);
  _filterSec('inspFP_type','종류',
    _filterAllChip(facMapTypeF,`_smfsAll('t')`)+types.filter(t=>t!=='전체').map(v=>_filterChip(v,facMapTypeF,v,`_smfs('t','${v.replace(/'/g,"\\'")}')`,'#4fa8d0')).join(''),facMapTypeF);
  _filterSec('inspFP_loc','위치 (구간)',
    _filterAllChip(facMapLocF,`_smfsAll('l')`)+locs.filter(v=>v!=='전체').map(v=>_filterChip(_zoneLbl(v),facMapLocF,v,`_smfs('l','${v.replace(/'/g,"\\'")}')`,'#9b59b6')).join(''),facMapLocF);
  // 배지/카운트 업데이트
  const total=facMapStatusF.size+facMapTypeF.size+facMapLocF.size;
  ['inspFilterBadge','facListFilterBadge'].forEach(id=>{const el=document.getElementById(id);if(!el)return;el.style.display=total?'inline-flex':'none';if(total)el.textContent=total;});
  ['inspFilterCount','facListFilterCount'].forEach(id=>{const el=document.getElementById(id);if(!el)return;el.textContent=total?`(${total})`:'';});
}
function _toggleFPSec(id){
  if(!window._fpSec)window._fpSec={};
  window._fpSec[id]=!window._fpSec[id];
  const el=document.getElementById(id);if(!el)return;
  const body=el.children[1],arrow=el.querySelector('b');
  if(body)body.style.display=window._fpSec[id]?'block':'none';
  if(arrow)arrow.textContent=window._fpSec[id]?'⌄':'›';
}
function _initFPDrag(hId,pId,closeFn){
  const h=document.getElementById(hId),p=document.getElementById(pId);
  if(!h||!p||h._fpBound)return;h._fpBound=true;
  let y0=0,t0=0;
  const mv=e=>{const y=(e.touches?e.touches[0]:e).clientY;p.style.transform=`translateY(${Math.max(0,y-y0)}px)`;};
  const up=e=>{
    const y=(e.changedTouches?e.changedTouches[0]:e).clientY;
    const dist=y-y0,dt=Date.now()-t0,vel=dt>0?dist/dt:0;
    p.style.transition='transform .22s cubic-bezier(.4,0,.2,1)';
    // 둔감하던 닫기 개선: 임계 60→40px, 또는 아래로 빠르게 튕기면(속도) 바로 닫힘
    if(dist>40||(dist>12&&vel>0.4))closeFn();else p.style.transform='translateY(0)';
    document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);
  };
  h.addEventListener('touchstart',e=>{y0=e.touches[0].clientY;t0=Date.now();p.style.transition='none';},{passive:true});
  h.addEventListener('touchmove',mv,{passive:true});
  h.addEventListener('touchend',up);
  h.addEventListener('mousedown',e=>{y0=e.clientY;t0=Date.now();p.style.transition='none';document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);e.preventDefault();});
}
function toggleInspFilter(){
  const p=document.getElementById('inspFilterPanel');
  const open=p.style.display==='flex';
  if(open){closeInspFilter();}
  else{p.style.display='flex';p.style.transform='translateY(0)';_initFPDrag('inspFPHandle','inspFilterPanel',closeInspFilter);}
}
function closeInspFilter(){
  const p=document.getElementById('inspFilterPanel');
  p.style.transform='translateY(100%)';
  setTimeout(()=>{p.style.display='none';p.style.transform='translateY(0)';},220);
}
function resetInspFilter(){
  facMapStatusF=new Set();facMapTypeF=new Set();facMapLocF=new Set();facMapGradeF=new Set();
  renderInspectMap();renderFacList();
}
// ─── 시설물 목록 필터 ───
function toggleFacListFilter(){
  const p=document.getElementById('facListFilterPanel');
  const open=p.style.display==='flex';
  if(open){_closeFacListFilter();}
  else{p.style.display='flex';p.style.transform='translateY(0)';_updateFacListFilterPanel();_initFPDrag('facLFPHandle','facListFilterPanel',_closeFacListFilter);}
}
function _closeFacListFilter(){
  const p=document.getElementById('facListFilterPanel');
  p.style.transform='translateY(100%)';
  setTimeout(()=>{p.style.display='none';p.style.transform='translateY(0)';},220);
}
function resetFacListFilter(){
  facMapStatusF=new Set();facMapTypeF=new Set();facMapLocF=new Set();facMapGradeF=new Set();facListSort='default';
  _persistFilters();renderInspectMap();renderFacList();
}
function _updateFacListFilterPanel(types,locs){
  if(!types||!locs){
    const _a=isAdminUser();const _m2=DB.g('catFacMeta')||{};
    const _f=(DB.g('facilities')||[]).filter(f=>_a||!(_m2[f.type]||{}).adminOnly);
    types=types||[...(new Set(_f.map(f=>f.type.split(' ').slice(1).join(' ')||f.type).filter(Boolean)))];
    const _sf2=(DB.g('facilities')||[]).filter(f=>f.type&&f.type.includes('다목적위치표지판'));
    locs=locs||[...new Set(_sf2.map(f=>(f.name.match(/\d+/)||[''])[0]).filter(Boolean))].sort();
  }
  {const _se=document.getElementById('facLFP_sort');if(_se)_se.innerHTML='';} // 점검 정렬 제거
  _filterSec('facLFP_status','경고표시',_filterChip('⚠️ 경고표시만',facMapStatusF,'warn',`_smfs('s','warn');renderFacList();`,'#e05050'),facMapStatusF);
  _filterSec('facLFP_grade','안전등급',_filterAllChip(facMapGradeF,`_smfsAll('g')`)+['A','B','C','D','E'].map(g=>_filterChip(g+' '+_gLabel(g),facMapGradeF,g,`_smfs('g','${g}');renderFacList();`,_gColor(g))).join(''),facMapGradeF);
  _filterSec('facLFP_type','종류',_filterAllChip(facMapTypeF,`_smfsAll('t')`)+(types||[]).map(v=>_filterChip(v,facMapTypeF,v,`_smfs('t','${v.replace(/'/g,"\\'")}');renderFacList();`,'#4fa8d0')).join(''),facMapTypeF);
  _filterSec('facLFP_loc','위치 (구간)',_filterAllChip(facMapLocF,`_smfsAll('l')`)+(locs||[]).map(v=>_filterChip(_zoneLbl(v),facMapLocF,v,`_smfs('l','${v.replace(/'/g,"\\'")}');renderFacList();`,'#9b59b6')).join(''),facMapLocF);
  const total=facMapStatusF.size+facMapTypeF.size+facMapLocF.size;
  ['facListFilterBadge'].forEach(id=>{const el=document.getElementById(id);if(!el)return;el.style.display=total?'inline-flex':'none';if(total)el.textContent=total;});
  const fc=document.getElementById('facListFilterCount');if(fc)fc.textContent=total?`(${total})`:'';
}
// ─── 재난/구조 필터 ───
function _updateResFilterPanels(){
  const dateActive=(resDateFrom||resDateTo)?1:0;
  // 지도 배지=전체 필터 수 / 목록 배지=날짜만 (목록은 상태·종류 필터를 적용하지 않음 — 항상 진행중+종료 표시)
  const totalMap=resTypeF.size+resStatusF.size+dateActive;
  {const el=document.getElementById('resMapFilterBadge');if(el){el.style.display=totalMap?'inline-flex':'none';if(totalMap)el.textContent=totalMap;}}
  {const el=document.getElementById('resMapFilterCount');if(el)el.textContent=totalMap?`(${totalMap})`:'';}
  {const el=document.getElementById('resListFilterBadge');if(el){el.style.display=dateActive?'inline-flex':'none';if(dateActive)el.textContent=dateActive;}}
  {const el=document.getElementById('resListFilterCount');if(el)el.textContent=dateActive?`(${dateActive})`:'';}
  const inpSt='background:#0a1828;color:#4fa8d0;border:1px solid rgba(79,168,208,.3);border-radius:6px;padding:5px 6px;font-size:11px;width:100%;box-sizing:border-box;';
  const dateHtml=`<div style="display:flex;gap:6px;align-items:center;margin-top:4px;">
    <input type="date" value="${resDateFrom}" style="${inpSt}" onchange="setResDate('from',this.value)">
    <span style="color:rgba(255,255,255,.3);font-size:11px;flex-shrink:0;">~</span>
    <input type="date" value="${resDateTo}" style="${inpSt}" onchange="setResDate('to',this.value)">
  </div>`;
  const typeHtml=_filterAllChip(resTypeF,`_srfAll('t')`)+[{v:'🚨구조',l:'🚨 구조보고'},{v:'⚠️위험상황',l:'⚠️ 위험상황'}].map(({v,l})=>_filterChip(l,resTypeF,v,`setResTypeF('${v}')`)).join('');
  const stHtml=_filterAllChip(resStatusF,`_srfAll('s')`)+[{v:'진행중',l:'🔴 진행중/미조치'},{v:'종료',l:'✅ 종료/완료'}].map(({v,l})=>_filterChip(l,resStatusF,v,`setResStatusF('${v}')`)).join('');
  ['resMFP_date','resLFP_date'].forEach(id=>_filterSec(id,'📅 날짜',dateHtml,null,dateActive));
  _filterSec('resMFP_type','종류',typeHtml,resTypeF);
  _filterSec('resMFP_status','상태',stHtml,resStatusF);
  // 목록 패널에서는 종류·상태 섹션 제거 — 목록은 항상 진행중+종료 전부 표시(지도만 필터)
  ['resLFP_type','resLFP_status'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='';});
  _syncOngoingBtn();
}
// 지도 '🔴 진행중' 토글 — 현재 사고만 보기 (상태 필터를 진행중 단독으로)
function toggleOngoingOnly(){
  const on=resStatusF.size===1&&resStatusF.has('진행중');
  resStatusF=on?new Set():new Set(['진행중']);
  _persistFilters();_updateResFilterPanels();renderRescueMap();renderResList();
}
function _syncOngoingBtn(){
  const b=document.getElementById('resOngoingBtn');if(!b)return;
  const on=resStatusF.size===1&&resStatusF.has('진행중');
  b.style.background=on?'rgba(231,76,60,.92)':'rgba(11,28,48,.85)';
  b.style.color=on?'#fff':'#ff8a73';
  b.style.borderColor=on?'#ff5a45':'rgba(231,76,60,.5)';
}
function setResDate(which,v){
  if(which==='from')resDateFrom=v;else resDateTo=v;
  _maybeLoadArchiveForDateFilter();
  _updateResFilterPanels();renderRescueMap();renderResList();
}
// 조회 시작일이 보관 기준(1년)보다 앞이면 과거 기록을 1회 불러온 뒤 다시 그린다
function _maybeLoadArchiveForDateFilter(){
  if(!resDateFrom)return;
  const cutoff=new Date(Date.now()-_ARCHIVE_CUTOFF_DAYS*86400000).toISOString().slice(0,10);
  if(resDateFrom>=cutoff)return;
  Promise.all(['rescues','hazards'].map(_loadArchive)).then(()=>{renderRescueMap();renderResList();});
}
function setResTypeF(v){if(resTypeF.has(v))resTypeF.delete(v);else resTypeF.add(v);_persistFilters();_updateResFilterPanels();renderRescueMap();renderResList();}
function setResStatusF(v){if(resStatusF.has(v))resStatusF.delete(v);else resStatusF.add(v);_persistFilters();_updateResFilterPanels();renderRescueMap();renderResList();}
function resetResFilter(){resTypeF=new Set();resStatusF=new Set();const _d=_resDefaultDates();resDateFrom=_d.from;resDateTo=_d.to;_persistFilters();_updateResFilterPanels();renderRescueMap();renderResList();}
// 시설물 카테고리 필터
function _updateResCatFilterPanel(){
  const _rm=DB.g('catFacMeta')||{};
  const rescueCats=(DB.g('catFac')||[]).filter(c=>(_rm[c]||{}).rescue);
  const defSet=new Set(_RES_DEFAULT_CATS);
  const catBadge=resFacCatH.size+resFacCatF.size;
  const el=document.getElementById('resCatFilterBadge');
  if(el){el.style.display=catBadge?'inline-flex':'none';if(catBadge)el.textContent=catBadge;}
  const cntEl=document.getElementById('resCatFilterCount');
  if(cntEl)cntEl.textContent=catBadge?`(${catBadge})`:'';
  const mkRow=(c,isDefault)=>{
    const active=isDefault?!resFacCatH.has(c):resFacCatF.has(c);
    const col=active?'#4fa8d0':'rgba(255,255,255,.25)';
    return `<div onclick="toggleResFacCat('${c.replace(/'/g,"\\'")}',${isDefault})" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;">
      <div style="width:22px;height:22px;border-radius:50%;border:2px solid ${col};display:flex;align-items:center;justify-content:center;font-size:10px;color:${col};flex-shrink:0;">${active?'✓':''}</div>
      <span style="font-size:12px;color:${active?'#e0edf8':'rgba(255,255,255,.35)'};">${c}</span>
      ${isDefault?'<span style="font-size:9px;color:#3a6a8a;margin-left:auto;">기본</span>':''}
    </div>`;
  };
  const defCats=rescueCats.filter(c=>defSet.has(c));
  const otherCats=rescueCats.filter(c=>!defSet.has(c));
  const wrap=document.getElementById('resCFPContent');
  if(!wrap)return;
  wrap.innerHTML=(defCats.length?`<div style="font-size:10px;color:#3a6a8a;padding:6px 0 2px;font-weight:600;">기본 표시</div>${defCats.map(c=>mkRow(c,true)).join('')}`:'')
    +(otherCats.length?`<div style="font-size:10px;color:#3a6a8a;padding:8px 0 2px;font-weight:600;">추가 표시 (기본 OFF)</div>${otherCats.map(c=>mkRow(c,false)).join('')}`:'')
    +(rescueCats.length===0?'<div style="font-size:12px;color:rgba(255,255,255,.2);padding:12px 0;">재난지도 표시 카테고리 없음</div>':'');
}
function toggleResFacCat(type,isDefault){
  if(isDefault){if(resFacCatH.has(type))resFacCatH.delete(type);else resFacCatH.add(type);}
  else{if(resFacCatF.has(type))resFacCatF.delete(type);else resFacCatF.add(type);}
  _updateResCatFilterPanel();_applyRFacFilter();
}
function resetResCatFilter(){resFacCatH=new Set();resFacCatF=new Set();_updateResCatFilterPanel();_applyRFacFilter();}
function toggleResCatFilter(){
  const p=document.getElementById('resCatFilterPanel');
  const open=p.style.display==='flex';
  if(open){_closeResCatFilter();}
  else{p.style.display='flex';p.style.transform='translateY(0)';_updateResCatFilterPanel();_initFPDrag('resCFPHandle','resCatFilterPanel',_closeResCatFilter);}
}
function _closeResCatFilter(){
  const p=document.getElementById('resCatFilterPanel');
  p.style.transform='translateY(100%)';
  setTimeout(()=>{p.style.display='none';p.style.transform='translateY(0)';},220);
}
function toggleResMapFilter(){
  const p=document.getElementById('resMapFilterPanel');
  const open=p.style.display==='flex';
  if(open){_closeResMapFilter();}
  else{p.style.display='flex';p.style.transform='translateY(0)';_updateResFilterPanels();_initFPDrag('resMFPHandle','resMapFilterPanel',_closeResMapFilter);}
}
function _closeResMapFilter(){
  const p=document.getElementById('resMapFilterPanel');
  p.style.transform='translateY(100%)';
  setTimeout(()=>{p.style.display='none';p.style.transform='translateY(0)';},220);
}
function toggleResListFilter(){
  const p=document.getElementById('resListFilterPanel');
  const open=p.style.display==='flex';
  if(open){_closeResListFilter();}
  else{p.style.display='flex';p.style.transform='translateY(0)';_updateResFilterPanels();_initFPDrag('resLFPHandle','resListFilterPanel',_closeResListFilter);}
}
function _closeResListFilter(){
  const p=document.getElementById('resListFilterPanel');
  p.style.transform='translateY(100%)';
  setTimeout(()=>{p.style.display='none';p.style.transform='translateY(0)';},220);
}
// ── 시설물 종류별 고정 색 (핀·목록·팝업 공통 — 종류를 색으로 즉시 구분) ──
const FAC_TYPE_COLORS={'다목적위치표지판':'#5a7e98','교량':'#4fa8d0','데크/계단':'#e67e22','안전난간':'#46ad5f','대피소':'#7ec8a0','탐방지원센터':'#f0c060','사찰':'#c8845a','건축물':'#d4699b','목재계단':'#a5912c','계곡시설':'#2fa3c4','장소':'#b055c9'};
function _facTypeColor(t){
  const label=(String(t||'').split(' ').slice(1).join(' ')||t||'').trim();
  if(FAC_TYPE_COLORS[label])return FAC_TYPE_COLORS[label];
  let h=0;for(let i=0;i<label.length;i++)h=(h*31+label.charCodeAt(i))>>>0; // 사용자 정의 종류도 항상 같은 색
  return ['#4fa8d0','#e67e22','#b055c9','#46ad5f','#f0c060','#2fa3c4','#d4699b','#a5912c'][h%8];
}
// ── 시설물 현재 안전등급: 최신 점검(조치후>재평가>점검) 등급 우선, 없으면 시설물 자체 등급(관리대장) ──
function _facCurGrade(f){
  let g='',at=0,src='';
  (DB.g('facIssues')||[]).forEach(i=>{
    if(i.facId!==f.id)return;
    [i.dept&&i.dept.grade&&{g:i.dept.grade,at:i.dept.at||i.id||0,src:'조치후'},
     i.mgr&&i.mgr.grade&&{g:i.mgr.grade,at:i.mgr.at||i.id||0,src:'재평가'},
     i.grade&&{g:i.grade,at:i.id||0,src:'점검'}].forEach(c=>{if(c&&c.at>=at){at=c.at;g=c.g;src=c.src;}});
  });
  if(g)return{g,src};
  if(f.grade)return{g:f.grade,src:f.gradeBy||'관리대장'};
  return null;
}
function _facGradeBadge(f){
  const cg=_facCurGrade(f);if(!cg)return'';
  const c=_gColor(cg.g);
  return `<span style="display:inline-flex;align-items:center;background:${c}22;border:1.5px solid ${c};color:${c};border-radius:7px;padding:1px 8px;font-size:11px;font-weight:900;vertical-align:middle;">${_esc(cg.g)}</span>`;
}
// 사진 전체 보기 (탭하면 크게)
function _facPhotoView(url){
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;z-index:99000;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;cursor:pointer;';
  ov.innerHTML=`<img src="${_esc(url)}" style="max-width:100%;max-height:92%;object-fit:contain;">`;
  ov.onclick=()=>ov.remove();
  document.body.appendChild(ov);
}
// 관리 액션 소형 버튼 (한 줄 · 화면 안 가리게)
const _mBtnS=c=>`flex:1;padding:6px 2px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:${c};font-size:10px;font-weight:700;cursor:pointer;-webkit-appearance:none;appearance:none;`;
// ── 시설물 정보 공용 빌더 (지도 팝업 · 목록 상세 동일 내용) ──
function _facInfoHtml(f){
  const w=_facWarn(f);
  const col=_facTypeColor(f.type);
  // 짧은 정보(우측 열): 사진 옆에 나란히 — 세로 공간 절약
  const sRow=(k,v)=>v?`<div style="display:flex;gap:6px;padding:2px 0;"><span style="width:46px;flex-shrink:0;font-size:10px;color:#5d86a3;font-weight:700;">${k}</span><span style="flex:1;min-width:0;font-size:11px;color:#c9dcec;line-height:1.45;word-break:break-all;">${v}</span></div>`:'';
  const shortRows=[
    sRow('종류',`<span style="color:${col};font-weight:700;">${_esc(f.type)}</span>`),
    sRow('위치',_esc(_facZoneLbl(f)||'')),
    sRow('지점',_esc(_facSignDesc(f))),
    sRow('관리번호',f.mgmt?`<span style="font-family:monospace;font-size:10.5px;letter-spacing:.2px;">${_esc(f.mgmt)}</span>`:''),
    sRow('좌표',f.lat?`<span style="font-family:monospace;font-size:10.5px;">${f.lat.toFixed(5)}, ${f.lng.toFixed(5)}</span>`:''),
    sRow('설치',_esc(f.install||'')),
    sRow('등록',_esc(f.author||''))
  ].join('');
  // 긴 정보(하단 전폭)
  const rows=[];
  const row=(k,v)=>{if(v)rows.push(`<div style="display:flex;gap:8px;padding:2.5px 0;"><span style="min-width:50px;flex-shrink:0;font-size:10.5px;color:#5d86a3;font-weight:700;">${k}</span><span style="flex:1;font-size:11.5px;color:#c9dcec;line-height:1.5;word-break:break-all;">${v}</span></div>`);};
  row('규격',_esc(f.spec||''));
  row('구조',_esc(f.struct||''));
  row('비고',_esc(f.note||''));
  const iss=(DB.g('facIssues')||[]).filter(i=>i.facId===f.id).sort((a,b)=>(b.id||0)-(a.id||0)).slice(0,2);
  const issHtml=iss.map(i=>`<div onclick="event.stopPropagation();openFacIssueDetail(${i.id})" style="display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.03);border-radius:8px;padding:6px 9px;margin-top:5px;cursor:pointer;">
      <span style="background:${_gColor(i.grade)}26;color:${_gColor(i.grade)};font-weight:900;border-radius:6px;padding:1px 7px;font-size:11px;flex-shrink:0;">${_esc(i.grade||'-')}</span>
      <span style="flex:1;font-size:10.5px;color:#9fc0da;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_esc(i.desc||(i.tags&&i.tags.join(', '))||'점검')}</span>
      <span style="font-size:9px;color:#5a7e98;flex-shrink:0;">${i.id?new Date(i.id).toLocaleDateString('ko-KR',{month:'2-digit',day:'2-digit'}):''}</span>
    </div>`).join('');
  return `
    ${w?`<div style="background:rgba(224,80,80,.1);border:1px solid rgba(224,80,80,.4);border-radius:9px;padding:7px 10px;margin-bottom:8px;font-size:11px;color:#ffb0a5;line-height:1.6;"><b style="color:#ff5a45;">⚠️ 경고표시</b>${w.reason?' — '+_esc(w.reason):''} <span style="color:#c98;font-size:10px;">${_esc(_warnPeriodStr(w))}</span></div>`:''}
    <div style="display:flex;gap:9px;margin-bottom:${rows.length||issHtml?'8px':'0'};align-items:stretch;">
      ${f.photo?`<img src="${_esc(f.photo)}" loading="lazy" onclick="_facPhotoView('${_escq(f.photo)}')" style="width:42%;max-width:150px;aspect-ratio:4/3;object-fit:cover;border-radius:10px;cursor:pointer;flex-shrink:0;align-self:center;display:block;" alt="">`:''}
      <div style="flex:1;min-width:0;background:#060d1a;border-radius:10px;padding:7px 9px;display:flex;flex-direction:column;justify-content:center;">${shortRows}</div>
    </div>
    ${rows.length?`<div style="background:#060d1a;border-radius:10px;padding:7px 11px;">${rows.join('')}</div>`:''}
    ${issHtml?`<div style="font-size:10px;color:#5d86a3;font-weight:800;margin-top:8px;">🔧 최근 점검</div>${issHtml}`:''}`;
}
// 선택된 시설 핀 강조 — 팝업이 어떤 핀을 가리키는지 물결 링으로 표시
function _facPinHighlight(id){try{iEls.forEach(el=>{if(el&&el.classList)el.classList.toggle('mpin-sel',el._facId===id);});}catch(e){}}
function _facPinUnhighlight(){try{iEls.forEach(el=>{if(el&&el.classList)el.classList.remove('mpin-sel');});}catch(e){}}
function openFacFromMap(id){
  const f=(DB.g('facilities')||[]).find(x=>x.id===id);if(!f)return;
  selFacId=id;window._selFacDetailId=id;
  _facPinHighlight(id);
  const col=_facTypeColor(f.type);
  document.getElementById('facPopTitle').innerHTML=
    `<span style="display:inline-flex;align-items:center;gap:7px;flex-wrap:wrap;"><span style="width:25px;height:25px;border-radius:50%;background:${col}33;border:2px solid ${col};display:inline-flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">${_esc(f.type.split(' ')[0])}</span><span>${_esc(_facDispName(f))}</span>${_facGradeBadge(f)}${f.hidden?'<span style="font-size:9px;color:#8a6d3b;">🙈 숨김중</span>':''}</span>`;
  document.getElementById('facPopMeta').innerHTML=_facInfoHtml(f);
  const _bw=document.getElementById('facPopBtns');
  const mng=_canManageFac();
  // 이전/다음: 탐방로 연속 체인(가까운 시설 순) — 누르면 지도가 그 시설로 이동
  const _ord=window._facMapOrder||[];const _oi=_ord.indexOf(String(id));
  const _pv=_oi>0?_ord[_oi-1]:'',_nx=(_oi>=0&&_oi<_ord.length-1)?_ord[_oi+1]:'';
  const _navRow=(_ord.length>1&&_oi>=0)?`<div style="display:flex;align-items:center;gap:8px;">
      <button class="navbtn" ${_pv?`onclick="_facMapNav(${_pv})"`:'disabled'} style="padding:7px 4px;font-size:11.5px;">◀ 이전</button>
      <span style="font-size:10px;color:#5d86a3;font-weight:800;white-space:nowrap;">${_oi+1} / ${_ord.length}</span>
      <button class="navbtn" ${_nx?`onclick="_facMapNav(${_nx})"`:'disabled'} style="padding:7px 4px;font-size:11.5px;">다음 ▶</button>
    </div>`:'';
  if(_bw)_bw.innerHTML=_navRow
    +`<button class="btn" style="width:100%;padding:11px;background:rgba(79,168,208,.16);color:#4fa8d0;border:1px solid rgba(79,168,208,.4);font-weight:800;" onclick="openFacIssueReport(${f.id})">🔧 점검 등록</button>`
    +(mng?`<div style="display:flex;gap:5px;">
      <button onclick="openFacWarn(${f.id})" style="${_mBtnS('#f0a500')}">⚠️ 경고</button>
      <button onclick="toggleFacHide(${f.id})" style="${_mBtnS(f.hidden?'#f0a500':'#8aa6bc')}">${f.hidden?'👁️ 표시':'🙈 숨김'}</button>
      <button onclick="openEditFac(${f.id})" style="${_mBtnS('#8aa6bc')}">✏️ 수정</button>
      <button onclick="deleteFac(${f.id})" style="${_mBtnS('#ff8a73')}">🗑 삭제</button>
    </div>`:'');
  document.getElementById('resPopup').classList.remove('on');
  document.getElementById('facPopup').classList.add('on');
  _panPinAbovePopup(f.lat,f.lng); // 핀이 팝업에 가리지 않게 화면 위쪽으로
}
// 이전/다음으로 인접 시설 이동 — 지도도 함께 이동
function _facMapNav(id){
  const f=(DB.g('facilities')||[]).find(x=>x.id===id);if(!f)return;
  openFacFromMap(id);
}
// 열린 팝업(하단 시트)이 핀을 가리지 않도록 — 팝업 실제 높이를 재서 '팝업 위 남는 지도 영역'의 가운데로 팬
function _panPinAbovePopup(lat,lng){
  try{
    if(!mapI||!lat||!lng)return;
    const host=document.getElementById('v-inspect-map');
    if(!host||!host.classList.contains('on'))return;
    setTimeout(function(){
      try{
        const proj=mapI.getProjection();
        const pt=proj.containerPointFromCoords(new kakao.maps.LatLng(lat,lng));
        const w=host.clientWidth||window.innerWidth,h=host.clientHeight||window.innerHeight;
        const pop=document.getElementById('facPopup');
        const ph=(pop&&pop.classList.contains('on'))?pop.offsetHeight:0;
        const vis=Math.max(120,h-ph);
        const targetY=Math.max(50,vis*0.45);
        const dx=pt.x-w/2,dy=pt.y-targetY;
        if(Math.abs(dx)>40||Math.abs(dy)>40){
          const c=proj.containerPointFromCoords(mapI.getCenter());
          mapI.panTo(proj.coordsFromContainerPoint(new kakao.maps.Point(c.x+dx,c.y+dy)));
        }
      }catch(e){}
    },60);
  }catch(e){}
}
let _facListLimit=50,_facListSig='';
function _moreFacList(){_facListLimit+=50;renderFacList();}
function renderFacList(){
  _facMigrateV2();
  const _admin=isAdminUser();const _meta=DB.g('catFacMeta')||{};
  const facs=(DB.g('facilities')||[]).filter(f=>_admin||!(_meta[f.type]||{}).adminOnly);
  const types=[...new Set(facs.map(f=>f.type.split(' ').slice(1).join(' ')||f.type).filter(Boolean))];
  const _sf=(DB.g('facilities')||[]).filter(f=>f.type&&f.type.includes('다목적위치표지판'));
  const locs=[...new Set(_sf.map(f=>(f.name.match(/\d+/)||[''])[0]).filter(Boolean))].sort();
  _updateFacListFilterPanel(types,locs);
  const filtered=facs.filter(f=>{
    if(!_facVisibleTo(f))return false;
    const sOk=facMapStatusF.size===0||(facMapStatusF.has('warn')&&!!_facWarn(f));
    const tOk=facMapTypeF.size===0||[...facMapTypeF].some(t=>f.type.includes(t));
    const lOk=facMapLocF.size===0||[...facMapLocF].some(v=>_facInZone(f,v));
    const _cg=facMapGradeF.size?_facCurGrade(f):null;
    const gOk=facMapGradeF.size===0||(_cg&&facMapGradeF.has(_cg.g));
    return sOk&&tOk&&lOk&&gOk;
  });
  // 경고표시 활성 우선 정렬
  filtered.sort((a,b)=>(_facWarn(b)?1:0)-(_facWarn(a)?1:0));
  _navOrder.fac=filtered.map(f=>String(f.id)); // 상세 이전/다음 순서 = 목록(필터·정렬) 순서
  // 필터가 바뀌면 페이지 한도 리셋
  const _sig=[...facMapStatusF].join()+'|'+[...facMapTypeF].join()+'|'+[...facMapLocF].join();
  if(_sig!==_facListSig){_facListSig=_sig;_facListLimit=50;}
  const _tot=filtered.length;
  let html=filtered.slice(0,_facListLimit).map(f=>{
    const w=_facWarn(f);
    const col=w?'#e05050':_facTypeColor(f.type);
    const cg=_facCurGrade(f);
    return `<div class="lcard" style="padding:7px 10px;border-left:3px solid ${col};" onclick="openFacDetail(${f.id})">
      <div class="lico" style="width:30px;height:30px;font-size:14px;border-color:${col};color:${col};background:${col}1e;">${_esc(f.type.split(' ')[0])}</div>
      <div class="linfo"><div class="lname" style="font-size:12px;">${_esc(_facDispName(f))}${f.hidden?' <span style="font-size:9px;color:#8a6d3b;">🙈 숨김</span>':''}</div>
        <div class="lmeta">${_esc(f.type.split(' ').slice(1).join(' ')||f.type)} · ${_esc(_facZoneLbl(f)||'-')} · ${f.lat?'📍':''}</div>
        ${w&&w.reason?`<span style="font-size:9px;color:#e05050;margin-top:2px;display:block;">⚠️ ${_esc(w.reason)}</span>`:''}
      </div>
      ${cg?`<span class="lbadge" style="background:${_gColor(cg.g)}22;color:${_gColor(cg.g)};font-weight:900;">${_esc(cg.g)}</span>`:''}
      ${w?`<span class="lbadge" style="background:#e0505022;color:#e05050;">⚠️ 경고</span>`:''}
    </div>`;
  }).join('');
  if(_tot>_facListLimit){
    html+=`<button onclick="_moreFacList()" style="width:100%;margin-top:8px;padding:11px;border-radius:10px;border:1px solid rgba(79,168,208,.3);background:rgba(79,168,208,.08);color:#4fa8d0;font-size:13px;font-weight:700;cursor:pointer;">▾ 더 보기 (${_tot-_facListLimit}건 더)</button>`;
  }
  document.getElementById('facListWrap').innerHTML=html||'<div class="empty"><div class="empty-ico">🛠️</div><div class="empty-txt">해당 조건 없음</div><button onclick="resetFacListFilter()" style="margin-top:10px;padding:7px 16px;background:rgba(79,168,208,.12);border:1px solid rgba(79,168,208,.35);color:#4fa8d0;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">🔄 필터 초기화</button></div>';
}

function renderInspectStats(){
  _facMigrateV2();
  const facs=DB.g('facilities')||[];
  const warned=facs.filter(f=>_facWarn(f));
  const noGps=facs.filter(f=>!f.lat||!f.lng).length;
  const se=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  se('fs-tot',facs.length);se('fs-warn',warned.length);se('fs-nogps',noGps);
  // 안전등급 분포 (현재 등급 = 최신 점검>관리대장)
  {
    const gw=document.getElementById('facGradeStatWrap');
    if(gw){
      const gc={A:0,B:0,C:0,D:0,E:0};let none=0;
      facs.forEach(f=>{const cg=_facCurGrade(f);if(cg&&gc[cg.g]!==undefined)gc[cg.g]++;else none++;});
      const gmax=Math.max(...Object.values(gc),1);
      gw.innerHTML=['A','B','C','D','E'].map(g=>{
        const v=gc[g],c=_gColor(g);
        return `<div onclick="facMapGradeF=new Set(['${g}']);_persistFilters();switchTab(2,document.getElementById('nv2'));" style="display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer;">
          <span style="min-width:70px;font-size:11px;color:${c};font-weight:800;">${g} ${_gLabel(g)}</span>
          <div style="flex:1;height:8px;background:rgba(255,255,255,.05);border-radius:4px;overflow:hidden;"><div style="height:100%;width:${v?Math.max(3,Math.round(v/gmax*100)):0}%;background:${c};border-radius:4px;"></div></div>
          <span style="font-size:11px;color:#e0edf8;font-weight:800;min-width:34px;text-align:right;">${v}개</span>
        </div>`;
      }).join('')+(none?`<div style="font-size:9.5px;color:#46708f;margin-top:4px;">등급 미지정 ${none}개 (다목적위치표지판 등)</div>`:'');
    }
  }
  const tm={};facs.forEach(f=>{tm[f.type]=(tm[f.type]||0)+1;});
  {// 종류별 분포 — 안전등급 분포와 같은 색 막대 스타일. 탭하면 그 종류만 지도에서 필터
    const rows=Object.entries(tm).sort((a,b)=>b[1]-a[1]);
    const tmax=Math.max(...rows.map(r=>r[1]),1);
    const PAL=['#4fa8d0','#5fcf8f','#f0c050','#e8879c','#b08ae8','#f0965a','#7dd3fa','#9fb6c8'];
    document.getElementById('facTypeStatWrap').innerHTML=rows.map(([k,v],i)=>{
      const c=PAL[i%PAL.length];const lbl=k.split(' ').slice(1).join(' ')||k;
      return `<div class="type-row" onclick="facMapTypeF=new Set(['${_escq(lbl)}']);_persistFilters();switchTab(2,document.getElementById('nv2'));">
        <span class="t-ico">${_esc(k.split(' ')[0])}</span><span class="t-lbl" style="flex:none;width:104px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_esc(lbl)}</span>
        <div style="flex:1;height:8px;background:rgba(255,255,255,.05);border-radius:4px;overflow:hidden;"><div style="height:100%;width:${Math.max(4,Math.round(v/tmax*100))}%;background:${c};border-radius:4px;"></div></div>
        <span class="t-cnt" style="color:${c};min-width:40px;text-align:right;">${v}<span style="font-size:10px;color:#8fb4cc;font-weight:600;">개</span></span></div>`;
    }).join('');
  }
  try{renderFacIssues();}catch(e){}
  const wr=document.getElementById('facWarnWrap');
  if(wr)wr.innerHTML=warned.length?warned.map(f=>{const w=_facWarn(f);
    return `<div onclick="openFacDetail(${f.id})" style="background:#060d1a;border-radius:8px;padding:9px 11px;margin-bottom:5px;cursor:pointer;border-left:3px solid #e05050;"><div style="font-size:12px;font-weight:700;color:#ff7a6e;">⚠️ ${_esc(f.type.split(' ')[0])} ${_esc(f.name)}</div>${w.reason?`<div style="font-size:11px;color:rgba(255,255,255,.55);margin-top:2px;">${_esc(w.reason)}</div>`:''}<div style="font-size:10px;color:#8a6;margin-top:2px;">${_esc(_warnPeriodStr(w))}</div></div>`;
  }).join(''):'<div class="muted" style="font-size:12px;padding:5px 0;">경고표시된 시설 없음</div>';
}

// 시설물 상세 (목록 탭에서 탭하면 모달로 상세 + 점검/이력 버튼)
function openFacDetail(id){
  const facs=DB.g('facilities')||[];const f=facs.find(x=>x.id===id);if(!f)return;
  selFacId=id;window._selFacDetailId=id;
  // 점검이력(history)은 최근 90일만 실시간 구독 — 상세를 열면 과거 이력을 지연 로드(캐시 우선) 후 한 번 다시 그림
  if(typeof _ARCHIVE_COLLS!=='undefined'&&_ARCHIVE_COLLS.includes('history')&&!_archiveLoaded['history']){
    _loadArchive('history').then(()=>{try{if(window._selFacDetailId===id)openFacDetail(id);}catch(e){}});
  }
  // 상세 ◀▶: 목록 정렬(이름·가까운순 등)과 무관하게 트레일 순(구간→표지판 번호→인접 거리)으로 통일
  try{
    const _meta=DB.g('catFacMeta')||{};const _adm=isAdminUser();
    _navOrder.fac=_facTrailSort(facs.filter(x=>_facVisibleTo(x)&&(_adm||!(_meta[x.type]||{}).adminOnly))).map(x=>String(x.id));
  }catch(e){}
  const w=_facWarn(f);const canMng=_canManageFac();
  document.getElementById('facDetailTitle').textContent=_facDispName(f);
  const _dcol=_facTypeColor(f.type);
  document.getElementById('facDetailContent').innerHTML=`
    ${_navBtns('fac',id,'openFacDetail')}
    ${(()=>{try{ // 현재 구간 내 위치 표시: '10 (백담계곡) 구간 · 7/54번째' — ◀▶가 어디를 도는지 한눈에
      const z=_facZoneCode(f);if(!z)return '';
      const same=(_navOrder.fac||[]).map(s=>facs.find(x=>String(x.id)===s)).filter(x=>x&&_facZoneCode(x)===z);
      const zi=same.findIndex(x=>String(x.id)===String(id));
      return zi<0?'':`<div style="text-align:center;font-size:10px;color:#5a8aaa;margin:-4px 0 8px;">🗺 ${_esc(_zoneLbl(z))} 구간 · ${zi+1}/${same.length}</div>`;
    }catch(e){return '';}})()}
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
      <div style="width:38px;height:38px;border-radius:50%;background:${_dcol}33;border:2px solid ${_dcol};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${_esc(f.type.split(' ')[0])}</div>
      <div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:700;color:#e0edf8;">${_esc(_facDispName(f))} ${_facGradeBadge(f)}</div>
        <div style="font-size:11px;color:${_dcol};margin-top:2px;">${_esc(f.type.split(' ').slice(1).join(' ')||f.type)}${f.hidden?' <span style="color:#8a6d3b;">· 🙈 숨김중</span>':''}</div>
      </div>
    </div>
    ${_facInfoHtml(f)}
    <button class="btn" style="width:100%;margin-top:10px;background:rgba(79,168,208,.16);color:#4fa8d0;border:1px solid rgba(79,168,208,.4);font-weight:800;" onclick="openFacIssueReport(${f.id})">🔧 점검 등록 (사진·등급·점검내용)</button>
    ${canMng?`<div style="display:flex;gap:5px;margin-top:7px;">
      <button onclick="openFacWarn(${f.id})" style="${_mBtnS('#f0a500')}">⚠️ 경고 ${w?'수정/해제':''}</button>
      <button onclick="toggleFacHide(${f.id})" style="${_mBtnS(f.hidden?'#f0a500':'#8aa6bc')}">${f.hidden?'👁️ 표시':'🙈 숨김'}</button>
    </div>`:''}`;
  const mapBtn=document.getElementById('facDetailMapBtn');
  if(mapBtn)mapBtn.style.display=(f.lat&&f.lng)?'block':'none';
  const adminBtns=document.getElementById('facDetailAdminBtns');
  if(adminBtns)adminBtns.style.display=canMng?'flex':'none';
  document.getElementById('modalFacDetail').classList.add('on');
  document.getElementById('facPopup').classList.remove('on');
}
// ── 경고표시 설정/수정/해제 (탐방시설과·개발자) — 사유는 선택, 기간(무제한/종료일) ──
function openFacWarn(id){
  if(!_canManageFac()){toast('⚠️ 탐방시설과·개발자만 가능');return;}
  const f=(DB.g('facilities')||[]).find(x=>x.id===id);if(!f)return;
  const w=f.warn||{};const active=!!_facWarn(f);
  const untilVal=w.until?new Date(w.until-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10):'';
  const unlimited=!w.until&&(w.on||false);
  const old=document.getElementById('facWarnOv');if(old)old.remove();
  const ov=document.createElement('div');ov.id='facWarnOv';
  ov.style.cssText='position:fixed;inset:0;z-index:9850;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:18px;';
  ov.innerHTML=`<div style="background:#0a1828;border:1px solid rgba(224,80,80,.35);border-radius:14px;max-width:340px;width:100%;padding:16px;">
    <div style="font-size:14px;font-weight:800;color:#ff7a6e;margin-bottom:3px;">⚠️ 경고표시 설정</div>
    <div style="font-size:11px;color:#7a9cb8;margin-bottom:12px;">${_esc(f.type.split(' ')[0])} ${_esc(f.name)} — 켜면 지도에 빨간색으로 깜빡입니다</div>
    <div style="font-size:11px;color:#9bbdd4;font-weight:700;margin-bottom:4px;">사유 <span style="color:#5a7e98;font-weight:400;">(선택 — 안 써도 됨)</span></div>
    <input type="text" id="fwReason" class="fi" placeholder="예: 데크 파손 통제, 낙석 위험" value="${_esc(w.reason||'')}" style="width:100%;box-sizing:border-box;margin-bottom:11px;">
    <div style="font-size:11px;color:#9bbdd4;font-weight:700;margin-bottom:4px;">기간</div>
    <label style="display:flex;align-items:center;gap:7px;font-size:12px;color:#cfe2f2;margin-bottom:8px;cursor:pointer;">
      <input type="checkbox" id="fwUnlimited" ${unlimited?'checked':''} onchange="var d=document.getElementById('fwUntilWrap');if(d)d.style.display=this.checked?'none':'block';"> 무제한
    </label>
    <div id="fwUntilWrap" style="display:${unlimited?'none':'block'};margin-bottom:12px;">
      <div style="font-size:10px;color:#5a7e98;margin-bottom:3px;">종료일 (이 날짜가 지나면 자동 해제)</div>
      <input type="date" id="fwUntil" class="fi" value="${untilVal}" style="width:100%;box-sizing:border-box;">
    </div>
    <div style="display:flex;gap:7px;">
      ${active?`<button onclick="clearFacWarn(${id})" style="flex:1;padding:11px;border-radius:9px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:#b8d4e8;font-size:13px;font-weight:700;cursor:pointer;">해제</button>`:''}
      <button onclick="saveFacWarn(${id})" style="flex:2;padding:11px;border-radius:9px;border:none;background:#c0392b;color:#fff;font-size:13px;font-weight:800;cursor:pointer;">${active?'변경 저장':'경고표시 켜기'}</button>
    </div>
    <button onclick="document.getElementById('facWarnOv').remove()" style="width:100%;margin-top:8px;padding:8px;border:none;background:none;color:#7a9cb8;font-size:12px;cursor:pointer;">취소</button>
  </div>`;
  ov.onclick=function(e){if(e.target===ov)ov.remove();};
  document.body.appendChild(ov);
  setTimeout(()=>{try{document.getElementById('fwReason').focus();}catch(e){}},50);
}
function saveFacWarn(id){
  if(!_canManageFac()){toast('⚠️ 권한 없음');return;}
  const facs=DB.g('facilities')||[];const idx=facs.findIndex(x=>x.id===id);if(idx<0)return;
  const reason=(document.getElementById('fwReason')?.value||'').trim();
  const unlimited=document.getElementById('fwUnlimited')?.checked;
  let until=null;
  if(!unlimited){
    const dv=document.getElementById('fwUntil')?.value||'';
    if(!dv){toast('⚠️ 종료일을 정하거나 무제한을 선택하세요');return;}
    until=new Date(dv+'T23:59:59').getTime();
    if(until<Date.now()){toast('⚠️ 종료일이 과거입니다');return;}
  }
  const prev=facs[idx].warn||{};
  facs[idx].warn={on:true,reason,from:prev.from||Date.now(),until,by:getAuthor(),at:Date.now()};
  DB.s('facilities',facs);
  const ov=document.getElementById('facWarnOv');if(ov)ov.remove();
  try{renderInspectMap();}catch(e){}try{renderFacList();}catch(e){}try{_refreshFacSurface(id);}catch(e){}
  toast('⚠️ 경고표시 켜짐');updateSummary();
}
function clearFacWarn(id){
  if(!_canManageFac()){toast('⚠️ 권한 없음');return;}
  const facs=DB.g('facilities')||[];const idx=facs.findIndex(x=>x.id===id);if(idx<0)return;
  facs[idx].warn={on:false,clearedBy:getAuthor(),clearedAt:Date.now()};
  DB.s('facilities',facs);
  const ov=document.getElementById('facWarnOv');if(ov)ov.remove();
  try{renderInspectMap();}catch(e){}try{renderFacList();}catch(e){}try{_refreshFacSurface(id);}catch(e){}
  toast('✅ 경고표시 해제');updateSummary();
}
function viewOnFacMap(){
  const f=(DB.g('facilities')||[]).find(x=>x.id===selFacId);
  if(!f||!f.lat)return;
  closeM('modalFacDetail');
  if(curApp!=='inspect'){openApp('inspect');}
  else{switchTab(1,document.getElementById('nv1'));}
  setTimeout(function(){
    try{if(mapI){mapI.setCenter(new kakao.maps.LatLng(f.lat,f.lng));mapI.setLevel(4);}renderInspectMap();}catch(e){}
    openFacFromMap(f.id);
  },220);
}

// ══════════════════════════════════════════
// 시설물 점검 4단계 처리 워크플로
//  1 점검 등록(누구나: 사진 필수·등급·점검내용) → 2 담당자 재평가·의견 → 3 지역담당구역자 현장확인 → 4 시설과 조치·종료
//  · 등록 즉시 '시설물 담당자'에게만 알림(전체 진동 없음)
//  · 등급 A~E = 시설물 안전등급 (A 우수 ~ E 불량)
// ══════════════════════════════════════════
const FAC_GRADES={
  A:{l:'A 우수',c:'#27ae60',d:'문제 없음·양호'},
  B:{l:'B 양호',c:'#7ec8a0',d:'경미한 결함 — 관찰'},
  C:{l:'C 보통',c:'#f0c040',d:'보조부재 손상 — 주의'},
  D:{l:'D 미흡',c:'#e67e22',d:'주요부재 손상 — 긴급 보수'},
  E:{l:'E 불량',c:'#e05050',d:'심각 — 즉시 사용제한·조치'},
};
const FAC_ISTAGE={
  1:{l:'접수',ico:'📥',c:'#4fa8d0',who:'시설물 담당자 검토 대기'},
  2:{l:'담당자 검토',ico:'🔎',c:'#f0a500',who:'시설물 담당자 재평가 중'},
  3:{l:'구역 현장확인',ico:'🥾',c:'#9b59b6',who:'지역담당구역자 현장확인 중'},
  4:{l:'시설과 조치',ico:'🔧',c:'#e67e22',who:'탐방시설과 현장확인·조치 중'},
};
function _fmtWhen(ms){if(!ms)return '-';const d=new Date(ms);const p=n=>String(n).padStart(2,'0');return `${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;}
function _fmtDateK(ms){if(!ms)return '-';const d=new Date(ms);return (d.getMonth()+1)+'/'+d.getDate();}
function _facIssues(){return DB.g('facIssues')||[];}
function _facIssueById(id){return _facIssues().find(x=>String(x.id)===String(id));}
function _facIssueOpen(){return _facIssues().filter(x=>x.status!=='closed');}
function _gLabel(g){return (FAC_GRADES[g]||{}).l||(g||'-');}
function _gColor(g){return (FAC_GRADES[g]||{}).c||'#7a9cb8';}
// 내 검토 대기(담당자 배정됨 + 2단계 이하) 개수 — 배지용
function _facIssueMineWaiting(){
  if(!(_isFacManager()||_isMasterAdmin()))return 0;
  return _facIssueOpen().filter(it=>Number(it.stage||1)<=2).length;
}
function _issueLog(it,act){(it.log=it.log||[]).push({at:Date.now(),by:getAuthor(),act});}
function _saveFacIssue(it){
  const arr=_facIssues();const i=arr.findIndex(x=>String(x.id)===String(it.id));
  if(i>=0)arr[i]=it;else arr.push(it);
  DB.s('facIssues',arr);
}
function _facIssueLink(id){return {app:'inspect',issue:id};}
// 담당자에게만(없으면 관리자에게) 점검 알림 — 전체 진동/FCM 없음
function _notiFacManagers(msg,link){
  const mgrs=_facManagers();
  if(mgrs.length)pushNoti(msg,'🚨','fac_issue',link,null,{targetKakaoIds:mgrs});
  else pushNoti(msg,'🚨','fac_issue',link,null,{adminOnly:true}); // 담당자 미지정 시 관리자에게
}
// 담당자 + 신고자에게 진행 알림
function _notiFacFollow(msg,link,it){
  const ids=_facManagers().slice();
  if(it&&it.reporterKakaoId)ids.push(String(it.reporterKakaoId));
  const uniq=[...new Set(ids.filter(Boolean))];
  if(uniq.length)pushNoti(msg,'🏗️','fac_issue',link,null,{targetKakaoIds:uniq});
}

// 점검내용 빠른 선택 태그 (다중 선택 + 상세는 자유 입력)
const INSPECT_TAGS=['이상없음','노후화','파손','부식','균열','도색벗겨짐','기울어짐','침하','기타'];
let _facIssueTags=new Set();
let _facIssueGrade='';     // 점검 폼에서 선택한 등급
let _facIssueForFacId=null;// 점검 대상 시설 id
function _toggleInspTag(t){
  if(_facIssueTags.has(t))_facIssueTags.delete(t);else _facIssueTags.add(t);
  const el=document.getElementById('fiTag_'+t);
  if(el){const on=_facIssueTags.has(t);
    el.style.background=on?'rgba(79,168,208,.2)':'rgba(255,255,255,.03)';
    el.style.color=on?'#4fa8d0':'rgba(255,255,255,.5)';
    el.style.borderColor=on?'rgba(79,168,208,.5)':'rgba(255,255,255,.12)';
    el.style.fontWeight=on?'800':'700';
  }
}
function _renderInspTags(){
  const wrap=document.getElementById('fiTagRow');if(!wrap)return;
  wrap.innerHTML=INSPECT_TAGS.map(t=>{const on=_facIssueTags.has(t);
    return `<div id="fiTag_${t}" onclick="_toggleInspTag('${_escq(t)}')" style="cursor:pointer;border-radius:18px;font-size:11px;font-weight:${on?'800':'700'};padding:6px 12px;border:1px solid ${on?'rgba(79,168,208,.5)':'rgba(255,255,255,.12)'};background:${on?'rgba(79,168,208,.2)':'rgba(255,255,255,.03)'};color:${on?'#4fa8d0':'rgba(255,255,255,.5)'};">${_esc(t)}</div>`;
  }).join('');
}
function _pickIssueGrade(g){
  _facIssueGrade=g;
  ['A','B','C','D','E'].forEach(k=>{
    const el=document.getElementById('fiG_'+k);if(!el)return;
    const on=k===g;const c=_gColor(k);
    el.style.background=on?c:'rgba(255,255,255,.03)';
    el.style.color=on?'#08121e':(k===g?'#fff':'rgba(255,255,255,.55)');
    el.style.borderColor=on?c:'rgba(255,255,255,.12)';
    el.style.fontWeight=on?'900':'700';
  });
  const d=document.getElementById('fiGradeDesc');
  if(d)d.innerHTML=g?`<span style="color:${_gColor(g)};font-weight:700;">${_gLabel(g)}</span> — ${(FAC_GRADES[g]||{}).d||''}`:'등급을 선택하세요';
}
// 점검 등록 폼 열기 — 반드시 등록된 시설물 기준(위치·GPS는 시설 고정, 수정 불가)
function openFacIssueReport(facId){
  const f=facId?(DB.g('facilities')||[]).find(x=>x.id===facId):null;
  if(!f){toast('⚠️ 지도·목록에서 시설물을 선택해 점검하세요');return;}
  _facIssueForFacId=f.id;
  _facIssueGrade='';
  _facIssueTags=new Set();
  const fixed=document.getElementById('fiFacFixed');
  fixed.innerHTML=`<div style="font-size:13px;font-weight:800;color:#e0edf8;">${_esc(f.type.split(' ')[0])} ${_esc(f.name)}</div>
    <div style="font-size:11px;color:#7a9cb8;margin-top:3px;">📍 ${_esc(f.loc||'위치정보 없음')}</div>
    <div style="font-size:10px;color:#5a7e98;margin-top:2px;font-family:monospace;">${f.lat?'GPS '+f.lat.toFixed(5)+', '+f.lng.toFixed(5):'GPS 미등록'} <span style="font-family:inherit;">· 시설 고정(수정 불가)</span></div>`;
  document.getElementById('fiDesc').value='';
  _renderInspTags();
  const pv=document.getElementById('prevFacIssue');if(pv){pv.innerHTML='📸 촬영 또는 앨범 (필수)';pv.dataset.url='';}
  const fi=document.getElementById('fileFacIssue');if(fi)fi.value='';
  _pickIssueGrade('');
  try{closeM('modalFacDetail');}catch(e){}
  try{document.getElementById('facPopup').classList.remove('on');}catch(e){}
  document.getElementById('modalFacIssue').classList.add('on');
}
function submitFacIssue(){
  const f=_facIssueForFacId?(DB.g('facilities')||[]).find(x=>x.id===_facIssueForFacId):null;
  if(!f){toast('⚠️ 시설물을 선택해 점검하세요');return;}
  if(!_facIssueGrade){toast('⚠️ 등급(A~E)을 선택하세요');return;}
  // 현장사진 필수 — 업로드 중(pending)이어도 선택된 것으로 인정
  const praw=document.getElementById('prevFacIssue')?.dataset?.url||'';
  if(!praw){toast('⚠️ 현장사진은 필수입니다 (촬영/앨범)');return;}
  const facName=f.type.split(' ')[0]+' '+f.name;
  const desc=(document.getElementById('fiDesc')?.value||'').trim();
  const tags=[...INSPECT_TAGS].filter(t=>_facIssueTags.has(t)); // 순서 고정
  const loc=f.loc||''; const lat=f.lat||null, lng=f.lng||null; // 위치·GPS는 시설 고정
  const u=DB.g('currentUser')||{};
  const id=Date.now();
  const it={
    id,facId:f.id,facName,facType:f.type,
    grade:_facIssueGrade,tags,desc,loc,lat,lng,
    photo:_photoUrl('prevFacIssue'),
    reporter:getAuthor(),reporterKakaoId:String(u.kakaoId||''),
    createdAt:id,stage:2,status:'open',log:[]  // 등록 완료 → 담당자 검토(2단계) 대기
  };
  _issueLog(it,`점검 등록 (등급 ${it.grade}${tags.length?' · '+tags.join(','):''})`);
  _saveFacIssue(it);
  // D·E 등급 점검 → 경고표시 자동 켜기 (조치 완료로 A~C 회복 시 자동 해제)
  try{
    if(it.grade==='D'||it.grade==='E'){
      const _fs2=DB.g('facilities')||[];const _fi=_fs2.findIndex(x=>x.id===f.id);
      if(_fi>=0&&!_facWarn(_fs2[_fi])){
        _fs2[_fi].warn={on:true,reason:'점검 '+it.grade+'등급'+(desc?' — '+desc:''),from:Date.now(),until:null,by:getAuthor(),at:Date.now(),auto:true};
        DB.s('facilities',_fs2);
        toast('⚠️ '+it.grade+'등급 — 경고표시 자동 설정');
      }
    }
  }catch(e){}
  try{_registerPendingPhoto('prevFacIssue',{key:'facIssues',id,field:'photo'});}catch(e){}
  _notiFacManagers(`🔧 시설물 점검 [${it.grade}등급] ${facName}${tags.length?' · '+tags.join(','):''} — ${it.reporter}`,_facIssueLink(id));
  closeM('modalFacIssue');
  toast('✅ 점검 등록 — 담당자 검토 요청');
  try{renderFacIssues();}catch(e){}try{renderInspectMap();}catch(e){}
}

// ── 점검 상세 + 단계별 조치 ──
function _issueStageBar(cur,closed){
  return `<div style="display:flex;gap:3px;margin:10px 0;">`+[1,2,3,4].map(s=>{
    const st=FAC_ISTAGE[s];const done=closed?(cur>=s):(cur>s);const active=!closed&&cur===s;
    const bg=done?'rgba(39,174,96,.18)':active?st.c:'rgba(255,255,255,.04)';
    const col=done?'#7ec8a0':active?'#08121e':'rgba(255,255,255,.35)';
    return `<div style="flex:1;text-align:center;background:${bg};color:${col};border-radius:6px;padding:5px 2px;font-size:9px;font-weight:800;line-height:1.3;">${done?'✓':st.ico}<br>${st.l}</div>`;
  }).join('')+`</div>`;
}
function openFacIssueDetail(id){
  const it=_facIssueById(id);if(!it){toast('점검 기록을 찾을 수 없습니다');return;}
  const closed=it.status==='closed';const stage=Number(it.stage||1);
  const canReview=_isFacManager()||_isMasterAdmin();
  const canZone=(typeof _isMember==='function')?_isMember():true;
  const canDept=_canManageFac();
  const gc=_gColor(it.grade);
  let h=`
    <div style="display:flex;align-items:center;gap:9px;margin-bottom:4px;">
      <div style="background:${gc};color:#08121e;font-weight:900;border-radius:8px;padding:4px 10px;font-size:15px;">${_esc(it.grade)}</div>
      <div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:800;color:#e0edf8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_esc(it.facName)}</div>
        <div style="font-size:10px;color:#7a9cb8;">점검 등급: <span style="color:${gc};font-weight:700;">${_gLabel(it.grade)}</span></div></div>
      ${closed?'<span style="background:rgba(39,174,96,.18);color:#7ec8a0;font-size:11px;font-weight:800;border-radius:7px;padding:4px 9px;">✅ 종료</span>':`<span style="background:${FAC_ISTAGE[stage].c};color:#08121e;font-size:11px;font-weight:800;border-radius:7px;padding:4px 9px;">${FAC_ISTAGE[stage].ico} ${FAC_ISTAGE[stage].l}</span>`}
    </div>
    ${_issueStageBar(stage,closed)}
    ${closed?'':`<div style="font-size:11px;color:${FAC_ISTAGE[stage].c};text-align:center;margin-bottom:8px;">▶ ${FAC_ISTAGE[stage].who}</div>`}`;

  // 1) 점검 내용
  const _tagChips=(it.tags&&it.tags.length)?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">${it.tags.map(t=>`<span style="background:rgba(79,168,208,.15);color:#4fa8d0;font-size:11px;font-weight:700;border-radius:14px;padding:3px 10px;">${_esc(t)}</span>`).join('')}</div>`:'';
  h+=`<div style="background:#060d1a;border-radius:10px;padding:11px;margin-bottom:9px;">
    <div style="font-size:11px;font-weight:800;color:#4fa8d0;margin-bottom:6px;">📥 1. 점검 등록 <span style="color:#5a7e98;font-weight:400;">· ${_esc(it.reporter||'-')} · ${_fmtWhen(it.createdAt)}</span></div>
    ${it.photo?`<img src="${_esc(it.photo)}" style="width:100%;border-radius:8px;margin-bottom:7px;max-height:240px;object-fit:cover;cursor:pointer;" onclick="_facPhotoView('${_escq(it.photo)}')">`:''}
    ${_tagChips}
    <div style="font-size:12px;color:#cfe2f2;line-height:1.6;">${it.desc?_esc(it.desc):(it.tags&&it.tags.length?'':'<span style="color:#5a7e98;">상세 설명 없음</span>')}</div>
    <div style="font-size:11px;color:#7a9cb8;margin-top:5px;">📍 ${_esc(it.loc||'-')}${it.lat?` <span style="font-family:monospace;color:#4a7090;">(${it.lat.toFixed(4)}, ${it.lng.toFixed(4)})</span>`:''}</div>
  </div>`;

  // 2) 담당자 검토
  if(it.mgr){
    const mg=it.mgr;const mgc=_gColor(mg.grade);
    h+=`<div style="background:#060d1a;border-radius:10px;padding:11px;margin-bottom:9px;border-left:3px solid ${mg.decision==='ok'?'#27ae60':'#f0a500'};">
      <div style="font-size:11px;font-weight:800;color:#f0a500;margin-bottom:6px;">🔎 2. 담당자 검토 <span style="color:#5a7e98;font-weight:400;">· ${_esc(mg.by||'-')} · ${_fmtWhen(mg.at)}</span></div>
      <div style="font-size:12px;color:#cfe2f2;margin-bottom:4px;">재평가 등급: <b style="color:${mgc};">${_gLabel(mg.grade)}</b> · 판정: <b style="color:${mg.decision==='ok'?'#7ec8a0':'#ff9a6e'};">${mg.decision==='ok'?'이상없음 회신·종료':'D·E 판정 → 현장확인'}</b></div>
      ${mg.opinion?`<div style="font-size:12px;color:#cfe2f2;line-height:1.6;">💬 ${_esc(mg.opinion)}</div>`:''}
    </div>`;
  } else if(stage===2 && !closed && canReview){
    const _rg=it.grade;const _rde=_rg==='D'||_rg==='E';
    h+=`<div style="background:rgba(240,165,0,.06);border:1px solid rgba(240,165,0,.3);border-radius:10px;padding:11px;margin-bottom:9px;">
      <div style="font-size:11px;font-weight:800;color:#f0a500;margin-bottom:7px;">🔎 2. 담당자 재평가</div>
      <div style="font-size:10px;color:#9bbdd4;margin-bottom:4px;">재평가 등급 <span style="color:#5a7e98;font-weight:400;">— 등급에 따라 처리 경로가 정해집니다</span></div>
      <select id="fiMgrGrade" class="fsel" onchange="_fiMgrUpdate()" style="margin-bottom:6px;">${['A','B','C','D','E'].map(g=>`<option value="${g}"${g===it.grade?' selected':''}>${_gLabel(g)}</option>`).join('')}</select>
      <div id="fiMgrHint" style="font-size:10px;line-height:1.5;margin-bottom:8px;color:${_rde?'#ff9a6e':'#7ec8a0'};">${_rde?'D·E 등급: <b>지역담당구역자 현장확인</b> 단계로 넘어갑니다':'A·B·C 등급: 판정 사유를 회신하고 <b>이상없음 종료</b>됩니다 (사유 필수)'}</div>
      <textarea id="fiMgrOpinion" class="fta" rows="2" placeholder="${_rde?'검토 의견 (선택 — 예: 데크 침하 심함, 통제 검토)':'판정 사유 (필수 — 왜 이 등급인지 회신)'}" style="margin-bottom:8px;"></textarea>
      <button id="fiMgrBtn" onclick="facIssueReview(${it.id})" style="width:100%;background:${_rde?'#c0392b':'#1e7a4e'};color:#fff;border:none;border-radius:8px;padding:10px;font-size:12px;font-weight:800;cursor:pointer;">${_rde?'⚠️ '+_rg+'등급 확정 → 지역담당 현장확인 요청':'✅ '+_rg+'등급 · 사유 회신 후 이상없음 종료'}</button>
    </div>`;
  } else if(stage<2){
    h+=`<div style="background:rgba(255,255,255,.02);border:1px dashed rgba(255,255,255,.1);border-radius:10px;padding:10px;margin-bottom:9px;font-size:11px;color:#5a7e98;">🔎 2. 담당자 검토 — 대기 중${canReview?' (담당자: 위 알림/목록에서 검토)':''}</div>`;
  }

  // 3) 지역담당구역자 현장확인
  if(it.zone){
    h+=`<div style="background:#060d1a;border-radius:10px;padding:11px;margin-bottom:9px;border-left:3px solid #9b59b6;">
      <div style="font-size:11px;font-weight:800;color:#b07cd0;margin-bottom:6px;">🥾 3. 구역 현장확인 <span style="color:#5a7e98;font-weight:400;">· ${_esc(it.zone.by||'-')} · ${_fmtWhen(it.zone.at)}</span></div>
      <div style="font-size:12px;color:#cfe2f2;line-height:1.6;">${it.zone.note?_esc(it.zone.note):'<span style="color:#5a7e98;">확인 완료</span>'}</div>
    </div>`;
  } else if(stage===3 && !closed && canZone){
    h+=`<div style="background:rgba(155,89,182,.07);border:1px solid rgba(155,89,182,.3);border-radius:10px;padding:11px;margin-bottom:9px;">
      <div style="font-size:11px;font-weight:800;color:#b07cd0;margin-bottom:7px;">🥾 3. 지역담당구역자 현장확인</div>
      <textarea id="fiZoneNote" class="fta" rows="2" placeholder="현장 확인 결과 (예: 데크 3판 파손 확인, 임시 통제 설치)" style="margin-bottom:8px;"></textarea>
      <button onclick="facIssueZone(${it.id})" style="width:100%;background:#7a4a9e;color:#fff;border:none;border-radius:8px;padding:9px;font-size:12px;font-weight:800;cursor:pointer;">현장확인 완료 → 시설과 이관</button>
    </div>`;
  } else if(stage<3 && !closed){
    h+=`<div style="background:rgba(255,255,255,.02);border:1px dashed rgba(255,255,255,.1);border-radius:10px;padding:10px;margin-bottom:9px;font-size:11px;color:#5a7e98;">🥾 3. 구역 현장확인 — 담당자 확인 후 진행</div>`;
  }

  // 4) 시설과 조치 — 완료 시 조치 후 등급(A~E) 선택, 오래 걸리면 조치 예정일 등록
  const planBanner=(!closed&&it.plan&&it.plan.until)?(()=>{const od=it.plan.until<Date.now();
    return `<div style="background:${od?'rgba(224,80,80,.08)':'rgba(79,168,208,.07)'};border:1px solid ${od?'rgba(224,80,80,.35)':'rgba(79,168,208,.25)'};border-radius:9px;padding:8px 11px;margin-bottom:8px;">
      <div style="font-size:11px;font-weight:800;color:${od?'#ff7a6e':'#4fa8d0'};">🗓️ ${_fmtDateK(it.plan.until)}까지 조치 예정${od?' — 예정일 지남':''}</div>
      ${it.plan.note?`<div style="font-size:11px;color:#9bbdd4;margin-top:3px;">${_esc(it.plan.note)}</div>`:''}
      <div style="font-size:9px;color:#5a7e98;margin-top:2px;">${_esc(it.plan.by||'')} · ${_fmtWhen(it.plan.at)}</div>
    </div>`;})():'';
  if(it.dept){
    h+=`<div style="background:#060d1a;border-radius:10px;padding:11px;margin-bottom:9px;border-left:3px solid #27ae60;">
      <div style="font-size:11px;font-weight:800;color:#7ec8a0;margin-bottom:6px;">🔧 4. 시설과 조치 <span style="color:#5a7e98;font-weight:400;">· ${_esc(it.dept.by||'-')} · ${_fmtWhen(it.dept.at)}</span></div>
      ${it.dept.grade?`<div style="font-size:12px;color:#cfe2f2;margin-bottom:4px;">조치 후 등급: <b style="color:${_gColor(it.dept.grade)};">${_gLabel(it.dept.grade)}</b></div>`:''}
      <div style="font-size:12px;color:#cfe2f2;line-height:1.6;">${it.dept.note?_esc(it.dept.note):'<span style="color:#5a7e98;">조치 완료</span>'}</div>
    </div>`;
  } else if(stage===4 && !closed && canDept){
    const defG=(it.mgr&&it.mgr.grade)||it.grade;
    const planVal=it.plan&&it.plan.until?new Date(it.plan.until-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10):'';
    h+=`<div style="background:rgba(39,174,96,.06);border:1px solid rgba(39,174,96,.3);border-radius:10px;padding:11px;margin-bottom:9px;">
      <div style="font-size:11px;font-weight:800;color:#7ec8a0;margin-bottom:7px;">🔧 4. 탐방시설과 현장확인·조치</div>
      ${planBanner}
      <div style="font-size:10px;color:#9bbdd4;margin-bottom:4px;">조치 후 등급 (A~E)</div>
      <select id="fiDeptGrade" class="fsel" style="margin-bottom:8px;">${['A','B','C','D','E'].map(g=>`<option value="${g}"${g===defG?' selected':''}>${_gLabel(g)}</option>`).join('')}</select>
      <textarea id="fiDeptNote" class="fta" rows="2" placeholder="조치 내용 (예: 데크 교체 완료 / 예산 반영 예정)" style="margin-bottom:8px;"></textarea>
      <button onclick="facIssueDept(${it.id})" style="width:100%;background:#0c4838;color:#fff;border:none;border-radius:8px;padding:10px;font-size:12px;font-weight:800;cursor:pointer;">✅ 조치 완료 → 종료</button>
      <div style="display:flex;align-items:center;gap:8px;margin:10px 0 7px;"><div style="flex:1;height:1px;background:rgba(255,255,255,.08);"></div><span style="font-size:10px;color:#5a7e98;white-space:nowrap;">고치는 데 시간이 오래 걸리면</span><div style="flex:1;height:1px;background:rgba(255,255,255,.08);"></div></div>
      <div style="display:flex;gap:6px;">
        <input type="date" id="fiDeptUntil" class="fi" style="flex:1;box-sizing:border-box;" value="${planVal}">
        <button onclick="facIssueDeptPlan(${it.id})" style="flex-shrink:0;background:rgba(79,168,208,.15);color:#4fa8d0;border:1px solid rgba(79,168,208,.4);border-radius:8px;padding:0 13px;font-size:11px;font-weight:800;cursor:pointer;">🗓️ ${it.plan?'예정 변경':'예정 등록'}</button>
      </div>
      <div style="font-size:9px;color:#5a7e98;margin-top:4px;">예정 등록 시 종료되지 않고 '${'~'}까지 조치 예정'으로 표시됩니다</div>
    </div>`;
  } else if(stage===4 && !closed){
    h+=`<div style="background:rgba(255,255,255,.02);border:1px dashed rgba(255,255,255,.1);border-radius:10px;padding:10px;margin-bottom:9px;">
      <div style="font-size:11px;color:#5a7e98;margin-bottom:${it.plan?'7px':'0'};">🔧 4. 시설과 조치 — 탐방시설과 처리 대기 중</div>${planBanner}</div>`;
  } else if(stage<4 && !closed){
    h+=`<div style="background:rgba(255,255,255,.02);border:1px dashed rgba(255,255,255,.1);border-radius:10px;padding:10px;margin-bottom:9px;font-size:11px;color:#5a7e98;">🔧 4. 시설과 조치 — 현장확인 후 진행</div>`;
  }

  if(closed){
    h+=`<div style="background:rgba(39,174,96,.08);border:1px solid rgba(39,174,96,.3);border-radius:10px;padding:10px 12px;margin-bottom:9px;text-align:center;">
      <div style="font-size:12px;font-weight:800;color:#7ec8a0;">✅ 처리 종료</div>
      <div style="font-size:10px;color:#7a9cb8;margin-top:3px;">${_esc(it.closeReason||'')}${it.closedBy?' · '+_esc(it.closedBy):''}${it.closedAt?' · '+_fmtWhen(it.closedAt):''}</div>
    </div>`;
  }

  // 관리(종료·삭제) — 시설과·마스터, 또는 접수 단계 신고자 본인
  const isReporter=String((DB.g('currentUser')||{}).kakaoId||'')===String(it.reporterKakaoId||'##');
  const canDelete=canDept||_isMasterAdmin()||(isReporter&&stage===1&&!closed);
  h+=`<div style="display:flex;gap:6px;margin-top:4px;">`;
  if(!closed&&(canReview||canDept))h+=`<button onclick="facIssueClose(${it.id})" style="flex:1;background:rgba(255,255,255,.05);color:#b8d4e8;border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:8px;font-size:11px;cursor:pointer;">조기 종료</button>`;
  if(closed&&canDept)h+=`<button onclick="facIssueReopen(${it.id})" style="flex:1;background:rgba(240,165,0,.1);color:#f0a500;border:1px solid rgba(240,165,0,.3);border-radius:8px;padding:8px;font-size:11px;cursor:pointer;">재개</button>`;
  if(canDelete)h+=`<button onclick="facIssueDelete(${it.id})" style="flex:1;background:rgba(224,80,80,.1);color:#ff8a80;border:1px solid rgba(224,80,80,.25);border-radius:8px;padding:8px;font-size:11px;cursor:pointer;">🗑️ 삭제</button>`;
  h+=`</div>`;

  // 처리 이력
  if(it.log&&it.log.length){
    h+=`<div style="margin-top:10px;border-top:1px solid rgba(255,255,255,.06);padding-top:8px;"><div style="font-size:10px;color:#5a7e98;font-weight:700;margin-bottom:4px;">📜 처리 이력</div>`
      +it.log.slice().reverse().map(l=>`<div style="font-size:10px;color:#6a8296;line-height:1.6;">· ${_fmtWhen(l.at)} · ${_esc(l.by||'')} — ${_esc(l.act||'')}</div>`).join('')+`</div>`;
  }

  document.getElementById('facIssueDetailBody').innerHTML=h;
  document.getElementById('modalFacIssueDetail').classList.add('on');
}
// 재평가 등급 선택에 따라 안내문·버튼을 즉시 갱신 (D·E=현장확인 / A·B·C=사유 회신·종료)
function _fiMgrUpdate(){
  const g=document.getElementById('fiMgrGrade')?.value||'';
  const de=g==='D'||g==='E';
  const hint=document.getElementById('fiMgrHint');
  if(hint){hint.style.color=de?'#ff9a6e':'#7ec8a0';
    hint.innerHTML=de?'D·E 등급: <b>지역담당구역자 현장확인</b> 단계로 넘어갑니다':'A·B·C 등급: 판정 사유를 회신하고 <b>이상없음 종료</b>됩니다 (사유 필수)';}
  const ta=document.getElementById('fiMgrOpinion');
  if(ta)ta.placeholder=de?'검토 의견 (선택 — 예: 데크 침하 심함, 통제 검토)':'판정 사유 (필수 — 왜 이 등급인지 회신)';
  const b=document.getElementById('fiMgrBtn');
  if(b){b.style.background=de?'#c0392b':'#1e7a4e';
    b.textContent=de?('⚠️ '+g+'등급 확정 → 지역담당 현장확인 요청'):('✅ '+g+'등급 · 사유 회신 후 이상없음 종료');}
}
// 담당자 재평가 — 등급이 경로를 결정: D·E → 3단계(현장확인) / A·B·C → 사유 회신 후 이상없음 종료
// 상세 모달·담당 업무함 양쪽에서 호출 — 값은 래퍼가 읽고 코어가 처리
function _facIssueReviewCore(id,grade,opinion,fromWork){
  if(!(_isFacManager()||_isMasterAdmin())){toast('⚠️ 시설물 담당자만 검토할 수 있습니다');return;}
  const it=_facIssueById(id);if(!it)return;
  grade=grade||it.grade;
  const de=grade==='D'||grade==='E';
  if(!de&&!opinion){toast('⚠️ A·B·C 판정은 사유(왜 이 등급인지)를 적어 회신하세요');return;}
  it.mgr={grade,opinion,by:getAuthor(),at:Date.now(),decision:de?'problem':'ok'};
  if(!de){
    it.status='closed';it.stage=2;it.closeReason='담당자 '+grade+'등급 판정 — 이상없음 회신';it.closedBy=getAuthor();it.closedAt=Date.now();
    _issueLog(it,`담당자 검토 — ${_gLabel(grade)} 사유 회신·이상없음 종료`);
    _saveFacIssue(it);
    _notiFacFollow(`✅ 점검 검토 종료(${_gLabel(grade)}) · ${it.facName} — ${getAuthor()}`,_facIssueLink(id),it);
    toast('✅ '+grade+'등급 회신 — 이상없음 종료');
  }else{
    it.stage=3;
    _issueLog(it,`담당자 검토 — ${_gLabel(grade)} 확정, 지역담당 현장확인 요청`);
    _saveFacIssue(it);
    _notiFacFollow(`🥾 점검 현장확인 요청 · ${it.facName} (${_gLabel(grade)}) — 지역담당구역자 확인 필요`,_facIssueLink(id),it);
    toast('⚠️ '+grade+'등급 — 현장확인 단계로');
  }
  _facIssueAfterAction(id,fromWork);
}
function facIssueReview(id){
  _facIssueReviewCore(id,document.getElementById('fiMgrGrade')?.value||'',(document.getElementById('fiMgrOpinion')?.value||'').trim(),false);
}
function _facIssueZoneCore(id,note,fromWork){
  if(!((typeof _isMember==='function')?_isMember():true)){toast('⚠️ 멤버만 가능');return;}
  const it=_facIssueById(id);if(!it)return;
  if(Number(it.stage)!==3){toast('현재 단계가 아닙니다');return;}
  it.zone={note,by:getAuthor(),at:Date.now()};it.stage=4;
  _issueLog(it,'지역담당구역자 현장확인 완료 → 시설과 이관');
  _saveFacIssue(it);
  _notiFacFollow(`🔧 점검 시설과 이관 · ${it.facName} — 현장확인 완료`,_facIssueLink(id),it);
  toast('✅ 현장확인 완료 — 시설과 이관');
  _facIssueAfterAction(id,fromWork);
}
function facIssueZone(id){_facIssueZoneCore(id,(document.getElementById('fiZoneNote')?.value||'').trim(),false);}
function _facIssueDeptCore(id,note,grade,fromWork){
  if(!_canManageFac()){toast('⚠️ 탐방시설과·개발자만 가능');return;}
  const it=_facIssueById(id);if(!it)return;
  grade=grade||(it.mgr&&it.mgr.grade)||it.grade; // 조치 후 최종 등급 (미선택 시 직전 등급 유지)
  it.dept={note,grade,by:getAuthor(),at:Date.now()};
  delete it.plan; // 예정 상태 해소
  it.status='closed';it.closeReason='시설과 조치 완료 ('+grade+'등급)';it.closedBy=getAuthor();it.closedAt=Date.now();
  _issueLog(it,`시설과 조치 완료 — ${_gLabel(grade)} · 종료`);
  _saveFacIssue(it);
  _notiFacFollow(`✅ 점검 조치 완료(${_gLabel(grade)}) · ${it.facName} — ${getAuthor()}`,_facIssueLink(id),it);
  // 조치 후 A~C 회복 → 점검이 자동으로 켰던 경고표시 해제
  try{
    if(['A','B','C'].indexOf(grade)>=0){
      const _fs2=DB.g('facilities')||[];const _fi=_fs2.findIndex(x=>x.id===it.facId);
      if(_fi>=0&&_fs2[_fi].warn&&_fs2[_fi].warn.on&&_fs2[_fi].warn.auto){
        _fs2[_fi].warn={on:false,clearedBy:getAuthor(),clearedAt:Date.now()};
        DB.s('facilities',_fs2);
        toast('✅ 등급 회복 — 경고표시 자동 해제');
      }
    }
  }catch(e){}
  toast('✅ 조치 완료('+grade+'등급) — 종료');
  _facIssueAfterAction(id,fromWork);
}
function facIssueDept(id){_facIssueDeptCore(id,(document.getElementById('fiDeptNote')?.value||'').trim(),document.getElementById('fiDeptGrade')?.value||'',false);}
// 조치 예정 등록 — 수리에 시간이 걸릴 때 '언제까지 조치하겠다'를 남김 (종료 안 됨, 예정일 지나면 배지 재점등)
function _facIssueDeptPlanCore(id,dateVal,note,fromWork){
  if(!_canManageFac()){toast('⚠️ 탐방시설과·개발자만 가능');return;}
  const it=_facIssueById(id);if(!it)return;
  if(!dateVal){toast('⚠️ 조치 예정일을 선택하세요');return;}
  const until=new Date(dateVal+'T23:59:59').getTime();
  if(until<Date.now()){toast('⚠️ 예정일이 과거입니다');return;}
  it.plan={until,note,by:getAuthor(),at:Date.now()};
  _issueLog(it,'조치 예정 등록 — '+_fmtDateK(until)+'까지'+(note?' ('+note+')':''));
  _saveFacIssue(it);
  _notiFacFollow(`🗓️ 조치 예정 · ${it.facName} — ${_fmtDateK(until)}까지 (${getAuthor()})`,_facIssueLink(id),it);
  toast('🗓️ '+_fmtDateK(until)+'까지 조치 예정 등록');
  _facIssueAfterAction(id,fromWork);
}
function facIssueDeptPlan(id){_facIssueDeptPlanCore(id,document.getElementById('fiDeptUntil')?.value||'',(document.getElementById('fiDeptNote')?.value||'').trim(),false);}
// 조치 후 공통 새로고침 — 업무함에서 처리했으면 목록에 남고, 모달에서 했으면 모달 갱신
function _facIssueAfterAction(id,fromWork){
  if(!fromWork)try{openFacIssueDetail(id);}catch(e){}
  try{renderFacIssues();}catch(e){}
  try{renderInspectMap();}catch(e){}
  try{renderFacWork();}catch(e){}
  try{_updateFacWorkBadge();}catch(e){}
}
function facIssueClose(id){
  if(!(_isFacManager()||_canManageFac()||_isMasterAdmin())){toast('⚠️ 권한 없음');return;}
  if(!confirm('이 점검 건을 종료할까요?'))return;
  const it=_facIssueById(id);if(!it)return;
  it.status='closed';it.closeReason='관리자 조기 종료';it.closedBy=getAuthor();it.closedAt=Date.now();
  _issueLog(it,'조기 종료');
  _saveFacIssue(it);
  toast('종료됨');openFacIssueDetail(id);try{renderFacIssues();}catch(e){}try{renderInspectMap();}catch(e){}
}
function facIssueReopen(id){
  if(!_canManageFac()){toast('⚠️ 권한 없음');return;}
  const it=_facIssueById(id);if(!it)return;
  it.status='open';delete it.closeReason;delete it.closedBy;delete it.closedAt;
  if(!it.stage||it.stage<1)it.stage=1;
  _issueLog(it,'재개');
  _saveFacIssue(it);
  toast('재개됨');openFacIssueDetail(id);try{renderFacIssues();}catch(e){}
}
function facIssueDelete(id){
  const it=_facIssueById(id);if(!it)return;
  const isReporter=String((DB.g('currentUser')||{}).kakaoId||'')===String(it.reporterKakaoId||'##');
  if(!(_canManageFac()||_isMasterAdmin()||(isReporter&&Number(it.stage)===1&&it.status!=='closed'))){toast('⚠️ 삭제 권한 없음');return;}
  if(!confirm('이 점검 기록을 삭제할까요?'))return;
  DB.s('facIssues',_facIssues().filter(x=>String(x.id)!==String(id)));
  try{closeM('modalFacIssueDetail');}catch(e){}
  toast('🗑️ 삭제');try{renderFacIssues();}catch(e){}try{renderInspectMap();}catch(e){}
}
// ── 점검 목록 (시설 통계 탭 상단 카드) ──
function renderFacIssues(){
  const wrap=document.getElementById('facIssueWrap');if(!wrap)return;
  const all=_facIssues();
  const open=all.filter(x=>x.status!=='closed').sort((a,b)=>(Number(a.stage||1)-Number(b.stage||1))||(b.createdAt-a.createdAt));
  const closed=all.filter(x=>x.status==='closed').sort((a,b)=>(b.closedAt||b.createdAt)-(a.closedAt||a.createdAt));
  const mineWait=_facIssueMineWaiting();
  let h='';
  if(mineWait&&(_isFacManager()||_isMasterAdmin())){
    h+=`<div style="background:rgba(240,165,0,.1);border:1px solid rgba(240,165,0,.4);border-radius:9px;padding:9px 11px;margin-bottom:9px;font-size:12px;font-weight:700;color:#f0a500;">🔧 검토 대기 ${mineWait}건 — 시설물 담당자 확인 필요</div>`;
  }
  if(!open.length){
    h+=`<div class="muted" style="font-size:12px;padding:5px 0;">진행 중인 점검 건 없음</div>`;
  }else{
    h+=open.map(it=>{
      const st=FAC_ISTAGE[Number(it.stage||1)]||FAC_ISTAGE[1];const gc=_gColor(it.grade);
      return `<div onclick="openFacIssueDetail(${it.id})" style="background:#060d1a;border-radius:9px;padding:9px 11px;margin-bottom:6px;cursor:pointer;border-left:3px solid ${gc};display:flex;align-items:center;gap:9px;">
        <div style="background:${gc};color:#08121e;font-weight:900;border-radius:6px;padding:2px 7px;font-size:12px;flex-shrink:0;">${_esc(it.grade)}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;font-weight:700;color:#e0edf8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_esc(it.facName)}</div>
          <div style="font-size:10px;color:#7a9cb8;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${it.tags&&it.tags.length?'<span style="color:#4fa8d0;">'+_esc(it.tags.join(', '))+'</span> · ':''}${_esc(it.loc||'')}${it.reporter?' · '+_esc(it.reporter):''}</div>
          ${it.plan&&it.plan.until?`<div style="font-size:9px;font-weight:700;color:${it.plan.until<Date.now()?'#ff7a6e':'#4fa8d0'};margin-top:2px;">🗓️ ${_fmtDateK(it.plan.until)}까지 조치 예정${it.plan.until<Date.now()?' — 지남':''}</div>`:''}
        </div>
        <span style="background:${st.c}22;color:${st.c};font-size:9px;font-weight:800;border-radius:6px;padding:3px 7px;flex-shrink:0;">${st.ico} ${st.l}</span>
      </div>`;
    }).join('');
  }
  if(closed.length){
    h+=`<div style="font-size:10px;color:#5a7e98;margin-top:9px;">✅ 종료 ${closed.length}건`+
      (closed.length?` <span onclick="_toggleClosedIssues()" id="fiClosedToggle" style="color:#4fa8d0;cursor:pointer;">· 보기</span>`:'')+`</div>`
      +`<div id="fiClosedList" style="display:none;margin-top:5px;">`+closed.slice(0,30).map(it=>{
        const gc=_gColor(it.grade);
        return `<div onclick="openFacIssueDetail(${it.id})" style="background:rgba(255,255,255,.02);border-radius:8px;padding:7px 10px;margin-bottom:4px;cursor:pointer;opacity:.7;display:flex;align-items:center;gap:8px;">
          <div style="background:${gc}55;color:#cfe2f2;font-weight:800;border-radius:5px;padding:1px 6px;font-size:11px;">${_esc(it.grade)}</div>
          <div style="flex:1;min-width:0;font-size:11px;color:#9bbdd4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_esc(it.facName)}</div>
          <span style="font-size:9px;color:#5a7e98;">${_esc(it.closeReason||'종료')}</span>
        </div>`;
      }).join('')+`</div>`;
  }
  wrap.innerHTML=h;
}
function _toggleClosedIssues(){
  const l=document.getElementById('fiClosedList');const t=document.getElementById('fiClosedToggle');
  if(!l)return;const show=l.style.display==='none';l.style.display=show?'block':'none';if(t)t.textContent=show?'· 숨기기':'· 보기';
}

// ══════════════════════════════════════════
// 담당 업무함 (하단 네비 4번째 탭 — 담당자·시설과·개발자만)
// 검토 회신·현장확인·조치를 목록에서 바로 처리
// ══════════════════════════════════════════
function _facWorkVisible(){return _isFacManager()||_canManageFac()||_isMasterAdmin();}
// 내가 지금 답할 수 있는 건수 (탭 배지)
function _facWorkCount(){
  const canReview=_isFacManager()||_isMasterAdmin();
  const canDept=_canManageFac();
  let n=0;
  _facIssueOpen().forEach(it=>{const s=Number(it.stage||1);
    if(s<=2){if(canReview)n++;}
    else if(s===3)n++;                 // 현장확인은 멤버 누구나 기록 가능
    else if(s===4){if(canDept&&!(it.plan&&it.plan.until>Date.now()))n++;} // 조치 예정 등록분은 예정일 지나면 재점등
  });
  return n;
}
function _updateFacWorkBadge(){
  const b=document.getElementById('nv4Badge');if(!b)return;
  const n=_facWorkVisible()?_facWorkCount():0;
  b.style.display=n?'block':'none';b.textContent=n>99?'99+':String(n);
}
// 업무함 인라인 폼 래퍼 (요소 ID가 항목별 fw*_id — 모달의 fi*와 충돌 없음)
function fwReview(id){_facIssueReviewCore(id,document.getElementById('fwMgrGrade_'+id)?.value||'',(document.getElementById('fwMgrOpinion_'+id)?.value||'').trim(),true);}
function fwZone(id){_facIssueZoneCore(id,(document.getElementById('fwZoneNote_'+id)?.value||'').trim(),true);}
function fwDept(id){_facIssueDeptCore(id,(document.getElementById('fwDeptNote_'+id)?.value||'').trim(),document.getElementById('fwDeptGrade_'+id)?.value||'',true);}
function fwDeptPlan(id){_facIssueDeptPlanCore(id,document.getElementById('fwDeptUntil_'+id)?.value||'',(document.getElementById('fwDeptNote_'+id)?.value||'').trim(),true);}
function _fwMgrUpdate(id){
  const g=document.getElementById('fwMgrGrade_'+id)?.value||'';
  const de=g==='D'||g==='E';
  const hint=document.getElementById('fwMgrHint_'+id);
  if(hint){hint.style.color=de?'#ff9a6e':'#7ec8a0';
    hint.innerHTML=de?'D·E: <b>지역담당 현장확인</b>으로 넘어갑니다':'A·B·C: 사유 회신 후 <b>이상없음 종료</b> (사유 필수)';}
  const ta=document.getElementById('fwMgrOpinion_'+id);
  if(ta)ta.placeholder=de?'검토 의견 (선택)':'판정 사유 (필수 — 왜 이 등급인지)';
  const b=document.getElementById('fwMgrBtn_'+id);
  if(b){b.style.background=de?'#c0392b':'#1e7a4e';
    b.textContent=de?('⚠️ '+g+'등급 확정 → 현장확인 요청'):('✅ '+g+'등급 · 회신 후 종료');}
}
function renderFacWork(){
  const wrap=document.getElementById('facWorkWrap');if(!wrap)return;
  const canReview=_isFacManager()||_isMasterAdmin();
  const canDept=_canManageFac();
  const open=_facIssueOpen().sort((a,b)=>b.createdAt-a.createdAt);
  const s2=open.filter(it=>Number(it.stage||1)<=2);
  const s3=open.filter(it=>Number(it.stage)===3);
  const s4=open.filter(it=>Number(it.stage)===4);
  const closed=_facIssues().filter(x=>x.status==='closed').sort((a,b)=>(b.closedAt||b.createdAt)-(a.closedAt||a.createdAt)).slice(0,10);

  const head=(ico,title,cnt,c)=>`<div style="font-size:12px;font-weight:800;color:${c};margin:15px 0 7px;">${ico} ${title}${cnt?` <span style="background:${c};color:#08121e;border-radius:9px;padding:0 7px;font-size:10px;margin-left:2px;">${cnt}</span>`:''}</div>`;
  const card=(it,body)=>{
    const gc=_gColor(it.grade);
    return `<div style="background:#0a1828;border:1px solid rgba(255,255,255,.06);border-left:3px solid ${gc};border-radius:11px;padding:11px;margin-bottom:9px;">
      <div style="display:flex;align-items:center;gap:9px;cursor:pointer;" onclick="openFacIssueDetail(${it.id})">
        ${it.photo?`<img src="${_esc(it.photo)}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;flex-shrink:0;">`:`<div style="width:44px;height:44px;border-radius:8px;background:#060d1a;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">🏗️</div>`}
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;font-weight:700;color:#e0edf8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><span style="color:${gc};font-weight:900;">${_esc(it.grade)}</span> · ${_esc(it.facName)}</div>
          <div style="font-size:10px;color:#7a9cb8;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${it.tags&&it.tags.length?'<span style="color:#4fa8d0;">'+_esc(it.tags.join(', '))+'</span> · ':''}${_esc(it.reporter||'')} · ${_fmtWhen(it.createdAt)}</div>
        </div>
        <span style="font-size:10px;color:#4fa8d0;flex-shrink:0;">상세 ›</span>
      </div>
      ${it.desc?`<div style="font-size:11px;color:#9bbdd4;margin-top:6px;line-height:1.5;">${_esc(it.desc)}</div>`:''}
      ${body||''}
    </div>`;
  };
  const formWrap=inner=>`<div style="margin-top:9px;border-top:1px dashed rgba(255,255,255,.08);padding-top:9px;">${inner}</div>`;

  let h=`<div style="font-size:11px;color:#9bbdd4;line-height:1.6;background:rgba(240,165,0,.05);border:1px solid rgba(240,165,0,.15);border-radius:9px;padding:8px 11px;">🔧 <b style="color:#f0a500;">담당 업무함</b> — 점검 회신·현장확인·조치를 여기서 바로 처리합니다.</div>`;

  // ── 1. 담당자 검토 대기 (인라인 회신) ──
  h+=head('🔎','담당자 검토 대기',s2.length,'#f0a500');
  if(!s2.length)h+=`<div class="muted" style="font-size:11px;">검토 대기 없음</div>`;
  else h+=s2.map(it=>{
    if(!canReview)return card(it,formWrap(`<div style="font-size:10px;color:#5a7e98;">담당자 회신 대기 중</div>`));
    const de0=it.grade==='D'||it.grade==='E';
    return card(it,formWrap(`
      <div style="font-size:10px;color:#9bbdd4;margin-bottom:4px;">재평가 등급 — 등급이 처리 경로를 정합니다</div>
      <select id="fwMgrGrade_${it.id}" class="fsel" onchange="_fwMgrUpdate(${it.id})" style="margin-bottom:5px;">${['A','B','C','D','E'].map(g=>`<option value="${g}"${g===it.grade?' selected':''}>${_gLabel(g)}</option>`).join('')}</select>
      <div id="fwMgrHint_${it.id}" style="font-size:10px;line-height:1.5;margin-bottom:6px;color:${de0?'#ff9a6e':'#7ec8a0'};">${de0?'D·E: <b>지역담당 현장확인</b>으로 넘어갑니다':'A·B·C: 사유 회신 후 <b>이상없음 종료</b> (사유 필수)'}</div>
      <textarea id="fwMgrOpinion_${it.id}" class="fta" rows="2" placeholder="${de0?'검토 의견 (선택)':'판정 사유 (필수 — 왜 이 등급인지)'}" style="margin-bottom:7px;"></textarea>
      <button id="fwMgrBtn_${it.id}" onclick="fwReview(${it.id})" style="width:100%;background:${de0?'#c0392b':'#1e7a4e'};color:#fff;border:none;border-radius:8px;padding:9px;font-size:12px;font-weight:800;cursor:pointer;">${de0?'⚠️ '+it.grade+'등급 확정 → 현장확인 요청':'✅ '+it.grade+'등급 · 회신 후 종료'}</button>`));
  }).join('');

  // ── 2. 지역담당 현장확인 대기 ──
  h+=head('🥾','지역담당 현장확인 대기',s3.length,'#b07cd0');
  if(!s3.length)h+=`<div class="muted" style="font-size:11px;">현장확인 대기 없음</div>`;
  else h+=s3.map(it=>card(it,formWrap(`
      ${it.mgr&&it.mgr.opinion?`<div style="font-size:10px;color:#f0a500;margin-bottom:6px;">🔎 담당자 의견: ${_esc(it.mgr.opinion)}</div>`:''}
      <textarea id="fwZoneNote_${it.id}" class="fta" rows="2" placeholder="현장 확인 결과 (예: 데크 3판 파손 확인, 임시 통제 설치)" style="margin-bottom:7px;"></textarea>
      <button onclick="fwZone(${it.id})" style="width:100%;background:#7a4a9e;color:#fff;border:none;border-radius:8px;padding:9px;font-size:12px;font-weight:800;cursor:pointer;">현장확인 완료 → 시설과 이관</button>`))).join('');

  // ── 3. 시설과 조치 대기 ──
  h+=head('🔧','시설과 조치 대기',s4.length,'#e67e22');
  if(!s4.length)h+=`<div class="muted" style="font-size:11px;">조치 대기 없음</div>`;
  else h+=s4.map(it=>{
    const pb=(it.plan&&it.plan.until)?(()=>{const od=it.plan.until<Date.now();
      return `<div style="font-size:10px;font-weight:800;color:${od?'#ff7a6e':'#4fa8d0'};margin-bottom:6px;">🗓️ ${_fmtDateK(it.plan.until)}까지 조치 예정${od?' — 예정일 지남':''}${it.plan.note?` <span style="color:#7a9cb8;font-weight:400;">· ${_esc(it.plan.note)}</span>`:''}</div>`;})():'';
    if(!canDept)return card(it,formWrap(`${pb}<div style="font-size:10px;color:#5a7e98;">탐방시설과 조치 대기 중${it.zone&&it.zone.note?' · 🥾 '+_esc(it.zone.note):''}</div>`));
    const defG=(it.mgr&&it.mgr.grade)||it.grade;
    const planVal=it.plan&&it.plan.until?new Date(it.plan.until-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10):'';
    return card(it,formWrap(`
      ${pb}${it.zone&&it.zone.note?`<div style="font-size:10px;color:#b07cd0;margin-bottom:6px;">🥾 현장확인: ${_esc(it.zone.note)}</div>`:''}
      <div style="font-size:10px;color:#9bbdd4;margin-bottom:4px;">조치 후 등급 (A~E)</div>
      <select id="fwDeptGrade_${it.id}" class="fsel" style="margin-bottom:6px;">${['A','B','C','D','E'].map(g=>`<option value="${g}"${g===defG?' selected':''}>${_gLabel(g)}</option>`).join('')}</select>
      <textarea id="fwDeptNote_${it.id}" class="fta" rows="2" placeholder="조치 내용 (예: 데크 교체 완료 / 예산 반영 예정)" style="margin-bottom:7px;"></textarea>
      <button onclick="fwDept(${it.id})" style="width:100%;background:#0c4838;color:#fff;border:none;border-radius:8px;padding:9px;font-size:12px;font-weight:800;cursor:pointer;">✅ 조치 완료 → 종료</button>
      <div style="display:flex;gap:6px;margin-top:7px;">
        <input type="date" id="fwDeptUntil_${it.id}" class="fi" style="flex:1;box-sizing:border-box;" value="${planVal}">
        <button onclick="fwDeptPlan(${it.id})" style="flex-shrink:0;background:rgba(79,168,208,.15);color:#4fa8d0;border:1px solid rgba(79,168,208,.4);border-radius:8px;padding:0 12px;font-size:11px;font-weight:800;cursor:pointer;">🗓️ ${it.plan?'예정 변경':'예정 등록'}</button>
      </div>`));
  }).join('');

  // ── 4. 최근 종료 ──
  if(closed.length){
    h+=head('✅','최근 종료',0,'#7ec8a0');
    h+=closed.map(it=>`<div onclick="openFacIssueDetail(${it.id})" style="background:rgba(255,255,255,.02);border-radius:9px;padding:8px 11px;margin-bottom:5px;cursor:pointer;opacity:.75;display:flex;align-items:center;gap:8px;">
      <span style="color:${_gColor(it.grade)};font-weight:900;font-size:12px;flex-shrink:0;">${_esc(it.grade)}</span>
      <span style="flex:1;min-width:0;font-size:11px;color:#9bbdd4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_esc(it.facName)}</span>
      <span style="font-size:9px;color:#5a7e98;flex-shrink:0;">${_esc(it.closeReason||'종료')}</span>
    </div>`).join('');
  }
  wrap.innerHTML=h;
  try{_updateFacWorkBadge();}catch(e){}
}

var _editFacId=null;
function openAddFac(){
  _editFacId=null;
  document.getElementById('addFacModalTitle').textContent='🆕 시설물 등록';
  const _catMeta=DB.g('catFacMeta')||{};const _cats=(DB.g('catFac')||[]).filter(c=>isAdminUser()||!(_catMeta[c]||{}).adminOnly);
  fillSel('facTypeSel',_cats);
  document.getElementById('facInstall').value=today();
  ['facNameIn','facGpsIn','facNote','facMgmtIn','facSpecIn','facStructIn'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  {const g=document.getElementById('facGradeSel');if(g)g.value='';}
  const _fa=document.getElementById('facAuthor');_fa.value=getAuthor();_fa.disabled=true;
  document.getElementById('prevFac').innerHTML='📸 촬영 또는 앨범';
  try{gpsFromMap('facGpsIn','inspect');}catch(e){}
  try{_resetFacFormMap();}catch(e){} // 지도 선택기 초기화(🗺 버튼으로 열림)
  // 위치: 구간 선택식 — 지도 십자선 근처 표지판의 구간을 기본 선택(수기 입력 폐지 → 데이터 통일)
  const _ic=window._lastInspectCrosshairCoord;
  let _zone='';
  try{const _ls=_ic?_nearestSign(_ic.lat,_ic.lng):null;const m=(_ls||'').match(/^(\d{2})-/);if(m&&typeof _zoneLbl==='function')_zone=_zoneLbl(m[1]);}catch(e){}
  _fillFacLocSel(_zone);
  document.getElementById('modalAddFac').classList.add('on');
}
// 위치(구간) 셀렉트 채우기 — ZONE_NAMES 기준 'NN (구간명)' 옵션. 기존 자유입력(레거시) 값은 옵션으로 보존
function _fillFacLocSel(cur){
  const sel=document.getElementById('facLocIn');if(!sel)return;
  cur=String(cur||'').trim();
  let opts='<option value="">위치 미지정</option>';
  try{Object.keys(ZONE_NAMES).forEach(z=>{const v=_zoneLbl(z);opts+=`<option value="${_esc(v)}">${_esc(v)}</option>`;});}catch(e){}
  sel.innerHTML=opts;
  if(cur){
    if(![...sel.options].some(o=>o.value===cur))sel.insertAdjacentHTML('beforeend',`<option value="${_esc(cur)}">${_esc(cur)} (기존값)</option>`);
    sel.value=cur;
  }
}
function openEditFac(id){
  if(!_canManageFac()){toast('⚠️ 탐방시설과·개발자만 수정 가능');return;}
  const f=(DB.g('facilities')||[]).find(x=>x.id===id);if(!f)return;
  _editFacId=id;
  document.getElementById('addFacModalTitle').textContent='✏️ 시설물 수정';
  fillSel('facTypeSel',DB.g('catFac')||[]);
  document.getElementById('facTypeSel').value=f.type;
  document.getElementById('facNameIn').value=f.name||'';
  _fillFacLocSel(f.loc||''); // 구간 셀렉트 — 레거시 자유입력 값은 '(기존값)' 옵션으로 유지
  document.getElementById('facGpsIn').value=f.lat&&f.lng?f.lat.toFixed(5)+', '+f.lng.toFixed(5):'';
  document.getElementById('facInstall').value=f.install||'';
  {const g=document.getElementById('facGradeSel');if(g)g.value=f.grade||'';}
  {const e=document.getElementById('facMgmtIn');if(e)e.value=f.mgmt||'';}
  {const e=document.getElementById('facSpecIn');if(e)e.value=f.spec||'';}
  {const e=document.getElementById('facStructIn');if(e)e.value=f.struct||'';}
  document.getElementById('facNote').value=f.note||'';
  const _fa=document.getElementById('facAuthor');_fa.value=f.author||getAuthor();_fa.disabled=true;
  document.getElementById('prevFac').innerHTML='📸 촬영 또는 앨범';
  try{_resetFacFormMap();}catch(e){} // 지도 선택기 초기화(🗺 버튼으로 열림 — 저장 좌표에서 시작)
  closeM('modalFacDetail');
  document.getElementById('modalAddFac').classList.add('on');
}
function deleteFac(id){
  if(!_canManageFac()){toast('⚠️ 시설과·시설담당자·개발자만 삭제 가능');return;}
  const facs=DB.g('facilities')||[];const i=facs.findIndex(f=>f.id===id);if(i<0)return;
  if(!confirm('이 시설물을 삭제하시겠습니까?\n(관리자 → 시스템의 🗑 휴지통에서 복구할 수 있습니다)'))return;
  const rec=facs.splice(i,1)[0];
  DB.s('facilities',facs);
  // 휴지통 보관(실수 방지 — 복구 가능) — 최근 100건 유지
  try{
    const tr=DB.g('facTrash')||[];
    tr.unshift({rec:rec,at:Date.now(),by:getAuthor()});
    if(tr.length>100)tr.length=100;
    DB.s('facTrash',tr);
  }catch(e){}
  closeM('modalFacDetail');
  try{document.getElementById('facPopup').classList.remove('on');}catch(e){}
  try{renderInspectMap();}catch(e){}renderFacList();toast('🗑️ 삭제 — 휴지통에 보관됨');updateSummary();
}
// 휴지통 복구/영구삭제 (관리자 → 시스템)
function restoreFac(at){
  if(!_canManageFac()){toast('⚠️ 권한 없음');return;}
  const tr=DB.g('facTrash')||[];const i=tr.findIndex(t=>t.at===at);if(i<0)return;
  const rec=tr[i].rec;if(!rec){tr.splice(i,1);DB.s('facTrash',tr);return;}
  const facs=DB.g('facilities')||[];
  if(facs.some(f=>f.id===rec.id))rec.id=Date.now(); // 그 사이 같은 id가 생겼으면 새 id로 복구
  facs.push(rec);DB.s('facilities',facs);
  tr.splice(i,1);DB.s('facTrash',tr);
  toast('♻️ 복구됨: '+(rec.name||''));
  try{renderInspectMap();}catch(e){}try{renderFacList();}catch(e){}try{renderAdmSys();}catch(e){}
}
function purgeFacTrash(at){
  if(!(typeof _isMasterAdmin==='function'&&_isMasterAdmin())){toast('⚠️ 개발자만 영구 삭제 가능');return;}
  const tr=DB.g('facTrash')||[];const i=tr.findIndex(t=>t.at===at);if(i<0)return;
  if(!confirm('영구 삭제하시겠습니까? 복구할 수 없습니다.\n('+(((tr[i]||{}).rec||{}).name||'')+')'))return;
  tr.splice(i,1);DB.s('facTrash',tr);
  try{renderAdmSys();}catch(e){}
}
function submitAddFac(){
  const name=document.getElementById('facNameIn').value.trim();if(!name){toast('⚠️ 명칭 입력');return;}
  const gs=document.getElementById('facGpsIn').value;
  let lat=null,lng=null;
  if(gs){const p=gs.split(',');lat=parseFloat(p[0]);lng=parseFloat(p[1]);if(isNaN(lat)||isNaN(lng)){lat=null;lng=null;}}
  const facs=DB.g('facilities')||[];
  const data={type:document.getElementById('facTypeSel').value,name,loc:document.getElementById('facLocIn').value,lat,lng,install:document.getElementById('facInstall').value,note:document.getElementById('facNote').value,author:document.getElementById('facAuthor').value,photo:_photoUrl('prevFac'),
    grade:(document.getElementById('facGradeSel')?.value||''),mgmt:(document.getElementById('facMgmtIn')?.value||'').trim(),spec:(document.getElementById('facSpecIn')?.value||'').trim(),struct:(document.getElementById('facStructIn')?.value||'').trim()};
  // 등급을 새로 지정/변경했으면 출처를 등록자로 기록 (기존 등급 유지 시 출처 유지)
  {const _pf=_editFacId?(facs.find(x=>x.id===_editFacId)||{}):{};if(data.grade&&data.grade!==_pf.grade)data.gradeBy=getAuthor();}
  if(_editFacId){
    const idx=facs.findIndex(f=>f.id===_editFacId);
    if(idx!==-1)facs[idx]=Object.assign(facs[idx],data);
    _editFacId=null;
    DB.s('facilities',facs);
    try{renderInspectMap();}catch(e){}renderFacList();closeM('modalAddFac');toast('✅ 시설물 수정');updateSummary();
  } else {
    facs.push(Object.assign({id:Date.now()},data));
    DB.s('facilities',facs);
    try{renderInspectMap();}catch(e){}try{renderFacList();}catch(e){}closeM('modalAddFac');toast('✅ 시설물 등록');updateSummary();
  }
}

// ══════════════════════════════════════════
// 특보운영
// ══════════════════════════════════════════
// 단계별 최소 응소 인원 (별표 10 사무소 운영기준)
const ALERT_REQS={
  '예비특보':{사무소:[{role:'당직',min:1}],분소:[]},
  'Ⅰ단계(주의보)':{사무소:[{role:'당직',min:1},{role:'비상근무',min:1}],분소:[{role:'당직',min:1}]},
  'Ⅱ단계(경보)':{사무소:[{role:'당직',min:1},{role:'비상근무',min:1},{role:'과장',min:1}],분소:[{role:'당직',min:1},{role:'비상근무',min:1}]},
  'Ⅲ단계':{사무소:[{role:'당직',min:1},{role:'과장',min:1},{role:'비상근무',min:1}],분소:[{role:'사무소 전직원',min:1}]}
};
const ALERT_LEVEL_COLORS={'예비특보':'#f0d040','Ⅰ단계(주의보)':'#ffa040','Ⅱ단계(경보)':'#ff8a80','Ⅲ단계':'#d7aefb'};
// 응소·관측 단위: 사무소(본소) + 분소. 대청분소는 대피소 단위로 세분화 운영.
const ALERT_GROUPS=[
  {name:'사무소',label:'사무소(본소)',ico:'🏢',reqType:'사무소',stations:[{loc:'사무소',label:'사무소(본소)'}]},
  {name:'대청분소',label:'대청분소 (대피소)',ico:'⛺',reqType:'분소',stations:[
    {loc:'희운각',label:'희운각대피소',shelter:true},{loc:'양폭',label:'양폭대피소',shelter:true},{loc:'수렴동',label:'수렴동대피소',shelter:true},{loc:'소청',label:'소청대피소',shelter:true},{loc:'중청',label:'중청대피소',shelter:true}]},
  {name:'백담분소',label:'백담분소',ico:'🏔️',reqType:'분소',stations:[{loc:'백담분소',label:'백담분소'}]},
  {name:'오색분소',label:'오색분소',ico:'🏔️',reqType:'분소',stations:[{loc:'오색분소',label:'오색분소'}]},
  {name:'한계산성분소',label:'한계산성분소',ico:'🏔️',reqType:'분소',stations:[{loc:'한계산성분소',label:'한계산성분소'}]},
  {name:'점봉산분소',label:'점봉산분소',ico:'🏔️',reqType:'분소',stations:[{loc:'점봉산분소',label:'점봉산분소'}]}
];
// 기상청 자동 우량계 관측 지점 (강수·적설 보고 전용 — 응소인원 없음)
const RAIN_STATIONS=[
  {loc:'미시령',   label:'미시령(기상대)', obs:true},
  {loc:'오색리',   label:'오색(기상대)',   obs:true},
  {loc:'설악댐',   label:'설악댐(관측소)',  obs:true},
  {loc:'마등령',   label:'마등령(기상대)', obs:true},
  {loc:'청봉관측', label:'청봉(관측소)',   obs:true},
  {loc:'백담계곡', label:'백담계곡(관측소)',obs:true},
  {loc:'한계성',   label:'한계산성(관측소)',obs:true},
];
// 전체 관측소(응소·관측 단위) 평탄 목록
const ALERT_STATIONS=[];ALERT_GROUPS.forEach(g=>g.stations.forEach(s=>ALERT_STATIONS.push({loc:s.loc,label:s.label,group:g.name,reqType:g.reqType,shelter:!!s.shelter})));
RAIN_STATIONS.forEach(s=>ALERT_STATIONS.push({loc:s.loc,label:s.label,group:'우량계',reqType:'obs',obs:true}));
const _stationLabel=loc=>{const s=ALERT_STATIONS.find(x=>x.loc===loc);return s?s.label:(loc||'사무소');};
let _alertLevel='',_alertType='',_respLoc='',_respRole='',_reportInterval=60;
let _reportLoc='',_reportOpId=null,_alertReminderTimer=null;
// '2026-06-24 21:30' → ms (관측 보고 알림 주기 계산용)
function _alertTimeMs(s){if(!s)return 0;const m=String(s).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);if(!m)return 0;return new Date(+m[1],+m[2]-1,+m[3],+m[4],+m[5]).getTime();}
// ms → 'YYYY-MM-DD HH:MM' (now()와 같은 표기)
function _alertMsStr(ms){const d=new Date(ms),p=n=>('0'+n).slice(-2);return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes());}
// ms → 알림용 짧은 표기: 오늘이면 'HH:MM', 아니면 'MM-DD HH:MM'
function _alertMsShort(ms){const s=_alertMsStr(ms);return s.slice(0,10)===_alertMsStr(Date.now()).slice(0,10)?s.slice(11):s.slice(5);}
// 단계별 필요 인원 (사무소/분소 기준)
function _reqOf(level,reqType){const req=ALERT_REQS[level]||{};return reqType==='사무소'?(req.사무소||[]):(req.분소||[]);}
// 특정 관측소의 최신 관측 보고
function _latestReport(op,loc){const rs=(op.reports||[]).filter(r=>r.loc===loc);if(!rs.length)return null;return rs.reduce((a,b)=>((b.at||0)>(a.at||0)?b:a));}
// ── 평시 상시 당직 인원 (특보 없어도 근무) ──
// 본소 1 · 백담분소 1 · 대피소 각 2 · 그 외 분소 0(특보 시 응소)
const DUTY_BASELINE={'사무소':1,'백담분소':1,'오색분소':0,'한계산성분소':0,'점봉산분소':0,'희운각':2,'양폭':2,'수렴동':2,'소청':2,'중청':2};
const _dutyOf=loc=>DUTY_BASELINE[loc]||0;
const _grpDuty=g=>g.stations.reduce((s,st)=>s+_dutyOf(st.loc),0);
// 평시 당직 현황 카드 (특보 없을 때)
function _renderDutyBaseline(){
  return `<div class="ao-card">
    <div class="ao-sec-hd" style="margin-top:0;"><span class="bar" style="background:#5fcf8f;"></span>🟢 평시 당직 현황</div>
    <div style="font-size:12.5px;color:#cfe2f2;line-height:2;">
      🏢 <b>본소(사무소)</b> — 당직 <b style="color:#7ee0a8;">1명</b> 상시<br>
      🏔️ <b>백담분소</b> — 당직 <b style="color:#7ee0a8;">1명</b> 상시<br>
      ⛺ <b>대피소</b> (희운각·양폭·수렴동·소청·중청) — 각 <b style="color:#7ee0a8;">2명</b> 상시
    </div>
    <div style="font-size:10px;color:#5a7e98;margin-top:8px;line-height:1.6;">※ 오색·한계산성·점봉산 분소는 상시 당직 없음(특보 시 응소).<br>주의보 시 백담은 상시 당직자가 특보 당직 겸직, 경보 시 1명 추가 응소.</div>
  </div>`;
}
// 응소 현황 요약 (일회성) — 상시 당직 + 응소 합산해 충족/부족 한 줄
function _renderRespSummary(active,opLevel){
  const rows=ALERT_GROUPS.map(g=>{
    const reqs=_reqOf(opLevel,g.reqType);
    const required=reqs.reduce((s,r)=>s+r.min,0);
    const base=_grpDuty(g);
    const reg=active.responders.filter(r=>g.stations.some(s=>s.loc===(r.loc||'사무소'))).length;
    const eff=base+reg, shortage=Math.max(0,required-eff), ok=required===0||shortage===0;
    const badge=required===0
      ? `<span style="font-size:10px;color:#6a94b0;">대기</span>`
      : ok? `<span style="font-size:10px;color:#5fcf8f;font-weight:800;">✅ 충족</span>`
          : `<span style="font-size:10px;color:#ff8a73;font-weight:800;">⚠️ ${shortage}명 부족</span>`;
    const det=[];if(base)det.push(`상시 ${base}`);if(reg)det.push(`응소 ${reg}`);
    const sub=det.length?`${det.join(' + ')}${required?` / 필요 ${required}`:''}`:(required?`필요 ${required}`:'평시');
    return `<div style="display:flex;align-items:center;gap:8px;padding:7px 2px;border-bottom:1px solid rgba(255,255,255,.04);">
      <span style="font-size:12.5px;color:#dceaf6;min-width:104px;flex-shrink:0;">${g.ico} ${_esc(g.label)}</span>
      <span style="font-size:11px;flex:1;color:#5a7e98;">${sub}</span>${badge}
    </div>`;
  }).join('');
  return `<div class="ao-card" style="padding:4px 12px 8px;">${rows}<div style="font-size:9px;color:#46708f;margin-top:6px;">상시=평시 당직 자동 반영 · 응소 등록은 🚨 입력 탭</div></div>`;
}
// 관측 현황 요약 (지속) — 거점별 최신값 + 경과시간 + 미보고 강조
function _renderObsSummary(active){
  const itvMin=active.reportInterval||60, itvMs=itvMin*60000;
  const start=active.startedAtMs||_alertTimeMs(active.startedAt)||0;
  const mt=_alertMeasureType(active), NOW=Date.now();
  const targets=[];
  ALERT_STATIONS.filter(s=>!s.obs).forEach(s=>{
    const manned=_dutyOf(s.loc)>0||active.responders.some(r=>(r.loc||'사무소')===s.loc)||(active.reports||[]).some(r=>r.loc===s.loc);
    if(manned)targets.push(s);
  });
  ALERT_STATIONS.filter(s=>s.obs&&(active.reports||[]).some(r=>r.loc===s.loc)).forEach(s=>targets.push(s));
  if(!targets.length)return `<div class="ao-card" style="font-size:11px;color:#456a85;padding:10px 12px;">관측 거점이 아직 없습니다</div>`;
  const valTxt=last=>{
    if(!last)return '<span style="color:#456a85;">보고 없음</span>';
    if(mt==='snow')return `❄️ <b style="color:#9ce0f0;">${_esc(String(last.snow??'-'))}</b>cm`;
    if(mt==='rain')return `🌧️ <b style="color:#a8cdf5;">${_esc(String(last.rain??'-'))}</b>mm`;
    return `❄️ <b style="color:#9ce0f0;">${_esc(String(last.snow??'-'))}</b> · 🌧️ <b style="color:#a8cdf5;">${_esc(String(last.rain??'-'))}</b>`;
  };
  const _ov=s=>{const last=_latestReport(active,s.loc);const at=last?(last.at||_alertTimeMs(last.time)):0;return last?(NOW-at>itvMs):(start>0&&NOW-start>itvMs);};
  const rows=targets.map(s=>{
    const last=_latestReport(active,s.loc), at=last?(last.at||_alertTimeMs(last.time)):0, overdue=_ov(s);
    let ago='-';if(at){const m=Math.floor((NOW-at)/60000);ago=m>=60?Math.floor(m/60)+'시간 '+(m%60)+'분 전':m+'분 전';}
    return `<div style="display:flex;align-items:center;gap:8px;padding:7px 2px;border-bottom:1px solid rgba(255,255,255,.04);${overdue?'background:rgba(231,76,60,.07);border-radius:6px;':''}">
      <span style="font-size:12px;color:${overdue?'#ff9e80':'#cfe2f2'};min-width:92px;flex-shrink:0;">${s.obs?'📡 ':''}${_esc(s.label)}</span>
      <span style="font-size:12px;flex:1;">${valTxt(last)}</span>
      <span style="font-size:10px;color:${overdue?'#ff8a73':'#6a96b4'};font-weight:${overdue?'800':'400'};flex-shrink:0;">${overdue?'⏰ 미보고':_esc(ago)}</span>
    </div>`;
  }).join('');
  const ovCnt=targets.filter(_ov).length;
  const head=`<div style="font-size:10px;color:#6a94b0;margin-bottom:5px;">보고 주기 ${itvMin>=60?(itvMin/60)+'시간':itvMin+'분'} · ${ovCnt?`<span style="color:#ff8a73;font-weight:800;">미보고 ${ovCnt}곳</span>`:'<span style="color:#5fcf8f;font-weight:700;">전 거점 양호</span>'}</div>`;
  return `<div class="ao-card" style="padding:8px 12px;">${head}${rows}</div>`;
}
// 특보 종류에 따른 측정 항목: 호우→rain, 대설→snow, 둘 다→both. 그 외(강풍·건조 등)→''(측정 없음)
// ※ 예비특보는 아직 발효 전이라 실제 강우·적설이 없음 → 측정 대상에서 제외. 실제 발효(주의보/경보)인 호우·대설만 측정.
function _alertMeasureType(op){
  const eff=(op.alerts||[]).filter(a=>(a.stage||'')!=='예비특보');
  const types=eff.map(a=>a.type||'');
  const hasRain=types.some(t=>t.includes('호우'));const hasSnow=types.some(t=>t.includes('대설'));
  if(hasRain&&hasSnow)return'both';if(hasSnow)return'snow';if(hasRain)return'rain';return'';
}
// 기상청 실시간 특보에서 해당 종류의 발효 지역 목록
function _liveRegionsOf(type){const lv=(window._kmaLiveAlerts||[]).find(x=>x.type===type);return lv&&lv.regions?lv.regions.slice():[];}
// ── 특보 발령 단계 모델 (수동·자동 공통, 발령 목록 op.alerts[]) ──
const ALERT_STAGE_ORDER=['예비특보','Ⅰ단계(주의보)','Ⅱ단계(경보)','Ⅲ단계'];
function _stageRank(s){const i=ALERT_STAGE_ORDER.indexOf(s);return i<0?0:i;}
function _stageShort(s){return s==='Ⅰ단계(주의보)'?'주의보':s==='Ⅱ단계(경보)'?'경보':s;}
// 기상청 특보 등급('경보'/'주의보'/'예비특보') → 내부 운영 단계
function _kmaStage(lvl){return lvl==='경보'?'Ⅱ단계(경보)':((lvl||'').indexOf('예비')>=0?'예비특보':'Ⅰ단계(주의보)');}
// 발령 목록(구버전 op.level/type 자동 보정)
function _opAlerts(op){
  if(op.alerts&&op.alerts.length)return op.alerts;
  if(op.level)return[{type:op.type||'기타',stage:op.level,source:(op.createdBy&&String(op.createdBy).indexOf('자동')>=0)?'auto':'manual'}];
  return[];
}
// 운영 인력 단계 = 발령된 특보 중 최고 단계
function _opLevel(op){const al=_opAlerts(op);if(!al.length)return'예비특보';return al.reduce((hi,a)=>_stageRank(a.stage)>_stageRank(hi)?a.stage:hi,al[0].stage);}
// 기상청 발효 특보(alertMap)를 {type,stage,issuedAtMs,announcedAtMs} 목록으로 정규화 (타입별 최고등급 + 발효·발표시각)
function _kmaLiveList(alertMap){
  const seen={},out=[];
  Object.keys(alertMap||{}).forEach(k=>{(alertMap[k].reasons||[]).forEach(r=>{
    const lvl=r.indexOf('예비특보')>=0?'예비':(r.indexOf('경보')>=0?'경보':(r.indexOf('주의보')>=0?'주의보':''));
    const type=r.replace('예비특보','').replace('경보','').replace('주의보','');
    if(!type||!lvl)return;
    const stage=_kmaStage(lvl);
    const efMs=(alertMap[k].efs||{})[r]||0; // 기상청 발효시각(TM_EF), 없으면 0
    const fcMs=(alertMap[k].fcs||{})[r]||0; // 기상청 발표시각(TM_FC), 없으면 0
    if(!seen[type]){seen[type]={type,stage,regions:[k],issuedAtMs:efMs,announcedAtMs:fcMs};out.push(seen[type]);}
    else{
      if(_stageRank(stage)>_stageRank(seen[type].stage)){seen[type].stage=stage;seen[type].issuedAtMs=efMs;seen[type].announcedAtMs=fcMs;}
      else if(_stageRank(stage)===_stageRank(seen[type].stage)){
        if(efMs&&(!seen[type].issuedAtMs||efMs<seen[type].issuedAtMs))seen[type].issuedAtMs=efMs;
        if(fcMs&&(!seen[type].announcedAtMs||fcMs<seen[type].announcedAtMs))seen[type].announcedAtMs=fcMs;
      }
      if(seen[type].regions.indexOf(k)<0)seen[type].regions.push(k);
    }
  });});
  return out;
}
// 마지막으로 화면에 표시된 공식 기상청 특보 (추정값 제외)
window._kmaLiveAlerts=window._kmaLiveAlerts||[];

let _alertTab=1; // 1:목록 2:통계 3:입력
function alertTab(n){_alertTab=n;renderAlertView();}
function _updateAlertNav(){
  [1,2,3].forEach(i=>{const el=document.getElementById('anv'+i);if(el)el.classList.toggle('on',_alertTab===i);});
}
function renderAlertView(){
  try{_updateCrisisBanner();}catch(e){}
  try{_migrateAlertLog();}catch(e){} // 과거 특보 이력 1회 백필 (통계·이력 목록용)
  const ops=DB.g('alertOps')||[];
  const active=ops.find(o=>!o.closedAt);
  // 관측 리마인더는 탭과 무관하게 운영 중이면 항상 동작
  if(active){active.responders=active.responders||[];active.reports=active.reports||[];active.alerts=active.alerts||_opAlerts(active);_startAlertReminder();}
  else{_stopAlertReminder();}
  _updateAlertNav();
  const _wrapEl=document.getElementById('alertViewWrap');
  if(!_wrapEl)return;
  if(_alertTab===2){_wrapEl.innerHTML=_renderAlertStats(ops);return;}
  if(_alertTab===3){_wrapEl.innerHTML=_renderAlertInput(active);return;}

  // ── 목록 탭 ──
  // 📡 수신 상태 카드 — 기상청 연결이 살아있는지 한눈에 (마지막 수신·경로·다음 확인·발효 특보)
  const kmaLive=window._kmaLiveAlerts||[];
  const _rxAt=window._kmaLastRxMs||((typeof _loadKmaLast==='function'&&(_loadKmaLast()||{}).at)||0);
  const _rxMin=_rxAt?Math.floor((Date.now()-_rxAt)/60000):-1;
  const _rxFailed=!!(window._kmaLastFailMs&&(!_rxAt||window._kmaLastFailMs>_rxAt)); // 마지막 시도가 실패
  let _rxCls='ok',_rxTxt='정상 수신 중',_rxCol='#8fe0b0';
  if(_rxMin<0){_rxCls='bad';_rxTxt='수신 이력 없음';_rxCol='#ff9a8a';}
  else if(_rxMin>=60){_rxCls='bad';_rxTxt='수신 두절 '+(_rxMin>=120?Math.floor(_rxMin/60)+'시간째':_rxMin+'분째');_rxCol='#ff9a8a';}
  else if(_rxFailed){_rxCls='warn';_rxTxt='마지막 확인 실패';_rxCol='#ffcf90';}
  else if(_rxMin>=25){_rxCls='warn';_rxTxt='수신 지연 '+_rxMin+'분';_rxCol='#ffcf90';}
  const _rxAgo=_rxMin<0?'':(_rxMin<1?'방금':(_rxMin<60?_rxMin+'분 전':Math.floor(_rxMin/60)+'시간 '+(_rxMin%60)+'분 전'));
  const _rxSrc=(typeof _kmaSrcName==='function')?_kmaSrcName():'';
  const wxHtml=`<div class="rx-card">
    <div style="display:flex;align-items:center;gap:8px;">
      <span class="rx-dot ${_rxCls}"></span>
      <b style="font-size:12.5px;color:${_rxCol};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">📡 기상청 특보 ${_rxTxt}</b>
      <span style="flex:1;"></span>
      <button onclick="_kmaCheckNow()" class="rx-btn">🔄 지금 확인</button>
      ${isAdminUser()?`<button onclick="kmaWarnDiag()" class="rx-btn">🔧 진단</button>`:''}
    </div>
    <div style="font-size:10.5px;color:#5d92bc;margin-top:6px;line-height:1.65;">
      ${_rxAt?`마지막 수신 <b style="color:#9fc4de;">${_alertMsShort(_rxAt)}</b> <span style="color:#46708f;">(${_rxAgo})</span>`:'아직 기상청 응답을 받은 적이 없습니다 — 🔄 지금 확인을 눌러보세요'}${_rxSrc?` · ${_rxSrc}`:''} · 10분마다 자동 확인
    </div>
    ${kmaLive.length
      ?`<div style="display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(79,168,208,.12);">${kmaLive.map(a=>`<div class="ao-wx-chip" style="margin:0;"><span class="ao-level-badge ao-level-${a.stage.indexOf('Ⅱ')>=0?'Ⅱ단계':'Ⅰ단계'}">${_stageShort(a.stage)}</span> <span style="color:#dceaf6;">${_esc(a.type||'')}</span></div>`).join('')}</div>`
      :`<div style="font-size:11px;color:#6a94b0;margin-top:7px;padding-top:7px;border-top:1px solid rgba(79,168,208,.1);">☀️ 현재 설악산 관할(속초·고성·양양·인제·산지) 발효 특보 없음</div>`}
  </div>`;

  // 활성 특보운영 — 분소별 응소 현황 + 시간별 기상관측
  let activeHtml='';
  if(active){
    const opLevel=_opLevel(active);
    const lvColor=ALERT_LEVEL_COLORS[opLevel]||'#4fa8d0';
    const itv=active.reportInterval||60;
    const mt=_alertMeasureType(active);
    // 경과 시간
    let elapsed='';
    if(active.startedAtMs){const ms=Date.now()-active.startedAtMs,h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);elapsed=(h>0?h+'시간 ':'')+m+'분 경과';}
    // 발효 시각 → 지속시간(미래발효/발효중)
    const _durOf=(a)=>{
      const ms=a.issuedAtMs||_alertTimeMs(a.issuedAt)||active.startedAtMs||0;
      if(!ms)return {txt:'',future:false};
      const diff=Date.now()-ms;
      if(diff<0){const tm=Math.ceil(-diff/60000),th=Math.floor(tm/60);return {txt:(th>0?th+'시간'+(tm%60?' '+(tm%60)+'분':''):tm+'분')+' 후 발효',future:true};}
      const h=Math.floor(diff/3600000),mi=Math.floor((diff%3600000)/60000);
      return {txt:h>0?h+'시간'+(mi>0?' '+mi+'분':'')+'째 발효 중':mi+'분째 발효 중',future:false};
    };
    // 개별 특보 카드 (해제용 인덱스는 원본 배열 기준)
    const _alertRow=(a)=>{
      const ai=active.alerts.indexOf(a);
      const d=_durOf(a);
      const when=a.issuedAt?String(a.issuedAt).slice(5,16):'';
      const fc=a.announcedAt?String(a.announcedAt).slice(5,16):''; // 발표시각(TM_FC)
      const rg=(a.regions&&a.regions.length)?a.regions.join(' · '):'';
      const acol=ALERT_LEVEL_COLORS[a.stage]||'#4fa8d0';
      return `<div style="background:rgba(255,255,255,.03);border:1px solid ${acol}44;border-radius:10px;padding:8px 11px;margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
          <span style="font-size:9px;color:#6a94b0;flex-shrink:0;">${a.drill?'🎯훈련':a.source==='auto'?'📡자동':'✋수동'}</span>
          <b style="font-size:13.5px;color:${acol};">${_esc(a.type)}${_stageShort(a.stage)}</b>
          ${d.txt?`<span style="font-size:10.5px;color:${d.future?'#9ce0f0':'#f0c060'};font-weight:800;">⏱ ${d.txt}</span>`:''}
          ${isAdminUser()&&ai>=0?`<span onclick="removeAlertItem(${active.id},${ai})" style="cursor:pointer;color:#ff6b5b;margin-left:auto;font-weight:800;padding:0 4px;">×</span>`:''}
        </div>
        <div style="font-size:10.5px;color:#8fb4cc;margin-top:4px;line-height:1.5;">${(fc||when)?`🕐 ${fc?`발표 ${_esc(fc)}`:''}${fc&&when?' · ':''}${when?(d.future?_esc(when)+' 발효 예정':'발효 '+_esc(when)):''}`:''}${rg?`<br>📍 ${_esc(rg)}`:''}</div>
      </div>`;
    };
    // 등급별 묶음: Ⅲ단계 → 경보 → 주의보 → 예비특보 (급한 것 위로), 그 외 단계는 '기타'로 보존
    const _grpDefs=[
      {key:'Ⅲ단계',label:'🟣 Ⅲ단계',col:'#d7aefb'},
      {key:'Ⅱ단계(경보)',label:'🔴 경보',col:'#ff6b5b'},
      {key:'Ⅰ단계(주의보)',label:'🟠 주의보',col:'#ffa040'},
      {key:'예비특보',label:'🟡 예비특보',col:'#f0d040'}
    ];
    const _known=new Set(_grpDefs.map(g=>g.key));
    const _grpBlock=(label,col,items)=>{
      if(!items.length)return '';
      items=items.slice().sort((a,b)=>(a.issuedAtMs||0)-(b.issuedAtMs||0)); // 오래된 발효 위로
      return `<div style="margin-bottom:9px;">
        <div style="display:flex;align-items:center;gap:6px;margin:2px 0 5px;">
          <span style="font-size:11px;font-weight:800;color:${col};">${label}</span>
          <span style="font-size:9px;color:#5a7e98;">${items.length}건</span>
          <span style="flex:1;height:1px;background:${col}33;"></span>
        </div>
        ${items.map(_alertRow).join('')}
      </div>`;
    };
    const alertRows=active.alerts.length
      ?(_grpDefs.map(g=>_grpBlock(g.label,g.col,active.alerts.filter(a=>a.stage===g.key))).join('')
        +_grpBlock('⚪ 기타','#8aa0b4',active.alerts.filter(a=>!_known.has(a.stage))))
      :'';
    // 현재 최고등급이 몇 시간째 지속 중인지 (그 등급 특보 중 가장 이른 발효시각 기준) — 상단 요약용
    let hiDurStr='';
    {
      const hiItems=active.alerts.filter(a=>a.stage===opLevel);
      let earliest=0;hiItems.forEach(a=>{const m=a.issuedAtMs||_alertTimeMs(a.issuedAt)||0;if(m&&(!earliest||m<earliest))earliest=m;});
      if(earliest){const diff=Date.now()-earliest;if(diff>=0){const h=Math.floor(diff/3600000),mi=Math.floor((diff%3600000)/60000);hiDurStr=(h>0?h+'시간 ':'')+mi+'분째 지속';}}
    }
    // 히어로 배너 + 요약 stat + 상세
    activeHtml=`
      <div class="ao-hero" style="background:linear-gradient(135deg,${lvColor}26,${lvColor}0d);border:1.5px solid ${lvColor}55;">
        <div class="ao-hero-top">
          <div>
            <span class="ao-hero-live" style="color:${active.drill?'#f0c420':lvColor};"><span class="ao-pulse"${active.drill?' style="background:#f0c420;animation:none;box-shadow:none;"':''}></span>${active.drill?'특보 대응 훈련 중':'특보운영 중'}</span>
            <div class="ao-hero-lv" style="color:${lvColor};">${_esc(opLevel)}${active.drill?' <span class="drill-badge" style="font-size:11px;">🎯 훈련</span>':''}</div>
            ${hiDurStr?`<div class="ao-hero-meta">⏱ 현재 등급 <b style="color:${lvColor};">${hiDurStr}</b></div>`:''}
            <div class="ao-hero-meta" style="opacity:.65;">🕐 ${_esc(active.startedAt||'')} 운영 시작${elapsed?' · 누적 '+elapsed:''}</div>
            ${mt?`<div class="ao-hero-meta">⏱️ 관측 보고 주기: ${itv>=60?(itv/60)+'시간':itv+'분'}마다</div>`:''}
          </div>
          ${isAdminUser()?`<button onclick="endAlertOps(${active.id})" class="ao-end-btn">운영 종료</button>`:''}
        </div>
      </div>

      ${_quickRespBtnHtml(active)}

      ${mt?`<div class="ao-stats">
        <div class="ao-stat"><div class="ao-stat-num" style="color:${lvColor};">${active.alerts.length}</div><div class="ao-stat-lbl">발효 특보</div></div>
        <div class="ao-stat"><div class="ao-stat-num" style="color:#7ee0a8;">${active.responders.length}</div><div class="ao-stat-lbl">응소 인원</div></div>
        <div class="ao-stat"><div class="ao-stat-num" style="color:#a8cdf5;">${active.reports.length}</div><div class="ao-stat-lbl">관측 보고</div></div>
      </div>`:''}

      <div class="ao-card">
        <div class="ao-sec-hd" style="margin-top:0;"><span class="bar" style="background:#ff8a80;"></span>🚨 발령 특보</div>
        <div>${alertRows||'<span style="font-size:11px;color:#456a85;">발령된 특보 없음</span>'} ${isAdminUser()?`<button onclick="openAlertStart()" class="ao-add-alert">+ 특보 발령</button>`:''}</div>
        ${active.note?`<div style="font-size:12px;color:#9fc0da;margin-top:8px;background:rgba(255,255,255,.03);border-radius:8px;padding:7px 10px;">📝 ${_esc(active.note)}</div>`:''}
      </div>

      ${mt?`<div class="ao-sec-hd"><span class="bar"></span>👤 응소 현황 <span style="font-size:9px;color:#46708f;font-weight:600;margin-left:auto;">일회성 · 입력은 🚨 입력 탭</span></div>
      ${_renderRespSummary(active,opLevel)}

      <div class="ao-sec-hd"><span class="bar" style="background:#4fc0a0;"></span>📡 관측 현황 <span style="font-size:9px;color:#46708f;font-weight:600;margin-left:auto;">주기마다 지속 보고</span></div>
      ${_renderObsSummary(active)}

      <div class="ao-sec-hd"><span class="bar" style="background:#4fc0a0;"></span>📊 누적 관측 요약</div>
      ${_renderCumulativeSummary(active)}

      <div class="ao-sec-hd"><span class="bar" style="background:#6e96e6;"></span>🕐 시간대별 관측 기록</div>
      ${_renderReportsTable(active)}`:''}`;
  } else {
    activeHtml=`<div class="ao-empty">
      <div class="ao-empty-ico">🌀</div>
      <div class="ao-empty-msg">현재 진행 중인 특보운영이 없습니다</div>
      ${isAdminUser()?`<button onclick="alertTab(3)" class="ao-start-btn">🌀 특보운영 시작</button>
      <div style="margin-top:10px;"><button onclick="openAlertStart(true)" class="btn2 btn2-sec btn2-sm">🎯 훈련(리허설)로 시작 — 실제와 동일 흐름 · 통계 제외</button></div>`:'<div style="font-size:11px;color:#456a85;">관리자가 특보운영을 시작하면 표시됩니다</div>'}
    </div>
    ${_renderDutyBaseline()}`;
  }

  // 이전 운영 이력 (보관·열람) — 클릭 시 상세 모달
  const closed=ops.filter(o=>o.closedAt).reverse();
  _navOrder.alert=closed.map(o=>String(o.id)); // 특보 보관함 이전/다음 순서
  let histHtml='';
  if(closed.length){
    histHtml=`<div style="margin-top:18px;"><div class="ao-sec-hd"><span class="bar" style="background:#5d82a0;"></span>📜 특보운영 기록 보관함 <span style="font-size:10px;color:#46708f;font-weight:600;margin-left:auto;">총 ${closed.length}건</span></div>
    ${closed.map(o=>{
      const incCnt=_incidentsInOp(o).length;
      return `<div class="ao-hist" onclick="openAlertHistory(${o.id})" style="cursor:pointer;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div style="font-size:12px;font-weight:700;color:#bcd2e6;flex:1;min-width:0;">${o.drill?'<span class="drill-badge" style="font-size:9px;padding:1px 6px;">🎯 훈련</span> ':''}${_esc(_opLevel(o))} · ${_esc(_opAlerts(o).map(a=>a.type+_stageShort(a.stage)).join(', ')||'-')}</div>
        <span style="font-size:14px;color:#46708f;flex-shrink:0;">›</span>
      </div>
      <div style="font-size:10px;color:#46708f;margin-top:3px;">${_esc((o.startedAt||'').slice(5))} → ${_esc((o.closedAt||'').slice(5))} · 응소 ${(o.responders||[]).length}명 · 관측 ${(o.reports||[]).length}건${incCnt?` · <span style="color:#ff8a80;">🚨 안전사고 ${incCnt}건</span>`:''}</div>
    </div>`;}).join('')}
    </div>`;
  }

  const wrap=document.getElementById('alertViewWrap');
  if(wrap) wrap.innerHTML=wxHtml+`<div id="alertActiveWrap">`+activeHtml+`</div>`+histHtml;
}

// ── 특보운영 통계 탭 — 일수 기준 (건수 아님: 같은 특보가 여러 날 이어지면 날짜별 1일씩 집계) ──
// 특보 종류별 고정 색 — 다크 배경 대비·색각이상 분리 검증 완료 팔레트. 종류에 고정(순위와 무관)
const ALERT_TYPE_COLORS={'호우':'#3388c2','대설':'#2fa3c4','강풍':'#46ad5f','폭염':'#cc7527','한파':'#6f7ee6','태풍':'#b055c9','풍랑':'#0f8f6d','건조':'#a5912c','황사':'#b25a28','폭풍해일':'#d4699b'};
function _alertTypeColor(t){return ALERT_TYPE_COLORS[t]||'#8aa0b4';}
function alertStatYear(y){window._alertStatYear=y;renderAlertView();}
function _renderAlertStats(ops){
  ops=(ops||DB.g('alertOps')||[]).filter(o=>!o.drill); // 훈련(리허설)은 통계 제외
  try{_migrateAlertLog();}catch(e){}
  const log=(DB.g('alertLog')||[]).filter(r=>!r.drill);
  if(!ops.length&&!log.length)return `<div class="ao-empty"><div class="ao-empty-ico">📊</div><div class="ao-empty-msg">특보운영 기록이 없습니다</div></div>`;
  // 1) 발효 구간 수집: 이력 로그(alertLog) 우선 — 자동해제·삭제된 특보까지 완전 집계.
  //    로그가 비었으면(구버전) alertOps에서 현재 남아있는 특보로 폴백.
  const spans=[];
  if(log.length){
    log.forEach(r=>{
      const f=r.issuedAtMs||_alertTimeMs(r.issuedAt)||0;
      if(!f||f>Date.now())return;                            // 시각 없음·발효 예정(미래)은 집계 제외
      const en=r.endedAtMs||_alertTimeMs(r.endedAt)||Date.now();
      const t=Math.max(f,Math.min(en,f+366*86400000));       // 손상 데이터 방어(1년 상한)
      spans.push({type:r.type||'기타',stage:r.stage||'',from:f,to:t});
    });
  }else{
    ops.forEach(o=>{
      const s0=o.startedAtMs||_alertTimeMs(o.startedAt)||0;
      const e0=o.closedAtMs||_alertTimeMs(o.closedAt)||Date.now();
      _opAlerts(o).forEach(a=>{
        const f=a.issuedAtMs||_alertTimeMs(a.issuedAt)||s0;
        if(!f||f>Date.now())return;
        const t=Math.max(f,Math.min(e0,f+366*86400000));
        spans.push({type:a.type||'기타',stage:a.stage||'',from:f,to:t});
      });
    });
  }
  if(!spans.length)return `<div class="ao-empty"><div class="ao-empty-ico">📊</div><div class="ao-empty-msg">집계할 특보 데이터가 없습니다</div></div>`;
  // 2) 일 단위 전개 — 연도별 {전체·월별·종류별·단계별} 발효일 집합 (Set이라 중복 자동 제거)
  const Y={};
  spans.forEach(sp=>{
    const d=new Date(sp.from);d.setHours(0,0,0,0);
    for(let g=0;d.getTime()<=sp.to&&g<366;g++,d.setDate(d.getDate()+1)){
      const yr=d.getFullYear(),mo=d.getMonth(),k=(mo+1)*100+d.getDate();
      const y=Y[yr]||(Y[yr]={days:new Set(),type:{},typeStage:{},month:Array.from({length:12},()=>new Set()),monthTypes:Array.from({length:12},()=>({})),stage:{}});
      y.days.add(k);y.month[mo].add(k);
      (y.type[sp.type]||(y.type[sp.type]=new Set())).add(k);
      y.typeStage[sp.type]=Math.max(y.typeStage[sp.type]||0,_stageRank(sp.stage));
      (y.monthTypes[mo][sp.type]||(y.monthTypes[mo][sp.type]=new Set())).add(k);
      const sg=_stageRank(sp.stage)>=2?'경보 이상':(_stageRank(sp.stage)===1?'주의보':'예비특보');
      (y.stage[sg]||(y.stage[sg]=new Set())).add(k);
    }
  });
  const years=Object.keys(Y).map(Number).sort((a,b)=>b-a);
  let sel=window._alertStatYear;
  if(years.indexOf(sel)<0)sel=years[0];
  const y=Y[sel];
  // 3) 연도 요약 (운영 세션은 시작 연도 기준)
  const opsY=ops.filter(o=>new Date(o.startedAtMs||_alertTimeMs(o.startedAt)||0).getFullYear()===sel);
  const _opSpan=o=>{const st=o.startedAtMs||_alertTimeMs(o.startedAt)||0;const en=o.closedAtMs||_alertTimeMs(o.closedAt)||Date.now();return st?Math.max(0,en-st):0;};
  const totalHr=opsY.reduce((s,o)=>s+_opSpan(o),0)/3600000;
  const longest=opsY.reduce((mx,o)=>Math.max(mx,_opSpan(o)),0);
  const totResp=opsY.reduce((s,o)=>s+(o.responders||[]).length,0);
  const totRep=opsY.reduce((s,o)=>s+(o.reports||[]).length,0);
  const typeRank=Object.keys(y.type).map(t=>({t,d:y.type[t].size})).sort((a,b)=>b.d-a.d);
  const top=typeRank[0];
  const warnDays=(y.stage['경보 이상']||new Set()).size;
  const yearDen=sel===new Date().getFullYear()?Math.max(1,Math.ceil((Date.now()-new Date(sel,0,1).getTime())/86400000)):365;
  // 월별 발효일수 — 세로 막대 (크기 비교 → 단일 색조, 값 직접 표기)
  const monthMax=Math.max(...y.month.map(s=>s.size),1);
  const monthBars=y.month.map((s,i)=>{
    const v=s.size;
    const bd=Object.keys(y.monthTypes[i]).map(t=>t+' '+y.monthTypes[i][t].size+'일').join(', ');
    return `<div title="${sel}년 ${i+1}월 — 발효 ${v}일${bd?' ('+_escq(bd)+')':''}" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;min-width:0;">
      ${v?`<div style="font-size:8.5px;color:#7a9cb8;margin-bottom:2px;">${v}</div>`:''}
      <div style="width:100%;max-width:18px;height:${v?Math.max(4,Math.round(v/monthMax*70)):0}px;background:#3388c2;border-radius:3px 3px 0 0;"></div>
    </div>`;
  }).join('');
  const monthLabels=y.month.map((s,i)=>`<div style="flex:1;text-align:center;font-size:8.5px;color:${s.size?'#7a9cb8':'#3a5a75'};">${i+1}</div>`).join('');
  // 종류별 발효일수 — 순위 막대 (정체성 → 종류 고정색 + 전 항목 직접 라벨)
  const maxTypeDays=top?top.d:1;
  const typeRows=typeRank.map(r=>{
    const col=_alertTypeColor(r.t);
    const stg=y.typeStage[r.t]||0;
    const stgTxt=stg>=2?'경보':(stg===1?'주의보':'예비');
    let topMo=-1,topMoD=0;
    y.monthTypes.forEach((m,i)=>{const dd=m[r.t]?m[r.t].size:0;if(dd>topMoD){topMoD=dd;topMo=i;}});
    return `<div title="${_escq(r.t)} ${r.d}일 · 최고 ${stgTxt}" style="display:flex;align-items:center;gap:8px;padding:5px 0;">
      <span style="display:inline-flex;align-items:center;gap:5px;min-width:60px;flex-shrink:0;"><span style="width:8px;height:8px;border-radius:50%;background:${col};flex-shrink:0;"></span><span style="font-size:11.5px;color:#c0d8ec;font-weight:700;">${_esc(r.t)}</span></span>
      <div style="flex:1;height:10px;background:rgba(255,255,255,.05);border-radius:5px;overflow:hidden;"><div style="height:100%;width:${Math.max(3,Math.round(r.d/maxTypeDays*100))}%;background:${col};border-radius:5px;"></div></div>
      <span style="font-size:11.5px;color:#e0edf8;font-weight:800;min-width:30px;text-align:right;flex-shrink:0;">${r.d}일</span>
      <span style="font-size:9px;color:#5a7e98;min-width:62px;text-align:right;flex-shrink:0;">최고 ${stgTxt}${topMo>=0?' · 주로 '+(topMo+1)+'월':''}</span>
    </div>`;
  }).join('');
  // 단계별 발효일수 (상태색 — 심각도 고정)
  const SG=[['경보 이상','#ff6b5b'],['주의보','#e67e22'],['예비특보','#27ae60']];
  const sgMax=Math.max(...SG.map(p=>(y.stage[p[0]]||new Set()).size),1);
  const sgRows=SG.map(p=>{
    const v=(y.stage[p[0]]||new Set()).size;
    if(!v)return'';
    return `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;">
      <span style="font-size:11px;color:#c0d8ec;min-width:60px;flex-shrink:0;">${p[0]}</span>
      <div style="flex:1;height:8px;background:rgba(255,255,255,.05);border-radius:4px;overflow:hidden;"><div style="height:100%;width:${Math.max(3,Math.round(v/sgMax*100))}%;background:${p[1]};border-radius:4px;"></div></div>
      <span style="font-size:11px;color:#e0edf8;font-weight:800;min-width:30px;text-align:right;">${v}일</span>
    </div>`;
  }).join('');
  const mini=(label,val,col,sub)=>`<div style="background:#060d1a;border-radius:10px;padding:11px 8px;text-align:center;"><div style="font-size:19px;font-weight:800;color:${col||'#e0edf8'};line-height:1.15;">${val}</div><div style="font-size:9.5px;color:#7a9cb8;margin-top:3px;">${label}</div>${sub?`<div style="font-size:8.5px;color:#4a7090;margin-top:1px;">${sub}</div>`:''}</div>`;
  const fmtH=h=>h>=48?(h/24).toFixed(h>=240?0:1)+'일':Math.round(h)+'시간';
  // 특보 발효 이력 목록 (선택 연도) — 자동해제·삭제분까지 로그에서 전부, 최신순
  const _logY=log.filter(r=>{const f=r.issuedAtMs||_alertTimeMs(r.issuedAt)||0;return f&&new Date(f).getFullYear()===sel;}).sort((a,b)=>(b.issuedAtMs||0)-(a.issuedAtMs||0));
  const _durTxt=ms=>ms>=86400000?Math.floor(ms/86400000)+'일'+(Math.floor((ms%86400000)/3600000)?' '+Math.floor((ms%86400000)/3600000)+'시간':''):ms>=3600000?Math.floor(ms/3600000)+'시간'+(Math.floor((ms%3600000)/60000)?' '+Math.floor((ms%3600000)/60000)+'분':''):Math.max(1,Math.floor(ms/60000))+'분';
  const _epRows=_logY.map(r=>{
    const col=_alertTypeColor(r.type);
    const st=r.issuedAtMs||_alertTimeMs(r.issuedAt)||0;
    const en=r.endedAtMs||_alertTimeMs(r.endedAt)||0;
    const act=!r.endedAtMs;
    const dur=st?((en||Date.now())-st):0;
    const period=(st?_alertMsStr(st).slice(5,16):'-')+' → '+(act?'<b style="color:#7ee0a8;">발효 중</b>':(en?_alertMsStr(en).slice(5,16):'-'));
    return `<div style="display:flex;align-items:center;gap:8px;padding:7px 2px;border-bottom:1px solid rgba(255,255,255,.04);">
      <span style="width:9px;height:9px;border-radius:50%;background:${col};flex-shrink:0;"></span>
      <span style="flex:1;min-width:0;">
        <span style="display:block;font-size:12px;font-weight:700;color:#dceaf6;">${_esc(r.type)}${_esc(_stageShort(r.stage||''))} <span style="font-size:9px;font-weight:600;color:#6a94b0;">${r.source==='auto'?'📡자동':'✋수동'}</span></span>
        <span style="display:block;font-size:9.5px;color:#5d86a3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${period} · ${_durTxt(dur)}${r.regions&&r.regions.length?' · '+_esc(r.regions.slice(0,2).join('·')):''}</span>
      </span>
    </div>`;
  }).join('');
  return `<div style="padding:2px 2px 10px;">
    <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">${years.map(v=>`<div class="pill${v===sel?' on':''}" onclick="alertStatYear(${v})">${v}년</div>`).join('')}</div>
    <div class="scard" style="margin-bottom:10px;">
      <div class="stitle">📊 ${sel}년 특보 발효 현황 <span style="font-size:9px;font-weight:400;color:#5a7e98;">· 일수 기준</span></div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">
        ${mini('특보 발효일',y.days.size+'일','#4fa8d0','연중 '+Math.round(y.days.size/yearDen*100)+'%')}
        ${top?mini('최다 특보','<span style="display:inline-flex;align-items:center;gap:5px;"><span style="width:8px;height:8px;border-radius:50%;background:'+_alertTypeColor(top.t)+';"></span>'+_esc(top.t)+'</span>','#e0edf8',top.d+'일 발효'):mini('최다 특보','-','#e0edf8')}
        ${mini('경보 이상',warnDays+'일',warnDays?'#ff6b5b':'#27ae60',warnDays?'':'경보 발효 없음')}
        ${mini('비상근무',fmtH(totalHr),'#7ee0a8',opsY.length?opsY.length+'회 운영':'')}
      </div>
    </div>
    <div class="scard" style="margin-bottom:10px;">
      <div class="stitle">🗓️ 월별 발효일수</div>
      <div style="display:flex;align-items:flex-end;gap:3px;height:90px;padding-top:4px;">${monthBars}</div>
      <div style="display:flex;gap:3px;margin-top:4px;">${monthLabels}</div>
    </div>
    ${typeRows?`<div class="scard" style="margin-bottom:10px;"><div class="stitle">🌧️ 종류별 발효일수</div>${typeRows}<div style="font-size:8.5px;color:#46708f;margin-top:6px;">같은 날 여러 특보는 종류별로 각각 1일씩 집계</div></div>`:''}
    ${sgRows?`<div class="scard" style="margin-bottom:10px;"><div class="stitle">📶 단계별 발효일수</div>${sgRows}</div>`:''}
    <div class="scard">
      <div class="stitle">🌀 ${sel}년 운영 활동</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">
        ${mini('응소 연인원',totResp+'명','#7ee0a8')}
        ${mini('관측 보고',totRep+'건','#a8cdf5')}
        ${mini('평균 운영',opsY.length?fmtH(totalHr/opsY.length):'-','#a8cdf5')}
        ${mini('최장 운영',longest?fmtH(longest/3600000):'-','#f0c060')}
      </div>
    </div>
    ${_epRows?`<div class="scard" style="margin-top:10px;"><div class="stitle">📋 ${sel}년 특보 발효 이력 <span style="font-size:9px;font-weight:400;color:#5a7e98;">· 총 ${_logY.length}건 (자동해제분 포함)</span></div><div style="max-height:300px;overflow-y:auto;margin-top:2px;">${_epRows}</div></div>`:''}
  </div>`;
}

// ── 특보운영 입력 탭 (발령·응소·관측 진입점) ──
function _renderAlertInput(active){
  const admin=isAdminUser();
  let html='<div style="padding:4px 2px 10px;">';
  if(!active){
    html+=`<div class="ao-card" style="text-align:center;padding:22px 16px;">
      <div style="font-size:34px;margin-bottom:8px;">🌀</div>
      <div style="font-size:13px;color:#9fc0da;margin-bottom:14px;">진행 중인 특보운영이 없습니다</div>
      ${admin?`<button onclick="openAlertStart()" class="ao-start-btn" style="margin:0 auto;">🌀 특보운영 시작</button>
      <div style="margin-top:10px;"><button onclick="openAlertStart(true)" class="btn2 btn2-sec btn2-sm">🎯 훈련(리허설)로 시작 — 발령→응소→관측→종료 연습 · 통계 제외</button></div>`
             :`<div style="font-size:11px;color:#456a85;">관리자가 특보운영을 시작하면<br>여기서 응소·관측을 입력할 수 있습니다</div>`}
    </div>`;
    return html+'</div>';
  }
  // 운영 중 — 발령/종료(관리자) + 분소별 빠른 입력(전원)
  const _mtIn=_alertMeasureType(active);
  const repBtnLbl=_mtIn==='snow'?'❄️ 적설보고':_mtIn==='both'?'🌧️ 적설·강우보고':'🌧️ 강우보고';
  if(admin){
    html+=`<div class="ao-card" style="margin-bottom:12px;">
      <div class="ao-sec-hd" style="margin-top:0;"><span class="bar" style="background:#ff8a80;"></span>🚨 특보 발령 · 운영${active.drill?' <span class="drill-badge">🎯 훈련</span>':''}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button onclick="openAlertStart()" class="ao-loc-btn" style="flex:1;min-width:130px;">＋ 특보 추가 발령</button>
        <button onclick="endAlertOps(${active.id})" class="ao-loc-btn" style="flex:1;min-width:130px;background:rgba(192,57,43,.14);border-color:rgba(192,57,43,.4);color:#ff8a80;">■ 운영 종료</button>
      </div>
    </div>`;
  }
  // 위기경보·탐방로 통제 빠른 버튼 (관리자)
  if(admin){
    const cl=DB.g('crisisLevel')||{};const clv=cl.level||'';
    const clColor=clv==='관심'?'#3498db':clv==='주의'?'#e6b800':clv==='경계'?'#e67e22':clv==='심각'?'#c0392b':'rgba(79,168,208,.5)';
    html+=`<div class="ao-card" style="margin-bottom:12px;">
      <div class="ao-sec-hd" style="margin-top:0;"><span class="bar" style="background:${clColor};"></span>🚨 재난위기경보${clv?` <span style="background:${clColor}26;color:${clColor};font-size:10px;font-weight:800;border-radius:6px;padding:1px 7px;margin-left:6px;">${CRISIS_LABEL[clv]||clv}${cl.type?' — '+cl.type:''}</span>`:'<span style="font-size:10px;color:#4a7090;margin-left:6px;">미설정</span>'}</div>
      <button onclick="openCrisisLevelModal()" class="ao-loc-btn" style="width:100%;border-color:${clColor}55;color:${clColor};">🚨 위기경보 단계 설정</button>
    </div>`;
    const ts=DB.g('trailStatus')||{};const ctrlCnt=Object.values(ts).filter(v=>v.status==='통제').length;
    html+=`<div class="ao-card" style="margin-bottom:12px;">
      <div class="ao-sec-hd" style="margin-top:0;"><span class="bar" style="background:#e67e22;"></span>🚧 탐방로 통제 현황${ctrlCnt?` <span style="background:rgba(231,76,60,.2);color:#ff9e80;font-size:10px;font-weight:800;border-radius:6px;padding:1px 7px;margin-left:6px;">통제 ${ctrlCnt}구간</span>`:''}</div>
      <div style="display:flex;gap:6px;">
        <button onclick="openTrailCtrl()" class="ao-loc-btn" style="flex:1;">🚧 통제/개방 관리</button>
        <button onclick="openTrailLog()" class="ao-loc-btn" style="border-color:rgba(255,255,255,.12);color:#8aa6bc;">🕑 이력</button>
      </div>
    </div>`;
  }
  // 정기 기상 브리핑 (관리자 작성 / 전원 열람)
  {
    const wb=DB.g('weatherBrief')||{};
    const fresh=wb.text&&wb.atMs&&(Date.now()-wb.atMs<6*3600*1000);
    html+=`<div class="ao-card" style="margin-bottom:12px;">
      <div class="ao-sec-hd" style="margin-top:0;"><span class="bar" style="background:#4fa8d0;"></span>🌦️ 기상 브리핑${wb.time?` <span style="font-size:10px;color:#6a94b0;font-weight:700;margin-left:6px;">${_esc(wb.time)} 기준</span>`:''}</div>
      ${wb.text?`<div style="font-size:12.5px;line-height:1.6;color:${fresh?'#cfe2f2':'#8aa6bc'};white-space:pre-wrap;padding:2px 0 4px;">${_esc(wb.text)}</div><div style="font-size:10px;color:#5a7a92;margin-bottom:6px;">— ${_esc(wb.by||'')}${fresh?'':' · ⚠️ 6시간 경과(갱신 필요)'}</div>`:`<div style="font-size:11px;color:#5a7a92;padding:2px 0 6px;">등록된 브리핑이 없습니다.</div>`}
      <div style="display:flex;gap:6px;">
        ${admin?`<button onclick="openWeatherBrief()" class="ao-loc-btn" style="flex:1;border-color:#4fa8d055;color:#4fa8d0;">✍️ 작성/갱신</button>`:''}
        <button onclick="openWeatherLog()" class="ao-loc-btn" style="${admin?'':'width:100%;'}border-color:rgba(255,255,255,.12);color:#8aa6bc;">🕑 이력</button>
      </div>
    </div>`;
  }
  // 🙋 원탭 응소 — 분소 카드보다 먼저 (내 응소는 여기서 한 번에)
  html+=_quickRespBtnHtml(active);
  // 응소는 호우·대설 특보에서만 — 그 외 특보(강풍·건조 등)는 대피소 체류인원 입력만 노출
  html+=`<div class="ao-sec-hd"><span class="bar"></span>📍 ${_mtIn?'분소별 빠른 입력':'대피소 체류인원'}</div>`;
  ALERT_GROUPS.forEach(g=>{
    g.stations.forEach(st=>{
      const isShelter=!!st.shelter;
      if(!_mtIn&&!isShelter)return; // 응소·관측 없는 특보 → 분소 카드 생략
      const cnt=(active.responders||[]).filter(r=>(r.loc||'사무소')===st.loc).length;
      const occ=isShelter?_latestOccupancy(active,st.loc):null;
      // 대피소: 직원+탐방객 체류인원 표시 / 분소: 당직자(응소인원)만 표시
      const occLine=occ?`<div style="font-size:11px;color:#7ec8a0;margin:2px 0 4px;">⛺ 직원 ${occ.staff??'-'}명 · 탐방객 ${occ.visitors??'-'}명 <span style="color:#4a7090;">${(occ.time||'').slice(11,16)}</span>${occ.note?' · '+_esc(occ.note):''}</div>`:'';
      const base=_dutyOf(st.loc);
      const cntChip=_mtIn
        ?`<span class="ao-loc-cnt ${(cnt+base)?'ok':''}">👤 ${base?`상시 ${base}`:''}${base&&cnt?' + ':''}${cnt?`응소 ${cnt}`:(base?'':'응소 0')}명</span>`
        :(base?`<span class="ao-loc-cnt ok">👤 상시 ${base}명</span>`:'');
      html+=`<div class="ao-loc-card" style="margin-bottom:8px;">
        <div class="ao-loc-hd"><b style="color:#e8f2fb;font-size:13px;">${isShelter?'⛺ ':g.ico+' '}${_esc(st.label)}</b>${cntChip}</div>
        ${occLine}
        <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">
          ${_mtIn?`<button onclick="openAddResponder(${active.id},'${st.loc}')" class="ao-loc-btn">👤 응소 등록</button>
          <button onclick="openAlertReport(${active.id},'${st.loc}')" class="ao-loc-btn rep">${repBtnLbl}</button>`:''}
          ${isShelter?`<button onclick="openAlertOcc(${active.id},'${st.loc}')" class="ao-loc-btn" style="background:rgba(46,204,113,.08);border-color:rgba(46,204,113,.3);color:#7ec8a0;">⛺ 체류인원</button>`:''}
        </div>
      </div>`;
    });
  });
  return html+'</div>';
}


function _renderAlertReqTable(level){
  const req=ALERT_REQS[level];
  if(!req)return'';
  return`<div style="margin-top:10px;font-size:10px;color:#3a6a8a;font-weight:700;margin-bottom:4px;">📋 단계별 필요 인원 (별표10)</div>
  <table class="ao-req-table">
    <tr><th>구분</th><th>역할</th><th>최소인원</th></tr>
    ${req.사무소.map(r=>`<tr><td>사무소</td><td>${r.role}</td><td>${r.min}명</td></tr>`).join('')}
    ${req.분소.map(r=>`<tr><td>분소</td><td>${r.role}</td><td>${r.min}명</td></tr>`).join('')}
  </table>`;
}

function openAlertStart(drill){
  _alertLevel='';_alertType='';
  document.querySelectorAll('#alertLevelPills .pill,#alertTypePills .pill').forEach(p=>p.classList.remove('on'));
  document.getElementById('alertStartNote').value='';
  document.getElementById('alertReqTable').innerHTML='';
  // 이미 운영 중이면 '특보 추가 발령' 모드 — 보고주기 행 숨김(이미 설정됨)
  const active=(DB.g('alertOps')||[]).find(o=>!o.closedAt);
  // 🎯 훈련(리허설) 모드: 새 운영 시작에만 적용 — 발령→푸시→응소→관측→종료 전 과정을 실제와 동일하게 연습(통계 제외)
  window._drillStart=!!drill&&!active;
  const itvRow=document.getElementById('alertItvRow');
  const startBtn=document.getElementById('alertStartBtn');
  const title=document.getElementById('alertStartTitle');
  if(active){
    if(itvRow)itvRow.style.display='none';
    if(startBtn)startBtn.textContent=active.drill?'🎯 훈련 특보 추가':'🚨 특보 추가 발령';
    if(title)title.textContent=active.drill?'🎯 훈련 특보 추가 발령':'🚨 특보 추가 발령';
  }else{
    if(itvRow)itvRow.style.display='';
    _reportInterval=60;
    document.querySelectorAll('#alertItvPills .pill').forEach(p=>p.classList.toggle('on',p.textContent==='1시간'));
    if(startBtn)startBtn.textContent=window._drillStart?'🎯 훈련 시작':'🌀 특보운영 시작';
    if(title)title.textContent=window._drillStart?'🎯 특보 대응 훈련 시작':'🌀 특보운영 시작';
  }
  document.getElementById('modalAlertStart').classList.add('on');
}
function selAlertLevel(el,v){
  document.querySelectorAll('#alertLevelPills .pill').forEach(p=>p.classList.remove('on'));
  el.classList.add('on');_alertLevel=v;
  document.getElementById('alertReqTable').innerHTML=_renderAlertReqTable(v);
}
function selAlertType(el,v){
  document.querySelectorAll('#alertTypePills .pill').forEach(p=>p.classList.remove('on'));
  el.classList.add('on');_alertType=v;
}
function selReportItv(el,v){document.querySelectorAll('#alertItvPills .pill').forEach(p=>p.classList.remove('on'));el.classList.add('on');_reportInterval=v;}
function startAlertOps(){
  if(!_alertLevel){toast('단계를 선택하세요');return;}
  if(!_alertType){toast('특보 종류를 선택하세요');return;}
  const ops=DB.g('alertOps')||[];
  let active=ops.find(o=>!o.closedAt);
  const note=document.getElementById('alertStartNote').value.trim();
  if(active){
    active.alerts=active.alerts||_opAlerts(active);
    const _dPre=active.drill?'🎯 【훈련】 ':''; // 훈련 운영 중 추가 발령·변경도 훈련으로 표기
    // 같은 종류가 이미 발령돼 있으면 → 단계만 변경(경보↔주의보 상향·하향). 같은 단계면 무시.
    const dup=active.alerts.find(a=>a.type===_alertType);
    if(dup){
      if(dup.stage===_alertLevel){toast('⚠️ 이미 같은 단계로 발령됨: '+_alertType+_stageShort(dup.stage));return;}
      const wasUp=_stageRank(_alertLevel)>_stageRank(dup.stage);
      const prevStage=dup.stage;
      dup.stage=_alertLevel;dup.source='manual';dup.issuedAt=now();dup.issuedAtMs=Date.now();dup.by=getAuthor();
      if(active.drill)dup.drill=true;
      if(note)active.note=note;
      try{_alertLogSyncStage(dup,active.id);}catch(e){}
      DB.s('alertOps',ops);
      closeM('modalAlertStart');
      pushNoti(_dPre+(wasUp?'🔺 특보 상향: ':'🔻 특보 하향: ')+_alertType+' '+_stageShort(prevStage)+'→'+_stageShort(_alertLevel),'🚨','op_change',{app:'alert'});
      toast((wasUp?'🔺 상향: ':'🔻 하향: ')+_alertType+' '+_stageShort(prevStage)+'→'+_stageShort(_alertLevel));
      renderAlertView();updateSummary();
      return;
    }
    {const _na={type:_alertType,stage:_alertLevel,source:'manual',issuedAt:now(),issuedAtMs:Date.now(),by:getAuthor(),regions:_liveRegionsOf(_alertType)};if(active.drill)_na.drill=true;active.alerts.push(_na);try{_alertLogSyncStage(_na,active.id);}catch(e){}}
    if(note)active.note=note;
    DB.s('alertOps',ops);
    closeM('modalAlertStart');
    pushNoti(_dPre+'🚨 특보 추가 발령: '+_alertType+_stageShort(_alertLevel),'🚨','op_change',{app:'alert'});
    toast('🚨 특보 발령: '+_alertType+_stageShort(_alertLevel));
    renderAlertView();updateSummary();
    return;
  }
  // 신규 특보운영 세션 생성 (훈련 모드면 drill 표시 — 알림·화면에 【훈련】 명시, 통계 제외)
  const _drill=!!window._drillStart;window._drillStart=false;
  {const _a1={type:_alertType,stage:_alertLevel,source:'manual',issuedAt:now(),issuedAtMs:Date.now(),by:getAuthor(),regions:_liveRegionsOf(_alertType)};if(_drill)_a1.drill=true;
   const _op={id:Date.now(),alerts:[_a1],note,startedAt:now(),startedAtMs:Date.now(),reportInterval:_reportInterval||60,closedAt:null,responders:[],reports:[],createdBy:getAuthor()};if(_drill)_op.drill=true;
   ops.push(_op);try{_alertLogSyncStage(_op.alerts[0],_op.id);}catch(e){}}
  DB.s('alertOps',ops);
  closeM('modalAlertStart');
  if(typeof _hapt==='function')_hapt(20);
  pushNoti((_drill?'🎯 【훈련】 특보운영 시작: ':'🌀 특보운영 시작: ')+_alertType+_stageShort(_alertLevel),_drill?'🎯':'🌀','op_start',{app:'alert'});
  toast(_drill?'🎯 훈련 시작 — 실제와 동일하게 응소·관측을 진행하세요':'🌀 특보운영 시작');
  _startAlertReminder();
  renderAlertView();updateSummary();
}
// 발령된 개별 특보 해제 (마지막 특보 해제 시에도 세션은 유지 — 종료는 '종료' 버튼)
function removeAlertItem(opId,idx){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const ops=DB.g('alertOps')||[];
  const op=ops.find(o=>o.id===opId);
  if(!op)return;
  op.alerts=op.alerts||_opAlerts(op);
  const rm=op.alerts[idx];
  if(!rm)return;
  if(!confirm((rm.type+_stageShort(rm.stage))+' 특보를 해제하겠습니까?'))return;
  try{_alertLogEnd(rm,op.id,'수동 해제');}catch(e){}
  op.alerts.splice(idx,1);
  DB.s('alertOps',ops);
  toast('해제: '+rm.type+_stageShort(rm.stage));
  renderAlertView();updateSummary();
}
// ══════════════════════════════════════════
// 특보 발효 이력 로그 (append-only) — 통계용 영구 기록
// ══════════════════════════════════════════
// 문제: 자동해제·수동해제 시 특보가 alertOps에서 삭제돼 기록이 사라짐 → 통계가 실제보다 적게 나옴.
// 해결: 발효된 특보 '한 건(episode)'마다 발효~해제 구간을 alertLog에 영구 저장. 삭제해도 로그는 남음.
// 레코드: {id,opId,type,stage(최종),maxRank,source,issuedAtMs/issuedAt,endedAtMs/endedAt(null=발효중),endedReason,regions}
function _alertLog(){return DB.g('alertLog')||[];}
// 새 특보 episode 시작 → open 레코드 추가, id 반환(alert._logId로 연결)
function _alertLogOpen(opId,a){
  const log=_alertLog();
  const id='L'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36);
  const _rec={id,opId:opId,type:a.type,stage:a.stage,maxRank:_stageRank(a.stage),source:a.source||'manual',
    issuedAtMs:a.issuedAtMs||Date.now(),issuedAt:a.issuedAt||now(),endedAtMs:null,endedAt:null,endedReason:'',regions:(a.regions||[]).slice()};
  if(a.drill)_rec.drill=true; // 훈련 발령분 — 통계 집계 제외 표시
  log.push(_rec);
  DB.s('alertLog',log);
  return id;
}
// 발효 중 episode의 단계·지역 반영 (연결 안 돼 있으면 새로 오픈) — 발령·단계변경 공용, 멱등
function _alertLogSyncStage(a,opId){
  if(!a||!a.type)return;
  const log=_alertLog();
  let r=a._logId?log.find(x=>x.id===a._logId&&!x.endedAtMs):null;
  if(!r)r=log.find(x=>x.opId===opId&&x.type===a.type&&!x.endedAtMs);
  if(!r){a._logId=_alertLogOpen(opId,a);return;}
  r.stage=a.stage;r.maxRank=Math.max(r.maxRank||0,_stageRank(a.stage));
  if(a.regions&&a.regions.length)r.regions=a.regions.slice();
  a._logId=r.id;DB.s('alertLog',log);
}
// episode 종료 기록 (자동해제·수동해제)
function _alertLogEnd(a,opId,reason){
  if(!a)return;
  const log=_alertLog();
  let r=a._logId?log.find(x=>x.id===a._logId&&!x.endedAtMs):null;
  if(!r)r=log.find(x=>x.opId===opId&&x.type===a.type&&!x.endedAtMs);
  if(!r)return;
  r.endedAtMs=Date.now();r.endedAt=now();r.endedReason=reason||'';DB.s('alertLog',log);
}
// 운영 종료 → 그 op의 열린 episode 전부 종료
function _alertLogEndOp(opId,reason){
  const log=_alertLog();let ch=false;
  log.forEach(r=>{if(r.opId===opId&&!r.endedAtMs){r.endedAtMs=Date.now();r.endedAt=now();r.endedReason=reason||'';ch=true;}});
  if(ch)DB.s('alertLog',log);
}
// 기존 alertOps → alertLog 1회 백필 (지금 남아있는 특보만 복구 가능; 이후로는 삭제돼도 로그 유지)
// 결정적 id(op.id+인덱스) + 존재검사로 멱등 — 다른 기기가 먼저 백필해 동기화돼 있어도 중복 안 쌓임
function _migrateAlertLog(){
  if(DB.g('_alertLogMigrated'))return;
  const ops=DB.g('alertOps')||[];
  const log=DB.g('alertLog')||[];
  const have={};log.forEach(r=>{if(r&&r.id)have[r.id]=1;});
  let added=false,opsChanged=false;
  ops.forEach((o,oi)=>{
    const active=!o.closedAt;
    _opAlerts(o).forEach((a,i)=>{
      const id='L'+(o.id||('op'+oi))+'_'+i;
      if(have[id])return; // 이미(다른 기기에서 동기화돼) 있음 → 건너뜀
      const rec={id,opId:o.id,type:a.type,stage:a.stage,maxRank:_stageRank(a.stage),
        source:a.source||'manual',
        issuedAtMs:a.issuedAtMs||_alertTimeMs(a.issuedAt)||o.startedAtMs||_alertTimeMs(o.startedAt)||0,
        issuedAt:a.issuedAt||o.startedAt||'',
        endedAtMs:active?null:(o.closedAtMs||_alertTimeMs(o.closedAt)||null),
        endedAt:active?null:(o.closedAt||null),
        endedReason:active?'':'운영 종료',regions:(a.regions||[]).slice()};
      if(o.drill||a.drill)rec.drill=true;
      log.push(rec);have[id]=1;added=true;
      if(active&&o.alerts){const orig=o.alerts[i];if(orig&&!orig._logId){orig._logId=id;opsChanged=true;}}
    });
  });
  if(added)DB.s('alertLog',log);
  if(opsChanged)DB.s('alertOps',ops);
  DB.s('_alertLogMigrated',1);
}
// 기상청 발효 특보 자동 동기화 (공식 발효 특보 수신 시에만 호출됨 — 빈 목록=공식 '특보 없음')
//  · 신규 종류 → 자동 발령   · 자동발령분 단계 변경(경보↔주의보 자동 하향·상향)   · 기상청에서 사라진 자동분 → 자동 해제
//  · 수동(✋) 발령분은 절대 건드리지 않음. 전체 운영 종료는 관리자 수동(자동 종료 안 함).
function _syncAutoAlerts(liveList){
  try{_migrateAlertLog();}catch(e){}
  liveList=liveList||[];
  const ops=DB.g('alertOps')||[];
  let active=ops.find(o=>!o.closedAt);
  if(!active&&!liveList.length)return;            // 운영도 없고 특보도 없음 → 무동작
  // 🎯 훈련 운영 중 '실제' 특보가 발효되면 → 훈련을 자동 종료하고 실제 운영으로 전환 (실전 우선)
  if(active&&active.drill){
    if(!liveList.length)return; // 실제 특보 없음 → 훈련은 계속 (기상청 '없음' 응답으로 훈련을 끝내지 않음)
    active.closedAt=now();active.closedAtMs=Date.now();
    try{_alertLogEndOp(active.id,'실제 특보 발효 — 훈련 자동 종료');}catch(e){}
    pushNoti('🎯 훈련 자동 종료 — 실제 기상특보 발효로 전환됩니다','📡','op_kma',{app:'alert'});
    active=null;
  }
  let created=false;
  if(!active){
    if(!liveList.length)return;
    active={id:Date.now(),alerts:[],note:'',startedAt:now(),startedAtMs:Date.now(),reportInterval:60,closedAt:null,responders:[],reports:[],createdBy:'자동(기상청)'};
    ops.push(active);created=true;
  }
  active.alerts=active.alerts||_opAlerts(active);
  const liveByType={};liveList.forEach(a=>{liveByType[a.type]=a;});
  const added=[],changed=[],removed=[];let timeFixed=false;
  // 1) 추가 + 자동분 단계 동기화 — 시각은 기상청 발효시각(TM_EF) 우선, 없으면 감지 시각
  //    (뒤늦게 접속해 감지해도 '16:00 발효'처럼 실제 발효 시각으로 기록되도록)
  liveList.forEach(a=>{
    const ex=active.alerts.find(x=>x.type===a.type);
    const efMs=a.issuedAtMs||0,ms=efMs||Date.now(),fcMs=a.announcedAtMs||0;
    const efTag=efMs?'('+_alertMsShort(efMs)+(efMs>Date.now()?' 발효 예정':' 발효')+')':''; // 미래 발효(예: 17시 발표→18시 발효) 구분
    if(!ex){const _na={type:a.type,stage:a.stage,source:'auto',issuedAt:_alertMsStr(ms),issuedAtMs:ms,announcedAt:fcMs?_alertMsStr(fcMs):'',announcedAtMs:fcMs,regions:a.regions||[]};active.alerts.push(_na);added.push(a.type+_stageShort(a.stage)+efTag);try{_alertLogSyncStage(_na,active.id);}catch(e){}}
    else if(ex.source==='auto'&&ex.stage!==a.stage){const prev=ex.stage;ex.stage=a.stage;ex.issuedAt=_alertMsStr(ms);ex.issuedAtMs=ms;if(fcMs){ex.announcedAt=_alertMsStr(fcMs);ex.announcedAtMs=fcMs;}ex.regions=a.regions||ex.regions||[];changed.push(a.type+' '+_stageShort(prev)+'→'+_stageShort(a.stage)+efTag);try{_alertLogSyncStage(ex,active.id);}catch(e){}}
    else if(ex.source==='auto'&&((efMs&&Math.abs((ex.issuedAtMs||0)-efMs)>60000)||(fcMs&&Math.abs((ex.announcedAtMs||0)-fcMs)>60000))){ // 감지 시각으로 기록됐던 기존 건을 실제 발효·발표시각으로 조용히 보정
      if(efMs){ex.issuedAt=_alertMsStr(efMs);ex.issuedAtMs=efMs;}
      if(fcMs){ex.announcedAt=_alertMsStr(fcMs);ex.announcedAtMs=fcMs;}
      timeFixed=true;
    }
  });
  // 2) 자동분 중 기상청에서 해제된 종류 → 자동 해제 (수동분 보존). 삭제 전 이력 로그에 해제 기록.
  active.alerts=active.alerts.filter(x=>{
    if(x.source==='auto'&&!liveByType[x.type]){removed.push(x.type+_stageShort(x.stage));try{_alertLogEnd(x,active.id,'기상청 해제');}catch(e){}return false;}
    return true;
  });
  if(!created&&!added.length&&!changed.length&&!removed.length&&!timeFixed)return; // 변경 없음
  DB.s('alertOps',ops);
  // 지난 운영 세션의 중복방지·리마인드 키 청소 (localStorage 무한 누적 방지)
  try{
    for(let i=localStorage.length-1;i>=0;i--){
      const k=localStorage.key(i);if(!k)continue;
      if((k.indexOf('_aoAuto_')===0&&k.indexOf('_aoAuto_'+active.id)!==0)||(k.indexOf('_aoRemind_')===0&&k.indexOf('_aoRemind_'+active.id)!==0))localStorage.removeItem(k);
    }
  }catch(e){}
  if(active.alerts.length)_startAlertReminder();
  // 기기별 1회만 알림 (중복 푸시 방지)
  const sig=active.id+'|'+added.join(',')+'|'+changed.join(',')+'|'+removed.join(',');
  if((added.length||changed.length||removed.length)&&localStorage.getItem('_aoAuto_'+sig)!=='1'){
    localStorage.setItem('_aoAuto_'+sig,'1');
    let msg=[];
    if(added.length)msg.push('🌀 자동발령 '+added.join(', '));
    if(changed.length)msg.push('🔻 단계변경 '+changed.join(', '));
    if(removed.length)msg.push('✅ 자동해제 '+removed.join(', '));
    pushNoti('📡 기상특보 '+msg.join(' / '),'📡','op_kma',{app:'alert'});
  }
  if(window.curApp==='alert')renderAlertView();
  updateSummary();
}
// ── 체류인원 ──
// ── 위기경보 단계 배너 ──
// 국가재난위기경보 4단계: 관심(파랑) → 주의(노랑) → 경계(주황) → 심각(빨강)
const CRISIS_LEVELS=['관심','주의','경계','심각'];
const CRISIS_LABEL={'관심':'🔵 관심','주의':'🟡 주의','경계':'🟠 경계','심각':'🔴 심각'};
const CRISIS_TYPE_OPTS=['호우','강풍','대설','산사태','복합'];
function _updateCrisisBanner(){
  const cl=DB.g('crisisLevel')||{};
  const lvl=cl.level||'';
  const type=cl.type||'';
  const text=lvl?`${CRISIS_LABEL[lvl]||lvl} | 재난위기경보${type?' — '+type:''}  (${(cl.updatedAt||'').slice(5,16)})`:'';
  ['crisisBanner','boardCrisisBanner'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    el.className='crisis-banner'+(lvl?' on crisis-'+lvl:'');
    el.innerHTML=lvl?text+'(클릭: 해제 또는 변경)':'';
    if(lvl&&isAdminUser())el.onclick=()=>openCrisisLevelModal();
    else el.onclick=null;
  });
}
function openCrisisLevelModal(){
  const cl=DB.g('crisisLevel')||{};
  const html=`<div style="padding:6px 0;">
    <div style="font-size:12px;color:#7a9cb8;margin-bottom:14px;">산사태·기상재해 국가위기경보 단계를 설정하세요. 전 기기 즉시 표시됩니다.</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
      ${CRISIS_LEVELS.map(l=>`<button onclick="setCrisisLevel('${l}')" style="flex:1;min-width:60px;padding:10px 4px;border-radius:10px;border:2px solid ${l==='관심'?'#3498db':l==='주의'?'#f1c40f':l==='경계'?'#e67e22':'#c0392b'};background:${l===(cl.level||'')?'rgba(255,255,255,.1)':'transparent'};color:${l==='주의'?'#f1c40f':l==='관심'?'#3498db':l==='경계'?'#e67e22':'#c0392b'};font-size:14px;font-weight:900;cursor:pointer;">${CRISIS_LABEL[l]||l}</button>`).join('')}
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">
      ${CRISIS_TYPE_OPTS.map(t=>`<div class="pill${(cl.type||'')===''+t?' on':''}" onclick="this.parentNode.querySelectorAll('.pill').forEach(p=>p.classList.remove('on'));this.classList.add('on');window._crisisTypeTemp='${t}';">${t}</div>`).join('')}
    </div>
    <button onclick="clearCrisisLevel()" style="width:100%;padding:9px;border-radius:9px;border:1px solid rgba(255,255,255,.15);background:transparent;color:rgba(255,255,255,.4);font-size:12px;cursor:pointer;">✕ 위기경보 해제</button>
  </div>`;
  window._crisisTypeTemp=cl.type||'';
  const modal=document.createElement('div');
  modal.id='crisisModal';modal.className='modal on';
  modal.innerHTML=`<div class="mbox"><div class="mhdr"><span class="mtitle">🚨 재난위기경보 설정</span><button class="mclose" onclick="document.getElementById('crisisModal').remove()">×</button></div>${html}</div>`;
  document.body.appendChild(modal);
}
function setCrisisLevel(level){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const type=window._crisisTypeTemp||'';
  DB.s('crisisLevel',{level,type,updatedAt:now(),by:getAuthor()});
  const el=document.getElementById('crisisModal');if(el)el.remove();
  _updateCrisisBanner();
  pushNoti(`🚨 재난위기경보 ${CRISIS_LABEL[level]||level} 발령${type?' — '+type:''}`, '🚨','crisis',{app:'alert'});
  toast(`🚨 위기경보 ${level} 설정`);
  // 심각/경계 단계는 전 탐방로 통제 연동 제안
  if((level==='심각'||level==='경계')){
    const ts=DB.g('trailStatus')||{};
    const openCnt=SEORAK_TRAILS.filter(t=>((ts[t.id]||{}).status||'개방')!=='통제').length;
    if(openCnt>0&&confirm(`🚨 ${level} 단계입니다.\n현재 미통제 ${openCnt}개 구간을 전부 '통제'로 전환하시겠습니까?`)){
      SEORAK_TRAILS.forEach(t=>{ts[t.id]={status:'통제',time:now(),at:Date.now(),by:getAuthor(),note:`위기경보 ${level} 일괄통제`};});
      DB.s('trailStatus',ts);
      pushNoti(`🚧 위기경보 ${level} 연동 — 전 탐방로 통제`,'🚧','trail',{app:'alert'});
      toast('🚧 전 탐방로 통제 완료');
    }
  }
}
function clearCrisisLevel(){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  DB.s('crisisLevel',null);
  const el=document.getElementById('crisisModal');if(el)el.remove();
  _updateCrisisBanner();
  toast('✅ 위기경보 해제');
}
// ── 정기 기상 브리핑 ──
function openWeatherBrief(){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const wb=DB.g('weatherBrief')||{};
  const tmpl=wb.text||'■ 현재: \n■ 강수: \n■ 풍속: \n■ 전망: \n■ 조치사항: ';
  const modal=document.createElement('div');
  modal.id='wbModal';modal.className='modal on';
  modal.innerHTML=`<div class="mbox"><div class="mhdr"><span class="mtitle">🌦️ 기상 브리핑 작성</span><button class="mclose" onclick="document.getElementById('wbModal').remove()">×</button></div>
    <div style="font-size:11px;color:#6a94b0;margin-bottom:8px;">전 직원·응소자에게 즉시 공유됩니다. 정기(예: 04:30·16:30) 갱신 권장.</div>
    <textarea id="wbText" class="fi" style="min-height:160px;line-height:1.6;font-size:13px;resize:vertical;">${_esc(tmpl)}</textarea>
    <button class="btn btn-primary" style="margin-top:10px;" onclick="saveWeatherBrief()">📢 브리핑 게시</button>
  </div>`;
  document.body.appendChild(modal);
}
function saveWeatherBrief(){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const text=(document.getElementById('wbText').value||'').trim();
  if(!text){toast('내용을 입력하세요');return;}
  const entry={text,time:now(),atMs:Date.now(),by:getAuthor()};
  DB.s('weatherBrief',entry);
  // 이력 누적 (사후 보고서·추이 확인용, 최근 60건 유지)
  const log=DB.g('weatherLog')||[];
  log.unshift(entry);
  DB.s('weatherLog',log.slice(0,60));
  const el=document.getElementById('wbModal');if(el)el.remove();
  pushNoti('🌦️ 기상 브리핑 갱신','🌦️','weather',{app:'alert'});
  toast('📢 기상 브리핑 게시');
  renderAlertView();
}
// 기상 브리핑 이력 열람 — 온디맨드 문서: 열 때 서버에서 1회 읽음(평시 실시간 구독 없음)
function openWeatherLog(_fresh){
  if(!_fresh&&typeof _refreshDoc==='function'){_refreshDoc('weatherLog').then(()=>openWeatherLog(true));return;}
  const log=DB.g('weatherLog')||[];
  const modal=document.createElement('div');
  modal.id='wbLogModal';modal.className='modal on';
  modal.innerHTML=`<div class="mbox"><div class="mhdr"><span class="mtitle">🌦️ 기상 브리핑 이력 <span style="font-size:11px;color:#6a94b0;font-weight:600;">(${log.length}건)</span></span><button class="mclose" onclick="document.getElementById('wbLogModal').remove()">×</button></div>
    <div style="max-height:60vh;overflow-y:auto;">
    ${log.length?log.map(e=>`<div style="background:#060d1a;border-radius:9px;padding:10px 12px;margin-bottom:7px;border:1px solid rgba(79,168,208,.12);">
      <div style="font-size:10px;color:#4fa8d0;font-weight:700;margin-bottom:5px;">${_esc(e.time||'')}${e.by?` · ${_esc(e.by)}`:''}</div>
      <div style="font-size:12px;color:#cfe2f2;line-height:1.6;white-space:pre-wrap;">${_esc(e.text||'')}</div>
    </div>`).join(''):'<div style="text-align:center;color:#6a94b0;font-size:12px;padding:24px;">기록된 브리핑이 없습니다.</div>'}
    </div>
  </div>`;
  document.body.appendChild(modal);
}
function _latestOccupancy(op,loc){
  const list=(op.occupancy||[]).filter(o=>o.loc===loc);
  if(!list.length)return null;
  return list.reduce((a,b)=>(b.at||0)>(a.at||0)?b:a);
}
let _occOpId=null,_occLoc='';
function openAlertOcc(opId,presetLoc){
  _occOpId=opId;_occLoc=presetLoc||'';
  const $=id=>document.getElementById(id);
  if(!$('modalAlertOcc')){toast('⚠️ 화면 로딩 중 — 다시 시도');return;} // DOM 미로드 방어
  if($('occOpId'))$('occOpId').value=opId;
  if($('occLoc'))$('occLoc').value=presetLoc||'';
  if($('occLocDisplay'))$('occLocDisplay').textContent=presetLoc?_stationLabel(presetLoc):'관측소 미지정';
  ['occStaff','occVisitors','occNote'].forEach(id=>{if($(id))$(id).value='';});
  $('modalAlertOcc').classList.add('on');
  setTimeout(()=>{const el=$('occStaff');if(el)el.focus();},200);
}
function addAlertOccupancy(){
  const opId=parseInt(document.getElementById('occOpId').value)||_occOpId;
  const loc=document.getElementById('occLoc').value||_occLoc;
  if(!loc){toast('거점 정보가 없습니다');return;}
  const staff=document.getElementById('occStaff').value.trim();
  const visitors=document.getElementById('occVisitors').value.trim();
  if(staff===''&&visitors===''){toast('직원 또는 탐방객 수를 입력하세요');return;}
  const ops=DB.g('alertOps')||[];
  const idx=ops.findIndex(o=>o.id===opId);
  if(idx===-1){toast('운영 기록을 찾을 수 없습니다');return;}
  if(!ops[idx].occupancy)ops[idx].occupancy=[];
  ops[idx].occupancy.push({
    id:Date.now(),loc,
    staff:staff!==''?parseInt(staff):null,
    visitors:visitors!==''?parseInt(visitors):null,
    note:document.getElementById('occNote').value.trim(),
    time:now(),at:Date.now(),by:getAuthor()
  });
  DB.s('alertOps',ops);
  closeM('modalAlertOcc');
  toast('👥 '+_stationLabel(loc)+' 체류인원 보고 완료');
  renderAlertView();
}

// ── 탐방로 통제 ──
// 설악산 주요 탐방로 구간 목록
const SEORAK_TRAILS=[
  {id:'baekdam-bongjeongam',  name:'백담사 → 봉정암',       zone:'백담'},
  {id:'sogong-biseon',        name:'소공원 → 비선대',       zone:'소공원'},
  {id:'biseon-yangpok',       name:'비선대 → 양폭대피소',   zone:'소공원'},
  {id:'yangpok-bongjeongam',  name:'양폭 → 봉정암',         zone:'소공원'},
  {id:'daecheong-heunun',     name:'대청봉 → 희운각 대피소',zone:'대청'},
  {id:'osaek-daecheong',      name:'오색 → 대청봉',         zone:'오색'},
  {id:'osaek-pokpo',          name:'오색 → 설악폭포',       zone:'오색'},
  {id:'hangyeryeong-daecheong',name:'한계령 → 끝청봉',      zone:'한계령'},
  {id:'jujeongol',            name:'주전골',                zone:'오색'},
  {id:'cable-gwongumseong',   name:'케이블카 → 권금성',     zone:'소공원'},
  {id:'nahan-toyang',         name:'나한봉 → 토왕성폭포전망대',zone:'소공원'},
  {id:'ulsan-bawi',           name:'소공원 → 울산바위',     zone:'소공원'},
  {id:'heullimgol',           name:'흘림골',                zone:'오색'},
  {id:'olsanbawi-biseon',     name:'울산바위 → 비선대',     zone:'소공원'},
];
const TRAIL_STATUS_OPTS=['개방','주의','통제'];
const TRAIL_STATUS_COLORS={'개방':'#27ae60','주의':'#e67e22','통제':'#c0392b'};
function openTrailCtrl(){
  const ts=DB.g('trailStatus')||{};
  const zones=[...new Set(SEORAK_TRAILS.map(t=>t.zone))];
  let html='';
  zones.forEach(z=>{
    html+=`<div style="font-size:10px;color:#5a8aa0;font-weight:800;letter-spacing:.5px;margin:10px 0 4px;">${z.toUpperCase()} 구간</div>`;
    SEORAK_TRAILS.filter(t=>t.zone===z).forEach(t=>{
      const cur=(ts[t.id]||{}).status||'개방';
      html+=`<div style="display:flex;align-items:center;gap:6px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04);">
        <div style="flex:1;font-size:12px;color:#cfe2f2;">${_esc(t.name)}</div>
        <div style="display:flex;gap:4px;">${TRAIL_STATUS_OPTS.map(s=>`<button onclick="this.closest('.trow')._sel='${s}';this.parentNode.querySelectorAll('button').forEach(b=>b.classList.remove('on'));this.classList.add('on')" class="ao-loc-btn tst${cur===s?' on':''}" data-tid="${t.id}" data-st="${s}" style="font-size:10px;padding:3px 8px;min-width:0;background:${cur===s?TRAIL_STATUS_COLORS[s]+'26':'rgba(255,255,255,.04)'};border-color:${cur===s?TRAIL_STATUS_COLORS[s]:'rgba(255,255,255,.1)'};color:${cur===s?TRAIL_STATUS_COLORS[s]:'rgba(255,255,255,.4)'}">${s}</button>`).join('')}</div>
      </div>`;
    });
  });
  document.getElementById('trailCtrlBody').innerHTML=html;
  document.getElementById('trailCtrlNote').value='';
  document.getElementById('modalTrailCtrl').classList.add('on');
}
// 모달 내 전 구간 상태를 한 번에 선택(저장 전 미리보기, '저장' 눌러야 반영)
function _trailBatch(st){
  document.querySelectorAll('#trailCtrlBody .trow, #trailCtrlBody [data-tid]').forEach(()=>{});
  document.querySelectorAll('#trailCtrlBody > div').forEach(row=>{
    const btns=row.querySelectorAll('button[data-tid]');
    btns.forEach(b=>{
      const on=b.dataset.st===st;
      b.classList.toggle('on',on);
      const c=TRAIL_STATUS_COLORS[b.dataset.st];
      b.style.background=on?c+'26':'rgba(255,255,255,.04)';
      b.style.borderColor=on?c:'rgba(255,255,255,.1)';
      b.style.color=on?c:'rgba(255,255,255,.4)';
    });
  });
  toast(`전 구간 '${st}' 선택 — 저장을 눌러 반영`);
}
function saveTrailCtrl(){
  const ts=DB.g('trailStatus')||{};
  const note=document.getElementById('trailCtrlNote').value.trim();
  const changes=[]; // 변경된 구간만 이력에 기록 (언제·누가·왜)
  document.querySelectorAll('#trailCtrlBody button[data-tid].on').forEach(btn=>{
    const tid=btn.dataset.tid,st=btn.dataset.st;
    const prev=(ts[tid]||{}).status||'개방';
    if(prev!==st){const tn=(SEORAK_TRAILS.find(t=>t.id===tid)||{}).name||tid;changes.push({name:tn,from:prev,to:st});}
    ts[tid]={status:st,time:now(),at:Date.now(),by:getAuthor(),note};
  });
  // 버튼 미클릭 = 기존 상태 유지; 없는 구간은 개방으로
  SEORAK_TRAILS.forEach(t=>{if(!ts[t.id])ts[t.id]={status:'개방',time:now(),at:Date.now(),by:'초기'};});
  DB.s('trailStatus',ts);
  // 변경 이력 누적 (민원·법적 대응용, 최근 100건)
  if(changes.length){
    const log=DB.g('trailLog')||[];
    log.unshift({time:now(),atMs:Date.now(),by:getAuthor(),note,changes});
    DB.s('trailLog',log.slice(0,100));
  }
  closeM('modalTrailCtrl');
  const ctrlCnt=Object.values(ts).filter(v=>v.status==='통제').length;
  const warnCnt=Object.values(ts).filter(v=>v.status==='주의').length;
  toast(`🚧 통제 ${ctrlCnt}구간 · 주의 ${warnCnt}구간 저장`);
  if(ctrlCnt>0)pushNoti(`🚧 탐방로 통제 ${ctrlCnt}구간 설정`,'🚧','trail',{app:'alert'});
  renderAlertView();updateSummary();
}
// 탐방로 통제 변경 이력 열람 — 온디맨드 문서: 열 때 서버에서 1회 읽음
function openTrailLog(_fresh){
  if(!_fresh&&typeof _refreshDoc==='function'){_refreshDoc('trailLog').then(()=>openTrailLog(true));return;}
  const log=DB.g('trailLog')||[];
  const SC=TRAIL_STATUS_COLORS;
  const modal=document.createElement('div');
  modal.id='trailLogModal';modal.className='modal on';
  modal.innerHTML=`<div class="mbox"><div class="mhdr"><span class="mtitle">🚧 통제 변경 이력 <span style="font-size:11px;color:#6a94b0;font-weight:600;">(${log.length}건)</span></span><button class="mclose" onclick="document.getElementById('trailLogModal').remove()">×</button></div>
    <div style="max-height:60vh;overflow-y:auto;">
    ${log.length?log.map(e=>`<div style="background:#060d1a;border-radius:9px;padding:10px 12px;margin-bottom:7px;border:1px solid rgba(230,126,34,.15);">
      <div style="font-size:10px;color:#e67e22;font-weight:700;margin-bottom:5px;">${_esc(e.time||'')} · ${_esc(e.by||'')}${e.note?` <span style="color:#8aa6bc;font-weight:400;">— ${_esc(e.note)}</span>`:''}</div>
      ${(e.changes||[]).map(c=>`<div style="font-size:11.5px;color:#cfe2f2;line-height:1.7;">${_esc(c.name)}: <span style="color:${SC[c.from]||'#888'};">${_esc(c.from)}</span> → <span style="color:${SC[c.to]||'#888'};font-weight:700;">${_esc(c.to)}</span></div>`).join('')}
    </div>`).join(''):'<div style="text-align:center;color:#6a94b0;font-size:12px;padding:24px;">변경 이력이 없습니다.</div>'}
    </div>
  </div>`;
  document.body.appendChild(modal);
}
function endAlertOps(id){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const _op=(DB.g('alertOps')||[]).find(o=>o.id===id);
  const _n=_op?(_op.alerts||_opAlerts(_op)).length:0;
  // 특보가 여러 건이면 전체 종료 대신 개별 해제(×)·단계 하향이 가능함을 안내
  const _msg=_n>1
    ? '⚠️ 현재 '+_n+'건의 특보가 발령 중입니다.\n\n일부만 해제하려면 [취소] 후 각 특보의 ×(해제) 또는 특보 추가 발령으로 단계 하향(경보→주의보)을 하세요.\n\n전체 특보운영을 종료하시겠습니까?'
    : '특보운영을 종료하겠습니까?';
  if(!confirm(_msg))return;
  const ops=DB.g('alertOps')||[];
  const idx=ops.findIndex(o=>o.id===id);
  if(idx===-1)return;
  ops[idx].closedAt=now();
  ops[idx].closedAtMs=Date.now();
  const _wasDrill=!!ops[idx].drill;
  try{_alertLogEndOp(id,_wasDrill?'훈련 종료':'운영 종료');}catch(e){} // 남아있던 발효 특보 전부 이력에 종료 기록
  DB.s('alertOps',ops);
  _stopAlertReminder();
  pushNoti(_wasDrill?'🎯 【훈련】 특보 대응 훈련 종료':'✅ 특보운영 종료',_wasDrill?'🎯':'✅','op_end',{app:'alert'});
  toast(_wasDrill?'🎯 훈련 종료 — 수고하셨습니다 (기록은 보관함에서 열람, 통계 제외)':'✅ 특보운영 종료');
  renderAlertView();
}
// ── 특보운영 기간 중 발생한 안전사고(구조) 기록 찾기 ──
function _incidentsInOp(op){
  if(!op)return[];
  const res=DB.g('rescues')||[];
  const s=op.startedAtMs||(op.startedAt?Date.parse(op.startedAt.replace(' ','T')):0);
  const e=op.closedAtMs||(op.closedAt?Date.parse(op.closedAt.replace(' ','T')):Date.now());
  return res.filter(r=>{
    if(op.id&&r.alertOpId===op.id)return true;          // 명시적 연결 우선
    if(r.alertOpId&&r.alertOpId!==op.id)return false;   // 다른 운영에 연결됨
    if(!r.id)return false;                               // 시간범위 fallback
    return r.id>=s&&r.id<=e;
  }).sort((a,b)=>(b.id||0)-(a.id||0));
}
// ── 보관함: 종료된 특보운영 상세 열람 ──
function openAlertHistory(opId){
  const op=(DB.g('alertOps')||[]).find(o=>o.id===opId);
  if(!op){toast('기록을 찾을 수 없습니다');return;}
  // 90일 이전 운영이면 그 기간 안전사고(구조기록) 아카이브를 지연 로드 후 한 번 다시 그림
  if(typeof _ARCHIVE_COLLS!=='undefined'&&_ARCHIVE_COLLS.includes('rescues')&&!_archiveLoaded['rescues']
     &&(op.startedAtMs||0)<Date.now()-_ARCHIVE_CUTOFF_DAYS*86400000){
    _loadArchive('rescues').then(()=>{try{const m=document.getElementById('modalAlertHistory');if(m&&m.classList.contains('on'))openAlertHistory(opId);}catch(e){}});
  }
  document.getElementById('alertHistBody').innerHTML=_navBtns('alert',opId,'openAlertHistory')+_renderAlertOpDetail(op);
  document.getElementById('modalAlertHistory').classList.add('on');
}
function _renderAlertOpDetail(op){
  const opLevel=_opLevel(op);
  const lvColor=ALERT_LEVEL_COLORS[opLevel]||'#4fa8d0';
  const alertChips=(op.alerts||_opAlerts(op)).map(a=>`<span class="ao-alert-chip ${a.source==='auto'?'auto':'manual'}">${a.drill||op.drill?'🎯훈련':a.source==='auto'?'📡자동':'✋수동'} <b>${_esc(a.type)}${_stageShort(a.stage)}</b></span>`).join('')||'<span style="font-size:11px;color:#456a85;">-</span>';
  // 응소자: 관측소별 그룹
  const resps=op.responders||[];
  let respHtml='';
  if(resps.length){
    const byLoc={};
    resps.forEach(r=>{const k=r.loc||'사무소';(byLoc[k]=byLoc[k]||[]).push(r);});
    respHtml=Object.entries(byLoc).map(([loc,arr])=>`<div class="ao-loc-card" style="margin-bottom:6px;">
      <div class="ao-loc-hd"><b style="color:#e8f2fb;font-size:12px;">${_esc(_stationLabel(loc))}</b><span class="ao-loc-cnt ok">👤 ${arr.length}명</span></div>
      <div style="margin-top:5px;">${arr.map(r=>`<span class="ao-resp-chip"><b style="color:#e0edf8;">${_esc(r.name)}</b> ${_esc(r.role||'')}${r.arrivedAt?' <span style="color:#7ec8a0;">'+_esc(r.arrivedAt)+'</span>':''}</span>`).join('')}</div>
    </div>`).join('');
  } else respHtml='<div style="font-size:11px;color:#456a85;padding:8px 0;">응소 기록 없음</div>';
  // 그 기간 발생 안전사고
  const incs=_incidentsInOp(op);
  let incHtml='';
  if(incs.length){
    incHtml=incs.map(r=>`<div class="ao-hist" onclick="closeM('modalAlertHistory');try{openResListDetail(${r.id});}catch(e){}" style="cursor:pointer;border-left:3px solid #c0392b;">
      <div style="font-size:12px;font-weight:700;color:#ffc9c2;">🚨 ${_esc(r.title||r.type||'안전사고')}</div>
      <div style="font-size:10px;color:#46708f;margin-top:3px;">${_esc((r.date||'').slice(5))}${r.weatherAlert?' · 🌀 '+_esc(r.weatherAlert):''}</div>
    </div>`).join('');
  } else incHtml='<div style="font-size:11px;color:#456a85;padding:8px 0;">기간 중 발생한 안전사고 없음</div>';
  return `
    <div class="ao-hero" style="background:linear-gradient(135deg,${lvColor}22,${lvColor}0a);border:1.5px solid ${lvColor}44;margin-bottom:14px;">
      <div class="ao-hero-lv" style="color:${lvColor};margin-top:0;">${_esc(opLevel)}${op.drill?' <span class="drill-badge" style="font-size:11px;">🎯 훈련</span>':''}</div>
      <div class="ao-hero-meta">🕐 ${_esc(op.startedAt||'')} → ${_esc(op.closedAt||'운영중')}</div>
      <div class="ao-hero-meta">👤 응소 ${(op.responders||[]).length}명 · 📊 관측 ${(op.reports||[]).length}건 · 🚨 안전사고 ${incs.length}건</div>
    </div>
    <div class="ao-sec-hd" style="margin-top:0;"><span class="bar" style="background:#ff8a80;"></span>🚨 발령 특보</div>
    <div style="margin-bottom:6px;">${alertChips}</div>
    ${op.note?`<div style="font-size:12px;color:#9fc0da;background:rgba(255,255,255,.03);border-radius:8px;padding:7px 10px;margin-bottom:6px;">📝 ${_esc(op.note)}</div>`:''}
    <div class="ao-sec-hd"><span class="bar"></span>📋 응소 현황</div>
    ${respHtml}
    <div class="ao-sec-hd"><span class="bar" style="background:#4fc0a0;"></span>📊 누적 관측 요약</div>
    ${_renderCumulativeSummary(op)}
    <div class="ao-sec-hd"><span class="bar" style="background:#6e96e6;"></span>🕐 시간대별 관측 기록</div>
    ${_renderReportsTable(op)}
    <div class="ao-sec-hd"><span class="bar" style="background:#c0392b;"></span>🚨 기간 중 발생 안전사고</div>
    ${incHtml}`;
}
// 관측소(분소/대피소) 선택 pill을 동적으로 생성
function _renderStationPills(wrapId,sel,fnName){
  const w=document.getElementById(wrapId);if(!w)return;
  // 운영 분소/대피소 먼저, 기상청 우량계 관측소는 구분선 뒤
  const main=ALERT_STATIONS.filter(s=>!s.obs);
  const obs=ALERT_STATIONS.filter(s=>s.obs);
  w.innerHTML=main.map(s=>`<div class="pill${s.loc===sel?' on':''}" onclick="${fnName}(this,'${s.loc}')">${_esc(s.label)}</div>`).join('')+
    (obs.length?`<div style="width:100%;font-size:9px;color:#4a6a84;font-weight:700;margin:5px 0 2px;">📡 기상청 관측소</div>`+obs.map(s=>`<div class="pill${s.loc===sel?' on':''}" onclick="${fnName}(this,'${s.loc}')" style="border-style:dashed;">${_esc(s.label)}</div>`).join(''):'');
}
function openAddResponder(id,presetLoc){
  _respLoc=presetLoc||'';_respRole='';
  document.getElementById('respTargetId').value=id;
  document.getElementById('respNameIn').value=_myRespName()||''; // 내 이름 미리 채움 — 다른 사람 등록 시 지우거나 빠른선택
  document.getElementById('respArrivedAt').value='';
  // 분소 카드에서 호출 시 소속 고정, 그렇지 않으면 선택 가능
  const locWrap=document.getElementById('respLocPills');
  if(presetLoc){
    locWrap.innerHTML=`<span style="font-size:12px;font-weight:700;color:#e0edf8;background:rgba(79,168,208,.15);border:1px solid rgba(79,168,208,.3);border-radius:20px;padding:4px 12px;">${_esc(_stationLabel(presetLoc))}</span>`;
  }else{
    _renderStationPills('respLocPills',_respLoc,'selRespLoc');
  }
  // 지난번 선택한 역할 미리 선택 (원탭 응소와 같은 기억 사용)
  const _prRole=(_myRespPref()||{}).role||'';
  document.querySelectorAll('#respRolePills .pill').forEach(p=>{
    const on=!!_prRole&&p.textContent.trim()===_prRole;
    p.classList.toggle('on',on);
    if(on)_respRole=_prRole;
  });
  // 등록된 직원 빠른선택
  const users=(DB.g('pendingUsers')||[]).filter(u=>u.approvalStatus==='approved');
  document.getElementById('respNameQuickWrap').innerHTML=users.map(u=>`<div onclick="document.getElementById('respNameIn').value='${_escq(u.realName||u.name||'')}'" style="cursor:pointer;background:rgba(79,168,208,.08);border:1px solid rgba(79,168,208,.2);color:#7db8d8;border-radius:20px;padding:3px 9px;font-size:10px;font-weight:600;">${_esc(u.realName||u.name||'')}</div>`).join('');
  document.getElementById('modalAlertResp').classList.add('on');
}
function selRespLoc(el,v){document.querySelectorAll('#respLocPills .pill').forEach(p=>p.classList.remove('on'));el.classList.add('on');_respLoc=v;}
function selRespRole(el,v){document.querySelectorAll('#respRolePills .pill').forEach(p=>p.classList.remove('on'));el.classList.add('on');_respRole=v;}
function addAlertResponder(){
  const id=parseInt(document.getElementById('respTargetId').value,10);
  const name=document.getElementById('respNameIn').value.trim();
  if(!name){toast('이름을 입력하세요');return;}
  if(!_respLoc){toast('소속을 선택하세요');return;}
  if(!_respRole){toast('역할을 선택하세요');return;}
  const arrivedAt=document.getElementById('respArrivedAt').value.trim()||now().slice(11);
  const ops=DB.g('alertOps')||[];
  const idx=ops.findIndex(o=>o.id===id);
  if(idx===-1){toast('운영 기록을 찾을 수 없습니다');return;}
  if(!ops[idx].responders)ops[idx].responders=[];
  // 같은 이름+소속 중복 응소 방지 — 이미 등록된 대원이면 막기
  const dup=ops[idx].responders.some(r=>(r.name||'').trim()===name&&(r.loc||'')===_respLoc);
  if(dup){toast('⚠️ 이미 등록된 응소자입니다: '+name+' ('+_respLoc+')');return;}
  ops[idx].responders.push({name,loc:_respLoc,role:_respRole,arrivedAt});
  DB.s('alertOps',ops);
  // 본인 등록이면 근무지·역할 기억 → 다음부터 🙋 응소하기 원탭
  if(name===_myRespName()){try{localStorage.setItem('_myRespPref',JSON.stringify({loc:_respLoc,role:_respRole}));}catch(e){}}
  closeM('modalAlertResp');
  toast('✅ 응소자 추가: '+name);
  renderAlertView();
}
function removeAlertResponder(id,name,loc){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const ops=DB.g('alertOps')||[];
  const idx=ops.findIndex(o=>o.id===id);
  if(idx===-1)return;
  let removed=false;
  ops[idx].responders=(ops[idx].responders||[]).filter(r=>{
    if(!removed&&r.name===name&&(r.loc||'사무소')===(loc||'사무소')){removed=true;return false;}
    return true;
  });
  DB.s('alertOps',ops);
  renderAlertView();
}

// ══════════════════════════════════════════
// 🙋 원탭 응소 체크인 — 내 이름으로 즉시 등록
// 기존: 입력 탭 → 분소 카드 → 모달 → 이름 입력 → 역할 → 저장 (5~6탭+타이핑)
// 개선: 특보 화면 상단 큰 버튼 1탭. 근무지·역할은 첫 1회만 선택하고 기기에 기억.
//       잘못 눌렀으면 같은 버튼(✅ 응소 완료)을 다시 눌러 스스로 취소 — 관리자 필요 없음.
// ══════════════════════════════════════════
function _myRespName(){const me=DB.g('currentUser')||{};return String(me.realName||me.name||'').trim();}
function _myRespPref(){try{return JSON.parse(localStorage.getItem('_myRespPref')||'null')||{};}catch(e){return {};}}
function _findMyResp(op){const n=_myRespName();if(!n)return null;return (op.responders||[]).find(r=>String(r.name||'').trim()===n)||null;}
// 히어로(목록 탭)·입력 탭 공용 버튼 — 응소 대상 특보(호우·대설)일 때만 표시
function _quickRespBtnHtml(active){
  if(!active||active.closedAt||!_alertMeasureType(active))return '';
  const n=_myRespName();
  const mine=_findMyResp(active);
  if(mine){
    return `<button onclick="quickRespCancel(${active.id})" class="btn2 btn2-blk" style="background:rgba(39,174,96,.13);border:1px solid rgba(39,174,96,.42);color:#5fcf8f;margin-bottom:10px;flex-wrap:wrap;">✅ 응소 완료 — ${_esc(mine.name)} · ${_esc(_stationLabel(mine.loc||'사무소'))}${mine.arrivedAt?' '+_esc(mine.arrivedAt):''} <span style="font-size:10px;font-weight:600;opacity:.65;">(누르면 취소)</span></button>`;
  }
  return `<button onclick="quickRespond(${active.id})" class="btn2 btn2-blk" style="background:linear-gradient(135deg,#1f8a52,#166b3e);color:#fff;box-shadow:0 4px 14px rgba(39,174,96,.32);margin-bottom:10px;font-size:14.5px;padding:14px;">🙋 응소하기${n?` — ${_esc(n)}`:''} <span style="font-size:10px;font-weight:600;opacity:.75;">한 번에 등록</span></button>`;
}
function quickRespond(opId){
  const n=_myRespName();
  if(!n){toast('⚠️ 내 이름 정보가 없습니다 — 입력 탭의 분소 카드에서 등록해주세요');return;}
  const pref=_myRespPref();
  if(pref.loc&&pref.role){_quickRespCommit(opId,pref.loc,pref.role);return;}
  _openQuickRespSheet(opId); // 첫 1회: 근무지·역할 선택
}
function _openQuickRespSheet(opId){
  const pref=_myRespPref();
  window._qrsLoc=pref.loc||'';window._qrsRole=pref.role||'당직';
  let m=document.getElementById('quickRespSheet');
  if(!m){m=document.createElement('div');m.id='quickRespSheet';document.body.appendChild(m);}
  m.style.cssText='position:fixed;inset:0;z-index:9600;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center;';
  const main=(typeof ALERT_STATIONS!=='undefined'?ALERT_STATIONS:[]).filter(s=>!s.obs);
  const roles=['당직','비상근무','과장','소장','지원반'];
  m.innerHTML=`<div style="background:#0a1828;border:1px solid rgba(39,174,96,.3);border-radius:16px 16px 0 0;max-width:430px;width:100%;padding:16px 16px calc(14px + env(safe-area-inset-bottom));">
    <div style="display:flex;align-items:center;margin-bottom:4px;">
      <b style="font-size:14.5px;color:#7ee0a8;">🙋 응소 등록 — ${_esc(_myRespName())}</b>
      <button onclick="document.getElementById('quickRespSheet').remove()" style="margin-left:auto;background:none;border:none;color:rgba(255,255,255,.5);font-size:21px;cursor:pointer;padding:0 2px;">×</button>
    </div>
    <div style="font-size:10.5px;color:#6a94b0;margin-bottom:11px;">처음 1회만 선택하면 기억해뒀다가, 다음부터는 버튼 한 번에 등록됩니다</div>
    <div style="font-size:10px;color:#5d92bc;font-weight:800;margin-bottom:5px;">근무지</div>
    <div id="qrsLocWrap" style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px;">
      ${main.map(s=>`<div class="pill${window._qrsLoc===s.loc?' on':''}" onclick="_qrsPick('loc','${_escq(s.loc)}',this)">${_esc(s.label)}</div>`).join('')}
    </div>
    <div style="font-size:10px;color:#5d92bc;font-weight:800;margin-bottom:5px;">역할</div>
    <div id="qrsRoleWrap" style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:14px;">
      ${roles.map(r=>`<div class="pill${window._qrsRole===r?' on':''}" onclick="_qrsPick('role','${r}',this)">${r}</div>`).join('')}
    </div>
    <button onclick="_qrsSubmit(${opId})" class="btn2 btn2-blk" style="background:linear-gradient(135deg,#1f8a52,#166b3e);color:#fff;font-size:14px;padding:13px;">✅ 응소 등록</button>
  </div>`;
  m.onclick=e=>{if(e.target===m)m.remove();};
}
function _qrsPick(kind,v,el){
  const wrap=document.getElementById(kind==='loc'?'qrsLocWrap':'qrsRoleWrap');
  if(wrap)wrap.querySelectorAll('.pill').forEach(p=>p.classList.remove('on'));
  el.classList.add('on');
  if(kind==='loc')window._qrsLoc=v;else window._qrsRole=v;
}
function _qrsSubmit(opId){
  if(!window._qrsLoc){toast('근무지를 선택하세요');return;}
  if(!window._qrsRole){toast('역할을 선택하세요');return;}
  _quickRespCommit(opId,window._qrsLoc,window._qrsRole);
}
function _quickRespCommit(opId,loc,role){
  const n=_myRespName();
  const ops=DB.g('alertOps')||[];
  const idx=ops.findIndex(o=>o.id===opId);
  if(idx===-1){toast('운영 기록을 찾을 수 없습니다');return;}
  if(!ops[idx].responders)ops[idx].responders=[];
  if(ops[idx].responders.some(r=>String(r.name||'').trim()===n)){
    const sh=document.getElementById('quickRespSheet');if(sh)sh.remove();
    toast('✅ 이미 응소 등록되어 있습니다');renderAlertView();return;
  }
  ops[idx].responders.push({name:n,loc,role,arrivedAt:now().slice(11)});
  DB.s('alertOps',ops);
  try{localStorage.setItem('_myRespPref',JSON.stringify({loc,role}));}catch(e){}
  const sh=document.getElementById('quickRespSheet');if(sh)sh.remove();
  if(typeof _hapt==='function')_hapt([20,30,20]);
  toast('✅ 응소 등록: '+n+' · '+_stationLabel(loc));
  renderAlertView();
}
function quickRespCancel(opId){
  const n=_myRespName();if(!n)return;
  if(!confirm('내 응소 등록('+n+')을 취소할까요?'))return;
  const ops=DB.g('alertOps')||[];
  const idx=ops.findIndex(o=>o.id===opId);if(idx===-1)return;
  let removed=false;
  ops[idx].responders=(ops[idx].responders||[]).filter(r=>{
    if(!removed&&String(r.name||'').trim()===n){removed=true;return false;}
    return true;
  });
  DB.s('alertOps',ops);
  toast('응소 등록을 취소했습니다');
  renderAlertView();
}

// ── 시간대별 기상관측 기록 (개별 관측값 + 관측소별 시간순 누적) ──
function _renderReportsTable(op){
  const mt=_alertMeasureType(op);
  const allReps=(op.reports||[]).slice();
  if(!allReps.length)return`<div style="font-size:12px;color:#456a85;text-align:center;padding:16px 0;background:#0a1424;border-radius:10px;">관측 보고 없음 — 분소별 기상보고 버튼으로 입력</div>`;
  // 입력값은 '관측 시점까지의 누적값' → 합산하지 않고 그대로 표시. 시간당 증가량(Δ)은 직전 보고 대비로 계산.
  const chrono=allReps.slice().sort((a,b)=>(a.at||0)-(b.at||0));
  const last={};const dlt={};
  chrono.forEach(r=>{
    const loc=r.loc||'사무소';last[loc]=last[loc]||{};dlt[r.id]={};
    if(r.snow!=null&&r.snow!==''){const v=parseFloat(r.snow)||0;dlt[r.id].snow=(last[loc].snow!=null)?+(v-last[loc].snow).toFixed(1):null;last[loc].snow=v;}
    if(r.rain!=null&&r.rain!==''){const v=parseFloat(r.rain)||0;dlt[r.id].rain=(last[loc].rain!=null)?+(v-last[loc].rain).toFixed(1):null;last[loc].rain=v;}
  });
  // 표시는 최신순(과거 기록도 모두 보존)
  const reps=allReps.sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,80);
  const _dStr=d=>d==null?'':(d>0?'<span style="color:#ff9e80;">▲'+d+'</span>':(d<0?'<span style="color:#7ec8a0;">▼'+Math.abs(d)+'</span>':'<span style="color:#5a8aa0;">0</span>'));
  const snowHd=mt!=='rain'?'<th>❄️ 누적<br>(cm)</th><th>Δ</th>':'';
  const rainHd=mt!=='snow'?'<th>🌧️ 누적<br>(mm)</th><th>Δ</th>':'';
  const cols=3+(mt==='both'?4:2)+(isAdminUser()?1:0);
  return`<table class="ao-req-table"><tr><th>시각</th><th>관측소</th><th>관측자</th>${snowHd}${rainHd}${isAdminUser()?'<th></th>':''}</tr>
    ${reps.map(r=>{
      const d=dlt[r.id]||{};
      const snowTd=mt!=='rain'?`<td style="text-align:center;color:#9ce0f0;font-weight:800;background:rgba(120,220,240,.06);">${_esc(String(r.snow??'-'))}</td><td style="text-align:center;font-size:10px;">${_dStr(d.snow)}</td>`:'';
      const rainTd=mt!=='snow'?`<td style="text-align:center;color:#a8cdf5;font-weight:800;background:rgba(110,150,230,.06);">${_esc(String(r.rain??'-'))}</td><td style="text-align:center;font-size:10px;">${_dStr(d.rain)}</td>`:'';
      const delTd=isAdminUser()?`<td style="text-align:center;"><span onclick="removeAlertReport(${op.id},${r.id})" style="cursor:pointer;color:#c0392b;">×</span></td>`:'';
      return`<tr><td>${_esc((r.time||'').slice(5,16))}</td><td>${_esc(_stationLabel(r.loc))}</td><td>${_esc(r.observer||'-')}</td>${snowTd}${rainTd}${delTd}</tr>${r.note?`<tr><td colspan="${cols}" style="color:#5a8aa0;font-size:9px;padding:1px 6px 4px;">↳ ${_esc(r.note)}</td></tr>`:''}`;
    }).join('')}
  </table>
  <div style="font-size:9px;color:#456a85;margin-top:5px;">※ 값은 관측 시점까지의 <b>누적값</b>(입력 그대로). Δ는 직전 보고 대비 증가량(시간당 강우).</div>`;
}
// ── 누적 관측 요약 (관측소별 현재 누적 합계 — 한눈에) ──
function _renderCumulativeSummary(op){
  const reps=op.reports||[];
  if(!reps.length)return`<div style="font-size:12px;color:#456a85;text-align:center;padding:14px 0;background:#0a1424;border-radius:10px;">아직 누적된 관측값이 없습니다</div>`;
  const mt=_alertMeasureType(op);
  // 입력값=누적값 → 합산 금지. 관측소별 '최신 누적값'(현재값) + 시계열(추세 그래프용)
  const byLoc={};
  reps.slice().sort((a,b)=>(a.at||0)-(b.at||0)).forEach(r=>{
    const key=r.loc||'사무소';
    if(!byLoc[key])byLoc[key]={label:_stationLabel(key),snow:null,rain:null,snowSeq:[],rainSeq:[],lastTime:''};
    if(r.snow!=null&&r.snow!==''){const v=parseFloat(r.snow)||0;byLoc[key].snow=v;byLoc[key].snowSeq.push(v);}
    if(r.rain!=null&&r.rain!==''){const v=parseFloat(r.rain)||0;byLoc[key].rain=v;byLoc[key].rainSeq.push(v);}
    if((r.time||'')>(byLoc[key].lastTime))byLoc[key].lastTime=r.time||'';
  });
  const entries=Object.entries(byLoc).filter(([,v])=>v.snowSeq.length||v.rainSeq.length);
  if(!entries.length)return`<div style="font-size:12px;color:#456a85;text-align:center;padding:14px 0;background:#0a1424;border-radius:10px;">아직 누적된 관측값이 없습니다</div>`;
  // 미니 막대 추세(스파크라인): 최근 최대 8개 누적값 → 높이 막대
  const _spark=(seq,col)=>{
    if(!seq||seq.length<2)return'';
    const s=seq.slice(-8);const mx=Math.max.apply(null,s)||1;
    return`<span style="display:inline-flex;align-items:flex-end;gap:1px;height:16px;vertical-align:middle;margin-left:5px;">${s.map(v=>`<span style="display:inline-block;width:3px;height:${Math.max(2,Math.round(v/mx*16))}px;background:${col};border-radius:1px;opacity:.85;"></span>`).join('')}</span>`;
  };
  const snowHd=mt!=='rain'?'<th>❄️ 누적 적설(cm)</th>':'';
  const rainHd=mt!=='snow'?'<th>🌧️ 누적 강우(mm)</th>':'';
  const rows=entries.map(([,v])=>{
    const snowTd=mt!=='rain'?`<td style="text-align:center;color:#9ce0f0;font-weight:800;white-space:nowrap;">${v.snow!=null?v.snow.toFixed(1):'-'}${_spark(v.snowSeq,'#7ec8d8')}</td>`:'';
    const rainTd=mt!=='snow'?`<td style="text-align:center;color:#a8cdf5;font-weight:800;white-space:nowrap;">${v.rain!=null?v.rain.toFixed(1):'-'}${_spark(v.rainSeq,'#7db8f0')}</td>`:'';
    return`<tr><td style="font-weight:600;color:#cfe2f2;">${_esc(v.label)}</td>${snowTd}${rainTd}<td style="font-size:9px;color:#5a8aa0;">${_esc((v.lastTime||'').slice(11,16))}</td></tr>`;
  }).join('');
  return`<table class="ao-req-table"><tr><th>관측소</th>${snowHd}${rainHd}<th>최근</th></tr>${rows}</table>
  <div style="font-size:9px;color:#456a85;margin-top:5px;">※ 현재 누적값(최신 보고 기준). 막대는 누적 강우 추세.</div>`;
}
function openAlertReport(opId,presetLoc){
  {const _op=(DB.g('alertOps')||[]).find(o=>o.id===opId);
   if(!_alertMeasureType(_op||{})){toast('⚠️ 강우량·적설량 측정은 호우·대설 특보에서만 합니다');return;}}
  _reportOpId=opId;_reportLoc=presetLoc||'';
  // 특정 관측소(대피소·본소·분소)에서 보고하면 그 관측소로 고정 — 다른 관측소 재선택 차단
  const _rlw=document.getElementById('reportLocPills');
  if(presetLoc&&_rlw){
    _rlw.innerHTML=`<span style="font-size:12px;font-weight:700;color:#e0edf8;background:rgba(79,168,208,.15);border:1px solid rgba(79,168,208,.3);border-radius:20px;padding:4px 12px;">📍 ${_esc(_stationLabel(presetLoc))}</span>`;
  }else{
    _renderStationPills('reportLocPills',_reportLoc,'selReportLoc');
  }
  document.getElementById('reportObserver').value=getAuthor()==='미지정'?'':getAuthor();
  document.getElementById('reportSnow').value='';
  document.getElementById('reportRain').value='';
  document.getElementById('reportTime').value=now().slice(11);
  document.getElementById('reportNote').value='';
  // 해당 관측소 응소자 빠른선택
  const op=(DB.g('alertOps')||[]).find(o=>o.id===opId);
  const resps=op?(op.responders||[]).filter(r=>!_reportLoc||(r.loc||'사무소')===_reportLoc):[];
  document.getElementById('reportObsQuick').innerHTML=resps.map(r=>`<div onclick="document.getElementById('reportObserver').value='${_escq(r.name)}'" style="cursor:pointer;background:rgba(79,168,208,.08);border:1px solid rgba(79,168,208,.2);color:#7db8d8;border-radius:20px;padding:3px 9px;font-size:10px;font-weight:600;">${_esc(r.name)}</div>`).join('');
  // 특보 종류에 따라 입력 필드 표시·숨김 및 모달 제목 변경
  const mt=_alertMeasureType(op||{});
  const snowEl=document.getElementById('reportSnow');
  const rainEl=document.getElementById('reportRain');
  if(snowEl)snowEl.parentElement.style.display=mt==='rain'?'none':'';
  if(rainEl)rainEl.parentElement.style.display=mt==='snow'?'none':'';
  const modalTitleEl=document.querySelector('#modalAlertReport .mtitle');
  if(modalTitleEl)modalTitleEl.textContent=mt==='snow'?'❄️ 적설량 보고':mt==='rain'?'🌧️ 강우량 보고':'🌧️ 적설량·강우량 보고';
  document.getElementById('modalAlertReport').classList.add('on');
}
function selReportLoc(el,v){document.querySelectorAll('#reportLocPills .pill').forEach(p=>p.classList.remove('on'));el.classList.add('on');_reportLoc=v;}
function addAlertReport(){
  if(!_reportLoc){toast('관측소를 선택하세요');return;}
  const observer=document.getElementById('reportObserver').value.trim();
  const snowRaw=document.getElementById('reportSnow').value.trim();
  const rainRaw=document.getElementById('reportRain').value.trim();
  const _mt=_alertMeasureType((DB.g('alertOps')||[]).find(o=>o.id===_reportOpId)||{});
  if(snowRaw===''&&rainRaw===''){toast(_mt==='snow'?'적설량을 입력하세요':_mt==='rain'?'강우량을 입력하세요':'적설량 또는 강우량을 입력하세요');return;}
  const snow=snowRaw===''?null:parseFloat(snowRaw);
  const rain=rainRaw===''?null:parseFloat(rainRaw);
  const tIn=document.getElementById('reportTime').value.trim();
  const time=tIn?now().slice(0,11)+tIn:now();
  const note=document.getElementById('reportNote').value.trim();
  const ops=DB.g('alertOps')||[];
  const idx=ops.findIndex(o=>o.id===_reportOpId);
  if(idx===-1){toast('운영 기록을 찾을 수 없습니다');return;}
  if(!ops[idx].reports)ops[idx].reports=[];
  ops[idx].reports.push({id:Date.now(),loc:_reportLoc,observer:observer||'-',snow,rain,time,at:Date.now(),by:getAuthor()});
  DB.s('alertOps',ops);
  closeM('modalAlertReport');
  toast('🌧️ '+_stationLabel(_reportLoc)+' 관측 보고 완료');
  renderAlertView();
}
function removeAlertReport(opId,repId){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const ops=DB.g('alertOps')||[];
  const idx=ops.findIndex(o=>o.id===opId);
  if(idx===-1)return;
  ops[idx].reports=(ops[idx].reports||[]).filter(r=>r.id!==repId);
  DB.s('alertOps',ops);
  renderAlertView();
}

// ── 관측 보고 알림: 운영 중 보고주기마다 적설/강우 보고 리마인드 (기기 로컬, 서버 부담 0) ──
function _startAlertReminder(){
  if(_alertReminderTimer)return;
  _alertReminderTimer=setInterval(_checkAlertReminder,60000);
  _checkAlertReminder();
}
function _stopAlertReminder(){if(_alertReminderTimer){clearInterval(_alertReminderTimer);_alertReminderTimer=null;}}
function _checkAlertReminder(){
  const active=(DB.g('alertOps')||[]).find(o=>!o.closedAt);
  if(!active){_stopAlertReminder();return;}
  if(!_alertMeasureType(active))return; // 강우·적설 측정은 호우·대설 특보에서만
  try{if(isExternal())return;}catch(e){}
  const itvMs=(active.reportInterval||60)*60000;
  const start=active.startedAtMs||_alertTimeMs(active.startedAt);
  if(!start)return;
  const slot=Math.floor((Date.now()-start)/itvMs);
  if(slot<1)return; // 첫 주기 경과 전
  const key='_aoRemind_'+active.id+'_'+slot;
  if(localStorage.getItem(key))return;
  // 이번 주기에 이미 보고가 있으면 알림 생략
  const slotStart=start+slot*itvMs;
  const reported=(active.reports||[]).some(r=>(r.at||_alertTimeMs(r.time))>=slotStart);
  localStorage.setItem(key,'1');
  if(reported)return;
  const msg='🌧️ 적설량·강우량 관측 보고 시간입니다 ('+_opLevel(active)+')';
  toast(msg);
  _showSystemNoti('적설량·강우량 관측 보고 시간입니다','🌧️');
}

// ══════════════════════════════════════════
// 관리자
// ══════════════════════════════════════════
function admTab(tab,el){
  document.querySelectorAll('.adm-tab').forEach(t=>{t.classList.remove('on');t.style.color='';t.style.borderBottomColor='';});
  el.classList.add('on');if(tab==='ctrl'){el.style.color='#c0392b';el.style.borderBottomColor='#c0392b';}
  document.querySelectorAll('.adm-sec').forEach(s=>s.classList.remove('on'));
  document.getElementById('adm-'+tab).classList.add('on');
  ({ctrl:renderAdmCtrl,members:renderAdmMembers,cat:renderAdmCat,sheets:renderAdmSheets,sys:renderAdmSys,staff:renderAdmMembers})[tab]?.();
}
let _admResLimit=15; // 관리자 구조이력 표시 개수(더보기로 증가)
// ── 관제: 서브탭(현황/구조/시설물/위험상황)으로 분리 — 한 화면에 전부 쏟아붓지 않고 필터·페이지로 관리
let _admFacLimit=50;
function admCtrlTab(t){window._admCtrlTab=t;_admResLimit=15;_admFacLimit=50;renderAdmCtrl();}
function renderAdmCtrl(){
  const facs=DB.g('facilities')||[];const res=DB.g('rescues')||[];const haz=DB.g('hazards')||[];
  const t=window._admCtrlTab||'dash';
  const ongoing=res.filter(r=>r.status==='ongoing');
  const warned=facs.filter(f=>_facWarn(f));
  const hazOpen=haz.filter(h=>!h.hazStatus||h.hazStatus==='미조치'||h.hazStatus==='조치중');
  const seg=(lbl,k,n,col)=>`<button onclick="admCtrlTab('${k}')" style="flex:1;padding:9px 4px;border:none;border-radius:8px;font-size:11.5px;font-weight:800;cursor:pointer;white-space:nowrap;background:${t===k?'rgba(79,168,208,.18)':'transparent'};color:${t===k?'#7fc4e0':'#6a8296'};">${lbl}${n?` <span style="background:${col||'#e05050'};color:#fff;border-radius:8px;padding:0 5px;font-size:9px;">${n}</span>`:''}</button>`;
  const chip=(lbl,on,onclick,col)=>`<span onclick="${onclick}" style="cursor:pointer;display:inline-block;padding:5px 11px;margin:0 4px 4px 0;border-radius:13px;font-size:11px;font-weight:700;border:1px solid ${on?(col||'#4fa8d0'):'rgba(255,255,255,.12)'};background:${on?'rgba(79,168,208,.16)':'transparent'};color:${on?(col||'#7fc4e0'):'#6a8296'};">${lbl}</span>`;
  const inp='background:#060d1a;border:1px solid rgba(255,255,255,.12);color:#cfe2f2;border-radius:8px;padding:7px 9px;font-size:12px;width:100%;box-sizing:border-box;margin-bottom:7px;';
  let html=`<div style="display:flex;gap:3px;background:#0a1626;border:1px solid rgba(79,168,208,.15);border-radius:10px;padding:3px;margin-bottom:11px;">${seg('📊 현황','dash')}${seg('🚨 구조','res',ongoing.length)}${seg('🛠️ 시설물','fac',warned.length,'#e67e22')}${seg('⚠️ 위험','haz',hazOpen.length,'#e67e22')}</div>`;
  if(t==='dash'){
    html+=`<div class="scard" style="margin-bottom:8px;">
      <div class="stitle">📊 전체 현황</div>
      <div class="stat-grid">
        <div class="stat-box" onclick="admCtrlTab('fac')" style="cursor:pointer;"><div class="stat-num">${facs.length}</div><div class="stat-lbl">시설물</div></div>
        <div class="stat-box" onclick="window._admFacF='경고';admCtrlTab('fac')" style="cursor:pointer;"><div class="stat-num bad">${warned.length}</div><div class="stat-lbl">경고표시</div></div>
        <div class="stat-box" onclick="admCtrlTab('res')" style="cursor:pointer;"><div class="stat-num">${res.length}</div><div class="stat-lbl">구조이력</div></div>
        <div class="stat-box" onclick="window._admResF='진행중';admCtrlTab('res')" style="cursor:pointer;border-color:#c0392b;"><div class="stat-num bad">${ongoing.length}</div><div class="stat-lbl">진행중</div></div>
      </div>
      <div onclick="admCtrlTab('haz')" style="cursor:pointer;margin-top:8px;font-size:11px;color:#7a9cb8;">위험상황 보고 ${haz.length}건 · <span style="color:${hazOpen.length?'#e67e22':'#5dbf8a'};font-weight:700;">미조치·조치중 ${hazOpen.length}건</span> ›</div>
    </div>
    <div style="font-size:10px;color:#5a7e98;margin:4px 2px 0;">숫자를 누르면 해당 탭으로 이동합니다. 긴급 항목만 아래에 표시됩니다.</div>
    <div class="sec-label">⚠️ 경고표시 시설물 (${warned.length})</div>
    ${warned.slice(0,5).map(f=>{const w=_facWarn(f);return `<div class="adm-row"><div class="adm-info"><div class="adm-name">⚠️ ${f.type.split(' ')[0]} ${_esc(_facDispName(f))}</div><div class="adm-meta">${_esc(_facZoneLbl(f)||'-')}${w.reason?' · '+_esc(w.reason):''}</div></div><button class="abtn" onclick="openFacDetail(${f.id})">보기</button></div>`;}).join('')||'<div class="muted" style="font-size:12px;padding:5px 0;">경고표시된 시설 없음</div>'}
    ${warned.length>5?`<button class="abtn" style="width:100%;margin-top:4px;" onclick="window._admFacF='경고';admCtrlTab('fac')">전체 ${warned.length}건 보기 →</button>`:''}
    <div class="sec-label">🚨 진행중 구조 (${ongoing.length})</div>
    ${ongoing.map(r=>{const ti=RES_TYPES[r.type]||RES_TYPES['기타'];return`<div class="adm-row"><div class="adm-info"><div class="adm-name">${ti.ico} ${_esc(r.title)}</div><div class="adm-meta">${_esc(r.type)} · ${_esc(r.date)} · ${_esc(r.vName||'미상')}</div></div><div class="adm-btns"><button class="abtn" onclick="admEndRes(${r.id})">상황종료</button><button class="abtn del" onclick="admDelRes(${r.id})">삭제</button></div></div>`;}).join('')||'<div class="muted" style="font-size:12px;padding:5px 0;">진행중 없음</div>'}`;
  } else if(t==='res'){
    const f=window._admResF||'전체',q=(window._admResQ||'').trim();
    let list=res.slice().sort((a,b)=>(b.id||0)-(a.id||0));
    if(f==='진행중')list=list.filter(r=>r.status==='ongoing');
    else if(f==='종료')list=list.filter(r=>r.status!=='ongoing');
    if(q)list=list.filter(r=>[r.title,r.vName,r.type,r.location].some(v=>String(v||'').indexOf(q)>=0));
    html+=`<div style="margin-bottom:4px;">${chip('전체 '+res.length,f==='전체',"window._admResF='전체';renderAdmCtrl();")}${chip('🔴 진행중 '+ongoing.length,f==='진행중',"window._admResF='진행중';renderAdmCtrl();",'#ff8a73')}${chip('종료',f==='종료',"window._admResF='종료';renderAdmCtrl();",'#5dbf8a')}</div>
    <input type="search" placeholder="🔍 사건명·사고자·장소 검색 (Enter)" value="${_esc(q)}" onchange="window._admResQ=this.value;renderAdmCtrl();" style="${inp}">
    <div class="sec-label">📒 구조 이력 (${list.length}건)</div>
    ${list.slice(0,_admResLimit).map(r=>{const ti=RES_TYPES[r.type]||RES_TYPES['기타'];const og=r.status==='ongoing';return`<div class="adm-row"><div class="adm-info"><div class="adm-name">${ti.ico} ${_esc(r.title)} ${og?'<span style="font-size:9px;color:#ff6b5e;font-weight:700;">●진행중</span>':'<span style="font-size:9px;color:#3ad17a;">종료</span>'}</div><div class="adm-meta">${_esc(r.type)} · ${_esc(r.date)} · ${_esc(r.vName||'미상')}</div></div><div class="adm-btns">${og?`<button class="abtn" onclick="admEndRes(${r.id})">종료</button>`:''}<button class="abtn del" onclick="admDelRes(${r.id})">삭제</button></div></div>`;}).join('')||'<div class="muted" style="font-size:12px;padding:5px 0;">해당 조건 없음</div>'}
    ${list.length>_admResLimit?`<button class="abtn" style="width:100%;margin-top:6px;" onclick="_admResLimit+=30;renderAdmCtrl();">▾ 더 보기 (${list.length-_admResLimit}건)</button>`:''}`;
  } else if(t==='fac'){
    const f=window._admFacF||'전체',ty=window._admFacType||'전체',q=(window._admFacQ||'').trim();
    const types=['전체',...new Set(facs.map(x=>x.type).filter(Boolean))];
    let list=facs.slice();
    if(f==='경고')list=list.filter(x=>_facWarn(x));
    if(ty!=='전체')list=list.filter(x=>x.type===ty);
    if(q)list=list.filter(x=>[x.name,x.loc,x.mgmt].some(v=>String(v||'').indexOf(q)>=0));
    html+=`<div style="margin-bottom:4px;">${chip('전체 '+facs.length,f==='전체',"window._admFacF='전체';renderAdmCtrl();")}${chip('⚠️ 경고만 '+warned.length,f==='경고',"window._admFacF='경고';renderAdmCtrl();",'#e67e22')}</div>
    <select onchange="window._admFacType=this.value;renderAdmCtrl();" style="${inp}">${types.map(x=>`<option${x===ty?' selected':''}>${_esc(x)}</option>`).join('')}</select>
    <input type="search" placeholder="🔍 명칭·위치·관리번호 검색 (Enter)" value="${_esc(q)}" onchange="window._admFacQ=this.value;renderAdmCtrl();" style="${inp}">
    <div class="sec-label">📋 시설물 (${list.length}개)</div>
    ${list.slice(0,_admFacLimit).map(fc=>`<div class="adm-row"><div class="adm-info"><div class="adm-name">${fc.type.split(' ')[0]} ${_esc(_facDispName(fc))}</div><div class="adm-meta">${_facWarn(fc)?'<span style="color:#e05050;">⚠️ 경고</span> · ':''}${_esc(_facZoneLbl(fc)||'-')} · ${_esc(fc.author||'-')}</div></div><div class="adm-btns"><button class="abtn" onclick="openFacDetail(${fc.id})">보기</button>${_canManageFac()?`<button class="abtn del" onclick="admDelFac(${fc.id})">삭제</button>`:''}</div></div>`).join('')||'<div class="muted" style="font-size:12px;padding:5px 0;">해당 조건 없음</div>'}
    ${list.length>_admFacLimit?`<button class="abtn" style="width:100%;margin-top:6px;" onclick="_admFacLimit+=100;renderAdmCtrl();">▾ 더 보기 (${list.length-_admFacLimit}개)</button>`:''}`;
  } else {
    const f=window._admHazF||'전체';
    let list=haz.slice().sort((a,b)=>(b.id||0)-(a.id||0));
    const st=h=>h.hazStatus||'미조치';
    if(f!=='전체')list=f==='완료'?list.filter(h=>st(h)!=='미조치'&&st(h)!=='조치중'):list.filter(h=>st(h)===f);
    html+=`<div style="margin-bottom:4px;">${chip('전체 '+haz.length,f==='전체',"window._admHazF='전체';renderAdmCtrl();")}${chip('미조치',f==='미조치',"window._admHazF='미조치';renderAdmCtrl();",'#ff8a73')}${chip('조치중',f==='조치중',"window._admHazF='조치중';renderAdmCtrl();",'#e6b800')}${chip('완료',f==='완료',"window._admHazF='완료';renderAdmCtrl();",'#5dbf8a')}</div>
    <div class="sec-label">⚠️ 위험상황 (${list.length}건)</div>
    ${list.map(h=>{const s=st(h);const sc=s==='미조치'?'#ff6b5e':s==='조치중'?'#e6b800':'#3ad17a';return`<div class="adm-row"><div class="adm-info"><div class="adm-name">${_esc(h.hazType||'위험상황')} <span style="font-size:9px;color:${sc};font-weight:700;">●${_esc(s)}</span></div><div class="adm-meta">${_esc(h.date||'')} · ${_esc(h.location||h.loc||'-')}</div></div><div class="adm-btns"><button class="abtn" onclick="openHazDetail(${h.id})">보기</button><button class="abtn del" onclick="admDelHaz(${h.id})">삭제</button></div></div>`;}).join('')||'<div class="muted" style="font-size:12px;padding:5px 0;">해당 조건 없음</div>'}`;
  }
  document.getElementById('admCtrlWrap').innerHTML=html;
}
function admDelHaz(id){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const hz=DB.g('hazards')||[];const h=hz.find(x=>x.id===id);if(!h)return;
  if(!confirm("'"+(h.hazType||'위험상황')+"' 보고를 삭제하시겠습니까?"))return;
  DB.s('hazards',hz.filter(x=>x.id!==id));
  renderAdmCtrl();try{renderRescueMap();}catch(e){}try{renderResList();}catch(e){}toast('🗑️ 삭제');updateSummary();
}
function admDelFac(id){
  if(!_canManageFac()){toast('⚠️ 탐방시설과·개발자만 삭제 가능');return;}
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  if(!confirm('삭제?'))return;
  DB.s('facilities',(DB.g('facilities')||[]).filter(f=>f.id!==id));
  // 1년 이전 점검이력도 함께 정리되도록 먼저 로드 후 삭제(미로드 시 최근 구간만 지워져 과거 이력이 고아로 남음)
  _loadArchive('history').then(()=>{DB.s('history',(DB.g('history')||[]).filter(h=>h.facId!==id));});
  renderAdmCtrl();try{renderInspectMap();}catch(e){}toast('🗑️ 삭제');updateSummary();
}
function admEndRes(id){if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}const res=DB.g('rescues')||[];const i=res.findIndex(x=>x.id===id);if(i===-1)return;if(!confirm("'"+(res[i].title||'')+"' 상황을 종료 처리하겠습니까?"))return;res[i].status='done';DB.s('rescues',res);try{if(typeof _closeLinkedSos==='function')_closeLinkedSos(res[i]);}catch(e){}renderAdmCtrl();try{renderRescueMap();}catch(e){}try{renderResList();}catch(e){}toast('✅ 상황 종료');}
function admDelRes(id){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const res=DB.g('rescues')||[];const r=res.find(x=>x.id===id);if(!r)return;
  if(!confirm("'"+(r.title||'구조 기록')+"' 을(를) 삭제하시겠습니까?\n삭제 후 5초 안에 되돌릴 수 있습니다."))return;
  // 목록에서 즉시 제거(되돌리기 대비 사본 보관). 사진 등 비가역 삭제는 5초 후 확정 시에만.
  const backup=JSON.parse(JSON.stringify(r));
  DB.s('rescues',(DB.g('rescues')||[]).filter(x=>x.id!==id));
  renderAdmCtrl();try{renderRescueMap();}catch(e){}try{renderResList();}catch(e){}updateSummary();
  _undoToast("🗑️ '"+(r.title||'구조 기록')+"' 삭제됨",
    function(){ // 되돌리기
      const cur=DB.g('rescues')||[];
      if(!cur.some(x=>x.id===backup.id)){cur.push(backup);DB.s('rescues',cur);}
      renderAdmCtrl();try{renderRescueMap();}catch(e){}try{renderResList();}catch(e){}updateSummary();toast('↩ 삭제 취소됨');
    },
    function(){ // 5초 후 실제 확정: 사진·댓글 영구 삭제 + 연계 SOS 링크 종료
      if(backup&&_fst){
        [backup.injuryPhoto,backup.transPhoto,...((backup.reports||[]).map(p=>p.photo)),...((backup.photos||[]).map(p=>p.url))]
          .filter(u=>u&&String(u).startsWith('http'))
          .forEach(u=>{try{_fst.refFromURL(u).delete().catch(()=>{});}catch(e){}});
      }
      try{if(typeof _closeLinkedSos==='function')_closeLinkedSos(backup);}catch(e){}
      try{localStorage.removeItem('v7_comments_'+id);}catch(e){}
    });
}
function renderAdmMembers(){
  // 자동 승인 ON이면 목록을 그리기 직전에 로그인 이력까지 전원 멤버로 일괄 처리(승인버튼 잔존 방지)
  if(typeof isAdminUser==='function'&&isAdminUser()&&_isAutoApprove()){try{_autoApproveSweep();}catch(e){}}
  const pending=DB.g('pendingUsers')||[];
  const loginLog=(DB.g('loginLog')||[]).slice().sort((a,b)=>(b.at||0)-(a.at||0));
  const acl=_getAcl();
  const roleOf=id=>{const s=String(id||'');return acl.admins.includes(s)?'admin':(acl.members.includes(s)?'member':'none');};

  // 통합 목록: loginLog 우선, pendingUsers에서 보완
  const seen={};const unified=[];
  loginLog.forEach(e=>{
    const kid=String(e.kakaoId||'');if(!kid||seen[kid])return;seen[kid]=1;
    const pu=pending.find(p=>String(p.kakaoId||p.id)===kid);
    unified.push({kakaoId:kid,name:(pu&&(pu.realName||pu.name))||e.name||'',dept:(pu&&pu.dept)||e.dept||'',rank:(pu&&pu.rank)||e.rank||'',kakaoImg:(pu&&pu.kakaoImg)||'',approvalStatus:(pu&&pu.approvalStatus)||'',puId:(pu&&pu.id)||'',reg:(pu&&pu.submittedAt)||e.at||0});
  });
  pending.forEach(p=>{
    const kid=String(p.kakaoId||p.id);if(seen[kid])return;seen[kid]=1;
    unified.push({kakaoId:kid,name:p.realName||p.name||'',dept:p.dept||'',rank:p.rank||'',kakaoImg:p.kakaoImg||'',approvalStatus:p.approvalStatus||'',puId:p.id,reg:p.submittedAt||0});
  });

  const usedDepts=[...new Set(unified.map(u=>u.dept).filter(Boolean))];
  const chips=['전체',...usedDepts];
  const fu=_admMemberFilter==='전체'?unified:unified.filter(u=>u.dept===_admMemberFilter);
  const adminCnt=fu.filter(u=>roleOf(u.kakaoId)==='admin').length;
  const memberCnt=fu.filter(u=>roleOf(u.kakaoId)==='member').length;
  const facMgrs=_facManagers();
  const facMgrCnt=fu.filter(u=>facMgrs.indexOf(String(u.kakaoId))>=0).length;

  const deptOpts=['행정과','재난안전과','탐방시설과','자원보전과','특수산악구조대','대청분소','백담분소','오색분소','한계산성분소','점봉산분소'];
  const rankOpts=['주임','계장','팀장','과장','분소장','소장'];

  // 신규(아직 미등록=승인 대기) — 로그인했지만 멤버/관리자가 아닌 사람
  const pendingNew=fu.filter(u=>roleOf(u.kakaoId)==='none');
  const autoOn=_isAutoApprove();

  let html=`
  <div class="scard" style="margin-bottom:10px;border:1px solid ${autoOn?'rgba(46,204,113,.4)':'rgba(255,255,255,.08)'};background:${autoOn?'rgba(46,204,113,.06)':'rgba(255,255,255,.02)'};">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:12px;font-weight:700;color:${autoOn?'#5dbf8a':'#cfe2f2'};">${autoOn?'✅ 자동 승인 켜짐':'🔒 수동 승인 모드'}</div>
        <div style="font-size:10px;color:#7a9cb8;margin-top:3px;line-height:1.5;">${autoOn?'지금 로그인하는 직원은 대기 없이 바로 입장합니다. 발표·행사가 끝나면 꺼주세요.':'새 직원은 아래 ‘신규 승인 대기’에서 승인해야 입장합니다.'}</div>
      </div>
      <button onclick="toggleAutoApprove()" style="flex-shrink:0;background:${autoOn?'#27ae60':'#1a4a6e'};color:#fff;border:none;border-radius:18px;padding:8px 14px;font-size:12px;font-weight:800;cursor:pointer;">${autoOn?'끄기':'자동 승인 켜기'}</button>
    </div>
  </div>
  <div style="font-size:11px;color:#7a9cb8;margin-bottom:8px;line-height:1.6;">카카오 로그인 이력 + DB 접근 권한을 한 곳에서 관리합니다. 역할을 지정하면 즉시 적용됩니다.</div>
  <div style="font-size:11px;color:#9bbdd4;margin-bottom:8px;">총 <b style="color:#e0edf8;">${fu.length}</b>명 · 관리자 <b style="color:#5dbf8a;">${adminCnt}</b> · 멤버 <b style="color:#4fa8d0;">${memberCnt}</b>${facMgrCnt?` · 🔧담당 <b style="color:#f0a500;">${facMgrCnt}</b>`:''}${pendingNew.length?` · <b style="color:#e67e22;">신규 ${pendingNew.length}</b>`:''}</div>
  <div style="font-size:10px;color:#7a9cb8;background:rgba(240,165,0,.06);border:1px solid rgba(240,165,0,.18);border-radius:8px;padding:7px 9px;margin-bottom:10px;line-height:1.55;">🔧 <b style="color:#f0a500;">시설물 담당자</b>: 순찰자가 올린 <b>시설물 점검</b>을 재평가·회신하는 사람입니다. 지정된 담당자에게만 점검 알림이 갑니다. 이름 옆 🔧 버튼으로 지정하세요.</div>`;

  // ── 신규 승인 대기 섹션 (최상단 강조) ──
  if(pendingNew.length){
    html+=`<div style="background:rgba(230,126,34,.07);border:1px solid rgba(230,126,34,.3);border-radius:11px;padding:11px;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:800;color:#e67e22;margin-bottom:9px;">🆕 신규 승인 대기 <span style="background:#e67e22;color:#fff;border-radius:10px;padding:0 7px;font-size:10px;margin-left:3px;">${pendingNew.length}</span></div>`
      +pendingNew.map(u=>`<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid rgba(255,255,255,.05);">
        ${u.kakaoImg?`<img src="${_esc(_imgHttps(u.kakaoImg))}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">`:`<div style="width:34px;height:34px;border-radius:50%;background:#3a2a18;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">🆕</div>`}
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:700;color:#e0edf8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_esc(u.name||'이름없음')}</div>
          <div style="font-size:10px;color:#9c8060;margin-top:1px;">${_esc(u.dept||'소속 미입력')}${u.rank?' · '+_esc(u.rank):''} <span style="font-family:monospace;color:#6a5030;">ID ${_esc(u.kakaoId)}</span></div>
        </div>
        <button onclick="grantMember('${_escq(u.kakaoId)}')" style="flex-shrink:0;background:#27ae60;color:#fff;border:none;border-radius:8px;padding:8px 13px;font-size:12px;font-weight:800;cursor:pointer;">✅ 승인</button>
        ${u.puId?`<button onclick="deleteUser('${_escq(u.puId)}')" style="flex-shrink:0;background:rgba(192,57,43,.15);color:#ff8a80;border:1px solid rgba(192,57,43,.25);border-radius:8px;padding:8px 10px;font-size:11px;cursor:pointer;">거부</button>`:''}
      </div>`).join('')
      +`</div>`;
  }

  html+=`
  <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;">
    ${chips.map(d=>`<div onclick="setAdmMemberFilter('${d}')" style="padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;cursor:pointer;${d===_admMemberFilter?'background:#1a4a6e;color:#4fa8d0;':'background:#0b1c30;color:#4a7090;border:1px solid #1a3a5a;'}">${d}</div>`).join('')}
  </div>`;

  if(!fu.length){
    html+=`<div style="font-size:11px;color:#4a7090;padding:8px 0;">카카오 로그인 이력이 없습니다. 직원들이 카카오 로그인하면 자동으로 표시됩니다.</div>`;
  } else {
    html+=fu.map(u=>{
      const role=roleOf(u.kakaoId);
      const roleBadge=role==='admin'?'<span style="color:#5dbf8a;font-size:10px;font-weight:700;">관리자</span>':role==='member'?'<span style="color:#4fa8d0;font-size:10px;font-weight:700;">멤버</span>':'<span style="color:#7a5040;font-size:10px;">미등록</span>';
      const isFacMgr=facMgrs.indexOf(String(u.kakaoId))>=0;
      const facMgrBadge=isFacMgr?'<span style="color:#f0a500;font-size:10px;font-weight:700;">🔧담당</span>':'';
      const appBadge=u.approvalStatus==='approved'?'<span style="color:#7ec8a0;font-size:9px;">✅승인</span>':(u.approvalStatus?'<span style="color:#e67e22;font-size:9px;">⏳대기</span>':'');
      const editId='adme_'+u.kakaoId;
      return `<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);">
        <div style="display:flex;align-items:center;gap:8px;">
          ${u.kakaoImg?`<img src="${_esc(_imgHttps(u.kakaoImg))}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">`:`<div style="width:32px;height:32px;border-radius:50%;background:#1a3a5a;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">👤</div>`}
          <div style="flex:1;min-width:0;">
            <div style="font-size:12px;font-weight:700;color:#e0edf8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_esc(u.name||'이름없음')} ${roleBadge} ${facMgrBadge} ${appBadge}</div>
            <div style="font-size:10px;color:#4a7090;margin-top:1px;">${_esc(u.dept)}${u.rank?' · '+_esc(u.rank):''} <span style="font-family:monospace;color:#2a5060;">ID ${_esc(u.kakaoId)}</span></div>
            ${u.reg?`<div style="font-size:9px;color:#3a5a6a;margin-top:1px;">📅 등록 ${new Date(u.reg).toLocaleString('ko-KR',{year:'2-digit',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</div>`:''}
          </div>
          <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">
            ${_isDeveloper(u.kakaoId)
              ?`<span style="font-size:10px;color:#5dbf8a;font-weight:800;background:rgba(39,174,96,.12);border:1px solid rgba(39,174,96,.3);border-radius:7px;padding:4px 8px;">👨‍💻 개발자</span>`
              :`<select onchange="_aclSetRole('${_escq(u.kakaoId)}',this.value)" style="background:#0a1626;color:#cfe2f2;border:1px solid rgba(79,168,208,.25);border-radius:7px;padding:4px 5px;font-size:10px;cursor:pointer;">
              <option value="none"${role==='none'?' selected':''}>미등록</option>
              <option value="member"${role==='member'?' selected':''}>멤버</option>
              <option value="admin"${role==='admin'?' selected':''}>관리자</option>
            </select>`}
            <button onclick="_toggleFacManager('${_escq(u.kakaoId)}')" title="시설물 점검 담당자 지정/해제" style="background:${isFacMgr?'rgba(240,165,0,.18)':'rgba(255,255,255,.04)'};color:${isFacMgr?'#f0a500':'#6a8296'};border:1px solid ${isFacMgr?'rgba(240,165,0,.4)':'rgba(255,255,255,.12)'};border-radius:6px;padding:4px 7px;font-size:10px;cursor:pointer;">🔧</button>
            <button onclick="_toggleAdmMemberEdit('${_escq(editId)}')" style="background:rgba(79,168,208,.12);color:#4fa8d0;border:1px solid rgba(79,168,208,.25);border-radius:6px;padding:4px 7px;font-size:10px;cursor:pointer;">수정</button>
            ${role==='none'&&!_isDeveloper(u.kakaoId)?`<button onclick="grantMember('${_escq(u.kakaoId)}')" style="background:rgba(39,174,96,.15);color:#7ec8a0;border:1px solid rgba(39,174,96,.3);border-radius:6px;padding:4px 7px;font-size:10px;cursor:pointer;">승인</button>`:''}
            ${!_isDeveloper(u.kakaoId)?`<button onclick="removeStaff('${_escq(u.kakaoId)}')" style="background:rgba(192,57,43,.15);color:#ff8a80;border:1px solid rgba(192,57,43,.25);border-radius:6px;padding:4px 7px;font-size:10px;cursor:pointer;">탈퇴</button>`:''}
          </div>
        </div>
        <div id="admMemberEdit_${editId}" style="display:none;margin-top:8px;background:rgba(0,0,0,.25);border-radius:9px;padding:10px;">
          <div style="font-size:10px;color:#4a7090;font-weight:600;margin-bottom:7px;">✏️ 직원 정보 수정</div>
          <input id="admME_name_${editId}" class="fi" value="${_esc(u.name||'')}" placeholder="이름" style="margin-bottom:6px;">
          <select id="admME_dept_${editId}" class="fsel" style="margin-bottom:6px;">
            ${deptOpts.map(d=>`<option value="${d}"${u.dept===d?' selected':''}>${d}</option>`).join('')}
          </select>
          <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;" id="admME_ranks_${editId}">
            ${rankOpts.map(r=>`<div onclick="_toggleAdmRank('${_escq(editId)}','${r}')" id="admMER_${editId}_${r}" style="cursor:pointer;border-radius:20px;font-size:10px;font-weight:700;padding:4px 10px;border:1px solid;${u.rank===r?'background:rgba(79,168,208,.2);color:#4fa8d0;border-color:rgba(79,168,208,.5);':'background:rgba(255,255,255,.04);color:rgba(255,255,255,.4);border-color:rgba(255,255,255,.12);'}">${r}</div>`).join('')}
          </div>
          <div style="display:flex;gap:6px;">
            <button onclick="_saveAdmMemberByKakao('${_escq(u.kakaoId)}','${_escq(editId)}')" style="flex:1;background:#1a4a6e;color:#fff;border:none;padding:7px;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;">저장</button>
            <button onclick="_toggleAdmMemberEdit('${_escq(editId)}')" style="background:none;border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.4);padding:7px 10px;border-radius:7px;font-size:11px;cursor:pointer;">취소</button>
          </div>
        </div>
      </div>`;
    }).join('');

    // 카카오 ID 직접 추가
    html+=`<div style="display:flex;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06);">
      <input id="aclAddIdInp" class="fi" placeholder="카카오 ID 직접 추가 (숫자)" style="flex:1;font-family:monospace;font-size:12px;">
      <button onclick="_aclAddById()" style="background:#1a4a6e;color:#fff;border:none;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;">＋ 멤버</button>
    </div>`;
  }
  document.getElementById('admMembersWrap').innerHTML=html;
}
// 통합 직원 정보 저장 (kakaoId 기반으로 pendingUsers 찾거나 새로 생성)
function _saveAdmMemberByKakao(kakaoId,editId){
  const list=DB.g('pendingUsers')||[];
  const name=(document.getElementById('admME_name_'+editId)||{}).value?.trim();
  const dept=(document.getElementById('admME_dept_'+editId)||{}).value||'';
  const rankEl=document.querySelector('#admME_ranks_'+editId+' [data-sel="1"]');
  const rank=rankEl?rankEl.textContent.trim():'';
  if(!name){toast('⚠️ 이름을 입력하세요');return;}
  const idx=list.findIndex(u=>String(u.kakaoId||u.id)===String(kakaoId));
  if(idx>=0){
    list[idx]={...list[idx],realName:name,name,dept,rank};
  } else {
    list.push({id:Date.now(),kakaoId:String(kakaoId),realName:name,name,dept,rank,approvalStatus:'approved',createdAt:now()});
  }
  DB.s('pendingUsers',list);
  // loginLog도 갱신
  const log=(DB.g('loginLog')||[]).slice();
  const li=log.findIndex(e=>String(e.kakaoId)===String(kakaoId));
  if(li>=0){log[li]={...log[li],name,dept,rank};DB.s('loginLog',log);}
  const me=DB.g('currentUser')||{};
  if(String(me.kakaoId)===String(kakaoId)){DB.s('currentUser',{...me,realName:name,name,dept,rank});updateUserUI();}
  renderAdmMembers();
  toast('✅ 직원 정보 저장됨');
}
var _admMemberFilter='전체';
function setAdmMemberFilter(f){_admMemberFilter=f;renderAdmMembers();}
function _toggleAdmMemberEdit(id){
  const el=document.getElementById('admMemberEdit_'+id);
  if(el)el.style.display=el.style.display==='none'?'block':'none';
}
function _toggleAdmRank(uid,rank){
  const rankOpts=['주임','계장','팀장','과장','분소장','소장'];
  rankOpts.forEach(r=>{
    const el=document.getElementById(`admMER_${uid}_${r}`);
    if(!el)return;
    const on=r===rank;
    el.style.background=on?'rgba(79,168,208,.2)':'rgba(255,255,255,.04)';
    el.style.color=on?'#4fa8d0':'rgba(255,255,255,.4)';
    el.style.borderColor=on?'rgba(79,168,208,.5)':'rgba(255,255,255,.12)';
    el.dataset.sel=on?'1':'';
  });
}
function renderAdmCat(){
  const cats=DB.g('catFac')||[];
  const meta=DB.g('catFacMeta')||{};
  const togHtml=(id,label,checked)=>`<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#7a9cb8;cursor:pointer;margin-top:5px;"><input type="checkbox" id="${id}"${checked?' checked':''}> ${label}</label>`;
  const rowsHtml=cats.map((c,i)=>{
    const m=meta[c]||{};
    const badges=(m.rescue?'<span style="font-size:9px;background:rgba(79,168,208,.15);color:#4fa8d0;border:1px solid rgba(79,168,208,.3);border-radius:3px;padding:1px 5px;margin-right:3px;">🗺 재난</span>':'')+(m.adminOnly?'<span style="font-size:9px;background:rgba(192,57,43,.12);color:#e05050;border:1px solid rgba(192,57,43,.3);border-radius:3px;padding:1px 5px;">🔒 관리자</span>':'');
    return `<div style="border-bottom:1px solid rgba(255,255,255,.05);padding:6px 0;">
      <div class="adm-row" style="margin-bottom:0;">
        <div class="adm-info" style="flex:1;min-width:0;">
          <div class="adm-name" style="font-size:12px;">${_esc(c)}</div>
          <div style="margin-top:3px;">${badges||'<span style="font-size:9px;color:#3a6a8a;">일반</span>'}</div>
        </div>
        <button class="abtn" style="font-size:10px;" onclick="toggleCatEdit(${i})">수정</button>
        <button class="abtn del" style="font-size:10px;" onclick="delCat(${i})">삭제</button>
      </div>
      <div id="catEdit${i}" style="display:none;padding:8px;background:rgba(0,0,0,.2);border-radius:7px;margin-top:4px;">
        <input type="text" id="catEditName${i}" class="fi" value="" style="margin-bottom:4px;">
        ${togHtml('catER'+i,'🗺 재난관리지도에 표시',m.rescue)}
        ${togHtml('catEA'+i,'🔒 관리자만 볼 수 있음',m.adminOnly)}
        <div style="display:flex;gap:6px;margin-top:8px;">
          <button onclick="submitEditCat(${i})" style="flex:1;background:#1a4a6e;color:#fff;border:none;padding:7px;border-radius:7px;font-size:11px;cursor:pointer;">저장</button>
          <button onclick="toggleCatEdit(${i})" style="background:none;border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.4);padding:7px 10px;border-radius:7px;font-size:11px;cursor:pointer;">취소</button>
        </div>
      </div>
    </div>`;
  }).join('');
  const addHtml=`<div id="catAddForm" style="display:none;padding:10px;background:rgba(0,0,0,.2);border-radius:9px;margin-top:8px;">
    <input type="text" id="newCatName" class="fi" placeholder="이모지 포함 이름 예: 🛖 야영시설" style="margin-bottom:4px;">
    ${togHtml('newCatRescue','🗺 재난관리지도에 표시',false)}
    ${togHtml('newCatAdmin','🔒 관리자만 볼 수 있음',false)}
    <div style="display:flex;gap:6px;margin-top:8px;">
      <button onclick="submitAddCat()" style="flex:1;background:#0c4838;color:#fff;border:none;padding:8px;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;">추가</button>
      <button onclick="document.getElementById('catAddForm').style.display='none';document.getElementById('catAddBtn').style.display='block';" style="background:none;border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.4);padding:8px 10px;border-radius:7px;font-size:11px;cursor:pointer;">취소</button>
    </div>
  </div>
  <button id="catAddBtn" class="btn btn-ghost" style="width:100%;padding:9px;border-radius:8px;margin-top:8px;font-size:12px;" onclick="this.style.display='none';document.getElementById('catAddForm').style.display='block';">＋ 카테고리 추가</button>`;
  document.getElementById('admCatWrap').innerHTML=`<div style="font-size:10px;color:#3a6a8a;margin-bottom:7px;font-weight:600;">시설물 카테고리</div>${rowsHtml}${addHtml}`;
  // 수정 폼 name 값 채우기 (innerHTML escaping 우회)
  cats.forEach((c,i)=>{const el=document.getElementById('catEditName'+i);if(el)el.value=c;});
}
function toggleCatEdit(i){const el=document.getElementById('catEdit'+i);if(el)el.style.display=el.style.display==='none'?'block':'none';}
function submitAddCat(){
  const n=(document.getElementById('newCatName').value||'').trim();
  if(!n){toast('⚠️ 카테고리명 입력');return;}
  const cats=DB.g('catFac')||[];
  if(cats.includes(n)){toast('⚠️ 이미 존재');return;}
  cats.push(n);DB.s('catFac',cats);
  const meta=DB.g('catFacMeta')||{};
  meta[n]={rescue:!!document.getElementById('newCatRescue').checked,adminOnly:!!document.getElementById('newCatAdmin').checked};
  DB.s('catFacMeta',meta);renderAdmCat();toast('✅ 추가');
}
function submitEditCat(i){
  const cats=DB.g('catFac')||[];const oldName=cats[i];
  const newName=(document.getElementById('catEditName'+i).value||'').trim();
  if(!newName){toast('⚠️ 카테고리명 입력');return;}
  cats[i]=newName;DB.s('catFac',cats);
  const meta=DB.g('catFacMeta')||{};
  if(oldName!==newName)delete meta[oldName];
  meta[newName]={rescue:!!document.getElementById('catER'+i).checked,adminOnly:!!document.getElementById('catEA'+i).checked};
  DB.s('catFacMeta',meta);renderAdmCat();toast('✅ 수정');
}
function delCat(i){if(!confirm('삭제?'))return;const cats=DB.g('catFac')||[];const name=cats[i];cats.splice(i,1);DB.s('catFac',cats);const meta=DB.g('catFacMeta')||{};delete meta[name];DB.s('catFacMeta',meta);renderAdmCat();}
function renderAdmSheets(){
  const url=DB.g('sheetsUrl')||'';
  document.getElementById('admSheetsWrap').innerHTML=`
    <div class="scard" style="margin-bottom:8px;"><div class="stitle">🔗 Google Sheets 자동 동기화</div>
      <div style="font-size:12px;color:#7a9cb8;line-height:1.6;margin-bottom:10px;">구조보고·시설점검 저장 시 자동으로 스프레드시트에 기록됩니다.</div>
      <div class="fg"><span class="fl">Apps Script 배포 URL</span><input type="text" id="sheetsUrlIn" class="fi" placeholder="https://script.google.com/macros/s/..." value="${url}"></div>
      <button onclick="saveSheetsUrl()" style="width:100%;background:${url?'#0c4838':'#1a4a6e'};color:#fff;border:none;padding:10px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">${url?'✅ 저장됨 (재입력하여 변경)':'저장'}</button>
    </div>
    <div class="scard" style="margin-bottom:8px;"><div class="stitle">📌 Google Sheets 설정 방법</div>
      <div style="font-size:11px;color:#7a9cb8;line-height:1.8;">1. Google Sheets 열기<br>2. 확장 프로그램 → Apps Script<br>3. 코드 작성 → 배포 → 웹앱으로 배포<br>4. 생성된 URL을 위에 입력</div>
    </div>
    <div class="scard" style="margin-bottom:8px;">
      <div class="stitle">🚒 외부기관 관리</div>
      <div style="font-size:11px;color:#7a9cb8;margin-bottom:8px;">119·산악구조대·특수대응단 등 기관별로 추가하세요. 각 기관에 코드를 전달하면 해당 기관명으로 접수됩니다 (접수·조회·댓글만 가능).</div>
      <div id="extAgencyListWrap">${_extAgencyRowsHtml()}</div>
      <div style="display:flex;gap:6px;margin-top:8px;">
        <button onclick="addExtAgencyRow()" style="flex:1;background:rgba(255,255,255,.05);color:#9bbdd4;border:1px dashed rgba(255,120,30,.3);padding:9px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">＋ 기관 추가</button>
        <button onclick="saveExtAgencies()" style="flex:1;background:#7a3010;color:#fff;border:none;padding:9px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">💾 전체 저장</button>
      </div>
    </div>
    <div class="scard" style="margin-bottom:8px;">
      <div class="stitle">🤖 AI 출동지령서 스캔 키</div>
      <div style="font-size:11px;color:#7a9cb8;margin-bottom:8px;">Google Gemini API 키 (무료) — <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:#c4b5fd;">aistudio.google.com</a>에서 발급</div>
      <div style="display:flex;gap:6px;">
        <input id="geminiKeyInp" type="password" class="fi" value="${DB.g('geminiApiKey')||''}" placeholder="AIza..." style="flex:1;font-family:monospace;font-size:13px;">
        <button onclick="saveGeminiKey()" style="background:#1a3a20;color:#86efac;border:1px solid rgba(74,222,128,.3);padding:8px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">저장</button>
      </div>
      <div style="font-size:10px;color:#3a4a6a;margin-top:7px;">무료 티어: 1일 1,500회 · 분당 100만 토큰 · 결제 불필요</div>
    </div>
    <div class="scard" style="margin-bottom:8px;">
      <div class="stitle">🎯 커스텀 사고유형 아이콘</div>
      <div style="font-size:11px;color:#7a9cb8;margin-bottom:8px;">'기타'로 직접 입력해 쓰는 사고유형(예: 낙석, 화재)에 전용 지도 아이콘을 지정. 등록하면 전 기기에 공유됩니다.</div>
      <div id="customTypeList">${(DB.g('customResTypes')||[]).map((t,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#0b1c30;border-radius:7px;margin-bottom:4px;border:1px solid rgba(255,255,255,.07);">
        <span style="font-size:16px;">${_esc(t.ico||'⚠️')}</span><span style="flex:1;font-size:12px;color:#e0edf8;font-weight:600;">${_esc(t.name||'')}</span>
        <button onclick="delCustomResType(${i})" style="background:rgba(192,57,43,.15);color:#c0392b;border:none;border-radius:5px;padding:3px 9px;font-size:11px;cursor:pointer;">삭제</button>
      </div>`).join('')||'<div style="font-size:11px;color:#3a4a6a;padding:4px 2px;">등록된 커스텀 유형 없음</div>'}</div>
      <div style="display:flex;gap:6px;margin-top:8px;">
        <input id="ctypeName" type="text" class="fi" placeholder="유형 이름 (예: 낙석)" style="flex:2;">
        <input id="ctypeIco" type="text" class="fi" placeholder="이모지" maxlength="4" style="flex:1;text-align:center;">
        <button onclick="addCustomResType()" style="background:#1a3a20;color:#86efac;border:1px solid rgba(74,222,128,.3);padding:8px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">추가</button>
      </div>
    </div>
    <div class="scard" style="margin-bottom:8px;">
      <div class="stitle">📄 한글 보고서 서식 (hwpx)</div>
      <div style="font-size:11px;color:#7a9cb8;margin-bottom:8px;line-height:1.6;">실제 결재 서식(.hwpx)을 등록하면 보고서 버튼이 <b style="color:#9fc0da;">그 서식 그대로</b> 데이터를 채운 한글파일을 만듭니다.<br>
      ① 한글에서 서식 문서를 열고, 값이 들어갈 칸에 <b style="color:#e8b34a;">{{사고일시}}</b> 같은 자리표시자를 입력<br>
      ② 다른 이름으로 저장 → <b>HWPX</b> 형식 선택 ③ 아래에서 업로드</div>
      <button onclick="copyTplPlaceholders()" style="width:100%;margin-bottom:8px;background:rgba(232,179,74,.1);border:1px solid rgba(232,179,74,.35);color:#e8b34a;padding:8px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">📋 자리표시자 전체 목록 복사</button>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="font-size:12px;color:#cfe2f2;flex:1;">📑 처리현황: <span id="tplName_status" style="color:#7a9cb8;">확인중…</span></span>
        <label style="background:#1a3a20;color:#86efac;border:1px solid rgba(74,222,128,.3);padding:7px 12px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">업로드<input type="file" accept=".hwpx" style="display:none;" onchange="uploadHwpxTpl('status',this)"></label>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:12px;color:#cfe2f2;flex:1;">📈 동향보고: <span id="tplName_trend" style="color:#7a9cb8;">확인중…</span></span>
        <label style="background:#1a3a20;color:#86efac;border:1px solid rgba(74,222,128,.3);padding:7px 12px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">업로드<input type="file" accept=".hwpx" style="display:none;" onchange="uploadHwpxTpl('trend',this)"></label>
      </div>
    </div>
    <div class="scard">
      <div class="stitle">🌦️ 기상청 프록시 주소</div>
      <div style="font-size:11px;color:#7a9cb8;margin-bottom:8px;">실제 기상청 데이터를 안정적으로 받기 위한 본인 소유 프록시(Cloudflare Worker) 주소. 비우면 공개 프록시로 동작. 설정법: 저장소 <b>cloudflare-worker/README.md</b></div>
      <div style="display:flex;gap:6px;">
        <input id="kmaProxyInp" type="text" class="fi" value="${_esc(DB.g('kmaProxyUrl')||'')}" placeholder="https://seoraksan-kma.xxx.workers.dev" style="flex:1;font-family:monospace;font-size:11px;">
        <button onclick="saveKmaProxy()" style="background:#1a3a20;color:#86efac;border:1px solid rgba(74,222,128,.3);padding:8px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">저장</button>
      </div>
      <div style="font-size:10px;color:#3a4a6a;margin-top:7px;">Cloudflare Workers 무료: 1일 10만 요청 · 설정 후 날씨 상세 출처가 '기상청'으로 표시</div>
    </div>`;
  setTimeout(_loadTplNames,80); // hwpx 서식 등록 상태 비동기 표시
}
// ── 한글 서식(hwpx) 템플릿 관리 ──
function _loadTplNames(){
  if(typeof _fdb==='undefined'||!_fdb)return;
  ['status','trend'].forEach(k=>{
    _fdb.collection('tpl').doc(k).get().then(d=>{
      const el=document.getElementById('tplName_'+k);if(!el)return;
      const dt=d.exists?d.data():null;
      if(dt&&dt.b64){el.textContent='✅ '+(dt.name||'등록됨')+(dt.by?' · '+dt.by:'');el.style.color='#86efac';}
      else{el.textContent='미등록 (HTML 방식으로 동작)';el.style.color='#7a9cb8';}
    }).catch(()=>{const el=document.getElementById('tplName_'+k);if(el)el.textContent='조회 실패';});
  });
}
async function uploadHwpxTpl(kind,input){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');input.value='';return;}
  const f=input.files&&input.files[0];if(!f)return;
  if(!/\.hwpx$/i.test(f.name)){toast('⚠️ .hwpx 파일만 가능 — 한글에서 [다른 이름으로 저장 → HWPX]');input.value='';return;}
  if(f.size>700*1024){toast('⚠️ 700KB 이하만 가능 — 서식에서 큰 이미지를 빼주세요');input.value='';return;}
  try{
    const buf=await f.arrayBuffer();
    // hwpx(zip) 유효성 간단 확인
    try{await _zipRead(buf.slice(0));}catch(e){toast('⚠️ 올바른 hwpx가 아닙니다: '+e.message);input.value='';return;}
    const u8=new Uint8Array(buf);let b64='';const CH=0x8000;
    for(let i=0;i<u8.length;i+=CH)b64+=String.fromCharCode.apply(null,u8.subarray(i,i+CH));
    b64=btoa(b64);
    await _fdb.collection('tpl').doc(kind).set({b64:b64,name:f.name,at:Date.now(),by:getAuthor()});
    toast('✅ 서식 등록됨: '+f.name+' — 이제 보고서 버튼이 이 서식으로 생성합니다',5000);
    _loadTplNames();
  }catch(e){toast('⚠️ 업로드 실패: '+(e&&e.message||e));}
  input.value='';
}
function copyTplPlaceholders(){
  const list=(typeof HWPX_PLACEHOLDERS!=='undefined'?HWPX_PLACEHOLDERS:[]).map(k=>'{{'+k+'}}').join('\n');
  const txt='── 한글 서식 자리표시자 목록 (원하는 칸에 붙여넣기) ──\n'+list+'\n\n※ 여러 줄 항목: {{조치내용}} {{동원인원}} {{사고경위}}\n※ 서식에 없는 자리표시자는 빈칸으로 처리됩니다';
  if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=>toast('📋 자리표시자 목록 복사됨 — 한글 서식에 붙여넣어 배치하세요',5000)).catch(()=>_fallbackCopy(txt));
  else _fallbackCopy(txt);
}
// 커스텀 사고유형 아이콘 등록/삭제 (공유 customResTypes → RES_TYPES 병합)
function addCustomResType(){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const name=(document.getElementById('ctypeName')?.value||'').trim();
  const ico=(document.getElementById('ctypeIco')?.value||'').trim();
  if(!name){toast('유형 이름을 입력하세요');return;}
  if(!ico){toast('이모지를 입력하세요');return;}
  const list=(DB.g('customResTypes')||[]).filter(t=>t&&t.name!==name);
  list.push({name:name.slice(0,12),ico:ico.slice(0,4)});
  DB.s('customResTypes',list);
  try{_mergeCustomResTypes();}catch(e){}
  toast('✅ 커스텀 유형 등록: '+ico+' '+name);
  try{renderAdmSheets();}catch(e){}
  try{renderRescueMap();}catch(e){}
}
function delCustomResType(i){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const list=DB.g('customResTypes')||[];
  const t=list[i];if(!t)return;
  if(!confirm("'"+(t.ico||'')+' '+(t.name||'')+"' 커스텀 유형을 삭제할까요? (기존 기록은 기타 아이콘으로 표시)"))return;
  list.splice(i,1);
  DB.s('customResTypes',list);
  try{delete RES_TYPES[t.name];}catch(e){}
  toast('🗑 삭제됨');
  try{renderAdmSheets();}catch(e){}
  try{renderRescueMap();}catch(e){}
}
function saveSheetsUrl(){const url=document.getElementById('sheetsUrlIn')?.value?.trim();if(!url){toast('⚠️ URL 입력');return;}DB.s('sheetsUrl',url);toast('✅ URL 저장');renderAdmSheets();}
// ── 전체 데이터 백업/복원 (JSON) ──
const _BACKUP_KEYS=['rescues','hazards','facilities','history','catFac','catFacMeta','pendingUsers','approvedUsers','deletedKakaoIds'];
function toggleSosBlock(){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const cur=!!DB.g('sosBlocked');
  if(!confirm(cur?'조난·사고자 접수를 다시 허용할까요?':'조난·사고자 접수를 차단할까요?\n차단 중엔 위치가 들어오지 않습니다(악용 방지).'))return;
  DB.s('sosBlocked',!cur);
  toast(cur?'✅ 조난 접수 허용됨':'⛔ 조난 접수 차단됨');
  try{renderAdmSys();}catch(e){}try{_sosPings=[];_drawSosPins();_updateSosFab();}catch(e){}
}
function exportAllData(){
  const data={};
  _BACKUP_KEYS.forEach(k=>{data[k]=DB.g(k);});
  const out={app:'seoraksan',ver:APP_VER,exportedAt:now(),data};
  const blob=new Blob(['\uFEFF'+JSON.stringify(out,null,1)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='설악산백업_'+today()+'.json';
  a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);
  toast('⬇️ 백업 파일 다운로드');
}
function importAllData(inp){
  const f=inp.files&&inp.files[0];inp.value='';
  if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{
    try{
      const out=JSON.parse(String(rd.result).replace(/^\uFEFF/,''));
      if(!out||out.app!=='seoraksan'||!out.data){toast('⚠️ 올바른 백업 파일이 아닙니다');return;}
      const counts=_BACKUP_KEYS.map(k=>{const v=out.data[k];return v&&v.length?k+' '+v.length+'건':null;}).filter(Boolean).join(', ');
      if(!confirm('백업 시점: '+(out.exportedAt||'?')+'\n'+counts+'\n\n현재 데이터를 이 백업으로 덮어씁니다. 계속할까요?'))return;
      if(!confirm('⚠️ 마지막 확인 — 복원 후 되돌릴 수 없습니다.'))return;
      _BACKUP_KEYS.forEach(k=>{if(out.data[k]!==undefined&&out.data[k]!==null)DB.s(k,out.data[k]);});
      toast('✅ 복원 완료');
      renderAdmCtrl();try{renderRescueMap();}catch(e){}updateSummary();
    }catch(e){toast('⚠️ 파일을 읽을 수 없습니다');}
  };
  rd.readAsText(f);
}

// ── 허용목록(_acl) 관리 ──
function _getAcl(){
  const a=DB.g('_acl')||{};
  const norm=x=>(Array.isArray(x)?x:[]).map(String).filter(Boolean);
  // 탈퇴자(deletedKakaoIds)는 _acl에 남아 있어도 무시 — 옛 캐시를 가진 기기가 _acl을 통째로
  // 덮어써 탈퇴 관리자가 '부활'하는 사고가 실제 발생(2026-07 점검). 권한 판정에서 원천 차단하고,
  // 다음 역할 변경 저장 때 문서도 자연히 정화된다. (정식 재가입 승인 시엔 deletedKakaoIds에서
  // 제거되므로 필터에 걸리지 않음)
  const del=new Set((DB.g('deletedKakaoIds')||[]).map(String));
  return {members:norm(a.members).filter(id=>!del.has(id)),admins:norm(a.admins).filter(id=>!del.has(id))};
}
function _aclSetRole(kakaoId,role){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  kakaoId=String(kakaoId);
  const acl=_getAcl();
  acl.members=acl.members.filter(id=>id!==kakaoId);
  acl.admins=acl.admins.filter(id=>id!==kakaoId);
  if(role==='member')acl.members.push(kakaoId);
  else if(role==='admin')acl.admins.push(kakaoId);
  DB.s('_acl',acl);
  renderAdmSys();
  toast(role==='none'?'제거됨':role==='admin'?'관리자로 설정':'멤버로 설정');
}
function _aclAddById(){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const inp=document.getElementById('aclAddIdInp');
  const id=(inp&&inp.value||'').trim();
  if(!id){toast('⚠️ 카카오 ID를 입력하세요');return;}
  if(!/^\d+$/.test(id)){toast('⚠️ 카카오 ID는 숫자여야 합니다');return;}
  _aclSetRole(id,'member');
}
// ── 시설물 담당자 지정/해제 (관리자만) — 점검 등록 시 이들에게만 알림, 재평가 권한 ──
function _toggleFacManager(kakaoId){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  kakaoId=String(kakaoId);
  const list=(DB.g('facManagers')||[]).map(String).filter(Boolean);
  const i=list.indexOf(kakaoId);
  if(i>=0){list.splice(i,1);toast('🔧 시설물 담당자 해제');}
  else{list.push(kakaoId);toast('🔧 시설물 담당자 지정 — 점검 알림 대상');}
  DB.s('facManagers',list);
  try{renderAdmMembers();}catch(e){}
}
// ── 자동 승인 모드 ── (발표·대량 가입 시 1탭으로 이후 가입자 전원 자동 입장)
function _isAutoApprove(){return !!DB.g('autoApprove');}
function toggleAutoApprove(){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const cur=_isAutoApprove();
  if(!confirm(cur
      ?'자동 승인을 끌까요?\n이후 가입자는 다시 관리자가 직접 승인해야 입장합니다.'
      :'자동 승인을 켤까요?\n지금부터 카카오 로그인한 직원은 승인 대기 없이 바로 입장합니다.\n(발표·대량 가입용 — 끝나면 다시 끄세요)'))return;
  DB.s('autoApprove',!cur);
  if(!cur){try{_autoApproveSweep();}catch(e){}} // 켜는 즉시 대기자 일괄 승인
  toast(cur?'🔒 자동 승인 꺼짐 — 수동 승인 모드':'✅ 자동 승인 켜짐 — 이후 가입자 자동 입장');
  try{renderAdmMembers();}catch(e){}
}
// 관리자 기기: 대기 중인 신청자를 모두 멤버로 등록(자동 승인 ON일 때)
function _autoApproveSweep(){
  // 로그인 이력(loginLog) + 가입신청(pendingUsers)의 모든 kakaoId를 멤버로 등록.
  // (이전엔 pendingUsers만 훑어, 로그인만 하고 신청레코드 없는 사용자가 누락 → 승인버튼 잔존·입장불가)
  const acl=_getAcl();let n=0;
  const deleted=new Set((DB.g('deletedKakaoIds')||[]).map(String)); // 관리자가 내보낸 사람은 제외
  const ids=new Set();
  (DB.g('loginLog')||[]).forEach(function(e){if(e&&e.kakaoId)ids.add(String(e.kakaoId));});
  (DB.g('pendingUsers')||[]).forEach(function(p){const k=String(p.kakaoId||p.id||'');if(k)ids.add(k);});
  ids.forEach(function(k){
    if(!k||deleted.has(k))return;
    if(acl.admins.indexOf(k)<0&&acl.members.indexOf(k)<0){acl.members.push(k);n++;}
  });
  if(n){DB.s('_acl',acl);
    // pendingUsers 상태도 approved로 갱신
    const list=(DB.g('pendingUsers')||[]).map(function(p){
      const kid=String(p.kakaoId||p.id);
      if(acl.members.indexOf(kid)>=0||acl.admins.indexOf(kid)>=0)return Object.assign({},p,{approvalStatus:'approved',seen:true});
      return p;
    });
    DB.s('pendingUsers',list);
  }
  return n;
}
// 본인 기기: 자동 승인 모드면 스스로 멤버 등록(관리자 부재여도 입장). _acl 쓰기는 인증사용자 누구나 허용.
function _aclSelfApprove(kakaoId){
  kakaoId=String(kakaoId||'');if(!kakaoId)return false;
  const acl=_getAcl();
  if(acl.members.indexOf(kakaoId)<0&&acl.admins.indexOf(kakaoId)<0){acl.members.push(kakaoId);DB.s('_acl',acl);}
  // pendingUsers 상태도 approved로 — 자동승인으로 들어왔는데 관리자 화면에 '승인' 버튼이 남던 문제 방지
  try{
    const list=DB.g('pendingUsers')||[];const i=list.findIndex(p=>String(p.kakaoId||p.id)===kakaoId);
    if(i>=0&&list[i].approvalStatus!=='approved'){list[i]=Object.assign({},list[i],{approvalStatus:'approved',seen:true});DB.s('pendingUsers',list);}
  }catch(e){}
  _markMemberOk();
  return true;
}
// 승인 대기 화면 폴링: 관리자가 승인(또는 자동 승인)하면 재로그인 없이 자동 입장
var _approvalPollTimer=null;
function _startApprovalPoll(){
  if(_approvalPollTimer)return;
  _approvalPollTimer=setInterval(function(){
    var gate=document.getElementById('approvalGate');
    if(!gate||gate.style.display==='none'){_stopApprovalPoll();return;}
    // 자동 승인 모드로 바뀌었으면 스스로 입장
    if(_isAutoApprove()){var u=DB.g('currentUser')||{};if(u.kakaoId)_aclSelfApprove(u.kakaoId);}
    if(_isMember()){
      _markMemberOk();_stopApprovalPoll();
      gate.style.display='none';
      try{updateUserUI();}catch(e){}try{goHome();}catch(e){}
      toast('✅ 승인 완료 — 환영합니다');
    }
  },3500);
}
function _stopApprovalPoll(){if(_approvalPollTimer){clearInterval(_approvalPollTimer);_approvalPollTimer=null;}}
// 전체 기기 오류 모아보기 (관리자 전용) — errLogs 컬렉션에서 최근순
// 전체 기기 오류 기록 삭제(관리자) — 최근 분량 일괄 삭제
function _clearAllErrLogs(){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  if(!_fdb){toast('서버 미연결');return;}
  if(!confirm('전체 기기의 오류 기록을 모두 삭제할까요?'))return;
  const el=document.getElementById('allErrLogs');if(el)el.innerHTML='<div style="font-size:11px;color:#5a8aaa;">삭제 중…</div>';
  _fdb.collection('errLogs').limit(400).get().then(function(snap){
    let n=0;const ps=[];snap.docs.forEach(function(d){n++;ps.push(d.ref.delete().catch(function(){}));});
    Promise.all(ps).then(function(){
      if(el)el.innerHTML='<div style="font-size:11px;color:rgba(255,255,255,.25);">기록 없음 ✅</div>';
      toast('🗑️ 오류 기록 '+n+'건 삭제됨'+(n>=400?' (많아서 더 있으면 한 번 더 눌러주세요)':''));
    });
  }).catch(function(){toast('삭제 실패');if(el)el.innerHTML='';});
}
function _loadAllErrLogs(){
  const el=document.getElementById('allErrLogs');
  if(!_fdb){if(el)el.innerHTML='<div style="font-size:11px;color:#e05050;">서버 미연결</div>';return;}
  if(el)el.innerHTML='<div style="font-size:11px;color:#5a8aaa;">불러오는 중…</div>';
  _fdb.collection('errLogs').orderBy('at','desc').limit(80).get().then(function(snap){
    if(!el)return;
    const rows=snap.docs.map(d=>d.data());
    if(!rows.length){el.innerHTML='<div style="font-size:11px;color:rgba(255,255,255,.25);">기록 없음 ✅</div>';return;}
    el.innerHTML=rows.map(function(r){
      const t=r.at?new Date(r.at).toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
      const who=(r.by||'미상')+(r.dept?'·'+r.dept:'');
      const plat=r.plat==='APP'?'📱앱':'🌐웹';
      return '<div style="font-size:10px;font-family:monospace;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.04);">'
        +'<span style="color:#7dd3fa;">'+plat+'</span> <span style="color:#9bbdd4;">'+_esc(who)+'</span> <span style="color:#5a7e98;">'+t+'</span><br>'
        +'<span style="color:#b8856a;">'+_esc(r.m||'')+'</span></div>';
    }).join('');
    // 7일 지난 오래된 기록 정리(한 번에 소량)
    try{_fdb.collection('errLogs').where('at','<',Date.now()-7*86400000).limit(40).get().then(function(s){s.docs.forEach(function(d){d.ref.delete().catch(function(){});});}).catch(function(){});}catch(e){}
  }).catch(function(){if(el)el.innerHTML='<div style="font-size:11px;color:#e05050;">불러오기 실패(색인 생성 중일 수 있음 — 잠시 후 재시도)</div>';});
}
function renderAdmSys(){
  // pushLog는 온디맨드 문서 — 화면 열 때 1회 갱신(60초 내 재렌더는 캐시 재사용)
  if(typeof _refreshDoc==='function'&&(!window._pushLogFreshAt||Date.now()-window._pushLogFreshAt>60000)){
    window._pushLogFreshAt=Date.now();
    _refreshDoc('pushLog').then(()=>{try{if(document.getElementById('admSysWrap'))renderAdmSys();}catch(e){}});
  }
  const unseenCnt=_getUnseenCount();
  document.getElementById('admSysWrap').innerHTML=`
    ${(()=>{try{ // 🗑 시설물 휴지통 — 삭제된 시설 복구(시설과·담당자), 영구삭제(개발자)
      const tr=DB.g('facTrash')||[];
      if(!tr.length)return '';
      const canPurge=(typeof _isMasterAdmin==='function'&&_isMasterAdmin());
      return `<div class="scard" style="margin-bottom:8px;">
        <div class="stitle">🗑 시설물 휴지통 <span style="font-size:9px;font-weight:400;color:#5a7e98;">삭제된 시설 — ♻️로 복구 (최근 100건 보관)</span></div>
        ${tr.map(t=>{const r=t.rec||{};const d=new Date(t.at);const ds=(d.getMonth()+1)+'/'+d.getDate();
          return `<div style="display:flex;align-items:center;gap:7px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:11.5px;color:#cfe2f2;">
            <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_esc((r.type||'').split(' ')[0])} ${_esc(r.name||'-')} <span style="color:#5a7e98;font-size:10px;">${ds} · ${_esc(t.by||'')}</span></span>
            <button onclick="restoreFac(${t.at})" style="background:rgba(94,207,143,.12);color:#5fcf8f;border:1px solid rgba(94,207,143,.3);border-radius:7px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0;">♻️ 복구</button>
            ${canPurge?`<button onclick="purgeFacTrash(${t.at})" style="background:none;color:#ff8a80;border:1px solid rgba(255,107,91,.3);border-radius:7px;padding:4px 8px;font-size:11px;cursor:pointer;flex-shrink:0;" title="영구 삭제">✕</button>`:''}
          </div>`;}).join('')}
      </div>`;
    }catch(e){return '';}})()}
    ${(()=>{try{
      if(typeof HOME_MENUS==='undefined')return'';
      const hid=_homeHiddenSet();
      return `<div class="scard" style="margin-bottom:8px;">
        <div class="stitle">🏠 홈 화면 메뉴 표시</div>
        <div style="font-size:11px;color:#7a9cb8;margin-bottom:8px;">완성 전인(미완성) 메뉴를 <b style="color:#cfe2f2;">전 직원 홈 화면</b>에서 숨깁니다. 숨겨도 데이터는 보존되며, 다시 표시하면 그대로 나타납니다. <span style="color:#5a7e98;">(‘내 설정’·‘관리자 전용’은 잠금 방지를 위해 항상 표시)</span></div>
        ${HOME_MENUS.map(m=>{const h=hid.has(m.k);return `<div style="display:flex;align-items:center;gap:8px;padding:8px 2px;border-bottom:1px solid rgba(255,255,255,.04);">
          <span style="flex:1;font-size:12.5px;color:${h?'#6a8296':'#e0edf8'};">${m.label}${h?' <span style="font-size:10px;color:#e0857a;font-weight:800;">· 숨김</span>':''}</span>
          <button onclick="_setHomeMenuHidden('${m.k}',${h?'false':'true'})" style="background:${h?'rgba(94,207,143,.12)':'rgba(192,57,43,.1)'};color:${h?'#5fcf8f':'#e0857a'};border:1px solid ${h?'rgba(94,207,143,.35)':'rgba(192,57,43,.3)'};border-radius:8px;padding:6px 13px;font-size:11.5px;font-weight:800;cursor:pointer;white-space:nowrap;">${h?'👁️ 표시하기':'🙈 숨기기'}</button>
        </div>`;}).join('')}
      </div>`;
    }catch(e){return'';}})()}
    <div class="scard" style="margin-bottom:8px;">
      <div class="stitle">💾 데이터 백업 / 복원</div>
      <div style="font-size:11px;color:#7a9cb8;margin-bottom:8px;">전체 데이터를 파일로 내려받아 보관하세요 (사진 원본은 서버에 별도 저장)</div>
      <div style="display:flex;gap:6px;">
        <button onclick="exportAllData()" style="flex:1;background:rgba(39,174,96,.1);color:#27ae60;border:1px solid rgba(39,174,96,.3);padding:9px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">⬇️ 전체 백업</button>
        <button onclick="document.getElementById('restoreFileInp').click()" style="flex:1;background:rgba(230,126,34,.08);color:#e67e22;border:1px solid rgba(230,126,34,.28);padding:9px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">⬆️ 복원</button>
        <input type="file" id="restoreFileInp" accept=".json" style="display:none;" onchange="importAllData(this)">
      </div>
    </div>
    <div class="scard" style="margin-bottom:8px;display:none;">
      <div class="stitle">🔄 앱 업데이트</div>
      <div style="font-size:11px;color:#7a9cb8;margin-bottom:8px;">현재 버전 <b style="color:#cfe2f2;">${OTA_VER}</b> · 앱(APK)은 재설치 없이 최신 코드로 자체 업데이트됩니다. (웹은 새로고침 시 자동)</div>
      <button onclick="_otaCheck(true)" style="width:100%;padding:11px;border-radius:8px;border:1px solid rgba(79,168,208,.4);background:rgba(79,168,208,.12);color:#4fa8d0;font-size:13px;font-weight:700;cursor:pointer;">🔄 업데이트 확인 / 적용</button>
    </div>
    <div class="scard" style="margin-bottom:8px;">
      <div class="stitle">🆘 조난·사고자 위치 접수</div>
      <div style="font-size:11px;color:#7a9cb8;margin-bottom:8px;">악용·오작동 시 전체 접수를 차단할 수 있습니다. 차단 중엔 1회용 링크도 발급되지 않고 수신 위치가 표시되지 않습니다.</div>
      ${(()=>{const blk=!!DB.g('sosBlocked');return `<button onclick="toggleSosBlock()" style="width:100%;padding:11px;border-radius:8px;border:1px solid ${blk?'rgba(39,174,96,.4)':'rgba(192,57,43,.4)'};background:${blk?'rgba(39,174,96,.12)':'rgba(192,57,43,.12)'};color:${blk?'#27ae60':'#e05050'};font-size:13px;font-weight:700;cursor:pointer;">${blk?'⛔ 현재 차단됨 — 탭하여 접수 허용':'🆗 현재 허용됨 — 탭하여 접수 차단'}</button>`;})()}
    </div>
    <div class="scard sel-ok" style="margin-bottom:8px;">
      <div class="stitle">🐞 오류 기록 <button onclick="localStorage.removeItem('_errLog');renderAdmSys();" style="float:right;background:none;border:none;color:rgba(255,255,255,.3);font-size:10px;cursor:pointer;">내 기록 비우기</button></div>
      <div style="font-size:10px;color:#5a8aaa;font-weight:700;margin:4px 0 3px;">📱 내 기기</div>
      ${(()=>{try{const log=JSON.parse(localStorage.getItem('_errLog')||'[]');return log.length?log.slice(0,8).map(e=>`<div style="font-size:10px;color:#b8856a;font-family:monospace;padding:2px 0;border-bottom:1px solid rgba(255,255,255,.04);">${e.t} ${_esc(e.m)}</div>`).join(''):'<div style="font-size:11px;color:rgba(255,255,255,.25);">기록된 오류 없음 ✅</div>';}catch(e){return'';}})()}
      <div style="display:flex;justify-content:space-between;align-items:center;margin:9px 0 3px;">
        <span style="font-size:10px;color:#5a8aaa;font-weight:700;">🌐 전체 기기 (누가·웹/앱)</span>
        <span style="display:flex;gap:5px;">
          <button onclick="_loadAllErrLogs()" style="background:rgba(79,168,208,.12);color:#4fa8d0;border:1px solid rgba(79,168,208,.28);border-radius:14px;padding:3px 10px;font-size:10px;font-weight:700;cursor:pointer;">불러오기 ↻</button>
          <button onclick="_clearAllErrLogs()" style="background:rgba(192,57,43,.1);color:#e0857a;border:1px solid rgba(192,57,43,.28);border-radius:14px;padding:3px 10px;font-size:10px;font-weight:700;cursor:pointer;">전체 비우기</button>
        </span>
      </div>
      <div id="allErrLogs" style="max-height:220px;overflow-y:auto;"><div style="font-size:11px;color:rgba(255,255,255,.25);">‘불러오기’를 누르면 모든 기기의 오류를 모아 봅니다(관리자 전용)</div></div>
    </div>
    <div class="scard" style="margin-bottom:8px;">
      <div class="stitle">🔔 알림 받는 대상 안내</div>
      <div style="font-size:11px;color:#7a9cb8;margin-bottom:10px;">기본적으로 <b style="color:#5dbf8a;">모든 직원</b>이 받습니다. 아래 일부만 <b style="color:#7dd3fa;">관리자 전용</b>입니다. (각자 [내 설정 → 알림]에서 자기 알림을 끄고 켤 수 있어요)</div>
      <div style="background:rgba(39,174,96,.06);border:1px solid rgba(39,174,96,.25);border-radius:9px;padding:10px 11px;margin-bottom:8px;">
        <div style="font-size:12px;font-weight:800;color:#5dbf8a;margin-bottom:5px;">👥 모두에게</div>
        <div style="font-size:11px;color:#b8d4e8;line-height:1.85;">안전사고·낙석·위험수목·화재 등 현장 위험상황 · 응소 요청 · 진행중 경과/상황 종료 · 위험 시설물 · 기상특보·재난위기경보·탐방로 통제·기상 브리핑</div>
      </div>
      <div style="background:rgba(79,168,208,.06);border:1px solid rgba(79,168,208,.25);border-radius:9px;padding:10px 11px;">
        <div style="font-size:12px;font-weight:800;color:#7dd3fa;margin-bottom:5px;">🔑 관리자에게만</div>
        <div style="font-size:11px;color:#b8d4e8;line-height:1.85;">새 직원 가입 승인 요청 · 관리자 권한 요청 · 정보 정정 요청</div>
      </div>
    </div>
    <div class="scard" style="margin-bottom:8px;">
      <div class="stitle">📲 푸시 알림 (꺼진 폰까지)</div>
      <div style="font-size:11px;color:#7a9cb8;margin-bottom:8px;">구조 1보·위험상황 발생 시 자동 발송됩니다. 아래에서 <b style="color:#5dbf8a;">받는 대상을 골라</b> 직접 작성해 푸시할 수 있습니다.</div>
      <div class="fg"><span class="fl">받는 대상 <span style="color:#5a7e98;font-weight:400;">(소속 선택 · 복수 가능, 비우면 전체)</span></span>
        ${(()=>{
          const depts=new Set();
          [].concat(DB.g('loginLog')||[],DB.g('pendingUsers')||[]).forEach(e=>{if(e&&e.dept)depts.add(e.dept);});
          const lbl='display:inline-flex;align-items:center;gap:5px;background:#0b1c30;border:1px solid rgba(79,168,208,.25);border-radius:18px;padding:7px 12px;font-size:12px;color:#cfe2f2;cursor:pointer;';
          const chips=[...depts].sort().map(d=>`<label style="${lbl}"><input type="checkbox" class="pushDept" value="${_esc(d)}" onchange="_pushDeptChanged()" style="width:15px;height:15px;">${_esc(d)}</label>`).join('');
          return `<div id="pushTargetChips" style="display:flex;flex-wrap:wrap;gap:7px;">
            <label style="${lbl}background:rgba(79,168,208,.12);"><input type="checkbox" id="pushAll" checked onchange="_pushToggleAll(this)" style="width:15px;height:15px;">📢 전체</label>
            ${chips}
          </div>`;
        })()}
      </div>
      <div class="fg"><span class="fl">제목</span>
        <input id="pushTitleInp" class="fi" type="text" value="설악산 현장관리" maxlength="40" style="font-size:13px;">
      </div>
      <div class="fg"><span class="fl">내용</span>
        <textarea id="pushBodyInp" class="fi" rows="2" placeholder="보낼 메시지를 입력하세요" maxlength="200" style="font-size:13px;resize:vertical;"></textarea>
      </div>
      <div style="display:flex;gap:6px;margin-top:4px;">
        <button onclick="sendCustomPush()" style="flex:2;background:#1a4a6e;color:#fff;border:none;padding:10px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">📨 발송</button>
        <button onclick="renderAdmSys()" style="background:rgba(255,255,255,.05);color:#7a9cb8;border:1px solid rgba(255,255,255,.1);padding:10px 12px;border-radius:8px;font-size:12px;cursor:pointer;">↻ 새로고침</button>
      </div>
      ${(()=>{const log=DB.g('pushLog')||[];if(!log.length)return '';
        return `<div style="margin-top:11px;"><div style="font-size:10px;color:#5a8aaa;font-weight:700;margin-bottom:4px;">🕘 보낸 내역</div>`
          +log.slice(0,8).map(p=>`<div style="font-size:10px;color:#9bbdd4;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.04);"><span style="color:#7dd3fa;font-weight:700;">${_esc(p.target||'전체')}</span> · ${_esc(p.body||'')}<br><span style="color:#5a7e98;font-size:9px;">${p.by?_esc(p.by)+' · ':''}${p.at?new Date(p.at).toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):''}${p.sent!=null?' · '+p.sent+'대 발송':''}</span></div>`).join('')
          +`</div>`;
      })()}
      <div id="fcmStatus" style="font-size:10px;color:#3a6a8a;margin-top:8px;line-height:1.7;">등록된 기기 확인 중…</div>
    </div>
    <div class="scard" style="margin-bottom:8px;"><div class="stitle">📊 데이터 현황</div>
      <div style="font-size:12px;color:#b8d4e8;line-height:2.1;">시설물 <b>${(DB.g('facilities')||[]).length}개</b> · 경고표시 <b>${(DB.g('facilities')||[]).filter(f=>_facWarn(f)).length}건</b><br>구조이력 <b>${(DB.g('rescues')||[]).length}건</b> · 위험상황 <b>${(DB.g('hazards')||[]).length}건</b><br>특보운영 <b>${(DB.g('alertOps')||[]).length}건</b> · 대원 <b>${(DB.g('members')||[]).length}명</b></div>
      <div style="margin-top:8px;display:flex;align-items:center;gap:6px;font-size:11px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${_fdb?'#27ae60':'#e05050'};display:inline-block;flex-shrink:0;"></span>
        <span style="color:${_fdb?'#5dbf8a':'#e05050'};font-weight:700;">Firebase ${_fdb?'연결됨':'미연결'}</span>
        ${_fdb?'<span style="color:#4a7090;">· 모든 데이터 실시간 동기화 중</span>':'<span style="color:#7a3020;">· 오프라인 상태입니다</span>'}
      </div>
    </div>
    <div class="scard" style="margin-bottom:8px;">
      <div class="stitle">📁 데이터 백업 / 복원</div>
      <div style="font-size:11px;color:#7a9cb8;margin-bottom:10px;">시설물·구조이력·위키 전체를 JSON 파일로 내보내거나 복원합니다</div>
      <div style="display:flex;flex-direction:column;gap:7px;">
        <button onclick="exportAllData()" style="width:100%;background:rgba(39,174,96,.12);color:#5dbf8a;border:1px solid rgba(39,174,96,.3);padding:10px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">📤 JSON 내보내기 (백업)</button>
        <label style="width:100%;background:rgba(79,168,208,.1);color:#4fa8d0;border:1px solid rgba(79,168,208,.28);padding:10px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;text-align:center;display:block;">
          📥 JSON 가져오기 (복원)
          <input type="file" accept=".json" style="display:none;" onchange="importAllData(this)">
        </label>
        <button onclick="forceSyncFirestore()" style="width:100%;background:rgba(255,165,0,.1);color:#f0a020;border:1px solid rgba(255,165,0,.28);padding:10px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">🔄 Firebase 강제 동기화</button>
      </div>
    </div>
    <div class="scard"><div class="stitle" style="color:#c0392b;">⚠️ 위험 작업</div>
      <div style="display:flex;flex-direction:column;gap:7px;">
        ${_isMasterAdmin()
          ?`<button onclick="resetAll()" style="width:100%;background:rgba(192,57,43,.1);color:#c0392b;border:1px solid rgba(192,57,43,.28);padding:10px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">전체 데이터 초기화 (개발자)</button>`
            +(()=>{const b=_resetBackupInfo();return b?`<button onclick="restoreReset()" style="width:100%;background:rgba(39,174,96,.12);color:#5dbf8a;border:1px solid rgba(39,174,96,.35);padding:10px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">↩ 초기화 복구 (${b})</button>`:'';})()
          :`<div style="font-size:11px;color:#9c8060;padding:9px 10px;border:1px dashed rgba(192,57,43,.25);border-radius:8px;line-height:1.6;">🔒 전체 데이터 초기화는 <b style="color:#cfe2f2;">개발자</b>만 할 수 있습니다.</div>`}
        <button onclick="clearNotisOnly()" style="width:100%;background:rgba(255,255,255,.05);color:#b8d4e8;border:none;padding:10px;border-radius:8px;font-size:12px;cursor:pointer;">알림 이력만 삭제</button>
      </div>
    </div>`;
  setTimeout(_refreshFcmStatus,100);
}
// 관리자: 대상별 기본 알림 정책 설정(공유)
function setNotiPolicy(grp,lv){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const p=DB.g('notiPolicy')||{};p[grp]=lv;DB.s('notiPolicy',p);
  try{_updateFcmTokenSettings();}catch(e){}
  try{renderAdmSys();}catch(e){}
  toast('📢 '+grp+' 기본 알림 = '+({all:'전체',recommended:'추천',min:'최소'}[lv]||lv));
}
// 푸시 받는 대상(소속 체크박스) 토글
function _pushToggleAll(el){if(el&&el.checked){document.querySelectorAll('.pushDept').forEach(c=>{c.checked=false;});}else if(el&&![...document.querySelectorAll('.pushDept')].some(c=>c.checked)){el.checked=true;}}
function _pushDeptChanged(){const any=[...document.querySelectorAll('.pushDept')].some(c=>c.checked);const all=document.getElementById('pushAll');if(all)all.checked=!any;}
// 카카오ID 기준 직원 삭제 — 가입신청(pendingUsers) 없이 로그인 이력만 있는 사람도 삭제 가능
function removeStaff(kakaoId){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  kakaoId=String(kakaoId||'');if(!kakaoId)return;
  if(_isDeveloper(kakaoId)){toast('⚠️ 개발자는 삭제할 수 없습니다');return;}
  const pu=(DB.g('pendingUsers')||[]).find(p=>String(p.kakaoId||p.id)===kakaoId);
  const ll=(DB.g('loginLog')||[]).find(e=>String(e.kakaoId)===kakaoId);
  const nm=(pu&&(pu.realName||pu.name))||(ll&&ll.name)||'이 사용자';
  if(!confirm(nm+'을(를) 탈퇴 처리하시겠습니까?\n· 즉시 로그아웃되고 멤버에서 빠집니다\n· 작성한 데이터는 유지됩니다\n· 다시 로그인하면 신규 승인 대기로 재신청할 수 있습니다(영구 차단 아님)'))return;
  // 탈퇴 대상에게 OS 푸시 통보 — 앱이 꺼져 있어도 수신(안드로이드 APK). 데이터 변경 전에 토큰 조회.
  try{if(typeof _sendFcmPushToKakao==='function')_sendFcmPushToKakao(kakaoId,'설악산 현장관리','⚠️ 관리자에 의해 탈퇴 처리되었습니다.');}catch(e){}
  const del=DB.g('deletedKakaoIds')||[];if(!del.includes(kakaoId)){del.push(kakaoId);DB.s('deletedKakaoIds',del);}
  DB.s('pendingUsers',(DB.g('pendingUsers')||[]).filter(p=>String(p.kakaoId||p.id)!==kakaoId));
  DB.s('loginLog',(DB.g('loginLog')||[]).filter(e=>String(e.kakaoId)!==kakaoId));
  const acl=_getAcl();acl.members=acl.members.filter(x=>x!==kakaoId);acl.admins=acl.admins.filter(x=>x!==kakaoId);DB.s('_acl',acl);
  renderAdmMembers();try{renderAdmSys();}catch(e){}
  toast('✅ 탈퇴 처리 완료');
}
function deleteUser(id){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const list=DB.g('pendingUsers')||[];
  const u=list.find(function(p){return p.id===id;});
  if(!u)return;
  if(u.kakaoId&&_isDeveloper(u.kakaoId)){toast('⚠️ 개발자는 삭제할 수 없습니다');return;}
  if(!confirm((u.realName||u.name||'이 사용자')+'을(를) 삭제하시겠습니까?\n(작성한 데이터는 유지됩니다)'))return;
  if(u.kakaoId){
    const deleted=DB.g('deletedKakaoIds')||[];
    if(!deleted.includes(String(u.kakaoId)))deleted.push(String(u.kakaoId));
    DB.s('deletedKakaoIds',deleted);
  }
  DB.s('pendingUsers',list.filter(function(p){return p.id!==id;}));
  renderAdmSys();
  try{renderAdmMembers();}catch(e){}
  toast('🗑️ 삭제 완료');
}
function approveUser(id){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const list=DB.g('pendingUsers')||[];
  const idx=list.findIndex(function(p){return p.id===id;});
  if(idx===-1)return;
  list[idx].approvalStatus='approved';
  list[idx].seen=true;
  DB.s('pendingUsers',list);
  // 승인 = 실제 멤버십 부여(_acl). 이전엔 상태만 바꿔 앱 접근이 안 열리던 문제 해결.
  const kid=String(list[idx].kakaoId||'');
  if(kid){const acl=_getAcl();if(acl.admins.indexOf(kid)<0&&acl.members.indexOf(kid)<0){acl.members.push(kid);DB.s('_acl',acl);}}
  renderAdmMembers();
  try{renderAdmSys();}catch(e){}
  toast('✅ 승인 완료 — 앱 접근 허용됨');
}
// 승인 = 멤버십 부여(puId 유무와 무관하게 kakaoId 기준). 신규 섹션·자동승인에서 공용 사용.
function grantMember(kakaoId){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  kakaoId=String(kakaoId||'');if(!kakaoId)return;
  const acl=_getAcl();
  if(acl.admins.indexOf(kakaoId)<0&&acl.members.indexOf(kakaoId)<0){acl.members.push(kakaoId);DB.s('_acl',acl);}
  const list=(DB.g('pendingUsers')||[]).map(function(p){
    if(String(p.kakaoId||p.id)===kakaoId)return Object.assign({},p,{approvalStatus:'approved',seen:true});
    return p;
  });
  DB.s('pendingUsers',list);
  renderAdmMembers();try{renderAdmSys();}catch(e){}
  toast('✅ 승인 — 앱 접근 허용됨');
}
function _checkDeletedUser(){
  if(DB.g('authType')!=='kakao')return;
  var u=DB.g('currentUser')||{};
  if(!u.kakaoId)return;
  var deleted=DB.g('deletedKakaoIds')||[];
  if(!deleted.includes(String(u.kakaoId)))return;
  DB.s('authType','');
  DB.s('currentUser',{});
  if(window.showLoginScreen)window.showLoginScreen();
  updateUserUI();
  toast('⚠️ 관리자에 의해 탈퇴 처리되었습니다');
}
// 전체 초기화: 개발자만, 2단계 확인, 24시간 복구 백업 보관
const _RESET_BACKUP_KEYS=['members','catFac','catFacMeta','facilities','rescues','hazards','history','alertOps','pendingUsers','approvedUsers','deletedKakaoIds','loginLog','_acl','extAgencies'];
function _resetBackupInfo(){
  try{const b=JSON.parse(localStorage.getItem('_resetBackup')||'null');if(!b||!b.at)return null;
    const dh=Date.now()-b.at;if(dh>24*3600000)return null;
    const h=Math.floor(dh/3600000),m=Math.floor((dh%3600000)/60000);
    return (h>0?h+'시간 ':'')+m+'분 전 · 24시간 내 복구가능';
  }catch(e){return null;}
}
function resetAll(){
  if(!_isMasterAdmin()){toast('⚠️ 전체 초기화는 개발자만 가능합니다');return;}
  if(!confirm('⚠️ 전체 데이터 초기화\n구조·위험·시설·점검·직원·기록이 모두 삭제됩니다.\n\n정말 하시겠습니까?'))return;
  if(!confirm('마지막 확인입니다.\n정말로 전체 데이터를 초기화할까요?\n(초기화 후 24시간 안에는 복구할 수 있습니다)'))return;
  // 복구용 백업(기기 로컬에 보관 — 복구 시 Firestore로 되돌림)
  try{const snap={};_RESET_BACKUP_KEYS.forEach(k=>{snap[k]=DB.g(k);});localStorage.setItem('_resetBackup',JSON.stringify({at:Date.now(),data:snap}));}catch(e){}
  ['members','catFac','facilities','rescues','hazards','history','alertOps','notis','notiSetting','currentUser','sheetsUrl'].forEach(k=>DB.d(k));
  initDB();toast('✅ 초기화 완료 — 24시간 내 복구 가능',6000);renderAdmSys();updateSummary();
}
function restoreReset(){
  if(!_isMasterAdmin()){toast('⚠️ 개발자만 가능합니다');return;}
  let b;try{b=JSON.parse(localStorage.getItem('_resetBackup')||'null');}catch(e){}
  if(!b||!b.data){toast('복구할 백업이 없습니다');return;}
  if(Date.now()-b.at>24*3600000){toast('⚠️ 복구 가능 시간(24시간)이 지났습니다');localStorage.removeItem('_resetBackup');return;}
  if(!confirm('초기화 직전 상태로 되돌릴까요?\n현재 데이터는 백업 시점으로 덮어쓰여집니다.'))return;
  Object.keys(b.data).forEach(k=>{if(b.data[k]!=null)DB.s(k,b.data[k]);});
  localStorage.removeItem('_resetBackup');
  toast('↩ 복구 완료',5000);renderAdmSys();updateSummary();
  try{renderRescueMap();}catch(e){}try{renderResList();}catch(e){}
}
function clearNotisOnly(){DB.s('notis',[]);updateBell();toast('🗑️ 알림 이력 삭제');renderAdmSys();}

// (구버전 exportAllData/importAllData 중복 정의 제거 — 권한 데이터 누락·복원버튼 버그 유발.
//  더 완전한 상단 정의(_BACKUP_KEYS 기반, app 마커·검증·이중확인)로 일원화)

function forceSyncFirestore(){
  if(!_fdb){toast('⚠️ Firebase 미연결 — 인터넷 연결 확인');return;}
  const keys=['facilities','history','catFac','catFacMeta'];
  let cnt=0;
  keys.forEach(k=>{
    const v=_fs[k];
    if(v===undefined||v===null)return;
    if(_SHARED_COLL.includes(k)){
      v.forEach(r=>{if(r&&r.id!=null)_txMergeSet(k,String(r.id),r).catch(()=>{});}); // 건별 콜렉션은 _txMergeDoc(단일문서) 대상이 아님 — per-record 병합으로 분리
    }else{
      _txMergeDoc(k,_fsDocBase[k],v).catch(()=>{});
    }
    cnt++;
  });
  toast('🔄 Firebase에 '+cnt+'개 항목 동기화 중...');
  setTimeout(()=>toast('✅ 동기화 완료'),1500);
}

// 잘못 사찰로 분류된 암지형 다목적표지판 복구
// "암"으로 끝나는 이름이 다목적위치표지판인데 사찰로 잘못 변경된 것을 되돌림
// 다목적위치표지판 권위 좌표 (2024~2025 지형지물 엑셀 기준, 12-08 lat=lng 오류 보정)
const _SIGN_COORD_FIX={"01-01":[38.173718,128.480326],"01-02":[38.173346,128.47574],"01-03":[38.170381,128.473421],"01-04":[38.166325,128.471024],"01-05":[38.162865,128.466413],"01-06":[38.159572,128.469408],"01-07":[38.155681,128.470476],"01-08":[38.152346,128.469876],"01-09":[38.150047,128.472944],"01-10":[38.146238,128.473648],"01-11":[38.143603,128.474455],"01-12":[38.139774,128.47469],"01-13":[38.136418,128.473544],"01-14":[38.13374,128.469714],"01-15":[38.135076,128.46466],"01-16":[38.132853,128.464842],"01-17":[38.13034,128.461456],"01-18":[38.12721,128.458564],"01-19":[38.12373,128.457235],"01-20":[38.120766,128.462003],"02-01":[38.164229,128.463435],"02-02":[38.165649,128.462028],"02-03":[38.16608,128.457469],"02-04":[38.163876,128.452519],"02-05":[38.161342,128.447673],"02-06":[38.161155,128.44155],"02-07":[38.158086,128.437903],"02-08":[38.156006,128.43436],"02-09":[38.153822,128.431494],"02-10":[38.153225,128.430556],"02-11":[38.151083,128.427951],"02-12":[38.152069,128.420109],"02-13":[38.152974,128.416565],"02-14":[38.15252,128.411329],"03-01":[38.154916,128.438841],"03-02":[38.153187,128.441108],"03-03":[38.150306,128.443895],"03-04":[38.14833,128.450044],"03-05":[38.146088,128.453457],"03-06":[38.142938,128.454629],"03-07":[38.140757,128.45799],"03-08":[38.13874,128.461976],"03-09":[38.135323,128.463904],"04-01":[38.177708,128.483462],"04-02":[38.180858,128.479667],"04-03":[38.183441,128.476513],"04-04":[38.187867,128.475315],"04-05":[38.190873,128.473491],"05-01":[38.170065,128.495219],"05-02":[38.168687,128.500664],"05-03":[38.165785,128.501889],"05-04":[38.162964,128.502201],"06-01":[38.087797,128.448537],"06-02":[38.092245,128.450126],"06-03":[38.096467,128.451558],"06-04":[38.098362,128.454893],"06-05":[38.103345,128.456638],"06-06":[38.105879,128.459868],"06-07":[38.108556,128.459998],"06-08":[38.113456,128.460649],"06-09":[38.115969,128.46315],"07-01":[38.077336,128.442598],"07-02":[38.076182,128.439941],"07-03":[38.078343,128.437413],"07-04":[38.080587,128.43512],"07-05":[38.082892,128.432072],"07-06":[38.083242,128.430483],"08-01":[38.081944,128.427122],"08-02":[38.07937,128.42608],"08-03":[38.08044,128.423813],"08-04":[38.080789,128.419306],"08-05":[38.083671,128.417325],"08-06":[38.086039,128.416179],"08-07":[38.087871,128.417377],"08-08":[38.088614,128.421311],"09-01":[38.100203,128.409455],"09-02":[38.10358,128.41206],"09-03":[38.108377,128.410679],"09-04":[38.110374,128.410132],"09-05":[38.112063,128.410236],"09-06":[38.111282,128.416645],"09-07":[38.110274,128.421674],"09-08":[38.109432,128.427041],"09-09":[38.110071,128.43061],"09-10":[38.112214,128.437488],"09-11":[38.115139,128.441708],"09-12":[38.11617,128.448039],"09-13":[38.116624,128.451661],"09-14":[38.119302,128.45463],"10-01":[38.175507,128.372925],"10-02":[38.170978,128.372351],"10-03":[38.168363,128.371283],"10-04":[38.169578,128.375608],"10-05":[38.167891,128.37936],"10-06":[38.164905,128.376207],"10-07":[38.160108,128.374905],"10-08":[38.157452,128.375296],"10-09":[38.15628,128.380897],"10-10":[38.156816,128.386082],"10-11":[38.153276,128.389078],"10-12":[38.152989,128.394159],"10-13":[38.152579,128.399891],"10-14":[38.153527,128.405154],"10-15":[38.150234,128.408359],"10-16":[38.146899,128.411954],"10-17":[38.145418,128.415471],"10-18":[38.143215,128.415628],"10-19":[38.14128,128.415185],"10-20":[38.138748,128.416747],"10-21":[38.136607,128.419145],"10-22":[38.135785,128.423366],"10-23":[38.133644,128.425945],"10-24":[38.132595,128.430374],"10-25":[38.131196,128.433501],"10-26":[38.130203,128.437931],"10-27":[38.128132,128.444052],"10-28":[38.128647,128.44671],"10-29":[38.127557,128.450982],"11-01":[38.121889,128.344708],"11-02":[38.125471,128.343197],"11-03":[38.129012,128.34192],"11-04":[38.131772,128.344916],"11-05":[38.135334,128.346584],"11-06":[38.138627,128.342389],"11-07":[38.139779,128.338168],"11-08":[38.14262,128.338272],"11-09":[38.143772,128.334077],"11-10":[38.147519,128.332045],"11-11":[38.151637,128.332957],"11-12":[38.155404,128.331654],"11-13":[38.157977,128.327798],"11-14":[38.159973,128.323186],"11-15":[38.16166,128.321206],"11-16":[38.164666,128.318731],"11-17":[38.171418,128.314666],"11-18":[38.174361,128.312035],"11-19":[38.17541,128.307736],"11-20":[38.174627,128.305625],"11-21":[38.175862,128.303593],"11-22":[38.179465,128.301717],"12-01":[38.153952,128.375739],"12-02":[38.153951,128.372482],"12-03":[38.15045,128.368105],"12-05":[38.148019,128.359142],"12-06":[38.145115,128.355129],"12-07":[38.142191,128.352446],"12-08":[38.139514,128.349736],"12-09":[38.136837,128.347365],"12-10":[38.135458,128.350726],"12-11":[38.135027,128.356094],"12-12":[38.131322,128.357709],"12-13":[38.128851,128.359585],"12-14":[38.128235,128.364041],"12-15":[38.124532,128.377693],"12-16":[38.123467,128.382941],"12-17":[38.123319,128.387724],"12-18":[38.124021,128.393508],"12-19":[38.122416,128.397052],"12-20":[38.119884,128.398954],"12-21":[38.116487,128.401664],"12-22":[38.114141,128.406223],"13-01":[38.148634,128.43165],"13-02":[38.146721,128.435845],"13-03":[38.145281,128.439232],"13-04":[38.143017,128.444416],"13-05":[38.141041,128.445433],"13-06":[38.137665,128.445745],"13-07":[38.132538,128.446319]};
// 표지판 loc 코드 추출: f.loc 우선, 없으면 이름 앞 'NN-NN' 패턴
function _signLocCode(f){
  if(f.loc&&/^\d{2}-\d{2}$/.test(String(f.loc).trim()))return String(f.loc).trim();
  const m=String(f.name||'').match(/(\d{2}-\d{2})/);
  return m?m[1]:'';
}
// 라이브 시설물 좌표를 권위 좌표로 일괄 덮어쓰기 (지도에 즉시 반영)
function updateSignCoords(){
  if(!isAdminUser()){toast('⚠️ 관리자만 가능');return;}
  const facs=DB.g('facilities');if(!facs||!facs.length){toast('⚠️ 시설물 데이터 없음');return;}
  const changes=[];
  facs.forEach(f=>{
    if(!f.type||!f.type.includes('다목적위치표지판'))return;
    const code=_signLocCode(f);if(!code||!_SIGN_COORD_FIX[code])return;
    const [lat,lng]=_SIGN_COORD_FIX[code];
    if(Math.abs((+f.lat||0)-lat)>0.00001||Math.abs((+f.lng||0)-lng)>0.00001){
      changes.push({code,from:[+f.lat,+f.lng],to:[lat,lng]});
    }
  });
  if(!changes.length){toast('✅ 이미 모든 좌표가 최신입니다');return;}
  const preview=changes.slice(0,8).map(c=>c.code).join(', ')+(changes.length>8?` 외 ${changes.length-8}개`:'');
  if(!confirm(`표지판 ${changes.length}개의 좌표를 최신 데이터로 덮어씁니다.\n\n변경: ${preview}\n\n진행할까요? (모든 기기에 즉시 반영)`))return;
  const f2=facs.map(f=>{
    if(!f.type||!f.type.includes('다목적위치표지판'))return f;
    const code=_signLocCode(f);if(!code||!_SIGN_COORD_FIX[code])return f;
    const [lat,lng]=_SIGN_COORD_FIX[code];
    return Object.assign({},f,{lat,lng});
  });
  DB.s('facilities',f2);
  try{_invalidateSignCache&&_invalidateSignCache();}catch(e){}
  try{if(typeof renderFacList==='function')renderFacList();}catch(e){}
  toast('✅ '+changes.length+'개 표지판 좌표 최신화 완료');
}
// 부팅 시 1회 자동: 라이브 표지판 좌표를 권위 좌표(엑셀)로 최신화.
// 시설물이 Firestore에서 로드된 뒤 실행. 기기당 1회(버전 플래그), 변경분만 기록.
function _autoApplyCoordFix(){
  if(localStorage.getItem('_coordFixVer')==='2')return;
  let tries=0;
  (function poll(){
    const facs=DB.g('facilities')||[];
    const signs=facs.filter(f=>f.type&&f.type.includes('다목적위치표지판'));
    if(signs.length<10){ if(tries++<20){setTimeout(poll,1500);} return; } // 아직 로드 안 됨
    let changed=0;
    const f2=facs.map(f=>{
      if(!f.type||!f.type.includes('다목적위치표지판'))return f;
      const code=_signLocCode(f);if(!code||!_SIGN_COORD_FIX[code])return f;
      const [lat,lng]=_SIGN_COORD_FIX[code];
      if(Math.abs((+f.lat||0)-lat)>0.00001||Math.abs((+f.lng||0)-lng)>0.00001){changed++;return Object.assign({},f,{lat,lng});}
      return f;
    });
    if(changed>0){
      DB.s('facilities',f2);
      try{_invalidateSignCache&&_invalidateSignCache();}catch(e){}
      setTimeout(function(){try{toast('🪧 표지판 좌표 '+changed+'개 자동 최신화됨');}catch(e){}},900);
    }
    localStorage.setItem('_coordFixVer','2');
  })();
}
function fixMisclassifiedTemples(){
  const facs=DB.g('facilities');if(!facs){toast('⚠️ 시설물 데이터 없음');return;}
  // 실제 사찰/암자 이름 목록 (오색암 등 정확한 사찰만 포함)
  const REAL_TEMPLES=['봉정암','오세암','오색암','백담사','신흥사','계조암','내원암','안양암','극락암'];
  const SIGN_TYPE='🪧 다목적위치표지판';
  const TEMPLE_TYPE='🛕 사찰';
  let fixed=0;
  const f2=facs.map(f=>{
    if(f.type===TEMPLE_TYPE&&f.name){
      const isRealTemple=REAL_TEMPLES.some(t=>f.name.includes(t));
      if(!isRealTemple){
        fixed++;
        return Object.assign({},f,{type:SIGN_TYPE});
      }
    }
    return f;
  });
  if(fixed===0){toast('수정이 필요한 항목 없음');return;}
  DB.s('facilities',f2);
  toast('✅ '+fixed+'개 항목을 다목적위치표지판으로 복구');
}

