/* Lixin v1.17 interface shell: responsive controls, campus navigation and persistent journey progress. */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const STORE = 'lixin_rpg_journey_v2';
  const ZONES = [
    {id:'dorm',name:'四期公寓',desc:'宿舍、绿地与生活广场',icon:'🏘',x:40,y:22},
    {id:'food',name:'文汇生活区',desc:'小吃街、校门与文汇路',icon:'🥟',x:42,y:47},
    {id:'songjiang',name:'文翔路校区',desc:'序伦大楼、图书馆与会计博物馆',icon:'🏛',x:43,y:92},
    {id:'transit',name:'校际大道',desc:'连接两校区的林荫通道',icon:'🚌',x:98,y:92},
    {id:'pudong',name:'上川路校区',desc:'文博楼、实验中心与活动中心',icon:'🏫',x:136,y:101}
  ];
  const QUESTS = [
    {id:'explore',icon:'⌖',title:'校园初识',desc:'发现 3 个不同区域',target:3,key:'zones'},
    {id:'course',icon:'📚',title:'课前串门',desc:'与 2 位课程 NPC 交谈',target:2,key:'courses'},
    {id:'social',icon:'☕',title:'认识同学',desc:'和 2 位同学聊聊',target:2,key:'students'},
    {id:'grill',icon:'🔥',title:'摸底热身',desc:'开始 1 次 Grill me',target:1,key:'grills'}
  ];
  let data = load();
  let currentZone = '';

  function load(){
    try { return Object.assign({zones:[],courses:[],students:[],grills:0},JSON.parse(localStorage.getItem(STORE)||'{}')); }
    catch(e){ return {zones:[],courses:[],students:[],grills:0}; }
  }
  function save(){ try{localStorage.setItem(STORE,JSON.stringify(data));}catch(e){} renderJourney(); }
  function uniqPush(key,value){ if(!data[key].includes(value)){ data[key].push(value); save(); return true; } return false; }
  function questValue(q){ return Array.isArray(data[q.key])?data[q.key].length:(data[q.key]||0); }
  function completed(q){ return questValue(q)>=q.target; }
  function completionCount(){ return QUESTS.filter(completed).length; }

  function zoneOf(tx,ty){
    if(ty<42&&tx<92) return ZONES[0];
    if(ty<66&&tx<92) return ZONES[1];
    if(tx<92) return ZONES[2];
    if(tx<109) return ZONES[3];
    return ZONES[4];
  }
  function updateZone(){
    if(typeof player==='undefined'||typeof TILE==='undefined') return;
    const z=zoneOf(Math.floor(player.x/TILE),Math.floor(player.y/TILE));
    if(!z||z.id===currentZone) return;
    currentZone=z.id;
    const chip=$('#zoneChip'),card=$('#landmarkCard');
    if(chip) chip.textContent=z.name;
    if(card) card.innerHTML='<small>当前位置</small><b>'+z.name+'</b><span>'+z.desc+'</span>';
    if(uniqPush('zones',z.id)&&data.zones.length>1&&typeof toast==='function') toast('⌖ 已发现：'+z.name);
  }

  function renderJourney(){
    const done=completionCount();
    const count=$('#questPeekCount'),bar=$('#questPeekBar'),title=$('#questPeekTitle');
    if(count) count.textContent=done+' / '+QUESTS.length;
    if(bar) bar.style.width=(done/QUESTS.length*100)+'%';
    const next=QUESTS.find(q=>!completed(q));
    if(title) title.textContent=next?next.title:'本轮旅程已完成';
    const list=$('#questList'); if(!list)return;
    list.innerHTML=QUESTS.map(q=>{
      const v=Math.min(q.target,questValue(q)),isDone=v>=q.target;
      return '<article class="quest-card '+(isDone?'done':'')+'"><div class="quest-icon">'+(isDone?'✓':q.icon)+'</div><div class="quest-copy"><b>'+q.title+'</b><span>'+q.desc+(isDone?' · 已完成':'')+'</span></div><div class="quest-progress">'+v+' / '+q.target+'</div></article>';
    }).join('');
  }

  function openPanel(id){
    const el=document.getElementById(id); if(!el)return;
    el.classList.add('show');el.setAttribute('aria-hidden','false');
  }
  function closePanel(id){
    const el=document.getElementById(id); if(!el)return;
    el.classList.remove('show');el.setAttribute('aria-hidden','true');
  }
  function closeTop(){
    const open=document.querySelector('.game-modal.show'); if(open){closePanel(open.id);return true;}
    const menu=$('#hudMenu'); if(menu&&menu.classList.contains('show')){toggleMenu(false);return true;}
    return false;
  }
  function toggleMenu(force){
    const menu=$('#hudMenu'),btn=$('#menuBtn'); if(!menu)return;
    const on=force===undefined?!menu.classList.contains('show'):force;
    menu.classList.toggle('show',on); if(btn)btn.setAttribute('aria-expanded',String(on));
  }

  function renderNav(){
    const grid=$('#navGrid'); if(!grid)return;
    grid.innerHTML=ZONES.map(z=>'<button class="nav-card" data-zone="'+z.id+'"><i>'+z.icon+'</i><b>'+z.name+'</b><span>'+z.desc+'</span></button>').join('');
    grid.querySelectorAll('[data-zone]').forEach(btn=>btn.onclick=()=>{
      const z=ZONES.find(v=>v.id===btn.dataset.zone); if(!z)return;
      if(typeof warpTo==='function'&&typeof TILE!=='undefined') warpTo(z.x*TILE+TILE/2,z.y*TILE+TILE/2);
      closePanel('navPanel');
      if(typeof toast==='function') toast('已抵达 '+z.name);
      setTimeout(updateZone,80);
    });
  }

  function interact(){
    if(typeof splashing!=='undefined'&&splashing)return;
    if(typeof dialogOpen!=='undefined'&&dialogOpen)return;
    let best=null,dist=Infinity,fn=null;
    function offer(arr,getX,getY,limit,open){ arr.forEach(o=>{const d=Math.hypot(player.x-getX(o),player.y-getY(o));if(d<limit&&d<dist){best=o;dist=d;fn=open;}}); }
    if(typeof NPCS!=='undefined') offer(NPCS,n=>n.px,n=>n.py,90,n=>openDialog(n));
    if(typeof VILLAGERS!=='undefined') offer(VILLAGERS,n=>n.px,n=>n.py,90,n=>openDialog(n));
    if(typeof STUDENTS!=='undefined') offer(STUDENTS,n=>n.x,n=>n.y,70,n=>openStudentChat(n));
    if(best&&fn){fn(best);return;}
    if(typeof toast==='function') toast('附近没有可互动的人或物件');
  }
  function step(dir){
    if(typeof player==='undefined'||typeof moveTo!=='function'||typeof TILE==='undefined')return;
    const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir]; if(!d)return;
    moveTo(player.x+d[0]*TILE*2,player.y+d[1]*TILE*2);
  }

  function bindControls(){
    $('#questBtn').onclick=()=>openPanel('questPanel');
    $('#navBtn').onclick=()=>openPanel('navPanel');
    $('#helpBtn').onclick=()=>openPanel('helpPanel');
    $('#questPeekOpen').onclick=()=>openPanel('questPanel');
    $('#menuBtn').onclick=(e)=>{e.stopPropagation();toggleMenu();};
    $('#mobileMon').onclick=()=>$('#monBtn').click();
    $('#mobileMenu').onclick=()=>toggleMenu();
    $('#interactBtn').onclick=interact;
    document.querySelectorAll('[data-open-panel]').forEach(b=>b.onclick=()=>openPanel(b.dataset.openPanel));
    document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closePanel(b.dataset.close));
    document.querySelectorAll('.game-modal').forEach(m=>m.addEventListener('pointerdown',e=>{if(e.target===m)closePanel(m.id);}));
    document.querySelectorAll('#hudMenu [data-open]').forEach(b=>b.onclick=()=>{toggleMenu(false);const t=document.getElementById(b.dataset.open);if(t)t.click();});
    $('#openMinimapFromNav').onclick=()=>{closePanel('navPanel');if(typeof openMinimap==='function')openMinimap();};
    $('#minimapBtn').addEventListener('keydown',e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();if(typeof openMinimap==='function')openMinimap();}});
    document.addEventListener('pointerdown',e=>{const menu=$('#hudMenu');if(menu&&menu.classList.contains('show')&&!menu.contains(e.target)&&e.target!==$('#menuBtn')&&e.target!==$('#mobileMenu'))toggleMenu(false);});

    document.querySelectorAll('[data-move]').forEach(btn=>{
      let timer=0;
      const start=e=>{e.preventDefault();step(btn.dataset.move);timer=window.setInterval(()=>step(btn.dataset.move),180);};
      const stop=()=>{clearInterval(timer);timer=0;};
      btn.addEventListener('pointerdown',start);btn.addEventListener('pointerup',stop);btn.addEventListener('pointercancel',stop);btn.addEventListener('pointerleave',stop);
    });
    window.addEventListener('keydown',e=>{
      const tag=(e.target&&e.target.tagName)||''; if(/INPUT|TEXTAREA|SELECT/.test(tag))return;
      if(e.code==='Escape'&&closeTop()){e.preventDefault();return;}
      const map={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
      if(map[e.code]){e.preventDefault();step(map[e.code]);}
    },true);
  }

  window.addEventListener('lixin:talk',e=>{
    const d=e.detail||{};
    if(d.kind==='course')uniqPush('courses',String(d.id||d.name));
    if(d.kind==='student')uniqPush('students',String(d.id||d.name));
  });
  window.addEventListener('lixin:grill',()=>{data.grills=(data.grills||0)+1;save();});

  renderNav();bindControls();renderJourney();updateZone();
  setInterval(updateZone,650);
})();
