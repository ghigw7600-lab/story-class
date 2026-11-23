import "server-only";
import { db, logEvent } from "./db";
import { tgCall } from "./tg";
import { isOwnerId } from "./env";
import { CHANNEL } from "./channel";
import { CONSULT_BOT } from "./news";
import { EXAM_COLS, uzDate, tashkentToday, type ExamEvent } from "./exams";

// @storykorean_bot 대화 흐름 (2026-11-23) — 경쟁 채널(@KOREAN_TOPIK_CHANNEL 도서관 봇) 방식:
//  /start → 채널 구독 확인(안 했으면 [가입]·[확인] 버튼) → 아래 메뉴
//  메뉴: 자료(도서관) · 접수 도우미 · 시험 일정 · 온라인 수업 · 상담
// 말: 학생 = 우즈벡어 / 대표·한국어 사용자 = 한국어. 대표는 /uz(학생 화면 보기) · /ko(한국어로 돌아가기).
// 대표는 봇에게 파일을 보내면(캡션에 #tests 등) 도서관에 저장됨.
// 우즈벡어 문구는 현지인 확인 필요.

type L = "uz" | "ko";

export const CATS: Record<L, Record<string, string>> = {
  uz: { tests: "📝 TOPIK testlar", writing: "✍️ 쓰기 — yozish", words: "📚 So‘z va grammatika", guide: "🧭 Qo‘llanmalar" },
  ko: { tests: "📝 TOPIK 기출·모의", writing: "✍️ 쓰기", words: "📚 단어·문법", guide: "🧭 안내서" },
};
export const CAT_KO: Record<string, string> = { tests: "TOPIK 기출·모의", writing: "쓰기", words: "단어·문법", guide: "안내서" };

const KR_DATE = (d: string) => { const [, m, day] = d.split("-").map(Number); return `${m}월 ${day}일`; };

