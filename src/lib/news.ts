import "server-only";
import { db, logEvent } from "./db";
import { tgCall } from "./tg";
import { BOT_USERNAME } from "./env";
import { CHANNEL, SIGN } from "./channel";
import { claudeJSON, hasClaude } from "./claude";
export { hasClaude };

// ───────── 설정 ─────────
export const CONSULT_BOT = ((process.env.CONSULT_BOT_USERNAME ?? "").trim() || "storyconsulting_bot").replace(/^@/, "");
const MAX_PER_RUN = 12;            // 한 번 모을 때 Claude에게 보내는 최대 글 수 (비용 상한)
const MAX_AGE_DAYS = 4;            // 이보다 오래된 글은 안 가져옴

export type NewsItem = {
  id: number; url: string; title: string | null; snippet: string | null; source_name: string | null;
  published_at: string | null; status: "draft" | "approved" | "posted" | "rejected" | "ignored";
  kind: string | null; cta: "class" | "consult"; title_ko: string | null; summary_ko: string | null;
  title_uz: string | null; body_uz: string | null; posted_at: string | null; created_at: string;
};
export const NEWS_COLS = "id,url,title,snippet,source_name,published_at,status,kind,cta,title_ko,summary_ko,title_uz,body_uz,posted_at,created_at";

// ───────── RSS 읽기 (RSS 2.0 · Atom 기본만) ─────────
const unescape = (s: string) => s
  .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, "&");
