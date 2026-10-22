import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const APPROVED_PAPER='azulay-weiss-2019';
export async function readingAssets(root,reading){
  if(!reading.units.some(unit=>unit.figure))return new Map();
  if(reading.id!==APPROVED_PAPER||reading.rights.status!=='cleared')throw new Error('그래프 자산의 자료별 승인을 먼저 확인하세요');
  const base=path.join(root,'src/figures',APPROVED_PAPER);
  const manifest=JSON.parse(await readFile(path.join(base,'manifest.json'),'utf8'));
  if(manifest.sourcePdfSha256!==reading.source.pdfSha256||manifest.sourceUrl!==reading.source.url||manifest.licenseUrl!==reading.rights.licenseUrl||manifest.hashNormalization!=='LF')throw new Error('그래프 자산과 승인 판본/권리 정보가 다릅니다');
  const assets=new Map();
  for(const item of manifest.assets){
    if(!/^figure-(01|02|04|05|06|08|09|10|11)\.svg$/.test(item.file)||assets.has(item.file))throw new Error('승인되지 않은 그래프 파일');
    const svg=(await readFile(path.join(base,item.file),'utf8')).replace(/\r\n/g,'\n');
    if(createHash('sha256').update(svg).digest('hex')!==item.sha256||Buffer.byteLength(svg)!==item.bytes)throw new Error('그래프 파일의 무결성 확인 실패');
    if(/<image\b|data:|<script\b|<foreignObject\b|\bon[a-z]+\s*=|(?:href|src)\s*=\s*["'](?!#)/i.test(svg))throw new Error('공개 그래프에 사진 데이터/활성 콘텐츠/외부 참조가 있습니다');
    if(!svg.includes('© 2019 Aharon Azulay, Yair Weiss')||!svg.includes('CC BY 4.0'))throw new Error('그래프 자산 귀속 누락');
    assets.set(item.file,{...item,svg,height:Math.round(1200*item.box[3]/item.box[2])});
  }
  for(const unit of reading.units.filter(unit=>unit.figure)){
    const item=assets.get(unit.figure);
    if(!item||item.page!==unit.location.pdfPageStart||unit.kind!=='caption')throw new Error('본문 그림과 그래프 근거 위치가 다릅니다');
  }
  return assets;
}
