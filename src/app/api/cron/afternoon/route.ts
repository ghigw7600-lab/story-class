import { NextResponse } from "next/server";
import { runAfternoon } from "@/lib/autopilot";
import { cronOk } from "@/lib/cron";

// 매일 타슈켄트 14시: 월·수·금 쓰기 연습(+지난 정답) · 화·목·토 어휘·문법 팁 · 시험 당일 실시간 글
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!cronOk(req)) return NextResponse.json({ ok: false, error: "CRON_SECRET이 없거나 맞지 않아요" }, { status: 401 });
  return NextResponse.json({ ok: true, result: await runAfternoon() });
}
