# 정적 배포 안내 — 아직 미배포

이 문서는 승인 후 절차입니다. 새 저장소 이름·위치·원격·공개 범위·프로젝트 라이선스를 먼저 확정합니다. 기존 Backbone 저장소에는 푸시하지 않습니다. 현재 GitHub 원격과 Pages는 생성하거나 변경하지 않았습니다.

## 배포 전

1. 별도 로컬 프로젝트에서 `git rev-parse --show-toplevel`로 작업 대상 경로, `git remote -v`로 **새 원격**을 확인합니다. 기존 ML 저장소 주소가 나오면 중단합니다.
2. 라이선스 선택을 반영하고 RIGHTS.md 및 이용 안내를 대조합니다. 질문은 사용자 작성분만 넣습니다.
3. `node --test`와 `node scripts/build.mjs`를 실행합니다. `dist/`에 원문이나 `.qa` 자료가 들어 있지 않은지 확인합니다.
4. `node scripts/preview.mjs`로 PC·모바일 링크, 목차, 직접 절 링크, 표와 주석을 확인합니다. 단위 검사만으로 공개 검증을 대신하지 않습니다.
5. 소스·문서·검사 파일만 검토해 커밋합니다. 원문 입력·검증 임시 파일·개인 자료·민감 정보·`dist/`를 무차별 추가하지 않습니다.

## GitHub Pages

현재 구조는 빌드 결과 `dist/`를 Pages artifact로 배포하는 방식에 적합합니다. 승인된 **새 저장소**의 Settings → Pages에서 GitHub Actions를 선택하고, 저장소의 기본 브랜치에 맞는 워크플로를 작성합니다. 순서는 체크아웃 → Node20 이상 준비 → 검사 → 빌드 → configure-pages → upload-pages-artifact(`path: dist`) → deploy-pages입니다. 배포 작업에 필요한 pages:write·id-token:write와 github-pages 환경을 설정합니다. 처음에는 수동 실행으로 검증한 뒤 자동 실행 여부를 결정하세요.

구체적인 action 버전·권한·환경 설정은 배포 시점의 [GitHub 공식 custom workflow 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)를 대조합니다(이 문서에서 확인한 날짜2026-10-21). 현재 승인 대기 중이므로 자동 배포 워크플로를 활성화하지 않았습니다.

## 일반 정적 서버

생성된 `dist/`의 **내용물**을 승인된 사이트 경로에 제공합니다. Python·PyTorch·학습 데이터·Node 런타임은 읽기 서버에 필요하지 않습니다. JSON 원본·소스 코드·연구 입력 폴더를 웹 루트로 제공하지 마세요. HTTPS·접근 권한은 운영 서버의 정책으로 구성하며 로컬8780 미리보기를 외부 서버처럼 노출하지 않습니다.

## 실제 배포 후 확인

- 배포 작업이 대상으로 삼은 커밋과 기록한 커밋이 같은지 확인합니다.
- 실제 사이트의 홈·세 논문·안내·자산에 접근하고, 저장소 이름이 포함된 하위 경로에서도 내부 링크와 fragment가 동작하는지 확인합니다.
- 모바일 목차·이어 읽기·직접 링크·주석·콘솔 오류를 실제 배포 주소에서 다시 확인합니다.
- 결과 URL·커밋·성공/실패·미해결 사항을 PROGRESS.md에 기록합니다. 성공하지 않은 배포를 완료로 표시하지 않습니다.
- 되돌림은 이전 검증된 소스 커밋을 다시 빌드·배포합니다. 콘텐츠를 수정했다면 생성된 HTML만 수동 수정하지 않습니다.
