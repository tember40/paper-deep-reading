import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {validateLibrary} from '../src/model.mjs';
import {homePage,paperPage,informationPage} from '../src/render.mjs';
import {writeGenerated} from '../src/output.mjs';
import {localReaderPage} from '../src/local-page.mjs';
import {pdfAssets} from './pdf-assets.mjs';
import {parallelPage} from '../src/parallel-page.mjs';
import {referencesPage} from '../src/references-page.mjs';
import {validateParallelReading} from '../src/parallel-model.mjs';
import {readingAssets} from './reading-assets.mjs';

export const root = fileURLToPath(new URL('../',import.meta.url));
export async function loadLibrary() {
  const readJson = async name => JSON.parse(await readFile(path.join(root,'content',name),'utf8'));
  const catalog = await readJson('catalog.json');
  const questions = await readJson('questions.json');
  // Validate path-bearing IDs before reading any author-controlled filename.
  for (const entry of catalog.papers) if (!/^[a-z][a-z0-9-]*$/.test(entry.id)) throw new Error('잘못된 논문 ID');
  const papers = new Map();
  for (const entry of catalog.papers.filter(p=>p.status==='ready')) papers.set(entry.id,await readJson(`papers/${entry.id}.json`));
  validateLibrary(catalog,papers,questions);
  return {catalog,papers,questions};
}
export async function loadReadings({includeDraft=false}={}){
  const entries=JSON.parse(await readFile(path.join(root,'content/readings.json'),'utf8'));
  const readings=new Map(),ids=new Set();
  for(const entry of entries){
    if(!/^[a-z][a-z0-9-]*$/.test(entry.id)||ids.has(entry.id)||!['draft','ready'].includes(entry.status)||typeof entry.readingTitle!=='string'||!entry.readingTitle.trim())throw new Error('리딩 목록 오류');
    ids.add(entry.id);
    const reading=JSON.parse(await readFile(path.join(root,'content/readings',`${entry.id}.json`),'utf8'));
    if(reading.id!==entry.id)throw new Error('리딩 파일 ID 불일치');
    validateParallelReading(reading,{forPublication:entry.status==='ready'});
    if(entry.status==='ready'||includeDraft)readings.set(entry.id,{entry,reading,figures:await readingAssets(root,reading)});
  }
  return readings;
}
export async function build({includeDraft=false}={}) {
  const {catalog,papers,questions} = await loadLibrary();
  const readings=await loadReadings({includeDraft});
  for(const {reading} of readings.values())for(const unit of reading.units)for(const note of unit.notes)for(const target of note.analysisLinks||[]){
    if(!papers.get(target.paperId)?.sections.some(section=>section.id===target.sectionId))throw new Error('관련 분석 위치를 찾지 못했습니다');
  }
  const dist = path.join(root,'dist');
  const outputs=new Map([
    ['index.html',homePage(catalog,papers,questions,[...readings.values()])],
    ['guide.html',informationPage(catalog,'guide')],
    ['rights.html',informationPage(catalog,'rights')],
    ['local-reader/index.html',localReaderPage()]
  ]);
  for (const entry of catalog.papers.filter(p=>p.status==='ready')) {
    outputs.set(`papers/${entry.id}/index.html`,paperPage(catalog,entry,papers.get(entry.id),questions,[...readings.values()]));
  }
  for(const {entry,reading,figures} of readings.values()){
    outputs.set(`readings/${entry.id}/index.html`,parallelPage(entry,reading,{draft:entry.status!=='ready',figures}));
    outputs.set(`readings/${entry.id}/references.html`,referencesPage(entry,reading));
    for(const item of figures.values())outputs.set(`assets/papers/${entry.id}/${item.file}`,item.svg);
  }
  for (const asset of ['styles.css','library.css','reader.mjs','favicon.svg','model.mjs','calculations.mjs','parallel-model.mjs','book-model.mjs','local-reader.mjs','local-reader.css','parallel-reader.mjs','parallel-reader.css']) outputs.set(`assets/${asset}`,await readFile(path.join(root,'src',asset)));
  for(const [name,value] of await pdfAssets(root))outputs.set(name,value);
  if (catalog.licenseStatus==='approved') {
    outputs.set('licenses/MIT.txt',await readFile(path.join(root,'LICENSE-MIT.txt')));
    outputs.set('licenses/CONTENT.txt',await readFile(path.join(root,'LICENSE-CONTENT.md')));
    outputs.set('licenses/THIRD-PARTY.txt',await readFile(path.join(root,'THIRD-PARTY.md')));
  }
  outputs.set('.nojekyll','');
  const obsolete=await writeGenerated(dist,outputs);
  if (obsolete.length) console.log(`Removed obsolete generated pages: ${obsolete.join(', ')}. Rebuild from content to restore.`);
  console.log(`Built ${papers.size} paper analyses; ${questions.length} user questions. Output: ${dist}`);
  return dist;
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) await build({includeDraft:process.argv.includes('--draft-reading')});
