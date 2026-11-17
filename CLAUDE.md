# STORY CONSULTING · TOPIK 온라인 수업 (story-class)

우즈벡·키르기스 학생 대상 TOPIK 온라인 수업 홈페이지. 주소(예정): **class.storydesk.co.kr**. 설계 원본 = claude.ai 문서 "TOPIK 온라인 수업 플랫폼 1차 설계".
**대표는 개발자가 아니다. 모든 답변·화면 문구(대표·강사용)·커밋 설명은 한국어로.** 학생 화면은 우즈벡어(라틴)·러시아어.

## 결정 (2026-11-17, 대표)
- 영상은 직접 만들지 않음 → **Zoom** (1기). 처음엔 [수업 들어가기] → Zoom 링크, 다음 단계에서 Zoom Meeting SDK로 홈페이지 안에 넣기. 12월 무료 체험반에서 **Jitsi(JaaS, 25명까지 무료)** 도 시험.
- ClassCanvas는 안 씀 (체험판 확인: 우즈벡어·러시아어 화면 없음, 알림이 카카오 기준). 가져올 것: 관심 학생 자동 추출 · 대기 업무 숫자 · 오답노트 · 월간 리포트.
- **로그인 = 텔레그램 자동 로그인** (회원가입·비밀번호 없음). 텔레그램 번호 = 학생 번호.
  - 봇에서 연 미니앱: initData 서명 확인 (`src/lib/tg.ts` verifyInitData) / 브라우저: 텔레그램 로그인 위젯 (verifyLoginWidget, BotFather `/setdomain` 필요).
  - 로그인 쿠키 = 텔레그램 번호.만료.HMAC(SESSION_SECRET), 30일, SameSite=None+Partitioned (텔레그램 웹 iframe).
- **새 수업 전용 봇** (GIECbot과 따로) — 상담방과 수업 알림이 섞이지 않게. 유학 상담 연결은 텔레그램 번호로 GIEC 전산과 이음(2단계).
- **결제 = PG 없이 시작**: 국내 학생 계좌이체 / 해외 학생 회사 계좌 해외송금 → 학생이 입금 사진 → 대표 [입금 확인] → 수업 입장 열림. 학생이 늘면 해외카드 되는 국내 PG, 현지 법인 생기면 Payme·Click. **현지인이 대신 받아 정산하는 방식(환치기)은 쓰지 않음.**
- DB는 GIEC 전산과 **따로** (Supabase 새 프로젝트 story-class, 서울).

## 기술
- Next.js 15 (App Router, TS) · Supabase (Postgres + 파일 저장) · Vercel.
- **DB는 서버에서만** (service_role, `src/lib/db.ts`). 모든 표 RLS 켜고 정책 없음 → 브라우저 키로는 0건. 학생 화면도 서버가 "그 학생 것만" 골라서 보여 줌.
- `events` = 누가·언제·무엇을 (트리거로 수정·삭제 불가).
- 입금 사진 = 저장소 `proofs`(비공개), 대표 화면에서 10분 링크.
- 출석 = [수업 들어가기]를 누른 기록 (`/join/[id]`): 시작 30분 전~시작 10분 = 출석, 그 뒤~끝 = 지각, 그 밖 = 수업 외. 시간은 반 시간대(기본 타슈켄트). 대표·강사는 기록 안 함.
- 환경변수: `.env.example` (BOT_TOKEN, NEXT_PUBLIC_BOT_USERNAME, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, SESSION_SECRET, OWNER_IDS).
- 봇 연결: 대표가 로그인한 뒤 `/api/bot/setup` 한 번 열기 → webhook·메뉴 버튼 설정.

## 작업 방식
- 한 번에 한 기능. `npm run typecheck && npm run build` 통과 후 커밋.
- DB 변경 = 새 migration 파일 (기존 수정 금지), 대표가 Supabase SQL Editor에서 실행. 학생 실데이터는 저장소에 올리지 않음.
- 결정이 바뀌면 이 파일에 날짜와 함께 기록.
- 우즈벡어 문구(`src/lib/i18n.ts`, 봇 메시지)는 **현지인 확인 필요** — 짧고 쉬운 표준어로.

## 1단계 (2026-11-17 완료, 배포 전)
- 학생: 처음 여권 영문 이름·전화(선택) → 반 신청 → 입금 사진 → 입금 확인되면 [Darsga kirish] (출석 기록 + Zoom). UZ/RU 바꾸기.
- 대표(/admin): 오늘 숫자(입금 확인 대기·수강 중·오늘 수업), 입금 사진 보고 [✔ 입금 확인](학생에게 봇 알림), 반 목록·만들기. 반 화면: 최근 4주 출석표(✔ △ ✕ ○·출석률), 명단·그만둠, 반 정보·Zoom 링크·강사.
- 알림: 새 신청·입금 사진 → 대표에게 봇 / 입금 확인 → 학생에게 봇.

## 다음 (2단계 후보)
- 강사 화면(내 반·출석부), 수업 10분 전·결석 알림(cron), 숙제·모의고사·자동 채점, 쓰기 Claude 첨삭 초안, 오답노트, 월간 리포트, 관심 학생 자동 추출, 유학 상담 연결(GIEC 전산 /api/bot/lead), Zoom 화면 넣기(Meeting SDK), [번호 공유] 버튼.
