"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// 대표 화면 위쪽: 1줄 = 이름·로그아웃 / 2줄 = 아이콘 탭 (휴대폰에서 한 줄로 보이고, 좁으면 옆으로 밀어 봄)
const TABS: { href: string; icon: string; label: string; plain?: boolean }[] = [
  { href: "/admin", icon: "🏠", label: "홈" },
  { href: "/admin/channel", icon: "📢", label: "퀴즈" },
  { href: "/admin/cards", icon: "🌅", label: "카드" },
  { href: "/admin/news", icon: "📰", label: "소식" },
  { href: "/admin/exams", icon: "📅", label: "시험" },
  { href: "/admin/library", icon: "📦", label: "자료" },
  { href: "/api/bot/setup", icon: "🤖", label: "봇 연결", plain: true },
  { href: "/home", icon: "👀", label: "학생 화면" },
];

export default function AdminTop() {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === "/admin" || path.startsWith("/admin/class") : path.startsWith(href));
  return (
    <header className="atop">
      <div className="atop-row">
        <Link href="/admin" className="atop-brand">STORY Korean <span>· 관리</span></Link>
        <form action="/api/auth/logout" method="post"><button className="atop-out">로그아웃</button></form>
      </div>
      <nav className="atop-tabs">
        {TABS.map((t) => {
          const cls = `atop-tab${active(t.href) ? " on" : ""}`;
          const inner = (<><span className="i">{t.icon}</span><span className="l">{t.label}</span></>);
          return t.plain
            ? <a key={t.href} href={t.href} className={cls}>{inner}</a>
            : <Link key={t.href} href={t.href} className={cls}>{inner}</Link>;
        })}
      </nav>
    </header>
  );
}
