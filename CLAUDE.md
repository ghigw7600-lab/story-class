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

## 채널 소식 — 확인 후 게시 (2026-11-19, 대표)
- 대표 결정: 한국·TOPIK 소식은 **완전 자동 X, 확인 후 게시**. 흐름 = RSS 수집 → Claude 요약 초안(우즈벡어 + 대표 확인용 한국어) → 대표 [✔ 승인] → 하루 1개 게시.
- 표 `news_sources`(RSS 주소, 시작값 = 구글 뉴스 검색 RSS 4개: TOPIK·유학생 비자/정책·우즈벡 유학생·GKS) / `news_items`(url unique, status draft·approved·posted·rejected·ignored, cta class·consult). migration 0003.
- cron: `news-collect` 03:00 UTC(한국 12시) — 새 글 최대 12개만 Claude에 보냄, 초안 있으면 대표에게 봇 알림(→ /admin/news) / `news-post` 07:00 UTC(한국 16시) — 승인된 것 중 가장 오래된 1개.
- 요약 원칙(프롬프트 `src/lib/news.ts` SYSTEM): 원문에 있는 사실만, 제목만 있으면 추측 없이 짧은 소개 + 원문 링크, 문장 복사 X(저작권), 현지스타일 우즈벡어. 버튼: 원문 + (TOPIK·한국어 → 수업 봇 / 비자·입학·장학금 → @storyconsulting_bot).
- RSS 없는 곳(TOPIK 공식, 하이코리아)은 관리 화면 [링크로 직접 초안 만들기]. 정책브리핑(korea.kr) RSS는 2026-07 중단됨.
- 환경변수 추가: `ANTHROPIC_API_KEY`(필수), `ANTHROPIC_MODEL`(선택, 기본 claude-sonnet-5-5), `CONSULT_BOT_USERNAME`(선택).

## 경쟁 채널 분석 → 아침 카드·서명 (2026-11-20, 대표 "그렇게 진행")
- 분석(11-20): TOPIK ACADEMY(9.2천, 학원+컨설팅 채널 분리·매일 '오늘의 표현' 카드·PDF 조회수 최고·시험 일정형 콘텐츠), KaresTili(1.5만, 문법 카드·통계 글 반응 최고·읽기 챌린지 김밥 11-10 이미 시작), TILLO BOLA(1.7만, 개인 브랜드·무료 마라톤·반응 조건·강좌 광고 반복·판매는 사람 DM). 결론 순서: ① 오늘의 표현 카드 ② 서명·참여 투표 ③ 시험 일정 캠페인.
- ① `daily_cards`(0004, kind expression·poll, draft→approved→posted). 카드 그림 = `next/og` ImageResponse 1080², 폰트는 구글 폰트 Noto Sans KR을 글자만 잘라 받음(`src/lib/cards.ts`), 텔레그램엔 multipart sendPhoto(캡션 + 수업 봇 버튼). cron `morning` 05:00 UTC(타슈켄트 10시) 표현 1장, 화·금 투표 1개. 승인된 게 없으면 대표에게 봇 알림. 창고 < 4장(투표 < 2)이면 news-collect cron 때 Claude가 7장(4개) 자동 초안 + 알림. 대표 화면 [🌅 카드]: 그림 미리보기·고치기·승인·지금 올리기·Claude로 초안(요청 문구).
- ② 모든 채널 글 끝 서명 `SIGN`(`src/lib/channel.ts`): "🇰🇷 @storytopik — TOPIK · Koreys tili". 소식 요약 지침에 "원문의 숫자를 제목에" 추가(통계 글 반응이 가장 큼).
- Claude 호출 공통화 `src/lib/claude.ts` (claudeJSON).
- ③ 시험 일정 캠페인(0005 `exam_events`·`exam_posts`, `src/lib/exams.ts`): 대표가 [📅 시험]에 회차·장소·시험일·접수 시작/마감·성적 발표를 넣으면 morning cron이 그날 글 자동: 접수 시작 → 마감 2일 전 → D-30/14/7/3(팁) → D-1(준비물) → 당일 응원 → 다음 날 "어땠어요?" 글+투표 → 성적 발표(상담 버튼). 우즈벡어 = 고정 틀(현지인 확인 필요). 날짜는 하드코딩 X — 2027년 110회(1/10)는 국내만, 우즈벡 시행일은 공식 공지로 확인.

