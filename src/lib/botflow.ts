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
// 대표는 봇에게 파일을 보내면(캡션에 #tests 등) 도서관에 저장됨.
// 우즈벡어 문구는 현지인 확인 필요.

export const CATS: Record<string, string> = {
  tests: "📝 TOPIK testlar",
  writing: "✍️ 쓰기 — yozish",
  words: "📚 So‘z va grammatika",
  guide: "🧭 Qo‘llanmalar",
};
export const CAT_KO: Record<string, string> = { tests: "TOPIK 기출·모의", writing: "쓰기", words: "단어·문법", guide: "안내서" };

const B = {
  materials: "📚 Materiallar",
  reg: "📝 Ro‘yxatdan o‘tish yordami",
  schedule: "📅 TOPIK jadvali",
  classes: "🎓 Onlayn darslar",
  consult: "💬 Konsultatsiya",
};
const channelUrl = () => `https://t.me/${CHANNEL.replace(/^@/, "")}`;
const menuKeyboard = () => ({
  keyboard: [[{ text: B.materials }, { text: B.reg }], [{ text: B.schedule }, { text: B.classes }], [{ text: B.consult }]],
  resize_keyboard: true, is_persistent: true,
});

type From = { id: number; first_name?: string; username?: string; language_code?: string };
type FileRef = { file_id: string; file_name?: string; title?: string };
export type Msg = {
  chat: { id: number; type: string }; from?: From; text?: string; caption?: string;
  document?: FileRef; audio?: FileRef; video?: FileRef; photo?: FileRef[];
};
export type Cb = { id: string; from: From; data?: string; message?: { chat: { id: number } } };

// ───────── 구독 확인 ─────────
async function isSubscribed(uid: number): Promise<boolean> {
  const r = (await tgCall("getChatMember", { chat_id: CHANNEL, user_id: uid })) as { ok: boolean; result?: { status: string; is_member?: boolean } };
  if (!r.ok || !r.result) return true; // 봇이 채널을 못 읽으면(권한 문제) 막지 않음
  const st = r.result.status;
  return st === "creator" || st === "administrator" || st === "member" || (st === "restricted" && !!r.result.is_member);
}

async function remember(from: From, patch: Record<string, unknown>) {
  await db().from("bot_users").upsert({
    tg_id: from.id, first_name: from.first_name ?? null, username: from.username ?? null, lang: from.language_code ?? null,
    last_seen: new Date().toISOString(), ...patch,
  }, { onConflict: "tg_id" });
}

async function askToSubscribe(chatId: number) {
  await tgCall("sendMessage", {
    chat_id: chatId,
    text: "Assalomu alaykum! 🇰🇷 STORY Korean botiga xush kelibsiz.\n\nBotdan to‘liq foydalanish uchun avval kanalimizga a’zo bo‘ling, keyin [✅ Tasdiqlash] tugmasini bosing 👇",
    reply_markup: { inline_keyboard: [[{ text: "📢 TOPIK | Koreys Tilli 🇰🇷", url: channelUrl() }], [{ text: "✅ Tasdiqlash", callback_data: "sub" }]] },
  });
}

async function sendMenu(chatId: number, hello = true) {
  await tgCall("sendMessage", {
    chat_id: chatId,
    text: hello
      ? "Xush kelibsiz! 🎉 Kerakli bo‘limni tanlang 👇\n\n📚 Materiallar — TOPIK testlar, yozish, so‘zlar\n📝 Ro‘yxatdan o‘tish yordami — TOPIK’ga qanday yozilish\n📅 TOPIK jadvali — O‘zbekistondagi imtihonlar\n🎓 Onlayn darslar — STORY Korean guruhlari\n💬 Konsultatsiya — Koreyada o‘qish bo‘yicha"
      : "Kerakli bo‘limni tanlang 👇",
    reply_markup: menuKeyboard(),
  });
}

// ───────── 각 메뉴 ─────────
async function sendCategories(chatId: number) {
  const { data } = await db().from("library_items").select("category").eq("active", true);
  const count: Record<string, number> = {};
  (data ?? []).forEach((r) => (count[r.category] = (count[r.category] ?? 0) + 1));
  const rows = Object.entries(CATS).filter(([k]) => count[k]).map(([k, label]) => [{ text: `${label} (${count[k]})`, callback_data: `cat:${k}` }]);
  await tgCall("sendMessage", {
    chat_id: chatId,
    text: rows.length ? "📚 Materiallar — bo‘limni tanlang 👇" : "📚 Materiallar tez orada qo‘shiladi. Kanalimizni kuzatib boring!",
    reply_markup: rows.length ? { inline_keyboard: rows } : undefined,
  });
}

