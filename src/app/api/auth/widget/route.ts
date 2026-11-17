import { NextResponse } from "next/server";
import { verifyLoginWidget } from "@/lib/tg";
import { startSession } from "@/lib/session";
import { isOwnerId } from "@/lib/env";

// 브라우저 "텔레그램으로 로그인" 버튼이 돌아오는 곳
export async function GET(req: Request) {
  const url = new URL(req.url);
  const u = verifyLoginWidget(Object.fromEntries(url.searchParams.entries()));
  if (!u) return NextResponse.redirect(new URL("/?e=1", url));
  await startSession(u);
  return NextResponse.redirect(new URL(isOwnerId(u.id) ? "/admin" : "/home", url));
}
