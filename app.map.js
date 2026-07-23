'use strict';
// ══════════════════════════════════════════
// 카카오맵
// ══════════════════════════════════════════
let mapI,mapR,iOvs=[],rOvs=[],iEls=[],rEls=[],myOv=null,mapIType='hybrid',mapRType='hybrid';
function _pinSz(level,off){
  const o=off||0;
  if(level<=3) return {sz:30+o,fs:13,bw:2,  numFs:11,numPad:'2px 5px'};
  if(level<=4) return {sz:24+o,fs:10, bw:2,  numFs:10,numPad:'2px 4px'};
  if(level<=5) return {sz:20+o,fs:8, bw:1.5,numFs:9, numPad:'2px 3px'};
  if(level<=6) return {sz:16+o,fs:7, bw:1.5,numFs:8, numPad:'1px 3px'};
  if(level<=7) return {sz:13+o,fs:6, bw:1,  numFs:7, numPad:'1px 2px'};
  if(level<=8) return {sz:11+o,fs:5, bw:1,  numFs:6, numPad:'1px 2px'};
  if(level<=9) return {sz:8+o, fs:3, bw:0.5,numFs:6, numPad:'1px 2px'};
  if(level<=10)return {sz:7+o, fs:3, bw:0.5,numFs:5, numPad:'0px 2px'};
  if(level<=11)return {sz:6+o, fs:2, bw:0.5,numFs:0, numPad:'0px 1px'};
  return              {sz:5+o, fs:2, bw:0.5,numFs:0, numPad:'0px 1px'};
}
function _scaleOvs(els,level,off){
  const s=_pinSz(level,off);
  els.forEach(el=>{
    if(!el)return;
    if(el.classList.contains('mpin')||el.classList.contains('mpin-sm')){
      let sz=s.sz,fs=(s.fs<6?0:s.fs),bw=s.bw; // 이모지는 5px 이하 렌더 불가(원 밖으로 넘침) → 소형은 글자 숨김
      if(el.classList.contains('p-bad')){sz=Math.max(sz,16);fs=Math.max(s.fs,9);bw=Math.max(bw,1.5);} // ⚠️경고 시설은 축소해도 식별 가능한 최소 크기
      else if(el.classList.contains('p-fac')){sz=Math.max(sz,15);fs=Math.max(fs,9);bw=Math.max(bw,1);} // 시설물 핀은 축소해도 이모지가 보이도록 최소 크기 유지
      el.style.width=sz+'px';el.style.height=sz+'px';
      el.style.fontSize=fs+'px';
      el.style.borderWidth=bw+'px';
    } else if(el.classList.contains('mpin-num')){
      if(s.numFs===0){el.style.display='none';}
      else{el.style.display='';el.style.fontSize=s.numFs+'px';el.style.padding=s.numPad;}
    } else if(el.classList.contains('res-chip-og')){
      // 진행중 사고 칩: 축소(레벨↑)면 아이콘만 작게, 확대(레벨↓)면 전체 칩
      const span=el.querySelector('span');
      if(level>=7){ // 축소: 아이콘만 원형
        if(span)span.style.display='none';
        el.style.padding=level>=9?'1px 3px':'2px 4px';
        el.style.fontSize=(level>=9?9:11)+'px';el.style.borderRadius='50%';
      } else { // 확대: 전체 칩(유형 텍스트 표시)
        if(span)span.style.display='';
        el.style.padding=level<=4?'3px 9px 3px 7px':'2px 7px 2px 6px';
        el.style.fontSize=(level<=4?11:10)+'px';el.style.borderRadius='11px';
      }
    }
  });
}
// ── 경량 커스텀 클러스터: 커스텀 오버레이를 화면 픽셀 격자로 묶어 개수 버블 표시 ──
// items: [{ov, lat, lng}] — 단독은 그대로 표시, 같은 격자 2개 이상이면 멤버 숨기고 개수 버블
function _clusterByPixels(map,items,cellPx,onClick,cls){
  const out=[];
  let proj;try{proj=map.getProjection();}catch(e){proj=null;}
  if(!proj){items.forEach(it=>{try{it.ov.setMap(map);}catch(e){}});return out;}
  const cells=new Map();
  items.forEach(it=>{
    if(!(it.lat&&it.lng)){try{it.ov.setMap(map);}catch(e){}return;}
    let pt;try{pt=proj.pointFromCoords(new kakao.maps.LatLng(it.lat,it.lng));}catch(e){pt=null;}
    if(!pt){try{it.ov.setMap(map);}catch(e){}return;}
    const key=Math.floor(pt.x/cellPx)+'_'+Math.floor(pt.y/cellPx);
    if(!cells.has(key))cells.set(key,[]);
    cells.get(key).push(it);
  });
  cells.forEach(group=>{
    if(group.length<2){group.forEach(it=>{try{it.ov.setMap(map);}catch(e){}});return;}
    group.forEach(it=>{try{it.ov.setMap(null);}catch(e){}});
    // 버블 위치: 평균점이 아니라 그룹에서 가장 최근 건의 실제 좌표 — 축소 시 사고 위치가 어긋나 보이던 문제 해결
    let anchor=group[0];
    group.forEach(it=>{const a=(it.ov&&it.ov._ev&&+it.ov._ev.id)||0;const b=(anchor.ov&&anchor.ov._ev&&+anchor.ov._ev.id)||0;if(a>b)anchor=it;});
    const lat=anchor.lat,lng=anchor.lng;
    const el=document.createElement('div');
    el.className='map-cluster'+(cls?' '+cls:'');el.textContent=group.length;
    el.addEventListener('click',e=>{e.stopPropagation();onClick&&onClick(lat,lng,group);});
    const ov=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(lat,lng),content:el,clickable:true,zIndex:6});
    ov.setMap(map);out.push(ov);
  });
  return out;
}
// 클러스터 멤버가 사실상 같은 지점(확대해도 안 풀림)인지
function _clusterTooTight(group){
  if(!group||group.length<2)return false;
  var maxD=0;
  for(var i=0;i<group.length;i++)for(var j=i+1;j<group.length;j++){
    var d=_haversine(group[i].lat,group[i].lng,group[j].lat,group[j].lng);
    if(d>maxD)maxD=d;
  }
  return maxD<25; // 25m 이내 → 줌으로 분리 불가 → 목록 선택
}
// 같은 자리에 겹친 사고/위험 목록 팝업 (확대로 못 풀 때)
function _showClusterList(group){
  var items=(group||[]).map(function(g){return g.ov&&g.ov._ev;}).filter(Boolean);
  if(!items.length)return;
  if(items.length===1){try{openResPopup(items[0].id,items[0].type);}catch(e){}return;}
  var m=document.getElementById('clusListModal');
  if(!m){m=document.createElement('div');m.id='clusListModal';document.body.appendChild(m);}
  m.style.cssText='position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:24px;';
  var rows=items.map(function(it){
    var og=it.status==='ongoing';
    var ico=it.type==='hazard'?'⚠️':(og?'🔴':'✅');
    var tag=it.type==='hazard'?'위험':(og?'진행중':'종료');
    return '<div onclick="(function(){var e=document.getElementById(\'clusListModal\');if(e)e.remove();openResPopup(\''+_escq(String(it.id))+'\',\''+it.type+'\');})()" style="display:flex;align-items:center;gap:8px;padding:11px;border-radius:9px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);margin-bottom:6px;cursor:pointer;"><span style="font-size:16px;">'+ico+'</span><span style="font-size:12px;color:#eaecef;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(it.title||'(제목없음)')+'</span><span style="font-size:10px;font-weight:700;color:'+(og?'#ff6b5e':(it.type==='hazard'?'#e67e22':'#8b95a1'))+';flex-shrink:0;">'+tag+'</span></div>';
  }).join('');
  m.innerHTML='<div style="background:#16161a;border:1px solid rgba(255,255,255,.25);border-radius:14px;max-width:340px;width:100%;max-height:70vh;overflow-y:auto;padding:14px;">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span style="font-size:14px;font-weight:800;color:#eaecef;">📍 같은 위치 '+items.length+'건</span><button onclick="var e=document.getElementById(\'clusListModal\');if(e)e.remove();" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:22px;cursor:pointer;line-height:1;">×</button></div>'
    +rows+'</div>';
  m.onclick=function(e){if(e.target===m)m.remove();};
}
function _clusterZoom(map,lat,lng){
  // 부드러운 확대 — 즉시 점프 대신 애니메이션으로 (겹친 핀·클러스터 탭 시 자연스럽게)
  try{map.setLevel(Math.max(1,map.getLevel()-2),{anchor:new kakao.maps.LatLng(lat,lng),animate:{duration:300}});}
  catch(e){try{map.setCenter(new kakao.maps.LatLng(lat,lng));map.setLevel(Math.max(1,map.getLevel()-2));}catch(e2){}}
}
// 구조 지도: 사고/위험 '상황' 핀만 클러스터 (다목적위치표지판 등 시설물은 제외)
var _rClusterOvs=[],_rEvItems=[];
function _reclusterRescue(){
  if(!mapR)return;
  // 배율·데이터가 그대로면 재클러스터 생략 — 클러스터 전면 재생성은 비싸고 핀이 잠깐 사라져 보임
  let _lv=9;try{_lv=mapR.getLevel();}catch(e){}
  const _rcSig=_lv+'|'+_rEvItems.length;
  if(window._rcLastSig===_rcSig)return;
  window._rcLastSig=_rcSig;
  _rClusterOvs.forEach(o=>{try{o.setMap(null);}catch(e){}});_rClusterOvs=[];
  // 종료/위험만 클러스터링(개수 버블). 진행중은 절대 합치지 않고 개별 칩으로 항상 표시.
  const others=_rEvItems.filter(it=>!it.noClus);
  // 너무 크게 뭉치지 않도록 셀을 작게(줌인일수록 더 잘게) — 가까운 것만 묶임
  let lv=9;try{lv=mapR.getLevel();}catch(e){}
  const cell=lv>=10?48:lv>=8?36:lv>=6?28:22;
  _rClusterOvs=_clusterByPixels(mapR,others,cell,function(la,ln,group){
    // 더 확대해도 안 풀리는 경우(거의 최대 줌이거나 같은 지점에 겹침) → 목록 선택 팝업
    var curLv=9;try{curLv=mapR.getLevel();}catch(e){}
    if(curLv<=2||_clusterTooTight(group))_showClusterList(group);
    else _clusterZoom(mapR,la,ln);
  },'');
  _rEvItems.filter(it=>it.noClus).forEach(it=>{try{it.ov.setMap(mapR);}catch(e){}});
}
// 시설물 점검 지도: 시설물 핀 클러스터
var _iClusterOvs=[],_iItems=[];
function _reclusterInspect(){
  if(!mapI)return;
  _iClusterOvs.forEach(o=>{try{o.setMap(null);}catch(e){}});_iClusterOvs=[];
  // 숫자 버블로 뭉치지 않음 — 시설물 핀은 축소·확대 어느 배율에서도 항상 개별 표시(원래 방식).
  // 겹쳐서 못 누르는 핀은 _facPinTap이 확대·목록 시트로 처리(숫자 뭉치기 아님).
  // 이미 붙어 있는 핀은 재부착하지 않음(깜빡임·프레임 저하 방지)
  iOvs.forEach(o=>{try{if(o.getMap()!==mapI)o.setMap(mapI);}catch(e){}});
}
// ── 시설물 겹친 핀: 하단 목록 시트로 선택 ──────────────────────────────
// 핀은 모두 그대로 표시(숫자 뭉치기 없음). 확대해도 겹쳐 못 누르는 지점을 누르면
// 아래에서 '같은 자리 N개' 목록 시트가 올라와 하나를 고른다(겹침 없이 가장 잘 보임).
// 구조지도 _showClusterList·'내 주변 시설물' 시트와 동일 패턴.
// 화면 픽셀상 22px 이내에 겹친 시설물 오버레이 묶음(눌린 핀 포함)
function _facOverlapGroup(id){
  if(!mapI)return[];
  var proj;try{proj=mapI.getProjection();}catch(e){return[];}
  if(!proj)return[];
  var me=null;iOvs.forEach(function(o){if(o._facId===id)me=o;});
  if(!me)return[];
  var mp;try{mp=proj.containerPointFromCoords(new kakao.maps.LatLng(me._lat,me._lng));}catch(e){return[];}
  var R=22,grp=[];
  iOvs.forEach(function(o){
    if(!o._lat||!o._lng)return;
    var p;try{p=proj.containerPointFromCoords(new kakao.maps.LatLng(o._lat,o._lng));}catch(e){return;}
    var dx=p.x-mp.x,dy=p.y-mp.y;
    if(dx*dx+dy*dy<=R*R)grp.push(o);
  });
  return grp;
}
// 핀 탭 진입점 — 겹친 핀이면: 축소 상태면 먼저 확대해 분리 시도, 최대확대·초근접(25m내)이면 목록 시트. 단독은 바로 상세.
// (구조지도 _reclusterRescue와 동일 정책 — 확대로 풀리는 겹침은 굳이 목록 안 띄움)
function _facPinTap(id){
  var grp=[];try{grp=_facOverlapGroup(id);}catch(e){grp=[];}
  if(grp.length>=2){
    var curLv=9;try{curLv=mapI.getLevel();}catch(e){}
    var pts=grp.map(function(o){return{lat:o._lat,lng:o._lng};});
    if(curLv<=2||_clusterTooTight(pts)){_showFacOverlapList(grp,id);return;} // 더 확대해도 안 풀림 → 목록
    var me=null;grp.forEach(function(o){if(o._facId===id)me=o;});me=me||grp[0];
    try{_closeFacOverlapSheet();}catch(e){}
    _clusterZoom(mapI,me._lat,me._lng); // 확대해서 겹친 핀 분리
    return;
  }
  try{_closeFacOverlapSheet();}catch(e){}
  openFacFromMap(id);
}
function _closeFacOverlapSheet(){var e=document.getElementById('facOverlapSheet');if(e)e.remove();}
function _pickFacOverlap(id){_closeFacOverlapSheet();openFacFromMap(id);}
function _showFacOverlapList(group,tappedId){
  _closeFacOverlapSheet();
  var facs=DB.g('facilities')||[];
  var items=group.map(function(o){var f=null;facs.forEach(function(x){if(x.id===o._facId)f=x;});return f;}).filter(Boolean);
  if(items.length<2){if(items[0])openFacFromMap(items[0].id);return;}
  // 눌린 핀을 맨 위로
  items.sort(function(a,b){return (a.id===tappedId?-1:0)-(b.id===tappedId?-1:0);});
  var rows=items.map(function(f){
    var col=(typeof _facTypeColor==='function')?_facTypeColor(f.type):'#3182f6';
    var cg=(typeof _facCurGrade==='function')?_facCurGrade(f):null;
    var warn=(typeof _facWarn==='function')&&_facWarn(f);
    var sub=f.type.split(' ').slice(1).join(' ')||f.type;
    return '<div onclick="_pickFacOverlap('+f.id+')" style="display:flex;align-items:center;gap:9px;padding:9px 4px;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;">'
      +'<span style="width:28px;height:28px;border-radius:50%;background:'+col+'30;border:1.5px solid '+col+';display:inline-flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">'+_esc(f.type.split(' ')[0]||'📍')+'</span>'
      +'<span style="flex:1;min-width:0;">'
        +'<span style="display:block;font-size:12.5px;font-weight:700;color:#dceaf6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(f.name||'')+(cg?' <span style="color:'+_gColor(cg.g)+';font-size:10.5px;font-weight:900;">'+_esc(cg.g)+'</span>':'')+(warn?' <span style="color:#ff5a45;font-size:10px;">⚠️경고</span>':'')+'</span>'
        +'<span style="display:block;font-size:9.5px;color:#5d86a3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(sub)+'</span>'
      +'</span>'
      +'<span style="flex-shrink:0;color:#3182f6;font-size:16px;">›</span>'
    +'</div>';
  }).join('');
  var ov=document.createElement('div');ov.id='facOverlapSheet';
  // 하단바(z20) 위로 — '내 주변 시설물' 시트와 동일 규격
  ov.style.cssText='position:absolute;bottom:0;left:0;right:0;z-index:30;background:#1c1c1e;border:1px solid rgba(255,255,255,.2);border-radius:16px 16px 0 0;box-shadow:0 -4px 20px rgba(0,0,0,.7);max-height:56vh;display:flex;flex-direction:column;padding-bottom:calc(8px + env(safe-area-inset-bottom));';
  ov.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 13px 7px;flex-shrink:0;">'
    +'<span style="font-size:12px;font-weight:800;color:#a5abb3;">📍 같은 자리 시설 <span style="font-size:9px;color:#565f6b;font-weight:600;">'+items.length+'개 겹침 · 눌러서 선택</span></span>'
    +'<button onclick="_closeFacOverlapSheet()" style="background:none;border:none;color:rgba(255,255,255,.45);font-size:18px;cursor:pointer;padding:0 2px;line-height:1;">×</button></div>'
    +'<div style="overflow-y:auto;padding:0 13px 10px;">'+rows+'</div>';
  var host=document.querySelector('#v-inspect-map .mapwrap')||document.getElementById('v-inspect-map');
  (host||document.body).appendChild(ov);
}
const DC={lat:38.1328,lng:128.4107};
// HTML/attribute escaping for user-generated content
function _esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function _escq(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/\r/g,'').replace(/\n/g,'\\n');}
function _haversine(lat1,lng1,lat2,lng2){
  var R=6371000,r=Math.PI/180;
  var dL=(lat2-lat1)*r,dG=(lng2-lng1)*r;
  var a=Math.sin(dL/2)*Math.sin(dL/2)+Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dG/2)*Math.sin(dG/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
var _cachedRescueSigns=null,_cachedFullSigns=null;
function _invalidateSignCache(){
  _cachedRescueSigns=null;_cachedFullSigns=null;
  // Clear facility overlay pool so it rebuilds with fresh data on next render
  _rFacPool.forEach(entry=>{try{entry.ov.setMap(null);}catch(e){}});
  _rFacPool.clear();
}
function _nearestSign(lat,lng){
  if(!_cachedRescueSigns){
    var _m=DB.g('catFacMeta')||{};
    _cachedRescueSigns=(DB.g('facilities')||(typeof _facBootCache==='function'&&_facBootCache())||[]).filter(function(f){
      return f.lat&&f.lng&&f.type&&(_m[f.type]||{}).rescue;
    });
  }
  var best=null,bestD=Infinity;
  _cachedRescueSigns.forEach(function(f){var d=_haversine(lat,lng,f.lat,f.lng);if(d<bestD){bestD=d;best=f;}});
  if(!best||bestD>3000)return null;
  var _bnm=String(best.name||'');
  var label=best.type.includes('다목적위치표지판')
    ?(_bnm.match(/\d[\d\-]*\d|\d/)||[_bnm.slice(0,6)])[0]
    :_bnm;
  var dist=bestD<1000?Math.round(bestD)+'m':((bestD/1000).toFixed(1)+'km');
  return label+' 인근 '+dist;
}
// 지도의 '활성 지점'(십자선·좌표읽기·현위치 착지점)을 하단 탭바에 가려지지 않은
// '보이는 영역의 중앙'으로 맞추기 위한 세로 오프셋(px). 지도는 화면 전체를 채우는데
// 불투명 하단바(.bnav)가 아래를 덮으므로, div 정중앙은 시각적 중앙보다 그만큼 아래에 있음.
// → 오프셋 = 보이는 바(하단바) 높이의 절반. CSS 변수(--map-voff)로 십자선도 함께 위로 올림.
function _mapVOff(){
  try{
    const bn=document.getElementById('bnav');
    const h=(bn&&getComputedStyle(bn).display!=='none')?bn.offsetHeight:0;
    return h>0?Math.round(h/2):0;
  }catch(e){return 0;}
}
function _applyMapVOff(){
  const off=_mapVOff();
  try{document.documentElement.style.setProperty('--map-voff',off+'px');}catch(e){}
  // 주의: window._mapVOff 같은 이름으로 저장하면 전역 함수 _mapVOff 를 숫자로 덮어써서
  // 이후 _mapVOff() 호출이 TypeError → 좌표읽기 정지·내위치 먹통. 별도 이름 사용.
  window._mapVOffPx=off;
  return off;
}
// ── 설악산 국립공원 경계 오버레이 (park-boundary.json 1회 로드 후 여러 지도에 재사용) ──
var _parkBoundary=null,_parkPendingMaps=[];
function _paintPark(map,d){
  if(!map||map._parkDrawn||typeof kakao==='undefined')return;
  map._parkDrawn=true;
  map._parkLines=[]; // 진단 토글용 참조 보관
  (d.rings||[]).forEach(function(ring){
    var path=ring.map(function(p){return new kakao.maps.LatLng(p[1],p[0]);});
    map._parkLines.push(new kakao.maps.Polyline({path:path,strokeWeight:3.5,strokeColor:'#ffffff',strokeOpacity:.4,strokeStyle:'solid',map:map,zIndex:1}));
    map._parkLines.push(new kakao.maps.Polyline({path:path,strokeWeight:2,strokeColor:d.color||'#ff3b30',strokeOpacity:.9,strokeStyle:'solid',map:map,zIndex:1}));
  });
}
// ── 🔧 상황판 세로선 진단 — 레이어를 하나씩 꺼서 원인 특정 (사용자 A/B 테스트용) ──
// ── 🌿 용도지구 오버레이 — 공단 공식 SHP(용도지구_변경) 그대로(EPSG:5174→WGS84, 0.5m 이내 단순화) ──
let _useZoneLayer=null,_useZoneData=null;
// 링 넓이(신발끈 공식, 상대비교용) — 작은 지구를 위에 올려 클릭이 가려지지 않게
function _ringArea(r){let a=0;for(let i=0,j=r.length-1;i<r.length;j=i++){a+=(r[j][0]-r[i][0])*(r[j][1]+r[i][1]);}return Math.abs(a/2);}
// 용도지구 폴리곤 생성 — 넓은 지구부터 그리고(낮은 zIndex), 작은 지구는 위에(높은 zIndex) → 겹친 곳에서 작은 지구가 눌림
function _drawUseZonePolys(map,onClick){
  const items=[];
  (_useZoneData.zones||[]).forEach(z=>{(z.rings||[]).forEach(r=>{if(r.length>=3)items.push({z,r,a:_ringArea(r)});});});
  items.sort((p,q)=>q.a-p.a); // 넓은 것 먼저
  const out=[];
  items.forEach((it,i)=>{
    const pg=new kakao.maps.Polygon({path:it.r.map(p=>new kakao.maps.LatLng(p[1],p[0])),
      strokeWeight:2,strokeColor:it.z.color,strokeOpacity:.95,fillColor:it.z.color,fillOpacity:.34,zIndex:i+1,map:map});
    pg._uz=it.z;pg._uzBaseZ=i+1;
    kakao.maps.event.addListener(pg,'click',function(){onClick(pg);});
    out.push(pg);
  });
  return out;
}
function _toggleUseZones(){
  if(_useZoneLayer){
    _useZoneLayer.forEach(o=>{try{o.setMap(null);}catch(e){}});_useZoneLayer=null;
    const lg=document.getElementById('useZoneLegend');if(lg)lg.remove();
    try{_useZoneUnsel();}catch(e){}
    _mapCtrlOn('useZoneBtn',false);
    toast('🌿 용도지구 표시 끔');return;
  }
  const go=()=>{
    const _zm=(typeof mapI!=='undefined'&&mapI)?mapI:null;if(!_zm)return;
    _mapCtrlOn('useZoneBtn',true);
    _useZoneLayer=_drawUseZonePolys(_zm,_useZoneSelect);
    // 범례
    let lg=document.getElementById('useZoneLegend');if(lg)lg.remove();
    lg=document.createElement('div');lg.id='useZoneLegend';
    lg.style.cssText='position:fixed;left:12px;bottom:calc(74px + env(safe-area-inset-bottom));z-index:9400;background:rgba(15,15,17,.92);border:1px solid rgba(255,255,255,.2);border-radius:11px;padding:8px 11px;display:flex;flex-direction:column;gap:3px;';
    const seen={};
    (_useZoneData.zones||[]).forEach(z=>{if(seen[z.grade])return;seen[z.grade]=1;
      lg.insertAdjacentHTML('beforeend',`<div style="display:flex;align-items:center;gap:6px;font-size:10px;color:#d5d8dc;"><span style="width:10px;height:10px;border-radius:3px;background:${z.color};display:inline-block;"></span>${_esc(z.grade)}</div>`);});
    document.body.appendChild(lg);
    toast('🌿 용도지구 표시 — 공단 공식 데이터(변경 최신)');
  };
  if(_useZoneData){go();return;}
  fetch('park-usezones.json').then(r=>r.json()).then(d=>{_useZoneData=d;go();})
    .catch(()=>toast('⚠️ 용도지구 데이터를 불러오지 못했습니다'));
}
// 용도지구 선택 — 누른 지구의 외곽선을 흰색 강조 + 무슨 지구인지 카드 표시
let _uzSel=null;
function _useZoneSelect(pg){
  if(_uzSel){try{_uzSel.setOptions({strokeWeight:2,strokeColor:_uzSel._uz.color,strokeOpacity:.95,fillOpacity:.34,zIndex:_uzSel._uzBaseZ||1});}catch(e){}}
  _uzSel=pg;
  try{pg.setOptions({strokeWeight:4,strokeColor:'#ffffff',strokeOpacity:1,fillOpacity:.48,zIndex:9999});}catch(e){}
  const z=pg._uz||{};
  let c=document.getElementById('useZoneCard');if(c)c.remove();
  c=document.createElement('div');c.id='useZoneCard';
  const _onBoard=(()=>{try{return document.getElementById('v-board').classList.contains('on');}catch(e){return false;}})();
  c.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:calc(74px + env(safe-area-inset-bottom));z-index:'+(_onBoard?'99600':'9500')+';width:calc(100% - 24px);max-width:440px;box-sizing:border-box;background:#16161a;border:1px solid rgba(255,255,255,.25);border-radius:13px;padding:11px 14px;box-shadow:0 6px 20px rgba(0,0,0,.6);display:flex;align-items:center;gap:9px;';
  c.innerHTML=`<span style="width:14px;height:14px;border-radius:4px;background:${z.color||'#888'};flex-shrink:0;box-shadow:0 0 8px ${z.color||'#888'}88;"></span>
    <span style="flex:1;min-width:0;">
      <span style="display:block;font-size:13.5px;font-weight:800;color:#eaecef;">${_esc(z.grade||'용도지구')}</span>
      ${z.name?`<span style="display:block;font-size:11px;color:#8fb8ad;margin-top:2px;">${_esc(z.name)}</span>`:''}
    </span>
    <button onclick="_useZoneUnsel()" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:19px;cursor:pointer;line-height:1;flex-shrink:0;">×</button>`;
  document.body.appendChild(c);
}
function _useZoneUnsel(){
  const c=document.getElementById('useZoneCard');if(c)c.remove();
  if(_uzSel){try{_uzSel.setOptions({strokeWeight:2,strokeColor:_uzSel._uz.color,strokeOpacity:.95,fillOpacity:.34,zIndex:_uzSel._uzBaseZ||1});}catch(e){}}
  _uzSel=null;
}
// 구역·용도 오버레이 화면요소 정리 — 화면 전환·홈 이동 시 범례·카드가 남지 않도록
function _zoneOverlayCleanup(){
  try{_zoneAuditClose();}catch(e){} // 검사 하이라이트·유령·패널도 함께 정리
  const _ab=document.getElementById('zoneAuditBtn');if(_ab)_ab.style.display='none';
  ['useZoneLegend','useZoneLegendB','useZoneCard','zoneInfoCard','zoneFacOv','zoneAuditPanel','zoneAdminPanel'].forEach(id=>{const e=document.getElementById(id);if(e)e.remove();});
}
// ── 🗺 순찰 구역 오버레이(폴리곤) — 직무현황 PDF의 구역을 벡터화·좌표 변환한 49개 면 ──
// park-zones.json v2: zones[{n,color,rings}] + labels[{n,lat,lng}] + info{n:{r,m}} — 공원경계 정합(오차 ~30m)
// 27|31·28|31·29|32 경계는 실제 도로선 기준. 구역 탭=노란 강조+범위·담당 카드, 시설물 깜빡이 보기
let _zoneLayer=null,_zoneData=null,_zonePolys=null,_zoneSel=null,_zoneFacBlink=null;
// 지도 상단 토글 버튼 켬/끔 표시 — 눌려 있는지 한눈에
function _mapCtrlOn(id,on){
  const b=document.getElementById(id);if(!b)return;
  if(on){b.style.background='rgba(49,130,246,.88)';b.style.color='#fff';b.style.borderColor='#7db4ff';b.style.boxShadow='0 0 8px rgba(49,130,246,.55)';}
  else{b.style.background='';b.style.color='';b.style.borderColor='';b.style.boxShadow='';}
}
function _toggleZones(){
  const _ab=document.getElementById('zoneAuditBtn');
  if(_zoneLayer){_zoneClear();_mapCtrlOn('zoneBtn',false);if(_ab)_ab.style.display='none';toast('🗺 구역 표시 끔');return;}
  const go=()=>{_zoneDraw();_mapCtrlOn('zoneBtn',true);
    if(_ab)_ab.style.display=(typeof isAdminUser==='function'&&isAdminUser())?'':'none'; // 검사 버튼은 관리자에게만
    toast('🗺 순찰 구역 표시 — 구역을 누르면 범위·담당이 나옵니다',4000);};
  if(_zoneData){go();return;}
  fetch('park-zones.json').then(r=>r.json()).then(zd=>{_zoneData=zd;go();})
    .catch(()=>toast('⚠️ 구역 데이터를 불러오지 못했습니다'));
}
function _zoneClear(){
  try{_zoneAuditClose();}catch(e){} // 검사 하이라이트·유령·패널 정리
  {const _q=document.getElementById('zoneAdminPanel');if(_q)_q.remove();} // 구역관리 패널도 함께 정리(레이어 끔 시 잔류 방지)
  if(_zoneLayer)_zoneLayer.forEach(o=>{try{o.setMap(null);}catch(e){}});
  _zoneLayer=null;_zonePolys=null;_zoneSel=null;
  _zoneBlinkStop();_zoneSelBlinkStop();
  const c=document.getElementById('zoneInfoCard');if(c)c.remove();
  const fo=document.getElementById('zoneFacOv');if(fo)fo.remove();
}
// 구역 폴리곤 기본 스타일(내 구역=초록 테두리·진한 채움)로 복원
function _zoneStyleReset(pg){
  try{pg.setOptions({strokeWeight:pg._zmine?2.5:1.5,strokeColor:pg._zmine?'#3ddc84':'#ffffff',
    strokeOpacity:pg._zmine?.95:.7,fillColor:pg._zc,fillOpacity:pg._zmine?.24:.12,zIndex:pg._zmine?2:1});}catch(e){}
}
// 선택 구역 깜빡임 — 시설물 깜빡이처럼 구역 면을 노랗게 맥동(폴리곤은 CSS 불가 → setOptions 토글)
let _zoneSelBlinkTm=null;
function _zoneSelBlinkStop(){if(_zoneSelBlinkTm){clearInterval(_zoneSelBlinkTm);_zoneSelBlinkTm=null;}}
function _zoneSelBlinkStart(n,polys){
  _zoneSelBlinkStop();
  const map=polys||_zonePolys;
  let on=true;
  const pulse=()=>{const pgs=(map&&map[n])||[];pgs.forEach(pg=>{try{pg.setOptions({strokeColor:'#ffd76a',strokeWeight:on?4.5:2.5,strokeOpacity:1,fillColor:pg._zc,fillOpacity:on?.5:.18,zIndex:5});}catch(e){}});on=!on;};
  pulse();
  _zoneSelBlinkTm=setInterval(pulse,520);
}
function _zoneDraw(){
  const _zm=(typeof mapI!=='undefined'&&mapI)?mapI:null; // 시설물 지도에 표시
  if(!_zm||!_zoneData||!window.kakao)return;
  _zoneClear();_zoneLayer=[];_zonePolys={};
  const zd=_zoneData;
  // 내 담당 구역 — 로그인한 이름이 담당자에 포함된 구역은 초록으로 강조
  const _me=DB.g('currentUser')||{};
  const _myName=String(_me.realName||_me.name||'').trim();
  const _isMine=n=>{const inf=zd.info&&zd.info[n];return !!(_myName&&inf&&inf.m&&inf.m.indexOf(_myName)>=0);};
  const _myLbs=[];
  const _rc={}; // 구역별 링 일련번호 — 꼭짓점 보정 키("링번호,점번호")의 기준(그리기·판정·원격갱신 동일 규칙)
  (zd.zones||[]).forEach(z=>{
    const mine=_isMine(z.n);
    const off=_zoneOff(z.n); // 앱 내 경계 조정(zoneEdits) 보정 반영
    _effRings(z).forEach(ring=>{
      const ri=_rc[z.n]=(_rc[z.n]===undefined?0:_rc[z.n]+1); // 짧아서 스킵되는 링도 번호는 소비 — _zonePip과 번호 일치
      if(ring.length<3)return;
      const pg=new kakao.maps.Polygon({path:_zeRingPath(ring,ri,off),
        strokeWeight:mine?2.5:1.5,strokeColor:mine?'#3ddc84':'#ffffff',strokeOpacity:mine?.95:.7,
        fillColor:z.color,fillOpacity:mine?.24:.12,zIndex:mine?2:1,map:_zm});
      pg._zn=z.n;pg._zc=z.color;pg._zmine=mine;pg._ring=ring;pg._ri=ri; // 원본 링·번호 보관 — 조정 시 재계산용
      kakao.maps.event.addListener(pg,'click',function(){_zoneSelect(z.n);});
      _zoneLayer.push(pg);(_zonePolys[z.n]=_zonePolys[z.n]||[]).push(pg);
    });
  });
  (zd.labels||[]).forEach(lb=>{
    const mine=_isMine(lb.n);
    const off=_zoneOff(lb.n)||{dlat:0,dlng:0};
    const el=document.createElement('div');
    el.style.cssText=mine
      ?'background:rgba(15,54,32,.92);color:#7dffb0;font-size:12px;font-weight:900;padding:3px 9px;border-radius:10px;border:1.5px solid #3ddc84;cursor:pointer;line-height:1.4;box-shadow:0 0 8px rgba(61,220,132,.5);'
      :'background:rgba(18,22,30,.85);color:#ffd76a;font-size:11px;font-weight:800;padding:2px 7px;border-radius:9px;border:1px solid rgba(255,215,106,.55);cursor:pointer;line-height:1.4;';
    el.textContent=mine?('★'+lb.n):lb.n;
    el.onclick=function(ev){try{ev.stopPropagation();}catch(e){}_zoneSelect(lb.n);};
    const ov=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(lb.lat+off.dlat,lb.lng+off.dlng),content:el,yAnchor:.5,zIndex:6,clickable:true});
    ov._lbN=lb.n;ov._lbLat=lb.lat;ov._lbLng=lb.lng; // 위치 조정 시 라벨도 함께 이동
    ov.setMap(_zm);_zoneLayer.push(ov);
    if(mine)_myLbs.push(lb);
  });
  // 내 구역이 있으면 지도 이동 + 안내
  if(_myLbs.length){
    try{_zm.setCenter(new kakao.maps.LatLng(_myLbs[0].lat,_myLbs[0].lng));if(_zm.getLevel()>7)_zm.setLevel(7);}catch(e){}
    toast('⭐ 내 담당 구역: '+_myLbs.map(l=>l.n).join('·')+'구역 — 초록 표시');
  }
}
// 구역 선택 — 해당 면을 노랗게 깜빡이며 강조하고 정보 카드 표시
function _zoneSelect(n){
  if(_zoneSel&&_zonePolys&&_zonePolys[_zoneSel]){_zoneSelBlinkStop();_zonePolys[_zoneSel].forEach(_zoneStyleReset);}
  _zoneSel=n;
  if(_zonePolys&&_zonePolys[n])_zoneSelBlinkStart(n);
  _zoneInfo(n);
}
function _zoneUnsel(){
  const c=document.getElementById('zoneInfoCard');if(c)c.remove();
  _zoneSelBlinkStop();
  if(_zoneSel&&_zonePolys&&_zonePolys[_zoneSel])_zonePolys[_zoneSel].forEach(_zoneStyleReset);
  _zoneSel=null;
  // 상황판 지도 선택도 함께 해제
  if(_zoneSelB&&_zonePolysB&&_zonePolysB[_zoneSelB])_zonePolysB[_zoneSelB].forEach(pg=>{try{pg.setOptions({strokeWeight:1.5,strokeColor:'#ffffff',strokeOpacity:.7,fillColor:pg._zc,fillOpacity:.12,zIndex:1});}catch(e){}});
  _zoneSelB=null;
}
// 떠 있는 하단 카드 공통: X버튼 대신 손잡이를 아래로 내려서 닫기(다른 목록 바텀시트와 동일 감각).
// 카드가 translateX(-50%)로 가운데 정렬돼 있으므로 기준 transform(_baseTf)을 보존한 채 Y만 끌어내린다.
function _bindDragClose(p,closeFn){
  if(!p||p._dragC)return;p._dragC=true;
  const base=p._baseTf||'';
  const h=p.querySelector('.sheetGrab')||p;
  let y0=null,t0=0;
  const start=y=>{y0=y;t0=Date.now();p.style.transition='none';};
  const move=y=>{if(y0==null)return;p.style.transform=(base+' translateY('+Math.max(0,y-y0)+'px)').trim();};
  const end=y=>{
    if(y0==null)return;
    const dy=y-y0,dt=Date.now()-t0,vel=dt>0?dy/dt:0;y0=null;
    if(dy>40||(dy>12&&vel>0.4)){
      p.style.transition='transform .18s ease-in';
      p.style.transform=(base+' translateY(130%)').trim();
      setTimeout(()=>{try{closeFn();}catch(e){}},170);
    }else{
      p.style.transition='transform .2s cubic-bezier(.4,0,.2,1)';
      p.style.transform=base;
      setTimeout(()=>{p.style.transition='';},210);
    }
  };
  h.addEventListener('touchstart',e=>{start(e.touches[0].clientY);},{passive:true});
  h.addEventListener('touchmove',e=>{move(e.touches[0].clientY);},{passive:true});
  h.addEventListener('touchend',e=>{end(e.changedTouches[0].clientY);});
  h.addEventListener('mousedown',e=>{start(e.clientY);const mv=ev=>move(ev.clientY);const up=ev=>{end(ev.clientY);document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);};document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);e.preventDefault();});
}
function _zoneInfo(n){
  const inf=(_zoneData&&_zoneData.info&&_zoneData.info[n])||null;
  let c=document.getElementById('zoneInfoCard');if(c)c.remove();
  c=document.createElement('div');c.id='zoneInfoCard';
  c.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:calc(74px + env(safe-area-inset-bottom));z-index:9500;width:calc(100% - 24px);max-width:440px;box-sizing:border-box;background:#16161a;border:1px solid rgba(255,215,106,.4);border-radius:13px;padding:2px 14px 12px;box-shadow:0 6px 20px rgba(0,0,0,.6);';
  c._baseTf='translateX(-50%)';
  const _onBoard=(()=>{try{return document.getElementById('v-board').classList.contains('on');}catch(e){return false;}})();
  const _me=DB.g('currentUser')||{};const _myName=String(_me.realName||_me.name||'').trim();
  const _mine=!!(inf&&inf.m&&_myName&&inf.m.indexOf(_myName)>=0);
  c.innerHTML=`<div class="sheetGrab" style="padding:8px 0 8px;margin:0 -14px;cursor:grab;touch-action:none;"><div class="dbhandle"></div></div>
    <div style="display:flex;align-items:flex-start;gap:8px;">
      <span style="font-size:14px;font-weight:800;color:#ffd76a;flex-shrink:0;">${_esc(n)}구역${_mine?' <span style="font-size:10px;color:#7dffb0;">★내 담당</span>':''}</span>
      <span style="flex:1;font-size:12px;color:#d5d8dc;line-height:1.5;word-break:keep-all;">${inf?_esc(inf.r||''):'범위 정보 없음'}</span></div>
    <div style="display:flex;align-items:center;gap:6px;margin-top:7px;background:${_mine?'rgba(61,220,132,.12)':'rgba(94,207,143,.08)'};border:1px solid ${_mine?'rgba(61,220,132,.4)':'rgba(94,207,143,.25)'};border-radius:8px;padding:6px 9px;">
      <span style="font-size:11px;">👤</span>
      <span style="font-size:11px;color:#8fb8ad;font-weight:700;flex-shrink:0;">지역담당</span>
      <span style="flex:1;font-size:12.5px;font-weight:800;color:${_mine?'#7dffb0':'#a7e3c4'};">${inf&&inf.m?_esc(inf.m):'미지정'}</span></div>
    ${_onBoard?'':`<div style="display:flex;gap:6px;margin-top:8px;">
      <button onclick="_zoneShowFacs('${_escq(n)}')" style="padding:7px 11px;border-radius:8px;border:1px solid rgba(255,215,106,.45);background:rgba(255,215,106,.1);color:#ffd76a;font-size:11px;font-weight:700;cursor:pointer;">🏗 이 구역 시설물 보기</button>
    </div>`}`;
  if(_onBoard)c.style.zIndex='99600'; // 상황판(전체화면) 위로
  document.body.appendChild(c);
  _bindDragClose(c,_zoneUnsel);
}
// ── 상황판 지도용 구역·용도 레이어 — 같은 데이터를 큰 지도에서 그대로 (표시 전용, 탭=범위·담당 카드) ──
let _zoneLayerB=null,_useZoneLayerB=null;
function _bdBtnOn(id,on){
  const b=document.getElementById(id);if(!b)return;
  b.style.background=on?'rgba(49,130,246,.85)':'rgba(255,255,255,.1)';
  b.style.color=on?'#fff':'#a5abb3';
  b.style.borderColor=on?'#7db4ff':'rgba(255,255,255,.3)';
}
function _toggleZonesBoard(){
  if(_zoneLayerB){_zoneLayerB.forEach(o=>{try{o.setMap(null);}catch(e){}});_zoneLayerB=null;_zonePolysB=null;_zoneSelB=null;_zoneSelBlinkStop();_bdBtnOn('boardZoneBtn',false);
    const c=document.getElementById('zoneInfoCard');if(c)c.remove();return;}
  const go=()=>{_zoneDrawBoard();_bdBtnOn('boardZoneBtn',true);};
  if(_zoneData){go();return;}
  fetch('park-zones.json').then(r=>r.json()).then(zd=>{_zoneData=zd;go();})
    .catch(()=>toast('⚠️ 구역 데이터를 불러오지 못했습니다'));
}
let _zonePolysB=null,_zoneSelB=null;
function _zoneDrawBoard(){
  if(!_boardMap||!_zoneData||!window.kakao)return;
  if(_zoneLayerB)_zoneLayerB.forEach(o=>{try{o.setMap(null);}catch(e){}});
  _zoneLayerB=[];_zonePolysB={};_zoneSelB=null;_zoneSelBlinkStop();
  const _rcB={}; // 링 번호 규칙은 _zoneDraw와 동일해야 꼭짓점 보정이 같은 자리에 적용됨
  (_zoneData.zones||[]).forEach(z=>{
    const off=_zoneOff(z.n); // 경계 조정 보정 반영(상황판도 동일)
    _effRings(z).forEach(ring=>{
      const ri=_rcB[z.n]=(_rcB[z.n]===undefined?0:_rcB[z.n]+1);
      if(ring.length<3)return;
      const pg=new kakao.maps.Polygon({path:_zeRingPath(ring,ri,off),
        strokeWeight:1.5,strokeColor:'#ffffff',strokeOpacity:.7,fillColor:z.color,fillOpacity:.12,zIndex:1,map:_boardMap});
      pg._zc=z.color;pg._zn=z.n;pg._ring=ring;pg._ri=ri; // 원본 링·번호 보관 — 원격 보정 수신 시 제자리 갱신용
      kakao.maps.event.addListener(pg,'click',function(){_zoneSelectB(z.n);});
      _zoneLayerB.push(pg);(_zonePolysB[z.n]=_zonePolysB[z.n]||[]).push(pg);
    });
  });
  (_zoneData.labels||[]).forEach(lb=>{
    const off=_zoneOff(lb.n)||{dlat:0,dlng:0};
    const el=document.createElement('div');
    el.style.cssText='background:rgba(18,22,30,.85);color:#ffd76a;font-size:12px;font-weight:800;padding:2px 8px;border-radius:9px;border:1px solid rgba(255,215,106,.55);cursor:pointer;line-height:1.4;';
    el.textContent=lb.n;
    el.onclick=function(ev){try{ev.stopPropagation();}catch(e){}_zoneSelectB(lb.n);};
    const ov=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(lb.lat+off.dlat,lb.lng+off.dlng),content:el,yAnchor:.5,zIndex:6,clickable:true});
    ov._lbN=lb.n;ov._lbLat=lb.lat;ov._lbLng=lb.lng; // 원격 보정 수신 시 라벨 제자리 갱신용
    ov.setMap(_boardMap);_zoneLayerB.push(ov);
  });
}
// 상황판 구역 선택 — 시설물 점검 지도와 동일하게 깜빡이며 강조 + 담당 카드
function _zoneSelectB(n){
  if(_zoneSelB&&_zonePolysB&&_zonePolysB[_zoneSelB]){_zoneSelBlinkStop();_zonePolysB[_zoneSelB].forEach(pg=>{try{pg.setOptions({strokeWeight:1.5,strokeColor:'#ffffff',strokeOpacity:.7,fillColor:pg._zc,fillOpacity:.12,zIndex:1});}catch(e){}});}
  _zoneSelB=n;
  if(_zonePolysB&&_zonePolysB[n])_zoneSelBlinkStart(n,_zonePolysB);
  _zoneInfo(n);
}
function _toggleUseZonesBoard(){
  if(_useZoneLayerB){_useZoneLayerB.forEach(o=>{try{o.setMap(null);}catch(e){}});_useZoneLayerB=null;_bdBtnOn('boardUseZoneBtn',false);
    const lg=document.getElementById('useZoneLegendB');if(lg)lg.remove();try{_useZoneUnsel();}catch(e){}return;}
  const go=()=>{
    if(!_boardMap)return;
    _bdBtnOn('boardUseZoneBtn',true);
    _useZoneLayerB=_drawUseZonePolys(_boardMap,_useZoneSelect);
    let lg=document.getElementById('useZoneLegendB');if(lg)lg.remove();
    lg=document.createElement('div');lg.id='useZoneLegendB';
    lg.style.cssText='position:fixed;left:12px;bottom:12px;z-index:99500;background:rgba(15,15,17,.92);border:1px solid rgba(255,255,255,.2);border-radius:11px;padding:8px 11px;display:flex;flex-direction:column;gap:3px;';
    const seen={};
    (_useZoneData.zones||[]).forEach(z=>{if(seen[z.grade])return;seen[z.grade]=1;
      lg.insertAdjacentHTML('beforeend',`<div style="display:flex;align-items:center;gap:6px;font-size:10px;color:#d5d8dc;"><span style="width:10px;height:10px;border-radius:3px;background:${z.color};display:inline-block;"></span>${_esc(z.grade)}</div>`);});
    document.body.appendChild(lg);
  };
  if(_useZoneData){go();return;}
  fetch('park-usezones.json').then(r=>r.json()).then(d=>{_useZoneData=d;go();})
    .catch(()=>toast('⚠️ 용도지구 데이터를 불러오지 못했습니다'));
}
// 구역 폴리곤 내부 판정(레이캐스팅) — rings는 [lat,lng] 순서
function _zonePip(n,la,ln){
  // 경계 조정 보정(전체 이동+꼭짓점별 부분 수정)을 링에 적용한 '실제 표시 경계' 기준으로 판정
  const adj=_zoneOff(n)||{};const dla=adj.dlat||0,dln=adj.dlng||0,vs=adj.verts||null;
  const zs=((_zoneData&&_zoneData.zones)||[]).filter(z=>z.n===n);
  let ri=-1;
  for(const z of zs)for(const ring of _effRings(z)){
    ri++; // 링 번호 소비 규칙이 _zoneDraw와 동일해야 verts 키가 같은 링에 적용됨
    let ins=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const vi=vs&&vs[ri+','+i],vj=vs&&vs[ri+','+j];
      const yi=ring[i][0]+dla+(vi?vi[0]:0),xi=ring[i][1]+dln+(vi?vi[1]:0);
      const yj=ring[j][0]+dla+(vj?vj[0]:0),xj=ring[j][1]+dln+(vj?vj[1]:0);
      if(((yi>la)!==(yj>la))&&(ln<(xj-xi)*(la-yi)/(yj-yi)+xi))ins=!ins;
    }
    if(ins)return true;
  }
  return false;
}
// 이 구역 시설물 보기 — 은은한 깜빡이 점 + 하단 목록 시트(이름은 지도에 안 씀)
function _zoneShowFacs(n){
  const _zm=(typeof mapI!=='undefined'&&mapI)?mapI:null;if(!_zm||!window.kakao)return;
  _zoneBlinkStop();
  const _meta=DB.g('catFacMeta')||{};const admin=(typeof isAdminUser==='function')&&isAdminUser();
  const facs=(DB.g('facilities')||[]).filter(f=>f.lat&&f.lng&&_facVisibleTo(f)
    &&(admin||!(_meta[f.type]||{}).adminOnly)&&_zonePip(n,+f.lat,+f.lng));
  if(!facs.length){toast(n+'구역 안에 등록된 시설물이 없습니다');return;}
  facs.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'ko',{numeric:true}));
  _zoneFacBlink=[];
  facs.forEach(f=>{
    const col=(typeof _facTypeColor==='function'?_facTypeColor(f.type):'#ffd76a');
    // 일반 시설물 점검지도에서 시설물 눌렀을 때와 '완전히 동일'하게 —
    // 실제 핀(.mpin p-fac: 아이콘+종류색 테두리·바탕)에 선택 강조(.mpin-sel: 청록 물결)만 얹는다.
    const el=document.createElement('div');
    el.className='mpin p-fac mpin-sel';
    el.innerHTML=String(f.type||'').split(' ')[0];
    el.style.borderColor=col;
    el.style.background=`linear-gradient(0deg,${col}44,${col}44),#1c1c1e`;
    el.style.cursor='pointer';
    el.style.transition='transform .18s ease,opacity .18s ease';
    el.onclick=function(ev){try{ev.stopPropagation();}catch(e){}_zoneFacFocus(f.id);};
    const pos=new kakao.maps.LatLng(+f.lat,+f.lng);
    const ov=new kakao.maps.CustomOverlay({position:pos,content:el,zIndex:9,clickable:true});
    ov.setMap(_zm);_zoneFacBlink.push({ov,el,id:f.id});
  });
  // 지도는 움직이지 않음 — 선택한 구역이 계속 보이도록 유지
  const c=document.getElementById('zoneInfoCard');if(c)c.remove();
  // 하단 목록 시트: 탭=강조 깜빡, [이동]=지도 이동+상세, [점검]=점검 등록
  const old=document.getElementById('zoneFacOv');if(old)old.remove();
  const ov=document.createElement('div');ov.id='zoneFacOv';
  // 구역 정보 카드와 동일한 떠 있는 하단바 스타일(가운데 정렬·라운드·최대폭 제한)
  ov.style.cssText='position:absolute;bottom:calc(74px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:calc(100% - 24px);max-width:440px;box-sizing:border-box;z-index:30;background:#16161a;border:1px solid rgba(255,215,106,.4);border-radius:13px;box-shadow:0 6px 20px rgba(0,0,0,.6);max-height:46vh;display:flex;flex-direction:column;padding-bottom:6px;';
  ov._baseTf='translateX(-50%)';
  const rows=facs.map(f=>{
    const col=_facTypeColor(f.type);
    const ty=String(f.type||'');
    return `<div id="zfRow${f.id}" onclick="_zoneFacFocus(${f.id})" style="display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;border-radius:8px;">
      <span style="width:26px;height:26px;border-radius:50%;background:${col}30;border:1.5px solid ${col};display:inline-flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">${_esc(ty.split(' ')[0])}</span>
      <span style="flex:1;min-width:0;">
        <span style="display:block;font-size:12px;font-weight:700;color:#dceaf6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_esc(f.name||'')}</span>
        <span style="display:block;font-size:9.5px;color:#5d86a3;">${_esc(ty.split(' ').slice(1).join(' ')||'')}</span>
      </span>
      <button onclick="event.stopPropagation();_zoneFacGo(${f.id})" style="flex-shrink:0;padding:6px 10px;border-radius:8px;border:1px solid rgba(49,130,246,.5);background:rgba(49,130,246,.14);color:#4d9bf5;font-size:11px;font-weight:800;cursor:pointer;">📍 이동</button>
      <button onclick="event.stopPropagation();_zoneFacListClose();openFacIssueReport(${f.id})" style="flex-shrink:0;padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#e8ecf1;font-size:11px;font-weight:800;cursor:pointer;">🔧 점검</button>
    </div>`;
  }).join('');
  ov.innerHTML=`
    <div class="sheetGrab" style="padding:7px 0 2px;cursor:grab;touch-action:none;flex-shrink:0;"><div class="dbhandle"></div></div>
    <div style="display:flex;align-items:center;padding:4px 13px 7px;flex-shrink:0;">
      <span style="font-size:12px;font-weight:800;color:#ffd76a;">🏗 ${_esc(n)}구역 시설물 <span style="font-size:9px;color:#8b9099;font-weight:600;">${facs.length}개 · 탭=지도 강조, 📍이동=상세</span></span>
    </div>
    <div id="zoneFacRows" style="overflow-y:auto;padding:0 13px 10px;">${rows}</div>`;
  const host=document.querySelector('#v-inspect-map .mapwrap')||document.getElementById('v-inspect-map');
  (host||document.body).appendChild(ov);
  _bindDragClose(ov,_zoneFacListClose);
}
// 목록 탭 — 지도는 그대로 두고 해당 시설물만 크게 강조 깜빡 + 줄 하이라이트
function _zoneFacFocus(id){
  (_zoneFacBlink||[]).forEach(b=>{
    const el=b.el;if(!el)return;
    if(b.id===id){el.style.transform='scale(1.3)';el.style.opacity='1';try{b.ov.setZIndex(12);}catch(e){}}
    else{el.style.transform='';el.style.opacity='.55';try{b.ov.setZIndex(9);}catch(e){}}
  });
  document.querySelectorAll('#zoneFacRows [id^=zfRow]').forEach(r=>{r.style.background='';});
  const row=document.getElementById('zfRow'+id);
  if(row){row.style.background='rgba(255,215,106,.12)';try{row.scrollIntoView({block:'nearest'});}catch(e){}}
}
function _zoneFacGo(id){
  _zoneFacListClose();
  const f=(DB.g('facilities')||[]).find(x=>x.id===id);if(!f)return;
  try{if(mapI&&f.lat){mapI.setLevel(Math.min(mapI.getLevel(),4));mapI.panTo(new kakao.maps.LatLng(f.lat,f.lng));}}catch(e){}
  try{openFacFromMap(id);}catch(e){}
}
function _zoneFacListClose(){
  const ov=document.getElementById('zoneFacOv');if(ov)ov.remove();
  _zoneBlinkStop();
}
function _zoneBlinkStop(){
  clearTimeout(window._zoneBlinkTm);
  if(_zoneFacBlink)_zoneFacBlink.forEach(b=>{try{(b.ov||b).setMap(null);}catch(e){}});
  _zoneFacBlink=null;
}
// ── 담당구역 보정 데이터 적용(읽기 전용) — 저장된 zoneEdits를 그리기·판정·내보내기에 반영 ──
// 손드래그 편집기는 제거됨. 정밀 편집=KML 내보내기→GIS. 되돌리기·내보내기는 🛠 구역관리 패널.
const _ZE_MLAT=111000,_ZE_MLNG=87520; // 설악산 위도(38.17°) 기준 위·경도 1도당 미터
// 보정 데이터: zoneEdits[n]={dlat,dlng,verts:{"링번호,점번호":[Δlat,Δlng]}} — dlat/dlng=전체 이동, verts=부분 수정(움직인 꼭짓점만)
function _zoneOff(n){const e=DB.g('zoneEdits')||{};const o=e&&e[n];if(!o)return null;
  return (o.dlat||o.dlng||(o.verts&&Object.keys(o.verts).length))?o:null;}
