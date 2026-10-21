import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {root,loadLibrary,build} from '../scripts/build.mjs';
import {validateLibrary,escapeHtml,httpsUrl,linksForPaper,resumeTarget} from '../src/model.mjs';
import {homePage,paperPage,renderBlock} from '../src/render.mjs';
import {atLeastOneActive,conservedGain} from '../src/calculations.mjs';

const library = await loadLibrary();
const dist = await build();
const clone = object => structuredClone(object);

test('an empty question collection renders normally without invented questions',()=>{
  const html=homePage(library.catalog,library.papers,[]);
  assert.ok(html.includes('질문 없이도'));
  assert.ok(!html.includes('id="questions"'));
  assert.ok(!html.includes('question-turing'));
});
test('ready papers have sources, exact section locators and honestly declared reading scope',()=>{
  const home=homePage(library.catalog,library.papers,library.questions);
  assert.equal((home.match(/class="annotation entry-scope"/g)||[]).length,library.papers.size);
  for (const paper of library.papers.values()) {
    assert.ok(paper.scope.length>40);
    assert.ok(paper.limitations.length>40);
    for (const section of paper.sections) {
      assert.ok(section.references.length);
      assert.ok(section.blocks.some(block=>block.type==='p'));
    }
  }
});
test('one user question can connect several papers and several sections without becoming an author question',()=>{
  const catalog=clone(library.catalog);
  const paper=clone(library.papers.get('turing-1950'));
  paper.id='fixture-second';
  catalog.papers.push({...catalog.papers[0],id:paper.id});
  const papers=new Map([...library.papers,[paper.id,paper]]);
  const questions=[{id:'fixture',author:'user',text:'검증 전용 문장',links:[
    {paperId:'turing-1950',sectionId:'reframing',note:'검증용 연결'},
    {paperId:'turing-1950',sectionId:'learning',note:'다른 절'},
    {paperId:paper.id,sectionId:'reframing',note:'다른 논문'}
  ]}];
  assert.equal(validateLibrary(catalog,papers,questions),true);
  assert.equal(linksForPaper(questions,'turing-1950').length,2);
  const rendered=paperPage(catalog,catalog.papers[0],papers.get('turing-1950'),questions);
  assert.ok(rendered.includes('저자의 연구 질문과 구분되는 사용자 질문'));
  assert.ok(rendered.includes('href="#learning"'));
  assert.equal((rendered.match(/<summary>검증 전용 문장<\/summary>/g)||[]).length,1);
  assert.ok(rendered.includes('class="annotation reader-question"'));
  assert.ok(rendered.includes('다른 절'));
  assert.ok(homePage(catalog,papers,questions).includes('fixture-second/index.html#reframing'));
});
test('bad question targets, ambiguous authorship and duplicate links fail before publication',()=>{
  const good={id:'fixture',author:'user',text:'테스트 전용',links:[{paperId:'turing-1950',sectionId:'learning',note:'테스트 연결'}]};
  for (const change of [
    q=>{q.author='assistant';},q=>{q.links[0].paperId='missing';},
    q=>{q.links[0].sectionId='missing';},q=>{q.links.push(clone(q.links[0]));},
    q=>{q.id='../escape';},q=>{q.links[0].note='';}
  ]) {
    const q=clone(good);change(q);
    assert.throws(()=>validateLibrary(library.catalog,library.papers,[q]));
  }
});
test('HTML-like author content is text, not executable markup; external links require HTTPS',()=>{
  const html=renderBlock({type:'p',text:'<img src=x onerror=alert(1)> & "text"'});
  assert.ok(html.includes('&lt;img'));
  assert.ok(!html.includes('<img'));
  assert.equal(escapeHtml("'"),'&#39;');
  for (const bad of ['javascript:alert(1)','http://example.org','https://name:secret@example.org']) assert.throws(()=>httpsUrl(bad));
});
test('a specific URL fragment takes priority over a saved section; stale positions are ignored',()=>{
  const ids=['reframing','learning'];
  assert.equal(resumeTarget({sectionId:'learning'},ids),'learning');
  assert.equal(resumeTarget({sectionId:'learning'},ids,'#reframing'),null);
  assert.equal(resumeTarget({sectionId:'removed'},ids),null);
  assert.equal(resumeTarget(null,ids),null);
});
test('Rosenblatt worked probabilities match complement counting, including boundary cases',()=>{
  for (const [units,expected] of [[1,.2],[4,.5904],[8,.83222784]]) {
    assert.ok(Math.abs(atLeastOneActive(.2,units)-expected)<1e-14);
    assert.ok(Math.abs(atLeastOneActive(.2,units)-(1-.8**units))<1e-14);
  }
  assert.equal(atLeastOneActive(1,0),0);
  assert.equal(atLeastOneActive(1,2),1);
  assert.equal(atLeastOneActive(0,8),0);
  for (const args of [[-1,2],[1.1,2],[NaN,2],[.2,-1],[.2,1.2]]) assert.throws(()=>atLeastOneActive(...args));
  const paper=library.papers.get('rosenblatt-1958');
  const block=paper.sections.flatMap(s=>s.blocks).find(b=>b.type==='activation-example');
  const html=renderBlock(block);
  assert.ok(html.includes('0.83222784'));
  assert.ok(html.includes('분류 정확도가 아님'));
});
test('own isolated gamma-style example conserves total and the rendered numbers match',()=>{
  const deltas=conservedGain(5,2);
  assert.deepEqual(deltas.slice(0,2),[1,1]);
  assert.ok(deltas.slice(2).every(delta=>delta===-2/3));
  assert.ok(Math.abs(deltas.reduce((a,b)=>a+b,0))<1e-14);
  assert.ok(Math.abs(deltas.map(d=>1+d).reduce((a,b)=>a+b,0)-5)<1e-14);
  assert.throws(()=>conservedGain(5,5));
  const html=renderBlock({type:'conservation-example',total:5,active:2});
  assert.ok(html.includes('-0.6667'));
  assert.ok(html.includes('0.3333'));
  assert.ok(html.includes('반올림'));
});
test('duplicate paper/section IDs and malformed tables are rejected',()=>{
  const catalog=clone(library.catalog);
  catalog.papers.push(clone(catalog.papers[0]));
  assert.throws(()=>validateLibrary(catalog,library.papers,[]));
  const paper=clone(library.papers.get('turing-1950'));
  paper.sections.push(clone(paper.sections[0]));
  assert.throws(()=>validateLibrary(library.catalog,new Map([[paper.id,paper]]),[]));
  paper.sections.pop();
  paper.sections[0].blocks.push({type:'table',caption:'test',headers:['one'],rows:[['a','b']]});
  assert.throws(()=>validateLibrary(library.catalog,new Map([[paper.id,paper]]),[]));
});
async function files(folder) {
  const result=[];
  for (const entry of await readdir(folder,{withFileTypes:true})) {
    const name=path.join(folder,entry.name);
    if (entry.isDirectory()) result.push(...await files(name));else result.push(name);
  }
  return result;
}
const generated = await files(dist);
test('every generated local link and fragment exists; links work under a project subpath',async()=>{
  const pages=new Map();
  for (const file of generated.filter(file=>file.endsWith('.html'))) pages.set(file,await readFile(file,'utf8'));
  for (const [file,html] of pages) {
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
    assert.equal(ids.length,new Set(ids).size,`duplicate id in ${file}`);
    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const href=match[1];
      if (href.startsWith('https://')) continue;
      assert.ok(!href.startsWith('/'),`absolute path breaks GitHub project Pages: ${href}`);
      const [relative,fragment]=href.split('#');
      const target=relative?path.resolve(path.dirname(file),relative):file;
      assert.ok(generated.includes(target),`missing ${href} from ${file}`);
      if (fragment) assert.ok(pages.get(target)?.includes(`id="${fragment}"`),`missing fragment ${href}`);
    }
  }
});
test('publication output contains no PDFs, research copies, remote fonts, embeds or trackers',async()=>{
  for (const file of generated) {
    assert.ok(!/\.(pdf|djvu|png|jpe?g|woff2?|ttf)$/i.test(file));
    if (file.endsWith('.html')) {
      const html=await readFile(file,'utf8');
      assert.ok(!/<(?:iframe|embed|object)\b/i.test(html));
      assert.ok(!/<script[^>]+src="https?:/i.test(html));
      assert.ok(!/fonts\.googleapis|google-analytics|googletagmanager/.test(html));
      if (library.catalog.licenseStatus==='pending') assert.ok(html.includes('라이선스 확인 중'));
    }
  }
});
test('an unfinished analysis has no fake reading link',()=>{
  const html=homePage(library.catalog,library.papers,library.questions);
  for (const entry of library.catalog.papers.filter(p=>p.status!=='ready')) {
    assert.ok(!html.includes(`href="papers/${entry.id}/index.html"`));
  }
});

test('approved licenses ship with attribution, separate scope and no pending footer',async()=>{
  if (library.catalog.licenseStatus!=='approved') return;
  const html=await readFile(path.join(dist,'rights.html'),'utf8');
  assert.ok(html.includes('글·자체 도식 CC BY 4.0'));
  assert.ok(html.includes('코드 MIT'));
  assert.ok(!html.includes('라이선스 확인 중'));
  assert.ok((await readFile(path.join(dist,'licenses/MIT.txt'),'utf8')).includes('Permission is hereby granted'));
  assert.ok((await readFile(path.join(dist,'licenses/CONTENT.txt'),'utf8')).includes('https://creativecommons.org/licenses/by/4.0/'));
});
