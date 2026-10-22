import test from 'node:test';
import assert from 'node:assert/strict';
import {loadReadings} from '../scripts/build.mjs';
import {validateParallelReading} from '../src/parallel-model.mjs';
import {renderReadingMath} from '../src/reading-math.mjs';

const {reading,figures}= (await loadReadings({includeDraft:true})).get('azulay-weiss-2019');
const byId=new Map(reading.units.map(unit=>[unit.id,unit]));

// Golden landmarks transcribed after checking the actual JMLR PDF pages 1–23.
// Structural/number tests do not establish semantic accuracy or human review.
test('approved pilot covers all body sections, eleven captions, both tables and original references',()=>{
 assert.deepEqual(reading.sections.map(section=>[section.id,section.unitIds.length]),[
  ['abstract',2],['introduction',5],['quantifying',14],['sampling-theorem',27],
  ['learning-invariance',13],['possible-solutions',1],['antialiasing',6],
  ['increased-augmentation',3],['reducing-subsampling',2],['discussion',2],
  ['acknowledgments',1],['references',4]
 ]);
 assert.equal(reading.units.length,80);
 for(const [number,page] of [[1,2],[2,4],[3,7],[4,10],[5,12],[6,12],[7,13],[8,14],[9,18],[10,19],[11,19]]){
  const unit=byId.get(`figure-${String(number).padStart(2,'0')}-caption`);
  assert.equal(unit.location.pdfPageStart,page);assert.ok(unit.original.startsWith(`Figure ${number}:`));
 }
 assert.deepEqual(reading.units.filter(u=>u.kind==='table').map(u=>u.id),['table-01','table-02']);
 assert.ok(byId.get('discussion-p02').original.endsWith('significant photographer’s bias.'));
 assert.equal(reading.units.filter(u=>u.translationState==='original-only').length,5);
 assert.deepEqual([20,21,22,23].map(page=>byId.get(`references-p${page}`).original.split('\n\n').length),[6,14,13,4]);
 for(const unit of reading.units){
  assert.ok(!/[\u3040-\u30ff]/u.test(unit.translation||''),'Unexpected language in Korean translation');
  if(unit.translationState==='original-only')assert.ok(!unit.translation);
  else{assert.equal(unit.translationState,'source-checked');assert.ok(unit.translation.trim());}
  assert.ok(unit.location.pdfPageEnd<=23);
 }
 assert.ok(reading.coverage.excluded.some(s=>s.includes('24–25')));
});

test('actual numeric tokens, original table values and stated limits are preserved',()=>{
 const numbers=text=>new Set(text.normalize('NFKC').replace(/(?<![\p{L}\d])\d{1,3}(?:,\d{3})+(?!\d)/gu,value=>value.replaceAll(',','')).replace(/한\s*픽셀/g,'1 pixel').match(/\d+(?:\.\d+)?/g)||[]);
 for(const unit of reading.units.filter(u=>u.translationState!=='original-only')){
  const translated=numbers(unit.translation);
  for(const number of numbers(unit.original))assert.ok(translated.has(number),`${unit.id}: missing numeric token ${number}`);
 }
 assert.deepEqual(byId.get('table-01').table.rows[1],['Crop','0.062 (0.05)','0.061 (0.14)','0.068']);
 assert.deepEqual(byId.get('table-01').table.rows[5],['Black','0.06 (0.03)','0.086 (0.093)','0.079']);
 assert.deepEqual(byId.get('table-02').table.rows[3],['ReLU (bias=5):','(0,0,0,0)','(0,6,0,0)','0','6']);
 assert.ok(byId.get('table-02').notes[0].text.includes('max(z−5,0)'));
 assert.ok(byId.get('sampling-p02').original.includes('1/60²'));
 assert.ok(byId.get('abstract-p01').translation.includes('시사한다'));
 assert.ok(byId.get('discussion-p02').translation.includes('떨어뜨릴 수 있다'));
 assert.ok(byId.get('antialias-p03').translation.includes('생각한다'));
 assert.ok(byId.get('quantify-p02').notes[0].text.includes('validation set'));
});

test('typesetting cannot silently change the source equations or displayed table values',()=>{
 for(const id of ['shift-interpolation','sampling-proof-equations']){
  const unit=byId.get(id),html=renderReadingMath(unit.mathKey,unit.original);
  assert.ok(html.includes('<math '));assert.ok(html.includes('<annotation encoding="text/plain">'));
  assert.throws(()=>renderReadingMath(unit.mathKey,unit.original+' + 1'),/수식/);
 }
 assert.throws(()=>renderReadingMath('user-supplied','<script>'),/수식/);
 const changed=structuredClone(reading);changed.units.find(u=>u.id==='table-02').table.rows[3][2]='(0,1,0,0)';
 assert.throws(()=>validateParallelReading(changed),/표의 텍스트/);
 const bypass=structuredClone(reading);const body=bypass.units[0];body.translationState='original-only';delete body.translation;
 assert.throws(()=>validateParallelReading(bypass),/원형 유지/);
});

test('source graphs are nine verified vector excerpts, never a concealed photograph or invented value',()=>{
 assert.equal(figures.size,9);
 for(const unit of reading.units.filter(u=>u.figure)){
  const figure=figures.get(unit.figure);assert.equal(figure.page,unit.location.pdfPageStart);
  assert.ok(figure.svg.includes('chart values are not redrawn'));
  assert.ok(!/<image\b|data:|<script\b|<foreignObject\b|(?:href|src)\s*=\s*["'](?!#)/i.test(figure.svg));
 }
 assert.ok(!byId.get('figure-03-caption').figure);
 assert.ok(!byId.get('figure-07-caption').figure);
});