// 원본 링 + 전체 이동 + 꼭짓점별 부분 보정 → 표시 경로 (그리기·편집·판정·원격 갱신이 전부 이 규칙 하나를 씀)
function _zeRingPath(ring,ri,adj){
  const dla=(adj&&adj.dlat)||0,dln=(adj&&adj.dlng)||0,vs=(adj&&adj.verts)||null;
  return ring.map((p,vi)=>{const vd=vs&&vs[ri+','+vi];
    return new kakao.maps.LatLng(p[0]+dla+(vd?vd[0]:0),p[1]+dln+(vd?vd[1]:0));});
}
// 구역의 '실제 사용할' 경계 링들: 불러온 경계(zoneGeom)가 있으면 그걸로 교체, 없으면 원본 park-zones.json 링
function _effRings(z){const g=DB.g('zoneGeom')||{};const gr=g&&g[z.n];return (gr&&gr.length)?gr:(z.rings||[]);}
// zoneGeom(경계 교체) 원격/로컬 변경 → 레이어 전체 재그리기(교체는 점 개수가 달라 in-place 이동 불가)
function _zoneGeomReload(){
  try{if(_zoneLayer){_zoneClear();_zoneDraw();}}catch(e){}
  try{if(_zoneLayerB&&_boardMap){_zoneLayerB.forEach(o=>{try{o.setMap(null);}catch(e){}});_zoneLayerB=null;_zoneDrawBoard();}}catch(e){}
}
// zoneEdits 원격 수신 → 켜져 있는 구역 레이어를 제자리 갱신 (app.core.js 문서 리스너가 호출)
// _zoneDraw() 재호출 대신 setPath/setPosition만 쓰는 이유: 재센터·토스트 부작용 없이 선택·깜빡임 상태 유지
function _zoneRemoteRefresh(){
  const shift=o=>{try{ // 점검지도·상황판 공통: 원본 좌표+보정(전체 이동+부분 수정)으로 제자리 이동(재그리기 부작용 없음)
    if(o._ring){o.setPath(_zeRingPath(o._ring,o._ri,_zoneOff(o._zn)));}
    else if(o._lbN!=null){const off=_zoneOff(o._lbN)||{};o.setPosition(new kakao.maps.LatLng(o._lbLat+(off.dlat||0),o._lbLng+(off.dlng||0)));}
  }catch(e){}};
  (_zoneLayer||[]).forEach(shift);
  (_zoneLayerB||[]).forEach(shift);
}
// ── 🛠 담당구역 관리(관리자) — KML/GeoJSON 내보내기 · 원본 되돌리기 · 검사 진입 ──
function _zaDownload(text,fname,mime){
  try{const blob=new Blob([text],{type:(mime||'text/plain')+';charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fname;
    document.body.appendChild(a);a.click();
    setTimeout(()=>{try{URL.revokeObjectURL(a.href);}catch(e){}a.remove();},2000);
  }catch(e){toast('⚠️ 내보내기 실패: '+((e&&e.message)||e));}
}
// 저장된 보정을 반영한 각 구역의 현재 경계 링들(숫자 [lat,lng]) — 링 번호 규칙은 _zoneDraw와 동일
function _zoneCurrentRings(z){const out=[];let ri=-1;_effRings(z).forEach(ring=>{ri++;if(ring.length<3)return;out.push(_zaAdjRing(z.n,ring,ri));});return out;}
function _zoneExportKml(){
  if(!_zoneData){toast('구역 데이터를 불러오는 중입니다');return;}
  const info=_zoneData.info||{};
  const X=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  let pm='';
  (_zoneData.zones||[]).forEach(z=>{
    const rings=_zoneCurrentRings(z);if(!rings.length)return;const inf=info[z.n]||{};
    const polys=rings.map(r=>{const pts=r.slice();const a=pts[0],b=pts[pts.length-1];if(a[0]!==b[0]||a[1]!==b[1])pts.push(a);
      const coords=pts.map(p=>p[1].toFixed(7)+','+p[0].toFixed(7)+',0').join(' '); // KML=경도,위도,고도 순
      return '<Polygon><tessellate>1</tessellate><outerBoundaryIs><LinearRing><coordinates>'+coords+'</coordinates></LinearRing></outerBoundaryIs></Polygon>';}).join('');
    pm+='<Placemark><name>'+X(z.n)+'구역</name><description>'+X('담당: '+(inf.m||'미지정')+' / 범위: '+(inf.r||''))+'</description><styleUrl>#zs</styleUrl>'
      +(rings.length>1?('<MultiGeometry>'+polys+'</MultiGeometry>'):polys)+'</Placemark>\n';
  });
  const kml='<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>설악산 순찰 담당구역</name>'
    +'<Style id="zs"><LineStyle><color>ff3ba9ff</color><width>2</width></LineStyle><PolyStyle><color>3300a5ff</color></PolyStyle></Style>\n'+pm+'</Document></kml>';
  _zaDownload(kml,'설악산_담당구역_'+today()+'.kml','application/vnd.google-earth.kml+xml');
  toast('📤 KML 저장 — Google Earth Pro·QGIS에서 열어 편집하세요',4000);
}
function _zoneExportGeojson(){
  if(!_zoneData){toast('구역 데이터를 불러오는 중입니다');return;}
  const info=_zoneData.info||{};const feats=[];
  (_zoneData.zones||[]).forEach(z=>{
    const rings=_zoneCurrentRings(z);if(!rings.length)return;const inf=info[z.n]||{};
    const polys=rings.map(r=>{const c=r.map(p=>[+p[1].toFixed(7),+p[0].toFixed(7)]);const a=c[0],b=c[c.length-1];if(a[0]!==b[0]||a[1]!==b[1])c.push(a);return [c];}); // GeoJSON=경도,위도
    feats.push({type:'Feature',properties:{zone:z.n,manager:inf.m||'',range:inf.r||''},
      geometry:polys.length>1?{type:'MultiPolygon',coordinates:polys}:{type:'Polygon',coordinates:polys[0]}});
  });
  _zaDownload(JSON.stringify({type:'FeatureCollection',features:feats}),'설악산_담당구역_'+today()+'.geojson','application/geo+json');
  toast('📄 GeoJSON 저장 완료');
}
function _zoneRevertConfirm(){
  const nE=Object.keys(DB.g('zoneEdits')||{}).length, nG=Object.keys(DB.g('zoneGeom')||{}).length;
  if(!nE&&!nG){toast('되돌릴 편집이 없습니다 — 이미 원본 상태입니다');return;}
  if(!confirm('⚠️ 저장된 구역 편집(위치 '+nE+'개'+(nG?' · 경계교체 '+nG+'개':'')+')을 모두 삭제하고 원본 경계로 되돌립니다.\n모든 직원 지도·상황판에 반영되며 되돌릴 수 없습니다.\n\n계속할까요?'))return;
  try{DB.d('zoneEdits');}catch(e2){}try{DB.s('zoneEdits',{});}catch(e2){}   // offset 편집 전부 제거
  try{DB.d('zoneGeom');}catch(e2){}try{DB.s('zoneGeom',{});}catch(e2){}     // 불러온 경계 교체도 전부 제거
  try{_zoneGeomReload();}catch(e2){}                                          // 이 기기 즉시 원본 재그리기
  try{_zoneRemoteRefresh();}catch(e2){}
  toast('↩ 원본 경계로 되돌렸습니다 — 전 직원 지도에 반영');
  const p=document.getElementById('zoneAdminPanel');if(p)p.remove();
}
// ── 📥 KML/GeoJSON 불러오기 — Google Earth·QGIS에서 편집한 구역 경계를 앱에 반영 ──
// GeoJSON: [경도,위도] → [위도,경도] 변환. 구역 매칭은 properties.zone / name의 숫자
function _parseZonesGeojson(txt){
  const d=JSON.parse(txt);const feats=(d&&d.type==='FeatureCollection')?(d.features||[]):(Array.isArray(d)?d:[d]);
  const out={};
  feats.forEach(f=>{if(!f)return;const pr=f.properties||{};
    const m=String(pr.zone!=null?pr.zone:(pr.n!=null?pr.n:(pr.name||''))).match(/\d+/);if(!m)return;
    const g=f.geometry;if(!g)return;let rings=[];
    if(g.type==='Polygon')rings=[g.coordinates&&g.coordinates[0]].filter(Boolean); // 외곽 링만(구멍 무시)
    else if(g.type==='MultiPolygon')rings=(g.coordinates||[]).map(poly=>poly&&poly[0]).filter(Boolean);
    else return;
    const conv=rings.map(r=>r.map(p=>[+p[1],+p[0]]).filter(q=>isFinite(q[0])&&isFinite(q[1]))).filter(r=>r.length>=3);
    if(conv.length)out[m[0]]=conv;
  });
  return out;
}
// KML: Placemark name의 숫자로 매칭, coordinates는 "경도,위도,고도" → [위도,경도]
function _parseZonesKml(txt){
  const doc=new DOMParser().parseFromString(txt,'text/xml');
  if(doc.getElementsByTagName('parsererror').length)throw new Error('KML 형식 오류');
  const out={},pms=doc.getElementsByTagName('Placemark');
  for(let i=0;i<pms.length;i++){const pm=pms[i];
    const nmEl=pm.getElementsByTagName('name')[0];const m=String((nmEl&&nmEl.textContent)||'').match(/\d+/);if(!m)continue;
    const rings=[];
    // 외곽 링만 취함(구멍 innerBoundaryIs 무시) — GeoJSON 파서와 동작 일치. outerBoundaryIs 없으면 모든 LinearRing 폴백
    const obs=pm.getElementsByTagName('outerBoundaryIs');
    const lrs=obs.length?[]:pm.getElementsByTagName('LinearRing');
    const coordEls=[];
    for(let k=0;k<obs.length;k++){const lr=obs[k].getElementsByTagName('LinearRing')[0];const ce=lr&&lr.getElementsByTagName('coordinates')[0];if(ce)coordEls.push(ce);}
    for(let k=0;k<lrs.length;k++){const ce=lrs[k].getElementsByTagName('coordinates')[0];if(ce)coordEls.push(ce);}
    coordEls.forEach(cEl=>{
      const pts=String(cEl.textContent||'').trim().split(/\s+/).map(t=>{const a=t.split(',');return [parseFloat(a[1]),parseFloat(a[0])];}).filter(p=>isFinite(p[0])&&isFinite(p[1]));
      if(pts.length>=3)rings.push(pts);
    });
    if(rings.length)out[m[0]]=rings;
  }
  return out;
}
function _zoneImportPick(){
  if(!(typeof isAdminUser==='function'&&isAdminUser())){try{_showAdminDenied();}catch(e){}return;}
  let inp=document.getElementById('zoneImportInput');
  if(!inp){inp=document.createElement('input');inp.type='file';inp.id='zoneImportInput';inp.accept='.kml,.geojson,.json,application/vnd.google-earth.kml+xml,application/geo+json';inp.style.display='none';inp.onchange=function(){_zoneImportFile(inp);};document.body.appendChild(inp);}
  inp.value='';inp.click();
}
function _zoneImportFile(inp){
  const f=inp.files&&inp.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=function(){try{
    const txt=String(rd.result||'');
    const parsed=/^\s*[\{\[]/.test(txt)?_parseZonesGeojson(txt):_parseZonesKml(txt);
    _zoneImportApply(parsed);
  }catch(e){toast('⚠️ 파일을 해석하지 못했습니다: '+((e&&e.message)||e),4000);}};
  rd.onerror=function(){toast('⚠️ 파일 읽기 실패');};
  rd.readAsText(f);
}
function _zoneImportApply(parsed){
  const known=new Set(((_zoneData&&_zoneData.zones)||[]).map(z=>String(z.n)));
  const keys=Object.keys(parsed||{}).filter(n=>known.has(String(n)));
  if(!keys.length){toast('불러온 파일에서 인식되는 구역을 찾지 못했습니다 (이름이 "N구역" 또는 zone 속성 필요)',4500);return;}
  const geom=Object.assign({},DB.g('zoneGeom')||{});
  keys.forEach(n=>{geom[n]=parsed[n].map(r=>r.map(p=>[+p[0].toFixed(6),+p[1].toFixed(6)]));});
  if(JSON.stringify(geom).length>950000){toast('⚠️ 구역 경계 용량이 Firestore 한계(1MB)에 근접 — 좌표를 단순화한(점 수를 줄인) 파일로 다시 시도하세요',5000);return;}
  const pts=keys.reduce((s,n)=>s+geom[n].reduce((a,r)=>a+r.length,0),0);
  if(!confirm('📥 '+keys.length+'개 구역('+keys.join(', ')+')의 경계를 불러온 파일로 교체합니다.\n총 '+pts+'개 꼭짓점 · 모든 직원 지도·상황판에 반영됩니다.\n\n계속할까요?'))return;
  DB.s('zoneGeom',geom);
  // 교체된 구역의 예전 offset 편집은 무의미하므로 제거
  const ed=Object.assign({},DB.g('zoneEdits')||{});let ch=false;keys.forEach(n=>{if(ed[n]){delete ed[n];ch=true;}});if(ch)DB.s('zoneEdits',ed);
  try{_zoneGeomReload();}catch(e){}
  toast('📥 '+keys.length+'개 구역 경계 반영 완료 — 전 직원 지도에 적용됩니다');
  const p=document.getElementById('zoneAdminPanel');if(p)p.remove();
}
function _zoneAdminPanel(){
  if(!(typeof isAdminUser==='function'&&isAdminUser())){try{_showAdminDenied();}catch(e){}return;}
  if(!_zoneData){toast('구역 표시를 먼저 켜 주세요');return;}
  let p=document.getElementById('zoneAdminPanel');if(p)p.remove();
  const nEdit=Object.keys(DB.g('zoneEdits')||{}).length, nGeom=Object.keys(DB.g('zoneGeom')||{}).length, nTot=nEdit+nGeom;
  p=document.createElement('div');p.id='zoneAdminPanel';p._baseTf='translateX(-50%)';
  p.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:calc(74px + env(safe-area-inset-bottom));z-index:9500;width:calc(100% - 24px);max-width:460px;box-sizing:border-box;background:#16161a;border:1px solid rgba(255,255,255,.18);border-radius:13px;box-shadow:0 6px 20px rgba(0,0,0,.6);';
  const btn=(cb,bg,bd,cl,t,sub)=>`<button onclick="${cb}" style="width:100%;text-align:left;padding:11px 12px;border-radius:9px;border:1px solid ${bd};background:${bg};color:${cl};font-size:12.5px;font-weight:700;cursor:pointer;margin-top:7px;line-height:1.4;">${t}${sub?`<br><span style="font-weight:500;font-size:10.5px;color:#8b9099;">${sub}</span>`:''}</button>`;
  p.innerHTML=`
    <div class="sheetGrab" style="padding:7px 0 2px;cursor:grab;touch-action:none;"><div class="dbhandle"></div></div>
    <div style="padding:2px 14px 12px;">
      <div style="display:flex;align-items:center;gap:8px;"><span style="font-size:13px;font-weight:800;color:#e8ecf1;">🛠 담당구역 관리</span>
        <span style="font-size:10.5px;color:#8b9099;">${nTot?('저장된 편집 '+nTot+'개 구역'+(nGeom?(' · 경계교체 '+nGeom):'')):'편집 없음(원본)'}</span></div>
      ${btn('_zoneExportKml()','rgba(49,130,246,.12)','rgba(49,130,246,.4)','#7db4ff','📤 KML로 내보내기','Google Earth Pro·QGIS에서 정밀 편집')}
      ${btn('_zoneExportGeojson()','rgba(255,255,255,.06)','rgba(255,255,255,.18)','#cdd4dc','📄 GeoJSON으로 내보내기','QGIS 권장')}
      ${btn('_zoneImportPick()','rgba(46,204,113,.12)','rgba(46,204,113,.4)','#57d98a','📥 편집한 파일 불러오기','Google Earth·QGIS에서 고친 KML/GeoJSON → 경계 교체')}
      ${btn('_zoneAudit()','rgba(255,255,255,.06)','rgba(255,255,255,.18)','#cdd4dc','🔍 겹침·경계 검사','')}
      ${btn('_zoneRevertConfirm()','rgba(255,160,80,.1)','rgba(255,160,80,.4)','#f0b070','↩ 전버전(원본)으로 되돌리기',nTot?(nTot+'개 편집 전부 삭제'):'현재 편집 없음')}
      <div style="font-size:10px;color:#5d6570;padding:10px 2px 0;line-height:1.65;">정밀 편집: <b>📤 내보내기 → Google Earth Pro/QGIS에서 위성사진 위 경계 편집 → 📥 불러오기</b>. 바뀐 구역만 저장되어 전 직원에게 반영됩니다.</div>
    </div>`;
  document.body.appendChild(p);
  try{_bindDragClose(p,()=>{const q=document.getElementById('zoneAdminPanel');if(q)q.remove();});}catch(e){}
}
// ── 🔍 구역 검사(관리자) — 편집한 경계의 겹침·공원경계 이탈·변경량을 '실제 저장 데이터'로 점검·시각화 ──
// (편집 데이터 zoneEdits는 공유DB에만 있어 서버 밖에선 못 봄 → 앱 안에서 라이브로 검사)
let _zaHi=[],_zaGhost=[];
function _zaClearHi(){(_zaHi||[]).forEach(o=>{try{o.setMap(null);}catch(e){}});_zaHi=[];}
function _zaClearGhost(){(_zaGhost||[]).forEach(o=>{try{o.setMap(null);}catch(e){}});_zaGhost=[];}
// 점(px,py) ∈ 다각형(ring=[[x,y]..]) 레이캐스팅
function _zaPip(px,py,ring){let ins=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];if(((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi))ins=!ins;}return ins;}
function _zaBbox(pts){let a=1e9,b=-1e9,c=1e9,d=-1e9;for(const p of pts){if(p[0]<a)a=p[0];if(p[0]>b)b=p[0];if(p[1]<c)c=p[1];if(p[1]>d)d=p[1];}return[a,b,c,d];}
function _zaBoxHit(A,B){return !(A[1]<B[0]||B[1]<A[0]||A[3]<B[2]||B[3]<A[2]);}
// 원본 링+보정 → 표시 좌표 [lat,lng] 숫자배열(검사·비교용)
function _zaAdjRing(n,ring,ri){const adj=_zoneOff(n)||{};const dla=adj.dlat||0,dln=adj.dlng||0,vs=adj.verts||null;return ring.map((p,vi)=>{const vd=vs&&vs[ri+','+vi];return [p[0]+dla+(vd?vd[0]:0),p[1]+dln+(vd?vd[1]:0)];});}
function _zoneAudit(){
  if(!(typeof isAdminUser==='function'&&isAdminUser())){try{_showAdminDenied();}catch(e){}return;}
  const _ap=document.getElementById('zoneAdminPanel');if(_ap)_ap.remove(); // 관리 패널에서 진입 시 겹치지 않게
  if(!_zoneData){toast('구역 데이터를 불러오는 중입니다');return;}
  if(!_parkBoundary){toast('공원 경계 불러오는 중...');fetch('./park-boundary.json').then(r=>r.json()).then(d=>{_parkBoundary=d;_zoneAudit();}).catch(()=>toast('⚠️ 공원 경계를 불러오지 못했습니다'));return;}
  toast('🔍 구역 검사 중...',1500);
  setTimeout(_zoneAuditRun,30); // 화면 페인트 후 실행(무거운 계산으로 멈춘 듯 보이지 않게)
}
function _zoneAuditRun(){
  _zaClearHi();
  // 원본(orig)·편집적용(now) 링을 함께 보관 — 검사는 '편집 전 대비 증가분(delta)'으로 판정한다.
  // (구역 데이터와 공원경계가 서로 다른 출처라 ~30m 어긋나 있어, 절대 겹침/이탈은 편집과 무관하게 늘 발생 → 델타만이 사용자 편집의 영향을 가려냄)
  const zones=[],byN={},_rc={};
  (_zoneData.zones||[]).forEach(z=>{
    _effRings(z).forEach(ring=>{
      const ri=_rc[z.n]=(_rc[z.n]===undefined?0:_rc[z.n]+1);
      if(ring.length<3)return;
      let zn=byN[z.n];if(!zn){zn=byN[z.n]={n:z.n,orig:[],now:[],pts:[]};zones.push(zn);}
      zn.orig.push(ring);
      const adj=_zaAdjRing(z.n,ring,ri);
      zn.now.push(adj);for(const p of adj)zn.pts.push(p);
    });
  });
  zones.forEach(z=>{z.bbox=_zaBbox(z.pts);const off=_zoneOff(z.n);z.edited=!!off;z.moveM=off?Math.round(Math.hypot((off.dlat||0)*_ZE_MLAT,(off.dlng||0)*_ZE_MLNG)):0;z.vN=off&&off.verts?Object.keys(off.verts).length:0;});
  // 공원 경계 큰 링만 [lng,lat]→[lat,lng] 변환(편집 구역만 검사하므로 다운샘플 없이 정밀하게)
  const parkRings=((_parkBoundary&&_parkBoundary.rings)||[]).filter(r=>r.length>=20).map(r=>r.map(p=>[p[1],p[0]]));
  const inPark=(la,ln)=>parkRings.some(pr=>_zaPip(la,ln,pr));
  const outScan=rings=>{let c=0;const pts=[];rings.forEach(r=>{const st=Math.max(1,Math.floor(r.length/150));for(let i=0;i<r.length;i+=st){if(!inPark(r[i][0],r[i][1])){c++;pts.push(r[i]);}}});return {c,pts};};
  const inCnt=(Pr,Qr)=>{let c=0;Pr.forEach(r=>{const st=Math.max(1,Math.floor(r.length/120));for(let t=0;t<r.length;t+=st){const p=r[t];if(Qr.some(qr=>_zaPip(p[0],p[1],qr)))c++;}});return c;};
  const ovPair=(Pr,Qr)=>inCnt(Pr,Qr)+inCnt(Qr,Pr);
  const edited=zones.filter(z=>z.edited);
  // 경계 이탈: 편집으로 공원 밖 꼭짓점이 새로 5개 이상 늘어난 구역
  const outZones=[];
  edited.forEach(z=>{const ob=outScan(z.orig).c,on=outScan(z.now);if(on.c-ob>=5)outZones.push({n:z.n,out:on.pts,added:on.c-ob});});
  // 겹침: 편집 구역이 낀 쌍 중, 이웃 안으로 파고든 정도가 원본 대비 6점 이상 늘어난 경우
  const overlaps=[],seen={};
  edited.forEach(A=>{zones.forEach(B=>{
    if(A.n===B.n)return;const key=[A.n,B.n].sort().join('|');if(seen[key])return;seen[key]=1;
    if(!_zaBoxHit(A.bbox,B.bbox))return;
    const base=ovPair(A.orig,B.orig),now=ovPair(A.now,B.now);
    if(now-base>=6)overlaps.push({a:A.n,b:B.n,depth:now-base});
  });});
  overlaps.sort((a,b)=>b.depth-a.depth);
  _zaHiDraw(outZones,overlaps,byN);
  _zoneAuditPanel({outZones,overlaps,edited,byN});
}
function _zaHiDraw(outZones,overlaps,byN){
  _zaClearHi();
  const ll=p=>new kakao.maps.LatLng(p[0],p[1]);
  const ovN=new Set();overlaps.forEach(o=>{ovN.add(o.a);ovN.add(o.b);});
  ovN.forEach(n=>{const z=byN[n];if(!z)return;z.now.forEach(r=>{const pl=new kakao.maps.Polyline({path:r.map(ll),strokeWeight:4,strokeColor:'#ff9500',strokeOpacity:.95,zIndex:8});pl.setMap(mapI);_zaHi.push(pl);});});
  outZones.forEach(oz=>{const z=byN[oz.n];if(z)z.now.forEach(r=>{const pl=new kakao.maps.Polyline({path:r.map(ll),strokeWeight:4,strokeColor:'#ff3b30',strokeOpacity:.95,zIndex:9});pl.setMap(mapI);_zaHi.push(pl);});
    oz.out.slice(0,40).forEach(p=>{const el=document.createElement('div');el.style.cssText='width:9px;height:9px;border-radius:50%;background:#ff3b30;border:1.5px solid #fff;box-shadow:0 0 6px rgba(255,59,48,.9);';const ov=new kakao.maps.CustomOverlay({position:ll(p),content:el,zIndex:11});ov.setMap(mapI);_zaHi.push(ov);});
  });
}
function _zoneGhostToggle(){
  const b=document.getElementById('zaGhostBtn');
  if(_zaGhost.length){_zaClearGhost();if(b){b.style.background='rgba(255,255,255,.08)';b.style.color='#a5abb3';}return;}
  (_zoneData.zones||[]).forEach(z=>{if(!_zoneOff(z.n))return; // 편집된 구역의 '원본' 경계를 회색 점선으로 겹쳐 표시
    (z.rings||[]).forEach(ring=>{if(ring.length<3)return;const pl=new kakao.maps.Polyline({path:ring.map(p=>new kakao.maps.LatLng(p[0],p[1])),strokeWeight:2,strokeColor:'#b8c0cc',strokeOpacity:.85,strokeStyle:'shortdash',zIndex:7});pl.setMap(mapI);_zaGhost.push(pl);});
  });
  if(!_zaGhost.length)toast('아직 변경된 구역이 없습니다');
  else if(b){b.style.background='rgba(184,192,204,.85)';b.style.color='#16161a';}
}
function _zoneAuditJump(n){
  const z=(_zonePolys&&_zonePolys[n]&&_zonePolys[n][0]);let ctr=null;
  try{if(z&&z._ring){const b=_zaBbox(_zaAdjRing(n,z._ring,z._ri||0));ctr=new kakao.maps.LatLng((b[0]+b[1])/2,(b[2]+b[3])/2);}}catch(e){}
  try{if(ctr&&mapI){mapI.setLevel(Math.min(mapI.getLevel(),6));mapI.panTo(ctr);}}catch(e){}
}
function _zoneAuditClose(){const p=document.getElementById('zoneAuditPanel');if(p)p.remove();_zaClearHi();_zaClearGhost();}
function _zoneAuditPanel(R){
  const {outZones,overlaps,edited}=R;
  let p=document.getElementById('zoneAuditPanel');if(p)p.remove();
  p=document.createElement('div');p.id='zoneAuditPanel';p._baseTf='translateX(-50%)';
  p.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:calc(74px + env(safe-area-inset-bottom));z-index:9500;width:calc(100% - 24px);max-width:460px;box-sizing:border-box;background:#16161a;border:1px solid rgba(255,255,255,.18);border-radius:13px;box-shadow:0 6px 20px rgba(0,0,0,.6);max-height:56vh;display:flex;flex-direction:column;';
  const row=(bg,txt,n)=>`<div onclick="_zoneAuditJump('${_escq(n)}')" style="display:flex;align-items:center;gap:7px;padding:8px 6px;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;font-size:12px;color:#dbe2ea;"><span style="width:7px;height:7px;border-radius:50%;background:${bg};flex-shrink:0;"></span>${txt}</div>`;
  const ok='<div style="padding:9px 6px;font-size:12px;color:#7ec8a0;">문제 없음 ✅</div>';
  const ovH=overlaps.length?overlaps.map(o=>row('#ff9500',`<b>${_esc(o.a)}</b>구역 ↔ <b>${_esc(o.b)}</b>구역 <span style="color:#8b9099;">겹침(정도 ${o.depth})</span>`,o.a)).join(''):ok;
  const outH=outZones.length?outZones.map(o=>row('#ff3b30',`<b>${_esc(o.n)}</b>구역 — <span style="color:#ff8a7a;">경계 밖으로 밀려남 ${o.out.length}곳</span>`,o.n)).join(''):ok;
  const edH=edited.length?edited.slice().sort((a,b)=>b.moveM-a.moveM).map(z=>row('#7db4ff',`<b>${_esc(z.n)}</b>구역 — ${z.moveM?('통째 '+z.moveM+'m'):''}${z.vN?((z.moveM?' · ':'')+'부분 '+z.vN+'점'):''}${(!z.moveM&&!z.vN)?'미세':''}`,z.n)).join(''):'<div style="padding:9px 6px;font-size:12px;color:#8b9099;">아직 변경한 구역이 없습니다</div>';
  const sec=(t,body)=>`<div style="font-size:11px;font-weight:800;color:#9aa4b0;padding:9px 6px 3px;">${t}</div>${body}`;
  p.innerHTML=`
    <div class="sheetGrab" style="padding:7px 0 2px;cursor:grab;touch-action:none;flex-shrink:0;"><div class="dbhandle"></div></div>
    <div style="display:flex;align-items:center;gap:8px;padding:2px 13px 8px;flex-shrink:0;">
      <span style="font-size:13px;font-weight:800;color:#e8ecf1;">🔍 구역 검사</span>
      <span style="font-size:10.5px;color:#8b9099;">겹침 ${overlaps.length} · 이탈 ${outZones.length} · 변경 ${edited.length}</span>
      <button id="zaGhostBtn" onclick="_zoneGhostToggle()" style="margin-left:auto;padding:6px 9px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#a5abb3;font-size:10.5px;font-weight:800;cursor:pointer;">👻 원본 겹쳐보기</button>
    </div>
    <div style="overflow-y:auto;padding:0 13px 12px;">
      ${sec('⚠️ 편집으로 새로 겹치게 된 구역',ovH)}
      ${sec('🚧 편집으로 공원 경계를 벗어난 구역',outH)}
      ${sec('✏️ 변경한 구역 (전/후 비교는 👻 버튼)',edH)}
      <div style="font-size:10px;color:#5d6570;padding:9px 4px 0;line-height:1.6;">원래 데이터의 어긋남은 빼고 <b>내 편집이 새로 만든 문제만</b> 표시합니다. 빨강=경계 밖·주황=겹침·회색 점선=원본 위치. 항목 탭=이동 · 고칠 땐 🛠 구역관리 → KML 내보내기.</div>
    </div>`;
  document.body.appendChild(p);
  try{_bindDragClose(p,_zoneAuditClose);}catch(e){}
}
// ── 🗺 순찰 담당 구역도(직무현황표 PDF) 뷰어 — 핀치·휠·더블탭 확대, 오프라인 캐시 ──
function openPatrolMap(){
  let ov=document.getElementById('patrolMapOv');if(ov)ov.remove();
  ov=document.createElement('div');ov.id='patrolMapOv';
  ov.style.cssText='position:fixed;inset:0;z-index:99400;background:#0b0b0d;display:flex;flex-direction:column;';
  ov.innerHTML=`<div style="flex-shrink:0;display:flex;align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top)) 12px 8px;border-bottom:1px solid rgba(255,255,255,.1);">
      <span style="font-size:13px;font-weight:800;color:#eaecef;">🗺 순찰 담당 구역도</span>
      <span style="font-size:10px;color:#6b7684;flex:1;">두 손가락·더블탭·휠로 확대</span>
      <a href="patrol-map.jpg" download="설악산_순찰구역도.jpg" style="background:rgba(49,130,246,.14);border:1px solid rgba(49,130,246,.4);color:#4d9bf5;border-radius:8px;padding:7px 11px;font-size:12px;font-weight:700;text-decoration:none;">⬇ 저장</a>
      <button onclick="document.getElementById('patrolMapOv').remove()" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#d5d8dc;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;">✕</button></div>
    <div id="pmWrap" style="flex:1;min-height:0;overflow:hidden;position:relative;touch-action:none;">
      <img id="pmImg" src="patrol-map.jpg" style="position:absolute;left:0;top:0;transform-origin:0 0;max-width:none;user-select:none;-webkit-user-drag:none;" draggable="false">
    </div>`;
  document.body.appendChild(ov);
  _pmInit();
}
function _pmInit(){
  const wrap=document.getElementById('pmWrap'),img=document.getElementById('pmImg');
  if(!wrap||!img)return;
  let s=1,tx=0,ty=0,minS=1;
  const apply=()=>{img.style.transform='translate('+tx+'px,'+ty+'px) scale('+s+')';};
  const fit=()=>{
    const W=wrap.clientWidth,H=wrap.clientHeight;
    if(!img.naturalWidth||!W)return;
    minS=Math.min(W/img.naturalWidth,H/img.naturalHeight);
    s=minS;tx=(W-img.naturalWidth*s)/2;ty=(H-img.naturalHeight*s)/2;apply();
  };
  img.onload=fit;if(img.complete)fit();
  const clamp=()=>{
    const W=wrap.clientWidth,H=wrap.clientHeight,iw=img.naturalWidth*s,ih=img.naturalHeight*s;
    tx=iw<=W?(W-iw)/2:Math.min(0,Math.max(W-iw,tx));
    ty=ih<=H?(H-ih)/2:Math.min(0,Math.max(H-ih,ty));
  };
  const zoomAt=(px,py,ns)=>{ns=Math.max(minS,Math.min(ns,minS*10));tx=px-(px-tx)*(ns/s);ty=py-(py-ty)*(ns/s);s=ns;clamp();apply();};
  const pts=new Map();let lastD=0,lastMid=null,lastTap=0;
  wrap.onpointerdown=e=>{
    try{wrap.setPointerCapture(e.pointerId);}catch(_){}
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===1){
      const t=Date.now(),r=wrap.getBoundingClientRect();
      if(t-lastTap<300)zoomAt(e.clientX-r.left,e.clientY-r.top,s<minS*2.5?minS*3.2:minS);
      lastTap=t;
    }
  };
  wrap.onpointermove=e=>{
    if(!pts.has(e.pointerId))return;
    const prev=pts.get(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===1){tx+=e.clientX-prev.x;ty+=e.clientY-prev.y;clamp();apply();}
    else if(pts.size===2){
      const a=[...pts.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
      const mid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2},r=wrap.getBoundingClientRect();
      if(lastD){if(lastMid){tx+=mid.x-lastMid.x;ty+=mid.y-lastMid.y;}zoomAt(mid.x-r.left,mid.y-r.top,s*d/lastD);}
      lastD=d;lastMid=mid;
    }
  };
  const up=e=>{pts.delete(e.pointerId);if(pts.size<2){lastD=0;lastMid=null;}};
  wrap.onpointerup=up;wrap.onpointercancel=up;
  wrap.onwheel=e=>{e.preventDefault();const r=wrap.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,s*(e.deltaY<0?1.2:1/1.2));};
}
// 🔦 세로선 원인 스캔 — 화면 안쪽에 세로 경계(왼/오른 가장자리)를 가진 큰 요소를 전부 분홍 테두리로 표시.
// 세로선과 겹치는 테두리가 있으면 앱 요소가 범인(전 기기 공통 수정 가능), 없으면 표시장치/드라이버 쪽.
function _seamScan(){
  try{
    const vw=innerWidth,vh=innerHeight,hits=[];
    document.querySelectorAll('body *').forEach(el=>{
      let r;try{r=el.getBoundingClientRect();}catch(e){return;}
      if(r.height<vh*0.7||r.width<8)return;
      const edges=[];
      if(r.left>6&&r.left<vw-6)edges.push('좌'+Math.round(r.left));
      if(r.right>6&&r.right<vw-6)edges.push('우'+Math.round(r.right));
      if(!edges.length)return;
      const cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden')return;
      el.style.outline='2px solid #ff2d78';el.style.outlineOffset='-2px';
      setTimeout(()=>{try{el.style.outline='';el.style.outlineOffset='';}catch(e){}},10000);
      hits.push((el.id?'#'+el.id:(typeof el.className==='string'&&el.className?'.'+el.className.split(' ')[0]:el.tagName.toLowerCase()))+'('+edges.join('·')+')');
    });
    try{console.log('seamScan:',hits);}catch(e){}
    toast(hits.length?('🔦 세로 경계 요소 '+hits.length+'개를 10초간 분홍 테두리로 표시 — 세로선과 겹치는 게 범인입니다. 화면을 캡처해 보내주세요'):'🔦 화면 안쪽에 세로 경계 요소 없음 — 앱이 아니라 표시장치·드라이버 쪽 원인',9000);
    return hits;
  }catch(e){try{toast('스캔 실패: '+e);}catch(_){}}
}
function boardDiag(){
  var p=document.getElementById('bdDiag');if(p){p.remove();return;}
  p=document.createElement('div');p.id='bdDiag';
  p.style.cssText='position:fixed;top:70px;right:16px;z-index:99;background:#16161a;border:1px solid rgba(255,255,255,.25);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:7px;box-shadow:0 6px 24px rgba(0,0,0,.6);max-width:290px;';
  var btn=function(txt,fn){return '<button onclick="'+fn+'" style="padding:10px 13px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#d5d8dc;font-size:12px;font-weight:700;cursor:pointer;text-align:left;">'+txt+'</button>';};
  p.innerHTML='<div style="font-size:11px;font-weight:800;color:#8b95a1;">🔧 세로선 진단 — 하나씩 눌러보고<br>선이 사라지는 번호를 알려주세요</div>'
    +btn('① 공원 경계선 끄기/켜기','_bdTogglePark()')
    +btn('② 핀·오버레이 끄기/켜기','_bdTogglePins()')
    +btn('③ 지도 강제 재생성','_bdRecreate()')
    +btn('④ 완전 기본 지도로 재생성 (선·핀 없음)','_bdPlain()')
    +'<button onclick="document.getElementById(\'bdDiag\').remove()" style="padding:7px;border:none;background:none;color:#6b7684;font-size:11px;cursor:pointer;">닫기</button>';
  document.body.appendChild(p);
}
function _bdTogglePark(){var m=_boardMap;if(!m)return;var L=m._parkLines||[];if(!L.length){toast('경계선 없음');return;}var on=!!L[0].getMap();L.forEach(function(l){try{l.setMap(on?null:m);}catch(e){}});toast(on?'① 경계선 숨김 — 선이 사라졌나요?':'① 경계선 다시 표시');}
function _bdTogglePins(){if(!_boardOvs.length){toast('핀 없음');return;}var on=!!_boardOvs[0].getMap();_boardOvs.forEach(function(o){try{o.setMap(on?null:_boardMap);}catch(e){}});toast(on?'② 핀 숨김 — 선이 사라졌나요?':'② 핀 다시 표시');}
function _bdRecreate(){var el=document.getElementById('boardMap');if(el)_createBoardMap(el);toast('③ 지도 재생성 완료 — 선이 사라졌나요?');}
function _bdPlain(){window._bdForcePlain=!window._bdForcePlain;var el=document.getElementById('boardMap');if(el)_createBoardMap(el);toast(window._bdForcePlain?'④ 진단 모드: 기본 로드맵만(선·핀·경계 없음) — 이래도 선이 보이면 카카오/브라우저 문제':'④ 원래 설정으로 복귀');}
function _drawParkBoundary(map){
  if(!map||map._parkDrawn)return;
  if(_parkBoundary){_paintPark(map,_parkBoundary);return;}
  _parkPendingMaps.push(map);
  if(_parkPendingMaps.length>1)return; // 이미 로드 중
  fetch('./park-boundary.json').then(function(r){return r.json();}).then(function(d){
    _parkBoundary=d;
    _parkPendingMaps.forEach(function(m){_paintPark(m,d);});
    _parkPendingMaps=[];
  }).catch(function(){_parkPendingMaps=[];});
}
function initMaps(){
  function doInit(){
    if(mapR&&mapI)return; // Guard: don't recreate if already initialized
    // tileAnimation:false → 타일 페이드인 애니메이션 제거로 지도가 즉시 그려짐(체감 속도↑). 팬·줌도 더 가벼움
    const c=new kakao.maps.LatLng(DC.lat,DC.lng),opt={center:c,level:9,tileAnimation:false};
    mapI=new kakao.maps.Map(document.getElementById('mapInspect'),opt);
    mapR=new kakao.maps.Map(document.getElementById('mapRescue'),opt);
    mapI.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
    mapR.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
    try{_drawParkBoundary(mapR);_drawParkBoundary(mapI);}catch(e){}
    kakao.maps.event.addListener(mapI,'click',()=>{try{_closeFacOverlapSheet();}catch(e){}closeDB();}); // 빈 지도 탭 → 목록 시트 닫기
    kakao.maps.event.addListener(mapR,'click',closeDB);
    var _saveMapCenterTimer=null;
    function saveMapCenter(){
      try{
        var lat,lng;
        const mapEl=document.getElementById('mapRescue');
        const h=mapEl.offsetHeight||mapEl.clientHeight;
        var coord=null;
        if(h>0){try{coord=mapR.getProjection().coordsFromContainerPoint(new kakao.maps.Point(mapEl.offsetWidth/2,h/2-_mapVOff()));}catch(e){coord=null;}}
        if(coord){lat=coord.getLat();lng=coord.getLng();}
        else{const c=mapR.getCenter();lat=c.getLat();lng=c.getLng();}
        window._lastCrosshairCoord={lat,lng};
        const cd=document.getElementById('rescueCoords');
        if(cd)cd.innerHTML=lat.toFixed(5)+', '+lng.toFixed(5);
        clearTimeout(_saveMapCenterTimer);
        _saveMapCenterTimer=setTimeout(function(){
          const _s=_nearestSign(lat,lng);
          // 고도: 내 위치(GPS 실측)가 중심과 가까우면 실측값, 아니면 그 지점 지형고도(DEM)
          let _e='';
          try{
            const g=window._myGpsAlt;
            if(g&&g.alt!=null&&Date.now()-g.ts<120000&&_haversine(g.lat,g.lng,lat,lng)<30)_e='⛰'+Math.round(g.alt)+'m';
            else if(typeof _elevStr==='function')_e=_elevStr(lat,lng);
          }catch(e){}
          if(cd)cd.innerHTML=lat.toFixed(5)+', '+lng.toFixed(5)+(_e?' <span style="color:#a7f3e4;">'+_e+'</span>':'')+(_s?'<br><span style="color:#f0c040;font-size:9.5px;">📍 '+_s+'</span>':'');
          // 'NN-NN → 거점' 존 배지는 사용 안 함 (카카오 길찾기 API 도입 후 재검토)
          try{const zb=document.getElementById('rescueZoneBadge');if(zb)zb.style.display='none';}catch(e){}
        },300);
      }catch(e){}
    }
    // center_changed는 팬 중 프레임마다 여러 번 연사됨 → rAF로 프레임당 1회로 제한(레이아웃 강제·재계산 부담 완화)
    var _smcRaf=0;
    function _saveMapCenterT(){if(_smcRaf)return;_smcRaf=requestAnimationFrame(function(){_smcRaf=0;saveMapCenter();});}
    kakao.maps.event.addListener(mapR,'center_changed',_saveMapCenterT);
    window._saveMapCenter=saveMapCenter;
    saveMapCenter();
    function saveInspectCenter(){
      try{
        const mapEl=document.getElementById('mapInspect');
        const h=mapEl.offsetHeight||mapEl.clientHeight;
        if(h>0){
          const coord=mapI.getProjection().coordsFromContainerPoint(new kakao.maps.Point(mapEl.offsetWidth/2,h/2-_mapVOff()));
          window._lastInspectCrosshairCoord={lat:coord.getLat(),lng:coord.getLng()};
          const ci=document.getElementById('inspectCoords');
          if(ci)ci.textContent=coord.getLat().toFixed(5)+', '+coord.getLng().toFixed(5);
          return;
        }
      }catch(e){}
      const c=mapI.getCenter();window._lastInspectCrosshairCoord={lat:c.getLat(),lng:c.getLng()};
      const ci=document.getElementById('inspectCoords');
      if(ci)ci.textContent=c.getLat().toFixed(5)+', '+c.getLng().toFixed(5);
    }
    var _sicRaf=0;
    function _saveInspectCenterT(){if(_sicRaf)return;_sicRaf=requestAnimationFrame(function(){_sicRaf=0;saveInspectCenter();});}
    kakao.maps.event.addListener(mapI,'center_changed',_saveInspectCenterT);
    saveInspectCenter();
    // 줌 레벨에 따른 핀 크기 자동 조절
    // 핀 크기조정·재클러스터는 줌이 '멈춘 뒤' 1회만 — 핀치줌은 레벨을 지날 때마다 zoom_changed가
    // 연사되는데, 그때마다 수백 개 오버레이를 재부착·재스타일하면 핀이 사라져 보이고 프레임이 급락함
    kakao.maps.event.addListener(mapR,'zoom_changed',()=>{
      clearTimeout(window._rZoomT);
      window._rZoomT=setTimeout(()=>{_scaleOvs(rEls,mapR.getLevel(),3);try{_reclusterRescue();}catch(e){}},150);
    });
    kakao.maps.event.addListener(mapI,'zoom_changed',()=>{
      try{_closeFacOverlapSheet();}catch(e){}
      clearTimeout(window._iZoomT);
      window._iZoomT=setTimeout(()=>{_scaleOvs(iEls,mapI.getLevel(),1);try{_reclusterInspect();}catch(e){}},150);
    });
    _armDprWatch(); // 배율 변경 감지 — 전 지도 공통(세로선 예방)
    if(window._hideLoading)setTimeout(window._hideLoading,600);
  }
  if(window._KR){doInit();return;}
  window._KCB=doInit;
  // 12초 지나도 SDK가 준비 안 되면(도메인 미등록·네트워크 차단 등) 빈 화면 대신
  // 안내 문구 + 새로고침 버튼 표시 (기존엔 아무 표시 없이 그냥 빈 화면이었음)
  if(!window._mapFallbackTimer){
    window._mapFallbackTimer=setTimeout(function(){
      if(mapR&&mapI)return;
      var html='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#8b95a1;font-size:13px;text-align:center;padding:20px;gap:8px;">'+
        '<div>⚠️ 지도를 불러올 수 없습니다</div>'+
        '<div style="font-size:11px;color:#565f6b;">네트워크 연결을 확인해주세요</div>'+
        '<button onclick="location.reload()" style="margin-top:4px;background:#1d6fa5;color:#fff;border:none;padding:8px 16px;border-radius:8px;font-size:12px;cursor:pointer;">새로고침</button>'+
        '</div>';
      ['mapInspect','mapRescue'].forEach(function(id){
        var el=document.getElementById(id);
        if(el)el.innerHTML=html;
      });
    },12000);
  }
}
// 지도 상단 컨트롤을 flex 컨테이너로 강제 재배치 — 어떤 index.html(구버전 캐시 포함)이든 동일 레이아웃 보장
function _ensureMapTopCtrls(){
  try{
    const wrap=document.querySelector('#v-rescue-map .mapwrap');if(!wrap)return;
    let c=document.getElementById('mapTopCtrls');
    if(!c){
      c=document.createElement('div');c.id='mapTopCtrls';
      const r1=document.createElement('div');r1.id='mapTopRow1';
      const r2=document.createElement('div');r2.id='mapTopRow2';
      c.appendChild(r1);c.appendChild(r2);wrap.appendChild(c);
      const satBtn=Array.from(wrap.children).find(el=>el.tagName==='BUTTON'&&el.classList.contains('map-ctrl')&&!el.id);
      const mv=(el,row,right)=>{if(!el)return;el.style.position='static';el.style.top='';el.style.left='';el.style.right='';el.style.pointerEvents='auto';if(right)el.style.marginLeft='auto';row.appendChild(el);};
      mv(satBtn,r1);mv(document.getElementById('resOngoingBtn'),r1);
      mv(document.getElementById('resCatFilterBtn'),r1,true);mv(document.getElementById('resMapFilterBtn'),r1);
      mv(document.getElementById('sosReqBtn'),r2);
    }
    // 스타일은 항상 강제(구버전 인라인 잔존 대비)
    c.style.cssText='position:absolute;top:8px;left:8px;right:8px;z-index:10;display:flex;flex-direction:column;gap:5px;pointer-events:none;';
    const rows=c.children;
    if(rows[0])rows[0].style.cssText='display:flex;gap:6px;align-items:center;pointer-events:none;';
    if(rows[1])rows[1].style.cssText='display:flex;pointer-events:none;';
    Array.from(c.querySelectorAll('button')).forEach(b=>{b.style.position='static';b.style.top='';b.style.left='';b.style.right='';b.style.pointerEvents='auto';});
  }catch(e){}
}
// 상단 컨트롤 실측 자가보정 — 어떤 원인이든(웹뷰 오프셋 등) 지도 상단과의 실제 간격을 재서 8px로 끌어올림
function _fixTopCtrlOffset(){
  try{
    const c=document.getElementById('mapTopCtrls');
    const w=document.querySelector('#v-rescue-map .mapwrap');
    if(!c||!w)return;
    c.style.transform='';
    const cr=c.getBoundingClientRect(), wr=w.getBoundingClientRect();
    const gap=cr.top-wr.top;                        // 기대값: 8px
    if(gap>14)c.style.transform='translateY(-'+Math.round(gap-8)+'px)';
    // 진단 1회 기록(원인 추적용) — 간격 이상일 때만
    if(gap>14&&!window._ctrlDiagLogged){window._ctrlDiagLogged=true;
      try{_logErr&&_logErr('[진단] 지도상단 gap='+Math.round(gap)+'px wrapTop='+Math.round(wr.top)+' wrapH='+Math.round(wr.height)+' winH='+window.innerHeight+' dpr='+(window.devicePixelRatio||1));}catch(e){}
    }
  }catch(e){}
}
function rMaps(){
  // 지도 컨테이너 크기를 부모에 맞게 강제 설정
  ['mapRescue','mapInspect'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.style.width='100%';el.style.height='100%';}
  });
  _applyMapVOff(); // 하단바 기준 활성지점 오프셋(십자선 위치) 갱신
  try{_ensureMapTopCtrls();}catch(e){} // 상단 컨트롤 flex 강제(구버전 DOM 대비)
  setTimeout(()=>{
    try{if(mapI){mapI.relayout();}}catch(e){}
    try{if(mapR){mapR.relayout();}}catch(e){}
    _applyMapVOff();
    try{if(typeof window._saveMapCenter==='function')window._saveMapCenter();}catch(e){}
    try{_fixTopCtrlOffset();}catch(e){}
  },150);
  setTimeout(function(){try{_fixTopCtrlOffset();}catch(e){}},600); // 레이아웃 안정 후 재확인
}
function toggleMapType(m){
  if(m==='inspect'){mapIType=mapIType==='hybrid'?'roadmap':'hybrid';mapI.setMapTypeId(mapIType==='hybrid'?kakao.maps.MapTypeId.HYBRID:kakao.maps.MapTypeId.ROADMAP);}
  else{mapRType=mapRType==='hybrid'?'roadmap':'hybrid';mapR.setMapTypeId(mapRType==='hybrid'?kakao.maps.MapTypeId.HYBRID:kakao.maps.MapTypeId.ROADMAP);}
  toast(m==='inspect'?(mapIType==='hybrid'?'위성':'일반'):(mapRType==='hybrid'?'위성':'일반'));
}
function gpsTo(mode){
  if(!window._KR||typeof kakao==='undefined'||!kakao.maps||!kakao.maps.LatLng){toast('⚠️ 지도 로딩 중 — 잠시 후 다시 시도하세요');return;}
  if(!navigator.geolocation){toast('⚠️ GPS 미지원');return;}
  toast('📍 GPS 수신 중...');
  navigator.geolocation.getCurrentPosition(p=>{
    const ll=new kakao.maps.LatLng(p.coords.latitude,p.coords.longitude);
    const m=mode==='inspect'?mapI:mapR;
    m.setLevel(4);
    // GPS 점이 '보이는 중앙(십자선 위치)'에 오도록 중심을 오프셋만큼 아래로 잡아줌.
    // (지도 중심은 div정중앙이고 십자선은 그보다 오프셋만큼 위 → 중심을 그만큼 남쪽으로 옮기면 GPS가 십자선에 옴)
    const off=_mapVOff();
    m.setCenter(ll);
    if(off>0){try{const proj=m.getProjection();const pt=proj.containerPointFromCoords(ll);pt.y+=off;m.setCenter(proj.coordsFromContainerPoint(pt));}catch(e){}}
    if(myOv)myOv.setMap(null);
    const el=document.createElement('div');
    el.style.cssText='width:18px;height:18px;border-radius:50%;background:#3182f6;border:3px solid #fff;box-shadow:0 0 10px rgba(255,255,255,.8),0 2px 6px rgba(0,0,0,.5);';
    myOv=new kakao.maps.CustomOverlay({position:ll,content:el});myOv.setMap(m);
    const _alt=(p.coords.altitude!=null&&isFinite(p.coords.altitude))?Math.round(p.coords.altitude):null;
    window._myGpsAlt={lat:p.coords.latitude,lng:p.coords.longitude,alt:_alt,ts:Date.now()}; // 좌표 readout 실측 고도용
    toast('✅ 내 위치'+(_alt!=null?' · ⛰'+_alt+'m':''));
  },()=>toast('⚠️ GPS 실패. 위치 권한 확인'),{enableHighAccuracy:true,timeout:15000,maximumAge:10000});
}
function gpsFromMap(id,mode){
  try{const m=mode==='inspect'?mapI:mapR;
    const el=m.getNode&&m.getNode();const h=el?(el.offsetHeight||el.clientHeight):0;const off=_mapVOff();
    let lat,lng;
    if(h>0){const coord=m.getProjection().coordsFromContainerPoint(new kakao.maps.Point(el.offsetWidth/2,h/2-off));lat=coord.getLat();lng=coord.getLng();}
    else{const c=m.getCenter();lat=c.getLat();lng=c.getLng();}
    document.getElementById(id).value=lat.toFixed(5)+', '+lng.toFixed(5);toast('🗺️ 지도 중심 좌표(십자선)');if(id==='hz_gps')_updateHazMiniMap(lat,lng);}
  catch(e){toast('⚠️ 지도를 먼저 여세요');}
}
function gpsFromPhone(id){
  if(!navigator.geolocation){toast('⚠️ GPS 미지원');return;}
  navigator.geolocation.getCurrentPosition(p=>{const lat=p.coords.latitude,lng=p.coords.longitude;document.getElementById(id).value=lat.toFixed(5)+', '+lng.toFixed(5);toast('📍 현재 위치');if(id==='hz_gps')_updateHazMiniMap(lat,lng);},()=>toast('⚠️ GPS 실패'),{enableHighAccuracy:true,timeout:15000,maximumAge:10000});
}

