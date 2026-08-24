// Lixin RPG 地图编辑器后端（零依赖 Node）
// 启动：node server.js  → 打开 http://localhost:8787
// 编辑结果写入 ../map-data.json（cols/rows + 结构层 + 逐格地形），游戏 index.html 启动时自动加载并生效。
const http=require('http');
const fs=require('fs');
const path=require('path');

const PORT=process.env.PORT||8787;
const DIR=__dirname;
const MAP_DATA_FILE=path.join(DIR,'..','map-data.json'); // 游戏读取的地图数据文件
const MAP_BASE_FILE=path.join(DIR,'map-base.json');      // 默认底图（从 index.html 抽取）
const OV_FILE=path.join(DIR,'..','tile-overrides.json'); // 旧版逐格 override（兼容）
const ASSETS_DIR=path.join(DIR,'..','assets');           // 编辑器 v0.3 贴图资源目录

const RECT_KEYS=['paths','lakes','bridges','walls','buildings'];

function readJSON(file){
  try{ return JSON.parse(fs.readFileSync(file,'utf-8')); }catch(e){ return null; }
}
function readOverrides(){ const d=readJSON(OV_FILE); return (d&&d.overrides)||{}; }

// 读取当前地图：优先 map-data.json（编辑器保存的），否则用默认底图
function readMap(){
  const md=readJSON(MAP_DATA_FILE);
  if(md&&(md.paths||md.lakes||md.lamps||md.overrides||md.cols||md.rows)) return md;
  const base=readJSON(MAP_BASE_FILE)||{};
  return Object.assign({overrides:{}},base);
}
function writeMap(obj){
  // 只保留合法字段，结构矩形做基本校验
  const out={};
  // v0.2：地图尺寸（编辑器可扩展行列）
  if(Number.isFinite(obj.cols)&&obj.cols>4) out.cols=Math.floor(obj.cols);
  if(Number.isFinite(obj.rows)&&obj.rows>4) out.rows=Math.floor(obj.rows);
  for(const k of RECT_KEYS){
    if(Array.isArray(obj[k])){
      out[k]=obj[k].filter(r=>r&&typeof r.x==='number'&&typeof r.y==='number'
        &&typeof r.w==='number'&&typeof r.h==='number'&&r.w>0&&r.h>0);
    }
  }
  if(Array.isArray(obj.lamps)) out.lamps=obj.lamps.filter(l=>l&&typeof l.x==='number'&&typeof l.y==='number');
  if(obj.overrides&&typeof obj.overrides==='object'){
    out.overrides={};
    for(const k in obj.overrides){
      const v=obj.overrides[k];
      if(v&&typeof v==='object'&&v.t) out.overrides[k]={t:v.t};
    }
  }
  // 还原默认：写空对象 {}，readMap 会因无有效键自动回退到 map-base.json；游戏 applyMapData({}) 也为空操作
  if(!Object.keys(out).length){ fs.writeFileSync(MAP_DATA_FILE,'{}'); return {reset:true}; }
  fs.writeFileSync(MAP_DATA_FILE, JSON.stringify(out,null,1));
  return out;
}

function sendJSON(res,code,obj){
  const b=JSON.stringify(obj);
  res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(b);
}
function sendFile(res,file){
  fs.readFile(file,(err,buf)=>{
    if(err){ res.writeHead(404,{'Content-Type':'text/plain'}); res.end('not found'); return; }
    const ext=path.extname(file).toLowerCase();
    const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
      '.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8'}[ext]||'application/octet-stream';
    res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});
    res.end(buf);
  });
}
function readBody(req,cb){
  let raw='';
  req.on('data',d=>raw+=d);
  req.on('end',()=>{ try{ cb(JSON.parse(raw||'{}')); }catch(e){ cb(null); } });
}

const server=http.createServer((req,res)=>{
  const u=req.url.split('?')[0];
  if(u==='/'||u==='/index.html'){ sendFile(res,path.join(DIR,'index.html')); return; }
  if(u==='/map-base.json'){ sendFile(res,MAP_BASE_FILE); return; }
  if(u==='/api/map'){
    if(req.method==='GET'){ sendJSON(res,200,readMap()); return; }
    if(req.method==='POST'){
      readBody(req,body=>{
        if(!body){ sendJSON(res,400,{ok:false,error:'bad json'}); return; }
        try{
          if(body.action==='reset'){ writeMap({}); sendJSON(res,200,{ok:true,reset:true}); return; }
          const out=writeMap(body);
          sendJSON(res,200,{ok:true,counts:out.reset?{}:{paths:(out.paths||[]).length,lakes:(out.lakes||[]).length,
            bridges:(out.bridges||[]).length,walls:(out.walls||[]).length,buildings:(out.buildings||[]).length,
            lamps:(out.lamps||[]).length,overrides:Object.keys(out.overrides||{}).length}});
        }catch(e){ sendJSON(res,400,{ok:false,error:String(e.message||e)}); }
      });
      return;
    }
    res.writeHead(405); res.end('method not allowed'); return;
  }
  if(u==='/api/tiles'){
    if(req.method==='GET'){ sendJSON(res,200,{overrides:readOverrides()}); return; }
    if(req.method==='POST'){
      readBody(req,body=>{
        if(!body){ sendJSON(res,400,{ok:false,error:'bad json'}); return; }
        try{
          const ov=readOverrides();
          let cells=[];
          if(Array.isArray(body.cells)) cells=body.cells;
          else if(typeof body.x==='number'&&typeof body.y==='number') cells=[body];
          else if(body.action==='clear') cells=[];
          for(const c of cells){
            if(typeof c.x!=='number'||typeof c.y!=='number') continue;
            const k=c.x+','+c.y;
            if(c.erase||c.t==null||c.t==='erase'){ if(ov[k]) delete ov[k]; }
            else ov[k]={t:c.t};
          }
          fs.writeFileSync(OV_FILE, JSON.stringify({overrides:ov},null,1));
          sendJSON(res,200,{ok:true,count:Object.keys(ov).length});
        }catch(e){ sendJSON(res,400,{ok:false,error:String(e.message||e)}); }
      });
      return;
    }
    res.writeHead(405); res.end('method not allowed'); return;
  }
  // v0.3：贴图资源目录
  if(u.startsWith('/assets/')){
    const rel=u.slice('/assets/'.length);
    const fp=path.normalize(path.join(ASSETS_DIR,rel));
    if(fp.startsWith(ASSETS_DIR)){ sendFile(res,fp); return; }
    res.writeHead(403); res.end('forbidden'); return;
  }
  // 其它静态文件（仅限本目录内）
  const fp=path.normalize(path.join(DIR,u));
  if(fp.startsWith(DIR)){ sendFile(res,fp); return; }
  res.writeHead(403); res.end('forbidden');
});

server.listen(PORT,()=>{
  console.log('Lixin 地图编辑器已启动: http://localhost:'+PORT);
  console.log('地图数据文件: '+MAP_DATA_FILE);
});
