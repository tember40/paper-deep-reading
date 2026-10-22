# 논문 깊이 읽기 — paper-deep-reading

논문 원문을 대체하지 않고 주장·가정·근거·한계를 함께 읽는 정적 e북형 사이트입니다. 기존 Backbone Lab과 분리된 프로젝트이며 ML 패키지·데이터셋·DB·외부 API를 사용하지 않습니다.

사용자가 확정한 로컬 프로젝트 위치는 `C:\Users\ryusy\Desktop\paper-deep-reading`입니다. 코드 MIT·자체 글/도식 CC BY 4.0과 초기 질문 한 개를 승인했습니다. 공개 저장소는 [tember40/paper-deep-reading](https://github.com/tember40/paper-deep-reading)이며 GitHub Pages 배포도 사용자에게 승인받았습니다. 기존 세 논문은 독립 분석을 유지합니다. 추가 원문·번역 대조는 권리와 제공 범위를 확인한 논문에만 적용하며 PDF 파일·외부 사진은 배포하지 않습니다.

## 실행

Node.js 22.13 이상과 pnpm 11.25.0이 필요합니다. PDF.js 6.4.299를 고정 버전으로 설치합니다. 선택적인 네이티브 canvas 모듈은 사용하지 않습니다. 프로젝트 폴더에서 실행합니다.

```text
pnpm install --frozen-lockfile --no-optional
node --test
node scripts/build.mjs
node scripts/preview.mjs
```

표시된 `http://127.0.0.1:8780/`을 엽니다. 미리보기는 이 컴퓨터에서만 접근하며 파일을 바꾸었다면 다시 build하고 브라우저를 새로고침합니다. 이미 서버가 실행 중이면 동일 포트의 서버를 또 만들지 않습니다. 종료는 실행한 터미널에서 Ctrl+C입니다. 포트는 `PORT` 환경 변수로 변경할 수 있습니다.

pnpm이 없다면 npm이 제공되는 Node 설치에서 `npx --yes pnpm@11.25.0 install --frozen-lockfile --no-optional`로 프로젝트 의존성만 설치할 수도 있습니다. 최초 설치에는 인터넷이 필요하고 실행·열람에 Python이나 ML 환경은 필요하지 않습니다.

## 원문·번역 대조 읽기

- 승인된 시범: Azulay·Weiss(2019), JMLR 출판판. 첫 쪽의 CC BY 4.0 고지를 확인했습니다.
- 제공 범위: Abstract부터 §6 Discussion까지 본문(PDF 1–20쪽), 수식, 표 2개, Figure 1–11 캡션. 감사 표기와 참고문헌 37항목(PDF 20–23쪽)은 영어 원형입니다. 부록과 외부 사진, PDF 파일 자체는 배포하지 않습니다.
- 80개 대응 단위 중 번역 대상 75개는 **AI 작성·원문 대조본**이며 사람 검수를 받은 번역이 아닙니다. 나머지 5개는 감사/참고문헌 원형 유지 단위입니다. 원문의 주장 강도와 조건을 확인하며 읽어 주세요.
- 일반 빌드 후 메인의 ‘원문과 나란히 읽기’ 또는 `/readings/azulay-weiss-2019/index.html`로 들어갑니다. PC는 두 열, 모바일은 같은 문단의 원문/번역 전환입니다. 문단 연결은 끌 수 있습니다. 공식 PDF의 정확한 위치, 별도 해설·용어, 기존 LeNet 분석 왕복 링크를 제공합니다.
- 그래프 9개는 원본 벡터 발췌이며, 사진을 화면에서 숨기는 대신 파일에서 래스터 데이터와 참조를 제거했습니다. 그림별 발췌 범위·확대 링크·귀속이 표시됩니다. 그래프 값을 추정해 다시 그리지 않았습니다.
- 새 자료의 `draft`는 일반 빌드에서 제외됩니다. 미완성 자료를 로컬 검토할 때만 `node scripts/build.mjs --draft-reading`을 사용하고 그 결과를 배포하지 마세요.
- 개인 파일: `/local-reader/index.html`. PDF와 .txt/.json 번역을 브라우저 메모리에서만 열며 업로드·자동 번역·영구 저장·OCR은 없습니다. `.json`은 선택한 PDF의 SHA-256과 총쪽수가 일치해야 연결됩니다. 매번 파일을 다시 선택합니다.
- 편집 형식·권리 게이트·검토 상태는 [READING-EDITING.md](READING-EDITING.md), 조사 근거는 [READING-RIGHTS.md](READING-RIGHTS.md)를 참조합니다.

`dist/`는 다시 생성할 수 있는 정적 배포 결과입니다. Node가 없는 웹 서버에서도 이 폴더만 제공하면 열람할 수 있습니다. 소스 HTML을 직접 여는 방식보다 미리보기 서버를 사용하세요.

빌드는 먼저 콘텐츠를 검증하고 전체 페이지를 렌더합니다. 이후 `dist/.generated-files.json`에 기록된 생성 파일만 갱신·정리합니다. 삭제한 논문의 이전 페이지는 다음 빌드에서 제거되며 소스를 되돌려 빌드하면 복구됩니다. 기록에 없는 개인 파일은 지우지 않습니다. 그래도 `dist/`를 편집 원본이나 개인 파일 보관소로 사용하지 마세요. 경로 이탈·심볼릭 링크·손상된 생성 목록은 빌드가 거부합니다.

## 구성

- `content/catalog.json`: 논문 서지·목록·분석 상태
- `content/papers/<id>.json`: 독립 작성한 분석 본문·출처·검토 범위
- `content/questions.json`: 사용자가 승인한 ‘기계는 생각하는가?’ 한 개와 관련 절. 추가 질문은 직접 작성
- `content/readings.json`, `content/readings/<id>.json`: 개별 권리·판본·안정적인 문단 ID·원문/번역/별도 해설
- `src/`: 템플릿·스타일·읽기 기능·검증
- `scripts/`: 정적 빌드, 고정 PDF 표시 자산 복사, 검증된 그래프 발췌 도구, loopback 미리보기
- `tests/`: 데이터·질문 연결·경로·배포 자산 검사
- `PROGRESS.md`: 실제 조사·구현·검증과 미완료 기록

## 콘텐츠 편집

JSON 문자열에 HTML을 넣어도 실행되지 않고 문자로 표시합니다. 본문은 문단(`p`), 목록(`list`), 단계(`steps`), 수식 텍스트(`math`), 코드(`code`), 펼침 주석(`note`), 자체 표(`table`) 블록으로 구성합니다. 첫 논문의 파일을 구조 참고용으로 사용하되 문장은 복사하지 않습니다.

수치 예제 전용 블록은 Rosenblatt 파일의 `activation-example`·`conservation-example`, LeCun 파일의 `lenet-parameters`·`shared-gradient-example`·`distance-example`을 참고합니다. 계산은 `src/calculations.mjs`, 출력은 `src/render.mjs`, 독립 검산은 `tests/`에 있습니다. 새로운 계산을 추가한다면 입력 조건·단순화·검산도 함께 작성하세요. 기존 예제의 모형 가정을 다른 논문에 그대로 적용하지 않습니다.

각 절에는 안정적인 `id`, 제목, ‘논지 추적/분석자의 검토/자체 예제’ 등 역할, `references`의 실제 출처와 원문 위치가 필요합니다. 원문과 다른 수치 예제나 해석은 그 사실을 본문에서 밝힙니다. 출처는 논문별 `sources`에서 정의합니다.

논문을 추가하려면 고유 ID를 정하고 catalog와 같은 ID의 본문 파일을 추가합니다. 실제 분석을 완료한 경우에만 `status`를 `ready`로 바꿉니다. `research`는 준비 중 표시이며 본문 링크를 만들지 않습니다. build가 없는 파일·잘못된 출처·중복 ID를 발견하면 배포 전에 실패합니다.

## 질문 추가·수정·삭제

`content/questions.json`을 직접 편집한 뒤 build합니다. 사이트에서 자동 생성하거나 서버에 저장하지 않습니다. 아래는 **문법 설명용 자리표시자**이며 실제 배포 데이터가 아닙니다.

```json
[
  {
    "id": "my-question",
    "author": "user",
    "text": "<직접 작성한 질문>",
    "links": [
      {
        "paperId": "turing-1950",
        "sectionId": "reframing",
        "note": "<이 절이 질문과 관련된 구체적인 이유>"
      }
    ]
  }
]
```

여러 논문·절을 연결하려면 `links`에 항목을 추가합니다. 삭제할 때는 해당 질문 객체를 제거하며, 모두 지우려면 `[]`로 되돌립니다. 관련 논문·절이 실제로 없거나 연결 이유가 비어 있으면 build가 실패합니다. 질문 문장을 바꾸어도 ID를 유지하면 관리하기 쉽습니다.

논문 안에서는 질문 제목을 한 번만 표시합니다. 제목을 클릭하거나 Enter로 펼치면 같은 질문에 연결된 관련 절과 연결 이유가 함께 나옵니다. 같은 논문의 여러 절에 연결하려고 질문 자체를 복제할 필요는 없습니다.

## 원문과 권리

기존 세 논문은 공식 링크와 직접 작성한 분석을 제공합니다. 대조 읽기는 개별 재배포·번역 조건이 확인된 판본에 한합니다. 전사 오류·누락·미검토 범위를 표시하며 무료 열람을 재배포 허가로 취급하지 않습니다. PDF 표시를 위한 패키지 지원 글꼴 외에 외부 글꼴이나 사진을 포함하지 않습니다. PDF.js·지원 자산의 별도 고지는 [THIRD-PARTY.md](THIRD-PARTY.md)에 있습니다.

라이선스 범위는 [LICENSE.md](LICENSE.md)를 참고합니다. 소프트웨어는 [MIT](LICENSE-MIT.txt), 자체 해설·질문·표/도식과 문서의 설명 글은 [CC BY 4.0](LICENSE-CONTENT.md)입니다. 원 논문과 외부 자료의 권리를 재허가하지 않습니다. 생성 결과에도 두 이용 안내가 포함됩니다. 포함·제외 자료와 원문 확인 기록은 [RIGHTS.md](RIGHTS.md)에 정리했습니다.

## 배포

승인된 별도 저장소에서 `node scripts/build.mjs`로 생성한 `dist/`만 정적 호스팅에 올립니다. 모든 내부 자산은 상대 경로를 사용해 GitHub 프로젝트 Pages 하위 경로도 지원하도록 설계했습니다. 기존 ML 프로젝트의 원격을 대신 사용하지 않습니다.

`.github/workflows/pages.yml`이 main의 변경과 수동 실행에 대해 검사→빌드→Pages 배포를 수행합니다. 검사 실패 시 배포하지 않으며 `dist/`만 배포합니다. 공개 주소와 갱신 방법·검증 항목은 [DEPLOYMENT.md](DEPLOYMENT.md), 실제 결과는 [PROGRESS.md](PROGRESS.md)를 참고합니다.
