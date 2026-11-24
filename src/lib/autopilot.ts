import "server-only";
import { ImageResponse } from "next/og";
import { db, logEvent } from "./db";
import { BOT_USERNAME, OWNER_IDS } from "./env";
import { CHANNEL, SIGN } from "./channel";
import { CONSULT_BOT } from "./news";
import { CARD_COLS2, CARD_COLS3, NAVY, RED, BLUE, SKY, div, font, nextCard, sendPhoto, type Card } from "./cards";
import { getSetting, setSetting, autoApprove } from "./settings";
import { runExamCampaign } from "./exams";
import { tgCall } from "./tg";

// 자동 운영 — 경쟁 채널(ONLINE TOPIK, 하루 8~9개)의 리듬을 자동으로.
// 타슈켄트 시간 기준 하루 일정:
//   10시 표현 카드(+화·금 투표)  ·  14시 쓰기 연습/팁  ·  18시 퀴즈(일 = 주간 정답)  ·  20시 질문/자료/모집/상담
// 우즈벡어 고정 문구는 현지인 확인 필요.

const HOUR = 3600_000;
export const tashkentNow = () => new Date(Date.now() + 5 * HOUR);
export const tashkentDow = () => tashkentNow().getUTCDay(); // 0=일 … 6=토
const todayStr = () => tashkentNow().toISOString().slice(0, 10);

type TgRes = { ok: boolean; description?: string; result?: { message_id?: number } };
const post = (text: string, keyboard?: unknown, reply?: number) => tgCall("sendMessage", {
  chat_id: CHANNEL, text: text.slice(0, 4096), link_preview_options: { is_disabled: true },
  ...(keyboard ? { reply_markup: keyboard } : {}),
  ...(reply ? { reply_parameters: { message_id: reply, allow_sending_without_reply: true } } : {}),
}) as Promise<TgRes>;

const botBtn = (start: string, text = "📚 STORY Korean · TOPIK darslari") =>
  BOT_USERNAME ? { inline_keyboard: [[{ text, url: `https://t.me/${BOT_USERNAME}?start=${start}` }]] } : undefined;

// 같은 종류를 20시간 안에 이미 올렸으면 건너뜀 (cron 두 번 불림 방지)
async function postedRecently(kind: Card["kind"], hours = 20) {
  const { data } = await db().from("daily_cards").select("posted_at").eq("kind", kind).not("posted_at", "is", null).order("posted_at", { ascending: false }).limit(1).maybeSingle();
  return !!data?.posted_at && Date.now() - Date.parse(data.posted_at) < hours * HOUR;
}
const markPosted = (id: number, messageId?: number) =>
  db().from("daily_cards").update({ status: "posted", posted_at: new Date().toISOString(), message_id: messageId ?? null }).eq("id", id);

