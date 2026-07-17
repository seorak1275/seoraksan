'use strict';
// ══════════════════════════════════════════
// 구조 보고서 (1보 ~ n보 타임라인)
// ══════════════════════════════════════════
// 십자선 위치 보정은 CSS 변수(--map-voff, _applyMapVOff)로 일원화 — 인라인 top 지정 중복 제거
function updateRescueCross(){try{if(typeof _applyMapVOff==='function')_applyMapVOff();}catch(e){}}
function updateInspectCross(){try{if(typeof _applyMapVOff==='function')_applyMapVOff();}catch(e){}}
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
  showV('v-report');render1BoForm(gpsPre);
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
  // 이전 보 데이터: 이전 보고가 있으면 그것, 없으면 1보(r)
  const prevReport=r.reports&&r.reports.length>0?r.reports[r.reports.length-1]:null;
  // prefill: 1보 기본 정보 + 이전 보 변경사항 합쳐서
  const prefill={
    ...r,
    ...(prevReport||{}),
    _phaseNum: phaseNum+1,
    title: r.title,
    date: String(r.date||'').replace(' ','T')||now().replace(' ','T'), // 본 기록의 사고일시 그대로 (예전 now() 강제는 일시 오염 원인)
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
    type: (typeof _resolvedAccType==='function'&&document.getElementById('r_type'))?_resolvedAccType():(res[idx].type),
    date: document.getElementById('r_accdt')?.value?.replace('T',' ')||res[idx].date, // 미입력 시 기존 사고일시 유지 (예전 now() 폴백은 제출 시각으로 덮던 버그)
    weather: getSelPills('weatherPills')[0]||res[idx].weather||'',
    weatherAlert: getWeatherAlertStr(),
    location: document.getElementById('r_loc')?.value||res[idx].location,
    loctype: document.getElementById('r_loctype')?.value||res[idx].loctype,
    vName: document.getElementById('r_vName')?.value||res[idx].vName,
    vTel: document.getElementById('r_vTel')?.value||res[idx].vTel||'',
    vNation: document.getElementById('r_vNat')?.value||res[idx].vNation,
    vNationality: (document.getElementById('r_vNat')?.value==='외국인')?(document.getElementById('r_vAddr')?.value||res[idx].vNationality||''):(res[idx].vNationality||''),
    companions: getCompanions().length?getCompanions():res[idx].companions||[],
    victims2: getVictims2().length?getVictims2():res[idx].victims2||[],
    vGender: document.getElementById('r_vGender')?.value||res[idx].vGender,
    vBirth: document.getElementById('r_vBirth')?.value||res[idx].vBirth||'',
    vAddr: document.getElementById('r_vAddr')?.value||res[idx].vAddr||'',
    recvRoute: document.getElementById('r_recvRoute')?.value||res[idx].recvRoute||'119',
    hasRep: document.getElementById('r_hasRep')?.value||res[idx].hasRep||'n',
    repName: document.getElementById('r_repName')?.value||res[idx].repName||'',
    repTel: document.getElementById('r_repTel')?.value||res[idx].repTel||'',
    repRel: document.getElementById('r_repRel')?.value||res[idx].repRel||'',
    repBirth: document.getElementById('r_repBirth')?.value||res[idx].repBirth||'',
    repGender: document.getElementById('r_repGender')?.value||res[idx].repGender||'알수없음',
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
  // 정형 항목 전수 비교 — 새 값이 있고 전보와 다르면 전부 '변경 이력'에 기재 ('상태 유지' 뭉뚱그림 없음)
  [['사고유형','type'],['중증도','severity'],['위치','location'],['장소구분','loctype'],
   ['사고자','vName'],['전화','vTel'],['성별','vGender'],['내외국인','vNation'],['국적','vNationality'],
   ['생년월일','vBirth'],['거주지','vAddr'],['기저질환','vDisease'],['알레르기','vAllergy'],['복용약','vMeds'],
   ['신고자','repName'],['신고자 연락처','repTel'],['신고자 관계','repRel'],['신고자 생년월일','repBirth'],['신고자 성별','repGender'],
   ['부상부위','injuryParts'],['부상유형','injuryTypes'],['원인','cause'],['구조방법','rescueMethod'],
   ['음주','alcohol'],['음주량','alcAmount'],['병원후송','hospital'],['기상','weather'],['동원장비','equipment'],['119공조','r119'],['접수경로','recvRoute']].forEach(([label,key])=>{
    const a=_cv(prev[key]),b=_cv(phaseData[key]);
    if(!b||_BLANK2.includes(b))return;          // 새 값이 비면 '이어받기'라 변경 아님
    if(a===b)return;                             // 동일 → 변경 아님
    changes.push({label,from:_BLANK2.includes(a)?'(없음)':a,to:b});
  });
  // 명단형 항목(동반자·추가 사고자) — 이름 목록으로 비교
  const _nameList=v=>(Array.isArray(v)?v.map(x=>x&&(x.name||'')).filter(Boolean).join(', '):'');
  [['동반자','companions'],['추가 사고자','victims2']].forEach(([label,key])=>{
    const a=_nameList(prev[key]),b=_nameList(phaseData[key]);
    if(!b||a===b)return;
    changes.push({label,from:a||'(없음)',to:b});
  });
  // 활력징후 변경도 기록 (추이 파악용)
  try{
    const pv=prev.vitals||{},nv=phaseData.vitals||{};
    [['맥박','hr'],['SpO₂','spo2'],['체온','temp'],['의식','avpu'],['혈압','bp']].forEach(([label,k])=>{
      const a=String(pv[k]||'').trim(),b=String(nv[k]||'').trim();
      if(!b||a===b)return;
      changes.push({label:'활력·'+label,from:a||'(없음)',to:b});
    });
  }catch(e){}
  // 좌표: N보 폼에서 좌표를 바꿨으면 사고 위치도 갱신(작성자의 명시적 수정 — 원본 보존 + 이력 기록)
  try{
    const gpsN=(document.getElementById('r_gps')?.value||'').split(',');
    const nlat=parseFloat(gpsN[0]),nlng=parseFloat(gpsN[1]);
    if(!isNaN(nlat)&&!isNaN(nlng)&&nlat>=-90&&nlat<=90&&nlng>=-180&&nlng<=180){
      const moved=(res[idx].lat&&res[idx].lng)?_haversineKm(res[idx].lat,res[idx].lng,nlat,nlng)*1000:999999;
      if(moved>5){ // 5m 초과 이동 시에만(반올림 오차 무시)
        if(res[idx].origLat==null){res[idx].origLat=res[idx].lat;res[idx].origLng=res[idx].lng;} // 최초접수 원본 1회 보존
        res[idx].locLog=(res[idx].locLog||[]).concat([{from:{lat:res[idx].lat||0,lng:res[idx].lng||0},to:{lat:+nlat.toFixed(6),lng:+nlng.toFixed(6)},at:now(),by:phaseData.author,dist:Math.round(moved),via:(phaseData._phaseNum||'추가')+'보'}]);
        changes.push({label:'위치좌표',from:(res[idx].lat!=null?(+res[idx].lat).toFixed(5)+', '+(+res[idx].lng).toFixed(5):'(없음)'),to:nlat.toFixed(5)+', '+nlng.toFixed(5)});
        res[idx].lat=+nlat.toFixed(6);res[idx].lng=+nlng.toFixed(6);
        phaseData.lat=res[idx].lat;phaseData.lng=res[idx].lng;
      }
    }
  }catch(e){}
  // 사고일시: N보 폼에서 바꿨으면 본 기록에 반영(종료 후 정정 포함) — 변경 이력에 기록
  try{
    const nd=(document.getElementById('r_accdt')?.value||'').replace('T',' ');
    if(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(nd)&&nd.slice(0,16)!==String(res[idx].date||'').slice(0,16)){
      changes.push({label:'사고일시',from:res[idx].date||'(없음)',to:nd});
      res[idx].date=nd;phaseData.date=nd;
    }
  }catch(e){}
  phaseData.changes=changes;
  const diffs=changes.map(c=>`${c.label} ${c.from}→${c.to}`);
  if(phaseData.situation&&phaseData.situation!==prev.situation)diffs.push('경위 갱신');
  if(_ttInlineEntries.length)diffs.push(`타임라인 ${_ttInlineEntries.length}건 추가`);
  phaseData.update=diffs.join(' · ');   // 변경 없으면 빈값 — '상태 유지' 같은 뭉뚱그린 문구 사용 안 함
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
  try{renderRescueMap();}catch(e){}try{renderResList();}catch(e){} // 좌표 변경 즉시 지도 반영
  toast('✅ 추가 보고 저장 완료');
  try{document.getElementById('phaseBar').innerHTML='';}catch(e){}
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
let _tlWpResId=null;
let _tlTeams=[];
// team builder state
let _tlBuilding=false;
let _tlBuildType=null;     // 'nps'|'agency'
let _tlBuildMembers=[];
let _tlBuildOtherOpen=false;
let _tlBuildAgencyType='소방(구조)';
let _tlBuildRegion='';

function _hideRepFooter(){const f=document.getElementById('rep1BoFooter');if(f)f.style.display='none';}

// 부서·기관명 줄임 표시 (특수산악구조대→특구대 등 · 환동해처럼 짧게) — 자르지 않고 치환만
function _deptShort(n){let s=String(n||'');try{Object.entries(DEPT_SHORT).forEach(([k,v])=>{s=s.split(k).join(v);});}catch(e){}return s;}
// 팀 인원수: 명단이 있으면 명단 수, 없으면 입력된 인원수
function _teamCnt(t){return (t.members&&t.members.length)||t.memberCount||0;}

function _renderCreateBtnsHtml(){
  return `<div style="display:flex;gap:8px;margin-bottom:10px;">
    <button onclick="startTlBuild('nps')" style="flex:1;padding:11px 6px;border-radius:9px;background:rgba(79,168,208,.1);border:1px solid rgba(79,168,208,.3);color:#4fa8d0;font-size:12px;font-weight:700;cursor:pointer;">+ 공단 팀 출동</button>
    <button onclick="startTlBuild('agency')" style="flex:1;padding:11px 6px;border-radius:9px;background:rgba(126,200,163,.08);border:1px solid rgba(126,200,163,.25);color:#7ec8a0;font-size:12px;font-weight:700;cursor:pointer;">+ 유관기관 팀 출동</button>
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
    const _autoName=_deptShort(myDept||'공단')+' '+(_tlTeams.filter(t=>t.id&&t.id.startsWith('nps_')).length+1)+'팀';
    return `<div style="background:#0b1c30;border-radius:10px;padding:12px;border:.5px solid rgba(79,168,208,.3);margin-bottom:10px;">
      <div style="font-size:11px;color:#4fa8d0;font-weight:700;margin-bottom:10px;">🥾 공단 팀 출동</div>
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
    // 유관기관 팀 출동 — 환동해/구조/구급(모두 소방)·소방항공·경찰·산림청·민간구조협력단·기타
    // 유형 선택 → 소속 지역 칩(기본값) → 팀명 자동 생성(직접 수정 가능)
    const hw=getHwandonghaTeam();
    const agTypes=_agTypeList(hw);
    const sel=agTypes.find(a=>a.k===_tlBuildAgencyType)||agTypes[0];
    function agChip(ag){
      const on=_tlBuildAgencyType===ag.k;
      return `<div onclick="_selAgType('${ag.k.replace(/'/g,"\\'")}',${ag.mem||0})" class="tl-ag-chip"
        style="cursor:pointer;background:${on?'rgba(126,200,163,.2)':'rgba(255,255,255,.04)'};
        color:${on?'#7ec8a0':'rgba(255,255,255,.45)'};
        border:1px solid ${on?'rgba(126,200,163,.4)':'rgba(255,255,255,.12)'};
        border-radius:10px;font-size:10.5px;font-weight:700;padding:6px 4px;line-height:1.3;text-align:center;">
        ${ag.l}${ag.hwTeam?`<br><span style="font-size:9px;opacity:.75;">현재 ${ag.hwTeam}팀</span>`:''}
      </div>`;
    }
    return `<div style="background:#0b1c30;border-radius:10px;padding:12px;border:.5px solid rgba(126,200,163,.3);margin-bottom:10px;">
      <div style="font-size:11px;color:#7ec8a0;font-weight:700;margin-bottom:10px;">🚒 유관기관 팀 출동</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:10px;">
        ${agTypes.map(agChip).join('')}
      </div>
      ${sel.sub?`<div style="font-size:10px;color:#5a8aa0;margin-bottom:8px;">${_esc(sel.sub)}</div>`:''}
      ${(sel.regions&&sel.regions.length)?`<div style="font-size:10px;color:#4a7090;font-weight:700;margin-bottom:5px;">소속 선택</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;" id="tlRegionChips">
        ${sel.regions.map(rg=>`<div onclick="_selAgRegion('${rg.replace(/'/g,"\\'")}')" data-v="${_esc(rg)}"
          style="cursor:pointer;background:${_tlBuildRegion===rg?'rgba(79,168,208,.18)':'rgba(255,255,255,.04)'};color:${_tlBuildRegion===rg?'#4fa8d0':'rgba(255,255,255,.5)'};border:1px solid ${_tlBuildRegion===rg?'rgba(79,168,208,.45)':'rgba(255,255,255,.12)'};border-radius:16px;font-size:11px;font-weight:700;padding:5px 12px;">${_esc(rg)}</div>`).join('')}
      </div>`:''}
      <div style="display:flex;gap:7px;margin-bottom:10px;">
        <div style="flex:2;"><input id="tlBuildNameInput" type="text" class="fi" value="${_esc(_agTeamName(sel.k,_tlBuildRegion,hw))}" placeholder="팀 이름 (직접 수정 가능)" style="width:100%;box-sizing:border-box;"></div>
        <div style="flex:1;"><input id="tlBuildMemCount" type="number" inputmode="numeric" class="fi" value="${sel.mem||''}" placeholder="인원 수" min="0" max="99" style="width:100%;box-sizing:border-box;"></div>
      </div>
      <div style="display:flex;gap:7px;">
        <button onclick="cancelTlBuild()" style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:transparent;color:rgba(255,255,255,.45);font-size:12px;font-weight:600;cursor:pointer;">취소</button>
        <button onclick="confirmTlBuild()" style="flex:2;padding:8px;border-radius:8px;background:rgba(126,200,163,.15);border:1px solid rgba(126,200,163,.35);color:#7ec8a0;font-size:12px;font-weight:700;cursor:pointer;">확인</button>
      </div>
    </div>`;
  }
}
// 유관기관 유형 목록 — 환동해·구조·구급은 모두 소방. 지역 기본값: 구조·구급=속초/양양/인제/설악,
// 경찰=속초/양양/인제/광역, 소방항공=2항공대(양양)/1항공대(횡성), 민간구조협력단=외설악/내설악/용대
function _agTypeList(hw){
  return [
    {k:'소방(환동해)',l:'🔴 환동해',sub:`환동해특수대응단 · 소방 (오늘 ${hw}팀) 기본 5명`,mem:5,hwTeam:hw},
    {k:'소방(구조)',l:'🧗 구조',sub:'소방 구조대',mem:0,regions:['속초','양양','인제','설악']},
    {k:'소방(구급)',l:'🚑 구급',sub:'소방 구급대 · 기본 2명',mem:2,regions:['속초','양양','인제','설악']},
    {k:'소방(항공)',l:'🚁 소방항공',sub:'소방 항공대 (헬기)',mem:0,regions:['2항공대(양양)','1항공대(횡성)']},
    {k:'경찰',l:'👮 경찰',sub:'경찰',mem:0,regions:['속초','양양','인제','광역']},
    {k:'산림청(헬기)',l:'🌲 산림청',sub:'산림청 헬기 출동',mem:0},
    {k:'민간구조협력단',l:'🤝 민간',sub:'민간구조협력단',mem:0,regions:['외설악','내설악','용대']},
    {k:'기타',l:'➕ 기타',sub:'타 기관 — 이름 직접 입력',mem:0},
  ];
}
// 유형+지역 → 팀명 자동 생성 (팀명 입력칸에서 자유 수정 가능)
function _agTeamName(k,region,hw){
  switch(k){
    case '소방(환동해)':return '환동해 '+(hw||getHwandonghaTeam())+'팀';
    case '소방(구조)':return region?region+' 구조대':'구조대';
    case '소방(구급)':return region?region+' 구급대':'구급대';
    case '소방(항공)':return region?'소방 '+region:'소방 항공대';
    case '경찰':return region?region+' 경찰':'경찰';
    case '민간구조협력단':return region?region+' 민간구조협력단':'민간구조협력단';
    case '산림청(헬기)':return '산림청 헬기';
    default:return '유관기관';
  }
}
function _selAgType(k,defaultMem){
  _tlBuildAgencyType=k;
  _tlBuildRegion=''; // 유형 바꾸면 지역 초기화
  const ba=document.getElementById('tlBuildArea');
  if(ba)ba.innerHTML=_renderBuildPanelHtml();
  setTimeout(()=>{const mc=document.getElementById('tlBuildMemCount');if(mc&&defaultMem)mc.value=defaultMem;},0);
}
// 지역 칩 선택 → 팀명 자동 갱신 (재탭 시 해제)
function _selAgRegion(rg){
  _tlBuildRegion=_tlBuildRegion===rg?'':rg;
  const ba=document.getElementById('tlBuildArea');
  if(ba)ba.innerHTML=_renderBuildPanelHtml();
}

