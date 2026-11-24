import "server-only";
import { db, logEvent } from "./db";
import { tgCall } from "./tg";
import { BOT_USERNAME } from "./env";
import { CHANNEL, SIGN } from "./channel";
import { CONSULT_BOT } from "./news";

// 시험 일정 캠페인 — 매일 아침 cron이 오늘(타슈켄트 날짜)에 해당하는 글을 올림.
// 우즈벡어 문구는 고정 틀 (현지인 확인 권장). 날짜는 대표가 [📅 시험]에서 넣음.

export type ExamEvent = {
  id: number; name: string; place: string | null; exam_date: string; reg_start: string | null; reg_end: string | null;
  result_date: string | null; link: string | null; active: boolean;
  confirmed: boolean; note: string | null;   // confirmed=false = 예상 일정 → 자동 글 안 올림
};
export const EXAM_COLS = "id,name,place,exam_date,reg_start,reg_end,result_date,link,active,confirmed,note";

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
export const uzDate = (d: string) => { const [, m, day] = d.split("-").map(Number); return `${day}-${MONTHS[m - 1]}`; };
export const tashkentToday = () => new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);

type Btn = "class" | "consult";
export type Slot = "morning" | "afternoon" | "evening"; // 타슈켄트 10시 · 14시 · 20시
type Msg = { trigger: string; label: string; date: string; text: string; btn: Btn; slot?: Slot; poll?: { question: string; options: string[] } };

const TIPS: Record<number, string> = {
  30: "📌 Hozirdan har kuni 1 ta test ishlang va xatolaringizni yozib boring. 30 kun — juda katta vaqt!",
  14: "📌 듣기 uchun har kuni 20 daqiqa audio tinglang. 쓰기 51–54 uchun shablonlarni takrorlang.",
  7: "📌 Endi yangi narsa emas, takrorlash vaqti. Eski testlarni vaqt bilan ishlab ko‘ring ⏱",
  3: "📌 Imtihon joyi va vaqtini tekshiring. Kerakli hujjatlarni oldindan tayyorlab qo‘ying.",
};

