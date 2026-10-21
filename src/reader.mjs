import {resumeTarget} from './model.mjs';

document.documentElement.dataset.js = 'true';
const toggle = document.querySelector('.toc-toggle');
const toc = document.querySelector('#toc');
const shade = document.querySelector('.toc-shade');
const mobile = matchMedia('(max-width: 960px)');
let previousFocus;
function focusDestination(id) {
  requestAnimationFrame(()=>{
    const heading=document.getElementById(id)?.querySelector('h1,h2');
    if (heading) {heading.tabIndex=-1;heading.focus({preventScroll:true});}
  });
}
function setMenu(open, {focus = false} = {}) {
  document.body.dataset.tocState = open?'open':'closed';
  toggle?.setAttribute('aria-expanded',String(open));
  if (shade) shade.hidden = !open || !mobile.matches;
  if (toc) toc.inert = mobile.matches && !open;
  const main = document.querySelector('main');
  if (main) main.inert = mobile.matches && open;
  if (open && mobile.matches && focus) {
    previousFocus = document.activeElement;
    toc?.querySelector('button,a')?.focus();
  } else if (!open && focus && previousFocus instanceof HTMLElement) previousFocus.focus();
}
if (toggle && toc) {
  setMenu(!mobile.matches);
  toggle.addEventListener('click',()=>setMenu(toggle.getAttribute('aria-expanded')!=='true',{focus:true}));
  toc.querySelector('.toc-close')?.addEventListener('click',()=>setMenu(false,{focus:true}));
  shade?.addEventListener('click',()=>setMenu(false,{focus:true}));
  toc.addEventListener('click',event=>{
    const link = event.target.closest('a');
    if (!link || !mobile.matches || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    setMenu(false);
    if (link.hash && link.pathname===location.pathname) {
      event.preventDefault();
      location.hash=link.hash;
      focusDestination(decodeURIComponent(link.hash.slice(1)));
    }
  });
  document.addEventListener('keydown',event=>{
    if (!mobile.matches || document.body.dataset.tocState!=='open') return;
    if (event.key==='Escape') { event.preventDefault(); setMenu(false,{focus:true}); }
    if (event.key==='Tab') {
      const controls=[...toc.querySelectorAll('button,a[href]')];
      const first=controls[0],last=controls.at(-1);
      if (event.shiftKey && document.activeElement===first) {event.preventDefault();last.focus();}
      else if (!event.shiftKey && document.activeElement===last) {event.preventDefault();first.focus();}
    }
  });
  mobile.addEventListener('change',()=>setMenu(!mobile.matches));
}

const paperId = document.body.dataset.paperId;
const sections = [...document.querySelectorAll('[data-reading-section]')];
if (paperId && sections.length) {
  const key=`paper-deep-reading:v1:${paperId}`;
  const resume=document.querySelector('#resume-reading');
  let saved;
  try {saved=JSON.parse(localStorage.getItem(key));} catch {saved=null;}
  const target=resumeTarget(saved,sections.map(s=>s.id),location.hash);
  if (target && resume) {
    resume.hidden=false;
    resume.addEventListener('click',()=>{
      location.hash=target;
      focusDestination(target);
      resume.hidden=true;
    });
  }
  let frame;
  function track() {
    const active=[...sections].reverse().find(section=>section.getBoundingClientRect().top<180);
    for (const link of toc?.querySelectorAll('nav a')||[]) {
      if (active && link.hash===`#${active.id}`) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    }
    if (active) try {localStorage.setItem(key,JSON.stringify({sectionId:active.id}));} catch { /* Private mode or blocked storage must not stop reading. */ }
  }
  addEventListener('scroll',()=>{
    if (frame) return;
    frame=requestAnimationFrame(()=>{frame=null;track();});
  },{passive:true});
  // This updates indicators only; initial rendering never calls scrollIntoView.
  track();
}