// ══════════════════════════════════════════
// 네비게이션
// ══════════════════════════════════════════
let curApp='';
function showV(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));document.getElementById(id).classList.add('on');}
// ══ 본부 상황판 ══════════════════════════
let _boardTimer=null;
function openBoard(){
  // 상황판을 #app(overflow:hidden) 밖 body 직속으로 이동 → #app의 페인트 클리핑(우측 세로선) 원천 차단
  try{var _vb=document.getElementById('v-board');if(_vb&&_vb.parentNode!==document.body)document.body.appendChild(_vb);}catch(e){}
  showV('v-board');
  document.getElementById('appHdr').style.display='none';
  document.getElementById('bnav').style.display='none';
  // 상세 패널 닫고 목록 표시 상태로 초기화
  _boardDetailId=null;
  const _bd=document.getElementById('boardDetail');if(_bd)_bd.style.display='none';
  const _bb=document.getElementById('boardBody');if(_bb)_bb.style.display='';
  // 지도는 컨테이너가 전체화면 최종 너비에 도달한 뒤 생성 (좁은 너비로 만들면 오른쪽에 어두운 띠 잔상)
  requestAnimationFrame(function(){_boardMapWhenReady(0);});
  renderBoard();
  clearInterval(_boardTimer);
  _boardTimer=setInterval(()=>{
    if(!document.getElementById('v-board').classList.contains('on')){clearInterval(_boardTimer);return;}
    renderBoard();
  },10000);
  // 크기·배율·내부폭 감시는 2초 주기로 따로(가벼운 DOM 읽기 몇 개) — 세로선이 생겨도 2초 안에 자가복구
  clearInterval(window._boardSizeTimer);
  window._boardSizeTimer=setInterval(()=>{
    if(!document.getElementById('v-board').classList.contains('on')){clearInterval(window._boardSizeTimer);return;}
    try{_boardEnsureSize();}catch(e){}
  },2000);
  history.pushState({view:'board'},'','');
}
function closeBoard(){
  clearInterval(_boardTimer);clearInterval(window._boardSizeTimer);
  try{const lg=document.getElementById('useZoneLegendB');if(lg)lg.remove();}catch(e){}
  try{const c=document.getElementById('zoneInfoCard');if(c)c.remove();}catch(e){}
  try{const u=document.getElementById('useZoneCard');if(u)u.remove();}catch(e){}
  try{_zoneSelBlinkStop();_zoneSelB=null;}catch(e){}
  goHome();
}

