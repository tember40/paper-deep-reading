import test from 'node:test';
import assert from 'node:assert/strict';
import {planBook,locateBookPage} from '../src/book-model.mjs';
import {loadReadings} from '../scripts/build.mjs';
import {parallelPage} from '../src/parallel-page.mjs';

test('paired pages pack short units and never reorder or omit source units',()=>{
 const ids=['a','b','c','d','e'];
 const sizes={a:[2,3],b:[3,2],c:[12,23],d:[4,4],e:[4,4]};
 const groups=planBook(ids,units=>({original:Math.ceil(units.reduce((n,id)=>n+sizes[id][0],0)/10),translation:Math.ceil(units.reduce((n,id)=>n+sizes[id][1],0)/10)}));
 assert.deepEqual(groups.map(g=>g.ids),[['a','b'],['c'],['d','e']]);
 assert.deepEqual(groups.flatMap(g=>g.ids),ids);
 assert.deepEqual(groups.map(g=>[g.start,g.pages]),[[0,1],[1,3],[4,1]]);
 assert.equal(groups[1].original,2);assert.equal(groups[1].translation,3);
});
test('page addressing is bounded and includes the final continuation on the longer side',()=>{
 const groups=planBook(['a','b'],ids=>({original:ids.length===1?1:3,translation:ids.includes('b')?3:1}));
 assert.equal(locateBookPage(groups,-100).page,0);
 assert.equal(locateBookPage(groups,999).page,3);
 assert.equal(locateBookPage(groups,3).part,2);
 assert.equal(locateBookPage(groups,3).group.ids[0],'b');
 assert.equal(locateBookPage(groups,NaN).page,0);
 assert.equal(locateBookPage([],0),null);
});
test('invalid layout measurements and duplicate IDs fail instead of hiding content',()=>{
 assert.throws(()=>planBook(['a','a'],()=>({original:1,translation:1})),/중복/);
 for(const value of [0,-1,NaN,Infinity,1.5])assert.throws(()=>planBook(['a'],()=>({original:value,translation:1})),/측정/);
});
test('actual book markup preserves every original/translation unit and exposes accessible page controls',async()=>{
 const {entry,reading,figures}=(await loadReadings()).get('azulay-weiss-2019');
 const html=parallelPage(entry,reading,{figures});
 for(const id of ['book-start','book-previous','book-next','book-page','book-notes-content'])assert.ok(html.includes(`id="${id}"`));
 assert.ok(html.includes('aria-keyshortcuts="ArrowRight PageDown"'));
 assert.ok(html.includes('원본 PDF 쪽 번호와 다릅니다'));
 assert.ok(!html.includes('id="parallel-sync"'));
 for(const unit of reading.units)for(const side of ['original','translation'])assert.ok(html.includes(`id="${side}-${unit.id}"`));
 assert.equal((html.match(/class="book-flow"/g)||[]).length,2);
 assert.equal((html.match(/<img /g)||[]).length,18);
 assert.ok(html.includes('parallel-reader.css?v=book-pages-1'));
 assert.ok(html.includes('parallel-reader.mjs?v=book-pages-1'));
});
