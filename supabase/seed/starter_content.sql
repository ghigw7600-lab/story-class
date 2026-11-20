-- 아침 카드·투표·퀴즈 시작 창고 (2026-11-20, Claude가 직접 작성 — API 비용 없음)
-- 0002·0004 실행 뒤 SQL Editor에서 한 번 실행. 표현 카드 30장·참여 투표 8개는 '초안'으로 들어가요 → 관리 화면 [🌅 카드]에서 확인 후 승인(모두 승인 버튼 있음).
-- 퀴즈 25개는 [📢 채널] 창고에 바로 '대기'로 들어가요 (자체 연습문제 — 기출 아님). 우즈벡어는 현지인 확인 권장.

insert into daily_cards (kind, expr_ko, meaning_uz, meaning_ko, note_uz, examples, level, sort) values
('expression', '발이 넓다', 'Tanish-bilishi ko‘p', '아는 사람이 많다', 'Ko‘p odamni taniydigan, aloqasi keng odam haqida aytiladi.', '[{"ko": "민수 씨는 발이 넓어서 친구가 많아요.", "uz": "Minsuning tanishlari ko‘p, do‘stlari ham ko‘p."}, {"ko": "그 선배는 학교에서 발이 넓어요.", "uz": "U yuqori kursdagi talaba universitetda ko‘pchilikni taniydi."}]'::jsonb, 'TOPIK II', 1),
('expression', '잘 먹겠습니다', 'Ovqatdan oldin rahmat aytish', '식사 전에 하는 인사', 'Ovqatlanishdan oldin aytiladi. Ovqatdan keyin esa — 잘 먹었습니다.', '[{"ko": "할머니, 잘 먹겠습니다!", "uz": "Buvijon, rahmat, maza qilib yeyman!"}, {"ko": "정말 맛있게 잘 먹었습니다.", "uz": "Juda mazali bo‘ldi, rahmat."}]'::jsonb, 'TOPIK I', 2),
('expression', '눈코 뜰 새 없다', 'Boshini qashishga vaqti yo‘q', '매우 바쁘다', 'Juda-juda band bo‘lganda ishlatiladi.', '[{"ko": "시험 기간이라 눈코 뜰 새 없어요.", "uz": "Imtihon payti, boshimni qashishga vaqtim yo‘q."}, {"ko": "요즘 일 때문에 눈코 뜰 새 없이 바빠요.", "uz": "Hozir ish tufayli juda bandman."}]'::jsonb, 'TOPIK II', 3),
('expression', '얼마예요?', 'Necha pul?', '가격을 물을 때', 'Do‘kon va bozorda narx so‘raganda aytiladi.', '[{"ko": "이 사과 얼마예요?", "uz": "Bu olma necha pul?"}, {"ko": "전부 얼마예요?", "uz": "Hammasi necha pul?"}]'::jsonb, 'TOPIK I', 4),
('expression', '귀가 얇다', 'Gapga tez ishonadigan', '남의 말을 쉽게 믿다', 'Boshqalarning gapiga tez ishonib, fikrini tez o‘zgartiradigan odam haqida.', '[{"ko": "저는 귀가 얇아서 광고를 보면 바로 사요.", "uz": "Men gapga tez ishonaman, reklamani ko‘rsam darrov sotib olaman."}, {"ko": "귀가 얇은 사람은 조심해야 해요.", "uz": "Gapga tez ishonadigan odam ehtiyot bo‘lishi kerak."}]'::jsonb, 'TOPIK II', 5),
('expression', '수고하셨습니다', 'Rahmat, charchamang', '일을 마친 사람에게 하는 인사', 'Ish yoki darsdan keyin xayrlashganda aytiladi.', '[{"ko": "오늘도 수고하셨습니다.", "uz": "Bugun ham rahmat, charchamang."}, {"ko": "선생님, 수고하셨습니다!", "uz": "Ustoz, rahmat, charchamang!"}]'::jsonb, 'TOPIK I', 6),
('expression', '손이 크다', 'Qo‘li ochiq, ko‘p qiladi', '물건이나 음식을 넉넉하게 쓰다', 'Ovqatni ko‘p qiladigan yoki narsani ayamaydigan saxiy odam haqida.', '[{"ko": "어머니는 손이 커서 음식을 항상 많이 하세요.", "uz": "Onam qo‘li ochiq, ovqatni har doim ko‘p qiladilar."}, {"ko": "사장님이 손이 커서 선물을 많이 주셨어요.", "uz": "Xo‘jayin saxiy, ko‘p sovg‘a berdilar."}]'::jsonb, 'TOPIK II', 7),
('expression', '봉투 필요하세요?', 'Paket kerakmi?', '편의점이나 마트에서 자주 듣는 말', 'Do‘konda kassir so‘raydi. Kerak bo‘lsa: 네, 주세요. Kerak bo‘lmasa: 아니요, 괜찮아요.', '[{"ko": "봉투 필요하세요? — 아니요, 괜찮아요.", "uz": "Paket kerakmi? — Yo‘q, kerakmas."}, {"ko": "봉투 하나 주세요.", "uz": "Bitta paket bering."}]'::jsonb, 'TOPIK I', 8),
('expression', '입이 무겁다', 'Sir saqlay oladi', '비밀을 잘 지키다', 'Sirni hech kimga aytmaydigan, ishonchli odam haqida.', '[{"ko": "제 친구는 입이 무거워서 믿을 수 있어요.", "uz": "Do‘stim sir saqlaydi, unga ishonsa bo‘ladi."}, {"ko": "이 이야기는 입이 무거운 사람에게만 하세요.", "uz": "Bu gapni faqat sir saqlaydigan odamga ayting."}]'::jsonb, 'TOPIK II', 9),
('expression', '다시 한번 말씀해 주세요', 'Yana bir marta ayting', '잘 못 들었을 때 하는 말', 'Gapni yaxshi eshitmasangiz yoki tushunmasangiz, muloyim so‘rash.', '[{"ko": "죄송하지만 다시 한번 말씀해 주세요.", "uz": "Kechirasiz, yana bir marta ayting."}, {"ko": "천천히 다시 한번 말씀해 주세요.", "uz": "Sekinroq, yana bir bor ayting."}]'::jsonb, 'TOPIK I', 10),
('expression', '마음먹다', 'Qaror qilmoq', '무엇을 하기로 결심하다', 'Biror ishni qilishga qat’iy qaror qilganda ishlatiladi.', '[{"ko": "올해 TOPIK 4급을 받기로 마음먹었어요.", "uz": "Bu yil TOPIK 4-darajani olishga qaror qildim."}, {"ko": "마음먹으면 뭐든지 할 수 있어요.", "uz": "Qaror qilsangiz, hamma narsani qila olasiz."}]'::jsonb, 'TOPIK II', 11),
('expression', '어떻게 가요?', 'Qanday boraman?', '길을 물을 때', 'Yo‘l so‘raganda aytiladi.', '[{"ko": "서울역에 어떻게 가요?", "uz": "Seul vokzaliga qanday boraman?"}, {"ko": "학교까지 버스로 어떻게 가요?", "uz": "Universitetgacha avtobusda qanday boriladi?"}]'::jsonb, 'TOPIK I', 12),
('expression', '바가지를 쓰다', 'Aldanib qimmatga olmoq', '실제보다 비싸게 돈을 내다', 'Biror narsani asl narxidan ancha qimmatga sotib olganda aytiladi.', '[{"ko": "관광지에서 바가지를 썼어요.", "uz": "Turistik joyda aldanib, qimmatga oldim."}, {"ko": "바가지를 쓰지 않으려면 가격을 먼저 물어보세요.", "uz": "Aldanmaslik uchun avval narxini so‘rang."}]'::jsonb, 'TOPIK II', 13),
('expression', '괜찮아요', 'Hechqisi yo‘q / Kerakmas', '문제없다, 또는 정중한 거절', 'Ham ‘hechqisi yo‘q’, ham muloyim ‘kerak emas’ ma’nosida ishlatiladi.', '[{"ko": "늦어서 죄송해요. — 괜찮아요.", "uz": "Kechikkanim uchun uzr. — Hechqisi yo‘q."}, {"ko": "커피 드릴까요? — 아니요, 괜찮아요.", "uz": "Qahva beraymi? — Yo‘q, rahmat."}]'::jsonb, 'TOPIK I', 14),
('expression', '그림의 떡', 'Ko‘z ko‘radi, qo‘l yetmaydi', '갖거나 할 수 없는 것', 'Juda xohlasangiz ham, qo‘lga kiritib bo‘lmaydigan narsa haqida.', '[{"ko": "돈이 없으니 저 차는 그림의 떡이에요.", "uz": "Pulim yo‘q, u mashina men uchun faqat orzu."}, {"ko": "다이어트 중이라 케이크는 그림의 떡이에요.", "uz": "Parhezdaman, tort men uchun ko‘z ko‘radi-yu qo‘l yetmaydi."}]'::jsonb, 'TOPIK II', 15),
('expression', '계산해 주세요', 'Hisobni bering', '식당에서 돈을 낼 때', 'Kafe yoki restoranda to‘lov qilmoqchi bo‘lganda aytiladi.', '[{"ko": "여기요, 계산해 주세요.", "uz": "Kechirasiz, hisobni bering."}, {"ko": "따로 계산해 주세요.", "uz": "Alohida-alohida hisoblang."}]'::jsonb, 'TOPIK I', 16),
('expression', '누워서 떡 먹기', 'Juda oson ish', '아주 쉬운 일', 'Hech qiyinchiliksiz qilinadigan ish haqida aytiladi.', '[{"ko": "이 문제는 누워서 떡 먹기예요.", "uz": "Bu savol juda oson."}, {"ko": "한국어 인사는 이제 누워서 떡 먹기예요.", "uz": "Koreyscha salomlashish endi men uchun juda oson."}]'::jsonb, 'TOPIK II', 17),
('expression', '파이팅!', 'Omad! Olg‘a!', '응원할 때 하는 말', 'Kimnidir ruhlantirganda aytiladi. Ko‘pincha ‘화이팅’ deb ham yoziladi.', '[{"ko": "내일 시험 파이팅!", "uz": "Ertangi imtihonga omad!"}, {"ko": "우리 모두 파이팅!", "uz": "Hammamizga omad!"}]'::jsonb, 'TOPIK I', 18),
('expression', '하늘의 별 따기', 'Osmondan yulduz uzishdek qiyin', '아주 어려운 일', 'Amalga oshirish juda-juda qiyin bo‘lgan ish haqida.', '[{"ko": "서울에서 싼 집 찾기는 하늘의 별 따기예요.", "uz": "Seulda arzon uy topish osmondan yulduz uzishdek qiyin."}, {"ko": "그 회사에 들어가는 건 하늘의 별 따기예요.", "uz": "U kompaniyaga ishga kirish juda qiyin."}]'::jsonb, 'TOPIK II', 19),
('expression', '처음 뵙겠습니다', 'Tanishganimdan xursandman', '처음 만났을 때 하는 인사', 'Birinchi marta uchrashganda hurmat bilan aytiladi.', '[{"ko": "처음 뵙겠습니다. 저는 알리셰르입니다.", "uz": "Tanishganimdan xursandman. Men Alisherman."}, {"ko": "선생님, 처음 뵙겠습니다.", "uz": "Ustoz, tanishganimdan xursandman."}]'::jsonb, 'TOPIK I', 20),
('expression', '귀를 기울이다', 'Diqqat bilan tinglamoq', '주의 깊게 듣다', 'Kimningdir gapini e’tibor bilan eshitganda ishlatiladi.', '[{"ko": "학생들이 선생님 말씀에 귀를 기울였어요.", "uz": "Talabalar o‘qituvchining gapini diqqat bilan tinglashdi."}, {"ko": "다른 사람의 의견에도 귀를 기울여야 해요.", "uz": "Boshqalarning fikriga ham quloq solish kerak."}]'::jsonb, 'TOPIK II', 21),
('expression', '눈이 높다', 'Talabi baland, tanlovchi', '기준이 높다', 'Narsa yoki odam tanlashda talabi juda baland odam haqida.', '[{"ko": "제 동생은 눈이 높아서 아직 여자 친구가 없어요.", "uz": "Ukam juda tanlovchi, shuning uchun hali qiz do‘sti yo‘q."}, {"ko": "눈이 높으면 집 구하기가 어려워요.", "uz": "Talabingiz baland bo‘lsa, uy topish qiyin."}]'::jsonb, 'TOPIK II', 22),
('expression', '속이 타다', 'Ichi yonmoq, juda xavotirlanmoq', '몹시 걱정되어 마음이 답답하다', 'Biror narsani kutib, juda xavotirlanganda aytiladi.', '[{"ko": "결과 발표를 기다리느라 속이 타요.", "uz": "Natijani kutib, ichim yonib ketyapti."}, {"ko": "비자가 안 나와서 속이 타요.", "uz": "Viza chiqmayapti, juda xavotirdaman."}]'::jsonb, 'TOPIK II', 23),
('expression', '발을 끊다', 'Bormay qo‘ymoq, aloqani uzmoq', '오가거나 관계를 끊다', 'Biror joyga borishni yoki kim bilandir aloqani to‘xtatganda aytiladi.', '[{"ko": "그 가게는 너무 불친절해서 발을 끊었어요.", "uz": "U do‘kon juda qo‘pol edi, endi bormay qo‘ydim."}, {"ko": "나쁜 친구들과 발을 끊었어요.", "uz": "Yomon do‘stlar bilan aloqani uzdim."}]'::jsonb, 'TOPIK II', 24),
('expression', '시간 가는 줄 모르다', 'Vaqt o‘tganini sezmay qolmoq', '무엇에 빠져서 시간이 지나는 것을 모르다', 'Biror narsaga berilib, vaqt qanday o‘tganini bilmay qolganda.', '[{"ko": "친구와 이야기하느라 시간 가는 줄 몰랐어요.", "uz": "Do‘stim bilan gaplashib, vaqt qanday o‘tganini bilmay qoldim."}, {"ko": "드라마가 재미있어서 시간 가는 줄 몰라요.", "uz": "Serial qiziq, vaqt o‘tganini sezmayman."}]'::jsonb, 'TOPIK II', 25),
('expression', '어깨가 무겁다', 'Mas’uliyat og‘ir', '책임이 커서 부담이 되다', 'Zimmangizda katta mas’uliyat bo‘lganda aytiladi.', '[{"ko": "팀장이 되어서 어깨가 무거워요.", "uz": "Jamoa rahbari bo‘ldim, mas’uliyatim og‘ir."}, {"ko": "부모님의 기대 때문에 어깨가 무거워요.", "uz": "Ota-onamning umidi tufayli zimmamdagi yuk og‘ir."}]'::jsonb, 'TOPIK II', 26),
('expression', '진땀을 흘리다', 'Rosa qiynalmoq, terlab ketmoq', '어려운 일로 몹시 애쓰다', 'Qiyin vaziyatda juda qiynalganda aytiladi.', '[{"ko": "면접에서 대답하느라 진땀을 흘렸어요.", "uz": "Suhbatda javob berib, terlab ketdim."}, {"ko": "길을 잃어서 진땀을 흘렸어요.", "uz": "Adashib qolib, rosa qiynaldim."}]'::jsonb, 'TOPIK II', 27),
('expression', '한눈팔다', 'Chalg‘imoq', '해야 할 일에 집중하지 않고 다른 곳을 보다', 'Qilish kerak bo‘lgan ishdan chalg‘iganda ishlatiladi.', '[{"ko": "운전할 때 한눈팔면 위험해요.", "uz": "Mashina haydayotganda chalg‘ish xavfli."}, {"ko": "수업 시간에 한눈팔지 마세요.", "uz": "Darsda chalg‘imang."}]'::jsonb, 'TOPIK II', 28),
('expression', '고개를 끄덕이다', 'Bosh irg‘amoq (rozilik)', '동의한다는 뜻으로 머리를 위아래로 움직이다', 'Gapga rozi ekanini bosh irg‘ab bildirganda.', '[{"ko": "선생님 설명을 듣고 고개를 끄덕였어요.", "uz": "O‘qituvchining tushuntirishini eshitib, bosh irg‘adim."}, {"ko": "모두 제 의견에 고개를 끄덕였어요.", "uz": "Hamma mening fikrimga rozi bo‘lib bosh irg‘adi."}]'::jsonb, 'TOPIK II', 29),
('expression', '손을 놓다', 'Ishni tashlab qo‘ymoq', '하던 일을 그만두다', 'Boshlagan ishni to‘xtatib, qilmay qo‘yganda aytiladi.', '[{"ko": "피곤하다고 공부에서 손을 놓으면 안 돼요.", "uz": "Charchadim deb o‘qishni tashlab qo‘ymang."}, {"ko": "그는 사업에서 손을 놓고 쉬고 있어요.", "uz": "U biznesni tashlab, dam olyapti."}]'::jsonb, 'TOPIK II', 30);

