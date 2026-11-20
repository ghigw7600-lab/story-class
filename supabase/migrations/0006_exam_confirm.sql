-- 0006 · 시험 일정에 '공식 확인' 표시 + 메모
-- 대표가 Supabase → SQL Editor 에 붙여 넣고 [Run] 한 번.
-- confirmed = false(예상)인 시험은 채널에 자동 글을 올리지 않음. 우즈벡 접수처 공지를 보고 [✔ 공식 확인함]을 누르면 그때부터 올라감.
alter table exam_events add column if not exists confirmed boolean not null default true;
alter table exam_events add column if not exists note text;
