"use client";
import Script from "next/script";
import { useState } from "react";

type TgWebApp = { openLink?: (url: string) => void; initData?: string };
const tg = () => (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp;

// [수업 들어가기]: 서버에서 출석을 남기고 Zoom 주소를 받은 뒤
// 텔레그램 미니앱이면 텔레그램 밖(폰 브라우저 → Zoom 앱)으로 연다.
// (미니앱 안에서 바로 열면 zoommtg:// 주소를 못 열어 ERR_UNKNOWN_URL_SCHEME)
export default function JoinButton({ id, label, className }: { id: string; label: string; className?: string }) {
  const [busy, setBusy] = useState(false);
  async function go(e: React.MouseEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch(`/join/${id}?json=1`, { cache: "no-store" });
      const j = (await r.json()) as { url?: string; go?: string };
      if (j.url) {
        const w = tg();
        if (w?.openLink && w.initData) w.openLink(j.url);
        else window.location.href = j.url;
      } else if (j.go) window.location.href = j.go;
    } catch {
      window.location.href = `/join/${id}`;
    } finally {
      setTimeout(() => setBusy(false), 1500);
    }
  }
  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
      <a className={className} href={`/join/${id}`} onClick={go} aria-busy={busy}>
        {busy ? "…" : label}
      </a>
    </>
  );
}