// CDATA 벗기기 → 글자 되돌리기 → 태그 지우기 → 한 번 더 (구글 뉴스는 태그가 이중으로 감싸져 옴)
const decode = (s: string) => unescape(unescape(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")).replace(/<[^>]+>/g, " "))
  .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const tag = (block: string, name: string) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
};

type FeedEntry = { url: string; title: string; snippet: string; source: string; published: Date | null };

export function parseFeed(xml: string): FeedEntry[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  return blocks.map((b) => {
    let url = tag(b, "link");
    if (!url) url = (b.match(/<link[^>]*href="([^"]+)"/i) ?? [])[1] ?? "";
    let title = tag(b, "title");
    let source = tag(b, "source");
    // 구글 뉴스 제목은 "제목 - 언론사" 모양
    if (!source && / - [^-]+$/.test(title)) { source = title.replace(/^.* - /, ""); }
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    const snippet = tag(b, "description") || tag(b, "summary") || tag(b, "content");
    const d = tag(b, "pubDate") || tag(b, "published") || tag(b, "updated");
    const published = d && !Number.isNaN(Date.parse(d)) ? new Date(d) : null;
    // 요약 칸이 "제목 + 언론사"뿐이면 제목만 있는 글로 봄
    const bare = snippet.replace(source, "").replace(/\s+/g, " ").trim();
    return { url: url.trim(), title, snippet: !bare || bare === title ? "" : snippet.slice(0, 1500), source, published };
  }).filter((e) => /^https?:\/\//.test(e.url) && e.title);
}

async function fetchText(url: string, ms = 8000) {
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (STORY Korean news bot)" }, signal: AbortSignal.timeout(ms), redirect: "follow" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.text();
}

// ───────── Claude 요약 ─────────
const SYSTEM = `You write short posts for a Telegram channel "TOPIK | Koreys Tilli 🇰🇷" run by STORY Korean (online TOPIK classes) and STORY CONSULTING (a Korea-based study-abroad agency). Readers: young people in Uzbekistan who want to study and live in Korea.

Decide if the news item is useful for them: TOPIK exam (dates, registration, results, changes), Korean study visas (D-2, D-4), international student policy, scholarships (GKS etc.), university admission for foreigners, life/work rules for international students in Korea, Korean language learning. Not useful: unrelated politics, crime, local news, ads, items only about other countries' students with no general lesson.

STRICT RULES
- Use ONLY facts written in the given text. Never add dates, numbers, names or rules that are not in the text. If the text is only a headline, write a short teaser of what the headline says and tell readers to open the link — do not guess details.
- Do not copy sentences from the article; rewrite briefly in your own words.
- Uzbek: Latin script, simple everyday standard Uzbek as locals write it on Telegram (natural local phrasing, not word-for-word translation). Short: title max 70 characters, body 2-4 short sentences, max 350 characters. You may use 1-2 emoji. Useful local words: "qabullar ochiq", "talablar", "grant", "til o'rgatish markazi", "viza cho'zdirish", "asqotadi", "Xullas, ...".
- If the text has concrete numbers (how many students, wages, scholarship amounts, dates), put the most striking number in the title — readers react most to concrete figures. Only numbers from the text.
- No exaggeration, no promises.

Reply with ONLY a JSON object, no other text:
{"relevant": true|false, "kind": "topik"|"visa"|"study"|"culture", "cta": "class"|"consult", "title_ko": "...", "summary_ko": "대표 확인용 한국어 2~3문장", "title_uz": "...", "body_uz": "..."}
cta: "class" for TOPIK/Korean-language topics, "consult" for visa/admission/scholarship/student-life topics. If not relevant, still fill title_ko and summary_ko briefly and leave the uz fields empty.`;

type Draft = { relevant: boolean; kind?: string; cta?: string; title_ko?: string; summary_ko?: string; title_uz?: string; body_uz?: string };

async function askClaude(e: { title: string; snippet: string; source: string; url: string; published?: string }): Promise<Draft> {
  const user = `Source: ${e.source || "-"}\nDate: ${e.published ?? "-"}\nURL: ${e.url}\nTitle: ${e.title}\nText: ${e.snippet || "(headline only)"}`;
  return claudeJSON<Draft>(SYSTEM, user);
}

const draftFields = (d: Draft) => ({
  status: d.relevant && d.title_uz && d.body_uz ? "draft" : "ignored",
  kind: ["topik", "visa", "study", "culture"].includes(d.kind ?? "") ? d.kind : null,
  cta: d.cta === "consult" ? "consult" : "class",
  title_ko: d.title_ko ?? null, summary_ko: d.summary_ko ?? null,
  title_uz: d.title_uz?.slice(0, 120) || null, body_uz: d.body_uz?.slice(0, 700) || null,
});

// 여러 개를 한 번에 4개씩
async function inBatches<T>(list: T[], size: number, fn: (x: T) => Promise<void>) {
  for (let i = 0; i < list.length; i += size) await Promise.all(list.slice(i, i + size).map(fn));
}

// ───────── ① 모으기: RSS → 새 글만 → Claude 초안 ─────────
export async function collectNews(): Promise<{ drafts: number; ignored: number; errors: string[] }> {
  const sb = db();
  const errors: string[] = [];
  if (!hasClaude()) return { drafts: 0, ignored: 0, errors: ["ANTHROPIC_API_KEY가 없어서 요약을 못 해요 (Vercel 환경변수)"] };
  const { data: sources } = await sb.from("news_sources").select("id,name,url").eq("active", true);
  const fresh: (FeedEntry & { source_id: number })[] = [];
  const cutoff = Date.now() - MAX_AGE_DAYS * 86400000;
  await Promise.all((sources ?? []).map(async (s) => {
    try {
      const items = parseFeed(await fetchText(s.url));
      items.filter((e) => !e.published || e.published.getTime() > cutoff).forEach((e) => fresh.push({ ...e, source_id: s.id }));
    } catch (e) { errors.push(`${s.name}: ${String(e).slice(0, 80)}`); }
  }));
  // 이미 가져온 글 빼기
  const urls = [...new Set(fresh.map((e) => e.url))];
  const seen = new Set<string>();
  for (let i = 0; i < urls.length; i += 100) {
    const { data } = await sb.from("news_items").select("url").in("url", urls.slice(i, i + 100));
    (data ?? []).forEach((r) => seen.add(r.url));
  }
  // 제목이 같은 글(여러 언론사 같은 보도)도 하나만
  const titles = new Set<string>();
  const todo = fresh
    .filter((e) => !seen.has(e.url))
    .sort((a, b) => (b.published?.getTime() ?? 0) - (a.published?.getTime() ?? 0))
    .filter((e) => { const k = e.title.replace(/\s+/g, "").slice(0, 30); if (titles.has(k)) return false; titles.add(k); return true; })
    .slice(0, MAX_PER_RUN);

  let drafts = 0, ignored = 0;
  await inBatches(todo, 4, async (e) => {
    try {
      const d = await askClaude({ title: e.title, snippet: e.snippet, source: e.source, url: e.url, published: e.published?.toISOString() });
      const f = draftFields(d);
      const { error } = await sb.from("news_items").insert({
        source_id: e.source_id, url: e.url, title: e.title, snippet: e.snippet || null, source_name: e.source || null,
        published_at: e.published?.toISOString() ?? null, ...f,
      });
      if (!error) { if (f.status === "draft") drafts++; else ignored++; }
    } catch (err) { errors.push(`요약 실패: ${e.title.slice(0, 30)} (${String(err).slice(0, 60)})`); }
  });
  await logEvent(null, "news", "collect", `초안 ${drafts} · 관련없음 ${ignored} · 오류 ${errors.length}`);
  return { drafts, ignored, errors };
}

// 대표가 직접 링크(+본문)를 넣어 초안 만들기 — TOPIK 공식 공지 등 RSS가 없는 곳
export async function draftFromLink(url: string, pasted: string): Promise<{ ok: boolean; error?: string }> {
  let title = "", text = pasted;
  if (!pasted) {
    try {
      const html = await fetchText(url, 10000);
      title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) ?? [])[1] ?? "");
      const body = html.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ");
      text = decode(body).slice(0, 6000);
    } catch (e) { return { ok: false, error: `페이지를 못 읽었어요 (${String(e).slice(0, 60)}) — 본문을 복사해 붙여 넣어 주세요` }; }
  }
  try {
    const d = await askClaude({ title: title || "(대표가 넣은 글)", snippet: text.slice(0, 6000), source: new URL(url).hostname, url });
    const f = draftFields({ ...d, relevant: true });
    if (!f.title_uz) return { ok: false, error: "요약을 못 만들었어요 — 본문을 붙여 넣고 다시 해 주세요" };
    const { error } = await db().from("news_items").upsert({ url, title: title || d.title_ko || null, snippet: text.slice(0, 1500) || null, source_name: new URL(url).hostname, ...f, status: "draft" }, { onConflict: "url" });
    return error ? { ok: false, error: "저장 실패 — 0003 SQL을 실행했는지 확인해 주세요" } : { ok: true };
  } catch (e) { return { ok: false, error: String(e).slice(0, 100) }; }
}

