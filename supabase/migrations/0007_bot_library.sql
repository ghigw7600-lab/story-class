-- 0007 · 봇 도서관(자료 배포) + 봇 사용자 기록
-- 대표가 Supabase → SQL Editor 에 붙여 넣고 [Run] 한 번.
-- 학생이 @storykorean_bot 에서 자료를 받으려면 @storytopik 구독을 확인함(구독 강제) — 경쟁 채널 방식.

-- 자료: 대표가 봇에게 파일을 보내면(캡션에 #tests 같은 분류) 자동 저장. 링크 자료는 관리 화면에서 추가.
create table if not exists library_items (
  id          bigint generated always as identity primary key,
  category    text not null check (category in ('tests', 'writing', 'words', 'guide')),
  title       text not null,
  description text,
  file_id     text,                       -- 텔레그램 파일 번호 (봇이 다시 보낼 때 씀)
  file_type   text not null check (file_type in ('document', 'audio', 'video', 'photo', 'link')),
  url         text,                       -- file_type = link 일 때
  sort        int not null default 0,
  active      boolean not null default true,
  downloads   int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists library_items_cat on library_items (category, active, sort, id);

-- 봇을 한 번이라도 연 사람 (관심 학생) — 어디서 왔는지(source), 채널 구독 여부
create table if not exists bot_users (
  tg_id       bigint primary key,
  first_name  text,
  username    text,
  lang        text,
  source      text,                       -- /start 뒤에 붙은 값: channel · reg · (없음)
  subscribed  boolean,
  created_at  timestamptz not null default now(),
  last_seen   timestamptz not null default now()
);

alter table library_items enable row level security;
alter table bot_users     enable row level security;
grant all on library_items, bot_users to service_role;
grant all on all sequences in schema public to service_role;
revoke all on library_items, bot_users from anon, authenticated;

-- 다운로드 수 +1 (봇이 자료를 보낼 때)
create or replace function library_hit(item_id bigint) returns void language sql security definer as
$$ update library_items set downloads = downloads + 1 where id = item_id $$;
revoke all on function library_hit(bigint) from public, anon, authenticated;
grant execute on function library_hit(bigint) to service_role;
