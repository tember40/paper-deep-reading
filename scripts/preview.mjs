import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {root} from './build.mjs';

const port = Number(process.env.PORT || 8780);
if (!Number.isInteger(port) || port<1024 || port>65535) throw new Error('PORT는1024~65535 정수여야 합니다');
const dist = path.join(root,'dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const server = http.createServer(async (request,response)=>{
  if (!['GET','HEAD'].includes(request.method)) {response.writeHead(405);response.end();return;}
  try {
    const url = new URL(request.url,'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const target = path.resolve(dist,`.${pathname}`);
    if (target!==dist && !target.startsWith(dist+path.sep)) {response.writeHead(403);response.end();return;}
    const info = await stat(target);
    const file = info.isDirectory()?path.join(target,'index.html'):target;
    const data = await readFile(file);
    response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    response.end(request.method==='HEAD'?undefined:data);
  } catch {response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});response.end('페이지를 찾지 못했습니다.');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/`));
