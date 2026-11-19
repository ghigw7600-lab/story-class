# STORY Korean · TOPIK 온라인 수업 (story-class)

우즈벡·키르기스 학생 대상 TOPIK 온라인 수업 홈페이지. 주소(예정): **class.storydesk.co.kr**. 설계 원본 = claude.ai 문서 "TOPIK 온라인 수업 플랫폼 1차 설계".
**대표는 개발자가 아니다. 모든 답변·화면 문구(대표·강사용)·커밋 설명은 한국어로.** 학생 화면은 우즈벡어(라틴)·러시아어.

## 결정 (2026-11-18, 대표)
- **브랜드 이름 = STORY Korean** (부제 TOPIK Online · by STORY CONSULTING). 유학원 STORY CONSULTING과 한 가족. 나중에 나망간 오프라인 학원은 "STORY Korean o'quv markazi" 형식. "세종"·"TOPIK"만 쓰는 이름은 피함(공식 기관처럼 보임).
- 수업 봇 = **STORY Korean · @storykorean_bot** (대표가 BotFather에서 만듦, Vercel NEXT_PUBLIC_BOT_USERNAME=storykorean_bot). 토큰은 Vercel 환경변수에만 — 채팅·저장소에 두지 않음.

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
- **서버 지역 = 서울(icn1, vercel.json)** — Supabase가 서울이라. 기본(미국 동부)이면 DB 한 번마다 태평양을 오가서 느림 (2026-11-18).
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

## ★ 2026-11-19 — 다음 세션은 여기서 시작
- **배포 완료**: Vercel story-class (story-class-gamma.vercel.app, 서울 icn1), Supabase story-class(서울) 0001 실행, 환경변수 6개, 봇 연결(대표 화면 맨 위 [🤖 봇 연결] = /api/bot/setup, 점검 정보 표시) → /start 정상. 대표·혜승(아이폰)으로 신청→입금 사진→입금 확인 시험 완료.
- **도메인 class.storydesk.co.kr·BotFather /setdomain은 아직** (확인 필요). 브라우저 텔레그램 로그인은 /setdomain 뒤에 됨.
- [수업 들어가기]는 미니앱에서 `Telegram.WebApp.openLink`로 텔레그램 밖에서 Zoom을 엶 (`src/components/JoinButton.tsx`, `/join/[id]?json=1`). 안 그러면 ERR_UNKNOWN_URL_SCHEME. 아이폰은 '열기' 확인 2번(정상).
- **Zoom (대표는 처음 씀)**: 반마다 회사 Zoom 계정에서 [회의 예약 → 되풀이 회의 → 고정 시간 없음]으로 만들고 링크(pwd 포함)를 반 정보에 넣음. '새 회의(즉석)'·한 번짜리 회의 링크는 끝나면/30일 뒤 죽음 → '잘못된 회의 ID'. 강사는 회사 계정으로 [시작]만. 시험(2명)은 무료, 실제 수업(3명↑)부터 Pro 월간 1개.
- **대표 계획 (11-18)**: 처음엔 신청보다 **모집에 집중** — 봇으로 그룹방에 정보글·TOPIK 기출(출처·회차 표기)을 올려 학생을 모음. 다음 작업 후보 = 그룹방 자동 글(예: 매일 오늘의 기출 1문제 → 다음 날 정답·해설).

## 채널 자동 글 (2026-11-19, 대표)
- 모집용은 그룹방 대신 **채널 + 댓글 그룹**: **TOPIK | Koreys Tilli 🇰🇷 · @storytopik** (봇 = 관리자·메시지 게시). 콘텐츠 방향: TOPIK 기출·정보, 기초 한글, K-pop 표현(가사 전문 X — 공식 MV 링크 + 표현 1~2개), 한국 음식 포스터 읽기 챌린지(댓글에 음성).
- 1차 구현: `channel_posts` 표(0002) = 문제 창고. Vercel cron 매일 13:00 UTC(타슈켄트 18시) `/api/cron/channel` → ① 12시간 지난 문제의 정답·해설(문제에 답장 + 수업 봇 버튼) ② 창고 맨 위 문제를 **퀴즈 투표**로(지문 있으면 글 먼저). 20시간 안에 올렸으면 건너뜀(중복 방지). 대표 화면 [📢 채널]: 연결 점검·창고·문제 추가·[지금 바로 올리기].
- 환경변수 추가: `CRON_SECRET`(필수 — 없으면 cron 401), `CHANNEL_ID`(선택, 기본 @storytopik).
- 기출은 **출처(회차·번호) 표기**. 시작용 `supabase/seed/channel_sample_quiz.sql` = 자체 연습문제 5개(기출 아님, 우즈벡어 해설 현지인 확인 필요).
- 다음 후보: 글 종류 늘리기(기초 한글·K-pop 표현·음식 읽기 챌린지 — 사진+글), 요일별 순서.

## 1단계 (2026-11-17 완료, 2026-11-18 배포)
- 학생: 처음 여권 영문 이름·전화(선택) → 반 신청 → 입금 사진 → 입금 확인되면 [Darsga kirish] (출석 기록 + Zoom). UZ/RU 바꾸기.
- 대표(/admin): 오늘 숫자(입금 확인 대기·수강 중·오늘 수업), 입금 사진 보고 [✔ 입금 확인](학생에게 봇 알림), 반 목록·만들기. 반 화면: 최근 4주 출석표(✔ △ ✕ ○·출석률), 명단·그만둠, 반 정보·Zoom 링크·강사.
- 알림: 새 신청·입금 사진 → 대표에게 봇 / 입금 확인 → 학생에게 봇.

## 다음 (2단계 후보)
- 강사 화면(내 반·출석부), 수업 10분 전·결석 알림(cron), 숙제·모의고사·자동 채점, 쓰기 Claude 첨삭 초안, 오답노트, 월간 리포트, 관심 학생 자동 추출, 유학 상담 연결(GIEC 전산 /api/bot/lead), Zoom 화면 넣기(Meeting SDK), [번호 공유] 버튼.
