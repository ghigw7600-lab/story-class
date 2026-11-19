import { NextResponse } from "next/server";
import { runDaily } from "@/lib/channel";

// Vercel 예약 실행(vercel.json crons)이 매일 부르는 주소.
// Vercel 환경변수 CRON_SECRET 을 넣어 두면 Vercel이 "Authorization: Bearer <값>"을 붙여 보냄 → 그 값이 맞을 때만 실행.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET이 없거나 맞지 않아요" }, { status: 401 });
  }
  const result = await runDaily(false);
  return NextResponse.json({ ok: true, result });
}
