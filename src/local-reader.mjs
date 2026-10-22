import {bindLocalReading} from './parallel-model.mjs';

// No network upload, persistence, annotation actions or PDF scripting manager.
const $=id=>document.getElementById(id);
const el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
const fileStatus=$('file-status'),translationStatus=$('translation-status');
let pdf,loadingTask,renderTask,textLayer,pdfjs,sha256='',pageNumber=1,reading,epoch=0,renderEpoch=0,translationEpoch=0;
let activeId='',syncLock=false,scrollFrame=0;
const stateLabels={'untranslated':'미번역','machine-draft':'기계 번역 초안','source-checked':'원문 대조 검토 · 사람 검수 아님','human-reviewed':'사람 검토 기록 있음'};
const controls=['translation-file','template','page-number','zoom'];

async function cancelDocument(){
  renderEpoch++;translationEpoch++;renderTask?.cancel();textLayer?.cancel();
  const task=loadingTask;loadingTask=null;pdf=null;
  if(task)try{await task.destroy();}catch{/* An interrupted load has no retained document. */}
}
function clearTranslation(){
  reading=null;activeId='';$('translation-file').value='';translationStatus.textContent='';
  $('translation-pane').replaceChildren(el('p','PDF를 선택한 뒤 .txt 또는 .json 번역 파일을 열어 주세요.'));
  $('local-toc').replaceChildren(el('p','대응 정보가 있는 번역 파일을 열면 표시됩니다.'));
}
async function reset(){
  const current=++epoch;await cancelDocument();if(current!==epoch)return;clearTranslation();sha256='';pageNumber=1;
  $('pdf-file').value='';$('page-total').textContent='/ 0';$('page-number').value='1';
  controls.forEach(id=>$(id).disabled=true);$('previous-page').disabled=true;$('next-page').disabled=true;
  $('pdf-page').hidden=true;$('pdf-text').replaceChildren();$('pdf-canvas').width=0;$('pdf-canvas').height=0;
  $('pdf-pane').querySelector('.pane-empty').hidden=false;
  $('file-fingerprint').textContent='선택된 파일이 없습니다.';fileStatus.textContent='파일을 닫았습니다. PDF를 먼저 선택하세요.';
}
function activate(unit,{scroll=false}={}){
  if(!unit||!reading)return;
  activeId=unit.id;
  for(const node of $('translation-pane').querySelectorAll('[data-unit]'))node.dataset.active=String(node.dataset.unit===unit.id);
  if(scroll){
    const node=document.getElementById(`local-${unit.id}`);
    syncLock=true;$('translation-pane').scrollTop=node.offsetTop-$('translation-pane').offsetTop;
    requestAnimationFrame(()=>requestAnimationFrame(()=>syncLock=false));
  }
}
function syncFromPage(){
  if(!reading||!$('page-sync').checked)return;
  // Exact declared page interval, not a document scroll percentage or guessed PDF coordinates.
  const current=reading.units.find(unit=>unit.id===activeId);
  const inPage=unit=>unit.location.pdfPageStart<=pageNumber&&unit.location.pdfPageEnd>=pageNumber;
  activate(current&&inPage(current)?current:reading.units.find(inPage),{scroll:true});
}
async function renderPage(number,{sync=true}={}){
  if(!pdf)return;
  pageNumber=Math.max(1,Math.min(pdf.numPages,number));
  const current=++renderEpoch,documentEpoch=epoch;
  renderTask?.cancel();textLayer?.cancel();
  $('page-number').value=String(pageNumber);$('previous-page').disabled=pageNumber===1;$('next-page').disabled=pageNumber===pdf.numPages;
  try{
    const page=await pdf.getPage(pageNumber);
    if(current!==renderEpoch||documentEpoch!==epoch)return;
    const base=page.getViewport({scale:1});
    const available=$('pdf-pane').clientWidth-24;
    const scale=$('zoom').value==='fit'?Math.min(3,Math.max(.25,(available>0?available:500)/base.width)):Number($('zoom').value);
    const viewport=page.getViewport({scale});
    if(!Number.isFinite(viewport.width*viewport.height)||viewport.width>16000||viewport.height>30000||viewport.width<1||viewport.height<1)throw new Error('Page dimensions exceed the local rendering limit');
    const ratio=Math.min(window.devicePixelRatio||1,2,Math.sqrt(12_000_000/(viewport.width*viewport.height)),16000/viewport.width,16000/viewport.height);
    const canvas=$('pdf-canvas'),container=$('pdf-page');
    canvas.width=Math.floor(viewport.width*ratio);canvas.height=Math.floor(viewport.height*ratio);
    canvas.style.width=`${viewport.width}px`;canvas.style.height=`${viewport.height}px`;
    container.style.width=`${viewport.width}px`;container.style.height=`${viewport.height}px`;
    container.style.setProperty('--scale-factor',String(scale));container.hidden=false;
    container.style.setProperty('--user-unit',String(page.userUnit||1));
    container.style.setProperty('--total-scale-factor',String(scale*(page.userUnit||1)));
    container.style.setProperty('--scale-round-x','1px');container.style.setProperty('--scale-round-y','1px');
    $('pdf-pane').querySelector('.pane-empty').hidden=true;
    $('pdf-text').replaceChildren();
    renderTask=page.render({canvasContext:canvas.getContext('2d'),viewport,transform:ratio!==1?[ratio,0,0,ratio,0,0]:null});
    await renderTask.promise;
    if(current!==renderEpoch||documentEpoch!==epoch)return;
    const content=await page.getTextContent();
    if(current!==renderEpoch||documentEpoch!==epoch)return;
    textLayer=new pdfjs.TextLayer({textContentSource:content,container:$('pdf-text'),viewport});await textLayer.render();
    if(current!==renderEpoch||documentEpoch!==epoch)return;
    $('pdf-pane').scrollTop=0;
    fileStatus.textContent=`PDF ${pageNumber}/${pdf.numPages}쪽 · 현재 한 페이지만 표시합니다. 선택 가능한 텍스트가 없는 스캔도 있습니다.`;
    if(sync)syncFromPage();
  }catch(error){
    if(['RenderingCancelledException','AbortException'].includes(error.name)||current!==renderEpoch||documentEpoch!==epoch)return;
    fileStatus.textContent='이 페이지를 표시하지 못했습니다. 다른 페이지를 선택하거나 PDF를 다시 열어 주세요.';
  }
}
$('pdf-file').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  const current=++epoch;await cancelDocument();if(current!==epoch)return;clearTranslation();
  sha256='';pageNumber=1;$('page-number').value='1';$('page-total').textContent='/ 0';
  $('pdf-canvas').width=0;$('pdf-canvas').height=0;$('pdf-text').replaceChildren();
  controls.forEach(id=>$(id).disabled=true);$('pdf-page').hidden=true;
  $('previous-page').disabled=true;$('next-page').disabled=true;
  $('file-fingerprint').textContent='선택한 파일을 확인하는 중입니다.';
  if(!file.size||file.size>50_000_000){fileStatus.textContent='PDF는 비어 있지 않은 50MB 이하 파일만 열 수 있습니다.';return;}
  fileStatus.textContent='PDF를 이 브라우저 안에서 읽는 중입니다…';
  try{
    const bytes=new Uint8Array(await file.arrayBuffer());
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    const hash=Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('');
    if(current!==epoch)return;
    pdfjs??=await import('./vendor/pdfjs/build/pdf.min.mjs');
    if(current!==epoch)return;
    pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs/build/pdf.worker.min.mjs',import.meta.url).href;
    const base=new URL('./vendor/pdfjs/',import.meta.url);
    const task=pdfjs.getDocument({data:bytes,cMapUrl:new URL('cmaps/',base).href,cMapPacked:true,standardFontDataUrl:new URL('standard_fonts/',base).href,wasmUrl:new URL('wasm/',base).href,iccUrl:new URL('iccs/',base).href,enableXfa:false,maxImageSize:24_000_000});
    loadingTask=task;
    const loaded=await task.promise;
    if(current!==epoch){await task.destroy();return;}
    pdf=loaded;
    sha256=hash;pageNumber=1;controls.forEach(id=>$(id).disabled=false);
    $('page-number').max=String(pdf.numPages);$('page-total').textContent=`/ ${pdf.numPages}`;
    $('file-fingerprint').textContent=`SHA-256: ${sha256} · PDF 총 ${pdf.numPages}쪽. 이 값은 외부로 보내거나 저장하지 않습니다.`;
    await renderPage(1);
  }catch(error){
    if(current!==epoch)return;
    fileStatus.textContent=error.name==='PasswordException'?'암호화 PDF는 지원하지 않습니다. 암호가 없는 열람 가능한 사본을 직접 준비해 주세요.':'PDF를 열지 못했습니다. 손상·미지원 형식인지 확인해 주세요.';
    $('file-fingerprint').textContent='유효한 PDF가 선택되지 않았습니다.';await cancelDocument();
  }
});
function renderTranslation(doc){
  const pane=$('translation-pane'),toc=$('local-toc');pane.replaceChildren();toc.replaceChildren();
  const byId=new Map(doc.units.map(unit=>[unit.id,unit]));
  for(const section of doc.sections){
    const tocButton=el('button',section.title);tocButton.type='button';
    tocButton.addEventListener('click',()=>goUnit(byId.get(section.unitIds[0])));toc.append(tocButton);
    pane.append(el('h3',section.title));
    for(const id of section.unitIds){
      const unit=byId.get(id),article=el('article',undefined,'translation-unit');article.id=`local-${id}`;article.dataset.unit=id;
      const loc=unit.location;
      const button=el('button',`원문 PDF ${loc.pdfPageStart}${loc.pdfPageEnd!==loc.pdfPageStart?`–${loc.pdfPageEnd}`:''}쪽 · 인쇄 ${loc.printedPageStart} · 페이지 기준 이동`,'unit-location');button.type='button';button.addEventListener('click',()=>goUnit(unit));
      article.append(button,el('p',`${stateLabels[unit.translationState]} · ${loc.label}`,'unit-state'),el(unit.kind==='equation'?'pre':'p',unit.translation||'이 단위는 아직 번역되지 않았습니다.','unit-translation'));
      const original=el('details'),summary=el('summary','대응 원문 텍스트');original.append(summary,el('p',unit.original));article.append(original);
      if(unit.notes.length){const notes=el('details');notes.append(el('summary','별도 해설 · 분석자'));for(const note of unit.notes)notes.append(el('p',note.text));article.append(notes);}
      pane.append(article);
    }
  }
}
function goUnit(unit){activate(unit,{scroll:true});renderPage(unit.location.pdfPageStart,{sync:false});}
$('translation-file').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file||!pdf)return;
  const current=++translationEpoch,documentEpoch=epoch;
  if(!file.size||file.size>5_000_000){translationStatus.textContent='번역은 비어 있지 않은 5MB 이하 .txt/.json 파일이어야 합니다.';return;}
  try{
    const text=(await file.text()).replace(/^\uFEFF/,'');if(current!==translationEpoch||documentEpoch!==epoch)return;
    if(file.name.toLowerCase().endsWith('.json')){
      const doc=bindLocalReading(JSON.parse(text),{sha256,pageCount:pdf.numPages});
      reading=doc;renderTranslation(doc);syncFromPage();
      translationStatus.textContent=`대응 번역 ${doc.units.length}개 · ${doc.coverage.description} · 제외: ${doc.coverage.excluded.join(', ')||'사용자 미기재'}. 파일의 검토 표시는 사용자의 기록이며 사이트가 보증하지 않습니다.`;
    }else if(file.name.toLowerCase().endsWith('.txt')){
      clearTranslation();$('translation-pane').replaceChildren(el('pre',text,'plain-translation'));
      translationStatus.textContent='일반 텍스트 · 위치 정보가 없어 페이지 연결을 사용하지 않습니다. 수동으로 대조하세요.';
    }else throw new Error('지원 형식은 .txt 또는 .json입니다');
  }catch(error){
    clearTranslation();translationStatus.textContent=`번역 파일을 연결하지 못했습니다: ${error instanceof SyntaxError?'JSON 문법 오류':error.message}`;
  }
});
$('translation-pane').addEventListener('scroll',()=>{
  if(syncLock||!reading||!$('page-sync').checked||scrollFrame)return;
  scrollFrame=requestAnimationFrame(()=>{
    scrollFrame=0;const pane=$('translation-pane'),top=pane.getBoundingClientRect().top;
    const nodes=[...pane.querySelectorAll('[data-unit]')];
    const node=nodes.find(node=>node.getBoundingClientRect().bottom>top+35);
    const unit=reading?.units.find(unit=>unit.id===node?.dataset.unit);
    if(!unit)return;activate(unit);
    if(pageNumber<unit.location.pdfPageStart||pageNumber>unit.location.pdfPageEnd)renderPage(unit.location.pdfPageStart,{sync:false});
  });
},{passive:true});
$('previous-page').addEventListener('click',()=>renderPage(pageNumber-1));
$('next-page').addEventListener('click',()=>renderPage(pageNumber+1));
$('page-number').addEventListener('change',()=>renderPage(Number.parseInt($('page-number').value,10)||pageNumber));
$('zoom').addEventListener('change',()=>renderPage(pageNumber,{sync:false}));
$('page-sync').addEventListener('change',syncFromPage);
$('clear-files').addEventListener('click',reset);
for(const button of document.querySelectorAll('button[data-side]'))button.addEventListener('click',()=>{
  document.querySelector('.local-layout').dataset.side=button.dataset.side;
  for(const item of document.querySelectorAll('button[data-side]'))item.setAttribute('aria-pressed',String(item===button));
  if(button.dataset.side==='original')renderPage(pageNumber,{sync:false});
});
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(pdf&&$('zoom').value==='fit')renderPage(pageNumber,{sync:false});},200);});
$('template').addEventListener('click',()=>{
  if(!pdf)return;
  const doc={id:'personal-reading',title:'직접 작성할 개인 번역',source:{version:'직접 확인한 판본을 적으세요',citation:'저자·제목·연도를 적으세요',pdfPageCount:pdf.numPages,pdfSha256:sha256},coverage:{description:'직접 작성한 범위를 적으세요',completeBody:false,excluded:['미작성 범위']},sections:[{id:'section-one',title:'직접 확인한 절 제목',unitIds:['unit-one']}],units:[{id:'unit-one',kind:'paragraph',original:'실제 원문을 직접 확인해 입력하세요. 이 문장은 양식 안내입니다.',translation:'',translationState:'untranslated',location:{pdfPageStart:1,pdfPageEnd:1,printedPageStart:'직접 확인',label:'직접 확인한 위치',precision:'page'},notes:[]}],rights:{status:'unverified'}};
  const url=URL.createObjectURL(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}));
  const link=el('a');link.href=url;link.download='personal-reading-template.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
window.addEventListener('pagehide',()=>{epoch++;cancelDocument();});