// 상황판 지도: 진행중 구조/위험 핀 표시
let _boardMap=null,_boardOvs=[],_boardResizeBound=false,_boardCreateW=0;
// 상황판 지도 종류(위성 기본) — 기기별 저장
let _boardMapType=(function(){try{return localStorage.getItem('_boardMapType')||'hybrid';}catch(e){return 'hybrid';}})();
// 세로 이음선(카카오 relayout 잔상)의 근본 원인: 지도가 컨테이너 최종 너비 '전'에 생성되면
// 나중에 드러난 오른쪽 영역이 재렌더되지 않아 어둡게 남음. relayout으로는 안 지워지므로
// '현재 컨테이너 실제 크기'로 지도를 새로 생성한다(원천 차단).
function _createBoardMap(el){
  try{
    if(_boardMap){_boardOvs.forEach(o=>{try{o.setMap(null);}catch(e){}});_boardOvs=[];}
    el.innerHTML='';
    _boardMap=new kakao.maps.Map(el,{center:new kakao.maps.LatLng(DC.lat,DC.lng),level:9,tileAnimation:false});
    _boardMap.setMapTypeId(window._bdForcePlain?kakao.maps.MapTypeId.ROADMAP:(_boardMapType==='hybrid'?kakao.maps.MapTypeId.HYBRID:kakao.maps.MapTypeId.ROADMAP));
    _boardCreateW=el.clientWidth||0;
    _boardCreateDpr=window.devicePixelRatio||1;
    el._fixTried=0;
    if(!window._bdForcePlain){ // ④ 진단 모드에선 순수 지도만 — 경계·핀 전부 생략
      try{_drawParkBoundary(_boardMap);}catch(e){}
      // 구역·용도 레이어가 켜져 있었다면 재생성된 지도에 다시 그림
      try{if(_zoneLayerB){_zoneLayerB.forEach(o=>{try{o.setMap(null);}catch(e){}});_zoneDrawBoard();}}catch(e){}
      try{if(_useZoneLayerB){_useZoneLayerB.forEach(o=>{try{o.setMap(null);}catch(e){}});_useZoneLayerB=null;_toggleUseZonesBoard();}}catch(e){}
      _renderBoardPins(true);
    }else{window._boardPinSig='';}
    // 레이아웃 커밋 후 한 번 더 relayout (생성 직후 폭 계산 오차 보정)
    requestAnimationFrame(function(){try{_boardMap&&_boardMap.relayout();}catch(e){}});
    // 생성 직후 컨테이너 폭이 또 달라진 경우(전체화면 전환·배율 변경 중 생성) 1회 재검증
    setTimeout(function(){
      try{var w=el.clientWidth||0;if(_boardMap&&w&&Math.abs(w-_boardCreateW)>4)_createBoardMap(el);}catch(e){}
    },350);
  }catch(e){console.warn('boardMap',e);}
}
// 우측 미렌더 띠(세로선) 자가복구 — 3중 검증:
// ①컨테이너 폭이 생성 때와 다름 ②모니터 배율/브라우저 확대(devicePixelRatio) 변경 ③카카오 내부 뷰포트 폭 ≠ 컨테이너 폭
// ③이 핵심: 카카오가 내부적으로 알고 있는 폭이 어긋나면(=선 그어짐) relayout으로 1차 보정, 그래도 어긋나면 재생성
var _boardCreateDpr=0;
function _boardEnsureSize(){
  var el=document.getElementById('boardMap');
  if(!el||!_boardMap)return;
  var vb=document.getElementById('v-board');
  if(!vb||!vb.classList.contains('on'))return;
  var w=el.clientWidth||0;
  var dpr=window.devicePixelRatio||1;
  if((w&&Math.abs(w-_boardCreateW)>4)||(_boardCreateDpr&&Math.abs(dpr-_boardCreateDpr)>0.01)){_createBoardMap(el);return;}
  // 카카오 내부 노드 폭 검증 — 컨테이너와 4px 이상 다르면 미렌더 띠 상태
  try{
    var inner=el.firstElementChild;
    var iw=inner?(inner.clientWidth||0):0;
    if(iw&&w&&Math.abs(iw-w)>4){
      if(el._fixTried){el._fixTried=0;_createBoardMap(el);} // relayout으로도 안 잡히면 재생성(최후)
      else{el._fixTried=1;var c=_boardMap.getCenter();_boardMap.relayout();_boardMap.setCenter(c);}
      return;
    }
    el._fixTried=0;
  }catch(e){}
}
// 모니터 배율·브라우저 확대(Ctrl +/-) 변경 감지 (변경 때마다 리스너 재장전)
function _armDprWatch(){
  try{
    if(window._dprWatchOff)window._dprWatchOff();
    var mql=matchMedia('(resolution: '+(window.devicePixelRatio||1)+'dppx)');
    var h=function(){setTimeout(function(){_onDprChanged();_armDprWatch();},150);};
    if(mql.addEventListener)mql.addEventListener('change',h);else if(mql.addListener)mql.addListener(h);
    window._dprWatchOff=function(){try{if(mql.removeEventListener)mql.removeEventListener('change',h);else if(mql.removeListener)mql.removeListener(h);}catch(e){}};
  }catch(e){}
}
// 배율 변경 대응 — 카카오 SDK는 로드 시점 배율로만 타일을 그려서(세로선 원인) 배율이 달라지면 새로고침이 유일한 해결.
// 상황판이 열려 있으면 자동 새로고침 후 상황판 자동 복귀(모니터 무인 거치 대응), 그 외 화면에선 안내만(작성 중 데이터 보호).
function _onDprChanged(){
  var d=window.devicePixelRatio||1;
  if(Math.abs(d-(window._dprAtSdkLoad||d))<0.01){try{_boardEnsureSize();}catch(e){}return;} // 로드 배율로 복귀 → 정상
  var vb=document.getElementById('v-board');
  if(vb&&vb.classList.contains('on')){
    try{sessionStorage.setItem('_reopenBoard','1');}catch(e){}
    try{toast('🖥 화면 배율 변경 감지 — 지도를 새로 불러옵니다');}catch(e){}
    setTimeout(function(){location.reload();},700);
  }else{
    try{toast('🔎 화면 배율이 바뀌었습니다 — 지도에 세로선이 보이면 새로고침(F5) 하세요',6000);}catch(e){}
  }
}
// 배율 변경으로 자동 새로고침된 경우 상황판 자동 복귀
try{
  if(sessionStorage.getItem('_reopenBoard')){
    sessionStorage.removeItem('_reopenBoard');
    var _rbT=setInterval(function(){
      if(window._KR&&typeof openBoard==='function'&&document.readyState==='complete'){clearInterval(_rbT);try{openBoard();}catch(e){}}
    },400);
    setTimeout(function(){clearInterval(_rbT);},15000);
  }
}catch(e){}
// 컨테이너가 전체화면 최종 너비에 도달하고 '안정'될 때까지 기다렸다 지도 생성
// (예전엔 300px만 넘으면 바로 생성 → 열림 전환 중 좁은 폭으로 만들어져 오른쪽 띠 발생)
function _boardMapWhenReady(tries,lastW,stable){
  var el=document.getElementById('boardMap');
  if(!el||!window._KR)return;
  var w=el.clientWidth||0;
  stable=(w>=300&&w===lastW)?(stable||0)+1:0;
  if(stable>=2||(tries||0)>=30){_initBoardMap();}
  else requestAnimationFrame(function(){_boardMapWhenReady((tries||0)+1,w,stable);});
}
function toggleBoardMapType(){
  _boardMapType=_boardMapType==='hybrid'?'roadmap':'hybrid';
  try{localStorage.setItem('_boardMapType',_boardMapType);}catch(e){}
  if(_boardMap){try{_boardMap.setMapTypeId(_boardMapType==='hybrid'?kakao.maps.MapTypeId.HYBRID:kakao.maps.MapTypeId.ROADMAP);_boardMap.relayout();}catch(e){}}
  var b=document.getElementById('boardMapTypeBtn');if(b)b.textContent=_boardMapType==='hybrid'?'🛰 위성':'🗺 일반';
  toast(_boardMapType==='hybrid'?'🛰 위성':'🗺 일반');
}
function _initBoardMap(){
  const el=document.getElementById('boardMap');
  if(!el||!window._KR)return;
  _createBoardMap(el); // 열 때마다 현재 크기로 새로 생성
  _armDprWatch(); // 모니터 배율·브라우저 확대 변경 즉시 감지
  var b=document.getElementById('boardMapTypeBtn');if(b)b.textContent=_boardMapType==='hybrid'?'🛰 위성':'🗺 일반';
  // 컨테이너 크기가 바뀌면(전체화면 확정·모니터 회전 등) 그 즉시 감지 → 너비가 달라졌으면 새로 생성
  if(window.ResizeObserver&&!el._ro){
    el._ro=new ResizeObserver(function(){
      if(!_boardMap||!document.getElementById('v-board').classList.contains('on'))return;
      var w=el.clientWidth||0;
      if(Math.abs(w-_boardCreateW)>4){
        clearTimeout(el._roT);
        el._roT=setTimeout(function(){if(document.getElementById('v-board').classList.contains('on'))_createBoardMap(el);},140);
      }else{try{_boardMap.relayout();}catch(e){}}
    });
    el._ro.observe(el);
  }
  // 브라우저 배율(Ctrl +/-)·창 크기 변경은 window resize로도 확실히 감지 (배율 변경은 RO가 안 잡히는 경우 대비)
  if(!_boardResizeBound){
    _boardResizeBound=true;
    window.addEventListener('resize',function(){clearTimeout(window._bdRsT);window._bdRsT=setTimeout(_boardEnsureSize,180);});
  }
  // ResizeObserver 미지원 브라우저 대비: 여러 시점에 크기 검사 후 필요 시 재생성
  [200,600,1200].forEach(function(ms){setTimeout(function(){
    if(!_boardMap||!document.getElementById('v-board').classList.contains('on'))return;
    var w=el.clientWidth||0;
    if(Math.abs(w-_boardCreateW)>4)_createBoardMap(el);else{try{_boardMap.relayout();}catch(e){}}
  },ms);});
}
function _renderBoardPins(fit){
  if(!_boardMap)return;
  // 데이터가 그대로면 다시 그리지 않음 — 10초 갱신마다 핀을 지웠다 다시 그려 깜빡이던 원인
  let _sig='';
  try{
    const _og=(DB.g('rescues')||[]).filter(r=>r.status==='ongoing').map(r=>r.id+':'+r.lat+','+r.lng+','+(r.status||''));
    const _hz=((typeof _HAZ_OFF!=='undefined'&&_HAZ_OFF)?[]:(DB.g('hazards')||[]).filter(h=>!h.hazStatus||h.hazStatus==='미조치'||h.hazStatus==='조치중')).map(h=>h.id+':'+h.lat+','+h.lng);
    const _ss=((typeof _sosPings!=='undefined'&&_sosPings)||[]).map(p=>p.id+':'+p.lat+','+p.lng);
    _sig=_og.join('|')+'#'+_hz.join('|')+'#'+_ss.join('|');
  }catch(e){_sig='err'+Date.now();}
  if(!fit&&_sig===window._boardPinSig)return;
  window._boardPinSig=_sig;
  _boardOvs.forEach(o=>{try{o.setMap(null);}catch(e){}});_boardOvs=[];
  const bounds=new kakao.maps.LatLngBounds();let n=0;
  (DB.g('rescues')||[]).filter(r=>r.status==='ongoing'&&r.lat&&r.lng).forEach(r=>{
    const ti=RES_TYPES[r.type]||RES_TYPES['기타'];
    const el=document.createElement('div');
    el.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
      <div style="background:#c0392b;border:2px solid #fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 2px 8px rgba(0,0,0,.6);animation:blink 1.2s infinite;">${ti.ico}</div>
      <div style="margin-top:3px;background:rgba(10,22,38,.92);border:1px solid rgba(192,57,43,.5);color:#eaecef;border-radius:8px;padding:2px 8px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 1px 5px rgba(0,0,0,.5);">${_esc(r.title)}</div></div>`;
    el.onclick=()=>_boardFocus(r.id);
    const pos=new kakao.maps.LatLng(r.lat,r.lng);
    const ov=new kakao.maps.CustomOverlay({position:pos,content:el,yAnchor:1,zIndex:5,clickable:true});
    ov.setMap(_boardMap);_boardOvs.push(ov);bounds.extend(pos);n++;
  });
  ((typeof _HAZ_OFF!=='undefined'&&_HAZ_OFF)?[]:(DB.g('hazards')||[])).filter(h=>h.lat&&h.lng&&(!h.hazStatus||h.hazStatus==='미조치'||h.hazStatus==='조치중')).forEach(h=>{
    const el=document.createElement('div');
    el.innerHTML=`<div style="background:#e67e22;border:2px solid #fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,.6);">⚠️</div>`;
    const pos=new kakao.maps.LatLng(h.lat,h.lng);
    const ov=new kakao.maps.CustomOverlay({position:pos,content:el,yAnchor:1,zIndex:4});
    ov.setMap(_boardMap);_boardOvs.push(ov);bounds.extend(pos);n++;
  });
  // 🆘 조난·사고자 위치 (실시간) — 가장 눈에 띄게
  (_sosPings||[]).forEach(p=>{
    if(!p.lat||!p.lng)return;
    const el=document.createElement('div');
    el.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
      <div style="background:#c0392b;border:2.5px solid #ffe14d;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 0 3px rgba(231,76,60,.4),0 2px 8px rgba(0,0,0,.6);animation:blink 1s infinite;">🆘</div>
      <div style="margin-top:3px;background:rgba(10,22,38,.92);border:1.5px solid #ffe14d;color:#fff;border-radius:8px;padding:2px 8px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 1px 5px rgba(0,0,0,.5);">🆘 ${_esc(p.name||'조난·사고자')}</div></div>`;
    el.onclick=()=>{try{_boardMap.setCenter(new kakao.maps.LatLng(p.lat,p.lng));_boardMap.setLevel(4);}catch(e){}};
    const pos=new kakao.maps.LatLng(p.lat,p.lng);
    const ov=new kakao.maps.CustomOverlay({position:pos,content:el,yAnchor:1,zIndex:9,clickable:true});
    ov.setMap(_boardMap);_boardOvs.push(ov);bounds.extend(pos);n++;
  });
  // 다목적위치표지판 핀 (번호 표시, 작은 레이블)
  (DB.g('facilities')||[]).filter(f=>f.type&&f.type.includes('다목적위치표지판')&&f.lat&&f.lng).forEach(f=>{
    const _fnm=String(f.name||'');const code=(_fnm.match(/\d[\d\-]*\d|\d/)||[_fnm.slice(0,6)])[0];
    const el=document.createElement('div');
    el.innerHTML=`<div style="background:rgba(10,30,55,.85);border:1px solid rgba(255,255,255,.6);color:#aab4c0;border-radius:5px;padding:1px 5px;font-size:9px;font-weight:700;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.5);cursor:default;">${_esc(code)}</div>`;
    const pos=new kakao.maps.LatLng(f.lat,f.lng);
    const ov=new kakao.maps.CustomOverlay({position:pos,content:el,yAnchor:1,zIndex:2});
    ov.setMap(_boardMap);_boardOvs.push(ov);
  });
  // fit=true(최초 열 때)만 지도 범위 자동맞춤. 자동갱신 시엔 사용자가 보고있는 위치·줌 유지(깜빡임·이동 방지)
  if(fit){
    if(n>1){try{_boardMap.setBounds(bounds,60,60,60,60);}catch(e){}}
    else if(n===1){try{_boardMap.setCenter(bounds.getSouthWest());_boardMap.setLevel(6);}catch(e){}}
  }
}
// 상황판 카드/핀 클릭 → 해당 구조로 지도 이동
function _boardFocus(id){
  const r=(DB.g('rescues')||[]).find(x=>x.id===id);
  if(!r||!_boardMap||!r.lat||!r.lng)return;
  try{_boardMap.setCenter(new kakao.maps.LatLng(r.lat,r.lng));_boardMap.setLevel(5);}catch(e){}
}
// 상황판 위험상황 카드/핀 클릭 → 해당 위험상황으로 지도 이동
function _boardFocusHaz(id){
  const h=(DB.g('hazards')||[]).find(x=>x.id===id);
  if(!h||!_boardMap||!h.lat||!h.lng){toast('⚠️ 좌표 없음');return;}
  try{_boardMap.setCenter(new kakao.maps.LatLng(h.lat,h.lng));_boardMap.setLevel(5);}catch(e){}
}
// 상황판 상단 토글: 'rescue'=진행중 구조 카드 / 'hazard'=미조치 위험상황 카드
let _boardView='rescue';
function setBoardView(v){_boardView=v;renderBoard();}
// 상황판 우측: 타임라인/보고서 상세를 사이드 패널에 표시 (컴퓨터 화면 유지)
let _boardDetailId=null;
function _boardOpenDetail(id,mode){
  const r=(DB.g('rescues')||[]).find(x=>x.id===id);
  if(!r)return;
  _boardDetailId=id;
  document.getElementById('boardBody').style.display='none';
  const det=document.getElementById('boardDetail');
  det.style.display='flex';
  // 상세 컨텐츠 영역을 맨 위로 스크롤
  const dc=document.getElementById('boardDetailContent');if(dc)dc.scrollTop=0;
  // repContent를 비워 id 충돌 방지
  const rc=document.getElementById('repContent');if(rc)rc.innerHTML='';
  _boardFocus(id);
  renderTimeline(r,mode,'boardDetailContent');
  // 상황판 푸터: 모달이 상황판에 가리므로 종료 버튼만 노출 (상세 편집은 앱에서)
  const ft=document.getElementById('boardDetailFooter');
  if(ft){
    if(r.status==='ongoing'){
      ft.innerHTML=`<button class="btn-submit" style="width:100%;background:#0d5040;color:#fff;" onclick="selResId=${r.id};curResId=${r.id};endSit();">✅ 상황 종료</button>`;
    }else{
      ft.innerHTML='<div style="text-align:center;font-size:12px;color:#27ae60;padding:6px;">✅ 상황 종료됨</div>';
    }
  }
}
function _boardCloseDetail(){
  _boardDetailId=null;
  const det=document.getElementById('boardDetail');
  if(det)det.style.display='none';
  const c=document.getElementById('boardDetailContent');if(c)c.innerHTML='';
  const f=document.getElementById('boardDetailFooter');if(f)f.innerHTML='';
  const bb=document.getElementById('boardBody');if(bb)bb.style.display='';
  renderBoard();
}
// 구조 위치 라벨: 장소명 > 가장 가까운 표지판 > 좌표 > 미상
function _resLocLabel(r){
  if(r.location&&r.location.trim())return _esc(r.location.trim());
  if(r.lat&&r.lng){
    try{const s=_nearestSign(r.lat,r.lng);if(s)return _esc(s);}catch(e){}
    return (+r.lat).toFixed(4)+', '+(+r.lng).toFixed(4);
  }
  return '위치 미상';
}
function renderBoard(){
  const clock=document.getElementById('boardClock');
  if(clock){const d=new Date();clock.textContent=pad(d.getHours())+':'+pad(d.getMinutes());}
  const body=document.getElementById('boardBody');if(!body)return;
  const res=DB.g('rescues')||[];
  const ongoing=res.filter(r=>r.status==='ongoing');
  const haz=(typeof _HAZ_OFF!=='undefined'&&_HAZ_OFF)?[]:(DB.g('hazards')||[]).filter(h=>!h.hazStatus||h.hazStatus==='미조치'||h.hazStatus==='조치중');
  const hazUnhandled=haz.filter(h=>!h.hazStatus||h.hazStatus==='미조치').length; // 손도 안 댄 미조치 — 강조 대상
  const _td=today();
  const todayList=res.filter(r=>(r.date||'').slice(0,10)===_td).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const recentList=res.filter(r=>(r.date||'').slice(0,10)!==_td).sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,15);
  const aops=DB.g('alertOps')||[];
  const activeOp=aops.find(o=>!o.closedAt);
  const opRespCnt=activeOp?(activeOp.responders||[]).length:0;
  // 응소는 호우·대설 특보에서만 집계·표시 (그 외 특보는 발효 특보 수 표시)
  const opMt=activeOp&&typeof _alertMeasureType==='function'?_alertMeasureType(activeOp):'';
  const opAlertCnt=activeOp?_opAlerts(activeOp).length:0;
  const ts=DB.g('trailStatus')||{};
  const trailCtrlCnt=Object.values(ts).filter(v=>v.status==='통제').length;
  const trailWarnCnt=Object.values(ts).filter(v=>v.status==='주의').length;
  const trailActive=_boardView==='trail';
  const rescueActive=_boardView==='rescue', hazActive=_boardView==='hazard', alertActive=_boardView==='alert';
  // 시설물 점검 — 종결 안 된 점검 이슈
  const facOpen=(DB.g('facIssues')||[]).filter(x=>x.status!=='closed');
  const facActive=_boardView==='fac';
  let html='';
  // 요약 스트립 (클릭 시 하단 카드 영역 전환)
  html+=`<div style="display:flex;gap:10px;margin-bottom:16px;">
    <div onclick="setBoardView('rescue')" class="bd-stat" style="flex:1;min-width:0;background:${ongoing.length?'rgba(192,57,43,.12)':'rgba(39,174,96,.08)'};border:1px solid ${rescueActive?(ongoing.length?'rgba(192,57,43,.9)':'rgba(39,174,96,.75)'):(ongoing.length?'rgba(192,57,43,.4)':'rgba(39,174,96,.25)')};border-radius:12px;padding:12px 16px;text-align:center;cursor:pointer;transition:all .15s;${rescueActive?'box-shadow:inset 0 0 0 2px rgba(192,57,43,.3);':''}">
      <div class="bd-num" style="font-size:30px;font-weight:900;color:${ongoing.length?'#e05050':'#27ae60'};">${ongoing.length}</div>
      <div class="bd-lbl" style="font-size:12px;color:${rescueActive?'#eaecef':'rgba(255,255,255,.5)'};font-weight:${rescueActive?'700':'400'};">🚨 진행중 구조${rescueActive?' ▾':''}</div>
    </div>
    ${(typeof _HAZ_OFF!=='undefined'&&_HAZ_OFF)?'':`<div onclick="setBoardView('hazard')" class="bd-stat" style="position:relative;flex:1;min-width:0;background:${hazUnhandled?'rgba(231,76,60,.12)':'rgba(230,126,34,.08)'};border:1px solid ${hazActive?(hazUnhandled?'rgba(231,76,60,.9)':'rgba(230,126,34,.9)'):(hazUnhandled?'rgba(231,76,60,.5)':'rgba(230,126,34,.25)')};border-radius:12px;padding:12px 16px;text-align:center;cursor:pointer;transition:all .15s;${hazActive?'box-shadow:inset 0 0 0 2px rgba(230,126,34,.3);':''}">
      ${hazUnhandled?`<span style="position:absolute;top:6px;right:6px;background:#e74c3c;color:#fff;font-size:10px;font-weight:800;border-radius:10px;padding:1px 7px;box-shadow:0 0 0 2px rgba(231,76,60,.25);animation:blink 1.2s infinite;">미조치 ${hazUnhandled}</span>`:''}
      <div class="bd-num" style="font-size:30px;font-weight:900;color:${hazUnhandled?'#e05050':'#e67e22'};">${haz.length}</div>
      <div class="bd-lbl" style="font-size:12px;color:${hazActive?'#eaecef':'rgba(255,255,255,.5)'};font-weight:${hazActive?'700':'400'};">⚠️ 미조치 위험상황${hazActive?' ▾':''}</div>
    </div>`}
    <div onclick="setBoardView('alert')" class="bd-stat" style="flex:1;min-width:0;background:${activeOp?'rgba(255,255,255,.12)':'rgba(39,174,96,.08)'};border:1px solid ${alertActive?(activeOp?'rgba(255,255,255,.9)':'rgba(39,174,96,.75)'):(activeOp?'rgba(255,255,255,.45)':'rgba(39,174,96,.25)')};border-radius:12px;padding:12px 16px;text-align:center;cursor:pointer;transition:all .15s;${alertActive?'box-shadow:inset 0 0 0 2px rgba(255,255,255,.3);':''}">
      <div class="bd-num" style="font-size:30px;font-weight:900;color:${activeOp?'#3182f6':'#27ae60'};">${activeOp?(opMt?opRespCnt:opAlertCnt):0}</div>
      <div class="bd-lbl" style="font-size:12px;color:${alertActive?'#eaecef':'rgba(255,255,255,.5)'};font-weight:${alertActive?'700':'400'};">🌀 ${activeOp?(opMt?'특보 응소':'발효 특보'):'특보운영'}${alertActive?' ▾':''}</div>
    </div>
    <div onclick="setBoardView('fac')" class="bd-stat" style="flex:1;min-width:0;background:${facOpen.length?'rgba(230,126,34,.1)':'rgba(39,174,96,.08)'};border:1px solid ${facActive?(facOpen.length?'rgba(230,126,34,.9)':'rgba(39,174,96,.75)'):(facOpen.length?'rgba(230,126,34,.35)':'rgba(39,174,96,.25)')};border-radius:12px;padding:12px 16px;text-align:center;cursor:pointer;transition:all .15s;${facActive?'box-shadow:inset 0 0 0 2px rgba(230,126,34,.3);':''}">
      <div class="bd-num" style="font-size:30px;font-weight:900;color:${facOpen.length?'#e67e22':'#27ae60'};">${facOpen.length}</div>
      <div class="bd-lbl" style="font-size:12px;color:${facActive?'#eaecef':'rgba(255,255,255,.5)'};font-weight:${facActive?'700':'400'};">🔧 시설물 점검${facActive?' ▾':''}</div>
    </div>
  </div>
  ${trailCtrlCnt||trailWarnCnt?`<div onclick="setBoardView('trail')" style="display:flex;align-items:center;gap:12px;background:rgba(231,76,60,.1);border:1px solid ${trailActive?'rgba(231,76,60,.85)':'rgba(231,76,60,.35)'};border-radius:12px;padding:10px 16px;margin-bottom:10px;cursor:pointer;">
    <div style="font-size:26px;font-weight:900;color:#e74c3c;">${trailCtrlCnt}</div>
    <div>
      <div style="font-size:13px;font-weight:800;color:#eaecef;">🚧 탐방로 통제 중${trailActive?' ▾':''}</div>
      <div style="font-size:11px;color:#ff9e80;margin-top:2px;">통제 ${trailCtrlCnt}구간${trailWarnCnt?' · 주의 '+trailWarnCnt+'구간':''}</div>
    </div>
  </div>`:''}`;
  if(trailActive){
    const zones=[...new Set(SEORAK_TRAILS.map(t=>t.zone))];
    html+=`<div style="background:#131316;border:1.5px solid rgba(231,76,60,.4);border-radius:14px;padding:16px 18px;">
      <div style="font-size:16px;font-weight:900;color:#e74c3c;margin-bottom:12px;">🚧 탐방로 통제 현황</div>`;
    zones.forEach(z=>{
      const zTrails=SEORAK_TRAILS.filter(t=>t.zone===z);
      html+=`<div style="font-size:10px;color:#6b7684;font-weight:800;letter-spacing:.5px;margin:8px 0 4px;">${z.toUpperCase()}</div>`;
      zTrails.forEach(t=>{
        const st=(ts[t.id]||{}).status||'개방';
        const col=TRAIL_STATUS_COLORS[st]||'#27ae60';
        html+=`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-top:1px solid rgba(255,255,255,.04);">
          <span style="width:8px;height:8px;border-radius:50%;background:${col};flex-shrink:0;box-shadow:0 0 6px ${col}66;"></span>
          <span style="font-size:12px;color:${st==='개방'?'rgba(255,255,255,.55)':'#eaecef'};flex:1;">${_esc(t.name)}</span>
          <span style="font-size:11px;font-weight:800;color:${col};">${st}</span>
        </div>`;
      });
    });
    html+=`</div>`;
  } else if(alertActive){
    if(!activeOp){
      html+=`<div style="text-align:center;padding:50px 0 30px;font-size:17px;color:rgba(255,255,255,.3);">✅ 진행중인 특보운영 없음</div>`;
    } else {
      const al=_opAlerts(activeOp);
      const chips=al.map(a=>`<span style="display:inline-block;font-size:13px;font-weight:800;color:#aab4c0;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);border-radius:7px;padding:4px 10px;margin:0 5px 5px 0;">${_esc(a.type)} ${_stageShort(a.stage)}</span>`).join('');
      const elp=_elapsedStr(activeOp.startedAt);
      const resps=activeOp.responders||[];
      const groupRows=ALERT_GROUPS.map(g=>{
        const locs=g.stations.map(s=>s.loc);
        const list=resps.filter(r=>locs.includes(r.loc||'사무소'));
        return {name:g.name,ico:g.ico,cnt:list.length,names:list.map(r=>_esc(r.name)).join(', ')};
      });
      const reps=(activeOp.reports||[]).slice().sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,6);
      html+=`<div style="background:#131316;border:1.5px solid rgba(255,255,255,.4);border-radius:14px;padding:16px 18px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:11px;">
          <span style="font-size:18px;font-weight:900;color:#aab4c0;"><span class="ao-pulse" style="display:inline-block;vertical-align:middle;margin-right:5px;"></span>특보운영 중</span>
          ${elp?`<span class="js-elapsed" data-d="${_esc(activeOp.startedAt)}" style="font-size:15px;font-weight:800;color:#f0a500;font-family:monospace;">⏱ ${elp}</span>`:''}
        </div>
        <div style="margin-bottom:13px;">${chips||'<span style="font-size:12px;color:#565f6b;">발령된 특보 없음</span>'}</div>
        ${opMt?`<div style="font-size:13px;color:#a5abb3;font-weight:700;margin-bottom:4px;">👤 분소별 응소 (총 ${resps.length}명)</div>
        ${groupRows.map(gr=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid rgba(255,255,255,.05);">
          <span style="font-size:13px;font-weight:700;color:#d5d8dc;min-width:118px;flex-shrink:0;">${gr.ico} ${_esc(gr.name)}</span>
          <span style="font-size:14px;font-weight:800;color:${gr.cnt?'#5dbf8a':'rgba(255,255,255,.22)'};min-width:42px;flex-shrink:0;">${gr.cnt}명</span>
          <span style="font-size:12px;color:#8b95a1;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${gr.names||'-'}</span>
        </div>`).join('')}`:''}
        ${(()=>{
          // 체류인원 요약 — 대피소(shelter) 위치만 집계
          const shelterLocs=new Set(ALERT_STATIONS.filter(s=>s.shelter).map(s=>s.loc));
          const occMap={};(activeOp.occupancy||[]).filter(o=>shelterLocs.has(o.loc||'')).forEach(o=>{const k=o.loc;if(!occMap[k]||(o.at||0)>(occMap[k].at||0))occMap[k]=o;});
          const occEntries=Object.entries(occMap);
          if(!occEntries.length)return'';
          const totalV=occEntries.reduce((s,[,o])=>s+(o.visitors||0),0);
          return`<div style="font-size:13px;color:#a5abb3;font-weight:700;margin:13px 0 4px;">⛺ 대피소 체류인원 (탐방객 총 ${totalV}명)</div>
          ${occEntries.map(([loc,o])=>`<div style="display:flex;gap:8px;font-size:12px;padding:4px 0;border-top:1px solid rgba(255,255,255,.04);">
            <span style="color:#6b7684;min-width:100px;flex-shrink:0;">${_esc(_stationLabel(loc))}</span>
            <span style="color:#7ec8a0;font-weight:700;">직원 ${o.staff??'-'}명</span>
            <span style="color:#a8cdf5;font-weight:700;">탐방객 ${o.visitors??'-'}명</span>
            <span style="color:#565f6b;font-size:10px;">${(o.time||'').slice(11,16)}</span>
          </div>`).join('')}`;
        })()}
        ${reps.length?`<div style="font-size:13px;color:#a5abb3;font-weight:700;margin:13px 0 4px;">📊 최근 관측 (누적)</div>
          ${reps.map(r=>`<div style="display:flex;gap:10px;font-size:12px;padding:4px 0;border-top:1px solid rgba(255,255,255,.04);">
            <span style="color:#6b7684;min-width:96px;flex-shrink:0;">${_esc(_stationLabel(r.loc))}</span>
            <span style="color:#8b95a1;min-width:46px;flex-shrink:0;">${_esc((r.time||'').slice(11,16))}</span>
            <span style="color:#d5d8dc;font-weight:700;">${r.snow!=null&&r.snow!==''?'❄️ '+_esc(r.snow)+'cm  ':''}${r.rain!=null&&r.rain!==''?'🌧️ '+_esc(r.rain)+'mm':''}</span>
          </div>`).join('')}`:''}
        ${(()=>{
          // 탐방로 통제 현황 요약
          const ts=DB.g('trailStatus')||{};
          const ctrl=SEORAK_TRAILS.filter(t=>(ts[t.id]||{}).status==='통제');
          const warn=SEORAK_TRAILS.filter(t=>(ts[t.id]||{}).status==='주의');
          if(!ctrl.length&&!warn.length)return'';
          return`<div style="font-size:13px;color:#e67e22;font-weight:700;margin:13px 0 4px;">🚧 탐방로 통제 ${ctrl.length}구간${warn.length?' · 주의 '+warn.length+'구간':''}</div>
          ${ctrl.map(t=>`<div style="font-size:11px;color:#ff9e80;padding:2px 0;">🔴 통제 — ${_esc(t.name)}</div>`).join('')}
          ${warn.map(t=>`<div style="font-size:11px;color:#ffa040;padding:2px 0;">🟠 주의 — ${_esc(t.name)}</div>`).join('')}`;
        })()}
        <button onclick="closeBoard();openApp('alert');" style="width:100%;margin-top:13px;padding:9px;border-radius:9px;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.1);color:#3182f6;font-size:13px;font-weight:700;cursor:pointer;">🌀 특보운영 상세 열기</button>
      </div>`;
    }
  } else if(facActive){
    if(!facOpen.length){
      html+=`<div style="text-align:center;padding:50px 0 30px;font-size:17px;color:rgba(255,255,255,.3);">✅ 진행중인 시설물 점검 없음</div>`;
    } else {
      const facsAll=DB.g('facilities')||[];
      const rows=facOpen.slice().sort((a,b)=>(Number(b.stage||1)-Number(a.stage||1))||((b.createdAt||0)-(a.createdAt||0)));
      html+=`<div style="background:#131316;border:1.5px solid rgba(230,126,34,.4);border-radius:14px;padding:16px 18px;">
        <div style="font-size:16px;font-weight:900;color:#e67e22;margin-bottom:10px;">🔧 시설물 점검 진행 현황 <span style="font-size:12px;color:#8b95a1;font-weight:600;">${facOpen.length}건</span></div>`;
      rows.forEach(it=>{
        const f=facsAll.find(x=>String(x.id)===String(it.facId))||{};
        const st=(typeof FAC_ISTAGE!=='undefined'&&FAC_ISTAGE[Number(it.stage||1)])||{l:'접수',ico:'📥',c:'#3182f6',who:''};
        const gc=(typeof _gColor==='function')?_gColor(it.grade):'#8b95a1';
        html+=`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid rgba(255,255,255,.05);">
          <span style="flex-shrink:0;font-size:11px;font-weight:800;color:#08121e;background:${st.c};border-radius:6px;padding:3px 8px;">${st.ico} ${_esc(st.l)}</span>
          <span style="flex:1;min-width:0;">
            <span style="display:block;font-size:13px;font-weight:800;color:#eaecef;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_esc(f.name||it.facName||'시설물')} ${it.grade?`<b style="color:${gc};font-size:11.5px;">${_esc(it.grade)}등급</b>`:''}</span>
            <span style="display:block;font-size:11px;color:#8b95a1;margin-top:1px;">${_esc(st.who||'')}${it.createdAt?' · '+(typeof _fmtWhen==='function'?_fmtWhen(it.createdAt):''):''}</span>
          </span>
        </div>`;
      });
      html+=`</div>`;
    }
  } else if(hazActive){
    if(!haz.length){
      html+=`<div style="text-align:center;padding:50px 0 30px;font-size:17px;color:rgba(255,255,255,.3);">✅ 미조치 위험상황 없음</div>`;
    }
    haz.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).forEach(h=>{
      const hasCoord=!!(h.lat&&h.lng);
      html+=`<div onclick="_boardFocusHaz(${h.id})" style="background:#131316;border:1.5px solid rgba(230,126,34,.35);border-radius:14px;padding:13px 16px;margin-bottom:10px;cursor:pointer;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="font-size:16px;font-weight:800;color:#eaecef;">${h.hazType?.split(' ')[0]||'⚠️'} ${_esc((h.hazType||'위험상황').replace(/^\S+\s/,''))||'위험상황'}</div>
          <span style="flex-shrink:0;font-size:11px;font-weight:800;color:#e67e22;background:rgba(230,126,34,.14);border-radius:6px;padding:3px 8px;">${_esc(h.hazStatus||'미조치')}</span>
        </div>
        <div style="font-size:13px;color:#7aa8c8;margin-top:5px;">📍 ${_esc(h.loc||'위치 미상')}${h.danger?' · '+_esc(h.danger):''}${h.date?' · '+h.date:''}</div>
        ${h.desc?`<div style="font-size:12px;color:#8b95a1;margin-top:6px;line-height:1.5;">${_esc((h.desc||'').slice(0,80))}${(h.desc||'').length>80?'…':''}</div>`:''}
        ${!hasCoord?`<div style="font-size:11px;color:rgba(255,255,255,.3);margin-top:6px;">좌표 없음 — 지도 이동 불가</div>`:''}
      </div>`;
    });
  } else {
  if(!ongoing.length){
    html+=`<div style="text-align:center;padding:50px 0 30px;font-size:17px;color:rgba(255,255,255,.3);">✅ 진행중인 구조 상황 없음</div>`;
  }
  ongoing.forEach(r=>{
    const elp=_elapsedStr(r.date);
    const ti=RES_TYPES[r.type]||RES_TYPES['기타'];
    html+=`<div style="background:#131316;border:1.5px solid rgba(192,57,43,.35);border-radius:14px;padding:14px 16px;margin-bottom:12px;">
      <div onclick="_boardFocus(${r.id})" style="cursor:pointer;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:6px;margin-bottom:4px;">
          <div style="font-size:18px;font-weight:800;color:#eaecef;">${ti.ico} ${_esc(r.title)}</div>
          ${elp?`<div class="js-elapsed" data-d="${_esc(r.date)}" style="font-size:16px;font-weight:800;color:#f0a500;font-family:monospace;">⏱ ${elp}</div>`:''}
        </div>
        <div style="font-size:13px;color:#7aa8c8;margin-bottom:12px;">${_esc(r.type)} · ${_esc(_resLocLabel(r))} · ${r.date}</div>
        ${(r.teams&&r.teams.length)?r.teams.map((t,ti2)=>{
          const col=TEAM_COLORS[ti2%TEAM_COLORS.length];
          const mem=(t.members&&t.members.length)?(typeof _senJoin==='function'?_senJoin(t.members):t.members.join(', ')):'';
          const cnt=t.memberCount?t.memberCount+'명':(t.members&&t.members.length?_personCount(t.members)+'명':'');
          const arr=t.arrivedAt?String(t.arrivedAt).slice(11,16):'';
          const req=t.requestedAt?String(t.requestedAt).slice(11,16):'';
          return `<div style="display:flex;align-items:center;gap:12px;padding:7px 0;border-top:1px solid rgba(255,255,255,.05);">
            <span style="font-size:14px;font-weight:800;color:${col};flex-shrink:0;min-width:110px;">${_teamIco(t)} ${_esc(typeof _deptShort==='function'?_deptShort(t.name):t.name)}${cnt?` <span style="font-size:11px;color:rgba(255,255,255,.5);">${cnt}</span>`:''}</span>
            <span style="flex:1;font-size:12px;color:rgba(255,255,255,.68);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${mem?'👥 '+_esc(mem):''}</span>
            <span style="font-size:12px;color:#7aa8c8;flex-shrink:0;">${arr?'🏁 도착 '+arr:(req?'🚨 출동 '+req:'')}</span>
          </div>`;
        }).join(''):'<div style="font-size:12px;color:rgba(255,255,255,.3);padding:6px 0;">출동팀 미편성</div>'}
        <div style="display:flex;justify-content:flex-end;margin-top:8px;font-size:12px;color:#7aa8c8;">
          <span>${r.handover&&r.handover.to?`🤝 인계: ${_esc(r.handover.to)}`:''}</span>
        </div>
      </div>
      <div style="display:flex;gap:7px;margin-top:11px;padding-top:10px;border-top:1px solid rgba(255,255,255,.07);">
        <button onclick="_boardOpenDetail(${r.id},'advanced')" style="flex:1;padding:8px 0;border-radius:9px;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.1);color:#3182f6;font-size:12px;font-weight:700;cursor:pointer;">📋 상세 보기 — 보고서·타임라인</button>
      </div>
    </div>`;
  });
  }
  // ── 하단: 사고 목록 (뷰와 무관하게 항상 표시) ──
  const _accRow=r=>{
    const og=r.status==='ongoing';
    const ti=RES_TYPES[r.type]||RES_TYPES['기타'];
    const dd=(r.date||'').slice(5,10), tm=(r.date||'').slice(11,16);
    return `<div onclick="_boardOpenDetail(${r.id},'${og?'advanced':'write'}')" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(255,255,255,.02);border-radius:8px;margin-bottom:4px;font-size:12px;cursor:pointer;border-left:3px solid ${og?'#e05050':'#27ae60'};">
      <span style="flex-shrink:0;font-size:9px;font-weight:800;color:${og?'#e05050':'#27ae60'};background:${og?'rgba(224,80,80,.12)':'rgba(39,174,96,.12)'};border-radius:5px;padding:2px 6px;">${og?'진행중':'종료'}</span>
      <span style="flex:1;color:rgba(255,255,255,.7);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ti.ico} ${_esc(r.title)}</span>
      <span style="flex-shrink:0;color:#6a93b5;font-family:monospace;">${dd} ${tm}</span>
    </div>`;
  };
  if(alertActive){
    // 특보 뷰 하단: 분소별 누적 관측 + 최근 종료된 특보운영
    if(activeOp){
      const cum={};
      (activeOp.reports||[]).forEach(r=>{
        const loc=r.loc||'사무소';if(!cum[loc])cum[loc]={snow:0,rain:0};
        if(r.snow!=null&&r.snow!=='')cum[loc].snow+=parseFloat(r.snow)||0;
        if(r.rain!=null&&r.rain!=='')cum[loc].rain+=parseFloat(r.rain)||0;
      });
      const locs=Object.keys(cum);
      html+=`<div style="margin-top:20px;font-size:12px;color:#8ab0c8;font-weight:700;margin-bottom:6px;">📈 누적 관측 (분소별)</div>`;
      if(!locs.length){
        html+=`<div style="padding:10px 12px;background:rgba(255,255,255,.02);border-radius:8px;font-size:12px;color:rgba(255,255,255,.42);">관측 보고 없음</div>`;
      } else {
        locs.forEach(loc=>{const c=cum[loc];
          html+=`<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(255,255,255,.02);border-radius:8px;margin-bottom:4px;font-size:12px;border-left:3px solid #3182f6;">
            <span style="flex:1;color:rgba(255,255,255,.7);">${_esc(_stationLabel(loc))}</span>
            <span style="color:#d5d8dc;font-weight:700;">${c.snow?'❄️ '+c.snow.toFixed(1)+'cm  ':''}${c.rain?'🌧️ '+c.rain.toFixed(1)+'mm':''}${(!c.snow&&!c.rain)?'-':''}</span>
          </div>`;
        });
      }
    }
    const closedOps=aops.filter(o=>o.closedAt).sort((a,b)=>(b.startedAtMs||0)-(a.startedAtMs||0)).slice(0,6);
    if(closedOps.length){
      html+=`<div style="margin-top:18px;font-size:12px;color:#8ab0c8;font-weight:700;margin-bottom:6px;">📜 최근 종료된 특보운영 <span style="color:#6b7684;font-weight:400;">(${closedOps.length}건)</span></div>`;
      closedOps.forEach(o=>{const al=_opAlerts(o);const lbl=al.map(a=>_esc(a.type)+_stageShort(a.stage)).join(', ')||'특보';
        html+=`<div onclick="openAlertHistory(${o.id})" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(255,255,255,.02);border-radius:8px;margin-bottom:4px;font-size:12px;cursor:pointer;border-left:3px solid #5d82a0;">
          <span style="flex:1;color:rgba(255,255,255,.6);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">🌀 ${lbl}</span>
          <span style="flex-shrink:0;color:#6a93b5;font-family:monospace;">${(o.startedAt||'').slice(5,10)}~${(o.closedAt||'').slice(5,10)}</span>
        </div>`;
      });
    }
  } else if(hazActive){
    // 위험 뷰 하단: 조치완료된 위험상황
    const doneHaz=(DB.g('hazards')||[]).filter(h=>h.hazStatus&&h.hazStatus!=='미조치'&&h.hazStatus!=='조치중').sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,15);
    html+=`<div style="margin-top:20px;font-size:12px;color:rgba(255,255,255,.35);font-weight:700;margin-bottom:6px;">✅ 조치완료 위험상황 <span style="color:rgba(255,255,255,.25);font-weight:400;">(${doneHaz.length}건)</span></div>`;
    if(!doneHaz.length){
      html+=`<div style="padding:10px 12px;background:rgba(255,255,255,.02);border-radius:8px;font-size:12px;color:rgba(255,255,255,.3);">조치완료된 위험상황 없음</div>`;
    } else {
      doneHaz.forEach(h=>{
        html+=`<div onclick="_boardFocusHaz(${h.id})" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(255,255,255,.02);border-radius:8px;margin-bottom:4px;font-size:12px;cursor:pointer;border-left:3px solid #27ae60;">
          <span style="flex-shrink:0;font-size:9px;font-weight:800;color:#27ae60;background:rgba(39,174,96,.12);border-radius:5px;padding:2px 6px;">${_esc(h.hazStatus)}</span>
          <span style="flex:1;color:rgba(255,255,255,.7);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${h.hazType?.split(' ')[0]||'⚠️'} ${_esc((h.hazType||'위험상황').replace(/^\S+\s/,''))||'위험상황'} · ${_esc(h.loc||'위치미상')}</span>
          <span style="flex-shrink:0;color:#6a93b5;font-family:monospace;">${(h.date||'').slice(5,10)}</span>
        </div>`;
      });
    }
  } else {
    // 구조 뷰 하단: 오늘/최근 사고 목록
    html+=`<div style="margin-top:20px;font-size:12px;color:rgba(255,255,255,.35);font-weight:700;margin-bottom:6px;">📋 오늘 사고 목록 <span style="color:rgba(255,255,255,.25);font-weight:400;">(${_td} · ${todayList.length}건)</span></div>`;
    if(!todayList.length){
      html+=`<div style="padding:10px 12px;background:rgba(255,255,255,.02);border-radius:8px;font-size:12px;color:rgba(255,255,255,.3);">오늘 접수된 사고 없음</div>`;
    }else{
      todayList.forEach(r=>{html+=_accRow(r);});
    }
    if(recentList.length){
      html+=`<div style="margin-top:18px;font-size:12px;color:rgba(255,255,255,.35);font-weight:700;margin-bottom:6px;">🕑 최근 사고 목록 <span style="color:rgba(255,255,255,.25);font-weight:400;">(최신순 ${recentList.length}건)</span></div>`;
      recentList.forEach(r=>{html+=_accRow(r);});
    }
  }
  html+=`<div style="text-align:center;margin-top:18px;font-size:10px;color:rgba(255,255,255,.18);">10초마다 자동 갱신 · ${APP_VER}</div>`;
  if(body._lastHtml!==html){body._lastHtml=html;body.innerHTML=html;} // 내용이 그대로면 10초 갱신 때 다시 그리지 않음(깜빡임 방지)
  if(_boardMap)_renderBoardPins();
}

function goHome(){
  const ov=document.getElementById('adminLoginOverlay');
  if(ov)ov.style.display='none';
  try{if(typeof _applyHomeMenuVisibility==='function')_applyHomeMenuVisibility();}catch(e){}
  showV('v-home');
  document.getElementById('appHdr').style.display='none';
  document.getElementById('bnav').style.display='none';
  try{_zoneOverlayCleanup();}catch(e){} // 구역·용도 범례/카드가 홈에 남지 않게
  closeDB();updateSummary();
  history.pushState({view:'home'},'','');
}
function viewOnMap(lat,lng,rid){
  openApp('rescue');
  setTimeout(function(){
    try{
      // 보러 온 사고가 현재 필터(진행중만·유형)에 걸려 핀이 안 뜨면 — 위치만 덩그러니 뜨는 문제 → 필터 자동 완화
      if(rid){
        try{
          const r=(DB.g('rescues')||[]).find(x=>String(x.id)===String(rid));
          if(r){
            const st=r.status==='ongoing'?'진행중':'종료';
            if(resStatusF.size&&!resStatusF.has(st)){resStatusF.add(st);toast('👁 필터를 넓혀 이 사고를 표시합니다 ('+st+' 포함)');}
            if(resTypeF.size&&!resTypeF.has('🚨구조'))resTypeF.add('🚨구조');
            if(typeof _persistFilters==='function')_persistFilters();
          }
        }catch(e){}
      }
      if(mapR){mapR.setCenter(new kakao.maps.LatLng(lat,lng));mapR.setLevel(4);}
      renderRescueMap();
      if(rid)setTimeout(function(){try{openResPopup(rid,'rescue');}catch(e){}},280); // 핀 팝업 자동 오픈 — 위치만 뜨지 않게
      try{var _bn=document.getElementById('bnav');if(_bn)_bn.style.display='flex';}catch(e){} // 하단바 유지
    }catch(e){}
  },200);
}
function openApp(mode){
  try{_applyAppLock();}catch(e){} // 진입 시 잠금 재평가(관리자 로그인·승인 직후 즉시 해제)
  // 지도 생성은 부팅 시 지연됨 → 지도 탭 진입 시 아직 없으면 지금 생성(initMaps는 중복 생성 방지 가드 있음)
  if((mode==='rescue'||mode==='inspect')&&window._KR){try{if(typeof mapI==='undefined'||!mapI||!mapR)initMaps();}catch(e){}}
  if(isExternal()&&['inspect','stats','admin','settings','alert'].includes(mode)){toast('⚠️ 외부기관 계정은 해당 메뉴에 접근할 수 없습니다');return;}
  // 작성 폼에서 다른 메뉴로 이동: 미저장 입력은 임시저장만 남기고 작성모드 해제
  if(window._reportMode==='form'){try{_saveDraftNow();}catch(e){}window._reportMode='';clearInterval(_draftAutoTimer);}
  curApp=mode;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));
  document.getElementById('appHdr').style.display='block';
  const bn=document.getElementById('bnav');
  function setNv(){[1,2,3,4].forEach(i=>{var e=document.getElementById('nv'+i);if(e)e.classList.remove('on');});document.getElementById('nv1').classList.add('on');}
  // 담당 업무함 탭(nv4): 시설물 앱 + 담당자·시설과·개발자만 표시
  try{var _nv4=document.getElementById('nv4');
    if(_nv4)_nv4.style.display=(mode==='inspect'&&typeof _facWorkVisible==='function'&&_facWorkVisible())?'':'none';
    if(mode==='inspect')try{_updateFacWorkBadge();}catch(e){}
  }catch(e){}
  if(mode==='rescue'){
    document.getElementById('topTitle').textContent='재난/구조 관리';
    document.getElementById('nvl2').textContent='목록';
    // 세션 첫 진입: 기본 필터를 '진행중'으로 (현재 사고만 먼저 보여줌 — 이후 🚨구조/진행중 버튼으로 조절)
    if(!window._resStatusDefaulted){window._resStatusDefaulted=true;resStatusF=new Set(['진행중']);_persistFilters();}
    showV('v-rescue-map');bn.style.display='flex';setNv();updateRescueCross();
    history.pushState({view:mode},'','');
    rMaps();setTimeout(()=>{try{renderRescueMap();if(mapR&&!window._mapRInited){window._mapRInited=true;mapR.setCenter(new kakao.maps.LatLng(DC.lat,DC.lng));mapR.setLevel(9);}}catch(e){renderResList();}},200);
  } else if(mode==='inspect'){
    document.getElementById('topTitle').textContent='시설물 점검';
    document.getElementById('nvl2').textContent='목록';
    showV('v-inspect-map');bn.style.display='flex';setNv();updateInspectCross();
    history.pushState({view:mode},'','');
    rMaps();setTimeout(()=>{try{renderInspectMap();if(mapI&&!window._mapIInited){window._mapIInited=true;mapI.setCenter(new kakao.maps.LatLng(DC.lat,DC.lng));mapI.setLevel(9);}}catch(e){renderFacList();}},200);
  } else if(mode==='alert'){
    document.getElementById('topTitle').textContent='특보운영';
    _alertTab=1; // 진입 시 항상 목록 탭부터
    bn.style.display='none';showV('v-alert');history.pushState({view:mode},'','');renderAlertView();
  } else if(mode==='admin'){
    // 관리자 판정은 isAdminUser() 단일 기준(개발자 마스터 OR _acl.admins OR devKakaoId).
    // 강등(_acl)되면 즉시 막히고, 멤버/일반은 권한없음 안내. (옛 소유자 자동승격 제거)
    if(!isAdminUser()){
      _showAdminDenied();
      return;
    }
    document.getElementById('topTitle').textContent='관리자 전용';
    bn.style.display='none';showV('v-admin');history.pushState({view:mode},'','');admTab('ctrl',document.querySelector('.adm-tab'));
  } else if(mode==='settings'){
    document.getElementById('topTitle').textContent='내 설정';
    bn.style.display='none';showV('v-settings');history.pushState({view:mode},'','');_settingsTab='info';document.getElementById('stab-info').classList.add('on');document.getElementById('stab-noti').classList.remove('on');document.getElementById('stab-info-sec').classList.add('on');document.getElementById('stab-noti-sec').classList.remove('on');renderSettings();
  } else if(mode==='stats'){
    document.getElementById('topTitle').textContent='전체 통계';
    bn.style.display='none';showV('v-stats');history.pushState({view:mode},'','');renderFullStats();
  }
}
// 관리자 권한 없음 안내 (비밀번호 로그인창 대신) — 관리자는 _acl 등록/소유자/토큰으로 자동 통과
function _showAdminDenied(){
  const u=DB.g('currentUser')||{};
  let el=document.getElementById('adminDeniedOverlay');
  if(!el){el=document.createElement('div');el.id='adminDeniedOverlay';document.body.appendChild(el);}
  el.style.cssText='position:fixed;inset:0;z-index:10002;background:#0f0f11;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:calc(28px + env(safe-area-inset-top)) 28px calc(28px + env(safe-area-inset-bottom));text-align:center;';
  el.innerHTML='<div style="font-size:46px;">🔒</div>'
    +'<div style="font-size:18px;font-weight:800;color:#eaecef;margin-top:8px;">관리자 권한이 없습니다</div>'
    +'<div style="font-size:13px;color:#8b95a1;line-height:1.9;margin-top:12px;max-width:300px;">이 메뉴는 <b style="color:#a5abb3;">관리자만</b> 접근할 수 있습니다.<br>권한이 필요하면 <b style="color:#a5abb3;">관리자에게 문의</b>해 주세요.</div>'
    +(u.kakaoId?'<div class="sel-ok" style="font-size:11px;color:#565f6b;margin-top:14px;font-family:monospace;background:rgba(255,255,255,.04);border-radius:8px;padding:7px 12px;">내 카카오 ID: <b style="color:#d5d8dc;">'+_esc(String(u.kakaoId))+'</b><br><span style="color:#6b7684;">이 ID를 관리자에게 전달하면 권한을 받을 수 있습니다</span></div>':'')
    +(u.kakaoId?'<button onclick="requestAdminAccess()" style="margin-top:20px;width:100%;max-width:280px;background:rgba(39,174,96,.15);color:#27ae60;border:1px solid rgba(39,174,96,.4);border-radius:11px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;">🔐 관리자에게 권한 요청</button>':'')
    +'<button onclick="(function(){var e=document.getElementById(\'adminDeniedOverlay\');if(e)e.remove();goHome();})()" style="margin-top:10px;width:100%;max-width:280px;background:#1a4a6e;color:#fff;border:none;border-radius:11px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;">홈으로</button>'
    +'<div onclick="(function(){var e=document.getElementById(\'adminDeniedOverlay\');if(e)e.remove();var ov=document.getElementById(\'adminLoginOverlay\');if(ov){ov.style.display=\'flex\';setTimeout(function(){var p=document.getElementById(\'adminLoginPw\');if(p)p.focus();},200);}})()" style="margin-top:18px;font-size:11px;color:#2a4a5a;cursor:pointer;text-decoration:underline;">관리자 인증(비밀번호)</div>';
  el.style.display='flex';
}
function switchTab(idx,el){
  if(isExternal()&&idx!==1){toast('⚠️ 외부기관 계정은 지도만 이용 가능합니다');return;}
  try{if(typeof _hapt==='function')_hapt(6);}catch(e){} // 탭 전환 햅틱 — 앱다운 손맛(미지원 기기는 무시)
  [1,2,3,4].forEach(i=>{var e=document.getElementById('nv'+i);if(e)e.classList.remove('on');});if(el)el.classList.add('on');closeDB();
  // 시설물 지도(구역·용도)를 벗어나면 범례·카드 제거 — 다른 탭에 떠 있지 않게
  if(!(curApp==='inspect'&&idx===1)){try{_zoneOverlayCleanup();}catch(e){}}
  if(curApp==='rescue'){
    if(idx===1){showV('v-rescue-map');rMaps();updateRescueCross();try{renderRescueMap();}catch(e){}} // 복귀 시 핀 최신화
    else{if(idx===2){showV('v-rescue-list');renderResList();}else{showV('v-rescue-stats');renderRescueStats();}}
  } else if(curApp==='inspect'){
    if(idx===1){showV('v-inspect-map');rMaps();updateInspectCross();try{renderInspectMap();}catch(e){}}
    else if(idx===2){showV('v-inspect-list');renderFacList();}
    else if(idx===4){showV('v-inspect-work');try{renderFacWork();}catch(e){}}
    else{showV('v-inspect-stats');renderInspectStats();}
  }
}

// ══════════════════════════════════════════
// 인증 (로그인 / 게스트 / 로그아웃)
// ══════════════════════════════════════════


// 변경이력
const _CL=[
  {ver:'v1.2',date:'2026.05.15',summary:'카카오 로그인·팀기능 개선·타임라인 자동선택 등 6건',items:['카카오 로그인 / 게스트 / 개발자 모드','공단 초동 출동팀 자동체크 (본인 이름)','추가팀 복수 지원 (추가1팀·2팀·3팀)','소방 유관기관 동적 추가 기능','타임라인 누가 항목 자동선택','환동해산악구조대 당직팀 자동계산']},
  {ver:'v1.1',date:'2026.05.10',summary:'타임라인 개편·유관기관 추가·APK 자동화·버그 수정',items:['구조 타임라인 카테고리 정리','유관기관 출동 섹션 추가','APK 빌드 자동화 (GitHub Actions)','무한 로그인 버그 수정']},
  {ver:'v1.0',date:'2026.05.01',summary:'설악산 현장관리 앱 최초 출시',items:['설악산 현장관리 앱 최초 출시','재난/구조 접수 및 보고 기능','시설물 점검 관리','설악위키 기능','카카오 지도 연동']},
];
function openChangelog(){
  const m=document.getElementById('changelogModal');
  if(!m) return;
  document.getElementById('changelogBody').innerHTML=_CL.map((v,i)=>`
    <div style="margin-bottom:5px;border-radius:10px;border:1px solid rgba(255,255,255,.07);overflow:hidden;">
      <div onclick="toggleCL(${i})" style="display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:pointer;background:#0d1f35;user-select:none;">
        <span style="background:#1a4a6e;color:#3182f6;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;flex-shrink:0;">${v.ver}</span>
        <span style="font-size:10px;color:#565f6b;flex-shrink:0;">${v.date}</span>
        <span style="font-size:10px;color:#8b95a1;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v.summary}</span>
        <span id="clArr${i}" style="color:#565f6b;font-size:11px;flex-shrink:0;transition:transform .2s;">▾</span>
      </div>
      <div id="clBody${i}" style="display:none;padding:8px 12px 10px;background:#080f1c;">
        ${v.items.map(it=>`<div style="font-size:11px;color:#c4c8ce;padding:2px 0 2px 4px;">· ${it}</div>`).join('')}
      </div>
    </div>`).join('');
  m.style.display='flex';
}
function toggleCL(i){
  const b=document.getElementById('clBody'+i);
  const a=document.getElementById('clArr'+i);
  if(!b) return;
  const open=b.style.display==='block';
  b.style.display=open?'none':'block';
  if(a) a.style.transform=open?'':'rotate(-180deg)';
}
function closeChangelog(){
  const m=document.getElementById('changelogModal');
  if(m){m.style.display='none';}
}

// 추가팀 복수 지원
let _extraTeams=[]; // [{teamName, members:[]}]
const _ROCK_LOCS=['천화대','흑범길','염라길','석주길','적벽','장군봉','삼형제길','유선대','울산암벽','하나되는길','돌잔치길','나들이길','소토왕골암장','한편의시를위한길','솜다리의추억','경원대길','4인의우정길','별을따는소년들','미륵장군봉','몽유도원도','아갈바위','칠형제봉'];
const _ICE_LOCS=['토왕성폭포','두줄폭포','형제폭포','50m/100m폭포','건폭포','소승폭포','실폭포'];

// ── ZZ-NN 구역 관리 체계 ─────────────────────────────────
// lat/lng: 각 구역 탐방로 중심점 (실측 후 수정 권장)
// ── 표지판 번호(ZZ-NN) 기준 거점 마스터 테이블 ───────────────
// 형식: ZZ → [[max_NN, primary_base, alt_base?], ...]
// nn <= max_NN 인 첫 번째 규칙 적용
const SIGN_BASE_TABLE = {
  '01': [[99, '소공원']],
  '02': [[7,  '소공원'], [99, '백담']],
  '03': [[1,  '소공원'], [4,  '소공원','백담'], [99, '소공원','백담']],
  '04': [[99, '소공원']],
  '05': [[99, '소공원']],
  '06': [[99, '남설악']],
  '07': [[3,  '약수터'], [99, '용소']],
  '08': [[3,  '용소'],   [99, '흘림골']],
  '09': [[99, '한계령']],
  '10': [[99, '백담']],
  '11': [[10, '한계산성'], [99, '남교리']],
  '12': [[8,  '한계산성'], [99, '백담']],
  '13': [[4,  '소공원'],   [99, '백담']],
  '14': [[99, '점봉산']],
};

// 구역 참조명 (표시 보조용 — 라우팅 결정에 사용 안 함)
const ZONE_NAMES = {
  '01':'천불동계곡','02':'천불동~영시암','03':'공룡능선',
  '04':'울산바위','05':'토왕성폭포','06':'오색',
  '07':'주전골','08':'흘림골','09':'한계령 방면',
  '10':'백담계곡','11':'장수대~복숭아탕','12':'서북능선',
  '13':'탑골','14':'점봉산',
};
// 위치필터 칩 라벨: '01 (천불동계곡)'
function _zoneLbl(z){return ZONE_NAMES[z]?z+' ('+ZONE_NAMES[z]+')':z;}
// ── 시설물 위치구간 통일 표기 ─────────────────────────────────────────
// 표지판은 자기 코드(NN-NN)에서, 그 외 시설(교량·데크 등)은 '가장 가까운 표지판'의 존에서 구간을 도출.
// → 백담 교량·데크 등도 자동으로 '10 (백담계곡)'으로 통일. 목록 표시·위치 표시·필터가 같은 기준을 쓴다.
function _facZoneOwn(f){ // 시설 자신에게서 존(2자리) 추출 — 없으면 ''
  const loc=((f&&f.loc)||'').trim();
  let m=loc.match(/^(\d{2})\s*\(/);if(m)return m[1];            // 이미 'NN (구간명)' 형식
  m=(loc+' '+((f&&f.name)||'')).match(/(?:^|\s)(\d{2})-\d+/);if(m)return m[1]; // 'NN-NN' 코드
  m=loc.match(/^(\d{2})$/);if(m)return m[1];                    // 정확히 'NN'
  return '';
}
let _facZoneCache={},_facZoneCacheSig='';
function _facZoneCode(f){
  if(!f)return '';
  const own=_facZoneOwn(f);
  if(own)return own;
  if(f.lat&&f.lng){ // 코드 없는 시설: 좌표로 가장 가까운 표지판의 존(캐시)
    const facs=DB.g('facilities')||[];
    const sig=facs.length+'';
    if(sig!==_facZoneCacheSig){_facZoneCache={};_facZoneCacheSig=sig;}
    if(_facZoneCache[f.id])return _facZoneCache[f.id];
    let best='',bd=1e9;
    facs.forEach(s=>{
      if(!(s.type&&s.type.includes('다목적위치표지판')&&s.lat&&s.lng))return;
      const zc=_facZoneOwn(s);if(!zc)return;
      const d=_haversine(f.lat,f.lng,s.lat,s.lng);
      if(d<bd){bd=d;best=zc;}
    });
    if(best){_facZoneCache[f.id]=best;return best;}
  }
  return '';
}
// ── 트레일(등산로) 순 정렬 — 시설물 상세 ◀▶ 이동용 ─────────────────
// 순서: 구간(01~14) → 표지판 번호(등산로 진행 순) → 부속시설(교량·데크 등)은 가장 가까운 표지판 뒤 거리순.
// 목록의 필터·정렬(이름순·가까운순 등)과 무관하게 상세에서는 항상 '같은 구간을 따라' 옆 시설로 이동.
// 삼거리·구간 경계 시설은 가장 가까운 표지판의 구간 하나에만 속하므로 엉뚱한 구간 점프가 없다.
// (다목적위치표지판 배치는 사실상 고정 → 이 기준은 안정적으로 유지됨)
let _facTrailCache={},_facTrailSig='';
function _facTrailKey(f){
  if(!f)return [99,999,9e9];
  const facs=DB.g('facilities')||[];
  const sig=facs.length+'';
  if(sig!==_facTrailSig){_facTrailCache={};_facTrailSig=sig;}
  if(_facTrailCache[f.id])return _facTrailCache[f.id];
  let z=99,n=999,d=9e9;
  const code=(((f.name||'')+' '+(f.loc||'')).match(/(\d{2})-(\d{2,3})/));
  if(f.type&&f.type.includes('다목적위치표지판')&&code){z=+code[1];n=+code[2];d=0;}
  else if(f.lat&&f.lng){
    let bs=null,bd=1e9;
    facs.forEach(s=>{
      if(!(s.type&&s.type.includes('다목적위치표지판')&&s.lat&&s.lng))return;
      const dd=_haversine(f.lat,f.lng,s.lat,s.lng);
      if(dd<bd){bd=dd;bs=s;}
    });
    if(bs){const m=(((bs.name||'')+' '+(bs.loc||'')).match(/(\d{2})-(\d{2,3})/));if(m){z=+m[1];n=+m[2];d=bd;}}
  }else{
    const zz=_facZoneOwn(f);if(zz)z=+zz;
  }
  const k=[z,n,d];
  _facTrailCache[f.id]=k;return k;
}
function _facTrailSort(arr){
  return (arr||[]).slice().sort((a,b)=>{
    const ka=_facTrailKey(a),kb=_facTrailKey(b);
    return (ka[0]-kb[0])||(ka[1]-kb[1])||(ka[2]-kb[2])||((Number(a.id)||0)-(Number(b.id)||0));
  });
}
// 목록·상세 이름: 표지판은 코드만(예: '01-01'), 그 외는 원래 이름
function _facDispName(f){
  if(f&&f.type&&f.type.includes('다목적위치표지판')){
    const c=(((f.name||'').match(/^\d{2}-\d+/))||((f.loc||'').match(/^\d{2}-\d+/))||[''])[0];
    if(c)return c;
  }
  return f?(f.name||''):'';
}
// 표지판의 상세 지점 설명(코드 뒤 부분) — 상세에서 참고용으로 보존
function _facSignDesc(f){
  if(!(f&&f.type&&f.type.includes('다목적위치표지판')))return '';
  return (f.name||'').replace(/^\d{2}-\d+\s*/,'').trim();
}
// 위치 표시: '01 (천불동계곡)' 형식(필터칩과 동일). 존을 못 구하면 원래 loc.
function _facZoneLbl(f){const z=_facZoneCode(f);return z?_zoneLbl(z):((f&&f.loc)||'');}
// 시설물이 해당 존(zz)에 속하는지 — 표시와 동일 기준으로 판정
function _facInZone(f,z){return _facZoneCode(f)===z;}

// 표지판 코드(ZZ-NN) → 거점 {primary, alt} 반환 ← 모든 라우팅의 단일 진입점
function getBaseForSign(signCode){
  var m=(signCode||'').match(/^(\d{2})-(\d{2,3})$/);
  if(!m)return null;
  var zz=m[1], nn=parseInt(m[2]);
  var rules=SIGN_BASE_TABLE[zz];
  if(!rules)return null;
  for(var i=0;i<rules.length;i++){
    if(nn<=rules[i][0])return{primary:rules[i][1],alt:rules[i][2]||null};
  }
  return null;
}

// GPS → 가장 가까운 표지판 전체 정보 반환
function _nearestSignFull(lat,lng){
  if(!_cachedFullSigns){
    _cachedFullSigns=(DB.g('facilities')||(typeof _facBootCache==='function'&&_facBootCache())||[]).filter(function(f){
      return f.lat&&f.lng&&f.name&&f.type&&f.type.indexOf('다목적위치표지판')>=0;
    });
  }
  var best=null,bestD=Infinity;
  _cachedFullSigns.forEach(function(f){var d=_haversine(lat,lng,f.lat,f.lng);if(d<bestD){bestD=d;best=f;}});
  if(!best||bestD>5000)return null;
  var code=(best.name.match(/^\d{2}-\d{2,3}/)||[best.name.slice(0,6)])[0];
  var zm=code.match(/^(\d{2})-/);
  return{code:code,name:best.name,dist:Math.round(bestD),zoneName:zm?ZONE_NAMES[zm[1]]||'':'',elev:best.elev||0};
}
// ── 좌표의 해발고도(그 지점 실제 높이) ────────────────────────────────
// ① GPS 실측 고도(gpsAlt)가 있으면 그걸 사용(가장 정확) ② 없으면 오픈메테오 지형고도(DEM)로 '그 지점' 실제 높이.
// (과거엔 인근 표지판 등록 고도를 '약 ~m'로 보여줬는데, 그건 지점 높이가 아니라 표지판 높이라 폐기)
// DEM은 네트워크 필요 → 한 번 받으면 localStorage에 저장(이후 오프라인도 표시). 받기 전엔 placeholder로 비워뒀다가 도착 시 그 자리를 채움.
var _elevCacheObj=null,_elevInflight={};
function _elevLoad(){if(_elevCacheObj)return _elevCacheObj;try{_elevCacheObj=JSON.parse(localStorage.getItem('_elevCacheV1')||'{}');}catch(e){_elevCacheObj={};}return _elevCacheObj;}
function _elevKey(lat,lng){return (+lat).toFixed(4)+'_'+(+lng).toFixed(4);} // ≈11m 격자로 캐시(과다요청 방지)
function _elevGet(k){var c=_elevLoad();return typeof c[k]==='number'?c[k]:undefined;}
function _elevSet(k,v){var c=_elevLoad();c[k]=v;try{localStorage.setItem('_elevCacheV1',JSON.stringify(c));}catch(e){}}
function _fetchElev(lat,lng){
  var k=_elevKey(lat,lng);
  if(_elevGet(k)!=null||_elevInflight[k])return; // 이미 있음/받는 중
  _elevInflight[k]=1;
  var url='https://api.open-meteo.com/v1/elevation?latitude='+(+lat).toFixed(5)+'&longitude='+(+lng).toFixed(5);
  fetch(url).then(function(r){return r.json();}).then(function(j){
    delete _elevInflight[k];
    var v=(j&&j.elevation&&j.elevation.length!=null)?+j.elevation[0]:null;
    if(v==null||!isFinite(v))return;
    _elevSet(k,v);
    // 이미 그려진 자리(placeholder) 즉시 채우기 — 화면 종류와 무관
    try{document.querySelectorAll('.elev-ph[data-ek="'+k+'"]').forEach(function(el){el.textContent='⛰'+Math.round(v)+'m';});}catch(e){}
  }).catch(function(){delete _elevInflight[k];});
}
// plain=true: 보고서(hwpx·출력) 등 순수 문자열이 필요한 곳 — placeholder(span) 없이 캐시값 또는 '' 반환
function _elevStr(lat,lng,gpsAlt,plain){
  if(gpsAlt!=null&&gpsAlt!==''&&isFinite(+gpsAlt))return '⛰'+Math.round(+gpsAlt)+'m';
  if(!(lat&&lng))return '';
  var k=_elevKey(lat,lng);
  var v=_elevGet(k);
  if(typeof v==='number')return '⛰'+Math.round(v)+'m';
  if(plain)return ''; // 문서 생성 시엔 아직 없으면 표시 안 함(잘못된 값 넣지 않음)
  _fetchElev(lat,lng); // 비동기로 받아와 아래 placeholder를 채움
  return '<span class="elev-ph" data-ek="'+k+'"></span>';
}

// ── 일출·일몰 계산 (Sunrise equation) — 산악구조 '어두워지기 전 완료' 판단용. 순수 JS, API 불필요 ──
function _sunTimes(lat,lng,date){
  const rad=Math.PI/180,d=date||new Date();
  const n=Math.round((d.getTime()/86400000)+2440587.5-2451545.0+0.0008);
  const Jstar=n-lng/360;
  const M=(357.5291+0.98560028*Jstar)%360;
  const C=1.9148*Math.sin(M*rad)+0.02*Math.sin(2*M*rad)+0.0003*Math.sin(3*M*rad);
  const lambda=(M+C+180+102.9372)%360;
  const Jt=2451545.0+Jstar+0.0053*Math.sin(M*rad)-0.0069*Math.sin(2*lambda*rad);
  const delta=Math.asin(Math.sin(lambda*rad)*Math.sin(23.44*rad))/rad;
  const cosH=(Math.sin(-0.83*rad)-Math.sin(lat*rad)*Math.sin(delta*rad))/(Math.cos(lat*rad)*Math.cos(delta*rad));
  if(cosH>1||cosH<-1)return null;
  const H=Math.acos(cosH)/rad;
  const toDate=J=>new Date((J-2440587.5)*86400000);
  return {sunrise:toDate(Jt-H/360),sunset:toDate(Jt+H/360)};
}
const _opChip=(col,txt)=>`<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:800;color:${col};background:${col}1a;border:1px solid ${col}55;border-radius:7px;padding:3px 9px;">${txt}</span>`;
// 진행 중 구조의 일몰 카운트다운 (좌표 필요) — 밤이 다가올수록 주황→빨강. 종료·좌표없음이면 ''
function _sunsetBadge(r){
  if(!r||r.status!=='ongoing'||!(r.lat&&r.lng))return '';
  const t=_sunTimes(+r.lat,+r.lng);if(!t)return '';
  const hhmm=d=>('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
  const remMin=Math.round((t.sunset.getTime()-Date.now())/60000);
  if(remMin<=0)return _opChip('#c0392b',`🌙 일몰 지남 ${hhmm(t.sunset)} · 야간구조`);
  const h=Math.floor(remMin/60),m=remMin%60,rem=(h?h+'시간 ':'')+(m?m+'분 ':'')+'남음';
  const col=remMin<=60?'#c0392b':remMin<=120?'#e67e22':'#5fa86f';
  return _opChip(col,(remMin<=60?'🌅 일몰 임박 ':'🌅 일몰 ')+hhmm(t.sunset)+' · '+rem);
}
// 진행 중 구조의 신고 후 경과시간 (골든타임 인식) — 길어질수록 파랑→주황→빨강. 종료건이면 ''
function _elapsedBadge(r){
  if(!r||r.status!=='ongoing'||!r.date)return '';
  const m=String(r.date).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);if(!m)return '';
  let min=Math.round((Date.now()-new Date(+m[1],+m[2]-1,+m[3],+m[4],+m[5]).getTime())/60000);
  if(min<0||!isFinite(min))return '';
  const h=Math.floor(min/60),mm=min%60,txt=(h?h+'시간 ':'')+mm+'분';
  const col=min<60?'#5fa86f':min<180?'#3182f6':min<360?'#e67e22':'#c0392b';
  return _opChip(col,`⏱️ 신고 후 ${txt} 경과`);
}
// 진행중 구조 운영 배지 묶음(경과·일몰) — 한 줄 flex. 좌표 공유 칩은 위치 행 오른쪽(_coordChipHtml)으로 이동
function _opBadges(r,withCoord){
  const b=[_elapsedBadge(r),_sunsetBadge(r)].filter(Boolean);
  if(withCoord&&r&&r.lat&&r.lng)b.push(_coordChipHtml(r));
  return b.length?`<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">${b.join('')}</div>`:'';
}
// 좌표 공유 칩 — 위치 행 오른쪽 끝에 붙는 컴팩트 버튼
function _coordChipHtml(r){
  if(!r||!r.lat||!r.lng)return '';
  return `<span onclick="event.stopPropagation();openCoordShare(${r.lat},${r.lng},'${_escq(String(r.title||'').slice(0,30))}')" style="flex-shrink:0;display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:800;color:#4d9bf5;background:rgba(49,130,246,.12);border:1px solid rgba(49,130,246,.4);border-radius:7px;padding:3px 8px;cursor:pointer;">📍 좌표 공유</span>`;
}
// ── 좌표 공유 (119·타 기관 전달용) — 십진수·도분초·카카오맵 링크 ──
function _coordFormats(lat,lng){
  lat=+lat;lng=+lng;
  const dms=(v,pos,neg)=>{const a=Math.abs(v),deg=Math.floor(a),mf=(a-deg)*60,mi=Math.floor(mf),se=Math.round((mf-mi)*60);return (v>=0?pos:neg)+deg+'° '+mi+"' "+se+'"';};
  // 링크 안 한글은 문자·카톡의 URL 자동인식을 끊어 탭해도 안 열림 → encodeURIComponent로 순수 ASCII화
  return {dec:lat.toFixed(6)+', '+lng.toFixed(6),dms:dms(lat,'N','S')+' '+dms(lng,'E','W'),kakao:'https://map.kakao.com/link/map/'+encodeURIComponent('사고지점')+','+lat.toFixed(6)+','+lng.toFixed(6)};
}
function openCoordShare(lat,lng,title){
  if(!(lat&&lng)){toast('좌표 없음');return;}
  const f=_coordFormats(lat,lng);
  const t=title?String(title).slice(0,40):'설악산 사고지점';
  const shareText=`[${t}]\n좌표 ${f.dec}\n${f.dms}\n카카오맵: ${f.kakao}`;
  const row=(lbl,val,cp)=>`<div style="display:flex;align-items:center;gap:8px;background:#0f0f11;border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:9px 11px;margin-bottom:7px;"><div style="flex:1;min-width:0;"><div style="font-size:9px;color:#6b7684;font-weight:700;">${lbl}</div><div style="font-size:12.5px;color:#eaecef;font-weight:600;word-break:break-all;">${_esc(val)}</div></div><button onclick="_copyText('${_escq(cp)}')" style="flex-shrink:0;background:rgba(49,130,246,.14);color:#4d9bf5;border:1px solid rgba(49,130,246,.3);border-radius:7px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;">복사</button></div>`;
  let ov=document.getElementById('coordShareOv');if(ov)ov.remove();
  ov=document.createElement('div');ov.id='coordShareOv';
  ov.style.cssText='position:fixed;inset:0;z-index:9600;background:rgba(0,0,0,.62);display:flex;align-items:flex-end;justify-content:center;';
  ov.innerHTML=`<div style="background:#16161a;width:100%;max-width:480px;border-radius:14px 14px 0 0;padding:16px 16px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -4px 20px rgba(0,0,0,.7);">
    <div style="font-size:15px;font-weight:800;color:#eaecef;margin-bottom:3px;">📍 사고지점 좌표 공유</div>
    <div style="font-size:11px;color:#8b95a1;margin-bottom:13px;">119·타 기관 전달용 — 복사하거나 아래로 바로 공유</div>
    ${row('위도, 경도 (십진수)',f.dec,f.dec)}
    ${row('도분초 (DMS)',f.dms,f.dms)}
    ${row('카카오맵 링크',f.kakao,f.kakao)}
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button onclick="document.getElementById('coordShareOv').remove()" style="flex:1;padding:12px;border-radius:9px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.04);color:#c4c8ce;font-size:13px;font-weight:700;cursor:pointer;">닫기</button>
      <button onclick="_sysShareCoord('${_escq(shareText)}')" style="flex:2;padding:12px;border-radius:9px;border:none;background:#1a4a6e;color:#fff;font-size:13px;font-weight:800;cursor:pointer;">📤 공유 / 문자</button>
    </div>
  </div>`;
  document.body.appendChild(ov);ov.onclick=e=>{if(e.target===ov)ov.remove();};
}
function _copyText(s){try{navigator.clipboard.writeText(s);toast('📋 복사됨');}catch(e){try{const t=document.createElement('textarea');t.value=s;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();toast('📋 복사됨');}catch(_){toast('복사 실패 — 길게 눌러 복사하세요');}}}
function _sysShareCoord(text){
  if(navigator.share){navigator.share({title:'사고지점 좌표',text}).catch(()=>{});}
  else{location.href='sms:?&body='+encodeURIComponent(text);}
}

// Zone 뱃지: "ZZ-NN → 거점명 (Xm)" 표지판 코드 최우선
function _updateZoneBadge(lat,lng,elId){
  var el=document.getElementById(elId);if(!el)return;
  var s=_nearestSignFull(lat,lng);
  if(!s){el.style.display='none';return;}
  var base=getBaseForSign(s.code);
  var baseName=base?((SEORAK_BASES[base.primary]||{}).name||base.primary):'관리자 확인 필요';
  var shortBase=baseName.replace('탐방지원센터','센터').replace('설악산국립공원사무소','사무소');
  var label=s.code+' → '+shortBase;
  if(base&&base.alt){var altName=((SEORAK_BASES[base.alt]||{}).name||base.alt).replace('탐방지원센터','센터');label+=' / '+altName+' 선택';}
  if(s.dist!==null)label+=' ('+s.dist+'m)';
  el.textContent=label;el.style.display='block';
}

// 하위 호환: getZoneId — 표지판 코드에서 ZZ 추출
function getZoneId(lat,lng){
  var s=_nearestSignFull(lat,lng);
  if(s){var m=(s.code||'').match(/^(\d{2})-/);if(m)return m[1];}
  return null;
}

// 하위 호환: getBestBase — getBaseForSign 위임
function getBestBase(zz,nn){
  var code=String(parseInt(zz)||0).padStart(2,'0')+'-'+String(parseInt(nn)||1).padStart(2,'0');
  return getBaseForSign(code)||{primary:'소공원'};
}


const SEORAK_BASES = {
  '소공원':   {name:'소공원탐방지원센터',      lat:38.1724, lng:128.4794},
  '백담':     {name:'백담탐방지원센터',        lat:38.1501, lng:128.3897},
  '남설악':   {name:'남설악탐방지원센터',      lat:38.0242, lng:128.5124},
  '용소':     {name:'용소탐방지원센터',        lat:38.0430, lng:128.5295},
  '흘림골':   {name:'흘림골탐방지원센터',      lat:38.0477, lng:128.5824},
  '약수터':   {name:'오색약수탐방지원센터',    lat:38.0310, lng:128.5215},
  '한계령':   {name:'한계령탐방지원센터',      lat:38.0703, lng:128.3143},
  '한계산성': {name:'한계산성분소',            lat:38.0929, lng:128.3157},
  '남교리':   {name:'남교리탐방지원센터',      lat:38.1037, lng:128.3587},
  '점봉산':   {name:'점봉산탐방지원센터',      lat:38.0913, lng:128.5621},
  '공단':     {name:'설악산국립공원사무소',    lat:38.2064, lng:128.4638},
  '대청':     {name:'대청봉대피소',           lat:38.1195, lng:128.4649},
};
const _SOKCHO_HOSP = {name:'속초의료원', lat:38.2080, lng:128.5866};

// 과/분소 → 출발 허브
const DEPT_HUBS = {
  '행정과':       '공단',
  '재난안전과':   '공단',
  '탐방시설과':   '공단',
  '자원보전과':   '공단',
  '특수산악구조대':'소공원',
  '대청분소':     '대청',
  '백담분소':     '백담',
  '오색분소':     '남설악',
  '한계산성분소': '한계산성',
  '점봉산분소':   '점봉산',
};

// 현재 사용자의 허브 좌표 반환
function getMyHub() {
  const u=DB.g('currentUser')||{};
  const key=DEPT_HUBS[u.dept||'']||'공단';
  return SEORAK_BASES[key]||SEORAK_BASES['공단'];
}


function _showHeliInfo(lat,lng){
  const coords=lat.toFixed(5)+', '+lng.toFixed(5);
  if(navigator.clipboard){
    navigator.clipboard.writeText(coords).then(function(){toast('🚁 헬기 좌표 복사: '+coords);}).catch(function(){toast('🚁 GPS: '+coords);});
  } else { toast('🚁 GPS: '+coords); }
}

// 구조 팝업용 출동/하산/대피/헬기 버튼 HTML 생성 (산악 특화)
function _buildResRouteHtml(data){
  const locStr=(data.location||data.title||'');
  const locM=locStr.match(/(\d{2})-(\d{2,3})/);
  let signCode=locM?locM[0]:null;
  if(!signCode&&data.lat&&data.lng){
    const s=_nearestSignFull(data.lat,data.lng);
    if(s)signCode=s.code;
  }
  const baseInfo=signCode?getBaseForSign(signCode):null;
  const pb=baseInfo?SEORAK_BASES[baseInfo.primary]:null;
  const ab=baseInfo&&baseInfo.alt?SEORAK_BASES[baseInfo.alt]:null;
  const hub=getMyHub();
  const hasGPS=!!(data.lat&&data.lng);
  const bs='flex:1;min-width:0;padding:9px 5px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;border:none;min-height:42px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;';
  const sn=s=>s?s.replace('탐방지원센터','').replace('설악산국립공원사무소','사무소').replace('분소','분소').slice(0,7):'';

  // 출동: 출발기지→사고 기지 정보 표시 + 사고지점 좌표 복사
  const dispatch=pb?`<button onclick="_showDispatchInfo('${hub?hub.name:''}','${pb.name}',${hasGPS?data.lat:pb.lat},${hasGPS?data.lng:pb.lng})" style="${bs}background:rgba(255,255,255,.18);color:#3182f6;border:1px solid rgba(255,255,255,.35);">🚗 출동<span style="font-size:9px;font-weight:400;opacity:.7;">${sn(pb.name)}</span></button>`:'';
  // 하산: 표지판 기준 하산 경로 안내 (텍스트)
  const descent=signCode?`<button onclick="_showDescentInfo('${signCode}')" style="${bs}background:rgba(39,174,96,.12);color:#5dbf8a;border:1px solid rgba(39,174,96,.25);">🥾 하산<span style="font-size:9px;font-weight:400;opacity:.7;">경로안내</span></button>`:
    (hasGPS?`<button onclick="_showHeliInfo(${data.lat},${data.lng})" style="${bs}background:rgba(39,174,96,.12);color:#5dbf8a;border:1px solid rgba(39,174,96,.25);">📋 좌표복사<span style="font-size:9px;font-weight:400;opacity:.7;">하산용</span></button>`:''
  );
  // 대피: 속초의료원 연락처 + 좌표 복사
  const evac=`<button onclick="_showEvacInfo(${hasGPS?data.lat:0},${hasGPS?data.lng:0})" style="${bs}background:rgba(230,126,34,.12);color:#e67e22;border:1px solid rgba(230,126,34,.25);">🚑 대피<span style="font-size:9px;font-weight:400;opacity:.7;">속초의료원</span></button>`;
  const heli=hasGPS?`<button onclick="_showHeliInfo(${data.lat},${data.lng})" style="${bs}background:rgba(108,79,168,.15);color:#b89af0;border:1px solid rgba(108,79,168,.3);">🚁 헬기<span style="font-size:9px;font-weight:400;opacity:.7;">좌표복사</span></button>`:'';

  const zm=signCode?(signCode.match(/^(\d{2})-/)||[])[1]:null;
  const zoneName=zm?(ZONE_NAMES[zm]||''):'';
  const signLabel=signCode?`<div style="font-size:10px;color:#454e5a;margin-bottom:5px;padding:0 2px;">📍 ${signCode}${zoneName?' · '+zoneName:''}${pb?' → '+sn(pb.name):''}${ab?` <span style="color:#e0a840;font-size:9px;">/ ${sn(ab.name)}</span>`:''}</div>`:
    (hasGPS?`<div style="font-size:10px;color:#e05050;margin-bottom:5px;padding:0 2px;">⚠️ 표지판 코드 없음</div>`:'');

  const btns=[dispatch].filter(Boolean); // 좌표복사·대피·헬기 버튼 제거(요청) — 출동 정보만 유지
  if(!btns.length&&!signLabel)return'';
  return signLabel+(btns.length?`<div style="display:flex;gap:5px;">${btns.join('')}</div>`:'');
}

// 출동 정보 팝업 (산악: 기지명 + 사고지점 좌표 복사)
function _showDispatchInfo(hubName,pbName,lat,lng){
  const coords=lat&&lng?lat.toFixed(5)+', '+lng.toFixed(5):'';
  const msg=(hubName?hubName+'에서 출발\n':'')+'담당: '+pbName+(coords?'\n사고지점: '+coords:'');
  if(coords&&navigator.clipboard){
    navigator.clipboard.writeText(coords).then(()=>toast('🚗 출동 — 좌표복사: '+coords)).catch(()=>alert(msg));
  }else{alert(msg);}
}

// 하산 경로 안내 (SIGN_BASE_TABLE 기반 텍스트)
function _showDescentInfo(signCode){
  const baseInfo=getBaseForSign(signCode);
  if(!baseInfo){toast('⚠️ 경로 정보 없음: '+signCode);return;}
  const pb=SEORAK_BASES[baseInfo.primary];
  const ab=baseInfo.alt?SEORAK_BASES[baseInfo.alt]:null;
  let msg='📍 현위치: '+signCode+'\n🏠 하산 기지: '+(pb?pb.name:baseInfo.primary);
  if(ab)msg+='\n   또는: '+ab.name;
  const zm=(signCode.match(/^(\d{2})-/)||[])[1];
  if(zm&&ZONE_NAMES[zm])msg+='\n🗺️ 구역: '+ZONE_NAMES[zm];
  msg+='\n\n무전으로 위치 보고 후 담당 기지에 연락하세요.';
  alert(msg);
}

// 대피 정보 (속초의료원 연락처 + 환자 좌표 복사)
function _showEvacInfo(lat,lng){
  const coords=lat&&lng?lat.toFixed(5)+', '+lng.toFixed(5):'';
  const msg='🚑 속초의료원\n📞 033-630-6000\n\n응급후송 시 헬기 이착륙장 확보 후\n119 또는 담당 기지에 연락하세요.'+(coords?'\n\n환자 GPS: '+coords:'');
  if(coords&&navigator.clipboard){
    navigator.clipboard.writeText(coords).then(()=>alert(msg)).catch(()=>alert(msg));
  }else{alert(msg);}
}

let _extraTeamCollapsed=[];
let _extraTeamOtherOpen=[];
let _extraTeamOtherFilter=[];
let _initTeamMembers=[]; // 초동 출동팀 선택 인원 (추가팀 비활성화용)
function initExtraTeams(prefill){
  _extraTeams=(prefill&&prefill.extraTeams)?prefill.extraTeams.map(t=>({...t})):[];
  _extraTeamCollapsed=_extraTeams.map(()=>false);
  _extraTeamOtherOpen=_extraTeams.map(()=>false);
  _extraTeamOtherFilter=_extraTeams.map(()=>'');
  renderExtraTeams();
}
function removeExtraTeam(idx){
  _extraTeams.splice(idx,1);
  _extraTeamCollapsed.splice(idx,1);
  _extraTeamOtherOpen.splice(idx,1);
  _extraTeamOtherFilter.splice(idx,1);
  renderExtraTeams();
}
function setExtraTeamOtherFilter(ti,dept){
  _extraTeamOtherFilter[ti]=dept;
  renderExtraTeams();
}
function renderExtraTeams(){
  const wrap=document.getElementById('extraTeamsWrap');
  if(!wrap) return;
  const allMembers=getTeamMembers();
  const deptMap={};allMembers.forEach(s=>{deptMap[s.name]=s.dept;});
  const availDepts=[...new Set(allMembers.map(s=>s.dept).filter(Boolean))];
  wrap.innerHTML=_extraTeams.map((t,ti)=>{
    const collapsed=!!_extraTeamCollapsed[ti];
    const filt=_extraTeamOtherFilter[ti]||'전체';
    const byDept={};
    t.members.forEach(n=>{const d=deptMap[n]||'';if(!byDept[d])byDept[d]=[];byDept[d].push(n);});
    const summaryParts=Object.keys(byDept).map(d=>
      `<b style="color:#7ec8a0;">${d?_esc(DEPT_SHORT[d]||d):''} ${_esc(byDept[d].join(', '))}</b>`
    );
    const summaryHtml=t.members.length===0
      ?'<span style="color:#565f6b;">(미선택)</span>'
      :summaryParts.join(' · ');
    const filtered=filt==='전체'?allMembers:allMembers.filter(s=>s.dept===filt);
    return `<div style="margin-bottom:8px;padding:10px;background:#0f0f11;border-radius:8px;border:1px solid rgba(126,200,163,.2);">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:${collapsed?0:8}px;">
        ${collapsed
          ?`<span style="font-size:11px;flex:1;">${summaryHtml}</span>`
          :`<input type="text" value="${_esc(t.teamName)}" oninput="_extraTeams[${ti}].teamName=this.value"
              style="flex:1;background:transparent;border:none;border-bottom:1px solid rgba(126,200,163,.3);color:#7ec8a0;font-size:12px;font-weight:700;outline:none;padding:2px 0;">`}
        ${collapsed
          ?`<button onclick="editExtraTeam(${ti})" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);color:#3182f6;border-radius:6px;font-size:11px;padding:4px 10px;cursor:pointer;">✏️ 수정</button>`
          :`<button onclick="removeExtraTeam(${ti})" style="background:rgba(192,57,43,.1);border:none;color:#c0392b;font-size:11px;padding:3px 8px;border-radius:5px;cursor:pointer;">삭제</button>`}
      </div>
      ${collapsed?'':`
        ${t.members.length?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
          ${t.members.map(n=>`<div style="background:rgba(126,200,163,.15);color:#7ec8a0;border:1px solid rgba(126,200,163,.3);border-radius:20px;font-size:10px;font-weight:700;padding:3px 8px;display:flex;align-items:center;gap:4px;">${_esc(n)}<span onclick="toggleExtraTeamMemberByName(${ti},'${_escq(n)}')" style="cursor:pointer;color:#c0392b;font-size:12px;line-height:1;">×</span></div>`).join('')}
        </div>`:''}
        ${availDepts.length>1?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
          ${['전체',...availDepts].map(d=>`<div onclick="setExtraTeamOtherFilter(${ti},'${_escq(d)}')" style="padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;cursor:pointer;${d===filt?'background:#1a4a6e;color:#3182f6;':'background:#1c1c1e;color:#565f6b;border:1px solid #1a3a5a;'}">${_esc(d)}</div>`).join('')}
        </div>`:''}
        ${filtered.length?`<div class="chk-grid">
          ${filtered.map(s=>{
            const inThis=t.members.includes(s.name);
            const takenElsewhere=!inThis&&((_initTeamMembers||[]).includes(s.name)||_extraTeams.some((et,ei)=>ei!==ti&&et.members.includes(s.name)));
            return `<div class="chk-item${inThis?' on':''}${takenElsewhere?' disabled':''}"
              onclick="${takenElsewhere?'':(`toggleExtraTeamMember(${ti},\\'${_escq(s.name)}\\',this)`)}"
              style="${takenElsewhere?'opacity:.35;cursor:not-allowed;':''}">
              <div class="chk-box${inThis?' on':''}"></div>
              <span class="chk-txt">${_esc(s.name)}<span style="font-size:9px;color:#565f6b;margin-left:3px;">${_esc(s.rank)}${takenElsewhere?' (배정됨)':''}</span></span>
            </div>`;
          }).join('')}
        </div>`:'<div style="font-size:11px;color:#565f6b;padding:6px 0;">가입된 인원 없음</div>'}
        <button onclick="confirmExtraTeam(${ti})" style="width:100%;margin-top:10px;padding:8px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.3);color:#3182f6;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">✅ 확인</button>
      `}
    </div>`;
  }).join('');
}
function confirmExtraTeam(ti){
  _extraTeamCollapsed[ti]=true;
  renderExtraTeams();
}
function editExtraTeam(ti){
  _extraTeamCollapsed[ti]=false;
  renderExtraTeams();
}
function toggleExtraTeamMember(teamIdx,name,el){
  el.classList.toggle('on');
  el.querySelector('.chk-box').classList.toggle('on',el.classList.contains('on'));
  const t=_extraTeams[teamIdx];
  if(!t) return;
  if(el.classList.contains('on')){
    if(!t.members.includes(name)) t.members.push(name);
  } else {
    t.members=t.members.filter(n=>n!==name);
  }
}
function toggleExtraTeamMemberByName(ti,name){
  const t=_extraTeams[ti];if(!t)return;
  t.members=t.members.filter(n=>n!==name);
  renderExtraTeams();
}
function getExtraTeams(){ return _extraTeams.filter(t=>t.members.length>0); }

// 폼 미니맵 (1보·위험상황 공용) — 카카오맵 SDK가 늦게 로드돼도 재시도하여 반영
let _miniMaps={};
function _updateMiniMapEl(containerId,lat,lng,_retry){
  if(!window._KR){
    if((_retry||0)<15)setTimeout(()=>_updateMiniMapEl(containerId,lat,lng,(_retry||0)+1),300);
    return;
  }
  const el=document.getElementById(containerId);
  if(!el)return;
  const pos=new kakao.maps.LatLng(lat,lng);
  let mm=_miniMaps[containerId];
  if(!mm){
    try{
      el.style.display='block';
      const map=new kakao.maps.Map(el,{center:pos,level:5,tileAnimation:false});
      map.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
      // 십자선 핀
      const pin=document.createElement('div');
      pin.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;"><div style="background:#c0392b;border:2px solid #fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 2px 6px rgba(0,0,0,.6);">🚨</div><div style="width:2px;height:8px;background:#c0392b;"></div></div>`;
      const marker=new kakao.maps.CustomOverlay({position:pos,content:pin,yAnchor:1,zIndex:4});
      marker.setMap(map);
      _miniMaps[containerId]={map,marker};
    }catch(e){console.warn('miniMap',e);}
  }else{
    try{
      el.style.display='block';
      mm.map.setCenter(pos);
      if(mm.marker)mm.marker.setPosition(pos);
    }catch(e){}
  }
}
// ── 구조 폼 인라인 위치 미니맵: 중앙 십자선 + 표지판 + 드래그로 좌표·사고장소 자동갱신 ──
let _formMap=null,_formMapSignsAdded=false;
function _addFormMapSigns(){
  if(_formMapSignsAdded||!_formMap)return;
  const signs=(DB.g('facilities')||[]).filter(f=>f.type&&f.type.includes('다목적위치표지판')&&f.lat&&f.lng);
  if(!signs.length)return; // 아직 로딩 전이면 다음 갱신 때 다시 시도
  signs.forEach(f=>{
    const m=(f.name||'').match(/^\d{1,2}-\d{1,3}/);
    const code=m?m[0]:(f.name||'').slice(0,5);
    const d=document.createElement('div');
    d.style.cssText='background:rgba(8,18,36,.82);border:1px solid rgba(125,211,250,.45);border-radius:5px;padding:1px 4px;font-size:9px;font-weight:700;color:#aab4c0;font-family:monospace;pointer-events:none;white-space:nowrap;';
    d.textContent=code;
    new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(f.lat,f.lng),content:d,zIndex:2}).setMap(_formMap);
  });
  _formMapSignsAdded=true;
}
function _updateFormMiniMap(lat,lng){
  if(!window._KR){ setTimeout(()=>_updateFormMiniMap(lat,lng),300); return; }
  const el=document.getElementById('r_loc_mini_map');
  if(!el)return;
  el.style.display='block';
  const pos=new kakao.maps.LatLng(lat,lng);
  if(!_formMap){
    try{
      el.style.position='relative';
      _formMap=new kakao.maps.Map(el,{center:pos,level:4,tileAnimation:false});
      _formMap.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
      // 중앙 고정 십자선 (지도를 움직여 중심점=선택 위치)
      const cross=document.createElement('div');
      cross.style.cssText='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:5;pointer-events:none;width:36px;height:36px;';
      cross.innerHTML='<div style="position:absolute;left:50%;top:0;width:2px;height:100%;background:rgba(231,76,60,.9);transform:translateX(-50%);"></div><div style="position:absolute;top:50%;left:0;height:2px;width:100%;background:rgba(231,76,60,.9);transform:translateY(-50%);"></div><div style="position:absolute;left:50%;top:50%;width:11px;height:11px;border:2px solid #fff;border-radius:50%;background:rgba(231,76,60,.75);transform:translate(-50%,-50%);box-shadow:0 0 6px rgba(0,0,0,.7);"></div>';
      el.appendChild(cross);
      _addFormMapSigns();
      // 드래그 → 중심 좌표·사고장소 자동 갱신 (디바운스)
      let _ft=null;
      kakao.maps.event.addListener(_formMap,'center_changed',function(){
        const c=_formMap.getCenter(),la=c.getLat(),ln=c.getLng();
        window._formGpsAlt=null; // 지도 드래그로 좌표 변경 → GPS 고도 무효(표지판 기반 추정으로 대체)
        const cd=document.getElementById('r_minimap_coords');if(cd)cd.textContent=la.toFixed(5)+', '+ln.toFixed(5);
        clearTimeout(_ft);
        _ft=setTimeout(function(){
          const g=document.getElementById('r_gps');if(g)g.value=la.toFixed(5)+', '+ln.toFixed(5);
          _autoFillLoc(la,ln);
          const _e=(typeof _elevStr==='function')?_elevStr(la,ln):'';
          // _elevStr는 고도 미확보 시 <span class="elev-ph"> HTML을 반환 → textContent면 태그가 그대로 글자로 보임. innerHTML로 삽입.
          if(cd&&_e)cd.innerHTML=la.toFixed(5)+', '+ln.toFixed(5)+' '+_e;
          const st=document.getElementById('r_gps_status');if(st)st.textContent='✅ 지도 중심으로 위치 지정됨';
        },280);
      });
    }catch(e){console.warn('formMap',e);return;}
  }else{
    try{el.style.display='block';_formMap.relayout();_formMap.setCenter(pos);_addFormMapSigns();}catch(e){}
  }
}
function initFormMiniMap(lat,lng){
  // 폼 재렌더 시 이전 지도 인스턴스 폐기 (DOM이 새로 생성되므로)
  _formMap=null;_formMapSignsAdded=false;
  const el=document.getElementById('r_loc_mini_map');
  if(el){el.style.display='none';el.innerHTML='';}
  if(lat&&lng){
    const v=(+lat).toFixed(5)+', '+(+lng).toFixed(5);
    const cd=document.getElementById('r_minimap_coords');if(cd)cd.textContent=v;
    const st=document.getElementById('r_gps_status');if(st)st.textContent='✅ 위치 확인 — 🗺 지도를 드래그해 조정';
    setTimeout(()=>_updateFormMiniMap(+lat,+lng),200);
  }
}
// ══════════════════════════════════════════
// 시설물 등록/수정 — 지도에서 위치 선택 (드래그하는 중앙 십자선 = 선택 좌표)
// ══════════════════════════════════════════
let _facMap=null,_facMapSignsAdded=false;
function _facToggleMap(){
  const el=document.getElementById('fac_loc_mini_map');
  const cd=document.getElementById('fac_minimap_coords');
  const hint=document.getElementById('fac_map_hint');
  if(!el)return;
  if(el.style.display!=='none'){ // 열려있으면 닫기(토글)
    el.style.display='none';if(cd)cd.style.display='none';if(hint)hint.style.display='none';return;
  }
  el.style.display='block';if(cd)cd.style.display='block';if(hint)hint.style.display='block';
  // 시작 좌표: 입력칸 → 시설점검 지도 중심 → 공원 중심
  let lat,lng;
  const gv=((document.getElementById('facGpsIn')||{}).value||'').split(',');
  if(gv.length===2&&!isNaN(parseFloat(gv[0]))&&!isNaN(parseFloat(gv[1]))){lat=parseFloat(gv[0]);lng=parseFloat(gv[1]);}
  else{try{const c=mapI.getCenter();lat=c.getLat();lng=c.getLng();}catch(e){lat=DC.lat;lng=DC.lng;}}
  _updateFacFormMap(lat,lng);
}
function _updateFacFormMap(lat,lng){
  if(!window._KR){setTimeout(()=>_updateFacFormMap(lat,lng),300);return;}
  const el=document.getElementById('fac_loc_mini_map');if(!el)return;
  el.style.display='block';
  const pos=new kakao.maps.LatLng(lat,lng);
  const cd=document.getElementById('fac_minimap_coords');
  const _e=(typeof _elevStr==='function')?_elevStr(lat,lng):'';
  if(cd)cd.innerHTML=lat.toFixed(5)+', '+lng.toFixed(5)+(_e?' '+_e:'');
  if(!_facMap){
    try{
      el.style.position='relative';
      _facMap=new kakao.maps.Map(el,{center:pos,level:4,tileAnimation:false});
      _facMap.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
      const cross=document.createElement('div');
      cross.style.cssText='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:5;pointer-events:none;width:36px;height:36px;';
      cross.innerHTML='<div style="position:absolute;left:50%;top:0;width:2px;height:100%;background:rgba(231,76,60,.9);transform:translateX(-50%);"></div><div style="position:absolute;top:50%;left:0;height:2px;width:100%;background:rgba(231,76,60,.9);transform:translateY(-50%);"></div><div style="position:absolute;left:50%;top:50%;width:11px;height:11px;border:2px solid #fff;border-radius:50%;background:rgba(231,76,60,.75);transform:translate(-50%,-50%);box-shadow:0 0 6px rgba(0,0,0,.7);"></div>';
      el.appendChild(cross);
      _addFacMapSigns();
      let _ft=null;
      kakao.maps.event.addListener(_facMap,'center_changed',function(){
        const c=_facMap.getCenter(),la=c.getLat(),ln=c.getLng();
        if(cd)cd.textContent=la.toFixed(5)+', '+ln.toFixed(5);
        clearTimeout(_ft);
        _ft=setTimeout(function(){
          const g=document.getElementById('facGpsIn');if(g)g.value=la.toFixed(5)+', '+ln.toFixed(5);
          // 위치설명이 비어 있으면 가까운 표지판명 자동 채움
          const li=document.getElementById('facLocIn');
          if(li&&!li.value.trim()){const s=(typeof _nearestSign==='function')?_nearestSign(la,ln):'';if(s)li.value=s;}
          const _ev=(typeof _elevStr==='function')?_elevStr(la,ln):'';
          if(cd&&_ev)cd.innerHTML=la.toFixed(5)+', '+ln.toFixed(5)+' '+_ev;
        },280);
      });
    }catch(e){console.warn('facMap',e);return;}
  }else{
    try{el.style.display='block';_facMap.relayout();_facMap.setCenter(pos);_addFacMapSigns();}catch(e){}
  }
}
function _addFacMapSigns(){
  if(_facMapSignsAdded||!_facMap)return;
  const signs=(DB.g('facilities')||[]).filter(f=>f.type&&f.type.includes('다목적위치표지판')&&f.lat&&f.lng);
  if(!signs.length)return;
  signs.forEach(f=>{
    const m=(f.name||'').match(/^\d{1,2}-\d{1,3}/);
    const code=m?m[0]:(f.name||'').slice(0,5);
    const d=document.createElement('div');
    d.style.cssText='background:rgba(8,18,36,.82);border:1px solid rgba(125,211,250,.45);border-radius:5px;padding:1px 4px;font-size:9px;font-weight:700;color:#aab4c0;font-family:monospace;pointer-events:none;white-space:nowrap;';
    d.textContent=code;
    new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(f.lat,f.lng),content:d,zIndex:2}).setMap(_facMap);
  });
  _facMapSignsAdded=true;
}
// 폼 열 때 지도 상태 초기화 (모달 DOM은 재사용되므로 인스턴스만 리셋)
function _resetFacFormMap(){
  _facMap=null;_facMapSignsAdded=false;
  const el=document.getElementById('fac_loc_mini_map');if(el){el.style.display='none';el.innerHTML='';}
  const cd=document.getElementById('fac_minimap_coords');if(cd){cd.style.display='none';cd.textContent='';}
  const hint=document.getElementById('fac_map_hint');if(hint)hint.style.display='none';
}
function _updateHazMiniMap(lat,lng){_updateMiniMapEl('hz_loc_mini_map',lat,lng);}
function initHazMiniMap(){
  delete _miniMaps['hz_loc_mini_map'];
  const el=document.getElementById('hz_loc_mini_map');
  if(el)el.style.display='none';
}
const syncHazMapFromInput=_debounce(function(){
  const v=(document.getElementById('hz_gps')?.value||'').split(',');
  if(v.length===2){
    const lat=parseFloat(v[0]),lng=parseFloat(v[1]);
    if(!isNaN(lat)&&!isNaN(lng))_updateHazMiniMap(lat,lng);
  }
},400);
function gpsToFormMap(){
  if(!navigator.geolocation){toast('⚠️ GPS 미지원');return;}
  const btn=document.getElementById('gpsFormBtn');
  const st=document.getElementById('r_gps_status');
  if(btn)btn.textContent='📡 수신중...';
  if(st)st.textContent='GPS 신호 수신 중...';
  navigator.geolocation.getCurrentPosition(pos=>{
    const lat=pos.coords.latitude,lng=pos.coords.longitude,acc=pos.coords.accuracy;
    // GPS 고도(m) — 사고 기록에 저장. 이후 지도를 드래그하면 무효화(좌표가 바뀌므로)
    window._formGpsAlt=(pos.coords.altitude!=null&&isFinite(pos.coords.altitude))?Math.round(pos.coords.altitude):null;
    const v=lat.toFixed(5)+', '+lng.toFixed(5);
    const gpsEl=document.getElementById('r_gps');if(gpsEl)gpsEl.value=v;
    const _e=(typeof _elevStr==='function')?_elevStr(lat,lng,window._formGpsAlt):'';
    const cd=document.getElementById('r_minimap_coords');if(cd)cd.innerHTML=v+(_e?' '+_e:''); // _e가 <span> HTML일 수 있어 innerHTML
    if(btn)btn.textContent='📡 GPS';
    if(st)st.textContent='✅ 현재 위치'+(acc<50?' (±'+Math.round(acc)+'m)':'')+ ' — 🗺 지도에서 조정 가능';
    _autoFillLoc(lat,lng);
    _updateFormMiniMap(lat,lng);
    toast('📍 현재 위치'+(acc<50?' (±'+Math.round(acc)+'m)':''));
  },err=>{
    if(btn)btn.textContent='📡 GPS';
    if(st)st.textContent=err.code===1?'⚠️ 위치 권한이 거부됨 — 설정에서 허용 후 재시도':'⚠️ GPS 신호 없음 — 🗺 지도에서 직접 선택하세요';
    toast(err.code===1?'⚠️ 위치 권한 거부됨':'⚠️ GPS 신호 없음');
  },{enableHighAccuracy:true,timeout:15000,maximumAge:0});
}
const syncFormMapFromInput=_debounce(function(){
  const v=(document.getElementById('r_gps')?.value||'').split(',');
  if(v.length===2){
    const lat=parseFloat(v[0]),lng=parseFloat(v[1]);
    if(!isNaN(lat)&&!isNaN(lng)){
      const cd=document.getElementById('r_minimap_coords');if(cd)cd.textContent=lat.toFixed(5)+', '+lng.toFixed(5);
      _autoFillLoc(lat,lng);
      _updateFormMiniMap(lat,lng);
    }
  }
},400);
function _autoFillLoc(lat,lng){
  var el=document.getElementById('r_loc');
  if(!el)return;
  if(el.dataset.userEdited)return;
  var s=_nearestSign(lat,lng);
  if(s){el.value=s;autoGenTitle();return;}
  // 폴백: 카카오 역지오코딩으로 행정구역명 입력
  try{
    var gc=new kakao.maps.services.Geocoder();
    gc.coord2RegionCode(lng,lat,function(res,st){
      if(st===kakao.maps.services.Status.OK&&el&&!el.value.trim()){
        var r=(res||[]).find(function(x){return x.region_type==='H';})||res[0];
        if(r){el.value=r.address_name||'';autoGenTitle();}
      }
    });
  }catch(e){}
}

