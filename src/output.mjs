import {lstat,mkdir,readFile,unlink,writeFile} from 'node:fs/promises';
import path from 'node:path';

const MANIFEST='.generated-files.json';
const allowedName=name=>[
  name===MANIFEST,name==='.nojekyll',name==='local-reader/index.html',
  name==='assets/vendor/pdfjs/font-source/liberation-fonts-1.07.4.tar.gz',
  /^(index|guide|rights)\.html$/.test(name),
  /^licenses\/(MIT|CONTENT|THIRD-PARTY)\.txt$/.test(name),
  /^(papers|readings)\/[a-z][a-z0-9-]*\/index\.html$/.test(name),
  /^assets\/(styles\.css|reader\.mjs|model\.mjs|calculations\.mjs|favicon\.svg|parallel-model\.mjs|book-model\.mjs|local-reader\.(mjs|css)|parallel-reader\.(mjs|css))$/.test(name),
  /^assets\/papers\/azulay-weiss-2019\/figure-(01|02|04|05|06|08|09|10|11)\.svg$/.test(name),
  /^assets\/vendor\/pdfjs\/(LICENSE\.txt|build\/pdf(?:\.worker)?\.min\.mjs|web\/pdf_viewer\.css|(cmaps|standard_fonts|wasm|iccs)\/[A-Za-z0-9][A-Za-z0-9_.-]*)$/.test(name)&&!name.includes('/quickjs-')
].some(Boolean);
async function rejectSymlinks(root,target) {
  const relative=path.relative(root,target);
  if (relative.startsWith('..'+path.sep) || relative==='..' || path.isAbsolute(relative)) throw new Error('출력 경로가 생성 폴더를 벗어납니다');
  let current=root;
  for (const part of ['',...relative.split(path.sep).filter(Boolean)]) {
    if (part) current=path.join(current,part);
    try {if ((await lstat(current)).isSymbolicLink()) throw new Error('심볼릭 링크에는 생성 결과를 쓰거나 삭제하지 않습니다');}
    catch(error) {if(error.code!=='ENOENT') throw error;}
  }
}
export async function writeGenerated(outputDirectory,entries) {
  const root=path.resolve(outputDirectory);
  const names=[...entries.keys(),MANIFEST];
  if (new Set(names).size!==names.length || !names.every(allowedName)) throw new Error('허용되지 않은 생성 파일 이름');
  await rejectSymlinks(root,root);
  let previous=[];
  try {previous=JSON.parse(await readFile(path.join(root,MANIFEST),'utf8'));}
  catch(error) {if(error.code!=='ENOENT') throw error;}
  if (!Array.isArray(previous) || !previous.every(name=>typeof name==='string' && allowedName(name))) throw new Error('생성 파일 목록이 잘못되어 정리를 중단합니다');
  const obsolete=previous.filter(name=>!names.includes(name));
  // Check every exact target before any write or removal. No recursive deletion.
  for (const name of new Set([...names,...previous])) await rejectSymlinks(root,path.join(root,name));
  await mkdir(root,{recursive:true});
  for (const [name,value] of entries) {
    const target=path.join(root,name);
    await mkdir(path.dirname(target),{recursive:true});
    await writeFile(target,value);
  }
  for (const name of obsolete) {
    try {await unlink(path.join(root,name));}catch(error){if(error.code!=='ENOENT')throw error;}
  }
  await writeFile(path.join(root,MANIFEST),JSON.stringify(names.sort(),null,2)+'\n');
  return obsolete;
}
