# 프론트엔드 협업 규칙

## 브랜치

- `main`: 항상 실행 가능한 통합 브랜치
- `feature/<기능명>`: 기능 개발
- `fix/<문제명>`: 버그 수정
- `refactor/<대상>`: 동작 변경 없는 구조 개선

예시:

```text
feature/home-page
feature/login-page
feature/course-input
fix/timetable-drag
```

한 브랜치는 한 사람이 소유하고, 여러 사람이 같은 기능 브랜치에서 동시에 작업하지 않습니다.

## 작업 시작

```bash
git switch main
git pull origin main
git switch -c feature/기능명
```

## 커밋 메시지

```text
feat: 새로운 기능
fix: 버그 수정
refactor: 구조 개선
style: UI 또는 스타일 수정
docs: 문서 수정
chore: 설정 및 도구 변경
```

예시:

```text
feat: implement timetable filter
fix: prevent bottom sheet from intercepting filter clicks
```

## Pull Request

1. `npm run build`가 성공하는지 확인합니다.
2. 최신 `main`을 현재 브랜치에 반영합니다.
3. 변경 범위와 테스트 방법을 PR에 작성합니다.
4. 다른 프론트엔드 팀원 한 명 이상에게 리뷰를 요청합니다.
5. 리뷰 반영 후 병합하고 작업 브랜치를 삭제합니다.

최신 `main` 반영:

```bash
git fetch origin
git merge origin/main
```

## 충돌을 줄이는 규칙

- 담당 페이지를 별도 파일로 분리합니다.
- 공통 컴포넌트를 수정하기 전에 팀 채널에 알립니다.
- 스타일 및 API 인터페이스 변경은 PR 설명에 명시합니다.
- 하나의 PR에 서로 관계없는 기능을 함께 넣지 않습니다.
- `node_modules`, `dist`, `.env.local`은 커밋하지 않습니다.

## API 연동

- API 주소는 `VITE_API_BASE_URL` 환경변수를 사용합니다.
- 실제 키와 토큰은 저장소에 올리지 않습니다.
- 팀이 공유할 변수 이름만 `.env.example`에 추가합니다.
- API 요청 코드는 `src/api/` 아래에 모으는 것을 권장합니다.

