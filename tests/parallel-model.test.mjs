import test from 'node:test';
import assert from 'node:assert/strict';
import {validateParallelReading,parallelResumeTarget} from '../src/parallel-model.mjs';

// Independently written test sentences, not excerpts or an actual paper.
const fixture=()=>({id:'unit-test-only',title:'검증 전용 — 실제 논문 아님',source:{version:'fixture-v1',citation:'직접 작성한 검증 문장',url:'https://example.org/fixture',pdfPageCount:2},coverage:{description:'검증 문장2개',completeBody:true,excluded:[]},sections:[{id:'test-section',title:'검증 절',unitIds:['unit-a','unit-b']}],units:[{id:'unit-a',kind:'paragraph',original:'A value may change if the input changes.',translation:'입력이 바뀌면 값이 바뀔 수 있다.',translationState:'source-checked',location:{pdfPageStart:1,pdfPageEnd:2,printedPageStart:'101',label:'두 쪽에 걸친 검증 문단',precision:'paragraph'},notes:[{author:'analyst',text:'조건과 가능성을 구분하기 위한 자체 검증 문장.'}]},{id:'unit-b',kind:'equation',original:'y = 2x',translation:'y = 2x',translationState:'source-checked',location:{pdfPageStart:2,pdfPageEnd:2,printedPageStart:'102',label:'검증 식',precision:'page'},notes:[]}],rights:{status:'unverified'}});

test('private drafting does not imply publication permission',()=>{
 const doc=fixture();assert.equal(validateParallelReading(doc),true);
 assert.throws(()=>validateParallelReading(doc,{forPublication:true}),/권리/);
});
test('publication requires both rights, evidence, complete scope and source checking',()=>{
 const doc=fixture();doc.rights={status:'cleared',permissions:{redistributeOriginal:true,publishTranslation:true},evidenceUrl:'https://example.org/permission',licenseUrl:'https://example.org/license',attribution:'검증 작성자',checkedAt:'2026-10-22',allowedScope:'테스트용 문장에만 적용'};
 assert.equal(validateParallelReading(doc,{forPublication:true}),true);
 for(const modify of [d=>{d.rights.permissions.publishTranslation=false},d=>{d.coverage.completeBody=false},d=>{d.units[0].translationState='machine-draft'},d=>{d.rights.evidenceUrl='javascript:alert(1)'}]){const changed=structuredClone(doc);modify(changed);assert.throws(()=>validateParallelReading(changed,{forPublication:true}));}
});
test('missing, extra and duplicate source units are rejected',()=>{
 for(const modify of [d=>d.units.pop(),d=>d.units.push(structuredClone(d.units[0])),d=>d.sections[0].unitIds.push('missing'),d=>{d.units[0].id='unknown'}]){const doc=fixture();modify(doc);assert.throws(()=>validateParallelReading(doc));}
});
test('PDF and printed page labels remain distinct; page-crossing paragraphs are allowed',()=>{
 const doc=fixture();assert.equal(validateParallelReading(doc),true);
 assert.notEqual(String(doc.units[0].location.pdfPageStart),doc.units[0].location.printedPageStart);
 doc.units[0].location.pdfPageEnd=3;assert.throws(()=>validateParallelReading(doc),/쪽수/);
});
test('AI source checking cannot be labeled human review without a human record',()=>{
 const doc=fixture();doc.units[0].translationState='human-reviewed';doc.units[0].review={kind:'ai',name:'도구',date:'2026-10-22'};
 assert.throws(()=>validateParallelReading(doc),/사람/);
});
test('reading positions are scoped to the source version and explicit links take priority',()=>{
 const doc=fixture();const saved={sourceVersion:'fixture-v1',unitId:'unit-a'};
 assert.equal(parallelResumeTarget(doc,saved),'unit-a');
 assert.equal(parallelResumeTarget(doc,saved,'#unit-b'),null);
 assert.equal(parallelResumeTarget(doc,{...saved,sourceVersion:'other'}),null);
 assert.equal(parallelResumeTarget(doc,{...saved,unitId:'removed'}),null);
});
