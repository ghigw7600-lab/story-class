import { NextResponse } from "next/server";
import { postNextApproved } from "@/lib/news";
import { cronOk } from "@/lib/cron";

// 매일 낮: 승인된 소식 1개를 채널에 올림
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!cronOk(req)) return NextResponse.json({ ok: false, error: "CRON_SECRET이 없거나 맞지 않아요" }, { status: 401 });
  return NextResponse.json({ ok: true, result: await postNextApproved() });
}
