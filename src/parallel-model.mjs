// Content contract for the next reader. Not yet connected to public builds.
import {ID,httpsUrl} from './model.mjs';

const requireText=(value,label)=>{
  if(typeof value!=='string'||!value.trim()) throw new Error(`${label}: 내용이 필요합니다`);
};
const requireId=(value,label)=>{
  if(typeof value!=='string'||!ID.test(value)) throw new Error(`${label}: ID 오류`);
};
export const TRANSLATION_STATES=Object.freeze(['untranslated','machine-draft','source-checked','human-reviewed']);

export function validateParallelReading(reading,{forPublication=false}={}){
  requireId(reading.id,'리딩');
  requireText(reading.title,'제목');
  const {source,coverage,sections,units,rights}=reading;
  requireText(source?.version,'원문 버전');
  requireText(source?.citation,'서지');
  httpsUrl(source.url);
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
    if(!['paragraph','equation','caption','footnote'].includes(unit.kind)) throw new Error('지원하지 않는 대응 유형');
    requireText(unit.original,'원문');
    if(!TRANSLATION_STATES.includes(unit.translationState)) throw new Error('번역 검토 상태 오류');
    if(unit.translationState!=='untranslated') requireText(unit.translation,'번역');
    if(unit.translationState==='human-reviewed'){
      if(unit.review?.kind!=='human') throw new Error('사람 검토 표시에는 실제 사람 검토 기록이 필요합니다');
      requireText(unit.review.name,'검토자');requireText(unit.review.date,'검토일');
    }
    const location=unit.location;
    if(!Number.isInteger(location?.pdfPageStart)||!Number.isInteger(location.pdfPageEnd)||location.pdfPageStart<1||location.pdfPageEnd<location.pdfPageStart||location.pdfPageEnd>source.pdfPageCount) throw new Error('PDF 쪽수 범위 오류');
    // PDF page numbers are one-based. Printed page labels are separate strings.
    requireText(location.printedPageStart,'인쇄 쪽번호');
    requireText(location.label,'원문 위치 설명');
    if(!['paragraph','page'].includes(location.precision)) throw new Error('대응 정밀도 표시 오류');
    if(!Array.isArray(unit.notes)) throw new Error('해설은 번역과 별도 목록으로 보관합니다');
    unit.notes.forEach(note=>{
      if(note.author!=='analyst') throw new Error('해설 작성 주체 오류');
      requireText(note.text,'해설');
    });
  }
  if(actual.size!==expected.size) throw new Error('목차와 실제 원문 단위가 일치하지 않습니다');
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

export function parallelResumeTarget(reading,saved,hash=''){
  if(hash||saved?.sourceVersion!==reading.source.version) return null;
  return reading.units.some(unit=>unit.id===saved.unitId)?saved.unitId:null;
}
