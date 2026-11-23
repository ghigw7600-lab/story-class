import { NextResponse } from "next/server";
import { webhookSecret } from "@/lib/bot";
import { onMessage, onCallback, type Msg, type Cb } from "@/lib/botflow";

// 텔레그램 → 우리 서버 (webhook). 대화 흐름은 src/lib/botflow.ts
// (구독 확인 → 메뉴: 자료·접수 도우미·시험 일정·온라인 수업·상담 / 대표가 보낸 파일 → 도서관 저장)
export const maxDuration = 30;

type Update = { message?: Msg; callback_query?: Cb };

export async function POST(req: Request) {
  if (req.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret()) return NextResponse.json({ ok: false }, { status: 401 });
  const up = (await req.json().catch(() => ({}))) as Update;
  const origin = new URL(req.url).origin;
  try {
    if (up.message) await onMessage(up.message, origin);
    else if (up.callback_query) await onCallback(up.callback_query);
  } catch (e) {
    console.error("[bot]", e); // 텔레그램엔 항상 200 — 아니면 같은 메시지를 계속 다시 보냄
  }
  return NextResponse.json({ ok: true });
}
