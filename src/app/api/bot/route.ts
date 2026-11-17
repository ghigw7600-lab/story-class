import { NextResponse } from "next/server";
import { tgCall } from "@/lib/tg";
import { webhookSecret } from "@/lib/bot";

// 텔레그램 → 우리 서버 (webhook). 1단계는 /start 에 [수업 홈] 버튼만 보냄.

type Update = { message?: { chat: { id: number; type: string }; text?: string; from?: { language_code?: string } } };

export async function POST(req: Request) {
  if (req.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret()) return NextResponse.json({ ok: false }, { status: 401 });
  const up = (await req.json().catch(() => ({}))) as Update;
  const m = up.message;
  if (m && m.chat.type === "private" && m.text?.startsWith("/start")) {
    const ru = m.from?.language_code === "ru";
    const origin = new URL(req.url).origin;
    await tgCall("sendMessage", {
      chat_id: m.chat.id,
      text: ru
        ? "STORY CONSULTING · TOPIK Online\n\nЗапись в группу, оплата, вход на урок и домашние задания — всё по кнопке ниже."
        : "STORY CONSULTING · TOPIK Online\n\nGuruhga yozilish, to'lov, darsga kirish va uy vazifalari — hammasi pastdagi tugmada.",
      reply_markup: { inline_keyboard: [[{ text: ru ? "📚 Мои уроки" : "📚 Darslarim", web_app: { url: `${origin}/app` } }]] },
    });
  }
  return NextResponse.json({ ok: true });
}
