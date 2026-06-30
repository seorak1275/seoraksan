'use strict';
// ══════════════════════════════════════════
// 구조 보고서 (1보 ~ n보 타임라인)
// ══════════════════════════════════════════
function updateRescueCross(){
  const el=document.getElementById('rescueCross');if(!el)return;
  const bnavEl=document.getElementById('bnav');
  const bnavH=(bnavEl&&bnavEl.style.display!=='none')?bnavEl.offsetHeight:0;
  el.style.top='calc(50% - '+Math.round(bnavH/2)+'px)';
}
function updateInspectCross(){
  const el=document.getElementById('inspectCross');if(!el)return;
  const bnavEl=document.getElementById('bnav');
  const bnavH=(bnavEl&&bnavEl.style.display!=='none')?bnavEl.offsetHeight:0;
  el.style.top='calc(50% - '+Math.round(bnavH/2)+'px)';
}
function openNewRescue(){
  curResId=null;
  // 마지막으로 저장된 십자선 중앙 좌표 우선 사용
  let gpsPre=window._lastCrosshairCoord||null;
  if(!gpsPre&&mapR){
    try{
      const mapEl=document.getElementById('mapRescue');
      const proj=mapR.getProjection();
      const coord=proj.coordsFromContainerPoint(new kakao.maps.Point(mapEl.offsetWidth/2,mapEl.offsetHeight/2));
      gpsPre={lat:coord.getLat(),lng:coord.getLng()};
    }catch(e){
      const c=mapR.getCenter();gpsPre={lat:c.getLat(),lng:c.getLng()};
    }
  }
  document.getElementById('topTitle').textContent='신규 구조 접수 (최초접수)';
  document.getElementById('bnav').style.display='none';
  showV('v-report');renderPhaseBar(0,1);render1BoForm(gpsPre);
  if(gpsPre&&gpsPre.lat)_autoFillLoc(gpsPre.lat,gpsPre.lng);
  setTimeout(_maybeOfferDraftRestore,300); // 임시저장 복구 제안
}
function addPhase(){
  const res=DB.g('rescues')||[];const r=res.find(x=>x.id===selResId);if(!r)return;
  curResId=selResId;
  const phaseNum=(r.reports||[]).length+1;
  document.getElementById('topTitle').textContent=r.title+' (추가 보고)';
  document.getElementById('bnav').style.display='none';
  showV('v-report');closeDB();
  renderPhaseBar(phaseNum,phaseNum+1);
  // 이전 보 데이터: 이전 보고가 있으면 그것, 없으면 1보(r)
  const prevReport=r.reports&&r.reports.length>0?r.reports[r.reports.length-1]:null;
  // prefill: 1보 기본 정보 + 이전 보 변경사항 합쳐서
  const prefill={
    ...r,
    ...(prevReport||{}),
    _phaseNum: phaseNum+1,
    title: r.title,
    date: now().replace(' ','T'),
    timetable: r.timetable||[],
  };
  render1BoForm(prefill);
}



function submitNBoFromForm(){
  const res=DB.g('rescues')||[];const idx=res.findIndex(x=>x.id===curResId);if(idx===-1)return;
  if(!res[idx].reports)res[idx].reports=[];
  const members=[...document.querySelectorAll('#memChkGrid .chk-grid .chk-box.on')].map(b=>{
    const txt=b.closest('.chk-item')?.querySelector('.chk-txt');
    return txt?txt.textContent.trim().split(' ')[0]:'';
  }).filter(Boolean);
  const extraMembers=[..._extraDispatch];
  const phaseData={
    rid: 'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,6), // 보고 고유 id(동시편집 병합 키)
    repTime: now(),
    type: document.getElementById('r_type')?.value||res[idx].type,
    date: document.getElementById('r_accdt')?.value?.replace('T',' ')||now(),
    weather: getSelPills('weatherPills')[0]||res[idx].weather||'',
    weatherAlert: getWeatherAlertStr(),
    location: document.getElementById('r_loc')?.value||res[idx].location,
    loctype: document.getElementById('r_loctype')?.value||res[idx].loctype,
    vName: document.getElementById('r_vName')?.value||res[idx].vName,
    vTel: document.getElementById('r_vTel')?.value||res[idx].vTel||'',
    vNation: document.getElementById('r_vNat')?.value||res[idx].vNation,
    vNationality: document.getElementById('r_vNationality')?.value||res[idx].vNationality||'',
    companions: getCompanions().length?getCompanions():res[idx].companions||[],
    victims2: getVictims2().length?getVictims2():res[idx].victims2||[],
    vGender: document.getElementById('r_vGender')?.value||res[idx].vGender,
    vBirth: document.getElementById('r_vBirth')?.value||res[idx].vBirth||'',
    vAddr: document.getElementById('r_vAddr')?.value||res[idx].vAddr||'',
    vDisease: document.getElementById('r_vDis')?.value||res[idx].vDisease||'',
    vAllergy: document.getElementById('r_vAll')?.value||res[idx].vAllergy||'',
    vMeds: document.getElementById('r_vMed')?.value||res[idx].vMeds||'',
    severity: getSelPills('sevPills')[0]||res[idx].severity,
    vitals: _collectVitals(),
    injuryParts: getSelPills('injParts'),
    injuryTypes: getSelPills('injTypes'),
    cause: document.getElementById('r_cause')?.value||res[idx].cause,
    situation: document.getElementById('r_sit')?.value||'',
    alcohol: document.getElementById('r_alc')?.value||'없음',
    alcAmount: document.getElementById('r_alcAmount')?.value||'',
    injuries: _injuries,
    rescueMethod: getSelPills('rescMeth'),
    members,
    extraTeams: getExtraTeams(),
    agencies: getAgencies(),
    r119: document.getElementById('r_119')?.value||res[idx].r119||'',
    equipment: document.getElementById('r_equip')?.value||res[idx].equipment||'',
    hospital: document.getElementById('r_hosp')?.value||res[idx].hospital,
    dispatch: document.getElementById('r_disp')?.value||'',
    arrival: document.getElementById('r_arr')?.value||'',
    completion: document.getElementById('r_comp')?.value||'',
    distance: document.getElementById('r_dist')?.value||'',
    author: document.getElementById('r_author')?.value||getAuthor(),
    extra: document.getElementById('r_extra')?.value||'',
    timetable: _ttInlineEntries||[],
    extraMembers: extraMembers||[],
    victimChange: '변화없음',
    update: '',
  };
  // 전보와 차이 자동 요약 + 정형 항목 변경 이력 기록(최신값은 화면에 뜨고, 바뀐 내역은 '변경 이력'으로)
  const prev=res[idx].reports.length>0?res[idx].reports[res[idx].reports.length-1]:res[idx];
  const _BLANK2=['','-','미정','해당없음','알수없음','없음','미상','모르겠음'];
  const _cv=v=>Array.isArray(v)?v.filter(Boolean).join(', '):(v==null?'':String(v).trim());
  const changes=[];
  [['사고유형','type'],['중증도','severity'],['위치','location'],['장소구분','loctype'],['사고자','vName'],['전화','vTel'],['성별','vGender'],['부상부위','injuryParts'],['부상유형','injuryTypes'],['원인','cause'],['구조방법','rescueMethod'],['음주','alcohol'],['병원후송','hospital']].forEach(([label,key])=>{
    const a=_cv(prev[key]),b=_cv(phaseData[key]);
    if(!b||_BLANK2.includes(b))return;          // 새 값이 비면 '이어받기'라 변경 아님
    if(a===b)return;                             // 동일 → 변경 아님
    changes.push({label,from:_BLANK2.includes(a)?'(없음)':a,to:b});
  });
  phaseData.changes=changes;
  const diffs=changes.map(c=>`${c.label} ${c.from}→${c.to}`);
  if(phaseData.situation&&phaseData.situation!==prev.situation)diffs.push('경위 갱신');
  if(_ttInlineEntries.length)diffs.push(`타임라인 ${_ttInlineEntries.length}건 추가`);
  phaseData.update=diffs.join(' · ')||'상태 유지';
  // 타임라인 저장
  if(_ttInlineEntries.length){
    if(!res[idx].timetable)res[idx].timetable=[];
    res[idx].timetable=[...res[idx].timetable,..._ttInlineEntries];
  }
  // 추가 사고자: N보에서 입력했으면 메인 레코드에 반영(표시 일관성)
  if(phaseData.victims2&&phaseData.victims2.length)res[idx].victims2=phaseData.victims2;
  res[idx].reports.push(phaseData);
  DB.s('rescues',res);
  _ttInlineEntries=[];
  const phaseNum=res[idx].reports.length;
  pushNoti(`📋 추가 보고: ${res[idx].title}`,'📋','rescue_update',{app:'rescue',tab:2,id:res[idx].id});
  toast('✅ 추가 보고 저장 완료');
  renderPhaseBar(phaseNum-1,phaseNum);
  renderTimeline(res[idx],'brief');
}
function viewFullPrev(){
  const res=DB.g('rescues')||[];const r=res.find(x=>x.id===curResId);if(!r)return;
  const phNum=(r.reports||[]).length;
  const prev=phNum>0?r.reports[phNum-1]:null;
  document.getElementById('prevRepTitle').textContent=phNum>0?`${phNum}보 전체 내용`:'1보 전체 내용';
  if(prev){
    document.getElementById('prevRepContent').innerHTML=`<div style="font-size:12px;color:#7a9cb8;line-height:2;">
      <b>보고 시간:</b> ${_esc(prev.repTime)}<br><b>상황 내용:</b> ${_esc(prev.update||'-')}<br>
      <b>부상자 상태:</b> ${_esc(prev.victimChange||'-')}<br><b>추가 대원:</b> ${_esc(prev.addMem||'-')}<br><b>작성자:</b> ${_esc(prev.author||'-')}
    </div>`;
  } else {
    document.getElementById('prevRepContent').innerHTML=`<div style="font-size:12px;color:#7a9cb8;line-height:2;">
      <b>유형:</b> ${_esc(r.type)}<br><b>발생:</b> ${r.date}<br><b>위치:</b> ${_esc(r.location||'-')}<br>
      <b>사고자:</b> ${_esc(r.vName||'미상')} / ${(r.vGender&&r.vGender!=='알수없음')?_esc(r.vGender):'-'}<br><b>중증도:</b> ${_esc(r.severity||'-')}<br>
      <b>부상부위:</b> ${_esc((r.injuryParts||[]).join(', ')||'-')}<br><b>구조방법:</b> ${_esc((r.rescueMethod||[]).join(', ')||'-')}
    </div>`;
  }
  document.getElementById('modalPrevReport').classList.add('on');
}
function viewAllTimeline(){closeM('modalAddPhase');viewReport();}
function viewReport(){
  const res=DB.g('rescues')||[];const r=res.find(x=>x.id===selResId);if(!r)return;
  curResId=selResId;
  document.getElementById('topTitle').textContent=r.title+' 보고서';
  document.getElementById('bnav').style.display='none';
  document.getElementById('phaseBar').innerHTML='';
  showV('v-report');closeDB();
  renderTimeline(r,'write');
}
function viewTimeline(){
  const res=DB.g('rescues')||[];const r=res.find(x=>x.id===selResId);if(!r)return;
  curResId=selResId;
  document.getElementById('topTitle').textContent=r.title;
  document.getElementById('bnav').style.display='none';
  document.getElementById('phaseBar').innerHTML='';
  showV('v-report');closeDB();
  renderTimeline(r,'advanced');
}
function renderPhaseBar(active,total){
  document.getElementById('phaseBar').innerHTML=Array.from({length:total},(_,i)=>
    `<div class="ph ${i<active?'done':i===active?'active':''}"><div class="ph-dot"></div>${i+1}보</div>`).join('');
}
// 현재 보고서 ID 기억
let _curViewResId=null;
let _tlViewMode='advanced'; // legacy compat
let _tlMode='advanced'; // 'advanced'|'write'
let _tlWps=[];       // pointer to selected team's wps
let _tlWpIdx=0;
let _tlWpResId=null;
let _tlVehicle=false;
let _tlAnimating=false;
let _tlTeams=[];
let _tlSelTeam=0;
let _tlMiniMapInst=null;
// team builder state
let _tlBuilding=false;
let _tlBuildType=null;     // 'nps'|'agency'
let _tlBuildMembers=[];
let _tlBuildOtherOpen=false;
let _tlBuildAgencyType='소방';

function _hideRepFooter(){const f=document.getElementById('rep1BoFooter');if(f)f.style.display='none';}

function _renderCreateBtnsHtml(){
  return `<div style="display:flex;gap:8px;margin-bottom:10px;">
    <button onclick="startTlBuild('nps')" style="flex:1;padding:11px 6px;border-radius:9px;background:rgba(79,168,208,.1);border:1px solid rgba(79,168,208,.3);color:#4fa8d0;font-size:12px;font-weight:700;cursor:pointer;">+ 공단 팀생성</button>
    <button onclick="startTlBuild('agency')" style="flex:1;padding:11px 6px;border-radius:9px;background:rgba(126,200,163,.08);border:1px solid rgba(126,200,163,.25);color:#7ec8a0;font-size:12px;font-weight:700;cursor:pointer;">+ 유관기관 팀생성</button>
  </div>`;
}

function _renderBuildPanelHtml(){
  const user=DB.g('currentUser')||{};
  const myDept=user.dept||'';
  const all=getTeamMembers();
  const mine=all.filter(s=>!myDept||s.dept===myDept);
  const others=all.filter(s=>myDept&&s.dept&&s.dept!==myDept);
  const byDept={};others.forEach(s=>{if(!byDept[s.dept])byDept[s.dept]=[];byDept[s.dept].push(s);});
  function chip(s){
    const on=_tlBuildMembers.includes(s.name);
    return `<div onclick="toggleTlBuildMember('${s.name.replace(/'/g,"\\'")}',this)" style="cursor:pointer;background:${on?'rgba(126,200,163,.2)':'rgba(255,255,255,.04)'};color:${on?'#7ec8a0':'rgba(255,255,255,.45)'};border:1px solid ${on?'rgba(126,200,163,.4)':'rgba(255,255,255,.12)'};border-radius:20px;font-size:10px;font-weight:700;padding:4px 10px;">${s.name}${s.rank?` <span style="font-size:8px;opacity:.7;">${s.rank}</span>`:''}</div>`;
  }
  if(_tlBuildType==='nps'){
    const _autoName=(myDept||'공단')+' '+(_tlTeams.filter(t=>t.id&&t.id.startsWith('nps_')).length+1)+'팀';
    return `<div style="background:#0b1c30;border-radius:10px;padding:12px;border:.5px solid rgba(79,168,208,.3);margin-bottom:10px;">
      <div style="font-size:11px;color:#4fa8d0;font-weight:700;margin-bottom:10px;">🥾 공단 팀생성</div>
      <input id="tlBuildNameInput" type="text" class="fi" placeholder="${_autoName}" style="width:100%;box-sizing:border-box;margin-bottom:10px;">
      ${myDept?`<div style="font-size:10px;color:#4a7090;font-weight:600;margin-bottom:5px;">📂 ${myDept}</div>`:''}
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;">
        ${mine.length?mine.map(chip).join(''):'<span style="font-size:10px;color:rgba(255,255,255,.25);">직원 정보 없음</span>'}
      </div>
      ${others.length?`<button id="tlOtherDeptsBtn" onclick="toggleTlOtherDepts()" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.5);border-radius:7px;padding:4px 10px;font-size:10px;font-weight:600;cursor:pointer;margin-bottom:6px;">추가인원 ▼</button>
        <div id="tlOtherDeptsWrap" style="display:none;">
          ${Object.entries(byDept).map(([dept,members])=>`<div style="margin-bottom:8px;"><div style="font-size:10px;color:#4a7090;font-weight:600;margin-bottom:4px;">📂 ${dept}</div><div style="display:flex;flex-wrap:wrap;gap:5px;">${members.map(chip).join('')}</div></div>`).join('')}
        </div>`:''}
      <div style="display:flex;gap:7px;margin-top:10px;">
        <button onclick="cancelTlBuild()" style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:transparent;color:rgba(255,255,255,.45);font-size:12px;font-weight:600;cursor:pointer;">취소</button>
        <button onclick="confirmTlBuild()" style="flex:2;padding:8px;border-radius:8px;background:rgba(79,168,208,.18);border:1px solid rgba(79,168,208,.4);color:#4fa8d0;font-size:12px;font-weight:700;cursor:pointer;">확인</button>
      </div>
    </div>`;
  } else {
    // 유관기관 팀생성 — 특수구조대 제거, 환동해(소방) 분리, 산림청=헬기, 인원 입력
    // 기관별 기본 인원: 소방구급 2, 환동해 5, 나머지 지정 없음
    const hw=getHwandonghaTeam();
    const agTypes=[
      {k:'소방',l:'🚒 소방',sub:'속초소방서',mem:0},
      {k:'소방(구급)',l:'🚑 소방구급',sub:'구급대 기본 2명',mem:2},
      {k:'소방(환동해)',l:'🔴 환동해',sub:`환동해특수대응단 기본 5명 (오늘 ${hw}팀)`,mem:5,hwTeam:hw},
      {k:'경찰',l:'👮 경찰',sub:'속초경찰서·양양경찰서',mem:0},
      {k:'산림청(헬기)',l:'🚁 산림청헬기',sub:'산림청 헬기 출동(드문 경우)',mem:0},
      {k:'기타',l:'➕ 기타',sub:'타 기관',mem:0},
    ];
    const sel=agTypes.find(a=>a.k===_tlBuildAgencyType)||agTypes[0];
    function agChip(ag){
      const on=_tlBuildAgencyType===ag.k;
      return `<div onclick="_selAgType('${ag.k.replace(/'/g,"\\'")}',${ag.mem||0})" class="tl-ag-chip"
        style="cursor:pointer;background:${on?'rgba(126,200,163,.2)':'rgba(255,255,255,.04)'};
        color:${on?'#7ec8a0':'rgba(255,255,255,.45)'};
        border:1px solid ${on?'rgba(126,200,163,.4)':'rgba(255,255,255,.12)'};
        border-radius:10px;font-size:11px;font-weight:700;padding:5px 9px;line-height:1.3;text-align:center;">
        ${ag.l}${ag.hwTeam?`<br><span style="font-size:9px;opacity:.75;">현재 ${ag.hwTeam}팀</span>`:''}
      </div>`;
    }
    return `<div style="background:#0b1c30;border-radius:10px;padding:12px;border:.5px solid rgba(126,200,163,.3);margin-bottom:10px;">
      <div style="font-size:11px;color:#7ec8a0;font-weight:700;margin-bottom:10px;">🚒 유관기관 팀생성</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:10px;">
        ${agTypes.map(agChip).join('')}
      </div>
      ${sel.sub?`<div style="font-size:10px;color:#5a8aa0;margin-bottom:8px;">${_esc(sel.sub)}</div>`:''}
      <div style="display:flex;gap:7px;margin-bottom:10px;">
        <div style="flex:2;"><input id="tlBuildNameInput" type="text" class="fi" value="${_esc(sel.l.replace(/[🚒🚑🔴👮🚁➕]/g,'').trim())}" placeholder="팀 이름" style="width:100%;box-sizing:border-box;"></div>
        <div style="flex:1;"><input id="tlBuildMemCount" type="number" inputmode="numeric" class="fi" value="${sel.mem||''}" placeholder="인원 수" min="0" max="99" style="width:100%;box-sizing:border-box;"></div>
      </div>
      <div style="display:flex;gap:7px;">
        <button onclick="cancelTlBuild()" style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:transparent;color:rgba(255,255,255,.45);font-size:12px;font-weight:600;cursor:pointer;">취소</button>
        <button onclick="confirmTlBuild()" style="flex:2;padding:8px;border-radius:8px;background:rgba(126,200,163,.15);border:1px solid rgba(126,200,163,.35);color:#7ec8a0;font-size:12px;font-weight:700;cursor:pointer;">확인</button>
      </div>
    </div>`;
  }
}
function _selAgType(k,defaultMem){
  _tlBuildAgencyType=k;
  const ba=document.getElementById('tlBuildArea');
  if(ba)ba.innerHTML=_renderBuildPanelHtml();
  setTimeout(()=>{const mc=document.getElementById('tlBuildMemCount');if(mc&&defaultMem)mc.value=defaultMem;},0);
}

function startTlBuild(type){
  _tlBuilding=true;_tlBuildType=type;_tlBuildMembers=[];_tlBuildOtherOpen=false;
  _tlBuildAgencyType='소방';
  const ba=document.getElementById('tlBuildArea');
  if(ba)ba.innerHTML=_renderBuildPanelHtml();
}

function cancelTlBuild(){
  _tlBuilding=false;
  const ba=document.getElementById('tlBuildArea');
  if(ba)ba.innerHTML=_renderCreateBtnsHtml();
}

function toggleTlBuildMember(name,el){
  const idx=_tlBuildMembers.indexOf(name);
  if(idx>=0){
    _tlBuildMembers.splice(idx,1);
    el.style.background='rgba(255,255,255,.04)';el.style.color='rgba(255,255,255,.45)';el.style.borderColor='rgba(255,255,255,.12)';
  }else{
    _tlBuildMembers.push(name);
    el.style.background='rgba(126,200,163,.2)';el.style.color='#7ec8a0';el.style.borderColor='rgba(126,200,163,.4)';
  }
}

function toggleTlOtherDepts(){
  _tlBuildOtherOpen=!_tlBuildOtherOpen;
  const wrap=document.getElementById('tlOtherDeptsWrap');
  const btn=document.getElementById('tlOtherDeptsBtn');
  if(wrap)wrap.style.display=_tlBuildOtherOpen?'block':'none';
  if(btn)btn.textContent=(_tlBuildOtherOpen?'추가인원 ▲':'추가인원 ▼');
}