insert into daily_cards (kind, question, options, sort) values
('poll', '🎯 Qaysi TOPIK darajasini olmoqchisiz?', array['1️⃣ TOPIK 1–2','3️⃣ TOPIK 3','4️⃣ TOPIK 4','🔥 TOPIK 5–6'], 1),
('poll', '😵 TOPIK’da eng qiyin qism qaysi?', array['🎧 듣기 (tinglash)','📖 읽기 (o‘qish)','✍️ 쓰기 (yozish)','📚 Grammatika va so‘zlar'], 2),
('poll', '✈️ Koreyaga qachon bormoqchisiz?', array['🌸 2027-yil bahor','☀️ 2027-yil kuz','📅 2028 yoki keyin','🤔 Hali bilmayman'], 3),
('poll', '🎓 Koreyada qaysi yo‘lni tanlaysiz?', array['🗣 Til kursi (D-4)','🎓 Bakalavr (D-2)','📚 Magistratura','🤔 Hali o‘ylayapman'], 4),
('poll', '📚 Koreys tilini qanday o‘rganyapsiz?', array['🏫 O‘quv markazda','💻 Onlayn kursda','📱 YouTube va Telegram','📖 O‘zim kitobdan'], 5),
('poll', '🍜 Qaysi koreys taomi sizga ko‘proq yoqadi?', array['🍗 치킨','🍜 라면','🍙 김밥','🔥 떡볶이'], 6),
('poll', '🏙 Koreyaning qaysi shahrida o‘qishni xohlaysiz?', array['🏙 Seul','🌊 Busan','🌳 Boshqa shahar','🤷 Farqi yo‘q, grant bo‘lsa bas'], 7),
('poll', '📢 Kanalda nima ko‘proq bo‘lsin?', array['📝 TOPIK testlar','💬 Kundalik iboralar','🎵 Qo‘shiq orqali o‘rganish','🇰🇷 Koreyadagi hayot'], 8);

