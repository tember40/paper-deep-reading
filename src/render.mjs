import {escapeHtml as e, httpsUrl, linksForPaper} from './model.mjs';
import {atLeastOneActive,conservedGain,lenet5Audit,sharedGradient,squaredDistance} from './calculations.mjs';

const external = (url, label) => `<a href="${e(httpsUrl(url))}">${e(label)}<span class="external-mark" aria-hidden="true"> ↗</span></a>`;
const paragraph = text => `<p>${e(text)}</p>`;
const licenseNotice = prefix => `<span class="license-notice">© 2026 paper-deep-reading contributors · <a href="${prefix}licenses/CONTENT.txt">글·자체 도식 CC BY 4.0</a> · <a href="${prefix}licenses/MIT.txt">코드 MIT</a></span>`;
export function renderBlock(block) {
  if (block.type==='lenet-parameters') {
    const rows=lenet5Audit();
    return renderBlock({type:'table',caption:'독립 재계산 · 배치축을 생략한 출력 크기. RBF 중심은 아래 합계에서 제외',headers:['연산','출력 크기','학습 변수의 계산'],rows:rows.map(row=>[row.layer,row.shape,`${row.formula} = ${row.parameters.toLocaleString('en-US')}`])})+paragraph(`위 항목의 합은 ${rows.reduce((sum,row)=>sum+row.parameters,0).toLocaleString('en-US')}개입니다. 원문 도식을 전재한 표가 아니라 구조를 읽으며 다시 계산한 점검표입니다.`);
  }
  if (block.type==='shared-gradient-example') {
    const result=sharedGradient(block.inputs,block.weight);
    return renderBlock({type:'table',caption:`자체 미분 예제 · 공유 변수 w=${block.weight}, 각 위치의 목표는0, 손실은 출력 제곱합의1/2`,headers:['위치별 입력 x','출력 w×x','이 위치의 dL/dw'],rows:block.inputs.map((value,index)=>[String(value),result.outputs[index].toFixed(3),result.parts[index].toFixed(3)])})+paragraph(`전체 손실 L=${result.loss.toFixed(3)}, 공유 변수의 기울기 dL/dw=${result.gradient.toFixed(3)}입니다. 각 위치의 기여를 더한 값이며 평균으로 바꾸지 않았습니다.`);
  }
  if (block.type==='distance-example') return renderBlock({type:'table',caption:'자체2차원 거리 예제 · 실제84차원 출력이나 MNIST 측정값이 아님',headers:['입력 표현','기준 벡터','제곱 거리'],rows:block.prototypes.map(point=>[JSON.stringify(block.input),JSON.stringify(point),squaredDistance(block.input,point).toFixed(3)])});
  if (block.type==='activation-example') return renderBlock({type:'table',caption:`자체 계산 예제 · 각 셀의 활성 확률 ${block.probability}, 독립 모형. 분류 정확도가 아님`,headers:['유효 셀 수','모두 비활성일 확률','1개 이상 활성일 확률'],rows:block.units.map(units=>{
    const active=atLeastOneActive(block.probability,units);
    return [String(units),(1-active).toFixed(8),active.toFixed(8)];
  })});
  if (block.type==='conservation-example') {
    const deltas=conservedGain(block.total,block.active);
    return renderBlock({type:'table',caption:`자체 계산 예제 · 서로 겹치지 않는 한 집합, ${block.total}개 셀의 초기값은 각각1`,headers:['셀 상태','변화량','갱신 뒤 값'],rows:deltas.map((value,index)=>[`${index+1}번 · ${index<block.active?'활성':'비활성'}`,value.toFixed(4),(1+value).toFixed(4)])})+paragraph(`반올림 전 변화량의 합은0입니다. ${block.active}개가 얻은 총량을 나머지 ${block.total-block.active}개가 나누어 잃으므로 전체 값은 ${block.total}로 유지됩니다. 표시값을 더하면 반올림 오차가 있을 수 있습니다.`);
  }
  if (block.type === 'p') return paragraph(block.text);
  if (block.type === 'code') return `<pre class="code-example"><code>${e(block.text)}</code></pre>`;
  if (block.type === 'math') return `<div class="equation" role="math" aria-label="${e(block.text)}">${e(block.text)}</div>`;
  if (['steps','list'].includes(block.type)) {
    const tag = block.type === 'steps' ? 'ol' : 'ul';
    return `<${tag} class="${block.type === 'steps' ? 'reasoning-steps' : ''}">${block.items.map(item => `<li>${e(item)}</li>`).join('')}</${tag}>`;
  }
  if (block.type === 'note') return `<details class="annotation"><summary>${e(block.title)}</summary>${paragraph(block.text)}</details>`;
  if (block.type === 'table') return `<div class="table-scroll" tabindex="0" role="region" aria-label="${e(block.caption)}"><table><caption>${e(block.caption)}</caption><thead><tr>${block.headers.map(h=>`<th scope="col">${e(h)}</th>`).join('')}</tr></thead><tbody>${block.rows.map(row=>`<tr>${row.map((v,i)=>i===0?`<th scope="row">${e(v)}</th>`:`<td>${e(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  throw new Error('지원하지 않는 본문 블록');
}
function shell(catalog, {title, description, prefix, body, paperId = '', sidebar = ''}) {
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${e(description)}"><title>${e(title)} · ${e(catalog.title)}</title><link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${prefix}assets/styles.css"><script type="module" src="${prefix}assets/reader.mjs"></script></head>
<body${paperId?` data-paper-id="${e(paperId)}"`:''}><a class="skip-link" href="#main">본문으로 건너뛰기</a>
<header class="masthead"><a class="wordmark" href="${prefix}index.html">${e(catalog.title)}</a><nav aria-label="상단 이동"><a href="${prefix}index.html#library">논문 목록</a><a href="${prefix}guide.html">읽는 방법</a>${sidebar?'<button type="button" class="toc-toggle" aria-expanded="false" aria-controls="toc">목차</button>':''}</nav></header>
${sidebar?`<div class="reading-layout">${sidebar}${body}</div>`:body}
<footer class="site-footer"><p>원문은 원문으로, 해설은 해설로.</p><a href="${prefix}rights.html">출처와 이용 안내</a>${catalog.licenseStatus==='pending'?'<span class="license-pending">로컬 초안 · 프로젝트 라이선스 확인 중</span>':licenseNotice(prefix)}</footer><div class="toc-shade" hidden></div></body></html>`;
}
export function homePage(catalog, papers, questions, readings=[]) {
  const rows = catalog.papers.map((paper,index) => {
    const analysis=paper.status==='ready'?papers.get(paper.id):null;
    const scope=analysis?`<details class="annotation entry-scope"><summary>이 분석이 확인한 범위</summary>${paragraph(analysis.scope)}<a href="papers/${paper.id}/index.html#sources">버전·출처·남은 제한 보기 →</a></details>`:'';
    return `<li class="paper-entry"><div class="entry-meta"><span>${String(index+1).padStart(2,'0')}</span><span>${paper.year}</span></div><div class="entry-copy"><p class="byline">${e(paper.author)}</p><h2>${paper.status==='ready'?`<a href="papers/${paper.id}/index.html">${e(paper.readingTitle)}</a>`:e(paper.readingTitle)}</h2><p class="original-title" lang="en">${e(paper.title)}</p><p>${e(paper.summary)}</p>${scope}${paper.status==='ready'?`<a class="read-link" href="papers/${paper.id}/index.html">분석 읽기 <span aria-hidden="true">→</span></a>`:'<span class="draft-note">분석 준비 중</span>'}</div></li>`;
  }).join('');
  const questionSection = questions.length ? `<section id="questions" class="home-questions"><p class="eyebrow">사용자가 등록한 질문</p><h2>질문에서 다시 읽기</h2>${questions.map(q=>`<article id="question-${q.id}"><h3>${e(q.text)}</h3><ul>${q.links.map(link=>`<li><a href="papers/${link.paperId}/index.html#${link.sectionId}">${e(catalog.papers.find(p=>p.id===link.paperId).readingTitle)}</a> — ${e(link.note)}</li>`).join('')}</ul></article>`).join('')}</section>` : '<p class="empty-question-note">사용자 질문은 아직 등록하지 않았습니다. 질문 없이도 각 논문의 분석을 읽을 수 있습니다.</p>';
  const parallelShelf=readings.length?`<section class="home-parallel" aria-labelledby="parallel-title"><div class="section-heading"><h2 id="parallel-title">원문과 나란히 읽기</h2><span>판본·허용 범위별 대조</span></div>${readings.map(({entry,reading})=>`<article><p class="eyebrow">${entry.status==='ready'?'원문 · 번역 · 별도 해설':'로컬 시범 · 본문 확장 중'}</p><h3><a href="readings/${entry.id}/index.html">${e(entry.readingTitle)}</a></h3><p class="original-title" lang="en">${e(reading.title)}</p><p>${e(reading.coverage.description)}</p></article>`).join('')}</section>`:'';
  return shell(catalog,{title:'서가',description:catalog.description,prefix:'',body:`<main id="main" class="library-page"><header class="library-intro"><p class="eyebrow">PAPER STUDIES <span aria-hidden="true">/</span> 독립적인 해설과 검토</p><h1>한 편의 논문을,<br>근거가 닿는 곳까지.</h1><p>${e(catalog.description)} 주장이 성립하는 조건과 남겨진 문제를 함께 살펴봅니다.</p><a class="read-link" href="local-reader/index.html">내 PDF와 번역 파일로 대조 읽기 →</a></header>${parallelShelf}<section id="library" aria-labelledby="library-title"><div class="section-heading"><h2 id="library-title">논문 목록</h2><span>${catalog.papers.filter(p=>p.status==='ready').length}편의 분석</span></div><ol class="paper-list">${rows}</ol></section>${questionSection}<p class="library-ending">기존 세 논문은 독립 분석과 공식 원문 링크를 제공합니다. 별도 대조 리딩은 재배포·번역 조건이 확인된 판본과 표시된 범위에만 적용합니다. 논문 PDF 파일과 외부 사진은 이 사이트에 복제하지 않습니다.</p></main>`});
}
export function paperPage(catalog, entry, paper, questions, readings=[]) {
  const toc = `<aside id="toc" class="toc" aria-label="논문 목차"><div class="toc-head"><span class="eyebrow">이 분석의 목차</span><button class="toc-close" type="button" aria-label="목차 닫기">닫기</button></div><p class="toc-paper">${e(entry.readingTitle)}</p><nav><a href="#overview">읽기 안내</a>${paper.sections.map((s,i)=>`<a href="#${s.id}"><span>${String(i+1).padStart(2,'0')}</span>${e(s.title)}</a>`).join('')}${linksForPaper(questions,paper.id).length?'<a href="#reader-questions">사용자 질문</a>':''}<a href="#sources">출처·검토 범위</a></nav><a class="toc-library" href="../../index.html#library">← 논문 목록</a></aside>`;
  const sections = paper.sections.map((section,i)=>{
    const related=readings.flatMap(({entry:readingEntry,reading})=>reading.units.filter(unit=>unit.notes.some(note=>note.analysisLinks?.some(target=>target.paperId===paper.id&&target.sectionId===section.id))).map(unit=>`<a href="../../readings/${reading.id}/index.html#original-${unit.id}">${e(readingEntry.readingTitle)} · ${e(unit.location.label)}</a>`));
    return `<section id="${section.id}" class="reading-section" data-reading-section><header><p class="section-index">${String(i+1).padStart(2,'0')} <span>${e(section.kind)}</span></p><h2>${e(section.title)}</h2></header>${section.blocks.map(renderBlock).join('')}<p class="section-evidence">근거 위치 · ${section.references.map(ref=>`<a href="#source-${ref.source}">${e(ref.location)}</a>`).join(' · ')}</p>${related.length?`<p class="section-evidence">연결된 대조 원문으로 돌아가기 · ${related.join(' · ')}</p>`:''}</section>`;
  }).join('');
  const linked = linksForPaper(questions,paper.id);
  const linkedQuestions=questions.filter(question=>question.links.some(link=>link.paperId===paper.id));
  const userQuestions = linked.length?`<section id="reader-questions" class="reading-section"><p class="eyebrow">저자의 연구 질문과 구분되는 사용자 질문</p><h2>질문을 연결해 읽기</h2>${linkedQuestions.map(question=>`<details class="annotation reader-question"><summary>${e(question.text)}</summary><ul>${question.links.filter(link=>link.paperId===paper.id).map(link=>`<li><p>${e(link.note)}</p><a href="#${link.sectionId}">${e(paper.sections.find(section=>section.id===link.sectionId).title)} →</a></li>`).join('')}</ul></details>`).join('')}</section>`:'';
  const sources = `<section id="sources" class="reading-section sources-section"><p class="eyebrow">이 해설이 확인한 것</p><h2>출처와 검토 범위</h2><dl class="scope-list"><dt>원문 버전</dt><dd>${e(paper.version)}</dd><dt>확인 범위</dt><dd>${e(paper.scope)}</dd><dt>확인일</dt><dd>${e(paper.accessed)}</dd><dt>남은 제한</dt><dd>${e(paper.limitations)}</dd></dl><ol class="source-list">${paper.sources.map(source=>`<li id="source-${source.id}">${external(source.url,source.label)}${source.note?paragraph(source.note):''}</li>`).join('')}</ol><p class="source-boundary">이 페이지의 본문은 직접 작성한 해설·분석입니다. 원문 전문·전체 번역·원문 그림은 포함하지 않습니다. 링크는 재배포 허가를 뜻하지 않습니다.</p></section>`;
  const ready = catalog.papers.filter(p=>p.status==='ready');
  const index = ready.findIndex(p=>p.id===paper.id);
  const pagination = `<nav class="paper-pagination" aria-label="논문 간 이동">${index>0?`<a href="../${ready[index-1].id}/index.html">← ${e(ready[index-1].readingTitle)}</a>`:'<a href="../../index.html#library">← 논문 목록</a>'}${index<ready.length-1?`<a href="../${ready[index+1].id}/index.html">${e(ready[index+1].readingTitle)} →</a>`:'<a href="#overview">처음으로 ↑</a>'}</nav>`;
  const body = `<main id="main" class="reader-main"><article><header id="overview" class="paper-opening"><p class="eyebrow">논문 분석 <span aria-hidden="true">/</span> ${entry.year}</p><h1>${e(entry.readingTitle)}</h1><p class="paper-lead">${e(paper.lead)}</p><div class="bibliography"><p class="original-title" lang="en">${e(entry.title)}</p><p>${e(paper.citation)}</p>${external(paper.doi,'공식 논문 정보')}</div><p class="analysis-boundary">독립적인 해설입니다. 논문 저자의 주장과 이 페이지의 검토를 구분해 읽어 주세요.</p><button id="resume-reading" class="resume-reading" hidden type="button">이전에 읽던 절로 이동</button></header>${sections}${userQuestions}${sources}${pagination}</article></main>`;
  return shell(catalog,{title:entry.readingTitle,description:entry.summary,prefix:'../../',body,paperId:paper.id,sidebar:toc});
}
export function informationPage(catalog, kind) {
  const rights = kind === 'rights';
  const title = rights?'출처와 이용 안내':'이 자료를 읽는 방법';
  const body = rights?`
    <p>기존 세 논문은 공식 링크와 독립 분석을 제공합니다. 원문·번역 대조는 재배포와 번역 공개 조건을 확인한 개별 판본에만 적용합니다. 열람 가능하다는 이유로 허가를 추정하지 않습니다.</p>
    <h2>원문·번역·해설의 경계</h2><p>원문은 논문 저자의 글, 번역은 그 의미를 옮긴 비공식 글, 해설은 분석자의 별도 설명입니다. 각 대조 페이지에서 정확한 버전·제공 범위·제외 항목·권리 근거·변경 사항·번역 상태를 확인하세요. AI 원문 대조를 사람 검수라고 표시하지 않습니다.</p>
    <h2>포함하지 않는 것</h2><ul><li>권리 미확인 논문의 전문·전체 번역</li><li>원문 PDF 파일의 미러링과 외부 사진 복제</li><li>다른 사람이 작성한 번역·해설의 무단 전재</li><li>이용 조건을 확인하지 않은 이미지·글꼴 파일</li></ul>
    <h2>개인 파일은 공개 콘텐츠가 아닙니다</h2><p><a href="local-reader/index.html">개인 파일 읽기</a>에서는 직접 고른 PDF와 번역 파일을 현재 창의 메모리에서만 사용합니다. 서버로 전송하거나 브라우저 저장소에 저장하지 않으며 새로고침하면 다시 골라야 합니다. 로컬 처리는 원문의 재배포·번역 허가를 대신하지 않습니다.</p>
    <h2>프로젝트와 외부 자산의 이용 조건</h2><p>${catalog.licenseStatus==='pending'?'라이선스 확인 중입니다.':'코드 MIT · 자체 글·자체 도식 CC BY 4.0입니다.'} 원 논문은 그 논문의 개별 고지를 따르며 프로젝트가 재허가하지 않습니다. 자체 계산 예제는 논문의 실험 결과와 구분합니다.</p><p>PDF.js와 PDF 표시용 지원 글꼴·색상 프로필·디코더는 <a href="licenses/THIRD-PARTY.txt">별도의 버전·이용 고지</a>를 따릅니다. 사이트 본문의 글꼴은 설치된 시스템 글꼴을 사용하며 외부 글꼴 서비스에 접속하지 않습니다. GPL v2 및 글꼴 예외 조건인 표시용 Liberation Sans1.07.4는 <a href="assets/vendor/pdfjs/font-source/liberation-fonts-1.07.4.tar.gz">대응 원본 소스</a>도 함께 제공합니다.</p><p>권리 기록은 보수적인 포함·제외 판단이며 법적 무위험을 보장하지 않습니다.</p>` : `
    <p>논문 원문과 이 페이지의 분석을 함께 읽어 보세요. 해설은 원문 읽기를 돕지만 원문을 대신하지 않습니다.</p>
    <h2>원문과 번역 대조</h2><p>제공되는 대조 논문은 PC에서 영어·한국어를 나란히 보여 줍니다. 목차와 ‘대응 원문/번역’은 확인한 문단 ID로 연결하며, ‘같은 문단 연결’을 끄면 양쪽을 따로 읽을 수 있습니다. 모바일은 원문/번역 버튼으로 같은 문단을 유지합니다. ‘원문 위치 확인’에서 정확한 판본의 PDF 쪽을 열 수 있습니다. PDF 쪽과 인쇄 쪽번호는 별도로 표시합니다.</p>
    <h2>주장과 근거 사이 읽기</h2><p>기존 분석은 각 절 끝의 ‘근거 위치’에서 버전과 위치를 안내합니다. 주석은 펼쳐 읽되 본문과 다른 해석·단순화를 구분하세요. 대조 읽기의 번역에는 해설을 섞지 않으며 펼침 해설과 용어 정의는 분석자의 글입니다.</p>
    <h2>사용자 질문</h2><p>질문은 사용자가 직접 등록합니다. 등록된 질문만 관련 위치와 연결하며 질문이 없어도 읽을 수 있습니다. 사이트에서 자동으로 질문을 만들거나 GitHub에 저장하지 않습니다.</p>
    <h2>읽던 위치</h2><p>저장이 허용된 브라우저에서는 공개 분석별 절 ID 또는 대조 읽기별 판본·문단 ID만 기억합니다. 다음 방문에 이어가기 버튼으로 이동합니다. 자동으로 중간에 이동하지 않으며 명시적인 문단 주소가 우선합니다. 개인 파일 내용·파일명·해시·읽던 위치는 저장하지 않습니다.</p>
    <h2>목차와 키보드</h2><p>기존 분석의 모바일 목차는 닫기·Esc로 닫고 본문으로 돌아갈 수 있습니다. 대조 읽기의 모바일 목차는 기본 펼침 목록입니다. Tab으로 링크와 주석을 이동하고 Enter로 선택합니다. 읽기 영역에 초점을 두고 Page Down/Up 또는 방향키로 스크롤할 수 있습니다.</p>
    <h2>내 파일로 읽기</h2><p><a href="local-reader/index.html">개인 파일 읽기</a>에서 PDF(50MB 이하)와 UTF-8 번역(.txt/.json, 5MB 이하)을 고릅니다. 일반 텍스트는 수동 대조이고 JSON은 PDF의 SHA-256·총쪽수가 일치할 때만 페이지 기준으로 연결합니다. 양식 받기는 입력 형식만 제공하며 자동 번역하지 않습니다. 암호화·손상 PDF, OCR과 검색은 지원하지 않습니다.</p>
    <h2>확인 범위</h2><p>각 페이지의 범위·제외·검토 상태를 먼저 확인하세요. 판독하지 못한 수식·표·문단을 검증했다고 표시하지 않습니다.</p>`;
  return shell(catalog,{title,description:title,prefix:'',body:`<main id="main" class="information-page"><p class="eyebrow">읽기 안내</p><h1>${title}</h1>${body}<a class="back-link" href="index.html#library">← 논문 목록으로</a></main>`});
}