function confirmTlBuild(){
  const r=getRes(_tlWpResId);if(!r){toast('⚠️ 구조 정보 없음');return;}
  const nameEl=document.getElementById('tlBuildNameInput');
  const facs=DB.g('facilities')||[];
  if(_tlBuildType==='nps'){
    if(!_tlBuildMembers.length){toast('⚠️ 팀원을 선택하세요');return;}
    const _user=DB.g('currentUser')||{};
    const _dept=_user.dept||'공단';
    const _npsNum=_tlTeams.filter(t=>t.id&&t.id.startsWith('nps_')).length+1;
    const name=(nameEl&&nameEl.value.trim())||(_dept+' '+_npsNum+'팀');
    const route=_buildRoute(r,facs);
    const wps=route.map(w=>({...w,status:w.isBase?'active':'pending'}));
    _tlTeams.push({id:'nps_'+Date.now(),name,type:'foot',members:_tlBuildMembers.slice(),wpIdx:0,wps,collapsed:false,createdAt:new Date().toISOString()});
  }else{
    const memCount=parseInt(document.getElementById('tlBuildMemCount')?.value||'0')||0;
    // 환동해는 3교대 — 오늘 당직팀 번호를 팀명에 반영해 현장 혼선 방지
    const hw=getHwandonghaTeam();
    const _defNames={'소방(환동해)':`환동해 ${hw}팀`,'소방(구급)':'소방 구급대','소방':'소방','경찰':'경찰','산림청(헬기)':'산림청 헬기','기타':'유관기관'};
    const name=(nameEl&&nameEl.value.trim())||_defNames[_tlBuildAgencyType]||_tlBuildAgencyType;
    // 산림청(헬기)·헬기 포함 시 헬기 경로 / 차량은 소방·경찰·구급·환동해
    const isHeli=_tlBuildAgencyType.includes('헬기')||_tlBuildAgencyType.includes('산림청');
    const isVehicle=!isHeli&&['소방','소방(구급)','소방(환동해)','경찰'].some(k=>_tlBuildAgencyType===k||_tlBuildAgencyType.startsWith(k));
    const type=isHeli?'heli':isVehicle?'vehicle':'foot';
    const route=isHeli
      ?[{code:'',name:'헬기 기지',isBase:true,status:'active'},{code:'',name:r.location||'사고지점',lat:r.lat||null,lng:r.lng||null,isTarget:true,status:'pending'}]
      :_buildRoute(r,facs).map(w=>({...w,status:w.isBase?'active':'pending'}));
    // requestedAt=출동요청 시각(생성시점), arrivedAt=현장도착(별도 기록)
    _tlTeams.push({id:'agency_'+Date.now(),name,type,agType:_tlBuildAgencyType,hwTeam:_tlBuildAgencyType==='소방(환동해)'?hw:null,memberCount:memCount,requestedAt:now(),arrivedAt:null,wpIdx:0,wps:route,collapsed:false,createdAt:new Date().toISOString()});
  }
  const newIdx=_tlTeams.length-1;
  _tlSelTeam=newIdx;_tlWps=_tlTeams[newIdx].wps;_tlWpIdx=0;
  _tlBuilding=false;
  _persistTeams(); // save to Firestore so rescue map can show team positions
  _rerenderTlFull();
  // init minimap if first team with coords
  const wpsForMap=_tlTeams[newIdx].wps;
  if(wpsForMap.some(w=>w.lat&&w.lng)){
    const mm=document.getElementById('tlMiniMap');
    if(!mm){
      const mapWrap=document.getElementById('tlMiniMapWrap');
      if(mapWrap)mapWrap.style.display='block';
    }
    setTimeout(()=>_initTlMiniMap(wpsForMap),150);
  }
}





function _initTlMiniMap(wps,curPos){
  const el=document.getElementById('tlMiniMap');
  if(!el||!window._KR)return;
  if(!curPos){try{curPos=(_tlTeams[_tlSelTeam]||{}).curPos||null;}catch(e){}}
  const pts=wps.filter(w=>w.lat&&w.lng);
  if(!pts.length){el.innerHTML='<div style="text-align:center;font-size:10px;color:rgba(255,255,255,.25);padding:12px;">위치 좌표 없음</div>';return;}
  // 진행률 계산 — 현재 통과 표지판 인덱스 기준
  const team=_tlTeams[_tlSelTeam]||{};
  const wpIdx=team.wpIdx||0;
  const total=wps.length-1; // 거점 제외 목표까지
  const pct=total>0?Math.min(100,Math.round(wpIdx/total*100)):0;
  const remaining=total-wpIdx; // 앞으로 통과할 표지판 수
  // 진행률 헤더 갱신
  const progEl=document.getElementById('tlMiniMapProg');
  if(progEl)progEl.innerHTML=`<span style="color:#4fa8d0;font-weight:900;">${pct}%</span> 진행 · 앞으로 표지판 <b>${remaining}</b>개`;
  try{
    const center=pts[Math.floor(pts.length/2)];
    const map=new kakao.maps.Map(el,{center:new kakao.maps.LatLng(center.lat,center.lng),level:6});
    map.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
    _tlMiniMapInst=map;
    const bounds=new kakao.maps.LatLngBounds();
    // 경로선만 표시 (핀 최소화)
    if(pts.length>1){
      const full=pts.map(w=>new kakao.maps.LatLng(w.lat,w.lng));
      const vehIdx=pts.findIndex(w=>w.byVehicle);
      new kakao.maps.Polyline({path:full,strokeWeight:5,strokeColor:'#ffffff',strokeOpacity:.18,strokeStyle:'solid',map}).setMap(map);
      if(vehIdx>0){
        if(full.slice(vehIdx).length>1)new kakao.maps.Polyline({path:full.slice(vehIdx),strokeWeight:3,strokeColor:'#4fa8d0',strokeOpacity:.9,strokeStyle:'solid',map}).setMap(map);
        new kakao.maps.Polyline({path:[full[vehIdx-1],full[vehIdx]],strokeWeight:3.5,strokeColor:'#e74c3c',strokeOpacity:.85,strokeStyle:'dash',map}).setMap(map);
      }else{
        new kakao.maps.Polyline({path:full,strokeWeight:3,strokeColor:'#4fa8d0',strokeOpacity:.9,strokeStyle:'solid',map}).setMap(map);
      }
    }
    // ① 거점(출발) 핀
    const base=pts.find(w=>w.isBase);
    if(base){const ll=new kakao.maps.LatLng(base.lat,base.lng);bounds.extend(ll);const d=document.createElement('div');d.innerHTML=`<div style="background:#27ae60;color:#fff;border-radius:10px;padding:2px 8px;font-size:9px;font-weight:800;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.5);">🏠 ${_esc(base.name||'거점')}</div>`;new kakao.maps.CustomOverlay({position:ll,content:d,yAnchor:1.5}).setMap(map);}
    // ② 현재 통과 중인 표지판 핀 (필수)
    const curWp=wps[wpIdx];
    if(curWp&&curWp.lat&&curWp.lng&&!curWp.isBase){
      const ll=new kakao.maps.LatLng(curWp.lat,curWp.lng);bounds.extend(ll);
      const d=document.createElement('div');
      d.innerHTML=`<div style="background:#f39c12;color:#fff;border-radius:10px;padding:3px 9px;font-size:10px;font-weight:900;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.5);border:2px solid #fff;">📍 ${_esc(curWp.code||curWp.name)} ▶</div>`;
      new kakao.maps.CustomOverlay({position:ll,content:d,yAnchor:1.5,zIndex:9}).setMap(map);
    }
    // ③ 환자 위치 핀 (필수)
    const target=wps.find(w=>w.isTarget);
    if(target&&target.lat&&target.lng){
      const ll=new kakao.maps.LatLng(target.lat,target.lng);bounds.extend(ll);
      const d=document.createElement('div');
      d.innerHTML=`<div style="background:#c0392b;color:#fff;border-radius:10px;padding:3px 9px;font-size:10px;font-weight:900;white-space:nowrap;box-shadow:0 2px 8px rgba(192,57,43,.7);border:2px solid #fff;">🚨 ${_esc(target.code||target.name||'환자')}</div>`;
      new kakao.maps.CustomOverlay({position:ll,content:d,yAnchor:1.5,zIndex:10}).setMap(map);
    }
    // 실제 현위치 GPS 마커
    if(curPos&&curPos.lat&&curPos.lng){
      const cll=new kakao.maps.LatLng(curPos.lat,curPos.lng);bounds.extend(cll);
      const cc=document.createElement('div');
      cc.innerHTML=`<div style="width:14px;height:14px;border-radius:50%;background:#2d7dff;border:2.5px solid #fff;box-shadow:0 0 0 5px rgba(45,125,255,.3);"></div>`;
      new kakao.maps.CustomOverlay({position:cll,content:cc,yAnchor:.5,zIndex:11}).setMap(map);
    }
    if(pts.length>1)map.setBounds(bounds,50);
  }catch(e){console.warn('tlMiniMap',e);}
}

// ── Zone-based trail routing ──
function _buildRoute(r,facs){
  if((r.loctype||'')!=='법정탐방로')return[];
  const lm=(r.location||'').match(/(\d+)-(\d+)/);
  if(!lm)return[];
  const zone=parseInt(lm[1]),code=parseInt(lm[2]);
  const wm={};
  (facs||[]).filter(f=>f.type&&f.type.includes('다목적위치표지판')).forEach(f=>{
    const m=(f.name||'').match(/^(\d+)-(\d+)/);
    if(m)wm[`${m[1]}-${m[2]}`]={code:`${m[1]}-${m[2]}`,zone:parseInt(m[1]),num:parseInt(m[2]),name:f.name,lat:f.lat,lng:f.lng};
  });
  function seg(z,from,to){
    const res=[],zs=String(z).padStart(2,'0');
    for(let i=from;i<=Math.min(to,50);i++){const k=`${zs}-${String(i).padStart(2,'0')}`;if(wm[k])res.push(wm[k]);}
    return res;
  }
  // 내림차순 구간: 높은 번호 표지판에서 낮은 번호로 (반대편에서 접근할 때)
  function segDown(z,from,to){
    const res=[],zs=String(z).padStart(2,'0');
    for(let i=from;i>=Math.max(to,1);i--){const k=`${zs}-${String(i).padStart(2,'0')}`;if(wm[k])res.push(wm[k]);}
    return res;
  }
  // 해당 존에 존재하는 가장 큰 표지판 번호 (끝 표지판 = 연결 분기점)
  function maxNum(z){
    let mx=0;Object.values(wm).forEach(w=>{if(w.zone===z&&w.num>mx)mx=w.num;});return mx;
  }
  function upto(z,max){return seg(z,1,max);}
  let base='',route=[];
  if(zone===1||zone===4||zone===5){base='소공원탐방지원센터';route=upto(zone,code);}
  else if(zone===2){
    // 02 존은 02-01(소공원 쪽, 동) ~ 02-14(백담 쪽, 서)로 이어짐.
    if(code<=10){base='소공원탐방지원센터';route=[...upto(1,5),...upto(2,code)];} // 소공원에서 오름차순 접근
    else{base='백담탐방지원센터';route=[...upto(10,15),...segDown(2,maxNum(2),code)];} // 백담에서 끝번호(02-14)→내림차순 접근
  }else if(zone===3){
    base='소공원탐방지원센터';
    if(code<=3)route=[...upto(1,5),...upto(2,7),...upto(3,code)];
    else route=[...upto(1,15),...upto(3,code)];
  }else if(zone===6){base='남설악탐방지원센터';route=upto(6,code);}
  else if(zone===7){
    if(code<=10){base='약수터안내소';route=seg(7,1,code);}
    else{base='용소탐방지원센터';route=seg(7,11,code);}
  }else if(zone===8){
    if(code<=6){base='용소탐방지원센터';route=seg(8,1,code);}
    else{base='흘림골탐방지원센터';route=seg(8,7,code);}
  }else if(zone===9){base='한계령탐방지원센터';route=upto(9,code);}
  else if(zone===10){base='백담탐방지원센터';route=upto(10,code);}
  else if(zone===11){
    if(code<=8){base='한계산성분소';route=seg(11,1,code);}
    else{base='남교리탐방지원센터';route=seg(11,9,code);}
  }else if(zone===12){base='소공원탐방지원센터';route=upto(12,code);}
  else if(zone===13){
    if(code<=4){base='소공원탐방지원센터';route=[...upto(1,5),...upto(2,6),...seg(13,1,code)];}
    else{base='백담탐방지원센터';route=[...upto(10,28),...seg(13,5,code)];}
  }else if(zone===14){base='점봉산탐방지원센터';route=upto(14,code);}
  else return[];
  // If target code not in wm, find nearest waypoint in same zone
  const _tzs=String(zone).padStart(2,'0');
  const _tKey=`${_tzs}-${String(code).padStart(2,'0')}`;
  const _hasTargetSign=!!wm[_tKey];
  if(!_hasTargetSign&&base){
    let _nearest=null;
    for(let _d=1;_d<=15&&!_nearest;_d++){
      for(const _s of [1,-1]){const _n=code+_d*_s;if(_n<1)continue;const _k=`${_tzs}-${String(_n).padStart(2,'0')}`;if(wm[_k]){_nearest={...wm[_k],approx:true};break;}}
    }
    if(_nearest&&!route.some(w=>w.code===_nearest.code))route.push(_nearest);
  }
  // 거점 결정: 사고 GPS가 있으면 가장 가까운 도로 거점(대피소 제외)을 출발점으로,
  // 없으면 동선(zone) 기본 거점 사용.
  let _baseObj=Object.values(SEORAK_BASES).find(b=>b.name===base)||null;
  if(r.lat&&r.lng){
    const _nb=_nearestBase(r.lat,r.lng);
    if(_nb){_baseObj=_nb;base=_nb.name;}
  }
  const res=[{code:'',name:base,isBase:true,lat:_baseObj?_baseObj.lat:null,lng:_baseObj?_baseObj.lng:null,status:'active'}];
  route.forEach((w,i)=>res.push({code:w.code,name:w.name,lat:w.lat,lng:w.lng,approx:w.approx||false,isTarget:i===route.length-1,status:'pending'}));
  // 거점 → 첫 도보 지점 거리가 멀면(차로 들머리 접근) 차량 이동 구간으로 표시 (명시 구간 외 폴백)
  if(res.length>1&&_baseObj&&_baseObj.lat){
    const _ff=res[1];
    if(_ff&&_ff.lat&&_ff.lng){
      const _vd=_haversineKm(_baseObj.lat,_baseObj.lng,_ff.lat,_ff.lng);
      if(_vd>0.6){_ff.byVehicle=true;_ff.vehKm=_vd;}
    }
  }
  // 목표 표지판 좌표가 시설 데이터에 없어도 사고 GPS가 있으면 그 좌표로 목표 지점 보정/추가
  if(r.lat&&r.lng){
    const _last=res[res.length-1];
    const _targetHasCoord=_last&&_last.isTarget&&_last.lat&&_last.lng;
    if(!_targetHasCoord){
      // 정확한 목표 표지판이 없었던 경우 → 실제 사고 좌표를 목표 지점으로 추가
      res.forEach(w=>{w.isTarget=false;});
      res.push({code:_tKey,name:r.location||(`${_tKey} 부근`),lat:r.lat,lng:r.lng,approx:!_hasTargetSign,isTarget:true,status:'pending'});
    }
  }
  // ── 차량 이동 가능 구간 ──
  // 소공원 구간: 01-01~01-04(와선대), 백담 구간: 10-01~10-07(백담탐방지원센터)까지 차량 접근 가능.
  // 이 구간을 넘는 사고는 출동→차량으로 종점까지 이동 후 종점(와선대/백담센터)부터 도보.
  const VEH_SEG={1:4,10:7};
  res.forEach(w=>{
    if(!w.code)return;
    const _m=w.code.match(/^(\d+)-(\d+)/);if(!_m)return;
    const _z=+_m[1],_n=+_m[2];
    if(VEH_SEG[_z]!=null&&_n<=VEH_SEG[_z])w.byVehicle=true;
  });
  // 차량 구간의 마지막 지점 = 도보 전환점(와선대/백담센터). 그 지점에 도보 시작 표시.
  for(let i=0;i<res.length;i++){
    if(res[i].byVehicle&&(i+1>=res.length||!res[i+1].byVehicle)){res[i].vehEnd=true;break;}
  }
  return res;
}

// 저장된 경로가 비어 있는(좌표 2개 미만) 팀을 현재 표지판 기준으로 재계산.
// 표지판이 사라졌던 시점에 만든 팀의 경로를 복구하기 위함. 멀쩡한 팀은 그대로 둠.
function _regenTeamWpsIfEmpty(t,r,facs){
  const coordCnt=(t.wps||[]).filter(w=>w.lat&&w.lng).length;
  if(coordCnt>=2)return t; // 정상 경로 → 보존
  let newWps=null;
  if(t.type==='heli'){
    if(r.lat&&r.lng)newWps=[{code:'',name:'헬기 기지',isBase:true,status:'active'},{code:'',name:r.location||'사고지점',lat:r.lat,lng:r.lng,isTarget:true,status:'pending'}];
  }else{
    const route=_buildRoute(r,facs).map(w=>({...w,status:w.isBase?'active':'pending'}));
    if(route.filter(w=>w.lat&&w.lng).length>=2)newWps=route;
  }
  if(!newWps)return t; // 복구 불가(좌표 없음) → 그대로
  return {...t,wps:newWps,wpIdx:0}; // 깨진 경로였으므로 진행도 초기화
}
function _initTlTeams(r){
  if(_tlWpResId===r.id&&(_tlTeams.length||_tlBuilding))return;
  _tlWpResId=r.id;_tlVehicle=false;_tlAnimating=false;_tlBuilding=false;
  _tlBuildType=null;_tlBuildMembers=[];_tlBuildOtherOpen=false;_tlBuildAgencyType='소방';
  // Load persisted teams from rescue record
  if(r.teams&&r.teams.length){
    const facs=DB.g('facilities')||[];
    let _regen=false;
    _tlTeams=r.teams.map(t=>{
      const t2=_regenTeamWpsIfEmpty({...t,collapsed:true},r,facs);
      if(t2.wps!==t.wps&&t2!==t&&JSON.stringify(t2.wps)!==JSON.stringify(t.wps))_regen=true;
      return t2;
    });
    _tlSelTeam=0;_tlWps=_tlTeams[0].wps;_tlWpIdx=_tlTeams[0].wpIdx||0;
    if(_regen)_persistTeams(); // 복구된 경로를 저장 → 상황판 지도·타 기기에도 반영
  }else{
    _tlTeams=[];_tlSelTeam=0;_tlWps=[];_tlWpIdx=0;
  }
}

function _snapshotTeams(){
  return _tlTeams.map(t=>({id:t.id,name:t.name,type:t.type,wpIdx:t.wpIdx,wps:(t.wps||[]).map(w=>({...w})),members:(t.members||[]).slice(),curPos:t.curPos||null,agType:t.agType||null,hwTeam:t.hwTeam||null,memberCount:t.memberCount||0,requestedAt:t.requestedAt||t.createdAt||null,arrivedAt:t.arrivedAt||null,boardedAt:t.boardedAt||null,transportMethod:t.transportMethod||null,transportLog:t.transportLog||null,createdAt:t.createdAt||null}));
}
function _persistTeams(){
  if(!_tlWpResId)return;
  const _res=DB.g('rescues')||[];const _ri=_res.findIndex(x=>x.id===_tlWpResId);
  if(_ri<0)return;
  _res[_ri].teams=_snapshotTeams();
  DB.s('rescues',_res);
}

function _saveTeamState(){
  if(_tlTeams[_tlSelTeam]){_tlTeams[_tlSelTeam].wpIdx=_tlWpIdx;_tlTeams[_tlSelTeam].wps=_tlWps;}
}


function _teamStageIdx(team){
  if(!team.wps.length||team.wpIdx===0)return 0;            // 출발
  const cur=team.wps[team.wpIdx]||{};
  if(cur.descent)return 3;                                  // 하산/이송 중
  const targetIdx=team.wps.findIndex(w=>w.isTarget);
  if(targetIdx>=0&&team.wpIdx>=targetIdx)return 2;          // 환자조우
  if(team.wpIdx>=team.wps.length-1)return 3;                // 경로 끝 (목표 없는 경로)
  return 1;                                                 // 이동중
}
// 팀이 하산/이송을 모두 마쳤는지
function _teamDone(team){
  return team.wps.some(w=>w.descent)&&team.wpIdx>=team.wps.length-1;
}
// 모든 팀 완료 여부 확인 → 최초 감지 시 토스트
function _checkAllTeamsDone(resId){
  if(!resId)return;
  const rescue=(DB.g('rescues')||[]).find(r=>r.id===resId);
  if(!rescue||rescue.status!=='ongoing')return;
  const teams=rescue.teams||[];
  if(!teams.length||!teams.every(t=>_teamDone(t)))return;
  const key='allDoneToast_'+resId;
  if(!sessionStorage.getItem(key)){
    sessionStorage.setItem(key,'1');
    toast('🏁 '+_esc(rescue.title)+' — 전 팀 완료! 상황 종료를 확인하세요');
  }
}
// 환자 조우 후 하산(도보·차량)/병원 이송(헬기) 경로를 뒤에 붙임. true=추가됨
function _appendDescentWps(team){
  const tIdx=team.wps.findIndex(w=>w.isTarget);
  if(tIdx<0||team.wpIdx<tIdx||team.wps.some(w=>w.descent))return false;
  if(team.type==='heli'){
    team.wps.push({code:'',name:'속초의료원 이송',lat:_SOKCHO_HOSP.lat,lng:_SOKCHO_HOSP.lng,descent:true,isHosp:true,status:'pending'});
  }else{
    const back=team.wps.slice(0,tIdx).reverse().map(w=>({code:w.code,name:w.name,lat:w.lat,lng:w.lng,isBase:w.isBase,descent:true,status:'pending'}));
    team.wps.push(...back);
  }
  return true;
}
// 조우 전 팀 복귀: 남은 상행 구간을 버리고 지나온 길을 역순으로 붙임. true=변경됨
function _appendReturnWps(team){
  if(team.wps.some(w=>w.descent)||team.wpIdx<=0)return false;
  const cur=team.wpIdx;
  const back=team.wps.slice(0,cur).reverse().map(w=>({code:w.code,name:w.name,lat:w.lat,lng:w.lng,isBase:w.isBase,descent:true,status:'pending'}));
  team.wps=team.wps.slice(0,cur+1).concat(back);
  return true;
}
// 타임라인: 하산 시작 버튼
// 하산/이송 완료 직후 환자 인계 기록 입력 (선택)
function _promptHandover(resId,team){
  setTimeout(()=>{
    const to=prompt((team&&team.type==='heli'?'🏥 이송':'🔽 하산')+' 완료 — 환자 인계 대상을 입력하세요\n(예: 119구급대, 속초의료원 응급실, 보호자 / 건너뛰려면 취소)');
    if(!to||!to.trim())return;
    const res=DB.g('rescues')||[];const ri=res.findIndex(x=>x.id===resId);
    if(ri<0)return;
    const u=DB.g('currentUser')||{};
    res[ri].handover={to:to.trim(),by:u.name||'',time:now(),team:(team&&team.name)||''};
    DB.s('rescues',res);
    toast('🤝 인계 기록 저장: '+to.trim());
    try{_rerenderTlFull();}catch(e){}
  },350);
}
// 현장도착 시각 기록 (유관기관 공식기록: 출동요청↔현장도착 구분)
function tlMarkArrival(idx){
  const team=_tlTeams[idx];if(!team)return;
  team.arrivedAt=now();
  _persistTeams();_rerenderTlFull();
  toast('🏁 '+team.name+' 현장도착 '+String(team.arrivedAt).slice(11,16));
}
function tlDescentTeam(idx){
  const team=_tlTeams[idx];if(!team)return;
  // 도보·차량팀: 이송 방식 선택 (들것이송 / 자력하산) → 단계 명확화
  if(team.type!=='heli'&&!team.transportMethod){
    const m=prompt('🔽 하산/이송 방식을 입력하세요\n1 = 들것이송, 2 = 자력하산, 3 = 차량이송\n(취소 시 일반 하산)');
    if(m==='1')team.transportMethod='들것이송';
    else if(m==='2')team.transportMethod='자력하산';
    else if(m==='3')team.transportMethod='차량이송';
  }else if(team.type==='heli'){team.transportMethod='헬기이송';}
  if(!_appendDescentWps(team)){toast('⚠️ 환자 조우 후 가능');return;}
  _saveTeamState();_tlSelTeam=idx;_tlWps=team.wps;_tlWpIdx=team.wpIdx;
  _persistTeams();_rerenderTlFull();
  const mm=team.transportMethod?' ('+team.transportMethod+')':'';
  toast(team.type==='heli'?'🏥 '+team.name+': 병원 이송 시작'+mm:'🔽 '+team.name+': 하산 시작'+mm);
}
// ── 헬기 환자 탑승 완료 기록
function tlMarkBoarding(idx){
  const team=_tlTeams[idx];if(!team||team.type!=='heli')return;
  team.boardedAt=now();
  _persistTeams();_rerenderTlFull();
  toast('🚁 '+team.name+' 환자 탑승 완료 '+String(team.boardedAt).slice(11,16));
}

