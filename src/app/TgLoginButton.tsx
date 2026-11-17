"use client";
import { useEffect, useRef } from "react";

// 텔레그램 공식 "Log in with Telegram" 버튼 — 누르면 텔레그램 앱에서 확인 → /api/auth/widget 으로 돌아옴
// (BotFather에서 /setdomain 으로 이 사이트 주소를 등록해야 버튼이 보임)
export default function TgLoginButton({ bot }: { bot: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!bot || !box.current || box.current.childElementCount) return;
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.setAttribute("data-telegram-login", bot);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-radius", "8");
    s.setAttribute("data-auth-url", `${location.origin}/api/auth/widget`);
    s.setAttribute("data-request-access", "write");
    box.current.appendChild(s);
  }, [bot]);
  if (!bot) return <p className="muted">봇 아이디(NEXT_PUBLIC_BOT_USERNAME)가 아직 설정되지 않았어요.</p>;
  return <div ref={box} style={{ display: "flex", justifyContent: "center" }} />;
}