insert into channel_posts (source, level, question, options, correct, explain_short, explain_full, sort) values
('STORY Korean 연습문제', 'TOPIK I', '( )에 알맞은 것을 고르십시오.
날씨가 ( ) 창문을 열었어요.', array['추워서','더우면','춥지만','더워서'], 3, 'Havo issiq bo‘lgani uchun derazani ochdim → 더워서 (sabab).', '창문을 연 이유는 ‘더워서’예요.
📖 -아서/어서 = sabab (…gani uchun)
📖 덥다 = issiq → 더워서', 6),
('STORY Korean 연습문제', 'TOPIK I', '무엇에 대한 내용입니까?
저는 아침에 빵을 먹어요. 저녁에는 밥을 먹어요.', array['계절','여행','음식','운동'], 2, '빵 = non, 밥 = guruch/ovqat → 음식 (taom).', '빵과 밥은 음식이에요.
📖 음식 = taom, ovqat', 7),
('STORY Korean 연습문제', 'TOPIK I', '다음 대화의 ( )에 알맞은 것을 고르십시오.
가: 지금 몇 시예요?
나: ( )', array['세 명이에요.','세 시예요.','세 개예요.','세 번이에요.'], 1, '몇 시 = soat necha? → 세 시 (soat uch).', '‘몇 시’는 시간을 물어요.
📖 시 = soat · 명 = kishi · 개 = dona · 번 = marta', 8),
('STORY Korean 연습문제', 'TOPIK I', '밑줄 친 말과 반대되는 것을 고르십시오.
이 식당은 음식이 아주 비싸요.', array['싸요','짜요','많아요','맛있어요'], 0, '비싸다 = qimmat ↔ 싸다 = arzon.', '비싸다의 반대말은 싸다예요.
📖 비싸다 = qimmat
📖 싸다 = arzon', 9),
('STORY Korean 연습문제', 'TOPIK I', '어디에 대한 내용입니까?
여기에서 우표를 사고 편지를 보내요.', array['은행','약국','서점','우체국'], 3, 'Marka sotib olib, xat jo‘natiladigan joy — 우체국 (pochta).', '우표를 사고 편지를 보내는 곳은 우체국이에요.
📖 우체국 = pochta · 은행 = bank
📖 약국 = dorixona · 서점 = kitob do‘koni', 10),
('STORY Korean 연습문제', 'TOPIK I', '( )에 알맞은 것을 고르십시오.
제 동생은 키가 ( ).', array['길어요','넓어요','커요','높아요'], 2, 'Bo‘y haqida 키가 크다 deyiladi (길다 emas).', '키는 ‘크다/작다’로 말해요.
📖 키가 커요 = bo‘yi baland', 11),
('STORY Korean 연습문제', 'TOPIK I', '다음 대화의 ( )에 알맞은 것을 고르십시오.
가: 주말에 뭐 했어요?
나: ( )', array['주말이 좋아요.','친구하고 영화를 봤어요.','영화관에 가요.','친구가 많아요.'], 1, 'Savol o‘tgan zamonda (했어요) → javob ham o‘tgan zamonda: 봤어요.', '‘뭐 했어요?’는 지난 일을 물어요.
📖 -았/었어요 = o‘tgan zamon', 12),
('STORY Korean 연습문제', 'TOPIK I', '( )에 알맞은 것을 고르십시오.
저는 학교( ) 가요.', array['에','을','이','는'], 0, 'Qayergadir bormoq: joy + 에 가요.', '가다·오다 앞의 장소에는 ‘에’를 써요.
📖 학교에 가요 = maktabga boraman', 13),
('STORY Korean 연습문제', 'TOPIK I', '( )에 알맞은 것을 고르십시오.
할머니께서 진지를 ( ).', array['먹어요','마셔요','자요','드세요'], 3, 'Kattalar uchun 먹다 o‘rniga hurmat shakli — 드시다.', '어른에게는 ‘먹다’ 대신 ‘드시다’를 써요.
📖 진지 = ovqat (hurmat)
📖 드세요 = yeydilar', 14),
('STORY Korean 연습문제', 'TOPIK I', '무엇에 대한 내용입니까?
저는 서울에 살아요. 제 동생은 부산에 살아요.', array['나이','취미','사는 곳','직업'], 2, '살아요 = yashayman → 사는 곳 (yashash joyi).', '서울, 부산은 사는 곳이에요.
📖 살다 = yashamoq', 15),
('STORY Korean 연습문제', 'TOPIK I', '( )에 알맞은 것을 고르십시오.
비가 ( ) 우산을 가져가세요.', array['와서','오니까','오지만','오고'], 1, 'Buyruq gapda (…세요) sabab uchun -(으)니까 ishlatiladi, -아서 emas.', '‘-세요’ 같은 명령문 앞에서는 ‘-아서’가 아니라 ‘-(으)니까’를 써요.
📖 비가 오니까 = yomg‘ir yog‘ayotgani uchun', 16),
('STORY Korean 연습문제', 'TOPIK I', '다음 대화의 ( )에 알맞은 것을 고르십시오.
가: 이거 누구 가방이에요?
나: ( )', array['제 가방이에요.','가방이 커요.','가방을 사요.','가방에 있어요.'], 0, '누구 = kim(ning)? → egasini aytamiz: 제 가방 (mening sumkam).', '‘누구 가방’은 주인을 물어요.
📖 제 = mening', 17),
('STORY Korean 연습문제', 'TOPIK I', '( )에 알맞은 것을 고르십시오.
어제는 금요일이었어요. 오늘은 ( )이에요.', array['목요일','일요일','월요일','토요일'], 3, 'Kecha juma bo‘lsa, bugun — shanba (토요일).', '금요일 다음 날은 토요일이에요.
📖 금요일 = juma · 토요일 = shanba · 일요일 = yakshanba', 18),
('STORY Korean 연습문제', 'TOPIK I', '( )에 알맞은 것을 고르십시오.
저는 한국어를 ( ) 싶어요.', array['배워서','배우면','배우고','배우지만'], 2, '-고 싶다 = …moqchiman. 배우고 싶어요 = o‘rganmoqchiman.', '하고 싶은 것은 ‘-고 싶다’로 말해요.
📖 배우고 싶어요 = o‘rganmoqchiman', 19),
('STORY Korean 연습문제', 'TOPIK I', '( )에 알맞은 것을 고르십시오.
저는 매일 아침 공원에서 ( ).', array['요리해요','운동해요','청소해요','숙제해요'], 1, 'Har kuni ertalab parkda — 운동해요 (sport qilaman).', '공원에서 하는 일은 운동이에요.
📖 운동하다 = sport bilan shug‘ullanmoq', 20),
('STORY Korean 연습문제', 'TOPIK II', '( )에 알맞은 것을 고르십시오.
열심히 공부한 ( ) 시험에 합격했어요.', array['덕분에','대신에','만큼','채로'], 0, '-(으)ㄴ 덕분에 = …gani sababli (yaxshi natija).', '좋은 결과의 이유는 ‘-(으)ㄴ 덕분에’로 말해요.
📖 공부한 덕분에 = o‘qiganim sababli', 21),
('STORY Korean 연습문제', 'TOPIK II', '밑줄 친 부분과 의미가 비슷한 것을 고르십시오.
늦잠을 자는 바람에 수업에 늦었어요.', array['늦잠을 자려고','늦잠을 자도','늦잠을 자다가','늦잠을 자서'], 3, '-는 바람에 = kutilmagan yomon sabab ≈ -아서/어서.', '‘-는 바람에’는 안 좋은 결과의 이유예요. ‘-아서/어서’와 비슷해요.
📖 늦잠을 자서 = uxlab qolganim uchun', 22),
('STORY Korean 연습문제', 'TOPIK II', '( )에 알맞은 것을 고르십시오.
한국에 온 지 벌써 1년이 ( ).', array['있었어요','걸렸어요','되었어요','지냈어요'], 2, '-(으)ㄴ 지 … 되다 = …ganiga … bo‘ldi.', '‘-(으)ㄴ 지 + 시간 + 되다’로 말해요.
📖 온 지 1년이 되었어요 = kelganimga 1 yil bo‘ldi', 23),
('STORY Korean 연습문제', 'TOPIK II', '( )에 알맞은 것을 고르십시오.
아무리 바빠도 아침은 ( ) 해요.', array['먹으려고','먹어야','먹다가','먹거나'], 1, '아무리 …아도 + -아야 하다 = qanchalik band bo‘lsa ham … kerak.', '‘-아야/어야 하다’ = …kerak.
📖 먹어야 해요 = yeyish kerak', 24),
('STORY Korean 연습문제', 'TOPIK II', '다음 표현의 뜻으로 알맞은 것을 고르십시오.
“눈코 뜰 새 없다”', array['매우 바쁘다','매우 졸리다','매우 아프다','매우 기쁘다'], 0, '눈코 뜰 새 없다 = boshini qashishga vaqti yo‘q, juda band.', '‘눈코 뜰 새 없다’는 아주 바쁘다는 뜻이에요.
📖 = boshini qashishga vaqti yo‘q', 25),
('STORY Korean 연습문제', 'TOPIK II', '( )에 알맞은 것을 고르십시오.
비가 올( ) 우산을 챙겼어요.', array['수록','만큼','대로','까 봐'], 3, '-(으)ㄹ까 봐 = …mi deb (xavotir bilan).', '걱정 때문에 미리 하는 일은 ‘-(으)ㄹ까 봐’로 말해요.
📖 비가 올까 봐 = yomg‘ir yog‘armikan deb', 26),
('STORY Korean 연습문제', 'TOPIK II', '( )에 알맞은 것을 고르십시오.
이 책은 읽으면 ( ) 재미있어요.', array['읽을까 봐','읽는 대로','읽을수록','읽느라고'], 2, '-(으)면 -(으)ㄹ수록 = qancha ko‘p … , shuncha …', '‘-(으)면 -(으)ㄹ수록’ = qancha ko‘p …, shuncha ko‘p.
📖 읽으면 읽을수록 = o‘qigan sari', 27),
('STORY Korean 연습문제', 'TOPIK II', '무엇에 대한 내용인지 고르십시오.
요즘 혼자 밥을 먹는 사람이 늘면서 1인분 메뉴를 파는 식당이 많아졌다.', array['식당 음식 가격의 변화','혼자 식사하는 사람이 늘면서 생긴 식당의 변화','건강한 식습관','외식 횟수의 감소'], 1, 'Yolg‘iz ovqatlanuvchilar ko‘paygani → 1 kishilik menyu ko‘paydi.', '원인(혼자 먹는 사람 증가)과 결과(1인분 메뉴 증가)를 찾으세요.
📖 1인분 = 1 kishilik porsiya', 28),
('STORY Korean 연습문제', 'TOPIK II', '( )에 알맞은 것을 고르십시오.
시험 준비를 ( ) 친구를 못 만났어요.', array['하느라고','하더니','하는 김에','하자마자'], 0, '-느라고 = … bilan band bo‘lib (yomon natija sababi).', '한 가지 일 때문에 다른 일을 못 했을 때 ‘-느라고’를 써요.
📖 준비하느라고 = tayyorlanish bilan band bo‘lib', 29),
('STORY Korean 연습문제', 'TOPIK II', '밑줄 친 부분과 의미가 비슷한 것을 고르십시오.
집에 도착하자마자 잠이 들었어요.', array['도착하기 전에','도착하려고','도착해도','도착하고 바로'], 3, '-자마자 = …ishi bilanoq, darhol.', '‘-자마자’는 앞의 일이 끝나고 바로 뒤의 일이 일어날 때 써요.
📖 도착하자마자 = yetib kelishim bilanoq', 30);
