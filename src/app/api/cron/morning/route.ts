import { NextResponse } from "next/server";
import { postNextCard } from "@/lib/cards";
import { cronOk } from "@/lib/cron";
import { OWNER_IDS } from "@/lib/env";
import { tgCall } from "@/lib/tg";

// 매일 아침(타슈켄트 10시): 오늘의 표현 카드 1장 + 화·금요일엔 참여 투표 1개
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!cronOk(req)) return NextResponse.json({ ok: false, error: "CRON_SECRET이 없거나 맞지 않아요" }, { status: 401 });
  const out = [await postNextCard("expression")];
  const day = new Date(Date.now() + 5 * 3600_000).getUTCDay(); // 타슈켄트(UTC+5) 요일
  if (day === 2 || day === 5) out.push(await postNextCard("poll"));
  // 올릴 게 없었으면 대표에게 알림
  const empty = out.filter((s) => s.startsWith("승인된"));
  if (empty.length) {
    const origin = new URL(req.url).origin;
    await Promise.all(OWNER_IDS.map((id) => tgCall("sendMessage", {
      chat_id: id, text: `🌅 아침 카드: ${empty.join(", ")}. 초안을 확인하고 [승인]해 주세요.`,
      reply_markup: { inline_keyboard: [[{ text: "🌅 아침 카드 확인", web_app: { url: `${origin}/app?to=/admin/cards` } }]] },
    })));
  }
  return NextResponse.json({ ok: true, result: out });
}
