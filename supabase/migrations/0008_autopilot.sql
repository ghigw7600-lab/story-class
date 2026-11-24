-- 0008 · 자동 운영 (대표 할 일 줄이기)
-- 대표가 Supabase → SQL Editor 에 붙여 넣고 [Run] 한 번.
--  ① settings: 자동 승인 스위치 등 (기본 = 자동 승인 켜짐)
--  ② daily_cards 에 새 종류: writing(쓰기 연습 사진, 다음 날 모범답안) · tip(어휘·문법 팁) · question(참여 질문)
--  ③ library_items.channel_posted_at: 자료를 채널에 주 1회 소개할 때 순서
--  ④ bot_users.waitlist_at: 수업 대기 명단

create table if not exists settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
insert into settings (key, value) values ('auto_approve', 'on') on conflict (key) do nothing;
alter table settings enable row level security;
grant all on settings to service_role;
revoke all on settings from anon, authenticated;

alter table daily_cards drop constraint if exists daily_cards_kind_check;
alter table daily_cards add constraint daily_cards_kind_check
  check (kind in ('expression', 'poll', 'writing', 'tip', 'question'));
alter table daily_cards add column if not exists tag              text;        -- writing: '51' · '52' / tip: 'grammar' · 'word' · 'tip'
alter table daily_cards add column if not exists body_ko          text;        -- writing: 문제 글(㉠ ㉡ 빈칸) / tip: 한국어 제목(문법·단어)
alter table daily_cards add column if not exists body_uz          text;        -- tip 설명 · question 덧붙임 · writing 안내
alter table daily_cards add column if not exists answer           text;        -- writing 모범답안 (다음 쓰기 날 답장으로)
alter table daily_cards add column if not exists answer_posted_at timestamptz;

alter table library_items add column if not exists channel_posted_at timestamptz;
alter table bot_users     add column if not exists waitlist_at       timestamptz;
