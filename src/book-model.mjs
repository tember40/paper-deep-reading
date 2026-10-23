// Pair whole source units first. Only oversized units continue over several spreads.
export function planBook(ids,measure){
  if(new Set(ids).size!==ids.length)throw new Error('중복 리딩 단위');
  const groups=[];let pending=[];
  const size=items=>{
    const result=measure(items);
    if(!Number.isInteger(result.original)||!Number.isInteger(result.translation)||result.original<1||result.translation<1)throw new Error('쪽 측정 오류');
    return {...result,pages:Math.max(result.original,result.translation)};
  };
  const commit=()=>{if(pending.length){groups.push({ids:[...pending],...size(pending)});pending=[];}};
  for(const id of ids){
    if(pending.length&&size([...pending,id]).pages>1)commit();
    pending.push(id);
    if(size(pending).pages>1)commit();
  }
  commit();let start=0;
  return groups.map(group=>{const result={...group,start};start+=group.pages;return result;});
}
export function locateBookPage(groups,page){
  const total=groups.reduce((n,group)=>n+group.pages,0);
  const bounded=Math.max(0,Math.min(total-1,Number.isFinite(page)?Math.trunc(page):0));
  const group=groups.find(group=>bounded>=group.start&&bounded<group.start+group.pages);
  return group?{group,part:bounded-group.start,page:bounded,total}:null;
}
