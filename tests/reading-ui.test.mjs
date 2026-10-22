import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {root,loadReadings,loadLibrary} from '../scripts/build.mjs';
import {validateParallelReading,bindLocalReading} from '../src/parallel-model.mjs';
import {parallelPage} from '../src/parallel-page.mjs';
import {localReaderPage} from '../src/local-page.mjs';
import {pdfAssets} from '../scripts/pdf-assets.mjs';
import {paperPage} from '../src/render.mjs';

const draft=(await loadReadings({includeDraft:true})).get('azulay-weiss-2019');

test('actual approved pilot stays out of public builds until the entire agreed body is ready',async()=>{
  const published=await loadReadings();
  assert.equal(published.has(draft.entry.id),draft.entry.status==='ready');
  assert.equal(validateParallelReading(draft.reading),true);
  const incomplete=structuredClone(draft.reading);incomplete.coverage.completeBody=false;
  assert.throws(()=>validateParallelReading(incomplete,{forPublication:true}),/본문 범위/);
  assert.ok(draft.reading.rights.permissions.publishTranslation);
  assert.ok(draft.reading.source.url.endsWith('/19-519/19-519.pdf'));
});
test('the actual introduction contains both page-crossing paragraphs and an honestly excluded photo',()=>{
  const byId=new Map(draft.reading.units.map(unit=>[unit.id,unit]));
  for(const [id,start,end] of [['intro-p01',1,2],['intro-p02',2,3]]){
    const unit=byId.get(id);assert.equal(unit.location.pdfPageStart,start);assert.equal(unit.location.pdfPageEnd,end);
    assert.ok(!/af-\s+fected|the\s+2\s+location/.test(unit.original));
  }
  assert.ok(byId.get('intro-p02').translation.includes('기대할 것이다'));
  assert.ok(byId.get('intro-p04').translation.includes('높게는 30%'));
  assert.ok(byId.get('abstract-p01').translation.includes('시사한다'));
  assert.ok(draft.reading.coverage.excluded.some(item=>item.includes('외부 사진')));
  assert.ok(!draft.reading.units.some(unit=>unit.translationState==='human-reviewed'));
});
test('each actual paragraph has a pair of stable fragments, a source page and separated analysis',()=>{
  const html=parallelPage(draft.entry,draft.reading,{draft:true});
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(ids.length,new Set(ids).size);
  for(const unit of draft.reading.units){
    for(const side of ['original','translation'])assert.ok(ids.includes(`${side}-${unit.id}`));
    assert.ok(html.includes(`19-519.pdf#page=${unit.location.pdfPageStart}`));
  }
  assert.ok(html.includes('사람 검수를 받은 번역이 아닙니다'));
  assert.ok(html.includes('해설 · 분석자가 덧붙인 설명'));
  assert.ok(html.includes('lecun-1998/index.html#architectural-assumptions'));
  assert.ok(!/<iframe|<img|<object/.test(html));
});
test('local files bind to exact bytes and page count, never a similar filename',()=>{
  const doc=draft.reading,binding={sha256:doc.source.pdfSha256,pageCount:25};
  assert.equal(bindLocalReading(doc,binding),doc);
  assert.throws(()=>bindLocalReading(doc,{...binding,sha256:'0'.repeat(64)}),/SHA-256/);
  assert.throws(()=>bindLocalReading(doc,{...binding,pageCount:24}),/총쪽수/);
  const bad=structuredClone(doc);bad.glossary[0].unitIds.push('nonexistent');
  assert.throws(()=>validateParallelReading(bad),/등장 위치/);
});
test('the related existing analysis links back to the exact pilot paragraph, without an unrelated question',async()=>{
  const library=await loadLibrary();
  const entry=library.catalog.papers.find(paper=>paper.id==='lecun-1998');
  const html=paperPage(library.catalog,entry,library.papers.get(entry.id),library.questions,[draft]);
  assert.ok(html.includes('../../readings/azulay-weiss-2019/index.html#original-intro-p01'));
  assert.equal(library.questions.length,1);
  assert.ok(!library.questions[0].links.some(link=>link.paperId==='azulay-weiss-2019'));
});
test('author-provided local content is not interpreted as HTML or persisted by our file handler',async()=>{
  const script=await readFile(path.join(root,'src/local-reader.mjs'),'utf8');
  assert.ok(!/\b(innerHTML|outerHTML|insertAdjacentHTML|eval|fetch|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB)\b/.test(script));
  assert.ok(script.includes('node.textContent=text'));
  assert.ok(script.includes("querySelectorAll('button[data-side]')"));
  assert.ok(!script.includes("querySelectorAll('[data-side]')"));
  const html=localReaderPage();
  assert.ok(html.includes("object-src 'none'"));assert.ok(html.includes("connect-src 'self'"));
  assert.ok(html.includes('서버로 전송하거나 브라우저 저장소에 보관하지 않습니다'));
});
test('only the pinned renderer, support assets and their license notices are shipped',async()=>{
  const assets=await pdfAssets(root),names=[...assets.keys()];
  assert.ok(names.includes('assets/vendor/pdfjs/build/pdf.worker.min.mjs'));
  assert.ok(!names.some(name=>/quickjs|sandbox/.test(name)));
  for(const directory of ['cmaps','standard_fonts','wasm','iccs'])assert.ok(names.some(name=>name.includes(`/${directory}/LICENSE`)));
  assert.ok(assets.get('assets/vendor/pdfjs/LICENSE.txt').toString().includes('Apache License'));
  assert.equal(assets.get('assets/vendor/pdfjs/font-source/liberation-fonts-1.07.4.tar.gz').length,2937949);
  assert.ok(assets.get('assets/vendor/pdfjs/standard_fonts/LICENSE_LIBERATION').toString().includes('GNU General Public License v.2'));
});
