import {parallelResumeTarget} from './parallel-model.mjs';

document.body.dataset.enhanced='true';
const layout=document.querySelector('.parallel-layout'),sync=document.querySelector('#parallel-sync'),status=document.querySelector('#parallel-status');
const panes={original:document.querySelector('#original-scroll'),translation:document.querySelector('#translation-scroll')};
const units={original:[...panes.original.querySelectorAll('[data-unit]')],translation:[...panes.translation.querySelectorAll('[data-unit]')]};
const ids=units.original.map(node=>node.dataset.unit),version=document.body.dataset.sourceVersion;
const reading={source:{version},units:ids.map(id=>({id}))};
const key=`paper-deep-reading:parallel:v1:${document.body.dataset.readingId}`;
let activeId=ids[0],locked=new Set(),frames=new Map();
const mobile=matchMedia('(max-width:700px)'),toc=document.querySelector('#parallel-toc');
const wide=matchMedia('(min-width:1101px)');
wide.addEventListener('change',()=>{if(wide.matches)toc.open=true;});
function selectLanguage(language){
  layout.dataset.language=language;
  for(const button of document.querySelectorAll('[data-language-button]'))button.setAttribute('aria-pressed',String(button.dataset.languageButton===language));
}
function setActive(id){
  activeId=id;
  for(const list of Object.values(units))for(const node of list)node.dataset.active=String(node.dataset.unit===id);
  for(const a of toc.querySelectorAll('[data-goto]')){
    const first=panes.original.querySelector(`[data-unit="${a.dataset.goto}"]`);
    if(first?.closest('section')===panes.original.querySelector(`[data-unit="${id}"]`)?.closest('section'))a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');
  }
  try{localStorage.setItem(key,JSON.stringify({sourceVersion:version,unitId:id}));}catch{/* Storage denial cannot stop reading. */}
}
function align(language,id){
  const pane=panes[language],node=units[language].find(node=>node.dataset.unit===id);if(!node)return;
  locked.add(language);
  pane.scrollTop+=node.getBoundingClientRect().top-pane.getBoundingClientRect().top-20;
  requestAnimationFrame(()=>requestAnimationFrame(()=>locked.delete(language)));
}
function go(id,{language=layout.dataset.language,focus=true,hash=true}={}){
  if(!ids.includes(id))return;
  selectLanguage(language);align('original',id);align('translation',id);setActive(id);
  if(hash)history.replaceState(null,'',`#${language}-${id}`);
  if(mobile.matches)toc.open=false;
  const node=units[language].find(node=>node.dataset.unit===id);
  if(focus)node?.focus({preventScroll:true});
  status.textContent=`${ids.indexOf(id)+1}/${ids.length} · 대응 문단`;
}
for(const [language,pane] of Object.entries(panes))pane.addEventListener('scroll',()=>{
  if(locked.has(language)||frames.has(language))return;
  frames.set(language,requestAnimationFrame(()=>{
    frames.delete(language);
    const top=pane.getBoundingClientRect().top;
    const node=units[language].find(node=>node.getBoundingClientRect().bottom>top+40);if(!node||node.dataset.unit===activeId)return;
    setActive(node.dataset.unit);
    if(sync.checked)align(language==='original'?'translation':'original',activeId);
    status.textContent=`${ids.indexOf(activeId)+1}/${ids.length} · 대응 문단`;
  }));
},{passive:true});
for(const a of document.querySelectorAll('[data-goto]'))a.addEventListener('click',event=>{
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();go(a.dataset.goto,{language:a.dataset.language||layout.dataset.language});
  document.querySelector('.parallel-toolbar').scrollIntoView({block:'start'});
});
for(const button of document.querySelectorAll('[data-language-button]'))button.addEventListener('click',()=>{
  selectLanguage(button.dataset.languageButton);align(button.dataset.languageButton,activeId);
});
sync.addEventListener('change',()=>{if(sync.checked){align('original',activeId);align('translation',activeId);}});
function hashTarget(){
  let hash;try{hash=decodeURIComponent(location.hash.slice(1));}catch{return false;}
  for(const language of ['original','translation'])if(hash.startsWith(`${language}-`)){
    const id=hash.slice(language.length+1);if(ids.includes(id)){go(id,{language,hash:false});return true;}
  }
  return false;
}
let saved;try{saved=JSON.parse(localStorage.getItem(key));}catch{saved=null;}
const resume=document.querySelector('#parallel-resume'),target=parallelResumeTarget(reading,saved,location.hash);
if(target){resume.hidden=false;resume.addEventListener('click',()=>{go(target);resume.hidden=true;document.querySelector('.parallel-toolbar').scrollIntoView({block:'start'});});}
if(location.hash)requestAnimationFrame(()=>{hashTarget();});
addEventListener('hashchange',hashTarget);
mobile.addEventListener('change',()=>{align('original',activeId);align('translation',activeId);});