const T = {
  uz: {
    materials: "📚 Materiallar", reg: "📝 Ro‘yxatdan o‘tish yordami", schedule: "📅 TOPIK jadvali", classes: "🎓 Onlayn darslar", consult: "💬 Konsultatsiya",
    gate: "Assalomu alaykum! 🇰🇷 STORY Korean botiga xush kelibsiz.\n\nBotdan to‘liq foydalanish uchun avval kanalimizga a’zo bo‘ling, keyin [✅ Tasdiqlash] tugmasini bosing 👇",
    confirm: "✅ Tasdiqlash", subOk: "✅ Rahmat! A’zolik tasdiqlandi", subNo: "❗ Avval kanalga a’zo bo‘ling",
    hello: "Xush kelibsiz! 🎉 Kerakli bo‘limni tanlang 👇\n\n📚 Materiallar — TOPIK testlar, yozish, so‘zlar\n📝 Ro‘yxatdan o‘tish yordami — TOPIK’ga qanday yozilish\n📅 TOPIK jadvali — O‘zbekistondagi imtihonlar\n🎓 Onlayn darslar — STORY Korean guruhlari\n💬 Konsultatsiya — Koreyada o‘qish bo‘yicha",
    pick: "Kerakli bo‘limni tanlang 👇",
    catsTitle: "📚 Materiallar — bo‘limni tanlang 👇", catsEmpty: "📚 Materiallar tez orada qo‘shiladi. Kanalimizni kuzatib boring!",
    back: "⬅️ Orqaga", notFound: "Bu material topilmadi 🙁", open: "🔗 Ochish",
    regTitle: "📝 TOPIK’ga ro‘yxatdan o‘tish — 4 qadam\n\n" +
      "1️⃣ topiktashkec.uz saytida shaxsiy kabinet oching.\nFaqat belgilangan muddatda ochiladi. Har bir kishi faqat 1 ta ID ochishi mumkin.\n\n" +
      "2️⃣ Onlayn ariza kuni kabinetga kiring va darajani (TOPIK I yoki II) hamda shaharni tanlang.\n⚠️ Ariza kuni yangi kabinet ochib bo‘lmaydi. Joylar juda tez to‘ladi — oldindan tayyor turing!\n\n" +
      "3️⃣ Arizani chop eting.\n\n" +
      "4️⃣ Belgilangan muddatda Koreya Ta’lim markaziga boring: ariza va pasport nusxasi bilan to‘lovni qiling, imtihon raqamini oling. (Muddat hududga qarab farq qilishi mumkin.)",
    regAsk: "Savolingiz bormi? Bizga yozing — tez javob beramiz 👇", ask: "💬 Savol berish",
    next: "📅 Keyingi imtihon", official: "✅ rasmiy", guess: "⏳ taxminiy", regWhen: "🗓 Ro‘yxatdan o‘tish",
    regSoon: "🗓 Ro‘yxatdan o‘tish sanasi e’lon qilinishi bilan kanalda xabar beramiz.",
    schTitle: "📅 O‘zbekistonda TOPIK imtihonlari", result: "natija", schGuess: "⏳ — taxminiy sana. Rasmiy e’lon chiqishi bilan yangilaymiz.",
    schEmpty: "📅 Yaqin imtihon sanalari hali e’lon qilinmagan. Kanalimizni kuzatib boring!",
    classesText: "🎓 STORY Korean onlayn TOPIK darslari — guruhlar, jadval va ro‘yxatdan o‘tish 👇", classesBtn: "📚 Darslarni ko‘rish",
    consultText: "💬 Koreyada o‘qish (til kursi D-4, bakalavr D-2, magistratura) bo‘yicha bepul konsultatsiya — STORY CONSULTING 👇",
    date: uzDate,
  },
  ko: {
    materials: "📚 자료실", reg: "📝 접수 도우미", schedule: "📅 시험 일정", classes: "🎓 온라인 수업", consult: "💬 유학 상담",
    gate: "안녕하세요! 🇰🇷 STORY Korean 봇이에요.\n\n봇을 쓰려면 먼저 채널에 가입한 뒤 [✅ 확인] 버튼을 눌러 주세요 👇",
    confirm: "✅ 확인", subOk: "✅ 채널 가입이 확인됐어요", subNo: "❗ 먼저 채널에 가입해 주세요",
    hello: "환영해요! 🎉 메뉴를 골라 주세요 👇\n\n📚 자료실 — TOPIK 기출·쓰기·단어 자료\n📝 접수 도우미 — TOPIK 접수 방법 4단계\n📅 시험 일정 — 우즈벡 시험 날짜\n🎓 온라인 수업 — STORY Korean 반\n💬 유학 상담 — STORY CONSULTING 연결",
    pick: "메뉴를 골라 주세요 👇",
    catsTitle: "📚 자료실 — 분류를 골라 주세요 👇", catsEmpty: "📚 아직 자료가 없어요. 봇에게 파일을 보내면서 캡션에 #tests 같은 분류를 쓰면 저장돼요.",
    back: "⬅️ 뒤로", notFound: "자료를 찾지 못했어요 🙁", open: "🔗 열기",
    regTitle: "📝 TOPIK 접수 방법 — 4단계 (학생에게는 우즈벡어로 보여요)\n\n" +
      "1️⃣ topiktashkec.uz에서 개인 캐비닛(계정)을 만들어요.\n정해진 기간에만 열려요. 한 사람당 ID 1개만 가능해요.\n\n" +
      "2️⃣ 온라인 신청일에 캐비닛에 들어가 급수(TOPIK I·II)와 도시를 골라요.\n⚠️ 신청일에는 새 캐비닛을 만들 수 없어요. 자리가 아주 빨리 차니 미리 준비해요!\n\n" +
      "3️⃣ 신청서를 출력해요.\n\n" +
      "4️⃣ 정해진 기간에 한국교육원에 가서 신청서·여권 사본으로 응시료를 내고 수험번호를 받아요. (기간은 지역마다 다를 수 있어요.)",
    regAsk: "궁금한 점은 상담으로 물어보세요 👇", ask: "💬 질문하기",
    next: "📅 다음 시험", official: "✅ 공식", guess: "⏳ 예상", regWhen: "🗓 접수",
    regSoon: "🗓 접수 날짜는 공지가 나오면 채널에 알려요.",
    schTitle: "📅 우즈베키스탄 TOPIK 시험 일정", result: "성적 발표", schGuess: "⏳ — 예상 날짜예요. 공식 공지가 나오면 바뀌어요.",
    schEmpty: "📅 가까운 시험 날짜가 아직 없어요. 관리 화면 [📅 시험]에서 넣어 주세요.",
    classesText: "🎓 STORY Korean 온라인 TOPIK 수업 — 반·시간표·신청 👇", classesBtn: "📚 수업 보기",
    consultText: "💬 한국 유학(어학연수 D-4·학사 D-2·석사) 무료 상담 — STORY CONSULTING 👇",
    date: KR_DATE,
  },
};
type Tx = typeof T.uz;