// ───────── ② 올리기 ─────────
export async function postNews(n: NewsItem): Promise<{ ok: boolean; error?: string }> {
  const text = `📰 ${n.title_uz ?? ""}\n\n${n.body_uz ?? ""}${n.source_name ? `\n\n🔗 Manba: ${n.source_name}` : ""}${SIGN}`;
  const cta = n.cta === "consult"
    ? { text: "🎓 STORY CONSULTING · bepul konsultatsiya", url: `https://t.me/${CONSULT_BOT}?start=channel` }
    : BOT_USERNAME ? { text: "📚 STORY Korean · TOPIK darslari", url: `https://t.me/${BOT_USERNAME}?start=channel` } : null;
  const r = (await tgCall("sendMessage", {
    chat_id: CHANNEL, text, link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: [[{ text: "📖 Batafsil · 원문", url: n.url }], ...(cta ? [[cta]] : [])] },
  })) as { ok: boolean; description?: string; result?: { message_id?: number } };
  if (!r.ok) return { ok: false, error: r.description ?? "텔레그램 오류" };
  await db().from("news_items").update({ status: "posted", posted_at: new Date().toISOString(), message_id: r.result?.message_id ?? null }).eq("id", n.id);
  return { ok: true };
}

// 예약 실행: 승인된 소식 중 가장 오래된 것 1개
export async function postNextApproved(): Promise<string> {
  const { data } = await db().from("news_items").select(NEWS_COLS).eq("status", "approved").order("created_at").limit(1).maybeSingle();
  if (!data) return "승인된 소식이 없어요";
  const r = await postNews(data as NewsItem);
  await logEvent(null, "news", String(data.id), r.ok ? "소식 올림" : `소식 올리기 실패: ${r.error}`);
  return r.ok ? `소식 올림(#${data.id})` : `실패: ${r.error}`;
}
