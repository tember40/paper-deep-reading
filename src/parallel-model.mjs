// One content contract for rights-gated public readings and user-supplied local mappings.
import {ID,httpsUrl} from './model.mjs';

const requireText=(value,label)=>{
  if(typeof value!=='string'||!value.trim()) throw new Error(`${label}: 내용이 필요합니다`);
};
const requireId=(value,label)=>{
  if(typeof value!=='string'||!ID.test(value)) throw new Error(`${label}: ID 오류`);
};
export const TRANSLATION_STATES=Object.freeze(['untranslated','machine-draft','source-checked','human-reviewed','original-only']);

export function validateParallelReading(reading,{forPublication=false,localFile=false}={}){
  if(!reading||typeof reading!=='object'||Array.isArray(reading))throw new Error('대응 번역은 JSON 객체여야 합니다');
  requireId(reading.id,'리딩');
  requireText(reading.title,'제목');
  const {source,coverage,sections,units,rights}=reading;
  requireText(source?.version,'원문 버전');
  requireText(source?.citation,'서지');
  if(!localFile||source.url) httpsUrl(source.url);
  if(localFile&&!/^[a-f0-9]{64}$/.test(source.pdfSha256||'')) throw new Error('개인 PDF의 SHA-256이 필요합니다');
  if(source.pdfSha256!==undefined&&!/^[a-f0-9]{64}$/.test(source.pdfSha256)) throw new Error('PDF SHA-256 형식 오류');
  if(!Number.isInteger(source.pdfPageCount)||source.pdfPageCount<1) throw new Error('원문 PDF 총쪽수 오류');
  if(!coverage||!Array.isArray(coverage.excluded)) throw new Error('제공 범위/제외 범위 누락');
  requireText(coverage.description,'제공 범위');
  coverage.excluded.forEach(value=>requireText(value,'제외 범위'));
  if(!Array.isArray(sections)||!sections.length||!Array.isArray(units)||!units.length) throw new Error('실제 절과 대응 문단이 필요합니다');
  const expected=new Set(),sectionIds=new Set();
  for(const section of sections){
    requireId(section.id,'절');
    requireText(section.title,'절 제목');
    if(sectionIds.has(section.id)) throw new Error('중복 절 ID');
    sectionIds.add(section.id);
    if(!Array.isArray(section.unitIds)||!section.unitIds.length) throw new Error('절의 대응 단위 누락');
    for(const id of section.unitIds){
      requireId(id,'대응 단위');
      if(expected.has(id)) throw new Error('중복 원문 단위');
      expected.add(id);
    }
  }
  const actual=new Set();
  for(const unit of units){
    requireId(unit.id,'문단');
    if(actual.has(unit.id)||!expected.has(unit.id)) throw new Error('중복 또는 목차에 없는 문단');
    actual.add(unit.id);
    if(!['paragraph','equation','caption','footnote','table','reference','acknowledgment'].includes(unit.kind)) throw new Error('지원하지 않는 대응 유형');
    requireText(unit.original,'원문');
    if(!TRANSLATION_STATES.includes(unit.translationState)) throw new Error('번역 검토 상태 오류');
    if(!['untranslated','original-only'].includes(unit.translationState)) requireText(unit.translation,'번역');
    if(unit.translationState==='original-only'&&(!['reference','acknowledgment'].includes(unit.kind)||unit.translation))throw new Error('원형 유지 상태는 번역을 넣지 않은 참고문헌·감사 표기에만 사용합니다');
    if(unit.mathKey!==undefined){if(unit.kind!=='equation')throw new Error('수식 렌더링은 수식 단위에만 지정합니다');requireId(unit.mathKey,'수식 렌더링');}
    if(unit.figure!==undefined&&(unit.kind!=='caption'||!/^figure-\d{2}\.svg$/.test(unit.figure)))throw new Error('그래프는 검증한 SVG와 캡션에 연결합니다');
    if(unit.kind==='table'){
      const table=unit.table;
      if(!Array.isArray(table?.headers)||table.headers.length<2||table.headers.some(cell=>typeof cell!=='string')||!Array.isArray(table.rows)||!table.rows.length)throw new Error('대조 표 머리글/행 오류');
      for(const row of table.rows)if(!Array.isArray(row)||row.length!==table.headers.length||row.some(cell=>typeof cell!=='string')||!row[0].trim())throw new Error('대조 표 셀 수/형식 오류');
      const canonical=[table.headers.filter(Boolean).join(' | '),...table.rows.map(row=>row.filter(Boolean).join(' | '))].join('\n');
      const normalize=text=>text.replace(/\s+/g,' ').trim();
      if(normalize(unit.original)!==normalize(canonical)||normalize(unit.translation||'')!==normalize(canonical))throw new Error('대조 표의 텍스트와 표시 수치가 다릅니다');
    }
    if(unit.translationState==='human-reviewed'){
      if(unit.review?.kind!=='human') throw new Error('사람 검토 표시에는 실제 사람 검토 기록이 필요합니다');
      requireText(unit.review.name,'검토자');requireText(unit.review.date,'검토일');
    }
    const location=unit.location;
    if(!Number.isInteger(location?.pdfPageStart)||!Number.isInteger(location.pdfPageEnd)||location.pdfPageStart<1||location.pdfPageEnd<location.pdfPageStart||location.pdfPageEnd>source.pdfPageCount) throw new Error('PDF 쪽수 범위 오류');
    // PDF page numbers are one-based. Printed page labels are separate strings.
    requireText(location.printedPageStart,'인쇄 쪽번호');
    if(location.printedPageEnd!==undefined)requireText(location.printedPageEnd,'인쇄 끝 쪽번호');
    requireText(location.label,'원문 위치 설명');
    if(!['paragraph','page'].includes(location.precision)) throw new Error('대응 정밀도 표시 오류');
    if(!Array.isArray(unit.notes)) throw new Error('해설은 번역과 별도 목록으로 보관합니다');
    unit.notes.forEach(note=>{
      if(note.author!=='analyst') throw new Error('해설 작성 주체 오류');
      requireText(note.text,'해설');
      if(note.analysisLinks!==undefined){
        if(!Array.isArray(note.analysisLinks))throw new Error('관련 분석 링크 오류');
        for(const target of note.analysisLinks){requireId(target.paperId,'관련 논문');requireId(target.sectionId,'관련 분석 절');requireText(target.label,'분석 링크 설명');}
      }
    });
  }
  if(actual.size!==expected.size) throw new Error('목차와 실제 원문 단위가 일치하지 않습니다');
  if(reading.glossary!==undefined){
    if(!Array.isArray(reading.glossary))throw new Error('용어 목록 오류');
    const termIds=new Set();
    for(const term of reading.glossary){
      requireId(term.id,'용어');requireText(term.term,'용어 표기');requireText(term.definition,'용어 정의');
      if(termIds.has(term.id))throw new Error('중복 용어 ID');termIds.add(term.id);
      if(!Array.isArray(term.unitIds)||!term.unitIds.length||term.unitIds.some(id=>!actual.has(id))||new Set(term.unitIds).size!==term.unitIds.length)throw new Error('용어 등장 위치 오류');
    }
  }
  if(!rights||!['unverified','cleared'].includes(rights.status)) throw new Error('권리 확인 상태 누락');
  if(forPublication){
    if(rights.status!=='cleared'||rights.permissions?.redistributeOriginal!==true||rights.permissions?.publishTranslation!==true) throw new Error('원문 재배포와 번역 공개 권리를 먼저 확인해야 합니다');
    httpsUrl(rights.evidenceUrl);httpsUrl(rights.licenseUrl);
    requireText(rights.attribution,'저작자/출처 표시');
    requireText(rights.checkedAt,'권리 확인일');
    requireText(rights.allowedScope,'이용 조건의 적용 범위');
    if(coverage.completeBody!==true) throw new Error('확정한 본문 범위가 아직 미완료입니다');
    if(units.some(unit=>['untranslated','machine-draft'].includes(unit.translationState))) throw new Error('공개 전에 원문 대조 검토가 필요합니다');
  }
  return true;
}

export function bindLocalReading(reading,{sha256,pageCount}){
  validateParallelReading(reading,{localFile:true});
  if(reading.source.pdfSha256!==sha256) throw new Error('번역 파일과 선택한 PDF의 SHA-256이 다릅니다');
  if(reading.source.pdfPageCount!==pageCount) throw new Error('번역 파일과 선택한 PDF의 총쪽수가 다릅니다');
  return reading;
}

export function parallelResumeTarget(reading,saved,hash=''){
  if(hash||saved?.sourceVersion!==reading.source.version) return null;
  return reading.units.some(unit=>unit.id===saved.unitId)?saved.unitId:null;
}