## 퀴즈 정답 방식 변경 (2026-11-20, 대표 "응")
- 다음 날 정답 글 **없앰** — 텔레그램 퀴즈는 누르면 바로 정답·짧은 해설(explain_short)이 보여서 다음 날 정답은 중복·채널 소음. 경쟁 채널도 문제 1개엔 안 씀(TOPIK ACADEMY는 모의고사 한 회분만 '풀어 보세요 → 다음 날 해설').
- channel cron: 월~토 = 퀴즈 1개 / **일요일(타슈켄트) = 퀴즈 쉬고 "이번 주 문제 정답·해설 모음" 1개**(`postWeeklyRecap`, status posted → answered). 대표 화면 [퀴즈 지금 올리기]·[주간 정답 모음 지금 올리기]. explain_full은 이제 참고용.
- 모의고사(한 회분)를 올릴 땐 그때만 '다음 날 해설' 방식.

## API 키 없이 시작 (2026-11-20, 대표)
- 대표 결정: **Anthropic API 키 없이 먼저 운영**, 채널 반응 보고 나중에 선불 충전 검토 (Claude Pro 사용 중 → 무료 API 크레딧 없음, 개인은 후불제 불가).
- 키 없으면 news-collect cron은 조용히 건너뜀(매일 오류 알림 X). 퀴즈·시험 캠페인·서명은 키 없이 작동.
- `supabase/seed/starter_content.sql` = Claude(대화)가 직접 쓴 표현 카드 30장·투표 8개(초안) + 퀴즈 25개(대기, 정답 위치 섞음, 자체 연습문제). 대표 화면 [🌅 카드]에 **직접 추가**·**모두 승인** 버튼.
- 창고가 떨어지면: 대표가 직접 추가하거나, 대화에서 Claude에게 다음 묶음 SQL을 요청.

## 2027 우즈벡 TOPIK 일정 (2026-11-20 조사, 대표 요청)
- 공식 접수처 = 타슈켄트 한국교육원 **topiktashkec.uz** (JS 사이트 — 내장 브라우저로 읽음). 11-20 현재 2027 회차 없음(마지막 109회 2026-11-15).
- 우즈벡 패턴(2025~26 기록): **PBT = 일요일**, 해외 5회 모두 시행(7월 회차는 타슈켄트·사마르칸트·페르가나만) / **IBT = 토요일, 3·6·9월만**(2026: 12·13·14회, 15·16회 X). 접수 = 사이트 가입(월~일) → 온라인 신청(금·토) → 교육원 방문 납부 2주, 시험 약 3달 전.
- 2027 예상(교육부 계획 2026-09-29): PBT 111(4/11)·112(5/16)·113(7/4)·114(10/17)·115(11/14), IBT 18(3/20)·19(6/12)·20(8/28, 시행 미확인). 결과일 = 한국 계획.
- 0006: `exam_events.confirmed`(false=예상 → 캠페인 자동 글 안 함)·`note`. `supabase/seed/exams_2027_uz.sql` = 위 8개를 예상으로. topiktashkec.uz 공지 나오면 접수 기간 넣고 [✔ 공식 확인함].

