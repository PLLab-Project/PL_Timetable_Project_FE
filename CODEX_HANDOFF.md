# 시간표 프로젝트 Codex 작업 인계서

마지막 갱신: 2026-08-03  
프론트엔드 기준 커밋: `12f073c` (`main`)

이 문서는 기존 로컬 Codex 채팅을 다른 컴퓨터의 ChatGPT 프로젝트 또는 Cloud Work에서 이어가기 위한 인계 자료다. 기존 채팅 원문 자체는 포함하지 않으며, 구현 상태와 다음 작업에 필요한 맥락만 정리한다.

## 1. 프로젝트 주소

- 프론트엔드 저장소: https://github.com/PLLab-Project/PL_Timetable_Project_FE
- 백엔드 저장소: https://github.com/PLLab-Project/PL_Timetable_Project_BE
- 배포 프론트엔드: https://pl-timetable-project-fe.vercel.app/
- 운영 API: https://pl-timetable-api-532874992461.asia-northeast3.run.app
- 운영 API 문서: https://pl-timetable-api-532874992461.asia-northeast3.run.app/scalar

## 2. 기술 스택과 실행 방법

- React 18
- Vite 6
- Tailwind CSS 3
- lucide-react
- Node.js 22.x 권장 및 `package.json` 필수 버전

```powershell
git clone https://github.com/PLLab-Project/PL_Timetable_Project_FE.git
cd PL_Timetable_Project_FE
npm install
npm run dev
```

기본 개발 포트 `5173`이 사용 중이면 다음처럼 실행한다.

```powershell
npm run dev -- --port 5174
```

프로덕션 빌드 확인:

```powershell
npm run build
```

## 3. 환경변수와 API 연결

`.env.local` 예시:

```env
VITE_API_BASE_URL=https://pl-timetable-api-532874992461.asia-northeast3.run.app
VITE_USE_SAME_ORIGIN_API=true
```

- 개발 환경에서는 `VITE_API_BASE_URL`을 사용한다.
- Vercel 프로덕션에서는 `vercel.json`의 same-origin rewrite를 기본 사용한다.
- `/api`, `/oauth2`, `/login/oauth2` 요청은 Cloud Run 백엔드로 프록시된다.
- 인증은 API 키 방식이 아니라 세션 쿠키와 CSRF 토큰 방식이다.
- API 변경 요청은 `src/api/client.js`가 mutating request 전에 CSRF 토큰을 받아 `X-XSRF-TOKEN`으로 전송한다.
- Google 로그인 시작 경로는 프로덕션에서 `/oauth2/authorization/google`이다.

## 4. 주요 코드 위치

- 전체 앱과 시간표 화면: `src/App.jsx`
- 로그인: `src/pages/LoginPage.jsx`
- 최초 사용자 정보 입력: `src/pages/SignupInfoPage.jsx`
- 마이페이지: `src/pages/MyPage.jsx`
- 계정정보 확인/변경: `src/pages/MyAccountInfo.jsx`
- 시간표 목록/상세/즐겨찾기: `src/pages/MyTimeTableList.jsx`, `src/pages/MyTimetableDetail.jsx`, `src/pages/MyFavoriteTimetableList.jsx`
- 튜토리얼: `src/components/FirstLoginTutorial.jsx`
- 하단 내비게이션: `src/components/BottomNavigation.jsx`
- API 모듈: `src/api/`
- Vercel 프록시: `vercel.json`

## 5. 현재 구현된 주요 기능

### 시간표 홈

- 모바일/PC 반응형 시간표 및 강의 목록
- 강의 검색, 학년·전공/영역·정렬 필터
- 필터 다중 선택과 가로 스크롤
- 강의 카드 선택 및 시간표 미리보기
- 기존 강의 시간표 표시와 충돌 경고 후 강제 추가
- 시간표 위 드래그로 시간대 다중 선택
- 겹치는 선택 영역 병합 및 선택 영역 터치 해제
- 빈 시간대와 강의를 길게 눌러 고정/해제
- 시간표 생성, 이름 변경, 삭제, 즐겨찾기, 이미지 다운로드
- 자동편성 조건 패널 및 결과 서버 저장
- 학기 목록 API 연결

### 자동편성

- 생성: `POST /api/v1/optimizations`
- 상태 조회: `GET /api/v1/optimizations/{jobId}`
- 결과 적용: `POST /api/v1/optimizations/{jobId}/results/{rank}/apply`
- 최소·최대 학점, 제외 요일, 가능 시간, 공강 고정, 강의 고정을 전달한다.
- 1위 결과를 화면에 반영한 뒤 서버 시간표에도 적용한다.

백엔드 PR #25에서 자동편성 학과 필터링이 추가됐다.

- PR: https://github.com/PLLab-Project/PL_Timetable_Project_BE/pull/25
- 병합 커밋: `ed4bbca`
- 로그인 사용자의 `academicUnitCode`에 해당하는 전공 분반을 후보로 남긴다.
- 교양과 학과 연결 정보가 없는 미분류 분반은 공통 후보로 허용한다.
- 프론트 자동편성 요청 DTO는 변경되지 않아 현재 요청 코드와 호환된다.

### 내 강의

- 과목명 API 검색과 검색 결과 선택
- 사용자 학과 기준 전공필수·전공선택·일반선택 자동 분류
- 영역과 학점 수동 선택
- 과목 입력 박스 추가/수정/삭제
- OCR 이미지 업로드 및 인식 결과 입력 폼 생성
- OCR 강의의 카탈로그 매칭 결과를 이용한 영역·학점 보정
- 졸업요건 평가 API 및 안내 모달

### 인증과 사용자 정보

