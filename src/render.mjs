import {escapeHtml as e, httpsUrl, linksForPaper} from './model.mjs';
import {atLeastOneActive,conservedGain,lenet5Audit,sharedGradient,squaredDistance} from './calculations.mjs';

const external = (url, label) => `<a href="${e(httpsUrl(url))}">${e(label)}<span class="external-mark" aria-hidden="true"> ↗</span></a>`;
const paragraph = text => `<p>${e(text)}</p>`;
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
<footer class="site-footer"><p>원문은 원문으로, 해설은 해설로.</p><a href="${prefix}rights.html">출처와 이용 안내</a>${catalog.licenseStatus==='pending'?'<span class="license-pending">로컬 초안 · 프로젝트 라이선스 확인 중</span>':''}</footer><div class="toc-shade" hidden></div></body></html>`;
}
export function homePage(catalog, papers, questions) {
  const rows = catalog.papers.map((paper,index) => `<li class="paper-entry"><div class="entry-meta"><span>${String(index+1).padStart(2,'0')}</span><span>${paper.year}</span></div><div class="entry-copy"><p class="byline">${e(paper.author)}</p><h2>${paper.status==='ready'?`<a href="papers/${paper.id}/index.html">${e(paper.readingTitle)}</a>`:e(paper.readingTitle)}</h2><p class="original-title" lang="en">${e(paper.title)}</p><p>${e(paper.summary)}</p>${paper.status==='ready'?`<a class="read-link" href="papers/${paper.id}/index.html">분석 읽기 <span aria-hidden="true">→</span></a>`:'<span class="draft-note">분석 준비 중</span>'}</div></li>`).join('');
  const questionSection = questions.length ? `<section id="questions" class="home-questions"><p class="eyebrow">사용자가 등록한 질문</p><h2>질문에서 다시 읽기</h2>${questions.map(q=>`<article id="question-${q.id}"><h3>${e(q.text)}</h3><ul>${q.links.map(link=>`<li><a href="papers/${link.paperId}/index.html#${link.sectionId}">${e(catalog.papers.find(p=>p.id===link.paperId).readingTitle)}</a> — ${e(link.note)}</li>`).join('')}</ul></article>`).join('')}</section>` : '<p class="empty-question-note">사용자 질문은 아직 등록하지 않았습니다. 질문 없이도 각 논문의 분석을 읽을 수 있습니다.</p>';
  return shell(catalog,{title:'서가',description:catalog.description,prefix:'',body:`<main id="main" class="library-page"><header class="library-intro"><p class="eyebrow">PAPER STUDIES <span aria-hidden="true">/</span> 독립적인 해설과 검토</p><h1>한 편의 논문을,<br>근거가 닿는 곳까지.</h1><p>${e(catalog.description)} 원문을 대신 옮기기보다, 주장이 성립하는 조건과 남겨진 문제를 함께 살펴봅니다.</p></header><section id="library" aria-labelledby="library-title"><div class="section-heading"><h2 id="library-title">논문 목록</h2><span>${catalog.papers.filter(p=>p.status==='ready').length}편의 분석</span></div><ol class="paper-list">${rows}</ol></section>${questionSection}<p class="library-ending">번역본·논문 PDF·원문 그림은 제공하지 않습니다. 각 분석에서 공식 원문과 확인한 범위를 안내합니다.</p></main>`});
}
export function paperPage(catalog, entry, paper, questions) {
  const toc = `<aside id="toc" class="toc" aria-label="논문 목차"><div class="toc-head"><span class="eyebrow">이 분석의 목차</span><button class="toc-close" type="button" aria-label="목차 닫기">닫기</button></div><p class="toc-paper">${e(entry.readingTitle)}</p><nav><a href="#overview">읽기 안내</a>${paper.sections.map((s,i)=>`<a href="#${s.id}"><span>${String(i+1).padStart(2,'0')}</span>${e(s.title)}</a>`).join('')}${linksForPaper(questions,paper.id).length?'<a href="#reader-questions">사용자 질문</a>':''}<a href="#sources">출처·검토 범위</a></nav><a class="toc-library" href="../../index.html#library">← 논문 목록</a></aside>`;
  const sections = paper.sections.map((section,i)=>`<section id="${section.id}" class="reading-section" data-reading-section><header><p class="section-index">${String(i+1).padStart(2,'0')} <span>${e(section.kind)}</span></p><h2>${e(section.title)}</h2></header>${section.blocks.map(renderBlock).join('')}<p class="section-evidence">근거 위치 · ${section.references.map(ref=>`<a href="#source-${ref.source}">${e(ref.location)}</a>`).join(' · ')}</p></section>`).join('');
  const linked = linksForPaper(questions,paper.id);
  const userQuestions = linked.length?`<section id="reader-questions" class="reading-section"><p class="eyebrow">저자의 연구 질문과 구분되는 사용자 질문</p><h2>질문을 연결해 읽기</h2>${linked.map(({question,link})=>`<article><h3>${e(question.text)}</h3><p>${e(link.note)}</p><a href="#${link.sectionId}">관련 절로 이동</a></article>`).join('')}</section>`:'';
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
  const body = rights?`<p>이 사이트는 논문 원문을 보관하거나 번역본을 배포하는 곳이 아닙니다. 서지·공식 원문 링크와 독립 작성한 분석을 제공합니다.</p><h2>이번 버전에 넣지 않은 것</h2><ul><li>논문 PDF, 전문 및 전체 번역본</li><li>논문 그림·표·스크린샷의 복제</li><li>출처·이용 조건이 불확실한 이미지와 글꼴 파일</li><li>다른 사람이 작성한 번역과 해설의 전재</li></ul><h2>구분해서 읽기</h2><p>본문의 ‘논지 추적’은 원문의 주장을 풀어 읽는 부분이며, ‘분석자의 검토’는 이 페이지에서 추가한 해석입니다. 자체 예제는 논문의 실험 수치가 아닙니다. 각 절 끝에서 관련 원문 위치를 확인할 수 있습니다.</p><h2>프로젝트 라이선스</h2><p>${catalog.licenseStatus==='pending'?'현재 사용자 확인 전의 로컬 초안이며 공개 라이선스는 확정하지 않았습니다. 코드와 직접 작성한 글·도식의 적용 범위를 확인한 뒤 안내를 갱신합니다.':'프로젝트의 코드와 직접 작성한 글·도식에 대한 적용 범위는 저장소의 LICENSE 안내를 확인하세요.'}</p><p>논문을 읽을 수 있는 링크나 서지 정보가 있다는 사실은 해당 논문의 재배포·번역 허가를 의미하지 않습니다. 권리가 불확실한 콘텐츠는 포함하지 않는 정책이며, 법적 문제가 없다는 보장은 아닙니다.</p>` : `<p>먼저 논문의 공식 원문을 열고 이 페이지의 분석과 함께 읽어 보세요. 이 해설은 원문 읽기를 돕지만 원문을 대신하지 않습니다.</p><h2>주장과 근거 사이 읽기</h2><p>목차에서 관심 있는 절로 이동할 수 있습니다. 각 절 끝의 ‘근거 위치’를 누르면 이 해설이 참고한 버전과 위치를 확인할 수 있습니다. 주석은 펼쳐 읽되, 본문과 다른 해석이나 단순화가 있는지 함께 살펴보세요.</p><h2>사용자 질문</h2><p>질문은 사용자가 직접 등록합니다. 등록된 질문이 있다면 논문 내 관련 위치와 연결됩니다. 질문이 없는 상태에서도 모든 분석을 읽을 수 있습니다. 화면에서 질문을 자동 생성하거나 GitHub에 저장하지 않습니다.</p><h2>읽던 위치</h2><p>브라우저의 로컬 저장이 허용된 경우 논문별로 읽던 절을 기억합니다. 다음 방문에 ‘이전에 읽던 절로 이동’을 눌러 이어갈 수 있습니다. 자동으로 본문을 이동시키지는 않으며, 특정 절 주소로 열었다면 해당 위치가 우선합니다. 다른 장비로 동기화하거나 서버로 보내지 않습니다.</p><h2>목차와 키보드</h2><p>작은 화면에서는 상단 ‘목차’로 열고, 닫기·Esc 또는 본문 쪽을 눌러 닫을 수 있습니다. Tab으로 링크와 주석을 이동하고 Enter로 선택합니다. 확대해 읽어도 본문은 한 열로 유지됩니다.</p><h2>확인 범위</h2><p>논문마다 확인한 버전·절·접근일과 남은 제한을 표시합니다. 원문 표·수식이 불완전하게 추출된 경우 검증한 것으로 처리하지 않습니다.</p>`;
  return shell(catalog,{title,description:title,prefix:'',body:`<main id="main" class="information-page"><p class="eyebrow">읽기 안내</p><h1>${title}</h1>${body}<a class="back-link" href="index.html#library">← 논문 목록으로</a></main>`});
}
