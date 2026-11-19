-- 0003 · 채널 소식 (자동 수집 → Claude 요약 초안 → 대표 확인 → 게시)
-- 대표가 Supabase → SQL Editor 에 붙여 넣고 [Run] 한 번.

-- 소식을 가져올 곳 (RSS 주소). 관리 화면 [📰 소식]에서 더하거나 끌 수 있음.
create table if not exists news_sources (
  id          bigint generated always as identity primary key,
  name        text not null,
  url         text not null unique,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- 가져온 글 하나하나
create table if not exists news_items (
  id           bigint generated always as identity primary key,
  source_id    bigint references news_sources(id) on delete set null,
  url          text not null unique,          -- 원문 링크 (같은 글 두 번 안 가져오게)
  title        text,                           -- 원문 제목
  snippet      text,                           -- 원문 요약/본문 일부
  source_name  text,                           -- 언론사·기관 이름
  published_at timestamptz,
  status       text not null default 'draft'
               check (status in ('draft', 'approved', 'posted', 'rejected', 'ignored')),
               -- draft 확인 대기 · approved 승인(다음 게시 시간에 올림) · posted 올림 · rejected 버림 · ignored 관련 없음(자동)
  kind         text,                           -- topik · visa · study · culture
  cta          text not null default 'class' check (cta in ('class', 'consult')),
               -- class = STORY Korean 수업 봇 버튼 · consult = STORY CONSULTING 상담 봇 버튼
  title_ko     text,                           -- 대표 확인용 한국어 요약
  summary_ko   text,
  title_uz     text,                           -- 채널에 올릴 우즈벡어
  body_uz      text,
  posted_at    timestamptz,
  message_id   bigint,
  decided_by   bigint,
  created_at   timestamptz not null default now()
);
create index if not exists news_items_status on news_items (status, created_at);

alter table news_sources enable row level security;
alter table news_items   enable row level security;
grant all on news_sources, news_items to service_role;
grant all on all sequences in schema public to service_role;
revoke all on news_sources, news_items from anon, authenticated;

-- 처음 넣어 두는 곳: 구글 뉴스 검색 RSS (키워드별). 필요 없으면 관리 화면에서 끄기.
insert into news_sources (name, url) values
('뉴스: TOPIK 한국어능력시험', 'https://news.google.com/rss/search?q=%ED%95%9C%EA%B5%AD%EC%96%B4%EB%8A%A5%EB%A0%A5%EC%8B%9C%ED%97%98+OR+TOPIK+when:7d&hl=ko&gl=KR&ceid=KR:ko'),
('뉴스: 외국인 유학생 비자·정책', 'https://news.google.com/rss/search?q=%EC%99%B8%EA%B5%AD%EC%9D%B8+%EC%9C%A0%ED%95%99%EC%83%9D+%EB%B9%84%EC%9E%90+OR+%EC%9C%A0%ED%95%99%EC%83%9D+%EC%A0%95%EC%B1%85+when:7d&hl=ko&gl=KR&ceid=KR:ko'),
('뉴스: 우즈베키스탄 유학생', 'https://news.google.com/rss/search?q=%EC%9A%B0%EC%A6%88%EB%B2%A0%ED%82%A4%EC%8A%A4%ED%83%84+%EC%9C%A0%ED%95%99%EC%83%9D+when:7d&hl=ko&gl=KR&ceid=KR:ko'),
('뉴스: 정부초청장학금 GKS', 'https://news.google.com/rss/search?q=%EC%A0%95%EB%B6%80%EC%B4%88%EC%B2%AD%EC%9E%A5%ED%95%99%EC%83%9D+OR+GKS+%EC%9E%A5%ED%95%99%EA%B8%88+when:7d&hl=ko&gl=KR&ceid=KR:ko')
on conflict (url) do nothing;
