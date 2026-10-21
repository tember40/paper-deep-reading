import {atLeastOneActive,conservedGain,sharedGradient,squaredDistance} from './calculations.mjs';
export const ID = /^[a-z][a-z0-9-]*$/;
const fail = message => { throw new Error(message); };
const text = (value, label) => typeof value === 'string' && value.trim() ? value : fail(`${label}: 빈 문자열 또는 잘못된 형식`);
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function httpsUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) fail(`허용되지 않은 링크: ${value}`);
  return url.href;
}
function uniqueIds(items, label) {
  const ids = new Set();
  for (const item of items) {
    if (!ID.test(item.id) || ids.has(item.id)) fail(`${label}: 중복 또는 잘못된 ID ${item.id}`);
    ids.add(item.id);
  }
  return ids;
}
function validateBlock(block) {
  if (['p', 'math', 'code'].includes(block.type)) text(block.text, block.type);
  else if (['list', 'steps'].includes(block.type)) {
    if (!Array.isArray(block.items) || !block.items.length) fail('빈 목록');
    block.items.forEach(item => text(item, '목록 항목'));
  } else if (block.type === 'note') {
    text(block.title, '주석 제목'); text(block.text, '주석 내용');
  } else if (block.type === 'lenet-parameters') {
    // This type uses a fixed, audited historical configuration, not arbitrary HTML.
  } else if (block.type === 'shared-gradient-example') {
    sharedGradient(block.inputs,block.weight);
  } else if (block.type === 'distance-example') {
    if (!Array.isArray(block.prototypes) || !block.prototypes.length) fail('거리 예제 기준 벡터 누락');
    block.prototypes.forEach(point=>squaredDistance(block.input,point));
  } else if (block.type === 'activation-example') {
    if (!Array.isArray(block.units) || !block.units.length || block.units.length>12) fail('활성 예제 행 오류');
    block.units.forEach(units=>atLeastOneActive(block.probability,units));
  } else if (block.type === 'conservation-example') {
    if (block.total>12) fail('예제 크기가 너무 큽니다');
    conservedGain(block.total,block.active);
  } else if (block.type === 'table') {
    text(block.caption, '표 설명');
    if (!Array.isArray(block.headers) || !block.headers.length || !Array.isArray(block.rows) || !block.rows.length) fail('빈 표');
    block.headers.forEach(item => text(item, '표 머리글'));
    for (const row of block.rows) {
      if (row.length !== block.headers.length) fail('표 열 개수 불일치');
      row.forEach(item => text(item, '표 값'));
    }
  } else fail(`알 수 없는 본문 블록: ${block.type}`);
}
export function validateLibrary(catalog, papers, questions) {
  text(catalog.title, '사이트 제목'); text(catalog.description, '사이트 설명');
  if (!['pending', 'approved'].includes(catalog.licenseStatus)) fail('라이선스 상태 오류');
  const paperIds = uniqueIds(catalog.papers, '논문');
  for (const entry of catalog.papers) {
    ['title','author','readingTitle','summary'].forEach(key => text(entry[key], `논문 ${key}`));
    if (!Number.isInteger(entry.year) || !['ready','research'].includes(entry.status)) fail('논문 연도/상태 오류');
    if (entry.status !== 'ready') continue;
    const paper = papers.get(entry.id);
    if (!paper || paper.id !== entry.id) fail(`논문 본문 누락: ${entry.id}`);
    ['citation','scope','lead','accessed','version','limitations'].forEach(key => text(paper[key], key));
    httpsUrl(paper.doi);
    if (!paper.sources?.length || !paper.sections?.length) fail('출처 또는 본문 누락');
    const sourceIds = uniqueIds(paper.sources, '출처');
    paper.sources.forEach(source => { text(source.label,'출처 이름'); httpsUrl(source.url); });
    const sectionIds = uniqueIds(paper.sections, '본문');
    if (['overview','sources','reader-questions'].some(id => sectionIds.has(id))) fail('예약된 본문 ID');
    for (const section of paper.sections) {
      text(section.title,'절 제목'); text(section.kind,'절 분류');
      if (!section.blocks?.length || !section.references?.length) fail('본문 또는 근거 위치 누락');
      section.blocks.forEach(validateBlock);
      section.references.forEach(ref => {
        if (!sourceIds.has(ref.source)) fail('알 수 없는 출처');
        text(ref.location,'근거 위치');
      });
    }
  }
  if (!Array.isArray(questions)) fail('질문 목록은 배열이어야 함');
  uniqueIds(questions,'사용자 질문');
  for (const question of questions) {
    text(question.text,'사용자 질문');
    if (question.author !== 'user') fail('사용자 확인 질문만 등록할 수 있음');
    if (!Array.isArray(question.links) || !question.links.length) fail('질문의 관련 위치가 없음');
    const targets = new Set();
    for (const link of question.links) {
      if (!paperIds.has(link.paperId) || !papers.has(link.paperId)) fail('질문이 없는 논문을 참조함');
      if (!papers.get(link.paperId).sections.some(section => section.id === link.sectionId)) fail('질문이 없는 절을 참조함');
      text(link.note,'질문 연결 이유');
      const key = `${link.paperId}#${link.sectionId}`;
      if (targets.has(key)) fail('중복 질문 연결');
      targets.add(key);
    }
  }
  return true;
}
export function linksForPaper(questions, paperId) {
  return questions.flatMap(question => question.links.filter(link => link.paperId === paperId).map(link => ({question, link})));
}
export function resumeTarget(saved, sectionIds, hash = '') {
  if (hash || !saved || !sectionIds.includes(saved.sectionId)) return null;
  return saved.sectionId;
}
