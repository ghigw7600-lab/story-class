import { NextResponse } from "next/server";
import { collectNews, hasClaude } from "@/lib/news";
import { ensureCardStock } from "@/lib/cards";
import { cronOk } from "@/lib/cron";
import { OWNER_IDS } from "@/lib/env";
import { tgCall } from "@/lib/tg";

// 매일 낮(한국 12시): 소식을 모아 Claude가 초안을 만들고, 아침 카드 창고도 채우고, 초안이 있으면 대표에게 봇으로 알림
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  if (!cronOk(req)) return NextResponse.json({ ok: false, error: "CRON_SECRET이 없거나 맞지 않아요" }, { status: 401 });
  // API 키가 없으면 조용히 쉼 (대표가 키 없이 운영 중 — 매일 오류 알림 보내지 않음)
  if (!hasClaude()) return NextResponse.json({ ok: true, skipped: "ANTHROPIC_API_KEY 없음 — 소식·카드 자동 초안 쉼" });
  const [r, cards] = await Promise.all([collectNews(), ensureCardStock()]);
  const origin = new URL(req.url).origin;
  if (cards.expression || cards.poll) {
    await Promise.all(OWNER_IDS.map((id) => tgCall("sendMessage", {
      chat_id: id, text: `🌅 아침 카드 창고가 비어 가서 Claude가 초안을 채웠어요 (표현 ${cards.expression}장 · 투표 ${cards.poll}개). 확인하고 [승인]해 주세요.`,
      reply_markup: { inline_keyboard: [[{ text: "🌅 아침 카드 확인", web_app: { url: `${origin}/app?to=/admin/cards` } }]] },
    })));
  }
  if (r.drafts > 0 || r.errors.length) {
    const text = r.drafts > 0
      ? `📰 새 소식 초안 ${r.drafts}개가 왔어요. 확인하고 [승인]을 눌러 주세요.${r.errors.length ? `\n(오류 ${r.errors.length}건)` : ""}`
      : `📰 소식 모으기 오류: ${r.errors.slice(0, 3).join(" / ")}`;
    await Promise.all(OWNER_IDS.map((id) => tgCall("sendMessage", {
      chat_id: id, text,
      reply_markup: { inline_keyboard: [[{ text: "📰 소식 확인", web_app: { url: `${origin}/app?to=/admin/news` } }]] },
    })));
  }
  return NextResponse.json({ ok: true, ...r, cards });
}