// ── 조우 지점 변경: 요구조자가 내려오거나 합류 지점이 바뀌는 경우
function tlChangeTarget(idx){
  const team=_tlTeams[idx];if(!team)return;
  if(team.wps.some(w=>w.descent)){toast('⚠️ 이미 하산 중 — 변경 불가');return;}
  const curTargetIdx=team.wps.findIndex(w=>w.isTarget);
  if(curTargetIdx<0){toast('⚠️ 목표 지점 없음');return;}
  const curTarget=team.wps[curTargetIdx];
  const newCode=prompt('현재 조우 예정: '+(curTarget.code||curTarget.name)+'\n\n새 조우 지점 코드를 입력하세요\n(예: 01-10) — 요구조자가 내려온 경우 더 가까운 지점으로 변경');
  if(!newCode||!newCode.trim())return;
  const code=newCode.trim().toUpperCase();
  // wm(웨이포인트 맵)에서 해당 코드 검색
  const facs=DB.g('facilities')||[];
  let found=null;
  facs.forEach(f=>{const m=f.name&&f.name.match(/^(\d{2})-(\d{2})/);if(m&&(m[0]===code||f.name.toUpperCase().startsWith(code)))found=f;});
  if(!found){
    // 현재 wps에서도 검색
    found=team.wps.find(w=>w.code&&w.code.toUpperCase()===code);
    if(!found){toast('⚠️ '+code+' 지점을 찾을 수 없습니다');return;}
  }
  // 새 목표가 현재 위치보다 앞(진행방향)에 있어야 함
  const newTargetInRoute=team.wps.findIndex((w,i)=>i>team.wpIdx&&w.code&&w.code.toUpperCase()===code);
  if(newTargetInRoute>=0){
    // 이미 경로에 있는 지점 — 그 지점을 새 목표로
    team.wps.forEach((w,i)=>{w.isTarget=false;if(i===newTargetInRoute)w.isTarget=true;});
    // 새 목표 이후 지점들 제거 (불필요한 상행 구간)
    team.wps=team.wps.slice(0,newTargetInRoute+1);
    team.wps[newTargetInRoute].isTarget=true;
  }else{
    // 경로에 없음 — 현재 목표 지점을 교체
    team.wps[curTargetIdx]={code:found.name&&found.name.match(/^(\d{2}-\d{2})/)?found.name.match(/^(\d{2}-\d{2})/)[1]:code,name:found.name||code,lat:found.lat||null,lng:found.lng||null,isTarget:true,status:'pending',approx:false};
    team.wps=team.wps.slice(0,curTargetIdx+1);
  }
  _saveTeamState();_persistTeams();_rerenderTlFull();
  const nm=found.name||code;
  toast('📍 조우 지점 변경: '+nm);
  // 상황일지에 기록
  if(_tlWpResId){const _res=DB.g('rescues')||[];const _ri=_res.findIndex(x=>x.id===_tlWpResId);if(_ri>=0){if(!_res[_ri].timetable)_res[_ri].timetable=[];_res[_ri].timetable.push({stage:'조우 지점 변경',time:now().slice(11,16),note:team.name+' → '+nm});DB.s('rescues',_res);}}
}

// ── 이송 방법 전환 (도보→차량, 들것→헬기 인계 등)
function tlChangeTransport(idx){
  const team=_tlTeams[idx];if(!team)return;
  const methods=['들것이송','자력하산','차량이송','헬기이송(인계)'];
  const cur=team.transportMethod||'미지정';
  const picked=prompt('현재: '+cur+'\n\n새 이송 방법:\n1=들것이송\n2=자력하산\n3=차량이송\n4=헬기이송(인계)');
  const map={'1':'들것이송','2':'자력하산','3':'차량이송','4':'헬기이송(인계)'};
  const newMethod=map[picked&&picked.trim()];
  if(!newMethod)return;
  const prev=team.transportMethod||'미지정';
  team.transportMethod=newMethod;
  if(!team.transportLog)team.transportLog=[];
  team.transportLog.push({from:prev,to:newMethod,at:now()});
  _persistTeams();_rerenderTlFull();
  toast('🔄 '+team.name+' 이송 방법 변경: '+prev+' → '+newMethod);
  if(_tlWpResId){const _res=DB.g('rescues')||[];const _ri=_res.findIndex(x=>x.id===_tlWpResId);if(_ri>=0){if(!_res[_ri].timetable)_res[_ri].timetable=[];_res[_ri].timetable.push({stage:'이송방법 변경',time:now().slice(11,16),note:team.name+': '+prev+' → '+newMethod,type:'team'});DB.s('rescues',_res);}}
}

// ── 타임라인: 복귀 버튼 (다른 팀 회수)
// ── GPS 자동 통과 감지 (타임라인 화면이 열려 있는 동안) ──
let _gpsAutoOn=false,_gpsWatchId=null,_gpsDeclined={};
function _stopGpsAuto(){
  _gpsAutoOn=false;
  if(_gpsWatchId!=null){try{navigator.geolocation.clearWatch(_gpsWatchId);}catch(e){}_gpsWatchId=null;}
  const b=document.getElementById('gpsAutoBtn');
  if(b){b.textContent='📡 GPS 자동 통과 OFF';b.style.background='transparent';b.style.color='rgba(255,255,255,.4)';b.style.borderColor='rgba(255,255,255,.14)';}
}
function toggleGpsAuto(){
  if(_gpsAutoOn){_stopGpsAuto();toast('📡 GPS 자동 통과 끔');return;}
  if(!navigator.geolocation){toast('⚠️ 이 기기는 GPS를 지원하지 않습니다');return;}
  _gpsAutoOn=true;_gpsDeclined={};
  _gpsWatchId=navigator.geolocation.watchPosition(_onGpsAutoFix,
    ()=>{toast('⚠️ GPS 권한 거부 또는 수신 불가');_stopGpsAuto();},
    {enableHighAccuracy:true,maximumAge:5000,timeout:20000});
  const b=document.getElementById('gpsAutoBtn');
  if(b){b.textContent='📡 GPS 자동 통과 ON';b.style.background='rgba(39,174,96,.15)';b.style.color='#27ae60';b.style.borderColor='rgba(39,174,96,.45)';}
  toast('📡 GPS 자동 통과 켬 — 다음 표지판 60m 접근 시 알림 (화면을 켜둔 동안만 동작)');
}
// 백그라운드(화면 꺼짐·앱 전환) 시 GPS 연속수신 일시정지 → 배터리 절약, 복귀 시 자동 재개
document.addEventListener('visibilitychange',function(){
  if(document.hidden){
    if(_gpsAutoOn&&_gpsWatchId!=null){try{navigator.geolocation.clearWatch(_gpsWatchId);}catch(e){}_gpsWatchId=null;}
  }else{
    if(_gpsAutoOn&&_gpsWatchId==null&&navigator.geolocation){
      _gpsWatchId=navigator.geolocation.watchPosition(_onGpsAutoFix,()=>{},{enableHighAccuracy:true,maximumAge:5000,timeout:20000});
    }
    // 앱 재진입 시 날씨가 끝내 안 떠 있으면(첫 로드 실패) 다시 시도
    var _ws=document.getElementById('weatherStrip');
    if(_ws&&_ws.style.display==='none'){try{fetchWeather();}catch(e){}}
  }
});
// 팀의 실제 현재 위치를 GPS로 받아 미니맵에 표시하고, 가장 가까운 경로 지점으로
// 진행도를 맞춘다. (사고지점/목표는 그대로 유지)
function tlSetCurPos(idx){
  const team=_tlTeams[idx];if(!team)return;
  if(!navigator.geolocation){toast('⚠️ 이 기기는 GPS를 지원하지 않습니다');return;}
  toast('📡 현재 위치 확인 중...');
  navigator.geolocation.getCurrentPosition(function(pos){
    const lat=pos.coords.latitude,lng=pos.coords.longitude;
    team.curPos={lat:lat,lng:lng,at:now()};
    // 좌표가 있는 지점 중 가장 가까운 곳 찾기
    let nearest=-1,nd=Infinity;
    team.wps.forEach(function(w,i){
      if(!(w.lat&&w.lng))return;
      const d=_haversineKm(lat,lng,w.lat,w.lng);
      if(d<nd){nd=d;nearest=i;}
    });
    if(nearest>=0){
      // 진행도 스냅: 이전=통과, 현재=활성, 이후=대기 (스킵은 유지)
      team.wps.forEach(function(w,i){if(w.status!=='skipped')w.status=i<nearest?'passed':i===nearest?'active':'pending';});
      team.wpIdx=nearest;
      if(idx===_tlSelTeam){_tlWps=team.wps;_tlWpIdx=team.wpIdx;}
    }
    _persistTeams();
    _rerenderTlFull();
    if(team.wps.some(w=>w.lat&&w.lng))setTimeout(function(){_initTlMiniMap(team.wps,team.curPos);},120);
    const nm=nearest>=0?(team.wps[nearest].code||team.wps[nearest].name||''):'';
    toast('📍 '+team.name+' 현위치 갱신'+(nearest>=0?' — '+nm+' 부근 (약 '+Math.round(nd*1000)+'m)':''));
  },function(){toast('⚠️ GPS 권한 거부 또는 수신 불가');},{enableHighAccuracy:true,timeout:15000,maximumAge:5000});
}
function _onGpsAutoFix(pos){
  if(!_gpsAutoOn)return;
  // 타임라인 화면을 벗어나면 자동 중지 (배터리 보호)
  const v=document.getElementById('v-report');
  if(!v||!v.classList.contains('on')){_stopGpsAuto();return;}
  const team=_tlTeams[_tlSelTeam];
  if(!team||!team.wps)return;
  const nextIdx=team.wpIdx+1;
  const nw=team.wps[nextIdx];
  if(!nw||!nw.lat||!nw.lng)return;
  const dM=Math.round(_haversineKm(pos.coords.latitude,pos.coords.longitude,nw.lat,nw.lng)*1000);
  if(dM>60)return;
  const key=(team.id||_tlSelTeam)+'_'+nextIdx;
  if(_gpsDeclined[key])return;
  if(navigator.vibrate)try{navigator.vibrate([200,100,200]);}catch(e){}
  if(confirm('📍 '+(nw.code?nw.code+' ':'')+(nw.name||'다음 지점')+' 도착 (약 '+dM+'m)\n통과 처리할까요?')){
    tlPassTeam(_tlSelTeam);
  }else{
    _gpsDeclined[key]=1; // 같은 지점 재질문 방지
  }
}

function _wpItemHtmlTeam(w,i,team,teamIdx){
  const isActive=i===team.wpIdx;
  const isLast=i===team.wps.length-1;
  const isBase=w.isBase||w.isStart;
  let dbg,dbd,dtxt,nc,badge='';
  if(w.status==='passed'){
    dbg='rgba(39,174,96,.22)';dbd='#27ae60';dtxt='✓';nc='rgba(255,255,255,.42)';
    badge='<span style="background:rgba(39,174,96,.12);color:#5dbf8a;border:1px solid rgba(39,174,96,.25);border-radius:5px;font-size:9px;padding:1px 6px;">통과</span>';
  }else if(w.status==='skipped'){
    dbg='rgba(120,120,120,.12)';dbd='rgba(120,120,120,.35)';dtxt='↷';nc='rgba(255,255,255,.28)';
    badge='<span style="background:rgba(120,120,120,.1);color:rgba(180,180,180,.7);border:1px solid rgba(120,120,120,.2);border-radius:5px;font-size:9px;padding:1px 6px;">스킵</span>';
  }else if(isActive){
    dbg='rgba(231,76,60,.25)';dbd='#e74c3c';dtxt=isBase?'🏠':'📍';nc='#e0edf8';
    badge='<span style="background:rgba(231,76,60,.18);color:#e74c3c;border:1px solid rgba(231,76,60,.38);border-radius:5px;font-size:9px;padding:1px 6px;font-weight:700;">현재 위치</span>';
  }else if(w.isTarget){
    dbg='rgba(192,57,43,.12)';dbd='rgba(192,57,43,.45)';dtxt='🚨';nc='rgba(220,80,80,.8)';
    badge=`<span style="background:rgba(192,57,43,.12);color:#e05050;border:1px solid rgba(192,57,43,.28);border-radius:5px;font-size:9px;padding:1px 6px;font-weight:700;">사고지점${w.approx?' (근처)':''}</span>`;
  }else if(isBase){
    dbg='rgba(39,174,96,.15)';dbd='rgba(39,174,96,.4)';dtxt='🏠';nc='rgba(255,255,255,.5)';
  }else{
    dbg='rgba(79,168,208,.08)';dbd='rgba(79,168,208,.25)';dtxt=w.isHosp?'🏥':(w.code||'·');nc='rgba(255,255,255,.35)';
    if(w.descent)badge='<span style="background:rgba(39,174,96,.08);color:rgba(93,191,138,.7);border:1px solid rgba(39,174,96,.18);border-radius:5px;font-size:9px;padding:1px 6px;">🔽 하산</span>';
  }
  // 차량 접근 구간: 🚗 배지 / 차량 종점(와선대·백담센터)은 🥾 도보 시작 배지
  const vehBadge=w.vehEnd
    ?`<span style="background:rgba(241,196,15,.14);color:#f0c040;border:1px solid rgba(241,196,15,.35);border-radius:5px;font-size:9px;padding:1px 6px;font-weight:700;margin-right:4px;">🚗→🥾 도보 시작</span>`
    :(w.byVehicle?`<span style="background:rgba(231,76,60,.14);color:#ff6a4d;border:1px solid rgba(231,76,60,.3);border-radius:5px;font-size:9px;padding:1px 6px;font-weight:700;margin-right:4px;">🚗 차량 이동${w.vehKm?' '+w.vehKm.toFixed(1)+'km':''}</span>`:'');
  const click=(!isBase&&!isActive)?`onclick="event.stopPropagation();tlWarpToTeam(${teamIdx},${i})"`:'' ;
  return `<div id="tlWp_${teamIdx}_${i}" class="tl-wp${isActive?' tl-wp-active':''}${isLast?' last':''}" ${click} style="${!isBase&&!isActive?'cursor:pointer;':''}">
    <div style="position:relative;flex-shrink:0;">
      <div class="tl-wp-dot" style="background:${dbg};border-color:${dbd};">${dtxt}</div>
      ${!isLast?`<div class="tl-wp-conn"${w.byVehicle?' style="background:repeating-linear-gradient(to bottom,#e74c3c 0,#e74c3c 3px,transparent 3px,transparent 6px);"':''}></div>`:''}
    </div>
    <div style="padding-top:2px;flex:1;min-width:0;">
      <div style="font-size:12px;font-weight:${isActive?700:600};color:${nc};line-height:1.35;overflow:hidden;text-overflow:ellipsis;">${w.name}</div>
      <div style="margin-top:3px;">${vehBadge}${badge}${w.passedAt?`<span style="font-size:9px;color:rgba(255,255,255,.28);margin-left:5px;">${w.passedAt}</span>`:''}</div>
    </div>
  </div>`;
}


function _toggleTlFull(idx){
  if(!_tlTeams[idx])return;
  _tlTeams[idx].showFull=!_tlTeams[idx].showFull;
  _rerenderTlFull();
}

