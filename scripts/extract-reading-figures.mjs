// Optional editorial utility, not part of installation/build or the private file reader.
// Converts the exact approved PDF to vector excerpts; never executes embedded scripts.
import {readFile,writeFile,mkdir,mkdtemp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const pdfPath=process.argv[2];
if(!pdfPath)throw new Error('사용법: node scripts/extract-reading-figures.mjs <검토한19-519.pdf>');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
if(digest(await readFile(pdfPath))!=='a21121537d7743f4290ee94b143282babb17ddc9168163dbdbb19aebe5545249')throw new Error('승인한 정확한 출판 PDF가 아니므로 자산을 만들지 않습니다');
const crops=[
  {number:'01',page:2,box:[365,85,155,350],scope:'오른쪽 예측 그래프만, 외부 사진 제외'},
  {number:'02',page:4,box:[85,170,280,330],scope:'왼쪽 민감도 그래프만, 오른쪽 사진 제외'},
  {number:'04',page:10,box:[130,85,360,125],scope:'전체 그래프'},
  {number:'05',page:12,box:[210,140,300,80],scope:'위치·거리·검정 그래프만, 사진 제외'},
  {number:'06',page:12,box:[160,420,360,170],scope:'크기별 민감도 그래프만, 사진 제외'},
  {number:'08',page:14,box:[130,380,360,140],scope:'아래쪽 민감도 그래프만, 위쪽 사진 제외'},
  {number:'09',page:18,box:[130,190,350,345],scope:'가운데·아래 민감도 그래프만, 위쪽 예시·사진 제외'},
  {number:'10',page:19,box:[112,125,390,125],scope:'전체 그래프'},
  {number:'11',page:19,box:[100,470,410,125],scope:'전체 그래프'}
];
const scratch=await mkdtemp(path.join(os.tmpdir(),'paper-vector-source-'));
const output=path.join(root,'src/figures/azulay-weiss-2019');await mkdir(output,{recursive:true});
const manifest=[];
for(const crop of crops){
  const rawPath=path.join(scratch,`page-${crop.page}.svg`);
  execFileSync('pdftocairo',['-svg','-f',String(crop.page),'-l',String(crop.page),pdfPath,rawPath],{windowsHide:true});
  let svg=(await readFile(rawPath,'utf8')).replace(/\r\n/g,'\n');
  const images=[...svg.matchAll(/<image\b[\s\S]*?\/>/g)];
  const imageIds=images.map(match=>match[0].match(/\bid="([^"]+)"/)?.[1]).filter(Boolean);
  svg=svg.replace(/<image\b[\s\S]*?\/>/g,'');
  for(const id of imageIds){
    if(!/^[A-Za-z0-9_-]+$/.test(id))throw new Error('예상하지 못한 SVG 이미지 ID');
    svg=svg.replace(new RegExp(`<use\\b[^>]*\\bhref="#${id}"[^>]*\\/>`,'g'),'');
  }
  if(/<image\b|data:|<script\b|<foreignObject\b|\bon[a-z]+\s*=|(?:href|src)\s*=\s*["'](?!#)/i.test(svg))throw new Error('이미지 데이터 또는 활성 콘텐츠가 남아 있어 공개 자산 생성을 중단합니다');
  const [x,y,w,h]=crop.box;
  svg=svg.replace(/(<svg\b[^>]*\b)width="[^"]+"/,`$1width="1200"`).replace(/(<svg\b[^>]*\b)height="[^"]+"/,`$1height="${Math.round(1200*h/w)}"`).replace(/viewBox="[^"]+"/,`viewBox="${x} ${y} ${w} ${h}"`);
  svg=svg.replace(/(<svg\b[^>]*>)/,`$1\n<title>Figure ${Number(crop.number)} · Azulay and Weiss (2019)</title><desc>Original vector graph excerpt, CC BY 4.0. ${crop.scope}. © 2019 Aharon Azulay, Yair Weiss. https://jmlr.org/papers/v20/19-519.html . Raster image elements and their references have been removed; chart values are not redrawn.</desc>`);
  const name=`figure-${crop.number}.svg`;await writeFile(path.join(output,name),svg);
  manifest.push({...crop,file:name,sha256:digest(svg),bytes:Buffer.byteLength(svg),removedRasterElements:images.length});
}
await writeFile(path.join(output,'manifest.json'),JSON.stringify({paperId:'azulay-weiss-2019',sourcePdfSha256:'a21121537d7743f4290ee94b143282babb17ddc9168163dbdbb19aebe5545249',sourceUrl:'https://jmlr.org/papers/volume20/19-519/19-519.pdf',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',attribution:'© 2019 Aharon Azulay, Yair Weiss. JMLR 20(184):1–25. CC BY 4.0.',hashNormalization:'LF',method:'pdftocairo SVG, remove ALL raster image elements and references, crop viewBox; paths/numbers unchanged. Crops still require visual review.',assets:manifest},null,2)+'\n');
console.log(`Created ${manifest.length} vector excerpts. Raw exports are private scratch files: ${scratch}`);
console.log(manifest.map(item=>`${item.file}: ${item.bytes} bytes, removed raster elements ${item.removedRasterElements}`).join('\n'));
