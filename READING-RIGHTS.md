# 원문·번역 리딩의 자료별 권리 조사

확인일2026-10-22. 법적 무위험 보장이 아니며 ‘허가를 확인하지 못함’과 ‘모든 이용이 금지됨’을 구분한다. 기존 독립 해설의 공개와 원문/번역 전문의 공개는 별개다.

| 후보 | 확인한 근거 | 현재 처리 |
| --- | --- | --- |
| Turing1950 | King's College의AMT/B/9는 OUP 허가를 받아 재현했다고 표시하며 별도 이용 조건을 안내한다. 기존UMBC전사본을 읽을 수 있다는 사실은 우리에게 번역/전문 재게시 권리를 주는 근거가 아님 | 원문·전체 번역의 공개 허가 미확인. 오래된 논문이라고 전 세계 퍼블릭 도메인으로 판단하지 않음 |
| Rosenblatt1958 | APA의학술출판물 재사용 정책은 기사와 허용 발췌를 구분하고 번역본 고지를 다룬다. 현재 자료에서 전문과 한국어 번역의 공개를 허가하는 개별 라이선스는 미확인 | 발췌 허용을 전문 허용으로 확대하지 않음. 별도 허가 또는 자료 변경 필요 |
| LeCun외1998 | IEEE는 다른 언어로 재출판할 때 번역 권한이 포함된 허가를 요구한다. 저자 제공 submitted원고 열람과 제3자 전문/번역 게시 권리는 다름 | 현재 원고 버전의 전문·번역 공개 허가 미확인 |

1. https://turingarchive.kings.cam.ac.uk/publications-lectures-and-talks-amtb/amt-b-9
2. https://www.apa.org/about/contact/copyright
3. https://journals.ieeeauthorcenter.ieee.org/choose-a-publishing-agreement/avoid-infringement-upon-ieee-copyright/

## 사용자 승인 시범 — Azulay·Weiss (2019)

사용자가 2026-10-22 논문과 범위를 명시적으로 승인했다. 기존 세 논문을 몰래 대체한 것이 아니라 별도 대조 읽기 한 편을 추가한다. 기존 분석·질문을 삭제하거나 관련 없는 질문을 연결하지 않는다.

- 정확한 판본: JMLR 20(184):1–25, 2019, Submitted 6/19; Published 11/19. 저자 Aharon Azulay, Yair Weiss.
- 서지·귀속: https://jmlr.org/papers/v20/19-519.html
- 출판 PDF: https://jmlr.org/papers/volume20/19-519/19-519.pdf
- PDF 1쪽에 © 2019 Aharon Azulay, Yair Weiss와 `License: CC-BY 4.0`이 명시되어 있다. 해당 쪽을 직접 렌더해 시각 확인했다. 저자 원고·arXiv의 다른 판본으로 확대하지 않는다.
- 조건: https://creativecommons.org/licenses/by/4.0/ . 출처·저자·라이선스 링크·변경 표시를 유지한다. 공식 번역·보증을 암시하지 않는다.
- SHA-256: `a21121537d7743f4290ee94b143282babb17ddc9168163dbdbb19aebe5545249`, 총25쪽. PDF의1기반 쪽 번호와 인쇄 쪽번호를 구분한다.
- 확정 범위: Abstract부터 §6 Discussion까지 본문(PDF1–20쪽), 참고문헌(PDF20–23쪽)은 영어 원형 유지. Appendix A(PDF24–25쪽)는 명시적으로 제외한다. 외부 사진과 사진이 포함된 그림의 이미지 파일, PDF 자체는 미러링하지 않는다. 캡션 텍스트와 공식 PDF 위치를 제공한다.
- 텍스트 변경: 지면 머리말·분철 제거, 문단 이어 붙임과 캡션 재배치, 기울임 강조 미재현. 한국어는 비공식 AI 번역·원문 대조이며 사람 검수 아님. 해설·용어는 번역 밖에 둔다.
- 논문 내부의 짧은 인용은 저자가 누구를 인용하는지 문맥과 출처를 유지한다. 인용 대상 저작물 전체를 CC BY로 재허가하는 고지가 아니다. 제3자 사진의 별도 권리를 추정하지 않아 공개 재배치에는 포함하지 않는다. 법적 무위험을 보장하지 않는다.
- 현재 대조·지면 검토 완료 범위는 Abstract와 §1 및 Figure 1 캡션(PDF1–3쪽)뿐이다. 본문 전체·수식·표·참고문헌 검토 완료라고 표시하지 않는다. `draft`이며 일반 공개 빌드에서 제외한다.

## 과거 조사 후보 — 채택하지 않음

Batch Normalization(Ioffe/Szegedy,2015), PMLR37:448–456:
https://proceedings.mlr.press/v37/ioffe15.html

PMLR의현재publication agreement는 CC BY4.0과 원 출판물/논문 URL 귀속을 규정한다:
https://proceedings.mlr.press/pmlr-license-agreement.html

그러나 현재 일반 계약 문구만으로2015년 개별판과 모든 그림/부록에 동일 조건이 적용됐다고 확정하지 않는다. 사용자가 대체 논문 조사를 선택하면 정확한PDF버전·권리 고지·제3자 자료를 추가 확인하고 후보를 확정받는다. 다른 논문을 임의 추가하거나 번역하지 않는다.

## 개발 범위와 공개 차단

개발은 codex/parallel-reading에서만 진행한다. main·공개 사이트는 유지한다. 실제 승인 논문의 초기 콘텐츠는 권리 조건이 확인된 개발 초안이며 일반 배포에는 포함되지 않는다. 개인 파일은 프로젝트 콘텐츠나 Git 이력이 되지 않는다. 검증용 자체 문장과 실제 승인 논문의 원문을 구분한다.

공개 전 원문/번역 권리, 정확한 버전, 허용 범위, 귀속, 제외 항목을 별도로 확인해야 한다. 모델 검증은 잘못된 ID/누락/범위/메타데이터를 거르는 장치이며, 라이선스의 법적 유효성이나 번역의 의미적 정확성·사람 검수를 자동 입증하지 않는다.
