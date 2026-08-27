// 生成 tile-editor/map-base.json：从 index.html 抽取地图结构数据（水面/道路/桥梁/围墙/建筑/路灯/广场等），
// 供管理面板渲染底图与初始化地图编辑器。运行：node gen-map-base.js
// 注意：key 与游戏 map-data.json 约定一致（paths/lakes/bridges/walls/buildings/lamps，格坐标）。
const fs=require('fs');
const path=require('path');
const f=path.join(__dirname,'..','index.html');
const s=fs.readFileSync(f,'utf-8');
// 截取从 TILE 常量到 buildBlocked() 调用之前的数据定义段（纯数据 + 函数定义，无 DOM 依赖）
const start=s.indexOf('const TILE=32');
// 段尾锚点：路灯循环结束、动物/UI 代码之前（避开 ovApply 等函数体内的 buildBlocked() 调用）
const end=s.indexOf('const benches=[');
if(start<0||end<0){ console.error('markers not found'); process.exit(1); }
const seg=s.slice(start,end);
// 用沙箱 eval 取出地图数组（无 DOM 依赖）
const fn=new Function('window','document', seg + '\n;return {LAKE,LAKE_BRIDGES,PATHS,BUILDINGS,WALLS,PONDS,TRACKS,SQUARES,lamps,COLS,ROWS};');
const d=fn({}, {});
const TILE=32;
const out={
  cols:d.COLS, rows:d.ROWS,
  paths:d.PATHS,
  lakes:d.LAKE,
  bridges:d.LAKE_BRIDGES,
  walls:d.WALLS,
  buildings:d.BUILDINGS,
  lamps:(d.lamps||[]).map(l=>({x:Math.round(l.x/TILE),y:Math.round(l.y/TILE),big:!!l.big})),
  ponds:d.PONDS||[], tracks:d.TRACKS||[], squares:d.SQUARES||[],
  overrides:{}
};
fs.writeFileSync(path.join(__dirname,'map-base.json'), JSON.stringify(out,null,1));
console.log('map-base.json written: lakes',out.lakes.length,'paths',out.paths.length,
  'bridges',out.bridges.length,'buildings',out.buildings.length,'walls',out.walls.length,'lamps',out.lamps.length);
