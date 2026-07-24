# PL Timetable Frontend

대학생 시간표 편성과 수강 이력 관리를 위한 프론트엔드 프로젝트입니다.

## 기술 스택

- React 18
- Vite
- Tailwind CSS
- Lucide React

## 시작하기

Node.js 설치 후 다음 명령을 실행합니다.

```bash
npm install
npm run dev
```

프로덕션 빌드:

```bash
npm run build
```

## 환경변수

`.env.example`을 복사해 `.env.local`을 만들고 백엔드 주소를 입력합니다.

```env
VITE_API_BASE_URL=http://localhost:8080
```

`.env.local`과 API 키 등 민감한 값은 Git에 올리지 않습니다.

## 현재 구현 범위

- 메인 시간표와 강의 목록
- 강의 필터 및 검색
- 자동편성 조건 설정
- 시간표 목록
- 내가 들은 강의 입력
- 졸업요건 확인 모달

현재 화면은 백엔드 연동 전 단계로 샘플 데이터를 사용합니다.

## 권장 소스 구조

```text
src/
├─ components/   # 여러 페이지에서 재사용하는 UI
├─ pages/        # 페이지 단위 컴포넌트
├─ api/          # 백엔드 요청 모듈
├─ data/         # 임시 데이터와 상수
├─ App.jsx
├─ index.css
└─ main.jsx
```

새 기능을 구현할 때는 가능한 한 `App.jsx`에 모두 추가하지 말고 담당 페이지와 컴포넌트 파일로 분리합니다.

## Git 작업 방식

`main`에는 직접 푸시하지 않고 기능 브랜치에서 작업한 뒤 Pull Request로 병합합니다.

```bash
git switch main
git pull origin main
git switch -c feature/기능명
```

작업 완료 후:

```bash
git add src
git commit -m "feat: 구현 내용"
git push -u origin feature/기능명
```

자세한 규칙은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 확인합니다.