function startTlBuild(type){
  _tlBuilding=true;_tlBuildType=type;_tlBuildMembers=[];_tlBuildOtherOpen=false;
  _tlBuildAgencyType='소방(구조)';_tlBuildRegion='';
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
  if(_tlBuildType==='nps'){
    if(!_tlBuildMembers.length){toast('⚠️ 팀원을 선택하세요');return;}
    const _user=DB.g('currentUser')||{};
    const _dept=_deptShort(_user.dept||'공단');
    const _npsNum=_tlTeams.filter(t=>t.id&&t.id.startsWith('nps_')).length+1;
    const name=(nameEl&&nameEl.value.trim())||(_dept+' '+_npsNum+'팀');
    _tlTeams.push({id:'nps_'+Date.now(),name,type:'foot',members:_tlBuildMembers.slice(),requestedAt:now(),arrivedAt:null,createdAt:new Date().toISOString()});
  }else{
    const memCount=parseInt(document.getElementById('tlBuildMemCount')?.value||'0')||0;
    // 환동해는 3교대 — 오늘 당직팀 번호를 팀명에 반영해 현장 혼선 방지
    const hw=getHwandonghaTeam();
    const name=(nameEl&&nameEl.value.trim())||_agTeamName(_tlBuildAgencyType,_tlBuildRegion,hw);
    const isHeli=_tlBuildAgencyType==='소방(항공)'||_tlBuildAgencyType.includes('헬기')||_tlBuildAgencyType.includes('산림청');
    const isVehicle=!isHeli&&['소방','경찰'].some(k=>_tlBuildAgencyType===k||_tlBuildAgencyType.startsWith(k));
    const type=isHeli?'heli':isVehicle?'vehicle':'foot';
    // requestedAt=출동요청 시각(생성시점), arrivedAt=현장도착(별도 기록)
    _tlTeams.push({id:'agency_'+Date.now(),name,type,agType:_tlBuildAgencyType,agRegion:_tlBuildRegion||'',hwTeam:_tlBuildAgencyType==='소방(환동해)'?hw:null,memberCount:memCount,requestedAt:now(),arrivedAt:null,createdAt:new Date().toISOString()});
  }
  _tlBuilding=false;
  _persistTeams(); // save to Firestore so rescue map can show team chips
  _rerenderTlFull();
}

function _initTlTeams(r){
  if(_tlWpResId===r.id&&(_tlTeams.length||_tlBuilding))return;
  _tlWpResId=r.id;_tlBuilding=false;
  _tlBuildType=null;_tlBuildMembers=[];_tlBuildOtherOpen=false;_tlBuildAgencyType='소방(구조)';_tlBuildRegion='';
  // Load persisted teams from rescue record
  _tlTeams=(r.teams&&r.teams.length)?r.teams.map(t=>({...t})):[];
}

function _snapshotTeams(){
  return _tlTeams.map(t=>({id:t.id,name:t.name,type:t.type,members:(t.members||[]).slice(),agType:t.agType||null,agRegion:t.agRegion||'',hwTeam:t.hwTeam||null,memberCount:t.memberCount||0,requestedAt:t.requestedAt||t.createdAt||null,arrivedAt:t.arrivedAt||null,createdAt:t.createdAt||null}));
}
function _persistTeams(){
  if(!_tlWpResId)return;
  const _res=DB.g('rescues')||[];const _ri=_res.findIndex(x=>x.id===_tlWpResId);
  if(_ri<0)return;
  _res[_ri].teams=_snapshotTeams();
  DB.s('rescues',_res);
}

// 현장도착 시각 기록 (유관기관 공식기록: 출동요청↔현장도착 구분)
function tlMarkArrival(idx){
  const team=_tlTeams[idx];if(!team)return;
  team.arrivedAt=now();
  _persistTeams();_rerenderTlFull();
  toast('🏁 '+team.name+' 현장도착 '+String(team.arrivedAt).slice(11,16));
}
// 백그라운드 복귀 시: 날씨가 끝내 안 떠 있으면(첫 로드 실패) 다시 시도
document.addEventListener('visibilitychange',function(){
  if(document.hidden)return;
  var _ws=document.getElementById('weatherStrip');
  if(_ws&&_ws.style.display==='none'){try{fetchWeather();}catch(e){}}
});

function _tlTeamFullHtml(team,idx){
  const cnt=_teamCnt(team);
  const _req=team.requestedAt?String(team.requestedAt).slice(11,16):'';
  const _arr=team.arrivedAt?String(team.arrivedAt).slice(11,16):'';
  const mems=(team.members||[]);
  const memStr=mems.length?mems.map(m=>_esc(m)).join('·'):'';
  return `<div id="tlTeamCard_${idx}" style="display:flex;align-items:center;gap:6px;padding:6px 0;border-top:.5px solid rgba(255,255,255,.05);">
    <span style="font-size:12px;font-weight:700;color:#c8dff0;flex-shrink:0;">${_teamIco(team)} ${_esc(_deptShort(team.name))}</span>
    ${cnt?`<span style="font-size:10px;color:#7dd3fa;font-weight:700;flex-shrink:0;">${cnt}명</span>`:''}
    <span style="flex:1;min-width:0;font-size:10.5px;color:rgba(255,255,255,.55);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${memStr?'👥 '+memStr:''}</span>
    ${_req?`<span style="font-size:9.5px;color:#7a96ad;flex-shrink:0;">🚨${_req}</span>`:''}
    ${_arr?`<span style="font-size:9.5px;color:#3ad17a;flex-shrink:0;">🏁${_arr}</span>`:`<button onclick="event.stopPropagation();tlMarkArrival(${idx})" style="flex-shrink:0;background:rgba(39,174,96,.12);border:1px solid rgba(39,174,96,.35);color:#5dbf8a;border-radius:6px;font-size:9.5px;font-weight:700;padding:2px 7px;cursor:pointer;">🏁 도착</button>`}
  </div>`;
}
// 출동팀 카드 헤더: 팀 수 + 총 인원
function _tlTeamsHdrHtml(){
  const tot=_tlTeams.reduce((a,t)=>a+_teamCnt(t),0);
  return `🚑 출동팀${_tlTeams.length?' '+_tlTeams.length:''}${tot?` <span style="color:#7dd3fa;">· 총 ${tot}명</span>`:''}`;
}
function _tlTeamRowsHtml(){
  return _tlTeams.length?_tlTeams.map((t,i)=>_tlTeamFullHtml(t,i)).join('')
    :'<div style="font-size:11px;color:rgba(255,255,255,.3);padding:3px 0 5px;">아직 출동한 팀 없음</div>';
}

function _rerenderTlFull(){
  const el=document.getElementById('tlAllTeams');
  if(el)el.innerHTML=_tlTeamRowsHtml();
  const hd=document.getElementById('tlTeamHdr');
  if(hd)hd.innerHTML=_tlTeamsHdrHtml();
  if(!_tlBuilding){const ba=document.getElementById('tlBuildArea');if(ba)ba.innerHTML=_renderCreateBtnsHtml();}
}