// 장소구분 토글
function selLoctype(val){
  document.getElementById('r_loctype').value=val;
  document.querySelectorAll('#loctypeBtns .tog-btn').forEach(b=>b.classList.toggle('on',b.dataset.val===val));
  chkIllegal({value:val});autoGenTitle();
}
// 신고자 토글
function selHasRep(val){
  document.getElementById('r_hasRep').value=val;
  document.querySelectorAll('#hasRepBtns .tog-btn').forEach(b=>b.classList.toggle('on',b.dataset.val===val));
  document.getElementById('reporterWrap').style.display=val==='y'?'block':'none';
}
// 🔄 사고자 ↔ 신고자 인적사항 맞바꾸기 — 역할을 착각해 반대로 적었을 때 한 번에 이동(공통 필드: 성명·연락처·생년월일·성별)
function swapVictimReporter(){
  const g=id=>document.getElementById(id);
  const hr=g('r_hasRep');if(hr&&hr.value!=='y'){selHasRep('y');}
  const sw=(a,b)=>{const ea=g(a),eb=g(b);if(ea&&eb){const t=ea.value;ea.value=eb.value;eb.value=t;}};
  sw('r_vName','r_repName');sw('r_vTel','r_repTel');sw('r_vBirth','r_repBirth');sw('r_vGender','r_repGender');
  // 성별 버튼 시각 동기화
  [['genderBtns','r_vGender'],['repGenderBtns','r_repGender']].forEach(([bid,hid])=>{const w=g(bid),h=g(hid);if(w&&h)w.querySelectorAll('.tog-btn').forEach(b=>b.classList.toggle('on',b.dataset.val===h.value));});
  try{if(typeof autoGenTitle==='function')autoGenTitle();}catch(e){}
  if(typeof _hapt==='function')_hapt(15);
  toast('🔄 사고자 ↔ 신고자 정보를 맞바꿨습니다');
}
// 동반자 토글 — '있음' 선택 즉시 첫 입력칸이 열리고 포커스(추가 버튼 누를 필요 없음)
function selHasComp(val){
  document.getElementById('r_hasComp').value=val;
  document.querySelectorAll('#hasCompBtns .tog-btn').forEach(b=>b.classList.toggle('on',b.dataset.val===val));
  document.getElementById('companionWrap').style.display=val==='y'?'block':'none';
  if(val==='y'){
    const list=document.getElementById('companionList');
    if(list&&!list.children.length){try{addCompanion();}catch(e){}}
    setTimeout(()=>{try{const n=document.querySelector('#companionList .companion-item:last-child .comp-name');if(n)n.focus();}catch(e){}},60);
  }
}
// 신고자 성별 버튼
function selRepGender(v){
  const h=document.getElementById('r_repGender');if(h)h.value=v;
  document.querySelectorAll('#repGenderBtns .tog-btn').forEach(b=>b.classList.toggle('on',b.dataset.val===v));
}
// 접수 경로 버튼 (119/사무소 전화/현장 접수)
function selRecvRoute(v){
  const h=document.getElementById('r_recvRoute');if(h)h.value=v;
  document.querySelectorAll('#recvRouteBtns .tog-btn').forEach(b=>b.classList.toggle('on',b.dataset.val===v));
}
// 성별 버튼 (select → 버튼식)
function selGender(v){
  document.getElementById('r_vGender').value=v;
  document.querySelectorAll('#genderBtns .tog-btn').forEach(b=>b.classList.toggle('on',b.dataset.val===v));
  autoGenTitle();
}
// 내/외국인 버튼 (select → 버튼식) — 외국인이면 거주지 칸이 '국적(국가명)' 입력칸으로 전환(별도 국적칸 없음)
function selNation(v){
  document.getElementById('r_vNat').value=v;
  document.querySelectorAll('#nationBtns .tog-btn').forEach(b=>b.classList.toggle('on',b.dataset.val===v));
  const lbl=document.getElementById('vAddrLabel');
  const addr=document.getElementById('r_vAddr');
  if(lbl)lbl.textContent=v==='외국인'?'국적 (국가명)':'거주지';
  if(addr)addr.placeholder=v==='외국인'?'예: 미국, 중국':'시/도';
  autoGenTitle();
}
// 신고자-사고자 관계 (같은 버튼 다시 누르면 해제) — '동반자' 선택 시 동반자1 정보 자동 채움(빈칸일 때만)
function selRepRel(v){
  const h=document.getElementById('r_repRel');if(!h)return;
  const nv=h.value===v?'':v;
  h.value=nv;
  document.querySelectorAll('#repRelBtns .tog-btn').forEach(b=>b.classList.toggle('on',b.dataset.val===nv));
  if(nv==='동반자'){
    try{
      const comps=(typeof getCompanions==='function')?getCompanions():[];
      const n=document.getElementById('r_repName'),t=document.getElementById('r_repTel');
      if(comps.length&&n&&!n.value.trim()){n.value=comps[0].name||'';if(t&&!t.value.trim())t.value=comps[0].tel||'';toast('👥 동반자 1 정보 자동 입력');}
    }catch(e){}
  }
}

