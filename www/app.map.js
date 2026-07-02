'use strict';
// ══════════════════════════════════════════
// 카카오맵
// ══════════════════════════════════════════
let mapI,mapR,iOvs=[],rOvs=[],iEls=[],rEls=[],myOv=null,mapIType='hybrid',mapRType='hybrid';
function _pinSz(level,off){
  const o=off||0;
  if(level<=3) return {sz:30+o,fs:13,bw:2,  numFs:11,numPad:'2px 5px'};
  if(level<=4) return {sz:26+o,fs:11,bw:2,  numFs:10,numPad:'2px 4px'};
  if(level<=5) return {sz:22+o,fs:9, bw:1.5,numFs:9, numPad:'2px 3px'};
  if(level<=6) return {sz:18+o,fs:8, bw:1.5,numFs:8, numPad:'1px 3px'};
  if(level<=7) return {sz:14+o,fs:6, bw:1,  numFs:7, numPad:'1px 2px'};
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
      el.style.width=s.sz+'px';el.style.height=s.sz+'px';
      el.style.fontSize=s.fs+'px';el.style.borderWidth=s.bw+'px';
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
    let lat=0,lng=0;group.forEach(it=>{lat+=it.lat;lng+=it.lng;});lat/=group.length;lng/=group.length;
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
    return '<div onclick="(function(){var e=document.getElementById(\'clusListModal\');if(e)e.remove();openResPopup(\''+_escq(String(it.id))+'\',\''+it.type+'\');})()" style="display:flex;align-items:center;gap:8px;padding:11px;border-radius:9px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);margin-bottom:6px;cursor:pointer;"><span style="font-size:16px;">'+ico+'</span><span style="font-size:12px;color:#e0edf8;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(it.title||'(제목없음)')+'</span><span style="font-size:10px;font-weight:700;color:'+(og?'#ff6b5e':(it.type==='hazard'?'#e67e22':'#7a9cb8'))+';flex-shrink:0;">'+tag+'</span></div>';
  }).join('');
  m.innerHTML='<div style="background:#0a1828;border:1px solid rgba(79,168,208,.25);border-radius:14px;max-width:340px;width:100%;max-height:70vh;overflow-y:auto;padding:14px;">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span style="font-size:14px;font-weight:800;color:#e0edf8;">📍 같은 위치 '+items.length+'건</span><button onclick="var e=document.getElementById(\'clusListModal\');if(e)e.remove();" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:22px;cursor:pointer;line-height:1;">×</button></div>'
    +rows+'</div>';
  m.onclick=function(e){if(e.target===m)m.remove();};
}
function _clusterZoom(map,lat,lng){
  try{map.setLevel(Math.max(1,map.getLevel()-2),{anchor:new kakao.maps.LatLng(lat,lng)});}
  catch(e){try{map.setCenter(new kakao.maps.LatLng(lat,lng));map.setLevel(Math.max(1,map.getLevel()-2));}catch(e2){}}
}
// 구조 지도: 사고/위험 '상황' 핀만 클러스터 (다목적위치표지판 등 시설물은 제외)
var _rClusterOvs=[],_rEvItems=[];
function _reclusterRescue(){
  if(!mapR)return;
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
  // 줌 아웃일수록 셀을 키워 더 적극적으로 묶음 → 멀리서 볼 때 핀 수 급감, 지도 부드러움
  let lv=9;try{lv=mapI.getLevel();}catch(e){}
  const cell=lv>=10?80:lv>=8?64:lv>=6?52:44;
  _iClusterOvs=_clusterByPixels(mapI,_iItems,cell,(la,ln)=>_clusterZoom(mapI,la,ln),'fac');
}
const DC={lat:38.1328,lng:128.4107};
// HTML/attribute escaping for user-generated content
function _esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function _escq(s){return String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/</g,'&lt;');}
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
    _cachedRescueSigns=(DB.g('facilities')||[]).filter(function(f){
      return f.lat&&f.lng&&f.type&&(_m[f.type]||{}).rescue;
    });
  }
  var best=null,bestD=Infinity;
  _cachedRescueSigns.forEach(function(f){var d=_haversine(lat,lng,f.lat,f.lng);if(d<bestD){bestD=d;best=f;}});
  if(!best||bestD>3000)return null;
  var label=best.type.includes('다목적위치표지판')
    ?(best.name.match(/\d[\d\-]*\d|\d/)||[best.name.slice(0,6)])[0]
    :best.name;
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
function initMaps(){
  function doInit(){
    if(mapR&&mapI)return; // Guard: don't recreate if already initialized
    const c=new kakao.maps.LatLng(DC.lat,DC.lng),opt={center:c,level:9};
    mapI=new kakao.maps.Map(document.getElementById('mapInspect'),opt);
    mapR=new kakao.maps.Map(document.getElementById('mapRescue'),opt);
    mapI.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
    mapR.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
    kakao.maps.event.addListener(mapI,'click',closeDB);
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
          const _e=(typeof _elevStr==='function')?_elevStr(lat,lng):'';
          if(cd)cd.innerHTML=lat.toFixed(5)+', '+lng.toFixed(5)+(_e?' <span style="color:#a7f3e4;">'+_e+'</span>':'')+(_s?'<br><span style="color:#f0c040;font-size:9.5px;">📍 '+_s+'</span>':'');
          _updateZoneBadge(lat,lng,'rescueZoneBadge');
        },300);
      }catch(e){}
    }
    kakao.maps.event.addListener(mapR,'center_changed',saveMapCenter);
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
    kakao.maps.event.addListener(mapI,'center_changed',saveInspectCenter);
    saveInspectCenter();
    // 줌 레벨에 따른 핀 크기 자동 조절
    kakao.maps.event.addListener(mapR,'zoom_changed',()=>{_scaleOvs(rEls,mapR.getLevel(),5);try{_reclusterRescue();}catch(e){}});
    kakao.maps.event.addListener(mapI,'zoom_changed',()=>{_scaleOvs(iEls,mapI.getLevel(),1);try{_reclusterInspect();}catch(e){}});
    if(window._hideLoading)setTimeout(window._hideLoading,600);
  }
  if(window._KR){doInit();return;}
  window._KCB=doInit;
  // 12초 지나도 SDK가 준비 안 되면(도메인 미등록·네트워크 차단 등) 빈 화면 대신
  // 안내 문구 + 새로고침 버튼 표시 (기존엔 아무 표시 없이 그냥 빈 화면이었음)
  if(!window._mapFallbackTimer){
    window._mapFallbackTimer=setTimeout(function(){
      if(mapR&&mapI)return;
      var html='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#7a9cb8;font-size:13px;text-align:center;padding:20px;gap:8px;">'+
        '<div>⚠️ 지도를 불러올 수 없습니다</div>'+
        '<div style="font-size:11px;color:#4a7090;">네트워크 연결을 확인해주세요</div>'+
        '<button onclick="location.reload()" style="margin-top:4px;background:#1d6fa5;color:#fff;border:none;padding:8px 16px;border-radius:8px;font-size:12px;cursor:pointer;">새로고침</button>'+
        '</div>';
      ['mapInspect','mapRescue'].forEach(function(id){
        var el=document.getElementById(id);
        if(el)el.innerHTML=html;
      });
    },12000);
  }
}
function rMaps(){
  // 지도 컨테이너 크기를 부모에 맞게 강제 설정
  ['mapRescue','mapInspect'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.style.width='100%';el.style.height='100%';}
  });
  _applyMapVOff(); // 하단바 기준 활성지점 오프셋(십자선 위치) 갱신
  setTimeout(()=>{
    try{if(mapI){mapI.relayout();}}catch(e){}
    try{if(mapR){mapR.relayout();}}catch(e){}
    _applyMapVOff();
    try{if(typeof window._saveMapCenter==='function')window._saveMapCenter();}catch(e){}
  },150);
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
    el.style.cssText='width:18px;height:18px;border-radius:50%;background:#4fa8d0;border:3px solid #fff;box-shadow:0 0 10px rgba(79,168,208,.8),0 2px 6px rgba(0,0,0,.5);';
    myOv=new kakao.maps.CustomOverlay({position:ll,content:el});myOv.setMap(m);
    const _alt=(p.coords.altitude!=null&&isFinite(p.coords.altitude))?Math.round(p.coords.altitude):null;
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
  showV('v-board');
  document.getElementById('appHdr').style.display='none';
  document.getElementById('bnav').style.display='none';
  // 상세 패널 닫고 목록 표시 상태로 초기화
  _boardDetailId=null;
  const _bd=document.getElementById('boardDetail');if(_bd)_bd.style.display='none';
  const _bb=document.getElementById('boardBody');if(_bb)_bb.style.display='';
  setTimeout(_initBoardMap,250);
  renderBoard();
  clearInterval(_boardTimer);
  _boardTimer=setInterval(()=>{
    if(!document.getElementById('v-board').classList.contains('on')){clearInterval(_boardTimer);return;}
    renderBoard();
  },10000);
  history.pushState({view:'board'},'','');
}
function closeBoard(){clearInterval(_boardTimer);goHome();}

