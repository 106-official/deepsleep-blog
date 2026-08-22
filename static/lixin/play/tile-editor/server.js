// Lixin RPG 贴图编辑器后端（零依赖 Node）
// 启动：node server.js  → 打开 http://localhost:8787
// 编辑结果写入 ../tile-overrides.json，游戏 index.html 启动时会自动加载并生效。
const http=require('http');
const fs=require('fs');
const path=require('path');

const PORT=process.env.PORT||8787;
const DIR=__dirname;
const OV_FILE=path.join(DIR,'..','tile-overrides.json'); // 游戏读取的 override 文件
const MAP_FILE=path.join(DIR,'map-base.json');

function readOverrides(){
  try{ const d=JSON.parse(fs.readFileSync(OV_FILE,'utf-8')); return (d&&d.overrides)||{}; }
  catch(e){ return {}; }
}
function writeOverrides(obj){
  fs.writeFileSync(OV_FILE, JSON.stringify({overrides:obj},null,1));
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

function applyBody(body){
  // body: {cells:[{x,y,t}|{x,y,erase:true}]} 或 {x,y,t} / {x,y,erase:true}
  const ov=readOverrides();
  let cells=[];
  if(Array.isArray(body.cells)) cells=body.cells;
  else if(typeof body.x==='number'&&typeof body.y==='number') cells=[body];
  else if(body.action==='replace'&&body.overrides) return body.overrides;
  else if(body.action==='clear') return {};
  let changed=0;
  for(const c of cells){
    if(typeof c.x!=='number'||typeof c.y!=='number') continue;
    const k=c.x+','+c.y;
    if(c.erase||c.t==null||c.t==='erase'){ if(ov[k]){ delete ov[k]; changed++; } }
    else { ov[k]={t:c.t}; changed++; }
  }
  return ov;
}

const server=http.createServer((req,res)=>{
  const u=req.url.split('?')[0];
  if(u==='/'||u==='/index.html'){ sendFile(res,path.join(DIR,'index.html')); return; }
  if(u==='/map-base.json'){ sendFile(res,MAP_FILE); return; }
  if(u==='/api/map'){ sendFile(res,MAP_FILE); return; }
  if(u==='/api/tiles'){
    if(req.method==='GET'){ sendJSON(res,200,{overrides:readOverrides()}); return; }
    if(req.method==='POST'){
      let raw='';
      req.on('data',d=>raw+=d);
      req.on('end',()=>{
        try{
          const body=JSON.parse(raw||'{}');
          const ov=applyBody(body);
          writeOverrides(ov);
          sendJSON(res,200,{ok:true,count:Object.keys(ov).length});
        }catch(e){ sendJSON(res,400,{ok:false,error:String(e.message||e)}); }
      });
      return;
    }
    res.writeHead(405); res.end('method not allowed'); return;
  }
  // 其它静态文件（仅限本目录内）
  const fp=path.normalize(path.join(DIR,u));
  if(fp.startsWith(DIR)){ sendFile(res,fp); return; }
  res.writeHead(403); res.end('forbidden');
});

server.listen(PORT,()=>{
  console.log('Lixin 贴图编辑器已启动: http://localhost:'+PORT);
  console.log('override 文件: '+OV_FILE);
});
