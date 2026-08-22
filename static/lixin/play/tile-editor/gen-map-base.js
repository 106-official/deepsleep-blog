// 生成 tile-editor/map-base.json：从 index.html 抽取地图静态数据（水面/道路/建筑/围墙等），
// 供管理面板渲染底图。运行：node gen-map-base.js
const fs=require('fs');
const path=require('path');
const f=path.join(__dirname,'..','index.html');
const s=fs.readFileSync(f,'utf-8');
// 截取从 TILE 常量到 buildBlocked() 调用之前的数据定义段（纯数据 + 函数定义，无 DOM 依赖）
const start=s.indexOf('const TILE=32');
const end=s.indexOf('buildBlocked();');
if(start<0||end<0){ console.error('markers not found'); process.exit(1); }
const seg=s.slice(start,end);
// 用沙箱 eval 取出地图数组（无 DOM 依赖）
const ctx={};
const fn=new Function('window','document', seg + '\n;return {LAKE,LAKE_BRIDGES,PATHS,BUILDINGS,WALLS,PONDS,TRACKS,SQUARES,COLS,ROWS};');
const data=fn({}, {});
const out={
  cols:data.COLS, rows:data.ROWS,
  lake:data.LAKE, lakeBridges:data.LAKE_BRIDGES,
  paths:data.PATHS, buildings:data.BUILDINGS, walls:data.WALLS,
  ponds:data.PONDS||[], tracks:data.TRACKS||[], squares:data.SQUARES||[]
};
fs.writeFileSync(path.join(__dirname,'map-base.json'), JSON.stringify(out,null,0));
console.log('map-base.json written: lake',out.lake.length,'paths',out.paths.length,'buildings',out.buildings.length,'walls',out.walls.length);