const channelUrl = () => `https://t.me/${CHANNEL.replace(/^@/, "")}`;
const menuKeyboard = (t: Tx) => ({
  keyboard: [[{ text: t.materials }, { text: t.reg }], [{ text: t.schedule }, { text: t.classes }], [{ text: t.consult }]],
  resize_keyboard: true, is_persistent: true,
});
// 메뉴 버튼은 어느 말로 눌러도 알아듣게
const isBtn = (text: string, key: "materials" | "reg" | "schedule" | "classes" | "consult") => text === T.uz[key] || text === T.ko[key];

type From = { id: number; first_name?: string; username?: string; language_code?: string };
type FileRef = { file_id: string; file_name?: string; title?: string };
export type Msg = {
  chat: { id: number; type: string }; from?: From; text?: string; caption?: string;
  document?: FileRef; audio?: FileRef; video?: FileRef; photo?: FileRef[];
};
export type Cb = { id: string; from: From; data?: string; message?: { chat: { id: number } } };

// ───────── 어떤 말로 보여 줄지 ─────────
// 대표: 기본 한국어, /uz 하면 학생 화면(우즈벡어) — bot_users.lang 에 'view:uz' 로 기억
async function langOf(from: From): Promise<L> {
  if (isOwnerId(from.id)) {
    const { data } = await db().from("bot_users").select("lang").eq("tg_id", from.id).maybeSingle();
    return data?.lang === "view:uz" ? "uz" : "ko";
  }
  return from.language_code?.startsWith("ko") ? "ko" : "uz";
}

// ───────── 구독 확인 ─────────
async function isSubscribed(uid: number): Promise<boolean> {
  const r = (await tgCall("getChatMember", { chat_id: CHANNEL, user_id: uid })) as { ok: boolean; result?: { status: string; is_member?: boolean } };
  if (!r.ok || !r.result) return true; // 봇이 채널을 못 읽으면(권한 문제) 막지 않음
  const st = r.result.status;
  return st === "creator" || st === "administrator" || st === "member" || (st === "restricted" && !!r.result.is_member);
}

async function remember(from: From, patch: Record<string, unknown>) {
  await db().from("bot_users").upsert({
    tg_id: from.id, first_name: from.first_name ?? null, username: from.username ?? null,
    ...(isOwnerId(from.id) ? {} : { lang: from.language_code ?? null }), // 대표의 보기 설정은 덮어쓰지 않음
    last_seen: new Date().toISOString(), ...patch,
  }, { onConflict: "tg_id" });
}

async function askToSubscribe(chatId: number, t: Tx) {
  await tgCall("sendMessage", {
    chat_id: chatId, text: t.gate,
    reply_markup: { inline_keyboard: [[{ text: "📢 TOPIK | Koreys Tilli 🇰🇷", url: channelUrl() }], [{ text: t.confirm, callback_data: "sub" }]] },
  });
}

async function sendMenu(chatId: number, t: Tx, hello = true, ownerTip = "") {
  await tgCall("sendMessage", { chat_id: chatId, text: (hello ? t.hello : t.pick) + ownerTip, reply_markup: menuKeyboard(t) });
}

// ───────── 각 메뉴 ─────────
async function sendCategories(chatId: number, l: L) {
  const t = T[l];
  const { data } = await db().from("library_items").select("category").eq("active", true);
  const count: Record<string, number> = {};
  (data ?? []).forEach((r) => (count[r.category] = (count[r.category] ?? 0) + 1));
  const rows = Object.entries(CATS[l]).filter(([k]) => count[k]).map(([k, label]) => [{ text: `${label} (${count[k]})`, callback_data: `cat:${k}` }]);
  await tgCall("sendMessage", {
    chat_id: chatId, text: rows.length ? t.catsTitle : t.catsEmpty,
    reply_markup: rows.length ? { inline_keyboard: rows } : undefined,
  });
}

async function sendCategory(chatId: number, cat: string, l: L) {
  const { data } = await db().from("library_items").select("id,title").eq("category", cat).eq("active", true).order("sort").order("id", { ascending: false }).limit(30);
  const rows = (data ?? []).map((it) => [{ text: it.title.slice(0, 60), callback_data: `item:${it.id}` }]);
  await tgCall("sendMessage", {
    chat_id: chatId, text: `${CATS[l][cat] ?? "📚"} 👇`,
    reply_markup: { inline_keyboard: [...rows, [{ text: T[l].back, callback_data: "cats" }]] },
  });
}