// ── 타임라인 '📌 기록' 카드 (인라인): 누가(팀) · 무엇을(버튼/직접입력) · 언제(기본 지금, 과거 가능) ──
let _tlRecTeam='',_tlRecStage='';
function _tlRecSelTeam(el){
  const v=el.dataset.v||'';
  _tlRecTeam=_tlRecTeam===v?'':v; // 재탭 시 해제
  document.querySelectorAll('#tlRecTeams .pill').forEach(p=>p.classList.toggle('on',p.dataset.v===_tlRecTeam&&_tlRecTeam!==''));
}
function _tlRecSelStage(el){
  const v=el.dataset.v||'';
  _tlRecStage=_tlRecStage===v?'':v; // 재탭 시 해제
  document.querySelectorAll('#tlRecStages .pill').forEach(p=>p.classList.toggle('on',p.dataset.v===_tlRecStage&&_tlRecStage!==''));
  const cw=document.getElementById('tlRecCustomWrap');
  if(cw){cw.style.display=_tlRecStage==='__custom'?'block':'none';if(_tlRecStage==='__custom')setTimeout(()=>{try{document.getElementById('tlRecCustom').focus();}catch(e){}},50);}
  const cpr=document.getElementById('tlRecCprWrap');
  if(cpr)cpr.style.display=_tlRecStage==='심정지'?'block':'none';
}
function _tlRecSave(rid){
  let stage=_tlRecStage;
  if(stage==='__custom')stage=(document.getElementById('tlRecCustom')?.value||'').trim();
  if(!stage){toast('무엇을 했는지 선택하거나 직접 입력하세요');return;}
  const timeRaw=document.getElementById('tlRecTime')?.value||'';
  const time=timeRaw?timeRaw.replace('T',' '):now();
  const entry={stage,time,note:(document.getElementById('tlRecNote')?.value||'').trim(),by:getAuthor(),team:_tlRecTeam&&_tlRecTeam!=='본부'?_tlRecTeam:(_tlRecTeam==='본부'?'본부':'')};
  if(_tlRecStage==='심정지'){
    const cs=document.getElementById('tlRecCprStart')?.value||'';
    const ce=document.getElementById('tlRecCprEnd')?.value||'';
    if(cs)entry.cprStart=cs.replace('T',' ');
    if(ce)entry.cprEnd=ce.replace('T',' ');
    const aedY=document.getElementById('tlRecAedY');
    entry.aed=(aedY&&aedY._v)?'사용':'미사용';
  }
  const res=DB.g('rescues')||[];const idx=res.findIndex(x=>x.id===rid);if(idx===-1)return;
  if(!res[idx].timetable)res[idx].timetable=[];
  res[idx].timetable.push(entry);
  // ── 기록 ↔ 보고서 연동: 타임라인 기록이 보고서 정형 필드에도 자동 반영 (이미 있으면 건드리지 않음) ──
  const _synced=[];
  try{
    const rec=res[idx];
    if(stage==='심정지'){
      rec.injuries=Array.isArray(rec.injuries)?rec.injuries:[];
      if(!rec.injuries.some(i=>i&&i.type==='심정지')){rec.injuries.push({type:'심정지',part:'전신',side:'',cat:'내상'});_synced.push('부상에 심정지');}
      if(!rec.severity){rec.severity='KTAS 1 (소생)';_synced.push('중증도 KTAS 1');}
    }
    if(stage==='헬기 요청'||stage==='헬기 도착'){
      rec.rescueMethod=Array.isArray(rec.rescueMethod)?rec.rescueMethod:[];
      if(!rec.rescueMethod.includes('헬기')){rec.rescueMethod.push('헬기');_synced.push('구조방법에 헬기');}
    }
  }catch(e){}
  DB.s('rescues',res);
  _tlRecTeam='';_tlRecStage='';
  if(typeof _hapt==='function')_hapt(8);
  toast('📌 기록됨: '+stage+(_synced.length?' — 📄 보고서에 자동 반영: '+_synced.join(', '):''));
  renderTimeline(res[idx],'advanced');
}
// 상황일지 엔트리 수집(공용) — 화면(_buildLogHtml)과 한글 보고서 생성이 함께 사용
function _collectLogEntries(r){
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
    // 누가 표기: 팀은 제목 앞에, 작성자는 서브에
    if(e.by)sub=sub?sub+' — '+e.by:e.by;
    logEntries.push({k:_tKey(e.time),t:_tShow(e.time),ico:e.stage==='심정지'?'💔':isVictim?'🎯':'📌',label:(e.team?e.team+' · ':'')+e.stage,sub,type:isVictim?'victim':'team'});
  });
  // 위치통과: "01-15 통과" (팀명은 서브)
  (r.wpLog||[]).forEach(l=>{
    logEntries.push({k:_tKey(l.time),t:l.time,ico:'📍',label:(l.code||'?')+' 통과',sub:l.teamName||'',type:'team',pass:true});
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
  return logEntries;
}
function _buildLogHtml(r){
  const logEntries=_collectLogEntries(r);
  if(!logEntries.length)return '';
  // 타입별 색상
  const TYPE_COL={victim:'#e74c3c',team:'#4fa8d0',report:'#9b59b6',nps:'#27ae60'};
  const TYPE_BG={victim:'rgba(231,76,60,.1)',team:'rgba(79,168,208,.08)',report:'rgba(155,89,182,.08)',nps:'rgba(39,174,96,.08)'};
  const isWpPass=e=>e.type==='team'&&e.ico==='📍';
  const wpCount=logEntries.filter(isWpPass).length;
  const collapseWp=wpCount>=4; // 통과 기록이 많으면 기본 접힘 — 주요 이벤트만 한눈에
  const rows=logEntries.map((e,i)=>{
    const col=TYPE_COL[e.type]||'#7a9cb8';
    const bg=TYPE_BG[e.type]||'transparent';
    const isLast=i===logEntries.length-1;
    return `<div class="${isWpPass(e)?'log-wp':''}" style="display:${(collapseWp&&isWpPass(e))?'none':'flex'};gap:0;position:relative;">
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
  return `<div class="slog-box" style="background:#060d1a;border-radius:10px;padding:11px 13px;margin-top:8px;border:.5px solid rgba(79,168,208,.15);">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;">
      <span style="font-size:11px;color:#4fa8d0;font-weight:700;">📜 상황 일지</span>
      ${collapseWp?`<button data-on="0" data-n="${wpCount}" onclick="_toggleWpLog(this)" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.5);border-radius:10px;padding:2px 9px;font-size:10px;font-weight:700;cursor:pointer;">📍 통과 ${wpCount}건 보기</button>`:''}
    </div>
    ${legend}${rows}
  </div>`;
}
// 상황일지의 '지점 통과' 기록 접기/펼치기 (기본 접힘 — 주요 이벤트 위주 표시)
function _toggleWpLog(btn){
  const box=btn.closest('.slog-box');if(!box)return;
  const open=btn.dataset.on==='1';
  btn.dataset.on=open?'0':'1';
  box.querySelectorAll('.log-wp').forEach(x=>{x.style.display=open?'none':'flex';});
  btn.textContent=open?('📍 통과 '+(btn.dataset.n||'')+'건 보기'):'📍 통과 기록 접기';
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
// ══════════════════════════════════════════
// HWPX 템플릿 엔진 — 관리자가 올린 실제 한글 서식(.hwpx)의 {{자리표시자}}를 데이터로 치환해
// 진짜 한글파일 생성 (서식·글꼴·표가 원본과 100% 동일). ZIP은 브라우저 내장 스트림으로 처리.
// ══════════════════════════════════════════
const HWPX_PLACEHOLDERS=['사건명','사고일시','접수경로','출동시간','조우시간','완료시간','출동거리','사고장소','좌표','장소구분','신고자 이름','신고자 연락처','신고자 생년월일, 성별','사고자 관계','사고자 이름','사고자 생년월일, 성별','사고자 연락처','사고자 거주지, 국가','사고원인','부상유형','사고경위','조치내용','동원인원','동원장비','병원이송','특이사항','음주여부','기상','중증도','활력징후','동반자','추가사고자','접수내용','응소','작성자','오늘'];
async function _zipRead(buf){ // ArrayBuffer → [{name,data:Uint8Array}]
  const dv=new DataView(buf);const u8=new Uint8Array(buf);
  let e=buf.byteLength-22;
  while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;
  if(e<0)throw new Error('ZIP 형식이 아님');
  const cnt=dv.getUint16(e+10,true);let off=dv.getUint32(e+16,true);
  const out=[];
  for(let i=0;i<cnt;i++){
    if(dv.getUint32(off,true)!==0x02014b50)throw new Error('ZIP 목록 손상');
    const method=dv.getUint16(off+10,true);
    const csize=dv.getUint32(off+20,true);
    const nlen=dv.getUint16(off+28,true),elen=dv.getUint16(off+30,true),clen=dv.getUint16(off+32,true);
    const lho=dv.getUint32(off+42,true);
    const name=new TextDecoder().decode(u8.subarray(off+46,off+46+nlen));
    const lnlen=dv.getUint16(lho+26,true),lelen=dv.getUint16(lho+28,true);
    const dstart=lho+30+lnlen+lelen;
    const cdata=u8.slice(dstart,dstart+csize);
    let data;
    if(method===0)data=cdata;
    else if(method===8){
      const resp=new Response(new Blob([cdata]).stream().pipeThrough(new DecompressionStream('deflate-raw')));
      data=new Uint8Array(await resp.arrayBuffer());
    }else throw new Error('미지원 압축방식 '+method);
    out.push({name,data});
    off+=46+nlen+elen+clen;
  }
  return out;
}
function _crc32(u8){
  let t=window.__crcT;
  if(!t){t=window.__crcT=new Int32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c;}}
  let crc=-1;for(let i=0;i<u8.length;i++)crc=(crc>>>8)^t[(crc^u8[i])&0xFF];
  return (crc^-1)>>>0;
}
function _zipWrite(files){ // [{name,data}] → Blob (무압축 저장 — hwpx는 작아서 무압축 OK)
  const enc=new TextEncoder();const parts=[];const cd=[];let off=0;
  files.forEach(f=>{
    const nm=enc.encode(f.name);const crc=_crc32(f.data);
    const lh=new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);
    lh.setUint32(14,crc,true);lh.setUint32(18,f.data.length,true);lh.setUint32(22,f.data.length,true);
    lh.setUint16(26,nm.length,true);
    parts.push(new Uint8Array(lh.buffer),nm,f.data);
    const ch=new DataView(new ArrayBuffer(46));
    ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);
    ch.setUint32(16,crc,true);ch.setUint32(20,f.data.length,true);ch.setUint32(24,f.data.length,true);
    ch.setUint16(28,nm.length,true);ch.setUint32(42,off,true);
    cd.push(new Uint8Array(ch.buffer),nm);
    off+=30+nm.length+f.data.length;
  });
  let cdSize=0;cd.forEach(p=>cdSize+=p.length);
  const eo=new DataView(new ArrayBuffer(22));
  eo.setUint32(0,0x06054b50,true);eo.setUint16(8,files.length,true);eo.setUint16(10,files.length,true);
  eo.setUint32(12,cdSize,true);eo.setUint32(16,off,true);
  return new Blob([...parts,...cd,new Uint8Array(eo.buffer)]);
}
// XML 안 {{키}} 치환 — 여러 줄 값은 한글 줄바꿈(<hp:lineBreak/>)으로. 남은 자리표시자는 비움
function _hwpxFill(entries,map){
  const dec=new TextDecoder(),enc=new TextEncoder();
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  // 자리표시자를 감싼 <hp:p ...> / <hp:run ...> 여는 태그를 그대로 찾아 재사용 (문단 분리용)
  const tagBefore=(s,idx,open)=>{var at=s.lastIndexOf(open,idx);if(at<0)return null;var gt=s.indexOf('>',at);return (gt>=0&&gt<idx)?s.slice(at,gt+1):null;};
  return entries.map(en=>{
    if(!/\.(xml|hpf)$/i.test(en.name))return en;
    let s=dec.decode(en.data);
    if(s.indexOf('{{')<0)return en;
    Object.entries(map).forEach(([k,v])=>{
      const ph='{{'+k+'}}';
      const val=String(v==null?'':v);
      let idx;
      while((idx=s.indexOf(ph))>=0){
        let repl;
        if(val.indexOf('\n')<0){
          repl=esc(val);
        }else{
          // 여러 줄: 각 줄을 개별 문단(<hp:p>)으로 만들어 진짜 줄바꿈(엔터) 생성
          const pOpen=tagBefore(s,idx,'<hp:p ')||'<hp:p>';
          const rOpen=tagBefore(s,idx,'<hp:run ')||'<hp:run>';
          repl=val.split('\n').map(esc).join('</hp:t></hp:run></hp:p>'+pOpen+rOpen+'<hp:t>');
        }
        s=s.slice(0,idx)+repl+s.slice(idx+ph.length);
      }
    });
    s=s.replace(/\{\{[^{}]{1,24}\}\}/g,''); // 값 없는 자리표시자 제거
    // 캐시된 줄 배치(linesegarray) 제거 → 한글이 재배치(자간 압축 방지)
    s=s.replace(/<hp:linesegarray>[\s\S]*?<\/hp:linesegarray>/g,'');
    return {name:en.name,data:enc.encode(s)};
  });
}
// 문서 미리보기 인앱 오버레이 — 새 창 대신(PWA/앱에서 뒤로 못 돌아오는 문제 해결). ← 앱으로 버튼 + 🖨 인쇄
function _docPreviewOverlay(docHtml,title){
  try{_busyDone&&_busyDone();}catch(e){}
  let ov=document.getElementById('docPrevOv');if(ov)ov.remove();
  ov=document.createElement('div');ov.id='docPrevOv';
  ov.style.cssText='position:fixed;inset:0;z-index:99990;background:#222;display:flex;flex-direction:column;';
  ov.innerHTML='<div style="flex-shrink:0;display:flex;gap:8px;padding:calc(8px + env(safe-area-inset-top)) 12px 8px;background:#0a1828;align-items:center;border-bottom:1px solid rgba(255,255,255,.1);">'
    +'<button id="docPrevBack" class="press-fx" style="background:rgba(79,168,208,.15);border:1px solid rgba(79,168,208,.4);color:#4fa8d0;border-radius:8px;padding:9px 14px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;">← 앱으로</button>'
    +'<span style="flex:1;font-size:12px;color:#cfe2f2;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(title||'문서')+'</span>'
    +'<button id="docPrevPrint" class="press-fx" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);color:#cfe2f2;border-radius:8px;padding:9px 14px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;">🖨 인쇄</button></div>'
    +'<iframe id="docPrevFrame" style="flex:1;border:none;background:#fff;width:100%;"></iframe>';
  document.body.appendChild(ov);
  const fr=document.getElementById('docPrevFrame');
  fr.srcdoc=docHtml;
  document.getElementById('docPrevBack').onclick=function(){ov.remove();};
  document.getElementById('docPrevPrint').onclick=function(){try{fr.contentWindow.focus();fr.contentWindow.print();}catch(e){toast('⚠️ 인쇄 실패 — 파일 저장 후 인쇄하세요');}};
}
async function _hwpxGenFromBuf(buf,map,fname){
  const entries=await _zipRead(buf);
  const blob=_zipWrite(_hwpxFill(entries,map));
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=fname;
  document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),2000);
  try{_busyDone&&_busyDone();}catch(e){}
  toast('📄 한글파일(hwpx) 생성 완료 — 한글에서 열어 확인하세요',5000);
}
async function _hwpxGenerate(tpl,map,fname){
  const bin=atob(tpl.b64);
  const buf=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)buf[i]=bin.charCodeAt(i);
  await _hwpxGenFromBuf(buf.buffer,map,fname);
}
// ══════════════════════════════════════════
// 관공서 양식 보고서 (한글용) — 등록된 hwpx 서식이 있으면 그걸로 진짜 한글파일 생성(우선),
// 없으면 HTML 재현본(복사→한글 붙여넣기 / .html 저장) 폴백
// ══════════════════════════════════════════
async function govReport(rid,kind,noPass){
  let r=(DB.g('rescues')||[]).find(x=>String(x.id)===String(rid));if(!r){toast('⚠️ 사고 정보 없음');return;}
  r=_mergedRescue(r);
  const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const nb=v=>{const s=String(v==null?'':v).trim();return (s&&s!=='-'&&!['미상','없음','모르겠음','알수없음','미정','해당없음'].includes(s))?s:'';};
  // ── 공통 데이터 가공 ──
  const injStr=(Array.isArray(r.injuries)&&r.injuries.length)
    ? r.injuries.map(i=>(typeof _injLabel==='function')?_injLabel(i):((i.part||'')+(i.type||''))).filter(Boolean).join(', ')
    : [(r.injuryParts||[]).join(','),(r.injuryTypes||[]).join(',')].filter(Boolean).join(' / ');
  let _logSrc=_collectLogEntries(r);
  if(noPass)_logSrc=_logSrc.filter(e=>!e.pass); // 통과 기록 제외본
  const logs=_logSrc.map(e=>({t:e.t,txt:e.label.replace(/^[^\w가-힣0-9]+\s?/,'')+(e.sub?' ('+e.sub+')':'')}));
  const logLines=logs.map(l=>'  - '+l.t+' '+l.txt); // 띄어쓰기2 + '- ' + 시간 + 상황, 항목마다 줄바꿈
  // 동원인원 집계: 공단 대원 + 유관기관 팀(인원수)
  const npsNames=[...(r.members||[]),...((r.extraMembers||[]).map(m=>m.name||m))].filter(Boolean);
  const agTeams=(r.teams||[]).filter(t=>t.id&&String(t.id).startsWith('agency_'));
  const npsTeams=(r.teams||[]).filter(t=>!t.id||!String(t.id).startsWith('agency_'));
  const teamMemberNames=[...new Set(npsTeams.flatMap(t=>t.members||[]))];
  const allNps=[...new Set([...npsNames,...teamMemberNames])];
  const agStr=agTeams.map(t=>t.name+(t.memberCount?' '+t.memberCount+'명':'')).join(', ');
  const totalCnt=allNps.length+agTeams.reduce((s,t)=>s+(+t.memberCount||0),0);
  const mobStr=(r.mobilize||[]).join(', ');
  const signCode=(r.lat&&r.lng&&typeof _nearestSignFull==='function')?(()=>{try{const s=_nearestSignFull(r.lat,r.lng);return s?s.code+(s.dist?' ('+s.dist+'m)':''):'';}catch(e){return '';}})():'';
  const coordStr=(r.lat&&r.lng)?(+r.lat).toFixed(6)+', '+(+r.lng).toFixed(6):'';
  const elevS=(typeof _elevStr==='function'&&r.lat&&r.lng)?_elevStr(r.lat,r.lng,r.alt,true).replace('⛰',''):''; // plain=true: 문서용 순수 문자열
  const vAgeStr=nb(r.vBirth)?(r.vBirth+(nb(r.vGender)?'/'+r.vGender:'')):(nb(r.vGender)?r.vGender:'');
  const compStr=(r.companions||[]).map(c=>(c.name||'미상')+(c.tel?'('+c.tel+')':'')).join(', ');
  const v2Str=(r.victims2||[]).map(v=>[(v.name||'미상'),v.age?v.age+'세':'',(v.gender&&v.gender!=='알수없음')?v.gender:'',v.note||''].filter(Boolean).join(' ')).join(' / ');
  const vitalS=(r.vitals&&typeof _vitalsStr==='function')?(_vitalsStr(r.vitals)||''):'';
  const wxStr=[nb(r.weather),(r.initTemp!=null&&r.initTemp!=='')?r.initTemp+'°C':'',nb(r.weatherAlert)].filter(Boolean).join(' · ');
  // 양식에 없는 정보 → '추가 정보' 표로 문서 하단에 전부 수록
  const extraRows=[
    ['기상',wxStr],['고도',elevS],['중증도',nb(r.severity)],['활력징후',vitalS],
    ['동반자',compStr],['추가 사고자',v2Str],['응소',mobStr],['접수내용',nb(r.reception)],
    ['국적',nb(r.vNation)==='외국인'?('외국인'+(nb(r.vNationality)?' ('+r.vNationality+')':'')):''],
    ['과태료',nb(r.fine)],['암빙벽 허가',nb(r.permit)==='해당없음'?'':nb(r.permit)],['기타 특이사항',nb(r.extra)],
  ].filter(([k,v])=>v);
  // ── 등록된 hwpx 서식이 있으면 진짜 한글파일로 생성 (서식 100% 동일) ──
  const dataMap={
    '사건명':nb(r.title),'사고일시':r.date||'','접수경로':nb(r.recvRoute)||'119',
    '출동시간':nb(r.dispatch),'도착시간':nb(r.arrival),'완료시간':nb(r.completion),'출동거리':nb(r.distance),
    '사고장소':nb(r.location),'좌표':coordStr,'고도':elevS,'장소구분':nb(r.loctype),'위치표지판':signCode,
    '신고자성명':nb(r.repName),'신고자연락처':nb(r.repTel),'신고자관계':nb(r.repRel),
    '사고자성명':nb(r.vName),'사고자생년월일':nb(r.vBirth),'사고자성별':nb(r.vGender),
    '사고자연락처':nb(r.vTel),'사고자거주지':nb(r.vAddr),
    '사고원인':nb(r.cause),'부상유형':injStr,'사고경위':nb(r.situation),
    '조치내용':logLines.join('\n'),
    '동원인원':'[총 '+totalCnt+'명]\n- 국립공원 '+allNps.length+'명'+(allNps.length?'('+allNps.join(', ')+')':'')+(agStr?'\n- 유관기관: '+agStr:''),
    '동원인원수':String(totalCnt),
    '동원장비':nb(r.equipment),'병원후송':nb(r.hospital),'특이사항':nb(r.extra),
    '음주여부':nb(r.alcohol)==='없음'||!nb(r.alcohol)?'X':nb(r.alcohol)+(nb(r.alcAmount)?'('+r.alcAmount+')':''),
    '기상':wxStr,'작성자':(typeof getAuthor==='function')?getAuthor():'','오늘':now(),
  };
  // 실제 서식(내장 tpl-status.hwpx)에 쓰인 자리표시자 별칭 — 서식 작성자가 쓴 이름 그대로 지원
  const rrChk=[['119','119'],['사무소 전화','사무소전화접수'],['현장 접수','현장접수']].map(([k,l])=>((nb(r.recvRoute)||'119')===k?'■':'□')+l).join(' ');
  Object.assign(dataMap,{
    '접수경로':rrChk,                                   // 서식 칸엔 체크박스 문자열로
    '조우시간':nb(r.arrival),                            // 도착(조우)시간
    '신고자 이름':nb(r.repName),'신고자 연락처':nb(r.repTel),
    '신고자 생년월일, 성별':[nb(r.repBirth),(nb(r.repGender)&&r.repGender!=='알수없음')?r.repGender:''].filter(Boolean).join('/'),
    '사고자 이름':nb(r.vName),'사고자 연락처':nb(r.vTel),
    '사고자 생년월일, 성별':vAgeStr,
    '사고자 관계':nb(r.repRel),
    '사고자 거주지, 국가':(nb(r.vNation)==='외국인'?'[외국인] ':'')+nb(r.vAddr), // 외국인이면 거주지 칸=국가
    '병원이송':nb(r.hospital),
    '사고장소':nb(r.location)+(signCode?' ('+signCode+')':''),
    '좌표':coordStr+(elevS?' · 고도 '+elevS:''),
    '부상유형':injStr+(nb(r.severity)?' ('+r.severity+')':''),  // 중증도(KTAS) 병기
    '부상사진':'','이송 사진':'',                        // 이미지 자동삽입 미지원 — 한글에서 붙여넣기(자리 비움)
    // 서식에 추가하면 자동으로 채워지는 확장 자리표시자
    '중증도':nb(r.severity),'활력징후':vitalS,'동반자':compStr,'추가사고자':v2Str,
    '접수내용':nb(r.reception),'응소':mobStr,
    // 동향보고 전용
    '사고유형':nb(r.type)||'안전사고',
    '개요':'본 건은 '+(r.date||'')+'경 '+(nb(r.location)||'설악산 일원')+'에서 발생한 '+(nb(r.cause)||r.type||'안전사고')+' 관련, 119와 설악산사무소에서 공동대응한 사항임',
    '인적사항':['- 사고자: '+(nb(r.vName)||'미상')+(vAgeStr?'('+vAgeStr+')':'')+(nb(r.vTel)?' · '+r.vTel:''),v2Str?'- 추가 사고자: '+v2Str:'',compStr?'- 동반자: '+compStr:''].filter(Boolean).join('\n'),
    '사고원인분석':['- '+(nb(r.cause)||'-')+(injStr?' / '+injStr:'')+(nb(r.severity)?' ('+r.severity+')':''),nb(r.situation)?'- '+r.situation:''].filter(Boolean).join('\n'),
  });
  const _fname=(kind==='status'?'안전사고처리현황'+(noPass?'(통과제외)':'(통과포함)'):'동향보고')+'_'+((r.date||'').slice(0,10)||'문서')+'.hwpx';
  try{
    _busy('📄 한글파일 생성 중…\n잠시만 기다려 주세요'); // 완료(미리보기/다운로드)까지 유지
    // 1) 관리자 업로드 서식(Firestore) 우선 — 오프라인이면 건너뛰고 내장 서식으로
    if(typeof _fdb!=='undefined'&&_fdb&&navigator.onLine){
      try{
        const tdoc=await _fdb.collection('tpl').doc(kind).get();
        if(tdoc.exists&&tdoc.data()&&tdoc.data().b64){
          await _hwpxGenerate(tdoc.data(),dataMap,_fname);
          return;
        }
      }catch(e){}
    }
    // 2) 앱 내장 서식 (실제 결재 서식 기반 — 처리현황·동향보고)
    const resp=await fetch(kind==='status'?'./tpl-status.hwpx':'./tpl-trend.hwpx');
    if(resp.ok){
      await _hwpxGenFromBuf(await resp.arrayBuffer(),dataMap,_fname);
      return;
    }
  }catch(e){try{_busyDone&&_busyDone();}catch(_){}try{toast('⚠️ 서식 생성 실패('+(e&&e.message||e)+') — HTML 방식으로 대체');}catch(_){}}
  // ── 폴백: HTML 재현본 ──
  const th='border:1px solid #000;padding:5px 7px;font-weight:700;text-align:center;font-size:12.5px;white-space:nowrap;background:#fff;';
  const td='border:1px solid #000;padding:5px 8px;font-size:12.5px;line-height:1.5;';
  let body='',title='';
  if(kind==='status'){
    title='탐방객 안전사고 처리현황';
    const rr=nb(r.recvRoute)||'119';
    const rrStr=[['119','119'],['사무소 전화','사무소전화접수'],['현장 접수','현장접수']].map(([k,lbl])=>(rr===k?'■':'□')+lbl).join(' ');
    // 결재란(우측 상단) + 제목 한 줄 배치 — 원본과 동일
    body=`
    <table style="border-collapse:collapse;width:100%;margin-bottom:8px;"><tr>
      <td style="border:none;vertical-align:bottom;font-size:20px;font-weight:800;letter-spacing:1px;">탐방객 안전사고 처리현황</td>
      <td style="border:none;width:300px;">
        <table style="border-collapse:collapse;width:100%;">
          <tr><td rowspan="2" style="${td}width:24px;text-align:center;">결<br>재</td><td style="${th}">팀 원</td><td style="${th}">팀 장</td><td style="${th}">과 장</td><td style="${th}">소 장</td></tr>
          <tr><td style="${td}height:50px;"></td><td style="${td}"></td><td style="${td}"></td><td style="${td}"></td></tr>
        </table>
      </td></tr></table>
    <table style="border-collapse:collapse;width:100%;table-layout:fixed;">
      <tr><td style="${th}width:12.5%;">사고일시</td><td colspan="3" style="${td}text-align:center;">${esc(r.date||'')}</td>
          <td colspan="4" style="${td}text-align:center;"><b>사고발생상황 접수경로</b><br>${rrStr}</td></tr>
      <tr><td style="${th}">출동시간</td><td style="${td}text-align:center;">${esc(nb(r.dispatch))}</td>
          <td style="${th}">도착시간</td><td style="${td}text-align:center;">${esc(nb(r.arrival))}</td>
          <td style="${th}">완료시간</td><td style="${td}text-align:center;">${esc(nb(r.completion))}</td>
          <td style="${th}">출동거리</td><td style="${td}text-align:center;">${esc(nb(r.distance))}</td></tr>
      <tr><td style="${th}">사고장소</td><td colspan="5" style="${td}text-align:center;">${esc(nb(r.location))}${coordStr?'<br>좌표: '+coordStr:''}${elevS?' (고도 '+esc(elevS)+')':''}${signCode?' · 표지판 '+esc(signCode):''}</td>
          <td style="${th}">장소구분</td><td style="${td}text-align:center;">${esc(nb(r.loctype))}</td></tr>
      <tr><td rowspan="2" style="${th}">신고자<br>인적사항</td>
          <td style="${th}">성  명</td><td style="${td}text-align:center;">${esc(nb(r.repName))}</td>
          <td colspan="2" style="${th}">성  별</td><td colspan="3" style="${td}text-align:center;"></td></tr>
      <tr><td style="${th}">연락처</td><td style="${td}text-align:center;">${esc(nb(r.repTel))}</td>
          <td colspan="2" style="${th}">사고자와 관계</td><td colspan="3" style="${td}text-align:center;">${esc(nb(r.repRel))}</td></tr>
      <tr><td rowspan="2" style="${th}">사고자<br>인적사항</td>
          <td style="${th}">성  명</td><td style="${td}text-align:center;">${esc(nb(r.vName))}</td>
          <td colspan="2" style="${th}">생년월일</td><td colspan="3" style="${td}text-align:center;">${esc(vAgeStr)}</td></tr>
      <tr><td style="${th}">연락처</td><td style="${td}text-align:center;">${esc(nb(r.vTel))}</td>
          <td colspan="2" style="${th}">거 주 지</td><td colspan="3" style="${td}text-align:center;">${esc(nb(r.vAddr))}</td></tr>
      <tr><td style="${th}">사고원인</td><td colspan="7" style="${td}text-align:center;">${esc(nb(r.cause))}</td></tr>
      <tr><td style="${th}">부상유형</td><td colspan="7" style="${td}text-align:center;">${esc(injStr)}</td></tr>
      <tr><td style="${th}">사고경위</td><td colspan="7" style="${td}">${esc(nb(r.situation))}</td></tr>
      <tr><td style="${th}">조치내용<br>(시간대별)</td><td colspan="7" style="${td}">${logLines.map(esc).join('<br>')}</td></tr>
      <tr><td style="${th}">동원인원</td><td colspan="7" style="${td}">[총 ${totalCnt}명]<br>- 국립공원 ${allNps.length}명${allNps.length?' ('+esc(allNps.join(', '))+')':''}${agStr?'<br>- 유관기관: '+esc(agStr):''}</td></tr>
      <tr><td style="${th}">동원장비</td><td colspan="3" style="${td}">${esc(nb(r.equipment))}</td>
          <td style="${th}">병원후송</td><td colspan="3" style="${td}text-align:center;">${esc(nb(r.hospital))}</td></tr>
      <tr><td style="${th}">특이사항</td><td colspan="3" style="${td}">${esc(nb(r.extra))}</td>
          <td style="${th}">음주여부</td><td colspan="3" style="${td}text-align:center;">${esc(nb(r.alcohol)==='없음'||!nb(r.alcohol)?'X':nb(r.alcohol)+(nb(r.alcAmount)?' ('+r.alcAmount+')':''))}</td></tr>
    </table>`;
  }else{
    const d=(r.date||'').slice(0,16);
    title='설악산 탐방객 구조출동 동향보고';
    const overview=`본 건은 ${esc(d)}경 ${esc(nb(r.location)||'설악산 일원')}에서 발생한 ${esc(nb(r.cause)||r.type||'안전사고')} 관련, 119와 설악산사무소에서 공동대응한 사항임`;
    body=`
    <h1 style="text-align:center;font-size:20px;margin:4px 0 2px;">설악산 탐방객 구조출동(${esc(r.type||'안전사고')}) 동향보고</h1>
    <div style="text-align:center;font-size:13px;margin-bottom:14px;">(‘${esc((r.date||'').slice(2,10).replace(/-/g,'. '))}., 설악산사무소)</div>
    <div style="border:1.5px solid #333;padding:9px 12px;font-size:13.5px;margin-bottom:12px;">◇ ${overview}</div>
    <p style="margin:5px 0;font-size:13.5px;">□ (사 건 명) ${esc(nb(r.title)||'-')}</p>
    <p style="margin:5px 0;font-size:13.5px;">□ (일    시) ${esc(r.date||'')} <span style="color:#666;">(접수: ${esc(nb(r.recvRoute)||'119')})</span></p>
    <p style="margin:5px 0;font-size:13.5px;">□ (장    소) ${esc(nb(r.location))}${signCode?' (표지판 '+esc(signCode)+')':''}${coordStr?'<br>&nbsp;&nbsp;&nbsp;- 좌표: '+coordStr+(elevS?' · 고도 '+esc(elevS):''):''}</p>
    <p style="margin:5px 0;font-size:13.5px;">□ (인적사항)<br>&nbsp;&nbsp;- 사고자: ${esc(nb(r.vName)||'미상')}${vAgeStr?'('+esc(vAgeStr)+')':''}${nb(r.vTel)?' · '+esc(r.vTel):''}${v2Str?'<br>&nbsp;&nbsp;- 추가 사고자: '+esc(v2Str):''}${compStr?'<br>&nbsp;&nbsp;- 동반자: '+esc(compStr):''}</p>
    <p style="margin:5px 0;font-size:13.5px;">□ (사고원인·부상)<br>&nbsp;&nbsp;- ${esc(nb(r.cause)||'-')}${injStr?' / '+esc(injStr):''}${nb(r.severity)?' / '+esc(r.severity):''}<br>&nbsp;&nbsp;- ${esc(nb(r.situation))}</p>
    <p style="margin:8px 0 3px;font-size:13.5px;">□ (조치사항)</p>
    <div style="font-size:13px;line-height:1.7;padding-left:10px;">${logLines.map(esc).join('<br>')}</div>
    <p style="margin:8px 0 3px;font-size:13.5px;">□ (동원인원) [총 ${totalCnt}명]</p>
    <div style="font-size:13px;padding-left:10px;">- 국립공원 ${allNps.length}명${allNps.length?' ('+esc(allNps.join(', '))+')':''}${agStr?'<br>- 유관기관: '+esc(agStr):''}</div>
    ${nb(r.hospital)?`<p style="margin:8px 0 3px;font-size:13.5px;">□ (병원후송) ${esc(r.hospital)}</p>`:''}`;
  }
  // 추가 정보(양식 외 항목 전부) — 두 양식 공통으로 문서 맨 아래에
  if(extraRows.length){
    body+=`<p style="margin:14px 0 4px;font-size:13.5px;font-weight:700;">□ 추가 정보</p>
    <table style="border-collapse:collapse;width:100%;">${extraRows.map(([k,v])=>`<tr><td style="${th}width:18%;">${esc(k)}</td><td style="${td}">${esc(v)}</td></tr>`).join('')}</table>`;
  }
  // 첨부1: 위치도 — 지도는 보안 제약으로 자동 캡처 불가 → 붙여넣기 자리 마련
  body+=`<p style="margin:16px 0 4px;font-size:13.5px;font-weight:700;">[첨부1 : 위치도]</p>
  <div style="border:1px dashed #999;padding:34px 12px;text-align:center;color:#999;font-size:12px;">지도 화면을 캡처해 이 자리에 붙여넣으세요 (앱 지도 → 해당 사고 확대 → 캡처)</div>`;
  // 첨부2: 현황 사진 — 앱에 등록된 부상/이송/현장 사진 자동 첨부 (2열)
  const _pics=[];
  if(r.injuryPhoto&&String(r.injuryPhoto).startsWith('http'))_pics.push({url:r.injuryPhoto,label:'부상'});
  if(r.transPhoto&&String(r.transPhoto).startsWith('http'))_pics.push({url:r.transPhoto,label:'이송'});
  (r.photos||[]).forEach(p=>{if(p&&p.url&&String(p.url).startsWith('http'))_pics.push({url:p.url,label:'현장'+((p.time||'').slice(11,16)?' '+(p.time||'').slice(11,16):'')});});
  if(_pics.length){
    body+=`<p style="margin:16px 0 4px;font-size:13.5px;font-weight:700;">[첨부2 : 사진현황]</p>
    <table style="border-collapse:collapse;width:100%;">`;
    for(let i=0;i<_pics.length;i+=2){
      const a=_pics[i],b2=_pics[i+1];
      body+=`<tr><td style="${td}width:50%;text-align:center;"><img src="${esc(a.url)}" style="max-width:100%;max-height:280px;"></td>${b2?`<td style="${td}width:50%;text-align:center;"><img src="${esc(b2.url)}" style="max-width:100%;max-height:280px;"></td>`:`<td style="${td}"></td>`}</tr>
      <tr><td style="${th}">【${esc(a.label)}】</td>${b2?`<td style="${th}">【${esc(b2.label)}】</td>`:`<td style="${th}"></td>`}</tr>`;
    }
    body+='</table>';
  }
  body+=`<p style="margin-top:14px;font-size:11px;color:#888;">※ 설악산 현장관리 앱 자동 생성 (${esc(now())}) — 한글에서 내용 수정 후 결재 상신</p>`;
  const doc=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title></head>
  <body style="background:#fff;color:#000;font-family:'바탕','Batang','맑은 고딕','Malgun Gothic',serif;max-width:760px;margin:0 auto;padding:18px;">
  <div style="position:sticky;top:0;background:#f2f6fa;border:1px solid #c8d6e4;border-radius:8px;padding:10px;margin-bottom:14px;display:flex;gap:8px;" class="no-copy">
    <button onclick="var b=document.getElementById('govDoc');var rge=document.createRange();rge.selectNodeContents(b);var sel=getSelection();sel.removeAllRanges();sel.addRange(rge);document.execCommand('copy');sel.removeAllRanges();alert('복사됨 — 한글(HWP)에서 붙여넣기 하세요. 표가 그대로 들어갑니다.');" style="flex:1;padding:10px;font-size:14px;font-weight:700;cursor:pointer;background:#1a6e9e;color:#fff;border:none;border-radius:7px;">📋 한글용 전체 복사</button>
    <button onclick="var h=document.documentElement.outerHTML;var bl=new Blob(['\\ufeff'+h],{type:'text/html;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='${esc(title)}_${(r.date||'').slice(0,10)}.html';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();},1500);" style="flex:1;padding:10px;font-size:14px;font-weight:700;cursor:pointer;background:#2a7a4b;color:#fff;border:none;border-radius:7px;">💾 파일 저장 (한글에서 열기)</button>
  </div>
  <div id="govDoc">${body}</div></body></html>`;
  _docPreviewOverlay(doc,title); // 새 창 대신 인앱 오버레이 — '← 앱으로'로 즉시 복귀
}

// ══ 탐방객 안전지원 활동 현황 (한글용) — 업로드해주신 공단 양식 그대로 재현, 앱 기록으로 자동 채움 ══
function safetyReport(rid){
  const r=getRes(rid);if(!r){toast('기록을 찾을 수 없습니다');return;}
  const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const th='border:1px solid #000;padding:6px 8px;font-weight:700;text-align:center;font-size:13px;white-space:nowrap;background:#fff;width:15%;';
  const td='border:1px solid #000;padding:6px 9px;font-size:13px;line-height:1.6;';
  // 체크박스 줄: 선택 항목만 ■, 나머지 □
  const ck=(opts,sel)=>opts.map(o=>((sel&&sel.has(o))?'■':'□')+' '+o).join('&nbsp;&nbsp;');
  // 일시: 'YYYY-MM-DD HH:MM' → 'YYYY년 M월 D일(요일) HH:MM'
  let dtStr=r.date||'';
  try{const m=String(r.date||'').match(/(\d{4})-(\d{2})-(\d{2})[ T]?(\d{2}:\d{2})?/);
    if(m){const wd=['일','월','화','수','목','금','토'][new Date(+m[1],+m[2]-1,+m[3]).getDay()];
      dtStr=m[1]+'년 '+(+m[2])+'월 '+(+m[3])+'일('+wd+')'+(m[4]?' '+m[4]:'');}}catch(e){}
  // 부상유형 자동 체크 — 앱의 부상·유형 기록에서 매핑
  const injSel=new Set();
  const injAll=((r.injuries||[]).map(i=>i.type||'').concat(r.injuryParts||[])).join(',');
  if(r.type==='조난'||r.type==='실종'||r.type==='고립')injSel.add('조난');
  if(/염좌/.test(injAll))injSel.add('염좌');
  if(/타박/.test(injAll))injSel.add('타박상');
  if(/찰과|열상/.test(injAll))injSel.add('찰과상');
  if(/저혈당|심정지|저체온|열사병|탈진|호흡곤란|흉통|복통|경련|의식|익수|지병/.test(injAll))injSel.add('지병');
  if(/통증/.test(injAll+(r.situation||'')))injSel.add('통증');
  if(!injSel.size&&injAll)injSel.add('기타(    )');
  // 성별·연령대
  const gSel=new Set();if(r.vGender==='남')gSel.add('남성');else if(r.vGender==='여')gSel.add('여성');else gSel.add('모름');
  const aSel=new Set();
  {let age='';try{age=r.vBirth?_ageFromBirth(r.vBirth):(r.vAge!=null&&r.vAge!==''?parseInt(r.vAge):'');}catch(e){}
    if(age===''||isNaN(age))aSel.add('모름');
    else aSel.add(age<20?'10대 이하':age<30?'20대':age<40?'30대':age<50?'40대':age<60?'50대':'60대 이상');}
  // 내용: 사고경위 + 경과보고 요약 (시간 앞머리 붙여 양식 예시와 같은 흐름)
  const lines=[];
  if(r.situation)lines.push('- '+r.situation);
  (r.reports||[]).forEach(p=>{if(p.update)lines.push('- '+((p.repTime||'').slice(11,16)?(p.repTime||'').slice(11,16)+'경 ':'')+p.update);});
  // 지원자: 출동 대원 + 작성자
  const helpers=[...new Set([...(r.members||[]),r.author].filter(Boolean))].join(', ');
  const title='탐방객 안전지원 활동 현황';
  const body=`
    <table style="border-collapse:collapse;width:100%;margin-bottom:8px;"><tr>
      <td style="border:none;vertical-align:bottom;font-size:19px;font-weight:800;letter-spacing:.5px;">&lt;${title}&gt;</td>
      <td style="border:none;width:210px;">
        <table style="border-collapse:collapse;width:100%;"><tr><td style="${th}width:80px;">담 당 자</td><td style="${td}height:44px;width:130px;"></td></tr></table>
      </td></tr></table>
    <table style="border-collapse:collapse;width:100%;">
      <tr><td style="${th}">일시</td><td style="${td}">${esc(dtStr)}</td></tr>
      <tr><td style="${th}">장소</td><td style="${td}">${esc(r.location||'')}</td></tr>
      <tr><td style="${th}">부상유형</td><td style="${td}">${ck(['지병','염좌','타박상','찰과상','통증','조난','기타(    )'],injSel)}</td></tr>
      <tr><td style="${th}">지원유형</td><td style="${td}">${ck(['구급약품지원','안전장비지원','식품지원','차량지원','기타(    )'],null)}</td></tr>
      <tr><td style="${th}">성별</td><td style="${td}">${ck(['남성','여성','모름'],gSel)}</td></tr>
      <tr><td style="${th}">연령대</td><td style="${td}">${ck(['10대 이하','20대','30대','40대','50대','60대 이상','모름'],aSel)}</td></tr>
      <tr><td style="${th}">내용</td><td style="${td}">${lines.map(esc).join('<br>')||''}</td></tr>
      <tr><td style="${th}">지원자<br>(직원 등)</td><td style="${td}">${esc(helpers)}</td></tr>
    </table>
    <div style="font-size:11.5px;color:#333;line-height:1.9;margin-top:8px;">
      ** 구급약품지원 : 스프레이파스, 붕대, 밴드 등<br>
      *** 장비지원 : 등산지팡이, 아이젠, 배낭, 등산화 등(정비/수선 포함)<br>
      **** 식품지원 : 식수, 초코바, 각종 행동식/비상식 등<br>
      ***** 차량지원: 탐방객 대상 차량지원 등<br>
      ******기타 : 출동은 했으나 비조우, 허위신고, 오인신고, 또는 지원활동 외에 단순도움 등 탐방객 대상 안전지원활동 등<br>
      ※ 확인 가능한 정보에 한하여 작성하고 5일 이내에 스마트플랫폼 입력
    </div>
    <p style="margin-top:12px;font-size:11px;color:#888;">※ 설악산 현장관리 앱 자동 생성 (${esc(now())}) — 지원유형 등은 한글에서 체크(■)로 바꿔 완성하세요</p>`;
  const doc=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title></head>
  <body style="background:#fff;color:#000;font-family:'바탕','Batang','맑은 고딕','Malgun Gothic',serif;max-width:760px;margin:0 auto;padding:18px;">
  <div style="position:sticky;top:0;background:#f2f6fa;border:1px solid #c8d6e4;border-radius:8px;padding:10px;margin-bottom:14px;display:flex;gap:8px;" class="no-copy">
    <button onclick="var b=document.getElementById('govDoc');var rge=document.createRange();rge.selectNodeContents(b);var sel=getSelection();sel.removeAllRanges();sel.addRange(rge);document.execCommand('copy');sel.removeAllRanges();alert('복사됨 — 한글(HWP)에서 붙여넣기 하세요. 표가 그대로 들어갑니다.');" style="flex:1;padding:10px;font-size:14px;font-weight:700;cursor:pointer;background:#1a6e9e;color:#fff;border:none;border-radius:7px;">📋 한글용 전체 복사</button>
    <button onclick="var h=document.documentElement.outerHTML;var bl=new Blob(['\\ufeff'+h],{type:'text/html;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='${esc(title)}_${(r.date||'').slice(0,10)}.html';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();},1500);" style="flex:1;padding:10px;font-size:14px;font-weight:700;cursor:pointer;background:#2a7a4b;color:#fff;border:none;border-radius:7px;">💾 파일 저장 (한글에서 열기)</button>
  </div>
  <div id="govDoc">${body}</div></body></html>`;
  _docPreviewOverlay(doc,title);
}
// 보고서 공유/복사/인쇄 — 헤더 우측 '📄 보고서' 버튼
function openReportShare(rid){
  let m=document.getElementById('repShareModal');
  if(!m){m=document.createElement('div');m.id='repShareModal';document.body.appendChild(m);}
  m.style.cssText='position:fixed;inset:0;z-index:99800;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:30px;';
  const b='width:100%;margin-bottom:7px;padding:12px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;transition:transform .1s,opacity .1s;';
  m.innerHTML=`<div style="background:#0a1828;border:1px solid rgba(79,168,208,.25);border-radius:14px;max-width:300px;width:100%;padding:16px;max-height:85vh;overflow-y:auto;">
    <div style="font-size:14px;font-weight:800;color:#e0edf8;margin-bottom:12px;text-align:center;">📄 보고서</div>
    <button class="press-fx" onclick="share119(${rid});this.closest('#repShareModal').remove();" style="${b}border:1px solid rgba(224,90,78,.45);background:rgba(224,90,78,.12);color:#ff9a8a;">🚑 유관기관 공유 <span style="font-size:10px;font-weight:600;opacity:.8;">(119·경찰 — 문자/카톡)</span></button>
    <div style="border:1px solid rgba(232,179,74,.4);background:rgba(232,179,74,.07);border-radius:10px;padding:9px 10px 8px;margin-bottom:7px;">
      <div style="font-size:12.5px;font-weight:800;color:#e8b34a;text-align:center;margin-bottom:7px;">📑 안전사고 처리현황 <span style="font-size:10px;font-weight:600;opacity:.75;">(한글용)</span></div>
      <div style="display:flex;gap:6px;">
        <button class="press-fx" onclick="govReport(${rid},'status',false);this.closest('#repShareModal').remove();" style="flex:1;padding:9px 4px;border-radius:8px;border:1px solid rgba(232,179,74,.4);background:rgba(232,179,74,.15);color:#e8b34a;font-size:12px;font-weight:700;cursor:pointer;">통과기록 포함</button>
        <button class="press-fx" onclick="govReport(${rid},'status',true);this.closest('#repShareModal').remove();" style="flex:1;padding:9px 4px;border-radius:8px;border:1px solid rgba(232,179,74,.25);background:rgba(232,179,74,.05);color:#e8b34a;font-size:12px;font-weight:700;cursor:pointer;">통과기록 제외</button>
      </div>
    </div>
    <button class="press-fx" onclick="govReport(${rid},'trend');this.closest('#repShareModal').remove();" style="${b}border:1px solid rgba(232,179,74,.4);background:rgba(232,179,74,.1);color:#e8b34a;">📈 동향보고 (한글용)</button>
    <button class="press-fx" onclick="safetyReport(${rid});this.closest('#repShareModal').remove();" style="${b}border:1px solid rgba(240,140,60,.4);background:rgba(240,140,60,.1);color:#f0a05a;">🧡 안전지원활동 현황 (한글용)</button>
    <button onclick="this.closest('#repShareModal').remove();" style="width:100%;padding:9px;border:none;background:none;color:#7a9cb8;font-size:12px;cursor:pointer;">닫기</button>
  </div>`;
  m.onclick=function(e){if(e.target===m)m.remove();};
}
function renderTimeline(r,viewMode,outId){
  const _isBoard=outId&&outId!=='repContent';
  if(!_isBoard){
    _hideRepFooter();window._reportMode='timeline';clearInterval(_draftAutoTimer); // 타임라인 보기 — 작성모드 해제
    try{const bn=document.getElementById('bnav');if(bn)bn.style.display='none';}catch(e){} // 어느 경로로 와도 하단바에 안 가리게
  }

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
  </div>`; // 탭(타임라인/보고서) 제거 — 아래 한 화면에 보고서·기록·타임라인 통합

  // ── 통합 화면: 탭 없이 보고서(접이식)+기록 입력+상황일지+출동팀+댓글을 한 번에 ──
  _initTlTeams(r);
  _tlRecTeam='';_tlRecStage='';
  const _canWriteTl=!isExternal();
  // 기록 단계 버튼(조우·특이사항) — 자주 쓰는 순. '직접입력'으로 자유 작성
  const REC_STAGES=['요구조자 조우','응급처치','심정지','하산 시작','헬기 요청','헬기 도착','휴식','기상 악화','구조 중단','구조 재개','대피소 숙박'];
  if(window._tlRecOpen===undefined)window._tlRecOpen=(r.status==='ongoing'); // 진행중=기록 입력 펼침 / 종료 건=접힘
  const _mkRecCard=()=>{
    if(!_canWriteTl)return '';
    const _tglArg=`${r.id},'${_isBoard?_esc(outId):''}'`;
    if(!window._tlRecOpen)return `<button onclick="_toggleRecCard(${_tglArg})" style="width:100%;margin-bottom:8px;padding:11px;border-radius:11px;border:1px dashed rgba(79,168,208,.35);background:rgba(79,168,208,.06);color:#4fa8d0;font-size:12.5px;font-weight:800;cursor:pointer;">📌 기록 추가 — 조우·처치·헬기·직접입력 ▾</button>`;
    const _teamNames=(r.teams||[]).map(t=>t.name).filter(Boolean);
    return `
      <!-- 📌 기록: 누가 · 무엇을 · 언제 — 과거 시간 입력 가능, 일지는 시간순 자동 정렬 -->
      <div style="background:#0b1c30;border:1px solid rgba(79,168,208,.3);border-radius:12px;padding:12px 13px;margin-bottom:10px;">
        <div style="margin-bottom:8px;display:flex;align-items:center;">
          <span style="font-size:12px;font-weight:800;color:#4fa8d0;">📌 기록 <span style="font-size:9px;color:#5a7e98;font-weight:400;">누가 · 무엇을 · 언제</span></span>
          <span onclick="_toggleRecCard(${_tglArg})" style="margin-left:auto;font-size:10.5px;color:#5a7e98;font-weight:700;cursor:pointer;padding:2px 6px;">▲ 접기</span>
        </div>
        ${_teamNames.length?`<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:7px;" id="tlRecTeams">
          ${['본부',..._teamNames].map(n=>`<div class="pill" data-v="${_esc(n)}" onclick="_tlRecSelTeam(this)" style="font-size:11px;cursor:pointer;">${_esc(n)}</div>`).join('')}
        </div>`:''}
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:7px;" id="tlRecStages">
          ${(()=>{ // 진행 단계 기반 추천을 맨 앞에 초록으로 — 나머지 선택지는 그대로 전부 표시
            const sug=(r.status==='ongoing'&&typeof _recSuggest==='function')?_recSuggest(r):[];
            const ordered=[...sug,...REC_STAGES.filter(s=>!sug.includes(s))];
            return ordered.map(s=>{
              const isSug=sug.includes(s);
              const danger=(s==='요구조자 조우'||s==='심정지');
              return `<div class="pill" data-v="${s}" onclick="_tlRecSelStage(this)" style="font-size:11px;cursor:pointer;${isSug?'border-color:rgba(61,220,132,.55);color:#7ee0a8;font-weight:800;':(danger?'border-color:rgba(231,76,60,.4);color:#e74c3c;':'')}">${isSug?'▸ ':''}${s}</div>`;
            }).join('');
          })()}
          <div class="pill" data-v="__custom" onclick="_tlRecSelStage(this)" style="font-size:11px;cursor:pointer;border-style:dashed;">✏️ 직접입력</div>
        </div>
        <div id="tlRecCustomWrap" style="display:none;margin-bottom:7px;"><input type="text" id="tlRecCustom" class="fi" placeholder="무엇을 했는지 직접 입력 (예: 장비 보급, 대피소 직원 합류)"></div>
        <div id="tlRecCprWrap" style="display:none;background:rgba(231,76,60,.07);border:1px solid rgba(231,76,60,.25);border-radius:9px;padding:9px 11px;margin-bottom:7px;">
          <div style="font-size:10px;color:#e74c3c;font-weight:700;margin-bottom:6px;">🫀 CPR 기록</div>
          <div style="display:flex;gap:6px;margin-bottom:6px;">
            <input type="datetime-local" id="tlRecCprStart" class="fi" style="flex:1;" value="${new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)}">
            <input type="datetime-local" id="tlRecCprEnd" class="fi" style="flex:1;">
          </div>
          <div style="display:flex;gap:6px;">
            <button id="tlRecAedY" onclick="this._v=1;this.style.background='rgba(231,76,60,.25)';this.style.color='#e74c3c';var n=document.getElementById('tlRecAedN');n.style.background='transparent';n.style.color='rgba(255,255,255,.4)';" style="flex:1;padding:6px;border-radius:7px;border:1px solid rgba(231,76,60,.3);background:transparent;color:rgba(255,255,255,.4);font-size:11px;font-weight:700;cursor:pointer;">AED 사용</button>
            <button id="tlRecAedN" onclick="var y=document.getElementById('tlRecAedY');y._v=0;y.style.background='transparent';y.style.color='rgba(255,255,255,.4)';this.style.background='rgba(79,168,208,.15)';this.style.color='#4fa8d0';" style="flex:1;padding:6px;border-radius:7px;border:1px solid rgba(79,168,208,.25);background:rgba(79,168,208,.1);color:#4fa8d0;font-size:11px;font-weight:700;cursor:pointer;">미사용</button>
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:8px;">
          <input type="datetime-local" id="tlRecTime" class="fi" style="flex:1.3;min-width:0;" value="${new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)}">
          <input type="text" id="tlRecNote" class="fi" style="flex:1;min-width:0;" placeholder="메모 (선택)">
        </div>
        <button onclick="_tlRecSave(${r.id})" style="width:100%;padding:10px;background:#1a4a6e;color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;">＋ 기록 저장</button>
        <div style="font-size:9px;color:#3a5a7a;margin-top:5px;">시간을 과거로 바꿔 늦은 입력 가능 — 상황일지는 시간순으로 자동 정렬됩니다</div>
      </div>`;
  };
  // 🚑 출동팀: 한 카드에 팀별 한 줄 + 팀 출동 버튼
  const _mkTeamCard=()=>_canWriteTl?`
      <div style="background:#0b1c30;border:.5px solid rgba(79,168,208,.14);border-radius:12px;padding:11px 13px;margin-top:8px;">
        <div id="tlTeamHdr" style="font-size:11px;color:#4fa8d0;font-weight:800;margin-bottom:4px;">${_tlTeamsHdrHtml()}</div>
        <div id="tlAllTeams">${_tlTeamRowsHtml()}</div>
        <div id="tlBuildArea" style="margin-top:9px;">${_tlBuilding?_renderBuildPanelHtml():_renderCreateBtnsHtml()}</div>
      </div>`:'';
  {
    // 통합 보고서 — 추가보고(N보)의 최신 정보를 병합해 '다 뜨게'(reports·date·작성자 등 메타는 보존)
    r=_mergedRescue(r);
    const _ok=v=>{if(!v&&v!==0)return false;const s=String(v).trim();return s&&s!=='-'&&!['미상','없음','모르겠음','알수없음','미정','해당없음','기타'].includes(s);};
    const _okA=v=>(Array.isArray(v)?v:[]).filter(x=>_ok(x));
    const _row=(k,v)=>v?`<div style="display:flex;gap:8px;padding:5px 0;border-bottom:.5px solid rgba(255,255,255,.04);align-items:flex-start;"><span style="font-size:11px;color:#4a7090;font-weight:600;flex-shrink:0;min-width:46px;">${k}</span><span style="font-size:11px;color:#b8d4e8;line-height:1.55;flex:1;">${v}</span></div>`:'';
    // ── 우선순위: ① 부상 ② 위치 ③ 인적사항 ④ 나머지 ⑤ 추가내용 ──
    const _injList=(Array.isArray(r.injuries)?r.injuries:[]).filter(i=>i&&(i.part||i.type));
    const _injMain=_injList.length
      ? _injList.map(i=>(typeof _injLabel==='function')?_injLabel(i):((i.part||'')+(i.type||''))).filter(Boolean).join(', ')
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
    const locSect=_ok(r.location)?`<div style="font-size:12px;color:#cfe2f2;line-height:1.5;">📍 ${_esc(r.location)}${(typeof _elevStr==='function'&&r.lat&&r.lng)?` <span style="color:#a7f3e4;font-size:10px;">${_elevStr(r.lat,r.lng,r.alt)}</span>`:''}${_ok(r.loctype)?` <span style="color:#7a9cb8;font-size:10px;">· ${_esc(r.loctype)}</span>`:''}</div>`:'';
    const _vAge=_ok(r.vBirth)?_ageFromBirth(r.vBirth)+'세':(_ok(r.vAge)?_esc(r.vAge)+'세':'');
    const _vLine=[_ok(r.vName)?_esc(r.vName):'미상',_vAge,_ok(r.vGender)&&r.vGender!=='알수없음'?_esc(r.vGender):'',_ok(r.vNation)&&r.vNation==='외국인'?'외국인':'',_ok(r.vTel)?_esc(r.vTel):''].filter(Boolean).join(' · ');
    let personSect=`<div style="display:flex;align-items:center;flex-wrap:wrap;gap:5px;"><span style="font-size:10px;color:#4a7090;font-weight:700;min-width:40px;">사고자</span><span style="font-size:12px;color:#e0edf8;font-weight:600;">${_vLine}</span>${_ok(r.vTel)?_telBtnsHtml(r.vTel,r.id,'사고자',r.vName):''}</div>`;
    if(r.victims2&&r.victims2.length)personSect+=r.victims2.map((v,vi)=>`<div style="display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-top:6px;"><span style="font-size:10px;color:#e9897e;font-weight:700;min-width:40px;">추가${r.victims2.length>1?vi+1:''}</span><span style="font-size:12px;color:#f0d9d4;">${_esc([v.name||'미상',v.age?v.age+'세':'',(v.gender&&v.gender!=='알수없음')?v.gender:'',v.tel||''].filter(Boolean).join(' · '))}</span>${v.tel?_telBtnsHtml(v.tel,r.id,'추가 사고자',v.name):''}</div>`).join('');
    if(_ok(r.repName)||_ok(r.repTel))personSect+=`<div style="display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-top:6px;"><span style="font-size:10px;color:#4a7090;font-weight:700;min-width:40px;">신고자</span><span style="font-size:12px;color:#cfe2f2;">${[_ok(r.repName)?_esc(r.repName):'',_ok(r.repTel)?_esc(r.repTel):''].filter(Boolean).join(' · ')}</span>${_ok(r.repRel)?`<span style="font-size:10px;color:#e8b34a;background:rgba(232,179,74,.1);border:1px solid rgba(232,179,74,.3);border-radius:5px;padding:1px 6px;font-weight:700;">${_esc(r.repRel)}</span>`:''}${_ok(r.repTel)?_telBtnsHtml(r.repTel,r.id,'신고자',r.repName):''}</div>`;
    if(r.companions&&r.companions.length)personSect+=r.companions.map((c,ci)=>`<div style="display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-top:6px;"><span style="font-size:10px;color:#4a7090;font-weight:700;min-width:40px;">동반자${r.companions.length>1?ci+1:''}</span><span style="font-size:12px;color:#cfe2f2;">${_esc((c.name||'미상')+(c.tel?' '+c.tel:''))}</span>${c.tel?_telBtnsHtml(c.tel,r.id,'동반자',c.name):''}</div>`).join('');
    if(typeof _sosLiveLineHtml==='function'){const _sl=_sosLiveLineHtml(r);if(_sl)personSect+='<div style="margin-top:6px;">'+_sl+'</div>';}
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
    // 위치 채택 이력 — 사고자 실시간 위치로 최초접수 좌표를 옮긴 기록(최초접수 원본은 origLat/origLng 보존)
    const locLog=(r.locLog||[]);
    const locChgHtml=locLog.length?`<div style="background:#0b1c30;border-radius:10px;padding:11px 12px;border:.5px solid rgba(20,184,166,.22);margin-bottom:8px;"><div style="font-size:10px;color:#2dd4bf;font-weight:800;margin-bottom:5px;">📍 위치 변경 이력 <span style="color:#5a7e98;font-weight:400;font-size:9px;">최초접수 ${r.origLat!=null?(+r.origLat).toFixed(5)+', '+(+r.origLng).toFixed(5):''}</span></div>${locLog.map(l=>`<div style="font-size:11px;color:#b8d4e8;line-height:1.6;padding:3px 0;border-bottom:.5px solid rgba(255,255,255,.04);">실시간 위치 채택 <span style="color:#9c8060;">${(+l.from.lat).toFixed(5)}, ${(+l.from.lng).toFixed(5)}</span> → <b style="color:#a7f3e4;">${(+l.to.lat).toFixed(5)}, ${(+l.to.lng).toFixed(5)}</b>${l.dist?' <span style="color:#5a9e94;">('+l.dist+'m)</span>':''} <span style="color:#5a7e98;font-size:9px;">${l.at||''}${l.by?' · '+_esc(l.by):''}</span></div>`).join('')}</div>`:'';
    const logHtml=_buildLogHtml(r);
    // ── 접이식 보고서 + 하단 타임라인 ──
    // 요약(부상·위치·사람+전화)은 항상 보이고, 상세(접수·경위·사진·출동인원 등)는 '보고서 펼치기'로.
    // 상황일지(타임라인)는 맨 밑에 묻혀 있던 것을 요약 바로 아래로 승격 — 화면이 훨씬 깔끔해짐.
    const _shOpen=!!window._repSheetOpen;
    const reportSheet=`<div style="background:#0b1c30;border:1px solid rgba(231,76,60,.18);border-radius:12px;padding:13px 14px;margin-bottom:8px;">
      ${injurySect}
      ${locSect?_div+locSect:''}
      ${_div}${personSect}
      <button onclick="_toggleRepSheet(${r.id},'${_isBoard?_esc(outId):''}')" style="width:100%;margin-top:10px;padding:9px;border-radius:9px;border:1px dashed rgba(79,168,208,.3);background:rgba(79,168,208,.05);color:#5d92bc;font-size:12px;font-weight:700;cursor:pointer;">${_shOpen?'▲ 보고서 접기':'📄 보고서 전체 펼치기 — 접수·경위·사진·출동인원'}</button>
    </div>`;
    // 펼쳤을 때만 붙는 상세 묶음 (접수·기타 정보 → 추가·변경 이력 → 사진 → 출동 인원)
    const _mkReportDetail=()=>_shOpen?`
      <div style="background:#0b1c30;border:1px solid rgba(79,168,208,.15);border-radius:12px;padding:12px 14px;margin-bottom:8px;">
        ${recvSect||''}
        ${rows.length?(recvSect?_div:'')+rows.join(''):''}
        <div style="text-align:right;font-size:9px;color:#3a5a6a;margin-top:9px;">📝 최초접수 ${r.date||''}${r.author?' · 작성 '+_esc(r.author):''}</div>
      </div>
      ${updHtml}
      ${changeHtml}
      ${locChgHtml}
      ${_scenePhotosHtml(r)}
      <div style="background:#0b1c30;border-radius:10px;padding:11px 12px;border:.5px solid rgba(79,168,208,.12);margin-bottom:8px;">${_teamSectHtml()}</div>`:'';
    // 출동 인원 카드 내용을 재사용하기 위해 함수로 감쌈
    function _teamSectHtml(){return `
        ${(()=>{
          const tot=((r.members||[]).length)+(r.teams||[]).reduce((a,t)=>a+_teamCnt(t),0)+(r.extraTeams||[]).reduce((a,t)=>a+((t.members||[]).length),0);
          return `<div style="font-size:11px;color:#4fa8d0;font-weight:700;margin-bottom:7px;">👥 출동 인원${tot?` <span style="color:#7dd3fa;">· 총 ${tot}명</span>`:''}</div>`;
        })()}
        ${(r.members&&r.members.length)?`<div style="font-size:11px;color:#b8d4e8;margin-bottom:3px;"><span style="color:#7ec8a0;font-weight:600;">🏃 초동팀 <span style="color:#7dd3fa;font-size:10px;">${r.members.length}명</span></span> <span style="color:#b8d4e8;">— ${_esc(r.members.join(', '))}</span></div>`:''}
        ${(r.teams&&r.teams.length)?r.teams.map(t=>{
          const cnt=_teamCnt(t);
          const mem=(t.members&&t.members.length)?` <span style="color:#b8d4e8;font-weight:400;">— ${_esc(t.members.join(', '))}</span>`:'';
          return `<div style="font-size:11px;color:#b8d4e8;margin-bottom:3px;"><span style="color:#7ec8a0;font-weight:600;">${_teamIco(t)} ${_esc(_deptShort(t.name))}${cnt?` <span style="color:#7dd3fa;font-size:10px;">${cnt}명</span>`:''}</span>${mem}</div>`;
        }).join(''):''}
        ${(!r.members||!r.members.length)&&(!r.teams||!r.teams.length)?'<div style="font-size:11px;color:rgba(255,255,255,.3);">미기재 — 타임라인에서 팀을 출동시키면 자동 표시됩니다</div>':''}
        ${(r.extraTeams&&r.extraTeams.length)?r.extraTeams.map(t=>`<div style="font-size:11px;color:#b8d4e8;margin-bottom:3px;"><span style="color:#7ec8a0;font-weight:600;">${_esc(_deptShort(t.teamName))}${(t.members||[]).length?` <span style="color:#7dd3fa;font-size:10px;">${(t.members||[]).length}명</span>`:''}</span>${(t.members||[]).length?` <span style="color:#b8d4e8;">— ${_esc((t.members||[]).join(', '))}</span>`:''}</div>`).join(''):''}
        ${(r.agencies)?(()=>{
          const ag=r.agencies;const parts=[];
          if(ag.hwandongha)parts.push(`🚒 ${(DB.g('extAgencyDisplayName')||'환동해 특수대응단').split(' ')[0]} ${ag.hwTeam||'?'}팀`);
          if(ag.fireAgencies&&ag.fireAgencies.length)ag.fireAgencies.forEach(a=>parts.push(`🚒 ${_esc(a.name)}`));
          if(ag.police)parts.push('🚔 경찰');
          if(ag.forestry)parts.push('🌲 산림청');
          if(ag.other)parts.push(_esc(ag.other));
          if(ag.agenciesNote)parts.push(`(${_esc(ag.agenciesNote)})`);
          return parts.length?`<div style="font-size:11px;color:#b8d4e8;margin-top:2px;"><span style="color:#4a7090;">유관기관:</span> ${parts.join(' · ')}</div>`:'';
        })():''}`;}
    // 조립(한 화면): 진행 스테퍼(진행중) → 요약 → [펼친 상세] → 응소 → 📌 기록(접이식) → 🕘 타임라인 → 🚑 출동팀 → 💬 댓글
    w.innerHTML=tabHdr
      +(r.status==='ongoing'?_rescueStepperHtml(r):'')
      +reportSheet
      +_mkReportDetail()
      +_mobilizeBlockHtml('rescues',r)
      +_mkRecCard()
      +(logHtml?`<div style="margin:2px 0 8px;"><div style="font-size:11px;color:#7fb4d4;font-weight:800;margin:6px 2px 5px;">🕘 상황일지 <span style="font-size:9px;color:#4a6a84;font-weight:600;">시간순 타임라인</span></div>${logHtml}</div>`
               :'<div style="text-align:center;font-size:11px;color:#456a85;padding:12px 0 8px;">🕘 상황일지 기록 없음 — 위 📌 기록 추가로 입력하세요</div>')
      +_mkTeamCard()
      +`<div style="background:#0b1c30;border-radius:10px;padding:12px;border:.5px solid rgba(255,255,255,.07);margin-top:8px;">
        <div style="font-size:11px;color:#4fa8d0;font-weight:700;margin-bottom:8px;">💬 댓글</div>
        <div id="commentList_${r.id}">${renderComments(r.id)}</div>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <input type="text" id="cmtInput_${r.id}" class="fi" placeholder="댓글 입력..." style="flex:1;">
          <button onclick="submitComment(${r.id})" style="background:#1a4a6e;color:#fff;border:none;padding:0 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;">등록</button>
        </div>
      </div>`;
  }
  // sticky footer
  const _ftEl=document.getElementById(_isBoard?'boardDetailFooter':'rep1BoFooter');
  if(_ftEl){
    if(r.status==='ongoing'){
      _ftEl.style.display='block';
      if(!isExternal()){ // 통합 화면 — 작성 권한 있으면 항상 전체 푸터(내용 추가·종료·공단 응소)
        const _histBtn=all.length>1?`<button onclick="showPrevHistModal(${r.id})" style="display:block;width:100%;padding:6px 10px;border-radius:7px;border:.5px solid rgba(79,168,208,.25);background:rgba(79,168,208,.07);color:#4a8aaa;font-size:11px;font-weight:600;cursor:pointer;margin-bottom:6px;text-align:left;">📋 이전 이력 보기 (${all.length-1}건)</button>`:'';
        _ftEl.innerHTML=_histBtn+`<div style="display:flex;gap:7px;"><button class="btn-submit" style="flex:2;background:#1a4a6e;color:#fff;" onclick="selResId=${r.id};curResId=${r.id};addPhase();">📝 내용 추가</button><button class="btn-submit" style="flex:1;background:#0d5040;color:#fff;" onclick="selResId=${r.id};curResId=${r.id};endSit();">✅ 상황 종료</button></div>`
          +`<button onclick="openNpsResponse(${r.id})" style="margin-top:6px;width:100%;background:rgba(0,120,60,.18);color:#7ec8a0;border:1px solid rgba(0,120,60,.3);border-radius:9px;padding:9px;font-size:12px;font-weight:600;cursor:pointer;">🏕️ 공단 응소 기록</button>`;
      } else if(!isExternal()){
        _ftEl.innerHTML=`<button class="btn-submit" style="width:100%;background:#0d5040;color:#fff;" onclick="selResId=${r.id};curResId=${r.id};endSit();">✅ 상황 종료</button>`
          +`<button onclick="openNpsResponse(${r.id})" style="margin-top:6px;width:100%;background:rgba(0,120,60,.18);color:#7ec8a0;border:1px solid rgba(0,120,60,.3);border-radius:9px;padding:9px;font-size:12px;font-weight:600;cursor:pointer;">🏕️ 공단 응소 기록</button>`;
      }
    } else {
      _ftEl.style.display='block';
      // 종료된 사고도 보고서 내용·사고일시 수정 가능 — 추가 보고 폼(사고일시 칸 포함)으로 진입. status는 종료 유지
      _ftEl.innerHTML='<div style="text-align:center;font-size:12px;color:#27ae60;padding:6px 0 6px;">✅ 상황 종료됨</div>'
        +((!isExternal())?`<button class="btn-submit" style="width:100%;background:#1a4a6e;color:#fff;" onclick="selResId=${r.id};curResId=${r.id};addPhase();">📝 기록 수정·추가 보고 <span style="font-size:10px;font-weight:400;opacity:.75;">(사고일시·내용 수정)</span></button>`:'');
    }
  }
}
// 보고서 상세 접기/펼치기 — 요약·타임라인은 그대로 두고 상세 묶음만 토글 (상황판 상세에서도 동작)
function _toggleRepSheet(rid,outId){
  window._repSheetOpen=!window._repSheetOpen;
  const r=getRes(rid);if(!r)return;
  renderTimeline(r,'advanced',outId||undefined);
}
// 📌 기록 입력 카드 접기/펼치기
function _toggleRecCard(rid,outId){
  window._tlRecOpen=!window._tlRecOpen;
  const r=getRes(rid);if(!r)return;
  renderTimeline(r,'advanced',outId||undefined);
}
// ── 구조 진행 단계 판정 — 타임테이블·팀·인계 기록에서 마일스톤 도출 ──
function _rescueMilestones(r){
  const st=(r.timetable||[]).map(e=>e.stage||'');
  const tOf=s=>{const e=(r.timetable||[]).find(x=>x.stage===s&&x.time);return e?String(e.time).slice(11,16):'';};
  const firstTeamAt=(r.teams||[]).map(t=>t.requestedAt||t.createdAt).filter(Boolean).sort()[0]||'';
  return [
    {l:'접수',done:!!r.date,t:String(r.date||'').slice(11,16)},
    {l:'출동',done:!!(firstTeamAt||(r.members&&r.members.length)),t:firstTeamAt?String(firstTeamAt).slice(11,16):''},
    {l:'조우',done:st.includes('요구조자 조우'),t:tOf('요구조자 조우')},
    {l:'처치',done:st.includes('응급처치')||st.includes('심정지'),t:tOf('응급처치')||tOf('심정지')},
    {l:'이송',done:st.includes('하산 시작')||st.includes('헬기 도착')||(r.teams||[]).some(t=>t.boardedAt),t:tOf('하산 시작')||tOf('헬기 도착')},
    {l:'인계',done:!!(r.handover&&r.handover.to),t:(r.handover&&r.handover.time)?String(r.handover.time).slice(11,16):''},
  ];
}
// 진행 스테퍼(진행중 전용) — 접수→출동→조우→처치→이송→인계 어디까지 왔는지 한 줄로
function _rescueStepperHtml(r){
  const ms=_rescueMilestones(r);
  let cur=ms.findIndex(m=>!m.done);if(cur<0)cur=ms.length;
  return `<div style="display:flex;background:#0b1c30;border:1px solid rgba(79,168,208,.18);border-radius:12px;padding:10px 8px 7px;margin-bottom:8px;">
    ${ms.map((m,i)=>{
      const done=m.done,isCur=i===cur;
      const col=done?'#3ddc84':isCur?'#4fa8d0':'rgba(255,255,255,.16)';
      return `<div style="flex:1;min-width:0;text-align:center;position:relative;">
        ${i>0?`<div style="position:absolute;right:50%;margin-right:9px;top:8px;left:-50%;margin-left:9px;height:2px;background:${done?'rgba(61,220,132,.35)':'rgba(255,255,255,.06)'};"></div>`:''}
        <div style="position:relative;width:18px;height:18px;line-height:15px;border-radius:50%;margin:0 auto;background:${done?'rgba(61,220,132,.14)':isCur?'rgba(79,168,208,.16)':'transparent'};border:2px solid ${col};color:${col};font-size:10px;font-weight:900;">${done?'✓':(isCur?'·':'')}</div>
        <div style="font-size:9.5px;font-weight:${isCur?'800':'600'};color:${done?'#7ee0a8':isCur?'#4fa8d0':'rgba(255,255,255,.3)'};margin-top:3px;white-space:nowrap;">${m.l}</div>
        <div style="font-size:8.5px;color:#5a7e98;height:11px;">${m.t||''}</div>
      </div>`;
    }).join('')}
  </div>`;
}
// 지금 단계에 맞는 기록 추천 — 몇 개만, 확신 있는 경우에만 (제한이 아니라 지름길)
function _recSuggest(r){
  const st=(r.timetable||[]).map(e=>e.stage||'');
  const has=s=>st.includes(s);
  if(!has('요구조자 조우'))return['요구조자 조우'];
  if(has('헬기 요청')&&!has('헬기 도착'))return['헬기 도착'];
  if(!has('응급처치')&&!has('심정지')&&!has('하산 시작'))return['응급처치','하산 시작'];
  if(!has('하산 시작')&&!has('헬기 요청'))return['하산 시작','헬기 요청'];
  return[];
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
    toast('🖼️ 사진 '+files.length+'장 처리 중...');
    const u=DB.g('currentUser')||{};
    // Storage 미사용 — 데이터URL로 압축해 기록에 직접 저장(오프라인·동기화 자동). 다중 첨부라 개당 더 작게(문서 1MB 안전).
    let ok=0,full=false;
    for(const f of files){
      try{
        const dataUrl=await _compressToDataUrl(f,900,300000);
        if(!dataUrl)continue;
        const res=DB.g('rescues')||[];const ri=res.findIndex(x=>x.id===resId);
        if(ri<0)break;
        if(!res[ri].photos)res[ri].photos=[];
        // Firestore 문서 1MB 한계 — 기록 크기가 넘칠 것 같으면 중단(잘못된 쓰기로 동기화 깨짐 방지)
        if(JSON.stringify(res[ri]).length+dataUrl.length>950000){full=true;break;}
        res[ri].photos.push({url:dataUrl,time:now(),by:u.name||''});
        DB.s('rescues',res);ok++;
      }catch(e){}
    }
    toast(full?('⚠️ 사진 용량 한계 — '+ok+'장만 추가됨(기록당 최대 몇 장)'):(ok?('✅ 사진 '+ok+'장 추가'):'⚠️ 사진 추가 실패'));
    try{const r=getRes(resId);if(r&&r.id)renderTimeline(r,_tlViewMode==='write'?'write':'advanced');}catch(e){}
  };
  inp.click();
}
function openLightbox(url){
  let lb=document.getElementById('photoLightbox');
  if(!lb){
    lb=document.createElement('div');lb.id='photoLightbox';
    lb.style.cssText='position:fixed;inset:0;z-index:99850;background:rgba(0,0,0,.93);display:flex;align-items:center;justify-content:center;padding:18px;';
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
  "type": "사고 유형 — 안전사고/조난/고립/실종 중 가장 가까운 것 (부상·질환·추락 등은 안전사고, 길잃음은 조난)",
  "vName": "사고자(피해자) 이름",
  "vBirth": "사고자 생년월일 (YYYY-MM-DD, 나이만 있으면 추정 생년 계산)",
  "vGender": "성별 (남/여/알수없음)",
  "vTel": "사고자 또는 신고자 연락처",
  "severity": "중증도 (경증/중증/중경증/사망/알수없음)",
  "situation": "사고 경위 및 상황 요약 (2-3문장)",
  "reception": "최초 신고 내용 요약",
  "weather": "기상 정보 (있으면)",
  "injuries": [{"type":"부상 유형 — 외상이면 골절/탈구/염좌/열상/타박상/두부손상/절단/화상 중, 내상·질환이면 저혈당/심정지/저체온증/열사병/탈진·탈수/호흡곤란/흉통/복통/경련/의식저하/익수 중, 없으면 원문 그대로","part":"부상 부위 — 머리/목/어깨/팔꿈치/손목/손/흉부/복부/허리/골반/무릎/발목/발 중 하나, 전신·질환이면 null","side":"좌/우/양쪽 중 하나, 불명확하면 null"}]
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
  // ※ 현재 폼의 실제 요소에 매핑 (r_sit/r_recv/r_arr, 성별·유형·중증도는 버튼/필 클릭)
  const _set=(id,v)=>{if(v===null||v===undefined)return;const el=document.getElementById(id);if(el){el.value=v;el.dispatchEvent(new Event('input'));}};
  if(d.date)_set('r_accdt',d.date.slice(0,16));           // (N보 폼에만 존재 — 없으면 무시)
  if(d.dispatch)_set('r_disp',d.dispatch);
  if(d.arrival)_set('r_arr',d.arrival);
  if(d.location){_set('r_loc',d.location);}
  if(d.loctype&&['법정탐방로','비법정탐방로','암벽','빙벽'].includes(d.loctype)){
    try{selLoctype(d.loctype);}catch(e){}
  }
  if(d.type){
    const base=['안전사고','조난','고립','실종'];
    // 구 유형 표기 → 새 체계 매핑
    const map={'실족추락':'안전사고','심장마비':'안전사고','탈진':'안전사고','뇌졸중':'안전사고','길잃음':'조난'};
    const t=base.includes(d.type)?d.type:(map[d.type]||null);
    try{
      if(t)selAccType(t);
      else{selAccType('기타');const c=document.getElementById('r_typeCustom');if(c&&d.type!=='기타'){c.value=d.type;}}
    }catch(e){}
  }
  if(d.vName)_set('r_vName',d.vName);
  if(d.vBirth)_set('r_vBirth',d.vBirth);
  if(d.vGender&&(d.vGender==='남'||d.vGender==='여')){try{selGender(d.vGender);}catch(e){}}
  if(d.vTel)_set('r_vTel',d.vTel);
  if(d.severity){
    // 경증/중증 표기 → KTAS 필 매핑
    const sm={'사망':'KTAS 1 (소생)','중증':'KTAS 2 (긴급)','중경증':'KTAS 3 (응급)','경증':'KTAS 4 (준응급)'};
    const target=sm[d.severity]||null;
    if(target)document.querySelectorAll('#sevPills .pill').forEach(p=>{if(p.textContent.trim()===target&&!p.classList.contains('on'))p.click();});
  }
  if(d.situation)_set('r_sit',d.situation);
  if(d.reception)_set('r_recv',d.reception);
  // 부상 내역 → 부상 목록에 자동 추가 (외상/내상 자동 분류)
  if(Array.isArray(d.injuries)&&d.injuries.length&&typeof _injuries!=='undefined'){
    d.injuries.forEach(it=>{
      if(!it||!it.type)return;
      const isInternal=(typeof _INJ_TYPES!=='undefined'&&(_INJ_TYPES['내상']||[]).includes(it.type))||!it.part||it.part==='전신';
      const side=(it.side==='좌'||it.side==='우'||it.side==='양쪽')?it.side:'';
      _injuries.push({type:it.type,part:isInternal?'전신':it.part,side:isInternal?'':side,cat:isInternal?'내상':'외상'});
    });
    try{renderInjuries();}catch(e){}
  }
  if(d.weather){
    const w=String(d.weather);
    document.querySelectorAll('#weatherPills .pill').forEach(p=>{if(w.includes(p.textContent.trim())&&!p.classList.contains('on'))p.click();});
  }
  try{autoGenTitle();}catch(e){}
  try{if(typeof _updateTabDots==='function')_updateTabDots();}catch(e){}
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
// ── 유관기관(119·경찰 등) 상황 공유 — 전화로 부르기 힘든 좌표·지도링크를 문자/카톡 한 번에 ──
// 보고서 전문이 아니라 '전파에 필요한 핵심만' 간결하게. 지도 링크는 카카오맵(상대방 앱 유무와 무관하게 웹으로 열림).
function _build119Text(r){
  if(!r)return '';
  const L=[];
  L.push('【설악산국립공원 사고전파】');
  L.push('■유형: '+(r.type||'안전사고')+' ('+(r.status==='ongoing'?'구조 진행중':'상황 종료')+')');
  if(r.date)L.push('■발생: '+r.date);
  if(r.location)L.push('■위치: '+r.location+(r.loctype?' ['+r.loctype+']':''));
  if(r.lat!=null&&r.lng!=null&&r.lat!==''&&r.lng!==''&&!isNaN(+r.lat)){
    L.push('■좌표: '+(+r.lat).toFixed(5)+', '+(+r.lng).toFixed(5)+((r.alt!=null&&r.alt!=='')?' (해발약 '+Math.round(+r.alt)+'m)':''));
    L.push('■지도: https://map.kakao.com/link/map/'+encodeURIComponent('사고지점')+','+(+r.lat).toFixed(6)+','+(+r.lng).toFixed(6));
  }
  {
    const vp=[r.vName,(r.vBirth&&typeof _ageFromBirth==='function'?_ageFromBirth(r.vBirth)+'세':(r.vAge?r.vAge+'세':'')),(r.vGender&&r.vGender!=='알수없음')?r.vGender:''].filter(Boolean).join('/');
    if(vp)L.push('■사고자: '+vp+((r.victims2&&r.victims2.length)?' 외 '+r.victims2.length+'명':''));
  }
  if(r.severity)L.push('■중증도: '+r.severity);
  {const inj=(r.injuryParts||[]).filter(Boolean);if(inj.length)L.push('■부상: '+inj.join(', '));}
  {const v=r.vitals&&_vitalsStr(r.vitals);if(v)L.push('■활력징후: '+v);}
  if(r.vTel)L.push('■연락처: '+r.vTel);
  if(r.situation)L.push('■경위: '+String(r.situation).replace(/\s+/g,' ').slice(0,90));
  if(r.hospital&&r.hospital!=='미정')L.push('■이송: '+r.hospital);
  L.push('■발신: 설악산국립공원사무소 '+(r.author||getAuthor()));
  return L.join('\n');
}
function share119(rid){
  const r=getRes(rid);
  if(!r){toast('기록을 찾을 수 없습니다');return;}
  window._sh119Txt=_build119Text(r); // onclick 인라인 이스케이프 지옥 회피 — 전역에 보관
  let m=document.getElementById('share119Modal');
  if(!m){m=document.createElement('div');m.id='share119Modal';document.body.appendChild(m);}
  m.style.cssText='position:fixed;inset:0;z-index:99850;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center;';
  m.innerHTML=`<div style="background:#0a1828;border:1px solid rgba(224,90,78,.3);border-radius:16px 16px 0 0;max-width:430px;width:100%;padding:16px 16px calc(14px + env(safe-area-inset-bottom));max-height:82vh;display:flex;flex-direction:column;">
    <div style="display:flex;align-items:center;margin-bottom:10px;flex-shrink:0;">
      <b style="font-size:14.5px;color:#ffb3a8;">🚑 유관기관 공유</b>
      <span style="font-size:10px;color:#7a9cb8;margin-left:8px;">119 · 경찰 · 유관기관 전파용 요약</span>
      <button onclick="document.getElementById('share119Modal').remove()" style="margin-left:auto;background:none;border:none;color:rgba(255,255,255,.5);font-size:21px;cursor:pointer;padding:0 2px;">×</button>
    </div>
    <pre class="sel-ok" style="flex:1;min-height:0;overflow-y:auto;background:#060d1a;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:11px 12px;font-size:12px;line-height:1.75;color:#cfe2f2;white-space:pre-wrap;word-break:break-all;font-family:inherit;margin-bottom:11px;">${_esc(window._sh119Txt)}</pre>
    <div style="display:flex;gap:7px;flex-shrink:0;">
      <button class="btn2 btn2-pri" style="flex:1.2;" onclick="_share119Send('share')">📤 공유하기</button>
      <button class="btn2 btn2-sec" style="flex:1;" onclick="_share119Send('sms')">✉️ 문자</button>
      <button class="btn2 btn2-sec" style="flex:1;" onclick="_share119Send('copy')">📋 복사</button>
    </div>
    <div style="font-size:10px;color:#5a7a92;margin-top:8px;line-height:1.6;flex-shrink:0;">📤 공유하기 → 카카오톡·문자 등 앱 선택 · 지도 링크를 열면 사고지점이 바로 표시됩니다</div>
  </div>`;
  m.onclick=e=>{if(e.target===m)m.remove();};
  if(typeof _hapt==='function')_hapt(10);
}
function _share119Send(kind){
  const txt=window._sh119Txt||'';
  if(!txt)return;
  if(kind==='share'){
    if(navigator.share){navigator.share({title:'설악산 사고전파',text:txt}).catch(()=>{});}
    else{_share119Send('copy');toast('📋 이 기기는 공유 미지원 — 복사했습니다. 문자·카톡에 붙여넣으세요');}
    return;
  }
  if(kind==='sms'){
    // iOS는 sms:&body= / 안드로이드는 sms:?body= — 형식이 다르면 본문이 유실됨
    const sep=/iPad|iPhone|iPod/.test(navigator.userAgent)?'&':'?';
    try{location.href='sms:'+sep+'body='+encodeURIComponent(txt);}catch(e){_share119Send('copy');}
    return;
  }
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(()=>toast('📋 전파문이 복사되었습니다')).catch(()=>_fallbackCopy(txt));
  }else _fallbackCopy(txt);
}
function printReport(id){
  const r=getRes(id);const txt=_buildReportText(r);
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  // 새 창 대신 인앱 오버레이(← 앱으로 복귀 가능) — 상단 🖨 인쇄 버튼 사용
  const html='<html><head><title>'+esc(r.title||'구조 보고서')+'</title>'
    +'<meta name="viewport" content="width=device-width,initial-scale=1">'
    +'<style>body{font-family:-apple-system,"Malgun Gothic",sans-serif;padding:24px;color:#111;line-height:1.7;font-size:13px;background:#fff;}'
    +'h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:8px;}pre{white-space:pre-wrap;word-break:break-word;font-family:inherit;}</style></head><body>'
    +'<h1>🏔️ 설악산 구조 보고서</h1><pre>'+esc(txt)+'</pre></body></html>';
  _docPreviewOverlay(html,(r.title||'구조 보고서')+' — 인쇄/PDF');
}
function endSit(){
  const res=DB.g('rescues')||[];const idx=res.findIndex(x=>x.id===selResId);if(idx===-1)return;
  if(!confirm('상황을 종료 처리하겠습니까?'))return;
  res[idx].status='done';DB.s('rescues',res);
  try{if(typeof _closeLinkedSos==='function')_closeLinkedSos(res[idx]);}catch(e){} // 연계 SOS 링크도 종료
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
  // 부상 목록도 스냅샷 (＋부상 추가로 쌓은 배열 — 입력칸이 아니라 별도 저장 필요)
  const injuries=(typeof _injuries!=='undefined'&&_injuries.length)?_injuries.slice():[];
  return {fields,pills,injuries,author:(typeof getAuthor==='function')?getAuthor():'',at:Date.now()};
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
    // 버튼 그룹(성별·내외국인·장소구분·관계·신고자/동반자 유무)은 hidden 값으로 시각 상태 동기화
    const _syncBtns=(hidId,grpId)=>{const h=document.getElementById(hidId);if(!h||!h.value)return h;document.querySelectorAll('#'+grpId+' .tog-btn').forEach(b=>b.classList.toggle('on',b.dataset.val===h.value));return h;};
    _syncBtns('r_vGender','genderBtns');
    const n=_syncBtns('r_vNat','nationBtns');
    if(n&&n.value==='외국인'){const lbl=document.getElementById('vAddrLabel');if(lbl)lbl.textContent='국적 (국가명)';}
    _syncBtns('r_loctype','loctypeBtns');
    _syncBtns('r_repRel','repRelBtns');
    _syncBtns('r_repGender','repGenderBtns');
    const hr=_syncBtns('r_hasRep','hasRepBtns');
    if(hr&&hr.value==='y'){const rw=document.getElementById('reporterWrap');if(rw)rw.style.display='block';}
    const hc=_syncBtns('r_hasComp','hasCompBtns');
    if(hc&&hc.value==='y'){const cw=document.getElementById('companionWrap');if(cw)cw.style.display='block';}
    const tp=document.getElementById('r_type');
    if(tp&&tp.value==='기타'){const c=document.getElementById('r_typeCustom');if(c)c.style.display='block';}
    // 부상 목록 복원
    if(Array.isArray(snap.injuries)&&snap.injuries.length&&typeof _injuries!=='undefined'){
      _injuries=snap.injuries.slice();
      try{renderInjuries();}catch(e){}
      try{autoGenTitle();}catch(e){}
    }
  }catch(e){}
  try{if(typeof _updateTabDots==='function')_updateTabDots();}catch(e){}
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
// 임시저장 안내: 차단형 confirm 대신 폼 상단 작은 배너 — [불러오기]/[삭제] 선택 전까지 방해 없음
function _maybeOfferDraftRestore(){
  let snap=null;try{snap=JSON.parse(localStorage.getItem(_DRAFT_KEY)||'null');}catch(e){}
  if(!snap||!snap.at)return;
  if(Date.now()-snap.at>24*3600000){_clearRescueDraft();return;} // 24시간 지난 초안은 폐기
  const w=document.getElementById('repContent');if(!w)return;
  const old=document.getElementById('draftBanner');if(old)old.remove();
  const mins=Math.max(1,Math.round((Date.now()-snap.at)/60000));
  const when=mins<60?mins+'분 전':Math.round(mins/60)+'시간 전';
  const b=document.createElement('div');
  b.id='draftBanner';
  b.style.cssText='display:flex;align-items:center;gap:8px;margin:0 -12px;padding:8px 13px;background:rgba(240,192,64,.08);border-bottom:1px solid rgba(240,192,64,.3);font-size:11px;color:#f0c040;';
  b.innerHTML=`<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">📄 임시저장 ${when}${snap.author?' · '+_esc(snap.author):''}</span>
    <button id="draftLoadBtn" style="flex-shrink:0;background:rgba(240,192,64,.15);color:#f0c040;border:1px solid rgba(240,192,64,.4);border-radius:6px;padding:4px 11px;font-size:11px;font-weight:700;cursor:pointer;">불러오기</button>
    <button id="draftDelBtn" style="flex-shrink:0;background:rgba(255,255,255,.05);color:rgba(255,255,255,.45);border:1px solid rgba(255,255,255,.14);border-radius:6px;padding:4px 11px;font-size:11px;font-weight:700;cursor:pointer;">🗑 삭제</button>`;
  // 스티키 탭 바로 아래에 삽입
  const tabsEl=w.firstElementChild;
  if(tabsEl&&tabsEl.nextSibling)w.insertBefore(b,tabsEl.nextSibling);else w.appendChild(b);
  const _snap=snap;
  b.querySelector('#draftLoadBtn').onclick=function(){_restoreRescueForm(_snap);b.remove();toast('📄 임시저장 내용 불러옴');};
  b.querySelector('#draftDelBtn').onclick=function(){_clearRescueDraft();b.remove();toast('🗑 임시저장 삭제됨');};
}
function render1BoForm(prefill=null){
  const ms=getTeamMembers();
  const hdTeam=getHwandonghaTeam();
  const isNbo=prefill!==null&&!!prefill._phaseNum;
  const p=prefill||{};
  const w=document.getElementById('repContent');
  // 상단 '1보' phase 바 제거 — 자리만 차지. 섹터 탭이 최상단 고정으로 대체
  try{document.getElementById('phaseBar').innerHTML='';}catch(e){}

  const tabs=[
    {id:'repSec1', icon:'📍', label:'위치·기상'},
    {id:'repSec2', icon:'🤕', label:'환자·부상'},
    {id:'repSec3', icon:'🧑', label:'인적사항'},
    {id:'repSec5', icon:'📝', label:'기타'},
  ];

  const _offHrs=_isOffHours();

  w.innerHTML=`
    <!-- 섹터 탭 — 최상단 고정(sticky). 스크롤해도 4개 섹터 전환이 항상 보임 -->
    <div style="position:sticky;top:-12px;margin:-12px -12px 0;z-index:6;display:flex;background:#040a16;border-bottom:1px solid rgba(255,255,255,.06);overflow-x:auto;scrollbar-width:none;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,.45);">
      ${tabs.map((t,i)=>`<div class="rep-tab${i===0?' rep-tab-on':''}" onclick="switchRepTab('${t.id}',this)"
        style="flex:1;min-width:52px;padding:8px 3px;text-align:center;font-size:10px;cursor:pointer;
        border-bottom:2px solid ${i===0?'#4fa8d0':'transparent'};
        color:${i===0?'#4fa8d0':'rgba(255,255,255,.3)'};white-space:nowrap;">
        ${t.icon}<br>${t.label}<span id="dot_${t.id}" style="display:inline-block;width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.14);vertical-align:middle;margin-left:3px;"></span></div>`).join('')}
    </div>
    ${isNbo?`<div id="nboBanner" style="background:rgba(79,168,208,.1);border:1px solid rgba(79,168,208,.25);border-radius:0;margin:0 -12px;padding:9px 13px;font-size:11px;color:#4fa8d0;display:flex;align-items:center;justify-content:space-between;">
      <span>📋 <b>${p._phaseNum||2}보 작성중</b> — 변경사항만 수정</span>
      <button onclick="history.back()" style="background:rgba(255,255,255,.07);color:#c0d8ec;border:none;padding:5px 10px;border-radius:6px;font-size:11px;cursor:pointer;">✕</button>
    </div>`:''}

    <!-- ══ 섹터0: 고도화 타임라인 ══ -->
    <div id="repSec0" class="rep-sec" style="display:none;padding:12px;overflow-y:auto;">
      <div id="formTlWrap">
        <div style="text-align:center;padding:30px 12px;font-size:12px;color:rgba(255,255,255,.3);line-height:1.8;">위치·기상 탭에서 사고 위치를 입력하면<br>경로 시뮬레이션이 표시됩니다</div>
      </div>
    </div>

    <!-- ══ 섹터1: 위치·기상 ══ -->
    <div id="repSec1" class="rep-sec" style="padding:12px;overflow-y:auto;">
      ${isNbo?`<div class="fg" style="margin-bottom:10px;"><span class="fl">🕐 사고 일시 <span style="font-size:9px;color:#7a9cb8;font-weight:400;">(잘못 기록된 경우 수정 — 저장 시 반영)</span></span>
        <input type="datetime-local" id="r_accdt" class="fi" value="${String(p.date||'').replace(' ','T').slice(0,16)}"></div>`:''}
      <!-- AI 출동지령서 스캔 (상단 고정칸에서 섹터1 안으로 이동 — 화면 낭비 제거) -->
      <div style="margin-bottom:10px;">
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
      <!-- 📞 접수 — 시간순으로 가장 먼저 아는 정보라 첫 탭 최상단 (기타 탭에서 이동, '경위'와의 중복 혼동 해소) -->
      <div class="rsec"><div class="rsec-t">📞 사고 접수 <span style="font-size:9px;color:#7a9cb8;font-weight:400;">신고 받은 그대로</span></div>
        <div class="fg"><span class="fl">접수 경로</span>
          <div style="display:flex;gap:6px;" id="recvRouteBtns">
            ${['119','사무소 전화','현장 접수'].map(o=>`<button class="tog-btn${(p.recvRoute||'119')===o?' on':''}" data-val="${o}" style="flex:1;white-space:nowrap;padding:9px 4px;font-size:11.5px;" onclick="selRecvRoute('${o}')">${o==='119'?'🚒 119':o==='사무소 전화'?'☎️ 사무소전화':'🧍 현장접수'}</button>`).join('')}
          </div>
          <input type="hidden" id="r_recvRoute" value="${p.recvRoute||'119'}">
        </div>
        <div class="fg"><span class="fl">접수 내용 <span style="font-size:9px;color:#7a9cb8;font-weight:400;">(신고 원문 — 파악된 사고 전개는 환자·부상 탭 '사고 경위'에)</span></span>
          <textarea id="r_recv" class="fta" rows="3" placeholder="예) 119 이첩 — 천불동계곡 하산 중 발목 부상, 자력 이동 불가, 일행 1명">${p.reception||''}</textarea>
        </div>
      </div>
      <div class="rsec"><div class="rsec-t">🚨 사고 유형</div>
        <div class="pills" id="typePills">
          ${(()=>{const base=['안전사고','조난','고립','실종','기타'];const cur=p.type||'안전사고';const isCustom=!base.includes(cur);return base.map(o=>`<div class="pill${(isCustom?o==='기타':cur===o)?' on':''}" onclick="selAccType('${o}')">${o}</div>`).join('');})()}
        </div>
        <input type="text" id="r_typeCustom" class="fi" placeholder="사고 유형 직접 입력 (예: 낙석, 화재)" style="display:${(p.type&&!['안전사고','조난','고립','실종','기타'].includes(p.type))?'block':'none'};margin-top:6px;" value="${(p.type&&!['안전사고','조난','고립','실종','기타'].includes(p.type))?_esc(p.type):''}" oninput="autoGenTitle()">
        <input type="hidden" id="r_type" value="${(p.type&&!['안전사고','조난','고립','실종','기타'].includes(p.type))?'기타':(p.type||'안전사고')}">
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
        <div id="climbLocWrap" style="display:${(p.loctype==='암벽'||p.loctype==='빙벽')?'block':'none'};" class="fg">
          ${(p.loctype==='암벽'||p.loctype==='빙벽')?`<span class="fl">📍 ${p.loctype} 위치 선택 <span style="font-size:9px;color:#7a9cb8;font-weight:400;">${p.loctype==='암벽'?'지구별':''}</span></span>${_climbLocBtnsHtml(p.loctype,p.location)}`:''}
        </div>
        <div id="permitWrap" style="display:${p.loctype&&(p.loctype==='암벽'||p.loctype==='빙벽')?'block':'none'};" class="fg">
          <span class="fl">🏔️ 암빙벽 허가</span>
          <select id="r_permit" class="fsel" onchange="chkPermit(this)">${['해당없음','허가자 있음','무허가'].map(o=>`<option${p.permit===o?' selected':''}>${o}</option>`).join('')}</select>
        </div>
        <div id="permitRoster" style="display:${p.permit==='허가자 있음'?'block':'none'};" class="fg">
          <button type="button" onclick="openClimbVictimPick()" style="width:100%;background:linear-gradient(145deg,#3a2409,#5a3a12);color:#f0c88a;border:1px solid rgba(240,200,138,.35);border-radius:8px;padding:10px;font-size:12.5px;font-weight:800;cursor:pointer;">🧗 그날 암벽 신청명단 확인 · 사고자 불러오기</button>
          <div style="font-size:9.5px;color:#7a9cb8;margin-top:4px;">※ 사고자가 신청자가 아닐 수 있습니다 — 명단에서 동반자도 개별 선택됩니다</div>
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

      <!-- 1. 사고 원인·경위 (요청: 최상단) -->
      <div class="rsec"><div class="rsec-t">⚡ 사고 원인·경위</div>
        <div class="fg"><span class="fl">사고 원인</span>
          <select id="r_cause" class="fsel" onchange="autoGenTitle()">
            ${['본인부주의','실족','추락','낙석 피격','탈진/탈수','저체온','심혈관 이상','동물 피해','익수','기타'].map(o=>`<option${(p.cause||'본인부주의')===o?' selected':''}>${o}</option>`).join('')}
          </select>
        </div>
        <div class="fg"><span class="fl">사고 경위 <span style="font-size:9px;color:#7a9cb8;font-weight:400;">(파악된 사실 — 접수 원문과 달라진 내용 포함)</span></span>
          <textarea id="r_sit" class="fta" rows="4" placeholder="예) 오전 09:00 비선대 주차장에서 산행 시작, 11:30경 천불동계곡 3km 지점 하산 중 실족하여 우측 발목 부상 발생">${p.situation||''}</textarea>
          <button type="button" onclick="_copyRecvToSit()" style="margin-top:5px;background:rgba(79,168,208,.08);border:1px solid rgba(79,168,208,.25);color:#5d92bc;border-radius:7px;padding:5px 10px;font-size:10.5px;font-weight:700;cursor:pointer;">📞 접수 내용 가져와서 시작</button>
        </div>
      </div>

      <!-- 2. 부상 현황 -->
      <div class="rsec"><div class="rsec-t">🩺 부상 현황</div>
        <div style="background:#060d1a;border-radius:8px;border:1px solid rgba(255,255,255,.07);padding:10px;margin-bottom:8px;">
          <!-- ⚡ 자주 발생 원터치 — 다발 조합 한 번에. 그 외는 아래 유형·부위 선택 -->
          <div style="font-size:10px;color:#f0c060;font-weight:700;margin-bottom:5px;">⚡ 자주 발생 — 누르면 바로 추가</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;padding-bottom:9px;border-bottom:1px dashed rgba(255,255,255,.08);">
            ${(typeof _QUICK_INJ!=='undefined'?_QUICK_INJ:[]).map(q=>`<div class="pill" style="font-size:11px;cursor:pointer;" onclick="quickInjury('${q[0]}','${q[1]}')">${q[2]}</div>`).join('')}
          </div>
          <!-- 외상/내상 구분 (기본: 외상) -->
          <div style="display:flex;gap:6px;margin-bottom:8px;" id="injCatBtns">
            <button class="tog-btn on" data-val="외상" style="flex:1;padding:7px 4px;min-height:34px;font-size:12px;" onclick="selInjCat('외상')">🩹 외상</button>
            <button class="tog-btn" data-val="내상" style="flex:1;padding:7px 4px;min-height:34px;font-size:12px;" onclick="selInjCat('내상')">💊 내상·질환</button>
          </div>
          <!-- ① 부상 유형 (카테고리별 목록 — JS가 렌더) -->
          <div style="font-size:10px;color:#7a9cb8;font-weight:700;margin-bottom:5px;">① 부상 유형 <span style="font-weight:400;color:#5a7a92;">※ 내상·질환은 부위 불필요</span></div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;" id="injTypePills"></div>
          <div id="injTypeCustomWrap" style="display:none;margin-bottom:8px;">
            <input type="text" id="injTypeCustom" class="fi" placeholder="부상·질환 직접 입력 (예: 안구 손상, 알레르기 쇼크)">
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
        <!-- 암벽 명단 불러오기 — 장소구분=암벽일 때만 표시 (chkIllegal이 토글). 코스를 골랐으면 그 코스 명단만 뜸 -->
        ${(DB.g('climbDates')||[]).length?`<div id="climbPickWrap3" style="display:${p.loctype==='암벽'?'block':'none'};"><button type="button" onclick="openClimbVictimPick()" style="width:100%;margin-bottom:9px;background:linear-gradient(145deg,#3a2409,#5a3a12);color:#f0c88a;border:1px solid rgba(240,200,138,.35);border-radius:8px;padding:10px;font-size:12.5px;font-weight:800;cursor:pointer;">🧗 암벽 명단에서 불러오기 (사고자·동반자 자동입력)</button></div>`:''}
        <div class="frow">
          <div class="fg"><span class="fl">성명</span><input type="text" id="r_vName" class="fi" value="${p.vName||''}"></div>
          <div class="fg"><span class="fl">연락처</span><input type="tel" id="r_vTel" class="fi" value="${p.vTel||''}"></div>
        </div>
        ${isNbo&&p.vTel?`<div style="margin:-2px 0 8px;">${(typeof _telBtnsHtml==='function')?_telBtnsHtml(p.vTel,curResId,'사고자',p.vName):''}</div>`:''}
        <div class="fg"><span class="fl">성별</span>
          <div style="display:flex;gap:6px;" id="genderBtns">
            ${['남','여','알수없음'].map(o=>`<button class="tog-btn${(p.vGender||'알수없음')===o?' on':''}" data-val="${o}" style="flex:1;" onclick="selGender('${o}')">${o==='남'?'👨 남':o==='여'?'👩 여':'알수없음'}</button>`).join('')}
          </div>
          <input type="hidden" id="r_vGender" value="${p.vGender||'알수없음'}">
        </div>
        <div class="fg"><span class="fl">내/외국인</span>
          <div style="display:flex;gap:6px;" id="nationBtns">
            ${['내국인','외국인','알수없음'].map(o=>`<button class="tog-btn${(p.vNation||'알수없음')===o?' on':''}" data-val="${o}" style="flex:1;" onclick="selNation('${o}')">${o==='내국인'?'🇰🇷 내국인':o==='외국인'?'🌏 외국인':'알수없음'}</button>`).join('')}
          </div>
          <input type="hidden" id="r_vNat" value="${p.vNation||'알수없음'}">
        </div>
        <div class="frow">
          <div class="fg"><span class="fl">생년월일</span><input type="text" inputmode="numeric" id="r_vBirth" class="fi" placeholder="19901231" maxlength="10" value="${p.vBirth||''}" oninput="_fmtBirth(this)"></div>
          <div class="fg"><span class="fl" id="vAddrLabel">${p.vNation==='외국인'?'국적 (국가명)':'거주지'}</span><input type="text" id="r_vAddr" class="fi" placeholder="${p.vNation==='외국인'?'예: 미국, 중국':'시/도'}" value="${p.vAddr||((p.vNation==='외국인'&&p.vNationality)?p.vNationality:'')}"></div>
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
          <div class="fg"><span class="fl">사고자와의 관계 <span style="font-size:9px;color:#7a9cb8;font-weight:400;">(동반자 선택 시 동반자1 정보 자동 입력)</span></span>
            <div style="display:flex;gap:5px;flex-wrap:wrap;" id="repRelBtns">
              ${['동반자','가족','일행','목격자','본인','기타'].map(o=>`<button class="tog-btn${p.repRel===o?' on':''}" data-val="${o}" onclick="selRepRel('${o}')" style="padding:7px 12px;min-height:34px;font-size:11px;">${o}</button>`).join('')}
            </div>
            <input type="hidden" id="r_repRel" value="${p.repRel||''}">
          </div>
          <div class="frow">
            <div class="fg"><span class="fl">성명</span><input type="text" id="r_repName" class="fi" value="${p.repName||''}"></div>
            <div class="fg"><span class="fl">연락처</span><input type="tel" id="r_repTel" class="fi" value="${p.repTel||''}"></div>
          </div>
          <div class="frow">
            <div class="fg"><span class="fl">생년월일 (선택)</span><input type="text" inputmode="numeric" id="r_repBirth" class="fi" placeholder="19801231" maxlength="10" value="${p.repBirth||''}" oninput="_fmtBirth(this)"></div>
            <div class="fg"><span class="fl">성별</span>
              <div style="display:flex;gap:5px;" id="repGenderBtns">
                ${['남','여','알수없음'].map(o=>`<button class="tog-btn${(p.repGender||'알수없음')===o?' on':''}" data-val="${o}" style="flex:1;padding:7px 2px;min-height:36px;font-size:11px;" onclick="selRepGender('${o}')">${o}</button>`).join('')}
              </div>
              <input type="hidden" id="r_repGender" value="${p.repGender||'알수없음'}">
            </div>
          </div>
          ${isNbo&&p.repTel?`<div style="margin:-2px 0 8px;">${(typeof _telBtnsHtml==='function')?_telBtnsHtml(p.repTel,curResId,'신고자',p.repName):''}</div>`:''}
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

    <!-- ══ 섹터4: 기타 (순서: 응소 → 접수내용 → 제목·작성 → 동원장비) ══ -->
    <div id="repSec5" class="rep-sec" style="display:none;padding:12px;overflow-y:auto;">
      ${!isNbo?`<div class="rsec" style="border:1px solid ${_offHrs?'rgba(231,76,60,.3)':'rgba(79,168,208,.18)'};border-radius:10px;background:${_offHrs?'rgba(231,76,60,.08)':'rgba(79,168,208,.05)'};padding:10px 12px;">
        <div class="rsec-t" style="color:${_offHrs?'#e74c3c':'#4fa8d0'};">${_offHrs?'🌙 야간 출동(18~09시) — 응소 여부 선택':'🚨 응소 여부 (해당 시 선택)'}</div>
        <div class="pills" id="mobilizePills">
          ${['특구대','재난과','전직원응소'].map(o=>`<div class="pill${(p.mobilize||[]).includes(o)?' on':''}" onclick="tPill(this)">${o}</div>`).join('')}
        </div>
      </div>`:''}
      <!-- 접수 경로·내용은 위치·기상 탭 최상단으로 이동 (경위와 중복 혼동 해소) -->
      <div class="rsec" style="margin-top:${isNbo?'0':'12px'};"><div class="rsec-t">📋 사고 제목 및 작성 정보</div>
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
      <div class="rsec" style="margin-top:12px;"><div class="rsec-t">🛠️ 동원 장비</div>
        <div class="fg"><span class="fl">구조 방법 (복수)</span>
          <div class="pills" id="rescMeth">${['들것','부축','헬기','차량','자력하산','로프구조','기타'].map(o=>`<div class="pill${(p.rescueMethod||[]).includes(o)?' on':''}" onclick="tPill(this)">${o}</div>`).join('')}</div>
        </div>
        <div class="fg"><span class="fl">동원 장비</span>
          <textarea id="r_equip" class="fta" rows="2" placeholder="들것, 로프, AED, 헬기 등">${p.equipment||''}</textarea>
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
    if(wc){wc.addEventListener('input',()=>{if(window._reportMode==='form'){_formDirty=true;try{_updateTabDots();}catch(e){}}});
           wc.addEventListener('change',()=>{if(window._reportMode==='form'){_formDirty=true;try{_updateTabDots();}catch(e){}}});
           _draftListenerBound=true;}
  }
  setTimeout(()=>{try{_updateTabDots();}catch(e){}},250); // 초기(프리필) 상태 점 반영
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
    <div style="background:#0b1c30;border:.5px solid rgba(79,168,208,.14);border-radius:12px;padding:11px 13px;">
      <div id="tlTeamHdr" style="font-size:11px;color:#4fa8d0;font-weight:800;margin-bottom:4px;">${_tlTeamsHdrHtml()}</div>
      <div id="tlAllTeams">${_tlTeamRowsHtml()}</div>
      <div id="tlBuildArea" style="margin-top:9px;">${_tlBuilding?_renderBuildPanelHtml():_renderCreateBtnsHtml()}</div>
    </div>`;
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
  try{_updateTabDots();}catch(e){}
}
// 섹터 탭 입력 점: 초록=핵심 입력됨 · 빨강=필수 미입력 · 회색=선택 항목 비어있음 — 뭘 안 썼는지 한눈에
function _updateTabDots(){
  const _v=id=>{const e=document.getElementById(id);return e&&String(e.value||'').trim()?1:0;};
  const state={
    repSec1:(_v('r_gps')||_v('r_loc'))?'ok':'req',                                                          // 위치 필수
    repSec2:((typeof _injuries!=='undefined'&&_injuries.length)||getSelPills('sevPills').length||_v('r_sit'))?'ok':'req', // 부상·중증도·경위 중 1 필수
    repSec3:(_v('r_vName')||_v('r_vTel'))?'ok':'req',                                                       // 이름 또는 연락처 필수
    repSec5:(_v('r_extra')||getSelPills('rescMeth').length||getSelPills('mobilizePills').length)?'ok':'opt', // 선택 (접수내용은 섹터1로 이동)
  };
  Object.entries(state).forEach(([sec,st])=>{
    const d=document.getElementById('dot_'+sec);
    if(!d)return;
    d.style.background=st==='ok'?'#27ae60':st==='req'?'#e05a4e':'rgba(255,255,255,.14)';
    d.style.boxShadow=st==='req'?'0 0 5px rgba(224,90,78,.85)':'none';
  });
}
// 경위 칸에 접수 원문을 가져와 시작점으로 — 같은 내용 두 번 타이핑 방지
function _copyRecvToSit(){
  const rv=(document.getElementById('r_recv')?.value||'').trim();
  if(!rv){toast('접수 내용이 비어있습니다 — 위치·기상 탭 맨 위 📞 사고 접수에 먼저 입력하세요');return;}
  const s=document.getElementById('r_sit');if(!s)return;
  s.value=s.value.trim()?(s.value.trim()+'\n'+rv):rv;
  toast('📞 접수 내용을 붙여넣었습니다 — 파악된 사실로 다듬어 주세요');
  try{_updateTabDots();}catch(e){}
}
// 제출 직전 필수 미입력 목록 — 비어 있으면 빈 배열 (응급 시 확인 후 그대로 등록 가능해야 하므로 차단하지 않음)
function _collect1BoMissing(){
  const _v=id=>{const e=document.getElementById(id);return e&&String(e.value||'').trim();};
  const miss=[];
  if(!_v('r_gps')&&!_v('r_loc'))miss.push('사고 위치 (GPS 좌표 또는 장소)');
  if(!(typeof _injuries!=='undefined'&&_injuries.length)&&!getSelPills('sevPills').length&&!_v('r_sit'))miss.push('환자 상태 (부상·중증도·경위 중 1개)');
  if(!_v('r_vName')&&!_v('r_vTel'))miss.push('사고자 인적사항 (이름 또는 연락처)');
  return miss;
}





function submit1Bo(){
  if(_1boSubmitting)return;
  _1boSubmitting=true;
  const _btn=document.querySelector('#rep1BoFooter .btn-submit');
  if(_btn){_btn.disabled=true;_btn.style.opacity='.5';}
  try{
  autoGenTitle();
  // 야간(18~09시) 등록인데 응소 미선택 → 실수 방지 확인 한 번
  if(typeof _isOffHours==='function'&&_isOffHours()&&!getSelPills('mobilizePills').length){
    if(!confirm('🌙 야간 출동(18~09시)입니다.\n응소 선택 없이 등록할까요?\n(응소 선택은 기타 탭 맨 아래)'))return;
  }
  // 필수 미입력 요약 — 제출 전 마지막 확인 (탭의 빨간 점 항목. 응급 시 [확인]으로 그대로 등록, N보로 보완 가능)
  {
    const _miss=(typeof _collect1BoMissing==='function')?_collect1BoMissing():[];
    if(_miss.length&&!confirm('⚠️ 아직 입력하지 않은 필수 항목이 있습니다:\n\n· '+_miss.join('\n· ')+'\n\n이대로 등록할까요? (이후 N보 추가 보고로 보완할 수 있습니다)'))return;
  }
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
    type:(typeof _resolvedAccType==='function')?_resolvedAccType():(document.getElementById('r_type')?.value||'안전사고'),
    date:nowStr,
    reception:document.getElementById('r_recv')?.value||'',
    recvRoute:document.getElementById('r_recvRoute')?.value||'119',
    weather:getSelPills('weatherPills')[0]||'',
    initTemp:document.getElementById('r_initTemp')?.value||'',
    weatherAlert:getWeatherAlertStr()||'',
    alertOpId:((DB.g('alertOps')||[]).find(o=>!o.closedAt)||{}).id||null,
    lat, lng,
    alt:(window._formGpsAlt!=null)?window._formGpsAlt:null, // GPS 수신 시 고도(m) — 지도 선택이면 null(표지판 기반 추정 표시)
    location:document.getElementById('r_loc')?.value||'',
    loctype:document.getElementById('r_loctype')?.value||'',
    fine:document.getElementById('fineWrap')?.style.display!=='none'?(document.getElementById('r_fine')?.value||''):'',
    vName:document.getElementById('r_vName')?.value||'',
    vTel:document.getElementById('r_vTel')?.value||'',
    vNation:document.getElementById('r_vNat')?.value||'알수없음',
    vNationality:(document.getElementById('r_vNat')?.value==='외국인')?(document.getElementById('r_vAddr')?.value||''):'', // 외국인이면 거주지칸=국적

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
    hasRep:document.getElementById('r_hasRep')?.value||'n',
    repName:document.getElementById('r_repName')?.value||'',
    repTel:document.getElementById('r_repTel')?.value||'',
    repRel:document.getElementById('r_repRel')?.value||'',
    repBirth:document.getElementById('r_repBirth')?.value||'',
    repGender:document.getElementById('r_repGender')?.value||'알수없음',
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
  if(typeof _hapt==='function')_hapt([30,40,30]); // 등록 성공 햅틱 — 긴박한 상황에서 화면 안 보고도 확인
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

