import {escapeHtml as e} from './model.mjs';

// Only project-authored, source-checked formulas. No user HTML or general TeX execution.
const mi=text=>`<mi mathvariant="normal">${e(text)}</mi>`;
const mo=text=>`<mo>${e(text)}</mo>`;
const row=(...parts)=>`<mrow>${parts.join('')}</mrow>`;
const sub=(base,index)=>`<msub>${mi(base)}${mi(index)}</msub>`;
const sum=index=>`<munder>${mo('∑')}${mi(index)}</munder>`;
const call=(name,arg)=>row(mi(name),mo('('),arg,mo(')'));
const xi=sub('x','i'),rx=call('r',mi('x')),rxi=call('r',xi),basis=call('B',row(mi('x'),mo('−'),xi));
const canonical={
  'shift-interpolation':'r(x) = ∑ᵢ B(x − xᵢ) r(xᵢ)',
  'sampling-proof-equations':'∑ₓ r(x) = ∑ₓ ∑ᵢ r(xᵢ) B(x − xᵢ) (1) = ∑ᵢ r(xᵢ) ∑ₓ B(x − xᵢ) (2) = K ∑ᵢ r(xᵢ) (3)'
};
const formulaRow=(lhs,rhs,number)=>`<mtr><mtd>${lhs}</mtd><mtd>${mo('=')}</mtd><mtd>${rhs}</mtd><mtd><mtext>(${number})</mtext></mtd></mtr>`;
const markup={
  'shift-interpolation':row(rx,mo('='),sum('i'),basis,rxi),
  'sampling-proof-equations':`<mtable columnalign="right center left right" columnspacing="0.4em 0.4em 1.2em">${formulaRow(row(sum('x'),rx),row(sum('x'),sum('i'),rxi,basis),1)}${formulaRow('',row(sum('i'),rxi,sum('x'),basis),2)}${formulaRow('',row(mi('K'),sum('i'),rxi),3)}</mtable>`
};
export function renderReadingMath(key,source){
  if(!Object.hasOwn(canonical,key))throw new Error('확인되지 않은 수식 렌더링 ID');
  if(source.replace(/\s/g,'')!==canonical[key].replace(/\s/g,''))throw new Error('원문 수식 텍스트와 렌더링 정의가 다릅니다');
  return `<div class="parallel-math" tabindex="0" role="region" aria-label="수식 가로 스크롤 영역"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="${e(source)}"><semantics>${markup[key]}<annotation encoding="text/plain">${e(source)}</annotation></semantics></math></div>`;
}
