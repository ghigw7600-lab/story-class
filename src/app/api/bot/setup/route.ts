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
  const ok = hook.ok && menu.ok;
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<body style="font-family:sans-serif;padding:24px;line-height:1.6">
<h2>${ok ? "✅ 봇 연결 완료" : "❌ 봇 연결 실패"}</h2>
<p>${ok ? "이제 봇에서 /start 를 누르면 [📚 Darslarim] 버튼이 와요. 왼쪽 아래 메뉴 버튼도 바뀌었어요 (텔레그램을 껐다 켜면 보여요)." : "BOT_TOKEN 환경변수를 확인해 주세요. 아래 내용을 캡처해서 보내 주세요."}</p>
<p style="color:#888;font-size:13px">주소: ${origin}<br>webhook: ${hook.ok ? "ok" : String(hook.description ?? "실패")} · 메뉴: ${menu.ok ? "ok" : String(menu.description ?? "실패")} · 명령어: ${cmds.ok ? "ok" : "실패"}</p>
<p><a href="/admin">← 관리 화면으로</a></p></body>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
