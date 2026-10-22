import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

export async function pdfAssets(root){
  const base=path.join(root,'node_modules','pdfjs-dist');
  const assets=new Map();
  const add=async(source,target)=>assets.set('assets/vendor/pdfjs/'+target,await readFile(path.join(base,source)));
  try{
    const metadata=JSON.parse(await readFile(path.join(base,'package.json'),'utf8'));
    if(metadata.version!=='6.4.299') throw new Error('검증한 PDF.js 고정 버전과 다릅니다');
    for(const file of ['pdf.min.mjs','pdf.worker.min.mjs']) await add('build/'+file,'build/'+file);
    await add('LICENSE','LICENSE.txt');
    await add('web/pdf_viewer.css','web/pdf_viewer.css');
    for(const directory of ['cmaps','standard_fonts','wasm','iccs']){
      for(const entry of await readdir(path.join(base,directory),{withFileTypes:true})){
        if(!entry.isFile()||!/^[A-Za-z0-9_.-]+$/.test(entry.name)) throw new Error('예상하지 못한 PDF 지원 자산');
        // No scripting sandbox or QuickJS runtime is distributed by this viewer.
        if(entry.name.startsWith('quickjs-')) continue;
        await add(`${directory}/${entry.name}`,`${directory}/${entry.name}`);
      }
    }
    // GPL-v2 Liberation 1.07.4 is separate from Apache-2.0 PDF.js.
    // Distribute its unmodified corresponding SFD/build sources next to the fonts.
    const fontSource=await readFile(path.join(root,'vendor/font-source/liberation-fonts-1.07.4.tar.gz'));
    if(createHash('sha256').update(fontSource).digest('hex')!=='ad98b7498dc2992f7f0868f79b65ce4a720a3acdb63ab3f1f1cb6881117a5406')throw new Error('Liberation 대응 소스 체크섬이 다릅니다');
    assets.set('assets/vendor/pdfjs/font-source/liberation-fonts-1.07.4.tar.gz',fontSource);
  }catch(error){throw new Error(`PDF 읽기 의존성을 먼저 설치하세요: pnpm install --frozen-lockfile --no-optional. ${error.message}`);}
  return assets;
}