async function sendItem(chatId: number, id: number, l: L) {
  const t = T[l];
  const { data: it } = await db().from("library_items").select("id,title,description,file_id,file_type,url").eq("id", id).eq("active", true).maybeSingle();
  if (!it) { await tgCall("sendMessage", { chat_id: chatId, text: t.notFound }); return; }
  const caption = `${it.title}${it.description ? `\n\n${it.description}` : ""}\n\n📌 Manba: ${CHANNEL}`.slice(0, 1024); // 자료 캡션은 퍼질 때를 위해 우즈벡어 고정
  if (it.file_type === "link") {
    await tgCall("sendMessage", { chat_id: chatId, text: caption, reply_markup: { inline_keyboard: [[{ text: t.open, url: it.url }]] } });
  } else {
    const method = { document: "sendDocument", audio: "sendAudio", video: "sendVideo", photo: "sendPhoto" }[it.file_type as "document"];
    await tgCall(method, { chat_id: chatId, [it.file_type]: it.file_id, caption });
  }
  await db().rpc("library_hit", { item_id: it.id });
}

async function nextExams(): Promise<ExamEvent[]> {
  const { data } = await db().from("exam_events").select(EXAM_COLS).eq("active", true).gte("exam_date", tashkentToday()).order("exam_date").limit(8);
  return (data ?? []) as ExamEvent[];
}

async function sendRegGuide(chatId: number, l: L) {
  const t = T[l];
  const next = (await nextExams())[0];
  let nextLine = "";
  if (next) {
    const reg = next.confirmed && next.reg_start ? `\n${t.regWhen}: ${t.date(next.reg_start)}${next.reg_end ? ` — ${t.date(next.reg_end)}` : ""}` : `\n${t.regSoon}`;
    nextLine = `\n\n${t.next}: ${next.name} — ${t.date(next.exam_date)} (${next.confirmed ? t.official : t.guess})${reg}`;
  }
  await tgCall("sendMessage", {
    chat_id: chatId, text: `${t.regTitle}${nextLine}\n\n${t.regAsk}`,
    link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: [[{ text: "🌐 topiktashkec.uz", url: "https://topiktashkec.uz" }], [{ text: t.ask, url: `https://t.me/${CONSULT_BOT}?start=topik` }]] },
  });
}

async function sendSchedule(chatId: number, l: L) {
  const t = T[l];
  const list = await nextExams();
  const text = list.length
    ? `${t.schTitle}\n\n` + list.map((e) => `${e.confirmed ? "✅" : "⏳"} ${e.name} — ${t.date(e.exam_date)}${e.result_date ? ` · ${t.result} ${t.date(e.result_date)}` : ""}`).join("\n") +
      (list.some((e) => !e.confirmed) ? `\n\n${t.schGuess}` : "")
    : t.schEmpty;
  await tgCall("sendMessage", { chat_id: chatId, text, reply_markup: { inline_keyboard: [[{ text: t.reg, callback_data: "reg" }]] } });
}