## 경쟁 채널 심층 분석 → 따라 하기 (2026-11-20~23, 대표 "추천 순서대로")
- 모델: @KOREAN_TOPIK_CHANNEL(1.24만, AYUPOV ISLOM) — 본채널 + 댓글 그룹 @Koreystili_grupa + TOPIK TESTLAR(기출 자료실: 회차별 문제지·듣기 음원·대본·정답 4종, 해시태그 #64_Topik #TOPIK_II #Savollar/#audio/#통합/#Javoblar, "Manba: @채널") + TTMIK(음원 재업) + **도서관 봇(구독 강제: 가입해야 메뉴 열림, 메뉴 13개 중 '개인 캐비닛 만들기')** + 광고 판매. 고정 글 = 우즈벡 시험 일정표. 조회수 1위 = 공식 시험 공지·접수 당일 실시간 중계. 댓글 = 거의 접수 질문, 운영자 무응답 → **STORY 기회: 접수 도우미 + 빠른 응답**. 교재·영화·TTMIK 재업은 저작권 문제 → 따라 하지 않음.
- ① 고정용 일정표 카드(`src/lib/schedule.ts`): exam_events로 1080×1350 그림(RASMIY/TAXMINIY 글자 배지 — 그림 안 이모지 X, 외부 fetch 필요해서), 캡션 ✅/⏳ + [Ro‘yxatdan o‘tish yordami] 버튼(봇 ?start=reg), 올리고 pinChatMessage(실패 시 직접 고정 안내). [📅 시험] 위에 미리보기·[📌 올리고 고정].
- ② 봇 도서관 + 구독 확인 + 접수 도우미(`src/lib/botflow.ts`, 0007 `library_items`·`bot_users`·`library_hit()`): /start(+source) → getChatMember로 @storytopik 구독 확인(봇 권한 문제면 막지 않음) → 안 했으면 [채널]·[✅ Tasdiqlash] → 메뉴(reply keyboard): 📚 Materiallar(분류 tests·writing·words·guide → 자료 → file_id로 다시 보냄, 다운로드 수) · 📝 Ro‘yxatdan o‘tish yordami(4단계 안내 + 다음 시험·접수일, topiktashkec.uz·상담 버튼) · 📅 TOPIK jadvali · 🎓 Onlayn darslar(미니앱) · 💬 Konsultatsiya(@storyconsulting_bot). 자료·도우미는 구독자만. **대표가 봇에 파일 + 캡션 `#tests 제목`을 보내면 저장**. webhook allowed_updates에 callback_query 추가 → 배포 후 [🤖 봇 연결] 다시 눌러야 함. 대표 화면 [📦 자료]: 봇 사용자 수·구독 수·자료 목록(이름·분류·순서·숨기기)·링크 자료 추가. 직접 만든 자료만(저작권), 공식 기출은 링크.
- 봇 한국어 화면(2026-11-23, 대표 요청 "내가 쓸 땐 한국어로"): 대표(OWNER_IDS)는 기본 한국어(메뉴: 자료실·접수 도우미·시험 일정·온라인 수업·유학 상담), `/uz` = 학생 화면(우즈벡어) 보기, `/ko` = 한국어로. 보기 설정은 bot_users.lang = 'view:uz'|'view:ko'(대표 줄은 language_code로 덮어쓰지 않음). 텔레그램 언어가 ko인 사용자도 한국어. 메뉴 버튼은 두 말 모두 알아들음. 자료 캡션(Manba)은 우즈벡어 고정.

## 1단계 (2026-11-17 완료, 2026-11-18 배포)
- 학생: 처음 여권 영문 이름·전화(선택) → 반 신청 → 입금 사진 → 입금 확인되면 [Darsga kirish] (출석 기록 + Zoom). UZ/RU 바꾸기.
- 대표(/admin): 오늘 숫자(입금 확인 대기·수강 중·오늘 수업), 입금 사진 보고 [✔ 입금 확인](학생에게 봇 알림), 반 목록·만들기. 반 화면: 최근 4주 출석표(✔ △ ✕ ○·출석률), 명단·그만둠, 반 정보·Zoom 링크·강사.
- 알림: 새 신청·입금 사진 → 대표에게 봇 / 입금 확인 → 학생에게 봇.

## 다음 (2단계 후보)
- 강사 화면(내 반·출석부), 수업 10분 전·결석 알림(cron), 숙제·모의고사·자동 채점, 쓰기 Claude 첨삭 초안, 오답노트, 월간 리포트, 관심 학생 자동 추출, 유학 상담 연결(GIEC 전산 /api/bot/lead), Zoom 화면 넣기(Meeting SDK), [번호 공유] 버튼.
