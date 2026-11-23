import "server-only";
import { ImageResponse } from "next/og";
import { createElement as h, type ReactNode } from "react";
import { db, logEvent } from "./db";
import { BOT_TOKEN, BOT_USERNAME } from "./env";
import { CHANNEL, SIGN } from "./channel";
import { claudeJSON, hasClaude } from "./claude";
import { tgCall } from "./tg";

export type Card = {
  id: number; kind: "expression" | "poll";
  expr_ko: string | null; meaning_uz: string | null; meaning_ko: string | null; note_uz: string | null;
  examples: { ko: string; uz: string }[]; level: string | null;
  question: string | null; options: string[] | null;
  status: "draft" | "approved" | "posted" | "rejected"; sort: number; posted_at: string | null; created_at: string;
};
export const CARD_COLS = "id,kind,expr_ko,meaning_uz,meaning_ko,note_uz,examples,level,question,options,status,sort,posted_at,created_at";

// ───────── 이미지 카드 (1080×1080, STORY 남색 + 태극 빨강·파랑) ─────────
export const NAVY = "#222260", RED = "#e0313f", BLUE = "#2f6fe0", SKY = "#8fb4ff";

// 구글 폰트에서 카드에 쓰인 글자만 잘라 받아 옴 (Noto Sans KR — 한국어·우즈벡어 라틴 모두)
export async function font(text: string, weight: number): Promise<ArrayBuffer> {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}&text=${encodeURIComponent(text)}`, { signal: AbortSignal.timeout(8000) }).then((r) => r.text());
  const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error("폰트를 못 받았어요");
  return fetch(url, { signal: AbortSignal.timeout(8000) }).then((r) => r.arrayBuffer());
}

export const div = (style: Record<string, unknown>, ...children: ReactNode[]) => h("div", { style: { display: "flex", ...style } }, ...children);

export async function renderExpression(c: Pick<Card, "expr_ko" | "meaning_uz" | "examples" | "level">): Promise<ArrayBuffer> {
  const expr = c.expr_ko ?? "";
  const ex = (c.examples ?? []).slice(0, 2);
  const size = expr.length <= 6 ? 150 : expr.length <= 10 ? 120 : expr.length <= 16 ? 92 : 72;
  const LABEL = "오늘의 표현 · Kun iborasi";
  const all = [expr, c.meaning_uz, c.level, LABEL, "STORY Korean", "TOPIK Online", CHANNEL, ...ex.flatMap((e) => [e.ko, e.uz])].join("");
  const [bold, black] = await Promise.all([font(all, 700), font(all, 900)]);

  const tree = div({ width: 1080, height: 1080, flexDirection: "column", padding: "72px 80px", background: `linear-gradient(140deg, #2c2c7c 0%, ${NAVY} 45%, #141440 100%)`, fontFamily: "NotoKR", color: "#fff" },
    // 위: 라벨 + 레벨
    div({ justifyContent: "space-between", alignItems: "center" },
      div({ alignItems: "center", gap: 16, fontSize: 34, fontWeight: 700, color: "#dfe6ff" },
        div({ width: 14, height: 14, borderRadius: 7, background: RED }), div({ width: 14, height: 14, borderRadius: 7, background: BLUE, marginLeft: -8 }), LABEL),
      c.level ? div({ fontSize: 30, fontWeight: 700, padding: "8px 22px", borderRadius: 40, border: `2px solid ${SKY}`, color: SKY }, c.level) : div({})),
    // 가운데: 표현 + 뜻
    div({ flexDirection: "column", flexGrow: 1, justifyContent: "center" },
      div({ fontSize: size, fontWeight: 900, lineHeight: 1.15, letterSpacing: -2 }, expr),
      div({ marginTop: 28, fontSize: 50, fontWeight: 700, color: SKY, lineHeight: 1.3 }, c.meaning_uz ?? ""),
      div({ marginTop: 40, gap: 0 }, div({ width: 90, height: 8, background: RED, borderRadius: 4 }), div({ width: 90, height: 8, background: BLUE, borderRadius: 4 }))),
    // 예문
    ex.length ? div({ flexDirection: "column", gap: 26, padding: "34px 40px", borderRadius: 28, background: "rgba(255,255,255,0.08)" },
      ...ex.map((e) => div({ flexDirection: "column", gap: 6 },
        div({ fontSize: 36, fontWeight: 700, lineHeight: 1.35 }, e.ko),
        div({ fontSize: 28, fontWeight: 700, color: "#c3ccf5", lineHeight: 1.35 }, e.uz)))) : div({}),
    // 아래: 서명
    div({ marginTop: 44, justifyContent: "space-between", alignItems: "center", fontSize: 30, fontWeight: 700 },
      div({ color: "#fff" }, CHANNEL),
      div({ color: "#aab4e6" }, "STORY Korean · TOPIK Online")),
  );
  const res = new ImageResponse(tree, { width: 1080, height: 1080, fonts: [{ name: "NotoKR", data: bold, weight: 700 }, { name: "NotoKR", data: black, weight: 900 }] });
  return res.arrayBuffer();
}

