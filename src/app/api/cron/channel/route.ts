import { NextResponse } from "next/server";
import { runDaily } from "@/lib/channel";
import { cronOk } from "@/lib/cron";

// Vercel 예약 실행(vercel.json crons)이 매일 부르는 주소 — 오늘의 문제 + 어제 정답
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!cronOk(req)) return NextResponse.json({ ok: false, error: "CRON_SECRET이 없거나 맞지 않아요" }, { status: 401 });
  return NextResponse.json({ ok: true, result: await runDaily(false) });
}
