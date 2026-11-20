-- 0005 · 시험 일정 캠페인 (접수 시작·마감 임박·D-30/14/7/3/1·시험 당일·다음 날·성적 발표 글 자동)
-- 대표가 Supabase → SQL Editor 에 붙여 넣고 [Run] 한 번.
-- 날짜는 대표 화면 [📅 시험]에서 공식 공지(topik.go.kr · 우즈벡 시행기관)를 보고 넣음.

create table if not exists exam_events (
  id           bigint generated always as identity primary key,
  name         text not null,          -- 예: 111-TOPIK (PBT)
  place        text,                   -- 예: O'zbekiston · Toshkent / Koreya
  exam_date    date not null,
  reg_start    date,
  reg_end      date,
  result_date  date,
  link         text,                   -- 접수·공지 링크 (선택)
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- 어떤 글을 이미 올렸는지 (같은 글 두 번 안 올리게)
create table if not exists exam_posts (
  event_id   bigint not null references exam_events(id) on delete cascade,
  trigger    text not null,            -- reg_start · reg_end_2 · d30 · d14 · d7 · d3 · d1 · d0 · after1 · result
  message_id bigint,
  posted_at  timestamptz not null default now(),
  primary key (event_id, trigger)
);

alter table exam_events enable row level security;
alter table exam_posts  enable row level security;
grant all on exam_events, exam_posts to service_role;
grant all on all sequences in schema public to service_role;
revoke all on exam_events, exam_posts from anon, authenticated;
