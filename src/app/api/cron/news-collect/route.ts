import { NextResponse } from "next/server";
import { collectNews } from "@/lib/news";
import { cronOk } from "@/lib/cron";
import { OWNER_IDS } from "@/lib/env";
import { tgCall } from "@/lib/tg";

// 매일 아침: 소식을 모아 Claude가 초안을 만들고, 초안이 있으면 대표에게 봇으로 알림
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  if (!cronOk(req)) return NextResponse.json({ ok: false, error: "CRON_SECRET이 없거나 맞지 않아요" }, { status: 401 });
  const r = await collectNews();
  if (r.drafts > 0 || r.errors.length) {
    const origin = new URL(req.url).origin;
    const text = r.drafts > 0
      ? `📰 새 소식 초안 ${r.drafts}개가 왔어요. 확인하고 [승인]을 눌러 주세요.${r.errors.length ? `\n(오류 ${r.errors.length}건)` : ""}`
      : `📰 소식 모으기 오류: ${r.errors.slice(0, 3).join(" / ")}`;
    await Promise.all(OWNER_IDS.map((id) => tgCall("sendMessage", {
      chat_id: id, text,
      reply_markup: { inline_keyboard: [[{ text: "📰 소식 확인", web_app: { url: `${origin}/app?to=/admin/news` } }]] },
    })));
  }
  return NextResponse.json({ ok: true, ...r });
}
