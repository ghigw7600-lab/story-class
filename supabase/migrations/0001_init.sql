-- 0001: STORY CONSULTING 온라인 TOPIK 수업 — 1단계 (로그인 · 반 · 신청·입금 확인 · 출석)
-- 모든 읽기·쓰기는 서버(service_role)에서만 한다. 표마다 RLS를 켜고 정책을 하나도 안 만들어서
-- 브라우저(anon) 키로는 아무것도 못 읽는다. (학생이 다른 학생 정보를 보는 길 자체가 없음)

-- ───────── 사람 (텔레그램 번호 = 학생 번호) ─────────
create table if not exists people (
  tg_id         bigint primary key,                 -- 텔레그램 사용자 번호
  tg_username   text,                               -- @아이디 (없을 수 있음)
  tg_name       text,                               -- 텔레그램에 보이는 이름
  passport_name text,                               -- 여권 영문 이름 (처음 한 번 입력)
  phone         text,                               -- [번호 공유] 버튼 (선택)
  role          text not null default 'student' check (role in ('student', 'teacher', 'owner')),
  lang          text not null default 'uz' check (lang in ('uz', 'ru', 'ko')),
  note          text,                               -- 대표 메모
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz
);

-- ───────── 반 ─────────
create table if not exists classes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                        -- 예: TOPIK 3급 완성반 (1기)
  level       text,                                 -- 예: 2급→3급
  term        text,                                 -- 기수 (1기, 2기 …)
  days        int[] not null default '{}',          -- 수업 요일 (1=월 … 7=일)
  start_time  time,                                 -- 수업 시작 (아래 tz 기준)
  minutes     int not null default 90,
  tz          text not null default 'Asia/Tashkent',-- 학생 기준 시간대
  starts_on   date,                                 -- 개강일
  ends_on     date,                                 -- 종강일
  capacity    int not null default 15,
  fee         numeric,                              -- 수강료
  fee_note    text,                                 -- 예: 4주 · 원화 / 달러
  zoom_url    text,                                 -- Zoom 회의 링크 (학생에겐 입장 버튼으로만)
  teacher_tg  bigint references people(tg_id),
  status      text not null default 'open' check (status in ('open', 'running', 'closed')),
  created_at  timestamptz not null default now()
);

-- ───────── 수강 신청 (학생 × 반) ─────────
create table if not exists enrollments (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references classes(id) on delete restrict,
  tg_id         bigint not null references people(tg_id),
  status        text not null default 'applied' check (status in ('applied', 'proof', 'active', 'dropped')),
                -- applied 신청만 · proof 입금 사진 올림 · active 입금 확인(수업 들어갈 수 있음) · dropped 그만둠
  proof_path    text,                               -- 입금 사진 (저장소 'proofs', 비공개)
  proof_at      timestamptz,
  paid_amount   numeric,
  paid_note     text,                               -- 예: 국내 이체 · 해외송금 · 가족이 대신 냄
  confirmed_at  timestamptz,
  confirmed_by  bigint,
  created_at    timestamptz not null default now(),
  unique (class_id, tg_id)
);
create index if not exists enrollments_tg_idx on enrollments (tg_id);

-- ───────── 출석 ([수업 들어가기]를 누른 기록) ─────────
create table if not exists attendance (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references classes(id) on delete cascade,
  tg_id       bigint not null references people(tg_id),
  lesson_date date not null,                        -- 반 시간대 기준 날짜
  first_at    timestamptz not null default now(),   -- 처음 누른 시각
  last_at     timestamptz not null default now(),   -- 마지막으로 누른 시각 (다시 들어온 경우)
  joins       int not null default 1,
  state       text not null default 'present' check (state in ('present', 'late', 'outside')),
                -- present 출석 · late 지각(시작 10분 뒤) · outside 수업 요일·시간이 아닐 때
  unique (class_id, tg_id, lesson_date)
);

-- ───────── 기록 (누가 · 언제 · 무엇을) — 고치거나 지우지 않음 ─────────
create table if not exists events (
  id        bigint generated always as identity primary key,
  at        timestamptz not null default now(),
  actor_tg  bigint,
  kind      text not null,                          -- login · profile · class · apply · proof · confirm · drop · join
  target    text,
  detail    text
);

alter table people      enable row level security;
alter table classes     enable row level security;
alter table enrollments enable row level security;
alter table attendance  enable row level security;
alter table events      enable row level security;
-- (정책 없음 = anon·authenticated 키로는 0건. 서버의 service_role만 읽고 씀)

-- events는 서버도 고치거나 지우지 못하게
create or replace function events_readonly() returns trigger language plpgsql as $$
begin raise exception 'events는 고치거나 지울 수 없어요'; end $$;
drop trigger if exists t_events_readonly on events;
create trigger t_events_readonly before update or delete on events for each row execute function events_readonly();

-- 입금 사진 저장소 (비공개 — 대표 화면에서 10분짜리 링크로만 봄)
insert into storage.buckets (id, name, public) values ('proofs', 'proofs', false)
on conflict (id) do nothing;