// 상황판 지도: 진행중 구조/위험 핀 표시
let _boardMap=null,_boardOvs=[],_boardResizeBound=false;
function _initBoardMap(){
  const el=document.getElementById('boardMap');
  if(!el||!window._KR)return;
  if(!_boardMap){
    try{
      _boardMap=new kakao.maps.Map(el,{center:new kakao.maps.LatLng(DC.lat,DC.lng),level:9});
      _boardMap.setMapTypeId(kakao.maps.MapTypeId.HYBRID); // HYBRID: 위성+벡터 — 타일 이음새가 벡터 레이어로 덮여 세로줄 없음
    }catch(e){console.warn('boardMap',e);return;}
  }else{
    _boardMap.relayout();
  }
  // 창 크기 변경(모니터 회전·해상도 변경) 시 relayout
  if(!_boardResizeBound){
    _boardResizeBound=true;
    window.addEventListener('resize',()=>{try{if(_boardMap&&document.getElementById('v-board').classList.contains('on'))_boardMap.relayout();}catch(e){}});
  }
  _renderBoardPins(true); // 최초 1회만 전체 범위에 맞춤
  setTimeout(()=>{try{_boardMap&&_boardMap.relayout();}catch(e){}},200);
}
function _renderBoardPins(fit){
  if(!_boardMap)return;
  _boardOvs.forEach(o=>{try{o.setMap(null);}catch(e){}});_boardOvs=[];
  const bounds=new kakao.maps.LatLngBounds();let n=0;
  (DB.g('rescues')||[]).filter(r=>r.status==='ongoing'&&r.lat&&r.lng).forEach(r=>{
    const ti=RES_TYPES[r.type]||RES_TYPES['기타'];
    const el=document.createElement('div');
    el.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
      <div style="background:#c0392b;border:2px solid #fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 2px 8px rgba(0,0,0,.6);animation:blink 1.2s infinite;">${ti.ico}</div>
      <div style="margin-top:3px;background:rgba(10,22,38,.92);border:1px solid rgba(192,57,43,.5);color:#e0edf8;border-radius:8px;padding:2px 8px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 1px 5px rgba(0,0,0,.5);">${_esc(r.title)}</div></div>`;
    el.onclick=()=>_boardFocus(r.id);
    const pos=new kakao.maps.LatLng(r.lat,r.lng);
    const ov=new kakao.maps.CustomOverlay({position:pos,content:el,yAnchor:1,zIndex:5,clickable:true});
    ov.setMap(_boardMap);_boardOvs.push(ov);bounds.extend(pos);n++;
    // 팀 현재 위치 칩
    (r.teams||[]).forEach((t,ti2)=>{
      const cur=(t.wps||[])[t.wpIdx];
      if(!cur||!cur.lat||!cur.lng)return;
      const col=TEAM_COLORS[ti2%TEAM_COLORS.length];
      const tel=document.createElement('div');
      tel.innerHTML=`<div style="background:${col};border:1.5px solid #fff;color:#fff;border-radius:11px;padding:1px 7px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.5);">${_teamIco(t)} ${_shortTeamName(t.name)}</div>`;
      const tpos=new kakao.maps.LatLng(cur.lat,cur.lng);
      const tov=new kakao.maps.CustomOverlay({position:tpos,content:tel,yAnchor:-0.2,zIndex:6});
      tov.setMap(_boardMap);_boardOvs.push(tov);bounds.extend(tpos);
    });
  });
  (DB.g('hazards')||[]).filter(h=>h.lat&&h.lng&&(!h.hazStatus||h.hazStatus==='미조치'||h.hazStatus==='조치중')).forEach(h=>{
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
    const code=(f.name.match(/\d[\d\-]*\d|\d/)||[f.name.slice(0,6)])[0];
    const el=document.createElement('div');
    el.innerHTML=`<div style="background:rgba(10,30,55,.85);border:1px solid rgba(79,168,208,.6);color:#7dd3fa;border-radius:5px;padding:1px 5px;font-size:9px;font-weight:700;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.5);cursor:default;">${_esc(code)}</div>`;
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
  const haz=(DB.g('hazards')||[]).filter(h=>!h.hazStatus||h.hazStatus==='미조치'||h.hazStatus==='조치중');
  const hazUnhandled=haz.filter(h=>!h.hazStatus||h.hazStatus==='미조치').length; // 손도 안 댄 미조치 — 강조 대상
  const _td=today();
  const todayList=res.filter(r=>(r.date||'').slice(0,10)===_td).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const recentList=res.filter(r=>(r.date||'').slice(0,10)!==_td).sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,15);
  const stageLbl=['출발','이동중','환자조우','하산'];
  const stageCol=['rgba(255,255,255,.45)','#4fa8d0','#f0a500','#27ae60'];
  const aops=DB.g('alertOps')||[];
  const activeOp=aops.find(o=>!o.closedAt);
  const opRespCnt=activeOp?(activeOp.responders||[]).length:0;
  const ts=DB.g('trailStatus')||{};
  const trailCtrlCnt=Object.values(ts).filter(v=>v.status==='통제').length;
  const trailWarnCnt=Object.values(ts).filter(v=>v.status==='주의').length;
  const trailActive=_boardView==='trail';
  const rescueActive=_boardView==='rescue', hazActive=_boardView==='hazard', alertActive=_boardView==='alert';
  let html='';
  // 요약 스트립 (클릭 시 하단 카드 영역 전환)
  html+=`<div style="display:flex;gap:10px;margin-bottom:16px;">
    <div onclick="setBoardView('rescue')" style="flex:1;background:${ongoing.length?'rgba(192,57,43,.12)':'rgba(39,174,96,.08)'};border:1px solid ${rescueActive?(ongoing.length?'rgba(192,57,43,.9)':'rgba(39,174,96,.75)'):(ongoing.length?'rgba(192,57,43,.4)':'rgba(39,174,96,.25)')};border-radius:12px;padding:12px 16px;text-align:center;cursor:pointer;transition:all .15s;${rescueActive?'box-shadow:inset 0 0 0 2px rgba(192,57,43,.3);':''}">
      <div style="font-size:30px;font-weight:900;color:${ongoing.length?'#e05050':'#27ae60'};">${ongoing.length}</div>
      <div style="font-size:12px;color:${rescueActive?'#e0edf8':'rgba(255,255,255,.5)'};font-weight:${rescueActive?'700':'400'};">🚨 진행중 구조${rescueActive?' ▾':''}</div>
    </div>
    <div onclick="setBoardView('hazard')" style="position:relative;flex:1;background:${hazUnhandled?'rgba(231,76,60,.12)':'rgba(230,126,34,.08)'};border:1px solid ${hazActive?(hazUnhandled?'rgba(231,76,60,.9)':'rgba(230,126,34,.9)'):(hazUnhandled?'rgba(231,76,60,.5)':'rgba(230,126,34,.25)')};border-radius:12px;padding:12px 16px;text-align:center;cursor:pointer;transition:all .15s;${hazActive?'box-shadow:inset 0 0 0 2px rgba(230,126,34,.3);':''}">
      ${hazUnhandled?`<span style="position:absolute;top:6px;right:6px;background:#e74c3c;color:#fff;font-size:10px;font-weight:800;border-radius:10px;padding:1px 7px;box-shadow:0 0 0 2px rgba(231,76,60,.25);animation:blink 1.2s infinite;">미조치 ${hazUnhandled}</span>`:''}
      <div style="font-size:30px;font-weight:900;color:${hazUnhandled?'#e05050':'#e67e22'};">${haz.length}</div>
      <div style="font-size:12px;color:${hazActive?'#e0edf8':'rgba(255,255,255,.5)'};font-weight:${hazActive?'700':'400'};">⚠️ 미조치 위험상황${hazActive?' ▾':''}</div>
    </div>
    <div onclick="setBoardView('alert')" style="flex:1;background:${activeOp?'rgba(79,168,208,.12)':'rgba(39,174,96,.08)'};border:1px solid ${alertActive?(activeOp?'rgba(79,168,208,.9)':'rgba(39,174,96,.75)'):(activeOp?'rgba(79,168,208,.45)':'rgba(39,174,96,.25)')};border-radius:12px;padding:12px 16px;text-align:center;cursor:pointer;transition:all .15s;${alertActive?'box-shadow:inset 0 0 0 2px rgba(79,168,208,.3);':''}">
      <div style="font-size:30px;font-weight:900;color:${activeOp?'#4fa8d0':'#27ae60'};">${activeOp?opRespCnt:0}</div>
      <div style="font-size:12px;color:${alertActive?'#e0edf8':'rgba(255,255,255,.5)'};font-weight:${alertActive?'700':'400'};">🌀 ${activeOp?'특보 응소':'특보운영'}${alertActive?' ▾':''}</div>
    </div>
  </div>
  ${trailCtrlCnt||trailWarnCnt?`<div onclick="setBoardView('trail')" style="display:flex;align-items:center;gap:12px;background:rgba(231,76,60,.1);border:1px solid ${trailActive?'rgba(231,76,60,.85)':'rgba(231,76,60,.35)'};border-radius:12px;padding:10px 16px;margin-bottom:10px;cursor:pointer;">
    <div style="font-size:26px;font-weight:900;color:#e74c3c;">${trailCtrlCnt}</div>
    <div>
      <div style="font-size:13px;font-weight:800;color:#e0edf8;">🚧 탐방로 통제 중${trailActive?' ▾':''}</div>
      <div style="font-size:11px;color:#ff9e80;margin-top:2px;">통제 ${trailCtrlCnt}구간${trailWarnCnt?' · 주의 '+trailWarnCnt+'구간':''}</div>
    </div>
  </div>`:''}`;
  if(trailActive){
    const zones=[...new Set(SEORAK_TRAILS.map(t=>t.zone))];
    html+=`<div style="background:#0a1626;border:1.5px solid rgba(231,76,60,.4);border-radius:14px;padding:16px 18px;">
      <div style="font-size:16px;font-weight:900;color:#e74c3c;margin-bottom:12px;">🚧 탐방로 통제 현황</div>`;
    zones.forEach(z=>{
      const zTrails=SEORAK_TRAILS.filter(t=>t.zone===z);
      html+=`<div style="font-size:10px;color:#5a7e98;font-weight:800;letter-spacing:.5px;margin:8px 0 4px;">${z.toUpperCase()}</div>`;
      zTrails.forEach(t=>{
        const st=(ts[t.id]||{}).status||'개방';
        const col=TRAIL_STATUS_COLORS[st]||'#27ae60';
        html+=`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-top:1px solid rgba(255,255,255,.04);">
          <span style="width:8px;height:8px;border-radius:50%;background:${col};flex-shrink:0;box-shadow:0 0 6px ${col}66;"></span>
          <span style="font-size:12px;color:${st==='개방'?'rgba(255,255,255,.55)':'#e0edf8'};flex:1;">${_esc(t.name)}</span>
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
      const chips=al.map(a=>`<span style="display:inline-block;font-size:13px;font-weight:800;color:#7dd3fa;background:rgba(79,168,208,.14);border:1px solid rgba(79,168,208,.3);border-radius:7px;padding:4px 10px;margin:0 5px 5px 0;">${_esc(a.type)} ${_stageShort(a.stage)}</span>`).join('');
      const elp=_elapsedStr(activeOp.startedAt);
      const resps=activeOp.responders||[];
      const groupRows=ALERT_GROUPS.map(g=>{
        const locs=g.stations.map(s=>s.loc);
        const list=resps.filter(r=>locs.includes(r.loc||'사무소'));
        return {name:g.name,ico:g.ico,cnt:list.length,names:list.map(r=>_esc(r.name)).join(', ')};
      });
      const reps=(activeOp.reports||[]).slice().sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,6);
      html+=`<div style="background:#0a1626;border:1.5px solid rgba(79,168,208,.4);border-radius:14px;padding:16px 18px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:11px;">
          <span style="font-size:18px;font-weight:900;color:#7dd3fa;"><span class="ao-pulse" style="display:inline-block;vertical-align:middle;margin-right:5px;"></span>특보운영 중</span>
          ${elp?`<span class="js-elapsed" data-d="${_esc(activeOp.startedAt)}" style="font-size:15px;font-weight:800;color:#f0a500;font-family:monospace;">⏱ ${elp}</span>`:''}
        </div>
        <div style="margin-bottom:13px;">${chips||'<span style="font-size:12px;color:#456a85;">발령된 특보 없음</span>'}</div>
        <div style="font-size:13px;color:#9bbdd4;font-weight:700;margin-bottom:4px;">👤 분소별 응소 (총 ${resps.length}명)</div>
        ${groupRows.map(gr=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid rgba(255,255,255,.05);">
          <span style="font-size:13px;font-weight:700;color:#cfe2f2;min-width:118px;flex-shrink:0;">${gr.ico} ${_esc(gr.name)}</span>
          <span style="font-size:14px;font-weight:800;color:${gr.cnt?'#5dbf8a':'rgba(255,255,255,.22)'};min-width:42px;flex-shrink:0;">${gr.cnt}명</span>
          <span style="font-size:12px;color:#7a9cb8;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${gr.names||'-'}</span>
        </div>`).join('')}
        ${(()=>{
          // 체류인원 요약 — 대피소(shelter) 위치만 집계
          const shelterLocs=new Set(ALERT_STATIONS.filter(s=>s.shelter).map(s=>s.loc));
          const occMap={};(activeOp.occupancy||[]).filter(o=>shelterLocs.has(o.loc||'')).forEach(o=>{const k=o.loc;if(!occMap[k]||(o.at||0)>(occMap[k].at||0))occMap[k]=o;});
          const occEntries=Object.entries(occMap);
          if(!occEntries.length)return'';
          const totalV=occEntries.reduce((s,[,o])=>s+(o.visitors||0),0);
          return`<div style="font-size:13px;color:#9bbdd4;font-weight:700;margin:13px 0 4px;">⛺ 대피소 체류인원 (탐방객 총 ${totalV}명)</div>
          ${occEntries.map(([loc,o])=>`<div style="display:flex;gap:8px;font-size:12px;padding:4px 0;border-top:1px solid rgba(255,255,255,.04);">
            <span style="color:#5a7e98;min-width:100px;flex-shrink:0;">${_esc(_stationLabel(loc))}</span>
            <span style="color:#7ec8a0;font-weight:700;">직원 ${o.staff??'-'}명</span>
            <span style="color:#a8cdf5;font-weight:700;">탐방객 ${o.visitors??'-'}명</span>
            <span style="color:#4a7090;font-size:10px;">${(o.time||'').slice(11,16)}</span>
          </div>`).join('')}`;
        })()}
        ${reps.length?`<div style="font-size:13px;color:#9bbdd4;font-weight:700;margin:13px 0 4px;">📊 최근 관측 (누적)</div>
          ${reps.map(r=>`<div style="display:flex;gap:10px;font-size:12px;padding:4px 0;border-top:1px solid rgba(255,255,255,.04);">
            <span style="color:#5a7e98;min-width:96px;flex-shrink:0;">${_esc(_stationLabel(r.loc))}</span>
            <span style="color:#7a9cb8;min-width:46px;flex-shrink:0;">${_esc((r.time||'').slice(11,16))}</span>
            <span style="color:#cfe2f2;font-weight:700;">${r.snow!=null&&r.snow!==''?'❄️ '+_esc(r.snow)+'cm  ':''}${r.rain!=null&&r.rain!==''?'🌧️ '+_esc(r.rain)+'mm':''}</span>
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
        <button onclick="closeBoard();openApp('alert');" style="width:100%;margin-top:13px;padding:9px;border-radius:9px;border:1px solid rgba(79,168,208,.35);background:rgba(79,168,208,.1);color:#4fa8d0;font-size:13px;font-weight:700;cursor:pointer;">🌀 특보운영 상세 열기</button>
      </div>`;
    }
  } else if(hazActive){
    if(!haz.length){
      html+=`<div style="text-align:center;padding:50px 0 30px;font-size:17px;color:rgba(255,255,255,.3);">✅ 미조치 위험상황 없음</div>`;
    }
    haz.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).forEach(h=>{
      const hasCoord=!!(h.lat&&h.lng);
      html+=`<div onclick="_boardFocusHaz(${h.id})" style="background:#0a1626;border:1.5px solid rgba(230,126,34,.35);border-radius:14px;padding:13px 16px;margin-bottom:10px;cursor:pointer;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="font-size:16px;font-weight:800;color:#e0edf8;">${h.hazType?.split(' ')[0]||'⚠️'} ${_esc((h.hazType||'위험상황').replace(/^\S+\s/,''))||'위험상황'}</div>
          <span style="flex-shrink:0;font-size:11px;font-weight:800;color:#e67e22;background:rgba(230,126,34,.14);border-radius:6px;padding:3px 8px;">${_esc(h.hazStatus||'미조치')}</span>
        </div>
        <div style="font-size:13px;color:#7aa8c8;margin-top:5px;">📍 ${_esc(h.loc||'위치 미상')}${h.danger?' · '+_esc(h.danger):''}${h.date?' · '+h.date:''}</div>
        ${h.desc?`<div style="font-size:12px;color:#7a9cb8;margin-top:6px;line-height:1.5;">${_esc((h.desc||'').slice(0,80))}${(h.desc||'').length>80?'…':''}</div>`:''}
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
    const lastLog=(r.wpLog||[]).slice(-1)[0];
    html+=`<div style="background:#0a1626;border:1.5px solid rgba(192,57,43,.35);border-radius:14px;padding:14px 16px;margin-bottom:12px;">
      <div onclick="_boardFocus(${r.id})" style="cursor:pointer;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:6px;margin-bottom:4px;">
          <div style="font-size:18px;font-weight:800;color:#e0edf8;">${ti.ico} ${_esc(r.title)}</div>
          ${elp?`<div class="js-elapsed" data-d="${_esc(r.date)}" style="font-size:16px;font-weight:800;color:#f0a500;font-family:monospace;">⏱ ${elp}</div>`:''}
        </div>
        <div style="font-size:13px;color:#7aa8c8;margin-bottom:12px;">${_esc(r.type)} · ${_esc(_resLocLabel(r))} · ${r.date}</div>
        ${(r.teams&&r.teams.length)?r.teams.map((t,ti2)=>{
          const col=TEAM_COLORS[ti2%TEAM_COLORS.length];
          const si=_teamStageIdx(t);
          const done=_teamDone(t);
          const total=Math.max(t.wps.length-1,1);
          const pct=Math.round((t.wpIdx/total)*100);
          const cur=t.wps[t.wpIdx]||{};
          const curName=(cur.code?cur.code+' ':'')+(cur.name||'').slice(0,16);
          return `<div style="display:flex;align-items:center;gap:12px;padding:7px 0;border-top:1px solid rgba(255,255,255,.05);">
            <span style="font-size:14px;font-weight:800;color:${col};flex-shrink:0;min-width:110px;">${_teamIco(t)} ${_esc(t.name)}</span>
            <div style="flex:1;height:8px;background:rgba(255,255,255,.07);border-radius:4px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:${col};border-radius:4px;"></div></div>
            <span style="font-size:12px;color:rgba(255,255,255,.68);flex-shrink:0;min-width:130px;">📍 ${_esc(curName||'-')}</span>
            <span style="font-size:12px;font-weight:800;color:${done?'#27ae60':stageCol[si]};flex-shrink:0;">${done?'✓ 완료':stageLbl[si]}</span>
          </div>`;
        }).join(''):'<div style="font-size:12px;color:rgba(255,255,255,.3);padding:6px 0;">출동팀 미편성</div>'}
        <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:#7aa8c8;">
          <span>${lastLog?`최근: ${lastLog.time} ${_esc(lastLog.teamName)} ${_esc(lastLog.code||'')} 통과`:''}</span>
          <span>${r.handover&&r.handover.to?`🤝 인계: ${_esc(r.handover.to)}`:''}</span>
        </div>
        ${(r.teams&&r.teams.length>0&&r.teams.every(t=>_teamDone(t)))?`<div style="background:rgba(39,174,96,.12);border:1px solid rgba(39,174,96,.35);border-radius:8px;padding:8px 12px;margin-top:8px;text-align:center;font-size:13px;font-weight:800;color:#27ae60;">🏁 전 팀 완료 — 상황 종료 대기중</div>`:''}
      </div>
      <div style="display:flex;gap:7px;margin-top:11px;padding-top:10px;border-top:1px solid rgba(255,255,255,.07);">
        <button onclick="_boardOpenDetail(${r.id},'advanced')" style="flex:1;padding:8px 0;border-radius:9px;border:1px solid rgba(79,168,208,.35);background:rgba(79,168,208,.1);color:#4fa8d0;font-size:12px;font-weight:700;cursor:pointer;">📍 타임라인</button>
        <button onclick="_boardOpenDetail(${r.id},'write')" style="flex:1;padding:8px 0;border-radius:9px;border:1px solid rgba(79,168,208,.2);background:rgba(79,168,208,.06);color:#7abcd4;font-size:12px;font-weight:700;cursor:pointer;">📄 보고서</button>
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
          html+=`<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(255,255,255,.02);border-radius:8px;margin-bottom:4px;font-size:12px;border-left:3px solid #4fa8d0;">
            <span style="flex:1;color:rgba(255,255,255,.7);">${_esc(_stationLabel(loc))}</span>
            <span style="color:#cfe2f2;font-weight:700;">${c.snow?'❄️ '+c.snow.toFixed(1)+'cm  ':''}${c.rain?'🌧️ '+c.rain.toFixed(1)+'mm':''}${(!c.snow&&!c.rain)?'-':''}</span>
          </div>`;
        });
      }
    }
    const closedOps=aops.filter(o=>o.closedAt).sort((a,b)=>(b.startedAtMs||0)-(a.startedAtMs||0)).slice(0,6);
    if(closedOps.length){
      html+=`<div style="margin-top:18px;font-size:12px;color:#8ab0c8;font-weight:700;margin-bottom:6px;">📜 최근 종료된 특보운영 <span style="color:#5a7e98;font-weight:400;">(${closedOps.length}건)</span></div>`;
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
  body.innerHTML=html;
  if(_boardMap)_renderBoardPins();
}

function goHome(){
  const ov=document.getElementById('adminLoginOverlay');
  if(ov)ov.style.display='none';
  showV('v-home');
  document.getElementById('appHdr').style.display='none';
  document.getElementById('bnav').style.display='none';
  closeDB();updateSummary();
  history.pushState({view:'home'},'','');
}
function viewOnMap(lat,lng){
  openApp('rescue');
  setTimeout(function(){
    try{
      if(mapR){mapR.setCenter(new kakao.maps.LatLng(lat,lng));mapR.setLevel(4);}
      renderRescueMap();
    }catch(e){}
  },200);
}
function openApp(mode){
  if(isExternal()&&['inspect','stats','admin','settings','alert'].includes(mode)){toast('⚠️ 외부기관 계정은 해당 메뉴에 접근할 수 없습니다');return;}
  // 작성 폼에서 다른 메뉴로 이동: 미저장 입력은 임시저장만 남기고 작성모드 해제
  if(window._reportMode==='form'){try{_saveDraftNow();}catch(e){}window._reportMode='';clearInterval(_draftAutoTimer);}
  curApp=mode;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));
  document.getElementById('appHdr').style.display='block';
  const bn=document.getElementById('bnav');
  function setNv(){[1,2,3].forEach(i=>document.getElementById('nv'+i).classList.remove('on'));document.getElementById('nv1').classList.add('on');}
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
  el.style.cssText='position:fixed;inset:0;z-index:10002;background:#060d1a;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:calc(28px + env(safe-area-inset-top)) 28px calc(28px + env(safe-area-inset-bottom));text-align:center;';
  el.innerHTML='<div style="font-size:46px;">🔒</div>'
    +'<div style="font-size:18px;font-weight:800;color:#e0edf8;margin-top:8px;">관리자 권한이 없습니다</div>'
    +'<div style="font-size:13px;color:#7a9cb8;line-height:1.9;margin-top:12px;max-width:300px;">이 메뉴는 <b style="color:#9fc0da;">관리자만</b> 접근할 수 있습니다.<br>권한이 필요하면 <b style="color:#9fc0da;">관리자에게 문의</b>해 주세요.</div>'
    +(u.kakaoId?'<div style="font-size:11px;color:#4a7090;margin-top:14px;font-family:monospace;background:rgba(255,255,255,.04);border-radius:8px;padding:7px 12px;">내 카카오 ID: <b style="color:#cfe2f2;">'+_esc(String(u.kakaoId))+'</b><br><span style="color:#5a8aaa;">이 ID를 관리자에게 전달하면 권한을 받을 수 있습니다</span></div>':'')
    +(u.kakaoId?'<button onclick="requestAdminAccess()" style="margin-top:20px;width:100%;max-width:280px;background:rgba(39,174,96,.15);color:#27ae60;border:1px solid rgba(39,174,96,.4);border-radius:11px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;">🔐 관리자에게 권한 요청</button>':'')
    +'<button onclick="(function(){var e=document.getElementById(\'adminDeniedOverlay\');if(e)e.remove();goHome();})()" style="margin-top:10px;width:100%;max-width:280px;background:#1a4a6e;color:#fff;border:none;border-radius:11px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;">홈으로</button>'
    +'<div onclick="(function(){var e=document.getElementById(\'adminDeniedOverlay\');if(e)e.remove();var ov=document.getElementById(\'adminLoginOverlay\');if(ov){ov.style.display=\'flex\';setTimeout(function(){var p=document.getElementById(\'adminLoginPw\');if(p)p.focus();},200);}})()" style="margin-top:18px;font-size:11px;color:#2a4a5a;cursor:pointer;text-decoration:underline;">관리자 인증(비밀번호)</div>';
  el.style.display='flex';
}
function switchTab(idx,el){
  if(isExternal()&&idx!==1){toast('⚠️ 외부기관 계정은 지도만 이용 가능합니다');return;}
  [1,2,3].forEach(i=>document.getElementById('nv'+i).classList.remove('on'));if(el)el.classList.add('on');closeDB();
  if(curApp==='rescue'){
    if(idx===1){showV('v-rescue-map');rMaps();updateRescueCross();try{renderRescueMap();}catch(e){}} // 복귀 시 핀 최신화
    else{if(_rFocusResId)exitFocusMode();if(idx===2){showV('v-rescue-list');renderResList();}else{showV('v-rescue-stats');renderRescueStats();}}
  } else if(curApp==='inspect'){
    if(idx===1){showV('v-inspect-map');rMaps();updateInspectCross();try{renderInspectMap();}catch(e){}}
    else if(idx===2){showV('v-inspect-list');renderFacList();}
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
        <span style="background:#1a4a6e;color:#4fa8d0;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;flex-shrink:0;">${v.ver}</span>
        <span style="font-size:10px;color:#4a7090;flex-shrink:0;">${v.date}</span>
        <span style="font-size:10px;color:#7a9cb8;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v.summary}</span>
        <span id="clArr${i}" style="color:#4a7090;font-size:11px;flex-shrink:0;transition:transform .2s;">▾</span>
      </div>
      <div id="clBody${i}" style="display:none;padding:8px 12px 10px;background:#080f1c;">
        ${v.items.map(it=>`<div style="font-size:11px;color:#b8d4e8;padding:2px 0 2px 4px;">· ${it}</div>`).join('')}
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
  '01':'천불동계곡','02':'천불동→대청봉','03':'공룡능선',
  '04':'소공원 서측','05':'신흥사·비선대','06':'오색',
  '07':'주전골','08':'흘림골','09':'한계령 방면',
  '10':'백담계곡','11':'장수대·한계령','12':'한계산성·백담 분기',
  '13':'귀때기청봉','14':'점봉산',
};
// 위치필터 칩 라벨: '01 (천불동계곡)'
function _zoneLbl(z){return ZONE_NAMES[z]?z+' ('+ZONE_NAMES[z]+')':z;}
// 시설물이 해당 존(zz)에 속하는지: 코드(NN-?? 또는 NN) prefix로 판정 (substring 오매칭 방지)
function _facInZone(f,z){
  const c=((f&&(f.loc||''))||'').trim()||(((f&&f.name)||'').match(/^\d+-\d+/)||[''])[0];
  return c.startsWith(z+'-')||c===z;
}

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
    _cachedFullSigns=(DB.g('facilities')||[]).filter(function(f){
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
// 좌표의 고도 문자열: GPS 고도가 있으면 '⛰1234m'(실측), 없으면 1km 내 표지판 고도로 '⛰약858m' 추정. 불가하면 ''
function _elevStr(lat,lng,gpsAlt){
  if(gpsAlt!=null&&gpsAlt!==''&&isFinite(+gpsAlt))return '⛰'+Math.round(+gpsAlt)+'m';
  if(!(lat&&lng))return '';
  try{
    const s=_nearestSignFull(lat,lng);
    if(s&&s.elev>0&&s.dist<=1000)return '⛰약'+s.elev+'m';
  }catch(e){}
  return '';
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
  const dispatch=pb?`<button onclick="_showDispatchInfo('${hub?hub.name:''}','${pb.name}',${hasGPS?data.lat:pb.lat},${hasGPS?data.lng:pb.lng})" style="${bs}background:rgba(79,168,208,.18);color:#4fa8d0;border:1px solid rgba(79,168,208,.35);">🚗 출동<span style="font-size:9px;font-weight:400;opacity:.7;">${sn(pb.name)}</span></button>`:'';
  // 하산: 표지판 기준 하산 경로 안내 (텍스트)
  const descent=signCode?`<button onclick="_showDescentInfo('${signCode}')" style="${bs}background:rgba(39,174,96,.12);color:#5dbf8a;border:1px solid rgba(39,174,96,.25);">🥾 하산<span style="font-size:9px;font-weight:400;opacity:.7;">경로안내</span></button>`:
    (hasGPS?`<button onclick="_showHeliInfo(${data.lat},${data.lng})" style="${bs}background:rgba(39,174,96,.12);color:#5dbf8a;border:1px solid rgba(39,174,96,.25);">📋 좌표복사<span style="font-size:9px;font-weight:400;opacity:.7;">하산용</span></button>`:''
  );
  // 대피: 속초의료원 연락처 + 좌표 복사
  const evac=`<button onclick="_showEvacInfo(${hasGPS?data.lat:0},${hasGPS?data.lng:0})" style="${bs}background:rgba(230,126,34,.12);color:#e67e22;border:1px solid rgba(230,126,34,.25);">🚑 대피<span style="font-size:9px;font-weight:400;opacity:.7;">속초의료원</span></button>`;
  const heli=hasGPS?`<button onclick="_showHeliInfo(${data.lat},${data.lng})" style="${bs}background:rgba(108,79,168,.15);color:#b89af0;border:1px solid rgba(108,79,168,.3);">🚁 헬기<span style="font-size:9px;font-weight:400;opacity:.7;">좌표복사</span></button>`:'';

  const zm=signCode?(signCode.match(/^(\d{2})-/)||[])[1]:null;
  const zoneName=zm?(ZONE_NAMES[zm]||''):'';
  const signLabel=signCode?`<div style="font-size:10px;color:#3a6a8a;margin-bottom:5px;padding:0 2px;">📍 ${signCode}${zoneName?' · '+zoneName:''}${pb?' → '+sn(pb.name):''}${ab?` <span style="color:#e0a840;font-size:9px;">/ ${sn(ab.name)}</span>`:''}</div>`:
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
      ?'<span style="color:#4a7090;">(미선택)</span>'
      :summaryParts.join(' · ');
    const filtered=filt==='전체'?allMembers:allMembers.filter(s=>s.dept===filt);
    return `<div style="margin-bottom:8px;padding:10px;background:#060d1a;border-radius:8px;border:1px solid rgba(126,200,163,.2);">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:${collapsed?0:8}px;">
        ${collapsed
          ?`<span style="font-size:11px;flex:1;">${summaryHtml}</span>`
          :`<input type="text" value="${_esc(t.teamName)}" oninput="_extraTeams[${ti}].teamName=this.value"
              style="flex:1;background:transparent;border:none;border-bottom:1px solid rgba(126,200,163,.3);color:#7ec8a0;font-size:12px;font-weight:700;outline:none;padding:2px 0;">`}
        ${collapsed
          ?`<button onclick="editExtraTeam(${ti})" style="background:rgba(79,168,208,.12);border:1px solid rgba(79,168,208,.25);color:#4fa8d0;border-radius:6px;font-size:11px;padding:4px 10px;cursor:pointer;">✏️ 수정</button>`
          :`<button onclick="removeExtraTeam(${ti})" style="background:rgba(192,57,43,.1);border:none;color:#c0392b;font-size:11px;padding:3px 8px;border-radius:5px;cursor:pointer;">삭제</button>`}
      </div>
      ${collapsed?'':`
        ${t.members.length?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
          ${t.members.map(n=>`<div style="background:rgba(126,200,163,.15);color:#7ec8a0;border:1px solid rgba(126,200,163,.3);border-radius:20px;font-size:10px;font-weight:700;padding:3px 8px;display:flex;align-items:center;gap:4px;">${_esc(n)}<span onclick="toggleExtraTeamMemberByName(${ti},'${_escq(n)}')" style="cursor:pointer;color:#c0392b;font-size:12px;line-height:1;">×</span></div>`).join('')}
        </div>`:''}
        ${availDepts.length>1?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
          ${['전체',...availDepts].map(d=>`<div onclick="setExtraTeamOtherFilter(${ti},'${_escq(d)}')" style="padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;cursor:pointer;${d===filt?'background:#1a4a6e;color:#4fa8d0;':'background:#0b1c30;color:#4a7090;border:1px solid #1a3a5a;'}">${_esc(d)}</div>`).join('')}
        </div>`:''}
        ${filtered.length?`<div class="chk-grid">
          ${filtered.map(s=>{
            const inThis=t.members.includes(s.name);
            const takenElsewhere=!inThis&&((_initTeamMembers||[]).includes(s.name)||_extraTeams.some((et,ei)=>ei!==ti&&et.members.includes(s.name)));
            return `<div class="chk-item${inThis?' on':''}${takenElsewhere?' disabled':''}"
              onclick="${takenElsewhere?'':(`toggleExtraTeamMember(${ti},\\'${_escq(s.name)}\\',this)`)}"
              style="${takenElsewhere?'opacity:.35;cursor:not-allowed;':''}">
              <div class="chk-box${inThis?' on':''}"></div>
              <span class="chk-txt">${_esc(s.name)}<span style="font-size:9px;color:#4a7090;margin-left:3px;">${_esc(s.rank)}${takenElsewhere?' (배정됨)':''}</span></span>
            </div>`;
          }).join('')}
        </div>`:'<div style="font-size:11px;color:#4a7090;padding:6px 0;">가입된 인원 없음</div>'}
        <button onclick="confirmExtraTeam(${ti})" style="width:100%;margin-top:10px;padding:8px;background:rgba(79,168,208,.1);border:1px solid rgba(79,168,208,.3);color:#4fa8d0;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">✅ 확인</button>
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
      const map=new kakao.maps.Map(el,{center:pos,level:5});
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
    d.style.cssText='background:rgba(8,18,36,.82);border:1px solid rgba(125,211,250,.45);border-radius:5px;padding:1px 4px;font-size:9px;font-weight:700;color:#7dd3fa;font-family:monospace;pointer-events:none;white-space:nowrap;';
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
      _formMap=new kakao.maps.Map(el,{center:pos,level:4});
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
          if(cd&&_e)cd.textContent=la.toFixed(5)+', '+ln.toFixed(5)+' '+_e;
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
    const cd=document.getElementById('r_minimap_coords');if(cd)cd.textContent=v+(_e?' '+_e:'');
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
// 동반자 토글
function selHasComp(val){
  document.getElementById('r_hasComp').value=val;
  document.querySelectorAll('#hasCompBtns .tog-btn').forEach(b=>b.classList.toggle('on',b.dataset.val===val));
  document.getElementById('companionWrap').style.display=val==='y'?'block':'none';
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
// 외상(부위 필요) / 내상·질환(전신 — 부위 불필요) 유형 목록. '기타'는 직접 입력
const _INJ_TYPES={
  '외상':['골절','탈구','염좌','열상','타박상','두부손상','절단','화상','기타'],
  '내상':['저혈당','심정지','저체온증','열사병','탈진/탈수','호흡곤란','흉통','복통','경련','의식저하','익수','기타'],
};
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
  const partWrap=document.getElementById('injPartWrap');
  const sw=document.getElementById('injSideWrap');
  const cw=document.getElementById('injTypeCustomWrap');
  const isSys=_injCat==='내상';
  if(partWrap) partWrap.style.display=isSys?'none':'block';
  if(sw) sw.style.display='none';
  if(cw){cw.style.display=type==='기타'?'block':'none';if(type==='기타')setTimeout(()=>{try{document.getElementById('injTypeCustom').focus();}catch(e){}},50);}
  if(isSys){_injPart='전신';_injSide='';}
  else{_injPart='';_injSide='';document.querySelectorAll('#injPartPills .pill').forEach(p=>p.classList.remove('on'));}
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
  if(type==='기타'){
    const c=(document.getElementById('injTypeCustom')?.value||'').trim();
    if(!c){toast('기타 부상 내용을 입력하세요');return;}
    type=c;
  }
  if(_injCat!=='내상'&&!_injPart){toast('부상 부위를 선택하세요');return;}
  _injuries.push({type:type,part:_injCat==='내상'?'전신':_injPart,side:_injSide,cat:_injCat});
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
function renderInjuries(){
  const el=document.getElementById('injuryList');
  if(!el) return;
  if(!_injuries.length){el.innerHTML='';return;}
  el.innerHTML=_injuries.map((a,i)=>`
    <div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:#0b1c30;border-radius:7px;margin-bottom:4px;border:1px solid rgba(79,168,208,.1);">
      <span style="font-size:10px;color:${a.cat==='내상'?'#c4b5fd':'#7dd3fa'};font-weight:700;flex-shrink:0;">${a.cat==='내상'?'💊':'🩹'}</span>
      <span style="font-size:12px;flex:1;color:#e0edf8;font-weight:600;">${_injLabel(a)}</span>
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
    <div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:#0b1c30;border-radius:7px;margin-bottom:4px;border:1px solid rgba(79,168,208,.1);">
      <span style="font-size:12px;flex:1;color:#e0edf8;font-weight:600;">${a.type}${a.level}</span>
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
    <div style="display:flex;align-items:center;gap:6px;padding:7px 10px;background:#0b1c30;border-radius:7px;margin-bottom:4px;border:1px solid rgba(79,168,208,.1);">
      <span style="font-size:10px;color:#4a7090;flex-shrink:0;">${_esc(a.cat)}</span>
      <span style="font-size:12px;flex:1;color:#e0edf8;font-weight:600;">${_esc(a.name)}</span>
      ${a.count?`<span style="font-size:11px;color:#7a9cb8;flex-shrink:0;">${_esc(a.count)}명</span>`:''}
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

