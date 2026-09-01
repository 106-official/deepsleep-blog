/* Campus Studio v1.0: compact palette, searchable layers, undo/redo, import/export and shortcuts. */
(function(){
  'use strict';
  const history=[];
  const future=[];
  const MAX_HISTORY=40;
  const visibility={paths:true,lakes:true,bridges:true,walls:true,buildings:true,lamps:true,overrides:true};
  let paletteMode='terrain';
  let dirty=false;

  const nativeDraw=draw;
  const nativeRenderList=renderList;
  const nativeRenderSubbar=renderSubbar;
  const nativeScheduleSave=scheduleSave;
  const nativeSave=save;
  const nativeLoadAll=loadAll;

  function snapshot(){ return state?JSON.stringify(state):''; }
  function remember(){
    const s=snapshot(); if(!s||history[history.length-1]===s)return;
    history.push(s); if(history.length>MAX_HISTORY)history.shift();
    future.length=0; updateHistoryButtons();
  }
  function applySnapshot(raw,label){
    if(!raw)return;
    state=JSON.parse(raw);
    state.cols=state.cols||DEFAULT_COLS;state.rows=state.rows||DEFAULT_ROWS;
    ['paths','lakes','bridges','walls','buildings','lamps'].forEach(k=>{if(!state[k])state[k]=[];});
    if(!state.overrides)state.overrides={};
    cols=state.cols;rows=state.rows;dimLabel.textContent=cols+' × '+rows;
    resizeCanvas();draw();renderList();scheduleSave();toast(label);
  }
  function undo(){
    if(!history.length)return;
    const cur=snapshot(),target=history.pop(); if(cur)future.push(cur);
    applySnapshot(target,'已撤销');updateHistoryButtons();
  }
  function redo(){
    if(!future.length)return;
    const cur=snapshot(),target=future.pop(); if(cur)history.push(cur);
    applySnapshot(target,'已重做');updateHistoryButtons();
  }
  function updateHistoryButtons(){
    document.getElementById('undoBtn').disabled=!history.length;
    document.getElementById('redoBtn').disabled=!future.length;
  }
  function setDirty(on){
    dirty=on;
    const dot=document.querySelector('.dirty-dot');if(dot)dot.classList.toggle('on',on);
  }

  draw=function(){
    if(!state)return nativeDraw();
    const hidden={};
    Object.keys(visibility).forEach(k=>{if(!visibility[k]){hidden[k]=state[k];state[k]=k==='overrides'?{}:[];}});
    try{return nativeDraw();}finally{Object.keys(hidden).forEach(k=>state[k]=hidden[k]);}
  };
  scheduleSave=function(){setDirty(true);nativeScheduleSave();};
  save=function(){
    nativeSave();
    window.setTimeout(()=>setDirty(false),260);
  };

  function chip(text,color,active,onClick,preview,label){
    const d=document.createElement('div');d.className='tool'+(active?' active':'');
    d.tabIndex=0;d.setAttribute('role','button');
    d.innerHTML='<span class="sw" style="background:'+color+'"></span>'+text;
    d.onclick=onClick;
    d.onkeydown=e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();d.click();}};
    if(preview){d.onmouseenter=()=>showChipPreview(d,preview,label||text);d.onmouseleave=hideChipPreview;}
    return d;
  }
  function addSearch(rail,placeholder){
    const q=document.createElement('input');q.className='palette-search';q.placeholder=placeholder;
    q.oninput=()=>{const term=q.value.trim().toLowerCase();rail.querySelectorAll('.tool').forEach(x=>x.style.display=!term||x.textContent.toLowerCase().includes(term)?'':'none');};
    subbarEl.appendChild(q);
  }
  renderSubbar=function(){
    subbarEl.innerHTML='';
    if(tool==='brush'){
      const tabs=document.createElement('div');tabs.className='palette-tabs';
      [['terrain','地表'],['structure','结构']].forEach(([id,name])=>{const b=document.createElement('button');b.textContent=name;b.className=paletteMode===id?'on':'';b.onclick=()=>{paletteMode=id;renderSubbar();};tabs.appendChild(b);});
      subbarEl.appendChild(tabs);
      const rail=document.createElement('div');rail.className='palette-rail';
      if(paletteMode==='terrain'){
        TERRAIN.forEach(t=>rail.appendChild(chip(terrainName(t.t),t.hex,brushSel.kind==='tex'&&brushSel.t===t.t,()=>{brushSel={kind:'tex',t:t.t};renderSubbar();},thumbHTML(t.t),terrainName(t.t))));
        addSearch(rail,'搜索地表…');
      }else{
        BRUSH_STRUCT.forEach(s=>rail.appendChild(chip(s.name,s.hex,brushSel.kind==='struct'&&brushSel.layer===s.layer&&(s.type?brushSel.type===s.type:true),()=>{brushSel={kind:'struct',layer:s.layer,type:s.type};renderSubbar();},'<div style="width:64px;height:64px;background:'+s.hex+';border-radius:8px"></div>',s.name+' · 结构矩形')));
      }
      subbarEl.appendChild(rail);
      const tip=document.createElement('span');tip.className='lbl';tip.textContent='拖拽绘制矩形';subbarEl.appendChild(tip);
    }else if(tool==='object'){
      const rail=document.createElement('div');rail.className='palette-rail';
      Object.keys(OBJ_DEF).forEach(t=>{const def=OBJ_DEF[t];rail.appendChild(chip(def.name+(def.w>1||def.h>1?' '+def.w+'×'+def.h:''),'#5f8d64',objType===t,()=>{objType=t;renderSubbar();},objPreviewHTML(t),def.name));});
      addSearch(rail,'搜索物件…');subbarEl.appendChild(rail);
      const tip=document.createElement('span');tip.className='lbl';tip.textContent='单击或拖拽放置';subbarEl.appendChild(tip);
    }else if(tool==='lamp'){
      const tip=document.createElement('span');tip.className='lbl';tip.innerHTML='单击放置　<label><input type="checkbox" id="lampBig"> 使用大路灯</label>';subbarEl.appendChild(tip);
    }else if(tool==='pick'){
      const tip=document.createElement('span');tip.className='lbl';tip.textContent='单击检视坐标 · 拖动平移画布';subbarEl.appendChild(tip);
    }else{
      const tip=document.createElement('span');tip.className='lbl';tip.textContent='擦除最上层地形、物件、路灯或结构';subbarEl.appendChild(tip);
    }
  };

  function layerDetails(layer,arr){
    const meta=LAYER_META[layer]||{name:'逐格覆盖',color:'#6ba832'};
    const details=document.createElement('details');details.className='layer-group';
    const summary=document.createElement('summary');
    summary.innerHTML='<span class="layer-color" style="background:'+meta.color+'"></span><span>'+meta.name+'</span><span class="layer-count">'+arr.length+'</span>';
    const eye=document.createElement('button');eye.className='layer-eye'+(visibility[layer]?'':' off');eye.textContent=visibility[layer]?'◉':'○';eye.title='显示 / 隐藏图层';
    eye.onclick=e=>{e.preventDefault();e.stopPropagation();visibility[layer]=!visibility[layer];renderList();draw();};summary.appendChild(eye);details.appendChild(summary);
    const items=document.createElement('div');items.className='layer-items';
    if(!arr.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='此图层为空';items.appendChild(empty);}
    arr.forEach((r,i)=>{
      const d=document.createElement('div');d.className='item';
      const sw=document.createElement('span');sw.className='sw';sw.style.background=r.color||(r.type?terrainHex(r.type):meta.color);
      const nm=document.createElement('span');nm.className='nm';nm.textContent=r.name||r.type||layer.replace(/s$/,'');
      const xy=document.createElement('span');xy.className='xy';xy.textContent=layer==='overrides'?String(r.x):('('+r.x+','+r.y+(r.w?' · '+r.w+'×'+r.h:'')+')'+(r.big?' ★':''));
      const del=document.createElement('button');del.textContent='×';del.title='删除';del.onclick=e=>{e.stopPropagation();if(confirm('删除 '+nm.textContent+'？'))removeAt(layer,i);};
      d.append(sw,nm,xy,del);d.onclick=()=>{wrap.scrollLeft=(r.x+(r.w||1)/2)*SCALE-wrap.clientWidth/2;wrap.scrollTop=(r.y+(r.h||1)/2)*SCALE-wrap.clientHeight/2;hover={x:r.x,y:r.y};draw();};items.appendChild(d);
    });
    details.appendChild(items);return details;
  }
  renderList=function(){
    if(!state)return nativeRenderList();
    sideEl.innerHTML='';
    const total=['paths','lakes','bridges','buildings','walls','lamps'].reduce((n,k)=>n+(state[k]||[]).length,0)+Object.keys(state.overrides||{}).length;
    const head=document.createElement('div');head.className='side-head';head.innerHTML='<div class="side-title"><b>图层与对象</b><span>'+total+' 项</span></div><input class="side-search" placeholder="搜索名称或坐标…">';sideEl.appendChild(head);
    ['buildings','paths','lakes','bridges','walls','lamps'].forEach(layer=>sideEl.appendChild(layerDetails(layer,state[layer]||[])));
    const counts={};for(const k in (state.overrides||{})){const t=state.overrides[k].t;counts[t]=(counts[t]||0)+1;}
    const ov=Object.keys(counts).sort().map(t=>({x:'×'+counts[t],y:'',name:(TEX_ATLAS[t]&&TEX_ATLAS[t].name)||(OBJ_NAMES[t])||terrainName(t)||t,type:t}));
    const ovDetails=layerDetails('overrides',ov);ovDetails.querySelectorAll('.item button').forEach(b=>b.remove());sideEl.appendChild(ovDetails);
    head.querySelector('input').oninput=e=>{const term=e.target.value.trim().toLowerCase();sideEl.querySelectorAll('.item').forEach(item=>item.style.display=!term||item.textContent.toLowerCase().includes(term)?'':'none');};
  };

  function normalizeImport(raw){
    const m=JSON.parse(raw);if(!m||typeof m!=='object')throw new Error('文件不是地图对象');
    const out={cols:+m.cols||DEFAULT_COLS,rows:+m.rows||DEFAULT_ROWS,overrides:m.overrides&&typeof m.overrides==='object'?m.overrides:{}};
    ['paths','lakes','bridges','walls','buildings','lamps'].forEach(k=>out[k]=Array.isArray(m[k])?m[k]:[]);
    if(out.cols<5||out.rows<5||out.cols>600||out.rows>600)throw new Error('地图尺寸应在 5–600 格之间');
    return out;
  }
  function importMap(file){
    const reader=new FileReader();reader.onload=()=>{try{remember();state=normalizeImport(reader.result);cols=state.cols;rows=state.rows;dimLabel.textContent=cols+' × '+rows;resizeCanvas();draw();renderList();scheduleSave();toast('已导入地图并自动保存');}catch(e){toast('导入失败：'+e.message);}};reader.readAsText(file,'utf-8');
  }
  function exportMap(){
    const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='lixin-map-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);toast('地图 JSON 已导出');
  }

  cv.addEventListener('pointerdown',()=>{if(tool!=='pick')remember();},{capture:true});
  sideEl.addEventListener('click',e=>{if(e.target.closest('.item button'))remember();},{capture:true});
  ['addCol','addRow','insCol','insRow','clearOvBtn','resetBtn'].forEach(id=>document.getElementById(id).addEventListener('click',remember,{capture:true}));
  cv.addEventListener('pointermove',()=>{let box=document.querySelector('.editor-cursor');if(!box){box=document.createElement('div');box.className='editor-cursor';document.body.appendChild(box);}box.textContent=hover?'X '+hover.x+'  ·  Y '+hover.y+'  ·  '+cols+'×'+rows:'画布外';});

  document.getElementById('undoBtn').onclick=undo;document.getElementById('redoBtn').onclick=redo;
  document.getElementById('saveBtn').onclick=save;
  document.getElementById('exportBtn').onclick=exportMap;
  document.getElementById('importBtn').onclick=()=>document.getElementById('importFile').click();
  document.getElementById('importFile').onchange=e=>{const f=e.target.files&&e.target.files[0];if(f)importMap(f);e.target.value='';};
  document.getElementById('previewBtn').onclick=()=>{const url=location.port==='8787'?'http://localhost:8666/lixin/play/?nosplash=1':'../?nosplash=1';window.open(url,'lixin-game-preview');};
  document.getElementById('layersBtn').onclick=()=>sideEl.classList.toggle('open');
  document.addEventListener('pointerdown',e=>{if(innerWidth<=980&&sideEl.classList.contains('open')&&!sideEl.contains(e.target)&&e.target.id!=='layersBtn')sideEl.classList.remove('open');});
  document.addEventListener('keydown',e=>{
    const tag=(e.target&&e.target.tagName)||'';if(/INPUT|TEXTAREA|SELECT/.test(tag))return;
    if((e.ctrlKey||e.metaKey)&&e.code==='KeyZ'){e.preventDefault();e.shiftKey?redo():undo();return;}
    if((e.ctrlKey||e.metaKey)&&e.code==='KeyY'){e.preventDefault();redo();return;}
    if((e.ctrlKey||e.metaKey)&&e.code==='KeyS'){e.preventDefault();save();return;}
    const keys={KeyB:'brush',KeyO:'object',KeyI:'pick',KeyE:'erase',KeyL:'lamp'};
    if(keys[e.code]){const t=toolsEl.querySelector('[data-t="'+keys[e.code]+'"]');if(t)t.click();}
  });

  const auto=document.createElement('span');auto.className='status';auto.innerHTML='<i class="dirty-dot"></i>自动保存';document.getElementById('resetBtn').parentElement.insertBefore(auto,document.getElementById('clearOvBtn'));
  renderSubbar();if(state)renderList();updateHistoryButtons();
  window.setTimeout(()=>setDirty(false),800);
})();