export function expressionCaption(c: Card) {
  const ex = (c.examples ?? []).slice(0, 2).map((e) => `${e.ko}\n— ${e.uz}`).join("\n\n");
  return [
    `📚 Kun iborasi · 오늘의 표현`,
    `\n🇰🇷 ${c.expr_ko}\n🇺🇿 ${c.meaning_uz}`,
    c.note_uz ? `\n💡 ${c.note_uz}` : "",
    ex ? `\n📝 Misollar:\n${ex}` : "",
    SIGN,
  ].join("\n").slice(0, 1024);
}

const classButton = () => BOT_USERNAME
  ? { inline_keyboard: [[{ text: "📚 STORY Korean · TOPIK darslari", url: `https://t.me/${BOT_USERNAME}?start=channel` }]] }
  : undefined;

// ───────── 올리기 ─────────
export type TgRes = { ok: boolean; description?: string; result?: { message_id?: number } };

export async function sendPhoto(png: ArrayBuffer, caption: string, keyboard?: unknown): Promise<TgRes> {
  if (!BOT_TOKEN) return { ok: false, description: "BOT_TOKEN 없음" };
  const f = new FormData();
  f.set("chat_id", CHANNEL);
  f.set("caption", caption);
  const kb = keyboard ?? classButton();
  if (kb) f.set("reply_markup", JSON.stringify(kb));
  f.set("photo", new Blob([png], { type: "image/png" }), "story-korean.png");
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: "POST", body: f, signal: AbortSignal.timeout(20000) });
    return (await r.json()) as TgRes;
  } catch (e) { return { ok: false, description: String(e) }; }
}

export async function postCard(c: Card): Promise<{ ok: boolean; error?: string }> {
  let r: TgRes;
  if (c.kind === "expression") {
    try { r = await sendPhoto(await renderExpression(c), expressionCaption(c)); }
    catch (e) { return { ok: false, error: `카드 그림 실패: ${String(e).slice(0, 80)}` }; }
  } else {
    const opts = (c.options ?? []).filter(Boolean).slice(0, 10);
    if (!c.question || opts.length < 2) return { ok: false, error: "질문과 보기 2개 이상이 필요해요" };
    r = (await tgCall("sendPoll", { chat_id: CHANNEL, question: c.question.slice(0, 300), options: opts.map((t) => ({ text: t.slice(0, 100) })), is_anonymous: true })) as TgRes;
  }
  if (!r.ok) return { ok: false, error: r.description ?? "텔레그램 오류" };
  await db().from("daily_cards").update({ status: "posted", posted_at: new Date().toISOString(), message_id: r.result?.message_id ?? null }).eq("id", c.id);
  return { ok: true };
}

export async function postNextCard(kind: Card["kind"]): Promise<string> {
  const { data } = await db().from("daily_cards").select(CARD_COLS).eq("kind", kind).eq("status", "approved").order("sort").order("id").limit(1).maybeSingle();
  const name = kind === "expression" ? "표현 카드" : "참여 투표";
  if (!data) return `승인된 ${name}가 없어요`;
  const r = await postCard(data as Card);
  await logEvent(null, "card", String(data.id), r.ok ? `${name} 올림` : `${name} 실패: ${r.error}`);
  return r.ok ? `${name} 올림(#${data.id})` : `${name} 실패: ${r.error}`;
}

// ───────── Claude 초안 ─────────
const EXPR_SYSTEM = `You create "Expression of the day" (오늘의 표현) cards for a Telegram channel teaching Korean to young people in Uzbekistan preparing for TOPIK and study in Korea (run by STORY Korean, based in Korea).

Each card: one Korean expression that is genuinely useful — TOPIK II idioms/collocations (관용 표현, e.g. 발이 넓다, 눈코 뜰 새 없다, 흥미를 끌다) or, for TOPIK I, natural everyday phrases students use in Korea (dormitory, convenience store, class, part-time job). Korean must be natural and 100% correct, standard spelling and spacing.

Uzbek: Latin script, simple natural local Uzbek (how young Uzbeks write on Telegram), not word-for-word.
Fields:
- expr_ko: the expression (dictionary form for idioms), max 16 chars
- meaning_uz: short meaning, max 45 chars
- meaning_ko: Korean meaning for the owner to check, 1 short sentence
- note_uz: when/how it is used, 1 sentence, max 120 chars
- examples: exactly 2 objects {"ko": short natural sentence max 32 chars, "uz": its Uzbek translation}
- level: "TOPIK I" or "TOPIK II"

Do NOT repeat any expression from the "already used" list. Reply with ONLY a JSON array.`;

