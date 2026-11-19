-- 0002 · 채널 자동 글 (TOPIK | Koreys Tilli 🇰🇷 · @storytopik)
-- 대표가 Supabase → SQL Editor 에 붙여 넣고 [Run] 한 번.
-- 매일 정해진 시간에 봇이 ① 어제 문제의 정답·해설을 올리고 ② 창고에서 다음 문제 1개를 퀴즈로 올림.

create table if not exists channel_posts (
  id                bigint generated always as identity primary key,
  kind              text not null default 'quiz' check (kind in ('quiz')),
  source            text,                 -- 출처: "제00회 TOPIK I 읽기 00번" / "STORY Korean 연습문제"
  level             text,                 -- TOPIK I · TOPIK II 등
  passage           text,                 -- (선택) 지문 — 길면 퀴즈 앞에 글로 먼저 올림
  question          text not null,        -- 문제 (300자 이내)
  options           text[] not null,      -- 보기 2~4개 (각 100자 이내)
  correct           int not null,         -- 정답 번호 (0부터: 0=①, 1=②…)
  explain_short     text,                 -- 퀴즈에서 답을 누르면 보이는 짧은 해설 (200자 이내)
  explain_full      text,                 -- 다음 날 올리는 정답·해설 글
  sort              int not null default 0, -- 작을수록 먼저 올림
  status            text not null default 'queued' check (status in ('queued', 'posted', 'answered', 'skipped')),
                    -- queued 대기 · posted 문제 올림 · answered 정답까지 올림 · skipped 안 올림
  passage_message_id bigint,
  poll_message_id   bigint,
  answer_message_id bigint,
  posted_at         timestamptz,
  answered_at       timestamptz,
  created_at        timestamptz not null default now(),
  created_by        bigint
);

create index if not exists channel_posts_queue on channel_posts (status, sort, id);

alter table channel_posts enable row level security;
-- (정책 없음 = 브라우저 키로는 0건. 서버의 service_role만 읽고 씀)
grant all on channel_posts to service_role;
grant all on all sequences in schema public to service_role;
revoke all on channel_posts from anon, authenticated;