// ───────── ① 쓰기 연습 사진 (월·수·금 14시) ─────────
export async function renderWriting(c: Pick<Card, "tag" | "body_ko">): Promise<ArrayBuffer> {
  // 빈칸을 시험지처럼 넓게, 52번(설명문)은 한 문단으로
  const wide = (t: string) => t.replace(/\(\s*([㉠㉡])\s*\)/g, "(\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0$1\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0)");
  const raw = (c.body_ko ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  const lines = (c.tag === "52" ? [raw.join(" ")] : raw).map(wide);
  const LABEL = `쓰기 ${c.tag ?? "51"}번 · Yozib ko‘ring`;
  const HINT = "㉠ va ㉡ ga mos javobni izohlarda yozing";
  const all = [LABEL, HINT, ...lines, "STORY Korean", "TOPIK Online", CHANNEL, "TOPIK II"].join("");
  const [bold, black] = await Promise.all([font(all, 700), font(all, 900)]);
  const len = lines.join("").length;
  const size = len <= 120 ? 44 : len <= 160 ? 40 : 36;
  const tree = div({ width: 1080, height: 1080, flexDirection: "column", padding: "64px 72px", background: `linear-gradient(140deg, #2c2c7c 0%, ${NAVY} 45%, #141440 100%)`, fontFamily: "NotoKR", color: "#fff" },
    div({ justifyContent: "space-between", alignItems: "center" },
      div({ alignItems: "center", gap: 16, fontSize: 36, fontWeight: 900 },
        div({ width: 14, height: 14, borderRadius: 7, background: RED }), div({ width: 14, height: 14, borderRadius: 7, background: BLUE, marginLeft: -8 }), LABEL),
      div({ fontSize: 28, fontWeight: 700, padding: "8px 22px", borderRadius: 40, border: `2px solid ${SKY}`, color: SKY }, "TOPIK II")),
    div({ flexGrow: 1, alignItems: "center" },
      div({ flexDirection: "column", gap: 14, width: "100%", padding: "48px 52px", borderRadius: 28, background: "#fdfdf8", color: "#1b1b3a" },
        ...lines.map((l) => div({ fontSize: size, fontWeight: 700, lineHeight: c.tag === "52" ? 1.75 : 1.5 }, l)))),
    div({ fontSize: 30, fontWeight: 700, color: SKY, marginBottom: 26 }, HINT),
    div({ justifyContent: "space-between", alignItems: "center", fontSize: 30, fontWeight: 700 },
      div({}, CHANNEL), div({ color: "#aab4e6" }, "STORY Korean · TOPIK Online")),
  );
  return new ImageResponse(tree, { width: 1080, height: 1080, fonts: [{ name: "NotoKR", data: bold, weight: 700 }, { name: "NotoKR", data: black, weight: 900 }] }).arrayBuffer();
}

// 지난 쓰기 문제에 모범답안을 답장으로
async function postWritingAnswers(): Promise<string[]> {
  const { data } = await db().from("daily_cards").select(CARD_COLS2).eq("kind", "writing").eq("status", "posted").is("answer_posted_at", null).not("answer", "is", null).order("posted_at").limit(3);
  const out: string[] = [];
  for (const c of (data ?? []) as unknown as Card[]) {
    const r = await post(`✅ #${c.tag ?? "51"}쓰기 — namuna javob\n\n${c.answer}\n\n💡 Ma’nosi to‘g‘ri bo‘lsa, boshqa javob ham to‘g‘ri bo‘lishi mumkin. Javobingizni namuna bilan solishtiring!${SIGN}`, botBtn("channel"), c.message_id ?? undefined);
    if (r.ok) await db().from("daily_cards").update({ answer_posted_at: new Date().toISOString() }).eq("id", c.id);
    out.push(r.ok ? `쓰기 정답 올림(#${c.id})` : `쓰기 정답 실패: ${r.description}`);
  }
  return out;
}

export async function postWriting(c: Card): Promise<string> {
  try {
    const caption = `✍️ #${c.tag ?? "51"}쓰기 · Yozib ko‘ring!\n\n${c.body_uz || "㉠ va ㉡ o‘rniga mos javobni izohlarda yozing 👇"}\n\n✅ Namuna javob — keyingi yozish kuni shu postga javob sifatida.${SIGN}`;
    const r = await sendPhoto(await renderWriting(c), caption.slice(0, 1024));
    if (!r.ok) return `쓰기 연습 실패: ${r.description}`;
    await markPosted(c.id, r.result?.message_id);
    return `쓰기 연습 올림(#${c.id})`;
  } catch (e) { return `쓰기 그림 실패: ${String(e).slice(0, 80)}`; }
}

// ───────── ② 어휘·문법 팁 (화·목·토 14시) ─────────
const TIP_LABEL: Record<string, string> = { grammar: "📗 Grammatika", word: "📘 So‘z boyligi", tip: "🎯 TOPIK maslahat" };
export async function postTip(c: Card): Promise<string> {
  const head = `${TIP_LABEL[c.tag ?? "tip"] ?? "💡"}${c.body_ko ? ` · ${c.body_ko}` : ""}`;
  const r = await post(`${head}\n\n${c.body_uz ?? ""}${SIGN}`, botBtn("channel"));
  if (!r.ok) return `팁 실패: ${r.description}`;
  await markPosted(c.id, r.result?.message_id);
  return `팁 올림(#${c.id})`;
}

// ───────── ③ 참여 질문 (월·수·금·토 20시) ─────────
export async function postQuestion(c: Card): Promise<string> {
  const r = await post(`💬 ${c.question}\n\n${c.body_uz || "Izohlarda yozing 👇"}${SIGN}`);
  if (!r.ok) return `질문 실패: ${r.description}`;
  await markPosted(c.id, r.result?.message_id);
  return `질문 올림(#${c.id})`;
}

// ───────── ④ 자료 소개 (화 20시) — 파일은 봇에서 받게 (구독 확인 → 봇 사용자 명단) ─────────
const CAT_UZ: Record<string, string> = { tests: "TOPIK test", writing: "쓰기 — yozish", words: "So‘z va grammatika", guide: "Qo‘llanma" };
export async function postLibraryDrop(force = false): Promise<string> {
  const sb = db();
  if (!force) {
    const { data: last } = await sb.from("library_items").select("channel_posted_at").not("channel_posted_at", "is", null).order("channel_posted_at", { ascending: false }).limit(1).maybeSingle();
    if (last?.channel_posted_at && Date.now() - Date.parse(last.channel_posted_at) < 6 * 24 * HOUR) return "자료 소개는 이번 주에 이미 올렸어요";
  }
  const { data: it, error } = await sb.from("library_items").select("id,title,description,category").eq("active", true).neq("file_type", "link")
    .order("channel_posted_at", { ascending: true, nullsFirst: true }).order("sort").order("id").limit(1).maybeSingle();
  if (error) return "자료 표 확인 필요 (0008 SQL)";
  if (!it) return "소개할 자료가 없어요 — 봇에 파일을 보내 자료실에 넣어 주세요";
  if (!BOT_USERNAME) return "NEXT_PUBLIC_BOT_USERNAME 이 없어요";
  const text = `📥 Bepul material · ${CAT_UZ[it.category] ?? "TOPIK"}\n\n📄 ${it.title}${it.description ? `\n\n${it.description}` : ""}\n\n🖨 Chop etib oling va imtihongacha yodlang!\n👇 Botimiz orqali bepul yuklab oling${SIGN}`;
  const r = await post(text, botBtn(`lib_${it.id}`, "📥 Yuklab olish · bepul"));
  if (!r.ok) return `자료 소개 실패: ${r.description}`;
  await sb.from("library_items").update({ channel_posted_at: new Date().toISOString() }).eq("id", it.id);
  return `자료 소개 올림(#${it.id} ${it.title})`;
}

// ───────── ⑤ 수업 모집 (목 20시) — 열린 반이 있으면 반 정보, 없으면 대기 명단 ─────────
const UZ_DAYS = ["", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const uzD = (d: string) => { const [, m, day] = d.split("-").map(Number); return `${day}-${UZ_MONTHS[m - 1]}`; };

export async function postRecruit(force = false): Promise<string> {
  const today = todayStr();
  if (!force && (await getSetting("last_recruit")) >= new Date(Date.now() + 5 * HOUR - 6 * 24 * HOUR).toISOString().slice(0, 10)) return "모집 글은 이번 주에 이미 올렸어요";
  const sb = db();
  const { data: classes } = await sb.from("classes").select("id,name,level,days,start_time,minutes,starts_on,capacity,fee,fee_note,status").eq("status", "open").order("starts_on", { ascending: true, nullsFirst: false }).limit(3);
  const list = (classes ?? []).filter((c) => !c.starts_on || c.starts_on >= today);
  let text: string, kb: unknown;
  if (list.length) {
    const blocks: string[] = [];
    for (const c of list) {
      const { count } = await sb.from("enrollments").select("id", { count: "exact", head: true }).eq("class_id", c.id).neq("status", "dropped");
      const left = Math.max(0, (c.capacity ?? 15) - (count ?? 0));
      blocks.push([
        `🟡 ${c.name}${c.level ? ` (${c.level})` : ""}`,
        c.days?.length ? `📅 ${c.days.map((d: number) => UZ_DAYS[d]).join(" • ")}${c.start_time ? ` → ${String(c.start_time).slice(0, 5)} (Toshkent vaqti)` : ""}` : "",
        c.starts_on ? `🚀 Boshlanishi: ${uzD(c.starts_on)}` : "",
        c.fee ? `💳 To‘lov: ${Number(c.fee).toLocaleString("ru-RU")}${c.fee_note ? ` ${c.fee_note}` : ""}` : "",
        `👥 Bo‘sh joy: ${left} ta`,
      ].filter(Boolean).join("\n"));
    }
    text = `📢 STORY Korean — ONLINE TOPIK GURUHLARIGA QABUL OCHIQ!\n\n${blocks.join("\n\n")}\n\n🖥 Darslar Zoom orqali, Koreyadagi ustozlar bilan.\n📝 Ro‘yxatdan o‘tish — botimizda, 1 daqiqa 👇${SIGN}`;
    kb = botBtn("classes", "📝 Guruhga yozilish");
  } else {
    text = `📢 STORY Korean — yangi ONLINE TOPIK guruhlari tez orada!\n\n✅ Zoom orqali onlayn darslar\n✅ TOPIK I va TOPIK II tayyorgarlik\n✅ Koreyadagi jamoa: TOPIK + Koreyada o‘qish bo‘yicha yordam\n\nQabul ochilganda birinchi bo‘lib bilishni xohlaysizmi? Navbatga yoziling — qabul kuni sizga botda xabar beramiz 👇${SIGN}`;
    kb = botBtn("wait", "🔔 Navbatga yozilish");
  }
  const r = await post(text, kb);
  if (!r.ok) return `모집 글 실패: ${r.description}`;
  await setSetting("last_recruit", today);
  return list.length ? `수업 모집 글 올림(${list.length}반)` : "대기 명단 모집 글 올림(열린 반 없음)";
}

// ───────── ⑥ 무료 유학 상담 (매달 첫 토요일 20시) ─────────
const CONSULT_TEXTS = [
  "🇰🇷 Koreyada o‘qishni rejalashtiryapsizmi?\n\nTOPIK’ga tayyorlanyapsiz, lekin qaysi universitet, qaysi dastur va qancha xarajat bo‘lishini hali bilmayapsizmi?\n\n📌 Til kursi (D-4) • Bakalavr (D-2) • Magistratura\n\nSTORY CONSULTING — Koreyaning o‘zida joylashgan jamoa. Savolingizni yozing, sizga mos dasturni birga tanlaymiz 👇",
  "🎓 TOPIK natijangiz bilan qaysi universitetga kirsa bo‘ladi?\n\n2급 bilan ham, 3–4급 bilan ham imkoniyat bor — faqat to‘g‘ri dasturni tanlash kerak.\n\n✅ Universitet va dastur tanlash\n✅ Hujjatlar ro‘yxati\n✅ Viza bo‘yicha maslahat\n\nKoreyadagi STORY CONSULTING jamoasidan bepul konsultatsiya oling 👇",
  "💸 Koreyada o‘qish qancha turadi?\n\nKontrakt, yotoqxona, oylik xarajat — har bir universitetda har xil. Grant va chegirmalar ham bor.\n\nO‘zingizga mos variantni bilmoqchimisiz? STORY CONSULTING (Koreya) bilan bepul gaplashing 👇",
];
export async function postConsult(force = false): Promise<string> {
  const now = tashkentNow();
  const month = now.toISOString().slice(0, 7);
  if (!force && (await getSetting("last_consult")) === month) return "이번 달 상담 글은 이미 올렸어요";
  const text = CONSULT_TEXTS[now.getUTCMonth() % CONSULT_TEXTS.length] + SIGN;
  const r = await post(text, { inline_keyboard: [[{ text: "🎓 Bepul konsultatsiya · STORY CONSULTING", url: `https://t.me/${CONSULT_BOT}?start=storytopik` }]] });
  if (!r.ok) return `상담 글 실패: ${r.description}`;
  await setSetting("last_consult", month);
  return "유학 상담 글 올림";
}

// ───────── ⑦ 재미 콘텐츠 (일요일) ─────────
// 14시 = 글: kpop · drama · real · proverb  /  20시 = 참여: balance(투표) · food(메뉴판 읽기 챌린지)
export const FUN_DAY = ["kpop", "drama", "real", "proverb"];
export const FUN_NIGHT = ["balance", "food"];
const FUN_HEAD: Record<string, string> = {
  kpop: "🎵 K-pop bilan koreys tili", drama: "🎬 Dramalarda tez-tez eshitiladi", real: "😎 Darslikda vs hayotda", proverb: "📜 Koreys maqoli",
};

export async function renderFood(c: Pick<Card, "question" | "body_ko">): Promise<ArrayBuffer> {
  const place = c.question ?? "분식집";
  const rows = (c.body_ko ?? "").split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((r) => r[0]);
  const TOP = "O‘qib bering!", BOTTOM = "Ovoz chiqarib o‘qing — izohlarda ovozli xabar qoldiring";
  const all = [TOP, BOTTOM, place, "메뉴 MENU", ...rows.flat(), CHANNEL, "STORY Korean"].join("");
  const [bold, black] = await Promise.all([font(all, 700), font(all, 900)]);
  const CREAM = "#fff8ec", INK = "#3a2412";
  const tree = div({ width: 1080, height: 1080, flexDirection: "column", padding: "60px 72px", background: `linear-gradient(150deg, #d9482b 0%, #b8321c 100%)`, fontFamily: "NotoKR", color: "#fff" },
    div({ justifyContent: "space-between", alignItems: "center" },
      div({ fontSize: 40, fontWeight: 900 }, TOP),
      div({ fontSize: 28, fontWeight: 700, padding: "8px 22px", borderRadius: 40, border: "2px solid #ffd9c9" }, "STORY Korean")),
    div({ flexGrow: 1, alignItems: "center" },
      div({ flexDirection: "column", width: "100%", padding: "44px 56px", borderRadius: 28, background: CREAM, color: INK },
        div({ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, paddingBottom: 18, borderBottom: `4px solid ${INK}` },
          div({ fontSize: 58, fontWeight: 900 }, place), div({ fontSize: 30, fontWeight: 700, color: "#b8321c" }, "메뉴 MENU")),
        ...rows.map((r) => div({ justifyContent: "space-between", fontSize: 46, fontWeight: 700, padding: "12px 0" }, div({}, r[0]), div({ color: "#b8321c" }, r[1] ?? ""))))),
    div({ fontSize: 30, fontWeight: 700, color: "#ffe3d6", marginBottom: 22 }, BOTTOM),
    div({ justifyContent: "space-between", fontSize: 30, fontWeight: 700 }, div({}, CHANNEL), div({ color: "#ffd9c9" }, "TOPIK · Koreys tili")),
  );
  return new ImageResponse(tree, { width: 1080, height: 1080, fonts: [{ name: "NotoKR", data: bold, weight: 700 }, { name: "NotoKR", data: black, weight: 900 }] }).arrayBuffer();
}

export async function postFun(c: Card): Promise<string> {
  const tag = c.tag ?? "kpop";
  let r: TgRes;
  if (tag === "balance") {
    const opts = (c.options ?? []).slice(0, 10);
    if (opts.length < 2) return "투표 선택지가 2개 이상 필요해요";
    r = (await tgCall("sendPoll", { chat_id: CHANNEL, question: `⚖️ ${c.question ?? ""}`.slice(0, 300), options: opts.map((t) => ({ text: t.slice(0, 100) })), is_anonymous: true })) as TgRes;
  } else if (tag === "food") {
    try {
      const caption = `🍜 O‘qish challenji · ${c.question ?? ""}\n\n${c.body_uz || "Menyuni ovoz chiqarib o‘qing va izohlarda 🎙 ovozli xabar qoldiring! Qaysi taomni buyurtma qilardingiz?"}${SIGN}`;
      r = await sendPhoto(await renderFood(c), caption.slice(0, 1024));
    } catch (e) { return `메뉴판 그림 실패: ${String(e).slice(0, 80)}`; }
  } else {
    const ex = (c.examples ?? []).map((x) => `📝 ${x.ko}\n— ${x.uz}`).join("\n");
    const head = `${FUN_HEAD[tag] ?? "✨"}\n\n🇰🇷 ${c.expr_ko ?? ""}${c.meaning_uz ? ` — ${c.meaning_uz}` : ""}`;
    const kb = c.url ? { inline_keyboard: [[{ text: tag === "kpop" ? "▶️ Rasmiy MV (YouTube)" : "🔗 Ko‘rish", url: c.url }]] } : botBtn("channel");
    r = await post(`${head}\n\n${c.body_uz ?? ""}${ex ? `\n\n${ex}` : ""}${SIGN}`, kb);
  }
  if (!r.ok) return `재미 콘텐츠 실패: ${r.description}`;
  await markPosted(c.id, r.result?.message_id);
  return `재미 콘텐츠 올림(#${c.id} ${tag})`;
}

async function postNextFun(tags: string[]): Promise<string> {
  const sb = db();
  const { data: last } = await sb.from("daily_cards").select("posted_at").eq("kind", "fun").in("tag", tags).not("posted_at", "is", null).order("posted_at", { ascending: false }).limit(1).maybeSingle();
  if (last?.posted_at && Date.now() - Date.parse(last.posted_at) < 20 * HOUR) return "재미 콘텐츠 오늘 이미 올림";
  const st = (await autoApprove()) ? ["approved", "draft"] : ["approved"];
  const { data, error } = await sb.from("daily_cards").select(CARD_COLS3).eq("kind", "fun").in("tag", tags).in("status", st).order("sort").order("id").limit(1).maybeSingle();
  if (error) return "재미 콘텐츠 표 확인 필요 (0009 SQL)";
  if (!data) return "창고에 재미 콘텐츠가 없어요";
  const r = await postFun(data as unknown as Card);
  await logEvent(null, "auto", "fun", r);
  return r;
}

// ───────── 시간대별 실행 ─────────
async function postNextOf(kind: "writing" | "tip" | "question"): Promise<string> {
  if (await postedRecently(kind)) return `${kind} 오늘 이미 올림`;
  const c = await nextCard(kind);
  const name = { writing: "쓰기 연습", tip: "팁", question: "참여 질문" }[kind];
  if (!c) return `창고에 ${name}가 없어요`;
  const r = kind === "writing" ? await postWriting(c) : kind === "tip" ? await postTip(c) : await postQuestion(c);
  await logEvent(null, "auto", kind, r);
  return r;
}

// 14시: 월·수·금 = 쓰기 연습(+지난 쓰기 정답) / 화·목·토 = 팁 / 일 = 재미(K-pop·드라마·실제 한국어·속담)  + 시험 당일 실시간 글
export async function runAfternoon(): Promise<string[]> {
  const d = tashkentDow();
  const out: string[] = [];
  if (d === 1 || d === 3 || d === 5) { out.push(...await postWritingAnswers()); out.push(await postNextOf("writing")); }
  else if (d === 2 || d === 4 || d === 6) out.push(await postNextOf("tip"));
  else out.push(await postNextFun(FUN_DAY)); // 일요일
  out.push(...await runExamCampaign("afternoon"));
  return out;
}

// 20시: 월·수·금·토 = 참여 질문 (매달 첫 토요일 = 유학 상담) / 화 = 자료 소개 / 목 = 수업 모집 / 일 = 밸런스 게임·메뉴판 읽기  + 시험 글
export async function runEvening(): Promise<string[]> {
  const now = tashkentNow();
  const d = now.getUTCDay();
  const out: string[] = [];
  if (d === 6 && now.getUTCDate() <= 7) out.push(await postConsult());
  else if (d === 1 || d === 3 || d === 5 || d === 6) out.push(await postNextOf("question"));
  else if (d === 2) out.push(await postLibraryDrop());
  else if (d === 4) out.push(await postRecruit());
  else if (d === 0) out.push(await postNextFun(FUN_NIGHT));
  out.push(...await runExamCampaign("evening"));
  await logEvent(null, "auto", "evening", out.join(" · "));
  return out;
}

// ───────── 창고 점검: 남은 날 수 ─────────
// 한 주에 쓰는 양: 표현 7 · 투표 2 · 쓰기 3 · 팁 3 · 질문 4 · 재미 2 · 퀴즈 6
export const PER_WEEK: Record<string, number> = { expression: 7, poll: 2, writing: 3, tip: 3, question: 4, fun: 2, quiz: 6 };
export const KIND_KO: Record<string, string> = { expression: "표현 카드", poll: "투표", writing: "쓰기 연습", tip: "팁", question: "참여 질문", fun: "재미 콘텐츠", quiz: "퀴즈" };

export async function stock(): Promise<{ kind: string; left: number; days: number }[]> {
  const sb = db();
  const auto = await autoApprove();
  const st = auto ? ["draft", "approved"] : ["approved"];
  const out: { kind: string; left: number; days: number }[] = [];
  for (const kind of ["expression", "poll", "writing", "tip", "question", "fun"]) {
    const { count } = await sb.from("daily_cards").select("id", { count: "exact", head: true }).eq("kind", kind).in("status", st);
    out.push({ kind, left: count ?? 0, days: Math.floor(((count ?? 0) / PER_WEEK[kind]) * 7) });
  }
  const { count: q } = await sb.from("channel_posts").select("id", { count: "exact", head: true }).eq("status", "queued");
  out.push({ kind: "quiz", left: q ?? 0, days: Math.floor(((q ?? 0) / PER_WEEK.quiz) * 7) });
  return out;
}

// 월요일 아침: 2주 치 밑으로 떨어진 게 있으면 대표에게 한 번 알림
export async function stockAlert(origin: string): Promise<string | null> {
  if (tashkentDow() !== 1) return null;
  const low = (await stock()).filter((s) => s.days < 14);
  if (!low.length) return null;
  const text = `📦 자동 운영 창고가 줄었어요\n\n${low.map((s) => `• ${KIND_KO[s.kind]}: ${s.left}개 (약 ${s.days}일 치)`).join("\n")}\n\nClaude 대화에서 "다음 묶음 만들어줘"라고 하면 SQL로 채워 드려요.`;
  await Promise.all(OWNER_IDS.map((id) => tgCall("sendMessage", {
    chat_id: id, text, reply_markup: { inline_keyboard: [[{ text: "⚙️ 자동 운영 보기", web_app: { url: `${origin}/app?to=/admin/auto` } }]] },
  })));
  return `창고 알림(${low.length}종)`;
}
