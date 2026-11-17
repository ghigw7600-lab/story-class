import { NextResponse } from "next/server";
import { verifyInitData } from "@/lib/tg";
import { startSession } from "@/lib/session";
import { isOwnerId } from "@/lib/env";

// 미니앱 자동 로그인: initData 서명 확인 → 로그인 쿠키
export async function POST(req: Request) {
  const { initData } = await req.json().catch(() => ({ initData: "" }));
  const u = verifyInitData(String(initData ?? ""));
  if (!u) return NextResponse.json({ ok: false, error: "Telegram tasdiqlanmadi · Не удалось подтвердить Telegram" }, { status: 401 });
  try {
    await startSession(u);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String((e as Error).message) }, { status: 500 });
  }
  return NextResponse.json({ ok: true, role: isOwnerId(u.id) ? "owner" : "student" });
}
