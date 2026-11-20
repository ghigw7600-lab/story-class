-- 0004 · 아침 카드 (오늘의 표현 이미지 카드 + 참여 투표)
-- 대표가 Supabase → SQL Editor 에 붙여 넣고 [Run] 한 번.
-- Claude가 초안을 만들고(창고가 4개 밑으로 떨어지면 자동), 대표가 [승인]한 것만
-- 매일 아침(타슈켄트 10시) 표현 카드 1장, 화·금에는 참여 투표 1개를 함께 올림.

create table if not exists daily_cards (
  id          bigint generated always as identity primary key,
  kind        text not null check (kind in ('expression', 'poll')),
  -- expression(오늘의 표현)
  expr_ko     text,                 -- 표현 (한국어)
  meaning_uz  text,                 -- 뜻 (우즈벡어)
  meaning_ko  text,                 -- 대표 확인용 한국어 뜻
  note_uz     text,                 -- 언제 쓰는지 한 줄 (우즈벡어)
  examples    jsonb not null default '[]',  -- [{"ko":"…","uz":"…"}] 최대 2개
  level       text,                 -- TOPIK I · TOPIK II
  -- poll(참여 투표)
  question    text,                 -- 투표 질문 (우즈벡어)
  options     text[],               -- 보기 2~6개
  -- 공통
  status      text not null default 'draft' check (status in ('draft', 'approved', 'posted', 'rejected')),
  sort        int not null default 0,
  posted_at   timestamptz,
  message_id  bigint,
  decided_by  bigint,
  created_at  timestamptz not null default now()
);
create index if not exists daily_cards_queue on daily_cards (kind, status, sort, id);

alter table daily_cards enable row level security;
grant all on daily_cards to service_role;
grant all on all sequences in schema public to service_role;
revoke all on daily_cards from anon, authenticated;
