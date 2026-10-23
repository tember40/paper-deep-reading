import test from 'node:test';
import assert from 'node:assert/strict';
import {loadLibrary,loadReadings} from '../scripts/build.mjs';
import {homePage} from '../src/render.mjs';
import {parallelPage} from '../src/parallel-page.mjs';
import {referencesPage} from '../src/references-page.mjs';
import {escapeHtml as e} from '../src/model.mjs';

const library=await loadLibrary(),readings=[...(await loadReadings()).values()];
const {entry,reading,figures}=readings[0];

test('shelf puts the actual ebook before optional analyses and never invents unavailable ebooks',()=>{
 const html=homePage(library.catalog,library.papers,library.questions,readings);
 assert.ok(html.includes('class="bookshop-page"'));
 assert.ok(html.indexOf('class="primary-reading"')<html.indexOf('class="optional-analysis"'));
 assert.equal((html.match(/class="paper-cover /g)||[]).length,readings.length+library.catalog.papers.length);
 assert.ok(html.includes(`href="readings/${entry.id}/index.html#original-abstract-p01"`));
 for(const paper of library.catalog.papers){
   assert.ok(html.includes(e(paper.title)));
   assert.ok(html.includes(`href="${e(library.papers.get(paper.id).doi)}"`));
   assert.ok(!html.includes(`href="readings/${paper.id}/index.html"`));
 }
 assert.equal((html.match(/<details class="optional-analysis">/g)||[]).length,library.papers.size);
 assert.ok(!html.includes('<details class="optional-analysis" open'));
 assert.ok(html.includes('원 논문의 표지가 아닙니다'));
});

test('all reference entries occur once in a separate English-only page, not either book flow',()=>{
 const html=parallelPage(entry,reading,{figures}),referenceHtml=referencesPage(entry,reading);
 const refs=reading.units.filter(unit=>unit.kind==='reference');
 let count=0;
 for(const unit of refs){
   assert.ok(!html.includes(`data-unit="${unit.id}"`));
   assert.ok(html.includes(`id="original-${unit.id}" href="references.html#original-${unit.id}" data-reference-target`));
   assert.ok(html.includes(`id="translation-${unit.id}" href="references.html#original-${unit.id}" data-reference-target`));
   for(const text of unit.original.split(/\n\s*\n/)){
     count++;assert.equal(referenceHtml.split(`<p>${e(text)}</p>`).length-1,1);
     assert.ok(!html.includes(`<p lang="en">${e(unit.original)}</p>`));
   }
 }
 assert.equal(count,37);
 assert.ok(!referenceHtml.includes('translation-column'));
 assert.ok(!referenceHtml.includes('class="book-flow"'));
 assert.ok(referenceHtml.includes(reading.rights.licenseUrl));
 assert.ok(referenceHtml.includes(e(reading.rights.attribution)));
 assert.ok(referenceHtml.includes('재배포·번역 권한을 뜻하지 않습니다'));
});

test('body text and paired unit IDs remain intact after extracting references',()=>{
 const html=parallelPage(entry,reading,{figures});
 const body=reading.units.filter(unit=>unit.kind!=='reference');
 assert.equal((html.match(/data-unit="/g)||[]).length,body.length*2);
 for(const unit of body){
   for(const side of ['original','translation'])assert.ok(html.includes(`id="${side}-${unit.id}" class="parallel-unit`));
   if(!unit.mathKey&&unit.kind!=='table')assert.ok(html.includes(e(unit.original)));
 }
 assert.ok(html.includes('<details id="parallel-toc" class="parallel-toc">'));
 assert.ok(!html.includes('class="parallel-toc" open'));
 assert.ok(!html.includes('<details class="book-notes" id="book-notes" open'));
});