// 부상 현황
let _injuries=[];
let _injType='',_injPart='',_injSide='',_injCat='외상';
const _BILATERAL_PARTS=['어깨','팔꿈치','손목','손','무릎','발목','발'];
// 같은 부상(유형·부위·좌우 동일) 중복 추가 방지
function _injDup(n){return (_injuries||[]).some(i=>i&&i.type===n.type&&(i.part||'')===(n.part||'')&&(i.side||'')===(n.side||''));}
// 외상(부위 필요) / 내상·질환(전신 — 부위 불필요) 유형 목록. '기타'는 직접 입력
const _INJ_TYPES={
  '외상':['골절','탈구','염좌','열상','타박상','두부손상','절단','화상','직접입력'],
  '내상':['근육경련','저혈당','심정지','저체온증','열사병','탈진/탈수','호흡곤란','흉통','복통','경련','의식저하','익수','직접입력'],
};
// ⚡ 자주 발생 부상 원터치 목록 [유형, 부위, 라벨] — 설악산 실사고 다발 조합(실족→발목·무릎·두부 / 탈진 / 심질환) 순.
// 여기 없는 사고는 아래 기존 유형·부위 선택으로 — 목록은 지름길일 뿐 제한이 아님
const _QUICK_INJ=[
  ['염좌','발목','🦶 발목 염좌'],
  ['골절','발목','🦶 발목 골절'],
  ['타박상','무릎','🦵 무릎 타박'],
  ['근육경련','','💥 근육경련'],
  ['탈진/탈수','','💦 탈진·탈수'],
  ['저체온증','','🥶 저체온증'],
  ['심정지','','💔 심정지'],
];
// 부상 표기 통일: 좌→왼쪽·우→오른쪽 자연어. 좌우 없으면 '팔목골절'처럼 압축, 전신(내상)은 유형만
function _injLabel(i){
  if(!i)return '';
  const type=i.type||'';
  const part=(i.part&&i.part!=='전신')?i.part:'';
  const sideMap={'좌':'왼쪽','우':'오른쪽','양쪽':'양쪽'};
  const side=(i.side&&i.side!=='해당없음')?(sideMap[i.side]||i.side):'';
  if(!part)return type;                        // 전신(내상) → '저혈당'
  if(side)return side+' '+part+' '+type;       // '왼쪽 팔목 골절'
  return part+type;                            // '팔목골절'
}
function initInjuries(prefill){
  _injuries=(prefill&&prefill.injuries)||[];
  _injType='';_injPart='';_injSide='';_injCat='외상';
  renderInjTypePills();
  renderInjuries();
}
// 외상/내상 카테고리 전환 → 유형 pill 목록 다시 그림
function selInjCat(cat){
  _injCat=cat;_injType='';_injPart='';_injSide='';
  document.querySelectorAll('#injCatBtns .tog-btn').forEach(b=>b.classList.toggle('on',b.dataset.val===cat));
  renderInjTypePills();
  const partWrap=document.getElementById('injPartWrap');
  if(partWrap)partWrap.style.display=cat==='내상'?'none':'block';
  const sw=document.getElementById('injSideWrap');if(sw)sw.style.display='none';
  const cw=document.getElementById('injTypeCustomWrap');if(cw)cw.style.display='none';
  document.querySelectorAll('#injPartPills .pill').forEach(p=>p.classList.remove('on'));
}
function renderInjTypePills(){
  const el=document.getElementById('injTypePills');if(!el)return;
  el.innerHTML=(_INJ_TYPES[_injCat]||[]).map(t=>`<div class="pill" onclick="selInjType(this,'${t}')" style="font-size:11px;cursor:pointer;">${t}</div>`).join('');
}
function selInjType(el,type){
  document.querySelectorAll('#injTypePills .pill').forEach(p=>p.classList.remove('on'));
  el.classList.add('on');_injType=type;
  // 내상은 전신 — 부위/좌우 숨김. '기타'는 직접 입력칸 노출
  // ※ 외상은 이미 고른 부위·좌우를 지우지 않음 — 유형·부위 선택 순서와 무관하게 동작(부위 먼저 골라도 유형 누를 때 사라지지 않음)
  const partWrap=document.getElementById('injPartWrap');
  const sw=document.getElementById('injSideWrap');
  const cw=document.getElementById('injTypeCustomWrap');
  const isSys=_injCat==='내상';
  if(partWrap) partWrap.style.display=isSys?'none':'block';
  if(cw){cw.style.display=type==='직접입력'?'block':'none';if(type==='직접입력')setTimeout(()=>{try{document.getElementById('injTypeCustom').focus();}catch(e){}},50);}
  if(isSys){_injPart='전신';_injSide='';if(sw)sw.style.display='none';}
  else if(sw){ // 외상 — 현재 부위가 좌우 가능 부위면 좌/우 계속 노출
    sw.style.display=(_injPart&&_BILATERAL_PARTS.includes(_injPart))?'block':'none';
  }
}
function selInjPart(el,part){
  // 같은 부위 다시 누르면 해제
  if(_injPart===part){el.classList.remove('on');_injPart='';_injSide='';
    document.querySelectorAll('#injSidePills .pill').forEach(p=>p.classList.remove('on'));
    const sw0=document.getElementById('injSideWrap');if(sw0)sw0.style.display='none';return;}
  document.querySelectorAll('#injPartPills .pill').forEach(p=>p.classList.remove('on'));
  el.classList.add('on');_injPart=part;_injSide='';
  document.querySelectorAll('#injSidePills .pill').forEach(p=>p.classList.remove('on'));
  const sw=document.getElementById('injSideWrap');
  if(sw) sw.style.display=_BILATERAL_PARTS.includes(part)?'block':'none';
}
function selInjSide(el,side){
  // 같은 좌/우 다시 누르면 해제 (좌우 생략 = '팔목골절'처럼 압축 표기)
  if(_injSide===side){el.classList.remove('on');_injSide='';return;}
  document.querySelectorAll('#injSidePills .pill').forEach(p=>p.classList.remove('on'));
  el.classList.add('on');_injSide=side;
}
function addInjury(){
  if(!_injType){toast('부상 유형을 선택하세요');return;}
  let type=_injType;
  if(type==='직접입력'){
    const c=(document.getElementById('injTypeCustom')?.value||'').trim();
    if(!c){toast('부상·질환 내용을 직접 입력하세요');return;}
    type=c;
  }
  if(_injCat!=='내상'&&!_injPart){toast('부상 부위를 선택하세요');return;}
  const _nInj={type:type,part:_injCat==='내상'?'전신':_injPart,side:_injSide,cat:_injCat};
  if(_injDup(_nInj)){toast('이미 추가된 부상입니다');return;}
  _injuries.push(_nInj);
  _injType='';_injPart='';_injSide='';
  const ci=document.getElementById('injTypeCustom');if(ci)ci.value='';
  const cw=document.getElementById('injTypeCustomWrap');if(cw)cw.style.display='none';
  document.querySelectorAll('#injTypePills .pill,#injPartPills .pill,#injSidePills .pill').forEach(p=>p.classList.remove('on'));
  const pw=document.getElementById('injPartWrap');if(pw)pw.style.display=_injCat==='내상'?'none':'block';
  const sw=document.getElementById('injSideWrap');if(sw)sw.style.display='none';
  renderInjuries();
  try{autoGenTitle();}catch(e){}
}
function removeInjury(i){_injuries.splice(i,1);renderInjuries();try{autoGenTitle();}catch(e){}}
// ⚡ 자주 발생 부상 원터치 추가 — 실사고 통계 상위 조합을 한 번에 (세부는 기존 유형·부위 pill로 언제든 가능)
function quickInjury(type,part){
  const cat=(_INJ_TYPES['내상']||[]).includes(type)?'내상':'외상';
  const _q={type:type,part:cat==='내상'?'전신':(part||''),side:'',cat:cat};
  if(_injDup(_q)){toast('이미 추가된 부상입니다');if(typeof _hapt==='function')_hapt(8);return;}
  _injuries.push(_q);
  renderInjuries();
  try{autoGenTitle();}catch(e){}
  try{if(typeof _updateTabDots==='function')_updateTabDots();}catch(e){}
  if(typeof _hapt==='function')_hapt(8);
  toast('🩺 추가됨: '+((part&&part!=='전신')?part+' ':'')+type+' — 좌/우 등 세부는 아래에서 다시 추가 가능');
}
function renderInjuries(){
  const el=document.getElementById('injuryList');
  if(!el) return;
  if(!_injuries.length){el.innerHTML='';return;}
  el.innerHTML=_injuries.map((a,i)=>`
    <div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:#1c1c1e;border-radius:7px;margin-bottom:4px;border:1px solid rgba(255,255,255,.1);">
      <span style="font-size:10px;color:${a.cat==='내상'?'#c4b5fd':'#aab4c0'};font-weight:700;flex-shrink:0;">${a.cat==='내상'?'💊':'🩹'}</span>
      <span style="font-size:12px;flex:1;color:#eaecef;font-weight:600;">${_injLabel(a)}</span>
      <button onclick="removeInjury(${i})" style="background:none;border:none;color:#c0392b;font-size:15px;cursor:pointer;padding:0 2px;">×</button>
    </div>`).join('');
}