// 한 시험의 모든 예정 글 (날짜순)
export function plan(e: ExamEvent): Msg[] {
  const n = e.name, where = e.place ? ` (${e.place})` : "";
  const link = e.link ? `\n🔗 ${e.link}` : "";
  const out: Msg[] = [];
  if (e.reg_start) out.push({ trigger: "reg_start", label: "접수 시작", date: e.reg_start, btn: "class",
    text: `📢 ${n}${where} — ro‘yxatdan o‘tish boshlandi!\n\n🗓 Imtihon: ${uzDate(e.exam_date)}${e.reg_end ? `\n⏰ Ro‘yxatdan o‘tish: ${uzDate(e.reg_end)} gacha` : ""}\n\nJoylar tez tugaydi — kechiktirmang!${link}` });
  if (e.reg_end) out.push({ trigger: "reg_end_2", label: "접수 마감 2일 전", date: addDays(e.reg_end, -2), btn: "class",
    text: `⏰ ${n} — ro‘yxatdan o‘tishga 2 kun qoldi!\n\nOxirgi kun: ${uzDate(e.reg_end)}. Hali yozilmagan bo‘lsangiz, hoziroq ro‘yxatdan o‘ting.${link}` });
  for (const d of [30, 14, 7, 3]) out.push({ trigger: `d${d}`, label: `D-${d}`, date: addDays(e.exam_date, -d), btn: "class",
    text: `⏳ ${n} imtihoniga ${d} kun qoldi!\n\n${TIPS[d]}\n\nSiz tayyormisiz? Izohlarda yozing 👇` });
  out.push({ trigger: "d1", label: "D-1", date: addDays(e.exam_date, -1), btn: "class",
    text: `🔥 Ertaga — ${n}!\n\n✅ Pasport / ID karta\n✅ Imtihon joyi va vaqti\n✅ Erta uxlang, ertalab nonushta qiling\n\nHammaga omad! 시험 잘 보세요! 🍀` });
  out.push({ trigger: "d0", label: "시험 당일", date: e.exam_date, btn: "class",
    text: `🍀 Bugun ${n} kuni!\n\n여러분, 모두 시험 잘 보세요! 💪\nShoshilmang, qiyin savolda ko‘p to‘xtamang — keyin qayting.` });
  // 시험 당일 실시간 (경쟁 채널 조회수 1위 시간대) — PBT는 TOPIK I·II 따로, IBT는 한 번
  const ibt = /ibt/i.test(n);
  if (!ibt) out.push({ trigger: "d0_t1", label: "당일 · TOPIK I 어땠어요?", date: e.exam_date, slot: "afternoon", btn: "class",
    text: `📝 ${n} — TOPIK I qanday o‘tdi?\n\nQaysi savollar qiyin bo‘ldi? 듣기 yoki 읽기? Izohlarda yozing 👇`,
    poll: { question: "TOPIK I qanday o‘tdi? 🤔", options: ["😎 Oson", "🙂 O‘rtacha", "😵 Qiyin", "😭 듣기 juda qiyin"] } });
  out.push({ trigger: "d0_t2", label: ibt ? "당일 · 시험 어땠어요?" : "당일 · TOPIK II 어땠어요?", date: e.exam_date, slot: "evening", btn: "class",
    text: ibt
      ? `📝 ${n} qanday o‘tdi?\n\nQaysi qism qiyin bo‘ldi? Izohlarda yozing 👇`
      : `📝 ${n} — TOPIK II qanday o‘tdi?\n\n51–52 쓰기 ga nima deb yozdingiz? Javoblaringizni izohlarda yozing — birga tekshiramiz 👇`,
    poll: { question: ibt ? `${n} qanday o‘tdi? 🤔` : "TOPIK II qanday o‘tdi? 🤔", options: ["😎 Oson", "🙂 O‘rtacha", "😵 Qiyin", "😭 쓰기 juda qiyin"] } });
  out.push({ trigger: "after1", label: "시험 다음 날", date: addDays(e.exam_date, 1), btn: "class",
    text: `💪 ${n} tugadi — hammangizga rahmat!\n\n${e.result_date ? `📊 Natijalar ${uzDate(e.result_date)} kuni chiqadi.\n\n` : ""}Natijani kutib o‘tirmang: keyingi imtihonga hozirdan tayyorlansangiz, darajangizni oshirasiz. Kanalda har kuni yangi mashqlar 👇` });
  // 성적 발표 카운트다운
  if (e.result_date) for (const d of [7, 3, 1]) {
    const date = addDays(e.result_date, -d);
    if (date > addDays(e.exam_date, 1)) out.push({ trigger: `r${d}`, label: `성적 발표 D-${d}`, date, btn: "class",
      text: `⏳ ${n} natijalari chiqishiga ${d} kun qoldi!\n\n📊 Natija: ${uzDate(e.result_date)}, topik.go.kr saytida.\nQaysi darajani kutyapsiz? Izohlarda yozing 👇` });
  }
  if (e.result_date) out.push({ trigger: "result", label: "성적 발표", date: e.result_date, btn: "consult",
    text: `📊 ${n} natijalari chiqdi!\n\nNatijani topik.go.kr saytida tekshiring. Necha daraja oldingiz? Izohlarda yozing 🎉\n\nTOPIK bor — endi Koreyada o‘qish vaqti! Universitet tanlashda yordam kerak bo‘lsa, bizga yozing 👇` });
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

const button = (b: Btn) => b === "consult"
  ? { inline_keyboard: [[{ text: "🎓 STORY CONSULTING · bepul konsultatsiya", url: `https://t.me/${CONSULT_BOT}?start=channel` }]] }
  : BOT_USERNAME ? { inline_keyboard: [[{ text: "📚 STORY Korean · TOPIK darslari", url: `https://t.me/${BOT_USERNAME}?start=channel` }]] } : undefined;

export async function postExamMsg(e: ExamEvent, m: Msg): Promise<string> {
  const r = (await tgCall("sendMessage", { chat_id: CHANNEL, text: m.text + SIGN, link_preview_options: { is_disabled: true }, reply_markup: button(m.btn) })) as { ok: boolean; description?: string; result?: { message_id?: number } };
  if (!r.ok) return `실패(${e.name} ${m.label}): ${r.description}`;
  if (m.poll) await tgCall("sendPoll", { chat_id: CHANNEL, question: m.poll.question, options: m.poll.options.map((text) => ({ text })), is_anonymous: true });
  await db().from("exam_posts").upsert({ event_id: e.id, trigger: m.trigger, message_id: r.result?.message_id ?? null }, { onConflict: "event_id,trigger" });
  await logEvent(null, "exam", String(e.id), `${m.label} 올림`);
  return `${e.name} ${m.label} 올림`;
}

// 매일 아침: 오늘 날짜에 해당하고 아직 안 올린 글만
export async function runExamCampaign(slot: Slot = "morning"): Promise<string[]> {
  const sb = db();
  const today = tashkentToday();
  const { data: events, error } = await sb.from("exam_events").select(EXAM_COLS).eq("active", true).eq("confirmed", true).gte("exam_date", addDays(today, -60));
  if (error) return [];
  const out: string[] = [];
  for (const e of (events ?? []) as ExamEvent[]) {
    const due = plan(e).filter((m) => m.date === today && (m.slot ?? "morning") === slot);
    if (!due.length) continue;
    const { data: done } = await sb.from("exam_posts").select("trigger").eq("event_id", e.id);
    const doneSet = new Set((done ?? []).map((d) => d.trigger));
    for (const m of due.filter((m) => !doneSet.has(m.trigger))) out.push(await postExamMsg(e, m));
  }
  return out;
}
