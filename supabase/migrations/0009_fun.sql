-- 0009 · 재미 콘텐츠 (일요일 14시·20시) — 대표가 SQL Editor에서 한 번 실행
--  kind 'fun' + tag: kpop(K-pop 노래 제목 속 표현) · drama(드라마 단골 표현) · real(교과서 vs 실제) · proverb(속담 비교)
--                    balance(밸런스 게임 투표) · food(메뉴판 읽기 챌린지 그림)
alter table daily_cards drop constraint if exists daily_cards_kind_check;
alter table daily_cards add constraint daily_cards_kind_check
  check (kind in ('expression', 'poll', 'writing', 'tip', 'question', 'fun'));
alter table daily_cards add column if not exists url text;  -- kpop: 공식 MV 찾기 링크