// 기상 특보
let _weatherAlerts=[];
let _wAlertType='';
let _wAlertLevel='';
function initWAlerts(prefill){
  const existing=(prefill&&prefill.weatherAlert)||'';
  _weatherAlerts=[];
  if(existing){
    existing.split(',').forEach(s=>{
      s=s.trim();if(!s)return;
      const lvs=['특보','경보','주의보'];
      for(const lv of lvs){if(s.endsWith(lv)){_weatherAlerts.push({type:s.slice(0,-lv.length),level:lv});return;}}
      _weatherAlerts.push({type:s,level:''});
    });
  } else {
    // 신규 보고 + 진행 중 특보운영(주의보·경보)이 있으면 그 특보를 자동 기록
    try{
      const _op=(DB.g('alertOps')||[]).find(o=>!o.closedAt);
      if(_op){
        const _al=(_op.alerts&&_op.alerts.length)?_op.alerts:(typeof _opAlerts==='function'?_opAlerts(_op):[]);
        const _seen={};
        _al.forEach(a=>{
          const st=a.stage||'';let lv='';
          if(st.indexOf('주의보')>=0)lv='주의보';
          else if(st.indexOf('경보')>=0||st.indexOf('Ⅲ')>=0)lv='경보';
          else return; // 예비특보 등은 자동 기록 제외
          const key=(a.type||'')+lv;if(_seen[key])return;_seen[key]=1;
          _weatherAlerts.push({type:a.type||'',level:lv});
        });
      }
    }catch(e){}
  }
  _wAlertType='';_wAlertLevel='';
  renderWAlerts();
}
function selWAlertType(el,type){
  document.querySelectorAll('#wAlertTypePills .pill').forEach(p=>p.classList.remove('on'));
  el.classList.add('on');_wAlertType=type;
}
function selWAlertLevel(el,level){
  document.querySelectorAll('#wAlertLevelPills .pill').forEach(p=>p.classList.remove('on'));
  el.classList.add('on');_wAlertLevel=level;
}
function addWAlert(){
  if(!_wAlertType){toast('종류를 선택하세요');return;}
  if(!_wAlertLevel){toast('단계를 선택하세요');return;}
  _weatherAlerts.push({type:_wAlertType,level:_wAlertLevel});
  _wAlertType='';_wAlertLevel='';
  document.querySelectorAll('#wAlertTypePills .pill,#wAlertLevelPills .pill').forEach(p=>p.classList.remove('on'));
  renderWAlerts();
}
function removeWAlert(i){_weatherAlerts.splice(i,1);renderWAlerts();}
function renderWAlerts(){
  const el=document.getElementById('wAlertList');
  if(!el) return;
  if(!_weatherAlerts.length){el.innerHTML='';return;}
  el.innerHTML=_weatherAlerts.map((a,i)=>`
    <div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:#1c1c1e;border-radius:7px;margin-bottom:4px;border:1px solid rgba(255,255,255,.1);">
      <span style="font-size:12px;flex:1;color:#eaecef;font-weight:600;">${a.type}${a.level}</span>
      <button onclick="removeWAlert(${i})" style="background:none;border:none;color:#c0392b;font-size:15px;cursor:pointer;padding:0 2px;">×</button>
    </div>`).join('');
}
function getWeatherAlertStr(){return _weatherAlerts.map(a=>a.type+a.level).join(', ');}