- 서버 주도 Google OIDC 로그인
- 세션 확인 후 로그인/최초 정보 입력/앱 화면 분기
- 최초 정보 입력에서 단일전공·복수전공·부전공 선택 UI
- 마이페이지 계정정보 변경에도 같은 선택 UI 적용
- 학과 검색 API 연결
- 최초 로그인 튜토리얼과 물음표 버튼을 통한 다시 보기

## 6. 가장 최근 변경사항

커밋 `12f073c`:

- `MyAccountInfo`에 단일전공·복수전공·부전공 선택 추가
- 단일전공일 때 필드명을 `학과`로 표시
- 복수전공/부전공일 때 주전공과 추가 전공을 각각 검색·선택
- 같은 학과를 주전공과 추가 전공으로 동시에 선택하지 못하게 처리
- `programPath`를 사용자 프로필 PATCH 요청에 포함

## 7. 확인이 필요한 제한과 후속 작업

### 복수전공·부전공 서버 저장

프론트에는 추가 전공 UI가 있지만 현재 `src/api/users.js`의 사용자 PATCH 요청은 다음 값만 보낸다.

- `departmentId`: 주전공 한 개
- `programPath`: `ADVANCED_MAJOR`, `DOUBLE_MAJOR`, `MINOR`

`secondaryDepartmentCode`는 아직 백엔드로 보내지 않는다. 마지막 백엔드 확인 시 `StudentProfile`도 `academicUnitCode` 한 개만 저장했다. 따라서 다음 작업이 필요하다.

1. 백엔드 사용자 프로필에 복수전공/부전공 학과 코드 저장 구조와 API 필드 추가
2. `GET/PATCH /api/v1/users/me` 응답·요청 명세 확정
3. 프론트 `src/api/users.js`에서 추가 전공 코드를 전송
4. 로그인 재접속 후 추가 전공이 복원되는지 확인
5. 자동편성 `resolveUserAcademicUnitCodes()`가 주전공과 추가 전공을 모두 반환하도록 백엔드 수정

### 자동편성 학과 필터의 데이터 의존성

- `section_academic_units`에 학과 연결 정보가 없으면 미분류 공통 강의로 허용된다.
- 비고에만 수강 제한이 있고 구조화된 학과 정보가 없으면 다른 학과 분반이 후보에 남을 수 있다.
- 운영 Cloud Run에 백엔드 최신 `main`이 실제 배포됐는지는 별도 리비전 확인이 필요하다.

### 사용자 경험 검증

- 최초 정보 입력과 마이페이지 계정정보 변경의 복수전공 필드가 모바일/PC에서 자연스러운지 확인
- Vercel에서 Google 로그인 후 세션·CSRF가 유지되는지 확인
- 자동편성에서 다른 학과 전용 분반이 제외되는지 실제 계정으로 확인
- OCR에서 과목명뿐 아니라 영역과 학점이 채워지는지 실제 이미지로 재검증
- 졸업요건 평가가 최신 사용자 프로필 값을 사용하는지 확인

## 8. 작업 시 지켜온 기준

- 와이어프레임 이미지를 우선 기준으로 UI 위치·크기·테두리·그림자를 맞춘다.
- 사용자가 요청하지 않은 필드나 화면 요소를 임의로 추가하지 않는다.
- 모바일 디자인을 유지하면서 PC 반응형만 필요한 부분을 분리한다.
- API 관련 변경과 UI 변경을 구분한다.
- 백엔드 명세가 애매하면 임의 값을 만들지 말고 부족한 API 필드로 보고한다.
- Git 작업 전에는 사용자 변경사항을 보존하고 관련 파일만 명시적으로 스테이징한다.
- 기능 변경 후 `npm run build`로 검증한다.

## 9. 새 ChatGPT 프로젝트에서 시작할 프롬프트

아래 문장을 새 ChatGPT 프로젝트 또는 Cloud Work 채팅의 첫 메시지로 사용한다.

```text
PLLab 시간표 프로젝트 프론트엔드 작업을 이어서 진행할 거야.

먼저 저장소의 CODEX_HANDOFF.md를 끝까지 읽고 현재 구현 현황, API 주소, 알려진 제한을 파악해줘. 프론트엔드 저장소는 https://github.com/PLLab-Project/PL_Timetable_Project_FE 이고, 백엔드는 https://github.com/PLLab-Project/PL_Timetable_Project_BE 이야.

기존 와이어프레임과 사용자의 명시적인 요청을 우선하고, 요청하지 않은 UI 요소는 임의로 추가하지 마. 작업 전 git status와 최신 main을 확인하고, 변경 후 npm run build로 검증해줘. API 변경과 화면 변경도 구분해서 설명해줘.

현재 우선 과제는 복수전공·부전공 추가 학과를 백엔드 사용자 프로필에 실제 저장하고, 재로그인 복원 및 자동편성 학과 필터에 포함할 수 있는 API가 있는지 확인하는 것이다. 파일을 바꾸기 전에 백엔드 최신 명세와 코드를 먼저 확인하고 결과를 정리해줘.
```

## 10. 새 컴퓨터에서 이어가는 권장 순서

1. 같은 ChatGPT 계정으로 로그인한다.
2. ChatGPT에서 새 프로젝트를 만든다.
3. 이 저장소를 새 컴퓨터에 clone한다.
4. 프로젝트 Sources에 `CODEX_HANDOFF.md`를 업로드하거나 GitHub 저장소를 연결한다.
5. 가능하면 ChatGPT Work 실행 위치를 `Cloud`로 선택한다.
6. 위의 시작 프롬프트를 붙여 넣는다.
7. 코드 수정이 필요하면 로컬 Codex 프로젝트에서 같은 저장소를 열거나 GitHub 작업 흐름을 사용한다.

