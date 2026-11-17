import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import { BOT_USERNAME } from "@/lib/env";
import TgLoginButton from "./TgLoginButton";

// 첫 화면 — 로그인돼 있으면 바로 내 화면으로. 아니면 봇 열기 / 텔레그램 로그인 버튼(컴퓨터용)
export default async function Landing({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const me = await getMe();
  if (me) redirect(me.role === "owner" ? "/admin" : "/home");
  const { e } = await searchParams;
  return (
    <>
      <div className="top"><b>STORY CONSULTING</b><span className="grow" /><span>TOPIK Online</span></div>
      <div className="wrap" style={{ textAlign: "center", paddingTop: 48 }}>
        <h1>TOPIK Online</h1>
        <p className="muted">Telegram orqali kiring · Войдите через Telegram · 텔레그램으로 로그인</p>
        {e && <div className="notice err">Telegram tasdiqlanmadi. Qaytadan urinib ko&apos;ring. (로그인 확인 실패 — 다시 시도)</div>}
        {BOT_USERNAME && (
          <p><a className="btn primary big" href={`https://t.me/${BOT_USERNAME}?start=class`}>Botni ochish · Открыть бот</a></p>
        )}
        <div style={{ marginTop: 24 }}>
          <TgLoginButton bot={BOT_USERNAME} />
        </div>
        <p className="muted" style={{ marginTop: 24 }}>컴퓨터에서는 아래 버튼 · 폰에서는 봇에서 [수업 홈]을 누르면 자동으로 들어와요.</p>
      </div>
    </>
  );
}
