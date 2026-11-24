import { NextResponse } from "next/server";
import { runEvening } from "@/lib/autopilot";
import { cronOk } from "@/lib/cron";

// 매일 타슈켄트 20시: 참여 질문 · 화 자료 소개 · 목 수업 모집 · 첫 토요일 유학 상담 · 시험 당일 글
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!cronOk(req)) return NextResponse.json({ ok: false, error: "CRON_SECRET이 없거나 맞지 않아요" }, { status: 401 });
  return NextResponse.json({ ok: true, result: await runEvening() });
}