async function sendCategory(chatId: number, cat: string) {
  const { data } = await db().from("library_items").select("id,title").eq("category", cat).eq("active", true).order("sort").order("id", { ascending: false }).limit(30);
  const rows = (data ?? []).map((it) => [{ text: it.title.slice(0, 60), callback_data: `item:${it.id}` }]);
  await tgCall("sendMessage", {
    chat_id: chatId, text: `${CATS[cat] ?? "📚"} 👇`,
    reply_markup: { inline_keyboard: [...rows, [{ text: "⬅️ Orqaga", callback_data: "cats" }]] },
  });
}

async function sendItem(chatId: number, id: number) {
  const { data: it } = await db().from("library_items").select("id,title,description,file_id,file_type,url").eq("id", id).eq("active", true).maybeSingle();
  if (!it) { await tgCall("sendMessage", { chat_id: chatId, text: "Bu material topilmadi 🙁" }); return; }
  const caption = `${it.title}${it.description ? `\n\n${it.description}` : ""}\n\n📌 Manba: ${CHANNEL}`.slice(0, 1024);
  if (it.file_type === "link") {
    await tgCall("sendMessage", { chat_id: chatId, text: caption, reply_markup: { inline_keyboard: [[{ text: "🔗 Ochish", url: it.url }]] } });
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

async function sendRegGuide(chatId: number) {
  const next = (await nextExams())[0];
  let nextLine = "";
  if (next) {
    const tag = next.confirmed ? "✅ rasmiy" : "⏳ taxminiy";
    const reg = next.confirmed && next.reg_start ? `\n🗓 Ro‘yxatdan o‘tish: ${uzDate(next.reg_start)}${next.reg_end ? ` — ${uzDate(next.reg_end)}` : ""}` : "\n🗓 Ro‘yxatdan o‘tish sanasi e’lon qilinishi bilan kanalda xabar beramiz.";
    nextLine = `\n\n📅 Keyingi imtihon: ${next.name} — ${uzDate(next.exam_date)} (${tag})${reg}`;
  }
  await tgCall("sendMessage", {
    chat_id: chatId,
    text:
      "📝 TOPIK’ga ro‘yxatdan o‘tish — 4 qadam\n\n" +
      "1️⃣ topiktashkec.uz saytida shaxsiy kabinet oching.\nFaqat belgilangan muddatda ochiladi. Har bir kishi faqat 1 ta ID ochishi mumkin.\n\n" +
      "2️⃣ Onlayn ariza kuni kabinetga kiring va darajani (TOPIK I yoki II) hamda shaharni tanlang.\n⚠️ Ariza kuni yangi kabinet ochib bo‘lmaydi. Joylar juda tez to‘ladi — oldindan tayyor turing!\n\n" +
      "3️⃣ Arizani chop eting.\n\n" +
      "4️⃣ Belgilangan muddatda Koreya Ta’lim markaziga boring: ariza va pasport nusxasi bilan to‘lovni qiling, imtihon raqamini oling. (Muddat hududga qarab farq qilishi mumkin.)" +
      nextLine +
      "\n\nSavolingiz bormi? Bizga yozing — tez javob beramiz 👇",
    link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: [[{ text: "🌐 topiktashkec.uz", url: "https://topiktashkec.uz" }], [{ text: "💬 Savol berish", url: `https://t.me/${CONSULT_BOT}?start=topik` }]] },
  });
}

async function sendSchedule(chatId: number) {
  const list = await nextExams();
  const text = list.length
    ? "📅 O‘zbekistonda TOPIK imtihonlari\n\n" + list.map((e) => `${e.confirmed ? "✅" : "⏳"} ${e.name} — ${uzDate(e.exam_date)}${e.result_date ? ` · natija ${uzDate(e.result_date)}` : ""}`).join("\n") +
      (list.some((e) => !e.confirmed) ? "\n\n⏳ — taxminiy sana. Rasmiy e’lon chiqishi bilan yangilaymiz." : "")
    : "📅 Yaqin imtihon sanalari hali e’lon qilinmagan. Kanalimizni kuzatib boring!";
  await tgCall("sendMessage", { chat_id: chatId, text, reply_markup: { inline_keyboard: [[{ text: B.reg, callback_data: "reg" }]] } });
}

// ───────── 대표: 파일을 보내면 도서관에 저장 ─────────
async function ownerUpload(m: Msg): Promise<boolean> {
  const f = m.document ? { ...m.document, type: "document" } : m.audio ? { ...m.audio, type: "audio" } : m.video ? { ...m.video, type: "video" } : m.photo?.length ? { ...m.photo[m.photo.length - 1], type: "photo" } : null;
  if (!f) return false;
  const cap = (m.caption ?? "").trim();
  const tag = (cap.match(/#(tests|writing|words|guide)\b/i)?.[1] ?? "").toLowerCase();
  if (!tag) {
    await tgCall("sendMessage", { chat_id: m.chat.id, text: "📥 도서관에 넣으려면 캡션에 분류를 붙여 다시 보내 주세요.\n#tests (TOPIK 기출·모의) · #writing (쓰기) · #words (단어·문법) · #guide (안내서)\n예) #tests 자체 모의고사 1회" });
    return true;
  }
  const title = (cap.replace(/#\w+/g, "").trim() || f.file_name || f.title || "Material").slice(0, 120);
  const { data, error } = await db().from("library_items").insert({ category: tag, title, file_id: f.file_id, file_type: f.type }).select("id").single();
  await tgCall("sendMessage", { chat_id: m.chat.id, text: error ? "저장 실패 — Supabase에 0007 SQL을 실행했는지 확인해 주세요." : `✅ 도서관에 저장했어요 (#${data.id} · ${CAT_KO[tag]}: ${title}). 관리 화면 [📦 자료]에서 이름·순서를 고칠 수 있어요.` });
  return true;
}

// ───────── 들어온 메시지·버튼 처리 ─────────
export async function onMessage(m: Msg, origin: string) {
  if (m.chat.type !== "private" || !m.from) return;
  const from = m.from;
  if (isOwnerId(from.id) && (await ownerUpload(m))) return;
  const text = (m.text ?? "").trim();

  if (text.startsWith("/start")) {
    const source = text.split(/\s+/)[1] ?? null;
    const sub = await isSubscribed(from.id);
    await remember(from, { source, subscribed: sub });
    if (!sub) { await askToSubscribe(m.chat.id); return; }
    await sendMenu(m.chat.id);
    if (source === "reg") await sendRegGuide(m.chat.id);
    return;
  }

  await remember(from, {});
  // 자료·접수 도우미는 구독자만
  if (text === B.materials || text === B.reg) {
    if (!(await isSubscribed(from.id))) { await askToSubscribe(m.chat.id); return; }
    if (text === B.materials) await sendCategories(m.chat.id); else await sendRegGuide(m.chat.id);
    return;
  }
  if (text === B.schedule) return sendSchedule(m.chat.id);
  if (text === B.classes) {
    await tgCall("sendMessage", { chat_id: m.chat.id, text: "🎓 STORY Korean onlayn TOPIK darslari — guruhlar, jadval va ro‘yxatdan o‘tish 👇", reply_markup: { inline_keyboard: [[{ text: "📚 Darslarni ko‘rish", web_app: { url: `${origin}/app` } }]] } });
    return;
  }
  if (text === B.consult) {
    await tgCall("sendMessage", { chat_id: m.chat.id, text: "💬 Koreyada o‘qish (til kursi D-4, bakalavr D-2, magistratura) bo‘yicha bepul konsultatsiya — STORY CONSULTING 👇", reply_markup: { inline_keyboard: [[{ text: "🎓 STORY CONSULTING", url: `https://t.me/${CONSULT_BOT}?start=korean_bot` }]] } });
    return;
  }
  await sendMenu(m.chat.id, false);
}

export async function onCallback(c: Cb) {
  const chatId = c.message?.chat.id ?? c.from.id;
  const data = c.data ?? "";
  if (data === "sub") {
    const sub = await isSubscribed(c.from.id);
    await remember(c.from, { subscribed: sub });
    await tgCall("answerCallbackQuery", { callback_query_id: c.id, text: sub ? "✅ Rahmat! A’zolik tasdiqlandi" : "❗ Avval kanalga a’zo bo‘ling", show_alert: !sub });
    if (sub) { await sendMenu(chatId); await logEvent(c.from.id, "bot", "subscribe", "구독 확인"); }
    return;
  }
  await tgCall("answerCallbackQuery", { callback_query_id: c.id });
  if (!(await isSubscribed(c.from.id))) { await askToSubscribe(chatId); return; }
  if (data === "cats") return sendCategories(chatId);
  if (data === "reg") return sendRegGuide(chatId);
  if (data.startsWith("cat:")) return sendCategory(chatId, data.slice(4));
  if (data.startsWith("item:")) return sendItem(chatId, Number(data.slice(5)));
}
