"use client";
import Script from "next/script";
import { useState } from "react";

type TgWebApp = { initData: string; ready: () => void; expand: () => void };

export default function MiniAppLogin({ to }: { to: string }) {
  const [err, setErr] = useState("");
  async function go() {
    const wa = (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp;
    if (!wa?.initData) { setErr("Telegram ichida oching · Откройте в Telegram (텔레그램 봇에서 열어 주세요)"); return; }
    wa.ready(); wa.expand();
    const r = await fetch("/api/auth/tg", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ initData: wa.initData }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) { setErr(j.error ?? "Xatolik · Ошибка"); return; }
    location.replace(to || (j.role === "owner" ? "/admin" : "/home"));
  }
  return (
    <div className="wrap" style={{ textAlign: "center", paddingTop: 64 }}>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" onReady={() => { void go(); }} />
      {err ? <div className="notice err">{err}</div> : <p className="muted">Yuklanmoqda… · Загрузка…</p>}
    </div>
  );
}
