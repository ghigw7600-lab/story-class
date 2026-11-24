-- 재미 콘텐츠 (2026-11-24, Claude 작성) — 0009_fun.sql 실행 뒤 한 번 실행
-- 일요일 14시 14개(K-pop 노래 제목 속 표현·드라마 표현·실제 한국어·속담) · 일요일 20시 9개(밸런스 게임·메뉴판 읽기)
-- 가사는 넣지 않음(제목·일반 표현만). MV 버튼 = 유튜브 검색 링크. 우즈벡어 현지인 확인 권장.

insert into daily_cards (kind, tag, expr_ko, meaning_uz, body_uz, examples, url, sort) values
('fun', 'kpop', '봄날', 'bahor kuni', 'BTS’ning mashhur qo‘shig‘i nomi — “봄날”.

🌸 봄 = bahor, 날 = kun → 봄날 = bahor kuni
Shu usulda boshqa so‘zlar ham yasaladi:
• 좋은 날 — yaxshi kun
• 생일날 — tug‘ilgan kun
• 다음 날 — ertasi kun', '[{"ko": "드디어 봄날이 왔어요.", "uz": "Nihoyat bahor kunlari keldi."}, {"ko": "시험 다음 날 푹 쉬었어요.", "uz": "Imtihonning ertasi kuni yaxshilab dam oldim."}]'::jsonb, 'https://www.youtube.com/results?search_query=BTS%20%EB%B4%84%EB%82%A0%20Spring%20Day%20official%20MV', 100),
('fun', 'drama', '밥 먹었어?', 'Ovqatlandingmi? (= Qalaysan?)', 'Dramalarda juda ko‘p eshitasiz. Koreyslar uchun bu shunchaki savol emas — g‘amxo‘rlik va salomlashish.

💡 Javob: 응, 먹었어! / 아직 안 먹었어.
💡 Kattalarga: 식사하셨어요?', '[{"ko": "엄마: 밥 먹었어? 나: 응, 먹었어!", "uz": "Onam: Ovqatlandingmi? Men: Ha, yedim!"}, {"ko": "선생님, 식사하셨어요?", "uz": "Ustoz, ovqatlandingizmi?"}]'::jsonb, null, 101),
('fun', 'real', '안녕하십니까 → 안녕! / 안녕하세요', 'Salomlashish: darslik va hayot', '📘 Darslikda: 안녕하십니까 — juda rasmiy (yangiliklar, harbiy, nutq).
🗣 Hayotda:
• 안녕하세요 — notanish, kattalarga (eng ko‘p ishlatiladi)
• 안녕! — do‘stlarga, yoshi kichiklarga
• 안녕히 가세요 / 안녕히 계세요 — xayrlashganda

⚠️ Do‘stingizga “안녕하십니까” desangiz, kulib yuboradi 😄', '[]'::jsonb, null, 102),
('fun', 'proverb', '금강산도 식후경', 'Avval taom, keyin kalom', 'So‘zma-so‘z: “Kimgangsan (eng go‘zal tog‘) ham ovqatdan keyin tomosha qilinadi”.

🇺🇿 O‘zbekchada: “Avval taom, keyin kalom”.
Qorin och bo‘lsa, hech narsa qiziq emas, degan ma’no 😋', '[{"ko": "배고파요. 금강산도 식후경이니까 먼저 밥 먹어요!", "uz": "Qornim och. Avval taom, keyin kalom — oldin ovqatlanaylik!"}]'::jsonb, null, 103),
('fun', 'kpop', '마지막처럼', 'oxirgisidek', 'BLACKPINK qo‘shig‘i nomi — “마지막처럼”.

마지막 = oxirgi, -처럼 = …dek, …kabi
So‘z oxiriga -처럼 qo‘shsangiz, o‘xshatish bo‘ladi:
• 꽃처럼 — guldek
• 친구처럼 — do‘stdek
• 한국 사람처럼 — koreyslardek', '[{"ko": "한국 사람처럼 말하고 싶어요.", "uz": "Koreyslardek gapirgim keladi."}, {"ko": "오늘이 마지막처럼 열심히 공부해요.", "uz": "Bugun oxirgi kundek astoydil o‘qiymiz."}]'::jsonb, 'https://www.youtube.com/results?search_query=BLACKPINK%20%EB%A7%88%EC%A7%80%EB%A7%89%EC%B2%98%EB%9F%BC%20AS%20IF%20IT%27S%20YOUR%20LAST%20official%20MV', 104),
('fun', 'drama', '대박!', 'Zo‘r! Voy-bo‘!', 'Dramalarda hayratlanganda eng ko‘p aytiladigan so‘z.

😲 Yaxshi narsa: 대박! 합격했어? — Zo‘r! O‘tdingmi?
😱 Ba’zan yomon narsaga ham: 대박… 지갑을 잃어버렸어.
🎉 Tilak: 대박 나세요! — Ishlaringiz yurishib ketsin! (do‘kon ochganlarga)

⚠️ Rasmiy vaziyatda ishlatmang — bu og‘zaki so‘z.', '[]'::jsonb, null, 105),
('fun', 'kpop', '작은 것들을 위한 시', 'kichik narsalar uchun she’r', 'BTS qo‘shig‘ining koreyscha nomi (Boy With Luv).

작은 = kichik, 것들 = narsalar, 시 = she’r
✨ -을/를 위한 = …uchun (mo‘ljallangan)
TOPIK’da ko‘p chiqadigan grammatika!', '[{"ko": "유학생을 위한 장학금이 있어요.", "uz": "Chet ellik talabalar uchun grant bor."}, {"ko": "가족을 위한 선물을 샀어요.", "uz": "Oilam uchun sovg‘a oldim."}]'::jsonb, 'https://www.youtube.com/results?search_query=BTS%20%EC%9E%91%EC%9D%80%20%EA%B2%83%EB%93%A4%EC%9D%84%20%EC%9C%84%ED%95%9C%20%EC%8B%9C%20Boy%20With%20Luv%20official%20MV', 106),
('fun', 'real', 'ㅋㅋ · ㅎㅎ · ㅠㅠ', 'Koreyscha chat tili', 'Koreyslar yozishmada shunday yozadi:

😂 ㅋㅋㅋ — kulgi (“kkk”), qancha ko‘p bo‘lsa, shuncha kulgili
🙂 ㅎㅎ — yengil kulgi, iliq kayfiyat
😢 ㅠㅠ / ㅜㅜ — yig‘lash, xafalik (ko‘z yoshlari)
👌 ㅇㅇ — ha (응응)
🙏 ㄱㅅ — rahmat (감사)

Endi koreys do‘stingiz bilan chatda tushunmay qolmaysiz 😉', '[]'::jsonb, null, 107),
('fun', 'drama', '괜찮아요', 'Hammasi joyida / Kerak emas', 'Bitta so‘z — bir nechta ma’no:

1️⃣ Hammasi joyida: 괜찮아요? — 네, 괜찮아요.
2️⃣ Yo‘q, rahmat (rad etish): sotuvchi “봉투 필요하세요?” desa → 괜찮아요 = kerak emas
3️⃣ Yomon emas: 이 옷 어때요? — 괜찮아요!

💡 Ma’noni ohang va vaziyatdan tushunasiz.', '[]'::jsonb, null, 108),
('fun', 'kpop', '피 땀 눈물', 'qon, ter, ko‘z yosh', 'BTS qo‘shig‘i nomi — uchta so‘z, uchtasi ham TOPIK’da kerak:

🩸 피 — qon
💧 땀 — ter → 땀을 흘리다 (terlamoq)
😢 눈물 — ko‘z yosh → 눈물이 나다 (ko‘zdan yosh chiqmoq)', '[{"ko": "운동을 해서 땀을 많이 흘렸어요.", "uz": "Sport qilib, ko‘p terladim."}, {"ko": "영화가 슬퍼서 눈물이 났어요.", "uz": "Kino g‘amgin bo‘lib, ko‘zimdan yosh chiqdi."}]'::jsonb, 'https://www.youtube.com/results?search_query=BTS%20%ED%94%BC%20%EB%95%80%20%EB%88%88%EB%AC%BC%20Blood%20Sweat%20%26%20Tears%20official%20MV', 109),
('fun', 'proverb', '원숭이도 나무에서 떨어진다', 'To‘rt oyoqli ot ham qoqiladi', 'So‘zma-so‘z: “Maymun ham daraxtdan yiqiladi”.

🇺🇿 O‘zbekchada: “To‘rt oyoqli ot ham qoqiladi”.
Eng usta odam ham xato qiladi — xato qilsangiz, xafa bo‘lmang!', '[{"ko": "선생님도 실수했어요? 원숭이도 나무에서 떨어지네요.", "uz": "Ustoz ham xato qildimi? To‘rt oyoqli ot ham qoqiladi-da."}]'::jsonb, null, 110),
('fun', 'drama', '오빠 · 언니 · 형 · 누나', 'aka va opa — kim kimga aytadi?', 'Dramalarda eng ko‘p eshitiladigan so‘zlar, lekin kim aytishiga qarab o‘zgaradi:

👧 Qiz aytadi: 오빠 (aka) · 언니 (opa)
👦 Yigit aytadi: 형 (aka) · 누나 (opa)

💡 Faqat qarindoshlarga emas — yoshi katta do‘st, hamkasbga ham aytiladi.', '[]'::jsonb, null, 111),
('fun', 'kpop', '불장난', 'olov bilan o‘ynash', 'BLACKPINK qo‘shig‘i nomi — “불장난”.

🔥 불 = olov, 장난 = o‘yin, hazil
💡 Ko‘chma ma’no: xavfli ish bilan o‘ynashish

Bonus: 장난 so‘zi bilan
• 장난치다 — hazillashmoq, sho‘xlik qilmoq
• 장난 아니다 — jiddiy, zo‘r (og‘zaki: 추위가 장난 아니에요 — sovuq juda qattiq)', '[{"ko": "동생이 장난을 많이 쳐요.", "uz": "Ukam juda sho‘x."}, {"ko": "서울 겨울은 장난 아니에요.", "uz": "Seulning qishi hazil emas."}]'::jsonb, 'https://www.youtube.com/results?search_query=BLACKPINK%20%EB%B6%88%EC%9E%A5%EB%82%9C%20PLAYING%20WITH%20FIRE%20official%20MV', 112),
('fun', 'real', '치맥 · 알바 · 셀카 · 남친', 'Qisqartma so‘zlar', 'Koreyslar uzun so‘zlarni qisqartirishni yaxshi ko‘radi:

🍗🍺 치맥 = 치킨 + 맥주
💼 알바 = 아르바이트 (qo‘shimcha ish)
🤳 셀카 = selfi
👫 남친 / 여친 = 남자 친구 / 여자 친구
🎂 생파 = 생일 파티

Darslikda yo‘q, lekin hayotda har kuni eshitasiz!', '[]'::jsonb, null, 113);

insert into daily_cards (kind, tag, question, options, body_ko, sort) values
('fun', 'balance', 'Koreyada bir kun: qaysi birini tanlaysiz?', array['🌶 떡볶이','🍙 김밥'], null, 200),
('fun', 'food', '분식집', null, '김밥 | 3,500원
떡볶이 | 4,500원
라면 | 4,000원
순대 | 5,000원
어묵 | 1,500원', 201),
('fun', 'balance', 'Koreyada qaysi shaharda yashardingiz?', array['🏙 서울 (Seul)','🌊 부산 (Pusan)'], null, 202),
('fun', 'food', '카페', null, '아메리카노 | 2,000원
카페라테 | 2,500원
녹차라테 | 3,000원
딸기 스무디 | 4,500원
치즈케이크 | 5,500원', 203),
('fun', 'balance', 'Koreys tilini qanday o‘rganish qiziqroq?', array['🎬 Drama bilan','🎵 K-pop bilan'], null, 204),
('fun', 'food', '편의점', null, '삼각김밥 | 1,500원
컵라면 | 1,300원
바나나우유 | 1,700원
도시락 | 4,900원
생수 | 900원', 205),
('fun', 'balance', 'Qaysi vaqtda o‘qish samaraliroq?', array['🌅 Ertalab (아침형)','🌙 Kechasi (저녁형)'], null, 206),
('fun', 'food', '한식당', null, '비빔밥 | 9,000원
김치찌개 | 8,500원
된장찌개 | 8,000원
불고기 정식 | 12,000원
냉면 | 9,500원', 207),
('fun', 'balance', 'Koreyaga qaysi faslda bormoqchisiz?', array['🌸 Bahor (벚꽃)','❄️ Qish (눈)'], null, 208);
