import "server-only";
import { db, logEvent } from "./db";
import { tgCall } from "./tg";
import { BOT_USERNAME } from "./env";

// 봇이 글을 올리는 채널 — 환경변수 CHANNEL_ID가 없으면 @storytopik
export const CHANNEL = (process.env.CHANNEL_ID ?? "").trim() || "@storytopik";

export type ChannelPost = {
  id: number; source: string | null; level: string | null; passage: string | null;
  question: string; options: string[]; correct: number;
  explain_short: string | null; explain_full: string | null; sort: number;
  status: "queued" | "posted" | "answered" | "skipped";
  poll_message_id: number | null; posted_at: string | null; answered_at: string | null; created_at: string;
};
export const POST_COLS = "id,source,level,passage,question,options,correct,explain_short,explain_full,sort,status,poll_message_id,posted_at,answered_at,created_at";

export const NUM = ["①", "②", "③", "④"];
const HOUR = 60 * 60 * 1000;

type TgResult = { ok: boolean; description?: string; result?: { message_id?: number } };

// 수업 봇으로 가는 버튼 (정답 글 아래)
const botButton = () => BOT_USERNAME
  ? { reply_markup: { inline_keyboard: [[{ text: "📚 STORY Korean · TOPIK darslari", url: `https://t.me/${BOT_USERNAME}?start=channel` }]] } }
  : {};

// ① 어제 올린 문제의 정답·해설 (문제 메시지에 답장으로)
async function postAnswer(p: ChannelPost): Promise<string> {
  const lines = [
    `✅ Javob · 정답: ${NUM[p.correct] ?? p.correct + 1} ${p.options[p.correct] ?? ""}`,
    p.explain_full ? `\n${p.explain_full}` : "",
    p.source ? `\n📌 ${p.source}` : "",
  ].join("");
  const r = (await tgCall("sendMessage", {
    chat_id: CHANNEL, text: lines,
    ...(p.poll_message_id ? { reply_parameters: { message_id: p.poll_message_id, allow_sending_without_reply: true } } : {}),
    ...botButton(),
  })) as TgResult;
  if (!r.ok) return `정답 글 실패(#${p.id}): ${r.description ?? "알 수 없음"}`;
  await db().from("channel_posts").update({ status: "answered", answered_at: new Date().toISOString(), answer_message_id: r.result?.message_id ?? null }).eq("id", p.id);
  return `정답 글 올림(#${p.id})`;
}

// ② 창고의 다음 문제를 퀴즈로 (지문이 있으면 지문 먼저)
async function postQuiz(p: ChannelPost): Promise<string> {
  let passageId: number | null = null;
  if (p.passage) {
    const head = `📝 ${p.level ? `${p.level} · ` : ""}Bugungi savol · 오늘의 문제`;
    const r = (await tgCall("sendMessage", { chat_id: CHANNEL, text: `${head}\n\n${p.passage}` })) as TgResult;
    if (!r.ok) return `지문 글 실패(#${p.id}): ${r.description ?? "알 수 없음"}`;
    passageId = r.result?.message_id ?? null;
  }
  const r = (await tgCall("sendPoll", {
    chat_id: CHANNEL,
    question: p.question.slice(0, 300),
    options: p.options.slice(0, 10).map((t) => ({ text: t.slice(0, 100) })),
    type: "quiz",
    correct_option_id: p.correct,
    is_anonymous: true,
    ...(p.explain_short ? { explanation: p.explain_short.slice(0, 200) } : {}),
    ...(passageId ? { reply_parameters: { message_id: passageId, allow_sending_without_reply: true } } : {}),
  })) as TgResult;
  if (!r.ok) return `문제 올리기 실패(#${p.id}): ${r.description ?? "알 수 없음"}`;
  await db().from("channel_posts").update({
    status: "posted", posted_at: new Date().toISOString(),
    poll_message_id: r.result?.message_id ?? null, passage_message_id: passageId,
  }).eq("id", p.id);
  return `문제 올림(#${p.id})`;
}

// 하루치 작업. force = 대표가 [지금 올리기]를 눌렀을 때 (시간 간격 검사 안 함)
export async function runDaily(force = false): Promise<string[]> {
  const sb = db();
  const out: string[] = [];
  const now = Date.now();

  // ① 정답: 문제를 올린 지 12시간 넘은 것 (force면 바로)
  const { data: posted } = await sb.from("channel_posts").select(POST_COLS).eq("status", "posted").order("posted_at");
  for (const p of (posted ?? []) as ChannelPost[]) {
    if (!force && p.posted_at && now - Date.parse(p.posted_at) < 12 * HOUR) continue;
    out.push(await postAnswer(p));
  }

  // ② 새 문제: 하루에 한 번만 (cron이 두 번 불려도 20시간 안에 올린 게 있으면 건너뜀)
  if (!force) {
    const { data: last } = await sb.from("channel_posts").select("posted_at").not("posted_at", "is", null).order("posted_at", { ascending: false }).limit(1).maybeSingle();
    if (last?.posted_at && now - Date.parse(last.posted_at) < 20 * HOUR) {
      out.push("오늘 문제는 이미 올렸어요");
      return out;
    }
  }
  const { data: next } = await sb.from("channel_posts").select(POST_COLS).eq("status", "queued").order("sort").order("id").limit(1).maybeSingle();
  if (!next) out.push("창고에 올릴 문제가 없어요 — 관리 화면 [📢 채널]에서 추가해 주세요");
  else out.push(await postQuiz(next as ChannelPost));

  await logEvent(null, "channel", CHANNEL, out.join(" · "));
  return out;
}

// 채널 연결 점검: 봇이 채널 관리자로 글을 쓸 수 있는지
export async function channelCheck(): Promise<{ ok: boolean; title?: string; error?: string }> {
  const chat = (await tgCall("getChat", { chat_id: CHANNEL })) as { ok: boolean; description?: string; result?: { id: number; title?: string } };
  if (!chat.ok || !chat.result) return { ok: false, error: chat.description ?? "채널을 찾지 못했어요" };
  const me = (await tgCall("getMe", {})) as { result?: { id: number } };
  if (!me.result) return { ok: false, title: chat.result.title, error: "봇 정보를 못 읽었어요 (BOT_TOKEN 확인)" };
  const m = (await tgCall("getChatMember", { chat_id: CHANNEL, user_id: me.result.id })) as { ok: boolean; result?: { status: string; can_post_messages?: boolean } };
  const st = m.result?.status;
  if (st === "creator" || (st === "administrator" && m.result?.can_post_messages)) return { ok: true, title: chat.result.title };
  return { ok: false, title: chat.result.title, error: st === "administrator" ? "봇이 관리자지만 '메시지 게시' 권한이 꺼져 있어요" : "봇이 채널 관리자가 아니에요" };
}
