# GitHub Pages 배포 안내

사용자가 새 저장소 업로드와 Pages 공개 배포를 승인했습니다. 대상은 **https://github.com/tember40/paper-deep-reading**이며 기존 Backbone 저장소에는 푸시하지 않습니다. 공개 주소는 **https://tember40.github.io/paper-deep-reading/**입니다. 배포 결과는 작업 기록과 GitHub Actions에서 확인합니다.

## 배포 전

1. 별도 로컬 프로젝트에서 `git rev-parse --show-toplevel`로 작업 대상 경로, `git remote -v`로 **새 원격**을 확인합니다. 기존 ML 저장소 주소가 나오면 중단합니다.
2. 라이선스 선택을 반영하고 RIGHTS.md 및 이용 안내를 대조합니다. 질문은 사용자 작성분만 넣습니다.
3. `pnpm install --frozen-lockfile --no-optional` 후 `node --test`와 `node scripts/build.mjs`를 실행합니다. 배포 빌드에 `--draft-reading`을 사용하지 않습니다. 허가된 완성 대조 본문 외의 원문·임시 연구 PDF·개인 파일·`.qa`가 없는지 확인합니다.
4. `node scripts/preview.mjs`로 PC·모바일 링크, 목차, 직접 절 링크, 표와 주석을 확인합니다. 단위 검사만으로 공개 검증을 대신하지 않습니다.
5. 소스·문서·검사 파일만 검토해 커밋합니다. 원문 입력·검증 임시 파일·개인 자료·민감 정보·`dist/`를 무차별 추가하지 않습니다.

## GitHub Pages

현재 구조는 빌드 결과 `dist/`를 Pages artifact로 배포합니다. 순서는 체크아웃 → Node22.13 이상 → pnpm11.25.0 → 잠금 파일로 의존성 설치(선택 네이티브 모듈 제외) → 검사 → 일반 빌드 → upload-pages-artifact(`path: dist`) → 별도 작업의 configure-pages / deploy-pages입니다. deploy 작업에만 pages:write·id-token:write를 주며 기본 main push와 수동 실행을 지원합니다.

실제 워크플로는 `.github/workflows/pages.yml`입니다. PDF.js의 버전과 배포 무결성 값은 package.json·pnpm-lock.yaml로 고정합니다. 공식 action 소스의 정확한 커밋도 고정했습니다. 업데이트 시 [GitHub 공식 custom workflow 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)를 대조합니다.

## 이후 수정해서 올리기

콘텐츠를 편집한 뒤 `node --test`로 확인하고 필요한 파일만 커밋합니다. `git remote -v`가 위 새 저장소를 가리키는지 확인한 뒤 `git push origin HEAD:main`으로 반영합니다. 기본 main에 올라간 변경은 자동 배포되며, 다른 작업 브랜치의 push는 공개 사이트를 바꾸지 않습니다. 협업으로 main이 바뀌었다면 먼저 원격 이력을 가져와 검토·통합하고 강제 push하지 않습니다.

GitHub 저장소 Settings → Pages의 배포 방식은 GitHub Actions입니다. 다시 실행하려면 Actions의 `Test and deploy reading site`에서 수동 실행할 수 있습니다. 성공 여부는 최신 커밋의 build/deploy 작업과 실제 페이지를 함께 확인합니다.

## 일반 정적 서버

생성된 `dist/`의 **내용물**을 승인된 사이트 경로에 제공합니다. Python·PyTorch·학습 데이터·Node 런타임은 읽기 서버에 필요하지 않습니다. JSON 원본·소스 코드·연구 입력 폴더를 웹 루트로 제공하지 마세요. HTTPS·접근 권한은 운영 서버의 정책으로 구성하며 로컬8780 미리보기를 외부 서버처럼 노출하지 않습니다.

## 실제 배포 후 확인

- 배포 작업이 대상으로 삼은 커밋과 기록한 커밋이 같은지 확인합니다.
- 실제 사이트의 홈·세 논문·안내·자산에 접근하고, 저장소 이름이 포함된 하위 경로에서도 내부 링크와 fragment가 동작하는지 확인합니다.
- 모바일 목차·이어 읽기·직접 링크·주석·콘솔 오류를 실제 배포 주소에서 다시 확인합니다.
- 결과 URL·커밋·성공/실패·미해결 사항을 PROGRESS.md에 기록합니다. 성공하지 않은 배포를 완료로 표시하지 않습니다.
- 되돌림은 이전 검증된 소스 커밋을 다시 빌드·배포합니다. 콘텐츠를 수정했다면 생성된 HTML만 수동 수정하지 않습니다.
