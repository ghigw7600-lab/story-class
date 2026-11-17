import { NextResponse } from "next/server";
import { getMe } from "@/lib/session";
import { tgCall } from "@/lib/tg";
import { webhookSecret } from "@/lib/bot";

// 대표가 한 번 여는 주소: /api/bot/setup — 봇이 이 사이트로 메시지를 보내게 연결 + 왼쪽 아래 메뉴 버튼
export async function GET(req: Request) {
  const me = await getMe();
  if (me?.role !== "owner") return NextResponse.json({ ok: false, error: "대표만 할 수 있어요 — 먼저 로그인" }, { status: 403 });
  const origin = new URL(req.url).origin;
  const hook = await tgCall("setWebhook", { url: `${origin}/api/bot`, secret_token: webhookSecret(), allowed_updates: ["message"], drop_pending_updates: true });
  const menu = await tgCall("setChatMenuButton", { menu_button: { type: "web_app", text: "📚 Darslar", web_app: { url: `${origin}/app` } } });
  const cmds = await tgCall("setMyCommands", { commands: [{ command: "start", description: "Boshlash · Начать" }] });
  return NextResponse.json({ webhook: hook, menu, commands: cmds, origin });
}
