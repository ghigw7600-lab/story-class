import "server-only";
import { ImageResponse } from "next/og";
import { db, logEvent } from "./db";
import { tgCall } from "./tg";
import { BOT_USERNAME } from "./env";
import { CHANNEL, SIGN } from "./channel";
import { font, div, sendPhoto, NAVY, RED, BLUE, SKY } from "./cards";
import { EXAM_COLS, uzDate, type ExamEvent } from "./exams";

// 채널 맨 위에 고정할 "TOPIK 일정표 (우즈베키스탄)" 카드 — [📅 시험]의 일정에서 자동으로 그림
// 그림: RASMIY(공식 확인) / TAXMINIY(예상) 글자 배지 — 그림 안 이모지는 외부에서 받아야 해서 안 씀. 캡션은 ✅ / ⏳.

const WEEK = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];
const wd = (d: string) => WEEK[new Date(`${d}T00:00:00Z`).getUTCDay()];

export async function scheduleEvents(year: number): Promise<ExamEvent[]> {
  const { data } = await db().from("exam_events").select(EXAM_COLS).eq("active", true)
    .gte("exam_date", `${year}-01-01`).lte("exam_date", `${year}-12-31`).order("exam_date");
  return (data ?? []) as ExamEvent[];
}

export async function renderSchedule(year: number, events: ExamEvent[]): Promise<ArrayBuffer> {
  const rows = events.slice(0, 10);
  const H = 1350;
  const TITLE = `TOPIK ${year}`, SUB = "O‘zbekistonda imtihon jadvali", HEAD = ["Imtihon", "Sana", "Natija"];
  const NOTE = "TAXMINIY — rasmiy e’lon chiqqach yangilanadi";
  const lines = rows.map((e) => ({
    name: e.name.replace(/-TOPIK/, " TOPIK"), date: `${uzDate(e.exam_date)}, ${wd(e.exam_date)}`,
    result: e.result_date ? uzDate(e.result_date) : "—", ok: e.confirmed,
  }));
  const all = [TITLE, SUB, NOTE, ...HEAD, "RASMIYTAXMINIY", CHANNEL, "STORY Korean · TOPIK Online", "Ro‘yxatdan o‘tish: topiktashkec.uz", ...lines.flatMap((l) => [l.name, l.date, l.result])].join("");
  const [bold, black] = await Promise.all([font(all, 700), font(all, 900)]);
  const rowH = rows.length > 8 ? 74 : 86;

  const tree = div({ width: 1080, height: H, flexDirection: "column", padding: "64px 64px 56px", background: `linear-gradient(160deg, #2c2c7c 0%, ${NAVY} 50%, #141440 100%)`, color: "#fff", fontFamily: "NotoKR" },
    div({ alignItems: "center", gap: 14, fontSize: 30, fontWeight: 700, color: "#dfe6ff" },
      div({ width: 14, height: 14, borderRadius: 7, background: RED }), div({ width: 14, height: 14, borderRadius: 7, background: BLUE, marginLeft: -6 }), "STORY Korean"),
    div({ marginTop: 18, fontSize: 104, fontWeight: 900, letterSpacing: -2 }, TITLE),
    div({ fontSize: 44, fontWeight: 700, color: SKY, marginTop: 4 }, SUB),
    div({ marginTop: 28, gap: 0 }, div({ width: 90, height: 8, background: RED, borderRadius: 4 }), div({ width: 90, height: 8, background: BLUE, borderRadius: 4 })),
    // 표
    div({ marginTop: 34, flexDirection: "column", borderRadius: 28, background: "rgba(255,255,255,0.07)", padding: "14px 30px" },
      div({ height: 60, alignItems: "center", fontSize: 26, fontWeight: 700, color: "#aab4e6", borderBottom: "2px solid rgba(255,255,255,0.12)" },
        div({ width: 300 }, HEAD[0]), div({ flexGrow: 1 }, HEAD[1]), div({ width: 170, justifyContent: "flex-end" }, HEAD[2])),
      ...lines.map((l, i) => div({ height: rowH, alignItems: "center", fontSize: 34, fontWeight: 700, borderBottom: i < lines.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none" },
        div({ width: 300, flexDirection: "column", justifyContent: "center", gap: 4 },
          div({ fontWeight: 900 }, l.name),
          div({ fontSize: 17, fontWeight: 700, letterSpacing: 1, color: l.ok ? "#7ee2a8" : "#ffc96b" }, l.ok ? "RASMIY" : "TAXMINIY")),
        div({ flexGrow: 1, color: "#fff" }, l.date),
        div({ width: 170, justifyContent: "flex-end", fontSize: 28, color: "#c3ccf5" }, l.result)))),
    div({ flexGrow: 1 }),
    lines.some((l) => !l.ok) ? div({ fontSize: 26, fontWeight: 700, color: "#ffc96b" }, NOTE) : div({}),
    div({ fontSize: 26, fontWeight: 700, color: "#c3ccf5", marginTop: 6 }, "Ro‘yxatdan o‘tish: topiktashkec.uz"),
    div({ marginTop: 26, justifyContent: "space-between", fontSize: 30, fontWeight: 700 }, div({}, CHANNEL), div({ color: "#aab4e6" }, "STORY Korean · TOPIK Online")),
  );
  const res = new ImageResponse(tree, { width: 1080, height: H, fonts: [{ name: "NotoKR", data: bold, weight: 700 }, { name: "NotoKR", data: black, weight: 900 }] });
  return res.arrayBuffer();
}

export function scheduleCaption(year: number, events: ExamEvent[]) {
  const list = events.map((e) => `${e.confirmed ? "✅" : "⏳"} ${e.name} — ${uzDate(e.exam_date)} (${wd(e.exam_date)})${e.result_date ? ` · natija ${uzDate(e.result_date)}` : ""}`).join("\n");
  const anyGuess = events.some((e) => !e.confirmed);
  return [
    `📅 TOPIK ${year} — O‘zbekistonda imtihon jadvali`,
    "",
    list,
    "",
    anyGuess ? "⏳ — taxminiy sana (Koreya Ta’lim vazirligining yillik rejasi asosida). Rasmiy e’lon chiqishi bilan shu yerda yangilaymiz." : "",
    "📝 Ro‘yxatdan o‘tish: topiktashkec.uz",
    "Ro‘yxatdan o‘tishda yordam kerakmi? Botimizga yozing 👇",
    SIGN,
  ].filter((x, i, a) => x !== "" || a[i - 1] !== "").join("\n").slice(0, 1024);
}

// 채널에 올리고, 가능하면 맨 위에 고정
export async function postSchedule(year: number): Promise<{ ok: boolean; msg: string }> {
  const events = await scheduleEvents(year);
  if (!events.length) return { ok: false, msg: `${year}년 시험이 없어요 — [📅 시험]에 먼저 넣어 주세요` };
  let png: ArrayBuffer;
  try { png = await renderSchedule(year, events); } catch (e) { return { ok: false, msg: `그림 실패: ${String(e).slice(0, 80)}` }; }
  const kb = BOT_USERNAME ? { inline_keyboard: [[{ text: "📝 Ro‘yxatdan o‘tish yordami", url: `https://t.me/${BOT_USERNAME}?start=reg` }]] } : undefined;
  const r = await sendPhoto(png, scheduleCaption(year, events), kb);
  if (!r.ok || !r.result?.message_id) return { ok: false, msg: `올리기 실패: ${r.description ?? "알 수 없음"}` };
  const pin = (await tgCall("pinChatMessage", { chat_id: CHANNEL, message_id: r.result.message_id, disable_notification: true })) as { ok: boolean; description?: string };
  await logEvent(null, "schedule", String(year), pin.ok ? "일정표 올림·고정" : `일정표 올림(고정 실패: ${pin.description})`);
  return { ok: true, msg: pin.ok ? "일정표를 올리고 채널 맨 위에 고정했어요." : `일정표는 올렸지만 고정은 못 했어요(${pin.description ?? "권한"}) — 채널에서 글을 길게 눌러 [고정]해 주세요.` };
}