// 유관기관 동적 (카테고리+기관명+인원수)
let _fireAgencies=[]; // [{cat, name, count}]
let _agSelectedCat='';
let _agSubLoc='';
let _agSubType='';
function initFireAgencies(prefill){
  const raw=(prefill&&prefill.agencies&&prefill.agencies.fireAgencies)||[];
  // 이전 포맷({name}) → 새 포맷({cat,name,count}) 호환
  _fireAgencies=raw.map(a=>typeof a==='string'?{cat:'🚒 소방',name:a,count:0}:{cat:a.cat||'🏢 기타',name:a.name||'',count:a.count||0});
  _agSelectedCat='';_agSubLoc='';_agSubType='';
  renderFireAgencies();
}
function removeFireAgency(idx){
  _fireAgencies.splice(idx,1);
  renderFireAgencies();
}
function renderFireAgencies(){
  const el=document.getElementById('fireAgencyList');
  if(!el) return;
  if(!_fireAgencies.length){el.innerHTML='';return;}
  el.innerHTML=_fireAgencies.map((a,i)=>`
    <div style="display:flex;align-items:center;gap:6px;padding:7px 10px;background:#1c1c1e;border-radius:7px;margin-bottom:4px;border:1px solid rgba(255,255,255,.1);">
      <span style="font-size:10px;color:#565f6b;flex-shrink:0;">${_esc(a.cat)}</span>
      <span style="font-size:12px;flex:1;color:#eaecef;font-weight:600;">${_esc(a.name)}</span>
      ${a.count?`<span style="font-size:11px;color:#8b95a1;flex-shrink:0;">${_esc(a.count)}명</span>`:''}
      <button onclick="removeFireAgency(${i})" style="background:none;border:none;color:#c0392b;font-size:15px;cursor:pointer;padding:0 2px;">×</button>
    </div>`).join('');
}

// 환동해산악구조대 당직팀 계산 (기준: 2026-05-15 = 2팀, 9시~익일9시)
function getHwandonghaTeam(){
  const now=new Date();
  const ref=new Date(now);
  if(ref.getHours()<9) ref.setDate(ref.getDate()-1);
  ref.setHours(0,0,0,0);
  const base=new Date('2026-05-15T00:00:00');
  const dayDiff=Math.round((ref-base)/(24*3600*1000));
  return [2,3,1][((dayDiff%3)+3)%3];
}

// 야간(18시~익일9시) 시간대 여부 — 구조출동 응소 선택 UI 노출 기준
function _isOffHours(){
  const h=new Date().getHours();
  return h>=18||h<9;
}

// 유관기관 데이터 수집
function getAgencies(){
  return {
    hwandongha: document.getElementById('agHwChk')?.classList.contains('on')||false,
    hwTeam: parseInt(document.getElementById('hwTeamSel')?.value||'1'),
    hwMemberCount: parseInt(document.getElementById('hwMemberCount')?.value||'5'),
    fireAgencies: _fireAgencies,
  };
}

// 타임라인 누가 pill 선택
function selTTActor(el,actor){
  el.classList.toggle('on');
}


// ══════════════════════════════════════════
// 오프라인 지도 — 타일 캐시 관리 + 설악산 인근 미리받기
// sw.js가 daumcdn 타일을 cache-first로 저장한다(한 번 본 지도는 재방문 시 즉시 표시).
// 미리받기는 화면 밖 숨은 지도를 공원 전역으로 자동 이동시켜 그 저장을 미리 채우는 방식 —
// 타일 URL 규칙을 몰라도 SDK가 정상 요청을 만들므로 카카오 지도 개편에도 안전하다.
// ══════════════════════════════════════════
// 2단 캐시 — sw.js의 _TILES_PARK/_TILES_RECENT와 동일해야 함
// park=설악산 미리받기 보관함(다른 지역 열람에 안 밀림) · recent=일반 열람 임시(1,500장 상한 자동 정리)
const _TILE_CACHES=['seoraksan-tiles-park-1','seoraksan-tiles-recent-1'];
function _tileCacheCount(){
  if(!('caches' in window))return Promise.resolve(-1);
  return Promise.all(_TILE_CACHES.map(n=>caches.open(n).then(c=>c.keys()).then(ks=>ks.length).catch(()=>0)))
    .then(a=>a.reduce((s,x)=>s+x,0)).catch(()=>-1);
}
// 미리받기 진행 신호 — SW가 이후 20초간 타일을 '설악산 보관함'에 저장 (스텝마다 재호출로 연장)
function _tileParkMode(){try{navigator.serviceWorker.controller.postMessage({type:'TILE_MODE_PARK'});}catch(e){}}
function _updateTileCacheInfo(){
  const el=document.getElementById('tileCacheInfo');if(!el)return;
  _tileCacheCount().then(n=>{
    if(n<0){el.textContent='이 브라우저는 오프라인 지도 저장을 지원하지 않습니다';return;}
    el.innerHTML=n?`저장된 지도 타일: <b style="color:#7ec8a0;">${n}장</b> (약 ${(n*15/1024).toFixed(1)}MB) — 저장된 구역은 통신 없이도 즉시 표시`:'저장된 지도 타일 없음 — 지도를 보면 자동 저장되고, 아래 버튼으로 한 번에 채울 수 있습니다';
  });
}
function clearTileCache(){
  if(!confirm('저장된 오프라인 지도 타일을 모두 삭제하겠습니까?\n(지도가 다시 느려질 수 있습니다)'))return;
  Promise.all(_TILE_CACHES.map(n=>caches.delete(n))).then(()=>{toast('🗑️ 지도 캐시 삭제됨');_updateTileCacheInfo();});
}
let _tpAbort=false;
// 미리받기 진행창 크게/작게 전환
function _tpMinimize(min){
  const f=document.getElementById('tpFull'),m=document.getElementById('tpMini');
  if(f)f.style.display=min?'none':'block';
  if(m)m.style.display=min?'flex':'none';
}
// 자동 미리받기 — 7일마다 부팅 후 조용히 실행(요금 배려: 절약모드·확실한 셀룰러에선 건너뜀).
// 열람 타일 자동 저장과 함께 '깜빡임 없는 지도'의 양대 축: 설악산 일대는 보기 전에 미리 받아둔다.
function _autoPreloadParkTiles(){
  try{
    var mode=localStorage.getItem('_tileAutoMode')||'wifi'; // 설정: wifi(기본)/always/off
    if(mode==='off')return;
    if(document.getElementById('tpOv'))return;
    var last=parseInt(localStorage.getItem('_tpAutoAt2')||'0',10); // v2: 위성 타일 포함으로 바뀌어 전 기기 1회 재실행
    if(Date.now()-last<7*86400000)return;
    if(mode!=='always'){
      var c=navigator.connection||{};
      if(c.saveData)return;
      if(c.type&&c.type!=='wifi'&&c.type!=='ethernet')return;
    }
    if(!navigator.onLine)return;
    localStorage.setItem('_tpAutoAt2',String(Date.now()));
    preloadParkTiles(true);
  }catch(e){}
}
function _setTileAutoMode(m){
  try{localStorage.setItem('_tileAutoMode',m);}catch(e){}
  toast(m==='off'?'🔕 지도 자동 저장 끔':m==='always'?'🔁 항상 자동 저장 (요금제 주의)':'📶 와이파이에서만 자동 저장');
  try{renderSettings();}catch(e){}
}
function preloadParkTiles(auto){
  // 오프라인 대비: 지도 타일과 함께 암벽 당일명단도 미리 받아둔다(무통신 산악지역 현장 확인용)
  try{if(typeof _climbLoadAll==='function')_climbLoadAll().catch(function(){});}catch(e){}
  if(!('caches' in window)||!('serviceWorker' in navigator)){if(!auto)toast('⚠️ 이 브라우저는 오프라인 저장을 지원하지 않습니다');return;}
  if(!navigator.serviceWorker.controller){if(!auto)toast('⚠️ 저장 준비가 아직 안 됐습니다 — 앱을 완전히 닫았다 다시 열어 재시도하세요');return;}
  if(!(window.kakao&&kakao.maps&&window._KR)){if(!auto)toast('⚠️ 지도가 아직 로드되지 않았습니다 — 잠시 후 재시도');return;}
  if(document.getElementById('tpOv'))return; // 이미 실행 중
  // 공원 경계 bbox + 여유(진입로·인접 마을) — 경계 미로딩 시 설악산 일대 고정값
  let bb={minLat:38.004,maxLat:38.264,minLng:128.255,maxLng:128.584};
  try{
    if(_parkBoundary&&_parkBoundary.rings){
      let a=999,b=-999,c=999,d=-999;
      _parkBoundary.rings.forEach(ring=>ring.forEach(p=>{if(p[1]<a)a=p[1];if(p[1]>b)b=p[1];if(p[0]<c)c=p[0];if(p[0]>d)d=p[0];}));
      bb={minLat:a,maxLat:b,minLng:c,maxLng:d};
    }
  }catch(e){}
  const PAD=0.015;bb.minLat-=PAD;bb.maxLat+=PAD;bb.minLng-=PAD;bb.maxLng+=PAD;
  _tileParkMode(); // 지금부터 받는 타일은 설악산 보관함으로
  // 화면 밖 숨은 지도 — 여기서 발생하는 타일 요청을 SW가 저장
  const host=document.createElement('div');
  host.style.cssText='position:fixed;left:-2200px;top:0;width:1024px;height:1024px;pointer-events:none;';
  document.body.appendChild(host);
  const ctr=new kakao.maps.LatLng((bb.minLat+bb.maxLat)/2,(bb.minLng+bb.maxLng)/2);
  const map=new kakao.maps.Map(host,{center:ctr,level:10});
  map.setMapTypeId(kakao.maps.MapTypeId.HYBRID);window._tpCurHy=true; // 기본 화면(위성+라벨)과 같은 타일부터 저장
  // 배율(레벨)별 화면이 덮는 범위를 실측해 이동 계획 수립 — 넓은 배율부터 상세 배율로, 총 이동 상한
  const STEP_CAP=380; // 확대(상세) 배율까지 더 넓게 미리 저장 → 현장 확대 시 흰 화면 최소화
  const plan=[];let total=0;
  for(let lv=10;lv>=2;lv--){
    map.setLevel(lv);map.setCenter(ctr);
    const b=map.getBounds(),sw=b.getSouthWest(),ne=b.getNorthEast();
    const spanLat=(ne.getLat()-sw.getLat())*0.9,spanLng=(ne.getLng()-sw.getLng())*0.9; // 10% 겹침
    if(spanLat<=0||spanLng<=0)break;
    const rows=Math.max(1,Math.ceil((bb.maxLat-bb.minLat)/spanLat));
    const cols=Math.max(1,Math.ceil((bb.maxLng-bb.minLng)/spanLng));
    if(total+rows*cols>STEP_CAP)break; // 이보다 상세한 배율은 평소 사용 중 자동 저장에 맡김
    plan.push({level:lv,rows,cols,spanLat,spanLng});
    total+=rows*cols;
  }
  const stepsOne=[];
  plan.forEach(p=>{
    for(let r=0;r<p.rows;r++)for(let c=0;c<p.cols;c++)
      stepsOne.push({level:p.level,lat:Math.min(bb.minLat+p.spanLat*(r+.5),bb.maxLat),lng:Math.min(bb.minLng+p.spanLng*(c+.5),bb.maxLng)});
  });
  // 위성(기본 화면)과 일반지도 두 벌 저장 — 예전엔 일반지도만 받아서 위성 모드에선 캐시가 비어
  // 확대/축소 때마다 주변이 베이지색으로 남는(영상 확인) 원인이었음
  const steps=stepsOne.map(s=>Object.assign({},s,{mt:'H'})).concat(stepsOne.map(s=>Object.assign({},s,{mt:'R'})));
  if(!steps.length){host.remove();toast('⚠️ 이동 계획 생성 실패 — 다시 시도하세요');return;}
  // 진행 표시
  _tpAbort=false;
  // 진행 표시 — 자동 실행은 작은 알약으로 시작(방해 없음), 수동 실행은 카드로. — 버튼/탭으로 상호 전환
  const ov=document.createElement('div');ov.id='tpOv';
  ov.style.cssText='position:fixed;right:12px;left:12px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:9700;pointer-events:none;display:flex;justify-content:flex-end;';
  ov.innerHTML='<div id="tpFull" style="display:'+(auto?'none':'block')+';pointer-events:auto;width:100%;max-width:430px;background:#16161a;border:1px solid rgba(255,255,255,.35);border-radius:12px;padding:12px 14px;box-shadow:0 6px 24px rgba(0,0,0,.5);">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:6px;"><b style="font-size:12.5px;color:#eaecef;">🗺️ '+(auto?'지도 자동 저장 중 (설악산 인근)':'설악산 인근 지도 미리받기')+'</b><span style="display:flex;gap:6px;flex-shrink:0;">'
    +'<button onclick="_tpMinimize(1)" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.15);color:#9fb6c8;border-radius:7px;padding:4px 11px;font-size:11px;font-weight:800;cursor:pointer;" title="작게 보기">—</button>'
    +'<button id="tpCancel" style="background:rgba(231,76,60,.12);border:1px solid rgba(231,76,60,.3);color:#ff8a73;border-radius:7px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;">중지</button></span></div>'
    +'<div style="height:6px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden;"><div id="tpBar" style="height:100%;width:0%;background:#3182f6;transition:width .3s;"></div></div>'
    +'<div id="tpTxt" style="font-size:10.5px;color:#78828e;margin-top:6px;">총 '+steps.length+'개 구역 준비 중... (다른 작업 하셔도 됩니다)</div></div>'
    +'<div id="tpMini" onclick="_tpMinimize(0)" title="탭하면 크게" style="display:'+(auto?'flex':'none')+';pointer-events:auto;align-items:center;gap:5px;background:rgba(10,24,40,.92);border:1px solid rgba(255,255,255,.35);border-radius:16px;padding:6px 12px;font-size:11px;font-weight:800;color:#a5abb3;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.4);">🗺️ <span id="tpMiniPct">0%</span></div>';
  document.body.appendChild(ov);
  document.getElementById('tpCancel').onclick=()=>{_tpAbort=true;};
  let i=0,pending=null;
  const onTiles=()=>{if(pending)pending();};
  kakao.maps.event.addListener(map,'tilesloaded',onTiles);
  const cleanup=msg=>{
    try{kakao.maps.event.removeListener(map,'tilesloaded',onTiles);}catch(e){}
    try{host.remove();}catch(e){}
    try{ov.remove();}catch(e){}
    _updateTileCacheInfo();
    _tileCacheCount().then(n=>toast(msg+(n>0?' — 저장된 타일 '+n+'장':''),4500));
  };
  const runStep=()=>{
    if(_tpAbort)return cleanup('⏹️ 미리받기 중지됨 (받은 만큼은 저장됨)');
    if(i>=steps.length)return cleanup('✅ 지도 미리받기 완료');
    const s=steps[i];let done=false;
    const advance=()=>{
      if(done)return;done=true;pending=null;clearTimeout(to);
      i++;
      const pct=Math.round(i/steps.length*100);
      const bar=document.getElementById('tpBar'),txt=document.getElementById('tpTxt'),mp=document.getElementById('tpMiniPct');
      if(bar)bar.style.width=pct+'%';
      if(txt)txt.textContent=(s.mt==='R'?'일반':'위성')+' 배율 '+s.level+' · '+i+' / '+steps.length+' 구역';
      if(mp)mp.textContent=pct+'%';
      setTimeout(runStep,120); // 타일 서버 부담 완화
    };
    pending=advance;
    const to=setTimeout(advance,4000); // tilesloaded 유실·전체 캐시 히트 대비
    _tileParkMode(); // 보관함 지정 연장 (20초 시한 — 스텝마다 갱신)
    const wantHy=s.mt!=='R';
    if(window._tpCurHy!==wantHy){window._tpCurHy=wantHy;map.setMapTypeId(wantHy?kakao.maps.MapTypeId.HYBRID:kakao.maps.MapTypeId.ROADMAP);}
    if(map.getLevel()!==s.level)map.setLevel(s.level);
    map.setCenter(new kakao.maps.LatLng(s.lat,s.lng));
  };
  setTimeout(runStep,600); // 최초 지도 로드 후 시작
}