const POLL_SYSTEM = `You write engagement polls for a Telegram channel "TOPIK | Koreys Tilli 🇰🇷" for young people in Uzbekistan who learn Korean and dream of studying/living in Korea (run by STORY Korean + STORY CONSULTING, based in Korea).
Good topics: their TOPIK level/goal, hardest TOPIK section (듣기/읽기/쓰기), when they plan to go to Korea, which city/university type, D-4 language course vs D-2 degree, how they study (book, YouTube, course), fun Korea culture choices (food, drama), what content they want next in the channel.
Rules: question in simple natural Uzbek (Latin), max 90 chars, can start with an emoji. 3-5 options, each max 35 chars, each starting with a fitting emoji. No sensitive/political topics. Fun and quick to answer.
Do NOT repeat questions from the "already used" list. Reply with ONLY a JSON array of {"question": "...", "options": ["...", "..."]}.`;

export async function generateCards(kind: Card["kind"], n: number, hint = ""): Promise<{ added: number; error?: string }> {
  if (!hasClaude()) return { added: 0, error: "ANTHROPIC_API_KEY가 없어요 (Vercel 환경변수)" };
  const sb = db();
  const { data: used } = await sb.from("daily_cards").select("expr_ko,question").eq("kind", kind).order("id", { ascending: false }).limit(300);
  const usedList = (used ?? []).map((u) => (kind === "expression" ? u.expr_ko : u.question)).filter(Boolean).join(" | ") || "(none)";
  const user = `Make ${n} items.${hint ? ` Extra request from the owner: ${hint}` : ""}\nAlready used: ${usedList}`;
  try {
    if (kind === "expression") {
      type E = { expr_ko: string; meaning_uz: string; meaning_ko: string; note_uz: string; examples: { ko: string; uz: string }[]; level: string };
      const list = await claudeJSON<E[]>(EXPR_SYSTEM, user, 3000, 90000);
      const rows = list.filter((e) => e.expr_ko && e.meaning_uz).slice(0, n).map((e) => ({
        kind, expr_ko: e.expr_ko.slice(0, 40), meaning_uz: e.meaning_uz.slice(0, 80), meaning_ko: e.meaning_ko ?? null,
        note_uz: e.note_uz?.slice(0, 200) ?? null, level: e.level === "TOPIK I" ? "TOPIK I" : "TOPIK II",
        examples: (e.examples ?? []).slice(0, 2).filter((x) => x?.ko && x?.uz).map((x) => ({ ko: x.ko.slice(0, 60), uz: x.uz.slice(0, 90) })),
      }));
      const { error } = await sb.from("daily_cards").insert(rows);
      return error ? { added: 0, error: "저장 실패 — 0004 SQL을 실행했는지 확인해 주세요" } : { added: rows.length };
    }
    type P = { question: string; options: string[] };
    const list = await claudeJSON<P[]>(POLL_SYSTEM, user, 1500, 60000);
    const rows = list.filter((p) => p.question && p.options?.length >= 2).slice(0, n).map((p) => ({
      kind, question: p.question.slice(0, 200), options: p.options.slice(0, 6).map((o) => o.slice(0, 60)),
    }));
    const { error } = await sb.from("daily_cards").insert(rows);
    return error ? { added: 0, error: "저장 실패 — 0004 SQL을 실행했는지 확인해 주세요" } : { added: rows.length };
  } catch (e) { return { added: 0, error: String(e).slice(0, 120) }; }
}

// 창고가 비어 가면 자동 보충 (매일 소식 모으기 때 같이 실행)
export async function ensureCardStock(): Promise<{ expression: number; poll: number; errors: string[] }> {
  const sb = db();
  const count = async (kind: Card["kind"]) => (await sb.from("daily_cards").select("id", { count: "exact", head: true }).eq("kind", kind).in("status", ["draft", "approved"])).count ?? 0;
  const out = { expression: 0, poll: 0, errors: [] as string[] };
  if ((await count("expression")) < 4) { const r = await generateCards("expression", 7); out.expression = r.added; if (r.error) out.errors.push(r.error); }
  if ((await count("poll")) < 2) { const r = await generateCards("poll", 4); out.poll = r.added; if (r.error) out.errors.push(r.error); }
  return out;
}