// ───────── 대표: 파일을 보내면 도서관에 저장 ─────────
async function ownerUpload(m: Msg): Promise<boolean> {
  const f = m.document ? { ...m.document, type: "document" } : m.audio ? { ...m.audio, type: "audio" } : m.video ? { ...m.video, type: "video" } : m.photo?.length ? { ...m.photo[m.photo.length - 1], type: "photo" } : null;
  if (!f) return false;
  const cap = (m.caption ?? "").trim();
  const tag = (cap.match(/#(tests|writing|words|guide)\b/i)?.[1] ?? "").toLowerCase();
  if (!tag) {
    await tgCall("sendMessage", { chat_id: m.chat.id, text: "📥 자료실에 넣으려면 캡션에 분류를 붙여 다시 보내 주세요.\n#tests (TOPIK 기출·모의) · #writing (쓰기) · #words (단어·문법) · #guide (안내서)\n예) #tests 자체 모의고사 1회" });
    return true;
  }
  const title = (cap.replace(/#\w+/g, "").trim() || f.file_name || f.title || "Material").slice(0, 120);
  const { data, error } = await db().from("library_items").insert({ category: tag, title, file_id: f.file_id, file_type: f.type }).select("id").single();
  await tgCall("sendMessage", { chat_id: m.chat.id, text: error ? "저장 실패 — Supabase에 0007 SQL을 실행했는지 확인해 주세요." : `✅ 자료실에 저장했어요 (#${data.id} · ${CAT_KO[tag]}: ${title}).\n학생에게 보이는 이름은 우즈벡어로 바꿔 주세요 — 관리 화면 [📦 자료].` });
  return true;
}

// ───────── 들어온 메시지·버튼 처리 ─────────
export async function onMessage(m: Msg, origin: string) {
  if (m.chat.type !== "private" || !m.from) return;
  const from = m.from;
  const owner = isOwnerId(from.id);
  if (owner && (await ownerUpload(m))) return;
  const text = (m.text ?? "").trim();

  // 대표 전용: 학생 화면(우즈벡어) ↔ 한국어
  if (owner && (text === "/uz" || text === "/ko")) {
    await remember(from, { lang: text === "/uz" ? "view:uz" : "view:ko" });
    const l: L = text === "/uz" ? "uz" : "ko";
    await tgCall("sendMessage", { chat_id: m.chat.id, text: l === "uz" ? "👀 학생 화면(우즈벡어)으로 바꿨어요. 한국어로 돌아가려면 /ko" : "🇰🇷 한국어로 바꿨어요. 학생 화면을 보려면 /uz" });
    await sendMenu(m.chat.id, T[l]);
    return;
  }

  const l = await langOf(from);
  const t = T[l];
  const ownerTip = owner ? (l === "ko" ? "\n\n(대표님께만 한국어로 보여요. 학생 화면 보기: /uz)" : "\n\n(👀 학생 화면 보기 중 · 한국어로: /ko)") : "";

  if (text.startsWith("/start")) {
    const source = text.split(/\s+/)[1] ?? null;
    const sub = await isSubscribed(from.id);
    await remember(from, { source, subscribed: sub });
    if (!sub) { await askToSubscribe(m.chat.id, t); return; }
    await sendMenu(m.chat.id, t, true, ownerTip);
    if (source === "reg") await sendRegGuide(m.chat.id, l);
    return;
  }

  await remember(from, {});
  // 자료·접수 도우미는 구독자만
  if (isBtn(text, "materials") || isBtn(text, "reg")) {
    if (!(await isSubscribed(from.id))) { await askToSubscribe(m.chat.id, t); return; }
    if (isBtn(text, "materials")) await sendCategories(m.chat.id, l); else await sendRegGuide(m.chat.id, l);
    return;
  }
  if (isBtn(text, "schedule")) return sendSchedule(m.chat.id, l);
  if (isBtn(text, "classes")) {
    await tgCall("sendMessage", { chat_id: m.chat.id, text: t.classesText, reply_markup: { inline_keyboard: [[{ text: t.classesBtn, web_app: { url: `${origin}/app` } }]] } });
    return;
  }
  if (isBtn(text, "consult")) {
    await tgCall("sendMessage", { chat_id: m.chat.id, text: t.consultText, reply_markup: { inline_keyboard: [[{ text: "🎓 STORY CONSULTING", url: `https://t.me/${CONSULT_BOT}?start=korean_bot` }]] } });
    return;
  }
  await sendMenu(m.chat.id, t, false, ownerTip);
}

export async function onCallback(c: Cb) {
  const chatId = c.message?.chat.id ?? c.from.id;
  const data = c.data ?? "";
  const l = await langOf(c.from);
  const t = T[l];
  if (data === "sub") {
    const sub = await isSubscribed(c.from.id);
    await remember(c.from, { subscribed: sub });
    await tgCall("answerCallbackQuery", { callback_query_id: c.id, text: sub ? t.subOk : t.subNo, show_alert: !sub });
    if (sub) { await sendMenu(chatId, t); await logEvent(c.from.id, "bot", "subscribe", "구독 확인"); }
    return;
  }
  await tgCall("answerCallbackQuery", { callback_query_id: c.id });
  if (!(await isSubscribed(c.from.id))) { await askToSubscribe(chatId, t); return; }
  if (data === "cats") return sendCategories(chatId, l);
  if (data === "reg") return sendRegGuide(chatId, l);
  if (data.startsWith("cat:")) return sendCategory(chatId, data.slice(4), l);
  if (data.startsWith("item:")) return sendItem(chatId, Number(data.slice(5)), l);
}
