-- 채널 시작용 연습문제 5개 (STORY Korean 자체 제작 — TOPIK 기출 아님)
-- 0002 실행 뒤, 원할 때 SQL Editor에서 한 번 실행. 우즈벡어 해설은 올리기 전에 현지인 확인 권장.
-- 실제 기출은 관리 화면 [📢 채널] → 문제 추가에서 출처(회차·번호)를 적어 넣기.

insert into channel_posts (source, level, question, options, correct, explain_short, explain_full, sort) values
('STORY Korean 연습문제', 'TOPIK I',
 '( )에 알맞은 것을 고르십시오.
저는 ( )에서 책을 빌려요.',
 array['도서관', '병원', '시장', '공항'], 0,
 '도서관 = kutubxona. Kitobni kutubxonadan olamiz.',
 '책을 빌리는 곳은 도서관이에요.
📖 도서관 = kutubxona
📖 책을 빌려요 = kitob olaman (vaqtincha)', 1),

('STORY Korean 연습문제', 'TOPIK I',
 '무엇에 대한 내용입니까?
사과가 맛있어요. 바나나도 좋아해요.',
 array['과일', '날씨', '가족', '취미'], 0,
 '사과 = olma, 바나나 = banan → 과일 = meva.',
 '사과와 바나나는 과일이에요.
📖 과일 = meva
📖 사과 = olma · 바나나 = banan', 2),

('STORY Korean 연습문제', 'TOPIK I',
 '( )에 알맞은 것을 고르십시오.
어제 친구를 ( ) 영화를 봤어요.',
 array['만나서', '만나면', '만나지만', '만나고 싶어서'], 0,
 '-아서/어서: avval biri, keyin ikkinchisi. Uchrashib, keyin kino ko''rdik.',
 '먼저 친구를 만나고, 그다음 영화를 봤어요 → -아서/어서
📖 -아서/어서 = harakatlar ketma-ketligi
📖 만나서 = uchrashib', 3),

('STORY Korean 연습문제', 'TOPIK I',
 '다음 대화의 ( )에 알맞은 것을 고르십시오.
가: 생일이 언제예요?
나: ( )',
 array['10월 5일이에요.', '서울에 살아요.', '학생이에요.', '김치를 좋아해요.'], 0,
 '언제 = qachon → javob sana bilan bo''ladi.',
 '"언제"는 시간을 물어요. 그래서 날짜로 대답해요.
📖 언제 = qachon
📖 생일 = tug''ilgan kun', 4),

('STORY Korean 연습문제', 'TOPIK I',
 '밑줄 친 말과 반대되는 것을 고르십시오.
이 가방은 아주 무거워요.',
 array['가벼워요', '비싸요', '작아요', '길어요'], 0,
 '무겁다 = og''ir ↔ 가볍다 = yengil.',
 '무겁다의 반대말은 가볍다예요.
📖 무겁다 = og''ir
📖 가볍다 = yengil', 5);
