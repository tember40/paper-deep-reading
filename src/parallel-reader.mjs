import {parallelResumeTarget} from './parallel-model.mjs';
import {planBook,locateBookPage} from './book-model.mjs';

// A cached pre-book HTML page stays readable instead of failing during a rollout.
if(document.querySelector('#book-pagination')){
const $=selector=>document.querySelector(selector);
const layout=$('.parallel-layout'),toc=$('#parallel-toc'),status=$('#parallel-status');
const languages=['original','translation'];
const panes=Object.fromEntries(languages.map(language=>[language,$(`#${language}-scroll`)]));
const flows=Object.fromEntries(languages.map(language=>[language,panes[language].querySelector('.book-flow')]));
const units=Object.fromEntries(languages.map(language=>[language,new Map([...flows[language].querySelectorAll('[data-unit]')].map(node=>[node.dataset.unit,node]))]));
const sections=Object.fromEntries(languages.map(language=>[language,[...flows[language].children]]));
const ids=[...units.original.keys()],version=document.body.dataset.sourceVersion;
const reading={source:{version},units:ids.map(id=>({id}))};
const key=`paper-deep-reading:parallel:v1:${document.body.dataset.readingId}`;
let saved;try{saved=JSON.parse(localStorage.getItem(key));}catch{saved=null;}
const resumeId=parallelResumeTarget(reading,saved,location.hash);
toc.open=false;
let groups=[],current=0,activeId=ids[0],language='original',busy=false,resizeFrame=0;
const notes=$('#book-notes-content'),noteSources=new Map();
for(const id of ids)noteSources.set(id,[...units.translation.get(id).querySelectorAll(':scope > details')].map(node=>node.cloneNode(true)));

function showUnits(selected){
  const visible=new Set(selected);
  for(const side of languages){
    for(const [id,node] of units[side])node.hidden=!visible.has(id);
    for(const section of sections[side]){
      const members=[...section.querySelectorAll('[data-unit]')];
      section.hidden=!members.some(node=>visible.has(node.dataset.unit));
      section.querySelector('h2').hidden=!visible.has(members[0]?.dataset.unit);
    }
    flows[side].style.transform='none';flows[side].style.visibility='visible';flows[side].style.width='100%';
    flows[side].style.columnCount='1';flows[side].style.columnFill='auto';panes[side].scrollLeft=0;
  }
}
function columnCount(side){
  const flow=flows[side];return Math.max(1,Math.ceil((flow.scrollWidth-2)/Math.max(1,flow.getBoundingClientRect().width)));
}
function measure(selected){showUnits(selected);return Object.fromEntries(languages.map(side=>[side,columnCount(side)]));}
function visibleUnits(side,group){
  const edge=panes[side].getBoundingClientRect();
  return group.ids.filter(id=>[...units[side].get(id).getClientRects()].some(rect=>rect.right>edge.left+4&&rect.left<edge.right-4));
}
function setLanguage(next){
  language=next;layout.dataset.language=next;
  for(const button of document.querySelectorAll('[data-language-button]'))button.setAttribute('aria-pressed',String(button.dataset.languageButton===next));
}
function remember(){
  const state=locateBookPage(groups,current);
  try{localStorage.setItem(key,JSON.stringify({sourceVersion:version,unitId:activeId,pagePart:state?.part||0}));}catch{/* Storage denial cannot stop reading. */}
}
function updateNotes(selected){
  notes.replaceChildren();
  for(const id of selected){
    const section=document.createElement('section'),heading=document.createElement('h3');
    heading.textContent=units.translation.get(id).querySelector('.unit-page').textContent;
    section.append(heading,...noteSources.get(id).map(node=>node.cloneNode(true)));notes.append(section);
  }
  $('#book-notes-count').textContent=String(selected.length);
}
function render({anchor,save=true}={}){
  const state=locateBookPage(groups,current);if(!state)return;
  current=state.page;showUnits(state.group.ids);const selected=new Set();
  for(const side of languages){
    const width=panes[side].getBoundingClientRect().width;
    // Balance a long paired unit over the SAME number of leaves in both languages.
    // No sentence alignment is invented; all original text nodes remain intact.
    flows[side].style.width=`${width*state.group.pages}px`;
    flows[side].style.columnCount=String(state.group.pages);flows[side].style.columnFill='balance';
    flows[side].style.transform=`translateX(${-state.part*width}px)`;
    flows[side].inert=false;document.querySelector(`[data-ended="${side}"]`).hidden=true;
    visibleUnits(side,state.group).forEach(id=>selected.add(id));
    document.querySelector(`[data-folio="${side}"]`).textContent=`${current+1} / ${state.total}`;
  }
  activeId=anchor&&state.group.ids.includes(anchor)?anchor:[...selected][0]||state.group.ids[0];
  const activeSection=units.original.get(activeId).closest('section');$('#book-section').textContent=activeSection.querySelector('h2').textContent;
  $('#original-heading').nextElementSibling.textContent=units.original.get(activeId).querySelector('.unit-page').textContent;
  for(const side of languages)for(const [id,node] of units[side])node.dataset.active=String(id===activeId);
  for(const link of toc.querySelectorAll('[data-goto]')){
    if(units.original.get(link.dataset.goto)?.closest('section')===activeSection)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
  }
  $('#book-previous').disabled=current===0;$('#book-next').disabled=current===state.total-1;
  const input=$('#book-page');input.max=String(state.total);input.value=String(current+1);$('#book-total').textContent=`/ ${state.total}쪽`;
  status.textContent=`리딩 ${current+1} / ${state.total}쪽${state.group.pages>1?` · 같은 문단 이어짐 ${state.part+1}/${state.group.pages}`:''}`;
  updateNotes(selected.size?[...selected]:state.group.ids);if(save)remember();
}
function go(id,{side=language,part,focus=true,hash=true}={}){
  const group=groups.find(group=>group.ids.includes(id));if(!group)return;
  setLanguage(side);showUnits(group.ids);
  const rect=units[side].get(id).getClientRects()[0],base=flows[side].getBoundingClientRect();
  const first=rect?Math.max(0,Math.floor((rect.left-base.left+2)/base.width)):0;
  current=group.start+Math.min(group.pages-1,Number.isInteger(part)?Math.max(0,part):first);render({anchor:id});
  if(hash)history.replaceState(null,'',`#${side}-${id}`);toc.open=false;
  if(focus)panes[side].focus({preventScroll:true});
}
function turn(delta){const previous=current;current+=delta;render();if(current!==previous)history.replaceState(null,'',`#${language}-${activeId}`);frameBook();}
function frameBook(){
  requestAnimationFrame(()=>{
    const top=layout.getBoundingClientRect().top+scrollY-$('.masthead').getBoundingClientRect().height-$('.parallel-toolbar').getBoundingClientRect().height-12;
    window.scrollTo({top:Math.max(0,top),behavior:'instant'});
  });
}
function hashTarget(){
  let hash;try{hash=decodeURIComponent(location.hash.slice(1));}catch{return false;}
  const reference=document.getElementById(hash);
  if(reference?.matches('a[data-reference-target]')){location.replace(reference.href);return true;}
  for(const side of languages)if(hash.startsWith(`${side}-`)&&ids.includes(hash.slice(side.length+1))){go(hash.slice(side.length+1),{side,hash:false});frameBook();return true;}
  return false;
}
function repaginate({initial=false}={}){
  if(busy)return;busy=true;const anchor=activeId,part=locateBookPage(groups,current)?.part||0;
  document.body.dataset.paginating='true';groups=planBook(ids,measure);
  if(initial){current=0;render({save:false});if(location.hash)hashTarget();}else go(anchor,{part,focus:false,hash:false});
  document.body.dataset.paginating='false';busy=false;
}
document.addEventListener('click',event=>{
  if(!toc.contains(event.target))toc.open=false;
  const link=event.target.closest('a[data-goto]');if(!link||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();go(link.dataset.goto,{side:link.dataset.language||language});frameBook();
});
$('#book-previous').addEventListener('click',()=>turn(-1));$('#book-next').addEventListener('click',()=>turn(1));
$('#book-jump').addEventListener('submit',event=>{event.preventDefault();current=Number($('#book-page').value)-1;render();history.replaceState(null,'',`#${language}-${activeId}`);frameBook();});
$('#book-start').addEventListener('click',()=>{toc.open=false;frameBook();panes[language].focus({preventScroll:true});});
for(const button of document.querySelectorAll('[data-language-button]'))button.addEventListener('click',()=>{setLanguage(button.dataset.languageButton);render({anchor:activeId});frameBook();});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&toc.open){event.preventDefault();toc.open=false;toc.querySelector('summary').focus();return;}
  if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.target.closest('input,select,textarea,[contenteditable="true"]'))return;
  if(['ArrowLeft','ArrowRight'].includes(event.key)&&event.target.closest('.parallel-table,.parallel-math,.parallel-equation'))return;
  const delta={ArrowLeft:-1,PageUp:-1,ArrowRight:1,PageDown:1}[event.key];if(delta){event.preventDefault();turn(delta);}
});
for(const side of languages)flows[side].addEventListener('focusin',event=>{
  if(busy||event.target.matches('[data-unit]'))return;
  const flow=flows[side],rect=event.target.getBoundingClientRect(),base=flow.getBoundingClientRect(),state=locateBookPage(groups,current);
  const part=Math.max(0,Math.floor((rect.left-base.left+2)/panes[side].getBoundingClientRect().width));
  if(state&&part!==state.part&&part<state.group.pages){current=state.group.start+part;render();}panes[side].scrollLeft=0;
});
addEventListener('hashchange',hashTarget);
addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>repaginate());});
$('#parallel-resume').hidden=!resumeId;
if(resumeId)$('#parallel-resume').addEventListener('click',()=>{go(resumeId,{part:Number.isInteger(saved.pagePart)?saved.pagePart:0});$('#parallel-resume').hidden=true;frameBook();});
document.body.dataset.enhanced='true';await document.fonts.ready;repaginate({initial:true});$('#book-pagination').hidden=false;
}