function _compactRouteHtml(team,idx){
  const cur=team.wps[team.wpIdx]||team.wps[0];
  const next=team.wps[team.wpIdx+1]||null;
  const atEnd=team.wpIdx>=team.wps.length-1;
  const total=Math.max((team.wps||[]).length-1,1);
  const prog=team.wpIdx;
  const pct=Math.round((prog/total)*100);
  const showFull=!!team.showFull;
  if(!cur)return`<div style="text-align:center;font-size:11px;color:rgba(255,255,255,.42);padding:10px 0;">경로 데이터 없음</div>`;
  // 이름에서 코드 접두어 제거
  const _nm=n=>(n||'').replace(/^\d{2}-\d{2}\s*/,'').trim()||n||'';
  const curLabel=(cur.code?cur.code+' ':'')+_nm(cur.name);
  const nextLabel=next?(next.code?next.code+' ':'')+_nm(next.name):'';
  const _hasDescent=team.wps.some(w=>w.descent);
  // 환자 조우 도달 → 헬기는 4단계, 나머지는 하산 시작
  if(atEnd&&cur.isTarget&&!_hasDescent){
    const joguCard=`
    <div style="background:rgba(39,174,96,.08);border:1px solid rgba(39,174,96,.3);border-radius:12px;padding:12px 14px;margin-bottom:10px;">
      <div style="font-size:10px;color:#5dbf8a;font-weight:700;margin-bottom:4px;">🎯 환자 조우 지점</div>
      <div style="font-size:15px;font-weight:800;color:#eef5fb;">${curLabel}</div>
    </div>`;
    if(team.type==='heli'){
      // 헬기 4단계: 현장도착 → 환자탑승 → 이송시작
      if(!team.arrivedAt){
        return joguCard+`<button onclick="event.stopPropagation();tlMarkArrival(${idx})" style="width:100%;padding:15px;border-radius:12px;border:none;background:linear-gradient(180deg,#e67e22,#c0392b);color:#fff;font-size:14px;font-weight:800;cursor:pointer;margin-bottom:6px;">🏁 헬기 현장도착 기록</button>`;
      }else if(!team.boardedAt){
        return joguCard+`
        <div style="display:flex;gap:6px;padding:7px 9px;background:rgba(39,174,96,.06);border-radius:9px;margin-bottom:10px;font-size:10px;color:#5dbf8a;">
          <span>🏁 도착 ${String(team.arrivedAt).slice(11,16)}</span>
        </div>
        <button onclick="event.stopPropagation();tlMarkBoarding(${idx})" style="width:100%;padding:15px;border-radius:12px;border:none;background:linear-gradient(180deg,#3f9bd1,#2d7db3);color:#fff;font-size:14px;font-weight:800;cursor:pointer;">🚁 환자 탑승 완료</button>`;
      }else{
        return joguCard+`
        <div style="display:flex;gap:10px;padding:7px 9px;background:rgba(39,174,96,.06);border-radius:9px;margin-bottom:10px;font-size:10px;color:#5dbf8a;">
          <span>🏁 도착 ${String(team.arrivedAt).slice(11,16)}</span>
          <span>🚁 탑승 ${String(team.boardedAt).slice(11,16)}</span>
        </div>
        <button onclick="event.stopPropagation();tlDescentTeam(${idx})" style="width:100%;padding:15px;border-radius:12px;border:none;background:linear-gradient(180deg,#2ecc71,#27ae60);color:#fff;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 3px 10px rgba(39,174,96,.4);">🏥 병원 이송 시작</button>`;
      }
    }
    // 도보·차량팀: 조우 지점 변경 버튼 + 하산 시작
    return joguCard+`
    <button onclick="event.stopPropagation();tlDescentTeam(${idx})" style="width:100%;padding:15px;border-radius:12px;border:none;background:linear-gradient(180deg,#2ecc71,#27ae60);color:#fff;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 3px 10px rgba(39,174,96,.4);margin-bottom:7px;">🔽 하산 시작</button>
    <button onclick="event.stopPropagation();tlChangeTarget(${idx})" style="width:100%;padding:9px;border-radius:9px;border:1px solid rgba(241,196,15,.3);background:rgba(241,196,15,.06);color:#f0c040;font-size:11px;font-weight:700;cursor:pointer;">📍 조우 지점 변경 (요구조자가 내려온 경우)</button>`;
  }
  // 하산/이송 완료
  if(atEnd&&_hasDescent){
    return`<div style="text-align:center;padding:14px;font-size:13px;color:#2ecc71;font-weight:800;">✅ ${team.type==='heli'?'병원 이송':'하산'} 완료</div>`;
  }
  // 진행 바
  const barHtml=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><div style="flex:1;background:rgba(255,255,255,.09);border-radius:5px;height:7px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#2d7db3,#4fa8d0);border-radius:5px;transition:width .3s;"></div></div><span style="font-size:10px;color:#7a9cb8;font-weight:700;font-family:monospace;flex-shrink:0;">${pct}%</span></div>`;
  // 현재 위치 카드 (차량 구간이면 '차량 이동 중' 멘트)
  const _inVeh=!!cur.byVehicle;
  const curCard=`
    <div style="background:${_inVeh?'rgba(231,76,60,.13)':'rgba(231,76,60,.09)'};border:1px solid ${_inVeh?'rgba(231,76,60,.45)':'rgba(231,76,60,.3)'};border-radius:11px;padding:11px 14px;margin-bottom:7px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
        <span style="font-size:10px;color:#ff7060;font-weight:700;">${_inVeh?'🚗 차량 이동 중':'📍 현재 위치'}</span>
        <span style="font-size:10px;color:rgba(255,255,255,.3);font-family:monospace;">${prog} / ${total}</span>
      </div>
      <div style="font-size:15px;font-weight:800;color:#eef5fb;line-height:1.3;word-break:keep-all;">${curLabel}</div>
      ${_inVeh?`<div style="font-size:10px;color:#ff9e80;margin-top:3px;font-weight:600;">${cur.vehEnd?'🥾 여기서부터 도보 이동':'🚗 차량 접근 구간 — 종점까지 차량 이동'}</div>`:''}
      ${cur.passedAt?`<div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:3px;">${String(cur.passedAt).slice(11,16)} 통과</div>`:''}
    </div>`;
  // 다음 위치 (차량 종점이면 '도보 시작점' 멘트)
  const nextCard=next?`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:0 2px;">
      <span style="font-size:13px;color:rgba(79,168,208,.45);">↓</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:10px;color:${next.vehEnd?'#ff9e80':'#4a7090'};font-weight:600;margin-bottom:1px;">${next.vehEnd?'다음 · 🥾 도보 시작점':'다음'}${next.byVehicle&&!next.vehEnd?' 🚗':''}${next.descent?' 🔽':''}</div>
        <div style="font-size:13px;font-weight:600;color:rgba(255,255,255,.7);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${nextLabel}</div>
      </div>
    </div>`:
    !atEnd?'':`<div style="text-align:center;font-size:12px;color:#2ecc71;font-weight:700;margin-bottom:8px;">✅ 전 구간 통과</div>`;
  // 통과 버튼 (건너뛰기 제거)
  const passBtn=!atEnd?`
    <button id="tlPassBtn_${idx}" onclick="event.stopPropagation();tlPassTeam(${idx})" style="width:100%;padding:15px;border-radius:12px;border:none;background:linear-gradient(180deg,#3f9bd1,#2a6fa3);color:#fff;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 3px 10px rgba(45,125,179,.4);margin-bottom:8px;">✓ 통과 → ${next?nextLabel.split(' ')[0]||'다음':''}</button>`:'';
  // GPS + 전체경로 (보조 작은 버튼들)
  const _canChangeTarget=!_hasDescent&&team.wps.some(w=>w.isTarget)&&!atEnd;
  const _canChangeTransport=_hasDescent&&team.transportMethod;
  const secBtns=`
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      <button onclick="event.stopPropagation();tlSetCurPos(${idx})" style="flex:1;padding:8px;border-radius:9px;border:1px solid rgba(79,168,208,.22);background:rgba(79,168,208,.06);color:#6aa8ff;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;">📡 GPS${team.curPos?` <span style="font-size:9px;opacity:.5;">${String(team.curPos.at).slice(11,16)}</span>`:''}</button>
      ${_canChangeTarget?`<button onclick="event.stopPropagation();tlChangeTarget(${idx})" style="flex:1;padding:8px;border-radius:9px;border:1px solid rgba(241,196,15,.28);background:rgba(241,196,15,.05);color:#e8c84a;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;">📍 조우 지점</button>`:''}
      ${_canChangeTransport?`<button onclick="event.stopPropagation();tlChangeTransport(${idx})" style="flex:1;padding:8px;border-radius:9px;border:1px solid rgba(230,126,34,.28);background:rgba(230,126,34,.05);color:#e8943a;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;">🔄 이송 전환</button>`:''}
      <button onclick="event.stopPropagation();_toggleTlFull(${idx})" style="padding:8px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(255,255,255,.35);font-size:11px;cursor:pointer;white-space:nowrap;">${showFull?'▲ 접기':'▾ 전체'}</button>
    </div>`;
  const fullList=showFull?`<div id="tlWpList_${idx}" style="max-height:240px;overflow-y:auto;border:1px solid rgba(255,255,255,.07);border-radius:9px;padding:6px 8px;margin-top:8px;">${team.wps.map((w,i)=>_wpItemHtmlTeam(w,i,team,idx)).join('')}</div>`:'';
  return barHtml+curCard+nextCard+passBtn+secBtns+fullList;
}

function _tlTeamFullHtml(team,idx){
  const isSel=idx===_tlSelTeam&&!team.collapsed;
  const si=_teamStageIdx(team);
  const typeIco=_teamIco(team);
  const isCollapsed=!!team.collapsed;
  const STAGE_PILL=['출발','이동 중','환자 조우','하산·이송'];
  const STAGE_COL=['rgba(255,255,255,.38)','#4fa8d0','#e74c3c','#27ae60'];
  const stagePill=`<span style="font-size:10px;font-weight:700;color:${STAGE_COL[si]};background:rgba(${si===2?'231,76,60':si===3?'39,174,96':si===1?'79,168,208':'255,255,255'},.1);border-radius:6px;padding:2px 7px;">${STAGE_PILL[si]||''}</span>`;
  const _mem=team.memberCount?` <span style="font-size:9px;color:rgba(255,255,255,.38);">${team.memberCount}명</span>`:'';
  const _req=team.requestedAt?String(team.requestedAt).slice(11,16):'';
  const _arr=team.arrivedAt?String(team.arrivedAt).slice(11,16):'';
  const _brd=team.boardedAt?String(team.boardedAt).slice(11,16):'';
  const _transport=team.transportMethod?`<span style="font-size:10px;color:#e8943a;background:rgba(230,126,34,.12);border-radius:6px;padding:2px 7px;font-weight:600;">${team.transportMethod}</span>`:'';
  // 유관기관: 출동요청·도착 시각 칩 / 공단팀: 도착 기록 버튼
  const _isAgency=team.agType!=null;
  const _timeChips=`<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px;">
    ${_req?`<span style="font-size:10px;color:#7a96ad;background:rgba(255,255,255,.05);border-radius:6px;padding:2px 7px;">🚨 ${_req}</span>`:''}
    ${_arr?`<span style="font-size:10px;color:#3ad17a;background:rgba(39,174,96,.1);border-radius:6px;padding:2px 7px;">🏁 ${_arr}</span>`:(_isAgency?`<button onclick="event.stopPropagation();tlMarkArrival(${idx})" style="background:rgba(39,174,96,.12);border:1px solid rgba(39,174,96,.35);color:#5dbf8a;border-radius:6px;font-size:10px;font-weight:700;padding:3px 9px;cursor:pointer;">🏁 도착 기록</button>`:'')}
    ${_brd?`<span style="font-size:10px;color:#5fb0d8;background:rgba(79,168,208,.1);border-radius:6px;padding:2px 7px;">🚁 탑승 ${_brd}</span>`:''}
    ${_transport}
  </div>`;
  const routeInner=team.wps.length>1
    ?_compactRouteHtml(team,idx)
    :`<div style="text-align:center;font-size:11px;color:rgba(255,255,255,.42);padding:10px 0;">경로 데이터 없음</div>`;
  return `<div id="tlTeamCard_${idx}" style="background:${isSel?'rgba(79,168,208,.06)':'rgba(255,255,255,.015)'};border:1.5px solid ${isSel?'rgba(79,168,208,.4)':'rgba(255,255,255,.08)'};border-radius:12px;margin-bottom:8px;overflow:hidden;">
    <div onclick="toggleTlTeamRoute(${idx})" style="padding:11px 13px;cursor:pointer;user-select:none;-webkit-user-select:none;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:13px;font-weight:700;color:${isSel?'#6bbde0':'#c8dff0'};">${typeIco} ${_esc(team.name)}${_mem}</span>
        <div style="display:flex;align-items:center;gap:7px;">${stagePill}<span style="font-size:12px;color:rgba(255,255,255,.4);">${isCollapsed?'▼':'▲'}</span></div>
      </div>
      ${_timeChips}
    </div>
    <div id="tlTeamRoute_${idx}" style="display:${isCollapsed?'none':'block'};padding:0 13px 13px;border-top:.5px solid rgba(255,255,255,.06);">
      ${routeInner}
    </div>
  </div>`;
}

function toggleTlTeamRoute(idx){
  if(!_tlTeams[idx])return;
  const wasCollapsed=_tlTeams[idx].collapsed;
  _tlTeams[idx].collapsed=!wasCollapsed;
  if(wasCollapsed){_saveTeamState();_tlSelTeam=idx;_tlWps=_tlTeams[idx].wps;_tlWpIdx=_tlTeams[idx].wpIdx;}
  _rerenderTlFull();
}
function tlPassTeam(idx){
  const team=_tlTeams[idx];
  if(!team||_tlAnimating)return;                       // 애니메이션 중 연타 차단
  if(team.wpIdx>=team.wps.length-1)return;             // 이미 끝
  _tlAnimating=true;
  const next=team.wpIdx+1;
  // 즉시 시각 피드백 — 버튼 비활성화 (연타 인지 차단의 핵심)
  [document.getElementById('tlPassBtn_'+idx),document.getElementById('tlPassBtn')].forEach(pb=>{
    if(pb){pb.disabled=true;pb.style.opacity='.5';pb.style.cursor='default';pb.textContent='이동 중…';}
  });
  const nel=document.getElementById('tlWp_'+next);
  if(nel){nel.style.transition='background .2s';nel.style.background='rgba(231,76,60,.07)';}
  const dur=_tlVehicle?240:420;                         // 1400ms → 420ms: 즉각 반응
  setTimeout(()=>{
    // team 객체에 직접 적용 — 전역 변수 재할당과 무관 (교차오염 방지)
    const passedWp=team.wps[team.wpIdx];
    team.wps[team.wpIdx].passedAt=now();
    team.wps[team.wpIdx].status='passed';
    team.wps[next].status='active';
    team.wpIdx=next;
    // 선택팀 전역 동기화
    _tlSelTeam=idx;_tlWps=team.wps;_tlWpIdx=team.wpIdx;
    _tlAnimating=false;
    _saveTeamState();_persistTeams();_rerenderTlFull();
    if(team.wps[next].isTarget)toast('🎯 환자 조우!');
    if(next>=team.wps.length-1&&team.wps[next].descent)_promptHandover(_tlWpResId,team);
    if(_tlWpResId){
      const _res=DB.g('rescues')||[];const _ri=_res.findIndex(x=>x.id===_tlWpResId);
      if(_ri>=0){
        if(!_res[_ri].wpLog)_res[_ri].wpLog=[];
        const _d=new Date();
        _res[_ri].wpLog.push({time:_d.getHours().toString().padStart(2,'0')+':'+_d.getMinutes().toString().padStart(2,'0'),teamName:team.name||'팀',code:passedWp.code||'',wpName:passedWp.name||''});
        DB.s('rescues',_res);
      }
    }
    _checkAllTeamsDone(_tlWpResId);
  },dur);
}
function tlWarpToTeam(teamIdx,wpIdx){_saveTeamState();_tlSelTeam=teamIdx;_tlWps=_tlTeams[teamIdx].wps;_tlWpIdx=_tlTeams[teamIdx].wpIdx;tlWarpTo(wpIdx);}

function _rerenderTlFull(){
  const el=document.getElementById('tlAllTeams');
  if(el)el.innerHTML=_tlTeams.map((t,i)=>_tlTeamFullHtml(t,i)).join('');
  if(!_tlBuilding){const ba=document.getElementById('tlBuildArea');if(ba)ba.innerHTML=_renderCreateBtnsHtml();}
  const allDone=_tlTeams.length>0&&_tlTeams.every(t=>_teamDone(t));
  const bel=document.getElementById('tlAllDoneBanner');
  if(bel)bel.style.display=allDone?'':'none';
}


function tlWarpTo(idx){
  if(_tlAnimating||idx<1||idx>=_tlWps.length)return;
  _tlWps.forEach((w,i)=>{if(w.status!=='skipped')w.status=i<idx?'passed':i===idx?'active':'pending';});
  _tlWpIdx=idx;_saveTeamState();_persistTeams();_rerenderTlFull();
}

function _buildLogHtml(r){
  const baseDate=(r.date||'').slice(0,10);
  const _tKey=t=>{const s=String(t||'').trim();if(/^\d{4}-\d{2}-\d{2}/.test(s))return s;return baseDate+' '+s;};
  const _tShow=t=>{const s=String(t||'').trim();return s.length>5?s.slice(11,16)||s.slice(-5):s;};
  // type: 'victim'=요구조자 관련(빨강) | 'team'=팀 이동(파랑) | 'report'=보고(보라) | 'nps'=공단(초록)
  const logEntries=[];
  if(r.date)logEntries.push({k:_tKey(r.date),t:_tShow(r.date),ico:'🚨',label:'최초접수',sub:r.reception||'',type:'victim'});
  (r.timetable||[]).forEach(e=>{
    if(!e.time)return;
    const isVictim=e.stage==='요구조자 조우'||e.stage==='심정지'||e.stage==='의식확인';
    const isCpr=e.stage==='심정지'&&(e.cprStart||e.cprEnd);
    let sub=e.note||'';
    if(isCpr){
      const cprDur=e.cprStart&&e.cprEnd?(()=>{try{const s=new Date(e.cprStart.replace(' ','T')),en=new Date(e.cprEnd.replace(' ','T'));const m=Math.round((en-s)/60000);return m>0?' ('+m+'분)':'';}catch(e){return ''}})():'';
      sub=(e.cprStart?'CPR '+String(e.cprStart).slice(11,16):'')+(e.cprEnd?'→'+String(e.cprEnd).slice(11,16)+cprDur:'')+(e.aed?' · AED '+e.aed:'')+(sub?' · '+sub:'');
    }
    logEntries.push({k:_tKey(e.time),t:_tShow(e.time),ico:e.stage==='심정지'?'💔':isVictim?'🎯':'📌',label:e.stage,sub,type:isVictim?'victim':'team'});
  });
  // 위치통과: "01-15 통과" (팀명은 서브)
  (r.wpLog||[]).forEach(l=>{
    logEntries.push({k:_tKey(l.time),t:l.time,ico:'📍',label:(l.code||'?')+' 통과',sub:l.teamName||'',type:'team'});
  });
  (r.teams||[]).forEach(t=>{
    if(t.createdAt){
      const _ico=t.type==='heli'?'🚁':t.type==='vehicle'?'🚗':'🥾';
      const _base=t.wps&&t.wps[0]?t.wps[0].name.replace(/^\d{2}-\d{2}\s*/,''):'';
      const _tgt=t.wps&&t.wps.length>1?t.wps[t.wps.length-1].name.replace(/^\d{2}-\d{2}\s*/,''):'';
      const _mem=t.members&&t.members.length?t.members.join(', '):'';
      logEntries.push({k:_tKey(t.createdAt),t:_tShow(t.createdAt),ico:_ico,label:t.name+' 출동',sub:(_mem?_mem+' · ':'')+(_base&&_tgt?_base+' → '+_tgt:''),type:'team'});
    }
    if(t.arrivedAt)logEntries.push({k:_tKey(t.arrivedAt),t:_tShow(t.arrivedAt),ico:'🏁',label:t.name+' 현장도착',sub:'',type:'team'});
    if(t.boardedAt)logEntries.push({k:_tKey(t.boardedAt),t:_tShow(t.boardedAt),ico:'🚁',label:t.name+' 환자 탑승',sub:'',type:'team'});
    (t.transportLog||[]).forEach(tr=>logEntries.push({k:_tKey(tr.at),t:_tShow(tr.at),ico:'🔄',label:t.name+' 이송전환',sub:tr.from+' → '+tr.to,type:'team'}));
  });
  (r.reports||[]).forEach((p,pi)=>{if(p.repTime)logEntries.push({k:_tKey(p.repTime),t:_tShow(p.repTime),ico:'📋',label:(pi+2)+'보 보고'+(p.author?' · '+p.author:''),sub:p.update||'',type:'report'});});
  (r.npsLog||[]).forEach(nl=>{if(nl.time)logEntries.push({k:_tKey(nl.time),t:_tShow(nl.time),ico:'🏕️',label:'공단 공유'+(nl.author?' · '+nl.author:''),sub:nl.text||'',type:'nps'});});
  if(r.handover&&r.handover.to)logEntries.push({k:_tKey(r.handover.time),t:_tShow(r.handover.time),ico:'🤝',label:'환자 인계 → '+r.handover.to,sub:r.handover.by||'',type:'victim'});
  logEntries.sort((a,b)=>a.k.localeCompare(b.k));
  if(!logEntries.length)return '';
  // 타입별 색상
  const TYPE_COL={victim:'#e74c3c',team:'#4fa8d0',report:'#9b59b6',nps:'#27ae60'};
  const TYPE_BG={victim:'rgba(231,76,60,.1)',team:'rgba(79,168,208,.08)',report:'rgba(155,89,182,.08)',nps:'rgba(39,174,96,.08)'};
  const isWpPass=e=>e.type==='team'&&e.ico==='📍';
  const rows=logEntries.map((e,i)=>{
    const col=TYPE_COL[e.type]||'#7a9cb8';
    const bg=TYPE_BG[e.type]||'transparent';
    const isLast=i===logEntries.length-1;
    return `<div style="display:flex;gap:0;position:relative;">
      <!-- 세로 타임라인 트랙 -->
      <div style="display:flex;flex-direction:column;align-items:center;width:28px;flex-shrink:0;">
        <div style="width:8px;height:8px;border-radius:50%;background:${col};flex-shrink:0;margin-top:4px;box-shadow:0 0 4px ${col}66;"></div>
        ${isLast?'':`<div style="width:1.5px;flex:1;min-height:12px;background:linear-gradient(${col}66,rgba(255,255,255,.06));margin-top:2px;"></div>`}
      </div>
      <!-- 이벤트 내용 -->
      <div style="flex:1;padding:2px 0 ${isLast?'0':'10px'} 4px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:${e.sub?'2':'0'}px;">
          <span style="font-size:11px;color:#7a9cb8;font-family:monospace;font-weight:600;white-space:nowrap;">${e.t}</span>
          <span style="font-size:${isWpPass(e)?'11':'12'}px;font-weight:${isWpPass(e)?'600':'700'};color:${isWpPass(e)?'rgba(255,255,255,.55)':col};">${e.ico} ${_esc(e.label)}</span>
        </div>
        ${e.sub?`<div style="font-size:10px;color:rgba(255,255,255,.35);padding-left:2px;line-height:1.4;">${_esc(e.sub)}</div>`:''}
      </div>
    </div>`;
  }).join('');
  // 범례
  const legend=`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
    ${Object.entries({요구조자:'victim',팀이동:'team',보고:'report','공단':'nps'}).map(([lbl,tp])=>`<span style="font-size:9px;color:${TYPE_COL[tp]};background:${TYPE_BG[tp]};border-radius:4px;padding:1px 6px;font-weight:700;">${lbl}</span>`).join('')}
  </div>`;
  return `<div style="background:#060d1a;border-radius:10px;padding:11px 13px;margin-top:8px;border:.5px solid rgba(79,168,208,.15);">
    <div style="font-size:11px;color:#4fa8d0;font-weight:700;margin-bottom:7px;">📜 상황 일지</div>
    ${legend}${rows}
  </div>`;
}
// 추가보고(N보)에 들어온 새 정보를 최초접수 위에 최신값으로 병합 — 팝업·보고서에 '다 뜨게'
// (각 보고는 빈값이면 직전값을 이어받으므로, 비어있지 않은 최신값이 이김. 메타·증분 필드는 제외)
function _mergedRescue(r){
  if(!r||!r.reports||!r.reports.length)return r;
  const SKIP={id:1,rid:1,repTime:1,date:1,status:1,title:1,reports:1,author:1,update:1,victimChange:1,addMem:1,comments:1,reception:1,initTemp:1,sosId:1};
  const BLANK=['','-','미정','해당없음','알수없음','없음','미상','모르겠음'];
  const m=Object.assign({},r);
  r.reports.forEach(p=>{
    if(!p)return;
    Object.keys(p).forEach(k=>{
      if(SKIP[k])return;
      const v=p[k];
      if(v===undefined||v===null||(Array.isArray(v)&&!v.length)||BLANK.includes(v))return;
      m[k]=v; // 최신 보고의 값으로 갱신
    });
  });
  return m;
}
// 보고서 공유/복사/인쇄 — 헤더 우측 '📄 보고서' 버튼
function openReportShare(rid){
  let m=document.getElementById('repShareModal');
  if(!m){m=document.createElement('div');m.id='repShareModal';document.body.appendChild(m);}
  m.style.cssText='position:fixed;inset:0;z-index:9600;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:30px;';
  const b='width:100%;margin-bottom:7px;padding:12px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;';
  m.innerHTML=`<div style="background:#0a1828;border:1px solid rgba(79,168,208,.25);border-radius:14px;max-width:300px;width:100%;padding:16px;">
    <div style="font-size:14px;font-weight:800;color:#e0edf8;margin-bottom:12px;text-align:center;">📄 보고서</div>
    <button onclick="copyReportText(${rid});this.closest('#repShareModal').remove();" style="${b}border:1px solid rgba(79,168,208,.35);background:rgba(79,168,208,.1);color:#4fa8d0;">📋 텍스트 복사</button>
    <button onclick="shareReportText(${rid});this.closest('#repShareModal').remove();" style="${b}border:1px solid rgba(39,174,96,.35);background:rgba(39,174,96,.1);color:#27ae60;">📤 공유</button>
    <button onclick="printReport(${rid});this.closest('#repShareModal').remove();" style="${b}border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#b8d4e8;">🖨 인쇄 / PDF</button>
    <button onclick="this.closest('#repShareModal').remove();" style="width:100%;padding:9px;border:none;background:none;color:#7a9cb8;font-size:12px;cursor:pointer;">닫기</button>
  </div>`;
  m.onclick=function(e){if(e.target===m)m.remove();};
}
function renderTimeline(r,viewMode,outId){
  const _isBoard=outId&&outId!=='repContent';
  if(!_isBoard){_hideRepFooter();window._reportMode='timeline';clearInterval(_draftAutoTimer);} // 타임라인 보기 — 작성모드 해제

  _curViewResId=r.id;
  const mode=(viewMode==='full'||viewMode==='write')?'write':'advanced';
  _tlMode=mode;_tlViewMode=mode;
  const all=[r,...(r.reports||[])];
  const w=document.getElementById(outId||'repContent');
  if(!w)return;

  function renderComments(resId){
    // 구조 레코드 내장 댓글(동기화됨) + 구버전 로컬 댓글 병합
    const rec=getRes(resId);
    const seen=new Set();
    const cmts=[...(rec.comments||[]),...(DB.g('comments_'+resId)||[])]
      .filter(c=>{if(seen.has(c.id))return false;seen.add(c.id);return true;})
      .sort((a,b)=>(a.id||0)-(b.id||0));
    if(!cmts.length)return '<div style="font-size:11px;color:rgba(255,255,255,.25);padding:4px 0;">댓글 없음</div>';
    return cmts.map(cm=>`<div style="background:#060d1a;border-radius:7px;padding:8px 10px;margin-bottom:5px;">
      <div style="font-size:11px;color:#4fa8d0;font-weight:600;">${_esc(cm.author||'익명')} · ${cm.time}</div>
      <div style="font-size:12px;color:#b8d4e8;margin-top:3px;line-height:1.5;">${_esc(cm.text)}</div>
    </div>`).join('');
  }

  const tabHdr=`<div style="background:#0b1c30;border-radius:10px;padding:11px 12px;border:.5px solid rgba(255,255,255,.07);margin-bottom:10px;">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:14px;font-weight:700;color:#e0edf8;">${_esc(r.title)}</div>
        <div style="font-size:11px;color:#3a6a8a;margin-top:3px;">${_esc(r.type)} · ${r.status==='ongoing'?'<span style="color:#c0392b;font-weight:700;">진행중</span>':'<span style="color:#27ae60;font-weight:700;">종료</span>'} · ${r.date}${r.status==='ongoing'&&_elapsedStr(r.date)?` · <span class="js-elapsed" data-d="${_esc(r.date)}" style="color:#f0a500;font-weight:700;">⏱ ${_elapsedStr(r.date)}</span>`:''}</div>
      </div>
      <button onclick="openReportShare(${r.id})" style="flex-shrink:0;background:rgba(79,168,208,.12);color:#4fa8d0;border:1px solid rgba(79,168,208,.32);border-radius:7px;padding:5px 9px;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap;">📄 보고서</button>
    </div>
    <div style="display:flex;gap:5px;margin-top:9px;">
      <button onclick="${_isBoard?`_boardOpenDetail(${r.id},'advanced')`:`renderTimeline(getRes(${r.id}),'advanced')`}" style="flex:1;padding:6px;border-radius:7px;border:1px solid;font-size:11px;font-weight:600;cursor:pointer;background:${'advanced'===mode?'rgba(79,168,208,.15)':'transparent'};color:${'advanced'===mode?'#4fa8d0':'rgba(255,255,255,.35)'};border-color:${'advanced'===mode?'rgba(79,168,208,.5)':'rgba(255,255,255,.1)'};">📍 고도화 타임라인</button>
      ${isExternal()?'':`<button onclick="${_isBoard?`_boardOpenDetail(${r.id},'write')`:`renderTimeline(getRes(${r.id}),'write')`}" style="flex:1;padding:6px;border-radius:7px;border:1px solid;font-size:11px;font-weight:600;cursor:pointer;background:${'write'===mode?'rgba(79,168,208,.15)':'transparent'};color:${'write'===mode?'#4fa8d0':'rgba(255,255,255,.35)'};border-color:${'write'===mode?'rgba(79,168,208,.5)':'rgba(255,255,255,.1)'};">📄 보고서</button>`}
    </div>
  </div>`;

  if(mode==='advanced'){
    _initTlTeams(r);
    w.innerHTML=tabHdr+`
      <!-- 다목적위치표지판 미니맵 (팀 생성 후 표시) -->
      <div id="tlMiniMapWrap" style="display:${_tlTeams.some(t=>t.wps.some(w=>w.lat&&w.lng))?'block':'none'};background:#0b1c30;border-radius:10px;border:.5px solid rgba(79,168,208,.15);margin-bottom:10px;overflow:hidden;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px 5px;">
          <div style="font-size:11px;color:#4fa8d0;font-weight:700;">🗺️ 경로 진행</div>
          <div id="tlMiniMapProg" style="font-size:11px;color:#7a9cb8;"></div>
        </div>
        <div id="tlMiniMap" style="width:100%;height:150px;"></div>
      </div>
      <!-- GPS 자동 통과 (상단 공유 버튼) -->
      <div style="display:flex;gap:6px;margin-bottom:8px;">
        <button id="gpsAutoBtn" onclick="toggleGpsAuto()" style="flex:1;padding:8px 10px;border-radius:9px;border:1px solid ${_gpsAutoOn?'rgba(39,174,96,.45)':'rgba(255,255,255,.12)'};background:${_gpsAutoOn?'rgba(39,174,96,.12)':'transparent'};color:${_gpsAutoOn?'#27ae60':'rgba(255,255,255,.45)'};font-size:12px;font-weight:700;cursor:pointer;">📡 GPS 자동통과 ${_gpsAutoOn?'켜짐 ●':'꺼짐'}</button>
        <button onclick="openTimetable()" style="flex:1;padding:8px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.1);background:transparent;color:rgba(255,255,255,.45);font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;">📌 조우·특이사항 기록</button>
      </div>
      <!-- 팀별 경로 카드 -->
      <div id="tlAllTeams">
        ${_tlTeams.map((t,i)=>_tlTeamFullHtml(t,i)).join('')}
      </div>
      <!-- 전 팀 완료 배너 -->
      <div id="tlAllDoneBanner" style="display:${(_tlTeams.length>0&&_tlTeams.every(t=>_teamDone(t)))?'':'none'};background:rgba(39,174,96,.12);border:1.5px solid rgba(39,174,96,.45);border-radius:12px;padding:14px 16px;margin-bottom:10px;text-align:center;">
        <div style="font-size:13px;font-weight:800;color:#27ae60;margin-bottom:6px;">🏁 전 팀 하산/이송 완료</div>
        <div style="font-size:11px;color:rgba(255,255,255,.45);margin-bottom:10px;">상황을 종료하시겠습니까?</div>
        <button onclick="selResId=${r.id};curResId=${r.id};endSit();" style="background:rgba(39,174,96,.2);border:1px solid rgba(39,174,96,.55);color:#27ae60;border-radius:8px;padding:8px 0;font-size:12px;font-weight:700;cursor:pointer;width:100%;">✅ 상황 종료</button>
      </div>
      <!-- 팀 생성 영역 -->
      <div id="tlBuildArea">
        ${_tlBuilding?_renderBuildPanelHtml():_renderCreateBtnsHtml()}
      </div>
      ${_scenePhotosHtml(r)}
      ${_buildLogHtml(r)}
      <div style="background:#0b1c30;border-radius:10px;padding:11px 12px;border:.5px solid rgba(79,168,208,.12);margin-top:8px;">
        <div style="font-size:11px;color:#4fa8d0;font-weight:700;margin-bottom:8px;">💬 댓글</div>
        <div id="commentList_adv_${r.id}">${renderComments(r.id)}</div>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <input type="text" id="cmtInput_adv_${r.id}" class="fi" placeholder="댓글 입력..." style="flex:1;">
          <button onclick="submitComment(${r.id},'adv')" style="background:#1a4a6e;color:#fff;border:none;padding:0 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;">등록</button>
        </div>
      </div>
      `;
    if(_tlTeams.some(t=>t.wps.some(w=>w.lat&&w.lng)))setTimeout(()=>_initTlMiniMap((_tlTeams.find(t=>t.wps.some(w=>w.lat&&w.lng))||{wps:[]}).wps),150);
  } else {
    // 통합 보고서 mode — 추가보고(N보)의 최신 정보를 병합해 '다 뜨게'(reports·date·작성자 등 메타는 보존)
    r=_mergedRescue(r);
    const _ok=v=>{if(!v&&v!==0)return false;const s=String(v).trim();return s&&s!=='-'&&!['미상','없음','모르겠음','알수없음','미정','해당없음','기타'].includes(s);};
    const _okA=v=>(Array.isArray(v)?v:[]).filter(x=>_ok(x));
    const _row=(k,v)=>v?`<div style="display:flex;gap:8px;padding:5px 0;border-bottom:.5px solid rgba(255,255,255,.04);align-items:flex-start;"><span style="font-size:11px;color:#4a7090;font-weight:600;flex-shrink:0;min-width:46px;">${k}</span><span style="font-size:11px;color:#b8d4e8;line-height:1.55;flex:1;">${v}</span></div>`:'';
    // ── 우선순위: ① 부상 ② 위치 ③ 인적사항 ④ 나머지 ⑤ 추가내용 ──
    const _injList=(Array.isArray(r.injuries)?r.injuries:[]).filter(i=>i&&(i.part||i.type));
    const _injMain=_injList.length
      ? _injList.map(i=>((i.side&&i.side!=='해당없음'?i.side+' ':'')+(i.part||'')+' '+(i.type||'')).trim()).filter(Boolean).join(', ')
      : (()=>{const ip=_okA(r.injuryParts),it=_okA(r.injuryTypes);return (ip.join(', ')+(it.length?' / '+it.join(', '):'')).trim();})();
    const _vit0=(r.vitals&&_vitalsStr(r.vitals))?_vitalsStr(r.vitals):'';
    const injurySect=`<div style="font-size:10px;color:#ff8a73;font-weight:800;letter-spacing:.5px;margin-bottom:4px;">🤕 부상 정도 (가장 중요)</div>
      <div style="font-size:17px;font-weight:800;color:#ffd9d0;line-height:1.4;">${_injMain||'<span style="color:#9c7a72;font-weight:600;font-size:13px;">부상 정보 미입력</span>'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px;">
        ${_ok(r.severity)?`<span style="font-size:11px;font-weight:800;color:#fff;background:#c0392b;border-radius:6px;padding:2px 8px;">${_esc(r.severity)}</span>`:''}
        ${_ok(r.outcome)?`<span style="font-size:11px;color:#cfe2f2;background:rgba(255,255,255,.06);border-radius:6px;padding:2px 8px;">결과: ${_esc(r.outcome)}</span>`:''}
      </div>
      ${_vit0?`<div style="font-size:10px;color:#9bbdd4;margin-top:6px;">활력: ${_vit0}</div>`:''}`;
    const _div='<div style="height:1px;background:rgba(255,255,255,.06);margin:9px 0;"></div>';
    const locSect=_ok(r.location)?`<div style="font-size:12px;color:#cfe2f2;line-height:1.5;">📍 ${_esc(r.location)}${_ok(r.loctype)?` <span style="color:#7a9cb8;font-size:10px;">· ${_esc(r.loctype)}</span>`:''}</div>`:'';
    const _vAge=_ok(r.vBirth)?_ageFromBirth(r.vBirth)+'세':(_ok(r.vAge)?_esc(r.vAge)+'세':'');
    const _vLine=[_ok(r.vName)?_esc(r.vName):'미상',_vAge,_ok(r.vGender)&&r.vGender!=='알수없음'?_esc(r.vGender):'',_ok(r.vNation)&&r.vNation==='외국인'?'외국인':'',_ok(r.vTel)?_esc(r.vTel):''].filter(Boolean).join(' · ');
    let personSect=`<div style="display:flex;align-items:center;flex-wrap:wrap;gap:5px;"><span style="font-size:10px;color:#4a7090;font-weight:700;min-width:40px;">사고자</span><span style="font-size:12px;color:#e0edf8;font-weight:600;">${_vLine}</span>${_ok(r.vTel)?_telBtnsHtml(r.vTel):''}${(r.victims2&&r.victims2.length)?`<span style="font-size:10px;color:#e9897e;font-weight:700;">외 ${r.victims2.length}명</span>`:''}</div>`;
    if(r.victims2&&r.victims2.length)personSect+=`<div style="font-size:11px;color:#b8d4e8;margin-top:4px;">${r.victims2.map(v=>[_esc(v.name||'미상'),v.age?_esc(v.age)+'세':'',v.gender&&v.gender!=='알수없음'?_esc(v.gender):''].filter(Boolean).join(' ')).join(', ')}</div>`;
    if(_ok(r.repName)||_ok(r.repTel))personSect+=`<div style="display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-top:6px;"><span style="font-size:10px;color:#4a7090;font-weight:700;min-width:40px;">신고자</span><span style="font-size:12px;color:#cfe2f2;">${[_ok(r.repName)?_esc(r.repName):'',_ok(r.repTel)?_esc(r.repTel):''].filter(Boolean).join(' · ')}</span>${_ok(r.repTel)?_telBtnsHtml(r.repTel):''}</div>`;
    const recvSect=_ok(r.reception)?`<div><span style="font-size:10px;color:#4a7090;font-weight:700;">📝 접수내용</span><div style="font-size:12px;color:#cfe2f2;line-height:1.55;margin-top:2px;">${_esc(r.reception)}</div></div>`:'';
    // 나머지(컴팩트)
    const rows=[];
    const dparts=[_ok(r.date)?r.date:'',_ok(r.dispatch)?'신고 '+r.dispatch:'',_ok(r.arrival)?'출동 '+r.arrival:''].filter(Boolean);
    if(dparts.length)rows.push(_row('일시',dparts.join(' · ')));
    const wx=[_ok(r.weather)?_esc(r.weather):'',(r.initTemp!=null&&r.initTemp!=='')?_esc(r.initTemp)+'°C':'',_ok(r.weatherAlert)?_esc(r.weatherAlert):''].filter(Boolean).join(' · ');
    if(wx)rows.push(_row('기상',wx));
    const rm=_okA(r.rescueMethod);if(rm.length)rows.push(_row('구조',rm.join(', ')));
    const mob=_okA(r.mobilize);if(mob.length)rows.push(_row('응소',mob.join(', ')));
    if(_ok(r.cause))rows.push(_row('원인',_esc(r.cause)));
    if(_ok(r.alcohol)&&r.alcohol!=='알수없음')rows.push(_row('음주',_esc(r.alcohol)+(_ok(r.alcAmount)?' · '+_esc(r.alcAmount):'')));
    if(_ok(r.situation))rows.push(_row('경위',_esc(r.situation)));
    if(r.handover&&r.handover.to)rows.push(_row('인계',_esc(r.handover.to)+(r.handover.time?' · '+r.handover.time.slice(11):'')+(r.handover.by?' ('+_esc(r.handover.by)+')':'')));
    if(_ok(r.extra))rows.push(_row('특이',_esc(r.extra)));
    {const vseq=[];if(r.vitals&&_vitalsStr(r.vitals))vseq.push(r.vitals);(r.reports||[]).forEach(p=>{if(p.vitals&&_vitalsStr(p.vitals))vseq.push(p.vitals);});
     if(vseq.length>1){const vhtml=vseq.map(v=>`<div style="font-size:10px;color:#9bbdd4;line-height:1.6;"><span style="color:#4a7090;">${(v.at||'').slice(5,16)||'-'}</span> ${_vitalsStr(v)}</div>`).join('');rows.push(_row('활력추이',vhtml));}}
    // 추가내용 (1차/2차…) — 있을 때만 칸 생성
    const updates=(r.reports||[]).map((p,i)=>({p,ci:i+1})).filter(({p})=>p.update||(p.victimChange&&p.victimChange!=='변화없음')||p.addMem||p.extra);
    const updHtml=updates.length?`<div style="background:#0b1c30;border-radius:10px;padding:11px 12px;border:.5px solid rgba(79,168,208,.14);margin-bottom:8px;"><div style="font-size:10px;color:#4fa8d0;font-weight:800;margin-bottom:5px;">📌 추가 내용</div>${updates.map(({p,ci})=>{const pts=[];if(p.update)pts.push(_esc(p.update));if(p.victimChange&&p.victimChange!=='변화없음')pts.push('부상자 '+_esc(p.victimChange));if(p.addMem)pts.push('추가대원 '+_esc(p.addMem));if(p.extra)pts.push(_esc(p.extra));return `<div style="padding:6px 0;border-bottom:.5px solid rgba(255,255,255,.05);"><div style="font-size:11px;color:#7dd3fa;font-weight:700;">${ci}차 추가내용 <span style="color:#5a7e98;font-weight:400;font-size:9px;">${p.repTime||''}${p.author?' · '+_esc(p.author):''}</span></div><div style="font-size:11px;color:#b8d4e8;line-height:1.5;margin-top:2px;">${pts.join(' / ')}</div></div>`;}).join('')}</div>`:'';
    // 변경 이력 — 추가보고에서 정형 항목이 바뀐 내역(최신값은 위에 떴고, 여기엔 '무엇이 어떻게 바뀌었는지')
    const changeLog=[];(r.reports||[]).forEach((p,i)=>{(p.changes||[]).forEach(c=>changeLog.push({ci:i+1,at:p.repTime,by:p.author,...c}));});
    const changeHtml=changeLog.length?`<div style="background:#0b1c30;border-radius:10px;padding:11px 12px;border:.5px solid rgba(230,126,34,.2);margin-bottom:8px;"><div style="font-size:10px;color:#e8943a;font-weight:800;margin-bottom:5px;">🔄 변경 이력</div>${changeLog.map(c=>`<div style="font-size:11px;color:#b8d4e8;line-height:1.6;padding:3px 0;border-bottom:.5px solid rgba(255,255,255,.04);"><span style="color:#7dd3fa;font-weight:700;">${c.ci}차</span> ${_esc(c.label)}: <span style="color:#9c8060;">${_esc(c.from)}</span> → <b style="color:#e0edf8;">${_esc(c.to)}</b> <span style="color:#5a7e98;font-size:9px;">${c.at||''}${c.by?' · '+_esc(c.by):''}</span></div>`).join('')}</div>`:'';
    const logHtml=_buildLogHtml(r);
    // 한 장 보고서처럼 하나의 카드에 우선순위대로 쭉: 부상 → 위치 → 인적 → 신고자 → 접수내용 → 나머지
    const reportSheet=`<div style="background:#0b1c30;border:1px solid rgba(231,76,60,.18);border-radius:12px;padding:13px 14px;margin-bottom:9px;">
      ${injurySect}
      ${locSect?_div+locSect:''}
      ${_div}${personSect}
      ${recvSect?_div+recvSect:''}
      ${rows.length?_div+rows.join(''):''}
      <div style="text-align:right;font-size:9px;color:#3a5a6a;margin-top:9px;">📝 최초접수 ${r.date||''}${r.author?' · 작성 '+_esc(r.author):''}</div>
    </div>`;
    w.innerHTML=tabHdr+`
      ${reportSheet}
      ${updHtml}
      ${changeHtml}
      ${_scenePhotosHtml(r)}

      <div style="background:#0b1c30;border-radius:10px;padding:12px;border:.5px solid rgba(255,255,255,.07);margin-top:10px;">
        <div style="font-size:11px;color:#4fa8d0;font-weight:700;margin-bottom:8px;">💬 댓글</div>
        <div id="commentList_${r.id}">${renderComments(r.id)}</div>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <input type="text" id="cmtInput_${r.id}" class="fi" placeholder="댓글 입력..." style="flex:1;">
          <button onclick="submitComment(${r.id})" style="background:#1a4a6e;color:#fff;border:none;padding:0 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;">등록</button>
        </div>
      </div>

      <div style="background:#0b1c30;border-radius:10px;padding:11px 12px;border:.5px solid rgba(79,168,208,.12);margin-top:8px;">
        <div style="font-size:11px;color:#4fa8d0;font-weight:700;margin-bottom:7px;">👥 출동 인원</div>
        ${(r.members&&r.members.length)?`<div style="font-size:11px;color:#b8d4e8;margin-bottom:4px;"><span style="color:#4a7090;font-weight:600;">초동팀:</span> ${_esc(r.members.join(', '))}</div>`:''}
        ${(r.teams&&r.teams.length)?r.teams.map(t=>{
          const ico=_teamIco(t);
          const si=_teamStageIdx(t);
          const stLbl=['출발','이동중','환자조우','하산'][si]||'';
          const mem=(t.members&&t.members.length)?': '+_esc(t.members.join(', ')):'';
          return `<div style="font-size:11px;color:#b8d4e8;margin-bottom:3px;"><span style="color:#7ec8a0;font-weight:600;">${ico} ${_esc(t.name)}</span>${mem} <span style="color:#7a9cb8;font-size:10px;">(${stLbl})</span></div>`;
        }).join(''):''}
        ${(!r.members||!r.members.length)&&(!r.teams||!r.teams.length)?'<div style="font-size:11px;color:rgba(255,255,255,.3);">미기재 — 타임라인에서 팀을 생성하면 자동 표시됩니다</div>':''}
        ${(r.extraTeams&&r.extraTeams.length)?r.extraTeams.map(t=>`<div style="font-size:11px;color:#b8d4e8;margin-bottom:3px;"><span style="color:#7ec8a0;font-weight:600;">${_esc(t.teamName)}:</span> ${_esc((t.members||[]).join(', '))}</div>`).join(''):''}
        ${(r.agencies)?(()=>{
          const ag=r.agencies;const parts=[];
          if(ag.hwandongha)parts.push(`🚒 ${(DB.g('extAgencyDisplayName')||'환동해 특수대응단').split(' ')[0]} ${ag.hwTeam||'?'}팀`);
          if(ag.fireAgencies&&ag.fireAgencies.length)ag.fireAgencies.forEach(a=>parts.push(`🚒 ${_esc(a.name)}`));
          if(ag.police)parts.push('🚔 경찰');
          if(ag.forestry)parts.push('🌲 산림청');
          if(ag.other)parts.push(_esc(ag.other));
          if(ag.agenciesNote)parts.push(`(${_esc(ag.agenciesNote)})`);
          return parts.length?`<div style="font-size:11px;color:#b8d4e8;margin-top:2px;"><span style="color:#4a7090;">유관기관:</span> ${parts.join(' · ')}</div>`:'';
        })():''}
      </div>
      ${_mobilizeBlockHtml('rescues',r)}
      ${logHtml?`<div style="margin-top:10px;"><div style="font-size:10px;color:#5a7e98;font-weight:700;margin:0 2px 4px;">🕘 상황일지</div>${logHtml}</div>`:''}`;
  }
  // sticky footer
  const _ftEl=document.getElementById(_isBoard?'boardDetailFooter':'rep1BoFooter');
  if(_ftEl){
    if(r.status==='ongoing'){
      _ftEl.style.display='block';
      if(mode==='write'&&!isExternal()){
        const _histBtn=all.length>1?`<button onclick="showPrevHistModal(${r.id})" style="display:block;width:100%;padding:6px 10px;border-radius:7px;border:.5px solid rgba(79,168,208,.25);background:rgba(79,168,208,.07);color:#4a8aaa;font-size:11px;font-weight:600;cursor:pointer;margin-bottom:6px;text-align:left;">📋 이전 이력 보기 (${all.length-1}건)</button>`:'';
        _ftEl.innerHTML=_histBtn+`<div style="display:flex;gap:7px;"><button class="btn-submit" style="flex:2;background:#1a4a6e;color:#fff;" onclick="selResId=${r.id};curResId=${r.id};addPhase();">📝 내용 추가</button><button class="btn-submit" style="flex:1;background:#0d5040;color:#fff;" onclick="selResId=${r.id};curResId=${r.id};endSit();">✅ 상황 종료</button></div>`
          +`<button onclick="openNpsResponse(${r.id})" style="margin-top:6px;width:100%;background:rgba(0,120,60,.18);color:#7ec8a0;border:1px solid rgba(0,120,60,.3);border-radius:9px;padding:9px;font-size:12px;font-weight:600;cursor:pointer;">🏕️ 공단 응소 기록</button>`;
      } else if(!isExternal()){
        _ftEl.innerHTML=`<button class="btn-submit" style="width:100%;background:#0d5040;color:#fff;" onclick="selResId=${r.id};curResId=${r.id};endSit();">✅ 상황 종료</button>`
          +`<button onclick="openNpsResponse(${r.id})" style="margin-top:6px;width:100%;background:rgba(0,120,60,.18);color:#7ec8a0;border:1px solid rgba(0,120,60,.3);border-radius:9px;padding:9px;font-size:12px;font-weight:600;cursor:pointer;">🏕️ 공단 응소 기록</button>`;
      }
    } else {
      _ftEl.style.display='block';
      _ftEl.innerHTML='<div style="text-align:center;font-size:12px;color:#27ae60;padding:8px;">✅ 상황 종료됨</div>';
    }
  }
}
function showPrevHistModal(id){
  const res=DB.g('rescues')||[];
  const r=res.find(x=>x.id===id);
  if(!r)return;
  const all=[r,...(r.reports||[])];
  if(all.length<=1){toast('이전 이력 없음');return;}
  let ov=document.getElementById('prevHistOv');
  if(!ov){ov=document.createElement('div');ov.id='prevHistOv';document.body.appendChild(ov);}
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:flex-end;';
  const rows=all.slice(0,-1).reverse().map((p,ri)=>{
    const origIdx=all.length-2-ri;
    const label=origIdx===0?`1보 · ${r.date||'-'}`:`${origIdx+1}보 · ${p.repTime||'-'}`;
    const author=origIdx===0?r.author||'-':p.author||'-';
    const body=origIdx===0?[r.location,r.situation,r.extra].filter(Boolean).join(' · '):(p.update||'');
    return `<div style="padding:9px 14px;border-bottom:.5px solid rgba(255,255,255,.06);">
      <div style="font-size:10px;color:#4fa8d0;font-weight:700;margin-bottom:3px;">${label} · ${_esc(author)}</div>
      ${body?`<div style="font-size:11px;color:#b8d4e8;line-height:1.5;">${_esc(body)}</div>`:''}
    </div>`;
  }).join('');
  ov.innerHTML=`<div style="background:#040a16;border-radius:14px 14px 0 0;width:100%;max-height:70vh;max-height:70dvh;overflow:hidden;display:flex;flex-direction:column;border-top:.5px solid rgba(79,168,208,.25);">
    <div style="padding:14px 16px 10px;display:flex;align-items:center;justify-content:space-between;border-bottom:.5px solid rgba(255,255,255,.07);flex-shrink:0;">
      <span style="font-size:13px;font-weight:700;color:#e0edf8;">📋 이전 이력 (${all.length-1}건)</span>
      <button onclick="document.getElementById('prevHistOv').style.display='none'" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:20px;cursor:pointer;padding:0 4px;line-height:1;">×</button>
    </div>
    <div style="overflow-y:auto;flex:1;">${rows}</div>
  </div>`;
  ov.onclick=e=>{if(e.target===ov)ov.style.display='none';};
}
function getRes(id){return (DB.g('rescues')||[]).find(r=>r.id===id)||{};}

// ── 현장 사진 갤러리: 구조 건에 사진 여러 장 추가/열람 ──
function _scenePhotosHtml(r){
  const pics=[];
  if(r.injuryPhoto)pics.push({url:r.injuryPhoto,label:'부상'});
  if(r.transPhoto)pics.push({url:r.transPhoto,label:'이송'});
  (r.photos||[]).forEach(p=>pics.push({url:p.url,label:(p.time||'').slice(11,16)}));
  return `<div style="background:#0b1c30;border-radius:10px;padding:11px 12px;border:.5px solid rgba(255,255,255,.07);margin-top:8px;">
    <div style="font-size:11px;color:#4fa8d0;font-weight:700;margin-bottom:7px;">📷 현장 사진 <span style="color:rgba(255,255,255,.3);font-weight:400;">${pics.length}장</span></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
      ${pics.map(p=>`<div onclick="openLightbox('${p.url}')" style="aspect-ratio:1;border-radius:8px;overflow:hidden;cursor:pointer;position:relative;background:#060d1a;">
        <img src="${p.url}" style="width:100%;height:100%;object-fit:cover;" loading="lazy">
        ${p.label?`<span style="position:absolute;bottom:2px;left:4px;font-size:8px;color:#fff;text-shadow:0 1px 2px #000;">${p.label}</span>`:''}
      </div>`).join('')}
      <div onclick="addScenePhotos(${r.id})" style="aspect-ratio:1;border-radius:8px;border:1.5px dashed rgba(79,168,208,.35);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;color:#4fa8d0;gap:2px;">
        <span style="font-size:17px;line-height:1;">＋</span><span style="font-size:8px;">사진 추가</span>
      </div>
    </div>
  </div>`;
}
function addScenePhotos(resId){
  const inp=document.createElement('input');
  inp.type='file';inp.accept='image/*';inp.multiple=true;
  inp.onchange=async()=>{
    const files=[...(inp.files||[])];
    if(!files.length)return;
    const u0=DB.g('currentUser')||{};
    if(!navigator.onLine){
      for(const f of files){
        const c=await _compressImage(f);
        const qItem={id:Date.now()+'_sc'+Math.random().toString(36).slice(2,6),file:c,pid:'',dest:{key:'rescues',id:resId,field:'photos',append:true,by:u0.name||''}};
        _offlinePhotoQueue.push(qItem);_photoQPut(qItem);
      }
      toast('📵 오프라인 — 사진 '+files.length+'장 대기, 연결되면 자동 업로드');
      return;
    }
    toast('⬆️ 사진 '+files.length+'장 업로드 중...');
    const u=DB.g('currentUser')||{};
    let ok=0;
    for(const f of files){
      try{
        const c=await _compressImage(f);
        const url=await uploadImageToStorage(c,'photos/scene_'+resId);
        const res=DB.g('rescues')||[];const ri=res.findIndex(x=>x.id===resId);
        if(ri<0)break;
        if(!res[ri].photos)res[ri].photos=[];
        res[ri].photos.push({url,time:now(),by:u.name||''});
        DB.s('rescues',res);ok++;
      }catch(e){}
    }
    toast(ok?('✅ 사진 '+ok+'장 추가'):'⚠️ 업로드 실패');
    try{const r=getRes(resId);if(r&&r.id)renderTimeline(r,_tlViewMode==='write'?'write':'advanced');}catch(e){}
  };
  inp.click();
}
function openLightbox(url){
  let lb=document.getElementById('photoLightbox');
  if(!lb){
    lb=document.createElement('div');lb.id='photoLightbox';
    lb.style.cssText='position:fixed;inset:0;z-index:99;background:rgba(0,0,0,.93);display:flex;align-items:center;justify-content:center;padding:18px;';
    lb.onclick=()=>{lb.style.display='none';};
    lb.innerHTML='<img id="lightboxImg" style="max-width:100%;max-height:100%;border-radius:10px;object-fit:contain;">';
    document.body.appendChild(lb);
  }
  document.getElementById('lightboxImg').src=url;
  lb.style.display='flex';
}
function submitComment(resId,variant){
  const prefix=variant==='adv'?'cmtInput_adv_':'cmtInput_';
  const inp=document.getElementById(prefix+resId);if(!inp)return;
  const text=inp.value.trim();if(!text){toast('⚠️ 댓글을 입력하세요');return;}
  inp.value=''; // 즉시 비워 이중 탭 중복 등록 방지
  const res=DB.g('rescues')||[];const ri=res.findIndex(x=>x.id===resId);
  if(ri<0){toast('⚠️ 구조 정보 없음');return;}
  if(!res[ri].comments)res[ri].comments=[];
  // 구버전(이 기기에만 저장된) 댓글을 레코드로 1회 이관
  (DB.g('comments_'+resId)||[]).forEach(c=>{
    if(!res[ri].comments.some(x=>x.id===c.id))res[ri].comments.push(c);
  });
  try{localStorage.removeItem('v7_comments_'+resId);}catch(e){}
  const u=DB.g('currentUser')||{};
  res[ri].comments.push({id:Date.now()+Math.random(),author:u.name||'익명',time:now(),text});
  res[ri].comments.sort((a,b)=>(a.id||0)-(b.id||0));
  DB.s('rescues',res);
  const cmts=res[ri].comments;
  inp.value='';
  const cmtHtml=cmts.map(cm=>`<div style="background:#060d1a;border-radius:7px;padding:8px 10px;margin-bottom:5px;"><div style="font-size:11px;color:#4fa8d0;font-weight:600;">${_esc(cm.author)} · ${cm.time}</div><div style="font-size:12px;color:#b8d4e8;margin-top:3px;line-height:1.5;">${_esc(cm.text)}</div></div>`).join('');
  // 댓글 목록 갱신 (두 위치 모두)
  const listEl=document.getElementById('commentList_'+resId);if(listEl)listEl.innerHTML=cmtHtml;
  const listElAdv=document.getElementById('commentList_adv_'+resId);if(listElAdv)listElAdv.innerHTML=cmtHtml;
  toast('💬 댓글 등록');
  pushNoti(`💬 댓글: ${text.slice(0,20)}...`,'💬','rescue_update',{app:'rescue',tab:2,id:resId});
}

// ══ AI 출동지령서 스캔 (Gemini) ══
async function aiScanDispatch(input){
  const file=input.files&&input.files[0];
  if(!file)return;
  const apiKey=(DB.g('geminiApiKey')||'').trim();
  const spinner=document.getElementById('aiScanSpinner');
  const statusEl=document.getElementById('aiScanStatus');
  if(!apiKey){
    if(statusEl){statusEl.style.display='block';statusEl.textContent='⚠️ Gemini API 키가 설정되지 않았습니다. 관리자 > 시스템에서 입력하세요.';}
    input.value='';return;
  }
  // base64 변환
  const b64=await new Promise(res=>{
    const r=new FileReader();
    r.onload=e=>res(String(e.target.result||'').split(',')[1]||'');
    r.onerror=()=>res('');
    r.readAsDataURL(file);
  });
  if(!b64){if(statusEl){statusEl.style.display='block';statusEl.textContent='⚠️ 이미지를 읽지 못했습니다. 다른 사진으로 시도하세요.';}input.value='';return;}
  if(spinner)spinner.style.display='block';
  if(statusEl){statusEl.style.display='block';statusEl.textContent='🤖 AI가 출동지령서를 분석중입니다...';}
  const prompt=`이 출동지령서(산악구조 신고/출동 문서) 이미지에서 아래 항목을 추출하여 반드시 JSON 형식으로만 응답하세요. 코드블록 없이 JSON만 출력하세요. 없는 항목은 null로 표시하세요.
{
  "date": "사고 발생 또는 신고 접수 일시 (YYYY-MM-DDTHH:MM 형식, 연도 없으면 올해 기준)",
  "dispatch": "신고 접수 시각 (HH:MM)",
  "arrival": "공단 출동 또는 현장 도착 시각 (HH:MM)",
  "location": "사고 발생 장소 (표지판 번호 포함, 예: 12-03 부근)",
  "loctype": "장소 구분 — 법정탐방로/비법정탐방로/암벽/빙벽 중 하나만",
  "type": "사고 유형 — 실족추락/심장마비/탈진/길잃음/뇌졸중/기타 중 가장 가까운 것",
  "vName": "사고자(피해자) 이름",
  "vBirth": "사고자 생년월일 (YYYY-MM-DD, 나이만 있으면 추정 생년 계산)",
  "vGender": "성별 (남/여/알수없음)",
  "vTel": "사고자 또는 신고자 연락처",
  "severity": "중증도 (경증/중증/중경증/사망/알수없음)",
  "situation": "사고 경위 및 상황 요약 (2-3문장)",
  "reception": "최초 신고 내용 요약",
  "weather": "기상 정보 (있으면)"
}`;
  try{
    const resp=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({
        contents:[{parts:[
          {inline_data:{mime_type:file.type,data:b64}},
          {text:prompt}
        ]}],
        generationConfig:{responseMimeType:'application/json'}
      })
    });
    if(!resp.ok){const err=await resp.json().catch(()=>({}));throw new Error(err.error?.message||resp.status);}
    const data=await resp.json();
    const raw=(data.candidates?.[0]?.content?.parts?.[0]?.text)||'';
    let parsed;
    try{parsed=JSON.parse(raw.replace(/```json|```/g,'').trim());}
    catch(e){throw new Error('JSON 파싱 실패: '+raw.slice(0,80));}
    _applyAiScanResult(parsed);
    const filled=Object.values(parsed).filter(v=>v!==null).length;
    if(statusEl)statusEl.textContent=`✅ ${filled}개 항목 자동 입력 완료 — 확인 후 저장하세요`;
  }catch(e){
    if(statusEl)statusEl.textContent='❌ 오류: '+e.message;
    toast('❌ AI 스캔 실패: '+e.message);
  }finally{
    if(spinner)spinner.style.display='none';
    input.value='';
  }
}
function _applyAiScanResult(d){
  const _set=(id,v)=>{if(v===null||v===undefined)return;const el=document.getElementById(id);if(el){el.value=v;el.dispatchEvent(new Event('input'));}};
  if(d.date)_set('r_date',d.date.slice(0,16));
  if(d.dispatch)_set('r_disp',d.dispatch);
  if(d.arrival)_set('r_arrival',d.arrival);
  if(d.location){_set('r_loc',d.location);}
  if(d.loctype&&['법정탐방로','비법정탐방로','암벽','빙벽'].includes(d.loctype)){
    selLoctype(d.loctype);
    const hi=document.getElementById('r_loctype');if(hi)hi.value=d.loctype;
  }
  if(d.type){
    const tEl=document.getElementById('r_type');if(tEl)tEl.value=d.type;
  }
  if(d.vName)_set('r_vName',d.vName);
  if(d.vBirth)_set('r_vBirth',d.vBirth);
  if(d.vGender&&d.vGender!=='알수없음'){
    document.querySelectorAll('#genderPills .pill').forEach(p=>{if(p.textContent.trim()===d.vGender)p.click();});
  }
  if(d.vTel)_set('r_vTel',d.vTel);
  if(d.severity){
    const sEl=document.getElementById('r_severity');if(sEl)sEl.value=d.severity;
  }
  if(d.situation)_set('r_situation',d.situation);
  if(d.reception)_set('r_reception',d.reception);
  if(d.weather)_set('r_weather',d.weather);
  try{autoGenTitle();}catch(e){}
  toast('📋 출동지령서 자동 입력됨');
}
function openNpsResponse(resId){
  var txt=prompt('공단 응소 내용을 입력하세요:','공단에서 응소를 실시하고 있어요');
  if(txt===null)return;
  txt=(txt||'').trim();
  if(!txt){toast('⚠️ 내용을 입력하세요');return;}
  submitNpsResponse(resId,txt);
}
function submitNpsResponse(resId,text){
  const res=DB.g('rescues')||[];
  const idx=res.findIndex(x=>x.id===resId);
  if(idx===-1){toast('⚠️ 사고 정보 없음');return;}
  if(!res[idx].npsLog)res[idx].npsLog=[];
  const author=getAuthor();
  res[idx].npsLog.push({time:new Date().toISOString(),author,text});
  DB.s('rescues',res);
  toast('🏕️ 공단 응소 기록됨');
  if(document.getElementById('v-report').classList.contains('on')){
    renderTimeline(res[idx],_tlViewMode||'brief');
  }
  if(_boardDetailId===resId){
    const bd=document.getElementById('boardDetail');
    if(bd&&bd.style.display!=='none')renderTimeline(res[idx],_tlViewMode||'advanced','boardDetailContent');
  }
}
// ── 구조 보고서 텍스트/공유/인쇄 ────────────────────
// 활력징후 스테퍼: 빈값이면 예시값으로 시작, 이후 ±step (음수 금지, max 제한)
function _vitStep(id,delta,example,step,max){
  const el=document.getElementById(id);if(!el)return;
  let v=parseFloat(el.value);
  if(isNaN(v))v=example;          // 첫 조작 → 예시값을 첫값으로
  else v=v+delta*step;
  if(v<0)v=0;
  if(max!=null&&v>max)v=max;
  el.value=step<1?(Math.round(v*10)/10).toFixed(1):String(Math.round(v));
}
// 직접 입력 시 음수·초과 방지
function _vitClamp(el,max){
  if(el.value===''||el.value==='-')return;
  let v=parseFloat(el.value);
  if(isNaN(v))return;
  if(v<0)el.value='0';
  else if(max!=null&&v>max)el.value=String(max);
}
// Enter(모바일 '다음') → 다음 활력징후 입력으로 포커스 이동
function _vitNext(e){
  if(e.key!=='Enter')return;
  e.preventDefault();
  const inputs=[...document.querySelectorAll('.vit-input')];
  const i=inputs.indexOf(e.target);
  if(i>=0&&i<inputs.length-1)inputs[i+1].focus();
  else e.target.blur();
}
// 음주 의심·확인됨 → 음주량 입력란 표시
function _toggleAlcAmount(){
  const a=document.getElementById('r_alc')?.value;
  const w=document.getElementById('alcAmountWrap');
  if(w)w.style.display=(a&&a!=='없음')?'block':'none';
}
// 활력징후 수집 — 하나라도 입력됐을 때만 객체 반환(측정시각 포함)
function _collectVitals(){
  const g=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};
  const hr=g('r_hr'),spo2=g('r_spo2'),temp=g('r_temp'),avpu=g('r_avpu'),bp=g('r_bp');
  if(!hr&&!spo2&&!temp&&(!avpu||avpu==='선택')&&!bp)return null;
  return {hr,spo2,temp,avpu:avpu==='선택'?'':avpu,bp,at:now()};
}
function _vitalsStr(v){
  if(!v)return '';
  const p=[];
  if(v.hr)p.push('HR '+v.hr);
  if(v.bp)p.push('BP '+v.bp);
  if(v.spo2)p.push('SpO₂ '+v.spo2+'%');
  if(v.temp)p.push(v.temp+'℃');
  if(v.avpu)p.push(v.avpu);
  return p.join(' · ');
}
function _buildReportText(r){
  if(!r)return '';
  const _ok=v=>{if(!v&&v!==0)return false;const s=String(v).trim();return s&&s!=='-'&&!['미상','없음','모르겠음','알수없음','미정','해당없음'].includes(s);};
  const _okA=v=>(Array.isArray(v)?v:[]).filter(x=>_ok(x));
  const L=[];
  L.push('[ 설악산 구조 보고서 ]');
  L.push('제목: '+(r.title||'-'));
  L.push('유형: '+(r.type||'-')+' / '+(r.status==='ongoing'?'진행중':'종료'));
  if(_ok(r.date))L.push('일시: '+r.date);
  if(_ok(r.location))L.push('위치: '+r.location+(_ok(r.loctype)?' ('+r.loctype+')':''));
  if(_ok(r.lat)&&_ok(r.lng))L.push('좌표: '+(+r.lat).toFixed(5)+', '+(+r.lng).toFixed(5));
  const wx=[_ok(r.weather)?r.weather:'',_ok(r.weatherAlert)?r.weatherAlert:''].filter(Boolean).join(' ');
  if(wx)L.push('기상: '+wx);
  const vp=[_ok(r.vName)?r.vName:'',_ok(r.vBirth)?_ageFromBirth(r.vBirth)+'세':(_ok(r.vAge)?r.vAge+'세':''),_ok(r.vGender)&&r.vGender!=='알수없음'?r.vGender:'',_ok(r.vNation)&&r.vNation!=='알수없음'?r.vNation:''].filter(Boolean);
  if(vp.length)L.push('사고자: '+vp.join(' · ')+((r.victims2&&r.victims2.length)?' 외 '+r.victims2.length+'명':''));
  if(r.victims2&&r.victims2.length){r.victims2.forEach((v,i)=>L.push('  추가자'+(i+1)+': '+[v.name||'미상',v.gender&&v.gender!=='알수없음'?v.gender:'',v.age?v.age+'세':'',v.severity,v.note].filter(Boolean).join(' · ')));}
  if(_ok(r.vTel))L.push('연락처: '+r.vTel);
  if(_ok(r.severity))L.push('중증도: '+r.severity);
  {const vseq=[];if(r.vitals&&_vitalsStr(r.vitals))vseq.push(r.vitals);(r.reports||[]).forEach(p=>{if(p.vitals&&_vitalsStr(p.vitals))vseq.push(p.vitals);});
   if(vseq.length){L.push('활력징후:');vseq.forEach(v=>L.push('  · '+((v.at||'').slice(11)||'-')+' '+_vitalsStr(v)));}}
  const inj=_okA(r.injuryParts);if(inj.length)L.push('부상부위: '+inj.join(', '));
  if(_ok(r.cause))L.push('원인: '+r.cause);
  const rm=_okA(r.rescueMethod);if(rm.length)L.push('구조방법: '+rm.join(', '));
  const mob=_okA(r.mobilize);if(mob.length)L.push('응소: '+mob.join(', '));
  if(_ok(r.alcohol)&&r.alcohol!=='알수없음')L.push('음주: '+r.alcohol+(_ok(r.alcAmount)?' ('+r.alcAmount+')':''));
  if(_ok(r.situation))L.push('사고경위: '+r.situation);
  if(_ok(r.hospital)&&r.hospital!=='미정')L.push('이송: '+r.hospital);
  if(r.handover&&r.handover.to)L.push('인계: '+r.handover.to+(r.handover.time?' ('+r.handover.time+')':''));
  // 출동 인원
  const teamParts=[];
  if(r.members&&r.members.length)teamParts.push('초동팀 '+r.members.join(', '));
  (r.teams||[]).forEach(t=>{
    const _ops=[];
    if(t.transportMethod)_ops.push(t.transportMethod);
    teamParts.push(t.name+(t.members&&t.members.length?' ('+t.members.join(', ')+')':'')+(t.memberCount?' '+t.memberCount+'명':'')+(_ops.length?' ['+_ops.join(', ')+']':''));
  });
  (r.extraTeams||[]).forEach(t=>{teamParts.push(t.teamName+(t.members&&t.members.length?' ('+t.members.join(', ')+')':''));});
  if(teamParts.length)L.push('출동인원: '+teamParts.join(' / '));
  // 통합 타임라인 (타임테이블 + 위치통과 + 팀 출동/도착/탑승/이송전환 + CPR 상세)
  const baseDate=(r.date||'').slice(0,10);
  const _tKey=t=>{const s=String(t||'').trim();if(/^\d{4}-\d{2}-\d{2}/.test(s))return s;return baseDate+' '+s;};
  const _hm=t=>{const s=String(t||'').trim();return s.length>5?s.slice(11,16):s;};
  const tlAll=[];
  (r.timetable||[]).forEach(e=>{
    if(!e.time&&!e.stage)return;
    let extra='';
    if(e.stage==='심정지'){
      if(e.cprStart)extra+=' / CPR '+_hm(e.cprStart);
      if(e.cprEnd)extra+='→'+_hm(e.cprEnd);
      if(e.aed)extra+=' · AED '+e.aed;
    }
    tlAll.push({k:_tKey(e.time),disp:(_hm(e.time)||'시간미상')+' '+(e.stage||'')+(e.note?' — '+e.note:'')+extra});
  });
  (r.wpLog||[]).forEach(l=>tlAll.push({k:_tKey(l.time),disp:(l.time||'')+' '+(l.code||'?')+' 통과'+(l.teamName?' ('+l.teamName+')':'')}));
  (r.teams||[]).forEach(t=>{
    if(t.requestedAt||t.createdAt)tlAll.push({k:_tKey(t.requestedAt||t.createdAt),disp:_hm(t.requestedAt||t.createdAt)+' '+t.name+' 출동'+(t.members&&t.members.length?' ('+t.members.join(', ')+')':'')});
    if(t.arrivedAt)tlAll.push({k:_tKey(t.arrivedAt),disp:_hm(t.arrivedAt)+' '+t.name+' 현장도착'});
    if(t.boardedAt)tlAll.push({k:_tKey(t.boardedAt),disp:_hm(t.boardedAt)+' '+t.name+' 환자 탑승'});
    (t.transportLog||[]).forEach(tr=>tlAll.push({k:_tKey(tr.at),disp:_hm(tr.at)+' '+t.name+' 이송전환 '+tr.from+'→'+tr.to}));
  });
  if(r.handover&&r.handover.to)tlAll.push({k:_tKey(r.handover.time),disp:_hm(r.handover.time)+' 환자 인계 → '+r.handover.to+(r.handover.by?' ('+r.handover.by+')':'')});
  if(tlAll.length){
    L.push('');L.push('[ 타임라인 ]');
    tlAll.sort((a,b)=>String(a.k).localeCompare(String(b.k)));
    tlAll.forEach(e=>L.push('· '+e.disp));
  }
  // 추가 보고
  const ups=(r.reports||[]).filter(p=>p.update||p.extra);
  if(ups.length){
    L.push('');L.push('[ 추가 보고 ]');
    ups.forEach((p,i)=>{L.push('· '+(i+1)+'보 '+(p.repTime||'')+' '+(p.author?'('+p.author+')':'')+': '+(p.update||p.extra||''));});
  }
  if(_ok(r.extra))L.push('특이사항: '+r.extra);
  L.push('');L.push('작성자: '+(r.author||'-'));
  return L.join('\n');
}
function copyReportText(id){
  const r=getRes(id);const txt=_buildReportText(r);
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(()=>toast('📋 보고서가 복사되었습니다')).catch(()=>_fallbackCopy(txt));
  }else _fallbackCopy(txt);
}
function _fallbackCopy(txt){
  try{const ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);toast('📋 보고서가 복사되었습니다');}
  catch(e){toast('⚠️ 복사 실패 — 길게 눌러 복사하세요');}
}
function shareReportText(id){
  const r=getRes(id);const txt=_buildReportText(r);
  if(navigator.share){
    navigator.share({title:r.title||'구조 보고서',text:txt}).catch(()=>{});
  }else{copyReportText(id);toast('📋 공유 미지원 — 복사로 대체했습니다');}
}
function printReport(id){
  const r=getRes(id);const txt=_buildReportText(r);
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const win=window.open('','_blank');
  if(!win){toast('⚠️ 팝업 차단 — 인쇄 창을 열 수 없습니다');return;}
  win.document.write('<html><head><title>'+esc(r.title||'구조 보고서')+'</title>'
    +'<meta name="viewport" content="width=device-width,initial-scale=1">'
    +'<style>body{font-family:-apple-system,"Malgun Gothic",sans-serif;padding:24px;color:#111;line-height:1.7;font-size:13px;}'
    +'h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:8px;}pre{white-space:pre-wrap;word-break:break-word;font-family:inherit;}'
    +'@media print{button{display:none;}}</style></head><body>'
    +'<h1>🏔️ 설악산 구조 보고서</h1><pre>'+esc(txt)+'</pre>'
    +'<button onclick="window.print()" style="margin-top:16px;padding:10px 18px;font-size:14px;cursor:pointer;">🖨 인쇄 / PDF 저장</button>'
    +'</body></html>');
  win.document.close();
  setTimeout(()=>{try{win.focus();}catch(e){}},300);
}
function endSit(){
  const res=DB.g('rescues')||[];const idx=res.findIndex(x=>x.id===selResId);if(idx===-1)return;
  if(!confirm('상황을 종료 처리하겠습니까?'))return;
  res[idx].status='done';DB.s('rescues',res);
  pushNoti(`✅ 종료: ${res[idx].title}`,'✅','rescue_close',{app:'rescue',tab:2,id:res[idx].id});
  try{renderRescueMap();}catch(e){}try{renderResList();}catch(e){}closeDB();toast('✅ 상황 종료');updateSummary();
  // 타임라인 뷰에 있으면 갱신
  if(document.getElementById('v-report').classList.contains('on')){
    renderTimeline(res[idx],_tlViewMode||'brief');
  }
  // 상황판 상세 패널이 열려 있으면 갱신
  if(_boardDetailId===res[idx].id){
    const bd=document.getElementById('boardDetail');
    if(bd&&bd.style.display!=='none')renderTimeline(res[idx],_tlViewMode||'advanced','boardDetailContent');
  }
}

function submitNBo(){
  const res=DB.g('rescues')||[];const idx=res.findIndex(x=>x.id===curResId);if(idx===-1)return;
  if(!res[idx].reports)res[idx].reports=[];
  res[idx].reports.push({
    repTime:document.getElementById('r_repdt').value.replace('T',' '),
    update:document.getElementById('r_upd').value,
    victimChange:document.getElementById('r_vChg').value,
    addMem:document.getElementById('r_addMem').value,
    author:document.getElementById('r_repAuthor').value,
    extra:document.getElementById('r_repExtra')?.value||'',
  });
  DB.s('rescues',res);
  const phNum=res[idx].reports.length;
  renderPhaseBar(phNum,phNum+1);
  pushNoti(`📋 추가 보고: ${res[idx].title}`,'📋','rescue_update',{app:'rescue',tab:2,id:res[idx].id});
  closeM('modalAddPhase');toast('✅ 추가 보고 저장');
  // 타임라인 갱신
  renderTimeline(res[idx]);
}

// ══════════════════════════════════════════
// 1보 폼
// ══════════════════════════════════════════
// ── 구조 1보 폼: 자동 임시저장 + 작성중 이탈 경고 ──
window._reportMode='';        // 'form'(작성) | 'timeline'(타임라인 보기)
let _formDirty=false,_draftAutoTimer=null,_draftListenerBound=false;
const _DRAFT_KEY='_rescueDraft1bo';
function _snapshotRescueForm(){
  const w=document.getElementById('repContent');if(!w)return null;
  const fields={};
  w.querySelectorAll('input,textarea,select').forEach(el=>{
    if(!el.id||el.type==='file')return;
    if(el.type==='checkbox'||el.type==='radio')fields[el.id]={c:el.checked};
    else if(el.value!=='')fields[el.id]={v:el.value};
  });
  const pills=[];
  w.querySelectorAll('.pills').forEach(pc=>{
    if(!pc.id)return;
    pc.querySelectorAll('.pill.on').forEach(p=>pills.push(pc.id+'::'+p.textContent.trim()));
  });
  return {fields,pills,at:Date.now()};
}
function _restoreRescueForm(snap){
  if(!snap)return;
  const w=document.getElementById('repContent');if(!w)return;
  try{
    Object.entries(snap.fields||{}).forEach(([id,o])=>{
      const el=document.getElementById(id);if(!el)return;
      if(o.c!==undefined)el.checked=o.c;else if(o.v!==undefined){el.value=o.v;try{el.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){}}
    });
    (snap.pills||[]).forEach(key=>{
      const i=key.indexOf('::');if(i<0)return;
      const pid=key.slice(0,i),txt=key.slice(i+2);
      const pc=document.getElementById(pid);if(!pc)return;
      pc.querySelectorAll('.pill').forEach(p=>{if(p.textContent.trim()===txt)p.classList.add('on');});
    });
  }catch(e){}
}
function _saveDraftNow(){
  if(window._reportMode!=='form'||!_formDirty||window._reportIsNbo)return;
  try{const s=_snapshotRescueForm();if(s)localStorage.setItem(_DRAFT_KEY,JSON.stringify(s));}catch(e){}
}
function _clearRescueDraft(){try{localStorage.removeItem(_DRAFT_KEY);}catch(e){}_formDirty=false;}
function _startDraftAutosave(){
  clearInterval(_draftAutoTimer);
  _draftAutoTimer=setInterval(()=>{
    if(window._reportMode!=='form'){clearInterval(_draftAutoTimer);return;}
    _saveDraftNow();
  },30000); // 30초마다 임시저장
}
function _maybeOfferDraftRestore(){
  let snap=null;try{snap=JSON.parse(localStorage.getItem(_DRAFT_KEY)||'null');}catch(e){}
  if(!snap||!snap.at)return;
  if(Date.now()-snap.at>24*3600000){_clearRescueDraft();return;} // 24시간 지난 초안은 폐기
  const mins=Math.max(1,Math.round((Date.now()-snap.at)/60000));
  if(confirm('작성하다 중단한 임시저장 내용이 있습니다 ('+mins+'분 전).\n불러올까요?')){
    _restoreRescueForm(snap);toast('📄 임시저장 내용 불러옴');
  }else{_clearRescueDraft();}
}
function render1BoForm(prefill=null){
  const ms=getTeamMembers();
  const hdTeam=getHwandonghaTeam();
  const isNbo=prefill!==null&&!!prefill._phaseNum;
  const p=prefill||{};
  const w=document.getElementById('repContent');

  const tabs=[
    {id:'repSec1', icon:'📍', label:'위치·기상'},
    {id:'repSec2', icon:'🤕', label:'환자·부상'},
    {id:'repSec3', icon:'🧑', label:'인적사항'},
    {id:'repSec5', icon:'📝', label:'기타'},
  ];

  const _offHrs=_isOffHours();
  const _mobilizeHtml=(!isNbo)?`<div id="mobilizeWrap" style="background:${_offHrs?'rgba(231,76,60,.1)':'rgba(79,168,208,.06)'};border-bottom:1px solid ${_offHrs?'rgba(231,76,60,.3)':'rgba(79,168,208,.18)'};padding:10px 13px;flex-shrink:0;">
      <div style="font-size:11px;color:${_offHrs?'#e74c3c':'#4fa8d0'};font-weight:700;margin-bottom:6px;">${_offHrs?'🌙 야간 출동(18~09시) — 응소 여부 선택 (확인 필요)':'🚨 응소 여부 선택 (해당 시 선택)'}</div>
      <div class="pills" id="mobilizePills">
        ${['특구대','재난과','전직원응소'].map(o=>`<div class="pill${(p.mobilize||[]).includes(o)?' on':''}" onclick="tPill(this)">${o}</div>`).join('')}
      </div>
    </div>`:'';

  w.innerHTML=`
    ${isNbo?`<div id="nboBanner" style="background:rgba(79,168,208,.1);border:1px solid rgba(79,168,208,.25);border-radius:0;padding:9px 13px;font-size:11px;color:#4fa8d0;display:flex;align-items:center;justify-content:space-between;">
      <span>📋 <b>${p._phaseNum||2}보 작성중</b> — 변경사항만 수정</span>
      <button onclick="history.back()" style="background:rgba(255,255,255,.07);color:#c0d8ec;border:none;padding:5px 10px;border-radius:6px;font-size:11px;cursor:pointer;">✕</button>
    </div>`:''}

    ${_mobilizeHtml}

    <!-- AI 출동지령서 스캔 버튼 -->
    <div style="padding:9px 12px;background:#06101e;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;">
      <label style="display:flex;align-items:center;gap:9px;background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.3);border-radius:10px;padding:10px 13px;cursor:pointer;touch-action:manipulation;">
        <span style="font-size:18px;">📷</span>
        <div style="flex:1;">
          <div style="font-size:12px;font-weight:700;color:#c4b5fd;">AI 출동지령서 스캔</div>
          <div style="font-size:10px;color:#7a6a9a;margin-top:1px;">사진 촬영 또는 선택 → 자동 입력</div>
        </div>
        <div id="aiScanSpinner" style="display:none;width:18px;height:18px;border:2px solid rgba(139,92,246,.3);border-top-color:#c4b5fd;border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0;"></div>
        <input type="file" accept="image/*" style="display:none;" onchange="aiScanDispatch(this)">
      </label>
      <div id="aiScanStatus" style="display:none;font-size:10px;color:#7a9cb8;margin-top:6px;padding:0 4px;line-height:1.6;"></div>
    </div>

    <div style="display:flex;background:#040a16;border-bottom:1px solid rgba(255,255,255,.06);overflow-x:auto;scrollbar-width:none;flex-shrink:0;">
      ${tabs.map((t,i)=>`<div class="rep-tab${i===0?' rep-tab-on':''}" onclick="switchRepTab('${t.id}',this)"
        style="flex:1;min-width:52px;padding:8px 3px;text-align:center;font-size:10px;cursor:pointer;
        border-bottom:2px solid ${i===0?'#4fa8d0':'transparent'};
        color:${i===0?'#4fa8d0':'rgba(255,255,255,.3)'};white-space:nowrap;">
        ${t.icon}<br>${t.label}</div>`).join('')}
    </div>

    <!-- ══ 섹터0: 고도화 타임라인 ══ -->
    <div id="repSec0" class="rep-sec" style="display:none;padding:12px;overflow-y:auto;">
      <div id="formTlWrap">
        <div style="text-align:center;padding:30px 12px;font-size:12px;color:rgba(255,255,255,.3);line-height:1.8;">위치·기상 탭에서 사고 위치를 입력하면<br>경로 시뮬레이션이 표시됩니다</div>
      </div>
    </div>

    <!-- ══ 섹터1: 위치·기상 ══ -->
    <div id="repSec1" class="rep-sec" style="padding:12px;overflow-y:auto;">
      <div class="rsec"><div class="rsec-t">🚨 사고 유형</div>
        <div class="pills" id="typePills">
          ${['안전사고','조난','고립','실종','낙석','위험수목','화재','기타'].map(o=>`<div class="pill${(p.type||'안전사고')===o?' on':''}" onclick="selAccType('${o}')">${o}</div>`).join('')}
        </div>
        <input type="hidden" id="r_type" value="${p.type||'안전사고'}">
      </div>
      <div class="rsec"><div class="rsec-t">📍 사고 위치</div>
        <div class="fg">
          <span class="fl">GPS 좌표</span>
          <div style="background:#060d1a;border-radius:9px;border:1px solid rgba(79,168,208,.2);padding:10px 12px;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <div id="r_minimap_coords" style="flex:1;font-family:monospace;font-size:11px;color:#4fa8d0;font-weight:600;">${p.lat&&p.lng?(+p.lat).toFixed(5)+', '+(+p.lng).toFixed(5):'📡 수신 중...'}</div>
              <button id="gpsFormBtn" onclick="gpsToFormMap()" style="background:rgba(79,168,208,.12);border:1px solid rgba(79,168,208,.35);color:#4fa8d0;border-radius:7px;padding:5px 11px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;">📡 GPS</button>
              <button onclick="openMapPicker()" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.5);border-radius:7px;padding:5px 11px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;">🗺 지도</button>
            </div>
            <div id="r_gps_status" style="font-size:10px;color:rgba(255,255,255,.3);line-height:1.4;">${p.lat&&p.lng?'✅ 위치 확인':'GPS 버튼을 눌러 현재 위치를 자동으로 받거나, 🗺 지도에서 직접 선택하세요'}</div>
          </div>
          <!-- 위치 미니맵 -->
          <div id="r_loc_mini_map" style="display:${p.lat&&p.lng?'block':'none'};height:180px;border-radius:10px;overflow:hidden;margin-bottom:8px;border:1px solid rgba(79,168,208,.2);"></div>
          <div class="gps-row">
            <input type="text" id="r_gps" class="fi" placeholder="위도, 경도 직접 입력" value="${p.lat&&p.lng?(+p.lat).toFixed(5)+', '+(+p.lng).toFixed(5):''}" oninput="syncFormMapFromInput()">
          </div>
        </div>
        <div class="fg"><span class="fl">사고 장소</span>
          <input type="text" id="r_loc" class="fi" placeholder="예: 비선대 직상부 암릉 구간" value="${p.location||''}" oninput="autoGenTitle();this.dataset.userEdited='1'">
        </div>
        <div class="fg"><span class="fl">장소구분</span>
          <div style="display:flex;gap:5px;flex-wrap:wrap;" id="loctypeBtns">
            ${['법정탐방로','비법정탐방로','암벽','빙벽'].map(o=>`<button class="tog-btn${(p.loctype||'법정탐방로')===o?' on':''}" data-val="${o}" onclick="selLoctype('${o}')">${o}</button>`).join('')}
          </div>
          <input type="hidden" id="r_loctype" value="${p.loctype||'법정탐방로'}">
        </div>
        <div id="fineWrap" style="display:${p.loctype&&p.loctype.includes('비법정')?'block':'none'};" class="fg">
          <span class="fl" style="color:#e67e22;">⚠️ 과태료 여부</span>
          <select id="r_fine" class="fsel">
            ${['과태료 해당 없음','과태료 부과 예정','확인 필요'].map(o=>`<option${p.fine===o?' selected':''}>${o}</option>`).join('')}
          </select>
        </div>
        <div id="permitWrap" style="display:${p.loctype&&(p.loctype==='암벽'||p.loctype==='빙벽')?'block':'none'};" class="fg">
          <span class="fl">🏔️ 암빙벽 허가</span>
          <select id="r_permit" class="fsel" onchange="chkPermit(this)">${['해당없음','허가자 있음','무허가'].map(o=>`<option${p.permit===o?' selected':''}>${o}</option>`).join('')}</select>
        </div>
        <div id="permitNote" style="display:${p.permit&&p.permit==='허가자 있음'?'block':'none'};" class="fg">
          <input type="text" id="r_permitNote" class="fi" placeholder="허가번호, 소속 등" value="${p.permitNote||''}">
        </div>
        <div id="climbLocWrap" style="display:${(p.loctype==='암벽'||p.loctype==='빙벽')?'block':'none'};" class="fg">
          ${(p.loctype==='암벽'||p.loctype==='빙벽')?`<span class="fl">📍 ${p.loctype} 위치 선택</span><div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px;" id="climbLocBtns">${(p.loctype==='암벽'?_ROCK_LOCS:_ICE_LOCS).map(l=>`<button class="tog-btn${(p.location||'')===(l)?' on':''}" onclick="selClimbLoc('${l.replace(/'/g,"\\'")}',this)">${l}</button>`).join('')}</div>`:''}
        </div>
      </div>
      <div class="rsec"><div class="rsec-t">🌤️ 기상 정보</div>
        <div class="fg"><span class="fl">기상 상황</span>
          <div class="pills" id="weatherPills">${['맑음','흐림','비','눈','강풍','안개'].map(o=>`<div class="pill${p.weather===o?' on':''}" onclick="sPill(this,'weatherPills')">${o}</div>`).join('')}</div>
        </div>
        <div class="fg"><span class="fl">최초접수 당시 기온 (°C) <span style="font-size:9px;color:#7a9cb8;font-weight:400;">(가까운 관측지점 자동 · 수정 가능)</span></span>
          <input type="number" inputmode="decimal" step="0.1" id="r_initTemp" class="fi" placeholder="자동 입력" value="${p.initTemp!=null&&p.initTemp!==''?p.initTemp:(()=>{try{const t=(document.getElementById('wTmp')||{}).textContent||'';const n=parseInt(t);return isNaN(n)?'':n;}catch(e){return '';}})()}">
        </div>
        <div class="fg"><span class="fl">기상 특보</span>
          <div style="background:#060d1a;border-radius:8px;border:1px solid rgba(255,255,255,.07);padding:10px;margin-top:4px;">
            <div style="font-size:10px;color:#7a9cb8;font-weight:700;margin-bottom:5px;">종류</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;" id="wAlertTypePills">
              ${['강풍','호우','대설','건조','한파','폭염','황사','태풍'].map(t=>`<div class="pill" onclick="selWAlertType(this,'${t}')" style="font-size:11px;cursor:pointer;">${t}</div>`).join('')}
            </div>
            <div style="font-size:10px;color:#7a9cb8;font-weight:700;margin-bottom:5px;">단계</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;" id="wAlertLevelPills">
              ${['주의보','경보','특보'].map(l=>`<div class="pill" onclick="selWAlertLevel(this,'${l}')" style="font-size:11px;cursor:pointer;">${l}</div>`).join('')}
            </div>
            <button onclick="addWAlert()" style="width:100%;padding:7px;background:rgba(79,168,208,.15);border:1px solid rgba(79,168,208,.3);color:#4fa8d0;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;">＋ 추가</button>
            <div id="wAlertList" style="margin-top:6px;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ 섹터2: 환자·부상 (순서: 부상현황 → 현장사진 → 원인·경위 → 활력징후) ══ -->
    <div id="repSec2" class="rep-sec" style="display:none;padding:12px;overflow-y:auto;">

      <!-- 1. 부상 현황 -->
      <div class="rsec"><div class="rsec-t">🩺 부상 현황</div>
        <div style="background:#060d1a;border-radius:8px;border:1px solid rgba(255,255,255,.07);padding:10px;margin-bottom:8px;">
          <!-- ① 부상 유형 먼저 -->
          <div style="font-size:10px;color:#7a9cb8;font-weight:700;margin-bottom:5px;">① 부상 유형 <span style="font-weight:400;color:#5a7a92;">※ 전신상태는 부위 불필요</span></div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;" id="injTypePills">
            ${['골절','탈구','염좌','열상','타박상','두부손상','심정지','저체온증','탈진/탈수','익수','기타(부위)','기타(전신)'].map(t=>`<div class="pill" onclick="selInjType(this,'${t}')" style="font-size:11px;cursor:pointer;">${t}</div>`).join('')}
          </div>
          <!-- ② 부상 부위 -->
          <div id="injPartWrap" style="margin-bottom:8px;">
            <div style="font-size:10px;color:#7a9cb8;font-weight:700;margin-bottom:5px;">② 부상 부위</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;" id="injPartPills">
              ${['머리','목','어깨','팔꿈치','손목','손','흉부','복부','허리','골반','무릎','발목','발'].map(t=>`<div class="pill" onclick="selInjPart(this,'${t}')" style="font-size:11px;cursor:pointer;">${t}</div>`).join('')}
            </div>
          </div>
          <!-- 좌/우 — 부위 선택 후 노출 -->
          <div id="injSideWrap" style="display:none;margin-bottom:8px;">
            <div style="font-size:10px;color:#7a9cb8;font-weight:700;margin-bottom:5px;">좌/우</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;" id="injSidePills">
              ${['좌','우','양쪽'].map(s=>`<div class="pill" onclick="selInjSide(this,'${s}')" style="font-size:11px;cursor:pointer;">${s}</div>`).join('')}
            </div>
          </div>
          <button onclick="addInjury()" style="width:100%;padding:7px;background:rgba(79,168,208,.15);border:1px solid rgba(79,168,208,.3);color:#4fa8d0;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;">＋ 부상 추가</button>
          <div id="injuryList" style="margin-top:6px;"></div>
        </div>
      </div>

      <!-- 2. 현장 사진 (사진은 필요 없다 하셨으나 구조 첨부는 유지 — 사용자 요청으로 삭제 원할 시 별도 요청) -->
      <div class="rsec"><div class="rsec-t">📸 현장 사진</div>
        <div class="frow">
          <div class="fg"><span class="fl">부상 사진</span>
            <div class="photo-slot" onclick="document.getElementById('fileInj').click()"><input type="file" id="fileInj" accept="image/*" capture="environment" style="display:none;" onchange="prevImg(this,'prevInj')"><div id="prevInj">📸</div></div>
          </div>
          <div class="fg"><span class="fl">이송 사진</span>
            <div class="photo-slot" onclick="document.getElementById('fileTrans').click()"><input type="file" id="fileTrans" accept="image/*" capture="environment" style="display:none;" onchange="prevImg(this,'prevTrans')"><div id="prevTrans">📸</div></div>
          </div>
        </div>
      </div>

      <!-- 3. 사고 원인·경위 -->
      <div class="rsec"><div class="rsec-t">⚡ 사고 원인·경위</div>
        <div class="fg"><span class="fl">사고 원인</span>
          <select id="r_cause" class="fsel" onchange="autoGenTitle()">
            ${['본인부주의','실족','추락','낙석 피격','탈진/탈수','저체온','심혈관 이상','동물 피해','익수','기타'].map(o=>`<option${(p.cause||'본인부주의')===o?' selected':''}>${o}</option>`).join('')}
          </select>
        </div>
        <div class="fg"><span class="fl">사고 경위 <span style="font-size:9px;color:#7a9cb8;font-weight:400;">(상세 기술)</span></span>
          <textarea id="r_sit" class="fta" rows="4" placeholder="예) 오전 09:00 비선대 주차장에서 산행 시작, 11:30경 천불동계곡 3km 지점 하산 중 실족하여 우측 발목 부상 발생">${p.situation||''}</textarea>
        </div>
      </div>

      <!-- 4. 활력징후 (음주여부 + 중증도 포함) -->
      <div class="rsec"><div class="rsec-t">💓 활력징후 <span style="font-size:9px;color:#7a9cb8;font-weight:400;">(보고마다 기록 → 추이 확인)</span></div>
        <div style="font-size:9px;color:#5a7e98;margin-bottom:6px;">＋/− 버튼은 예시값에서 시작해 조정 · 안 건드리면 빈값으로 저장</div>
        <div class="frow">
          <div class="fg"><span class="fl">맥박 (회/분)</span>
            <div class="vit-step"><button type="button" onclick="_vitStep('r_hr',-1,80,1)">−</button><input type="number" inputmode="numeric" id="r_hr" class="fi vit-input" min="0" placeholder="예: 80" value="${p.vitals?.hr||''}" enterkeyhint="next" onkeydown="_vitNext(event)" oninput="_vitClamp(this)"><button type="button" onclick="_vitStep('r_hr',1,80,1)">＋</button></div>
          </div>
          <div class="fg"><span class="fl">SpO₂ (%)</span>
            <div class="vit-step"><button type="button" onclick="_vitStep('r_spo2',-1,98,1,100)">−</button><input type="number" inputmode="numeric" id="r_spo2" class="fi vit-input" min="0" max="100" placeholder="예: 98" value="${p.vitals?.spo2||''}" enterkeyhint="next" onkeydown="_vitNext(event)" oninput="_vitClamp(this,100)"><button type="button" onclick="_vitStep('r_spo2',1,98,1,100)">＋</button></div>
          </div>
        </div>
        <div class="frow">
          <div class="fg"><span class="fl">체온 (℃)</span>
            <div class="vit-step"><button type="button" onclick="_vitStep('r_temp',-1,36.5,0.1)">−</button><input type="number" inputmode="decimal" step="0.1" id="r_temp" class="fi vit-input" min="0" placeholder="예: 36.5" value="${p.vitals?.temp||''}" enterkeyhint="next" onkeydown="_vitNext(event)" oninput="_vitClamp(this)"><button type="button" onclick="_vitStep('r_temp',1,36.5,0.1)">＋</button></div>
          </div>
          <div class="fg"><span class="fl">의식 (AVPU)</span>
            <select id="r_avpu" class="fsel">${['','A (명료)','V (음성반응)','P (통증반응)','U (무반응)'].map(o=>`<option${(p.vitals?.avpu||'')===o?' selected':''}>${o||'선택'}</option>`).join('')}</select>
          </div>
        </div>
        <div class="fg"><span class="fl">혈압 (선택)</span><input type="text" id="r_bp" class="fi vit-input" placeholder="예: 120/80" value="${p.vitals?.bp||''}" enterkeyhint="done"></div>
        <!-- 음주 여부 — 버튼식 -->
        <div class="fg"><span class="fl">음주 여부</span>
          <div style="display:flex;gap:6px;" id="alcPills">
            ${['없음','의심','확인됨'].map(o=>`<div class="pill${(p.alcohol||'없음')===o?' on':''}" onclick="sPill(this,'alcPills');_toggleAlcAmount()" style="flex:1;text-align:center;font-size:12px;font-weight:700;padding:8px 0;cursor:pointer;">${o==='없음'?'🚫 없음':o==='의심'?'⚠️ 의심':'🍺 확인됨'}</div>`).join('')}
          </div>
          <input type="hidden" id="r_alc" value="${p.alcohol||'없음'}">
        </div>
        <div class="fg" id="alcAmountWrap" style="display:${(p.alcohol&&p.alcohol!=='없음')?'block':'none'};">
          <span class="fl">음주량 (선택)</span>
          <input type="text" id="r_alcAmount" class="fi" placeholder="예: 소주 1병, 맥주 2캔, 추정 다량" value="${p.alcAmount||''}">
        </div>
        <!-- 중증도 -->
        <div class="fg"><span class="fl">중증도 <button class="info-btn" onclick="openGuide('severity')">ℹ KTAS</button></span>
          <div class="pills" id="sevPills">${['KTAS 1 (소생)','KTAS 2 (긴급)','KTAS 3 (응급)','KTAS 4 (준응급)','KTAS 5 (비응급)'].map(o=>`<div class="pill${p.severity===o?' on':''}" onclick="sPill(this,'sevPills');autoGenTitle()">${o}</div>`).join('')}</div>
        </div>
      </div>
    </div>

    <!-- ══ 섹터3: 인적사항 ══ -->
    <div id="repSec3" class="rep-sec" style="display:none;padding:12px;overflow-y:auto;">
      <div class="rsec"><div class="rsec-t">🧑 사고자 인적사항 <button class="info-btn" onclick="openGuide('victim')">ℹ</button></div>
        <div class="frow">
          <div class="fg"><span class="fl">성명</span><input type="text" id="r_vName" class="fi" value="${p.vName||''}"></div>
          <div class="fg"><span class="fl">연락처</span><input type="tel" id="r_vTel" class="fi" value="${p.vTel||''}"></div>
        </div>
        <div class="frow">
          <div class="fg"><span class="fl">내/외국인</span>
            <select id="r_vNat" class="fsel" onchange="chkNation(this)">${['내국인','외국인','알수없음'].map(o=>`<option${p.vNation===o?' selected':''}>${o}</option>`).join('')}</select>
          </div>
          <div id="r_vNatWrap_extra" style="display:${p.vNation==='외국인'?'block':'none'};" class="fg">
            <span class="fl">국적</span><input type="text" id="r_vNationality" class="fi" placeholder="예: 미국, 중국" value="${p.vNationality||''}">
          </div>
          <div class="fg"><span class="fl">성별</span>
            <select id="r_vGender" class="fsel" onchange="autoGenTitle()">${['알수없음','남','여'].map(o=>`<option${(p.vGender||'알수없음')===o?' selected':''}>${o}</option>`).join('')}</select>
          </div>
        </div>
        <div class="frow">
          <div class="fg"><span class="fl">생년월일</span><input type="text" inputmode="numeric" id="r_vBirth" class="fi" placeholder="19901231" maxlength="10" value="${p.vBirth||''}" oninput="_fmtBirth(this)"></div>
          <div class="fg"><span class="fl">거주지</span><input type="text" id="r_vAddr" class="fi" placeholder="시/도" value="${p.vAddr||''}"></div>
        </div>
        <div class="fg"><span class="fl">기저질환</span><input type="text" id="r_vDis" class="fi" placeholder="없음 또는 해당 질환" value="${p.vDisease||''}"></div>
        <div class="fg"><span class="fl">알레르기</span><input type="text" id="r_vAll" class="fi" placeholder="없음 또는 항목" value="${p.vAllergy||''}"></div>
        <div class="fg"><span class="fl">복용약</span><input type="text" id="r_vMed" class="fi" placeholder="없음 또는 항목" value="${p.vMeds||''}"></div>
      </div>
      <div class="rsec"><div class="rsec-t">👥 추가 사고자 <span style="font-size:9px;color:#7a9cb8;font-weight:400;">(다수 사상자 발생 시)</span></div>
        <div id="victim2List">${(p.victims2||[]).map(v=>`<div class="victim2-item" style="background:#060d1a;border-radius:8px;padding:10px;margin-bottom:6px;border:1px solid rgba(231,76,60,.15);">${_victim2CardHtml(v)}</div>`).join('')}</div>
        <button onclick="addVictim2()" style="width:100%;padding:9px;background:rgba(231,76,60,.08);border:1px dashed rgba(231,76,60,.3);color:#e9897e;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;margin-top:4px;">＋ 사고자 추가</button>
      </div>
      <div class="rsec"><div class="rsec-t">📞 신고자</div>
        <div class="fg">
          <div style="display:flex;gap:6px;" id="hasRepBtns">
            <button class="tog-btn${p.hasRep==='y'?'':' on'}" data-val="n" onclick="selHasRep('n')">없음</button>
            <button class="tog-btn${p.hasRep==='y'?' on':''}" data-val="y" onclick="selHasRep('y')">있음</button>
          </div>
          <input type="hidden" id="r_hasRep" value="${p.hasRep||'n'}">
        </div>
        <div id="reporterWrap" style="display:${p.hasRep==='y'?'block':'none'};">
          <div class="frow">
            <div class="fg"><span class="fl">성명</span><input type="text" id="r_repName" class="fi" value="${p.repName||''}"></div>
            <div class="fg"><span class="fl">연락처</span><input type="tel" id="r_repTel" class="fi" value="${p.repTel||''}"></div>
          </div>
        </div>
      </div>
      <div class="rsec"><div class="rsec-t">👥 동반자</div>
        <div class="fg">
          <div style="display:flex;gap:6px;" id="hasCompBtns">
            <button class="tog-btn${(p.companions&&p.companions.length)?'':' on'}" data-val="n" onclick="selHasComp('n')">없음</button>
            <button class="tog-btn${(p.companions&&p.companions.length)?' on':''}" data-val="y" onclick="selHasComp('y')">있음</button>
          </div>
          <input type="hidden" id="r_hasComp" value="${(p.companions&&p.companions.length)?'y':'n'}">
        </div>
        <div id="companionWrap" style="display:${(p.companions&&p.companions.length)?'block':'none'};">
          <div id="companionList">
            ${(p.companions||[]).map((c,i)=>`<div class="companion-item" data-idx="${i}" style="background:#060d1a;border-radius:8px;padding:10px;margin-bottom:6px;border:1px solid rgba(255,255,255,.07);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span style="font-size:11px;color:#4fa8d0;font-weight:700;">동반자 ${i+1}</span><button onclick="removeCompanion(${i})" style="background:rgba(192,57,43,.15);color:#c0392b;border:none;border-radius:5px;padding:3px 8px;font-size:10px;cursor:pointer;">삭제</button></div>
              <div class="frow"><div class="fg"><span class="fl">성명</span><input type="text" class="fi comp-name" placeholder="이름" value="${c.name||''}"></div><div class="fg"><span class="fl">연락처</span><input type="tel" class="fi comp-tel" placeholder="연락처" value="${c.tel||''}"></div></div>
            </div>`).join('')}
          </div>
          <button onclick="addCompanion()" style="width:100%;padding:9px;background:rgba(79,168,208,.08);border:1px dashed rgba(79,168,208,.3);color:#4fa8d0;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;margin-top:4px;">＋ 동반자 추가</button>
        </div>
      </div>
    </div>

    <!-- ══ 섹터4: 기타 ══ -->
    <div id="repSec5" class="rep-sec" style="display:none;padding:12px;overflow-y:auto;">
      <div class="rsec"><div class="rsec-t">🛠️ 동원 장비</div>
        <div class="fg"><span class="fl">구조 방법 (복수)</span>
          <div class="pills" id="rescMeth">${['들것','부축','헬기','차량','자력하산','로프구조','기타'].map(o=>`<div class="pill${(p.rescueMethod||[]).includes(o)?' on':''}" onclick="tPill(this)">${o}</div>`).join('')}</div>
        </div>
        <div class="fg"><span class="fl">동원 장비</span>
          <textarea id="r_equip" class="fta" rows="2" placeholder="들것, 로프, AED, 헬기 등">${p.equipment||''}</textarea>
        </div>
      </div>
      <div class="rsec" style="margin-top:12px;"><div class="rsec-t">📝 사고접수 내용 (자유작성)</div>
        <textarea id="r_recv" class="fta" rows="4" placeholder="사고 접수 당시 상황을 자유롭게 적어주세요 (신고 내용, 현장 상황, 인지 경위 등)">${p.reception||''}</textarea>
      </div>
      <div class="rsec" style="margin-top:12px;"><div class="rsec-t">📋 사고 제목 및 작성 정보</div>
        <div class="fg">
          <span class="fl">사고 제목 <span style="font-size:9px;color:#7a9cb8;font-weight:400;">(자동생성 — 수정 가능)</span></span>
          <input type="text" id="r_title" class="fi" placeholder="위치·기상 탭 입력 시 자동생성" value="${p.title||''}">
        </div>
        <div class="fg"><span class="fl">보고 작성자</span>
          <input type="text" id="r_author" class="fi" value="${isExternal()?_extAuthorStr():getAuthor()}" disabled style="opacity:.6;cursor:default;">
        </div>
        <div class="fg"><span class="fl">기타 특이사항</span>
          <textarea id="r_extra" class="fta" rows="3">${p.extra||''}</textarea>
        </div>
      </div>
    </div>
  `;

  const _footer=document.getElementById('rep1BoFooter');
  if(_footer){
    _footer.style.display='block';
    _footer.innerHTML=isNbo
      ?`<button class="btn-submit" style="background:#1a4a6e;color:#fff;" onclick="submitNBoFromForm()">💾 ${p._phaseNum||2}보 저장</button>`
      :`<button class="btn-submit" style="background:#1a4a6e;color:#fff;" onclick="submit1Bo()">💾 최초 접수 등록</button>`;
  }

  _ttInlineEntries=p.timetable||[];   // (수정) 미선언 _ttEntries → strict 모드 ReferenceError로 이후 초기화 전체 중단되던 버그
  initExtraDispatch(p);
  initExtraTeams(p);
  initWAlerts(p);
  initInjuries(p);
  initFireAgencies(p);
  initFormMiniMap(p.lat,p.lng);
  // GPS 자동 실행 (lat/lng 없을 때)
  if(!p.lat&&!p.lng)setTimeout(()=>gpsToFormMap(),800);
  // 작성 모드 진입 — 자동저장·이탈경고 활성화
  window._reportMode='form';
  window._reportIsNbo=isNbo; // N보는 1보 임시저장 키를 공유하지 않음
  _formDirty=false;
  if(!_draftListenerBound){
    const wc=document.getElementById('repContent');
    if(wc){wc.addEventListener('input',()=>{if(window._reportMode==='form')_formDirty=true;});
           wc.addEventListener('change',()=>{if(window._reportMode==='form')_formDirty=true;});
           _draftListenerBound=true;}
  }
  if(!isNbo)_startDraftAutosave(); // 신규 1보만 임시저장
}

function _renderFormTl(){
  // 신규 1보 폼 탭: 팀 카드만 렌더 (고도화 타임라인의 same 컴포넌트 재사용, 구버전 경로뷰 제거)
  const loc=document.getElementById('r_loc')?.value||'';
  const loctype=document.getElementById('r_loctype')?.value||'법정탐방로';
  const curUser=DB.g('currentUser')||{};
  const members=curUser.name?[curUser.name]:[];
  const tempR={id:'_form_tl_',title:'신규 구조',location:loc,loctype:loctype,
    members:members,extraTeams:[],agencies:{},r119:false,
    timetable:[],lat:null,lng:null,status:'ongoing'};
  _initTlTeams(tempR);
  const wrap=document.getElementById('formTlWrap');
  if(!wrap)return;
  wrap.innerHTML=`
    <div id="tlAllTeams">${_tlTeams.map((t,i)=>_tlTeamFullHtml(t,i)).join('')}</div>
    <div id="tlBuildArea">${_tlBuilding?_renderBuildPanelHtml():_renderCreateBtnsHtml()}</div>`;
}
let _1boSubmitting=false;
function switchRepTab(secId,el){
  document.querySelectorAll('.rep-sec').forEach(s=>s.style.display='none');
  const target=document.getElementById(secId);
  if(target) target.style.display='block';
  document.querySelectorAll('.rep-tab').forEach(t=>{
    t.style.color='rgba(255,255,255,.3)';
    t.style.borderBottomColor='transparent';
    t.classList.remove('rep-tab-on');
  });
  if(el){el.style.color='#4fa8d0';el.style.borderBottomColor='#4fa8d0';el.classList.add('rep-tab-on');}
  if(secId==='repSec0') _renderFormTl();
}





function submit1Bo(){
  if(_1boSubmitting)return;
  _1boSubmitting=true;
  const _btn=document.querySelector('#rep1BoFooter .btn-submit');
  if(_btn){_btn.disabled=true;_btn.style.opacity='.5';}
  try{
  autoGenTitle();
  const title=document.getElementById('r_title').value.trim()||autoGenTitle(true);
  const gps=(document.getElementById('r_gps')?.value||'').split(',');
  // 좌표 검증: 범위 밖(위경도 뒤바뀜 포함)·NaN이면 좌표 없이 저장(지도 오표시 방지)
  let lat=parseFloat(gps[0]), lng=parseFloat(gps[1]);
  if(isNaN(lat)||isNaN(lng)||lat<-90||lat>90||lng<-180||lng>180){
    if(gps[0]&&gps[1]&&(isNaN(lat)||isNaN(lng)||Math.abs(lat)>90))toast('⚠️ 좌표 형식 오류 — 위치 없이 저장됩니다');
    lat=null;lng=null;
  }
  const members=[...document.querySelectorAll('#memChkGrid .chk-grid .chk-box.on')].map(b=>{
    const txt=b.closest('.chk-item')?.querySelector('.chk-txt');
    return txt?txt.textContent.trim().split(' ')[0]:'';
  }).filter(Boolean);
  const extraMembers=[..._extraDispatch];
  // 현재 날짜/시간
  const nowStr=now();
  const r={
    id:Date.now(), title,
    type:document.getElementById('r_type')?.value||'안전사고',
    date:nowStr,
    reception:document.getElementById('r_recv')?.value||'',
    weather:getSelPills('weatherPills')[0]||'',
    initTemp:document.getElementById('r_initTemp')?.value||'',
    weatherAlert:getWeatherAlertStr()||'',
    alertOpId:((DB.g('alertOps')||[]).find(o=>!o.closedAt)||{}).id||null,
    lat, lng,
    location:document.getElementById('r_loc')?.value||'',
    loctype:document.getElementById('r_loctype')?.value||'',
    fine:document.getElementById('fineWrap')?.style.display!=='none'?(document.getElementById('r_fine')?.value||''):'',
    vName:document.getElementById('r_vName')?.value||'',
    vTel:document.getElementById('r_vTel')?.value||'',
    vNation:document.getElementById('r_vNat')?.value||'알수없음',
    vNationality:document.getElementById('r_vNationality')?.value||'',
    vGender:document.getElementById('r_vGender')?.value||'알수없음',
    vBirth:document.getElementById('r_vBirth')?.value||'',
    vAddr:document.getElementById('r_vAddr')?.value||'',
    vDisease:document.getElementById('r_vDis')?.value||'',
    vAllergy:document.getElementById('r_vAll')?.value||'',
    vMeds:document.getElementById('r_vMed')?.value||'',
    companions:getCompanions(),
    victims2:getVictims2(),
    cause:document.getElementById('r_cause')?.value||'',
    injuryParts:getSelPills('injParts'),
    injuryTypes:getSelPills('injTypes'),
    severity:getSelPills('sevPills')[0]||'',
    alcohol:document.getElementById('r_alc')?.value||'없음',
    alcAmount:document.getElementById('r_alcAmount')?.value||'',
    injuries:_injuries,
    situation:document.getElementById('r_sit')?.value||'',
    rescueMethod:getSelPills('rescMeth'),
    members, extraMembers,
    extraTeams:getExtraTeams(),
    agencies:getAgencies(),
    r119:document.getElementById('r_119')?.value||'',
    equipment:document.getElementById('r_equip')?.value||'',
    hospital:document.getElementById('r_hosp')?.value||'미정',
    author:document.getElementById('r_author')?.value||(isExternal()?_extAuthorStr():getAuthor()),
    extAgency:isExternal()?(DB.g('currentUser')||{}).name||null:null,
    extra:document.getElementById('r_extra')?.value||'',
    permit:document.getElementById('r_permit')?.value||'해당없음',
    permitNote:document.getElementById('r_permitNote')?.value||'',
    hasRep:document.getElementById('r_hasRep')?.value||'n',
    repName:document.getElementById('r_repName')?.value||'',
    repTel:document.getElementById('r_repTel')?.value||'',
    injuryPhoto:_photoUrl('prevInj'),
    transPhoto:_photoUrl('prevTrans'),
    timetable: sortTTByTime(_ttInlineEntries||[]),
    mobilize:getSelPills('mobilizePills'),
    vitals:_collectVitals(),
    status:'ongoing', reports:[],
  };
  // 등록 폼 타임라인에서 만든 팀이 있으면 새 구조 레코드로 이관
  if(_tlWpResId==='_form_tl_'&&_tlTeams.length){
    r.teams=_snapshotTeams();
    _tlWpResId=r.id;
  }
  // SOS에서 온 1보면: 레코드에 sosId 연결 + 1회용 토큰 종료(중복 핀 방지)
  if(window._pendingSosId){
    r.sosId=window._pendingSosId;
    if(_fdb)_fdb.collection('sos').doc(window._pendingSosId).set({active:false,closedAt:Date.now()},{merge:true}).catch(()=>{});
    _sosPings=(_sosPings||[]).filter(x=>x.id!==window._pendingSosId);
    window._pendingSosId=null;try{_drawSosPins();_updateSosFab();}catch(e){}
  }
  const res=DB.g('rescues')||[];
  res.push(r);
  DB.s('rescues',res);
  // 저장 즉시 지도·목록·요약 갱신 → 등록 직후 지도에 바로 표시
  try{renderRescueMap();}catch(e){}try{renderResList();}catch(e){}try{updateSummary();}catch(e){}
  // 오프라인 대기 사진을 이 레코드에 연결 (연결 복구 시 자동 반영)
  _registerPendingPhoto('prevInj',{key:'rescues',id:r.id,field:'injuryPhoto'});
  _registerPendingPhoto('prevTrans',{key:'rescues',id:r.id,field:'transPhoto'});
  pushNoti('🚨 구조 1보: '+title+' ('+r.type+')',RES_TYPES[r.type]?.ico||'🚨',r.type,{app:'rescue',tab:2,id:r.id},'안전사고');
  if(r.mobilize&&r.mobilize.length)pushNoti('🚨 야간 응소 요청: '+r.mobilize.join(', ')+' — '+title,'🚨','rescue_mobilize',{app:'rescue',tab:2,id:r.id});
  syncToSheets('rescue',{id:r.id,title,type:r.type,date:r.date,author:r.author});
  toast('🚨 1보 등록 완료'+(r.mobilize&&r.mobilize.length?' · 응소: '+r.mobilize.join(', '):''));
  _clearRescueDraft(); // 정상 등록됐으므로 임시저장 폐기
  // 저장 즉시 고도화 타임라인으로 이동
  selResId=r.id;curResId=r.id;
  document.getElementById('bnav').style.display='none';
  _hideRepFooter();
  showV('v-report');
  document.getElementById('topTitle').textContent=r.title;
  history.pushState({view:'rescue-timeline',id:r.id},'','');
  renderTimeline(r,'advanced');
  }finally{
    _1boSubmitting=false;
    if(_btn){_btn.disabled=false;_btn.style.opacity='1';}
  }
}

